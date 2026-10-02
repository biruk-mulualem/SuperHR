// controllers/mobileItemListController.js
'use strict';

// ✅ Sequelize must come from the package, NOT from db.
//    `db.Sequelize` is the class — it does NOT have `.where()` / `.literal()`.
const { Op, Sequelize } = require('sequelize');

const db = require('../../models');
const { Item, UOM, Category, StockAlert } = db;

const canViewItems = (req) => !!req.user;

const normalizeStatus = (s) => {
  const v = String(s || '').toLowerCase();
  return v === 'inactive' || v === 'discontinued' ? 'inactive' : 'active';
};

// ================================================================
// "Active only" rule.
//
// Mirrors normalizeStatus(): anything that is NOT inactive /
// discontinued counts as active. This avoids missing rows whose
// stored status is 'Active', 'ACTIVE', null, '', etc.
// ================================================================
const ACTIVE_CLAUSE = {
  status: { [Op.notIn]: ['Inactive', 'Discontinued'] },
};

// ================================================================
// "No cost" rule: costPrice IS NULL OR costPrice = 0
//
// ⚠️ Sequelize returns Postgres DECIMAL columns as STRINGS ("0.0000").
//    `{ costPrice: 0 }` may not match the stored value.
//    Force a numeric comparison with CAST via Sequelize.literal.
// ================================================================
const NO_COST_CLAUSE = {
  [Op.or]: [
    { costPrice: null },
    Sequelize.where(
      Sequelize.literal('CAST("Item"."cost_price" AS DECIMAL(20,4))'),
      { [Op.eq]: 0 }
    ),
  ],
};

