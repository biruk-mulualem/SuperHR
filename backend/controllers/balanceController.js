// balanceController.js - COMPLETE FIXED VERSION

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { Parser } = require("json2csv");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const { getUserStoreAndGroup } = require("../utils/userAccess");

// Import models using destructuring
const {
  StoreBalance,
  StoreBalanceHistory,
  ItemRequest,
  ItemRequestDetail,
  Store,
  Group,
  Category,
  Item,
  UOM,
  StoreGroupRelation,
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
  if (balance === 0) return "zero";
  if (balance <= minStockAlert) return "low";
  return "normal";
};

const getBaseBalance = (balance, conversionValue) => {
  return balance * conversionValue;
};

// ================================================================
// 🔥 FIXED: HELPER FUNCTION: Check and Finalize Request
// ================================================================

async function checkAndFinalizeRequest(request, storeId, transaction, logs, finalizedRequests) {
  try {
    console.log(`🔍 Checking if all groups have processed request ${request.requestCode}`);
    console.log(`🔍 Request ID: ${request.requestId}, Store ID: ${storeId}`);

    // Get ALL groups for this store (both asking and supplying)
    const storeGroupsRaw = await sequelize.query(
      `SELECT g.id, g.name, g.status 
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = ? AND g.status = 'Active'`,
      {
        replacements: [parseInt(storeId)],
        type: sequelize.QueryTypes.SELECT,
        transaction: transaction
      }
    );

    // Ensure it's an array
    const groupsArray = Array.isArray(storeGroupsRaw) ? storeGroupsRaw : [];
    console.log(`📋 Found ${groupsArray.length} groups for store ${storeId}`);

    if (groupsArray.length === 0) {
      console.log(`⚠️ No groups found for store ${storeId}, auto-finalizing`);
      
      await ItemRequest.update(
        {
          status: 'finalized',
          finalizedAt: new Date()
        },
        {
          where: { requestId: request.requestId },
          transaction: transaction
        }
      );
      
      request.status = 'finalized';
      request.finalizedAt = new Date();
      
      if (logs) logs.push(`✅ Request ${request.requestCode} FINALIZED - No groups in store, auto-finalized`);
      
      if (finalizedRequests) {
        finalizedRequests.push({
          requestId: request.requestId,
          requestCode: request.requestCode,
          finalizedAt: request.finalizedAt
        });
      }
      
      return true;
    }

    const allGroupIds = groupsArray.map(g => parseInt(g.id));
    console.log(`📋 All groups for store ${storeId}:`, allGroupIds);

    // Get ALL processed records for this request (both processed and skipped)
    const RequestGroupProcessing = sequelize.models.RequestGroupProcessing;
    const processedRecords = await RequestGroupProcessing.findAll({
      where: {
        requestId: request.requestId,
        status: { [Op.in]: ['processed', 'skipped'] }
      },
      transaction: transaction
    });

    const processedGroupIds = processedRecords
      .map(r => parseInt(r.groupId))
      .filter(id => !isNaN(id));

    console.log(`📋 Processed groups for request ${request.requestCode}:`, processedGroupIds);

    // Check if ALL groups have processed or been skipped
    const allProcessed = allGroupIds.length > 0 && 
                          allGroupIds.every(g => processedGroupIds.includes(g));
    const remainingGroups = allGroupIds.filter(g => !processedGroupIds.includes(g));

    console.log(`📋 allProcessed: ${allProcessed}`);
    console.log(`📋 remainingGroups:`, remainingGroups);

    if (allProcessed && allGroupIds.length > 0) {
      console.log(`✅ ALL GROUPS HAVE PROCESSED! Finalizing request ${request.requestCode}`);
      
      // Update the request status within the same transaction
      await ItemRequest.update(
        {
          status: 'finalized',
          finalizedAt: new Date()
        },
        {
          where: { requestId: request.requestId },
          transaction: transaction
        }
      );
      
      // Also update the in-memory object
      request.status = 'finalized';
      request.finalizedAt = new Date();
      
      console.log(`✅ Request ${request.requestCode} FINALIZED - All ${allGroupIds.length} groups have processed`);
      if (logs) logs.push(`✅ Request ${request.requestCode} FINALIZED - All ${allGroupIds.length} groups have processed`);
      
      if (finalizedRequests) {
        finalizedRequests.push({
          requestId: request.requestId,
          requestCode: request.requestCode,
          finalizedAt: request.finalizedAt
        });
      }
      
      return true;
    } else if (remainingGroups.length > 0) {
      const remainingNames = remainingGroups.map(g => {
        const grp = groupsArray.find(g2 => parseInt(g2.id) === g);
        return grp ? grp.name : g;
      });
      const msg = `⏳ Request ${request.requestCode} PARTIALLY PROCESSED - ${remainingGroups.length} group(s) remaining: ${remainingNames.join(', ')}`;
      console.log(msg);
      if (logs) logs.push(msg);
      return false;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error in checkAndFinalizeRequest for ${request.requestCode}:`, error);
    if (logs) logs.push(`❌ Error checking finalization for ${request.requestCode}: ${error.message}`);
    return false;
  }
}

// ============================================
// 1. GET ALL BALANCES WITH FILTERS
// ============================================

exports.getBalances = async (req, res) => {
  try {
    const {
      storeId,
      groupId,
      categoryId,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const whereClause = {};

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
        attributes: [
          "itemId",
          "code",
          "name",
          "standardName",
          "conversionValue",
          "uomId",
          "conversionUomId",
          "categoryId",
        ],
        include: [
          {
            model: UOM,
            as: "uom",
            attributes: ["uomId", "code", "name"],
          },
          {
            model: UOM,
            as: "conversionUom",
            attributes: ["uomId", "code", "name"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["categoryId", "name", "status"],
          },
        ],
      },
    ];

    if (categoryId) {
      include[2].where = { categoryId: parseInt(categoryId) };
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;

      whereClause[Op.or] = [
        { "$item.name$": { [Op.iLike]: searchTerm } },
        { "$item.code$": { [Op.iLike]: searchTerm } },
        { "$item.standard_name$": { [Op.iLike]: searchTerm } },
        { "$store.name$": { [Op.iLike]: searchTerm } },
        { "$item->category.name$": { [Op.iLike]: searchTerm } },
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

    const formattedRows = rows.map((record) => {
      const item = record.item;
      const uom = item?.uom;
      const conversionUom = item?.conversionUom;
      const category = item?.category;

      const conversionValue =
        item?.conversionValue !== undefined && item?.conversionValue !== null
          ? parseFloat(item.conversionValue)
          : 1;

      const itemName = item?.name || null;
      const standardName = item?.standardName || null;

      return {
        id: record.id,
        storeId: record.storeId,
        storeName: record.store?.name || null,
        groupId: record.groupId,
        groupName: record.group?.name || null,
        itemId: record.itemId,
        itemCode: item?.code || null,
        itemStandardName: standardName,
        itemCommonName: itemName || standardName || null,
        categoryId: category?.categoryId || null,
        categoryName: category?.name || null,
        uomCode: uom?.code || null,
        uomName: uom?.name || null,
        conversionUomCode: conversionUom?.code || null,
        conversionValue: conversionValue,
        balance: parseFloat(record.balance),
        minStock: parseFloat(record.minStockAlert) || 0,
        baseBalance: getBaseBalance(
          parseFloat(record.balance),
          conversionValue,
        ),
        status: record.status,
        statusClass: getBalanceClass(
          parseFloat(record.balance),
          parseFloat(record.minStockAlert) || 0,
        ),
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
// GET ALL CATEGORIES
// ============================================
exports.getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, status } = req.query;

    const whereClause = {};

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { description: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Category.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [["name", "ASC"]],
      attributes: [
        "categoryId",
        "name",
        "description",
        "status",
        "createdAt",
        "updatedAt",
      ],
    });

    const formattedRows = rows.map((category) => ({
      id: category.categoryId,
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

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
    console.error("Get categories error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET ACTIVE CATEGORIES
// ============================================
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: "Active" },
      order: [["name", "ASC"]],
      attributes: ["categoryId", "name", "description", "status"],
    });

    const formattedRows = categories.map((category) => ({
      id: category.categoryId,
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      status: category.status,
    }));

    res.status(200).json({
      success: true,
      data: formattedRows,
    });
  } catch (error) {
    console.error("Get active categories error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET CATEGORY BY ID
// ============================================
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      attributes: [
        "categoryId",
        "name",
        "description",
        "status",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const formattedData = {
      id: category.categoryId,
      categoryId: category.categoryId,
      name: category.name,
      description: category.description,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET ITEMS BY CATEGORY
// ============================================
exports.getItemsByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const items = await Item.findAll({
      where: {
        categoryId: parseInt(id),
        status: "Active",
      },
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
        "itemId",
        "code",
        "name",
        "standardName",
        "description",
        "brand",
        "model",
        "barcode",
        "conversionValue",
        "status",
      ],
    });

    const formattedItems = items.map((item) => ({
      id: item.itemId,
      itemId: item.itemId,
      code: item.code,
      name: item.name,
      standardName: item.standardName,
      description: item.description || "",
      brand: item.brand || "",
      model: item.model || "",
      barcode: item.barcode || "",
      conversionValue: parseFloat(item.conversionValue) || 1,
      status: item.status,
      uomCode: item.uom?.code || null,
      uomName: item.uom?.name || null,
      conversionUomCode: item.conversionUom?.code || null,
      conversionUomName: item.conversionUom?.name || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        category: {
          id: category.categoryId,
          name: category.name,
          description: category.description,
          status: category.status,
        },
        items: formattedItems,
        total: formattedItems.length,
      },
    });
  } catch (error) {
    console.error("Get items by category error:", error);
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
// 5. CREATE BALANCE (INITIALIZE)
// ============================================

exports.createBalance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { storeId, groupId, itemId, balance, minStock, status } = req.body;

    let userId = req.user?.userId || null;

    if (!userId) {
      const defaultUser = await User.findOne({
        where: { isActive: true },
        attributes: ["userId"],
        order: [["userId", "ASC"]],
      });
      userId = defaultUser ? defaultUser.userId : null;
    }

    console.log("📦 Create balance request body:", req.body);
    console.log("👤 Using userId:", userId);

    if (!storeId || !groupId || !itemId) {
      return res.status(400).json({
        success: false,
        error: "Store, Group, and Item are required",
      });
    }

    const storeIdInt = parseInt(storeId);
    const groupIdInt = parseInt(groupId);
    const itemIdInt = parseInt(itemId);
    const balanceFloat = parseFloat(balance) || 0;
    const minStockFloat = parseFloat(minStock) || 0;
    const statusStr = status || "Active";

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

    const balanceRecord = await StoreBalance.create(
      {
        storeId: storeIdInt,
        groupId: groupIdInt,
        itemId: itemIdInt,
        balance: balanceFloat,
        minStockAlert: minStockFloat,
        status: statusStr,
      },
      { transaction },
    );

    if (userId) {
      await StoreBalanceHistory.create(
        {
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
        },
        { transaction },
      );
    } else {
      console.warn(
        "⚠️ No valid userId found, skipping history record creation",
      );
    }

    await transaction.commit();

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
      statusClass: getBalanceClass(
        parseFloat(createdRecord.balance),
        parseFloat(createdRecord.minStockAlert) || 0,
      ),
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

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to create balance",
    });
  }
};

// ============================================
// 6. UPDATE BALANCE
// ============================================
exports.updateBalance = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { storeId, groupId, itemId, minStock, status } = req.body;

    console.log("📝 Update balance payload:", {
      id,
      storeId,
      groupId,
      itemId,
      minStock,
      status,
    });

    const balance = await StoreBalance.findByPk(id);

    if (!balance) {
      return res.status(404).json({
        success: false,
        error: "Balance not found",
      });
    }

    const storeIdInt = storeId ? parseInt(storeId) : balance.storeId;
    const groupIdInt = groupId ? parseInt(groupId) : balance.groupId;
    const itemIdInt = itemId ? parseInt(itemId) : balance.itemId;

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
          error:
            "Another balance already exists for this store, group, and item",
        });
      }
    }

    await balance.update(
      {
        storeId: storeIdInt,
        groupId: groupIdInt,
        itemId: itemIdInt,
        minStockAlert:
          minStock !== undefined ? parseFloat(minStock) : balance.minStockAlert,
        status: status || balance.status,
      },
      { transaction },
    );

    await transaction.commit();

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
      statusClass: getBalanceClass(
        parseFloat(updatedRecord.balance),
        parseFloat(updatedRecord.minStockAlert) || 0,
      ),
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

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
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
// GET APPROVED REQUESTS - WITH GROUP PROCESSING FILTER
// ============================================

exports.getApprovedRequests = async (req, res) => {
  try {
    const { storeId } = req.params;
    const groupId = req.query.groupId;

    console.log(
      "🔍 Fetching approved requests for storeId:",
      storeId,
      "groupId:",
      groupId,
    );

    const whereClause = {
      status: "approved",
      [Op.or]: [
        { askingStoreId: parseInt(storeId) },
        { supplyingStoreId: parseInt(storeId) },
      ],
    };

    const requests = await ItemRequest.findAll({
      where: whereClause,
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

    console.log(`✅ Found ${requests.length} total approved requests`);

    let filteredRequests = requests;
    if (groupId) {
      const requestIds = requests.map((r) => r.requestId);

      const RequestGroupProcessing = sequelize.models.RequestGroupProcessing;

      if (RequestGroupProcessing) {
        const groupIdInt = parseInt(groupId);
        
        const processingRecords = await RequestGroupProcessing.findAll({
          where: {
            requestId: { [Op.in]: requestIds },
            groupId: groupIdInt,
          },
          attributes: ["requestId", "status"],
        });

        const processedRequestIds = new Set(
          processingRecords
            .filter((r) => r.status === "processed")
            .map((r) => parseInt(r.requestId)),
        );

        filteredRequests = requests.filter(
          (r) => !processedRequestIds.has(parseInt(r.requestId)),
        );
        console.log(
          `✅ ${filteredRequests.length} requests remaining after filtering out processed ones`,
        );
      }
    }

    const formattedRequests = filteredRequests.map((request) => ({
      id: request.requestId,
      requestCode: request.requestCode,
      askingStoreId: request.askingStoreId,
      askingStoreName: request.askingStore?.name || null,
      supplyingStoreId: request.supplyingStoreId,
      supplyingStoreName: request.supplyingStore?.name || null,
      requestedDate: request.requestedDate,
      status: request.status,
      remark: request.remark,
      items:
        request.items?.map((item) => ({
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
      meta: {
        total: requests.length,
        remaining: filteredRequests.length,
        groupId: groupId || null,
        storeId: parseInt(storeId),
      },
    });
  } catch (error) {
    console.error("❌ Get approved requests error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// PROCESS REQUESTS - COMPLETE PRODUCTION VERSION
// ============================================

exports.processRequests = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { storeId, groupId, requestIds } = req.body;

    console.log("📤 Processing requests payload:", {
      storeId,
      groupId,
      requestIds,
    });

    if (!storeId || !groupId || !requestIds || requestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Store ID, Group ID, and Request IDs are required",
      });
    }

    const validRequestIds = requestIds.filter((id) => id != null && id !== "");
    if (validRequestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No valid request IDs provided",
      });
    }

    console.log("✅ Valid request IDs:", validRequestIds);

    let userId = req.user?.userId || null;

    if (!userId) {
      const defaultUser = await User.findOne({
        where: { isActive: true },
        attributes: ["userId"],
        order: [["userId", "ASC"]],
      });
      userId = defaultUser ? defaultUser.userId : null;
    }

    if (!userId) {
      const anyUser = await User.findOne({
        attributes: ["userId"],
        order: [["userId", "ASC"]],
      });
      userId = anyUser ? anyUser.userId : null;
    }

    if (!userId) {
      throw new Error("No valid user found to process request");
    }

    console.log("👤 Using userId:", userId);

    const RequestGroupProcessing = sequelize.models.RequestGroupProcessing;
    if (!RequestGroupProcessing) {
      throw new Error("RequestGroupProcessing model not found");
    }

    const group = await Group.findByPk(parseInt(groupId));
    if (!group) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    if (group.status !== "Active") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Group "${group.name}" is ${group.status}. Only active groups can process requests.`,
      });
    }

    const store = await Store.findByPk(parseInt(storeId));
    if (!store) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    if (store.status !== "Active") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: `Store "${store.name}" is ${store.status}. Only active stores can process requests.`,
      });
    }

    const storeGroupRelation = await StoreGroupRelation.findOne({
      where: {
        storeId: parseInt(storeId),
        groupId: parseInt(groupId),
      },
    });

    if (!storeGroupRelation) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: `Group "${group.name}" does not have access to store "${store.name}"`,
      });
    }

    const requests = await ItemRequest.findAll({
      where: {
        requestId: { [Op.in]: validRequestIds.map((id) => parseInt(id)) },
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
              attributes: [
                "id",
                "code",
                "name",
                "standardName",
                "conversionValue",
                "status",
              ],
            },
          ],
        },
      ],
    });

    console.log(`✅ Found ${requests.length} requests to process`);

    if (requests.length === 0) {
      await transaction.rollback();
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
    const allAutoInitializedItems = [];
    const allSkippedGroups = [];
    const processedRequestIds = [];
    const partialRequests = [];
    const finalizedRequests = [];

    for (const request of requests) {
      console.log(`📋 Processing request: ${request.requestCode}`);

      const existingRecord = await RequestGroupProcessing.findOne({
        where: {
          requestId: request.requestId,
          groupId: parseInt(groupId),
        },
      });

      if (existingRecord && existingRecord.status === "processed") {
        logs.push(
          `⏭️ Group "${group.name}" has already processed request ${request.requestCode}`,
        );
        processedRequestIds.push(request.requestId);
        await checkAndFinalizeRequest(request, parseInt(storeId), transaction, logs, finalizedRequests);
        continue;
      }

      if (existingRecord && existingRecord.status === "skipped") {
        logs.push(
          `⏭️ Group "${group.name}" was skipped for request ${request.requestCode} by admin`,
        );
        allSkippedGroups.push({
          requestCode: request.requestCode,
          groupName: group.name,
          reason: existingRecord.remark || "Skipped by admin",
        });
        processedRequestIds.push(request.requestId);
        await checkAndFinalizeRequest(request, parseInt(storeId), transaction, logs, finalizedRequests);
        continue;
      }

      if (
        request.askingStoreId !== parseInt(storeId) &&
        request.supplyingStoreId !== parseInt(storeId)
      ) {
        logs.push(
          `❌ Request ${request.requestCode} is not relevant to store ${store.name}`,
        );
        failedCount++;
        continue;
      }

      let action, transactionType, changeMultiplier, actionLabel;
      if (request.askingStoreId === parseInt(storeId)) {
        action = "STOCK_IN";
        transactionType = "Stock In";
        changeMultiplier = 1;
        actionLabel = "RECEIVED";
      } else if (request.supplyingStoreId === parseInt(storeId)) {
        action = "STOCK_OUT";
        transactionType = "Stock Out";
        changeMultiplier = -1;
        actionLabel = "SENT";
      } else {
        logs.push(
          `❌ Request ${request.requestCode}: Store is neither asking nor supplying`,
        );
        failedCount++;
        continue;
      }

      console.log(`📋 Action: ${action} for request ${request.requestCode}`);

      const requestResults = [];
      const requestErrors = [];
      const requestAutoInitialized = [];

      for (const item of request.items) {
        try {
          if (!item.item) {
            requestErrors.push(`Item ID ${item.itemId} not found in database`);
            missingItems.push({
              itemId: item.itemId,
              itemCode: "N/A",
              itemName: "Unknown Item (deleted)",
              reason: "Item not found in database",
              requestCode: request.requestCode,
              storeId: parseInt(storeId),
              groupId: parseInt(groupId),
            });
            continue;
          }

          if (item.item.status !== "Active") {
            requestErrors.push(
              `Item "${item.item.code}" is ${item.item.status}`,
            );
            missingItems.push({
              itemId: item.itemId,
              itemCode: item.item.code || "N/A",
              itemName:
                item.item.standardName || item.item.name || "Unknown Item",
              reason: `Item status is ${item.item.status}`,
              requestCode: request.requestCode,
              storeId: parseInt(storeId),
              groupId: parseInt(groupId),
            });
            continue;
          }

          let balance = await StoreBalance.findOne({
            where: {
              storeId: parseInt(storeId),
              groupId: parseInt(groupId),
              itemId: item.itemId,
            },
          });

          if (!balance) {
            console.log(
              `📦 Auto-initializing balance for item: ${item.item.code} (Group: ${group.name})`,
            );

            balance = await StoreBalance.create(
              {
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: item.itemId,
                balance: 0,
                minStockAlert: 0,
                status: "Active",
              },
              { transaction },
            );

            await StoreBalanceHistory.create(
              {
                balanceId: balance.id,
                storeId: parseInt(storeId),
                groupId: parseInt(groupId),
                itemId: item.itemId,
                previousBalance: 0,
                newBalance: 0,
                changeAmount: 0,
                transactionType: "Stock In",
                referenceType: "auto_initialization",
                referenceId: request.requestId,
                changedBy: userId,
                remark: `Auto-initialized for request ${request.requestCode} - Group: ${group.name}`,
              },
              { transaction },
            );

            requestAutoInitialized.push({
              itemId: item.itemId,
              itemCode: item.item.code || "N/A",
              itemName:
                item.item.standardName || item.item.name || "Unknown Item",
            });

            allAutoInitializedItems.push({
              requestCode: request.requestCode,
              itemCode: item.item.code || "N/A",
              itemName:
                item.item.standardName || item.item.name || "Unknown Item",
            });
          }

          if (balance.status !== "Active") {
            requestErrors.push(
              `Balance for item "${item.item.code}" is ${balance.status}`,
            );
            continue;
          }

          const previousBalance = parseFloat(balance.balance);
          const quantity = parseFloat(item.quantity);
          const changeAmount = quantity * changeMultiplier;
          const newBalance = previousBalance + changeAmount;

          if (action === "STOCK_OUT" && newBalance < 0) {
            requestErrors.push(
              `Insufficient balance for "${item.item.code || item.itemId}". Balance: ${previousBalance}, Requested: ${quantity}`,
            );
            continue;
          }

          balance.balance = newBalance;
          await balance.save({ transaction });

          await StoreBalanceHistory.create(
            {
              balanceId: balance.id,
              storeId: parseInt(storeId),
              groupId: parseInt(groupId),
              itemId: item.itemId,
              previousBalance: previousBalance,
              newBalance: newBalance,
              changeAmount: Math.abs(changeAmount),
              transactionType: transactionType,
              sourceStoreId:
                action === "STOCK_IN" ? request.supplyingStoreId : null,
              destinationStoreId:
                action === "STOCK_OUT" ? request.askingStoreId : null,
              referenceType: "request",
              referenceId: request.requestId,
              changedBy: userId,
              remark: `Processed request ${request.requestCode} for group ${group.name} - ${actionLabel} ${quantity} ${item.item?.code || ""}`,
            },
            { transaction },
          );

          requestResults.push({
            itemId: item.itemId,
            itemName: item.item?.standardName || item.item?.name || "Unknown",
            itemCode: item.item?.code || "N/A",
            previousBalance,
            newBalance,
            changeAmount: Math.abs(changeAmount),
            action: action === "STOCK_IN" ? "ADDED" : "REMOVED",
            wasAutoInitialized: requestAutoInitialized.some(
              (ai) => ai.itemId === item.itemId,
            ),
          });

          processedCount++;
          processedItems.push({
            requestCode: request.requestCode,
            itemId: item.itemId,
            itemCode: item.item?.code || "N/A",
            itemName: item.item?.standardName || item.item?.name || "Unknown",
            action: action === "STOCK_IN" ? "ADDED" : "REMOVED",
            quantity: Math.abs(changeAmount),
            previousBalance,
            newBalance,
          });

          console.log(
            `✅ ${action === "STOCK_IN" ? "ADDED" : "REMOVED"} ${quantity} of ${item.item?.code || item.itemId} (Balance: ${previousBalance} → ${newBalance})`,
          );
        } catch (itemError) {
          console.error(`❌ Error processing item ${item.itemId}:`, itemError);
          requestErrors.push(
            `Error processing item ${item.itemId}: ${itemError.message}`,
          );
        }
      }

      if (requestResults.length > 0 || requestErrors.length > 0) {
        const remark =
          requestResults.length > 0
            ? `Processed ${requestResults.length} items for request ${request.requestCode}${requestAutoInitialized.length > 0 ? ` (${requestAutoInitialized.length} auto-initialized)` : ""}`
            : "No items processed - errors occurred";

        if (existingRecord) {
          existingRecord.status = "processed";
          existingRecord.processedAt = new Date();
          existingRecord.processedBy = userId;
          existingRecord.remark = remark;
          await existingRecord.save({ transaction });
        } else {
          await RequestGroupProcessing.create(
            {
              requestId: request.requestId,
              groupId: parseInt(groupId),
              storeId: parseInt(storeId),
              processedAt: new Date(),
              status: "processed",
              processedBy: userId,
              remark: remark,
            },
            { transaction },
          );
        }

        if (requestResults.length > 0) {
          logs.push(
            `✅ Request ${request.requestCode}: Processed ${requestResults.length} items${requestAutoInitialized.length > 0 ? ` (${requestAutoInitialized.length} auto-initialized)` : ""}`,
          );
        }
      }

      if (requestErrors.length > 0) {
        logs.push(
          `⚠️ Request ${request.requestCode}: ${requestErrors.length} errors occurred`,
        );
        requestErrors.forEach((err) => logs.push(`   - ${err}`));
        failedCount += requestErrors.length;
      }

      processedRequestIds.push(request.requestId);

      await checkAndFinalizeRequest(request, parseInt(storeId), transaction, logs, finalizedRequests);
    }

    await transaction.commit();

    const responseMessage = `Processed ${processedCount} items successfully${failedCount > 0 ? `, ${failedCount} items failed` : ""}`;

    const detailedLogs = [...logs];

    if (allAutoInitializedItems.length > 0) {
      detailedLogs.unshift(
        `\n📦 Auto-initialized ${allAutoInitializedItems.length} items for Group "${group.name}":`,
      );
      allAutoInitializedItems.forEach((item) => {
        detailedLogs.push(
          `   - ${item.itemCode}: ${item.itemName} (from request ${item.requestCode})`,
        );
      });
      detailedLogs.push(
        `\n💡 Items were initialized with 0 balance and activated automatically.`,
      );
    }

    if (allSkippedGroups.length > 0) {
      detailedLogs.push(`\n⏭️ Skipped groups:`);
      allSkippedGroups.forEach((item) => {
        detailedLogs.push(`   - ${item.groupName}: ${item.reason}`);
      });
    }

    if (missingItems.length > 0) {
      detailedLogs.push(`\n📋 Missing or inactive items:`);
      missingItems.forEach((item) => {
        detailedLogs.push(
          `   - ${item.itemCode}: ${item.itemName} (${item.reason || "Not found"})`,
        );
      });
      detailedLogs.push(`\n💡 To fix: Initialize or activate these items.`);
    }

    if (partialRequests.length > 0) {
      detailedLogs.push(`\n⏳ Partially processed requests:`);
      partialRequests.forEach((req) => {
        detailedLogs.push(
          `   - ${req.requestCode}: ${req.remainingCount} group(s) remaining (${req.remainingGroups.join(", ")})`,
        );
      });
    }

    if (finalizedRequests.length > 0) {
      detailedLogs.push(`\n✅ Finalized requests:`);
      finalizedRequests.forEach((req) => {
        detailedLogs.push(`   - ${req.requestCode}: All groups processed`);
      });
    }

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        processed: processedCount,
        failed: failedCount,
        logs: detailedLogs,
        missingItems: missingItems,
        processedItems: processedItems,
        autoInitializedItems: allAutoInitializedItems,
        skippedGroups: allSkippedGroups,
        partialRequests: partialRequests,
        finalizedRequests: finalizedRequests,
        requestIds: validRequestIds,
        processedRequestIds: processedRequestIds,
        storeId: parseInt(storeId),
        groupId: parseInt(groupId),
        storeName: store.name,
        groupName: group.name,
        userId: userId,
        totalRequests: requests.length,
      },
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Process requests error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process requests",
    });
  }
};

