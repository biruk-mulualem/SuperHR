// routes/itemCostRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const itemCostController = require('../controllers/itemCostController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ================================================================
// 📊 DROPDOWN DATA ROUTES
// ================================================================

/**
 * GET /api/item-costs/stores
 * Get stores for dropdown filter
 */
router.get('/stores', itemCostController.getStores);

/**
 * GET /api/item-costs/groups
 * Get groups for dropdown filter
 */
router.get('/groups', itemCostController.getGroups);

// ================================================================
// 📈 SUMMARY & EXPORT
// ================================================================

/**
 * GET /api/item-costs/summary
 * Get cost summary statistics
 * Query params: storeId, groupId (optional)
 */
router.get('/summary', itemCostController.getCostSummary);

/**
 * GET /api/item-costs/export
 * Export cost report as CSV data
 * Query params: storeId, groupId (optional)
 */
router.get('/export', itemCostController.exportCostReport);

// ================================================================
// 📦 MAIN CRUD ROUTES
// ================================================================

/**
 * GET /api/item-costs
 * Get all items with cost calculations
 * Query params: 
 *   - storeId: Filter by store
 *   - groupId: Filter by group
 *   - status: Filter by status (Active, Partial, Inactive, Conflict)
 *   - search: Search by item code, name, or standard name
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 */
router.get('/', itemCostController.getItemsWithCost);

/**
 * GET /api/item-costs/:itemId
 * Get single item with cost calculation
 * Query params: storeId, groupId (optional)
 */
router.get('/:itemId', itemCostController.getItemCost);

/**
 * POST /api/item-costs/:itemId
 * Update item cost
 * Body: { unitCost: number, reason?: string }
 */
router.post('/:itemId', itemCostController.updateItemCost);

/**
 * PATCH /api/item-costs/:itemId/status
 * Toggle item status (Active/Inactive)
 * Body: { status: 'Active' | 'Inactive' }
 */
router.patch('/:itemId/status', itemCostController.toggleItemStatus);

module.exports = router;