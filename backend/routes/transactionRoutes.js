// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ================================================================
// TRANSACTION ROUTES
// ================================================================

// Get all transactions with filters and pagination
router.get(
  '/',
  
  transactionController.getTransactions
);

// Get transaction statistics
router.get(
  '/stats',

  transactionController.getTransactionStats
);

// Get recent transactions (for dashboard)
router.get(
  '/recent',

  transactionController.getRecentTransactions
);

// Export transactions as CSV
router.get(
  '/export',
 
  transactionController.exportTransactions
);

// Get transactions by balance ID
router.get(
  '/balance/:balanceId',

  transactionController.getTransactionsByBalance
);

// Get transaction by ID
router.get(
  '/:id',
 
  transactionController.getTransactionById
);

module.exports = router;