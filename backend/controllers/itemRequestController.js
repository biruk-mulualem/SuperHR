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
  sequelize,
} = db;
const { Op } = require("sequelize");

// ================================================================
// HELPER: Skip stock validation for specific stores
// ================================================================
const STOCK_VALIDATION_SKIP_STORES = ["STORE-006", "STORE-007"];
const SKIP_NOTIFICATION_STORES = ["STORE-006", "STORE-007"];

const shouldSkipStockValidation = (storeCode) => {
  return STOCK_VALIDATION_SKIP_STORES.includes(storeCode);
};

const shouldSkipNotifications = (storeCode) => {
  return SKIP_NOTIFICATION_STORES.includes(storeCode);
};

// ================================================================
// HELPER: Check if the current user is admin
// ================================================================
function isAdminUser(req) {
  return req?.user?.isAdmin === true || 
         req?.user?.role === 'admin' || 
         req?.user?.role === 'Admin';
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
// HELPER: Get department from SystemSetting for asset approvals
// ================================================================
async function getApprovalDepartmentConfig() {
  try {
    const SystemSetting = db.SystemSetting;
    const setting = await SystemSetting.findOne({
      where: { settingKey: 'approval.department' },
    });

    if (!setting || !setting.settingValue) {
      return null;
    }

    const normalized = SystemSetting.normalizeApprovalConfig(setting.settingValue);

    if (!normalized.requiresApproval) return null;
    if (!normalized.departments || normalized.departments.length === 0) return null;

    return {
      departments: normalized.departments,
      requiresApproval: true,
    };
  } catch (error) {
    console.error('❌ Error getting approval department config:', error);
    return null;
  }
}

// ================================================================
// HELPER: Resolve the requesting user's group ID
// ================================================================
async function resolveRequestingUserGroupId(req, requestingUserId, transaction = null) {
  const tokenGroupId =
    req?.user?.groupId ||
    req?.user?.assignedGroupId ||
    null;

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
        attributes: ['userId', 'groupId', 'assignedGroupId'],
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
      console.warn(`⚠️ Could not fetch user ${requestingUserId} to resolve groupId:`, err.message);
    }
  }

  console.log(`ℹ️ Could not resolve requesting user's group ID — no exclusion will be applied`);
  return null;
}

// ================================================================
// HELPER: Validate stock availability with dual UOM support
// ================================================================
const validateStockAvailability = async (supplyingStoreId, items) => {
  const errors = [];
  const stockInfo = [];

  const store = await Store.findByPk(supplyingStoreId);
  if (!store) {
    return {
      isValid: false,
      errors: [{ message: "Store not found" }],
      stockInfo: [],
    };
  }

  if (shouldSkipStockValidation(store.code)) {
    console.log(`⚠️ Skipping stock validation for store: ${store.code} (${store.name})`);

    for (const item of items) {
      const itemRecord = await Item.findByPk(item.itemId, {
        include: [
          { model: UOM, as: "uom" },
          { model: UOM, as: "conversionUom" }
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

      stockInfo.push({
        itemId: item.itemId,
        itemName: itemRecord.name,
        itemCode: itemRecord.code,
        uomCode: itemRecord.uom?.code || "Units",
        availableQuantity: Number.MAX_SAFE_INTEGER,
        requestedQuantity: item.quantity,
        balance: null,
        stockValidationSkipped: true,
        skipReason: `Store ${store.code} is exempt from stock validation`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      stockInfo,
      validationSkipped: true,
      skipReason: `Store ${store.code} is exempt from stock validation`,
    };
  }

  for (const item of items) {
    const itemRecord = await Item.findByPk(item.itemId, {
      include: [
        { model: UOM, as: "uom" },
        { model: UOM, as: "conversionUom" }
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

    const isBaseUom = item.isBaseUom !== false;
    const userUomCode = item.uomCode || itemRecord.uom?.code || "Units";
    const userQuantity = parseFloat(item.quantity);

    const baseUomCode = itemRecord.uom?.code || "Units";
    const conversionUomCode = itemRecord.conversionUom?.code || null;
    const conversionValue = itemRecord.conversionValue ? parseFloat(itemRecord.conversionValue) : null;

    console.log(`📦 Checking item: ${itemRecord.code}`);
    console.log(`   User wants: ${userQuantity} ${userUomCode}`);
    console.log(`   Base UOM: ${baseUomCode}, Conversion UOM: ${conversionUomCode}`);

    const [storeBalance, convertedBalance] = await Promise.all([
      StoreBalance.findOne({
        where: {
          storeId: supplyingStoreId,
          itemId: item.itemId,
          status: "Active",
        },
      }),
      db.ConvertedBalance ? db.ConvertedBalance.findOne({
        where: {
          storeId: supplyingStoreId,
          itemId: item.itemId,
        },
      }) : null,
    ]);

    const hasBaseBalance = storeBalance !== null;
    const hasConversionBalance = convertedBalance !== null;
    
    let baseBalance = hasBaseBalance ? parseFloat(storeBalance.balance) : 0;
    let conversionBalance = hasConversionBalance ? parseFloat(convertedBalance.convertedBalance) : 0;

    console.log(`   StoreBalance (${baseUomCode}): ${baseBalance}`);
    console.log(`   ConvertedBalance (${conversionUomCode}): ${conversionBalance}`);

    if (isBaseUom) {
      if (hasBaseBalance) {
        const availableQuantity = baseBalance;
        
        stockInfo.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode: baseUomCode,
          availableQuantity: availableQuantity,
          requestedQuantity: userQuantity,
          balance: storeBalance,
          balanceType: 'base',
          isBaseUom: true,
          hasBaseBalance: true,
          hasConversionBalance: hasConversionBalance,
          conversionBalance: conversionBalance,
          conversionUomCode: conversionUomCode,
          conversionValue: conversionValue,
        });

        if (userQuantity > availableQuantity) {
          errors.push({
            itemId: item.itemId,
            itemName: itemRecord.name,
            itemCode: itemRecord.code,
            requestedQuantity: userQuantity,
            availableQuantity: availableQuantity,
            shortage: userQuantity - availableQuantity,
            uomCode: baseUomCode,
            balanceType: 'base',
            message: `Insufficient stock in ${baseUomCode}. Requested: ${userQuantity} ${baseUomCode}`,
          });
        }
        
      } else if (hasConversionBalance) {
        stockInfo.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode: baseUomCode,
          availableQuantity: 0,
          requestedQuantity: userQuantity,
          balance: null,
          balanceType: 'none',
          isBaseUom: true,
          hasBaseBalance: false,
          hasConversionBalance: true,
          conversionBalance: conversionBalance,
          conversionUomCode: conversionUomCode,
          conversionValue: conversionValue,
          availableInOtherUom: conversionBalance,
          otherUomCode: conversionUomCode,
        });

        errors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: userQuantity,
          requestedUom: baseUomCode,
          availableQuantity: 0,
          uomCode: baseUomCode,
          balanceType: 'none',
          message: `This item is available in ${conversionUomCode} only. Please request in ${conversionUomCode} instead.`,
          suggestion: `Request in ${conversionUomCode}`,
          availableInOtherUom: conversionBalance,
          otherUomCode: conversionUomCode,
        });
        
      } else {
        stockInfo.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode: baseUomCode,
          availableQuantity: 0,
          requestedQuantity: userQuantity,
          balance: null,
          balanceType: 'none',
          isBaseUom: true,
          hasBaseBalance: false,
          hasConversionBalance: false,
        });

        errors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: userQuantity,
          uomCode: baseUomCode,
          availableQuantity: 0,
          balanceType: 'none',
          message: `Item not available in this store`,
        });
      }
      
    } else {
      if (hasConversionBalance) {
        const availableQuantity = conversionBalance;
        
        stockInfo.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode: conversionUomCode,
          availableQuantity: availableQuantity,
          requestedQuantity: userQuantity,
          balance: convertedBalance,
          balanceType: 'conversion',
          isBaseUom: false,
          hasBaseBalance: hasBaseBalance,
          hasConversionBalance: true,
          baseBalance: baseBalance,
          baseUomCode: baseUomCode,
          conversionValue: conversionValue,
        });

        if (userQuantity > availableQuantity) {
          errors.push({
            itemId: item.itemId,
            itemName: itemRecord.name,
            itemCode: itemRecord.code,
            requestedQuantity: userQuantity,
            availableQuantity: availableQuantity,
            shortage: userQuantity - availableQuantity,
            uomCode: conversionUomCode,
            balanceType: 'conversion',
            message: `Insufficient stock in ${conversionUomCode}. Requested: ${userQuantity} ${conversionUomCode}`,
          });
        }
        
      } else if (hasBaseBalance) {
        stockInfo.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode: conversionUomCode,
          availableQuantity: 0,
          requestedQuantity: userQuantity,
          balance: null,
          balanceType: 'none',
          isBaseUom: false,
          hasBaseBalance: true,
          hasConversionBalance: false,
          baseBalance: baseBalance,
          baseUomCode: baseUomCode,
          conversionValue: conversionValue,
          availableInOtherUom: baseBalance,
          otherUomCode: baseUomCode,
        });

        errors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: userQuantity,
          requestedUom: conversionUomCode,
          availableQuantity: 0,
          uomCode: conversionUomCode,
          balanceType: 'none',
          message: `This item is available in ${baseUomCode} only. Please request in ${baseUomCode} instead.`,
          suggestion: `Request in ${baseUomCode}`,
          availableInOtherUom: baseBalance,
          otherUomCode: baseUomCode,
        });
        
      } else {
        stockInfo.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode: conversionUomCode || baseUomCode,
          availableQuantity: 0,
          requestedQuantity: userQuantity,
          balance: null,
          balanceType: 'none',
          isBaseUom: false,
          hasBaseBalance: false,
          hasConversionBalance: false,
        });

        errors.push({
          itemId: item.itemId,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          requestedQuantity: userQuantity,
          uomCode: conversionUomCode || baseUomCode,
          availableQuantity: 0,
          balanceType: 'none',
          message: `Item not available in this store`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    stockInfo,
    validationSkipped: false,
  };
};
// ================================================================
// HELPER: Create notifications - STAGE 1 (Asking Store Groups ONLY)
// ================================================================
/**
 * Creates notification records for the asking store groups (Stage 1).
 *
 * 🔥 If 'approval.ask_store_enabled' is DISABLED, this function skips
 *    Stage 1 entirely and goes straight to Stage 2 (supplying store).
 *
 * @param {number} requestId          - The item request ID
 * @param {number} supplyingStoreId   - Supplying store ID
 * @param {number} askingStoreId      - Asking store ID
 * @param {boolean} isAsset           - Whether the request is an asset request
 * @param {Transaction} transaction   - Sequelize transaction
 * @param {number|null} requestingUserGroupId - The requesting user's group (excluded from Stage 1)
 * @param {number|null} requestingUserId      - The requesting user ID (for logging)
 */
