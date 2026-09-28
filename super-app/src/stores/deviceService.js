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

// ============================================================================
// ✅ NEW — WEB SESSIONS (calls /api/admin/web-sessions/*)
// ----------------------------------------------------------------------------
// Mirrors the admin UI you built on the web frontend. Same endpoints, same
// response shape, so the UI can be a direct port.
// ============================================================================

const WEB_BASE = '/admin/web-sessions';

/**
 * List all web sessions with filters, sorting, and pagination.
 *
 * @param {object} params
 * @param {string} [params.status]           'active' | 'terminated' | 'expired' | 'all'
 * @param {number} [params.userId]           filter by user
 * @param {string} [params.search]           partial match on username / full name / email
 * @param {string} [params.browser]          exact browser string, e.g. 'Chrome 122'
 * @param {string} [params.os]               exact OS string, e.g. 'Windows 10/11'
 * @param {string} [params.lastSeenWithin]   '5m' | '1h' | '24h' | '7d'
 * @param {number} [params.page]             default 1
 * @param {number} [params.limit]            default 25 (max 100)
 * @param {string} [params.sortBy]           'lastSeenAt' | 'loggedInAt' | 'user' | 'browser' | 'os' | 'status'
 * @param {string} [params.sortOrder]        'ASC' | 'DESC'
 * @returns {Promise<{success, data?, pagination?, error?}>}
 */
export async function listWebSessions(params = {}) {
  try {
    const qs = new URLSearchParams();
    if (params.status && params.status !== 'all') qs.append('status', params.status);
    if (params.userId) qs.append('userId', String(params.userId));
    if (params.search) qs.append('search', params.search);
    if (params.browser && params.browser !== 'all') qs.append('browser', params.browser);
    if (params.os && params.os !== 'all') qs.append('os', params.os);
    if (params.lastSeenWithin && params.lastSeenWithin !== 'all') {
      qs.append('lastSeenWithin', params.lastSeenWithin);
    }
    if (params.page) qs.append('page', String(params.page));
    if (params.limit) qs.append('limit', String(params.limit));
    if (params.sortBy) qs.append('sortBy', params.sortBy);
    if (params.sortOrder) qs.append('sortOrder', params.sortOrder);

    const url = qs.toString() ? `${WEB_BASE}?${qs.toString()}` : WEB_BASE;
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
    console.error('listWebSessions error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to load web sessions',
      data: [],
    };
  }
}

/**
 * Counts of web sessions by status (for dashboard tiles).
 * Returns: { total, active, activeNow, activeToday, terminated }
 */
export async function getWebSessionStats() {
  try {
    const res = await api.get(`${WEB_BASE}/stats`);
    return {
      success: true,
      data: res.data?.data || {
        total: 0,
        active: 0,
        activeNow: 0,
        activeToday: 0,
        terminated: 0,
      },
    };
  } catch (error) {
    console.error('getWebSessionStats error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load stats',
      data: { total: 0, active: 0, activeNow: 0, activeToday: 0, terminated: 0 },
    };
  }
}

/**
 * Get one web session by its DB row id.
 */
export async function getWebSessionById(id) {
  try {
    const res = await api.get(`${WEB_BASE}/${id}`);
    return { success: true, session: res.data?.data };
  } catch (error) {
    console.error('getWebSessionById error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load session',
    };
  }
}

/**
 * Terminate a single web session.
 * The browser will be signed out on its next request.
 *
 * @param {number|string} id      session row id
 * @param {string}        [reason] optional reason shown in the audit trail
 */
export async function terminateWebSession(id, reason) {
  try {
    const res = await api.post(`${WEB_BASE}/${id}/terminate`, { reason });
    return {
      success: true,
      message: res.data?.message || 'Session terminated',
      session: res.data?.data,
    };
  } catch (error) {
    console.error('terminateWebSession error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to terminate session',
    };
  }
}

/**
 * Allow a terminated session back.
 * The user's existing JWT works again — no re-login needed.
 */
export async function allowWebSession(id) {
  try {
    const res = await api.post(`${WEB_BASE}/${id}/allow`);
    return {
      success: true,
      message: res.data?.message || 'Session allowed again',
      session: res.data?.data,
    };
  } catch (error) {
    console.error('allowWebSession error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to allow session',
    };
  }
}

/**
 * Terminate every active session belonging to a user.
 * Admin-only. Users can still log in again afterwards.
 *
 * @param {number|string} userId
 * @param {string}        [reason]
 */
export async function terminateAllWebSessionsForUser(userId, reason) {
  try {
    const res = await api.post(`/admin/users/${userId}/terminate-all-sessions`, {
      reason,
    });
    return {
      success: true,
      message: res.data?.message || 'All sessions terminated',
      count: res.data?.data?.count ?? 0,
    };
  } catch (error) {
    console.error('terminateAllWebSessionsForUser error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to terminate sessions',
    };
  }
}

/**
 * Delete a web session row from the audit trail.
 * Does NOT sign the browser out — use terminate for that.
 */
export async function deleteWebSession(id) {
  try {
    const res = await api.delete(`${WEB_BASE}/${id}`);
    return {
      success: true,
      message: res.data?.message || 'Session deleted',
    };
  } catch (error) {
    console.error('deleteWebSession error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to delete session',
    };
  }
}

/**
 * Deactivate a user account (blocks login everywhere).
 * On the backend this is a two-call flow:
 *   1. PUT  /users/:id/deactivate
 *   2. POST /admin/users/:userId/terminate-all-sessions
 *
 * Both run inside this helper so a single tap does everything.
 */
export async function deactivateUserAndSessions(userId, reason) {
  try {
    // 1. Deactivate the account
    await api.put(`/users/${userId}/deactivate`);

    // 2. Kill every active web session
    await api.post(`/admin/users/${userId}/terminate-all-sessions`, {
      reason: reason || 'Account deactivated by admin',
    });

    return {
      success: true,
      message: 'User deactivated and sessions terminated',
    };
  } catch (error) {
    console.error('deactivateUserAndSessions error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to deactivate user',
    };
  }
}

// ============================================================================
// ✅ NEW — USER-FACING "MY SESSIONS" (calls /api/web/sessions/*)
// ----------------------------------------------------------------------------
// For regular users to see and sign out their own browsers. No admin role
// needed — the backend scopes the query to req.user.userId.
// ============================================================================

const MY_WEB_BASE = '/web/sessions';

/**
 * List the current user's own web sessions.
 * Returns { success, data, current } where `current` is the sessionId of the
 * session making this request (so the UI can mark "This browser").
 */
export async function listMyWebSessions() {
  try {
    const res = await api.get(MY_WEB_BASE);
    return {
      success: true,
      data: res.data?.data || [],
      current: res.data?.current || null,
    };
  } catch (error) {
    console.error('listMyWebSessions error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to load your sessions',
      data: [],
      current: null,
    };
  }
}

/**
 * Sign out one of the current user's own sessions.
 * Safe for anyone to call — the backend refuses if the id isn't theirs.
 */
export async function revokeMyWebSession(id) {
  try {
    const res = await api.post(`${MY_WEB_BASE}/${id}/revoke`);
    return {
      success: true,
      message: res.data?.message || 'Signed out',
    };
  } catch (error) {
    console.error('revokeMyWebSession error:', error);
    return {
      success: false,
      error: error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || 'Failed to sign out session',
    };
  }
}