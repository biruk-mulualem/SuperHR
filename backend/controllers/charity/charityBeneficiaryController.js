'use strict';
const {
  CharityBeneficiary, CharityTeam, CharitySetting, CharityLog,
  Employee, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const paginate = (page, size) => {
  const limit  = Math.min(parseInt(size)  || 10, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;
  return { limit, offset };
};

const benIncludes = [
  { model: CharityTeam, as: 'team', attributes: ['teamId', 'name'] },
  { model: User,        as: 'creator', attributes: ['userId', 'fullName'] },
];

// Log helper
const logAction = async (action, module, targetId, details, userId) => {
  try {
    await CharityLog.create({ action, module, targetId, details, userId });
  } catch (err) {
    console.error('Charity Log Error:', err);
  }
};

// Resolve team for teamleader
const getTeamForLeader = async (userId) => {
  const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
  if (!emp) return null;
  const team = await CharityTeam.findOne({
    where: {
      isActive: true,
      [Op.or]: [
        { head: emp.employeeId },
        { vice: emp.employeeId },
        { members: { [Op.contains]: [emp.employeeId] } },
      ],
    },
    attributes: ['teamId'],
  });
  return team ? team.teamId : null;
};

// ─── READ ────────────────────────────────────────────────────────────────────

exports.getBeneficiaries = async (req, res) => {
  try {
    const { page, size, search, isActive, teamId } = req.query;
    const { limit, offset } = paginate(page, size);

    let where = {};
    if (search)              where.fullname = { [Op.iLike]: `%${search}%` };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    // Authorization & Scoping
    if (['admin', 'charity_admin'].includes(req.user.role)) {
      if (teamId) where.teamId = parseInt(teamId);
    } else if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (!leaderTeamId) {
        return res.json({ success: true, data: [], pagination: { totalItems: 0, totalPages: 0, currentPage: 1, pageSize: limit } });
      }
      where.teamId = leaderTeamId;
    } else {
      return res.status(403).json({ success: false, error: 'Unauthorized role' });
    }

    const { count, rows } = await CharityBeneficiary.findAndCountAll({
      where, include: benIncludes, limit, offset,
      order: [['fullname', 'ASC']], distinct: true,
    });

    res.json({
      success: true, data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    console.error('getBeneficiaries:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBeneficiaryById = async (req, res) => {
  try {
    const ben = await CharityBeneficiary.findByPk(req.params.id, { include: benIncludes });
    if (!ben) return res.status(404).json({ success: false, error: 'Beneficiary not found' });

    // Auth check for teamleader
    if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (ben.teamId !== leaderTeamId) {
        return res.status(403).json({ success: false, error: 'Access denied to this beneficiary' });
      }
    }

    res.json({ success: true, data: ben });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────

exports.createBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { fullname, fullInfo, teamId, monthlyAllocation, paymentMethod, bankInfo, isSpecialCase } = req.body;
    
    if (!fullname?.trim() || !teamId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'fullname and teamId are mandatory' });
    }

    if (paymentMethod === 'bank' && (!bankInfo || !bankInfo.account_no || !bankInfo.bank)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Bank account number and bank name are required' });
    }

    // Role Logic
    let assignedTeamId = parseInt(teamId);
    if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (!leaderTeamId) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'You are not assigned to any team' });
      }
      assignedTeamId = leaderTeamId; // Force their team
    }

    // Get defaults from settings
    const settings = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });
    const defaults = settings?.defaults || { monthly_allocation: 3000, payment_method: 'bank', beneficiaries_special_cases: [] };

    const ben = await CharityBeneficiary.create({
      fullname,
      fullInfo: fullInfo || {},
      teamId: assignedTeamId,
      monthlyAllocation: monthlyAllocation !== undefined ? monthlyAllocation : defaults.monthly_allocation,
      paymentMethod: paymentMethod || defaults.payment_method,
      bankInfo,
      isSpecialCase,
      isActive: true,
      createdBy: req.user.userId
    }, { transaction: t });

    await logAction('CREATE', 'beneficiary', ben.beneficiaryId, { fullname }, req.user.userId);

    await t.commit();
    res.status(201).json({ success: true, data: ben });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── EDIT ────────────────────────────────────────────────────────────────────

