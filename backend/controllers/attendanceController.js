// controllers/attendanceController.js
const { 
  Employee, 
  Department,
  CompanyShiftDefault,
  DepartmentOverride,      
  EmployeeOverride,        
  BreakTicket,
  AttendanceLog,
  OvertimeRate,
  LateNightAdjustment,
  FieldWorkAssignment,
  Holiday,
  WorkingDaysConfig,
  sequelize 
} = require('../models');
const attendanceService = require('../service/attendanceConfig.service');
const { Op } = require('sequelize');

// Import all modularized controllers
const breaksController = require('./attendance/breaksController');
const attendanceLogsController = require('./attendance/attendanceLogsController');
const overridesController = require('./attendance/overridesController');
const fieldWorkController = require('./attendance/fieldWorkController');
const holidaysController = require('./attendance/holidaysController');
const lateNightController = require('./attendance/lateNight.Controller');  // ← Capital N
const overtimeController = require('./attendance/overtimeController');
const workingDaysController = require('./attendance/workingDaysController');
const adminController = require('./attendance/adminController');
const bulkController = require('./attendance/bulkController');
const schedulesController = require('./attendance/schedulesController');
 const importController = require('./attendance/importController');
// ============================================================================
// HELPER FUNCTIONS (kept here as requested)
// ============================================================================

const formatTimeDisplay = (time) => {
  if (!time) return null;
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
};

const getPagination = (page, size, defaultLimit = 10, maxLimit = 100) => {
  const limit = size ? Math.min(parseInt(size), maxLimit) : defaultLimit;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  return { limit, offset };
};

// ============================================================================
// EXPORT ALL - Re-export from modules
// ============================================================================

// Schedules
exports.getEffectiveSchedule = schedulesController.getEffectiveSchedule;
exports.getEffectiveWorkingHours = schedulesController.getEffectiveWorkingHours;

// Breaks
exports.issueBreakTicket = breaksController.issueBreakTicket;
exports.returnFromBreak = breaksController.returnFromBreak;
exports.getActiveBreaks = breaksController.getActiveBreaks;
exports.getBreakHistory = breaksController.getBreakHistory;
exports.getLunchHistory = breaksController.getLunchHistory;
exports.getDinnerHistory = breaksController.getDinnerHistory;
// Attendance Logs
exports.recordCheckIn = attendanceLogsController.recordCheckIn;
exports.recordCheckOut = attendanceLogsController.recordCheckOut;
exports.getAttendanceReport = attendanceLogsController.getAttendanceReport;
exports.getMyAttendance = attendanceLogsController.getMyAttendance;
exports.getAttendanceSummary = attendanceLogsController.getAttendanceSummary;
exports.getTodayAttendance = attendanceLogsController.getTodayAttendance;  // ✅ ADD THIS
exports.getTodayStatus = attendanceLogsController.getTodayStatus;          // ✅ ADD THIS
exports.getAllAttendanceByDate = attendanceLogsController.getAllAttendanceByDate;  // ✅ ADD THIS LINE
exports.getPendingAbsentees = attendanceLogsController.getPendingAbsentees;  // ✅ ADD THIS LINE
exports.massUpdateAttendance = attendanceLogsController.massUpdateAttendance;  // ✅ ADD THIS LINE
exports.getExpiredPendingLate = attendanceLogsController.getExpiredPendingLate;  // ✅ ADD THIS LINE
exports.markExpiredAsAbsent = attendanceLogsController.markExpiredAsAbsent;  // ✅ ADD THIS LINE
exports.revertAttendanceUpdate = attendanceLogsController.revertAttendanceUpdate;  // ✅ ADD THIS LINE


//-----------------------------------------------------------------
//the manual attandacce import controller
//----------------------------------------------------------------
exports.getDailyAttendance = importController.getDailyAttendance;  // ✅ ADD THIS LINE
exports.reprocessFailedRows = importController.reprocessFailedRows;  // ✅ ADD THIS LINE
exports.getImportStatus = importController.getImportStatus;  // ✅ ADD THIS LINE
exports.importAttendanceFile = importController.importAttendanceFile;  // ✅ ADD THIS LINE

