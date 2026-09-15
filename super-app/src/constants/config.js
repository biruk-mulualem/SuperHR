// src/constants/config.js
const FALLBACK = 'http://localhost:3001/api';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || FALLBACK;

console.log('🌐 API_BASE =', API_BASE);