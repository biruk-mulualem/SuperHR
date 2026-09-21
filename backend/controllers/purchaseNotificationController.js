// controllers/purchaseNotificationController.js
'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { PurchaseNotification } = db;

// ================================================================
// HELPERS
// ================================================================
const isAdminRequest = (req) => {
  const user = req.user || {};
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? '').toLowerCase();
  return ['admin', 'administrator', 'superadmin'].includes(role);
};

const parsePagination = (query, { defaultLimit = 30, maxLimit = 200 } = {}) => {
  const pageNum = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(query.limit, 10) || defaultLimit, 1),
    maxLimit
  );
  return { pageNum, pageSize, offset: (pageNum - 1) * pageSize };
};

const toDto = (row) => {
  const plain = row.toJSON ? row.toJSON() : row;
  return {
    id: plain.id,
    purchaseType: plain.purchase_type,
    type: plain.type,
    title: plain.title,
    body: plain.body,
    referenceId: plain.reference_id,
    referenceType: plain.reference_type,
    metadata: plain.metadata || {},
    isRead: !!plain.is_read,
    readAt: plain.read_at,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
  };
};

// ================================================================
// 1. LIST  —  GET /api/mobile/purchase-notifications
// 🔒 Isolation: ALWAYS scoped to req.user.userId.
// ================================================================
exports.listNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No authenticated user' });
    }

    const { purchaseType = null, unreadOnly = 'false', type = null } = req.query;
    const { pageNum, pageSize, offset } = parsePagination(req.query);

    // 🔒 user_id comes from the JWT, never from the request body/query
    const where = { user_id: userId };

    if (purchaseType && ['local', 'foreign'].includes(purchaseType)) {
      where.purchase_type = purchaseType;
    }
    if (unreadOnly === 'true' || unreadOnly === true) {
      where.is_read = false;
    }
    if (type) where.type = type;

    const { count, rows } = await PurchaseNotification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.json({
      success: true,
      data: {
        items: rows.map(toDto),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (err) {
    console.error('❌ listNotifications error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 2. UNREAD COUNT  —  GET /api/mobile/purchase-notifications/unread-count
// 🔒 Isolation: count is ALWAYS for req.user.userId.
// ================================================================
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No authenticated user' });
    }

    const { purchaseType = null } = req.query;

    // 🔒 model static already scopes to user_id = userId
    const count = await PurchaseNotification.unreadCountFor(userId, purchaseType);

    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('❌ getUnreadCount error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 3. GET ONE  —  GET /api/mobile/purchase-notifications/:id
// 🔒 Isolation: 404 if the row doesn't belong to req.user.userId.
// ================================================================
exports.getNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const row = await PurchaseNotification.findOne({
      where: { id, user_id: userId },   // 🔒 ownership check in WHERE
    });

    if (!row) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, data: toDto(row) });
  } catch (err) {
    console.error('❌ getNotification error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 4. MARK ONE AS READ  —  PUT /api/mobile/purchase-notifications/:id/read
// 🔒 Isolation: model static enforces user_id = userId.
// ================================================================
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    // 🔒 markRead(id, userId) → where { id, user_id: userId }
    const row = await PurchaseNotification.markRead(id, userId);

    if (!row) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, data: toDto(row) });
  } catch (err) {
    console.error('❌ markAsRead error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 5. MARK ALL AS READ  —  PUT /api/mobile/purchase-notifications/read-all
// 🔒 Isolation: only marks rows where user_id = req.user.userId.
// ================================================================
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No authenticated user' });
    }

    const { purchaseType = null } = req.body || {};

    // 🔒 markAllRead(userId, purchaseType) → where { user_id: userId }
    const affected = await PurchaseNotification.markAllRead(userId, purchaseType);

    res.json({
      success: true,
      message: `${affected} notification(s) marked as read`,
      data: { affected },
    });
  } catch (err) {
    console.error('❌ markAllAsRead error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 6. DELETE ONE  —  DELETE /api/mobile/purchase-notifications/:id
// 🔒 Isolation: 404 if the row isn't owned by req.user.userId.
// ================================================================
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const row = await PurchaseNotification.findOne({
      where: { id, user_id: userId },   // 🔒 ownership check in WHERE
    });

    if (!row) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await row.destroy();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('❌ deleteNotification error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 7. DELETE ALL READ  —  DELETE /api/mobile/purchase-notifications/read
// 🔒 Isolation: only deletes rows where user_id = req.user.userId.
// ================================================================
exports.deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const affected = await PurchaseNotification.destroy({
      where: { user_id: userId, is_read: true },   // 🔒 ownership check
    });

    res.json({
      success: true,
      message: `${affected} read notification(s) deleted`,
      data: { affected },
    });
  } catch (err) {
    console.error('❌ deleteReadNotifications error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 8. ADMIN BROADCAST  —  POST /api/mobile/purchase-notifications
// 🔒 Isolation: admin only. Admin explicitly lists recipient userIds.
//    user_id is NEVER taken from the client's own identity.
// ================================================================
exports.createNotification = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const {
      userIds,
      purchaseType = 'local',
      type,
      title,
      body = null,
      referenceId = null,
      referenceType = null,
      metadata = {},
    } = req.body || {};

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds array is required' });
    }
    if (!type || !title) {
      return res.status(400).json({ success: false, error: 'type and title are required' });
    }

    // 🔒 Strip any client-supplied user_id from metadata (defensive)
    const sanitizedMetadata = { ...(metadata || {}) };
    delete sanitizedMetadata.user_id;
    delete sanitizedMetadata.userId;

    const rows = await PurchaseNotification.notifyMany(userIds, {
      purchaseType,
      type,
      title,
      body,
      referenceId,
      referenceType,
      metadata: sanitizedMetadata,
    });

    res.status(201).json({
      success: true,
      message: `Notification sent to ${rows.length} user(s)`,
      data: { count: rows.length },
    });
  } catch (err) {
    console.error('❌ createNotification error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const row = await PurchaseNotification.findOne({
      where: { id, user_id: userId },   // 🔒 ownership check
    });

    if (!row) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await row.destroy();
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('❌ deleteNotification error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};