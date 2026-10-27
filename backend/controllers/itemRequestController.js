// controllers/itemRequestController.js
"use strict";
const db = require("../models");

const {
  ItemRequest,
  ItemRequestDetail,
  Store,
  Item,
  UOM,
  User,
  StoreBalance,
  RequestNotification,
  StoreGroupRelation,
  Department,
  Group,
  TemelashRecord,
  PrintOverride,
  RequestItemProcessing,
  sequelize,
} = db;
const { Op } = require("sequelize");

// ================================================================
// HELPER: Skip stock validation for specific stores
// ================================================================
const STOCK_VALIDATION_SKIP_STORES = ["STORE-006", "STORE-007"];
const SKIP_NOTIFICATION_STORES = ["STORE-006", "STORE-007"];

const shouldSkipStockValidation = (storeCode) =>
  STOCK_VALIDATION_SKIP_STORES.includes(storeCode);

const shouldSkipNotifications = (storeCode) =>
  SKIP_NOTIFICATION_STORES.includes(storeCode);

// ================================================================
// HELPER: Check if the current user is admin
// ================================================================
function isAdminUser(req) {
  return (
    req?.user?.isAdmin === true ||
    req?.user?.role === "admin" ||
    req?.user?.role === "Admin"
  );
}

// ================================================================
// HELPER: Check if the current user created the given request
// ================================================================
function isRequestCreator(req, request) {
  if (isAdminUser(req)) return true;
  const currentUserId = req?.user?.userId;
  if (!currentUserId) return false;
  const creatorId = request?.requestedById;
  if (!creatorId) return false;
  return Number(creatorId) === Number(currentUserId);
}

// ================================================================
// HELPER: Safe include for RequestItemProcessing (avoids crash if
// the association isn't yet defined on ItemRequestDetail).
// ================================================================
function processingInclude() {
  try {
    if (!ItemRequestDetail.associations?.processingRows) return null;
    return {
      model: RequestItemProcessing,
      as: "processingRows",
      required: false,
      include: [
        { model: Group, as: "group", attributes: ["id", "name", "code"], required: false },
        {
          model: User,
          as: "processedByUser",
          attributes: ["userId", "username", "fullName"],
          required: false,
        },
      ],
    };
  } catch {
    return null;
  }
}

function withProcessing(itemsInclude) {
  const p = processingInclude();
  if (!p) return itemsInclude;
  return {
    ...itemsInclude,
    include: [...(itemsInclude.include || []), p],
  };
}

// ================================================================
// HELPER: Get department from SystemSetting for asset approvals
// ================================================================
async function getApprovalDepartmentConfig() {
  try {
    const SystemSetting = db.SystemSetting;
    const setting = await SystemSetting.findOne({
      where: { settingKey: "approval.department" },
    });
    if (!setting || !setting.settingValue) return null;
    const normalized = SystemSetting.normalizeApprovalConfig(setting.settingValue);
    if (!normalized.requiresApproval) return null;
    if (!normalized.departments || normalized.departments.length === 0) return null;
    return { departments: normalized.departments, requiresApproval: true };
  } catch (error) {
    console.error("❌ Error getting approval department config:", error);
    return null;
  }
}

// ================================================================
// HELPER: Resolve the requesting user's group ID
// ================================================================
async function resolveRequestingUserGroupId(req, requestingUserId, transaction = null) {
  const tokenGroupId = req?.user?.groupId || req?.user?.assignedGroupId || null;
  if (tokenGroupId) {
    const num = parseInt(tokenGroupId);
    if (!isNaN(num) && num > 0) {
      console.log(`🔍 Resolved requesting user's group ID from JWT: ${num}`);
      return num;
    }
  }
  if (requestingUserId) {
    try {
      const user = await User.findByPk(requestingUserId, {
        attributes: ["userId", "groupId", "assignedGroupId"],
        transaction,
      });
      if (user) {
        const dbGroupId = user.groupId || user.assignedGroupId;
        if (dbGroupId) {
          const num = parseInt(dbGroupId);
          if (!isNaN(num) && num > 0) {
            console.log(`🔍 Resolved requesting user's group ID from DB: ${num}`);
            return num;
          }
        }
      }
    } catch (err) {
      console.warn(
        `⚠️ Could not fetch user ${requestingUserId} to resolve groupId:`,
        err.message
      );
    }
  }
  console.log(`ℹ️ Could not resolve requesting user's group ID — no exclusion will be applied`);
  return null;
}

// ================================================================
// HELPER: Persist (or update) the PrintOverride page snapshot
// ================================================================
async function savePageSnapshot(requestId, req, transaction = null) {
  try {
    if (!requestId) return null;
    const userId = req.user?.userId ?? null;
    const {
      customHeader = null,
      department = null,
      approvedByName = null,
      overrideDate = null,
      sectionVisibility = null,
      columnsConfig = null,
      customCells = null,
      pageSnapshot = null,
    } = req.body || {};

    if (
      customHeader === null &&
      department === null &&
      approvedByName === null &&
      overrideDate === null &&
      sectionVisibility === null &&
      columnsConfig === null &&
      customCells === null &&
      pageSnapshot === null
    ) {
      return null;
    }

    const patch = {
      customHeader,
      department,
      approvedByName,
      overrideDate,
      sectionVisibility,
      columnsConfig,
      customCells,
      pageSnapshot,
      updatedBy: userId,
    };
    Object.keys(patch).forEach((k) => {
      if (patch[k] === undefined) delete patch[k];
    });

    let row = await PrintOverride.findOne({ where: { requestId }, transaction });
    if (!row) {
      row = await PrintOverride.create({ requestId, userId, ...patch }, { transaction });
      console.log(`📸 [SNAPSHOT] Created page snapshot for request ${requestId}`);
    } else {
      await row.update(patch, { transaction });
      console.log(`📸 [SNAPSHOT] Updated page snapshot for request ${requestId}`);
    }
    return row;
  } catch (err) {
    console.error("❌ [SNAPSHOT] savePageSnapshot error:", err);
    throw err;
  }
}

