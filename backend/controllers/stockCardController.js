// controllers/stockCardController.js - FIXED to use newBalance + SHORT PARTICULARS

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

/**
 * Build short particulars from transaction remark or reference type
 * Extracts REQ, GRN, or SIV codes from the remark
 */
function buildParticulars(tx) {
  // 1. If there's a remark, extract just the request code
  if (tx.remark) {
    // Try to extract REQ-XXXXXX-XXX pattern
    const reqMatch = tx.remark.match(/REQ-\d{6}-\d{3}/);
    if (reqMatch) {
      return reqMatch[0]; // Just the request code
    }
    
    // Try to extract GRN pattern
    const grnMatch = tx.remark.match(/GRN-\d{4}-\d{3}/);
    if (grnMatch) {
      return grnMatch[0];
    }
    
    // Try to extract SIV pattern
    const sivMatch = tx.remark.match(/SIV-\d{4}-\d{3}/);
    if (sivMatch) {
      return sivMatch[0];
    }
    
    // If no pattern found, use first 40 characters
    return tx.remark.substring(0, 40) + (tx.remark.length > 40 ? '...' : '');
  }
  
  // 2. If no remark, use reference type
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
    
    // For transfers, show source → destination
    if (tx.referenceType === 'transfer' && tx.sourceStore && tx.destinationStore) {
      return `Transfer: ${tx.sourceStore.name} → ${tx.destinationStore.name}`;
    }
    
    return refLabels[tx.referenceType] || tx.referenceType;
  }
  
  return '';
}

