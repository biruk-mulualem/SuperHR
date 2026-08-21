'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Backup extends Model {
    static associate(models) {
      Backup.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
      
      Backup.belongsTo(models.User, {
        foreignKey: 'restoredBy',
        as: 'restorer'
      });
      
      Backup.hasMany(models.BackupRestore, {
        foreignKey: 'backupId',
        as: 'restores'
      });
    }
  }

  Backup.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'file_name',
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'file_path',
      },
      fileSize: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'file_size',
      },
      type: {
        type: DataTypes.ENUM('full', 'table', 'partial'),
        defaultValue: 'full',
        allowNull: false,
      },
      format: {
        type: DataTypes.ENUM('sql', 'json', 'csv'),
        defaultValue: 'sql',
        allowNull: false,
      },
      includeStructure: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'include_structure',
      },
      tableName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'table_name',
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
      },
      restoredBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'restored_by',
      },
      restoredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'restored_at',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      modelName: 'Backup',
      tableName: 'backups',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: true,
      indexes: [
        { fields: ['created_at'] },
        { fields: ['type'] },
        { fields: ['status'] },
        { fields: ['deleted_at'] },
        { fields: ['created_by'] },
        { fields: ['table_name'] },
      ],
    }
  );

  return Backup;
};