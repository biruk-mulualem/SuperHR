// pages/dashboard/roles/PurchaserDashboard.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Renamed import
import purchaserService from '../../../stores/purchaserService';

// ================================================================
// TYPES (JSDoc — keeps the file plain JS)
// ================================================================
/**
 * @typedef {Object} DashboardStats
 * @property {number} pendingCount
 * @property {number} urgentCount
 * @property {number} submittedCount
 * @property {number} won
 * @property {number} lost
 * @property {number} pendingResult
 * @property {number} winRate
 */

const EMPTY_STATS = {
  pendingCount: 0,
  urgentCount: 0,
  submittedCount: 0,
  won: 0,
  lost: 0,
  pendingResult: 0,
  winRate: 0,
};

// ================================================================
// HELPERS
// ================================================================
const loadStoredUserName = async () => {
  try {
    const raw = await AsyncStorage.getItem('user');
    if (!raw) return null;

    const user = JSON.parse(raw);
    return (
      user?.fullName ||
      user?.name ||
      user?.username ||
      user?.employeeName ||
      null
    );
  } catch (err) {
    console.error('Load stored user failed:', err);
    return null;
  }
};

// ================================================================
// COMPONENT
// ================================================================
export default function PurchaserDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  onNavigateToPurchase,
  userName,
}) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [displayName, setDisplayName] = useState(
    userName || 'Purchaser',
  );

  // ------------------------------------------------------------
  // RESOLVE THE USER NAME
  // ------------------------------------------------------------
  useEffect(() => {
    let alive = true;

    if (userName && userName.trim()) {
      setDisplayName(userName.trim());
      return () => {
        alive = false;
      };
    }

    (async () => {
      const stored = await loadStoredUserName();
      if (alive && stored) {
        setDisplayName(stored);
      }
    })();

    return () => {
      alive = false;
    };
  }, [userName]);

  // ------------------------------------------------------------
  // FETCH DASHBOARD
  // ------------------------------------------------------------
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // ✅ Renamed call
      const res = await purchaserService.getDashboard();
      if (res?.success && res.data) {
        setStats({
          pendingCount:   Number(res.data.pendingCount)   || 0,
          urgentCount:    Number(res.data.urgentCount)    || 0,
          submittedCount: Number(res.data.submittedCount) || 0,
          won:            Number(res.data.won)            || 0,
          lost:           Number(res.data.lost)           || 0,
          pendingResult:  Number(res.data.pendingResult)  || 0,
          winRate:        Number(res.data.winRate)        || 0,
        });
      } else {
        setError(res?.error || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('PurchaserDashboard fetch failed:', err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to load dashboard',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // ------------------------------------------------------------
  // NAVIGATION HANDLERS
  // ------------------------------------------------------------
  const goPending = () => onNavigateToPurchase?.('pendingSubmission');
  const goSubmitted = () => onNavigateToPurchase?.('submitted');

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDashboard(true)}
          tintColor={subTextColor}
        />
      }
    >
      <View style={styles.pagePadding}>
        {/* WELCOME */}
        <View style={styles.welcomeBlock}>
          <Text
            style={[styles.welcomeText, { color: subTextColor }]}
            numberOfLines={1}
          >
            👋 Welcome back,{' '}
            <Text style={[styles.welcomeName, { color: textColor }]}>
              {displayName}
            </Text>
          </Text>
        </View>

        {/* ERROR BANNER */}
        {error && !loading ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchDashboard(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* SUMMARY */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          📊 Summary
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {loading ? '—' : stats.pendingCount}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              Pending
            </Text>
          </View>

          <View
            style={[styles.statDivider, { backgroundColor: borderColor }]}
          />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {loading ? '—' : stats.submittedCount}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              Submitted
            </Text>
          </View>

          <View
            style={[styles.statDivider, { backgroundColor: borderColor }]}
          />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {loading ? '—' : `${stats.winRate}%`}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>
              Win Rate
            </Text>
          </View>
        </View>

        {/* ROUTING ROWS */}
        <Text
          style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}
        >
          🗂️ Your Sections
        </Text>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: borderColor }]}
          onPress={goPending}
          activeOpacity={0.55}
        >
          <View
            style={[styles.navIconCircle, { backgroundColor: '#F59E0B20' }]}
          >
            <Text style={styles.navIcon}>📥</Text>
          </View>
          <View style={styles.navTextBlock}>
            <Text style={[styles.navTitle, { color: textColor }]}>
              Pending Submission
            </Text>
            <Text style={[styles.navSub, { color: subTextColor }]}>
              {loading
                ? 'Loading...'
                : `${stats.pendingCount} awaiting · ${stats.urgentCount} urgent`}
            </Text>
          </View>
          <Text style={[styles.navArrow, { color: subTextColor }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: borderColor }]}
          onPress={goSubmitted}
          activeOpacity={0.55}
        >
          <View
            style={[styles.navIconCircle, { backgroundColor: '#10B98120' }]}
          >
            <Text style={styles.navIcon}>📤</Text>
          </View>
          <View style={styles.navTextBlock}>
            <Text style={[styles.navTitle, { color: textColor }]}>
              Submitted
            </Text>
            <Text style={[styles.navSub, { color: subTextColor }]}>
              {loading
                ? 'Loading...'
                : `${stats.submittedCount} total · ${stats.won} won · ${stats.pendingResult} pending`}
            </Text>
          </View>
          <Text style={[styles.navArrow, { color: subTextColor }]}>›</Text>
        </TouchableOpacity>

        {/* BREAKDOWN */}
        <Text
          style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}
        >
          📈 Submission Breakdown
        </Text>

        <View style={styles.breakdownList}>
          <View
            style={[styles.breakdownRow, { borderBottomColor: borderColor }]}
          >
            <Text style={[styles.breakdownLabel, { color: subTextColor }]}>
              🏆 Won
            </Text>
            <Text style={[styles.breakdownValue, { color: '#10B981' }]}>
              {loading ? '—' : stats.won}
            </Text>
          </View>

          <View
            style={[styles.breakdownRow, { borderBottomColor: borderColor }]}
          >
            <Text style={[styles.breakdownLabel, { color: subTextColor }]}>
              ❌ Lost
            </Text>
            <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>
              {loading ? '—' : stats.lost}
            </Text>
          </View>

        
        </View>

        {loading ? (
          <View style={styles.bottomLoader}>
            <ActivityIndicator size="small" color={subTextColor} />
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

// ================================================================
// STYLES
// ================================================================
const SIDE_PADDING = 20;

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 0 },

  pagePadding: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 16,
  },

  welcomeBlock: { marginTop: 4, marginBottom: 22 },
  welcomeText: { fontSize: 15, fontWeight: '500', letterSpacing: 0.2 },
  welcomeName: { fontSize: 17, fontWeight: '900', letterSpacing: 0.2 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '900' },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: { width: 1, height: 34 },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  navIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { fontSize: 20 },
  navTextBlock: { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: '800' },
  navSub: { fontSize: 12, marginTop: 3, fontWeight: '500' },
  navArrow: { fontSize: 26, fontWeight: '300', marginLeft: 4 },

  breakdownList: { marginTop: 2 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  breakdownLabel: { fontSize: 13, fontWeight: '600' },
  breakdownValue: { fontSize: 16, fontWeight: '800' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  bottomLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});