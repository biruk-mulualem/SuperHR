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

// Get store by code
router.get('/code/:code', storeController.getStoreByCode);

// Get all stores with pagination and filtering
router.get('/', storeController.getAllStores);

// Get single store by ID
router.get('/:id', storeController.getStoreById);

// Create a new store
router.post('/', storeController.createStore);

// Update a store
router.put('/:id', storeController.updateStore);

// Update store status
router.patch('/:id/status', storeController.updateStoreStatus);

// Soft delete a store (set status to Closed)
router.delete('/:id', storeController.deleteStore);

// Permanently delete a store
router.delete('/:id/permanent', storeController.permanentDeleteStore);

// ==================== STORE-GROUP RELATIONSHIP ROUTES ====================

// Get available groups for a store (for dropdown)
router.get('/:storeId/available-groups', storeController.getAvailableGroupsForStore);

// Get all groups assigned to a store
router.get('/:storeId/groups', storeController.getStoreGroups);

// Add group to store
router.post('/:storeId/groups/:groupId', storeController.addGroupToStore);

// Remove group from store
router.delete('/:storeId/groups/:groupId', storeController.removeGroupFromStore);

module.exports = router;