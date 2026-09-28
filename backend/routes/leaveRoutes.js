// routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================================================
// PROTECTED ROUTES - All routes require authentication
// ============================================================================
router.use(authMiddleware());

// ============================================================================
// LEAVE TYPES - MUST COME FIRST (before /:id routes)
// ============================================================================

// Get all leave types - ADD 'attendance' role
router.get('/types', 
  authMiddleware('admin', 'hr', 'employee', 'attendance'),  // ← ADD 'attendance'
  leaveController.getLeaveTypes
);

// Get leave type by ID - ADD 'attendance' role
router.get('/types/:id', 
  authMiddleware('admin', 'hr', 'employee', 'attendance'),  // ← ADD 'attendance'
  leaveController.getLeaveTypeById
);

// Create leave type (Admin only)
router.post('/types', 
  authMiddleware('admin'), 
  leaveController.createLeaveType
);

// Update leave type (Admin only)
router.put('/types/:id', 
  authMiddleware('admin'), 
  leaveController.updateLeaveType
);

// Delete leave type (Admin only)
router.delete('/types/:id', 
  authMiddleware('admin'), 
  leaveController.deleteLeaveType
);

// ============================================================================
// LEAVE REQUESTS - CRUD Operations
// ============================================================================

// ✅ FIX THIS ONE - Get all leave requests with filters

router.get('/', 
  authMiddleware('admin', 'hr','attendance'),
  leaveController.getAllLeaveRequests
);

// Get leave request by ID - ADD 'attendance' role
router.get('/:id', 
  authMiddleware('admin', 'hr', 'employee', 'attendance'), 
  leaveController.getLeaveRequestById
);

// Create new leave request
router.post('/', 
  authMiddleware('admin', 'hr', 'employee'), 
  leaveController.createLeaveRequest
);

// Update leave request - Admin/HR only
router.put('/:id', 
  authMiddleware('admin', 'hr'), 
  leaveController.updateLeaveRequest
);

// Approve leave request - Admin/HR only
router.put('/:id/approve', 
  authMiddleware('admin', 'hr'), 
  leaveController.approveLeaveRequest
);

// Reject leave request - Admin/HR only
router.put('/:id/reject', 
  authMiddleware('admin', 'hr'), 
  leaveController.rejectLeaveRequest
);

// Cancel leave request
router.put('/:id/cancel', 
  authMiddleware('admin', 'hr', 'employee'), 
  leaveController.cancelLeaveRequest
);

// Delete leave request - Admin/HR only
router.delete('/:id', 
  authMiddleware('admin', 'hr'), 
  leaveController.deleteLeaveRequest
);

// ============================================================================
// LEAVE EXTENSIONS
// ============================================================================

router.post('/:id/extensions', 
  authMiddleware('admin', 'hr', 'employee'), 
  leaveController.requestExtension
);

router.put('/extensions/:extensionId/approve', 
  authMiddleware('admin', 'hr'), 
  leaveController.approveExtension
);

router.put('/extensions/:extensionId/reject', 
  authMiddleware('admin', 'hr'), 
  leaveController.rejectExtension
);

// ============================================================================
// RETURN TRACKING
// ============================================================================

// Confirm employee return - ADD 'attendance' role
router.put('/:id/return', 
  authMiddleware('admin', 'hr', 'attendance'),  // ← ADD 'attendance'
  leaveController.confirmReturn
);

// Get overdue returns - ADD 'attendance' role
router.get('/overdue/returns', 
  authMiddleware('admin', 'hr', 'attendance'),  // ← ADD 'attendance'
  leaveController.getOverdueReturns
);

// Year-end processing (Admin only)
router.post('/year-end/process', 
  authMiddleware('admin'), 
  leaveController.runYearEndProcessing
);

// ============================================================================
// LEAVE BALANCES
// ============================================================================

// Get employee leave balance - ADD 'attendance' role
router.get('/balance/:employeeId', 
  authMiddleware('admin', 'hr', 'attendance', 'employee'),  // ← ADD 'attendance'
  leaveController.getEmployeeBalance
);

// Get current year balance for logged-in employee
router.get('/balance/me/current', 
  authMiddleware('employee'), 
  leaveController.getMyCurrentBalance
);

// ============================================================================
// STATISTICS & REPORTS
// ============================================================================

// Get dashboard statistics - ADD 'attendance' role
router.get('/stats/summary', 
  authMiddleware('admin', 'hr', 'attendance'),  // ← ADD 'attendance'
  leaveController.getDashboardStats
);

// Get department-wise statistics - Admin/HR only
router.get('/stats/department', 
  authMiddleware('admin', 'hr'), 
  leaveController.getDepartmentStats
);

// Get calendar data - ADD 'attendance' role
router.get('/calendar/:year/:month', 
  authMiddleware('admin', 'hr', 'attendance'),  // ← ADD 'attendance'
  leaveController.getCalendarData
);

// Export to CSV - Admin/HR only
router.get('/export/csv', 
  authMiddleware('admin', 'hr'), 
  leaveController.exportToCSV
);

module.exports = router;