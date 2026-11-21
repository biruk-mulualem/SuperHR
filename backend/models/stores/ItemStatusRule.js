// models/ItemStatusRule.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemStatusRule extends Model {
    static associate(models) {
      ItemStatusRule.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store',
      });
      ItemStatusRule.belongsTo(models.Department, {
        foreignKey: 'departmentId',
        as: 'department',
      });
      ItemStatusRule.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item',
      });
      ItemStatusRule.belongsTo(models.UOM, {
        foreignKey: 'uomId',
        as: 'uom',
      });
      ItemStatusRule.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'createdByUser',
      });
      ItemStatusRule.hasMany(models.ItemStatusTake, {
        foreignKey: 'ruleId',
        as: 'takes',
        onDelete: 'CASCADE',
      });
    }

    isBlockedAt(at = new Date()) {
      const takes = this.takes || [];
      const windowStart = new Date(
        at.getTime() - this.frequencyDays * 24 * 60 * 60 * 1000
      );
      const totalInWindow = takes.reduce((sum, t) => {
        const tDate = new Date(t.takenAt);
        if (tDate >= windowStart && tDate <= at) {
          return sum + (Number(t.quantity) || 0);
        }
        return sum;
      }, 0);
      return totalInWindow >= Number(this.maxQuantity);
    }
  }

  ItemStatusRule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id',
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'store_id',
        references: { model: 'stores', key: 'id' },
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'department_id',
        references: { model: 'departments', key: 'department_id' },
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id',
        references: { model: 'items', key: 'id' },
      },
      uomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'uom_id',
        references: { model: 'uom', key: 'id' },
      },
      uomCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'uom_code',
      },
      maxQuantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'max_quantity',
        validate: { min: 0.01 },
      },
      frequencyDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'frequency_days',
        validate: { min: 1 },
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Active', 'Deleted'),
        allowNull: false,
        defaultValue: 'Active',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: { model: 'users', key: 'user_id' },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
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
      modelName: 'ItemStatusRule',
      tableName: 'item_status_rules',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['store_id'] },
        { fields: ['department_id'] },
        { fields: ['item_id'] },
      ],
    }
  );

  return ItemStatusRule;
};