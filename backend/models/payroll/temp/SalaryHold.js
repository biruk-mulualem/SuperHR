// models/SalaryHold.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalaryHold extends Model {
    static associate(models) {
      SalaryHold.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      SalaryHold.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      SalaryHold.belongsTo(models.User, {
        foreignKey: 'released_by',
        as: 'releaser'
      });
      SalaryHold.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      SalaryHold.hasMany(models.HoldRelease, {
        foreignKey: 'hold_id',
        as: 'releases'
      });
      SalaryHold.hasMany(models.PayrollItem, {
        foreignKey: 'hold_id',
        as: 'payroll_items'
      });
    }

    getRemainingAmount() {
      return (this.original_amount || 0) - (this.released_amount || 0);
    }

    isFullyReleased() {
      return this.getRemainingAmount() <= 0;
    }
  }

  SalaryHold.init({
    hold_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    period_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'period_id'
    },
    hold_reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'hold_reason'
    },
    hold_duration_months: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'hold_duration_months'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date'
    },
    original_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'original_amount'
    },
    released_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      field: 'released_amount'
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'remaining_amount'
    },
    status: {
      type: DataTypes.ENUM('active', 'released', 'partially_released'),
      defaultValue: 'active',
    },
    released_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'released_by'
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'released_at'
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
    modelName: 'SalaryHold',
    tableName: 'salary_holds',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['status'] }
    ]
  });

  return SalaryHold;
};