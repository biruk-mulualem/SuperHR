import React from 'react';
import { StyleSheet, Text, View, Switch, ScrollView } from 'react-native';

export default function PreferencesPage({ darkMode, setDarkMode }) {
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardColor = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.sectionTitle, { color: darkMode ? '#93C5FD' : '#1E3A8A' }]}>Display Preferences</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={[styles.label, { color: textColor }]}>Dark Display Mode</Text>
            <Text style={[styles.subLabel, { color: subTextColor }]}>Swaps active surfaces for nighttime comfort.</Text>
          </View>
          <Switch
            trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
            thumbColor={darkMode ? '#F8FAFC' : '#F1F5F9'}
            onValueChange={() => setDarkMode(!darkMode)}
            value={darkMode}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  card: { borderRadius: 12, padding: 16, borderWidth: 1, elevation: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600' },
  subLabel: { fontSize: 12, marginTop: 4, lineHeight: 16 }
});
