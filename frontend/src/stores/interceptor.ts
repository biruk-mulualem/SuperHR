// stores/interceptor.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 190000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ==================== HELPERS ====================
const getOrCreateDeviceId = (): string => {
  const KEY = 'sa_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
};

const forceLogout = (reason: string) => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('user');

  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?reason=${encodeURIComponent(reason)}`;
  }
};

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Identify this client as a web browser so the backend enables
    //    WebSession tracking (registration, session enforcement, terminate).
    config.headers['x-client-type'] = 'web';

    // ✅ Stable browser id — one per browser, persists across reloads.
    //    Lets the admin UI group sessions from the same browser together.
    config.headers['x-device-id'] = getOrCreateDeviceId();

    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const code = (error.response?.data as any)?.code;

    console.error(`❌ Error: ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);

    // ✅ Session terminated / missing / expired → force logout immediately
    if (
      code === 'SESSION_TERMINATED' ||
      code === 'SESSION_NOT_FOUND' ||
      code === 'SESSION_EXPIRED'
    ) {
      console.warn(`🚪 Session invalidated (${code}) — redirecting to login`);
      forceLogout(code.toLowerCase());
      return Promise.reject(error);
    }

    // For 401 on other routes, don't logout immediately - let the component handle it
    if (status === 401) {
      console.warn('🔐 Authentication failed - check if token is valid');
    }

    // For 403, just log and reject
    if (status === 403) {
      console.warn('⛔ Forbidden - User lacks permission');
    }

    return Promise.reject(error);
  }
);

export default api;