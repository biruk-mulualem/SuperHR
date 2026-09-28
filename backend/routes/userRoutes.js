const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================================================
// PUBLIC ROUTES (No authentication)
// ============================================================================

// Get stores by username (returns stores with group info)
router.post('/stores-by-username', userController.getStoresByUsername);

// Login with username + store + password
router.post('/login-with-store', userController.loginWithStore);

// Regular login (kept for backward compatibility)
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// ============================================================================
// PROTECTED ROUTES (Any authenticated user)
// ============================================================================

// Apply auth middleware to all routes below
router.use(authMiddleware());

// Logout
router.post('/logout', userController.logout);

// Profile routes
router.get('/profile', userController.getProfile);
router.post('/change-password', userController.changePassword);

// Push token registration/clearing (authenticated)
router.post('/push-token', userController.savePushToken);
router.delete('/push-token', userController.clearPushToken);

// Read-only lookup data
router.get('/roles', userController.getAllRoles);
router.get('/departments', userController.getAllDepartments);
router.get('/positions', userController.getAllPositions);

// Get user's groups for a specific store
router.get('/stores/:storeId/groups', userController.getUserStoreGroups);

// ============================================================================
// ADMIN ONLY ROUTES (Requires admin role)
// ============================================================================

router.get('/', userController.getUsers);
router.get('/stats', userController.getUserStats);
router.get('/filter-options', userController.getFilterOptions);
router.get('/export', userController.exportUsers);
router.get('/advanced-search', userController.advancedSearchUsers);
router.get('/:id', userController.getUserById);

router.post('/', userController.createUser);
router.post('/bulk-update', userController.bulkUpdateUsers);
router.put('/:id', userController.updateUser);

router.post('/:id/reset-password', userController.resetPassword);

router.put('/:id/activate', userController.activateUser);
router.put('/:id/deactivate', userController.deactivateUser);
router.put('/:id/toggle-status', userController.toggleUserStatus);

module.exports = router;