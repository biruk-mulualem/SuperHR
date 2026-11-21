// routes/itemStatusRoutes.js
const express = require("express");
const router = express.Router();
const itemStatusController = require("../controllers/itemStatusController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== LOOKUP LISTS ====================

// Get active stores (for form dropdown)
router.get("/stores", itemStatusController.getStores);

// Get active items (for form dropdown)
router.get("/items", itemStatusController.getItems);

// ==================== CHECK (used by Create Request UI) ====================

// Check if a store+item is currently blocked
router.get("/check", itemStatusController.checkBlockedEndpoint);

// ==================== RULE ROUTES ====================

// List all rules
router.get("/rules", itemStatusController.getRules);

// Get a single rule (with full history)
router.get("/rules/:id", itemStatusController.getRuleById);

// Get a rule's take history (paged)
router.get("/rules/:id/history", itemStatusController.getRuleHistory);

// Create a rule
router.post("/rules", itemStatusController.createRule);

// Update a rule
router.put("/rules/:id", itemStatusController.updateRule);

// Delete a rule (soft)
router.delete("/rules/:id", itemStatusController.deleteRule);

module.exports = router;