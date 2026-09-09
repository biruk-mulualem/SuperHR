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


// Get converted balance audit for a store
router.get('/converted/store/:storeId', auditController.getConvertedAudit);

// Get converted balance transactions for a group
router.get('/converted/store/:storeId/group/:groupId/transactions', auditController.getConvertedGroupTransactions);

// Get converted balance transactions for an item
router.get('/converted/store/:storeId/item/:itemId/transactions', auditController.getConvertedItemTransactions);

// Export converted audit data
router.get('/converted/store/:storeId/export', auditController.exportConvertedAudit);



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