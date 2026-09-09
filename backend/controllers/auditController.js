// auditController.js - Clean Version (NO Converted Balance)
// Only uses StoreBalance table

const { Op } = require("sequelize");
const { getUserStoreAndGroup } = require("../utils/userAccess");
const ExcelJS = require('exceljs');

const {
  StoreBalance,
  StoreBalanceHistory,
  Store,
  Group,
  Item,
  UOM,
  Category,
  StoreGroupRelation,
  User,
  sequelize,
} = require("../models");

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatBalance = (record) => {
  const item = record.item;
  const conversionValue = item?.conversionValue !== undefined && item?.conversionValue !== null 
    ? parseFloat(item.conversionValue) 
    : 1;
  
  const balance = parseFloat(record.balance) || 0;
  const minStock = parseFloat(record.minStockAlert) || 0;

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
    category: item?.category || null,
    uomCode: item?.uom?.code || null,
    uomName: item?.uom?.name || null,
    conversionUomCode: item?.conversionUom?.code || null,
    conversionValue: conversionValue,
    balance: balance,
    minStock: minStock,
    baseBalance: balance * conversionValue,
    status: record.status || 'Active',
    statusClass: balance === 0 ? 'zero' : (balance <= minStock ? 'low' : 'normal'),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

/**
 * Calculate group summary
 */
const calculateGroupSummary = (balances) => {
  const summary = {
    totalItems: 0,
    totalBalance: 0,
    totalBaseBalance: 0,
    activeItems: 0,
    inactiveItems: 0,
    lowStockItems: 0,
    zeroStockItems: 0,
    averageBalance: 0,
    lowStockPercentage: 0,
    zeroStockPercentage: 0,
  };

  balances.forEach((record) => {
    const balance = parseFloat(record.balance);
    const conversionValue = parseFloat(record.item?.conversionValue) || 1;
    const baseBalance = balance * conversionValue;
    const minStock = parseFloat(record.minStockAlert) || 0;

    summary.totalItems++;
    summary.totalBalance += balance;
    summary.totalBaseBalance += baseBalance;

    if (record.status === "Active") {
      summary.activeItems++;
      if (balance === 0) {
        summary.zeroStockItems++;
      } else if (balance <= minStock) {
        summary.lowStockItems++;
      }
    } else {
      summary.inactiveItems++;
    }
  });

  summary.averageBalance = summary.totalItems > 0 ? summary.totalBalance / summary.totalItems : 0;
  summary.lowStockPercentage = summary.activeItems > 0 ? ((summary.lowStockItems / summary.activeItems) * 100) : 0;
  summary.zeroStockPercentage = summary.activeItems > 0 ? ((summary.zeroStockItems / summary.activeItems) * 100) : 0;

  return summary;
};

// ============================================
// HELPER: Get last transaction dates
// ============================================

const getLastTransactionDates = async (storeId, groupIds, itemIds) => {
  try {
    if (!groupIds.length || !itemIds.length) {
      return {};
    }

    const query = `
      SELECT DISTINCT ON (sbh."item_id", sbh."group_id") 
        sbh."item_id" as "itemId",
        sbh."group_id" as "groupId",
        sbh."created_at" as "lastTransactionDate"
      FROM "store_balance_histories" sbh
      WHERE sbh."store_id" = :storeId
        AND sbh."group_id" IN (:groupIds)
        AND sbh."item_id" IN (:itemIds)
      ORDER BY sbh."item_id", sbh."group_id", sbh."created_at" DESC
    `;

    const results = await sequelize.query(query, {
      replacements: {
        storeId: parseInt(storeId),
        groupIds: groupIds,
        itemIds: itemIds
      },
      type: sequelize.QueryTypes.SELECT
    });

    const lastTxMap = {};
    results.forEach(row => {
      const key = `${row.itemId}_${row.groupId}`;
      lastTxMap[key] = row.lastTransactionDate;
    });

    return lastTxMap;

  } catch (error) {
    console.error('❌ Error getting last transaction dates:', error);
    return {};
  }
};

const getStatusClass = (status) => {
  const map = {
    'Matched': 'matched',
    'Conflict': 'conflict',
    'No Data': 'unknown'
  };
  return map[status] || 'unknown';
};

// ============================================
// GET STORE AUDIT - MAIN ENDPOINT (CLEAN)
// ============================================

exports.getStoreAudit = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { includeTransactions = 'true', transactionLimit = 10 } = req.query;

    console.log(`🔍 Getting audit data for store: ${storeId}`);

    const store = await Store.findByPk(parseInt(storeId), {
      attributes: ['storeId', 'name', 'code', 'location', 'status'],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const storeGroups = await StoreGroupRelation.findAll({
      where: { storeId: parseInt(storeId) },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'name', 'code', 'description', 'status'],
        }
      ],
      order: [['createdAt', 'ASC']],
    });

    const groups = storeGroups
      .map(sg => sg.group)
      .filter(g => g !== null);

    console.log(`📋 Found ${groups.length} groups for store ${storeId}`);

    // ============================================================
    // ✅ GET BALANCES (StoreBalance only - NO ConvertedBalance)
    // ============================================================
    const allBalances = await StoreBalance.findAll({
      where: {
        storeId: parseInt(storeId),
      },
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["storeId", "name", "code"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["groupId", "name", "code"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["itemId", "code", "name", "standardName", "conversionValue", "categoryId"],
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
            {
              model: Category,
              as: "category",
              attributes: ["categoryId", "name", "description"],
            },
          ],
        },
      ],
      order: [["groupId", "ASC"], ["itemId", "ASC"]],
    });

    console.log(`✅ Found ${allBalances.length} balances for store ${storeId}`);

    // ============================================================
    // ✅ GROUP BALANCES
    // ============================================================
    const groupedBalances = {};
    const groupSummaries = {};
    const groupBalanceCounts = {};

    groups.forEach((group) => {
      const groupId = group.groupId;
      groupedBalances[groupId] = [];
      groupBalanceCounts[groupId] = 0;
    });

    // Process balances
    allBalances.forEach((balance) => {
      const groupId = balance.groupId;
      if (!groupId) return;
      
      const groupExists = groups.some(g => g.groupId === groupId);
      if (!groupExists) return;
      
      if (!groupedBalances[groupId]) {
        groupedBalances[groupId] = [];
      }
      
      const formattedBalance = formatBalance(balance);
      
      groupedBalances[groupId].push(formattedBalance);
      groupBalanceCounts[groupId] = (groupBalanceCounts[groupId] || 0) + 1;
    });

    groups.forEach((group) => {
      const groupId = group.groupId;
      const balances = groupedBalances[groupId] || [];
      groupSummaries[groupId] = calculateGroupSummary(balances);
    });

    console.log(`📊 Group balance counts:`, groupBalanceCounts);

    // ============================================================
    // ✅ BUILD COMPARISON DATA
    // ============================================================
    
    // Get all unique categories
    const categorySet = new Set();
    allBalances.forEach(balance => {
      if (balance.item?.category?.name) {
        categorySet.add(balance.item.category.name);
      }
    });
    const categories = Array.from(categorySet);

    // Get last transaction dates
    const groupIds = groups.map(g => g.groupId);
    const itemIds = [...new Set(allBalances.map(b => b.itemId))];
    const lastTxMap = await getLastTransactionDates(storeId, groupIds, itemIds);

    // Build item comparison map
    const itemMap = new Map();

    allBalances.forEach((balance) => {
      const itemId = balance.itemId;
      const groupId = balance.groupId;
      
      if (!groupId) return;
      if (!groups.some(g => g.groupId === groupId)) return;
      
      if (!itemMap.has(itemId)) {
        const item = balance.item;
        itemMap.set(itemId, {
          itemId: itemId,
          code: item?.code || null,
          itemName: item?.standardName || item?.name || null,
          commonName: item?.standardName || item?.name || null,
          standardName: item?.standardName || null,
          category: item?.category?.name || null,
          uomCode: item?.uom?.code || null,
          uomName: item?.uom?.name || null,
          conversionUomCode: item?.conversionUom?.code || null,
          conversionValue: parseFloat(item?.conversionValue) || 1,
          groupBalances: {},
          groupLastTxDates: {},
        });
      }
      
      const item = itemMap.get(itemId);
      item.groupBalances[groupId] = parseFloat(balance.balance || 0);
      
      const key = `${itemId}_${groupId}`;
      if (lastTxMap[key]) {
        item.groupLastTxDates[groupId] = lastTxMap[key];
      }
    });

    // Determine status for each item
    const comparisonItems = [];
    let matchedCount = 0;
    let conflictCount = 0;
    let dateDiffCount = 0;

    itemMap.forEach((item) => {
      const groupIds = Object.keys(item.groupBalances);
      const values = groupIds.map(gid => item.groupBalances[gid] || 0);
      
      const uniqueValues = [...new Set(values)];
      
      let status = 'No Data';
      if (values.length === 0) {
        status = 'No Data';
      } else if (uniqueValues.length === 1) {
        status = 'Matched';
        matchedCount++;
      } else {
        status = 'Conflict';
        conflictCount++;
      }
      
      const dates = Object.values(item.groupLastTxDates || {}).filter(d => d !== undefined && d !== null);
      const uniqueDateStrings = [...new Set(dates.map(d => new Date(d).toDateString()))];
      const hasDateDiff = uniqueDateStrings.length > 1;
      
      if (hasDateDiff && status === 'Matched') {
        dateDiffCount++;
      }

      comparisonItems.push({
        itemId: item.itemId,
        code: item.code,
        itemName: item.itemName,
        commonName: item.commonName,
        standardName: item.standardName,
        category: item.category,
        uomCode: item.uomCode,
        uomName: item.uomName,
        conversionUomCode: item.conversionUomCode,
        conversionValue: item.conversionValue,
        groupBalances: item.groupBalances,
        groupLastTxDates: item.groupLastTxDates,
        status,
        statusClass: getStatusClass(status),
        values,
        hasDateDiff,
        dateDiffDetails: hasDateDiff ? {
          uniqueDates: uniqueDateStrings,
          diffDays: dates.length > 1 ? Math.round((new Date(Math.max(...dates.map(d => new Date(d).getTime()))) - new Date(Math.min(...dates.map(d => new Date(d).getTime())))) / (1000 * 60 * 60 * 24)) : 0,
        } : null,
      });
    });

    // ============================================================
    // ✅ BUILD GROUP AUDIT DATA
    // ============================================================
    const groupAuditData = await Promise.all(groups.map(async (group) => {
      const groupId = group.groupId;
      const balances = groupedBalances[groupId] || [];
      
      let transactions = [];
      if (includeTransactions === 'true') {
        try {
          const allTransactions = await StoreBalanceHistory.findAll({
            where: {
              storeId: parseInt(storeId),
              groupId: groupId,
            },
            include: [
              {
                model: Store,
                as: "store",
                attributes: ["storeId", "name", "code"],
              },
              {
                model: Group,
                as: "group",
                attributes: ["groupId", "name", "code"],
              },
              {
                model: Item,
                as: "item",
                attributes: ["itemId", "code", "name", "standardName"],
                include: [
                  {
                    model: UOM,
                    as: "uom",
                    attributes: ["id", "code", "name"],
                  },
                ],
              },
              {
                model: User,
                as: "changedByUser",
                attributes: ["userId", "username", "fullName"],
              },
            ],
            order: [["createdAt", "DESC"]],
            limit: parseInt(transactionLimit),
          });

          transactions = allTransactions.map((t) => ({
            id: t.id,
            balanceId: t.balanceId,
            storeName: t.store?.name || null,
            groupName: t.group?.name || null,
            itemName: t.item?.standardName || t.item?.name || null,
            itemCode: t.item?.code || null,
            uomCode: t.item?.uom?.code || null,
            previousBalance: parseFloat(t.previousBalance),
            newBalance: parseFloat(t.newBalance),
            changeAmount: parseFloat(t.changeAmount),
            transactionType: t.transactionType,
            changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
            remark: t.remark,
            createdAt: t.createdAt,
          }));
        } catch (txError) {
          console.error(`⚠️ Error fetching transactions for group ${groupId}:`, txError);
        }
      }

      return {
        groupId: groupId,
        name: group.name,
        code: group.code || '',
        description: group.description || '',
        status: group.status || 'Active',
        balanceCount: balances.length,
        summary: groupSummaries[groupId] || {
          totalItems: 0,
          totalBalance: 0,
          totalBaseBalance: 0,
          activeItems: 0,
          inactiveItems: 0,
          lowStockItems: 0,
          zeroStockItems: 0,
          averageBalance: 0,
          lowStockPercentage: 0,
          zeroStockPercentage: 0,
        },
        balances: balances,
        transactions: transactions,
      };
    }));

    // ============================================================
    // ✅ BUILD OVERALL SUMMARY
    // ============================================================
    let totalItems = 0;
    let totalBalance = 0;
    let activeItems = 0;
    let inactiveItems = 0;
    
    groupAuditData.forEach(g => {
      totalItems += g.balances.length;
      g.balances.forEach(b => {
        totalBalance += b.balance || 0;
        if (b.status === 'Active') activeItems++;
        else inactiveItems++;
      });
    });

    const overallSummary = {
      totalGroups: groups.length,
      totalItems: totalItems,
      totalBalance: totalBalance,
      totalBaseBalance: totalBalance,
      activeItems: activeItems,
      inactiveItems: inactiveItems,
      matchedItems: matchedCount,
      conflictItems: conflictCount,
      dateDiffItems: dateDiffCount,
      totalProducts: itemMap.size,
      categories: categories,
    };

    // ============================================================
    // ✅ BUILD FINAL RESPONSE
    // ============================================================
    const responseData = {
      store: {
        id: store.storeId,
        name: store.name,
        code: store.code,
        location: store.location,
        status: store.status,
      },
      groups: groupAuditData,
      summary: overallSummary,
      categories: categories,
      comparison: {
        items: comparisonItems,
        summary: {
          total: itemMap.size,
          matched: matchedCount,
          conflict: conflictCount,
          dateDiff: dateDiffCount,
          matchedPercentage: itemMap.size > 0 ? ((matchedCount / itemMap.size) * 100).toFixed(1) : "0",
          conflictPercentage: itemMap.size > 0 ? ((conflictCount / itemMap.size) * 100).toFixed(1) : "0",
          dateDiffPercentage: itemMap.size > 0 ? ((dateDiffCount / itemMap.size) * 100).toFixed(1) : "0",
        },
      },
    };

    console.log(`✅ Audit completed: ${overallSummary.totalItems} items, ${overallSummary.totalProducts} products, ${conflictCount} conflicts`);

    return res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("❌ Get store audit error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get store audit data',
    });
  }
};

