// pages/profile/ProfilePage.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import userService from '../../stores/userService';
import DEFAULT_AVATAR from '../../../assets/logo.png';

// ================================================================
// HELPERS
// ================================================================
const ROLE_COLORS = {
  admin: '#8B5CF6',
  superadmin: '#8B5CF6',
  manager: '#3B82F6',
  finance: '#10B981',
  hr: '#10B981',
  checker: '#0EA5E9',
  purchase_organizer: '#F59E0B',
  purchaser: '#F59E0B',
  storekeeper: '#EC4899',
  store_it: '#EC4899',
  attendance: '#6366F1',
  employee: '#64748B',
};

const getRoleColor = (role) =>
  ROLE_COLORS[String(role || '').toLowerCase()] || '#3B82F6';

const EMPLOYMENT_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  'on-leave': 'On Leave',
  terminated: 'Terminated',
  retired: 'Retired',
};

const EMPLOYMENT_TYPE_LABELS = {
  'full-time': 'Full-Time',
  'part-time': 'Part-Time',
  contract: 'Contract',
  intern: 'Intern',
};

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

const MARITAL_LABELS = {
  single: 'Single',
  married: 'Married',
  divorced: 'Divorced',
  widowed: 'Widowed',
};

const hasValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const formatAddress = (addr) => {
  if (!addr || typeof addr !== 'object') return '';
  const parts = [
    addr.region,
    addr.city,
    addr.subcity,
    addr.district,
    addr.kebele,
    addr.houseNumber,
    addr.poBox,
  ].filter((p) => p !== undefined && p !== null && String(p).trim() !== '');
  return parts.join(', ');
};

const formatEmergencyContact = (contact) => {
  if (!contact || typeof contact !== 'object') return '';
  const name = contact.name || '';
  const relationship = contact.relationship || '';
  const phone = contact.phone || contact.alternatePhone || '';

  const pieces = [];
  if (name) pieces.push(name);
  if (relationship) pieces.push(`(${relationship})`);
  if (phone) pieces.push(`· ${phone}`);

  return pieces.join(' ');
};

