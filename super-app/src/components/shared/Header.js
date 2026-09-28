// components/Header.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Switch,
  Image,
  TouchableWithoutFeedback,
  AppState,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import authService from '../../stores/authService';
import mobileNotificationService from '../../stores/mobileNotificationService';

// ================================================================
// DEMO USER DATA (fallback when authService has no user)
// ================================================================
const DEMO_USER = {
  fullName: 'John Anderson',
  firstName: 'John',
  lastName: 'Anderson',
  username: 'janderson',
  email: 'john.anderson@superapp.com',
  role: 'admin',
  profilePicture: null, // set to a URL string to test the image avatar
};

// ================================================================
// ROLE COLOR MAP (for the pill color)
// ================================================================
const ROLE_COLORS = {
  admin:      '#8B5CF6',
  administrator: '#8B5CF6',
  superadmin: '#8B5CF6',
  sales:      '#10B981',
  purchaser:  '#F59E0B',
  manager:    '#3B82F6',
  auditor:    '#EF4444',
  banker:     '#06B6D4',
  supervisor: '#0EA5E9',
  employee:   '#64748B',
  storekeeper: '#0EA5E9',
  store_it:   '#14B8A6',
  checker:    '#F97316',
  finance:    '#22C55E',
};

// Nicely format a role string for display ("store_it" → "Store It")
const prettyRole = (raw) => {
  if (!raw) return 'User';
  return String(raw)
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Build initials from a name ("John Doe" → "JD")
const initialsFromName = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ================================================================
// PAGE LIBRARY
// ================================================================
const PAGE_LIBRARY = {
  totalRequests:     { label: 'Total Requests',     emoji: '📋', page: 'totalRequests' },
  pendingApproval:   { label: 'Pending Approval',   emoji: '⏳', page: 'pendingApproval' },
  approvedNotPaid:   { label: 'Approved Not Paid',  emoji: '✅', page: 'approvedNotPaid' },

  // Purchaser-specific pages
  pendingSubmission: { label: 'Pending Submission', emoji: '📥', page: 'pendingSubmission' },
  submitted:         { label: 'Submitted',          emoji: '📤', page: 'submitted' },
};

const ROLE_PAGES = {
  admin:      ['totalRequests', 'pendingApproval', 'approvedNotPaid'],
  manager:    ['totalRequests', 'pendingApproval', 'approvedNotPaid'],
  supervisor: ['totalRequests', 'pendingApproval', 'approvedNotPaid'],
  purchaser:  ['pendingSubmission', 'submitted'],
  sales:      [],
  banker:     [],
  auditor:    [],
};

// Polling interval for the bell badge
const UNREAD_POLL_MS = 30000;

// ================================================================
// COMPONENT
// ================================================================
export default function Header({
  onLogout,
  onNavigateToProfile,
  onNavigateToSettings,
  onNavigateToNotifications,
  darkMode,
  setDarkMode,
  permissions = { alerts: true },
  userRole,
  onNavigateToPurchase,
  notificationCount = 0,
}) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notificationCount);

  // Refs for lifecycle cleanup
  const pollRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Force re-render when auth changes (login / logout / profile update)
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = authService.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  // ============================================================
  // REAL USER DATA — pulled from authService
  // (falls back to DEMO_USER when authService has no user)
  // ============================================================
  const user = authService.user || DEMO_USER;
  const userId = user?.userId || user?.id || null;

  const userName = useMemo(() => {
    if (!user) return 'User';
    return (
      user.fullName ||
      user.full_name ||
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
      user.username ||
      user.email ||
      'User'
    );
  }, [user]);

  const userInitials = useMemo(() => initialsFromName(userName), [userName]);

  const userRoleRaw = (user?.role || userRole || 'employee').toString().toLowerCase();
  const userRoleLabel = prettyRole(userRoleRaw);
  const roleColor = ROLE_COLORS[userRoleRaw] || '#64748B';

  const userAvatarUrl =
    user?.profilePicture ||
    user?.profilePictureUrl ||
    user?.avatar ||
    null;

  // ============================================================
  // LIVE UNREAD COUNT — from mobileNotificationService
  //   • fires on mount (only if logged in)
  //   • re-fires when userId changes (login / switch user)
  //   • re-fires when the app comes back to the foreground
  //   • polls every 30s while the app is active
  // ============================================================
  const fetchUnreadCount = useCallback(async () => {
    // Skip the call when there's no logged-in user (avoids pre-login 401/500 spam)
    if (!userId) return;

    try {
      // No scope → counts across local + foreign + posts
      const res = await mobileNotificationService.unreadCount();
      if (res?.success) {
        setUnreadCount(Number(res?.data?.count ?? 0));
      }
    } catch (err) {
      // Silent — Header polls; don't spam the console
      // console.warn('unread-count failed:', err?.message);
    }
  }, [userId]);

  // Initial fetch + interval poll (scoped to userId)
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return undefined;
    }

    fetchUnreadCount();

    pollRef.current = setInterval(fetchUnreadCount, UNREAD_POLL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [userId, fetchUnreadCount]);

  // App foreground listener — refresh immediately when the user returns
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (prev.match(/inactive|background/) && next === 'active') {
        fetchUnreadCount();
      }
    });
    return () => sub?.remove?.();
  }, [fetchUnreadCount]);

  // Keep in sync with prop (e.g. parent pushes an explicit count)
  useEffect(() => {
    if (Number.isFinite(notificationCount) && notificationCount !== unreadCount) {
      // Only override if the parent actually passes a value > 0
      // or explicitly resets to 0
      if (notificationCount > 0 || unreadCount === 0) {
        setUnreadCount(notificationCount);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationCount]);

  // ============================================================
  // THEME COLORS
  // ============================================================
  const headerBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderBottomColor = darkMode ? '#334155' : '#E2E8F0';
  const titleColor = darkMode ? '#FFFFFF' : '#1E3A8A';
  const notifBtnBg = darkMode ? '#334155' : '#F1F5F9';

  const modalBgColor = darkMode ? '#1E293B' : '#FFFFFF';
  const modalTextColor = darkMode ? '#F1F5F9' : '#1E293B';
  const modalSubTextColor = darkMode ? '#94A3B8' : '#64748B';
  const modalBorderColor = darkMode ? '#334155' : '#F1F5F9';

  // ============================================================
  // ROLE PAGES
  // ============================================================
  const pageKeys = ROLE_PAGES[userRoleRaw] || [];
  const purchaseNavItems = pageKeys.map((k) => PAGE_LIBRARY[k]).filter(Boolean);
  const canSeePurchase = purchaseNavItems.length > 0;

  // ============================================================
  // BELL VISIBILITY
  //   Opt-OUT: hidden only when a parent explicitly passes
  //   permissions={{ alerts: false }}. Shows for everyone else,
  //   including roles that don't send a permissions prop at all.
  // ============================================================
  const showBell = permissions?.alerts !== false;

  // ============================================================
  // AVATAR RENDERING HELPER
  // ============================================================
  const renderAvatar = (size, fontSize) => {
    if (userAvatarUrl) {
      return (
        <Image
          source={{ uri: userAvatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E2E8F0' }}
        />
      );
    }
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: roleColor + '25',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: roleColor,
            fontWeight: '800',
            fontSize,
            letterSpacing: 0.5,
          }}
        >
          {userInitials}
        </Text>
      </View>
    );
  };

  // Bell press → refresh count + navigate
  const handleBellPress = () => {
    fetchUnreadCount();
    if (onNavigateToNotifications) onNavigateToNotifications();
  };

  return (
    <View
      style={[
        styles.headerWrapper,
        {
          backgroundColor: headerBg,
          borderBottomColor,
          paddingTop: insets.top,   // ← safe-area fix
        },
      ]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.brandGroup}>
          <Text style={[styles.companyName, { color: titleColor }]}>
            SUPER APP
          </Text>
        </View>

        <View style={styles.actionGroup}>
          {/* Bell — shows unless explicitly disabled */}
          {showBell && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: notifBtnBg }]}
              onPress={handleBellPress}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiIcon}>🔔</Text>

              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Avatar — real user */}
          <TouchableOpacity
            style={[styles.avatarButton, { borderColor: roleColor }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            {renderAvatar(40, 14)}
          </TouchableOpacity>
        </View>
      </View>

      {/* ===================== NAVIGATION MENU ===================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  {
                    backgroundColor: modalBgColor,
                    paddingBottom: 34 + insets.bottom,   // ← respects home indicator
                  },
                ]}
              >
                <View
                  style={[
                    styles.modalAccentBar,
                    { backgroundColor: darkMode ? '#334155' : '#E2E8F0' },
                  ]}
                />

                {/* USER HEADER CARD — real user data */}
                <View
                  style={[
                    styles.userHeaderCard,
                    {
                      backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                      borderColor: modalBorderColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.userHeaderAvatar,
                      { borderColor: roleColor },
                    ]}
                  >
                    {renderAvatar(52, 18)}
                  </View>

                  <View style={styles.userHeaderText}>
                    <Text
                      style={[styles.userHeaderName, { color: modalTextColor }]}
                      numberOfLines={1}
                    >
                      {userName}
                    </Text>

                    <View
                      style={[
                        styles.userHeaderRolePill,
                        { backgroundColor: roleColor + '20' },
                      ]}
                    >
                      <View
                        style={[
                          styles.userHeaderRoleDot,
                          { backgroundColor: roleColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.userHeaderRoleText,
                          { color: roleColor },
                        ]}
                      >
                        {userRoleLabel}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.panelTitle, { color: modalTextColor }]}>
                  Navigation Menu
                </Text>

                {/* Dark mode toggle */}
                {setDarkMode && (
                  <View
                    style={[
                      styles.toggleMenuRow,
                      { borderColor: modalBorderColor },
                    ]}
                  >
                    <Text style={[styles.toggleLabel, { color: modalTextColor }]}>
                      🌙 Night Vision Mode
                    </Text>
                    <Switch
                      trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                      thumbColor={darkMode ? '#F8FAFC' : '#F1F5F9'}
                      onValueChange={(value) => setDarkMode(value)}
                      value={darkMode}
                    />
                  </View>
                )}

                <View style={styles.linksContainer}>
                  {/* Profile Dashboard */}
                  <TouchableOpacity
                    style={[
                      styles.menuLinkRow,
                      { borderBottomColor: modalBorderColor },
                    ]}
                    onPress={() => {
                      setModalVisible(false);
                      if (onNavigateToProfile) onNavigateToProfile();
                    }}
                  >
                    <Text style={styles.linkEmoji}>👤</Text>
                    <Text style={[styles.linkText, { color: modalTextColor }]}>
                      Profile Dashboard
                    </Text>
                  </TouchableOpacity>

                  {/* Role-specific pages */}
                  {canSeePurchase &&
                    purchaseNavItems.map((item) => (
                      <TouchableOpacity
                        key={item.page}
                        style={[
                          styles.menuLinkRow,
                          { borderBottomColor: modalBorderColor },
                        ]}
                        onPress={() => {
                          setModalVisible(false);
                          if (onNavigateToPurchase) {
                            onNavigateToPurchase(item.page);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.linkEmoji}>{item.emoji}</Text>
                        <Text
                          style={[styles.linkText, { color: modalTextColor }]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}

                  {/* Settings */}
                  <TouchableOpacity
                    style={[
                      styles.menuLinkRow,
                      { borderBottomColor: modalBorderColor },
                    ]}
                    onPress={() => {
                      setModalVisible(false);
                      if (onNavigateToSettings) onNavigateToSettings();
                    }}
                  >
                    <Text style={styles.linkEmoji}>⚙️</Text>
                    <Text style={[styles.linkText, { color: modalTextColor }]}>
                      App Settings
                    </Text>
                  </TouchableOpacity>

                  {/* Alerts — shows unless explicitly disabled */}
                  {showBell && (
                    <TouchableOpacity
                      style={[
                        styles.menuLinkRow,
                        { borderBottomColor: modalBorderColor },
                      ]}
                      onPress={() => {
                        setModalVisible(false);
                        if (onNavigateToNotifications) onNavigateToNotifications();
                      }}
                    >
                      <Text style={styles.linkEmoji}>🔔</Text>
                      <Text style={[styles.linkText, { color: modalTextColor }]}>
                        System Alerts
                        {unreadCount > 0 ? `  ·  ${unreadCount}` : ''}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Logout */}
                  <TouchableOpacity
                    style={[styles.menuLinkRow, styles.logoutBorderRow]}
                    onPress={() => {
                      setModalVisible(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <Text style={styles.linkEmoji}>🚪</Text>
                    <Text
                      style={[
                        styles.linkText,
                        { color: '#EF4444', fontWeight: '700' },
                      ]}
                    >
                      Log Out Securely
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: darkMode ? '#334155' : '#F1F5F9' },
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text
                    style={[styles.closeButtonText, { color: modalSubTextColor }]}
                  >
                    Close Panel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  headerWrapper: { borderBottomWidth: 1 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  companyName: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiIcon: { fontSize: 18 },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F97316',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },

  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    elevation: 24,
  },
  modalAccentBar: {
    width: 50,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },

  userHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  userHeaderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    overflow: 'hidden',
  },
  userHeaderAvatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  userHeaderText: { flex: 1, minWidth: 0 },
  userHeaderName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  userHeaderRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
    gap: 5,
  },
  userHeaderRoleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  userHeaderRoleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  panelTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },

  toggleMenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  toggleLabel: { fontSize: 14, fontWeight: '700' },

  linksContainer: { marginBottom: 20 },
  menuLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  logoutBorderRow: { borderBottomWidth: 0, marginTop: 4 },
  linkEmoji: { fontSize: 18, marginRight: 14 },
  linkText: { fontSize: 15, fontWeight: '600' },

  closeButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: { fontSize: 14, fontWeight: '700' },
});