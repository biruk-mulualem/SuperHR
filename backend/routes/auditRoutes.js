// routes/auditRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const auditController = require('../controllers/auditController');

// All routes require authentication
router.use(authMiddleware());

// ============================================
// USER ACCESS
// ============================================
router.get('/user/access', auditController.getUserAuditAccess);

// ============================================
// STORE AUDIT
// ============================================
router.get('/store/:storeId', auditController.getStoreAudit);
router.get('/store/:storeId/summary', auditController.getAuditSummary);
router.get('/store/:storeId/dashboard', auditController.getAuditDashboard);
router.get('/store/:storeId/export', auditController.exportAuditData);
// Update item transaction dates
// ✅ CORRECT - Matches the service call
router.put('/items/:storeId/:itemId/dates', auditController.updateItemTransactionDates);
// ============================================
// STORES & CATEGORIES (for filters)
// ============================================
router.get('/stores', auditController.getStoresWithGroups);
router.get('/categories', auditController.getCategories);

// ============================================
// GROUP COMPARISON
// ============================================
router.get('/store/:storeId/groups/compare', auditController.getGroupComparison);
router.get('/store/:storeId/group/:groupId/snapshot', auditController.getBalanceSnapshot);

// ============================================
// ITEM TRANSACTIONS
// ============================================
router.get('/store/:storeId/item/:itemId/transactions', auditController.getItemTransactions);

module.exports = router;