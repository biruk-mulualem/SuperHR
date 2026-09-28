// models/OnHoldPayrollDetail.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OnHoldPayrollDetail extends Model {
    static associate(models) {
      OnHoldPayrollDetail.belongsTo(models.OnHoldPayroll, {
        foreignKey: 'onhold_id',
        as: 'onholdPayroll'
      });
      OnHoldPayrollDetail.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      OnHoldPayrollDetail.belongsTo(models.PayrollHistory, {
        foreignKey: 'payment_history_id',
        as: 'paymentRecord'
      });
    }
  }

  OnHoldPayrollDetail.init({
    detail_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    onhold_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'onhold_payroll', key: 'onhold_id' }
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' }
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      comment: 'YYYY-MM'
    },
    // Payroll components
    basic_salary: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    allowances_total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    overtime_pay: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    gross_pay: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Deductions
    absent_penalty: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    late_penalty: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    other_penalties: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    pension_7: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    pension_11: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_deductions: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Net amount held
    net_held_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    // Release tracking
    released_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'held',
      comment: 'held, released'
    },
    payment_history_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'payroll_history', key: 'history_id' }
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'OnHoldPayrollDetail',
    tableName: 'onhold_payroll_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['onhold_id'] },
      { fields: ['employee_id'] },
      { fields: ['month'] },
      { fields: ['status'] },
      { fields: ['onhold_id', 'month'], unique: true }
    ]
  });

  return OnHoldPayrollDetail;
};