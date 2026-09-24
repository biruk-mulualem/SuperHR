// pages/dashboard/DashboardPage.js
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

// =========================================================================
// 🎯 ROLE DASHBOARDS
// =========================================================================
import AdminDashboard     from './roles/AdminDashboard';
import ManagerDashboard   from './roles/ManagerDashboard';
import PurchaserDashboard from './roles/PurchaserDashboard';
import SalesDashboard     from './roles/SalesDashboard';

// =========================================================================
// 📦 ROLE CONSTANTS
// =========================================================================
const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  PURCHASER: 'purchaser',
  MANAGER: 'manager',
  BANKER: 'banker',
  SUPERVISOR: 'supervisor',
  AUDITOR: 'auditor',
};

// =========================================================================
// 🧩 GENERIC FALLBACK
// =========================================================================
const WelcomeBanner = ({ greeting, role, darkMode }) => (
  <View style={[styles.welcomeCard, { backgroundColor: darkMode ? '#1E3A8A' : '#EFF6FF' }]}>
    <Text style={[styles.greetingText, { color: darkMode ? '#FFFFFF' : '#1E3A8A' }]}>
      Welcome Back, {greeting} 👋
    </Text>
    <Text style={[styles.roleBadgeText, { color: darkMode ? '#93C5FD' : '#2563EB' }]}>
      Role: <Text style={{ fontWeight: '850' }}>{role?.toUpperCase()}</Text>
    </Text>
  </View>
);

export const GeneralDashboard = ({
  textColor,
  cardBg,
  borderColor,
  userRole,
  darkMode,
}) => (
  <View style={styles.distinctContainer}>
    <WelcomeBanner
      greeting={userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
      role={userRole}
      darkMode={darkMode}
    />
    <View
      style={[
        styles.statWidget,
        {
          backgroundColor: cardBg,
          borderColor,
          alignItems: 'center',
          width: '100%',
          marginRight: 0,
        },
      ]}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: textColor, padding: 20 }}>
        📊 {userRole?.toUpperCase()} Dashboard
      </Text>
      <Text style={{ fontSize: 13, color: '#64748B', paddingBottom: 16 }}>
        Overview of your assigned responsibilities
      </Text>
    </View>
  </View>
);

// =========================================================================
// 🗺️ DASHBOARD DISPATCHER MAP
// =========================================================================
const DASHBOARD_COMPONENTS = {
  [ROLES.ADMIN]:     AdminDashboard,
  [ROLES.MANAGER]:   ManagerDashboard,
  [ROLES.PURCHASER]: PurchaserDashboard,
  [ROLES.SALES]:     SalesDashboard,
};

// =========================================================================
// 🚀 MAIN DASHBOARD PAGE
// =========================================================================
export default function DashboardPage({
  darkMode,
  setActiveTab,
  userRole,
  permissions,
  onNavigateToPurchase,
  onNavigateToManagerDashboard,   // 🆕 ADD THIS
  navigation,
}) {
  const theme = {
    textColor: darkMode ? '#F1F5F9' : '#1E293B',
    subTextColor: darkMode ? '#94A3B8' : '#64748B',
    cardBg: darkMode ? '#1E293B' : '#FFFFFF',
    borderColor: darkMode ? '#334155' : '#E2E8F0',
  };

  const roleKey = String(userRole || '').toLowerCase();
  const DashboardComponent = DASHBOARD_COMPONENTS[roleKey] || GeneralDashboard;

  // ✅ Forward EVERYTHING the role dashboards might need
  const commonProps = {
    ...theme,
    setActiveTab,
    userRole: roleKey,
    darkMode,
    navigation,
    permissions,
    onNavigateToPurchase,
    onNavigateToManagerDashboard,   // 🆕 FORWARD THIS
  };

  return <DashboardComponent {...commonProps} />;
}

// =========================================================================
// 🎨 STYLES
// =========================================================================
const styles = StyleSheet.create({
  distinctContainer: { flex: 1, padding: 16 },
  welcomeCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  greetingText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  roleBadgeText: { fontSize: 13, marginTop: 6, fontWeight: '500', opacity: 0.9 },
  statWidget: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});