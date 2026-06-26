// routes/storeRoutes.js
const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== STORE ROUTES ====================

// Get store statistics
router.get('/statistics', storeController.getStoreStatistics);

// Generate next store code
router.get('/generate-code', storeController.generateStoreCode);

// Export stores as CSV
router.get('/export', storeController.exportStores);

// ==================== ADD THESE SPECIFIC ROUTES HERE ====================
// ⚠️ IMPORTANT: These MUST come BEFORE /:id

// Get all users (for dropdown)
router.get('/users', storeController.getAllUsers);

// Get all groups (for dropdown) - THIS WAS MISSING!
router.get('/groups', storeController.getAllGroups);

// ==================== ROUTES WITH PARAMETERS ====================

// Get store by code
router.get('/code/:code', storeController.getStoreByCode);

// Get available groups for a store (for dropdown)
router.get('/:storeId/available-groups', storeController.getAvailableGroupsForStore);

// Get all groups assigned to a store
router.get('/:storeId/groups', storeController.getStoreGroups);

// ==================== WILDCARD ROUTE (MUST BE LAST) ====================

// Get all stores with pagination and filtering
router.get('/', storeController.getAllStores);

// ⚠️ SINGLE STORE BY ID - MUST BE THE LAST GET ROUTE
router.get('/:id', storeController.getStoreById);

// ==================== POST ROUTES ====================

// Create a new store
router.post('/', storeController.createStore);

// Add group to store
router.post('/:storeId/groups/:groupId', storeController.addGroupToStore);

// ==================== PUT ROUTES ====================

// Update a store
router.put('/:id', storeController.updateStore);

// ==================== PATCH ROUTES ====================

// Update store status
router.patch('/:id/status', storeController.updateStoreStatus);

// ==================== DELETE ROUTES ====================

// Soft delete a store (set status to Closed)
router.delete('/:id', storeController.deleteStore);

// Permanently delete a store
router.delete('/:id/permanent', storeController.permanentDeleteStore);

// Remove group from store
router.delete('/:storeId/groups/:groupId', storeController.removeGroupFromStore);

module.exports = router;