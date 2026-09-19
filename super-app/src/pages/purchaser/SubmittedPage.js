// pages/purchaser/SubmittedPage.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import PendingSubmissionDetailPage from './PendingSubmissionDetailPage';

// ================================================================
// DEMO DATA
// ================================================================
const SUBMITTED = [
  {
    id: 'RS-2026-001',
    requestNumber: 'PR-2026-0002',
    requester: 'Tigist Hailu',
    department: 'Maintenance',
    submittedAt: '2026-09-07 14:22',
    status: 'won',
    priority: 'Medium',
    items: [
      { id: 1, item: 'Bearing 6204', code: 'BR-6204', quantity: 20, uom: 'PCS', myUnitPrice: 85.0, winUnitPrice: 85.0 },
    ],
  },
  {
    id: 'RS-2026-002',
    requestNumber: 'PR-2026-0005',
    requester: 'Selam Tesfaye',
    department: 'Production',
    submittedAt: '2026-09-05 09:15',
    status: 'lost',
    priority: 'High',
    items: [
      { id: 1, item: 'Electrical Cable 100m', code: 'EC-100', quantity: 5, uom: 'ROLL', myUnitPrice: 152.0, winUnitPrice: 148.0 },
    ],
  },
  {
    id: 'RS-2026-003',
    requestNumber: 'PR-2026-0006',
    requester: 'Dawit Solomon',
    department: 'Electrical',
    submittedAt: '2026-09-04 11:40',
    status: 'pending',
    priority: 'Low',
    items: [
      { id: 1, item: 'Industrial Paint', code: 'IP-100', quantity: 30, uom: 'LTR', myUnitPrice: 15.33, winUnitPrice: null },
    ],
  },
];

const getStatusMeta = (status) => {
  switch (status) {
    case 'won':     return { label: 'Won',     color: '#10B981', icon: '🏆' };
    case 'lost':    return { label: 'Lost',    color: '#EF4444', icon: '❌' };
    case 'pending': return { label: 'Pending', color: '#F59E0B', icon: '⏳' };
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

/**
 * Adapt a Submitted row into the shape PendingSubmissionDetailPage expects.
 */
const adaptForDetail = (sub) => ({
  id: sub.id,
  requestNumber: sub.requestNumber,
  requester: sub.requester,
  department: sub.department,
  priority: sub.priority || 'Normal',
  date: sub.submittedAt,
  items: sub.items,
  imageUrl: sub.imageUrl,
  reason: sub.reason,
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

  // Detail view
  if (selectedSubmission) {
    return (
      <PendingSubmissionDetailPage
        request={adaptForDetail(selectedSubmission)}
        onBack={() => setSelectedSubmission(null)}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    );
  }

  // List view
  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {SUBMITTED.map((sub) => {
        const meta = getStatusMeta(sub.status);
        const canUpdate = sub.status === 'pending';
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
              <View style={[styles.statusPill, { backgroundColor: meta.color + '20' }]}>
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
                          { color: sub.status === 'won' ? '#10B981' : '#94A3B8' },
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
                Submitted {sub.submittedAt}
              </Text>
              <TouchableOpacity
                style={[
                  styles.updateBtn,
                  { backgroundColor: canUpdate ? '#3B82F6' : '#E2E8F0' },
                ]}
                onPress={() => canUpdate && setSelectedSubmission(sub)}
                disabled={!canUpdate}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.updateBtnText,
                    { color: canUpdate ? '#FFFFFF' : '#94A3B8' },
                  ]}
                >
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
});