// ================================================================
// HELPER: Snapshot request items into temelash_records
// ================================================================
async function snapshotTemelashRecord(requestId, transaction = null) {
  try {
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
          include: [{ model: Item, as: "item", include: [{ model: UOM, as: "uom" }] }],
        },
      ],
      transaction,
    });
    if (!requestWithItems) {
      console.warn(`⚠️ [TEMELASH] Request ${requestId} not found — skipping snapshot`);
      return null;
    }

    const snapshotItems = (requestWithItems.items || []).map((d) => ({
      itemId: d.itemId,
      code: d.item?.code || "N/A",
      name: d.item?.name || "Unknown",
      quantity: Number(d.quantity) || 0,
      returnedQuantity: 0,
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
// HELPER: Sum of claims for (itemId, uomCode) at a supplying store
// ----------------------------------------------------------------
// Computes the REMAINING open commitment per item, using:
//   - TemelashRecord.items[].quantity - returnedQuantity  (loans)
//   - ItemRequestDetail.quantity - SUM(RequestItemProcessing.processedQuantity)
//
// Only requests with status pending / approved / finalized are
// considered. A finalized request is expected to have all its
// processing rows marked completed (enforced by updateStatus), so
// it naturally contributes 0 — but we still include it to be safe
// if a shortfall ever survives finalization.
// ================================================================
async function getItemClaims(supplyingStoreId, itemId, uomCode, options = {}) {
  const excludeRequestId = options.excludeRequestId ?? null;
  const includeFamily = options.includeFamily ?? false;

  if (!itemId) {
    return {
      temelashClaimed: 0,
      activeRequestClaimed: 0,
      totalClaimed: 0,
      temelashHits: [],
      activeRequestHits: [],
    };
  }

  let matchIds = [Number(itemId)];
  if (includeFamily) {
    try {
      const { getRelatedItemIds } = require("../utils/itemFamily");
      const related = await getRelatedItemIds(itemId);
      matchIds = [Number(itemId), ...related.map(Number)];
    } catch (err) {
      console.warn(
        `⚠️ getItemClaims: could not expand to family (item ${itemId}):`,
        err.message
      );
    }
  }

  // ------------------------------------------------------------
  // 1) Temelash-out claims: remaining = requested - returned
  // ------------------------------------------------------------
  let temelashClaimed = 0;
  const temelashHits = [];

  if (db.TemelashRecord) {
    const outRecords = await db.TemelashRecord.findAll({
      where: { status: "out", supplyingStoreId },
      attributes: ["id", "requestId", "requestCode", "fromDate", "toDate", "items"],
    });

    for (const rec of outRecords) {
      const arr = Array.isArray(rec.items) ? rec.items : [];
      for (const row of arr) {
        if (!matchIds.includes(Number(row.itemId))) continue;

        const requested = Number(row.quantity) || 0;
        const returned =
          Number(row.returnedQuantity ?? row.returned_quantity ?? 0) || 0;
        const remaining = Math.max(0, requested - returned);
        if (remaining <= 0) continue;

        temelashClaimed += remaining;
        temelashHits.push({
          temelashRecordId: rec.id,
          requestId: rec.requestId,
          requestCode: rec.requestCode,
          quantity: remaining,
          requestedQuantity: requested,
          returnedQuantity: returned,
          uom: row.uom || "Units",
          itemId: Number(row.itemId),
          fromDate: rec.fromDate,
          toDate: rec.toDate,
        });
      }
    }
  }

  // ------------------------------------------------------------
  // 2) Active request claims — remaining via RequestItemProcessing
  // ------------------------------------------------------------
  let activeRequestClaimed = 0;
  const activeRequestHits = [];

  const requestWhere = {
    supplyingStoreId,
    status: { [Op.in]: ["pending", "approved", "finalized"] },
  };
  if (excludeRequestId != null) {
    requestWhere.requestId = { [Op.ne]: Number(excludeRequestId) };
  }

  const openRequests = await ItemRequest.findAll({
    where: requestWhere,
    include: [
      {
        model: ItemRequestDetail,
        as: "items",
        where: { itemId: { [Op.in]: matchIds } },
        required: true,
        attributes: [
          "id",
          "requestId",
          "itemId",
          "quantity",
          "uom_code",
          "is_base_uom",
          "selected_uom",
        ],
      },
    ],
    attributes: [
      "requestId",
      "requestCode",
      "status",
      "askingStoreId",
      "supplyingStoreId",
      "requestedBy",
      "requestedById",
    ],
  });

  if (openRequests.length === 0) {
    return {
      temelashClaimed,
      activeRequestClaimed: 0,
      totalClaimed: temelashClaimed,
      temelashHits,
      activeRequestHits: [],
      matchedItemIds: matchIds,
    };
  }

  const detailIds = [];
  for (const req of openRequests) {
    for (const d of req.items || []) detailIds.push(d.id);
  }

  const processingRows = detailIds.length
    ? await RequestItemProcessing.findAll({
        where: { requestDetailId: { [Op.in]: detailIds } },
        attributes: [
          "requestId",
          "requestDetailId",
          "groupId",
          "processedQuantity",
          "remainingQuantity",
          "status",
          "uomCode",
        ],
      })
    : [];

  // Aggregate processed quantity per detail (across all groups)
  const processingByDetail = new Map();
  for (const row of processingRows) {
    const key = Number(row.requestDetailId);
    if (!processingByDetail.has(key)) {
      processingByDetail.set(key, { processedTotal: 0, groups: [] });
    }
    const bucket = processingByDetail.get(key);
    const pq = Number(row.processedQuantity) || 0;
    bucket.processedTotal += pq;
    bucket.groups.push({
      groupId: Number(row.groupId),
      processedQuantity: pq,
      remainingQuantity: Number(row.remainingQuantity) || 0,
      status: row.status,
      uomCode: row.uomCode || null,
    });
  }

  for (const req of openRequests) {
    for (const detail of req.items || []) {
      const requested = Number(detail.quantity) || 0;
      if (requested <= 0) continue;

      const bucket = processingByDetail.get(Number(detail.id));
      const processed = bucket ? bucket.processedTotal : 0;
      const remaining = Math.max(0, requested - processed);
      if (remaining <= 0) continue;

      activeRequestClaimed += remaining;
      activeRequestHits.push({
        requestId: req.requestId,
        requestCode: req.requestCode,
        status: req.status,
        quantity: remaining,               // remaining open commitment
        requestedQuantity: requested,
        processedQuantity: processed,
        uom: detail.uom_code || "Units",
        itemId: Number(detail.itemId),
        requestDetailId: Number(detail.id),
        askingStoreId: req.askingStoreId,
        supplyingStoreId: req.supplyingStoreId,
        requestedBy: req.requestedBy || null,
        requestedById: req.requestedById || null,
        processingGroups: bucket ? bucket.groups : [],
      });
    }
  }

  return {
    temelashClaimed,
    activeRequestClaimed,
    totalClaimed: temelashClaimed + activeRequestClaimed,
    temelashHits,
    activeRequestHits,
    matchedItemIds: matchIds,
  };
}

// ================================================================
// HELPER: Validate stock availability
// ================================================================
const validateStockAvailability = async (supplyingStoreId, items, options = {}) => {
  const excludeRequestId = options.excludeRequestId ?? null;
  const includeFamilyClaims = options.includeFamilyClaims ?? false;

  const errors = [];
  const stockInfo = [];

  const store = await Store.findByPk(supplyingStoreId);
  if (!store) {
    return { isValid: false, errors: [{ message: "Store not found" }], stockInfo: [] };
  }

  const skipBalance = shouldSkipStockValidation(store.code);
  if (skipBalance) {
    console.log(
      `⚠️ Skipping RAW balance check for store: ${store.code} (${store.name}) — Temelash claims still apply`
    );
  }

  const storeNameCache = new Map();
  async function resolveStoreName(storeId) {
    if (!storeId) return "Unknown Store";
    const key = Number(storeId);
    if (storeNameCache.has(key)) return storeNameCache.get(key);
    const s = await Store.findByPk(key, { attributes: ["storeId", "name"] });
    const name = s ? s.name : `Store#${key}`;
    storeNameCache.set(key, name);
    return name;
  }

  const currentRequestContext = {
    askingStoreName: await resolveStoreName(options.askingStoreId),
    supplyingStoreName: await resolveStoreName(supplyingStoreId),
    requestedByName: options.requestedByName || "Unknown",
  };

  for (const item of items) {
    const itemRecord = await Item.findByPk(item.itemId, {
      include: [
        { model: UOM, as: "uom" },
        { model: UOM, as: "conversionUom" },
      ],
    });

    if (!itemRecord) {
      errors.push({
        itemId: item.itemId,
        requestedQuantity: item.quantity,
        message: `Item with ID ${item.itemId} not found`,
      });
      continue;
    }

    const userQuantity = parseFloat(item.quantity) || 0;
    const userUomCode = item.uomCode || itemRecord.uom?.code || "Units";
    const baseUomCode = itemRecord.uom?.code || "Units";
    const conversionUomCode = itemRecord.conversionUom?.code || null;
    const conversionValue = itemRecord.conversionValue
      ? parseFloat(itemRecord.conversionValue)
      : null;

    let rawBalance = 0;
    let balanceRow = null;
    let balanceType = "none";

    if (!skipBalance) {
      balanceRow = await StoreBalance.findOne({
        where: { storeId: supplyingStoreId, itemId: item.itemId, status: "Active" },
      });
      rawBalance = balanceRow ? parseFloat(balanceRow.balance) : 0;
      balanceType = balanceRow ? "base" : "none";
    }

    const claims = await getItemClaims(supplyingStoreId, item.itemId, userUomCode, {
      excludeRequestId,
      includeFamily: includeFamilyClaims,
    });

    const effectiveAvailable = skipBalance
      ? Number.MAX_SAFE_INTEGER
      : Math.max(0, rawBalance - claims.totalClaimed);

    stockInfo.push({
      itemId: item.itemId,
      itemName: itemRecord.name,
      itemCode: itemRecord.code,
      uomCode: userUomCode,
      isBaseUom: true,
      rawBalance,
      temelashClaimed: claims.temelashClaimed,
      activeRequestClaimed: claims.activeRequestClaimed,
      totalClaimed: claims.totalClaimed,
      availableQuantity: effectiveAvailable,
      requestedQuantity: userQuantity,
      balance: balanceRow,
      balanceType,
      hasBaseBalance: !!balanceRow,
      hasConversionBalance: false,
      conversionUomCode,
      conversionValue,
      temelashHits: claims.temelashHits,
      activeRequestHits: claims.activeRequestHits,
      matchedItemIds: claims.matchedItemIds,
      stockValidationSkipped: skipBalance,
    });

    if (skipBalance) {
      if (claims.temelashClaimed > 0) {
        errors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: userQuantity,
          uomCode: userUomCode,
          balanceType: "temelash",
          message:
            `Item "${itemRecord.name}" is currently out on Temelash loan ` +
            `(${claims.temelashHits.length} record(s) for ${userUomCode}). ` +
            `Return it before requesting again.`,
          temelashHits: claims.temelashHits,
        });
      }
      continue;
    }

    if (!balanceRow) {
      errors.push({
        itemId: item.itemId,
        itemName: itemRecord.name,
        itemCode: itemRecord.code,
        requestedQuantity: userQuantity,
        uomCode: userUomCode,
        availableQuantity: 0,
        balanceType: "none",
        message: `Item not available in ${userUomCode} at this store`,
      });
      continue;
    }

    if (userQuantity > effectiveAvailable) {
      const hasTemelash = claims.temelashClaimed > 0;
      const hasActiveRequest = claims.activeRequestClaimed > 0;

      let reasonSuffix = "";
      if (hasTemelash && hasActiveRequest) {
        reasonSuffix = ", after subtracting active Temelash and open requests";
      } else if (hasTemelash) {
        reasonSuffix = ", after subtracting active Temelash";
      } else if (hasActiveRequest) {
        reasonSuffix = ", after subtracting open requests";
      }

      const blockingRequests = await Promise.all(
        (claims.activeRequestHits || []).map(async (h) => ({
          requestId: h.requestId,
          requestCode: h.requestCode,
          status: h.status,
          quantity: h.quantity,                     // remaining
          requestedQuantity: h.requestedQuantity,
          processedQuantity: h.processedQuantity,
          uom: h.uom,
          askingStoreName: await resolveStoreName(h.askingStoreId),
          supplyingStoreName: await resolveStoreName(h.supplyingStoreId),
          requestedByName: h.requestedBy || "Unknown",
          processingGroups: h.processingGroups || [],
        }))
      );

      const blockingTemelash = (claims.temelashHits || []).map((h) => ({
        temelashRecordId: h.temelashRecordId,
        requestId: h.requestId,
        requestCode: h.requestCode,
        quantity: h.quantity,
        requestedQuantity: h.requestedQuantity,
        returnedQuantity: h.returnedQuantity,
        uom: h.uom,
        fromDate: h.fromDate,
        toDate: h.toDate,
      }));

      const messageLines = [
        `Insufficient stock in ${userUomCode}.`,
        `Requested: ${userQuantity} ${userUomCode}${reasonSuffix}.`,
        `Asking store: ${currentRequestContext.askingStoreName} → Supplying store: ${currentRequestContext.supplyingStoreName}.`,
        `Requested by: ${currentRequestContext.requestedByName}.`,
      ];

      if (blockingTemelash.length > 0) {
        const tList = blockingTemelash
          .map(
            (t) =>
              `${t.requestCode || `Temelash#${t.temelashRecordId}`}` +
              ` (${t.quantity} ${t.uom} still out` +
              (t.returnedQuantity > 0
                ? `, returned ${t.returnedQuantity}/${t.requestedQuantity}`
                : "") +
              `)`
          )
          .join(", ");
        messageLines.push(`Temelash out: ${tList}`);
      }

      if (blockingRequests.length > 0) {
        const rList = blockingRequests
          .map(
            (r) =>
              `${r.requestCode || `#${r.requestId}`}` +
              ` [${r.status}] (${r.quantity} ${r.uom} still open` +
              ` — ${r.processedQuantity}/${r.requestedQuantity} processed)` +
              ` — from ${r.askingStoreName} to ${r.supplyingStoreName}, by ${r.requestedByName}`
          )
          .join("; ");
        messageLines.push(`Open requests: ${rList}`);
      }

      errors.push({
        itemId: item.itemId,
        itemName: itemRecord.name,
        itemCode: itemRecord.code,
        requestedQuantity: userQuantity,
        uomCode: userUomCode,
        balanceType,
        askingStoreName: currentRequestContext.askingStoreName,
        supplyingStoreName: currentRequestContext.supplyingStoreName,
        requestedByName: currentRequestContext.requestedByName,
        message: messageLines.join(" "),
        availableQuantity: effectiveAvailable,
        rawBalance,
        temelashClaimed: claims.temelashClaimed,
        activeRequestClaimed: claims.activeRequestClaimed,
        totalClaimed: claims.totalClaimed,
        blockingRequests,
        blockingTemelash,
        _debug: {
          rawBalance,
          temelashClaimed: claims.temelashClaimed,
          activeRequestClaimed: claims.activeRequestClaimed,
          effectiveAvailable,
          shortage: userQuantity - effectiveAvailable,
        },
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    stockInfo,
    validationSkipped: skipBalance,
    ...(skipBalance && {
      skipReason: `Store ${store.code} is exempt from raw balance checks; Temelash claims still apply`,
    }),
  };
};

// ================================================================
// HELPER: Create notifications — STAGE 1
// ================================================================
async function createRequestNotifications(
  requestId,
  supplyingStoreId,
  askingStoreId,
  isAsset = false,
  transaction = null,
  requestingUserGroupId = null,
  requestingUserId = null,
  excludedDepartmentIds = []
) {
  try {
    console.log(`📤 [STAGE 1] Creating ASKING STORE notifications for request ${requestId}`);

    let askStoreApprovalEnabled = true;
    try {
      askStoreApprovalEnabled = await db.SystemSetting.getAskStoreApprovalEnabled();
    } catch (err) {
      console.warn("⚠️ Could not read ask_store_enabled — defaulting to ENABLED:", err.message);
      askStoreApprovalEnabled = true;
    }

    if (!askStoreApprovalEnabled) {
      console.log(`⏭️ Stage 1 DISABLED — skipping to supplying stage`);
      await createSupplyingStageNotifications(
        requestId,
        supplyingStoreId,
        askingStoreId,
        isAsset,
        transaction,
        excludedDepartmentIds
      );
      return 0;
    }

    let allAskingGroups = await db.sequelize.query(
      `SELECT g.id, g.name, g.code, g.status
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
      {
        replacements: { storeId: parseInt(askingStoreId) },
        type: db.sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    // store-group approval filter (best-effort)
    try {
      const storeGroupConfig = await getStoreGroupApprovalConfig();
      const allowedGroupIds = getAllowedApproverGroupIds(storeGroupConfig, askingStoreId);
      if (allowedGroupIds) {
        allAskingGroups = allAskingGroups.filter((g) => allowedGroupIds.includes(Number(g.id)));
      }
    } catch (err) {
      console.warn("⚠️ Could not apply store-group approval filter:", err.message);
    }

    let askingGroups = allAskingGroups;
    if (requestingUserGroupId) {
      const targetGroupId = parseInt(requestingUserGroupId);
      askingGroups = allAskingGroups.filter((g) => parseInt(g.id) !== targetGroupId);
    }

    if (askingGroups.length === 0) {
      console.log(`⚠️ No asking groups to notify — advancing directly to supplying stage`);
      await createSupplyingStageNotifications(
        requestId,
        supplyingStoreId,
        askingStoreId,
        isAsset,
        transaction,
        excludedDepartmentIds
      );
      return 0;
    }

    const rows = askingGroups
      .filter((g) => g.id && !isNaN(parseInt(g.id)))
      .map((group) => ({
        request_id: parseInt(requestId),
        group_id: parseInt(group.id),
        department_id: null,
        store_id: parseInt(askingStoreId),
        status: "pending",
        approval_type: "group",
        is_department_approval: false,
        stage: "asking_store",
        created_at: new Date(),
        updated_at: new Date(),
      }));

    if (rows.length > 0) {
      const result = await RequestNotification.bulkCreate(rows, {
        validate: false,
        returning: true,
        transaction,
      });
      console.log(`✅ [STAGE 1] Created ${result.length} asking notifications`);
      return result.length;
    }
    return 0;
  } catch (error) {
    console.error("❌ Error creating asking store notifications:", error);
    throw error;
  }
}

// ================================================================
// HELPER: Create notifications — STAGE 2
// ================================================================
async function createSupplyingStageNotifications(
  requestId,
  supplyingStoreId,
  askingStoreId,
  isAsset = false,
  transaction = null,
  excludedDepartmentIds = []
) {
  try {
    console.log(`📤 [STAGE 2] Creating SUPPLYING STORE notifications for request ${requestId}`);

    const existingCount = await RequestNotification.count({
      where: { request_id: requestId, stage: "supplying_store" },
      transaction,
    });
    if (existingCount > 0) {
      console.log(`ℹ️ [STAGE 2] Supplying notifications already exist (${existingCount}) — skipping`);
      return { created: false, count: existingCount };
    }

    let totalCount = 0;

    const supplyingGroups = await db.sequelize.query(
      `SELECT g.id, g.name, g.code, g.status
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
      {
        replacements: { storeId: parseInt(supplyingStoreId) },
        type: db.sequelize.QueryTypes.SELECT,
        transaction,
      }
    );

    const groupRows = supplyingGroups
      .filter((g) => g.id && !isNaN(parseInt(g.id)))
      .map((group) => ({
        request_id: parseInt(requestId),
        group_id: parseInt(group.id),
        department_id: null,
        store_id: parseInt(supplyingStoreId),
        status: "pending",
        approval_type: "group",
        is_department_approval: false,
        stage: "supplying_store",
        created_at: new Date(),
        updated_at: new Date(),
      }));

    if (groupRows.length > 0) {
      const result = await RequestNotification.bulkCreate(groupRows, {
        validate: false,
        returning: true,
        transaction,
      });
      totalCount += result.length;
      console.log(`✅ [STAGE 2] Created ${result.length} supplying group notifications`);
    }

    if (isAsset) {
      const askingStore = await Store.findByPk(askingStoreId, { transaction });
      if (!askingStore) {
        console.log(`⚠️ Asking store ${askingStoreId} not found — skipping department notifications`);
        return { created: true, count: totalCount };
      }

      const config = await getApprovalDepartmentConfig();
      if (!config || !config.departments || config.departments.length === 0) {
        console.log(`⚠️ No approval departments configured — skipping`);
      } else {
        const excludedSet = new Set((excludedDepartmentIds || []).map(Number));
        const applicable = config.departments.filter((d) => {
          const matchesStore = Array.isArray(d.appliesTo) && d.appliesTo.includes(askingStore.code);
          return matchesStore && !excludedSet.has(Number(d.departmentId));
        });

        for (const entry of applicable) {
          const department = await Department.findByPk(entry.departmentId, { transaction });
          if (!department) continue;

          await RequestNotification.create(
            {
              request_id: parseInt(requestId),
              group_id: null,
              department_id: department.departmentId,
              store_id: parseInt(supplyingStoreId),
              status: "pending",
              approval_type: "department",
              is_department_approval: true,
              stage: "supplying_store",
              created_at: new Date(),
              updated_at: new Date(),
            },
            { transaction }
          );
          totalCount++;
        }
      }
    }

    return { created: true, count: totalCount };
  } catch (error) {
    console.error("❌ Error creating supplying stage notifications:", error);
    throw error;
  }
}

// ================================================================
// HELPER: Check if all asking store groups accepted → advance to Stage 2
// ================================================================
async function checkAndAdvanceToSupplyingStage(requestId, transaction = null) {
  try {
    const request = await ItemRequest.findByPk(requestId, { transaction });
    if (!request) return { advanced: false, reason: "request_not_found" };

    const existingSupplying = await RequestNotification.count({
      where: { request_id: requestId, stage: "supplying_store" },
      transaction,
    });
    if (existingSupplying > 0) return { advanced: false, reason: "already_advanced" };

    const askingNotifications = await RequestNotification.findAll({
      where: { request_id: requestId, stage: "asking_store" },
      transaction,
    });
    if (askingNotifications.length === 0) {
      return { advanced: false, reason: "no_asking_notifications" };
    }

    const rejected = askingNotifications.filter((n) => n.status === "rejected").length;
    const pending = askingNotifications.filter((n) => n.status === "pending").length;
    if (rejected > 0) return { advanced: false, reason: "has_rejection" };
    if (pending > 0) return { advanced: false, reason: "still_pending" };

    const excludedDepartmentIds = request.excludedDepartmentIds || [];
    const result = await createSupplyingStageNotifications(
      requestId,
      request.supplyingStoreId,
      request.askingStoreId,
      request.isAsset || false,
      transaction,
      excludedDepartmentIds
    );

    return { advanced: true, count: result.count };
  } catch (error) {
    console.error("❌ Error advancing to supplying stage:", error);
    throw error;
  }
}

// ================================================================
// HELPER: Check if all groups have accepted
// ================================================================
async function isRequestFullyAccepted(requestId) {
  const notifications = await RequestNotification.findAll({
    where: { request_id: requestId },
  });

  if (notifications.length === 0) {
    return {
      allAccepted: false,
      hasRejection: false,
      total: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      pendingCount: 0,
      askingStore: { total: 0, accepted: 0, rejected: 0, pending: 0, allAccepted: false },
      supplyingStore: { total: 0, accepted: 0, rejected: 0, pending: 0, allAccepted: false },
    };
  }

  const asking = notifications.filter((n) => n.stage === "asking_store");
  const supplying = notifications.filter((n) => n.stage === "supplying_store");

  const aAcc = asking.filter((n) => n.status === "accepted").length;
  const aRej = asking.filter((n) => n.status === "rejected").length;
  const aPen = asking.filter((n) => n.status === "pending").length;
  const aAll = asking.length > 0 && aAcc === asking.length;

  const sAcc = supplying.filter((n) => n.status === "accepted").length;
  const sRej = supplying.filter((n) => n.status === "rejected").length;
  const sPen = supplying.filter((n) => n.status === "pending").length;
  const sAll = supplying.length > 0 && sAcc === supplying.length;

  return {
    allAccepted:
      asking.length > 0 && supplying.length > 0 && aAll && sAll,
    hasRejection: aRej > 0 || sRej > 0,
    total: notifications.length,
    acceptedCount: aAcc + sAcc,
    rejectedCount: aRej + sRej,
    pendingCount: aPen + sPen,
    askingStore: { total: asking.length, accepted: aAcc, rejected: aRej, pending: aPen, allAccepted: aAll },
    supplyingStore: { total: supplying.length, accepted: sAcc, rejected: sRej, pending: sPen, allAccepted: sAll },
  };
}

// ================================================================
// 1. CHECK STOCK AVAILABILITY
// ================================================================
exports.checkStockAvailability = async (req, res) => {
  try {
    const { storeId, items } = req.query;
    if (!storeId || !items) {
      return res.status(400).json({ success: false, error: "Store ID and items are required" });
    }

    const parsedItems = JSON.parse(items);
    const validationResult = await validateStockAvailability(parseInt(storeId), parsedItems);

    const itemDetails = await Promise.all(
      parsedItems.map(async (item) => {
        const itemData = await Item.findByPk(item.itemId, {
          include: [{ model: UOM, as: "uom" }],
        });
        const stockInfo = validationResult.stockInfo.find((s) => s.itemId === item.itemId);
        return {
          ...item,
          itemName: itemData?.name || "Unknown",
          itemCode: itemData?.code || "N/A",
          uomCode: itemData?.uom?.code || "Units",
          availableQuantity: stockInfo?.availableQuantity || 0,
          rawBalance: stockInfo?.rawBalance || 0,
          temelashClaimed: stockInfo?.temelashClaimed || 0,
          activeRequestClaimed: stockInfo?.activeRequestClaimed || 0,
          totalClaimed: stockInfo?.totalClaimed || 0,
          activeRequestHits: stockInfo?.activeRequestHits || [],
          temelashHits: stockInfo?.temelashHits || [],
          isAvailable: validationResult.validationSkipped
            ? true
            : (stockInfo?.availableQuantity || 0) > 0,
          hasEnoughStock: validationResult.validationSkipped
            ? true
            : (stockInfo?.availableQuantity || 0) >= item.quantity,
          shortage: validationResult.validationSkipped
            ? 0
            : stockInfo
            ? Math.max(0, item.quantity - stockInfo.availableQuantity)
            : item.quantity,
          stockValidationSkipped: validationResult.validationSkipped || false,
          skipReason: validationResult.skipReason || null,
        };
      })
    );

    res.json({
      success: true,
      data: {
        isValid: validationResult.isValid,
        validationSkipped: validationResult.validationSkipped,
        skipReason: validationResult.skipReason,
        items: itemDetails,
        errors: validationResult.errors,
        summary: {
          totalItems: parsedItems.length,
          availableItems: itemDetails.filter((i) => i.isAvailable).length,
          itemsWithShortage: itemDetails.filter((i) => i.hasEnoughStock === false).length,
          validationSkipped: validationResult.validationSkipped,
        },
      },
    });
  } catch (error) {
    console.error("Check stock error:", error);
    res.status(500).json({ success: false, error: "Failed to check stock availability" });
  }
};

// ================================================================
// 2. GET REQUESTS
// ================================================================
exports.getRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      storeId = "all",
      userId = "all",
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    const currentUser = req.user;
    const currentUserId = currentUser?.userId;
    const currentUserRole = currentUser?.role;

    const { getUserStoreAndGroup } = require("../utils/userAccess");
    let userStoreId = currentUser?.storeId || currentUser?.assignedStoreId;
    let userIsAdmin = false;

    if (!userStoreId && currentUserId) {
      try {
        const accessResult = await getUserStoreAndGroup(currentUserId);
        if (accessResult.success && accessResult.data) {
          userStoreId = accessResult.data.assignedStoreId;
          userIsAdmin = accessResult.data.isAdmin || false;
        }
      } catch (err) {
        console.warn("⚠️ Could not get user store from database:", err);
      }
    }

    if (status !== "all") where.status = status;

    if (currentUserRole === "admin" || userIsAdmin) {
      if (storeId !== "all") {
        where[Op.or] = [
          { askingStoreId: parseInt(storeId) },
          { supplyingStoreId: parseInt(storeId) },
        ];
      }
    } else if (currentUserRole === "storekeeper" || currentUserRole === "store_it") {
      if (!userStoreId) {
        if (currentUserId) where.requestedById = currentUserId;
      } else {
        const askingStoreCondition = { askingStoreId: userStoreId };
        if (status !== "all") askingStoreCondition.status = status;

        const supplyingStoreCondition = {
          supplyingStoreId: userStoreId,
          status: { [Op.in]: ["approved", "finalized"] },
        };
        if (status !== "all" && ["approved", "finalized"].includes(status)) {
          supplyingStoreCondition.status = status;
        }

        where[Op.or] = [askingStoreCondition, supplyingStoreCondition];

        if (storeId !== "all" && parseInt(storeId) !== userStoreId) {
          where[Op.and] = [
            {
              [Op.or]: [
                { askingStoreId: parseInt(storeId) },
                { supplyingStoreId: parseInt(storeId) },
              ],
            },
            { [Op.or]: [askingStoreCondition, supplyingStoreCondition] },
          ];
        }
      }
    } else if (currentUserRole === "checker" || currentUserRole === "finance") {
      where.status = status === "all" ? { [Op.in]: ["approved", "finalized"] } : status;
      if (userStoreId) {
        where[Op.or] = [
          { askingStoreId: userStoreId },
          { supplyingStoreId: userStoreId },
        ];
      }
    } else {
      if (currentUserId) where.requestedById = currentUserId;
    }

    if (userId !== "all") where.requestedById = userId;

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { requestCode: { [Op.like]: `%${search}%` } },
          { remark: { [Op.like]: `%${search}%` } },
        ],
      };
      if (where[Op.and]) where[Op.and].push(searchCondition);
      else where[Op.and] = [searchCondition];
    }

    const totalCount = await ItemRequest.count({ where });

    const rows = await ItemRequest.findAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [
                { model: UOM, as: "uom" },
                {
                  model: db.Category,
                  as: "category",
                  attributes: ["categoryId", "name"],
                  required: false,
                },
              ],
            },
          ],
          attributes: [
            "id", "requestId", "itemId", "quantity", "remark",
            "selected_uom", "uom_code", "is_base_uom",
            "specification", "brand", "model", "created_at", "updated_at",
          ],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: Department, as: "department" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        requests: rows,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("❌ GET REQUESTS ERROR:", error);
    res.status(500).json({ success: false, error: "Failed to fetch requests" });
  }
};

