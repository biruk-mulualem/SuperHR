// pages/dashboard/roles/StorekeeperDashboard.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pendingNotificationService from '../../../stores/pendingNotificationService';

const TOP_FLOATING_GAP =
  (Platform.select({ ios: 12, android: 12, default: 12 }) || 12) +
  (StatusBar.currentHeight || 0);
const BOTTOM_FLOATING_GAP = 100;

// =========================================================================
// MAIN DASHBOARD
// =========================================================================
export default function StorekeeperDashboard({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  setActiveTab,
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const theme = useMemo(
    () => ({
      darkMode: !!darkMode,
      textColor: textColor || (darkMode ? '#F1F5F9' : '#0F172A'),
      subTextColor: subTextColor || (darkMode ? '#94A3B8' : '#64748B'),
      cardBg: cardBg || (darkMode ? '#1E293B' : '#FFFFFF'),
      borderColor: borderColor || (darkMode ? '#334155' : '#E2E8F0'),
    }),
    [darkMode, textColor, subTextColor, cardBg, borderColor],
  );

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const session = {
        storeId: user.assignedStore?.id || user.storeId,
        groupId: user.assignedGroup?.id || user.groupId,
        departmentId: user.departmentId || user.Department?.department_id || null,
      };

      const result = await pendingNotificationService.getAllNotifications(session);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to load notifications');
        return;
      }

      const groupedRequests = pendingNotificationService.groupByRequest(result.data);
      setNotifications(groupedRequests);
    } catch (error) {
      console.error('Dashboard load error:', error);
      Alert.alert('Connection Error', 'Failed to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const acceptAllPending = async (entry) => {
    const result = await pendingNotificationService.acceptAllPendingForRequest(entry);
    if (result.accepted > 0) {
      Alert.alert('✅ Accepted', `${result.accepted} approval(s) accepted.`);
      setSelectedId(null);
      loadDashboard();
    } else {
      Alert.alert('Error', result.errors[0] || 'Failed to accept.');
    }
  };

  const rejectAllPending = async (entry, reason) => {
    const result = await pendingNotificationService.rejectAllPendingForRequest(entry, reason);
    if (result.rejected > 0) {
      Alert.alert('❌ Rejected', 'Request rejected.');
      setSelectedId(null);
      loadDashboard();
    } else {
      Alert.alert('Error', result.errors[0] || 'Failed to reject.');
    }
  };

  const changeDecision = async (entry, newStatus, reason) => {
    const result = await pendingNotificationService.changeAllDecisionsForRequest(
      entry,
      newStatus,
      reason
    );
    if (result.changed > 0) {
      Alert.alert(
        newStatus === 'accepted' ? '✅ Decision changed' : '❌ Decision changed',
        `Approvals flipped to ${newStatus}.`
      );
      loadDashboard();
    } else {
      Alert.alert('Error', result.errors[0] || 'Failed to change decision.');
    }
  };

  const tabCounts = useMemo(
    () => ({
      all: notifications.length,
      pending: notifications.filter((r) => r.summaryStatus === 'pending').length,
      accepted: notifications.filter((r) => r.summaryStatus === 'accepted').length,
      rejected: notifications.filter((r) => r.summaryStatus === 'rejected').length,
    }),
    [notifications],
  );

  const filteredRequests = useMemo(() => {
    return notifications.filter((req) => {
      if (filterStatus !== 'all' && req.summaryStatus !== filterStatus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return [
        req.request?.requestCode,
        ...(req.request?.items || []).map((i) => i.item?.name),
        req.request?.requestedByUser?.fullName,
        req.request?.requestedBy,
        req.request?.askingStore?.name,
        req.request?.supplyingStore?.name,
      ].some((s) => (s || '').toLowerCase().includes(q));
    });
  }, [notifications, filterStatus, searchQuery]);

  const grouped = useMemo(
    () => pendingNotificationService.groupByDate(filteredRequests),
    [filteredRequests]
  );

  const selectedEntry = selectedId
    ? notifications.find((r) => r.requestId === selectedId) || null
    : null;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.darkMode ? '#0F172A' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: theme.subTextColor }}>Loading dashboard…</Text>
      </View>
    );
  }

  const listPane = (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.darkMode ? '#0F172A' : '#F8FAFC' }}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: TOP_FLOATING_GAP,
          paddingBottom: BOTTOM_FLOATING_GAP,
          paddingHorizontal: 16,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
      }
    >
      <View style={styles.topbar}>
        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <Text style={styles.titleIcon}>🔔</Text>
          </View>
          <Text style={[styles.title, { color: theme.textColor }]}>Notifications</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.subTextColor }]}>
          <Text style={styles.subtitleStrong}>{tabCounts.pending}</Text> pending request
          {tabCounts.pending === 1 ? '' : 's'} need your attention
        </Text>
      </View>

      <View style={[styles.segment, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        {[
          { value: 'all', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'rejected', label: 'Rejected' },
        ].map((opt) => {
          const active = filterStatus === opt.value;
          const count = tabCounts[opt.value] ?? 0;
          const activeBg =
            opt.value === 'pending'
              ? '#d97706'
              : opt.value === 'accepted'
              ? '#059669'
              : opt.value === 'rejected'
              ? '#dc2626'
              : '#0F172A';
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFilterStatus(opt.value)}
              style={[styles.segBtn, active && { backgroundColor: activeBg }]}
              activeOpacity={0.75}
            >
              <Text style={[styles.segText, { color: active ? '#fff' : theme.subTextColor }]}>
                {opt.label}
              </Text>
              <View
                style={[
                  styles.segCount,
                  { backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.segCountText, { color: active ? '#fff' : '#475569' }]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.searchbar, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
        <Text style={styles.searchIcon}>🔎</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search request code, item, user, or store…"
          placeholderTextColor="#94A3B8"
          style={[styles.searchInput, { color: theme.textColor }]}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {filteredRequests.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>All caught up</Text>
          <Text style={[styles.emptyText, { color: theme.subTextColor }]}>
            {filterStatus === 'all'
              ? 'No notifications to review right now.'
              : `No ${filterStatus} notifications.`}
          </Text>
        </View>
      ) : (
        grouped.map((group, gi) => (
          <View key={gi}>
            <View style={styles.dateDivider}>
              <Text style={styles.dateLabel}>{group.date}</Text>
              <View style={styles.dividerLine} />
              <View style={styles.dividerCount}>
                <Text style={styles.dividerCountText}>{group.requests.length}</Text>
              </View>
            </View>

            {group.requests.map((req) => (
              <RequestRow
                key={req.requestId}
                entry={req}
                onPress={() => setSelectedId(req.requestId)}
                selected={false}
                compact={false}
                theme={theme}
              />
            ))}
          </View>
        ))
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const detailPane = selectedEntry ? (
    <DetailView
      key={selectedEntry.requestId}
      entry={selectedEntry}
      onClose={() => setSelectedId(null)}
      onAcceptAll={acceptAllPending}
      onReject={rejectAllPending}
      onChangeDecision={changeDecision}
      theme={theme}
    />
  ) : null;

  if (selectedEntry) return detailPane;
  return listPane;
}

// =========================================================================
// REQUEST ROW
// =========================================================================
function RequestRow({ entry, onPress, selected, compact, theme }) {
  const req = entry.request || {};
  const status = entry.summaryStatus;
  const stripeColor =
    status === 'pending' ? '#f59e0b' : status === 'accepted' ? '#10b981' : '#ef4444';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.requestRow,
        {
          backgroundColor: theme.cardBg,
          borderColor: selected ? stripeColor : theme.borderColor,
          borderWidth: selected ? 2 : 1,
          marginBottom: compact ? 6 : 8,
        },
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
      <View style={styles.expandArrow}>
        <Text style={styles.expandArrowText}>▸</Text>
      </View>

      <View style={[styles.requestBody, compact && { paddingVertical: 6, gap: 3 }]}>
        <View style={styles.codeTimeRow}>
          <View style={styles.codeChip}>
            <Text style={styles.codeChipText} numberOfLines={1}>
              {req.requestCode || `REQ-${entry.requestId}`}
            </Text>
          </View>
          <Text style={[styles.rowTime, { color: theme.subTextColor }]}>
            {pendingNotificationService.formatAgo(
              req.requestedAt || req.requested_at || req.requestedDate || req.createdAt
            )}
          </Text>
        </View>

        <Text style={[styles.rowItems, { color: theme.textColor }]} numberOfLines={1}>
          {req.items?.length || 0} item(s) · {pendingNotificationService.getItemNames(req.items) || '—'}
        </Text>

        <View style={styles.fromToRow}>
          <Text
            style={[
              styles.fromToText,
              { color: pendingNotificationService.isOtherStore(req) ? '#7c3aed' : theme.textColor },
            ]}
            numberOfLines={1}
          >
            {pendingNotificationService.getOriginName(req)}
          </Text>
          <Text style={styles.fromToArrow}>➡️</Text>
          <Text style={[styles.fromToText, { color: theme.textColor }]} numberOfLines={1}>
            {req.supplyingStore?.name || '—'}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.statusBadge,
              status === 'pending' && { backgroundColor: '#FEF3C7' },
              status === 'accepted' && { backgroundColor: '#D1FAE5' },
              status === 'rejected' && { backgroundColor: '#FEE2E2' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                status === 'pending' && { color: '#92400E' },
                status === 'accepted' && { color: '#065F46' },
                status === 'rejected' && { color: '#991B1B' },
              ]}
            >
              {pendingNotificationService.capitalize(status)}
            </Text>
          </View>

          {req.isTemelash && (
            <View style={styles.temelashBadge}>
              <Text style={styles.temelashBadgeText}>🔄 Temelash</Text>
            </View>
          )}

          <View style={styles.dotsRow}>
            {entry.approvals.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.dot,
                  a.status === 'pending' && { backgroundColor: '#f59e0b' },
                  a.status === 'accepted' && { backgroundColor: '#10b981' },
                  a.status === 'rejected' && { backgroundColor: '#ef4444' },
                  a.approval_type === 'department' && styles.dotDept,
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// =========================================================================
// DETAIL VIEW (Pinch-to-Zoom on paper only)
// =========================================================================
function DetailView({ entry, onClose, onAcceptAll, onReject, onChangeDecision, theme }) {
  const req = entry.request || {};
  const status = entry.summaryStatus;

  const pending = entry.approvals.filter((a) => a.status === 'pending');
  const decided = entry.approvals.filter(
    (a) => a.status === 'accepted' || a.status === 'rejected',
  );

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);

  const gapTop = TOP_FLOATING_GAP;
  const gapBottom = BOTTOM_FLOATING_GAP;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 3));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const actionBar = (
    <View
      style={[
        styles.detailTopbar,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          paddingHorizontal: 10,
          paddingVertical: 8,
          marginBottom: 12,
        },
      ]}
    >
      <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.75}>
        <Text style={styles.backBtnText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.detailActions}>
        <View
          style={[
            styles.statusBadge,
            status === 'pending' && { backgroundColor: '#FEF3C7' },
            status === 'accepted' && { backgroundColor: '#D1FAE5' },
            status === 'rejected' && { backgroundColor: '#FEE2E2' },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              status === 'pending' && { color: '#92400E' },
              status === 'accepted' && { color: '#065F46' },
              status === 'rejected' && { color: '#991B1B' },
            ]}
          >
            {pendingNotificationService.capitalize(status)}
          </Text>
        </View>

        {status === 'pending' && pending.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => setRejectOpen(true)}
              style={[styles.actionBtn, styles.actionBtnReject]}
              activeOpacity={0.75}
            >
              <Text style={styles.actionBtnRejectText}>❌ Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAcceptOpen(true)}
              style={[styles.actionBtn, styles.actionBtnAccept]}
              activeOpacity={0.75}
            >
              <Text style={styles.actionBtnAcceptText}>✅ Accept all</Text>
            </TouchableOpacity>
          </>
        )}

        {decided.length > 0 && (
          <TouchableOpacity
            onPress={() => setChangeOpen(true)}
            style={[styles.actionBtn, styles.actionBtnChange]}
            activeOpacity={0.75}
          >
            <Text style={styles.actionBtnChangeText}>🔄 Change</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const paperBody = (
    <View style={{ marginBottom: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        <GestureDetector gesture={pinchGesture}>
          <Animated.View
            style={[
              {
                width: 700,
                backgroundColor: '#FFFFFF',
                borderColor: '#E2E8F0',
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                transformOrigin: 'top left',
              },
              animatedStyle,
            ]}
          >
            <Text style={styles.paperMotto}>WE TRUST IN GOD!!!</Text>
            <Text style={styles.paperMotto}>እግዚአብሔር ይባረክ!!!</Text>
            <Text style={styles.paperCompany}>SUPER DOUBLE "T" GENERAL TRADING PLC .</Text>
            <Text style={styles.paperSubtitle}>ITEM REQUISITION FORM</Text>

            <View style={[styles.paperDateRow, { paddingVertical: 6, marginBottom: 8 }]}>
              <Text style={styles.paperDateRowLabel}>
                <Text style={styles.paperDateRowLabelBold}>REQ. NO:- </Text>
                {req.requestCode || `REQ-${entry.requestId}`}
              </Text>
              <Text style={styles.paperDateRowLabel}>
                <Text style={styles.paperDateRowLabelBold}>DATE:- </Text>
                {pendingNotificationService.formatPaperDate(
                  req.requestedAt || req.requested_at || req.requestedDate || req.createdAt
                )}
              </Text>
            </View>

            <View style={styles.paperTable}>
              <View style={[styles.paperTableRow, styles.paperTableHeadRow]}>
                <Text style={[styles.paperTh, styles.cellBorder, { flex: 0.4 }]}>No</Text>
                <Text style={[styles.paperTh, styles.cellBorder, { flex: 2.5, textAlign: 'left', paddingLeft: 6 }]}>Item</Text>
                <Text style={[styles.paperTh, styles.cellBorder, { flex: 0.7 }]}>UOM</Text>
                <Text style={[styles.paperTh, styles.cellBorder, { flex: 0.8 }]}>Qty</Text>
                <Text style={[styles.paperTh, { flex: 1.4 }]}>Remark</Text>
              </View>

              {(req.items || []).map((it, idx) => (
                <View key={idx} style={[styles.paperTableRow, { paddingVertical: 0 }]}>
                  <Text style={[styles.paperTd, styles.cellBorder, { flex: 0.4, paddingVertical: 8 }]}>{idx + 1}</Text>
                  <View style={[styles.cellBorder, { flex: 2.5, paddingLeft: 6, paddingVertical: 8, justifyContent: 'center' }]}>
                    <Text style={styles.paperTdItemName} numberOfLines={2}>
                      {it.item?.name || it.itemName || 'Unknown'}
                    </Text>
                    <Text style={styles.paperTdItemCode}>
                      {it.item?.code || it.itemCode || '—'}
                    </Text>
                  </View>
                  <Text style={[styles.paperTd, styles.cellBorder, { flex: 0.7, paddingVertical: 8 }]}>
                    {it.uom_code || it.item?.uom?.code || '—'}
                  </Text>
                  <Text style={[styles.paperTd, styles.cellBorder, { flex: 0.8, fontWeight: '700', paddingVertical: 8 }]}>
                    {Number(it.quantity || 0).toFixed(2)}
                  </Text>
                  <Text style={[styles.paperTd, { flex: 1.4, paddingVertical: 8 }]} numberOfLines={2}>
                    {it.remark || '—'}
                  </Text>
                </View>
              ))}

              {(req.items || []).length === 0 && (
                <View style={styles.paperTableRow}>
                  <Text style={[styles.paperTd, { flex: 5, fontStyle: 'italic', color: '#7f7f7f', paddingVertical: 12 }]}>
                    No items in this request
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.paperMetaGrid, { gap: 8, marginBottom: 12 }]}>
              <View style={styles.paperMetaCol}>
                <Text style={styles.paperMetaHeader}>Department</Text>
                <Text style={styles.paperMetaValue} numberOfLines={2}>
                  {req.requestedByUser?.Department?.name || '—'}
                </Text>
              </View>
              <View style={styles.paperMetaCol}>
                <Text style={styles.paperMetaHeader}>Requested By</Text>
                <Text style={styles.paperMetaValue} numberOfLines={2}>
                  {req.requestedBy || req.requestedByUser?.fullName || '—'}
                </Text>
                <Text style={styles.paperMetaSub}>Signature ___________</Text>
              </View>
              <View style={styles.paperMetaCol}>
                <Text style={styles.paperMetaHeader}>Approved By</Text>
                <Text style={styles.paperMetaValue} numberOfLines={2}>
                  {entry.approvals.find((a) => a.status === 'accepted')?.respondedByUser?.fullName || ' '}
                </Text>
                <Text style={styles.paperMetaSub}>Signature ___________</Text>
              </View>
            </View>

            {req.remark ? (
              <View style={styles.paperReasonBlock}>
                <Text style={styles.paperReasonLabel}>Reason</Text>
                <View style={styles.paperReasonValueWrap}>
                  <Text style={styles.paperReasonValue}>{req.remark}</Text>
                </View>
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </ScrollView>
    </View>
  );

  const approvalsList = (
    <View
      style={[
        styles.approvalsBlock,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          padding: 12,
          marginTop: 12,
        },
      ]}
    >
      <View style={styles.approvalsHeader}>
        <Text style={styles.approvalsTitle}>APPROVALS</Text>
        <View style={styles.approvalsBadge}>
          <Text style={styles.approvalsBadgeText}>
            {entry.acceptedCount}/{entry.approvals.length}
          </Text>
        </View>
      </View>

      {entry.approvals.map((a) => (
        <View
          key={a.id}
          style={[
            styles.approvalRow,
            a.status === 'pending' && { backgroundColor: '#FFFBEB' },
            a.status === 'accepted' && { backgroundColor: '#F0FDF4' },
            a.status === 'rejected' && { backgroundColor: '#FEF2F2' },
          ]}
        >
          <View style={styles.approvalIconWrap}>
            <Text style={styles.approvalIcon}>
              {a.approval_type === 'department' ? '🏛️' : '👥'}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.approvalName, { color: theme.textColor }]} numberOfLines={1}>
              {a.group?.name || a.department?.name || '—'}
            </Text>
            <Text style={[styles.approvalType, { color: theme.subTextColor }]} numberOfLines={1}>
              {a.approval_type === 'group' ? 'Group approval' : 'Department approval'}
              {a.respondedByUser ? ` · ${a.respondedByUser.fullName || ''}` : ''}
            </Text>
            {a.rejected_reason ? (
              <Text style={styles.approvalReason} numberOfLines={2}>
                "{a.rejected_reason}"
              </Text>
            ) : null}
          </View>
          <Text style={styles.approvalStatusIcon}>
            {a.status === 'pending' ? '⏳' : a.status === 'accepted' ? '✅' : '❌'}
          </Text>
        </View>
      ))}
    </View>
  );

  const modals = (
    <>
      <AcceptModal
        visible={acceptOpen}
        entry={entry}
        onClose={() => setAcceptOpen(false)}
        onConfirm={() => {
          setAcceptOpen(false);
          onAcceptAll(entry);
        }}
        theme={theme}
      />
      <RejectModal
        visible={rejectOpen}
        entry={entry}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          setRejectOpen(false);
          onReject(entry, reason);
        }}
        theme={theme}
      />
      <ChangeDecisionModal
        visible={changeOpen}
        entry={entry}
        onClose={() => setChangeOpen(false)}
        onConfirm={(newStatus, reason) => {
          setChangeOpen(false);
          onChangeDecision(entry, newStatus, reason);
        }}
        theme={theme}
      />
    </>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.darkMode ? '#0F172A' : '#F8FAFC' }}
      contentContainerStyle={{ paddingTop: gapTop, paddingBottom: gapBottom, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {actionBar}
      {paperBody}
      {approvalsList}
      <View style={{ height: 20 }} />
      {modals}
    </ScrollView>
  );
}

// =========================================================================
// ACCEPT MODAL
// =========================================================================
function AcceptModal({ visible, entry, onClose, onConfirm, theme }) {
  if (!entry) return null;
  const req = entry.request || {};
  const pending = entry.approvals.filter((a) => a.status === 'pending');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.darkMode ? '#1E293B' : '#FFFFFF' }]}>
          <View style={[styles.modalHeader, { borderColor: '#ECFDF5' }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#10B981' }]}>
              <Text style={styles.modalIconText}>✅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>Confirm acceptance</Text>
              <Text style={[styles.modalSub, { color: theme.subTextColor }]}>
                You are about to accept all pending approvals for this request
              </Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 16 }}>
            <ModalRow label="Request" value={req.requestCode} theme={theme} mono />
            <ModalRow
              label="Request date"
              value={pendingNotificationService.formatDateTimeFull(
                req.requestedAt || req.requested_at || req.requestedDate || req.createdAt
              )}
              theme={theme}
            />
            <ModalRow label="From" value={pendingNotificationService.getOriginName(req)} theme={theme} />
            <ModalRow label="To" value={req.supplyingStore?.name || '—'} theme={theme} />
            <ModalRow label="Approvals pending" value={String(pending.length)} theme={theme} />

            {req.isTemelash && (
              <>
                <ModalRow
                  label="Temelash from"
                  value={pendingNotificationService.formatTemelashDate(req.temelashFromDate)}
                  theme={theme}
                />
                <ModalRow
                  label="Return by"
                  value={pendingNotificationService.formatTemelashDate(req.temelashToDate)}
                  theme={theme}
                />
                <View style={styles.temelashBanner}>
                  <Text style={styles.temelashBannerText}>
                    🔄 This is a <Text style={{ fontWeight: '900' }}>Temelash</Text> request — items are a temporary loan and must be returned by the date above.
                  </Text>
                </View>
              </>
            )}

            {req.remark ? (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.modalLabel, { color: theme.subTextColor }]}>Remark</Text>
                <Text style={[styles.modalSmallValue, { color: theme.textColor }]}>{req.remark}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnGhost, { borderColor: theme.borderColor }]}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={[styles.modalBtnGhostText, { color: theme.textColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#10B981' }]}
              onPress={onConfirm}
              activeOpacity={0.75}
            >
              <Text style={styles.modalBtnPrimaryText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// =========================================================================
// REJECT MODAL
// =========================================================================
function RejectModal({ visible, entry, onClose, onConfirm, theme }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setReason('');
      setError('');
    }
  }, [visible]);

  if (!entry) return null;
  const req = entry.request || {};

  const submit = () => {
    if (!reason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.darkMode ? '#1E293B' : '#FFFFFF' }]}>
          <View style={[styles.modalHeader, { borderColor: '#FEF2F2' }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.modalIconText}>🚫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>Reject request</Text>
              <Text style={[styles.modalSub, { color: theme.subTextColor }]}>
                Please provide a clear reason
              </Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 16 }}>
            <ModalRow label="Request" value={req.requestCode} theme={theme} mono />
            <ModalRow
              label="Request date"
              value={pendingNotificationService.formatDateTimeFull(
                req.requestedAt || req.requested_at || req.requestedDate || req.createdAt
              )}
              theme={theme}
            />
            <ModalRow label="From" value={pendingNotificationService.getOriginName(req)} theme={theme} />

            <Text style={[styles.modalLabel, { color: theme.textColor, marginTop: 12 }]}>
              Reason <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              value={reason}
              onChangeText={(t) => {
                setReason(t);
                if (error) setError('');
              }}
              placeholder="Explain why this request is being rejected…"
              placeholderTextColor={theme.subTextColor}
              multiline
              numberOfLines={4}
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.darkMode ? '#0F172A' : '#F8FAFC',
                  borderColor: error ? '#EF4444' : theme.borderColor,
                  color: theme.textColor,
                },
              ]}
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnGhost, { borderColor: theme.borderColor }]}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={[styles.modalBtnGhostText, { color: theme.textColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: '#EF4444' },
                !reason.trim() && { opacity: 0.55 },
              ]}
              onPress={submit}
              disabled={!reason.trim()}
              activeOpacity={0.75}
            >
              <Text style={styles.modalBtnPrimaryText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// =========================================================================
// CHANGE DECISION MODAL
// =========================================================================
function ChangeDecisionModal({ visible, entry, onClose, onConfirm, theme }) {
  const [newStatus, setNewStatus] = useState('rejected');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && entry) {
      const decided = entry.approvals.find(
        (a) => a.status === 'accepted' || a.status === 'rejected'
      );
      setNewStatus(decided?.status === 'accepted' ? 'rejected' : 'accepted');
      setReason('');
      setError('');
    }
  }, [visible, entry]);

  if (!entry) return null;
  const req = entry.request || {};

  const submit = () => {
    if (newStatus === 'rejected' && !reason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    onConfirm(newStatus, newStatus === 'rejected' ? reason.trim() : undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.darkMode ? '#1E293B' : '#FFFFFF' }]}>
          <View style={[styles.modalHeader, { borderColor: '#FFF7ED' }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.modalIconText}>🔄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>Change decision</Text>
              <Text style={[styles.modalSub, { color: theme.subTextColor }]}>
                Flip this approval between accepted and rejected
              </Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ padding: 16 }}>
            <ModalRow label="Request" value={req.requestCode} theme={theme} mono />
            <ModalRow
              label="Request date"
              value={pendingNotificationService.formatDateTimeFull(
                req.requestedAt || req.requested_at || req.requestedDate || req.createdAt
              )}
              theme={theme}
            />
            <ModalRow label="From" value={pendingNotificationService.getOriginName(req)} theme={theme} />
            <ModalRow label="To" value={req.supplyingStore?.name || '—'} theme={theme} />

            <Text style={[styles.modalLabel, { color: theme.textColor, marginTop: 12 }]}>
              New decision <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View
              style={[
                styles.segment,
                { backgroundColor: theme.cardBg, borderColor: theme.borderColor, marginBottom: 8 },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setNewStatus('accepted');
                  setError('');
                }}
                style={[styles.segBtn, newStatus === 'accepted' && { backgroundColor: '#059669' }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.segText, { color: newStatus === 'accepted' ? '#fff' : theme.subTextColor }]}>
                  ✅ Accept
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewStatus('rejected')}
                style={[styles.segBtn, newStatus === 'rejected' && { backgroundColor: '#DC2626' }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.segText, { color: newStatus === 'rejected' ? '#fff' : theme.subTextColor }]}>
                  ❌ Reject
                </Text>
              </TouchableOpacity>
            </View>

            {newStatus === 'rejected' && (
              <>
                <Text style={[styles.modalLabel, { color: theme.textColor, marginTop: 4 }]}>
                  Reason <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={(t) => {
                    setReason(t);
                    if (error) setError('');
                  }}
                  placeholder="Explain why the decision is changing to rejected…"
                  placeholderTextColor={theme.subTextColor}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.darkMode ? '#0F172A' : '#F8FAFC',
                      borderColor: error ? '#EF4444' : theme.borderColor,
                      color: theme.textColor,
                    },
                  ]}
                />
                {error ? <Text style={styles.modalError}>{error}</Text> : null}
              </>
            )}

            <View style={[styles.temelashBanner, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', marginTop: 12 }]}>
              <Text style={[styles.temelashBannerText, { color: '#9A3412' }]}>
                ⚠️ This action flips the current decision. Once changed, the parent request stays{' '}
                <Text style={{ fontWeight: '900' }}>pending</Text> and there is no way to revert back to “pending”.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnGhost, { borderColor: theme.borderColor }]}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={[styles.modalBtnGhostText, { color: theme.textColor }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtn,
                { backgroundColor: '#F59E0B' },
                newStatus === 'rejected' && !reason.trim() && { opacity: 0.55 },
              ]}
              onPress={submit}
              disabled={newStatus === 'rejected' && !reason.trim()}
              activeOpacity={0.75}
            >
              <Text style={styles.modalBtnPrimaryText}>Confirm change</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// =========================================================================
