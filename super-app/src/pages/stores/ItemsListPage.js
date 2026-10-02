// super-app/src/pages/stores/ItemsListPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
} from 'react-native';

import mobileItemListService from '../../stores/mobileItemListService';

// ================================================================
// CONSTANTS
// ================================================================
const STATUS_FILTERS = [
  { key: 'all',      label: 'All'       },
  { key: 'active',   label: 'Active'    },
  { key: 'inactive', label: 'Inactive'  },
  { key: 'nocost',   label: 'No cost'   },
];

const PAGE_SIZE = 10;

// ================================================================
// Groups table renderer
//   Header row  = GROUP 1, GROUP 2, … + DIFF
//   Value row   = each group's balance + the store's diff
//   Horizontally scrollable so any N of groups fits.
// ================================================================
const renderGroupsTable = (
  groups,
  { textColor, subTextColor, darkMode, borderColor, styles }
) => {
  if (!groups || groups.length === 0) {
    return (
      <Text style={[styles.groupsTableEmpty, { color: subTextColor }]}>
        No groups for this store.
      </Text>
    );
  }

  const balances = groups.map((g) => Number(g.balance) || 0);
  const maxB = Math.max(...balances);
  const minB = Math.min(...balances);
  const spread = maxB - minB;
  const hasConflict = spread !== 0;

  const headerBg   = darkMode ? '#1E293B' : '#F1F5F9';
  const valueBg    = darkMode ? '#0F172A' : '#FFFFFF';
  const cellBorder = borderColor;

  const COL_W  = 92;   // group columns
  const DIFF_W = 76;   // diff column

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 0 }}
    >
      <View style={[styles.groupsTable, { borderColor: cellBorder, marginTop: 6 }]}>
        {/* ---------- Header row ---------- */}
        <View
          style={[
            styles.groupsTableHeaderRow,
            { backgroundColor: headerBg, borderBottomColor: cellBorder },
          ]}
        >
          {groups.map((g, idx) => (
            <View
              key={`h-${g.groupId ?? idx}`}
              style={[
                styles.groupsHeaderCell,
                { width: COL_W, borderRightColor: cellBorder },
                styles.groupsCellBorderRight,
              ]}
            >
              <Text
                style={[styles.groupsHeaderText, { color: subTextColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {`GROUP ${idx + 1}`}
              </Text>
            </View>
          ))}

          <View style={[styles.groupsHeaderCellDiff, { width: DIFF_W }]}>
            <Text
              style={[styles.groupsHeaderText, { color: subTextColor }]}
              numberOfLines={1}
            >
              DIFF
            </Text>
          </View>
        </View>

        {/* ---------- Value row ---------- */}
        <View style={[styles.groupsTableValueRow, { backgroundColor: valueBg }]}>
          {groups.map((g, idx) => (
            <View
              key={`v-${g.balanceId ?? g.groupId ?? idx}`}
              style={[
                styles.groupsValueCell,
                { width: COL_W, borderRightColor: cellBorder },
                styles.groupsCellBorderRight,
              ]}
            >
              <Text
                style={[styles.groupsValueBalance, { color: textColor }]}
                numberOfLines={1}
              >
                {g.balance}
              </Text>
            </View>
          ))}

          <View style={[styles.groupsValueCellDiff, { width: DIFF_W }]}>
            <Text
              style={[
                styles.groupsValueBalance,
                { color: hasConflict ? '#EF4444' : '#10B981' },
              ]}
              numberOfLines={1}
            >
              {spread}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function ItemsListPage({
  onNavigateToDetail,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    noCost: 0,
  });

  // Inline expansion
  const [expandedId, setExpandedId] = useState(null);
  const [balancesCache, setBalancesCache] = useState({});

  // ✅ Stock alert local overrides (falls back to item.stockAlert from server)
  const [alertOverrides, setAlertOverrides] = useState({});

  // ✅ Stock alert modal
  const [alertModalItem, setAlertModalItem] = useState(null);
  const [alertModalValue, setAlertModalValue] = useState('');
  const [alertModalSaving, setAlertModalSaving] = useState(false);
  const [alertModalError, setAlertModalError] = useState(null);

  const listRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const skuColor = darkMode ? '#93C5FD' : '#2563EB';
  const uomColor = darkMode ? '#FCD34D' : '#D97706';

  // -----------------------------------------------------------------
  // Fetch helpers
  // -----------------------------------------------------------------
  const shapeItem = (it) => ({
    ...it,
    balance: Number(it.balance ?? 0),
    hasCost: it.hasCost !== false,
    status: it.status || 'active',
    stockAlert: it.stockAlert || null,
  });

  // -----------------------------------------------------------------
  // FETCH — page 1
  // -----------------------------------------------------------------
  const loadFirstPage = useCallback(
    async ({ silent = false, status, q } = {}) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);
        loadingMoreRef.current = false;

        const res = await mobileItemListService.getItemsList({
          page: 1,
          limit: PAGE_SIZE,
          status: status !== undefined ? status : statusFilter,
          q: (q !== undefined ? q : query).trim(),
        });

        if (res?.success) {
          const list = Array.isArray(res.data?.items) ? res.data.items : [];
          setItems(list.map(shapeItem));
          setPage(1);
          setTotal(res.data?.pagination?.total ?? list.length);
          setHasMore(res.data?.pagination?.hasMore ?? false);

          const c = res.data?.counts;
          if (c) {
            setCounts({
              total:    Number(c.total)    || 0,
              active:   Number(c.active)   || 0,
              inactive: Number(c.inactive) || 0,
              noCost:   Number(c.noCost)   || 0,
            });
          }
        } else {
          setError(res?.error || 'Failed to load items');
        }
      } catch (e) {
        const statusCode = e?.response?.status;
        if (statusCode === 401) setError('Session expired. Please log in again.');
        else if (statusCode === 403) setError('Access denied.');
        else if (e?.message?.includes('Network')) setError('Network error.');
        else
          setError(e?.response?.data?.error || e?.message || 'Failed to load');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, query]
  );

  // -----------------------------------------------------------------
  // FETCH — next page
  // -----------------------------------------------------------------
  const loadNextPage = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const next = page + 1;
      const res = await mobileItemListService.getItemsList({
        page: next,
        limit: PAGE_SIZE,
        status: statusFilter,
        q: query.trim(),
      });

      if (res?.success) {
        const list = Array.isArray(res.data?.items) ? res.data.items : [];
        setItems((prev) => [...prev, ...list.map(shapeItem)]);
        setPage(next);
        setHasMore(res.data?.pagination?.hasMore ?? false);
        setTotal(res.data?.pagination?.total ?? total);
      }
    } catch (e) {
      console.warn('[items] loadNextPage failed:', e?.message);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [page, hasMore, statusFilter, query, total]);

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search / status filter
  useEffect(() => {
    const t = setTimeout(() => {
      loadFirstPage({ silent: true });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query]);

  const handleEndReached = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (!hasMore) return;
    loadNextPage();
  }, [hasMore, loadNextPage]);

  // -----------------------------------------------------------------
  // Inline expansion
  // -----------------------------------------------------------------
  const fetchBalancesForItem = useCallback(async (itemId) => {
    setBalancesCache((prev) => ({
      ...prev,
      [itemId]: { loading: true, error: null, data: prev[itemId]?.data || null },
    }));

    try {
      const res = await mobileItemListService.getItemBalances(itemId);

      if (res?.success) {
        setBalancesCache((prev) => ({
          ...prev,
          [itemId]: { loading: false, error: null, data: res.data },
        }));
      } else {
        setBalancesCache((prev) => ({
          ...prev,
          [itemId]: {
            loading: false,
            error: res?.error || 'Failed to load balances',
            data: prev[itemId]?.data || null,
          },
        }));
      }
    } catch (e) {
      const statusCode = e?.response?.status;
      const msg =
        statusCode === 401 ? 'Session expired.' :
        statusCode === 403 ? 'Access denied.' :
        statusCode === 404 ? 'Item not found.' :
        e?.response?.data?.error || e?.message || 'Failed to load balances';

      setBalancesCache((prev) => ({
        ...prev,
        [itemId]: { loading: false, error: msg, data: prev[itemId]?.data || null },
      }));
    }
  }, []);

  const toggleItem = useCallback(
    (item) => {
      const id = item.id;
      if (!id) return;

      if (expandedId === id) {
        setExpandedId(null);
        return;
      }

      setExpandedId(id);

      const cached = balancesCache[id];
      const hasGoodData = cached && cached.data && !cached.error;
      if (!hasGoodData) {
        fetchBalancesForItem(id);
      }
    },
    [expandedId, balancesCache, fetchBalancesForItem]
  );

  // -----------------------------------------------------------------
  // Stock alert helpers
  // -----------------------------------------------------------------
  const getAlertForItem = useCallback(
    (item) => {
      if (!item) return null;
      const override = alertOverrides[item.id];
      if (override !== undefined) return override;
      return item.stockAlert || null;
    },
    [alertOverrides]
  );

  const openAlertModal = useCallback((item) => {
    const cfg = getAlertForItem(item);
    setAlertModalItem(item);
    setAlertModalValue(cfg?.threshold ? String(cfg.threshold) : '');
    setAlertModalError(null);
    setAlertModalSaving(false);
  }, [getAlertForItem]);

  const closeAlertModal = useCallback(() => {
    if (alertModalSaving) return;
    setAlertModalItem(null);
    setAlertModalValue('');
    setAlertModalError(null);
  }, [alertModalSaving]);

  const saveAlertModal = useCallback(async () => {
    if (!alertModalItem) return;

    const num = Number(alertModalValue);
    if (Number.isNaN(num) || num < 0) {
      setAlertModalError('Enter a non-negative number.');
      return;
    }

    setAlertModalSaving(true);
    setAlertModalError(null);

    try {
      const res = num === 0
        ? await mobileItemListService.clearStockAlert(alertModalItem.id)
        : await mobileItemListService.setStockAlert(alertModalItem.id, num);

      if (!res?.success) {
        setAlertModalError(res?.error || 'Failed to save');
        return;
      }

      const nextConfig = num === 0 ? null : { threshold: num };
      setAlertOverrides((prev) => ({ ...prev, [alertModalItem.id]: nextConfig }));
      closeAlertModal();
    } catch (e) {
      setAlertModalError(
        e?.response?.data?.error || e?.message || 'Failed to save'
      );
    } finally {
      setAlertModalSaving(false);
    }
  }, [alertModalItem, alertModalValue, closeAlertModal]);

  // -----------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading items…
        </Text>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // Balances block
  // -----------------------------------------------------------------
  const renderBalancesBlock = (item) => {
    const cached = balancesCache[item.id];

    if (!cached || (cached.loading && !cached.data)) {
      return (
        <View style={styles.expandLoading}>
          <ActivityIndicator size="small" color="#8B5CF6" />
          <Text style={[styles.expandLoadingText, { color: subTextColor }]}>
            Loading balances…
          </Text>
        </View>
      );
    }

    if (cached.error && !cached.data) {
      return (
        <TouchableOpacity
          onPress={() => fetchBalancesForItem(item.id)}
          activeOpacity={0.85}
          style={[
            styles.expandError,
            {
              backgroundColor: darkMode ? '#3B0A0A' : '#FEF2F2',
              borderColor: darkMode ? '#7F1D1D' : '#FCA5A5',
            },
          ]}
        >
          <Text
            style={[
              styles.expandErrorText,
              { color: darkMode ? '#FCA5A5' : '#991B1B' },
            ]}
          >
            ⚠️  {cached.error}   ·   tap to retry
          </Text>
        </TouchableOpacity>
      );
    }

    const data = cached.data;
    if (!data) return null;

    const { totals, stores } = data;
    const cfg = getAlertForItem(item);
    const threshold = cfg?.threshold ?? 0;

    return (
      <View style={[styles.expandWrap, { borderColor }]}>
        {/* ---------- Stock alert strip ---------- */}
        <View
          style={[
            styles.alertStrip,
            {
              backgroundColor: threshold > 0
                ? (darkMode ? '#312E81' : '#EEF2FF')
                : (darkMode ? '#0F172A' : '#F8FAFC'),
              borderColor: threshold > 0 ? '#8B5CF6' : borderColor,
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.alertStripLabel, { color: subTextColor }]}>
              STOCK ALERT
            </Text>
            <Text style={[styles.alertStripValue, { color: textColor }]} numberOfLines={1}>
              {threshold > 0
                ? `Notify when balance ≤ ${threshold}`
                : 'No alert set'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => openAlertModal(item)}
            activeOpacity={0.85}
            style={[
              styles.alertStripBtn,
              {
                backgroundColor: threshold > 0 ? '#8B5CF6' : (darkMode ? '#1E293B' : '#F1F5F9'),
                borderColor: threshold > 0 ? '#8B5CF6' : borderColor,
              },
            ]}
          >
            <Text
              style={[
                styles.alertStripBtnText,
                { color: threshold > 0 ? '#FFFFFF' : textColor },
              ]}
            >
              {threshold > 0 ? 'Edit' : 'Set'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------- Totals strip ---------- */}
        <View style={styles.expandTotalsRow}>
          <View style={styles.expandTotalsCell}>
            <Text style={[styles.expandTotalsValue, { color: '#8B5CF6' }]}>
              {totals.grandTotal}
            </Text>
            <Text style={[styles.expandTotalsLabel, { color: subTextColor }]}>
              Total
            </Text>
          </View>
          <View
            style={[styles.expandTotalsDivider, { backgroundColor: borderColor }]}
          />
          <View style={styles.expandTotalsCell}>
            <Text style={[styles.expandTotalsValue, { color: '#3B82F6' }]}>
              {totals.agreedStores}/{totals.stores}
            </Text>
            <Text style={[styles.expandTotalsLabel, { color: subTextColor }]}>
              Agreed
            </Text>
          </View>
          <View
            style={[styles.expandTotalsDivider, { backgroundColor: borderColor }]}
          />
          <View style={styles.expandTotalsCell}>
            <Text style={[styles.expandTotalsValue, { color: '#10B981' }]}>
              {totals.groups}
            </Text>
            <Text style={[styles.expandTotalsLabel, { color: subTextColor }]}>
              Groups
            </Text>
          </View>
        </View>

        {/* ---------- Stores ---------- */}
        {stores.length === 0 ? (
          <Text style={[styles.expandEmptyText, { color: subTextColor }]}>
            No store balances recorded for this item.
          </Text>
        ) : (
          stores.map((store) => {
            const isAgreed = !!store.isAgreed;
            const diff = Number(store.diff) || 0;
            const agreedValue =
              store.total != null ? store.total : null;

            return (
              <View
                key={store.storeId}
                style={[
                  styles.expandStoreCard,
                  {
                    borderColor: isAgreed
                      ? borderColor
                      : darkMode ? '#7F1D1D' : '#FECACA',
                  },
                ]}
              >
                {/* Store header */}
                <View style={styles.expandStoreHeader}>
                  <View
                    style={[
                      styles.expandStoreIcon,
                      {
                        backgroundColor: isAgreed ? '#3B82F620' : '#EF444420',
                      },
                    ]}
                  >
                    <Text style={styles.expandStoreIconText}>🏬</Text>
                  </View>

                  <View style={styles.expandStoreTitleBlock}>
                    <Text
                      style={[styles.expandStoreName, { color: textColor }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {store.storeName}
                    </Text>
                    {store.storeCode ? (
                      <Text
                        style={[styles.expandStoreCode, { color: subTextColor }]}
                        numberOfLines={1}
                      >
                        {store.storeCode}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.expandStoreTotalPill,
                      {
                        backgroundColor: isAgreed
                          ? darkMode ? '#1E293B' : '#F1F5F9'
                          : darkMode ? '#7F1D1D' : '#FEE2E2',
                        borderColor: isAgreed
                          ? borderColor
                          : '#EF4444',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.expandStoreTotalValue,
                        {
                          color: isAgreed
                            ? textColor
                            : darkMode ? '#FCA5A5' : '#991B1B',
                        },
                      ]}
                    >
                      {isAgreed ? agreedValue : '—'}
                    </Text>
                    <Text
                      style={[
                        styles.expandStoreTotalLabel,
                        {
                          color: isAgreed
                            ? subTextColor
                            : darkMode ? '#FCA5A5' : '#991B1B',
                        },
                      ]}
                    >
                      total
                    </Text>
                  </View>
                </View>

                {/* Verdict row */}
                <View
                  style={[
                    styles.expandVerdictRow,
                    {
                      backgroundColor: isAgreed
                        ? darkMode ? '#064E3B' : '#ECFDF5'
                        : darkMode ? '#7F1D1D' : '#FEE2E2',
                      borderColor: isAgreed ? '#10B981' : '#EF4444',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.expandVerdictText,
                      {
                        color: isAgreed
                          ? darkMode ? '#6EE7B7' : '#047857'
                          : darkMode ? '#FCA5A5' : '#991B1B',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {isAgreed
                      ? `✓ Agreed — ${agreedValue}`
                      : `✕ Inconclusive — diff ${diff}`}
                  </Text>
                  {!isAgreed ? (
                    <Text
                      style={[
                        styles.expandVerdictHint,
                        {
                          color: darkMode ? '#FCA5A5' : '#991B1B',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      excluded from total
                    </Text>
                  ) : null}
                </View>

                {/* Groups table */}
                {renderGroupsTable(store.groups, {
                  textColor,
                  subTextColor,
                  darkMode,
                  borderColor,
                  styles,
                })}
              </View>
            );
          })
        )}
      </View>
    );
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[styles.headerTitle, { color: textColor }]}
            numberOfLines={1}
          >
            Items
          </Text>
          <Text
            style={[styles.headerSub, { color: subTextColor }]}
            numberOfLines={1}
          >
            {items.length} of {total}
          </Text>
        </View>
      </View>

      {/* Summary strip */}
      <View
        style={[styles.summaryStrip, { backgroundColor: cardBg, borderColor }]}
      >
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
            {counts.total}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>Items</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {counts.active}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Active
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: '#94A3B8' }]}>
            {counts.inactive}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Inactive
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text
            style={[
              styles.summaryValue,
              { color: counts.noCost > 0 ? '#EF4444' : '#10B981' },
            ]}
          >
            {counts.noCost}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            No cost
          </Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or SKU"
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

      {/* Status filter */}
      <Text style={[styles.filterLabel, { color: subTextColor }]}>STATUS</Text>
      <View style={styles.pillRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
        >
          {STATUS_FILTERS.map((f) => {
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
                      ? '#8B5CF6'
                      : darkMode
                      ? '#1E293B'
                      : '#F1F5F9',
                    borderColor: active ? '#8B5CF6' : borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? '#FFFFFF' : textColor },
                  ]}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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

      {/* List */}
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item, idx) => String(item.id ?? item.sku ?? idx)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFirstPage({ silent: true })}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#8B5CF6" />
            </View>
          ) : hasMore ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Scroll for more…
            </Text>
          ) : items.length > 0 ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              End of list · {total} items
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No items found
            </Text>
            <Text style={[styles.emptyBody, { color: subTextColor }]}>
              {query || statusFilter !== 'all'
                ? 'Try a different search or filter.'
                : 'Items will appear here once inventoried.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          const cfg = getAlertForItem(item);
          const hasAlert = !!cfg && Number(cfg.threshold) > 0;

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: expanded ? '#8B5CF6' : borderColor,
                },
              ]}
            >
              <View style={styles.cardRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => toggleItem(item)}
                  style={styles.cardMain}
                >
                  <View style={styles.titleBlock}>
                    <Text
                      style={[styles.itemName, { color: textColor }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.name || 'Unnamed item'}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text
                        style={[styles.itemSku, { color: skuColor }]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {item.sku || '—'}
                      </Text>

                      {item.unit ? (
                        <>
                          <Text
                            style={[styles.metaSep, { color: subTextColor }]}
                          >
                            ·
                          </Text>
                          <Text
                            style={[styles.itemUnit, { color: uomColor }]}
                            numberOfLines={1}
                          >
                            {item.unit}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* ✅ Bell button */}
                <TouchableOpacity
                  onPress={() => openAlertModal(item)}
                  hitSlop={8}
                  activeOpacity={0.75}
                  style={[
                    styles.alertBtn,
                    {
                      borderColor: hasAlert ? '#8B5CF6' : borderColor,
                      backgroundColor: hasAlert
                        ? (darkMode ? '#312E81' : '#EEF2FF')
                        : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.alertBtnIcon}>
                    {hasAlert ? '🔔' : '🔕'}
                  </Text>
                </TouchableOpacity>

                <Text
                  style={[
                    styles.chevron,
                    { color: expanded ? '#8B5CF6' : subTextColor },
                  ]}
                >
                  {expanded ? '⌄' : '›'}
                </Text>
              </View>

              {expanded && renderBalancesBlock(item)}
            </View>
          );
        }}
      />

      {/* ============ Stock alert modal ============ */}
      <Modal
        visible={!!alertModalItem}
        transparent
        animationType="fade"
        onRequestClose={closeAlertModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.alertModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={closeAlertModal}
          />
          {alertModalItem && (
            <View
              style={[
                styles.alertModalCard,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              <View style={styles.alertModalHeader}>
                <View
                  style={[
                    styles.alertModalIconBubble,
                    { backgroundColor: '#8B5CF620' },
                  ]}
                >
                  <Text style={styles.alertModalIconText}>🔔</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.alertModalTitle, { color: textColor }]}
                    numberOfLines={2}
                  >
                    {alertModalItem.name}
                  </Text>
                  <Text style={[styles.alertModalSub, { color: subTextColor }]}>
                    Low-stock alert threshold
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.alertModalFieldLabel, { color: subTextColor }]}
              >
                THRESHOLD (in {alertModalItem.unit || 'units'})
              </Text>
              <TextInput
                value={alertModalValue}
                onChangeText={(v) => {
                  setAlertModalValue(v);
                  setAlertModalError(null);
                }}
                placeholder="e.g. 10"
                placeholderTextColor={subTextColor}
                keyboardType="decimal-pad"
                editable={!alertModalSaving}
                autoFocus
                style={[
                  styles.alertModalInput,
                  {
                    color: textColor,
                    backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                    borderColor: alertModalError ? '#EF4444' : borderColor,
                  },
                ]}
              />
              <Text style={[styles.alertModalHint, { color: subTextColor }]}>
                Set to 0 to disable the alert.
              </Text>

              {alertModalError && (
                <Text style={styles.alertModalError}>{alertModalError}</Text>
              )}

              <View style={styles.alertModalActions}>
                <TouchableOpacity
                  onPress={closeAlertModal}
                  activeOpacity={0.85}
                  disabled={alertModalSaving}
                  style={[
                    styles.alertModalBtn,
                    {
                      backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                      borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.alertModalBtnText, { color: textColor }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveAlertModal}
                  activeOpacity={0.85}
                  disabled={alertModalSaving}
                  style={[
                    styles.alertModalBtn,
                    { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
                  ]}
                >
                  {alertModalSaving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.alertModalBtnText, { color: '#FFFFFF' }]}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

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
  summaryValue: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  summaryLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryDivider: { width: 1, height: 28, opacity: 0.6 },

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
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
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
    maxWidth: 130,
  },
  filterPillText: { fontSize: 12, fontWeight: '800', flexShrink: 1 },

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

  footerLoader: { paddingVertical: 14, alignItems: 'center' },
  footerText: {
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  itemSku: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.2 },
  metaSep: { fontSize: 11, fontWeight: '700', opacity: 0.6 },
  itemUnit: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  alertBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  alertBtnIcon: { fontSize: 15 },

  chevron: {
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 8,
    marginTop: -2,
  },

  // ── Inline expansion ──
  expandLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  expandLoadingText: { fontSize: 12.5, fontWeight: '600' },

  expandError: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  expandErrorText: { fontSize: 12, fontWeight: '700' },

  expandWrap: {
    borderTopWidth: 1,
    padding: 12,
  },
  expandEmptyText: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 14,
    fontStyle: 'italic',
  },

  // ── Stock alert strip inside expansion ──
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  alertStripLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  alertStripValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  alertStripBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  alertStripBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  expandTotalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  expandTotalsCell: { flex: 1, alignItems: 'center' },
  expandTotalsValue: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  expandTotalsLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  expandTotalsDivider: { width: 1, height: 22, opacity: 0.5 },

  expandStoreCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  expandStoreHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  expandStoreIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  expandStoreIconText: { fontSize: 16 },

  expandStoreTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  expandStoreName: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  expandStoreCode: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  expandStoreTotalPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 54,
    flexShrink: 0,
    marginTop: 2,
  },
  expandStoreTotalValue: { fontSize: 13, fontWeight: '900' },
  expandStoreTotalLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  // ── Verdict row ──
  expandVerdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  expandVerdictText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  expandVerdictHint: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },

  // ── Groups table ──
  groupsTable: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  groupsTableEmpty: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 10,
    fontStyle: 'italic',
  },
  groupsTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  groupsTableValueRow: {
    flexDirection: 'row',
  },
  groupsCellBorderRight: {
    borderRightWidth: 1,
  },

  groupsHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsHeaderCellDiff: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  groupsValueCell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsValueCellDiff: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsValueBalance: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  // ── Stock alert modal ──
  alertModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  alertModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  alertModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  alertModalIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertModalIconText: { fontSize: 22 },
  alertModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  alertModalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  alertModalFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  alertModalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
  },
  alertModalHint: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 6,
    fontStyle: 'italic',
  },
  alertModalError: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 8,
  },
  alertModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  alertModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  alertModalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});``