// routes/penaltyRoutes.js

const express = require('express');
const router = express.Router();
const penalityController = require('../controllers/penalityController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware());

router.get('/employees/:employeeId/penalties', penalityController.getEmployeePenalties);
router.post('/employees/:employeeId/penalties', penalityController.createPenalty);
router.delete('/penalties/:penaltyId', penalityController.deletePenalty);
router.put('/penalties/:penaltyId/reduce', penalityController.reducePenalty);


module.exports = router;