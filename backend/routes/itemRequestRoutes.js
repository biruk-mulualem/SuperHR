// routes/itemRequestRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const itemRequestController = require('../controllers/itemRequestController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ================================================================
// STOCK VALIDATION ROUTES (MUST COME BEFORE PARAM ROUTES)
// ================================================================

/**
 * GET /api/item-requests/check-stock
 * Check stock availability for items in a store
 * Query params: storeId, items (JSON array)
 * Example: /api/item-requests/check-stock?storeId=1&items=[{"itemId":1,"quantity":50}]
 */
router.get('/check-stock', itemRequestController.checkStockAvailability);

// ================================================================
// GET ACTIVE STORES (for dropdown)
// ================================================================
router.get('/active-stores', itemRequestController.getActiveStores);

// ================================================================
// GET ACTIVE ITEMS (for dropdown)
// ================================================================
router.get('/active-items', itemRequestController.getActiveItems);

// ================================================================
// STATS & UTILITY ROUTES (MUST COME BEFORE /:id routes)
// ================================================================

// Get request statistics
router.get('/stats', itemRequestController.getStats);

// Get requests by date range
router.get('/date-range', itemRequestController.getByDateRange);

// Get my requests (current user)
router.get('/my-requests', itemRequestController.getMyRequests);

// Get requests by user ID
router.get('/user/:userId', itemRequestController.getByUser);

// Get requests by status
router.get('/status/:status', itemRequestController.getByStatus);

// Export requests as CSV
router.get('/export', itemRequestController.exportRequests);

// ================================================================
// MAIN REQUEST ROUTES (with pagination and filters)
// ================================================================

// Get all requests with pagination and filters
router.get('/', itemRequestController.getRequests);

// ================================================================
// 🔥 NOTIFICATION ROUTES
// ================================================================

/**
 * 🔥 NEW: Get notifications for a group in a specific store
 * GET /api/item-requests/notifications/:storeId/:groupId
 */
router.get('/notifications/:storeId/:groupId', itemRequestController.getGroupNotifications);

/**
 * Get request with notification status and responses
 * GET /api/item-requests/:id/notifications
 */
router.get('/:id/notifications', itemRequestController.getRequestWithNotifications);

/**
 * Check if all groups have accepted/rejected the request
 * GET /api/item-requests/:id/notifications/status
 */
router.get('/:id/notifications/status', itemRequestController.checkRequestNotificationStatus);

/**
 * Get rejection reasons for a request
 * GET /api/item-requests/notifications/requests/:requestId/rejections
 */
router.get('/notifications/requests/:requestId/rejections', itemRequestController.getRejectionReasons);

/**
 * Accept a notification (group accepts the request)
 * POST /api/item-requests/notifications/:notificationId/accept
 */
router.post('/notifications/:notificationId/accept', itemRequestController.acceptNotification);

/**
 * Reject a notification (group rejects the request with reason)
 * POST /api/item-requests/notifications/:notificationId/reject
 */
router.post('/notifications/:notificationId/reject', itemRequestController.rejectNotification);

// ================================================================
// IMPORTANT: Wildcard routes MUST come AFTER specific routes
// ================================================================

// Get single request by ID
router.get('/:id', itemRequestController.getRequestById);

// Create a new request
router.post('/', itemRequestController.createRequest);

// Update a request
router.put('/:id', itemRequestController.updateRequest);

// Update request status (Approve/Reject/Finalize)
router.patch('/:id/status', itemRequestController.updateStatus);

// Delete a request (soft delete - only pending/rejected)
router.delete('/:id', itemRequestController.deleteRequest);

module.exports = router;