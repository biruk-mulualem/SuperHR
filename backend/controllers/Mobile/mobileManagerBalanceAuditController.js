// controllers/mobileManagerBalanceAuditController.js
'use strict';

const { QueryTypes } = require('sequelize');
const db = require('../../models');

const canView = (req) => !!req.user;

// ================================================================
// Helpers
// ================================================================
const clampInt = (v, min, max, fallback) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const escapeLike = (s) =>
  String(s || '').replace(/[\\%_]/g, (c) => `\\${c}`);

// ================================================================
// Shared audit CTE — used by every query so the rule stays in one
// place.
//
//   For each (store_id, item_id):
//     • expected_groups  — how many groups exist in this store
//     • group_rows       — how many groups actually have a row
//     • distinct_balances— how many unique balance values across rows
//
//   A pair is MATCHED only if:
//     expected_groups = group_rows  AND  distinct_balances = 1
//   Anything else is CONFLICTED (missing group OR differing balance).
// ================================================================
const AUDIT_CTE = `
  WITH store_group_counts AS (
    SELECT store_id, COUNT(*) AS group_count
    FROM store_group_relations
    GROUP BY store_id
  ),
  store_audit AS (
    SELECT
      sb.store_id,
      sb.item_id,
      COUNT(DISTINCT sb.balance)       AS distinct_balances,
      COUNT(DISTINCT sb.group_id)      AS group_rows,
      COALESCE(MAX(sgc.group_count), 1) AS expected_groups,
      MIN(sb.balance)                  AS balance_a,
      MAX(sb.balance)                  AS balance_b
    FROM store_balances sb
    LEFT JOIN store_group_counts sgc ON sgc.store_id = sb.store_id
    WHERE sb.status = 'Active'
      AND sb.balance IS NOT NULL
    GROUP BY sb.store_id, sb.item_id
  ),
  store_audit_flagged AS (
    SELECT
      sa.*,
      (
        sa.distinct_balances > 1
        OR sa.group_rows < sa.expected_groups
      ) AS has_conflict
    FROM store_audit sa
  )
`;

