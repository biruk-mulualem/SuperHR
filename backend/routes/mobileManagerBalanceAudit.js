// routes/mobileManagerBalanceAudit.js
'use strict';

const express = require('express');
const router = express.Router();
const c = require('../controllers/mobileManagerBalanceAuditController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware());

router.get('/stores',                c.getStores);
router.get('/stores/:storeId/items', c.getStoreItems);
router.get('/summary',               c.getSummary);

module.exports = router;