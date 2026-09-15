import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function PurchaserDashboard({ textColor, subTextColor, cardBg, borderColor, setActiveTab }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Procurement & Stock Control</Text>
      
      <View style={styles.grid}>
        <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.emoji}>📦</Text>
          <Text style={styles.value}>88%</Text>
          <Text style={[styles.label, { color: subTextColor }]}>Stock Level</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={[styles.value, { color: '#EF4444' }]}>3 Items</Text>
          <Text style={[styles.label, { color: subTextColor }]}>Low Stock</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: textColor, marginTop: 20 }]}>Procurement Shortcuts</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: cardBg, borderColor }]} onPress={() => setActiveTab('catalog')}>
          <Text style={styles.btnText}>📦 Check Warehouse Inventory</Text>
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
