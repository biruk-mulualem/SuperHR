// src/services/pushNotifications.js
//
// Push notification service — mobile app side.
//
// Responsibilities:
//   1. Ask the OS for permission to send notifications
//   2. Get the device's Expo push token (unique per install per app)
//   3. Configure how notifications behave while the app is OPEN
//   4. Expose helpers to subscribe to incoming events and tap events
//
// Nothing calls this file yet. It's inert until wired into login in Step 7c.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ------------------------------------------------------------------
// FOREGROUND BEHAVIOR
// ------------------------------------------------------------------
// Tell the OS what to do when a notification arrives WHILE the app
// is open. Without this, notifications are silently dropped by
// default on both iOS and Android.
//
// With this handler: shows the banner, plays sound, updates badge.
// ------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // newer SDK: banner on screen
    shouldShowList: true,     // newer SDK: list in notification center
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Older SDK alias (harmless on newer SDKs):
    shouldShowAlert: true,
  }),
});

// ------------------------------------------------------------------
// REGISTER FOR PUSH
// ------------------------------------------------------------------
/**
 * Ask the user for permission and get the Expo push token.
 *
 * Returns:
 *   { granted: boolean, token: string | null, error: string | null }
 *
 * Notes:
 *   - On a simulator/emulator: `granted` is false, `error` explains why.
 *     Push requires a physical device.
 *   - If permission denied: `granted` is false, `error` is set.
 *   - If successful: `token` is a string like "ExponentPushToken[xxx]".
 */
export async function registerForPushNotificationsAsync() {
  try {
    // 🔒 Push requires a physical device.
    // Emulators can't receive remote push notifications.
    if (!Device.isDevice) {
      return {
        granted: false,
        token: null,
        error: 'Push notifications require a physical device',
      };
    }

    // ── Android: set up the notification channel FIRST
    // If we don't, notifications on Android either don't appear or
    // appear silently (no sound, no vibration).
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      });
    }

    // ── Check current permission status
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // ── If not already granted, ask
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // ── If still not granted, bail
    if (finalStatus !== 'granted') {
      return {
        granted: false,
        token: null,
        error: 'Notification permission not granted',
      };
    }

    // ── Get the EAS project ID
    // Required for getExpoPushTokenAsync on SDK 50+.
    // It's defined in app.json under expo.extra.eas.projectId.
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    if (!projectId) {
      return {
        granted: false,
        token: null,
        error:
          'Missing EAS projectId. Add it to app.json under expo.extra.eas.projectId',
      };
    }

    // ── Get the Expo push token
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return {
      granted: true,
      token: tokenResponse.data, // "ExponentPushToken[xxxxx]"
      error: null,
    };
  } catch (err) {
    console.error('registerForPushNotificationsAsync error:', err);
    return {
      granted: false,
      token: null,
      error: err?.message || 'Unknown error during push registration',
    };
  }
}

// ------------------------------------------------------------------
// SUBSCRIBE: incoming notification (while app is open)
// ------------------------------------------------------------------
/**
 * Handler called when a notification arrives while the app is in
 * the foreground. Use this to update local UI (e.g., bump the badge).
 *
 * Returns an unsubscribe function — call it when the component
 * unmounts to prevent memory leaks.
 *
 * @param {(notification: object) => void} handler
 * @returns {() => void}
 */
export function onNotificationReceived(handler) {
  const sub = Notifications.addNotificationReceivedListener(handler);
  return () => sub.remove();
}

// ------------------------------------------------------------------
// SUBSCRIBE: user taps a notification
// ------------------------------------------------------------------
/**
 * Handler called when the user taps a notification (either from
 * the OS shade while app was backgrounded, or from the foreground).
 *
 * Use this to navigate to the right screen based on
 * response.notification.request.content.data.
 *
 * Returns an unsubscribe function.
 *
 * @param {(response: object) => void} handler
 * @returns {() => void}
 */
export function onNotificationResponse(handler) {
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}

// ------------------------------------------------------------------
// UTILITY: check current permission status (no prompt)
// ------------------------------------------------------------------
export async function getCurrentPermissionStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status; // 'granted' | 'denied' | 'undetermined'
  } catch (err) {
    console.error('getCurrentPermissionStatus error:', err);
    return 'undetermined';
  }
}