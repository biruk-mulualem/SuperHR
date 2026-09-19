// controllers/mobileDetailController.js
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
// HELPERS
// ================================================================
const isAdmin = (req) => {
  if (req.user?.isAdmin) return true;
  const r = String(req.user?.role || '').toLowerCase();
  return ['admin', 'administrator', 'superadmin'].includes(r);
};

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Normal';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
};

// ================================================================
// SHARED INCLUDES
// ================================================================
const buildItemInclude = () => ({
  model: PurchaseRequestItem,
  as: 'items',
  include: [
    { model: db.Item, as: 'item', attributes: ['name'], required: false },
    {
      model: PurchaseFollowUpPrice,
      as: 'prices',
      required: false,
      where: { removedAt: null },
    },
  ],
});

const buildPurchaseIncludes = () => [
  buildItemInclude(),
  {
    model: db.User,
    as: 'createdBy',
    attributes: ['userId', 'fullName', 'username', 'email'],
    required: false,
  },
];

// ================================================================
// BOSS MESSAGE HELPER
// ================================================================
const getBossMessage = async (purchaseRequestId) => {
  const row = await PurchaseFollowUpDispatch.findOne({
    where: { purchaseRequestId, isBoss: true },
    attributes: ['message'],
  });
  return row?.message || null;
};

// ================================================================
// DTO — PURCHASE DATA ONLY
// ================================================================
const toPurchaseDto = (pr, bossMessage = null) => {
  const plain = pr.toJSON ? pr.toJSON() : pr;

  // ---------------- Items ----------------
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
      isWinner: p.isWinner,
      winnerManuallySelected: p.winnerManuallySelected,
      status: p.status,
      submittedDate: p.submittedDate,
    }));

    const winner = prices.find((p) => p.isWinner) || null;

    let itemStatus = 'pending_bids';
    if (prices.length > 0) {
      const allRejected = prices.every((p) => p.status === 'rejected');
      if (winner) itemStatus = 'submitted';
      else if (allRejected) itemStatus = 'rejected';
      else itemStatus = 'bidding';
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
      winnerName: winner?.employee || null,
      winningPrice: winner?.finalPrice || 0,
      bidCount: prices.length,
      bids: prices,
    };
  });

  const totalItems = items.length;
  const itemsWithWinner = items.filter((i) => i.hasWinner).length;
  const itemsWithBids = items.filter((i) => i.bidCount > 0).length;
  const itemsPendingBids = items.filter((i) => i.bidCount === 0).length;
  const totalBids = items.reduce((s, i) => s + i.bidCount, 0);
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalWinningAmount = items.reduce(
    (sum, i) => sum + (i.winningPrice || 0),
    0,
  );

  let followUpStatus = 'pending_bids';
  if (itemsWithWinner === totalItems && totalItems > 0) {
    followUpStatus = 'submitted';
  } else if (itemsWithBids > 0) {
    followUpStatus = 'bidding';
  }
  if (plain.status === 'rejected') followUpStatus = 'rejected';

  // ---------------- Boss decision ----------------
  const bossReviewedAt = plain.bossReviewedAt || null;
  let bossDecision = null;
  if (bossReviewedAt) {
    bossDecision = plain.status === 'rejected' ? 'declined' : 'approved';
  }

  return {
    // Header
    id: plain.id,
    requestNumber: plain.prNumber,
    poNumber: plain.poNumber || null,
    requester: plain.createdBy?.fullName || plain.preparedBy || 'N/A',
    department: plain.department || 'N/A',
    date: plain.requestedDate,
    requestedDate: plain.requestedDate,
    priority: capitalize(plain.priority),
    rawPriority: plain.priority,
    reason: plain.reason || null,

    // Message from purchaser to boss
    bossMessage: bossMessage || null,

    // Status
    status: followUpStatus,
    rawStatus: plain.status,

    // Document
    imageUrl:
      plain.approvedDocFront ||
      plain.imageUrl ||
      'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop',
    approvedDocFront: plain.approvedDocFront,
    approvedDocFrontName: plain.approvedDocFrontName,
    approvedDocBack: plain.approvedDocBack,
    approvedDocBackName: plain.approvedDocBackName,

    // 🆕 Boss decision
    bossReviewedAt,
    bossReviewed: !!bossReviewedAt,
    bossDecision,                          // 'approved' | 'declined' | null
    bossDeclineReason: plain.declineReason || null,

    // Items
    items,

    // Purchase summary
    totalItems,
    itemsWithWinner,
    itemsWithBids,
    itemsPendingBids,
    totalBids,
    totalQuantity,
    totalWinningAmount,

    // Timestamps
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
    approvedAt: plain.approvedAt,
  };
};

