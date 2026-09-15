import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';

// Sample data for Arrived at SDT
const ARRIVED_DATA = [
  { 
    id: 6, 
    item: 'Motor 5HP', 
    requester: 'Meron Ayele', 
    department: 'Sales', 
    date: '2026-08-31', 
    status: 'arrived', 
    amount: 4500.00,
    arrivedDate: '2026-09-06',
    bids: [
      { employee: 'Dawit Solomon', price: 4550.00 },
      { employee: 'Fikru Tsegaye', price: 4450.00 },
    ]
  },
];

const ArrivedPage = ({ onBack, darkMode, textColor, subTextColor, cardBg, borderColor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const data = ARRIVED_DATA;

  const filteredData = data.filter(item => 
    item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.listItem, { backgroundColor: cardBg, borderColor }]}
      activeOpacity={0.7}
    >
      <View style={styles.listItemHeader}>
        <Text style={[styles.listItemTitle, { color: textColor }]}>{item.item}</Text>
        <View style={[styles.listItemStatus, { backgroundColor: '#06B6D420' }]}>
          <Text style={[styles.listItemStatusText, { color: '#06B6D4' }]}>
            ARRIVED
          </Text>
        </View>
      </View>
      <Text style={[styles.listItemDetail, { color: subTextColor }]}>
        {item.requester} • {item.department}
      </Text>
      <View style={styles.listItemFooter}>
        <Text style={[styles.listItemDate, { color: subTextColor }]}>Requested: {item.date}</Text>
        <Text style={[styles.listItemAmount, { color: '#06B6D4' }]}>ETB {item.amount.toFixed(2)}</Text>
      </View>
      <View style={styles.arrivedBadge}>
        <Text style={styles.arrivedBadgeText}>📦 Arrived at SDT: {item.arrivedDate || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.detailContainer, { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' }]}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: textColor }]}>📦 Arrived at SDT</Text>
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
            <Text style={[styles.emptyText, { color: subTextColor }]}>No items arrived at SDT</Text>
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
    marginBottom: 4,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  listItemDate: {
    fontSize: 11,
    opacity: 0.6,
  },
  listItemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  arrivedBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#06B6D420',
    alignItems: 'center',
  },
  arrivedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06B6D4',
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

export default ArrivedPage;