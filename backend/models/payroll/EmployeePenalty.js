// models/EmployeePenalty.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeePenalty extends Model {
    static associate(models) {
      EmployeePenalty.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      EmployeePenalty.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      EmployeePenalty.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  }

  EmployeePenalty.init({
    penalty_id: {
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
      allowNull: true,
      field: 'period_id',
      comment: 'Payroll period this penalty applies to'
    },
    // Penalty type from your dropdown
    penalty_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'penalty_type',
      comment: 'e.g., Excessive Absenteeism, Chronic Lateness, etc.'
    },
    // Calculation type
    calculation_type: {
      type: DataTypes.ENUM('fixed', 'percent'),
      defaultValue: 'fixed',
      field: 'calculation_type'
    },
    // Value (either fixed amount or percentage)
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'value'
    },
    // Calculated amount (for percent type, this is value% of salary)
    calculated_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'calculated_amount'
    },
    // Reference number
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'reference'
    },
    // Who submitted this penalty
    submitted_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'submitted_by'
    },
    // Contact person
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'contact'
    },
    // Reason for penalty
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reason'
    },
    // Month this penalty is for (YYYY-MM)
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      field: 'month'
    },
    // Status
    status: {
      type: DataTypes.ENUM('active', 'applied', 'cancelled', 'reduced'),
      defaultValue: 'active',
      field: 'status'
    },
    // If penalty was reduced
    original_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'original_value',
      comment: 'Original value before reduction'
    },
    reduction_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reduction_reason',
      comment: 'Reason for penalty reduction'
    },
    reduced_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'reduced_by'
    },
    reduced_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reduced_at'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'EmployeePenalty',
    tableName: 'employee_penalties',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['period_id'] },
      { fields: ['month'] },
      { fields: ['status'] },
      { fields: ['employee_id', 'month'] }
    ]
  });

  return EmployeePenalty;
};


