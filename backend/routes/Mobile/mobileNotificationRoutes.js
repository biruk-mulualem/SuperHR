// routes/Mobile/mobileNotificationRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const c = require('../../controllers/Mobile/mobileNotificationController');
const { authMiddleware } = require('../../middleware/authMiddleware');

// Every route requires an authenticated user
router.use(authMiddleware());

// ================================================================
// IMPORTANT — specific paths FIRST, ':id' LAST
// ================================================================

// GET    /api/mobile/notifications
//   ?page=&limit=&unreadOnly=&purchaseType=&type=
router.get('/', c.listNotifications);

// GET    /api/mobile/notifications/unread-count
//   ?purchaseType=
router.get('/unread-count', c.getUnreadCount);

// POST   /api/mobile/notifications/read-all
//   body: { purchaseType? }
router.post('/read-all', c.markAllAsRead);

// DELETE /api/mobile/notifications/read
router.delete('/read', c.deleteReadNotifications);

// POST   /api/mobile/notifications
//   body: { userIds, purchaseType?, type, title, body?, referenceId?, referenceType?, metadata? }
//   admin only
router.post('/', c.createNotification);

// GET    /api/mobile/notifications/:id
router.get('/:id', c.getNotification);

// POST   /api/mobile/notifications/:id/read
router.post('/:id/read', c.markAsRead);

// DELETE /api/mobile/notifications/:id
router.delete('/:id', c.deleteNotification);

module.exports = router;