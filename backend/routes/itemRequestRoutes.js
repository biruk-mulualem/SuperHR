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
// GET ACTIVE STORES & ITEMS (for dropdowns)
// ================================================================
router.get('/active-stores', itemRequestController.getActiveStores);
router.get('/active-items', itemRequestController.getActiveItems);

// ================================================================
// STORE GROUPS ROUTE (Get groups for a specific store)
// ================================================================

/**
 * GET /api/item-requests/stores/:storeId/groups
 * Get all active groups for a specific store
 * Example: /api/item-requests/stores/1/groups
 */
router.get('/stores/:storeId/groups', itemRequestController.getStoreGroups);

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
 * 🔥 Get notifications for a department (ASSET requests only)
 * GET /api/item-requests/notifications/department/:departmentId
 * 
 * Example: /api/item-requests/notifications/department/1
 * 
 * Query params:
 * - page: 1 (default)
 * - limit: 10 (default)
 * - status: pending|accepted|rejected|all (default: all)
 */
router.get(
  '/notifications/department/:departmentId',
  authMiddleware(),
  itemRequestController.getDepartmentNotifications
);

/**
 * Get notifications for a group in a specific store
 * GET /api/item-requests/notifications/:storeId/:groupId
 * 
 * Example: /api/item-requests/notifications/2/1
 * (Store ID: 2, Group ID: 1)
 * 
 * Query params:
 * - page: 1 (default)
 * - limit: 10 (default)
 * - status: pending|accepted|rejected|all (default: all)
 */
router.get(
  '/notifications/:storeId/:groupId',
  authMiddleware(),
  itemRequestController.getGroupNotifications
);

/**
 * Get request with notification status and responses
 * GET /api/item-requests/:id/notifications
 * 
 * Example: /api/item-requests/123/notifications
 */
router.get('/:id/notifications', itemRequestController.getRequestWithNotifications);

/**
 * Check if all groups have accepted/rejected the request
 * GET /api/item-requests/:id/notifications/status
 * 
 * Example: /api/item-requests/123/notifications/status
 * Response: { allAccepted, hasRejection, total, acceptedCount, rejectedCount, pendingCount }
 */
router.get('/:id/notifications/status', itemRequestController.checkRequestNotificationStatus);

/**
 * Get rejection reasons for a request
 * GET /api/item-requests/notifications/requests/:requestId/rejections
 * 
 * Example: /api/item-requests/notifications/requests/123/rejections
 */
router.get('/notifications/requests/:requestId/rejections', itemRequestController.getRejectionReasons);

/**
 * Accept a notification (group or department accepts the request)
 * POST /api/item-requests/notifications/:notificationId/accept
 * 
 * Example: POST /api/item-requests/notifications/456/accept
 */
router.post('/notifications/:notificationId/accept', itemRequestController.acceptNotification);

/**
 * Reject a notification (group or department rejects the request with reason)
 * POST /api/item-requests/notifications/:notificationId/reject
 * 
 * Example: POST /api/item-requests/notifications/456/reject
 * Body: { "reason": "Not enough stock" }
 */
router.post('/notifications/:notificationId/reject', itemRequestController.rejectNotification);

// ================================================================
// 🔥 IMPORTANT: Wildcard routes MUST come AFTER specific routes
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