// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadItemSpec } = require('../middleware/uploadMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== CATEGORY ROUTES ====================
// MUST COME BEFORE /:id routes

// Get all categories
router.get('/categories', itemController.getAllCategories);

// Get single category by ID
router.get('/categories/:id', itemController.getCategoryById);

// Create a new category
router.post('/categories', itemController.createCategory);

// Update a category
router.put('/categories/:id', itemController.updateCategory);

// Update category status
router.patch('/categories/:id/status', itemController.updateCategoryStatus);

// Delete a category
router.delete('/categories/:id', itemController.deleteCategory);

// ==================== UOM ROUTES ====================
// MUST COME BEFORE /:id routes

// Get all UOMs
router.get('/uom', itemController.getAllUOMs);

// Get single UOM by ID
router.get('/uom/:id', itemController.getUOMById);

// Create a new UOM
router.post('/uom', itemController.createUOM);

// Update a UOM
router.put('/uom/:id', itemController.updateUOM);

// Update UOM status
router.patch('/uom/:id/status', itemController.updateUOMStatus);

// Delete a UOM
router.delete('/uom/:id', itemController.deleteUOM);

// ==================== ITEM ROUTES ====================

// Get item statistics
router.get('/statistics', itemController.getItemStats);

// Generate next item code
router.get('/generate-code', itemController.generateItemCode);

// Get active items only
router.get('/active', itemController.getActiveItems);

// Search items
router.get('/search', itemController.searchItems);

// Export items as CSV
router.get('/export', itemController.exportItems);

// Get items by category
router.get('/category/:categoryId', itemController.getItemsByCategory);

// Get item by code
router.get('/code/:code', itemController.getItemByCode);

// Get all items with pagination and filtering
router.get('/', itemController.getAllItems);

// ==================== IMPORTANT: Wildcard routes MUST come AFTER specific routes ====================

// Get single item by ID - THIS MUST BE AFTER ALL SPECIFIC ROUTES
router.get('/:id', itemController.getItemById);

// Create a new item
router.post('/', itemController.createItem);

// Bulk create items
router.post('/bulk', itemController.bulkCreateItems);

// Import items from CSV data
router.post('/import', itemController.importItems);

// Update an item
router.put('/:id', itemController.updateItem);

// Update item status (Activate/Deactivate/Discontinued)
router.patch('/:id/status', itemController.updateItemStatus);

// Activate an item
router.patch('/:id/activate', itemController.activateItem);

// Deactivate an item
router.patch('/:id/deactivate', itemController.deactivateItem);

// Soft delete an item (set status to Discontinued)
router.delete('/:id', itemController.deleteItem);

// Permanently delete an item from database
router.delete('/:id/permanent', itemController.permanentDeleteItem);

// Upload item specification
router.post(
  '/:id/upload-specification',
  uploadItemSpec,
  itemController.uploadItemSpecification
);

// Remove item specification
router.delete(
  '/:id/remove-specification',
  itemController.removeItemSpecification
);

module.exports = router;