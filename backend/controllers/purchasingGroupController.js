'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const {
  PurchasingGroup,
  PurchasingGroupMember,
  PurchasingSubgroup,
  PurchasingSubgroupMember,
  WorkflowStage,
  WorkflowStageGroup,
  User,
  Role,
  Department,
} = db;

// ================================================================
// HELPERS
// ================================================================

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

const SUBGROUP_INCLUDE = {
  model: PurchasingSubgroup,
  as: 'subgroups',
  include: [
    {
      model: PurchasingSubgroupMember,
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
    },
  ],
};

// For sequence serialization: hydrate group + its subgroups + member counts
const SEQUENCE_GROUP_INCLUDE = {
  model: PurchasingGroup,
  as: 'group',
  include: [
    {
      model: PurchasingSubgroup,
      as: 'subgroups',
      include: [
        {
          model: PurchasingSubgroupMember,
          as: 'members',
          attributes: ['id'],
        },
      ],
    },
  ],
};

// ================================================================
// SERIALIZERS
// ================================================================

function toMemberDto(m) {
  return {
    id: m.id,
    userId: m.user?.userId ?? m.userId,
    username: m.user?.username,
    fullName: m.user?.fullName,
    email: m.user?.email,
    department: m.user?.Department?.name ?? null,
    role: m.role || m.user?.Role?.name || 'Member',
    isActive: m.user?.isActive,
    joinedAt: m.joined_at || m.joinedAt,
  };
}

function toSubgroupDto(sg) {
  const plain = sg.toJSON ? sg.toJSON() : sg;

  return {
    id: plain.id,
    code: plain.code,
    groupId: plain.groupId,
    name: plain.name,
    description: plain.description,
    status: plain.status,
    createdAt: plain.created_at || plain.createdAt,
    updatedAt: plain.updated_at || plain.updatedAt,
    members: (plain.members ?? []).map(toMemberDto),
  };
}

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
    members: (plain.members ?? []).map(toMemberDto),
    subgroups: (plain.subgroups ?? []).map(toSubgroupDto),
  };
}

