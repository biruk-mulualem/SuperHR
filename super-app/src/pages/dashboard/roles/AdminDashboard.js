// super-app/src/pages/admin/AdminDashboard.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Switch,
} from 'react-native';

// ================================================================
// DEMO DATA — swap for real fetch later
// ================================================================
const DEMO_DATA = {
  stats: {
    users: 1284,               usersDelta: +37,
    departments: 12,           departmentsDelta: 0,
    roles: 8,                  rolesDelta: 0,

    categories: 24,            categoriesDelta: +2,
    uoms: 9,                   uomsDelta: 0,
    items: 3402,               itemsDelta: +48,

    stores: 6,                 storesDelta: 0,
    storeGroups: 3,            storeGroupsDelta: 0,
    balances: 18742,           balancesDelta: +214,
    convertedBalances: 428,    convertedBalancesDelta: +12,
    convertedBalanceAudits: 1893, convertedBalanceAuditsDelta: +31,

    pendingRequests: 27,       pendingRequestsDelta: +6,

    storeCleanup: 4,           storeCleanupDelta: -2,

    pendingPosts: 14,          pendingDelta: +5,
    unreadNotifications: 328,  unreadDelta: -12,

    // device stats
    devices: 42,               devicesDelta: +3,
    pendingDevices: 5,         pendingDevicesDelta: +2,
    approvedDevices: 36,       approvedDevicesDelta: +1,
    blockedDevices: 1,         blockedDevicesDelta: 0,
  },
  week: {
    newUsers: 37,
    newItems: 48,
    newPosts: 118,
    approvals: 96,
    declines: 9,
  },
  settings: {
    maintenanceMode: false,
    pushEnabled: true,
    requirePostApproval: true,
  },
};