// ================================================================
// 3. GET SINGLE REQUEST BY ID
// ================================================================
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ItemRequest.findByPk(id, {
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [
                { model: UOM, as: "uom" },
                { model: UOM, as: "conversionUom" },
              ],
            },
          ],
          attributes: [
            "id", "requestId", "itemId", "quantity", "remark",
            "selected_uom", "uom_code", "is_base_uom",
            "specification", "brand", "model", "created_at", "updated_at",
          ],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
          include: [
            {
              model: db.Department,
              as: "Department",
              attributes: ["department_id", "name", "code", "description"],
            },
          ],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: db.Group, as: "group" },
            { model: db.Department, as: "department" },
            { model: User, as: "respondedByUser" },
          ],
        },
        { model: PrintOverride, as: "printOverride", required: false },
      ],
    });

    if (!request) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error("Get request error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch request" });
  }
};

// ================================================================
// 4. CREATE REQUEST
// ================================================================
exports.createRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      askingStoreId, supplyingStoreId, items, requestedById, requestedBy,
      requestedDate, status = "pending", remark, isAsset = false,
      isTemelash = false, temelashFromDate = null, temelashToDate = null,
      excludedDepartmentIds = [],
    } = req.body;

    if (!askingStoreId || !supplyingStoreId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Asking store and supplying store are required" });
    }

    if (parseInt(askingStoreId) === parseInt(supplyingStoreId)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Asking store and supplying store cannot be the same" });
    }

    if (isTemelash === true) {
      if (!temelashFromDate || !temelashToDate) {
        await t.rollback();
        return res.status(400).json({ success: false, error: "Temelash requires both 'From' and 'To' dates" });
      }
      if (temelashToDate < temelashFromDate) {
        await t.rollback();
        return res.status(400).json({ success: false, error: "Temelash 'To' date must be on or after the 'From' date" });
      }
    }

    const askingStore = await Store.findByPk(askingStoreId);
    const supplyingStore = await Store.findByPk(supplyingStoreId);

    if (!askingStore || !supplyingStore) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "One or both stores not found" });
    }
    if (askingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Asking store "${askingStore.name}" is not active` });
    }
    if (supplyingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Supplying store "${supplyingStore.name}" is not active` });
    }

    const skipNotifications = shouldSkipNotifications(supplyingStore.code);

    if (requestedById) {
      const user = await User.findByPk(requestedById);
      if (!user) {
        await t.rollback();
        return res.status(404).json({ success: false, error: "User not found" });
      }
    }

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "At least one item is required" });
    }

    const validatedItems = [];
    const validationErrors = [];
    const itemIds = items.map((it) => it.itemId);

    const itemRecords = await Item.findAll({
      where: { itemId: { [Op.in]: itemIds } },
      include: [
        { model: UOM, as: "uom" },
        { model: UOM, as: "conversionUom" },
      ],
      transaction: t,
    });

    const itemMap = {};
    itemRecords.forEach((r) => (itemMap[r.itemId] = r));

    for (const item of items) {
      const itemRecord = itemMap[item.itemId];
      if (!itemRecord) {
        validationErrors.push({
          itemId: item.itemId,
          itemName: "Unknown Item",
          itemCode: "N/A",
          requestedQuantity: item.quantity,
          message: `Item with ID ${item.itemId} not found in database`,
        });
        continue;
      }
      if (itemRecord.status !== "Active") {
        validationErrors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: item.quantity,
          message: `Item "${itemRecord.name}" is ${itemRecord.status}`,
        });
        continue;
      }
      if (!item.quantity || item.quantity <= 0) {
        validationErrors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: item.quantity || 0,
          message: "Quantity must be greater than 0",
        });
        continue;
      }

      validatedItems.push({
        ...item,
        itemRecord,
        itemName: itemRecord.name,
        itemCode: itemRecord.code,
        uomCode: item.uomCode || itemRecord.uom?.code || "Units",
        selectedUom: item.selectedUom || "base",
        isBaseUom: item.isBaseUom !== false,
        specification: item.specification || null,
        brand: item.brand || null,
        model: item.model || null,
      });
    }

    if (validationErrors.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Item validation failed",
        message: "Some items are invalid or inactive",
        errors: validationErrors,
      });
    }

    const stockValidation = await validateStockAvailability(
      supplyingStoreId,
      validatedItems,
      { askingStoreId, requestedByName: requestedBy || null }
    );

    if (!stockValidation.validationSkipped && stockValidation.errors.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Stock validation failed",
        errors: stockValidation.errors,
        stockInfo: stockValidation.stockInfo,
        summary: {
          totalItems: validatedItems.length,
          itemsWithStock: stockValidation.stockInfo.filter((s) => s.availableQuantity > 0).length,
          itemsWithoutStock: stockValidation.errors.filter((e) => e.availableQuantity === 0).length,
          itemsWithShortage: stockValidation.errors.filter((e) => e.availableQuantity > 0 && e.shortage > 0).length,
          storeName: supplyingStore.name,
          storeId: supplyingStoreId,
          validationSkipped: false,
        },
      });
    }

    const requestCreateData = {
      askingStoreId: parseInt(askingStoreId),
      supplyingStoreId: parseInt(supplyingStoreId),
      requestedById: requestedById || null,
      requestedBy: requestedBy || null,
      requestedDate: requestedDate || new Date().toISOString().split("T")[0],
      status: status || "pending",
      remark: remark || null,
      isAsset: isAsset || false,
      isTemelash: isTemelash === true,
      temelashFromDate: isTemelash === true ? temelashFromDate || null : null,
      temelashToDate: isTemelash === true ? temelashToDate || null : null,
      excludedDepartmentIds: Array.isArray(excludedDepartmentIds) ? excludedDepartmentIds : [],
    };

    let request;
    let codeAttempt = 0;
    while (true) {
      const requestCode = await ItemRequest.generateRequestCode(t, codeAttempt);
      try {
        request = await ItemRequest.create(
          { ...requestCreateData, requestCode },
          { transaction: t }
        );
        break;
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError" && codeAttempt < 4) {
          codeAttempt++;
          continue;
        }
        throw err;
      }
    }

    await Promise.all(
      validatedItems.map((item) =>
        ItemRequestDetail.create(
          {
            requestId: request.requestId,
            itemId: item.itemId,
            quantity: item.quantity,
            remark: item.remark || null,
            selected_uom: item.selectedUom || "base",
            uom_code: item.uomCode || item.itemRecord?.uom?.code || "Units",
            is_base_uom: item.isBaseUom !== false,
            specification: item.specification || null,
            brand: item.brand || null,
            model: item.model || null,
          },
          { transaction: t }
        )
      )
    );

    let notificationCount = 0;
    if (!skipNotifications) {
      try {
        const requestingUserGroupId = await resolveRequestingUserGroupId(req, requestedById, t);
        notificationCount = await createRequestNotifications(
          request.requestId,
          supplyingStoreId,
          askingStoreId,
          isAsset,
          t,
          requestingUserGroupId,
          requestedById,
          excludedDepartmentIds
        );
      } catch (notifError) {
        console.error("❌ Error creating notifications:", notifError);
      }
    }

    let printOverride = null;
    try {
      printOverride = await savePageSnapshot(request.requestId, req, t);
    } catch (snapErr) {
      await t.rollback();
      return res.status(500).json({
        success: false,
        error: "Failed to save request page snapshot",
        message: snapErr.message,
      });
    }

    await t.commit();

    const completeRequest = await ItemRequest.findByPk(request.requestId, {
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [
                { model: UOM, as: "uom" },
                { model: UOM, as: "conversionUom" },
              ],
            },
          ],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: Department, as: "department" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
    });

    const stockInfoResponse = stockValidation.validationSkipped
      ? stockValidation.stockInfo.map((s) => ({
          itemId: s.itemId,
          itemName: s.itemName,
          itemCode: s.itemCode,
          availableQuantity: Number.MAX_SAFE_INTEGER,
          availableQuantityDisplay: "Unlimited (SKIPPED)",
          rawBalance: s.rawBalance,
          temelashClaimed: s.temelashClaimed,
          activeRequestClaimed: s.activeRequestClaimed,
          totalClaimed: s.totalClaimed,
          requestedQuantity: s.requestedQuantity,
          uomCode: s.uomCode,
          hasStock: true,
          hasEnoughStock: true,
          stockValidationSkipped: true,
          skipReason: s.skipReason,
          activeRequestHits: s.activeRequestHits || [],
        }))
      : stockValidation.stockInfo.map((s) => ({
          itemId: s.itemId,
          itemName: s.itemName || "Unknown",
          itemCode: s.itemCode || "N/A",
          availableQuantity: s.availableQuantity,
          rawBalance: s.rawBalance,
          temelashClaimed: s.temelashClaimed,
          activeRequestClaimed: s.activeRequestClaimed,
          totalClaimed: s.totalClaimed,
          requestedQuantity: s.requestedQuantity,
          uomCode: s.uomCode || "Units",
          hasStock: s.availableQuantity > 0,
          hasEnoughStock: s.requestedQuantity <= s.availableQuantity,
          stockValidationSkipped: false,
          activeRequestHits: s.activeRequestHits || [],
        }));

    const responseMessage = skipNotifications
      ? `✅ Request created successfully. (${supplyingStore.code} - No approval required - Foreign/Local Purchase)`
      : `✅ Request created successfully. Notifications sent to asking store groups first.`;

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        request: completeRequest,
        printOverride,
        isAsset,
        isTemelash: isTemelash === true,
        skipNotifications,
        skipReason: skipNotifications
          ? `Store ${supplyingStore.code} does not require approval (Foreign/Local Purchase)`
          : null,
        notificationCount,
        currentStage: "asking_store",
        excludedDepartmentIds,
        stockValidation: {
          allItemsAvailable: stockValidation.isValid || stockValidation.validationSkipped,
          validationSkipped: stockValidation.validationSkipped,
          skipReason: stockValidation.skipReason || null,
          items: stockInfoResponse,
          summary: {
            totalItems: validatedItems.length,
            allItemsAvailable: stockValidation.isValid || stockValidation.validationSkipped,
            storeName: supplyingStore.name,
            storeCode: supplyingStore.code,
            validationSkipped: stockValidation.validationSkipped,
          },
        },
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Create request error:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: error.errors.map((e) => e.message).join(", "),
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create request",
    });
  }
};

