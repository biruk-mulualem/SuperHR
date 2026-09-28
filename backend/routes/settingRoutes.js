// routes/settingRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ==================== ROLES ROUTES ====================
router.get('/roles', authMiddleware('admin'), settingsController.getAllRoles);
router.get('/roles/:id', authMiddleware('admin'), settingsController.getRoleById);
router.post('/roles', authMiddleware('admin'), settingsController.createRole);
router.put('/roles/:id', authMiddleware('admin'), settingsController.updateRole);
router.patch('/roles/:id/status', authMiddleware('admin'), settingsController.toggleRoleStatus);
router.delete('/roles/:id', authMiddleware('admin'), settingsController.deleteRole);

// ==================== DEPARTMENTS ROUTES ====================
router.get('/departments', authMiddleware(), settingsController.getAllDepartments);
router.get('/departments/tree', authMiddleware(), settingsController.getDepartmentTree);
router.get('/departments/stats', authMiddleware('admin'), settingsController.getDepartmentStatistics);
router.get('/departments/:id', authMiddleware(), settingsController.getDepartmentById);
router.post('/departments', authMiddleware('admin'), settingsController.createDepartment);
router.put('/departments/:id', authMiddleware('admin'), settingsController.updateDepartment);
router.patch('/departments/:id/status', authMiddleware('admin'), settingsController.toggleDepartmentStatus);
router.delete('/departments/:id', authMiddleware('admin'), settingsController.deleteDepartment);

// ==================== POSITIONS ROUTES ====================
router.get('/positions', authMiddleware(), settingsController.getAllPositions);
router.get('/positions/all', authMiddleware(), settingsController.getAllPositions);
router.get('/positions/:id', authMiddleware(), settingsController.getPositionById);
router.post('/positions', authMiddleware('admin'), settingsController.createPosition);
router.put('/positions/:id', authMiddleware('admin'), settingsController.updatePosition);
router.patch('/positions/:id/status', authMiddleware('admin'), settingsController.togglePositionStatus);
router.delete('/positions/:id', authMiddleware('admin'), settingsController.deletePosition);

// ==================== SYSTEM SETTINGS ROUTES ====================
router.get('/settings', authMiddleware('admin'), settingsController.getAllSettings);
router.get('/settings/:key', authMiddleware('admin'), settingsController.getSettingByKey);
router.post('/settings', authMiddleware('admin'), settingsController.upsertSetting);
router.put('/settings/batch', authMiddleware('admin'), settingsController.batchUpdateSettings);
router.delete('/settings/:key', authMiddleware('admin'), settingsController.deleteSetting);

// ==================== ATTENDANCE RULES ROUTES ====================
router.get('/attendance/rules', authMiddleware(), settingsController.getAttendanceRules);
router.put('/attendance/rules', authMiddleware('admin'), settingsController.updateAttendanceRules);




// ================================================================
// ==================== APPROVAL DEPARTMENT ROUTES ====================
// ================================================================

// Get approval department configuration
router.get(
  '/approval/department',
  authMiddleware('admin'),
  settingsController.getApprovalDepartment
);

// Get all departments for dropdown
router.get(
  '/approval/departments',
  authMiddleware('admin'),
  settingsController.getDepartmentsForApproval
);

// 🔥 Get all stores for "Apply To" dropdown
router.get(
  '/approval/stores',
  authMiddleware('admin'),
  settingsController.getStoresForApproval
);

// Set approval department
router.post(
  '/approval/department',
  authMiddleware('admin'),
  settingsController.setApprovalDepartment
);

// Remove/disable approval department
router.delete(
  '/approval/department',
  authMiddleware('admin'),
  settingsController.removeApprovalDepartment
);

module.exports = router;