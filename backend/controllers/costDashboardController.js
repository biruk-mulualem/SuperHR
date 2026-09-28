// controllers/costDashboardController.js - FULLY CLEANED UP

const { Op } = require("sequelize");
const {
  StoreBalance,
  Store,
  Group,
  Category,
  Item,
  UOM,
  ExcludeItemFromCost,
  sequelize,
} = require("../models");
const NodeCache = require("node-cache");

// ================================================================
// CACHE CONFIGURATION
// ================================================================

const dashboardCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  maxKeys: 500,
});

// ================================================================
// 🔥 CALCULATE ITEM COST - EXACT COPY FROM itemCostService
// ================================================================

function calculateItemCostOptimized(
  item,
  balances,
  unitCost,
  storeId = null,
  groupId = null,
  isExcluded = false,
  exclusionReason = null,
) {
  try {
    if (isExcluded) {
      return {
        id: item.itemId,
        itemCode: item.code,
        itemName: item.name,
        itemStandardName: item.standardName || "",
        categoryName: item.category?.name || "",
        brand: item.brand || "",
        model: item.model || "",
        baseUOM: item.uom?.code || "Units",
        conversionUOM: item.conversionUom?.code || null,
        conversionValue: parseFloat(item.conversionValue) || 0,
        unitCost: unitCost || 0,
        totalQty: 0,
        totalCost: 0,
        status: "Inactive",
        statusMessage: exclusionReason || "Excluded from cost calculations",
        userStatus: "Active",
        storeBreakdown: [],
        excludedStores: [],
        costHistory: [],
        includedStoresCount: 0,
        excludedStoresCount: 0,
        isFiltered: !!storeId,
        hasMissingData: false,
        missingData: [],
        requiresSetup: false,
        isExcluded: true,
        exclusionReason: exclusionReason,
      };
    }

    const hasUnitCost =
      unitCost !== undefined && unitCost !== null && unitCost >= 0;
    const hasConversionUom =
      item.conversionUomId !== undefined && item.conversionUomId !== null;
    const hasConversionValue =
      item.conversionValue !== undefined &&
      item.conversionValue !== null &&
      parseFloat(item.conversionValue) > 0;

    const missingData = [];
    if (!hasUnitCost && unitCost !== 0) {
      missingData.push("Unit Cost");
    }
    if (!hasConversionUom) {
      missingData.push("Conversion UOM");
    }
    if (!hasConversionValue) {
      missingData.push("Conversion Value");
    }

    if (!balances || balances.length === 0) {
      let status = "Active";
      let statusMessage = "No balances found";

      if (missingData.length > 0) {
        status = "Incomplete";
        statusMessage = `Missing: ${missingData.join(", ")}`;
      }

      return {
        id: item.itemId,
        itemCode: item.code,
        itemName: item.name,
        itemStandardName: item.standardName || "",
        categoryName: item.category?.name || "",
        brand: item.brand || "",
        model: item.model || "",
        baseUOM: item.uom?.code || "Units",
        conversionUOM: item.conversionUom?.code || null,
        conversionValue: parseFloat(item.conversionValue) || 0,
        unitCost: unitCost || 0,
        totalQty: 0,
        totalCost: 0,
        status: status,
        statusMessage: statusMessage,
        userStatus: item.status || "Active",
        storeBreakdown: [],
        excludedStores: [],
        costHistory: [],
        includedStoresCount: 0,
        excludedStoresCount: 0,
        isFiltered: !!storeId,
        hasMissingData: missingData.length > 0,
        missingData: missingData,
        requiresSetup: missingData.length > 0,
        isExcluded: false,
        exclusionReason: null,
      };
    }

    if (!hasConversionUom || !hasConversionValue) {
      const storeBreakdown = balances.map((balance) => ({
        storeId: balance.storeId || balance.store_id,
        storeName: balance.store?.name || "Unknown Store",
        hasConflict: false,
        isExcluded: true,
        agreedQuantity: parseFloat(balance.balance) || 0,
        groups: [
          {
            groupId: balance.groupId || balance.group_id,
            groupName: balance.group?.name || "Unknown Group",
            quantity: parseFloat(balance.balance) || 0,
            originalQuantity: parseFloat(balance.balance) || 0,
            originalUOM: item.uom?.code || "Units",
            conversionRate: 1,
            baseQuantity: parseFloat(balance.balance) || 0,
            balanceId: balance.id,
          },
        ],
      }));

      return {
        id: item.itemId,
        itemCode: item.code,
        itemName: item.name,
        itemStandardName: item.standardName || "",
        categoryName: item.category?.name || "",
        brand: item.brand || "",
        model: item.model || "",
        baseUOM: item.uom?.code || "Units",
        conversionUOM: item.conversionUom?.code || null,
        conversionValue: parseFloat(item.conversionValue) || 0,
        unitCost: unitCost || 0,
        totalQty: 0,
        totalCost: 0,
        status: "Incomplete",
        statusMessage: `Missing: ${missingData.join(", ")}`,
        userStatus: item.status || "Active",
        storeBreakdown: storeBreakdown,
        excludedStores: storeBreakdown.map((s) => s.storeName),
        costHistory: [],
        includedStoresCount: 0,
        excludedStoresCount: storeBreakdown.length,
        isFiltered: !!storeId,
        hasMissingData: true,
        missingData: missingData,
        requiresSetup: true,
        isExcluded: false,
        exclusionReason: null,
      };
    }

    const storeMap = new Map();
    const baseUOM = item.uom?.code || "Units";
    const conversionValue = parseFloat(item.conversionValue) || 1;

    for (const balance of balances) {
      const storeIdKey = balance.storeId || balance.store_id;
      const groupIdKey = balance.groupId || balance.group_id;

      if (!storeIdKey) {
        console.warn("⚠️ Balance missing storeId:", balance);
        continue;
      }

      if (!storeMap.has(storeIdKey)) {
        storeMap.set(storeIdKey, {
          storeId: storeIdKey,
          storeName: balance.store?.name || "Unknown Store",
          storeCode: balance.store?.code || "",
          groups: [],
          totalQty: 0,
        });
      }

      const storeData = storeMap.get(storeIdKey);
      const originalQuantity = parseFloat(balance.balance) || 0;
      const convertedQuantity = originalQuantity * conversionValue;

      storeData.groups.push({
        groupId: groupIdKey,
        groupName: balance.group?.name || "Unknown Group",
        quantity: convertedQuantity,
        originalQuantity: originalQuantity,
        originalUOM: baseUOM,
        conversionRate: conversionValue,
        baseQuantity: convertedQuantity,
        balanceId: balance.id,
      });
      storeData.totalQty += convertedQuantity;
    }

    const storeBreakdown = [];
    for (const [storeIdKey, storeData] of storeMap) {
      const quantities = storeData.groups.map((g) => g.quantity);
      const firstQty = quantities[0];
      const allSame = quantities.every((q) => Math.abs(q - firstQty) < 0.0001);

      storeBreakdown.push({
        storeId: storeData.storeId,
        storeName: storeData.storeName,
        hasConflict: !allSame,
        isExcluded: !allSame,
        agreedQuantity: allSame ? firstQty : 0,
        groups: storeData.groups.map((g) => ({
          groupId: g.groupId,
          groupName: g.groupName,
          quantity: g.quantity,
          originalQuantity: g.originalQuantity,
          originalUOM: g.originalUOM,
          conversionRate: g.conversionRate,
          baseQuantity: g.baseQuantity,
          balanceId: g.balanceId,
        })),
      });
    }

    let includedStores = [];
    let totalQty = 0;
    let excludedStores = [];

    if (storeId) {
      const filteredStore = storeBreakdown.find(
        (s) => s.storeId === Number(storeId),
      );
      if (filteredStore) {
        if (!filteredStore.isExcluded) {
          includedStores = [filteredStore];
          totalQty = filteredStore.agreedQuantity;
        } else {
          excludedStores = [filteredStore.storeName];
        }
      }
    } else {
      includedStores = storeBreakdown.filter((s) => !s.isExcluded);
      totalQty = includedStores.reduce((sum, s) => sum + s.agreedQuantity, 0);
      excludedStores = storeBreakdown
        .filter((s) => s.isExcluded)
        .map((s) => s.storeName);
    }

    const totalCost = hasUnitCost ? totalQty * unitCost : 0;
    const userStatus = item.status || "Active";

    let status = "Active";
    let statusMessage = "Complete data";

    if (userStatus === "Inactive") {
      status = "Inactive";
      statusMessage = "Item is inactive";
    } else if (missingData.length > 0 || !hasUnitCost || !hasConversionValue) {
      status = "Incomplete";
      statusMessage = `Missing: ${missingData.join(", ")}`;
    } else if (excludedStores.length > 0 && includedStores.length > 0) {
      status = "Partial";
      statusMessage = `${excludedStores.length} store(s) excluded due to conflicts`;
    } else if (
      excludedStores.length === storeBreakdown.length &&
      storeBreakdown.length > 0
    ) {
      status = "Conflict";
      statusMessage = "All stores have conflicts";
    } else {
      status = "Active";
      statusMessage = "Complete data";
    }

    return {
      id: item.itemId,
      itemCode: item.code,
      itemName: item.name,
      itemStandardName: item.standardName || "",
      categoryName: item.category?.name || "",
      brand: item.brand || "",
      model: item.model || "",
      baseUOM: baseUOM,
      conversionUOM: item.conversionUom?.code || null,
      conversionValue: parseFloat(item.conversionValue) || 0,
      unitCost: unitCost || 0,
      totalQty: totalQty,
      totalCost: totalCost,
      status: status,
      statusMessage: statusMessage,
      userStatus: userStatus,
      storeBreakdown: storeBreakdown,
      excludedStores: excludedStores,
      costHistory: [],
      includedStoresCount: includedStores.length,
      excludedStoresCount: excludedStores.length,
      isFiltered: !!storeId,
      hasMissingData:
        missingData.length > 0 || !hasUnitCost || !hasConversionValue,
      missingData: missingData,
      requiresSetup:
        missingData.length > 0 || !hasUnitCost || !hasConversionValue,
      isExcluded: false,
      exclusionReason: null,
    };
  } catch (error) {
    console.error("Error in calculateItemCostOptimized:", error);
    return {
      id: item?.itemId || 0,
      itemCode: item?.code || "Unknown",
      itemName: item?.name || "Unknown Item",
      itemStandardName: "",
      categoryName: "",
      brand: "",
      model: "",
      baseUOM: "Units",
      conversionUOM: null,
      conversionValue: 0,
      unitCost: 0,
      totalQty: 0,
      totalCost: 0,
      status: "Error",
      statusMessage: error.message || "Error calculating cost",
      userStatus: "Active",
      storeBreakdown: [],
      excludedStores: [],
      costHistory: [],
      includedStoresCount: 0,
      excludedStoresCount: 0,
      isFiltered: !!storeId,
      hasMissingData: true,
      missingData: ["Data Error"],
      requiresSetup: true,
      isExcluded: false,
      exclusionReason: null,
    };
  }
}

