// auditController.js - Complete Audit Controller with Group Comparison

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

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatBalance = (record) => {
  const item = record.item;
  // ✅ Get the REAL conversion value from the item
  const conversionValue = item?.conversionValue !== undefined && item?.conversionValue !== null 
    ? parseFloat(item.conversionValue) 
    : 1;
  const balance = parseFloat(record.balance);
  const minStock = parseFloat(record.minStockAlert) || 0;

  // Log for debugging
  console.log(`📊 Formatting ${item?.code}: conversionValue = ${conversionValue}`);

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
    conversionValue: conversionValue, // ✅ Real conversion value
    balance: balance,
    minStock: minStock,
    baseBalance: balance * conversionValue,
    status: record.status,
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

/**
 * Determine comparison status
 */
/**
 * Determine comparison status based on values across groups
 */
const determineStatus = (values, totalGroups) => {
  // Filter out null/undefined values
  const validValues = values.filter(v => v !== null && v !== undefined)
  const missingCount = totalGroups - validValues.length
  
  // If no data at all
  if (validValues.length === 0) {
    return 'No Data'
  }
  
  // If some groups have missing data
  if (missingCount > 0) {
    return 'Conflict' // Missing data is a conflict!
  }
  
  // All groups have data, check if they match
  const uniqueValues = [...new Set(validValues)]
  
  if (uniqueValues.length === 1) {
    return 'Matched'
  } else if (uniqueValues.length === 2) {
    return 'Outlier'
  } else {
    return 'Conflict'
  }
}

/**
 * Get status class for frontend
 */
const getStatusClass = (status) => {
  const map = {
    'Matched': 'matched',
    'Outlier': 'outlier',
    'Conflict': 'conflict',
    'No Data': 'unknown'
  };
  return map[status] || 'unknown';
};

// ============================================
// 1. GET STORE AUDIT - MAIN ENDPOINT
// ============================================
// auditController.js - Updated getStoreAudit with better empty handling

// auditController.js - Complete getStoreAudit with storeId fix

/**
 * 1. GET STORE AUDIT - MAIN ENDPOINT
 * GET /api/audit/store/:storeId
 */
exports.getStoreAudit = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { includeTransactions = 'true', transactionLimit = 10 } = req.query;

    console.log(`🔍 Getting audit data for store: ${storeId}`);

    // Validate store exists - use storeId field
    const store = await Store.findByPk(parseInt(storeId), {
      attributes: ['storeId', 'name', 'code', 'location', 'status'],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
      });
    }

    // Get all groups for this store via StoreGroupRelation
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

    // Get all balances for this store
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

    // Get all unique categories from the balances
    const categorySet = new Set();
    allBalances.forEach(balance => {
      if (balance.item?.category?.name) {
        categorySet.add(balance.item.category.name);
      }
    });
    const categories = Array.from(categorySet);

    // If no balances found, return empty data with store info
    if (allBalances.length === 0) {
      console.log(`⚠️ No balances found for store ${storeId}`);
      
      // Format groups for response
      const formattedGroups = groups.map(group => ({
        groupId: group.groupId,
        name: group.name,
        code: group.code || '',
        description: group.description || '',
        status: group.status || 'Active',
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
      }));

      return res.status(200).json({
        success: true,
        data: {
          store: {
            id: store.storeId, // Use storeId
            name: store.name,
            code: store.code,
            location: store.location,
            status: store.status,
          },
          groups: formattedGroups,
          categories: categories,
          summary: {
            totalGroups: groups.length,
            totalItems: 0,
            totalBalance: 0,
            totalBaseBalance: 0,
            activeItems: 0,
            inactiveItems: 0,
            matchedItems: 0,
            outlierItems: 0,
            conflictItems: 0,
            totalProducts: 0,
            categories: categories,
          },
          comparison: {
            items: [],
            summary: {
              total: 0,
              matched: 0,
              outlier: 0,
              conflict: 0,
              matchedPercentage: "0",
              outlierPercentage: "0",
              conflictPercentage: "0",
            },
          },
        },
      });
    }

    // Group balances by group
    const groupedBalances = {};
    const groupSummaries = {};

    groups.forEach((group) => {
      const groupBalances = allBalances.filter((b) => b.groupId === group.groupId);
      groupedBalances[group.groupId] = groupBalances;
      groupSummaries[group.groupId] = calculateGroupSummary(groupBalances);
    });

    // Build comparison data
    const itemMap = new Map();
    
    allBalances.forEach((balance) => {
      const itemId = balance.itemId;
      if (!itemMap.has(itemId)) {
        itemMap.set(itemId, {
          itemId: itemId,
          code: balance.item?.code || null,
          itemName: balance.item?.standardName || balance.item?.name || null,
          commonName: balance.item?.standardName || balance.item?.name || null,
          standardName: balance.item?.standardName || null,
          category: balance.item?.category?.name || null,
          uomCode: balance.item?.uom?.code || null,
          uomName: balance.item?.uom?.name || null,
          conversionValue: parseFloat(balance.item?.conversionValue) || 1,
          groupBalances: {},
        });
      }
      const item = itemMap.get(itemId);
      item.groupBalances[balance.groupId] = parseFloat(balance.balance);
    });

    // Determine status for each item
    const comparisonItems = [];
    let matchedCount = 0;
    let outlierCount = 0;
    let conflictCount = 0;

    itemMap.forEach((item) => {
      const values = Object.values(item.groupBalances).filter(v => v !== undefined && v !== null);
      const totalGroups = groups.length;
      const status = determineStatus(values, totalGroups);
      
      if (status === 'Matched') matchedCount++;
      else if (status === 'Outlier') outlierCount++;
      else if (status === 'Conflict') conflictCount++;

      comparisonItems.push({
        ...item,
        status,
        statusClass: getStatusClass(status),
        values,
      });
    });

    // Build group audit data with transactions
    const groupAuditData = await Promise.all(groups.map(async (group) => {
      const balances = groupedBalances[group.groupId] || [];
      const formattedBalances = balances.map((b) => formatBalance(b));

      let transactions = [];
      if (includeTransactions === 'true') {
        const allTransactions = await StoreBalanceHistory.findAll({
          where: {
            storeId: parseInt(storeId),
            groupId: group.groupId,
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
              model: Store,
              as: "sourceStore",
              attributes: ["storeId", "name", "code"],
            },
            {
              model: Store,
              as: "destinationStore",
              attributes: ["storeId", "name", "code"],
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
          sourceStore: t.sourceStore?.name || null,
          destinationStore: t.destinationStore?.name || null,
          referenceType: t.referenceType,
          referenceId: t.referenceId,
          changedBy: t.changedByUser?.fullName || t.changedByUser?.username || null,
          remark: t.remark,
          createdAt: t.createdAt,
        }));
      }

      return {
        groupId: group.groupId,
        name: group.name,
        code: group.code || '',
        description: group.description || '',
        status: group.status || 'Active',
        balanceCount: balances.length,
        summary: groupSummaries[group.groupId] || {
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
        balances: formattedBalances,
        transactions: transactions,
      };
    }));

    // Calculate overall summary
    const overallSummary = {
      totalGroups: groups.length,
      totalItems: allBalances.length,
      totalBalance: allBalances.reduce((sum, b) => sum + parseFloat(b.balance), 0),
      totalBaseBalance: allBalances.reduce((sum, b) => {
        const cv = parseFloat(b.item?.conversionValue) || 1;
        return sum + (parseFloat(b.balance) * cv);
      }, 0),
      activeItems: allBalances.filter(b => b.status === 'Active').length,
      inactiveItems: allBalances.filter(b => b.status !== 'Active').length,
      matchedItems: matchedCount,
      outlierItems: outlierCount,
      conflictItems: conflictCount,
      totalProducts: itemMap.size,
      categories: categories,
    };

    // Build final response
    const responseData = {
      store: {
        id: store.storeId, // Use storeId
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
          outlier: outlierCount,
          conflict: conflictCount,
          matchedPercentage: itemMap.size > 0 ? ((matchedCount / itemMap.size) * 100).toFixed(1) : 0,
          outlierPercentage: itemMap.size > 0 ? ((outlierCount / itemMap.size) * 100).toFixed(1) : 0,
          conflictPercentage: itemMap.size > 0 ? ((conflictCount / itemMap.size) * 100).toFixed(1) : 0,
        },
      },
    };

    console.log(`✅ Audit completed: ${overallSummary.totalProducts} products across ${overallSummary.totalGroups} groups`);

    res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("❌ Get store audit error:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get store audit data',
    });
  }
};

