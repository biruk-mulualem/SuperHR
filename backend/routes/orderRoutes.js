// routes/orderRoutes.js
'use strict';
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware());

// ================================================================
// ORDER CRUD
// ================================================================

router.get('/', OrderController.getAll);
router.get('/stats', OrderController.getStats);
router.get('/:id', OrderController.getById);
router.post('/', OrderController.create);
router.put('/:id', OrderController.update);
router.delete('/:id', OrderController.delete);

// ================================================================
// SALES PERSON ACTIONS
// ================================================================

router.post('/:id/send', OrderController.sendOrder);
router.post('/:id/cancel', OrderController.cancelOrder);
router.post('/:id/restore', OrderController.restoreOrder);

// ================================================================
// PRODUCTION ACTIONS (Admin Only)
// ================================================================

router.post('/:id/accept', OrderController.acceptOrder);
router.post('/:id/reject', OrderController.rejectOrder);
router.post('/:id/complete', OrderController.completeOrder);

// ================================================================
// ORDER NOTIFICATIONS
// ================================================================

// Get notifications for a store
router.get('/notifications/store/:storeId', OrderController.getNotificationsByStore);

// Get my notifications (for current user's store)
router.get('/notifications/my', OrderController.getMyNotifications);

// Get notification count (for badge)
router.get('/notifications/count', OrderController.getNotificationCount);

// Accept notification
router.post('/notifications/:id/accept', OrderController.acceptNotification);

// Reject notification
router.post('/notifications/:id/reject', OrderController.rejectNotification);

// Complete notification
router.post('/notifications/:id/complete', OrderController.completeNotification);

module.exports = router;