// ============================================
// 11. GET ALL STORES
// ============================================
exports.getStores = async (req, res) => {
  try {
    const { page = 1, limit = 1000, search } = req.query;

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
      attributes: [
        "id",
        "name",
        "code",
        "location",
        "status",
        "createdAt",
        "updatedAt",
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
      attributes: [
        "id",
        "name",
        "code",
        "description",
        "status",
        "createdAt",
        "updatedAt",
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
        "itemId",
        "code",
        "name",
        "standardName",
        "description",
        "brand",
        "model",
        "barcode",
        "conversionValue",
        "status",
      ],
    });

    const formattedItems = items.map((item) => ({
      id: item.itemId,
      itemId: item.itemId,
      code: item.code,
      name: item.name,
      standardName: item.standardName,
      description: item.description || "",
      brand: item.brand || "",
      model: item.model || "",
      barcode: item.barcode || "",
      commonName: item.standardName || item.name || "",
      conversionValue: parseFloat(item.conversionValue) || 1,
      status: item.status,
      uomCode: item.uom?.code || null,
      uomName: item.uom?.name || null,
      conversionUomCode: item.conversionUom?.code || null,
      conversionUomName: item.conversionUom?.name || null,
      uom: item.uom,
      conversionUom: item.conversionUom,
    }));

    console.log(`✅ Found ${formattedItems.length} active items`);

    res.status(200).json({
      success: true,
      data: formattedItems,
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
      attributes: [
        "id",
        "name",
        "code",
        "location",
        "status",
        "createdAt",
        "updatedAt",
      ],
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
      attributes: [
        "id",
        "name",
        "code",
        "description",
        "status",
        "createdAt",
        "updatedAt",
      ],
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
        "itemId",
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
        "updatedAt",
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    const formattedItem = {
      id: item.itemId,
      itemId: item.itemId,
      code: item.code,
      name: item.name,
      standardName: item.standardName,
      description: item.description,
      brand: item.brand,
      model: item.model,
      barcode: item.barcode,
      categoryId: item.categoryId,
      uomId: item.uomId,
      conversionUomId: item.conversionUomId,
      conversionValue: parseFloat(item.conversionValue) || 1,
      costPrice: parseFloat(item.costPrice) || 0,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      uom: item.uom,
      conversionUom: item.conversionUom,
    };

    res.status(200).json({
      success: true,
      data: formattedItem,
    });
  } catch (error) {
    console.error("Get item by ID error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 17. DOWNLOAD CSV TEMPLATE
// ============================================

exports.downloadTemplate = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let userAssignedStoreId = null;
    let userAssignedGroupId = null;
    let userAssignedStoreName = null;
    let userAssignedGroupName = null;

    if (userId) {
      try {
        const accessResult = await getUserStoreAndGroup(userId);
        if (accessResult.success) {
          userAssignedStoreId = accessResult.data.assignedStoreId;
          userAssignedGroupId = accessResult.data.assignedGroupId;
          userAssignedStoreName = accessResult.data.assignedStore?.name;
          userAssignedGroupName = accessResult.data.assignedGroup?.name;

          console.log(
            "👤 User assigned store:",
            userAssignedStoreId,
            userAssignedStoreName,
          );
          console.log(
            "👤 User assigned group:",
            userAssignedGroupId,
            userAssignedGroupName,
          );
        }
      } catch (err) {
        console.warn("Could not get user access:", err);
      }
    }

    const sampleStores = await Store.findAll({
      attributes: ["id", "name", "code"],
      where: { status: "Active" },
      order: [["name", "ASC"]],
      raw: true,
    });

    const sampleGroups = await Group.findAll({
      attributes: ["id", "name", "code"],
      where: { status: "Active" },
      order: [["name", "ASC"]],
      raw: true,
    });

    const sampleItems = await Item.findAll({
      attributes: ["code", "standardName", "name"],
      where: { status: "Active" },
      order: [["code", "ASC"]],
      limit: 10,
      raw: true,
    });

    let defaultStoreId =
      userAssignedStoreId ||
      (sampleStores.length > 0 ? sampleStores[0].id : 14);
    let defaultGroupId =
      userAssignedGroupId ||
      (sampleGroups.length > 0 ? sampleGroups[0].id : 25);

    if (
      userAssignedStoreId &&
      !userAssignedGroupId &&
      sampleGroups.length > 0
    ) {
      defaultGroupId = sampleGroups[0].id;
    }

    if (
      userAssignedGroupId &&
      !userAssignedStoreId &&
      sampleStores.length > 0
    ) {
      defaultStoreId = sampleStores[0].id;
    }

    console.log("📋 Default Store ID:", defaultStoreId);
    console.log("📋 Default Group ID:", defaultGroupId);

    let csvContent = "";

    csvContent += "# ============================================\n";
    csvContent += "# STORE BALANCE IMPORT TEMPLATE\n";
    csvContent += "# ============================================\n";
    csvContent += "#\n";
    csvContent += "# INSTRUCTIONS:\n";
    csvContent +=
      "# 1. Use the itemCode (e.g., SDT000001) instead of numeric itemId\n";
    csvContent += "# 2. You can find item codes in the Items list\n";
    csvContent +=
      "# 3. Required columns: storeId, groupId, itemCode, balance\n";
    csvContent += '# 4. Optional: minStock, status (defaults to "Active")\n';
    csvContent += "# 5. All columns must be in the order shown above\n";
    csvContent += "#\n";

    if (userAssignedStoreId && userAssignedGroupId) {
      csvContent += `# 👤 YOUR ASSIGNED STORE: ${userAssignedStoreName} (ID: ${userAssignedStoreId})\n`;
      csvContent += `# 👤 YOUR ASSIGNED GROUP: ${userAssignedGroupName} (ID: ${userAssignedGroupId})\n`;
      csvContent += "#\n";
      csvContent +=
        "# ✅ The template below uses your assigned store and group\n";
      csvContent += "#\n";
    } else if (userAssignedStoreId) {
      csvContent += `# 👤 YOUR ASSIGNED STORE: ${userAssignedStoreName} (ID: ${userAssignedStoreId})\n`;
      csvContent +=
        "# ⚠️ No group assigned. Using the first available group.\n";
      csvContent += "#\n";
    } else if (userAssignedGroupId) {
      csvContent += `# 👤 YOUR ASSIGNED GROUP: ${userAssignedGroupName} (ID: ${userAssignedGroupId})\n`;
      csvContent +=
        "# ⚠️ No store assigned. Using the first available store.\n";
      csvContent += "#\n";
    }

    if (sampleStores && sampleStores.length > 0) {
      csvContent += "# Available Stores:\n";
      sampleStores.forEach((store) => {
        const isDefault = store.id === defaultStoreId;
        csvContent += `#   ${store.id} = ${store.name} (${store.code || "N/A"})${isDefault ? " ✅ DEFAULT" : ""}\n`;
      });
    }
    csvContent += "#\n";

    if (sampleGroups && sampleGroups.length > 0) {
      csvContent += "# Available Groups:\n";
      sampleGroups.forEach((group) => {
        const isDefault = group.id === defaultGroupId;
        csvContent += `#   ${group.id} = ${group.name} (${group.code || "N/A"})${isDefault ? " ✅ DEFAULT" : ""}\n`;
      });
    }
    csvContent += "#\n";

    if (sampleItems && sampleItems.length > 0) {
      csvContent += "# Sample Item Codes:\n";
      sampleItems.forEach((item) => {
        const itemName = item.standardName || item.name || "Unknown";
        csvContent += `#   ${item.code}: ${itemName}\n`;
      });
    }
    csvContent += "# ============================================\n";

    csvContent += "storeId,groupId,itemCode,balance,minStock,status\n";

    if (sampleItems && sampleItems.length > 0) {
      const itemsToUse = sampleItems.slice(0, 6);

      itemsToUse.forEach((item, index) => {
        const balance = (index + 1) * 50;
        const minStock = (index + 1) * 5;

        csvContent += `${defaultStoreId},${defaultGroupId},${item.code},${balance},${minStock},Active\n`;
      });
    } else {
      csvContent += `${defaultStoreId},${defaultGroupId},SDT002001,50,5,Active\n`;
      csvContent += `${defaultStoreId},${defaultGroupId},SDT002002,100,10,Active\n`;
      csvContent += `${defaultStoreId},${defaultGroupId},SDT002003,150,15,Active\n`;
      csvContent += `${defaultStoreId},${defaultGroupId},SDT002004,200,20,Active\n`;
      csvContent += `${defaultStoreId},${defaultGroupId},SDT002005,250,25,Active\n`;
      csvContent += `${defaultStoreId},${defaultGroupId},SDT002006,300,30,Active\n`;
    }

    const csvWithBOM = "\uFEFF" + csvContent;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=balance_import_template_${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csvWithBOM);
  } catch (error) {
    console.error("❌ Download template error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to download template",
    });
  }
};

// ============================================
// 18. IMPORT BALANCES FROM CSV
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

    let userId = req.user?.userId || null;

    if (!userId) {
      const defaultUser = await User.findOne({
        where: { isActive: true },
        attributes: ["userId"],
        order: [["userId", "ASC"]],
      });
      userId = defaultUser ? defaultUser.userId : null;
    }

    if (!userId) {
      const anyUser = await User.findOne({
        attributes: ["userId"],
        order: [["userId", "ASC"]],
      });
      userId = anyUser ? anyUser.userId : null;
    }

    if (!userId) {
      console.warn("⚠️ No valid user found, skipping history records");
    }

    console.log("👤 Using userId for import:", userId);

    const results = [];
    const errors = [];
    let successCount = 0;
    let failedCount = 0;

    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const lines = fileContent
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"));

    if (lines.length < 2) {
      throw new Error(
        "CSV file must contain headers and at least one data row",
      );
    }

    const firstLine = lines[0];
    const hasTabs = firstLine.includes("\t");
    const hasCommas = firstLine.includes(",");

    let separator = ",";
    if (hasTabs && !hasCommas) {
      separator = "\t";
      console.log("📋 Detected tab-separated values (TSV)");
    } else if (hasCommas) {
      separator = ",";
      console.log("📋 Detected comma-separated values (CSV)");
    } else {
      console.log("📋 Could not detect separator, using comma");
    }

    const headers = lines[0]
      .split(separator)
      .map((h) => h.trim().toLowerCase());
    console.log("📋 Headers:", headers);

    const requiredHeaders = ["storeid", "groupid", "balance"];
    const hasItemId = headers.includes("itemid");
    const hasItemCode = headers.includes("itemcode");

    if (!hasItemId && !hasItemCode) {
      throw new Error('CSV must contain either "itemId" or "itemCode" column');
    }

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(separator).map((v) => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      results.push(row);
    }

    console.log(`📄 Parsed ${results.length} rows from CSV`);

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2;

      try {
        const storeId = parseInt(row.storeid);
        const groupId = parseInt(row.groupid);
        const itemCode = (row.itemcode || row.itemid || "").trim();
        const balance = parseFloat(row.balance);
        const minStock = parseInt(row.minstock) || 0;
        const status = row.status || "Active";

        console.log(
          `📊 Row ${rowNumber}: storeId=${storeId}, groupId=${groupId}, itemCode=${itemCode}, balance=${balance}`,
        );

        if (isNaN(storeId) || isNaN(groupId) || !itemCode || isNaN(balance)) {
          throw new Error(
            `storeId, groupId, itemCode, and balance are required. Got: storeId=${storeId}, groupId=${groupId}, itemCode=${itemCode}, balance=${balance}`,
          );
        }

        const item = await Item.findOne({
          where: { code: itemCode },
          attributes: ["itemId", "code", "name", "standardName"],
        });

        if (!item) {
          failedCount++;
          errors.push(
            `Row ${rowNumber}: Item with code "${itemCode}" not found`,
          );
          console.log(`❌ Row ${rowNumber}: Item not found: ${itemCode}`);
          continue;
        }

        const itemId = item.itemId;
        console.log(
          `✅ Row ${rowNumber}: Found item: ${itemCode} (ID: ${itemId})`,
        );

        const existing = await StoreBalance.findOne({
          where: {
            storeId: storeId,
            groupId: groupId,
            itemId: itemId,
          },
        });

        if (existing) {
          failedCount++;
          errors.push(
            `Row ${rowNumber}: Balance already exists for item "${itemCode}" (${item.standardName || item.name})`,
          );
          console.log(
            `⏭️ Row ${rowNumber}: Balance already exists for ${itemCode}`,
          );
          continue;
        }

        const balanceRecord = await StoreBalance.create(
          {
            storeId: storeId,
            groupId: groupId,
            itemId: itemId,
            balance: balance,
            minStockAlert: minStock,
            status: status,
          },
          { transaction },
        );

        if (userId) {
          await StoreBalanceHistory.create(
            {
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
            },
            { transaction },
          );
        } else {
          console.warn(
            `⚠️ No valid userId, skipping history for row ${rowNumber}`,
          );
        }

        successCount++;
        console.log(
          `✅ Row ${rowNumber}: Imported ${itemCode} - Balance: ${balance}`,
        );
      } catch (rowError) {
        failedCount++;
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
        console.error(`❌ Row ${rowNumber} error:`, rowError.message);
      }
    }

    await transaction.commit();
    safeDelete(req.file.path);

    const responseData = {
      total: results.length,
      success: successCount,
      failed: failedCount,
      errors: errors.slice(0, 20),
    };

    console.log(
      `📊 Import completed: ${successCount} success, ${failedCount} failed`,
    );

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
      error: error.message || "Failed to import balances",
    });
  }
};

