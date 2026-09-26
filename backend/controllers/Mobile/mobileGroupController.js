// controllers/Mobile/mobileGroupController.js
'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
  PostGroup,
  PostGroupMember,
  PostGroupAuditLog,
  User,
  MobileNotification,        // ← NEW
} = db;

// ================================================================
// HELPERS
// ================================================================
const USER_ATTRS = ['userId', 'fullName', 'username'];

const audit = (payload) =>
  PostGroupAuditLog.create(payload).catch((e) =>
    console.error('audit log failed:', e.message)
  );

const isManager = (req) => {
  if (req.user?.isAdmin) return true;
  const r = String(req.user?.role || '').toLowerCase();
  return ['admin', 'administrator', 'superadmin', 'manager'].includes(r);
};

const isOwner = async (groupId, userId) => {
  const g = await PostGroup.findByPk(groupId, { attributes: ['createdBy'] });
  return g && Number(g.createdBy) === Number(userId);
};

const membersInclude = () => ({
  model: PostGroupMember,
  as: 'members',
  include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
});

const memberDto = (m) => ({
  userId: m.userId,
  name: m.user?.fullName || m.user?.username || 'Unknown',
  initials: (m.user?.fullName || '?').slice(0, 2).toUpperCase(),
  department: null,
  role: m.role,
  status: m.status,
  invitedAt: m.invitedAt,
  joinedAt: m.joinedAt,
});

const groupDto = (g, members) => ({
  id: g.id,
  name: g.name,
  description: g.description,
  emoji: g.emoji,
  accent: g.accent,
  status: g.status,
  createdBy: g.createdBy,
  createdAt: g.created_at || g.createdAt,
  lastActivity: g.lastActivity,
  memberCount: members ? members.length : undefined,
  members: members ? members.map(memberDto) : undefined,
});

// ================================================================
// NOTIFICATION HELPER — best-effort, never throws
// ================================================================
const safeNotify = async (fn) => {
  try {
    await fn();
  } catch (e) {
    console.error('❌ group notification failed:', e.message);
  }
};

// ================================================================
// 1. LIST GROUPS
//    GET /api/mobile/groups
// ================================================================

