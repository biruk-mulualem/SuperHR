import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

// =========================================================================
// 📦 CONSTANTS & CONFIGURATION
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

// Sample data for the cards
const PURCHASE_DATA = {
  totalRequests: 24,
  pendingApproval: 8,
  priceComparison: 12,
  approvedNotPaid: 6,
  paidNotArrived: 4,
  arrived: 6,
};

// =========================================================================
// 🧩 REUSABLE COMPONENTS
// =========================================================================

const WelcomeBanner = ({ greeting, role, darkMode }) => (
  <View style={[styles.welcomeCard, { backgroundColor: darkMode ? '#1E3A8A' : '#EFF6FF' }]}>
    <Text style={[styles.greetingText, { color: darkMode ? '#FFFFFF' : '#1E3A8A' }]}>
      Welcome Back, {greeting} 👋
    </Text>
    <Text style={[styles.roleBadgeText, { color: darkMode ? '#93C5FD' : '#2563EB' }]}>
      Clearance Sector: <Text style={{ fontWeight: '850' }}>{role?.toUpperCase()}</Text>
    </Text>
  </View>
);

// =========================================================================
// 📊 PURCHASE SUMMARY CARDS - WITHOUT SUBTEXT
// =========================================================================

const SummaryCard = ({ 
  title, 
  value, 
  color, 
  onPress, 
  onSeeMore,
  cardBg, 
  borderColor,
  textColor,
  darkMode 
}) => (
  <TouchableOpacity 
    style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={[styles.summaryTitle, { color: textColor }]}>{title}</Text>
    
    {/* See More Button at bottom of card */}
    <TouchableOpacity 
      style={[styles.seeMoreBtn, { borderColor: color }]}
      onPress={onSeeMore}
      activeOpacity={0.7}
    >
      <Text style={[styles.seeMoreText, { color }]}> More →</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

// =========================================================================
// 🌟 MAIN DASHBOARD - PURCHASE FOCUSED
// =========================================================================

const PurchaseDashboard = ({ 
  textColor, 
  subTextColor, 
  cardBg, 
  borderColor, 
  setActiveTab, 
  userRole, 
  darkMode,
  navigation
}) => {
  const data = PURCHASE_DATA;

  const navigateTo = (tab, filter = null) => {
    if (setActiveTab) {
      setActiveTab(tab, filter);
    }
  };

  return (
    <ScrollView 
      style={styles.dashboardContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.dashboardContent}
    >
      <WelcomeBanner greeting="Procurement Officer" role={userRole} darkMode={darkMode} />

      {/* Purchase Related Section with Border */}
      <View style={[styles.sectionContainer, { borderColor: darkMode ? '#475569' : '#CBD5E1' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>📦 Purchase Related</Text>
        </View>

        {/* 6 Summary Cards Grid */}
        <View style={styles.summaryGrid}>
          <SummaryCard
            title="Total Requests"
            value={data.totalRequests}
            color="#3B82F6"
            onPress={() => navigateTo('purchases', 'all')}
            onSeeMore={() => navigateTo('purchases', 'all')}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            darkMode={darkMode}
          />
          <SummaryCard
            title="Pending Approval"
            value={data.pendingApproval}
            color="#F59E0B"
            onPress={() => navigateTo('purchases', 'pending')}
            onSeeMore={() => navigateTo('purchases', 'pending')}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            darkMode={darkMode}
          />
          <SummaryCard
            title="Price Comparison"
            value={data.priceComparison}
            color="#8B5CF6"
            onPress={() => navigateTo('purchases', 'bidding')}
            onSeeMore={() => navigateTo('purchases', 'bidding')}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            darkMode={darkMode}
          />
          <SummaryCard
            title="Approved Not Paid"
            value={data.approvedNotPaid}
            color="#3B82F6"
            onPress={() => navigateTo('purchases', 'approved')}
            onSeeMore={() => navigateTo('purchases', 'approved')}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            darkMode={darkMode}
          />
          <SummaryCard
            title="Paid Not Arrived"
            value={data.paidNotArrived}
            color="#10B981"
            onPress={() => navigateTo('purchases', 'paid')}
            onSeeMore={() => navigateTo('purchases', 'paid')}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            darkMode={darkMode}
          />
          <SummaryCard
            title="Arrived at SDT"
            value={data.arrived}
            color="#06B6D4"
            onPress={() => navigateTo('purchases', 'arrived')}
            onSeeMore={() => navigateTo('purchases', 'arrived')}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            darkMode={darkMode}
          />
        </View>
      </View>
    </ScrollView>
  );
};

// =========================================================================
// 🌟 ROLE DASHBOARD WRAPPERS
// =========================================================================

export const AdminDashboard = (props) => <PurchaseDashboard {...props} />;
export const SalesDashboard = (props) => <PurchaseDashboard {...props} />;
export const PurchaserDashboard = (props) => <PurchaseDashboard {...props} />;
export const ManagerDashboard = (props) => <PurchaseDashboard {...props} />;

export const GeneralDashboard = ({ textColor, cardBg, borderColor, userRole, darkMode }) => (
  <View style={styles.distinctContainer}>
    <WelcomeBanner greeting={userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'} role={userRole} darkMode={darkMode} />
    <View style={[styles.statWidget, { 
      backgroundColor: cardBg, 
      borderColor, 
      alignItems: 'center', 
      width: '100%', 
      marginRight: 0 
    }]}>
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
// 🌟 MAIN DASHBOARD DISPATCHER
// =========================================================================

const DASHBOARD_COMPONENTS = {
  [ROLES.ADMIN]: AdminDashboard,
  [ROLES.SALES]: SalesDashboard,
  [ROLES.PURCHASER]: PurchaserDashboard,
  [ROLES.MANAGER]: ManagerDashboard,
};

export default function DashboardPage({ darkMode, setActiveTab, userRole, navigation }) {
  const theme = {
    textColor: darkMode ? '#F1F5F9' : '#1E293B',
    subTextColor: darkMode ? '#94A3B8' : '#64748B',
    cardBg: darkMode ? '#1E293B' : '#FFFFFF',
    borderColor: darkMode ? '#334155' : '#E2E8F0',
  };

  const commonProps = { 
    ...theme, 
    setActiveTab, 
    userRole, 
    darkMode,
    navigation 
  };

  const DashboardComponent = DASHBOARD_COMPONENTS[userRole] || GeneralDashboard;

  return <DashboardComponent {...commonProps} />;
}

// =========================================================================
// 🎨 STYLES
// =========================================================================

const styles = StyleSheet.create({
  dashboardContainer: { flex: 1 },
  dashboardContent: { padding: 16, paddingBottom: 32 },
  distinctContainer: { flex: 1 },
  
  // Welcome Banner
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
  greetingText: { 
    fontSize: 22, 
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  roleBadgeText: { 
    fontSize: 13, 
    marginTop: 6, 
    fontWeight: '500',
    opacity: 0.9,
  },
  
  // Section Container with simple BORDER
  sectionContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  
  // Summary Cards Grid - 3 columns
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryCard: {
    width: '31%',
    padding: 14,
    paddingBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  
  // See More Button inside card
  seeMoreBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  seeMoreText: {
    fontSize: 9,
    fontWeight: '600',
  },
  
  // Stats Widget (for general dashboard)
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