// balanceController.js - COMPLETE FIXED VERSION

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const { Op } = require("sequelize");

// Import models using destructuring
const {
  StoreBalance,
  StoreBalanceHistory,
  ItemRequest,
  ItemRequestDetail,
  Store,
  Group,
  Item,
  UOM,
    StoreGroupRelation, // Add this
  User,
  sequelize,
} = require("../models");

// ============================================
// HELPER FUNCTIONS
// ============================================

const safeDelete = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getBalanceClass = (balance, minStockAlert) => {
  if (balance === 0) return 'zero';
  if (balance <= minStockAlert) return 'low';
  return 'normal';
};

const getBaseBalance = (balance, conversionValue) => {
  return balance * conversionValue;
};

// ============================================
// 1. GET ALL BALANCES WITH FILTERS
// ============================================
exports.getBalances = async (req, res) => {
  try {
    const {
      storeId,
      groupId,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const whereClause = {};
    
    // USE CAMELCASE - matches model with field mappings
    if (storeId) {
      whereClause.storeId = parseInt(storeId);
    }
    if (groupId) {
      whereClause.groupId = parseInt(groupId);
    }
    if (status) {
      whereClause.status = status;
    }

    const include = [
      {
        model: Store,
        as: "store",
        attributes: ["id", "name", "code"],
      },
      {
        model: Group,
        as: "group",
        attributes: ["id", "name", "code"],
      },
      {
        model: Item,
        as: "item",
        attributes: ["id", "code", "name", "standardName"],
        include: [
          {
            model: UOM,
            as: "uom",
            attributes: ["id", "code", "name"],
          },
          {
            model: UOM,
            as: "conversionUom",
            attributes: ["id", "code", "name"],
          },
        ],
      },
    ];

    // Search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      // Use a different approach for search with includes
      // We'll handle it in the where clause with $ notation
      whereClause[Op.or] = [
        { '$item.name$': { [Op.iLike]: searchTerm } },
        { '$item.code$': { [Op.iLike]: searchTerm } },
        { '$item.standardName$': { [Op.iLike]: searchTerm } },
        { '$store.name$': { [Op.iLike]: searchTerm } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await StoreBalance.findAndCountAll({
      where: whereClause,
      include: include,
      distinct: true,
      limit: parseInt(limit),
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    // Format response
    const formattedRows = rows.map((record) => {
      const item = record.item;
      const uom = item?.uom;
      const conversionUom = item?.conversionUom;
      const conversionValue = parseFloat(item?.conversionValue) || 1;

      return {
        id: record.id,
        storeId: record.storeId,
        storeName: record.store?.name || null,
        groupId: record.groupId,
        groupName: record.group?.name || null,
        itemId: record.itemId,
        itemCode: item?.code || null,
        itemName: item?.standardName || item?.name || null,
        itemCommonName: item?.standardName || item?.name || null,
        uomCode: uom?.code || null,
        uomName: uom?.name || null,
        conversionUomCode: conversionUom?.code || null,
        conversionValue: conversionValue,
        balance: parseFloat(record.balance),
        minStock: parseFloat(record.minStockAlert) || 0,
        baseBalance: getBaseBalance(parseFloat(record.balance), conversionValue),
        status: record.status,
        statusClass: getBalanceClass(parseFloat(record.balance), parseFloat(record.minStockAlert) || 0),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get balances error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 2. GET BALANCE STATISTICS
// ============================================
exports.getStats = async (req, res) => {
  try {
    const totalStoresResult = await StoreBalance.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("storeId")), "storeId"],
      ],
    });
    const totalStores = totalStoresResult.length;

    const totalItems = await StoreBalance.count();

    const lowStockItems = await StoreBalance.count({
      where: {
        status: "Active",
        [Op.and]: [
          { balance: { [Op.lte]: sequelize.col("minStockAlert") } },
          { balance: { [Op.gt]: 0 } },
        ],
      },
    });

    const pendingRequestsCount = await ItemRequest.count({
      where: { status: "approved" },
    });

    res.status(200).json({
      success: true,
      data: {
        totalStores,
        totalItems,
        lowStockItems,
        pendingRequestsCount,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 3. GET LOW STOCK ITEMS
// ============================================
exports.getLowStockItems = async (req, res) => {
  try {
    const records = await StoreBalance.findAll({
      where: {
        status: "Active",
        [Op.and]: [
          { balance: { [Op.lte]: sequelize.col("minStockAlert") } },
          { balance: { [Op.gt]: 0 } },
        ],
      },
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["id", "code", "name", "standardName"],
          include: [
            {
              model: UOM,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
      ],
    });

    const formattedRows = records.map((record) => ({
      id: record.id,
      storeName: record.store?.name || null,
      groupName: record.group?.name || null,
      itemName: record.item?.standardName || record.item?.name || null,
      itemCode: record.item?.code || null,
      uomCode: record.item?.uom?.code || null,
      balance: parseFloat(record.balance),
      minStockAlert: parseFloat(record.minStockAlert),
    }));

    res.status(200).json({
      success: true,
      data: formattedRows,
    });
  } catch (error) {
    console.error("Get low stock error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 4. GET BALANCE BY ID
// ============================================
exports.getBalanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await StoreBalance.findByPk(id, {
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "code"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["id", "name", "code"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["id", "code", "name", "standardName"],
          include: [
            {
              model: UOM,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
            {
              model: UOM,
              as: "conversionUom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
      ],
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Balance not found",
      });
    }

    const item = record.item;
    const conversionValue = parseFloat(item?.conversionValue) || 1;

    const formattedData = {
      id: record.id,
      storeId: record.storeId,
      storeName: record.store?.name || null,
      groupId: record.groupId,
      groupName: record.group?.name || null,
      itemId: record.itemId,
      itemCode: item?.code || null,
      itemName: item?.standardName || item?.name || null,
      itemCommonName: item?.standardName || item?.name || null,
      uomCode: item?.uom?.code || null,
      conversionUomCode: item?.conversionUom?.code || null,
      conversionValue: conversionValue,
      balance: parseFloat(record.balance),
      minStock: parseFloat(record.minStockAlert) || 0,
      baseBalance: getBaseBalance(parseFloat(record.balance), conversionValue),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Get balance by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 5. CREATE BALANCE (INITIALIZE) - FIXED
// ============================================
exports.createBalance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { storeId, groupId, itemId, balance, minStock, status } = req.body;
    const userId = req.user ? req.user.userId : 1;

    console.log('📦 Create balance request body:', req.body);

    // Validate required fields
    if (!storeId || !groupId || !itemId) {
      return res.status(400).json({
        success: false,
        error: "Store, Group, and Item are required",
      });
    }

    // Convert to proper types
    const storeIdInt = parseInt(storeId);
    const groupIdInt = parseInt(groupId);
    const itemIdInt = parseInt(itemId);
    const balanceFloat = parseFloat(balance) || 0;
    const minStockFloat = parseFloat(minStock) || 0;
    const statusStr = status || 'Active';

    // Check if balance already exists - USE CAMELCASE
    const existing = await StoreBalance.findOne({
      where: {
        storeId: storeIdInt,
        groupId: groupIdInt,
        itemId: itemIdInt,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "This item already has a balance in this store and group",
      });
    }

    // Create the balance record - USE CAMELCASE
    const balanceRecord = await StoreBalance.create({
      storeId: storeIdInt,
      groupId: groupIdInt,
      itemId: itemIdInt,
      balance: balanceFloat,
      minStockAlert: minStockFloat,
      status: statusStr,
    }, { transaction });

    // Create history record - USE CAMELCASE
    await StoreBalanceHistory.create({
      balanceId: balanceRecord.id,
      storeId: storeIdInt,
      groupId: groupIdInt,
      itemId: itemIdInt,
      previousBalance: 0,
      newBalance: balanceFloat,
      changeAmount: balanceFloat,
      transactionType: "Stock In",
      referenceType: "initialization",
      changedBy: userId,
      remark: "Initial balance setup",
    }, { transaction });

    await transaction.commit();

    // Fetch the created record
    const createdRecord = await StoreBalance.findByPk(balanceRecord.id, {
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "code"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["id", "name", "code"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["id", "code", "name", "standardName"],
          include: [
            {
              model: UOM,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
            {
              model: UOM,
              as: "conversionUom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
      ],
    });

    // Format response
    const item = createdRecord.item;
    const conversionValue = parseFloat(item?.conversionValue) || 1;

    const formattedData = {
      id: createdRecord.id,
      storeId: createdRecord.storeId,
      storeName: createdRecord.store?.name || null,
      groupId: createdRecord.groupId,
      groupName: createdRecord.group?.name || null,
      itemId: createdRecord.itemId,
      itemCode: item?.code || null,
      itemName: item?.standardName || item?.name || null,
      itemCommonName: item?.standardName || item?.name || null,
      uomCode: item?.uom?.code || null,
      uomName: item?.uom?.name || null,
      conversionUomCode: item?.conversionUom?.code || null,
      conversionValue: conversionValue,
      balance: parseFloat(createdRecord.balance),
      minStock: parseFloat(createdRecord.minStockAlert) || 0,
      baseBalance: parseFloat(createdRecord.balance) * conversionValue,
      status: createdRecord.status,
      statusClass: getBalanceClass(parseFloat(createdRecord.balance), parseFloat(createdRecord.minStockAlert) || 0),
      createdAt: createdRecord.createdAt,
      updatedAt: createdRecord.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: "Balance initialized successfully",
      data: formattedData,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Create balance error:", error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create balance",
    });
  }
};

// ============================================
// 6. UPDATE BALANCE - FIXED
// ============================================
exports.updateBalance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { storeId, groupId, itemId, minStock, status } = req.body;

    console.log('📝 Update balance payload:', { id, storeId, groupId, itemId, minStock, status });

    const balance = await StoreBalance.findByPk(id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        error: "Balance not found",
      });
    }

    // Convert values - USE CAMELCASE
    const storeIdInt = storeId ? parseInt(storeId) : balance.storeId;
    const groupIdInt = groupId ? parseInt(groupId) : balance.groupId;
    const itemIdInt = itemId ? parseInt(itemId) : balance.itemId;

    // Check for duplicates
    if (storeId || groupId || itemId) {
      const duplicate = await StoreBalance.findOne({
        where: {
          storeId: storeIdInt,
          groupId: groupIdInt,
          itemId: itemIdInt,
          id: { [Op.ne]: parseInt(id) },
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: "Another balance already exists for this store, group, and item",
        });
      }
    }

    // Update the balance - USE CAMELCASE
    await balance.update({
      storeId: storeIdInt,
      groupId: groupIdInt,
      itemId: itemIdInt,
      minStockAlert: minStock !== undefined ? parseFloat(minStock) : balance.minStockAlert,
      status: status || balance.status,
    }, { transaction });

    await transaction.commit();

    // Fetch updated record
    const updatedRecord = await StoreBalance.findByPk(id, {
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "code"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["id", "name", "code"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["id", "code", "name", "standardName"],
          include: [
            {
              model: UOM,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
            {
              model: UOM,
              as: "conversionUom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
      ],
    });

    // Format response
    const item = updatedRecord.item;
    const conversionValue = parseFloat(item?.conversionValue) || 1;

    const formattedData = {
      id: updatedRecord.id,
      storeId: updatedRecord.storeId,
      storeName: updatedRecord.store?.name || null,
      groupId: updatedRecord.groupId,
      groupName: updatedRecord.group?.name || null,
      itemId: updatedRecord.itemId,
      itemCode: item?.code || null,
      itemName: item?.standardName || item?.name || null,
      itemCommonName: item?.standardName || item?.name || null,
      uomCode: item?.uom?.code || null,
      uomName: item?.uom?.name || null,
      conversionUomCode: item?.conversionUom?.code || null,
      conversionValue: conversionValue,
      balance: parseFloat(updatedRecord.balance),
      minStock: parseFloat(updatedRecord.minStockAlert) || 0,
      baseBalance: parseFloat(updatedRecord.balance) * conversionValue,
      status: updatedRecord.status,
      statusClass: getBalanceClass(parseFloat(updatedRecord.balance), parseFloat(updatedRecord.minStockAlert) || 0),
      createdAt: updatedRecord.createdAt,
      updatedAt: updatedRecord.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Balance updated successfully",
      data: formattedData,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Update balance error:", error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update balance",
    });
  }
};

// ============================================
// 7. TOGGLE STATUS
// ============================================
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const balance = await StoreBalance.findByPk(id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        error: "Balance not found",
      });
    }

    const newStatus = balance.status === "Active" ? "Inactive" : "Active";
    await balance.update({ status: newStatus });

    res.status(200).json({
      success: true,
      message: `Status changed to ${newStatus}`,
      data: {
        id: balance.id,
        status: balance.status,
      },
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 8. DELETE BALANCE
// ============================================
exports.deleteBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const balance = await StoreBalance.findByPk(id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        error: "Balance not found",
      });
    }

    if (balance.status === "Active") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete active balance. Please deactivate it first.",
      });
    }

    await balance.destroy();

    res.status(200).json({
      success: true,
      message: "Balance deleted successfully",
    });
  } catch (error) {
    console.error("Delete balance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 9. GET APPROVED REQUESTS - FIXED
// ============================================
// balanceController.js - FIXED getApprovedRequests

exports.getApprovedRequests = async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log('🔍 Fetching approved requests for storeId:', storeId);

    // Use correct field names from the model
    const requests = await ItemRequest.findAll({
      where: {
        status: 'approved',  // Status is 'approved' (lowercase)
        [Op.or]: [
          { askingStoreId: parseInt(storeId) },
          { supplyingStoreId: parseInt(storeId) },
        ],
      },
      include: [
        {
          model: Store,
          as: "askingStore",
          attributes: ["id", "name", "code"],
        },
        {
          model: Store,
          as: "supplyingStore",
          attributes: ["id", "name", "code"],
        },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName"],
        },
        {
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              attributes: ["id", "code", "name", "standardName"],
              include: [
                {
                  model: UOM,
                  as: "uom",
                  attributes: ["id", "code", "name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${requests.length} approved requests`);

    // Format the response using the correct field names
    const formattedRequests = requests.map((request) => ({
      id: request.requestId,  // Use requestId (the model's primary key)
      requestCode: request.requestCode,
      askingStoreId: request.askingStoreId,
      askingStoreName: request.askingStore?.name || null,
      supplyingStoreId: request.supplyingStoreId,
      supplyingStoreName: request.supplyingStore?.name || null,
      requestedDate: request.requestedDate,
      status: request.status,
      remark: request.remark,
      items: request.items?.map((item) => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.item?.standardName || item.item?.name || null,
        itemCode: item.item?.code || null,
        quantity: parseFloat(item.quantity),
        uomCode: item.item?.uom?.code || null,
      })) || [],
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error("❌ Get approved requests error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 10. PROCESS REQUESTS - FIXED
// ============================================

// balanceController.js - UPDATED processRequests method

exports.processRequests = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { storeId, groupId, requestIds } = req.body;
    const userId = req.user ? req.user.userId : 1;

    console.log('📤 Processing requests payload:', { storeId, groupId, requestIds });

    if (!storeId || !groupId || !requestIds || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Store ID, Group ID, and Request IDs are required",
      });
    }

    // Filter out null/undefined request IDs
    const validRequestIds = requestIds.filter(id => id != null && id !== '');
    if (validRequestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid request IDs provided",
      });
    }

    console.log('✅ Valid request IDs:', validRequestIds);

    // Get requests with their items
    const requests = await ItemRequest.findAll({
      where: {
        requestId: { [Op.in]: validRequestIds.map(id => parseInt(id)) },
        status: "approved",
      },
      include: [
        {
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              attributes: ["id", "code", "name", "standardName"],
            },
          ],
        },
      ],
    });

    console.log(`✅ Found ${requests.length} requests to process`);

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No approved requests found with the provided IDs",
      });
    }

    let processedCount = 0;
    let failedCount = 0;
    const logs = [];
    const missingItems = [];
    const processedItems = [];

    for (const request of requests) {
      console.log(`📋 Processing request: ${request.requestCode}`);
      
      for (const item of request.items) {
        // Check if balance exists for this store and group
        const balance = await StoreBalance.findOne({
          where: {
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: item.itemId,
          },
        });

        // If balance doesn't exist, log it and skip
        if (!balance) {
          failedCount++;
          const itemName = item.item?.standardName || item.item?.name || `Item ID ${item.itemId}`;
          const itemCode = item.item?.code || 'N/A';
          logs.push(`❌ Item "${itemName}" (${itemCode}) not found in store balance for Store ID ${storeId}, Group ID ${groupId}`);
          missingItems.push({
            itemId: item.itemId,
            itemCode: itemCode,
            itemName: itemName,
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
          });
          continue;
        }

        const previousBalance = parseFloat(balance.balance);
        const quantity = parseFloat(item.quantity);
        let newBalance, transactionType, changeAmount;

        // Check if this store is the asking or supplying store
        if (request.askingStoreId === parseInt(storeId)) {
          // ADD to balance
          changeAmount = quantity;
          newBalance = previousBalance + changeAmount;
          transactionType = "Stock In";

          await StoreBalanceHistory.create({
            balanceId: balance.id,
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: item.itemId,
            previousBalance: previousBalance,
            newBalance: newBalance,
            changeAmount: changeAmount,
            transactionType: transactionType,
            sourceStoreId: request.supplyingStoreId,
            referenceType: "request",
            referenceId: request.requestId,
            changedBy: userId,
            remark: `Processed request ${request.requestCode} - ADD ${quantity} of ${item.item?.code || item.itemId}`,
          }, { transaction });

          balance.balance = newBalance;
          await balance.save({ transaction });

          processedCount++;
          const itemName = item.item?.standardName || item.item?.name || `Item ID ${item.itemId}`;
          const itemCode = item.item?.code || 'N/A';
          logs.push(`✅ ADDED ${changeAmount} of "${itemName}" (${itemCode}) to balance (${previousBalance} → ${newBalance})`);
          processedItems.push({
            itemId: item.itemId,
            itemCode: itemCode,
            itemName: itemName,
            action: 'ADD',
            quantity: changeAmount,
            previousBalance,
            newBalance,
          });

        } else if (request.supplyingStoreId === parseInt(storeId)) {
          // REMOVE from balance
          changeAmount = quantity;
          if (previousBalance < changeAmount) {
            failedCount++;
            const itemName = item.item?.standardName || item.item?.name || `Item ID ${item.itemId}`;
            const itemCode = item.item?.code || 'N/A';
            logs.push(`❌ Insufficient balance for "${itemName}" (${itemCode}) - Balance: ${previousBalance}, Requested: ${changeAmount}`);
            continue;
          }
          newBalance = previousBalance - changeAmount;
          transactionType = "Stock Out";

          await StoreBalanceHistory.create({
            balanceId: balance.id,
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: item.itemId,
            previousBalance: previousBalance,
            newBalance: newBalance,
            changeAmount: changeAmount,
            transactionType: transactionType,
            destinationStoreId: request.askingStoreId,
            referenceType: "request",
            referenceId: request.requestId,
            changedBy: userId,
            remark: `Processed request ${request.requestCode} - REMOVE ${quantity} of ${item.item?.code || item.itemId}`,
          }, { transaction });

          balance.balance = newBalance;
          await balance.save({ transaction });

          processedCount++;
          const itemName = item.item?.standardName || item.item?.name || `Item ID ${item.itemId}`;
          const itemCode = item.item?.code || 'N/A';
          logs.push(`✅ REMOVED ${changeAmount} of "${itemName}" (${itemCode}) from balance (${previousBalance} → ${newBalance})`);
          processedItems.push({
            itemId: item.itemId,
            itemCode: itemCode,
            itemName: itemName,
            action: 'REMOVE',
            quantity: changeAmount,
            previousBalance,
            newBalance,
          });
        }
      }

      // Update request status
      request.status = "finalized";
      request.finalizedAt = new Date();
      await request.save({ transaction });
    }

    await transaction.commit();

    // Prepare response with detailed information
    const responseMessage = `Processed ${processedCount} items successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`;
    
    // If there are missing items, include them in the response with helpful instructions
    if (missingItems.length > 0) {
      logs.push(`\n📋 Missing items in store balance (Store: ${storeId}, Group: ${groupId}):`);
      missingItems.forEach(item => {
        logs.push(`   - ${item.itemCode} - ${item.itemName} (ID: ${item.itemId})`);
      });
      logs.push(`\n💡 To fix: Initialize balances for these items using the "Initialize Balance" button.`);
      logs.push(`   Select Store ID: ${storeId}, Group ID: ${groupId}, and the missing items above.`);
    }

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        processed: processedCount,
        failed: failedCount,
        logs: logs,
        missingItems: missingItems,
        processedItems: processedItems,
        requestIds: validRequestIds,
        storeId: parseInt(storeId),
        groupId: parseInt(groupId),
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Process requests error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to process requests" 
    });
  }
};
// ============================================
// 11. GET ALL STORES
// ============================================
exports.getStores = async (req, res) => {
  try {
    const { page = 1, limit = 100, search } = req.query;

    const whereClause = {};
    
    if (search && search.trim()) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { code: { [Op.iLike]: `%${search.trim()}%` } },
        { location: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Store.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [["name", "ASC"]],
      attributes: ["id", "name", "code", "location", "status", "createdAt", "updatedAt"],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get stores error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 12. GET ALL GROUPS
// ============================================
exports.getGroups = async (req, res) => {
  try {
    const { page = 1, limit = 100, search } = req.query;

    const whereClause = {};
    
    if (search && search.trim()) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { code: { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Group.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [["name", "ASC"]],
      attributes: ["id", "name", "code", "description", "status", "createdAt", "updatedAt"],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 13. GET ACTIVE ITEMS
// ============================================
exports.getActiveItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { status: "Active" },
      include: [
        {
          model: UOM,
          as: "uom",
          attributes: ["id", "code", "name"],
        },
        {
          model: UOM,
          as: "conversionUom",
          attributes: ["id", "code", "name"],
        },
      ],
      order: [["name", "ASC"]],
      attributes: [
        "id", 
        "code", 
        "name", 
        "standardName", 
        "conversionValue", 
        "status"
      ],
    });

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get active items error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 14. GET STORE BY ID
// ============================================
exports.getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id, {
      attributes: ["id", "name", "code", "location", "status", "createdAt", "updatedAt"],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error("Get store by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 15. GET GROUP BY ID
// ============================================
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      attributes: ["id", "name", "code", "description", "status", "createdAt", "updatedAt"],
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Get group by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 16. GET ITEM BY ID
// ============================================
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id, {
      include: [
        {
          model: UOM,
          as: "uom",
          attributes: ["id", "code", "name"],
        },
        {
          model: UOM,
          as: "conversionUom",
          attributes: ["id", "code", "name"],
        },
      ],
      attributes: [
        "id", 
        "code", 
        "name", 
        "standardName", 
        "description",
        "brand", 
        "model", 
        "barcode", 
        "categoryId", 
        "uomId", 
        "conversionUomId",
        "conversionValue", 
        "costPrice", 
        "status", 
        "createdAt", 
        "updatedAt"
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get item by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 17. DOWNLOAD CSV TEMPLATE
// ============================================
// balanceController.js - UPDATED downloadTemplate with item codes

// ============================================
// 9. DOWNLOAD CSV TEMPLATE - WITH ITEM CODES
// ============================================
exports.downloadTemplate = async (req, res) => {
  try {
    // Get some sample items with their codes
    const sampleItems = await Item.findAll({
      limit: 5,
      attributes: ['id', 'code', 'standardName'],
      where: { status: 'Active' },
      order: [['code', 'ASC']]
    });

    // Get sample stores and groups
    const sampleStores = await Store.findAll({
      limit: 3,
      attributes: ['id', 'name'],
      order: [['id', 'ASC']]
    });

    const sampleGroups = await Group.findAll({
      limit: 3,
      attributes: ['id', 'name'],
      order: [['id', 'ASC']]
    });

    // Create headers - now using itemCode instead of itemId
    const headers = ["storeId", "groupId", "itemCode", "balance", "minStock", "status"];
    
    // Build sample data with actual item codes from database
    const sampleData = [];
    
    // If we have sample items, use them
    if (sampleItems.length > 0 && sampleStores.length > 0 && sampleGroups.length > 0) {
      sampleItems.slice(0, 3).forEach((item, index) => {
        const storeIndex = index % sampleStores.length;
        const groupIndex = index % sampleGroups.length;
        sampleData.push({
          storeId: sampleStores[storeIndex].id,
          groupId: sampleGroups[groupIndex].id,
          itemCode: item.code,  // Use the actual item code like "SDT000001"
          balance: (index + 1) * 50,
          minStock: (index + 1) * 5,
          status: "Active"
        });
      });
    } else {
      // Fallback sample data if no items found
      sampleData.push(
        { storeId: 1, groupId: 1, itemCode: "SDT000001", balance: 100, minStock: 10, status: "Active" },
        { storeId: 2, groupId: 2, itemCode: "SDT000002", balance: 200, minStock: 20, status: "Active" },
        { storeId: 3, groupId: 3, itemCode: "SDT000003", balance: 150, minStock: 15, status: "Active" }
      );
    }

    // Generate CSV content
    let csvContent = headers.join(",") + "\n";
    
    // Add data rows
    sampleData.forEach((row) => {
      const values = headers.map((h) => row[h] || "");
      csvContent += values.join(",") + "\n";
    });

    // Add comments/instructions as comments in CSV
    const comments = [
      '# ============================================',
      '# STORE BALANCE IMPORT TEMPLATE',
      '# ============================================',
      '#',
      '# INSTRUCTIONS:',
      '# 1. Use the itemCode (e.g., SDT000001) instead of numeric itemId',
      '# 2. You can find item codes in the Items list',
      '# 3. Required columns: storeId, groupId, itemCode, balance',
      '# 4. Optional: minStock, status (defaults to "Active")',
      '# 5. All columns must be in the order shown above',
      '#',
      '# Sample item codes from your system:',
    ];

    // Add sample item codes as comments
    const itemCodes = await Item.findAll({
      limit: 10,
      attributes: ['code', 'standardName'],
      where: { status: 'Active' },
      order: [['code', 'ASC']]
    });

    itemCodes.forEach(item => {
      comments.push(`#   - ${item.code}: ${item.standardName}`);
    });

    comments.push('# ============================================');
    
    // Add comments at the top of the CSV
    csvContent = comments.join("\n") + "\n" + csvContent;
    csvContent = "\uFEFF" + csvContent; // Add BOM for Excel

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=balance_import_template_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csvContent);
    
  } catch (error) {
    console.error("Download template error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 18. IMPORT BALANCES FROM CSV
// ============================================
// balanceController.js - UPDATED importBalances method with item code support

// ============================================
// 10. IMPORT BALANCES FROM CSV - WITH ITEM CODE SUPPORT
// ============================================
exports.importBalances = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const userId = req.user ? req.user.userId : 1;
    const results = [];
    const errors = [];
    let successCount = 0;
    let failedCount = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2;

      try {
        // Get values from CSV - support both itemId and itemCode
        const storeId = parseInt(row.storeId);
        const groupId = parseInt(row.groupId);
        const itemCode = row.itemCode || row.itemId; // Support both column names
        const balance = parseFloat(row.balance);
        const minStock = parseInt(row.minStock) || 0;
        const status = row.status || "Active";

        // Validate required fields
        if (isNaN(storeId) || isNaN(groupId) || !itemCode || isNaN(balance)) {
          throw new Error("storeId, groupId, itemCode, and balance are required");
        }

        // Find the item by code
        const item = await Item.findOne({
          where: { code: itemCode.trim() },
          attributes: ['id', 'code', 'name', 'standardName']
        });

        if (!item) {
          failedCount++;
          errors.push(`Row ${rowNumber}: Item with code "${itemCode}" not found`);
          continue;
        }

        const itemId = item.id;

        // Check if balance already exists
        const existing = await StoreBalance.findOne({
          where: {
            storeId: storeId,
            groupId: groupId,
            itemId: itemId,
          },
        });

        if (existing) {
          failedCount++;
          errors.push(`Row ${rowNumber}: Balance already exists for item "${itemCode}" (${item.standardName || item.name})`);
          continue;
        }

        // Create the balance record
        const balanceRecord = await StoreBalance.create({
          storeId: storeId,
          groupId: groupId,
          itemId: itemId,
          balance: balance,
          minStockAlert: minStock,
          status: status,
        }, { transaction });

        // Create history record
        await StoreBalanceHistory.create({
          balanceId: balanceRecord.id,
          storeId: storeId,
          groupId: groupId,
          itemId: itemId,
          previousBalance: 0,
          newBalance: balance,
          changeAmount: balance,
          transactionType: "Stock In",
          referenceType: "initialization",
          changedBy: userId,
          remark: `CSV import - Initial balance setup for ${itemCode}`,
        }, { transaction });

        successCount++;
        console.log(`✅ Imported: ${itemCode} (${item.standardName || item.name}) - Balance: ${balance}`);

      } catch (rowError) {
        failedCount++;
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
        console.error(`❌ Row ${rowNumber} error:`, rowError.message);
      }
    }

    await transaction.commit();
    safeDelete(req.file.path);

    // Prepare response with detailed info
    const responseData = {
      total: results.length,
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 20), // Limit errors to avoid huge response
    };

    // If there are errors, log them for debugging
    if (errors.length > 0) {
      console.log(`⚠️ Import completed with ${errors.length} errors:`);
      errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    }

    res.status(200).json({
      success: true,
      message: `Import completed: ${successCount} imported, ${failedCount} failed`,
      data: responseData,
    });

  } catch (error) {
    await transaction.rollback();
    safeDelete(req.file.path);
    console.error("❌ Import error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to import balances" 
    });
  }
};

// ============================================
// 19. EXPORT BALANCES
// ============================================
exports.exportBalances = async (req, res) => {
  try {
    const { type = "full" } = req.query;

    const balances = await StoreBalance.findAll({
      include: [
        { model: Store, as: "store" },
        { model: Group, as: "group" },
        {
          model: Item,
          as: "item",
          include: [
            { model: UOM, as: "uom" },
            { model: UOM, as: "conversionUom" },
          ],
        },
      ],
    });

    let headers, rows;

    if (type === "full") {
      headers = ["#", "Store", "Group", "Item Code", "Item Name", "UOM", "Conversion", "Balance", "Base Balance", "Status"];
      rows = balances.map((record, index) => {
        const item = record.item;
        const conversionValue = parseFloat(item?.conversionValue) || 1;
        return [
          index + 1,
          record.store?.name || "",
          record.group?.name || "",
          item?.code || "",
          item?.standardName || item?.name || "",
          item?.uom?.code || "",
          conversionValue > 1 ? `${conversionValue} ${item?.conversionUom?.code || ''} = 1 ${item?.uom?.code || ''}` : `1 ${item?.uom?.code || ''} = 1 ${item?.uom?.code || ''}`,
          parseFloat(record.balance),
          getBaseBalance(parseFloat(record.balance), conversionValue),
          record.status,
        ];
      });
    } else {
      const storeSummary = {};
      balances.forEach((record) => {
        const key = record.storeId;
        if (!storeSummary[key]) {
          storeSummary[key] = {
            storeName: record.store?.name || "Unknown",
            totalItems: 0,
            totalBalance: 0,
            totalBaseBalance: 0,
          };
        }
        storeSummary[key].totalItems++;
        storeSummary[key].totalBalance += parseFloat(record.balance);
        const item = record.item;
        const conversionValue = parseFloat(item?.conversionValue) || 1;
        storeSummary[key].totalBaseBalance += getBaseBalance(parseFloat(record.balance), conversionValue);
      });

      headers = ["Store Name", "Total Items", "Total Balance", "Total Base Balance"];
      rows = Object.values(storeSummary).map((summary) => [
        summary.storeName,
        summary.totalItems,
        summary.totalBalance.toFixed(2),
        summary.totalBaseBalance.toFixed(2),
      ]);
    }

    const parser = new Parser({ fields: headers });
    const csv = parser.parse(rows);
    const csvWithBOM = "\uFEFF" + csv;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=store_balance_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csvWithBOM);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 20. GET BALANCE HISTORY
// ============================================
exports.getBalanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const balance = await StoreBalance.findByPk(id);
    if (!balance) {
      return res.status(404).json({
        success: false,
        error: "Balance not found",
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await StoreBalanceHistory.findAndCountAll({
      where: { balanceId: parseInt(id) },
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["id", "name"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["id", "code", "name", "standardName"],
          include: [
            {
              model: UOM,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
        {
          model: Store,
          as: "sourceStore",
          attributes: ["id", "name"],
        },
        {
          model: Store,
          as: "destinationStore",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "changedByUser",
          attributes: ["userId", "username", "fullName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    const formattedHistory = rows.map((record) => ({
      id: record.id,
      balanceId: record.balanceId,
      storeName: record.store?.name || null,
      groupName: record.group?.name || null,
      itemName: record.item?.standardName || record.item?.name || null,
      itemCode: record.item?.code || null,
      uomCode: record.item?.uom?.code || null,
      previousBalance: parseFloat(record.previousBalance),
      newBalance: parseFloat(record.newBalance),
      changeAmount: parseFloat(record.changeAmount),
      transactionType: record.transactionType,
      sourceStore: record.sourceStore?.name || null,
      destinationStore: record.destinationStore?.name || null,
      referenceType: record.referenceType,
      referenceId: record.referenceId,
      changedBy: record.changedByUser?.fullName || record.changedByUser?.username || null,
      remark: record.remark,
      createdAt: record.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get balance history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 21. GET SUMMARY BY STORE
// ============================================
exports.getSummaryByStore = async (req, res) => {
  try {
    const balances = await StoreBalance.findAll({
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "code"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["id", "conversionValue"],
        },
      ],
    });

    const summary = {};
    balances.forEach((record) => {
      const storeId = record.storeId;
      if (!summary[storeId]) {
        summary[storeId] = {
          storeId: storeId,
          storeName: record.store?.name || "Unknown",
          storeCode: record.store?.code || null,
          totalItems: 0,
          totalBalance: 0,
          totalBaseBalance: 0,
          activeItems: 0,
          inactiveItems: 0,
          lowStockItems: 0,
          zeroStockItems: 0,
        };
      }

      const balance = parseFloat(record.balance);
      summary[storeId].totalItems++;
      summary[storeId].totalBalance += balance;
      
      const conversionValue = parseFloat(record.item?.conversionValue) || 1;
      summary[storeId].totalBaseBalance += balance * conversionValue;
      
      if (record.status === "Active") {
        summary[storeId].activeItems++;
        if (balance === 0) {
          summary[storeId].zeroStockItems++;
        } else if (balance <= parseFloat(record.minStockAlert)) {
          summary[storeId].lowStockItems++;
        }
      } else {
        summary[storeId].inactiveItems++;
      }
    });

    const formattedSummary = Object.values(summary).map((s) => ({
      ...s,
      totalBalance: s.totalBalance.toFixed(2),
      totalBaseBalance: s.totalBaseBalance.toFixed(2),
      lowStockPercentage: s.activeItems > 0 ? ((s.lowStockItems / s.activeItems) * 100).toFixed(1) : 0,
      zeroStockPercentage: s.activeItems > 0 ? ((s.zeroStockItems / s.activeItems) * 100).toFixed(1) : 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedSummary,
    });
  } catch (error) {
    console.error("Get summary by store error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 22. GET SUMMARY BY GROUP
// ============================================
exports.getSummaryByGroup = async (req, res) => {
  try {
    const balances = await StoreBalance.findAll({
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name", "code"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["id", "conversionValue"],
        },
      ],
    });

    const summary = {};
    balances.forEach((record) => {
      const groupId = record.groupId;
      if (!summary[groupId]) {
        summary[groupId] = {
          groupId: groupId,
          groupName: record.group?.name || "Unknown",
          groupCode: record.group?.code || null,
          totalItems: 0,
          totalBalance: 0,
          totalBaseBalance: 0,
          activeItems: 0,
          inactiveItems: 0,
          lowStockItems: 0,
          zeroStockItems: 0,
        };
      }

      const balance = parseFloat(record.balance);
      summary[groupId].totalItems++;
      summary[groupId].totalBalance += balance;
      
      const conversionValue = parseFloat(record.item?.conversionValue) || 1;
      summary[groupId].totalBaseBalance += balance * conversionValue;
      
      if (record.status === "Active") {
        summary[groupId].activeItems++;
        if (balance === 0) {
          summary[groupId].zeroStockItems++;
        } else if (balance <= parseFloat(record.minStockAlert)) {
          summary[groupId].lowStockItems++;
        }
      } else {
        summary[groupId].inactiveItems++;
      }
    });

    const formattedSummary = Object.values(summary).map((s) => ({
      ...s,
      totalBalance: s.totalBalance.toFixed(2),
      totalBaseBalance: s.totalBaseBalance.toFixed(2),
      lowStockPercentage: s.activeItems > 0 ? ((s.lowStockItems / s.activeItems) * 100).toFixed(1) : 0,
      zeroStockPercentage: s.activeItems > 0 ? ((s.zeroStockItems / s.activeItems) * 100).toFixed(1) : 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedSummary,
    });
  } catch (error) {
    console.error("Get summary by group error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 23. GET SUMMARY BY ITEM
// ============================================
exports.getSummaryByItem = async (req, res) => {
  try {
    const balances = await StoreBalance.findAll({
      include: [
        {
          model: Item,
          as: "item",
          attributes: ["id", "code", "name", "standardName", "conversionValue"],
          include: [
            {
              model: UOM,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
        {
          model: Store,
          as: "store",
          attributes: ["id", "name"],
        },
      ],
    });

    const summary = {};
    balances.forEach((record) => {
      const itemId = record.itemId;
      if (!summary[itemId]) {
        summary[itemId] = {
          itemId: itemId,
          itemCode: record.item?.code || null,
          itemName: record.item?.standardName || record.item?.name || null,
          itemCommonName: record.item?.standardName || record.item?.name || null,
          uomCode: record.item?.uom?.code || null,
          conversionValue: parseFloat(record.item?.conversionValue) || 1,
          totalStores: 0,
          totalBalance: 0,
          totalBaseBalance: 0,
          minBalance: Infinity,
          maxBalance: -Infinity,
          stores: [],
        };
      }

      const balance = parseFloat(record.balance);
      const baseBalance = balance * (parseFloat(record.item?.conversionValue) || 1);
      
      summary[itemId].totalStores++;
      summary[itemId].totalBalance += balance;
      summary[itemId].totalBaseBalance += baseBalance;
      
      if (balance < summary[itemId].minBalance) summary[itemId].minBalance = balance;
      if (balance > summary[itemId].maxBalance) summary[itemId].maxBalance = balance;
      
      summary[itemId].stores.push({
        storeId: record.storeId,
        storeName: record.store?.name || null,
        balance: balance,
        baseBalance: baseBalance,
        status: record.status,
      });
    });

    const formattedSummary = Object.values(summary).map((s) => ({
      ...s,
      totalBalance: s.totalBalance.toFixed(2),
      totalBaseBalance: s.totalBaseBalance.toFixed(2),
      averageBalance: (s.totalBalance / s.totalStores).toFixed(2),
      averageBaseBalance: (s.totalBaseBalance / s.totalStores).toFixed(2),
      minBalance: s.minBalance === Infinity ? 0 : s.minBalance,
      maxBalance: s.maxBalance === -Infinity ? 0 : s.maxBalance,
    }));

    res.status(200).json({
      success: true,
      data: formattedSummary,
    });
  } catch (error) {
    console.error("Get summary by item error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 24. GET ALL ITEMS
// ============================================
exports.getItems = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, categoryId, status } = req.query;

    const whereClause = {};
    const include = [
      {
        model: UOM,
        as: "uom",
        attributes: ["id", "code", "name"],
      },
      {
        model: UOM,
        as: "conversionUom",
        attributes: ["id", "code", "name"],
      },
    ];

    if (status) {
      whereClause.status = status;
    }

    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { code: { [Op.iLike]: `%${search.trim()}%` } },
        { standardName: { [Op.iLike]: `%${search.trim()}%` } },
        { brand: { [Op.iLike]: `%${search.trim()}%` } },
        { barcode: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Item.findAndCountAll({
      where: whereClause,
      include: include,
      limit: parseInt(limit),
      offset: offset,
      order: [["name", "ASC"]],
      attributes: [
        "id", 
        "code", 
        "name", 
        "standardName", 
        "description",
        "brand", 
        "model", 
        "barcode", 
        "categoryId", 
        "uomId", 
        "conversionUomId",
        "conversionValue", 
        "costPrice", 
        "status", 
        "createdAt", 
        "updatedAt"
      ],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 25. GET ALL USERS
// ============================================
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, role } = req.query;

    const whereClause = {};
    
    if (search && search.trim()) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { fullName: { [Op.iLike]: `%${search.trim()}%` } },
        { email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [["fullName", "ASC"]],
      attributes: [
        "userId", "username", "email", "fullName", "role", 
        "isActive", "lastLogin", "createdAt", "updatedAt"
      ],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 26. GET USER BY ID
// ============================================
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: [
        "userId", "username", "email", "fullName", "role", 
        "isActive", "lastLogin", "createdAt", "updatedAt"
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// ============================================
// 27. GET USER BY ID
// ============================================
exports.getStoreGroupRelations = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // If storeId is provided, get groups for that specific store
    if (storeId) {
      const store = await Store.findByPk(parseInt(storeId), {
        include: [
          {
            model: Group,
            as: 'groups',
            through: { attributes: [] },
            attributes: ['groupId', 'code', 'name', 'description', 'status'],
          },
        ],
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          error: "Store not found"
        });
      }

      const formattedGroups = store.groups.map(group => ({
        id: group.groupId,
        code: group.code,
        name: group.name,
        description: group.description,
        status: group.status,
      }));

      return res.status(200).json({
        success: true,
        data: formattedGroups,
      });
    }

    // If no storeId, get all store-group relations
    const relations = await StoreGroupRelation.findAll({
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'code', 'name', 'description', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedRelations = relations.map(relation => ({
      id: relation.id,
      storeId: relation.storeId,
      storeName: relation.store?.name || null,
      groupId: relation.groupId,
      groupName: relation.group?.name || null,
      groupCode: relation.group?.code || null,
      createdAt: relation.createdAt,
      updatedAt: relation.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedRelations
    });
  } catch (error) {
    console.error("❌ Get store-group relations error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};