async function createRequestNotifications(
  requestId,
  supplyingStoreId,
  askingStoreId,
  isAsset = false,
  transaction = null,
  requestingUserGroupId = null,
  requestingUserId = null
) {
  try {
    console.log(`📤 [STAGE 1] Creating ASKING STORE notifications for request ${requestId}`);
    console.log(`   Asking store: ${askingStoreId}`);
    console.log(`   Supplying store: ${supplyingStoreId} (will be notified AFTER asking approves)`);
    console.log(`   Requesting user ID: ${requestingUserId}`);
    console.log(`   🔥 Excluding requesting user's group ID: ${requestingUserGroupId}`);

    // ================================================================
    // 🔥 STAGE 1 TOGGLE CHECK
    // If the "approval.ask_store_enabled" setting is DISABLED, skip
    // Stage 1 and create supplying store notifications immediately.
    // ================================================================
    let askStoreApprovalEnabled = true;
    try {
      askStoreApprovalEnabled = await db.SystemSetting.getAskStoreApprovalEnabled();
    } catch (err) {
      console.warn('⚠️ Could not read ask_store_enabled setting — defaulting to ENABLED:', err.message);
      askStoreApprovalEnabled = true;
    }

    console.log(`🔍 Stage 1 toggle (ask_store_enabled): ${askStoreApprovalEnabled ? 'ENABLED' : 'DISABLED'}`);

    if (!askStoreApprovalEnabled) {
      console.log(`⏭️ Stage 1 (asking store approval) is DISABLED — skipping to supplying stage`);
      console.log(`📤 Creating supplying store notifications directly`);

      await createSupplyingStageNotifications(
        requestId,
        supplyingStoreId,
        askingStoreId,
        isAsset,
        transaction
      );

      return 0; // No asking store notifications created
    }

    console.log(`✅ Stage 1 is ENABLED — proceeding with asking store groups`);

    // ================================================================
    // FETCH ALL GROUPS FOR THE ASKING STORE
    // ================================================================
    let allAskingGroups = await db.sequelize.query(
      `SELECT g.id, g.name, g.code, g.status
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
      {
        replacements: { storeId: parseInt(askingStoreId) },
        type: db.sequelize.QueryTypes.SELECT,
        transaction: transaction,
      }
    );

    console.log(`📋 Found ${allAskingGroups.length} total asking store groups`);

    // ================================================================
    // 🔥 FILTER BY STORE-GROUP APPROVAL CONFIG (if configured)
    // ================================================================
    try {
      const storeGroupConfig = await getStoreGroupApprovalConfig();
      const allowedGroupIds = getAllowedApproverGroupIds(storeGroupConfig, askingStoreId);

      if (allowedGroupIds) {
        console.log(
          `🔒 Store ${askingStoreId} has ${allowedGroupIds.length} allowed approver group(s): ` +
          `[${allowedGroupIds.join(', ')}]`
        );
        allAskingGroups = allAskingGroups.filter((g) =>
          allowedGroupIds.includes(Number(g.id))
        );
        console.log(`📋 Filtered down to ${allAskingGroups.length} allowed group(s)`);
      } else {
        console.log(`ℹ️ No store-group config for store ${askingStoreId} — allowing all groups`);
      }
    } catch (err) {
      console.warn('⚠️ Could not apply store-group approval filter — using all groups:', err.message);
    }

    // ================================================================
    // EXCLUDE THE REQUESTING USER'S OWN GROUP
    // ================================================================
    let askingGroups = allAskingGroups;
    let excludedGroup = null;

    if (requestingUserGroupId) {
      const targetGroupId = parseInt(requestingUserGroupId);
      excludedGroup = allAskingGroups.find(
        (g) => parseInt(g.id) === targetGroupId
      );
      askingGroups = allAskingGroups.filter(
        (g) => parseInt(g.id) !== targetGroupId
      );

      if (excludedGroup) {
        console.log(
          `🚫 EXCLUDED group "${excludedGroup.name}" (ID ${excludedGroup.id}) — ` +
          `this is the requesting user's own group`
        );
      } else {
        console.log(
          `⚠️ Requesting user's group ID ${targetGroupId} not found in asking store groups ` +
          `— no exclusion applied`
        );
      }
    } else {
      console.log(`ℹ️ No requesting user group ID provided — no group excluded`);
    }

    console.log(`📋 Will create notifications for ${askingGroups.length} asking store groups`);

    // ================================================================
    // 🔥 SAFETY: If NO asking store groups remain, advance directly
    // ================================================================
    if (askingGroups.length === 0) {
      console.log(
        `⚠️ No asking store groups to notify (after exclusion) — ` +
        `advancing directly to supplying stage`
      );

      await createSupplyingStageNotifications(
        requestId,
        supplyingStoreId,
        askingStoreId,
        isAsset,
        transaction
      );
      return 0;
    }

    // ================================================================
    // CREATE NOTIFICATIONS FOR THE REMAINING ASKING STORE GROUPS
    // ================================================================
    const askingNotifications = askingGroups
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

    if (askingNotifications.length > 0) {
      const result = await RequestNotification.bulkCreate(askingNotifications, {
        validate: false,
        returning: true,
        transaction: transaction,
      });
      console.log(`✅ [STAGE 1] Created ${result.length} asking store group notifications`);
      return result.length;
    }

    return 0;
  } catch (error) {
    console.error("❌ Error creating asking store notifications:", error);
    throw error;
  }
}

