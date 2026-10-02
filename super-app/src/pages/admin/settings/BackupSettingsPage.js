// src/pages/admin/settings/BackupSettingsPage.js
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const SETTINGS = [
  {
    key: 'backup.autoBackup',
    label: 'Automatic Backup',
    description: 'Run backups automatically on the schedule',
    value: true,
    dataType: 'boolean',
    isEditable: true,
    version: 1,
    updated_at: '2026-09-30T07:00:00Z',
  },
  {
    key: 'backup.frequency',
    label: 'Backup Frequency',
    description: 'hourly | daily | weekly',
    value: 'daily',
    dataType: 'string',
    isEditable: true,
    version: 1,
    updated_at: '2026-09-30T07:00:00Z',
  },
  {
    key: 'backup.timeOfDay',
    label: 'Backup Time (24h)',
    description: 'When the scheduled backup runs',
    value: '02:00',
    dataType: 'time',
    isEditable: true,
    version: 1,
    updated_at: '2026-09-30T07:00:00Z',
  },
  {
    key: 'backup.retentionDays',
    label: 'Retention (days)',
    description: 'How long to keep backups before pruning',
    value: 30,
    dataType: 'number',
    isEditable: true,
    version: 1,
    updated_at: '2026-09-30T07:00:00Z',
  },
  {
    key: 'backup.storagePath',
    label: 'Storage Path',
    description: 'Directory where backups are written',
    value: 'uploads/backups/',
    dataType: 'string',
    isEditable: false,
    version: 1,
    updated_at: '2026-09-30T07:00:00Z',
  },
];

const ACCENT = '#06B6D4';
const EMOJI  = '💾';

