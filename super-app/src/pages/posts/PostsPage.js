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
} from 'react-native';

// NOTE: GroupDetailPage is loaded lazily inside the component (see `if (openedGroup)` below).

// ================================================================
// DEMO DATA — 30 groups
// ================================================================
const DEMO_GROUPS = [
  { id: 1,  name: 'Main Store',          description: 'General store announcements',     emoji: '🏬', accent: '#10B981', memberCount: 12, postCount: 24, lastActivity: Date.now() - 1000 * 60 * 12,       status: 'active',   unreadCount: 0  },
  { id: 2,  name: 'Inventory Team',      description: 'Stock counts, transfers, audits', emoji: '📦', accent: '#8B5CF6', memberCount: 6,  postCount: 41, lastActivity: Date.now() - 1000 * 60 * 60 * 3,   status: 'active',   unreadCount: 0  },
  { id: 3,  name: 'Purchasing',          description: 'POs, suppliers, deliveries',      emoji: '🛒', accent: '#3B82F6', memberCount: 8,  postCount: 17, lastActivity: Date.now() - 1000 * 60 * 60 * 26,  status: 'active',   unreadCount: 3  },
  { id: 4,  name: 'Finance',             description: 'Budgets, payments, approvals',    emoji: '💰', accent: '#F59E0B', memberCount: 4,  postCount: 9,  lastActivity: Date.now() - 1000 * 60 * 60 * 48,  status: 'inactive', unreadCount: 0  },
  { id: 5,  name: 'HR & Payroll',        description: 'Employees, attendance, salary',   emoji: '👥', accent: '#EC4899', memberCount: 5,  postCount: 12, lastActivity: Date.now() - 1000 * 60 * 60 * 6,   status: 'active',   unreadCount: 1  },
  { id: 6,  name: 'Marketing',           description: 'Campaigns, ads, brand',           emoji: '📣', accent: '#8B5CF6', memberCount: 7,  postCount: 28, lastActivity: Date.now() - 1000 * 60 * 60 * 1,   status: 'active',   unreadCount: 7  },
  { id: 7,  name: 'Quality Control',     description: 'Inspections, standards, reports', emoji: '✅', accent: '#10B981', memberCount: 3,  postCount: 6,  lastActivity: Date.now() - 1000 * 60 * 60 * 20,  status: 'active',   unreadCount: 0  },
  { id: 8,  name: 'IT Support',          description: 'Tickets, systems, access',        emoji: '💻', accent: '#3B82F6', memberCount: 4,  postCount: 33, lastActivity: Date.now() - 1000 * 60 * 60 * 2,   status: 'active',   unreadCount: 2  },
  { id: 9,  name: 'Logistics',           description: 'Shipping, customs, tracking',     emoji: '🚚', accent: '#F59E0B', memberCount: 9,  postCount: 19, lastActivity: Date.now() - 1000 * 60 * 60 * 14,  status: 'active',   unreadCount: 0  },
  { id: 10, name: 'Sales Team',          description: 'Deals, clients, quotas',          emoji: '📈', accent: '#8B5CF6', memberCount: 11, postCount: 52, lastActivity: Date.now() - 1000 * 60 * 30,      status: 'active',   unreadCount: 5  },
  { id: 11, name: 'R&D',                 description: 'Products, testing, prototypes',   emoji: '🔬', accent: '#EC4899', memberCount: 5,  postCount: 8,  lastActivity: Date.now() - 1000 * 60 * 60 * 36,  status: 'inactive', unreadCount: 0  },
  { id: 12, name: 'Customer Service',    description: 'Complaints, refunds, feedback',   emoji: '🎧', accent: '#10B981', memberCount: 6,  postCount: 22, lastActivity: Date.now() - 1000 * 60 * 60 * 5,   status: 'active',   unreadCount: 1  },
  { id: 13, name: 'Legal & Compliance',  description: 'Contracts, regulations, audits',  emoji: '⚖️', accent: '#3B82F6', memberCount: 2,  postCount: 4,  lastActivity: Date.now() - 1000 * 60 * 60 * 72,  status: 'active',   unreadCount: 0  },
  { id: 14, name: 'Procurement',         description: 'Vendors, quotes, negotiations',   emoji: '📋', accent: '#F59E0B', memberCount: 4,  postCount: 14, lastActivity: Date.now() - 1000 * 60 * 60 * 8,   status: 'active',   unreadCount: 4  },
  { id: 15, name: 'Training',            description: 'Onboarding, courses, certs',      emoji: '🎓', accent: '#8B5CF6', memberCount: 3,  postCount: 11, lastActivity: Date.now() - 1000 * 60 * 60 * 18,  status: 'active',   unreadCount: 0  },
  { id: 16, name: 'Store 02 - Bole',     description: 'Branch updates and news',         emoji: '🏪', accent: '#10B981', memberCount: 8,  postCount: 26, lastActivity: Date.now() - 1000 * 60 * 45,      status: 'active',   unreadCount: 2  },
  { id: 17, name: 'Store 03 - CMC',      description: 'Branch updates and news',         emoji: '🏪', accent: '#10B981', memberCount: 7,  postCount: 20, lastActivity: Date.now() - 1000 * 60 * 60 * 4,   status: 'active',   unreadCount: 0  },
  { id: 18, name: 'Store 04 - Megenagna', description: 'Branch updates and news',        emoji: '🏪', accent: '#10B981', memberCount: 6,  postCount: 15, lastActivity: Date.now() - 1000 * 60 * 60 * 12,  status: 'active',   unreadCount: 1  },
  { id: 19, name: 'Store 05 - Saris',    description: 'Branch updates and news',         emoji: '🏪', accent: '#10B981', memberCount: 5,  postCount: 13, lastActivity: Date.now() - 1000 * 60 * 60 * 22,  status: 'inactive', unreadCount: 0  },
  { id: 20, name: 'Executive',           description: 'C-suite announcements',           emoji: '👔', accent: '#EF4444', memberCount: 3,  postCount: 7,  lastActivity: Date.now() - 1000 * 60 * 60 * 10,  status: 'active',   unreadCount: 0  },
  { id: 21, name: 'Warehouse A',         description: 'Inbound and outbound ops',        emoji: '📥', accent: '#8B5CF6', memberCount: 9,  postCount: 34, lastActivity: Date.now() - 1000 * 60 * 60 * 7,   status: 'active',   unreadCount: 0  },
  { id: 22, name: 'Warehouse B',         description: 'Inbound and outbound ops',        emoji: '📤', accent: '#8B5CF6', memberCount: 7,  postCount: 28, lastActivity: Date.now() - 1000 * 60 * 60 * 11,  status: 'active',   unreadCount: 3  },
  { id: 23, name: 'Security',            description: 'Access, alarms, patrols',         emoji: '🛡️', accent: '#EF4444', memberCount: 12, postCount: 18, lastActivity: Date.now() - 1000 * 60 * 60 * 3,   status: 'active',   unreadCount: 0  },
  { id: 24, name: 'Maintenance',         description: 'Repairs, facilities, tools',      emoji: '🔧', accent: '#F59E0B', memberCount: 6,  postCount: 21, lastActivity: Date.now() - 1000 * 60 * 60 * 15,  status: 'active',   unreadCount: 2  },
  { id: 25, name: 'Compliance',          description: 'Audits, policies, training',      emoji: '📜', accent: '#3B82F6', memberCount: 3,  postCount: 5,  lastActivity: Date.now() - 1000 * 60 * 60 * 40,  status: 'active',   unreadCount: 0  },
  { id: 26, name: 'Customer Success',    description: 'Accounts, renewals, upsells',     emoji: '🌟', accent: '#10B981', memberCount: 5,  postCount: 16, lastActivity: Date.now() - 1000 * 60 * 60 * 9,   status: 'active',   unreadCount: 1  },
  { id: 27, name: 'Data & Analytics',    description: 'Reports, dashboards, KPIs',       emoji: '📊', accent: '#8B5CF6', memberCount: 4,  postCount: 12, lastActivity: Date.now() - 1000 * 60 * 60 * 2,   status: 'active',   unreadCount: 0  },
  { id: 28, name: 'Onboarding',          description: 'New hires, setup, orientation',   emoji: '🚀', accent: '#EC4899', memberCount: 3,  postCount: 9,  lastActivity: Date.now() - 1000 * 60 * 60 * 24,  status: 'active',   unreadCount: 0  },
  { id: 29, name: 'Partnerships',        description: 'Vendors, alliances, deals',       emoji: '🤝', accent: '#3B82F6', memberCount: 2,  postCount: 6,  lastActivity: Date.now() - 1000 * 60 * 60 * 30,  status: 'active',   unreadCount: 0  },
  { id: 30, name: 'Innovation Lab',      description: 'Ideas, experiments, pilots',      emoji: '💡', accent: '#F59E0B', memberCount: 4,  postCount: 10, lastActivity: Date.now() - 1000 * 60 * 60 * 19,  status: 'active',   unreadCount: 2  },
];

