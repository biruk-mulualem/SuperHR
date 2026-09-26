// controllers/Mobile/mobileGroupController.js
'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
  PostGroup,
  PostGroupMember,
  PostGroupPost,
  PostGroupAuditLog,
  User,
  MobileNotification,
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
// NOTIFICATION HELPERS — LOUD for debugging
// ================================================================
const safeNotify = async (fn) => {
  try {
    const result = await fn();
    console.log('✅ safeNotify succeeded, id:', result?.id ?? '(none)');
    return result;
  } catch (e) {
    console.error('❌ group notification FAILED');
    console.error('   name:    ', e.name);
    console.error('   message: ', e.message);
    if (e.errors?.length) {
      console.error('   validation errors:');
      e.errors.forEach((err) =>
        console.error(
          '     -',
          err.path,
          '|',
          err.message,
          '| value:',
          err.value
        )
      );
    }
    console.error('   stack:');
    console.error(e.stack);
    throw e;
  }
};

// Returns active member userIds, excluding the actor(s).
const getGroupMemberIdsExcept = async (groupId, excludeIds = []) => {
  const excludeSet = new Set(
    (Array.isArray(excludeIds) ? excludeIds : [excludeIds])
      .filter((id) => id != null)
      .map((id) => String(id))
  );

  const rows = await PostGroupMember.findAll({
    where: { groupId, status: 'active' },
    attributes: ['userId'],
    raw: true,
  });

  return rows
    .map((r) => r.userId)
    .filter((id) => !excludeSet.has(String(id)));
};

// ================================================================
// 1. LIST GROUPS
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

    const groupIds = rows.map((g) => g.id);

    let pendingMap = {};

    if (groupIds.length > 0) {
      try {
        const counts = await PostGroupPost.findAll({
          attributes: [
            'groupId',
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'cnt'],
          ],
          where: {
            groupId: { [Op.in]: groupIds },
            status: 'pending',
          },
          group: ['groupId'],
          raw: true,
        });
        pendingMap = counts.reduce((acc, r) => {
          acc[r.groupId] = Number(r.cnt) || 0;
          return acc;
        }, {});
      } catch (e) {
        console.warn('pending count query failed:', e.message);
      }
    }

    res.json({
      success: true,
      data: {
        items: rows.map((g) => ({
          ...groupDto(g, g.members),
          pendingCount: pendingMap[g.id] || 0,
        })),
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
      (m) =>
        Number(m.userId) === Number(userId) &&
        (m.status === 'active' || m.status === 'pending')
    );
    if (!member) {
      return res.status(403).json({ success: false, error: 'Not a member' });
    }

    res.json({
      success: true,
      data: {
        ...groupDto(g, g.members),
        myStatus: member.status,
      },
    });
  } catch (err) {
    console.error('❌ getGroup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 3. CREATE GROUP
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
//    ← UPDATED: notifies all active members (except owner) on BOTH
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

    const previousStatus = g.status;

    await g.update({ status, lastActivity: new Date() });
    await audit({
      actorId: userId,
      action: `group.${status}`,
      targetType: 'group',
      targetId: g.id,
      groupId: g.id,
    });

    // Notify only when the status actually changed
    if (status !== previousStatus) {
      await safeNotify(async () => {
        const recipientIds = await getGroupMemberIdsExcept(g.id, [userId]);
        if (recipientIds.length === 0) return;

        const isDeactivating = status === 'inactive';

        await MobileNotification.notifyMany(recipientIds, {
          purchaseType: 'posts',
          type: isDeactivating
            ? 'posts.group_deactivated'
            : 'posts.group_activated',
          title: isDeactivating ? '⏸ Group deactivated' : '▶ Group activated',
          body: isDeactivating
            ? `"${g.name}" was deactivated. Only the owner can reactivate it.`
            : `"${g.name}" was reactivated. You can post again.`,
          referenceId: g.id,
          referenceType: 'post_group',
          metadata: { groupId: g.id, groupName: g.name },
        });
      });
    }

    res.json({ success: true, data: groupDto(g) });
  } catch (err) {
    console.error('❌ setGroupStatus:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 6. DELETE GROUP
//    DELETE /api/mobile/groups/:id  { confirm: "Name" }
//    ← UPDATED: notifies all active members (except owner)
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

    // Snapshot recipients BEFORE destroying
    const groupName = g.name;
    const groupId = g.id;
    const recipientIds = await getGroupMemberIdsExcept(groupId, [userId]);

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

    // Notify all members except the owner
    await safeNotify(async () => {
      if (recipientIds.length === 0) return;

      await MobileNotification.notifyMany(recipientIds, {
        purchaseType: 'posts',
        type: 'posts.group_deleted',
        title: '🗑️ Group deleted',
        body: `"${groupName}" was deleted by its owner.`,
        referenceId: groupId,
        referenceType: 'post_group',
        metadata: { groupId, groupName },
      });
    });

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
//    ← UPDATED: notifies new owner + remaining members
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

    // Snapshot data for notifications
    const groupName = g.name;
    const leaver = await User.findByPk(userId, { attributes: USER_ATTRS });
    const leaverName = leaver?.fullName || leaver?.username || 'A member';

    let newOwnerId = null;

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
      newOwnerId = transferTo;
      await newOwner.update({ role: 'owner' }, { transaction: t });
      await g.update(
        { createdBy: transferTo, lastActivity: new Date() },
        { transaction: t }
      );
    }

    // Recipients = active members except the leaver (captured before deletion)
    const remainingIds = await getGroupMemberIdsExcept(groupId, [userId]);

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

    // Notify: new owner (if any) + remaining members
    await safeNotify(async () => {
      if (newOwnerId) {
        await MobileNotification.posts.ownershipTransferred({
          recipientId: newOwnerId,
          groupId: Number(groupId),
          groupName,
          previousOwner: leaverName,
        });
      }

      if (remainingIds.length > 0) {
        await MobileNotification.notifyMany(remainingIds, {
          purchaseType: 'posts',
          type: 'posts.member_left',
          title: '👋 Member left',
          body: `${leaverName} left "${groupName}".`,
          referenceId: Number(groupId),
          referenceType: 'post_group',
          metadata: {
            groupId: Number(groupId),
            groupName,
            memberName: leaverName,
          },
        });
      }
    });

    res.json({ success: true, message: 'Left group' });
  } catch (err) {
    await t.rollback();
    console.error('❌ leaveGroup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 8. LIST MEMBERS
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