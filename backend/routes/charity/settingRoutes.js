'use strict';
const router = require('express').Router();
const ctrl   = require('../../controllers/charity/charitySettingController');
const { authMiddleware } = require('../../middleware/authMiddleware');

const ADMIN  = ['admin', 'charity_admin'];
const ALL    = ['admin', 'charity_admin', 'charity_teamleader'];

router.get('/',  authMiddleware(...ALL),   ctrl.getSettings);
router.put('/',  authMiddleware(...ADMIN), ctrl.updateSettings);

module.exports = router;
