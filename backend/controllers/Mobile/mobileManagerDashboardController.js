// controllers/mobileManagerDashboardController.js
// Mobile-only aggregate endpoints for the manager dashboard.
'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
  PurchaseRequest,
  PurchaseFollowUpDispatch,
  PurchaseNotification,
} = db;

// ================================================================
// HELPERS
// ================================================================

const isAdminRequest = (req) => {
  const user = req.user || {};
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? '').toLowerCase();
  return role === 'admin' || role === 'administrator' || role === 'superadmin';
};

const isManagerRequest = (req) => {
  const role = String(req.user?.role ?? '').toLowerCase();
  return role === 'manager' || isAdminRequest(req);
};

// Statuses that mean "still in the purchasing pipeline"
const ACTIVE_PR_STATUSES = ['draft', 'submitted', 'pending', 'approved'];

// ================================================================
// CORE COUNTER — how many PRs are waiting for the boss?
//
//   A PR is "waiting" when:
//     1. the current user was dispatched to it (is_boss = true)
//     2. its status is still in the active pipeline
//     3. boss_reviewed_at IS NULL  ← the key: boss hasn't decided yet
// ================================================================
const countPendingApprovals = async (userId) => {
  // 1. PRs this boss was dispatched to
  const dispatchRows = await PurchaseFollowUpDispatch.findAll({
    where: { userId, isBoss: true },
    attributes: ['purchaseRequestId'],
    raw: true,
  });

  const prIds = [...new Set(dispatchRows.map((d) => d.purchaseRequestId))];
  if (prIds.length === 0) return 0;

  // 2. Count the ones still un-reviewed by the boss
  const count = await PurchaseRequest.count({
    where: {
      id: { [Op.in]: prIds },
      status: { [Op.in]: ACTIVE_PR_STATUSES },
      bossReviewedAt: null, // 👈 only un-decided PRs
    },
  });

  return count;
};

// ================================================================
// CORE COUNTER — pending payments (unchanged — still notification-based)
// ================================================================
const countPendingPayments = async (userId) => {
  return PurchaseNotification.count({
    where: {
      user_id: userId,
      type: 'approval_request',
      is_read: false,
    },
  });
};

// ================================================================
// 1. PURCHASE SUMMARY
//    GET /api/mobile/manager-dashboard/purchase-summary
//
//    Response:
//      { success: true, data: { pendingApproval, pendingPayment } }
// ================================================================
exports.getPurchaseSummary = async (req, res) => {
  try {
    if (!isManagerRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'Only managers can view this dashboard',
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No authenticated user',
      });
    }

    const [pendingApproval, pendingPayment] = await Promise.all([
      countPendingApprovals(userId),
      countPendingPayments(userId),
    ]);

    res.json({
      success: true,
      data: {
        pendingApproval,
        pendingPayment,
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getPurchaseSummary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard summary',
    });
  }
};

// ================================================================
// 2. FULL DASHBOARD
//    GET /api/mobile/manager-dashboard
// ================================================================
exports.getDashboard = async (req, res) => {
  try {
    if (!isManagerRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'Only managers can view this dashboard',
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No authenticated user',
      });
    }

    // ------------------------------------------------------------
    // 1. Counts
    // ------------------------------------------------------------
    const [pendingApproval, pendingPayment] = await Promise.all([
      countPendingApprovals(userId),
      countPendingPayments(userId),
    ]);

    // ------------------------------------------------------------
    // 2. Recent activity — PRs this boss has been dispatched to
    // ------------------------------------------------------------
    const dispatchRows = await PurchaseFollowUpDispatch.findAll({
      where: { userId, isBoss: true },
      attributes: ['purchaseRequestId'],
      raw: true,
    });

    const prIds = [...new Set(dispatchRows.map((d) => d.purchaseRequestId))];

    let recentRequests = [];
    if (prIds.length > 0) {
      const rows = await PurchaseRequest.findAll({
        where: { id: { [Op.in]: prIds } },
        order: [['updated_at', 'DESC']],
        limit: 5,
        attributes: [
          'id',
          'prNumber',
          'department',
          'status',
          'priority',
          'preparedBy',
          'bossReviewedAt',
          'updated_at',
        ],
      });

      recentRequests = rows.map((r) => ({
        id: r.id,
        requestNumber: r.prNumber,
        department: r.department,
        status: r.status,
        priority: r.priority,
        preparedBy: r.preparedBy,
        bossReviewed: !!r.bossReviewedAt, // 👈 handy for the UI
        updatedAt: r.updated_at,
      }));
    }

    res.json({
      success: true,
      data: {
        summary: {
          pendingApproval,
          pendingPayment,
        },
        recentRequests,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getDashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard',
    });
  }
};