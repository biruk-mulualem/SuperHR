const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadSingleAttendance } = require("../middleware/uploadMiddleware");
// ============================================
// ATTENDANCE IMPORT SYSTEM ROUTES
// ============================================

// 1. Import attendance file (CSV/Excel)
router.post(
    '/import',
    authMiddleware('admin'),
    uploadSingleAttendance,
    attendanceController.importAttendanceFile
);

// 2. Get all attendance records (with filters)
router.get(
    '/records',
    authMiddleware(),
    attendanceController.getAttendanceRecords
);

// Update attendance record (Edit)
router.put(
    '/records/:id',
    authMiddleware('admin'),
    attendanceController.updateAttendanceRecord
);

// Add this route before the module.exports
router.get(
    '/monthly-summary',
    authMiddleware(),
    attendanceController.getMonthlySummary
);
// 3. Get salary data for payroll
router.get(
    '/salary',
    authMiddleware(),
    attendanceController.getSalaryData
);

// 4. Get all import batches
router.get(
    '/imports',
    authMiddleware('admin'),
    attendanceController.getImportBatches
);

// 5. Get import batch details by ID
router.get(
    '/imports/:id',
    authMiddleware('admin'),
    attendanceController.getImportBatchDetails
);

// 6. Get import errors (with optional batch filter)
router.get(
    '/errors',
    authMiddleware('admin'),
    attendanceController.getImportErrors
);

// 7. Resolve an import error
router.put(
    '/errors/:id/resolve',
    authMiddleware('admin'),
    attendanceController.resolveImportError
);

// 8. Delete an attendance record
router.delete(
    '/records/:id',
    authMiddleware('admin'),
    attendanceController.deleteAttendanceRecord
);

// 9. Get employee attendance summary
router.get(
    '/summary/employee/:employeeId',
    authMiddleware(),
    attendanceController.getEmployeeAttendanceSummary
);

// 10. Get department attendance summary
router.get(
    '/summary/department/:departmentId',
    authMiddleware(),
    attendanceController.getDepartmentAttendanceSummary
);

// 11. Get attendance statistics
router.get(
    '/statistics',
    authMiddleware(),
    attendanceController.getAttendanceStatistics
);

module.exports = router;