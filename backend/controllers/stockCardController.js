// controllers/stockCardController.js - FIXED: Added isBaseUom filter

'use strict';

const { Op } = require('sequelize');
const {
  StoreBalanceHistory,
  StoreBalance,
  Store,
  Group,
  Item,
  Category,
  UOM,
  User,
  sequelize,
} = require('../models');

// ================================================================
// HELPER: BUILD SHORT PARTICULARS
// ================================================================

function buildParticulars(tx) {
  if (tx.remark) {
    const reqMatch = tx.remark.match(/REQ-\d{6}-\d{3}/);
    if (reqMatch) return reqMatch[0];
    
    const grnMatch = tx.remark.match(/GRN-\d{4}-\d{3}/);
    if (grnMatch) return grnMatch[0];
    
    const sivMatch = tx.remark.match(/SIV-\d{4}-\d{3}/);
    if (sivMatch) return sivMatch[0];
    
    return tx.remark.substring(0, 40) + (tx.remark.length > 40 ? '...' : '');
  }
  
  if (tx.referenceType) {
    const refLabels = {
      purchase: 'Purchase',
      transfer: 'Transfer',
      adjustment: 'Adjustment',
      return: 'Return',
      sale: 'Sale',
      initialization: 'Initial Stock',
      request: 'Request',
    };
    
    if (tx.referenceType === 'transfer' && tx.sourceStore && tx.destinationStore) {
      return `Transfer: ${tx.sourceStore.name} → ${tx.destinationStore.name}`;
    }
    
    return refLabels[tx.referenceType] || tx.referenceType;
  }
  
  return '';
}

// ================================================================
// GET STOCK CARD - WITH UOM FILTER
// ================================================================

