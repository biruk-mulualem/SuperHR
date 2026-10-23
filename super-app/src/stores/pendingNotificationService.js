// stores/pendingNotificationService.js
import api from './interceptor';

// ============================================================================
// PENDING NOTIFICATION SERVICE
// ============================================================================
class PendingNotificationService {
  // ============================================================================
  // FETCH NOTIFICATIONS
  // ============================================================================

  /**
   * Fetch GROUP notifications for a specific store + group.
   * GET /item-requests/notifications/:storeId/:groupId
   */
  async getGroupNotifications(storeId, groupId, params = {}) {
    try {
      if (!storeId || !groupId) {
        return { success: true, data: [], notifications: [] };
      }

      const queryParams = new URLSearchParams();
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `/item-requests/notifications/${storeId}/${groupId}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const response = await api.get(url);

      return {
        success: true,
        data: response.data.data?.notifications || [],
        summary: response.data.data?.summary || { total: 0, pending: 0, accepted: 0, rejected: 0 },
        pagination: response.data.data?.pagination || null,
      };
    } catch (error) {
      console.error('Get group notifications error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch group notifications',
        data: [],
      };
    }
  }

  /**
   * Fetch DEPARTMENT notifications for a specific department.
   * GET /item-requests/notifications/department/:departmentId
   */
  async getDepartmentNotifications(departmentId, params = {}) {
    try {
      if (!departmentId || isNaN(departmentId) || departmentId <= 0) {
        return { success: true, data: [], notifications: [] };
      }

      const queryParams = new URLSearchParams();
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `/item-requests/notifications/department/${departmentId}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const response = await api.get(url);

      return {
        success: true,
        data: response.data.data?.notifications || [],
        summary: response.data.data?.summary || { total: 0, pending: 0, accepted: 0, rejected: 0 },
        pagination: response.data.data?.pagination || null,
      };
    } catch (error) {
      console.error('Get department notifications error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch department notifications',
        data: [],
      };
    }
  }

  /**
   * Fetch ALL notifications (Group + Department) for a user session and merge them.
   * Handles missing store/group/department gracefully.
   */
  async getAllNotifications(session, params = {}) {
    try {
      const { storeId, groupId, departmentId } = session || {};
      const tasks = [];

      if (storeId && groupId) {
        tasks.push(this.getGroupNotifications(storeId, groupId, params));
      }
      if (departmentId) {
        tasks.push(this.getDepartmentNotifications(departmentId, params));
      }

      if (tasks.length === 0) {
        return { success: true, data: [], notifications: [] };
      }

      const results = await Promise.all(tasks);
      const groupNotifs = results
        .filter((r) => r.success)
        .flatMap((r) => r.data || [])
        .map((n) => ({ ...n, approval_type: n.approval_type || 'group' }));

      // Sort newest first
      const sorted = groupNotifs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return { success: true, data: sorted, notifications: sorted };
    } catch (error) {
      console.error('Get all notifications error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to load notifications',
        data: [],
      };
    }
  }

  // ============================================================================
  // ACCEPT / REJECT ACTIONS
  // ============================================================================

  /**
   * Accept a single pending notification.
   * POST /item-requests/notifications/:notificationId/accept
   */
  async acceptNotification(notificationId) {
    try {
      if (!notificationId) {
        return { success: false, error: 'Missing notification ID' };
      }

      const response = await api.post(`/item-requests/notifications/${notificationId}/accept`);

      return {
        success: true,
        message: response.data.message || 'Notification accepted',
        data: response.data.data,
        stageAdvanced: response.data.stageAdvanced || false,
        advancementReason: response.data.advancementReason || null,
      };
    } catch (error) {
      console.error('Accept notification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to accept notification',
      };
    }
  }

