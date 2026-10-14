'use strict';

const { Op } = require('sequelize');
const path = require('path');
const db = require('../models');
const { PurchaseRequest, PurchaseRequestItem } = db;
const { buildFileUrl } = require('../utils/buildFileUrl');

// ================================================================
// HELPERS
// ================================================================

const ITEMS_INCLUDE = {
  model: PurchaseRequestItem,
  as: 'items',
  include: [{ model: db.Item, as: 'item', attributes: ['name'], required: false }],
};

const CREATOR_INCLUDE = {
  model: db.User,
  as: 'createdBy',
  attributes: ['userId', 'fullName', 'username'],
  required: false,
};

const CURRENT_STAGE_INCLUDE = {
  model: db.WorkflowStage,
  as: 'currentStage',
  attributes: ['id', 'label', 'orderIndex'],
  required: false,
};

const buildUploadUrl = (file) => {
  if (!file) return null;
  return buildFileUrl(`/uploads/purchase-requests/approved/${file.filename}`);
};

const isAdminRequest = (req) => {
  const user = req.user || {};
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? '').toLowerCase();
  return role === 'admin' || role === 'administrator' || role === 'superadmin';
};

const toDto = (pr) => {
  const plain = pr.toJSON ? pr.toJSON() : pr;

  const rawPreparedBy = String(plain.preparedBy ?? '').trim();
  const looksLikeId = /^\d+$/.test(rawPreparedBy);

  let preparedByName = null;
  if (looksLikeId) {
    const cb = plain.createdBy;
    preparedByName = cb && String(cb.userId) === rawPreparedBy
      ? (cb.fullName || cb.username || rawPreparedBy)
      : rawPreparedBy;
  } else {
    preparedByName = rawPreparedBy || null;
  }

  return {
    id: plain.id,
    prNumber: plain.prNumber,
    department: plain.department,
    expertName: plain.expertName,
    preparedBy: preparedByName,
    preparedById: rawPreparedBy || null,
    createdById: plain.createdById ?? null,
    requestedDate: plain.requestedDate,
    priority: plain.priority,
    status: plain.status,

    currentStageIndex: plain.currentStageIndex ?? 0,
    currentStageId: plain.currentStageId ?? null,
    currentStage: plain.currentStage
      ? { id: plain.currentStage.id, label: plain.currentStage.label, orderIndex: plain.currentStage.orderIndex }
      : null,
    submittedAt: plain.submittedAt ?? null,
    completedAt: plain.completedAt ?? null,
    rejectedAt: plain.rejectedAt ?? null,
    rejectedByStageIndex: plain.rejectedByStageIndex ?? null,
    rejectedBySubgroupId: plain.rejectedBySubgroupId ?? null,

    items: (plain.items || []).map((it) => ({
      id: it.id,
      code: it.code,
      name: it.item?.name ?? it.code,
      brand: it.brand,
      model: it.model,
      uom: it.uom,
      baseUom: it.baseUom,
      conversionUom: it.conversionUom,
      quantity: it.quantity,
      specification: it.specification,
      remark: it.remark,
    })),

    createdAt: plain.created_at || plain.createdAt,
    updatedAt: plain.updated_at || plain.updatedAt,
    approvedDocFront: plain.approvedDocFront,
    approvedDocFrontName: plain.approvedDocFrontName,
    approvedDocBack: plain.approvedDocBack,
    approvedDocBackName: plain.approvedDocBackName,
  };
};

const findUnknownItemCodes = async (items, transaction) => {
  const codes = items.map((it) => it.code).filter((c) => c != null && String(c).trim() !== '');
  if (codes.length === 0) return [];

  const existing = await db.Item.findAll({
    where: { code: { [Op.in]: codes } },
    attributes: ['code'],
    transaction,
  });
  const existingSet = new Set(existing.map((i) => i.code));
  return codes.filter((c) => !existingSet.has(c));
};

// ================================================================
// APPROVAL WORKFLOW HELPERS (inline)
// ================================================================

