// super-app/src/pages/posts/PostsPage.js
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
  Alert,
  ActivityIndicator,
  BackHandler,
  RefreshControl,
} from 'react-native';

import mobilePostsGroupService from '../../stores/mobilePostsGroupService';
import authService from '../../stores/authService';

// ================================================================
// Filters
// ================================================================
const FILTERS = [
  { key: 'active',   label: 'Active'   },
  { key: 'inactive', label: 'Inactive' },
];

const PAGE_SIZE = 10;

export default function PostsPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = React.useRef(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [groupError, setGroupError] = useState(null);
  const [submittingGroup, setSubmittingGroup] = useState(false);

  const [managingGroup, setManagingGroup] = useState(null);

  // ---- Security confirm modal state ----
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [confirmError, setConfirmError] = useState(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  // ---- Leave group modal state ----
  const [leaveGroupModal, setLeaveGroupModal] = useState(null);
  const [transferTo, setTransferTo] = useState(null);
  const [leaveError, setLeaveError] = useState(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const [openedGroup, setOpenedGroup] = useState(null);

  // ----------------------------------------------------------------
  // Current user — from the existing auth service
  // ----------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState(authService.user);

  useEffect(() => {
    setCurrentUser(authService.user);
    const unsubscribe = authService.subscribe((svc) => {
      setCurrentUser(svc.user);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      else authService._listeners?.delete?.(unsubscribe);
    };
  }, []);

  const currentUserId = currentUser?.userId;

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  const isOwner = (g) =>
    !!g && Number(g.createdBy) === Number(currentUserId);

  // ----------------------------------------------------------------
  // Data loading
  // ----------------------------------------------------------------
  const loadGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await mobilePostsGroupService.listGroups({
        filter,
        search: search.trim(),
        page: 1,
        limit: 100,
      });

      if (res.success) {
        setGroups(res.data.items || []);
      } else {
        Alert.alert('Error', res.error || 'Failed to load groups');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    setPage(1);
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [search, filter]);

  useEffect(() => {
    if (!openedGroup) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpenedGroup(null);
      return true;
    });
    return () => sub.remove();
  }, [openedGroup]);

  // ----------------------------------------------------------------
  // Derived
  // ----------------------------------------------------------------
  const counts = useMemo(
    () => ({
      active:   groups.filter((g) => g.status === 'active').length,
      inactive: groups.filter((g) => g.status === 'inactive').length,
    }),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .filter((g) => {
        const matchesFilter = g.status === filter;
        const matchesSearch =
          !q ||
          (g.name || '').toLowerCase().includes(q) ||
          (g.description || '').toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
  }, [groups, search, filter]);

  const visibleGroups = useMemo(
    () => filteredGroups.slice(0, page * PAGE_SIZE),
    [filteredGroups, page]
  );

  const hasMore = visibleGroups.length < filteredGroups.length;

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (!hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }, 300);
  }, [hasMore]);

  // ----------------------------------------------------------------
  // Create group
  // ----------------------------------------------------------------
  const submitGroup = async () => {
    if (!newGroupName.trim()) {
      setGroupError('Name is required');
      return;
    }
    setSubmittingGroup(true);
    try {
      const res = await mobilePostsGroupService.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || null,
      });
      if (res.success) {
        setGroups((prev) => [res.data, ...prev]);
        setShowCreateGroup(false);
        setNewGroupName('');
        setNewGroupDesc('');
        setGroupError(null);
      } else {
        setGroupError(res.error || 'Could not create group');
      }
    } catch (e) {
      setGroupError(e?.message || 'Could not create group');
    } finally {
      setSubmittingGroup(false);
    }
  };

  // ----------------------------------------------------------------
  // Owner-only: activate / deactivate / delete
  // ----------------------------------------------------------------
  const applyGroupUpdate = (updated) => {
    setGroups((prev) =>
      prev.map((g) =>
        Number(g.id) === Number(updated.id) ? { ...g, ...updated } : g
      )
    );
  };

  const setGroupStatus = async (groupId, newStatus) => {
    try {
      const res =
        newStatus === 'active'
          ? await mobilePostsGroupService.activateGroup(groupId)
          : await mobilePostsGroupService.deactivateGroup(groupId);

      if (res.success) {
        applyGroupUpdate(res.data);
      } else {
        Alert.alert('Error', res.error || 'Could not update group');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not update group');
    } finally {
      setManagingGroup(null);
    }
  };

  const requestDeactivate = (g) => {
    if (!isOwner(g)) return;
    setManagingGroup(null);
    setConfirmText('');
    setConfirmError(null);
    setConfirmAction({ group: g, action: 'deactivate' });
  };

  const requestDelete = (g) => {
    if (!isOwner(g)) return;
    setManagingGroup(null);
    setConfirmText('');
    setConfirmError(null);
    setConfirmAction({ group: g, action: 'delete' });
  };

  const applyConfirmAction = async () => {
    if (!confirmAction) return;
    const { group, action } = confirmAction;

    if (confirmText.trim().toLowerCase() !== group.name.trim().toLowerCase()) {
      setConfirmError('Type the group name exactly to confirm.');
      return;
    }

    setConfirmSubmitting(true);
    try {
      if (action === 'deactivate') {
        const res = await mobilePostsGroupService.deactivateGroup(group.id);
        if (res.success) {
          applyGroupUpdate(res.data);
        } else {
          setConfirmError(res.error || 'Could not deactivate');
          return;
        }
      } else if (action === 'delete') {
        const res = await mobilePostsGroupService.deleteGroup(group.id, confirmText.trim());
        if (res.success) {
          setGroups((prev) => prev.filter((g) => Number(g.id) !== Number(group.id)));
        } else {
          setConfirmError(res.error || 'Could not delete');
          return;
        }
      }

      setConfirmAction(null);
      setConfirmText('');
      setConfirmError(null);
    } catch (e) {
      setConfirmError(e?.message || 'Something went wrong');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const cancelConfirmAction = () => {
    setConfirmAction(null);
    setConfirmText('');
    setConfirmError(null);
  };

  // ----------------------------------------------------------------
  // Leave group
  // ----------------------------------------------------------------
  const requestLeave = (g) => {
    setManagingGroup(null);
    setTransferTo(null);
    setLeaveError(null);
    setLeaveGroupModal({ group: g, isOwner: isOwner(g) });
  };

  const applyLeave = async () => {
    if (!leaveGroupModal) return;
    const { group, isOwner: owner } = leaveGroupModal;

    if (owner && !transferTo) {
      setLeaveError('Pick someone to hand over ownership to.');
      return;
    }

    setLeaveSubmitting(true);
    try {
      const res = await mobilePostsGroupService.leaveGroup(
        group.id,
        owner ? { transferTo: transferTo.userId } : {}
      );
      if (res.success) {
        setGroups((prev) => prev.filter((g) => Number(g.id) !== Number(group.id)));
        setLeaveGroupModal(null);
        setTransferTo(null);
        setLeaveError(null);
      } else {
        setLeaveError(res.error || 'Could not leave group');
      }
    } catch (e) {
      setLeaveError(e?.message || 'Could not leave group');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const cancelLeave = () => {
    setLeaveGroupModal(null);
    setTransferTo(null);
    setLeaveError(null);
  };

  // ----------------------------------------------------------------
  // Open detail
  // ----------------------------------------------------------------
  const openGroupDetail = (g) => {
    if (g.status === 'inactive') {
      Alert.alert(
        'Group is inactive',
        `"${g.name}" is inactive. Only the owner can reactivate it. Members can still view past posts.`,
        [
          { text: 'OK' },
          ...(isOwner(g)
            ? [{
                text: 'Activate',
                onPress: () => setGroupStatus(g.id, 'active'),
              }]
            : []),
        ]
      );
      return;
    }
    setOpenedGroup(g);
  };

  // ================================================================
  // RENDER — GROUP CARD
  // ================================================================
  const renderGroup = ({ item: g }) => {
    const isInactive = g.status === 'inactive';
    const memberCount = g.memberCount || (g.members ? g.members.length : 0);
    const pendingCount = g.pendingCount || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openGroupDetail(g)}
        onLongPress={() => setManagingGroup(g)}
        style={[
          styles.groupCard,
          {
            backgroundColor: cardBg,
            borderColor: darkMode ? '#D4A64A' : '#F5D77E',
          },
        ]}
      >
        <View
          style={[
            styles.groupAccent,
            {
              backgroundColor: isInactive
                ? '#94A3B8'
                : (g.accent || '#8B5CF6'),
            },
          ]}
        />

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.groupName, { color: textColor }]}
              numberOfLines={1}
            >
              {g.name}
            </Text>

            {isInactive && (
              <View
                style={[
                  styles.pausedPill,
                  { backgroundColor: darkMode ? '#422006' : '#FEF3C7' },
                ]}
              >
                <Text
                  style={[
                    styles.pausedPillText,
                    { color: darkMode ? '#FCD34D' : '#92400E' },
                  ]}
                >
                  ⏸ Inactive
                </Text>
              </View>
            )}

            {/* Golden circular pending count badge */}
            {pendingCount > 0 && (
              <View style={[styles.pendingCircle, { borderColor: cardBg }]}>
                <Text style={styles.pendingCircleText}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[styles.groupDesc, { color: subTextColor }]}
            numberOfLines={1}
          >
            {g.description || 'No description'}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.groupMeta, { color: subTextColor }]}>
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Pending approval hint under member count */}
          {pendingCount > 0 && (
            <Text style={[styles.pendingHint, { color: '#B45309' }]}>
              You have {pendingCount} pending approval
              {pendingCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>

        <View style={styles.actionBtns}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              setManagingGroup(g);
            }}
            hitSlop={10}
            activeOpacity={0.7}
            style={[
              styles.iconBtn,
              { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.menuText, { color: subTextColor }]}>⋯</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              openGroupDetail(g);
            }}
            hitSlop={10}
            activeOpacity={0.7}
            style={[
              styles.iconBtn,
              { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.chevronText, { color: subTextColor }]}>›</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ================================================================
  // RENDER — LOADING STATE
  // ================================================================
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Posts</Text>
            <Text style={[styles.headerSub, { color: subTextColor }]}>Loading groups…</Text>
          </View>
        </View>

        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: subTextColor }]}>
            Loading groups…
          </Text>
        </View>
      </View>
    );
  }

  // ================================================================
  // RENDER — GROUP DETAIL (lazy loaded)
  // ================================================================
  if (openedGroup) {
    const GroupDetailComponent = require('./GroupDetailPage').default;

    const liveGroup =
      groups.find((g) => Number(g.id) === Number(openedGroup.id)) || openedGroup;

    return (
      <GroupDetailComponent
        group={liveGroup}
        currentUser={currentUser}
        onGroupUpdated={applyGroupUpdate}
        onGroupRemoved={() =>
          setGroups((prev) =>
            prev.filter((g) => Number(g.id) !== Number(liveGroup.id))
          )
        }
        onBack={() => {
          setOpenedGroup(null);
          loadGroups(true);
        }}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    );
  }

  // ================================================================
  // RENDER — GROUPS LIST
  // ================================================================
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Posts</Text>
          <Text style={[styles.headerSub, { color: subTextColor }]}>
            {counts.active} active · {counts.inactive} inactive
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateGroup(true)}
          activeOpacity={0.85}
          style={[styles.addBtn, { backgroundColor: '#8B5CF6' }]}
        >
          <Text style={styles.addBtnText}>＋ Group</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search groups…"
          placeholderTextColor={subTextColor}
          style={[styles.searchInput, { color: textColor }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2 filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active
                    ? '#8B5CF6'
                    : darkMode ? '#1E293B' : '#F1F5F9',
                  borderColor: active ? '#8B5CF6' : borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: active ? '#FFFFFF' : textColor },
                ]}
                numberOfLines={1}
              >
                {f.label} ({counts[f.key]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Result count when searching */}
      {search.trim().length > 0 && (
        <Text style={[styles.resultCount, { color: subTextColor }]}>
          {filteredGroups.length} result{filteredGroups.length === 1 ? '' : 's'} for "{search}"
        </Text>
      )}

      {/* Groups list */}
      <FlatList
        data={visibleGroups}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderGroup}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={7}
        removeClippedSubviews={true}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadGroups(true)}
            tintColor="#8B5CF6"
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={[styles.footerLoaderText, { color: subTextColor }]}>
                Loading more…
              </Text>
            </View>
          ) : hasMore ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              Scroll for more · {visibleGroups.length} of {filteredGroups.length}
            </Text>
          ) : visibleGroups.length > PAGE_SIZE ? (
            <Text style={[styles.footerText, { color: subTextColor }]}>
              End of list · {filteredGroups.length} group
              {filteredGroups.length === 1 ? '' : 's'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>
              {search ? '🔍' : '📭'}
            </Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {search ? 'No matches' : 'No groups'}
            </Text>
            <Text style={[styles.emptyBody, { color: subTextColor }]}>
              {search
                ? `No groups match "${search}".`
                : filter === 'inactive'
                ? 'No inactive groups.'
                : 'No active groups.'}
            </Text>
          </View>
        }
      />

      {/* ─── Create Group Modal ─── */}
      <Modal
        visible={showCreateGroup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateGroup(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowCreateGroup(false)}
          />
          <View style={[styles.modal, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>New Group</Text>
            <Text style={[styles.modalSub, { color: subTextColor }]}>
              Create a group to organize posts
            </Text>

            <Text style={[styles.fieldLabel, { color: subTextColor }]}>NAME</Text>
            <TextInput
              value={newGroupName}
              onChangeText={(v) => {
                setNewGroupName(v);
                setGroupError(null);
              }}
              placeholder="e.g. Marketing Team"
              placeholderTextColor={subTextColor}
              editable={!submittingGroup}
              style={[
                styles.input,
                {
                  color: textColor,
                  backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                  borderColor: groupError ? '#EF4444' : borderColor,
                },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: subTextColor }]}>
              DESCRIPTION
            </Text>
            <TextInput
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
              placeholder="Optional"
              placeholderTextColor={subTextColor}
              editable={!submittingGroup}
              style={[
                styles.input,
                {
                  color: textColor,
                  backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                  borderColor,
                },
              ]}
            />

            {groupError && (
              <Text style={{ color: '#EF4444', marginTop: 6, fontWeight: '600' }}>
                {groupError}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCreateGroup(false)}
                activeOpacity={0.85}
                disabled={submittingGroup}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                    borderColor,
                  },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitGroup}
                activeOpacity={0.85}
                disabled={submittingGroup}
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: submittingGroup ? '#94A3B8' : '#8B5CF6',
                    borderColor: submittingGroup ? '#94A3B8' : '#8B5CF6',
                  },
                ]}
              >
                {submittingGroup ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Manage Group Modal ─── */}
      <Modal
        visible={!!managingGroup}
        transparent
        animationType="fade"
        onRequestClose={() => setManagingGroup(null)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={() => setManagingGroup(null)}
          />
          {managingGroup && (() => {
            const g = managingGroup;
            const isInactive = g.status === 'inactive';
            const owner = isOwner(g);
            const memberCount =
              g.memberCount || (g.members ? g.members.length : 0);

            return (
              <View style={[styles.modal, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.manageHeader}>
                  <Text style={styles.manageEmoji}>{g.emoji || '💬'}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[styles.modalTitle, { color: textColor }]}
                      numberOfLines={1}
                    >
                      {g.name}
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          alignSelf: 'flex-start',
                          marginTop: 6,
                          backgroundColor: isInactive
                            ? darkMode ? '#422006' : '#FEF3C7'
                            : darkMode ? '#064E3B' : '#ECFDF5',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: isInactive
                              ? darkMode ? '#FCD34D' : '#92400E'
                              : darkMode ? '#6EE7B7' : '#047857',
                          },
                        ]}
                      >
                        {isInactive ? '⏸ Inactive' : '● Active'}
                      </Text>
                    </View>

                    {owner && (
                      <View
                        style={[
                          styles.ownerBadge,
                          {
                            alignSelf: 'flex-start',
                            marginTop: 4,
                            backgroundColor: darkMode ? '#312E81' : '#EEF2FF',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.ownerBadgeText,
                            { color: darkMode ? '#C7D2FE' : '#4338CA' },
                          ]}
                        >
                          ★ YOU OWN THIS GROUP
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.manageInfo}>
                  <View style={styles.manageInfoRow}>
                    <Text style={[styles.manageInfoLabel, { color: subTextColor }]}>
                      Members
                    </Text>
                    <Text style={[styles.manageInfoValue, { color: textColor }]}>
                      {memberCount}
                    </Text>
                  </View>
                  <View style={styles.manageInfoRow}>
                    <Text style={[styles.manageInfoLabel, { color: subTextColor }]}>
                      Total posts
                    </Text>
                    <Text style={[styles.manageInfoValue, { color: textColor }]}>
                      {g.postCount ?? 0}
                    </Text>
                  </View>
                  <View style={styles.manageInfoRow}>
                    <Text style={[styles.manageInfoLabel, { color: subTextColor }]}>
                      Last activity
                    </Text>
                    <Text style={[styles.manageInfoValue, { color: textColor }]}>
                      {g.lastActivity
                        ? new Date(g.lastActivity).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit',
                          })
                        : '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionList}>
                  {owner && isInactive && (
                    <TouchableOpacity
                      onPress={() => setGroupStatus(g.id, 'active')}
                      activeOpacity={0.85}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: darkMode ? '#064E3B' : '#ECFDF5',
                          borderColor: '#10B981',
                        },
                      ]}
                    >
                      <Text style={styles.actionBtnIcon}>▶</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.actionBtnTitle,
                            { color: darkMode ? '#6EE7B7' : '#047857' },
                          ]}
                        >
                          Activate group
                        </Text>
                        <Text
                          style={[
                            styles.actionBtnSub,
                            { color: darkMode ? '#6EE7B7' : '#047857' },
                          ]}
                        >
                          Members can post again
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {owner && !isInactive && (
                    <TouchableOpacity
                      onPress={() => requestDeactivate(g)}
                      activeOpacity={0.85}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: darkMode ? '#422006' : '#FEF3C7',
                          borderColor: '#F59E0B',
                        },
                      ]}
                    >
                      <Text style={styles.actionBtnIcon}>⏸</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.actionBtnTitle,
                            { color: darkMode ? '#FCD34D' : '#92400E' },
                          ]}
                        >
                          Deactivate group
                        </Text>
                        <Text
                          style={[
                            styles.actionBtnSub,
                            { color: darkMode ? '#FCD34D' : '#92400E' },
                          ]}
                        >
                          Freeze activity until you reactivate
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {owner && (
                    <TouchableOpacity
                      onPress={() => requestDelete(g)}
                      activeOpacity={0.85}
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2',
                          borderColor: '#EF4444',
                        },
                      ]}
                    >
                      <Text style={styles.actionBtnIcon}>🗑️</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.actionBtnTitle,
                            { color: darkMode ? '#FCA5A5' : '#991B1B' },
                          ]}
                        >
                          Delete group (permanent)
                        </Text>
                        <Text
                          style={[
                            styles.actionBtnSub,
                            { color: darkMode ? '#FCA5A5' : '#991B1B' },
                          ]}
                        >
                          Removes group, posts, comments — cannot be undone
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => requestLeave(g)}
                    activeOpacity={0.85}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={styles.actionBtnIcon}>
                      {owner ? '🔁' : '🚪'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionBtnTitle, { color: textColor }]}>
                        {owner ? 'Leave & transfer ownership' : 'Leave group'}
                      </Text>
                      <Text style={[styles.actionBtnSub, { color: subTextColor }]}>
                        {owner
                          ? 'Pick a member to hand ownership to'
                          : 'You will stop receiving updates'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setManagingGroup(null)}
                  activeOpacity={0.85}
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                      borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.closeBtnText, { color: textColor }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* ─── Security Confirm ─── */}
      <Modal
        visible={!!confirmAction}
        transparent
        animationType="fade"
        onRequestClose={cancelConfirmAction}
      >
        <View style={styles.centerBackdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={cancelConfirmAction}
          />
          {confirmAction && (() => {
            const { group, action } = confirmAction;
            const isDelete = action === 'delete';
            const accent = isDelete ? '#EF4444' : '#F59E0B';
            const accentDark = isDelete
              ? (darkMode ? '#7F1D1D' : '#FEE2E2')
              : (darkMode ? '#422006' : '#FEF3C7');
            const accentText = isDelete
              ? (darkMode ? '#FCA5A5' : '#991B1B')
              : (darkMode ? '#FCD34D' : '#92400E');

            const matches =
              confirmText.trim().toLowerCase() ===
              group.name.trim().toLowerCase();

            return (
              <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
                <View
                  style={[
                    styles.confirmBadge,
                    { backgroundColor: accentDark, borderColor: accent },
                  ]}
                >
                  <Text style={[styles.confirmBadgeText, { color: accentText }]}>
                    {isDelete ? '⚠️ PERMANENT ACTION' : '⏸ DEACTIVATION'}
                  </Text>
                </View>

                <Text style={[styles.modalTitle, { color: textColor, marginTop: 12 }]}>
                  {isDelete ? 'Delete this group?' : 'Deactivate this group?'}
                </Text>
                <Text style={[styles.modalSub, { color: subTextColor }]}>
                  {isDelete
                    ? `"${group.name}" and all its posts, comments and images will be permanently removed. This cannot be undone.`
                    : `"${group.name}" will be frozen. Members can still read old posts but no one can create new content until you reactivate it.`}
                </Text>

                <View style={[styles.confirmDivider, { backgroundColor: borderColor }]} />

                <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                  TYPE THE GROUP NAME TO CONFIRM
                </Text>
                <TextInput
                  value={confirmText}
                  onChangeText={(v) => {
                    setConfirmText(v);
                    setConfirmError(null);
                  }}
                  placeholder={group.name}
                  placeholderTextColor={subTextColor}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!confirmSubmitting}
                  style={[
                    styles.input,
                    {
                      color: textColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor: confirmError ? '#EF4444' : borderColor,
                    },
                  ]}
                />
                {confirmError && (
                  <Text style={styles.reviewErrorText}>{confirmError}</Text>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={cancelConfirmAction}
                    activeOpacity={0.85}
                    disabled={confirmSubmitting}
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.modalBtnText, { color: textColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={applyConfirmAction}
                    activeOpacity={0.85}
                    disabled={!matches || confirmSubmitting}
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor:
                          matches && !confirmSubmitting ? accent : '#94A3B8',
                        borderColor:
                          matches && !confirmSubmitting ? accent : '#94A3B8',
                      },
                    ]}
                  >
                    {confirmSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                        {isDelete ? 'Delete permanently' : 'Deactivate'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* ─── Leave / Transfer Ownership Modal ─── */}
      <Modal
        visible={!!leaveGroupModal}
        transparent
        animationType="fade"
        onRequestClose={cancelLeave}
      >
        <View style={styles.centerBackdrop}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={cancelLeave}
          />
          {leaveGroupModal && (() => {
            const { group, isOwner: owner } = leaveGroupModal;

            const members = (group.members || []).filter(
              (m) => Number(m.userId) !== Number(currentUserId)
            );

            return (
              <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  {owner ? 'Leave & transfer ownership?' : 'Leave this group?'}
                </Text>
                <Text style={[styles.modalSub, { color: subTextColor }]}>
                  {owner
                    ? `You are the owner of "${group.name}". You must hand ownership to another member before you can leave.`
                    : `You will stop receiving updates from "${group.name}".`}
                </Text>

                {owner && (
                  <>
                    <View
                      style={[
                        styles.confirmDivider,
                        { backgroundColor: borderColor },
                      ]}
                    />
                    <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                      NEW OWNER
                    </Text>

                    {members.length === 0 ? (
                      <Text style={[styles.emptySmall, { color: subTextColor }]}>
                        There are no other members to hand ownership to. Add a member first, or delete the group instead.
                      </Text>
                    ) : (
                      <View style={{ maxHeight: 220 }}>
                        <FlatList
                          data={members}
                          keyExtractor={(it) => String(it.userId)}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={false}
                          renderItem={({ item: u }) => {
                            const selected =
                              Number(transferTo?.userId) === Number(u.userId);
                            return (
                              <TouchableOpacity
                                onPress={() => {
                                  setTransferTo(u);
                                  setLeaveError(null);
                                }}
                                activeOpacity={0.85}
                                style={[
                                  styles.userPickRow,
                                  {
                                    backgroundColor: selected
                                      ? darkMode
                                        ? '#312E81'
                                        : '#EEF2FF'
                                      : darkMode
                                      ? '#0F172A'
                                      : '#FFFFFF',
                                    borderColor: selected ? '#8B5CF6' : borderColor,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.avatarSmall,
                                    { backgroundColor: u.color || '#8B5CF6' },
                                  ]}
                                >
                                  <Text style={styles.avatarSmallText}>
                                    {u.initials ||
                                      (u.name || '?').slice(0, 2).toUpperCase()}
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.userPickName,
                                    { color: textColor, flex: 1 },
                                  ]}
                                >
                                  {u.name}
                                </Text>
                                {selected && (
                                  <Text
                                    style={[styles.checkMark, { color: '#8B5CF6' }]}
                                  >
                                    ✓
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </View>
                    )}
                    {leaveError && (
                      <Text style={styles.reviewErrorText}>{leaveError}</Text>
                    )}
                  </>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={cancelLeave}
                    activeOpacity={0.85}
                    disabled={leaveSubmitting}
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.modalBtnText, { color: textColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={applyLeave}
                    activeOpacity={0.85}
                    disabled={(owner && !transferTo) || leaveSubmitting}
                    style={[
                      styles.modalBtn,
                      {
                        backgroundColor:
                          (owner && !transferTo) || leaveSubmitting
                            ? '#94A3B8'
                            : '#EF4444',
                        borderColor:
                          (owner && !transferTo) || leaveSubmitting
                            ? '#94A3B8'
                            : '#EF4444',
                      },
                    ]}
                  >
                    {leaveSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                        {owner ? 'Transfer & leave' : 'Leave group'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

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

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  resultCount: {
    fontSize: 11.5,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    overflow: 'hidden',
  },
  groupAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },

  // ── Golden circular pending count badge ──
  pendingCircle: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: '#F5C842',
  },
  pendingCircleText: {
    color: '#7A5A00',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  // ── "You have N pending approvals" hint ──
  pendingHint: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: 0.1,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  groupDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  groupMeta: { fontSize: 11, fontWeight: '500' },

  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 24,
    fontWeight: '400',
    marginTop: -4,
  },
  menuText: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -6,
  },

  pausedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pausedPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
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

  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3, marginBottom: 8 },

  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  manageEmoji: { fontSize: 38 },

  manageInfo: { gap: 10, marginBottom: 20 },
  manageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageInfoLabel: { fontSize: 13, fontWeight: '600' },
  manageInfoValue: { fontSize: 14, fontWeight: '800' },

  actionList: { gap: 10, marginBottom: 16 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtnIcon: { fontSize: 20 },
  actionBtnTitle: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  actionBtnSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2, opacity: 0.85 },

  closeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '800' },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },

  centerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 24,
  },
  centerModal: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  confirmBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  confirmDivider: {
    height: 1,
    marginVertical: 14,
    opacity: 0.6,
  },
  reviewErrorText: {
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '700',
    fontSize: 12.5,
  },

  userPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    marginBottom: 5,
    gap: 10,
  },
  userPickName: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  checkMark: { fontSize: 18, fontWeight: '900' },
  emptySmall: {
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 16,
  },
});