// pages/profile/ProfilePage.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// ================================================================
// USER PROFILES
// ================================================================
const USER_PROFILES = {
  admin: {
    name: 'John Doe',
    title: 'System Administrator',
    role: 'Admin (Master Access)',
    roleColor: '#8B5CF6',
    id: 'EMP-2026-01',
    department: 'IT & Security Infrastructure',
    email: 'john.doe@superfiber.com',
    phone: '+251 900 11 22 33',
    joinedDate: 'Mar 2022',
    initials: 'JD',
    avatar: 'https://i.pravatar.cc/300?img=12',
  },
  sales: {
    name: 'Flynn Rider',
    title: 'Senior Distribution Lead',
    role: 'Sales Representative',
    roleColor: '#10B981',
    id: 'EMP-2026-99',
    department: 'Logistics & Supply Chain',
    email: 'flynn.rider@superfiber.com',
    phone: '+251 911 23 45 67',
    joinedDate: 'Jan 2024',
    initials: 'FR',
    avatar: 'https://i.pravatar.cc/300?img=15',
  },
  purchaser: {
    name: 'Sam Purchaser',
    title: 'Procurement Specialist',
    role: 'Purchaser',
    roleColor: '#F59E0B',
    id: 'EMP-2026-04',
    department: 'Purchasing & Inventory',
    email: 'sam.p@superfiber.com',
    phone: '+251 922 44 55 66',
    joinedDate: 'Jul 2023',
    initials: 'SP',
    avatar: 'https://i.pravatar.cc/300?img=33',
  },
  manager: {
    name: 'Alex Manager',
    title: 'Operations Director',
    role: 'General Manager',
    roleColor: '#3B82F6',
    id: 'EMP-2026-02',
    department: 'Corporate Management',
    email: 'alex.m@superfiber.com',
    phone: '+251 933 77 88 99',
    joinedDate: 'Nov 2021',
    initials: 'AM',
    avatar: 'https://i.pravatar.cc/300?img=52',
  },
  auditor: {
    name: 'Elena Auditor',
    title: 'Financial Compliance Officer',
    role: 'Auditor',
    roleColor: '#EF4444',
    id: 'EMP-2026-07',
    department: 'Auditing & Finance',
    email: 'elena.a@superfiber.com',
    phone: '+251 944 22 33 44',
    joinedDate: 'May 2024',
    initials: 'EA',
    avatar: 'https://i.pravatar.cc/300?img=45',
  },
};

const FALLBACK_KEY = 'sales';

