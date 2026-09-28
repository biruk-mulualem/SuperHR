// routes/mobilePurchaserRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

const c = require('../../controllers/Mobile/mobilePurchaserController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware());

// Dashboard
router.get('/', c.getDashboard);
router.get('/summary', c.getSummary);

// Pending Submission
router.get('/requests', c.listPendingRequests);
router.get('/requests/:id', c.getRequestDetail);

// Submitted
router.get('/submitted', c.listSubmittedRequests);

// Price actions
router.post('/items/:itemId/prices', c.submitPrice);
router.put('/prices/:priceId', c.updatePrice);

module.exports = router;