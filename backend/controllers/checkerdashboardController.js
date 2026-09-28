// controllers/checkerdashboardController.js
// Complete Checker Dashboard Controller - Store-Level Matching ONLY

const { Op } = require("sequelize");
const { getUserStoreAndGroup } = require("../utils/userAccess");

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

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get last transaction dates for each item per group
 */
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

/**
 * Determine status for a single store (compare IT vs Storekeeper)
 * Returns 'Matched' if balances are equal, 'Conflict' if different or missing
 */
const determineStoreItemStatus = (groupBalances) => {
  const values = Object.values(groupBalances).filter(v => v !== null && v !== undefined);
  
  // If item exists in only one group (missing in the other)
  if (values.length !== 2) {
    return 'Conflict';
  }
  
  // If both groups have data, check if they match
  const [balance1, balance2] = values;
  if (balance1 === balance2) {
    return 'Matched';
  } else {
    return 'Conflict';
  }
};

/**
 * Get status class for frontend
 */
const getStatusClass = (status) => {
  const map = {
    'Matched': 'matched',
    'Conflict': 'conflict',
    'No Data': 'unknown'
  };
  return map[status] || 'unknown';
};

// ================================================================
// MAIN DASHBOARD SUMMARY - STORE-LEVEL MATCHING ONLY
// ================================================================