// ================================================================
// HELPER: Create notifications - STAGE 2 (Supplying Store Groups + Departments)
// ================================================================
async function createSupplyingStageNotifications(
  requestId,
  supplyingStoreId,
  askingStoreId,
  isAsset = false,
  transaction = null
) {
  try {
    console.log(`📤 [STAGE 2] Creating SUPPLYING STORE notifications for request ${requestId}`);

    const existingCount = await RequestNotification.count({
      where: {
        request_id: requestId,
        stage: "supplying_store",
      },
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
        transaction: transaction,
      }
    );

    console.log(`📋 Found ${supplyingGroups.length} supplying store groups`);

    const groupNotifications = supplyingGroups
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

    if (groupNotifications.length > 0) {
      const result = await RequestNotification.bulkCreate(groupNotifications, {
        validate: false,
        returning: true,
        transaction: transaction,
      });
      totalCount += result.length;
      console.log(`✅ [STAGE 2] Created ${result.length} supplying store group notifications`);
    }

    if (isAsset) {
      console.log(`📋 isAsset is true — checking department config...`);

      const askingStore = await Store.findByPk(askingStoreId, { transaction });
      if (!askingStore) {
        console.log(`⚠️ Asking store ${askingStoreId} not found — skipping department notifications`);
        return { created: true, count: totalCount };
      }

      const config = await getApprovalDepartmentConfig();

      if (!config || !config.departments || config.departments.length === 0) {
        console.log(`⚠️ No approval departments configured — skipping`);
      } else {
        const applicableDepartments = config.departments.filter(
          (d) => Array.isArray(d.appliesTo) && d.appliesTo.includes(askingStore.code)
        );

        console.log(
          `📋 ${applicableDepartments.length} of ${config.departments.length} ` +
          `department(s) apply to store ${askingStore.code}`
        );

        for (const entry of applicableDepartments) {
          const department = await db.Department.findByPk(entry.departmentId, { transaction });

          if (!department) {
            console.log(`⚠️ Department ${entry.departmentId} not found — skipping`);
            continue;
          }

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
          console.log(`✅ [STAGE 2] Created department notification for ${department.name}`);
        }
      }
    } else {
      console.log(`ℹ️ isAsset is false — no department notifications`);
    }

    console.log(`✅ [STAGE 2] Total supplying notifications created: ${totalCount}`);
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
    console.log(`🔄 Checking if request ${requestId} should advance to supplying stage`);

    const request = await ItemRequest.findByPk(requestId, { transaction });
    if (!request) {
      console.log(`⚠️ Request ${requestId} not found`);
      return { advanced: false, reason: "request_not_found" };
    }

    const existingSupplying = await RequestNotification.count({
      where: {
        request_id: requestId,
        stage: "supplying_store",
      },
      transaction,
    });

    if (existingSupplying > 0) {
      console.log(`ℹ️ Supplying notifications already exist — no advancement needed`);
      return { advanced: false, reason: "already_advanced" };
    }

    const askingNotifications = await RequestNotification.findAll({
      where: {
        request_id: requestId,
        stage: "asking_store",
      },
      transaction,
    });

    if (askingNotifications.length === 0) {
      console.log(`⚠️ No asking notifications found for request ${requestId}`);
      return { advanced: false, reason: "no_asking_notifications" };
    }

    const total = askingNotifications.length;
    const accepted = askingNotifications.filter((n) => n.status === "accepted").length;
    const rejected = askingNotifications.filter((n) => n.status === "rejected").length;
    const pending = askingNotifications.filter((n) => n.status === "pending").length;

    console.log(`📊 Asking store progress: ${accepted}/${total} accepted, ${rejected} rejected, ${pending} pending`);

    if (rejected > 0) {
      console.log(`❌ Asking store has rejections — NOT advancing to supplying stage`);
      return { advanced: false, reason: "has_rejection" };
    }

    if (pending > 0) {
      console.log(`⏳ Asking store still has ${pending} pending — waiting`);
      return { advanced: false, reason: "still_pending" };
    }

    console.log(`✅ All asking store groups accepted — ADVANCING to supplying stage`);

    const result = await createSupplyingStageNotifications(
      requestId,
      request.supplyingStoreId,
      request.askingStoreId,
      request.isAsset || false,
      transaction
    );

    console.log(`🚀 Advanced to supplying stage: ${result.count} notifications created`);
    return { advanced: true, count: result.count };
  } catch (error) {
    console.error("❌ Error advancing to supplying stage:", error);
    throw error;
  }
}

// ================================================================
// HELPER: Check if all groups (and department for asset) have accepted
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

  const askingNotifications = notifications.filter((n) => n.stage === 'asking_store');
  const supplyingNotifications = notifications.filter((n) => n.stage === 'supplying_store');

  const askingAccepted = askingNotifications.filter((n) => n.status === 'accepted').length;
  const askingRejected = askingNotifications.filter((n) => n.status === 'rejected').length;
  const askingPending = askingNotifications.filter((n) => n.status === 'pending').length;
  const askingAllAccepted =
    askingNotifications.length > 0 && askingAccepted === askingNotifications.length;

  const supplyingAccepted = supplyingNotifications.filter((n) => n.status === 'accepted').length;
  const supplyingRejected = supplyingNotifications.filter((n) => n.status === 'rejected').length;
  const supplyingPending = supplyingNotifications.filter((n) => n.status === 'pending').length;
  const supplyingAllAccepted =
    supplyingNotifications.length > 0 &&
    supplyingAccepted === supplyingNotifications.length;

  const allAccepted =
    askingNotifications.length > 0 &&
    supplyingNotifications.length > 0 &&
    askingAllAccepted &&
    supplyingAllAccepted;

  const hasRejection = askingRejected > 0 || supplyingRejected > 0;

  return {
    allAccepted,
    hasRejection,
    total: notifications.length,
    acceptedCount: askingAccepted + supplyingAccepted,
    rejectedCount: askingRejected + supplyingRejected,
    pendingCount: askingPending + supplyingPending,
    askingStore: {
      total: askingNotifications.length,
      accepted: askingAccepted,
      rejected: askingRejected,
      pending: askingPending,
      allAccepted: askingAllAccepted,
    },
    supplyingStore: {
      total: supplyingNotifications.length,
      accepted: supplyingAccepted,
      rejected: supplyingRejected,
      pending: supplyingPending,
      allAccepted: supplyingAllAccepted,
    },
  };
}

// ================================================================
// 1. CHECK STOCK AVAILABILITY
// ================================================================
exports.checkStockAvailability = async (req, res) => {
  try {
    const { storeId, items } = req.query;

    if (!storeId || !items) {
      return res.status(400).json({
        success: false,
        error: "Store ID and items are required",
      });
    }

    const parsedItems = JSON.parse(items);
    const validationResult = await validateStockAvailability(
      parseInt(storeId),
      parsedItems,
    );

    const itemDetails = await Promise.all(
      parsedItems.map(async (item) => {
        const itemData = await Item.findByPk(item.itemId, {
          include: [{ model: UOM, as: "uom" }],
        });
        const stockInfo = validationResult.stockInfo.find(
          (s) => s.itemId === item.itemId,
        );
        return {
          ...item,
          itemName: itemData?.name || "Unknown",
          itemCode: itemData?.code || "N/A",
          uomCode: itemData?.uom?.code || "Units",
          availableQuantity: stockInfo?.availableQuantity || 0,
          isAvailable: validationResult.validationSkipped
            ? true
            : stockInfo?.availableQuantity > 0,
          hasEnoughStock: validationResult.validationSkipped
            ? true
            : stockInfo?.availableQuantity >= item.quantity,
          shortage: validationResult.validationSkipped
            ? 0
            : stockInfo
              ? Math.max(0, item.quantity - stockInfo.availableQuantity)
              : item.quantity,
          stockValidationSkipped: validationResult.validationSkipped || false,
          skipReason: validationResult.skipReason || null,
        };
      }),
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
          itemsWithShortage: itemDetails.filter(
            (i) => i.hasEnoughStock === false,
          ).length,
          validationSkipped: validationResult.validationSkipped,
        },
      },
    });
  } catch (error) {
    console.error("Check stock error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check stock availability",
    });
  }
};

// ================================================================
// 2. GET REQUESTS
// ================================================================