// ================================================================
// HELPER: Get User's Assigned Store and Group from Request
// ================================================================

const getUserStoreAndGroupFromRequest = async (req) => {
  const { storeId: queryStoreId, groupId: queryGroupId } = req.query;

  console.log("🔍 Query params:", { queryStoreId, queryGroupId });

  if (
    queryStoreId &&
    queryGroupId &&
    queryStoreId !== "all" &&
    queryGroupId !== "all"
  ) {
    const storeId = parseInt(queryStoreId);
    const groupId = parseInt(queryGroupId);

    const store = await Store.findByPk(storeId, {
      attributes: ["id", "name", "code"],
    });
    const group = await Group.findByPk(groupId, {
      attributes: ["id", "name", "code"],
    });

    return {
      userId: req.user?.userId,
      username: req.user?.username,
      role: req.user?.role,
      isAdmin: req.user?.role === "admin" || req.user?.role === "Admin",
      storeId: storeId,
      groupId: groupId,
      storeName: store?.name || null,
      groupName: group?.name || null,
      hasAssignments: true,
    };
  }

  return {
    userId: req.user?.userId,
    username: req.user?.username,
    role: req.user?.role,
    isAdmin: req.user?.role === "admin" || req.user?.role === "Admin",
    storeId: null,
    groupId: null,
    storeName: null,
    groupName: null,
    hasAssignments: false,
  };
};