  /**
   * Reject a single pending notification with a reason.
   * POST /item-requests/notifications/:notificationId/reject
   */
  async rejectNotification(notificationId, reason) {
    try {
      if (!notificationId) {
        return { success: false, error: 'Missing notification ID' };
      }
      if (!reason || !reason.trim()) {
        return { success: false, error: 'A rejection reason is required' };
      }

      const response = await api.post(
        `/item-requests/notifications/${notificationId}/reject`,
        { reason: reason.trim() }
      );

      return {
        success: true,
        message: response.data.message || 'Notification rejected',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Reject notification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reject notification',
      };
    }
  }

  /**
   * Flip an existing decision (accepted ↔ rejected).
   * POST /item-requests/notifications/:notificationId/change
   */
  async changeDecision(notificationId, status, reason) {
    try {
      if (!notificationId) {
        return { success: false, error: 'Missing notification ID' };
      }
      if (!['accepted', 'rejected'].includes(status)) {
        return { success: false, error: 'Status must be "accepted" or "rejected"' };
      }
      if (status === 'rejected' && (!reason || !reason.trim())) {
        return { success: false, error: 'A rejection reason is required' };
      }

      const response = await api.post(
        `/item-requests/notifications/${notificationId}/change`,
        {
          status,
          reason: status === 'rejected' ? reason.trim() : undefined,
        }
      );

      return {
        success: true,
        message: response.data.message || 'Decision changed',
        data: response.data.data,
      };
    } catch (error) {
      console.error('Change decision error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to change decision',
      };
    }
  }

  // ============================================================================
  // BULK OPERATIONS (Group the pending actions on a whole request)
  // ============================================================================

  /**
   * Accept ALL pending notifications for a given request entry.
   * @param {object} entry — the grouped request entry (with .approvals array)
   */
  async acceptAllPendingForRequest(entry) {
    try {
      const pending = (entry?.approvals || []).filter((a) => a.status === 'pending');
      if (pending.length === 0) {
        return { success: true, accepted: 0, errors: [] };
      }

      const results = await Promise.all(
        pending.map((a) => this.acceptNotification(a.id))
      );

      const accepted = results.filter((r) => r.success).length;
      const errors = results.filter((r) => !r.success).map((r) => r.error);

      return {
        success: accepted > 0,
        accepted,
        errors,
        total: pending.length,
      };
    } catch (error) {
      console.error('Accept all pending error:', error);
      return { success: false, accepted: 0, errors: ['Failed to accept notifications'] };
    }
  }

  /**
   * Reject ALL pending notifications for a given request entry.
   */
  async rejectAllPendingForRequest(entry, reason) {
    try {
      if (!reason || !reason.trim()) {
        return { success: false, rejected: 0, error: 'Rejection reason required' };
      }

      const pending = (entry?.approvals || []).filter((a) => a.status === 'pending');
      if (pending.length === 0) {
        return { success: true, rejected: 0, errors: [] };
      }

      const results = await Promise.all(
        pending.map((a) => this.rejectNotification(a.id, reason))
      );

      const rejected = results.filter((r) => r.success).length;
      const errors = results.filter((r) => !r.success).map((r) => r.error);

      return {
        success: rejected > 0,
        rejected,
        errors,
        total: pending.length,
      };
    } catch (error) {
      console.error('Reject all pending error:', error);
      return { success: false, rejected: 0, errors: ['Failed to reject notifications'] };
    }
  }

  /**
   * Change the decision for ALL decided approvals of a request.
   */
  async changeAllDecisionsForRequest(entry, newStatus, reason) {
    try {
      const decided = (entry?.approvals || []).filter(
        (a) => a.status === 'accepted' || a.status === 'rejected'
      );
      if (decided.length === 0) {
        return { success: true, changed: 0, errors: [] };
      }

      const results = await Promise.all(
        decided.map((a) => this.changeDecision(a.id, newStatus, reason))
      );

      const changed = results.filter((r) => r.success).length;
      const errors = results.filter((r) => !r.success).map((r) => r.error);

      return {
        success: changed > 0,
        changed,
        errors,
        total: decided.length,
      };
    } catch (error) {
      console.error('Change all decisions error:', error);
      return { success: false, changed: 0, errors: ['Failed to change decisions'] };
    }
  }

