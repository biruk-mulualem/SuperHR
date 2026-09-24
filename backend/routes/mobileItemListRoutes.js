// routes/mobileItemListRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

const c = require('../controllers/mobileItemListController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware());

// GET /api/mobile/item-list/items
router.get('/items', c.getItemsList);

module.exports = router;