// ================================================================
// HELPER: Get Store Color
// ================================================================

function getStoreColor(storeId) {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#84cc16",
    "#22d3ee",
    "#f472b6",
    "#34d399",
    "#fbbf24",
  ];
  return colors[storeId % colors.length] || "#3b82f6";
}

// ================================================================
// 1. GET COST SUMMARY
// ================================================================

exports.getCostSummary = async (req, res) => {
  try {
    console.log("🚀 getCostSummary called");
    const userAccess = await getUserStoreAndGroupFromRequest(req);

    const allItemsForTotal = await Item.findAll({
      where: { status: "Active" },
      attributes: ["itemId"],
    });
    const itemIds = allItemsForTotal.map((i) => i.itemId);

    let balanceWhereForItems = { status: "Active" };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhereForItems.storeId = userAccess.storeId;
      balanceWhereForItems.groupId = userAccess.groupId;
    }
    if (itemIds.length > 0) {
      balanceWhereForItems.itemId = { [Op.in]: itemIds };
    }

    const itemsWithBalances = await StoreBalance.findAll({
      where: balanceWhereForItems,
      attributes: ["itemId"],
      group: ["itemId"],
    });

    const totalItems = itemsWithBalances.length;
    console.log(`📊 Total items with balances: ${totalItems}`);

    const zeroCostItemsWithBalances = await Item.findAll({
      where: {
        status: "Active",
        costPrice: { [Op.or]: [0, null] },
      },
      attributes: ["itemId"],
    });
    const zeroCostItemIds = zeroCostItemsWithBalances.map((i) => i.itemId);

    let zeroBalanceWhere = { status: "Active" };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      zeroBalanceWhere.storeId = userAccess.storeId;
      zeroBalanceWhere.groupId = userAccess.groupId;
    }
    if (zeroCostItemIds.length > 0) {
      zeroBalanceWhere.itemId = { [Op.in]: zeroCostItemIds };
    }

    const zeroItemsWithBalances = await StoreBalance.findAll({
      where: zeroBalanceWhere,
      attributes: ["itemId"],
      group: ["itemId"],
    });

    const zeroCostItems = zeroItemsWithBalances.length;
    console.log(`📊 Zero cost items with balances: ${zeroCostItems}`);

    const allItems = await Item.findAll({
      where: { status: "Active" },
      attributes: [
        "itemId",
        "code",
        "name",
        "costPrice",
        "status",
        "uomId",
        "conversionUomId",
        "conversionValue",
      ],
      include: [
        { model: UOM, as: "uom", attributes: ["code", "name"] },
        { model: UOM, as: "conversionUom", attributes: ["code", "name"] },
        { model: Category, as: "category", attributes: ["name"] },
      ],
    });

    const allItemIds = allItems.map((i) => i.itemId);

    let balanceWhere = { status: "Active" };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhere.storeId = userAccess.storeId;
      balanceWhere.groupId = userAccess.groupId;
    }
    if (allItemIds.length > 0) {
      balanceWhere.itemId = { [Op.in]: allItemIds };
    }

    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ["id", "itemId", "storeId", "groupId", "balance"],
      include: [
        { model: Store, as: "store", attributes: ["id", "name", "code"] },
        { model: Group, as: "group", attributes: ["id", "name", "code"] },
      ],
    });

    console.log(`📊 Found ${allBalances.length} balances for cost summary`);

    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }

    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ["item_id", "reason"],
    });
    const excludedItemIds = new Set(excludedItems.map((e) => e.item_id));

    const ItemCost = require("../models").ItemCost;
    let latestCosts = {};
    if (ItemCost) {
      const costRecords = await ItemCost.findAll({
        where: { itemId: { [Op.in]: allItemIds } },
        order: [["created_at", "DESC"]],
        attributes: ["itemId", "newCost"],
      });
      for (const cost of costRecords) {
        if (!latestCosts[cost.itemId]) {
          latestCosts[cost.itemId] = parseFloat(cost.newCost);
        }
      }
    }

    let totalCost = 0;
    let excludedByConflict = 0;
    let excludedByData = 0;
    let itemsWithCost = 0;
    let itemsProcessed = 0;

    for (const item of allItems) {
      const itemBalances = balancesByItem[item.itemId] || [];

      if (itemBalances.length === 0) continue;

      const unitCost =
        latestCosts[item.itemId] || parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.itemId);

      if (isExcluded) continue;
      if (unitCost === 0) continue;

      const hasConversionData =
        item.conversionUomId &&
        item.conversionValue &&
        parseFloat(item.conversionValue) > 0;
      if (!hasConversionData) {
        excludedByData++;
        continue;
      }

      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        userAccess.storeId || null,
        userAccess.groupId || null,
        isExcluded,
        null,
      );

      if (costData.status === "Error") continue;

      if (costData.status === "Conflict" || costData.status === "Partial") {
        excludedByConflict++;
        continue;
      }

      if (costData.totalCost > 0) {
        totalCost += costData.totalCost;
        itemsWithCost++;
      }

      itemsProcessed++;
    }

    const result = {
      totalItems: totalItems || 0,
      zeroCostItems: zeroCostItems || 0,
      totalCost: Math.round(totalCost * 100) / 100,
      excludedByConflict: excludedByConflict || 0,
      excludedByData: excludedByData || 0,
      itemsWithCost: itemsWithCost || 0,
      itemsProcessed: itemsProcessed || 0,
    };

    console.log("📊 Cost summary result:", result);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error getting cost summary:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch cost summary",
    });
  }
};

