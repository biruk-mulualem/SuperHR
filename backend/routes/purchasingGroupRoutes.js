// routes/purchasingGroupRoutes.js
const express = require('express');
const router = express.Router();
const purchasingGroupController = require('../controllers/purchasingGroupController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== PURCHASING GROUP ROUTES ====================

// Get list of purchasing groups (with pagination + filters)
// GET /api/purchasing-groups?page=1&limit=10&search=team&status=active
router.get('/', purchasingGroupController.listGroups);

// Get stats
// GET /api/purchasing-groups/stats
router.get('/stats', purchasingGroupController.getStats);

// ================================================================
// APPROVAL SEQUENCE  —  must be declared BEFORE '/:id'
// ================================================================

// Get the current approval sequence (ordered stages with groups)
// GET /api/purchasing-groups/sequence
router.get('/sequence', purchasingGroupController.getSequence);

// Replace the whole approval sequence
// PUT /api/purchasing-groups/sequence
router.put('/sequence', purchasingGroupController.saveSequence);

// ================================================================
// SUBGROUPS — must be declared BEFORE '/:id'
// ================================================================

// Create a subgroup inside a group
// POST /api/purchasing-groups/:groupId/subgroups
router.post(
  '/:groupId/subgroups',
  purchasingGroupController.createSubgroup
);

// Update a subgroup
// PUT /api/purchasing-groups/:groupId/subgroups/:subgroupId
router.put(
  '/:groupId/subgroups/:subgroupId',
  purchasingGroupController.updateSubgroup
);

// Delete a subgroup
// DELETE /api/purchasing-groups/:groupId/subgroups/:subgroupId
router.delete(
  '/:groupId/subgroups/:subgroupId',
  purchasingGroupController.deleteSubgroup
);

// Users not yet assigned to any subgroup of the same group
// GET /api/purchasing-groups/:groupId/subgroups/:subgroupId/available-users?search=
router.get(
  '/:groupId/subgroups/:subgroupId/available-users',
  purchasingGroupController.listAvailableSubgroupUsers
);

// Add members to a subgroup (append)
// POST /api/purchasing-groups/:groupId/subgroups/:subgroupId/members
router.post(
  '/:groupId/subgroups/:subgroupId/members',
  purchasingGroupController.addSubgroupMembers
);

// Remove one member from a subgroup
// DELETE /api/purchasing-groups/:groupId/subgroups/:subgroupId/members/:userId
router.delete(
  '/:groupId/subgroups/:subgroupId/members/:userId',
  purchasingGroupController.removeSubgroupMember
);

// ================================================================
// GROUP-LEVEL ROUTES
// ================================================================

// Get single group
// GET /api/purchasing-groups/:id
router.get('/:id', purchasingGroupController.getGroupById);

// Get users NOT in the group (for Add-Members panel)
// GET /api/purchasing-groups/:id/available-users?search=al
router.get('/:id/available-users', purchasingGroupController.listAvailableUsers);

// Create new group
// POST /api/purchasing-groups
router.post('/', purchasingGroupController.createGroup);

// Update group
// PUT /api/purchasing-groups/:id
router.put('/:id', purchasingGroupController.updateGroup);

// Delete group
// DELETE /api/purchasing-groups/:id
router.delete('/:id', purchasingGroupController.deleteGroup);

// Replace the full set of members
// PUT /api/purchasing-groups/:id/members
router.put('/:id/members', purchasingGroupController.setMembers);

// Add members (append)
// POST /api/purchasing-groups/:id/members
router.post('/:id/members', purchasingGroupController.addMembers);

// Remove a single member
// DELETE /api/purchasing-groups/:id/members/:userId
router.delete('/:id/members/:userId', purchasingGroupController.removeMember);

module.exports = router;