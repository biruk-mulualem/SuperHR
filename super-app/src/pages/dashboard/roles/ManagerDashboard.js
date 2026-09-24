// src/pages/dashboard/roles/ManagerDashboard.js
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
import { mobileManagerDashboardService } from '../../../stores/mobileManagerDashboardService';

// Optional store service — reads the same store summary the
// Store & Inventory dashboard uses, so the tile stats stay in sync.
let mobileStoreDashboardService = null;
try {
  // eslint-disable-next-line global-require
  mobileStoreDashboardService =
    require('../../../stores/mobileStoreDashboardService').default ||
    require('../../../stores/mobileStoreDashboardService').mobileStoreDashboardService;
} catch (e) {
  mobileStoreDashboardService = null;
}

// Optional balance-audit service — same source as Stock Status page.
let mobileManagerBalanceAuditService = null;
try {
  // eslint-disable-next-line global-require
  mobileManagerBalanceAuditService =
    require('../../../stores/mobileManagerBalanceAuditService').default ||
    require('../../../stores/mobileManagerBalanceAuditService').mobileManagerBalanceAuditService;
} catch (e) {
  mobileManagerBalanceAuditService = null;
}

const EMPTY_PURCHASE = { pendingApproval: 0, pendingPayment: 0 };
const EMPTY_STORE    = { totalItems: 0, conflicts: 0, alerts: 0 };

// Colour palette for the Store tile
const C_ITEMS     = '#10B981';   // green — neutral total
const C_CONFLICTS = '#EF4444';   // red   — always
const C_ALERTS    = '#F59E0B';   // amber — always

