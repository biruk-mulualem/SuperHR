'use strict';

const db = require('../models');
const { Item, StoreBalance, Store, Group, UOM, User, Category, ExcludeItemFromCost } = db;
const { Op } = require('sequelize');
const NodeCache = require('node-cache');

// ================================================================
// CACHE CONFIGURATION
// ================================================================

const costCache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60,
  maxKeys: 500
});

// ================================================================
// 🔥 CALCULATE ITEM COST
// Formula: Balance × Conversion Value × Unit Cost
// ================================================================
// ================================================================
// 🔥 CALCULATE ITEM COST - FIXED VERSION
// Formula: Balance × Conversion Value × Unit Cost
// ================================================================

function calculateItemCostOptimized(
  item, 
  balances, 
  unitCost, 
  storeId = null, 
  groupId = null,
  isExcluded = false,
  exclusionReason = null
) {
  try {
    // ================================================================
    // 1. CHECK IF EXCLUDED
    // ================================================================
    if (isExcluded) {
      return {
        id: item.itemId,
        itemCode: item.code,
        itemName: item.name,
        itemStandardName: item.standardName || '',
        categoryName: item.category?.name || '',
        brand: item.brand || '',
        model: item.model || '',
        baseUOM: item.uom?.code || 'Units',
        conversionUOM: item.conversionUom?.code || null,
        conversionValue: parseFloat(item.conversionValue) || 0,
        unitCost: unitCost || 0,
        totalQty: 0,
        totalCost: 0,
        status: 'Inactive',
        statusMessage: exclusionReason || 'Excluded from cost calculations',
        userStatus: 'Active',
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

    // ================================================================
    // 2. CHECK REQUIRED DATA - FIXED: unitCost MUST BE > 0
    // ================================================================
    const hasUnitCost = unitCost !== undefined && unitCost !== null && unitCost > 0;
    const hasConversionUom = item.conversionUomId !== undefined && item.conversionUomId !== null;
    const hasConversionValue = item.conversionValue !== undefined && 
                               item.conversionValue !== null && 
                               parseFloat(item.conversionValue) > 0;
    
    const missingData = [];
    if (!hasUnitCost) {
      missingData.push('Unit Cost');
    }
    if (!hasConversionUom) {
      missingData.push('Conversion UOM');
    }
    if (!hasConversionValue) {
      missingData.push('Conversion Value');
    }

    // ================================================================
    // 3. CHECK FOR VALID BALANCES (quantity > 0)
    // ================================================================
    const hasValidBalance = balances && balances.some(b => parseFloat(b.balance) > 0);

    // ================================================================
    // 4. NO BALANCES OR ALL ZERO
    // ================================================================
    if (!balances || balances.length === 0 || !hasValidBalance) {
      let status = 'Incomplete';
      let statusMessage = 'No valid balances found';
      
      if (missingData.length > 0) {
        status = 'Incomplete';
        statusMessage = `Missing: ${missingData.join(', ')}`;
      } else {
        // If all data is complete but no balances
        statusMessage = 'No inventory found (all balances are 0)';
      }

      return {
        id: item.itemId,
        itemCode: item.code,
        itemName: item.name,
        itemStandardName: item.standardName || '',
        categoryName: item.category?.name || '',
        brand: item.brand || '',
        model: item.model || '',
        baseUOM: item.uom?.code || 'Units',
        conversionUOM: item.conversionUom?.code || null,
        conversionValue: parseFloat(item.conversionValue) || 0,
        unitCost: unitCost || 0,
        totalQty: 0,
        totalCost: 0,
        status: status,
        statusMessage: statusMessage,
        userStatus: item.status || 'Active',
        storeBreakdown: [],
        excludedStores: [],
        costHistory: [],
        includedStoresCount: 0,
        excludedStoresCount: 0,
        isFiltered: !!storeId,
        hasMissingData: missingData.length > 0,
        missingData: missingData,
        requiresSetup: missingData.length > 0 || !hasValidBalance,
        isExcluded: false,
        exclusionReason: null,
      };
    }

    // ================================================================
    // 5. MISSING CONVERSION DATA
    // ================================================================
    if (!hasConversionUom || !hasConversionValue) {
      const storeBreakdown = balances.map(balance => ({
        storeId: balance.storeId || balance.store_id,
        storeName: balance.store?.name || 'Unknown Store',
        hasConflict: false,
        isExcluded: true,
        agreedQuantity: parseFloat(balance.balance) || 0,
        groups: [{
          groupId: balance.groupId || balance.group_id,
          groupName: balance.group?.name || 'Unknown Group',
          quantity: parseFloat(balance.balance) || 0,
          originalQuantity: parseFloat(balance.balance) || 0,
          originalUOM: item.uom?.code || 'Units',
          conversionRate: 1,
          baseQuantity: parseFloat(balance.balance) || 0,
          balanceId: balance.id,
        }],
      }));

      return {
        id: item.itemId,
        itemCode: item.code,
        itemName: item.name,
        itemStandardName: item.standardName || '',
        categoryName: item.category?.name || '',
        brand: item.brand || '',
        model: item.model || '',
        baseUOM: item.uom?.code || 'Units',
        conversionUOM: item.conversionUom?.code || null,
        conversionValue: parseFloat(item.conversionValue) || 0,
        unitCost: unitCost || 0,
        totalQty: 0,
        totalCost: 0,
        status: 'Incomplete',
        statusMessage: `Missing: ${missingData.join(', ')}`,
        userStatus: item.status || 'Active',
        storeBreakdown: storeBreakdown,
        excludedStores: storeBreakdown.map(s => s.storeName),
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

    // ================================================================
    // 6. GROUP BALANCES BY STORE
    // ================================================================
    const storeMap = new Map();
    const baseUOM = item.uom?.code || 'Units';
    const conversionValue = parseFloat(item.conversionValue) || 1;

    for (const balance of balances) {
      const storeIdKey = balance.storeId || balance.store_id;
      const groupIdKey = balance.groupId || balance.group_id;
      
      if (!storeIdKey) {
        console.warn('⚠️ Balance missing storeId:', balance);
        continue;
      }

      if (!storeMap.has(storeIdKey)) {
        storeMap.set(storeIdKey, {
          storeId: storeIdKey,
          storeName: balance.store?.name || 'Unknown Store',
          storeCode: balance.store?.code || '',
          groups: [],
          totalQty: 0,
        });
      }

      const storeData = storeMap.get(storeIdKey);
      const originalQuantity = parseFloat(balance.balance) || 0;
      const convertedQuantity = originalQuantity * conversionValue;

      storeData.groups.push({
        groupId: groupIdKey,
        groupName: balance.group?.name || 'Unknown Group',
        quantity: convertedQuantity,
        originalQuantity: originalQuantity,
        originalUOM: baseUOM,
        conversionRate: conversionValue,
        baseQuantity: convertedQuantity,
        balanceId: balance.id,
      });
      storeData.totalQty += convertedQuantity;
    }

    // ================================================================
    // 7. CHECK CONFLICTS PER STORE
    // ================================================================
    const storeBreakdown = [];
    for (const [storeIdKey, storeData] of storeMap) {
      const quantities = storeData.groups.map(g => g.quantity);
      const firstQty = quantities[0];
      const allSame = quantities.every(q => Math.abs(q - firstQty) < 0.0001);

      storeBreakdown.push({
        storeId: storeData.storeId,
        storeName: storeData.storeName,
        hasConflict: !allSame,
        isExcluded: !allSame,
        agreedQuantity: allSame ? firstQty : 0,
        groups: storeData.groups.map(g => ({
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

    // ================================================================
    // 8. CALCULATE TOTALS FROM INCLUDED STORES ONLY
    // ================================================================
    let includedStores = [];
    let totalQty = 0;
    let excludedStores = [];

    if (storeId) {
      const filteredStore = storeBreakdown.find(s => s.storeId === Number(storeId));
      if (filteredStore) {
        if (!filteredStore.isExcluded) {
          includedStores = [filteredStore];
          totalQty = filteredStore.agreedQuantity;
        } else {
          excludedStores = [filteredStore.storeName];
        }
      }
    } else {
      includedStores = storeBreakdown.filter(s => !s.isExcluded);
      totalQty = includedStores.reduce((sum, s) => sum + s.agreedQuantity, 0);
      excludedStores = storeBreakdown.filter(s => s.isExcluded).map(s => s.storeName);
    }

    // ================================================================
    // 9. CALCULATE TOTAL COST
    // ================================================================
    const totalCost = hasUnitCost ? totalQty * unitCost : 0;
    const userStatus = item.status || 'Active';

    // ================================================================
    // 10. DETERMINE STATUS
    // ================================================================
    let status = 'Active';
    let statusMessage = 'Complete data';
    
    // Check if user status is inactive
    if (userStatus === 'Inactive') {
      status = 'Inactive';
      statusMessage = 'Item is inactive';
    } 
    // Check if missing data (unit cost or conversion)
    else if (missingData.length > 0 || !hasUnitCost || !hasConversionValue) {
      status = 'Incomplete';
      statusMessage = `Missing: ${missingData.join(', ')}`;
    } 
    // Check if total quantity is 0 (no valid inventory)
    else if (totalQty === 0) {
      status = 'Incomplete';
      statusMessage = 'No valid inventory (all stores have 0 quantity or conflicts)';
    }
    // Check if some stores have conflicts
    else if (excludedStores.length > 0 && includedStores.length > 0) {
      status = 'Partial';
      statusMessage = `${excludedStores.length} store(s) excluded due to conflicts`;
    } 
    // Check if all stores have conflicts
    else if (excludedStores.length === storeBreakdown.length && storeBreakdown.length > 0) {
      status = 'Conflict';
      statusMessage = 'All stores have conflicts';
    } 
    // All checks pass
    else {
      status = 'Active';
      statusMessage = 'Complete data';
    }

    // ================================================================
    // 11. RETURN RESULT
    // ================================================================
    return {
      id: item.itemId,
      itemCode: item.code,
      itemName: item.name,
      itemStandardName: item.standardName || '',
      categoryName: item.category?.name || '',
      brand: item.brand || '',
      model: item.model || '',
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
      hasMissingData: missingData.length > 0 || !hasUnitCost || !hasConversionValue,
      missingData: missingData,
      requiresSetup: missingData.length > 0 || !hasUnitCost || !hasConversionValue || totalQty === 0,
      isExcluded: false,
      exclusionReason: null,
    };
    
  } catch (error) {
    console.error('Error in calculateItemCostOptimized:', error);
    return {
      id: item?.itemId || 0,
      itemCode: item?.code || 'Unknown',
      itemName: item?.name || 'Unknown Item',
      itemStandardName: '',
      categoryName: '',
      brand: '',
      model: '',
      baseUOM: 'Units',
      conversionUOM: null,
      conversionValue: 0,
      unitCost: 0,
      totalQty: 0,
      totalCost: 0,
      status: 'Error',
      statusMessage: error.message || 'Error calculating cost',
      userStatus: 'Active',
      storeBreakdown: [],
      excludedStores: [],
      costHistory: [],
      includedStoresCount: 0,
      excludedStoresCount: 0,
      isFiltered: !!storeId,
      hasMissingData: true,
      missingData: ['Data Error'],
      requiresSetup: true,
      isExcluded: false,
      exclusionReason: null,
    };
  }
}

// ================================================================
// HELPER: Get item cost history
// ================================================================

async function getItemCostHistory(itemId, limit = 10) {
  try {
    const ItemCost = db.ItemCost;
    if (!ItemCost) return [];

    const history = await ItemCost.findAll({
      where: { itemId: itemId },
      order: [['created_at', 'DESC']],
      limit: limit,
      attributes: ['id', 'previousCost', 'newCost', 'reason', 'changedBy', 'created_at'],
    });

    return history.map(h => ({
      id: h.id,
      previousCost: parseFloat(h.previousCost) || 0,
      newCost: parseFloat(h.newCost) || 0,
      reason: h.reason || '',
      changedBy: h.changedBy || 'System',
      createdAt: h.created_at,
    }));
  } catch (error) {
    console.error('Error getting item cost history:', error);
    return [];
  }
}

/**
 * 🔥 GET ITEMS WITH COST - WITH FILTER PRIORITY
 */
exports.getItemsWithCost = async (req, res) => {
  try {
    console.log('🚀 START: getItemsWithCost');
    const { storeId, groupId, status, search, page = 1, limit = 10 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 10, 100000);
    const parsedPage = parseInt(page) || 1;

    const cacheKey = `items_${storeId || 'all'}_${groupId || 'all'}_${status || 'all'}_${search || 'all'}_${parsedPage}_${parsedLimit}`;

    // Check cache
    const cachedData = costCache.get(cacheKey);
    if (cachedData) {
      console.log('✅ Cache hit');
      return res.json(cachedData);
    }

    console.log('⏳ Cache miss, fetching items...');

    // 🔥 Build query for items
    const itemWhere = {};
    
    // Search filter
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      itemWhere[Op.or] = [
        { code: { [Op.iLike]: `%${term}%` } },
        { name: { [Op.iLike]: `%${term}%` } },
        { standardName: { [Op.iLike]: `%${term}%` } },
        { brand: { [Op.iLike]: `%${term}%` } },
        { model: { [Op.iLike]: `%${term}%` } }
      ];
    }

    // Store filter - get item IDs with balances in that store
    let itemIdsWithBalance = null;
    if (storeId) {
      const balances = await StoreBalance.findAll({
        where: { 
          storeId: storeId,
          status: 'Active' 
        },
        attributes: ['itemId'],
        group: ['itemId'],
        raw: true,
      });
      itemIdsWithBalance = balances.map(b => b.itemId);
      if (itemIdsWithBalance.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: { total: 0, page: parsedPage, limit: parsedLimit, pages: 0 },
        });
      }
    }

    // Combine search and store filters
    if (itemIdsWithBalance) {
      if (itemWhere[Op.or]) {
        itemWhere[Op.and] = [
          { [Op.or]: itemWhere[Op.or] },
          { itemId: { [Op.in]: itemIdsWithBalance } }
        ];
        delete itemWhere[Op.or];
      } else {
        itemWhere.itemId = { [Op.in]: itemIdsWithBalance };
      }
    }

    // 🔥 Get ALL items matching filters (without pagination for priority sorting)
    console.log('📦 Fetching all matching items for priority sorting...');
    const allMatchingItems = await Item.findAll({
      where: itemWhere,
      attributes: ['itemId', 'code', 'name', 'standardName', 'brand', 'model', 'costPrice', 'status', 'uomId', 'conversionUomId', 'conversionValue'],
      include: [
        { 
          model: UOM, 
          as: 'uom', 
          attributes: ['code', 'name'] 
        },
        { 
          model: Category, 
          as: 'category', 
          attributes: ['name'] 
        },
        { 
          model: UOM, 
          as: 'conversionUom', 
          attributes: ['code', 'name'] 
        },
      ],
      order: [['name', 'ASC']],
    });

    const totalCount = allMatchingItems.length;
    console.log(`📊 Total items matching filters: ${totalCount}`);

    if (allMatchingItems.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: parsedPage, limit: parsedLimit, pages: 0 },
      });
    }

    const itemIds = allMatchingItems.map(i => i.itemId);

    // 🔥 FIX: Get balances with correct field names (camelCase)
    console.log('📦 Fetching balances...');
    const balanceWhere = { 
      itemId: { [Op.in]: itemIds },
      status: 'Active' 
    };
    if (storeId) balanceWhere.storeId = storeId;
    if (groupId) balanceWhere.groupId = groupId;

    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['id', 'itemId', 'storeId', 'groupId', 'balance'],
      include: [
        { model: Store, as: 'store', attributes: ['storeId', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
    });
    console.log(`📦 Found ${allBalances.length} balances`);

    // Group balances by item
    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }

    // Get excluded items
    console.log('📦 Fetching excluded items...');
    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ['item_id', 'reason'],
      raw: true,
    });
    const excludedItemIds = new Set(excludedItems.map(e => e.item_id));
    const exclusionReasons = {};
    excludedItems.forEach(e => { exclusionReasons[e.item_id] = e.reason || 'Manually excluded'; });

    // 🔥 Process ALL items and calculate their data
    console.log('🔄 Processing all items...');
    const allProcessedItems = [];
    for (const item of allMatchingItems) {
      const itemBalances = balancesByItem[item.itemId] || [];
      const unitCost = parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.itemId);
      const exclusionReason = exclusionReasons[item.itemId] || null;

      console.log(`📦 Processing item: ${item.code}, Balances: ${itemBalances.length}`);

      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        storeId || null,
        groupId || null,
        isExcluded,
        exclusionReason
      );

      // Apply status filter
      if (status && costData.status !== status) continue;

      allProcessedItems.push(costData);
    }

    // 🔥 SORT: Items matching the filter should come first
    const sortPriority = {
      'Active': 0,
      'Partial': 1,
      'Setup Required': 2,
      'Incomplete': 3,
      'Inactive': 4,
      'Conflict': 5,
      'Error': 6
    };

    // Sort items
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      
      allProcessedItems.sort((a, b) => {
        // Priority 1: Exact match in code
        const aExactCode = a.itemCode.toLowerCase() === searchTerm;
        const bExactCode = b.itemCode.toLowerCase() === searchTerm;
        if (aExactCode && !bExactCode) return -1;
        if (!aExactCode && bExactCode) return 1;

        // Priority 2: Code starts with search term
        const aStartsWith = a.itemCode.toLowerCase().startsWith(searchTerm);
        const bStartsWith = b.itemCode.toLowerCase().startsWith(searchTerm);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Priority 3: Name contains search term
        const aNameMatch = a.itemName.toLowerCase().includes(searchTerm);
        const bNameMatch = b.itemName.toLowerCase().includes(searchTerm);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        // Priority 4: Status priority
        const aStatus = sortPriority[a.status] ?? 999;
        const bStatus = sortPriority[b.status] ?? 999;
        if (aStatus !== bStatus) return aStatus - bStatus;

        // Priority 5: Alphabetical
        return a.itemName.localeCompare(b.itemName);
      });
    } else {
      // No search: sort by status priority
      allProcessedItems.sort((a, b) => {
        const aStatus = sortPriority[a.status] ?? 999;
        const bStatus = sortPriority[b.status] ?? 999;
        if (aStatus !== bStatus) return aStatus - bStatus;
        return a.itemName.localeCompare(b.itemName);
      });
    }

    // 🔥 Apply pagination after sorting
    const startIndex = (parsedPage - 1) * parsedLimit;
    const endIndex = startIndex + parsedLimit;
    const paginatedItems = allProcessedItems.slice(startIndex, endIndex);

    const totalPages = Math.ceil(allProcessedItems.length / parsedLimit);

    const response = {
      success: true,
      data: paginatedItems,
      pagination: {
        total: allProcessedItems.length,
        page: parsedPage,
        limit: parsedLimit,
        pages: totalPages,
      },
    };

    costCache.set(cacheKey, response);
    console.log(`✅ Done! Total: ${allProcessedItems.length}, Page: ${parsedPage}/${totalPages}`);
    
    res.json(response);

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get items with cost',
    });
  }
};

