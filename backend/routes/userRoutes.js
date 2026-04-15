const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

// PUBLIC ROUTES (No authentication)
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', userController.logout);

// PROTECTED ROUTES (Any authenticated user - just need valid token)
router.use(authMiddleware()); // Only checks token exists, NOT role

// Profile routes (any authenticated user)
router.get('/profile', userController.getProfile);
router.post('/change-password', userController.changePassword);

// IMPORTANT: These MUST be here BEFORE admin middleware
// Any authenticated user can read roles and departments
router.get('/roles', userController.getAllRoles);
router.get('/departments', userController.getAllDepartments);
router.get('/positions', userController.getAllPositions);

// ADMIN ONLY ROUTES (Requires admin role)
router.use(authMiddleware('admin'));

// All routes below require admin role
router.get('/', userController.getUsers);
router.get('/stats', userController.getUserStats);
router.get('/filter-options', userController.getFilterOptions);
router.get('/export', userController.exportUsers);
router.get('/advanced-search', userController.advancedSearchUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.post('/bulk-update', userController.bulkUpdateUsers);

router.post('/:id/reset-password', userController.resetPassword);
router.put('/:id', userController.updateUser);
router.put('/:id/activate', userController.activateUser);
router.put('/:id/deactivate', userController.deactivateUser);
router.put('/:id/toggle-status', userController.toggleUserStatus);


module.exports = router;