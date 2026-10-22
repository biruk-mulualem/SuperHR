// controllers/printOverrideController.js
'use strict';

const db = require('../models');
const { PrintOverride, ItemRequest, User } = db;

// ================================================================
// HELPERS
// ================================================================

/**
 * Whitelist client-supplied fields.
 * Only these keys are ever written to the DB.
 */
function sanitizePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};

  const ALLOWED = [
    'department',
    'approvedByName',
    'overrideDate',
    'customHeader',
    'sectionVisibility',
    'columnsConfig',
    'customCells',
  ];

  const clean = {};

  for (const key of ALLOWED) {
    if (body[key] === undefined) continue;

    // Treat empty strings as "clear" → null
    if (typeof body[key] === 'string' && body[key].trim() === '') {
      clean[key] = null;
      continue;
    }

    clean[key] = body[key];
  }

  return clean;
}

/**
 * Resolve the override scope for a user.
 *   - If a user-specific row exists, use it.
 *   - Otherwise, fall back to the shared row (user_id IS NULL).
 * Returns the matching row or null.
 */
async function findOverrideForUser(requestId, userId, transaction = null) {
  // 1. Try the user-specific row first
  if (userId) {
    const userRow = await PrintOverride.findOne({
      where: { requestId, userId },
      transaction,
    });
    if (userRow) return userRow;
  }

  // 2. Fall back to the shared row
  const sharedRow = await PrintOverride.findOne({
    where: { requestId, userId: null },
    transaction,
  });
  return sharedRow;
}

// ================================================================
// 1. GET PRINT OVERRIDE FOR A REQUEST
// GET /api/item-requests/:requestId/print-override
// ================================================================
exports.getPrintOverride = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId || null;

    // Confirm the request exists
    const request = await ItemRequest.findByPk(requestId, {
      attributes: ['requestId', 'requestCode'],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    const row = await findOverrideForUser(requestId, userId);

    if (!row) {
      return res.json({
        success: true,
        data: null,
        message: 'No print override saved for this request yet',
      });
    }

    res.json({
      success: true,
      data: row,
    });
  } catch (error) {
    console.error('❌ Get print override error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch print override',
    });
  }
};

// ================================================================
// 2. CREATE PRINT OVERRIDE (fails if one already exists)
// POST /api/item-requests/:requestId/print-override
// ================================================================
exports.createPrintOverride = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId || null;

    const request = await ItemRequest.findByPk(requestId, {
      attributes: ['requestId', 'requestCode'],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    const existing = await PrintOverride.findOne({
      where: { requestId, userId },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A print override already exists for this request',
        data: existing,
      });
    }

    const payload = sanitizePayload(req.body);

    const row = await PrintOverride.create({
      requestId,
      userId,
      updatedBy: userId,
      ...payload,
    });

    console.log(
      `🆕 [PRINT OVERRIDE] Created for request ${requestId}, user ${userId || 'shared'}`
    );

    res.status(201).json({
      success: true,
      message: 'Print override created',
      data: row,
    });
  } catch (error) {
    console.error('❌ Create print override error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create print override',
    });
  }
};

// ================================================================
// 3. UPDATE PRINT OVERRIDE (fails if none exists)
// PUT /api/item-requests/:requestId/print-override
// ================================================================
exports.updatePrintOverride = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId || null;

    const row = await PrintOverride.findOne({
      where: { requestId, userId },
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Print override not found for this request',
      });
    }

    const payload = sanitizePayload(req.body);

    await row.update({
      ...payload,
      updatedBy: userId,
    });

    console.log(
      `✏️ [PRINT OVERRIDE] Updated for request ${requestId}, user ${userId || 'shared'}`
    );

    res.json({
      success: true,
      message: 'Print override updated',
      data: row,
    });
  } catch (error) {
    console.error('❌ Update print override error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update print override',
    });
  }
};

// ================================================================
// 4. UPSERT PRINT OVERRIDE (create-or-update in one call)
// POST /api/item-requests/:requestId/print-override/upsert
// ================================================================
exports.upsertPrintOverride = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { requestId } = req.params;
    const userId = req.user?.userId || null;

    const request = await ItemRequest.findByPk(requestId, {
      attributes: ['requestId', 'requestCode'],
      transaction: t,
    });

    if (!request) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    const payload = sanitizePayload(req.body);

    let row = await PrintOverride.findOne({
      where: { requestId, userId },
      transaction: t,
    });

    let action = 'updated';

    if (row) {
      await row.update(
        {
          ...payload,
          updatedBy: userId,
        },
        { transaction: t }
      );
    } else {
      row = await PrintOverride.create(
        {
          requestId,
          userId,
          updatedBy: userId,
          ...payload,
        },
        { transaction: t }
      );
      action = 'created';
    }

    await t.commit();

    console.log(
      `💾 [PRINT OVERRIDE] Upsert → ${action} for request ${requestId}, user ${userId || 'shared'}`
    );

    res.json({
      success: true,
      message: `Print override ${action}`,
      data: row,
    });
  } catch (error) {
    await t.rollback();
    console.error('❌ Upsert print override error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save print override',
    });
  }
};

// ================================================================
// 5. DELETE PRINT OVERRIDE (reset to defaults)
// DELETE /api/item-requests/:requestId/print-override
// ================================================================
exports.deletePrintOverride = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.userId || null;

    const row = await PrintOverride.findOne({
      where: { requestId, userId },
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Print override not found for this request',
      });
    }

    await row.destroy();

    console.log(
      `🗑️ [PRINT OVERRIDE] Deleted for request ${requestId}, user ${userId || 'shared'}`
    );

    res.json({
      success: true,
      message: 'Print override deleted',
    });
  } catch (error) {
    console.error('❌ Delete print override error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete print override',
    });
  }
};

// ================================================================
// 6. LIST ALL PRINT OVERRIDES (admin)
// GET /api/item-requests/print-overrides
// ================================================================
exports.listPrintOverrides = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      requestId = null,
      userId = null,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (requestId) where.requestId = parseInt(requestId);
    if (userId) where.userId = parseInt(userId);

    const { count, rows } = await PrintOverride.findAndCountAll({
      where,
      include: [
        {
          model: ItemRequest,
          as: 'request',
          attributes: ['requestId', 'requestCode'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'fullName'],
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['userId', 'username', 'fullName'],
        },
      ],
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        overrides: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('❌ List print overrides error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list print overrides',
    });
  }
};

// ================================================================
// 7. GET BY ID (admin)
// GET /api/item-requests/print-overrides/:id
// ================================================================
exports.getPrintOverrideById = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await PrintOverride.findByPk(id, {
      include: [
        {
          model: ItemRequest,
          as: 'request',
          attributes: ['requestId', 'requestCode'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'fullName'],
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['userId', 'username', 'fullName'],
        },
      ],
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Print override not found',
      });
    }

    res.json({
      success: true,
      data: row,
    });
  } catch (error) {
    console.error('❌ Get print override by id error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch print override',
    });
  }
};