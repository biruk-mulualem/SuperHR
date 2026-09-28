// super-app/src/pages/stores/LowStockAlertsPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  ScrollView,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import mobileItemListService from '../../stores/mobileItemListService';
import mobileLowStockService from '../../stores/mobileLowStockService';

// ================================================================
// CONSTANTS
// ================================================================
const ALERT_FILTERS = [
  { key: 'all',       label: 'Total'     },
  { key: 'alert',     label: 'Triggered' },
  { key: 'watching',  label: 'Pending'   },
];

const C_WATCHING = '#3B82F6';
const C_ALERT    = '#EF4444';
const C_NEUTRAL  = '#8B5CF6';
const C_OK       = '#10B981';
const C_WARN     = '#F59E0B';

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 15000;

const isHot = (alert) => {
  const bal = Number(alert?.currentBalance ?? 0);
  const thr = Number(alert?.threshold ?? 0);
  return thr > 0 && bal <= thr;
};

const hasConflicts = (alert) => !!alert?.hasConflicts;

const matchesFilter = (alert, filterKey) => {
  if (filterKey === 'all') return true;
  if (filterKey === 'alert') return isHot(alert);
  if (filterKey === 'watching') return !isHot(alert);
  return true;
};

const alertMatchesQuery = (alert, q) => {
  if (!q) return true;
  return (
    String(alert?.itemName || '').toLowerCase().includes(q) ||
    String(alert?.sku || '').toLowerCase().includes(q)
  );
};

