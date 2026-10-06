// super-app/src/stores/mobileStoreListService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './interceptor';

export const mobileStoreListService = {
  // ================================================================
  // STORE LIST
  // ================================================================
  getStoreSummary: async (params = {}) => {
    const response = await api.get('/mobile/store-list/summary', { params });
    return response.data;
  },

  // ================================================================
  // STORE DETAIL — COMPARISON
  // ================================================================
  getStoreComparison: async (storeId, params = {}) => {
    const response = await api.get(
      `/mobile/store-list/${storeId}/detail`,
      { params }
    );
    return response.data;
  },

  // ================================================================
  // STORE LIST — JSON EXPORT
  // ================================================================
  getStoreListExport: async (params = {}) => {
    const response = await api.get('/mobile/store-list/export', { params });
    return response.data;
  },

  // ================================================================
  // STORE LIST — XLSX (server-rendered binary)
  // ================================================================

  /**
   * URL of the server-rendered .xlsx. Use with File.downloadFileAsync,
   * NOT with axios (binary stream).
   */
  getStoreListXlsxUrl: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.append(k, String(v));
      }
    });
    const base = (api.defaults?.baseURL || '').replace(/\/$/, '');
    return `${base}/mobile/store-list/export.xlsx?${qs.toString()}`;
  },

  /**
   * Headers to attach to a File.downloadFileAsync call.
   * Reads the same AsyncStorage 'token' the axios interceptor uses,
   * and prepends 'Bearer ' the same way.
   *
   * Returns {} if no token is found.
   */
  getAuthHeaders: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return {};
      return { Authorization: `Bearer ${token}` };
    } catch (e) {
      console.warn('[mobileStoreListService] failed to read token:', e);
      return {};
    }
  },
};

export default mobileStoreListService;