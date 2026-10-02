// super-app/src/stores/mobileStoreDashboardService.js
import api from './interceptor';

/**
 * Mobile Store Dashboard Service
 * ------------------------------
 * GET /mobile/manager/store-dashboard/summary
 *
 * Envelope:
 *   { success: true,  data: {...} }
 *   { success: false, error: 'message' }
 */
export const mobileStoreDashboardService = {
  /**
   * Store dashboard summary.
   *
   * @param {Object}  [params]
   * @param {number}  [params.storeLimit=5]
   * @param {number}  [params.itemsPerStore=20]
   *
   * @returns {Promise<{
   *   success: boolean,
   *   data?: {
   *     totalStores: number,
   *     activeStores: number,
   *
   *     totalItems: number,
   *     activeItems: number,
   *     inactiveItems: number,
   *
   *     // ✅ Inventory card — Total / Alert set / Triggered
   *     inventoryTotalItems: number,
   *     inventoryAlertSet: number,
   *     inventoryTriggered: number,
   *
   *     // Legacy stock status fields
   *     totalStatus: number,
   *     triggeredStatus: number,
   *     pendingStatus: number,
   *
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