// ================================================================
// 1. LIST — MANAGER
//    GET /api/mobile/purchase-requests?status=pending
// ================================================================
exports.listPendingApproval = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No user' });
    }

    const { page = 1, limit = 20, search = '', status = 'pending' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const dispatchRows = await PurchaseFollowUpDispatch.findAll({
      where: { userId },
      attributes: ['purchaseRequestId'],
      raw: true,
    });
    const dispatchedPrIds = [
      ...new Set(dispatchRows.map((d) => d.purchaseRequestId)),
    ];

    if (dispatchedPrIds.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: pageNum, pageSize, totalPages: 1 },
      });
    }

    const where = { id: { [Op.in]: dispatchedPrIds } };
    if (status && status !== 'all') {
      where.status = { [Op.in]: ['submitted', 'pending', 'approved'] };
    }

    // 🆕 Only show PRs the boss hasn't reviewed yet
    where.bossReviewedAt = null;

    if (search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { prNumber: { [Op.iLike]: q } },
        { department: { [Op.iLike]: q } },
        { expertName: { [Op.iLike]: q } },
      ];
    }

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      order: [['requested_date', 'DESC']],
      offset,
      limit: pageSize,
      distinct: true,
      include: buildPurchaseIncludes(),
    });

    const items = await Promise.all(
      rows.map(async (row) => {
        const bossMessage = await getBossMessage(row.id);
        return toPurchaseDto(row, bossMessage);
      }),
    );

    res.json({
      success: true,
      data: {
        items,
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listPendingApproval error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 2. GET FULL DETAIL
//    GET /api/mobile/purchase-requests/:id
// ================================================================
exports.getDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const pr = await PurchaseRequest.findByPk(id, {
      include: buildPurchaseIncludes(),
    });

    if (!pr) {
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    const userId = req.user?.userId;
    const admin = isAdmin(req);
    const isCreator = Number(pr.createdById) === Number(userId);

    let isDispatched = false;
    if (!admin && !isCreator) {
      const count = await PurchaseFollowUpDispatch.count({
        where: { purchaseRequestId: pr.id, userId },
      });
      isDispatched = count > 0;
    }

    if (!admin && !isCreator && !isDispatched) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this request',
      });
    }

    const bossMessage = await getBossMessage(pr.id);

    res.json({ success: true, data: toPurchaseDto(pr, bossMessage) });
  } catch (err) {
    console.error('❌ getDetail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 3. GET DETAIL BY PR NUMBER
// ================================================================
exports.getDetailByNumber = async (req, res) => {
  try {
    const { prNumber } = req.params;

    const pr = await PurchaseRequest.findOne({
      where: { prNumber },
      include: buildPurchaseIncludes(),
    });

    if (!pr) {
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    const userId = req.user?.userId;
    const admin = isAdmin(req);
    const isCreator = Number(pr.createdById) === Number(userId);

    let isDispatched = false;
    if (!admin && !isCreator) {
      const count = await PurchaseFollowUpDispatch.count({
        where: { purchaseRequestId: pr.id, userId },
      });
      isDispatched = count > 0;
    }

    if (!admin && !isCreator && !isDispatched) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this request',
      });
    }

    const bossMessage = await getBossMessage(pr.id);

    res.json({ success: true, data: toPurchaseDto(pr, bossMessage) });
  } catch (err) {
    console.error('❌ getDetailByNumber error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 4. APPROVE
// ================================================================
exports.approveRequest = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, { transaction: t });
    if (!pr) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // 🛑 Cannot approve a halted (rejected) request
    if (pr.status === 'rejected') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'This request was halted — cannot approve',
      });
    }

    // ✅ Idempotent — boss already approved
    if (pr.status === 'approved' && pr.bossReviewedAt) {
      await t.rollback();
      const fresh = await PurchaseRequest.findByPk(pr.id, {
        include: buildPurchaseIncludes(),
      });
      const bossMessage = await getBossMessage(pr.id);
      return res.json({
        success: true,
        message: `✅ ${pr.prNumber} already approved`,
        data: toPurchaseDto(fresh, bossMessage),
      });
    }

    // ✅ Set approval + mark boss decision
    await pr.update(
      {
        status: 'approved',
        approvedAt: new Date(),
        bossReviewedAt: new Date(),
      },
      { transaction: t },
    );

    if (pr.createdById) {
      await PurchaseNotification.create(
        {
          user_id: pr.createdById,
          purchase_type: 'local',
          type: 'request_approved',
          title: '✅ Request approved',
          body: `Your purchase request ${pr.prNumber} has been approved.`,
          reference_id: pr.id,
          reference_type: 'purchase_request',
          metadata: { prNumber: pr.prNumber },
          is_read: false,
        },
        { transaction: t },
      );
    }

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(pr.id, {
      include: buildPurchaseIncludes(),
    });
    const bossMessage = await getBossMessage(pr.id);

    res.json({
      success: true,
      message: `✅ ${pr.prNumber} approved`,
      data: toPurchaseDto(fresh, bossMessage),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ approveRequest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 5. DECLINE
// ================================================================
exports.declineRequest = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Reason required' });
    }

    const pr = await PurchaseRequest.findByPk(req.params.id, { transaction: t });
    if (!pr) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // ✅ Idempotent — already declined by the boss
    if (pr.status === 'rejected' && pr.bossReviewedAt) {
      await t.rollback();
      const fresh = await PurchaseRequest.findByPk(pr.id, {
        include: buildPurchaseIncludes(),
      });
      const bossMessage = await getBossMessage(pr.id);
      return res.json({
        success: true,
        message: `❌ ${pr.prNumber} already declined`,
        data: toPurchaseDto(fresh, bossMessage),
      });
    }

    // 🛑 Halt the entire purchase request
    await pr.update(
      {
        status: 'rejected',
        declineReason: String(reason).trim(),
        bossReviewedAt: new Date(),
      },
      { transaction: t },
    );

    if (pr.createdById) {
      await PurchaseNotification.create(
        {
          user_id: pr.createdById,
          purchase_type: 'local',
          type: 'request_declined',
          title: '🛑 Purchase request halted',
          body: `${pr.prNumber} has been halted by the boss.\n\nReason: ${String(reason).trim()}`,
          reference_id: pr.id,
          reference_type: 'purchase_request',
          metadata: {
            prNumber: pr.prNumber,
            reason: String(reason).trim(),
          },
          is_read: false,
        },
        { transaction: t },
      );
    }

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(pr.id, {
      include: buildPurchaseIncludes(),
    });
    const bossMessage = await getBossMessage(pr.id);

    res.json({
      success: true,
      message: `🛑 ${pr.prNumber} halted`,
      data: toPurchaseDto(fresh, bossMessage),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ declineRequest error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 6. LIST — PURCHASER PENDING SUBMISSIONS
// ================================================================
exports.listPendingSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const dispatchRows = await PurchaseFollowUpDispatch.findAll({
      where: { userId },
      attributes: ['purchaseRequestId'],
    });
    const prIds = [...new Set(dispatchRows.map((d) => d.purchaseRequestId))];

    if (prIds.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 },
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const { rows } = await PurchaseRequest.findAndCountAll({
      where: {
        id: { [Op.in]: prIds },
        status: { [Op.in]: ['approved', 'submitted'] },
      },
      order: [['requested_date', 'DESC']],
      offset,
      limit: pageSize,
      distinct: true,
      include: buildPurchaseIncludes(),
    });

    const items = await Promise.all(
      rows.map(async (row) => {
        const bossMessage = await getBossMessage(row.id);
        return toPurchaseDto(row, bossMessage);
      }),
    );

    const filtered = items.filter((pr) =>
      pr.items.some((it) => !it.hasWinner),
    );

    res.json({
      success: true,
      data: {
        items: filtered,
        total: filtered.length,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listPendingSubmissions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 7. LIST — PURCHASER SUBMITTED
// ================================================================
exports.listSubmittedSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const myPrices = await PurchaseFollowUpPrice.findAll({
      where: { submittedById: userId, removedAt: null },
      attributes: ['purchaseRequestItemId'],
    });
    const itemIds = [...new Set(myPrices.map((p) => p.purchaseRequestItemId))];

    if (itemIds.length === 0) {
      return res.json({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 },
      });
    }

    const items = await PurchaseRequestItem.findAll({
      where: { id: { [Op.in]: itemIds } },
      attributes: ['requestId'],
    });
    const prIds = [...new Set(items.map((i) => i.requestId))];

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where: { id: { [Op.in]: prIds } },
      order: [['updated_at', 'DESC']],
      offset,
      limit: pageSize,
      distinct: true,
      include: buildPurchaseIncludes(),
    });

    const dtos = await Promise.all(
      rows.map(async (row) => {
        const bossMessage = await getBossMessage(row.id);
        return toPurchaseDto(row, bossMessage);
      }),
    );

    res.json({
      success: true,
      data: {
        items: dtos,
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listSubmittedSubmissions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 8. SUBMIT PRICE
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

    if (!employee || !String(employee).trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Employee required' });
    }
    const unit = Number(unitPrice);
    if (!Number.isFinite(unit) || unit <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Unit price > 0' });
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

    const existing = item.prices || [];
    const manualWinner = existing.find(
      (p) => p.isWinner && p.winnerManuallySelected,
    );

    let shouldBeWinner = false;
    if (!manualWinner && matchesRequirement === true) {
      const matches = existing.filter((p) => p.matchesRequirement === true);
      const lowest = matches.length
        ? Math.min(...matches.map((p) => Number(p.finalPrice)))
        : Infinity;
      shouldBeWinner = finalPrice < lowest;
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
      { transaction: t },
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
        },
      );
    }

    await t.commit();

    const fresh = await PurchaseRequest.findByPk(item.requestId, {
      include: buildPurchaseIncludes(),
    });
    const bossMessage = await getBossMessage(item.requestId);

    res.status(201).json({
      success: true,
      message: shouldBeWinner
        ? `🏆 New winner: ${newPrice.employee} — ETB ${finalPrice.toFixed(2)}`
        : 'Price submitted',
      data: toPurchaseDto(fresh, bossMessage),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ submitPrice error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 9. LIST NOTIFICATIONS
// ================================================================
exports.listNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 50, unreadOnly = 'false' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    const where = { user_id: userId };
    if (unreadOnly === 'true') where.is_read = false;

    const { count, rows } = await PurchaseNotification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const items = rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      desc: n.body,
      time: formatRelativeTime(n.created_at),
      read: n.is_read,
      route: buildNotificationRoute(n),
    }));

    res.json({
      success: true,
      data: {
        items,
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listNotifications error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 10. NOTIFICATION UNREAD COUNT
// ================================================================
exports.notificationCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const count = await PurchaseNotification.count({
      where: { user_id: userId, is_read: false },
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('❌ notificationCount error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 11. MARK NOTIFICATION READ
// ================================================================
exports.markNotificationRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const row = await PurchaseNotification.findOne({
      where: { id: req.params.id, user_id: userId },
    });
    if (!row) return res.status(404).json({ success: false, error: 'Not found' });

    if (!row.is_read) {
      row.is_read = true;
      row.read_at = new Date();
      await row.save();
    }
    res.json({ success: true, data: { id: row.id, read: true } });
  } catch (err) {
    console.error('❌ markNotificationRead error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 12. MARK ALL NOTIFICATIONS READ
// ================================================================
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const [affected] = await PurchaseNotification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } },
    );
    res.json({ success: true, data: { affected } });
  } catch (err) {
    console.error('❌ markAllNotificationsRead error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// NOTIFICATION ROUTING
// ================================================================
function buildNotificationRoute(n) {
  const meta = n.metadata || {};

  if (n.type === 'dispatch_boss' || n.type === 'approval_request') {
    return {
      tab: 'pendingDetail',
      payload: { id: n.reference_id, requestNumber: meta.requestNumber },
      fallback: { tab: 'purchase', subView: 'pendingApproval' },
    };
  }

  if (n.type === 'dispatch') {
    return {
      tab: 'purchase',
      subView: 'pendingSubmission',
      payload: meta.requestNumber ? { requestNumber: meta.requestNumber } : null,
    };
  }

  if (n.type === 'request_approved') {
    return { tab: 'purchase', subView: 'approvedNotPaid' };
  }

  if (n.type === 'request_declined') {
    return { tab: 'notification' };
  }

  return { tab: 'home' };
}