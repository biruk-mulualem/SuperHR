// backend/services/stockAlertService.js
'use strict';

const { Op } = require('sequelize');
const db = require('../models');

// ────────────────────────────────────────────────────────────────
// Cooldown — don't re-fire the same summary within this window.
// Keyed on the SET of triggered items, so it re-fires when the
// set changes but not while it's stable.
// ────────────────────────────────────────────────────────────────
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
const lastSentMap = new Map();                // signature → timestamp

// ────────────────────────────────────────────────────────────────
// Recipients — admins + managers only
// ────────────────────────────────────────────────────────────────
async function resolveRecipients() {
  const { User, Role } = db;
  const recipients = new Set();

  if (User && Role) {
    try {
      const users = await User.findAll({
        where: { isActive: true },
        include: [
          {
            model: Role,
            as: 'Role',                         // default Sequelize alias
            attributes: ['roleId', 'name'],
            where: { name: { [Op.in]: ['admin', 'manager'] } },
            required: true,
          },
        ],
        attributes: ['userId'],
        limit: 100,
      });
      users.forEach((u) => {
        if (u.userId) recipients.add(u.userId);
      });
    } catch (e) {
      console.warn('⚠️ stockAlert: admin/manager lookup failed:', e.message);
    }
  }

  return Array.from(recipients);
}

// ────────────────────────────────────────────────────────────────
// Company-wide total for one item.
//   - Group balances by storeId
//   - A store is "agreed" if all its group balances are equal
//   - Total = sum of agreed stores only
// ────────────────────────────────────────────────────────────────
async function computeCompanyTotal(itemId, transaction = null) {
  const { StoreBalance } = db;

  const rows = await StoreBalance.findAll({
    where: { itemId, status: 'Active' },
    attributes: ['storeId', 'balance'],
    raw: true,
    transaction,
  });

  if (!rows.length) return { total: 0, agreedStores: 0, conflictedStores: 0 };

  const storeMap = new Map();
  for (const r of rows) {
    if (!storeMap.has(r.storeId)) storeMap.set(r.storeId, []);
    storeMap.get(r.storeId).push(Number(r.balance) || 0);
  }

  let total = 0;
  let agreedStores = 0;
  let conflictedStores = 0;

  for (const balances of storeMap.values()) {
    const maxB = Math.max(...balances);
    const minB = Math.min(...balances);
    const isAgreed = balances.length > 0 && maxB === minB;

    if (isAgreed) {
      total += maxB;
      agreedStores++;
    } else {
      conflictedStores++;
    }
  }

  return { total, agreedStores, conflictedStores };
}

// ────────────────────────────────────────────────────────────────
// Evaluate ONE item — does its company total breach the threshold?
// Returns { triggered, total, threshold, itemName, itemSku, unit, ... }
// Does NOT send any notification.
// ────────────────────────────────────────────────────────────────
async function evaluateItem(itemId, transaction = null) {
  const { Item, StockAlert } = db;

  const alert = await StockAlert.findOne({ where: { itemId }, transaction });
  const threshold = alert ? Number(alert.threshold) : 0;
  if (!threshold || threshold <= 0) {
    return { itemId, triggered: false, reason: 'no_threshold' };
  }

  const { total, agreedStores, conflictedStores } = await computeCompanyTotal(
    itemId,
    transaction
  );

  if (total > threshold) {
    return {
      itemId,
      triggered: false,
      reason: 'above_threshold',
      total,
      threshold,
      agreedStores,
      conflictedStores,
    };
  }

  const item = await Item.findByPk(itemId, {
    attributes: ['itemId', 'name', 'code', 'uomId'],
    include: [
      { association: 'uom', attributes: ['code'], required: false },
    ],
    transaction,
  });

  return {
    itemId,
    triggered: true,
    total,
    threshold,
    agreedStores,
    conflictedStores,
    itemName: item?.name || `Item #${itemId}`,
    itemSku: item?.code || null,
    unit: (item?.uom?.code || 'units').toLowerCase(),
  };
}

// ────────────────────────────────────────────────────────────────
// MAIN — evaluate every threshold, fire ONE summary if any triggered.
// ────────────────────────────────────────────────────────────────
async function runStockAlertCheck({ transaction = null } = {}) {
  const { StockAlert, MobileNotification } = db;

  // 1. Load all thresholds
  const alerts = await StockAlert.findAll({
    where: { threshold: { [Op.gt]: 0 } },
    attributes: ['itemId'],
    raw: true,
    transaction,
  });

  if (alerts.length === 0) {
    return { checked: 0, triggered: [], fired: false };
  }

  // 2. Evaluate each item
  const triggeredItems = [];
  for (const { itemId } of alerts) {
    const r = await evaluateItem(itemId, transaction);
    if (r.triggered) triggeredItems.push(r);
  }

  if (triggeredItems.length === 0) {
    return { checked: alerts.length, triggered: [], fired: false };
  }

  // 3. Cooldown — keyed on the set of triggered items, so the same
  //    situation won't spam every 30 minutes.
  const signature = triggeredItems
    .map((it) => it.itemId)
    .sort((a, b) => a - b)
    .join(',');

  const last = lastSentMap.get(signature) || 0;
  const now = Date.now();
  if (now - last < ALERT_COOLDOWN_MS) {
    return {
      checked: alerts.length,
      triggered: triggeredItems,
      fired: false,
      reason: 'cooldown',
    };
  }

  // 4. Recipients
  const recipientIds = await resolveRecipients();
  if (recipientIds.length === 0) {
    console.warn('⚠️ stockAlert: no recipients');
    return {
      checked: alerts.length,
      triggered: triggeredItems,
      fired: false,
      reason: 'no_recipients',
    };
  }

  // 5. ONE summary notification
  await MobileNotification.store.stockAlertSummary({
    recipientIds,
    items: triggeredItems.map((it) => ({
      itemId: it.itemId,
      itemName: it.itemName,
      itemSku: it.itemSku,
      balance: it.total,
      threshold: it.threshold,
      unit: it.unit,
    })),
  });

  lastSentMap.set(signature, now);

  console.log(
    `🔔 Stock alert summary fired: ${triggeredItems.length} item(s) low ` +
      `→ ${recipientIds.length} recipients`
  );

  return {
    checked: alerts.length,
    triggered: triggeredItems,
    recipients: recipientIds.length,
    fired: true,
  };
}

module.exports = {
  evaluateItem,
  runStockAlertCheck,
  resolveRecipients,
  computeCompanyTotal,
  ALERT_COOLDOWN_MS,
};