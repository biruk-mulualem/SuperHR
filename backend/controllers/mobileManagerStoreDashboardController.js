// controllers/mobileManagerStoreDashboardController.js
'use strict';

const { Op, QueryTypes } = require('sequelize');
const db = require('../models');
const { Store, Group, Item, StoreBalance, StockAlert } = db;

const canView = (req) => !!req.user;

// ================================================================
// Helpers
// ================================================================
const clampInt = (v, min, max, fallback) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

// ================================================================
// Balance rule — mirrors mobileLowStockController.computeBalancesByItem
// ----------------------------------------------------------------
// For each item, group its active balances by store. Within a store,
// if all group balances agree → count that store's balance once.
// If they disagree → the store is a "conflict" and its balance is
// excluded from the item's total.
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
      bucket.total += entries[0].balance;
      bucket.storesCounted += 1;
    } else {
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

// ================================================================
// Stock Status counts — mirrors mobileLowStockController.computeAlertCounts
// ================================================================
async function computeStockStatusCounts() {
  const rows = await StockAlert.findAll({
    attributes: ['itemId', 'threshold'],
    raw: true,
  });

  const total = rows.length;
  if (total === 0) {
    return { total: 0, triggered: 0, pending: 0 };
  }

  const itemIds = [...new Set(rows.map((r) => r.itemId))];
  const balances = await computeBalancesByItem(itemIds);

  let triggered = 0;
  let pending = 0;

  rows.forEach((r) => {
    const bucket = balances[r.itemId] || { total: 0 };
    const bal = bucket.total;
    const thr = Number(r.threshold) || 0;
    if (thr > 0 && bal <= thr) triggered++;
    else pending++;
  });

  return { total, triggered, pending };
}

// ================================================================
// GET /api/mobile/manager/store-dashboard/summary
// ----------------------------------------------------------------
// Query (optional):
//   storeLimit     default 5    — how many stores to preview
//   itemsPerStore  default 20   — cap on items returned per store
// ================================================================
exports.getSummary = async (req, res) => {
  try {
    if (!canView(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const storeLimit    = clampInt(req.query.storeLimit,    1, 50,  5);
    const itemsPerStore = clampInt(req.query.itemsPerStore, 1, 100, 20);

    // ------------------------------------------------------------
    // 1. Store & inventory + balance audit counts (single SQL pass)
    // ------------------------------------------------------------
    const [totals] = await db.sequelize.query(
      `
      WITH
      store_stats AS (
        SELECT
          COUNT(*)                                      AS total_stores,
          COUNT(*) FILTER (WHERE status <> 'Inactive')  AS active_stores
        FROM stores
      ),
      item_stats AS (
        SELECT
          COUNT(*)                                    AS total_items,
          COUNT(*) FILTER (WHERE status = 'Active')   AS active_items,
          COUNT(*) FILTER (WHERE status <> 'Active')  AS inactive_items
        FROM items
      ),
      stock_stats AS (
        SELECT
          COUNT(*) FILTER (
            WHERE balance <= min_stock_alert AND balance > 0
          ) AS low_stock,
          COUNT(*) FILTER (WHERE balance = 0) AS out_of_stock
        FROM store_balances
        WHERE status = 'Active'
      ),
      store_audit AS (
        SELECT
          sb.store_id,
          sb.item_id,
          COUNT(DISTINCT sb.balance) AS distinct_balances
        FROM store_balances sb
        WHERE sb.status = 'Active'
          AND sb.balance IS NOT NULL
        GROUP BY sb.store_id, sb.item_id
      ),
      audit_stats AS (
        SELECT
          COUNT(*)::int                                       AS audited_items,
          COUNT(*) FILTER (WHERE distinct_balances = 1)::int  AS matched_items,
          COUNT(*) FILTER (WHERE distinct_balances > 1)::int  AS conflicted_items
        FROM store_audit
      )
      SELECT
        (SELECT total_stores     FROM store_stats)::int  AS total_stores,
        (SELECT active_stores    FROM store_stats)::int  AS active_stores,
        (SELECT total_items      FROM item_stats)::int   AS total_items,
        (SELECT active_items     FROM item_stats)::int   AS active_items,
        (SELECT inactive_items   FROM item_stats)::int   AS inactive_items,
        (SELECT low_stock        FROM stock_stats)::int  AS low_stock,
        (SELECT out_of_stock     FROM stock_stats)::int  AS out_of_stock,
        (SELECT audited_items    FROM audit_stats)::int  AS audited_items,
        (SELECT matched_items    FROM audit_stats)::int  AS matched_items,
        (SELECT conflicted_items FROM audit_stats)::int  AS conflicted_items
      `,
      { type: QueryTypes.SELECT }
    );

    // ------------------------------------------------------------
    // 2. Stock status counts (same balance rule as the Low Stock page)
    // ------------------------------------------------------------
    const stockStatus = await computeStockStatusCounts();

    // ------------------------------------------------------------
    // 3. Preview stores — first N
    // ------------------------------------------------------------
    const stores = await db.sequelize.query(
      `
      SELECT
        s.id,
        s.name,
        s.location,
        s.status,
        (
          SELECT COUNT(DISTINCT sb.item_id)
          FROM store_balances sb
          WHERE sb.store_id = s.id
            AND sb.status = 'Active'
        ) AS items_count
      FROM stores s
      ORDER BY s.name ASC
      LIMIT :storeLimit
      `,
      { replacements: { storeLimit }, type: QueryTypes.SELECT }
    );

    const storeIds = stores.map((s) => s.id);

    // ------------------------------------------------------------
    // 4. Groups for the preview stores
    //    Uses the Store ↔ Group association (belongsToMany via
    //    StoreGroupRelation) so no raw column names are guessed.
    // ------------------------------------------------------------
    let groupsByStore = {};
    if (storeIds.length) {
      const storesWithGroups = await Store.findAll({
        where: { id: { [Op.in]: storeIds } },
        attributes: ['id'],
        include: [
          {
            model: Group,
            as: 'groups',
            attributes: ['groupId', 'name'],
            through: { attributes: [] },
            required: false,
          },
        ],
      });

      // Aggregate balances per (store, group)
      const groupAgg = await StoreBalance.findAll({
        attributes: [
          'storeId',
          'groupId',
          [db.sequelize.fn('SUM', db.sequelize.col('balance')), 'systemBalance'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')),    'itemsCount'],
        ],
        where: {
          storeId: { [Op.in]: storeIds },
          status: 'Active',
        },
        group: ['storeId', 'groupId'],
        raw: true,
      });

      const aggByKey = new Map();
      groupAgg.forEach((row) => {
        aggByKey.set(`${row.storeId}::${row.groupId}`, {
          systemBalance: Number(row.systemBalance) || 0,
          itemsCount:    Number(row.itemsCount)    || 0,
        });
      });

      storesWithGroups.forEach((s) => {
        groupsByStore[s.id] = (s.groups || []).map((g) => {
          const agg = aggByKey.get(`${s.id}::${g.groupId}`) || {
            systemBalance: 0,
            itemsCount: 0,
          };
          return {
            id: g.groupId,
            name: g.name,
            systemBalance: agg.systemBalance,
            countedBalance: agg.systemBalance,
            itemsCount: agg.itemsCount,
          };
        });
      });
    }

    // ------------------------------------------------------------
    // 5. Item preview — first N items per store
    // ------------------------------------------------------------
    let itemsByStore = {};
    if (storeIds.length) {
      const itemsPreview = await db.sequelize.query(
        `
        WITH ranked AS (
          SELECT
            sb.store_id,
            sb.item_id,
            COUNT(DISTINCT sb.balance) AS distinct_balances,
            MIN(sb.balance)            AS balance_a,
            MAX(sb.balance)            AS balance_b,
            ROW_NUMBER() OVER (
              PARTITION BY sb.store_id
              ORDER BY COUNT(DISTINCT sb.balance) DESC, sb.item_id ASC
            ) AS rn
          FROM store_balances sb
          WHERE sb.store_id IN (:storeIds)
            AND sb.status = 'Active'
            AND sb.balance IS NOT NULL
          GROUP BY sb.store_id, sb.item_id
        )
        SELECT
          r.store_id,
          r.item_id                                   AS item_id,
          i.code                                      AS item_code,
          i.name                                      AS item_name,
          u.code                                      AS uom_code,
          r.balance_a::float                          AS balance_a,
          r.balance_b::float                          AS balance_b,
          (r.balance_b - r.balance_a)::float          AS diff,
          (r.distinct_balances > 1)                   AS has_conflict
        FROM ranked r
        JOIN items i    ON i.id = r.item_id
        LEFT JOIN uom u ON u.id = i.uom_id
        WHERE r.rn <= :itemsPerStore
        ORDER BY r.store_id, r.distinct_balances DESC, i.name ASC
        `,
        {
          replacements: { storeIds, itemsPerStore },
          type: QueryTypes.SELECT,
        }
      );

      itemsPreview.forEach((it) => {
        if (!itemsByStore[it.store_id]) itemsByStore[it.store_id] = [];
        itemsByStore[it.store_id].push({
          itemId: it.item_id,
          itemCode: it.item_code,
          itemName: it.item_name,
          uom: (it.uom_code || '').toLowerCase() || '—',
          groupA: { name: 'Group A', balance: it.balance_a },
          groupB: { name: 'Group B', balance: it.balance_b },
          diff: it.diff,
          hasConflict: it.has_conflict,
        });
      });
    }

    // ------------------------------------------------------------
    // 6. Assemble
    // ------------------------------------------------------------
    return res.json({
      success: true,
      data: {
        // Store & inventory
        totalStores:   Number(totals?.total_stores   ?? 0),
        activeStores:  Number(totals?.active_stores  ?? 0),
        totalItems:    Number(totals?.total_items    ?? 0),
        activeItems:   Number(totals?.active_items   ?? 0),
        inactiveItems: Number(totals?.inactive_items ?? 0),

        // Stock counts
        lowStock:   Number(totals?.low_stock    ?? 0),
        outOfStock: Number(totals?.out_of_stock ?? 0),

        // Balance audit
        auditedItems:    Number(totals?.audited_items    ?? 0),
        matchedItems:    Number(totals?.matched_items    ?? 0),
        conflictedItems: Number(totals?.conflicted_items ?? 0),

        // Stock Status (thresholds)
        totalStatus:     stockStatus.total,
        triggeredStatus: stockStatus.triggered,
        pendingStatus:   stockStatus.pending,

        // Store preview
        stores: stores.map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          city: s.location,
          status: s.status,
          items: Number(s.items_count) || 0,
          groups: groupsByStore[s.id] || [],
          itemsPreview: itemsByStore[s.id] || [],
        })),
      },
    });
  } catch (err) {
    console.error('❌ [mobile-manager][store-dashboard] getSummary error:', err);

    const detail =
      process.env.NODE_ENV !== 'production'
        ? {
            message: err.message,
            sql: err.sql || err.parent?.sql,
            pgMessage: err.original?.message || err.parent?.message,
          }
        : undefined;

    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to load store dashboard',
      ...(detail ? { detail } : {}),
    });
  }
};