  // ============================================================================
  // UTILITY METHODS (no network — pure formatting / grouping)
  // ============================================================================

  /**
   * Group a flat array of notifications by `request_id`.
   * Returns an array of `{ requestId, request, approvals, summaryStatus, ... }`.
   */
  groupByRequest(notifications) {
    if (!Array.isArray(notifications)) return [];

    const map = new Map();
    for (const n of notifications) {
      const req = n.request;
      if (!req) continue;
      const rid = req.requestId;
      if (!map.has(rid)) {
        map.set(rid, { requestId: rid, request: req, approvals: [], latestCreatedAt: 0 });
      }
      const entry = map.get(rid);
      entry.approvals.push(n);
      const t = n.created_at ? new Date(n.created_at).getTime() : 0;
      if (t > entry.latestCreatedAt) entry.latestCreatedAt = t;
    }

    return Array.from(map.values()).map((entry) => {
      const st = entry.approvals.map((a) => a.status);
      const hasPending = st.includes('pending');
      const hasRejected = st.includes('rejected');
      const hasAccepted = st.includes('accepted');

      let summaryStatus = 'pending';
      if (hasRejected) summaryStatus = 'rejected';
      else if (hasPending) summaryStatus = 'pending';
      else if (hasAccepted) summaryStatus = 'accepted';

      return {
        ...entry,
        summaryStatus,
        acceptedCount: st.filter((s) => s === 'accepted').length,
        pendingCount: st.filter((s) => s === 'pending').length,
        rejectedCount: st.filter((s) => s === 'rejected').length,
      };
    });
  }

  /**
   * Group the already-grouped requests by date bucket.
   */
  groupByDate(requests) {
    if (!Array.isArray(requests)) return [];
    const groups = {};
    const sorted = [...requests].sort((a, b) => b.latestCreatedAt - a.latestCreatedAt);
    for (const req of sorted) {
      const key = new Date(req.latestCreatedAt).toDateString();
      if (!groups[key]) {
        groups[key] = {
          date: this.formatDateGroup(new Date(req.latestCreatedAt)),
          requests: [],
        };
      }
      groups[key].requests.push(req);
    }
    return Object.values(groups);
  }

  /**
   * Format a date as "Today" / "Yesterday" / long date.
   */
  formatDateGroup(date) {
    const d = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const key = (x) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
    if (key(d) === key(today)) return 'Today';
    if (key(d) === key(yest)) return 'Yesterday';
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Check if a store is the "Others" bucket.
   */
  isOtherStore(request) {
    const s = request?.askingStore;
    if (!s) return false;
    const code = (s.code || '').toUpperCase();
    const name = (s.name || '').trim().toLowerCase();
    return code === 'STORE-008' || name === 'other' || name === 'others';
  }

  /**
   * Return the display name of the origin of the request.
   */
  getOriginName(request) {
    if (!request) return '—';
    if (this.isOtherStore(request)) {
      return request.requestedByUser?.Department?.name || 'External';
    }
    return request.askingStore?.name || '—';
  }

  /**
   * Get a compact string of item names.
   */
  getItemNames(items) {
    if (!items || !items.length) return '';
    const names = items.map((i) => i.item?.name || i.itemName || i.name || 'Unknown');
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  }

  /**
   * Human-readable "time ago" (e.g. "5m ago", "2h ago").
   */
  formatAgo(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 0) return 'Just now';
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (day < 30) return `${day}d ago`;
    if (day < 365) return `${Math.floor(day / 30)}mo ago`;
    return `${Math.floor(day / 365)}y ago`;
  }

  /**
   * Format a date as "DD/MM/YYYY".
   */
  formatPaperDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;
  }

  /**
   * Format a full date+time.
   */
  formatDateTimeFull(date) {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  /**
   * Format a Temelash date (no time).
   */
  formatTemelashDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Capitalize a string ("pending" → "Pending").
   */
  capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export default new PendingNotificationService();