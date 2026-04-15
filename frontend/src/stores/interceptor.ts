// stores/interceptor.ts - SIMPLIFIED VERSION
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = 'http://localhost:3001/api';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log(`📤 ${config.method?.toUpperCase()} ${config.url} - Token attached`);
    } else {
      // console.warn(`📤 ${config.method?.toUpperCase()} ${config.url} - NO TOKEN`);
    }
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
    // console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    // Log the error
    console.error(`❌ Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    
    // For 401 on admin routes, don't logout immediately - just reject
    if (error.response?.status === 401) {
      console.warn('🔐 Authentication failed - check if token is valid');
      // Don't clear token here - let the component handle it
    }
    
    // For 403, just log and reject
    if (error.response?.status === 403) {
      console.warn('⛔ Forbidden - User lacks permission');
    }
    
    return Promise.reject(error);
  }
);

export default api;