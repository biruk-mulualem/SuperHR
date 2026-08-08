const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  uploadSingleProfile,
  uploadDynamicDocument,
  uploadSingleBalance,
} = require("../middleware/uploadMiddleware");

// ============================================================================
// DEPARTMENT TRANSFER ROUTES - PUT THESE BEFORE authMiddleware
// ============================================================================

// employeeRoutes.js - Department Transfer Routes

/**
 * GET /api/employees/department-transfers
 * Get all department transfers with filters
 */
router.get(
  '/department-transfers/employee/:employeeId',
  authMiddleware('admin', 'hr', 'finance', 'attendance'),
  employeeController.getEmployeeDepartmentTransfers
);

/**
 * POST /api/employees/department-transfers
 * Create a new department transfer
 */
router.post(
  '/department-transfers',
  authMiddleware('admin', 'hr', 'finance', 'attendance'),
  employeeController.createDepartmentTransfer
);

/**
 * PUT /api/employees/department-transfers/:transferId/status
 * Update transfer status (reverse or complete)
 */
router.put(
  '/department-transfers/:transferId/status',
  authMiddleware('admin', 'hr', 'finance', 'attendance'),
  employeeController.updateTransferStatus
);
// ============================================================================
// PROTECTED ROUTES - Apply authMiddleware to all remaining routes
// ============================================================================
router.use(authMiddleware());

// ============================================================================
// THEN ALL OTHER ROUTES
// ============================================================================

// Summary endpoint (for dashboard cards)
router.get('/stats/compliance/summary', employeeController.getComplianceSummary);
router.get('/without-national-id', employeeController.getEmployeesWithoutNationalId);
router.get("/degree-missing", employeeController.getDegreeMissing);
router.get("/guarantee-status", employeeController.getGuaranteeStatus);
router.get('/guarantee-age-distribution', employeeController.getGuaranteeAgeDistribution);

// ============================================================================
// GUARANTEE AGE DETAILS ROUTE
// ============================================================================
router.get(
  '/guarantee-age-details',
  authMiddleware('admin', 'hr', 'finance', 'attendance'),
  employeeController.getGuaranteeAgeDetails
);

router.get(
  '/departments/:departmentId/employees',
  authMiddleware('admin', 'hr', 'finance', 'attendance'),
  employeeController.getDepartmentEmployees
);

// ============================================================================
// EMPLOYMENT TYPE EMPLOYEES (LAZY LOADING)
// ============================================================================
router.get(
  '/employment-types/:type/employees',
  authMiddleware('admin', 'hr', 'finance', 'attendance'),
  employeeController.getTypeEmployees
);

// ========== TERMINATE & REACTIVATE ROUTES ==========
router.post('/:id/terminate', authMiddleware("admin", "hr", "finance", "attendance"), 
employeeController.terminateEmployee);

router.post('/:id/reactivate', authMiddleware("admin", "hr", "finance", "attendance"), 
employeeController.reactivateEmployee);

router.get('/:id/termination-history', employeeController.getTerminationHistory);

router.get(
  "/",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getEmployees,
);
router.get("/:id", employeeController.getEmployeeById);
router.post(
  "/",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.createEmployee,
);
router.put(
  "/:id",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.updateEmployee,
);
router.delete(
  "/:id",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.deleteEmployee,
);

// ============================================================================
// ANALYTICS STATS ENDPOINTS
// ============================================================================
router.get(
  "/stats/kpi",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getKpiStats,
);
router.get(
  "/stats/hiring-trends",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getHiringTrends,
);
router.get(
  "/stats/departments",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getDepartmentDistribution,
);
router.get(
  "/stats/employment-types",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getEmploymentTypeDistribution,
);
router.get(
  "/stats/recent-hires",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getRecentHires,
);
router.get(
  "/stats/salary",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getSalaryAnalysis,
);
router.get(
  "/stats/hiring-details",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getHiringDetails,
);

// ============================================================================
// PROFILE PICTURE
// ============================================================================
router.post(
  "/:id/profile-picture",
  authMiddleware("admin", "hr"),
  uploadSingleProfile,
  employeeController.uploadProfilePicture,
);
router.delete(
  "/:id/profile-picture",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.deleteProfilePicture,
);

// ============================================================================
// GENERIC DOCUMENT UPLOAD - Handles ALL document types
// ============================================================================
router.post(
  "/:id/documents/upload/:type",
  uploadDynamicDocument,
  employeeController.uploadEmployeeDocument,
);

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================
router.get("/:id/documents", employeeController.getAllDocuments);
router.delete(
  "/:id/documents/:documentId",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.deleteDocument,
);

// ============================================================================
// OTHER ROUTES
// ============================================================================
router.post(
  "/import",
  authMiddleware("admin", "hr", "finance", "attendance"),
  uploadSingleBalance,
  employeeController.importEmployees,
);
router.get(
  "/compensation/employee/:employeeId",
  employeeController.getEmployeeCompensationHistory,
);

module.exports = router;