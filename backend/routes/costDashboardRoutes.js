// routes/costDashboardRoutes.js
const express = require('express');
const router = express.Router();
const costDashboardController = require('../controllers/costDashboardController');
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware());

// Dashboard data endpoints
router.get('/cost-summary', costDashboardController.getCostSummary);
router.get('/cost-by-store', costDashboardController.getCostByStore);
router.get('/top-cost-items', costDashboardController.getTopCostItems);
router.get('/zero-cost-items', costDashboardController.getZeroCostItems);


// routes/costDashboardRoutes.js

// Export routes
router.get('/export/cost-by-store', costDashboardController.exportCostByStore);
router.get('/export/top-cost-items', costDashboardController.exportTopCostItems);
router.get('/export/zero-cost-items', costDashboardController.exportZeroCostItems);

// Cache management
router.post('/clear-cache', costDashboardController.clearCache);

module.exports = router;