// ================================================================
// 2. GET COST BY STORE
// ================================================================

exports.getCostByStore = async (req, res) => {
  try {
    console.log("🚀 getCostByStore called");
    const userAccess = await getUserStoreAndGroupFromRequest(req);

    const cacheKey = `cost_by_store_${userAccess.storeId || "all"}_${userAccess.groupId || "all"}`;
    let cached = dashboardCache.get(cacheKey);
    if (cached) {
      console.log("✅ Cost by store cache hit");
      return res.status(200).json({
        success: true,
        data: cached,
      });
    }

    const allItems = await Item.findAll({
      where: { status: "Active" },
      attributes: [
        "itemId",
        "code",
        "name",
        "costPrice",
        "status",
        "uomId",
        "conversionUomId",
        "conversionValue",
      ],
      include: [
        { model: UOM, as: "uom", attributes: ["code", "name"] },
        { model: UOM, as: "conversionUom", attributes: ["code", "name"] },
        { model: Category, as: "category", attributes: ["name"] },
      ],
    });

    const itemIds = allItems.map((i) => i.itemId);

    let balanceWhere = { status: "Active" };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhere.storeId = userAccess.storeId;
      balanceWhere.groupId = userAccess.groupId;
    }
    if (itemIds.length > 0) {
      balanceWhere.itemId = { [Op.in]: itemIds };
    }

    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ["id", "itemId", "storeId", "groupId", "balance"],
      include: [
        { model: Store, as: "store", attributes: ["id", "name", "code"] },
        { model: Group, as: "group", attributes: ["id", "name", "code"] },
      ],
    });

    console.log(`📊 Found ${allBalances.length} balances for cost by store`);

    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }

    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ["item_id", "reason"],
    });
    const excludedItemIds = new Set(excludedItems.map((e) => e.item_id));

    const ItemCost = require("../models").ItemCost;
    let latestCosts = {};
    if (ItemCost) {
      const costRecords = await ItemCost.findAll({
        where: { itemId: { [Op.in]: itemIds } },
        order: [["created_at", "DESC"]],
        attributes: ["itemId", "newCost"],
      });
      for (const cost of costRecords) {
        if (!latestCosts[cost.itemId]) {
          latestCosts[cost.itemId] = parseFloat(cost.newCost);
        }
      }
    }

    const storeCostMap = new Map();
    const storeItemSet = new Map();

    let totalCostAllItems = 0;
    let itemsWithCost = 0;
    let activeItemsCount = 0;
    let excludedByConflict = 0;
    let excludedByData = 0;

    const contributingItems = new Set();

    for (const item of allItems) {
      const itemBalances = balancesByItem[item.itemId] || [];

      if (itemBalances.length === 0) continue;

      const unitCost =
        latestCosts[item.itemId] || parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.itemId);

      if (isExcluded) continue;
      if (unitCost === 0) continue;

      const hasConversionData =
        item.conversionUomId &&
        item.conversionValue &&
        parseFloat(item.conversionValue) > 0;
      if (!hasConversionData) {
        excludedByData++;
        continue;
      }

      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        userAccess.storeId || null,
        userAccess.groupId || null,
        isExcluded,
        null,
      );

      if (costData.status === "Error") continue;

      if (costData.status === "Conflict" || costData.status === "Partial") {
        excludedByConflict++;
        continue;
      }

      if (costData.status !== "Active") continue;
      if (costData.totalCost === 0) continue;

      activeItemsCount++;
      totalCostAllItems += costData.totalCost;
      itemsWithCost++;
      contributingItems.add(item.itemId);

      for (const store of costData.storeBreakdown) {
        if (store.isExcluded || store.hasConflict) continue;
        if (store.agreedQuantity === 0) continue;

        const storeId = store.storeId;
        if (!storeId) continue;

        if (!storeCostMap.has(storeId)) {
          storeCostMap.set(storeId, {
            id: storeId,
            name: store.storeName || "Unknown Store",
            code: "",
            totalCost: 0,
            itemCount: 0,
            color: getStoreColor(storeId),
          });
          storeItemSet.set(storeId, new Set());
        }

        const storeData = storeCostMap.get(storeId);
        const storeCost = unitCost * store.agreedQuantity;
        storeData.totalCost += storeCost;

        const itemsInStore = storeItemSet.get(storeId);
        if (!itemsInStore.has(item.itemId)) {
          itemsInStore.add(item.itemId);
          storeData.itemCount += 1;
        }

        if (!storeData.code) {
          const storeInfo = await Store.findByPk(storeId, {
            attributes: ["code"],
          });
          if (storeInfo) storeData.code = storeInfo.code || "N/A";
        }
      }
    }

    const data = Array.from(storeCostMap.values())
      .filter((s) => s.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);

    const total = data.reduce((sum, s) => sum + s.totalCost, 0);

    let result = data.map((s) => {
      let percent = 0;
      if (total > 0) {
        const rawPercent = (s.totalCost / total) * 100;
        percent = Math.round(rawPercent * 1000) / 1000;
      }

      return {
        ...s,
        totalCost: Math.round(s.totalCost * 100) / 100,
        percent: percent,
        uniqueItemCount: storeItemSet.get(s.id)?.size || 0,
      };
    });

    if (result.length > 0) {
      let percentSum = result.reduce((sum, s) => sum + s.percent, 0);
      let diff = Math.round((100 - percentSum) * 1000) / 1000;

      if (Math.abs(diff) > 0.0005) {
        let largestIndex = 0;
        let largestPercent = -1;
        for (let i = 0; i < result.length; i++) {
          if (result[i].percent > largestPercent) {
            largestPercent = result[i].percent;
            largestIndex = i;
          }
        }

        let adjustedPercent = result[largestIndex].percent + diff;
        result[largestIndex].percent =
          Math.round(adjustedPercent * 1000) / 1000;

        percentSum = result.reduce((sum, s) => sum + s.percent, 0);
        console.log(`📊 Adjusted percentage sum: ${percentSum}%`);
      }
    }

    const percentSum = result.reduce((sum, s) => sum + s.percent, 0);

    dashboardCache.set(cacheKey, result, 300);

    res.status(200).json({
      success: true,
      data: result,
      _meta: {
        activeItemsCount: activeItemsCount,
        totalItemsWithCost: itemsWithCost,
        excludedByConflict: excludedByConflict,
        excludedByData: excludedByData,
        storeCount: result.length,
        totalPercentage: Math.round(percentSum * 1000) / 1000,
      },
    });
  } catch (error) {
    console.error("❌ Error getting cost by store:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch cost by store",
    });
  }
};

