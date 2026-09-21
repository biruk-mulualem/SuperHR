// controllers/purchaseFollowUpController.js
'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const {
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseFollowUpPrice,
  PurchaseFollowUpDispatch,
  PurchaseNotification,
} = db;

// ================================================================
// CONSTANTS
// ================================================================

// Statuses that appear in the follow-up list
const FOLLOW_UP_STATUSES = ['approved', 'submitted', 'rejected'];

// Roles that can see EVERY purchase request (not just their own)
const FULL_ACCESS_ROLES = [
  'admin',
  'administrator',
  'superadmin',
  'purchase_organizer',   // 👈 NEW
];

// ================================================================
// HELPERS
// ================================================================

const isAdminRequest = (req) => {
  const user = req.user || {};
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? '').toLowerCase();
  return ['admin', 'administrator', 'superadmin'].includes(role);
};

/**
 * Roles that bypass the "createdBy = me" filter.
 * Admins and purchase organizers can see every PR in the pipeline.
 */
const canViewAllFollowUps = (req) => {
  const user = req.user || {};
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? '').toLowerCase();
  return FULL_ACCESS_ROLES.includes(role);
};

/**
 * Sequelize includes for one purchase request, with items + prices
 * + master item name + dispatched people.
 */
const buildIncludes = ({ includeRemovedPrices = false } = {}) => [
  {
    model: PurchaseRequestItem,
    as: 'items',
    include: [
      {
        model: db.Item,
        as: 'item',
        attributes: ['name'],
        required: false,
      },
      {
        model: PurchaseFollowUpPrice,
        as: 'prices',
        required: false,
        where: includeRemovedPrices ? undefined : { removedAt: null },
      },
    ],
  },
  {
    model: PurchaseFollowUpDispatch,
    as: 'dispatchedTo',
    required: false,
  },
];

/**
 * Flatten a PurchaseRequest into the shape the Vue page expects.
 */
const toFollowUpDto = (pr) => {
  const plain = pr.toJSON ? pr.toJSON() : pr;

  // ------------------------------------------------------------
  // Dispatched people
  // ------------------------------------------------------------
  const dispatchedTo = (plain.dispatchedTo || []).map((d) => ({
    id: d.id,
    userId: d.userId,
    name: d.name,
    department: d.department,
    role: d.role,
    isBoss: d.isBoss,
    message: d.message,
  }));

  // ------------------------------------------------------------
  // Items with prices
  // ------------------------------------------------------------
  const items = (plain.items || []).map((it) => {
    const prices = (it.prices || []).map((p) => ({
      id: p.id,
      employee: p.employee,
      unitPrice: Number(p.unitPrice) || 0,
      totalPrice: Number(p.totalPrice) || 0,
      discount: Number(p.discount) || 0,
      finalPrice: Number(p.finalPrice) || 0,
      matchesRequirement: p.matchesRequirement,
      remark: p.remark,
      notes: p.notes,
      status: p.status,
      isWinner: p.isWinner,
      winnerManuallySelected: p.winnerManuallySelected,
      submittedDate: p.submittedDate,
      submittedById: p.submittedById,
    }));

    const winner = prices.find((p) => p.isWinner) || null;

    let itemStatus = 'pending_bids';
    if (prices.length > 0) {
      const allRejected = prices.every((p) => p.status === 'rejected');
      if (winner) {
        itemStatus = 'submitted';
      } else if (allRejected) {
        itemStatus = 'rejected';
      } else {
        itemStatus = 'bidding';
      }
    }

    return {
      id: it.id,
      requestId: plain.id,
      requestNumber: plain.prNumber,
      itemName: it.item?.name || it.code,
      itemCode: it.code,
      quantity: Number(it.quantity) || 0,
      uom: it.uom,
      baseUom: it.baseUom,
      conversionUom: it.conversionUom,
      brand: it.brand,
      model: it.model,
      specification: it.specification,
      remark: it.remark,
      status: itemStatus,
      hasWinner: !!winner,
      winnerManuallySelected: winner?.winnerManuallySelected || false,
      bids: prices,
    };
  });

  // ------------------------------------------------------------
  // Overall follow-up status
  // ------------------------------------------------------------
  const totalItems = items.length;
  const itemsWithWinner = items.filter((i) => i.hasWinner).length;

  let status = 'pending_bids';
  if (itemsWithWinner === totalItems && totalItems > 0) {
    status = 'submitted';
  } else if (items.some((i) => i.bids.length > 0)) {
    status = 'bidding';
  }

  // Force rejected if the underlying PR is rejected (halted by boss)
  if (plain.status === 'rejected') {
    status = 'rejected';
  }

  // ------------------------------------------------------------
  // Boss decision fields
  // ------------------------------------------------------------
  const bossReviewedAt = plain.bossReviewedAt || null;
  let bossDecision = null;

  if (bossReviewedAt) {
    if (plain.status === 'rejected') {
      bossDecision = 'declined';
    } else if (plain.status === 'approved') {
      bossDecision = 'approved';
    }
  }

  return {
    // Header info the Vue file reads
    requestId: plain.id,
    requestNumber: plain.prNumber,
    requestedBy: plain.preparedBy,
    department: plain.department,
    departmentId: plain.departmentId,
    requestDate: plain.requestedDate,
    priority: plain.priority,
    status,
    rawStatus: plain.status,
    expertName: plain.expertName,
    preparedBy: plain.preparedBy,
    approvedDate: plain.approvedAt || plain.updatedAt,
    approvedDocFront: plain.approvedDocFront,
    approvedDocFrontName: plain.approvedDocFrontName,
    approvedDocBack: plain.approvedDocBack,
    approvedDocBackName: plain.approvedDocBackName,

    // Boss decision
    bossReviewedAt,
    bossReviewed: !!bossReviewedAt,
    bossDecision,
    bossDeclineReason: plain.declineReason || null,

    // Related data
    dispatchedTo,
    items,

    // Convenience summary
    summary: {
      totalItems,
      itemsWithWinner,
      itemsPending: totalItems - itemsWithWinner,
      totalBids: items.reduce((sum, i) => sum + i.bids.length, 0),
      totalWinningAmount: items.reduce(
        (sum, i) => sum + (i.bids.find((b) => b.isWinner)?.finalPrice || 0),
        0,
      ),
    },
  };
};

