// FILE: backend/controllers/backupController.js
const backupService = require('../services/backupService');
const fs = require('fs');
const path = require('path');

class BackupController {
  /**
   * Create a full database backup
   */
  async createBackup(req, res) {
    try {
      const { format = 'sql', includeStructure = true } = req.body;
      
      const backup = await backupService.createBackup({
        format,
        includeStructure,
        type: 'full',
        createdBy: req.user?.id || 1
      });
      
      res.status(201).json({
        success: true,
        message: 'Backup created successfully',
        data: backup
      });
    } catch (error) {
      console.error('Create backup error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create backup'
      });
    }
  }

  /**
   * Backup a specific table
   */
 // FILE: backend/controllers/backupController.js
// Update the backupTable method

/**
 * Backup a specific table
 */
async backupTable(req, res) {
  try {
    // ✅ Support both 'tableName' and 'table_name' for compatibility
    const tableName = req.body.tableName || req.body.table_name;
    const format = req.body.format || 'json';
    const includeStructure = req.body.includeStructure !== undefined ? req.body.includeStructure : true;
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Table name is required'
      });
    }
    
    const backup = await backupService.backupTable({
      tableName,
      format,
      includeStructure,
      createdBy: req.user?.id || 1
    });
    
    res.status(201).json({
      success: true,
      message: `Table "${tableName}" backed up successfully`,
      data: backup
    });
  } catch (error) {
    console.error('Backup table error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to backup table'
    });
  }
}

  /**
   * Get all backups
   */
  async getBackups(req, res) {
    try {
      const { page = 1, limit = 12 } = req.query;
      
      const result = await backupService.getBackups({
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Get backups error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get backups'
      });
    }
  }

  /**
   * Get a single backup
   */
  async getBackup(req, res) {
    try {
      const { id } = req.params;
      
      const backup = await backupService.getBackup(id);
      
      if (!backup) {
        return res.status(404).json({
          success: false,
          error: 'Backup not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: backup
      });
    } catch (error) {
      console.error('Get backup error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get backup'
      });
    }
  }

  /**
   * Download a backup
   */
  async downloadBackup(req, res) {
    try {
      const { id } = req.params;
      
      const backup = await backupService.getBackup(id);
      
      if (!backup) {
        return res.status(404).json({
          success: false,
          error: 'Backup not found'
        });
      }
      
      const filePath = backup.filePath;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Backup file not found'
        });
      }
      
      res.download(filePath, backup.fileName);
    } catch (error) {
      console.error('Download backup error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to download backup'
      });
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(req, res) {
    try {
      const { id } = req.params;
      const { dropExisting = true } = req.body;
      
      const result = await backupService.restoreBackup({
        backupId: id,
        dropExisting,
        restoredBy: req.user?.id || 1
      });
      
      res.status(200).json({
        success: true,
        message: 'Backup restored successfully',
        data: result
      });
    } catch (error) {
      console.error('Restore backup error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to restore backup'
      });
    }
  }

  /**
   * Restore from uploaded file
   */
  async restoreFromFile(req, res) {
    try {
      const { type = 'full', targetTable, dropExisting = true, includeData = true } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }
      
      // Validate file type
      const allowedTypes = ['.json', '.sql', '.zip', '.csv'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedTypes.includes(ext)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported file format. Allowed: ${allowedTypes.join(', ')}`
        });
      }
      
      const result = await backupService.restoreFromFile({
        filePath: file.path,
        fileType: ext,
        type,
        targetTable,
        dropExisting,
        includeData,
        restoredBy: req.user?.id || 1
      });
      
      res.status(200).json({
        success: true,
        message: 'Database restored from file successfully',
        data: result
      });
    } catch (error) {
      console.error('Restore from file error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to restore from file'
      });
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await backupService.deleteBackup(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Backup not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } catch (error) {
      console.error('Delete backup error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete backup'
      });
    }
  }

  /**
   * Get all tables with stats
   */
  async getTables(req, res) {
    try {
      const tables = await backupService.getTables();
      
      res.status(200).json({
        success: true,
        data: tables
      });
    } catch (error) {
      console.error('Get tables error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get tables'
      });
    }
  }

  /**
   * Delete a table
   */
  async deleteTable(req, res) {
    try {
      const { tableName } = req.params;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          error: 'Table name is required'
        });
      }
      
      const result = await backupService.deleteTable({
        tableName,
        deletedBy: req.user?.id || 1
      });
      
      res.status(200).json({
        success: true,
        message: `Table "${tableName}" deleted successfully`,
        data: result
      });
    } catch (error) {
      console.error('Delete table error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete table'
      });
    }
  }

  /**
   * Clear table data
   */
  async clearTable(req, res) {
    try {
      const { tableName } = req.params;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          error: 'Table name is required'
        });
      }
      
      const result = await backupService.clearTable({
        tableName,
        clearedBy: req.user?.id || 1
      });
      
      res.status(200).json({
        success: true,
        message: `Table "${tableName}" cleared successfully`,
        data: result
      });
    } catch (error) {
      console.error('Clear table error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to clear table'
      });
    }
  }

  /**
   * Get backup statistics
   */
  async getStats(req, res) {
    try {
      const stats = await backupService.getStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get stats'
      });
    }
  }
}

// ✅ IMPORTANT: Export an instance, not the class
module.exports = new BackupController();