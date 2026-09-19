// pages/purchaser/PendingSubmissionPage.js
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
const PENDING = [
  {
    id: 'RQ-2026-001',
    requestNumber: 'PR-2026-0001',
    requester: 'Tigist Hailu',
    department: 'Production',
    priority: 'High',
    items: [
      { id: 1, item: 'Steel Pipe 2 inch', code: 'SP-002', quantity: 50, uom: 'PCS' },
      { id: 2, item: 'Industrial Paint', code: 'IP-100', quantity: 30, uom: 'LTR' },
      { id: 3, item: 'Hydraulic Pump', code: 'HP-500', quantity: 2, uom: 'SET' },
    ],
  },
  {
    id: 'RQ-2026-002',
    requestNumber: 'PR-2026-0003',
    requester: 'Dawit Solomon',
    department: 'Electrical',
    priority: 'Medium',
    items: [
      { id: 1, item: 'Circuit Breaker 32A', code: 'CB-32A', quantity: 10, uom: 'PCS' },
    ],
  },
  {
    id: 'RQ-2026-003',
    requestNumber: 'PR-2026-0004',
    requester: 'Meron Ayele',
    department: 'Maintenance',
    priority: 'Urgent',
    items: [
      { id: 1, item: 'Conveyor Belt 10m', code: 'CB-010', quantity: 3, uom: 'ROLL' },
      { id: 2, item: 'Bearing 6204', code: 'BR-6204', quantity: 20, uom: 'PCS' },
    ],
  },
];

const getPriorityColor = (priority) => {
  const colors = {
    Urgent: '#EF4444',
    High: '#EF4444',
    Medium: '#F59E0B',
    Low: '#10B981',
  };
  return colors[priority] || '#64748B';
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
  // 👇 NEW: which request (if any) is currently open
  const [selectedRequest, setSelectedRequest] = useState(null);

  // 👇 NEW: if one is selected, render the detail page instead of the list
  if (selectedRequest) {
    return (
      <PendingSubmissionDetailPage
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    );
  }

  // Existing list UI
  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {PENDING.map((req) => {
        const totalQty = req.items.reduce((s, i) => s + (i.quantity || 0), 0);
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
                  { backgroundColor: getPriorityColor(req.priority) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.priorityPillText,
                    { color: getPriorityColor(req.priority) },
                  ]}
                >
                  {req.priority}
                </Text>
              </View>
            </View>

            <Text style={[styles.meta, { color: subTextColor }]} numberOfLines={1}>
              {req.requester} · {req.department}
            </Text>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

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
                <Text style={[styles.itemQty, { color: subTextColor }]}>
                  {totalQty} {firstItem.uom} total · {req.items.length} item
                  {req.items.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.viewDetailBtn, { borderColor: '#3B82F6' }]}
              onPress={() => setSelectedRequest(req)}  // 👈 NEW: switch to detail
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
// STYLES (unchanged)
// ================================================================
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
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
});