// ================================================================
// 5. UPDATE REQUEST
// ================================================================
exports.updateRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      askingStoreId, supplyingStoreId, items, requestedById, requestedBy,
      requestedDate, remark, isAsset, isTemelash, temelashFromDate, temelashToDate,
      excludedDepartmentIds = [],
    } = req.body;

    const request = await ItemRequest.findByPk(id, { transaction: t });
    if (!request) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    if (!isRequestCreator(req, request)) {
      await t.rollback();
      return res.status(403).json({ success: false, error: "Only the request creator can edit this request" });
    }

    if (request.status === "finalized") {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Cannot edit finalized requests" });
    }

    // 🔒 Block edit if anything has already been processed
    const alreadyProcessed = await RequestItemProcessing.count({
      where: { requestId: request.requestId },
      transaction: t,
    });
    if (alreadyProcessed > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error:
          "Cannot edit this request — one or more items have already been processed by the supplying store",
        processedRecords: alreadyProcessed,
      });
    }

    const nextAskingStoreId =
      askingStoreId !== undefined && askingStoreId !== null && askingStoreId !== ""
        ? parseInt(askingStoreId)
        : request.askingStoreId;

    const nextSupplyingStoreId =
      supplyingStoreId !== undefined && supplyingStoreId !== null && supplyingStoreId !== ""
        ? parseInt(supplyingStoreId)
        : request.supplyingStoreId;

    if (nextAskingStoreId === nextSupplyingStoreId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: "Asking store and supplying store cannot be the same" });
    }

    const nextIsTemelash = isTemelash !== undefined ? isTemelash === true : request.isTemelash;
    const nextTemelashFromDate = temelashFromDate !== undefined ? temelashFromDate : request.temelashFromDate;
    const nextTemelashToDate = temelashToDate !== undefined ? temelashToDate : request.temelashToDate;

    if (nextIsTemelash === true) {
      if (!nextTemelashFromDate || !nextTemelashToDate) {
        await t.rollback();
        return res.status(400).json({ success: false, error: "Temelash requires both 'From' and 'To' dates" });
      }
      if (nextTemelashToDate < nextTemelashFromDate) {
        await t.rollback();
        return res.status(400).json({ success: false, error: "Temelash 'To' date must be on or after the 'From' date" });
      }
    }

    const askingStore = await Store.findByPk(nextAskingStoreId, { transaction: t });
    const supplyingStore = await Store.findByPk(nextSupplyingStoreId, { transaction: t });

    if (!askingStore || !supplyingStore) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "One or both stores not found" });
    }
    if (askingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Asking store "${askingStore.name}" is not active` });
    }
    if (supplyingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Supplying store "${supplyingStore.name}" is not active` });
    }

    let validatedItems = [];
    let stockValidation = null;

    if (items && items.length > 0) {
      const itemIds = items.map((it) => it.itemId);
      const itemRecords = await Item.findAll({
        where: { itemId: { [Op.in]: itemIds } },
        include: [
          { model: UOM, as: "uom" },
          { model: UOM, as: "conversionUom" },
        ],
        transaction: t,
      });

      const itemMap = {};
      itemRecords.forEach((r) => (itemMap[r.itemId] = r));

      const validationErrors = [];

      for (const item of items) {
        const itemRecord = itemMap[item.itemId];
        if (!itemRecord) {
          validationErrors.push({
            itemId: item.itemId,
            itemName: "Unknown Item",
            itemCode: "N/A",
            requestedQuantity: item.quantity,
            message: `Item with ID ${item.itemId} not found in database`,
          });
          continue;
        }
        if (itemRecord.status !== "Active") {
          validationErrors.push({
            itemId: item.itemId,
            itemName: itemRecord.name,
            itemCode: itemRecord.code,
            requestedQuantity: item.quantity,
            message: `Item "${itemRecord.name}" is ${itemRecord.status}`,
          });
          continue;
        }
        if (!item.quantity || item.quantity <= 0) {
          validationErrors.push({
            itemId: item.itemId,
            itemName: itemRecord.name,
            itemCode: itemRecord.code,
            requestedQuantity: item.quantity || 0,
            message: "Quantity must be greater than 0",
          });
          continue;
        }

        let uomCode = item.uomCode;
        if (!uomCode || uomCode === "") uomCode = itemRecord.uom?.code || "Units";

        validatedItems.push({
          ...item,
          itemRecord,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode,
          selectedUom: item.selectedUom || "base",
          isBaseUom: item.isBaseUom !== false,
          specification:
            item.specification && String(item.specification).trim() !== ""
              ? item.specification
              : itemRecord.specText || null,
          brand:
            item.brand && String(item.brand).trim() !== ""
              ? item.brand
              : itemRecord.brand || null,
          model:
            item.model && String(item.model).trim() !== ""
              ? item.model
              : itemRecord.model || null,
        });
      }

      if (validationErrors.length > 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: "Item validation failed",
          message: "Some items are invalid or inactive",
          errors: validationErrors,
        });
      }

      stockValidation = await validateStockAvailability(
        nextSupplyingStoreId,
        validatedItems,
        {
          excludeRequestId: request.requestId,
          askingStoreId: nextAskingStoreId,
          requestedByName: requestedBy || request.requestedBy || null,
        }
      );

      if (!stockValidation.validationSkipped && stockValidation.errors.length > 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          error: "Stock validation failed",
          errors: stockValidation.errors,
          stockInfo: stockValidation.stockInfo,
          summary: {
            totalItems: validatedItems.length,
            itemsWithStock: stockValidation.stockInfo.filter((s) => s.availableQuantity > 0).length,
            itemsWithoutStock: stockValidation.errors.filter((e) => e.availableQuantity === 0).length,
            itemsWithShortage: stockValidation.errors.filter((e) => e.availableQuantity > 0 && e.shortage > 0).length,
            storeName: supplyingStore.name,
            storeId: nextSupplyingStoreId,
            validationSkipped: false,
          },
        });
      }
    }

    await request.update(
      {
        askingStoreId: nextAskingStoreId,
        supplyingStoreId: nextSupplyingStoreId,
        requestedById: requestedById !== undefined ? requestedById : request.requestedById,
        requestedBy: requestedBy !== undefined ? requestedBy : request.requestedBy,
        requestedDate: requestedDate || request.requestedDate,
        status: "pending",
        remark: remark !== undefined ? remark : request.remark,
        isAsset: isAsset !== undefined ? isAsset : request.isAsset,
        isTemelash: nextIsTemelash,
        temelashFromDate: nextIsTemelash === true ? nextTemelashFromDate || null : null,
        temelashToDate: nextIsTemelash === true ? nextTemelashToDate || null : null,
        excludedDepartmentIds: Array.isArray(excludedDepartmentIds) ? excludedDepartmentIds : [],
      },
      { transaction: t }
    );

    if (validatedItems.length > 0) {
      await ItemRequestDetail.destroy({ where: { requestId: id }, transaction: t });
      await Promise.all(
        validatedItems.map((item) =>
          ItemRequestDetail.create(
            {
              requestId: request.requestId,
              itemId: item.itemId,
              quantity: item.quantity,
              remark: item.remark || null,
              selected_uom: item.selectedUom || "base",
              uom_code: item.uomCode || item.itemRecord?.uom?.code || "Units",
              is_base_uom: item.isBaseUom !== false,
              specification: item.specification || null,
              brand: item.brand || null,
              model: item.model || null,
            },
            { transaction: t }
          )
        )
      );
    }

    const skipNotifications = shouldSkipNotifications(supplyingStore.code);
    const updatedIsAsset = isAsset !== undefined ? isAsset : request.isAsset;
    const updatedRequestedById = requestedById !== undefined ? requestedById : request.requestedById;

    await RequestNotification.destroy({ where: { request_id: id }, transaction: t });

    if (!skipNotifications) {
      try {
        const requestingUserGroupId = await resolveRequestingUserGroupId(req, updatedRequestedById, t);
        await createRequestNotifications(
          request.requestId,
          nextSupplyingStoreId,
          nextAskingStoreId,
          updatedIsAsset || false,
          t,
          requestingUserGroupId,
          updatedRequestedById,
          excludedDepartmentIds
        );
      } catch (notifError) {
        await t.rollback();
        return res.status(500).json({
          success: false,
          error: notifError.message || "Failed to recreate notifications",
          phase: "notifications",
        });
      }
    }

    let printOverride = null;
    try {
      printOverride = await savePageSnapshot(request.requestId, req, t);
    } catch (snapErr) {
      await t.rollback();
      return res.status(500).json({
        success: false,
        error: "Failed to update request page snapshot",
        message: snapErr.message,
      });
    }

    await t.commit();

    const updatedRequest = await ItemRequest.findByPk(id, {
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [
                { model: UOM, as: "uom" },
                { model: UOM, as: "conversionUom" },
              ],
            },
          ],
          attributes: [
            "id", "requestId", "itemId", "quantity", "remark",
            "selected_uom", "uom_code", "is_base_uom",
            "specification", "brand", "model", "created_at", "updated_at",
          ],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: Department, as: "department" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
    });

    return res.json({
      success: true,
      message: skipNotifications
        ? `Request updated successfully. (${supplyingStore.code} - No approval required)`
        : "Request updated successfully. Restarted at asking store approval stage.",
      data: updatedRequest,
      printOverride,
    });
  } catch (error) {
    try {
      await t.rollback();
    } catch (rollbackError) {
      console.error("⚠️ Rollback failed:", rollbackError.message);
    }
    console.error("❌ Update request error:", {
      name: error?.name,
      message: error?.message,
      sql: error?.sql,
      parent: error?.parent?.message,
      original: error?.original?.message,
      stack: error?.stack,
    });
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        message: error.errors.map((e) => e.message).join(", "),
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update request",
    });
  }
};

