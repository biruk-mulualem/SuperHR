// controllers/itemStatusController.js
"use strict";
const db = require("../models");

const {
  ItemStatusRule,
  ItemStatusTake,
  Store,
  Department,
  Item,
  UOM,
  User,
  ItemRequest,
  sequelize,
} = db;
const { Op } = require("sequelize");

// ================================================================
// HELPERS
// ================================================================
function computeStatus(rule, at = new Date()) {
  const freq = Number(rule.frequencyDays) || 0;
  const maxQty = Number(rule.maxQuantity) || 0;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // ---- 1. Normalize takes: drop invalid dates, sort newest-first ----
  const takes = (rule.takes || [])
    .map((t) => ({
      id: t.id,
      date: t.takenAt,
      quantity: Number(t.quantity) || 0,
      uomCode: t.uomCode || rule.uomCode || "",
      requestId: t.requestId,
      requestCode: t.requestCode,
      status: t.status,
      takenBy: t.takenByUser?.fullName || t.takenByUser?.username || null,
    }))
    .filter((t) => t.date && !isNaN(new Date(t.date).getTime()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const lastTaken = takes[0] || null;

  // ---- 2. THRESHOLD window = calendar days [midnight(freq days ago), end of today] ----
  //   Anchoring to calendar days (not to `at`'s clock time) guarantees that a
  //   take recorded at ANY time today is counted, no matter what time you query.
  const windowStart = new Date(at);
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - freq);

  const windowEnd = new Date(at);
  windowEnd.setHours(23, 59, 59, 999);

  const takesInWindow = takes.filter((t) => {
    const d = new Date(t.date);
    return d >= windowStart && d <= windowEnd;
  });

  const totalInWindow = takesInWindow.reduce((s, t) => s + t.quantity, 0);
  const isBlocked = totalInWindow >= maxQty;

  // ---- 3. RELEASE date = last take + freq days ----
  //   "We take 100 today → we can take again 7 days from today."
  let nextAllowedAt = null;
  if (isBlocked && lastTaken) {
    nextAllowedAt = new Date(
      new Date(lastTaken.date).getTime() + freq * MS_PER_DAY
    );
  }

  return {
    isBlocked,
    nextAllowedAt: nextAllowedAt ? nextAllowedAt.toISOString() : null,
    lastTaken,
    totalInWindow,
  };
}

function formatRule(rule, { includeHistory = false } = {}) {
  const status = computeStatus(rule);
  const isDepartment = !!rule.departmentId;
  const base = {
    id: rule.id,
    storeId: rule.storeId,
    departmentId: rule.departmentId,
    storeType: isDepartment ? "department" : "store",
    storeName: isDepartment
      ? rule.department?.name || `Department #${rule.departmentId}`
      : rule.store?.name || null,
    storeCode: isDepartment
      ? rule.department?.code || null
      : rule.store?.code || null,
    itemId: rule.itemId,
    itemCode: rule.item?.code || null,
    itemName: rule.item?.standardName || rule.item?.name || null,
    uomId: rule.uomId,
    uomCode: rule.uomCode || rule.uom?.code || null,
    maxQuantity: Number(rule.maxQuantity),
    frequencyDays: rule.frequencyDays,
    reason: rule.reason || "",
    status: rule.status,
    isBlocked: status.isBlocked,
    nextAllowedAt: status.nextAllowedAt,
    lastTaken: status.lastTaken,
    totalInWindow: status.totalInWindow,
    createdBy: rule.createdBy,
    createdByName:
      rule.createdByUser?.fullName || rule.createdByUser?.username || null,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };

  if (includeHistory) {
    base.history = (rule.takes || [])
      .map((t) => ({
        id: t.id,
        date: t.takenAt,
        quantity: Number(t.quantity) || 0,
        uomCode: t.uomCode || rule.uomCode || "",
        requestId: t.requestId,
        requestCode: t.requestCode,
        status: t.status,
        takenBy: t.takenByUser?.fullName || t.takenByUser?.username || null,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return base;
}

function baseInclude() {
  return [
    { model: Store, as: "store", attributes: ["id", "name", "code"], required: false },
    { model: Department, as: "department", attributes: ["department_id", "name", "code"], required: false },
    { model: Item, as: "item", attributes: ["itemId", "code", "name", "standardName"], required: false },
    { model: UOM, as: "uom", attributes: ["id", "code", "name"], required: false },
    { model: User, as: "createdByUser", attributes: ["userId", "username", "fullName"], required: false },
  ];
}

function takesInclude() {
  return [
    {
      model: ItemStatusTake,
      as: "takes",
      required: false,
      include: [
        { model: User, as: "takenByUser", attributes: ["userId", "username", "fullName"], required: false },
        { model: ItemRequest, as: "request", attributes: ["requestId", "requestCode", "status"], required: false },
      ],
    },
  ];
}

// ================================================================
// ACCESS HELPERS
// ================================================================

/**
 * Resolve the caller's store + userId.
 * The store comes from the JWT (req.user.storeId / assignedStoreId).
 * If absent, falls back to getUserStoreAndGroup(userId).data.assignedStoreId.
 * NOTE: the users table has no storeId / assignedStoreId columns —
 *       only the token carries it. Never query User.storeId.
 */
async function resolveUserStore(req) {
  const { getUserStoreAndGroup } = require("../utils/userAccess");

  const user = req.user || {};
  const userId = user.userId || null;
  const role = user.role || null;

  let storeId = user.storeId || user.assignedStoreId || null;
  let isAdmin = user.isAdmin === true;

  if ((!storeId || !userId) && userId) {
    try {
      const access = await getUserStoreAndGroup(userId);
      if (access.success && access.data) {
        storeId = storeId || access.data.assignedStoreId || null;
        isAdmin = isAdmin || access.data.isAdmin === true;
      }
    } catch (err) {
      console.warn("⚠️ resolveUserStore: could not resolve store:", err.message);
    }
  }

  return {
    userId: userId ? parseInt(userId) : null,
    role,
    storeId: storeId ? parseInt(storeId) : null,
    isAdmin: role === "admin" || role === "Admin" || isAdmin === true,
  };
}

/**
 * Returns the list of userIds visible to the caller, based on shared store groups.
 *
 * Groups are the only join path in this schema:
 *   store_group_relations(store_id, group_id)   — which groups a store belongs to
 *   user_group_relations (user_id, group_id)    — which groups a user belongs to
 *
 * Two users in the same store always share at least one group
 * (the store's groups in store_group_relations), so "same store" is covered.
 */
async function getStoreTeammateUserIds(access) {
  if (!access?.userId) return [];

  const { StoreGroupRelation, UserGroupRelation } = db;

  const groupIdSet = new Set();

  // 1) Groups of the caller's store
  if (access.storeId) {
    const storeGroups = await StoreGroupRelation.findAll({
      where: { storeId: access.storeId },
      attributes: ["groupId"],
    });
    for (const row of storeGroups) {
      const gid = parseInt(row.groupId);
      if (!isNaN(gid)) groupIdSet.add(gid);
    }
  }

  // 2) Groups the caller is directly a member of
  const myGroups = await UserGroupRelation.findAll({
    where: { userId: access.userId },
    attributes: ["groupId"],
  });
  for (const row of myGroups) {
    const gid = parseInt(row.groupId);
    if (!isNaN(gid)) groupIdSet.add(gid);
  }

  // No groups at all → only see themselves
  if (groupIdSet.size === 0) {
    return [access.userId];
  }

  const groupIds = [...groupIdSet];

  // 3) Every user who shares at least one group with us
  const teammates = await UserGroupRelation.findAll({
    where: { groupId: { [Op.in]: groupIds } },
    attributes: ["userId"],
  });

  const ids = new Set(
    teammates.map((r) => parseInt(r.userId)).filter((n) => !isNaN(n))
  );

  // 4) Always include the caller
  ids.add(access.userId);

  return [...ids];
}

/**
 * True if the caller is allowed to see/modify the given rule.
 * A rule is visible iff its creator is in the caller's teammate set
 * (same store group, or the caller themselves).
 */
async function canSeeRule(req, rule) {
  if (!rule) return false;
  if (!rule.createdBy) return false;

  const access = await resolveUserStore(req);
  if (!access.userId) return false;

  // Owner always has access
  if (Number(rule.createdBy) === access.userId) return true;

  // Otherwise: is the creator in the caller's teammate set?
  const teammateIds = await getStoreTeammateUserIds(access);
  return teammateIds.includes(Number(rule.createdBy));
}

// ================================================================
// 1. GET STORES
// ================================================================
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { status: "Active" },
      attributes: ["id", "name", "code"],
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: stores });
  } catch (error) {
    console.error("❌ getStores error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 2. GET ITEMS
// ================================================================
exports.getItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { status: "Active" },
      attributes: ["itemId", "code", "name", "standardName", "uomId"],
      include: [{ model: UOM, as: "uom", attributes: ["id", "code", "name"], required: false }],
      order: [["code", "ASC"]],
      limit: 2000,
    });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("❌ getItems error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 3. GET ALL RULES — paginated + search + sort + store scoping
// ================================================================
exports.getRules = async (req, res) => {
  try {
    const {
      storeId,
      departmentId,
      itemId,
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const order = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "maxQuantity",
      "frequencyDays",
      "id",
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    // ---- Resolve caller's store ----
    const access = await resolveUserStore(req);
    if (!access.userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    // ---- Scope: rules created by users in my store ----
    const teammateIds = await getStoreTeammateUserIds(access);

    if (teammateIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 },
      });
    }

    const where = {
      status: status && status !== "all" ? status : "Active",
      createdBy: { [Op.in]: teammateIds },
    };
    if (storeId) where.storeId = parseInt(storeId);
    if (departmentId) where.departmentId = parseInt(departmentId);
    if (itemId) where.itemId = parseInt(itemId);

    // Server-side search across item code/name, store name, department name, reason
    const andClauses = [];
    if (search && String(search).trim() !== "") {
      const q = `%${String(search).trim()}%`;
      andClauses.push({
        [Op.or]: [
          { "$item.code$": { [Op.iLike]: q } },
          { "$item.name$": { [Op.iLike]: q } },
          { "$item.standard_name$": { [Op.iLike]: q } },
          { "$store.name$": { [Op.iLike]: q } },
          { "$department.name$": { [Op.iLike]: q } },
          { reason: { [Op.iLike]: q } },
        ],
      });
    }
    if (andClauses.length) where[Op.and] = andClauses;

    const { count, rows } = await ItemStatusRule.findAndCountAll({
      where,
      include: [...baseInclude(), ...takesInclude()],
      order: [[sortField, order]],
      limit: limitNum,
      offset,
      distinct: true,
      subQuery: false,
    });

    res.json({
      success: true,
      data: rows.map((r) => formatRule(r)),
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error("❌ getRules error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 4. GET RULE BY ID (with full history) — store-scoped
// ================================================================
exports.getRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await ItemStatusRule.findByPk(parseInt(id), {
      include: [...baseInclude(), ...takesInclude()],
    });
    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    const allowed = await canSeeRule(req, rule);
    if (!allowed) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({ success: true, data: formatRule(rule, { includeHistory: true }) });
  } catch (error) {
    console.error("❌ getRuleById error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 5. CREATE RULE — any authenticated user; any store/department
// ================================================================
exports.createRule = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { storeId, departmentId, itemId, maxQuantity, frequencyDays, reason } = req.body;
    const userId = req.user?.userId || null;

    if (!userId) {
      await t.rollback();
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    if (!itemId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "itemId is required" });
    }
    if (!storeId && !departmentId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Either storeId or departmentId is required",
      });
    }
    if (storeId && departmentId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Specify either storeId or departmentId — not both",
      });
    }

    const maxQty = parseFloat(maxQuantity);
    const freq = parseInt(frequencyDays);
    if (!Number.isFinite(maxQty) || maxQty <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "maxQuantity must be > 0" });
    }
    if (!Number.isFinite(freq) || freq < 1) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "frequencyDays must be >= 1" });
    }

    if (storeId) {
      const store = await Store.findByPk(parseInt(storeId), { transaction: t });
      if (!store) {
        await t.rollback();
        return res.status(404).json({ success: false, error: "Store not found" });
      }
    }
    if (departmentId) {
      const dept = await Department.findByPk(parseInt(departmentId), { transaction: t });
      if (!dept) {
        await t.rollback();
        return res.status(404).json({ success: false, error: "Department not found" });
      }
    }

    const item = await Item.findByPk(parseInt(itemId), {
      transaction: t,
      include: [{ model: UOM, as: "uom", attributes: ["id", "code"], required: false }],
    });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const dupWhere = { itemId: parseInt(itemId), status: "Active" };
    if (storeId) dupWhere.storeId = parseInt(storeId);
    if (departmentId) dupWhere.departmentId = parseInt(departmentId);

    const existing = await ItemStatusRule.findOne({ where: dupWhere, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        error:
          "An active rule already exists for this " +
          (storeId ? "store" : "department") +
          " + item. Edit that rule instead.",
      });
    }

    const rule = await ItemStatusRule.create(
      {
        storeId: storeId ? parseInt(storeId) : null,
        departmentId: departmentId ? parseInt(departmentId) : null,
        itemId: parseInt(itemId),
        uomId: item.uomId || null,
        uomCode: item.uom?.code || null,
        maxQuantity: maxQty,
        frequencyDays: freq,
        reason: (reason || "").trim() || null,
        status: "Active",
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction: t }
    );

    await t.commit();

    const created = await ItemStatusRule.findByPk(rule.id, {
      include: [...baseInclude(), ...takesInclude()],
    });

    res.status(201).json({ success: true, data: formatRule(created) });
  } catch (error) {
    await t.rollback();
    console.error("❌ createRule error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 6. UPDATE RULE — store-scoped
// ================================================================
exports.updateRule = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { storeId, departmentId, itemId, maxQuantity, frequencyDays, reason } = req.body;
    const userId = req.user?.userId || null;

    const rule = await ItemStatusRule.findByPk(parseInt(id), { transaction: t });
    if (!rule) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Rule not found" });
    }
    if (rule.status !== "Active") {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Cannot edit a deleted rule" });
    }

    const allowed = await canSeeRule(req, rule);
    if (!allowed) {
      await t.rollback();
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const nextStoreId =
      storeId !== undefined ? (storeId ? parseInt(storeId) : null) : rule.storeId;
    const nextDeptId =
      departmentId !== undefined
        ? (departmentId ? parseInt(departmentId) : null)
        : rule.departmentId;
    const nextItemId = itemId !== undefined ? parseInt(itemId) : rule.itemId;

    if (!nextStoreId && !nextDeptId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Either storeId or departmentId is required",
      });
    }
    if (nextStoreId && nextDeptId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Specify either storeId or departmentId — not both",
      });
    }

    if (
      nextStoreId !== rule.storeId ||
      nextDeptId !== rule.departmentId ||
      nextItemId !== rule.itemId
    ) {
      const dupWhere = { itemId: nextItemId, status: "Active", id: { [Op.ne]: rule.id } };
      if (nextStoreId) dupWhere.storeId = nextStoreId;
      if (nextDeptId) dupWhere.departmentId = nextDeptId;

      const dup = await ItemStatusRule.findOne({ where: dupWhere, transaction: t });
      if (dup) {
        await t.rollback();
        return res.status(409).json({
          success: false,
          error: "Another active rule exists for this target + item",
        });
      }
    }

    const nextMaxQty =
      maxQuantity !== undefined ? parseFloat(maxQuantity) : Number(rule.maxQuantity);
    const nextFreq =
      frequencyDays !== undefined ? parseInt(frequencyDays) : rule.frequencyDays;

    if (!Number.isFinite(nextMaxQty) || nextMaxQty <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "maxQuantity must be > 0" });
    }
    if (!Number.isFinite(nextFreq) || nextFreq < 1) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "frequencyDays must be >= 1" });
    }

    let nextUomId = rule.uomId;
    let nextUomCode = rule.uomCode;
    if (nextItemId !== rule.itemId) {
      const item = await Item.findByPk(nextItemId, {
        transaction: t,
        include: [{ model: UOM, as: "uom", attributes: ["id", "code"], required: false }],
      });
      if (!item) {
        await t.rollback();
        return res.status(404).json({ success: false, error: "Item not found" });
      }
      nextUomId = item.uomId || null;
      nextUomCode = item.uom?.code || null;
    }

    await rule.update(
      {
        storeId: nextStoreId,
        departmentId: nextDeptId,
        itemId: nextItemId,
        uomId: nextUomId,
        uomCode: nextUomCode,
        maxQuantity: nextMaxQty,
        frequencyDays: nextFreq,
        reason: reason !== undefined ? (reason || "").trim() || null : rule.reason,
        updatedBy: userId,
      },
      { transaction: t }
    );

    await t.commit();

    const updated = await ItemStatusRule.findByPk(rule.id, {
      include: [...baseInclude(), ...takesInclude()],
    });

    res.json({ success: true, data: formatRule(updated, { includeHistory: true }) });
  } catch (error) {
    await t.rollback();
    console.error("❌ updateRule error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 7. DELETE RULE (soft delete) — store-scoped
// ================================================================
exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;
    const rule = await ItemStatusRule.findByPk(parseInt(id));
    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }
    if (rule.status === "Deleted") {
      return res.status(400).json({ success: false, error: "Rule is already deleted" });
    }

    const allowed = await canSeeRule(req, rule);
    if (!allowed) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    await rule.update({ status: "Deleted", updatedBy: userId });
    res.json({ success: true, message: "Rule deleted" });
  } catch (error) {
    console.error("❌ deleteRule error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 8. GET RULE HISTORY (paged) — store-scoped
// ================================================================
exports.getRuleHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const rule = await ItemStatusRule.findByPk(parseInt(id), {
      include: [{ model: UOM, as: "uom", attributes: ["code"], required: false }],
    });
    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    const allowed = await canSeeRule(req, rule);
    if (!allowed) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await ItemStatusTake.findAndCountAll({
      where: { ruleId: rule.id },
      include: [
        { model: User, as: "takenByUser", attributes: ["userId", "username", "fullName"], required: false },
        { model: ItemRequest, as: "request", attributes: ["requestId", "requestCode", "status"], required: false },
      ],
      order: [["takenAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        takes: rows.map((t) => ({
          id: t.id,
          date: t.takenAt,
          quantity: Number(t.quantity) || 0,
          uomCode: t.uomCode || rule.uomCode || "",
          requestId: t.requestId,
          requestCode: t.requestCode || t.request?.requestCode || null,
          requestStatus: t.request?.status || t.status,
          status: t.status,
          takenBy: t.takenByUser?.fullName || t.takenByUser?.username || null,
        })),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ getRuleHistory error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================
// 9. CHECK BLOCKED (helper) — unscoped by default; optional creatorIds filter
// ================================================================
exports.checkBlockedForStoreItem = async (storeId, itemId, creatorIds = null) => {
  const where = {
    storeId: parseInt(storeId),
    itemId: parseInt(itemId),
    status: "Active",
  };
  if (Array.isArray(creatorIds)) {
    if (creatorIds.length === 0) return { blocked: false };
    where.createdBy = { [Op.in]: creatorIds };
  }

  const rule = await ItemStatusRule.findOne({
    where,
    include: [
      ...takesInclude(),
      { model: UOM, as: "uom", attributes: ["code"], required: false },
      { model: Item, as: "item", attributes: ["itemId", "code", "name", "standardName"], required: false },
    ],
  });
  if (!rule) return { blocked: false };

  const status = computeStatus(rule);
  if (!status.isBlocked) {
    return { blocked: false, rule: formatRule(rule) };
  }

  return {
    blocked: true,
    rule: formatRule(rule),
    reason: rule.reason || null,
    nextAllowedAt: status.nextAllowedAt,
    lastTaken: status.lastTaken,
    totalInWindow: status.totalInWindow,
  };
};

// ================================================================
// 10. RECORD A TAKE (helper — unscoped; called internally)
// ================================================================
exports.recordTake = async ({
  storeId,
  itemId,
  quantity,
  uomCode,
  requestId,
  requestCode,
  takenBy,
  takenAt,
  status = "finalized",
  transaction = null,
}) => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;

  const rule = await ItemStatusRule.findOne({
    where: { storeId: parseInt(storeId), itemId: parseInt(itemId), status: "Active" },
    transaction,
  });
  if (!rule) return null;

  if (requestId) {
    const existing = await ItemStatusTake.findOne({
      where: { ruleId: rule.id, requestId: parseInt(requestId) },
      transaction,
    });
    if (existing) return existing;
  }

  return ItemStatusTake.create(
    {
      ruleId: rule.id,
      requestId: requestId || null,
      requestCode: requestCode || null,
      quantity: qty,
      uomCode: uomCode || rule.uomCode || null,
      status,
      takenAt: takenAt || new Date(),
      takenBy: takenBy || null,
    },
    { transaction }
  );
};

// ================================================================
// 11. CHECK BLOCKED ENDPOINT — store-scoped
// ================================================================
exports.checkBlockedEndpoint = async (req, res) => {
  try {
    const { storeId, itemId } = req.query;
    if (!storeId || !itemId) {
      return res.status(400).json({ success: false, error: "storeId and itemId are required" });
    }

    const access = await resolveUserStore(req);
    if (!access.userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    // Only consider rules created by users in the caller's store
    const teammateIds = await getStoreTeammateUserIds(access);

    const result = await exports.checkBlockedForStoreItem(
      parseInt(storeId),
      parseInt(itemId),
      teammateIds
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ checkBlockedEndpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};