// controllers/storeToStoreRelationshipController.js
'use strict';

const { StoreToStoreRelationship, Store, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Generate next relationship code
 */
const generateRelationshipCode = async () => {
  const lastRelationship = await StoreToStoreRelationship.findOne({
    order: [['relationshipId', 'DESC']],
  });

  let nextNumber = 1;
  if (lastRelationship) {
    const lastCode = lastRelationship.code;
    const match = lastCode.match(/REL-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `REL-${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Format relationship response with store details
 */
const formatRelationshipResponse = (relationship) => {
  if (!relationship) return null;
  
  const plain = relationship.toJSON();
  
  return {
    id: plain.relationshipId || plain.id,
    code: plain.code,
    sourceStoreId: plain.sourceStoreId,
    sourceStore: plain.sourceStore ? {
      id: plain.sourceStore.storeId || plain.sourceStore.id,
      code: plain.sourceStore.code,
      name: plain.sourceStore.name,
      location: plain.sourceStore.location,
      status: plain.sourceStore.status,
    } : null,
    targetStoreId: plain.targetStoreId,
    targetStore: plain.targetStore ? {
      id: plain.targetStore.storeId || plain.targetStore.id,
      code: plain.targetStore.code,
      name: plain.targetStore.name,
      location: plain.targetStore.location,
      status: plain.targetStore.status,
    } : null,
    description: plain.description,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

// ================================================================
// CRUD OPERATIONS
// ================================================================

/**
 * Get all store-to-store relationships with pagination and filtering
 * GET /api/store-to-store-relationships
 */
exports.getAllRelationships = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      storeId = 'all',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Build include options
    const includeOptions = [
      {
        model: Store,
        as: 'sourceStore',
        attributes: ['storeId', 'code', 'name', 'location', 'status'],
      },
      {
        model: Store,
        as: 'targetStore',
        attributes: ['storeId', 'code', 'name', 'location', 'status'],
      },
    ];

    // If filtering by store, add condition to include
    if (storeId && storeId !== 'all') {
      whereClause[Op.or] = [
        { sourceStoreId: parseInt(storeId) },
        { targetStoreId: parseInt(storeId) },
      ];
    }

    const { count, rows } = await StoreToStoreRelationship.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    // Format response
    const formattedRelationships = rows.map(rel => formatRelationshipResponse(rel));

    res.status(200).json({
      success: true,
      data: {
        relationships: formattedRelationships,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllRelationships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store-to-store relationships',
      error: error.message,
    });
  }
};

/**
 * Get single relationship by ID
 * GET /api/store-to-store-relationships/:id
 */
exports.getRelationshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const relationship = await StoreToStoreRelationship.findByPk(id, {
      include: [
        {
          model: Store,
          as: 'sourceStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: Store,
          as: 'targetStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
      ],
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    const formattedRelationship = formatRelationshipResponse(relationship);

    res.status(200).json({
      success: true,
      data: formattedRelationship,
    });
  } catch (error) {
    console.error('Error in getRelationshipById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch relationship',
      error: error.message,
    });
  }
};

/**
 * Create a new store-to-store relationship
 * POST /api/store-to-store-relationships
 */
exports.createRelationship = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { sourceStoreId, targetStoreId, description, status } = req.body;

    // Validation
    if (!sourceStoreId || !targetStoreId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Both source and target stores are required',
      });
    }

    if (sourceStoreId === targetStoreId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A store cannot have a relationship with itself',
      });
    }

    // Check if stores exist
    const sourceStore = await Store.findByPk(sourceStoreId, { transaction });
    if (!sourceStore) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Source store not found',
      });
    }

    const targetStore = await Store.findByPk(targetStoreId, { transaction });
    if (!targetStore) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Target store not found',
      });
    }

    // Check if relationship already exists
    const existing = await StoreToStoreRelationship.findOne({
      where: {
        sourceStoreId: parseInt(sourceStoreId),
        targetStoreId: parseInt(targetStoreId),
      },
      transaction,
    });

    if (existing) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'This relationship already exists',
      });
    }

    // Generate code
    const code = await generateRelationshipCode();

    // Auto-generate description if not provided
    let finalDescription = description;
    if (!finalDescription) {
      finalDescription = `${sourceStore.name} requests items from ${targetStore.name}`;
    }

    // Create relationship
    const relationship = await StoreToStoreRelationship.create({
      code,
      sourceStoreId: parseInt(sourceStoreId),
      targetStoreId: parseInt(targetStoreId),
      description: finalDescription,
      status: status || 'active',
    }, { transaction });

    await transaction.commit();

    // Fetch created relationship with associations
    const createdRelationship = await StoreToStoreRelationship.findByPk(relationship.relationshipId, {
      include: [
        {
          model: Store,
          as: 'sourceStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: Store,
          as: 'targetStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
      ],
    });

    const formattedRelationship = formatRelationshipResponse(createdRelationship);

    res.status(201).json({
      success: true,
      message: 'Store-to-store relationship created successfully',
      data: formattedRelationship,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createRelationship:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'This relationship already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create store-to-store relationship',
      error: error.message,
    });
  }
};

/**
 * Update a store-to-store relationship
 * PUT /api/store-to-store-relationships/:id
 */
exports.updateRelationship = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { sourceStoreId, targetStoreId, description, status } = req.body;

    const relationship = await StoreToStoreRelationship.findByPk(id, { transaction });

    if (!relationship) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    // Validate stores if changed
    if (sourceStoreId && sourceStoreId !== relationship.sourceStoreId) {
      const sourceStore = await Store.findByPk(sourceStoreId, { transaction });
      if (!sourceStore) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Source store not found',
        });
      }
    }

    if (targetStoreId && targetStoreId !== relationship.targetStoreId) {
      const targetStore = await Store.findByPk(targetStoreId, { transaction });
      if (!targetStore) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Target store not found',
        });
      }
    }

    // Check if trying to set same store
    const finalSource = sourceStoreId || relationship.sourceStoreId;
    const finalTarget = targetStoreId || relationship.targetStoreId;
    if (finalSource === finalTarget) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A store cannot have a relationship with itself',
      });
    }

    // Check for duplicate relationship (excluding current)
    if (sourceStoreId || targetStoreId) {
      const existing = await StoreToStoreRelationship.findOne({
        where: {
          sourceStoreId: parseInt(finalSource),
          targetStoreId: parseInt(finalTarget),
          relationshipId: { [Op.ne]: parseInt(id) },
        },
        transaction,
      });

      if (existing) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'This relationship already exists',
        });
      }
    }

    // Auto-generate description if not provided and stores changed
    let finalDescription = description;
    if (!finalDescription && (sourceStoreId || targetStoreId)) {
      const source = await Store.findByPk(finalSource, { transaction });
      const target = await Store.findByPk(finalTarget, { transaction });
      finalDescription = `${source.name} requests items from ${target.name}`;
    }

    // Update relationship
    await relationship.update({
      sourceStoreId: parseInt(finalSource),
      targetStoreId: parseInt(finalTarget),
      description: finalDescription || relationship.description,
      status: status || relationship.status,
    }, { transaction });

    await transaction.commit();

    // Fetch updated relationship with associations
    const updatedRelationship = await StoreToStoreRelationship.findByPk(id, {
      include: [
        {
          model: Store,
          as: 'sourceStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: Store,
          as: 'targetStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
      ],
    });

    const formattedRelationship = formatRelationshipResponse(updatedRelationship);

    res.status(200).json({
      success: true,
      message: 'Store-to-store relationship updated successfully',
      data: formattedRelationship,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateRelationship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store-to-store relationship',
      error: error.message,
    });
  }
};

/**
 * Update relationship status
 * PATCH /api/store-to-store-relationships/:id/status
 */
exports.updateRelationshipStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or inactive',
      });
    }

    const relationship = await StoreToStoreRelationship.findByPk(id, { transaction });

    if (!relationship) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    await relationship.update({ status }, { transaction });

    await transaction.commit();

    const updatedRelationship = await StoreToStoreRelationship.findByPk(id, {
      include: [
        {
          model: Store,
          as: 'sourceStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: Store,
          as: 'targetStore',
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
      ],
    });

    const formattedRelationship = formatRelationshipResponse(updatedRelationship);

    res.status(200).json({
      success: true,
      message: `Relationship ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: formattedRelationship,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateRelationshipStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update relationship status',
      error: error.message,
    });
  }
};

