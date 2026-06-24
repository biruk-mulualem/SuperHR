// controllers/itemsController.js
'use strict';

const { Item, Category, UOM } = require('../models');
const { Op } = require('sequelize');

// ================================================================
// ITEM CRUD OPERATIONS
// ================================================================

/**
 * Get all items with pagination and filtering
 * GET /api/items
 */
exports.getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId = '',
      status = '',
      uomId = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { standardName: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Category filter
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // UOM filter
    if (uomId) {
      whereClause.uomId = parseInt(uomId);
    }

    // Get items with associations
    const { count, rows } = await Item.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name', 'status'],
        },
        {
          model: UOM,
          as: 'uom',
          attributes: ['uomId', 'code', 'name'],
        },
        {
          model: UOM,
          as: 'conversionUom',
          attributes: ['uomId', 'code', 'name'],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.status(200).json({
      success: true,
      data: {
        items: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message,
    });
  }
};

/**
 * Get single item by ID
 * GET /api/items/:id
 */
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name', 'status'],
        },
        {
          model: UOM,
          as: 'uom',
          attributes: ['uomId', 'code', 'name'],
        },
        {
          model: UOM,
          as: 'conversionUom',
          attributes: ['uomId', 'code', 'name'],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item.getFullInfo ? item.getFullInfo() : item,
    });
  } catch (error) {
    console.error('Error in getItemById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error.message,
    });
  }
};

/**
 * Get item by code
 * GET /api/items/code/:code
 */
exports.getItemByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const item = await Item.findOne({
      where: { code },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name', 'status'],
        },
        {
          model: UOM,
          as: 'uom',
          attributes: ['uomId', 'code', 'name'],
        },
        {
          model: UOM,
          as: 'conversionUom',
          attributes: ['uomId', 'code', 'name'],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error in getItemByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error.message,
    });
  }
};

/**
 * Create a new item
 * POST /api/items
 */
exports.createItem = async (req, res) => {
  try {
    const {
      name,
      standardName,
      description,
      brand,
      model,
      barcode,
      categoryId,
      uomId,
      conversionUomId,
      conversionValue,
      costPrice,
      specType,
      specText,
      specPdfName,
      specPdfSize,
      specPdfUrl,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required',
      });
    }

    if (!uomId) {
      return res.status(400).json({
        success: false,
        message: 'UOM is required',
      });
    }

    // Check if barcode already exists
    if (barcode) {
      const existingItem = await Item.findOne({ where: { barcode } });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item with this barcode already exists',
        });
      }
    }

    // Check if category exists
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found',
        });
      }
    }

    // Check if UOM exists
    const uom = await UOM.findByPk(uomId);
    if (!uom) {
      return res.status(400).json({
        success: false,
        message: 'UOM not found',
      });
    }

    // Check if conversion UOM exists
    if (conversionUomId) {
      const conversionUom = await UOM.findByPk(conversionUomId);
      if (!conversionUom) {
        return res.status(400).json({
          success: false,
          message: 'Conversion UOM not found',
        });
      }
    }

    // Generate item code
    const code = await Item.generateItemCode();

    // Create item
    const item = await Item.create({
      code,
      name,
      standardName,
      description,
      brand,
      model,
      barcode,
      categoryId,
      uomId,
      conversionUomId,
      conversionValue: conversionValue || 0,
      costPrice: costPrice || 0,
      status: 'Active',
      specType: specType || 'text',
      specText,
      specPdfName,
      specPdfSize,
      specPdfUrl,
    });

    // Fetch created item with associations
    const createdItem = await Item.findByPk(item.itemId, {
      include: [
        { model: Category, as: 'category' },
        { model: UOM, as: 'uom' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: createdItem,
    });
  } catch (error) {
    console.error('Error in createItem:', error);
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Item with this code or barcode already exists',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error.message,
    });
  }
};

/**
 * Update an item
 * PUT /api/items/:id
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      standardName,
      description,
      brand,
      model,
      barcode,
      categoryId,
      uomId,
      conversionUomId,
      conversionValue,
      costPrice,
      specType,
      specText,
      specPdfName,
      specPdfSize,
      specPdfUrl,
    } = req.body;

    // Find item
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check if barcode already exists (excluding current item)
    if (barcode) {
      const existingItem = await Item.findOne({
        where: {
          barcode,
          itemId: { [Op.ne]: parseInt(id) },
        },
      });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Item with this barcode already exists',
        });
      }
    }

    // Check if category exists
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found',
        });
      }
    }

    // Check if UOM exists
    if (uomId) {
      const uom = await UOM.findByPk(uomId);
      if (!uom) {
        return res.status(400).json({
          success: false,
          message: 'UOM not found',
        });
      }
    }

    // Update item
    await item.update({
      name: name || item.name,
      standardName,
      description,
      brand,
      model,
      barcode,
      categoryId,
      uomId: uomId || item.uomId,
      conversionUomId,
      conversionValue: conversionValue !== undefined ? conversionValue : item.conversionValue,
      costPrice: costPrice !== undefined ? costPrice : item.costPrice,
      specType: specType || item.specType,
      specText,
      specPdfName,
      specPdfSize,
      specPdfUrl,
    });

    // Fetch updated item with associations
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: UOM, as: 'uom' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    console.error('Error in updateItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message,
    });
  }
};

/**
 * Update item status (Activate/Deactivate)
 * PATCH /api/items/:id/status
 */
exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Active', 'Inactive', 'Discontinued'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Inactive, or Discontinued',
      });
    }

    // Find item
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Update status
    await item.update({ status });

    res.status(200).json({
      success: true,
      message: `Item status updated to ${status}`,
      data: {
        id: item.itemId,
        code: item.code,
        name: item.name,
        status: item.status,
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error in updateItemStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item status',
      error: error.message,
    });
  }
};

/**
 * Deactivate an item
 * PATCH /api/items/:id/deactivate
 */
exports.deactivateItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (item.status === 'Inactive') {
      return res.status(400).json({
        success: false,
        message: 'Item is already inactive',
      });
    }

    await item.update({ status: 'Inactive' });

    res.status(200).json({
      success: true,
      message: 'Item deactivated successfully',
      data: {
        id: item.itemId,
        code: item.code,
        name: item.name,
        status: item.status,
      },
    });
  } catch (error) {
    console.error('Error in deactivateItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate item',
      error: error.message,
    });
  }
};

/**
 * Activate an item
 * PATCH /api/items/:id/activate
 */
exports.activateItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (item.status === 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Item is already active',
      });
    }

    await item.update({ status: 'Active' });

    res.status(200).json({
      success: true,
      message: 'Item activated successfully',
      data: {
        id: item.itemId,
        code: item.code,
        name: item.name,
        status: item.status,
      },
    });
  } catch (error) {
    console.error('Error in activateItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate item',
      error: error.message,
    });
  }
};

/**
 * Delete an item (soft delete - set status to Discontinued)
 * DELETE /api/items/:id
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Soft delete - set status to Discontinued
    await item.update({ status: 'Discontinued' });

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: {
        id: item.itemId,
        code: item.code,
        name: item.name,
        status: item.status,
      },
    });
  } catch (error) {
    console.error('Error in deleteItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message,
    });
  }
};

/**
 * Permanently delete an item from database
 * DELETE /api/items/:id/permanent
 */
exports.permanentDeleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    await item.destroy();

    res.status(200).json({
      success: true,
      message: 'Item permanently deleted',
    });
  } catch (error) {
    console.error('Error in permanentDeleteItem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message,
    });
  }
};

/**
 * Generate next item code
 * GET /api/items/generate-code
 */
exports.generateItemCode = async (req, res) => {
  try {
    const code = await Item.generateItemCode();

    res.status(200).json({
      success: true,
      data: {
        code,
      },
    });
  } catch (error) {
    console.error('Error in generateItemCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate item code',
      error: error.message,
    });
  }
};

/**
 * Get items by category
 * GET /api/items/category/:categoryId
 */
exports.getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const items = await Item.findAll({
      where: {
        categoryId: parseInt(categoryId),
        status: 'Active',
      },
      include: [
        { model: Category, as: 'category' },
        { model: UOM, as: 'uom' },
      ],
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: {
        category,
        items,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('Error in getItemsByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items by category',
      error: error.message,
    });
  }
};

/**
 * Search items
 * GET /api/items/search
 */
exports.searchItems = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const items = await Item.searchItems(q);

    res.status(200).json({
      success: true,
      data: {
        items,
        total: items.length,
        searchTerm: q,
      },
    });
  } catch (error) {
    console.error('Error in searchItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search items',
      error: error.message,
    });
  }
};

/**
 * Get active items only
 * GET /api/items/active
 */
