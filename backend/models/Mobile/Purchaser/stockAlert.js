// models/stockAlert.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StockAlert extends Model {
    static associate(models) {
      StockAlert.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item',
      });
      StockAlert.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });
    }
  }

  StockAlert.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'item_id',
        references: { model: 'items', key: 'id' },
      },
      threshold: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
        defaultValue: 0,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
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
      modelName: 'StockAlert',
      tableName: 'stock_alerts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return StockAlert;
};