// ================================================================
// 6. UPDATE REQUEST STATUS
// ================================================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "rejected", "finalized"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: pending, approved, rejected, finalized",
      });
    }

    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }

    if (!isRequestCreator(req, request)) {
      return res.status(403).json({ success: false, error: "Only the request creator can change status" });
    }
    if (request.status === "finalized") {
      return res.status(400).json({ success: false, error: "Cannot change status of finalized requests" });
    }
    if (request.status === "rejected" && status === "approved") {
      return res.status(400).json({
        success: false,
        error: "Cannot approve a rejected request. Edit the request to reset status to pending",
      });
    }

    const previousStatus = request.status;

    // 🔒 Block finalize unless every processing row is completed
    if (status === "finalized") {
      const openProcessing = await RequestItemProcessing.findAll({
        where: {
          requestId: request.requestId,
          status: { [Op.ne]: "completed" },
        },
        attributes: ["id", "requestDetailId", "remainingQuantity", "status"],
      });
      if (openProcessing.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Cannot finalize — some items are not fully processed",
          openProcessing,
        });
      }
    }

    // 🔒 Block Temelash approval once processing has started
    if (
      status === "approved" &&
      previousStatus !== "approved" &&
      request.isTemelash === true
    ) {
      const processed = await RequestItemProcessing.count({
        where: { requestId: request.requestId },
      });
      if (processed > 0) {
        return res.status(400).json({
          success: false,
          error: "Cannot approve as Temelash after items have been processed",
        });
      }
    }

    await request.update({ status });

    let temelashRecord = null;
    if (
      status === "approved" &&
      previousStatus !== "approved" &&
      request.isTemelash === true
    ) {
      try {
        temelashRecord = await snapshotTemelashRecord(request.requestId);
      } catch (snapErr) {
        console.error("⚠️ Failed to snapshot Temelash record:", request.requestId, snapErr);
      }
    }

    const updatedRequest = await ItemRequest.findByPk(id, {
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [{ model: UOM, as: "uom" }],
            },
          ],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
      ],
    });

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: updatedRequest,
      temelashRecord,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update status",
    });
  }
};

// ================================================================
// 7–10. READ ENDPOINTS (each includes processingRows)
// ================================================================
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [{ model: Item, as: "item", include: [{ model: UOM, as: "uom" }] }],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Get by user error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch requests for user" });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [{ model: Item, as: "item", include: [{ model: UOM, as: "uom" }] }],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Get my requests error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch your requests" });
  }
};

exports.getByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["pending", "approved", "rejected", "finalized"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be one of: pending, approved, rejected, finalized",
      });
    }

    const requests = await ItemRequest.findAll({
      where: { status },
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [{ model: Item, as: "item", include: [{ model: UOM, as: "uom" }] }],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Get by status error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch requests by status" });
  }
};

exports.getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: "startDate and endDate are required" });
    }
    const requests = await ItemRequest.findAll({
      where: { requestedDate: { [Op.between]: [startDate, endDate] } },
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [{ model: Item, as: "item", include: [{ model: UOM, as: "uom" }] }],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
      order: [["requestedDate", "DESC"]],
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error("Get by date range error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch requests by date range" });
  }
};

// ================================================================
// 11. DELETE REQUEST
// ================================================================
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = isAdminUser(req);

    const request = await ItemRequest.findByPk(id);
    if (!request) return res.status(404).json({ success: false, error: "Request not found" });

    if (!admin) {
      if (!isRequestCreator(req, request)) {
        return res.status(403).json({
          success: false,
          error: "Only the request creator can delete this request",
        });
      }
      if (request.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: `Cannot delete ${request.status} requests. Only pending requests can be deleted.`,
        });
      }
    }

    const previousStatus = request.status;
    const requestCode = request.requestCode;

    // 🔒 Block deletion if any processing has been recorded
    const processed = await RequestItemProcessing.count({ where: { requestId: id } });
    if (processed > 0 && !admin) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete — one or more items have already been processed",
      });
    }

    await RequestNotification.destroy({ where: { request_id: id } });
    await RequestItemProcessing.destroy({ where: { request_id: id } });
    if (db.TemelashRecord) await db.TemelashRecord.destroy({ where: { request_id: id } });
    if (db.PrintOverride) await db.PrintOverride.destroy({ where: { requestId: id } });

    if (admin && previousStatus !== "pending") {
      console.warn(
        `[ADMIN DELETE] user=${req.user?.userId} (${req.user?.username}) ` +
          `deleted request ${requestCode} (previous status: ${previousStatus})`
      );
    }

    await request.destroy();

    res.json({
      success: true,
      message: admin
        ? `Request deleted (was ${previousStatus})`
        : "Request deleted successfully",
      deletedStatus: previousStatus,
      requestCode,
    });
  } catch (error) {
    console.error("Delete request error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete request" });
  }
};

