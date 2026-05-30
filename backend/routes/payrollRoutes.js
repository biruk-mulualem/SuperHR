// routes/payrollRoutes.js
const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== PAYROLL ROUTES ====================
// 1. Get payroll data (for displaying the payroll page)
router.get('/', payrollController.getPayrollData);




module.exports = router;