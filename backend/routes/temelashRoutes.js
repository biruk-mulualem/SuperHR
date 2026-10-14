// routes/temelashRoutes.js
"use strict";

const express = require("express");
const router = express.Router();
const temelashController = require("../controllers/temelashController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authMiddleware());

// ================================================================
// TEMELASH ROUTES
// ================================================================

/**
 * GET /api/temelash
 * List all temelash records (loan history) with pagination and filters.
 *
 * Query params:
 * - page: 1 (default)
 * - limit: 10 (default)
 * - status: out|returned|all (default: all)
 * - storeId: filter by asking or supplying store
 * - search: search by request code
 *
 * Example: /api/temelash?status=out&storeId=2&page=1&limit=10
 */
router.get("/", temelashController.getTemelashRecords);

/**
 * GET /api/temelash/:recordId
 * Get a single temelash record by ID.
 *
 * Example: /api/temelash/42
 */
router.get("/:recordId", temelashController.getTemelashRecordById);

/**
 * PUT /api/temelash/:recordId
 * Update a temelash record's loan window and/or remark.
 * Only allowed while status === 'out'.
 *
 * Body: { "fromDate": "2026-10-15", "toDate": "2026-10-20", "remark": "note" }
 *
 * Example: PUT /api/temelash/42
 */
router.put("/:recordId", temelashController.updateTemelash);

/**
 * POST /api/temelash/:recordId/return
 * Mark a temelash record as returned.
 *
 * Body: { "remark": "optional note" }
 *
 * Example: POST /api/temelash/42/return
 */
router.post("/:recordId/return", temelashController.returnTemelash);

module.exports = router;