/**
 * Delete a relationship (soft delete - set status to inactive)
 * DELETE /api/store-to-store-relationships/:id
 */
exports.deleteRelationship = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const relationship = await StoreToStoreRelationship.findByPk(id, { transaction });

    if (!relationship) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    // Soft delete - set status to inactive
    await relationship.update({ status: 'inactive' }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Relationship deactivated successfully',
      data: {
        id: relationship.relationshipId,
        code: relationship.code,
        status: relationship.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteRelationship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete relationship',
      error: error.message,
    });
  }
};

/**
 * Permanently delete a relationship
 * DELETE /api/store-to-store-relationships/:id/permanent
 */
exports.permanentDeleteRelationship = async (req, res) => {
  try {
    const { id } = req.params;

    const relationship = await StoreToStoreRelationship.findByPk(id);

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found',
      });
    }

    await relationship.destroy();

    res.status(200).json({
      success: true,
      message: 'Relationship permanently deleted',
    });
  } catch (error) {
    console.error('Error in permanentDeleteRelationship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete relationship',
      error: error.message,
    });
  }
};

/**
 * Generate next relationship code
 * GET /api/store-to-store-relationships/generate-code
 */
exports.generateRelationshipCode = async (req, res) => {
  try {
    const code = await generateRelationshipCode();

    res.status(200).json({
      success: true,
      data: { code },
    });
  } catch (error) {
    console.error('Error in generateRelationshipCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate relationship code',
      error: error.message,
    });
  }
};

