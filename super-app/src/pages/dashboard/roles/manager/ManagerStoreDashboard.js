// super-app/src/pages/dashboard/roles/manager/ManagerStoreDashboard.js
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

// Optional store service — the page still renders without it.
let mobileStoreDashboardService = null;
try {
  // eslint-disable-next-line global-require
  mobileStoreDashboardService =
    require('../../../../stores/mobileStoreDashboardService').default ||
    require('../../../../stores/mobileStoreDashboardService').mobileStoreDashboardService;
} catch (e) {
  mobileStoreDashboardService = null;
}

const EMPTY_DATA = {
  totalStores: 0,
  activeStores: 0,

  totalItems: 0,
  activeItems: 0,
  inactiveItems: 0,

  lowStock: 0,
  outOfStock: 0,

  totalStatus: 0,
  triggeredStatus: 0,
  pendingStatus: 0,

  auditedItems: 0,
  matchedItems: 0,
  conflictedItems: 0,

  stores: [],
};

export default function ManagerStoreDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  darkMode,
  onNavigateToManagerDashboard,
  onNavigateToPurchase,
}) {
  const [storeData, setStoreData] = useState(EMPTY_DATA);
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

      if (!mobileStoreDashboardService?.getStoreSummary) {
        setStoreData(EMPTY_DATA);
        return;
      }

      const res = await mobileStoreDashboardService.getStoreSummary();

      if (!res?.success) {
        setError(res?.error || 'Failed to load store summary');
        return;
      }

      const d = res.data || {};

      const totalItems = Number(d.totalItems ?? 0);
      const activeItems = Number(d.activeItems ?? 0);
      const inactiveItems =
        d.inactiveItems != null
          ? Number(d.inactiveItems)
          : Math.max(0, totalItems - activeItems);

      setStoreData({
        totalStores:   Number(d.totalStores   ?? 0),
        activeStores:  Number(d.activeStores  ?? 0),

        totalItems,
        activeItems,
        inactiveItems,

        lowStock:   Number(d.lowStock   ?? 0),
        outOfStock: Number(d.outOfStock ?? 0),

        totalStatus:     Number(d.totalStatus     ?? 0),
        triggeredStatus: Number(d.triggeredStatus ?? 0),
        pendingStatus:   Number(d.pendingStatus   ?? 0),

        auditedItems:    Number(d.auditedItems    ?? 0),
        matchedItems:    Number(d.matchedItems    ?? 0),
        conflictedItems: Number(d.conflictedItems ?? 0),

        stores: [],
      });
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
  const goTo = (destination, payload) => {
    if (typeof onNavigateToManagerDashboard === 'function') {
      return onNavigateToManagerDashboard(destination, payload);
    }
    if (typeof onNavigateToPurchase === 'function') {
      return onNavigateToPurchase(destination, payload);
    }
    console.warn('⚠️ No navigation callback for store destination:', destination);
  };

  const hasConflicts = storeData.conflictedItems > 0;

  // -----------------------------------------------------------------
  // SECTIONS
  // -----------------------------------------------------------------
  const sections = [
    {
      key: 'stores',
      title: 'Stores',
      emoji: '🏬',
      subtitle: 'Branches and their operation status',
      accent: '#10B981',
      softBg: '#ECFDF5',
      softBgDark: '#064E3B',
      destination: 'storesList',
      stats: [
        { label: 'Total',  value: storeData.totalStores,  color: '#10B981' },
        { label: 'Active', value: storeData.activeStores, color: '#10B981' },
        {
          label: 'Idle',
          value: Math.max(0, storeData.totalStores - storeData.activeStores),
          color: '#F59E0B',
        },
      ],
    },
    {
      key: 'inventory',
      title: 'Inventory',
      emoji: '📦',
      subtitle: 'All items across stores',
      accent: '#8B5CF6',
      softBg: '#F5F3FF',
      softBgDark: '#312E81',
      destination: 'inventory',
      stats: [
        { label: 'Total',    value: storeData.totalItems,    color: '#8B5CF6' },
        { label: 'Active',   value: storeData.activeItems,   color: '#10B981' },
        { label: 'Inactive', value: storeData.inactiveItems, color: '#EF4444' },
      ],
    },
    {
      key: 'audit',
      title: 'Balance Audit',
      emoji: '⚖️',
      subtitle: 'Cross-checked item balances',
      accent: hasConflicts ? '#EF4444' : '#10B981',
      softBg: hasConflicts ? '#FEF2F2' : '#ECFDF5',
      softBgDark: hasConflicts ? '#7F1D1D' : '#064E3B',
      destination: 'balanceAudit',
      stats: [
        { label: 'Audited',   value: storeData.auditedItems,    color: '#8B5CF6' },
        { label: 'Matched',   value: storeData.matchedItems,    color: '#10B981' },
        { label: 'Conflicts', value: storeData.conflictedItems, color: '#EF4444' },
      ],
    },
    // ── Only the visible LABEL changed — destination stays 'lowStock' ──
    {
      key: 'lowStock',
      title: 'Stock Status',
      emoji: '🔔',
      subtitle: 'Items flagged by stock thresholds',
      accent: '#F59E0B',
      softBg: '#FFFBEB',
      softBgDark: '#78350F',
      destination: 'lowStock',       // ← unchanged
      stats: [
        { label: 'Total',     value: storeData.totalStatus,     color: '#8B5CF6' },
        { label: 'Triggered', value: storeData.triggeredStatus, color: '#EF4444' },
        { label: 'Pending',   value: storeData.pendingStatus,   color: '#3B82F6' },
      ],
    },
  ];

  // -----------------------------------------------------------------
  // LOADING
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading store dashboard…
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
          colors={['#10B981']}
          tintColor="#10B981"
        />
      }
    >
      {/* ───────────── Hero greeting ───────────── */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: darkMode ? '#052E1F' : '#ECFDF5',
            borderColor: darkMode ? '#065F46' : '#A7F3D0',
          },
        ]}
      >
        <Text
          style={[
            styles.heroLabel,
            { color: darkMode ? '#6EE7B7' : '#047857' },
          ]}
        >
          STORE & INVENTORY
        </Text>
        <Text
          style={[
            styles.heroTitle,
            { color: darkMode ? '#FFFFFF' : '#064E3B' },
          ]}
        >
          {storeData.totalStores}{' '}
          {storeData.totalStores === 1 ? 'store' : 'stores'} 🏬
        </Text>
        <Text
          style={[
            styles.heroSubtitle,
            { color: darkMode ? '#A7F3D0' : '#059669' },
          ]}
        >
          {storeData.totalItems} items tracked
        </Text>
      </View>

      {/* ───────────── Conflict banner ───────────── */}
      {hasConflicts && (
        <TouchableOpacity
          onPress={() => goTo('balanceAudit')}
          activeOpacity={0.85}
          style={[
            styles.conflictBanner,
            {
              borderColor: darkMode ? '#7F1D1D' : '#FCA5A5',
              backgroundColor: darkMode ? '#3B0A0A' : '#FEF2F2',
            },
          ]}
        >
          <Text
            style={[
              styles.conflictIcon,
              { color: darkMode ? '#FCA5A5' : '#991B1B' },
            ]}
          >
            ⚠️
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.conflictTitle,
                { color: darkMode ? '#FCA5A5' : '#991B1B' },
              ]}
            >
              Balance conflict detected
            </Text>
            <Text
              style={[
                styles.conflictBody,
                { color: darkMode ? '#FCA5A5' : '#991B1B' },
              ]}
            >
              {storeData.conflictedItems} item
              {storeData.conflictedItems === 1 ? '' : 's'} with mismatched
              balances · tap to review
            </Text>
          </View>
        </TouchableOpacity>
      )}

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

// ================================================================
// STYLES
// ================================================================
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

  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 12,
  },
  conflictIcon: { fontSize: 22 },
  conflictTitle: { fontSize: 13.5, fontWeight: '800' },
  conflictBody: { fontSize: 12, fontWeight: '500', marginTop: 2 },

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