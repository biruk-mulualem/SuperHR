// super-app/src/pages/stores/StoreDetailPage.js

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';

import mobileStoreListService from '../../stores/mobileStoreListService';

// ================================================================
// PAGINATION
// ================================================================

const PAGE_SIZE = 10;

// ✅ Trigger loading when 5 rows from the end (before reaching the last 10)
const END_THRESHOLD = 0.6;

// ================================================================
// DEFAULT GROUP LABELS (fallback if server doesn't send names)
// ================================================================

const DEFAULT_GROUP_A = 'Store IT';
const DEFAULT_GROUP_B = 'Storekeeper';

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function StoreDetailPage({
  store,
  onBack,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const storeId = store?.id ?? store?.storeId;

  // ---------- Data ----------
  const [header, setHeader] = useState(store || {});
  const [groupALabel, setGroupALabel] = useState(DEFAULT_GROUP_A);
  const [groupBLabel, setGroupBLabel] = useState(DEFAULT_GROUP_B);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalConflicts: 0,
    totalMatched: 0,
  });
  const [rows, setRows] = useState([]);

  // ---------- Pagination ----------
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // ---------- UI state ----------
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [conflictOnly, setConflictOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Info tooltip for the two group columns
  const [openGroupInfo, setOpenGroupInfo] = useState(null); // null | 'A' | 'B'

  // ---------- Refs to avoid stale closures / racing ----------
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const pageRef = useRef(1);
  const queryRef = useRef('');
  const conflictOnlyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keep refs in sync
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { queryRef.current = query; }, [query]);
  useEffect(() => { conflictOnlyRef.current = conflictOnly; }, [conflictOnly]);

  // -----------------------------------------------------------------
  // LOAD PAGE 1 (or refresh)
  // -----------------------------------------------------------------
  const loadFirstPage = useCallback(
    async ({ silent = false, q } = {}) => {
      try {
        if (silent) setRefreshing(true);
        else if (rows.length === 0) setLoading(true);
        setError(null);
        // ✅ Always reset the ref before a fresh page 1
        loadingMoreRef.current = false;
        setLoadingMore(false);

        const res = await mobileStoreListService.getStoreComparison(storeId, {
          page: 1,
          limit: PAGE_SIZE,
          q: q !== undefined ? q : queryRef.current.trim(),
          conflict: conflictOnlyRef.current ? 1 : 0,
        });

        if (!mountedRef.current) return;

        if (res?.success) {
          const data = res.data || {};

          setHeader(data.store || store || {});
          setGroupALabel(data.groups?.[0]?.name || DEFAULT_GROUP_A);
          setGroupBLabel(data.groups?.[1]?.name || DEFAULT_GROUP_B);

          setSummary(
            data.summary || { totalItems: 0, totalConflicts: 0, totalMatched: 0 }
          );

          setRows(Array.isArray(data.rows) ? data.rows : []);
          setPage(1);
          pageRef.current = 1;
          setHasMore(!!data.pagination?.hasMore);
          hasMoreRef.current = !!data.pagination?.hasMore;
        } else {
          setError(res?.error || 'Failed to load store details');
        }
      } catch (e) {
        if (!mountedRef.current) return;
        const status = e?.response?.status;
        if (status === 401) setError('Session expired. Please log in again.');
        else if (status === 403) setError('Access denied.');
        else if (e?.message?.includes('Network')) setError('Network error.');
        else
          setError(e?.response?.data?.error || e?.message || 'Failed to load');
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeId, store]
  );

  // -----------------------------------------------------------------
  // LOAD NEXT PAGE (append)
  // -----------------------------------------------------------------
  const loadMore = useCallback(async () => {
    // ✅ Guards: no double-fire, has more, and mounted
    if (!mountedRef.current) return;
    if (loadingMoreRef.current) return;
    if (!hasMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;

    try {
      const res = await mobileStoreListService.getStoreComparison(storeId, {
        page: nextPage,
        limit: PAGE_SIZE,
        q: queryRef.current.trim(),
        conflict: conflictOnlyRef.current ? 1 : 0,
      });

      if (!mountedRef.current) return;

      if (res?.success) {
        const newRows = Array.isArray(res.data?.rows) ? res.data.rows : [];
        setRows((prev) => [...prev, ...newRows]);
        setPage(nextPage);
        pageRef.current = nextPage;
        const more = !!res.data?.pagination?.hasMore;
        setHasMore(more);
        hasMoreRef.current = more;
      }
    } catch (e) {
      console.warn('[store detail] loadMore failed:', e?.message);
    } finally {
      // ✅ Always release the lock, even on error
      if (mountedRef.current) {
        setLoadingMore(false);
      }
      loadingMoreRef.current = false;
    }
  }, [storeId]);

  // -----------------------------------------------------------------
  // INITIAL LOAD
  // -----------------------------------------------------------------
  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------
  // RESET WHEN SEARCH / FILTER CHANGES (debounced for search)
  // -----------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      loadFirstPage();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, conflictOnly]);

  // -----------------------------------------------------------------
  // DERIVED
  // -----------------------------------------------------------------
  const headerStore = header;
  const visibleRows = rows;
  const conflictCount = summary.totalConflicts;
  const matchedCount = summary.totalMatched;
  const isActive = (headerStore.status || 'active') !== 'inactive';

  // -----------------------------------------------------------------
  // FULL-SCREEN LOADING (first paint only)
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View
        style={[
          styles.centerBox,
          { padding: 40, backgroundColor: darkMode ? '#102A43' : '#F8FAFC' },
        ]}
      >
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading store details…
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkMode ? '#102A43' : '#F8FAFC' },
      ]}
    >
      {/* =========================================================
          PINNED HEADER
          ========================================================= */}
      <View style={styles.pinnedHeader}>
        {/* HEADER BANNER */}
        <View
          style={[
            styles.headerBanner,
            { backgroundColor: darkMode ? '#17324D' : '#1E4A6D' },
          ]}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.headerIconWrap,
                { backgroundColor: 'rgba(16,185,129,0.18)' },
              ]}
            >
              <Text style={styles.headerIcon}>🏬</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headerStoreName} numberOfLines={2}>
                {headerStore.name || 'Store'}
              </Text>
              <Text style={styles.headerStoreMeta} numberOfLines={1}>
                {headerStore.code || '—'}
                {headerStore.location ? `  ·  ${headerStore.location}` : ''}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.headerStatusPill,
              {
                backgroundColor: isActive
                  ? 'rgba(16,185,129,0.18)'
                  : 'rgba(220,38,38,0.18)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text
              style={[
                styles.headerStatusText,
                { color: isActive ? '#6EE7B7' : '#FCA5A5' },
              ]}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* STAT CARDS */}
        <View style={styles.cardsRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.statCardValue, { color: '#3B82F6' }]} numberOfLines={1}>
              {summary.totalItems}
            </Text>
            <Text style={[styles.statCardLabel, { color: subTextColor }]}>Total Items</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.statCardValue, { color: '#DC2626' }]} numberOfLines={1}>
              {conflictCount}
            </Text>
            <Text style={[styles.statCardLabel, { color: subTextColor }]}>Conflicts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.statCardValue, { color: '#059669' }]} numberOfLines={1}>
              {matchedCount}
            </Text>
            <Text style={[styles.statCardLabel, { color: subTextColor }]}>Matched</Text>
          </View>
        </View>

        {/* SEARCH + FILTER */}
        <View style={[styles.searchFilterRow, { zIndex: 20 }]}>
          <View
            style={[
              styles.searchWrap,
              { flex: 1, backgroundColor: cardBg, borderColor },
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by item name"
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

          <View style={styles.filterContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilterOpen((v) => !v)}
              style={[styles.filterButton, { backgroundColor: cardBg, borderColor }]}
            >
              <Text
                style={[styles.filterButtonText, { color: textColor }]}
                numberOfLines={1}
              >
                {conflictOnly ? 'Conflicts' : 'All Items'}
              </Text>
              <Text style={[styles.filterArrow, { color: subTextColor }]}>
                {filterOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {filterOpen && (
              <View
                style={[
                  styles.filterDropdown,
                  { backgroundColor: cardBg, borderColor },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setConflictOnly(false);
                    setFilterOpen(false);
                  }}
                  style={[
                    styles.filterOption,
                    !conflictOnly && styles.filterOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: !conflictOnly ? '#2563EB' : textColor },
                    ]}
                  >
                    All Items
                  </Text>
                  {!conflictOnly && <Text style={styles.filterCheck}>✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setConflictOnly(true);
                    setFilterOpen(false);
                  }}
                  style={[
                    styles.filterOption,
                    conflictOnly && styles.filterOptionActiveConflict,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: conflictOnly ? '#DC2626' : textColor },
                    ]}
                  >
                    Conflicts Only
                  </Text>
                  {conflictOnly && (
                    <Text style={styles.filterCheckConflict}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* TABLE COLUMN HEADERS */}
        <View
          style={[
            styles.tableHeader,
            {
              borderColor,
              backgroundColor: darkMode ? '#17324D' : '#F1F5F9',
            },
          ]}
        >
          <Text style={[styles.th, styles.colItem, { color: subTextColor }]}>Item</Text>
          <Text style={[styles.th, styles.colUom, { color: subTextColor }]}>UOM</Text>

          {/* ✅ Group 1 — ⓘ icon + tap to show real name */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setOpenGroupInfo((v) => (v === 'A' ? null : 'A'))
            }
            style={[styles.thCol, styles.colBal]}
          >
            <View style={styles.thGroupRow}>
              <Text style={styles.thGroupIcon}>ⓘ</Text>
              <Text
                style={[styles.th, { color: subTextColor }]}
                numberOfLines={1}
              >
                Group 1
              </Text>
            </View>
          </TouchableOpacity>

          {/* ✅ Group 2 — ⓘ icon + tap to show real name */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setOpenGroupInfo((v) => (v === 'B' ? null : 'B'))
            }
            style={[styles.thCol, styles.colBal]}
          >
            <View style={styles.thGroupRow}>
              <Text style={styles.thGroupIcon}>ⓘ</Text>
              <Text
                style={[styles.th, { color: subTextColor }]}
                numberOfLines={1}
              >
                Group 2
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.th, styles.colDiff, { color: subTextColor }]}>Diff</Text>
        </View>

        {/* Tooltip — shows the real group name */}
       {/* Tooltip — shows the real group name, never wraps */}
{openGroupInfo && (
  <View
    style={[
      styles.groupInfoBox,
      {
        backgroundColor: darkMode ? '#1E293B' : '#EFF6FF',
        borderColor: darkMode ? '#334155' : '#BFDBFE',
      },
    ]}
  >
    <View style={styles.groupInfoTextBlock}>
      <Text style={[styles.groupInfoLabel, { color: subTextColor }]}>
        {openGroupInfo === 'A' ? 'Group 1' : 'Group 2'}
      </Text>
      <Text
        style={[styles.groupInfoName, { color: textColor }]}
        // ✅ no numberOfLines — the name never wraps or truncates
      >
        {openGroupInfo === 'A' ? groupALabel : groupBLabel}
      </Text>
    </View>

    <TouchableOpacity
      onPress={() => setOpenGroupInfo(null)}
      hitSlop={10}
      style={styles.groupInfoClose}
    >
      <Text style={[styles.groupInfoCloseText, { color: subTextColor }]}>
        ✕
      </Text>
    </TouchableOpacity>
  </View>
)}
      </View>

      {/* =========================================================
          SCROLLABLE ROW LIST
          ========================================================= */}
      <FlatList
        data={visibleRows}
        keyExtractor={(row) => String(row.key)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // ✅ Trigger earlier — see END_THRESHOLD constant
        onEndReached={loadMore}
        onEndReachedThreshold={END_THRESHOLD}
        // ✅ Smoothness props
        removeClippedSubviews
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setPage(1);
              pageRef.current = 1;
              loadFirstPage({ silent: true });
            }}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        ListEmptyComponent={
          <View style={styles.noResultsBox}>
            <Text style={[styles.noResultsText, { color: subTextColor }]}>
              {conflictOnly
                ? 'No conflicts found — all items match.'
                : query
                  ? `No items match "${query}".`
                  : 'No items in this store.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadMoreBox}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={[styles.loadMoreText, { color: subTextColor }]}>
                Loading more…
              </Text>
            </View>
          ) : hasMore ? (
            // ✅ Reserve space so onEndReached can fire again
            <View style={{ height: 40 }} />
          ) : (
            <View style={{ height: 12 }} />
          )
        }
        renderItem={({ item: row, index }) => {
          const zebra = index % 2 !== 0;

          return (
            <View
              style={[
                styles.tableRow,
                {
                  borderColor,
                  backgroundColor: zebra
                    ? darkMode
                      ? 'rgba(148,163,184,0.06)'
                      : 'rgba(100,116,139,0.045)'
                    : 'transparent',
                },
              ]}
            >
              <View style={styles.colItem}>
                <Text style={[styles.cellItemName, { color: textColor }]}>
                  {row.itemName}
                </Text>
              </View>

              <View style={styles.colUom}>
                <View
                  style={[
                    styles.uomTag,
                    { backgroundColor: darkMode ? '#1E3A5F' : '#DBEAFE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.uomTagText,
                      { color: darkMode ? '#93C5FD' : '#1D4ED8' },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="clip"
                  >
                    {row.uom || '—'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.cellBal, { color: '#3B82F6' }]} numberOfLines={1}>
                {formatNumber(row.groupA ?? 0)}
              </Text>

              <Text style={[styles.cellBal, { color: '#8B5CF6' }]} numberOfLines={1}>
                {formatNumber(row.groupB ?? 0)}
              </Text>

              <Text
                style={[
                  styles.cellDiff,
                  {
                    color: row.isConflict
                      ? darkMode ? '#FCA5A5' : '#DC2626'
                      : darkMode ? '#6EE7B7' : '#059669',
                  },
                ]}
                numberOfLines={1}
              >
                {row.differenceLabel}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

// ================================================================
// FORMAT NUMBER
// ================================================================

function formatNumber(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },

  centerBox: { alignItems: 'center', justifyContent: 'center', minHeight: 260 },
  loadingText: { marginTop: 10, fontSize: 12, fontWeight: '500' },

  pinnedHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 0,
    position: 'relative',
  },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },

  headerBanner: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: { fontSize: 22 },
  headerStoreName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerStoreMeta: {
    color: '#B9CCE0',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
  },
  headerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  headerStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statCardValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  statCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    position: 'relative',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  clearIcon: { fontSize: 13, fontWeight: '700', padding: 4 },

  filterContainer: { width: 125, position: 'relative', zIndex: 30 },
  filterButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButtonText: { fontSize: 11, fontWeight: '700' },
  filterArrow: { fontSize: 9, marginLeft: 5 },
  filterDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 100,
  },
  filterOption: {
    minHeight: 42,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterOptionActive: { backgroundColor: '#EFF6FF' },
  filterOptionActiveConflict: { backgroundColor: '#FEF2F2' },
  filterOptionText: { fontSize: 11, fontWeight: '700' },
  filterCheck: { color: '#2563EB', fontSize: 14, fontWeight: '900' },
  filterCheckConflict: { color: '#DC2626', fontSize: 14, fontWeight: '900' },

  // ---------- TABLE ----------

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 1,
  },
  th: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  thCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  thGroupIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3B82F6',
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },

  colItem: { width: '31%', minWidth: 0, paddingRight: 4 },
  colUom: { width: '13%', alignItems: 'center', justifyContent: 'center' },
  colBal: { width: '22%', alignItems: 'center', paddingHorizontal: 2 },
  colDiff: { width: '12%', textAlign: 'center' },

  cellItemName: { fontSize: 11.5, fontWeight: '700', lineHeight: 15 },

  uomTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    minWidth: 34,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  uomTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    includeFontPadding: false,
  },

  cellBal: {
    width: '22%',
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '800',
    paddingHorizontal: 2,
  },
  cellDiff: {
    width: '12%',
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '800',
  },

  noResultsBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'transparent',
  },
  noResultsText: {
    fontSize: 11.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  loadMoreBox: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'transparent',
  },
  loadMoreText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ---------- GROUP TOOLTIP ----------

groupInfoBox: {
  position: 'absolute',
  top: 210,
  alignSelf: 'center',
  minWidth: 170,
  maxWidth: '96%',              // ← generous but bounded
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 10,
  borderWidth: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  shadowColor: '#64748B',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 8,
  elevation: 6,
  zIndex: 200,
},
groupInfoTextBlock: {
  flexShrink: 1,                // ← lets the text block shrink to fit
  minWidth: 0,
},
groupInfoLabel: {
  fontSize: 9.5,
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
},
groupInfoName: {
  fontSize: 13,
  fontWeight: '800',
  marginTop: 2,
  // ✅ no width cap, no ellipsize — text always renders full
},
groupInfoClose: {
  padding: 2,
  marginLeft: 6,
},
groupInfoCloseText: {
  fontSize: 12,
  fontWeight: '800',
},
});