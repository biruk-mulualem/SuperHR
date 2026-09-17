// src/constants/config.js
import { Platform } from 'react-native';

// Android emulator can't reach "localhost" — 10.0.2.2 maps to the host.
// iOS simulator & web use localhost.
// Physical device via Expo Go → set EXPO_PUBLIC_DEV_API_URL to your LAN IP.
const LOCAL_DEFAULT =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3001/api'
    : 'http://localhost:3001/api';

export const API_BASE =
  process.env.EXPO_PUBLIC_DEV_API_URL || LOCAL_DEFAULT;

console.log('🌐 API_BASE =', API_BASE);