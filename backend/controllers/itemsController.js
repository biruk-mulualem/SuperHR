// controllers/itemsController.js
'use strict';

const { Item, Category, UOM ,sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
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
// controllers/itemsController.js - Updated importItems

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
    let successCount = 0;
    let failureCount = 0;

    for (const itemData of items) {
      try {
        // Clean and validate data
        const cleanData = {
          name: itemData.name?.trim(),
          standardName: itemData.standardName?.trim() || '',
          description: itemData.description?.trim() || '',
          brand: itemData.brand?.trim() || '',
          model: itemData.model?.trim() || '',
          barcode: itemData.barcode?.toString().replace(/[^0-9]/g, '') || null,
          costPrice: parseFloat(itemData.costPrice) || 0,
          conversionValue: parseFloat(itemData.conversionValue) || 0,
          specText: itemData.specText?.trim() || '',
        };

        // Validate required fields
        if (!cleanData.name) {
          throw new Error('Item name is required');
        }

        // Find or create category
        let category = null;
        if (itemData.categoryName?.trim()) {
          category = await Category.findOne({
            where: { name: { [Op.iLike]: itemData.categoryName.trim() } },
          });
          if (!category) {
            category = await Category.create({
              name: itemData.categoryName.trim(),
              status: 'Active',
            });
          }
        }

        // Find or create UOM
        let uom = null;
        if (itemData.uomCode?.trim()) {
          uom = await UOM.findOne({
            where: { code: { [Op.iLike]: itemData.uomCode.trim() } },
          });
          if (!uom) {
            uom = await UOM.create({
              code: itemData.uomCode.trim().toUpperCase(),
              name: itemData.uomCode.trim(),
              status: 'Active',
            });
          }
        }

        // Find or create conversion UOM
        let conversionUom = null;
        if (itemData.conversionUomCode?.trim()) {
          conversionUom = await UOM.findOne({
            where: { code: { [Op.iLike]: itemData.conversionUomCode.trim() } },
          });
          if (!conversionUom) {
            conversionUom = await UOM.create({
              code: itemData.conversionUomCode.trim().toUpperCase(),
              name: itemData.conversionUomCode.trim(),
              status: 'Active',
            });
          }
        }

        // Generate item code
        const code = await Item.generateItemCode();

        // Create item
        const item = await Item.create({
          code,
          name: cleanData.name,
          standardName: cleanData.standardName,
          description: cleanData.description,
          brand: cleanData.brand,
          model: cleanData.model,
          barcode: cleanData.barcode,
          categoryId: category ? category.categoryId : null,
          uomId: uom ? uom.uomId : null,
          conversionUomId: conversionUom ? conversionUom.uomId : null,
          conversionValue: cleanData.conversionValue,
          costPrice: cleanData.costPrice,
          status: 'Active',
          specType: 'text',
          specText: cleanData.specText,
        });

        results.push({
          success: true,
          item: {
            id: item.itemId,
            code: item.code,
            name: item.name,
          },
        });
        successCount++;
      } catch (error) {
        console.error('Import item error:', error);
        results.push({
          success: false,
          data: itemData,
          error: error.message || 'Validation error',
        });
        failureCount++;
      }
    }

    res.status(201).json({
      success: true,
      message: `${successCount} items imported successfully`,
      data: {
        results,
        total: items.length,
        success: successCount,
        failed: failureCount,
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



// controllers/itemsController.js
// ... (all your existing code)

// ================================================================
// CATEGORY CONTROLLER FUNCTIONS
// ================================================================

/**
 * Get all categories
 * GET /api/items/categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { Category } = require('../models');
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
};

/**
 * Get single category by ID
 * GET /api/items/categories/:id
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { Category, Item } = require('../models');
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        {
          model: Item,
          as: 'items',
          attributes: ['itemId', 'code', 'name', 'status'],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in getCategoryById:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
    });
  }
};

/**
 * Create a new category
 * POST /api/items/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const { Category } = require('../models');
    const { Op } = require('sequelize');
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required',
      });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
      where: { name: { [Op.iLike]: name } },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists',
      });
    }

    const category = await Category.create({
      name,
      description,
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in createCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category',
    });
  }
};

/**
 * Update a category
 * PUT /api/items/categories/:id
 */
exports.updateCategory = async (req, res) => {
  try {
    const { Category } = require('../models');
    const { Op } = require('sequelize');
    const { id } = req.params;
    const { name, description, status } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    // Check if name already exists (excluding current category)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name: { [Op.iLike]: name },
          categoryId: { [Op.ne]: parseInt(id) },
        },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category with this name already exists',
        });
      }
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      status: status || category.status,
    });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
    });
  }
};

