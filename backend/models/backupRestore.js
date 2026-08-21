'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BackupRestore extends Model {
    static associate(models) {
      BackupRestore.belongsTo(models.Backup, {
        foreignKey: 'backupId',
        as: 'backup'
      });
      
      BackupRestore.belongsTo(models.User, {
        foreignKey: 'restoredBy',
        as: 'restorer'
      });
    }
  }

  BackupRestore.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      backupId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'backup_id',
      },
      restoredBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'restored_by',
      },
      restoredFrom: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'restored_from',
      },
      restoreType: {
        type: DataTypes.ENUM('full', 'table'),
        defaultValue: 'full',
        allowNull: false,
        field: 'restore_type',
      },
      tableName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'table_name',
      },
      options: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      restoredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'restored_at',
      },
    },
    {
      sequelize,
      modelName: 'BackupRestore',
      tableName: 'backup_restores',
      timestamps: false,
      indexes: [
        { fields: ['backup_id'] },
        { fields: ['restored_at'] },
        { fields: ['restored_by'] },
        { fields: ['status'] },
      ],
    }
  );

  return BackupRestore;
};