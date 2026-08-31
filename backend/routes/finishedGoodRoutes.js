// routes/finishedGoodRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const finishedGoodController = require('../controllers/finishedGoodController');
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = multer({ dest: 'uploads/' });

// ================================================================
// FINISHED GOOD ROUTES
// ================================================================

router.use(authMiddleware());


// GET /api/finished-goods - Get all finished goods
router.get('/', authMiddleware(), finishedGoodController.getFinishedGoods);

// GET /api/finished-goods/stats - Get stats
router.get('/stats', authMiddleware(), finishedGoodController.getStats);

// GET /api/finished-goods/next-code - Get next FG code
router.get('/next-code', authMiddleware(), finishedGoodController.getNextFgCode);

// GET /api/finished-goods/:id - Get finished good by ID
router.get('/:id', authMiddleware(), finishedGoodController.getFinishedGoodById);

// POST /api/finished-goods - Create finished good
router.post('/', authMiddleware(), finishedGoodController.createFinishedGood);

// POST /api/finished-goods/import - Bulk import
router.post(
  '/import',
  authMiddleware(),
  upload.single('file'),
  finishedGoodController.bulkImport
);

// PUT /api/finished-goods/:id - Update finished good
router.put('/:id', authMiddleware(), finishedGoodController.updateFinishedGood);

// DELETE /api/finished-goods/:id - Delete finished good
router.delete('/:id', authMiddleware(), finishedGoodController.deleteFinishedGood);

module.exports = router;