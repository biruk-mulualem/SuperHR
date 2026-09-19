// components/Header.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Switch,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';

// ================================================================
// USER PROFILES
// ================================================================
const USER_PROFILES = {
  admin: {
    name: 'John Doe',
    initials: 'JD',
    role: 'Admin',
    roleColor: '#8B5CF6',
    avatar: 'https://i.pravatar.cc/300?img=12',
  },
  sales: {
    name: 'Flynn Rider',
    initials: 'FR',
    role: 'Sales Rep',
    roleColor: '#10B981',
    avatar: 'https://i.pravatar.cc/300?img=15',
  },
  purchaser: {
    name: 'Sam Purchaser',
    initials: 'SP',
    role: 'Purchaser',
    roleColor: '#F59E0B',
    avatar: 'https://i.pravatar.cc/300?img=33',
  },
  manager: {
    name: 'Alex Manager',
    initials: 'AM',
    role: 'Manager',
    roleColor: '#3B82F6',
    avatar: 'https://i.pravatar.cc/300?img=52',
  },
  auditor: {
    name: 'Elena Auditor',
    initials: 'EA',
    role: 'Auditor',
    roleColor: '#EF4444',
    avatar: 'https://i.pravatar.cc/300?img=45',
  },
  banker: {
    name: 'Betty Banker',
    initials: 'BB',
    role: 'Banker',
    roleColor: '#06B6D4',
    avatar: 'https://i.pravatar.cc/300?img=29',
  },
  supervisor: {
    name: 'Sam Supervisor',
    initials: 'SS',
    role: 'Supervisor',
    roleColor: '#0EA5E9',
    avatar: 'https://i.pravatar.cc/300?img=60',
  },
};

const FALLBACK_KEY = 'sales';

// ================================================================
// PAGE LIBRARY (no more "paidNotArrived")
// ================================================================
const PAGE_LIBRARY = {
  totalRequests:     { label: 'Total Requests',     emoji: '📋', page: 'totalRequests' },
  pendingApproval:   { label: 'Pending Approval',   emoji: '⏳', page: 'pendingApproval' },
  approvedNotPaid:   { label: 'Approved Not Paid',  emoji: '✅', page: 'approvedNotPaid' },

  // Purchaser-specific pages
  pendingSubmission: { label: 'Pending Submission', emoji: '📥', page: 'pendingSubmission' },
  submitted:         { label: 'Submitted',          emoji: '📤', page: 'submitted' },
};

// Which pages each role sees
const ROLE_PAGES = {
  admin:      ['totalRequests', 'pendingApproval', 'approvedNotPaid'],
  manager:    ['totalRequests', 'pendingApproval', 'approvedNotPaid'],
  supervisor: ['totalRequests', 'pendingApproval', 'approvedNotPaid'],
  purchaser:  ['pendingSubmission', 'submitted'],
  sales:      [],
  banker:     [],
  auditor:    [],
};

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
  permissions,
  userRole,
  onNavigateToPurchase,
  notificationCount = 0,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const headerBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderBottomColor = darkMode ? '#334155' : '#E2E8F0';
  const titleColor = darkMode ? '#FFFFFF' : '#1E3A8A';
  const notifBtnBg = darkMode ? '#334155' : '#F1F5F9';

  const modalBgColor = darkMode ? '#1E293B' : '#FFFFFF';
  const modalTextColor = darkMode ? '#F1F5F9' : '#1E293B';
  const modalSubTextColor = darkMode ? '#94A3B8' : '#64748B';
  const modalBorderColor = darkMode ? '#334155' : '#F1F5F9';

  // ---------- Resolve user profile ----------
  const roleKey = String(userRole || FALLBACK_KEY).toLowerCase();
  const profile = USER_PROFILES[roleKey] || USER_PROFILES[FALLBACK_KEY];

  // ---------- Role-specific purchase pages ----------
  const pageKeys = ROLE_PAGES[roleKey] || [];
  const purchaseNavItems = pageKeys.map((k) => PAGE_LIBRARY[k]).filter(Boolean);
  const canSeePurchase = purchaseNavItems.length > 0;

  return (
    <View
      style={[
        styles.headerWrapper,
        { backgroundColor: headerBg, borderBottomColor },
      ]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.brandGroup}>
          <Text style={[styles.companyName, { color: titleColor }]}>
            SUPER APP
          </Text>
        </View>

        <View style={styles.actionGroup}>
          {/* Bell — visible whenever alerts permission exists */}
          {permissions?.alerts && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: notifBtnBg }]}
              onPress={onNavigateToNotifications}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiIcon}>🔔</Text>

              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Avatar */}
          <TouchableOpacity
            style={[styles.avatarButton, { borderColor: profile.roleColor }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: profile.avatar }}
              style={styles.avatarImage}
            />
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
              <View style={[styles.modalCard, { backgroundColor: modalBgColor }]}>
                <View
                  style={[
                    styles.modalAccentBar,
                    { backgroundColor: darkMode ? '#334155' : '#E2E8F0' },
                  ]}
                />

                {/* USER HEADER CARD */}
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
                      { borderColor: profile.roleColor },
                    ]}
                  >
                    <Image
                      source={{ uri: profile.avatar }}
                      style={styles.userHeaderAvatarImage}
                    />
                  </View>

                  <View style={styles.userHeaderText}>
                    <Text
                      style={[styles.userHeaderName, { color: modalTextColor }]}
                      numberOfLines={1}
                    >
                      {profile.name}
                    </Text>
                    <View
                      style={[
                        styles.userHeaderRolePill,
                        { backgroundColor: profile.roleColor + '20' },
                      ]}
                    >
                      <View
                        style={[
                          styles.userHeaderRoleDot,
                          { backgroundColor: profile.roleColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.userHeaderRoleText,
                          { color: profile.roleColor },
                        ]}
                      >
                        {profile.role}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.panelTitle, { color: modalTextColor }]}>
                  Navigation Menu
                </Text>

                {/* 🌙 Dark mode toggle */}
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

                  {/* Role-specific purchase pages */}
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

                  {/* App Settings */}
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

                  {/* System Alerts */}
                  {permissions?.alerts && (
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