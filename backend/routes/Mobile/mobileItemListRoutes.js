// routes/mobileItemListRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

const c = require('../../controllers/Mobile/mobileItemListController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware());

// GET /api/mobile/item-list/items
router.get('/items', c.getItemsList);

// GET /api/mobile/item-list/items/:itemId/balances
// Item detail → balance from every store, broken down by group.
router.get('/items/:itemId/balances', c.getItemBalances);

module.exports = router;