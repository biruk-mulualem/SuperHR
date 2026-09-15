import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function SalesDashboard({ textColor, subTextColor, cardBg, borderColor, setActiveTab }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Sales & Revenue Analytics</Text>
      
      <View style={styles.grid}>
        <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.emoji}>💵</Text>
          <Text style={[styles.value, { color: '#10B981' }]}>$4,200</Text>
          <Text style={[styles.label, { color: subTextColor }]}>Today Revenue</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.emoji}>🚰</Text>
          <Text style={styles.value}>14 Units</Text>
          <Text style={[styles.label, { color: subTextColor }]}>Tanks Sold</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: textColor, marginTop: 20 }]}>Sales Shortcuts</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: cardBg, borderColor }]} onPress={() => setActiveTab('catalog')}>
          <Text style={styles.btnText}>🚰 Open Product Catalog</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, marginRight: 8, padding: 16, borderRadius: 14, borderWidth: 1, elevation: 1 },
  emoji: { fontSize: 24, marginBottom: 8 },
  value: { fontSize: 18, fontWeight: '800', color: '#3B82F6' },
  label: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  actions: { marginTop: 8 },
  btn: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '700', color: '#0284C7' }
});
