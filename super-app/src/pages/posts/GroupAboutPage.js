// super-app/src/pages/posts/GroupAboutPage.js
import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from 'react-native';

// ================================================================
// Helpers
// ================================================================
const fmtTimeAgo = (ts) => {
  if (!ts) return '—';
  const t = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  if (!t || Number.isNaN(t)) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const initialsFromName = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ================================================================
// GROUP ABOUT PAGE
// ================================================================
export default function GroupAboutPage({
  group,
  members = [],
  postsCount = 0,
  pendingPosts = 0,
  currentUserId,
  canManage = false,
  onBack,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  // ----------------------------------------------------------------
  // Hardware back
  // ----------------------------------------------------------------
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack?.();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  // ----------------------------------------------------------------
  // Derived
  // ----------------------------------------------------------------
  const pendingInvites = useMemo(
    () => members.filter((m) => m.status === 'pending'),
    [members]
  );

  const owner = useMemo(
    () => members.find((m) => Number(m.userId) === Number(group?.createdBy)) || null,
    [members, group?.createdBy]
  );

  const me = useMemo(
    () => members.find((m) => Number(m.userId) === Number(currentUserId)) || null,
    [members, currentUserId]
  );

  const isOwner = !!(me && Number(group?.createdBy) === Number(me.userId));

  const myRoleLabel = useMemo(() => {
    if (!me) return 'Not a member';
    if (isOwner) return 'Owner';
    if (canManage) return 'Manager';
    return 'Member';
  }, [me, isOwner, canManage]);

  const memberBreakdown = useMemo(() => {
    const active = members.filter((m) => m.status === 'active').length;
    const pending = members.filter((m) => m.status === 'pending').length;
    return { active, pending, total: members.length };
  }, [members]);

  // ----------------------------------------------------------------
  // Created timestamp
  // ----------------------------------------------------------------
  const createdAtLabel = useMemo(() => {
    if (!group?.createdAt) return '—';
    return fmtDate(group.createdAt);
  }, [group?.createdAt]);

  const createdAgoLabel = useMemo(() => {
    if (!group?.createdAt) return '';
    return fmtTimeAgo(group.createdAt);
  }, [group?.createdAt]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
            About
          </Text>
          <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
            {group?.name || 'Group'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---- Description ---- */}
        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>DESCRIPTION</Text>
          <Text style={[styles.infoValue, { color: textColor }]}>
            {group?.description || 'No description'}
          </Text>
        </View>

        {/* ---- Owner card ---- */}
        {owner && (
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>GROUP OWNER</Text>
            <View style={styles.ownerRow}>
              <View style={[styles.ownerAvatar, { backgroundColor: owner.color || '#8B5CF6' }]}>
                <Text style={styles.ownerAvatarText}>
                  {owner.initials || initialsFromName(owner.name)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.ownerName, { color: textColor }]} numberOfLines={1}>
                  {owner.name}
                  {Number(owner.userId) === Number(currentUserId) ? ' (you)' : ''}
                </Text>
                <Text style={[styles.ownerDept, { color: subTextColor }]} numberOfLines={1}>
                  {owner.department || 'Group owner'}
                </Text>
              </View>
              <View style={[styles.rolePill, {
                backgroundColor: darkMode ? '#312E81' : '#EEF2FF',
              }]}>
                <Text style={[styles.rolePillText, {
                  color: darkMode ? '#C7D2FE' : '#4338CA',
                }]}>
                  OWNER
                </Text>
              </View>
            </View>

            <View style={[styles.ownerDivider, { backgroundColor: borderColor }]} />
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: subTextColor }]}>Created group on</Text>
              <Text style={[styles.metaValue, { color: textColor }]}>
                {createdAtLabel}
              </Text>
            </View>
            {createdAgoLabel ? (
              <Text style={[styles.createdAgo, { color: subTextColor }]}>
                {createdAgoLabel}
              </Text>
            ) : null}
          </View>
        )}

        {/* ---- Your role in this group ---- */}
        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>YOUR ROLE</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: subTextColor }]}>Access</Text>
            <Text style={[styles.metaValue, {
              color: canManage ? (darkMode ? '#6EE7B7' : '#047857') : textColor,
            }]}>
              {myRoleLabel}
            </Text>
          </View>
          {me && (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: subTextColor }]}>Can manage members</Text>
              <Text style={[styles.metaValue, {
                color: canManage
                  ? (darkMode ? '#6EE7B7' : '#047857')
                  : (darkMode ? '#94A3B8' : '#64748B'),
              }]}>
                {canManage ? 'Yes' : 'No'}
              </Text>
            </View>
          )}
        </View>

        {/* ---- Stats ---- */}
        <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{postsCount}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Posts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{members.length}</Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Members</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: pendingPosts > 0 ? '#F59E0B' : '#94A3B8' }]}>
              {pendingPosts}
            </Text>
            <Text style={[styles.statLabel, { color: subTextColor }]}>Awaiting</Text>
          </View>
        </View>

        {/* ---- Membership breakdown ---- */}
        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>MEMBERSHIP BREAKDOWN</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCell}>
              <Text style={[styles.breakdownValue, { color: textColor }]}>
                {memberBreakdown.active}
              </Text>
              <Text style={[styles.breakdownLabel, { color: subTextColor }]}>Active</Text>
            </View>
            <View style={[styles.breakdownDivider, { backgroundColor: borderColor }]} />
            <View style={styles.breakdownCell}>
              <Text style={[styles.breakdownValue, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                {memberBreakdown.pending}
              </Text>
              <Text style={[styles.breakdownLabel, { color: subTextColor }]}>Pending</Text>
            </View>
            <View style={[styles.breakdownDivider, { backgroundColor: borderColor }]} />
            <View style={styles.breakdownCell}>
              <Text style={[styles.breakdownValue, { color: textColor }]}>
                {memberBreakdown.total}
              </Text>
              <Text style={[styles.breakdownLabel, { color: subTextColor }]}>Total</Text>
            </View>
          </View>
        </View>

        {/* ---- Pending invitees ---- */}
        {pendingInvites.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.infoLabel, { color: subTextColor }]}>AWAITING RESPONSE</Text>
            {pendingInvites.slice(0, 5).map((m) => (
              <View key={m.userId} style={styles.pendingRow}>
                <View style={[styles.smallAvatar, { backgroundColor: m.color || '#8B5CF6' }]}>
                  <Text style={styles.smallAvatarText}>
                    {m.initials || initialsFromName(m.name)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.pendingName, { color: textColor }]} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={[styles.pendingDept, { color: subTextColor }]} numberOfLines={1}>
                    {m.department || 'Member'}
                  </Text>
                </View>
                <View style={[styles.pendingPill, {
                  backgroundColor: darkMode ? '#422006' : '#FEF3C7',
                }]}>
                  <Text style={[styles.pendingPillText, {
                    color: darkMode ? '#FCD34D' : '#92400E',
                  }]}>
                    ⏳
                  </Text>
                </View>
              </View>
            ))}
            {pendingInvites.length > 5 && (
              <Text style={[styles.morePending, { color: subTextColor }]}>
                +{pendingInvites.length - 5} more
              </Text>
            )}
          </View>
        )}

        {/* ---- Metadata ---- */}
        <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: subTextColor }]}>Status</Text>
            <View style={[styles.statusPill, {
              backgroundColor: group?.status === 'inactive'
                ? (darkMode ? '#422006' : '#FEF3C7')
                : (darkMode ? '#064E3B' : '#ECFDF5'),
            }]}>
              <Text style={[styles.statusPillText, {
                color: group?.status === 'inactive'
                  ? (darkMode ? '#FCD34D' : '#92400E')
                  : (darkMode ? '#6EE7B7' : '#047857'),
              }]}>
                {group?.status === 'inactive' ? '⏸ Inactive' : '● Active'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: subTextColor }]}>Group ID</Text>
            <Text style={[styles.metaValue, { color: textColor }]}>
              {group?.id ?? '—'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: subTextColor }]}>Created</Text>
            <Text style={[styles.metaValue, { color: textColor }]}>
              {createdAtLabel}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: subTextColor }]}>Posts awaiting approval</Text>
            <Text style={[styles.metaValue, {
              color: pendingPosts > 0 ? (darkMode ? '#FCD34D' : '#92400E') : textColor,
            }]}>
              {pendingPosts}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: subTextColor }]}>Last activity</Text>
            <Text style={[styles.metaValue, { color: textColor }]}>
              {fmtTimeAgo(group?.lastActivity)}
            </Text>
          </View>
        </View>
      </ScrollView>
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

  content: { paddingHorizontal: 16, paddingBottom: 100 },

  /* Cards */
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  infoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },
  infoValue: { fontSize: 13.5, fontWeight: '500', lineHeight: 20 },

  /* Owner card */
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerAvatar: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ownerAvatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  ownerName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  ownerDept: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },
  ownerDivider: { height: 1, marginTop: 14, marginBottom: 2, opacity: 0.6 },
  createdAgo: { fontSize: 11.5, fontWeight: '500', marginTop: 2, textAlign: 'right' },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rolePillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  /* Stats */
  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  statLabel: {
    fontSize: 10.5, fontWeight: '700', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  statDivider: { width: 1, height: 36, opacity: 0.6 },

  /* Breakdown */
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  breakdownCell: { flex: 1, alignItems: 'center' },
  breakdownValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  breakdownLabel: { fontSize: 10.5, fontWeight: '700', marginTop: 2, letterSpacing: 0.3 },
  breakdownDivider: { width: 1, height: 28, opacity: 0.6 },

  /* Pending invitees */
  pendingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, gap: 10,
  },
  smallAvatar: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  smallAvatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  pendingName: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
  pendingDept: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  pendingPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pendingPillText: { fontSize: 11, fontWeight: '900' },
  morePending: { fontSize: 11.5, fontWeight: '600', textAlign: 'right', marginTop: 6 },

  /* Metadata */
  metaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metaLabel: { fontSize: 13, fontWeight: '600' },
  metaValue: { fontSize: 13.5, fontWeight: '800' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: {
    fontSize: 10, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase',
  },
});