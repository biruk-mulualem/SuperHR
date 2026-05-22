// models/payroll/PayrollItem.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayrollItem extends Model {
    static associate(models) {
      // Only associate with models that definitely exist
      if (models.PayrollPeriod) {
        PayrollItem.belongsTo(models.PayrollPeriod, {
          foreignKey: 'period_id',
          as: 'period'
        });
      }
      
      if (models.Employee) {
        PayrollItem.belongsTo(models.Employee, {
          foreignKey: 'employee_id',
          as: 'employee'
        });
      }
      
      if (models.SalaryHold) {
        PayrollItem.belongsTo(models.SalaryHold, {
          foreignKey: 'hold_id',
          as: 'hold'
        });
      }
      
      // Comment out for now - will add after PaymentTransaction exists
      // if (models.PaymentTransaction) {
      //   PayrollItem.hasMany(models.PaymentTransaction, {
      //     foreignKey: 'payroll_item_id',
      //     as: 'payments'
      //   });
      // }
    }
  }

  PayrollItem.init({
    payroll_item_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_id'
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    basic_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'basic_salary'
    },
    housing_allowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'housing_allowance'
    },
    position_allowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'position_allowance'
    },
    transport_allowance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'transport_allowance'
    },
    total_allowances: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'total_allowances'
    },
    overtime_hours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: 'overtime_hours'
    },
    overtime_pay: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'overtime_pay'
    },
    bonus_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'bonus_amount'
    },
    other_income: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'other_income'
    },
    gross_pay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'gross_pay'
    },
    taxable_income: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'taxable_income'
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'tax_amount'
    },
    tax_bracket_applied: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'tax_bracket_applied'
    },
    pension_employee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'pension_employee'
    },
    pension_employer: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'pension_employer'
    },
    absent_days: {
      type: DataTypes.DECIMAL(5, 1),
      defaultValue: 0,
      field: 'absent_days'
    },
    absent_penalty: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'absent_penalty'
    },
    late_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'late_minutes'
    },
    late_penalty: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'late_penalty'
    },
    total_penalties: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'total_penalties'
    },
    loan_deduction: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'loan_deduction'
    },
    advance_deduction: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'advance_deduction'
    },
    cooperative_deduction: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'cooperative_deduction'
    },
    other_deductions: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'other_deductions'
    },
    total_deductions: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'total_deductions'
    },
    carry_forward_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'carry_forward_amount'
    },
    net_pay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'net_pay'
    },
    is_on_hold: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_on_hold'
    },
    hold_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'hold_id'
    },
    hold_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'hold_reason'
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
    modelName: 'PayrollItem',
    tableName: 'payroll_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { unique: true, fields: ['period_id', 'employee_id'] },
      { fields: ['employee_id'] },
      { fields: ['is_on_hold'] }
    ]
  });

  return PayrollItem;
};