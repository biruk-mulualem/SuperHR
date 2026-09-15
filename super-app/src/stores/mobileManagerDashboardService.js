// super-app/src/stores/mobileManagerDashboardService.js
import api from './interceptor';

export const mobileManagerDashboardService = {
  /**
   * Lightweight badge counts for the manager dashboard.
   * GET {API_BASE}/mobile/manager-dashboard/purchase-summary
   *
   * @returns {Promise<{ success: boolean, data?: { pendingApproval: number, pendingPayment: number }, error?: string }>}
   */
  getPurchaseSummary: async () => {
    const response = await api.get('/mobile/manager-dashboard/purchase-summary');
    return response.data;
  },

  /**
   * Full dashboard payload (summary + recent requests).
   * GET {API_BASE}/mobile/manager-dashboard
   *
   * @returns {Promise<{ success: boolean, data?: { summary: object, recentRequests: any[], lastUpdated: string }, error?: string }>}
   */
  getDashboard: async () => {
    const response = await api.get('/mobile/manager-dashboard');
    return response.data;
  },
};

export default mobileManagerDashboardService;