// ================================================================
// 3. GET TOP COST ITEMS
// ================================================================

exports.getTopCostItems = async (req, res) => {
  try {
    console.log("🚀 getTopCostItems called");
    const userAccess = await getUserStoreAndGroupFromRequest(req);
    const { limit = 10 } = req.query;

    const cacheKey = `top_cost_items_${userAccess.storeId || "all"}_${userAccess.groupId || "all"}_${limit}`;
    let cached = dashboardCache.get(cacheKey);
    if (cached) {
      console.log("✅ Top cost items cache hit");
      return res.status(200).json({
        success: true,
        data: cached,
      });
    }

    const allItems = await Item.findAll({
      where: { status: "Active" },
      attributes: [
        "itemId",
        "code",
        "name",
        "standardName",
        "costPrice",
        "status",
        "uomId",
        "conversionUomId",
        "conversionValue",
      ],
      include: [
        { model: UOM, as: "uom", attributes: ["code", "name"] },
        { model: UOM, as: "conversionUom", attributes: ["code", "name"] },
        { model: Category, as: "category", attributes: ["name"] },
      ],
    });

    const itemIds = allItems.map((i) => i.itemId);

    let balanceWhere = { status: "Active" };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhere.storeId = userAccess.storeId;
      balanceWhere.groupId = userAccess.groupId;
    }
    if (itemIds.length > 0) {
      balanceWhere.itemId = { [Op.in]: itemIds };
    }

    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ["id", "itemId", "storeId", "groupId", "balance"],
      include: [
        { model: Store, as: "store", attributes: ["id", "name", "code"] },
        { model: Group, as: "group", attributes: ["id", "name", "code"] },
      ],
    });

    console.log(`📊 Found ${allBalances.length} balances for top cost items`);

    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }

    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ["item_id", "reason"],
    });
    const excludedItemIds = new Set(excludedItems.map((e) => e.item_id));

    const ItemCost = require("../models").ItemCost;
    let latestCosts = {};
    if (ItemCost) {
      const costRecords = await ItemCost.findAll({
        where: { itemId: { [Op.in]: itemIds } },
        order: [["created_at", "DESC"]],
        attributes: ["itemId", "newCost"],
      });
      for (const cost of costRecords) {
        if (!latestCosts[cost.itemId]) {
          latestCosts[cost.itemId] = parseFloat(cost.newCost);
        }
      }
    }

    const allItemCosts = [];
    let totalInventoryCost = 0;

    for (const item of allItems) {
      const itemBalances = balancesByItem[item.itemId] || [];
      if (itemBalances.length === 0) continue;

      const unitCost =
        latestCosts[item.itemId] || parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.itemId);

      if (isExcluded) continue;
      if (unitCost === 0) continue;
      if (
        !item.conversionUomId ||
        !item.conversionValue ||
        parseFloat(item.conversionValue) === 0
      )
        continue;

      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        userAccess.storeId || null,
        userAccess.groupId || null,
        isExcluded,
        null,
      );

      if (
        costData.status === "Inactive" ||
        costData.status === "Incomplete" ||
        costData.status === "Error"
      )
        continue;
      if (costData.status === "Conflict" || costData.status === "Partial")
        continue;
      if (costData.totalCost === 0) continue;

      allItemCosts.push({
        id: item.itemId,
        itemCode: item.code || "N/A",
        itemName: item.name || "Unknown Item",
        itemStandardName: item.standardName || "",
        categoryName: item.category?.name || "Uncategorized",
        baseUOM: item.uom?.code || "PCS",
        totalQty: costData.totalQty,
        unitCost: unitCost,
        totalCost: costData.totalCost,
        status: costData.status || item.status || "Active",
      });

      totalInventoryCost += costData.totalCost;
    }

    console.log(`📊 Total inventory cost: ${totalInventoryCost}`);
    console.log(`📊 Total items with cost: ${allItemCosts.length}`);

    const sorted = allItemCosts
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, parseInt(limit));

    const result = sorted.map((item, index) => {
      let percent = 0;
      if (totalInventoryCost > 0) {
        const rawPercent = (item.totalCost / totalInventoryCost) * 100;
        percent = Math.round(rawPercent * 1000) / 1000;
      }

      return {
        ...item,
        totalCost: Math.round(item.totalCost * 100) / 100,
        percent: percent,
        rank: index + 1,
      };
    });

    const totalTopItemsCost = result.reduce(
      (sum, item) => sum + item.totalCost,
      0,
    );
    const totalPercentOfInventory = result.reduce(
      (sum, item) => sum + item.percent,
      0,
    );

    dashboardCache.set(cacheKey, result, 300);

    res.status(200).json({
      success: true,
      data: result,
      _meta: {
        totalInventoryCost: Math.round(totalInventoryCost * 100) / 100,
        totalTopItemsCost: Math.round(totalTopItemsCost * 100) / 100,
        totalPercentOfInventory:
          Math.round(totalPercentOfInventory * 1000) / 1000,
        totalItemsWithCost: allItemCosts.length,
        topItemsCount: result.length,
        remainingItemsCount: allItemCosts.length - result.length,
        remainingItemsCost:
          Math.round((totalInventoryCost - totalTopItemsCost) * 100) / 100,
        remainingItemsPercent:
          Math.round((100 - totalPercentOfInventory) * 1000) / 1000,
      },
    });
  } catch (error) {
    console.error("❌ Error getting top cost items:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch top cost items",
    });
  }
};

