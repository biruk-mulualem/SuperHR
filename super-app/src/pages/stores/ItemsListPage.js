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
} from 'react-native';

import mobileItemListService from '../../stores/mobileItemListService';

const STATUS_FILTERS = [
  { key: 'all',      label: 'All'       },
  { key: 'active',   label: 'Active'    },
  { key: 'inactive', label: 'Inactive'  },
  { key: 'nocost',   label: 'No cost'   },
];

const PAGE_SIZE = 10;

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

  // 👈 NEW — full-set counts from backend
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    noCost: 0,
  });

  const listRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const skuColor = darkMode ? '#93C5FD' : '#2563EB';
  const uomColor = darkMode ? '#FCD34D' : '#D97706';

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
          setItems(
            list.map((it) => ({
              ...it,
              balance: Number(it.balance ?? 0),
              hasCost: it.hasCost !== false,
              status: it.status || 'active',
            }))
          );
          setPage(1);
          setTotal(res.data?.pagination?.total ?? list.length);
          setHasMore(res.data?.pagination?.hasMore ?? false);

          // 👈 NEW — capture full-set counts
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
        setItems((prev) => [
          ...prev,
          ...list.map((it) => ({
            ...it,
            balance: Number(it.balance ?? 0),
            hasCost: it.hasCost !== false,
            status: it.status || 'active',
          })),
        ]);
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

  useEffect(() => {
    const t = setTimeout(() => {
      loadFirstPage();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query]);

  const handleEndReached = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (!hasMore) return;
    loadNextPage();
  }, [hasMore, loadNextPage]);

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

      {/* Summary strip — 👈 reads from counts (full set) */}
      <View
        style={[styles.summaryStrip, { backgroundColor: cardBg, borderColor }]}
      >
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>
            {counts.total}
          </Text>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>
            Items
          </Text>
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
      <Text style={[styles.filterLabel, { color: subTextColor }]}>
        STATUS
      </Text>
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
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToDetail?.(item)}
            style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.cardRow}>
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
                      <Text style={[styles.metaSep, { color: subTextColor }]}>
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
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ================================================================
// STYLES — unchanged
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
});