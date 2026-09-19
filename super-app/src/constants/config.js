// src/constants/config.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ---------- 1. Production URL (leave as is) ----------
const PROD_URL = 'https://your-production-api.com/api';

// ---------- 2. Localhost fallbacks ----------
const LOCAL_DEFAULT =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3001/api'      // Android EMULATOR only
    : 'http://localhost:3001/api';     // iOS sim / web

// ---------- 3. Auto-detect LAN IP from Expo host ----------
const getDevUrl = () => {
  // a) Explicit env var wins (your current setup)
  if (process.env.EXPO_PUBLIC_DEV_API_URL) {
    return process.env.EXPO_PUBLIC_DEV_API_URL;
  }

  // b) Auto: use the same IP that Metro/Expo is being served from
  //    e.g. hostUri = "192.168.137.1:8081" → host = "192.168.137.1"
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = String(hostUri).split(':')[0];
    if (host && host !== 'localhost') {
      return `http://${host}:3001/api`;
    }
  }

  // c) Fallback
  return LOCAL_DEFAULT;
};

export const API_BASE = __DEV__ ? getDevUrl() : PROD_URL;

console.log('🌐 API_BASE =', API_BASE);