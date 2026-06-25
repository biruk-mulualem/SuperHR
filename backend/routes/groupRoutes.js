// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== GROUP ROUTES ====================

// Get group statistics
router.get('/statistics', groupController.getGroupStatistics);

// Generate next group code
router.get('/generate-code', groupController.generateGroupCode);

// Export groups as CSV
router.get('/export', groupController.exportGroups);

// Get all users (for dropdown)
router.get('/users', groupController.getAllUsers);

// Get all groups with pagination and filtering
router.get('/', groupController.getAllGroups);

// Get single group by ID
router.get('/:id', groupController.getGroupById);

// Create a new group
router.post('/', groupController.createGroup);

// Update a group
router.put('/:id', groupController.updateGroup);

// Update group status
router.patch('/:id/status', groupController.updateGroupStatus);

// Soft delete a group (set status to Inactive)
router.delete('/:id', groupController.deleteGroup);

// Permanently delete a group
router.delete('/:id/permanent', groupController.permanentDeleteGroup);

// ==================== USER MANAGEMENT IN GROUPS ====================

// Get users in a group
router.get('/:groupId/users', groupController.getGroupUsers);

// Add user to group
router.post('/:groupId/users/:userId', groupController.addUserToGroup);

// Remove user from group
router.delete('/:groupId/users/:userId', groupController.removeUserFromGroup);

module.exports = router;