// ================================================================
// GET /api/mobile/item-list/items
// ================================================================
exports.getItemsList = async (req, res) => {
  try {
    if (!canViewItems(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      page = 1,
      limit = 10,
      status = 'all',
      q,
      categoryId,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset   = (pageNum - 1) * limitNum;

    // -------- Scope filters (search + category) --------
    const scopeWhere = {};
    if (categoryId) scopeWhere.categoryId = parseInt(categoryId);
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      scopeWhere[Op.or] = [
        { name:         { [Op.iLike]: term } },
        { code:         { [Op.iLike]: term } },
        { standardName: { [Op.iLike]: term } },
        { brand:        { [Op.iLike]: term } },
      ];
    }

    // -------- Get all item ids with an alert (threshold > 0) --------
    const alertRows = await StockAlert.findAll({
      where: {
        threshold: { [Op.gt]: 0 },
      },
      attributes: ['itemId', 'threshold'],
      raw: true,
    });
    const alertItemIds = alertRows.map((r) => r.itemId);
    const alertThresholdMap = {};
    for (const r of alertRows) {
      alertThresholdMap[r.itemId] = parseFloat(r.threshold) || 0;
    }

    // -------- Compute which alert items are currently triggered --------
    // Triggered = company-wide total (agreed stores only) <= threshold
    let triggeredItemIds = [];

    if (alertItemIds.length > 0) {
      // Load all balances for alert items in one query
      const balanceRows = await db.StoreBalance.findAll({
        where: { itemId: { [Op.in]: alertItemIds }, status: 'Active' },
        attributes: ['itemId', 'storeId', 'balance'],
        raw: true,
      });

      // Group by itemId → storeId → [balances]
      const byItem = new Map();
      for (const b of balanceRows) {
        if (!byItem.has(b.itemId)) byItem.set(b.itemId, new Map());
        const storeMap = byItem.get(b.itemId);
        if (!storeMap.has(b.storeId)) storeMap.set(b.storeId, []);
        storeMap.get(b.storeId).push(Number(b.balance) || 0);
      }

      for (const itemId of alertItemIds) {
        const storeMap = byItem.get(itemId);

        // If the item has NO active balances, its company total is 0 —
        // which still breaches any positive threshold.
        let total = 0;
        if (storeMap) {
          for (const balances of storeMap.values()) {
            const maxB = Math.max(...balances);
            const minB = Math.min(...balances);
            if (balances.length > 0 && maxB === minB) {
              total += maxB;
            }
          }
        }

        const threshold = alertThresholdMap[itemId];
        if (threshold > 0 && total <= threshold) {
          triggeredItemIds.push(itemId);
        }
      }
    }

    // -------- Status filter (page only) --------
    const statusWhere = {};

    if (status === 'alertset') {
      // Items with threshold > 0
      statusWhere.itemId = alertItemIds.length
        ? { [Op.in]: alertItemIds }
        : { [Op.in]: [-1] };
    } else if (status === 'triggered') {
      // Items currently at or below their threshold
      statusWhere.itemId = triggeredItemIds.length
        ? { [Op.in]: triggeredItemIds }
        : { [Op.in]: [-1] };
    }
    // 'all' → no extra filter

    // ✅ Apply ACTIVE_CLAUSE to the page query as well, so the list
    //    matches the active-only summary counts.
    const pageWhere = combineWhere(
      combineWhere(scopeWhere, ACTIVE_CLAUSE),
      statusWhere
    );

    // -------- Counts (active items only) --------
    const [
      totalCount,
      alertSetCount,
      triggeredCount,
    ] = await Promise.all([
      Item.count({
        where: combineWhere(scopeWhere, ACTIVE_CLAUSE),
      }),
      Item.count({
        where: combineWhere(
          combineWhere(scopeWhere, ACTIVE_CLAUSE),
          {
            itemId: alertItemIds.length
              ? { [Op.in]: alertItemIds }
              : { [Op.in]: [-1] },
          }
        ),
      }),
      Item.count({
        where: combineWhere(
          combineWhere(scopeWhere, ACTIVE_CLAUSE),
          {
            itemId: triggeredItemIds.length
              ? { [Op.in]: triggeredItemIds }
              : { [Op.in]: [-1] },
          }
        ),
      }),
    ]);

    // -------- Page query --------
    const { rows } = await Item.findAndCountAll({
      where: pageWhere,
      order: [
        ['name', 'ASC'],
        ['itemId', 'ASC'],
      ],
      limit: limitNum,
      offset,
      attributes: [
        'itemId', 'code', 'name', 'standardName',
        'costPrice', 'status', 'uomId', 'categoryId',
      ],
      include: [
        {
          model: UOM,
          as: 'uom',
          attributes: ['uomId', 'code', 'name'],
          required: false,
        },
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name'],
          required: false,
        },
      ],
    });

    // -------- Shape --------
    const triggeredSet = new Set(triggeredItemIds);

    const items = rows.map((it) => {
      const cost = it.costPrice != null ? parseFloat(it.costPrice) : null;
      const hasCost = cost != null && cost > 0;
      const threshold = alertThresholdMap[it.itemId] || 0;
      const hasAlert = threshold > 0;
      const isTriggered = triggeredSet.has(it.itemId);

      return {
        id: it.itemId,
        code: it.code,
        name: it.name || 'Unnamed item',
        sku: it.code || '—',
        unit: (it.uom?.code || '').toLowerCase() || '—',
        category: it.category?.name || null,
        costPrice: cost != null ? cost : 0,
        hasCost,
        status: normalizeStatus(it.status),
        stockAlert: hasAlert ? { threshold } : null,
        // ✅ NEW — tells the UI whether to color the bell red
        isTriggered,
      };
    });

    const filteredTotal =
      status === 'alertset'  ? alertSetCount  :
      status === 'triggered' ? triggeredCount :
      totalCount;

    const totalPages = Math.max(1, Math.ceil(filteredTotal / limitNum));

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredTotal,
          totalPages,
          hasMore: pageNum < totalPages,
        },
        counts: {
          total:     totalCount,
          alertSet:  alertSetCount,
          triggered: triggeredCount,
        },
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getItemsList error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load items',
    });
  }
};

