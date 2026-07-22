// controllers/itemCostController.js
'use strict';

const db = require('../models');
const { Item, StoreBalance, Store, Group, UOM, User, Category } = db;
const { Op } = require('sequelize');

// ================================================================
// HELPER: Calculate item cost from store balances
// ================================================================

async function calculateItemCost(itemId, storeId = null, groupId = null, userStatus = 'Active') {
  try {
    // Get the item with all associations
    const item = await Item.findByPk(itemId, {
      include: [
        { model: UOM, as: 'uom' },
        { model: Category, as: 'category' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    if (!item) {
      throw new Error('Item not found');
    }

    // Build where clause for store balances
    const whereClause = {
      itemId: itemId,
      status: 'Active',
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (groupId) {
      whereClause.groupId = groupId;
    }

    // Get all store balances for this item
    const balances = await StoreBalance.findAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['storeId', 'name', 'code'],
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Item,
          as: 'item',
          include: [
            { model: UOM, as: 'uom' },
            { model: UOM, as: 'conversionUom' },
          ],
        },
      ],
    });

    // 🔥 Get unit cost from the item's costPrice
    let unitCost = parseFloat(item.costPrice) || 0;
    
    // If no cost price on item, try to get from item_cost table
    if (unitCost === 0) {
      const ItemCost = db.ItemCost;
      if (ItemCost) {
        const latestCost = await ItemCost.findOne({
          where: { itemId: itemId },
          order: [['created_at', 'DESC']],
        });
        if (latestCost) {
          unitCost = parseFloat(latestCost.newCost);
        }
      }
    }

    // If no balances, return item with zero values
    if (balances.length === 0) {
      return {
        id: item.itemId,
        itemCode: item.code,
        itemName: item.name,
        itemStandardName: item.standardName || '',
        categoryName: item.category?.name || '',
        brand: item.brand || '',
        model: item.model || '',
        baseUOM: item.uom?.code || 'Units',
        unitCost: unitCost,
        totalQty: 0,
        totalCost: 0,
        status: 'Active',
        userStatus: userStatus,
        storeBreakdown: [],
        excludedStores: [],
        costHistory: [],
        includedStoresCount: 0,
        excludedStoresCount: 0,
        isFiltered: !!storeId,
      };
    }

    // Group balances by store
    const storeMap = new Map();

    for (const balance of balances) {
      const storeIdKey = balance.storeId;
      if (!storeMap.has(storeIdKey)) {
        storeMap.set(storeIdKey, {
          storeId: balance.storeId,
          storeName: balance.store?.name || 'Unknown Store',
          storeCode: balance.store?.code || '',
          groups: [],
          totalQty: 0,
        });
      }

      const storeData = storeMap.get(storeIdKey);
      
      // 🔥 Get the balance quantity
      let quantity = parseFloat(balance.balance) || 0;
      let originalQuantity = quantity;
      let conversionRate = 1;
      let originalUOM = balance.item?.uom?.code || 'Units';
      
      // 🔥 Check if conversion is needed
      const baseUOM = item.uom?.code || 'Units';
      const balanceUOM = balance.item?.uom?.code || 'Units';
      
      // If the balance UOM is different from the item's base UOM
      if (balanceUOM !== baseUOM && item.conversionValue > 0) {
        // If the balance UOM matches the conversion UOM
        if (balance.item?.uomId === item.conversionUomId) {
          conversionRate = parseFloat(item.conversionValue) || 1;
          quantity = originalQuantity * conversionRate;
        }
      }

      storeData.groups.push({
        groupId: balance.groupId,
        groupName: balance.group?.name || 'Unknown Group',
        quantity: quantity,
        originalQuantity: originalQuantity,
        originalUOM: originalUOM,
        conversionRate: conversionRate,
        baseQuantity: quantity,
        balanceId: balance.id,
      });
      storeData.totalQty += quantity;
    }

    // Process store breakdown
    const storeBreakdown = [];

    for (const [storeIdKey, storeData] of storeMap) {
      // Check if all groups in this store have the same quantity
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

    // Calculate totals
    const includedStores = storeBreakdown.filter(s => !s.isExcluded);
    const totalQty = includedStores.reduce((sum, s) => sum + s.agreedQuantity, 0);
    const totalCost = totalQty * unitCost;

    const excludedStores = storeBreakdown
      .filter(s => s.isExcluded)
      .map(s => s.storeName);

    // Determine status
    let status = 'Active';
    if (userStatus === 'Inactive') {
      status = 'Inactive';
    } else if (excludedStores.length > 0 && includedStores.length > 0) {
      status = 'Partial';
    } else if (excludedStores.length === storeBreakdown.length && storeBreakdown.length > 0) {
      status = 'Conflict';
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
      unitCost: unitCost,
      totalQty: totalQty,
      totalCost: totalCost,
      status: status,
      userStatus: userStatus,
      storeBreakdown: storeBreakdown,
      excludedStores: excludedStores,
      costHistory: [],
      includedStoresCount: includedStores.length,
      excludedStoresCount: excludedStores.length,
      isFiltered: !!storeId,
    };

  } catch (error) {
    console.error('Error calculating item cost:', error);
    return {
      id: itemId,
      itemCode: 'Unknown',
      itemName: 'Unknown Item',
      itemStandardName: '',
      categoryName: '',
      brand: '',
      model: '',
      baseUOM: 'Units',
      unitCost: 0,
      totalQty: 0,
      totalCost: 0,
      status: 'Active',
      userStatus: 'Active',
      storeBreakdown: [],
      excludedStores: [],
      costHistory: [],
      includedStoresCount: 0,
      excludedStoresCount: 0,
      isFiltered: !!storeId,
    };
  }
}

// ================================================================
// CONTROLLER METHODS
// ================================================================

/**
 * Get all items with cost calculations
 * GET /api/item-costs
 */
exports.getItemsWithCost = async (req, res) => {
  try {
    const { storeId, groupId, status, search, page = 1, limit = 10 } = req.query;

    // Build query for items
    const itemWhere = {};
    
    if (search) {
      const searchTerm = search.toLowerCase();
      itemWhere[Op.or] = [
        { code: { [Op.like]: `%${searchTerm}%` } },
        { name: { [Op.like]: `%${searchTerm}%` } },
        { standardName: { [Op.like]: `%${searchTerm}%` } },
        { brand: { [Op.like]: `%${searchTerm}%` } },
        { model: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get all active items with pagination
    const { count, rows: items } = await Item.findAndCountAll({
      where: itemWhere,
      include: [
        { model: UOM, as: 'uom' },
        { model: Category, as: 'category' },
        { model: UOM, as: 'conversionUom' },
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: offset,
    });

    // Calculate cost for each item
    const results = [];
    for (const item of items) {
      try {
        const costData = await calculateItemCost(
          item.itemId,
          storeId || null,
          groupId || null
        );

        // Apply status filter
        if (status && costData.status !== status) {
          continue;
        }

        results.push(costData);
      } catch (error) {
        console.error(`Error calculating cost for item ${item.itemId}:`, error);
        // Return item with zero values on error
        results.push({
          id: item.itemId,
          itemCode: item.code,
          itemName: item.name,
          itemStandardName: item.standardName || '',
          categoryName: item.category?.name || '',
          brand: item.brand || '',
          model: item.model || '',
          baseUOM: item.uom?.code || 'Units',
          unitCost: parseFloat(item.costPrice) || 0,
          totalQty: 0,
          totalCost: 0,
          status: 'Active',
          userStatus: 'Active',
          storeBreakdown: [],
          excludedStores: [],
          costHistory: [],
          includedStoresCount: 0,
          excludedStoresCount: 0,
          isFiltered: !!storeId,
        });
      }
    }

    res.json({
      success: true,
      data: results,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error('Get items with cost error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get items with cost',
    });
  }
};

/**
 * Get single item with cost calculation
 * GET /api/item-costs/:itemId
 */
exports.getItemCost = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { storeId, groupId } = req.query;

    const costData = await calculateItemCost(
      parseInt(itemId),
      storeId || null,
      groupId || null
    );

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

/**
 * Update item cost
 * POST /api/item-costs/:itemId
 */
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

    // Update the item's cost price
    await item.update({
      costPrice: unitCost,
    }, { transaction: t });

    await t.commit();

    // Get updated cost data
    const updatedData = await calculateItemCost(parseInt(itemId));

    res.json({
      success: true,
      message: 'Item cost updated successfully',
      data: updatedData,
    });

  } catch (error) {
    await t.rollback();
    console.error('Update item cost error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update item cost',
    });
  }
};

/**
 * Toggle item status (Active/Inactive)
 * PATCH /api/item-costs/:itemId/status
 */
exports.toggleItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be Active or Inactive',
      });
    }

    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    await item.update({ status: status });

    // Recalculate with new status
    const updatedData = await calculateItemCost(parseInt(itemId), null, null, status);

    res.json({
      success: true,
      message: `Item status updated to ${status}`,
      data: updatedData,
    });

  } catch (error) {
    console.error('Toggle item status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update item status',
    });
  }
};

