'use strict';

const { Op } = require('sequelize');
const path = require('path');
const db = require('../models');
const { PurchaseRequest, PurchaseRequestItem } = db;
const { buildFileUrl } = require('../utils/buildFileUrl');   // ← ADD
// ================================================================
// HELPERS
// ================================================================

// ✅ Join the master `items` table so `name` comes from there.
const ITEMS_INCLUDE = {
  model: PurchaseRequestItem,
  as: 'items',
  include: [
    {
      model: db.Item,
      as: 'item',
      attributes: ['name'],
      required: false,
    },
  ],
};

// ✅ Join the creator so we can resolve preparedBy (which stores the user id)
//    Only includes columns that actually exist on `users`.
const CREATOR_INCLUDE = {
  model: db.User,
  as: 'createdBy',
  attributes: ['userId', 'fullName', 'username'],   // ✅ valid columns only
  required: false,
};


/**
 * Builds an absolute URL for an approved purchase-request document.
 * Works for both web and mobile — no client-side resolution needed.
 */
const buildUploadUrl = (file) => {
  if (!file) return null;
  return buildFileUrl(`/uploads/purchase-requests/approved/${file.filename}`);
};

/**
 * Check if the current request's user is an admin.
 */
const isAdminRequest = (req) => {
  const user = req.user || {};
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? '').toLowerCase();
  return role === 'admin' || role === 'administrator' || role === 'superadmin';
};

/**
 * Serialize a PurchaseRequest for the frontend.
 * ✅ Resolves preparedBy → name (id stored as string) using the joined creator.
 */
const toDto = (pr) => {
  const plain = pr.toJSON ? pr.toJSON() : pr;

  // --- Resolve preparedBy → name ---
  const rawPreparedBy = String(plain.preparedBy ?? '').trim();
  const looksLikeId = /^\d+$/.test(rawPreparedBy);

  let preparedByName = null;
  if (looksLikeId) {
    const cb = plain.createdBy;
    // Match by userId (model field) OR the raw id directly
    if (cb && String(cb.userId) === rawPreparedBy) {
      preparedByName =
        cb.fullName ||
        cb.username ||
        rawPreparedBy;
    } else {
      preparedByName = rawPreparedBy;   // no creator joined → fall back to id
    }
  } else {
    preparedByName = rawPreparedBy || null;   // legacy rows storing a name
  }

  return {
    id: plain.id,
    prNumber: plain.prNumber,
    department: plain.department,
    expertName: plain.expertName,
    preparedBy: preparedByName,               // 👈 name for the UI
    preparedById: rawPreparedBy || null,      // 👈 raw id (optional)
    createdById: plain.createdById ?? null,   // 👈 FK to users.user_id
    requestedDate: plain.requestedDate,
    priority: plain.priority,
    status: plain.status,

    items: (plain.items || []).map((it) => ({
      id: it.id,
      code: it.code,
      name: it.item?.name ?? it.code,
      brand: it.brand,
      model: it.model,
      uom: it.uom,
      baseUom: it.baseUom,
      conversionUom: it.conversionUom,
      quantity: it.quantity,
      specification: it.specification,
      remark: it.remark,
    })),

    createdAt: plain.created_at || plain.createdAt,
    updatedAt: plain.updated_at || plain.updatedAt,
    approvedDocFront: plain.approvedDocFront,
    approvedDocFrontName: plain.approvedDocFrontName,
    approvedDocBack: plain.approvedDocBack,
    approvedDocBackName: plain.approvedDocBackName,
  };
};

/**
 * Ensure every `code` in the payload exists in the master items table.
 */
const findUnknownItemCodes = async (items, transaction) => {
  const codes = items
    .map((it) => it.code)
    .filter((c) => c != null && String(c).trim() !== '');

  if (codes.length === 0) return [];

  const existing = await db.Item.findAll({
    where: { code: { [Op.in]: codes } },
    attributes: ['code'],
    transaction,
  });

  const existingSet = new Set(existing.map((i) => i.code));
  return codes.filter((c) => !existingSet.has(c));
};

