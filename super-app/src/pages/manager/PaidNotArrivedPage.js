import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';

// Sample data for Paid Not Arrived
const PAID_DATA = [
  { 
    id: 5, 
    item: 'PVC Pipe 50mm', 
    requester: 'Dawit Solomon', 
    department: 'Administration', 
    date: '2026-09-01', 
    status: 'paid', 
    amount: 780.00,
    bids: [
      { employee: 'Mekonnen Alemu', price: 790.00 },
      { employee: 'Tigist Hailu', price: 770.00 },
    ]
  },
  { 
    id: 10, 
    item: 'Electrical Cable 100m', 
    requester: 'Mekonnen Alemu', 
    department: 'Quality Control', 
    date: '2026-08-27', 
    status: 'paid', 
    amount: 2400.00,
    bids: [
      { employee: 'Dawit Solomon', price: 2450.00 },
      { employee: 'Meron Ayele', price: 2350.00 },
    ]
  },
];

const PaidNotArrivedPage = ({ onBack, darkMode, textColor, subTextColor, cardBg, borderColor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const data = PAID_DATA;

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
        <View style={[styles.listItemStatus, { backgroundColor: '#10B98120' }]}>
          <Text style={[styles.listItemStatusText, { color: '#10B981' }]}>
            PAID
          </Text>
        </View>
      </View>
      <Text style={[styles.listItemDetail, { color: subTextColor }]}>
        {item.requester} • {item.department}
      </Text>
      <View style={styles.listItemFooter}>
        <Text style={[styles.listItemDate, { color: subTextColor }]}>{item.date}</Text>
        <Text style={[styles.listItemAmount, { color: '#10B981' }]}>ETB {item.amount.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={[styles.arrivedButton, { backgroundColor: '#06B6D4' }]}>
        <Text style={styles.arrivedButtonText}>📦 Mark as Arrived</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.detailContainer, { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' }]}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: textColor }]}>💳 Paid Not Arrived</Text>
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
            <Text style={[styles.emptyText, { color: subTextColor }]}>No paid items waiting for arrival</Text>
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
  arrivedButton: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  arrivedButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
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

export default PaidNotArrivedPage;