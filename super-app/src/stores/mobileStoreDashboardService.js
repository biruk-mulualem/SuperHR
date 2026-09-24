// super-app/src/stores/mobileStoreDashboardService.js
import api from './interceptor';

/**
 * Mobile Store Dashboard Service
 * ------------------------------
 * Wraps the Manager Store Dashboard backend endpoint:
 *   GET /mobile/manager/store-dashboard/summary
 *
 * Returns the raw `response.data` from the API, matching the envelope
 * used across other mobile services:
 *   { success: true,  data: {...} }
 *   { success: false, error: 'message' }
 *
 * Errors bubble up to the caller — wrap in try/catch if you need custom UX.
 */

export const mobileStoreDashboardService = {
  /**
   * Full store dashboard summary — global counters + a preview list of
   * stores with their groups and a small item preview.
   *
   * GET /mobile/manager/store-dashboard/summary
   *
   * @param {Object}  [params]
   * @param {number}  [params.storeLimit=5]      How many stores to preview
   * @param {number}  [params.itemsPerStore=20]  Cap on items returned per store
   *
   * @returns {Promise<{
   *   success: boolean,
   *   data?: {
   *     totalStores: number,
   *     activeStores: number,
   *     totalItems: number,
   *     activeItems: number,
   *     inactiveItems: number,
   *     lowStock: number,
   *     outOfStock: number,
   *     auditedItems: number,
   *     matchedItems: number,
   *     conflictedItems: number,
   *     stores: Array<{
   *       id: number,
   *       name: string,
   *       location: string|null,
   *       city: string|null,
   *       status: string,
   *       items: number,
   *       groups: Array<{
   *         id: number,
   *         name: string,
   *         systemBalance: number,
   *         countedBalance: number,
   *         itemsCount: number
   *       }>,
   *       itemsPreview: Array<{
   *         itemId: number,
   *         itemCode: string,
   *         itemName: string,
   *         uom: string,
   *         groupA: { name: string, balance: number },
   *         groupB: { name: string, balance: number },
   *         diff: number,
   *         hasConflict: boolean
   *       }>
   *     }>
   *   },
   *   error?: string
   * }>}
   */
  getStoreSummary: async (params = {}) => {
    const response = await api.get(
      '/mobile/manager/store-dashboard/summary',
      { params }
    );
    return response.data;
  },
};

export default mobileStoreDashboardService;