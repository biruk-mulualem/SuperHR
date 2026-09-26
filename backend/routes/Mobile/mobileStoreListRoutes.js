// routes/mobileStoreListRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

const c = require('../../controllers/Mobile/mobileStoreListController');
const { authMiddleware } = require('../../middleware/authMiddleware');

// Apply auth to every route in this file
router.use(authMiddleware());

// Store list summary
// GET /api/mobile/store-list/summary
router.get('/summary', c.getStoreSummary);

module.exports = router;