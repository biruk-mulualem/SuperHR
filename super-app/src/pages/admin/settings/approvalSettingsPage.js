// src/pages/admin/settings/ApprovalSettingsPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import settingsService from '../../../stores/settingsService';

const ACCENT = '#8B5CF6';
const EMOJI  = '✅';

export default function ApprovalSettingsPage({
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

  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [fetchError, setFetchError]         = useState(null);

  const [approvalConfig, setApprovalConfig] = useState({
    configured: false,
    departments: [],
    requiresApproval: true,
    message: '',
  });

  const [departmentsForApproval, setDepartmentsForApproval] = useState([]);
  const [allStores, setAllStores]                           = useState([]);

  const [requiresApproval, setRequiresApproval] = useState(true);
  const [departmentStores, setDepartmentStores] = useState({});

  // Which department is expanded in the list
  const [expandedDept, setExpandedDept] = useState(null);

  // Which department's store picker is open (full-screen modal)
  const [pickerDept, setPickerDept] = useState(null);

  // ---------------------------------------------------------------
  // LOADERS
  // ---------------------------------------------------------------
  const loadApprovalDepartment = useCallback(async () => {
    try {
      const res = await settingsService.getApprovalDepartment();
      if (res.success && res.data) {
        const data = res.data;
        setApprovalConfig(data);
        setRequiresApproval(data.requiresApproval !== false);

        const next = {};
        if (Array.isArray(data.departments)) {
          data.departments.forEach((d) => {
            next[d.departmentId] = {
              appliesTo: Array.isArray(d.appliesTo) ? [...d.appliesTo] : [],
            };
          });
        }
        setDepartmentStores(next);
      }
    } catch (e) {
      console.error('loadApprovalDepartment failed:', e);
    }
  }, []);

  const loadDepartmentsForApproval = useCallback(async () => {
    try {
      const res = await settingsService.getDepartmentsForApproval();
      if (res.success) setDepartmentsForApproval(res.departments || []);
    } catch (e) {
      console.error('loadDepartmentsForApproval failed:', e);
    }
  }, []);

  const loadStoresForApproval = useCallback(async () => {
    try {
      const res = await settingsService.getStoresForApproval();
      if (res.success) setAllStores(res.stores || []);
    } catch (e) {
      console.error('loadStoresForApproval failed:', e);
    }
  }, []);

  const loadAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setFetchError(null);
      try {
        await Promise.all([
          loadApprovalDepartment(),
          loadDepartmentsForApproval(),
          loadStoresForApproval(),
        ]);
      } catch (e) {
        setFetchError(e?.message || 'Failed to load approval settings');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadApprovalDepartment, loadDepartmentsForApproval, loadStoresForApproval]
  );

  useEffect(() => {
    if (!canView) return;
    loadAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------
  // DERIVED
  // ---------------------------------------------------------------
  const storeLookup = useMemo(() => {
    const map = new Map();
    allStores.forEach((s) => map.set(s.code, s));
    return map;
  }, [allStores]);

  const configuredCount = useMemo(() => {
    return departmentsForApproval.filter(
      (d) => departmentStores[d.departmentId] !== undefined
    ).length;
  }, [departmentsForApproval, departmentStores]);

  const totalStoreAssignments = useMemo(() => {
    return Object.values(departmentStores).reduce(
      (sum, e) => sum + (e?.appliesTo?.length || 0),
      0
    );
  }, [departmentStores]);

  const isDepartmentSelected = (departmentId) =>
    departmentStores[departmentId] !== undefined;

  // ---------------------------------------------------------------
  // MUTATORS
  // ---------------------------------------------------------------
  const toggleDepartment = (departmentId) => {
    if (!canEdit) return;
    setDepartmentStores((prev) => {
      const next = { ...prev };
      if (next[departmentId] !== undefined) delete next[departmentId];
      else next[departmentId] = { appliesTo: [] };
      return next;
    });
  };

  const toggleStore = (departmentId, storeCode) => {
    setDepartmentStores((prev) => {
      const current = prev[departmentId] || { appliesTo: [] };
      const has = current.appliesTo.includes(storeCode);
      const appliesTo = has
        ? current.appliesTo.filter((c) => c !== storeCode)
        : [...current.appliesTo, storeCode];
      return { ...prev, [departmentId]: { appliesTo } };
    });
  };

  const selectAllFor = (departmentId) => {
    setDepartmentStores((prev) => ({
      ...prev,
      [departmentId]: { appliesTo: allStores.map((s) => s.code) },
    }));
  };

  const deselectAllFor = (departmentId) => {
    setDepartmentStores((prev) => ({
      ...prev,
      [departmentId]: { appliesTo: [] },
    }));
  };

  // ---------------------------------------------------------------
  // SAVE
  // ---------------------------------------------------------------
  const saveApprovalSettings = async () => {
    if (!canEdit) return;

    const departments = Object.entries(departmentStores).map(
      ([departmentId, entry]) => ({
        departmentId: parseInt(departmentId, 10),
        appliesTo: entry.appliesTo || [],
      })
    );

    if (departments.length === 0) {
      Alert.alert('Select a department', 'Please select at least one department.');
      return;
    }

    const emptyDepts = departments.filter((d) => d.appliesTo.length === 0);
    if (emptyDepts.length > 0) {
      const names = emptyDepts
        .map(
          (d) =>
            departmentsForApproval.find((x) => x.departmentId === d.departmentId)
              ?.name || `#${d.departmentId}`
        )
        .join(', ');

      const proceed = await new Promise((resolve) => {
        if (Platform.OS === 'web') {
          // eslint-disable-next-line no-alert
          resolve(
            window.confirm(
              `${emptyDepts.length} department(s) have no stores (${names}). They will not be notified. Continue?`
            )
          );
        } else {
          Alert.alert(
            'No stores selected',
            `${emptyDepts.length} department(s) have no stores selected (${names}). They will not be notified for any requests. Continue?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) },
            ]
          );
        }
      });
      if (!proceed) return;
    }

    setSaving(true);
    try {
      const res = await settingsService.setApprovalDepartment({
        departments,
        requiresApproval,
      });
      if (res.success) {
        Alert.alert('Saved', res.message || 'Approval settings saved successfully');
        await loadAll(true);
      } else {
        Alert.alert('Error', res.error || 'Failed to save');
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const removeApprovalDepartment = async () => {
    if (!canEdit) return;
    const confirmed = await new Promise((resolve) => {
      if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        resolve(
          window.confirm(
            'Remove all approval departments? Requests will not require department approval.'
          )
        );
      } else {
        Alert.alert(
          'Remove all?',
          'Remove all approval departments? Requests will not require department approval.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      }
    });
    if (!confirmed) return;

    try {
      const res = await settingsService.removeApprovalDepartment();
      if (res.success) {
        Alert.alert('Done', 'Approval departments removed');
        await loadAll(true);
      } else {
        Alert.alert('Error', res.error || 'Failed to remove');
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e?.response?.data?.error || e?.message || 'Failed to remove'
      );
    }
  };

  // ---------------------------------------------------------------
  // GUARD
  // ---------------------------------------------------------------
  if (!canView) {
    return (
      <View style={styles.noAccess}>
        <Text style={styles.noAccessEmoji}>🔒</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Access denied</Text>
        <Text style={[styles.emptyBody, { color: subTextColor }]}>
          You don't have permission to view approval settings.
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------
  // RENDER: department row
  // ---------------------------------------------------------------
  const renderDepartment = ({ item: dept }) => {
    const selected = isDepartmentSelected(dept.departmentId);
    const entry = departmentStores[dept.departmentId] || { appliesTo: [] };
    const isExpanded = expandedDept === dept.departmentId;
    const storeCount = entry.appliesTo.length;

    return (
      <View
        style={[
          styles.deptRow,
          {
            backgroundColor: cardBg,
            borderColor: selected ? ACCENT : borderColor,
            borderLeftWidth: selected ? 3 : 1,
          },
        ]}
      >
        {/* Header — tappable */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            if (!selected) {
              toggleDepartment(dept.departmentId);
              setExpandedDept(dept.departmentId);
            } else {
              setExpandedDept(isExpanded ? null : dept.departmentId);
            }
          }}
          style={styles.deptRowHeader}
        >
          {/* Checkbox */}
          <View
            style={[
              styles.bigCheckbox,
              {
                borderColor: selected ? ACCENT : '#CBD5E1',
                backgroundColor: selected ? ACCENT : 'transparent',
              },
            ]}
          >
            {selected ? <Text style={styles.bigCheckboxTick}>✓</Text> : null}
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[styles.deptName, { color: textColor }]}
              numberOfLines={1}
            >
              {dept.name}
            </Text>
            <Text
              style={[styles.deptMeta, { color: subTextColor }]}
              numberOfLines={1}
            >
              {dept.code}
              {selected
                ? ` · ${storeCount} store${storeCount === 1 ? '' : 's'}`
                : ' · tap to configure'}
            </Text>
          </View>

          {selected ? (
            <Text style={[styles.chevron, { color: subTextColor }]}>
              {isExpanded ? '⌄' : '›'}
            </Text>
          ) : null}
        </TouchableOpacity>

        {/* Expanded panel */}
        {selected && isExpanded ? (
          <View style={[styles.deptPanel, { borderTopColor: borderColor }]}>
            {/* Quick actions */}
            <View style={styles.deptPanelActions}>
              <TouchableOpacity
                onPress={() => setPickerDept(dept)}
                disabled={!canEdit}
                activeOpacity={0.85}
                style={[styles.primaryMiniBtn, { backgroundColor: ACCENT }]}
              >
                <Text style={styles.primaryMiniBtnText}>
                  {storeCount === 0
                    ? 'Choose Stores'
                    : `Edit Stores (${storeCount})`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleDepartment(dept.departmentId)}
                disabled={!canEdit}
                activeOpacity={0.85}
                style={[
                  styles.secondaryMiniBtn,
                  {
                    backgroundColor: darkMode ? '#3B0A0A' : '#FEE2E2',
                    borderColor: '#EF4444',
                  },
                ]}
              >
                <Text style={styles.destructiveMiniBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>

            {/* Stores preview */}
            {storeCount === 0 ? (
              <Text style={[styles.panelHint, { color: subTextColor }]}>
                No stores selected yet.
              </Text>
            ) : (
              <View style={styles.storeTagsWrap}>
                {entry.appliesTo.slice(0, 8).map((code) => {
                  const store = storeLookup.get(code);
                  return (
                    <View
                      key={code}
                      style={[
                        styles.storeTag,
                        {
                          backgroundColor: darkMode ? '#1E1B4B' : '#EEF2FF',
                          borderColor: ACCENT + '55',
                        },
                      ]}
                    >
                      <Text style={[styles.storeTagText, { color: ACCENT }]}>
                        {code}
                      </Text>
                    </View>
                  );
                })}
                {storeCount > 8 ? (
                  <View
                    style={[
                      styles.storeTag,
                      {
                        backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.storeTagText, { color: subTextColor }]}>
                      +{storeCount - 8} more
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  // ---------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* ============================================================
            PINNED HEADER
           ============================================================ */}
        <View style={styles.headerBar}>
          <View style={[styles.headerIcon, { backgroundColor: ACCENT + '22' }]}>
            <Text style={styles.headerIconText}>{EMOJI}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Approval Settings
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]}>
              {configuredCount} department{configuredCount === 1 ? '' : 's'} ·{' '}
              {totalStoreAssignments} store{totalStoreAssignments === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {/* ============================================================
            BODY — everything scrolls
           ============================================================ */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAll(true)}
              tintColor={subTextColor}
            />
          }
        >
          {/* FETCH ERROR */}
          {fetchError ? (
            <TouchableOpacity
              onPress={() => loadAll(false)}
              activeOpacity={0.85}
              style={[
                styles.errorBox,
                {
                  borderColor: darkMode ? '#7F1D1D' : '#FCA5A5',
                  backgroundColor: darkMode ? '#3B0A0A' : '#FEF2F2',
                },
              ]}
            >
              <Text
                style={[
                  styles.errorText,
                  { color: darkMode ? '#FCA5A5' : '#991B1B' },
                ]}
              >
                ⚠️  {fetchError}   ·   tap to retry
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* =========================================================
              STATUS SUMMARY
             ========================================================= */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: approvalConfig.configured
                  ? darkMode ? '#064E3B' : '#F0FDF4'
                  : darkMode ? '#1E293B' : '#F8FAFC',
                borderColor: approvalConfig.configured
                  ? darkMode ? '#065F46' : '#BBF7D0'
                  : borderColor,
              },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryIcon}>
                {approvalConfig.configured ? '✅' : '⚠️'}
              </Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.summaryTitle, { color: textColor }]}>
                  {approvalConfig.configured ? 'Configured' : 'Not configured'}
                </Text>
                <Text
                  style={[styles.summaryBody, { color: subTextColor }]}
                  numberOfLines={2}
                >
                  {approvalConfig.message ||
                    'Select departments and stores below.'}
                </Text>
              </View>
            </View>
          </View>

          {/* =========================================================
              REQUIRES APPROVAL — main toggle
             ========================================================= */}
          <View
            style={[
              styles.toggleRow,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.toggleLabel, { color: textColor }]}>
                Requires Approval
              </Text>
              <Text
                style={[styles.toggleHint, { color: subTextColor }]}
                numberOfLines={2}
              >
                {requiresApproval
                  ? 'Requests must be approved before proceeding'
                  : 'Requests skip approval and are auto-accepted'}
              </Text>
            </View>
            <Switch
              value={requiresApproval}
              onValueChange={setRequiresApproval}
              disabled={!canEdit}
              trackColor={{ false: '#64748B', true: ACCENT }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* =========================================================
              DEPARTMENTS SECTION
             ========================================================= */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: subTextColor }]}>
              APPROVAL DEPARTMENTS
            </Text>
            <Text style={[styles.sectionHint, { color: subTextColor }]}>
              {configuredCount}/{departmentsForApproval.length} selected
            </Text>
          </View>

          {departmentsForApproval.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🏛️</Text>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                No active departments
              </Text>
              <Text style={[styles.emptyBody, { color: subTextColor }]}>
                Add departments first before configuring approvals.
              </Text>
            </View>
          ) : (
            <FlatList
              data={departmentsForApproval}
              keyExtractor={(it) => String(it.departmentId)}
              renderItem={renderDepartment}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8 }}
            />
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ============================================================
            PINNED BOTTOM ACTION BAR
           ============================================================ */}
        {canEdit ? (
          <View
            style={[
              styles.actionBar,
              { backgroundColor: cardBg, borderTopColor: borderColor },
            ]}
          >
            <TouchableOpacity
              onPress={saveApprovalSettings}
              disabled={saving}
              activeOpacity={0.85}
              style={[
                styles.saveBtn,
                { backgroundColor: ACCENT, opacity: saving ? 0.6 : 1 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Settings</Text>
              )}
            </TouchableOpacity>

            {approvalConfig.configured ? (
              <TouchableOpacity
                onPress={removeApprovalDepartment}
                disabled={saving}
                activeOpacity={0.85}
                style={[
                  styles.removeBtn,
                  {
                    backgroundColor: darkMode ? '#3B0A0A' : '#FEE2E2',
                    borderColor: '#EF4444',
                  },
                ]}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ============================================================
            FULL-SCREEN STORE PICKER MODAL
           ============================================================ */}
        <Modal
          visible={!!pickerDept}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setPickerDept(null)}
        >
          <View
            style={[
              styles.modalRoot,
              { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { backgroundColor: cardBg, borderBottomColor: borderColor },
              ]}
            >
              <TouchableOpacity
                onPress={() => setPickerDept(null)}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <Text style={[styles.modalCloseText, { color: ACCENT }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
                <Text
                  style={[styles.modalTitle, { color: textColor }]}
                  numberOfLines={1}
                >
                  {pickerDept?.name || 'Stores'}
                </Text>
                <Text
                  style={[styles.modalSub, { color: subTextColor }]}
                  numberOfLines={1}
                >
                  {pickerDept
                    ? `${(departmentStores[pickerDept.departmentId]?.appliesTo || []).length} of ${allStores.length} selected`
                    : ''}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setPickerDept(null)}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <Text style={[styles.modalCloseText, { color: ACCENT }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick actions */}
            {pickerDept ? (
              <View
                style={[
                  styles.pickerActions,
                  { backgroundColor: cardBg, borderBottomColor: borderColor },
                ]}
              >
                <TouchableOpacity
                  onPress={() => selectAllFor(pickerDept.departmentId)}
                  activeOpacity={0.85}
                  style={[styles.pickerAction, { borderColor }]}
                >
                  <Text style={[styles.pickerActionText, { color: textColor }]}>
                    Select All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deselectAllFor(pickerDept.departmentId)}
                  activeOpacity={0.85}
                  style={[styles.pickerAction, { borderColor }]}
                >
                  <Text style={[styles.pickerActionText, { color: textColor }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Store list */}
            {pickerDept ? (
              <FlatList
                data={allStores}
                keyExtractor={(it) => String(it.storeId)}
                contentContainerStyle={styles.pickerListContent}
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyEmoji}>🏪</Text>
                    <Text style={[styles.emptyTitle, { color: textColor }]}>
                      No active stores
                    </Text>
                    <Text style={[styles.emptyBody, { color: subTextColor }]}>
                      Add stores to start configuring approvals.
                    </Text>
                  </View>
                }
                renderItem={({ item: store }) => {
                  const applies =
                    departmentStores[pickerDept.departmentId]?.appliesTo || [];
                  const checked = applies.includes(store.code);
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        toggleStore(pickerDept.departmentId, store.code)
                      }
                      style={[
                        styles.pickerRow,
                        {
                          backgroundColor: checked
                            ? darkMode ? '#312E81' : '#EEF2FF'
                            : cardBg,
                          borderColor: checked ? ACCENT : borderColor,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.bigCheckbox,
                          {
                            borderColor: checked ? ACCENT : '#CBD5E1',
                            backgroundColor: checked ? ACCENT : 'transparent',
                          },
                        ]}
                      >
                        {checked ? (
                          <Text style={styles.bigCheckboxTick}>✓</Text>
                        ) : null}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[styles.pickerStoreName, { color: textColor }]}
                          numberOfLines={1}
                        >
                          {store.name}
                        </Text>
                        <Text
                          style={[
                            styles.pickerStoreMeta,
                            { color: subTextColor },
                          ]}
                          numberOfLines={1}
                        >
                          {store.code}
                          {store.location ? ` · 📍 ${store.location}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : null}
          </View>
        </Modal>

        {/* Loading overlay */}
        {loading ? (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: darkMode ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading approval settings…
            </Text>
          </View>
        ) : null}
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

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 20 },
  headerTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },

  // Scroll body
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },

  // Error box
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 12.5, fontWeight: '600' },

  // Summary card
  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { fontSize: 22 },
  summaryTitle: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.2 },
  summaryBody: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  toggleLabel: { fontSize: 14.5, fontWeight: '900' },
  toggleHint: { fontSize: 12, fontWeight: '500', marginTop: 3 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  sectionHint: { fontSize: 11, fontWeight: '600' },

  // Department row
  deptRow: {
    borderWidth: 1,
    borderLeftWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  deptRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  bigCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCheckboxTick: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  deptName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  deptMeta: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  chevron: {
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 4,
    marginTop: -2,
  },

  // Expanded panel
  deptPanel: {
    borderTopWidth: 1,
    padding: 14,
    paddingTop: 12,
  },
  deptPanelActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  primaryMiniBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryMiniBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveMiniBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },

  panelHint: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 6,
  },

  // Store tags
  storeTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  storeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  storeTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyEmoji: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Bottom action bar
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  removeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Store picker modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  modalCloseText: { fontSize: 15, fontWeight: '800' },
  modalTitle: { fontSize: 15, fontWeight: '900' },
  modalSub: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },

  pickerActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  pickerAction: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerActionText: { fontSize: 13, fontWeight: '800' },

  pickerListContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pickerStoreName: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.1 },
  pickerStoreMeta: { fontSize: 11.5, fontWeight: '600', marginTop: 3 },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 13, fontWeight: '500' },
});