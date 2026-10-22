// routes/temelashRoutes.js
"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const temelashController = require("../controllers/temelashController");
const { authMiddleware } = require("../middleware/authMiddleware");

// In-memory upload — nothing is written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (/\.csv$/i.test(file.originalname)) return cb(null, true);
    cb(new Error("Only .csv files are allowed"));
  },
});

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

// ================================================================
// IMPORT ROUTES — must be BEFORE "/:recordId"
// ================================================================

/**
 * GET /api/temelash/import/template
 * Download the CSV template for historical temelash imports.
 */
router.get(
  "/import/template",
  temelashController.downloadTemelashTemplate
);

/**
 * POST /api/temelash/import
 * Import historical temelash records from a CSV file.
 * Field name: file (multipart/form-data)
 */
router.post(
  "/import",
  upload.single("file"),
  temelashController.importTemelashRecords
);

// ================================================================
// PER-RECORD ROUTES
// ================================================================

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

// Multer error handler — clean JSON instead of a 500
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  }
  if (err && /\.csv/i.test(err.message || "")) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next(err);
});

module.exports = router;