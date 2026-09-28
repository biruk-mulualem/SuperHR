// pages/purchaser/PendingSubmissionPage.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';

import purchaserService from '../../stores/purchaserService';
import PendingSubmissionDetailPage from './PendingSubmissionDetailPage';

// ================================================================
// HELPERS
// ================================================================
const getPriorityColor = (priority) => {
  const p = String(priority || '').toLowerCase();
  const colors = {
    urgent: '#EF4444',
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
  };
  return colors[p] || '#64748B';
};

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

/**
 * Normalize a PR from the API into the shape this screen expects.
 * Keeps the raw DTO alongside the mapped fields so the detail page
 * has access to every server-provided value.
 */
const normalizeRequest = (pr) => {
  const items = Array.isArray(pr.items) ? pr.items : [];

  return {
    id: pr.id,
    requestNumber: pr.requestNumber || pr.prNumber || '—',
    requester:
      pr.requester ||
      pr.preparedBy ||
      pr.createdBy?.fullName ||
      'Unknown',
    department: pr.department || 'N/A',
    priority: pr.priority || 'Normal',
    rawPriority: pr.rawPriority || 'medium',

    // 👇 Dates — keep raw + pre-formatted
    date: pr.date || pr.requestedDate || null,
    dateLabel: pr.dateLabel || pr.requestedDateLabel || null,

    // 👇 Document — already resolved to absolute URL by the backend
    imageUrl: pr.imageUrl || null,
    approvedDocFront: pr.approvedDocFront || null,
    approvedDocFrontName: pr.approvedDocFrontName || null,
    approvedDocBack: pr.approvedDocBack || null,
    approvedDocBackName: pr.approvedDocBackName || null,

    reason: pr.reason || null,
    bossMessage: pr.bossMessage || null,

    items: items.map((it) => ({
      id: it.id,
      item: it.itemName || it.itemCode || '—',
      code: it.itemCode || '—',
      quantity: Number(it.quantity) || 0,
      uom: it.uom || '—',
      specification: it.specification,
      brand: it.brand,
      model: it.model,
      baseUom: it.baseUom,
      conversionUom: it.conversionUom,
      remark: it.remark,

      // Status
      hasWinner: !!it.hasWinner,
      winnerManuallySelected: !!it.winnerManuallySelected,
      winnerName: it.winnerName || null,
      winningPrice: Number(it.winningPrice) || 0,
      bidCount: it.bidCount || 0,
      bids: it.bids || [],

      // My bid — preload every field on the detail modal
      hasMyBid: !!it.hasMyBid,
      myPriceId: it.myPriceId || null,
      myUnitPrice: it.myUnitPrice ?? null,
      myDiscount: it.myDiscount ?? 0,
      myFinalPrice: it.myFinalPrice ?? null,
      myMatchesRequirement: it.myMatchesRequirement ?? null,
      myRemark: it.myRemark || '',
      myNotes: it.myNotes || '',
      myStatus: it.myStatus || 'not_submitted',
    })),

    // Keep the raw DTO for downstream use
    _raw: pr,
  };
};

