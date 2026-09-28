// models/UnclaimedPayroll.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UnclaimedPayroll extends Model {
    static associate(models) {
      UnclaimedPayroll.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      UnclaimedPayroll.belongsTo(models.PayrollProcessing, {
        foreignKey: 'payroll_processing_id',
        as: 'payrollProcessing'
      });
    }
  }

  UnclaimedPayroll.init({
    unclaimed_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payroll_processing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'payroll_processing_id',
      references: { model: 'payroll_processing', key: 'processing_id' }
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id',
      references: { model: 'employees', key: 'employee_id' }
    },
    employee_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'employee_code'
    },
    employee_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'employee_name'
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'department'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'amount'
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date'
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      field: 'month',
      comment: 'YYYY-MM'
    },
    days_overdue: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'days_overdue'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'unclaimed',
      field: 'status',
      comment: 'unclaimed, paid, returned'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes'
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
    modelName: 'UnclaimedPayroll',
    tableName: 'unclaimed_payroll',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['payroll_processing_id'] },
      { fields: ['month'] },
      { fields: ['status'] },
      { fields: ['due_date'] },
      { fields: ['employee_code'] }
    ]
  });

  return UnclaimedPayroll;
};