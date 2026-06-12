'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charityTeamController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ADMIN  = ['admin', 'charity_admin'];
const ALL    = ['admin', 'charity_admin', 'charity_teamleader'];

// CRUD
router.get('/',               authMiddleware(...ALL),   ctrl.getTeams);
router.get('/:id',            authMiddleware(...ALL),   ctrl.getTeamById);
router.post('/',              authMiddleware(...ADMIN), ctrl.createTeam);
router.put('/:id',            authMiddleware(...ALL),   ctrl.updateTeam);
router.delete('/:id',         authMiddleware(...ADMIN), ctrl.deleteTeam);

module.exports = router;