// ============================================
// 2. GET STORES WITH GROUPS
// ============================================
exports.getStoresWithGroups = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    let stores = [];
    
    if (userId) {
      const accessResult = await getUserStoreAndGroup(userId);
      
      if (accessResult.success) {
        if (accessResult.data.isAdmin) {
          stores = await Store.findAll({
            attributes: ['storeId', 'code', 'name', 'location', 'status'],
            include: [
              {
                model: Group,
                as: 'groups',
                through: { attributes: [] },
                attributes: ['id', 'name', 'code', 'description', 'status'],
                where: { status: 'Active' },
                required: false,
              },
            ],
            where: { status: 'Active' },
            order: [['name', 'ASC']],
          });
        } else {
          const assignedStore = accessResult.data.assignedStore;
          if (assignedStore) {
            const store = await Store.findByPk(assignedStore.id, {
              attributes: ['storeId', 'code', 'name', 'location', 'status'],
              include: [
                {
                  model: Group,
                  as: 'groups',
                  through: { attributes: [] },
                  attributes: ['id', 'name', 'code', 'description', 'status'],
                  where: { status: 'Active' },
                  required: false,
                },
              ],
            });
            if (store) stores = [store];
          }
        }
      }
    }

    if (stores.length === 0) {
      stores = await Store.findAll({
        attributes: ['storeId', 'code', 'name', 'location', 'status'],
        include: [
          {
            model: Group,
            as: 'groups',
            through: { attributes: [] },
            attributes: ['id', 'name', 'code', 'description', 'status'],
            where: { status: 'Active' },
            required: false,
          },
        ],
        where: { status: 'Active' },
        order: [['name', 'ASC']],
      });
    }

    const formattedStores = stores.map(store => {
      const storeId = store.storeId || store.id;
      return {
        id: storeId,
        name: store.name,
        code: store.code,
        location: store.location,
        status: store.status,
        groups: (store.groups || []).map(group => ({
          id: group.id,
          groupId: group.id,
          name: group.name,
          code: group.code,
          description: group.description,
          status: group.status,
        })),
      };
    });

    console.log(`✅ Found ${formattedStores.length} stores with groups`);

    res.status(200).json({
      success: true,
      data: formattedStores,
    });

  } catch (error) {
    console.error("❌ Get stores with groups error:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stores',
    });
  }
};

// ============================================
// 3. GET CATEGORIES
// ============================================
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['categoryId', 'name', 'description', 'status'],
      where: { status: 'Active' },
      order: [['name', 'ASC']],
    });

    const formattedCategories = categories.map(cat => ({
      id: cat.categoryId,
      name: cat.name,
      description: cat.description,
      status: cat.status,
    }));

    console.log(`✅ Found ${formattedCategories.length} categories`);

    res.status(200).json({
      success: true,
      data: formattedCategories,
    });

  } catch (error) {
    console.error("❌ Get categories error:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get categories',
    });
  }
};