const getStockCard = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      storeId,
      groupId,
      startDate,
      endDate,
      limit = 100,
      // ✅ ADD UOM FILTER PARAMETER
      isBaseUom,
    } = req.query;

    console.log(`📊 Stock card request: itemId=${itemId}, storeId=${storeId}, groupId=${groupId}, isBaseUom=${isBaseUom}`);

    // ============================================================
    // 1. VALIDATE REQUIRED FILTERS
    // ============================================================

    if (!storeId || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'storeId and groupId are required',
      });
    }

    // ============================================================
    // 2. GET ITEM WITH UNIT COST AND UOM INFO
    // ============================================================

    const item = await Item.findByPk(itemId, {
      include: [
        { model: UOM, as: 'uom', attributes: ['id', 'code', 'name'] },
        { model: UOM, as: 'conversionUom', attributes: ['id', 'code', 'name'] },
        { model: Category, as: 'category', attributes: ['categoryId', 'name'] },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    const unitCost = parseFloat(item.costPrice || 0);

    // ============================================================
    // 3. GET CURRENT BALANCE FROM STORE_BALANCE TABLE
    // ============================================================

    const balanceWhere = {
      itemId: parseInt(itemId),
      storeId: parseInt(storeId),
      groupId: parseInt(groupId),
    };

    const currentBalanceRecord = await StoreBalance.findOne({
      where: balanceWhere,
      attributes: ['balance', 'minStockAlert', 'status', 'storeId', 'groupId'],
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
    });

    const currentBalance = currentBalanceRecord
      ? parseFloat(currentBalanceRecord.balance || 0)
      : 0;

    // ============================================================
    // 4. BUILD TRANSACTION QUERY WITH UOM FILTER
    // ============================================================

    const whereClause = {
      itemId: parseInt(itemId),
      storeId: parseInt(storeId),
      groupId: parseInt(groupId),
      transactionType: {
        [Op.in]: ['Stock In', 'Stock Out'],
      },
    };

    // ✅ ADD UOM FILTER
    if (isBaseUom === 'true' || isBaseUom === true) {
      whereClause.isBaseUom = true;
    } else if (isBaseUom === 'false' || isBaseUom === false) {
      whereClause.isBaseUom = false;
    }

    if (startDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    }
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate + 'T23:59:59'),
      };
    }

    console.log(`📊 WHERE clause:`, JSON.stringify(whereClause, null, 2));

    // ============================================================
    // 5. FETCH TRANSACTIONS
    // ============================================================

    const transactions = await StoreBalanceHistory.findAll({
      where: whereClause,
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
        { model: Store, as: 'sourceStore', attributes: ['id', 'name', 'code'] },
        { model: Store, as: 'destinationStore', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'changedByUser', attributes: ['userId', 'username', 'fullName'] },
      ],
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: parseInt(limit),
    });

    console.log(`✅ Found ${transactions.length} transactions`);

    // ============================================================
    // 6. FORMAT ROWS
    // ============================================================

    let totalQuantityIn = 0;
    let totalQuantityOut = 0;
    let totalCostIn = 0;
    let totalCostOut = 0;

    const formattedRows = transactions.map((tx) => {
      const isStockIn = tx.transactionType === 'Stock In';
      const quantity = parseFloat(tx.changeAmount || 0);
      
      const runningQuantityBalance = parseFloat(tx.newBalance || 0);
      const runningCostBalance = runningQuantityBalance * unitCost;

      if (isStockIn) {
        totalQuantityIn += quantity;
        totalCostIn += quantity * unitCost;
      } else {
        totalQuantityOut += quantity;
        totalCostOut += quantity * unitCost;
      }

      const date = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('en-GB')
        : '';

      const particulars = buildParticulars(tx);

      return {
        date,
        grn: tx.grnNumber || '',
        siv: tx.sivNumber || '',
        particulars: particulars,
        quantityIn: isStockIn ? quantity : 0,
        quantityOut: isStockIn ? 0 : quantity,
        unitCost: unitCost,
        runningQuantityBalance: runningQuantityBalance,
        runningCostBalance: runningCostBalance,
        previousBalance: parseFloat(tx.previousBalance || 0),
        newBalance: parseFloat(tx.newBalance || 0),
        transactionType: tx.transactionType,
        referenceType: tx.referenceType,
        storeName: tx.store?.name,
        groupName: tx.group?.name,
        updatedBy: tx.changedByUser?.fullName || tx.changedByUser?.username,
        // ✅ ADD UOM FIELDS TO RESPONSE
        uomUsed: tx.uomUsed || item.uom?.code || 'PCS',
        isBaseUom: tx.isBaseUom !== false,
        _raw: {
          id: tx.id,
          balanceId: tx.balanceId,
          referenceId: tx.referenceId,
        },
      };
    });

    // ============================================================
    // 7. DETERMINE DISPLAY UOM
    // ============================================================

    const displayUom = isBaseUom === 'false' 
      ? (item.conversionUom?.code || item.uom?.code || 'PCS')
      : (item.uom?.code || 'PCS');

    // ============================================================
    // 8. BUILD RESPONSE
    // ============================================================

    const response = {
      success: true,
      data: {
        form: {
          maximumStockLevel: '',
          merchandise: item.name || item.standardName || '',
          unitOfMeasurement: displayUom,
          codeNo: item.code || '',
        },

        rows: formattedRows,

        currentBalance: currentBalance,

        currentBalanceContext: currentBalanceRecord
          ? {
              balance: currentBalance,
              minStockAlert: parseFloat(currentBalanceRecord.minStockAlert || 0),
              status: currentBalanceRecord.status,
              store: currentBalanceRecord.store
                ? {
                    id: currentBalanceRecord.store.id,
                    name: currentBalanceRecord.store.name,
                    code: currentBalanceRecord.store.code,
                  }
                : null,
              group: currentBalanceRecord.group
                ? {
                    id: currentBalanceRecord.group.id,
                    name: currentBalanceRecord.group.name,
                    code: currentBalanceRecord.group.code,
                  }
                : null,
            }
          : null,

        item: {
          id: item.itemId,
          code: item.code,
          name: item.name,
          standardName: item.standardName,
          uomCode: item.uom?.code,
          uomName: item.uom?.name,
          conversionUomCode: item.conversionUom?.code,
          conversionUomName: item.conversionUom?.name,
          categoryName: item.category?.name,
          costPrice: unitCost,
        },

        summary: {
          totalTransactions: transactions.length,
          totalQuantityIn: totalQuantityIn,
          totalQuantityOut: totalQuantityOut,
          totalCostIn: totalCostIn,
          totalCostOut: totalCostOut,
          currentBalance: currentBalance,
          currentCostBalance: currentBalance * unitCost,
          unitCost: unitCost,
        },

        filters: {
          storeId: storeId || null,
          groupId: groupId || null,
          startDate: startDate || null,
          endDate: endDate || null,
          limit: parseInt(limit),
          // ✅ INCLUDE UOM FILTER IN RESPONSE
          isBaseUom: isBaseUom !== undefined ? isBaseUom : null,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Get stock card error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================================================
// GET STOCK CARD WITH SQL OPTIMIZATION - WITH UOM FILTER
// ================================================================

const getStockCardOptimized = async (req, res) => {
  try {
    const { itemId } = req.params;
    const {
      storeId,
      groupId,
      startDate,
      endDate,
      limit = 100,
      // ✅ ADD UOM FILTER PARAMETER
      isBaseUom,
    } = req.query;

    if (!storeId || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'storeId and groupId are required',
      });
    }

    const item = await Item.findByPk(itemId, {
      include: [
        { model: UOM, as: 'uom', attributes: ['id', 'code', 'name'] },
        { model: UOM, as: 'conversionUom', attributes: ['id', 'code', 'name'] },
        { model: Category, as: 'category', attributes: ['categoryId', 'name'] },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }

    const unitCost = parseFloat(item.costPrice || 0);

    // GET CURRENT BALANCE
    const balanceWhere = {
      itemId: parseInt(itemId),
      storeId: parseInt(storeId),
      groupId: parseInt(groupId),
    };

    const currentBalanceRecord = await StoreBalance.findOne({
      where: balanceWhere,
      attributes: ['balance', 'minStockAlert', 'status', 'storeId', 'groupId'],
      include: [
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
    });

    const currentBalance = currentBalanceRecord
      ? parseFloat(currentBalanceRecord.balance || 0)
      : 0;

    // ============================================================
    // SQL QUERY WITH UOM FILTER
    // ============================================================

    let query = `
      SELECT 
        sbh.id,
        sbh.created_at,
        sbh.transaction_type,
        sbh.change_amount,
        sbh.previous_balance,
        sbh.new_balance,
        sbh.grn_number,
        sbh.siv_number,
        sbh.remark,
        sbh.reference_type,
        sbh.store_id,
        sbh.group_id,
        sbh.uom_used,
        sbh.is_base_uom,
        s.name AS store_name,
        s.code AS store_code,
        g.name AS group_name,
        g.code AS group_code,
        u.full_name AS updated_by,
        SUM(
          CASE 
            WHEN sbh.transaction_type = 'Stock In' THEN sbh.change_amount
            WHEN sbh.transaction_type = 'Stock Out' THEN -sbh.change_amount
            ELSE 0
          END
        ) OVER (ORDER BY sbh.created_at ASC, sbh.id ASC) AS running_quantity_balance
      FROM store_balance_histories sbh
      LEFT JOIN stores s ON sbh.store_id = s.id
      LEFT JOIN groups g ON sbh.group_id = g.id
      LEFT JOIN users u ON sbh.changed_by = u.user_id
      WHERE sbh.item_id = :itemId
        AND sbh.store_id = :storeId
        AND sbh.group_id = :groupId
        AND sbh.transaction_type IN ('Stock In', 'Stock Out')
    `;

    // ✅ ADD UOM FILTER
    if (isBaseUom === 'true' || isBaseUom === true) {
      query += ` AND sbh.is_base_uom = true`;
    } else if (isBaseUom === 'false' || isBaseUom === false) {
      query += ` AND sbh.is_base_uom = false`;
    }

    const replacements = {
      itemId: parseInt(itemId),
      storeId: parseInt(storeId),
      groupId: parseInt(groupId),
      limit: parseInt(limit),
      unitCost: unitCost,
    };

    if (startDate) {
      query += ` AND sbh.created_at >= :startDate`;
      replacements.startDate = new Date(startDate);
    }
    if (endDate) {
      query += ` AND sbh.created_at <= :endDate`;
      replacements.endDate = new Date(endDate + 'T23:59:59');
    }

    query += `
      ORDER BY sbh.created_at ASC, sbh.id ASC
      LIMIT :limit
    `;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    // Format rows...
    let totalQuantityIn = 0;
    let totalQuantityOut = 0;

    const formattedRows = results.map((row) => {
      const isStockIn = row.transaction_type === 'Stock In';
      const quantity = parseFloat(row.change_amount || 0);
      const runningQuantity = parseFloat(row.running_quantity_balance || 0);
      const runningCost = runningQuantity * unitCost;

      if (isStockIn) {
        totalQuantityIn += quantity;
      } else {
        totalQuantityOut += quantity;
      }

      let particulars = '';
      if (row.remark) {
        const reqMatch = row.remark.match(/REQ-\d{6}-\d{3}/);
        if (reqMatch) {
          particulars = reqMatch[0];
        } else {
          const grnMatch = row.remark.match(/GRN-\d{4}-\d{3}/);
          if (grnMatch) {
            particulars = grnMatch[0];
          } else {
            const sivMatch = row.remark.match(/SIV-\d{4}-\d{3}/);
            if (sivMatch) {
              particulars = sivMatch[0];
            } else {
              particulars = row.remark.substring(0, 40) + (row.remark.length > 40 ? '...' : '');
            }
          }
        }
      } else if (row.reference_type) {
        const refLabels = {
          purchase: 'Purchase',
          transfer: 'Transfer',
          adjustment: 'Adjustment',
          return: 'Return',
          sale: 'Sale',
          initialization: 'Initial Stock',
          request: 'Request',
        };
        particulars = refLabels[row.reference_type] || row.reference_type;
      }

      return {
        date: row.created_at
          ? new Date(row.created_at).toLocaleDateString('en-GB')
          : '',
        grn: row.grn_number || '',
        siv: row.siv_number || '',
        particulars: particulars || '',
        quantityIn: isStockIn ? quantity : 0,
        quantityOut: isStockIn ? 0 : quantity,
        unitCost: unitCost,
        runningQuantityBalance: runningQuantity,
        runningCostBalance: runningCost,
        previousBalance: parseFloat(row.previous_balance || 0),
        newBalance: parseFloat(row.new_balance || 0),
        storeName: row.store_name,
        groupName: row.group_name,
        updatedBy: row.updated_by,
        transactionType: row.transaction_type,
        referenceType: row.reference_type,
        // ✅ ADD UOM FIELDS
        uomUsed: row.uom_used || item.uom?.code || 'PCS',
        isBaseUom: row.is_base_uom !== false,
        _raw: {
          id: row.id,
          referenceId: row.reference_id,
        },
      };
    });

    const displayUom = isBaseUom === 'false' 
      ? (item.conversionUom?.code || item.uom?.code || 'PCS')
      : (item.uom?.code || 'PCS');

    res.status(200).json({
      success: true,
      data: {
        form: {
          maximumStockLevel: '',
          merchandise: item.name || item.standardName || '',
          unitOfMeasurement: displayUom,
          codeNo: item.code || '',
        },
        rows: formattedRows,
        currentBalance: currentBalance,
        currentBalanceContext: currentBalanceRecord
          ? {
              balance: currentBalance,
              minStockAlert: parseFloat(currentBalanceRecord.minStockAlert || 0),
              status: currentBalanceRecord.status,
              store: currentBalanceRecord.store
                ? {
                    id: currentBalanceRecord.store.id,
                    name: currentBalanceRecord.store.name,
                    code: currentBalanceRecord.store.code,
                  }
                : null,
              group: currentBalanceRecord.group
                ? {
                    id: currentBalanceRecord.group.id,
                    name: currentBalanceRecord.group.name,
                    code: currentBalanceRecord.group.code,
                  }
                : null,
            }
          : null,
        item: {
          id: item.itemId,
          code: item.code,
          name: item.name,
          standardName: item.standardName,
          uomCode: item.uom?.code,
          uomName: item.uom?.name,
          conversionUomCode: item.conversionUom?.code,
          conversionUomName: item.conversionUom?.name,
          categoryName: item.category?.name,
          costPrice: unitCost,
        },
        summary: {
          totalTransactions: results.length,
          totalQuantityIn: totalQuantityIn,
          totalQuantityOut: totalQuantityOut,
          totalCostIn: totalQuantityIn * unitCost,
          totalCostOut: totalQuantityOut * unitCost,
          currentBalance: currentBalance,
          currentCostBalance: currentBalance * unitCost,
          unitCost: unitCost,
        },
        filters: {
          storeId: storeId || null,
          groupId: groupId || null,
          startDate: startDate || null,
          endDate: endDate || null,
          limit: parseInt(limit),
          isBaseUom: isBaseUom !== undefined ? isBaseUom : null,
        },
      },
    });
  } catch (error) {
    console.error('❌ Get optimized stock card error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================================================
// GET STOCK CARD SUMMARY
// ================================================================

const getStockCardSummary = async (req, res) => {
  try {
    const { storeId, groupId, categoryId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
    }

    const whereClause = { 
      status: 'Active',
      storeId: parseInt(storeId),
    };
    
    if (groupId) {
      whereClause.groupId = parseInt(groupId);
    }

    const itemInclude = {
      model: Item,
      as: 'item',
      include: [
        { model: UOM, as: 'uom', attributes: ['id', 'code', 'name'] },
        { model: UOM, as: 'conversionUom', attributes: ['id', 'code', 'name'] },
        { model: Category, as: 'category', attributes: ['categoryId', 'name'] },
      ],
    };

    if (categoryId) {
      itemInclude.where = { categoryId: parseInt(categoryId) };
    }

    const balances = await StoreBalance.findAll({
      where: whereClause,
      include: [
        itemInclude,
        { model: Store, as: 'store', attributes: ['id', 'name', 'code'] },
        { model: Group, as: 'group', attributes: ['id', 'name', 'code'] },
      ],
      order: [[{ model: Item, as: 'item' }, 'name', 'ASC']],
    });

    const summary = balances.map((balance) => {
      const item = balance.item;
      const currentBalance = parseFloat(balance.balance || 0);
      const minStockAlert = parseFloat(balance.minStockAlert || 0);
      const unitCost = parseFloat(item?.costPrice || 0);

      return {
        itemId: balance.itemId,
        itemCode: item?.code || 'N/A',
        itemName: item?.name || item?.standardName || 'Unnamed',
        uomCode: item?.uom?.code || 'PCS',
        conversionUomCode: item?.conversionUom?.code || null,
        categoryName: item?.category?.name || 'Uncategorized',
        storeName: balance.store?.name || 'Unknown',
        storeCode: balance.store?.code || '',
        groupName: balance.group?.name || 'Unknown',
        groupCode: balance.group?.code || '',
        currentBalance: currentBalance,
        currentCostBalance: currentBalance * unitCost,
        minStockAlert: minStockAlert,
        unitCost: unitCost,
        status: balance.status,
        isLowStock: currentBalance <= minStockAlert && currentBalance > 0,
        isZero: currentBalance === 0,
        isOverstock: minStockAlert > 0 && currentBalance > minStockAlert * 3,
        lastUpdated: balance.updatedAt,
      };
    });

    const totalItems = summary.length;
    const lowStockItems = summary.filter((s) => s.isLowStock).length;
    const zeroStockItems = summary.filter((s) => s.isZero).length;
    const overstockItems = summary.filter((s) => s.isOverstock).length;

    res.status(200).json({
      success: true,
      data: {
        items: summary,
        stats: {
          totalItems,
          lowStockItems,
          zeroStockItems,
          overstockItems,
          healthyItems: totalItems - lowStockItems - zeroStockItems - overstockItems,
          totalValue: summary.reduce((sum, s) => sum + s.currentCostBalance, 0),
        },
      },
    });
  } catch (error) {
    console.error('❌ Get stock card summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT ALL
// ================================================================

module.exports = {
  getStockCard,
  getStockCardOptimized,
  getStockCardSummary,
};