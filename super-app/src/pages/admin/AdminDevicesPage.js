// super-app/src/pages/admin/AdminDevicesPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';

import {
  listDevices,
  approveDevice,
  blockDevice,
  unblockDevice,
  deleteDevice,
  getDeviceStats,
} from '../../stores/deviceService';

// ================================================================
// FILTERS
// ================================================================
const FILTERS = [
  { key: 'pending',  label: 'Pending',  tint: '#F59E0B' },
  { key: 'approved', label: 'Approved', tint: '#10B981' },
  { key: 'blocked',  label: 'Blocked',  tint: '#EF4444' },
  { key: 'all',      label: 'All',      tint: '#8B5CF6' },
];

const PAGE_SIZE = 20;

// ================================================================
// HELPERS
// ================================================================
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusCfg = (status, darkMode) => {
  switch (status) {
    case 'approved':
      return { label: '✓ APPROVED', bg: darkMode ? '#064E3B' : '#ECFDF5', color: darkMode ? '#6EE7B7' : '#047857' };
    case 'blocked':
      return { label: '✕ BLOCKED',  bg: darkMode ? '#7F1D1D' : '#FEE2E2', color: darkMode ? '#FCA5A5' : '#991B1B' };
    case 'pending':
    default:
      return { label: '⏳ PENDING',  bg: darkMode ? '#422006' : '#FEF3C7', color: darkMode ? '#FCD34D' : '#92400E' };
  }
};

