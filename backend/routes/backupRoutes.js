// routes/backupRoutes.js
'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createBackup,
  listBackups,
  downloadBackup,
  restoreBackup,
  deleteBackup,
  getBackupSettings,
  updateBackupSettings,
} = require('../controllers/backupController');

// All backup routes require authentication and admin role
const adminOnly = authMiddleware('admin');

/**
 * @route   GET /api/backup/settings
 * @desc    Get auto-backup settings
 * @access  Admin only
 */
router.get('/settings', adminOnly, getBackupSettings);

/**
 * @route   POST /api/backup/settings
 * @desc    Update auto-backup settings
 * @access  Admin only
 */
router.post('/settings', adminOnly, updateBackupSettings);

/**
 * @route   POST /api/backup/create
 * @desc    Create a full system backup (DB + uploads)
 * @access  Admin only
 */
router.post('/create', adminOnly, createBackup);

/**
 * @route   GET /api/backup/list
 * @desc    List all available backup files
 * @access  Admin only
 */
router.get('/list', adminOnly, listBackups);

/**
 * @route   GET /api/backup/download/:filename
 * @desc    Download a specific backup file
 * @access  Admin only
 */
router.get('/download/:filename', adminOnly, downloadBackup);

/**
 * @route   POST /api/backup/restore/:filename
 * @desc    Restore system from a named backup file
 * @access  Admin only
 */
router.post('/restore/:filename', adminOnly, restoreBackup);

/**
 * @route   DELETE /api/backup/:filename
 * @desc    Delete a backup file
 * @access  Admin only
 */
router.delete('/:filename', adminOnly, deleteBackup);

module.exports = router;