// ================================================================
// COMPONENT
// ================================================================
export default function ProfilePage({ darkMode }) {
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';
  const dividerColor = darkMode ? '#334155' : '#F1F5F9';

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [localAvatar, setLocalAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ------------------------------------------------------------
  // LOAD PROFILE
  // ------------------------------------------------------------
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await userService.getMyProfile();

      if (res.success && res.user) {
        setProfile(res.user);
      } else {
        setError(res.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('ProfilePage load failed:', err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to load profile',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ------------------------------------------------------------
  // UPLOAD HANDLER
  // ------------------------------------------------------------
  const handlePickedImage = async (asset) => {
    // employeeId comes from the loaded profile (nested or flat)
    const employeeId =
      profile?.employeeId ||
      profile?.employee?.employeeId ||
      null;

    if (!employeeId) {
      Alert.alert(
        'Not linked',
        'Your account is not linked to an employee record. Contact an administrator.',
      );
      return;
    }

    setLocalAvatar(asset.uri);
    setUploading(true);

    try {
      const res = await userService.uploadProfilePicture(employeeId, asset);

      if (res?.success && res.fileUrl) {
        setProfile((p) =>
          p
            ? {
                ...p,
                profilePicture: res.fileUrl,
                avatar: res.fileUrl,
              }
            : p,
        );
        setLocalAvatar(null);
        Alert.alert('✅ Avatar updated');
      } else {
        Alert.alert('Upload failed', res?.error || 'Try again');
        setLocalAvatar(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload failed', err?.message || 'Try again');
      setLocalAvatar(null);
    } finally {
      setUploading(false);
    }
  };

  // ------------------------------------------------------------
  // CAMERA
  // ------------------------------------------------------------
  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take a profile photo.',
        );
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],       // ✅ new API, no deprecation warning
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (res.canceled) return;

      const asset = res.assets?.[0];
      if (asset?.uri) {
        handlePickedImage({
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
      }
    } catch (e) {
      console.error('Camera error:', e);
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  // ------------------------------------------------------------
  // GALLERY
  // ------------------------------------------------------------
  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to choose a picture.',
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],       // ✅ new API
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (res.canceled) return;

      const asset = res.assets?.[0];
      if (asset?.uri) {
        handlePickedImage({
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
        });
      }
    } catch (e) {
      console.error('Gallery error:', e);
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  // ------------------------------------------------------------
  // PICKER SHEET
  // ------------------------------------------------------------
  const handleAvatarPress = () => {
    if (uploading) return;

    Alert.alert(
      'Change Profile Photo',
      'Choose a source',
      [
        { text: '📷  Camera', onPress: pickFromCamera },
        { text: '🖼️  Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  // ------------------------------------------------------------
  // LOADING / ERROR
  // ------------------------------------------------------------
  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' },
        ]}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.centerText, { color: subTextColor }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' },
        ]}
      >
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.centerText, { color: subTextColor }]}>
          {error || 'Profile not available'}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={loadProfile}
          activeOpacity={0.85}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ------------------------------------------------------------
  // DERIVE
  // ------------------------------------------------------------
  const emp = profile.employee || {};

  const fullName =
    profile.fullName ||
    [emp.firstName, emp.middleName, emp.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    profile.username ||
    'User';

  const role = profile.role || 'Employee';
  const roleColor = getRoleColor(role);
  const displayRole = userService.formatRole(role);

  const title =
    emp.title || (emp.position && emp.position.title) || displayRole;

  const employeeId =
    emp.employeeCode ||
    profile.employeeCode ||
    (emp.employeeId ? `EMP-${emp.employeeId}` : null);

  const avatarUri =
    localAvatar ||
    profile.profilePicture ||
    profile.avatar ||
    emp.profilePicture ||
    null;

  // ------------------------------------------------------------
  // BUILD ROWS
  // ------------------------------------------------------------
  const employmentRows = [
    { icon: '👤', label: 'Username', value: profile.username },
    { icon: '🏢', label: 'Department', value: profile.departmentName || emp.departmentName },
    { icon: '🎯', label: 'Position', value: emp.title },
    {
      icon: '📊',
      label: 'Employment Type',
      value: EMPLOYMENT_TYPE_LABELS[emp.employmentType],
    },
    {
      icon: '🚦',
      label: 'Status',
      value: EMPLOYMENT_STATUS_LABELS[emp.employmentStatus],
    },
    { icon: '📅', label: 'Hire Date (EC)', value: emp.hireDateEC },
    {
      icon: '📅',
      label: 'Hire Date',
      value: emp.hireDateGC ? userService.formatDate(emp.hireDateGC) : null,
    },
  ].filter((row) => hasValue(row.value));

  const contactRows = [
    { icon: '📧', label: 'Email', value: profile.email },
    { icon: '📱', label: 'Phone', value: emp.phoneNumber || profile.phoneNumber },
    { icon: '✉️', label: 'Work Email', value: emp.workEmail },
    { icon: '✉️', label: 'Personal Email', value: emp.personalEmail },
    {
      icon: '🆘',
      label: 'Emergency Contact',
      value: formatEmergencyContact(emp.emergencyContact),
    },
  ].filter((row) => hasValue(row.value));

  const personalRows = [
    { icon: '⚧', label: 'Gender', value: GENDER_LABELS[emp.gender] },
    {
      icon: '💍',
      label: 'Marital Status',
      value: MARITAL_LABELS[emp.maritalStatus],
    },
    { icon: '🌍', label: 'Nationality', value: emp.nationality },
    { icon: '🎂', label: 'Date of Birth (EC)', value: emp.dateOfBirthEC },
    {
      icon: '🎂',
      label: 'Date of Birth',
      value: emp.dateOfBirthGC
        ? userService.formatDate(emp.dateOfBirthGC)
        : null,
    },
  ].filter((row) => hasValue(row.value));

  const addressRows = [
    {
      icon: '🏠',
      label: 'Current Address',
      value: formatAddress(emp.currentAddress),
    },
    {
      icon: '🏡',
      label: 'Permanent Address',
      value: formatAddress(emp.permanentAddress),
    },
    { icon: '🗺️', label: 'Work Location', value: emp.workLocation },
  ].filter((row) => hasValue(row.value));

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ============ HERO CARD ============ */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            style={[styles.avatarWrapper, { borderColor: roleColor }]}
            onPress={handleAvatarPress}
            activeOpacity={0.85}
            disabled={uploading}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                onError={(e) => {
                  console.warn('Avatar load failed:', e?.nativeEvent?.error);
                }}
              />
            ) : (
              <Image source={DEFAULT_AVATAR} style={styles.avatarImage} />
            )}

            <View style={[styles.statusDot, { borderColor: cardBg }]} />

            <View
              style={[
                styles.editBadge,
                { backgroundColor: roleColor, borderColor: cardBg },
              ]}
            >
              <Text style={styles.editBadgeIcon}>📷</Text>
            </View>

            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.heroTextBlock}>
            <Text
              style={[styles.nameText, { color: textColor }]}
              numberOfLines={1}
            >
              {fullName}
            </Text>
            <Text
              style={[styles.titleText, { color: subTextColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>

            <View
              style={[styles.rolePill, { backgroundColor: roleColor + '20' }]}
            >
              <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
              <Text style={[styles.rolePillText, { color: roleColor }]}>
                {displayRole}
              </Text>
            </View>
          </View>
        </View>

        {hasValue(employeeId) && (
          <View
            style={[
              styles.idStrip,
              {
                backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                borderColor,
              },
            ]}
          >
            <Text style={[styles.idLabel, { color: subTextColor }]}>
              EMPLOYEE ID
            </Text>
            <Text style={[styles.idValue, { color: textColor }]}>
              {employeeId}
            </Text>
          </View>
        )}
      </View>

      {/* ============ EMPLOYMENT ============ */}
      {employmentRows.length > 0 && (
        <Section
          title="💼 Employment"
          textColor={textColor}
          cardBg={cardBg}
          borderColor={borderColor}
        >
          {employmentRows.map((row, idx) => (
            <InfoRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              textColor={textColor}
              subTextColor={subTextColor}
              dividerColor={dividerColor}
              isLast={idx === employmentRows.length - 1}
            />
          ))}
        </Section>
      )}

      {/* ============ CONTACT ============ */}
      {contactRows.length > 0 && (
        <Section
          title="📞 Contact"
          textColor={textColor}
          cardBg={cardBg}
          borderColor={borderColor}
        >
          {contactRows.map((row, idx) => (
            <InfoRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              textColor={textColor}
              subTextColor={subTextColor}
              dividerColor={dividerColor}
              isLast={idx === contactRows.length - 1}
            />
          ))}
        </Section>
      )}

      {/* ============ PERSONAL ============ */}
      {personalRows.length > 0 && (
        <Section
          title="👤 Personal"
          textColor={textColor}
          cardBg={cardBg}
          borderColor={borderColor}
        >
          {personalRows.map((row, idx) => (
            <InfoRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              textColor={textColor}
              subTextColor={subTextColor}
              dividerColor={dividerColor}
              isLast={idx === personalRows.length - 1}
            />
          ))}
        </Section>
      )}

      {/* ============ ADDRESS ============ */}
      {addressRows.length > 0 && (
        <Section
          title="📍 Address"
          textColor={textColor}
          cardBg={cardBg}
          borderColor={borderColor}
        >
          {addressRows.map((row, idx) => (
            <InfoRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              textColor={textColor}
              subTextColor={subTextColor}
              dividerColor={dividerColor}
              isLast={idx === addressRows.length - 1}
            />
          ))}
        </Section>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ================================================================
// SECTION WRAPPER
// ================================================================
function Section({ title, children, textColor, cardBg, borderColor }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        {title}
      </Text>
      <View
        style={[styles.detailsCard, { backgroundColor: cardBg, borderColor }]}
      >
        {children}
      </View>
    </View>
  );
}

// ================================================================
// INFO ROW
// ================================================================
function InfoRow({
  icon,
  label,
  value,
  textColor,
  subTextColor,
  dividerColor,
  isLast,
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: dividerColor,
        },
      ]}
    >
      <View style={styles.infoLeft}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <Text style={[styles.infoLabel, { color: subTextColor }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.infoValue, { color: textColor }]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

// ================================================================
// STYLES (unchanged)
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  centerText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorIcon: { fontSize: 40 },
  retryBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    backgroundColor: '#E2E8F0',
  },
  statusDot: {
    width: 18,
    height: 18,
    backgroundColor: '#10B981',
    borderRadius: 9,
    position: 'absolute',
    top: 0,
    right: 0,
    borderWidth: 3,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  editBadgeIcon: { fontSize: 11, color: '#FFFFFF' },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 38,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroTextBlock: { flex: 1, minWidth: 0 },
  nameText: { fontSize: 20, fontWeight: '800', letterSpacing: 0.2 },
  titleText: { fontSize: 13, fontWeight: '500', marginTop: 3 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  rolePillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  idStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  idLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },
  idValue: { fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },

  detailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  infoIcon: { fontSize: 15 },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
});