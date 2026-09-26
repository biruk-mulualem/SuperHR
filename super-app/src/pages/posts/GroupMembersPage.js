// super-app/src/pages/posts/GroupMembersPage.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  Alert,
} from 'react-native';

import mobilePostsGroupService from '../../stores/mobilePostsGroupService';

// ================================================================
// CONSTANTS
// ================================================================
const MEMBER_FILTERS = [
  { key: 'active',  label: 'Active'  },
  { key: 'pending', label: 'Pending' },
];

// Palette for avatars — deterministic per userId so it's stable
const AVATAR_COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444'];
const colorForUser = (userId) =>
  AVATAR_COLORS[Number(userId || 0) % AVATAR_COLORS.length];

export default function GroupMembersPage({
  group,
  members = [],
  onMembersChanged,
  isGroupAdmin = false,
  currentUser,
  onGroupUpdated,
  onBack,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const accentColor = '#8B5CF6';
  const currentUserId = currentUser?.userId;

  const [memberFilter, setMemberFilter] = useState('active');
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);

  // Directory of all users (from the group service)
  const [directory, setDirectory] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingRemove, setSubmittingRemove] = useState(false);

  // ----------------------------------------------------------------
  // Hardware back
  // ----------------------------------------------------------------
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (confirmRemoveMember) { setConfirmRemoveMember(null); return true; }
      if (showAddMember)       { setShowAddMember(false);      return true; }
      onBack?.();
      return true;
    });
    return () => sub.remove();
  }, [confirmRemoveMember, showAddMember, onBack]);

  // ----------------------------------------------------------------
  // Derived
  // ----------------------------------------------------------------
  const memberCounts = useMemo(() => ({
    active:  members.filter((m) => m.status === 'active').length,
    pending: members.filter((m) => m.status === 'pending').length,
  }), [members]);

  const visibleMembers = useMemo(
    () => members.filter((m) => m.status === memberFilter),
    [members, memberFilter]
  );

  const addableUsers = useMemo(() => {
    const ids = new Set(members.map((m) => Number(m.userId)));
    const q = memberSearch.trim().toLowerCase();
    return directory
      .filter((u) => !ids.has(Number(u.userId)))
      .filter(
        (u) =>
          !q ||
          (u.name || '').toLowerCase().includes(q) ||
          (u.department || '').toLowerCase().includes(q)
      );
  }, [directory, members, memberSearch]);

  const isGroupOwner = (member) =>
    Number(member.userId) === Number(group?.createdBy);

  // ----------------------------------------------------------------
  // Load directory via the group service
  // ----------------------------------------------------------------
  const loadDirectory = useCallback(async () => {
    setDirectoryLoading(true);
    try {
      const res = await mobilePostsGroupService.listUsersDirectory();
      if (res.success) {
        const items = (res.data.items || []).map((u) => ({
          ...u,
          color: colorForUser(u.userId),
        }));
        setDirectory(items);
      } else {
        Alert.alert('Error', res.error || 'Could not load users');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not load users');
    } finally {
      setDirectoryLoading(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // Actions
  // ----------------------------------------------------------------
  const openAddMember = () => {
    if (!isGroupAdmin) return;
    setSelectedUser(null);
    setMemberSearch('');
    setShowAddMember(true);
    if (directory.length === 0) loadDirectory();
  };

  const confirmAddMember = async () => {
    if (!isGroupAdmin) return;
    if (!selectedUser) return;

    setSubmittingAdd(true);
    try {
      const res = await mobilePostsGroupService.addMember(group.id, selectedUser.userId);
      if (res.success) {
        setShowAddMember(false);
        setSelectedUser(null);
        setMemberSearch('');
        onMembersChanged?.();
      } else {
        Alert.alert('Error', res.error || 'Could not add member');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not add member');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const requestRemoveMember = (member) => {
    if (!isGroupAdmin) return;
    if (isGroupOwner(member)) return;
    setConfirmRemoveMember(member);
  };

  const applyRemoveMember = async () => {
    const target = confirmRemoveMember;
    if (!target) return;

    setSubmittingRemove(true);
    try {
      const res = await mobilePostsGroupService.removeMember(group.id, target.userId);
      if (res.success) {
        setConfirmRemoveMember(null);
        onMembersChanged?.();
      } else {
        Alert.alert('Error', res.error || 'Could not remove member');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not remove member');
    } finally {
      setSubmittingRemove(false);
    }
  };

  // ----------------------------------------------------------------
  // Row renderer
  // ----------------------------------------------------------------
  const renderMember = ({ item: m }) => {
    const isPending = m.status === 'pending';
    const isOwner = isGroupOwner(m);
    const isMe = Number(m.userId) === Number(currentUserId);

    return (
      <View style={[styles.memberRow, {
        backgroundColor: cardBg,
        borderColor: isPending ? (darkMode ? '#78350F' : '#FDE68A') : borderColor,
      }]}>
        <View style={[styles.avatar, { backgroundColor: m.color || '#8B5CF6' }]}>
          <Text style={styles.avatarText}>{m.initials}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.memberNameRow}>
            <Text style={[styles.memberName, { color: textColor }]} numberOfLines={1}>
              {m.name}
              {isMe ? ' (you)' : ''}
            </Text>
            {isPending && (
              <View style={[styles.pendingPill, { backgroundColor: darkMode ? '#422006' : '#FEF3C7' }]}>
                <Text style={[styles.pendingPillText, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                  ⏳ PENDING
                </Text>
              </View>
            )}
          </View>
          <View style={styles.memberRoleRow}>
            <Text style={[styles.memberRole, { color: subTextColor }]}>
              {m.department || (isOwner ? 'Group owner' : 'Member')}
            </Text>
          </View>
        </View>

        {isOwner ? (
          <View style={[styles.adminPill, { backgroundColor: darkMode ? '#312E81' : '#EEF2FF' }]}>
            <Text style={[styles.adminPillText, { color: darkMode ? '#C7D2FE' : '#4338CA' }]}>OWNER</Text>
          </View>
        ) : isGroupAdmin ? (
          <View style={styles.memberActions}>
            <TouchableOpacity
              onPress={() => requestRemoveMember(m)}
              hitSlop={6}
              activeOpacity={0.7}
              style={[styles.smallIconBtn, { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2' }]}
            >
              <Text style={styles.smallIconText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>Members</Text>
          <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
            {group?.name || 'Group'} · {members.length} total
            {isGroupAdmin ? '' : ' · read-only'}
          </Text>
        </View>
        {isGroupAdmin && (
          <TouchableOpacity
            onPress={openAddMember}
            activeOpacity={0.85}
            style={[styles.addBtn, { backgroundColor: accentColor }]}
          >
            <Text style={styles.addBtnText}>＋ Member</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.memberFilterRow}>
        {MEMBER_FILTERS.map((f) => {
          const active = memberFilter === f.key;
          const isPending = f.key === 'pending';
          const bg = active
            ? (isPending ? '#F59E0B' : accentColor)
            : (darkMode ? '#1E293B' : '#F1F5F9');
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setMemberFilter(f.key)}
              activeOpacity={0.85}
              style={[styles.memberFilterPill, { backgroundColor: bg, borderColor: bg }]}
            >
              <Text style={[styles.memberFilterText, { color: active ? '#FFFFFF' : textColor }]} numberOfLines={1}>
                {f.label} ({memberCounts[f.key]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={visibleMembers}
        keyExtractor={(it) => String(it.userId)}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>{memberFilter === 'pending' ? '⏳' : '👥'}</Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {memberFilter === 'pending' ? 'No pending invites' : 'No active members'}
            </Text>
            <Text style={[styles.emptyBody, { color: subTextColor }]}>
              {memberFilter === 'pending'
                ? 'Everyone has responded to their invite.'
                : (isGroupAdmin
                    ? 'Tap “＋ Member” to add people to this group.'
                    : 'Only the group owner can add members.')}
            </Text>
          </View>
        }
      />

      {/* ---------------- Add Member Modal ---------------- */}
      <Modal
        visible={isGroupAdmin && showAddMember}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMember(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setShowAddMember(false)} />
          <View style={[styles.modal, styles.addMemberModal, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Add Member</Text>
            <Text style={[styles.modalSub, { color: subTextColor }]}>Pick someone to invite to {group?.name}</Text>

            <View style={[styles.searchWrap, {
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor,
            }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="Search by name or department…"
                placeholderTextColor={subTextColor}
                style={[styles.searchInput, { color: textColor }]}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {memberSearch.length > 0 && (
                <TouchableOpacity onPress={() => setMemberSearch('')} hitSlop={8}>
                  <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ maxHeight: 220, marginTop: 6 }}>
              {directoryLoading ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={accentColor} />
                </View>
              ) : (
                <FlatList
                  data={addableUsers}
                  keyExtractor={(it) => String(it.userId)}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: u }) => {
                    const selected = Number(selectedUser?.userId) === Number(u.userId);
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedUser(u)}
                        activeOpacity={0.85}
                        style={[styles.userPickRow, {
                          backgroundColor: selected
                            ? (darkMode ? '#312E81' : '#EEF2FF')
                            : (darkMode ? '#0F172A' : '#FFFFFF'),
                          borderColor: selected ? accentColor : borderColor,
                        }]}
                      >
                        <View style={[styles.avatarSmall, { backgroundColor: u.color || '#8B5CF6' }]}>
                          <Text style={styles.avatarSmallText}>{u.initials}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.userPickName, { color: textColor }]} numberOfLines={1}>{u.name}</Text>
                          {!!u.department && (
                            <Text style={[styles.userPickDept, { color: subTextColor }]} numberOfLines={1}>
                              {u.department}
                            </Text>
                          )}
                        </View>
                        {selected && <Text style={[styles.checkMark, { color: accentColor }]}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={[styles.emptySmall, { color: subTextColor }]}>
                      {memberSearch
                        ? `No people match "${memberSearch}".`
                        : 'Everyone is already in this group.'}
                    </Text>
                  }
                />
              )}
            </View>

            <Text style={[styles.pendingHint, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
              ⏳ They will be added as <Text style={{ fontWeight: '900' }}>Pending</Text> until they accept the invite.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowAddMember(false)}
                activeOpacity={0.85}
                disabled={submittingAdd}
                style={[styles.modalBtn, {
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                  borderColor,
                }]}
              >
                <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAddMember}
                activeOpacity={0.85}
                disabled={!selectedUser || submittingAdd}
                style={[styles.modalBtn, {
                  backgroundColor: selectedUser && !submittingAdd ? accentColor : '#94A3B8',
                  borderColor: selectedUser && !submittingAdd ? accentColor : '#94A3B8',
                }]}
              >
                {submittingAdd ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Send invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---------------- Remove member confirm ---------------- */}
      <Modal
        visible={isGroupAdmin && !!confirmRemoveMember}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmRemoveMember(null)}
      >
        <View style={styles.centerBackdrop}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setConfirmRemoveMember(null)} />
          {confirmRemoveMember && (
            <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Remove member?</Text>
              <Text style={[styles.modalSub, { color: subTextColor }]}>
                {confirmRemoveMember.name} will be removed from {group?.name}. They can be added back later.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setConfirmRemoveMember(null)}
                  activeOpacity={0.85}
                  disabled={submittingRemove}
                  style={[styles.modalBtn, {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                    borderColor,
                  }]}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={applyRemoveMember}
                  activeOpacity={0.85}
                  disabled={submittingRemove}
                  style={[styles.modalBtn, {
                    backgroundColor: '#EF4444',
                    borderColor: '#EF4444',
                  }]}
                >
                  {submittingRemove ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Remove</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ================================================================
// STYLES (unchanged)
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, fontWeight: '300', marginTop: -6 },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },

  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  memberFilterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 10 },
  memberFilterPill: {
    flex: 1, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  memberFilterText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, gap: 12,
  },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  memberName: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  memberRoleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  memberRole: { fontSize: 11.5, fontWeight: '500' },
  pendingPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  pendingPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  adminPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  adminPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallIconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  smallIconText: { color: '#EF4444', fontSize: 13, fontWeight: '900' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, height: 40, gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },

  userPickRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1, marginBottom: 5, gap: 10,
  },
  userPickName: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
  userPickDept: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  avatarSmall: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  checkMark: { fontSize: 18, fontWeight: '900' },
  emptySmall: { fontSize: 12.5, fontWeight: '500', textAlign: 'center', paddingVertical: 16 },

  pendingHint: { fontSize: 11.5, fontWeight: '600', marginTop: 10, lineHeight: 16 },

  centerBackdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 24,
  },
  centerModal: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 1, padding: 20 },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },

  addMemberModal: { maxHeight: '90%' },

  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modal: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1,
    padding: 20, paddingBottom: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3, marginBottom: 8 },

  fieldLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
    marginBottom: 6, marginTop: 12,
  },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  modalBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
});