const dedupeItemsById = (items) => {
  const seen = new Set();
  const out = [];
  for (const it of items || []) {
    const key = it?.id ?? it?.sku ?? it?.name;
    if (key == null) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
};

const dedupeAlerts = (alerts) => {
  const seen = new Set();
  const out = [];
  for (const a of alerts || []) {
    const key = a?.id ?? `${a?.itemId}-${a?.createdAt}`;
    if (key == null) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
};

const alertKey = (item, idx) =>
  String(
    item?.id ??
    `${item?.itemId ?? 'x'}-${item?.createdAt ?? 'x'}-${idx}`
  );

const fmtNumber = (n) => Number(n ?? 0).toLocaleString();

export default function LowStockAlertsPage({
  onNavigateToItemDetail,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [counts, setCounts] = useState({
    total: 0,
    hot: 0,
    watching: 0,
    withConflicts: 0,
  });

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [expandedConflicts, setExpandedConflicts] = useState(() => new Set());

  const pageLoadingRef = useRef(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);
  const fetchGenRef = useRef(0);

  const [showCreate, setShowCreate] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [thresholdInput, setThresholdInput] = useState('');
  const [savingAlert, setSavingAlert] = useState(false);
  const [formError, setFormError] = useState(null);

  const [confirmAlert, setConfirmAlert] = useState(null);
  const [removing, setRemoving] = useState(false);

  // -----------------------------------------------------------------
  // Normalise an alert coming from the API
  // -----------------------------------------------------------------
  const normaliseAlert = useCallback((a) => {
    const conflicts = Array.isArray(a?.conflicts) ? a.conflicts : [];
    return {
      ...a,
      threshold: Number(a.threshold ?? 0),
      currentBalance: Number(a.currentBalance ?? 0),
      storesCounted: Number(a.storesCounted ?? 0),
      conflictingStoreCount:
        Number(a.conflictingStoreCount ?? conflicts.length) || 0,
      hasConflicts:
        !!a.hasConflicts || conflicts.length > 0,
      conflicts: conflicts.map((c) => ({
        storeId: c.storeId,
        storeName: c.storeName || `Store #${c.storeId}`,
        groups: Array.isArray(c.groups)
          ? c.groups.map((g) => ({
              groupId: g.groupId,
              groupName: g.groupName || `Group #${g.groupId}`,
              balance: Number(g.balance ?? 0),
            }))
          : [],
      })),
    };
  }, []);

  const applyCounts = useCallback((c) => {
    if (!c) return;
    setCounts({
      total:          Number(c.total)          || 0,
      hot:            Number(c.hot)            || 0,
      watching:       Number(c.watching)       || 0,
      withConflicts:  Number(c.withConflicts)  || 0,
    });
  }, []);

  // -----------------------------------------------------------------
  // FETCH — page 1
  // -----------------------------------------------------------------
  const loadFirstPage = useCallback(
    async ({ silent = false, background = false } = {}) => {
      const myGen = ++fetchGenRef.current;

      try {
        if (!background) {
          if (silent) setRefreshing(true);
          else setLoading(true);
          setError(null);
        }
        pageLoadingRef.current = false;

        const res = await mobileLowStockService.getAlerts({
          page: 1,
          limit: PAGE_SIZE,
        });

        if (myGen !== fetchGenRef.current) return;

        if (res?.success) {
          const list = Array.isArray(res.data?.alerts) ? res.data.alerts : [];
          setAlerts(dedupeAlerts(list.map(normaliseAlert)));
          setPage(1);
          setTotal(res.data?.pagination?.total ?? list.length);
          setHasMore(res.data?.pagination?.hasMore ?? false);
          applyCounts(res.data?.counts);
        } else if (!background) {
          setError(res?.error || 'Failed to load stock status');
        }
      } catch (e) {
        if (myGen !== fetchGenRef.current) return;
        if (!background) {
          const status = e?.response?.status;
          if (status === 401) setError('Session expired. Please log in again.');
          else if (status === 403) setError('Access denied.');
          else if (e?.message?.includes('Network')) setError('Network error.');
          else
            setError(
              e?.response?.data?.error || e?.message || 'Failed to load stock status'
            );
        }
      } finally {
        if (myGen === fetchGenRef.current && !background) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [normaliseAlert, applyCounts]
  );

  // -----------------------------------------------------------------
  // FETCH — next page
  // -----------------------------------------------------------------
  const loadNextPage = useCallback(async () => {
    if (pageLoadingRef.current) return;
    if (!hasMore) return;

    const myGen = fetchGenRef.current;
    pageLoadingRef.current = true;
    setLoadingMore(true);

    try {
      const next = page + 1;
      const res = await mobileLowStockService.getAlerts({
        page: next,
        limit: PAGE_SIZE,
      });

      if (myGen !== fetchGenRef.current) return;

      if (res?.success) {
        const list = Array.isArray(res.data?.alerts) ? res.data.alerts : [];
        setAlerts((prev) =>
          dedupeAlerts([...prev, ...list.map(normaliseAlert)])
        );
        setPage(next);
        setTotal(res.data?.pagination?.total ?? total);
        setHasMore(res.data?.pagination?.hasMore ?? false);
        applyCounts(res.data?.counts);
      }
    } catch (e) {
      console.warn('[stock-status] loadNextPage failed:', e?.message);
    } finally {
      setLoadingMore(false);
      pageLoadingRef.current = false;
    }
  }, [page, hasMore, total, normaliseAlert, applyCounts]);

  // -----------------------------------------------------------------
  // INITIAL LOAD
  // -----------------------------------------------------------------
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  // -----------------------------------------------------------------
  // SILENT POLL
  // -----------------------------------------------------------------
  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadFirstPage({ background: true });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadFirstPage]);

  // -----------------------------------------------------------------
  // PICKER SEARCH
  // -----------------------------------------------------------------
  useEffect(() => {
    const term = pickerQuery.trim();

    if (!term) {
      setPickerResults([]);
      setPickerLoading(false);
      setPickerError(null);
      return;
    }

    let cancelled = false;
    setPickerLoading(true);
    setPickerError(null);

    const t = setTimeout(async () => {
      try {
        const res = await mobileItemListService.getItemsList({
          page: 1,
          limit: 50,
          status: 'active',
          q: term,
        });

        if (cancelled) return;

        if (res?.success) {
          const list = Array.isArray(res.data?.items) ? res.data.items : [];
          setPickerResults(
            dedupeItemsById(
              list.map((it) => ({
                ...it,
                balance: Number(it.balance ?? 0),
                status: it.status || 'active',
              }))
            )
          );
        } else {
          setPickerResults([]);
          setPickerError(res?.error || 'Failed to load items');
        }
      } catch (err) {
        if (cancelled) return;
        setPickerResults([]);
        setPickerError(
          err?.response?.data?.error || err?.message || 'Search failed'
        );
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pickerQuery]);

  const summary = counts;

  // -----------------------------------------------------------------
  // FILTER + SEARCH
  // -----------------------------------------------------------------
  const visibleAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts
      .filter((a) => matchesFilter(a, statusFilter))
      .filter((a) => alertMatchesQuery(a, q))
      .sort((a, b) => {
        const ta = isHot(a) ? 0 : 1;
        const tb = isHot(b) ? 0 : 1;
        if (ta !== tb) return ta - tb;
        const ca = hasConflicts(a) ? 0 : 1;
        const cb = hasConflicts(b) ? 0 : 1;
        if (ca !== cb) return ca - cb;
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      });
  }, [alerts, statusFilter, query]);

  const handleEndReached = useCallback(() => {
    if (pageLoadingRef.current) return;
    if (!hasMore) return;
    loadNextPage();
  }, [hasMore, loadNextPage]);

  const toggleConflicts = useCallback((alertId) => {
    setExpandedConflicts((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  }, []);

  // -----------------------------------------------------------------
  // CREATE-ALERT MODAL
  // -----------------------------------------------------------------
  const openCreate = () => {
    setShowCreate(true);
    setPickerQuery('');
    setPickerResults([]);
    setPickerLoading(false);
    setPickerError(null);
    setSelectedItem(null);
    setThresholdInput('');
    setFormError(null);
  };

  const closeCreate = () => {
    if (savingAlert) return;
    setShowCreate(false);
  };

  const chooseItem = (it) => {
    setSelectedItem(it);
    setFormError(null);
  };

  const saveAlert = async () => {
    if (!selectedItem) {
      setFormError('Pick an item first');
      return;
    }
    const n = Number(thresholdInput);
    if (!Number.isFinite(n) || n <= 0) {
      setFormError('Enter a number greater than 0');
      return;
    }
    const existing = alerts.find((a) => a.itemId === selectedItem.id);
    if (existing) {
      setFormError('A stock status already exists for this item');
      return;
    }

    setSavingAlert(true);
    try {
      const res = await mobileLowStockService.createAlert({
        itemId: selectedItem.id,
        threshold: n,
      });

      if (!res?.success) {
        setFormError(res?.error || 'Failed to create stock status');
        return;
      }

      const created = res.data || {};
      const localBalance = Number(selectedItem.balance ?? 0);
      const localIsHot = n > 0 && localBalance <= n;

      const local = normaliseAlert({
        id: created.id ?? `local-${Date.now()}`,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        sku: selectedItem.sku,
        unit: selectedItem.unit || '—',
        threshold: n,
        currentBalance: localBalance,
        storesCounted: 0,
        hasConflicts: false,
        conflictingStoreCount: 0,
        conflicts: [],
        createdAt: created.createdAt ?? Date.now(),
      });

      setAlerts((prev) => dedupeAlerts([local, ...prev]));
      setTotal((t) => t + 1);

      setCounts((c) => ({
        ...c,
        total:    c.total + 1,
        hot:      localIsHot ? c.hot + 1 : c.hot,
        watching: localIsHot ? c.watching : c.watching + 1,
      }));

      closeCreate();
    } catch (e) {
      setFormError(
        e?.response?.data?.error || e?.message || 'Failed to create stock status'
      );
    } finally {
      setSavingAlert(false);
    }
  };

  // -----------------------------------------------------------------
  // REMOVE
  // -----------------------------------------------------------------
  const askRemove = (alert) => setConfirmAlert(alert);
  const cancelRemove = () => {
    if (removing) return;
    setConfirmAlert(null);
  };

  const confirmRemove = async () => {
    if (!confirmAlert) return;
    const target = confirmAlert;
    const wasHot = isHot(target);
    const hadConflicts = hasConflicts(target);

    setRemoving(true);

    const prev = alerts;
    const prevTotal = total;
    const prevCounts = counts;

    setAlerts((p) => p.filter((a) => a.id !== target.id));
    setTotal((t) => Math.max(0, t - 1));

    setCounts((c) => ({
      total:         Math.max(0, c.total - 1),
      hot:           wasHot ? Math.max(0, c.hot - 1) : c.hot,
      watching:      wasHot ? c.watching : Math.max(0, c.watching - 1),
      withConflicts: hadConflicts ? Math.max(0, c.withConflicts - 1) : c.withConflicts,
    }));

    try {
      await mobileLowStockService.deleteAlert(target.id);
      setConfirmAlert(null);
    } catch (e) {
      setAlerts(prev);
      setTotal(prevTotal);
      setCounts(prevCounts);
      setError(
        e?.response?.data?.error || e?.message || 'Failed to remove stock status'
      );
      setConfirmAlert(null);
    } finally {
      setRemoving(false);
    }
  };

  // -----------------------------------------------------------------
  // LOADING
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color={C_NEUTRAL} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading stock status…
        </Text>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Stock Status
          </Text>
          <Text style={[styles.headerSub, { color: subTextColor }]}>
            {summary.hot > 0
              ? `${summary.hot} triggered · ${summary.watching} pending`
              : `${summary.watching} pending`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={openCreate}
          activeOpacity={0.85}
          style={[styles.newAlertBtn, { backgroundColor: C_NEUTRAL }]}
        >
          <Text style={styles.newAlertBtnText}>+ Set Status</Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      <View
        style={[
          styles.summaryStrip,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: C_NEUTRAL }]}>
            {summary.total}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Total
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: C_ALERT }]}>
            {summary.hot}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Triggered
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: C_WATCHING }]}>
            {summary.watching}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Pending
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: C_WARN }]}>
            {summary.withConflicts}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Conflicts
          </Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by item or item code"
          placeholderTextColor={subTextColor}
          style={[styles.searchInput, { color: textColor }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <Text style={[styles.filterLabel, { color: subTextColor }]}>STATUS</Text>
      <View style={styles.pillRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
        >
          {ALERT_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setStatusFilter(f.key)}
                activeOpacity={0.8}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active
                      ? C_NEUTRAL
                      : darkMode
                      ? '#1E293B'
                      : '#F1F5F9',
                    borderColor: active ? C_NEUTRAL : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? '#FFFFFF' : textColor },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Error */}
      {error && (
        <TouchableOpacity
          onPress={() => loadFirstPage()}
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

      {/* Alerts list */}
      <FlatList
        ref={listRef}
        data={visibleAlerts}
        keyExtractor={alertKey}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFirstPage({ silent: true })}
            colors={[C_NEUTRAL]}
            tintColor={C_NEUTRAL}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={C_NEUTRAL} />
            </View>
          ) : hasMore ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Scroll for more…
            </Text>
          ) : alerts.length > 0 ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              End · {total} {total === 1 ? 'stock status' : 'stock statuses'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No stock status yet
            </Text>
            <Text style={[styles.emptyBody, { color: subTextColor }]}>
              {query || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'Tap "+ Set Status" to create your first stock status.'}
            </Text>
          </View>
        }
        renderItem={({ item: alert }) => {
          const hot = isHot(alert);
          const conflict = hasConflicts(alert);
          const diff =
            Number(alert.currentBalance ?? 0) - Number(alert.threshold ?? 0);
          const conflictsOpen = expandedConflicts.has(alert.id);

          const cardBorder = hot
            ? darkMode ? '#7F1D1D' : '#FECACA'
            : conflict
            ? darkMode ? '#78350F' : '#FCD34D'
            : borderColor;

          return (
            <View
              style={[
                styles.alertCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View
                style={[
                  styles.accentStrip,
                  { backgroundColor: hot ? C_ALERT : conflict ? C_WARN : C_WATCHING },
                ]}
              />

              <View style={styles.alertBody}>
                <View style={styles.alertTopRow}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: hot
                            ? darkMode ? '#7F1D1D' : '#FEE2E2'
                            : darkMode ? '#1E3A8A' : '#DBEAFE',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: hot ? C_ALERT : C_WATCHING },
                        ]}
                      >
                        {hot ? 'Triggered' : 'Pending'}
                      </Text>
                    </View>

                    {conflict && (
                      <TouchableOpacity
                        onPress={() => toggleConflicts(alert.id)}
                        activeOpacity={0.75}
                        style={[
                          styles.conflictPill,
                          {
                            backgroundColor: darkMode ? '#78350F' : '#FEF3C7',
                            borderColor: C_WARN,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.conflictPillText,
                            { color: darkMode ? '#FCD34D' : '#92400E' },
                          ]}
                        >
                          ⚠️ {alert.conflictingStoreCount} store
                          {alert.conflictingStoreCount === 1 ? '' : 's'} excluded
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => askRemove(alert)}
                    hitSlop={8}
                    activeOpacity={0.7}
                    style={styles.deleteBtn}
                  >
                    <Text
                      style={[styles.deleteBtnText, { color: subTextColor }]}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.alertItemName, { color: textColor }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {alert.itemName || 'Unnamed item'}
                </Text>
                <Text
                  style={[styles.alertMeta, { color: subTextColor }]}
                  numberOfLines={1}
                >
                  {alert.sku || '—'}
                  {alert.storesCounted > 0
                    ? `  ·  ${alert.storesCounted} store${alert.storesCounted === 1 ? '' : 's'} counted`
                    : ''}
                </Text>

                <View
                  style={[
                    styles.metricsRow,
                    { borderTopColor: darkMode ? '#334155' : '#E2E8F0' },
                  ]}
                >
                  <View style={styles.metricCell}>
                    <View style={styles.metricValueRow}>
                      <Text
                        style={[
                          styles.metricValue,
                          { color: hot ? C_ALERT : textColor },
                        ]}
                      >
                        {fmtNumber(alert.currentBalance)}
                      </Text>
                      {alert.unit ? (
                        <Text style={[styles.metricUnit, { color: subTextColor }]}>
                          {alert.unit}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.metricLabel, { color: subTextColor }]}>
                      Current
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricDivider,
                      { backgroundColor: darkMode ? '#334155' : '#E2E8F0' },
                    ]}
                  />

                  <View style={styles.metricCell}>
                    <View style={styles.metricValueRow}>
                      <Text style={[styles.metricValue, { color: C_NEUTRAL }]}>
                        {fmtNumber(alert.threshold)}
                      </Text>
                      {alert.unit ? (
                        <Text style={[styles.metricUnit, { color: subTextColor }]}>
                          {alert.unit}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.metricLabel, { color: subTextColor }]}>
                      Alert at
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricDivider,
                      { backgroundColor: darkMode ? '#334155' : '#E2E8F0' },
                    ]}
                  />

                  <View style={styles.metricCell}>
                    <View style={styles.metricValueRow}>
                      <Text
                        style={[
                          styles.metricValue,
                          { color: hot ? C_ALERT : C_OK },
                        ]}
                      >
                        {fmtNumber(diff)}
                      </Text>
                      {alert.unit ? (
                        <Text style={[styles.metricUnit, { color: subTextColor }]}>
                          {alert.unit}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.metricLabel, { color: subTextColor }]}>
                      {hot ? 'Over' : 'Margin'}
                    </Text>
                  </View>
                </View>

                {/* Conflict details panel */}
                {conflict && conflictsOpen && (
                  <View
                    style={[
                      styles.conflictPanel,
                      {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFBEB',
                        borderColor: darkMode ? '#78350F' : '#FDE68A',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.conflictPanelTitle,
                        { color: darkMode ? '#FCD34D' : '#92400E' },
                      ]}
                    >
                      Excluded stores · balance not fully counted
                    </Text>
                    <Text
                      style={[
                        styles.conflictPanelHint,
                        { color: subTextColor },
                      ]}
                    >
                      These stores have different balances across their groups.
                      Align them to include them in the total.
                    </Text>

                    {alert.conflicts.map((c) => (
                      <View
                        key={`${alert.id}-${c.storeId}`}
                        style={[
                          styles.conflictStoreBlock,
                          {
                            borderTopColor: darkMode ? '#334155' : '#FDE68A',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.conflictStoreName,
                            { color: textColor },
                          ]}
                          numberOfLines={2}
                        >
                          {c.storeName || `Store #${c.storeId}`}
                        </Text>

                        {(c.groups || []).map((g) => (
                          <View
                            key={`${c.storeId}-${g.groupId}`}
                            style={styles.conflictGroupRow}
                          >
                            <Text
                              style={[
                                styles.conflictGroupName,
                                { color: subTextColor },
                              ]}
                              numberOfLines={2}
                            >
                              {g.groupName || `Group #${g.groupId}`}
                            </Text>
                            <Text
                              style={[
                                styles.conflictGroupBalance,
                                { color: darkMode ? '#FCD34D' : '#92400E' },
                              ]}
                            >
                              {fmtNumber(g.balance)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ───────────── Create-status modal ───────────── */}
      <Modal
        visible={showCreate}
        transparent
        animationType="slide"
        onRequestClose={closeCreate}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBackdropTouch}
            onPress={closeCreate}
          />

          <View
            style={[styles.modalCard, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  Set stock status
                </Text>
                <Text style={[styles.modalSubtitle, { color: subTextColor }]}>
                  Choose an item and the level to alert you at
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeCreate}
                disabled={savingAlert}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCloseText, { color: subTextColor }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View
                style={[
                  styles.selectedBanner,
                  {
                    backgroundColor: darkMode ? '#1E3A8A' : '#EFF6FF',
                    borderColor: darkMode ? '#3B82F6' : '#BFDBFE',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.selectedLabel,
                    { color: darkMode ? '#93C5FD' : '#1D4ED8' },
                  ]}
                >
                  SELECTED
                </Text>
                <Text
                  style={[
                    styles.selectedName,
                    { color: darkMode ? '#DBEAFE' : '#1E3A8A' },
                  ]}
                  numberOfLines={2}
                >
                  {selectedItem.name}
                </Text>
                <Text
                  style={[
                    styles.selectedMeta,
                    { color: darkMode ? '#93C5FD' : '#3B82F6' },
                  ]}
                  numberOfLines={1}
                >
                  {selectedItem.sku || '—'}
                </Text>
              </View>
            )}

            {!selectedItem && (
              <>
                <View
                  style={[
                    styles.pickerSearch,
                    {
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor,
                    },
                  ]}
                >
                  <Text style={styles.pickerSearchIcon}>🔍</Text>
                  <TextInput
                    value={pickerQuery}
                    onChangeText={setPickerQuery}
                    placeholder="Search items…"
                    placeholderTextColor={subTextColor}
                    style={[styles.pickerSearchInput, { color: textColor }]}
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoFocus
                  />
                  {pickerQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setPickerQuery('')}
                      hitSlop={8}
                    >
                      <Text style={[styles.pickerClear, { color: subTextColor }]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View
                  style={[
                    styles.pickerList,
                    {
                      borderColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                    },
                  ]}
                >
                  {pickerQuery.trim().length === 0 ? (
                    <Text style={[styles.pickerEmpty, { color: subTextColor }]}>
                      Type to search items by name or item code.
                    </Text>
                  ) : pickerLoading ? (
                    <View style={styles.pickerLoadingBox}>
                      <ActivityIndicator size="small" color={C_NEUTRAL} />
                      <Text
                        style={[
                          styles.pickerEmpty,
                          { color: subTextColor, paddingTop: 8 },
                        ]}
                      >
                        Searching…
                      </Text>
                    </View>
                  ) : pickerError ? (
                    <Text style={[styles.pickerEmpty, { color: C_ALERT }]}>
                      {pickerError}
                    </Text>
                  ) : pickerResults.length === 0 ? (
                    <Text style={[styles.pickerEmpty, { color: subTextColor }]}>
                      No items match.
                    </Text>
                  ) : (
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      style={{ maxHeight: 260 }}
                    >
                      {pickerResults.map((it, idx) => (
                        <TouchableOpacity
                          key={String(it?.id ?? it?.sku ?? idx)}
                          onPress={() => chooseItem(it)}
                          activeOpacity={0.7}
                          style={[
                            styles.pickerRow,
                            {
                              borderBottomColor: darkMode
                                ? '#1E293B'
                                : '#F1F5F9',
                            },
                          ]}
                        >
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={[styles.pickerName, { color: textColor }]}
                              numberOfLines={1}
                            >
                              {it.name}
                            </Text>
                            {it.sku ? (
                              <Text
                                style={[
                                  styles.pickerMeta,
                                  { color: subTextColor },
                                ]}
                                numberOfLines={1}
                              >
                                {it.sku}
                              </Text>
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.pickerChevron,
                              { color: subTextColor },
                            ]}
                          >
                            ›
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </>
            )}

            {selectedItem && (
              <>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                  ALERT ME WHEN BALANCE DROPS TO
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor: formError ? C_ALERT : borderColor,
                    },
                  ]}
                >
                  <TextInput
                    value={thresholdInput}
                    onChangeText={(v) => {
                      setThresholdInput(v.replace(/[^0-9]/g, ''));
                      setFormError(null);
                    }}
                    keyboardType="number-pad"
                    placeholder="e.g. 25"
                    placeholderTextColor={subTextColor}
                    style={[styles.input, { color: textColor }]}
                    autoFocus
                  />
                  {selectedItem.unit && (
                    <Text
                      style={[styles.inputSuffix, { color: subTextColor }]}
                    >
                      {selectedItem.unit}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedItem(null);
                    setThresholdInput('');
                    setFormError(null);
                    setPickerQuery('');
                    setPickerResults([]);
                    setPickerError(null);
                  }}
                  activeOpacity={0.7}
                  style={styles.changeItemBtn}
                >
                  <Text
                    style={[styles.changeItemText, { color: subTextColor }]}
                  >
                    Choose a different item
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {formError && (
              <Text style={[styles.formError, { color: C_ALERT }]}>
                {formError}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeCreate}
                disabled={savingAlert}
                activeOpacity={0.7}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                    borderColor,
                  },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveAlert}
                disabled={savingAlert || !selectedItem}
                activeOpacity={0.7}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: C_NEUTRAL,
                    opacity: savingAlert || !selectedItem ? 0.5 : 1,
                  },
                ]}
              >
                {savingAlert ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                    Save status
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ───────────── Remove-confirm modal ───────────── */}
      <Modal
        visible={!!confirmAlert}
        transparent
        animationType="fade"
        onRequestClose={cancelRemove}
      >
        <View style={styles.confirmBackdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={cancelRemove}
          />

          <View
            style={[
              styles.confirmCard,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <View
              style={[
                styles.confirmIconWrap,
                {
                  backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2',
                },
              ]}
            >
              <Text style={styles.confirmIcon}>🗑️</Text>
            </View>

            <Text style={[styles.confirmTitle, { color: textColor }]}>
              Remove this stock status?
            </Text>

            <Text style={[styles.confirmBody, { color: subTextColor }]}>
              {confirmAlert
                ? `You'll stop receiving alerts for "${
                    confirmAlert.itemName || 'this item'
                  }".`
                : ''}
            </Text>

            {confirmAlert?.sku ? (
              <Text style={[styles.confirmSku, { color: subTextColor }]}>
                Item Code: {confirmAlert.sku}
              </Text>
            ) : null}

            <View style={styles.confirmActions}>
              <TouchableOpacity
                onPress={cancelRemove}
                disabled={removing}
                activeOpacity={0.7}
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                    borderColor,
                  },
                ]}
              >
                <Text
                  style={[styles.confirmBtnText, { color: textColor }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmRemove}
                disabled={removing}
                activeOpacity={0.7}
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: C_ALERT,
                    borderColor: C_ALERT,
                    opacity: removing ? 0.6 : 1,
                  },
                ]}
              >
                {removing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[styles.confirmBtnText, { color: '#FFFFFF' }]}
                  >
                    Remove
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  loadingText: { marginTop: 12, fontSize: 13, fontWeight: '500' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  newAlertBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  newAlertBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 12,
  },
  summaryDivider: { width: 1, height: 32, opacity: 0.6 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },

  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  pillRowWrap: { marginBottom: 10, maxHeight: 40 },
  pillScroll: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 140,
  },
  filterPillText: { fontSize: 12, fontWeight: '800' },

  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  errorText: { fontSize: 12.5, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 60 },

  footerLoader: { paddingVertical: 14, alignItems: 'center' },
  footerText: {
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  alertCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  accentStrip: { width: 4, alignSelf: 'stretch' },
  alertBody: { flex: 1, padding: 12 },

  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  conflictPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  conflictPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  deleteBtn: { paddingVertical: 2 },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  alertItemName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  alertMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  metricCell: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, height: 24, opacity: 0.7 },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'lowercase',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  conflictPanel: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  conflictPanelTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  conflictPanelHint: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginBottom: 6,
  },
  conflictStoreBlock: {
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  conflictStoreName: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  conflictGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 3,
    paddingLeft: 8,
  },
  conflictGroupName: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  conflictGroupBalance: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 3,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    padding: 4,
  },

  selectedBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  selectedLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  selectedMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 42,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  pickerSearchIcon: { fontSize: 14 },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  pickerClear: {
    fontSize: 13,
    fontWeight: '700',
    padding: 4,
  },
  pickerList: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  pickerName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  pickerMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  pickerChevron: {
    fontSize: 18,
    fontWeight: '800',
  },
  pickerEmpty: {
    padding: 20,
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '600',
  },
  pickerLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 0,
  },
  inputSuffix: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  changeItemBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  changeItemText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  formError: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  confirmBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 32,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmIcon: { fontSize: 24 },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  confirmBody: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  confirmSku: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    alignSelf: 'stretch',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});