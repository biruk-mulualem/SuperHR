'use strict';
const {
  CharityTeam, CharityBeneficiary, CharityLog,
  Employee, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const paginate = (page, size) => {
  const limit  = Math.min(parseInt(size)  || 10, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;
  return { limit, offset };
};

const teamIncludes = [
  { model: Employee, as: 'headMember', attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode'] },
  { model: Employee, as: 'viceMember', attributes: ['employeeId', 'firstName', 'lastName', 'employeeCode'] },
  { model: User,     as: 'creator', attributes: ['userId', 'username', 'fullName'] },
];

const logAction = async (action, module, targetId, details, userId) => {
  try {
    await CharityLog.create({ action, module, targetId, details, userId });
  } catch (err) {
    console.error('Charity Log Error:', err);
  }
};

const getTeamForLeader = async (userId) => {
  const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
  if (!emp) return null;
  return CharityTeam.findOne({
    where: {
      [Op.or]: [
        { head: emp.employeeId },
        { vice: emp.employeeId },
        { members: { [Op.contains]: [emp.employeeId] } },
      ],
    },
  });
};

// ─── READ ────────────────────────────────────────────────────────────────────

exports.getTeams = async (req, res) => {
  try {
    const { page, size, search, isActive } = req.query;
    const { limit, offset } = paginate(page, size);
    const where = {};

    if (search)              where.name     = { [Op.iLike]: `%${search}%` };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (req.user.role === 'charity_teamleader') {
      const team = await getTeamForLeader(req.user.userId);
      where.teamId = team ? team.teamId : -1;
    } else if (!['admin', 'charity_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Unauthorized role' });
    }

    const { count, rows } = await CharityTeam.findAndCountAll({
      where, 
      include: teamIncludes,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM charity_beneficiaries AS beneficiaries
              WHERE
                beneficiaries.team_id = "CharityTeam"."team_id"
                AND beneficiaries.deleted_at IS NULL
            )`),
            'beneficiaryCount'
          ]
        ]
      },
      limit, offset,
      order: [['created_at', 'DESC']], 
      distinct: true
    });

    res.json({
      success: true, data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    console.error('getTeams:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await CharityTeam.findByPk(req.params.id, {
      include: [
        ...teamIncludes,
        { model: CharityBeneficiary, as: 'beneficiaries',
          attributes: ['beneficiaryId', 'fullname', 'isActive'],
          where: { isActive: true }, required: false },
      ],
    });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    // Auth check
    if (req.user.role === 'charity_teamleader') {
      const leaderTeam = await getTeamForLeader(req.user.userId);
      if (!leaderTeam || leaderTeam.teamId !== team.teamId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────

exports.createTeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Only admin/charity_admin
    if (!['admin', 'charity_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only admins can create teams' });
    }

    const { name, description, head, vice, members } = req.body;
    if (!name?.trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'name is required' });
    }

    const team = await CharityTeam.create(
      { name, description, head, vice, members: members || [],
        isActive: true, createdBy: req.user.userId },
      { transaction: t }
    );

    await logAction('CREATE', 'team', team.teamId, { name }, req.user.userId);

    await t.commit();
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── EDIT ────────────────────────────────────────────────────────────────────

exports.updateTeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const team = await CharityTeam.findByPk(req.params.id, { transaction: t });
    if (!team) { await t.rollback(); return res.status(404).json({ success: false, error: 'Team not found' }); }

    // Auth check
    if (req.user.role === 'charity_teamleader') {
      const leaderTeam = await getTeamForLeader(req.user.userId);
      if (!leaderTeam || leaderTeam.teamId !== team.teamId) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const fields = ['name', 'description', 'head', 'vice', 'members', 'isActive'];
    const updates = { updatedBy: req.user.userId };
    fields.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await team.update(updates, { transaction: t });

    // ─── Cascade Status Sync ────────────────────────────────────────────────
    // If the team's isActive status was explicitly changed
    if (updates.isActive !== undefined) {
      await CharityBeneficiary.update(
        { isActive: updates.isActive, updatedBy: req.user.userId },
        { where: { teamId: team.teamId }, transaction: t }
      );
    }

    await logAction('UPDATE', 'team', team.teamId, updates, req.user.userId);

    await t.commit();
    res.json({ success: true, data: team });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

exports.deleteTeam = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Only admin/charity_admin
    if (!['admin', 'charity_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only admins can delete teams' });
    }

    const team = await CharityTeam.findByPk(req.params.id, { transaction: t });
    if (!team) { await t.rollback(); return res.status(404).json({ success: false, error: 'Team not found' }); }

    await team.update({ deletedBy: req.user.userId }, { transaction: t });
    await team.destroy({ transaction: t }); // Soft delete

    await logAction('DELETE', 'team', team.teamId, { name: team.name }, req.user.userId);

    await t.commit();
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};
