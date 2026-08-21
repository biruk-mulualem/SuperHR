// FILE: backend/routes/backupRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/backups/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'application/sql', 'application/zip', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ============================================
// BACKUP ROUTES
// ============================================

// Create backup
router.post('/backup',  backupController.createBackup);

// Backup specific table
router.post('/backup/table',  backupController.backupTable);

// Get all backups with pagination
router.get('/backups',  backupController.getBackups);

// Get single backup
router.get('/backup/:id',  backupController.getBackup);

// Download backup
router.get('/backup/:id/download',  backupController.downloadBackup);

// Restore from backup
router.post('/backup/:id/restore',  backupController.restoreBackup);

// Restore from uploaded file
router.post('/backup/restore-file',  upload.single('file'), backupController.restoreFromFile);

// Delete backup
router.delete('/backup/:id',  backupController.deleteBackup);

// ============================================
// TABLE MANAGEMENT ROUTES
// ============================================

// Get all tables with stats
router.get('/tables',  backupController.getTables);

// Delete a table
router.delete('/table/:tableName',  backupController.deleteTable);

// Clear table data
router.post('/table/:tableName/clear',  backupController.clearTable);

// ============================================
// STATS ROUTE
// ============================================

// Get backup statistics
router.get('/stats',  backupController.getStats);

module.exports = router;