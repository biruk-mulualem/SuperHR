'use strict';
const express = require('express');
const router = express.Router();
const c = require('../../controllers/Mobile/mobileLowStockController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.use(authMiddleware());

router.get('/alerts',         c.getAlerts);
router.post('/alerts',        c.createAlert);
router.delete('/alerts/:id',  c.deleteAlert);

module.exports = router;