// ================================================================
// STATISTICS
// ================================================================

/**
 * Get relationship statistics
 * GET /api/store-to-store-relationships/statistics
 */
exports.getRelationshipStatistics = async (req, res) => {
  try {
    const total = await StoreToStoreRelationship.count();
    const active = await StoreToStoreRelationship.count({ where: { status: 'active' } });
    const inactive = await StoreToStoreRelationship.count({ where: { status: 'inactive' } });

    // Get relationships per store (as source)
    const sourceStats = await sequelize.query(`
      SELECT 
        s.id as storeId,
        s.name as storeName,
        s.status as storeStatus,
        COUNT(DISTINCT sr.id) as relationshipCount,
        COUNT(DISTINCT CASE WHEN sr.status = 'active' THEN sr.id END) as activeCount
      FROM stores s
      LEFT JOIN store_to_store_relationships sr ON s.id = sr.source_store_id
      GROUP BY s.id, s.name, s.status
      ORDER BY relationshipCount DESC
    `, { type: sequelize.QueryTypes.SELECT });

    // Get relationships per store (as target)
    const targetStats = await sequelize.query(`
      SELECT 
        s.id as storeId,
        s.name as storeName,
        s.status as storeStatus,
        COUNT(DISTINCT sr.id) as relationshipCount,
        COUNT(DISTINCT CASE WHEN sr.status = 'active' THEN sr.id END) as activeCount
      FROM stores s
      LEFT JOIN store_to_store_relationships sr ON s.id = sr.target_store_id
      GROUP BY s.id, s.name, s.status
      ORDER BY relationshipCount DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total,
          active,
          inactive,
        },
        bySourceStore: sourceStats,
        byTargetStore: targetStats,
      },
    });
  } catch (error) {
    console.error('Error in getRelationshipStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch relationship statistics',
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT
// ================================================================

/**
 * Export relationships as CSV data
 * GET /api/store-to-store-relationships/export
 */
exports.exportRelationships = async (req, res) => {
  try {
    const { status, storeId } = req.query;
    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (storeId && storeId !== 'all') {
      whereClause[Op.or] = [
        { sourceStoreId: parseInt(storeId) },
        { targetStoreId: parseInt(storeId) },
      ];
    }

    const relationships = await StoreToStoreRelationship.findAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: 'sourceStore',
          attributes: ['name'],
        },
        {
          model: Store,
          as: 'targetStore',
          attributes: ['name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Format data for export
    const exportData = relationships.map((rel, index) => {
      const plain = rel.toJSON();
      return {
        '#': index + 1,
        'Code': plain.code,
        'Store Asking': plain.sourceStore?.name || 'Unknown',
        'Store Supplying': plain.targetStore?.name || 'Unknown',
        'Description': plain.description || '',
        'Status': plain.status,
        'Created At': plain.createdAt ? new Date(plain.createdAt).toLocaleDateString() : '',
      };
    });

    res.status(200).json({
      success: true,
      data: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error('Error in exportRelationships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export relationships',
      error: error.message,
    });
  }
};