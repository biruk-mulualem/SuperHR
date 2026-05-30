// models/UnclaimedSalary.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UnclaimedSalary extends Model {
    static associate(models) {
      UnclaimedSalary.belongsTo(models.PaymentTransaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
      });
      UnclaimedSalary.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      UnclaimedSalary.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      UnclaimedSalary.belongsTo(models.User, {
        foreignKey: 'claimed_by',
        as: 'claimant'
      });
    }
  }

  UnclaimedSalary.init({
    unclaimed_id: {
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
    period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_id'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date'
    },
    days_overdue: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'days_overdue'
    },
    status: {
      type: DataTypes.ENUM('unclaimed', 'claimed', 'written_off'),
      defaultValue: 'unclaimed',
    },
    claimed_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'claimed_date'
    },
    claimed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'claimed_by'
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
    modelName: 'UnclaimedSalary',
    tableName: 'unclaimed_salaries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] }
    ]
  });

  return UnclaimedSalary;
};