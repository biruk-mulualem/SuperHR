'use strict';

const { Op } = require('sequelize');
const {
  ItemRelationship,
  Item,
  UOM,
  sequelize,
} = require('../models');

// ================================================================
// HELPERS
// ================================================================

/**
 * Reusable include for the two item sides.
 */
const ITEM_INCLUDE = (as) => ({
  model: Item,
  as,
  attributes: ['itemId', 'code', 'name', 'standardName', 'status'],
  include: [
    { model: UOM, as: 'uom', attributes: ['code', 'name'] },
  ],
});

const FULL_INCLUDE = [
  ITEM_INCLUDE('itemA'),
  ITEM_INCLUDE('itemB'),
];

/**
 * Validate that both item IDs exist, are distinct, and are Active.
 * Returns { ok, itemA, itemB, error }.
 */
async function validateItems(itemAId, itemBId, transaction = null) {
  if (!itemAId || !itemBId) {
    return { ok: false, error: 'Both item codes are required.' };
  }
  if (Number(itemAId) === Number(itemBId)) {
    return { ok: false, error: 'Item A and Item B cannot be the same.' };
  }

  const items = await Item.findAll({
    where: { itemId: { [Op.in]: [Number(itemAId), Number(itemBId)] } },
    transaction,
  });

  const itemA = items.find((i) => i.itemId === Number(itemAId));
  const itemB = items.find((i) => i.itemId === Number(itemBId));

  if (!itemA) return { ok: false, error: `Item A (${itemAId}) not found.` };
  if (!itemB) return { ok: false, error: `Item B (${itemBId}) not found.` };
  if (itemA.status !== 'Active')
    return { ok: false, error: `Item A (${itemA.code}) is ${itemA.status}.` };
  if (itemB.status !== 'Active')
    return { ok: false, error: `Item B (${itemB.code}) is ${itemB.status}.` };

  return { ok: true, itemA, itemB };
}

