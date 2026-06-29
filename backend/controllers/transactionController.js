// controllers/transactionController.js - FIXED

'use strict';

const { Op } = require('sequelize');
const { Parser } = require('json2csv');

const {
  StoreBalanceHistory,
  Store,
  Group,
  Item,
  UOM,
  User,
  sequelize,
} = require('../models');

// ================================================================
// HELPER FUNCTIONS
// ================================================================

const formatTransactionResponse = (record) => {
  const item = record.item;
  return {
    id: record.id,
    balanceId: record.balanceId,
    storeId: record.storeId,
    storeName: record.store?.name || null,
    storeCode: record.store?.code || null,
    groupId: record.groupId,
    groupName: record.group?.name || null,
    groupCode: record.group?.code || null,
    itemId: record.itemId,
    itemCode: item?.code || null,
    itemName: item?.standardName || item?.name || null,
    itemCommonName: item?.standardName || item?.name || null, // Use standardName as fallback
    uomCode: item?.uom?.code || null,
    uomName: item?.uom?.name || null,
    type: record.transactionType,
    quantity: parseFloat(record.changeAmount),
    previousBalance: parseFloat(record.previousBalance),
    newBalance: parseFloat(record.newBalance),
    sourceStoreId: record.sourceStoreId,
    sourceStore: record.sourceStore?.name || null,
    destinationStoreId: record.destinationStoreId,
    destinationStore: record.destinationStore?.name || null,
    referenceType: record.referenceType,
    referenceId: record.referenceId,
    updatedBy: record.changedByUser?.fullName || record.changedByUser?.username || null,
    remark: record.remark,
    createdAt: record.createdAt,
  };
};

