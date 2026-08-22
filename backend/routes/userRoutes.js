const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================================================
// PUBLIC ROUTES (No authentication)
// ============================================================================

// ✅ New: Get stores by username (returns stores with group info)
router.post('/stores-by-username', userController.getStoresByUsername);

// ✅ New: Login with username + store + password
router.post('/login-with-store', userController.loginWithStore);

// Regular login (kept for backward compatibility)
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', userController.logout);

// ============================================================================
// PROTECTED ROUTES (Any authenticated user)
// ============================================================================

// Apply auth middleware to all routes below
router.use(authMiddleware());

// Profile routes (any authenticated user)
router.get('/profile', userController.getProfile);
router.post('/change-password', userController.changePassword);

// Read-only lookup data (any authenticated user)
router.get('/roles', userController.getAllRoles);
router.get('/departments', userController.getAllDepartments);
router.get('/positions', userController.getAllPositions);

// ✅ Get user's groups for a specific store (requires auth)
router.get('/stores/:storeId/groups', userController.getUserStoreGroups);

// ============================================================================
// ADMIN ONLY ROUTES (Requires admin role)
// ============================================================================

// User management - Admin only (controller checks role)
router.get('/', userController.getUsers);
router.get('/stats', userController.getUserStats);
router.get('/filter-options', userController.getFilterOptions);
router.get('/export', userController.exportUsers);
router.get('/advanced-search', userController.advancedSearchUsers);
router.get('/:id', userController.getUserById);

// User creation and updates - Admin only
router.post('/', userController.createUser);
router.post('/bulk-update', userController.bulkUpdateUsers);
router.put('/:id', userController.updateUser);

// Password management - Admin only
router.post('/:id/reset-password', userController.resetPassword);

// Status management - Admin only
router.put('/:id/activate', userController.activateUser);
router.put('/:id/deactivate', userController.deactivateUser);
router.put('/:id/toggle-status', userController.toggleUserStatus);

module.exports = router;