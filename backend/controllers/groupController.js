// controllers/groupController.js
'use strict';

const { Group, Store, User, Role ,StoreGroupRelation, UserGroupRelation, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Generate next group code
 */
const generateGroupCode = async () => {
  const lastGroup = await Group.findOne({
    order: [['groupId', 'DESC']],
  });

  let nextNumber = 1;
  if (lastGroup) {
    const lastCode = lastGroup.code;
    const match = lastCode.match(/GRP-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `GRP-${String(nextNumber).padStart(3, '0')}`;
};

// controllers/groupController.js - Update formatGroupResponse

/**
 * Format group response with store and users
 */
const formatGroupResponse = (group) => {
  if (!group) return null;
  
  const plainGroup = group.toJSON();
  const store = plainGroup.stores?.[0] || null;
  const users = plainGroup.users || [];

  return {
    id: plainGroup.groupId || plainGroup.id,
    code: plainGroup.code,
    name: plainGroup.name,
    description: plainGroup.description,
    status: plainGroup.status,
    storeId: store?.storeId || null,
    storeName: store?.name || null,
    storeLocation: store?.location || null,
    storeStatus: store?.status || null,
    users: users.map(user => ({
      id: user.userId || user.id,
      userId: user.userId || user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.Role?.name || user.role || 'User', // Include role
    })),
    totalMembers: users.length,
    createdAt: plainGroup.createdAt,
    updatedAt: plainGroup.updatedAt,
  };
};

/**
 * Validate if a group can be activated based on store status
 */
const validateGroupActivation = async (groupId, transaction) => {
  const group = await Group.findByPk(groupId, {
    include: [
      {
        model: Store,
        as: 'stores',
        through: { attributes: [] },
      },
    ],
    transaction,
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const store = group.stores?.[0];
  if (store && store.status !== 'Active') {
    throw new Error(`Cannot activate group because the associated store "${store.name}" is ${store.status.toLowerCase()}`);
  }

  return group;
};

/**
 * Deactivate all groups associated with a store (used by store controller)
 */
const deactivateStoreGroups = async (storeId, transaction) => {
  const storeGroups = await StoreGroupRelation.findAll({
    where: { storeId: parseInt(storeId) },
    attributes: ['groupId'],
    transaction,
  });

  const groupIds = storeGroups.map(sg => sg.groupId);

  if (groupIds.length > 0) {
    await Group.update(
      { status: 'Inactive' },
      {
        where: {
          groupId: { [Op.in]: groupIds },
          status: 'Active'
        },
        transaction,
      }
    );
  }

  return groupIds.length;
};

// ================================================================
// GROUP CRUD OPERATIONS
// ================================================================

/**
 * Get all groups with pagination and filtering
 * GET /api/groups
 */
// controllers/groupController.js - Update getAllGroups

/**
 * Get all groups with pagination and filtering
 * GET /api/groups
 */
exports.getAllGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      storeId = '',
      status = '',
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
      ];
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Build include options
    const includeOptions = [
      {
        model: Store,
        as: 'stores',
        through: { attributes: [] },
        attributes: ['storeId', 'code', 'name', 'location', 'status'],
        ...(storeId ? { where: { storeId: parseInt(storeId) } } : {}),
      },
      {
        model: User,
        as: 'users',
        through: { attributes: [] },
        attributes: ['userId', 'fullName', 'username', 'email'],
        include: [
          {
            model: Role,
            attributes: ['name'],
            required: false,
          }
        ],
        where: { isActive: true },
        required: false,
      },
    ];

    const { count, rows } = await Group.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    // Format response
    const formattedGroups = rows.map(group => formatGroupResponse(group));

    res.status(200).json({
      success: true,
      data: {
        groups: formattedGroups,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllGroups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups',
      error: error.message,
    });
  }
};

/**
 * Get single group by ID
 * GET /api/groups/:id
 */
// controllers/groupController.js - Update getGroupById

/**
 * Get single group by ID
 * GET /api/groups/:id
 */
exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, {
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['userId', 'fullName', 'username', 'email'],
          include: [
            {
              model: Role,
              attributes: ['name'],
              required: false,
            }
          ],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const formattedGroup = formatGroupResponse(group);

    res.status(200).json({
      success: true,
      data: formattedGroup,
    });
  } catch (error) {
    console.error('Error in getGroupById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group',
      error: error.message,
    });
  }
};

/**
 * Create a new group
 * POST /api/groups
 */
exports.createGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, storeId, status, description } = req.body;

    // Validation
    if (!name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Group name is required',
      });
    }

    if (!storeId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Store selection is required',
      });
    }

    // Check if store exists and is active
    const store = await Store.findByPk(storeId, { transaction });
    if (!store) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    // If group is being created as Active, ensure store is Active
    if (status === 'Active' && store.status !== 'Active') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot create active group. The store "${store.name}" is ${store.status.toLowerCase()}`,
      });
    }

    // Check if group with same name exists
    const existingGroup = await Group.findOne({
      where: { name: { [Op.iLike]: name } },
      transaction,
    });

    if (existingGroup) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Group with this name already exists',
      });
    }

    // Generate group code
    const code = await generateGroupCode();

    // Create group
    const group = await Group.create({
      code,
      name,
      description: description || '',
      status: status || 'Active',
    }, { transaction });

    // Associate group with store
    await StoreGroupRelation.create({
      storeId: parseInt(storeId),
      groupId: group.groupId,
    }, { transaction });

    await transaction.commit();

    // Fetch created group with associations
    const createdGroup = await Group.findByPk(group.groupId, {
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['userId', 'fullName', 'username', 'email'],
        },
      ],
    });

    const formattedGroup = formatGroupResponse(createdGroup);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: formattedGroup,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createGroup:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Group code already exists',
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create group',
      error: error.message,
    });
  }
};

/**
 * Update a group
 * PUT /api/groups/:id
 */
exports.updateGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { name, storeId, status, description } = req.body;

    const group = await Group.findByPk(id, { transaction });

    if (!group) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if name already exists (excluding current group)
    if (name && name !== group.name) {
      const existingGroup = await Group.findOne({
        where: {
          name: { [Op.iLike]: name },
          groupId: { [Op.ne]: parseInt(id) },
        },
        transaction,
      });

      if (existingGroup) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Group with this name already exists',
        });
      }
    }

    // If updating status to Active, validate store is active
    if (status === 'Active') {
      // Find the store this group belongs to
      let targetStoreId = storeId;
      if (!targetStoreId) {
        const currentStore = await StoreGroupRelation.findOne({
          where: { groupId: group.groupId },
          transaction,
        });
        targetStoreId = currentStore?.storeId;
      }

      if (targetStoreId) {
        const store = await Store.findByPk(targetStoreId, { transaction });
        if (store && store.status !== 'Active') {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Cannot activate group. The store "${store.name}" is ${store.status.toLowerCase()}`,
          });
        }
      }
    }

    // If changing store, check if the new store is active when group is Active
    if (storeId && storeId !== '') {
      const newStore = await Store.findByPk(storeId, { transaction });
      if (!newStore) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      // If group is Active and new store is not Active, prevent the change
      const currentStatus = status || group.status;
      if (currentStatus === 'Active' && newStore.status !== 'Active') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot assign group to "${newStore.name}" because it is ${newStore.status.toLowerCase()}`,
        });
      }
    }

    // Update group
    await group.update({
      name: name || group.name,
      description: description !== undefined ? description : group.description,
      status: status || group.status,
    }, { transaction });

    // Update store association if storeId changed
    if (storeId && storeId !== '') {
      // Remove existing store association
      await StoreGroupRelation.destroy({
        where: { groupId: group.groupId },
        transaction,
      });

      // Add new store association
      await StoreGroupRelation.create({
        storeId: parseInt(storeId),
        groupId: group.groupId,
      }, { transaction });
    }

    await transaction.commit();

    // Fetch updated group with associations
    const updatedGroup = await Group.findByPk(id, {
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['userId', 'fullName', 'username', 'email'],
        },
      ],
    });

    const formattedGroup = formatGroupResponse(updatedGroup);

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: formattedGroup,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateGroup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group',
      error: error.message,
    });
  }
};

/**
 * Update group status
 * PATCH /api/groups/:id/status
 */
exports.updateGroupStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Active', 'Inactive'];
    if (!status || !validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active or Inactive',
      });
    }

    const group = await Group.findByPk(id, { transaction });

    if (!group) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // If trying to activate, validate store is active
    if (status === 'Active') {
      try {
        await validateGroupActivation(id, transaction);
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    await group.update({ status }, { transaction });

    await transaction.commit();

    const updatedGroup = await Group.findByPk(id, {
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['userId', 'fullName', 'username', 'email'],
        },
      ],
    });

    const formattedGroup = formatGroupResponse(updatedGroup);

    res.status(200).json({
      success: true,
      message: `Group status updated to ${status}`,
      data: formattedGroup,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updateGroupStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group status',
      error: error.message,
    });
  }
};

/**
 * Delete a group (soft delete - set status to Inactive)
 * DELETE /api/groups/:id
 */
exports.deleteGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, { transaction });

    if (!group) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Soft delete - set status to Inactive
    await group.update({ status: 'Inactive' }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Group deactivated successfully',
      data: {
        id: group.groupId,
        code: group.code,
        name: group.name,
        status: group.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteGroup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete group',
      error: error.message,
    });
  }
};

/**
 * Permanently delete a group
 * DELETE /api/groups/:id/permanent
 */
exports.permanentDeleteGroup = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const group = await Group.findByPk(id, { transaction });

    if (!group) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Remove all associations
    await StoreGroupRelation.destroy({
      where: { groupId: group.groupId },
      transaction,
    });

    await UserGroupRelation.destroy({
      where: { groupId: group.groupId },
      transaction,
    });

    // Delete group
    await group.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Group permanently deleted',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in permanentDeleteGroup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete group',
      error: error.message,
    });
  }
};

/**
 * Generate next group code
 * GET /api/groups/generate-code
 */
exports.generateGroupCode = async (req, res) => {
  try {
    const code = await generateGroupCode();

    res.status(200).json({
      success: true,
      data: { code },
    });
  } catch (error) {
    console.error('Error in generateGroupCode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate group code',
      error: error.message,
    });
  }
};

// ================================================================
// USER MANAGEMENT IN GROUPS
// ================================================================


/**
 * Get all users (for dropdown)
 * GET /api/groups/users/all
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['userId', 'fullName', 'username', 'email'],
      include: [
        {
          model: Role,
          attributes: ['name'],
          required: false,
        }
      ],
      order: [['fullName', 'ASC']],
    });

    const formattedUsers = users.map(user => ({
      id: user.userId,
      userId: user.userId,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.Role?.name || 'User',
    }));

    console.log(`✅ Found ${formattedUsers.length} users with roles`);

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};
/**
 * Get users in a group
 * GET /api/groups/:groupId/users
 */
exports.getGroupUsers = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['userId', 'fullName', 'username', 'email'],
        },
      ],
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const formattedUsers = group.users.map(user => ({
      id: user.userId,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error in getGroupUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group users',
      error: error.message,
    });
  }
};

/**
 * Add user to group
 * POST /api/groups/:groupId/users/:userId
 */
exports.addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    // Check if group exists and is active
    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['status'],
        },
      ],
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if group is active
    if (group.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add users to an inactive group',
      });
    }

    // Check if the associated store is active
    const store = group.stores?.[0];
    if (store && store.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot add users. The associated store is ${store.status.toLowerCase()}`,
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user already in group
    const existing = await UserGroupRelation.findOne({
      where: { userId: parseInt(userId), groupId: parseInt(groupId) },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already in this group',
      });
    }

    // Add user to group
    await UserGroupRelation.create({
      userId: parseInt(userId),
      groupId: parseInt(groupId),
    });

    // Fetch updated group with users
    const updatedGroup = await Group.findByPk(groupId, {
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['userId', 'fullName', 'username', 'email'],
        },
      ],
    });

    const formattedGroup = formatGroupResponse(updatedGroup);

    res.status(200).json({
      success: true,
      message: 'User added to group successfully',
      data: formattedGroup,
    });
  } catch (error) {
    console.error('Error in addUserToGroup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add user to group',
      error: error.message,
    });
  }
};

