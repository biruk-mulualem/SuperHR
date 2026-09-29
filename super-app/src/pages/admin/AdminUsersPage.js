// src/pages/admin/AdminUsersPage.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Image,
  ScrollView,
  Clipboard,
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

import userService from '../../stores/userService';

const PAGE_SIZE = 20;

const USER_FILTERS = [
  { key: 'all',      label: 'All',      tint: '#8B5CF6' },
  { key: 'active',   label: 'Active',   tint: '#10B981' },
  { key: 'inactive', label: 'Inactive', tint: '#EF4444' },
];

// ================================================================
// HELPERS
// ================================================================
const fmtRelative = (ts) => {
  if (!ts) return 'Never';
  const t = new Date(ts).getTime();
  if (isNaN(t)) return 'Never';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
};

const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  let out =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];
  for (let i = 0; i < 8; i++) out += all[Math.floor(Math.random() * all.length)];
  return out.split('').sort(() => Math.random() - 0.5).join('');
};

// ================================================================
// REUSABLE DROPDOWN
// ================================================================
function Dropdown({
  items,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  darkMode, textColor, subTextColor, cardBg, borderColor,
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => items.find((it) => it.value === value) || null,
    [items, value]
  );

  return (
    <View style={{ zIndex: 30 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPress={() => setOpen((v) => !v)}
        style={[
          styles.dropdownTrigger,
          {
            backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.dropdownText,
            { color: selected ? textColor : subTextColor },
          ]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={[styles.dropdownChevron, { color: subTextColor }]}>
          {open ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {open ? (
        <View
          style={[
            styles.dropdownList,
            { backgroundColor: cardBg, borderColor },
          ]}
        >
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
            {items.length === 0 ? (
              <Text style={[styles.dropdownEmpty, { color: subTextColor }]}>
                No options
              </Text>
            ) : null}
            {items.map((it) => {
              const isSelected = it.value === value;
              return (
                <TouchableOpacity
                  key={String(it.value)}
                  activeOpacity={0.7}
                  onPress={() => {
                    onChange(it.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor: isSelected
                        ? (darkMode ? '#0C4A6E' : '#E0F2FE')
                        : 'transparent',
                      borderBottomColor: darkMode ? '#1E293B' : '#F1F5F9',
                    },
                  ]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: isSelected ? '#0284C7' : textColor },
                      ]}
                      numberOfLines={1}
                    >
                      {it.label}
                    </Text>
                    {it.sub ? (
                      <Text
                        style={[styles.dropdownItemSub, { color: subTextColor }]}
                        numberOfLines={1}
                      >
                        {it.sub}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <Text style={{ color: '#0284C7', fontWeight: '900' }}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

// ================================================================
// MAIN
// ================================================================
export default function AdminUsersPage({
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  userRole,
}) {
  const role = (userRole || '').toLowerCase();
  const canView   = ['admin', 'superadmin', 'checker', 'purchase_organizer'].includes(role);
  const canMutate = ['admin', 'superadmin', 'checker'].includes(role);
  const canCreate = canMutate;

  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'detail'

  // list state
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [items, setItems]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats]       = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // lookups
  const [roles, setRoles]           = useState([]);
  const [departments, setDepartments] = useState([]);

  // detail
  const [detailUser, setDetailUser] = useState(null);

  // reset password modal
  const [pwTarget, setPwTarget] = useState(null);
  const [pwValue, setPwValue]   = useState('');
  const [showPw, setShowPw]     = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // credentials shown once after create
  const [credentials, setCredentials] = useState(null);

  // swipe refs
  const swipeableRefs = useRef(new Map());
  const openSwipeIdRef = useRef(null);
  const closeAllSwipes = useCallback((exceptKey = null) => {
    swipeableRefs.current.forEach((ref, key) => {
      if (String(key) !== String(exceptKey)) {
        try { ref?.close?.(); } catch (e) {}
      }
    });
    openSwipeIdRef.current = exceptKey;
  }, []);

  // ================================================================
  // LOADERS
  // ================================================================
  const load = useCallback(async (isRefresh = false, nextPage = 1) => {
    if (isRefresh) setRefreshing(true);
    else if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await userService.getUsers({
        status: filter === 'all' ? undefined : filter,
        search: search.trim() || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (res.success) {
        if (nextPage === 1) setItems(res.data);
        else setItems((prev) => [...prev, ...res.data]);
        setPagination(res.pagination || { total: res.data.length, totalPages: 1 });
        setPage(nextPage);
      } else {
        Alert.alert('Error', res.error || 'Failed to load users');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter, search]);

  const loadStats = useCallback(async () => {
    const res = await userService.getUserStats();
    if (res.success && res.stats?.overview) {
      setStats(res.stats.overview);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    const [r, d] = await Promise.all([
      userService.getRoles(),
      userService.getDepartments(),
    ]);
    if (r.success) setRoles(r.roles || []);
    if (d.success) setDepartments(d.departments || []);
  }, []);

  useEffect(() => {
    if (!canView) return;
    load(false, 1);
    loadStats();
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!canView) return;
    const t = setTimeout(() => load(false, 1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ================================================================
  // DROPDOWN OPTIONS
  // ================================================================
  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.roleId, label: r.name })),
    [roles]
  );

  const departmentOptions = useMemo(
    () => [
      { value: null, label: 'None' },
      ...departments.map((d) => ({
        value: d.departmentId,
        label: d.name,
        sub: d.code || undefined,
      })),
    ],
    [departments]
  );

  // ================================================================
  // ACTIONS
  // ================================================================
  const closeSwipeFor = (id) => {
    const ref = swipeableRefs.current.get(`usr-${id}`);
    try { ref?.close?.(); } catch (e) {}
    openSwipeIdRef.current = null;
  };

  const openDetail = (user) => {
  closeSwipeFor(user.userId);
  setDetailUser(user);     // just use what the list already gave us
  setMode('detail');
};

  const handleToggleStatus = (user) => {
    closeSwipeFor(user.userId);
    const isActive = user.isActive;
    Alert.alert(
      isActive ? 'Deactivate user?' : 'Activate user?',
      isActive
        ? `${user.fullName || user.username} will not be able to log in.`
        : `${user.fullName || user.username} will be able to log in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Deactivate' : 'Activate',
          style: isActive ? 'destructive' : 'default',
          onPress: async () => {
            const res = isActive
              ? await userService.deactivateUser(user.userId)
              : await userService.activateUser(user.userId);
            if (res.success) {
              const newActive = !isActive;
              setItems((prev) =>
                prev.map((u) =>
                  u.userId === user.userId ? { ...u, isActive: newActive } : u
                )
              );
              setDetailUser((prev) =>
                prev && prev.userId === user.userId
                  ? { ...prev, isActive: newActive }
                  : prev
              );
              loadStats();
            } else {
              Alert.alert('Error', res.error || 'Failed to update');
            }
          },
        },
      ]
    );
  };

  const openResetPassword = (user) => {
    closeSwipeFor(user.userId);
    setPwTarget(user);
    setPwValue(generatePassword());
    setShowPw(true);
  };

  const submitResetPassword = async () => {
    if (!pwTarget) return;
    if (!pwValue || pwValue.length < 6) {
      Alert.alert('Invalid password', 'Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const res = await userService.resetUserPassword(pwTarget.userId, pwValue);
    setSubmitting(false);
    if (res.success) {
      setPwTarget({ ...pwTarget, __success: true, __newPassword: pwValue });
      setPwValue('');
      setShowPw(false);
    } else {
      Alert.alert('Error', res.error || 'Failed to reset password');
    }
  };

  const submitUpdate = async (patch) => {
    if (!detailUser) return;
    setSubmitting(true);
    const res = await userService.updateUser(detailUser.userId, patch);
    setSubmitting(false);
    if (res.success) {
      setDetailUser((prev) => ({ ...prev, ...res.user }));
      setItems((prev) =>
        prev.map((u) =>
          u.userId === res.user.userId ? { ...u, ...res.user } : u
        )
      );
      loadStats();
      Alert.alert('Saved', 'User updated successfully.');
    } else {
      Alert.alert('Error', res.error || 'Failed to save changes');
    }
  };

  const submitCreate = async (payload) => {
    setSubmitting(true);
    const res = await userService.createUser(payload);
    setSubmitting(false);
    if (res.success) {
      setCredentials({
        username: payload.username,
        password: payload.password,
      });
      await load(false, 1);
      loadStats();
    } else {
      Alert.alert('Error', res.error || 'Failed to create user');
    }
  };

  // ================================================================
  // RENDER: user card
  // ================================================================
  const renderUser = ({ item: u }) => {
    const name = userService.getUserDisplayName(u);
    const avatarUri = userService.getAvatarSource(u);
    const isActive = u.isActive;
    const refKey = `usr-${u.userId}`;

    const btnWidth = 86;
    const actionCount = canMutate ? 3 : 0;
    const totalWidth = btnWidth * actionCount;

    const renderRightActions = (progress, dragX) => {
      if (!canMutate) return null;
      const translateX = dragX.interpolate({
        inputRange: [-totalWidth, 0],
        outputRange: [0, totalWidth],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View style={[styles.swipeActionsWrap, { transform: [{ translateX }] }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openDetail(u)}
            style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#3B82F6' }]}
          >
            <Text style={styles.swipeBtnIcon}>✎</Text>
            <Text style={styles.swipeBtnLabel}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openResetPassword(u)}
            style={[styles.swipeBtn, { width: btnWidth, backgroundColor: '#F59E0B' }]}
          >
            <Text style={styles.swipeBtnIcon}>🔑</Text>
            <Text style={styles.swipeBtnLabel}>Reset PW</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleToggleStatus(u)}
            style={[
              styles.swipeBtn,
              { width: btnWidth, backgroundColor: isActive ? '#EF4444' : '#10B981' },
            ]}
          >
            <Text style={styles.swipeBtnIcon}>{isActive ? '⏻' : '↺'}</Text>
            <Text style={styles.swipeBtnLabel}>
              {isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    const card = (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.username, { color: subTextColor }]} numberOfLines={1}>
              @{u.username}
              {u.role ? ` · ${userService.formatRole(u.role)}` : ''}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isActive
                  ? darkMode ? '#064E3B' : '#ECFDF5'
                  : darkMode ? '#7F1D1D' : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                {
                  color: isActive
                    ? darkMode ? '#6EE7B7' : '#047857'
                    : darkMode ? '#FCA5A5' : '#991B1B',
                },
              ]}
            >
              {isActive ? '● ACTIVE' : '✕ INACTIVE'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.metaBlock,
            { borderTopColor: darkMode ? '#1E293B' : '#F1F5F9' },
          ]}
        >
          {u.departmentName ? (
            <Text style={[styles.metaText, { color: subTextColor }]} numberOfLines={1}>
              🏢 {u.departmentName}
              {u.departmentCode ? ` (${u.departmentCode})` : ''}
            </Text>
          ) : null}
          {u.email ? (
            <Text style={[styles.metaText, { color: subTextColor }]} numberOfLines={1}>
              ✉️ {u.email}
            </Text>
          ) : null}
          <Text style={[styles.metaText, { color: subTextColor }]} numberOfLines={1}>
            ⏱️ Last login: {fmtRelative(u.lastLogin)}
          </Text>
        </View>
      </View>
    );

    if (!canMutate) {
      return (
        <View style={styles.swipeWrap}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => openDetail(u)}>
            {card}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.swipeWrap}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(refKey, ref);
            else swipeableRefs.current.delete(refKey);
          }}
          renderRightActions={renderRightActions}
          rightThreshold={40}
          overshootRight={false}
          friction={2}
          onSwipeableWillOpen={() => closeAllSwipes(refKey)}
          onSwipeableWillClose={() => {
            if (String(openSwipeIdRef.current) === String(refKey)) {
              openSwipeIdRef.current = null;
            }
          }}
        >
          <TouchableOpacity activeOpacity={0.85} onPress={() => openDetail(u)}>
            {card}
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  const hasMore = pagination.totalPages > page;

  // ================================================================
  // GUARDS
  // ================================================================
  if (!canView) {
    return (
      <View style={styles.noAccess}>
        <Text style={styles.noAccessEmoji}>🔒</Text>
        <Text style={[styles.emptyTitle, { color: textColor }]}>Access denied</Text>
        <Text style={[styles.emptyBody, { color: subTextColor }]}>
          You don't have permission to view users.
        </Text>
      </View>
    );
  }

  // ================================================================
  // MODE: CREATE PAGE
  // ================================================================
  if (mode === 'create') {
    return (
      <GestureHandlerRootView style={styles.root}>
        <CreateUserPage
          onBack={() => setMode('list')}
          onSubmit={submitCreate}
          submitting={submitting}
          roleOptions={roleOptions}
          departmentOptions={departmentOptions}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />

        <CredentialsModal
          visible={!!credentials}
          credentials={credentials}
          onClose={() => { setCredentials(null); setMode('list'); }}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />
      </GestureHandlerRootView>
    );
  }

  // ================================================================
  // MODE: DETAIL PAGE
  // ================================================================
  if (mode === 'detail' && detailUser) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <UserDetailPage
          user={detailUser}
          onBack={() => { setMode('list'); setDetailUser(null); }}
          onSave={submitUpdate}
          onToggleStatus={() => handleToggleStatus(detailUser)}
          onResetPassword={() => openResetPassword(detailUser)}
          submitting={submitting}
          roleOptions={roleOptions}
          departmentOptions={departmentOptions}
          canMutate={canMutate}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />

        <ResetPasswordModal
          target={pwTarget}
          value={pwValue}
          onChange={setPwValue}
          showPw={showPw}
          setShowPw={setShowPw}
          onClose={() => { setPwTarget(null); setPwValue(''); }}
          onSubmit={submitResetPassword}
          submitting={submitting}
          onDone={() => { setPwTarget(null); setPwValue(''); }}
          onCopy={(text) => {
            try { Clipboard.setString(text); } catch (e) {}
            Alert.alert('Copied', 'Copied to clipboard.');
          }}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />
      </GestureHandlerRootView>
    );
  }

  // ================================================================
  // MODE: LIST
  // ================================================================
  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Users</Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
              {stats.total} total · {stats.active} active · {stats.inactive} inactive
            </Text>
          </View>
          {canCreate ? (
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.85}
              onPress={() => setMode('create')}
            >
              <Text style={styles.addBtnText}>+ New</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* SEARCH */}
        <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search username, name, email…"
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

        {/* FILTERS */}
        <View style={styles.filterRow}>
          {USER_FILTERS.map((f) => {
            const isActive = filter === f.key;
            const count =
              f.key === 'all'      ? stats.total
              : f.key === 'active' ? stats.active
              : stats.inactive;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.85}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? f.tint : (darkMode ? '#1E293B' : '#F1F5F9'),
                    borderColor: isActive ? f.tint : borderColor,
                  },
                ]}
              >
                <Text
                  style={[styles.filterPillText, { color: isActive ? '#FFFFFF' : textColor }]}
                  numberOfLines={1}
                >
                  {f.label} ({count || 0})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* LIST */}
        <FlatList
          data={items}
          keyExtractor={(it) => `usr-${it.userId}`}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => closeAllSwipes(null)}
          onEndReached={() => hasMore && !loadingMore && load(false, page + 1)}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                await load(true, 1);
                await loadStats();
              }}
              tintColor={subTextColor}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : hasMore ? (
              <Text style={[styles.footerText, { color: subTextColor }]}>
                Scroll for more
              </Text>
            ) : items.length > PAGE_SIZE ? (
              <Text style={[styles.footerText, { color: subTextColor }]}>
                End of list · {pagination.total} user{pagination.total === 1 ? '' : 's'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator color="#8B5CF6" />
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>
                  {filter === 'active' ? 'No active users'
                   : filter === 'inactive' ? 'No inactive users'
                   : 'No users yet'}
                </Text>
                <Text style={[styles.emptyBody, { color: subTextColor }]}>
                  {search ? `No users match "${search}".` : 'Try a different filter.'}
                </Text>
              </View>
            )
          }
        />
      </View>
    </GestureHandlerRootView>
  );
}

// ================================================================
// CREATE USER PAGE
// ================================================================
function CreateUserPage({
  onBack, onSubmit, submitting,
  roleOptions, departmentOptions,
  darkMode, textColor, subTextColor, cardBg, borderColor,
}) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [showPw, setShowPw] = useState(true);
  const [roleId, setRoleId] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);

  const canSubmit =
    username.trim().length >= 3 &&
    fullName.trim().length >= 2 &&
    roleId != null &&
    password.length >= 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.pageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={onBack}
            disabled={submitting}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Text style={[styles.backBtnText, { color: textColor }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: textColor }]}>New user</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={[styles.pageSub, { color: subTextColor }]}>
          Create a new account. The user can change their password after first login.
        </Text>

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>USERNAME *</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!submitting}
          placeholder="e.g. dawit.k"
          placeholderTextColor={subTextColor}
          style={[styles.input, {
            color: textColor,
            backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor,
          }]}
        />

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>FULL NAME *</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          editable={!submitting}
          placeholder="e.g. Dawit Kebede"
          placeholderTextColor={subTextColor}
          style={[styles.input, {
            color: textColor,
            backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor,
          }]}
        />

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>EMAIL</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!submitting}
          placeholder="e.g. dawit@example.com"
          placeholderTextColor={subTextColor}
          style={[styles.input, {
            color: textColor,
            backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor,
          }]}
        />

        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabelInline, { color: subTextColor }]}>PASSWORD *</Text>
          <TouchableOpacity
            onPress={() => { setPassword(generatePassword()); setShowPw(true); }}
            disabled={submitting}
            hitSlop={6}
          >
            <Text style={styles.generateLink}>Generate</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[styles.inputWithButton, {
            backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
            borderColor,
          }]}
        >
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            editable={!submitting}
            placeholder="At least 6 characters"
            placeholderTextColor={subTextColor}
            style={[styles.inputInline, { color: textColor }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPw((v) => !v)}
            hitSlop={8}
            style={styles.eyeInline}
          >
            <Text style={{ fontSize: 16 }}>{showPw ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>ROLE *</Text>
        <Dropdown
          items={roleOptions}
          value={roleId}
          onChange={setRoleId}
          placeholder="Select a role…"
          disabled={submitting}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>DEPARTMENT</Text>
        <Dropdown
          items={departmentOptions}
          value={departmentId}
          onChange={setDepartmentId}
          placeholder="Select a department…"
          disabled={submitting}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />

        <View style={styles.pageActions}>
          <TouchableOpacity
            onPress={onBack}
            disabled={submitting}
            style={[styles.pageBtn, {
              backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
              borderColor,
            }]}
          >
            <Text style={[styles.pageBtnText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              onSubmit({
                username: username.trim(),
                fullName: fullName.trim(),
                email: email.trim() || undefined,
                password,
                roleId,
                departmentId,
              })
            }
            disabled={submitting || !canSubmit}
            style={[styles.pageBtn, {
              backgroundColor: canSubmit ? '#0284C7' : '#94A3B8',
              borderColor: canSubmit ? '#0284C7' : '#94A3B8',
            }]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={[styles.pageBtnText, { color: '#FFFFFF' }]}>Create user</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ================================================================
// USER DETAIL PAGE
// ================================================================
// ================================================================
// USER DETAIL PAGE — only shows fields that actually exist
// ================================================================
function UserDetailPage({
  user, onBack, onSave, onToggleStatus, onResetPassword, submitting,
  roleOptions, departmentOptions, canMutate,
  darkMode, textColor, subTextColor, cardBg, borderColor,
}) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [roleId, setRoleId] = useState(user.roleId || null);
  const [departmentId, setDepartmentId] = useState(user.departmentId || null);

  useEffect(() => {
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setRoleId(user.roleId || null);
    setDepartmentId(user.departmentId || null);
  }, [user]);

  const dirty =
    fullName !== (user.fullName || '') ||
    email !== (user.email || '') ||
    roleId !== (user.roleId || null) ||
    departmentId !== (user.departmentId || null);

  const avatarUri = userService.getAvatarSource(user);
  const isActive = !!user.isActive;

  // Only render a meta row when the value is actually present
  const MetaRow = ({ label, value, isLast }) => {
    if (value == null || value === '' || value === '—') return null;
    return (
      <View
        style={[
          styles.metaRow,
          !isLast && {
            borderTopWidth: 1,
            borderTopColor: darkMode ? '#1E293B' : '#F1F5F9',
          },
        ]}
      >
        <Text style={[styles.metaKey, { color: subTextColor }]}>{label}</Text>
        <Text style={[styles.metaVal, { color: textColor }]}>{value}</Text>
      </View>
    );
  };

  // Build meta rows — null ones get filtered out
  const metaRows = [
    { label: 'Last login', value: fmtRelative(user.lastLogin) },
    {
      label: 'Created',
      value: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : null,
    },
    { label: 'User ID', value: user.userId ? `#${user.userId}` : null },
  ].filter((r) => r.value != null && r.value !== '' && r.value !== 'Never');

  // Build employee rows — only keep what exists
  const emp = user.employee || {};
  const employeeRows = [
    emp.employeeCode && { label: 'Code', value: emp.employeeCode },
    (emp.firstName || emp.lastName) && {
      label: 'Name',
      value: [emp.firstName, emp.middleName, emp.lastName]
        .filter(Boolean)
        .join(' '),
    },
    emp.employmentType && { label: 'Type', value: emp.employmentType },
    emp.employmentStatus && { label: 'Status', value: emp.employmentStatus },
    emp.phoneNumber && { label: 'Phone', value: emp.phoneNumber },
    emp.workEmail && { label: 'Work email', value: emp.workEmail },
    emp.personalEmail && { label: 'Personal email', value: emp.personalEmail },
    emp.gender && { label: 'Gender', value: emp.gender },
    emp.maritalStatus && { label: 'Marital status', value: emp.maritalStatus },
    emp.nationality && { label: 'Nationality', value: emp.nationality },
    emp.hireDateEC && { label: 'Hire date (EC)', value: emp.hireDateEC },
    emp.positionId && { label: 'Position ID', value: `#${emp.positionId}` },
  ].filter(Boolean);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.pageContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            onPress={onBack}
            disabled={submitting}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Text style={[styles.backBtnText, { color: textColor }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: textColor }]}>User</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* HERO */}
        <View style={styles.detailHero}>
          <Image source={{ uri: avatarUri }} style={styles.detailHeroAvatar} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.detailHeroName, { color: textColor }]} numberOfLines={1}>
              {user.fullName || user.username || 'User'}
            </Text>
            <Text style={[styles.detailHeroSub, { color: subTextColor }]} numberOfLines={1}>
              @{user.username || '—'}
              {user.role ? ` · ${userService.formatRole(user.role)}` : ''}
            </Text>
            <View
              style={[
                styles.detailHeroPill,
                {
                  backgroundColor: isActive
                    ? darkMode ? '#064E3B' : '#ECFDF5'
                    : darkMode ? '#7F1D1D' : '#FEE2E2',
                },
              ]}
            >
              <Text
                style={[
                  styles.detailHeroPillText,
                  {
                    color: isActive
                      ? darkMode ? '#6EE7B7' : '#047857'
                      : darkMode ? '#FCA5A5' : '#991B1B',
                  },
                ]}
              >
                {isActive ? '● Active' : '✕ Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        {canMutate ? (
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onToggleStatus}
              disabled={submitting}
              style={[
                styles.quickActionBtn,
                {
                  backgroundColor: isActive
                    ? darkMode ? '#7F1D1D' : '#FEE2E2'
                    : darkMode ? '#064E3B' : '#ECFDF5',
                  borderColor: isActive
                    ? darkMode ? '#991B1B' : '#FECACA'
                    : darkMode ? '#065F46' : '#BBF7D0',
                },
              ]}
            >
              <Text style={styles.quickActionIcon}>{isActive ? '⏻' : '↺'}</Text>
              <Text
                style={[
                  styles.quickActionText,
                  { color: isActive ? '#EF4444' : '#10B981' },
                ]}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onResetPassword}
              disabled={submitting}
              style={[
                styles.quickActionBtn,
                {
                  backgroundColor: darkMode ? '#422006' : '#FEF3C7',
                  borderColor: darkMode ? '#78350F' : '#FDE68A',
                },
              ]}
            >
              <Text style={styles.quickActionIcon}>🔑</Text>
              <Text style={[styles.quickActionText, { color: '#F59E0B' }]}>
                Reset PW
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ACCOUNT INFO — always shown (core editable fields) */}
        <Text style={[styles.sectionHeading, { color: subTextColor }]}>
          ACCOUNT INFORMATION
        </Text>

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>FULL NAME</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          editable={canMutate && !submitting}
          style={[
            styles.input,
            {
              color: textColor,
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor,
            },
          ]}
          placeholderTextColor={subTextColor}
          placeholder="—"
        />

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>EMAIL</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={canMutate && !submitting}
          style={[
            styles.input,
            {
              color: textColor,
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor,
            },
          ]}
          placeholderTextColor={subTextColor}
          placeholder="—"
        />

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>ROLE</Text>
        <Dropdown
          items={roleOptions}
          value={roleId}
          onChange={setRoleId}
          placeholder="—"
          disabled={!canMutate || submitting}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />

        <Text style={[styles.fieldLabel, { color: subTextColor }]}>DEPARTMENT</Text>
        <Dropdown
          items={departmentOptions}
          value={departmentId}
          onChange={setDepartmentId}
          placeholder="—"
          disabled={!canMutate || submitting}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />

        {/* EMPLOYEE — only if the backend sent employee rows */}
        {employeeRows.length > 0 ? (
          <>
            <Text style={[styles.sectionHeading, { color: subTextColor }]}>
              EMPLOYEE
            </Text>
            <View
              style={[
                styles.metaCard,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              {employeeRows.map((row, i) => (
                <MetaRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={i === employeeRows.length - 1}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* ACTIVITY — only if there is something to show */}
        {metaRows.length > 0 ? (
          <>
            <Text style={[styles.sectionHeading, { color: subTextColor }]}>
              ACTIVITY
            </Text>
            <View
              style={[
                styles.metaCard,
                { backgroundColor: cardBg, borderColor },
              ]}
            >
              {metaRows.map((row, i) => (
                <MetaRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  isLast={i === metaRows.length - 1}
                />
              ))}
            </View>
          </>
        ) : null}

        {/* SAVE */}
        {canMutate ? (
          <View style={styles.pageActions}>
            <TouchableOpacity
              onPress={onBack}
              disabled={submitting}
              style={[
                styles.pageBtn,
                {
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                  borderColor,
                },
              ]}
            >
              <Text style={[styles.pageBtnText, { color: textColor }]}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSave({ fullName, email, roleId, departmentId })}
              disabled={submitting || !dirty}
              style={[
                styles.pageBtn,
                {
                  backgroundColor: dirty ? '#0284C7' : '#94A3B8',
                  borderColor: dirty ? '#0284C7' : '#94A3B8',
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={[styles.pageBtnText, { color: '#FFFFFF' }]}>
                  Save changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ================================================================
// RESET PASSWORD MODAL
// ================================================================
function ResetPasswordModal({
  target, value, onChange, showPw, setShowPw,
  onClose, onSubmit, submitting, onDone, onCopy,
  darkMode, textColor, subTextColor, cardBg, borderColor,
}) {
  if (!target) return null;
  const isSuccessView = target.__success;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centerBackdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFillObject}
          onPress={() => !submitting && onClose()}
        />

        <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
          {isSuccessView ? (
            <>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                ✅ Password reset
              </Text>
              <Text style={[styles.modalSub, { color: subTextColor }]}>
                Share these credentials with {target.fullName || target.username}.
                The password won't be shown again.
              </Text>

              <View style={[styles.credBox, {
                backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                borderColor,
              }]}>
                <View style={styles.credRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.credLabel, { color: subTextColor }]}>USERNAME</Text>
                    <Text style={[styles.credValue, { color: textColor }]} numberOfLines={1}>
                      {target.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onCopy(target.username)}
                    style={styles.copyBtn}
                  >
                    <Text style={styles.copyBtnText}>Copy</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.credRow, { borderTopWidth: 1, borderTopColor: darkMode ? '#1E293B' : '#F1F5F9' }]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.credLabel, { color: subTextColor }]}>NEW PASSWORD</Text>
                    <Text style={[styles.credValue, { color: textColor }]} numberOfLines={1}>
                      {target.__newPassword}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onCopy(target.__newPassword)}
                    style={styles.copyBtn}
                  >
                    <Text style={styles.copyBtnText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => onCopy(`${target.username} / ${target.__newPassword}`)}
                  style={[styles.modalBtn, {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                    borderColor,
                  }]}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Copy both</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDone}
                  style={[styles.modalBtn, { backgroundColor: '#0284C7', borderColor: '#0284C7' }]}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Reset password
              </Text>
              <Text style={[styles.modalSub, { color: subTextColor }]}>
                Set a new password for {target.fullName || target.username}.
              </Text>

              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabelInline, { color: subTextColor }]}>NEW PASSWORD</Text>
                <TouchableOpacity
                  onPress={() => { onChange(generatePassword()); setShowPw(true); }}
                  hitSlop={6}
                >
                  <Text style={styles.generateLink}>Generate</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputWithButton, {
                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                borderColor,
              }]}>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="At least 6 characters"
                  placeholderTextColor={subTextColor}
                  secureTextEntry={!showPw}
                  editable={!submitting}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.inputInline, { color: textColor }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPw((v) => !v)}
                  hitSlop={8}
                  style={styles.eyeInline}
                >
                  <Text style={{ fontSize: 16 }}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={submitting}
                  style={[styles.modalBtn, {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                    borderColor,
                  }]}
                >
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={submitting}
                  style={[styles.modalBtn, { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Reset</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ================================================================
// CREDENTIALS MODAL
// ================================================================
function CredentialsModal({
  visible, credentials, onClose,
  darkMode, textColor, subTextColor, cardBg, borderColor,
}) {
  if (!credentials) return null;

  const handleCopy = (text) => {
    try { Clipboard.setString(text); } catch (e) {}
    Alert.alert('Copied', 'Copied to clipboard.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centerBackdrop}>
        <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.modalTitle, { color: textColor }]}>
            ✅ User created
          </Text>
          <Text style={[styles.modalSub, { color: subTextColor }]}>
            Share these credentials with the user. The password won't be shown again.
          </Text>

          <View style={[styles.credBox, {
            backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
            borderColor,
          }]}>
            <View style={styles.credRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.credLabel, { color: subTextColor }]}>USERNAME</Text>
                <Text style={[styles.credValue, { color: textColor }]} numberOfLines={1}>
                  {credentials.username}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCopy(credentials.username)}
                style={styles.copyBtn}
              >
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.credRow, { borderTopWidth: 1, borderTopColor: darkMode ? '#1E293B' : '#F1F5F9' }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.credLabel, { color: subTextColor }]}>PASSWORD</Text>
                <Text style={[styles.credValue, { color: textColor }]} numberOfLines={1}>
                  {credentials.password}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCopy(credentials.password)}
                style={styles.copyBtn}
              >
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={() => handleCopy(`${credentials.username} / ${credentials.password}`)}
              style={[styles.modalBtn, {
                backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                borderColor,
              }]}
            >
              <Text style={[styles.modalBtnText, { color: textColor }]}>Copy both</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalBtn, { backgroundColor: '#0284C7', borderColor: '#0284C7' }]}
            >
              <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0284C7',
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
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 10,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  swipeWrap: { marginBottom: 10, borderRadius: 14, overflow: 'hidden' },
  swipeActionsWrap: { flexDirection: 'row', alignItems: 'stretch', height: '100%' },
  swipeBtn: { justifyContent: 'center', alignItems: 'center', height: '100%', gap: 4 },
  swipeBtnIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  swipeBtnLabel: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  userName: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.2 },
  username: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  metaBlock: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1 },
  metaText: { fontSize: 11.5, fontWeight: '500', lineHeight: 17 },

  footerLoader: { paddingVertical: 18, alignItems: 'center' },
  footerText: { paddingVertical: 16, textAlign: 'center', fontSize: 11.5, fontWeight: '600' },

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

  pageContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 40,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 8,
    minWidth: 60,
  },
  backBtnText: { fontSize: 15, fontWeight: '800' },
  pageTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  pageSub: { fontSize: 12.5, fontWeight: '600', marginBottom: 8 },

  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 14,
  },
  fieldLabelInline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  generateLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.2,
    paddingBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '500',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingRight: 4,
  },
  inputInline: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '500',
  },
  eyeInline: { paddingHorizontal: 10, paddingVertical: 8 },

  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 2,
  },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: { fontSize: 14, fontWeight: '600', flex: 1 },
  dropdownChevron: { fontSize: 11, fontWeight: '800', marginLeft: 8 },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  dropdownItemText: { fontSize: 13.5, fontWeight: '700' },
  dropdownItemSub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  dropdownEmpty: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 12.5,
    fontWeight: '600',
  },

  detailHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  detailHeroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
  },
  detailHeroName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  detailHeroSub: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  detailHeroPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailHeroPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },

  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
  },
  quickActionIcon: { fontSize: 15 },
  quickActionText: { fontSize: 12.5, fontWeight: '800' },

  employeeBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  employeeText: { fontSize: 12.5, fontWeight: '600' },

  metaCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  metaKey: { fontSize: 12.5, fontWeight: '700' },
  metaVal: { fontSize: 12.5, fontWeight: '800' },

  pageActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  pageBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pageBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },

  centerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
  },
  centerModal: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3, marginBottom: 4 },
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

  credBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 14,
    overflow: 'hidden',
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  credLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  credValue: { fontSize: 14.5, fontWeight: '800', letterSpacing: 0.3 },
  copyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  copyBtnText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' },
});