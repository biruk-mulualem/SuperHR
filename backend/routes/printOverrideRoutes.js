// routes/printOverrideRoutes.js
const express = require('express');
const router = express.Router();
const printOverrideController = require('../controllers/printOverrideController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== PRINT OVERRIDE ROUTES ====================

// Get the print override for a specific request
// GET /api/print-overrides/request/:requestId
router.get(
  '/request/:requestId',
  printOverrideController.getPrintOverride
);

// Create a print override for a request (fails if one exists)
// POST /api/print-overrides/request/:requestId
router.post(
  '/request/:requestId',
  printOverrideController.createPrintOverride
);

// Update the print override for a request (fails if none exists)
// PUT /api/print-overrides/request/:requestId
router.put(
  '/request/:requestId',
  printOverrideController.updatePrintOverride
);

// Upsert (create-or-update) — primary endpoint used by the print forms
// POST /api/print-overrides/request/:requestId/upsert
router.post(
  '/request/:requestId/upsert',
  printOverrideController.upsertPrintOverride
);

// Delete the print override (reset to defaults)
// DELETE /api/print-overrides/request/:requestId
router.delete(
  '/request/:requestId',
  printOverrideController.deletePrintOverride
);

// ==================== ADMIN / LIST ROUTES ====================

// List all print overrides (with optional filters)
// GET /api/print-overrides?page=1&limit=20&requestId=..&userId=..
router.get(
  '/',
  printOverrideController.listPrintOverrides
);

// Get a single print override by its own id
// GET /api/print-overrides/:id
router.get(
  '/:id',
  printOverrideController.getPrintOverrideById
);

module.exports = router;