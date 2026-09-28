import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const TANKER_DATA = [
  { id: '1', capacity: '200L', type: 'Domestic Slimline', material: 'Premium Fiber', use: 'Home & Garden' },
  { id: '2', capacity: '500L', type: 'Standard Vertical', material: 'Reinforced Fiber', use: 'Residential Backup' },
  { id: '3', capacity: '1,000L', type: 'Heavy Duty Vertical', material: 'Super Fiber Layered', use: 'Apartments / Commercial' },
  { id: '4', capacity: '5,000L', type: 'Industrial Storage', material: 'Triple-Layer Super Fiber', use: 'Agriculture & Factories' },
  { id: '5', capacity: '10,000L', type: 'Mega Storage', material: 'Industrial Grade Fiber', use: 'Municipal / Construction' },
  { id: '6', capacity: '25,000L', type: 'Maxi Industrial Tank', material: 'Ultra-Reinforced Super Fiber', use: 'Large Scale Industrial' },
];

export default function CatalogPage({ darkMode }) {
  const [selectedId, setSelectedId] = useState(null);

  const cardBgColor = darkMode ? '#1E293B' : '#FFFFFF';
  const mainTextColor = darkMode ? '#F1F5F9' : '#1E293B'; 
  const subTextColorBase = darkMode ? '#94A3B8' : '#64748B';
  const borderLightColor = darkMode ? '#334155' : '#F1F5F9';

  return (
    <View style={styles.container}>
      {/* 🌟 FIXED: Replaced FlatList with a standard JavaScript .map array loop */}
      {/* This plays perfectly inside your master ScrollView with absolutely ZERO warning alerts! */}
      {TANKER_DATA.map((item) => {
        const isSelected = item.id === selectedId;
        const backgroundColor = isSelected ? '#1E3A8A' : cardBgColor;
        const textColor = isSelected ? '#FFFFFF' : mainTextColor;
        const subTextColor = isSelected ? '#93C5FD' : subTextColorBase;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => setSelectedId(item.id)}
            style={[styles.card, { backgroundColor }]}
            activeOpacity={0.7}
          >
            <View style={[styles.cardHeader, { borderBottomColor: borderLightColor }]}>
              <Text style={[styles.capacityText, { color: isSelected ? '#FFFFFF' : '#0284C7' }]}>
                {item.capacity}
              </Text>
              <Text style={[styles.typeText, { color: textColor }]}>{item.type}</Text>
            </View>
            
            <View style={styles.cardDetails}>
              <Text style={[styles.detailText, { color: subTextColor }]}>
                Material: <Text style={{ fontWeight: '600' }}>{item.material}</Text>
              </Text>
              <Text style={[styles.detailText, { color: subTextColor }]}>
                Best For: <Text style={{ fontWeight: '600' }}>{item.use}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    // Note: The bottom buffer room padding is now handled fully by your global MainLayout.js container!
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  capacityText: {
    fontSize: 20,
    fontWeight: '700',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  cardDetails: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    marginBottom: 4,
  },
});