// ================================================================
// COMPONENT
// ================================================================
export default function ProfilePage({ darkMode, userRole }) {
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';
  const dividerColor = darkMode ? '#1E293B' : '#F1F5F9';

  const roleKey = (userRole || FALLBACK_KEY).toLowerCase();
  const profile = USER_PROFILES[roleKey] || USER_PROFILES[FALLBACK_KEY];

  // Local avatar override — starts null so we use the CDN image
  const [localAvatar, setLocalAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);

  const avatarUri = localAvatar || profile.avatar;

  // ---------- Pick from camera ----------
  const pickFromCamera = async () => {
    try {
      const res = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        cameraType: 'front',
      });

      if (res.didCancel) return;
      if (res.errorCode) {
        Alert.alert('Camera Error', res.errorMessage || 'Failed to open camera.');
        return;
      }

      const asset = res.assets?.[0];
      if (asset?.uri) handlePickedImage(asset);
    } catch (e) {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  // ---------- Pick from gallery ----------
  const pickFromGallery = async () => {
    try {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (res.didCancel) return;
      if (res.errorCode) {
        Alert.alert('Gallery Error', res.errorMessage || 'Failed to open gallery.');
        return;
      }

      const asset = res.assets?.[0];
      if (asset?.uri) handlePickedImage(asset);
    } catch (e) {
      Alert.alert('Error', 'Could not open gallery.');
    }
  };

  // ---------- Handle the picked image ----------
  const handlePickedImage = async (asset) => {
    // Swap locally right away
    setLocalAvatar(asset.uri);

    // TODO: Upload the file to your API and update the profile.
    // Example:
    //   setUploading(true);
    //   try {
    //     const formData = new FormData();
    //     formData.append('avatar', {
    //       uri: asset.uri,
    //       type: asset.type || 'image/jpeg',
    //       name: asset.fileName || 'avatar.jpg',
    //     });
    //     const res = await fetch('https://your-api.com/users/me/avatar', {
    //       method: 'POST',
    //       body: formData,
    //       headers: { 'Content-Type': 'multipart/form-data' },
    //     });
    //     const data = await res.json();
    //     setLocalAvatar(data.avatarUrl);
    //   } catch (e) {
    //     Alert.alert('Upload failed', e.message);
    //   } finally {
    //     setUploading(false);
    //   }

    console.log('Picked avatar asset:', asset);
  };

  // ---------- Show the picker sheet ----------
  const handleAvatarPress = () => {
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
          {/* Tappable avatar */}
          <TouchableOpacity
            style={[
              styles.avatarWrapper,
              { borderColor: profile.roleColor },
            ]}
            onPress={handleAvatarPress}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
            />

            {/* Online dot (top-right) */}
            <View
              style={[styles.statusDot, { borderColor: cardBg }]}
            />

            {/* Camera edit badge (bottom-right) */}
            <View
              style={[
                styles.editBadge,
                {
                  backgroundColor: profile.roleColor,
                  borderColor: cardBg,
                },
              ]}
            >
              <Text style={styles.editBadgeIcon}>📷</Text>
            </View>

            {/* Uploading overlay */}
            {uploading && (
              <View style={styles.uploadOverlay}>
                <Text style={styles.uploadOverlayText}>⏳</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.heroTextBlock}>
            <Text
              style={[styles.nameText, { color: textColor }]}
              numberOfLines={1}
            >
              {profile.name}
            </Text>
            <Text
              style={[styles.titleText, { color: subTextColor }]}
              numberOfLines={1}
            >
              {profile.title}
            </Text>

            <View
              style={[
                styles.rolePill,
                { backgroundColor: profile.roleColor + '20' },
              ]}
            >
              <View
                style={[
                  styles.roleDot,
                  { backgroundColor: profile.roleColor },
                ]}
              />
              <Text
                style={[styles.rolePillText, { color: profile.roleColor }]}
              >
                {profile.role}
              </Text>
            </View>
          </View>
        </View>

        {/* ID strip */}
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
            {profile.id}
          </Text>
        </View>
      </View>

      {/* ============ DETAILED INFO ============ */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>
        📋 Details
      </Text>

      <View
        style={[
          styles.detailsCard,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <InfoRow
          icon="🏢"
          label="Department"
          value={profile.department}
          textColor={textColor}
          subTextColor={subTextColor}
          dividerColor={dividerColor}
        />
        <InfoRow
          icon="📧"
          label="Email"
          value={profile.email}
          textColor={textColor}
          subTextColor={subTextColor}
          dividerColor={dividerColor}
        />
        <InfoRow
          icon="📱"
          label="Phone"
          value={profile.phone}
          textColor={textColor}
          subTextColor={subTextColor}
          dividerColor={dividerColor}
        />
        <InfoRow
          icon="📅"
          label="Joined"
          value={profile.joinedDate}
          textColor={textColor}
          subTextColor={subTextColor}
          dividerColor={dividerColor}
          isLast
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // ---- Hero card ----
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

  // Top-right green online dot
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

  // Bottom-right 📷 badge
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
  editBadgeIcon: {
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Uploading overlay
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
  uploadOverlayText: {
    fontSize: 26,
    color: '#FFFFFF',
  },

  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
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
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  idStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  idValue: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
  },

  // ---- Details ----
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
  },
  infoIcon: {
    fontSize: 15,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
});