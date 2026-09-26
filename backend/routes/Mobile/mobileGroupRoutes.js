// routes/Mobile/mobileGroupRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const c = require('../../controllers/Mobile/mobileGroupController');
const { authMiddleware } = require('../../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware());

// ================================================================
// USER DIRECTORY — must come BEFORE '/:id'
// ================================================================
router.get('/users/directory', c.listUsersDirectory);

// ================================================================
// GROUPS
// ================================================================

// GET /api/mobile/groups?filter=active|inactive&search=&page=&limit=
router.get('/', c.listGroups);

// POST /api/mobile/groups
// body: { name, description?, emoji?, accent? }
router.post('/', c.createGroup);

// GET /api/mobile/groups/:id
router.get('/:id', c.getGroup);

// PATCH /api/mobile/groups/:id
// body: { name?, description?, emoji?, accent? }
router.patch('/:id', c.updateGroup);

// DELETE /api/mobile/groups/:id
// body: { confirm: "Exact Group Name" }
router.delete('/:id', c.deleteGroup);

// ================================================================
// STATUS
// ================================================================

router.post('/:id/activate', (req, res, next) => {
  req.body.status = 'active';
  c.setGroupStatus(req, res, next);
});

router.post('/:id/deactivate', (req, res, next) => {
  req.body.status = 'inactive';
  c.setGroupStatus(req, res, next);
});

// ================================================================
// LEAVE / TRANSFER OWNERSHIP
// ================================================================

router.post('/:id/leave', c.leaveGroup);

// ================================================================
// MEMBERS
// ================================================================

router.get('/:id/members', c.listMembers);
router.post('/:id/members', c.addMember);
router.delete('/:id/members/:userId', c.removeMember);

// ================================================================
// INVITATIONS — accept / decline
// ================================================================

// POST /api/mobile/groups/:id/accept-invite
// Flips the current user's pending membership to active
// and notifies the group owner.
router.post('/:id/accept-invite', c.acceptInvite);

// POST /api/mobile/groups/:id/decline-invite
// Destroys the current user's pending membership
// and optionally notifies the group owner.
router.post('/:id/decline-invite', c.declineInvite);

module.exports = router;