// ============================================
// 4. GET GROUP COMPARISON
// ============================================
exports.getGroupComparison = async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🔍 Getting group comparison for store: ${storeId}`);

    const store = await Store.findByPk(parseInt(storeId), {
      attributes: ['id', 'name', 'code'],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const storeGroups = await StoreGroupRelation.findAll({
      where: { storeId: parseInt(storeId) },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'name', 'code', 'status'],
          where: { status: 'Active' },
        }
      ],
    });

    const groups = storeGroups.map(sg => sg.group).filter(g => g !== null);

    if (groups.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          store: { id: store.id, name: store.name, code: store.code },
          groups: [],
          items: [],
          summary: { totalItems: 0, totalGroups: 0, totalBalance: 0 },
        },
      });
    }

    const allBalances = await StoreBalance.findAll({
      where: {
        storeId: parseInt(storeId),
        status: 'Active',
      },
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
          model: Group,
          as: "group",
          attributes: ["id", "name", "code"],
        },
      ],
      order: [["itemId", "ASC"]],
    });

    const itemMap = new Map();
    allBalances.forEach((balance) => {
      const itemId = balance.itemId;
      if (!itemMap.has(itemId)) {
        itemMap.set(itemId, {
          itemId: itemId,
          itemCode: balance.item?.code || null,
          itemName: balance.item?.standardName || balance.item?.name || null,
          uomCode: balance.item?.uom?.code || null,
          conversionValue: parseFloat(balance.item?.conversionValue) || 1,
          groups: {},
        });
      }
      const item = itemMap.get(itemId);
      item.groups[balance.groupId] = {
        groupName: balance.group?.name || null,
        balance: parseFloat(balance.balance),
        minStock: parseFloat(balance.minStockAlert) || 0,
      };
    });

    const comparisonItems = [];
    let matchedItems = 0;
    let conflictItems = 0;

    itemMap.forEach((item) => {
      const values = Object.values(item.groups).map(g => g.balance);
      const uniqueValues = [...new Set(values)];
      
      let status = 'No Data';
      if (values.length === 0) {
        status = 'No Data';
      } else if (uniqueValues.length === 1) {
        status = 'Matched';
        matchedItems++;
      } else {
        status = 'Conflict';
        conflictItems++;
      }

      comparisonItems.push({
        ...item,
        status,
        statusClass: status.toLowerCase(),
        totalBalance: values.reduce((sum, v) => sum + v, 0),
        averageBalance: values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
        groupCount: values.length,
        minBalance: values.length > 0 ? Math.min(...values) : 0,
        maxBalance: values.length > 0 ? Math.max(...values) : 0,
      });
    });

    const summary = {
      totalItems: comparisonItems.length,
      totalGroups: groups.length,
      totalBalance: comparisonItems.reduce((sum, item) => sum + item.totalBalance, 0),
      matchedItems,
      conflictItems,
    };

    res.status(200).json({
      success: true,
      data: {
        store: { id: store.id, name: store.name, code: store.code },
        groups: groups.map(g => ({ groupId: g.groupId, name: g.name, code: g.code, status: g.status })),
        items: comparisonItems,
        summary,
      },
    });

  } catch (error) {
    console.error("❌ Get group comparison error:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get group comparison',
    });
  }
};

// ============================================
// 5. GET BALANCE SNAPSHOT
// ============================================
exports.getBalanceSnapshot = async (req, res) => {
  try {
    const { storeId, groupId } = req.params;

    console.log(`🔍 Getting balance snapshot for store: ${storeId}, group: ${groupId}`);

    const store = await Store.findByPk(parseInt(storeId));
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    const group = await Group.findByPk(parseInt(groupId));
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const relation = await StoreGroupRelation.findOne({
      where: { storeId: parseInt(storeId), groupId: parseInt(groupId) },
    });

    if (!relation) {
      return res.status(403).json({ success: false, error: 'Group does not have access to this store' });
    }

    const balances = await StoreBalance.findAll({
      where: { storeId: parseInt(storeId), groupId: parseInt(groupId) },
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
          attributes: ["id", "code", "name", "standardName", "conversionValue"],
          include: [
            {
              model: UOM,
              as: "uom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
      ],
      order: [["itemId", "ASC"]],
    });

    const recentTransactions = await StoreBalanceHistory.findAll({
      where: { storeId: parseInt(storeId), groupId: parseInt(groupId) },
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
          ],
        },
        {
          model: User,
          as: "changedByUser",
          attributes: ["userId", "username", "fullName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const snapshot = {
      store: { id: store.id, name: store.name, code: store.code },
      group: { id: group.id, name: group.name, code: group.code, description: group.description },
      summary: calculateGroupSummary(balances),
      balances: balances.map(b => formatBalance(b)),
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        itemName: t.item?.standardName || t.item?.name || null,
        itemCode: t.item?.code || null,
        uomCode: t.item?.uom?.code || null,
        previousBalance: parseFloat(t.previousBalance),
        newBalance: parseFloat(t.newBalance),
        changeAmount: parseFloat(t.changeAmount),
        transactionType: t.transactionType,
        changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
        remark: t.remark,
        createdAt: t.createdAt,
      })),
      generatedAt: new Date().toISOString(),
    };

    res.status(200).json({ success: true, data: snapshot });

  } catch (error) {
    console.error("❌ Get balance snapshot error:", error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get balance snapshot' });
  }
};

// ============================================
// 6. GET ITEM TRANSACTIONS
// ============================================
exports.getItemTransactions = async (req, res) => {
  try {
    const { storeId, itemId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`🔍 Getting transactions for item ${itemId} in store ${storeId}`);

    const store = await Store.findByPk(parseInt(storeId));
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    const item = await Item.findByPk(parseInt(itemId));
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const storeGroups = await StoreGroupRelation.findAll({
      where: { storeId: parseInt(storeId) },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'name', 'code'],
        }
      ],
    });

    const groups = storeGroups.map(sg => sg.group).filter(g => g !== null);

    const groupTransactions = {};
    for (const group of groups) {
      const transactions = await StoreBalanceHistory.findAll({
        where: {
          storeId: parseInt(storeId),
          groupId: group.groupId,
          itemId: parseInt(itemId),
        },
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
            ],
          },
          {
            model: User,
            as: "changedByUser",
            attributes: ["userId", "username", "fullName"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
      });

      groupTransactions[group.groupId] = {
        group: {
          id: group.groupId,
          name: group.name,
          code: group.code,
        },
        transactions: transactions.map((t) => ({
          id: t.id,
          balanceId: t.balanceId,
          storeName: t.store?.name || null,
          groupName: t.group?.name || null,
          itemName: t.item?.standardName || t.item?.name || null,
          itemCode: t.item?.code || null,
          uomCode: t.item?.uom?.code || null,
          previousBalance: parseFloat(t.previousBalance),
          newBalance: parseFloat(t.newBalance),
          changeAmount: parseFloat(t.changeAmount),
          transactionType: t.transactionType,
          sourceStore: t.sourceStore?.name || null,
          destinationStore: t.destinationStore?.name || null,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
          remark: t.remark,
          createdAt: t.createdAt,
        })),
        count: transactions.length,
      };
    }

    // Get current balances
    const balanceMap = {};
    const baseBalances = await StoreBalance.findAll({
      where: {
        storeId: parseInt(storeId),
        itemId: parseInt(itemId),
      },
      include: [
        {
          model: Group,
          as: "group",
          attributes: ["id", "name", "code"],
        },
      ],
    });
    
    baseBalances.forEach((b) => {
      balanceMap[b.groupId] = {
        balance: parseFloat(b.balance),
        minStock: parseFloat(b.minStockAlert) || 0,
        status: b.status,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          code: store.code,
        },
        item: {
          id: item.itemId || item.id,
          code: item.code,
          name: item.name,
          standardName: item.standardName,
          uomCode: item.uom?.code || null,
        },
        currentBalances: balanceMap,
        groupTransactions,
        summary: {
          totalGroups: groups.length,
          totalTransactions: Object.values(groupTransactions).reduce((sum, g) => sum + g.count, 0),
        },
      },
    });

  } catch (error) {
    console.error("❌ Get item transactions error:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get item transactions',
    });
  }
};

// ============================================
// 7. GET USER AUDIT ACCESS
// ============================================
exports.getUserAuditAccess = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await getUserStoreAndGroup(userId);
    
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error || 'Failed to get user access' });
    }

    if (result.data.isAdmin) {
      const allStores = await Store.findAll({
        attributes: ['id', 'name', 'code', 'location', 'status'],
        order: [['name', 'ASC']],
      });

      return res.status(200).json({
        success: true,
        data: {
          isAdmin: true,
          stores: allStores,
          hasAccess: true,
        },
      });
    }

    const userGroups = result.data.allGroups || [];
    const storeIds = new Set();
    
    userGroups.forEach(group => {
      group.stores?.forEach(store => {
        storeIds.add(store.id);
      });
    });

    const stores = await Store.findAll({
      where: { id: { [Op.in]: Array.from(storeIds) } },
      attributes: ['id', 'name', 'code', 'location', 'status'],
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        isAdmin: false,
        stores: stores,
        hasAccess: stores.length > 0,
        assignedStoreId: result.data.assignedStoreId,
        assignedGroupId: result.data.assignedGroupId,
      },
    });

  } catch (error) {
    console.error("❌ Get user audit access error:", error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get user access' });
  }
};

// ============================================
// 8. EXPORT AUDIT DATA
// ============================================
exports.exportAuditData = async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📤 Exporting audit data for store: ${storeId}`);

    const mockReq = {
      params: { storeId },
      query: { includeTransactions: 'false' },
    };

    let auditResult = null;
    const mockRes = {
      status: function(code) {
        return {
          json: function(data) {
            auditResult = data;
            return this;
          }
        };
      }
    };

    await exports.getStoreAudit(mockReq, mockRes);

    if (!auditResult || !auditResult.success) {
      console.error('❌ Failed to get audit data:', auditResult?.error || 'Unknown error');
      return res.status(500).json({ 
        success: false, 
        error: auditResult?.error || 'Failed to get audit data for export' 
      });
    }

    const data = auditResult.data;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SUPER DOUBLE "T" GENERAL TRADING PLC';
    workbook.created = now;
    
    const worksheet = workbook.addWorksheet('Stock Audit', {
      properties: { tabColor: { argb: 'FF1A237E' } },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    const colors = {
      primary: 'FF1A237E',
      secondary: 'FF0D47A1',
      lightGray: 'FFF5F5F5',
      border: 'FFE0E0E0',
      green: 'FF2E7D32',
      red: 'FFD32F2F',
      white: 'FFFFFFFF',
      black: 'FF000000'
    };

    // Company Header
    worksheet.mergeCells('A1:G1');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = 'SUPER DOUBLE "T" GENERAL TRADING PLC';
    headerCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: colors.primary } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:G2');
    const subHeaderCell = worksheet.getCell('A2');
    subHeaderCell.value = 'WE TRUST IN GOD!!! እግዚአብሔር ይባረክ!!!';
    subHeaderCell.font = { name: 'Arial', size: 12, color: { argb: 'FF000000' } };
    subHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Report Title
    worksheet.addRow([]);
    worksheet.mergeCells('A4:G4');
    const titleCell = worksheet.getCell('A4');
    titleCell.value = 'STOCK AUDIT REPORT';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: colors.primary } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Store and Group Info
    worksheet.addRow([]);
    
    const firstGroup = data.groups[0] || {};
    const groupName = firstGroup.name || 'N/A';
    const groupCode = firstGroup.code || 'N/A';
    const categories = (data.categories && data.categories.length > 0) 
      ? data.categories.join(', ') 
      : 'All';
    const generatedBy = req.user?.fullName || req.user?.username || 'Admin';

    worksheet.addRow(['Store:', data.store.name, '', 'Group:', groupName]);
    worksheet.addRow(['Store Code:', data.store.code, '', 'Group Code:', groupCode]);
    worksheet.addRow(['Category:', categories, '', 'Status:', 'All']);
    worksheet.addRow(['Generated By:', generatedBy, '', 'Date/Time:', `${dateStr} at ${timeStr}`]);

    // Summary Section
    worksheet.addRow([]);
    
    const totalItems = data.summary.totalItems || 0;
    const activeItems = data.summary.activeItems || 0;
    const zeroStockItems = data.summary.zeroStockItems || 0;
    const lowStockItems = data.summary.lowStockItems || 0;
    const matchedItems = data.comparison?.summary?.matched || 0;
    const conflictItems = data.comparison?.summary?.conflict || 0;

    worksheet.mergeCells(`A${worksheet.rowCount}:G${worksheet.rowCount}`);
    const summaryTitle = worksheet.getCell(`A${worksheet.rowCount}`);
    summaryTitle.value = 'SUMMARY';
    summaryTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: colors.primary }, underline: true };
    summaryTitle.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.addRow([]);
    
    const summaryData = [
      ['Store:', data.store.name, 'Total Items:', totalItems],
      ['Group:', groupName, 'Active Items:', activeItems],
      ['', '', 'Zero Balance Items:', zeroStockItems],
      ['', '', 'Low Stock Items:', lowStockItems],
      ['', '', 'Matched Items:', matchedItems],
      ['', '', 'Items with Conflict:', conflictItems]
    ];

    summaryData.forEach(rowData => {
      const row = worksheet.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        if (colNumber % 2 === 1 && rowData[colNumber - 1] !== '') {
          cell.font = { name: 'Arial', size: 10, bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
          };
        } else if (colNumber % 2 === 0 && rowData[colNumber - 1] !== '') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: colors.primary } };
        }
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: colors.border } },
          bottom: { style: 'thin', color: { argb: colors.border } },
          left: { style: 'thin', color: { argb: colors.border } },
          right: { style: 'thin', color: { argb: colors.border } }
        };
      });
    });

    // Main Data Table
    worksheet.addRow([]);
    
    // Build headers with group columns
    const groupHeaders = [];
    data.groups.forEach(g => {
      groupHeaders.push(g.name);
    });
    
    const headers = [
      '#',
      'Item Code',
      'Item Name',
      'Category',
      'UOM',
      ...groupHeaders,
      'Status',
      'Balance Conflict'
    ];

    const headerRow = worksheet.addRow(headers);
    
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primary }
      };
      cell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: colors.white }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } }
      };
    });

    // Build items map
    const allItems = new Map();
    data.groups.forEach(group => {
      group.balances.forEach(balance => {
        const itemKey = balance.itemId;
        if (!allItems.has(itemKey)) {
          allItems.set(itemKey, {
            itemId: balance.itemId,
            itemCode: balance.itemCode,
            itemName: balance.itemName,
            category: balance.category?.name || 'N/A',
            uomCode: balance.uomCode || 'PCS',
            groupBalances: {},
            status: 'Active',
            hasConflict: false
          });
        }
        const item = allItems.get(itemKey);
        item.groupBalances[group.groupId] = balance.balance;
        
        // Update status from comparison
        if (data.comparison && data.comparison.items) {
          const compItem = data.comparison.items.find(ci => ci.itemId === balance.itemId);
          if (compItem) {
            item.status = compItem.status || 'Active';
            item.hasConflict = compItem.status === 'Conflict';
          }
        }
      });
    });

    const itemsArray = Array.from(allItems.values())
      .sort((a, b) => (a.itemCode || '').localeCompare(b.itemCode || ''));

    let rowNumber = 1;
    let rowIndex = 0;
    
    itemsArray.forEach((item) => {
      const rowData = [
        rowNumber++,
        item.itemCode || '',
        item.itemName || '',
        item.category || '',
        item.uomCode || '',
        ...data.groups.map(g => item.groupBalances[g.groupId] !== undefined ? item.groupBalances[g.groupId] : '-'),
        item.status || 'No Data',
        item.hasConflict ? 'Yes' : 'No'
      ];
      
      const row = worksheet.addRow(rowData);
      
      const bgColor = rowIndex % 2 === 0 ? colors.white : colors.lightGray;
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: colors.border } },
          bottom: { style: 'thin', color: { argb: colors.border } },
          left: { style: 'thin', color: { argb: colors.border } },
          right: { style: 'thin', color: { argb: colors.border } }
        };
      });
      
      rowIndex++;
    });

    // Footer
    worksheet.addRow([]);
    worksheet.addRow([`Report generated on ${dateStr} at ${timeStr}`]);
    worksheet.addRow(['SUPER DOUBLE "T" GENERAL TRADING PLC - Stock Audit Report']);
    worksheet.addRow(['WE TRUST IN GOD!!! እግዚአብሔር ይባረክ!!!']);

    const footerStartRow = worksheet.rowCount - 2;
    for (let i = 0; i < 3; i++) {
      const row = worksheet.getRow(footerStartRow + i);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (i === 1) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: colors.primary } };
        } else {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF666666' } };
        }
      });
      if (i === 0) {
        worksheet.mergeCells(`A${footerStartRow + i}:${String.fromCharCode(64 + headers.length)}${footerStartRow + i}`);
      } else if (i === 1) {
        worksheet.mergeCells(`A${footerStartRow + i}:${String.fromCharCode(64 + headers.length)}${footerStartRow + i}`);
      } else if (i === 2) {
        worksheet.mergeCells(`A${footerStartRow + i}:${String.fromCharCode(64 + headers.length)}${footerStartRow + i}`);
      }
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? String(cell.value).length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 30);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `stock_audit_${data.store.code}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    return res.send(buffer);

  } catch (error) {
    console.error("❌ Export audit data error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to export audit data' 
    });
  }
};

// ============================================
// 9. GET AUDIT SUMMARY
// ============================================
exports.getAuditSummary = async (req, res) => {
  try {
    const { storeId } = req.params;

    const auditResult = await exports.getStoreAudit({
      params: { storeId },
      query: { includeTransactions: 'false' },
    });

    if (!auditResult.success) {
      return res.status(500).json({ success: false, error: 'Failed to get audit summary' });
    }

    const data = auditResult.data;

    const summary = {
      store: data.store,
      overview: {
        totalGroups: data.summary.totalGroups,
        totalItems: data.summary.totalItems,
        totalBalance: data.summary.totalBalance,
        activeItems: data.summary.activeItems,
        inactiveItems: data.summary.inactiveItems,
        matchedItems: data.summary.matchedItems,
        conflictItems: data.summary.conflictItems,
        dateDiffItems: data.summary.dateDiffItems || 0,
      },
      groups: data.groups.map(g => ({
        groupId: g.groupId,
        name: g.name,
        totalItems: g.summary.totalItems,
        totalBalance: g.summary.totalBalance,
        lowStockItems: g.summary.lowStockItems,
        zeroStockItems: g.summary.zeroStockItems,
        lowStockPercentage: g.summary.lowStockPercentage,
        zeroStockPercentage: g.summary.zeroStockPercentage,
      })),
      comparison: data.comparison.summary,
      lastUpdated: new Date().toISOString(),
    };

    res.status(200).json({ success: true, data: summary });

  } catch (error) {
    console.error("❌ Get audit summary error:", error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get audit summary' });
  }
};

// ============================================
// 10. GET AUDIT DASHBOARD
// ============================================
exports.getAuditDashboard = async (req, res) => {
  try {
    const { storeId } = req.params;

    const auditResult = await exports.getStoreAudit({
      params: { storeId },
      query: { includeTransactions: 'true', transactionLimit: 10 },
    });

    if (!auditResult.success) {
      return res.status(500).json({ success: false, error: 'Failed to get audit dashboard' });
    }

    const data = auditResult.data;

    const lowStockAlerts = [];
    data.groups.forEach(group => {
      group.balances.forEach(balance => {
        if (balance.status === 'Active' && balance.balance <= balance.minStock) {
          lowStockAlerts.push({
            id: balance.id,
            itemName: balance.itemName,
            itemCode: balance.itemCode,
            balance: balance.balance,
            minStock: balance.minStock,
            groupName: group.name,
            uomCode: balance.uomCode,
            statusClass: balance.balance === 0 ? 'critical' : 'warning',
          });
        }
      });
    });

    const recentActivity = [];
    data.groups.forEach(group => {
      group.transactions.slice(0, 5).forEach(tx => {
        recentActivity.push({
          ...tx,
          groupName: group.name,
        });
      });
    });
    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const topActivity = recentActivity.slice(0, 10);

    const dashboard = {
      store: data.store,
      overview: {
        totalGroups: data.summary.totalGroups,
        totalItems: data.summary.totalItems,
        totalBalance: data.summary.totalBalance,
        activeItems: data.summary.activeItems,
        inactiveItems: data.summary.inactiveItems,
        matchedItems: data.comparison.summary.matched,
        conflictItems: data.comparison.summary.conflict,
        dateDiffItems: data.comparison.summary.dateDiff || 0,
      },
      groups: data.groups.map(g => ({
        groupId: g.groupId,
        name: g.name,
        totalItems: g.summary.totalItems,
        totalBalance: g.summary.totalBalance,
        lowStockItems: g.summary.lowStockItems,
        zeroStockItems: g.summary.zeroStockItems,
        lowStockPercentage: g.summary.lowStockPercentage,
        zeroStockPercentage: g.summary.zeroStockPercentage,
      })),
      recentActivity: topActivity,
      lowStockAlerts: lowStockAlerts.slice(0, 10),
      comparisonSummary: data.comparison.summary,
      lastUpdated: new Date().toISOString(),
    };

    res.status(200).json({ success: true, data: dashboard });

  } catch (error) {
    console.error("❌ Get audit dashboard error:", error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get audit dashboard' });
  }
};

// ============================================
// 11. UPDATE ITEM TRANSACTION DATES
// ============================================
exports.updateItemTransactionDates = async (req, res) => {
  const transaction = await sequelize.transaction()
  
  try {
    const { storeId, itemId } = req.params
    const { dates } = req.body
    
    console.log(`📝 Updating transaction dates for item ${itemId} in store ${storeId}`)
    console.log('📝 Updates:', dates)
    
    const item = await Item.findByPk(parseInt(itemId))
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      })
    }
    
    const store = await Store.findByPk(parseInt(storeId))
    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      })
    }
    
    const storeGroups = await StoreGroupRelation.findAll({
      where: { storeId: parseInt(storeId) },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'name', 'code'],
        }
      ]
    })
    
    const groups = storeGroups.map(sg => sg.group).filter(g => g !== null)
    
    const updatedGroups = []
    for (const group of groups) {
      const groupId = group.groupId
      const newDate = dates[groupId]
      
      if (!newDate) continue
      
      const lastTx = await StoreBalanceHistory.findOne({
        where: {
          storeId: parseInt(storeId),
          groupId: groupId,
          itemId: parseInt(itemId),
        },
        order: [['createdAt', 'DESC']],
        transaction: transaction
      })
      
      if (!lastTx) {
        console.log(`⚠️ No transaction found for group ${groupId}`)
        continue
      }
      
      const newDateObj = new Date(newDate)
      await lastTx.update({
        createdAt: newDateObj,
        updatedAt: new Date()
      }, { transaction })
      
      updatedGroups.push({
        groupId: groupId,
        groupName: group.name,
        oldDate: lastTx.createdAt,
        newDate: newDateObj
      })
      
      console.log(`✅ Updated group ${groupId} date from ${lastTx.createdAt} to ${newDate}`)
    }
    
    await transaction.commit()
    
    res.status(200).json({
      success: true,
      message: `Updated ${updatedGroups.length} group(s)`,
      data: {
        itemId: parseInt(itemId),
        storeId: parseInt(storeId),
        updatedGroups: updatedGroups
      }
    })
    
  } catch (error) {
    await transaction.rollback()
    console.error('❌ Error updating transaction dates:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update transaction dates'
    })
  }
}



// ============================================
// CONVERTED BALANCE (KG) AUDIT FUNCTIONS
// ============================================


const getConvertedBalancesForStore = async (storeId) => {
  try {
    // ✅ Check if ConvertedBalance model exists
    let ConvertedBalance;
    try {
      ConvertedBalance = require('../models').ConvertedBalance;
    } catch (e) {
      console.log('⚠️ ConvertedBalance model not found, returning empty array');
      return [];
    }

    if (!ConvertedBalance) {
      console.log('⚠️ ConvertedBalance model is undefined, returning empty array');
      return [];
    }

    const convertedBalances = await ConvertedBalance.findAll({
      where: {
        storeId: parseInt(storeId),
      },
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["storeId", "name", "code"],
        },
        {
          model: Group,
          as: "group",
          attributes: ["groupId", "name", "code"],
        },
        {
          model: Item,
          as: "item",
          attributes: ["itemId", "code", "name", "standardName", "conversionValue", "categoryId"],
          include: [
            {
              model: UOM,
              as: "conversionUom",
              attributes: ["id", "code", "name"],
            },
            {
              model: Category,
              as: "category",
              attributes: ["categoryId", "name", "description"],
            },
          ],
        },
      ],
      order: [["groupId", "ASC"], ["itemId", "ASC"]],
    });

    return convertedBalances || [];
  } catch (error) {
    console.error('❌ Error fetching converted balances:', error.message);
    return [];
  }
};

/**
 * Format converted balance
 */
const formatConvertedBalance = (record) => {
  const item = record.item;
  const conversionValue = item?.conversionValue !== undefined && item?.conversionValue !== null 
    ? parseFloat(item.conversionValue) 
    : 1;
  
  const balance = parseFloat(record.convertedBalance) || 0;
  const minStock = parseFloat(record.minStockAlert) || 0;

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
    category: item?.category || null,
    uomCode: item?.conversionUom?.code || null,
    uomName: item?.conversionUom?.name || null,
    conversionValue: conversionValue,
    balance: balance,
    minStock: minStock,
    baseBalance: balance * conversionValue,
    status: record.status || 'Active',
    statusClass: balance === 0 ? 'zero' : (balance <= minStock ? 'low' : 'normal'),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

/**
 * Calculate converted group summary
 */
const calculateConvertedGroupSummary = (balances) => {
  const summary = {
    totalItems: 0,
    totalBalance: 0,
    totalBaseBalance: 0,
    activeItems: 0,
    inactiveItems: 0,
    lowStockItems: 0,
    zeroStockItems: 0,
    averageBalance: 0,
    lowStockPercentage: 0,
    zeroStockPercentage: 0,
  };

  balances.forEach((record) => {
    const balance = parseFloat(record.balance);
    const conversionValue = parseFloat(record.conversionValue) || 1;
    const baseBalance = balance * conversionValue;
    const minStock = parseFloat(record.minStock) || 0;

    summary.totalItems++;
    summary.totalBalance += balance;
    summary.totalBaseBalance += baseBalance;

    if (record.status === "Active") {
      summary.activeItems++;
      if (balance === 0) {
        summary.zeroStockItems++;
      } else if (balance <= minStock) {
        summary.lowStockItems++;
      }
    } else {
      summary.inactiveItems++;
    }
  });

  summary.averageBalance = summary.totalItems > 0 ? summary.totalBalance / summary.totalItems : 0;
  summary.lowStockPercentage = summary.activeItems > 0 ? ((summary.lowStockItems / summary.activeItems) * 100) : 0;
  summary.zeroStockPercentage = summary.activeItems > 0 ? ((summary.zeroStockItems / summary.activeItems) * 100) : 0;

  return summary;
};

/**
 * Get last transaction dates for converted balances
 */
const getConvertedLastTransactionDates = async (storeId, groupIds, itemIds) => {
  try {
    if (!groupIds.length || !itemIds.length) {
      return {};
    }

    // ✅ Check if ConvertedBalanceHistory model exists
    let ConvertedBalanceHistory;
    try {
      ConvertedBalanceHistory = require('../models').ConvertedBalanceHistory;
    } catch (e) {
      console.log('⚠️ ConvertedBalanceHistory model not found');
      return {};
    }

    if (!ConvertedBalanceHistory) {
      return {};
    }

    const query = `
      SELECT DISTINCT ON (cbh."item_id", cbh."group_id") 
        cbh."item_id" as "itemId",
        cbh."group_id" as "groupId",
        cbh."created_at" as "lastTransactionDate"
      FROM "converted_balance_histories" cbh
      WHERE cbh."store_id" = :storeId
        AND cbh."group_id" IN (:groupIds)
        AND cbh."item_id" IN (:itemIds)
      ORDER BY cbh."item_id", cbh."group_id", cbh."created_at" DESC
    `;

    const results = await sequelize.query(query, {
      replacements: {
        storeId: parseInt(storeId),
        groupIds: groupIds,
        itemIds: itemIds
      },
      type: sequelize.QueryTypes.SELECT
    });

    const lastTxMap = {};
    results.forEach(row => {
      const key = `${row.itemId}_${row.groupId}`;
      lastTxMap[key] = row.lastTransactionDate;
    });

    return lastTxMap;

  } catch (error) {
    console.error('❌ Error getting converted last transaction dates:', error.message);
    return {};
  }
};

// ============================================
// 12. GET CONVERTED BALANCE AUDIT
// ============================================
exports.getConvertedAudit = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { includeTransactions = 'true', transactionLimit = 10 } = req.query;

    console.log(`🔍 Getting converted balance audit for store: ${storeId}`);

    // ✅ Check if ConvertedBalance model exists first
    let ConvertedBalance;
    try {
      ConvertedBalance = require('../models').ConvertedBalance;
    } catch (e) {
      console.log('⚠️ ConvertedBalance model not found');
    }

    // If model doesn't exist, return empty response
    if (!ConvertedBalance) {
      console.log('⚠️ ConvertedBalance model not available, returning empty response');
      return res.status(200).json({
        success: true,
        data: {
          store: null,
          groups: [],
          summary: {
            totalGroups: 0,
            totalItems: 0,
            totalBalance: 0,
            totalBaseBalance: 0,
            activeItems: 0,
            inactiveItems: 0,
            matchedItems: 0,
            conflictItems: 0,
            dateDiffItems: 0,
            totalProducts: 0,
            categories: []
          },
          categories: [],
          comparison: {
            items: [],
            summary: {
              total: 0,
              matched: 0,
              conflict: 0,
              dateDiff: 0,
              matchedPercentage: "0",
              conflictPercentage: "0",
              dateDiffPercentage: "0"
            }
          }
        }
      });
    }

    const store = await Store.findByPk(parseInt(storeId), {
      attributes: ['storeId', 'name', 'code', 'location', 'status'],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    const storeGroups = await StoreGroupRelation.findAll({
      where: { storeId: parseInt(storeId) },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'name', 'code', 'description', 'status'],
        }
      ],
      order: [['createdAt', 'ASC']],
    });

    const groups = storeGroups
      .map(sg => sg.group)
      .filter(g => g !== null);

    console.log(`📋 Found ${groups.length} groups for store ${storeId}`);

    // ============================================================
    // ✅ GET CONVERTED BALANCES
    // ============================================================
    const convertedBalances = await getConvertedBalancesForStore(parseInt(storeId));
    console.log(`✅ Found ${convertedBalances.length} converted balances for store ${storeId}`);

    // If no converted balances, return empty response
    if (convertedBalances.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          store: {
            id: store.storeId,
            name: store.name,
            code: store.code,
            location: store.location,
            status: store.status,
          },
          groups: groups.map(g => ({
            groupId: g.groupId,
            name: g.name,
            code: g.code || '',
            description: g.description || '',
            status: g.status || 'Active',
            balanceCount: 0,
            summary: {
              totalItems: 0,
              totalBalance: 0,
              totalBaseBalance: 0,
              activeItems: 0,
              inactiveItems: 0,
              lowStockItems: 0,
              zeroStockItems: 0,
              averageBalance: 0,
              lowStockPercentage: 0,
              zeroStockPercentage: 0,
            },
            balances: [],
            transactions: [],
          })),
          summary: {
            totalGroups: groups.length,
            totalItems: 0,
            totalBalance: 0,
            totalBaseBalance: 0,
            activeItems: 0,
            inactiveItems: 0,
            matchedItems: 0,
            conflictItems: 0,
            dateDiffItems: 0,
            totalProducts: 0,
            categories: [],
          },
          categories: [],
          comparison: {
            items: [],
            summary: {
              total: 0,
              matched: 0,
              conflict: 0,
              dateDiff: 0,
              matchedPercentage: "0",
              conflictPercentage: "0",
              dateDiffPercentage: "0"
            }
          }
        }
      });
    }

    // ============================================================
    // ✅ GROUP CONVERTED BALANCES
    // ============================================================
    const groupedBalances = {};
    const groupSummaries = {};
    const groupBalanceCounts = {};

    groups.forEach((group) => {
      const groupId = group.groupId;
      groupedBalances[groupId] = [];
      groupBalanceCounts[groupId] = 0;
    });

    // Process converted balances
    convertedBalances.forEach((balance) => {
      const groupId = balance.groupId;
      if (!groupId) return;
      
      const groupExists = groups.some(g => g.groupId === groupId);
      if (!groupExists) return;
      
      if (!groupedBalances[groupId]) {
        groupedBalances[groupId] = [];
      }
      
      const formattedBalance = formatConvertedBalance(balance);
      
      groupedBalances[groupId].push(formattedBalance);
      groupBalanceCounts[groupId] = (groupBalanceCounts[groupId] || 0) + 1;
    });

    groups.forEach((group) => {
      const groupId = group.groupId;
      const balances = groupedBalances[groupId] || [];
      groupSummaries[groupId] = calculateConvertedGroupSummary(balances);
    });

    console.log(`📊 Group converted balance counts:`, groupBalanceCounts);

    // ============================================================
    // ✅ BUILD COMPARISON DATA
    // ============================================================
    
    // Get all unique categories
    const categorySet = new Set();
    convertedBalances.forEach(balance => {
      if (balance.item?.category?.name) {
        categorySet.add(balance.item.category.name);
      }
    });
    const categories = Array.from(categorySet);

    // Get last transaction dates
    const groupIds = groups.map(g => g.groupId);
    const itemIds = [...new Set(convertedBalances.map(b => b.itemId))];
    const lastTxMap = await getConvertedLastTransactionDates(storeId, groupIds, itemIds);

    // Build item comparison map
    const itemMap = new Map();

    convertedBalances.forEach((balance) => {
      const itemId = balance.itemId;
      const groupId = balance.groupId;
      
      if (!groupId) return;
      if (!groups.some(g => g.groupId === groupId)) return;
      
      if (!itemMap.has(itemId)) {
        const item = balance.item;
        itemMap.set(itemId, {
          itemId: itemId,
          code: item?.code || null,
          itemName: item?.standardName || item?.name || null,
          commonName: item?.standardName || item?.name || null,
          standardName: item?.standardName || null,
          category: item?.category?.name || null,
          uomCode: item?.conversionUom?.code || null,
          uomName: item?.conversionUom?.name || null,
          conversionValue: parseFloat(item?.conversionValue) || 1,
          groupBalances: {},
          groupLastTxDates: {},
        });
      }
      
      const item = itemMap.get(itemId);
      item.groupBalances[groupId] = parseFloat(balance.convertedBalance || 0);
      
      const key = `${itemId}_${groupId}`;
      if (lastTxMap[key]) {
        item.groupLastTxDates[groupId] = lastTxMap[key];
      }
    });

    // Determine status for each item
    const comparisonItems = [];
    let matchedCount = 0;
    let conflictCount = 0;
    let dateDiffCount = 0;

    itemMap.forEach((item) => {
      const groupIds = Object.keys(item.groupBalances);
      const values = groupIds.map(gid => item.groupBalances[gid] || 0);
      
      const uniqueValues = [...new Set(values)];
      
      let status = 'No Data';
      if (values.length === 0) {
        status = 'No Data';
      } else if (uniqueValues.length === 1) {
        status = 'Matched';
        matchedCount++;
      } else {
        status = 'Conflict';
        conflictCount++;
      }
      
      const dates = Object.values(item.groupLastTxDates || {}).filter(d => d !== undefined && d !== null);
      const uniqueDateStrings = [...new Set(dates.map(d => new Date(d).toDateString()))];
      const hasDateDiff = uniqueDateStrings.length > 1;
      
      if (hasDateDiff && status === 'Matched') {
        dateDiffCount++;
      }

      comparisonItems.push({
        itemId: item.itemId,
        code: item.code,
        itemName: item.itemName,
        commonName: item.commonName,
        standardName: item.standardName,
        category: item.category,
        uomCode: item.uomCode,
        uomName: item.uomName,
        conversionValue: item.conversionValue,
        groupBalances: item.groupBalances,
        groupLastTxDates: item.groupLastTxDates,
        status,
        statusClass: getStatusClass(status),
        values,
        hasDateDiff,
        dateDiffDetails: hasDateDiff ? {
          uniqueDates: uniqueDateStrings,
          diffDays: dates.length > 1 ? Math.round((new Date(Math.max(...dates.map(d => new Date(d).getTime()))) - new Date(Math.min(...dates.map(d => new Date(d).getTime())))) / (1000 * 60 * 60 * 24)) : 0,
        } : null,
      });
    });

    // ============================================================
    // ✅ BUILD GROUP AUDIT DATA
    // ============================================================
    const groupAuditData = await Promise.all(groups.map(async (group) => {
      const groupId = group.groupId;
      const balances = groupedBalances[groupId] || [];
      
      let transactions = [];
      if (includeTransactions === 'true') {
        try {
          // ✅ Check if ConvertedBalanceHistory exists
          let ConvertedBalanceHistory;
          try {
            ConvertedBalanceHistory = require('../models').ConvertedBalanceHistory;
          } catch (e) {
            console.log('⚠️ ConvertedBalanceHistory model not found');
          }

          if (ConvertedBalanceHistory) {
            const allTransactions = await ConvertedBalanceHistory.findAll({
              where: {
                storeId: parseInt(storeId),
                groupId: groupId,
              },
              include: [
                {
                  model: Store,
                  as: "store",
                  attributes: ["storeId", "name", "code"],
                },
                {
                  model: Group,
                  as: "group",
                  attributes: ["groupId", "name", "code"],
                },
                {
                  model: Item,
                  as: "item",
                  attributes: ["itemId", "code", "name", "standardName"],
                },
                {
                  model: User,
                  as: "changedByUser",
                  attributes: ["userId", "username", "fullName"],
                },
              ],
              order: [["createdAt", "DESC"]],
              limit: parseInt(transactionLimit),
            });

            transactions = allTransactions.map((t) => ({
              id: t.id,
              balanceId: t.balanceId,
              storeName: t.store?.name || null,
              groupName: t.group?.name || null,
              itemName: t.item?.standardName || t.item?.name || null,
              itemCode: t.item?.code || null,
              uomCode: t.item?.conversionUom?.code || null,
              previousBalance: parseFloat(t.previousBalance),
              newBalance: parseFloat(t.newBalance),
              changeAmount: parseFloat(t.changeAmount),
              transactionType: t.transactionType,
              changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
              remark: t.remark,
              createdAt: t.createdAt,
            }));
          }
        } catch (txError) {
          console.error(`⚠️ Error fetching converted transactions for group ${groupId}:`, txError.message);
        }
      }

      return {
        groupId: groupId,
        name: group.name,
        code: group.code || '',
        description: group.description || '',
        status: group.status || 'Active',
        balanceCount: balances.length,
        summary: groupSummaries[groupId] || {
          totalItems: 0,
          totalBalance: 0,
          totalBaseBalance: 0,
          activeItems: 0,
          inactiveItems: 0,
          lowStockItems: 0,
          zeroStockItems: 0,
          averageBalance: 0,
          lowStockPercentage: 0,
          zeroStockPercentage: 0,
        },
        balances: balances,
        transactions: transactions,
      };
    }));

    // ============================================================
    // ✅ BUILD OVERALL SUMMARY
    // ============================================================
    let totalItems = 0;
    let totalBalance = 0;
    let activeItems = 0;
    let inactiveItems = 0;
    
    groupAuditData.forEach(g => {
      totalItems += g.balances.length;
      g.balances.forEach(b => {
        totalBalance += b.balance || 0;
        if (b.status === 'Active') activeItems++;
        else inactiveItems++;
      });
    });

    const overallSummary = {
      totalGroups: groups.length,
      totalItems: totalItems,
      totalBalance: totalBalance,
      totalBaseBalance: totalBalance,
      activeItems: activeItems,
      inactiveItems: inactiveItems,
      matchedItems: matchedCount,
      conflictItems: conflictCount,
      dateDiffItems: dateDiffCount,
      totalProducts: itemMap.size,
      categories: categories,
    };

    // ============================================================
    // ✅ BUILD FINAL RESPONSE
    // ============================================================
    const responseData = {
      store: {
        id: store.storeId,
        name: store.name,
        code: store.code,
        location: store.location,
        status: store.status,
      },
      groups: groupAuditData,
      summary: overallSummary,
      categories: categories,
      comparison: {
        items: comparisonItems,
        summary: {
          total: itemMap.size,
          matched: matchedCount,
          conflict: conflictCount,
          dateDiff: dateDiffCount,
          matchedPercentage: itemMap.size > 0 ? ((matchedCount / itemMap.size) * 100).toFixed(1) : "0",
          conflictPercentage: itemMap.size > 0 ? ((conflictCount / itemMap.size) * 100).toFixed(1) : "0",
          dateDiffPercentage: itemMap.size > 0 ? ((dateDiffCount / itemMap.size) * 100).toFixed(1) : "0",
        },
      },
    };

    console.log(`✅ Converted audit completed: ${overallSummary.totalItems} items, ${overallSummary.totalProducts} products, ${conflictCount} conflicts`);

    return res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("❌ Get converted audit error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get converted audit data',
    });
  }
};

// ============================================
// 13. GET CONVERTED GROUP TRANSACTIONS
// Uses StoreBalanceHistory with isBaseUom = false
// ============================================
exports.getConvertedGroupTransactions = async (req, res) => {
  try {
    const { storeId, groupId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log(`🔍 Getting converted group transactions for store ${storeId}, group ${groupId}`);

    // ✅ Use StoreBalanceHistory with isBaseUom = false
    const transactions = await StoreBalanceHistory.findAll({
      where: {
        storeId: parseInt(storeId),
        groupId: parseInt(groupId),
        isBaseUom: false, // ✅ Only converted (KG) transactions
      },
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
              as: "conversionUom",
              attributes: ["id", "code", "name"],
            },
          ],
        },
        {
          model: User,
          as: "changedByUser",
          attributes: ["userId", "username", "fullName"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    const total = await StoreBalanceHistory.count({
      where: {
        storeId: parseInt(storeId),
        groupId: parseInt(groupId),
        isBaseUom: false,
      },
    });

    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      balanceId: t.balanceId,
      storeName: t.store?.name || null,
      groupName: t.group?.name || null,
      itemName: t.item?.standardName || t.item?.name || null,
      itemCode: t.item?.code || null,
      uomCode: t.item?.conversionUom?.code || null,
      previousBalance: parseFloat(t.previousBalance) || 0,
      newBalance: parseFloat(t.newBalance) || 0,
      changeAmount: parseFloat(t.changeAmount) || 0,
      transactionType: t.transactionType || 'ADJUSTMENT',
      changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
      remark: t.remark || null,
      createdAt: t.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });

  } catch (error) {
    console.error("❌ Get converted group transactions error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get converted group transactions',
    });
  }
};

// ============================================
// 14. GET CONVERTED ITEM TRANSACTIONS
// Uses StoreBalanceHistory with isBaseUom = false
// ============================================
exports.getConvertedItemTransactions = async (req, res) => {
  try {
    const { storeId, itemId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`🔍 Getting converted item transactions for item ${itemId} in store ${storeId}`);

    const store = await Store.findByPk(parseInt(storeId));
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    const item = await Item.findByPk(parseInt(itemId));
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const storeGroups = await StoreGroupRelation.findAll({
      where: { storeId: parseInt(storeId) },
      include: [
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'name', 'code'],
        }
      ],
    });

    const groups = storeGroups.map(sg => sg.group).filter(g => g !== null);

    const groupTransactions = {};
    
    // ✅ Use StoreBalanceHistory with isBaseUom = false
    for (const group of groups) {
      try {
        const transactions = await StoreBalanceHistory.findAll({
          where: {
            storeId: parseInt(storeId),
            groupId: group.groupId,
            itemId: parseInt(itemId),
            isBaseUom: false, // ✅ Only converted (KG) transactions
          },
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
                  as: "conversionUom",
                  attributes: ["id", "code", "name"],
                },
              ],
            },
            {
              model: User,
              as: "changedByUser",
              attributes: ["userId", "username", "fullName"],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: parseInt(limit),
        });

        groupTransactions[group.groupId] = {
          group: {
            id: group.groupId,
            name: group.name,
            code: group.code,
          },
          transactions: transactions.map((t) => ({
            id: t.id,
            balanceId: t.balanceId,
            storeName: t.store?.name || null,
            groupName: t.group?.name || null,
            itemName: t.item?.standardName || t.item?.name || null,
            itemCode: t.item?.code || null,
            uomCode: t.item?.conversionUom?.code || null,
            previousBalance: parseFloat(t.previousBalance) || 0,
            newBalance: parseFloat(t.newBalance) || 0,
            changeAmount: parseFloat(t.changeAmount) || 0,
            transactionType: t.transactionType || 'ADJUSTMENT',
            changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
            remark: t.remark || null,
            createdAt: t.createdAt,
          })),
          count: transactions.length,
        };
      } catch (err) {
        console.log(`⚠️ Error fetching converted transactions for group ${group.groupId}:`, err.message);
        groupTransactions[group.groupId] = {
          group: {
            id: group.groupId,
            name: group.name,
            code: group.code,
          },
          transactions: [],
          count: 0,
        };
      }
    }

    // ✅ Get current converted balances (using ConvertedBalance if it exists)
    let ConvertedBalance;
    try {
      ConvertedBalance = require('../models').ConvertedBalance;
    } catch (e) {
      console.log('⚠️ ConvertedBalance model not found');
    }

    const balanceMap = {};
    if (ConvertedBalance) {
      try {
        const convertedBalances = await ConvertedBalance.findAll({
          where: {
            storeId: parseInt(storeId),
            itemId: parseInt(itemId),
          },
          include: [
            {
              model: Group,
              as: "group",
              attributes: ["id", "name", "code"],
            },
          ],
        });
        
        convertedBalances.forEach((b) => {
          balanceMap[b.groupId] = {
            balance: parseFloat(b.convertedBalance) || 0,
            minStock: parseFloat(b.minStockAlert) || 0,
            status: b.status || 'Active',
          };
        });
      } catch (err) {
        console.log('⚠️ Error fetching converted balances:', err.message);
      }
    }

    const totalTransactions = Object.values(groupTransactions).reduce((sum, g) => sum + g.count, 0);
    console.log(`✅ Found ${totalTransactions} converted transactions for item ${itemId}`);

    res.status(200).json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          code: store.code,
        },
        item: {
          id: item.itemId || item.id,
          code: item.code,
          name: item.name,
          standardName: item.standardName || null,
          uomCode: item.conversionUom?.code || null,
        },
        currentBalances: balanceMap,
        groupTransactions,
        summary: {
          totalGroups: groups.length,
          totalTransactions: totalTransactions,
        },
      },
    });

  } catch (error) {
    console.error("❌ Get converted item transactions error:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get converted item transactions',
    });
  }
};

// ============================================
// 15. EXPORT CONVERTED AUDIT DATA
// ============================================
exports.exportConvertedAudit = async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`📤 Exporting converted audit data for store: ${storeId}`);

    // ✅ Check if ConvertedBalance model exists
    let ConvertedBalance;
    try {
      ConvertedBalance = require('../models').ConvertedBalance;
    } catch (e) {
      console.log('⚠️ ConvertedBalance model not found');
      return res.status(200).json({
        success: true,
        message: 'No converted balance data available for export',
        data: null,
      });
    }

    if (!ConvertedBalance) {
      return res.status(200).json({
        success: true,
        message: 'No converted balance data available for export',
        data: null,
      });
    }

    // Check if there's any data first
    const count = await ConvertedBalance.count({
      where: { storeId: parseInt(storeId) },
    });

    if (count === 0) {
      return res.status(200).json({
        success: true,
        message: 'No converted balance data available for this store',
        data: null,
      });
    }

    const mockReq = {
      params: { storeId },
      query: { includeTransactions: 'false' },
    };

    let auditResult = null;
    const mockRes = {
      status: function(code) {
        return {
          json: function(data) {
            auditResult = data;
            return this;
          }
        };
      }
    };

    await exports.getConvertedAudit(mockReq, mockRes);

    if (!auditResult || !auditResult.success) {
      console.error('❌ Failed to get converted audit data:', auditResult?.error || 'Unknown error');
      return res.status(500).json({ 
        success: false, 
        error: auditResult?.error || 'Failed to get converted audit data for export' 
      });
    }

    const data = auditResult.data;

    // If no data, return empty response
    if (!data.groups || data.groups.length === 0 || data.groups.every(g => g.balances.length === 0)) {
      return res.status(200).json({
        success: true,
        message: 'No converted balance data available for export',
        data: null,
      });
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SUPER DOUBLE "T" GENERAL TRADING PLC';
    workbook.created = now;
    
    const worksheet = workbook.addWorksheet('Converted Stock Audit', {
      properties: { tabColor: { argb: 'FF6A1B9A' } },
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    const colors = {
      primary: 'FF6A1B9A',
      secondary: 'FF8E24AA',
      lightGray: 'FFF5F5F5',
      border: 'FFE0E0E0',
      green: 'FF2E7D32',
      red: 'FFD32F2F',
      white: 'FFFFFFFF',
      black: 'FF000000'
    };

    // ============================================================
    // COMPANY HEADER
    // ============================================================
    worksheet.mergeCells('A1:G1');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = 'SUPER DOUBLE "T" GENERAL TRADING PLC';
    headerCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: colors.primary } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:G2');
    const subHeaderCell = worksheet.getCell('A2');
    subHeaderCell.value = 'WE TRUST IN GOD!!! እግዚአብሔር ይባረክ!!!';
    subHeaderCell.font = { name: 'Arial', size: 12, color: { argb: 'FF000000' } };
    subHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ============================================================
    // REPORT TITLE
    // ============================================================
    worksheet.addRow([]);
    worksheet.mergeCells('A4:G4');
    const titleCell = worksheet.getCell('A4');
    titleCell.value = 'CONVERTED BALANCE (KG) AUDIT REPORT';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: colors.primary } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ============================================================
    // STORE AND GROUP INFO
    // ============================================================
    worksheet.addRow([]);
    
    const firstGroup = data.groups[0] || {};
    const groupName = firstGroup.name || 'N/A';
    const groupCode = firstGroup.code || 'N/A';
    const categories = (data.categories && data.categories.length > 0) 
      ? data.categories.join(', ') 
      : 'All';
    const generatedBy = req.user?.fullName || req.user?.username || 'Admin';

    worksheet.addRow(['Store:', data.store.name, '', 'Group:', groupName]);
    worksheet.addRow(['Store Code:', data.store.code, '', 'Group Code:', groupCode]);
    worksheet.addRow(['Category:', categories, '', 'Status:', 'All']);
    worksheet.addRow(['Generated By:', generatedBy, '', 'Date/Time:', `${dateStr} at ${timeStr}`]);

    // ============================================================
    // SUMMARY SECTION
    // ============================================================
    worksheet.addRow([]);
    
    const totalItems = data.summary.totalItems || 0;
    const activeItems = data.summary.activeItems || 0;
    const zeroStockItems = data.summary.zeroStockItems || 0;
    const lowStockItems = data.summary.lowStockItems || 0;
    const matchedItems = data.comparison?.summary?.matched || 0;
    const conflictItems = data.comparison?.summary?.conflict || 0;

    worksheet.mergeCells(`A${worksheet.rowCount}:G${worksheet.rowCount}`);
    const summaryTitle = worksheet.getCell(`A${worksheet.rowCount}`);
    summaryTitle.value = 'SUMMARY';
    summaryTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: colors.primary }, underline: true };
    summaryTitle.alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.addRow([]);
    
    const summaryData = [
      ['Store:', data.store.name, 'Total Items:', totalItems],
      ['Group:', groupName, 'Active Items:', activeItems],
      ['', '', 'Zero Balance Items:', zeroStockItems],
      ['', '', 'Low Stock Items:', lowStockItems],
      ['', '', 'Matched Items:', matchedItems],
      ['', '', 'Items with Conflict:', conflictItems]
    ];

    summaryData.forEach(rowData => {
      const row = worksheet.addRow(rowData);
      row.eachCell((cell, colNumber) => {
        if (colNumber % 2 === 1 && rowData[colNumber - 1] !== '') {
          cell.font = { name: 'Arial', size: 10, bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
          };
        } else if (colNumber % 2 === 0 && rowData[colNumber - 1] !== '') {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: colors.primary } };
        }
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: colors.border } },
          bottom: { style: 'thin', color: { argb: colors.border } },
          left: { style: 'thin', color: { argb: colors.border } },
          right: { style: 'thin', color: { argb: colors.border } }
        };
      });
    });

    // ============================================================
    // MAIN DATA TABLE
    // ============================================================
    worksheet.addRow([]);
    
    // Build headers with group columns
    const groupHeaders = [];
    data.groups.forEach(g => {
      groupHeaders.push(g.name);
    });
    
    const headers = [
      '#',
      'Item Code',
      'Item Name',
      'Category',
      'UOM (KG)',
      ...groupHeaders,
      'Status',
      'Balance Conflict'
    ];

    const headerRow = worksheet.addRow(headers);
    
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.primary }
      };
      cell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: colors.white }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: colors.border } },
        bottom: { style: 'thin', color: { argb: colors.border } },
        left: { style: 'thin', color: { argb: colors.border } },
        right: { style: 'thin', color: { argb: colors.border } }
      };
    });

    // ============================================================
    // BUILD ITEMS MAP
    // ============================================================
    const allItems = new Map();
    data.groups.forEach(group => {
      group.balances.forEach(balance => {
        const itemKey = balance.itemId;
        if (!allItems.has(itemKey)) {
          allItems.set(itemKey, {
            itemId: balance.itemId,
            itemCode: balance.itemCode,
            itemName: balance.itemName,
            category: balance.category?.name || balance.category || 'N/A',
            uomCode: balance.uomCode || 'KG',
            groupBalances: {},
            status: 'Active',
            hasConflict: false
          });
        }
        const item = allItems.get(itemKey);
        item.groupBalances[group.groupId] = balance.balance;
        
        // Update status from comparison
        if (data.comparison && data.comparison.items) {
          const compItem = data.comparison.items.find(ci => ci.itemId === balance.itemId);
          if (compItem) {
            item.status = compItem.status || 'Active';
            item.hasConflict = compItem.status === 'Conflict';
          }
        }
      });
    });

    const itemsArray = Array.from(allItems.values())
      .sort((a, b) => (a.itemCode || '').localeCompare(b.itemCode || ''));

    // ============================================================
    // POPULATE TABLE DATA
    // ============================================================
    let rowNumber = 1;
    let rowIndex = 0;
    
    itemsArray.forEach((item) => {
      const rowData = [
        rowNumber++,
        item.itemCode || '',
        item.itemName || '',
        item.category || '',
        item.uomCode || 'KG',
        ...data.groups.map(g => item.groupBalances[g.groupId] !== undefined ? item.groupBalances[g.groupId] : '-'),
        item.status || 'No Data',
        item.hasConflict ? 'Yes' : 'No'
      ];
      
      const row = worksheet.addRow(rowData);
      
      // Style the row
      const bgColor = rowIndex % 2 === 0 ? colors.white : colors.lightGray;
      row.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor }
        };
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: colors.border } },
          bottom: { style: 'thin', color: { argb: colors.border } },
          left: { style: 'thin', color: { argb: colors.border } },
          right: { style: 'thin', color: { argb: colors.border } }
        };
        
        // Highlight conflict rows
        if (item.hasConflict) {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: colors.red } };
        }
      });
      
      rowIndex++;
    });

    // ============================================================
    // FOOTER
    // ============================================================
    worksheet.addRow([]);
    worksheet.addRow([`Report generated on ${dateStr} at ${timeStr}`]);
    worksheet.addRow(['SUPER DOUBLE "T" GENERAL TRADING PLC - Converted Balance Audit Report']);
    worksheet.addRow(['WE TRUST IN GOD!!! እግዚአብሔር ይባረክ!!!']);

    const footerStartRow = worksheet.rowCount - 2;
    for (let i = 0; i < 3; i++) {
      const row = worksheet.getRow(footerStartRow + i);
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (i === 1) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: colors.primary } };
        } else {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF666666' } };
        }
      });
      if (i === 0) {
        worksheet.mergeCells(`A${footerStartRow + i}:${String.fromCharCode(64 + headers.length)}${footerStartRow + i}`);
      } else if (i === 1) {
        worksheet.mergeCells(`A${footerStartRow + i}:${String.fromCharCode(64 + headers.length)}${footerStartRow + i}`);
      } else if (i === 2) {
        worksheet.mergeCells(`A${footerStartRow + i}:${String.fromCharCode(64 + headers.length)}${footerStartRow + i}`);
      }
    }

    // ============================================================
    // AUTO-FIT COLUMNS
    // ============================================================
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? String(cell.value).length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 30);
    });

    // ============================================================
    // GENERATE AND SEND FILE
    // ============================================================
    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `converted_audit_${data.store.code}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    return res.send(buffer);

  } catch (error) {
    console.error("❌ Export converted audit error:", error.message);
    console.error("❌ Stack trace:", error.stack);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to export converted audit data' 
    });
  }
};

















module.exports = exports;