// src/stores/pushService.js
//
// ⚠️ FCM / Notifee are DISABLED.
// The currently installed dev client APK does not contain the native
// Firebase / Notifee modules, so importing them crashes the app with:
//   "Native module NativeRNFBTurboApp is not registered"
//
// This file exposes the same exports as the real implementation so
// nothing else in the app breaks. All functions are safe no-ops.
//
// ────────────────────────────────────────────────────────────────
// TO RE-ENABLE REAL FCM LATER:
//   1. Add  "newArchEnabled": false  to app.json (optional — skips the ~5GB NDK)
//   2. npx expo prebuild --clean
//   3. Recreate android/local.properties:
//        $sdk = ($env:LOCALAPPDATA + "\Android\Sdk").Replace('\','/')
//        Set-Content -Path "android\local.properties" -Value "sdk.dir=$sdk" -NoNewline
//   4. npx expo run:android       ← rebuilds dev client WITH Firebase native modules
//   5. Restore the real implementation (see pushService.fcm.js.bak)
// ────────────────────────────────────────────────────────────────

// ---- REAL IMPORTS (kept for reference, do NOT uncomment until step 5) ----
// import messaging from '@react-native-firebase/messaging';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { Platform, PermissionsAndroid } from 'react-native';
// import Constants from 'expo-constants';
// import api from './interceptor';

// ================================================================
// STUBS — safe no-ops, same signatures as the real implementation
// ================================================================

export async function registerForPushNotifications() {
  return null;
}

export async function syncPushTokenWithBackend() {
  return { success: false, error: 'Push disabled' };
}

export async function setupPush() {
  if (__DEV__) {
    console.log('ℹ️ Push disabled: native FCM modules not in current dev client');
  }
  return null;
}

export async function unregisterPush() {
  return;
}

export function addForegroundMessageListener() {
  return { remove: () => {} };
}

export function addNotificationTapListener() {
  return { remove: () => {} };
}

export async function getInitialNotificationData() {
  return null;
}