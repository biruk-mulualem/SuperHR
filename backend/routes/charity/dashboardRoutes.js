'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charityDashboardController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ALL = ['admin', 'charity_admin', 'charity_teamleader'];

router.get('/stats', authMiddleware(...ALL), ctrl.getStats);
router.get('/logs', authMiddleware(...ALL), ctrl.getLogs);

module.exports = router;