/**
 * Get dashboard summary data - matches frontend exactly
 * GET /api/checker/dashboard/summary
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    console.log(`📊 Getting dashboard summary for store: ${storeId || 'All Stores'}`);

    // ================================================================
    // STEP 1: Get inventory stats (Cards 1 & 2)
    // ================================================================

    const allItems = await Item.findAll({
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
          attributes: ["categoryId", "name"],
        },
      ],
    });

    const totalItems = allItems.length;
    const activeItems = allItems.filter(i => i.status === 'Active').length;
    const inactiveItems = allItems.filter(i => i.status === 'Inactive').length;

    // Missing data stats
    let missingConversion = 0;
    let missingCost = 0;
    let healthyItems = 0;

    allItems.forEach(item => {
      const hasConversion = item.conversionValue && item.conversionValue > 0;
      const hasCost = item.costPrice && item.costPrice > 0;

      if (!hasConversion) missingConversion++;
      if (!hasCost) missingCost++;

      if (item.status === 'Active' && hasConversion && hasCost) {
        healthyItems++;
      }
    });

    // ================================================================
    // STEP 2: Get stores and groups
    // ================================================================

    const stores = await Store.findAll({
      where: { status: 'Active' },
      attributes: ['storeId', 'name', 'code', 'location', 'status'],
    });

    const balanceWhere = {};
    let targetStoreId = null;
    let targetGroups = [];

    if (storeId) {
      balanceWhere.storeId = parseInt(storeId);
      targetStoreId = parseInt(storeId);
      
      const storeGroups = await StoreGroupRelation.findAll({
        where: { storeId: parseInt(storeId) },
        include: [
          {
            model: Group,
            as: 'group',
            attributes: ['groupId', 'name', 'code', 'description', 'status'],
          }
        ],
      });
      targetGroups = storeGroups.map(sg => sg.group).filter(g => g !== null);
    } else {
      targetGroups = await Group.findAll({
        where: { status: 'Active' },
        attributes: ['groupId', 'name', 'code', 'description', 'status'],
      });
    }

    // Get all balances
    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
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
          attributes: ["itemId", "code", "name", "standardName", "conversionValue", "categoryId", "status"],
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
    });

    // Get last transaction dates
    const groupIds = targetGroups.map(g => g.groupId);
    const itemIds = [...new Set(allBalances.map(b => b.itemId))];
    
    let lastTxMap = {};
    if (groupIds.length > 0 && itemIds.length > 0) {
      const storeIdForTx = targetStoreId || (allBalances.length > 0 ? allBalances[0].storeId : 0);
      lastTxMap = await getLastTransactionDates(storeIdForTx, groupIds, itemIds);
    }

    // ================================================================
    // STEP 3: Build Store-Level Data (IT vs Storekeeper per store)
    // ================================================================

    // Group balances by STORE
    const storeItemMap = new Map();
    
    allBalances.forEach((balance) => {
      const storeIdKey = balance.storeId;
      if (!storeItemMap.has(storeIdKey)) {
        storeItemMap.set(storeIdKey, {
          storeId: storeIdKey,
          storeName: balance.store?.name || 'Unknown',
          storeCode: balance.store?.code || '',
          items: new Map(),
          groups: new Set(),
        });
      }
      
      const store = storeItemMap.get(storeIdKey);
      store.groups.add(balance.groupId);
      
      if (!store.items.has(balance.itemId)) {
        store.items.set(balance.itemId, {
          itemId: balance.itemId,
          code: balance.item?.code || null,
          name: balance.item?.standardName || balance.item?.name || null,
          groupBalances: {},
          groupLastTxDates: {},
          storeName: balance.store?.name || 'Unknown',
        });
      }
      
      const item = store.items.get(balance.itemId);
      item.groupBalances[balance.groupId] = parseFloat(balance.balance);
      
      const key = `${balance.itemId}_${balance.groupId}`;
      if (lastTxMap[key]) {
        item.groupLastTxDates[balance.groupId] = lastTxMap[key];
      }
    });

    // ================================================================
    // STEP 4: Calculate Store-Level Matches and Conflicts
    // ================================================================

    let totalMatched = 0;
    let totalConflicts = 0;
    let totalStoreItems = 0;
    let totalDateDiffs = 0;
    const storeConflictData = [];
    const allConflictItems = [];
    const allDateDiffItems = [];

    storeItemMap.forEach((store) => {
      let storeMatched = 0;
      let storeConflict = 0;
      let storeDateDiffs = 0;

      store.items.forEach((item) => {
        const groupValues = Object.values(item.groupBalances);
        const status = determineStoreItemStatus(item.groupBalances);
        
        if (status === 'Matched') {
          storeMatched++;
        } else if (status === 'Conflict') {
          storeConflict++;
          
          // Calculate diff for conflict details
          const values = Object.values(item.groupBalances).filter(v => v !== null && v !== undefined);
          let diff = 0;
          if (values.length === 2) {
            diff = Math.abs(values[0] - values[1]);
          }
          
          allConflictItems.push({
            code: item.code || 'N/A',
            name: item.name || 'Unknown',
            store: store.storeName,
            diff: diff,
            groupBalances: item.groupBalances,
          });
        }
        
        // Check for date differences
        const dates = Object.values(item.groupLastTxDates || {}).filter(d => d !== undefined && d !== null);
        if (dates.length > 1) {
          const uniqueDateStrings = [...new Set(dates.map(d => new Date(d).toDateString()))];
          if (uniqueDateStrings.length > 1) {
            storeDateDiffs++;
            const dateObjects = dates.map(d => new Date(d));
            const latestDate = new Date(Math.max(...dateObjects.map(d => d.getTime())));
            const earliestDate = new Date(Math.min(...dateObjects.map(d => d.getTime())));
            const diffMs = latestDate - earliestDate;
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            
            allDateDiffItems.push({
              code: item.code || 'N/A',
              name: item.name || 'Unknown',
              store: store.storeName,
              days: diffDays,
            });
          }
        }
      });

      totalMatched += storeMatched;
      totalConflicts += storeConflict;
      totalStoreItems += store.items.size;
      totalDateDiffs += storeDateDiffs;

      storeConflictData.push({
        name: store.storeName,
        total: store.items.size,
        matched: storeMatched,
        conflicts: storeConflict,
        dateDiffs: storeDateDiffs,
        health: store.items.size > 0 ? Math.round((storeMatched / store.items.size) * 100) : 0,
      });
    });

    // Sort by conflicts descending
    storeConflictData.sort((a, b) => b.conflicts - a.conflicts);

    // ================================================================
    // STEP 5: Top Issues (Top 10 conflicts and date diffs)
    // ================================================================

    // Sort conflicts by diff descending
    allConflictItems.sort((a, b) => b.diff - a.diff);
    const top10Conflicts = allConflictItems.slice(0, 10);

    // Sort date diffs by days descending
    allDateDiffItems.sort((a, b) => b.days - a.days);
    const top10DateDiffs = allDateDiffItems.slice(0, 10);

    // ================================================================
    // STEP 6: Build Response
    // ================================================================

    const totalStores = storeId ? 1 : stores.length;

    const responseData = {
      // Card 1: Total Items
      inventoryStats: {
        totalItems: totalItems,
        activeItems: activeItems,
        inactiveItems: inactiveItems,
        missingConversion: missingConversion,
        missingCost: missingCost,
        healthyItems: healthyItems,
      },
      
      // Card 3: Total Stores - STORE-LEVEL MATCHING ONLY
      auditStats: {
        totalStores: totalStores,
        totalItems: totalStoreItems, // Total items across all stores
        matched: totalMatched,
        conflicts: totalConflicts,
        dateDiffs: totalDateDiffs,
      },
      
      // Store Conflict Chart
      storeConflictData: storeConflictData,
      
      // Top Issues
      topConflicts: top10Conflicts,
      topDateDiffs: top10DateDiffs,
      
      // Extra metadata
      summary: {
        totalGroups: targetGroups.length,
        totalProducts: allConflictItems.length + (totalMatched || 0),
        storeMatched: totalMatched,
        storeConflicts: totalConflicts,
        conflictPercentage: totalStoreItems > 0 ? ((totalConflicts / totalStoreItems) * 100).toFixed(2) + '%' : '0%',
        lastUpdated: new Date().toISOString(),
      }
    };

    console.log(`✅ Dashboard summary generated (Store-Level Matching):`);
    console.log(`   - ${totalItems} total items in system`);
    console.log(`   - ${totalStoreItems} items across all stores`);
    console.log(`   - ${totalMatched} store-level matched (IT = Storekeeper)`);
    console.log(`   - ${totalConflicts} store-level conflicts (IT ≠ Storekeeper or missing)`);
    console.log(`   - ${totalDateDiffs} date differences`);
    console.log(`   - Conflict Percentage: ${totalStoreItems > 0 ? ((totalConflicts / totalStoreItems) * 100).toFixed(2) : 0}%`);

    res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("❌ Error in getDashboardSummary:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dashboard summary',
    });
  }
};

// ================================================================
// GET STORE CONFLICT DATA - For horizontal bar chart
// ================================================================

exports.getStoreConflictData = async (req, res) => {
  try {
    const { storeId } = req.query;

    const where = {};
    if (storeId) {
      where.storeId = parseInt(storeId);
    }

    const allBalances = await StoreBalance.findAll({
      where: where,
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
      ],
    });

    // Group by store
    const storeMap = new Map();
    allBalances.forEach((balance) => {
      const storeIdKey = balance.storeId;
      if (!storeMap.has(storeIdKey)) {
        storeMap.set(storeIdKey, {
          storeId: storeIdKey,
          storeName: balance.store?.name || 'Unknown',
          storeCode: balance.store?.code || '',
          items: new Map(),
        });
      }
      const store = storeMap.get(storeIdKey);
      if (!store.items.has(balance.itemId)) {
        store.items.set(balance.itemId, {
          itemId: balance.itemId,
          balances: new Map(),
        });
      }
      store.items.get(balance.itemId).balances.set(balance.groupId, parseFloat(balance.balance));
    });

    // Calculate conflicts per store
    const storeData = [];
    storeMap.forEach((store) => {
      let matched = 0;
      let conflicts = 0;

      store.items.forEach((item) => {
        const values = Array.from(item.balances.values()).filter(v => v !== undefined && v !== null);
        
        // Need exactly 2 groups to compare
        if (values.length === 2) {
          if (values[0] === values[1]) {
            matched++;
          } else {
            conflicts++;
          }
        } else if (values.length === 1) {
          // Missing in one group = conflict
          conflicts++;
        }
      });

      storeData.push({
        name: store.storeName,
        total: store.items.size,
        matched: matched,
        conflicts: conflicts,
        dateDiffs: 0,
        health: store.items.size > 0 ? Math.round((matched / store.items.size) * 100) : 0,
      });
    });

    storeData.sort((a, b) => b.conflicts - a.conflicts);

    res.status(200).json({
      success: true,
      data: storeData,
    });

  } catch (error) {
    console.error("❌ Error in getStoreConflictData:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get store conflict data',
    });
  }
};

// ================================================================
// GET TOP ISSUES
// ================================================================

exports.getTopIssues = async (req, res) => {
  try {
    const { storeId, limit = 10 } = req.query;

    const where = {};
    if (storeId) {
      where.storeId = parseInt(storeId);
    }

    const allBalances = await StoreBalance.findAll({
      where: where,
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
          attributes: ["itemId", "code", "name", "standardName", "conversionValue"],
        },
      ],
    });

    // Group by store
    const storeMap = new Map();
    allBalances.forEach((balance) => {
      const storeIdKey = balance.storeId;
      if (!storeMap.has(storeIdKey)) {
        storeMap.set(storeIdKey, {
          storeId: storeIdKey,
          storeName: balance.store?.name || 'Unknown',
          items: new Map(),
        });
      }
      const store = storeMap.get(storeIdKey);
      if (!store.items.has(balance.itemId)) {
        store.items.set(balance.itemId, {
          itemId: balance.itemId,
          code: balance.item?.code || null,
          name: balance.item?.standardName || balance.item?.name || null,
          groupBalances: new Map(),
        });
      }
      store.items.get(balance.itemId).groupBalances.set(balance.groupId, parseFloat(balance.balance));
    });

    const topConflicts = [];

    storeMap.forEach((store) => {
      store.items.forEach((item) => {
        const values = Array.from(item.groupBalances.values()).filter(v => v !== undefined && v !== null);
        
        if (values.length === 2) {
          const [balance1, balance2] = values;
          if (balance1 !== balance2) {
            const diff = Math.abs(balance1 - balance2);
            topConflicts.push({
              code: item.code || 'N/A',
              name: item.name || 'Unknown',
              store: store.storeName,
              diff: Math.round(diff * 100) / 100,
            });
          }
        } else if (values.length === 1) {
          // Missing in one group
          topConflicts.push({
            code: item.code || 'N/A',
            name: item.name || 'Unknown',
            store: store.storeName,
            diff: 0,
          });
        }
      });
    });

    topConflicts.sort((a, b) => b.diff - a.diff);
    const limitNum = parseInt(limit) || 10;

    res.status(200).json({
      success: true,
      data: {
        conflicts: topConflicts.slice(0, limitNum),
        dateDiffs: [],
        total: {
          conflicts: topConflicts.length,
          dateDiffs: 0,
        }
      },
    });

  } catch (error) {
    console.error("❌ Error in getTopIssues:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get top issues',
    });
  }
};

// ================================================================
// GET DASHBOARD STATS (Lightweight)
// ================================================================

exports.getDashboardStats = async (req, res) => {
  try {
    const { storeId } = req.query;

    const totalItems = await Item.count();
    const activeItems = await Item.count({ where: { status: 'Active' } });
    const inactiveItems = await Item.count({ where: { status: 'Inactive' } });

    const itemsWithConversion = await Item.count({
      where: {
        conversionValue: { [Op.gt]: 0 }
      }
    });
    const missingConversion = totalItems - itemsWithConversion;

    const itemsWithCost = await Item.count({
      where: {
        costPrice: { [Op.gt]: 0 }
      }
    });
    const missingCost = totalItems - itemsWithCost;

    const totalStores = await Store.count({ where: { status: 'Active' } });

    const balanceWhere = storeId ? { storeId: parseInt(storeId) } : {};
    const totalBalances = await StoreBalance.count({ where: balanceWhere });
    
    const uniqueItems = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('itemId')), 'itemId']
      ],
      raw: true,
    });

    const uniqueStores = await StoreBalance.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('storeId')), 'storeId']
      ],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        inventory: {
          totalItems,
          activeItems,
          inactiveItems,
          missingConversion,
          missingCost,
        },
        audit: {
          totalStores: totalStores,
          totalBalances: totalBalances,
          uniqueItems: uniqueItems.length,
          uniqueStores: uniqueStores.length,
        },
        lastUpdated: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("❌ Error in getDashboardStats:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dashboard stats',
    });
  }
};

// ================================================================
// GET RECENT ACTIVITY
// ================================================================

exports.getRecentActivity = async (req, res) => {
  try {
    const { storeId, limit = 10 } = req.query;

    const where = {};
    if (storeId) {
      where.storeId = parseInt(storeId);
    }

    const transactions = await StoreBalanceHistory.findAll({
      where: where,
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
      limit: parseInt(limit),
    });

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      itemName: t.item?.standardName || t.item?.name || null,
      itemCode: t.item?.code || null,
      uomCode: t.item?.uom?.code || null,
      storeName: t.store?.name || null,
      groupName: t.group?.name || null,
      previousBalance: parseFloat(t.previousBalance),
      newBalance: parseFloat(t.newBalance),
      changeAmount: parseFloat(t.changeAmount),
      transactionType: t.transactionType,
      changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
      createdAt: t.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        total: formattedTransactions.length,
      },
    });

  } catch (error) {
    console.error("❌ Error in getRecentActivity:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent activity',
    });
  }
};

// ================================================================
// GET LOW STOCK ALERTS
// ================================================================

exports.getLowStockAlerts = async (req, res) => {
  try {
    const { storeId, limit = 10 } = req.query;

    const where = { status: 'Active' };
    if (storeId) {
      where.storeId = parseInt(storeId);
    }

    const balances = await StoreBalance.findAll({
      where: where,
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
      ],
    });

    const lowStockItems = balances
      .filter(b => {
        const balance = parseFloat(b.balance);
        const minStock = parseFloat(b.minStockAlert) || 0;
        return balance <= minStock && balance > 0;
      })
      .sort((a, b) => {
        const shortageA = parseFloat(a.minStockAlert) - parseFloat(a.balance);
        const shortageB = parseFloat(b.minStockAlert) - parseFloat(b.balance);
        return shortageB - shortageA;
      })
      .slice(0, parseInt(limit));

    const zeroStockItems = balances
      .filter(b => parseFloat(b.balance) === 0)
      .slice(0, parseInt(limit));

    const formattedLowStock = lowStockItems.map(b => ({
      id: b.id,
      itemName: b.item?.standardName || b.item?.name || null,
      itemCode: b.item?.code || null,
      balance: parseFloat(b.balance),
      minStock: parseFloat(b.minStockAlert) || 0,
      groupName: b.group?.name || null,
      storeName: b.store?.name || null,
      uomCode: b.item?.uom?.code || null,
      statusClass: 'warning',
      shortage: parseFloat(b.minStockAlert) - parseFloat(b.balance),
    }));

    const formattedZeroStock = zeroStockItems.map(b => ({
      id: b.id,
      itemName: b.item?.standardName || b.item?.name || null,
      itemCode: b.item?.code || null,
      balance: 0,
      minStock: parseFloat(b.minStockAlert) || 0,
      groupName: b.group?.name || null,
      storeName: b.store?.name || null,
      uomCode: b.item?.uom?.code || null,
      statusClass: 'critical',
      shortage: parseFloat(b.minStockAlert) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        lowStock: formattedLowStock,
        zeroStock: formattedZeroStock,
        totalLowStock: lowStockItems.length,
        totalZeroStock: zeroStockItems.length,
      },
    });

  } catch (error) {
    console.error("❌ Error in getLowStockAlerts:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get low stock alerts',
    });
  }
};

// ================================================================
// GET STORE SUMMARY
// ================================================================

exports.getStoreSummary = async (req, res) => {
  try {
    const { storeId } = req.query;

    const stores = await Store.findAll({
      where: { status: 'Active' },
      attributes: ['storeId', 'name', 'code', 'location', 'status'],
    });

    const storeSummaries = await Promise.all(stores.map(async (store) => {
      const storeBalances = await StoreBalance.findAll({
        where: { storeId: store.storeId },
        include: [
          {
            model: Group,
            as: "group",
            attributes: ["groupId", "name", "code"],
          },
        ],
      });

      const totalItems = storeBalances.length;
      const totalBalance = storeBalances.reduce((sum, b) => sum + parseFloat(b.balance), 0);
      const activeItems = storeBalances.filter(b => b.status === 'Active').length;
      const zeroStockItems = storeBalances.filter(b => parseFloat(b.balance) === 0).length;
      const lowStockItems = storeBalances.filter(b => {
        const balance = parseFloat(b.balance);
        const minStock = parseFloat(b.minStockAlert) || 0;
        return balance > 0 && balance <= minStock;
      }).length;

      const uniqueGroups = new Set(storeBalances.map(b => b.groupId));

      return {
        storeId: store.storeId,
        name: store.name,
        code: store.code || '',
        location: store.location || '',
        totalItems,
        totalBalance: Math.round(totalBalance * 100) / 100,
        activeItems,
        zeroStockItems,
        lowStockItems,
        groupCount: uniqueGroups.size,
        health: totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0,
      };
    }));

    const filtered = storeId 
      ? storeSummaries.filter(s => s.storeId === parseInt(storeId))
      : storeSummaries;

    res.status(200).json({
      success: true,
      data: filtered,
    });

  } catch (error) {
    console.error("❌ Error in getStoreSummary:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get store summary',
    });
  }
};

// ================================================================
// REFRESH DASHBOARD DATA
// ================================================================

exports.refreshDashboard = async (req, res) => {
  try {
    const { storeId } = req.body;

    console.log(`🔄 Refreshing dashboard data for store: ${storeId || 'All Stores'}`);

    res.status(200).json({
      success: true,
      message: 'Dashboard data refreshed successfully',
      data: {
        refreshedAt: new Date().toISOString(),
        storeId: storeId || 'all',
      }
    });

  } catch (error) {
    console.error("❌ Error in refreshDashboard:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh dashboard data',
    });
  }
};

module.exports = exports;