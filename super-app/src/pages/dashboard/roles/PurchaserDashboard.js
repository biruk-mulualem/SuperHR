// pages/dashboard/roles/PurchaserDashboard.js
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// ================================================================
// DEMO DATA
// ================================================================
const PURCHASER_NAME = 'Abebe Kebede';

const PENDING_SUBMISSIONS = [
  { id: 'RQ-2026-001', priority: 'High' },
  { id: 'RQ-2026-002', priority: 'Medium' },
  { id: 'RQ-2026-003', priority: 'Urgent' },
];

const SUBMITTED_SUBMISSIONS = [
  { id: 'RS-2026-001', status: 'won' },
  { id: 'RS-2026-002', status: 'lost' },
  { id: 'RS-2026-003', status: 'pending' },
  { id: 'RS-2026-004', status: 'won' },
];

// ================================================================
// COMPONENT
// ================================================================
export default function PurchaserDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  onNavigateToPurchase,
}) {
  const stats = useMemo(() => {
    const pendingCount = PENDING_SUBMISSIONS.length;
    const submittedCount = SUBMITTED_SUBMISSIONS.length;
    const won = SUBMITTED_SUBMISSIONS.filter((s) => s.status === 'won').length;
    const lost = SUBMITTED_SUBMISSIONS.filter((s) => s.status === 'lost').length;
    const pendingResult = SUBMITTED_SUBMISSIONS.filter((s) => s.status === 'pending').length;
    const winRate = submittedCount > 0 ? Math.round((won / submittedCount) * 100) : 0;
    const urgentCount = PENDING_SUBMISSIONS.filter(
      (p) => p.priority === 'Urgent' || p.priority === 'High',
    ).length;
    return { pendingCount, submittedCount, won, lost, pendingResult, winRate, urgentCount };
  }, []);

  const goPending = () => onNavigateToPurchase?.('pendingSubmission');
  const goSubmitted = () => onNavigateToPurchase?.('submitted');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ✅ Single padded wrapper — everything inside aligns to the same gutter */}
      <View style={styles.pagePadding}>
        {/* WELCOME — one line */}
        <View style={styles.welcomeBlock}>
          <Text style={[styles.welcomeText, { color: subTextColor }]} numberOfLines={1}>
            👋 Welcome back,{' '}
            <Text style={[styles.welcomeName, { color: textColor }]}>{PURCHASER_NAME}</Text>
          </Text>
        </View>

        {/* SUMMARY NUMBERS ROW */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>📊 Summary</Text>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {stats.pendingCount}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Pending</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {stats.submittedCount}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Submitted</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>
              {stats.winRate}%
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Win Rate</Text>
          </View>
        </View>

        {/* ROUTING ROWS */}
        <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>
          🗂️ Your Sections
        </Text>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: borderColor }]}
          onPress={goPending}
          activeOpacity={0.55}
        >
          <View style={[styles.navIconCircle, { backgroundColor: '#F59E0B20' }]}>
            <Text style={styles.navIcon}>📥</Text>
          </View>
          <View style={styles.navTextBlock}>
            <Text style={[styles.navTitle, { color: textColor }]}>
              Pending Submission
            </Text>
            <Text style={[styles.navSub, { color: subTextColor }]}>
              {stats.pendingCount} awaiting · {stats.urgentCount} urgent
            </Text>
          </View>
          <Text style={[styles.navArrow, { color: subTextColor }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: borderColor }]}
          onPress={goSubmitted}
          activeOpacity={0.55}
        >
          <View style={[styles.navIconCircle, { backgroundColor: '#10B98120' }]}>
            <Text style={styles.navIcon}>📤</Text>
          </View>
          <View style={styles.navTextBlock}>
            <Text style={[styles.navTitle, { color: textColor }]}>
              Submitted
            </Text>
            <Text style={[styles.navSub, { color: subTextColor }]}>
              {stats.submittedCount} total · {stats.won} won · {stats.pendingResult} pending
            </Text>
          </View>
          <Text style={[styles.navArrow, { color: subTextColor }]}>›</Text>
        </TouchableOpacity>

        {/* BREAKDOWN */}
        <Text style={[styles.sectionTitle, { color: textColor, marginTop: 24 }]}>
          📈 Submission Breakdown
        </Text>

        <View style={styles.breakdownList}>
          <View style={[styles.breakdownRow, { borderBottomColor: borderColor }]}>
            <Text style={[styles.breakdownLabel, { color: subTextColor }]}>🏆 Won</Text>
            <Text style={[styles.breakdownValue, { color: '#10B981' }]}>{stats.won}</Text>
          </View>
          <View style={[styles.breakdownRow, { borderBottomColor: borderColor }]}>
            <Text style={[styles.breakdownLabel, { color: subTextColor }]}>❌ Lost</Text>
            <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>{stats.lost}</Text>
          </View>
          <View style={[styles.breakdownRow, { borderBottomColor: borderColor }]}>
            <Text style={[styles.breakdownLabel, { color: subTextColor }]}>
              ⏳ Awaiting Result
            </Text>
            <Text style={[styles.breakdownValue, { color: '#F59E0B' }]}>
              {stats.pendingResult}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

// ================================================================
// STYLES
// ================================================================
const SIDE_PADDING = 20; // 👈 single source of truth for horizontal gutter

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 0 },

  // ✅ Single padded wrapper — everything inside is aligned
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

  // Summary numbers
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 34 },

  // Routing rows
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

  // Breakdown
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
});