// ================================================================
// GET /api/mobile/manager/balance-audit/stores
// ----------------------------------------------------------------
// Query:  page, limit, q, audit=all|matched|conflicted
// ================================================================
exports.getStores = async (req, res) => {
  try {
    if (!canView(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const safeLimit = clampInt(req.query.limit, 1, 100, 10);
    const safePage  = clampInt(req.query.page, 1, 1e6, 1);
    const offset    = (safePage - 1) * safeLimit;
    const audit     = ['all', 'matched', 'conflicted'].includes(req.query.audit)
      ? req.query.audit
      : 'all';

    const qLike = req.query.q
      ? `%${escapeLike(String(req.query.q).trim().toLowerCase())}%`
      : null;

    const replacements = { limit: safeLimit, offset, qLike };

    const storeFilterSql = qLike
      ? `AND (LOWER(s.name) LIKE :qLike ESCAPE '\\' OR LOWER(COALESCE(s.location,'')) LIKE :qLike ESCAPE '\\')`
      : '';

    let auditFilterSql = '';
    if (audit === 'conflicted') {
      auditFilterSql = `AND COALESCE(ps.conflicted_items, 0) > 0`;
    } else if (audit === 'matched') {
      auditFilterSql = `AND COALESCE(ps.conflicted_items, 0) = 0`;
    }

    const rows = await db.sequelize.query(
      `
      ${AUDIT_CTE},
      per_store AS (
        SELECT
          store_id,
          COUNT(*)::int                                        AS total_items,
          COUNT(*) FILTER (WHERE has_conflict)::int            AS conflicted_items,
          COUNT(*) FILTER (WHERE NOT has_conflict)::int        AS matched_items
        FROM store_audit_flagged
        GROUP BY store_id
      )
      SELECT
        s.id,
        s.name,
        s.location,
        s.status,
        COALESCE(ps.total_items, 0)::int      AS total_items,
        COALESCE(ps.conflicted_items, 0)::int AS conflicted_items,
        COALESCE(ps.matched_items, 0)::int    AS matched_items
      FROM stores s
      LEFT JOIN per_store ps ON ps.store_id = s.id
      WHERE 1 = 1
        ${storeFilterSql}
        ${auditFilterSql}
      ORDER BY s.name ASC
      LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const [countRow] = await db.sequelize.query(
      `
      ${AUDIT_CTE},
      per_store AS (
        SELECT
          store_id,
          COUNT(*) FILTER (WHERE has_conflict) AS conflicted_items
        FROM store_audit_flagged
        GROUP BY store_id
      )
      SELECT COUNT(*)::int AS total
      FROM stores s
      LEFT JOIN per_store ps ON ps.store_id = s.id
      WHERE 1 = 1
        ${storeFilterSql}
        ${auditFilterSql}
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const total = countRow?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return res.json({
      success: true,
      data: {
        stores: rows.map((s) => ({
          id: s.id,
          name: s.name,
          location: s.location,
          status: s.status,
          totalItems: s.total_items,
          conflictedItems: s.conflicted_items,
          matchedItems: s.matched_items,
        })),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages,
          hasMore: safePage < totalPages,
        },
      },
    });
  } catch (err) {
    console.error('❌ [mobile-manager][balance-audit] getStores error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to load stores',
    });
  }
};

// ================================================================
// GET /api/mobile/manager/balance-audit/stores/:storeId/items
// ----------------------------------------------------------------
// Query:  page, limit, q, filter=all|matched|conflicted
// ================================================================
exports.getStoreItems = async (req, res) => {
  try {
    if (!canView(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const storeId = parseInt(req.params.storeId, 10);
    if (!Number.isFinite(storeId)) {
      return res.status(400).json({ success: false, error: 'storeId is required' });
    }

    const safeLimit = clampInt(req.query.limit, 1, 100, 10);
    const safePage  = clampInt(req.query.page, 1, 1e6, 1);
    const offset    = (safePage - 1) * safeLimit;
    const filter    = ['all', 'matched', 'conflicted'].includes(req.query.filter)
      ? req.query.filter
      : 'all';

    const qLike = req.query.q
      ? `%${escapeLike(String(req.query.q).trim().toLowerCase())}%`
      : null;

    const replacements = { storeId, limit: safeLimit, offset, qLike };

    let extraSql = '';
    if (filter === 'conflicted') extraSql = `AND ia.has_conflict = TRUE`;
    else if (filter === 'matched') extraSql = `AND ia.has_conflict = FALSE`;

    const searchSql = qLike
      ? `AND (LOWER(i.name) LIKE :qLike ESCAPE '\\' OR LOWER(i.code) LIKE :qLike ESCAPE '\\')`
      : '';

    const items = await db.sequelize.query(
      `
      ${AUDIT_CTE}
      SELECT
        i.id                                            AS item_id,
        i.code                                          AS item_code,
        i.name                                          AS item_name,
        u.code                                          AS uom_code,
        ia.balance_a::float                             AS balance_a,
        ia.balance_b::float                             AS balance_b,
        (ia.balance_b - ia.balance_a)::float            AS diff,
        ia.has_conflict                                 AS has_conflict,
        ia.group_rows                                   AS group_rows,
        ia.expected_groups                              AS expected_groups
      FROM store_audit_flagged ia
      JOIN items i    ON i.id = ia.item_id
      LEFT JOIN uom u ON u.id = i.uom_id
      WHERE ia.store_id = :storeId
        ${extraSql}
        ${searchSql}
      ORDER BY ia.has_conflict DESC, ia.distinct_balances DESC, i.name ASC
      LIMIT :limit OFFSET :offset
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const [countRow] = await db.sequelize.query(
      `
      ${AUDIT_CTE}
      SELECT COUNT(*)::int AS total
      FROM store_audit_flagged ia
      JOIN items i ON i.id = ia.item_id
      WHERE ia.store_id = :storeId
        ${extraSql}
        ${searchSql}
      `,
      { replacements, type: QueryTypes.SELECT }
    );

    const total = countRow?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    return res.json({
      success: true,
      data: {
        items: items.map((it) => ({
          itemId: it.item_id,
          itemName: it.item_name,
          itemCode: it.item_code,
          uom: (it.uom_code || '').toLowerCase() || '—',
          groupA: { name: 'Group A', balance: it.balance_a },
          groupB: { name: 'Group B', balance: it.balance_b },
          diff: it.diff,
          hasConflict: it.has_conflict,
          // extra context so the UI can explain *why* it's a conflict
          missingGroup: it.group_rows < it.expected_groups,
          differingBalance: it.balance_a !== it.balance_b,
        })),
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages,
          hasMore: safePage < totalPages,
        },
      },
    });
  } catch (err) {
    console.error('❌ [mobile-manager][balance-audit] getStoreItems error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to load store items',
    });
  }
};

// ================================================================
// GET /api/mobile/manager/balance-audit/summary
// ================================================================
exports.getSummary = async (req, res) => {
  try {
    if (!canView(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const [row] = await db.sequelize.query(
      `
      ${AUDIT_CTE}
      SELECT
        (SELECT COUNT(DISTINCT store_id)::int FROM store_audit_flagged)
          AS stores_under_audit,
        COUNT(*)::int
          AS items_audited,
        COUNT(*) FILTER (WHERE NOT has_conflict)::int
          AS matched,
        COUNT(*) FILTER (WHERE has_conflict)::int
          AS conflicted,
        (SELECT COUNT(DISTINCT store_id)::int FROM store_audit_flagged
           WHERE has_conflict)
          AS stores_with_conflicts
      FROM store_audit_flagged
      `,
      { type: QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      data: {
        storesUnderAudit:     row?.stores_under_audit     || 0,
        itemsAudited:         row?.items_audited          || 0,
        matched:              row?.matched                || 0,
        conflicted:           row?.conflicted             || 0,
        storesWithConflicts:  row?.stores_with_conflicts  || 0,
      },
    });
  } catch (err) {
    console.error('❌ [mobile-manager][balance-audit] getSummary error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to load summary',
    });
  }
};