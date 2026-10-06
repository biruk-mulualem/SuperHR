// controllers/mobileStoreListController.js
// Mobile-only aggregate endpoints for the STORES LIST page.
'use strict';

const { Op, Sequelize, QueryTypes } = require('sequelize');
const ExcelJS = require('exceljs');
const db = require('../../models');
const { Store, Group, StoreBalance, Item, UOM } = db;

// ================================================================
// CONFIG
// ================================================================

// Store codes that should never appear in the mobile store list.
const EXCLUDED_STORE_CODES = ['STORE-007', 'STORE-006'];

// The two groups compared on the detail page.
const GROUP_A_NAME = 'Store IT';
const GROUP_B_NAME = 'Storekeeper';

// Company banner strings
const COMPANY_NAME = 'SUPER DOUBLE "T" GENERAL TRADING PLC';
const COMPANY_TAGLINE = 'WE TRUST IN GOD!!!  እግዚአብሔር ይባረክ!!!';

// Excel palette (matches exportBalances)
const C = {
  banner:        'FF1A56DB',
  slogan:        'FF4B5563',
  headerBg:      'FF1E3A8A',
  headerFg:      'FFFFFFFF',
  border:        'FFCBD5E1',
  borderHdr:     'FF1E3A8A',
  zebra:         'FFF8FAFC',
  conflictBg:    'FFFEF2F2',
  conflictFg:    'FFB91C1C',
  diffRed:       'FFDC2626',
  diffRedBg:     'FFFECACA',
  diffGreen:     'FF059669',
  diffGreenBg:   'FFD1FAE5',
  conflictPillBg:'FFFEE2E2',
  conflictPillFg:'FF991B1B',
  matchPillBg:   'FFD1FAE5',
  matchPillFg:   'FF065F46',
  infoValue:     'FF1A56DB',
  infoLabel:     'FF0F172A',
};

// ================================================================
// HELPERS
// ================================================================

const canViewStores = (req) => !!req.user;

const normalizeStatus = (dbStatus) => {
  const s = String(dbStatus || '').toLowerCase();
  return s === 'active' ? 'active' : 'inactive';
};

const thinBorder = (color) => {
  const side = { style: 'thin', color: { argb: color } };
  return { top: side, bottom: side, left: side, right: side };
};

