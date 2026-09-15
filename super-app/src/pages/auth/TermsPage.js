import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native'; // 🌟 1. 'Platform' እዚህ ላይ ተጨምሯል

export default function TermsPage({ onClose }) {
  // Static employee documentation reference table grid array
  const credentialsList = [
    { user: 'john_doe', pass: 'admin123', role: 'Admin' },
    { user: 'flynn_rider', pass: 'sales123', role: 'Sales' },
    { user: 'sam_purchaser', pass: 'purchaser123', role: 'Purchaser' },
    { user: 'alex_manager', pass: 'manager123', role: 'Manager' },
  ];

  return (
    <View style={styles.container}>
      
      {/* ⬅️ Top Back Navigation Trigger */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backArrowButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.backArrowText}>⬅️ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Terms & Conditions</Text>
        
        {/* Section 1: How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. How it Works</Text>
          <Text style={styles.bodyText}>
            SUPER APP is a responsive digital logistics platform built to manage and streamline 
            the cataloging, monitoring, and verification of high-grade Super Fiber water tankers. 
            Authenticated crew members can browse configurations, verify client updates, and 
            receive real-time system alerts instantly.
          </Text>
        </View>

        {/* Section 2: What it Does */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. What it Does</Text>
          <Text style={styles.bodyText}>
            The system operates as an end-to-end management dashboard. It tracks metric sizes 
            from 200L domestic variants up to 25,000L industrial assets, manages internal 
            employee metadata securely under AES-256 encryption rules, and syncs account display 
            preferences directly across dark and light layout systems.
          </Text>
        </View>

        {/* Section 3: Account Security & Credentials Reference Matrix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Account Security</Text>
          <Text style={styles.bodyText}>
            By signing in, you agree to maintain complex credential integrity. Any update 
            to authentication tokens or internal configurations inside the account control panel 
            must comply with network diagnostic criteria to lock out unauthorized clients.
          </Text>

          {/* 🌟 Corporate Credentials Grid Ledger */}
          <Text style={styles.matrixHeading}>🔑 Corporate Reference Matrix</Text>
          <View style={styles.matrixContainer}>
            {credentialsList.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.matrixRow, 
                  index !== credentialsList.length - 1 && styles.rowDivider
                ]}
              >
                <View style={styles.col}>
                  <Text style={styles.metaLabel}>Username</Text>
                  <Text style={styles.metaValue}>{item.user}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.metaLabel}>Password</Text>
                  <Text style={styles.metaValueCode}>{item.pass}</Text>
                </View>
                <View style={styles.colRight}>
                  <Text style={styles.metaLabelRight}>System Role</Text>
                  <Text style={styles.metaValueBadge}>{item.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Accept Action Button Anchor */}
      <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.8}>
        <Text style={styles.backButtonText}>I Understand & Accept</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 24, paddingBottom: 24 },
  topBar: { paddingTop: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' },
  backArrowButton: { paddingVertical: 8, paddingRight: 16 },
  backArrowText: { fontSize: 16, fontWeight: '700', color: '#1E3A8A' },
  scrollContent: { paddingTop: 10, paddingBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#1E3A8A', marginBottom: 24, letterSpacing: 0.5, textAlign: 'center' },
  section: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  bodyText: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  
  /* Custom Credentials Grid Table Styles Layout */
  matrixHeading: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', color: '#0284C7', marginTop: 18, marginBottom: 10, letterSpacing: 0.5 },
  matrixContainer: { backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 4 },
  matrixRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  col: { flex: 1, paddingRight: 4 },
  colRight: { flex: 1, alignItems: 'flex-end' },
  metaLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  metaLabelRight: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', textAlign: 'right' },
  metaValue: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 2 },
  metaValueCode: { fontSize: 12, fontWeight: '700', color: '#0284C7', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  metaValueBadge: { fontSize: 11, fontWeight: '800', color: '#10B981', marginTop: 3 },

  backButton: { backgroundColor: '#1E3A8A', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  backButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
