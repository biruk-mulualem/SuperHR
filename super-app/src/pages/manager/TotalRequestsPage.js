import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';

// Sample data for Total Requests
const SAMPLE_REQUESTS = [
  { 
    id: 1, 
    item: 'Steel Pipe 2 inch', 
    requester: 'Abebe Kebede', 
    department: 'Production', 
    date: '2026-09-05', 
    status: 'pending', 
    amount: 1200.00,
    bids: [
      { employee: 'Selam Tesfaye', price: 1250.00 },
      { employee: 'Mekonnen Alemu', price: 1180.00 },
    ]
  },
  { 
    id: 2, 
    item: 'Industrial Paint', 
    requester: 'Selam Tesfaye', 
    department: 'Maintenance', 
    date: '2026-09-04', 
    status: 'pending', 
    amount: 450.00,
    bids: [
      { employee: 'Abebe Kebede', price: 460.00 },
      { employee: 'Tigist Hailu', price: 440.00 },
    ]
  },
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
    id: 4, 
    item: 'Hydraulic Pump', 
    requester: 'Tigist Hailu', 
    department: 'Warehouse', 
    date: '2026-09-02', 
    status: 'approved', 
    amount: 5600.00,
    bids: [
      { employee: 'Abebe Kebede', price: 5700.00 },
      { employee: 'Selam Tesfaye', price: 5500.00 },
    ]
  },
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
    id: 6, 
    item: 'Motor 5HP', 
    requester: 'Meron Ayele', 
    department: 'Sales', 
    date: '2026-08-31', 
    status: 'arrived', 
    amount: 4500.00,
    bids: [
      { employee: 'Dawit Solomon', price: 4550.00 },
      { employee: 'Fikru Tsegaye', price: 4450.00 },
    ]
  },
  { 
    id: 7, 
    item: 'Aluminum Sheet', 
    requester: 'Fikru Tsegaye', 
    department: 'Production', 
    date: '2026-08-30', 
    status: 'pending', 
    amount: 2100.00,
    bids: []
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
  { 
    id: 9, 
    item: 'Lubricant Oil', 
    requester: 'Selam Tesfaye', 
    department: 'Maintenance', 
    date: '2026-08-28', 
    status: 'approved', 
    amount: 680.00,
    bids: [
      { employee: 'Abebe Kebede', price: 690.00 },
      { employee: 'Tigist Hailu', price: 670.00 },
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

const TotalRequestsPage = ({ onBack, darkMode, textColor, subTextColor, cardBg, borderColor }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const data = SAMPLE_REQUESTS;

  const filteredData = data.filter(item => 
    item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      bidding: '#8B5CF6',
      approved: '#3B82F6',
      paid: '#10B981',
      arrived: '#06B6D4',
    };
    return colors[status] || '#64748B';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.listItem, { backgroundColor: cardBg, borderColor }]}
      activeOpacity={0.7}
    >
      <View style={styles.listItemHeader}>
        <Text style={[styles.listItemTitle, { color: textColor }]}>{item.item}</Text>
        <View style={[styles.listItemStatus, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.listItemStatusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.listItemDetail, { color: subTextColor }]}>
        {item.requester} • {item.department}
      </Text>
      <View style={styles.listItemFooter}>
        <Text style={[styles.listItemDate, { color: subTextColor }]}>{item.date}</Text>
        <Text style={[styles.listItemAmount, { color: '#3B82F6' }]}>ETB {item.amount.toFixed(2)}</Text>
      </View>
      {item.bids && item.bids.length > 0 && (
        <View style={styles.bidContainer}>
          <Text style={[styles.bidText, { color: subTextColor }]}>
            💰 {item.bids.length} bid(s)
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.detailContainer, { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' }]}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: textColor }]}>📋 Total Purchase Requests</Text>
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
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: subTextColor }]}>No requests found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  detailContainer: {
    flex: 1,
    paddingTop: 10,
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
  },
  listItemDate: {
    fontSize: 11,
    opacity: 0.6,
  },
  listItemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  bidContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bidText: {
    fontSize: 11,
    fontWeight: '500',
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

export default TotalRequestsPage;