exports.updateBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

    // Auth check for teamleader
    if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (ben.teamId !== leaderTeamId) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const fields = ['fullname', 'fullInfo', 'teamId', 'monthlyAllocation', 'paymentMethod', 'bankInfo', 'isActive', 'isSpecialCase'];
    const updates = { updatedBy: req.user.userId };
    
    fields.forEach(k => {
      if (req.body[k] !== undefined) {
        // Teamleader can't change teamId through normal update (transfer has separate logic or is for admins)
        if (k === 'teamId' && req.user.role === 'charity_teamleader') return;
        updates[k] = req.body[k];
      }
    });

    if (updates.paymentMethod === 'bank' && (!updates.bankInfo || !updates.bankInfo.account_no || !updates.bankInfo.bank)) {
      // If paymentMethod is becoming 'bank' or is already 'bank', we need full bankInfo
      const currentBankInfo = updates.bankInfo || ben.bankInfo;
      if (!currentBankInfo || !currentBankInfo.account_no || !currentBankInfo.bank) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Bank account number and bank name are required' });
      }
    }

    await ben.update(updates, { transaction: t });
    await logAction('UPDATE', 'beneficiary', ben.beneficiaryId, updates, req.user.userId);

    await t.commit();
    res.json({ success: true, data: ben });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

exports.deleteBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Only admin/charity_admin
    if (!['admin', 'charity_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Only admins can delete beneficiaries' });
    }

    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

    await ben.update({ deletedBy: req.user.userId }, { transaction: t });
    await ben.destroy({ transaction: t }); // Soft delete
    
    await logAction('DELETE', 'beneficiary', ben.beneficiaryId, { fullname: ben.fullname }, req.user.userId);

    await t.commit();
    res.json({ success: true, message: 'Beneficiary deleted successfully' });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── TRANSFER ────────────────────────────────────────────────────────────────

exports.transferBeneficiary = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { targetTeamId } = req.body;
    if (!targetTeamId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'targetTeamId is required' });
    }

    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

    if (!ben.isActive) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot transfer an inactive beneficiary' });
    }

    // Auth check
    if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (ben.teamId !== leaderTeamId) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const oldTeamId = ben.teamId;
    await ben.update({ teamId: targetTeamId, updatedBy: req.user.userId }, { transaction: t });
    
    await logAction('TRANSFER', 'beneficiary', ben.beneficiaryId, { from: oldTeamId, to: targetTeamId }, req.user.userId);

    await t.commit();
    res.json({ success: true, message: 'Beneficiary transferred successfully', data: ben });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── ADJUSTMENTS ─────────────────────────────────────────────────────────────

exports.addAdjustment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { type, amount, reason } = req.body; // type: 'Deduct' | 'increase'
    if (!type || !amount || !reason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'type, amount, and reason are required' });
    }

    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

    if (!ben.isActive) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot add adjustment for an inactive beneficiary' });
    }

    // Auth check
    if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (ben.teamId !== leaderTeamId) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const adjId = Date.now(); // Simple ID
    const newAdj = {
      adjustment_id: adjId,
      type,
      reason,
      amount: parseFloat(amount),
      created_by: req.user.userId,
      created_at: new Date()
    };

    const adjustments = [...(ben.adjustments || []), newAdj];
    
    // Update monthly_allocation
    let newAllocation = parseFloat(ben.monthlyAllocation);
    if (type === 'Deduct') {
      newAllocation -= parseFloat(amount);
    } else if (type === 'increase') {
      newAllocation += parseFloat(amount);
    }

    await ben.update({
      adjustments,
      monthlyAllocation: newAllocation,
      updatedBy: req.user.userId
    }, { transaction: t });

    await logAction('ADJUSTMENT', 'beneficiary', ben.beneficiaryId, newAdj, req.user.userId);

    await t.commit();
    res.json({ success: true, data: ben });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELIVERIES ──────────────────────────────────────────────────────────────

