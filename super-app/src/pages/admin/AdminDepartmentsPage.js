// src/pages/admin/AdminDepartmentsPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import settingsService from '../../stores/settingsService';

const PAGE_SIZE = 20;

// ================================================================
// HELPERS
// ================================================================
const initials = (str) => {
  if (!str) return '?';
  const parts = String(str).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const colorFromString = (str) => {
  const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
};

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  isActive: true,
};

// ================================================================
// MAIN
// ================================================================
export default function AdminDepartmentsPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  userRole,
}) {
  const role = (userRole || '').toLowerCase();
  const canView = ['admin', 'superadmin', 'checker', 'purchase_organizer'].includes(role);
  const canEdit = ['admin', 'superadmin'].includes(role);

  const [items, setItems]       = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  // Detail modal
  const [detail, setDetail] = useState(null);

  // Form modal (add / edit)
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId]     = useState(null); // null => add
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState(null);
  const [saving, setSaving]           = useState(false);

  // ================================================================
  // LOAD
  // ================================================================
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await settingsService.getDepartments();
      if (res.success) {
        setItems(res.departments || []);
      } else {
        setError(res.error || 'Failed to load departments');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================================================================
  // FILTER
  // ================================================================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => {
      return (
        String(d.name || '').toLowerCase().includes(q) ||
        String(d.code || '').toLowerCase().includes(q) ||
        String(d.description || '').toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const activeCount = useMemo(
    () => items.filter((d) => d.isActive !== false).length,
    [items]
  );

  // ================================================================
  // OPEN FORM
  // ================================================================
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormVisible(true);
  };

  const openEdit = (dept) => {
    setEditingId(dept.departmentId);
    setForm({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      isActive: dept.isActive !== false,
    });
    setFormError(null);
    setFormVisible(true);
    setDetail(null);
  };

  const closeForm = () => {
    if (saving) return;
    setFormVisible(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  // ================================================================
  // SAVE (add or edit)
  // ================================================================
  const saveForm = async () => {
    const name = form.name.trim();
    const code = form.code.trim();

    if (!name) {
      setFormError('Name is required.');
      return;
    }
    if (!code) {
      setFormError('Code is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        name,
        code,
        description: form.description.trim() || null,
        isActive: form.isActive,
      };

      const res = editingId
        ? await settingsService.updateDepartment(editingId, payload)
        : await settingsService.createDepartment(payload);

      if (!res?.success) {
        setFormError(res?.error || 'Failed to save department');
        return;
      }

      closeForm();
      await load(true);
    } catch (e) {
      setFormError(
        e?.response?.data?.error || e?.message || 'Failed to save department'
      );
    } finally {
      setSaving(false);
    }
  };

  // ================================================================
  // DELETE
  // ================================================================
  const confirmDelete = (dept) => {
    const doDelete = async () => {
      try {
        const res = await settingsService.deleteDepartment(dept.departmentId);
        if (!res?.success) {
          Alert.alert('Error', res?.error || 'Failed to delete department');
          return;
        }
        await load(true);
      } catch (e) {
        Alert.alert(
          'Error',
          e?.response?.data?.error || e?.message || 'Failed to delete department'
        );
      }
    };

    const message = `Delete "${dept.name}"? This cannot be undone.`;

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(message)) {
        doDelete();
      }
      return;
    }

    Alert.alert('Delete department', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  // ================================================================
  // RENDER: card
  // ================================================================
  const renderItem = ({ item: d }) => {
    const isActive = d.isActive !== false;
    const tint = colorFromString(d.code || d.name || `d${d.departmentId}`);

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setDetail(d)}
          style={styles.cardMain}
        >
          <View style={[styles.avatar, { backgroundColor: tint }]}>
            <Text style={styles.avatarText}>{initials(d.name || d.code)}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {d.name || 'Untitled department'}
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={1}>
              {d.code ? `${d.code}` : '—'}
              {d.description ? ` · ${d.description}` : ''}
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isActive
                  ? (darkMode ? '#064E3B' : '#ECFDF5')
                  : (darkMode ? '#7F1D1D' : '#FEE2E2'),
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                {
                  color: isActive
                    ? (darkMode ? '#6EE7B7' : '#047857')
                    : (darkMode ? '#FCA5A5' : '#991B1B'),
                },
              ]}
            >
              {isActive ? '● ACTIVE' : '✕ INACTIVE'}
            </Text>
          </View>
        </TouchableOpacity>

        {canEdit ? (
          <View style={[styles.cardActions, { borderTopColor: borderColor }]}>
            <TouchableOpacity
              onPress={() => openEdit(d)}
              activeOpacity={0.8}
              style={[styles.actionBtn, { borderColor }]}
            >
              <Text style={[styles.actionBtnText, { color: textColor }]}>✎  Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(d)}
              activeOpacity={0.8}
              style={[
                styles.actionBtn,
                {
                  borderColor: '#EF4444',
                  backgroundColor: darkMode ? '#3B0A0A' : '#FEF2F2',
                },
              ]}
            >
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>🗑  Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  // ================================================================
  // GUARDS
  // ================================================================
  if (!canView) {
    return (
      <View style={styles.noAccess}>
        <Text style={styles.noAccessEmoji}>🔒</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Access denied</Text>
        <Text style={[styles.emptyBody, { color: subTextColor }]}>
          You don't have permission to view departments.
        </Text>
      </View>
    );
  }

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* ============================================================
            PINNED AREA — everything here stays fixed while the list scrolls
           ============================================================ */}

        {/* HEADER */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Departments</Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
              {items.length} total · {activeCount} active
            </Text>
          </View>

          {canEdit ? (
            <TouchableOpacity
              onPress={openAdd}
              activeOpacity={0.85}
              style={[styles.addBtn, { backgroundColor: '#8B5CF6' }]}
            >
              <Text style={styles.addBtnText}>＋ Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* SEARCH */}
        <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, code or description…"
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

        {/* ERROR */}
        {error ? (
          <TouchableOpacity
            onPress={() => load(false)}
            activeOpacity={0.85}
            style={[
              styles.errorBox,
              {
                borderColor: darkMode ? '#7F1D1D' : '#FCA5A5',
                backgroundColor: darkMode ? '#3B0A0A' : '#FEF2F2',
              },
            ]}
          >
            <Text style={[styles.errorText, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>
              ⚠️  {error}   ·   tap to retry
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* ============================================================
            SCROLLABLE AREA — only the list scrolls
           ============================================================ */}

        <FlatList
          data={filtered}
          keyExtractor={(it) => `dept-${it.departmentId}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={subTextColor}
            />
          }
          ListFooterComponent={
            filtered.length > PAGE_SIZE ? (
              <Text style={[styles.footerText, { color: subTextColor }]}>
                End of list · {filtered.length} department{filtered.length === 1 ? '' : 's'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyBox}><ActivityIndicator color="#8B5CF6" /></View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🏢</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>
                  {search ? 'No matches' : 'No departments yet'}
                </Text>
                <Text style={[styles.emptyBody, { color: subTextColor }]}>
                  {search
                    ? `No departments match "${search}".`
                    : canEdit
                    ? 'Tap "Add" to create your first department.'
                    : 'Departments will appear here once created.'}
                </Text>
              </View>
            )
          }
        />

        {/* ============================================================
            DETAIL MODAL (view only) — with Edit / Delete shortcuts
           ============================================================ */}
        <Modal
          visible={!!detail}
          transparent
          animationType="fade"
          onRequestClose={() => setDetail(null)}
        >
          <View style={styles.centerBackdrop}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={() => setDetail(null)}
            />
            {detail ? (
              <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailHeader}>
                    <View
                      style={[
                        styles.detailAvatar,
                        { backgroundColor: colorFromString(detail.code || detail.name) },
                      ]}
                    >
                      <Text style={styles.detailAvatarText}>
                        {initials(detail.name || detail.code)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={2}>
                        {detail.name}
                      </Text>
                      <Text style={[styles.modalSub, { color: subTextColor }]} numberOfLines={1}>
                        {detail.code ? `Code: ${detail.code}` : 'No code'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.fieldLabel, { color: subTextColor }]}>DESCRIPTION</Text>
                  <View
                    style={[
                      styles.infoBox,
                      {
                        backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.infoText, { color: textColor }]}>
                      {detail.description || 'No description provided.'}
                    </Text>
                  </View>

                  <Text style={[styles.fieldLabel, { color: subTextColor }]}>STATUS</Text>
                  <View
                    style={[
                      styles.infoBox,
                      {
                        backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                        borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.infoText,
                        {
                          color: detail.isActive !== false ? '#047857' : '#991B1B',
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {detail.isActive !== false ? '● Active' : '✕ Inactive'}
                    </Text>
                  </View>

                  <Text style={[styles.fieldLabel, { color: subTextColor }]}>DEPARTMENT ID</Text>
                  <View
                    style={[
                      styles.infoBox,
                      {
                        backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.infoText, { color: textColor }]}>
                      #{detail.departmentId}
                    </Text>
                  </View>

                  <View style={styles.modalActions}>
                    {canEdit ? (
                      <>
                        <TouchableOpacity
                          onPress={() => openEdit(detail)}
                          style={[
                            styles.modalBtn,
                            { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
                          ]}
                        >
                          <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                            ✎  Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            const d = detail;
                            setDetail(null);
                            confirmDelete(d);
                          }}
                          style={[
                            styles.modalBtn,
                            { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                          ]}
                        >
                          <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                            🗑  Delete
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => setDetail(null)}
                      style={[
                        styles.modalBtn,
                        {
                          backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                          borderColor,
                        },
                      ]}
                    >
                      <Text style={[styles.modalBtnText, { color: textColor }]}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </View>
        </Modal>

        {/* ============================================================
            FORM MODAL (ADD / EDIT)
           ============================================================ */}
        <Modal
          visible={formVisible}
          transparent
          animationType="fade"
          onRequestClose={closeForm}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={styles.centerBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={closeForm}
            />
            <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  {editingId ? 'Edit department' : 'New department'}
                </Text>
                <Text style={[styles.modalSub, { color: subTextColor, marginBottom: 16 }]}>
                  {editingId ? 'Update the details below.' : 'Fill in the details below.'}
                </Text>

                <Text style={[styles.fieldLabel, { color: subTextColor }]}>NAME *</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, name: v }));
                    setFormError(null);
                  }}
                  placeholder="e.g. Finance"
                  placeholderTextColor={subTextColor}
                  editable={!saving}
                  style={[
                    styles.formInput,
                    {
                      color: textColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor:
                        formError && !form.name.trim() ? '#EF4444' : borderColor,
                    },
                  ]}
                />

                <Text style={[styles.fieldLabel, { color: subTextColor }]}>CODE *</Text>
                <TextInput
                  value={form.code}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, code: v }));
                    setFormError(null);
                  }}
                  placeholder="e.g. FIN"
                  placeholderTextColor={subTextColor}
                  editable={!saving}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[
                    styles.formInput,
                    {
                      color: textColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor:
                        formError && !form.code.trim() ? '#EF4444' : borderColor,
                    },
                  ]}
                />

                <Text style={[styles.fieldLabel, { color: subTextColor }]}>DESCRIPTION</Text>
                <TextInput
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder="Optional"
                  placeholderTextColor={subTextColor}
                  editable={!saving}
                  multiline
                  style={[
                    styles.formInput,
                    styles.formInputMultiline,
                    {
                      color: textColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor,
                    },
                  ]}
                />

                <View style={styles.switchRow}>
                  <Text style={[styles.fieldLabel, { color: subTextColor, marginTop: 0 }]}>
                    ACTIVE
                  </Text>
                  <Switch
                    value={form.isActive}
                    onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                    disabled={saving}
                    trackColor={{ false: '#64748B', true: '#8B5CF6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {formError ? (
                  <Text style={styles.formError}>{formError}</Text>
                ) : null}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={closeForm}
                    disabled={saving}
                    activeOpacity={0.85}
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveForm}
                    disabled={saving}
                    activeOpacity={0.85}
                    style={[
                      styles.modalBtn,
                      { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
                    ]}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                        {editingId ? 'Save changes' : 'Create'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

// ================================================================
// STYLES
// ================================================================
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

  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },

  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  errorText: { fontSize: 12.5, fontWeight: '600' },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  title: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  subtitle: { fontSize: 11.5, fontWeight: '600', marginTop: 3 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },

  footerText: {
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '600',
  },

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
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 6,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: { fontSize: 13.5, fontWeight: '600', lineHeight: 19 },

  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  formError: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 12,
  },

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