const formatDateTimeLong = (d) => {
  const date = new Date(d);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const makeSheetName = (store, usedNames) => {
  let raw = `${store.code || 'store'} - ${store.name || ''}`;
  let safe = raw.replace(/[:\\\/\?\*\[\]]/g, ' ').trim();
  if (safe.length > 31) safe = safe.slice(0, 31);

  let name = safe || 'Store';
  let n = 2;
  while (usedNames.has(name)) {
    const suffix = ` (${n})`;
    name = `${safe.slice(0, 31 - suffix.length)}${suffix}`;
    n += 1;
  }
  usedNames.add(name);
  return name;
};

// ================================================================
// STORE SUMMARY (paginated)
//   GET /api/mobile/store-list/summary
// ================================================================
exports.getStoreSummary = async (req, res) => {
  try {
    if (!canViewStores(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { status = 'all', q, page = 1, limit = 10 } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset   = (pageNum - 1) * limitNum;

    const where = {};

    if (status === 'active') {
      where.status = 'Active';
    } else if (status === 'inactive') {
      where.status = { [Op.in]: ['Inactive', 'Closed'] };
    }

    where.code = { [Op.notIn]: EXCLUDED_STORE_CODES };

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where[Op.or] = [
        { name:     { [Op.iLike]: term } },
        { code:     { [Op.iLike]: term } },
        { location: { [Op.iLike]: term } },
      ];
    }

    const [totals] = await db.sequelize.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM stores s
           WHERE s.code NOT IN (:excludedCodes)
             ${status === 'active' ? `AND s.status = 'Active'` : ''}
             ${status === 'inactive' ? `AND s.status IN ('Inactive','Closed')` : ''}
             ${q && q.trim() ? `AND (s.name ILIKE :term OR s.code ILIKE :term OR s.location ILIKE :term)` : ''}
        ) AS total_stores,
        (SELECT COUNT(*)::int FROM items) AS total_items
      `,
      {
        replacements: {
          excludedCodes: EXCLUDED_STORE_CODES,
          term: q && q.trim() ? `%${q.trim()}%` : null,
        },
        type: QueryTypes.SELECT,
      }
    );

    const totalStores = Number(totals?.total_stores ?? 0);
    const totalItems  = Number(totals?.total_items  ?? 0);

    const totalPages = Math.max(1, Math.ceil(totalStores / limitNum));
    const hasMore = pageNum < totalPages;

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

    if (stores.length === 0) {
      return res.json({
        success: true,
        data: {
          stores: [],
          summary: { totalStores, totalItems },
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalStores,
            totalPages,
            hasMore: false,
          },
        },
      });
    }

    const storeIds = stores.map((s) => s.storeId);

    const balanceAgg = await StoreBalance.findAll({
      attributes: [
        'storeId',
        'groupId',
        [Sequelize.fn('SUM', Sequelize.col('balance')), 'totalBalance'],
        [
          Sequelize.fn(
            'COUNT',
            Sequelize.fn('DISTINCT', Sequelize.col('item_id'))
          ),
          'itemCount',
        ],
      ],
      where: { storeId: { [Op.in]: storeIds }, status: 'Active' },
      group: ['storeId', 'groupId'],
      raw: true,
    });

    const byStore = {};
    balanceAgg.forEach((row) => {
      const sid = row.storeId;
      const gid = row.groupId;
      if (!byStore[sid]) byStore[sid] = { groups: {}, totalItems: 0 };

      const groupItemCount = Number(row.itemCount) || 0;

      byStore[sid].groups[gid] = {
        balance:   Number(row.totalBalance) || 0,
        itemCount: groupItemCount,
      };

      byStore[sid].totalItems = Math.max(
        byStore[sid].totalItems,
        groupItemCount
      );
    });

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
        items: agg.totalItems,
        groups,
      };
    });

    return res.json({
      success: true,
      data: {
        stores: shaped,
        summary: { totalStores, totalItems },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalStores,
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

// ================================================================
// STORE DETAIL — COMPARISON (paginated)
// ================================================================
exports.getStoreComparison = async (req, res) => {
  try {
    if (!canViewStores(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const storeId = parseInt(req.params.storeId, 10);
    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({ success: false, error: 'Invalid storeId' });
    }

    const { q, conflict, page = 1, limit = 10 } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset   = (pageNum - 1) * limitNum;

    const conflictOnly =
      conflict === '1' || conflict === 'true' || conflict === 'yes';

    const store = await Store.findByPk(storeId, {
      attributes: ['storeId', 'code', 'name', 'location', 'status'],
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

    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }

    const allGroups = (store.groups || []).map((g) => ({
      id: g.groupId,
      code: g.code,
      name: g.name,
      status: g.status,
    }));

    const findByName = (name) =>
      allGroups.find(
        (g) => String(g.name || '').toLowerCase() === name.toLowerCase()
      );

    let groupA = findByName(GROUP_A_NAME);
    let groupB = findByName(GROUP_B_NAME);

    if (!groupA) groupA = allGroups[0];
    if (!groupB) groupB = allGroups.find((g) => g.id !== groupA?.id);

    if (!groupA || !groupB) {
      return res.json({
        success: true,
        data: {
          store: {
            id: store.storeId,
            code: store.code,
            name: store.name,
            location: store.location || '',
            status: normalizeStatus(store.status),
          },
          groups: [
            groupA ? { id: groupA.id, name: groupA.name } : { id: null, name: GROUP_A_NAME },
            groupB ? { id: groupB.id, name: groupB.name } : { id: null, name: GROUP_B_NAME },
          ],
          summary: { totalItems: 0, totalConflicts: 0, totalMatched: 0 },
          rows: [],
          pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 1, hasMore: false },
        },
      });
    }

    const balances = await StoreBalance.findAll({
      attributes: ['id', 'itemId', 'groupId', 'balance'],
      where: {
        storeId,
        groupId: { [Op.in]: [groupA.id, groupB.id] },
        status: 'Active',
      },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'code', 'name'],
          required: false,
          include: [
            {
              model: UOM,
              as: 'uom',
              attributes: ['code'],
              required: false,
            },
          ],
        },
      ],
    });

    const rowMap = new Map();

    balances.forEach((b) => {
      const itemId = b.itemId;
      const item = b.item || {};
      const key = String(itemId);

      if (!rowMap.has(key)) {
        rowMap.set(key, {
          key,
          itemId,
          itemCode: item.code || '',
          itemName: item.name || `Item ${itemId}`,
          uom: item.uom?.code || '',
          groupA: null,
          groupB: null,
        });
      }

      const row = rowMap.get(key);
      const amount = Number(b.balance) || 0;

      if (b.groupId === groupA.id) row.groupA = (row.groupA ?? 0) + amount;
      else if (b.groupId === groupB.id) row.groupB = (row.groupB ?? 0) + amount;
    });

    let rows = Array.from(rowMap.values()).map((r) => {
      const a = r.groupA ?? 0;
      const b = r.groupB ?? 0;
      const difference = Math.abs(a - b);
      const isConflict = difference !== 0;
      const differenceLabel = isConflict
        ? `-${difference.toLocaleString('en-US')}`
        : '0';

      return { ...r, groupA: a, groupB: b, difference, isConflict, differenceLabel };
    });

    const totalItems     = rows.length;
    const totalConflicts = rows.filter((r) => r.isConflict).length;
    const totalMatched   = totalItems - totalConflicts;

    const term = (q || '').trim().toLowerCase();
    if (term) {
      rows = rows.filter((r) =>
        String(r.itemName || '').toLowerCase().includes(term)
      );
    }

    if (conflictOnly) {
      rows = rows.filter((r) => r.isConflict);
    }

    const filteredTotal = rows.length;
    const totalPages    = Math.max(1, Math.ceil(filteredTotal / limitNum));
    const hasMore       = pageNum < totalPages;

    const pageRows = rows.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      data: {
        store: {
          id: store.storeId,
          code: store.code,
          name: store.name,
          location: store.location || '',
          status: normalizeStatus(store.status),
        },
        groups: [
          { id: groupA.id, name: groupA.name },
          { id: groupB.id, name: groupB.name },
        ],
        summary: { totalItems, totalConflicts, totalMatched },
        rows: pageRows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredTotal,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getStoreComparison error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to load store comparison',
    });
  }
};

// ================================================================
// STORE LIST — JSON EXPORT (single request)
//   GET /api/mobile/store-list/export
// ================================================================
exports.getStoreListExport = async (req, res) => {
  try {
    if (!canViewStores(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { status = 'active', q } = req.query;

    const where = {};

    if (status === 'active') {
      where.status = 'Active';
    } else if (status === 'inactive') {
      where.status = { [Op.in]: ['Inactive', 'Closed'] };
    }

    where.code = { [Op.notIn]: EXCLUDED_STORE_CODES };

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where[Op.or] = [
        { name:     { [Op.iLike]: term } },
        { code:     { [Op.iLike]: term } },
        { location: { [Op.iLike]: term } },
      ];
    }

    const stores = await Store.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: ['storeId', 'code', 'name', 'location', 'status'],
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

    if (!stores.length) {
      return res.json({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          summary: { totalStores: 0, totalItems: 0 },
          stores: [],
        },
      });
    }

    const storeIds = stores.map((s) => s.storeId);

    const groupsByStore = {};

    stores.forEach((s) => {
      const list = (s.groups || []).map((g) => ({
        id: g.groupId,
        code: g.code,
        name: g.name,
      }));

      const findByName = (name) =>
        list.find(
          (g) => String(g.name || '').toLowerCase() === name.toLowerCase()
        );

      let groupA = findByName(GROUP_A_NAME);
      let groupB = findByName(GROUP_B_NAME);
      if (!groupA) groupA = list[0];
      if (!groupB) groupB = list.find((g) => g.id !== groupA?.id);

      groupsByStore[s.storeId] = { all: list, groupA, groupB };
    });

    const balances = await StoreBalance.findAll({
      attributes: ['storeId', 'groupId', 'itemId', 'balance'],
      where: {
        storeId: { [Op.in]: storeIds },
        status: 'Active',
      },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'code', 'name'],
          required: false,
          include: [
            {
              model: UOM,
              as: 'uom',
              attributes: ['code'],
              required: false,
            },
          ],
        },
      ],
    });

    const rowsByStore = {};

    balances.forEach((b) => {
      const sid = b.storeId;
      const itemId = b.itemId;
      const item = b.item || {};

      if (!rowsByStore[sid]) rowsByStore[sid] = new Map();
      const map = rowsByStore[sid];

      const key = String(itemId);
      if (!map.has(key)) {
        map.set(key, {
          itemId,
          itemCode: item.code || '',
          itemName: item.name || `Item ${itemId}`,
          uom: item.uom?.code || '',
          groupA: 0,
          groupB: 0,
        });
      }

      const row = map.get(key);
      const amount = Number(b.balance) || 0;
      const { groupA, groupB } = groupsByStore[sid] || {};

      if (groupA && b.groupId === groupA.id) row.groupA += amount;
      else if (groupB && b.groupId === groupB.id) row.groupB += amount;
    });

    let totalItems = 0;

    const shapedStores = stores.map((s) => {
      const g = groupsByStore[s.storeId] || {};
      const rowMap = rowsByStore[s.storeId] || new Map();

      const rows = Array.from(rowMap.values()).map((r) => {
        const diff = Math.abs(r.groupA - r.groupB);
        return {
          itemId: r.itemId,
          itemCode: r.itemCode,
          itemName: r.itemName,
          uom: r.uom,
          groupA: r.groupA,
          groupB: r.groupB,
          difference: diff,
          isConflict: diff !== 0,
          differenceLabel:
            diff !== 0 ? `-${diff.toLocaleString('en-US')}` : '0',
        };
      });

      totalItems += rows.length;

      return {
        id: s.storeId,
        code: s.code,
        name: s.name,
        location: s.location || '',
        status: normalizeStatus(s.status),
        items: rows.length,
        groups: g.all || [],
        groupA: g.groupA ? { id: g.groupA.id, name: g.groupA.name } : null,
        groupB: g.groupB ? { id: g.groupB.id, name: g.groupB.name } : null,
        rows,
      };
    });

    return res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        summary: {
          totalStores: shapedStores.length,
          totalItems,
        },
        stores: shapedStores,
      },
    });
  } catch (error) {
    console.error('❌ [mobile] getStoreListExport error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to build store export',
    });
  }
};

// ================================================================
// STORE LIST — EXCEL EXPORT (server-side .xlsx via ExcelJS)
//   GET /api/mobile/store-list/export.xlsx
//   Query: ?status=active|inactive|all  &q=search
//
//   Streams a real .xlsx file:
//     - Sheet 1: Summary (all stores)
//     - One sheet per store with banner + info + comparison table
// ================================================================
exports.exportStoreListXlsx = async (req, res) => {
  try {
    if (!canViewStores(req)) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { status = 'active', q } = req.query;

    // ---------------------------------------------------------------
    // 1. Load matching stores
    // ---------------------------------------------------------------
    const where = {};

    if (status === 'active') {
      where.status = 'Active';
    } else if (status === 'inactive') {
      where.status = { [Op.in]: ['Inactive', 'Closed'] };
    }

    where.code = { [Op.notIn]: EXCLUDED_STORE_CODES };

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      where[Op.or] = [
        { name:     { [Op.iLike]: term } },
        { code:     { [Op.iLike]: term } },
        { location: { [Op.iLike]: term } },
      ];
    }

    const stores = await Store.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: ['storeId', 'code', 'name', 'location', 'status'],
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

    if (!stores.length) {
      return res.status(404).json({ success: false, error: 'No stores to export' });
    }

    const storeIds = stores.map((s) => s.storeId);

    // ---------------------------------------------------------------
    // 2. Pick group A/B per store
    // ---------------------------------------------------------------
    const groupsByStore = {};

    stores.forEach((s) => {
      const list = (s.groups || []).map((g) => ({
        id: g.groupId,
        code: g.code,
        name: g.name,
      }));

      const findByName = (name) =>
        list.find(
          (g) => String(g.name || '').toLowerCase() === name.toLowerCase()
        );

      let groupA = findByName(GROUP_A_NAME);
      let groupB = findByName(GROUP_B_NAME);
      if (!groupA) groupA = list[0];
      if (!groupB) groupB = list.find((g) => g.id !== groupA?.id);

      groupsByStore[s.storeId] = { all: list, groupA, groupB };
    });

    // ---------------------------------------------------------------
    // 3. Load ALL active StoreBalance rows
    // ---------------------------------------------------------------
    const balances = await StoreBalance.findAll({
      attributes: ['storeId', 'groupId', 'itemId', 'balance'],
      where: {
        storeId: { [Op.in]: storeIds },
        status: 'Active',
      },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['itemId', 'code', 'name'],
          required: false,
          include: [
            {
              model: UOM,
              as: 'uom',
              attributes: ['code'],
              required: false,
            },
          ],
        },
      ],
    });

    // ---------------------------------------------------------------
    // 4. Build per-store rows
    // ---------------------------------------------------------------
    const rowsByStore = {};

    balances.forEach((b) => {
      const sid = b.storeId;
      const itemId = b.itemId;
      const item = b.item || {};

      if (!rowsByStore[sid]) rowsByStore[sid] = new Map();
      const map = rowsByStore[sid];

      const key = String(itemId);
      if (!map.has(key)) {
        map.set(key, {
          itemId,
          itemCode: item.code || '',
          itemName: item.name || `Item ${itemId}`,
          uom: item.uom?.code || '',
          groupA: 0,
          groupB: 0,
        });
      }

      const row = map.get(key);
      const amount = Number(b.balance) || 0;
      const { groupA, groupB } = groupsByStore[sid] || {};

      if (groupA && b.groupId === groupA.id) row.groupA += amount;
      else if (groupB && b.groupId === groupB.id) row.groupB += amount;
    });

    const shapedStores = stores.map((s) => {
      const g = groupsByStore[s.storeId] || {};
      const rowMap = rowsByStore[s.storeId] || new Map();

      const rows = Array.from(rowMap.values()).map((r) => {
        const diff = Math.abs(r.groupA - r.groupB);
        return {
          itemId: r.itemId,
          itemCode: r.itemCode,
          itemName: r.itemName,
          uom: r.uom,
          groupA: r.groupA,
          groupB: r.groupB,
          difference: diff,
          isConflict: diff !== 0,
        };
      });

      return {
        id: s.storeId,
        code: s.code,
        name: s.name,
        location: s.location || '',
        status: normalizeStatus(s.status),
        items: rows.length,
        groups: g.all || [],
        groupA: g.groupA ? { id: g.groupA.id, name: g.groupA.name } : null,
        groupB: g.groupB ? { id: g.groupB.id, name: g.groupB.name } : null,
        rows,
      };
    });

    // ================================================================
    // 5. Build the workbook
    // ================================================================
    const workbook = new ExcelJS.Workbook();
    workbook.creator = COMPANY_NAME;
    workbook.created = new Date();

    const usedSheetNames = new Set();
    const dateLabel = formatDateTimeLong(new Date());

    // ----------------------------------------------------------------
    // 5a. Summary sheet
    // ----------------------------------------------------------------
    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.mergeCells('A1:H1');
    const sBanner = summarySheet.getCell('A1');
    sBanner.value = COMPANY_NAME;
    sBanner.font = { bold: true, size: 18, color: { argb: C.banner } };
    sBanner.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 32;

    summarySheet.mergeCells('A2:H2');
    const sSlogan = summarySheet.getCell('A2');
    sSlogan.value = COMPANY_TAGLINE;
    sSlogan.font = { bold: true, size: 12, color: { argb: C.slogan } };
    sSlogan.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(2).height = 22;

    summarySheet.mergeCells('A3:H3');
    const sTitle = summarySheet.getCell('A3');
    sTitle.value = 'STORES — BALANCE COMPARISON SUMMARY';
    sTitle.font = { bold: true, size: 14, color: { argb: C.banner } };
    sTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(3).height = 24;

    summarySheet.mergeCells('A4:H4');
    const sGenerated = summarySheet.getCell('A4');
    sGenerated.value = `Generated: ${dateLabel}`;
    sGenerated.font = { italic: true, size: 10, color: { argb: C.slogan } };
    sGenerated.alignment = { horizontal: 'center', vertical: 'middle' };

    summarySheet.addRow([]);

    const summaryHeader = summarySheet.addRow([
      '#', 'Code', 'Store', 'Location', 'Status', 'Items', 'Conflicts', 'Matched',
    ]);
    summaryHeader.height = 24;
    summaryHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: C.headerFg }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder(C.borderHdr);
    });

    shapedStores.forEach((store, idx) => {
      const conflicts = store.rows.filter((r) => r.isConflict).length;
      const matched = store.rows.length - conflicts;
      const isConflict = conflicts > 0;
      const zebra = idx % 2 === 1;

      const row = summarySheet.addRow([
        idx + 1,
        store.code || '',
        store.name || '',
        store.location || '',
        store.status || '',
        store.rows.length,
        conflicts,
        matched,
      ]);

      row.eachCell((cell, col) => {
        cell.border = thinBorder(C.border);

        if (isConflict) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.conflictBg } };
        } else if (zebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.zebra } };
        }

        if (col === 1 || col === 5 || col === 6 || col === 7 || col === 8) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        if (col === 6 || col === 7 || col === 8) {
          cell.numFmt = '#,##0';
        }
      });

      // Conflicts pill
      const conflictCell = row.getCell(7);
      if (conflicts > 0) {
        conflictCell.font = { bold: true, color: { argb: C.conflictPillFg } };
        conflictCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.conflictPillBg } };
      } else {
        conflictCell.font = { bold: true, color: { argb: C.matchPillFg } };
        conflictCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.matchPillBg } };
      }

      row.getCell(8).font = { color: { argb: C.matchPillFg } };
    });

    summarySheet.columns = [
      { width: 5 }, { width: 14 }, { width: 34 }, { width: 24 },
      { width: 10 }, { width: 10 }, { width: 12 }, { width: 10 },
    ];
    summarySheet.views = [{ state: 'frozen', ySplit: 6 }];

    // ----------------------------------------------------------------
    // 5b. One sheet per store
    // ----------------------------------------------------------------
    for (const store of shapedStores) {
      const sheetName = makeSheetName(store, usedSheetNames);
      const sheet = workbook.addWorksheet(sheetName);

      const rows = store.rows;
      const matchedItems = rows.filter((r) => !r.isConflict).length;
      const diffItems = rows.length - matchedItems;

      // Banner
      sheet.mergeCells('A1:F1');
      const banner = sheet.getCell('A1');
      banner.value = COMPANY_NAME;
      banner.font = { bold: true, size: 20, color: { argb: C.banner } };
      banner.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 34;

      // Slogan
      sheet.mergeCells('A2:F2');
      const slogan = sheet.getCell('A2');
      slogan.value = COMPANY_TAGLINE;
      slogan.font = { bold: true, size: 12, color: { argb: C.slogan } };
      slogan.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 22;

      // Store name bar
      sheet.mergeCells('A3:F3');
      const nameCell = sheet.getCell('A3');
      nameCell.value = store.name || 'Store';
      nameCell.font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
      nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      nameCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(3).height = 24;

      // Info row 1
      const i1 = sheet.getRow(4);
      i1.getCell(1).value = 'Total Items:';
      i1.getCell(1).font = { bold: true, size: 11, color: { argb: C.infoLabel } };
      i1.getCell(2).value = rows.length;
      i1.getCell(2).font = { bold: true, size: 11, color: { argb: C.infoValue } };
      i1.getCell(3).value = 'Matched Items:';
      i1.getCell(3).font = { bold: true, size: 11, color: { argb: C.infoLabel } };
      i1.getCell(4).value = matchedItems;
      i1.getCell(4).font = { bold: true, size: 11, color: { argb: C.infoValue } };
      i1.getCell(5).value = 'Date/Time:';
      i1.getCell(5).font = { bold: true, size: 11, color: { argb: C.infoLabel } };
      i1.getCell(6).value = dateLabel;
      i1.getCell(6).font = { bold: true, size: 11, color: { argb: C.infoValue } };
      sheet.getRow(4).height = 20;

      // Info row 2
      const i2 = sheet.getRow(5);
      i2.getCell(1).value = 'Active Items:';
      i2.getCell(1).font = { bold: true, size: 11, color: { argb: C.infoLabel } };
      i2.getCell(2).value = rows.length;
      i2.getCell(2).font = { bold: true, size: 11, color: { argb: C.infoValue } };
      i2.getCell(3).value = 'Items with Difference:';
      i2.getCell(3).font = { bold: true, size: 11, color: { argb: C.infoLabel } };
      i2.getCell(4).value = diffItems;
      i2.getCell(4).font = { bold: true, size: 11, color: { argb: C.infoValue } };
      sheet.getRow(5).height = 20;

      // Spacer
      sheet.addRow([]);

      // Header
      const header = sheet.addRow([
        'Item Code',
        'Item Name',
        'UOM',
        store.groupA?.name || 'Group A',
        store.groupB?.name || 'Group B',
        'Diff',
      ]);
      header.height = 22;
      header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: C.headerFg }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder(C.borderHdr);
      });

      sheet.columns = [
        { width: 16 }, { width: 40 }, { width: 8 },
        { width: 26 }, { width: 26 }, { width: 10 },
      ];

      // Data rows
      rows.forEach((r, i) => {
        const zebra = i % 2 === 1;
        const isConflict = r.isConflict;

        const row = sheet.addRow([
          r.itemCode || '',
          isConflict ? `⚠ ${r.itemName}` : r.itemName,
          r.uom || '',
          Number(r.groupA) || 0,
          Number(r.groupB) || 0,
          Number(r.difference) || 0,
        ]);

        row.eachCell((cell, col) => {
          cell.border = thinBorder(C.border);

          if (isConflict) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.conflictBg } };
          } else if (zebra) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.zebra } };
          }

          if (col === 1 || col === 2) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else if (col === 3) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          }
        });

        if (isConflict) {
          row.getCell(2).font = { bold: true, color: { argb: C.conflictFg } };
        }

        const diffCell = row.getCell(6);
        const diffVal = Number(r.difference) || 0;
        diffCell.font = {
          bold: true, size: 12,
          color: { argb: diffVal !== 0 ? C.diffRed : C.diffGreen },
        };
        diffCell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: diffVal !== 0 ? C.diffRedBg : C.diffGreenBg },
        };
      });

      sheet.views = [{ state: 'frozen', ySplit: 7 }];
    }

    // ================================================================
    // 6. Stream the file
    // ================================================================
    const filename = `Stores_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ [mobile] exportStoreListXlsx error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export store list',
      });
    }
  }
};