// routes/purchaseRequestRoutes.js
const express = require('express');
const router = express.Router();
const purchaseRequestController = require('../controllers/purchaseRequestController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadPurchaseRequestDocs } = require('../middleware/uploadMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware());

// ==================== PURCHASE REQUEST ROUTES ====================

// Stats
// GET /api/purchase-requests/stats
router.get('/stats', purchaseRequestController.getPurchaseRequestStats);
router.post('/check-balance', purchaseRequestController.checkBalance);

router.get(
  '/approved',

  purchaseRequestController.listApprovedPurchaseRequests
);
// List with pagination + filters
// GET /api/purchase-requests?page=1&limit=10&search=PR&status=draft&priority=high
router.get('/', purchaseRequestController.listPurchaseRequests);

// Approve with front & back documents (multipart/form-data)
// POST /api/purchase-requests/approve
router.post(
  '/approve',
  uploadPurchaseRequestDocs,
  purchaseRequestController.approvePurchaseRequest
);

// Get single
// GET /api/purchase-requests/:id
router.get('/:id', purchaseRequestController.getPurchaseRequestById);

// Create
// POST /api/purchase-requests
router.post('/', purchaseRequestController.createPurchaseRequest);

// Update (drafts only)
// PUT /api/purchase-requests/:id
router.put('/:id', purchaseRequestController.updatePurchaseRequest);

// Delete (drafts only)
// DELETE /api/purchase-requests/:id
router.delete('/:id', purchaseRequestController.deletePurchaseRequest);

module.exports = router;