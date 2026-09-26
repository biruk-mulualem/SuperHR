// routes/mobileManagerDashboardRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const mobileManagerDashboardController = require('../../controllers/Mobile/mobileManagerDashboardController');
const { authMiddleware } = require('../../middleware/authMiddleware');

// GET /api/mobile/manager-dashboard/purchase-summary
router.get(
  '/purchase-summary',
  authMiddleware(),               // 👈 no role restriction here; controller decides
  mobileManagerDashboardController.getPurchaseSummary
);

// GET /api/mobile/manager-dashboard
router.get(
  '/',
  authMiddleware(),
  mobileManagerDashboardController.getDashboard
);

module.exports = router;