// ================================================================
// 4. GET ZERO COST ITEMS
// ================================================================

exports.getZeroCostItems = async (req, res) => {
  try {
    console.log("🚀 getZeroCostItems called");
    const userAccess = await getUserStoreAndGroupFromRequest(req);
    const { page = 1, limit = 10 } = req.query;

    const zeroCostItems = await Item.findAll({
      where: {
        status: "Active",
        costPrice: { [Op.or]: [0, null] },
      },
      attributes: [
        "itemId",
        "code",
        "name",
        "standardName",
        "costPrice",
        "status",
        "uomId",
      ],
      include: [
        { model: Category, as: "category", attributes: ["name"] },
        { model: UOM, as: "uom", attributes: ["code", "name"] },
      ],
    });

    const zeroCostItemIds = zeroCostItems.map((i) => i.itemId);

    if (zeroCostItemIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
        },
      });
    }

    let balanceWhere = { status: "Active" };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhere.storeId = userAccess.storeId;
      balanceWhere.groupId = userAccess.groupId;
    }
    if (zeroCostItemIds.length > 0) {
      balanceWhere.itemId = { [Op.in]: zeroCostItemIds };
    }

    const balances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ["id", "itemId", "balance", "storeId", "groupId"],
      include: [
        { model: Store, as: "store", attributes: ["id", "name", "code"] },
        { model: Group, as: "group", attributes: ["id", "name", "code"] },
      ],
    });

    console.log(`📊 Found ${balances.length} balances for zero cost items`);

    const balancesByItem = {};
    for (const balance of balances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }

    const resultItems = [];
    for (const item of zeroCostItems) {
      const itemBalances = balancesByItem[item.itemId] || [];
      if (itemBalances.length === 0) continue;

      const firstBalance = itemBalances[0];
      resultItems.push({
        id: firstBalance.id,
        itemCode: item.code || "N/A",
        itemName: item.name || "Unknown Item",
        itemStandardName: item.standardName || "",
        categoryName: item.category?.name || "Uncategorized",
        baseUOM: item.uom?.code || "PCS",
        status: item.status || "Active",
        balance: parseFloat(firstBalance.balance) || 0,
        storeName: firstBalance.store?.name || null,
        groupName: firstBalance.group?.name || null,
      });
    }

    resultItems.sort((a, b) => a.itemName.localeCompare(b.itemName));

    const total = resultItems.length;
    const totalPages = Math.ceil(total / parseInt(limit));
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedItems = resultItems.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
      },
    });
  } catch (error) {
    console.error("❌ Error getting zero cost items:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch zero cost items",
    });
  }
};

// ================================================================
// 📤 5. EXPORT: Cost by Store (WITH PAGINATION)
// ================================================================

