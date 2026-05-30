// models/CarryForward.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CarryForward extends Model {
    static associate(models) {
      CarryForward.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      CarryForward.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      CarryForward.belongsTo(models.PayrollPeriod, {
        foreignKey: 'cleared_in_period_id',
        as: 'cleared_period'
      });
    }
  }

  CarryForward.init({
    carry_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_id'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'cleared', 'written_off'),
      defaultValue: 'pending',
    },
    cleared_in_period_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cleared_in_period_id'
    },
    cleared_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cleared_at'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'CarryForward',
    tableName: 'carry_forwards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] }
    ]
  });

  return CarryForward;
};