// ================================================================
// GET TRANSACTIONS WITH FILTERS
// ================================================================
exports.getTransactions = async (req, res) => {
  try {
    const {
      storeId,
      groupId,
      itemId,
      transactionType,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const whereClause = {};
    const include = [
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
        model: Item,
        as: 'item',
        attributes: ['id', 'code', 'name', 'standardName'], // REMOVED commonName
        include: [
          {
            model: UOM,
            as: 'uom',
            attributes: ['id', 'code', 'name'],
          },
        ],
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
    ];

    // Apply filters
    if (storeId) {
      whereClause.storeId = parseInt(storeId);
    }
    if (groupId) {
      whereClause.groupId = parseInt(groupId);
    }
    if (itemId) {
      whereClause.itemId = parseInt(itemId);
    }
    if (transactionType) {
      whereClause.transactionType = transactionType;
    }

    // Date range filter
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

    // Search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [{ remark: { [Op.iLike]: searchTerm } }];

      // Add search on item
      include.push({
        model: Item,
        as: 'item',
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: searchTerm } },
            { code: { [Op.iLike]: searchTerm } },
            { standardName: { [Op.iLike]: searchTerm } },
          ],
        },
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await StoreBalanceHistory.findAndCountAll({
      where: whereClause,
      include: include,
      distinct: true,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    const formattedTransactions = rows.map(formatTransactionResponse);

    res.status(200).json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// GET TRANSACTION STATISTICS
// ================================================================
exports.getTransactionStats = async (req, res) => {
  try {
    const { storeId, groupId, itemId, startDate, endDate } = req.query;

    const whereClause = {};

    if (storeId) whereClause.storeId = parseInt(storeId);
    if (groupId) whereClause.groupId = parseInt(groupId);
    if (itemId) whereClause.itemId = parseInt(itemId);

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

    // Get stock in count and total
    const stockInRecords = await StoreBalanceHistory.findAll({
      where: {
        ...whereClause,
        transactionType: 'Stock In',
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('change_amount')), 'totalQuantity'],
      ],
      raw: true,
    });

    // Get stock out count and total
    const stockOutRecords = await StoreBalanceHistory.findAll({
      where: {
        ...whereClause,
        transactionType: 'Stock Out',
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('change_amount')), 'totalQuantity'],
      ],
      raw: true,
    });

    // Get total transactions
    const totalTransactions = await StoreBalanceHistory.count({
      where: whereClause,
    });

    res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        stockIn: {
          count: parseInt(stockInRecords[0]?.count || 0),
          totalQuantity: parseFloat(stockInRecords[0]?.totalQuantity || 0),
        },
        stockOut: {
          count: parseInt(stockOutRecords[0]?.count || 0),
          totalQuantity: parseFloat(stockOutRecords[0]?.totalQuantity || 0),
        },
      },
    });
  } catch (error) {
    console.error('❌ Get transaction stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// GET TRANSACTION BY ID
// ================================================================
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await StoreBalanceHistory.findByPk(id, {
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
          model: Item,
          as: 'item',
          attributes: ['id', 'code', 'name', 'standardName'], // REMOVED commonName
          include: [
            {
              model: UOM,
              as: 'uom',
              attributes: ['id', 'code', 'name'],
            },
          ],
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
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    const formattedTransaction = formatTransactionResponse(transaction);

    res.status(200).json({
      success: true,
      data: formattedTransaction,
    });
  } catch (error) {
    console.error('❌ Get transaction by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// GET TRANSACTIONS BY BALANCE ID
// ================================================================
exports.getTransactionsByBalance = async (req, res) => {
  try {
    const { balanceId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await StoreBalanceHistory.findAndCountAll({
      where: { balanceId: parseInt(balanceId) },
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
          model: Item,
          as: 'item',
          attributes: ['id', 'code', 'name', 'standardName'], // REMOVED commonName
          include: [
            {
              model: UOM,
              as: 'uom',
              attributes: ['id', 'code', 'name'],
            },
          ],
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
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    const formattedTransactions = rows.map(formatTransactionResponse);

    res.status(200).json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Get transactions by balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// EXPORT TRANSACTIONS AS CSV
// ================================================================
exports.exportTransactions = async (req, res) => {
  try {
    const {
      storeId,
      groupId,
      itemId,
      transactionType,
      startDate,
      endDate,
      search,
      type = 'full',
    } = req.query;

    const whereClause = {};
    const include = [
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
        model: Item,
        as: 'item',
        attributes: ['id', 'code', 'name', 'standardName'], // REMOVED commonName
        include: [
          {
            model: UOM,
            as: 'uom',
            attributes: ['id', 'code', 'name'],
          },
        ],
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
    ];

    // Apply filters
    if (storeId) whereClause.storeId = parseInt(storeId);
    if (groupId) whereClause.groupId = parseInt(groupId);
    if (itemId) whereClause.itemId = parseInt(itemId);
    if (transactionType) whereClause.transactionType = transactionType;

    if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(endDate + 'T23:59:59'),
      };
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [{ remark: { [Op.iLike]: searchTerm } }];
      include.push({
        model: Item,
        as: 'item',
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: searchTerm } },
            { code: { [Op.iLike]: searchTerm } },
            { standardName: { [Op.iLike]: searchTerm } },
          ],
        },
      });
    }

    const transactions = await StoreBalanceHistory.findAll({
      where: whereClause,
      include: include,
      order: [['createdAt', 'DESC']],
    });

    let headers, rows;

    if (type === 'full') {
      headers = [
        '#',
        'Date & Time',
        'Store',
        'Group',
        'Type',
        'Item Code',
        'Item Name',
        'UOM',
        'Quantity',
        'Previous Balance',
        'New Balance',
        'From / To',
        'Updated By',
        'Remark',
      ];

      rows = transactions.map((t, index) => {
        const formatted = formatTransactionResponse(t);
        return [
          index + 1,
          formatted.createdAt ? new Date(formatted.createdAt).toLocaleString() : '',
          formatted.storeName || '',
          formatted.groupName || '',
          formatted.type || '',
          formatted.itemCode || '',
          formatted.itemName || '',
          formatted.uomCode || '',
          formatted.type === 'Stock In' ? `+${formatted.quantity}` : `-${formatted.quantity}`,
          formatted.previousBalance || 0,
          formatted.newBalance || 0,
          formatted.type === 'Stock In' ? formatted.sourceStore || '' : formatted.destinationStore || '',
          formatted.updatedBy || 'System',
          formatted.remark || '',
        ];
      });
    } else {
      // Summary by store
      const storeSummary = {};
      transactions.forEach((t) => {
        const key = t.storeId;
        if (!storeSummary[key]) {
          storeSummary[key] = {
            storeName: t.store?.name || 'Unknown',
            stockIn: 0,
            stockOut: 0,
          };
        }
        if (t.transactionType === 'Stock In') {
          storeSummary[key].stockIn += parseFloat(t.changeAmount || 0);
        } else {
          storeSummary[key].stockOut += parseFloat(t.changeAmount || 0);
        }
      });

      headers = ['Store Name', 'Total Stock In', 'Total Stock Out'];
      rows = Object.values(storeSummary).map((summary) => [
        summary.storeName,
        summary.stockIn,
        summary.stockOut,
      ]);
    }

    const parser = new Parser({ fields: headers });
    const csv = parser.parse(rows);
    const csvWithBOM = '\uFEFF' + csv;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=store_transactions_${new Date().toISOString().split('T')[0]}.csv`
    );
    res.send(csvWithBOM);
  } catch (error) {
    console.error('❌ Export transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// GET RECENT TRANSACTIONS (Dashboard)
// ================================================================
exports.getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const transactions = await StoreBalanceHistory.findAll({
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
          model: Item,
          as: 'item',
          attributes: ['id', 'code', 'name', 'standardName'], // REMOVED commonName
          include: [
            {
              model: UOM,
              as: 'uom',
              attributes: ['id', 'code', 'name'],
            },
          ],
        },
        {
          model: User,
          as: 'changedByUser',
          attributes: ['userId', 'username', 'fullName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    const formattedTransactions = transactions.map(formatTransactionResponse);

    res.status(200).json({
      success: true,
      data: formattedTransactions,
    });
  } catch (error) {
    console.error('❌ Get recent transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};