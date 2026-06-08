// models/ReturnedPayroll.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReturnedPayroll extends Model {
    static associate(models) {
      ReturnedPayroll.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      ReturnedPayroll.belongsTo(models.PayrollProcessing, {
        foreignKey: 'payroll_processing_id',
        as: 'payrollProcessing'
      });
      ReturnedPayroll.belongsTo(models.PayrollHistory, {
        foreignKey: 'original_payment_id',
        as: 'originalPayment'
      });
    }
  }

  ReturnedPayroll.init({
    returned_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    payroll_processing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'payroll_processing', key: 'processing_id' }
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' }
    },
    employee_code: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    employee_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    month: {
      type: DataTypes.STRING(7),
      allowNull: false,
      comment: 'YYYY-MM'
    },
    original_payment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'payroll_history', key: 'payment_id' }
    },
    original_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    return_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    return_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    return_source: {
      type: DataTypes.STRING(20),
      defaultValue: 'bulk',
      comment: 'bulk, individual, unclaimed'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      comment: 'pending, paid, partially_paid'
    },
    paid_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    kept_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    payment_history_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'payroll_history', key: 'payment_id' }
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
    modelName: 'ReturnedPayroll',
    tableName: 'returned_payroll',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['payroll_processing_id'] },
      { fields: ['month'] },
      { fields: ['status'] },
      { fields: ['employee_code'] },
      { fields: ['return_date'] }
    ]
  });

  return ReturnedPayroll;
};