// ================================================================
// 🔥 GET SINGLE ITEM COST
// ================================================================

// ================================================================
// 🔥 GET SINGLE ITEM COST WITH BALANCES
// ================================================================

exports.getItemCost = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { storeId, groupId } = req.query;

    // 1. Get item with all associations
    const item = await Item.findByPk(itemId, {
      include: [
        { model: UOM, as: 'uom' },
        { model: Category, as: 'category' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    // 2. Check if item is excluded
    const excludedItem = await ExcludeItemFromCost.findOne({
      where: {
        item_id: itemId,
        is_active: true,
      },
    });
    const isExcluded = !!excludedItem;
    const exclusionReason = excludedItem?.reason || null;

    // 3. Fetch balances for this item
    const balanceWhere = {
      item_id: itemId,
      status: 'Active',
    };
    if (storeId) balanceWhere.store_id = storeId;
    if (groupId) balanceWhere.group_id = groupId;

    const balances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['id', 'store_id', 'group_id', 'balance'],
      include: [
        { 
          model: Store, 
          as: 'store', 
          attributes: ['storeId', 'name', 'code'] 
        },
        { 
          model: Group, 
          as: 'group', 
          attributes: ['id', 'name', 'code'] 
        },
      ],
      order: [
        ['store_id', 'ASC'],
        ['group_id', 'ASC']
      ],
    });

    console.log(`📦 Found ${balances.length} balances for item ${item.code}`);

    // 4. Get unit cost
    const ItemCost = db.ItemCost;
    let unitCost = parseFloat(item.costPrice) || 0;
    if (ItemCost) {
      const latestCost = await ItemCost.findOne({
        where: { itemId: itemId },
        order: [['created_at', 'DESC']],
      });
      if (latestCost) {
        unitCost = parseFloat(latestCost.newCost);
      }
    }

    // 5. Calculate cost using the optimized function
    const costData = calculateItemCostOptimized(
      item,
      balances,
      unitCost,
      storeId || null,
      groupId || null,
      isExcluded,
      exclusionReason
    );

    // 6. Get cost history
    const history = await getItemCostHistory(parseInt(itemId), 10);
    costData.costHistory = history;

    // 7. Log the calculation details for debugging
    console.log(`✅ Item ${item.code}:`);
    console.log(`   - Base UOM: ${costData.baseUOM}`);
    console.log(`   - Conversion UOM: ${costData.conversionUOM}`);
    console.log(`   - Conversion Value: ${costData.conversionValue}`);
    console.log(`   - Unit Cost: ${costData.unitCost}`);
    console.log(`   - Total Quantity: ${costData.totalQty}`);
    console.log(`   - Total Cost: ${costData.totalCost}`);
    console.log(`   - Status: ${costData.status}`);
    console.log(`   - Included Stores: ${costData.includedStoresCount}`);
    console.log(`   - Excluded Stores: ${costData.excludedStoresCount}`);

    res.json({
      success: true,
      data: costData,
    });

  } catch (error) {
    console.error('Get item cost error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get item cost',
    });
  }
};

