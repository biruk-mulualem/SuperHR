'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExcludeItemFromCost extends Model {
    static associate(models) {
      ExcludeItemFromCost.belongsTo(models.Item, {
        foreignKey: 'item_id',
        as: 'item'
      });
      ExcludeItemFromCost.belongsTo(models.User, {
        foreignKey: 'excluded_by',
        as: 'excludedBy'
      });
    }
  }

  ExcludeItemFromCost.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'items',
        key: 'id'
      },
      unique: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    excluded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    excluded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'ExcludeItemFromCost',
    tableName: 'exclude_item_from_cost',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ExcludeItemFromCost;
};