// controllers/mobileStoreListController.js
// Mobile-only aggregate endpoints for the STORES LIST page.
// (Do NOT confuse with storeDashboardController.js which handles
//  a single store's stock/health/transactions dashboard.)
'use strict';

const { Op, Sequelize } = require('sequelize');
const db = require('../../models');
const { Store, Group, StoreBalance } = db;

// ================================================================
// HELPERS
// ================================================================

const canViewStores = (req) => !!req.user;

// Map DB status ('Active' | 'Inactive' | 'Closed') → frontend ('active' | 'inactive')
const normalizeStatus = (dbStatus) => {
  const s = String(dbStatus || '').toLowerCase();
  return s === 'active' ? 'active' : 'inactive';
};

// ================================================================
// STORE SUMMARY (paginated)
//   GET /api/mobile/store-list/summary
//   Query: ?status=active|inactive|all  &q=search  &page=1  &limit=10
//
//   Response:
//     {
//       success: true,
//       data: {
//         stores: [...],
//         pagination: {
//           page, limit, total, totalPages, hasMore
//         }
//       }
//     }
// ================================================================
exports.getStoreSummary = async (req, res) => {
  try {
    if (!canViewStores(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // -------- Parse query --------
    const {
      status = 'all',
      q,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset   = (pageNum - 1) * limitNum;

    // -------- Build WHERE --------
    const where = {};

    if (status === 'active') {
      where.status = 'Active';
    } else if (status === 'inactive') {
      // 'Inactive' AND 'Closed' both map to the mobile "inactive" pill
      where.status = { [Op.in]: ['Inactive', 'Closed'] };
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where[Op.or] = [
        { name:     { [Op.iLike]: term } },
        { code:     { [Op.iLike]: term } },
        { location: { [Op.iLike]: term } },
      ];
    }

    // -------- 1. Count total (respects filters, ignores pagination) --------
    const total = await Store.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const hasMore = pageNum < totalPages;

    // -------- 2. Fetch THIS PAGE of stores + their groups --------
    const stores = await Store.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: ['storeId', 'code', 'name', 'location', 'status'],
      limit: limitNum,
      offset,
      include: [
        {
          model: Group,
          as: 'groups',
          attributes: ['groupId', 'code', 'name', 'status'],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    // If no stores on this page, return early with pagination metadata
    if (stores.length === 0) {
      return res.json({
        success: true,
        data: {
          stores: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasMore: false,
          },
        },
      });
    }

    const storeIds = stores.map((s) => s.storeId);

    // -------- 3. Aggregate (SUM balance, COUNT items) for THESE stores only --------
    const balanceAgg = await StoreBalance.findAll({
      attributes: [
        'storeId',
        'groupId',
        [Sequelize.fn('SUM',   Sequelize.col('balance')), 'totalBalance'],
        [Sequelize.fn('COUNT', Sequelize.col('id')),      'itemCount'],
      ],
      where: { storeId: { [Op.in]: storeIds } },
      group: ['storeId', 'groupId'],
      raw: true,
    });

    // Index: storeId → { groups: { groupId → { balance, itemCount } }, totalItems }
    const byStore = {};
    balanceAgg.forEach((row) => {
      const sid = row.storeId;
      const gid = row.groupId;
      if (!byStore[sid]) byStore[sid] = { groups: {}, totalItems: 0 };
      byStore[sid].groups[gid] = {
        balance:   Number(row.totalBalance) || 0,
        itemCount: Number(row.itemCount)    || 0,
      };
      byStore[sid].totalItems += Number(row.itemCount) || 0;
    });

    // -------- 4. Shape the response --------
    const shaped = stores.map((s) => {
      const sid = s.storeId;
      const agg = byStore[sid] || { groups: {}, totalItems: 0 };

      const groups = (s.groups || []).map((g) => {
        const gid = g.groupId;
        const groupAgg = agg.groups[gid] || { balance: 0, itemCount: 0 };
        return {
          id: gid,
          name: g.name,
          balance: groupAgg.balance,
        };
      });

      return {
        id: sid,
        code: s.code,
        name: s.name,
        location: s.location || '',
        status: normalizeStatus(s.status),
        items:  agg.totalItems,
        groups,
      };
    });

    return res.json({
      success: true,
      data: {
        stores: shaped,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getStoreSummary error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load stores',
    });
  }
};