// In your employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
  uploadSingleProfile, 
  uploadSingleDocument 
} = require('../middleware/uploadMiddleware');

// ============================================================================
// PROTECTED ROUTES
// ============================================================================
router.use(authMiddleware());

// ============================================================================
// EMPLOYEE CRUD
// ============================================================================
router.get('/', authMiddleware('admin'), employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);

// ✅ REMOVED uploadSingleProfile from POST - profile picture is separate
router.post('/', 
  authMiddleware('admin'), 
  employeeController.createEmployee
);

router.put('/:id', 
  authMiddleware('admin'), 
  employeeController.updateEmployee
);

router.delete('/:id', authMiddleware('admin'), employeeController.deleteEmployee);

// ============================================================================
// ANALYTICS STATS ENDPOINTS (Separate for each section)
// ============================================================================

// 1. KPI Cards - Basic Overview Stats
router.get('/stats/kpi', 
  authMiddleware('admin'), 
  employeeController.getKpiStats
);

// 2. Hiring Trends
router.get('/stats/hiring-trends', 
  authMiddleware('admin'), 
  employeeController.getHiringTrends
);

// 3. Department Distribution
router.get('/stats/departments', 
  authMiddleware('admin'), 
  employeeController.getDepartmentDistribution
);

// 4. Employment Type Distribution
router.get('/stats/employment-types', 
  authMiddleware('admin'), 
  employeeController.getEmploymentTypeDistribution
);

// 5. Recent Hires
router.get('/stats/recent-hires', 
  authMiddleware('admin'), 
  employeeController.getRecentHires
);

// 6. Salary Analysis
router.get('/stats/salary', 
  authMiddleware('admin'), 
  employeeController.getSalaryAnalysis
);

// 7. Document Compliance
router.get('/stats/compliance', 
  authMiddleware('admin'), 
  employeeController.getDocumentCompliance
);

// ============================================================================
// DOCUMENT UPLOADS
// ============================================================================

// Profile Picture
router.post(
  '/:id/profile-picture',
  authMiddleware('admin'),
  uploadSingleProfile,
  employeeController.uploadProfilePicture
);
router.delete('/:id/profile-picture', authMiddleware('admin'), employeeController.deleteProfilePicture);

// ID Card
router.post(
  '/:id/id-card',
  authMiddleware('admin'),
  (req, res, next) => { req.params.type = 'id_card'; next(); },
  uploadSingleDocument,
  employeeController.uploadIdCard
);

// CV/Resume
router.post(
  '/:id/cv',
  authMiddleware('admin'),
  (req, res, next) => { req.params.type = 'cv'; next(); },
  uploadSingleDocument,
  employeeController.uploadCv
);

// Degree/Certificate
router.post(
  '/:id/degree',
  authMiddleware('admin'),
  (req, res, next) => { req.params.type = 'degree'; next(); },
  uploadSingleDocument,
  employeeController.uploadDegree
);

// Guarantee Letter
router.post(
  '/:id/guarantee-letter',
  authMiddleware('admin'),
  (req, res, next) => { req.params.type = 'guarantee_letter'; next(); },
  uploadSingleDocument,
  employeeController.uploadGuaranteeLetter
);

// Get all documents grouped
router.get('/:id/documents', employeeController.getAllDocuments);

// Delete specific document
router.delete(
  '/:id/documents/:documentId',
  authMiddleware('admin'),
  employeeController.deleteDocument
);

// Import employees (bulk create)
router.post(
  '/import',
  authMiddleware('admin'),
  employeeController.importEmployees
);

module.exports = router;