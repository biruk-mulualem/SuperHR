// models/HoldRelease.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HoldRelease extends Model {
    static associate(models) {
      HoldRelease.belongsTo(models.SalaryHold, {
        foreignKey: 'hold_id',
        as: 'hold'
      });
      HoldRelease.belongsTo(models.User, {
        foreignKey: 'released_by',
        as: 'releaser'
      });
      HoldRelease.belongsTo(models.PayrollPeriod, {
        foreignKey: 'applied_to_period_id',
        as: 'applied_period'
      });
    }
  }

  HoldRelease.init({
    release_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hold_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'hold_id'
    },
    release_type: {
      type: DataTypes.STRING(20),
      field: 'release_type'
    },
    release_percent: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'release_percent'
    },
    release_amount: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'release_amount'
    },
    release_reason: {
      type: DataTypes.TEXT,
      field: 'release_reason'
    },
    released_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'released_by'
    },
    released_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'released_at'
    },
    applied_to_period_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'applied_to_period_id'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'HoldRelease',
    tableName: 'hold_releases',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  return HoldRelease;
};