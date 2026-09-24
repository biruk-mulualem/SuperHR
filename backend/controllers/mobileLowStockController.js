// controllers/mobileLowStockController.js
'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { StockAlert, Item, StoreBalance, UOM, Store, Group } = db;

const canView = (req) => !!req.user;

// ================================================================
// BALANCE RULE
// ----------------------------------------------------------------
// For each store that holds the item:
//   1. Collect every active balance row for that (store, item) —
//      one row per group.
//   2. If ALL balances in that store are EQUAL  → count once.
//   3. If any balance DIFFERS                   → skip the store
//      and record each group's balance as a "conflict".
//   4. Stores with only ONE group row count too
//      (nothing to conflict with).
// Sum all counted values → the item's effective balance.
//
// Returns per item:
//   {
//     total,                       // summed balance
//     storesCounted,               // how many stores contributed
//     conflicts: [                 // stores that were skipped
//       {
//         storeId,
//         groups: [                // one entry per group
//           { groupId, balance }
//         ]
//       }
//     ]
//   }
// ================================================================
async function computeBalancesByItem(itemIds) {
  const out = {};
  if (!itemIds.length) return out;

  itemIds.forEach((id) => {
    out[id] = { total: 0, storesCounted: 0, conflicts: [] };
  });

  const rows = await StoreBalance.findAll({
    where: {
      itemId: { [Op.in]: itemIds },
      status: 'Active',
    },
    attributes: ['itemId', 'storeId', 'groupId', 'balance'],
    raw: true,
  });

  if (!rows.length) return out;

  // Bucket by (itemId, storeId) → list of { groupId, balance }
  const byItemStore = new Map();
  for (const r of rows) {
    const key = `${r.itemId}::${r.storeId}`;
    if (!byItemStore.has(key)) byItemStore.set(key, []);
    byItemStore.get(key).push({
      groupId: r.groupId,
      balance: Number(r.balance) || 0,
    });
  }

  for (const [key, entries] of byItemStore.entries()) {
    const [itemIdStr, storeIdStr] = key.split('::');
    const itemId  = Number(itemIdStr);
    const storeId = Number(storeIdStr);
    const bucket  = out[itemId];
    if (!bucket) continue;

    const distinct = new Set(entries.map((e) => e.balance));

    if (distinct.size === 1) {
      // ✅ All groups agree → count once
      bucket.total += entries[0].balance;
      bucket.storesCounted += 1;
    } else {
      // ⚠️ Conflict → keep every group's balance
      bucket.conflicts.push({
        storeId,
        groups: entries
          .map((e) => ({ groupId: e.groupId, balance: e.balance }))
          .sort((a, b) => a.balance - b.balance),
      });
    }
  }

  return out;
}

// ---------------------------------------------------------------
// Resolve store names + group names for conflicts
// ---------------------------------------------------------------
async function attachStoreAndGroupNames(balancesByItem) {
  const storeIds = new Set();
  const groupIds = new Set();

  for (const bucket of Object.values(balancesByItem)) {
    for (const c of bucket.conflicts) {
      storeIds.add(c.storeId);
      for (const g of c.groups) groupIds.add(g.groupId);
    }
  }

  if (!storeIds.size) return balancesByItem;

  const [stores, groups] = await Promise.all([
    Store.findAll({
      where: { id: { [Op.in]: [...storeIds] } },
      attributes: ['id', 'name'],
      raw: true,
    }),
    Group.findAll({
      where: { id: { [Op.in]: [...groupIds] } },
      attributes: ['id', 'name'],
      raw: true,
    }),
  ]);

  const storeName = new Map(stores.map((s) => [s.id, s.name]));
  const groupName = new Map(groups.map((g) => [g.id, g.name]));

  for (const bucket of Object.values(balancesByItem)) {
    bucket.conflicts = bucket.conflicts.map((c) => ({
      storeId: c.storeId,
      storeName: storeName.get(c.storeId) || `Store #${c.storeId}`,
      groups: c.groups.map((g) => ({
        groupId: g.groupId,
        groupName: groupName.get(g.groupId) || `Group #${g.groupId}`,
        balance: g.balance,
      })),
    }));
  }

  return balancesByItem;
}