exports.getRequests = async (req, res) => {
  try {
    console.log("=".repeat(80));
    console.log("🚀 GET REQUESTS STARTED");
    console.log("=".repeat(80));

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

    console.log("📋 Request Query Parameters:", {
      page, limit, search, status, storeId, userId, sortBy, sortOrder,
    });

    const offset = (page - 1) * limit;
    const where = {};

    const currentUser = req.user;
    const currentUserId = currentUser?.userId;
    const currentUserRole = currentUser?.role;

    console.log("👤 Current User from Request:", {
      userId: currentUserId,
      role: currentUserRole,
      username: currentUser?.username,
      fullName: currentUser?.fullName,
    });

    const { getUserStoreAndGroup } = require("../utils/userAccess");

    let userStoreId = currentUser?.storeId || currentUser?.assignedStoreId;
    let userIsAdmin = false;

    console.log("📍 Initial userStoreId from token:", userStoreId);

    if (!userStoreId && currentUserId) {
      console.log("🔍 No storeId in token, fetching from database...");
      try {
        const accessResult = await getUserStoreAndGroup(currentUserId);
        console.log("📊 Database access result:", JSON.stringify(accessResult, null, 2));

        if (accessResult.success && accessResult.data) {
          userStoreId = accessResult.data.assignedStoreId;
          userIsAdmin = accessResult.data.isAdmin || false;
          console.log("✅ Retrieved from database - storeId:", userStoreId, "isAdmin:", userIsAdmin);
        }
      } catch (err) {
        console.warn("⚠️ Could not get user store from database:", err);
      }
    }

    console.log("=".repeat(80));
    console.log("📌 FINAL USER INFORMATION:");
    console.log("=".repeat(80));
    console.log({
      userId: currentUserId,
      role: currentUserRole,
      storeId: userStoreId,
      isAdmin: userIsAdmin,
      hasStore: !!userStoreId,
    });

    console.log("\n📌 STATUS FILTER:");
    if (status !== "all") {
      where.status = status;
      console.log("✅ Status filter applied:", status);
    } else {
      console.log("ℹ️ No status filter (status = 'all')");
    }

    console.log("\n" + "=".repeat(80));
    console.log("🔒 PERMISSION LOGIC START");
    console.log("=".repeat(80));

    if (currentUserRole === "admin" || userIsAdmin) {
      console.log("\n👑 ADMIN USER DETECTED - showing all requests");

      if (status !== "all") {
        where.status = status;
        console.log("  - Status filter applied:", status);
      }

      if (storeId !== "all") {
        where[Op.or] = [
          { askingStoreId: parseInt(storeId) },
          { supplyingStoreId: parseInt(storeId) },
        ];
        console.log("  - Store filter applied:", storeId);
      }

      console.log("📋 Admin WHERE clause so far:", JSON.stringify(where, null, 2));

    } else if (currentUserRole === "storekeeper" || currentUserRole === "store_it") {
      console.log("\n📦 STORE USER DETECTED:", currentUserRole);

      if (!userStoreId) {
        console.log("⚠️ User has NO store assigned");
        if (currentUserId) {
          where.requestedById = currentUserId;
          console.log("  - Filtering by requestedById:", currentUserId);
        }
        console.log("📋 WHERE clause for user with no store:", JSON.stringify(where, null, 2));
      } else {
        console.log("✅ User has store assigned:", userStoreId);

        const askingStoreCondition = { askingStoreId: userStoreId };
        console.log(`\n📌 RULE 1 - Asking Store (ID: ${userStoreId}):`);
        console.log("  - Can see ALL statuses (pending, approved, finalized)");
        if (status !== "all") {
          askingStoreCondition.status = status;
          console.log("  - Status filter applied to asking condition:", status);
        }
        console.log("  - Condition:", JSON.stringify(askingStoreCondition));

        const supplyingStoreCondition = {
          supplyingStoreId: userStoreId,
          status: { [Op.in]: ["approved", "finalized"] },
        };
        console.log(`\n📌 RULE 2 - Supplying Store (ID: ${userStoreId}):`);
        console.log("  - Can ONLY see approved/finalized");
        if (status !== "all" && ["approved", "finalized"].includes(status)) {
          supplyingStoreCondition.status = status;
          console.log("  - Status filter applied to supplying condition:", status);
        }
        if (status === "pending") {
          console.log("  - ⚠️ Status filter is 'pending' - supplying condition will NOT match any requests!");
        }
        console.log("  - Condition:", JSON.stringify(supplyingStoreCondition));

        where[Op.or] = [askingStoreCondition, supplyingStoreCondition];

        console.log("\n📋 Combined WHERE clause with OR:");
        console.log(JSON.stringify(where, null, 2));

        if (storeId !== "all" && parseInt(storeId) !== userStoreId) {
          console.log(`\n📌 Additional store filter applied (${storeId}):`);
          where[Op.and] = [
            {
              [Op.or]: [
                { askingStoreId: parseInt(storeId) },
                { supplyingStoreId: parseInt(storeId) },
              ],
            },
            {
              [Op.or]: [askingStoreCondition, supplyingStoreCondition],
            },
          ];
          console.log("📋 Updated WHERE with AND + store filter:");
          console.log(JSON.stringify(where, null, 2));
        }

        console.log("\n📋 FINAL PERMISSION SUMMARY:");
        console.log("  - Asking Store:", userStoreId, "→ ALL statuses");
        console.log("  - Supplying Store:", userStoreId, "→ ONLY approved/finalized");
      }

    } else if (currentUserRole === "checker" || currentUserRole === "finance") {
      console.log("\n📊 CHECKER/FINANCE USER DETECTED:", currentUserRole);

      if (status === "all") {
        where.status = { [Op.in]: ["approved", "finalized"] };
        console.log("  - Status set to approved/finalized (no status filter)");
      } else {
        where.status = status;
        console.log("  - Status filter applied:", status);
      }

      if (userStoreId) {
        where[Op.or] = [
          { askingStoreId: userStoreId },
          { supplyingStoreId: userStoreId },
        ];
        console.log("  - Store filter applied:", userStoreId);
      }

      console.log("📋 WHERE clause:", JSON.stringify(where, null, 2));

    } else {
      console.log("\n👤 OTHER USER ROLE DETECTED:", currentUserRole);

      if (currentUserId) {
        where.requestedById = currentUserId;
        console.log("  - Filtering by requestedById:", currentUserId);
      }
      console.log("📋 WHERE clause:", JSON.stringify(where, null, 2));
    }

    console.log("\n" + "=".repeat(80));
    console.log("📌 USER FILTER CHECK:");
    if (userId !== "all") {
      where.requestedById = userId;
      console.log("✅ User filter applied - requestedById:", userId);
    } else {
      console.log("ℹ️ No user filter (userId = 'all')");
    }

    console.log("\n📌 SEARCH FILTER CHECK:");
    if (search) {
      const searchCondition = {
        [Op.or]: [
          { requestCode: { [Op.like]: `%${search}%` } },
          { remark: { [Op.like]: `%${search}%` } },
        ],
      };

      if (where[Op.and]) {
        where[Op.and].push(searchCondition);
      } else {
        where[Op.and] = [searchCondition];
      }
      console.log("✅ Search filter applied:", search);
      console.log("  - Search condition:", JSON.stringify(searchCondition));
    } else {
      console.log("ℹ️ No search filter (search = '')");
    }

    console.log("\n" + "=".repeat(80));
    console.log("📋 FINAL WHERE CLAUSE:");
    console.log("=".repeat(80));
    console.log(JSON.stringify(where, null, 2));
    console.log("=".repeat(80));

    console.log("\n📊 EXECUTING DATABASE QUERY:");
    console.log("  - Page:", page);
    console.log("  - Limit:", limit);
    console.log("  - Offset:", offset);
    console.log("  - Sort By:", sortBy);
    console.log("  - Sort Order:", sortOrder);

    const totalCount = await ItemRequest.count({ where });
    console.log(`\n📊 Total count of visible requests: ${totalCount}`);

    const rows = await ItemRequest.findAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
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
          attributes: [
            "id", "requestId", "itemId", "quantity", "remark",
            "selected_uom", "uom_code", "is_base_uom",
            "specification", "brand", "model",
            "created_at", "updated_at",
          ],
        },
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

    console.log(`\n📊 Query returned ${rows.length} requests`);

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
    console.error("\n❌ GET REQUESTS ERROR:");
    console.error("=".repeat(80));
    console.error(error);
    console.error("=".repeat(80));

    res.status(500).json({
      success: false,
      error: "Failed to fetch requests",
    });
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
        {
          model: ItemRequestDetail,
          as: "items",
          include: [
            {
              model: Item,
              as: "item",
              include: [
                { model: UOM, as: "uom" },
                { model: UOM, as: "conversionUom" }
              ],
            },
          ],
          attributes: [
            'id', 'requestId', 'itemId', 'quantity', 'remark',
            'selected_uom', 'uom_code', 'is_base_uom',
            'specification', 'brand', 'model',
            'created_at', 'updated_at',
          ],
        },
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
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Get request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch request",
    });
  }
};

// ================================================================
// 4. CREATE REQUEST
// ================================================================

