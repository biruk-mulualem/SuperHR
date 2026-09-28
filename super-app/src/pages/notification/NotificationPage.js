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
  Modal,
} from 'react-native';

import mobileNotificationService from '../../stores/mobileNotificationService';
import mobilePostsGroupService from '../../stores/mobilePostsGroupService';

// ================================================================
// TYPE CLASSIFICATION
// ================================================================
const ACTION_TYPES = new Set([
  'posts.member_invited',
  'dispatch',
  'dispatch_boss',
  'approval_request',
  'price_submitted',
  'posts.post_submitted',
]);

const isActionable = (type) => ACTION_TYPES.has(type);

// ================================================================
// TYPE COLORS
// ================================================================
const getTypeColor = (type) => {
  const colors = {
    // ── Purchase ──
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

    // ── Posts / Groups ──
    'posts.member_invited':        '#8B5CF6',
    'posts.member_accepted':       '#10B981',
    'posts.member_declined':       '#EF4444',
    'posts.member_removed':        '#EF4444',
    'posts.post_submitted':        '#F59E0B',
    'posts.post_approved':         '#10B981',
    'posts.post_declined':         '#EF4444',
    'posts.post_comment':          '#06B6D4',
    'posts.image_signed':          '#3B82F6',
    'posts.group_deactivated':     '#64748B',
    'posts.ownership_transferred': '#F97316',

    // ── Fallbacks ──
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
  if (!item.referenceId && !item.metadata?.groupId) return null;

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

    case 'posts.member_invited':
    case 'posts.member_accepted':
    case 'posts.member_declined':
    case 'posts.member_removed':
    case 'posts.group_deactivated':
    case 'posts.ownership_transferred':
      return {
        tab: 'groupDetail',
        params: { id: item.referenceId },
      };

    case 'posts.post_submitted':
    case 'posts.post_approved':
    case 'posts.post_declined':
    case 'posts.post_comment':
    case 'posts.image_signed':
      return {
        tab: 'postDetail',
        params: {
          groupId: item.metadata?.groupId,
          postId: item.referenceId,
        },
      };

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

  // Invitation modal state
  const [inviteModal, setInviteModal] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(null);
  const [inviteError, setInviteError] = useState(null);

  // ----------------------------------------------------------------
  // Load
  // ----------------------------------------------------------------
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);

    try {
      const res = await mobileNotificationService.list({ limit: 50 });

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
  // Close the modal (safe — blocked only while a request is running)
  // ----------------------------------------------------------------
  const closeModal = () => {
    if (inviteBusy) return;
    setInviteModal(null);
    setInviteError(null);
  };

  // ----------------------------------------------------------------
  // Tap:
  //   • group invitations → open the modal
  //   • everything else   → navigate
  // ----------------------------------------------------------------
  const handleTap = (item) => {
    if (item.type === 'posts.member_invited') {
      setInviteError(null);
      setInviteBusy(null);
      setInviteModal(item);
      return;
    }

    const route = buildRouteFromNotification(item);
    if (route && typeof onOpenNotification === 'function') {
      onOpenNotification(route);
    }
  };

  // ----------------------------------------------------------------
  // Accept / Decline from the modal
  // ----------------------------------------------------------------
  const resolveInvite = async (kind) => {
    if (!inviteModal) return;

    const groupId =
      inviteModal.metadata?.groupId ?? inviteModal.referenceId;

    if (!groupId) {
      setInviteError('Missing group id');
      return;
    }

    setInviteBusy(kind);
    setInviteError(null);

    try {
      const res =
        kind === 'accept'
          ? await mobilePostsGroupService.acceptInvite(groupId)
          : await mobilePostsGroupService.declineInvite(groupId);

      if (!res?.success) {
        setInviteError(res?.error || `Failed to ${kind}`);
        return;
      }

      const resolvedId = inviteModal.id;
      setInviteModal(null);
      setItems((prev) => prev.filter((n) => n.id !== resolvedId));

      mobileNotificationService.remove(resolvedId).catch(() => {});

      Alert.alert(
        kind === 'accept' ? 'Joined!' : 'Declined',
        kind === 'accept'
          ? 'You are now a member of the group.'
          : 'Invitation declined.'
      );
    } catch (e) {
      setInviteError(
        e?.response?.data?.error || e?.message || 'Request failed'
      );
    } finally {
      setInviteBusy(null);
    }
  };

  // ----------------------------------------------------------------
  // Explicit delete (✕ button on each card)
  // ----------------------------------------------------------------
  const handleRemove = async (item) => {
    const isPersisted = Number.isInteger(item.id) && item.id > 0;

    const snapshot = items;
    setItems((prev) => prev.filter((n) => n.id !== item.id));

    if (isPersisted) {
      try {
        const res = await mobileNotificationService.remove(item.id);
        if (!res?.success) {
          setItems(snapshot);
          Alert.alert('Error', res?.error || 'Failed to remove notification');
        }
      } catch (err) {
        console.error('🔴 delete threw:', err);
        setItems(snapshot);
      }
    }
  };

  // ----------------------------------------------------------------
  // Mark all read → marks them read on the server AND clears the list
  // ----------------------------------------------------------------
  const handleMarkAllRead = async () => {
    const before = items;

    // Optimistically clear the visible list. Read items are removed.
    setItems([]);

    try {
      const res = await mobileNotificationService.markAllAsRead();
      if (!res?.success) {
        // Roll back if the server rejected
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

  const { actionItems, updateItems, actionUnread, updateUnread } = useMemo(() => {
    const action = [];
    const updates = [];
    for (const n of items) {
      if (isActionable(n.type)) action.push(n);
      else updates.push(n);
    }
    return {
      actionItems: action,
      updateItems: updates,
      actionUnread: action.filter((n) => !n.read).length,
      updateUnread: updates.filter((n) => !n.read).length,
    };
  }, [items]);

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
  // Row renderer (shared between both sections)
  // ----------------------------------------------------------------
  const renderRow = (item) => {
    const typeColor = getTypeColor(item.type);
    const typeIcon = getTypeIcon(item.type);
    const isInvite = item.type === 'posts.member_invited';

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

            <Text style={[styles.clearHint, { color: subTextColor }]}>
              {isInvite ? 'Tap to respond' : 'Tap to open'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleRemove(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.closeBtnText,
              { color: darkMode ? '#64748B' : '#94A3B8' },
            ]}
          >
            ✕
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ----------------------------------------------------------------
  // Section header renderer
  // ----------------------------------------------------------------
  const renderSectionHeader = (label, count, unread, accent) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionAccent, { backgroundColor: accent }]} />
      <Text style={[styles.sectionLabel, { color: subTextColor }]}>
        {label}
      </Text>
      <Text style={[styles.sectionCount, { color: subTextColor }]}>
        {unread > 0 ? `${unread} new · ${count}` : `${count}`}
      </Text>
    </View>
  );

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <View style={styles.root}>
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

        {/* Empty */}
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
          <>
            {/* ── NEEDS ACTION ── */}
            {actionItems.length > 0 && (
              <>
                {renderSectionHeader(
                  'NEEDS ACTION',
                  actionItems.length,
                  actionUnread,
                  '#F59E0B'
                )}
                {actionItems.map(renderRow)}
              </>
            )}

            {/* ── UPDATES ── */}
            {updateItems.length > 0 && (
              <>
                {renderSectionHeader(
                  'UPDATES',
                  updateItems.length,
                  updateUnread,
                  '#3B82F6'
                )}
                {updateItems.map(renderRow)}
              </>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ===================== INVITATION MODAL ===================== */}
      <Modal
        visible={!!inviteModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          {/* Backdrop tap-to-close */}
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={closeModal}
          />

          {inviteModal && (
            <View
              style={[
                styles.modalCard,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              {/* Header with explicit ✕ */}
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.modalIconBubble,
                    { backgroundColor: '#8B5CF620' },
                  ]}
                >
                  <Text style={styles.modalIconText}>📨</Text>
                </View>

                <Text style={[styles.modalTitle, { color: textColor }]}>
                  Group invitation
                </Text>

                <TouchableOpacity
                  onPress={closeModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.6}
                  style={styles.modalCloseBtn}
                >
                  <Text
                    style={[
                      styles.modalCloseText,
                      { color: darkMode ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalBody, { color: subTextColor }]}>
                {inviteModal.desc ||
                  inviteModal.title ||
                  'You have been invited to join a group.'}
              </Text>

              {inviteError && (
                <Text style={styles.modalError}>{inviteError}</Text>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    styles.modalDeclineBtn,
                    { borderColor },
                  ]}
                  onPress={() => resolveInvite('decline')}
                  disabled={!!inviteBusy}
                  activeOpacity={0.85}
                >
                  {inviteBusy === 'decline' ? (
                    <ActivityIndicator color="#EF4444" size="small" />
                  ) : (
                    <Text style={styles.modalDeclineText}>✕ Decline</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalAcceptBtn]}
                  onPress={() => resolveInvite('accept')}
                  disabled={!!inviteBusy}
                  activeOpacity={0.85}
                >
                  {inviteBusy === 'accept' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalAcceptText}>✓ Accept</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Cancel row — explicit close */}
              <TouchableOpacity
                onPress={closeModal}
                activeOpacity={0.7}
                disabled={!!inviteBusy}
                style={styles.modalCancelRow}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    {
                      color: subTextColor,
                      opacity: inviteBusy ? 0.5 : 1,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  root: { flex: 1 },
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

  // ── Section headers ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
    paddingLeft: 2,
  },
  sectionAccent: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    opacity: 0.7,
  },

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

  clearHint: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    opacity: 0.8,
  },

  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginTop: -2,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
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

  // ── Invitation modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modalIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconText: { fontSize: 22 },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
    flex: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 6,
  },
  modalError: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  modalAcceptBtn: { backgroundColor: '#10B981' },
  modalAcceptText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  modalDeclineBtn: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  modalDeclineText: {
    color: '#EF4444',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // ── Cancel row ──
  modalCancelRow: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});