// ================================================================
// Helpers
// ================================================================
const fmtNumber = (n) => {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const fmtDate = () => {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
};

// ================================================================
// COMPONENT
// ================================================================
export default function AdminDashboard({
  textColor,
  subTextColor,
  cardBg,
  borderColor,
  setActiveTab,
  darkMode,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [data, setData]             = useState(DEMO_DATA);
  const [settings, setSettings]     = useState(DEMO_DATA.settings);

  // ------------------------------------------------------------
  // DEMO loader — swap for real fetch later
  // ------------------------------------------------------------
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      setData(DEMO_DATA);
      setSettings(DEMO_DATA.settings);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ------------------------------------------------------------
  // Derived sections
  // ------------------------------------------------------------
  const { stats, week } = data;

  const peopleSection = useMemo(() => ([
    { key: 'users',       label: 'Users',       value: stats.users,       delta: stats.usersDelta,       emoji: '👥', target: 'users' },
    { key: 'departments', label: 'Departments', value: stats.departments, delta: stats.departmentsDelta, emoji: '🏢', target: 'departments' },
    { key: 'roles',       label: 'Roles',       value: stats.roles,       delta: stats.rolesDelta,       emoji: '🔐', target: 'roles' },
  ]), [stats]);

  // All three device rows navigate to the same 'devices' tab
  const securitySection = useMemo(() => ([
    { key: 'devices',         label: 'Registered Devices', value: stats.devices,        delta: stats.devicesDelta,         emoji: '📱', target: 'devices' },
    { key: 'devices-pending', label: 'Pending Approval',   value: stats.pendingDevices, delta: stats.pendingDevicesDelta,  emoji: '⏳', target: 'devices' },
    { key: 'devices-blocked', label: 'Blocked Devices',    value: stats.blockedDevices, delta: stats.blockedDevicesDelta,  emoji: '🚫', target: 'devices' },
  ]), [stats]);

  const catalogSection = useMemo(() => ([
    { key: 'categories', label: 'Categories', value: stats.categories, delta: stats.categoriesDelta, emoji: '🏷️', target: 'categories' },
    { key: 'uoms',       label: 'UOMs',       value: stats.uoms,       delta: stats.uomsDelta,       emoji: '📏', target: 'uoms' },
    { key: 'items',      label: 'Items',      value: stats.items,      delta: stats.itemsDelta,      emoji: '📦', target: 'items' },
  ]), [stats]);

  const inventorySection = useMemo(() => ([
    { key: 'stores',            label: 'Stores',                  value: stats.stores,                 delta: stats.storesDelta,                 emoji: '🏬', target: 'stores' },
    { key: 'store-groups',      label: 'Store Groups',            value: stats.storeGroups,            delta: stats.storeGroupsDelta,            emoji: '🗂️', target: 'store-groups' },
    { key: 'balances',          label: 'Balances',                value: stats.balances,               delta: stats.balancesDelta,               emoji: '⚖️', target: 'balances' },
    { key: 'converted-balance', label: 'Converted Balance',       value: stats.convertedBalances,      delta: stats.convertedBalancesDelta,      emoji: '🔄', target: 'converted-balance' },
    { key: 'converted-audit',   label: 'Converted Balance Audit', value: stats.convertedBalanceAudits, delta: stats.convertedBalanceAuditsDelta, emoji: '🧾', target: 'converted-audit' },
  ]), [stats]);

  const requestsSection = useMemo(() => ([
    { key: 'pending-requests', label: 'Pending Requests', value: stats.pendingRequests, delta: stats.pendingRequestsDelta, emoji: '📥', target: 'requests' },
  ]), [stats]);

  const maintenanceSection = useMemo(() => ([
    { key: 'store-cleanup', label: 'Store Cleanup', value: stats.storeCleanup, delta: stats.storeCleanupDelta, emoji: '🧹', target: 'cleanup' },
  ]), [stats]);

  const weekStats = useMemo(() => ([
    { label: 'Users',    value: week.newUsers,  tint: '#3B82F6' },
    { label: 'Items',    value: week.newItems,  tint: '#10B981' },
    { label: 'Posts',    value: week.newPosts,  tint: '#8B5CF6' },
    { label: 'Approved', value: week.approvals, tint: '#10B981' },
    { label: 'Declined', value: week.declines,  tint: '#EF4444' },
  ]), [week]);

  const hasPending        = stats.pendingPosts > 0;
  const hasPendingDevices = stats.pendingDevices > 0;

  // ------------------------------------------------------------
  // Renderers
  // ------------------------------------------------------------
  const renderDelta = (delta) => {
    if (delta == null || delta === 0) return null;
    const positive = delta > 0;
    return (
      <Text style={[styles.delta, { color: positive ? '#10B981' : '#EF4444' }]}>
        {positive ? '+' : '−'}{Math.abs(delta)}
      </Text>
    );
  };

  const renderRow = (row, isLast) => (
    <TouchableOpacity
      key={row.key}
      activeOpacity={0.6}
      onPress={() => setActiveTab?.(row.target || row.key)}
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: darkMode ? '#1E293B' : '#F1F5F9',
        },
      ]}
    >
      <Text style={styles.rowEmoji}>{row.emoji}</Text>
      <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
        {row.label}
      </Text>
      <Text style={[styles.rowValue, { color: subTextColor }]}>
        {fmtNumber(row.value)}
      </Text>
      {renderDelta(row.delta)}
      <Text style={[styles.rowChevron, { color: subTextColor }]}>›</Text>
    </TouchableOpacity>
  );

  const renderSection = (title, rows) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: subTextColor }]}>
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {rows.map((r, i) => renderRow(r, i === rows.length - 1))}
      </View>
    </View>
  );

  const renderToggle = (label, key, emoji, isLast) => (
    <View
      key={key}
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: darkMode ? '#1E293B' : '#F1F5F9',
        },
      ]}
    >
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
      <Switch
        value={!!settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{
          false: darkMode ? '#334155' : '#E2E8F0',
          true: '#10B981',
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={darkMode ? '#334155' : '#E2E8F0'}
      />
    </View>
  );

  const renderSettingsLink = (emoji, label, isLast) => (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => setActiveTab?.('settings')}
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: darkMode ? '#1E293B' : '#F1F5F9',
        },
      ]}
    >
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.rowChevron, { color: subTextColor }]}>›</Text>
    </TouchableOpacity>
  );

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={subTextColor}
        />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Admin</Text>
          <Text style={[styles.headerSub, { color: subTextColor }]}>
            {fmtDate()}
          </Text>
        </View>
        {loading && <ActivityIndicator color={subTextColor} size="small" />}
      </View>

      {/* MODERATION BANNER */}
      {hasPending && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab?.('moderation')}
          style={[
            styles.banner,
            {
              backgroundColor: darkMode ? '#422006' : '#FEF3C7',
              borderColor: darkMode ? '#78350F' : '#FDE68A',
            },
          ]}
        >
          <Text style={styles.bannerEmoji}>🛡️</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.bannerTitle, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
              {stats.pendingPosts} post{stats.pendingPosts === 1 ? '' : 's'} pending
            </Text>
            <Text style={[styles.bannerSub, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
              Tap to open the moderation queue
            </Text>
          </View>
          <Text style={[styles.bannerArrow, { color: darkMode ? '#FCD34D' : '#92400E' }]}>›</Text>
        </TouchableOpacity>
      )}

      {/* PENDING DEVICES BANNER */}
      {hasPendingDevices && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab?.('devices')}
          style={[
            styles.banner,
            {
              backgroundColor: darkMode ? '#1E3A8A' : '#DBEAFE',
              borderColor: darkMode ? '#1E40AF' : '#93C5FD',
            },
          ]}
        >
          <Text style={styles.bannerEmoji}>📱</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.bannerTitle, { color: darkMode ? '#BFDBFE' : '#1E40AF' }]}>
              {stats.pendingDevices} device{stats.pendingDevices === 1 ? '' : 's'} awaiting approval
            </Text>
            <Text style={[styles.bannerSub, { color: darkMode ? '#BFDBFE' : '#1E40AF' }]}>
              Tap to review and approve
            </Text>
          </View>
          <Text style={[styles.bannerArrow, { color: darkMode ? '#BFDBFE' : '#1E40AF' }]}>›</Text>
        </TouchableOpacity>
      )}

      {/* SECTIONS */}
      {renderSection('People & Access',    peopleSection)}
      {renderSection('Security & Devices', securitySection)}
      {renderSection('Catalog',            catalogSection)}
      {renderSection('Inventory',          inventorySection)}
      {renderSection('Requests',           requestsSection)}
      {renderSection('Maintenance',        maintenanceSection)}

      {/* THIS WEEK */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: subTextColor }]}>
          This Week
        </Text>
        <View style={[styles.card, styles.weekCard, { backgroundColor: cardBg, borderColor }]}>
          {weekStats.map((s, i) => (
            <View
              key={s.label}
              style={[
                styles.weekStat,
                i < weekStats.length - 1 && {
                  borderRightWidth: 1,
                  borderRightColor: darkMode ? '#1E293B' : '#F1F5F9',
                },
              ]}
            >
              <Text style={[styles.weekValue, { color: s.tint }]}>
                {fmtNumber(s.value)}
              </Text>
              <Text style={[styles.weekLabel, { color: subTextColor }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* NOTIFICATIONS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: subTextColor }]}>
          Notifications
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setActiveTab?.('notifications')}
            style={[
              styles.row,
              { borderBottomWidth: 1, borderBottomColor: darkMode ? '#1E293B' : '#F1F5F9' },
            ]}
          >
            <Text style={styles.rowEmoji}>🔔</Text>
            <Text style={[styles.rowLabel, { color: textColor }]}>Unread</Text>
            <Text style={[styles.rowValue, { color: subTextColor }]}>
              {fmtNumber(stats.unreadNotifications)}
            </Text>
            {renderDelta(stats.unreadDelta)}
            <Text style={[styles.rowChevron, { color: subTextColor }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setActiveTab?.('broadcast')}
            style={styles.row}
          >
            <Text style={styles.rowEmoji}>📢</Text>
            <Text style={[styles.rowLabel, { color: textColor }]}>Broadcast</Text>
            <Text style={[styles.rowValue, { color: subTextColor }]}>Send</Text>
            <Text style={[styles.rowChevron, { color: subTextColor }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SYSTEM SETTINGS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: subTextColor }]}>
          System Settings
        </Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {renderToggle('Maintenance mode',      'maintenanceMode',     '🚧', false)}
          {renderToggle('Push notifications',    'pushEnabled',         '📣', false)}
          {renderToggle('Require post approval', 'requirePostApproval', '🛡️', false)}
          {renderSettingsLink('⚙️', 'All settings', true)}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  headerSub: { fontSize: 12.5, fontWeight: '500', marginTop: 2 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerEmoji: { fontSize: 22 },
  bannerTitle: { fontSize: 14.5, fontWeight: '900', letterSpacing: -0.2 },
  bannerSub: { fontSize: 11.5, fontWeight: '600', marginTop: 2, opacity: 0.85 },
  bannerArrow: { fontSize: 24, fontWeight: '300' },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowEmoji: { fontSize: 18, width: 22, textAlign: 'center' },
  rowLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowChevron: {
    fontSize: 22,
    fontWeight: '300',
    marginLeft: -2,
    opacity: 0.6,
  },
  delta: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginLeft: 6,
  },

  weekCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  weekValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  weekLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});