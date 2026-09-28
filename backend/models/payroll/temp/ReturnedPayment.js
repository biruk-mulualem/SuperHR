// models/ReturnedPayment.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReturnedPayment extends Model {
    static associate(models) {
      ReturnedPayment.belongsTo(models.PaymentTransaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
      });
      ReturnedPayment.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      ReturnedPayment.belongsTo(models.User, {
        foreignKey: 'resolved_by',
        as: 'resolver'
      });
    }
  }

  ReturnedPayment.init({
    return_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'transaction_id'
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    return_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'return_date'
    },
    return_reason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'return_reason'
    },
    original_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'original_amount'
    },
    returned_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'returned_amount'
    },
    penalty_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'penalty_amount'
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'written_off'),
      defaultValue: 'pending',
    },
    resolved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'resolved_by'
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at'
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
    modelName: 'ReturnedPayment',
    tableName: 'returned_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    
    indexes: [
      { fields: ['transaction_id'] },
      { fields: ['status'] }
    ]
  });

  return ReturnedPayment;
};