// ================================================================
// 12. GET REQUEST WITH NOTIFICATIONS
// ================================================================
exports.getRequestWithNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ItemRequest.findByPk(id, {
      include: [
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [{ model: Item, as: "item", include: [{ model: UOM, as: "uom" }] }],
        }),
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
        },
        {
          model: RequestNotification,
          as: "notifications",
          include: [
            { model: Group, as: "group" },
            { model: Department, as: "department" },
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
    });
    if (!request) return res.status(404).json({ success: false, error: "Request not found" });

    const notifications = request.notifications || [];
    const asking = notifications.filter((n) => n.stage === "asking_store");
    const supplying = notifications.filter((n) => n.stage === "supplying_store");

    const total = notifications.length;
    const accepted = notifications.filter((n) => n.status === "accepted").length;
    const rejected = notifications.filter((n) => n.status === "rejected").length;
    const pending = notifications.filter((n) => n.status === "pending").length;

    const rejectionReasons = notifications
      .filter((n) => n.status === "rejected")
      .map((n) => {
        let name = "Unknown";
        if (n.group_id) name = n.group?.name || `Group ${n.group_id}`;
        else if (n.department_id) name = n.department?.name || `Department ${n.department_id}`;
        return {
          id: n.id,
          type: n.approval_type || "group",
          stage: n.stage || "supplying_store",
          name,
          reason: n.rejected_reason,
          respondedBy:
            n.respondedByUser?.fullName || n.respondedByUser?.username || "Unknown",
          respondedAt: n.responded_at,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        request,
        notificationSummary: {
          total, accepted, rejected, pending,
          allAccepted: total > 0 && accepted === total,
          hasRejection: rejected > 0,
          rejectionReasons,
          askingStore: {
            total: asking.length,
            accepted: asking.filter((n) => n.status === "accepted").length,
            rejected: asking.filter((n) => n.status === "rejected").length,
            pending: asking.filter((n) => n.status === "pending").length,
          },
          supplyingStore: {
            total: supplying.length,
            accepted: supplying.filter((n) => n.status === "accepted").length,
            rejected: supplying.filter((n) => n.status === "rejected").length,
            pending: supplying.filter((n) => n.status === "pending").length,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error getting request with notifications:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get request" });
  }
};

// ================================================================
// 13. CHECK REQUEST NOTIFICATION STATUS
// ================================================================
exports.checkRequestNotificationStatus = async (req, res) => {
  try {
    const status = await isRequestFullyAccepted(parseInt(req.params.id));
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    console.error("Error checking notification status:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to check notification status" });
  }
};

// ================================================================
// 14. ACCEPT NOTIFICATION
// ================================================================
exports.acceptNotification = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { notificationId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const notification = await RequestNotification.findByPk(notificationId, { transaction: t });
    if (!notification) {
      await t.rollback();
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    if (notification.status !== "pending") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Notification is already ${notification.status}`,
      });
    }

    await notification.update(
      { status: "accepted", responded_by: userId, responded_at: new Date() },
      { transaction: t }
    );

    let stageAdvanced = false;
    let advancementResult = null;
    if (notification.stage === "asking_store") {
      advancementResult = await checkAndAdvanceToSupplyingStage(notification.request_id, t);
      stageAdvanced = advancementResult.advanced;
    }

    await t.commit();
    res.status(200).json({
      success: true,
      message: stageAdvanced
        ? "Notification accepted. Request advanced to supplying store stage."
        : "Notification accepted successfully",
      data: notification,
      stageAdvanced,
      advancementReason: advancementResult?.reason || null,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Error accepting notification:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to accept notification" });
  }
};

// ================================================================
// 15. REJECT NOTIFICATION
// ================================================================
exports.rejectNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "User not authenticated" });
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Rejection reason is required" });
    }

    const notification = await RequestNotification.findByPk(notificationId);
    if (!notification) return res.status(404).json({ success: false, error: "Notification not found" });
    if (notification.status !== "pending") {
      return res.status(400).json({ success: false, error: `Notification is already ${notification.status}` });
    }

    await notification.update({
      status: "rejected",
      rejected_reason: reason.trim(),
      responded_by: userId,
      responded_at: new Date(),
    });

    res.status(200).json({ success: true, message: "Notification rejected", data: notification });
  } catch (error) {
    console.error("Error rejecting notification:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to reject notification" });
  }
};

// ================================================================
// 16. GET REJECTION REASONS
// ================================================================
exports.getRejectionReasons = async (req, res) => {
  try {
    const { requestId } = req.params;
    const notifications = await RequestNotification.findAll({
      where: { request_id: requestId, status: "rejected" },
      include: [
        { model: Group, as: "group" },
        { model: User, as: "respondedByUser" },
      ],
    });
    const reasons = notifications.map((n) => ({
      groupId: n.group_id,
      groupName: n.group?.name || "Unknown Group",
      stage: n.stage,
      reason: n.rejected_reason,
      respondedBy:
        n.respondedByUser?.fullName || n.respondedByUser?.username || "Unknown",
      respondedAt: n.responded_at,
    }));
    res.status(200).json({ success: true, data: reasons });
  } catch (error) {
    console.error("Error getting rejection reasons:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get rejection reasons" });
  }
};

// ================================================================
// 17. EXPORT REQUESTS
// ================================================================
exports.exportRequests = async (req, res) => {
  try {
    const { status, storeId, userId } = req.query;
    const where = {};
    if (status && status !== "all") where.status = status;
    if (storeId && storeId !== "all") {
      where[Op.or] = [{ askingStoreId: storeId }, { supplyingStoreId: storeId }];
    }
    if (userId && userId !== "all") where.requestedById = userId;

    const requests = await ItemRequest.findAll({
      where,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: ItemRequestDetail,
          as: "items",
          include: [{ model: Item, as: "item", include: [{ model: UOM, as: "uom" }] }],
        },
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email"],
        },
      ],
    });

    const exportData = requests.map((r) => ({
      "Request Code": r.requestCode,
      "Asking Store": r.askingStore?.name || "N/A",
      "Supplying Store": r.supplyingStore?.name || "N/A",
      "Requested By":
        r.requestedByUser?.fullName || r.requestedByUser?.username || "N/A",
      "Requested By Email": r.requestedByUser?.email || "N/A",
      "Requested Date": r.requestedDate,
      Status: r.status,
      Items: r.items
        .map(
          (it) =>
            `${it.item?.name || "Unknown"} (${it.quantity} ${
              it.item?.uom?.code || "Units"
            })`
        )
        .join("; "),
      Remark: r.remark || "",
    }));

    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ success: false, error: "Failed to export requests" });
  }
};

// ================================================================
// 18. GET REQUEST STATISTICS
// ================================================================
exports.getStats = async (req, res) => {
  try {
    const currentUser = req.user;
    const currentUserId = currentUser?.userId;
    const currentUserRole = currentUser?.role;
    const userStoreId = currentUser?.storeId || currentUser?.assignedStoreId;

    let where = {};

    if (currentUserRole === "admin") {
      // all
    } else if (currentUserRole === "storekeeper" || currentUserRole === "store_it") {
      if (userStoreId) {
        where[Op.or] = [
          { askingStoreId: userStoreId },
          { supplyingStoreId: userStoreId },
        ];
      } else if (currentUserId) {
        where.requestedById = currentUserId;
      }
    } else if (currentUserRole === "checker" || currentUserRole === "finance") {
      where.status = { [Op.in]: ["approved", "finalized"] };
      if (userStoreId) {
        where[Op.or] = [
          { askingStoreId: userStoreId },
          { supplyingStoreId: userStoreId },
        ];
      }
    } else if (currentUserId) {
      where.requestedById = currentUserId;
      if (userStoreId) {
        where = {
          [Op.or]: [
            { requestedById: currentUserId },
            { askingStoreId: userStoreId },
            { supplyingStoreId: userStoreId },
          ],
        };
      }
    } else {
      return res.json({
        success: true,
        data: { total: 0, pending: 0, approved: 0, rejected: 0, finalized: 0 },
      });
    }

    const total = await ItemRequest.count({ where });
    const pending = await ItemRequest.count({ where: { ...where, status: "pending" } });
    const approved = await ItemRequest.count({ where: { ...where, status: "approved" } });
    const rejected = await ItemRequest.count({ where: { ...where, status: "rejected" } });
    const finalized = await ItemRequest.count({ where: { ...where, status: "finalized" } });

    const statusBreakdown = await ItemRequest.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where,
      group: ["status"],
    });

    res.json({
      success: true,
      data: {
        total, pending, approved, rejected, finalized,
        breakdown: statusBreakdown.map((s) => ({
          status: s.status,
          count: parseInt(s.dataValues.count),
        })),
      },
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({ success: false, error: "Failed to get statistics" });
  }
};

// ================================================================
// 19. GET ACTIVE STORES
// ================================================================
exports.getActiveStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { status: "Active" },
      attributes: ["storeId", "code", "name", "location", "status"],
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: stores });
  } catch (error) {
    console.error("Get active stores error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch active stores" });
  }
};

// ================================================================
// 20. GET ACTIVE ITEMS — returned as FAMILIES (unchanged logic)
// ================================================================
exports.getActiveItems = async (req, res) => {
  try {
    const { search, limit = 20, page = 1, storeId, groupId } = req.query;

    const limitNum = Math.min(parseInt(limit, 10) || 20, 50);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    const searchTerm = (search || "").trim();

    const where = { status: "Active" };
    if (searchTerm) {
      const like = `%${searchTerm}%`;
      where[Op.or] = [
        { code: { [Op.iLike]: like } },
        { name: { [Op.iLike]: like } },
        { standardName: { [Op.iLike]: like } },
        { brand: { [Op.iLike]: like } },
        { model: { [Op.iLike]: like } },
      ];
    }

    const candidates = await Item.findAll({
      where,
      attributes: [
        "itemId", "code", "name", "standardName", "brand", "model",
        "categoryId", "uomId", "conversionUomId", "conversionValue",
      ],
      include: [
        { model: UOM, as: "uom", attributes: ["uomId", "code", "name"] },
        { model: UOM, as: "conversionUom", attributes: ["uomId", "code", "name"] },
      ],
      order: [["code", "ASC"]],
      limit: limitNum * 4,
    });

    if (candidates.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 },
      });
    }

    const candidateIds = candidates.map((i) => i.itemId);
    const relations = await db.ItemRelationship.findAll({
      where: {
        status: "Active",
        [Op.or]: [
          { itemAId: { [Op.in]: candidateIds } },
          { itemBId: { [Op.in]: candidateIds } },
        ],
      },
      attributes: ["itemAId", "itemBId"],
    });

    const familyRoot = new Map();
    const familyMembers = new Map();

    const linkPair = (a, b) => {
      const rootA = familyRoot.get(a) ?? a;
      const rootB = familyRoot.get(b) ?? b;
      if (rootA === rootB) return;
      const [newRoot, absorbed] = rootA < rootB ? [rootA, rootB] : [rootB, rootA];
      familyRoot.set(absorbed, newRoot);
      familyRoot.set(a, newRoot);
      familyRoot.set(b, newRoot);
      const absorbedMembers = familyMembers.get(absorbed) || new Set([absorbed]);
      if (!familyMembers.has(newRoot)) familyMembers.set(newRoot, new Set([newRoot]));
      absorbedMembers.forEach((m) => {
        familyRoot.set(m, newRoot);
        familyMembers.get(newRoot).add(m);
      });
      familyMembers.delete(absorbed);
    };

    relations.forEach((r) => linkPair(r.itemAId, r.itemBId));
    candidateIds.forEach((id) => {
      if (!familyRoot.has(id)) {
        familyRoot.set(id, id);
        if (!familyMembers.has(id)) familyMembers.set(id, new Set([id]));
      }
    });

    const allFamilyItemIds = new Set();
    candidateIds.forEach((id) => {
      const root = familyRoot.get(id);
      (familyMembers.get(root) || new Set([root])).forEach((m) =>
        allFamilyItemIds.add(m)
      );
    });

    const allItems = await Item.findAll({
      where: { itemId: { [Op.in]: [...allFamilyItemIds] }, status: "Active" },
      attributes: ["itemId", "code", "name", "standardName", "brand", "model", "categoryId"],
      include: [
        { model: UOM, as: "uom", attributes: ["uomId", "code", "name"] },
        { model: db.Category, as: "category", attributes: ["categoryId", "name"] },
      ],
    });
    const itemById = new Map(allItems.map((i) => [i.itemId, i]));

    let stockByItem = {};
    if (storeId && groupId) {
      const balances = await StoreBalance.findAll({
        where: {
          storeId: parseInt(storeId, 10),
          groupId: parseInt(groupId, 10),
          itemId: { [Op.in]: [...allFamilyItemIds] },
          status: "Active",
        },
        attributes: ["itemId", "balance"],
      });
      balances.forEach((b) => {
        stockByItem[b.itemId] = parseFloat(b.balance) || 0;
      });
    }

    const familiesSeen = new Set();
    const families = [];

    const anchorItems = searchTerm
      ? candidates
      : candidates.filter((c) => {
          const root = familyRoot.get(c.itemId) ?? c.itemId;
          const members = familyMembers.get(root) || new Set([root]);
          const lowest = Math.min(...members);
          return c.itemId === lowest;
        });

    for (const anchor of anchorItems) {
      const root = familyRoot.get(anchor.itemId) ?? anchor.itemId;
      if (familiesSeen.has(root)) continue;
      familiesSeen.add(root);

      const memberIds = [...(familyMembers.get(root) || new Set([root]))];
      const members = memberIds
        .map((id) => itemById.get(id))
        .filter(Boolean)
        .sort((a, b) => a.itemId - b.itemId);

      if (members.length === 0) continue;

      const displayItem = members.find((m) => m.itemId === anchor.itemId) || members[0];

      families.push({
        familyId: `family-${root}`,
        displayName: displayItem.standardName || displayItem.name || displayItem.code,
        code: displayItem.code,
        category: displayItem.category?.name || null,
        brand: displayItem.brand || null,
        model: displayItem.model || null,
        uoms: members.map((m) => ({
          itemId: m.itemId,
          code: m.code,
          name: m.standardName || m.name,
          uomCode: m.uom?.code || "—",
          uomName: m.uom?.name || m.uom?.code || "—",
          stock: stockByItem[m.itemId] ?? null,
        })),
      });

      if (families.length >= limitNum) break;
    }

    const paged = families.slice(offset, offset + limitNum);

    res.json({
      success: true,
      data: paged,
      pagination: {
        total: families.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(families.length / limitNum),
      },
    });
  } catch (error) {
    console.error("Get active items (families) error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch active items" });
  }
};

// ================================================================
// 21. GET GROUP NOTIFICATIONS
// ================================================================
exports.getGroupNotifications = async (req, res) => {
  try {
    const { storeId, groupId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "User not authenticated" });

    const relation = await StoreGroupRelation.findOne({
      where: { store_id: parseInt(storeId), group_id: parseInt(groupId) },
    });
    if (!relation) {
      return res.status(404).json({ success: false, error: "Group not found in this store" });
    }

    const whereClause = { group_id: parseInt(groupId), store_id: parseInt(storeId) };
    if (status && status !== "all") whereClause.status = status;

    const totalCount = await RequestNotification.count({ where: whereClause });
    const notifications = await RequestNotification.findAll({
      where: whereClause,
      include: [
        {
          model: ItemRequest,
          as: "request",
          include: [
            { model: Store, as: "askingStore" },
            { model: Store, as: "supplyingStore" },
            {
              model: User,
              as: "requestedByUser",
              attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
              include: [
                {
                  model: Department,
                  as: "Department",
                  attributes: ["department_id", "name", "code"],
                },
              ],
            },
            withProcessing({
              model: ItemRequestDetail,
              as: "items",
              include: [
                {
                  model: Item,
                  as: "item",
                  include: [
                    { model: UOM, as: "uom" },
                    {
                      model: db.Category,
                      as: "category",
                      attributes: ["categoryId", "name"],
                      required: false,
                    },
                  ],
                },
              ],
            }),
          ],
        },
        { model: Group, as: "group" },
        { model: Store, as: "store" },
        { model: User, as: "respondedByUser" },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    const summary = {
      total: totalCount,
      pending: await RequestNotification.count({ where: { ...whereClause, status: "pending" } }),
      accepted: await RequestNotification.count({ where: { ...whereClause, status: "accepted" } }),
      rejected: await RequestNotification.count({ where: { ...whereClause, status: "rejected" } }),
    };

    res.json({
      success: true,
      data: {
        notifications,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        store: { id: parseInt(storeId), group: { id: parseInt(groupId) } },
      },
    });
  } catch (error) {
    console.error("❌ Error getting group notifications:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get notifications" });
  }
};

// ================================================================
// 22. GET DEPARTMENT NOTIFICATIONS
// ================================================================
exports.getDepartmentNotifications = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "User not authenticated" });

    const deptId = parseInt(departmentId);
    if (isNaN(deptId) || deptId <= 0) {
      return res.status(400).json({ success: false, error: "Invalid department ID" });
    }

    const department = await Department.findByPk(deptId);
    if (!department) return res.status(404).json({ success: false, error: "Department not found" });

    const whereClause = {
      department_id: deptId,
      approval_type: "department",
      is_department_approval: true,
    };
    if (status && status !== "all") whereClause.status = status;

    const totalCount = await RequestNotification.count({ where: whereClause });
    const notifications = await RequestNotification.findAll({
      where: whereClause,
      include: [
        {
          model: ItemRequest,
          as: "request",
          include: [
            { model: Store, as: "askingStore" },
            { model: Store, as: "supplyingStore" },
            {
              model: User,
              as: "requestedByUser",
              attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
              include: [
                {
                  model: Department,
                  as: "Department",
                  attributes: ["department_id", "name", "code", "description"],
                },
              ],
            },
            withProcessing({
              model: ItemRequestDetail,
              as: "items",
              include: [
                {
                  model: Item,
                  as: "item",
                  include: [
                    { model: UOM, as: "uom" },
                    {
                      model: db.Category,
                      as: "category",
                      attributes: ["categoryId", "name"],
                      required: false,
                    },
                  ],
                },
              ],
            }),
          ],
        },
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "name", "code", "description"],
        },
        {
          model: User,
          as: "respondedByUser",
          attributes: ["userId", "username", "fullName"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit) || 10,
      offset: ((parseInt(page) || 1) - 1) * (parseInt(limit) || 10),
    });

    const summary = {
      total: totalCount,
      pending: await RequestNotification.count({ where: { ...whereClause, status: "pending" } }),
      accepted: await RequestNotification.count({ where: { ...whereClause, status: "accepted" } }),
      rejected: await RequestNotification.count({ where: { ...whereClause, status: "rejected" } }),
    };

    res.json({
      success: true,
      data: {
        notifications,
        summary,
        pagination: {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          total: totalCount,
          pages: Math.ceil(totalCount / (parseInt(limit) || 10)),
        },
        department: {
          department_id: department.department_id,
          name: department.name,
          code: department.code,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting department notifications:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get department notifications" });
  }
};

// ================================================================
// 23. GET STORE GROUPS
// ================================================================
exports.getStoreGroups = async (req, res) => {
  try {
    const { storeId } = req.params;
    const groups = await db.sequelize.query(
      `SELECT g.id, g.name, g.code, g.status
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
      {
        replacements: { storeId: parseInt(storeId) },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error("❌ Error getting store groups:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get store groups" });
  }
};

// ================================================================
// 24. GET PENDING NOTIFICATIONS
// ================================================================
exports.getPendingNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const userStoreId = req.user?.storeId || req.user?.assignedStoreId;
    const userGroupId = req.user?.groupId || req.user?.assignedGroupId;
    const departmentId = req.user?.departmentId;

    if (!userId) return res.status(401).json({ success: false, error: "User not authenticated" });

    const isAdmin = userRole === "admin" || userRole === "Admin" || userRole === "superadmin";
    const isChecker = userRole === "checker" || userRole === "Checker";

    let groupWhere = {
      status: "pending",
      [Op.or]: [{ approval_type: "group" }, { approval_type: null }],
    };
    let deptWhere = {
      status: "pending",
      approval_type: "department",
      is_department_approval: true,
    };

    if (!isAdmin && !isChecker) {
      if (userStoreId && userGroupId) {
        const rel = await StoreGroupRelation.findOne({
          where: {
            store_id: parseInt(userStoreId),
            group_id: parseInt(userGroupId),
          },
        });
        if (rel) {
          groupWhere.group_id = parseInt(userGroupId);
          groupWhere.store_id = parseInt(userStoreId);
        } else {
          groupWhere.id = -1;
        }
      } else {
        groupWhere.id = -1;
      }

      if (departmentId) {
        deptWhere.department_id = parseInt(departmentId);
      } else {
        deptWhere.id = -1;
      }
    }

    const limitVal = parseInt(limit) || 10;
    const offsetVal = ((parseInt(page) || 1) - 1) * limitVal;

    const reqInclude = (userIncludeAttrs) => ({
      model: ItemRequest,
      as: "request",
      include: [
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        { model: User, as: "requestedByUser", attributes: userIncludeAttrs },
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [
                { model: UOM, as: "uom" },
                {
                  model: db.Category,
                  as: "category",
                  attributes: ["categoryId", "name"],
                  required: false,
                },
              ],
            },
          ],
        }),
      ],
    });

    let groupNotifications = [];
    let deptNotifications = [];
    let groupTotal = 0;
    let deptTotal = 0;

    if (groupWhere.id !== -1) {
      const result = await RequestNotification.findAndCountAll({
        where: groupWhere,
        include: [
          reqInclude(undefined),
          { model: Group, as: "group" },
          { model: Store, as: "store" },
          { model: User, as: "respondedByUser" },
        ],
        order: [["created_at", "DESC"]],
        limit: limitVal,
        offset: offsetVal,
        distinct: true,
      });
      groupNotifications = result.rows || [];
      groupTotal = result.count || 0;
    }

    if (deptWhere.id !== -1) {
      const result = await RequestNotification.findAndCountAll({
        where: deptWhere,
        include: [
          reqInclude(undefined),
          {
            model: Department,
            as: "department",
            attributes: ["department_id", "name", "code", "description"],
          },
          {
            model: User,
            as: "respondedByUser",
            attributes: ["userId", "username", "fullName"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: limitVal,
        offset: offsetVal,
        distinct: true,
      });
      deptNotifications = result.rows || [];
      deptTotal = result.count || 0;
    }

    const all = [
      ...groupNotifications.map((n) => ({
        ...(n.toJSON ? n.toJSON() : n),
        _type: "group",
        _typeLabel: "👥 Group",
      })),
      ...deptNotifications.map((n) => ({
        ...(n.toJSON ? n.toJSON() : n),
        _type: "department",
        _typeLabel: "🏛️ Department",
      })),
    ];

    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      data: {
        notifications: all,
        summary: {
          total: groupTotal + deptTotal,
          group: groupTotal,
          department: deptTotal,
          page: parseInt(page) || 1,
          limit: limitVal,
          pages: Math.ceil((groupTotal + deptTotal) / limitVal),
        },
        user: {
          userId, role: userRole, storeId: userStoreId, groupId: userGroupId,
          departmentId, isAdmin, isChecker,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting pending notifications:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get pending notifications" });
  }
};

// ================================================================
// 25. GET APPROVAL DEPARTMENTS FOR A STORE
// ================================================================
exports.getApprovalDepartmentsForStore = async (req, res) => {
  try {
    const { storeCode } = req.params;
    if (!storeCode) return res.status(400).json({ success: false, error: "Store code is required" });

    const store = await Store.findOne({ where: { code: storeCode } });
    if (!store) {
      return res.status(404).json({
        success: false,
        error: `Store with code "${storeCode}" not found`,
      });
    }

    const config = await getApprovalDepartmentConfig();
    if (!config || !config.departments || config.departments.length === 0) {
      return res.json({
        success: true,
        data: { storeCode, storeName: store.name, requiresApproval: false, departments: [] },
      });
    }

    const applicable = config.departments.filter(
      (d) => Array.isArray(d.appliesTo) && d.appliesTo.includes(storeCode)
    );

    const enriched = await Promise.all(
      applicable.map(async (entry) => {
        const department = await Department.findByPk(entry.departmentId);
        if (!department) {
          return {
            departmentId: entry.departmentId,
            name: `Department ${entry.departmentId}`,
            code: "N/A",
            description: null,
            appliesTo: entry.appliesTo,
          };
        }
        return {
          departmentId: department.departmentId,
          name: department.name,
          code: department.code,
          description: department.description || null,
          appliesTo: entry.appliesTo,
        };
      })
    );

    res.json({
      success: true,
      data: { storeCode, storeName: store.name, requiresApproval: true, departments: enriched },
    });
  } catch (error) {
    console.error("❌ Error getting approval departments for store:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch approval departments" });
  }
};

// ================================================================
// 26. GET TEMELASH RECORDS
// ================================================================
exports.getTemelashRecords = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all", storeId = "all", search = "" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status !== "all") where.status = status;
    if (storeId !== "all") {
      where[Op.or] = [
        { askingStoreId: parseInt(storeId) },
        { supplyingStoreId: parseInt(storeId) },
      ];
    }
    if (search) where.requestCode = { [Op.iLike]: `%${search}%` };

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

    const summary = {
      total: count,
      out: await TemelashRecord.count({ where: { ...where, status: "out" } }),
      returned: await TemelashRecord.count({ where: { ...where, status: "returned" } }),
      overdue: await TemelashRecord.count({
        where: { ...where, status: "out", toDate: { [Op.lt]: today } },
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
    res.status(500).json({ success: false, error: error.message || "Failed to fetch temelash records" });
  }
};

// ================================================================
// 27. RETURN A TEMELASH RECORD (supports partial returns)
// ================================================================
exports.returnTemelash = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { remark, returns } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ success: false, error: "User not authenticated" });

    const record = await TemelashRecord.findByPk(recordId);
    if (!record) return res.status(404).json({ success: false, error: "Temelash record not found" });
    if (record.status !== "out") {
      return res.status(400).json({ success: false, error: `Temelash record is already ${record.status}` });
    }

    const items = Array.isArray(record.items)
      ? record.items.map((r) => ({ ...r }))
      : [];

    if (!Array.isArray(returns) || returns.length === 0) {
      // Full return
      for (const row of items) {
        row.returnedQuantity = Number(row.quantity) || 0;
      }
    } else {
      // Partial — validate each line
      for (const { itemId, quantity } of returns) {
        const row = items.find((r) => Number(r.itemId) === Number(itemId));
        if (!row) continue;
        const requested = Number(row.quantity) || 0;
        const prev = Number(row.returnedQuantity ?? 0) || 0;
        const next = Math.min(requested, prev + Number(quantity || 0));
        row.returnedQuantity = next;
      }
    }

    const allReturned = items.every(
      (r) => Number(r.returnedQuantity ?? 0) >= Number(r.quantity || 0)
    );

    const now = new Date();
    const isLate = record.toDate ? now > new Date(record.toDate) : false;

    await record.update({
      items,
      status: allReturned ? "returned" : "out",
      returnedAt: allReturned ? now : record.returnedAt,
      returnedById: allReturned ? userId : record.returnedById,
      returnRemark: remark || null,
      returnedLate: allReturned ? isLate : record.returnedLate,
    });

    res.json({
      success: true,
      message: allReturned
        ? isLate
          ? "Temelash fully returned (marked as LATE)"
          : "Temelash fully returned"
        : "Temelash partially returned — record still marked as OUT",
      data: record,
    });
  } catch (error) {
    console.error("❌ Error returning temelash:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to return temelash" });
  }
};