/**
 * Remove user from group
 * DELETE /api/groups/:groupId/users/:userId
 */
exports.removeUserFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    // Check if relation exists
    const userGroup = await UserGroupRelation.findOne({
      where: { userId: parseInt(userId), groupId: parseInt(groupId) },
    });

    if (!userGroup) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this group',
      });
    }

    // Remove user from group
    await userGroup.destroy();

    // Fetch updated group with users
    const updatedGroup = await Group.findByPk(groupId, {
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['storeId', 'code', 'name', 'location', 'status'],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['userId', 'fullName', 'username', 'email'],
        },
      ],
    });

    const formattedGroup = formatGroupResponse(updatedGroup);

    res.status(200).json({
      success: true,
      message: 'User removed from group successfully',
      data: formattedGroup,
    });
  } catch (error) {
    console.error('Error in removeUserFromGroup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from group',
      error: error.message,
    });
  }
};

// ================================================================
// GROUP STATISTICS
// ================================================================

/**
 * Get group statistics
 * GET /api/groups/statistics
 */
exports.getGroupStatistics = async (req, res) => {
  try {
    const totalGroups = await Group.count();
    const activeGroups = await Group.count({ where: { status: 'Active' } });
    const inactiveGroups = await Group.count({ where: { status: 'Inactive' } });

    // Get groups per store
    const storeStats = await sequelize.query(`
      SELECT 
        s.name as "storeName",
        s.status as "storeStatus",
        COUNT(DISTINCT g.id) as "groupCount",
        COUNT(DISTINCT CASE WHEN g.status = 'Active' THEN g.id END) as "activeGroupCount"
      FROM groups g
      JOIN store_group_relations sgr ON g.id = sgr.group_id
      JOIN stores s ON sgr.store_id = s.id
      GROUP BY s.id, s.name, s.status
      ORDER BY "groupCount" DESC
    `, { type: sequelize.QueryTypes.SELECT });

    // Get groups with most users
    const topGroups = await sequelize.query(`
      SELECT 
        g.id,
        g.code,
        g.name,
        g.status as "groupStatus",
        s.name as "storeName",
        s.status as "storeStatus",
        COUNT(DISTINCT ugr.user_id) as "userCount"
      FROM groups g
      LEFT JOIN store_group_relations sgr ON g.id = sgr.group_id
      LEFT JOIN stores s ON sgr.store_id = s.id
      LEFT JOIN user_group_relations ugr ON g.id = ugr.group_id
      GROUP BY g.id, g.code, g.name, g.status, s.name, s.status
      ORDER BY "userCount" DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    // Get total users in groups
    const totalUsersInGroups = await UserGroupRelation.count({
      distinct: true,
      col: 'userId',
    });

    // Get inactive groups count due to inactive stores
    const inactiveDueToStore = await sequelize.query(`
      SELECT COUNT(DISTINCT g.id) as count
      FROM groups g
      JOIN store_group_relations sgr ON g.id = sgr.group_id
      JOIN stores s ON sgr.store_id = s.id
      WHERE g.status = 'Active' AND s.status != 'Active'
    `, { type: sequelize.QueryTypes.SELECT });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalGroups,
          active: activeGroups,
          inactive: inactiveGroups,
          inactiveDueToStore: parseInt(inactiveDueToStore[0]?.count || 0),
        },
        byStore: storeStats,
        topGroups: topGroups,
        totalUsersInGroups: totalUsersInGroups,
      },
    });
  } catch (error) {
    console.error('Error in getGroupStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group statistics',
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT GROUP DATA
// ================================================================

/**
 * Export groups as CSV data
 * GET /api/groups/export
 */
exports.exportGroups = async (req, res) => {
  try {
    const { status, storeId } = req.query;
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    const groups = await Group.findAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: 'stores',
          through: { attributes: [] },
          attributes: ['name', 'status'],
          ...(storeId ? { where: { storeId: parseInt(storeId) } } : {}),
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['fullName', 'username'],
        },
      ],
      order: [['name', 'ASC']],
    });

    // Format data for export
    const exportData = groups.map(group => {
      const formatted = formatGroupResponse(group);
      return {
        'Group Code': formatted.code,
        'Group Name': formatted.name,
        'Store': formatted.storeName || '',
        'Store Status': formatted.storeStatus || '',
        'Group Status': formatted.status,
        'Members Count': formatted.totalMembers,
        'Members': formatted.users.map(u => u.fullName).join(', '),
        'Created At': formatted.createdAt ? new Date(formatted.createdAt).toLocaleDateString() : '',
      };
    });

    res.status(200).json({
      success: true,
      data: exportData,
      total: exportData.length,
    });
  } catch (error) {
    console.error('Error in exportGroups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export groups',
      error: error.message,
    });
  }
};

// ================================================================
// EXPORT HELPER FUNCTIONS (for store controller to use)
// ================================================================

/**
 * Deactivate all groups associated with a store
 * This is exported for use by store controller
 */
exports.deactivateStoreGroups = deactivateStoreGroups;