async function findUserSubgroupInStage(userId, stageId, transaction = null) {
  if (!stageId || !userId) return null;

  const links = await db.WorkflowStageGroup.findAll({
    where: { stageId },
    attributes: ['groupId'],
    transaction,
  });
  const groupIds = links.map((l) => l.groupId);
  if (groupIds.length === 0) return null;

  const row = await db.PurchasingSubgroupMember.findOne({
    where: { userId, groupId: { [Op.in]: groupIds } },
    attributes: ['subgroupId', 'groupId'],
    transaction,
  });
  if (!row) return null;

  const sg = await db.PurchasingSubgroup.findByPk(row.subgroupId, {
    attributes: ['id', 'status', 'groupId'],
    transaction,
  });
  if (!sg || sg.status !== 'active') return null;

  return { subgroupId: sg.id, groupId: sg.groupId };
}

async function getStageSubgroupIds(stageId, transaction = null) {
  const links = await db.WorkflowStageGroup.findAll({
    where: { stageId },
    attributes: ['groupId'],
    transaction,
  });
  const groupIds = links.map((l) => l.groupId);
  if (groupIds.length === 0) return [];

  const sgs = await db.PurchasingSubgroup.findAll({
    where: { groupId: { [Op.in]: groupIds }, status: 'active' },
    attributes: ['id'],
    transaction,
  });
  return sgs.map((s) => s.id);
}

async function getStageMemberUserIds(stageId, transaction = null) {
  const subgroupIds = await getStageSubgroupIds(stageId, transaction);
  if (subgroupIds.length === 0) return [];

  const rows = await db.PurchasingSubgroupMember.findAll({
    where: { subgroupId: { [Op.in]: subgroupIds } },
    attributes: ['userId'],
    transaction,
  });
  return [...new Set(rows.map((r) => r.userId))];
}

async function notifyUsers(userIds, { requestId, type, title, body }, transaction = null) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) return;

  await db.PurchaseNotification.bulkCreate(
    ids.map((uid) => ({ userId: uid, requestId, type, title, body })),
    { transaction }
  );
}

async function notifyStageMembers(stageId, pr, transaction = null) {
  const userIds = await getStageMemberUserIds(stageId, transaction);
  const bits = [`Stage ${pr.currentStageIndex}`];
  if (pr.department) bits.push(pr.department);
  if (pr.expertName) bits.push(pr.expertName);

  await notifyUsers(userIds, {
    requestId: pr.id,
    type: 'stage_ready',
    title: `PR ${pr.prNumber} needs your approval`,
    body: bits.join(' · '),
  }, transaction);
}

