// src/stores/notificationService.js
import api from './interceptor';

// ============================================================================
// NOTIFICATION SERVICE (mobile)
// All endpoints are user-scoped by the backend — the JWT carries the user id.
// ============================================================================
class NotificationService {
  // ----------------------------------------------------------------
  // LIST  —  GET /api/mobile/purchase-notifications
  // ----------------------------------------------------------------
  async list({
    purchaseType = null,
    unreadOnly = false,
    type = null,
    page = 1,
    limit = 30,
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (purchaseType) params.append('purchaseType', purchaseType);
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (type) params.append('type', type);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await api.get(
        `/mobile/purchase-notifications?${params.toString()}`
      );

      return {
        success: true,
        items: res.data?.data?.items || [],
        total: res.data?.data?.total || 0,
        page: res.data?.data?.page || 1,
        pageSize: res.data?.data?.pageSize || limit,
        totalPages: res.data?.data?.totalPages || 1,
      };
    } catch (error) {
      console.error('List notifications error:', error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          'Failed to load notifications',
        items: [],
        total: 0,
        page: 1,
        pageSize: limit,
        totalPages: 1,
      };
    }
  }

  // ----------------------------------------------------------------
  // UNREAD COUNT  —  GET /api/mobile/purchase-notifications/unread-count
  // ----------------------------------------------------------------
  async unreadCount(purchaseType = null) {
    try {
      const q = purchaseType ? `?purchaseType=${purchaseType}` : '';
      const res = await api.get(
        `/mobile/purchase-notifications/unread-count${q}`
      );
      return { success: true, count: res.data?.data?.count || 0 };
    } catch (error) {
      console.error('Unread count error:', error);
      return { success: false, count: 0, error: error.message };
    }
  }

  // ----------------------------------------------------------------
  // GET ONE  —  GET /api/mobile/purchase-notifications/:id
  // ----------------------------------------------------------------
  async getById(id) {
    try {
      const res = await api.get(`/mobile/purchase-notifications/${id}`);
      return { success: true, notification: res.data?.data };
    } catch (error) {
      console.error('Get notification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to load notification',
      };
    }
  }

  // ----------------------------------------------------------------
  // MARK ONE AS READ  —  PUT /api/mobile/purchase-notifications/:id/read
  // ----------------------------------------------------------------
  async markAsRead(id) {
    try {
      const res = await api.put(`/mobile/purchase-notifications/${id}/read`);
      return { success: true, notification: res.data?.data };
    } catch (error) {
      console.error('Mark read error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to mark as read',
      };
    }
  }

  // ----------------------------------------------------------------
  // MARK ALL AS READ  —  PUT /api/mobile/purchase-notifications/read-all
  // ----------------------------------------------------------------
  async markAllAsRead(purchaseType = null) {
    try {
      const res = await api.put(
        '/mobile/purchase-notifications/read-all',
        { purchaseType }
      );
      return {
        success: true,
        affected: res.data?.data?.affected || 0,
        message: res.data?.message,
      };
    } catch (error) {
      console.error('Mark all read error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to mark all as read',
      };
    }
  }

  // ----------------------------------------------------------------
  // DELETE ONE  —  DELETE /api/mobile/purchase-notifications/:id
  // ----------------------------------------------------------------
  async remove(id) {
    try {
      const res = await api.delete(`/mobile/purchase-notifications/${id}`);
      return {
        success: true,
        message: res.data?.message,
      };
    } catch (error) {
      console.error('Delete notification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete notification',
      };
    }
  }

  // ----------------------------------------------------------------
  // DELETE ALL READ  —  DELETE /api/mobile/purchase-notifications/read
  // ----------------------------------------------------------------
  async deleteAllRead() {
    try {
      const res = await api.delete('/mobile/purchase-notifications/read');
      return {
        success: true,
        affected: res.data?.data?.affected || 0,
      };
    } catch (error) {
      console.error('Delete read error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete read',
      };
    }
  }

  // ================================================================
  // UTILITY — no network, pure formatting
  // ================================================================

  getIcon(type) {
    const map = {
      dispatch: '📤',
      dispatch_boss: '📋',
      approval_request: '📨',
      price_submitted: '💵',
      winner_selected: '🏆',
      request_approved: '✅',
      request_declined: '❌',
      request_deleted: '🗑️',
      purchase_reminder: '⏰',
    };
    return map[type] || '🔔';
  }

  getAccentColor(type) {
    const map = {
      dispatch: '#3B82F6',
      dispatch_boss: '#8B5CF6',
      approval_request: '#F59E0B',
      price_submitted: '#06B6D4',
      winner_selected: '#10B981',
      request_approved: '#10B981',
      request_declined: '#EF4444',
      request_deleted: '#64748B',
      purchase_reminder: '#F97316',
    };
    return map[type] || '#64748B';
  }

  formatRelativeTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    const diffMs = Date.now() - d.getTime();
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (sec < 60) return 'just now';
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDateTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  groupByDate(items) {
    const groups = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    (items || []).forEach((item) => {
      const d = new Date(item.createdAt);
      if (isNaN(d.getTime())) {
        groups.Older.push(item);
        return;
      }
      if (d >= startOfToday) groups.Today.push(item);
      else if (d >= startOfYesterday) groups.Yesterday.push(item);
      else if (d >= startOfWeek) groups['This Week'].push(item);
      else groups.Older.push(item);
    });

    return groups;
  }
}

export default new NotificationService();