// ============================================
// 19. EXPORT BALANCES TO EXCEL
// ============================================

exports.exportBalances = async (req, res) => {
  try {
    const { storeId, groupId, categoryId, status } = req.query;
    
    console.log('📊 Exporting Excel - storeId:', storeId, 'groupId:', groupId, 'categoryId:', categoryId, 'status:', status);
    
    const targetStoreId = storeId ? parseInt(storeId) : null;
    const targetGroupId = groupId ? parseInt(groupId) : null;
    const targetCategoryId = categoryId ? parseInt(categoryId) : null;
    const targetStatus = status || null;
    
    const whereClause = {};
    if (targetStoreId) whereClause.store_id = targetStoreId;
    if (targetGroupId) whereClause.group_id = targetGroupId;
    if (targetStatus) whereClause.status = targetStatus;
    
    const balances = await StoreBalance.findAll({
      where: whereClause,
      include: [
        { 
          model: Store, 
          as: "store", 
          attributes: ["name", "code"] 
        },
        { 
          model: Group, 
          as: "group", 
          attributes: ["name", "code"] 
        },
        {
          model: Item,
          as: "item",
          where: targetCategoryId ? { category_id: targetCategoryId } : {},
          include: [
            { 
              model: UOM, 
              as: "uom", 
              attributes: ["code", "name"] 
            },
            { 
              model: Category, 
              as: "category", 
              attributes: ["name"] 
            }
          ]
        }
      ],
      order: [["store_id", "ASC"], ["group_id", "ASC"]]
    });
    
    console.log(`✅ Found ${balances.length} balance records`);
    
    const storeName = balances.length > 0 ? balances[0].store?.name || 'Unknown Store' : 'Unknown Store';
    const groupName = balances.length > 0 ? balances[0].group?.name || 'Unknown Group' : 'Unknown Group';
    const storeCode = balances.length > 0 ? balances[0].store?.code || '' : '';
    const groupCode = balances.length > 0 ? balances[0].group?.code || '' : '';
    const categoryName = balances.length > 0 && balances[0].item?.category ? balances[0].item.category.name : 'All Categories';
    
    const userName = req.user?.fullName || req.user?.username || 'Admin';
    
    let totalItems = balances.length;
    let activeItems = 0;
    let zeroBalanceItems = 0;
    let lowStockItems = 0;
    
    balances.forEach(record => {
      const balance = parseFloat(record.balance) || 0;
      
      if (record.status === 'Active') {
        activeItems++;
      }
      
      if (balance === 0) {
        zeroBalanceItems++;
      } else if (balance <= parseFloat(record.minStockAlert)) {
        lowStockItems++;
      }
    });
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Super Double "T" General Trading PLC';
    workbook.created = new Date();
    
    const sheet = workbook.addWorksheet('Store Balance Report');
    
    let currentRow = 1;
    
    // Company Name
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const companyCell = sheet.getCell(`A${currentRow}`);
    companyCell.value = 'SUPER DOUBLE "T" GENERAL TRADING PLC';
    companyCell.font = { bold: true, size: 18, color: { argb: 'FF1A56DB' } };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 35;
    currentRow++;
    
    // Slogan
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const sloganCell = sheet.getCell(`A${currentRow}`);
    sloganCell.value = 'WE TRUST IN GOD!!!  እግዚአብሔር ይባረክ!!!';
    sloganCell.font = { bold: true, size: 12, color: { argb: 'FF4B5563' } };
    sloganCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 25;
    currentRow++;
    
    currentRow++;
    
    // Report Title
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = 'STORE BALANCE REPORT';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1A56DB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 30;
    currentRow++;
    
    currentRow++;
    
    // Store and Group Info
    const storeRow = sheet.getRow(currentRow);
    storeRow.getCell(1).value = 'Store:';
    storeRow.getCell(1).font = { bold: true };
    storeRow.getCell(2).value = storeName;
    storeRow.getCell(4).value = 'Group:';
    storeRow.getCell(4).font = { bold: true };
    storeRow.getCell(5).value = groupName;
    currentRow++;
    
    const storeCodeRow = sheet.getRow(currentRow);
    storeCodeRow.getCell(1).value = 'Store Code:';
    storeCodeRow.getCell(1).font = { bold: true };
    storeCodeRow.getCell(2).value = storeCode;
    storeCodeRow.getCell(4).value = 'Group Code:';
    storeCodeRow.getCell(4).font = { bold: true };
    storeCodeRow.getCell(5).value = groupCode;
    currentRow++;
    
    const categoryRow = sheet.getRow(currentRow);
    categoryRow.getCell(1).value = 'Category:';
    categoryRow.getCell(1).font = { bold: true };
    categoryRow.getCell(2).value = categoryName;
    categoryRow.getCell(4).value = 'Status:';
    categoryRow.getCell(4).font = { bold: true };
    categoryRow.getCell(5).value = targetStatus || 'All';
    currentRow++;
    
    const now = new Date();
    const dateTimeStr = now.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const generatedRow = sheet.getRow(currentRow);
    generatedRow.getCell(1).value = 'Generated By:';
    generatedRow.getCell(1).font = { bold: true };
    generatedRow.getCell(2).value = userName;
    generatedRow.getCell(4).value = 'Date/Time:';
    generatedRow.getCell(4).font = { bold: true };
    generatedRow.getCell(5).value = dateTimeStr;
    currentRow++;
    
    currentRow++;
    
    // Summary
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const summaryTitleCell = sheet.getCell(`A${currentRow}`);
    summaryTitleCell.value = 'SUMMARY';
    summaryTitleCell.font = { bold: true, size: 14, color: { argb: 'FF1A56DB' } };
    sheet.getRow(currentRow).height = 25;
    currentRow++;
    
    const summaryData = [
      ['Total Items:', totalItems, 'Active Items:', activeItems],
      ['Zero Balance Items:', zeroBalanceItems, 'Low Stock Items:', lowStockItems]
    ];
    
    summaryData.forEach((rowData) => {
      const row = sheet.getRow(currentRow);
      rowData.forEach((value, index) => {
        const col = index + 1;
        row.getCell(col).value = value;
        if (index % 2 === 0 && value) {
          row.getCell(col).font = { bold: true };
        }
        if (index % 2 === 1 && value) {
          row.getCell(col).font = { bold: true, color: { argb: 'FF1A56DB' } };
        }
      });
      currentRow++;
    });
    
    currentRow++;
    currentRow++;
    
    // Table Header
    const headerRow2 = sheet.getRow(currentRow);
    const headers = ['#', 'Item Code', 'Item Name', 'Category', 'UOM', 'Balance', 'Status'];
    headers.forEach((header, index) => {
      const col = index + 1;
      headerRow2.getCell(col).value = header;
      headerRow2.getCell(col).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow2.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A56DB' }
      };
      headerRow2.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow2.getCell(col).border = {
        top: { style: 'thin', color: { argb: 'FF1A56DB' } },
        bottom: { style: 'thin', color: { argb: 'FF1A56DB' } },
        left: { style: 'thin', color: { argb: 'FF1A56DB' } },
        right: { style: 'thin', color: { argb: 'FF1A56DB' } }
      };
    });
    sheet.getRow(currentRow).height = 25;
    currentRow++;
    
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 45;
    sheet.getColumn(4).width = 25;
    sheet.getColumn(5).width = 12;
    sheet.getColumn(6).width = 14;
    sheet.getColumn(7).width = 12;
    
    let rowCounter = 1;
    balances.forEach((record) => {
      const item = record.item;
      const balance = parseFloat(record.balance) || 0;
      
      const itemName = item?.standardName || item?.name || 'Unnamed';
      
      const row = sheet.getRow(currentRow);
      row.getCell(1).value = rowCounter;
      row.getCell(2).value = item?.code || 'N/A';
      row.getCell(3).value = itemName;
      row.getCell(4).value = item?.category?.name || 'Uncategorized';
      row.getCell(5).value = item?.uom?.code || 'PCS';
      row.getCell(6).value = balance;
      row.getCell(7).value = record.status || 'Active';
      
      const balanceCell = row.getCell(6);
      const minStock = parseFloat(record.minStockAlert) || 0;
      
      if (balance === 0) {
        balanceCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' }
        };
        balanceCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      } else if (balance <= minStock) {
        balanceCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }
        };
        balanceCell.font = { color: { argb: 'FFD97706' }, bold: true };
      } else {
        balanceCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDCFCE7' }
        };
        balanceCell.font = { color: { argb: 'FF166534' }, bold: true };
      }
      
      const statusCell = row.getCell(7);
      if (record.status === 'Active') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDCFCE7' }
        };
        statusCell.font = { color: { argb: 'FF166534' }, bold: true };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' }
        };
        statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
      
      for (let col = 1; col <= 7; col++) {
        row.getCell(col).border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      }
      
      currentRow++;
      rowCounter++;
    });
    
    console.log(`✅ Added ${rowCounter - 1} data rows to Excel`);
    
    const headerRowNumber = headerRow2.number;
    sheet.autoFilter = {
      from: `A${headerRowNumber}`,
      to: `G${headerRowNumber}`
    };
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Store_Balance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
    
  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to export data" 
    });
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
      changedBy:
        record.changedByUser?.fullName ||
        record.changedByUser?.username ||
        null,
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
      lowStockPercentage:
        s.activeItems > 0
          ? ((s.lowStockItems / s.activeItems) * 100).toFixed(1)
          : 0,
      zeroStockPercentage:
        s.activeItems > 0
          ? ((s.zeroStockItems / s.activeItems) * 100).toFixed(1)
          : 0,
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
      lowStockPercentage:
        s.activeItems > 0
          ? ((s.lowStockItems / s.activeItems) * 100).toFixed(1)
          : 0,
      zeroStockPercentage:
        s.activeItems > 0
          ? ((s.zeroStockItems / s.activeItems) * 100).toFixed(1)
          : 0,
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
          itemCommonName:
            record.item?.standardName || record.item?.name || null,
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
      const baseBalance =
        balance * (parseFloat(record.item?.conversionValue) || 1);

      summary[itemId].totalStores++;
      summary[itemId].totalBalance += balance;
      summary[itemId].totalBaseBalance += baseBalance;

      if (balance < summary[itemId].minBalance)
        summary[itemId].minBalance = balance;
      if (balance > summary[itemId].maxBalance)
        summary[itemId].maxBalance = balance;

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
    const { page = 1, limit = 10000, search, categoryId, status } = req.query;

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
        "itemId",
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
        "updatedAt",
      ],
    });

    const formattedRows = rows.map((item) => ({
      id: item.itemId,
      itemId: item.itemId,
      code: item.code,
      name: item.name,
      standardName: item.standardName,
      description: item.description,
      brand: item.brand,
      model: item.model,
      barcode: item.barcode,
      categoryId: item.categoryId,
      uomId: item.uomId,
      conversionUomId: item.conversionUomId,
      conversionValue: parseFloat(item.conversionValue) || 1,
      costPrice: parseFloat(item.costPrice) || 0,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      uom: item.uom,
      conversionUom: item.conversionUom,
    }));

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
        "userId",
        "username",
        "email",
        "fullName",
        "role",
        "isActive",
        "lastLogin",
        "createdAt",
        "updatedAt",
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
        "userId",
        "username",
        "email",
        "fullName",
        "role",
        "isActive",
        "lastLogin",
        "createdAt",
        "updatedAt",
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
// GET STORE-GROUP RELATIONS
// ============================================
exports.getStoreGroupRelations = async (req, res) => {
  try {
    const { storeId } = req.query;

    console.log(
      "🔍 Fetching store-group relations, storeId:",
      storeId || "all",
    );

    if (storeId) {
      const store = await Store.findByPk(parseInt(storeId), {
        include: [
          {
            model: Group,
            as: "groups",
            through: { attributes: [] },
            attributes: ["groupId", "code", "name", "description", "status"],
          },
        ],
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          error: "Store not found",
        });
      }

      const formattedGroups = store.groups.map((group) => ({
        storeId: parseInt(storeId),
        groupId: group.groupId,
        groupName: group.name,
        groupCode: group.code,
        groupDescription: group.description,
        groupStatus: group.status,
      }));

      console.log(
        `✅ Found ${formattedGroups.length} groups for store ${storeId}`,
      );

      return res.status(200).json({
        success: true,
        data: formattedGroups,
      });
    }

    const relations = await StoreGroupRelation.findAll({
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "code"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["groupId", "code", "name", "description", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedRelations = relations.map((relation) => ({
      id: relation.id,
      storeId: relation.storeId,
      storeName: relation.store?.name || null,
      storeCode: relation.store?.code || null,
      groupId: relation.groupId,
      groupName: relation.group?.name || null,
      groupCode: relation.group?.code || null,
      createdAt: relation.createdAt,
      updatedAt: relation.updatedAt,
    }));

    console.log(`✅ Found ${formattedRelations.length} store-group relations`);

    res.status(200).json({
      success: true,
      data: formattedRelations,
    });
  } catch (error) {
    console.error("❌ Get store-group relations error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// GET USER STORE AND GROUP ACCESS
// ============================================
exports.getUserStoreAndGroupAccess = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const result = await getUserStoreAndGroup(userId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error || "Failed to get user access",
      });
    }

    console.log("✅ User access retrieved:", {
      userId,
      role: result.data.role,
      isAdmin: result.data.isAdmin,
      hasAssignments: result.data.hasAssignments,
      storeId: result.data.assignedStoreId,
      groupId: result.data.assignedGroupId,
    });

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("❌ Get user store and group error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user access",
    });
  }
};

