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
// HELPER: Get department from SystemSetting for asset approvals
// ================================================================
async function getApprovalDepartmentConfig() {
  try {
    const SystemSetting = db.SystemSetting;
    const setting = await SystemSetting.findOne({
      where: { settingKey: 'approval.department' }
    });

    if (!setting) {
      console.log('⚠️ No department setting found');
      return null;
    }

    // ✅ The settingValue is already parsed JSONB in PostgreSQL
    const config = setting.settingValue;
    
    console.log('📋 Found department config:', config);

    // Check if departmentId exists
    if (!config || !config.departmentId) {
      console.log('⚠️ Department setting missing departmentId');
      return null;
    }

    // Verify the department exists
    const department = await db.Department.findByPk(config.departmentId);
    if (!department) {
      console.log(`⚠️ Department ${config.departmentId} not found`);
      return null;
    }

    return {
      departmentId: config.departmentId,
      name: config.name || department.name,
      code: config.code || department.code,
      applyToStores: config.applyToStores || [],
      requiresApproval: config.requiresApproval !== false,
    };
  } catch (error) {
    console.error('❌ Error getting approval department config:', error);
    return null;
  }
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

  // Skip validation for exempt stores
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

  // ================================================================
  // NORMAL STOCK VALIDATION - CHECK BOTH TABLES
  // ================================================================
  
  for (const item of items) {
    // 1. Get full item details with UOMs
    const itemRecord = await Item.findByPk(item.itemId, {
      include: [
        { model: UOM, as: "uom" },          // Base UOM (DRUM, ROLL)
        { model: UOM, as: "conversionUom" } // Conversion UOM (KG, MTR)
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

    // 2. Determine if user requested base UOM or conversion UOM
    const isBaseUom = item.isBaseUom !== false; // true = DRUM, false = KG
    const userUomCode = item.uomCode || itemRecord.uom?.code || "Units";
    const userQuantity = parseFloat(item.quantity);

    // Get base UOM and conversion UOM info
    const baseUomCode = itemRecord.uom?.code || "Units";
    const conversionUomCode = itemRecord.conversionUom?.code || null;
    const conversionValue = itemRecord.conversionValue ? parseFloat(itemRecord.conversionValue) : null;

    console.log(`📦 Checking item: ${itemRecord.code}`);
    console.log(`   User wants: ${userQuantity} ${userUomCode}`);
    console.log(`   Base UOM: ${baseUomCode}, Conversion UOM: ${conversionUomCode}`);

    // 3. Query BOTH balance tables
    const [storeBalance, convertedBalance] = await Promise.all([
      // Check StoreBalance (Base UOM - DRUM, ROLL)
      StoreBalance.findOne({
        where: {
          storeId: supplyingStoreId,
          itemId: item.itemId,
          status: "Active",
        },
      }),
      // Check ConvertedBalance (Conversion UOM - KG, MTR)
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

    // 4. CHECK BASED ON USER'S REQUESTED UOM
    
    if (isBaseUom) {
      // ============================================================
      // USER REQUESTED IN BASE UOM (DRUM, ROLL)
      // ============================================================
      
      if (hasBaseBalance) {
        // ✅ FOUND in Base UOM - Check quantity
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
          // ❌ Insufficient stock in Base UOM
          errors.push({
            itemId: item.itemId,
            itemName: itemRecord.name,
            itemCode: itemRecord.code,
            requestedQuantity: userQuantity,
            availableQuantity: availableQuantity,
            shortage: userQuantity - availableQuantity,
            uomCode: baseUomCode,
            balanceType: 'base',
            message: `Insufficient stock in ${baseUomCode}.  Requested: ${userQuantity} ${baseUomCode}`,
          });
        }
        
      } else if (hasConversionBalance) {
        // ⚠️ NOT FOUND in Base UOM, but FOUND in Conversion UOM
        // Tell user to request in Conversion UOM instead
        
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
          message: `This item is available in ${conversionUomCode} only . Please request in ${conversionUomCode} instead.`,
          suggestion: `Request in ${conversionUomCode}`,
          availableInOtherUom: conversionBalance,
          otherUomCode: conversionUomCode,
        });
        
      } else {
        // ❌ NOT FOUND in either table
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
      // ============================================================
      // USER REQUESTED IN CONVERSION UOM (KG, MTR)
      // ============================================================
      
      if (hasConversionBalance) {
        // ✅ FOUND in Conversion UOM - Check quantity
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
          // ❌ Insufficient stock in Conversion UOM
          errors.push({
            itemId: item.itemId,
            itemName: itemRecord.name,
            itemCode: itemRecord.code,
            requestedQuantity: userQuantity,
            availableQuantity: availableQuantity,
            shortage: userQuantity - availableQuantity,
            uomCode: conversionUomCode,
            balanceType: 'conversion',
            message: `Insufficient stock in ${conversionUomCode}.Requested: ${userQuantity} ${conversionUomCode}`,
          });
        }
        
      } else if (hasBaseBalance) {
        // ⚠️ NOT FOUND in Conversion UOM, but FOUND in Base UOM
        // Tell user to request in Base UOM instead
        
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
          message: `This item is available in ${baseUomCode} only . Please request in ${baseUomCode} instead.`,
          suggestion: `Request in ${baseUomCode}`,
          availableInOtherUom: baseBalance,
          otherUomCode: baseUomCode,
        });
        
      } else {
        // ❌ NOT FOUND in either table
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
// HELPER: Create notifications (GROUPS + DEPARTMENT for ASSET)
// ================================================================
async function createRequestNotifications(requestId, storeId, askingStoreId, isAsset = false, transaction = null) {
  try {
    console.log(
      `📤 Creating notifications for request ${requestId}, store ${storeId}, isAsset: ${isAsset}`,
    );

    // 🔥 STEP 1: Get the asking store details
    const askingStore = await Store.findByPk(askingStoreId);
    if (!askingStore) {
      console.log(`⚠️ Asking store ${askingStoreId} not found`);
      return 0;
    }

    console.log(`📋 Asking Store: ${askingStore.code} (${askingStore.name})`);

    // 🔥 STEP 2: Get all active groups for the supplying store
    const groups = await db.sequelize.query(
      `SELECT g.id, g.name, g.code, g.status
       FROM groups g
       INNER JOIN store_group_relations sgr ON sgr.group_id = g.id
       WHERE sgr.store_id = :storeId AND g.status = 'Active'`,
      {
        replacements: { storeId: parseInt(storeId) },
        type: db.sequelize.QueryTypes.SELECT,
        transaction: transaction,
      },
    );

    console.log(`📋 Found ${groups.length} groups for supplying store`);

    // 🔥 STEP 3: Create notifications
    let totalCount = 0;

    // 3a. Create group notifications using bulkCreate
    const groupNotifications = [];
    for (const group of groups) {
      const groupId = parseInt(group.id);
      if (!groupId || isNaN(groupId)) continue;

      groupNotifications.push({
        request_id: parseInt(requestId),
        group_id: groupId,
        store_id: parseInt(storeId),
        status: "pending",
        approval_type: "group",
        is_department_approval: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (groupNotifications.length > 0) {
      const result = await RequestNotification.bulkCreate(groupNotifications, {
        validate: false,
        returning: true,
        transaction: transaction,
      });
      totalCount += result.length;
      console.log(`✅ Created ${result.length} group notifications`);
    }

    // 3b. 🔥 CREATE DEPARTMENT NOTIFICATION USING `create()`
    if (isAsset) {
      console.log(`📋 isAsset is true, checking department config...`);
      
      // Get department from SystemSetting
      const SystemSetting = db.SystemSetting;
      const setting = await SystemSetting.findOne({
        where: { settingKey: 'approval.department' }
      });

      console.log('📋 Found setting:', setting ? setting.toJSON() : 'null');

      if (setting && setting.settingValue) {
        const config = setting.settingValue;
        const departmentId = config.departmentId;
        
        console.log(`📋 Department ID from config: ${departmentId}`);

        if (departmentId) {
          // ✅ Verify department exists using the correct field name
          const department = await db.Department.findByPk(departmentId);
          console.log('📋 Found department:', department ? department.toJSON() : 'null');
          
          if (department) {
            // ✅ CREATE department notification - department_id will be saved!
            const deptNotification = await RequestNotification.create({
              request_id: parseInt(requestId),
              group_id: null,
              department_id: department.departmentId,  // ✅ Use department.departmentId (from model)
              store_id: parseInt(storeId),
              status: "pending",
              approval_type: "department",
              is_department_approval: true,
              created_at: new Date(),
              updated_at: new Date(),
            }, { 
              transaction: transaction,
            });
            
            totalCount++;
            console.log(`✅ Added department notification for: ${department.name} (ID: ${department.departmentId})`);
            console.log('📋 Created department notification:', deptNotification.toJSON());
          } else {
            console.log(`⚠️ Department ${departmentId} not found in departments table`);
          }
        } else {
          console.log(`⚠️ No departmentId in config`);
        }
      } else {
        console.log(`⚠️ No SystemSetting found for 'approval.department'`);
      }
    }

    console.log(`✅ Total notifications created: ${totalCount}`);
    return totalCount;
  } catch (error) {
    console.error("❌ Error creating notifications:", error);
    throw error;
  }
}

// ================================================================
// HELPER: Check if all groups have accepted a request
// ================================================================
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
      groups: {
        total: 0,
        accepted: 0,
        rejected: 0,
        pending: 0,
        allAccepted: false,
      },
      department: {
        total: 0,
        accepted: 0,
        rejected: 0,
        pending: 0,
        allAccepted: false,
      },
    };
  }

  // Separate group and department notifications
  const groupNotifications = notifications.filter(
    (n) => n.approval_type === 'group' || !n.approval_type
  );
  const departmentNotifications = notifications.filter(
    (n) => n.approval_type === 'department'
  );

  // Group stats
  const groupsAccepted = groupNotifications.filter((n) => n.status === 'accepted').length;
  const groupsRejected = groupNotifications.filter((n) => n.status === 'rejected').length;
  const groupsPending = groupNotifications.filter((n) => n.status === 'pending').length;

  const allGroupsAccepted = groupNotifications.length > 0 && 
    groupsAccepted === groupNotifications.length;

  // Department stats
  const deptAccepted = departmentNotifications.filter((n) => n.status === 'accepted').length;
  const deptRejected = departmentNotifications.filter((n) => n.status === 'rejected').length;
  const deptPending = departmentNotifications.filter((n) => n.status === 'pending').length;

  const allDepartmentsAccepted = departmentNotifications.length === 0 || 
    (departmentNotifications.length > 0 && deptAccepted === departmentNotifications.length);

  // Overall status
  const allAccepted = allGroupsAccepted && allDepartmentsAccepted;
  const hasRejection = groupsRejected > 0 || deptRejected > 0;

  return {
    allAccepted,
    hasRejection,
    total: notifications.length,
    acceptedCount: groupsAccepted + deptAccepted,
    rejectedCount: groupsRejected + deptRejected,
    pendingCount: groupsPending + deptPending,
    groups: {
      total: groupNotifications.length,
      accepted: groupsAccepted,
      rejected: groupsRejected,
      pending: groupsPending,
      allAccepted: allGroupsAccepted,
    },
    department: {
      total: departmentNotifications.length,
      accepted: deptAccepted,
      rejected: deptRejected,
      pending: deptPending,
      allAccepted: allDepartmentsAccepted,
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
      page,
      limit,
      search,
      status,
      storeId,
      userId,
      sortBy,
      sortOrder
    });

    const offset = (page - 1) * limit;
    const where = {};

    // ================================================================
    // 🔥 GET USER INFORMATION
    // ================================================================
    const currentUser = req.user;
    const currentUserId = currentUser?.userId;
    const currentUserRole = currentUser?.role;
    
    console.log("👤 Current User from Request:", {
      userId: currentUserId,
      role: currentUserRole,
      username: currentUser?.username,
      fullName: currentUser?.fullName
    });

    const { getUserStoreAndGroup } = require('../utils/userAccess');
    
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
        console.warn('⚠️ Could not get user store from database:', err);
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
      hasStore: !!userStoreId
    });

    // ================================================================
    // 🔥 STATUS FILTER
    // ================================================================
    console.log("\n📌 STATUS FILTER:");
    if (status !== "all") {
      where.status = status;
      console.log("✅ Status filter applied:", status);
    } else {
      console.log("ℹ️ No status filter (status = 'all')");
    }

    // ================================================================
    // 🔥 PERMISSION LOGIC
    // ================================================================
    console.log("\n" + "=".repeat(80));
    console.log("🔒 PERMISSION LOGIC START");
    console.log("=".repeat(80));
    
    // ✅ ADMIN: Can see everything
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
      
    // ✅ STORE USER (storekeeper / store_it)
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
        
        // ✅ CORRECT PERMISSION LOGIC
        
        // RULE 1: User is the ASKING store → Can see ALL statuses
        const askingStoreCondition = { askingStoreId: userStoreId };
        console.log(`\n📌 RULE 1 - Asking Store (ID: ${userStoreId}):`);
        console.log("  - Can see ALL statuses (pending, approved, finalized)");
        if (status !== "all") {
          askingStoreCondition.status = status;
          console.log("  - Status filter applied to asking condition:", status);
        }
        console.log("  - Condition:", JSON.stringify(askingStoreCondition));
        
        // RULE 2: User is the SUPPLYING store → Can ONLY see approved/finalized
        const supplyingStoreCondition = {
          supplyingStoreId: userStoreId,
          status: { [Op.in]: ['approved', 'finalized'] }
        };
        console.log(`\n📌 RULE 2 - Supplying Store (ID: ${userStoreId}):`);
        console.log("  - Can ONLY see approved/finalized");
        if (status !== "all" && ['approved', 'finalized'].includes(status)) {
          supplyingStoreCondition.status = status;
          console.log("  - Status filter applied to supplying condition:", status);
        }
        if (status === "pending") {
          console.log("  - ⚠️ Status filter is 'pending' - supplying condition will NOT match any requests!");
        }
        console.log("  - Condition:", JSON.stringify(supplyingStoreCondition));
        
        // Combine with OR
        where[Op.or] = [
          askingStoreCondition,
          supplyingStoreCondition
        ];
        
        console.log("\n📋 Combined WHERE clause with OR:");
        console.log(JSON.stringify(where, null, 2));
        
        // ✅ If a specific store filter is requested, apply it WITHIN the permission
        if (storeId !== "all" && parseInt(storeId) !== userStoreId) {
          console.log(`\n📌 Additional store filter applied (${storeId}):`);
          where[Op.and] = [
            {
              [Op.or]: [
                { askingStoreId: parseInt(storeId) },
                { supplyingStoreId: parseInt(storeId) },
              ]
            },
            {
              [Op.or]: [
                askingStoreCondition,
                supplyingStoreCondition
              ]
            }
          ];
          console.log("📋 Updated WHERE with AND + store filter:");
          console.log(JSON.stringify(where, null, 2));
        }
        
        console.log("\n📋 FINAL PERMISSION SUMMARY:");
        console.log("  - Asking Store:", userStoreId, "→ ALL statuses");
        console.log("  - Supplying Store:", userStoreId, "→ ONLY approved/finalized");
      }
      
    // ✅ CHECKER / FINANCE: Only see approved/finalized
    } else if (currentUserRole === "checker" || currentUserRole === "finance") {
      
      console.log("\n📊 CHECKER/FINANCE USER DETECTED:", currentUserRole);
      
      if (status === "all") {
        where.status = { [Op.in]: ['approved', 'finalized'] };
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
      
    // ✅ OTHER USERS: Only see requests they created
    } else {
      
      console.log("\n👤 OTHER USER ROLE DETECTED:", currentUserRole);
      
      if (currentUserId) {
        where.requestedById = currentUserId;
        console.log("  - Filtering by requestedById:", currentUserId);
      }
      console.log("📋 WHERE clause:", JSON.stringify(where, null, 2));
    }

    // ================================================================
    // 🔥 USER FILTER (overrides all other filters)
    // ================================================================
    console.log("\n" + "=".repeat(80));
    console.log("📌 USER FILTER CHECK:");
    if (userId !== "all") {
      where.requestedById = userId;
      console.log("✅ User filter applied - requestedById:", userId);
    } else {
      console.log("ℹ️ No user filter (userId = 'all')");
    }

    // ================================================================
    // 🔥 SEARCH FILTER
    // ================================================================
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

    // ================================================================
    // 🔥 FINAL WHERE CLAUSE
    // ================================================================
    console.log("\n" + "=".repeat(80));
    console.log("📋 FINAL WHERE CLAUSE:");
    console.log("=".repeat(80));
    console.log(JSON.stringify(where, null, 2));
    console.log("=".repeat(80));

    // ================================================================
    // 🔥 QUERY DATABASE
    // ================================================================
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
        },
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
            { model: User, as: "respondedByUser" },
          ],
        },
      ],
    });

    console.log(`\n📊 Query returned ${rows.length} requests`);

    // ================================================================
    // 🔥 LOG RETURNED REQUESTS
    // ================================================================
    console.log("\n" + "=".repeat(80));
    console.log("📋 RETURNED REQUESTS:");
    console.log("=".repeat(80));
    
    if (rows.length === 0) {
      console.log("ℹ️ No requests found");
    } else {
      rows.forEach((req, index) => {
        const request = req.toJSON ? req.toJSON() : req;
        console.log(`\n📌 Request ${index + 1}:`);
        console.log(`  - ID: ${request.requestId}`);
        console.log(`  - Code: ${request.requestCode}`);
        console.log(`  - Status: ${request.status}`);
        console.log(`  - Asking Store ID: ${request.askingStoreId}`);
        console.log(`  - Supplying Store ID: ${request.supplyingStoreId}`);
        console.log(`  - Requested By: ${request.requestedByUser?.username || 'Unknown'}`);
        console.log(`  - Created At: ${request.createdAt}`);
        
        // Check role visibility
        if (request.askingStoreId === userStoreId) {
          console.log(`  - ✅ User's store is ASKING → SHOWN (status: ${request.status})`);
        } else if (request.supplyingStoreId === userStoreId) {
          console.log(`  - ✅ User's store is SUPPLYING → SHOWN (status: ${request.status})`);
        }
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ GET REQUESTS COMPLETED");
    console.log("=".repeat(80));

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
              include: [{ model: UOM, as: "uom" }],
            },
          ],
        },
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
// 4. CREATE REQUEST - GROUP ONLY (NO DEPARTMENT)
// ================================================================
exports.createRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedDate,
      status = "pending",
      remark,
      isAsset = false,
    } = req.body;

    // ================================================================
    // 1. VALIDATE REQUIRED FIELDS
    // ================================================================
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

    // ================================================================
    // 2. VALIDATE STORES
    // ================================================================
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

    // ================================================================
    // 3. CHECK IF SKIP STORE (FOREIGN/LOCAL PURCHASE)
    // ================================================================
    const skipNotifications = shouldSkipNotifications(supplyingStore.code);
    if (skipNotifications) {
      console.log(
        `⚠️ Store ${supplyingStore.code} (${supplyingStore.name}) - Notifications will be skipped`,
      );
    }

    // ================================================================
    // 4. VALIDATE USER
    // ================================================================
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

    // ================================================================
    // 5. VALIDATE ITEMS
    // ================================================================
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

      // ✅ Get UOM info from the request (sent from frontend)
      const selectedUom = item.selectedUom || 'base';
      
      // ✅ Use the uomCode from the frontend, fallback to base UOM if not provided
      let uomCode = item.uomCode;
      
      // If uomCode is not provided or is empty, use the base UOM
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

    // ================================================================
    // 6. STOCK AVAILABILITY VALIDATION
    // ================================================================
    const stockValidation = await validateStockAvailability(
      supplyingStoreId,
      validatedItems,
    );

    if (
      !stockValidation.validationSkipped &&
      stockValidation.errors.length > 0
    ) {
      await t.rollback();

      return res.status(400).json({
        success: false,
        error: "Stock validation failed",
        errors: stockValidation.errors,
        stockInfo: stockValidation.stockInfo,
        summary: {
          totalItems: validatedItems.length,
          itemsWithStock: stockValidation.stockInfo.filter(
            (s) => s.availableQuantity > 0,
          ).length,
          itemsWithoutStock: stockValidation.errors.filter(
            (e) => e.availableQuantity === 0,
          ).length,
          itemsWithShortage: stockValidation.errors.filter(
            (e) => e.availableQuantity > 0 && e.shortage > 0,
          ).length,
          storeName: supplyingStore.name,
          storeId: supplyingStoreId,
          validationSkipped: false,
        },
      });
    }

    // ================================================================
    // 7. GENERATE REQUEST CODE
    // ================================================================
    const requestCode = await ItemRequest.generateRequestCode();

    // ================================================================
    // 8. CREATE THE REQUEST (with isAsset)
    // ================================================================
    const request = await ItemRequest.create(
      {
        requestCode,
        askingStoreId: parseInt(askingStoreId),
        supplyingStoreId: parseInt(supplyingStoreId),
        requestedById: requestedById || null,
        requestedDate: requestedDate || new Date().toISOString().split("T")[0],
        status: status || "pending",
        remark: remark || null,
        isAsset: isAsset || false,
      },
      { transaction: t },
    );

    // ================================================================
    // 9. CREATE ITEM DETAILS with UOM
    // ================================================================
    await Promise.all(
      validatedItems.map(async (item) => {
        return ItemRequestDetail.create(
          {
            requestId: request.requestId,
            itemId: item.itemId,
            quantity: item.quantity,
            remark: item.remark || null,
            // ✅ Save UOM fields from the validated item
            selected_uom: item.selectedUom || 'base',
            uom_code: item.uomCode || item.itemRecord?.uom?.code || 'Units',
            is_base_uom: item.isBaseUom !== false,
          },
          { transaction: t },
        );
      }),
    );

    // ================================================================
    // 10. CREATE NOTIFICATIONS - GROUPS + DEPARTMENT (if isAsset)
    // ================================================================
    let notificationCount = 0;

    if (!skipNotifications) {
      console.log(
        `📤 Creating notifications for request ${request.requestId}, isAsset: ${isAsset}`,
      );

      try {
        notificationCount = await createRequestNotifications(
          request.requestId,
          supplyingStoreId,
          askingStoreId,
          isAsset,
          t
        );
      } catch (notifError) {
        console.error("❌ Error creating notifications:", notifError);
      }
    } else {
      console.log(
        `⚠️ SKIPPED notifications for store: ${supplyingStore.code} (${supplyingStore.name}) - Foreign/Local Purchase`,
      );
    }

    // ================================================================
    // 11. COMMIT TRANSACTION
    // ================================================================
    await t.commit();

    // ================================================================
    // 12. FETCH COMPLETE REQUEST
    // ================================================================
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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

    // ================================================================
    // 13. PREPARE RESPONSE
    // ================================================================
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
      : isAsset
        ? `✅ Asset request created successfully. Notifications sent to groups and asset department.`
        : `✅ Request created successfully. Notifications sent to all groups.`;

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
        stockValidation: {
          allItemsAvailable:
            stockValidation.isValid || stockValidation.validationSkipped,
          validationSkipped: stockValidation.validationSkipped,
          skipReason: stockValidation.skipReason || null,
          items: stockInfoResponse,
          summary: {
            totalItems: validatedItems.length,
            allItemsAvailable:
              stockValidation.isValid || stockValidation.validationSkipped,
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
  try {
    const { id } = req.params;
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedDate,
      remark,
      isAsset,  // ✅ Read isAsset from request body
    } = req.body;

    console.log(`🔄 Updating request ${id} with data:`, req.body);

    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    if (request.status === "finalized") {
      return res.status(400).json({
        success: false,
        error: "Cannot edit finalized requests",
      });
    }

    // ✅ Update request with isAsset
    await request.update({
      askingStoreId: askingStoreId || request.askingStoreId,
      supplyingStoreId: supplyingStoreId || request.supplyingStoreId,
      requestedById:
        requestedById !== undefined ? requestedById : request.requestedById,
      requestedDate: requestedDate || request.requestedDate,
      status: "pending",
      remark: remark !== undefined ? remark : request.remark,
      isAsset: isAsset !== undefined ? isAsset : request.isAsset,  // ✅ Save isAsset
    });

    // ✅ Update items
   // ✅ Update items with UOM
if (items && items.length > 0) {
  await ItemRequestDetail.destroy({
    where: { requestId: id },
  });

  await Promise.all(
    items.map(async (item) => {
      // ✅ Get UOM info
      const selectedUom = item.selectedUom || 'base';
      const uomCode = item.uomCode || 'Units';
      const isBaseUom = item.isBaseUom !== false;

      return ItemRequestDetail.create({
        requestId: request.requestId,
        itemId: item.itemId,
        quantity: item.quantity,
        remark: item.remark || null,
        // ✅ Save UOM fields
        selected_uom: selectedUom,
        uom_code: uomCode,
        is_base_uom: isBaseUom,
      });
    }),
  );
}

    // ✅ Delete existing notifications
    console.log(`🗑️ Deleting existing notifications for request ${id}`);
    await RequestNotification.destroy({
      where: { request_id: id },
    });

    // ✅ Recreate notifications with updated isAsset
    const updatedIsAsset = isAsset !== undefined ? isAsset : request.isAsset;
    console.log(`📤 Creating new notifications for request ${id}, isAsset: ${updatedIsAsset}`);
    
    await createRequestNotifications(
      request.requestId,
      request.supplyingStoreId,
      request.askingStoreId,
      updatedIsAsset || false,  // ✅ Pass isAsset flag
      null
    );

    console.log(`✅ Request ${id} updated successfully`);

    // ✅ Fetch updated request
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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

    res.json({
      success: true,
      message: "Request updated successfully. New notifications sent.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("❌ Update request error:", error);
    res.status(500).json({
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
        error:
          "Invalid status. Must be one of: pending, approved, rejected, finalized",
      });
    }

    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
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
        error:
          "Cannot approve a rejected request. Edit the request to reset status to pending",
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
        error:
          "Invalid status. Must be one of: pending, approved, rejected, finalized",
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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

    if (request.status === "approved") {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete approved requests. Edit the request to reset status to pending first",
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
            { model: Department, as: "department" },  // ✅ ADD THIS
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
    const total = notifications.length;
    const accepted = notifications.filter(
      (n) => n.status === "accepted",
    ).length;
    const rejected = notifications.filter(
      (n) => n.status === "rejected",
    ).length;
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
  try {
    const { notificationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
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
      status: "accepted",
      responded_by: userId,
      responded_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Notification accepted successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error accepting notification:", error);
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
        {
          model: Store,
          as: "askingStore",
        },
        {
          model: Store,
          as: "supplyingStore",
        },
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
          data: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            finalized: 0
          }
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

    const pending = await ItemRequest.count({
      where: { ...where, status: 'pending' }
    });

    const approved = await ItemRequest.count({
      where: { ...where, status: 'approved' }
    });

    const rejected = await ItemRequest.count({
      where: { ...where, status: 'rejected' }
    });

    const finalized = await ItemRequest.count({
      where: { ...where, status: 'finalized' }
    });

    const statusBreakdown = await ItemRequest.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['status']
    });

    console.log('📊 Stats result:', {
      total,
      pending,
      approved,
      rejected,
      finalized,
      breakdown: statusBreakdown.map(s => ({
        status: s.status,
        count: parseInt(s.dataValues.count)
      }))
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        finalized,
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
// controllers/itemRequestController.js

// ================================================================
// 20. GET ACTIVE ITEMS (with search support)
// ================================================================
exports.getActiveItems = async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    
    const where = { status: "Active" };
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // ✅ Add search filter if provided
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
        "itemId",
        "code",
        "name",
        "standardName",
        "brand",
        "model",
        "uomId",
        "conversionUomId",
        "conversionValue",
        "specText",
      ],
      include: [
        {
          model: UOM,
          as: "uom",
          attributes: ["uomId", "code", "name"],
        },
        {
          model: UOM,
          as: "conversionUom",
          attributes: ["uomId", "code", "name"],
        },
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

    // 🔥 Verify the group belongs to the store
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

    // 🔥 Build where clause - GROUP NOTIFICATIONS ONLY
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
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    const summary = {
      total: totalCount,
      pending: await RequestNotification.count({
        where: { ...whereClause, status: "pending" },
      }),
      accepted: await RequestNotification.count({
        where: { ...whereClause, status: "accepted" },
      }),
      rejected: await RequestNotification.count({
        where: { ...whereClause, status: "rejected" },
      }),
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
// 22. GET DEPARTMENT NOTIFICATIONS - REMOVED
// ================================================================
// This endpoint has been removed as department validation is no longer used.

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

    // Get Department model
    const { Department } = db;

    // ✅ Verify department exists
    const department = await Department.findByPk(deptId);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found",
      });
    }

    // ✅ Build where clause - DEPARTMENT NOTIFICATIONS ONLY
    const whereClause = {
      department_id: deptId,
      approval_type: "department",
      is_department_approval: true,
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    // ✅ Get total count
    const totalCount = await RequestNotification.count({
      where: whereClause,
    });

    // ✅ Get paginated notifications
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

    // ✅ Get summary counts
    const summary = {
      total: totalCount,
      pending: await RequestNotification.count({
        where: { ...whereClause, status: "pending" },
      }),
      accepted: await RequestNotification.count({
        where: { ...whereClause, status: "accepted" },
      }),
      rejected: await RequestNotification.count({
        where: { ...whereClause, status: "rejected" },
      }),
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

    // ================================================================
    // ✅ FIX: For ADMIN or CHECKER, show ALL pending notifications
    // For other roles, filter by their store/group/department
    // ================================================================

    const isAdmin = userRole === 'admin' || userRole === 'Admin' || userRole === 'superadmin';
    const isChecker = userRole === 'checker' || userRole === 'Checker';

    // ✅ GROUP notifications: status = pending AND approval_type IS NULL OR 'group'
    let groupWhere = { 
      status: 'pending',
      [Op.or]: [
        { approval_type: 'group' },
        { approval_type: null }
      ]
    };

    // ✅ DEPARTMENT notifications: status = pending AND approval_type = 'department'
    let deptWhere = { 
      status: 'pending', 
      approval_type: 'department', 
      is_department_approval: true 
    };

    // ✅ ADMIN or CHECKER: Show ALL pending notifications (no filters)
    if (isAdmin || isChecker) {
      console.log(`👑 ${userRole} user - showing ALL pending notifications`);
    } else {
      // ✅ NON-ADMIN/NON-CHECKER: Filter by their assignments
    
      // Group notifications - if user has store & group
      if (userStoreId && userGroupId) {
        // Verify the group belongs to the store
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
          groupWhere.id = -1; // No results
        }
      } else {
        console.log('⚠️ No store/group found, skipping group notifications');
        groupWhere.id = -1; // No results
      }

      // Department notifications - if user has department
      if (departmentId) {
        deptWhere.department_id = parseInt(departmentId);
        console.log('✅ Department notifications will be fetched for department:', departmentId);
      } else {
        console.log('⚠️ No department found, skipping department notifications');
        deptWhere.id = -1; // No results
      }
    }

    // ================================================================
    // FETCH NOTIFICATIONS - SEPARATE QUERIES
    // ================================================================

    const limitVal = parseInt(limit) || 10;
    const offsetVal = ((parseInt(page) || 1) - 1) * limitVal;

    let groupNotifications = [];
    let deptNotifications = [];
    let groupTotal = 0;
    let deptTotal = 0;

    // ✅ Fetch GROUP notifications (approval_type = 'group' OR NULL)
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

    // ✅ Fetch DEPARTMENT notifications (approval_type = 'department')
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

    // ================================================================
    // COMBINE AND SORT - NO DUPLICATES
    // ================================================================

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

    // Sort by created_at (newest first)
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