// models/payroll/PayrollPeriod.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayrollPeriod extends Model {
    static associate(models) {
      PayrollPeriod.hasMany(models.PayrollItem, {
        foreignKey: 'period_id',
        as: 'payroll_items'
      });
      PayrollPeriod.belongsTo(models.User, {
        foreignKey: 'processed_by',
        as: 'processor'
      });
      PayrollPeriod.hasMany(models.SalaryHold, {
        foreignKey: 'period_id',
        as: 'salary_holds'
      });
      PayrollPeriod.hasMany(models.PaymentSession, {
        foreignKey: 'period_id',
        as: 'payment_sessions'
      });
      PayrollPeriod.hasMany(models.CarryForward, {
        foreignKey: 'period_id',
        as: 'carry_forwards'
      });
      PayrollPeriod.hasMany(models.DeductionApplication, {
        foreignKey: 'period_id',
        as: 'deduction_applications'
      });
    }

    getDisplayName() {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[this.month - 1]} ${this.year}`;
    }

    isClosed() {
      return this.status === 'closed';
    }

    isReadyForPayment() {
      return this.status === 'processed';
    }
  }

  PayrollPeriod.init({
    period_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    period_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      field: 'period_code'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date'
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'payment_date'
    },
    status: {
      type: DataTypes.ENUM('draft', 'processing', 'processed', 'paid', 'closed'),
      defaultValue: 'draft',
    },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'processed_by'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at'
    },
    total_employees: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_employees'
    },
    total_basic_salary: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_basic_salary'
    },
    total_allowances: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_allowances'
    },
    total_overtime: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_overtime'
    },
    total_gross: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_gross'
    },
    total_tax: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_tax'
    },
    total_pension_employee: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_pension_employee'
    },
    total_pension_employer: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_pension_employer'
    },
    total_penalties: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_penalties'
    },
    total_deductions: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_deductions'
    },
    total_net: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_net'
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
    modelName: 'PayrollPeriod',
    tableName: 'payroll_periods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { unique: true, fields: ['year', 'month'] },
      { fields: ['status'] }
    ]
  });

  return PayrollPeriod;
};