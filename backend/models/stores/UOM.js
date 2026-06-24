'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UOM extends Model {
    static associate(models) {
      UOM.hasMany(models.Item, { 
        foreignKey: 'uomId',
        as: 'items'
      });
      UOM.hasMany(models.Item, { 
        foreignKey: 'conversionUomId',
        as: 'conversionItems'
      });
    }
  }

  UOM.init(
    {
      uomId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id',
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
          isUppercase: true,
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
        allowNull: false,
      },
      isActive: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.status === 'Active';
        },
        set(value) {
          this.status = value ? 'Active' : 'Inactive';
        }
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
      modelName: 'UOM',
      tableName: 'uom',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return UOM;
};