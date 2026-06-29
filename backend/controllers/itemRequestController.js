// controllers/itemRequestController.js
'use strict';

const db = require('../models');
const { ItemRequest, ItemRequestDetail, Store, Item, UOM, User,StoreBalance } = db;
const { Op } = require('sequelize');


// ================================================================
// HELPER: Check if store should skip stock validation
// ================================================================
const STOCK_VALIDATION_SKIP_STORES = ['STORE-003', 'STORE-004'];


const shouldSkipStockValidation = (storeCode) => {
  return STOCK_VALIDATION_SKIP_STORES.includes(storeCode);
};

// controllers/itemRequestController.js - Add this validation function

const validateStockAvailability = async (supplyingStoreId, items) => {
  const errors = [];
  const stockInfo = [];

  // Get the store details to check if we should skip validation
  const store = await Store.findByPk(supplyingStoreId);
  if (!store) {
    return {
      isValid: false,
      errors: [{ message: 'Store not found' }],
      stockInfo: []
    };
  }

  // 🔥 SKIP STOCK VALIDATION FOR SPECIFIC STORES
  if (shouldSkipStockValidation(store.code)) {
    console.log(`⚠️ Skipping stock validation for store: ${store.code} (${store.name})`);
    
    // For skipped stores, we still check if items exist but don't check balances
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
        availableQuantity: Number.MAX_SAFE_INTEGER, // Use a large number instead of string
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

  // ================================================================
  // NORMAL STOCK VALIDATION FOR OTHER STORES
  // ================================================================
  for (const item of items) {
    // Check if the item has a balance in the supplying store
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
        message: `Insufficient stock. Available: ${availableQuantity}, Requested: ${requestedQuantity}`
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



// controllers/itemRequestController.js - Add this endpoint

/**
 * Check stock availability for items in a store
 * GET /api/item-requests/check-stock
 */
// ================================================================
// CHECK STOCK AVAILABILITY (with skip condition)
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

    // Get full item details for the response
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
// GET ALL REQUESTS (with pagination and filters)
// ================================================================
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

    // Apply status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Apply store filter
    if (storeId !== 'all') {
      where[Op.or] = [
        { askingStoreId: storeId },
        { supplyingStoreId: storeId }
      ];
    }

    // Apply user filter
    if (userId !== 'all') {
      where.requestedById = userId;
    }

    // Apply search filter
    if (search) {
      where[Op.or] = [
        { requestCode: { [Op.like]: `%${search}%` } },
        { remark: { [Op.like]: `%${search}%` } }
      ];
    }

    // IMPORTANT: Get count separately without includes to avoid join duplication
    const count = await ItemRequest.count({
      where,
      // Add any additional conditions here
    });

    // Get the actual data with includes
    const rows = await ItemRequest.findAll({
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
        }
      ]
    });

    console.log('Count:', count);
    console.log('Rows returned:', rows.length);

    res.json({
      success: true,
      data: {
        requests: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
};

// ================================================================
// GET SINGLE REQUEST BY ID
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
        }
      ]
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
// GET REQUESTS BY USER
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
        }
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
// GET MY REQUESTS (current authenticated user)
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
        }
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
// GET REQUESTS BY STATUS
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
        }
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
// GET REQUESTS BY DATE RANGE
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
        }
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
// CREATE REQUEST
// ================================================================
// controllers/itemRequestController.js - Complete createRequest with stock validation

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

    // Validate that asking and supplying stores are not the same
    if (parseInt(askingStoreId) === parseInt(supplyingStoreId)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Asking store and supplying store cannot be the same'
      });
    }

    // ================================================================
    // 2. VALIDATE STORES EXIST
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

    // Check if stores are active
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
    // 3. VALIDATE USER EXISTS
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
    // 4. VALIDATE ITEMS
    // ================================================================
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    // Get all item details for validation and stock check
    const validatedItems = [];
    const validationErrors = [];
    const itemIds = items.map(item => item.itemId);

    // Fetch all items at once
    const itemRecords = await Item.findAll({
      where: { itemId: { [Op.in]: itemIds } },
      include: [
        { model: UOM, as: 'uom' }
      ]
    });

    // Create a map for quick lookup
    const itemMap = {};
    itemRecords.forEach(record => {
      itemMap[record.itemId] = record;
    });

    // Validate each item
    for (const item of items) {
      // Check if item exists
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

      // Check if item is active
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

      // Validate quantity
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

    // If there are validation errors, return them
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
    // 5. 🔥 STOCK AVAILABILITY VALIDATION (with skip condition)
    // ================================================================
    const stockValidation = await validateStockAvailability(supplyingStoreId, validatedItems);

    // ================================================================
    // 6. RETURN STOCK ERRORS IF ANY (only for non-skipped stores)
    // ================================================================
    if (!stockValidation.validationSkipped && stockValidation.errors.length > 0) {
      await t.rollback();
      
      // Check if all items have stock errors or some are valid
      const allItemsHaveStockIssues = stockValidation.errors.length === validatedItems.length;
      
      return res.status(400).json({
        success: false,
        error: 'Stock validation failed',
        message: allItemsHaveStockIssues 
          ? 'None of the requested items are available in the supplying store'
          : 'Some items do not have enough stock in the supplying store',
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
      askingStoreId,
      supplyingStoreId,
      requestedById: requestedById || null,
      requestedDate: requestedDate || new Date().toISOString().split('T')[0],
      status: status || 'pending',
      remark: remark || null
    }, { transaction: t });

    // ================================================================
    // 9. CREATE THE ITEM DETAILS
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
    // 10. COMMIT TRANSACTION
    // ================================================================
    await t.commit();

    // ================================================================
    // 11. FETCH COMPLETE REQUEST WITH DETAILS
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
        }
      ]
    });

    // ================================================================
    // 12. RETURN SUCCESS RESPONSE WITH STOCK INFO
    // ================================================================
    const stockInfoResponse = stockValidation.validationSkipped 
      ? stockValidation.stockInfo.map(s => ({
          itemId: s.itemId,
          itemName: s.itemName,
          itemCode: s.itemCode,
          availableQuantity: Number.MAX_SAFE_INTEGER, // Use number instead of string
          availableQuantityDisplay: 'Unlimited (SKIPPED)', // Add display version
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

    res.status(201).json({
      success: true,
      message: stockValidation.validationSkipped 
        ? `Request created successfully (Stock validation skipped for ${supplyingStore.code})`
        : 'Request created successfully',
      data: {
        request: completeRequest,
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
    // ================================================================
    // 13. ROLLBACK ON ERROR
    // ================================================================
    await t.rollback();
    console.error('❌ Create request error:', error);
    
    // Check for specific errors
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
// UPDATE REQUEST
// ================================================================
exports.updateRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

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

    // Find the request
    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Check if request is finalized - cannot edit finalized requests
    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit finalized requests'
      });
    }

    // Validate stores if provided
    if (askingStoreId && supplyingStoreId) {
      if (askingStoreId === supplyingStoreId) {
        return res.status(400).json({
          success: false,
          error: 'Asking store and supplying store cannot be the same'
        });
      }

      const askingStore = await Store.findByPk(askingStoreId);
      const supplyingStore = await Store.findByPk(supplyingStoreId);

      if (!askingStore || !supplyingStore) {
        return res.status(404).json({
          success: false,
          error: 'One or both stores not found'
        });
      }
    }

    // Validate user exists if provided
    if (requestedById) {
      const user = await User.findByPk(requestedById);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
    }

    // Update the request - status always resets to pending on edit
    await request.update({
      askingStoreId: askingStoreId || request.askingStoreId,
      supplyingStoreId: supplyingStoreId || request.supplyingStoreId,
      requestedById: requestedById !== undefined ? requestedById : request.requestedById,
      requestedDate: requestedDate || request.requestedDate,
      status: 'pending', // Always reset to pending on edit
      remark: remark !== undefined ? remark : request.remark
    }, { transaction: t });

    // Update items if provided
    if (items && items.length > 0) {
      // Validate items
      for (const item of items) {
        if (!item.itemId || !item.quantity) {
          return res.status(400).json({
            success: false,
            error: 'Each item must have itemId and quantity'
          });
        }

        const itemExists = await Item.findByPk(item.itemId);
        if (!itemExists) {
          return res.status(404).json({
            success: false,
            error: `Item with ID ${item.itemId} not found`
          });
        }
      }

      // Delete existing items
      await ItemRequestDetail.destroy({
        where: { requestId: id },
        transaction: t
      });

      // Create new items
      await Promise.all(
        items.map(async (item) => {
          return ItemRequestDetail.create({
            requestId: request.requestId,
            itemId: item.itemId,
            quantity: item.quantity,
            remark: item.remark || null
          }, { transaction: t });
        })
      );
    }

    await t.commit();

    // Fetch the updated request
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
        }
      ]
    });

    res.json({
      success: true,
      message: 'Request updated successfully. Status reset to Pending',
      data: updatedRequest
    });
  } catch (error) {
    await t.rollback();
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update request'
    });
  }
};

// ================================================================
// UPDATE REQUEST STATUS
// ================================================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'finalized'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, finalized'
      });
    }

    // Find the request
    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Validate status transitions
    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change status of finalized requests'
      });
    }

    if (request.status === 'approved' && status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject an approved request. Edit the request to modify'
      });
    }

    if (request.status === 'rejected' && status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Cannot approve a rejected request. Edit the request to reset status to pending'
      });
    }

    // Update status
    await request.update({
      status: status
    });

    // Fetch the updated request
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
        }
      ]
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
// DELETE REQUEST
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

    // Only allow deletion of pending or rejected requests
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

    // Delete the request (cascade will delete details)
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
// EXPORT REQUESTS
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
        }
      ]
    });

    // Format data for export
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
// GET REQUEST STATISTICS
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

    // Get additional stats
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
// GET ACTIVE STORES
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
// GET ACTIVE ITEMS (for dropdown)
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