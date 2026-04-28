// models/latenightadjustment.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LateNightAdjustment extends Model {
    static associate(models) {
      LateNightAdjustment.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
      LateNightAdjustment.belongsTo(models.Employee, { 
        foreignKey: 'approvedBy', 
        as: 'approver',
        allowNull: true 
      });
    }
  }

  LateNightAdjustment.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'employee_id',
        references: {
          model: 'employees',
          key: 'employee_id',
        },
        onDelete: 'CASCADE',
      },
      workDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'work_date',
      },
      workedUntilTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'worked_until_time',
      },
      adjustedCheckInTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'adjusted_check_in_time',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'approved',
      },
    },
    {
      sequelize,
      modelName: 'LateNightAdjustment',
      tableName: 'late_night_adjustments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['employee_id', 'work_date'],
          name: 'uk_employee_date',
        },
        {
          fields: ['employee_id', 'work_date'],
          name: 'idx_employee_date',
        },
      ],
    }
  );

  return LateNightAdjustment;
};