// ================================================================
// COMPONENT
// ================================================================
export default function PendingSubmissionPage({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // ------------------------------------------------------------
  // FETCH
  // ------------------------------------------------------------
  const fetchPending = useCallback(
    async ({ isRefresh = false, query = search } = {}) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await purchaserService.getPendingSubmissions({
          page: 1,
          limit: 50,
          search: query,
        });

        if (res?.success && res.data) {
          const list = Array.isArray(res.data.items) ? res.data.items : [];
          setRequests(list.map(normalizeRequest));
        } else {
          setError(res?.error || 'Failed to load pending submissions');
        }
      } catch (err) {
        console.error('PendingSubmissionPage fetch failed:', err);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Failed to load pending submissions',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchPending({ isRefresh: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // SEARCH (debounced)
  // ------------------------------------------------------------
  useEffect(() => {
    const id = setTimeout(() => {
      fetchPending({ isRefresh: false, query: search });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ------------------------------------------------------------
  // DETAIL VIEW
  // ------------------------------------------------------------
  if (selectedRequest) {
    return (
      <PendingSubmissionDetailPage
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
        onRefresh={() => fetchPending({ isRefresh: false })}
      />
    );
  }

  // ------------------------------------------------------------
  // RENDER — LIST
  // ------------------------------------------------------------
  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchPending({ isRefresh: true })}
          tintColor={subTextColor}
        />
      }
    >
      {/* SEARCH BAR */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by PR #, requester, department..."
          placeholderTextColor={subTextColor}
          style={[styles.searchInput, { color: textColor }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ERROR BANNER */}
      {error && !loading ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchPending({ isRefresh: false })}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* LOADING */}
      {loading && requests.length === 0 ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.loadingText, { color: subTextColor }]}>
            Loading pending submissions...
          </Text>
        </View>
      ) : null}

      {/* EMPTY */}
      {!loading && requests.length === 0 && !error ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            {search ? 'No matches' : 'Nothing pending'}
          </Text>
          <Text style={[styles.emptySub, { color: subTextColor }]}>
            {search
              ? 'Try a different search term.'
              : 'You have no purchase requests awaiting submission.'}
          </Text>
        </View>
      ) : null}

      {/* LIST */}
      {requests.map((req) => {
        const totalQty = req.items.reduce(
          (s, i) => s + (i.quantity || 0),
          0,
        );
        const firstItem = req.items[0];
        const extraCount = req.items.length - 1;

        return (
          <View
            key={req.id}
            style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.cardTopRow}>
              <Text style={[styles.purchaseCode, { color: textColor }]}>
                {req.requestNumber}
              </Text>
              <View
                style={[
                  styles.priorityPill,
                  {
                    backgroundColor:
                      getPriorityColor(req.rawPriority || req.priority) + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.priorityPillText,
                    {
                      color: getPriorityColor(
                        req.rawPriority || req.priority,
                      ),
                    },
                  ]}
                >
                  {capitalize(req.priority)}
                </Text>
              </View>
            </View>

            <Text
              style={[styles.meta, { color: subTextColor }]}
              numberOfLines={1}
            >
              {req.requester} · {req.department}
            </Text>

            {req.dateLabel ? (
              <Text style={[styles.meta, { color: subTextColor }]}>
                📅 {req.dateLabel}
              </Text>
            ) : null}

            <View
              style={[styles.divider, { backgroundColor: borderColor }]}
            />

            {firstItem ? (
              <View style={styles.itemSummaryRow}>
                <Text style={styles.itemEmoji}>📦</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.itemName, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {firstItem.item}
                    {extraCount > 0 ? `  +${extraCount} more` : ''}
                  </Text>
                  <Text
                    style={[styles.itemQty, { color: subTextColor }]}
                  >
                    {totalQty} {firstItem.uom} total · {req.items.length}{' '}
                    item{req.items.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.itemQty, { color: subTextColor }]}>
                No items on this request
              </Text>
            )}

            <TouchableOpacity
              style={[styles.viewDetailBtn, { borderColor: '#3B82F6' }]}
              onPress={() => setSelectedRequest(req)}
              activeOpacity={0.75}
            >
              <Text style={styles.viewDetailText}>View Detail</Text>
              <Text style={styles.viewDetailChevron}>›</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  clearIcon: { fontSize: 14, fontWeight: '600' },

  // Card
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  purchaseCode: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    flex: 1,
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priorityPillText: { fontSize: 10, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 4 },
  divider: { height: 1, marginVertical: 12 },
  itemSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  itemEmoji: { fontSize: 22 },
  itemName: { fontSize: 13, fontWeight: '700' },
  itemQty: { fontSize: 11, marginTop: 2 },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 11,
    gap: 4,
  },
  viewDetailText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  viewDetailChevron: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '400',
    marginTop: -1,
  },

  // Loading
  loadingBlock: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, fontWeight: '600' },

  // Empty
  emptyBlock: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 44, opacity: 0.6 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 19,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});