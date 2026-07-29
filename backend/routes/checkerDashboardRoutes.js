// routes/checkerDashboardRoutes.js
const express = require('express');
const router = express.Router();
const checkerDashboardController = require('../controllers/checkerdashboardController');
const { authMiddleware } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware());

// Dashboard routes - note the simplified path
router.get('/summary', checkerDashboardController.getDashboardSummary);
router.get('/store-conflicts', checkerDashboardController.getStoreConflictData);
router.get('/top-issues', checkerDashboardController.getTopIssues);
router.get('/stats', checkerDashboardController.getDashboardStats);
router.get('/recent-activity', checkerDashboardController.getRecentActivity);
router.get('/low-stock', checkerDashboardController.getLowStockAlerts);
router.get('/store-summary', checkerDashboardController.getStoreSummary);
router.post('/refresh', checkerDashboardController.refreshDashboard);

module.exports = router;