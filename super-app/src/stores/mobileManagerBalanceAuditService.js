// super-app/src/stores/mobileManagerBalanceAuditService.js
import api from './interceptor';

/**
 * Mobile Manager — Balance Audit Service
 * --------------------------------------
 * Wraps the three backend endpoints:
 *   GET /mobile/manager/balance-audit/stores
 *   GET /mobile/manager/balance-audit/stores/:storeId/items
 *   GET /mobile/manager/balance-audit/summary
 *
 * Every method returns the raw `response.data` from the API, matching the
 * envelope used across other mobile services:
 *   { success: true,  data: {...} }
 *   { success: false, error: 'message' }
 *
 * Errors bubble up to the caller — wrap in try/catch if you need custom UX.
 */

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const buildStoreListParams = ({ page = 1, limit = 10, q = '', audit = 'all' } = {}) => {
  const params = { page, limit };

  const trimmedQ = typeof q === 'string' ? q.trim() : '';
  if (trimmedQ) params.q = trimmedQ;

  if (audit && audit !== 'all') params.audit = audit;

  return params;
};

const buildStoreItemsParams = ({ page = 1, limit = 10, q = '', filter = 'all' } = {}) => {
  const params = { page, limit };

  const trimmedQ = typeof q === 'string' ? q.trim() : '';
  if (trimmedQ) params.q = trimmedQ;

  if (filter && filter !== 'all') params.filter = filter;

  return params;
};

// ----------------------------------------------------------------
// Service
// ----------------------------------------------------------------
export const mobileManagerBalanceAuditService = {
  /**
   * List stores with per-store conflict counts (paginated).
   *
   * GET /mobile/manager/balance-audit/stores
   *
   * @param {Object}  [params]
   * @param {number}  [params.page=1]
   * @param {number}  [params.limit=10]
   * @param {string}  [params.q]                     Search by store name / location
   * @param {string}  [params.audit='all']           'all' | 'matched' | 'conflicted'
   *
   * @returns {Promise<{
   *   success: boolean,
   *   data?: {
   *     stores: Array<{
   *       id: number,
   *       name: string,
   *       location: string|null,
   *       status: string,
   *       totalItems: number,
   *       conflictedItems: number,
   *       matchedItems: number
   *     }>,
   *     pagination: {
   *       page: number,
   *       limit: number,
   *       total: number,
   *       totalPages: number,
   *       hasMore: boolean
   *     }
   *   },
   *   error?: string
   * }>}
   */
  getStores: async (params = {}) => {
    const response = await api.get('/mobile/manager/balance-audit/stores', {
      params: buildStoreListParams(params),
    });
    return response.data;
  },

  /**
   * List items for a single store with their group balances (paginated).
   *
   * GET /mobile/manager/balance-audit/stores/:storeId/items
   *
   * @param {number|string} storeId
   * @param {Object}  [params]
   * @param {number}  [params.page=1]
   * @param {number}  [params.limit=10]
   * @param {string}  [params.q]                     Search by item name / item code
   * @param {string}  [params.filter='all']          'all' | 'matched' | 'conflicted'
   *
   * @returns {Promise<{
   *   success: boolean,
   *   data?: {
   *     items: Array<{
   *       itemId: number,
   *       itemName: string,
   *       itemCode: string,
   *       uom: string,
   *       groupA: { name: string, balance: number },
   *       groupB: { name: string, balance: number },
   *       diff: number,
   *       hasConflict: boolean
   *     }>,
   *     pagination: {
   *       page: number,
   *       limit: number,
   *       total: number,
   *       totalPages: number,
   *       hasMore: boolean
   *     }
   *   },
   *   error?: string
   * }>}
   */
  getStoreItems: async (storeId, params = {}) => {
    if (storeId == null) {
      return { success: false, error: 'storeId is required' };
    }

    const response = await api.get(
      `/mobile/manager/balance-audit/stores/${storeId}/items`,
      { params: buildStoreItemsParams(params) }
    );
    return response.data;
  },

  /**
   * Global audit summary — used for the header strip.
   * Independent of pagination and filters.
   *
   * GET /mobile/manager/balance-audit/summary
   *
   * @returns {Promise<{
   *   success: boolean,
   *   data?: {
   *     storesUnderAudit: number,
   *     itemsAudited: number,
   *     matched: number,
   *     conflicted: number,
   *     storesWithConflicts: number
   *   },
   *   error?: string
   * }>}
   */
  getSummary: async () => {
    const response = await api.get('/mobile/manager/balance-audit/summary');
    return response.data;
  },
};

export default mobileManagerBalanceAuditService;