export default function BackupSettingsPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  userRole,
}) {
  const role = (userRole || '').toLowerCase();
  const canView = ['admin', 'superadmin', 'checker'].includes(role);
  const canEdit = ['admin', 'superadmin'].includes(role);

  const [items, setItems]               = useState(SETTINGS);
  const [search, setSearch]             = useState('');
  const [detail, setDetail]             = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (s) =>
        s.key.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [items, search]);

  const openDetail = (s) => {
    setDetail(s);
    setEditingValue(s.value);
    setSaveError(null);
  };

  const closeDetail = () => {
    if (saving) return;
    setDetail(null);
    setEditingValue(null);
    setSaveError(null);
  };

  const save = async () => {
    if (!detail) return;
    if (!detail.isEditable) {
      setSaveError('This setting is locked and cannot be edited.');
      return;
    }

    let next = editingValue;
    if (detail.dataType === 'number') {
      const n = Number(editingValue);
      if (Number.isNaN(n)) {
        setSaveError('Enter a valid number.');
        return;
      }
      next = n;
    } else if (detail.dataType === 'boolean') {
      next = !!editingValue;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await new Promise((r) => setTimeout(r, 300));
      setItems((prev) =>
        prev.map((s) =>
          s.key === detail.key
            ? {
                ...s,
                value: next,
                version: (s.version || 1) + 1,
                updated_at: new Date().toISOString(),
              }
            : s
        )
      );
      setDetail(null);
      setEditingValue(null);
    } catch (e) {
      setSaveError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const formatValue = (s) => {
    if (s.dataType === 'boolean') return s.value ? 'Enabled' : 'Disabled';
    return String(s.value ?? '—');
  };

  const renderItem = ({ item: s }) => {
    const locked = !s.isEditable;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openDetail(s)}
        style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {s.label}
          </Text>
          <Text style={[styles.keyText, { color: subTextColor }]} numberOfLines={1}>
            {s.key}
          </Text>
          <Text style={[styles.valueText, { color: ACCENT }]} numberOfLines={1}>
            {formatValue(s)}
          </Text>
        </View>

        {locked ? (
          <View style={[styles.pill, { backgroundColor: darkMode ? '#3F3F46' : '#E4E4E7' }]}>
            <Text style={[styles.pillText, { color: darkMode ? '#A1A1AA' : '#52525B' }]}>
              🔒 LOCKED
            </Text>
          </View>
        ) : (
          <View style={[styles.pill, { backgroundColor: ACCENT + '22' }]}>
            <Text style={[styles.pillText, { color: ACCENT }]}>
              {s.dataType.toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!canView) {
    return (
      <View style={styles.noAccess}>
        <Text style={styles.noAccessEmoji}>🔒</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Access denied</Text>
        <Text style={[styles.emptyBody, { color: subTextColor }]}>
          You don't have permission to view backup settings.
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <View style={[styles.headerIcon, { backgroundColor: ACCENT + '22' }]}>
            <Text style={styles.headerIconText}>{EMOJI}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Backup Settings</Text>
            <Text style={[styles.headerSub, { color: subTextColor }]}>
              {items.length} settings · schedule, retention, storage
            </Text>
          </View>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search settings…"
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
          keyExtractor={(it) => it.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>{EMOJI}</Text>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                {search ? 'No matches' : 'No settings'}
              </Text>
              <Text style={[styles.emptyBody, { color: subTextColor }]}>
                {search ? `No settings match "${search}".` : ''}
              </Text>
            </View>
          }
        />

        <Modal
          visible={!!detail}
          transparent
          animationType="fade"
          onRequestClose={closeDetail}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={styles.centerBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={closeDetail}
            />
            {detail ? (
              <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.detailHeader}>
                    <View style={[styles.detailAvatar, { backgroundColor: ACCENT + '22' }]}>
                      <Text style={styles.detailAvatarText}>{EMOJI}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={2}>
                        {detail.label}
                      </Text>
                      <Text style={[styles.modalSub, { color: subTextColor }]} numberOfLines={2}>
                        {detail.description}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel, { color: subTextColor }]}>VALUE</Text>

                  {!detail.isEditable ? (
                    <View
                      style={[
                        styles.infoBox,
                        { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC', borderColor },
                      ]}
                    >
                      <Text style={[styles.infoText, { color: textColor }]}>
                        {formatValue(detail)}
                      </Text>
                      <Text style={[styles.lockedHint, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>
                        🔒 This setting is locked by the system.
                      </Text>
                    </View>
                  ) : detail.dataType === 'boolean' ? (
                    <View
                      style={[
                        styles.switchBox,
                        { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC', borderColor },
                      ]}
                    >
                      <Text style={[styles.switchLabel, { color: textColor }]}>
                        {editingValue ? 'Enabled' : 'Disabled'}
                      </Text>
                      <Switch
                        value={!!editingValue}
                        onValueChange={(v) => {
                          setEditingValue(v);
                          setSaveError(null);
                        }}
                        disabled={saving || !canEdit}
                        trackColor={{ false: '#64748B', true: ACCENT }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  ) : (
                    <TextInput
                      value={
                        editingValue === null || editingValue === undefined
                          ? ''
                          : String(editingValue)
                      }
                      onChangeText={(v) => {
                        setEditingValue(v);
                        setSaveError(null);
                      }}
                      editable={!saving && canEdit}
                      keyboardType={detail.dataType === 'number' ? 'decimal-pad' : 'default'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="Enter value"
                      placeholderTextColor={subTextColor}
                      style={[
                        styles.formInput,
                        {
                          color: textColor,
                          backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                          borderColor: saveError ? '#EF4444' : borderColor,
                        },
                      ]}
                    />
                  )}

                  {saveError ? <Text style={styles.formError}>{saveError}</Text> : null}

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      onPress={closeDetail}
                      disabled={saving}
                      style={[
                        styles.modalBtn,
                        { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor },
                      ]}
                    >
                      <Text style={[styles.modalBtnText, { color: textColor }]}>
                        {canEdit && detail.isEditable ? 'Cancel' : 'Close'}
                      </Text>
                    </TouchableOpacity>

                    {canEdit && detail.isEditable ? (
                      <TouchableOpacity
                        onPress={save}
                        disabled={saving}
                        style={[styles.modalBtn, { backgroundColor: ACCENT, borderColor: ACCENT }]}
                      >
                        {saving ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Save</Text>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },

  noAccess: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  noAccessEmoji: { fontSize: 48, marginBottom: 12 },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 22 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
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
  title: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.2 },
  keyText: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    opacity: 0.75,
  },
  valueText: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },

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

  centerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  centerModal: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarText: { fontSize: 24 },
  modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12, fontWeight: '600', marginTop: 3 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 6,
  },
  infoBox: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  infoText: { fontSize: 13.5, fontWeight: '600', lineHeight: 19 },
  lockedHint: { fontSize: 11.5, fontWeight: '700', marginTop: 6, fontStyle: 'italic' },

  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: { fontSize: 14, fontWeight: '700' },

  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  formError: { color: '#EF4444', fontSize: 12.5, fontWeight: '700', marginTop: 12 },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 46,
  },
  modalBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
});