'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchaseFollowUpController');

// Adjust to your project's auth middleware
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware());



// Static paths first
router.get('/stats', ctrl.getFollowUpStats);
router.get('/',      ctrl.listFollowUps);
router.post(
  '/:prId/send-to-boss',
  ctrl.sendToBoss
);
// Price actions
router.post('/items/:itemId/prices',   ctrl.submitPrice);
router.put('/prices/:priceId',         ctrl.updatePrice);
router.delete('/prices/:priceId',      ctrl.removePrice);
router.put('/items/:itemId/winner',    ctrl.selectWinner);

// Dispatch actions
router.put('/:prId/dispatches',        ctrl.setDispatches);
router.delete('/dispatches/:id',       ctrl.removeDispatch);

// Single follow-up
router.get('/:prId', ctrl.getFollowUp);

module.exports = router;