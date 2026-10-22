// routes/purchaseRequestRoutes.js
const express = require('express');
const router = express.Router();
const purchaseRequestController = require('../controllers/purchaseRequestController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadPurchaseRequestDocs } = require('../middleware/uploadMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== PURCHASE REQUEST ROUTES ====================

// ---- Stats / helpers ----
router.get('/stats', purchaseRequestController.getPurchaseRequestStats);
router.post('/check-balance', purchaseRequestController.checkBalance);

// ---- Lists ----
router.get('/approved', purchaseRequestController.listApprovedPurchaseRequests);
router.get('/pending-my-approval', purchaseRequestController.listPendingForMe);
router.get('/', purchaseRequestController.listPurchaseRequests);

// ==================== NOTIFICATIONS ====================
// Declared BEFORE /:id so they don't get swallowed by the :id pattern
router.get('/notifications', purchaseRequestController.listMyNotifications);
router.get('/notifications/unread-count', purchaseRequestController.getUnreadCount);
router.patch('/notifications/read-all', purchaseRequestController.markAllNotificationsRead);
router.patch('/notifications/:id/read', purchaseRequestController.markNotificationRead);
router.delete('/notifications/:id', purchaseRequestController.deleteNotification);

// ==================== APPROVAL FLOW ====================

// Submitter: upload front (+optional back) and move to Stage 1
// POST /api/purchase-requests/submit
router.post(
  '/submit',
  uploadPurchaseRequestDocs,
  purchaseRequestController.submitForApproval
);

// Backwards-compat alias — same handler, same multipart shape
// POST /api/purchase-requests/approve
router.post(
  '/approve',
  uploadPurchaseRequestDocs,
  purchaseRequestController.submitForApproval
);

// Approver: approve or reject
// POST /api/purchase-requests/:id/decision
router.post('/:id/decision', purchaseRequestController.decide);

// Per-subgroup status for the drawer
// GET /api/purchase-requests/:id/approval-status
router.get('/:id/approval-status', purchaseRequestController.getApprovalStatus);

// ==================== SINGLE / CRUD ====================

// Get single
router.get('/:id', purchaseRequestController.getPurchaseRequestById);

// Create
router.post('/', purchaseRequestController.createPurchaseRequest);

// Update (drafts / rejected only)
router.put('/:id', purchaseRequestController.updatePurchaseRequest);

// Delete (drafts / rejected only)
router.delete('/:id', purchaseRequestController.deletePurchaseRequest);

module.exports = router;