exports.listGroups = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { filter = 'active', search = '', page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const where = { deletedAt: null };
    if (filter === 'active' || filter === 'inactive') where.status = filter;
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: q } },
        { description: { [Op.iLike]: q } },
      ];
    }

    const { count, rows } = await PostGroup.findAndCountAll({
      where,
      include: [
        {
          model: PostGroupMember,
          as: 'members',
          required: true,
          where: { userId, status: 'active' },
          include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
        },
      ],
      order: [['last_activity', 'DESC']],
      offset: (pageNum - 1) * pageSize,
      limit: pageSize,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        items: rows.map((g) => groupDto(g, g.members)),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listGroups:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 2. GET GROUP
//    GET /api/mobile/groups/:id
// ================================================================

exports.getGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const g = await PostGroup.findByPk(req.params.id, {
      include: [membersInclude()],
    });
    if (!g || g.deletedAt) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const member = g.members.find(
      (m) => Number(m.userId) === Number(userId) && m.status === 'active'
    );
    if (!member) {
      return res.status(403).json({ success: false, error: 'Not a member' });
    }

    res.json({ success: true, data: groupDto(g, g.members) });
  } catch (err) {
    console.error('❌ getGroup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 3. CREATE GROUP
//    POST /api/mobile/groups  { name, description?, emoji?, accent? }
// ================================================================
exports.createGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    const { name, description, emoji, accent } = req.body;
    if (!name || !String(name).trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Name required' });
    }

    const group = await PostGroup.create(
      {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        emoji: emoji || '💬',
        accent: accent || '#8B5CF6',
        status: 'active',
        createdBy: userId,
        lastActivity: new Date(),
      },
      { transaction: t }
    );

    await PostGroupMember.create(
      {
        groupId: group.id,
        userId,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
      },
      { transaction: t }
    );

    await audit({
      actorId: userId,
      action: 'group.create',
      targetType: 'group',
      targetId: group.id,
      groupId: group.id,
      metadata: { name: group.name },
    });

    await t.commit();

    const full = await PostGroup.findByPk(group.id, {
      include: [membersInclude()],
    });
    res.status(201).json({ success: true, data: groupDto(full, full.members) });
  } catch (err) {
    await t.rollback();
    console.error('❌ createGroup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 4. UPDATE GROUP
//    PATCH /api/mobile/groups/:id
// ================================================================
exports.updateGroup = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!(await isOwner(req.params.id, userId))) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }
    const g = await PostGroup.findByPk(req.params.id);
    if (!g) return res.status(404).json({ success: false, error: 'Not found' });

    const { name, description, emoji, accent } = req.body;
    await g.update({
      name: name ?? g.name,
      description: description ?? g.description,
      emoji: emoji ?? g.emoji,
      accent: accent ?? g.accent,
      lastActivity: new Date(),
    });
    res.json({ success: true, data: groupDto(g) });
  } catch (err) {
    console.error('❌ updateGroup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 5. SET STATUS
//    POST /api/mobile/groups/:id/activate
//    POST /api/mobile/groups/:id/deactivate
// ================================================================
exports.setGroupStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!(await isOwner(req.params.id, userId))) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }
    const status = req.body.status === 'inactive' ? 'inactive' : 'active';
    const g = await PostGroup.findByPk(req.params.id);
    if (!g) return res.status(404).json({ success: false, error: 'Not found' });

    await g.update({ status, lastActivity: new Date() });
    await audit({
      actorId: userId,
      action: `group.${status}`,
      targetType: 'group',
      targetId: g.id,
      groupId: g.id,
    });
    res.json({ success: true, data: groupDto(g) });
  } catch (err) {
    console.error('❌ setGroupStatus:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 6. DELETE GROUP
//    DELETE /api/mobile/groups/:id  { confirm: "Name" }
// ================================================================
exports.deleteGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    const g = await PostGroup.findByPk(req.params.id, { transaction: t });
    if (!g) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    if (Number(g.createdBy) !== Number(userId)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Owner only' });
    }
    const confirm = String(req.body?.confirm || '').trim();
    if (confirm.toLowerCase() !== g.name.trim().toLowerCase()) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'Confirmation mismatch' });
    }
    await g.update({ deletedAt: new Date() }, { transaction: t });
    await audit({
      actorId: userId,
      action: 'group.delete',
      targetType: 'group',
      targetId: g.id,
      groupId: g.id,
      metadata: { name: g.name },
    });
    await t.commit();
    res.json({ success: true, message: 'Group deleted' });
  } catch (err) {
    await t.rollback();
    console.error('❌ deleteGroup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 7. LEAVE GROUP
//    POST /api/mobile/groups/:id/leave  { transferTo?: userId }
// ================================================================
exports.leaveGroup = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const userId = req.user.userId;
    const groupId = req.params.id;
    const { transferTo } = req.body;

    const g = await PostGroup.findByPk(groupId, { transaction: t });
    if (!g) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const owner = Number(g.createdBy) === Number(userId);

    if (owner) {
      if (!transferTo) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, error: 'transferTo required' });
      }
      const newOwner = await PostGroupMember.findOne({
        where: { groupId, userId: transferTo, status: 'active' },
        transaction: t,
      });
      if (!newOwner) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, error: 'New owner must be active member' });
      }
      await newOwner.update({ role: 'owner' }, { transaction: t });
      await g.update(
        { createdBy: transferTo, lastActivity: new Date() },
        { transaction: t }
      );
    }

    await PostGroupMember.destroy({
      where: { groupId, userId },
      transaction: t,
    });

    await audit({
      actorId: userId,
      action: owner ? 'member.leave.transfer' : 'member.leave',
      targetType: 'member',
      targetId: userId,
      groupId,
      metadata: { transferTo: transferTo || null },
    });

    await t.commit();
    res.json({ success: true, message: 'Left group' });
  } catch (err) {
    await t.rollback();
    console.error('❌ leaveGroup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 8. LIST MEMBERS
//    GET /api/mobile/groups/:id/members?status=active|pending
// ================================================================
exports.listMembers = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { groupId: req.params.id };
    if (status === 'active' || status === 'pending') where.status = status;

    const members = await PostGroupMember.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
      order: [['role', 'DESC'], ['created_at', 'ASC']],
    });
    res.json({ success: true, data: { items: members.map(memberDto) } });
  } catch (err) {
    console.error('❌ listMembers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 9. ADD MEMBER (owner invites user)
//    POST /api/mobile/groups/:id/members  { userId }
//    ← UPDATED: uses MobileNotification.posts.memberInvited helper
// ================================================================
exports.addMember = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const actorId = req.user.userId;
    const groupId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'userId required' });
    }
    if (!(await isOwner(groupId, actorId))) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const existing = await PostGroupMember.findOne({
      where: { groupId, userId },
      transaction: t,
    });
    if (existing) {
      await t.rollback();
      return res
        .status(409)
        .json({ success: false, error: 'Already a member' });
    }

    const group = await PostGroup.findByPk(groupId, { transaction: t });
    if (!group) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: 'Group not found' });
    }

    const member = await PostGroupMember.create(
      {
        groupId,
        userId,
        role: 'member',
        status: 'pending',
        invitedBy: actorId,
        invitedAt: new Date(),
      },
      { transaction: t }
    );

    await PostGroup.update(
      { lastActivity: new Date() },
      { where: { id: groupId }, transaction: t }
    );

    await audit({
      actorId,
      action: 'member.add',
      targetType: 'member',
      targetId: userId,
      groupId,
    });

    await t.commit();

    // ── Notify the invited user (post-commit, best-effort) ──
    const actor = await User.findByPk(actorId, { attributes: USER_ATTRS });
    const inviterName = actor?.fullName || actor?.username || 'Someone';

    await safeNotify(() =>
      MobileNotification.posts.memberInvited({
        recipientId: userId,
        groupId,
        groupName: group.name,
        inviterName,
      })
    );

    const fresh = await PostGroupMember.findByPk(member.id, {
      include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
    });
    res.status(201).json({ success: true, data: memberDto(fresh) });
  } catch (err) {
    await t.rollback();
    console.error('❌ addMember:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 10. REMOVE MEMBER
//     DELETE /api/mobile/groups/:id/members/:userId
//     ← UPDATED: uses MobileNotification.posts.memberRemoved helper
// ================================================================
exports.removeMember = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const actorId = req.user.userId;
    const { id: groupId, userId } = req.params;

    if (!(await isOwner(groupId, actorId))) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const g = await PostGroup.findByPk(groupId, { transaction: t });
    if (!g) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    if (Number(g.createdBy) === Number(userId)) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'Cannot remove owner' });
    }

    const removed = await PostGroupMember.destroy({
      where: { groupId, userId },
      transaction: t,
    });
    if (!removed) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: 'Member not found' });
    }

    await PostGroup.update(
      { lastActivity: new Date() },
      { where: { id: groupId }, transaction: t }
    );

    await audit({
      actorId,
      action: 'member.remove',
      targetType: 'member',
      targetId: userId,
      groupId,
    });

    await t.commit();

    // ── Notify the removed user (post-commit, best-effort) ──
    await safeNotify(() =>
      MobileNotification.posts.memberRemoved({
        recipientId: Number(userId),
        groupId: Number(groupId),
        groupName: g.name,
      })
    );

    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    await t.rollback();
    console.error('❌ removeMember:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 11. LIST USERS — directory for the invite picker
//     GET /api/mobile/groups/users/directory
// ================================================================
exports.listUsersDirectory = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: ['userId', 'fullName', 'username'],
      order: [['full_name', 'ASC']],
      limit: 500,
    });

    res.json({
      success: true,
      data: {
        items: users.map((u) => {
          const name = u.fullName || u.username || 'Unknown';
          return {
            userId: u.userId,
            name,
            initials: name
              .split(/\s+/)
              .filter(Boolean)
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase(),
            department: null,
          };
        }),
      },
    });
  } catch (err) {
    console.error('❌ listUsersDirectory:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 12. ACCEPT INVITATION
//     POST /api/mobile/groups/:id/accept-invite
//     ← NEW — flips pending membership to active, notifies owner
// ================================================================
exports.acceptInvite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.id;

    const membership = await PostGroupMember.findOne({
      where: { groupId, userId, status: 'pending' },
    });
    if (!membership) {
      return res
        .status(404)
        .json({ success: false, error: 'No pending invitation' });
    }

    const group = await PostGroup.findByPk(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, error: 'Group not found' });
    }

    await membership.update({
      status: 'active',
      joinedAt: new Date(),
    });

    await audit({
      actorId: userId,
      action: 'member.accept',
      targetType: 'member',
      targetId: userId,
      groupId,
    });

    // ── Notify the owner that someone accepted (best-effort) ──
    const me = await User.findByPk(userId, { attributes: USER_ATTRS });
    const memberName = me?.fullName || me?.username || 'A user';

    await safeNotify(() =>
      MobileNotification.posts.memberAccepted({
        recipientId: group.createdBy,
        groupId: Number(groupId),
        groupName: group.name,
        memberName,
      })
    );

    res.json({ success: true, message: 'Joined group' });
  } catch (err) {
    console.error('❌ acceptInvite:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 13. DECLINE INVITATION
//     POST /api/mobile/groups/:id/decline-invite
//     ← NEW — removes the pending membership, optionally notifies owner
// ================================================================
exports.declineInvite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.id;

    const membership = await PostGroupMember.findOne({
      where: { groupId, userId, status: 'pending' },
    });
    if (!membership) {
      return res
        .status(404)
        .json({ success: false, error: 'No pending invitation' });
    }

    const group = await PostGroup.findByPk(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, error: 'Group not found' });
    }

    await membership.destroy();

    await audit({
      actorId: userId,
      action: 'member.decline',
      targetType: 'member',
      targetId: userId,
      groupId,
    });

    // ── Notify the owner (best-effort). Set to a soft type so the
    //    owner isn't spammed; comment out if you don't want this at all.
    const me = await User.findByPk(userId, { attributes: USER_ATTRS });
    const declinerName = me?.fullName || me?.username || 'A user';

    await safeNotify(() =>
      MobileNotification.notify({
        userId: group.createdBy,
        purchaseType: 'posts',
        type: 'posts.member_declined',
        title: '🚫 Invitation declined',
        body: `${declinerName} declined your invitation to "${group.name}".`,
        referenceId: group.id,
        referenceType: 'post_group',
        metadata: { groupId: group.id, groupName: group.name, declinerName },
      })
    );

    res.json({ success: true, message: 'Invitation declined' });
  } catch (err) {
    console.error('❌ declineInvite:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};