exports.exportCostByStore = async (req, res) => {
  try {
    console.log('🚀 exportCostByStore called');
    const userAccess = await getUserStoreAndGroupFromRequest(req);
    const { page = 1, limit = 10 } = req.query;
    
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    
    const allItems = await Item.findAll({
      where: { status: 'Active' },
      attributes: ['itemId', 'code', 'name', 'costPrice', 'status', 'uomId', 'conversionUomId', 'conversionValue'],
      include: [
        { model: UOM, as: 'uom', attributes: ['code', 'name'] },
        { model: UOM, as: 'conversionUom', attributes: ['code', 'name'] },
        { model: Category, as: 'category', attributes: ['name'] }
      ]
    });
    
    const itemIds = allItems.map(i => i.itemId);
    
    let balanceWhere = { status: 'Active' };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhere.storeId = userAccess.storeId;
      balanceWhere.groupId = userAccess.groupId;
    }
    if (itemIds.length > 0) {
      balanceWhere.itemId = { [Op.in]: itemIds };
    }
    
    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['id', 'itemId', 'storeId', 'groupId', 'balance'],
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] }
      ]
    });
    
    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }
    
    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ['item_id', 'reason']
    });
    const excludedItemIds = new Set(excludedItems.map(e => e.item_id));
    
    const ItemCost = require('../models').ItemCost;
    let latestCosts = {};
    if (ItemCost) {
      const costRecords = await ItemCost.findAll({
        where: { itemId: { [Op.in]: itemIds } },
        order: [['created_at', 'DESC']],
        attributes: ['itemId', 'newCost']
      });
      for (const cost of costRecords) {
        if (!latestCosts[cost.itemId]) {
          latestCosts[cost.itemId] = parseFloat(cost.newCost);
        }
      }
    }
    
    const storeCostMap = new Map();
    const storeItemSet = new Map();
    
    for (const item of allItems) {
      const itemBalances = balancesByItem[item.itemId] || [];
      if (itemBalances.length === 0) continue;
      
      const unitCost = latestCosts[item.itemId] || parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.itemId);
      
      if (isExcluded) continue;
      if (unitCost === 0) continue;
      
      const hasConversionData = item.conversionUomId && item.conversionValue && parseFloat(item.conversionValue) > 0;
      if (!hasConversionData) continue;
      
      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        userAccess.storeId || null,
        userAccess.groupId || null,
        isExcluded,
        null
      );
      
      if (costData.status === 'Error') continue;
      if (costData.status === 'Conflict' || costData.status === 'Partial') continue;
      if (costData.status !== 'Active') continue;
      if (costData.totalCost === 0) continue;
      
      for (const store of costData.storeBreakdown) {
        if (store.isExcluded || store.hasConflict) continue;
        if (store.agreedQuantity === 0) continue;
        
        const storeId = store.storeId;
        if (!storeId) continue;
        
        if (!storeCostMap.has(storeId)) {
          storeCostMap.set(storeId, {
            'Store ID': storeId,
            'Store Name': store.storeName || 'Unknown Store',
            'Store Code': '',
            'Total Cost (ETB)': 0,
            'Item Count': 0
          });
          storeItemSet.set(storeId, new Set());
        }
        
        const storeData = storeCostMap.get(storeId);
        const storeCost = unitCost * store.agreedQuantity;
        storeData['Total Cost (ETB)'] += storeCost;
        
        const itemsInStore = storeItemSet.get(storeId);
        if (!itemsInStore.has(item.itemId)) {
          itemsInStore.add(item.itemId);
          storeData['Item Count'] += 1;
        }
        
        if (!storeData['Store Code']) {
          const storeInfo = await Store.findByPk(storeId, { attributes: ['code'] });
          if (storeInfo) storeData['Store Code'] = storeInfo.code || 'N/A';
        }
      }
    }
    
    let data = Array.from(storeCostMap.values())
      .filter(s => s['Total Cost (ETB)'] > 0)
      .sort((a, b) => b['Total Cost (ETB)'] - a['Total Cost (ETB)']);
    
    const total = data.length;
    const totalPages = Math.ceil(total / parsedLimit);
    const offset = (parsedPage - 1) * parsedLimit;
    const paginatedData = data.slice(offset, offset + parsedLimit);
    
    const totalCost = data.reduce((sum, s) => sum + s['Total Cost (ETB)'], 0);
    const result = paginatedData.map(s => ({
      ...s,
      'Total Cost (ETB)': Math.round(s['Total Cost (ETB)'] * 100) / 100,
      'Percentage': totalCost > 0 ? Math.round(((s['Total Cost (ETB)'] / totalCost) * 100) * 1000) / 1000 : 0
    }));
    
    console.log(`📤 Exporting ${result.length} stores (page ${parsedPage}/${totalPages})`);
    
    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages
      },
      totalCost: Math.round(totalCost * 100) / 100
    });
    
  } catch (error) {
    console.error('❌ Error exporting cost by store:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export cost by store'
    });
  }
};

// ================================================================
// 📤 6. EXPORT: Top Cost Items (WITH PAGINATION)
// ================================================================