// ================================================================
// 1. LIST  —  GET /api/purchase-requests
// ================================================================
exports.listPurchaseRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      priority = 'all',
      department = 'all',
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    const where = {};

    // ✅ Non-admins only see their own requests
    const isAdmin = isAdminRequest(req);
    if (!isAdmin) {
      where.createdById = req.user?.userId ?? -1;
    }

    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;
    if (department && department !== 'all') where.department = department;

    if (search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { prNumber: { [Op.iLike]: `%${q}%` } },
        { department: { [Op.iLike]: `%${q}%` } },
        { expertName: { [Op.iLike]: `%${q}%` } },
        // ✅ Search creator's name (preparedBy stores the user id now)
        { '$createdBy.fullName$': { [Op.iLike]: `%${q}%` } },
        { '$createdBy.username$': { [Op.iLike]: `%${q}%` } },
        // ✅ Search joined master item's name & code
        { '$items.item.name$': { [Op.iLike]: `%${q}%` } },
        { '$items.code$': { [Op.iLike]: `%${q}%` } },
      ];
    }

    const sortMap = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      prNumber: 'pr_number',
      requestedDate: 'requested_date',
      priority: 'priority',
      status: 'status',
    };
    const sortColumn = sortMap[sortBy] || 'created_at';

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      order: [[sortColumn, sortOrder.toUpperCase()]],
      offset,
      limit: pageSize,
      distinct: true,
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE],   // 👈 added CREATOR_INCLUDE
    });

    res.json({
      success: true,
      data: {
        items: rows.map(toDto),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listPurchaseRequests error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list purchase requests',
    });
  }
};

