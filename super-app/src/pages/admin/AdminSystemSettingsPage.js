// src/pages/admin/AdminSystemSettingsPage.js
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ================================================================
// SETTING GROUPS
// Each `target` is a tab key AppRouter routes on. Add a group
// here + a `case` in index.js and it's live.
// ================================================================
const SETTING_GROUPS = [
  {
    key: 'attendance',
    label: 'Attendance Settings',
    description: 'Work hours, grace period, overtime, weekends',
    emoji: '⏰',
    color: '#10B981',
    target: 'settingsAttendance',
    count: 5,
  },
  {
    key: 'approval',
    label: 'Approval Settings',
    description: 'Approval flow, thresholds, escalation',
    emoji: '✅',
    color: '#8B5CF6',
    target: 'settingsApproval',
    count: 4,
  },
  {
    key: 'finance',
    label: 'Finance Settings',
    description: 'Currency, tax, payroll defaults',
    emoji: '💰',
    color: '#F59E0B',
    target: 'settingsFinance',
    count: 5,
  },
  {
    key: 'backup',
    label: 'Backup Settings',
    description: 'Schedules, retention, restore points',
    emoji: '💾',
    color: '#06B6D4',
    target: 'settingsBackup',
    count: 4,
  },
];

export default function AdminSystemSettingsPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  userRole,
  setActiveTab,
}) {
  const role = (userRole || '').toLowerCase();
  const canView = ['admin', 'superadmin', 'checker'].includes(role);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SETTING_GROUPS;
    return SETTING_GROUPS.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
    );
  }, [search]);

  const renderItem = ({ item: g }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setActiveTab?.(g.target)}
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
    >
      <View style={[styles.icon, { backgroundColor: g.color + '22' }]}>
        <Text style={styles.iconText}>{g.emoji}</Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {g.label}
        </Text>
        <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={2}>
          {g.description}
        </Text>
        <Text style={[styles.countText, { color: g.color }]}>
          {g.count} {g.count === 1 ? 'setting' : 'settings'}
        </Text>
      </View>

      <Text style={[styles.chevron, { color: subTextColor }]}>›</Text>
    </TouchableOpacity>
  );

  if (!canView) {
    return (
      <View style={styles.noAccess}>
        <Text style={styles.noAccessEmoji}>🔒</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Access denied</Text>
        <Text style={[styles.emptyBody, { color: subTextColor }]}>
          You don't have permission to view system settings.
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              System Settings
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]}>
              {SETTING_GROUPS.length} groups
            </Text>
          </View>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search settings groups…"
            placeholderTextColor={subTextColor}
            style={[styles.searchInput, { color: textColor }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(it) => `group-${it.key}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>⚙️</Text>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                {search ? 'No matches' : 'No setting groups'}
              </Text>
              <Text style={[styles.emptyBody, { color: subTextColor }]}>
                {search ? `No groups match "${search}".` : ''}
              </Text>
            </View>
          }
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },

  noAccess: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noAccessEmoji: { fontSize: 48, marginBottom: 12 },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  title: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  countText: { fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 0.2 },
  chevron: { fontSize: 24, fontWeight: '300', marginLeft: 4, opacity: 0.6 },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});