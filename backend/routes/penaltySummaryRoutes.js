// routes/penaltySummaryRoutes.js
const express = require('express');
const router = express.Router();
const penaltySummaryController = require('../controllers/penaltySummaryController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== PENALTY SUMMARY ROUTES ====================

// Get penalty summary with date range filtering
router.get('/summary', penaltySummaryController.getPenaltySummary);

// Get single penalty summary by ID
router.get('/summary/:summaryId', penaltySummaryController.getPenaltySummaryById);

// Create a new penalty summary
router.post('/summary', penaltySummaryController.createPenaltySummary);

// Apply single penalty reduction - CHANGED to use employeeId
// POST /api/penalty-summary/reduce/employee/:employeeId
router.post('/reduce/employee/:employeeId', penaltySummaryController.applyPenaltyReduction);

// Apply batch penalty reduction
router.post('/batch-reduce', penaltySummaryController.applyBatchPenaltyReduction);

// Get deduction history/report
router.get('/deductions', penaltySummaryController.getDeductionReport);

// Get deductions for a specific employee
router.get('/employees/:employeeId/deductions', penaltySummaryController.getEmployeeDeductions);

// Get penalty summary for a specific employee
router.get('/employees/:employeeId/summary', penaltySummaryController.getEmployeePenaltySummary);

// Get penalty reduction rules
router.get('/rules', penaltySummaryController.getReductionRules);

// Save penalty reduction rules
router.post('/rules', penaltySummaryController.saveReductionRules);

// Export penalty summary
router.get('/export', penaltySummaryController.exportPenaltySummary);

// Get penalty statistics
router.get('/statistics', penaltySummaryController.getPenaltyStatistics);


// Add these routes to your penaltySummaryRoutes.js

// Update a reduction
router.put('/reduction/:employeeId/:reductionId', 
  
  penaltySummaryController.updateReduction
);

// Delete a reduction
router.delete('/reduction/:employeeId/:reductionId', 
  
  penaltySummaryController.deleteReduction
);

// Get reduction history for an employee
router.get('/reductions/:employeeId', 
  
  penaltySummaryController.getReductionHistory
);
module.exports = router;