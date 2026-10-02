// src/router/notificationRoutes.js
export const NOTIFICATION_ROUTES = {
  // ── Posts: group-level ──
  'posts.member_accepted':       { tab: 'posts', intent: 'group', params: (n) => ({ groupId: n.metadata?.groupId ?? n.referenceId }) },
  'posts.member_declined':       { tab: 'posts', intent: 'group', params: (n) => ({ groupId: n.metadata?.groupId ?? n.referenceId }) },
  'posts.member_removed':        { tab: 'posts', intent: 'group', params: (n) => ({ groupId: n.metadata?.groupId ?? n.referenceId }) },
  'posts.group_deactivated':     { tab: 'posts', intent: 'group', params: (n) => ({ groupId: n.metadata?.groupId ?? n.referenceId }) },
  'posts.ownership_transferred': { tab: 'posts', intent: 'group', params: (n) => ({ groupId: n.metadata?.groupId ?? n.referenceId }) },

  // ── Posts: post-level ──
  'posts.post_submitted': { tab: 'posts', intent: 'post', params: (n) => ({ groupId: n.metadata?.groupId ?? null, postId: n.referenceId ?? null }) },
  'posts.post_approved':  { tab: 'posts', intent: 'post', params: (n) => ({ groupId: n.metadata?.groupId ?? null, postId: n.referenceId ?? null }) },
  'posts.post_declined':  { tab: 'posts', intent: 'post', params: (n) => ({ groupId: n.metadata?.groupId ?? null, postId: n.referenceId ?? null }) },
  'posts.post_comment':   { tab: 'posts', intent: 'post', params: (n) => ({ groupId: n.metadata?.groupId ?? null, postId: n.referenceId ?? null }) },
  'posts.image_signed':   { tab: 'posts', intent: 'post', params: (n) => ({ groupId: n.metadata?.groupId ?? null, postId: n.referenceId ?? null }) },

  // ── Purchase ──
  dispatch:         { tab: 'purchase', intent: 'request',   params: (n) => ({ id: n.referenceId }) },
  dispatch_boss:    { tab: 'purchase', intent: 'request',   params: (n) => ({ id: n.referenceId }) },
  approval_request: { tab: 'purchase', intent: 'request',   params: (n) => ({ id: n.referenceId }) },
  price_submitted:  { tab: 'purchase', intent: 'request',   params: (n) => ({ id: n.referenceId }) },
  winner_selected:  { tab: 'purchase', intent: 'submitted', params: (n) => ({ id: n.referenceId }) },
  request_approved: { tab: 'purchase', intent: 'submitted', params: (n) => ({ id: n.referenceId }) },
  request_declined: { tab: 'purchase', intent: 'submitted', params: (n) => ({ id: n.referenceId }) },

  // ── ✅ Store / Inventory ──
  // Stock alert summary → Items page with the "Triggered" filter active
  stock_alert: {
    tab: 'managerDashboard',
    subView: 'inventory',        // ← matches the `case 'inventory'` in index.js
    intent: 'item-list',
    params: () => ({ status: 'triggered' }),
  },

  // ── No-op ──
  'posts.member_invited': null,
  request_deleted: null,
};

export function resolveNotificationRoute(notification) {
  const entry = NOTIFICATION_ROUTES[notification?.type];
  if (!entry) return null;

  return {
    tab: entry.tab,
    subView: entry.subView ?? null,          // ✅ pass through (null when missing)
    intent: entry.intent,
    params: entry.params ? entry.params(notification) : {},
  };
}