// controllers/itemRequestController.js
'use strict';

const db = require('../models');
const { 
  ItemRequest, 
  ItemRequestDetail, 
  Store, 
  Item, 
  UOM, 
  User,
  StoreBalance,
  RequestNotification,
  StoreGroupRelation,
  Group
} = db;
const { Op } = require('sequelize');

// ================================================================
// HELPER: Skip stock validation for specific stores
// ================================================================
const STOCK_VALIDATION_SKIP_STORES = ['STORE-006', 'STORE-007'];
const SKIP_NOTIFICATION_STORES = ['STORE-006', 'STORE-007'];

const shouldSkipStockValidation = (storeCode) => {
  return STOCK_VALIDATION_SKIP_STORES.includes(storeCode);
};

const shouldSkipNotifications = (storeCode) => {
  return SKIP_NOTIFICATION_STORES.includes(storeCode);
};

// ================================================================
// HELPER: Validate stock availability
// ================================================================
const validateStockAvailability = async (supplyingStoreId, items) => {
  const errors = [];
  const stockInfo = [];

  const store = await Store.findByPk(supplyingStoreId);
  if (!store) {
    return {
      isValid: false,
      errors: [{ message: 'Store not found' }],
      stockInfo: []
    };
  }

  if (shouldSkipStockValidation(store.code)) {
    console.log(`⚠️ Skipping stock validation for store: ${store.code} (${store.name})`);
    
    for (const item of items) {
      const itemRecord = await Item.findByPk(item.itemId, {
        include: [{ model: UOM, as: 'uom' }]
      });
      
      if (!itemRecord) {
        errors.push({
          itemId: item.itemId,
          requestedQuantity: item.quantity,
          message: `Item with ID ${item.itemId} not found`
        });
        continue;
      }
      
      stockInfo.push({
        itemId: item.itemId,
        itemName: itemRecord.name,
        itemCode: itemRecord.code,
        uomCode: itemRecord.uom?.code || 'Units',
        availableQuantity: Number.MAX_SAFE_INTEGER,
        requestedQuantity: item.quantity,
        balance: null,
        stockValidationSkipped: true,
        skipReason: `Store ${store.code} is exempt from stock validation`
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      stockInfo,
      validationSkipped: true,
      skipReason: `Store ${store.code} is exempt from stock validation`
    };
  }

  for (const item of items) {
    const balance = await StoreBalance.findOne({
      where: {
        storeId: supplyingStoreId,
        itemId: item.itemId,
        status: 'Active'
      }
    });

    if (!balance) {
      errors.push({
        itemId: item.itemId,
        requestedQuantity: item.quantity,
        availableQuantity: 0,
        message: `This item is not available in the selected supplying store`
      });
      continue;
    }

    const availableQuantity = parseFloat(balance.balance);
    const requestedQuantity = parseFloat(item.quantity);

    stockInfo.push({
      itemId: item.itemId,
      itemName: item.itemName || 'Unknown',
      itemCode: item.itemCode || 'N/A',
      uomCode: item.uomCode || 'Units',
      availableQuantity,
      requestedQuantity,
      balance: balance
    });

    if (requestedQuantity > availableQuantity) {
      errors.push({
        itemId: item.itemId,
        itemName: item.itemName || 'Unknown',
        itemCode: item.itemCode || 'N/A',
        requestedQuantity,
        availableQuantity,
        shortage: requestedQuantity - availableQuantity,
        uomCode: item.uomCode || 'Units',
        message: `Insufficient stock.`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    stockInfo,
    validationSkipped: false
  };
};

// ================================================================
// HELPER: Create notifications for all groups in a store
// ================================================================


async function createRequestNotifications(requestId, storeId) {
  try {
    console.log(`📤 Creating notifications for request ${requestId}, store ${storeId}`);

    // 🔥 Get all active groups
    const groups = await db.sequelize.query(
      `SELECT g.id, g.name, g.code, g.status
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
      {
        replacements: { storeId: parseInt(storeId) },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    console.log(`📋 Found ${groups.length} groups`);

    if (!groups || groups.length === 0) {
      console.log(`⚠️ No active groups found for store ${storeId}`);
      return 0;
    }

    // 🔥 Use bulk create for better performance
    const notificationsData = groups
      .map(group => {
        const groupId = parseInt(group.id);
        if (!groupId || isNaN(groupId)) return null;
        
        return {
          request_id: parseInt(requestId),
          group_id: groupId,
          store_id: parseInt(storeId),
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
      .filter(item => item !== null);

    if (notificationsData.length === 0) {
      console.log(`⚠️ No valid groups to create notifications for`);
      return 0;
    }

    // 🔥 Bulk insert for speed
    const result = await RequestNotification.bulkCreate(notificationsData, {
      validate: false,
      returning: true,
    });

    console.log(`✅ Created ${result.length} notifications`);
    return result.length;

  } catch (error) {
    console.error('❌ Error creating notifications:', error);
    // Don't throw - just log and continue
    // The request should still be created even if notifications fail
    return 0;
  }
}
// ================================================================
// HELPER: Check if all groups have accepted a request
// ================================================================
async function isRequestFullyAccepted(requestId) {
  const notifications = await RequestNotification.findAll({
    where: { request_id: requestId },
  });

  if (notifications.length === 0) {
    return {
      allAccepted: false,
      hasRejection: false,
      total: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      pendingCount: 0,
    };
  }

  const acceptedCount = notifications.filter(n => n.status === 'accepted').length;
  const rejectedCount = notifications.filter(n => n.status === 'rejected').length;
  const pendingCount = notifications.filter(n => n.status === 'pending').length;
  
  return {
    allAccepted: acceptedCount === notifications.length && notifications.length > 0,
    hasRejection: rejectedCount > 0,
    total: notifications.length,
    acceptedCount,
    rejectedCount,
    pendingCount,
  };
}

// ================================================================
// 1. CHECK STOCK AVAILABILITY
// ================================================================
exports.checkStockAvailability = async (req, res) => {
  try {
    const { storeId, items } = req.query;

    if (!storeId || !items) {
      return res.status(400).json({
        success: false,
        error: 'Store ID and items are required'
      });
    }

    const parsedItems = JSON.parse(items);
    const validationResult = await validateStockAvailability(parseInt(storeId), parsedItems);

    const itemDetails = await Promise.all(
      parsedItems.map(async (item) => {
        const itemData = await Item.findByPk(item.itemId, {
          include: [{ model: UOM, as: 'uom' }]
        });
        const stockInfo = validationResult.stockInfo.find(s => s.itemId === item.itemId);
        return {
          ...item,
          itemName: itemData?.name || 'Unknown',
          itemCode: itemData?.code || 'N/A',
          uomCode: itemData?.uom?.code || 'Units',
          availableQuantity: stockInfo?.availableQuantity || 0,
          isAvailable: validationResult.validationSkipped ? true : (stockInfo?.availableQuantity > 0),
          hasEnoughStock: validationResult.validationSkipped ? true : (stockInfo?.availableQuantity >= item.quantity),
          shortage: validationResult.validationSkipped ? 0 : (stockInfo ? Math.max(0, item.quantity - stockInfo.availableQuantity) : item.quantity),
          stockValidationSkipped: validationResult.validationSkipped || false,
          skipReason: validationResult.skipReason || null
        };
      })
    );

    res.json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        validationSkipped: validationResult.validationSkipped,
        skipReason: validationResult.skipReason,
        items: itemDetails,
        errors: validationResult.errors,
        summary: {
          totalItems: parsedItems.length,
          availableItems: itemDetails.filter(i => i.isAvailable).length,
          itemsWithShortage: itemDetails.filter(i => i.hasEnoughStock === false).length,
          validationSkipped: validationResult.validationSkipped
        }
      }
    });
  } catch (error) {
    console.error('Check stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check stock availability'
    });
  }
};

// ================================================================
// 2. GET ALL REQUESTS
// ================================================================

// controllers/itemRequestController.js - COMPLETE FIXED getRequests

exports.getRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      storeId = 'all',
      userId = 'all',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const userRelevantWhere = {}; // For counting user-relevant requests
    
    // 🔥 Get the logged-in user
    const currentUser = req.user;
    const currentUserId = currentUser?.userId;
    const currentUserRole = currentUser?.role;
    const userStoreId = currentUser?.storeId || currentUser?.assignedStoreId;

    console.log('🔍 Current user:', {
      userId: currentUserId,
      role: currentUserRole,
      storeId: userStoreId
    });

    // ================================================================
    // 🔥 STATUS FILTER
    // ================================================================
    if (status !== 'all') {
      where.status = status;
      userRelevantWhere.status = status;
    }

    // ================================================================
    // 🔥 STORE FILTER - Based on user role
    // ================================================================
    let userRelevantCondition = {};
    
    if (storeId !== 'all') {
      where[Op.or] = [
        { askingStoreId: storeId },
        { supplyingStoreId: storeId }
      ];
      userRelevantWhere[Op.or] = [
        { askingStoreId: storeId },
        { supplyingStoreId: storeId }
      ];
    } else {
      // Auto-filter based on user role
      if (currentUserRole === 'admin') {
        // Admin sees all requests
        console.log('👑 Admin user - showing all requests');
        // No additional filters needed
      } else if (currentUserRole === 'storekeeper' || currentUserRole === 'store_it') {
        if (userStoreId) {
          // 🔥 Show ALL requests where the user's store is involved
          // 1. As asking store (all statuses)
          // 2. As supplying store (only approved status for read-only)
          where[Op.or] = [
            { askingStoreId: userStoreId },
            { 
              [Op.and]: [
                { supplyingStoreId: userStoreId },
                { status: 'approved' }
              ]
            }
          ];
          
          // 🔥 For user-relevant counting (asking store OR requested by user)
          userRelevantCondition = {
            [Op.or]: [
              { requestedById: currentUserId },
              { askingStoreId: userStoreId }
            ]
          };
          
          userRelevantWhere[Op.or] = [
            { requestedById: currentUserId },
            { askingStoreId: userStoreId }
          ];
          
          console.log(`📦 Store user (${currentUserRole}) - showing requests for store ${userStoreId}`);
        } else {
          if (currentUserId) {
            where.requestedById = currentUserId;
            userRelevantWhere.requestedById = currentUserId;
            console.log(`👤 User has no store assigned - showing only their requests`);
          }
        }
      } else if (currentUserRole === 'checker' || currentUserRole === 'finance') {
        where.status = 'approved';
        userRelevantWhere.status = 'approved';
        if (userStoreId) {
          where[Op.or] = [
            { askingStoreId: userStoreId },
            { supplyingStoreId: userStoreId }
          ];
          userRelevantWhere[Op.or] = [
            { askingStoreId: userStoreId },
            { supplyingStoreId: userStoreId }
          ];
        }
        console.log(`📊 Checker/Finance user - showing approved requests`);
      } else {
        if (currentUserId) {
          where[Op.or] = [
            { requestedById: currentUserId }
          ];
          userRelevantWhere[Op.or] = [
            { requestedById: currentUserId }
          ];
          if (userStoreId) {
            where[Op.or].push(
              { askingStoreId: userStoreId },
              { supplyingStoreId: userStoreId }
            );
            userRelevantWhere[Op.or].push(
              { askingStoreId: userStoreId },
              { supplyingStoreId: userStoreId }
            );
          }
        }
        console.log(`👤 Other role (${currentUserRole}) - showing requests they created or involved in`);
      }
    }

    if (userId !== 'all') {
      where.requestedById = userId;
      userRelevantWhere.requestedById = userId;
    }

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { requestCode: { [Op.like]: `%${search}%` } },
          { remark: { [Op.like]: `%${search}%` } }
        ]
      };
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(searchCondition);
      
      userRelevantWhere[Op.and] = userRelevantWhere[Op.and] || [];
      userRelevantWhere[Op.and].push(searchCondition);
    }

    console.log('📋 Final WHERE clause:', JSON.stringify(where, null, 2));

    // ================================================================
    // 🔥 GET CORRECT TOTAL COUNT - Only count requests the user can see
    // ================================================================
    const totalCount = await ItemRequest.count({ where });
    console.log(`📊 Total count of visible requests: ${totalCount}`);

    // ================================================================
    // 🔥 QUERY DATABASE - WITH CUSTOM SORTING
    // ================================================================
    let rows = [];
    
    if (currentUserId && userStoreId && currentUserRole !== 'admin') {
      // 🔥 Get user's relevant requests first (limited to page size)
      const userRequests = await ItemRequest.findAll({
        where: {
          ...where,
          ...userRelevantCondition
        },
        limit: parseInt(limit),
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: ItemRequestDetail,
            as: 'items',
            include: [
              {
                model: Item,
                as: 'item',
                include: [
                  { model: UOM, as: 'uom' }
                ]
              }
            ]
          },
          {
            model: Store,
            as: 'askingStore'
          },
          {
            model: Store,
            as: 'supplyingStore'
          },
          {
            model: User,
            as: 'requestedByUser',
            attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
          },
          {
            model: RequestNotification,
            as: 'notifications',
            include: [
              { model: Group, as: 'group' },
              { model: User, as: 'respondedByUser' },
            ],
          },
        ],
      });

      // Get the remaining requests
      const remainingLimit = parseInt(limit) - userRequests.length;
      
      let otherRequests = [];
      if (remainingLimit > 0) {
        // Count user-relevant requests
        const userRelevantCount = await ItemRequest.count({
          where: {
            ...where,
            ...userRelevantCondition
          }
        });
        
        // Calculate offset for other requests
        let otherOffset = parseInt(offset);
        if (page == 1) {
          otherOffset = 0;
        } else {
          const userRelevantOnPreviousPages = Math.min((parseInt(page) - 1) * parseInt(limit), userRelevantCount);
          otherOffset = Math.max(0, parseInt(offset) - userRelevantOnPreviousPages);
        }
        
        // 🔥 Get other requests (excluding user's relevant ones)
        const otherWhere = {
          ...where,
          [Op.and]: [
            { requestedById: { [Op.ne]: currentUserId } },
            { askingStoreId: { [Op.ne]: userStoreId } }
          ]
        };
        
        otherRequests = await ItemRequest.findAll({
          where: otherWhere,
          limit: remainingLimit,
          offset: otherOffset,
          order: [[sortBy, sortOrder]],
          include: [
            {
              model: ItemRequestDetail,
              as: 'items',
              include: [
                {
                  model: Item,
                  as: 'item',
                  include: [
                    { model: UOM, as: 'uom' }
                  ]
                }
              ]
            },
            {
              model: Store,
              as: 'askingStore'
            },
            {
              model: Store,
              as: 'supplyingStore'
            },
            {
              model: User,
              as: 'requestedByUser',
              attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
            },
            {
              model: RequestNotification,
              as: 'notifications',
              include: [
                { model: Group, as: 'group' },
                { model: User, as: 'respondedByUser' },
              ],
            },
          ],
        });
      }

      // Combine the results - user's requests first, then others
      rows = [...userRequests, ...otherRequests];
      
      console.log(`✅ Found ${userRequests.length} user-relevant requests and ${otherRequests.length} other requests (total: ${rows.length})`);
    } else {
      // No current user, admin, or no store assigned - do normal query
      rows = await ItemRequest.findAll({
        where,
        offset: parseInt(offset),
        limit: parseInt(limit),
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: ItemRequestDetail,
            as: 'items',
            include: [
              {
                model: Item,
                as: 'item',
                include: [
                  { model: UOM, as: 'uom' }
                ]
              }
            ]
          },
          {
            model: Store,
            as: 'askingStore'
          },
          {
            model: Store,
            as: 'supplyingStore'
          },
          {
            model: User,
            as: 'requestedByUser',
            attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
          },
          {
            model: RequestNotification,
            as: 'notifications',
            include: [
              { model: Group, as: 'group' },
              { model: User, as: 'respondedByUser' },
            ],
          },
        ],
      });
    }

    res.json({
      success: true,
      data: {
        requests: rows,
        pagination: {
          total: totalCount, // 🔥 Use the correct count
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit) // 🔥 Calculate pages based on correct total
        }
      }
    });
  } catch (error) {
    console.error('❌ Get requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
};

// ================================================================
// 3. GET SINGLE REQUEST BY ID
// ================================================================
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ItemRequest.findByPk(id, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request'
    });
  }
};

// ================================================================
// 4. CREATE REQUEST
// ================================================================
// controllers/itemRequestController.js - COMPLETE createRequest




// ================================================================
// HELPER: Create notifications (for non-skip stores only)
// ================================================================
async function createRequestNotifications(requestId, storeId) {
  try {
    console.log(`📤 Creating notifications for request ${requestId}, store ${storeId}`);

    const groups = await db.sequelize.query(
      `SELECT g.id, g.name, g.code, g.status
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
      {
        replacements: { storeId: parseInt(storeId) },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    console.log(`📋 Found ${groups.length} groups`);

    if (!groups || groups.length === 0) {
      console.log(`⚠️ No active groups found for store ${storeId}`);
      return 0;
    }

    const notificationsData = groups
      .map(group => {
        const groupId = parseInt(group.id);
        if (!groupId || isNaN(groupId)) return null;
        
        return {
          request_id: parseInt(requestId),
          group_id: groupId,
          store_id: parseInt(storeId),
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
      .filter(item => item !== null);

    if (notificationsData.length === 0) {
      console.log(`⚠️ No valid groups to create notifications for`);
      return 0;
    }

    const result = await RequestNotification.bulkCreate(notificationsData, {
      validate: false,
      returning: true,
    });

    console.log(`✅ Created ${result.length} notifications`);
    return result.length;

  } catch (error) {
    console.error('❌ Error creating notifications:', error);
    return 0;
  }
}

// ================================================================
// COMPLETE CREATE REQUEST FUNCTION
// ================================================================
exports.createRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedDate,
      status = 'pending',
      remark
    } = req.body;

    // ================================================================
    // 1. VALIDATE REQUIRED FIELDS
    // ================================================================
    if (!askingStoreId || !supplyingStoreId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Asking store and supplying store are required'
      });
    }

    if (parseInt(askingStoreId) === parseInt(supplyingStoreId)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Asking store and supplying store cannot be the same'
      });
    }

    // ================================================================
    // 2. VALIDATE STORES
    // ================================================================
    const askingStore = await Store.findByPk(askingStoreId);
    const supplyingStore = await Store.findByPk(supplyingStoreId);

    if (!askingStore || !supplyingStore) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'One or both stores not found'
      });
    }

    if (askingStore.status !== 'Active') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Asking store "${askingStore.name}" is not active`
      });
    }

    if (supplyingStore.status !== 'Active') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Supplying store "${supplyingStore.name}" is not active`
      });
    }

    // ================================================================
    // 3. CHECK IF SKIP STORE (FOREIGN/LOCAL PURCHASE)
    // ================================================================
    const skipNotifications = shouldSkipNotifications(supplyingStore.code);
    if (skipNotifications) {
      console.log(`⚠️ Store ${supplyingStore.code} (${supplyingStore.name}) - Notifications will be skipped`);
    }

    // ================================================================
    // 4. VALIDATE USER
    // ================================================================
    if (requestedById) {
      const user = await User.findByPk(requestedById);
      if (!user) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
    }

    // ================================================================
    // 5. VALIDATE ITEMS
    // ================================================================
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    const validatedItems = [];
    const validationErrors = [];
    const itemIds = items.map(item => item.itemId);

    const itemRecords = await Item.findAll({
      where: { itemId: { [Op.in]: itemIds } },
      include: [
        { model: UOM, as: 'uom' }
      ]
    });

    const itemMap = {};
    itemRecords.forEach(record => {
      itemMap[record.itemId] = record;
    });

    for (const item of items) {
      const itemRecord = itemMap[item.itemId];
      if (!itemRecord) {
        validationErrors.push({
          itemId: item.itemId,
          itemName: 'Unknown Item',
          itemCode: 'N/A',
          requestedQuantity: item.quantity,
          message: `Item with ID ${item.itemId} not found in database`
        });
        continue;
      }

      if (itemRecord.status !== 'Active') {
        validationErrors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: item.quantity,
          message: `Item "${itemRecord.name}" is ${itemRecord.status}`
        });
        continue;
      }

      if (!item.quantity || item.quantity <= 0) {
        validationErrors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: item.quantity || 0,
          message: 'Quantity must be greater than 0'
        });
        continue;
      }

      validatedItems.push({
        ...item,
        itemRecord,
        itemName: itemRecord.name,
        itemCode: itemRecord.code,
        uomCode: itemRecord.uom?.code || 'Units'
      });
    }

    if (validationErrors.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Item validation failed',
        message: 'Some items are invalid or inactive',
        errors: validationErrors
      });
    }

    // ================================================================
    // 6. STOCK AVAILABILITY VALIDATION
    // ================================================================
    const stockValidation = await validateStockAvailability(supplyingStoreId, validatedItems);

    if (!stockValidation.validationSkipped && stockValidation.errors.length > 0) {
      await t.rollback();
      
      return res.status(400).json({
        success: false,
        error: 'Stock validation failed',
        errors: stockValidation.errors,
        stockInfo: stockValidation.stockInfo,
        summary: {
          totalItems: validatedItems.length,
          itemsWithStock: stockValidation.stockInfo.filter(s => s.availableQuantity > 0).length,
          itemsWithoutStock: stockValidation.errors.filter(e => e.availableQuantity === 0).length,
          itemsWithShortage: stockValidation.errors.filter(e => e.availableQuantity > 0 && e.shortage > 0).length,
          storeName: supplyingStore.name,
          storeId: supplyingStoreId,
          validationSkipped: false
        }
      });
    }

    // ================================================================
    // 7. GENERATE REQUEST CODE
    // ================================================================
    const requestCode = await ItemRequest.generateRequestCode();

    // ================================================================
    // 8. CREATE THE REQUEST
    // ================================================================
    const request = await ItemRequest.create({
      requestCode,
      askingStoreId: parseInt(askingStoreId),
      supplyingStoreId: parseInt(supplyingStoreId),
      requestedById: requestedById || null,
      requestedDate: requestedDate || new Date().toISOString().split('T')[0],
      status: status || 'pending',
      remark: remark || null
    }, { transaction: t });

    // ================================================================
    // 9. CREATE ITEM DETAILS
    // ================================================================
    await Promise.all(
      validatedItems.map(async (item) => {
        return ItemRequestDetail.create({
          requestId: request.requestId,
          itemId: item.itemId,
          quantity: item.quantity,
          remark: item.remark || null
        }, { transaction: t });
      })
    );

    // ================================================================
    // 10. CREATE NOTIFICATIONS - SKIP FOR FOREIGN/LOCAL PURCHASE STORES
    // ================================================================
    let notificationCount = 0;
    
    if (!skipNotifications) {
      console.log(`📤 Creating notifications for request ${request.requestId}, store ${supplyingStoreId}`);
      
      try {
        // Get all active groups for the supplying store
        const groups = await db.sequelize.query(
          `SELECT g.id, g.name, g.code, g.status
           FROM groups g
           INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
           WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
          {
            replacements: { storeId: parseInt(supplyingStoreId) },
            type: db.sequelize.QueryTypes.SELECT,
            transaction: t,
          }
        );

        console.log(`📋 Found ${groups.length} groups for store ${supplyingStoreId}`);

        if (groups && groups.length > 0) {
          for (const group of groups) {
            const groupId = parseInt(group.id);
            if (!groupId || isNaN(groupId)) {
              console.log(`⚠️ Skipping invalid group:`, group);
              continue;
            }

            try {
              await db.sequelize.query(
                `INSERT INTO request_notifications (
                  request_id,
                  group_id,
                  store_id,
                  status,
                  created_at,
                  updated_at
                ) VALUES (
                  :request_id,
                  :group_id,
                  :store_id,
                  :status,
                  NOW(),
                  NOW()
                )`,
                {
                  replacements: {
                    request_id: request.requestId,
                    group_id: groupId,
                    store_id: parseInt(supplyingStoreId),
                    status: 'pending',
                  },
                  type: db.sequelize.QueryTypes.INSERT,
                  transaction: t,
                }
              );
              notificationCount++;
              console.log(`✅ Created notification for group ${groupId} (${group.name})`);
            } catch (err) {
              console.error(`❌ Failed to insert for group ${groupId}:`, err.message);
            }
          }
          console.log(`✅ Created ${notificationCount}/${groups.length} notifications`);
        } else {
          console.log(`⚠️ No active groups found for store ${supplyingStoreId}`);
        }
      } catch (notifError) {
        console.error('❌ Error creating notifications:', notifError);
        // Don't rollback - request still created even if notifications fail
      }
    } else {
      console.log(`⚠️ SKIPPED notifications for store: ${supplyingStore.code} (${supplyingStore.name}) - Foreign/Local Purchase`);
    }

    // ================================================================
    // 11. COMMIT TRANSACTION
    // ================================================================
    await t.commit();

    // ================================================================
    // 12. FETCH COMPLETE REQUEST
    // ================================================================
    const completeRequest = await ItemRequest.findByPk(request.requestId, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
    });

    // ================================================================
    // 13. PREPARE RESPONSE
    // ================================================================
    const stockInfoResponse = stockValidation.validationSkipped 
      ? stockValidation.stockInfo.map(s => ({
          itemId: s.itemId,
          itemName: s.itemName,
          itemCode: s.itemCode,
          availableQuantity: Number.MAX_SAFE_INTEGER,
          availableQuantityDisplay: 'Unlimited (SKIPPED)',
          requestedQuantity: s.requestedQuantity,
          uomCode: s.uomCode,
          hasStock: true,
          hasEnoughStock: true,
          stockValidationSkipped: true,
          skipReason: s.skipReason
        }))
      : stockValidation.stockInfo.map(s => ({
          itemId: s.itemId,
          itemName: s.itemName || 'Unknown',
          itemCode: s.itemCode || 'N/A',
          availableQuantity: s.availableQuantity,
          requestedQuantity: s.requestedQuantity,
          uomCode: s.uomCode || 'Units',
          hasStock: s.availableQuantity > 0,
          hasEnoughStock: s.requestedQuantity <= s.availableQuantity,
          stockValidationSkipped: false
        }));

    const responseMessage = skipNotifications 
      ? `✅ Request created successfully. (${supplyingStore.code} - No approval required - Foreign/Local Purchase)`
      : '✅ Request created successfully. Notifications sent to all groups.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        request: completeRequest,
        skipNotifications: skipNotifications,
        skipReason: skipNotifications ? `Store ${supplyingStore.code} does not require approval (Foreign/Local Purchase)` : null,
        notificationCount: notificationCount,
        stockValidation: {
          allItemsAvailable: stockValidation.isValid || stockValidation.validationSkipped,
          validationSkipped: stockValidation.validationSkipped,
          skipReason: stockValidation.skipReason || null,
          items: stockInfoResponse,
          summary: {
            totalItems: validatedItems.length,
            allItemsAvailable: stockValidation.isValid || stockValidation.validationSkipped,
            storeName: supplyingStore.name,
            storeCode: supplyingStore.code,
            validationSkipped: stockValidation.validationSkipped
          }
        }
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('❌ Create request error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create request'
    });
  }
};

// ================================================================
// 5. UPDATE REQUEST
// ================================================================
// controllers/itemRequestController.js - COMPLETE FIXED VERSION

exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedDate,
      remark
    } = req.body;

    console.log(`🔄 Updating request ${id} with data:`, req.body);

    // ================================================================
    // STEP 1: GET THE REQUEST
    // ================================================================
    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // ✅ Allow editing if status is pending OR rejected
    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit finalized requests'
      });
    }

    // ================================================================
    // STEP 2: UPDATE THE REQUEST - NO TRANSACTION
    // ================================================================
    await request.update({
      askingStoreId: askingStoreId || request.askingStoreId,
      supplyingStoreId: supplyingStoreId || request.supplyingStoreId,
      requestedById: requestedById !== undefined ? requestedById : request.requestedById,
      requestedDate: requestedDate || request.requestedDate,
      status: 'pending', // 🔥 ALWAYS reset to pending
      remark: remark !== undefined ? remark : request.remark
    });

    // ================================================================
    // STEP 3: UPDATE ITEMS - NO TRANSACTION
    // ================================================================
    if (items && items.length > 0) {
      // Delete existing items
      await ItemRequestDetail.destroy({
        where: { requestId: id }
      });

      // Create new items in parallel
      await Promise.all(
        items.map(async (item) => {
          return ItemRequestDetail.create({
            requestId: request.requestId,
            itemId: item.itemId,
            quantity: item.quantity,
            remark: item.remark || null
          });
        })
      );
    }

    // ================================================================
    // STEP 4: DELETE EXISTING NOTIFICATIONS - NO TRANSACTION
    // ================================================================
    console.log(`🗑️ Deleting existing notifications for request ${id}`);
    await RequestNotification.destroy({
      where: { request_id: id }
    });

    // ================================================================
    // STEP 5: CREATE NEW NOTIFICATIONS - NO TRANSACTION
    // ================================================================
    console.log(`📤 Creating new notifications for request ${id}`);
    await createRequestNotifications(request.requestId, request.supplyingStoreId);

    console.log(`✅ Request ${id} updated successfully`);

    // ================================================================
    // STEP 6: FETCH THE UPDATED REQUEST
    // ================================================================
    const updatedRequest = await ItemRequest.findByPk(id, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Request updated successfully. New notifications sent to all groups.',
      data: updatedRequest,
    });

  } catch (error) {
    console.error('❌ Update request error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update request'
    });
  }
};

// ================================================================
// 6. UPDATE REQUEST STATUS
// ================================================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'finalized'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, finalized'
      });
    }

    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change status of finalized requests'
      });
    }

    if (request.status === 'rejected' && status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Cannot approve a rejected request. Edit the request to reset status to pending'
      });
    }

    await request.update({
      status: status
    });

    const updatedRequest = await ItemRequest.findByPk(id, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
      ],
    });

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update status'
    });
  }
};

// ================================================================
// 7. GET REQUESTS BY USER
// ================================================================
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get by user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests for user'
    });
  }
};

// ================================================================
// 8. GET MY REQUESTS
// ================================================================
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your requests'
    });
  }
};

// ================================================================
// 9. GET REQUESTS BY STATUS
// ================================================================
exports.getByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const validStatuses = ['pending', 'approved', 'rejected', 'finalized'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, finalized'
      });
    }

    const requests = await ItemRequest.findAll({
      where: { status },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get by status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests by status'
    });
  }
};

// ================================================================
// 10. GET REQUESTS BY DATE RANGE
// ================================================================
exports.getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const requests = await ItemRequest.findAll({
      where: {
        requestedDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
      order: [['requestedDate', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get by date range error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests by date range'
    });
  }
};

// ================================================================
// 11. DELETE REQUEST
// ================================================================
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (request.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete approved requests. Edit the request to reset status to pending first'
      });
    }

    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete finalized requests'
      });
    }

    // Delete notifications first
    await RequestNotification.destroy({
      where: { request_id: id }
    });

    await request.destroy();

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete request'
    });
  }
};

// ================================================================
// 12. GET REQUEST WITH NOTIFICATIONS
// ================================================================
exports.getRequestWithNotifications = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ItemRequest.findByPk(id, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        },
        {
          model: RequestNotification,
          as: 'notifications',
          include: [
            { model: Group, as: 'group' },
            { model: User, as: 'respondedByUser' },
          ],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    const notifications = request.notifications || [];
    const total = notifications.length;
    const accepted = notifications.filter(n => n.status === 'accepted').length;
    const rejected = notifications.filter(n => n.status === 'rejected').length;
    const pending = notifications.filter(n => n.status === 'pending').length;
    const allAccepted = total > 0 && accepted === total;
    const hasRejection = rejected > 0;

    const rejectionReasons = notifications
      .filter(n => n.status === 'rejected')
      .map(n => ({
        groupId: n.group_id,
        groupName: n.group?.name || 'Unknown Group',
        reason: n.rejected_reason,
        respondedBy: n.respondedByUser?.fullName || n.respondedByUser?.username || 'Unknown',
        respondedAt: n.responded_at,
      }));

    res.status(200).json({
      success: true,
      data: {
        request,
        notificationSummary: {
          total,
          accepted,
          rejected,
          pending,
          allAccepted,
          hasRejection,
          rejectionReasons,
        },
      },
    });
  } catch (error) {
    console.error('Error getting request with notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get request'
    });
  }
};

// ================================================================
// 13. CHECK REQUEST NOTIFICATION STATUS
// ================================================================
exports.checkRequestNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await isRequestFullyAccepted(parseInt(id));

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error checking notification status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check notification status'
    });
  }
};

// ================================================================
// 14. ACCEPT NOTIFICATION
// ================================================================
exports.acceptNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const notification = await RequestNotification.findByPk(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Notification is already ${notification.status}`
      });
    }

    await notification.update({
      status: 'accepted',
      responded_by: userId,
      responded_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Notification accepted successfully',
      data: notification,
    });
  } catch (error) {
    console.error('Error accepting notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to accept notification'
    });
  }
};