// ================================================================
// GET STOCK CARD
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
    } = req.query;

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
    // 2. GET ITEM WITH UNIT COST
    // ============================================================

    const item = await Item.findByPk(itemId, {
      include: [
        {
          model: UOM,
          as: 'uom',
          attributes: ['id', 'code', 'name'],
        },
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name'],
        },
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
    // 3. ✅ GET CURRENT BALANCE FROM STORE_BALANCE TABLE
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
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    const currentBalance = currentBalanceRecord
      ? parseFloat(currentBalanceRecord.balance || 0)
      : 0;

    // ============================================================
    // 4. BUILD TRANSACTION QUERY
    // ============================================================

    const whereClause = {
      itemId: parseInt(itemId),
      storeId: parseInt(storeId),
      groupId: parseInt(groupId),
      transactionType: {
        [Op.in]: ['Stock In', 'Stock Out'],
      },
    };

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

    // ============================================================
    // 5. FETCH TRANSACTIONS
    // ============================================================

    const transactions = await StoreBalanceHistory.findAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Group,
          as: 'group',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Store,
          as: 'sourceStore',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Store,
          as: 'destinationStore',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: User,
          as: 'changedByUser',
          attributes: ['userId', 'username', 'fullName'],
        },
      ],
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit: parseInt(limit),
    });

    // ============================================================
    // 6. FORMAT ROWS - USE newBalance AS THE BALANCE
    // ============================================================

    let totalQuantityIn = 0;
    let totalQuantityOut = 0;
    let totalCostIn = 0;
    let totalCostOut = 0;

    const formattedRows = transactions.map((tx) => {
      const isStockIn = tx.transactionType === 'Stock In';
      const quantity = parseFloat(tx.changeAmount || 0);
      
      // ✅ Use newBalance from history as the running balance
      const runningQuantityBalance = parseFloat(tx.newBalance || 0);
      const runningCostBalance = runningQuantityBalance * unitCost;

      // Update totals
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

      // ✅ USE THE buildParticulars FUNCTION - SHORT VERSION
      const particulars = buildParticulars(tx);

      return {
        date,
        grn: tx.grnNumber || '',
        siv: tx.sivNumber || '',
        particulars: particulars,
        quantityIn: isStockIn ? quantity : 0,
        quantityOut: isStockIn ? 0 : quantity,
        unitCost: unitCost,
        // ✅ BALANCE = newBalance from history (this is the running balance)
        runningQuantityBalance: runningQuantityBalance,
        runningCostBalance: runningCostBalance,
        previousBalance: parseFloat(tx.previousBalance || 0),
        newBalance: parseFloat(tx.newBalance || 0),
        transactionType: tx.transactionType,
        referenceType: tx.referenceType,
        storeName: tx.store?.name,
        groupName: tx.group?.name,
        updatedBy: tx.changedByUser?.fullName || tx.changedByUser?.username,
        _raw: {
          id: tx.id,
          balanceId: tx.balanceId,
          referenceId: tx.referenceId,
        },
      };
    });

    // ============================================================
    // 7. BUILD RESPONSE
    // ============================================================

    const response = {
      success: true,
      data: {
        form: {
          maximumStockLevel: '',
          merchandise: item.name || item.standardName || '',
          unitOfMeasurement: item.uom?.code || '',
          codeNo: item.code || '',
        },

        rows: formattedRows.length > 0 ? formattedRows : [
          {
            date: '',
            grn: '',
            siv: '',
            particulars: `No transactions found for ${item.code}`,
            quantityIn: 0,
            quantityOut: 0,
            unitCost: unitCost,
            runningQuantityBalance: currentBalance,
            runningCostBalance: currentBalance * unitCost,
            previousBalance: 0,
            newBalance: currentBalance,
            transactionType: null,
            referenceType: null,
            storeName: currentBalanceRecord?.store?.name || null,
            groupName: currentBalanceRecord?.group?.name || null,
            updatedBy: null,
            _raw: null,
          },
        ],

        // ✅ CURRENT BALANCE from StoreBalance table
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
// GET STOCK CARD WITH SQL OPTIMIZATION
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

    // ✅ GET CURRENT BALANCE FROM STORE_BALANCE TABLE
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
    // SQL QUERY - Use newBalance directly
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
        s.name AS store_name,
        s.code AS store_code,
        g.name AS group_name,
        g.code AS group_code,
        u.full_name AS updated_by,
        -- ✅ Use newBalance as the running balance
        sbh.new_balance AS running_quantity_balance,
        sbh.new_balance * :unitCost AS running_cost_balance
      FROM store_balance_histories sbh
      LEFT JOIN stores s ON sbh.store_id = s.id
      LEFT JOIN groups g ON sbh.group_id = g.id
      LEFT JOIN users u ON sbh.changed_by = u.user_id
      WHERE sbh.item_id = :itemId
        AND sbh.store_id = :storeId
        AND sbh.group_id = :groupId
        AND sbh.transaction_type IN ('Stock In', 'Stock Out')
    `;

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

    // ============================================================
    // FORMAT ROWS
    // ============================================================

    let totalQuantityIn = 0;
    let totalQuantityOut = 0;

    const formattedRows = results.map((row) => {
      const isStockIn = row.transaction_type === 'Stock In';
      const quantity = parseFloat(row.change_amount || 0);
      const runningQuantity = parseFloat(row.running_quantity_balance || 0);
      const runningCost = parseFloat(row.running_cost_balance || 0);

      if (isStockIn) {
        totalQuantityIn += quantity;
      } else {
        totalQuantityOut += quantity;
      }

      // ✅ USE THE buildParticulars FUNCTION - SHORT VERSION
      // We need to create a tx object for the helper
      const tx = {
        remark: row.remark,
        referenceType: row.reference_type,
        sourceStore: row.sourceStore ? { name: row.sourceStore.name } : null,
        destinationStore: row.destinationStore ? { name: row.destinationStore.name } : null,
      };
      
      // Since we don't have sourceStore/destinationStore objects in SQL result,
      // we need to handle transfers differently
      let particulars = '';
      if (row.remark) {
        // Extract REQ, GRN, or SIV from remark
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
        // ✅ BALANCE = newBalance from history
        runningQuantityBalance: runningQuantity,
        runningCostBalance: runningCost,
        previousBalance: parseFloat(row.previous_balance || 0),
        newBalance: parseFloat(row.new_balance || 0),
        storeName: row.store_name,
        groupName: row.group_name,
        updatedBy: row.updated_by,
        transactionType: row.transaction_type,
        referenceType: row.reference_type,
        _raw: {
          id: row.id,
          referenceId: row.reference_id,
        },
      };
    });

    // ============================================================
    // BUILD RESPONSE
    // ============================================================

    res.status(200).json({
      success: true,
      data: {
        form: {
          maximumStockLevel: '',
          merchandise: item.name || item.standardName || '',
          unitOfMeasurement: item.uom?.code || '',
          codeNo: item.code || '',
        },
        rows: formattedRows.length > 0 ? formattedRows : [
          {
            date: '',
            grn: '',
            siv: '',
            particulars: `No transactions found for ${item.code}`,
            quantityIn: 0,
            quantityOut: 0,
            unitCost: unitCost,
            runningQuantityBalance: currentBalance,
            runningCostBalance: currentBalance * unitCost,
            previousBalance: 0,
            newBalance: currentBalance,
            storeName: currentBalanceRecord?.store?.name || null,
            groupName: currentBalanceRecord?.group?.name || null,
            updatedBy: null,
            transactionType: null,
            referenceType: null,
            _raw: null,
          },
        ],
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