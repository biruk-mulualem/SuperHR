// pages/manager/PendingApprovalPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import mobileManagerDetailService from '../../stores/mobileManagerDetailService';

const PendingApprovalPage = ({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  onNavigateToDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await mobileManagerDetailService.getPendingApprovals({
        page: 1,
        limit: 50,
        status: 'pending',
      });

      if (res.success) {
        setData(res.data.items || []);
      } else {
        setError(res.error || 'Failed to load pending approvals');
        setData([]);
      }
    } catch (e) {
      console.error('loadData error:', e);
      setError(e?.message || 'Network error');
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = data.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const requestText = [
      order.requestNumber,
      order.poNumber,
      order.requester,
      order.department,
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());

    const itemText = (order.items || [])
      .flatMap((it) => [it.itemName, it.item, it.name, it.itemCode, it.code])
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());

    return [...requestText, ...itemText].some((f) => f.includes(q));
  });

  const getPriorityColor = (priority) => {
    const p = String(priority || '').toLowerCase();
    const colors = {
      urgent: '#EF4444',
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981',
      normal: '#3B82F6',
    };
    return colors[p] || '#64748B';
  };

  const formatPriority = (priority) => {
    if (!priority) return 'Normal';
    const p = String(priority);
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  };

  const renderItemSummary = (order) => {
    const items = order.items || [];
    if (items.length === 0) return 'No items';

    const first = items[0];
    const firstName =
      first.itemName || first.item || first.name || 'Item';
    const extra = items.length - 1;

    if (extra <= 0) return firstName;
    return `${firstName} +${extra} more`;
  };

  const renderItem = ({ item: order }) => {
    const priorityColor = getPriorityColor(order.priority);

    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={0.7}
        onPress={() => {
          if (onNavigateToDetail) {
            onNavigateToDetail('pendingDetail', {
              id: order.id,
              requestNumber: order.requestNumber,
            });
          }
        }}
      >
        <View style={styles.listItemHeader}>
          <View style={styles.orderTitleContainer}>
            <Text style={[styles.orderNumber, { color: textColor }]}>
              {order.requestNumber}
            </Text>
            {order.poNumber ? (
              <Text style={[styles.orderId, { color: subTextColor }]}>
                {order.poNumber}
              </Text>
            ) : null}
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityColor + '20' },
            ]}
          >
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {formatPriority(order.priority)}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={[styles.orderRequester, { color: textColor }]}>
            👤 {order.requester}
          </Text>
          <Text style={[styles.orderDepartment, { color: subTextColor }]}>
            {order.department}
          </Text>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailBadge}>
            <Text style={[styles.detailBadgeText, { color: subTextColor }]}>
              📦 {renderItemSummary(order)}
            </Text>
          </View>
          <View style={styles.detailBadge}>
            <Text style={[styles.detailBadgeText, { color: subTextColor }]}>
              📅 {order.date}
            </Text>
          </View>
        </View>

        {/* Message from purchaser */}
        {order.bossMessage ? (
          <View style={styles.bossMessageRow}>
            <Text style={[styles.bossMessageLabel, { color: subTextColor }]}>
              📩 MESSAGE FROM PURCHASER
            </Text>
            <Text
              style={[styles.bossMessageText, { color: textColor }]}
              numberOfLines={2}
            >
              "{order.bossMessage}"
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.detailButton, { borderColor: '#3B82F6' }]}
            onPress={() => {
              if (onNavigateToDetail) {
                onNavigateToDetail('pendingDetail', {
                  id: order.id,
                  requestNumber: order.requestNumber,
                });
              }
            }}
          >
            <Text style={[styles.detailButtonText, { color: '#3B82F6' }]}>
              📋 View Details
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.detailContainer,
        { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' },
      ]}
    >
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: cardBg, borderColor, color: textColor },
          ]}
          placeholder="Search by order #, item, requester ..."
          placeholderTextColor={subTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.centerText, { color: subTextColor }]}>
            Loading pending approvals...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: subTextColor }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: '#3B82F6' }]}
            onPress={() => loadData()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: subTextColor }]}>
                No pending approvals
              </Text>
              <Text style={[styles.emptySubtext, { color: subTextColor }]}>
                Requests sent to you will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  detailContainer: { flex: 1, paddingTop: 10 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  listItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: { fontSize: 16, fontWeight: '700' },
  orderId: { fontSize: 12, fontFamily: 'monospace' },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priorityText: { fontSize: 10, fontWeight: '700' },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  orderRequester: { fontSize: 14, fontWeight: '600' },
  orderDepartment: { fontSize: 13 },
  orderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  detailBadgeText: { fontSize: 12, fontWeight: '500' },
  bossMessageRow: {
    marginTop: 0,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bossMessageLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bossMessageText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  detailButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  detailButtonText: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 44, marginBottom: 8 },
  emptyText: { fontSize: 14, fontWeight: '500' },
  emptySubtext: { fontSize: 12, marginTop: 4, opacity: 0.7 },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  centerText: { fontSize: 14, fontWeight: '500' },
  errorIcon: { fontSize: 44 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  retryText: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },
});

export default PendingApprovalPage;