exports.getWeeklyAttendance = importController.getWeeklyAttendance;  // ✅ ADD THIS LINE
exports.getMonthlyAttendance = importController.getMonthlyAttendance;  // ✅ ADD THIS LINE















// Overrides
exports.getCompanyDefaults = overridesController.getCompanyDefaults;
exports.getCompanyDefaultById = overridesController.getCompanyDefaultById;
exports.createCompanyDefault = overridesController.createCompanyDefault;
exports.updateCompanyDefault = overridesController.updateCompanyDefault;
exports.deleteCompanyDefault = overridesController.deleteCompanyDefault;
exports.getDepartmentOverrides = overridesController.getDepartmentOverrides;
exports.getDepartmentOverrideById = overridesController.getDepartmentOverrideById;
exports.createDepartmentOverride = overridesController.createDepartmentOverride;
exports.updateDepartmentOverride = overridesController.updateDepartmentOverride;
exports.deleteDepartmentOverride = overridesController.deleteDepartmentOverride;
exports.getEmployeeOverrides = overridesController.getEmployeeOverrides;
exports.getEmployeeOverrideById = overridesController.getEmployeeOverrideById;
exports.createEmployeeOverride = overridesController.createEmployeeOverride;
exports.updateEmployeeOverride = overridesController.updateEmployeeOverride;
exports.deleteEmployeeOverride = overridesController.deleteEmployeeOverride;

// Field Work
exports.registerFieldWork = fieldWorkController.registerFieldWork;
exports.completeFieldWork = fieldWorkController.completeFieldWork;
exports.getActiveFieldWork = fieldWorkController.getActiveFieldWork;
exports.getAllFieldWork = fieldWorkController.getAllFieldWork;
exports.updateFieldWork = fieldWorkController.updateFieldWork;
exports.deleteFieldWork = fieldWorkController.deleteFieldWork;
exports.getFieldWorkHistory = fieldWorkController.getFieldWorkHistory;

// Holidays
exports.getHolidays = holidaysController.getHolidays;
exports.checkHoliday = holidaysController.checkHoliday;
exports.createHoliday = holidaysController.createHoliday;
exports.updateHoliday = holidaysController.updateHoliday;
exports.deleteHoliday = holidaysController.deleteHoliday;

// Late Night Adjustments
exports.addLateNightAdjustment = lateNightController.addLateNightAdjustment;
exports.getLateNightAdjustments = lateNightController.getLateNightAdjustments;
exports.getAllLateNightAdjustments = lateNightController.getAllLateNightAdjustments;
exports.updateLateNightAdjustment = lateNightController.updateLateNightAdjustment;
exports.deleteLateNightAdjustment = lateNightController.deleteLateNightAdjustment;

// Overtime
exports.calculateOvertime = overtimeController.calculateOvertime;
exports.getOvertimeRates = overtimeController.getOvertimeRates;
exports.createOvertimeRate = overtimeController.createOvertimeRate;
exports.updateOvertimeRate = overtimeController.updateOvertimeRate;
exports.deleteOvertimeRate = overtimeController.deleteOvertimeRate;

// Working Days
exports.checkWorkingDay = workingDaysController.checkWorkingDay;
exports.getWorkingDaysConfig = workingDaysController.getWorkingDaysConfig;
exports.updateWorkingDaysConfig = workingDaysController.updateWorkingDaysConfig;

// Admin
exports.getDashboardStats = adminController.getDashboardStats;
exports.getAdminAttendanceSummary = adminController.getAdminAttendanceSummary;
exports.exportAttendanceReport = adminController.exportAttendanceReport;

// Bulk Operations
exports.completeAllExpiredBreaks = bulkController.completeAllExpiredBreaks;
exports.processDailyAttendance = bulkController.processDailyAttendance;