exports.createRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedBy,
      requestedDate,
      status = "pending",
      remark,
      isAsset = false,
    } = req.body;

    console.log('📦 ===== ITEMS RECEIVED FROM FRONTEND =====');
    console.log(JSON.stringify(items, null, 2));
    console.log('👤 requestedById:', requestedById);
    console.log('👤 requestedBy  :', requestedBy);

    if (!askingStoreId || !supplyingStoreId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Asking store and supplying store are required",
      });
    }

    if (parseInt(askingStoreId) === parseInt(supplyingStoreId)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Asking store and supplying store cannot be the same",
      });
    }

    const askingStore = await Store.findByPk(askingStoreId);
    const supplyingStore = await Store.findByPk(supplyingStoreId);

    if (!askingStore || !supplyingStore) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "One or both stores not found",
      });
    }

    if (askingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Asking store "${askingStore.name}" is not active`,
      });
    }

    if (supplyingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Supplying store "${supplyingStore.name}" is not active`,
      });
    }

    const skipNotifications = shouldSkipNotifications(supplyingStore.code);
    if (skipNotifications) {
      console.log(
        `⚠️ Store ${supplyingStore.code} (${supplyingStore.name}) - Notifications will be skipped`,
      );
    }

    if (requestedById) {
      const user = await User.findByPk(requestedById);
      if (!user) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }
    }

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    const validatedItems = [];
    const validationErrors = [];
    const itemIds = items.map((item) => item.itemId);

    const itemRecords = await Item.findAll({
      where: { itemId: { [Op.in]: itemIds } },
      include: [
        { model: UOM, as: "uom" },
        { model: UOM, as: "conversionUom" },
      ],
    });

    const itemMap = {};
    itemRecords.forEach((record) => {
      itemMap[record.itemId] = record;
    });

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

      const selectedUom = item.selectedUom || 'base';
      let uomCode = item.uomCode;
      if (!uomCode || uomCode === '') {
        uomCode = itemRecord.uom?.code || 'Units';
      }
      const isBaseUom = item.isBaseUom !== false;

      console.log(`📦 Item ${itemRecord.code}: selectedUom=${selectedUom}, uomCode=${uomCode}, isBaseUom=${isBaseUom}`);

      validatedItems.push({
        ...item,
        itemRecord,
        itemName: itemRecord.name,
        itemCode: itemRecord.code,
        uomCode: uomCode,
        selectedUom: selectedUom,
        isBaseUom: isBaseUom,
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

    const requestCode = await ItemRequest.generateRequestCode();

    const request = await ItemRequest.create(
      {
        requestCode,
        askingStoreId: parseInt(askingStoreId),
        supplyingStoreId: parseInt(supplyingStoreId),
        requestedById: requestedById || null,
        requestedBy: requestedBy || null,
        requestedDate: requestedDate || new Date().toISOString().split("T")[0],
        status: status || "pending",
        remark: remark || null,
        isAsset: isAsset || false,
      },
      { transaction: t },
    );

    await Promise.all(
      validatedItems.map(async (item) => {
        return ItemRequestDetail.create(
          {
            requestId: request.requestId,
            itemId: item.itemId,
            quantity: item.quantity,
            remark: item.remark || null,
            selected_uom: item.selectedUom || 'base',
            uom_code: item.uomCode || item.itemRecord?.uom?.code || 'Units',
            is_base_uom: item.isBaseUom !== false,
            specification: item.specification || null,
            brand: item.brand || null,
            model: item.model || null,
          },
          { transaction: t },
        );
      }),
    );

    let notificationCount = 0;

    if (!skipNotifications) {
      console.log(
        `📤 [STAGE 1] Creating asking store notifications for request ${request.requestId}, isAsset: ${isAsset}`,
      );

      try {
        const requestingUserGroupId = await resolveRequestingUserGroupId(
          req,
          requestedById,
          t
        );

        notificationCount = await createRequestNotifications(
          request.requestId,
          supplyingStoreId,
          askingStoreId,
          isAsset,
          t,
          requestingUserGroupId,
          requestedById
        );
      } catch (notifError) {
        console.error("❌ Error creating notifications:", notifError);
      }
    } else {
      console.log(
        `⚠️ SKIPPED notifications for store: ${supplyingStore.code} (${supplyingStore.name}) - Foreign/Local Purchase`,
      );
    }

    await t.commit();

    const completeRequest = await ItemRequest.findByPk(request.requestId, {
      include: [
        {
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
        },
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
          requestedQuantity: s.requestedQuantity,
          uomCode: s.uomCode,
          hasStock: true,
          hasEnoughStock: true,
          stockValidationSkipped: true,
          skipReason: s.skipReason,
        }))
      : stockValidation.stockInfo.map((s) => ({
          itemId: s.itemId,
          itemName: s.itemName || "Unknown",
          itemCode: s.itemCode || "N/A",
          availableQuantity: s.availableQuantity,
          requestedQuantity: s.requestedQuantity,
          uomCode: s.uomCode || "Units",
          hasStock: s.availableQuantity > 0,
          hasEnoughStock: s.requestedQuantity <= s.availableQuantity,
          stockValidationSkipped: false,
        }));

    const responseMessage = skipNotifications
      ? `✅ Request created successfully. (${supplyingStore.code} - No approval required - Foreign/Local Purchase)`
      : `✅ Request created successfully. Notifications sent to asking store groups first.`;

    res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        request: completeRequest,
        isAsset: isAsset,
        skipNotifications: skipNotifications,
        skipReason: skipNotifications
          ? `Store ${supplyingStore.code} does not require approval (Foreign/Local Purchase)`
          : null,
        notificationCount: notificationCount,
        currentStage: 'asking_store',
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

// ================================================================
// 5. UPDATE REQUEST
// ================================================================
exports.updateRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedBy,
      requestedDate,
      remark,
      isAsset,
    } = req.body;

    console.log(`🔄 Updating request ${id} with data:`, {
      askingStoreId,
      supplyingStoreId,
      itemCount: items?.length ?? 0,
      requestedById,
      requestedBy,
      requestedDate,
      isAsset,
    });

    // ================================================================
    // 1. LOAD + PERMISSION CHECKS
    // ================================================================
    const request = await ItemRequest.findByPk(id, { transaction: t });
    if (!request) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    if (!isRequestCreator(req, request)) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        error: "Only the request creator can edit this request",
      });
    }

    if (request.status === "finalized") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: "Cannot edit finalized requests",
      });
    }

    // ================================================================
    // 2. RESOLVE NEXT STORE IDS (fall back to current values)
    // ================================================================
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
      return res.status(400).json({
        success: false,
        error: "Asking store and supplying store cannot be the same",
      });
    }

    // ================================================================
    // 3. STORE VALIDATION (exists + active)
    // ================================================================
    const askingStore = await Store.findByPk(nextAskingStoreId, { transaction: t });
    const supplyingStore = await Store.findByPk(nextSupplyingStoreId, { transaction: t });

    if (!askingStore || !supplyingStore) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "One or both stores not found",
      });
    }

    if (askingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Asking store "${askingStore.name}" is not active`,
      });
    }

    if (supplyingStore.status !== "Active") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Supplying store "${supplyingStore.name}" is not active`,
      });
    }

    // ================================================================
    // 4. ITEM VALIDATION + STOCK VALIDATION
    //    (identical to createRequest)
    // ================================================================
    let validatedItems = [];
    let stockValidation = null;

    if (items && items.length > 0) {
      const itemIds = items.map((item) => item.itemId);

      const itemRecords = await Item.findAll({
        where: { itemId: { [Op.in]: itemIds } },
        include: [
          { model: UOM, as: "uom" },
          { model: UOM, as: "conversionUom" },
        ],
        transaction: t,
      });

      const itemMap = {};
      itemRecords.forEach((record) => {
        itemMap[record.itemId] = record;
      });

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

        const selectedUom = item.selectedUom || "base";

        let uomCode = item.uomCode;
        if (!uomCode || uomCode === "") {
          uomCode = itemRecord.uom?.code || "Units";
        }

        const isBaseUom = item.isBaseUom !== false;

        // Preserve client value if present, otherwise inherit from item record
        const specification =
          item.specification && String(item.specification).trim() !== ""
            ? item.specification
            : itemRecord.specText || null;

        const brand =
          item.brand && String(item.brand).trim() !== ""
            ? item.brand
            : itemRecord.brand || null;

        const model =
          item.model && String(item.model).trim() !== ""
            ? item.model
            : itemRecord.model || null;

        validatedItems.push({
          ...item,
          itemRecord,
          itemName: itemRecord.name,
          itemCode: itemRecord.code,
          uomCode,
          selectedUom,
          isBaseUom,
          specification,
          brand,
          model,
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

      // 🔥 THE CRITICAL STEP — stock availability
      console.log(
        `📦 Running stock validation for store ${nextSupplyingStoreId} on ${validatedItems.length} item(s)`
      );

      stockValidation = await validateStockAvailability(
        nextSupplyingStoreId,
        validatedItems
      );

      if (!stockValidation.validationSkipped && stockValidation.errors.length > 0) {
        console.log(
          `❌ Stock validation FAILED — ${stockValidation.errors.length} error(s)`
        );
        await t.rollback();

        return res.status(400).json({
          success: false,
          error: "Stock validation failed",
          errors: stockValidation.errors,
          stockInfo: stockValidation.stockInfo,
          summary: {
            totalItems: validatedItems.length,
            itemsWithStock: stockValidation.stockInfo.filter(
              (s) => s.availableQuantity > 0
            ).length,
            itemsWithoutStock: stockValidation.errors.filter(
              (e) => e.availableQuantity === 0
            ).length,
            itemsWithShortage: stockValidation.errors.filter(
              (e) => e.availableQuantity > 0 && e.shortage > 0
            ).length,
            storeName: supplyingStore.name,
            storeId: nextSupplyingStoreId,
            validationSkipped: false,
          },
        });
      }

      console.log(`✅ Stock validation passed`);
    } else {
      console.log(`ℹ️ No items in payload — skipping item/stock validation`);
    }

    // ================================================================
    // 5. UPDATE REQUEST ROW
    // ================================================================
    await request.update(
      {
        askingStoreId: nextAskingStoreId,
        supplyingStoreId: nextSupplyingStoreId,
        requestedById:
          requestedById !== undefined ? requestedById : request.requestedById,
        requestedBy:
          requestedBy !== undefined ? requestedBy : request.requestedBy,
        requestedDate: requestedDate || request.requestedDate,
        status: "pending",
        remark: remark !== undefined ? remark : request.remark,
        isAsset: isAsset !== undefined ? isAsset : request.isAsset,
      },
      { transaction: t }
    );

    // ================================================================
    // 6. REPLACE ITEM DETAILS
    // ================================================================
    if (validatedItems.length > 0) {
      await ItemRequestDetail.destroy({
        where: { requestId: id },
        transaction: t,
      });

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

    // ================================================================
    // 7. RECREATE NOTIFICATIONS (respecting SKIP stores)
    // ================================================================
    const skipNotifications = shouldSkipNotifications(supplyingStore.code);
    const updatedIsAsset = isAsset !== undefined ? isAsset : request.isAsset;
    const updatedRequestedById =
      requestedById !== undefined ? requestedById : request.requestedById;

    console.log(`🗑️ Deleting all notifications for request ${id}`);
    await RequestNotification.destroy({
      where: { request_id: id },
      transaction: t,
    });

    if (skipNotifications) {
      console.log(
        `⚠️ SKIPPED notification recreation for store ${supplyingStore.code} (${supplyingStore.name}) — Foreign/Local Purchase`
      );
    } else {
      console.log(
        `📤 [STAGE 1] Recreating asking store notifications for request ${id}, isAsset: ${updatedIsAsset}`
      );

      try {
        const requestingUserGroupId = await resolveRequestingUserGroupId(
          req,
          updatedRequestedById,
          t
        );

        await createRequestNotifications(
          request.requestId,
          nextSupplyingStoreId,
          nextAskingStoreId,
          updatedIsAsset || false,
          t,
          requestingUserGroupId,
          updatedRequestedById
        );
      } catch (notifError) {
        console.error("❌ Notification recreation failed — rolling back:", {
          name: notifError?.name,
          message: notifError?.message,
          sql: notifError?.sql,
          parent: notifError?.parent?.message,
          original: notifError?.original?.message,
        });

        await t.rollback();
        return res.status(500).json({
          success: false,
          error: notifError.message || "Failed to recreate notifications",
          phase: "notifications",
        });
      }
    }

    // ================================================================
    // 8. COMMIT
    // ================================================================
    await t.commit();

    console.log(
      `✅ Request ${id} updated successfully — status reset to pending`
    );

    // ================================================================
    // 9. RELOAD WITH FULL ASSOCIATIONS + RESPOND
    // ================================================================
    const updatedRequest = await ItemRequest.findByPk(id, {
      include: [
        {
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
            "id",
            "requestId",
            "itemId",
            "quantity",
            "remark",
            "selected_uom",
            "uom_code",
            "is_base_uom",
            "specification",
            "brand",
            "model",
            "created_at",
            "updated_at",
          ],
        },
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: [
            "userId",
            "username",
            "fullName",
            "email",
            "roleId",
            "departmentId",
          ],
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
    });
  } catch (error) {
    // ================================================================
    // ROLLBACK + DETAILED ERROR LOGGING
    // ================================================================
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
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    if (!isRequestCreator(req, request)) {
      return res.status(403).json({
        success: false,
        error: "Only the request creator can change status",
      });
    }

    if (request.status === "finalized") {
      return res.status(400).json({
        success: false,
        error: "Cannot change status of finalized requests",
      });
    }

    if (request.status === "rejected" && status === "approved") {
      return res.status(400).json({
        success: false,
        error: "Cannot approve a rejected request. Edit the request to reset status to pending",
      });
    }

    await request.update({
      status: status,
    });

    const updatedRequest = await ItemRequest.findByPk(id, {
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
// 7. GET REQUESTS BY USER
// ================================================================
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
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

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get by user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch requests for user",
    });
  }
};

// ================================================================
// 8. GET MY REQUESTS
// ================================================================
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
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

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get my requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch your requests",
    });
  }
};

