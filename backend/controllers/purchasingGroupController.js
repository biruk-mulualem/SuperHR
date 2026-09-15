'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const {
  PurchasingGroup,
  PurchasingGroupMember,
  User,
  Role,
  Department,
} = db;

// ================================================================
// HELPERS
// ================================================================

/**
 * Include clause to hydrate member info from the User table.
 * Matches your User model: primary key is `userId` (column `user_id`).
 */
const MEMBER_INCLUDE = {
  model: PurchasingGroupMember,
  as: 'members',
  include: [
    {
      model: User,
      as: 'user',
      attributes: ['userId', 'username', 'fullName', 'email', 'isActive'],
      include: [
        { model: Role, attributes: ['roleId', 'name'] },
        { model: Department, attributes: ['departmentId', 'name', 'code'] },
      ],
    },
  ],
};

function toDto(group) {
  const plain = group.toJSON ? group.toJSON() : group;

  return {
    id: plain.id,
    code: plain.code,
    name: plain.name,
    description: plain.description,
    status: plain.status,
    createdAt: plain.created_at || plain.createdAt,
    updatedAt: plain.updated_at || plain.updatedAt,
    members: (plain.members ?? []).map((m) => ({
      id: m.id,
      userId: m.user?.userId ?? m.userId,
      username: m.user?.username,
      fullName: m.user?.fullName,
      email: m.user?.email,
      department: m.user?.Department?.name ?? null,
      role: m.role || m.user?.Role?.name || 'Member',
      isActive: m.user?.isActive,
      joinedAt: m.joined_at || m.joinedAt,
    })),
  };
}