// ============================================
// 2. GET STORES WITH GROUPS
// ============================================
// auditController.js - Fix getStoresWithGroups

// auditController.js - Fix getStoresWithGroups

exports.getStoresWithGroups = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    let stores = [];
    
    if (userId) {
      const accessResult = await getUserStoreAndGroup(userId);
      
      if (accessResult.success) {
        if (accessResult.data.isAdmin) {
          // Admin: get all stores with their groups
          stores = await Store.findAll({
            attributes: ['storeId', 'code', 'name', 'location', 'status'], // Use storeId instead of id
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
          // Non-admin: get only assigned store
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

    // If no stores found, try to get all active stores
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

    // Log the raw stores to debug
    console.log('🔍 Raw stores from DB:', stores.map(s => ({ 
      id: s.storeId || s.id,  // Use storeId or fallback to id
      name: s.name, 
      code: s.code,
      hasGroups: !!(s.groups)
    })))

    // Format response - MAKE SURE ID IS INCLUDED
    const formattedStores = stores.map(store => {
      // Get the store ID - try storeId first, then id
      const storeId = store.storeId || store.id;
      
      console.log(`📋 Formatting store: ID=${storeId}, Name=${store.name}`);
      
      return {
        id: storeId, // THIS IS CRITICAL - include the store ID
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
    console.log(`📋 First formatted store:`, JSON.stringify(formattedStores[0], null, 2));

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
// auditController.js - Updated getCategories

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

    // Build comparison items
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
    let outlierItems = 0;
    let conflictItems = 0;

    itemMap.forEach((item) => {
      const values = Object.values(item.groups).map(g => g.balance);
      const uniqueValues = [...new Set(values)];
      
      let status = 'No Data';
      if (values.length === 0) status = 'No Data';
      else if (uniqueValues.length === 1) { status = 'Matched'; matchedItems++; }
      else if (uniqueValues.length === 2) { status = 'Outlier'; outlierItems++; }
      else { status = 'Conflict'; conflictItems++; }

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
      outlierItems,
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

    // Get transactions for this item across all groups
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
    const balances = await StoreBalance.findAll({
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

    const balanceMap = {};
    balances.forEach((b) => {
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
    const { format = 'csv' } = req.query;

    console.log(`📤 Exporting audit data for store: ${storeId}`);

    // Get audit data
    const auditResult = await exports.getStoreAudit({
      params: { storeId },
      query: { includeTransactions: 'false' },
    });

    if (!auditResult.success) {
      return res.status(500).json({ success: false, error: 'Failed to get audit data for export' });
    }

    const data = auditResult.data;

    // Build CSV rows from comparison data
    const headers = [
      'Item Code',
      'Item Name',
      'Category',
      'UOM',
      ...data.groups.map(g => g.name),
      'Status'
    ];

    const rows = data.comparison.items.map(item => {
      const row = [
        item.code || '',
        item.itemName || '',
        item.category || '',
        item.uomCode || '',
        ...data.groups.map(g => item.groupBalances[g.groupId] !== undefined ? item.groupBalances[g.groupId] : '-'),
        item.status || 'No Data'
      ];
      return row;
    });

    // Generate CSV
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const csvWithBOM = "\uFEFF" + csvContent;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=audit_${storeId}_${new Date().toISOString().split("T")[0]}.csv`);
    res.send(csvWithBOM);

  } catch (error) {
    console.error("❌ Export audit data error:", error);
    res.status(500).json({ success: false, error: error.message || 'Failed to export audit data' });
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
        outlierItems: data.summary.outlierItems,
        conflictItems: data.summary.conflictItems,
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

    // Extract low stock alerts
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

    // Get recent activity
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
        outlierItems: data.comparison.summary.outlier,
        conflictItems: data.comparison.summary.conflict,
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

module.exports = exports;