// ================================================================
// 28. CHANGE A NOTIFICATION'S DECISION
// ================================================================
exports.changeNotificationDecision = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { status, reason } = req.body;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "User not authenticated" });

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "accepted" or "rejected"',
      });
    }
    if (status === "rejected" && (!reason || !reason.trim())) {
      return res.status(400).json({ success: false, error: "Rejection reason is required" });
    }

    const notification = await RequestNotification.findByPk(notificationId);
    if (!notification) return res.status(404).json({ success: false, error: "Notification not found" });

    const request = await ItemRequest.findByPk(notification.request_id);
    if (!request) return res.status(404).json({ success: false, error: "Parent request not found" });
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot change decision — request is already ${request.status}`,
      });
    }
    if (notification.status === "pending") {
      return res.status(400).json({
        success: false,
        error: "Notification has no decision yet — use accept/reject first",
      });
    }
    if (notification.status === status) {
      return res.status(400).json({
        success: false,
        error: `Notification is already ${status}`,
      });
    }

    await notification.update({
      status,
      rejected_reason: status === "rejected" ? reason.trim() : null,
      responded_by: userId,
      responded_at: new Date(),
    });

    res.status(200).json({ success: true, message: `Decision changed to ${status}`, data: notification });
  } catch (error) {
    console.error("❌ Error changing notification decision:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to change decision" });
  }
};

// ================================================================
// 29. GET AWAITING MY APPROVAL
// ================================================================
exports.getAwaitingMyApproval = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      storeId = "all",
      departmentId = "all",
      requesterId = "all",
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100);
    const offset = (pageNum - 1) * limitNum;

    const currentUser = req.user;
    const currentUserId = currentUser?.userId;
    const currentUserRole = currentUser?.role;

    const { getUserStoreAndGroup } = require("../utils/userAccess");
    let userStoreId = currentUser?.storeId || currentUser?.assignedStoreId;
    let userIsAdmin = false;

    if (!userStoreId && currentUserId) {
      try {
        const accessResult = await getUserStoreAndGroup(currentUserId);
        if (accessResult.success && accessResult.data) {
          userStoreId = accessResult.data.assignedStoreId;
          userIsAdmin = accessResult.data.isAdmin || false;
        }
      } catch (err) {
        console.warn("⚠️ Could not get user store from database:", err.message);
      }
    }

    const allSupplying = await RequestNotification.findAll({
      where: { stage: "supplying_store" },
      attributes: ["request_id", "status"],
    });

    const statusByRequest = new Map();
    for (const n of allSupplying) {
      const rid = Number(n.request_id);
      let bucket = statusByRequest.get(rid);
      if (!bucket) {
        bucket = { total: 0, accepted: 0, rejected: 0 };
        statusByRequest.set(rid, bucket);
      }
      bucket.total += 1;
      if (n.status === "accepted") bucket.accepted += 1;
      else if (n.status === "rejected") bucket.rejected += 1;
    }

    const fullyAcceptedRequestIds = [];
    for (const [rid, s] of statusByRequest.entries()) {
      if (s.total > 0 && s.accepted === s.total && s.rejected === 0) {
        fullyAcceptedRequestIds.push(rid);
      }
    }

    if (fullyAcceptedRequestIds.length === 0) {
      return res.json({
        success: true,
        data: { requests: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 } },
      });
    }

    const where = {
      requestId: { [Op.in]: fullyAcceptedRequestIds },
      status: "pending",
    };

    const andClauses = [];
    const isAdmin = currentUserRole === "admin" || currentUserRole === "Admin" || userIsAdmin;
    const isStorekeeper = currentUserRole === "storekeeper" || currentUserRole === "store_it";
    const isChecker = currentUserRole === "checker" || currentUserRole === "finance";

    if (isAdmin) {
      if (storeId !== "all") {
        andClauses.push({
          [Op.or]: [
            { askingStoreId: parseInt(storeId, 10) },
            { supplyingStoreId: parseInt(storeId, 10) },
          ],
        });
      }
    } else if (isStorekeeper) {
      if (userStoreId) {
        andClauses.push({
          [Op.or]: [{ askingStoreId: userStoreId }, { supplyingStoreId: userStoreId }],
        });
        if (storeId !== "all" && parseInt(storeId, 10) !== userStoreId) {
          andClauses.push({
            [Op.or]: [
              { askingStoreId: parseInt(storeId, 10) },
              { supplyingStoreId: parseInt(storeId, 10) },
            ],
          });
        }
      } else if (currentUserId) {
        where.requestedById = currentUserId;
      }
    } else if (isChecker) {
      if (storeId !== "all") {
        andClauses.push({
          [Op.or]: [
            { askingStoreId: parseInt(storeId, 10) },
            { supplyingStoreId: parseInt(storeId, 10) },
          ],
        });
      }
    } else if (currentUserId) {
      where.requestedById = currentUserId;
    }

    if (requesterId !== "all") where.requestedById = parseInt(requesterId, 10);

    if (departmentId !== "all") {
      const deptUsers = await User.findAll({
        where: { departmentId: parseInt(departmentId, 10) },
        attributes: ["userId"],
      });
      const ids = deptUsers.map((u) => u.userId);
      if (ids.length === 0) {
        return res.json({
          success: true,
          data: { requests: [], pagination: { total: 0, page: pageNum, limit: limitNum, pages: 0 } },
        });
      }
      where.requestedById = { [Op.in]: ids };
    }

    if (search && search.trim() !== "") {
      andClauses.push({
        [Op.or]: [
          { requestCode: { [Op.iLike]: `%${search}%` } },
          { remark: { [Op.iLike]: `%${search}%` } },
          { requestedBy: { [Op.iLike]: `%${search}%` } },
          { "$requestedByUser.fullName$": { [Op.iLike]: `%${search}%` } },
          { "$requestedByUser.username$": { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    if (andClauses.length > 0) where[Op.and] = andClauses;

    const totalCount = await ItemRequest.count({
      where,
      distinct: true,
      include: [{ model: User, as: "requestedByUser", attributes: [], required: false }],
    });

    const rows = await ItemRequest.findAll({
      where,
      offset,
      limit: limitNum,
      order: [[sortBy, sortOrder]],
      subQuery: false,
      include: [
        { model: Store, as: "askingStore", attributes: ["storeId", "code", "name"] },
        { model: Store, as: "supplyingStore", attributes: ["storeId", "code", "name"] },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email", "roleId", "departmentId"],
          include: [
            {
              model: Department,
              as: "Department",
              attributes: ["department_id", "name", "code"],
              required: false,
            },
          ],
        },
        withProcessing({
          model: ItemRequestDetail,
          as: "items",
          include: [
            { model: Item, as: "item", include: [{ model: UOM, as: "uom" }] },
          ],
          attributes: [
            "id", "requestId", "itemId", "quantity", "remark",
            "selected_uom", "uom_code", "is_base_uom",
            "specification", "brand", "model",
          ],
          required: false,
        }),
        {
          model: RequestNotification,
          as: "notifications",
          where: { stage: "supplying_store", status: "accepted" },
          required: false,
          include: [
            { model: Group, as: "group", attributes: ["id", "name", "code"], required: false },
            { model: Department, as: "department", attributes: ["department_id", "name", "code"], required: false },
            {
              model: User,
              as: "respondedByUser",
              attributes: ["userId", "username", "fullName"],
              required: false,
            },
          ],
        },
      ],
    });

    const requests = rows.map((r) => {
      const notifications = r.notifications || [];

      const acceptedBy = notifications
        .map((n) => {
          const isDept = n.is_department_approval === true || n.approval_type === "department";
          const name = isDept
            ? n.department?.name || `Department #${n.department_id}`
            : n.group?.name || `Group #${n.group_id}`;
          return {
            id: n.id,
            name,
            type: isDept ? "department" : "group",
            at: n.responded_at,
            respondedByName:
              n.respondedByUser?.fullName || n.respondedByUser?.username || null,
          };
        })
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

      const user = r.requestedByUser;
      const dept = user?.Department;

      return {
        id: r.requestId,
        code: r.requestCode,
        askingStore: r.askingStore?.name || "Unknown Store",
        askingStoreId: r.askingStoreId,
        supplyingStore: r.supplyingStore?.name || "Unknown Store",
        supplyingStoreId: r.supplyingStoreId,
        department: dept?.name || null,
        departmentId: dept?.department_id || user?.departmentId || null,
        requestedBy:
          r.requestedBy || user?.fullName || user?.username || "Unknown",
        requestedById: r.requestedById || user?.userId || null,
        requestedAt: r.requestedDate || r.createdAt,
        status: r.status,
        isAsset: r.isAsset,
        isTemelash: r.isTemelash,
        items: r.items?.length || 0,
        itemsDetail: (r.items || []).map((it) => {
          const requested = Number(it.quantity) || 0;
          const processed = (it.processingRows || []).reduce(
            (s, p) => s + (Number(p.processedQuantity) || 0),
            0
          );
          const remaining = Math.max(0, requested - processed);
          return {
            detailId: it.id,
            itemId: it.itemId,
            code: it.item?.code || "N/A",
            name: it.item?.name || "Unknown",
            quantity: requested,
            processedQuantity: processed,
            remainingQuantity: remaining,
            isFullyProcessed: remaining === 0,
            uom: it.uom_code || it.item?.uom?.code || "Units",
            remark: it.remark || null,
            specification: it.specification || null,
            brand: it.brand || null,
            model: it.model || null,
            processingRows: (it.processingRows || []).map((p) => ({
              id: p.id,
              groupId: p.groupId,
              groupName: p.group?.name || null,
              processedQuantity: Number(p.processedQuantity) || 0,
              remainingQuantity: Number(p.remainingQuantity) || 0,
              status: p.status,
              processedAt: p.processedAt,
              processedByName:
                p.processedByUser?.fullName || p.processedByUser?.username || null,
            })),
          };
        }),
        acceptedBy,
      };
    });

    return res.json({
      success: true,
      data: {
        requests,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum) || 0,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting awaiting-my-approval requests:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch approval queue",
    });
  }
};