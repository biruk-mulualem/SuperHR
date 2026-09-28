// routes/StoreDashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/storeDashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware());

// ================================================================
// 1. STOCK SUMMARY
// ================================================================
router.get('/stock-summary', dashboardController.getStockSummary);

// ================================================================
// 2. STOCK HEALTH
// ================================================================
router.get('/stock-health', dashboardController.getStockHealth);


// ================================================================
// 4. LOW STOCK ALERTS
// ================================================================
router.get('/low-stock-alerts', dashboardController.getLowStockAlerts);


// ================================================================
// 5. APPROVED REQUESTS (changed from pending-requests)
// ================================================================
router.get('/approved-requests', dashboardController.getApprovedRequests);
// ================================================================
// 6. RECENT TRANSACTIONS
// ================================================================
router.get('/recent-transactions', dashboardController.getRecentTransactions);

// ================================================================
// 7. HIGH MOVING ITEMS
// ================================================================
router.get('/high-moving-items', dashboardController.getHighMovingItems);

// ================================================================
// 8. LOW MOVING ITEMS
// ================================================================
router.get('/low-moving-items', dashboardController.getLowMovingItems);

// ================================================================
// 9. TRANSACTION STATISTICS
// ================================================================
router.get('/transaction-stats', dashboardController.getTransactionStats);

// ================================================================
// 10. FILTER OPTIONS
// ================================================================
router.get('/filter-options', dashboardController.getFilterOptions);

// ================================================================
// 11. EXPORT ALL DASHBOARD DATA
// ================================================================
router.get('/export', dashboardController.exportDashboard);

module.exports = router;