// src/pages/dashboard/roles/ManagerDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { mobileManagerDashboardService } from '../../../stores/mobileManagerDashboardService';

const EMPTY_DATA = {
  pendingApproval: 0,
  pendingPayment: 0,
};

export default function ManagerDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  setActiveTab,
  onNavigateToPurchase,
  darkMode,
}) {
  const [purchaseData, setPurchaseData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------------
  const loadSummary = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await mobileManagerDashboardService.getPurchaseSummary();

      if (res?.success) {
        setPurchaseData({
          pendingApproval: Number(res.data?.pendingApproval ?? 0),
          pendingPayment: Number(res.data?.pendingPayment ?? 0),
        });
      } else {
        setError(res?.error || 'Failed to load summary');
      }
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        // interceptor already triggered logout; just show a message
        setError('Session expired. Please log in again.');
      } else if (status === 403) {
        setError('You do not have access to this dashboard.');
      } else if (e?.message?.includes('Network')) {
        setError('Network error. Check your connection.');
      } else {
        setError(
          e?.response?.data?.error ||
            e?.message ||
            'Failed to load summary'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // -----------------------------------------------------------------
  // DERIVED
  // -----------------------------------------------------------------
  const totalRequests =
    purchaseData.pendingApproval + purchaseData.pendingPayment;

  const purchaseCards = [
    {
      title: 'Total Requests',
      value: totalRequests,
      color: '#8B5CF6',
      page: 'totalRequests',
    },
    {
      title: 'Pending Approval',
      value: purchaseData.pendingApproval,
      color: '#F59E0B',
      page: 'pendingApproval',
    },
    {
      title: 'Pending Payment',
      value: purchaseData.pendingPayment,
      color: '#3B82F6',
      page: 'approvedNotPaid', // keep original nav key
    },
  ];

  const cardRows = [];
  for (let i = 0; i < purchaseCards.length; i += 2) {
    cardRows.push(purchaseCards.slice(i, i + 2));
  }

  // -----------------------------------------------------------------
  // INITIAL LOADING
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>
          Loading dashboard…
        </Text>
      </View>
    );
  }

  // -----------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadSummary({ silent: true })}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Error banner (tap to retry) */}
      {error && (
        <TouchableOpacity
          onPress={() => loadSummary()}
          activeOpacity={0.8}
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
            ⚠️ {error}  ·  Tap to retry
          </Text>
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.purchaseSection,
          { borderColor: darkMode ? '#475569' : '#CBD5E1' },
        ]}
      >
        <Text style={[styles.purchaseSectionTitle, { color: textColor }]}>
          📦 Purchase Related
        </Text>

        {cardRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.cardRow}>
            {row.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.summaryCard,
                  { backgroundColor: cardBg, borderColor },
                ]}
                onPress={() => onNavigateToPurchase(card.page)}
                activeOpacity={0.7}
              >
                <Text style={[styles.summaryValue, { color: card.color }]}>
                  {card.value}
                </Text>
                <Text style={[styles.summaryTitle, { color: textColor }]}>
                  {card.title}
                </Text>
                <View style={[styles.seeMoreBtn, { borderColor: card.color }]}>
                  <Text style={[styles.seeMoreText, { color: card.color }]}>
                    See More →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {row.length === 1 && <View style={styles.cardSpacer} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 20,
  },

  // Loading
  centerBox: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },

  // Error
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Purchase Section
  purchaseSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  purchaseSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardSpacer: {
    width: '48%',
  },
  summaryCard: {
    width: '48%',
    padding: 16,
    paddingBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  seeMoreBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  seeMoreText: {
    fontSize: 9,
    fontWeight: '600',
  },
});