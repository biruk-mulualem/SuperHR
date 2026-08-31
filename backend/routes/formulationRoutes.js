// routes/formulationRoutes.js
'use strict';
const express = require('express');
const router = express.Router();
const FormulationController = require('../controllers/formulationController');
const { authMiddleware } = require("../middleware/authMiddleware");

// ================================================================
// AUTHENTICATION MIDDLEWARE (Apply to all routes)
// ================================================================
router.use(authMiddleware());

// ================================================================
// STATISTICS ROUTES (must come before /:id routes)
// ================================================================
router.get('/stats', FormulationController.getStats);

// ================================================================
// BULK IMPORT ROUTE
// ================================================================
router.post('/import', authMiddleware(), FormulationController.bulkImport);

// ================================================================
// GET VERSIONS BY FINISHED GOOD
// ================================================================
router.get('/versions/:finishedGoodId', FormulationController.getVersions);

// ================================================================
// MAIN CRUD ROUTES
// ================================================================

// GET all formulations (with pagination, search, filters)
router.get('/', FormulationController.getAll);

// CREATE new formulation
router.post('/', authMiddleware(), FormulationController.create);

// ================================================================
// SINGLE FORMULATION ROUTES
// ================================================================

// GET formulation by ID
router.get('/:id', FormulationController.getById);

// UPDATE formulation
router.put('/:id', authMiddleware(), FormulationController.update);

// DELETE formulation
router.delete('/:id', authMiddleware(), FormulationController.delete);

// UPDATE formulation status
router.patch('/:id/status', authMiddleware(), FormulationController.updateStatus);

// GET raw materials for formulation
router.get('/:id/materials', FormulationController.getMaterials);

module.exports = router;