// ============================================
// GET REQUEST GROUP PROCESSING STATUS
// ============================================
exports.getRequestGroupStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ItemRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    const storeId = request.askingStoreId || request.supplyingStoreId;

    const storeWithGroups = await Store.findByPk(storeId, {
      include: [
        {
          model: Group,
          as: "groups",
          through: { attributes: [] },
          attributes: ["groupId", "name", "code", "description", "status"],
        },
      ],
    });

    const allGroups = (storeWithGroups?.groups || []).map(g => ({
      ...g.toJSON ? g.toJSON() : g,
      groupId: parseInt(g.groupId)
    }));

    const processingRecords = await RequestGroupProcessing.findAll({
      where: { requestId: parseInt(requestId) },
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["groupId", "name", "code"],
        },
        {
          model: User,
          as: "processedByUser",
          attributes: ["userId", "username", "fullName"],
        },
      ],
    });

    const groupsWithStatus = allGroups.map((group) => {
      const record = processingRecords.find((r) => parseInt(r.groupId) === group.groupId);
      return {
        groupId: group.groupId,
        groupName: group.name,
        groupCode: group.code,
        status: record?.status || "pending",
        processedAt: record?.processedAt || null,
        processedBy: record?.processedByUser
          ? {
              userId: record.processedByUser.userId,
              username: record.processedByUser.username,
              fullName: record.processedByUser.fullName,
            }
          : null,
        remark: record?.remark || null,
      };
    });

    const processedCount = groupsWithStatus.filter(
      (g) => g.status === "processed",
    ).length;
    const totalGroups = groupsWithStatus.length;
    const isFullyProcessed = processedCount === totalGroups && totalGroups > 0;

    res.status(200).json({
      success: true,
      data: {
        requestId: parseInt(requestId),
        requestCode: request.requestCode,
        totalGroups: totalGroups,
        processedCount: processedCount,
        isFullyProcessed: isFullyProcessed,
        groups: groupsWithStatus,
      },
    });
  } catch (error) {
    console.error("❌ Get request group status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// PROCESS REQUEST FOR A SPECIFIC GROUP
// ============================================

exports.processRequestForGroup = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { requestId } = req.params;
    const { groupId, storeId } = req.body;
    const userId = req.user?.userId || 1;

    console.log("📤 Processing request for group:", {
      requestId,
      groupId,
      storeId,
      userId,
    });

    if (!groupId || !storeId) {
      return res.status(400).json({
        success: false,
        error: "Group ID and Store ID are required",
      });
    }

    const group = await Group.findByPk(parseInt(groupId));
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    if (group.status !== "Active") {
      return res.status(400).json({
        success: false,
        error: `Group "${group.name}" is ${group.status}. Only active groups can process requests.`,
      });
    }

    const store = await Store.findByPk(parseInt(storeId));
    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    if (store.status !== "Active") {
      return res.status(400).json({
        success: false,
        error: `Store "${store.name}" is ${store.status}. Only active stores can process requests.`,
      });
    }

    const storeGroupRelation = await StoreGroupRelation.findOne({
      where: {
        storeId: parseInt(storeId),
        groupId: parseInt(groupId),
      },
    });

    if (!storeGroupRelation) {
      return res.status(403).json({
        success: false,
        error: `Group "${group.name}" does not have access to store "${store.name}"`,
      });
    }

    const request = await ItemRequest.findByPk(requestId, {
      include: [
        {
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              attributes: [
                "id",
                "code",
                "name",
                "standardName",
                "conversionValue",
                "status",
              ],
            },
          ],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    if (request.status !== "approved") {
      return res.status(400).json({
        success: false,
        error: `Request is ${request.status}. Only approved requests can be processed.`,
      });
    }

    if (request.status === "finalized") {
      return res.status(400).json({
        success: false,
        error: "This request has already been finalized",
      });
    }

    const existingRecord = await RequestGroupProcessing.findOne({
      where: {
        requestId: parseInt(requestId),
        groupId: parseInt(groupId),
      },
    });

    if (existingRecord && existingRecord.status === "processed") {
      return res.status(400).json({
        success: false,
        error: "This group has already processed this request",
      });
    }

    if (existingRecord && existingRecord.status === "skipped") {
      return res.status(400).json({
        success: false,
        error:
          "This group has been skipped for this request by an administrator",
      });
    }

    if (
      request.askingStoreId !== parseInt(storeId) &&
      request.supplyingStoreId !== parseInt(storeId)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "This store is neither the asking nor supplying store for this request",
      });
    }

    const missingItems = [];
    const inactiveItems = [];
    const initializedItems = [];
    const autoInitializedItems = [];

    for (const item of request.items) {
      if (!item.item) {
        missingItems.push({
          itemId: item.itemId,
          itemCode: "N/A",
          itemName: "Unknown Item (deleted)",
          reason: "Item not found in database",
        });
        continue;
      }

      if (item.item.status !== "Active") {
        inactiveItems.push({
          itemId: item.itemId,
          itemCode: item.item.code || "N/A",
          itemName: item.item.standardName || item.item.name || "Unknown Item",
          reason: `Item status is ${item.item.status}`,
        });
        continue;
      }

      let balance = await StoreBalance.findOne({
        where: {
          storeId: parseInt(storeId),
          groupId: parseInt(groupId),
          itemId: item.itemId,
        },
      });

      if (!balance) {
        console.log(
          `📦 Auto-initializing balance for item: ${item.item.code} (Group: ${group.name})`,
        );

        balance = await StoreBalance.create(
          {
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: item.itemId,
            balance: 0,
            minStockAlert: 0,
            status: "Active",
          },
          { transaction },
        );

        await StoreBalanceHistory.create(
          {
            balanceId: balance.id,
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: item.itemId,
            previousBalance: 0,
            newBalance: 0,
            changeAmount: 0,
            transactionType: "Stock In",
            referenceType: "auto_initialization",
            referenceId: request.requestId,
            changedBy: userId,
            remark: `Auto-initialized for request ${request.requestCode} - Group: ${group.name}`,
          },
          { transaction },
        );

        autoInitializedItems.push({
          itemId: item.itemId,
          itemCode: item.item.code || "N/A",
          itemName: item.item.standardName || item.item.name || "Unknown Item",
          initializedBalance: 0,
        });

        initializedItems.push({
          itemId: item.itemId,
          itemCode: item.item.code || "N/A",
          itemName: item.item.standardName || item.item.name || "Unknown Item",
          currentBalance: 0,
          minStock: 0,
          wasAutoInitialized: true,
        });

      } else if (balance.status !== "Active") {
        inactiveItems.push({
          itemId: item.itemId,
          itemCode: item.item.code || "N/A",
          itemName: item.item.standardName || item.item.name || "Unknown Item",
          currentBalance: parseFloat(balance.balance),
          reason: `Balance status is ${balance.status}`,
        });
      } else {
        initializedItems.push({
          itemId: item.itemId,
          itemCode: item.item.code || "N/A",
          itemName: item.item.standardName || item.item.name || "Unknown Item",
          currentBalance: parseFloat(balance.balance),
          minStock: parseFloat(balance.minStockAlert) || 0,
          wasAutoInitialized: false,
        });
      }
    }

    if (inactiveItems.length > 0) {
      let errorMessage = `Cannot process request. The following items are inactive:\n\n`;
      inactiveItems.forEach((item) => {
        errorMessage += `  - ${item.itemCode}: ${item.itemName} (${item.reason})\n`;
      });
      errorMessage += `\n💡 Please activate these items before processing.`;

      return res.status(400).json({
        success: false,
        error: "Inactive items found",
        message: errorMessage,
        data: {
          autoInitializedItems: autoInitializedItems,
          inactiveItems: inactiveItems,
          initializedItems: initializedItems,
          totalItems: request.items.length,
          initializedCount: initializedItems.length,
          autoInitializedCount: autoInitializedItems.length,
          inactiveCount: inactiveItems.length,
          storeId: parseInt(storeId),
          groupId: parseInt(groupId),
          storeName: store.name,
          groupName: group.name,
        },
      });
    }

    if (autoInitializedItems.length > 0) {
      console.log(
        `✅ Auto-initialized ${autoInitializedItems.length} items for group ${group.name}:`,
      );
      autoInitializedItems.forEach((item) => {
        console.log(`   - ${item.itemCode}: ${item.itemName} (Balance: 0)`);
      });
    }

    console.log(
      `✅ All ${request.items.length} items are ready for processing (${autoInitializedItems.length} auto-initialized)`,
    );

    let action, transactionType, changeMultiplier, actionLabel;
    if (request.askingStoreId === parseInt(storeId)) {
      action = "STOCK_IN";
      transactionType = "Stock In";
      changeMultiplier = 1;
      actionLabel = "RECEIVED";
    } else if (request.supplyingStoreId === parseInt(storeId)) {
      action = "STOCK_OUT";
      transactionType = "Stock Out";
      changeMultiplier = -1;
      actionLabel = "SENT";
    } else {
      return res.status(400).json({
        success: false,
        error:
          "This store is neither the asking nor supplying store for this request",
      });
    }

    console.log(`📋 Action: ${action} for request ${request.requestCode}`);

    const results = [];
    const errors = [];

    for (const item of request.items) {
      try {
        const balance = await StoreBalance.findOne({
          where: {
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: item.itemId,
          },
        });

        if (!balance) {
          errors.push(
            `Item "${item.item?.name || item.itemId}" not found in balance (should have been auto-initialized)`,
          );
          continue;
        }

        const previousBalance = parseFloat(balance.balance);
        const quantity = parseFloat(item.quantity);
        const changeAmount = quantity * changeMultiplier;
        const newBalance = previousBalance + changeAmount;

        if (action === "STOCK_OUT" && newBalance < 0) {
          errors.push(
            `Insufficient balance for "${item.item?.name || item.itemId}". Balance: ${previousBalance}, Requested: ${quantity}`,
          );
          continue;
        }

        balance.balance = newBalance;
        await balance.save({ transaction });

        await StoreBalanceHistory.create(
          {
            balanceId: balance.id,
            storeId: parseInt(storeId),
            groupId: parseInt(groupId),
            itemId: item.itemId,
            previousBalance: previousBalance,
            newBalance: newBalance,
            changeAmount: Math.abs(changeAmount),
            transactionType: transactionType,
            sourceStoreId:
              action === "STOCK_IN" ? request.supplyingStoreId : null,
            destinationStoreId:
              action === "STOCK_OUT" ? request.askingStoreId : null,
            referenceType: "request",
            referenceId: request.requestId,
            changedBy: userId,
            remark: `Processed request ${request.requestCode} for group ${group.name} - ${actionLabel} ${quantity} ${item.item?.code || ""}`,
          },
          { transaction },
        );

        results.push({
          itemId: item.itemId,
          itemName: item.item?.standardName || item.item?.name || "Unknown",
          itemCode: item.item?.code || "N/A",
          previousBalance,
          newBalance,
          changeAmount: Math.abs(changeAmount),
          action: action === "STOCK_IN" ? "ADDED" : "REMOVED",
          wasAutoInitialized: autoInitializedItems.some(
            (ai) => ai.itemId === item.itemId,
          ),
        });

        console.log(
          `✅ ${action === "STOCK_IN" ? "ADDED" : "REMOVED"} ${quantity} of ${item.item?.code || item.itemId} (Balance: ${previousBalance} → ${newBalance})`,
        );
      } catch (itemError) {
        console.error(`❌ Error processing item ${item.itemId}:`, itemError);
        errors.push(
          `Error processing item ${item.itemId}: ${itemError.message}`,
        );
      }
    }

    const remark =
      results.length > 0
        ? `Processed ${results.length} items (${results.map((r) => `${r.itemCode}: ${r.action} ${r.changeAmount}${r.wasAutoInitialized ? " [auto-initialized]" : ""}`).join(", ")})`
        : "No items processed";

    if (existingRecord) {
      existingRecord.status = "processed";
      existingRecord.processedAt = new Date();
      existingRecord.processedBy = userId;
      existingRecord.remark = remark;
      await existingRecord.save({ transaction });
    } else {
      await RequestGroupProcessing.create(
        {
          requestId: parseInt(requestId),
          groupId: parseInt(groupId),
          storeId: parseInt(storeId),
          processedAt: new Date(),
          status: "processed",
          processedBy: userId,
          remark: remark,
        },
        { transaction },
      );
    }

    // 🔥 Check if all groups have processed this request
    const logs = [];
    const finalizedRequests = [];
    await checkAndFinalizeRequest(request, parseInt(storeId), transaction, logs, finalizedRequests);

    await transaction.commit();

    const responseData = {
      requestId: parseInt(requestId),
      requestCode: request.requestCode,
      groupId: parseInt(groupId),
      groupName: group.name,
      storeId: parseInt(storeId),
      storeName: store.name,
      action: action,
      actionLabel: actionLabel,
      autoInitializedItems: autoInitializedItems,
      processedItems: results,
      errors: errors,
      isFullyProcessed: request.status === 'finalized',
      logs: logs,
      finalizedRequests: finalizedRequests,
    };

    let statusMessage = `Request ${request.requestCode} processed for group ${group.name}`;
    if (autoInitializedItems.length > 0) {
      statusMessage += ` (${autoInitializedItems.length} item(s) auto-initialized)`;
    }
    if (responseData.isFullyProcessed) {
      statusMessage += ` ✅ FULLY PROCESSED - All groups have processed this request`;
    }

    res.status(200).json({
      success: true,
      message: statusMessage,
      data: responseData,
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Process request for group error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process request for group",
    });
  }
};

