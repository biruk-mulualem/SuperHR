// pages/notification/NotificationPage.js
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// ================================================================
// DEMO REQUEST PAYLOADS
// In production, these would come from your API's notification feed —
// each notification would carry a small `request` snapshot.
// ================================================================
const DEMO_MANAGER_REQUESTS = {
  'PR-2026-0001': {
    id: 'PR-2026-0001',
    requestNumber: 'PR-2026-0001',
    requester: 'Tigist Hailu',
    department: 'Production',
    priority: 'High',
    date: '2026-09-05',
    status: 'approved_not_paid',
    items: [
      { id: 1, item: 'Steel Pipe 2 inch', code: 'SP-002', quantity: 50, uom: 'PCS' },
      { id: 2, item: 'Industrial Paint', code: 'IP-100', quantity: 30, uom: 'LTR' },
    ],
  },
  'PR-2026-0003': {
    id: 'PR-2026-0003',
    requestNumber: 'PR-2026-0003',
    requester: 'Dawit Solomon',
    department: 'Electrical',
    priority: 'Medium',
    date: '2026-09-07',
    status: 'pending_approval',
    items: [
      { id: 1, item: 'Circuit Breaker 32A', code: 'CB-32A', quantity: 10, uom: 'PCS' },
    ],
  },
};

const DEMO_PURCHASER_REQUESTS = {
  'PR-2026-0001': {
    id: 'PR-2026-0001',
    requestNumber: 'PR-2026-0001',
    requester: 'Tigist Hailu',
    department: 'Production',
    priority: 'High',
    date: '2026-09-05',
    items: [
      { id: 1, item: 'Steel Pipe 2 inch', code: 'SP-002', quantity: 50, uom: 'PCS' },
      { id: 2, item: 'Industrial Paint', code: 'IP-100', quantity: 30, uom: 'LTR' },
      { id: 3, item: 'Hydraulic Pump', code: 'HP-500', quantity: 2, uom: 'SET' },
    ],
  },
  'PR-2026-0003': {
    id: 'PR-2026-0003',
    requestNumber: 'PR-2026-0003',
    requester: 'Dawit Solomon',
    department: 'Electrical',
    priority: 'Medium',
    date: '2026-09-07',
    items: [
      { id: 1, item: 'Circuit Breaker 32A', code: 'CB-32A', quantity: 10, uom: 'PCS' },
    ],
  },
  'PR-2026-0004': {
    id: 'PR-2026-0004',
    requestNumber: 'PR-2026-0004',
    requester: 'Meron Ayele',
    department: 'Maintenance',
    priority: 'Urgent',
    date: '2026-09-08',
    items: [
      { id: 1, item: 'Conveyor Belt 10m', code: 'CB-010', quantity: 3, uom: 'ROLL' },
      { id: 2, item: 'Bearing 6204', code: 'BR-6204', quantity: 20, uom: 'PCS' },
    ],
  },
};

// ================================================================
// ROLE-SCOPED PURCHASE NOTIFICATIONS
// ================================================================
const NOTIFICATIONS_BY_ROLE = {
  manager: [
    {
      id: 'm1',
      type: 'approval',
      title: '⏳ Approval pending',
      desc: 'PR-2026-0003 is awaiting your approval.',
      time: '5 mins ago',
      read: false,
      route: {
        tab: 'pendingDetail',
        payload: DEMO_MANAGER_REQUESTS['PR-2026-0003'],
        fallback: { tab: 'purchase', subView: 'pendingApproval' },
      },
    },
    {
      id: 'm2',
      type: 'approval',
      title: '⏳ 2 more requests pending',
      desc: 'You have 2 additional requests awaiting approval.',
      time: '20 mins ago',
      read: false,
      route: {
        tab: 'purchase',
        subView: 'pendingApproval',
      },
    },
    {
      id: 'm3',
      type: 'payment',
      title: '💳 Payment released',
      desc: 'Payment for PR-2026-0001 has been released.',
      time: '2 hours ago',
      read: false,
      route: {
        tab: 'pendingDetail',
        payload: DEMO_MANAGER_REQUESTS['PR-2026-0001'],
        fallback: { tab: 'purchase', subView: 'approvedNotPaid' },
      },
    },
    {
      id: 'm4',
      type: 'order',
      title: '📋 New total requests available',
      desc: 'You have 12 total purchase requests.',
      time: 'Yesterday',
      read: true,
      route: {
        tab: 'purchase',
        subView: 'totalRequests',
      },
    },
  ],

  purchaser: [
    {
      id: 'p1',
      type: 'order',
      title: '📥 New request to price',
      desc: 'PR-2026-0004 is now available for price submission.',
      time: '3 mins ago',
      read: false,
      route: {
        tab: 'pendingSubmissionDetail',
        payload: DEMO_PURCHASER_REQUESTS['PR-2026-0004'],
        fallback: { tab: 'purchase', subView: 'pendingSubmission' },
      },
    },
    {
      id: 'p2',
      type: 'alert',
      title: '⏳ Deadline approaching',
      desc: 'PR-2026-0001 deadline is in 24 hours.',
      time: '45 mins ago',
      read: false,
      route: {
        tab: 'pendingSubmissionDetail',
        payload: DEMO_PURCHASER_REQUESTS['PR-2026-0001'],
        fallback: { tab: 'purchase', subView: 'pendingSubmission' },
      },
    },
    {
      id: 'p3',
      type: 'order',
      title: '📥 Price collection opened',
      desc: 'PR-2026-0003 is now collecting prices.',
      time: '2 hours ago',
      read: false,
      route: {
        tab: 'pendingSubmissionDetail',
        payload: DEMO_PURCHASER_REQUESTS['PR-2026-0003'],
        fallback: { tab: 'purchase', subView: 'pendingSubmission' },
      },
    },
    {
      id: 'p4',
      type: 'approval',
      title: '🏆 You won a bid',
      desc: 'Your price for "Bearing 6204" was selected.',
      time: 'Yesterday',
      read: true,
      route: {
        tab: 'purchase',
        subView: 'submitted',
      },
    },
  ],

  default: [],
};