// ================================================================
// 1. LIST
// ================================================================
exports.listPurchaseRequests = async (req, res) => {
  try {
    const {
      page = 1, limit = 10, search = '', status = 'all',
      priority = 'all', department = 'all',
      sortBy = 'created_at', sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    const where = {};
    if (!isAdminRequest(req)) where.createdById = req.user?.userId ?? -1;

    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (department && department !== 'all') where.department = department;

    if (search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { prNumber: { [Op.iLike]: `%${q}%` } },
        { department: { [Op.iLike]: `%${q}%` } },
        { expertName: { [Op.iLike]: `%${q}%` } },
        { '$createdBy.fullName$': { [Op.iLike]: `%${q}%` } },
        { '$createdBy.username$': { [Op.iLike]: `%${q}%` } },
        { '$items.item.name$': { [Op.iLike]: `%${q}%` } },
        { '$items.code$': { [Op.iLike]: `%${q}%` } },
      ];
    }

    const sortMap = {
      createdAt: 'created_at', updatedAt: 'updated_at',
      prNumber: 'pr_number', requestedDate: 'requested_date',
      priority: 'priority', status: 'status',
    };
    const sortColumn = sortMap[sortBy] || 'created_at';

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      order: [[sortColumn, sortOrder.toUpperCase()]],
      offset, limit: pageSize, distinct: true,
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
    });

    res.json({
      success: true,
      data: {
        items: rows.map(toDto),
        total: count, page: pageNum, pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listPurchaseRequests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 2. GET ONE
// ================================================================
exports.getPurchaseRequestById = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
    });
    if (!pr) return res.status(404).json({ success: false, error: 'Purchase request not found' });

    const isOwner = Number(pr.createdById) === Number(req.user?.userId);
    if (!isAdminRequest(req) && !isOwner) {
      const m = pr.currentStageId
        ? await findUserSubgroupInStage(req.user?.userId, pr.currentStageId)
        : null;
      if (!m) return res.status(403).json({ success: false, error: 'Not permitted' });
    }
    res.json({ success: true, data: toDto(pr) });
  } catch (error) {
    console.error('❌ getPurchaseRequestById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 3. CREATE
// ================================================================
exports.createPurchaseRequest = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      department = null, expertName = null,
      preparedBy: clientPreparedBy = null,
      requestedDate = null, priority = 'medium',
      items = [],
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'At least one item is required' });
    }
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid priority' });
    }

    const unknown = await findUnknownItemCodes(items, t);
    if (unknown.length > 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Unknown item code(s): ${unknown.join(', ')}` });
    }

    const prNumber = await PurchaseRequest.generatePRNumber(t);
    const preparedBy = req.user?.userId != null ? String(req.user.userId) : clientPreparedBy || null;

    const pr = await PurchaseRequest.create({
      prNumber, department, expertName, preparedBy,
      requestedDate: requestedDate || new Date().toISOString().split('T')[0],
      priority, status: 'draft',
      currentStageIndex: 0, currentStageId: null,
      createdById: req.user?.userId ?? null,
    }, { transaction: t });

    await PurchaseRequestItem.bulkCreate(
      items.map((it) => ({
        requestId: pr.id, code: it.code,
        brand: it.brand || null, model: it.model || null,
        uom: it.uom, baseUom: it.baseUom || it.uom,
        conversionUom: it.conversionUom || null,
        quantity: it.quantity,
        specification: it.specification || null,
        remark: it.remark || null,
      })),
      { transaction: t }
    );

    await t.commit();
    const complete = await PurchaseRequest.findByPk(pr.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
    });
    res.status(201).json({
      success: true,
      message: 'Purchase request created successfully',
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ createPurchaseRequest error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 4. UPDATE
// ================================================================
exports.updatePurchaseRequest = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { department, expertName, preparedBy, requestedDate, priority, items } = req.body;

    const pr = await PurchaseRequest.findByPk(id, { transaction: t });
    if (!pr) { await t.rollback(); return res.status(404).json({ success: false, error: 'Not found' }); }

    const wasRejected = pr.status === 'rejected';
    const wasApproved = pr.status === 'approved';

    const isAdmin = isAdminRequest(req);
    if (!isAdmin && Number(pr.createdById) !== Number(req.user?.userId)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Not permitted' });
    }

    const updates = {};

    if (wasRejected || wasApproved) {
      updates.status = 'draft';
      updates.currentStageIndex = 0;
      updates.currentStageId = null;
      updates.submittedAt = null;
      updates.completedAt = null;
      updates.rejectedAt = null;
      updates.rejectedByStageIndex = null;
      updates.rejectedBySubgroupId = null;
      updates.approvedAt = null;
      updates.approvedDocFront = null;
      updates.approvedDocFrontName = null;
      updates.approvedDocBack = null;
      updates.approvedDocBackName = null;
    }

    if (department !== undefined) updates.department = department;
    if (expertName !== undefined) updates.expertName = expertName;

    if (isAdmin) {
      if (preparedBy !== undefined) updates.preparedBy = preparedBy;
    } else {
      updates.preparedBy = req.user?.userId != null ? String(req.user.userId) : pr.preparedBy;
    }

    if (requestedDate !== undefined) updates.requestedDate = requestedDate;
    if (priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Invalid priority' });
      }
      updates.priority = priority;
    }

    await pr.update(updates, { transaction: t });

    if (Array.isArray(items)) {
      const unknown = await findUnknownItemCodes(items, t);
      if (unknown.length > 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: `Unknown item code(s): ${unknown.join(', ')}` });
      }
      await PurchaseRequestItem.destroy({ where: { requestId: pr.id }, transaction: t });
      if (items.length > 0) {
        await PurchaseRequestItem.bulkCreate(
          items.map((it) => ({
            requestId: pr.id, code: it.code,
            brand: it.brand || null, model: it.model || null,
            uom: it.uom, baseUom: it.baseUom || it.uom,
            conversionUom: it.conversionUom || null,
            quantity: it.quantity,
            specification: it.specification || null,
            remark: it.remark || null,
          })),
          { transaction: t }
        );
      }
    }

    await t.commit();
    const complete = await PurchaseRequest.findByPk(pr.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
    });
    res.json({
      success: true,
      message: wasRejected || wasApproved
        ? 'Purchase request updated and reverted to draft'
        : 'Purchase request updated successfully',
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ updatePurchaseRequest error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 5. SUBMIT FOR APPROVAL
// ================================================================
exports.submitForApproval = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { prId } = req.body;
    const front = req.files?.approvedDocFront?.[0];
    const back  = req.files?.approvedDocBack?.[0];

    if (!prId)  { await t.rollback(); return res.status(400).json({ success: false, error: 'prId is required' }); }
    if (!front) { await t.rollback(); return res.status(400).json({ success: false, error: 'Front document is required' }); }

    const pr = await PurchaseRequest.findByPk(prId, { transaction: t });
    if (!pr) { await t.rollback(); return res.status(404).json({ success: false, error: 'Not found' }); }

    if (!['draft', 'rejected'].includes(pr.status)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Only draft or rejected requests can be submitted' });
    }

    if (!isAdminRequest(req) && Number(pr.createdById) !== Number(req.user?.userId)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Not permitted' });
    }

    const stageOne = await db.WorkflowStage.findOne({
      order: [['order_index', 'ASC']],
      transaction: t,
    });
    if (!stageOne) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'No approval sequence configured' });
    }

    const stageOneSubgroups = await getStageSubgroupIds(stageOne.id, t);
    if (stageOneSubgroups.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Stage 1 has no subgroups configured — contact an administrator',
      });
    }

    const frontUrl = buildUploadUrl(front);
    const backUrl  = back ? buildUploadUrl(back) : null;

    await pr.update({
      status: 'pending',
      currentStageIndex: 1,
      currentStageId: stageOne.id,
      submittedAt: new Date(),
      completedAt: null,
      rejectedAt: null,
      rejectedByStageIndex: null,
      rejectedBySubgroupId: null,
      approvedDocFront: frontUrl,
      approvedDocFrontName: front.originalname || path.basename(front.filename),
      ...(back && {
        approvedDocBack: backUrl,
        approvedDocBackName: back.originalname || path.basename(back.filename),
      }),
    }, { transaction: t });

    await db.PurchaseRequestApproval.destroy({
      where: { requestId: pr.id },
      transaction: t,
    });

    await notifyStageMembers(stageOne.id, pr, t);

    await t.commit();
    const fresh = await PurchaseRequest.findByPk(pr.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
    });
    res.json({
      success: true,
      message: `${pr.prNumber} submitted — Stage 1 notified`,
      data: toDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ submitForApproval error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 6. DECIDE
// ================================================================
exports.decide = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { decision, comment } = req.body;
    const userId = req.user?.userId;

    if (!['approve', 'reject'].includes(decision)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid decision' });
    }
    if (decision === 'reject' && !String(comment || '').trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const pr = await PurchaseRequest.findByPk(id, { transaction: t });
    if (!pr) { await t.rollback(); return res.status(404).json({ success: false, error: 'Not found' }); }
    if (pr.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Request is not awaiting approval' });
    }

    const membership = await findUserSubgroupInStage(userId, pr.currentStageId, t);
    if (!membership) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You are not a member of any subgroup in the current stage',
      });
    }
    const { groupId, subgroupId } = membership;

    const already = await db.PurchaseRequestApproval.findOne({
      where: { requestId: pr.id, stageId: pr.currentStageId, subgroupId },
      transaction: t,
    });
    if (already) {
      await t.rollback();
      return res.status(409).json({ success: false, error: 'Your subgroup already decided' });
    }

    await db.PurchaseRequestApproval.create({
      requestId: pr.id,
      stageId: pr.currentStageId,
      stageIndex: pr.currentStageIndex,
      groupId,
      subgroupId,
      decidedByUserId: userId,
      decision,
      comment: comment?.trim() || null,
      actedAt: new Date(),
    }, { transaction: t });

    // ---------- REJECT ----------
    if (decision === 'reject') {
      await pr.update({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedByStageIndex: pr.currentStageIndex,
        rejectedBySubgroupId: subgroupId,
      }, { transaction: t });

      await notifyUsers([pr.createdById], {
        requestId: pr.id,
        type: 'rejected',
        title: `PR ${pr.prNumber} was rejected`,
        body: `Rejected at Stage ${pr.currentStageIndex}${comment ? ` — ${comment}` : ''}`,
      }, t);

      await t.commit();
      const fresh = await PurchaseRequest.findByPk(pr.id, {
        include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
      });
      return res.json({ success: true, message: 'Request rejected', data: toDto(fresh) });
    }

    // ---------- APPROVE ----------
    const stageSubgroupIds = await getStageSubgroupIds(pr.currentStageId, t);
    const approvedRows = await db.PurchaseRequestApproval.findAll({
      where: { requestId: pr.id, stageId: pr.currentStageId, decision: 'approve' },
      attributes: ['subgroupId'],
      transaction: t,
    });
    const approvedSet = new Set(approvedRows.map((r) => r.subgroupId));
    const allApproved = stageSubgroupIds.every((sid) => approvedSet.has(sid));

    if (!allApproved) {
      await t.commit();
      const fresh = await PurchaseRequest.findByPk(pr.id, {
        include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
      });
      return res.json({
        success: true,
        message: `Approval recorded (${approvedSet.size}/${stageSubgroupIds.length} subgroups in Stage ${pr.currentStageIndex})`,
        data: toDto(fresh),
      });
    }

    const allStages = await db.WorkflowStage.findAll({
      order: [['order_index', 'ASC']],
      transaction: t,
    });
    const nextStage = allStages[pr.currentStageIndex];

    if (!nextStage) {
      await pr.update({
        status: 'approved',
        completedAt: new Date(),
      }, { transaction: t });

      await notifyUsers([pr.createdById], {
        requestId: pr.id,
        type: 'approved',
        title: `PR ${pr.prNumber} fully approved`,
        body: 'All approval stages complete.',
      }, t);
    } else {
      await pr.update({
        currentStageIndex: pr.currentStageIndex + 1,
        currentStageId: nextStage.id,
      }, { transaction: t });

      await notifyStageMembers(nextStage.id, pr, t);
      await notifyUsers([pr.createdById], {
        requestId: pr.id,
        type: 'advanced',
        title: `PR ${pr.prNumber} advanced to Stage ${pr.currentStageIndex}`,
        body: nextStage.label ? `Now waiting on: ${nextStage.label}` : undefined,
      }, t);
    }

    await t.commit();
    const fresh = await PurchaseRequest.findByPk(pr.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
    });
    res.json({
      success: true,
      message: nextStage ? `Advanced to Stage ${pr.currentStageIndex}` : 'Fully approved',
      data: toDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ decide error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 7. LIST PENDING FOR ME
// ================================================================
// ================================================================

exports.listPendingForMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    // ---------- 1. My subgroup memberships ----------
    const myMemberships = await db.PurchasingSubgroupMember.findAll({
      where: { userId },
      attributes: ['subgroupId', 'groupId'],
    });
    const mySubgroupIds = myMemberships.map((m) => m.subgroupId);
    if (mySubgroupIds.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize, totalPages: 1 },
      });
    }

    // ---------- 2. Keep only active subgroups ----------
    const activeSubs = await db.PurchasingSubgroup.findAll({
      where: { id: mySubgroupIds, status: 'active' },
      attributes: ['id', 'groupId'],
    });
    const activeSubIds = activeSubs.map((s) => s.id);
    if (activeSubIds.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize, totalPages: 1 },
      });
    }

    // ---------- 3. Find stages that contain any of my subgroups ----------
    const groupIds = [...new Set(activeSubs.map((s) => s.groupId))];
    const stageLinks = await db.WorkflowStageGroup.findAll({
      where: { groupId: { [Op.in]: groupIds } },
      attributes: ['stageId'],
    });
    const stageIds = [...new Set(stageLinks.map((l) => l.stageId))];
    if (stageIds.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize, totalPages: 1 },
      });
    }

    // ---------- 4. All pending PRs sitting on those stages ----------
    const candidates = await PurchaseRequest.findAll({
      where: { status: 'pending', currentStageId: { [Op.in]: stageIds } },
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
      order: [['created_at', 'DESC']],
    });
    if (candidates.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize, totalPages: 1 },
      });
    }

    // ---------- 5. Map: stageId → set of my active subgroup ids in that stage ----------
    const stageToMySubs = new Map();
    for (const sid of stageIds) {
      const subs = await getStageSubgroupIds(sid);
      stageToMySubs.set(
        sid,
        new Set(subs.filter((x) => activeSubIds.includes(x)))
      );
    }

    // ---------- 6. Keep any PR where I have at least one subgroup in the current stage ----------
    // This includes PRs my subgroup has already decided on.
    const mine = candidates.filter((pr) => {
      const myStageSubs = stageToMySubs.get(pr.currentStageId) || new Set();
      return myStageSubs.size > 0;
    });

    const total = mine.length;
    const paged = mine.slice(offset, offset + pageSize);

    res.json({
      success: true,
      data: {
        items: paged.map(toDto),
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listPendingForMe error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 8. GET APPROVAL STATUS
// ================================================================
exports.getApprovalStatus = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [CURRENT_STAGE_INCLUDE],
    });
    if (!pr) return res.status(404).json({ success: false, error: 'Not found' });

    if (!pr.currentStageId) {
      return res.json({
        success: true,
        data: {
          stageId: null, stageIndex: 0, stageLabel: 'Draft',
          totalSubgroups: 0, approvedCount: 0, decidedCount: 0,
          subgroups: [], mySubgroupId: null, myDecision: null, futureStages: [],
        },
      });
    }

    const stageId = pr.currentStageId;

    const links = await db.WorkflowStageGroup.findAll({
      where: { stageId },
      attributes: ['groupId'],
      include: [{ model: db.PurchasingGroup, as: 'group', attributes: ['id', 'name', 'code'] }],
    });
    const groupIds = links.map((l) => l.groupId);

    const subgroups = await db.PurchasingSubgroup.findAll({
      where: { groupId: { [Op.in]: groupIds }, status: 'active' },
      attributes: ['id', 'name', 'code', 'groupId'],
      include: [{ model: db.PurchasingGroup, as: 'group', attributes: ['id', 'name'] }],
    });

    const decisions = await db.PurchaseRequestApproval.findAll({
      where: { requestId: pr.id, stageId },
      include: [{
        model: db.User,
        as: 'decidedBy',
        attributes: ['userId', 'fullName', 'username'],
      }],
    });
    const decisionBySub = new Map(decisions.map((d) => [d.subgroupId, d]));

    const myMembership = await findUserSubgroupInStage(req.user?.userId, stageId);
    const mySubgroupId = myMembership?.subgroupId ?? null;
    const myDecision = mySubgroupId
      ? (decisionBySub.get(mySubgroupId)?.decision ?? null)
      : null;

    const subgroupRows = subgroups.map((sg) => {
      const d = decisionBySub.get(sg.id);
      return {
        subgroupId: sg.id,
        subgroupName: sg.name,
        subgroupCode: sg.code,
        groupId: sg.groupId,
        groupName: sg.group?.name ?? null,
        decision: d?.decision ?? null,
        decidedByName: d?.decidedBy?.fullName || d?.decidedBy?.username || null,
        comment: d?.comment ?? null,
        actedAt: d?.actedAt ?? null,
      };
    });

    const approvedCount = subgroupRows.filter((r) => r.decision === 'approve').length;
    const decidedCount = subgroupRows.filter((r) => r.decision !== null).length;

    const allStages = await db.WorkflowStage.findAll({
      order: [['order_index', 'ASC']],
      attributes: ['id', 'label', 'orderIndex'],
    });
    const futureStages = allStages
      .filter((s) => s.orderIndex > pr.currentStageIndex)
      .map((s) => ({ id: s.id, label: s.label, orderIndex: s.orderIndex }));

    res.json({
      success: true,
      data: {
        stageId,
        stageIndex: pr.currentStageIndex,
        stageLabel: pr.currentStage?.label || `Stage ${pr.currentStageIndex}`,
        totalSubgroups: subgroupRows.length,
        approvedCount,
        decidedCount,
        subgroups: subgroupRows,
        mySubgroupId,
        myDecision,
        futureStages,
      },
    });
  } catch (error) {
    console.error('❌ getApprovalStatus error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 9. DELETE
// ================================================================
exports.deletePurchaseRequest = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, { transaction: t });
    if (!pr) { await t.rollback(); return res.status(404).json({ success: false, error: 'Not found' }); }

    if (pr.status === 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot delete an approved purchase request' });
    }

    if (!isAdminRequest(req) && Number(pr.createdById) !== Number(req.user?.userId)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: 'Not permitted' });
    }

    await pr.destroy({ transaction: t });
    await t.commit();

    res.json({ success: true, message: `Purchase request "${pr.prNumber}" deleted` });
  } catch (error) {
    await t.rollback();
    console.error('❌ deletePurchaseRequest error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 10. STATS
// ================================================================
exports.getPurchaseRequestStats = async (req, res) => {
  try {
    const baseWhere = isAdminRequest(req) ? {} : { createdById: req.user?.userId ?? -1 };

    const [total, drafts, pending, approved, rejected] = await Promise.all([
      PurchaseRequest.count({ where: baseWhere }),
      PurchaseRequest.count({ where: { ...baseWhere, status: 'draft' } }),
      PurchaseRequest.count({ where: { ...baseWhere, status: 'pending' } }),
      PurchaseRequest.count({ where: { ...baseWhere, status: 'approved' } }),
      PurchaseRequest.count({ where: { ...baseWhere, status: 'rejected' } }),
    ]);

    res.json({ success: true, data: { total, drafts, pending, approved, rejected } });
  } catch (error) {
    console.error('❌ getPurchaseRequestStats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 11. CHECK BALANCE
// ================================================================
exports.checkBalance = async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    const results = [];

    for (const reqItem of items) {
      const code = String(reqItem.code || '').trim();
      const requestedQty = Number(reqItem.quantity) || 0;
      if (!code) continue;

      const item = await db.Item.findOne({
        where: { code },
        attributes: ['itemId', 'code', 'name', 'standardName'],
        include: [{ model: db.UOM, as: 'uom', attributes: ['id', 'code', 'name'], required: false }],
      });

      if (!item) {
        results.push({
          code, name: code, requestedQuantity: requestedQty,
          hasBalance: false, stores: [], reason: 'Item not found in master items',
        });
        continue;
      }

      const balances = await db.ConvertedBalance.findAll({
        where: { itemId: item.itemId, convertedBalance: { [Op.gt]: 0 } },
        include: [
          { model: db.Store, as: 'store', attributes: ['storeId', 'name', 'code'] },
          { model: db.Group, as: 'group', attributes: ['groupId', 'name', 'code'] },
        ],
      });

      const itemUom = item.uom?.code || null;
      const stores = balances.map((b) => ({
        storeId: b.storeId,
        storeName: b.store?.name || 'Unknown Store',
        storeCode: b.store?.code || '',
        groupId: b.groupId,
        groupName: b.group?.name || 'Unknown Group',
        balance: Number(b.convertedBalance) || 0,
        uom: itemUom,
      }));

      results.push({
        code: item.code,
        name: item.name || item.standardName || item.code,
        requestedQuantity: requestedQty,
        hasBalance: stores.length > 0,
        stores,
      });
    }

    const itemsWithBalance = results.filter((r) => r.hasBalance);

    res.json({
      success: true,
      data: { hasAnyBalance: itemsWithBalance.length > 0, itemsWithBalance, allResults: results },
    });
  } catch (error) {
    console.error('❌ checkBalance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 12. LIST APPROVED
// ================================================================
exports.listApprovedPurchaseRequests = async (req, res) => {
  try {
    const {
      page = 1, limit = 10, search = '',
      priority = 'all', department = 'all',
      dateFrom = '', dateTo = '', dateField = 'updated_at',
      sortBy = 'updated_at', sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    const where = { status: 'approved' };
    if (priority && priority !== 'all') where.priority = priority;
    if (department && department !== 'all') where.department = department;

    const dateColumnMap = {
      created_at: 'created_at', updated_at: 'updated_at',
      approved_at: 'approved_at', requested_date: 'requested_date',
    };
    const dateColumn = dateColumnMap[dateField] || 'updated_at';

    if (dateFrom && dateTo) {
      where[dateColumn] = {
        [Op.gte]: new Date(`${dateFrom}T00:00:00.000Z`),
        [Op.lte]: new Date(`${dateTo}T23:59:59.999Z`),
      };
    } else if (dateFrom) {
      where[dateColumn] = { [Op.gte]: new Date(`${dateFrom}T00:00:00.000Z`) };
    } else if (dateTo) {
      where[dateColumn] = { [Op.lte]: new Date(`${dateTo}T23:59:59.999Z`) };
    }

    if (search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { prNumber: { [Op.iLike]: `%${q}%` } },
        { department: { [Op.iLike]: `%${q}%` } },
        { expertName: { [Op.iLike]: `%${q}%` } },
        { '$createdBy.fullName$': { [Op.iLike]: `%${q}%` } },
        { '$createdBy.username$': { [Op.iLike]: `%${q}%` } },
        { '$items.item.name$': { [Op.iLike]: `%${q}%` } },
        { '$items.code$': { [Op.iLike]: `%${q}%` } },
      ];
    }

    const sortMap = {
      createdAt: 'created_at', updatedAt: 'updated_at',
      approvedAt: 'approved_at', prNumber: 'pr_number',
      requestedDate: 'requested_date', priority: 'priority', status: 'status',
    };
    const sortColumn = sortMap[sortBy] || 'updated_at';

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      order: [[sortColumn, sortOrder.toUpperCase()]],
      offset, limit: pageSize, distinct: true,
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE, CURRENT_STAGE_INCLUDE],
    });

    res.json({
      success: true,
      data: {
        items: rows.map(toDto),
        total: count, page: pageNum, pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listApprovedPurchaseRequests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 13. NOTIFICATIONS — LIST
// ================================================================
exports.listMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const where = { userId };
    if (String(unreadOnly).toLowerCase() === 'true') where.readAt = null;

    const { count, rows } = await db.PurchaseNotification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit: pageSize,
      include: [{
        model: db.PurchaseRequest,
        as: 'request',
        attributes: ['id', 'prNumber', 'status', 'department', 'expertName', 'priority', 'currentStageIndex'],
        required: false,
      }],
    });

    res.json({
      success: true,
      data: {
        items: rows.map((n) => {
          const plain = n.toJSON();
          return {
            id: plain.id,
            type: plain.type,
            title: plain.title,
            body: plain.body,
            readAt: plain.readAt,
            createdAt: plain.created_at || plain.createdAt,
            request: plain.request
              ? {
                  id: plain.request.id,
                  prNumber: plain.request.prNumber,
                  status: plain.request.status,
                  department: plain.request.department,
                  expertName: plain.request.expertName,
                  priority: plain.request.priority,
                  currentStageIndex: plain.request.currentStageIndex,
                }
              : null,
          };
        }),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listMyNotifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 14. NOTIFICATIONS — UNREAD COUNT
// ================================================================
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const count = await db.PurchaseNotification.count({
      where: { userId, readAt: null },
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('❌ getUnreadCount error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 15. NOTIFICATIONS — MARK ONE READ
// ================================================================
exports.markNotificationRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const n = await db.PurchaseNotification.findOne({ where: { id, userId } });
    if (!n) return res.status(404).json({ success: false, error: 'Notification not found' });

    if (!n.readAt) await n.update({ readAt: new Date() });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('❌ markNotificationRead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 16. NOTIFICATIONS — MARK ALL READ
// ================================================================
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const [updated] = await db.PurchaseNotification.update(
      { readAt: new Date() },
      { where: { userId, readAt: null } }
    );
    res.json({ success: true, message: `${updated} notification(s) marked as read` });
  } catch (error) {
    console.error('❌ markAllNotificationsRead error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 17. NOTIFICATIONS — DELETE ONE
// ================================================================
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const deleted = await db.PurchaseNotification.destroy({ where: { id, userId } });
    if (deleted === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('❌ deleteNotification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};