exports.addDelivery = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { distribution_release_id, is_delivered, recipt, is_returned } = req.body;
    if (!distribution_release_id) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'distribution_release_id is required' });
    }

    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

    if (!ben.isActive) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot add delivery for an inactive beneficiary' });
    }

    // Auth check
    if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (ben.teamId !== leaderTeamId) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    // Check for duplicate delivery for this distribution release
    const existing = (ben.deliveries || []).find(d => d.distribution_release_id === distribution_release_id && !d.deleted_at);
    if (existing) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Delivery already exists for this distribution release' });
    }

    // Get distribution release info from settings
    const settings = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });
    const releaseInfo = (settings?.distributionRelease || []).find(r => r.distribution_release_id === distribution_release_id);
    
    if (!releaseInfo) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid distribution_release_id' });
    }

    const newDelivery = {
      delivery_id: Date.now(),
      distribution_release_id,
      distribution_release_date: releaseInfo.date,
      distribution_release_payment_for_indays: releaseInfo.payment_for_indays || 30,
      amount: ben.monthlyAllocation,
      is_delivered: is_delivered || false,
      is_returned: is_delivered ? null : (is_returned || null),
      recipt: recipt || null,
      created_by: req.user.userId,
      created_at: new Date(),
      updated_by: req.user.userId,
      updated_at: new Date()
    };
    // Mutual exclusivity check
    if (newDelivery.is_delivered) newDelivery.is_returned = null;
    else if (newDelivery.is_returned && newDelivery.is_returned.reason) newDelivery.is_delivered = false;

    const deliveries = [...(ben.deliveries || []), newDelivery];

    await ben.update({ deliveries, updatedBy: req.user.userId }, { transaction: t });
    
    await logAction('DELIVERY', 'beneficiary', ben.beneficiaryId, newDelivery, req.user.userId);

    await t.commit();
    res.json({ success: true, data: ben });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateDelivery = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { deliveryId } = req.params;
    const { is_delivered, recipt, is_returned } = req.body;

    const ben = await CharityBeneficiary.findByPk(req.params.id, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

    if (!ben.isActive) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot update delivery for an inactive beneficiary' });
    }

    // Auth check
    if (req.user.role === 'charity_teamleader') {
      const leaderTeamId = await getTeamForLeader(req.user.userId);
      if (ben.teamId !== leaderTeamId) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    let deliveries = [...(ben.deliveries || [])];
    const index = deliveries.findIndex(d => String(d.delivery_id) === String(deliveryId));
    
    if (index === -1) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Delivery record not found' });
    }

    // Mutual exclusivity check
    const nextDelivered = is_delivered !== undefined ? is_delivered : deliveries[index].is_delivered;
    const nextReturned = is_returned !== undefined ? is_returned : deliveries[index].is_returned;

    deliveries[index] = {
      ...deliveries[index],
      is_delivered: nextDelivered,
      recipt: recipt !== undefined ? recipt : deliveries[index].recipt,
      is_returned: nextDelivered ? null : nextReturned,
      updated_by: req.user.userId,
      updated_at: new Date()
    };
    if (deliveries[index].is_returned && deliveries[index].is_returned.reason) {
      deliveries[index].is_delivered = false;
    }

    await ben.update({ deliveries, updatedBy: req.user.userId }, { transaction: t });
    
    await logAction('UPDATE_DELIVERY', 'beneficiary', ben.beneficiaryId, deliveries[index], req.user.userId);

    await t.commit();
    res.json({ success: true, data: ben });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── BULK OPERATIONS ─────────────────────────────────────────────────────────

