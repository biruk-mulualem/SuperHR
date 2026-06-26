const express = require("express");
const router = express.Router();
const letterTemplateController = require("../controllers/letterTemplateController");
const { authMiddleware } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware());

// Routes
router.get("/", letterTemplateController.getAllLetterTemplates);
router.get("/:id", letterTemplateController.getLetterTemplateById);
router.post("/", letterTemplateController.createLetterTemplate);
router.put("/:id", letterTemplateController.updateLetterTemplate);
router.delete("/:id", letterTemplateController.deleteLetterTemplate);

module.exports = router;
