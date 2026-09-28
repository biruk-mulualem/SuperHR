// models/OnHoldPayroll.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OnHoldPayroll extends Model {
    static associate(models) {
      OnHoldPayroll.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      OnHoldPayroll.hasMany(models.OnHoldPayrollDetail, {
        foreignKey: 'onhold_id',
        as: 'monthlyDetails'
      });
    }
  }

  OnHoldPayroll.init({
    onhold_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    hold_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hold_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: 'active, partially_released, fully_released'
    },
    total_held_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total_released_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    months_on_hold: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_by: {
      type: DataTypes.STRING(100),
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
    modelName: 'OnHoldPayroll',
    tableName: 'onhold_payroll',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] },
      { fields: ['employee_code'] },
      { fields: ['department'] }
    ]
  });

  return OnHoldPayroll;
};