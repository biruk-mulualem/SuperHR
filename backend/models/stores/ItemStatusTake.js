// models/ItemStatusTake.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemStatusTake extends Model {
    static associate(models) {
      ItemStatusTake.belongsTo(models.ItemStatusRule, {
        foreignKey: 'ruleId',
        as: 'rule',
        onDelete: 'CASCADE',
      });
      ItemStatusTake.belongsTo(models.ItemRequest, {
        foreignKey: 'requestId',
        as: 'request',
        onDelete: 'SET NULL',
      });
      ItemStatusTake.belongsTo(models.User, {
        foreignKey: 'takenBy',
        as: 'takenByUser',
      });
    }
  }

  ItemStatusTake.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id',
      },
      ruleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'rule_id',
        references: { model: 'item_status_rules', key: 'id' },
      },
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'request_id',
        references: { model: 'item_requests', key: 'id' },
      },
      requestCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'request_code',
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'quantity',
        validate: { min: 0.0001 },
      },
      uomCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'uom_code',
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'finalized'),
        allowNull: false,
        defaultValue: 'finalized',
      },
      takenAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'taken_at',
      },
      takenBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'taken_by',
        references: { model: 'users', key: 'user_id' },
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
      modelName: 'ItemStatusTake',
      tableName: 'item_status_takes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['rule_id'] },
        { fields: ['request_id'] },
        { fields: ['taken_at'] },
      ],
    }
  );

  return ItemStatusTake;
};