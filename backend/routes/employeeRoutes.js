// employeeRoutes.js
const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  uploadSingleProfile,
  uploadDynamicDocument,
} = require("../middleware/uploadMiddleware");

// ============================================================================
// PROTECTED ROUTES
// ============================================================================
router.use(authMiddleware());

// ============================================================================
// EMPLOYEE CRUD
// ============================================================================
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
  "/stats/compliance",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getDocumentCompliance,
);
router.get(
  "/stats/hiring-details",
  authMiddleware("admin", "hr", "finance", "attendance"),
  employeeController.getHiringDetails,
);

// ============================================================================
// PROFILE PICTURE (Special handling - uses uploadSingleProfile)
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
// This single route handles:
// - id_card, passport, national_id
// - spouse_profile, marriage_certificate
// - child_birth_certificate, child_medical_report, child_adoption_certificate, child_profile
// - education_certificate, degree, certificate, cv, resume
// - training_certificate
// - experience_letter
// - guarantee_letter, sdt_letter, guarantee_other
// - parent_support_document
// - naturalization_certificate
// - health_document, legal_document
// - contract, performance-review
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
  employeeController.importEmployees,
);
router.get(
  "/compensation/employee/:employeeId",
  employeeController.getEmployeeCompensationHistory,
);

module.exports = router;