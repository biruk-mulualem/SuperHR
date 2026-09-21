// services/pushService.js
'use strict';

const { Expo } = require('expo-server-sdk');
const db = require('../models');
const { User } = db;

// ------------------------------------------------------------------
// Single Expo client instance — reused across calls
// ------------------------------------------------------------------
const expo = new Expo();

/**
 * Kill switch — controlled by the PUSH_ENABLED env flag.
 *
 *   PUSH_ENABLED=true   → pushes are sent
 *   PUSH_ENABLED unset  → pushes are skipped silently
 *
 * This lets us merge everything into main safely: the code exists,
 * but stays dormant until we explicitly turn it on.
 */
const isPushEnabled = () => process.env.PUSH_ENABLED === 'true';

// ------------------------------------------------------------------
// SEND TO ONE USER
// ------------------------------------------------------------------
/**
 * Send a push notification to a single user.
 * Silently no-ops if:
 *   - push is disabled
 *   - the user has no push token
 *   - the token is malformed
 *   - Expo's API rejects the request
 *
 * @param {number} userId
 * @param {object} payload
 * @param {string} payload.title
 * @param {string} payload.body
 * @param {object} [payload.data]
 * @returns {Promise<object|null>}  Expo ticket or null
 */
async function sendPushToUser(userId, { title, body, data = {} } = {}) {
  if (!isPushEnabled()) {
    return null; // 🚫 kill switch
  }

  if (!userId || !title) {
    console.warn('⚠️ sendPushToUser: missing userId or title');
    return null;
  }

  try {
    const user = await User.findByPk(userId, {
      attributes: ['userId', 'expoPushToken'],
    });

    if (!user || !user.expoPushToken) {
      return null; // no token — user never registered
    }

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      console.warn(
        `⚠️ Invalid Expo push token for user ${userId}: ${user.expoPushToken}`
      );
      return null;
    }

    const messages = [
      {
        to: user.expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
      },
    ];

    const tickets = await expo.sendPushNotificationsAsync(messages);
    return tickets[0] || null;
  } catch (err) {
    console.error('❌ sendPushToUser error:', err.message);
    return null; // never re-throw — push is best-effort
  }
}

// ------------------------------------------------------------------
// SEND TO MANY USERS
// ------------------------------------------------------------------
/**
 * Send the same push notification to many users in one batch.
 * Batches automatically — Expo accepts up to 100 per request.
 *
 * Silently no-ops if push is disabled or no user has a token.
 *
 * @param {number[]} userIds
 * @param {object} payload  { title, body, data }
 * @returns {Promise<object[]>}  Expo tickets (one per valid token)
 */
async function sendPushToUsers(userIds, { title, body, data = {} } = {}) {
  if (!isPushEnabled()) {
    return [];
  }

  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
  if (uniqueIds.length === 0 || !title) {
    return [];
  }

  try {
    const users = await User.findAll({
      where: { userId: uniqueIds },
      attributes: ['userId', 'expoPushToken'],
    });

    const messages = users
      .filter(
        (u) =>
          u.expoPushToken && Expo.isExpoPushToken(u.expoPushToken)
      )
      .map((u) => ({
        to: u.expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId: 'default',
      }));

    if (messages.length === 0) {
      return [];
    }

    // Expo allows chunks of up to 100 messages
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      } catch (err) {
        console.error('❌ Push chunk failed:', err.message);
        // keep going — one bad chunk shouldn't block the rest
      }
    }

    return tickets;
  } catch (err) {
    console.error('❌ sendPushToUsers error:', err.message);
    return [];
  }
}

// ------------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------------
module.exports = {
  sendPushToUser,
  sendPushToUsers,
};