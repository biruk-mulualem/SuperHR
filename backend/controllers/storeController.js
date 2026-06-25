// controllers/storeController.js
'use strict';

const { Store, Group, User, StoreGroupRelation, UserGroupRelation, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Generate next store code
 */
const generateStoreCode = async () => {
  const lastStore = await Store.findOne({
    order: [['storeId', 'DESC']],
  });

  let nextNumber = 1;
  if (lastStore) {
    const lastCode = lastStore.code;
    const match = lastCode.match(/STORE-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `STORE-${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Format store response with groups and users
 */
const formatStoreResponse = (store) => {
  if (!store) return null;
  
  const plainStore = store.toJSON();
  const groups = plainStore.groups || [];
  
  let totalUsers = 0;
  const formattedGroups = groups.map(group => {
    const users = group.users || [];
    totalUsers += users.length;
    return {
      id: group.groupId || group.id,
      code: group.code,
      name: group.name,
      description: group.description,
      status: group.status,
      users: users.map(user => ({
        id: user.userId || user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }))
    };
  });

  return {
    id: plainStore.storeId || plainStore.id,
    code: plainStore.code,
    name: plainStore.name,
    location: plainStore.location,
    status: plainStore.status,
    groups: formattedGroups,
    totalUsers: totalUsers,
    totalGroups: formattedGroups.length,
    createdAt: plainStore.createdAt,
    updatedAt: plainStore.updatedAt
  };
};

// ================================================================
// STORE CRUD OPERATIONS
// ================================================================

/**
 * Get all stores with pagination and filtering
 * GET /api/stores
 */
exports.getAllStores = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      location = '',
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
        { location: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Location filter
    if (location) {
      whereClause.location = location;
    }

    // Get stores with their groups and users
    const { count, rows } = await Store.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    // Format response
    const formattedStores = rows.map(store => formatStoreResponse(store));

    res.status(200).json({
      success: true,
      data: {
        stores: formattedStores,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllStores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: error.message,
    });
  }
};

/**
 * Get single store by ID
 * GET /api/stores/:id
 */
exports.getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    const formattedStore = formatStoreResponse(store);

    res.status(200).json({
      success: true,
      data: formattedStore,
    });
  } catch (error) {
    console.error('Error in getStoreById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: error.message,
    });
  }
};

/**
 * Get store by code
 * GET /api/stores/code/:code
 */
exports.getStoreByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const store = await Store.findOne({
      where: { code },
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    const formattedStore = formatStoreResponse(store);

    res.status(200).json({
      success: true,
      data: formattedStore,
    });
  } catch (error) {
    console.error('Error in getStoreByCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store',
      error: error.message,
    });
  }
};

/**
 * Create a new store
 * POST /api/stores
 */
exports.createStore = async (req, res) => {
  try {
    const { name, location, status } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required',
      });
    }

    // Check if store with same name exists
    const existingStore = await Store.findOne({
      where: { name: { [Op.iLike]: name } },
    });

    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'Store with this name already exists',
      });
    }

    // Generate store code
    const code = await generateStoreCode();

    // Create store
    const store = await Store.create({
      code,
      name,
      location: location || null,
      status: status || 'Active',
    });

    // Fetch created store with associations
    const createdStore = await Store.findByPk(store.storeId, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    const formattedStore = formatStoreResponse(createdStore);

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: formattedStore,
    });
  } catch (error) {
    console.error('Error in createStore:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Store code already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create store',
      error: error.message,
    });
  }
};

/**
 * Update a store
 * PUT /api/stores/:id
 */
exports.updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Check if name already exists (excluding current store)
    if (name && name !== store.name) {
      const existingStore = await Store.findOne({
        where: {
          name: { [Op.iLike]: name },
          storeId: { [Op.ne]: parseInt(id) },
        },
      });

      if (existingStore) {
        return res.status(400).json({
          success: false,
          message: 'Store with this name already exists',
        });
      }
    }

    // Update store
    await store.update({
      name: name || store.name,
      location: location !== undefined ? location : store.location,
      status: status || store.status,
    });

    // Fetch updated store with associations
    const updatedStore = await Store.findByPk(id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    const formattedStore = formatStoreResponse(updatedStore);

    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: formattedStore,
    });
  } catch (error) {
    console.error('Error in updateStore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store',
      error: error.message,
    });
  }
};

/**
 * Update store status
 * PATCH /api/stores/:id/status
 */
exports.updateStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Active', 'Inactive', 'Closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Inactive, or Closed',
      });
    }

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    await store.update({ status });

    const updatedStore = await Store.findByPk(id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    const formattedStore = formatStoreResponse(updatedStore);

    res.status(200).json({
      success: true,
      message: `Store status updated to ${status}`,
      data: formattedStore,
    });
  } catch (error) {
    console.error('Error in updateStoreStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store status',
      error: error.message,
    });
  }
};

/**
 * Delete a store (soft delete - set status to Closed)
 * DELETE /api/stores/:id
 */
exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Soft delete - set status to Closed
    await store.update({ status: 'Closed' });

    res.status(200).json({
      success: true,
      message: 'Store closed successfully',
      data: {
        id: store.storeId,
        code: store.code,
        name: store.name,
        status: store.status,
      },
    });
  } catch (error) {
    console.error('Error in deleteStore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete store',
      error: error.message,
    });
  }
};

/**
 * Permanently delete a store
 * DELETE /api/stores/:id/permanent
 */
exports.permanentDeleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    await store.destroy();

    res.status(200).json({
      success: true,
      message: 'Store permanently deleted',
    });
  } catch (error) {
    console.error('Error in permanentDeleteStore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete store',
      error: error.message,
    });
  }
};

/**
 * Generate next store code
 * GET /api/stores/generate-code
 */
exports.generateStoreCode = async (req, res) => {
  try {
    const code = await generateStoreCode();

    res.status(200).json({
      success: true,
      data: { code },
    });
  } catch (error) {
    console.error('Error in generateStoreCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate store code',
      error: error.message,
    });
  }
};

// ================================================================
// STORE-GROUP RELATIONSHIP MANAGEMENT
// ================================================================

/**
 * Get all groups available for a store (for dropdown)
 * GET /api/stores/:storeId/available-groups
 */
// controllers/storeController.js - Fix getAvailableGroupsForStore

/**
 * Get available groups for a store
 * GET /api/stores/:storeId/available-groups
 */
exports.getAvailableGroupsForStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    // If storeId is '0' or 'undefined' or invalid, return all active groups
    if (storeId === '0' || storeId === 'undefined' || storeId === 'null' || isNaN(parseInt(storeId))) {
      const allGroups = await Group.findAll({
        where: { status: 'Active' },
        attributes: ['groupId', 'code', 'name', 'description', 'status'],
        order: [['name', 'ASC']],
      });

      const formattedGroups = allGroups.map(group => ({
        id: group.groupId,
        code: group.code,
        name: group.name,
        description: group.description,
        status: group.status,
      }));

      return res.status(200).json({
        success: true,
        data: formattedGroups,
      });
    }

    // Check if store exists
    const store = await Store.findByPk(parseInt(storeId));
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Get all active groups
    const allGroups = await Group.findAll({
      where: { status: 'Active' },
      attributes: ['groupId', 'code', 'name', 'description', 'status'],
      order: [['name', 'ASC']],
    });

    // Get groups already assigned to this store
    const assignedGroups = await StoreGroupRelation.findAll({
      where: { storeId: parseInt(storeId) },
      attributes: ['groupId'],
    });

    const assignedGroupIds = assignedGroups.map(sg => sg.groupId);

    // Filter out already assigned groups
    const availableGroups = allGroups.filter(
      group => !assignedGroupIds.includes(group.groupId)
    );

    const formattedGroups = availableGroups.map(group => ({
      id: group.groupId,
      code: group.code,
      name: group.name,
      description: group.description,
      status: group.status,
    }));

    res.status(200).json({
      success: true,
      data: formattedGroups,
    });
  } catch (error) {
    console.error('Error in getAvailableGroupsForStore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available groups',
      error: error.message,
    });
  }
};

/**
 * Get all groups assigned to a store
 * GET /api/stores/:storeId/groups
 */
exports.getStoreGroups = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findByPk(storeId, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    const formattedGroups = store.groups.map(group => ({
      id: group.groupId,
      code: group.code,
      name: group.name,
      description: group.description,
      status: group.status,
      users: group.users.map(user => ({
        id: user.userId,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }))
    }));

    res.status(200).json({
      success: true,
      data: formattedGroups,
    });
  } catch (error) {
    console.error('Error in getStoreGroups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store groups',
      error: error.message,
    });
  }
};

/**
 * Add group to store
 * POST /api/stores/:storeId/groups/:groupId
 */
exports.addGroupToStore = async (req, res) => {
  try {
    const { storeId, groupId } = req.params;

    // Check if store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // Check if group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if group already assigned to store
    const existing = await StoreGroupRelation.findOne({
      where: { storeId: parseInt(storeId), groupId: parseInt(groupId) },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Group already assigned to this store',
      });
    }

    // Add group to store
    await StoreGroupRelation.create({
      storeId: parseInt(storeId),
      groupId: parseInt(groupId),
    });

    // Fetch updated store with associations
    const updatedStore = await Store.findByPk(storeId, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    const formattedStore = formatStoreResponse(updatedStore);

    res.status(200).json({
      success: true,
      message: 'Group added to store successfully',
      data: formattedStore,
    });
  } catch (error) {
    console.error('Error in addGroupToStore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add group to store',
      error: error.message,
    });
  }
};

/**
 * Remove group from store
 * DELETE /api/stores/:storeId/groups/:groupId
 */
exports.removeGroupFromStore = async (req, res) => {
  try {
    const { storeId, groupId } = req.params;

    // Check if relation exists
    const storeGroup = await StoreGroupRelation.findOne({
      where: { storeId: parseInt(storeId), groupId: parseInt(groupId) },
    });

    if (!storeGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found in this store',
      });
    }

    // Remove group from store
    await storeGroup.destroy();

    // Fetch updated store with associations
    const updatedStore = await Store.findByPk(storeId, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['userId', 'fullName', 'username', 'email'],
            },
          ],
        },
      ],
    });

    const formattedStore = formatStoreResponse(updatedStore);

    res.status(200).json({
      success: true,
      message: 'Group removed from store successfully',
      data: formattedStore,
    });
  } catch (error) {
    console.error('Error in removeGroupFromStore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove group from store',
      error: error.message,
    });
  }
};

// ================================================================
// STORE STATISTICS
// ================================================================

/**
 * Get store statistics
 * GET /api/stores/statistics
 */
exports.getStoreStatistics = async (req, res) => {
  try {
    // Store counts
    const totalStores = await Store.count();
    const activeStores = await Store.count({ where: { status: 'Active' } });
    const inactiveStores = await Store.count({ where: { status: 'Inactive' } });
    const closedStores = await Store.count({ where: { status: 'Closed' } });

    // Group counts (for display)
    const totalGroups = await Group.count();
    const activeGroups = await Group.count({ where: { status: 'Active' } });
    const inactiveGroups = await Group.count({ where: { status: 'Inactive' } });

    // Relation counts
    const storeGroupRelations = await StoreGroupRelation.count();
    const userGroupRelations = await UserGroupRelation.count();
    const usersInGroups = await UserGroupRelation.count({
      distinct: true,
      col: 'userId',
    });

    // Get stores with most groups
    const topStores = await Store.findAll({
      attributes: [
        'storeId',
        'code',
        'name',
        [
          sequelize.literal(
            '(SELECT COUNT(*) FROM store_group_relations WHERE store_group_relations.store_id = Store.id)'
          ),
          'groupCount',
        ],
      ],
      order: [[sequelize.literal('"groupCount"'), 'DESC']],
      limit: 5,
    });

    // Get location statistics
    const locationStats = await Store.findAll({
      attributes: [
        'location',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { location: { [Op.ne]: null } },
      group: ['location'],
      order: [[sequelize.literal('count'), 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        stores: {
          total: totalStores,
          active: activeStores,
          inactive: inactiveStores,
          closed: closedStores,
        },
        groups: {
          total: totalGroups,
          active: activeGroups,
          inactive: inactiveGroups,
        },
        relations: {
          storeGroup: storeGroupRelations,
          userGroup: userGroupRelations,
          usersInGroups: usersInGroups,
        },
        topStores: topStores.map(store => ({
          id: store.storeId,
          code: store.code,
          name: store.name,
          groupCount: parseInt(store.get('groupCount')) || 0,
        })),
        locationStats: locationStats.map(stat => ({
          location: stat.location,
          count: parseInt(stat.get('count')) || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getStoreStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store statistics',
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT STORE DATA
// ================================================================

/**
 * Export stores as CSV data
 * GET /api/stores/export
 */
exports.exportStores = async (req, res) => {
  try {
    const { status, location } = req.query;
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (location) {
      whereClause.location = location;
    }

    const stores = await Store.findAll({
      where: whereClause,
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: 'users',
              through: { attributes: [] },
              attributes: ['fullName', 'username'],
            },
          ],
        },
      ],
      order: [['name', 'ASC']],
    });

    // Format data for export
    const exportData = stores.map(store => {
      const formatted = formatStoreResponse(store);
      return {
        Code: formatted.code,
        Name: formatted.name,
        Location: formatted.location || '',
        Status: formatted.status,
        'Total Groups': formatted.totalGroups,
        'Total Users': formatted.totalUsers,
        Groups: formatted.groups.map(g => g.name).join(', '),
        'Created At': formatted.createdAt ? new Date(formatted.createdAt).toLocaleDateString() : '',
      };
    });

    res.status(200).json({
      success: true,
      data: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error('Error in exportStores:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export stores',
      error: error.message,
    });
  }
};


// controllers/storeController.js - Add at the end of the file

// ================================================================
// GET ALL GROUPS & USERS (FOR DROPDOWNS)
// ================================================================

/**
 * Get all groups (for dropdown)
 * GET /api/stores/groups
 */
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { status: 'Active' },
      attributes: ['groupId', 'code', 'name', 'description', 'status'],
      order: [['name', 'ASC']],
    });

    const formattedGroups = groups.map(group => ({
      id: group.groupId,
      code: group.code,
      name: group.name,
      description: group.description,
      status: group.status,
    }));

    console.log(`✅ Found ${formattedGroups.length} active groups`);

    res.status(200).json({
      success: true,
      data: formattedGroups,
    });
  } catch (error) {
    console.error('❌ Error in getAllGroups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
      error: error.message,
    });
  }
};

/**
 * Get all users (for dropdown)
 * GET /api/stores/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['userId', 'fullName', 'username', 'email'],
      order: [['fullName', 'ASC']],
    });

    const formattedUsers = users.map(user => ({
      id: user.userId,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    }));

    console.log(`✅ Found ${formattedUsers.length} active users`);

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('❌ Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};