import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

// 🌟 Removed corporate permission filters so everyone gets permanent access
export default function SettingsPage({ darkMode, onLogout, setSubView, userRole }) {
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardColor = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';

  return (
    <ScrollView style={styles.container}>
      {/* Dynamic Title Header featuring the active profile name handle */}
      <Text style={[styles.pageTitle, { color: darkMode ? '#93C5FD' : '#1E3A8A' }]}>
        App Settings {userRole ? `(${userRole.toUpperCase()})` : ''}
      </Text>
      
      <View style={[styles.menuCard, { backgroundColor: cardColor, borderColor }]}>
        
        {/* Row 1: Link to Display Preferences (Visible to all staff members) */}
        <TouchableOpacity style={[styles.menuRow, { borderBottomColor: borderColor }]} onPress={() => setSubView('pref')}>
          <Text style={styles.menuEmoji}>🎨</Text>
          <View style={styles.textColumn}>
            <Text style={[styles.menuLabel, { color: textColor }]}>Display Preferences</Text>
            <Text style={[styles.menuSubLabel, { color: subTextColor }]}>Manage dark mode and layout appearance.</Text>
          </View>
          <Text style={[styles.chevron, { color: subTextColor }]}>❯</Text>
        </TouchableOpacity>

        {/* Row 2: Link to Account Security (🌟 Now visible and fully accessible to everyone) */}
        <TouchableOpacity style={[styles.menuRow, { borderBottomColor: borderColor }]} onPress={() => setSubView('sec')}>
          <Text style={styles.menuEmoji}>🔒</Text>
          <View style={styles.textColumn}>
            <Text style={[styles.menuLabel, { color: textColor }]}>Account Security</Text>
            <Text style={[styles.menuSubLabel, { color: subTextColor }]}>Review encryptions and credential modifications.</Text>
          </View>
          <Text style={[styles.chevron, { color: subTextColor }]}>❯</Text>
        </TouchableOpacity>

        {/* Row 3: Link to System Information (🌟 Now visible and fully accessible to everyone) */}
        <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => setSubView('sys')}>
          <Text style={styles.menuEmoji}>ℹ️</Text>
          <View style={styles.textColumn}>
            <Text style={[styles.menuLabel, { color: textColor }]}>System Information</Text>
            <Text style={[styles.menuSubLabel, { color: subTextColor }]}>View builds, engine versions, and diagnostics logs.</Text>
          </View>
          <Text style={[styles.chevron, { color: subTextColor }]}>❯</Text>
        </TouchableOpacity>
      </View>

      {/* Corporate Session Sign-Out Trigger Button Container */}
      <TouchableOpacity style={[styles.logoutButton, { borderColor: darkMode ? '#EF4444' : '#FCA5A5' }]} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
  },
  pageTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 20, 
    letterSpacing: 0.5,
  },
  menuCard: { 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    elevation: 2,
  },
  menuRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1,
  },
  menuEmoji: { 
    fontSize: 20, 
    marginRight: 16,
  },
  textColumn: { 
    flex: 1, 
    paddingRight: 8,
  },
  menuLabel: { 
    fontSize: 15, 
    fontWeight: '600',
  },
  menuSubLabel: { 
    fontSize: 11, 
    marginTop: 2, 
    lineHeight: 14,
  },
  chevron: { 
    fontSize: 14, 
    fontWeight: '600', 
    paddingLeft: 4,
  },
  logoutButton: { 
    backgroundColor: 'rgba(239, 68, 68, 0.08)', 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24, 
    borderWidth: 1, 
    marginBottom: 40,
  },
  logoutButtonText: { 
    color: '#EF4444', 
    fontSize: 15, 
    fontWeight: '700',
  },
});