// SMALL COMPONENTS
// =========================================================================
function ModalRow({ label, value, theme, mono }) {
  return (
    <View style={styles.modalRow}>
      <Text style={[styles.modalLabel, { color: theme.subTextColor }]}>{label}</Text>
      <Text
        style={[
          styles.modalValue,
          { color: theme.textColor },
          mono && {
            fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
            color: '#7C3AED',
          },
        ]}
        numberOfLines={2}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

// =========================================================================
// STYLES
// =========================================================================
const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },

  topbar: { marginBottom: 16, marginTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  titleIcon: { fontSize: 18 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { marginLeft: 48, marginTop: 6, fontSize: 13, fontWeight: '500' },
  subtitleStrong: { color: '#6D28D9', fontWeight: '800' },

  segment: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, gap: 2, marginBottom: 14 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 7 },
  segText: { fontSize: 12, fontWeight: '700' },
  segCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, minWidth: 18, alignItems: 'center' },
  segCountText: { fontSize: 10, fontWeight: '800' },

  searchbar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 42, marginBottom: 16 },
  searchIcon: { fontSize: 14, color: '#94A3B8' },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500' },
  searchClear: { fontSize: 14, color: '#94A3B8', padding: 4 },

  dateDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 6 },
  dateLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: '#F1F5F9' },
  dividerCountText: { fontSize: 10, fontWeight: '700', color: '#64748B' },

  requestRow: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  stripe: { width: 4, backgroundColor: '#CBD5E1' },
  expandArrow: { width: 26, alignItems: 'center', justifyContent: 'center' },
  expandArrowText: { fontSize: 12, color: '#3B82F6', fontWeight: '900' },
  requestBody: { flex: 1, paddingVertical: 10, paddingRight: 12, gap: 4 },
  codeTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  codeChip: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, flexShrink: 0 },
  codeChipText: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 10.5, fontWeight: '700', color: '#0F172A', letterSpacing: 0.3 },
  rowTime: { fontSize: 10.5, fontWeight: '600' },
  rowItems: { fontSize: 12, fontWeight: '600' },
  fromToRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fromToText: { fontSize: 12, fontWeight: '600', flex: 1 },
  fromToArrow: { fontSize: 11, color: '#94A3B8' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 20 },
  statusBadgeText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.3, textTransform: 'capitalize' },
  temelashBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, backgroundColor: '#FFEDD5', borderWidth: 1, borderColor: '#FED7AA' },
  temelashBadgeText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', color: '#9A3412' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  dotDept: { width: 7, height: 7, borderRadius: 1, transform: [{ rotate: '45deg' }] },

  emptyCard: { padding: 32, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 6 },
  emptyIcon: { fontSize: 28, opacity: 0.5, marginBottom: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptyText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  detailTopbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, gap: 8, flexWrap: 'wrap' },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  backBtnText: { fontSize: 12, fontWeight: '800', color: '#334155' },
  detailActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnAccept: { backgroundColor: '#10B981' },
  actionBtnAcceptText: { color: '#FFF', fontSize: 11.5, fontWeight: '800' },
  actionBtnReject: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnRejectText: { color: '#991B1B', fontSize: 11.5, fontWeight: '800' },
  actionBtnChange: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  actionBtnChangeText: { color: '#9A3412', fontSize: 11.5, fontWeight: '800' },

  paper: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  paperMotto: { textAlign: 'center', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontSize: 14, fontWeight: '900', letterSpacing: 0.8, marginBottom: 2 },
  paperCompany: { textAlign: 'center', fontSize: 13, fontWeight: '800', marginTop: 6, marginBottom: 4 },
  paperSubtitle: { textAlign: 'center', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', paddingVertical: 4, marginBottom: 8 },
  paperDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#CBD5E1', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingVertical: 6, marginBottom: 10 },
  paperDateRowLabel: { fontSize: 11, color: '#0F172A' },
  paperDateRowLabelBold: { fontWeight: '800' },
  paperTable: { borderWidth: 1, borderColor: '#7F7F7F', marginBottom: 12 },
  paperTableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#7F7F7F', alignItems: 'stretch' },
  paperTableHeadRow: { backgroundColor: '#C8C8C8' },
  paperTh: { fontSize: 10, fontWeight: '800', color: '#0F172A', textAlign: 'center', paddingVertical: 6 },
  paperTd: { fontSize: 10.5, color: '#0F172A', textAlign: 'center' },
  paperTdItemName: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  paperTdItemCode: { fontSize: 9, color: '#64748B', marginTop: 1 },
  cellBorder: { borderRightWidth: 1, borderRightColor: '#7F7F7F' },
  paperMetaGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  paperMetaCol: { flex: 1 },
  paperMetaHeader: { backgroundColor: '#D9D9D9', textAlign: 'center', fontWeight: '800', fontSize: 10.5, paddingVertical: 4 },
  paperMetaValue: { fontSize: 11.5, fontWeight: '700', textAlign: 'center', paddingTop: 6, color: '#0F172A' },
  paperMetaSub: { fontSize: 9.5, color: '#64748B', textAlign: 'center', marginTop: 2 },
  paperReasonBlock: { gap: 4 },
  paperReasonLabel: { backgroundColor: '#D9D9D9', textAlign: 'center', fontWeight: '800', fontSize: 10.5, paddingVertical: 4 },
  paperReasonValueWrap: { borderWidth: 1, borderColor: '#7F7F7F', padding: 8, minHeight: 40 },
  paperReasonValue: { fontSize: 11, color: '#0F172A', lineHeight: 16 },

  approvalsBlock: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  approvalsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  approvalsTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: '#64748B', textTransform: 'uppercase' },
  approvalsBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#F1F5F9' },
  approvalsBadgeText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  approvalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, marginBottom: 6 },
  approvalIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  approvalIcon: { fontSize: 13 },
  approvalName: { fontSize: 12, fontWeight: '800' },
  approvalType: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  approvalReason: { fontSize: 10.5, fontStyle: 'italic', color: '#991B1B', marginTop: 3 },
  approvalStatusIcon: { fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 480, maxHeight: '90%', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 32, elevation: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalIconText: { fontSize: 20 },
  modalTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  modalSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalLabel: { fontSize: 12, fontWeight: '600' },
  modalValue: { fontSize: 12.5, fontWeight: '700', flex: 1, textAlign: 'right' },
  modalSmallValue: { fontSize: 12.5, fontWeight: '500', lineHeight: 18, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 6 },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, minHeight: 90, textAlignVertical: 'top', marginTop: 6 },
  modalError: { fontSize: 11, color: '#EF4444', fontWeight: '600', marginTop: 4 },
  temelashBanner: { padding: 10, borderRadius: 8, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA', marginTop: 10 },
  temelashBannerText: { fontSize: 11.5, fontWeight: '600', lineHeight: 16, color: '#9A3412' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  modalBtnGhost: { backgroundColor: 'transparent', borderWidth: 1 },
  modalBtnGhostText: { fontSize: 13, fontWeight: '700' },
  modalBtnPrimaryText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});