// Sequence stage → flat DTO with group summaries
function toSequenceStageDto(stage) {
  const plain = stage.toJSON ? stage.toJSON() : stage;

  return {
    id: plain.id,
    label: plain.label || '',
    orderIndex: plain.orderIndex,
    groups: (plain.groupLinks ?? []).map((link) => {
      const g = link.group || {};
      const subgroups = g.subgroups || [];

      return {
        id: g.id,
        name: g.name,
        code: g.code,
        subgroupCount: subgroups.length,
        memberCount: subgroups.reduce(
          (sum, sg) => sum + ((sg.members || []).length),
          0
        ),
        subgroupNames: subgroups.map((s) => s.name),
      };
    }),
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
      include: [MEMBER_INCLUDE, SUBGROUP_INCLUDE],
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
      include: [MEMBER_INCLUDE, SUBGROUP_INCLUDE],
    });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    res.json({ success: true, data: toDto(group) });
  } catch (error) {
    console.error('❌ getGroupById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 3. CREATE GROUP
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

    const complete = await PurchasingGroup.findByPk(group.id, {
      include: [MEMBER_INCLUDE, SUBGROUP_INCLUDE],
    });

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
// 4. UPDATE GROUP
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

    const complete = await PurchasingGroup.findByPk(group.id, {
      include: [MEMBER_INCLUDE, SUBGROUP_INCLUDE],
    });
    res.json({ success: true, message: 'Group updated successfully', data: toDto(complete) });
  } catch (error) {
    await t.rollback();
    console.error('❌ updateGroup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 5. DELETE GROUP
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
// 6. AVAILABLE USERS (for group-level add)
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
// 7. SET MEMBERS (replace all — group-level)
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

    const complete = await PurchasingGroup.findByPk(id, {
      include: [MEMBER_INCLUDE, SUBGROUP_INCLUDE],
    });

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
// 8. ADD MEMBERS (append — group-level)
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

    const complete = await PurchasingGroup.findByPk(id, {
      include: [MEMBER_INCLUDE, SUBGROUP_INCLUDE],
    });

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
// 9. REMOVE ONE MEMBER (group-level)
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

    const complete = await PurchasingGroup.findByPk(id, {
      include: [MEMBER_INCLUDE, SUBGROUP_INCLUDE],
    });

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
    const [total, active, inactive, totalMembers, totalSubgroups, totalSubgroupMembers] =
      await Promise.all([
        PurchasingGroup.count(),
        PurchasingGroup.count({ where: { status: 'active' } }),
        PurchasingGroup.count({ where: { status: 'inactive' } }),
        PurchasingGroupMember.count(),
        PurchasingSubgroup.count(),
        PurchasingSubgroupMember.count(),
      ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        totalMembers,
        totalSubgroups,
        totalSubgroupMembers,
      },
    });
  } catch (error) {
    console.error('❌ getStats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 11. SUBGROUPS — CREATE
// ================================================================
exports.createSubgroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { groupId } = req.params;
    const { name, description = '', status = 'active' } = req.body;

    if (!name || !name.trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Subgroup name is required' });
    }
    if (!['active', 'inactive'].includes(status)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const group = await PurchasingGroup.findByPk(groupId, { transaction: t });
    if (!group) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Parent group not found' });
    }

    const dup = await PurchasingSubgroup.findOne({
      where: { groupId, name: { [Op.iLike]: name.trim() } },
      transaction: t,
    });
    if (dup) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        error: `A subgroup named "${name.trim()}" already exists in this group`,
      });
    }

    const code = await PurchasingSubgroup.generateCode(groupId, t);

    const subgroup = await PurchasingSubgroup.create(
      {
        code,
        groupId,
        name: name.trim(),
        description: description.trim() || null,
        status,
      },
      { transaction: t }
    );

    await t.commit();

    const complete = await PurchasingSubgroup.findByPk(subgroup.id, {
      include: [
        {
          model: PurchasingSubgroupMember,
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
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Subgroup created successfully',
      data: toSubgroupDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ createSubgroup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 12. SUBGROUPS — UPDATE
// ================================================================
exports.updateSubgroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { groupId, subgroupId } = req.params;
    const { name, description, status } = req.body;

    const subgroup = await PurchasingSubgroup.findOne({
      where: { id: subgroupId, groupId },
      transaction: t,
    });
    if (!subgroup) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Subgroup not found' });
    }

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Name cannot be empty' });
      }
      const dup = await PurchasingSubgroup.findOne({
        where: {
          id: { [Op.ne]: subgroup.id },
          groupId,
          name: { [Op.iLike]: name.trim() },
        },
        transaction: t,
      });
      if (dup) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          error: `A subgroup named "${name.trim()}" already exists in this group`,
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

    await subgroup.update(updates, { transaction: t });
    await t.commit();

    const complete = await PurchasingSubgroup.findByPk(subgroup.id, {
      include: [
        {
          model: PurchasingSubgroupMember,
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
        },
      ],
    });

    res.json({
      success: true,
      message: 'Subgroup updated successfully',
      data: toSubgroupDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ updateSubgroup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 13. SUBGROUPS — DELETE
// ================================================================
exports.deleteSubgroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { groupId, subgroupId } = req.params;

    const subgroup = await PurchasingSubgroup.findOne({
      where: { id: subgroupId, groupId },
      transaction: t,
    });
    if (!subgroup) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Subgroup not found' });
    }

    await subgroup.destroy({ transaction: t });
    await t.commit();

    res.json({
      success: true,
      message: `Subgroup "${subgroup.code}" deleted successfully`,
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ deleteSubgroup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 14. SUBGROUP MEMBERS — AVAILABLE USERS
// ================================================================
exports.listAvailableSubgroupUsers = async (req, res) => {
  try {
    const { groupId, subgroupId } = req.params;
    const { search = '' } = req.query;

    const subgroup = await PurchasingSubgroup.findOne({
      where: { id: subgroupId, groupId },
      attributes: ['id'],
    });
    if (!subgroup) {
      return res.status(404).json({ success: false, error: 'Subgroup not found' });
    }

    const taken = await PurchasingSubgroupMember.findAll({
      where: { groupId },
      attributes: ['userId'],
    });
    const excludeIds = taken.map((m) => m.userId);

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
    console.error('❌ listAvailableSubgroupUsers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 15. SUBGROUP MEMBERS — ADD (append)
// ================================================================
exports.addSubgroupMembers = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { groupId, subgroupId } = req.params;
    const { userIds = [] } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'userIds must be a non-empty array' });
    }

    const subgroup = await PurchasingSubgroup.findOne({
      where: { id: subgroupId, groupId },
      transaction: t,
    });
    if (!subgroup) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Subgroup not found' });
    }

    const conflicts = await PurchasingSubgroupMember.findAll({
      where: {
        groupId,
        userId: { [Op.in]: userIds },
      },
      include: [{ model: PurchasingSubgroup, as: 'subgroup', attributes: ['id', 'name'] }],
      transaction: t,
    });

    const blocking = conflicts.filter(
      (c) => Number(c.subgroupId) !== Number(subgroupId)
    );
    if (blocking.length > 0) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        error: 'Some users already belong to another subgroup in this group',
        details: {
          conflicts: blocking.map((c) => ({
            userId: c.userId,
            subgroup: c.subgroup?.name ?? null,
          })),
        },
      });
    }

    for (const uid of userIds) {
      await PurchasingSubgroupMember.findOrCreate({
        where: { subgroupId, userId: uid },
        defaults: { subgroupId, groupId, userId: uid },
        transaction: t,
      });
    }

    await t.commit();

    const complete = await PurchasingSubgroup.findByPk(subgroupId, {
      include: [
        {
          model: PurchasingSubgroupMember,
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
        },
      ],
    });

    res.json({
      success: true,
      message: `${userIds.length} member(s) added`,
      data: toSubgroupDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ addSubgroupMembers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 16. SUBGROUP MEMBERS — REMOVE ONE
// ================================================================
exports.removeSubgroupMember = async (req, res) => {
  try {
    const { groupId, subgroupId, userId } = req.params;

    const deleted = await PurchasingSubgroupMember.destroy({
      where: { subgroupId, groupId, userId },
    });

    if (deleted === 0) {
      return res
        .status(404)
        .json({ success: false, error: 'Member not found in this subgroup' });
    }

    const complete = await PurchasingSubgroup.findByPk(subgroupId, {
      include: [
        {
          model: PurchasingSubgroupMember,
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
        },
      ],
    });

    res.json({
      success: true,
      message: 'Member removed',
      data: toSubgroupDto(complete),
    });
  } catch (error) {
    console.error('❌ removeSubgroupMember error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 17. SEQUENCE — GET
//     GET /api/purchasing-groups/sequence
// ================================================================
exports.getSequence = async (_req, res) => {
  try {
    const stages = await WorkflowStage.findAll({
      order: [['order_index', 'ASC']],
      include: [
        {
          model: WorkflowStageGroup,
          as: 'groupLinks',
          include: [SEQUENCE_GROUP_INCLUDE],
        },
      ],
    });

    res.json({
      success: true,
      data: { items: stages.map(toSequenceStageDto) },
    });
  } catch (error) {
    console.error('❌ getSequence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 18. SEQUENCE — SAVE (replace all stages)
//     PUT /api/purchasing-groups/sequence
// ================================================================
exports.saveSequence = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { stages = [] } = req.body;

    if (!Array.isArray(stages)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'stages must be an array',
      });
    }

    // ── Validate: no group appears twice across stages ──
    const seen = new Map(); // groupId → stage index
    for (let i = 0; i < stages.length; i++) {
      for (const g of stages[i].groups || []) {
        if (seen.has(g.id)) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            error: `Group "${g.name}" appears in Stage ${seen.get(g.id) + 1} and Stage ${i + 1}. A group can only belong to one stage.`,
          });
        }
        seen.set(g.id, i);
      }
    }

    // ── Optional: verify every group id exists ──
    const allGroupIds = [...seen.keys()];
    if (allGroupIds.length > 0) {
      const existing = await PurchasingGroup.findAll({
        where: { id: { [Op.in]: allGroupIds } },
        attributes: ['id'],
        transaction: t,
      });
      const existingSet = new Set(existing.map((g) => g.id));
      const missing = allGroupIds.filter((id) => !existingSet.has(id));
      if (missing.length > 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Some group ids do not exist`,
          details: { missing },
        });
      }
    }

    // ── Wipe and rebuild ──
    await WorkflowStageGroup.destroy({ where: {}, transaction: t });
    await WorkflowStage.destroy({ where: {}, transaction: t });

    for (let i = 0; i < stages.length; i++) {
      const inputStage = stages[i];

      const stage = await WorkflowStage.create(
        {
          label: (inputStage.label || '').trim(),
          orderIndex: i + 1,
        },
        { transaction: t }
      );

      const groups = (inputStage.groups || []).filter(
        (g) => g && typeof g.id === 'number'
      );

      if (groups.length > 0) {
        await WorkflowStageGroup.bulkCreate(
          groups.map((g) => ({ stageId: stage.id, groupId: g.id })),
          { transaction: t }
        );
      }
    }

    await t.commit();

    // ── Reload and return ──
    const reloaded = await WorkflowStage.findAll({
      order: [['order_index', 'ASC']],
      include: [
        {
          model: WorkflowStageGroup,
          as: 'groupLinks',
          include: [SEQUENCE_GROUP_INCLUDE],
        },
      ],
    });

    res.json({
      success: true,
      message: `Saved ${stages.length} stage(s)`,
      data: { items: reloaded.map(toSequenceStageDto) },
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ saveSequence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};