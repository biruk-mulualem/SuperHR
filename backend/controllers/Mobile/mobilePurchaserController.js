// controllers/mobilePurchaserController.js
// Purchaser side — mobile endpoints.
//   • Dashboard stats
//   • Lightweight badge summary
//   • Pending Submission list       (PRs where I still have unpriced items)
//   • Submitted list                (PRs where I've priced every item)
//   • Detail page                   (one PR, for both lists)
//   • Submit a price on an item     (supports on-behalf-of for the collector)
//   • Update a price I submitted
'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseFollowUpPrice,
  PurchaseFollowUpDispatch,
} = db;

// ================================================================
// CONSTANTS
// ================================================================
const PRICE_COLLECTOR_USER_ID = 19;

// ================================================================
// HELPERS
// ================================================================
const priceOwnerId = (p) =>
  Number(p.onBehalfOfId ?? p.submittedById ?? 0);

const isAdminRequest = (req) => {
  const user = req.user || {};
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? '').toLowerCase();
  return role === 'admin' || role === 'administrator' || role === 'superadmin';
};

const isCollectorRequest = (req) =>
  Number(req.user?.userId) === PRICE_COLLECTOR_USER_ID;

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Normal';

// ----------------------------------------------------------------
// Build an absolute URL for any relative upload path
// ----------------------------------------------------------------
const resolveUploadUrl = (req, rawUrl) => {
  if (!rawUrl) return null;
  if (/^(https?:|data:|blob:)/i.test(rawUrl)) return rawUrl;

  const baseUrl =
    process.env.BASE_URL ||
    (req ? `${req.protocol}://${req.get('host')}` : '');

  if (!baseUrl) return rawUrl; // no way to resolve — return as-is
  return `${baseUrl}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
};

// ----------------------------------------------------------------
// Format a date for display — "Sep 20, 2026"
// ----------------------------------------------------------------
const formatDateLabel = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ----------------------------------------------------------------
// Format a date+time — "Sep 20, 2026, 10:30 AM"
// ----------------------------------------------------------------
const formatDateTimeLabel = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ----------------------------------------------------------------
// Build Sequelize includes
// ----------------------------------------------------------------
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

const getBossMessage = async (purchaseRequestId) => {
  const row = await PurchaseFollowUpDispatch.findOne({
    where: { purchaseRequestId, isBoss: true },
    attributes: ['message'],
  });
  return row?.message || null;
};

// ================================================================
// DTO
// ================================================================
const toPurchaseDto = (pr, userId, bossMessage = null, req = null) => {
  const plain = pr.toJSON ? pr.toJSON() : pr;

  // -------------------- Items --------------------
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
      submittedById: p.submittedById,
      onBehalfOfId: p.onBehalfOfId,
      ownerId: priceOwnerId(p),
    }));

    const winner = prices.find((p) => p.isWinner) || null;
    const mine =
      prices.find((p) => p.ownerId === Number(userId)) || null;

    let myStatus = 'not_submitted';
    if (mine) {
      if (winner && winner.id === mine.id) myStatus = 'won';
      else if (winner) myStatus = 'lost';
      else myStatus = 'pending';
    }

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

      // My bid details
      myPriceId: mine?.id || null,
      myUnitPrice: mine?.unitPrice != null ? Number(mine.unitPrice) : null,
      myDiscount: mine?.discount != null ? Number(mine.discount) : 0,
      myFinalPrice: mine?.finalPrice != null ? Number(mine.finalPrice) : null,
      myMatchesRequirement: mine?.matchesRequirement ?? null,
      myRemark: mine?.remark || '',
      myNotes: mine?.notes || '',
      mySubmittedDate: mine?.submittedDate || null,
      myStatus,
      hasMyBid: !!mine,

      bidCount: prices.length,
      bids: prices,
    };
  });

  // -------------------- Counters --------------------
  const totalItems = items.length;
  const itemsWithWinner = items.filter((i) => i.hasWinner).length;
  const itemsWithBids = items.filter((i) => i.bidCount > 0).length;
  const itemsPendingBids = items.filter((i) => i.bidCount === 0).length;
  const itemsPricedByMe = items.filter((i) => i.hasMyBid).length;
  const totalBids = items.reduce((s, i) => s + i.bidCount, 0);
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalWinningAmount = items.reduce(
    (sum, i) => sum + (i.winningPrice || 0),
    0,
  );

  // -------------------- Overall status --------------------
  let followUpStatus = 'pending_bids';
  if (itemsWithWinner === totalItems && totalItems > 0) {
    followUpStatus = 'submitted';
  } else if (itemsWithBids > 0) {
    followUpStatus = 'bidding';
  }
  if (plain.status === 'rejected') followUpStatus = 'rejected';

  let myOverallStatus = 'partial';
  if (itemsPricedByMe === totalItems && totalItems > 0) {
    const wonCount = items.filter((i) => i.myStatus === 'won').length;
    const lostCount = items.filter((i) => i.myStatus === 'lost').length;
    const pendingCount = items.filter((i) => i.myStatus === 'pending').length;
    if (wonCount === totalItems) myOverallStatus = 'won';
    else if (lostCount === totalItems) myOverallStatus = 'lost';
    else if (pendingCount === totalItems) myOverallStatus = 'pending';
    else myOverallStatus = 'mixed';
  }

  const bossReviewedAt = plain.bossReviewedAt || null;
  let bossDecision = null;
  if (bossReviewedAt) {
    bossDecision = plain.status === 'rejected' ? 'declined' : 'approved';
  }

  // -------------------- Dates --------------------
  const requestedDate = plain.requestedDate || null;
  const approvedAt = plain.approvedAt || null;
  const createdAt = plain.created_at || plain.createdAt || null;
  const updatedAt = plain.updated_at || plain.updatedAt || null;

  // -------------------- Document URLs --------------------
  const imageUrl =
    resolveUploadUrl(req, plain.approvedDocFront) ||
    plain.imageUrl ||
    'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop';

  // -------------------- Build DTO --------------------
  return {
    id: plain.id,
    requestNumber: plain.prNumber,
    poNumber: plain.poNumber || null,
    requester: plain.createdBy?.fullName || plain.preparedBy || 'N/A',
    department: plain.department || 'N/A',

    // 👇 raw ISO timestamps
    date: requestedDate,
    requestedDate,
    approvedDate: approvedAt,
    createdAt,
    updatedAt,

    // 👇 pre-formatted labels for the UI
    dateLabel: formatDateLabel(requestedDate),
    requestedDateLabel: formatDateLabel(requestedDate),
    approvedDateLabel: formatDateTimeLabel(approvedAt),
    createdAtLabel: formatDateTimeLabel(createdAt),
    updatedAtLabel: formatDateTimeLabel(updatedAt),

    priority: capitalize(plain.priority),
    rawPriority: plain.priority,
    reason: plain.reason || null,

    bossMessage: bossMessage || null,

    status: followUpStatus,
    myStatus: myOverallStatus,
    rawStatus: plain.status,

    // 👇 resolved absolute URLs
    imageUrl,
    approvedDocFront: resolveUploadUrl(req, plain.approvedDocFront),
    approvedDocFrontName: plain.approvedDocFrontName,
    approvedDocBack: resolveUploadUrl(req, plain.approvedDocBack),
    approvedDocBackName: plain.approvedDocBackName,

    bossReviewedAt,
    bossReviewed: !!bossReviewedAt,
    bossDecision,
    bossDeclineReason: plain.declineReason || null,

    items,

    totalItems,
    itemsWithWinner,
    itemsWithBids,
    itemsPendingBids,
    itemsPricedByMe,
    totalBids,
    totalQuantity,
    totalWinningAmount,
  };
};

// ================================================================
// GUARDS
// ================================================================
const ensurePurchaserAccess = async (req, prId) => {
  if (isAdminRequest(req)) return true;
  if (isCollectorRequest(req)) return true;

  const userId = req.user?.userId;
  if (!userId) {
    const err = new Error('No authenticated user');
    err.status = 401;
    throw err;
  }

  const count = await PurchaseFollowUpDispatch.count({
    where: { purchaseRequestId: prId, userId },
  });

  if (count === 0) {
    const err = new Error('You do not have permission to access this request');
    err.status = 403;
    throw err;
  }

  return true;
};

// ================================================================
// LOADERS / SPLITTERS
// ================================================================
const loadDispatchedPRs = async (userId, { search = '' } = {}) => {
  const dispatchRows = await PurchaseFollowUpDispatch.findAll({
    where: { userId },
    attributes: ['purchaseRequestId'],
    raw: true,
  });
  const prIds = [...new Set(dispatchRows.map((d) => d.purchaseRequestId))];
  if (prIds.length === 0) return [];

  const where = { id: { [Op.in]: prIds } };

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    where[Op.or] = [
      { prNumber: { [Op.iLike]: q } },
      { department: { [Op.iLike]: q } },
      { expertName: { [Op.iLike]: q } },
    ];
  }

  return PurchaseRequest.findAll({
    where,
    order: [['requested_date', 'DESC']],
    include: buildPurchaseIncludes(),
  });
};

const splitDispatchedPRs = (prs, userId) => {
  const pending = [];
  const submitted = [];

  for (const pr of prs) {
    const items = pr.items || [];
    if (items.length === 0) continue;

    const needsMyPrice = items.some(
      (it) =>
        !(it.prices || []).some(
          (p) => priceOwnerId(p) === Number(userId) && !p.removedAt,
        ),
    );

    if (needsMyPrice) pending.push(pr);
    else submitted.push(pr);
  }

  return { pending, submitted };
};

const computeDashboardStats = async (userId) => {
  const prs = await loadDispatchedPRs(userId);
  const { pending, submitted } = splitDispatchedPRs(prs, userId);

  const pendingCount = pending.length;
  const urgentCount = pending.filter((pr) => {
    const p = String(pr.priority || '').toLowerCase();
    return p === 'urgent' || p === 'high';
  }).length;

  let won = 0;
  let lost = 0;
  let pendingResult = 0;

  for (const pr of submitted) {
    const prRejected = pr.status === 'rejected';

    for (const it of pr.items || []) {
      const prices = it.prices || [];
      const mine = prices.filter(
        (p) => priceOwnerId(p) === Number(userId) && !p.removedAt,
      );
      if (mine.length === 0) continue;

      const winner = prices.find((p) => p.isWinner === true);
      const iAmWinner = mine.some((p) => p.isWinner === true);

      if (prRejected) lost += 1;
      else if (iAmWinner) won += 1;
      else if (winner) lost += 1;
      else pendingResult += 1;
    }
  }

  const submittedCount = won + lost + pendingResult;
  const winRate =
    submittedCount > 0 ? Math.round((won / submittedCount) * 100) : 0;

  return {
    pendingCount,
    urgentCount,
    submittedCount,
    won,
    lost,
    pendingResult,
    winRate,
  };
};

// ================================================================
// 1. FULL DASHBOARD
// ================================================================
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'No authenticated user' });
    }

    const stats = await computeDashboardStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ [mobile] getPurchaserDashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch purchaser dashboard',
    });
  }
};

// ================================================================
// 2. LIGHTWEIGHT SUMMARY
// ================================================================
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'No authenticated user' });
    }

    const stats = await computeDashboardStats(userId);
    res.json({
      success: true,
      data: {
        pendingCount:   stats.pendingCount,
        urgentCount:    stats.urgentCount,
        submittedCount: stats.submittedCount,
        winRate:        stats.winRate,
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getPurchaserSummary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch purchaser summary',
    });
  }
};

// ================================================================
// 3. PENDING SUBMISSION LIST
// ================================================================
exports.listPendingRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'No authenticated user' });
    }

    const { page = 1, limit = 50, search = '' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const prs = await loadDispatchedPRs(userId, { search });
    const { pending } = splitDispatchedPRs(prs, userId);

    const offset = (pageNum - 1) * pageSize;
    const slice = pending.slice(offset, offset + pageSize);

    const items = await Promise.all(
      slice.map(async (pr) => {
        const bossMessage = await getBossMessage(pr.id);
        return toPurchaseDto(pr, userId, bossMessage, req);
      }),
    );

    res.json({
      success: true,
      data: {
        items,
        total: pending.length,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(pending.length / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listPendingRequests error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 4. SUBMITTED LIST
// ================================================================
exports.listSubmittedRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'No authenticated user' });
    }

    const { page = 1, limit = 50, search = '' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const prs = await loadDispatchedPRs(userId, { search });
    const { submitted } = splitDispatchedPRs(prs, userId);

    const offset = (pageNum - 1) * pageSize;
    const slice = submitted.slice(offset, offset + pageSize);

    const items = await Promise.all(
      slice.map(async (pr) => {
        const bossMessage = await getBossMessage(pr.id);
        return toPurchaseDto(pr, userId, bossMessage, req);
      }),
    );

    res.json({
      success: true,
      data: {
        items,
        total: submitted.length,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(submitted.length / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listSubmittedRequests error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 5. GET ONE PR
// ================================================================
exports.getRequestDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: 'No authenticated user' });
    }

    const pr = await PurchaseRequest.findByPk(id, {
      include: buildPurchaseIncludes(),
    });

    if (!pr) {
      return res
        .status(404)
        .json({ success: false, error: 'Purchase request not found' });
    }

    await ensurePurchaserAccess(req, pr.id);

    const bossMessage = await getBossMessage(pr.id);

    const viewAs =
      isCollectorRequest(req) && req.query.asUser
        ? Number(req.query.asUser)
        : Number(userId);

    res.json({
      success: true,
      data: toPurchaseDto(pr, viewAs, bossMessage, req),
    });
  } catch (err) {
    console.error('❌ getRequestDetail error:', err);
    res
      .status(err.status || 500)
      .json({ success: false, error: err.message || 'Failed to load request' });
  }
};

// ================================================================
// 6. SUBMIT PRICE — supports on-behalf-of
//
//    `employee` on the price row is ALWAYS the owner's full name
//    (from users.full_name). The client never sends it.
// ================================================================
exports.submitPrice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { itemId } = req.params;
    const userId = req.user?.userId;
    const {
      unitPrice,
      discount = 0,
      matchesRequirement = true,
      remark = null,
      notes = null,
      onBehalfOfId = null,
    } = req.body;

    if (!userId) {
      await t.rollback();
      return res
        .status(401)
        .json({ success: false, error: 'No authenticated user' });
    }

    const unit = Number(unitPrice);
    if (!Number.isFinite(unit) || unit <= 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'Unit price must be greater than 0' });
    }

    if (matchesRequirement === false && !remark) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Remark is required when the item does not match the requirement',
      });
    }

    // ------------------------------------------------------------
    // Resolve owner
    // ------------------------------------------------------------
    let resolvedOwner = Number(userId);

    if (isCollectorRequest(req)) {
      if (!onBehalfOfId) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: 'Collector must specify onBehalfOfId',
        });
      }
      resolvedOwner = Number(onBehalfOfId);
    } else if (onBehalfOfId) {
      resolvedOwner = Number(userId);
    }

    // ------------------------------------------------------------
    // Owner's display name → `employee`
    // ------------------------------------------------------------
    const ownerUser = await db.User.findByPk(resolvedOwner, {
      attributes: ['userId', 'fullName', 'username'],
      transaction: t,
    });

    if (!ownerUser) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'Owner user not found' });
    }

    const employeeName =
      ownerUser.fullName ||
      ownerUser.username ||
      `User #${resolvedOwner}`;

    // ------------------------------------------------------------
    // Load item with active prices
    // ------------------------------------------------------------
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
      return res
        .status(404)
        .json({ success: false, error: 'Item not found' });
    }

    await ensurePurchaserAccess(req, item.requestId);

    const existingMine = (item.prices || []).find(
      (p) => priceOwnerId(p) === resolvedOwner && !p.removedAt,
    );

    const quantity = Number(item.quantity) || 0;
    const disc = Number(discount) || 0;
    const totalPrice = Number((unit * quantity).toFixed(2));
    const finalPrice = Number(Math.max(0, totalPrice - disc).toFixed(2));

    const manualWinner = (item.prices || []).find(
      (p) => p.isWinner && p.winnerManuallySelected,
    );

    let shouldBeWinner = false;
    if (!manualWinner && matchesRequirement === true) {
      const matches = (item.prices || []).filter(
        (p) =>
          p.matchesRequirement === true &&
          p.id !== existingMine?.id,
      );
      const lowest = matches.length
        ? Math.min(...matches.map((p) => Number(p.finalPrice)))
        : Infinity;
      shouldBeWinner = finalPrice < lowest;
    }

    let priceRow;

    if (existingMine) {
      await existingMine.update(
        {
          employee: employeeName,
          unitPrice: unit,
          totalPrice,
          discount: disc,
          finalPrice,
          matchesRequirement,
          remark,
          notes,
          isWinner: shouldBeWinner,
          status: shouldBeWinner ? 'accepted' : 'pending',
          submittedById: userId,
          onBehalfOfId: resolvedOwner,
          submittedDate: new Date(),
        },
        { transaction: t },
      );
      priceRow = existingMine;
    } else {
      priceRow = await PurchaseFollowUpPrice.create(
        {
          purchaseRequestItemId: item.id,
          employee: employeeName,
          submittedById: userId,
          onBehalfOfId: resolvedOwner,
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
    }

    if (shouldBeWinner) {
      await PurchaseFollowUpPrice.update(
        { isWinner: false, status: 'rejected' },
        {
          where: {
            purchaseRequestItemId: item.id,
            id: { [Op.ne]: priceRow.id },
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

    res.status(existingMine ? 200 : 201).json({
      success: true,
      message: existingMine
        ? 'Price updated successfully'
        : 'Price submitted successfully',
      data: toPurchaseDto(fresh, resolvedOwner, bossMessage, req),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ purchaser submitPrice error:', err);
    res
      .status(err.status || 500)
      .json({ success: false, error: err.message || 'Failed to submit price' });
  }
};

// ================================================================
// 7. UPDATE PRICE
// ================================================================
exports.updatePrice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { priceId } = req.params;
    const userId = req.user?.userId;
    const {
      unitPrice,
      discount = 0,
      matchesRequirement = true,
      remark = null,
      notes = null,
    } = req.body;

    if (!userId) {
      await t.rollback();
      return res
        .status(401)
        .json({ success: false, error: 'No authenticated user' });
    }

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
      return res
        .status(404)
        .json({ success: false, error: 'Price not found' });
    }

    if (price.removedAt) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'Price has been removed' });
    }

    const ownerId = priceOwnerId(price);
    const canEdit =
      isAdminRequest(req) ||
      isCollectorRequest(req) ||
      ownerId === Number(userId) ||
      Number(price.submittedById) === Number(userId);

    if (!canEdit) {
      await t.rollback();
      return res
        .status(403)
        .json({ success: false, error: 'You can only edit your own prices' });
    }

    const unit = Number(unitPrice);
    if (!Number.isFinite(unit) || unit <= 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'Unit price must be greater than 0' });
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

    const fresh = await PurchaseRequest.findByPk(
      price.purchaseRequestItem.requestId,
      { include: buildPurchaseIncludes() },
    );
    const bossMessage = await getBossMessage(
      price.purchaseRequestItem.requestId,
    );

    res.json({
      success: true,
      message: 'Price updated successfully',
      data: toPurchaseDto(fresh, ownerId, bossMessage, req),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ purchaser updatePrice error:', err);
    res
      .status(err.status || 500)
      .json({ success: false, error: err.message || 'Failed to update price' });
  }
};