// ================================================================
// 1. LIST
//    GET /api/purchase-follow-ups
// ================================================================
exports.listFollowUps = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      department = 'all',
      priority = 'all',
      bossDecision = 'all',
      sortBy = 'updated_at',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    // ------------------------------------------------------------
    // Status filter
    // ------------------------------------------------------------
    const where = {};
    if (!status || status === 'all') {
      where.status = { [Op.in]: FOLLOW_UP_STATUSES };
    } else {
      where.status = status;
    }

    // 👇 Only scope to own PRs if the user can't see everything
    if (!canViewAllFollowUps(req)) {
      where.createdById = req.user?.userId ?? -1;
    }

    if (department && department !== 'all') where.department = department;
    if (priority && priority !== 'all') where.priority = priority;

    // Boss decision filter
    if (bossDecision === 'pending') {
      where.bossReviewedAt = null;
    } else if (bossDecision === 'approved') {
      where.bossReviewedAt = { [Op.ne]: null };
      where.status = 'approved';
    } else if (bossDecision === 'declined') {
      where.bossReviewedAt = { [Op.ne]: null };
      where.status = 'rejected';
    }

    if (search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { prNumber: { [Op.iLike]: `%${q}%` } },
        { department: { [Op.iLike]: `%${q}%` } },
        { expertName: { [Op.iLike]: `%${q}%` } },
        { preparedBy: { [Op.iLike]: `%${q}%` } },
        { '$items.item.name$': { [Op.iLike]: `%${q}%` } },
        { '$items.code$': { [Op.iLike]: `%${q}%` } },
      ];
    }

    const sortMap = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      requestDate: 'requested_date',
      priority: 'priority',
    };
    const sortColumn = sortMap[sortBy] || 'updated_at';

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      order: [[sortColumn, sortOrder.toUpperCase()]],
      offset,
      limit: pageSize,
      distinct: true,
      include: buildIncludes(),
    });

    res.json({
      success: true,
      data: {
        items: rows.map(toFollowUpDto),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listFollowUps error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list purchase follow-ups',
    });
  }
};

