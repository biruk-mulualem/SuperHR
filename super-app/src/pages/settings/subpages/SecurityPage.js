import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert
} from 'react-native';
// 🌟 1. Import the native biometric module we installed
import * as LocalAuthentication from 'expo-local-authentication'; 

export default function SecurityPage({ darkMode }) {
  // Input tracking states
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🌟 2. Biometric state toggles
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // Check hardware security support when the page mounts
  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      // Only permit activation if hardware exists and the user has set up prints on their phone settings
      setIsBiometricSupported(hasHardware && isEnrolled);
    })();
  }, []);

  // Dynamic color assignments matching your global midnight look
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardColor = darkMode ? '#1E293B' : '#FFFFFF';
  const inputBg = darkMode ? '#0F172A' : '#F8FAFC';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';

  // 🌟 3. Handle Biometric Scanner Toggle
  const toggleBiometricLock = async (value) => {
    if (!isBiometricSupported) {
      Alert.alert(
        'Not Supported', 
        'Your hardware is missing biometric support or no fingerprints/FaceID are enrolled in your phone settings.'
      );
      return;
    }

    if (value === true) {
      // Trigger native scanner prompt to verify it's the owner before locking
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric protection lock',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setIsBiometricEnabled(true);
        Alert.alert('Success', 'Biometric login has been activated successfully!');
      } else {
        setIsBiometricEnabled(false);
      }
    } else {
      setIsBiometricEnabled(false);
    }
  };

  const handleUpdateUsername = () => {
    if (!newUsername.trim()) {
      alert('Please fill out the new username input field first!');
      return;
    }
    alert(`Success! Username changed to: ${newUsername}`);
    setNewUsername('');
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill out all missing password fields!');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Mismatch error! Your new passwords do not match.');
      return;
    }
    alert('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.sectionTitle, { color: darkMode ? '#93C5FD' : '#1E3A8A' }]}>
        Security & Credentials
      </Text>

      {/* ================= 🌟 NEW SECTION: BIOMETRIC AUTH SYSTEM ================= */}
      <View style={[styles.card, { backgroundColor: cardColor, borderColor, marginBottom: 16 }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Biometric Shield Protection</Text>
        <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
          Use your device native Face ID or Fingerprint hardware to lock out session intrusions instantly.
        </Text>
        
        <View style={styles.biometricRow}>
          <Text style={[styles.biometricLabel, { color: textColor }]}>
            Enable Fingerprint / Face ID
          </Text>
          <Switch
            trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            thumbColor={isBiometricEnabled ? '#F8FAFC' : '#F1F5F9'}
            onValueChange={toggleBiometricLock}
            value={isBiometricEnabled}
          />
        </View>
        
        {!isBiometricSupported && (
          <Text style={styles.warningText}>
            ⚠️ Device biometric hardware not enrolled or unavailable.
          </Text>
        )}
      </View>

      {/* ================= SECTION 2: USERNAME ADJUSTMENT ================= */}
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Update Core Username</Text>
        <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
          Change your system routing login credential profile alias here.
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
          placeholder="Enter new username handle"
          placeholderTextColor={subTextColor}
          value={newUsername}
          onChangeText={setNewUsername}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.actionButton} onPress={handleUpdateUsername} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>Update Account Handle</Text>
        </TouchableOpacity>
      </View>

      {/* ================= SECTION 3: PASSWORD ADJUSTMENT ================= */}
      <View style={[styles.card, { backgroundColor: cardColor, borderColor, marginTop: 16 }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Change Secret Password</Text>
        <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
          Enforce complex metrics strings to lock out unauthorized clients.
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
          placeholder="Verify Current Password"
          placeholderTextColor={subTextColor}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
          placeholder="Configure New Password"
          placeholderTextColor={subTextColor}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
          placeholder="Confirm New Password"
          placeholderTextColor={subTextColor}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#10B981' }]} 
          onPress={handleUpdatePassword} 
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Save Encrypted Password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160, 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  biometricLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 10,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#1E3A8A',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
