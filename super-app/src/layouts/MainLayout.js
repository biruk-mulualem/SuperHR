// MainLayout.js
import React from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Header from '../components/shared/Header';
import FloatingFooter from '../components/shared/FloatingFooter';

// ────────────────────────────────────────────────────────────────
// Pages that render their own FlatList / VirtualizedList.
// These must NOT be wrapped in a ScrollView.
// ────────────────────────────────────────────────────────────────
const LIST_PAGES = [
  'purchase',
  'catalog',
  'notification',
  'profile',
  'pendingDetail',

  // ✅ Manager drill-ins own their own scroll container
  'managerDashboard',   // ← the missing one
  'storesList',
  'storeDetail',
  'inventory',
  'balanceAudit',
  'lowStock',
  'transfers',

  'posts',
  'adminDevices',
  'webSessions',
  'users',

  'roles',
  'departments',
  'devices',
  'positions',
  'systemSettings',

  'settingsAttendance',
  'settingsApproval',
  'settingsFinance',
  'settingsBackup',
  'settingsHR',
];

export default function MainLayout({
  children,
  onLogout,
  showHeader = true,
  activeTab,
  setActiveTab,
  onNavigateToProfile,
  onNavigateToSettings,
  onNavigateToNotifications,
  darkMode,
  setDarkMode,
  onNavigateToCatalog,
  permissions,
  users,
  userRole,
  onNavigateToPurchase,
}) {
  const insets = useSafeAreaInsets();
  const layoutBg = darkMode ? '#0F172A' : '#F8FAFC';

  const isFooterVisible = showHeader && activeTab === 'home';
  const isListPage = LIST_PAGES.includes(activeTab);

  if (!showHeader) {
    return (
      <View style={styles.loginWrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: layoutBg }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? '#1E293B' : '#FFFFFF'}
      />

      <Header
        onLogout={onLogout}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToSettings={onNavigateToSettings}
        onNavigateToNotifications={onNavigateToNotifications}
        onNavigateToCatalog={onNavigateToCatalog}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        permissions={permissions}
        userRole={userRole}
        onNavigateToPurchase={onNavigateToPurchase}
      />

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      >
        {isListPage ? (
          // ✅ No outer ScrollView — page owns its own scroll
          <View style={styles.content}>{children}</View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={
              isFooterVisible
                ? styles.globalScrollBuffer
                : styles.cleanScrollBuffer
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {isFooterVisible && (
        <FloatingFooter
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          darkMode={darkMode}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  loginWrapper: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1 },
  content: { flex: 1 },
  globalScrollBuffer: { paddingBottom: 140 },
  cleanScrollBuffer: { paddingBottom: 40 },
});