// ================================================================
// 2. GET ONE  —  GET /api/purchase-requests/:id
// ================================================================
exports.getPurchaseRequestById = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE],   // 👈 added CREATOR_INCLUDE
    });

    if (!pr) {
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    // ✅ Ownership guard: non-admins can only view their own
    if (
      !isAdminRequest(req) &&
      Number(pr.createdById) !== Number(req.user?.userId)
    ) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this purchase request',
      });
    }

    res.json({ success: true, data: toDto(pr) });
  } catch (error) {
    console.error('❌ getPurchaseRequestById error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 3. CREATE  —  POST /api/purchase-requests
// ================================================================
exports.createPurchaseRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      department = null,
      expertName = null,
      preparedBy: clientPreparedBy = null,
      requestedDate = null,
      priority = 'medium',
      items = [],
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'At least one item is required',
      });
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Invalid priority',
      });
    }

    const unknown = await findUnknownItemCodes(items, t);
    if (unknown.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Unknown item code(s): ${unknown.join(', ')}`,
      });
    }

    const prNumber = await PurchaseRequest.generatePRNumber(t);

    // ✅ preparedBy = logged-in user's id (string)
    const preparedBy =
      req.user?.userId != null
        ? String(req.user.userId)
        : clientPreparedBy || null;

    const pr = await PurchaseRequest.create(
      {
        prNumber,
        department,
        expertName,
        preparedBy,
        requestedDate:
          requestedDate || new Date().toISOString().split('T')[0],
        priority,
        status: 'draft',
        createdById: req.user?.userId ?? null,
      },
      { transaction: t }
    );

    await PurchaseRequestItem.bulkCreate(
      items.map((it) => ({
        requestId: pr.id,
        code: it.code,
        brand: it.brand || null,
        model: it.model || null,
        uom: it.uom,
        baseUom: it.baseUom || it.uom,
        conversionUom: it.conversionUom || null,
        quantity: it.quantity,
        specification: it.specification || null,
        remark: it.remark || null,
      })),
      { transaction: t }
    );

    await t.commit();

    const complete = await PurchaseRequest.findByPk(pr.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE],
    });

    res.status(201).json({
      success: true,
      message: 'Purchase request created successfully',
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ createPurchaseRequest error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create purchase request',
    });
  }
};

// ================================================================
// 4. UPDATE  —  PUT /api/purchase-requests/:id
// ================================================================
exports.updatePurchaseRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      department,
      expertName,
      preparedBy,
      requestedDate,
      priority,
      items,
    } = req.body;

    const pr = await PurchaseRequest.findByPk(id, { transaction: t });
    if (!pr) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    if (pr.status === 'approved') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Cannot edit an approved purchase request',
      });
    }

    // ✅ Ownership guard: non-admins can only edit their own
    const isAdmin = isAdminRequest(req);
    if (!isAdmin && Number(pr.createdById) !== Number(req.user?.userId)) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this purchase request',
      });
    }

    const updates = {};
    if (department !== undefined) updates.department = department;
    if (expertName !== undefined) updates.expertName = expertName;

    // ✅ preparedBy: admin can change, non-admin is locked to their own id
    if (isAdmin) {
      if (preparedBy !== undefined) updates.preparedBy = preparedBy;
    } else {
      updates.preparedBy =
        req.user?.userId != null ? String(req.user.userId) : pr.preparedBy;
    }

    if (requestedDate !== undefined) updates.requestedDate = requestedDate;
    if (priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, error: 'Invalid priority' });
      }
      updates.priority = priority;
    }

    await pr.update(updates, { transaction: t });

    if (Array.isArray(items)) {
      const unknown = await findUnknownItemCodes(items, t);
      if (unknown.length > 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: `Unknown item code(s): ${unknown.join(', ')}`,
        });
      }

      await PurchaseRequestItem.destroy({
        where: { requestId: pr.id },
        transaction: t,
      });

      if (items.length > 0) {
        await PurchaseRequestItem.bulkCreate(
          items.map((it) => ({
            requestId: pr.id,
            code: it.code,
            brand: it.brand || null,
            model: it.model || null,
            uom: it.uom,
            baseUom: it.baseUom || it.uom,
            conversionUom: it.conversionUom || null,
            quantity: it.quantity,
            specification: it.specification || null,
            remark: it.remark || null,
          })),
          { transaction: t }
        );
      }
    }

    await t.commit();

    const complete = await PurchaseRequest.findByPk(pr.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE],   // 👈 added CREATOR_INCLUDE
    });

    res.json({
      success: true,
      message: 'Purchase request updated successfully',
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ updatePurchaseRequest error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update purchase request',
    });
  }
};

// ================================================================
// 5. APPROVE (with files)  —  POST /api/purchase-requests/approve
// ================================================================
exports.approvePurchaseRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { prId, prNumber } = req.body;
    const front = req.files?.approvedDocFront?.[0];
    const back = req.files?.approvedDocBack?.[0];

    if (!prId) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'prId is required' });
    }

    if (!front || !back) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Both front and back documents are required',
      });
    }

    const pr = await PurchaseRequest.findByPk(prId, { transaction: t });
    if (!pr) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    if (pr.status === 'approved') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Purchase request is already approved',
      });
    }

    // ✅ Ownership guard: non-admins can only approve their own
    if (
      !isAdminRequest(req) &&
      Number(pr.createdById) !== Number(req.user?.userId)
    ) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to approve this purchase request',
      });
    }

    const frontUrl = buildUploadUrl(front);
    const backUrl = buildUploadUrl(back);

    await pr.update(
      {
        status: 'approved',
        approvedAt: new Date(),
        approvedDocFront: frontUrl,
        approvedDocFrontName:
          front.originalname || path.basename(front.filename),
        approvedDocBack: backUrl,
        approvedDocBackName:
          back.originalname || path.basename(back.filename),
      },
      { transaction: t }
    );

    await t.commit();

    const complete = await PurchaseRequest.findByPk(pr.id, {
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE],   // 👈 added CREATOR_INCLUDE
    });

    console.log('✅ Purchase request approved:', {
      prNumber: complete.prNumber,
      front: frontUrl,
      back: backUrl,
    });

    res.json({
      success: true,
      message: `✅ ${prNumber || complete.prNumber} approved and dispatched`,
      data: toDto(complete),
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ approvePurchaseRequest error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve purchase request',
    });
  }
};

// ================================================================
// 6. DELETE  —  DELETE /api/purchase-requests/:id
// ================================================================
exports.deletePurchaseRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      transaction: t,
    });
    if (!pr) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Purchase request not found',
      });
    }

    if (pr.status === 'approved') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Cannot delete an approved purchase request',
      });
    }

    // ✅ Ownership guard
    if (
      !isAdminRequest(req) &&
      Number(pr.createdById) !== Number(req.user?.userId)
    ) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this purchase request',
      });
    }

    await pr.destroy({ transaction: t });
    await t.commit();

    res.json({
      success: true,
      message: `Purchase request "${pr.prNumber}" deleted`,
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ deletePurchaseRequest error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 7. STATS  —  GET /api/purchase-requests/stats
// ================================================================
exports.getPurchaseRequestStats = async (req, res) => {
  try {
    // ✅ Scope counts to the user's own requests for non-admins
    const baseWhere = isAdminRequest(req)
      ? {}
      : { createdById: req.user?.userId ?? -1 };

    const [total, drafts, approved] = await Promise.all([
      PurchaseRequest.count({ where: baseWhere }),
      PurchaseRequest.count({ where: { ...baseWhere, status: 'draft' } }),
      PurchaseRequest.count({ where: { ...baseWhere, status: 'approved' } }),
    ]);

    res.json({
      success: true,
      data: { total, drafts, approved },
    });
  } catch (error) {
    console.error('❌ getPurchaseRequestStats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 8. CHECK BALANCE  —  POST /api/purchase-requests/check-balance
// ================================================================
exports.checkBalance = async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'items array is required',
      });
    }

    const results = [];

    for (const reqItem of items) {
      const code = String(reqItem.code || '').trim();
      const requestedQty = Number(reqItem.quantity) || 0;
      if (!code) continue;

      const item = await db.Item.findOne({
        where: { code },
        attributes: ['itemId', 'code', 'name', 'standardName'],
        include: [
          {
            model: db.UOM,
            as: 'uom',
            attributes: ['id', 'code', 'name'],
            required: false,
          },
        ],
      });

      if (!item) {
        results.push({
          code,
          name: code,
          requestedQuantity: requestedQty,
          hasBalance: false,
          stores: [],
          reason: 'Item not found in master items',
        });
        continue;
      }

      const balances = await db.ConvertedBalance.findAll({
        where: {
          itemId: item.itemId,
          convertedBalance: { [Op.gt]: 0 },
        },
        include: [
          {
            model: db.Store,
            as: 'store',
            attributes: ['storeId', 'name', 'code'],
          },
          {
            model: db.Group,
            as: 'group',
            attributes: ['groupId', 'name', 'code'],
          },
        ],
      });

      const itemUom = item.uom?.code || null;

      const stores = balances.map((b) => ({
        storeId: b.storeId,
        storeName: b.store?.name || 'Unknown Store',
        storeCode: b.store?.code || '',
        groupId: b.groupId,
        groupName: b.group?.name || 'Unknown Group',
        balance: Number(b.convertedBalance) || 0,
        uom: itemUom,
      }));

      results.push({
        code: item.code,
        name: item.name || item.standardName || item.code,
        requestedQuantity: requestedQty,
        hasBalance: stores.length > 0,
        stores,
      });
    }

    const itemsWithBalance = results.filter((r) => r.hasBalance);

    res.json({
      success: true,
      data: {
        hasAnyBalance: itemsWithBalance.length > 0,
        itemsWithBalance,
        allResults: results,
      },
    });
  } catch (error) {
    console.error('❌ checkBalance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check balance',
    });
  }
};



// ================================================================
// 1b. LIST APPROVED  —  GET /api/purchase-requests/approved
//     Same filters as listPurchaseRequests but forces status='approved'
//     and scopes to the current user (unless admin).
// ================================================================
exports.listApprovedPurchaseRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      priority = 'all',
      department = 'all',
      dateFrom = '',
      dateTo = '',
      dateField = 'updated_at',
      sortBy = 'updated_at',            // default sort = approval date
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const offset = (pageNum - 1) * pageSize;

    const where = { status: 'approved' };   // 🔒 always approved

    // ✅ Non-admins only see their own approved requests
    

    if (priority && priority !== 'all') where.priority = priority;
    if (department && department !== 'all') where.department = department;

    // ================================================================
    // ✅ DATE RANGE FILTER
    // ================================================================
    const dateColumnMap = {
      created_at: 'created_at',
      updated_at: 'updated_at',
      approved_at: 'approved_at',
      requested_date: 'requested_date',
    };
    const dateColumn = dateColumnMap[dateField] || 'updated_at';

    if (dateFrom && dateTo) {
      where[dateColumn] = {
        [Op.gte]: new Date(`${dateFrom}T00:00:00.000Z`),
        [Op.lte]: new Date(`${dateTo}T23:59:59.999Z`),
      };
    } else if (dateFrom) {
      where[dateColumn] = {
        [Op.gte]: new Date(`${dateFrom}T00:00:00.000Z`),
      };
    } else if (dateTo) {
      where[dateColumn] = {
        [Op.lte]: new Date(`${dateTo}T23:59:59.999Z`),
      };
    }

    if (search.trim()) {
      const q = search.trim();
      where[Op.or] = [
        { prNumber: { [Op.iLike]: `%${q}%` } },
        { department: { [Op.iLike]: `%${q}%` } },
        { expertName: { [Op.iLike]: `%${q}%` } },
        { '$createdBy.fullName$': { [Op.iLike]: `%${q}%` } },
        { '$createdBy.username$': { [Op.iLike]: `%${q}%` } },
        { '$items.item.name$': { [Op.iLike]: `%${q}%` } },
        { '$items.code$': { [Op.iLike]: `%${q}%` } },
      ];
    }

    const sortMap = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      approvedAt: 'approved_at',
      prNumber: 'pr_number',
      requestedDate: 'requested_date',
      priority: 'priority',
      status: 'status',
    };
    const sortColumn = sortMap[sortBy] || 'updated_at';

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      order: [[sortColumn, sortOrder.toUpperCase()]],
      offset,
      limit: pageSize,
      distinct: true,
      include: [ITEMS_INCLUDE, CREATOR_INCLUDE],
    });

    res.json({
      success: true,
      data: {
        items: rows.map(toDto),
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize) || 1,
      },
    });
  } catch (error) {
    console.error('❌ listApprovedPurchaseRequests error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list approved purchase requests',
    });
  }
};