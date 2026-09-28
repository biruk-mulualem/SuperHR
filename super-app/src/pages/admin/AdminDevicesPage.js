// super-app/src/pages/admin/AdminDevicesPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  listDevices,
  approveDevice,
  blockDevice,
  unblockDevice,
  deleteDevice,
  getDeviceStats,
  listWebSessions,
  getWebSessionStats,
  terminateWebSession,
  allowWebSession,
  terminateAllWebSessionsForUser,
  deactivateUserAndSessions,
  deleteWebSession,
} from '../../stores/deviceService';

// ================================================================
// CONSTANTS
// ================================================================
const DEVICE_FILTERS = [
  { key: 'pending',  label: 'Pending',  tint: '#F59E0B' },
  { key: 'approved', label: 'Approved', tint: '#10B981' },
  { key: 'blocked',  label: 'Blocked',  tint: '#EF4444' },
  { key: 'all',      label: 'All',      tint: '#8B5CF6' },
];

const WEB_FILTERS = [
  { key: 'all',        label: 'All',        tint: '#8B5CF6' },
  { key: 'active',     label: 'Active',     tint: '#10B981' },
  { key: 'terminated', label: 'Terminated', tint: '#EF4444' },
];

const PAGE_SIZE = 20;

// ================================================================
// HELPERS
// ================================================================
const fmtRelative = (ts) => {
  if (!ts) return '—';
  const t = new Date(ts).getTime();
  if (isNaN(t)) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

const deviceStatusCfg = (status, darkMode) => {
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

const webStatusCfg = (status, darkMode) => {
  switch (status) {
    case 'active':
      return { label: '● ACTIVE',     bg: darkMode ? '#064E3B' : '#ECFDF5', color: darkMode ? '#6EE7B7' : '#047857' };
    case 'terminated':
      return { label: '✕ TERMINATED', bg: darkMode ? '#7F1D1D' : '#FEE2E2', color: darkMode ? '#FCA5A5' : '#991B1B' };
    case 'expired':
    default:
      return { label: '— EXPIRED',    bg: darkMode ? '#1E293B' : '#F1F5F9', color: darkMode ? '#94A3B8' : '#64748B' };
  }
};

const browserIcon = (browser) => {
  if (!browser) return '🌐';
  const b = browser.toLowerCase();
  if (b.includes('chrome'))  return '🟢';
  if (b.includes('firefox')) return '🦊';
  if (b.includes('safari'))  return '🧭';
  if (b.includes('edge'))    return '🔵';
  if (b.includes('opera'))   return '🅾️';
  return '🌐';
};

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function AdminDevicesPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [tab, setTab] = useState('phone');   // 'phone' | 'web'

  // ─── devices ───
  const [deviceFilter, setDeviceFilter]   = useState('pending');
  const [deviceSearch, setDeviceSearch]   = useState('');
  const [devicePage, setDevicePage]       = useState(1);
  const [deviceItems, setDeviceItems]     = useState([]);
  const [devicePagination, setDevicePagination] = useState({ total: 0, totalPages: 1 });
  const [deviceStats, setDeviceStats]     = useState({ total: 0, pending: 0, approved: 0, blocked: 0 });
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [deviceRefreshing, setDeviceRefreshing] = useState(false);
  const [deviceLoadingMore, setDeviceLoadingMore] = useState(false);

  const [deviceBlockTarget, setDeviceBlockTarget] = useState(null);
  const [deviceBlockReason, setDeviceBlockReason] = useState('');
  const [deviceBlockSubmitting, setDeviceBlockSubmitting] = useState(false);

  // ─── web sessions ───
  const [webFilter, setWebFilter]     = useState('all');
  const [webSearch, setWebSearch]     = useState('');
  const [webPage, setWebPage]         = useState(1);
  const [webItems, setWebItems]       = useState([]);
  const [webPagination, setWebPagination] = useState({ total: 0, totalPages: 1 });
  const [webStats, setWebStats]       = useState({ total: 0, active: 0, activeNow: 0, activeToday: 0, terminated: 0 });
  const [webLoading, setWebLoading]   = useState(true);
  const [webRefreshing, setWebRefreshing] = useState(false);
  const [webLoadingMore, setWebLoadingMore] = useState(false);

  const [webTerminateTarget, setWebTerminateTarget] = useState(null);
  const [webTerminateReason, setWebTerminateReason] = useState('');
  const [webDeactivateTarget, setWebDeactivateTarget] = useState(null);
  const [webDeactivateReason, setWebDeactivateReason] = useState('');
  const [webSubmitting, setWebSubmitting] = useState(false);

  // swipe refs — keyed by "dev-<id>" / "web-<id>" to avoid collisions
  const swipeableRefs = useRef(new Map());
  const openSwipeIdRef = useRef(null);

  const closeAllSwipes = useCallback((exceptKey = null) => {
    swipeableRefs.current.forEach((ref, key) => {
      if (String(key) !== String(exceptKey)) {
        try { ref?.close?.(); } catch (e) {}
      }
    });
    openSwipeIdRef.current = exceptKey;
  }, []);

  // ================================================================
  // LOADERS
  // ================================================================
  const loadDevices = useCallback(async (isRefresh = false, nextPage = 1) => {
    if (isRefresh) setDeviceRefreshing(true);
    else if (nextPage === 1) setDeviceLoading(true);
    else setDeviceLoadingMore(true);

    try {
      const res = await listDevices({
        status: deviceFilter === 'all' ? undefined : deviceFilter,
        search: deviceSearch.trim() || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      if (res.success) {
        if (nextPage === 1) setDeviceItems(res.data);
        else setDeviceItems((prev) => [...prev, ...res.data]);
        setDevicePagination(res.pagination || { total: res.data.length, totalPages: 1 });
        setDevicePage(nextPage);
      } else {
        Alert.alert('Error', res.error || 'Failed to load devices');
      }
    } finally {
      setDeviceLoading(false);
      setDeviceRefreshing(false);
      setDeviceLoadingMore(false);
    }
  }, [deviceFilter, deviceSearch]);

  const loadDeviceStats = useCallback(async () => {
    const res = await getDeviceStats();
    if (res.success) setDeviceStats(res.data);
  }, []);

  const loadWebSessions = useCallback(async (isRefresh = false, nextPage = 1) => {
    if (isRefresh) setWebRefreshing(true);
    else if (nextPage === 1) setWebLoading(true);
    else setWebLoadingMore(true);

    try {
      const res = await listWebSessions({
        status: webFilter === 'all' ? undefined : webFilter,
        search: webSearch.trim() || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
        sortBy: 'lastSeenAt',
        sortOrder: 'DESC',
      });
      if (res.success) {
        if (nextPage === 1) setWebItems(res.data);
        else setWebItems((prev) => [...prev, ...res.data]);
        setWebPagination(res.pagination || { total: res.data.length, totalPages: 1 });
        setWebPage(nextPage);
      } else {
        Alert.alert('Error', res.error || 'Failed to load sessions');
      }
    } finally {
      setWebLoading(false);
      setWebRefreshing(false);
      setWebLoadingMore(false);
    }
  }, [webFilter, webSearch]);

  const loadWebStats = useCallback(async () => {
    const res = await getWebSessionStats();
    if (res.success) setWebStats(res.data);
  }, []);

  // ================================================================
  // EFFECTS
  // ================================================================
  useEffect(() => {
    if (tab !== 'phone') return;
    loadDevices(false, 1);
    loadDeviceStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceFilter, tab]);

  useEffect(() => {
    if (tab !== 'phone') return;
    const t = setTimeout(() => loadDevices(false, 1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceSearch, tab]);

  useEffect(() => {
    if (tab !== 'web') return;
    loadWebSessions(false, 1);
    loadWebStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webFilter, tab]);

  useEffect(() => {
    if (tab !== 'web') return;
    const t = setTimeout(() => loadWebSessions(false, 1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webSearch, tab]);

  // ================================================================
  // DEVICE ACTIONS
  // ================================================================
  const handleApproveDevice = async (device) => {
    const ref = swipeableRefs.current.get(`dev-${device.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    const res = await approveDevice(device.id);
    if (res.success) {
      setDeviceItems((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, status: 'approved' } : d))
      );
      loadDeviceStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to approve');
    }
  };

  const openDeviceBlockModal = (device) => {
    const ref = swipeableRefs.current.get(`dev-${device.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    setDeviceBlockTarget(device);
    setDeviceBlockReason('');
  };

  const handleBlockDevice = async () => {
    if (!deviceBlockTarget) return;
    setDeviceBlockSubmitting(true);
    const res = await blockDevice(deviceBlockTarget.id, deviceBlockReason.trim() || undefined);
    setDeviceBlockSubmitting(false);
    if (res.success) {
      setDeviceItems((prev) =>
        prev.map((d) =>
          d.id === deviceBlockTarget.id
            ? { ...d, status: 'blocked', blockedReason: deviceBlockReason.trim() }
            : d
        )
      );
      setDeviceBlockTarget(null);
      setDeviceBlockReason('');
      loadDeviceStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to block');
    }
  };

  const handleUnblockDevice = async (device) => {
    const ref = swipeableRefs.current.get(`dev-${device.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    const res = await unblockDevice(device.id);
    if (res.success) {
      setDeviceItems((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, status: 'approved', blockedReason: null } : d))
      );
      loadDeviceStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to unblock');
    }
  };

  const handleDeleteDevice = (device) => {
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
              setDeviceItems((prev) => prev.filter((d) => d.id !== device.id));
              loadDeviceStats();
            } else {
              Alert.alert('Error', res.error || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  // ================================================================
  // WEB ACTIONS
  // ================================================================
  const handleAllowWebSession = async (session) => {
    const ref = swipeableRefs.current.get(`web-${session.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    const res = await allowWebSession(session.id);
    if (res.success) {
      await loadWebSessions(false, 1);
      loadWebStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to allow');
    }
  };

  const handleDeleteWebSession = (session) => {
    const ref = swipeableRefs.current.get(`web-${session.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    const name = session.user?.fullName || session.user?.username || 'this user';
    Alert.alert(
      'Delete this session row?',
      `Removes the row from the audit trail for ${name}. Does NOT sign the browser out.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteWebSession(session.id);
            if (res.success) {
              setWebItems((prev) => prev.filter((s) => s.id !== session.id));
              loadWebStats();
            } else {
              Alert.alert('Error', res.error || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const handleTerminateAllForUser = (session) => {
    const ref = swipeableRefs.current.get(`web-${session.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    if (!session.user?.userId) return;
    const name = session.user.fullName || session.user.username;
    setTimeout(() => {
      Alert.alert(
        'Terminate all sessions?',
        `Every active browser session for ${name} will be signed out. They can still log in again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Terminate all',
            style: 'destructive',
            onPress: async () => {
              const res = await terminateAllWebSessionsForUser(
                session.user.userId,
                'All sessions terminated by admin'
              );
              if (res.success) {
                await loadWebSessions(false, 1);
                loadWebStats();
              } else {
                Alert.alert('Error', res.error || 'Failed to terminate all');
              }
            },
          },
        ]
      );
    }, 150);
  };

  const openWebTerminateModal = (session) => {
    const ref = swipeableRefs.current.get(`web-${session.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    setWebTerminateTarget(session);
    setWebTerminateReason('');
  };

  const openWebDeactivateModal = (session) => {
    const ref = swipeableRefs.current.get(`web-${session.id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;

    setWebDeactivateTarget(session);
    setWebDeactivateReason('');
  };

  const submitWebTerminate = async () => {
    if (!webTerminateTarget) return;
    setWebSubmitting(true);
    const res = await terminateWebSession(
      webTerminateTarget.id,
      webTerminateReason.trim() || undefined
    );
    setWebSubmitting(false);
    if (res.success) {
      setWebTerminateTarget(null);
      setWebTerminateReason('');
      await loadWebSessions(false, 1);
      loadWebStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to terminate');
    }
  };

  const submitWebDeactivate = async () => {
    if (!webDeactivateTarget?.user?.userId) return;
    setWebSubmitting(true);
    const res = await deactivateUserAndSessions(
      webDeactivateTarget.user.userId,
      webDeactivateReason.trim() || undefined
    );
    setWebSubmitting(false);
    if (res.success) {
      setWebDeactivateTarget(null);
      setWebDeactivateReason('');
      await loadWebSessions(false, 1);
      loadWebStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to deactivate');
    }
  };

  // ================================================================
  // DERIVED
  // ================================================================
  const deviceCounts = useMemo(() => ({
    pending:  deviceStats.pending,
    approved: deviceStats.approved,
    blocked:  deviceStats.blocked,
    all:      deviceStats.total,
  }), [deviceStats]);

  const webCounts = useMemo(() => ({
    all:        webStats.total,
    active:     webStats.active,
    terminated: webStats.terminated,
  }), [webStats]);

  const deviceHasMore = devicePagination.totalPages > devicePage;
  const webHasMore = webPagination.totalPages > webPage;

  // ================================================================
  // DEVICE CARD RENDER (with swipe actions)
  // ================================================================
  const renderDevice = ({ item: d }) => {
    const cfg = deviceStatusCfg(d.status, darkMode);
    const name = d.user?.fullName || d.user?.username || `User #${d.userId}`;
    const isPending = d.status === 'pending';
    const isApproved = d.status === 'approved';
    const isBlocked = d.status === 'blocked';

    const refKey = `dev-${d.id}`;
    const btnWidth = 78;
    const actionCount = isPending ? 2 : 1;
    const totalWidth = btnWidth * actionCount;

    const renderRightActions = (progress, dragX) => {
      const translateX = dragX.interpolate({
        inputRange: [-totalWidth, 0],
        outputRange: [0, totalWidth],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          style={[styles.swipeActionsWrap, { transform: [{ translateX }] }]}
        >
          {isPending && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleApproveDevice(d)}
              style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#10B981' }]}
            >
              <Text style={styles.swipeBtnIcon}>✓</Text>
              <Text style={styles.swipeBtnLabel}>Approve</Text>
            </TouchableOpacity>
          )}

          {(isPending || isApproved) && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openDeviceBlockModal(d)}
              style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#EF4444' }]}
            >
              <Text style={styles.swipeBtnIcon}>✕</Text>
              <Text style={styles.swipeBtnLabel}>Block</Text>
            </TouchableOpacity>
          )}

          {isBlocked && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleUnblockDevice(d)}
              style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#10B981' }]}
            >
              <Text style={styles.swipeBtnIcon}>↺</Text>
              <Text style={styles.swipeBtnLabel}>Unblock</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    };

    const cardContent = (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginBottom: 0 }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.username, { color: subTextColor }]} numberOfLines={1}>
              @{d.user?.username || '—'}{d.user?.role ? ` · ${d.user.role}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={[styles.metaBlock, { borderTopColor: darkMode ? '#1E293B' : '#F1F5F9' }]}>
          <Text style={[styles.deviceName, { color: textColor }]} numberOfLines={1}>
            {[d.brand, d.model].filter(Boolean).join(' ') || 'Unknown device'}
          </Text>
          <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
            {[d.platform, d.osVersion].filter(Boolean).join(' · ')}
            {d.isEmulator ? ' · EMULATOR' : ''}
          </Text>
          <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
            Requested: {fmtDate(d.requestedAt)}
          </Text>
          {d.status === 'blocked' && d.blockedReason ? (
            <Text style={[styles.deviceMeta, { color: '#EF4444' }]} numberOfLines={2}>
              Blocked: {d.blockedReason}
            </Text>
          ) : null}
        </View>

        <View style={styles.hintRow}>
          <Text style={[styles.hintText, { color: subTextColor }]}>
            ← Swipe for actions
          </Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handleDeleteDevice(d)}
            hitSlop={8}
            style={[styles.trashBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }]}
          >
            <Text style={{ fontSize: 13 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <View style={styles.swipeWrap}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(refKey, ref);
            else swipeableRefs.current.delete(refKey);
          }}
          renderRightActions={renderRightActions}
          rightThreshold={40}
          overshootRight={false}
          friction={2}
          onSwipeableWillOpen={() => closeAllSwipes(refKey)}
          onSwipeableWillClose={() => {
            if (String(openSwipeIdRef.current) === String(refKey)) {
              openSwipeIdRef.current = null;
            }
          }}
        >
          {cardContent}
        </Swipeable>
      </View>
    );
  };

  // ================================================================
  // WEB CARD RENDER (with swipe actions)
  // ================================================================
  const renderWebSession = ({ item: s }) => {
    const cfg = webStatusCfg(s.status, darkMode);
    const name = s.user?.fullName || s.user?.username || `User #${s.userId}`;
    const isActive = s.status === 'active';
    const isTerminated = s.status === 'terminated';

    const refKey = `web-${s.id}`;
    const btnWidth = 78;
    const actionCount = (isActive || isTerminated) ? 3 : 2;
    const totalWidth = btnWidth * actionCount;

    const renderRightActions = (progress, dragX) => {
      const translateX = dragX.interpolate({
        inputRange: [-totalWidth, 0],
        outputRange: [0, totalWidth],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          style={[styles.swipeActionsWrap, { transform: [{ translateX }] }]}
        >
          {isActive && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openWebTerminateModal(s)}
              style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#EF4444' }]}
            >
              <Text style={styles.swipeBtnIcon}>⏻</Text>
              <Text style={styles.swipeBtnLabel}>Terminate</Text>
            </TouchableOpacity>
          )}

          {isTerminated && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleAllowWebSession(s)}
              style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#10B981' }]}
            >
              <Text style={styles.swipeBtnIcon}>↺</Text>
              <Text style={styles.swipeBtnLabel}>Allow</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleTerminateAllForUser(s)}
            style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#F59E0B' }]}
          >
            <Text style={styles.swipeBtnIcon}>⏻⏻</Text>
            <Text style={styles.swipeBtnLabel}>Kill all</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openWebDeactivateModal(s)}
            style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#EC4899' }]}
          >
            <Text style={styles.swipeBtnIcon}>🚫</Text>
            <Text style={styles.swipeBtnLabel}>Deactivate</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    const cardContent = (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginBottom: 0 }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>{name}</Text>
            <Text style={[styles.username, { color: subTextColor }]} numberOfLines={1}>
              @{s.user?.username || '—'}{s.user?.role ? ` · ${s.user.role}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={[styles.metaBlock, { borderTopColor: darkMode ? '#1E293B' : '#F1F5F9' }]}>
          <Text style={[styles.deviceName, { color: textColor }]} numberOfLines={1}>
            {browserIcon(s.browser)} {s.browser || 'Unknown browser'} · {s.os || 'Unknown OS'}
          </Text>
          <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
            IP: {s.lastIp || s.ip || '—'}
          </Text>
          <Text style={[styles.deviceMeta, { color: subTextColor }]} numberOfLines={1}>
            Last seen: {fmtRelative(s.lastSeenAt)} · Signed in: {fmtRelative(s.loggedInAt)}
          </Text>
          {s.status === 'terminated' && s.terminatedReason ? (
            <Text style={[styles.deviceMeta, { color: '#EF4444' }]} numberOfLines={2}>
              {s.terminatedReason}
            </Text>
          ) : null}
        </View>

        <View style={styles.hintRow}>
          <Text style={[styles.hintText, { color: subTextColor }]}>← Swipe for actions</Text>
          <TouchableOpacity
            onPress={() => handleDeleteWebSession(s)}
            activeOpacity={0.75}
            hitSlop={8}
            style={[styles.trashBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }]}
          >
            <Text style={{ fontSize: 13 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <View style={styles.swipeWrap}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(refKey, ref);
            else swipeableRefs.current.delete(refKey);
          }}
          renderRightActions={renderRightActions}
          rightThreshold={40}
          overshootRight={false}
          friction={2}
          onSwipeableWillOpen={() => closeAllSwipes(refKey)}
          onSwipeableWillClose={() => {
            if (String(openSwipeIdRef.current) === String(refKey)) {
              openSwipeIdRef.current = null;
            }
          }}
        >
          {cardContent}
        </Swipeable>
      </View>
    );
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* ───── FIXED HEADER ───── */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {tab === 'phone' ? 'Devices' : 'Web Sessions'}
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
              {tab === 'phone'
                ? `${deviceCounts.pending} pending · ${deviceCounts.approved} approved · ${deviceCounts.blocked} blocked`
                : 'Active browsers and their sessions'}
            </Text>
          </View>
        </View>

        {/* ───── FIXED TABS ───── */}
        <View
          style={[
            styles.tabsWrap,
            { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor },
          ]}
        >
          <TouchableOpacity
            onPress={() => setTab('phone')}
            activeOpacity={0.85}
            style={[
              styles.tabBtn,
              tab === 'phone' && {
                backgroundColor: cardBg,
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 }, elevation: 2,
              },
            ]}
          >
            <Text style={styles.tabIcon}>📱</Text>
            <Text style={[styles.tabLabel, { color: tab === 'phone' ? textColor : subTextColor }]}>
              Phone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab('web')}
            activeOpacity={0.85}
            style={[
              styles.tabBtn,
              tab === 'web' && {
                backgroundColor: cardBg,
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 }, elevation: 2,
              },
            ]}
          >
            <Text style={styles.tabIcon}>💻</Text>
            <Text style={[styles.tabLabel, { color: tab === 'web' ? textColor : subTextColor }]}>
              Web
            </Text>
          </TouchableOpacity>
        </View>

        {/* ───── FIXED SEARCH ───── */}
        <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={tab === 'phone' ? deviceSearch : webSearch}
            onChangeText={tab === 'phone' ? setDeviceSearch : setWebSearch}
            placeholder={tab === 'phone' ? 'Search by username or name…' : 'Search by user…'}
            placeholderTextColor={subTextColor}
            style={[styles.searchInput, { color: textColor }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {(tab === 'phone' ? deviceSearch : webSearch).length > 0 && (
            <TouchableOpacity
              onPress={() => (tab === 'phone' ? setDeviceSearch('') : setWebSearch(''))}
              hitSlop={8}
            >
              <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ───── FIXED FILTERS ───── */}
        <View style={styles.filterRow}>
          {(tab === 'phone' ? DEVICE_FILTERS : WEB_FILTERS).map((f) => {
            const isActive = tab === 'phone' ? deviceFilter === f.key : webFilter === f.key;
            const count = tab === 'phone' ? (deviceCounts[f.key] || 0) : (webCounts[f.key] || 0);
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => (tab === 'phone' ? setDeviceFilter(f.key) : setWebFilter(f.key))}
                activeOpacity={0.85}
                style={[styles.filterPill, {
                  backgroundColor: isActive ? f.tint : (darkMode ? '#1E293B' : '#F1F5F9'),
                  borderColor: isActive ? f.tint : borderColor,
                }]}
              >
                <Text style={[styles.filterPillText, { color: isActive ? '#FFFFFF' : textColor }]} numberOfLines={1}>
                  {f.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ───── SCROLLING LIST ───── */}
        {tab === 'phone' ? (
          <FlatList
            data={deviceItems}
            keyExtractor={(it) => `dev-${it.id}`}
            renderItem={renderDevice}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => closeAllSwipes(null)}
            onEndReached={() => deviceHasMore && !deviceLoadingMore && loadDevices(false, devicePage + 1)}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={deviceRefreshing}
                onRefresh={async () => { await loadDevices(true, 1); await loadDeviceStats(); }}
                tintColor={subTextColor}
              />
            }
            ListFooterComponent={
              deviceLoadingMore ? (
                <View style={styles.footerLoader}><ActivityIndicator size="small" color="#8B5CF6" /></View>
              ) : deviceHasMore ? (
                <Text style={[styles.footerText, { color: subTextColor }]}>Scroll for more</Text>
              ) : deviceItems.length > PAGE_SIZE ? (
                <Text style={[styles.footerText, { color: subTextColor }]}>
                  End of list · {devicePagination.total} device{devicePagination.total === 1 ? '' : 's'}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              deviceLoading ? (
                <View style={styles.emptyBox}><ActivityIndicator color="#8B5CF6" /></View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>
                    {deviceFilter === 'pending' ? '✅' : deviceFilter === 'blocked' ? '🛡️' : '📱'}
                  </Text>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>
                    {deviceFilter === 'pending'  ? 'No pending devices'
                     : deviceFilter === 'approved' ? 'No approved devices'
                     : deviceFilter === 'blocked'  ? 'No blocked devices'
                     : 'No devices registered'}
                  </Text>
                  <Text style={[styles.emptyBody, { color: subTextColor }]}>
                    {deviceSearch ? `No devices match "${deviceSearch}".` : 'Try a different filter.'}
                  </Text>
                </View>
              )
            }
          />
        ) : (
          <FlatList
            data={webItems}
            keyExtractor={(it) => `web-${it.id}`}
            renderItem={renderWebSession}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => closeAllSwipes(null)}
            onEndReached={() => webHasMore && !webLoadingMore && loadWebSessions(false, webPage + 1)}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={webRefreshing}
                onRefresh={async () => { await loadWebSessions(true, 1); await loadWebStats(); }}
                tintColor={subTextColor}
              />
            }
            ListFooterComponent={
              webLoadingMore ? (
                <View style={styles.footerLoader}><ActivityIndicator size="small" color="#8B5CF6" /></View>
              ) : webHasMore ? (
                <Text style={[styles.footerText, { color: subTextColor }]}>Scroll for more</Text>
              ) : webItems.length > PAGE_SIZE ? (
                <Text style={[styles.footerText, { color: subTextColor }]}>
                  End of list · {webPagination.total} session{webPagination.total === 1 ? '' : 's'}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              webLoading ? (
                <View style={styles.emptyBox}><ActivityIndicator color="#8B5CF6" /></View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>
                    {webFilter === 'active' ? '✅' : webFilter === 'terminated' ? '🛡️' : '💻'}
                  </Text>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>
                    {webFilter === 'active' ? 'No active sessions'
                     : webFilter === 'terminated' ? 'No terminated sessions'
                     : 'No web sessions'}
                  </Text>
                  <Text style={[styles.emptyBody, { color: subTextColor }]}>
                    {webSearch ? `No sessions match "${webSearch}".` : 'Try a different filter.'}
                  </Text>
                </View>
              )
            }
          />
        )}

        {/* ───── DEVICE BLOCK MODAL ───── */}
        <Modal
          visible={!!deviceBlockTarget}
          transparent
          animationType="fade"
          onRequestClose={() => !deviceBlockSubmitting && setDeviceBlockTarget(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.centerBackdrop}
          >
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject}
              onPress={() => !deviceBlockSubmitting && setDeviceBlockTarget(null)} />
            <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Block this device?</Text>
              <Text style={[styles.modalSub, { color: subTextColor }]}>
                {deviceBlockTarget?.user?.fullName || deviceBlockTarget?.user?.username || 'This user'}{' '}
                will be signed out and unable to log in from this device.
              </Text>

              <Text style={[styles.fieldLabel, { color: subTextColor }]}>REASON (OPTIONAL)</Text>
              <TextInput
                value={deviceBlockReason}
                onChangeText={setDeviceBlockReason}
                placeholder="e.g. Reported lost or stolen"
                placeholderTextColor={subTextColor}
                editable={!deviceBlockSubmitting}
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
                  onPress={() => setDeviceBlockTarget(null)}
                  disabled={deviceBlockSubmitting}
                  activeOpacity={0.85}
                  style={[styles.modalBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor }]}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBlockDevice}
                  disabled={deviceBlockSubmitting}
                  activeOpacity={0.85}
                  style={[styles.modalBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
                >
                  {deviceBlockSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : (
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Block device</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ───── WEB TERMINATE MODAL ───── */}
        <Modal
          visible={!!webTerminateTarget}
          transparent
          animationType="fade"
          onRequestClose={() => !webSubmitting && setWebTerminateTarget(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.centerBackdrop}
          >
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject}
              onPress={() => !webSubmitting && setWebTerminateTarget(null)} />
            <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Terminate this session?</Text>
              <Text style={[styles.modalSub, { color: subTextColor }]}>
                {webTerminateTarget?.browser} · {webTerminateTarget?.os}
                {'\n'}
                {webTerminateTarget?.user?.fullName || webTerminateTarget?.user?.username}
                {'\n\n'}
                They'll be signed out on the next request. They can log in again afterwards.
              </Text>

              <Text style={[styles.fieldLabel, { color: subTextColor }]}>REASON (OPTIONAL)</Text>
              <TextInput
                value={webTerminateReason}
                onChangeText={setWebTerminateReason}
                placeholder="e.g. Password reset, suspicious activity"
                placeholderTextColor={subTextColor}
                editable={!webSubmitting}
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
                  onPress={() => setWebTerminateTarget(null)}
                  disabled={webSubmitting}
                  activeOpacity={0.85}
                  style={[styles.modalBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor }]}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitWebTerminate}
                  disabled={webSubmitting}
                  activeOpacity={0.85}
                  style={[styles.modalBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
                >
                  {webSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : (
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Terminate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ───── WEB DEACTIVATE MODAL ───── */}
        <Modal
          visible={!!webDeactivateTarget}
          transparent
          animationType="fade"
          onRequestClose={() => !webSubmitting && setWebDeactivateTarget(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.centerBackdrop}
          >
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject}
              onPress={() => !webSubmitting && setWebDeactivateTarget(null)} />
            <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Deactivate user?</Text>
              <Text style={[styles.modalSub, { color: subTextColor }]}>
                <Text style={{ fontWeight: '900' }}>
                  {webDeactivateTarget?.user?.fullName || webDeactivateTarget?.user?.username}
                </Text>
                {'\n\n'}
                They'll be blocked from logging in anywhere — web, mobile, and any new browser.
                All their current sessions will be terminated.
              </Text>

              <Text style={[styles.fieldLabel, { color: subTextColor }]}>REASON (OPTIONAL)</Text>
              <TextInput
                value={webDeactivateReason}
                onChangeText={setWebDeactivateReason}
                placeholder="e.g. Employee offboarding"
                placeholderTextColor={subTextColor}
                editable={!webSubmitting}
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
                  onPress={() => setWebDeactivateTarget(null)}
                  disabled={webSubmitting}
                  activeOpacity={0.85}
                  style={[styles.modalBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor }]}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitWebDeactivate}
                  disabled={webSubmitting}
                  activeOpacity={0.85}
                  style={[styles.modalBtn, { backgroundColor: '#EC4899', borderColor: '#EC4899' }]}
                >
                  {webSubmitting ? <ActivityIndicator color="#FFF" size="small" /> : (
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Deactivate & sign out</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10, gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },

  tabsWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 9, gap: 6,
  },
  tabIcon: { fontSize: 15 },
  tabLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

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

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  swipeWrap: { marginBottom: 10, borderRadius: 14, overflow: 'hidden' },
  swipeActionsWrap: { flexDirection: 'row', alignItems: 'stretch', height: '100%' },
  swipeBtn: { justifyContent: 'center', alignItems: 'center', height: '100%', gap: 4 },
  swipeBtnIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  swipeBtnLabel: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.2 },

  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  userName: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.2 },
  username: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },

  metaBlock: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, borderTopWidth: 1 },
  deviceName: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  deviceMeta: { fontSize: 11.5, fontWeight: '500', lineHeight: 17 },

  hintRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 10, paddingTop: 6,
  },
  hintText: { fontSize: 10.5, fontWeight: '600', fontStyle: 'italic' },
  trashBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  footerLoader: { paddingVertical: 18, alignItems: 'center' },
  footerText: { paddingVertical: 16, textAlign: 'center', fontSize: 11.5, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },

  centerBackdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 24,
  },
  centerModal: { width: '100%', maxWidth: 460, borderRadius: 18, borderWidth: 1, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3, marginBottom: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontWeight: '500',
    minHeight: 70, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
});