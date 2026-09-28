// super-app/src/pages/dashboard/roles/manager/ManagerSalesDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';

// Optional service — safe to omit; falls back to zeros.
let mobileManagerSalesService = null;
try {
  // eslint-disable-next-line global-require
  mobileManagerSalesService =
    require('../../../../stores/mobileManagerSalesService').default ||
    require('../../../../stores/mobileManagerSalesService').mobileManagerSalesService;
} catch (e) {
  mobileManagerSalesService = null;
}

const EMPTY_DATA = {
  teamMembers: 0,
  ordersToday: 0,
  pendingOrders: 0,
  revenueThisMonth: 0,
  topRepOrders: 0,
};

export default function ManagerSalesDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  darkMode,
  onNavigateToManagerDashboard,
}) {
  const [salesData, setSalesData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      if (!mobileManagerSalesService?.getSalesSummary) {
        setSalesData(EMPTY_DATA);
        return;
      }

      const res = await mobileManagerSalesService.getSalesSummary();

      if (res?.success) {
        setSalesData({
          teamMembers: Number(res.data?.teamMembers ?? 0),
          ordersToday: Number(res.data?.ordersToday ?? 0),
          pendingOrders: Number(res.data?.pendingOrders ?? 0),
          revenueThisMonth: Number(res.data?.revenueThisMonth ?? 0),
          topRepOrders: Number(res.data?.topRepOrders ?? 0),
        });
      } else {
        setError(res?.error || 'Failed to load sales summary');
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) setError('Session expired. Please log in again.');
      else if (status === 403) setError('Access denied.');
      else if (e?.message?.includes('Network')) setError('Network error.');
      else setError(e?.response?.data?.error || e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const goTo = (destination) => {
    if (typeof onNavigateToManagerDashboard === 'function') {
      return onNavigateToManagerDashboard(destination);
    }
    console.warn('⚠️ No navigation callback for sales destination:', destination);
  };

  const totalOrders = salesData.ordersToday + salesData.pendingOrders;

  const sections = [
    {
      key: 'team',
      title: 'Sales Team',
      emoji: '👥',
      subtitle: 'Reps, targets and performance',
      accent: '#8B5CF6',
      softBg: '#F5F3FF',
      softBgDark: '#312E81',
      destination: 'salesTeam',
      stats: [
        { label: 'Reps', value: salesData.teamMembers, color: '#8B5CF6' },
        { label: 'Active', value: salesData.teamMembers, color: '#10B981' },
        { label: 'Total', value: salesData.teamMembers, color: '#8B5CF6' },
      ],
    },
    {
      key: 'orders',
      title: 'Orders',
      emoji: '🛒',
      subtitle: 'Team orders and statuses',
      accent: '#3B82F6',
      softBg: '#EFF6FF',
      softBgDark: '#1E3A8A',
      destination: 'salesOrders',
      stats: [
        { label: 'Today', value: salesData.ordersToday, color: '#3B82F6' },
        { label: 'Pending', value: salesData.pendingOrders, color: '#F59E0B' },
        { label: 'Total', value: totalOrders, color: '#3B82F6' },
      ],
    },
    {
      key: 'revenue',
      title: 'Revenue',
      emoji: '💰',
      subtitle: 'Sales revenue and trends',
      accent: '#10B981',
      softBg: '#ECFDF5',
      softBgDark: '#064E3B',
      destination: 'salesRevenue',
      stats: [
        { label: 'Month', value: salesData.revenueThisMonth, color: '#10B981' },
        { label: 'Top rep', value: salesData.topRepOrders, color: '#10B981' },
        { label: 'Target', value: 0, color: '#10B981' },
      ],
    },
    {
      key: 'reports',
      title: 'Reports',
      emoji: '📊',
      subtitle: 'Team performance reports',
      accent: '#F59E0B',
      softBg: '#FFFBEB',
      softBgDark: '#78350F',
      destination: 'salesReports',
      stats: [
        { label: 'Weekly', value: 0, color: '#F59E0B' },
        { label: 'Monthly', value: 0, color: '#F59E0B' },
        { label: 'Quarter', value: 0, color: '#F59E0B' },
      ],
    },
  ];

  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading sales dashboard…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadSummary({ silent: true })}
          colors={['#8B5CF6']}
          tintColor="#8B5CF6"
        />
      }
    >
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: darkMode ? '#2E1065' : '#F5F3FF',
            borderColor: darkMode ? '#5B21B6' : '#DDD6FE',
          },
        ]}
      >
        <Text
          style={[
            styles.heroLabel,
            { color: darkMode ? '#C4B5FD' : '#6D28D9' },
          ]}
        >
          SALES
        </Text>
        <Text
          style={[
            styles.heroTitle,
            { color: darkMode ? '#FFFFFF' : '#2E1065' },
          ]}
        >
          Team & Revenue 🛒
        </Text>
        <Text
          style={[
            styles.heroSubtitle,
            { color: darkMode ? '#DDD6FE' : '#7C3AED' },
          ]}
        >
          Manage reps, orders and performance
        </Text>
      </View>

      {error && (
        <TouchableOpacity
          onPress={() => loadSummary()}
          activeOpacity={0.85}
          style={[
            styles.errorBox,
            {
              borderColor: darkMode ? '#7F1D1D' : '#FCA5A5',
              backgroundColor: darkMode ? '#3B0A0A' : '#FEF2F2',
            },
          ]}
        >
          <Text
            style={[
              styles.errorText,
              { color: darkMode ? '#FCA5A5' : '#991B1B' },
            ]}
          >
            ⚠️  {error}   ·   tap to retry
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionsLabel, { color: subTextColor }]}>
        SECTIONS
      </Text>

      {sections.map((section) => (
        <TouchableOpacity
          key={section.key}
          onPress={() => goTo(section.destination)}
          activeOpacity={0.85}
          style={[styles.card, { backgroundColor: cardBg, borderColor }]}
        >
          <View
            style={[styles.cardAccent, { backgroundColor: section.accent }]}
          />
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: darkMode
                      ? section.softBgDark
                      : section.softBg,
                  },
                ]}
              >
                <Text style={styles.iconText}>{section.emoji}</Text>
              </View>
              <View style={styles.cardTitleBlock}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  {section.title}
                </Text>
                <Text
                  style={[styles.cardSubtitle, { color: subTextColor }]}
                  numberOfLines={1}
                >
                  {section.subtitle}
                </Text>
              </View>
              <View
                style={[
                  styles.arrowWrap,
                  {
                    backgroundColor: darkMode
                      ? section.softBgDark
                      : section.softBg,
                  },
                ]}
              >
                <Text style={[styles.arrowText, { color: section.accent }]}>
                  ›
                </Text>
              </View>
            </View>

            {section.stats && section.stats.length > 0 && (
              <View
                style={[
                  styles.statsRow,
                  { borderTopColor: darkMode ? '#334155' : '#F1F5F9' },
                ]}
              >
                {section.stats.map((stat, idx) => (
                  <View key={idx} style={styles.statCell}>
                    <Text style={[styles.statValue, { color: stat.color }]}>
                      {stat.value}
                    </Text>
                    <Text style={[styles.statLabel, { color: subTextColor }]}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 4 },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  loadingText: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  heroSubtitle: { fontSize: 13, fontWeight: '500' },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 12.5, fontWeight: '600' },
  sectionsLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: { width: 5, alignSelf: 'stretch' },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 22, fontWeight: '700', marginTop: -3 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});