// ================================================================
// 2. GET ONE
// ================================================================
exports.getFollowUp = async (req, res) => {
  try {
    const { prId } = req.params;

    const pr = await PurchaseRequest.findByPk(prId, {
      include: buildIncludes(),
    });

    if (!pr) {
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    if (
      !canViewAllFollowUps(req) &&
      Number(pr.createdById) !== Number(req.user?.userId)
    ) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this follow-up',
      });
    }

    res.json({ success: true, data: toFollowUpDto(pr) });
  } catch (error) {
    console.error('❌ getFollowUp error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 3. SUBMIT PRICE
// ================================================================
exports.submitPrice = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { itemId } = req.params;
    const {
      employee,
      unitPrice,
      discount = 0,
      matchesRequirement = true,
      remark = null,
      notes = null,
    } = req.body;

    if (!employee || String(employee).trim() === '') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Employee name is required' });
    }

    const unit = Number(unitPrice);
    if (!Number.isFinite(unit) || unit <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Unit price must be greater than 0' });
    }

    if (matchesRequirement === false && !remark) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Remark is required when the item does not match the requirement',
      });
    }

    const item = await PurchaseRequestItem.findByPk(itemId, {
      include: [
        {
          model: PurchaseFollowUpPrice,
          as: 'prices',
          required: false,
          where: { removedAt: null },
        },
      ],
      transaction: t,
    });

    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const quantity = Number(item.quantity) || 0;
    const disc = Number(discount) || 0;
    const totalPrice = Number((unit * quantity).toFixed(2));
    const finalPrice = Number(Math.max(0, totalPrice - disc).toFixed(2));

    const existingPrices = item.prices || [];

    const manualWinner = existingPrices.find((p) => p.isWinner && p.winnerManuallySelected);
    let shouldBeWinner = false;

    if (!manualWinner && matchesRequirement === true) {
      const matchPrices = existingPrices.filter(
        (p) => p.matchesRequirement === true && !p.removedAt
      );
      const lowestMatch = matchPrices.length
        ? Math.min(...matchPrices.map((p) => Number(p.finalPrice)))
        : Infinity;
      shouldBeWinner = finalPrice < lowestMatch;
    }

    const newPrice = await PurchaseFollowUpPrice.create(
      {
        purchaseRequestItemId: item.id,
        employee: String(employee).trim(),
        submittedById: req.user?.userId ?? null,
        unitPrice: unit,
        totalPrice,
        discount: disc,
        finalPrice,
        matchesRequirement,
        remark,
        notes,
        isWinner: shouldBeWinner,
        winnerManuallySelected: false,
        status: shouldBeWinner ? 'accepted' : 'pending',
        submittedDate: new Date(),
      },
      { transaction: t }
    );

    if (shouldBeWinner) {
      await PurchaseFollowUpPrice.update(
        { isWinner: false, status: 'rejected' },
        {
          where: {
            purchaseRequestItemId: item.id,
            id: { [Op.ne]: newPrice.id },
            isWinner: true,
          },
          transaction: t,
        }
      );
    }

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(item.requestId, {
      include: buildIncludes(),
    });

    res.status(201).json({
      success: true,
      message: 'Price submitted successfully',
      data: toFollowUpDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ submitPrice error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit price',
    });
  }
};

// ================================================================
// 4. EDIT PRICE
// ================================================================
exports.updatePrice = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { priceId } = req.params;
    const {
      unitPrice,
      discount = 0,
      matchesRequirement = true,
      remark = null,
      notes = null,
    } = req.body;

    const price = await PurchaseFollowUpPrice.findByPk(priceId, {
      include: [
        {
          model: PurchaseRequestItem,
          as: 'purchaseRequestItem',
          attributes: ['id', 'quantity', 'requestId'],
        },
      ],
      transaction: t,
    });

    if (!price) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Price not found' });
    }

    if (price.removedAt) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Price has been removed' });
    }

    // ✅ Only admin OR the original submitter can edit a price
    if (
      !isAdminRequest(req) &&
      Number(price.submittedById) !== Number(req.user?.userId)
    ) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You can only edit prices you submitted',
      });
    }

    const unit = Number(unitPrice);
    if (!Number.isFinite(unit) || unit <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Unit price must be greater than 0' });
    }

    if (matchesRequirement === false && !remark) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Remark is required when the item does not match the requirement',
      });
    }

    const quantity = Number(price.purchaseRequestItem.quantity) || 0;
    const disc = Number(discount) || 0;
    const totalPrice = Number((unit * quantity).toFixed(2));
    const finalPrice = Number(Math.max(0, totalPrice - disc).toFixed(2));

    const updates = {
      unitPrice: unit,
      totalPrice,
      discount: disc,
      finalPrice,
      matchesRequirement,
      remark,
      notes,
    };

    if (price.isWinner && matchesRequirement === false) {
      updates.isWinner = false;
      updates.status = 'rejected';
    }

    await price.update(updates, { transaction: t });

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(price.purchaseRequestItem.requestId, {
      include: buildIncludes(),
    });

    res.json({
      success: true,
      message: 'Price updated successfully',
      data: toFollowUpDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ updatePrice error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update price',
    });
  }
};