// ============================================
// GET ALL REQUEST PROCESSING STATUS
// ============================================
exports.getAllRequestProcessingStatus = async (req, res) => {
  try {
    const { storeId } = req.query;

    const whereClause = { status: "approved" };
    if (storeId) {
      whereClause[Op.or] = [
        { askingStoreId: parseInt(storeId) },
        { supplyingStoreId: parseInt(storeId) },
      ];
    }

    const requests = await ItemRequest.findAll({
      where: whereClause,
      include: [
        {
          model: RequestGroupProcessing,
          as: "groupProcessing",
          include: [
            {
              model: Group,
              as: "group",
              attributes: ["groupId", "name", "code"],
            },
          ],
        },
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
      ],
    });

    const result = requests.map((request) => {
      const processedGroups =
        request.groupProcessing?.filter((g) => g.status === "processed") || [];

      return {
        requestId: request.requestId,
        requestCode: request.requestCode,
        askingStoreId: request.askingStoreId,
        supplyingStoreId: request.supplyingStoreId,
        status: request.status,
        processedGroups: processedGroups.map((g) => ({
          groupId: parseInt(g.groupId),
          groupName: g.group?.name || null,
          processedAt: g.processedAt,
        })),
        processedCount: processedGroups.length,
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Get all request processing status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// SKIP GROUP PROCESSING (Admin Only)
// ============================================
exports.skipGroupProcessing = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { requestId } = req.params;
    const { groupId, remark } = req.body;
    const userId = req.user?.userId || 1;

    const user = await User.findByPk(userId);
    if (!user || (user.role !== "admin" && user.role !== "Admin")) {
      return res.status(403).json({
        success: false,
        error: "Only admins can skip group processing",
      });
    }

    const request = await ItemRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    const requestIdInt = parseInt(requestId);
    const groupIdInt = parseInt(groupId);

    const [record, created] = await RequestGroupProcessing.findOrCreate({
      where: {
        requestId: requestIdInt,
        groupId: groupIdInt,
      },
      defaults: {
        requestId: requestIdInt,
        groupId: groupIdInt,
        storeId: request.askingStoreId || request.supplyingStoreId,
        status: "skipped",
        processedAt: new Date(),
        processedBy: userId,
        remark: remark || "Skipped by admin",
      },
      transaction,
    });

    if (!created) {
      record.status = "skipped";
      record.processedAt = new Date();
      record.processedBy = userId;
      record.remark = remark || "Skipped by admin";
      await record.save({ transaction });
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Group ${groupId} skipped for request ${request.requestCode}`,
      data: record,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Skip group processing error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to skip group processing",
    });
  }
};