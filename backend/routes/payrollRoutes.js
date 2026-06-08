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
router.get('/stats', payrollController.getStats);

// ==================== PAYROLL PROCESSING ====================
router.post('/process', payrollController.processPayroll);
router.get('/processing/check/:monthYear', payrollController.checkMonthProcessed);
router.get('/processing/months', payrollController.getProcessedMonths);
router.get('/employees/active', payrollController.getActiveEmployees);

// ==================== PAYMENT HISTORY ROUTES ====================
// Make sure these match what the frontend expects
router.get('/payment-history', payrollController.getPaymentHistory);
router.get('/payment-history/:id', payrollController.getPaymentHistoryDetail);

// ==================== UNCLAIMED PAYROLL ROUTES ====================
router.get('/unclaimed-payroll', payrollController.getUnclaimedPayroll);
router.post('/unclaimed-pay/:id', payrollController.payUnclaimedSalary);  
router.post('/unclaimed-return/:id', payrollController.returnUnclaimed);  
router.post('/unclaimed-bulk-return', payrollController.bulkReturnUnclaimed); 


// ==================== RETURNED PAYROLL ROUTES ====================
router.get('/returned-payroll', payrollController.getReturnedPayroll);
router.get('/returned-payroll/summary', payrollController.getReturnedPayrollSummary);
router.get('/returned-payroll/:id', payrollController.getReturnedPayrollById);
router.post('/returned-payroll/:id/pay', payrollController.payReturnedPayroll);
router.put('/returned-payroll/:id/reason', payrollController.updateReturnReason);
router.delete('/returned-payroll/:id', payrollController.deleteReturnedRecord);

module.exports = router;