// models/PrintOverride.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PrintOverride extends Model {
    static associate(models) {
      PrintOverride.belongsTo(models.ItemRequest, {
        foreignKey: 'requestId',
        as: 'request',
        targetKey: 'requestId',
      });

      PrintOverride.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        targetKey: 'userId',
      });

      PrintOverride.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updatedByUser',
        targetKey: 'userId',
      });
    }
  }

  PrintOverride.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'request_id',
        references: { model: 'item_requests', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      department: { type: DataTypes.STRING(255), allowNull: true },
      approvedByName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'approved_by_name',
      },
      overrideDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'override_date',
      },
      customHeader: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'custom_header',
      },

      sectionVisibility: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        field: 'section_visibility',
      },
      columnsConfig: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        field: 'columns_config',
      },
      customCells: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        field: 'custom_cells',
      },

      // ✅ NEW — the entire page, in one blob
      pageSnapshot: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
        field: 'page_snapshot',
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'PrintOverride',
      tableName: 'print_overrides',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return PrintOverride;
};