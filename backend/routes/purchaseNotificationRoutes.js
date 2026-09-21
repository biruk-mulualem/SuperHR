// routes/purchaseNotificationRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchaseNotificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware());

// READ
router.get('/',             ctrl.listNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.delete('/:id', ctrl.deleteNotification);
router.get('/:id',          ctrl.getNotification);

// WRITE
router.put('/read-all',     ctrl.markAllAsRead);
router.put('/:id/read',     ctrl.markAsRead);
router.post('/',            ctrl.createNotification);  // admin-only

// DELETE
router.delete('/read',      ctrl.deleteReadNotifications);
router.delete('/:id',       ctrl.deleteNotification);

module.exports = router;