// ================================================================
// 1. LIST GROUPS
// ================================================================
exports.listGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'id',
      sortOrder = 'ASC',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    const where = {};
    if (status && status !== 'all') where.status = status;

    if (search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { code: { [Op.iLike]: `%${q}%` } },
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { count, rows } = await PurchasingGroup.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: pageSize,
      distinct: true,
      include: [MEMBER_INCLUDE],
    });

    res.json({
      success: true,
      data: {
        items: rows.map(toDto),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listGroups error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to list groups' });
  }
};

// ================================================================
// 2. GET ONE
// ================================================================
exports.getGroupById = async (req, res) => {
  try {
    const group = await PurchasingGroup.findByPk(req.params.id, {
      include: [MEMBER_INCLUDE],
    });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    res.json({ success: true, data: toDto(group) });
  } catch (error) {
    console.error('❌ getGroupById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 3. CREATE
// ================================================================
exports.createGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { name, description = '', status = 'active' } = req.body;

    if (!name || !name.trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    if (!['active', 'inactive'].includes(status)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const dup = await PurchasingGroup.findOne({
      where: { name: { [Op.iLike]: name.trim() } },
      transaction: t,
    });
    if (dup) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        error: `A group named "${name.trim()}" already exists`,
      });
    }

    const code = await PurchasingGroup.generateCode(t);

    const group = await PurchasingGroup.create(
      {
        code,
        name: name.trim(),
        description: description.trim() || null,
        status,
      },
      { transaction: t }
    );

    await t.commit();

    const complete = await PurchasingGroup.findByPk(group.id, { include: [MEMBER_INCLUDE] });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ createGroup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 4. UPDATE
// ================================================================
exports.updateGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const group = await PurchasingGroup.findByPk(id, { transaction: t });
    if (!group) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Group name cannot be empty' });
      }
      const dup = await PurchasingGroup.findOne({
        where: { id: { [Op.ne]: group.id }, name: { [Op.iLike]: name.trim() } },
        transaction: t,
      });
      if (dup) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          error: `A group named "${name.trim()}" already exists`,
        });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) updates.description = description?.trim() || null;

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      updates.status = status;
    }

    await group.update(updates, { transaction: t });
    await t.commit();

    const complete = await PurchasingGroup.findByPk(group.id, { include: [MEMBER_INCLUDE] });
    res.json({ success: true, message: 'Group updated successfully', data: toDto(complete) });
  } catch (error) {
    await t.rollback();
    console.error('❌ updateGroup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 5. DELETE
// ================================================================
exports.deleteGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const group = await PurchasingGroup.findByPk(req.params.id, { transaction: t });
    if (!group) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    await group.destroy({ transaction: t });
    await t.commit();

    res.json({ success: true, message: `Group "${group.code}" deleted successfully` });
  } catch (error) {
    await t.rollback();
    console.error('❌ deleteGroup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 6. AVAILABLE USERS
// ================================================================
exports.listAvailableUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { search = '' } = req.query;

    const group = await PurchasingGroup.findByPk(id, { attributes: ['id'] });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    const currentMembers = await PurchasingGroupMember.findAll({
      where: { groupId: id },
      attributes: ['userId'],
    });
    const excludeIds = currentMembers.map((m) => m.userId);

    const where = { isActive: true };
    if (excludeIds.length > 0) where.userId = { [Op.notIn]: excludeIds };

    if (search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { username: { [Op.iLike]: `%${q}%` } },
        { fullName: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ['userId', 'username', 'fullName', 'email', 'isActive'],
      include: [
        { model: Role, attributes: ['roleId', 'name'] },
        { model: Department, attributes: ['departmentId', 'name', 'code'] },
      ],
      order: [['fullName', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        items: users.map((u) => ({
          userId: u.userId,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          department: u.Department?.name ?? null,
          role: u.Role?.name ?? 'Member',
        })),
      },
    });
  } catch (error) {
    console.error('❌ listAvailableUsers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 7. SET MEMBERS (replace all)
// ================================================================
exports.setMembers = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { userIds = [] } = req.body;

    if (!Array.isArray(userIds)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'userIds must be an array' });
    }

    const group = await PurchasingGroup.findByPk(id, { transaction: t });
    if (!group) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    if (userIds.length > 0) {
      const users = await User.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: ['userId'],
        transaction: t,
      });
      const existingIds = new Set(users.map((u) => u.userId));
      const missing = userIds.filter((uid) => !existingIds.has(uid));
      if (missing.length > 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: 'Some users do not exist',
          details: { missing },
        });
      }
    }

    await PurchasingGroupMember.destroy({ where: { groupId: id }, transaction: t });

    if (userIds.length > 0) {
      await PurchasingGroupMember.bulkCreate(
        userIds.map((uid) => ({ groupId: parseInt(id, 10), userId: parseInt(uid, 10) })),
        { transaction: t }
      );
    }

    await t.commit();

    const complete = await PurchasingGroup.findByPk(id, { include: [MEMBER_INCLUDE] });

    res.json({
      success: true,
      message: `Members updated for "${group.name}"`,
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ setMembers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 8. ADD MEMBERS (append)
// ================================================================
exports.addMembers = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { userIds = [] } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'userIds must be a non-empty array' });
    }

    const group = await PurchasingGroup.findByPk(id, { transaction: t });
    if (!group) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    for (const uid of userIds) {
      await PurchasingGroupMember.findOrCreate({
        where: { groupId: id, userId: uid },
        defaults: { groupId: id, userId: uid },
        transaction: t,
      });
    }

    await t.commit();

    const complete = await PurchasingGroup.findByPk(id, { include: [MEMBER_INCLUDE] });

    res.json({
      success: true,
      message: `${userIds.length} member(s) added`,
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ addMembers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 9. REMOVE ONE MEMBER
// ================================================================
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const group = await PurchasingGroup.findByPk(id, { attributes: ['id', 'name'] });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    const deleted = await PurchasingGroupMember.destroy({
      where: { groupId: id, userId },
    });

    if (deleted === 0) {
      return res.status(404).json({ success: false, error: 'Member not found in this group' });
    }

    const complete = await PurchasingGroup.findByPk(id, { include: [MEMBER_INCLUDE] });

    res.json({ success: true, message: 'Member removed', data: toDto(complete) });
  } catch (error) {
    console.error('❌ removeMember error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 10. STATS
// ================================================================
exports.getStats = async (_req, res) => {
  try {
    const [total, active, inactive, totalMembers] = await Promise.all([
      PurchasingGroup.count(),
      PurchasingGroup.count({ where: { status: 'active' } }),
      PurchasingGroup.count({ where: { status: 'inactive' } }),
      PurchasingGroupMember.count(),
    ]);

    res.json({ success: true, data: { total, active, inactive, totalMembers } });
  } catch (error) {
    console.error('❌ getStats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};