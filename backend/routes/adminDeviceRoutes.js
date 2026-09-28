// routes/adminDevices.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes here are admin-only (checked inside the controller too)
router.use(authMiddleware('admin', 'superadmin'));

// Stats — put BEFORE the /:id route so it isn't shadowed
router.get('/devices/stats', deviceController.getDeviceStats);

// List + filter devices
router.get('/devices', deviceController.listDevices);

// Devices for a specific user
router.get('/users/:userId/devices', deviceController.listUserDevices);

// Single device
router.get('/devices/:id', deviceController.getDevice);

// Actions
router.post('/devices/:id/approve', deviceController.approveDevice);
router.post('/devices/:id/block',   deviceController.blockDevice);
router.post('/devices/:id/unblock', deviceController.unblockDevice);
router.delete('/devices/:id',       deviceController.deleteDevice);

module.exports = router;