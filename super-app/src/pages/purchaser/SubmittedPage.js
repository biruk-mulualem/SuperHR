// pages/purchaser/SubmittedPage.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import purchaserService from '../../stores/purchaserService';
import PendingSubmissionDetailPage from './PendingSubmissionDetailPage';

// ================================================================
// HELPERS
// ================================================================
const getStatusMeta = (status) => {
  switch (status) {
    case 'won':     return { label: 'Won',     color: '#10B981', icon: '🏆' };
    case 'lost':    return { label: 'Lost',    color: '#EF4444', icon: '❌' };
    case 'pending': return { label: 'Pending', color: '#F59E0B', icon: '⏳' };
    case 'mixed':   return { label: 'Mixed',   color: '#8B5CF6', icon: '🎯' };
    default:        return { label: 'Unknown', color: '#64748B', icon: '•' };
  }
};

const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) return '0.00';
  return Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Map the server DTO into the shape this screen renders.
 */
const normalizeSubmission = (pr) => {
  const items = Array.isArray(pr.items) ? pr.items : [];

  return {
    id: pr.id,
    requestNumber: pr.requestNumber || '—',
    requester: pr.requester || 'Unknown',
    department: pr.department || 'N/A',
    priority: pr.priority || 'Normal',
    rawPriority: pr.rawPriority || 'medium',
    status: pr.myStatus || 'pending',
    submittedAt: pr.updatedAt || pr.createdAt || null,
    imageUrl: pr.imageUrl,
    reason: pr.reason,
    items: items.map((it) => ({
      id: it.id,
      item: it.itemName || it.itemCode || '—',
      code: it.itemCode || '—',
      quantity: Number(it.quantity) || 0,
      uom: it.uom || '—',
      myUnitPrice: it.myUnitPrice,
      myFinalPrice: it.myFinalPrice,
      winUnitPrice: it.hasWinner ? it.winningPrice : null,
      myStatus: it.myStatus,
      // Detail page uses these too
      specification: it.specification,
      brand: it.brand,
      model: it.model,
      baseUom: it.baseUom,
      conversionUom: it.conversionUom,
      remark: it.remark,
      hasWinner: !!it.hasWinner,
      hasMyBid: !!it.hasMyBid,
      bidCount: it.bidCount || 0,
      bids: it.bids || [],
    })),
    _raw: pr,
  };
};

/**
 * Adapt a Submitted row into the shape PendingSubmissionDetailPage expects.
 */
const adaptForDetail = (sub) => ({
  id: sub.id,
  requestNumber: sub.requestNumber,
  requester: sub.requester,
  department: sub.department,
  priority: sub.priority || 'Normal',
  rawPriority: sub.rawPriority,
  date: sub.submittedAt,
  items: sub.items,
  imageUrl: sub.imageUrl,
  reason: sub.reason,
  _raw: sub._raw,
});

// ================================================================
// COMPONENT
// ================================================================
export default function SubmittedPage({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  darkMode = false,
}) {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ------------------------------------------------------------
  // FETCH
  // ------------------------------------------------------------
  const fetchSubmitted = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await purchaserService.getSubmittedSubmissions({
        page: 1,
        limit: 50,
      });

      if (res?.success && res.data) {
        const list = Array.isArray(res.data.items) ? res.data.items : [];
        setSubmissions(list.map(normalizeSubmission));
      } else {
        setError(res?.error || 'Failed to load submitted requests');
      }
    } catch (err) {
      console.error('SubmittedPage fetch failed:', err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to load submitted requests',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmitted(false);
  }, [fetchSubmitted]);

  // ------------------------------------------------------------
  // DETAIL VIEW
  // ------------------------------------------------------------
  if (selectedSubmission) {
    return (
      <PendingSubmissionDetailPage
        request={adaptForDetail(selectedSubmission)}
        onBack={() => setSelectedSubmission(null)}
        onRefresh={() => fetchSubmitted(false)}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    );
  }

  // ------------------------------------------------------------
  // LIST
  // ------------------------------------------------------------
  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchSubmitted(true)}
          tintColor={subTextColor}
        />
      }
    >
      {/* ERROR BANNER */}
      {error && !loading ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchSubmitted(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* LOADING */}
      {loading && submissions.length === 0 ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.loadingText, { color: subTextColor }]}>
            Loading submitted requests...
          </Text>
        </View>
      ) : null}

      {/* EMPTY */}
      {!loading && submissions.length === 0 && !error ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            Nothing submitted yet
          </Text>
          <Text style={[styles.emptySub, { color: subTextColor }]}>
            Submit a price on a pending request and it will appear here.
          </Text>
        </View>
      ) : null}

      {/* LIST */}
      {submissions.map((sub) => {
        const meta = getStatusMeta(sub.status);

        return (
          <View
            key={sub.id}
            style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>
                  {sub.requestNumber}
                </Text>
                <Text style={[styles.cardMeta, { color: subTextColor }]}>
                  {sub.requester} · {sub.department}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: meta.color + '20' },
                ]}
              >
                <Text style={[styles.statusPillText, { color: meta.color }]}>
                  {meta.icon} {meta.label}
                </Text>
              </View>
            </View>

            {/* Prices */}
            <View style={[styles.itemsBlock, { borderColor }]}>
              {sub.items.map((it, idx) => (
                <View
                  key={it.id}
                  style={[
                    styles.priceRow,
                    idx < sub.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: borderColor,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.itemName, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {it.item}
                    </Text>
                    <Text style={[styles.itemQty, { color: subTextColor }]}>
                      {it.quantity} {it.uom}
                    </Text>
                  </View>
                  <View style={styles.priceValues}>
                    <Text style={[styles.myPrice, { color: '#3B82F6' }]}>
                      Mine: {formatPrice(it.myUnitPrice)}
                    </Text>
                    {it.winUnitPrice !== null && (
                      <Text
                        style={[
                          styles.winPrice,
                          {
                            color:
                              it.myStatus === 'won'
                                ? '#10B981'
                                : '#94A3B8',
                          },
                        ]}
                      >
                        Win: {formatPrice(it.winUnitPrice)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.cardFooterRow}>
              <Text style={[styles.cardFooterText, { color: subTextColor }]}>
                Submitted {formatDate(sub.submittedAt)}
              </Text>
              <TouchableOpacity
                style={[styles.updateBtn, { backgroundColor: '#3B82F6' }]}
                onPress={() => setSelectedSubmission(sub)}
                activeOpacity={0.8}
              >
                <Text style={[styles.updateBtnText, { color: '#FFFFFF' }]}>
                  ✏️ Update Price
                </Text>
              </TouchableOpacity>
            </View>
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

  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  cardMeta: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  itemsBlock: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: { fontSize: 13, fontWeight: '700', flex: 1 },
  itemQty: { fontSize: 11, marginTop: 2 },
  priceValues: { alignItems: 'flex-end' },
  myPrice: { fontSize: 12, fontWeight: '700' },
  winPrice: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooterText: { fontSize: 11, fontWeight: '500' },

  updateBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  updateBtnText: { fontSize: 12, fontWeight: '800' },

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