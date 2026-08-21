// balanceRoutes.js - COMPLETE WITH CATEGORY ROUTES & AUTH
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
    authMiddleware(),
    balanceController.getBalances
);

// Correct balance - requires authentication
router.post('/correct', 
    authMiddleware(),
    balanceController.correctBalance
);

// Get balance statistics
router.get(
    '/stats',
    authMiddleware(),
    balanceController.getStats
);

// Get low stock items
router.get(
    '/low-stock',
    authMiddleware(),
    balanceController.getLowStockItems
);

// Download CSV template - public (or add auth if needed)
router.get(
    '/template/download',
    authMiddleware(),
    balanceController.downloadTemplate
);

// Export balances - requires authentication
router.get(
    '/export',
    authMiddleware(),
    balanceController.exportBalances
);

// ============================================
// ✅ CATEGORY ROUTES
// ============================================

// Get all categories
router.get(
    '/categories',
    authMiddleware(),
    balanceController.getCategories
);

// Get active categories (for dropdowns)
router.get(
    '/categories/active',
    authMiddleware(),
    balanceController.getActiveCategories
);

// Get category by ID
router.get(
    '/categories/:id',
    authMiddleware(),
    balanceController.getCategoryById
);

// Get items by category
router.get(
    '/categories/:id/items',
    authMiddleware(),
    balanceController.getItemsByCategory
);

// ============================================
// REQUEST GROUP PROCESSING ROUTES
// ============================================
router.get(
    '/requests/:requestId/group-status',
    authMiddleware(),
    balanceController.getRequestGroupStatus
);

router.post(
    '/requests/:requestId/process-group',
    authMiddleware(),
    balanceController.processRequestForGroup
);

router.get(
    '/requests/processing-status',
    authMiddleware(),
    balanceController.getAllRequestProcessingStatus
);

router.post(
    '/requests/:requestId/skip-group',
    authMiddleware(), // ✅ Admin only
    balanceController.skipGroupProcessing
);

// ============================================
// 2. STORE ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/stores',
    authMiddleware(),
    balanceController.getStores
);

router.get(
    '/stores/:id',
    authMiddleware(),
    balanceController.getStoreById
);

// ============================================
// 3. GROUP ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/groups',
    authMiddleware(),
    balanceController.getGroups
);

router.get(
    '/groups/:id',
    authMiddleware(),
    balanceController.getGroupById
);

// ============================================
// 4. ITEM ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/items',
    authMiddleware(),
    balanceController.getItems
);

router.get(
    '/items/active',
    authMiddleware(),
    balanceController.getActiveItems
);

router.get(
    '/items/:id',
    authMiddleware(),
    balanceController.getItemById
);

// ============================================
// 5. USER ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/users',
    authMiddleware(), // ✅ Admin only - user management
    balanceController.getUsers
);

router.get(
    '/users/:id',
    authMiddleware(),
    balanceController.getUserById
);

// ============================================
// 6. SUMMARY ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/summary/by-store',
    authMiddleware(),
    balanceController.getSummaryByStore
);

router.get(
    '/summary/by-group',
    authMiddleware(),
    balanceController.getSummaryByGroup
);

router.get(
    '/summary/by-item',
    authMiddleware(),
    balanceController.getSummaryByItem
);

// ============================================
// 7. APPROVED REQUESTS (BEFORE /:id)
// ============================================
router.get(
    '/requests/approved/:storeId',
    authMiddleware(),
    balanceController.getApprovedRequests
);

router.post(
    '/requests/process',
    authMiddleware(),
    balanceController.processRequests
);

// ============================================
// STORE-GROUP RELATIONS (MUST COME BEFORE /:id)
// ============================================
router.get(
    '/store-group-relations',
    authMiddleware(),
    balanceController.getStoreGroupRelations
);

// ============================================
// USER ACCESS ROUTE
// ============================================
router.get(
    '/user/store-group',
    authMiddleware(),
    balanceController.getUserStoreAndGroupAccess
);

// ============================================
// DEBUG ROUTE
// ============================================
router.get(
    '/requests/debug/:requestId',
    authMiddleware(), // ✅ Admin only - debug
    balanceController.debugRequestProcessing
);

// ============================================
// 8. WILDCARD /:id ROUTES - MUST BE LAST!
// ============================================
router.get(
    '/:id',
    authMiddleware(),
    balanceController.getBalanceById
);

router.get(
    '/:id/history',
    authMiddleware(),
    balanceController.getBalanceHistory
);

// ============================================
// 9. CREATE/UPDATE/DELETE ROUTES
// ============================================
router.post(
    '/',
    authMiddleware(),
    balanceController.createBalance
);

router.post(
    '/import',
    authMiddleware(),
    uploadSingleBalance,
    balanceController.importBalances
);

router.put(
    '/:id',
    authMiddleware(),
    balanceController.updateBalance
);

router.patch(
    '/:id/toggle-status',
    authMiddleware(),
    balanceController.toggleStatus
);

router.delete(
    '/:id',
    authMiddleware(),
    balanceController.deleteBalance
);

module.exports = router;