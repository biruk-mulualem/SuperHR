// routes/webSessionRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const WebSessionController = require('../controllers/webSessionController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================================================
// PUBLIC (none — web session APIs are all authenticated)
// ============================================================================

// ============================================================================
// PROTECTED (Any authenticated user)
// ============================================================================
router.use(authMiddleware());

// Heartbeat — called by the web client on boot / periodically
router.post('/web/sessions/heartbeat', WebSessionController.heartbeat);

// List my own sessions
router.get('/web/sessions', WebSessionController.listMySessions);

// Sign out one of my own sessions
router.post('/web/sessions/:id/revoke', WebSessionController.revokeMySession);

// ============================================================================
// ADMIN ONLY
// ============================================================================

// Stats tile
router.get('/admin/web-sessions/stats', WebSessionController.getStats);

// List every web session
router.get('/admin/web-sessions', WebSessionController.listAll);

// Get one
router.get('/admin/web-sessions/:id', WebSessionController.getById);

// Terminate (kill)
router.post('/admin/web-sessions/:id/terminate', WebSessionController.terminate);

// Allow again (un-kill)
router.post('/admin/web-sessions/:id/allow', WebSessionController.allow);

// Terminate all sessions for a specific user
router.post('/admin/users/:userId/terminate-all-sessions', WebSessionController.terminateAllForUser);

// Delete the row entirely
router.delete('/admin/web-sessions/:id', WebSessionController.delete);

module.exports = router;