const PAGE_SIZE = 10;

// ================================================================
// Filters
// ================================================================
const FILTERS = [
  { key: 'active',   label: 'Active'   },
  { key: 'inactive', label: 'Inactive' },
  { key: 'unread',   label: 'Unread'   },
];

export default function PostsPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [loading, setLoading] = useState(true);

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

  const [managingGroup, setManagingGroup] = useState(null);

  const [openedGroup, setOpenedGroup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      if (!cancelled) {
        setGroups(DEMO_GROUPS);
        setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!openedGroup) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpenedGroup(null);
      return true;
    });
    return () => sub.remove();
  }, [openedGroup]);

  const counts = useMemo(
    () => ({
      active:   groups.filter((g) => g.status === 'active').length,
      inactive: groups.filter((g) => g.status === 'inactive').length,
      unread:   groups.filter((g) => (g.unreadCount || 0) > 0).length,
    }),
    [groups]
  );

  const totalUnread = useMemo(
    () => groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .filter((g) => {
        const matchesFilter =
          filter === 'unread'
            ? (g.unreadCount || 0) > 0
            : g.status === filter;
        const matchesSearch =
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        const ua = a.unreadCount || 0;
        const ub = b.unreadCount || 0;
        if (ua !== ub) return ub - ua;
        return b.lastActivity - a.lastActivity;
      });
  }, [groups, search, filter]);

  useEffect(() => {
    setPage(1);
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [search, filter]);

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

  const submitGroup = () => {
    if (!newGroupName.trim()) {
      setGroupError('Name is required');
      return;
    }
    const id = Math.max(0, ...groups.map((g) => g.id)) + 1;
    setGroups((prev) => [
      {
        id,
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || 'No description',
        emoji: '💬',
        accent: '#8B5CF6',
        memberCount: 1,
        postCount: 0,
        lastActivity: Date.now(),
        status: 'active',
        unreadCount: 0,
      },
      ...prev,
    ]);
    setShowCreateGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setGroupError(null);
  };

  const setGroupStatus = (groupId, newStatus) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, status: newStatus } : g))
    );
    setManagingGroup(null);
  };

  const deleteGroup = (group) => {
    setManagingGroup(null);
    Alert.alert(
      'Delete group?',
      `"${group.name}" and all its posts will be permanently removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            setGroups((prev) => prev.filter((g) => g.id !== group.id)),
        },
      ]
    );
  };

  const openGroupDetail = (g) => {
    if (g.status === 'inactive') {
      Alert.alert(
        'Group is inactive',
        `"${g.name}" is inactive. Activate it to start posting again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: () => setGroupStatus(g.id, 'active'),
          },
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
    const unread = g.unreadCount || 0;
    const hasUnread = unread > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openGroupDetail(g)}
        onLongPress={() => setManagingGroup(g)}
        style={[
          styles.groupCard,
          {
            backgroundColor: cardBg,
            borderColor: hasUnread
              ? darkMode ? '#B45309' : '#FCD34D'
              : borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.groupAccent,
            {
              backgroundColor: isInactive
                ? '#94A3B8'
                : hasUnread
                ? '#F59E0B'
                : g.accent,
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
            {hasUnread && (
              <View
                style={[
                  styles.unreadBadge,
                  { backgroundColor: '#F59E0B', borderColor: cardBg },
                ]}
              >
                <Text style={styles.unreadBadgeText}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[styles.groupDesc, { color: subTextColor }]}
            numberOfLines={1}
          >
            {g.description}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.groupMeta, { color: subTextColor }]}>
              {g.memberCount} members
            </Text>
            {hasUnread && !isInactive && (
              <Text
                style={[
                  styles.groupMeta,
                  styles.unreadMeta,
                  { color: darkMode ? '#FCD34D' : '#92400E' },
                ]}
              >
                · {unread} unread post{unread === 1 ? '' : 's'}
              </Text>
            )}
          </View>
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
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Posts
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]}>
              Loading groups…
            </Text>
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
    return (
      <GroupDetailComponent
        group={openedGroup}
        onBack={() => setOpenedGroup(null)}
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
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Posts
          </Text>
          <Text style={[styles.headerSub, { color: subTextColor }]}>
            {counts.active} active · {counts.inactive} inactive
            {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
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
      <View
        style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}
      >
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

      {/* 3 filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const isUnread = f.key === 'unread';
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active
                    ? isUnread ? '#F59E0B' : '#8B5CF6'
                    : darkMode ? '#1E293B' : '#F1F5F9',
                  borderColor: active
                    ? isUnread ? '#F59E0B' : '#8B5CF6'
                    : borderColor,
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
              {search ? '🔍' : filter === 'unread' ? '✅' : '📭'}
            </Text>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {search
                ? 'No matches'
                : filter === 'unread'
                ? 'All caught up'
                : 'No groups'}
            </Text>
            <Text style={[styles.emptyBody, { color: subTextColor }]}>
              {search
                ? `No groups match "${search}".`
                : filter === 'unread'
                ? 'No unread posts.'
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
            <Text style={[styles.modalTitle, { color: textColor }]}>
              New Group
            </Text>
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
              <Text
                style={{ color: '#EF4444', marginTop: 6, fontWeight: '600' }}
              >
                {groupError}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCreateGroup(false)}
                activeOpacity={0.85}
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
                style={[
                  styles.modalBtn,
                  { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
                ]}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                  Create
                </Text>
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
            const unread = g.unreadCount || 0;
            return (
              <View style={[styles.modal, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.manageHeader}>
                  <Text style={styles.manageEmoji}>{g.emoji}</Text>
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
                  </View>
                </View>

                <View style={styles.manageInfo}>
                  <View style={styles.manageInfoRow}>
                    <Text style={[styles.manageInfoLabel, { color: subTextColor }]}>
                      Members
                    </Text>
                    <Text style={[styles.manageInfoValue, { color: textColor }]}>
                      {g.memberCount}
                    </Text>
                  </View>
                  <View style={styles.manageInfoRow}>
                    <Text style={[styles.manageInfoLabel, { color: subTextColor }]}>
                      Total posts
                    </Text>
                    <Text style={[styles.manageInfoValue, { color: textColor }]}>
                      {g.postCount}
                    </Text>
                  </View>
                  {unread > 0 && (
                    <View style={styles.manageInfoRow}>
                      <Text style={[styles.manageInfoLabel, { color: '#F59E0B' }]}>
                        Unread
                      </Text>
                      <Text style={[styles.manageInfoValue, { color: '#F59E0B' }]}>
                        {unread}
                      </Text>
                    </View>
                  )}
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
                  {isInactive ? (
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
                        <Text style={[styles.actionBtnTitle, { color: darkMode ? '#6EE7B7' : '#047857' }]}>
                          Activate group
                        </Text>
                        <Text style={[styles.actionBtnSub, { color: darkMode ? '#6EE7B7' : '#047857' }]}>
                          Members can post again
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setGroupStatus(g.id, 'inactive')}
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
                        <Text style={[styles.actionBtnTitle, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                          Deactivate group
                        </Text>
                        <Text style={[styles.actionBtnSub, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                          Hide from list, block new posts
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => deleteGroup(g)}
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
                      <Text style={[styles.actionBtnTitle, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>
                        Delete group
                      </Text>
                      <Text style={[styles.actionBtnSub, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>
                        Permanent — cannot be undone
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
    borderWidth: 1,
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

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.2,
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
  unreadMeta: { fontWeight: '800', letterSpacing: 0.2, marginLeft: 6 },

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
});