// src/stores/interceptor.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/config';

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 190000,
  headers: { 'Content-Type': 'application/json' },
});

// ==================== REQUEST ====================
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error('Token read failed:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE ====================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url || '';

    // --------------------------------------------------------------
    // SILENT endpoints — the calling screen handles its own UX.
    // Nothing is logged here; the UI decides what to show.
    // --------------------------------------------------------------
    const SILENT = [
      '/users/login',               // invalid credentials
      '/users/login-with-store',    // invalid credentials + store
      '/users/stores-by-username',  // live username lookup during typing
    ];
    const isSilent = SILENT.some((u) => url.includes(u));

    // ---------- 401: session expired (NOT a login attempt) ----------
    if (status === 401) {
      if (isSilent) {
        // Bad login attempt — UI shows "Invalid username or password"
        return Promise.reject(error);
      }
      console.warn(`🔐 Auth expired on ${method} ${url}`);
      try {
        await AsyncStorage.multiRemove(['token', 'user']);
      } catch {}
      if (typeof onUnauthorized === 'function') onUnauthorized();
      return Promise.reject(error);
    }

    // ---------- 403 ----------
    if (status === 403) {
      if (isSilent) return Promise.reject(error);

      // ✅ NEW: device has been blocked by an admin
      const code = error.response?.data?.code;
      if (code === 'DEVICE_BLOCKED') {
        console.warn(`🚫 Device blocked — forcing logout`);
        try {
          // Lazy require avoids a circular dependency with auth.js
          const authService = require('./auth').default;
          await authService.clearAuthData();
        } catch (e) {
          console.warn('Failed to clear auth on DEVICE_BLOCKED:', e);
          // Fall back to the generic unauthorized handler
          try {
            await AsyncStorage.multiRemove(['token', 'user']);
          } catch {}
          if (typeof onUnauthorized === 'function') onUnauthorized();
        }
        return Promise.reject(error);
      }

      console.warn(`⛔ Forbidden: ${method} ${url}`);
      return Promise.reject(error);
    }

    // ---------- 404 on lookup endpoints ----------
    if (status === 404 && isSilent) {
      return Promise.reject(error);
    }

    // ---------- Everything else: real error ----------
    if (!isSilent) {
      console.error(`❌ ${status} ${method} ${url}`);
    }
    return Promise.reject(error);
  }
);

export default api;