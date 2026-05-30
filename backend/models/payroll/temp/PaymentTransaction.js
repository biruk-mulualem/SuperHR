// models/PaymentTransaction.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentTransaction extends Model {
    static associate(models) {
      PaymentTransaction.belongsTo(models.PaymentSession, {
        foreignKey: 'session_id',
        as: 'session'
      });
      PaymentTransaction.belongsTo(models.PayrollItem, {
        foreignKey: 'payroll_item_id',
        as: 'payroll_item'
      });
      PaymentTransaction.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      PaymentTransaction.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      PaymentTransaction.belongsTo(models.User, {
        foreignKey: 'processed_by',
        as: 'processor'
      });
      PaymentTransaction.hasOne(models.UnclaimedSalary, {
        foreignKey: 'transaction_id',
        as: 'unclaimed'
      });
      PaymentTransaction.hasOne(models.ReturnedPayment, {
        foreignKey: 'transaction_id',
        as: 'returned'
      });
    }
  }

  PaymentTransaction.init({
    transaction_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'session_id'
    },
    payroll_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'payroll_item_id'
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
    payment_method: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'payment_method'
    },
    transaction_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'transaction_reference'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'payment_date'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'returned'),
      defaultValue: 'pending',
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    modelName: 'PaymentTransaction',
    tableName: 'payment_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { fields: ['session_id'] },
      { fields: ['employee_id'] },
      { fields: ['period_id'] },
      { fields: ['status'] },
      { fields: ['payroll_item_id'] }
    ]
  });

  return PaymentTransaction;
};