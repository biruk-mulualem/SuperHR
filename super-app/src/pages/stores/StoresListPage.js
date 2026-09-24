// super-app/src/pages/stores/StoresListPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';

import mobileStoreListService from '../../stores/mobileStoreListService';

const PAGE_SIZE = 10;

const FILTERS = [
  { key: 'all',      label: 'All'      },
  { key: 'active',   label: 'Active'   },
  { key: 'inactive', label: 'Inactive' },
];

export default function StoresListPage({
  onNavigateToDetail,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);         // initial load only
  const [refreshing, setRefreshing] = useState(false);  // pull-to-refresh
  const [loadingMore, setLoadingMore] = useState(false); // next-page spinner
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Guard against parallel "load more" calls from rapid scroll events
  const isLoadingMoreRef = useRef(false);

  // -----------------------------------------------------------------
  // FETCH — page 1 (or refresh)
  // -----------------------------------------------------------------
  const loadFirstPage = useCallback(
    async ({ silent = false, status, q } = {}) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);
        setError(null);
        isLoadingMoreRef.current = false;

        const res = await mobileStoreListService.getStoreSummary({
          page: 1,
          limit: PAGE_SIZE,
          status: status !== undefined ? status : filter,
          q: q !== undefined ? q : query.trim(),
        });

        if (res?.success) {
          const list = Array.isArray(res.data?.stores) ? res.data.stores : [];
          setStores(
            list.map((s) => ({
              ...s,
              items: Number(s.items ?? 0),
              groups: Array.isArray(s.groups) ? s.groups : [],
              status: s.status || 'active',
            }))
          );
          setPage(1);
          setHasMore(res.data?.pagination?.hasMore ?? false);
          setTotal(res.data?.pagination?.total ?? list.length);
        } else {
          setError(res?.error || 'Failed to load stores');
        }
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) setError('Session expired. Please log in again.');
        else if (status === 403) setError('Access denied.');
        else if (e?.message?.includes('Network')) setError('Network error.');
        else
          setError(e?.response?.data?.error || e?.message || 'Failed to load');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, query]
  );

  // -----------------------------------------------------------------
  // FETCH — next page (append)
  // -----------------------------------------------------------------
  const loadNextPage = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMore) return;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await mobileStoreListService.getStoreSummary({
        page: nextPage,
        limit: PAGE_SIZE,
        status: filter,
        q: query.trim(),
      });

      if (res?.success) {
        const list = Array.isArray(res.data?.stores) ? res.data.stores : [];
        setStores((prev) => [
          ...prev,
          ...list.map((s) => ({
            ...s,
            items: Number(s.items ?? 0),
            groups: Array.isArray(s.groups) ? s.groups : [],
            status: s.status || 'active',
          })),
        ]);
        setPage(nextPage);
        setHasMore(res.data?.pagination?.hasMore ?? false);
        setTotal(res.data?.pagination?.total ?? stores.length + list.length);
      }
    } catch (e) {
      // Non-fatal — keep whatever we already have
      console.warn('[stores] loadNextPage failed:', e?.message);
    } finally {
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [page, hasMore, filter, query]);

  // -----------------------------------------------------------------
  // INITIAL LOAD
  // -----------------------------------------------------------------
  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------
  // RESET when filter / search change
  // -----------------------------------------------------------------
  useEffect(() => {
    // debounce search a bit
    const t = setTimeout(() => {
      loadFirstPage();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query]);

  // -----------------------------------------------------------------
  // DERIVED
  // -----------------------------------------------------------------
  const totalGroups = useMemo(
    () =>
      stores.reduce(
        (sum, s) => sum + ((s.groups && s.groups.length) || 0),
        0
      ),
    [stores]
  );

  const totalActive = useMemo(
    () => stores.filter((s) => s.status !== 'inactive').length,
    [stores]
  );

  // -----------------------------------------------------------------
  // LOADING (first paint)
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.centerBox, { padding: 40 }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading stores…
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
            Stores
          </Text>
          <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
            {stores.length} of {total}
          </Text>
        </View>
      </View>

      {/* Summary strip — reflects CURRENT page, not the whole DB */}
      <View
        style={[styles.summaryStrip, { backgroundColor: cardBg, borderColor }]}
      >
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {total}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Stores
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>
            {totalActive}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Active
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
            {totalGroups}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Groups
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
          placeholder="Search by name or location"
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
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active
                    ? '#10B981'
                    : darkMode
                    ? '#1E293B'
                    : '#F1F5F9',
                  borderColor: active ? '#10B981' : borderColor,
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

      {/* List */}
      <FlatList
        data={stores}
        keyExtractor={(item, idx) => String(item.id ?? item.name ?? idx)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFirstPage({ silent: true })}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        onEndReached={() => {
          if (hasMore && !loadingMore) loadNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerBox}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={[styles.footerText, { color: subTextColor }]}>
                Loading more…
              </Text>
            </View>
          ) : !hasMore && stores.length > PAGE_SIZE ? (
            <View style={styles.footerBox}>
              <Text style={[styles.footerText, { color: subTextColor }]}>
                End of list
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🏬</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No stores found
            </Text>
            <Text style={[styles.emptyBody, { color: subTextColor }]}>
              {query || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'No stores available.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = item.status !== 'inactive';
          const groupCount = (item.groups || []).length;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onNavigateToDetail?.(item)}
              style={[styles.card, { backgroundColor: cardBg, borderColor }]}
            >
              <View
                style={[
                  styles.cardAccent,
                  { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
                ]}
              />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: darkMode ? '#064E3B' : '#ECFDF5',
                      },
                    ]}
                  >
                    <Text style={styles.iconText}>🏬</Text>
                  </View>

                  <View style={styles.titleBlock}>
                    <Text style={[styles.storeName, { color: textColor }]}>
                      {item.name || 'Unnamed store'}
                    </Text>
                    <Text
                      style={[styles.storeLocation, { color: subTextColor }]}
                    >
                      {item.location || '—'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isActive
                          ? darkMode
                            ? '#064E3B'
                            : '#ECFDF5'
                          : darkMode
                          ? '#7F1D1D'
                          : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isActive
                            ? darkMode
                              ? '#6EE7B7'
                              : '#047857'
                            : darkMode
                            ? '#FCA5A5'
                            : '#991B1B',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statsRow,
                    { borderTopColor: darkMode ? '#334155' : '#F1F5F9' },
                  ]}
                >
                  <View style={styles.statCell}>
                    <Text
                      style={[styles.statValue, { color: '#8B5CF6' }]}
                      numberOfLines={1}
                    >
                      {item.items ?? 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: subTextColor }]}>
                      Items
                    </Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text
                      style={[styles.statValue, { color: '#3B82F6' }]}
                      numberOfLines={1}
                    >
                      {groupCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: subTextColor }]}>
                      Groups
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  loadingText: { marginTop: 10, fontSize: 12, fontWeight: '500' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryDivider: { width: 1, height: 24, opacity: 0.6 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    gap: 6,
  },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  clearIcon: { fontSize: 13, fontWeight: '700', padding: 4 },

  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterPillText: { fontSize: 11, fontWeight: '700' },

  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorText: { fontSize: 11.5, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 60 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptyBody: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  footerBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: { fontSize: 11, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, minWidth: 0 },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 16 },
  titleBlock: { flex: 1, minWidth: 0 },
  storeName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  storeLocation: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flexShrink: 0,
  },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  statCell: { flex: 1, alignItems: 'center', minWidth: 0 },
  statValue: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});