// ---------------------------------------------------------------
// Helper: hot vs watching vs withConflicts across the WHOLE set.
// ---------------------------------------------------------------
async function computeAlertCounts() {
  const rows = await StockAlert.findAll({
    attributes: ['itemId', 'threshold'],
    raw: true,
  });

  const total = rows.length;
  if (total === 0) {
    return { total: 0, hot: 0, watching: 0, withConflicts: 0 };
  }

  const itemIds = [...new Set(rows.map((r) => r.itemId))];
  const balances = await computeBalancesByItem(itemIds);

  let hot = 0;
  let watching = 0;
  let withConflicts = 0;

  rows.forEach((r) => {
    const bucket = balances[r.itemId] || { total: 0, conflicts: [] };
    const bal = bucket.total;
    const thr = Number(r.threshold) || 0;
    if (thr > 0 && bal <= thr) hot++;
    else watching++;
    if (bucket.conflicts.length > 0) withConflicts++;
  });

  return { total, hot, watching, withConflicts };
}

// ---------------------------------------------------------------
// GET /api/mobile/low-stock/alerts?page=1&limit=10
// ---------------------------------------------------------------
exports.getAlerts = async (req, res) => {
  try {
    if (!canView(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // -------- Parse query --------
    const pageNum  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset   = (pageNum - 1) * limitNum;

    // -------- Full-set counts --------
    const counts = await computeAlertCounts();
    const { total } = counts;

    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const hasMore = pageNum < totalPages;

    // -------- Fetch this page --------
    const alerts = await StockAlert.findAll({
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'code', 'name', 'uomId'],
          include: [
            { model: UOM, as: 'uom', attributes: ['code', 'name'], required: false },
          ],
        },
      ],
    });

    // -------- Balance per item (THIS PAGE ONLY) --------
    const pageItemIds = [...new Set(alerts.map((a) => a.itemId))];
    let balancesByItem = await computeBalancesByItem(pageItemIds);
    balancesByItem = await attachStoreAndGroupNames(balancesByItem);

    // -------- Shape --------
    const shaped = alerts.map((a) => {
      const item   = a.item;
      const bucket = balancesByItem[a.itemId] || {
        total: 0,
        storesCounted: 0,
        conflicts: [],
      };

      return {
        id: a.id,
        itemId: a.itemId,
        itemName: item?.name || 'Unnamed item',
        sku: item?.code || '—',
        unit: (item?.uom?.code || '').toLowerCase() || '—',
        threshold: Number(a.threshold) || 0,
        currentBalance: bucket.total,
        storesCounted: bucket.storesCounted,
        hasConflicts: bucket.conflicts.length > 0,
        conflictingStoreCount: bucket.conflicts.length,
        conflicts: bucket.conflicts,
        createdAt: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
      };
    });

    return res.json({
      success: true,
      data: {
        alerts: shaped,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore,
        },
        counts: {
          total:         counts.total,
          hot:           counts.hot,
          watching:      counts.watching,
          withConflicts: counts.withConflicts,
        },
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getAlerts error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load alerts',
    });
  }
};

// ---------------------------------------------------------------
// POST /api/mobile/low-stock/alerts
// Body: { itemId, threshold }
// ---------------------------------------------------------------
exports.createAlert = async (req, res) => {
  try {
    if (!canView(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { itemId, threshold } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, error: 'itemId is required' });
    }

    const th = Number(threshold);
    if (!Number.isFinite(th) || th <= 0) {
      return res.status(400).json({
        success: false,
        error: 'threshold must be a positive number',
      });
    }

    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const existing = await StockAlert.findOne({ where: { itemId } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An alert already exists for this item',
      });
    }

    const alert = await StockAlert.create({
      itemId,
      threshold: th,
      createdBy: req.user?.userId || null,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: alert.id,
        itemId: alert.itemId,
        threshold: Number(alert.threshold),
        createdAt: new Date(alert.createdAt).getTime(),
      },
    });
  } catch (error) {
    console.error('❌ [mobile] createAlert error:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'An alert already exists for this item',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create alert',
    });
  }
};

// ---------------------------------------------------------------
// DELETE /api/mobile/low-stock/alerts/:id
// ---------------------------------------------------------------
exports.deleteAlert = async (req, res) => {
  try {
    if (!canView(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const alert = await StockAlert.findByPk(id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    await alert.destroy();
    return res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    console.error('❌ [mobile] deleteAlert error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete alert',
    });
  }
};