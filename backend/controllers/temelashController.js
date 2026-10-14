// controllers/temelashController.js
"use strict";

const db = require("../models");
const {
  TemelashRecord,
  Store,
  User,
  ItemRequest,
  ItemRequestDetail,
  Item,
  UOM,
} = db;

const { Op } = require("sequelize");

// ================================================================
// HELPER: Resolve the requesting user's scope
// ----------------------------------------------------------------
//   - Admin (isAdmin === true OR role === "admin"/"Admin")
//       → can see every store's records
//   - Everyone else
//       → restricted to their own assigned store only
// ================================================================
function getUserScope(req) {
  const user = req.user || {};
  const isAdmin =
    user.isAdmin === true ||
    user.role === "admin" ||
    user.role === "Admin";

  // Try every common store-id shape the auth layer may attach
  const storeId =
    user.storeId ??
    user.store_id ??
    user.assignedStore?.id ??
    user.assignedStoreId ??
    user.currentStore?.id ??
    user.store?.id ??
    null;

  return {
    isAdmin,
    storeId: storeId != null ? Number(storeId) : null,
  };
}

// ================================================================
// HELPER: Snapshot a request into temelash_records
// Called by itemRequestController.updateStatus when a Temelash
// request transitions to "approved".
// ================================================================
async function snapshotTemelashRecord(requestId, transaction = null) {
  try {
    // Idempotency guard — don't create duplicates while still OUT
    const existing = await TemelashRecord.findOne({
      where: { requestId, status: "out" },
      transaction,
    });

    if (existing) {
      console.log(
        `ℹ️ [TEMELASH] Record already exists for request ${requestId} (id ${existing.id}) — skipping snapshot`
      );
      return existing;
    }

    const requestWithItems = await ItemRequest.findByPk(requestId, {
      include: [
        {
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [{ model: UOM, as: "uom" }],
            },
          ],
        },
      ],
      transaction,
    });

    if (!requestWithItems) {
      console.warn(
        `⚠️ [TEMELASH] Request ${requestId} not found — skipping snapshot`
      );
      return null;
    }

    const snapshotItems = (requestWithItems.items || []).map((d) => ({
      itemId: d.itemId,
      code: d.item?.code || "N/A",
      name: d.item?.name || "Unknown",
      quantity: Number(d.quantity) || 0,
      uom: d.uom_code || d.item?.uom?.code || "Units",
      remark: d.remark || "",
      specification: d.specification || "",
      brand: d.brand || "",
      model: d.model || "",
    }));

    const record = await TemelashRecord.create(
      {
        requestId: requestWithItems.requestId,
        requestCode: requestWithItems.requestCode,
        askingStoreId: requestWithItems.askingStoreId,
        supplyingStoreId: requestWithItems.supplyingStoreId,
        requestedById: requestWithItems.requestedById || null,
        requestedBy: requestWithItems.requestedBy || null,
        items: snapshotItems,
        remark: requestWithItems.remark || null,
        status: "out",
        issuedAt: new Date(),
        fromDate: requestWithItems.temelashFromDate || null,
        toDate: requestWithItems.temelashToDate || null,
        returnedLate: false,
      },
      { transaction }
    );

    console.log(
      `📝 [TEMELASH] Recorded request ${requestWithItems.requestCode} as OUT ` +
        `(record id ${record.id}, window ${record.fromDate || "—"} → ${record.toDate || "—"})`
    );

    return record;
  } catch (error) {
    console.error("❌ [TEMELASH] snapshotTemelashRecord error:", error);
    throw error;
  }
}

// ================================================================
// 1. GET ALL TEMELASH RECORDS
// GET /api/temelash
// ----------------------------------------------------------------
// Non-admin users only see records where their store is the asking
// or the supplying store. Admins see everything.
// ================================================================
exports.getTemelashRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "all",
      storeId = "all",
      search = "",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // ----- Scope by user's store (unless admin) -----
    const { isAdmin, storeId: userStoreId } = getUserScope(req);

    const baseStoreCondition =
      !isAdmin && userStoreId != null
        ? {
            [Op.or]: [
              { askingStoreId: userStoreId },
              { supplyingStoreId: userStoreId },
            ],
          }
        : null;

    // ----- Status filter -----
    if (status !== "all") {
      where.status = status;
    }

    // ----- Explicit storeId filter from query -----
    // Admins can filter by any store.
    // Non-admins can ONLY filter by their own store — any other value
    // is silently ignored so they can't peek at other stores.
    let queryStoreCondition = null;
    if (storeId !== "all") {
      const requestedStoreId = parseInt(storeId);
      if (isAdmin || requestedStoreId === userStoreId) {
        queryStoreCondition = {
          [Op.or]: [
            { askingStoreId: requestedStoreId },
            { supplyingStoreId: requestedStoreId },
          ],
        };
      }
      // else: non-admin tried to filter by another store → ignore, keep scope
    }

    // ----- Combine store constraints with AND -----
    const storeConditions = [baseStoreCondition, queryStoreCondition].filter(
      Boolean
    );

    if (storeConditions.length === 1) {
      Object.assign(where, storeConditions[0]);
    } else if (storeConditions.length > 1) {
      where[Op.and] = storeConditions;
    }

    // ----- Search filter -----
    if (search) {
      where.requestCode = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await TemelashRecord.findAndCountAll({
      where,
      include: [
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email"],
        },
        {
          model: User,
          as: "returnedByUser",
          attributes: ["userId", "username", "fullName"],
        },
      ],
      order: [["issued_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    const today = new Date().toISOString().split("T")[0];

    // Summary is computed with the same scoped `where` — so non-admins
    // get counts that match only what they can see.
    const summary = {
      total: count,
      out: await TemelashRecord.count({
        where: { ...where, status: "out" },
      }),
      returned: await TemelashRecord.count({
        where: { ...where, status: "returned" },
      }),
      overdue: await TemelashRecord.count({
        where: {
          ...where,
          status: "out",
          toDate: { [Op.lt]: today },
        },
      }),
    };

    res.json({
      success: true,
      data: {
        records: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit)),
        },
        summary,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching temelash records:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch temelash records",
    });
  }
};

