import React from 'react';
import { StyleSheet, View, StatusBar, ScrollView, SafeAreaView } from 'react-native';
import Header from '../components/shared/Header';
import FloatingFooter from '../components/shared/FloatingFooter';

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
  userRole,
  onNavigateToPurchase
}) {
  const layoutBg = darkMode ? '#0F172A' : '#F8FAFC';
  
  // Floating capsule navbar remains visible exclusively on the dashboard hub tab
  const isFooterVisible = showHeader && activeTab === 'home';

  // Pages that use FlatList - don't wrap in ScrollView
  const listPages = ['purchase', 'catalog', 'notification', 'profile', 'pendingDetail', 'managerDashboard','posts',];
  const isListPage = listPages.includes(activeTab);

  if (!showHeader) {
    return (
      <View style={styles.loginWrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: layoutBg }]}>
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
      
      {isListPage ? (
        // List pages - no ScrollView, let FlatList handle scrolling
        <View style={[styles.content, isFooterVisible && styles.globalScrollBuffer]}>
          {children}
        </View>
      ) : (
        // Non-list pages - use ScrollView
        <ScrollView 
          style={styles.content}
          contentContainerStyle={isFooterVisible ? styles.globalScrollBuffer : styles.cleanScrollBuffer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}

      {isFooterVisible && (
        <FloatingFooter activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginWrapper: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1 },
  content: { flex: 1 },
  globalScrollBuffer: { paddingBottom: 140 },
  cleanScrollBuffer: { paddingBottom: 40 }
});