// ================================================================
// 5. REMOVE PRICE (soft-delete)
// ================================================================
exports.removePrice = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { priceId } = req.params;
    const { remark = null } = req.body || {};

    const price = await PurchaseFollowUpPrice.findByPk(priceId, {
      include: [
        {
          model: PurchaseRequestItem,
          as: 'purchaseRequestItem',
          attributes: ['id', 'requestId'],
        },
      ],
      transaction: t,
    });

    if (!price) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Price not found' });
    }

    if (price.removedAt) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Price already removed' });
    }

    // ✅ Only admin OR the original submitter can remove a price
    if (
      !isAdminRequest(req) &&
      Number(price.submittedById) !== Number(req.user?.userId)
    ) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You can only remove prices you submitted',
      });
    }

    const wasWinner = price.isWinner;
    const requestItemId = price.purchaseRequestItemId;
    const requestId = price.purchaseRequestItem.requestId;

    await price.update(
      {
        removedAt: new Date(),
        removedById: req.user?.userId ?? null,
        removedRemark: remark,
        isWinner: false,
        status: 'rejected',
      },
      { transaction: t }
    );

    if (wasWinner) {
      const remaining = await PurchaseFollowUpPrice.findAll({
        where: {
          purchaseRequestItemId: requestItemId,
          removedAt: null,
          matchesRequirement: true,
        },
        order: [['finalPrice', 'ASC']],
        transaction: t,
      });

      if (remaining.length > 0) {
        await remaining[0].update(
          { isWinner: true, status: 'accepted' },
          { transaction: t }
        );
      }
    }

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(requestId, {
      include: buildIncludes(),
    });

    res.json({
      success: true,
      message: 'Price removed',
      data: toFollowUpDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ removePrice error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove price',
    });
  }
};

// ================================================================
// 6. SELECT WINNER
// ================================================================
exports.selectWinner = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { itemId } = req.params;
    const { priceId, reason = null } = req.body;

    if (!priceId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'priceId is required' });
    }

    const item = await PurchaseRequestItem.findByPk(itemId, { transaction: t });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const targetPrice = await PurchaseFollowUpPrice.findOne({
      where: {
        id: priceId,
        purchaseRequestItemId: item.id,
        removedAt: null,
      },
      transaction: t,
    });

    if (!targetPrice) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Price not found for this item',
      });
    }

    await PurchaseFollowUpPrice.update(
      { isWinner: false, status: 'rejected' },
      {
        where: {
          purchaseRequestItemId: item.id,
          removedAt: null,
          id: { [Op.ne]: targetPrice.id },
        },
        transaction: t,
      }
    );

    await targetPrice.update(
      {
        isWinner: true,
        winnerManuallySelected: true,
        status: 'accepted',
        notes: reason
          ? `${targetPrice.notes || ''}\n[Manual winner override] ${reason}`.trim()
          : targetPrice.notes,
      },
      { transaction: t }
    );

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(item.requestId, {
      include: buildIncludes(),
    });

    res.json({
      success: true,
      message: '🏆 Winner updated',
      data: toFollowUpDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ selectWinner error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to select winner',
    });
  }
};

