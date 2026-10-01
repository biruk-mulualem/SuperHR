// super-app/src/pages/posts/PostsPage.js
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';

import {
  GestureHandlerRootView,
  Swipeable,
} from 'react-native-gesture-handler';

import mobilePostsGroupService from '../../stores/mobilePostsGroupService';
import authService from '../../stores/authService';

// ✅ Static import — no inline require() in render (that caused remounts).
import GroupDetailPage from './GroupDetailPage';

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
  pendingIntent,
  onIntentHandled,
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');

  // ✅ Counts from the backend (both tabs, always accurate)
  const [counts, setCounts] = useState({ active: 0, inactive: 0 });

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  // Create group — bottom sheet modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [groupError, setGroupError] = useState(null);
  const [submittingGroup, setSubmittingGroup] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [confirmError, setConfirmError] = useState(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const [leaveGroupModal, setLeaveGroupModal] = useState(null);
  const [transferTo, setTransferTo] = useState(null);
  const [leaveError, setLeaveError] = useState(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const [openedGroup, setOpenedGroup] = useState(null);

  const [currentUser, setCurrentUser] = useState(authService.user);

  // ✅ Swipe-to-reveal bookkeeping
  const swipeableRefs = useRef(new Map());
  const openSwipeIdRef = useRef(null);

  // ✅ Intent consumption guard
  const consumedIntentRef = useRef(null);

  const closeAllSwipes = useCallback((exceptId = null) => {
    swipeableRefs.current.forEach((ref, id) => {
      if (String(id) !== String(exceptId)) {
        try { ref?.close?.(); } catch (e) { /* noop */ }
      }
    });
    openSwipeIdRef.current = exceptId;
  }, []);

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

  const isOwner = (g) =>
    !!g && Number(g.createdBy) === Number(currentUserId);

  const canSwipeGroup = () => true;

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

        if (res.data.counts) {
          setCounts({
            active:   res.data.counts.active   || 0,
            inactive: res.data.counts.inactive || 0,
          });
        }
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

  const refreshCounts = useCallback(async () => {
    try {
      const res = await mobilePostsGroupService.listGroups({
        filter,
        search: search.trim(),
        page: 1,
        limit: 1,
      });
      if (res?.success && res.data.counts) {
        setCounts({
          active:   res.data.counts.active   || 0,
          inactive: res.data.counts.inactive || 0,
        });
      }
    } catch (_) {
      // silent
    }
  }, [filter, search]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // ✅ Consume a pendingIntent coming from the notification page
  useEffect(() => {
    if (!pendingIntent) return;
    if (pendingIntent.tab !== 'posts') return;

    const sig = JSON.stringify(pendingIntent);
    if (consumedIntentRef.current === sig) return;
    consumedIntentRef.current = sig;

    const groupId = pendingIntent.params?.groupId;
    console.log('🟣 [PostsPage] consuming intent:', {
      intent: pendingIntent.intent,
      groupId,
    });

    if (!groupId) {
      onIntentHandled?.();
      return;
    }

    let cancelled = false;
    (async () => {
      // Prefer the group if already loaded
      const match = groups.find((g) => Number(g.id) === Number(groupId));
      let target = match;

      // Otherwise fetch it
      if (!target) {
        try {
          const res = await mobilePostsGroupService.getGroup(groupId);
          if (res?.success) target = res.data;
        } catch (e) {
          // silent — fall back to list view
        }
      }

      if (cancelled) return;

      if (target) {
        setOpenedGroup(target);
        // If it was a group-only intent, we're done here.
        // If it was a post intent, GroupDetailPage consumes it next.
        if (pendingIntent.intent === 'group') onIntentHandled?.();
      } else {
        // Couldn't resolve — clear the intent so we don't loop
        onIntentHandled?.();
      }
    })();

    return () => { cancelled = true; };
  }, [pendingIntent, groups, onIntentHandled]);

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

  useEffect(() => {
    if (!showCreateGroup) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelCreateGroup();
      return true;
    });
    return () => sub.remove();
  }, [showCreateGroup]);

  useEffect(() => {
    if (!confirmAction) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelConfirmAction();
      return true;
    });
    return () => sub.remove();
  }, [confirmAction]);

  useEffect(() => {
    if (!leaveGroupModal) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      cancelLeave();
      return true;
    });
    return () => sub.remove();
  }, [leaveGroupModal]);

  useEffect(() => {
    if (confirmAction || leaveGroupModal || showCreateGroup || openedGroup) {
      closeAllSwipes(null);
    }
  }, [confirmAction, leaveGroupModal, showCreateGroup, openedGroup, closeAllSwipes]);

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
        refreshCounts();
      } else {
        setGroupError(res.error || 'Could not create group');
      }
    } catch (e) {
      setGroupError(e?.message || 'Could not create group');
    } finally {
      setSubmittingGroup(false);
    }
  };

  const cancelCreateGroup = () => {
    setShowCreateGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setGroupError(null);
  };

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
        refreshCounts();
      } else {
        Alert.alert('Error', res.error || 'Could not update group');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not update group');
    }
  };

  const requestActivate = (g) => {
    if (!isOwner(g)) return;
    closeAllSwipes(null);
    setGroupStatus(g.id, 'active');
  };

  const requestDeactivate = (g) => {
    if (!isOwner(g)) return;
    closeAllSwipes(null);
    setConfirmText('');
    setConfirmError(null);
    setConfirmAction({ group: g, action: 'deactivate' });
  };

  const requestDelete = (g) => {
    if (!isOwner(g)) return;
    closeAllSwipes(null);
    setConfirmText('');
    setConfirmError(null);
    setConfirmAction({ group: g, action: 'delete' });
  };

  const requestLeave = (g) => {
    closeAllSwipes(null);
    setTransferTo(null);
    setLeaveError(null);
    setLeaveGroupModal({ group: g, isOwner: isOwner(g) });
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
          refreshCounts();
        } else {
          setConfirmError(res.error || 'Could not deactivate');
          return;
        }
      } else if (action === 'delete') {
        const res = await mobilePostsGroupService.deleteGroup(group.id, confirmText.trim());
        if (res.success) {
          setGroups((prev) => prev.filter((g) => Number(g.id) !== Number(group.id)));
          swipeableRefs.current.delete(group.id);
          refreshCounts();
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
        swipeableRefs.current.delete(group.id);
        setLeaveGroupModal(null);
        setTransferTo(null);
        setLeaveError(null);
        refreshCounts();
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

  const openGroupDetail = (g) => {
    if (openSwipeIdRef.current) {
      closeAllSwipes(null);
      return;
    }
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
    // User manually opened a group — clear any pending intent
    onIntentHandled?.();
    setOpenedGroup(g);
  };

  // ================================================================
  // RENDER: Group card
  // ================================================================
  const renderGroup = ({ item: g }) => {
    const isInactive = g.status === 'inactive';
    const memberCount = g.memberCount || (g.members ? g.members.length : 0);
    const pendingCount = g.pendingCount || 0;
    const owner = isOwner(g);

    const renderRightActions = (progress, dragX) => {
      const btnWidth = 68;
      const buttonCount = owner ? 3 : 1;
      const panelWidth = btnWidth * buttonCount;

      const translateX = dragX.interpolate({
        inputRange: [-panelWidth, 0],
        outputRange: [0, panelWidth],
        extrapolate: 'clamp',
      });

      const ActionBtn = ({ icon, color, onPress }) => (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={[
            styles.swipeActionBtn,
            { width: btnWidth, backgroundColor: color },
          ]}
        >
          <Text style={styles.swipeActionIcon}>{icon}</Text>
        </TouchableOpacity>
      );

      return (
        <Animated.View
          style={[
            styles.swipeActionsWrap,
            { width: panelWidth, transform: [{ translateX }] },
          ]}
        >
          {owner && isInactive && (
            <ActionBtn icon="▶" color="#10B981" onPress={() => requestActivate(g)} />
          )}
          {owner && !isInactive && (
            <ActionBtn icon="⏸" color="#F59E0B" onPress={() => requestDeactivate(g)} />
          )}
          {owner && (
            <ActionBtn icon="🗑" color="#EF4444" onPress={() => requestDelete(g)} />
          )}
          <ActionBtn
            icon={owner ? '🔁' : '🚪'}
            color="#64748B"
            onPress={() => requestLeave(g)}
          />
        </Animated.View>
      );
    };

    const cardContent = (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openGroupDetail(g)}
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
            <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>
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

            {pendingCount > 0 && (
              <View style={[styles.pendingCircle, { borderColor: cardBg }]}>
                <Text style={styles.pendingCircleText}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.groupDesc, { color: subTextColor }]} numberOfLines={1}>
            {g.description || 'No description'}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.groupMeta, { color: subTextColor }]}>
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </Text>
          </View>

          {pendingCount > 0 && (
            <Text style={[styles.pendingHint, { color: '#B45309' }]}>
              You have {pendingCount} pending approval
              {pendingCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>

        <View style={styles.actionBtns}>
          <View
            style={[
              styles.iconBtn,
              { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.chevronText, { color: subTextColor }]}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );

    if (!canSwipeGroup(g)) {
      return <View style={{ marginBottom: 10 }}>{cardContent}</View>;
    }

    return (
      <View style={{ marginBottom: 10, borderRadius: 14, overflow: 'hidden' }}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(g.id, ref);
            else swipeableRefs.current.delete(g.id);
          }}
          renderRightActions={renderRightActions}
          rightThreshold={40}
          overshootRight={false}
          friction={2}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-15, 15]}
          onSwipeableWillOpen={() => {
            closeAllSwipes(g.id);
          }}
          onSwipeableWillClose={() => {
            if (String(openSwipeIdRef.current) === String(g.id)) {
              openSwipeIdRef.current = null;
            }
          }}
        >
          {cardContent}
        </Swipeable>
      </View>
    );
  };

  // ================================================================
  // LOADING
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
  // GROUP DETAIL
  // ================================================================
  if (openedGroup) {
    const liveGroup =
      groups.find((g) => Number(g.id) === Number(openedGroup.id)) || openedGroup;

    return (
      <GroupDetailPage
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
          onIntentHandled?.();
        }}
        pendingIntent={pendingIntent?.intent === 'post' ? pendingIntent : null}
        onIntentHandled={onIntentHandled}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    );
  }

  // ================================================================
  // GROUPS LIST
  // ================================================================
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
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

        {search.trim().length > 0 && (
          <Text style={[styles.resultCount, { color: subTextColor }]}>
            {filteredGroups.length} result{filteredGroups.length === 1 ? '' : 's'} for "{search}"
          </Text>
        )}

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
          onScrollBeginDrag={() => closeAllSwipes(null)}
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

        {/* ─── Create Group — BOTTOM SHEET MODAL ─── */}
        <Modal
          visible={showCreateGroup}
          transparent
          animationType="slide"
          onRequestClose={cancelCreateGroup}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={styles.bottomSheetBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={cancelCreateGroup}
            />
            <View
              style={[
                styles.bottomSheet,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              <View style={styles.sheetHandleWrap}>
                <View
                  style={[
                    styles.sheetHandle,
                    { backgroundColor: darkMode ? '#334155' : '#CBD5E1' },
                  ]}
                />
              </View>

              <View style={styles.sheetHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.sheetTitle, { color: textColor }]}>
                    New Group
                  </Text>
                  <Text
                    style={[styles.sheetSub, { color: subTextColor }]}
                    numberOfLines={1}
                  >
                    Create a group to organize posts
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={cancelCreateGroup}
                  hitSlop={10}
                  activeOpacity={0.7}
                  style={[
                    styles.sheetCloseBtn,
                    { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' },
                  ]}
                >
                  <Text style={[styles.sheetCloseIcon, { color: subTextColor }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={styles.sheetContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>
                  NAME
                </Text>
                <TextInput
                  value={newGroupName}
                  onChangeText={(v) => {
                    setNewGroupName(v);
                    setGroupError(null);
                  }}
                  placeholder="e.g. Marketing Team"
                  placeholderTextColor={subTextColor}
                  editable={!submittingGroup}
                  autoFocus
                  returnKeyType="next"
                  style={[
                    styles.input,
                    {
                      color: textColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor: groupError ? '#EF4444' : borderColor,
                    },
                  ]}
                />

                <Text
                  style={[styles.fieldLabel, { color: subTextColor, marginTop: 16 }]}
                >
                  DESCRIPTION
                </Text>
                <TextInput
                  value={newGroupDesc}
                  onChangeText={setNewGroupDesc}
                  placeholder="Optional"
                  placeholderTextColor={subTextColor}
                  multiline
                  numberOfLines={4}
                  editable={!submittingGroup}
                  style={[
                    styles.input,
                    styles.textarea,
                    {
                      color: textColor,
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                      borderColor,
                    },
                  ]}
                />

                {groupError && (
                  <Text style={styles.reviewErrorText}>{groupError}</Text>
                )}

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    onPress={cancelCreateGroup}
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
                        Create group
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ─── Confirm (Delete / Deactivate) — BOTTOM SHEET ─── */}
        <Modal
          visible={!!confirmAction}
          transparent
          animationType="slide"
          onRequestClose={cancelConfirmAction}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={styles.bottomSheetBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
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
                ? (darkMode ? 'rgba(239,68,68,0.18)' : '#FEE2E2')
                : (darkMode ? 'rgba(245,158,11,0.18)' : '#FEF3C7');
              const accentText = isDelete
                ? (darkMode ? '#FCA5A5' : '#991B1B')
                : (darkMode ? '#FCD34D' : '#92400E');

              const matches =
                confirmText.trim().toLowerCase() ===
                group.name.trim().toLowerCase();

              return (
                <View
                  style={[
                    styles.bottomSheet,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                >
                  <View style={styles.sheetHandleWrap}>
                    <View
                      style={[
                        styles.sheetHandle,
                        { backgroundColor: darkMode ? '#334155' : '#CBD5E1' },
                      ]}
                    />
                  </View>

                  <ScrollView
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={styles.sheetContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <View
                      style={[
                        styles.sheetAccentBanner,
                        { backgroundColor: accentDark, borderColor: accent },
                      ]}
                    >
                      <Text style={styles.sheetAccentEmoji}>
                        {isDelete ? '⚠️' : '⏸'}
                      </Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[
                            styles.sheetAccentTitle,
                            { color: accentText },
                          ]}
                        >
                          {isDelete ? 'Permanent action' : 'Deactivation'}
                        </Text>
                        <Text
                          style={[
                            styles.sheetAccentBody,
                            { color: accentText },
                          ]}
                          numberOfLines={2}
                        >
                          {isDelete
                            ? 'This cannot be undone.'
                            : 'You can reactivate anytime.'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.sheetTitle,
                        { color: textColor, marginTop: 14 },
                      ]}
                    >
                      {isDelete ? 'Delete this group?' : 'Deactivate this group?'}
                    </Text>
                    <Text style={[styles.sheetSub, { color: subTextColor }]}>
                      {isDelete
                        ? `"${group.name}" and all its posts, comments and images will be permanently removed.`
                        : `"${group.name}" will be frozen. Members can still read old posts but no one can create new content until you reactivate it.`}
                    </Text>

                    <View
                      style={[
                        styles.confirmDivider,
                        { backgroundColor: borderColor },
                      ]}
                    />

                    <Text style={[styles.fieldLabel, { color: subTextColor, marginTop: 0 }]}>
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

                    <View style={styles.sheetActions}>
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
                  </ScrollView>
                </View>
              );
            })()}
          </KeyboardAvoidingView>
        </Modal>

        {/* ─── Leave / Transfer — BOTTOM SHEET ─── */}
        <Modal
          visible={!!leaveGroupModal}
          transparent
          animationType="slide"
          onRequestClose={cancelLeave}
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={styles.bottomSheetBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
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
                <View
                  style={[
                    styles.bottomSheet,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                >
                  <View style={styles.sheetHandleWrap}>
                    <View
                      style={[
                        styles.sheetHandle,
                        { backgroundColor: darkMode ? '#334155' : '#CBD5E1' },
                      ]}
                    />
                  </View>

                  <ScrollView
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={styles.sheetContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    <View
                      style={[
                        styles.sheetAccentBanner,
                        {
                          backgroundColor: darkMode
                            ? 'rgba(100,116,139,0.2)'
                            : '#F1F5F9',
                          borderColor: '#64748B',
                        },
                      ]}
                    >
                      <Text style={styles.sheetAccentEmoji}>
                        {owner ? '🔁' : '🚪'}
                      </Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[
                            styles.sheetAccentTitle,
                            { color: darkMode ? '#CBD5E1' : '#334155' },
                          ]}
                        >
                          {owner ? 'Transfer ownership' : 'Leave group'}
                        </Text>
                        <Text
                          style={[
                            styles.sheetAccentBody,
                            { color: darkMode ? '#94A3B8' : '#64748B' },
                          ]}
                          numberOfLines={2}
                        >
                          {owner
                            ? 'Pick a new owner first.'
                            : 'You can rejoin later.'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.sheetTitle,
                        { color: textColor, marginTop: 14 },
                      ]}
                    >
                      {owner ? 'Leave & transfer ownership?' : 'Leave this group?'}
                    </Text>
                    <Text style={[styles.sheetSub, { color: subTextColor }]}>
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
                        <Text style={[styles.fieldLabel, { color: subTextColor, marginTop: 0 }]}>
                          NEW OWNER
                        </Text>

                        {members.length === 0 ? (
                          <Text style={[styles.emptySmall, { color: subTextColor }]}>
                            There are no other members to hand ownership to. Add a member first, or delete the group instead.
                          </Text>
                        ) : (
                          <View style={{ maxHeight: 240 }}>
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

                    <View style={styles.sheetActions}>
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
                  </ScrollView>
                </View>
              );
            })()}
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

// ================================================================
// STYLES (unchanged)
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
  loadingText: { fontSize: 13, fontWeight: '500' },

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
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, fontWeight: '300', marginTop: -6 },

  headerActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

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

  swipeActionsWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  swipeActionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 82,
  },
  swipeActionIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  sheetTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  sheetSub: { fontSize: 12.5, fontWeight: '600', marginTop: 4 },

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
  textarea: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },

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

  bottomSheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  sheetSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseIcon: { fontSize: 15, fontWeight: '800' },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },

  sheetAccentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sheetAccentEmoji: { fontSize: 22 },
  sheetAccentTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sheetAccentBody: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
});