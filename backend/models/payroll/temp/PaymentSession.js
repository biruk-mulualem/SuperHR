// models/PaymentSession.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentSession extends Model {
    static associate(models) {
      PaymentSession.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      PaymentSession.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      PaymentSession.hasMany(models.PaymentTransaction, {
        foreignKey: 'session_id',
        as: 'transactions'
      });
    }

    isActive() {
      return this.status === 'active';
    }

    isExpired() {
      if (!this.payment_date) return false;
      const expiryDate = new Date(this.payment_date);
      expiryDate.setDate(expiryDate.getDate() + this.unclaimed_window_days);
      return new Date() > expiryDate;
    }
  }

  PaymentSession.init({
    session_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_id'
    },
    session_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'session_code'
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'payment_date'
    },
    payment_window_days: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
      field: 'payment_window_days'
    },
    unclaimed_window_days: {
      type: DataTypes.INTEGER,
      defaultValue: 14,
      field: 'unclaimed_window_days'
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_amount'
    },
    employee_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'employee_count'
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'expired'),
      defaultValue: 'active',
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
    modelName: 'PaymentSession',
    tableName: 'payment_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { fields: ['period_id'] },
      { fields: ['status'] }
    ]
  });

  return PaymentSession;
};