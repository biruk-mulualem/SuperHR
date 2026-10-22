// routes/itemRelationshipRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const itemRelationshipController = require('../controllers/itemRelationshipController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ================================================================
// 🔥 STATIC ROUTES (MUST COME BEFORE /:id WILDCARDS)
// ================================================================

/**
 * POST /api/item-relationships/bulk-delete
 * Delete multiple relationships in one transaction.
 *
 * Body: { "ids": [1, 2, 3] }
 *
 * Example: POST /api/item-relationships/bulk-delete
 * Body:    { "ids": [5, 6, 7] }
 */
router.post(
  '/bulk-delete',
  itemRelationshipController.bulkDelete
);

/**
 * POST /api/item-relationships/import
 * Bulk-import relationships from CSV.
 * Each row is processed in its own savepoint — partial success is normal.
 *
 * Body: { "rows": [{ "itemCodeA": "SDT0001", "itemCodeB": "SDT0002", "remark": "..." }, ...] }
 *
 * Example: POST /api/item-relationships/import
 * Body:    { "rows": [{ "itemCodeA": "SDT0001", "itemCodeB": "SDT0002" }] }
 */
router.post(
  '/import',
  itemRelationshipController.import
);

// ================================================================
// MAIN RELATIONSHIP ROUTES
// ================================================================

/**
 * GET /api/item-relationships
 * List all relationships with optional search, status filter, and pagination.
 *
 * Query params:
 * - search: search across relationship code, item codes, names, UOMs
 * - status: Active | Inactive | all (default: all)
 * - page: 1 (default) — optional; omit for unpaginated full list
 * - limit: 10 (default)
 *
 * Example: /api/item-relationships?search=oil&status=Active&page=1&limit=10
 */
router.get('/', itemRelationshipController.getAll);

/**
 * POST /api/item-relationships
 * Create a new relationship between two items.
 * The relationship code is generated server-side — never accepted from the client.
 *
 * Body: { "itemAId": 1, "itemBId": 2, "remark": "Same oil, drum vs kg" }
 *
 * Example: POST /api/item-relationships
 * Body:    { "itemAId": 1, "itemBId": 2, "remark": "Same oil" }
 */
router.post('/', itemRelationshipController.create);

// ================================================================
// 🔥 PARAMETERIZED ROUTES (MUST COME AFTER STATIC ROUTES)
// ================================================================

/**
 * GET /api/item-relationships/:id
 * Get a single relationship by ID.
 *
 * Example: /api/item-relationships/5
 */
router.get('/:id', itemRelationshipController.getById);

/**
 * PUT /api/item-relationships/:id
 * Update an existing relationship.
 * `relationshipCode` is immutable — send only the fields you want to change.
 *
 * Body: { "itemAId"?, "itemBId"?, "remark"?, "status"? }
 *
 * Example: PUT /api/item-relationships/5
 * Body:    { "remark": "updated note" }
 */
router.put('/:id', itemRelationshipController.update);

/**
 * DELETE /api/item-relationships/:id
 * Delete a single relationship.
 *
 * Example: DELETE /api/item-relationships/5
 */
router.delete('/:id', itemRelationshipController.remove);

module.exports = router;