exports.getActiveItems = async (req, res) => {
  try {
    const items = await Item.getActiveItems();

    res.status(200).json({
      success: true,
      data: {
        items,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('Error in getActiveItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active items',
      error: error.message,
    });
  }
};

/**
 * Get item statistics
 * GET /api/items/stats
 */
exports.getItemStats = async (req, res) => {
  try {
    const totalItems = await Item.count();
    const activeItems = await Item.count({ where: { status: 'Active' } });
    const inactiveItems = await Item.count({ where: { status: 'Inactive' } });
    const discontinuedItems = await Item.count({ where: { status: 'Discontinued' } });

    // Get category count - using raw query
    const categoryStats = await sequelize.query(`
      SELECT 
        c.name as "categoryName",
        COUNT(i.id) as count
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      GROUP BY c.name
    `, { type: sequelize.QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: {
        total: totalItems,
        active: activeItems,
        inactive: inactiveItems,
        discontinued: discontinuedItems,
        byCategory: categoryStats,
      },
    });
  } catch (error) {
    console.error('Error in getItemStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item statistics',
      error: error.message,
    });
  }
};

/**
 * Bulk create items
 * POST /api/items/bulk
 */
exports.bulkCreateItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required',
      });
    }

    const createdItems = [];
    const errors = [];

    for (const itemData of items) {
      try {
        // Generate code
        const code = await Item.generateItemCode();

        // Create item
        const item = await Item.create({
          ...itemData,
          code,
          status: 'Active',
        });

        createdItems.push(item);
      } catch (error) {
        errors.push({
          data: itemData,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdItems.length} items created successfully`,
      data: {
        created: createdItems,
        failed: errors,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('Error in bulkCreateItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create items',
      error: error.message,
    });
  }
};

/**
 * Export items as CSV
 * GET /api/items/export
 */
exports.exportItems = async (req, res) => {
  try {
    const { categoryId, status } = req.query;
    const whereClause = {};

    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    if (status) {
      whereClause.status = status;
    }

    const items = await Item.findAll({
      where: whereClause,
      include: [
        { model: Category, as: 'category' },
        { model: UOM, as: 'uom' },
        { model: UOM, as: 'conversionUom' },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Format data for CSV
    const csvData = items.map(item => ({
      Code: item.code,
      Name: item.name,
      'Standard Name': item.standardName || '',
      Category: item.category ? item.category.name : '',
      UOM: item.uom ? item.uom.code : '',
      'Conversion UOM': item.conversionUom ? item.conversionUom.code : '',
      'Conversion Value': item.conversionValue,
      'Cost Price': item.costPrice,
      Status: item.status,
      Created: item.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: csvData,
      total: csvData.length,
    });
  } catch (error) {
    console.error('Error in exportItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export items',
      error: error.message,
    });
  }
};

/**
 * Import items from CSV data
 * POST /api/items/import
 */
exports.importItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items data is required',
      });
    }

    const results = [];

    for (const itemData of items) {
      try {
        // Find or create category
        let category = null;
        if (itemData.categoryName) {
          category = await Category.findOne({
            where: { name: itemData.categoryName },
          });
          if (!category) {
            category = await Category.create({
              name: itemData.categoryName,
              status: 'Active',
            });
          }
        }

        // Find or create UOM
        let uom = null;
        if (itemData.uomCode) {
          uom = await UOM.findOne({
            where: { code: itemData.uomCode },
          });
          if (!uom) {
            uom = await UOM.create({
              code: itemData.uomCode,
              name: itemData.uomCode,
              status: 'Active',
            });
          }
        }

        const code = await Item.generateItemCode();

        const item = await Item.create({
          code,
          name: itemData.name,
          standardName: itemData.standardName || '',
          description: itemData.description || '',
          brand: itemData.brand || '',
          model: itemData.model || '',
          barcode: itemData.barcode || null,
          categoryId: category ? category.categoryId : null,
          uomId: uom ? uom.uomId : null,
          conversionUomId: null,
          conversionValue: 0,
          costPrice: itemData.costPrice || 0,
          status: 'Active',
          specType: 'text',
        });

        results.push({
          success: true,
          item,
        });
      } catch (error) {
        results.push({
          success: false,
          data: itemData,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.status(201).json({
      success: true,
      message: `${successCount} items imported successfully`,
      data: {
        results,
        total: items.length,
        success: successCount,
        failed: items.length - successCount,
      },
    });
  } catch (error) {
    console.error('Error in importItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import items',
      error: error.message,
    });
  }
};


/**
 * Upload item specification PDF
 * POST /api/items/:id/upload-specification
 */
exports.uploadItemSpecification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF file.'
      });
    }

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Build file URL
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/items/specifications/${req.file.filename}`;

    // Update item with specification info
    await item.update({
      specType: 'pdf',
      specPdfName: req.file.originalname,
      specPdfSize: `${(req.file.size / 1024).toFixed(1)} KB`,
      specPdfUrl: fileUrl
    });

    // Fetch updated item
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: UOM, as: 'uom' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Specification uploaded successfully',
      data: {
        item: updatedItem,
        file: {
          name: req.file.originalname,
          size: req.file.size,
          filename: req.file.filename,
          url: fileUrl
        }
      }
    });
  } catch (error) {
    console.error('Error in uploadItemSpecification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload specification',
      error: error.message,
    });
  }
};

/**
 * Remove item specification PDF
 * DELETE /api/items/:id/remove-specification
 */
exports.removeItemSpecification = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Delete file from disk if exists
    if (item.specPdfUrl) {
      try {
        // Extract filename from URL
        const urlParts = item.specPdfUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(__dirname, '..', 'uploads', 'items', 'specifications', filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue even if file deletion fails
      }
    }

    // Clear specification fields
    await item.update({
      specType: 'text',
      specPdfName: null,
      specPdfSize: null,
      specPdfUrl: null
    });

    // Fetch updated item
    const updatedItem = await Item.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: UOM, as: 'uom' },
        { model: UOM, as: 'conversionUom' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Specification removed successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error in removeItemSpecification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove specification',
      error: error.message,
    });
  }
};

