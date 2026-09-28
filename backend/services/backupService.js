// FILE: services/backupService.js
const { Backup, BackupRestore, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../uploads/backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup({ format = 'sql', includeStructure = true, type = 'full', createdBy = 1 }) {
    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${timestamp}.${format}`;
    const filePath = path.join(this.backupDir, fileName);

    const tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'`,
      { type: QueryTypes.SELECT }
    );

    let backupData = {};

    for (const table of tables) {
      const tableName = table.table_name;
      const data = await sequelize.query(`SELECT * FROM "${tableName}"`, {
        type: QueryTypes.SELECT
      });

      if (includeStructure) {
        const structure = await sequelize.query(
          `SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE table_name = $1
           ORDER BY ordinal_position`,
          {
            bind: [tableName],
            type: QueryTypes.SELECT
          }
        );
        backupData[tableName] = { structure, data };
      } else {
        backupData[tableName] = data;
      }
    }

    const content = format === 'json'
      ? JSON.stringify(backupData, null, 2)
      : this.convertToSQL(backupData);

    fs.writeFileSync(filePath, content);

    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    const backup = await Backup.create({
      id: backupId,
      fileName,
      filePath,
      fileSize: `${sizeMB} MB`,
      type: type || 'full',
      format: format || 'sql',
      includeStructure: includeStructure || true,
      status: 'completed',
      createdBy: createdBy || 1,
      createdAt: new Date()
    });

    return backup;
  }

  async backupTable({ tableName, format = 'json', includeStructure = true, createdBy = 1 }) {
    const exists = await sequelize.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public'
      )`,
      {
        bind: [tableName],
        type: QueryTypes.SELECT
      }
    );

    if (!exists[0].exists) {
      throw new Error(`Table "${tableName}" does not exist`);
    }

    const data = await sequelize.query(`SELECT * FROM "${tableName}"`, {
      type: QueryTypes.SELECT
    });

    let backupData = {};
    if (includeStructure) {
      const structure = await sequelize.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position`,
        {
          bind: [tableName],
          type: QueryTypes.SELECT
        }
      );
      backupData = { structure, data };
    } else {
      backupData = { data };
    }

    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `table_${tableName}_${timestamp}.${format}`;
    const filePath = path.join(this.backupDir, fileName);

    const content = format === 'json'
      ? JSON.stringify(backupData, null, 2)
      : this.convertToSQL(backupData);

    fs.writeFileSync(filePath, content);

    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    const backup = await Backup.create({
      id: backupId,
      fileName,
      filePath,
      fileSize: `${sizeMB} MB`,
      type: 'table',
      format: format || 'json',
      includeStructure: includeStructure || true,
      tableName: tableName,
      status: 'completed',
      createdBy: createdBy || 1,
      createdAt: new Date()
    });

    return backup;
  }

  async getBackups({ page = 1, limit = 12 }) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Backup.findAndCountAll({
      where: { deletedAt: null },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      backups: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getBackup(id) {
    return await Backup.findByPk(id, {
      where: { deletedAt: null }
    });
  }

  async restoreBackup({ backupId, dropExisting = true, restoredBy = 1 }) {
    const backup = await this.getBackup(backupId);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const fileContent = fs.readFileSync(backup.filePath, 'utf8');
    const backupData = JSON.parse(fileContent);

    const transaction = await sequelize.transaction();

    try {
      for (const [tableName, tableData] of Object.entries(backupData)) {
        if (dropExisting) {
          await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`, {
            transaction
          });
        }

        if (tableData.structure) {
          const columns = tableData.structure.map(col =>
            `"${col.column_name}" ${col.data_type} ${col.is_nullable === 'YES' ? '' : 'NOT NULL'}`
          ).join(', ');
          await sequelize.query(`CREATE TABLE "${tableName}" (${columns})`, {
            transaction
          });
        }

        if (tableData.data && tableData.data.length > 0) {
          const columns = Object.keys(tableData.data[0]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const columnNames = columns.map(c => `"${c}"`).join(', ');

          for (const row of tableData.data) {
            const values = columns.map(col => row[col]);
            await sequelize.query(
              `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`,
              {
                bind: values,
                transaction
              }
            );
          }
        }
      }

      await backup.update({
        restoredBy: restoredBy,
        restoredAt: new Date()
      }, { transaction });

      await BackupRestore.create({
        backupId: backup.id,
        restoredBy: restoredBy,
        restoreType: 'full',
        status: 'completed',
        options: { dropExisting },
        restoredAt: new Date()
      }, { transaction });

      await transaction.commit();
      return { success: true, restoredTables: Object.keys(backupData) };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async restoreFromFile({ filePath, type = 'full', targetTable, dropExisting = true, restoredBy = 1 }) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let backupData;

    try {
      backupData = JSON.parse(fileContent);
    } catch {
      backupData = this.parseSQL(fileContent);
    }

    const transaction = await sequelize.transaction();

    try {
      if (type === 'full') {
        for (const [tableName, tableData] of Object.entries(backupData)) {
          await this.restoreTableData(tableName, tableData, dropExisting, transaction);
        }
      } else if (type === 'table' && targetTable) {
        if (backupData[targetTable]) {
          await this.restoreTableData(targetTable, backupData[targetTable], dropExisting, transaction);
        } else {
          throw new Error(`Table "${targetTable}" not found in backup file`);
        }
      }

      await BackupRestore.create({
        restoredBy: restoredBy,
        restoredFrom: path.basename(filePath),
        restoreType: type,
        tableName: targetTable || null,
        status: 'completed',
        options: { dropExisting },
        restoredAt: new Date()
      }, { transaction });

      await transaction.commit();
      fs.unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async restoreTableData(tableName, tableData, dropExisting, transaction) {
    if (dropExisting) {
      await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`, { transaction });
    }

    if (tableData.structure) {
      const columns = tableData.structure.map(col =>
        `"${col.column_name}" ${col.data_type} ${col.is_nullable === 'YES' ? '' : 'NOT NULL'}`
      ).join(', ');
      await sequelize.query(`CREATE TABLE "${tableName}" (${columns})`, { transaction });
    }

    if (tableData.data && tableData.data.length > 0) {
      const columns = Object.keys(tableData.data[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnNames = columns.map(c => `"${c}"`).join(', ');

      for (const row of tableData.data) {
        const values = columns.map(col => row[col]);
        await sequelize.query(
          `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`,
          {
            bind: values,
            transaction
          }
        );
      }
    }
  }

  async deleteBackup(id) {
    const backup = await this.getBackup(id);
    if (!backup) return false;

    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    await backup.destroy();
    return true;
  }

  async getTables() {
    const tables = await sequelize.query(
      `SELECT 
        table_name as name,
        (SELECT COUNT(*) FROM "${table_name}") as record_count,
        pg_total_relation_size('"' || table_name || '"') as size_bytes
       FROM information_schema.tables
       WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      { type: QueryTypes.SELECT }
    );

    return tables.map(row => ({
      name: row.name,
      label: row.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      recordCount: parseInt(row.record_count) || 0,
      size: this.formatBytes(row.size_bytes || 0)
    }));
  }

  async deleteTable({ tableName }) {
    const transaction = await sequelize.transaction();
    try {
      await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`, { transaction });
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async clearTable({ tableName }) {
    const transaction = await sequelize.transaction();
    try {
      await sequelize.query(`DELETE FROM "${tableName}"`, { transaction });
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getStats() {
    const totalBackups = await Backup.count({ where: { deletedAt: null } });

    const fullBackups = await Backup.count({
      where: { deletedAt: null, type: 'full' }
    });

    const tableBackups = await Backup.count({
      where: { deletedAt: null, type: 'table' }
    });

    const result = await sequelize.query(
      `SELECT SUM(CAST(REPLACE(file_size, ' MB', '') AS DECIMAL)) as total_mb
       FROM backups
       WHERE deleted_at IS NULL`,
      { type: QueryTypes.SELECT }
    );

    const totalMB = parseFloat(result[0]?.total_mb || 0);
    const tables = await this.getTables();
    const totalRecords = tables.reduce((sum, t) => sum + t.recordCount, 0);

    return {
      totalTables: tables.length,
      totalRecords: totalRecords,
      totalBackups: totalBackups,
      fullBackups: fullBackups,
      tableBackups: tableBackups,
      storageUsed: this.formatBytes(totalMB * 1024 * 1024)
    };
  }

  convertToSQL(data) {
    let sql = '-- Database Backup\n\n';
    for (const [tableName, tableData] of Object.entries(data)) {
      sql += `-- Table: ${tableName}\n`;
      if (tableData.structure) {
        const columns = tableData.structure.map(col =>
          `"${col.column_name}" ${col.data_type} ${col.is_nullable === 'YES' ? '' : 'NOT NULL'}`
        ).join(', ');
        sql += `CREATE TABLE "${tableName}" (${columns});\n\n`;
      }
      if (tableData.data && tableData.data.length > 0) {
        const columns = Object.keys(tableData.data[0]);
        const columnNames = columns.map(c => `"${c}"`).join(', ');
        for (const row of tableData.data) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          }).join(', ');
          sql += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
        }
        sql += '\n';
      }
    }
    return sql;
  }

  parseSQL(sqlContent) {
    const backupData = {};
    const tableMatches = sqlContent.match(/CREATE TABLE "([^"]+)"/g);
    if (tableMatches) {
      for (const match of tableMatches) {
        const tableName = match.match(/"([^"]+)"/)[1];
        backupData[tableName] = { structure: [], data: [] };
      }
    }
    return backupData;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }
}

module.exports = new BackupService();