// ================================================================
// GET /api/mobile/item-list/items/:itemId/balances
// ================================================================
exports.getItemBalances = async (req, res) => {
  try {
    if (!canViewItems(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const itemId = parseInt(req.params.itemId, 10);
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Invalid itemId' });
    }

    const { Store, Group, StoreBalance } = db;

    // ---- Item header ----
    const item = await Item.findByPk(itemId, {
      attributes: [
        'itemId', 'code', 'name', 'standardName',
        'costPrice', 'status', 'uomId', 'categoryId',
      ],
      include: [
        { model: UOM,      as: 'uom',      attributes: ['uomId', 'code', 'name'], required: false },
        { model: Category, as: 'category', attributes: ['categoryId', 'name'],     required: false },
      ],
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // ---- All balances for this item, with store + group ----
    const balances = await StoreBalance.findAll({
      where: { itemId },
      include: [
        {
          model: Store,
          as: 'store',
          attributes: ['storeId', 'name', 'code'],
          required: false,
        },
        {
          model: Group,
          as: 'group',
          attributes: ['groupId', 'name'],
          required: false,
        },
      ],
      order: [
        ['storeId', 'ASC'],
        ['groupId', 'ASC'],
      ],
    });

    // ---- Group by store ----
    const storeMap = new Map();

    for (const b of balances) {
      const storeId = b.storeId;
      const storeName = b.store?.name || `Store #${storeId}`;
      const storeCode = b.store?.code || null;

      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          storeId,
          storeName,
          storeCode,
          groups: [],
        });
      }

      const balance = Number(b.balance) || 0;
      const minStockAlert = Number(b.minStockAlert) || 0;
      const isLowStock = balance > 0 && balance <= minStockAlert;

      storeMap.get(storeId).groups.push({
        balanceId: b.id,
        groupId: b.groupId,
        groupName: b.group?.name || `Group #${b.groupId}`,
        balance,
        minStockAlert,
        status: b.status,
        isLowStock,
      });
    }

    // ---- Compute agreement per store ----
    const stores = Array.from(storeMap.values()).map((s) => {
      const balancesN = s.groups.map((g) => Number(g.balance) || 0);

      const hasGroups = balancesN.length > 0;
      const maxB = hasGroups ? Math.max(...balancesN) : 0;
      const minB = hasGroups ? Math.min(...balancesN) : 0;
      const diff = maxB - minB;
      const isAgreed = hasGroups && diff === 0;

      const total = isAgreed ? maxB : null;

      return {
        ...s,
        isAgreed,
        diff,
        total,
      };
    });

    // ---- Totals ----
    const agreedStores = stores.filter((s) => s.isAgreed);
    const grandTotal = agreedStores.reduce((sum, s) => sum + (s.total || 0), 0);

    const cost = item.costPrice != null ? parseFloat(item.costPrice) : 0;

    return res.json({
      success: true,
      data: {
        item: {
          id: item.itemId,
          code: item.code,
          name: item.name || 'Unnamed item',
          standardName: item.standardName || null,
          sku: item.code || '—',
          unit: (item.uom?.code || '').toLowerCase() || '—',
          category: item.category?.name || null,
          costPrice: cost,
          hasCost: cost > 0,
          status: normalizeStatus(item.status),
        },
        totals: {
          stores: stores.length,
          agreedStores: agreedStores.length,
          conflictedStores: stores.length - agreedStores.length,
          groups: stores.reduce((n, s) => n + s.groups.length, 0),
          grandTotal,
        },
        stores,
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getItemBalances error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load item balances',
    });
  }
};

// ================================================================
// GET /api/mobile/item-list/items/:itemId/stock-alert
// Returns the alert config for one item (or null).
// ================================================================
exports.getStockAlert = async (req, res) => {
  try {
    if (!canViewItems(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const itemId = parseInt(req.params.itemId, 10);
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Invalid itemId' });
    }

    const row = await StockAlert.findOne({ where: { itemId } });

    return res.json({
      success: true,
      data: row
        ? {
            id: row.id,
            itemId: row.itemId,
            threshold: parseFloat(row.threshold) || 0,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          }
        : null,
    });
  } catch (err) {
    console.error('❌ [mobile] getStockAlert error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// PUT /api/mobile/item-list/items/:itemId/stock-alert
// Body: { threshold: number }
// Upsert the alert config.
// Setting threshold to 0 removes the config (disables alerts).
// ================================================================
exports.setStockAlert = async (req, res) => {
  try {
    if (!canViewItems(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const itemId = parseInt(req.params.itemId, 10);
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Invalid itemId' });
    }

    const { threshold } = req.body || {};
    const num = Number(threshold);

    if (Number.isNaN(num) || num < 0) {
      return res.status(400).json({
        success: false,
        error: 'threshold must be a non-negative number',
      });
    }

    const item = await Item.findByPk(itemId, { attributes: ['itemId'] });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // threshold = 0 → delete the row (disables alerts)
    if (num === 0) {
      await StockAlert.destroy({ where: { itemId } });
      return res.json({
        success: true,
        message: 'Stock alert cleared',
        data: null,
      });
    }

    // Upsert — insert if missing, update if itemId already exists
    await StockAlert.upsert(
      {
        itemId,
        threshold: num,
        createdBy: req.user?.userId ?? null,
      },
      { returning: true }
    );

    // ✅ Re-fetch — upsert's return shape is unreliable across
    //    Sequelize versions & dialects. findOne is always correct.
    const row = await StockAlert.findOne({ where: { itemId } });

    if (!row) {
      return res.status(500).json({
        success: false,
        error: 'Failed to persist stock alert',
      });
    }

    return res.json({
      success: true,
      data: {
        id: row.id,
        itemId: row.itemId,
        threshold: parseFloat(row.threshold),
        createdBy: row.createdBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    });
  } catch (err) {
    console.error('❌ [mobile] setStockAlert error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// DELETE /api/mobile/item-list/items/:itemId/stock-alert
// ================================================================
exports.clearStockAlert = async (req, res) => {
  try {
    if (!canViewItems(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const itemId = parseInt(req.params.itemId, 10);
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Invalid itemId' });
    }

    const affected = await StockAlert.destroy({ where: { itemId } });

    return res.json({
      success: true,
      message: affected ? 'Stock alert cleared' : 'No alert existed',
      data: { affected },
    });
  } catch (err) {
    console.error('❌ [mobile] clearStockAlert error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// Helper: bulk-fetch alert thresholds for a list of item ids.
// Returns { [itemId]: { id, threshold } }.
// ================================================================
async function fetchAlertThresholds(itemIds) {
  const map = {};
  if (!Array.isArray(itemIds) || itemIds.length === 0) return map;

  try {
    const rows = await StockAlert.findAll({
      where: { itemId: { [Op.in]: itemIds } },
      attributes: ['id', 'itemId', 'threshold'],
    });
    for (const r of rows) {
      map[r.itemId] = {
        id: r.id,
        threshold: parseFloat(r.threshold) || 0,
      };
    }
  } catch (err) {
    console.error('⚠️ fetchAlertThresholds failed:', err.message);
  }

  return map;
}

// ================================================================
// Helper: safely merge two WHERE clauses.
//
// 🔴 Sequelize's Op.or / Op.and are SYMBOLS. Object.entries() skips
//    Symbol keys, silently dropping any clause keyed by them —
//    including NO_COST_CLAUSE. Reflect.ownKeys() sees BOTH string
//    and Symbol keys.
// ================================================================
function combineWhere(a = {}, b = {}) {
  const out = {};
  const andClauses = [];

  [a, b].forEach((w) => {
    Reflect.ownKeys(w).forEach((key) => {
      const val = w[key];
      if (key === Op.or || key === Op.and) {
        andClauses.push({ [key]: val });
      } else {
        out[key] = val;
      }
    });
  });

  if (andClauses.length === 1) {
    Object.assign(out, andClauses[0]);
  } else if (andClauses.length > 1) {
    out[Op.and] = andClauses;
  }

  return out;
}