// controllers/mobileManagerDashboardController.js
// Mobile-only aggregate endpoints for the manager dashboard.
// The web app uses purchaseFollowUpController.js for its own views.
'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { PurchaseRequest, PurchaseNotification } = db;

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

// Types that count as "needs my approval" on the dashboard:
//   - 'dispatch'       → regular recipients (assigned to you)
//   - 'dispatch_boss'  → boss recipients (assigned to you, boss flow)
const APPROVAL_TYPES = ['dispatch', 'dispatch_boss'];

// ================================================================
// 1. PURCHASE SUMMARY — GET /api/mobile/manager-dashboard/purchase-summary
//
//   Counts UNREAD notifications for the current user:
//     - pendingApproval   → unread dispatch / dispatch_boss notifications
//                           ("a request was assigned to you")
//     - pendingPayment    → unread approval_request notifications
//                           ("prices sent to you for approval")
//
//   Response:
//     { success: true, data: { pendingApproval, pendingPayment } }
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

    // ------------------------------------------------------------
    // Count unread notifications by group for this user
    // ------------------------------------------------------------
    const [pendingApproval, pendingPayment] = await Promise.all([
      PurchaseNotification.count({
        where: {
          user_id: userId,
          type: { [Op.in]: APPROVAL_TYPES },
          is_read: false,
        },
      }),
      PurchaseNotification.count({
        where: {
          user_id: userId,
          type: 'approval_request',
          is_read: false,
        },
      }),
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
// 2. FULL DASHBOARD — GET /api/mobile/manager-dashboard
//
//   Richer payload for future use: the same two notification
//   counts plus recent activity from the purchase requests table.
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
    // 1. Notification counts
    // ------------------------------------------------------------
    const [pendingApproval, pendingPayment] = await Promise.all([
      PurchaseNotification.count({
        where: {
          user_id: userId,
          type: { [Op.in]: APPROVAL_TYPES },
          is_read: false,
        },
      }),
      PurchaseNotification.count({
        where: {
          user_id: userId,
          type: 'approval_request',
          is_read: false,
        },
      }),
    ]);

    // ------------------------------------------------------------
    // 2. Recent requests
    //    Non-admins see only their own requests.
    // ------------------------------------------------------------
    const baseWhere = {};
    if (!isAdminRequest(req)) {
      baseWhere.createdById = userId;
    }

    const recentRequests = await PurchaseRequest.findAll({
      where: baseWhere,
      order: [['updated_at', 'DESC']],
      limit: 5,
      attributes: [
        'id',
        'prNumber',
        'department',
        'status',
        'priority',
        'preparedBy',
        'updated_at',
      ],
    });

    res.json({
      success: true,
      data: {
        summary: {
          pendingApproval,
          pendingPayment,
        },
        recentRequests: recentRequests.map((r) => ({
          id: r.id,
          requestNumber: r.prNumber,
          department: r.department,
          status: r.status,
          priority: r.priority,
          preparedBy: r.preparedBy,
          updatedAt: r.updated_at,
        })),
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