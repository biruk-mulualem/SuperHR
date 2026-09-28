// mobile/src/stores/deviceService.js
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import api from './interceptor';

const STORAGE_KEY = 'superapp.deviceId';

// ============================================================================
// LOCAL — device fingerprinting (runs on the phone)
// ============================================================================

/**
 * Stable, per-install device ID.
 * - Survives app restarts (stored in SecureStore).
 * - Regenerated on reinstall (SecureStore is wiped with the app).
 */
export async function getOrCreateDeviceId() {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY);
    if (existing) return existing;

    const fresh = Crypto.randomUUID();
    await SecureStore.setItemAsync(STORAGE_KEY, fresh);
    return fresh;
  } catch (e) {
    console.warn('SecureStore unavailable, using fallback:', e);
    return Crypto.randomUUID();
  }
}

/**
 * Fingerprint the install.
 * Changes when the user reinstalls → backend sees a new device.
 */
async function getInstallFingerprint() {
  try {
    if (Platform.OS === 'android') {
      return Application.androidId || 'unknown-android-id';
    }
    if (Platform.OS === 'ios') {
      return (await Application.getIosIdForVendorAsync()) || 'unknown-ios-id';
    }
    return 'web';
  } catch {
    return 'unknown';
  }
}

/**
 * Full device profile to send with login.
 */
export async function getDeviceInfo() {
  const deviceId = await getOrCreateDeviceId();
  const fingerprint = await getInstallFingerprint();

  return {
    deviceId,
    fingerprint,
    platform: Platform.OS,
    brand: Device.brand || null,
    model: Device.modelName || null,
    osVersion: Device.osVersion || null,
    deviceName: Device.deviceName || null,
    isEmulator: !Device.isDevice,
    appVersion: Application.nativeApplicationVersion || null,
    buildNumber: Application.nativeBuildVersion || null,
  };
}

// ============================================================================
// REMOTE — admin device management (calls /api/admin/devices/*)
// ============================================================================

const BASE = '/admin/devices';

/**
 * List registered devices with optional filters.
 *
 * @param {object} params
 * @param {string} [params.status]   'pending' | 'approved' | 'blocked'
 * @param {number} [params.userId]   filter by owner
 * @param {string} [params.search]   partial match on username / full name / email
 * @param {number} [params.page]     default 1
 * @param {number} [params.limit]    default 25
 * @returns {Promise<{success, data?, pagination?, error?}>}
 */
export async function listDevices(params = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.status) qs.append('status', params.status);
    if (params.userId) qs.append('userId', String(params.userId));
    if (params.search) qs.append('search', params.search);
    if (params.page) qs.append('page', String(params.page));
    if (params.limit) qs.append('limit', String(params.limit));

    const url = qs.toString() ? `${BASE}?${qs.toString()}` : BASE;
    const res = await api.get(url);

    return {
      success: true,
      data: res.data?.data || [],
      pagination: res.data?.pagination || {
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error('listDevices error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load devices',
      data: [],
    };
  }
}

/**
 * Counts of devices by status (for dashboard tiles).
 */
export async function getDeviceStats() {
  try {
    const res = await api.get(`${BASE}/stats`);
    return {
      success: true,
      data: res.data?.data || { total: 0, pending: 0, approved: 0, blocked: 0 },
    };
  } catch (error) {
    console.error('getDeviceStats error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load stats',
      data: { total: 0, pending: 0, approved: 0, blocked: 0 },
    };
  }
}

/**
 * Get one device by its DB row id.
 */
export async function getDeviceById(id) {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return { success: true, device: res.data?.data };
  } catch (error) {
    console.error('getDeviceById error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load device',
    };
  }
}

/**
 * Get all devices for a specific user.
 */
export async function listDevicesForUser(userId) {
  try {
    const res = await api.get(`/admin/users/${userId}/devices`);
    return { success: true, data: res.data?.data || [] };
  } catch (error) {
    console.error('listDevicesForUser error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load user devices',
      data: [],
    };
  }
}

/**
 * Approve a pending device. After this, the user can log in from that device.
 */
export async function approveDevice(id) {
  try {
    const res = await api.post(`${BASE}/${id}/approve`);
    return {
      success: true,
      message: res.data?.message || 'Device approved',
      device: res.data?.data,
    };
  } catch (error) {
    console.error('approveDevice error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to approve device',
    };
  }
}

/**
 * Block a device. Optional reason shows up in the mobile login screen.
 */
export async function blockDevice(id, reason) {
  try {
    const res = await api.post(`${BASE}/${id}/block`, { reason });
    return {
      success: true,
      message: res.data?.message || 'Device blocked',
      device: res.data?.data,
    };
  } catch (error) {
    console.error('blockDevice error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to block device',
    };
  }
}

/**
 * Move a blocked device back to approved.
 */
export async function unblockDevice(id) {
  try {
    const res = await api.post(`${BASE}/${id}/unblock`);
    return {
      success: true,
      message: res.data?.message || 'Device unblocked',
      device: res.data?.data,
    };
  } catch (error) {
    console.error('unblockDevice error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to unblock device',
    };
  }
}

/**
 * Delete a device row entirely.
 * The user will need to re-register (login → new device → re-approval).
 */
export async function deleteDevice(id) {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    return {
      success: true,
      message: res.data?.message || 'Device deleted',
    };
  } catch (error) {
    console.error('deleteDevice error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete device',
    };
  }
}

// ============================================================================
// OPTIONAL — the current device (self)
// ============================================================================

/**
 * Get the current device's full record from the server.
 * Useful if you want to display "this device: approved/blocked" in the UI.
 *
 * Relies on the /admin/devices endpoint filtered by the caller's userId.
 * Only works for admins; for regular users, use local getDeviceInfo() instead.
 */
export async function getMyDeviceRecord(currentUserId) {
  if (!currentUserId) {
    return { success: false, error: 'Missing currentUserId' };
  }
  try {
    const local = await getOrCreateDeviceId();
    const res = await api.get(`${BASE}`, {
      params: { userId: currentUserId },
    });
    const items = res.data?.data || [];
    const mine = items.find((d) => d.deviceId === local) || null;
    return { success: true, device: mine };
  } catch (error) {
    console.error('getMyDeviceRecord error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load this device',
    };
  }
}