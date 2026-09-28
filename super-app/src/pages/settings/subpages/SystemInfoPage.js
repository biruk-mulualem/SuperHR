import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function SystemInfoPage({ darkMode }) {
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardColor = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.sectionTitle, { color: darkMode ? '#93C5FD' : '#1E3A8A' }]}>System Diagnostics</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: subTextColor }]}>App Version</Text>
          <Text style={[styles.value, { color: textColor }]}>1.0.0 (Beta)</Text>
        </View>
        <View style={[styles.infoRow, { borderTopWidth: 1, borderColor, paddingTop: 12, marginTop: 12 }]}>
          <Text style={[styles.label, { color: subTextColor }]}>Engine Environment</Text>
          <Text style={[styles.value, { color: textColor }]}>Expo Metro</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, borderWidth: 1, elevation: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '600' }
});