/**
 * Update category status
 * PATCH /api/items/categories/:id/status
 */
exports.updateCategoryStatus = async (req, res) => {
  try {
    const { Category } = require('../models');
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be Active or Inactive',
      });
    }

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    await category.update({ status });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error in updateCategoryStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category status',
    });
  }
};

/**
 * Delete a category
 * DELETE /api/items/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { Category } = require('../models');
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    // Check if category has items
    const itemCount = await category.countItems();
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category with ${itemCount} items. Please reassign or delete items first.`,
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category',
    });
  }
};

// ================================================================
// UOM CONTROLLER FUNCTIONS
// ================================================================

/**
 * Get all UOMs
 * GET /api/items/uom
 */
exports.getAllUOMs = async (req, res) => {
  try {
    const { UOM } = require('../models');
    const uoms = await UOM.findAll({
      order: [['code', 'ASC']],
    });

    res.status(200).json({
      success: true,
      data: uoms,
    });
  } catch (error) {
    console.error('Error in getAllUOMs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch UOMs',
    });
  }
};

/**
 * Get single UOM by ID
 * GET /api/items/uom/:id
 */
exports.getUOMById = async (req, res) => {
  try {
    const { UOM, Item } = require('../models');
    const { id } = req.params;

    const uom = await UOM.findByPk(id, {
      include: [
        {
          model: Item,
          as: 'items',
          attributes: ['itemId', 'code', 'name', 'status'],
        },
      ],
    });

    if (!uom) {
      return res.status(404).json({
        success: false,
        error: 'UOM not found',
      });
    }

    res.status(200).json({
      success: true,
      data: uom,
    });
  } catch (error) {
    console.error('Error in getUOMById:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch UOM',
    });
  }
};

/**
 * Create a new UOM
 * POST /api/items/uom
 */
exports.createUOM = async (req, res) => {
  try {
    const { UOM } = require('../models');
    const { Op } = require('sequelize');
    const { code, name, description } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: 'Code and name are required',
      });
    }

    // Check if UOM with code already exists
    const existingUOM = await UOM.findOne({
      where: { code: { [Op.iLike]: code } },
    });

    if (existingUOM) {
      return res.status(400).json({
        success: false,
        error: 'UOM with this code already exists',
      });
    }

    const uom = await UOM.create({
      code: code.toUpperCase(),
      name,
      description,
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      data: uom,
    });
  } catch (error) {
    console.error('Error in createUOM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create UOM',
    });
  }
};

/**
 * Update a UOM
 * PUT /api/items/uom/:id
 */
exports.updateUOM = async (req, res) => {
  try {
    const { UOM } = require('../models');
    const { id } = req.params;
    const { name, description, status } = req.body;

    const uom = await UOM.findByPk(id);

    if (!uom) {
      return res.status(404).json({
        success: false,
        error: 'UOM not found',
      });
    }

    await uom.update({
      name: name || uom.name,
      description: description !== undefined ? description : uom.description,
      status: status || uom.status,
    });

    res.status(200).json({
      success: true,
      data: uom,
    });
  } catch (error) {
    console.error('Error in updateUOM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update UOM',
    });
  }
};

/**
 * Update UOM status
 * PATCH /api/items/uom/:id/status
 */
exports.updateUOMStatus = async (req, res) => {
  try {
    const { UOM } = require('../models');
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be Active or Inactive',
      });
    }

    const uom = await UOM.findByPk(id);

    if (!uom) {
      return res.status(404).json({
        success: false,
        error: 'UOM not found',
      });
    }

    await uom.update({ status });

    res.status(200).json({
      success: true,
      data: uom,
    });
  } catch (error) {
    console.error('Error in updateUOMStatus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update UOM status',
    });
  }
};

/**
 * Delete a UOM
 * DELETE /api/items/uom/:id
 */
exports.deleteUOM = async (req, res) => {
  try {
    const { UOM } = require('../models');
    const { id } = req.params;

    const uom = await UOM.findByPk(id);

    if (!uom) {
      return res.status(404).json({
        success: false,
        error: 'UOM not found',
      });
    }

    // Check if UOM is used in any items
    const itemCount = await uom.countItems();
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete UOM used by ${itemCount} items. Please reassign or delete items first.`,
      });
    }

    await uom.destroy();

    res.status(200).json({
      success: true,
      message: 'UOM deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteUOM:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete UOM',
    });
  }
};