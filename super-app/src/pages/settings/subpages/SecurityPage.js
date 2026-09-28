import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SecurityPage({ darkMode }) {
  // Input tracking states
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Biometric state
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null); // 'fingerprint' | 'face' | 'iris' | null
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // Loading states
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // ---------- theme ----------
  const textColor = darkMode ? '#F1F5F9' : '#0F172A';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardColor = darkMode ? '#1E293B' : '#FFFFFF';
  const inputBg = darkMode ? '#0F172A' : '#F8FAFC';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';
  const accent = darkMode ? '#60A5FA' : '#1E3A8A';
  const accentSoft = darkMode ? '#1E3A8A33' : '#DBEAFE';
  const divider = darkMode ? '#1E293B' : '#F1F5F9';

  // ---------- biometrics discovery ----------
  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      let type = null;
      if (hasHardware) {
        const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) type = 'face';
        else if (supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) type = 'fingerprint';
        else if (supported.includes(LocalAuthentication.AuthenticationType.IRIS)) type = 'iris';
      }

      setIsBiometricSupported(hasHardware && isEnrolled);
      setBiometricType(type);
    })();
  }, []);

  const biometricLabel =
    biometricType === 'face' ? 'Face ID' :
    biometricType === 'fingerprint' ? 'Fingerprint' :
    biometricType === 'iris' ? 'Iris Scan' :
    'Biometric';

  // ---------- handlers ----------
  const toggleBiometricLock = async (value) => {
    if (!isBiometricSupported) {
      Alert.alert(
        'Not Supported',
        'Biometric hardware is missing or no fingerprint / Face ID is enrolled in your device settings.'
      );
      return;
    }

    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricLabel} lock`,
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        setIsBiometricEnabled(true);
        Alert.alert('Enabled', `${biometricLabel} lock is now active.`);
      } else {
        setIsBiometricEnabled(false);
      }
    } else {
      setIsBiometricEnabled(false);
    }
  };

  const handleUpdateUsername = () => {
    if (!newUsername.trim()) {
      Alert.alert('Missing field', 'Enter a new username first.');
      return;
    }
    setSavingUsername(true);
    setTimeout(() => {
      Alert.alert('Demo only', 'Username change is not connected to the backend yet.');
      setNewUsername('');
      setSavingUsername(false);
    }, 600);
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all three password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      Alert.alert('Demo only', 'Password change is not connected to the backend yet.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSavingPassword(false);
    }, 600);
  };

  // Security score (cosmetic — sells the design)
  const score =
    (isBiometricEnabled ? 1 : 0) +
    (newPassword.length >= 8 ? 1 : 0) +
    1; // baseline "strong"
  const scoreLabel =
    score >= 3 ? 'Excellent' :
    score === 2 ? 'Good' :
    'Basic';
  const scoreColor =
    score >= 3 ? '#10B981' :
    score === 2 ? '#F59E0B' :
    '#EF4444';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= HEADER ================= */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: textColor }]}>Security</Text>
        <Text style={[styles.pageSubtitle, { color: subTextColor }]}>
          Protect your account, credentials, and session
        </Text>
      </View>

      {/* ================= SECURITY SCORE ================= */}
      <View
        style={[
          styles.scoreCard,
          { backgroundColor: accentSoft, borderColor: accent + '55' },
        ]}
      >
        <View style={styles.scoreLeft}>
          <Text style={[styles.scoreValue, { color: accent }]}>{score}/3</Text>
          <Text style={[styles.scoreLabelSmall, { color: subTextColor }]}>
            Security score
          </Text>
        </View>
        <View style={styles.scoreRight}>
          <View style={[styles.scoreDot, { backgroundColor: scoreColor }]} />
          <Text style={[styles.scoreStatus, { color: scoreColor }]}>{scoreLabel}</Text>
        </View>
      </View>

      {/* ================= BIOMETRIC ================= */}
      <Section
        title="Biometric Lock"
        icon="🔐"
        subtitle={`Unlock the app with ${biometricLabel}`}
        textColor={textColor}
        subTextColor={subTextColor}
        cardColor={cardColor}
        borderColor={borderColor}
      >
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.rowLabel, { color: textColor }]}>
              {biometricLabel} protection
            </Text>
            <Text style={[styles.rowHint, { color: subTextColor }]}>
              {isBiometricSupported
                ? 'Prompt on app launch and after background'
                : 'Not available on this device'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            thumbColor="#F8FAFC"
            onValueChange={toggleBiometricLock}
            value={isBiometricEnabled}
            disabled={!isBiometricSupported}
          />
        </View>

        {!isBiometricSupported && (
          <View style={[styles.warnBox, { backgroundColor: darkMode ? '#7F1D1D22' : '#FEF2F2', borderColor: darkMode ? '#7F1D1D' : '#FECACA' }]}>
            <Text style={[styles.warnText, { color: darkMode ? '#FCA5A5' : '#B91C1C' }]}>
              ⚠️ Biometric hardware not enrolled. Enable Face ID / fingerprint in your device settings to use this.
            </Text>
          </View>
        )}
      </Section>

      {/* ================= USERNAME ================= */}
      <Section
        title="Account Handle"
        icon="👤"
        subtitle="Your public login name for this system"
        textColor={textColor}
        subTextColor={subTextColor}
        cardColor={cardColor}
        borderColor={borderColor}
      >
        <Field
          label="New username"
          value={newUsername}
          onChangeText={setNewUsername}
          placeholder="e.g. abebe.kebede"
          autoCapitalize="none"
          textColor={textColor}
          subTextColor={subTextColor}
          inputBg={inputBg}
          borderColor={borderColor}
        />

        <PrimaryButton
          label={savingUsername ? 'Saving…' : 'Update Username'}
          onPress={handleUpdateUsername}
          loading={savingUsername}
          disabled={savingUsername || !newUsername.trim()}
          color={accent}
        />
      </Section>

      {/* ================= PASSWORD ================= */}
      <Section
        title="Password"
        icon="🔑"
        subtitle="Use at least 8 characters with a mix of letters and numbers"
        textColor={textColor}
        subTextColor={subTextColor}
        cardColor={cardColor}
        borderColor={borderColor}
      >
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          visible={showCurrent}
          toggleVisible={() => setShowCurrent((v) => !v)}
          textColor={textColor}
          subTextColor={subTextColor}
          inputBg={inputBg}
          borderColor={borderColor}
        />
        <PasswordField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          visible={showNew}
          toggleVisible={() => setShowNew((v) => !v)}
          textColor={textColor}
          subTextColor={subTextColor}
          inputBg={inputBg}
          borderColor={borderColor}
        />
        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          visible={showConfirm}
          toggleVisible={() => setShowConfirm((v) => !v)}
          textColor={textColor}
          subTextColor={subTextColor}
          inputBg={inputBg}
          borderColor={borderColor}
        />

        {/* live rules */}
        <View style={styles.rulesRow}>
          <Rule ok={newPassword.length >= 8} label="8+ characters" />
          <Rule ok={/[A-Z]/.test(newPassword)} label="1 uppercase" />
          <Rule ok={/\d/.test(newPassword)} label="1 number" />
        </View>

        <PrimaryButton
          label={savingPassword ? 'Saving…' : 'Update Password'}
          onPress={handleUpdatePassword}
          loading={savingPassword}
          disabled={savingPassword}
          color="#10B981"
        />
      </Section>

      {/* ================= FOOTER NOTE ================= */}
      <View style={styles.footerNote}>
        <Text style={[styles.footerText, { color: subTextColor }]}>
          🔒 Your credentials are transmitted securely. Never share your password with anyone, including support staff.
        </Text>
      </View>
    </ScrollView>
  );
}

/* ================================================================
   Small building blocks
   ================================================================ */

function Section({ title, icon, subtitle, children, textColor, subTextColor, cardColor, borderColor }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionIcon]}>{icon}</Text>
        <View>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        {children}
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, autoCapitalize, textColor, subTextColor, inputBg, borderColor }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: subTextColor }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={subTextColor}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
      />
    </View>
  );
}

function PasswordField({ label, value, onChangeText, visible, toggleVisible, textColor, subTextColor, inputBg, borderColor }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: subTextColor }]}>{label}</Text>
      <View style={[styles.passwordWrap, { backgroundColor: inputBg, borderColor }]}>
        <TextInput
          style={[styles.passwordInput, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor={subTextColor}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={toggleVisible} hitSlop={10} style={styles.eyeBtn}>
          <Text style={[styles.eyeText, { color: subTextColor }]}>
            {visible ? '🙈' : '👁️'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Rule({ ok, label }) {
  return (
    <View style={styles.ruleItem}>
      <Text style={[styles.ruleDot, { color: ok ? '#10B981' : '#94A3B8' }]}>
        {ok ? '●' : '○'}
      </Text>
      <Text style={[styles.ruleLabel, { color: ok ? '#10B981' : '#94A3B8' }]}>
        {label}
      </Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, loading, disabled, color }) {
  const bg = disabled ? '#94A3B8' : color;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, { backgroundColor: bg }]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

/* ================================================================
   Styles
   ================================================================ */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  pageSubtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },

  // Score card
  scoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  scoreLeft: {},
  scoreValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  scoreLabelSmall: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreDot: { width: 10, height: 10, borderRadius: 5 },
  scoreStatus: { fontSize: 14, fontWeight: '700' },

  // Section
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 11.5, marginTop: 2, lineHeight: 15 },

  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },

  // Row
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, fontWeight: '700' },
  rowHint: { fontSize: 11.5, marginTop: 2, lineHeight: 15 },

  // Warn
  warnBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  warnText: { fontSize: 11.5, fontWeight: '600', lineHeight: 16 },

  // Field
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14.5,
    fontWeight: '500',
  },

  // Password
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeBtn: { paddingLeft: 10 },
  eyeText: { fontSize: 16 },

  // Rules
  rulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    marginTop: -4,
  },
  ruleItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ruleDot: { fontSize: 8 },
  ruleLabel: { fontSize: 11, fontWeight: '600' },

  // Button
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800', letterSpacing: 0.2 },

  // Footer
  footerNote: { paddingHorizontal: 4, marginTop: 4 },
  footerText: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
});