// ================================================================
// 7. SET DISPATCH LIST
// ================================================================
exports.setDispatches = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { prId } = req.params;
    const { dispatchedTo = [], remark = null } = req.body;

    if (!Array.isArray(dispatchedTo)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'dispatchedTo must be an array',
      });
    }

    if (dispatchedTo.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'At least one recipient is required',
      });
    }

    const pr = await PurchaseRequest.findByPk(prId, { transaction: t });
    if (!pr) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    // 👇 Organizers/admins can dispatch any PR; others only their own
    if (
      !canViewAllFollowUps(req) &&
      Number(pr.createdById) !== Number(req.user?.userId)
    ) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to dispatch this request',
      });
    }

    const previousDispatches = await PurchaseFollowUpDispatch.findAll({
      where: { purchaseRequestId: pr.id },
      transaction: t,
    });

    const previousUserIds = new Set(
      previousDispatches
        .map((d) => Number(d.userId))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    await PurchaseFollowUpDispatch.destroy({
      where: { purchaseRequestId: pr.id },
      transaction: t,
    });

    await PurchaseFollowUpDispatch.bulkCreate(
      dispatchedTo.map((d) => ({
        purchaseRequestId: pr.id,
        userId: d.userId ?? null,
        name: String(d.name || '').trim(),
        department: d.department ?? null,
        role: d.role ?? null,
        isBoss: !!d.isBoss,
        message: d.message ?? null,
      })),
      { transaction: t }
    );

    const actorUserId = Number(req.user?.userId) || null;

    const isNewRecipient = (d) => {
      const uid = Number(d.userId);
      if (!Number.isFinite(uid) || uid <= 0) return false;
      if (uid === actorUserId) return false;
      if (previousUserIds.has(uid)) return false;
      return true;
    };

    const bossRows = dispatchedTo.filter(
      (d) => d.isBoss === true && isNewRecipient(d)
    );

    const otherRows = dispatchedTo.filter(
      (d) => d.isBoss !== true && isNewRecipient(d)
    );

    const sharedRemark = remark ? String(remark).trim() : null;

    const notificationRows = [];

    for (const d of bossRows) {
      const uid = Number(d.userId);
      const customMessage = d.message ? String(d.message).trim() : null;

      let body = `Request ${pr.prNumber} from ${pr.department || 'the team'} is waiting for your review. Please check it out for us.`;

      if (customMessage) {
        body += `\n\n📩 Message: ${customMessage}`;
      }

      notificationRows.push({
        user_id: uid,
        purchase_type: 'local',
        type: 'dispatch_boss',
        title: '📋 Request Ready for Your Review',
        body,
        reference_id: pr.id,
        reference_type: 'purchase_request',
        metadata: {
          requestNumber: pr.prNumber,
          department: pr.department || null,
          priority: pr.priority || null,
          requestedBy: pr.preparedBy || null,
          actorUserId,
          isBoss: true,
          customMessage,
        },
        is_read: false,
      });
    }

    for (const d of otherRows) {
      const uid = Number(d.userId);

      let body = `Request ${pr.prNumber} has been assigned to you.`;

      if (sharedRemark) {
        body += `\n\n📩 Note: ${sharedRemark}`;
      }

      notificationRows.push({
        user_id: uid,
        purchase_type: 'local',
        type: 'dispatch',
        title: '📤 New Purchase Request',
        body,
        reference_id: pr.id,
        reference_type: 'purchase_request',
        metadata: {
          requestNumber: pr.prNumber,
          department: pr.department || null,
          priority: pr.priority || null,
          requestedBy: pr.preparedBy || null,
          actorUserId,
          isBoss: false,
          sharedRemark,
        },
        is_read: false,
      });
    }

    if (notificationRows.length > 0) {
      await PurchaseNotification.bulkCreate(notificationRows, {
        transaction: t,
      });
    }

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(pr.id, {
      include: buildIncludes(),
    });

    res.json({
      success: true,
      message: '📤 Dispatch list updated',
      data: toFollowUpDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ setDispatches error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update dispatch list',
    });
  }
};

// ================================================================
// 8. REMOVE ONE DISPATCH
// ================================================================
exports.removeDispatch = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    const row = await PurchaseFollowUpDispatch.findByPk(id, { transaction: t });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Dispatch entry not found' });
    }

    const prId = row.purchaseRequestId;
    await row.destroy({ transaction: t });
    await t.commit();

    const fresh = await PurchaseRequest.findByPk(prId, {
      include: buildIncludes(),
    });

    res.json({
      success: true,
      message: 'Recipient removed',
      data: toFollowUpDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ removeDispatch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove recipient',
    });
  }
};