// ================================================================
// 9. GET REQUESTS BY STATUS
// ================================================================
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

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get by status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch requests by status",
    });
  }
};

// ================================================================
// 10. GET REQUESTS BY DATE RANGE
// ================================================================
exports.getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "startDate and endDate are required",
      });
    }

    const requests = await ItemRequest.findAll({
      where: {
        requestedDate: {
          [Op.between]: [startDate, endDate],
        },
      },
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

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get by date range error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch requests by date range",
    });
  }
};

// ================================================================
// 11. DELETE REQUEST
// ================================================================
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    if (!isRequestCreator(req, request)) {
      return res.status(403).json({
        success: false,
        error: "Only the request creator can delete this request",
      });
    }

    if (request.status === "approved") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete approved requests. Edit the request to reset status to pending first",
      });
    }

    if (request.status === "finalized") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete finalized requests",
      });
    }

    await RequestNotification.destroy({
      where: { request_id: id },
    });

    await request.destroy();

    res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    console.error("Delete request error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete request",
    });
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

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    const notifications = request.notifications || [];

    const askingNotifs = notifications.filter((n) => n.stage === 'asking_store');
    const supplyingNotifs = notifications.filter((n) => n.stage === 'supplying_store');

    const total = notifications.length;
    const accepted = notifications.filter((n) => n.status === "accepted").length;
    const rejected = notifications.filter((n) => n.status === "rejected").length;
    const pending = notifications.filter((n) => n.status === "pending").length;
    const allAccepted = total > 0 && accepted === total;
    const hasRejection = rejected > 0;

    const rejectionReasons = notifications
      .filter((n) => n.status === "rejected")
      .map((n) => {
        let name = "Unknown";
        if (n.group_id) {
          name = n.group?.name || `Group ${n.group_id}`;
        } else if (n.department_id) {
          name = n.department?.name || `Department ${n.department_id}`;
        }
        return {
          id: n.id,
          type: n.approval_type || "group",
          stage: n.stage || "supplying_store",
          name: name,
          reason: n.rejected_reason,
          respondedBy:
            n.respondedByUser?.fullName ||
            n.respondedByUser?.username ||
            "Unknown",
          respondedAt: n.responded_at,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        request,
        notificationSummary: {
          total,
          accepted,
          rejected,
          pending,
          allAccepted,
          hasRejection,
          rejectionReasons,
          askingStore: {
            total: askingNotifs.length,
            accepted: askingNotifs.filter((n) => n.status === 'accepted').length,
            rejected: askingNotifs.filter((n) => n.status === 'rejected').length,
            pending: askingNotifs.filter((n) => n.status === 'pending').length,
          },
          supplyingStore: {
            total: supplyingNotifs.length,
            accepted: supplyingNotifs.filter((n) => n.status === 'accepted').length,
            rejected: supplyingNotifs.filter((n) => n.status === 'rejected').length,
            pending: supplyingNotifs.filter((n) => n.status === 'pending').length,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error getting request with notifications:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get request",
    });
  }
};

// ================================================================
// 13. CHECK REQUEST NOTIFICATION STATUS
// ================================================================
exports.checkRequestNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await isRequestFullyAccepted(parseInt(id));

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error checking notification status:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to check notification status",
    });
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
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const notification = await RequestNotification.findByPk(notificationId, {
      transaction: t,
    });

    if (!notification) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    if (notification.status !== "pending") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        error: `Notification is already ${notification.status}`,
      });
    }

    await notification.update(
      {
        status: "accepted",
        responded_by: userId,
        responded_at: new Date(),
      },
      { transaction: t }
    );

    console.log(`✅ Notification ${notificationId} accepted (stage: ${notification.stage})`);

    let stageAdvanced = false;
    let advancementResult = null;

    if (notification.stage === "asking_store") {
      console.log(`🔄 Asking store notification accepted — checking advancement...`);

      advancementResult = await checkAndAdvanceToSupplyingStage(
        notification.request_id,
        t
      );

      stageAdvanced = advancementResult.advanced;

      if (stageAdvanced) {
        console.log(`🚀 ADVANCED TO SUPPLYING STAGE!`);
      }
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
    res.status(500).json({
      success: false,
      error: error.message || "Failed to accept notification",
    });
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required",
      });
    }

    const notification = await RequestNotification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    if (notification.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Notification is already ${notification.status}`,
      });
    }

    await notification.update({
      status: "rejected",
      rejected_reason: reason.trim(),
      responded_by: userId,
      responded_at: new Date(),
    });

    console.log(
      `❌ Notification ${notificationId} REJECTED (stage: ${notification.stage}) — ` +
      `request ${notification.request_id} will NOT advance`
    );

    res.status(200).json({
      success: true,
      message: "Notification rejected",
      data: notification,
    });
  } catch (error) {
    console.error("Error rejecting notification:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to reject notification",
    });
  }
};

// ================================================================
// 16. GET REJECTION REASONS
// ================================================================
exports.getRejectionReasons = async (req, res) => {
  try {
    const { requestId } = req.params;

    const notifications = await RequestNotification.findAll({
      where: {
        request_id: requestId,
        status: "rejected",
      },
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

    res.status(200).json({
      success: true,
      data: reasons,
    });
  } catch (error) {
    console.error("Error getting rejection reasons:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get rejection reasons",
    });
  }
};

// ================================================================
// 17. EXPORT REQUESTS
// ================================================================
exports.exportRequests = async (req, res) => {
  try {
    const { status, storeId, userId } = req.query;

    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }

    if (storeId && storeId !== "all") {
      where[Op.or] = [
        { askingStoreId: storeId },
        { supplyingStoreId: storeId },
      ];
    }

    if (userId && userId !== "all") {
      where.requestedById = userId;
    }

    const requests = await ItemRequest.findAll({
      where,
      order: [["createdAt", "DESC"]],
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
        { model: Store, as: "askingStore" },
        { model: Store, as: "supplyingStore" },
        {
          model: User,
          as: "requestedByUser",
          attributes: ["userId", "username", "fullName", "email"],
        },
      ],
    });

    const exportData = requests.map((req) => ({
      "Request Code": req.requestCode,
      "Asking Store": req.askingStore?.name || "N/A",
      "Supplying Store": req.supplyingStore?.name || "N/A",
      "Requested By":
        req.requestedByUser?.fullName || req.requestedByUser?.username || "N/A",
      "Requested By Email": req.requestedByUser?.email || "N/A",
      "Requested Date": req.requestedDate,
      Status: req.status,
      Items: req.items
        .map(
          (item) =>
            `${item.item?.name || "Unknown"} (${item.quantity} ${item.item?.uom?.code || "Units"})`,
        )
        .join("; "),
      Remark: req.remark || "",
    }));

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export requests",
    });
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

    console.log("🔍 Stats - Current user:", {
      userId: currentUserId,
      role: currentUserRole,
      storeId: userStoreId,
    });

    let where = {};

    if (currentUserRole === "admin") {
      console.log("👑 Admin user - showing all requests for stats");
    } else if (currentUserRole === "storekeeper" || currentUserRole === "store_it") {
      if (userStoreId) {
        where[Op.or] = [
          { askingStoreId: userStoreId },
          { supplyingStoreId: userStoreId },
        ];
        console.log(`📦 Store user (${currentUserRole}) - stats for store ${userStoreId}`);
      } else {
        if (currentUserId) {
          where.requestedById = currentUserId;
        }
        console.log(`👤 Store user with no store - showing only their requests`);
      }
    } else if (currentUserRole === "checker" || currentUserRole === "finance") {
      where.status = { [Op.in]: ["approved", "finalized"] };
      if (userStoreId) {
        where[Op.or] = [
          { askingStoreId: userStoreId },
          { supplyingStoreId: userStoreId },
        ];
      }
      console.log(`📊 Checker/Finance user - showing approved/finalized requests`);
    } else {
      if (currentUserId) {
        where.requestedById = currentUserId;
        console.log(`👤 Non-store user - showing only their requests (userId: ${currentUserId})`);
      } else {
        return res.json({
          success: true,
          data: { total: 0, pending: 0, approved: 0, rejected: 0, finalized: 0 },
        });
      }

      if (userStoreId) {
        where[Op.or] = [
          { requestedById: currentUserId },
          { askingStoreId: userStoreId },
          { supplyingStoreId: userStoreId },
        ];
        console.log(`📍 User also has store ${userStoreId} - showing store requests too`);
      }
    }

    console.log("📋 Stats WHERE clause:", JSON.stringify(where, null, 2));

    const total = await ItemRequest.count({ where });
    const pending = await ItemRequest.count({ where: { ...where, status: 'pending' } });
    const approved = await ItemRequest.count({ where: { ...where, status: 'approved' } });
    const rejected = await ItemRequest.count({ where: { ...where, status: 'rejected' } });
    const finalized = await ItemRequest.count({ where: { ...where, status: 'finalized' } });

    const statusBreakdown = await ItemRequest.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['status']
    });

    console.log('📊 Stats result:', {
      total, pending, approved, rejected, finalized,
      breakdown: statusBreakdown.map(s => ({
        status: s.status,
        count: parseInt(s.dataValues.count)
      }))
    });

    res.json({
      success: true,
      data: {
        total, pending, approved, rejected, finalized,
        breakdown: statusBreakdown.map(s => ({
          status: s.status,
          count: parseInt(s.dataValues.count)
        }))
      }
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
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

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error("Get active stores error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active stores",
    });
  }
};

// ================================================================
// 20. GET ACTIVE ITEMS
// ================================================================
exports.getActiveItems = async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    
    const where = { status: "Active" };
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      where[Op.or] = [
        { code: { [Op.iLike]: `%${searchTerm}%` } },
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { standardName: { [Op.iLike]: `%${searchTerm}%` } },
        { brand: { [Op.iLike]: `%${searchTerm}%` } },
        { model: { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }

    const { count, rows } = await Item.findAndCountAll({
      where,
      attributes: [
        "itemId", "code", "name", "standardName", "brand", "model",
        "uomId", "conversionUomId", "conversionValue", "specText",
      ],
      include: [
        { model: UOM, as: "uom", attributes: ["uomId", "code", "name"] },
        { model: UOM, as: "conversionUom", attributes: ["uomId", "code", "name"] },
      ],
      order: [["code", "ASC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get active items error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch active items",
    });
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const storeGroupRelation = await StoreGroupRelation.findOne({
      where: {
        store_id: parseInt(storeId),
        group_id: parseInt(groupId),
      },
    });

    if (!storeGroupRelation) {
      return res.status(404).json({
        success: false,
        error: "Group not found in this store",
      });
    }

    const whereClause = {
      group_id: parseInt(groupId),
      store_id: parseInt(storeId),
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const totalCount = await RequestNotification.count({
      where: whereClause,
    });

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
        store: {
          id: parseInt(storeId),
          group: { id: parseInt(groupId) },
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting group notifications:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get notifications",
    });
  }
};

// ================================================================
// 22. GET DEPARTMENT NOTIFICATIONS (for ASSET requests)
// ================================================================
exports.getDepartmentNotifications = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const deptId = parseInt(departmentId);
    if (isNaN(deptId) || deptId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID",
      });
    }

    const { Department } = db;

    const department = await Department.findByPk(deptId);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found",
      });
    }

    const whereClause = {
      department_id: deptId,
      approval_type: "department",
      is_department_approval: true,
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

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
            { model: User, as: "requestedByUser" },
            {
              model: ItemRequestDetail,
              as: "items",
              include: [
                {
                  model: Item,
                  as: "item",
                  include: [{ model: UOM, as: "uom" }]
                }
              ]
            }
          ]
        },
        {
          model: Department,
          as: "department",
          attributes: ["department_id", "name", "code", "description"]
        },
        {
          model: User,
          as: "respondedByUser",
          attributes: ["userId", "username", "fullName"]
        }
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
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get department notifications",
    });
  }
};

// ================================================================
// 23. GET STORE GROUPS (Helper endpoint)
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

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("❌ Error getting store groups:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get store groups",
    });
  }
};

// ================================================================
// 24. GET PENDING NOTIFICATIONS (Combined - Group + Department)
// ================================================================
exports.getPendingNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const userStoreId = req.user?.storeId || req.user?.assignedStoreId;
    const userGroupId = req.user?.groupId || req.user?.assignedGroupId;
    const departmentId = req.user?.departmentId;

    console.log('📤 getPendingNotifications called:');
    console.log('  userId:', userId);
    console.log('  userRole:', userRole);
    console.log('  userStoreId:', userStoreId);
    console.log('  userGroupId:', userGroupId);
    console.log('  departmentId:', departmentId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const isAdmin = userRole === 'admin' || userRole === 'Admin' || userRole === 'superadmin';
    const isChecker = userRole === 'checker' || userRole === 'Checker';

    let groupWhere = {
      status: 'pending',
      [Op.or]: [
        { approval_type: 'group' },
        { approval_type: null }
      ]
    };

    let deptWhere = {
      status: 'pending',
      approval_type: 'department',
      is_department_approval: true
    };

    if (isAdmin || isChecker) {
      console.log(`👑 ${userRole} user - showing ALL pending notifications`);
    } else {
      if (userStoreId && userGroupId) {
        const storeGroupRelation = await StoreGroupRelation.findOne({
          where: {
            store_id: parseInt(userStoreId),
            group_id: parseInt(userGroupId),
          },
        });

        if (storeGroupRelation) {
          groupWhere.group_id = parseInt(userGroupId);
          groupWhere.store_id = parseInt(userStoreId);
          console.log('✅ Group notifications will be fetched for store:', userStoreId, 'group:', userGroupId);
        } else {
          console.log('⚠️ Group not found in this store, skipping group notifications');
          groupWhere.id = -1;
        }
      } else {
        console.log('⚠️ No store/group found, skipping group notifications');
        groupWhere.id = -1;
      }

      if (departmentId) {
        deptWhere.department_id = parseInt(departmentId);
        console.log('✅ Department notifications will be fetched for department:', departmentId);
      } else {
        console.log('⚠️ No department found, skipping department notifications');
        deptWhere.id = -1;
      }
    }

    const limitVal = parseInt(limit) || 10;
    const offsetVal = ((parseInt(page) || 1) - 1) * limitVal;

    let groupNotifications = [];
    let deptNotifications = [];
    let groupTotal = 0;
    let deptTotal = 0;

    if (groupWhere.id !== -1) {
      const groupResult = await RequestNotification.findAndCountAll({
        where: groupWhere,
        include: [
          {
            model: ItemRequest,
            as: "request",
            include: [
              { model: Store, as: "askingStore" },
              { model: Store, as: "supplyingStore" },
              { model: User, as: "requestedByUser" },
              {
                model: ItemRequestDetail,
                as: "items",
                include: [
                  {
                    model: Item,
                    as: "item",
                    include: [{ model: UOM, as: "uom" }]
                  }
                ]
              }
            ]
          },
          { model: Group, as: "group" },
          { model: Store, as: "store" },
          { model: User, as: "respondedByUser" }
        ],
        order: [["created_at", "DESC"]],
        limit: limitVal,
        offset: offsetVal,
        distinct: true,
      });
      groupNotifications = groupResult.rows || [];
      groupTotal = groupResult.count || 0;
      console.log(`📊 Found ${groupTotal} group notifications`);
    }

    if (deptWhere.id !== -1) {
      const deptResult = await RequestNotification.findAndCountAll({
        where: deptWhere,
        include: [
          {
            model: ItemRequest,
            as: "request",
            include: [
              { model: Store, as: "askingStore" },
              { model: Store, as: "supplyingStore" },
              { model: User, as: "requestedByUser" },
              {
                model: ItemRequestDetail,
                as: "items",
                include: [
                  {
                    model: Item,
                    as: "item",
                    include: [{ model: UOM, as: "uom" }]
                  }
                ]
              }
            ]
          },
          {
            model: Department,
            as: "department",
            attributes: ["department_id", "name", "code", "description"]
          },
          {
            model: User,
            as: "respondedByUser",
            attributes: ["userId", "username", "fullName"]
          }
        ],
        order: [["created_at", "DESC"]],
        limit: limitVal,
        offset: offsetVal,
        distinct: true,
      });
      deptNotifications = deptResult.rows || [];
      deptTotal = deptResult.count || 0;
      console.log(`📊 Found ${deptTotal} department notifications`);
    }

    const allNotifications = [
      ...groupNotifications.map(n => ({
        ...(n.toJSON ? n.toJSON() : n),
        _type: 'group',
        _typeLabel: '👥 Group'
      })),
      ...deptNotifications.map(n => ({
        ...(n.toJSON ? n.toJSON() : n),
        _type: 'department',
        _typeLabel: '🏛️ Department'
      }))
    ];

    allNotifications.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const total = groupTotal + deptTotal;
    const pages = Math.ceil(total / limitVal);

    console.log(`✅ Total pending notifications: ${total} (Group: ${groupTotal}, Dept: ${deptTotal})`);

    res.json({
      success: true,
      data: {
        notifications: allNotifications,
        summary: {
          total,
          group: groupTotal,
          department: deptTotal,
          page: parseInt(page) || 1,
          limit: limitVal,
          pages: pages,
        },
        user: {
          userId,
          role: userRole,
          storeId: userStoreId,
          groupId: userGroupId,
          departmentId: departmentId,
          isAdmin: isAdmin,
          isChecker: isChecker,
        },
      },
    });

  } catch (error) {
    console.error("❌ Error getting pending notifications:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get pending notifications",
    });
  }
};

// ================================================================
// 25. 🔥 NEW: GET APPROVAL DEPARTMENTS FOR A STORE
// ================================================================
/**
 * GET /api/item-requests/approval-departments/:storeCode
 *
 * Returns the list of departments that need to approve requests
 * for the given asking store code.
 */
exports.getApprovalDepartmentsForStore = async (req, res) => {
  try {
    const { storeCode } = req.params;

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        error: "Store code is required",
      });
    }

    console.log(`📤 Fetching approval departments for store: ${storeCode}`);

    // Verify the store exists
    const store = await Store.findOne({ where: { code: storeCode } });
    if (!store) {
      return res.status(404).json({
        success: false,
        error: `Store with code "${storeCode}" not found`,
      });
    }

    // Get the approval department config
    const config = await getApprovalDepartmentConfig();

    if (!config || !config.departments || config.departments.length === 0) {
      console.log(`ℹ️ No approval departments configured`);
      return res.json({
        success: true,
        data: {
          storeCode,
          storeName: store.name,
          requiresApproval: false,
          departments: [],
        },
      });
    }

    // Filter departments whose appliesTo includes the store code
    const applicableDepartments = config.departments.filter(
      (d) => Array.isArray(d.appliesTo) && d.appliesTo.includes(storeCode)
    );

    console.log(
      `📋 ${applicableDepartments.length} of ${config.departments.length} ` +
      `department(s) apply to store ${storeCode}`
    );

    // Fetch department details for each applicable one
    const enriched = await Promise.all(
      applicableDepartments.map(async (entry) => {
        const department = await db.Department.findByPk(entry.departmentId);
        if (!department) {
          return {
            departmentId: entry.departmentId,
            name: `Department ${entry.departmentId}`,
            code: 'N/A',
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
      data: {
        storeCode,
        storeName: store.name,
        requiresApproval: true,
        departments: enriched,
      },
    });
  } catch (error) {
    console.error("❌ Error getting approval departments for store:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch approval departments",
    });
  }
};