// ================================================================
// 🔥 GET ITEM COST HISTORY
// ================================================================

exports.getItemCostHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 20 } = req.query;

    const history = await getItemCostHistory(parseInt(itemId), parseInt(limit));

    res.json({
      success: true,
      data: history,
    });

  } catch (error) {
    console.error('Get item cost history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get item cost history',
    });
  }
};

// ================================================================
// 🔥 UPDATE ITEM COST
// ================================================================

exports.updateItemCost = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { itemId } = req.params;
    const { unitCost, reason } = req.body;
    const userId = req.user?.userId;

    if (!unitCost || unitCost <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Valid unit cost is required',
      });
    }

    const item = await Item.findByPk(itemId);
    if (!item) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    const previousCost = parseFloat(item.costPrice) || 0;

    await item.update({
      costPrice: unitCost,
    }, { transaction: t });

    const ItemCost = db.ItemCost;
    if (ItemCost) {
      await ItemCost.create({
        itemId: itemId,
        previousCost: previousCost,
        newCost: unitCost,
        reason: reason || 'Manual update',
        changedBy: userId || 'System',
        created_at: new Date(),
      }, { transaction: t });
    }

    await t.commit();

    costCache.flushAll();

    const updatedItem = await Item.findByPk(itemId, {
      include: [
        { model: UOM, as: 'uom' },
        { model: Category, as: 'category' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    const balances = await StoreBalance.findAll({
      where: {
        item_id: itemId,
        status: 'Active',
      },
      attributes: ['store_id', 'group_id', 'balance', 'id'],
      include: [
        { model: Store, as: 'store', attributes: ['storeId', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
    });

    let unitCostValue = parseFloat(item.costPrice) || 0;
    if (ItemCost) {
      const latestCost = await ItemCost.findOne({
        where: { itemId: itemId },
        order: [['created_at', 'DESC']],
      });
      if (latestCost) {
        unitCostValue = parseFloat(latestCost.newCost);
      }
    }

    const excludedItem = await ExcludeItemFromCost.findOne({
      where: {
        item_id: itemId,
        is_active: true,
      },
    });
    const isExcluded = !!excludedItem;
    const exclusionReason = excludedItem?.reason || null;

    const costData = calculateItemCostOptimized(
      updatedItem,
      balances,
      unitCostValue,
      null,
      null,
      isExcluded,
      exclusionReason
    );

    const history = await getItemCostHistory(parseInt(itemId), 5);
    costData.costHistory = history;

    res.json({
      success: true,
      message: 'Item cost updated successfully',
      data: costData,
    });

  } catch (error) {
    await t.rollback();
    console.error('Update item cost error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update item cost',
      });
    }
  }
};

// ================================================================
// 🔥 TOGGLE ITEM EXCLUSION
// ================================================================

exports.toggleItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    
    let userId = null;
    if (req.user?.userId) {
      try {
        const user = await User.findByPk(req.user.userId);
        if (user) {
          userId = req.user.userId;
        }
      } catch (error) {
        console.warn('Could not verify user:', error.message);
      }
    }

    console.log(`🔄 Toggling cost exclusion for item ${itemId}, status: ${status}, userId: ${userId}`);

    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be Active or Inactive',
      });
    }

    const shouldExclude = status === 'Inactive';
    let isExcluded = false;
    let message = '';
    let exclusionRecord = null;

    const existingExclusion = await ExcludeItemFromCost.findOne({
      where: {
        item_id: itemId,
      },
    });

    if (shouldExclude) {
      if (existingExclusion) {
        await existingExclusion.update({
          is_active: true,
          reason: `Status changed to Inactive - excluded from cost calculations`,
          excluded_by: userId,
          excluded_at: new Date(),
          updated_at: new Date(),
        });
        exclusionRecord = existingExclusion;
        isExcluded = true;
        message = `Item "${item.code}" has been EXCLUDED from cost calculations`;
        console.log(`✅ Item ${item.code} reactivated in exclusion table`);
      } else {
        exclusionRecord = await ExcludeItemFromCost.create({
          item_id: itemId,
          reason: `Status changed to Inactive - excluded from cost calculations`,
          excluded_by: userId,
          excluded_at: new Date(),
          is_active: true,
        });
        isExcluded = true;
        message = `Item "${item.code}" has been EXCLUDED from cost calculations`;
        console.log(`✅ Item ${item.code} newly added to exclusion table`);
      }

    } else {
      if (existingExclusion && existingExclusion.is_active === true) {
        await existingExclusion.update({
          is_active: false,
          updated_at: new Date(),
        });
        message = `Item "${item.code}" has been INCLUDED in cost calculations`;
        console.log(`✅ Item ${item.code} soft deleted from exclusion table`);
      } else {
        message = `Item "${item.code}" is already included in cost calculations`;
        console.log(`ℹ️ Item ${item.code} already included`);
      }
      isExcluded = false;
    }

    costCache.flushAll();

    const updatedItem = await Item.findByPk(itemId, {
      include: [
        { model: UOM, as: 'uom' },
        { model: Category, as: 'category' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    const balances = await StoreBalance.findAll({
      where: {
        item_id: itemId,
        status: 'Active',
      },
      attributes: ['store_id', 'group_id', 'balance', 'id'],
      include: [
        { model: Store, as: 'store', attributes: ['storeId', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
    });

    const ItemCost = db.ItemCost;
    let unitCost = parseFloat(updatedItem.costPrice) || 0;
    if (ItemCost) {
      const latestCost = await ItemCost.findOne({
        where: { itemId: itemId },
        order: [['created_at', 'DESC']],
      });
      if (latestCost) {
        unitCost = parseFloat(latestCost.newCost);
      }
    }

    const costData = calculateItemCostOptimized(
      updatedItem,
      balances,
      unitCost,
      null,
      null,
      isExcluded,
      isExcluded ? `Status changed to Inactive` : null
    );

    return res.json({
      success: true,
      message: message,
      data: {
        item: costData,
        isExcluded: isExcluded,
        exclusionReason: isExcluded ? `Status changed to Inactive` : null,
        exclusionRecord: exclusionRecord ? {
          id: exclusionRecord.id,
          itemId: exclusionRecord.item_id,
          reason: exclusionRecord.reason,
          excludedAt: exclusionRecord.excluded_at,
          excludedBy: exclusionRecord.excluded_by,
        } : null,
      },
    });

  } catch (error) {
    console.error('Toggle item status error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to toggle item status',
      });
    }
  }
};

// ================================================================
// 🔥 GET STORES
// ================================================================

exports.getStores = async (req, res) => {
  try {
    const storeCacheKey = 'stores_list';
    let stores = costCache.get(storeCacheKey);

    if (!stores) {
      stores = await Store.findAll({
        where: { status: 'Active' },
        attributes: ['storeId', 'name', 'code'],
        order: [['name', 'ASC']],
      });
      costCache.set(storeCacheKey, stores, 3600);
    }

    res.json({
      success: true,
      data: stores.map(s => ({
        id: s.storeId,
        name: s.name,
        code: s.code,
      })),
    });

  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stores',
    });
  }
};

// ================================================================
// 🔥 GET GROUPS
// ================================================================

exports.getGroups = async (req, res) => {
  try {
    const groupCacheKey = 'groups_list';
    let groups = costCache.get(groupCacheKey);

    if (!groups) {
      groups = await Group.findAll({
        where: { status: 'Active' },
        attributes: ['id', 'name', 'code'],
        order: [['name', 'ASC']],
      });
      costCache.set(groupCacheKey, groups, 3600);
    }

    res.json({
      success: true,
      data: groups,
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get groups',
    });
  }
};

// ================================================================
// 🔥 EXPORT COST REPORT
// ================================================================
// ================================================================
// 🔥 EXPORT COST REPORT - FIXED TO INCLUDE ALL ITEMS WITH DATA
// ================================================================

exports.exportCostReport = async (req, res) => {
  try {
    const { storeId, groupId } = req.query;
    
    console.log('📊 Exporting cost report...');
    console.log('📊 Store filter:', storeId || 'All');
    console.log('📊 Group filter:', groupId || 'All');

    // Get ALL items (not just Active) - we want to see everything
    const items = await Item.findAll({
      include: [
        { model: UOM, as: 'uom', attributes: ['code', 'name'] },
        { model: Category, as: 'category', attributes: ['name'] },
        { model: UOM, as: 'conversionUom', attributes: ['code', 'name'] },
      ],
      order: [['name', 'ASC']],
    });

    console.log(`📊 Found ${items.length} total items`);

    if (items.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'No items found in the system',
      });
    }

    const itemIds = items.map(i => i.id);
    
    // Get balances for these items
    const balanceWhere = {
      item_id: { [Op.in]: itemIds },
      status: 'Active',
    };
    if (storeId) balanceWhere.store_id = storeId;
    if (groupId) balanceWhere.group_id = groupId;

    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['id', 'item_id', 'store_id', 'group_id', 'balance'],
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
      order: [
        ['item_id', 'ASC'],
        ['store_id', 'ASC'],
        ['group_id', 'ASC']
      ],
    });

    console.log(`📊 Found ${allBalances.length} balances`);

    // Group balances by item
    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.item_id]) {
        balancesByItem[balance.item_id] = [];
      }
      balancesByItem[balance.item_id].push(balance);
    }

    // Get excluded items
    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ['item_id', 'reason']
    });
    const excludedItemIds = new Set(excludedItems.map(e => e.item_id));
    const exclusionReasons = {};
    excludedItems.forEach(e => {
      exclusionReasons[e.item_id] = e.reason || 'Manually excluded';
    });

    // Get latest costs
    const ItemCost = db.ItemCost;
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

    console.log('🔄 Processing items and building report...');

    const reportData = [];
    let processedCount = 0;

    for (const item of items) {
      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`📊 Processed ${processedCount}/${items.length} items`);
      }

      const itemBalances = balancesByItem[item.id] || [];
      const unitCost = latestCosts[item.id] || parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.id);

      // Use a simpler calculation for export - just show the raw data
      // Calculate total quantity from balances
      let totalQty = 0;
      let totalCost = 0;
      let storeBreakdown = [];
      let hasConflict = false;
      
      if (itemBalances.length > 0) {
        // Group balances by store to detect conflicts
        const storeMap = new Map();
        for (const balance of itemBalances) {
          const storeIdKey = balance.store_id;
          const groupIdKey = balance.group_id;
          const quantity = parseFloat(balance.balance) || 0;
          
          if (!storeMap.has(storeIdKey)) {
            storeMap.set(storeIdKey, {
              storeId: storeIdKey,
              storeName: balance.store?.name || 'Unknown Store',
              storeCode: balance.store?.code || '',
              groups: [],
              totalQty: 0,
            });
          }
          
          const storeData = storeMap.get(storeIdKey);
          storeData.groups.push({
            groupId: groupIdKey,
            groupName: balance.group?.name || 'Unknown Group',
            quantity: quantity,
          });
          storeData.totalQty += quantity;
        }
        
        // Check for conflicts per store
        for (const [storeIdKey, storeData] of storeMap) {
          const quantities = storeData.groups.map(g => g.quantity);
          const firstQty = quantities[0];
          const allSame = quantities.every(q => Math.abs(q - firstQty) < 0.0001);
          
          storeBreakdown.push({
            storeId: storeData.storeId,
            storeName: storeData.storeName,
            hasConflict: !allSame,
            isExcluded: !allSame,
            agreedQuantity: allSame ? firstQty : 0,
            groups: storeData.groups,
          });
          
          if (!allSame) {
            hasConflict = true;
          }
        }
        
        // Calculate total quantity from stores without conflicts
        const includedStores = storeBreakdown.filter(s => !s.isExcluded);
        totalQty = includedStores.reduce((sum, s) => sum + s.agreedQuantity, 0);
        totalCost = unitCost * totalQty;
      }
      
      // Determine status
      let status = 'No Data';
      let statusMessage = '';
      let hasMissingData = false;
      let missingData = [];
      
      if (isExcluded) {
        status = 'Inactive';
        statusMessage = 'Excluded from cost calculations';
      } else if (item.status === 'Inactive') {
        status = 'Inactive';
        statusMessage = 'Item is inactive';
      } else if (unitCost <= 0) {
        status = 'Incomplete';
        statusMessage = 'Missing Unit Cost';
        hasMissingData = true;
        missingData.push('Unit Cost');
      } else if (!item.conversion_uom_id) {
        status = 'Incomplete';
        statusMessage = 'Missing Conversion UOM';
        hasMissingData = true;
        missingData.push('Conversion UOM');
      } else if (!item.conversion_value || item.conversion_value <= 0) {
        status = 'Incomplete';
        statusMessage = 'Missing Conversion Value';
        hasMissingData = true;
        missingData.push('Conversion Value');
      } else if (itemBalances.length === 0) {
        status = 'No Inventory';
        statusMessage = 'No balances found';
      } else if (hasConflict) {
        status = 'Partial';
        statusMessage = 'Store conflicts exist';
      } else if (totalQty === 0) {
        status = 'Zero Inventory';
        statusMessage = 'All balances are 0';
      } else {
        status = 'Active';
        statusMessage = 'Complete data';
      }

      // Build base row with essential info
      const baseRow = {
        'Item Code': item.code || 'N/A',
        'Item Name': item.name || 'Unknown',
        'Standard Name': item.standard_name || '',
        'Category': item.category?.name || '',
        'Brand': item.brand || '',
        'Model': item.model || '',
        'Base UOM': item.uom?.code || 'Units',
        'Conversion UOM': item.conversionUom?.code || '',
        'Conversion Value': item.conversion_value || 0,
        'Unit Cost (ETB)': unitCost.toFixed(2),
        'Total Quantity': totalQty,
        'Total Cost (ETB)': totalCost.toFixed(2),
        'Item Status': item.status || 'Unknown',
        'Cost Status': status,
        'Status Message': statusMessage,
        'Has Missing Data': hasMissingData ? 'Yes' : 'No',
        'Missing Data': missingData.join(', ') || '',
        'Included Stores': storeBreakdown.filter(s => !s.isExcluded).length,
        'Excluded Stores': storeBreakdown.filter(s => s.isExcluded).length,
        'Is Excluded': isExcluded ? 'Yes' : 'No',
        'Exclusion Reason': isExcluded ? (exclusionReasons[item.id] || 'Manually excluded') : '',
        'Total Balances': itemBalances.length,
        'Has Conflicts': hasConflict ? 'Yes' : 'No',
      };

      // Add store breakdown
      if (storeBreakdown && storeBreakdown.length > 0) {
        let storeIndex = 1;
        for (const store of storeBreakdown) {
          const prefix = `Store ${storeIndex}`;
          baseRow[`${prefix} - Store Name`] = store.storeName || '';
          baseRow[`${prefix} - Store ID`] = store.storeId || '';
          baseRow[`${prefix} - Has Conflict`] = store.hasConflict ? 'Yes' : 'No';
          baseRow[`${prefix} - Is Excluded`] = store.isExcluded ? 'Yes' : 'No';
          baseRow[`${prefix} - Agreed Quantity`] = store.agreedQuantity || 0;
          
          // Add group details
          if (store.groups && store.groups.length > 0) {
            let groupIndex = 1;
            for (const group of store.groups) {
              const groupPrefix = `${prefix} - Group ${groupIndex}`;
              baseRow[`${groupPrefix} - Group Name`] = group.groupName || '';
              baseRow[`${groupPrefix} - Group ID`] = group.groupId || '';
              baseRow[`${groupPrefix} - Quantity`] = group.quantity || 0;
              groupIndex++;
            }
          }
          storeIndex++;
        }
      }

      // Always include the item, even if it has no data
      reportData.push(baseRow);
    }

    console.log(`✅ Report built with ${reportData.length} items`);

    if (reportData.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'No items found',
      });
    }

    // Get all headers for consistent CSV
    const allHeaders = Object.keys(reportData[0]);
    
    // Build CSV with all columns
    const csvRows = [];
    csvRows.push(allHeaders.join(','));

    for (const row of reportData) {
      const values = allHeaders.map(header => {
        const value = row[header] ?? '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');

    // Add BOM for UTF-8 encoding
    const blob = new Blob(['\uFEFF' + csvString], { 
      type: 'text/csv;charset=utf-8;' 
    });

    const fileName = `cost_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log(`📤 Sending export file with ${reportData.length} items`);
    res.send(blob);

  } catch (error) {
    console.error('❌ Export report error:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export report',
    });
  }
};

// ================================================================
// 🔥 GET COST SUMMARY
// ================================================================

exports.getCostSummary = async (req, res) => {
  try {
    const { storeId, groupId } = req.query;

    const cacheKey = `summary_${storeId || 'all'}_${groupId || 'all'}`;
    let summary = costCache.get(cacheKey);

    if (summary) {
      return res.json({
        success: true,
        data: summary,
      });
    }

    const items = await Item.findAll();

    if (items.length === 0) {
      summary = {
        totalItems: 0,
        totalValue: 0,
        partialItems: 0,
        storeCount: 0,
        activeItems: 0,
        incompleteItems: 0,
        errorItems: 0,
        excludedItems: 0,
      };
      costCache.set(cacheKey, summary, 300);
      return res.json({
        success: true,
        data: summary,
      });
    }

    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ['item_id']
    });
    const excludedItemIds = new Set(excludedItems.map(e => e.item_id));

    const itemIds = items.map(i => i.itemId);
    const balanceWhere = {
      item_id: { [Op.in]: itemIds },
      status: 'Active',
    };
    if (storeId) balanceWhere.store_id = storeId;
    if (groupId) balanceWhere.group_id = groupId;

    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['item_id', 'store_id', 'group_id', 'balance', 'id'],
      include: [
        { model: Store, as: 'store', attributes: ['storeId'] },
        { model: Group, as: 'group', attributes: ['id'] },
      ],
    });

    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.item_id]) {
        balancesByItem[balance.item_id] = [];
      }
      balancesByItem[balance.item_id].push(balance);
    }

    const ItemCost = db.ItemCost;
    let latestCosts = {};
    if (ItemCost) {
      const costRecords = await ItemCost.findAll({
        where: { itemId: { [Op.in]: itemIds } },
        order: [['created_at', 'DESC']],
        attributes: ['itemId', 'newCost'],
      });
      for (const cost of costRecords) {
        if (!latestCosts[cost.itemId]) {
          latestCosts[cost.itemId] = parseFloat(cost.newCost);
        }
      }
    }

    let totalItems = 0;
    let totalValue = 0;
    let partialItems = 0;
    let incompleteItems = 0;
    let errorItems = 0;
    let excludedItemsCount = excludedItemIds.size;
    const stores = new Set();

    for (const item of items) {
      const itemBalances = balancesByItem[item.itemId] || [];
      const unitCost = latestCosts[item.itemId] || parseFloat(item.costPrice) || 0;
      
      const isExcluded = excludedItemIds.has(item.itemId);
      
      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        storeId || null,
        groupId || null,
        isExcluded,
        null
      );

      if (isExcluded) {
        continue;
      }

      if (costData.status === 'Incomplete') {
        incompleteItems++;
        continue;
      }
      
      if (costData.status === 'Error') {
        errorItems++;
        continue;
      }

      if (costData.status !== 'Inactive') {
        totalItems++;
        totalValue += costData.totalCost;
        if (costData.status === 'Partial') {
          partialItems++;
        }
        costData.storeBreakdown.forEach(s => stores.add(s.storeId));
      }
    }

    summary = {
      totalItems,
      totalValue,
      partialItems,
      storeCount: stores.size,
      activeItems: totalItems - partialItems,
      incompleteItems,
      errorItems,
      excludedItems: excludedItemsCount,
    };

    costCache.set(cacheKey, summary, 300);

    res.json({
      success: true,
      data: summary,
    });

  } catch (error) {
    console.error('Get cost summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cost summary',
    });
  }
};


/**
 * 🔥 EXPORT ALL ITEMS - DEDICATED EXPORT ENDPOINT
 * No pagination, no cache, returns all data
 */
exports.exportAllItems = async (req, res) => {
  try {
    console.log('🚀 START: exportAllItems');
    const { storeId, groupId, status, search } = req.query;

    // Build query (same filtering as getItemsWithCost)
    const itemWhere = {};
    
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      itemWhere[Op.or] = [
        { code: { [Op.iLike]: `%${term}%` } },
        { name: { [Op.iLike]: `%${term}%` } },
        { standardName: { [Op.iLike]: `%${term}%` } },
        { brand: { [Op.iLike]: `%${term}%` } },
        { model: { [Op.iLike]: `%${term}%` } }
      ];
    }

    // Store filter
    let itemIdsWithBalance = null;
    if (storeId) {
      const balances = await StoreBalance.findAll({
        where: { 
          storeId: storeId,
          status: 'Active' 
        },
        attributes: ['itemId'],
        group: ['itemId'],
        raw: true,
      });
      itemIdsWithBalance = balances.map(b => b.itemId);
      if (itemIdsWithBalance.length === 0) {
        return res.json({
          success: true,
          data: [],
          total: 0,
        });
      }
    }

    if (itemIdsWithBalance) {
      if (itemWhere[Op.or]) {
        itemWhere[Op.and] = [
          { [Op.or]: itemWhere[Op.or] },
          { itemId: { [Op.in]: itemIdsWithBalance } }
        ];
        delete itemWhere[Op.or];
      } else {
        itemWhere.itemId = { [Op.in]: itemIdsWithBalance };
      }
    }

    // Get ALL items - NO LIMIT
    const allItems = await Item.findAll({
      where: itemWhere,
      attributes: ['itemId', 'code', 'name', 'standardName', 'brand', 'model', 'costPrice', 'status', 'uomId', 'conversionUomId', 'conversionValue'],
      include: [
        { model: UOM, as: 'uom', attributes: ['code', 'name'] },
        { model: Category, as: 'category', attributes: ['name'] },
        { model: UOM, as: 'conversionUom', attributes: ['code', 'name'] },
      ],
      order: [['name', 'ASC']],
    });

    if (allItems.length === 0) {
      return res.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const itemIds = allItems.map(i => i.itemId);

    // Get balances
    const balanceWhere = { 
      itemId: { [Op.in]: itemIds },
      status: 'Active' 
    };
    if (storeId) balanceWhere.storeId = storeId;
    if (groupId) balanceWhere.groupId = groupId;

    const allBalances = await StoreBalance.findAll({
      where: balanceWhere,
      attributes: ['id', 'itemId', 'storeId', 'groupId', 'balance'],
      include: [
        { model: Store, as: 'store', attributes: ['storeId', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
    });

    // Group balances by item
    const balancesByItem = {};
    for (const balance of allBalances) {
      if (!balancesByItem[balance.itemId]) {
        balancesByItem[balance.itemId] = [];
      }
      balancesByItem[balance.itemId].push(balance);
    }

    // Get excluded items
    const excludedItems = await ExcludeItemFromCost.findAll({
      where: { is_active: true },
      attributes: ['item_id', 'reason'],
      raw: true,
    });
    const excludedItemIds = new Set(excludedItems.map(e => e.item_id));
    const exclusionReasons = {};
    excludedItems.forEach(e => { exclusionReasons[e.item_id] = e.reason || 'Manually excluded'; });

    // Process ALL items
    const exportData = [];
    for (const item of allItems) {
      const itemBalances = balancesByItem[item.itemId] || [];
      const unitCost = parseFloat(item.costPrice) || 0;
      const isExcluded = excludedItemIds.has(item.itemId);
      const exclusionReason = exclusionReasons[item.itemId] || null;

      const costData = calculateItemCostOptimized(
        item,
        itemBalances,
        unitCost,
        storeId || null,
        groupId || null,
        isExcluded,
        exclusionReason
      );

      // Apply status filter
      if (status && costData.status !== status) continue;

      // Build export row
      exportData.push({
        'Item Code': costData.itemCode,
        'Item Name': costData.itemName,
        'Standard Name': costData.itemStandardName || '',
        'Category': costData.categoryName || '',
        'Brand': costData.brand || '',
        'Model': costData.model || '',
        'Base UOM': costData.baseUOM,
        'Conversion UOM': costData.conversionUOM || '',
        'Conversion Value': costData.conversionValue,
        'Unit Cost (ETB)': costData.unitCost.toFixed(2),
        'Total Quantity': costData.totalQty,
        'Total Cost (ETB)': costData.totalCost.toFixed(2),
        'Status': costData.status,
        'Status Message': costData.statusMessage,
        'Included Stores': costData.includedStoresCount,
        'Excluded Stores': costData.excludedStoresCount,
        'Is Excluded': costData.isExcluded ? 'Yes' : 'No',
        'Exclusion Reason': costData.exclusionReason || '',
        'Has Missing Data': costData.hasMissingData ? 'Yes' : 'No',
        'Missing Data': costData.missingData.join(', ') || '',
        'Requires Setup': costData.requiresSetup ? 'Yes' : 'No'
      });
    }

    console.log(`✅ Export ready: ${exportData.length} items`);

    res.json({
      success: true,
      data: exportData,
      total: exportData.length,
    });

  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export items',
    });
  }
};

// ================================================================
// 🔥 CLEAR CACHE
// ================================================================

exports.clearCache = async (req, res) => {
  try {
    costCache.flushAll();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache',
    });
  }
};