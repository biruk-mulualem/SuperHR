// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================
// None for attendance - all attendance routes require authentication

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================

// =============================================
// 1. EFFECTIVE SCHEDULE
// =============================================
router.get(
  '/schedule/:employeeId', 
  authMiddleware(), 
  attendanceController.getEffectiveSchedule
);

// =============================================
// 2. COMPANY SHIFT DEFAULTS (Admin only)
// =============================================
router.get(
  '/company-defaults',
  authMiddleware('admin'),
  attendanceController.getCompanyDefaults
);
router.get(
  '/company-defaults/:id',
  authMiddleware('admin'),
  attendanceController.getCompanyDefaultById
);
router.post(
  '/company-defaults',
  authMiddleware('admin'),
  attendanceController.createCompanyDefault
);
router.put(
  '/company-defaults/:id',
  authMiddleware('admin'),
  attendanceController.updateCompanyDefault
);
router.delete(
  '/company-defaults/:id',
  authMiddleware('admin'),
  attendanceController.deleteCompanyDefault
);


router.get('/lunch-history', authMiddleware(), attendanceController.getLunchHistory);
// Add this route after your lunch-history route
router.get('/dinner-history', authMiddleware(), attendanceController.getDinnerHistory);
// =============================================
// 3. DEPARTMENT OVERRIDES (Admin/HR only)
// =============================================
router.get(
  '/department-overrides',
  authMiddleware(),
  attendanceController.getDepartmentOverrides
);
router.get(
  '/department-overrides/:id',
  authMiddleware(),
  attendanceController.getDepartmentOverrideById
);
router.post(
  '/department-overrides',
  authMiddleware('admin'),
  attendanceController.createDepartmentOverride
);
router.put(
  '/department-overrides/:id',
  authMiddleware('admin'),
  attendanceController.updateDepartmentOverride
);
router.delete(
  '/department-overrides/:id',
  authMiddleware('admin'),
  attendanceController.deleteDepartmentOverride
);

// =============================================
// 4. EMPLOYEE OVERRIDES (Admin/HR only)
// =============================================
router.get(
  '/employee-overrides',
  authMiddleware(),
  attendanceController.getEmployeeOverrides
);
router.get(
  '/employee-overrides/:id',
  authMiddleware(),
  attendanceController.getEmployeeOverrideById
);
router.post(
  '/employee-overrides',
  authMiddleware('admin'),
  attendanceController.createEmployeeOverride
);
router.put(
  '/employee-overrides/:id',
  authMiddleware('admin'),
  attendanceController.updateEmployeeOverride
);
router.delete(
  '/employee-overrides/:id',
  authMiddleware('admin'),
  attendanceController.deleteEmployeeOverride
);

// =============================================
// 5. BREAK TICKETS (Lunch/Dinner Tracking)
// =============================================
router.post(
  '/breaks/issue', 
  authMiddleware(), 
  attendanceController.issueBreakTicket
);
router.put(
  '/breaks/:ticketId/return', 
  authMiddleware(), 
  attendanceController.returnFromBreak
);
router.get(
  '/breaks/active', 
  authMiddleware(), 
  attendanceController.getActiveBreaks
);
router.get(
  '/breaks/history/:employeeId',
  authMiddleware(),
  attendanceController.getBreakHistory
);

// =============================================
// 6. ATTENDANCE LOGS (Check-in/out)
// =============================================
router.post(
  '/attendance/:employeeId/check-in', 
  authMiddleware(), 
  attendanceController.recordCheckIn
);
router.put(
  '/attendance/:employeeId/check-out', 
  authMiddleware(), 
  attendanceController.recordCheckOut
);
router.get(
  '/attendance/:employeeId/report', 
  authMiddleware(), 
  attendanceController.getAttendanceReport
);
router.get(
  '/attendance/me/report', 
  authMiddleware(), 
  attendanceController.getMyAttendance
);
router.get(
  '/attendance/summary/:employeeId',
  authMiddleware(),
  attendanceController.getAttendanceSummary
);

// =============================================
// 7. OVERTIME
// =============================================
router.get(
  '/overtime/:employeeId/calculate', 
  authMiddleware(), 
  attendanceController.calculateOvertime
);
router.get(
  '/overtime/rates',
  authMiddleware(),
  attendanceController.getOvertimeRates
);
router.post(
  '/overtime/rates',
  authMiddleware('admin'),
  attendanceController.createOvertimeRate
);
router.put(
  '/overtime/rates/:id',
  authMiddleware('admin'),
  attendanceController.updateOvertimeRate
);
router.delete(
  '/overtime/rates/:id',
  authMiddleware('admin'),
  attendanceController.deleteOvertimeRate
);

