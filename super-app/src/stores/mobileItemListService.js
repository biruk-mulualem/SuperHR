// super-app/src/stores/mobileItemListService.js
import api from './interceptor';

export const mobileItemListService = {
  /**
   * Item list for the mobile items page.
   * GET /mobile/item-list/items
   *
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {'all'|'active'|'inactive'|'nocost'} [params.status]
   * @param {string} [params.q]
   * @param {number} [params.categoryId]
   */
  getItemsList: async (params = {}) => {
    const response = await api.get('/mobile/item-list/items', { params });
    return response.data;
  },
};

export default mobileItemListService;