// ================================================================
// 2. GET SINGLE TEMELASH RECORD BY ID
// GET /api/temelash/:recordId
// ----------------------------------------------------------------
// Non-admins can only fetch records tied to their own store.
// ================================================================
exports.getTemelashRecordById = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await TemelashRecord.findByPk(recordId, {
      include: [
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email"],
        },
        {
          model: User,
          as: "returnedByUser",
          attributes: ["userId", "username", "fullName"],
        },
      ],
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Temelash record not found",
      });
    }

    // ----- Scope check -----
    const { isAdmin, storeId: userStoreId } = getUserScope(req);

    if (!isAdmin && userStoreId != null) {
      const belongsToUser =
        Number(record.askingStoreId) === userStoreId ||
        Number(record.supplyingStoreId) === userStoreId;

      if (!belongsToUser) {
        return res.status(403).json({
          success: false,
          error: "You do not have access to this temelash record",
        });
      }
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("❌ Error fetching temelash record:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch temelash record",
    });
  }
};

// ================================================================
// 3. UPDATE A TEMELASH RECORD (loan window + remark)
// PUT /api/temelash/:recordId
// ----------------------------------------------------------------
// Non-admins can only update records tied to their own store.
// ================================================================
exports.updateTemelash = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { fromDate, toDate, remark } = req.body;

    const record = await TemelashRecord.findByPk(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Temelash record not found",
      });
    }

    // ----- Scope check -----
    const { isAdmin, storeId: userStoreId } = getUserScope(req);

    if (!isAdmin && userStoreId != null) {
      const belongsToUser =
        Number(record.askingStoreId) === userStoreId ||
        Number(record.supplyingStoreId) === userStoreId;

      if (!belongsToUser) {
        return res.status(403).json({
          success: false,
          error: "You do not have access to this temelash record",
        });
      }
    }

    if (record.status === "returned") {
      return res.status(400).json({
        success: false,
        error: "Cannot edit a returned temelash record",
      });
    }

    const nextFromDate = fromDate !== undefined ? fromDate : record.fromDate;
    const nextToDate = toDate !== undefined ? toDate : record.toDate;

    if (nextFromDate && nextToDate && nextToDate < nextFromDate) {
      return res.status(400).json({
        success: false,
        error: "Temelash 'To' date must be on or after the 'From' date",
      });
    }

    await record.update({
      fromDate: nextFromDate || null,
      toDate: nextToDate || null,
      remark: remark !== undefined ? remark : record.remark,
    });

    console.log(
      `✏️ [TEMELASH] Record ${recordId} updated — window ${record.fromDate || "—"} → ${record.toDate || "—"}`
    );

    res.json({
      success: true,
      message: "Temelash record updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("❌ Error updating temelash:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update temelash",
    });
  }
};

// ================================================================
// 4. MARK A TEMELASH RECORD AS RETURNED
// POST /api/temelash/:recordId/return
// ----------------------------------------------------------------
// Non-admins can only return records tied to their own store.
// ================================================================
exports.returnTemelash = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { remark } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const record = await TemelashRecord.findByPk(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Temelash record not found",
      });
    }

    // ----- Scope check -----
    const { isAdmin, storeId: userStoreId } = getUserScope(req);

    if (!isAdmin && userStoreId != null) {
      const belongsToUser =
        Number(record.askingStoreId) === userStoreId ||
        Number(record.supplyingStoreId) === userStoreId;

      if (!belongsToUser) {
        return res.status(403).json({
          success: false,
          error: "You do not have access to this temelash record",
        });
      }
    }

    if (record.status !== "out") {
      return res.status(400).json({
        success: false,
        error: `Temelash record is already ${record.status}`,
      });
    }

    const now = new Date();
    const isLate = record.toDate ? now > new Date(record.toDate) : false;

    await record.update({
      status: "returned",
      returnedAt: now,
      returnedById: userId,
      returnRemark: remark || null,
      returnedLate: isLate,
    });

    console.log(
      `✅ [TEMELASH] Record ${recordId} (${record.requestCode}) returned` +
        (isLate ? " [LATE]" : "")
    );

    res.json({
      success: true,
      message: isLate
        ? "Temelash returned successfully (marked as LATE)"
        : "Temelash returned successfully",
      data: record,
    });
  } catch (error) {
    console.error("❌ Error returning temelash:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to return temelash",
    });
  }
};

// ================================================================
// EXPORTS: internal helper (used by itemRequestController)
// ================================================================
exports.snapshotTemelashRecord = snapshotTemelashRecord;