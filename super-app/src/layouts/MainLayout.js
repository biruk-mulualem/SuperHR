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

// ✅ Use SafeAreaView from react-native-safe-area-context (edge-to-edge aware)
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
  'managerDashboard',
  'posts',
  'adminDevices',
  'webSessions',
  'users',
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
  darkMode,                 // ✅ kept — this was the missing prop
  setDarkMode,
  onNavigateToCatalog,
  permissions,
  users,
  userRole,
  onNavigateToPurchase,
}) {
  const insets = useSafeAreaInsets();
  const layoutBg = darkMode ? '#0F172A' : '#F8FAFC';

  // Floating capsule navbar is only visible on the dashboard hub tab
  const isFooterVisible = showHeader && activeTab === 'home';
  const isListPage = LIST_PAGES.includes(activeTab);

  // Login / no-header screens
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

      {/* ✅ KeyboardAvoidingView so inputs aren't hidden by the keyboard */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : insets.top}
      >
        {isListPage ? (
          // List pages — no ScrollView, let FlatList handle scrolling
          <View
            style={[
              styles.content,
              isFooterVisible && styles.globalScrollBuffer,
            ]}
          >
            {children}
          </View>
        ) : (
          // Non-list pages — wrap in ScrollView
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