export default function ManagerDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  setActiveTab,
  onNavigateToPurchase,
  onNavigateToManagerDashboard,
  darkMode,
}) {
  const [purchaseData, setPurchaseData] = useState(EMPTY_PURCHASE);
  const [storeData, setStoreData] = useState(EMPTY_STORE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------------
  const loadSummary = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // ── Purchase summary ──
      let purchase = EMPTY_PURCHASE;
      try {
        const res = await mobileManagerDashboardService.getPurchaseSummary();
        if (res?.success) {
          purchase = {
            pendingApproval: Number(res.data?.pendingApproval ?? 0),
            pendingPayment: Number(res.data?.pendingPayment ?? 0),
          };
        } else if (res?.error) {
          setError(res.error);
        }
      } catch (e) {
        console.warn('Purchase summary failed:', e?.message);
      }
      setPurchaseData(purchase);

      // ── Store & inventory summary ──
      let store = EMPTY_STORE;
      try {
        if (mobileStoreDashboardService?.getStoreSummary) {
          const res = await mobileStoreDashboardService.getStoreSummary();
          if (res?.success) {
            // Backend now sends FULL-set counters directly.
            const totalItems   = Number(res.data?.totalItems      ?? 0);
            const conflicts    = Number(res.data?.conflictedItems ?? 0);

            // ── Alerts = triggered items from the balance-audit summary ──
            let alerts = 0;
            if (mobileManagerBalanceAuditService?.getSummary) {
              try {
                const sres = await mobileManagerBalanceAuditService.getSummary();
                if (sres?.success) {
                  alerts = Number(sres.data?.conflicted ?? 0);
                }
              } catch (e) {
                console.warn('Stock status summary failed:', e?.message);
              }
            }

            store = { totalItems, conflicts, alerts };
          }
        }
      } catch (e) {
        console.warn('Store summary failed:', e?.message);
      }
      setStoreData(store);
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

  // -----------------------------------------------------------------
  // NAVIGATION
  // -----------------------------------------------------------------
  const goTo = (destination) => {
    if (typeof onNavigateToManagerDashboard === 'function') {
      return onNavigateToManagerDashboard(destination);
    }
    if (
      destination === 'purchaseDashboard' &&
      typeof onNavigateToPurchase === 'function'
    ) {
      return onNavigateToPurchase('pendingApproval');
    }
    if (typeof setActiveTab === 'function') {
      return setActiveTab(destination);
    }
    console.warn('⚠️ No navigation callback for', destination);
  };

  const totalPurchaseRequests =
    purchaseData.pendingApproval + purchaseData.pendingPayment;

  // -----------------------------------------------------------------
  // SECTIONS
  //   Only Store & Inventory is live. Everything else is "Coming soon"
  //   and is rendered as an inert (non-tappable) row.
  // -----------------------------------------------------------------
  const sections = [
    {
      key: 'store',
      title: 'Store & Inventory',
      emoji: '🏬',
      subtitle: 'Stock levels, items, alerts',
      accent: '#10B981',
      softBg: '#ECFDF5',
      softBgDark: '#064E3B',
      destination: 'storeDashboard',
      comingSoon: false,
      stats: [
        {
          label: 'Items',
          value: storeData.totalItems,
          color: C_ITEMS,
        },
        {
          label: 'Conflicts',
          value: storeData.conflicts,
          color: C_CONFLICTS,
        },
        {
          label: 'Alerts',
          value: storeData.alerts,
          color: C_ALERTS,
        },
      ],
    },
    {
      key: 'purchase',
      title: 'Purchase',
      emoji: '📦',
      subtitle: 'Requests, approvals, payments',
      accent: '#8B5CF6',
      softBg: '#F5F3FF',
      softBgDark: '#312E81',
      destination: 'purchaseDashboard',
      comingSoon: true,
      stats: [
        {
          label: 'Pending',
          value: purchaseData.pendingApproval,
          color: '#F59E0B',
        },
        {
          label: 'To Pay',
          value: purchaseData.pendingPayment,
          color: '#3B82F6',
        },
        {
          label: 'Total',
          value: totalPurchaseRequests,
          color: '#8B5CF6',
        },
      ],
    },
    {
      key: 'hr',
      title: 'Human Resources',
      emoji: '👥',
      subtitle: 'Employees, attendance, payroll',
      accent: '#EC4899',
      softBg: '#FDF2F8',
      softBgDark: '#831843',
      destination: 'hrDashboard',
      comingSoon: true,
      stats: [
        { label: 'Staff', value: 0, color: '#EC4899' },
        { label: 'Absent', value: 0, color: '#F59E0B' },
        { label: 'Total', value: 0, color: '#EC4899' },
      ],
    },
    {
      key: 'finance',
      title: 'Finance',
      emoji: '💰',
      subtitle: 'Budgets, expenses, reports',
      accent: '#F59E0B',
      softBg: '#FFFBEB',
      softBgDark: '#78350F',
      destination: 'financeDashboard',
      comingSoon: true,
      stats: [
        { label: 'Pending', value: 0, color: '#F59E0B' },
        { label: 'Paid', value: 0, color: '#10B981' },
        { label: 'Total', value: 0, color: '#F59E0B' },
      ],
    },
  ];

  // -----------------------------------------------------------------
  // LOADING
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading dashboard…
        </Text>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadSummary({ silent: true })}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {/* ───────────── Hero greeting ───────────── */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: darkMode ? '#1E1B4B' : '#EEF2FF',
            borderColor: darkMode ? '#3730A3' : '#C7D2FE',
          },
        ]}
      >
        <Text
          style={[
            styles.heroLabel,
            { color: darkMode ? '#C7D2FE' : '#4338CA' },
          ]}
        >
          MANAGER OVERVIEW
        </Text>
        <Text
          style={[
            styles.heroTitle,
            { color: darkMode ? '#FFFFFF' : '#1E1B4B' },
          ]}
        >
          Welcome back, boss 👋
        </Text>
        <Text
          style={[
            styles.heroSubtitle,
            { color: darkMode ? '#A5B4FC' : '#6366F1' },
          ]}
        >
          Here's the state of things
        </Text>
      </View>

      {/* ───────────── Error banner ───────────── */}
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

      {/* ───────────── Sections label ───────────── */}
      <Text style={[styles.sectionsLabel, { color: subTextColor }]}>
        SECTIONS
      </Text>

      {/* ───────────── Section cards ───────────── */}
      {sections.map((section) => {
        const disabled = !!section.comingSoon;

        const CardWrapper = disabled ? View : TouchableOpacity;

        const cardProps = disabled
          ? {
              style: [
                styles.card,
                { backgroundColor: cardBg, borderColor },
                styles.cardDisabled,
              ],
            }
          : {
              activeOpacity: 0.85,
              onPress: () => goTo(section.destination),
              style: [
                styles.card,
                { backgroundColor: cardBg, borderColor },
              ],
            };

        return (
          <CardWrapper key={section.key} {...cardProps}>
            {/* Left accent bar — dimmed when coming soon */}
            <View
              style={[
                styles.cardAccent,
                {
                  backgroundColor: section.accent,
                  opacity: disabled ? 0.35 : 1,
                },
              ]}
            />

            <View style={styles.cardBody}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: darkMode
                        ? section.softBgDark
                        : section.softBg,
                      opacity: disabled ? 0.6 : 1,
                    },
                  ]}
                >
                  <Text style={styles.iconText}>{section.emoji}</Text>
                </View>

                <View style={styles.cardTitleBlock}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.cardTitle,
                        {
                          color: textColor,
                          opacity: disabled ? 0.55 : 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {section.title}
                    </Text>

                    {disabled && (
                      <View
                        style={[
                          styles.comingSoonPill,
                          {
                            backgroundColor: darkMode
                              ? '#1E293B'
                              : '#F1F5F9',
                            borderColor: darkMode ? '#334155' : '#E2E8F0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.comingSoonText,
                            { color: subTextColor },
                          ]}
                        >
                          Coming soon
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.cardSubtitle,
                      {
                        color: subTextColor,
                        opacity: disabled ? 0.55 : 1,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {section.subtitle}
                  </Text>
                </View>

                {!disabled && (
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
                    <Text
                      style={[styles.arrowText, { color: section.accent }]}
                    >
                      ›
                    </Text>
                  </View>
                )}
              </View>

              {/* Bottom row: stats */}
              {section.stats && section.stats.length > 0 && (
                <View
                  style={[
                    styles.statsRow,
                    {
                      borderTopColor: darkMode ? '#334155' : '#F1F5F9',
                      opacity: disabled ? 0.4 : 1,
                    },
                  ]}
                >
                  {section.stats.map((stat, idx) => (
                    <View key={idx} style={styles.statCell}>
                      <Text
                        style={[styles.statValue, { color: stat.color }]}
                      >
                        {stat.value}
                      </Text>
                      <Text
                        style={[styles.statLabel, { color: subTextColor }]}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </CardWrapper>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 4,
  },

  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },

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
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },

  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

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
  cardDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  cardAccent: {
    width: 5,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
  },

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
  iconText: {
    fontSize: 22,
  },

  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },

  comingSoonPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  comingSoonText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -3,
  },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});