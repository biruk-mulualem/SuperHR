// routes/stockCardRoutes.js

'use strict';

const express = require('express');
const router = express.Router();
const stockCardController = require('../controllers/stockCardController');
const { authMiddleware } = require('../middleware/authMiddleware');
// All routes require authentication
router.use(authMiddleware());

// Get stock card for an item
router.get(
  '/:itemId',
  authMiddleware(),
  stockCardController.getStockCard
);

// Get stock card with SQL optimization
router.get(
  '/:itemId/optimized',
 authMiddleware(),
  stockCardController.getStockCardOptimized
);

// Get stock card summary (dashboard widget)
router.get(
  '/summary',
  authMiddleware(),
  stockCardController.getStockCardSummary
);

module.exports = router;