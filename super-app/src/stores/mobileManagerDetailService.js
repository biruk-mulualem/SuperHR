// super-app/src/stores/mobileManagerDetailService.js
import api from './interceptor';

export const mobileManagerDetailService = {
  // ================================================================
  // LIST
  // ================================================================

  /**
   * Pending approvals dispatched to the current manager.
   * GET /mobile/purchase-requests?status=pending
   */
  getPendingApprovals: async (params = {}) => {
    const { status = 'pending', ...rest } = params;
    const response = await api.get('/mobile/purchase-requests', {
      params: { status, ...rest },
    });
    return response.data;
  },

  /**
   * All requests (any status).
   * GET /mobile/purchase-requests?status=all
   */
  getAllRequests: async (params = {}) => {
    const response = await api.get('/mobile/purchase-requests', {
      params: { status: 'all', ...params },
    });
    return response.data;
  },

  /**
   * Approved but not yet paid.
   * GET /mobile/purchase-requests?status=approved
   */
  getApprovedNotPaid: async (params = {}) => {
    const response = await api.get('/mobile/purchase-requests', {
      params: { status: 'approved', ...params },
    });
    return response.data;
  },

  // ================================================================
  // DETAIL
  // ================================================================

  /**
   * Full detail by ID.
   * GET /mobile/purchase-requests/:id
   */
  getRequestDetail: async (requestId) => {
    const response = await api.get(`/mobile/purchase-requests/${requestId}`);
    return response.data;
  },

  /**
   * Full detail by PR number — used for notification deep-links.
   * GET /mobile/detail/requests/by-number/:prNumber
   */
  getRequestDetailByNumber: async (prNumber) => {
    const response = await api.get(
      `/mobile/detail/requests/by-number/${prNumber}`,
    );
    return response.data;
  },

  // ================================================================
  // ACTIONS
  // ================================================================

  /**
   * Approve a request.
   * POST /mobile/purchase-requests/:id/approve
   */
  approveRequest: async (requestId) => {
    const response = await api.post(
      `/mobile/purchase-requests/${requestId}/approve`,
    );
    return response.data;
  },

  /**
   * Decline a request with a reason.
   * POST /mobile/purchase-requests/:id/decline
   */
  declineRequest: async (requestId, reason) => {
    const response = await api.post(
      `/mobile/purchase-requests/${requestId}/decline`,
      { reason },
    );
    return response.data;
  },
};

export default mobileManagerDetailService;