// ================================================================
// COMPONENT
// ================================================================
export default function AdminDevicesPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  onBack,
}) {
  // ---- state ----
  const [filter, setFilter]         = useState('pending');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [items, setItems]           = useState([]);
  const [stats, setStats]           = useState({ total: 0, pending: 0, approved: 0, blocked: 0 });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // blocking modal
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  // ---- loaders ----
  const load = useCallback(async (isRefresh = false, nextPage = 1) => {
    if (isRefresh) setRefreshing(true);
    else if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await listDevices({
        status: filter === 'all' ? undefined : filter,
        search: search.trim() || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (res.success) {
        if (nextPage === 1) setItems(res.data);
        else setItems((prev) => [...prev, ...res.data]);
        setPagination(res.pagination || { total: res.data.length, totalPages: 1 });
        setPage(nextPage);
      } else {
        Alert.alert('Error', res.error || 'Failed to load devices');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, search]);

  const loadStats = useCallback(async () => {
    const res = await getDeviceStats();
    if (res.success) setStats(res.data);
  }, []);

  // ---- effects ----
  useEffect(() => {
    load(false, 1);
    loadStats();
  }, [filter]);   // refetch when filter changes

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      load(false, 1);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ---- actions ----
  const handleApprove = async (device) => {
    const res = await approveDevice(device.id);
    if (res.success) {
      setItems((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, status: 'approved' } : d))
      );
      loadStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to approve');
    }
  };

  const openBlockModal = (device) => {
    setBlockTarget(device);
    setBlockReason('');
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    setBlockSubmitting(true);
    const res = await blockDevice(blockTarget.id, blockReason.trim() || undefined);
    setBlockSubmitting(false);

    if (res.success) {
      setItems((prev) =>
        prev.map((d) =>
          d.id === blockTarget.id
            ? { ...d, status: 'blocked', blockedReason: blockReason.trim() }
            : d
        )
      );
      setBlockTarget(null);
      setBlockReason('');
      loadStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to block');
    }
  };

  const handleUnblock = async (device) => {
    const res = await unblockDevice(device.id);
    if (res.success) {
      setItems((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, status: 'approved', blockedReason: null } : d))
      );
      loadStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to unblock');
    }
  };

  const handleDelete = (device) => {
    Alert.alert(
      'Delete device?',
      `${device.user?.fullName || device.user?.username || 'User'} will need to re-register this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteDevice(device.id);
            if (res.success) {
              setItems((prev) => prev.filter((d) => d.id !== device.id));
              loadStats();
            } else {
              Alert.alert('Error', res.error || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  // ---- derived ----
  const visibleItems = items;

  const counts = useMemo(() => ({
    pending:  stats.pending,
    approved: stats.approved,
    blocked:  stats.blocked,
    all:      stats.total,
  }), [stats]);

  const hasMore = pagination.totalPages > page;

  // ---- renderers ----
  const renderDevice = ({ item: d }) => {
    const cfg = statusCfg(d.status, darkMode);

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
              {d.user?.fullName || d.user?.username || `User #${d.userId}`}
            </Text>
            <Text style={[styles.username, { color: subTextColor }]} numberOfLines={1}>
              @{d.user?.username || '—'}{d.user?.role ? ` · ${d.user.role}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Device meta */}
        <View style={[styles.metaBlock, { borderTopColor: darkMode ? '#1E293B' : '#F1F5F9' }]}>
          <Text style={[styles.deviceName, { color: textColor }]} numberOfLines={1}>
            {[d.brand, d.model].filter(Boolean).join(' ') || 'Unknown device'}
          </Text>
          <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
            {[d.platform, d.osVersion].filter(Boolean).join(' · ')}
            {d.isEmulator ? ' · EMULATOR' : ''}
          </Text>
          <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
            ID: {d.deviceId?.slice(0, 8)}…
          </Text>
          <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
            Requested: {fmtDate(d.requestedAt)}
          </Text>
          {d.status === 'approved' && d.approvedAt && (
            <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
              Approved: {fmtDate(d.approvedAt)}
            </Text>
          )}
          {d.status === 'blocked' && (
            <Text style={[styles.deviceMeta, { color: '#EF4444' }]} numberOfLines={2}>
              Blocked{d.blockedReason ? `: ${d.blockedReason}` : ''}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          {d.status === 'pending' && (
            <>
              <TouchableOpacity
                onPress={() => handleApprove(d)}
                activeOpacity={0.85}
                style={[styles.actionBtn, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
              >
                <Text style={styles.actionBtnTextLight}>✓ Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openBlockModal(d)}
                activeOpacity={0.85}
                style={[styles.actionBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
              >
                <Text style={styles.actionBtnTextLight}>✕ Block</Text>
              </TouchableOpacity>
            </>
          )}

          {d.status === 'approved' && (
            <TouchableOpacity
              onPress={() => openBlockModal(d)}
              activeOpacity={0.85}
              style={[styles.actionBtn, { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2', borderColor: '#EF4444' }]}
            >
              <Text style={[styles.actionBtnText, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>✕ Block</Text>
            </TouchableOpacity>
          )}

          {d.status === 'blocked' && (
            <TouchableOpacity
              onPress={() => handleUnblock(d)}
              activeOpacity={0.85}
              style={[styles.actionBtn, { backgroundColor: darkMode ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }]}
            >
              <Text style={[styles.actionBtnText, { color: darkMode ? '#6EE7B7' : '#047857' }]}>↺ Unblock</Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={() => handleDelete(d)}
            activeOpacity={0.85}
            style={[styles.iconBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }]}
          >
            <Text style={[styles.iconBtnText, { color: subTextColor }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ---- render ----
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Devices</Text>
          <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
            {counts.pending} pending · {counts.approved} approved · {counts.blocked} blocked
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by username or name…"
          placeholderTextColor={subTextColor}
          style={[styles.searchInput, { color: textColor }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.85}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? f.tint : (darkMode ? '#1E293B' : '#F1F5F9'),
                  borderColor: active ? f.tint : borderColor,
                },
              ]}
            >
              <Text style={[styles.filterPillText, { color: active ? '#FFFFFF' : textColor }]} numberOfLines={1}>
                {f.label} ({counts[f.key]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={visibleItems}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (hasMore && !loadingMore) load(false, page + 1);
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              await load(true, 1);
              await loadStats();
            }}
            tintColor={subTextColor}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#8B5CF6" />
            </View>
          ) : hasMore ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Scroll for more
            </Text>
          ) : visibleItems.length > PAGE_SIZE ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              End of list · {pagination.total} device{pagination.total === 1 ? '' : 's'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color="#8B5CF6" />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>
                {filter === 'pending' ? '✅' : filter === 'blocked' ? '🛡️' : '📱'}
              </Text>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                {filter === 'pending'  ? 'No pending devices'
                 : filter === 'approved' ? 'No approved devices'
                 : filter === 'blocked'  ? 'No blocked devices'
                 : 'No devices registered'}
              </Text>
              <Text style={[styles.emptyBody, { color: subTextColor }]}>
                {search
                  ? `No devices match "${search}".`
                  : filter === 'pending'
                  ? 'New login attempts will appear here.'
                  : 'Try a different filter.'}
              </Text>
            </View>
          )
        }
      />

      {/* Block modal */}
      <Modal
        visible={!!blockTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setBlockTarget(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centerBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={() => !blockSubmitting && setBlockTarget(null)}
          />
          <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Block this device?</Text>
            <Text style={[styles.modalSub, { color: subTextColor }]}>
              {blockTarget?.user?.fullName || blockTarget?.user?.username || 'This user'}{' '}
              will be signed out and unable to log in from this device.
            </Text>

            <Text style={[styles.fieldLabel, { color: subTextColor }]}>
              REASON (OPTIONAL)
            </Text>
            <TextInput
              value={blockReason}
              onChangeText={setBlockReason}
              placeholder="e.g. Reported lost or stolen"
              placeholderTextColor={subTextColor}
              editable={!blockSubmitting}
              multiline
              numberOfLines={3}
              style={[styles.input, {
                color: textColor,
                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                borderColor,
              }]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setBlockTarget(null)}
                disabled={blockSubmitting}
                activeOpacity={0.85}
                style={[styles.modalBtn, {
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                  borderColor,
                }]}
              >
                <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBlock}
                disabled={blockSubmitting}
                activeOpacity={0.85}
                style={[styles.modalBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
              >
                {blockSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Block device</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, fontWeight: '300', marginTop: -6 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, height: 44, gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },

  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 6, marginBottom: 10,
  },
  filterPill: {
    paddingVertical: 7, paddingHorizontal: 10,
    borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  filterPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    borderRadius: 14, borderWidth: 1, marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 14, gap: 10,
  },
  userName: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.2 },
  username: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },

  metaBlock: {
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4,
    borderTopWidth: 1,
  },
  deviceName: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  deviceMeta: { fontSize: 11.5, fontWeight: '500', lineHeight: 17 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8, gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },
  actionBtnTextLight: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16 },

  footerLoader: { paddingVertical: 18, alignItems: 'center' },
  footerText: {
    paddingVertical: 16, textAlign: 'center',
    fontSize: 11.5, fontWeight: '600',
  },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },

  centerBackdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 24,
  },
  centerModal: {
    width: '100%', maxWidth: 460,
    borderRadius: 18, borderWidth: 1, padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3, marginBottom: 8 },
  fieldLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontWeight: '500',
    minHeight: 70, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  modalBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
});