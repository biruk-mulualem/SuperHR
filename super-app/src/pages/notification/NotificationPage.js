// pages/notification/NotificationPage.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import mobileNotificationService from '../../stores/mobileNotificationService';

// ================================================================
// TYPE COLORS
// ================================================================
const getTypeColor = (type) => {
  const colors = {
    dispatch:          '#3B82F6',
    dispatch_boss:     '#8B5CF6',
    approval_request:  '#F59E0B',
    price_submitted:   '#06B6D4',
    winner_selected:   '#10B981',
    request_approved:  '#10B981',
    request_declined:  '#EF4444',
    request_deleted:   '#64748B',
    purchase_reminder: '#F97316',
    order:    '#3B82F6',
    payment:  '#10B981',
    alert:    '#EF4444',
    approval: '#F59E0B',
    system:   '#8B5CF6',
  };
  return colors[type] || '#64748B';
};

const getTypeIcon = (type) => mobileNotificationService.getIcon(type);

// ----------------------------------------------------------------
// ROUTE BUILDER
// ----------------------------------------------------------------
const buildRouteFromNotification = (item) => {
  if (!item.referenceId) return null;

  switch (item.type) {
    case 'dispatch':
    case 'dispatch_boss':
    case 'approval_request':
    case 'price_submitted':
      return {
        tab: 'pendingSubmissionDetail',
        params: { id: item.referenceId },
      };

    case 'winner_selected':
    case 'request_approved':
    case 'request_declined':
      return {
        tab: 'submittedDetail',
        params: { id: item.referenceId },
      };

    case 'request_deleted':
      return null;

    default:
      return {
        tab: 'pendingSubmissionDetail',
        params: { id: item.referenceId },
      };
  }
};

// ================================================================
// COMPONENT
// ================================================================
export default function NotificationPage({
  darkMode = false,
  userRole,
  onOpenNotification,
}) {
  const textColor      = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor   = darkMode ? '#94A3B8' : '#64748B';
  const cardBg         = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor    = darkMode ? '#334155' : '#E2E8F0';
  const titleColor     = darkMode ? '#93C5FD' : '#1E3A8A';
  const emptyBg        = darkMode ? '#1E293B' : '#F8FAFC';
  const unreadBg       = darkMode ? '#1E293B' : '#EFF6FF';

  // ----------------------------------------------------------------
  // State
  // ----------------------------------------------------------------
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ----------------------------------------------------------------
  // Load
  // ----------------------------------------------------------------
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);

    try {
      const res = await mobileNotificationService.list({
        purchaseType: 'local',
        limit: 50,
      });

      if (res?.success) {
        const rows = res?.data?.items || [];
        const mapped = rows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title || '🔔 Notification',
          desc: n.body || '',
          time: mobileNotificationService.formatRelativeTime(n.createdAt),
          read: !!n.isRead,
          createdAt: n.createdAt,
          referenceId: n.referenceId,
          referenceType: n.referenceType,
          metadata: n.metadata || {},
        }));

        setItems(mapped);
      } else {
        setErrorMsg(res?.error || 'Failed to load notifications');
        setItems([]);
      }
    } catch (e) {
      console.error('NotificationPage load error:', e);
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load';
      setErrorMsg(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
    setRefreshing(false);
  }, [load]);

  // ----------------------------------------------------------------
  // Tap → delete notification → navigate (if reference)
  // ----------------------------------------------------------------
  const handleTap = async (item) => {
    const isPersisted = Number.isInteger(item.id) && item.id > 0;

    // Optimistic removal
    const snapshot = items;
    setItems((prev) => prev.filter((n) => n.id !== item.id));

    // Persist
    if (isPersisted) {
      try {
        const res = await mobileNotificationService.remove(item.id);
        console.log('🗑️ delete response:', res);

        if (!res?.success) {
          setItems(snapshot);
          Alert.alert('Error', res?.error || 'Failed to remove notification');
          return;
        }
      } catch (err) {
        console.error('🔴 delete threw:', err);
        setItems(snapshot);
        return;
      }
    }

    // Navigate
    const route = buildRouteFromNotification(item);

    if (route && typeof onOpenNotification === 'function') {
      onOpenNotification(route);
    }
  };

  // ----------------------------------------------------------------
  // Mark all read
  // ----------------------------------------------------------------
  const handleMarkAllRead = async () => {
    const before = items;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const res = await mobileNotificationService.markAllAsRead('local');
      if (!res?.success) {
        setItems(before);
        Alert.alert('Error', res?.error || 'Failed to mark all as read');
      }
    } catch (err) {
      console.error('🔴 markAllAsRead threw:', err);
      setItems(before);
    }
  };

  // ----------------------------------------------------------------
  // Derived
  // ----------------------------------------------------------------
  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  // ----------------------------------------------------------------
  // Loading
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: emptyBg }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.centerText, { color: subTextColor }]}>
          Loading notifications…
        </Text>
      </View>
    );
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: titleColor }]}>
            Notifications
          </Text>
          <Text style={[styles.pageSub, { color: subTextColor }]}>
            {errorMsg
              ? `⚠️ ${errorMsg}`
              : unreadCount > 0
              ? `${unreadCount} unread`
              : 'All caught up 🎉'}
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

      {/* List / empty */}
      {items.length === 0 ? (
        <View
          style={[styles.emptyBox, { backgroundColor: emptyBg, borderColor }]}
        >
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No notifications
          </Text>
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            You're all caught up.
          </Text>
        </View>
      ) : (
        items.map((item) => {
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

                {item.desc ? (
                  <Text
                    style={[styles.notifDesc, { color: subTextColor }]}
                    numberOfLines={2}
                  >
                    {item.desc}
                  </Text>
                ) : null}

                <View style={styles.footerRow}>
                  <Text
                    style={[
                      styles.notifTime,
                      { color: darkMode ? '#64748B' : '#94A3B8' },
                    ]}
                  >
                    🕐 {item.time}
                  </Text>

                  {/* ✅ Same hint for every row — tappable to clear */}
                  <Text style={[styles.clearHint, { color: subTextColor }]}>
                    Tap to clear
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  centerText: { fontSize: 13, fontWeight: '600' },

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

  // ✅ Soft grey hint on every card
  clearHint: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    opacity: 0.8,
  },

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