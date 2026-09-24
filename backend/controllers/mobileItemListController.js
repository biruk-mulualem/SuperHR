// controllers/mobileItemListController.js
'use strict';

// ✅ Sequelize must come from the package, NOT from db.
//    `db.Sequelize` is the class — it does NOT have `.where()` / `.literal()`.
const { Op, Sequelize } = require('sequelize');

const db = require('../models');
const { Item, UOM, Category } = db;

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
    const items = rows.map((it) => {
      // Sequelize returns DECIMAL as string → parse to number
      const cost = it.costPrice != null ? parseFloat(it.costPrice) : null;
      const hasCost = cost != null && cost > 0;

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