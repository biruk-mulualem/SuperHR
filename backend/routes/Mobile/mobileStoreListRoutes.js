// routes/mobileStoreListRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

const c = require('../../controllers/Mobile/mobileStoreListController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware());

// ================================================================
// STORE LIST
// ================================================================
router.get('/summary', c.getStoreSummary);
router.get('/export', c.getStoreListExport);
router.get('/export.xlsx', c.exportStoreListXlsx);   // ← ADD THIS

// ================================================================
// STORE DETAIL
// ================================================================
router.get('/:storeId/detail', c.getStoreComparison);

module.exports = router;