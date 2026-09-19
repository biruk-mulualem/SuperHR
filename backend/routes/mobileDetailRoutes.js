// routes/mobileDetailRoutes.js
'use strict';

const router = require('express').Router();

// ✅ Only ONE auth import — use whichever your project actually exports
const { authMiddleware } = require('../middleware/authMiddleware');
// ✅ Only ONE controller — everything lives in mobileDetailController
const ctrl = require('../controllers/mobileDetailController');

// All mobile routes require JWT
router.use(authMiddleware());

// ================================================================
// MANAGER — Purchase requests
// ================================================================
router.get('/purchase-requests', ctrl.listPendingApproval);
router.get('/purchase-requests/:id', ctrl.getDetail);
router.post('/purchase-requests/:id/approve', ctrl.approveRequest);
router.post('/purchase-requests/:id/decline', ctrl.declineRequest);

// ================================================================
// DETAIL HELPERS
// ================================================================
router.get('/detail/requests/:id', ctrl.getDetail);
router.get('/detail/requests/by-number/:prNumber', ctrl.getDetailByNumber);

// ================================================================
// PURCHASER — Submissions
// ================================================================
router.get('/submissions/pending', ctrl.listPendingSubmissions);
router.get('/submissions/submitted', ctrl.listSubmittedSubmissions);
router.post('/submissions/items/:itemId/prices', ctrl.submitPrice);

// ================================================================
// NOTIFICATIONS
// ================================================================
router.get('/notifications', ctrl.listNotifications);
router.get('/notifications/unread-count', ctrl.notificationCount);
router.patch('/notifications/read-all', ctrl.markAllNotificationsRead);
router.patch('/notifications/:id/read', ctrl.markNotificationRead);

module.exports = router;