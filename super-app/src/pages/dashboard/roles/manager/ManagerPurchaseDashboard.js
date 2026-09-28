// src/pages/dashboard/roles/manager/ManagerPurchaseDashboard.js
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
import { mobileManagerDashboardService } from '../../../../stores/mobileManagerDashboardService';

export default function ManagerPurchaseDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  darkMode,
  onNavigateToPurchase,
}) {
  const [summary, setSummary] = useState({
    pendingApproval: 0,
    pendingPayment: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await mobileManagerDashboardService.getPurchaseSummary();

      if (res?.success) {
        setSummary({
          pendingApproval: Number(res.data?.pendingApproval ?? 0),
          pendingPayment: Number(res.data?.pendingPayment ?? 0),
        });
        setRecent(res.data?.recent || []);
      } else {
        setError(res?.error || 'Failed to load');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goTo = (page) => {
    if (typeof onNavigateToPurchase === 'function') {
      return onNavigateToPurchase(page);
    }
    console.warn(
      '⚠️ onNavigateToPurchase not provided to ManagerPurchaseDashboard'
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading purchase dashboard…
        </Text>
      </View>
    );
  }

  const total = summary.pendingApproval + summary.pendingPayment;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load({ silent: true })}
          colors={['#8B5CF6']}
          tintColor="#8B5CF6"
        />
      }
    >
      {/* ───────── Header ───────── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Purchase
        </Text>
        <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
          Requests, approvals and payments
        </Text>
      </View>

      {/* ───────── Error ───────── */}
      {error && (
        <TouchableOpacity
          onPress={() => load()}
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

      {/* ───────── Hero metric ───────── */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: darkMode ? '#312E81' : '#EEF2FF',
            borderColor: darkMode ? '#4338CA' : '#C7D2FE',
          },
        ]}
      >
        <Text
          style={[
            styles.heroLabel,
            { color: darkMode ? '#C7D2FE' : '#4338CA' },
          ]}
        >
          ACTIVE PURCHASE REQUESTS
        </Text>
        <Text
          style={[
            styles.heroValue,
            { color: darkMode ? '#FFFFFF' : '#1E1B4B' },
          ]}
        >
          {total}
        </Text>
        <Text
          style={[
            styles.heroHint,
            { color: darkMode ? '#A5B4FC' : '#6366F1' },
          ]}
        >
          across approval and payment stages
        </Text>
      </View>

      {/* ───────── Two status pills ───────── */}
      <View style={styles.pillsRow}>
        <TouchableOpacity
          style={[
            styles.pill,
            { backgroundColor: cardBg, borderColor },
          ]}
          onPress={() => goTo('pendingApproval')}
          activeOpacity={0.8}
        >
          <View style={styles.pillTopRow}>
            <View
              style={[styles.pillDot, { backgroundColor: '#F59E0B' }]}
            />
            <Text style={[styles.pillChevron, { color: subTextColor }]}>
              ›
            </Text>
          </View>
          <Text style={[styles.pillValue, { color: textColor }]}>
            {summary.pendingApproval}
          </Text>
          <Text
            style={[styles.pillLabel, { color: subTextColor }]}
            numberOfLines={1}
          >
            Pending approval
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pill,
            { backgroundColor: cardBg, borderColor },
          ]}
          onPress={() => goTo('approvedNotPaid')}
          activeOpacity={0.8}
        >
          <View style={styles.pillTopRow}>
            <View
              style={[styles.pillDot, { backgroundColor: '#3B82F6' }]}
            />
            <Text style={[styles.pillChevron, { color: subTextColor }]}>
              ›
            </Text>
          </View>
          <Text style={[styles.pillValue, { color: textColor }]}>
            {summary.pendingPayment}
          </Text>
          <Text
            style={[styles.pillLabel, { color: subTextColor }]}
            numberOfLines={1}
          >
            Pending payment
          </Text>
        </TouchableOpacity>
      </View>

      {/* ───────── Recent activity ───────── */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Recent activity
          </Text>
          <Text style={[styles.sectionHint, { color: subTextColor }]}>
            latest first
          </Text>
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyText, { color: subTextColor }]}>
              Nothing recent
            </Text>
          </View>
        ) : (
          recent.map((req, idx) => (
            <View
              key={req.id || idx}
              style={[
                styles.recentRow,
                idx > 0 && {
                  borderTopWidth: 1,
                  borderTopColor: darkMode ? '#334155' : '#F1F5F9',
                },
              ]}
            >
              <View style={styles.recentLeft}>
                <Text
                  style={[styles.recentNumber, { color: textColor }]}
                  numberOfLines={1}
                >
                  {req.requestNumber || `#${idx + 1}`}
                </Text>
                <Text
                  style={[styles.recentMeta, { color: subTextColor }]}
                  numberOfLines={1}
                >
                  {req.department || '—'}
                  {req.requestedDate ? ` · ${req.requestedDate}` : ''}
                </Text>
              </View>
              <Text
                style={[styles.recentChevron, { color: subTextColor }]}
              >
                ›
              </Text>
            </View>
          ))
        )}
      </View>

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
    paddingTop: 20,
  },

  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },

  header: { marginBottom: 20 },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
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

  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  heroHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },

  pillsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  pillTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillChevron: {
    fontSize: 18,
    fontWeight: '400',
    marginTop: -3,
  },
  pillValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '500',
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 26,
    marginBottom: 6,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 12.5,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recentLeft: {
    flex: 1,
    minWidth: 0,
  },
  recentNumber: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  recentMeta: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 3,
  },
  recentChevron: {
    fontSize: 20,
    fontWeight: '400',
    marginLeft: 8,
  },
});