// routes/mobileManagerStoreDashboard.js
'use strict';

const express = require('express');
const router = express.Router();
const c = require('../../controllers/Mobile/mobileManagerStoreDashboardController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware());

router.get('/summary', c.getSummary);

module.exports = router;