// ================================================================
// 1. LIST
// GET /api/item-relationships
// Query: ?search=&status=&page=&limit=
// ================================================================
exports.getAll = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;

    const where = {};
    if (status && status !== 'all') where.status = status;

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { relationshipCode: { [Op.iLike]: term } },
        { remark: { [Op.iLike]: term } },
        { '$itemA.code$': { [Op.iLike]: term } },
        { '$itemA.name$': { [Op.iLike]: term } },
        { '$itemB.code$': { [Op.iLike]: term } },
        { '$itemB.name$': { [Op.iLike]: term } },
      ];
    }

    const findOptions = {
      where,
      include: FULL_INCLUDE,
      order: [['id', 'DESC']],
      distinct: true,
      subQuery: false,
    };

    if (page && limit) {
      findOptions.limit = parseInt(limit, 10);
      findOptions.offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    }

    const { count, rows } = await ItemRelationship.findAndCountAll(findOptions);

    res.json({
      success: true,
      data: rows.map((r) => r.toApiJSON()),
      pagination:
        page && limit
          ? {
              page: parseInt(page, 10),
              limit: parseInt(limit, 10),
              total: count,
              totalPages: Math.ceil(count / parseInt(limit, 10)),
            }
          : undefined,
    });
  } catch (err) {
    console.error('❌ getAll item relationships:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 2. GET ONE
// GET /api/item-relationships/:id
// ================================================================
exports.getById = async (req, res) => {
  try {
    const row = await ItemRelationship.findByPk(req.params.id, {
      include: FULL_INCLUDE,
    });
    if (!row) {
      return res
        .status(404)
        .json({ success: false, error: 'Relationship not found.' });
    }
    res.json({ success: true, data: row.toApiJSON() });
  } catch (err) {
    console.error('❌ getById item relationship:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 3. CREATE
// POST /api/item-relationships
// Body: { itemAId, itemBId, remark? }
// NOTE: relationshipCode is generated server-side — never accepted.
// ================================================================
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemAId, itemBId, remark } = req.body;
    const userId = req.user?.userId || null;

    const v = await validateItems(itemAId, itemBId, t);
    if (!v.ok) {
      await t.rollback();
      return res.status(400).json({ success: false, error: v.error });
    }

    const dup = await ItemRelationship.findExistingPair(
      v.itemA.itemId,
      v.itemB.itemId,
      { transaction: t }
    );
    if (dup) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        error: `These items already have a relationship (${dup.relationshipCode}).`,
      });
    }

    const relationshipCode = await ItemRelationship.generateRelationshipCode(t);

    const created = await ItemRelationship.create(
      {
        relationshipCode,
        itemAId: v.itemA.itemId,
        itemBId: v.itemB.itemId,
        remark: remark || null,
        status: 'Active',
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction: t }
    );

    await t.commit();

    const enriched = await ItemRelationship.findByPk(created.id, {
      include: FULL_INCLUDE,
    });

    res.status(201).json({
      success: true,
      message: `Relationship ${created.relationshipCode} created.`,
      data: enriched.toApiJSON(),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ create item relationship:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'A relationship between these items already exists.',
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 4. UPDATE
// PUT /api/item-relationships/:id
// Body: { itemAId?, itemBId?, remark?, status? }
// NOTE: relationshipCode is immutable.
// ================================================================
exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { itemAId, itemBId, remark, status } = req.body;
    const userId = req.user?.userId || null;

    const row = await ItemRelationship.findByPk(id, { transaction: t });
    if (!row) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: 'Relationship not found.' });
    }

    const nextA = itemAId != null ? Number(itemAId) : row.itemAId;
    const nextB = itemBId != null ? Number(itemBId) : row.itemBId;

    if (nextA !== row.itemAId || nextB !== row.itemBId) {
      const v = await validateItems(nextA, nextB, t);
      if (!v.ok) {
        await t.rollback();
        return res.status(400).json({ success: false, error: v.error });
      }

      const dup = await ItemRelationship.findExistingPair(
        v.itemA.itemId,
        v.itemB.itemId,
        { excludeId: row.id, transaction: t }
      );
      if (dup) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          error: `These items already have a relationship (${dup.relationshipCode}).`,
        });
      }

      row.itemAId = v.itemA.itemId;
      row.itemBId = v.itemB.itemId;
    }

    if (remark !== undefined) row.remark = remark || null;
    if (status && ['Active', 'Inactive'].includes(status)) row.status = status;
    row.updatedBy = userId;

    await row.save({ transaction: t });
    await t.commit();

    const enriched = await ItemRelationship.findByPk(row.id, {
      include: FULL_INCLUDE,
    });

    res.json({
      success: true,
      message: `Relationship ${row.relationshipCode} updated.`,
      data: enriched.toApiJSON(),
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ update item relationship:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'A relationship between these items already exists.',
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 5. DELETE ONE
// DELETE /api/item-relationships/:id
// ================================================================
exports.remove = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const row = await ItemRelationship.findByPk(req.params.id, {
      transaction: t,
    });
    if (!row) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, error: 'Relationship not found.' });
    }

    const code = row.relationshipCode;
    await row.destroy({ transaction: t });
    await t.commit();

    res.json({
      success: true,
      message: `Relationship ${code} deleted.`,
      data: { deletedId: Number(req.params.id) },
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ delete item relationship:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 6. BULK DELETE
// POST /api/item-relationships/bulk-delete
// Body: { ids: [1, 2, 3] }
// ================================================================
exports.bulkDelete = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'No IDs provided.' });
    }

    const cleanIds = ids
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (cleanIds.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid IDs.' });
    }

    const deleted = await ItemRelationship.destroy({
      where: { id: { [Op.in]: cleanIds } },
      transaction: t,
    });

    await t.commit();

    res.json({
      success: true,
      message: `${deleted} relationship${deleted !== 1 ? 's' : ''} deleted.`,
      data: { deleted, requested: cleanIds.length },
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ bulk delete item relationships:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================================================
// 7. IMPORT
// POST /api/item-relationships/import
// Body: { rows: [{ itemCodeA, itemCodeB, remark }, ...] }
//
// Per-row SAVEPOINT so one bad row doesn't roll back the whole batch.
// ================================================================
exports.import = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { rows } = req.body;
    const userId = req.user?.userId || null;

    if (!Array.isArray(rows) || rows.length === 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, error: 'No rows to import.' });
    }

    if (rows.length > 5000) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: 'Too many rows in one import (max 5000).',
      });
    }

    // ---- Pre-resolve every item code in one query ----
    const codes = [];
    rows.forEach((r) => {
      const a = String(r.itemCodeA || '').trim().toUpperCase();
      const b = String(r.itemCodeB || '').trim().toUpperCase();
      if (a) codes.push(a);
      if (b) codes.push(b);
    });

    const items =
      codes.length > 0
        ? await Item.findAll({
            where: { code: { [Op.in]: [...new Set(codes)] } },
            attributes: ['itemId', 'code', 'name', 'standardName', 'status'],
            transaction: t,
          })
        : [];

    const itemByCode = new Map(
      items.map((i) => [i.code.toUpperCase(), i])
    );

    // ---- Pre-load existing pairs so duplicates in-batch are caught ----
    const existingPairs = new Set();
    const allIds = items.map((i) => i.itemId);
    if (allIds.length > 0) {
      const existing = await ItemRelationship.findAll({
        where: {
          [Op.or]: [
            { itemAId: { [Op.in]: allIds } },
            { itemBId: { [Op.in]: allIds } },
          ],
        },
        attributes: ['itemAId', 'itemBId', 'relationshipCode'],
        transaction: t,
      });
      existing.forEach((e) => {
        const [lo, hi] = [e.itemAId, e.itemBId].sort((x, y) => x - y);
        existingPairs.add(`${lo}-${hi}|${e.relationshipCode}`);
      });
    }

    const results = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const savepoint = `sp_rel_${rowNumber}`;

      await sequelize.query(`SAVEPOINT ${savepoint}`, { transaction: t });

      try {
        const codeA = String(row.itemCodeA || '').trim().toUpperCase();
        const codeB = String(row.itemCodeB || '').trim().toUpperCase();
        const remark = (row.remark && String(row.remark).trim()) || null;

        if (!codeA || !codeB) {
          throw new Error('Both item codes are required.');
        }
        if (codeA === codeB) {
          throw new Error('Item A and Item B cannot be the same.');
        }

        const itemA = itemByCode.get(codeA);
        const itemB = itemByCode.get(codeB);

        if (!itemA) throw new Error(`Item "${codeA}" not found.`);
        if (!itemB) throw new Error(`Item "${codeB}" not found.`);
        if (itemA.status !== 'Active')
          throw new Error(`Item "${codeA}" is ${itemA.status}.`);
        if (itemB.status !== 'Active')
          throw new Error(`Item "${codeB}" is ${itemB.status}.`);

        const [lo, hi] = [itemA.itemId, itemB.itemId].sort((x, y) => x - y);
        const pairKey = `${lo}-${hi}`;

        const existingEntry = [...existingPairs].find((e) =>
          e.startsWith(`${pairKey}|`)
        );
        if (existingEntry) {
          const existingCode = existingEntry.split('|')[1];
          throw new Error(`Relationship already exists (${existingCode}).`);
        }

        const relationshipCode =
          await ItemRelationship.generateRelationshipCode(t);

        await ItemRelationship.create(
          {
            relationshipCode,
            itemAId: itemA.itemId,
            itemBId: itemB.itemId,
            remark,
            status: 'Active',
            createdBy: userId,
            updatedBy: userId,
          },
          { transaction: t }
        );

        existingPairs.add(`${pairKey}|${relationshipCode}`);

        await sequelize.query(`RELEASE SAVEPOINT ${savepoint}`, {
          transaction: t,
        });

        success++;
        results.push({ success: true, data: row, relationshipCode });
      } catch (rowErr) {
        await sequelize.query(`ROLLBACK TO SAVEPOINT ${savepoint}`, {
          transaction: t,
        });
        failed++;
        results.push({ success: false, data: row, error: rowErr.message });
      }
    }

    await t.commit();

    res.json({
      success: true,
      message: `Import complete: ${success} imported, ${failed} failed.`,
      data: { success, failed, total: rows.length, results },
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ import item relationships:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};