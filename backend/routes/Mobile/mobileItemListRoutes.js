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

// ── Stock alert config ─────────────────────────────────────────
// GET    /api/mobile/item-list/items/:itemId/stock-alert  → read
// PUT    /api/mobile/item-list/items/:itemId/stock-alert  → upsert (threshold 0 clears)
// DELETE /api/mobile/item-list/items/:itemId/stock-alert  → clear
router.get('/items/:itemId/stock-alert', c.getStockAlert);
router.put('/items/:itemId/stock-alert', c.setStockAlert);
router.delete('/items/:itemId/stock-alert', c.clearStockAlert);

module.exports = router;