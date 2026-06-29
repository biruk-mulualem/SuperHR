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

    balanceController.getBalances
);

// Get balance statistics
router.get(
    '/stats',

    balanceController.getStats
);

// Get low stock items
router.get(
    '/low-stock',
    balanceController.getLowStockItems
);

// Download CSV template
router.get(
    '/template/download',
    balanceController.downloadTemplate
);

// Export balances
router.get(
    '/export',
    balanceController.exportBalances
);


// In your routes file (e.g., routes/balanceRoutes.js)

// ============================================
// REQUEST GROUP PROCESSING ROUTES
// ============================================
router.get('/requests/:requestId/group-status', balanceController.getRequestGroupStatus);
router.post('/requests/:requestId/process-group', balanceController.processRequestForGroup);
router.get('/requests/processing-status', balanceController.getAllRequestProcessingStatus);
router.post('/requests/:requestId/skip-group', balanceController.skipGroupProcessing);

// ============================================
// 2. STORE ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/stores',
    balanceController.getStores
);

router.get(
    '/stores/:id',
    balanceController.getStoreById
);

// ============================================
// 3. GROUP ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/groups',
    balanceController.getGroups
);

router.get(
    '/groups/:id',
    balanceController.getGroupById
);

// ============================================
// 4. ITEM ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/items',
    balanceController.getItems
);

router.get(
    '/items/active',
    balanceController.getActiveItems
);

router.get(
    '/items/:id',
    balanceController.getItemById
);

// ============================================
// 5. USER ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/users',
    balanceController.getUsers
);

router.get(
    '/users/:id',
    balanceController.getUserById
);

// ============================================
// 6. SUMMARY ROUTES (BEFORE /:id)
// ============================================
router.get(
    '/summary/by-store',
    balanceController.getSummaryByStore
);

router.get(
    '/summary/by-group',
    balanceController.getSummaryByGroup
);

router.get(
    '/summary/by-item',
    balanceController.getSummaryByItem
);

// ============================================
// 7. APPROVED REQUESTS (BEFORE /:id)
// ============================================
router.get(
    '/requests/approved/:storeId',
    balanceController.getApprovedRequests
);

router.post(
    '/requests/process',
    balanceController.processRequests
);

// ============================================
//  STORE-GROUP RELATIONS (MUST COME BEFORE /:id)
// ============================================
router.get(
    '/store-group-relations',
    balanceController.getStoreGroupRelations  // No auth middleware
);


// balanceRoutes.js - Add this route at the TOP

// ============================================
// USER ACCESS ROUTE - MUST BE FIRST!
// ============================================
router.get(
    '/user/store-group',
    authMiddleware,
    balanceController.getUserStoreAndGroupAccess
); 

// ============================================
// 8. WILDCARD /:id ROUTES - MUST BE LAST!
// ============================================
router.get(
    '/:id',
    balanceController.getBalanceById
);

router.get(
    '/:id/history',
    balanceController.getBalanceHistory
);

// ============================================
// 9. CREATE/UPDATE/DELETE ROUTES
// ============================================
router.post(
    '/',
    balanceController.createBalance
);

router.post(
    '/import',
    uploadSingleBalance,
    balanceController.importBalances
);

router.put(
    '/:id',
    balanceController.updateBalance
);

router.patch(
    '/:id/toggle-status',
    balanceController.toggleStatus
);

router.delete(
    '/:id',
    balanceController.deleteBalance
);



module.exports = router;