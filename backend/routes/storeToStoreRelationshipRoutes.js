// routes/storeToStoreRelationshipRoutes.js
const express = require('express');
const router = express.Router();
const relationshipController = require('../controllers/storeToStoreRelationshipController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== RELATIONSHIP ROUTES ====================

// Get relationship statistics
router.get('/statistics', relationshipController.getRelationshipStatistics);

// Generate next relationship code
router.get('/generate-code', relationshipController.generateRelationshipCode);

// Export relationships as CSV
router.get('/export', relationshipController.exportRelationships);

// Get all relationships with pagination and filtering
router.get('/', relationshipController.getAllRelationships);

// Get single relationship by ID
router.get('/:id', relationshipController.getRelationshipById);

// Create a new relationship
router.post('/', relationshipController.createRelationship);

// Update a relationship
router.put('/:id', relationshipController.updateRelationship);

// Update relationship status
router.patch('/:id/status', relationshipController.updateRelationshipStatus);

// Soft delete a relationship (set status to inactive)
router.delete('/:id', relationshipController.deleteRelationship);

// Permanently delete a relationship
router.delete('/:id/permanent', relationshipController.permanentDeleteRelationship);

module.exports = router;