exports.bulkAddDelivery = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { beneficiaryIds, distribution_release_id, is_delivered, recipt, is_returned } = req.body;

    if (!Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0 || !distribution_release_id) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'beneficiaryIds and distribution_release_id are required' });
    }

    // Get release info
    const settings = await CharitySetting.findOne({ where: { settingKey: 'main' }, transaction: t });
    const releaseInfo = (settings?.distributionRelease || []).find(r => r.distribution_release_id === distribution_release_id);
    if (!releaseInfo) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid distribution_release_id' });
    }

    const beneficiaries = await CharityBeneficiary.findAll({
      where: { beneficiaryId: { [Op.in]: beneficiaryIds } },
      transaction: t
    });

    if (beneficiaries.length !== beneficiaryIds.length) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'One or more selected beneficiary IDs are invalid' });
    }

    const inactiveNames = beneficiaries.filter(b => !b.isActive).map(b => b.fullname);
    if (inactiveNames.length > 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Cannot process inactive beneficiaries: ${inactiveNames.join(', ')}` });
    }

    const alreadyDelivered = beneficiaries.filter(ben => 
      (ben.deliveries || []).some(d => d.distribution_release_id === distribution_release_id && !d.deleted_at)
    ).map(b => b.fullname);

    if (alreadyDelivered.length > 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `The following beneficiaries already have a delivery record for this release: ${alreadyDelivered.join(', ')}` });
    }

    const now = new Date();
    const results = [];

    for (const ben of beneficiaries) {
      const newDelivery = {
        delivery_id: Date.now() + Math.floor(Math.random() * 1000), // Randomize slightly for bulk
        distribution_release_id,
        distribution_release_date: releaseInfo.date,
        distribution_release_payment_for_indays: releaseInfo.payment_for_indays || 30,
        amount: ben.monthlyAllocation,
        is_delivered: is_delivered || false,
        is_returned: is_delivered ? null : (is_returned || null),
        recipt: recipt || null,
        created_by: req.user.userId,
        created_at: now,
        updated_by: req.user.userId,
        updated_at: now
      };

      // Mutual exclusivity check
      if (newDelivery.is_delivered) newDelivery.is_returned = null;
      else if (newDelivery.is_returned && newDelivery.is_returned.reason) newDelivery.is_delivered = false;

      const deliveries = [...(ben.deliveries || []), newDelivery];
      await ben.update({ deliveries, updatedBy: req.user.userId }, { transaction: t });
      results.push(ben.beneficiaryId);
    }

    await logAction('BULK_DELIVERY', 'beneficiary', null, { 
      count: results.length, 
      releaseId: distribution_release_id,
      releaseDate: releaseInfo.date,
      isDelivered: is_delivered
    }, req.user.userId);

    await t.commit();
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.bulkAddAdjustment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { beneficiaryIds, type, amount, reason } = req.body;

    if (!Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0 || !type || !amount || !reason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const beneficiaries = await CharityBeneficiary.findAll({
      where: { beneficiaryId: { [Op.in]: beneficiaryIds }, isActive: true },
      transaction: t
    });

    const now = new Date();
    const results = [];

    for (const ben of beneficiaries) {
      const adjId = Date.now() + Math.floor(Math.random() * 1000);
      const newAdj = {
        adjustment_id: adjId,
        type,
        reason,
        amount: parseFloat(amount),
        created_by: req.user.userId,
        created_at: now
      };

      const adjustments = [...(ben.adjustments || []), newAdj];
      
      let newAllocation = parseFloat(ben.monthlyAllocation);
      if (type === 'Deduct') newAllocation -= parseFloat(amount);
      else if (type === 'increase') newAllocation += parseFloat(amount);

      await ben.update({
        adjustments,
        monthlyAllocation: newAllocation,
        updatedBy: req.user.userId
      }, { transaction: t });
      
      results.push(ben.beneficiaryId);
    }

    await logAction('BULK_ADJUSTMENT', 'beneficiary', null, { 
      count: results.length, 
      type, 
      amount,
      reason
    }, req.user.userId);

    await t.commit();
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.bulkUpdateBeneficiaries = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { beneficiaryIds, updates } = req.body; // updates: { teamId, paymentMethod, monthlyAllocation, fullInfo, isActive }

    if (!Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0 || !updates) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'beneficiaryIds and updates are required' });
    }

    const beneficiaries = await CharityBeneficiary.findAll({
      where: { beneficiaryId: { [Op.in]: beneficiaryIds } },
      transaction: t
    });

    const fields = ['teamId', 'paymentMethod', 'bankInfo', 'monthlyAllocation', 'isActive', 'isSpecialCase'];
    const results = [];

    for (const ben of beneficiaries) {
      const benUpdates = { updatedBy: req.user.userId };
      
      fields.forEach(f => {
        if (updates[f] !== undefined && updates[f] !== null && updates[f] !== '') {
          // Teamleader can't bulk change teamId
          if (f === 'teamId' && req.user.role === 'charity_teamleader') return;
          benUpdates[f] = updates[f];
        }
      });

      if (updates.fullInfo) {
        const mergedFullInfo = { ...(ben.fullInfo || {}) };
        if (updates.fullInfo.location) mergedFullInfo.location = { ...(mergedFullInfo.location || {}), ...updates.fullInfo.location };
        if (updates.fullInfo.contact) mergedFullInfo.contact = { ...(mergedFullInfo.contact || {}), ...updates.fullInfo.contact };
        benUpdates.fullInfo = mergedFullInfo;
      }

      await ben.update(benUpdates, { transaction: t });
      results.push(ben.beneficiaryId);
    }

    await logAction('BULK_UPDATE', 'beneficiary', null, { 
      count: results.length, 
      appliedUpdates: updates 
    }, req.user.userId);

    await t.commit();
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};