exports.exportTopCostItems = async (req, res) => {
  try {
    console.log('🚀 exportTopCostItems called');
    const userAccess = await getUserStoreAndGroupFromRequest(req);
    const { page = 1, limit = 10 } = req.query;
    
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    
    const allItems = await Item.findAll({
      where: { status: 'Active' },
      attributes: ['itemId', 'code', 'name', 'standardName', 'costPrice', 'status', 'uomId', 'conversionUomId', 'conversionValue'],
      include: [
        { model: UOM, as: 'uom', attributes: ['code', 'name'] },
        { model: UOM, as: 'conversionUom', attributes: ['code', 'name'] },
        { model: Category, as: 'category', attributes: ['name'] }
      ]
    });
    
    const itemIds = allItems.map(i => i.itemId);
    
    let balanceWhere = { status: 'Active' };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhere.storeId = userAccess.storeId;
      balanceWhere.groupId = userAccess.groupId;
    }
    if (itemIds.length > 0) {
      balanceWhere.itemId = { [Op.in]: itemIds };
    }
    
    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['id', 'itemId', 'storeId', 'groupId', 'balance'],
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] }
      ]
    });
    
    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }
    
    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ['item_id', 'reason']
    });
    const excludedItemIds = new Set(excludedItems.map(e => e.item_id));
    
    const ItemCost = require('../models').ItemCost;
    let latestCosts = {};
    if (ItemCost) {
      const costRecords = await ItemCost.findAll({
        where: { itemId: { [Op.in]: itemIds } },
        order: [['created_at', 'DESC']],
        attributes: ['itemId', 'newCost']
      });
      for (const cost of costRecords) {
        if (!latestCosts[cost.itemId]) {
          latestCosts[cost.itemId] = parseFloat(cost.newCost);
        }
      }
    }
    
    const allItemCosts = [];
    
    for (const item of allItems) {
      const itemBalances = balancesByItem[item.itemId] || [];
      if (itemBalances.length === 0) continue;
      
      const unitCost = latestCosts[item.itemId] || parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.itemId);
      
      if (isExcluded) continue;
      if (unitCost === 0) continue;
      
      const hasConversionData = item.conversionUomId && item.conversionValue && parseFloat(item.conversionValue) > 0;
      if (!hasConversionData) continue;
      
      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        userAccess.storeId || null,
        userAccess.groupId || null,
        isExcluded,
        null
      );
      
      if (costData.status === 'Error') continue;
      if (costData.status === 'Conflict' || costData.status === 'Partial') continue;
      if (costData.status !== 'Active') continue;
      if (costData.totalCost === 0) continue;
      
      allItemCosts.push({
        'Rank': 0,
        'Item ID': item.itemId,
        'Item Code': item.code || 'N/A',
        'Item Name': item.name || 'Unknown',
        'Standard Name': item.standardName || '',
        'Category': item.category?.name || 'Uncategorized',
        'UOM': item.uom?.code || 'PCS',
        'Total Quantity': costData.totalQty,
        'Unit Cost (ETB)': unitCost,
        'Total Cost (ETB)': costData.totalCost,
        'Status': costData.status || item.status || 'Active'
      });
    }
    
    const sorted = allItemCosts
      .sort((a, b) => b['Total Cost (ETB)'] - a['Total Cost (ETB)']);
    
    const total = sorted.length;
    const totalPages = Math.ceil(total / parsedLimit);
    const offset = (parsedPage - 1) * parsedLimit;
    const paginatedData = sorted.slice(offset, offset + parsedLimit);
    
    const totalInventoryCost = sorted.reduce((sum, s) => sum + s['Total Cost (ETB)'], 0);
    
    const result = paginatedData.map((item, index) => ({
      ...item,
      'Rank': offset + index + 1,
      'Total Cost (ETB)': Math.round(item['Total Cost (ETB)'] * 100) / 100,
      'Unit Cost (ETB)': Math.round(item['Unit Cost (ETB)'] * 100) / 100,
      '% of Total Inventory': totalInventoryCost > 0 
        ? Math.round(((item['Total Cost (ETB)'] / totalInventoryCost) * 100) * 1000) / 1000 
        : 0
    }));
    
    console.log(`📤 Exporting ${result.length} top items (page ${parsedPage}/${totalPages})`);
    
    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages
      },
      totalInventoryCost: Math.round(totalInventoryCost * 100) / 100
    });
    
  } catch (error) {
    console.error('❌ Error exporting top cost items:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export top cost items'
    });
  }
};

// ================================================================
// 📤 7. EXPORT: Zero Cost Items (WITH PAGINATION)
// ================================================================

exports.exportZeroCostItems = async (req, res) => {
  try {
    console.log('🚀 exportZeroCostItems called');
    const userAccess = await getUserStoreAndGroupFromRequest(req);
    const { page = 1, limit = 10 } = req.query;
    
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    
    const zeroCostItems = await Item.findAll({
      where: { 
        status: 'Active',
        costPrice: { [Op.or]: [0, null] }
      },
      attributes: ['itemId', 'code', 'name', 'standardName', 'costPrice', 'status', 'uomId'],
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: UOM, as: 'uom', attributes: ['code', 'name'] }
      ]
    });
    
    const zeroCostItemIds = zeroCostItems.map(i => i.itemId);
    
    if (zeroCostItemIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: 0
        }
      });
    }
    
    let balanceWhere = { status: 'Active' };
    if (userAccess.hasAssignments && userAccess.storeId && userAccess.groupId) {
      balanceWhere.storeId = userAccess.storeId;
      balanceWhere.groupId = userAccess.groupId;
    }
    if (zeroCostItemIds.length > 0) {
      balanceWhere.itemId = { [Op.in]: zeroCostItemIds };
    }
    
    const balances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['id', 'itemId', 'balance', 'storeId', 'groupId'],
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] }
      ]
    });
    
    const balancesByItem = {};
    for (const balance of balances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }
    
    const exportData = [];
    for (const item of zeroCostItems) {
      const itemBalances = balancesByItem[item.itemId] || [];
      if (itemBalances.length === 0) continue;
      
      const firstBalance = itemBalances[0];
      exportData.push({
        'Item ID': item.itemId,
        'Item Code': item.code || 'N/A',
        'Item Name': item.name || 'Unknown',
        'Standard Name': item.standardName || '',
        'Category': item.category?.name || 'Uncategorized',
        'UOM': item.uom?.code || 'PCS',
        'Item Status': item.status || 'Active',
        'Balance Quantity': parseFloat(firstBalance.balance) || 0,
     
      });
    }
    
    exportData.sort((a, b) => a['Item Name'].localeCompare(b['Item Name']));
    
    const total = exportData.length;
    const totalPages = Math.ceil(total / parsedLimit);
    const offset = (parsedPage - 1) * parsedLimit;
    const paginatedData = exportData.slice(offset, offset + parsedLimit);
    
    console.log(`📤 Exporting ${paginatedData.length} zero cost items (page ${parsedPage}/${totalPages})`);
    
    res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('❌ Error exporting zero cost items:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export zero cost items'
    });
  }
};

// ================================================================
// 8. CLEAR CACHE
// ================================================================

exports.clearCache = async (req, res) => {
  try {
    dashboardCache.flushAll();
    console.log("🗑️ Dashboard cache cleared");
    res.json({
      success: true,
      message: "Dashboard cache cleared successfully",
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to clear cache",
    });
  }
};

module.exports = exports;