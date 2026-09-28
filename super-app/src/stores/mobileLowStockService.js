import api from './interceptor';

export const mobileLowStockService = {
  /**
   * List stock alerts (paginated).
   * GET /mobile/low-stock/alerts?page=1&limit=10
   *
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   */
  getAlerts: async (params = {}) => {
    const response = await api.get('/mobile/low-stock/alerts', { params });
    return response.data;
  },

  createAlert: async (payload) => {
    const response = await api.post('/mobile/low-stock/alerts', payload);
    return response.data;
  },

  deleteAlert: async (id) => {
    const response = await api.delete(`/mobile/low-stock/alerts/${id}`);
    return response.data;
  },
};

export default mobileLowStockService;