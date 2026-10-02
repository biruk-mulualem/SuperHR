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

  // ================================================================
  // STOCK ALERTS
  // ================================================================

  /**
   * Read the stock alert config for an item.
   * GET /mobile/item-list/items/:itemId/stock-alert
   *
   * @param {number|string} itemId
   * @returns {Promise<{
   *   success: boolean,
   *   data?: { id, itemId, threshold, createdBy, createdAt, updatedAt } | null,
   *   error?: string
   * }>}
   */
  getStockAlert: async (itemId) => {
    const response = await api.get(
      `/mobile/item-list/items/${itemId}/stock-alert`
    );
    return response.data;
  },

  /**
   * Upsert the stock alert threshold for an item.
   * Setting `threshold` to 0 clears the alert (backend deletes the row).
   * PUT /mobile/item-list/items/:itemId/stock-alert
   *
   * @param {number|string} itemId
   * @param {number} threshold
   * @returns {Promise<{
   *   success: boolean,
   *   data?: { id, itemId, threshold, createdBy, createdAt, updatedAt } | null,
   *   message?: string,
   *   error?: string
   * }>}
   */
  setStockAlert: async (itemId, threshold) => {
    const response = await api.put(
      `/mobile/item-list/items/${itemId}/stock-alert`,
      { threshold }
    );
    return response.data;
  },

  /**
   * Remove the stock alert config for an item.
   * DELETE /mobile/item-list/items/:itemId/stock-alert
   *
   * @param {number|string} itemId
   * @returns {Promise<{ success: boolean, message?: string, error?: string }>}
   */
  clearStockAlert: async (itemId) => {
    const response = await api.delete(
      `/mobile/item-list/items/${itemId}/stock-alert`
    );
    return response.data;
  },
};

export default mobileItemListService;