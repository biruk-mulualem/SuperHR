// super-app/src/stores/mobileNotificationService.js
import api from './interceptor';

export const mobileNotificationService = {
  // ================================================================
  // ICON HELPERS (used by NotificationPage)
  // ================================================================
  getIcon(type) {
    const ICON_MAP = {
      dispatch:          '📦',
      dispatch_boss:     '📦',
      approval_request:  '⏳',
      price_submitted:   '💰',
      winner_selected:   '🏆',
      request_approved:  '✅',
      request_declined:  '❌',
      request_deleted:   '🗑️',
      purchase_reminder: '🔔',
      order:             '🛒',
      payment:           '💳',
      alert:             '⚠️',
      approval:          '⏳',
      system:            '⚙️',
    };
    return ICON_MAP[type] || '🔔';
  },

  formatRelativeTime(isoString) {
    if (!isoString) return '';
    const then = new Date(isoString).getTime();
    if (Number.isNaN(then)) return '';

    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - then) / 1000));

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return new Date(isoString).toLocaleDateString();
  },

  // ================================================================
  // LIST
  // ================================================================

  /**
   * Paginated list of notifications for the current user.
   * GET /mobile/notifications
   *
   * Response:
   *   {
   *     success: true,
   *     data: {
   *       items: [
   *         {
   *           id, purchaseType, type, title, body,
   *           referenceId, referenceType, metadata,
   *           isRead, readAt, createdAt, updatedAt
   *         }
   *       ],
   *       total, page, pageSize, totalPages
   *     }
   *   }
   *
   * @param {Object} [params]
   * @param {'local'|'foreign'|'posts'} [params.purchaseType]
   * @param {boolean} [params.unreadOnly=false]
   * @param {string}  [params.type]
   * @param {number}  [params.page=1]
   * @param {number}  [params.limit=30]
   */
  list: async ({
    purchaseType,
    unreadOnly = false,
    type,
    page = 1,
    limit = 30,
  } = {}) => {
    const params = { page, limit };
    if (purchaseType) params.purchaseType = purchaseType;
    if (unreadOnly) params.unreadOnly = 'true';
    if (type) params.type = type;

    const response = await api.get('/mobile/notifications', { params });
    return response.data;
  },

  // ================================================================
  // UNREAD COUNT
  // ================================================================

  /**
   * Unread count for the current user (optionally scoped).
   * GET /mobile/notifications/unread-count
   *
   * Response:
   *   { success: true, data: { count } }
   *
   * @param {'local'|'foreign'|'posts'} [purchaseType]
   */
  unreadCount: async (purchaseType) => {
    const params = {};
    if (purchaseType) params.purchaseType = purchaseType;

    const response = await api.get('/mobile/notifications/unread-count', {
      params,
    });
    return response.data;
  },

  // ================================================================
  // GET ONE
  // ================================================================

  /**
   * Fetch a single notification by id.
   * GET /mobile/notifications/:id
   *
   * @param {number|string} id
   */
  get: async (id) => {
    const response = await api.get(`/mobile/notifications/${id}`);
    return response.data;
  },

  // ================================================================
  // MARK ONE AS READ
  // ================================================================

  /**
   * Mark a single notification as read.
   * POST /mobile/notifications/:id/read
   *
   * @param {number|string} id
   */
  markRead: async (id) => {
    const response = await api.post(`/mobile/notifications/${id}/read`);
    return response.data;
  },

  // ================================================================
  // MARK ALL AS READ
  // ================================================================

  /**
   * Mark all notifications as read (optionally scoped).
   * POST /mobile/notifications/read-all
   *
   * Response:
   *   { success: true, message, data: { affected } }
   *
   * @param {'local'|'foreign'|'posts'} [purchaseType]
   */
  markAllAsRead: async (purchaseType) => {
    const body = {};
    if (purchaseType) body.purchaseType = purchaseType;

    const response = await api.post('/mobile/notifications/read-all', body);
    return response.data;
  },

  // ================================================================
  // DELETE ONE
  // ================================================================

  /**
   * Delete a single notification.
   * DELETE /mobile/notifications/:id
   *
   * @param {number|string} id
   */
  remove: async (id) => {
    const response = await api.delete(`/mobile/notifications/${id}`);
    return response.data;
  },

  // ================================================================
  // DELETE ALL READ
  // ================================================================

  /**
   * Delete all read notifications for the current user.
   * DELETE /mobile/notifications/read
   *
   * Response:
   *   { success: true, message, data: { affected } }
   */
  deleteRead: async () => {
    const response = await api.delete('/mobile/notifications/read');
    return response.data;
  },

  // ================================================================
  // CREATE (admin broadcast)
  // ================================================================

  /**
   * Broadcast a notification to one or more users. Admin only.
   * POST /mobile/notifications
   *
   * Response:
   *   { success: true, message, data: { count } }
   *
   * @param {Object} payload
   * @param {number[]} payload.userIds
   * @param {'local'|'foreign'|'posts'} [payload.purchaseType='local']
   * @param {string} payload.type
   * @param {string} payload.title
   * @param {string} [payload.body]
   * @param {number|string} [payload.referenceId]
   * @param {string} [payload.referenceType]
   * @param {Object} [payload.metadata={}]
   */
  create: async ({
    userIds,
    purchaseType = 'local',
    type,
    title,
    body = null,
    referenceId = null,
    referenceType = null,
    metadata = {},
  }) => {
    const response = await api.post('/mobile/notifications', {
      userIds,
      purchaseType,
      type,
      title,
      body,
      referenceId,
      referenceType,
      metadata,
    });
    return response.data;
  },
};

export default mobileNotificationService;