const FALLBACK_ROLE = 'purchaser';

// ================================================================
// HELPERS
// ================================================================
const getTypeColor = (type) => {
  const colors = {
    order:    '#3B82F6',
    payment:  '#10B981',
    alert:    '#EF4444',
    approval: '#F59E0B',
    system:   '#8B5CF6',
  };
  return colors[type] || '#64748B';
};

const getTypeIcon = (type) => {
  const icons = {
    order:    '📦',
    payment:  '💳',
    alert:    '⚠️',
    approval: '⏳',
    system:   '🛡️',
  };
  return icons[type] || '🔔';
};

// ================================================================
// COMPONENT
// ================================================================
export default function NotificationPage({
  darkMode,
  userRole,
  onOpenNotification,
}) {
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';
  const titleColor = darkMode ? '#93C5FD' : '#1E3A8A';
  const emptyBg = darkMode ? '#1E293B' : '#F8FAFC';
  const unreadBg = darkMode ? '#1E293B' : '#EFF6FF';

  const roleKey = String(userRole || FALLBACK_ROLE).toLowerCase();
  const initial =
    NOTIFICATIONS_BY_ROLE[roleKey] || NOTIFICATIONS_BY_ROLE.default;

  const [readMap, setReadMap] = useState({});

  const notifications = useMemo(
    () =>
      initial.map((n) => ({
        ...n,
        read: readMap[n.id] !== undefined ? readMap[n.id] : n.read,
      })),
    [initial, readMap],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTap = (item) => {
    setReadMap((prev) => ({ ...prev, [item.id]: true }));
    if (item.route && onOpenNotification) {
      onOpenNotification(item.route);
    }
  };

  const handleMarkAllRead = () => {
    const all = {};
    notifications.forEach((n) => (all[n.id] = true));
    setReadMap(all);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: titleColor }]}>
            Notifications
          </Text>
          <Text style={[styles.pageSub, { color: subTextColor }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up 🎉'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={[
              styles.markAllBtn,
              {
                backgroundColor: darkMode ? '#1E293B' : '#EFF6FF',
                borderColor: darkMode ? '#334155' : '#BFDBFE',
              },
            ]}
            onPress={handleMarkAllRead}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.markAllText,
                { color: darkMode ? '#93C5FD' : '#1E40AF' },
              ]}
            >
              ✓ Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View
          style={[styles.emptyBox, { backgroundColor: emptyBg, borderColor }]}
        >
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No notifications
          </Text>
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            You're all caught up for your role.
          </Text>
        </View>
      ) : (
        notifications.map((item) => {
          const typeColor = getTypeColor(item.type);
          const typeIcon = getTypeIcon(item.type);

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.read ? cardBg : unreadBg,
                  borderColor,
                  borderLeftColor: item.read ? borderColor : typeColor,
                },
              ]}
              onPress={() => handleTap(item)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: typeColor + '20' },
                ]}
              >
                <Text style={styles.iconBubbleText}>{typeIcon}</Text>
              </View>

              <View style={styles.bodyBlock}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.notifTitle, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {!item.read && (
                    <View
                      style={[styles.unreadDot, { backgroundColor: typeColor }]}
                    />
                  )}
                </View>

                <Text
                  style={[styles.notifDesc, { color: subTextColor }]}
                  numberOfLines={2}
                >
                  {item.desc}
                </Text>

                <View style={styles.footerRow}>
                  <Text
                    style={[
                      styles.notifTime,
                      { color: darkMode ? '#64748B' : '#94A3B8' },
                    ]}
                  >
                    🕐 {item.time}
                  </Text>
                  <Text style={[styles.viewHint, { color: '#3B82F6' }]}>
                    View ›
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
  pageSub: { fontSize: 12, marginTop: 3, fontWeight: '500' },

  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  markAllText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleText: { fontSize: 18 },

  bodyBlock: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTitle: { fontSize: 14, fontWeight: '800', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },

  notifDesc: { fontSize: 12.5, marginTop: 4, lineHeight: 18 },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  notifTime: { fontSize: 11, fontWeight: '500' },
  viewHint: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptyText: { fontSize: 13, textAlign: 'center' },
});