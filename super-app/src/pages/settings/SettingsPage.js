import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';

export default function SettingsPage({ darkMode, onLogout, setSubView, userRole, userName }) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const textColor = darkMode ? '#F1F5F9' : '#0F172A';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardColor = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';
  const divider = darkMode ? '#1E293B' : '#F1F5F9';
  const danger = '#EF4444';
  const dangerSoft = darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';

  const openConfirm = () => setConfirmVisible(true);
  const closeConfirm = () => setConfirmVisible(false);

  const doLogout = async () => {
    try {
      setLoggingOut(true);
      if (typeof onLogout === 'function') {
        await onLogout();
      }
    } catch (e) {
      console.warn('Logout failed:', e);
      Alert.alert('Logout failed', 'Please try again.');
    } finally {
      setLoggingOut(false);
      setConfirmVisible(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: textColor }]}>Settings</Text>
          <Text style={[styles.pageSubtitle, { color: subTextColor }]}>
            {userName ? `Signed in as ${userName}` : 'Manage your app experience'}
            {userRole ? ` · ${userRole.toUpperCase()}` : ''}
          </Text>
        </View>

        {/* Preferences */}
        <Text style={[styles.groupLabel, { color: subTextColor }]}>PREFERENCES</Text>
        <View style={[styles.menuCard, { backgroundColor: cardColor, borderColor }]}>
          <MenuRow
            icon="🎨"
            label="Display Preferences"
            sub="Dark mode and layout appearance"
            onPress={() => setSubView('pref')}
            textColor={textColor}
            subTextColor={subTextColor}
            borderColor={divider}
          />
          <MenuRow
            icon="🔒"
            label="Account Security"
            sub="Biometrics, username, and password"
            onPress={() => setSubView('sec')}
            textColor={textColor}
            subTextColor={subTextColor}
            borderColor={divider}
          />
          <MenuRow
            icon="ℹ️"
            label="System Information"
            sub="Version, environment, and diagnostics"
            onPress={() => setSubView('sys')}
            textColor={textColor}
            subTextColor={subTextColor}
            borderColor={divider}
            last
          />
        </View>

        {/* Account */}
        <Text style={[styles.groupLabel, { color: subTextColor }]}>ACCOUNT</Text>
        <View style={[styles.menuCard, { backgroundColor: cardColor, borderColor }]}>
          <MenuRow
            icon="🚪"
            label="Log Out"
            sub="End your session on this device"
            onPress={openConfirm}
            textColor={danger}
            subTextColor={subTextColor}
            borderColor={divider}
            last
            danger
          />
        </View>

        {/* Footer */}
        <View style={styles.footerNote}>
          <Text style={[styles.footerText, { color: subTextColor }]}>
            Version 1.0.0 · Signed in as {userName || 'guest'}
          </Text>
        </View>
      </ScrollView>

      {/* Compact confirm modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={closeConfirm}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: cardColor, borderColor }]}>
            {/* Icon */}
            <View style={[styles.modalIconWrap, { backgroundColor: dangerSoft }]}>
              <Text style={styles.modalIcon}>🚪</Text>
            </View>

            {/* Text */}
            <Text style={[styles.modalTitle, { color: textColor }]}>Log out?</Text>
            <Text style={[styles.modalBody, { color: subTextColor }]}>
              You'll need to sign in again.
            </Text>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeConfirm}
                disabled={loggingOut}
                activeOpacity={0.85}
                style={[
                  styles.modalBtn,
                  { backgroundColor: darkMode ? '#0F172A' : '#F1F5F9', borderColor },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={doLogout}
                disabled={loggingOut}
                activeOpacity={0.9}
                style={[
                  styles.modalBtn,
                  { backgroundColor: danger, borderColor: danger },
                ]}
              >
                {loggingOut ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ---------------- Row ---------------- */

function MenuRow({ icon, label, sub, onPress, textColor, subTextColor, borderColor, last, danger }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.menuRow,
        !last && { borderBottomWidth: 1, borderBottomColor: borderColor },
      ]}
    >
      <View style={[styles.iconWrap, danger && { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
        <Text style={styles.menuEmoji}>{icon}</Text>
      </View>

      <View style={styles.textColumn}>
        <Text style={[styles.menuLabel, { color: textColor }]}>{label}</Text>
        <Text style={[styles.menuSubLabel, { color: subTextColor }]} numberOfLines={1}>
          {sub}
        </Text>
      </View>

      <Text style={[styles.chevron, { color: subTextColor }]}>❯</Text>
    </TouchableOpacity>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },

  // Header
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  pageSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },

  // Group label
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Menu
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.10)',
  },
  menuEmoji: { fontSize: 20 },
  textColumn: { flex: 1, minWidth: 0 },
  menuLabel: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  menuSubLabel: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  chevron: { fontSize: 14, fontWeight: '600', paddingLeft: 4 },

  // Footer
  footerNote: { alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 11, lineHeight: 15, textAlign: 'center' },

  // Modal — compact
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalIcon: { fontSize: 22 },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalBody: {
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});