/**
 * Get stores for dropdown
 * GET /api/item-costs/stores
 */
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { status: 'Active' },
      attributes: ['storeId', 'name', 'code'],
      order: [['name', 'ASC']],
    });

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

/**
 * Get groups for dropdown
 * GET /api/item-costs/groups
 */
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']],
    });

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

/**
 * Export cost report
 * GET /api/item-costs/export
 */
exports.exportCostReport = async (req, res) => {
  try {
    const { storeId, groupId } = req.query;

    const items = await Item.findAll({
      include: [
        { model: UOM, as: 'uom' },
        { model: Category, as: 'category' },
      ],
      order: [['name', 'ASC']],
    });

    const reportData = [];
    for (const item of items) {
      const costData = await calculateItemCost(
        item.itemId,
        storeId || null,
        groupId || null
      );

      if (costData.status !== 'Inactive') {
        reportData.push({
          'Item Code': costData.itemCode,
          'Item Name': costData.itemName,
          'Standard Name': costData.itemStandardName || '',
          'Category': costData.categoryName || '',
          'Brand': costData.brand || '',
          'Model': costData.model || '',
          'Base UOM': costData.baseUOM,
          'Unit Cost': costData.unitCost.toFixed(2),
          'Total Quantity': costData.totalQty,
          'Total Cost': costData.totalCost.toFixed(2),
          'Status': costData.status,
          'Excluded Stores': costData.excludedStores.join(', '),
        });
      }
    }

    res.json({
      success: true,
      data: reportData,
      total: reportData.length,
    });

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export report',
    });
  }
};

/**
 * Get cost summary
 * GET /api/item-costs/summary
 */
exports.getCostSummary = async (req, res) => {
  try {
    const { storeId, groupId } = req.query;

    const items = await Item.findAll();

    let totalItems = 0;
    let totalValue = 0;
    let partialItems = 0;
    const stores = new Set();

    for (const item of items) {
      const costData = await calculateItemCost(
        item.itemId,
        storeId || null,
        groupId || null
      );

      if (costData.status !== 'Inactive') {
        totalItems++;
        totalValue += costData.totalCost;
        if (costData.status === 'Partial') {
          partialItems++;
        }
        costData.storeBreakdown.forEach(s => stores.add(s.storeId));
      }
    }

    res.json({
      success: true,
      data: {
        totalItems,
        totalValue,
        partialItems,
        storeCount: stores.size,
        activeItems: totalItems - partialItems,
      },
    });

  } catch (error) {
    console.error('Get cost summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cost summary',
    });
  }
};