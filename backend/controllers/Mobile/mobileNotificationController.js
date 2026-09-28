// controllers/Mobile/mobileNotificationController.js
'use strict';

const db = require('../../models');
const { MobileNotification } = db;

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

const ALLOWED_SCOPES = ['local', 'foreign', 'posts'];

const toDto = (row) => {
  const plain = row.toJSON ? row.toJSON() : row;
  return {
    id: plain.id,
    scope: plain.scope,
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
// 1. LIST — GET /api/mobile/notifications
// ================================================================
exports.listNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No authenticated user' });
    }

    const { scope = null, unreadOnly = 'false', type = null } = req.query;
    const { pageNum, pageSize, offset } = parsePagination(req.query);

    const where = { user_id: userId };
    if (scope && ALLOWED_SCOPES.includes(scope)) {
      where.scope = scope;
    }
    if (unreadOnly === 'true' || unreadOnly === true) {
      where.is_read = false;
    }
    if (type) where.type = type;

    const { count, rows } = await MobileNotification.findAndCountAll({
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
// 2. UNREAD COUNT — GET /api/mobile/notifications/unread-count
// ================================================================
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No authenticated user' });
    }

    const { scope = null } = req.query;
    const scopedType = scope && ALLOWED_SCOPES.includes(scope) ? scope : null;

    const count = await MobileNotification.unreadCountFor(userId, scopedType);
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('❌ getUnreadCount error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 3. GET ONE — GET /api/mobile/notifications/:id
// ================================================================
exports.getNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const row = await MobileNotification.findOne({
      where: { id, user_id: userId },
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
// 4. MARK ONE AS READ — POST /api/mobile/notifications/:id/read
// ================================================================
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const row = await MobileNotification.markRead(id, userId);
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
// 5. MARK ALL AS READ — POST /api/mobile/notifications/read-all
// ================================================================
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No authenticated user' });
    }

    const { scope = null } = req.body || {};
    const scopedType = scope && ALLOWED_SCOPES.includes(scope) ? scope : null;

    const affected = await MobileNotification.markAllRead(userId, scopedType);

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
// 6. DELETE ONE — DELETE /api/mobile/notifications/:id
// ================================================================
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const row = await MobileNotification.findOne({
      where: { id, user_id: userId },
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
// 7. DELETE ALL READ — DELETE /api/mobile/notifications/read
// ================================================================
exports.deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const affected = await MobileNotification.destroy({
      where: { user_id: userId, is_read: true },
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
// 8. ADMIN BROADCAST — POST /api/mobile/notifications
// ================================================================
exports.createNotification = async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }

    const {
      userIds,
      scope = 'local',
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

    const sanitizedMetadata = { ...(metadata || {}) };
    delete sanitizedMetadata.user_id;
    delete sanitizedMetadata.userId;

    const rows = await MobileNotification.notifyMany(userIds, {
      scope,
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