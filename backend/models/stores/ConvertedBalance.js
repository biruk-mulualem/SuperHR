// models/ConvertedBalance.js
'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConvertedBalance extends Model {
    static associate(models) {
      ConvertedBalance.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store'
      });
      ConvertedBalance.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group'
      });
      ConvertedBalance.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item'
      });
    }
  }

  ConvertedBalance.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'store_id'
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id'
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id'
      },
      convertedBalance: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'converted_balance',
        validate: {
          min: 0
        }
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
      modelName: 'ConvertedBalance',
      tableName: 'converted_balances',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'group_id', 'item_id']
        }
      ]
    }
  );

  return ConvertedBalance;
};