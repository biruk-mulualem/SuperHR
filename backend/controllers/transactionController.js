// controllers/transactionController.js - COMPLETE WITH CATEGORY SUPPORT

'use strict';

const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const {
  StoreBalanceHistory,
  Store,
  Group,
  Item,
  Category,
  UOM,
  User,
  sequelize,
} = require('../models');

// ================================================================
// HELPER FUNCTIONS
// ================================================================

// controllers/transactionController.js - UPDATED formatTransactionResponse

// ================================================================
// HELPER FUNCTIONS
// ================================================================

const formatTransactionResponse = (record) => {
  const item = record.item;
  const category = item?.category;
  const uom = item?.uom;
  
  // Get name values
  const itemName = item?.name || null;
  const standardName = item?.standardName || null;

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
    // ✅ ONLY TWO NAME FIELDS
    itemStandardName: standardName,  // Can be null
    itemCommonName: itemName || standardName || null,  // Uses name as primary
    // ✅ CATEGORY FIELDS
    categoryId: category?.categoryId || null,
    categoryName: category?.name || null,
    // ✅ UOM FIELDS
    uomCode: uom?.code || null,
    uomName: uom?.name || null,
    type: record.transactionType,
    quantity: parseFloat(record.changeAmount || 0),
    previousBalance: parseFloat(record.previousBalance || 0),
    newBalance: parseFloat(record.newBalance || 0),
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
      categoryId,  // ✅ ADD CATEGORY FILTER
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
        attributes: ['id', 'code', 'name', 'standardName', 'categoryId'],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['categoryId', 'name', 'status'],
          },
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

    // ✅ CATEGORY FILTER
    if (categoryId) {
      include.push({
        model: Item,
        as: 'item',
        where: { categoryId: parseInt(categoryId) },
        required: true,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['categoryId', 'name', 'status'],
          },
          {
            model: UOM,
            as: 'uom',
            attributes: ['id', 'code', 'name'],
          },
        ],
      });
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
      whereClause[Op.or] = [
        { '$item.name$': { [Op.iLike]: searchTerm } },
        { '$item.code$': { [Op.iLike]: searchTerm } },
        { '$item.standard_name$': { [Op.iLike]: searchTerm } },
        { '$item.category.name$': { [Op.iLike]: searchTerm } },
        { '$store.name$': { [Op.iLike]: searchTerm } },
        { remark: { [Op.iLike]: searchTerm } },
      ];
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
    const { storeId, groupId, categoryId, itemId, startDate, endDate } = req.query;

    const whereClause = {};

    if (storeId) whereClause.storeId = parseInt(storeId);
    if (groupId) whereClause.groupId = parseInt(groupId);
    if (itemId) whereClause.itemId = parseInt(itemId);

    // ✅ CATEGORY FILTER
    let itemIds = null;
    if (categoryId) {
      const items = await Item.findAll({
        where: { categoryId: parseInt(categoryId) },
        attributes: ['itemId']
      });
      itemIds = items.map(i => i.itemId);
      if (itemIds.length > 0) {
        whereClause.itemId = { [Op.in]: itemIds };
      } else {
        return res.status(200).json({
          success: true,
          data: {
            totalTransactions: 0,
            stockIn: { count: 0, totalQuantity: 0 },
            stockOut: { count: 0, totalQuantity: 0 }
          }
        });
      }
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
          attributes: ['id', 'code', 'name', 'standardName', 'categoryId'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['categoryId', 'name', 'status'],
            },
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
          attributes: ['id', 'code', 'name', 'standardName', 'categoryId'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['categoryId', 'name', 'status'],
            },
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


// ================================================================
// EXPORT TRANSACTIONS AS EXCEL (.xlsx) - FIXED SUMMARY
// ================================================================
exports.exportTransactions = async (req, res) => {
  try {
    const {
      storeId,
      groupId,
      categoryId,
      itemId,
      transactionType,
      startDate,
      endDate,
      search,
    } = req.query;

    console.log('📊 Exporting Transactions Excel - storeId:', storeId, 'groupId:', groupId);

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
        attributes: ['id', 'code', 'name', 'standardName', 'categoryId'],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['categoryId', 'name'],
          },
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
    ];

    // Apply filters
    if (storeId) whereClause.storeId = parseInt(storeId);
    if (groupId) whereClause.groupId = parseInt(groupId);
    if (itemId) whereClause.itemId = parseInt(itemId);
    if (transactionType) whereClause.transactionType = transactionType;

    // Category filter
    if (categoryId) {
      include.push({
        model: Item,
        as: 'item',
        where: { categoryId: parseInt(categoryId) },
        required: true,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['categoryId', 'name'],
          },
          {
            model: UOM,
            as: 'uom',
            attributes: ['id', 'code', 'name'],
          },
        ],
      });
    }

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
      whereClause[Op.or] = [
        { '$item.name$': { [Op.iLike]: searchTerm } },
        { '$item.code$': { [Op.iLike]: searchTerm } },
        { '$item.standard_name$': { [Op.iLike]: searchTerm } },
        { '$item.category.name$': { [Op.iLike]: searchTerm } },
        { '$store.name$': { [Op.iLike]: searchTerm } },
        { remark: { [Op.iLike]: searchTerm } },
      ];
    }

    const transactions = await StoreBalanceHistory.findAll({
      where: whereClause,
      include: include,
      order: [['createdAt', 'DESC']],
    });

    console.log(`✅ Found ${transactions.length} transactions`);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Super Double "T" General Trading PLC';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Transactions');

    let currentRow = 1;

    // ============================================================
    // HEADER SECTION
    // ============================================================

    // Row 1: Company Name
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const companyCell = sheet.getCell(`A${currentRow}`);
    companyCell.value = 'SUPER DOUBLE "T" GENERAL TRADING PLC';
    companyCell.font = { bold: true, size: 18, color: { argb: 'FF1A56DB' } };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 35;
    currentRow++;

    // Row 2: Slogan
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const sloganCell = sheet.getCell(`A${currentRow}`);
    sloganCell.value = 'WE TRUST IN GOD!!!  እግዚአብሔር ይባረክ!!!';
    sloganCell.font = { bold: true, size: 12, color: { argb: 'FF4B5563' } };
    sloganCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 25;
    currentRow++;

    // Row 3: Empty row
    currentRow++;

    // Row 4: Report Title
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = 'STORE TRANSACTIONS REPORT';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1A56DB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 30;
    currentRow++;

    // Row 5: Empty row
    currentRow++;

    // Row 6-8: Filter Info
    const now = new Date();
    const dateTimeStr = now.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const userName = req.user?.fullName || req.user?.username || 'Admin';

    // Get filter info
    const storeName = transactions.length > 0 ? transactions[0].store?.name || 'All Stores' : 'All Stores';
    const groupName = transactions.length > 0 ? transactions[0].group?.name || 'All Groups' : 'All Groups';
    const categoryName = transactions.length > 0 && transactions[0].item?.category ? transactions[0].item.category.name : 'All Categories';

    const filterRow1 = sheet.getRow(currentRow);
    filterRow1.getCell(1).value = 'Store:';
    filterRow1.getCell(1).font = { bold: true };
    filterRow1.getCell(2).value = storeName;
    filterRow1.getCell(4).value = 'Group:';
    filterRow1.getCell(4).font = { bold: true };
    filterRow1.getCell(5).value = groupName;
    currentRow++;

    const filterRow2 = sheet.getRow(currentRow);
    filterRow2.getCell(1).value = 'Category:';
    filterRow2.getCell(1).font = { bold: true };
    filterRow2.getCell(2).value = categoryName;
    filterRow2.getCell(4).value = 'Type:';
    filterRow2.getCell(4).font = { bold: true };
    filterRow2.getCell(5).value = transactionType || 'All';
    currentRow++;

    const generatedRow = sheet.getRow(currentRow);
    generatedRow.getCell(1).value = 'Generated By:';
    generatedRow.getCell(1).font = { bold: true };
    generatedRow.getCell(2).value = userName;
    generatedRow.getCell(4).value = 'Date/Time:';
    generatedRow.getCell(4).font = { bold: true };
    generatedRow.getCell(5).value = dateTimeStr;
    currentRow++;

    // Empty row
    currentRow++;

    // ============================================================
    // SUMMARY SECTION - COUNT ONLY
    // ============================================================

    // Calculate totals - COUNT of transactions, not quantity values
    let totalStockInCount = 0;
    let totalStockOutCount = 0;

    transactions.forEach(t => {
      if (t.transactionType === 'Stock In') {
        totalStockInCount++;
      } else if (t.transactionType === 'Stock Out') {
        totalStockOutCount++;
      }
    });

    // Summary Title
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const summaryTitleCell = sheet.getCell(`A${currentRow}`);
    summaryTitleCell.value = 'SUMMARY';
    summaryTitleCell.font = { bold: true, size: 14, color: { argb: 'FF1A56DB' } };
    sheet.getRow(currentRow).height = 25;
    currentRow++;

    const summaryData = [
      ['Total Transactions:', transactions.length, 'Stock In Count:', totalStockInCount],
      ['', '', 'Stock Out Count:', totalStockOutCount]
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

    // Empty rows before table
    currentRow++;
    currentRow++;

    // ============================================================
    // DATA TABLE SECTION
    // ============================================================

    // Table Header
    const headerRow = sheet.getRow(currentRow);
    const headers = ['#', 'Item Code', 'Item Name', 'Category', 'UOM', 'Type', 'Quantity', 'Date & Time'];
    headers.forEach((header, index) => {
      const col = index + 1;
      headerRow.getCell(col).value = header;
      headerRow.getCell(col).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A56DB' }
      };
      headerRow.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.getCell(col).border = {
        top: { style: 'thin', color: { argb: 'FF1A56DB' } },
        bottom: { style: 'thin', color: { argb: 'FF1A56DB' } },
        left: { style: 'thin', color: { argb: 'FF1A56DB' } },
        right: { style: 'thin', color: { argb: 'FF1A56DB' } }
      };
    });
    sheet.getRow(currentRow).height = 25;
    currentRow++;

    // Set column widths
    sheet.getColumn(1).width = 8;    // #
    sheet.getColumn(2).width = 18;   // Item Code
    sheet.getColumn(3).width = 45;   // Item Name
    sheet.getColumn(4).width = 25;   // Category
    sheet.getColumn(5).width = 12;   // UOM
    sheet.getColumn(6).width = 14;   // Type
    sheet.getColumn(7).width = 14;   // Quantity
    sheet.getColumn(8).width = 20;   // Date & Time

    // Add data rows
    let rowCounter = 1;
    transactions.forEach((record) => {
      const item = record.item;
      const formatted = {
        itemCode: item?.code || 'N/A',
        itemCommonName: item?.name || item?.standardName || 'Unnamed',
        categoryName: item?.category?.name || 'Uncategorized',
        uomCode: item?.uom?.code || 'PCS',
        type: record.transactionType,
        quantity: parseFloat(record.changeAmount || 0),
        createdAt: record.createdAt,
      };

      const row = sheet.getRow(currentRow);
      row.getCell(1).value = rowCounter;
      row.getCell(2).value = formatted.itemCode;
      row.getCell(3).value = formatted.itemCommonName;
      row.getCell(4).value = formatted.categoryName;
      row.getCell(5).value = formatted.uomCode;
      row.getCell(6).value = formatted.type === 'Stock In' ? '📥 Stock In' : '📤 Stock Out';
      row.getCell(7).value = formatted.type === 'Stock In' ? `+${formatted.quantity}` : `-${formatted.quantity}`;
      row.getCell(8).value = formatted.createdAt ? new Date(formatted.createdAt).toLocaleString() : '';

      // Color the Type cell
      const typeCell = row.getCell(6);
      if (formatted.type === 'Stock In') {
        typeCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDCFCE7' }
        };
        typeCell.font = { color: { argb: 'FF166534' }, bold: true };
      } else {
        typeCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' }
        };
        typeCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }

      // Color the Quantity cell
      const qtyCell = row.getCell(7);
      if (formatted.type === 'Stock In') {
        qtyCell.font = { color: { argb: 'FF166534' }, bold: true };
      } else {
        qtyCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }

      // Add borders to all cells
      for (let col = 1; col <= 8; col++) {
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

    // Add auto-filter
    const headerRowNumber = headerRow.number;
    sheet.autoFilter = {
      from: `A${headerRowNumber}`,
      to: `H${headerRowNumber}`
    };

    // ============================================================
    // GENERATE EXCEL FILE
    // ============================================================
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Store_Transactions_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to export data" 
    });
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
          attributes: ['id', 'code', 'name', 'standardName', 'categoryId'],
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['categoryId', 'name', 'status'],
            },
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