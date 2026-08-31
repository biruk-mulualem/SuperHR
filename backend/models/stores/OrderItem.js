// models/OrderItem.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  }

  OrderItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'order_id'
      },
      itemName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'item_name'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      quantity: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false
      },
      uom: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      packaging: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      modelName: 'OrderItem',
      tableName: 'order_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return OrderItem;
};