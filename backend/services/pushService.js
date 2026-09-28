// services/pushService.js
'use strict';

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const { PushToken } = require('../models');

// ================================================================
// FIREBASE ADMIN INIT
// ================================================================
if (!admin.apps || !admin.apps.length) {
  try {
    const prodPath = '/etc/secrets/firebase-service-account.json';
    const devPath = path.resolve(__dirname, '../firebase-service-account.json');

    let serviceAccount;
    if (fs.existsSync(prodPath)) {
      serviceAccount = require(prodPath);
      console.log('🔥 Firebase Admin: loaded from', prodPath);
    } else if (fs.existsSync(devPath)) {
      serviceAccount = require(devPath);
      console.log('🔥 Firebase Admin: loaded from', devPath);
    } else {
      throw new Error('firebase-service-account.json not found');
    }

    // v14: use admin.cert directly (admin.credential.cert was v13)
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });
    console.log('🔥 Firebase Admin initialized');
  } catch (e) {
    console.error('❌ Firebase Admin init failed:', e.message);
  }
}

// ================================================================
// KILL SWITCH
// ================================================================
const isPushEnabled = () => process.env.PUSH_ENABLED === 'true';

// ================================================================
// TOKEN LOOKUPS
// ================================================================
async function getTokensForUser(userId) {
  if (!userId) return [];
  const rows = await PushToken.findAll({
    where: { userId, isActive: true },
    attributes: ['token'],
  });
  return rows.map((r) => r.token);
}

async function getTokensForUsers(userIds) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  if (unique.length === 0) return [];
  const rows = await PushToken.findAll({
    where: { userId: unique, isActive: true },
    attributes: ['token'],
  });
  return [...new Set(rows.map((r) => r.token))];
}

// ================================================================
// LOW-LEVEL FCM SENDER
// ================================================================
async function sendToTokens(tokens, { title, body, data = {} } = {}) {
  if (!isPushEnabled()) {
    console.log('📨 [push] disabled — skipping');
    return [];
  }

  const valid = (tokens || []).filter((t) => t && typeof t === 'string');
  if (valid.length === 0 || !title) return [];

  const stringData = {};
  Object.entries(data).forEach(([k, v]) => {
    stringData[k] = v == null ? '' : String(v);
  });

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: valid,
      notification: { title, body },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: { aps: { sound: 'default' } },
      },
    });

    console.log(
      `📨 [push] FCM sent: ${response.successCount} ok, ${response.failureCount} failed`
    );

    const deadTokens = [];
    response.responses.forEach((r, i) => {
      if (
        !r.success &&
        (r.error?.code === 'messaging/registration-token-not-registered' ||
          r.error?.code === 'messaging/invalid-registration-token')
      ) {
        deadTokens.push(valid[i]);
      } else if (!r.success) {
        console.warn(`📨 [push] send error for token ${i}:`, r.error?.message);
      }
    });

    if (deadTokens.length) {
      await PushToken.update(
        { isActive: false },
        { where: { token: deadTokens } }
      );
      console.log(`🧹 Deactivated ${deadTokens.length} dead tokens`);
    }

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (err) {
    console.error('❌ FCM send failed:', err.message);
    return [];
  }
}

// ================================================================
// PUBLIC API
// ================================================================
async function sendPushToUser(userId, { title, body, data = {} } = {}) {
  console.log('📨 [push] sendPushToUser — user:', userId, '| title:', title);
  const tokens = await getTokensForUser(userId);
  console.log('📨 [push] found', tokens.length, 'tokens for user', userId);
  if (tokens.length === 0) return [];
  return sendToTokens(tokens, { title, body, data });
}

async function sendPushToUsers(userIds, { title, body, data = {} } = {}) {
  const tokens = await getTokensForUsers(userIds);
  if (tokens.length === 0) return [];
  return sendToTokens(tokens, { title, body, data });
}

module.exports = {
  sendPushToUser,
  sendPushToUsers,
  getTokensForUser,
  getTokensForUsers,
};