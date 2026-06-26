// balanceRoutes.js - CORRECTED ORDER
const express = require("express");
const router = express.Router();
const balanceController = require("../controllers/balanceController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadSingleBalance } = require("../middleware/uploadMiddleware");

// ============================================
// STORE BALANCE SYSTEM ROUTES
// ============================================

// ============================================
// 1. SPECIFIC ROUTES FIRST (NO PARAMETERS OR NAMED PARAMS)
// ============================================

// Get all balances with filters and pagination
router.get(
    '/',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getBalances
);

// Get balance statistics
router.get(
    '/stats',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getStats
);

// Get low stock items
router.get(
    '/low-stock',
    authMiddleware('admin', 'storekeeper', 'auditor'),
    balanceController.getLowStockItems
);

// Download CSV template
router.get(
    '/template/download',
    authMiddleware('admin', 'storekeeper'),
    balanceController.downloadTemplate
);

// Export balances
router.get(
    '/export',
    authMiddleware('admin', 'storekeeper', 'auditor'),
    balanceController.exportBalances
);

// ============================================
// 2. STORE ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/stores',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getStores
);

router.get(
    '/stores/:id',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getStoreById
);

// ============================================
// 3. GROUP ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/groups',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getGroups
);

router.get(
    '/groups/:id',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getGroupById
);

// ============================================
// 4. ITEM ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/items',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getItems
);

router.get(
    '/items/active',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getActiveItems
);

router.get(
    '/items/:id',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getItemById
);

// ============================================
// 5. USER ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/users',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getUsers
);

router.get(
    '/users/:id',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getUserById
);

// ============================================
// 6. SUMMARY ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/summary/by-store',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getSummaryByStore
);

router.get(
    '/summary/by-group',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getSummaryByGroup
);

router.get(
    '/summary/by-item',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getSummaryByItem
);

// ============================================
// 7. APPROVED REQUESTS (BEFORE /:id)
// ============================================
router.get(
    '/requests/approved/:storeId',
    authMiddleware('admin', 'storekeeper', 'auditor'),
    balanceController.getApprovedRequests
);

router.post(
    '/requests/process',
    authMiddleware('admin', 'storekeeper', 'auditor'),
    balanceController.processRequests
);

// ============================================
// 8. WILDCARD /:id ROUTES - MUST BE LAST!
// ============================================
router.get(
    '/:id',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getBalanceById
);

router.get(
    '/:id/history',
    authMiddleware('admin', 'storekeeper', 'auditor'),
    balanceController.getBalanceHistory
);

// ============================================
// 9. CREATE/UPDATE/DELETE ROUTES
// ============================================
router.post(
    '/',
    authMiddleware('admin', 'storekeeper'),
    balanceController.createBalance
);

router.post(
    '/import',
    authMiddleware('admin', 'storekeeper'),
    uploadSingleBalance,
    balanceController.importBalances
);

router.put(
    '/:id',
    authMiddleware('admin', 'storekeeper'),
    balanceController.updateBalance
);

router.patch(
    '/:id/toggle-status',
    authMiddleware('admin', 'storekeeper'),
    balanceController.toggleStatus
);

router.delete(
    '/:id',
    authMiddleware('admin'),
    balanceController.deleteBalance
);

// Get store-group relations
router.get(
    '/store-group-relations',
    authMiddleware('admin', 'storekeeper', 'auditor', 'manager'),
    balanceController.getStoreGroupRelations
);

module.exports = router;