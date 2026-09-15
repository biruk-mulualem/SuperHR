import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';

// Sample data for Price Comparison
const BIDDING_DATA = [
  { 
    id: 3, 
    item: 'Conveyor Belt 10m', 
    requester: 'Mekonnen Alemu', 
    department: 'Quality Control', 
    date: '2026-09-03', 
    status: 'bidding', 
    amount: 3200.00,
    bids: [
      { employee: 'Dawit Solomon', price: 3250.00 },
      { employee: 'Meron Ayele', price: 3150.00 },
      { employee: 'Fikru Tsegaye', price: 3300.00 },
    ]
  },
  { 
    id: 8, 
    item: 'Bolts and Nuts Set', 
    requester: 'Abebe Kebede', 
    department: 'Maintenance', 
    date: '2026-08-29', 
    status: 'bidding', 
    amount: 350.00,
    bids: [
      { employee: 'Selam Tesfaye', price: 360.00 },
      { employee: 'Mekonnen Alemu', price: 345.00 },
    ]
  },
];

const PriceComparisonPage = ({ onBack, darkMode, textColor, subTextColor, cardBg, borderColor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const data = BIDDING_DATA;

  const filteredData = data.filter(item => 
    item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLowestBid = (bids) => {
    if (!bids || bids.length === 0) return 0;
    return Math.min(...bids.map(b => b.price));
  };

  const getHighestBid = (bids) => {
    if (!bids || bids.length === 0) return 0;
    return Math.max(...bids.map(b => b.price));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.listItem, { backgroundColor: cardBg, borderColor }]}
      activeOpacity={0.7}
    >
      <View style={styles.listItemHeader}>
        <Text style={[styles.listItemTitle, { color: textColor }]}>{item.item}</Text>
        <View style={[styles.listItemStatus, { backgroundColor: '#8B5CF620' }]}>
          <Text style={[styles.listItemStatusText, { color: '#8B5CF6' }]}>
            {item.bids?.length || 0} BIDS
          </Text>
        </View>
      </View>
      <Text style={[styles.listItemDetail, { color: subTextColor }]}>
        {item.requester} • {item.department}
      </Text>
      
      <View style={styles.bidComparison}>
        <View style={styles.bidMetric}>
          <Text style={[styles.bidMetricLabel, { color: subTextColor }]}>Lowest</Text>
          <Text style={[styles.bidMetricValue, { color: '#10B981' }]}>
            ETB {getLowestBid(item.bids).toFixed(2)}
          </Text>
        </View>
        <View style={styles.bidMetric}>
          <Text style={[styles.bidMetricLabel, { color: subTextColor }]}>Highest</Text>
          <Text style={[styles.bidMetricValue, { color: '#EF4444' }]}>
            ETB {getHighestBid(item.bids).toFixed(2)}
          </Text>
        </View>
        <View style={styles.bidMetric}>
          <Text style={[styles.bidMetricLabel, { color: subTextColor }]}>Spread</Text>
          <Text style={[styles.bidMetricValue, { color: '#8B5CF6' }]}>
            ETB {(getHighestBid(item.bids) - getLowestBid(item.bids)).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.bidderList}>
        <Text style={[styles.bidderListTitle, { color: subTextColor }]}>Bidders:</Text>
        {item.bids?.map((bid, index) => (
          <View key={index} style={styles.bidderItem}>
            <Text style={[styles.bidderName, { color: textColor }]}>{bid.employee}</Text>
            <Text style={[styles.bidderPrice, { color: '#3B82F6' }]}>ETB {bid.price.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.detailContainer, { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' }]}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: textColor }]}>💰 Price Comparison</Text>
        <View style={styles.detailCount}>
          <Text style={[styles.detailCountText, { color: subTextColor }]}>{filteredData.length} items</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: cardBg, borderColor, color: textColor }]}
          placeholder="Search by item, requester, or department..."
          placeholderTextColor={subTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: subTextColor }]}>No items with bids</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  detailContainer: {
    flex: 1,
    paddingTop: 40,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  detailCount: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  detailCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 0.5,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  listItemStatus: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  listItemStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listItemDetail: {
    fontSize: 12,
    marginBottom: 8,
  },
  bidComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  bidMetric: {
    alignItems: 'center',
  },
  bidMetricLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  bidMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bidderList: {
    marginTop: 4,
  },
  bidderListTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  bidderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  bidderName: {
    fontSize: 12,
    fontWeight: '500',
  },
  bidderPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PriceComparisonPage;