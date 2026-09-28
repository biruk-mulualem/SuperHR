'use strict';

const express = require('express');
const router = express.Router();
const itemCostController = require('../controllers/itemCostController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.get('/stores', itemCostController.getStores);
router.get('/groups', itemCostController.getGroups);
router.get('/export', itemCostController.exportCostReport);
// Add this route
router.get('/export-all', itemCostController.exportAllItems);
// Protected routes
router.get('/', itemCostController.getItemsWithCost);
router.get('/:itemId', itemCostController.getItemCost);
router.get('/:itemId/history', itemCostController.getItemCostHistory);
router.post('/:itemId', itemCostController.updateItemCost);
router.patch('/:itemId/status', itemCostController.toggleItemStatus);

// Admin routes
router.post('/clear-cache', itemCostController.clearCache);

module.exports = router;