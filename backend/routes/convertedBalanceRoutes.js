// routes/convertedBalanceRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const ConvertedBalanceController = require('../controllers/convertedBalanceController');
const { authMiddleware } = require("../middleware/authMiddleware");

// ================================================================
// All routes require authentication
// ================================================================
router.use(authMiddleware());

// ================================================================
// CONVERTED BALANCE ROUTES
// ================================================================

// ✅ STOCK IN - Add stock to converted balance (creates if not exists)
// POST /api/converted-balances/stock-in
router.post('/stock-in', ConvertedBalanceController.stockIn);

// ✅ STOCK OUT - Remove stock from converted balance
// POST /api/converted-balances/stock-out
router.post('/stock-out', ConvertedBalanceController.stockOut);

// PERFORM CONVERSION - Reduces base balance, increases converted balance
// POST /api/converted-balances/convert
router.post('/convert', ConvertedBalanceController.convert);

// PREVIEW CONVERSION (Dry Run)
// POST /api/converted-balances/preview
router.post('/preview', ConvertedBalanceController.previewConversion);

// GET ALL CONVERTED BALANCES (with filters)
// GET /api/converted-balances
router.get('/', ConvertedBalanceController.getAll);

// GET AVAILABLE ITEMS FOR CONVERSION
// GET /api/converted-balances/available
router.get('/available', ConvertedBalanceController.getAvailableForConversion);

// GET STATISTICS
// GET /api/converted-balances/stats
router.get('/stats', ConvertedBalanceController.getStats);

// GET SINGLE CONVERTED BALANCE BY ID
// GET /api/converted-balances/:id
router.get('/:id', ConvertedBalanceController.getById);

// DELETE CONVERTED BALANCE
// DELETE /api/converted-balances/:id
router.delete('/:id', ConvertedBalanceController.delete);

module.exports = router;