router.put(
  '/field-work/:id',
  authMiddleware('admin'),
  attendanceController.updateFieldWork
);

// Get all field work assignments (Admin only)
router.get(
  '/field-work/all',
  authMiddleware('admin'),
  attendanceController.getAllFieldWork
);




// =============================================
// 8. FIELD WORK
// =============================================
router.post(
  '/field-work', 
  authMiddleware(), 
  attendanceController.registerFieldWork
);

router.put(
  '/field-work/:assignmentId/complete', 
  authMiddleware(), 
  attendanceController.completeFieldWork
);

router.get(
  '/field-work/:employeeId/active', 
  authMiddleware(), 
  attendanceController.getActiveFieldWork
);

router.get(
  '/field-work/history/:employeeId',
  authMiddleware(),
  attendanceController.getFieldWorkHistory
);


router.delete(
  '/field-work/:id',
  authMiddleware('admin'),
  attendanceController.deleteFieldWork
);

// Get all field work assignments (Admin only)
router.get(
  '/field-work/all',
  authMiddleware('admin'),
  attendanceController.getAllFieldWork
);

// Update field work (Admin only)
router.put(
  '/field-work/:id',
  authMiddleware('admin'),
  attendanceController.updateFieldWork
);

// =============================================
// 9. HOLIDAYS
// =============================================
router.get(
  '/holidays', 
  authMiddleware(), 
  attendanceController.getHolidays
);
router.get(
  '/holidays/check', 
  authMiddleware(), 
  attendanceController.checkHoliday
);
router.post(
  '/holidays',
  authMiddleware('admin'),
  attendanceController.createHoliday
);
router.put(
  '/holidays/:id',
  authMiddleware('admin'),
  attendanceController.updateHoliday
);
router.delete(
  '/holidays/:id',
  authMiddleware('admin'),
  attendanceController.deleteHoliday
);

// =============================================
// 10. LATE NIGHT ADJUSTMENTS
// =============================================

router.get(
  '/late-night-adjustments/all', 
  authMiddleware('admin'),
  attendanceController.getAllLateNightAdjustments
);

router.post(
  '/late-night-adjustments', 
  authMiddleware(), 
  attendanceController.addLateNightAdjustment
);

router.get(
  '/late-night-adjustments/:employeeId', 
  authMiddleware(), 
  attendanceController.getLateNightAdjustments
);

router.put(
  '/late-night-adjustments/:adjustmentId',
  authMiddleware('admin'),
  attendanceController.updateLateNightAdjustment
);

router.delete(
  '/late-night-adjustments/:adjustmentId', 
  authMiddleware('admin'),
  attendanceController.deleteLateNightAdjustment
);

// =============================================
// 11. WORKING DAYS CONFIGURATION
// =============================================
router.get(
  '/working-days/:employeeId/check', 
  authMiddleware(), 
  attendanceController.checkWorkingDay
);
router.get(
  '/working-days-config',
  authMiddleware('admin'),
  attendanceController.getWorkingDaysConfig
);
router.put(
  '/working-days-config/:id',
  authMiddleware('admin'),
  attendanceController.updateWorkingDaysConfig
);

// =============================================
// 12. WORKING HOURS & BREAK CONFIGURATION
// =============================================
router.get(
  '/working-hours/:employeeId',
  authMiddleware(),
  attendanceController.getEffectiveWorkingHours
);

// =============================================
// 13. ADMIN DASHBOARD & STATISTICS
// =============================================
router.get(
  '/admin/dashboard/stats', 
  authMiddleware('admin'),
  attendanceController.getDashboardStats
);
router.get(
  '/admin/attendance/summary',
  authMiddleware('admin'),
  attendanceController.getAdminAttendanceSummary
);
router.get(
  '/admin/attendance/export',
  authMiddleware('admin'),
  attendanceController.exportAttendanceReport
);

// =============================================
// 14. BULK OPERATIONS (Admin only)
// =============================================
router.post(
  '/bulk/breaks/complete',
  authMiddleware('admin'),
  attendanceController.completeAllExpiredBreaks
);
router.post(
  '/bulk/attendance/process',
  authMiddleware('admin'),
  attendanceController.processDailyAttendance
);

module.exports = router;