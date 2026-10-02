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

    // -------- Status filter (page only) --------
    const statusWhere = {};
    if (status === 'active') {
      statusWhere.status = 'Active';
    } else if (status === 'inactive') {
      statusWhere.status = { [Op.in]: ['Inactive', 'Discontinued'] };
    } else if (status === 'nocost') {
      Object.assign(statusWhere, NO_COST_CLAUSE);
    }

    const pageWhere = combineWhere(scopeWhere, statusWhere);

    // -------- Counts --------
    const [
      totalCount,
      activeCount,
      inactiveCount,
      noCostCount,
    ] = await Promise.all([
      Item.count({ where: scopeWhere }),
      Item.count({
        where: combineWhere(scopeWhere, { status: 'Active' }),
      }),
      Item.count({
        where: combineWhere(scopeWhere, {
          status: { [Op.in]: ['Inactive', 'Discontinued'] },
        }),
      }),
      Item.count({
        where: combineWhere(scopeWhere, NO_COST_CLAUSE),
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
    // Attach the alert threshold to each item in the page.
    const itemIds = rows.map((it) => it.itemId);
    const alertMap = await fetchAlertThresholds(itemIds);

    const items = rows.map((it) => {
      const cost = it.costPrice != null ? parseFloat(it.costPrice) : null;
      const hasCost = cost != null && cost > 0;
      const alert = alertMap[it.itemId] || null;

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
        // ✅ NEW — alert config for the list row
        stockAlert: alert
          ? { threshold: alert.threshold }
          : null,
      };
    });

    const filteredTotal =
      status === 'active'   ? activeCount   :
      status === 'inactive' ? inactiveCount :
      status === 'nocost'   ? noCostCount   :
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
          total:    totalCount,
          active:   activeCount,
          inactive: inactiveCount,
          noCost:   noCostCount,
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

    // threshold = 0 → delete the row
    if (num === 0) {
      await StockAlert.destroy({ where: { itemId } });
      return res.json({
        success: true,
        message: 'Stock alert cleared',
        data: null,
      });
    }

    const [row] = await StockAlert.upsert(
      {
        itemId,
        threshold: num,
        createdBy: req.user?.userId ?? null,
      },
      { returning: true }
    );

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