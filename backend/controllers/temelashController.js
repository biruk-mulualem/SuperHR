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







exports.downloadTemelashTemplate = async (req, res) => {
  try {
    const stores = await Store.findAll({
      attributes: ["id", "name", "code"],
      where: { status: "Active" },
      order: [["name", "ASC"]],
      raw: true,
    });

    let csv = "";

    csv += "# ============================================\n";
    csv += "# TEMELASH HISTORICAL RECORDS — IMPORT TEMPLATE\n";
    csv += "# ============================================\n";
    csv += "#\n";
    csv += "# INSTRUCTIONS:\n";
    csv += "# 1. One row = one temelash record (not one item).\n";
    csv += "# 2. REQUIRED columns: askingStoreId, supplyingStoreId\n";
    csv += "#    → use the numeric store id, not the code.\n";
    csv += "# 3. Everything else is OPTIONAL:\n";
    csv += "#    - requestCode      → auto-generated if blank\n";
    csv += "#    - status           → defaults to 'out'\n";
    csv += "#    - issuedAt         → defaults to now (ISO date)\n";
    csv += "#    - items            → JSON array string, defaults to []\n";
    csv += "#    - fromDate, toDate → YYYY-MM-DD\n";
    csv += "#    - returnedAt       → ISO date (only used when status='returned')\n";
    csv += "#    - returnedByUsername, returnRemark, returnedLate\n";
    csv += "#    - requestedByName, remark\n";
    csv += "# 4. 'items' must be a JSON array. Wrap the whole field in\n";
    csv += "#    double quotes and escape inner quotes as \"\".\n";
    csv += "#    Example: \"[{\"\"name\"\":\"\"Laptop\"\",\"\"quantity\"\":1,\"\"uom\"\":\"\"PCS\"\"}]\"\n";
    csv += "# 5. Asking and supplying stores must both exist and be active.\n";
    csv += "#\n";

    if (stores.length > 0) {
      csv += "# Available Stores:\n";
      stores.forEach((s) => {
        csv += `#   id=${s.id}  ${s.name}${s.code ? ` (${s.code})` : ""}\n`;
      });
      csv += "#\n";
    }

    csv += "# ============================================\n";
    csv +=
      "askingStoreId,supplyingStoreId,requestCode,status,issuedAt,fromDate,toDate,returnedAt,returnedByUsername,returnRemark,returnedLate,requestedByName,items,remark\n";

    const sampleA = stores[0]?.id ?? 1;
    const sampleB = stores[1]?.id ?? stores[0]?.id ?? 2;

    // Sample 1: minimal row — only store ids, everything else blank.
    csv +=
      `${sampleA},${sampleB},,,,,,,,,,,,\n`;

    // Sample 2: fully populated returned record.
    csv +=
      `TML-2024-001,${sampleA},${sampleB},returned,` +
      `2024-03-01T09:15:00Z,2024-03-01,2024-03-08,2024-03-06T16:30:00Z,,,` +
      `false,Abebe Kebede,` +
      `"[{""name"":""Laptop"",""code"":""SDT000001"",""quantity"":2,""uom"":""PCS"",""brand"":""Dell"",""model"":""Latitude 5540""}]",` +
      `"Returned in working condition"\n`;

    // Sample 3: still-out record.
    csv +=
      `TML-2024-002,${sampleB},${sampleA},out,` +
      `2024-04-10T14:00:00Z,2024-04-10,2024-04-17,,,` +
      `,John Doe,` +
      `"[{""name"":""Projector"",""code"":""SDT000042"",""quantity"":1,""uom"":""PCS""}]",` +
      `"Loan for training session"\n`;

    const withBom = "\uFEFF" + csv;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=temelash_import_template_${new Date()
        .toISOString()
        .split("T")[0]}.csv`
    );
    res.send(withBom);
  } catch (error) {
    console.error("❌ Download temelash template error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate template",
    });
  }
};



// ================================================================
// 6. IMPORT HISTORICAL TEMELASH RECORDS FROM CSV
// POST /api/temelash/import   (multipart/form-data, field: file)
//
// Required columns: askingStoreId, supplyingStoreId
// Everything else is optional:
//   - requestCode   → auto-generated as TML-IMP-<line>-<ts>
//   - status        → defaults to "out"
//   - issuedAt      → defaults to now
//   - items         → defaults to []
//   - fromDate, toDate, returnedAt, returnedByUsername,
//     returnRemark, returnedLate, requestedByName, remark
// ================================================================
exports.importTemelashRecords = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    if (!req.file || !req.file.buffer) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const userId = req.user?.userId || null;

    // ---- Resolve stores into id → row map -----------------------
    const stores = await Store.findAll({
      attributes: ["id", "code", "name"],
      raw: true,
      transaction,
    });

    const storeById = new Map();
    stores.forEach((s) => storeById.set(Number(s.id), s));

    // ---- Resolve users into username → id map -------------------
    const users = await User.findAll({
      attributes: ["userId", "username"],
      raw: true,
      transaction,
    });

    const userByUsername = new Map();
    users.forEach((u) => {
      if (u.username)
        userByUsername.set(String(u.username).trim().toLowerCase(), u);
    });

    // ---- Parse CSV from the in-memory buffer --------------------
    const fileContent = req.file.buffer.toString("utf8");
    const lines = fileContent
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"));

    if (lines.length < 2) {
      throw new Error(
        "CSV must contain a header row and at least one data row"
      );
    }

    const firstLine = lines[0];
    const separator =
      firstLine.includes("\t") && !firstLine.includes(",") ? "\t" : ",";

    const headers = parseCsvLine(lines[0], separator).map((h) =>
      h.trim().toLowerCase()
    );

    const required = ["askingstoreid", "supplyingstoreid"];
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      throw new Error(
        `Missing required columns: ${missing.join(", ")}`
      );
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) continue;
      const values = parseCsvLine(raw, separator);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] != null ? String(values[idx]) : "";
      });
      row.__line = i + 1;
      rows.push(row);
    }

    // ---- Process each row --------------------------------------
    const errors = [];
    const skipped = [];
    const imported = [];
    let successCount = 0;
    let failedCount = 0;

    const statusAllowed = new Set(["out", "returned"]);
    const runStamp = Date.now();

    for (const row of rows) {
      const line = row.__line;
      const sp = `sp_temelash_${line}`;

      try {
        await db.sequelize.query(`SAVEPOINT ${sp}`, { transaction });

        // ---- Stores (required) ----
        const askingRaw = (row.askingstoreid || "").trim();
        const supplyingRaw = (row.supplyingstoreid || "").trim();

        const askingId = askingRaw ? parseInt(askingRaw) : null;
        const supplyingId = supplyingRaw ? parseInt(supplyingRaw) : null;

        if (!askingId || !Number.isFinite(askingId)) {
          throw new Error("askingStoreId is required and must be a number");
        }
        if (!supplyingId || !Number.isFinite(supplyingId)) {
          throw new Error(
            "supplyingStoreId is required and must be a number"
          );
        }

        const askingStore = storeById.get(askingId);
        const supplyingStore = storeById.get(supplyingId);

        if (!askingStore)
          throw new Error(`Unknown askingStoreId ${askingId}`);
        if (!supplyingStore)
          throw new Error(`Unknown supplyingStoreId ${supplyingId}`);

        // ---- requestCode (optional → auto-generate) ----
        let requestCode = (row.requestcode || "").trim();
        if (!requestCode) {
          requestCode = `TML-IMP-${runStamp}-${line}`;
        }

        const existing = await TemelashRecord.findOne({
          where: { requestCode },
          transaction,
        });
        if (existing) {
          skipped.push({
            line,
            requestCode,
            reason: `Already exists (id ${existing.id})`,
          });
          await db.sequelize.query(`RELEASE SAVEPOINT ${sp}`, {
            transaction,
          });
          continue;
        }

        // ---- status (optional → defaults to "out") ----
        let status = (row.status || "").trim().toLowerCase();
        if (!status) status = "out";
        if (!statusAllowed.has(status)) {
          throw new Error(
            `status must be 'out' or 'returned' (got "${status}")`
          );
        }

        // ---- issuedAt (optional → now) ----
        const issuedAt = parseDate(row.issuedat) || new Date();

        // ---- dates (optional) ----
        const fromDate = parseDateOnly(row.fromdate);
        const toDate = parseDateOnly(row.todate);

        if (fromDate && toDate && toDate < fromDate) {
          throw new Error("toDate must be on or after fromDate");
        }

        // ---- return fields (only meaningful if status='returned') ----
        let returnedAt = null;
        let returnedById = null;
        let returnedLate = false;

        if (status === "returned") {
          returnedAt = parseDate(row.returnedat) || new Date();

          const uname = (row.returnedbyusername || "")
            .trim()
            .toLowerCase();
          if (uname) {
            const u = userByUsername.get(uname);
            if (!u)
              throw new Error(`Unknown returnedByUsername "${uname}"`);
            returnedById = u.userId;
          }

          if (row.returnedlate && row.returnedlate.trim() !== "") {
            returnedLate =
              String(row.returnedlate).toLowerCase() === "true" ||
              String(row.returnedlate) === "1";
          } else if (toDate) {
            returnedLate = returnedAt > new Date(`${toDate}T23:59:59`);
          }
        }

        // ---- items (optional → []) ----
        const items = parseItemsJsonOptional(row.items);

        const requestedByName =
          (row.requestedbyname || "").trim() || null;
        const remark = (row.remark || "").trim() || null;
        const returnRemark = (row.returnremark || "").trim() || null;

        const record = await TemelashRecord.create(
          {
            requestId: null,
            requestCode,
            askingStoreId: askingStore.id,
            supplyingStoreId: supplyingStore.id,
            requestedById: userId,
            requestedBy: requestedByName,
            items,
            remark,
            status,
            issuedAt,
            fromDate,
            toDate,
            returnedAt,
            returnedById,
            returnRemark,
            returnedLate,
          },
          { transaction }
        );

        await db.sequelize.query(`RELEASE SAVEPOINT ${sp}`, {
          transaction,
        });

        successCount++;
        imported.push({
          line,
          id: record.id,
          requestCode,
          status,
        });
      } catch (rowError) {
        try {
          await db.sequelize.query(`ROLLBACK TO SAVEPOINT ${sp}`, {
            transaction,
          });
        } catch (rbErr) {
          console.error(
            `❌ Failed to roll back savepoint for line ${line}:`,
            rbErr.message
          );
        }
        failedCount++;
        errors.push({ line, message: rowError.message });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `Import complete: ${successCount} imported, ${failedCount} failed, ${skipped.length} skipped`,
      data: {
        total: rows.length,
        imported: successCount,
        failed: failedCount,
        skipped: skipped.length,
        skippedRows: skipped,
        errors,
        importedRows: imported,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Temelash import error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to import temelash records",
    });
  }
};

// ---------------- small helpers ----------------

function parseCsvLine(line, sep) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseDate(v) {
  if (!v || !String(v).trim()) return null;
  const d = new Date(String(v).trim());
  return isNaN(d.getTime()) ? null : d;
}

function parseDateOnly(v) {
  if (!v || !String(v).trim()) return null;
  const s = String(v).trim().substring(0, 10);
  const d = new Date(`${s}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : s;
}

// Empty / missing items → []
function parseItemsJsonOptional(raw) {
  if (!raw || !String(raw).trim()) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`items is not valid JSON: ${e.message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("items must be a JSON array");
  }
  return parsed.map((it, idx) => {
    if (!it || typeof it !== "object") {
      throw new Error(`items[${idx}] is not an object`);
    }
    const q = it.quantity != null ? Number(it.quantity) : 0;
    if (!Number.isFinite(q) || q < 0) {
      throw new Error(`items[${idx}].quantity must be >= 0`);
    }
    return {
      itemId: it.itemId ?? null,
      code: it.code || "N/A",
      name: it.name || "Unknown",
      quantity: q,
      uom: it.uom || "Units",
      brand: it.brand || "",
      model: it.model || "",
      specification: it.specification || "",
      remark: it.remark || "",
    };
  });
}





// ================================================================
// EXPORTS: internal helper (used by itemRequestController)
// ================================================================
exports.snapshotTemelashRecord = snapshotTemelashRecord;