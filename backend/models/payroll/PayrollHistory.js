// models/PayrollHistory.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayrollHistory extends Model {
    static associate(models) {
      PayrollHistory.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      PayrollHistory.belongsTo(models.PayrollProcessing, {
        foreignKey: 'payroll_processing_id',
        as: 'payrollProcessing'
      });
    }
  }

  PayrollHistory.init({
    history_id: {
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
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'payment_date'
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      field: 'month',
      comment: 'YYYY-MM'
    },
    method: {
      type: DataTypes.STRING(50),
      defaultValue: 'Bank Transfer',
      field: 'method'
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'transaction_id'
    },
    processed_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'processed_by'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'completed',
      field: 'status'
    },
    source: {
      type: DataTypes.STRING(20),
      defaultValue: 'normal',
      field: 'source',
      comment: 'normal, unclaimed, returned'
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
    }
  }, {
    sequelize,
    modelName: 'PayrollHistory',
    tableName: 'payroll_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['payroll_processing_id'] },
      { fields: ['month'] },
      { fields: ['payment_date'] },
      { fields: ['source'] },
      { fields: ['employee_code'] },
      { fields: ['status'] }
    ]
  });

  return PayrollHistory;
};