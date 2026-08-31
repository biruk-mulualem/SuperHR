// controllers/finishedGoodController.js
const { FinishedGood, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================================
// HELPER: Get next FG code
// ================================================================
const getNextFgCode = async () => {
  const seqName = 'finished_goods_code_seq';
  const [result] = await sequelize.query(
    `SELECT nextval('${seqName}') as nextval`
  );
  const nextVal = parseInt(result[0].nextval);
  return `FG-${String(nextVal).padStart(3, '0')}`;
};

// ================================================================
// GET ALL FINISHED GOODS
// ================================================================
exports.getFinishedGoods = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 10 } = req.query;

    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;

    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { fgCode: { [Op.iLike]: searchTerm } },
        { name: { [Op.iLike]: searchTerm } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await FinishedGood.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['userId', 'username', 'fullName']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['userId', 'username', 'fullName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get finished goods error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================
// GET FINISHED GOOD BY ID
// ================================================================
exports.getFinishedGoodById = async (req, res) => {
  try {
    const { id } = req.params;

    const finishedGood = await FinishedGood.findByPk(id, {
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['userId', 'username', 'fullName']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['userId', 'username', 'fullName']
        }
      ]
    });

    if (!finishedGood) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: finishedGood
    });
  } catch (error) {
    console.error('Get finished good by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================
// CREATE FINISHED GOOD
// ================================================================
exports.createFinishedGood = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, type, status } = req.body;
    const userId = req.user?.userId;

    // Validate
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    if (!type || !['Paint', 'Fiber'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Product type must be Paint or Fiber'
      });
    }

    // Check if name exists
    const existing = await FinishedGood.findOne({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A product with this name already exists'
      });
    }

    // Create
    const finishedGood = await FinishedGood.create(
      {
        name,
        type,
        status: status || 'Active',
        createdBy: userId,
        updatedBy: userId
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: finishedGood
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create finished good error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================
// UPDATE FINISHED GOOD
// ================================================================
exports.updateFinishedGood = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { name, type, status } = req.body;
    const userId = req.user?.userId;

    const finishedGood = await FinishedGood.findByPk(id, { transaction });

    if (!finishedGood) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if name exists (excluding current)
    if (name) {
      const existing = await FinishedGood.findOne({
        where: {
          name,
          id: { [Op.ne]: id }
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'A product with this name already exists'
        });
      }
    }

    // Update
    await finishedGood.update(
      {
        name: name || finishedGood.name,
        type: type || finishedGood.type,
        status: status || finishedGood.status,
        updatedBy: userId
      },
      { transaction }
    );

    await transaction.commit();

    // Fetch updated record
    const updated = await FinishedGood.findByPk(id, {
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['userId', 'username', 'fullName']
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['userId', 'username', 'fullName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update finished good error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================
// DELETE FINISHED GOOD
// ================================================================
exports.deleteFinishedGood = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const finishedGood = await FinishedGood.findByPk(id, { transaction });

    if (!finishedGood) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await finishedGood.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete finished good error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================
// BULK IMPORT FINISHED GOODS
// ================================================================
exports.bulkImport = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user?.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No CSV file uploaded'
      });
    }

    // Parse CSV
    const csv = require('csv-parser');
    const fs = require('fs');
    const items = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          items.push({
            productName: row.productName || row.productname,
            productType: row.productType || row.producttype,
            status: row.status || 'Active'
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up file
    fs.unlinkSync(req.file.path);

    const results = {
      total: items.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        // Validate
        if (!item.productName) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Product name is required`);
          continue;
        }

        if (!item.productType || !['Paint', 'Fiber'].includes(item.productType)) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Product type must be Paint or Fiber`);
          continue;
        }

        const status = item.status || 'Active';
        if (!['Active', 'Inactive', 'Discontinued'].includes(status)) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid status "${item.status}"`);
          continue;
        }

        // Check if name exists
        const existing = await FinishedGood.findOne({
          where: { name: item.productName },
          transaction
        });

        if (existing) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Product "${item.productName}" already exists`);
          continue;
        }

        // Create
        await FinishedGood.create(
          {
            name: item.productName,
            type: item.productType,
            status: status,
            createdBy: userId,
            updatedBy: userId
          },
          { transaction }
        );

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Import completed: ${results.success} imported, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================
// GET NEXT FG CODE
// ================================================================
exports.getNextFgCode = async (req, res) => {
  try {
    const nextCode = await getNextFgCode();
    res.status(200).json({
      success: true,
      data: { fgCode: nextCode }
    });
  } catch (error) {
    console.error('Get next FG code error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================================================================
// GET STATS
// ================================================================
exports.getStats = async (req, res) => {
  try {
    const total = await FinishedGood.count();
    const paint = await FinishedGood.count({ where: { type: 'Paint' } });
    const fiber = await FinishedGood.count({ where: { type: 'Fiber' } });
    const active = await FinishedGood.count({ where: { status: 'Active' } });
    const inactive = await FinishedGood.count({ where: { status: 'Inactive' } });
    const discontinued = await FinishedGood.count({ where: { status: 'Discontinued' } });

    res.status(200).json({
      success: true,
      data: {
        total,
        paint,
        fiber,
        active,
        inactive,
        discontinued
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};