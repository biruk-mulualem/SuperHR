// super-app/src/pages/stores/BalanceAuditPage.js
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
} from 'react-native';

import mobileManagerBalanceAuditService from '../../stores/mobileManagerBalanceAuditService';

// ================================================================
// CONSTANTS
// ================================================================
const AUDIT_FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'matched',    label: 'Matched'    },
  { key: 'conflicted', label: 'Conflicts'  },
];

const ITEM_FILTERS = [
  { key: 'all',        label: 'All'        },
  { key: 'conflicted', label: 'Conflicts'  },
  { key: 'matched',    label: 'Matched'    },
];

const C_OK       = '#10B981';
const C_CONFLICT = '#EF4444';
const C_NEUTRAL  = '#8B5CF6';

const STORE_PAGE_SIZE = 10;
const ITEM_PAGE_SIZE  = 10;

const itemDiff = (item) =>
  Number(item?.groupA?.balance ?? 0) - Number(item?.groupB?.balance ?? 0);

const formatDiff = (n) => String(n);

export default function BalanceAuditPage({
  onNavigateToStoreDetail,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMoreStores, setLoadingMoreStores] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [auditFilter, setAuditFilter] = useState('all');
  const [expandedStoreId, setExpandedStoreId] = useState(null);

  // Server-side pagination for stores
  const [storePage, setStorePage] = useState(1);
  const [storesHasMore, setStoresHasMore] = useState(false);
  const [storesTotal, setStoresTotal] = useState(0);

  // ── Global summary — decoupled from the loaded page ──
  // Refreshed on mount + pull-to-refresh ONLY.
  // Never changes when you scroll or switch filters.
  const [globalSummary, setGlobalSummary] = useState({
    storesUnderAudit: 0,
    itemsAudited: 0,
    matched: 0,
    conflicted: 0,
    storesWithConflicts: 0,
  });

  // Per-store item state — loaded lazily from the API
  const [storeItemState, setStoreItemState] = useState({});

  // Per-store item search — { [storeId]: 'text' }
  const [storeItemQueries, setStoreItemQueries] = useState({});

  const storeLoadingRef = useRef(false);
  const itemLoadingRef = useRef({});
  const listRef = useRef(null);
  const fetchGenRef = useRef(0);
  const searchDebounceRef = useRef({});

  // -----------------------------------------------------------------
  // LOAD GLOBAL SUMMARY — independent of pagination and filters
  // -----------------------------------------------------------------
  const loadSummary = useCallback(async () => {
    try {
      const res = await mobileManagerBalanceAuditService.getSummary();
      if (res?.success) {
        setGlobalSummary({
          storesUnderAudit: res.data?.storesUnderAudit || 0,
          itemsAudited: res.data?.itemsAudited || 0,
          matched: res.data?.matched || 0,
          conflicted: res.data?.conflicted || 0,
          storesWithConflicts: res.data?.storesWithConflicts || 0,
        });
      }
    } catch (e) {
      console.warn('[balance-audit] loadSummary failed:', e?.message);
    }
  }, []);

  // Fire once on mount
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // -----------------------------------------------------------------
  // LOAD STORES (page 1)
  // -----------------------------------------------------------------
  const loadStores = useCallback(
    async ({ silent = false } = {}) => {
      const myGen = ++fetchGenRef.current;

      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const res = await mobileManagerBalanceAuditService.getStores({
          page: 1,
          limit: STORE_PAGE_SIZE,
          q: query.trim(),
          audit: auditFilter,
        });

        if (myGen !== fetchGenRef.current) return;

        if (!res?.success) {
          setError(res?.error || 'Failed to load stores');
          return;
        }

        setStores(res.data.stores || []);
        setStorePage(1);
        setStoresHasMore(!!res.data.pagination?.hasMore);
        setStoresTotal(res.data.pagination?.total || 0);

        // Fresh store list → drop per-store item caches
        setStoreItemState({});
        setStoreItemQueries({});
      } catch (e) {
        if (myGen !== fetchGenRef.current) return;
        setError(e?.message || 'Failed to load');
      } finally {
        if (myGen === fetchGenRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [query, auditFilter]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      loadStores({ silent: true });
    }, query ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, auditFilter]);

  // -----------------------------------------------------------------
  // LOAD MORE STORES
  // -----------------------------------------------------------------
  const loadMoreStores = useCallback(async () => {
    if (storeLoadingRef.current) return;
    if (!storesHasMore) return;

    const myGen = fetchGenRef.current;
    storeLoadingRef.current = true;
    setLoadingMoreStores(true);

    try {
      const next = storePage + 1;
      const res = await mobileManagerBalanceAuditService.getStores({
        page: next,
        limit: STORE_PAGE_SIZE,
        q: query.trim(),
        audit: auditFilter,
      });

      if (myGen !== fetchGenRef.current) return;
      if (!res?.success) return;

      setStores((prev) => [...prev, ...(res.data.stores || [])]);
      setStorePage(next);
      setStoresHasMore(!!res.data.pagination?.hasMore);
      setStoresTotal(res.data.pagination?.total || 0);
    } catch (e) {
      console.warn('[balance-audit] loadMoreStores failed:', e?.message);
    } finally {
      setLoadingMoreStores(false);
      storeLoadingRef.current = false;
    }
  }, [storePage, storesHasMore, query, auditFilter]);

  const handleEndReached = useCallback(() => {
    if (storeLoadingRef.current) return;
    if (!storesHasMore) return;
    loadMoreStores();
  }, [storesHasMore, loadMoreStores]);

  // -----------------------------------------------------------------
  // FETCH ITEMS FOR ONE STORE
  // -----------------------------------------------------------------
  const fetchStoreItemsWithFilter = useCallback(
    async (storeId, filter, q, { page = 1, append = false } = {}) => {
      if (itemLoadingRef.current[storeId]) return;
      itemLoadingRef.current[storeId] = true;

      setStoreItemState((prev) => ({
        ...prev,
        [storeId]: {
          ...prev[storeId],
          loading: !append,
          loadingMore: append,
          error: null,
          filter,
          q,
          items: append ? prev[storeId]?.items || [] : [],
        },
      }));

      try {
        const res = await mobileManagerBalanceAuditService.getStoreItems(storeId, {
          page,
          limit: ITEM_PAGE_SIZE,
          filter,
          q,
        });

        if (!res?.success) {
          setStoreItemState((prev) => ({
            ...prev,
            [storeId]: {
              ...prev[storeId],
              loading: false,
              loadingMore: false,
              error: res?.error || 'Failed to load items',
            },
          }));
          return;
        }

        setStoreItemState((prev) => {
          const before = prev[storeId]?.items || [];
          const incoming = res.data.items || [];
          return {
            ...prev,
            [storeId]: {
              items: append ? [...before, ...incoming] : incoming,
              loading: false,
              loadingMore: false,
              error: null,
              filter,
              q,
              page,
              hasMore: !!res.data.pagination?.hasMore,
              total: res.data.pagination?.total || incoming.length,
            },
          };
        });
      } catch (e) {
        setStoreItemState((prev) => ({
          ...prev,
          [storeId]: {
            ...prev[storeId],
            loading: false,
            loadingMore: false,
            error: e?.message || 'Failed to load items',
          },
        }));
      } finally {
        itemLoadingRef.current[storeId] = false;
      }
    },
    []
  );

  const loadMoreItems = useCallback(
    (storeId) => {
      const st = storeItemState[storeId];
      if (!st?.hasMore) return;
      if (itemLoadingRef.current[storeId]) return;
      fetchStoreItemsWithFilter(storeId, st.filter ?? 'all', st.q ?? '', {
        page: (st.page || 1) + 1,
        append: true,
      });
    },
    [storeItemState, fetchStoreItemsWithFilter]
  );

  // -----------------------------------------------------------------
  // INTERACTION
  // -----------------------------------------------------------------
  const handleToggleStore = useCallback(
    (store) => {
      const storeKey = store.id ?? store.name;
      const isExpanded = expandedStoreId === storeKey;
      setExpandedStoreId(isExpanded ? null : storeKey);

      if (!isExpanded && !storeItemState[storeKey]?.items?.length) {
        const defaultFilter =
          (store.conflictedItems ?? 0) > 0 ? 'conflicted' : 'all';

        setStoreItemQueries((prev) => ({ ...prev, [storeKey]: '' }));
        fetchStoreItemsWithFilter(storeKey, defaultFilter, '');
      }
    },
    [expandedStoreId, storeItemState, fetchStoreItemsWithFilter]
  );

  const setLocalFilter = useCallback(
    (storeId, filter) => {
      fetchStoreItemsWithFilter(storeId, filter, storeItemQueries[storeId] || '');
    },
    [fetchStoreItemsWithFilter, storeItemQueries]
  );

  const setStoreItemQuery = useCallback(
    (storeId, value) => {
      setStoreItemQueries((prev) => ({ ...prev, [storeId]: value }));

      if (searchDebounceRef.current[storeId]) {
        clearTimeout(searchDebounceRef.current[storeId]);
      }
      searchDebounceRef.current[storeId] = setTimeout(() => {
        const filter = storeItemState[storeId]?.filter ?? 'all';
        fetchStoreItemsWithFilter(storeId, filter, value);
      }, 300);
    },
    [fetchStoreItemsWithFilter, storeItemState]
  );

  const getStoreItemQuery = (storeId) => storeItemQueries[storeId] ?? '';

  // -----------------------------------------------------------------
  // LOADING
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color={C_NEUTRAL} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading audit…
        </Text>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Header — uses globalSummary, not the loaded page */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Balance Audit
          </Text>
          <Text style={[styles.headerSub, { color: subTextColor }]}>
            {globalSummary.storesWithConflicts > 0
              ? `${globalSummary.storesWithConflicts} ${
                  globalSummary.storesWithConflicts === 1 ? 'store has' : 'stores have'
                } conflicts`
              : 'All stores matched'}
          </Text>
        </View>
      </View>

      {/* Summary strip — uses globalSummary, stays static across filter/scroll */}
      <View
        style={[styles.summaryStrip, { backgroundColor: cardBg, borderColor }]}
      >
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: C_NEUTRAL }]}>
            {globalSummary.storesUnderAudit}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]} numberOfLines={2}>
            Stores under audit
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: C_OK }]}>
            {globalSummary.matched}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]} numberOfLines={2}>
            Matched
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text
            style={[
              styles.summaryValue,
              { color: globalSummary.conflicted > 0 ? C_CONFLICT : '#94A3B8' },
            ]}
          >
            {globalSummary.conflicted}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]} numberOfLines={2}>
            Conflicts
          </Text>
        </View>
      </View>

      {/* Global Search */}
      <View
        style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by store name or location"
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

      {/* Global filter pills */}
      <Text style={[styles.filterLabel, { color: subTextColor }]}>
        AUDIT STATUS
      </Text>
      <View style={styles.pillRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScroll}
        >
          {AUDIT_FILTERS.map((f) => {
            const active = auditFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setAuditFilter(f.key)}
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
                  numberOfLines={1}
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
          onPress={() => loadStores()}
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

      {/* Store list */}
      <FlatList
        ref={listRef}
        data={stores}
        keyExtractor={(item, idx) => String(item.id ?? item.name ?? idx)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={STORE_PAGE_SIZE}
        maxToRenderPerBatch={STORE_PAGE_SIZE}
        windowSize={5}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              await loadStores({ silent: true });
              await loadSummary();
            }}
            colors={[C_NEUTRAL]}
            tintColor={C_NEUTRAL}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMoreStores ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={C_NEUTRAL} />
            </View>
          ) : storesHasMore ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Scroll for more stores…
            </Text>
          ) : stores.length > 0 ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              End of list · {stores.length}{' '}
              {stores.length === 1 ? 'store' : 'stores'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>⚖️</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              Nothing to audit
            </Text>
            <Text style={[styles.emptyBody, { color: subTextColor }]}>
              {query || auditFilter !== 'all'
                ? 'No stores match this search or filter.'
                : 'Items and their group balances will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item: store }) => {
          const storeKey = store.id ?? store.name;
          const isExpanded = expandedStoreId === storeKey;
          const storeConflicts = store.conflictedItems || 0;
          const storeMatched = store.matchedItems || 0;
          const storeTotalItems = store.totalItems || 0;

          const itemState = storeItemState[storeKey] || {};
          const itemQuery = getStoreItemQuery(storeKey);
          const localFilter = itemState.filter ?? (storeConflicts > 0 ? 'conflicted' : 'all');

          const displayItems = itemState.items || [];
          const itemsLoading = !!itemState.loading;
          const itemsLoadingMore = !!itemState.loadingMore;
          const itemsError = itemState.error;
          const itemsHasMore = !!itemState.hasMore;
          const itemsTotal = itemState.total ?? displayItems.length;

          return (
            <View
              style={[
                styles.storeBlock,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleToggleStore(store)}
                style={styles.storeRow}
              >
                <View
                  style={[
                    styles.accentStrip,
                    { backgroundColor: storeConflicts > 0 ? C_CONFLICT : C_OK },
                  ]}
                />
                <View style={styles.storeBody}>
                  <Text
                    style={[styles.storeName, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {store.name || 'Unnamed store'}
                  </Text>
                  <Text
                    style={[styles.storeMeta, { color: subTextColor }]}
                    numberOfLines={1}
                  >
                    {store.location || '—'} · {storeTotalItems}{' '}
                    {storeTotalItems === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                {storeConflicts > 0 ? (
                  <View
                    style={[
                      styles.conflictPill,
                      { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.conflictPillText,
                        { color: darkMode ? '#FCA5A5' : '#991B1B' },
                      ]}
                    >
                      {storeConflicts} conflict{storeConflicts === 1 ? '' : 's'}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.matchedPill,
                      { backgroundColor: darkMode ? '#064E3B' : '#ECFDF5' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.matchedPillText,
                        { color: darkMode ? '#6EE7B7' : '#047857' },
                      ]}
                    >
                      Matched
                    </Text>
                  </View>
                )}

                <Text style={[styles.chevron, { color: subTextColor }]}>
                  {isExpanded ? '▾' : '▸'}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View
                  style={[
                    styles.itemsWrap,
                    { borderTopColor: darkMode ? '#334155' : '#F1F5F9' },
                  ]}
                >
                  {/* Item-level filter pills */}
                  <View style={styles.localFilterWrap}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.localFilterScroll}
                    >
                      {ITEM_FILTERS.map((f) => {
                        const active = localFilter === f.key;
                        const count =
                          f.key === 'all'
                            ? storeTotalItems
                            : f.key === 'conflicted'
                            ? storeConflicts
                            : storeMatched;
                        const isConf = f.key === 'conflicted';
                        const isMatch = f.key === 'matched';
                        const activeBg = isConf
                          ? C_CONFLICT
                          : isMatch
                          ? C_OK
                          : C_NEUTRAL;

                        return (
                          <TouchableOpacity
                            key={f.key}
                            onPress={() => setLocalFilter(storeKey, f.key)}
                            activeOpacity={0.8}
                            style={[
                              styles.localFilterPill,
                              {
                                backgroundColor: active
                                  ? activeBg
                                  : darkMode
                                  ? '#1E293B'
                                  : '#F1F5F9',
                                borderColor: active ? activeBg : borderColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.localFilterPillText,
                                {
                                  color: active ? '#FFFFFF' : textColor,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {f.label} ({count})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Sub-search */}
                  <View
                    style={[
                      styles.subSearchWrap,
                      {
                        backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={styles.subSearchIcon}>🔎</Text>
                    <TextInput
                      value={itemQuery}
                      onChangeText={(v) => setStoreItemQuery(storeKey, v)}
                      placeholder={`Search items in ${store.name || 'this store'}`}
                      placeholderTextColor={subTextColor}
                      style={[styles.subSearchInput, { color: textColor }]}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    {itemQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setStoreItemQuery(storeKey, '')}
                        hitSlop={8}
                      >
                        <Text
                          style={[styles.subSearchClear, { color: subTextColor }]}
                        >
                          ✕
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={[styles.subSearchMeta, { color: subTextColor }]}>
                    {itemsLoading
                      ? 'Loading…'
                      : itemQuery
                      ? `${displayItems.length} match${displayItems.length === 1 ? '' : 'es'}`
                      : `${displayItems.length} of ${itemsTotal} shown`}
                  </Text>

                  {itemsLoading ? (
                    <View style={styles.loadingItemsBox}>
                      <ActivityIndicator size="small" color={C_NEUTRAL} />
                    </View>
                  ) : itemsError ? (
                    <View style={styles.noItemsBox}>
                      <Text style={[styles.noItemsText, { color: C_CONFLICT }]}>
                        {itemsError}
                      </Text>
                    </View>
                  ) : displayItems.length === 0 ? (
                    <View style={styles.noItemsBox}>
                      <Text style={[styles.noItemsText, { color: subTextColor }]}>
                        {itemQuery
                          ? `No items match “${itemQuery}” with this filter.`
                          : localFilter === 'conflicted'
                          ? 'No conflicts in this store.'
                          : localFilter === 'matched'
                          ? 'No matched items in this store.'
                          : 'No items to show.'}
                      </Text>
                    </View>
                  ) : (
                    displayItems.map((it, idx) => {
                      const diff = it.diff ?? itemDiff(it);
                      const hasConflict = it.hasConflict ?? diff !== 0;
                      const itemNumber = idx + 1;
                      const a = Number(it.groupA?.balance ?? 0);
                      const b = Number(it.groupB?.balance ?? 0);

                      return (
                        <View
                          key={it.itemId ?? it.id ?? it.itemCode ?? idx}
                          style={[
                            styles.itemCard,
                            {
                              backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                              borderColor: hasConflict
                                ? darkMode ? '#7F1D1D' : '#FECACA'
                                : darkMode ? '#334155' : '#E2E8F0',
                            },
                          ]}
                        >
                          <View style={styles.itemHeaderRow}>
                            <View
                              style={[
                                styles.itemNumberChip,
                                {
                                  backgroundColor: darkMode ? '#312E81' : '#EEF2FF',
                                  borderColor: darkMode ? '#4338CA' : '#C7D2FE',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.itemNumberText,
                                  { color: darkMode ? '#C7D2FE' : '#4338CA' },
                                ]}
                              >
                                {itemNumber}
                              </Text>
                            </View>

                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={[styles.itemName, { color: textColor }]}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                              >
                                {it.itemName || it.name || 'Unnamed item'}
                              </Text>

                              <View style={styles.itemMetaRow}>
                                {it.itemCode ? (
                                  <Text
                                    style={[styles.itemCode, { color: subTextColor }]}
                                    numberOfLines={1}
                                  >
                                    {it.itemCode}
                                  </Text>
                                ) : null}
                                {it.uom ? (
                                  <View
                                    style={[
                                      styles.uomChip,
                                      {
                                        backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                                        borderColor: darkMode ? '#334155' : '#E2E8F0',
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.uomChipText,
                                        { color: subTextColor },
                                      ]}
                                    >
                                      {String(it.uom).toUpperCase()}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.groupTable,
                              { borderColor: darkMode ? '#334155' : '#E2E8F0' },
                            ]}
                          >
                            <View
                              style={[
                                styles.groupTableHeaderRow,
                                {
                                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                                  borderBottomColor: darkMode ? '#334155' : '#E2E8F0',
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.groupHeaderCell,
                                  styles.cellBorderRight,
                                  { borderRightColor: darkMode ? '#334155' : '#E2E8F0' },
                                ]}
                              >
                                <Text
                                  style={[styles.groupHeaderText, { color: subTextColor }]}
                                  numberOfLines={1}
                                >
                                  {(it.groupA?.name || 'GROUP 1').toUpperCase()}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.groupHeaderCell,
                                  styles.cellBorderRight,
                                  { borderRightColor: darkMode ? '#334155' : '#E2E8F0' },
                                ]}
                              >
                                <Text
                                  style={[styles.groupHeaderText, { color: subTextColor }]}
                                  numberOfLines={1}
                                >
                                  {(it.groupB?.name || 'GROUP 2').toUpperCase()}
                                </Text>
                              </View>

                              <View style={styles.diffHeaderCell}>
                                <Text
                                  style={[styles.groupHeaderText, { color: subTextColor }]}
                                  numberOfLines={1}
                                >
                                  DIFF
                                </Text>
                              </View>
                            </View>

                            <View style={styles.groupTableValueRow}>
                              <View
                                style={[
                                  styles.groupValueCell,
                                  styles.cellBorderRight,
                                  { borderRightColor: darkMode ? '#334155' : '#E2E8F0' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.groupValueText,
                                    { color: hasConflict ? C_CONFLICT : textColor },
                                  ]}
                                >
                                  {a}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.groupValueCell,
                                  styles.cellBorderRight,
                                  { borderRightColor: darkMode ? '#334155' : '#E2E8F0' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.groupValueText,
                                    { color: hasConflict ? C_CONFLICT : textColor },
                                  ]}
                                >
                                  {b}
                                </Text>
                              </View>

                              <View style={styles.diffValueCell}>
                                <Text
                                  style={[
                                    styles.groupValueText,
                                    { color: hasConflict ? C_CONFLICT : C_OK },
                                  ]}
                                >
                                  {formatDiff(diff)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}

                  {itemsHasMore && !itemsLoading && (
                    <TouchableOpacity
                      onPress={() => loadMoreItems(storeKey)}
                      activeOpacity={0.7}
                      style={styles.loadMoreItemsBtn}
                      disabled={itemsLoadingMore}
                    >
                      {itemsLoadingMore ? (
                        <ActivityIndicator size="small" color={C_NEUTRAL} />
                      ) : (
                        <>
                          <Text
                            style={[styles.loadMoreItemsText, { color: C_NEUTRAL }]}
                          >
                            Load more items ›
                          </Text>
                          <Text
                            style={[
                              styles.loadMoreItemsSub,
                              { color: subTextColor },
                            ]}
                          >
                            {displayItems.length} of {itemsTotal} shown
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {!itemsHasMore && displayItems.length > ITEM_PAGE_SIZE && (
                    <Text style={[styles.footerText, { color: subTextColor }]}>
                      End · {displayItems.length} items
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

// ================================================================
// STYLES (unchanged)
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
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

  storeBlock: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  accentStrip: { width: 4, alignSelf: 'stretch' },
  storeBody: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    minWidth: 0,
  },
  storeName: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  storeMeta: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  conflictPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  conflictPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  matchedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  matchedPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  chevron: { fontSize: 14, fontWeight: '900', marginLeft: 4 },

  itemsWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },

  localFilterWrap: { marginBottom: 6 },
  localFilterScroll: {
    gap: 6,
    paddingRight: 4,
    alignItems: 'center',
  },
  localFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 160,
  },
  localFilterPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  subSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 4,
  },
  subSearchIcon: { fontSize: 13 },
  subSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  subSearchClear: {
    fontSize: 13,
    fontWeight: '700',
    padding: 4,
  },
  subSearchMeta: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  noItemsBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  loadingItemsBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  itemNumberChip: {
    minWidth: 26,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 17,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  itemCode: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  uomChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  uomChipText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  groupTable: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  groupTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  groupTableValueRow: {
    flexDirection: 'row',
  },
  groupHeaderCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffHeaderCell: {
    width: 60,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  groupValueCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffValueCell: {
    width: 60,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupValueText: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  cellBorderRight: {
    borderRightWidth: 1,
  },

  loadMoreItemsBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadMoreItemsText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  loadMoreItemsSub: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.3,
  },
});