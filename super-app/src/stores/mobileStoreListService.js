// super-app/src/stores/mobileStoreListService.js
import api from './interceptor';

export const mobileStoreListService = {
  // ================================================================
  // STORE LIST
  // ================================================================

  /**
   * Store summary list for the mobile stores page.
   * GET /mobile/store-list/summary
   *
   * Response:
   *   {
   *     success: true,
   *     data: {
   *       stores: [
   *         {
   *           id, code, name, location, status,
   *           items,
   *           groups: [{ id, name, balance }]
   *         }
   *       ],
   *       pagination: { page, limit, total, totalPages, hasMore }
   *     }
   *   }
   *
   * @param {Object} [params]
   * @param {'all'|'active'|'inactive'} [params.status]
   * @param {string} [params.q]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   */
  getStoreSummary: async (params = {}) => {
    const response = await api.get('/mobile/store-list/summary', { params });
    return response.data;
  },
};

export default mobileStoreListService;