// ================================================================
// 15. REJECT NOTIFICATION
// ================================================================
exports.rejectNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const notification = await RequestNotification.findByPk(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Notification is already ${notification.status}`
      });
    }

    await notification.update({
      status: 'rejected',
      rejected_reason: reason.trim(),
      responded_by: userId,
      responded_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Notification rejected',
      data: notification,
    });
  } catch (error) {
    console.error('Error rejecting notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject notification'
    });
  }
};

// ================================================================
// 16. GET REJECTION REASONS
// ================================================================
exports.getRejectionReasons = async (req, res) => {
  try {
    const { requestId } = req.params;

    const notifications = await RequestNotification.findAll({
      where: {
        request_id: requestId,
        status: 'rejected',
      },
      include: [
        { model: Group, as: 'group' },
        { model: User, as: 'respondedByUser' },
      ],
    });

    const reasons = notifications.map(n => ({
      groupId: n.group_id,
      groupName: n.group?.name || 'Unknown Group',
      reason: n.rejected_reason,
      respondedBy: n.respondedByUser?.fullName || n.respondedByUser?.username || 'Unknown',
      respondedAt: n.responded_at,
    }));

    res.status(200).json({
      success: true,
      data: reasons,
    });
  } catch (error) {
    console.error('Error getting rejection reasons:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get rejection reasons'
    });
  }
};

// ================================================================
// 17. EXPORT REQUESTS
// ================================================================
exports.exportRequests = async (req, res) => {
  try {
    const { status, storeId, userId } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    if (storeId && storeId !== 'all') {
      where[Op.or] = [
        { askingStoreId: storeId },
        { supplyingStoreId: storeId }
      ];
    }

    if (userId && userId !== 'all') {
      where.requestedById = userId;
    }

    const requests = await ItemRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email']
        },
      ],
    });

    const exportData = requests.map(req => ({
      'Request Code': req.requestCode,
      'Asking Store': req.askingStore?.name || 'N/A',
      'Supplying Store': req.supplyingStore?.name || 'N/A',
      'Requested By': req.requestedByUser?.fullName || req.requestedByUser?.username || 'N/A',
      'Requested By Email': req.requestedByUser?.email || 'N/A',
      'Requested Date': req.requestedDate,
      'Status': req.status,
      'Items': req.items.map(item => 
        `${item.item?.name || 'Unknown'} (${item.quantity} ${item.item?.uom?.code || 'Units'})`
      ).join('; '),
      'Remark': req.remark || ''
    }));

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export requests'
    });
  }
};

// ================================================================
// 18. GET REQUEST STATISTICS
// ================================================================
exports.getStats = async (req, res) => {
  try {
    const stats = await ItemRequest.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    const total = await ItemRequest.count();
    const pendingCount = await ItemRequest.count({ where: { status: 'pending' } });
    const approvedCount = await ItemRequest.count({ where: { status: 'approved' } });
    const rejectedCount = await ItemRequest.count({ where: { status: 'rejected' } });
    const finalizedCount = await ItemRequest.count({ where: { status: 'finalized' } });

    res.json({
      success: true,
      data: {
        total,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        finalized: finalizedCount,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
};

// ================================================================
// 19. GET ACTIVE STORES
// ================================================================
exports.getActiveStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { status: 'Active' },
      attributes: ['storeId', 'code', 'name', 'location', 'status'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Get active stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active stores'
    });
  }
};

// ================================================================
// 20. GET ACTIVE ITEMS
// ================================================================
exports.getActiveItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { status: 'Active' },
      attributes: ['itemId', 'code', 'name', 'standardName', 'brand', 'model', 'uomId', 'specText'],
      include: [
        {
          model: UOM,
          as: 'uom',
          attributes: ['uomId', 'code', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get active items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active items'
    });
  }
};

// controllers/itemRequestController.js - Add this method

// ================================================================
// GET NOTIFICATIONS FOR A GROUP IN A SPECIFIC STORE
// ================================================================
// controllers/itemRequestController.js - Updated getGroupNotifications with pagination

exports.getGroupNotifications = async (req, res) => {
  try {
    const { storeId, groupId } = req.params;
    const { page = 1, limit = 10, status } = req.query; // 🔥 Add pagination params
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify the group belongs to the store
    const storeGroupRelation = await StoreGroupRelation.findOne({
      where: {
        store_id: parseInt(storeId),
        group_id: parseInt(groupId),
      },
    });

    if (!storeGroupRelation) {
      return res.status(404).json({
        success: false,
        error: 'Group not found in this store'
      });
    }

    // 🔥 Build where clause with optional status filter
    const whereClause = {
      group_id: parseInt(groupId),
      store_id: parseInt(storeId),
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // 🔥 Get total count
    const totalCount = await RequestNotification.count({
      where: whereClause,
    });

    // 🔥 Get paginated notifications
    const notifications = await RequestNotification.findAll({
      where: whereClause,
      include: [
        {
          model: ItemRequest,
          as: 'request',
          include: [
            { 
              model: Store, 
              as: 'askingStore',
              attributes: ['storeId', 'name', 'code', 'location']
            },
            { 
              model: Store, 
              as: 'supplyingStore',
              attributes: ['storeId', 'name', 'code', 'location']
            },
            { 
              model: User, 
              as: 'requestedByUser',
              attributes: ['userId', 'username', 'fullName', 'email']
            },
            { 
              model: ItemRequestDetail, 
              as: 'items',
              include: [
                {
                  model: Item,
                  as: 'item',
                  include: [
                    { model: UOM, as: 'uom' }
                  ]
                }
              ]
            }
          ]
        },
        { 
          model: Group, 
          as: 'group',
          attributes: ['id', 'name', 'code']
        },
        { 
          model: Store, 
          as: 'store',
          attributes: ['storeId', 'name', 'code']
        },
        { 
          model: User, 
          as: 'respondedByUser',
          attributes: ['userId', 'username', 'fullName']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    // 🔥 Get summary counts (without pagination)
    const summary = {
      total: totalCount,
      pending: await RequestNotification.count({ where: { ...whereClause, status: 'pending' } }),
      accepted: await RequestNotification.count({ where: { ...whereClause, status: 'accepted' } }),
      rejected: await RequestNotification.count({ where: { ...whereClause, status: 'rejected' } }),
    };

    res.json({
      success: true,
      data: {
        notifications,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        store: {
          id: parseInt(storeId),
          group: {
            id: parseInt(groupId),
          },
        },
      },
    });

  } catch (error) {
    console.error('❌ Error getting group notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notifications'
    });
  }
};