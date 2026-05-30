// models/PenaltyReduction.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PenaltyReduction extends Model {
    static associate(models) {
      PenaltyReduction.belongsTo(models.AttendanceRecord, {
        foreignKey: 'penalty_id',
        as: 'attendance'
      });
      PenaltyReduction.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      PenaltyReduction.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      PenaltyReduction.belongsTo(models.User, {
        foreignKey: 'reduced_by',
        as: 'reducer'
      });
    }
  }

  PenaltyReduction.init({
    reduction_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    penalty_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'penalty_id'
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
    amount_reduced: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'amount_reduced'
    },
    percent_reduced: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: 'percent_reduced'
    },
    new_penalty_amount: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'new_penalty_amount'
    },
    new_penalty_percent: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'new_penalty_percent'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reason'
    },
    reduced_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reduced_by'
    },
    reduced_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'reduced_at'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'PenaltyReduction',
    tableName: 'penalty_reductions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    
    indexes: [
      { fields: ['penalty_id'] },
      { fields: ['employee_id'] },
      { fields: ['period_id'] },
      { fields: ['reduced_by'] }
    ]
  });

  return PenaltyReduction;
};