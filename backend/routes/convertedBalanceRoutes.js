// routes/convertedBalanceRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const ConvertedBalanceController = require('../controllers/convertedBalanceController');
const { authMiddleware } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware());

// ================================================================
// CONVERTED BALANCE ROUTES
// ================================================================
router.post('/', ConvertedBalanceController.create);  // ✅ Add this
// GET /api/converted-balances
router.get('/', ConvertedBalanceController.getAll);

// GET /api/converted-balances/available
router.get('/available', ConvertedBalanceController.getAvailableForConversion);

// GET /api/converted-balances/stats
router.get('/stats', ConvertedBalanceController.getStats);

// POST /api/converted-balances/preview
router.post('/preview', ConvertedBalanceController.previewConversion);

// POST /api/converted-balances/convert
router.post('/convert', ConvertedBalanceController.convert);

// GET /api/converted-balances/:id
router.get('/:id', ConvertedBalanceController.getById);

// DELETE /api/converted-balances/:id
router.delete('/:id', ConvertedBalanceController.delete);

module.exports = router;