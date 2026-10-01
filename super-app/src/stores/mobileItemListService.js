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

  /**
   * Item detail — balance from every store, broken down by group.
   * GET /mobile/item-list/items/:itemId/balances
   *
   * @param {number|string} itemId
   * @returns {Promise<{
   *   success: boolean,
   *   data?: {
   *     item: { id, code, name, sku, unit, category, costPrice, hasCost, status },
   *     totals: { stores, groups, grandTotal },
   *     stores: Array<{
   *       storeId, storeName, storeCode, total,
   *       groups: Array<{
   *         balanceId, groupId, groupName,
   *         balance, minStockAlert, status, isLowStock
   *       }>
   *     }>
   *   },
   *   error?: string
   * }>}
   */
  getItemBalances: async (itemId) => {
    const response = await api.get(
      `/mobile/item-list/items/${itemId}/balances`
    );
    return response.data;
  },
};

export default mobileItemListService;