// ================================================================
// 9. STATS
// ================================================================
exports.getFollowUpStats = async (req, res) => {
  try {
    const baseWhere = { status: { [Op.in]: FOLLOW_UP_STATUSES } };

    // 👇 Organizers/admins see stats across everything
    if (!canViewAllFollowUps(req)) {
      baseWhere.createdById = req.user?.userId ?? -1;
    }

    const [totalPRs, submittedPRs, rejectedPRs, bossApprovedPRs] =
      await Promise.all([
        PurchaseRequest.count({ where: baseWhere }),
        PurchaseRequest.count({
          where: { ...baseWhere, status: 'submitted' },
        }),
        PurchaseRequest.count({
          where: { ...baseWhere, status: 'rejected' },
        }),
        PurchaseRequest.count({
          where: {
            ...baseWhere,
            status: 'approved',
            bossReviewedAt: { [Op.ne]: null },
          },
        }),
      ]);

    const biddingItemCount = await PurchaseRequestItem.count({
      distinct: true,
      col: 'id',
      include: [
        {
          model: PurchaseFollowUpPrice,
          as: 'prices',
          required: true,
          where: { removedAt: null },
        },
        {
          model: PurchaseRequest,
          as: 'request',
          required: true,
          where: baseWhere,
          attributes: [],
        },
      ],
    });

    const winnerItemCount = await PurchaseRequestItem.count({
      distinct: true,
      col: 'id',
      include: [
        {
          model: PurchaseFollowUpPrice,
          as: 'prices',
          required: true,
          where: { removedAt: null, isWinner: true },
        },
        {
          model: PurchaseRequest,
          as: 'request',
          required: true,
          where: baseWhere,
          attributes: [],
        },
      ],
    });

    const totalItems = await PurchaseRequestItem.count({
      distinct: true,
      col: 'id',
      include: [
        {
          model: PurchaseRequest,
          as: 'request',
          required: true,
          where: baseWhere,
          attributes: [],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        totalRequests: totalPRs,
        submittedRequests: submittedPRs,
        rejectedRequests: rejectedPRs,
        bossApprovedRequests: bossApprovedPRs,
        totalItems,
        biddingItems: biddingItemCount,
        winnerItems: winnerItemCount,
      },
    });
  } catch (error) {
    console.error('❌ getFollowUpStats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 10. SEND TO BOSS
// ================================================================
exports.sendToBoss = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { prId } = req.params;
    const { message = null } = req.body || {};

    const pr = await PurchaseRequest.findByPk(prId, {
      include: buildIncludes(),
      transaction: t,
    });

    if (!pr) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    // 👇 Organizers/admins can send any PR to boss; others only their own
    if (
      !canViewAllFollowUps(req) &&
      Number(pr.createdById) !== Number(req.user?.userId)
    ) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to send this request',
      });
    }

    const dto = toFollowUpDto(pr);

    const totalItems = dto.items.length;
    const winnerItems = dto.items.filter((i) => i.hasWinner).length;
    const pendingItems = totalItems - winnerItems;

    if (winnerItems === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'No item has a winner yet. Submit at least one price first.',
      });
    }

    const totalWinningAmount = dto.items.reduce((sum, i) => {
      const winner = i.bids.find((b) => b.isWinner);
      return sum + (winner?.finalPrice || 0);
    }, 0);

    let boss = null;

    const managerRole = await db.Role.findOne({
      where: { name: 'manager' },
      attributes: ['roleId'],
      transaction: t,
    });

    if (managerRole) {
      boss = await db.User.findOne({
        where: { isActive: true, roleId: managerRole.roleId },
        transaction: t,
      });
    }

    if (!boss) {
      const adminRole = await db.Role.findOne({
        where: { name: 'admin' },
        attributes: ['roleId'],
        transaction: t,
      });

      if (adminRole) {
        boss = await db.User.findOne({
          where: { isActive: true, roleId: adminRole.roleId },
          transaction: t,
        });
      }
    }

    if (!boss) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'No manager or admin user found to send to',
      });
    }

    const actorName =
      req.user?.fullName || req.user?.username || 'Someone';

    let body = `${actorName} has sent you ${winnerItems} item(s) from request ${dto.requestNumber} for approval.\n\n`;
    body += `💰 Total winning amount: ETB ${totalWinningAmount.toFixed(2)}\n`;

    if (pendingItems > 0) {
      body += `⏳ ${pendingItems} item(s) still have no price and will be skipped.\n`;
    }

    if (message) {
      body += `\n📩 Message: ${String(message).trim()}`;
    }

    await PurchaseNotification.create(
      {
        user_id: boss.userId,
        purchase_type: 'local',
        type: 'approval_request',
        title: '📨 Prices Submitted for Approval',
        body,
        reference_id: dto.requestId,
        reference_type: 'purchase_request',
        metadata: {
          requestNumber: dto.requestNumber,
          department: dto.department,
          priority: dto.priority,
          totalItems,
          winnerItems,
          pendingItems,
          totalWinningAmount,
          message: message || null,
          actorUserId: req.user?.userId ?? null,
        },
        is_read: false,
      },
      { transaction: t }
    );

    // Reset the boss's review marker — the boss needs to look at this again
    await pr.update(
      {
        status: 'submitted',
        bossReviewedAt: null,
      },
      { transaction: t }
    );

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(pr.id, {
      include: buildIncludes(),
    });

    res.json({
      success: true,
      message: `📨 Sent to ${boss.fullName || boss.username}`,
      data: toFollowUpDto(fresh),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ sendToBoss error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send to boss',
    });
  }
};