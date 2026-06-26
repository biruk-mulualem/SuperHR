// routes/itemRequestRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const itemRequestController = require('../controllers/itemRequestController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());



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

