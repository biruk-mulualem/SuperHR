// stores/purchaserService.js
import api from './interceptor';

const BASE = '/mobile/purchaser';

export const purchaserService = {
  // ================================================================
  // DASHBOARD
  // ================================================================
  getDashboard: async () => {
    const response = await api.get(BASE);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get(`${BASE}/summary`);
    return response.data;
  },

  // ================================================================
  // PENDING SUBMISSION
  // ================================================================
  getPendingSubmissions: async ({ page = 1, limit = 50, search = '' } = {}) => {
    const qp = new URLSearchParams();
    qp.append('page', String(page));
    qp.append('limit', String(limit));
    if (search && search.trim()) qp.append('search', search.trim());

    const response = await api.get(`${BASE}/requests?${qp.toString()}`);
    return response.data;
  },

  // ================================================================
  // SUBMITTED
  // ================================================================
  getSubmittedSubmissions: async ({ page = 1, limit = 50, search = '' } = {}) => {
    const qp = new URLSearchParams();
    qp.append('page', String(page));
    qp.append('limit', String(limit));
    if (search && search.trim()) qp.append('search', search.trim());

    const response = await api.get(`${BASE}/submitted?${qp.toString()}`);
    return response.data;
  },

  // ================================================================
  // SINGLE DETAIL (used by both lists)
  // ================================================================
  getPurchaseRequestDetail: async (id) => {
    const response = await api.get(`${BASE}/requests/${id}`);
    return response.data;
  },

  // ================================================================
  // PRICE ACTIONS
  // ================================================================
  submitPrice: async (itemId, payload) => {
    const response = await api.post(`${BASE}/items/${itemId}/prices`, payload);
    return response.data;
  },

  updatePrice: async (priceId, payload) => {
    const response = await api.put(`${BASE}/prices/${priceId}`, payload);
    return response.data;
  },
};

export default purchaserService;