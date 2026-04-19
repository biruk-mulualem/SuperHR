// models/employeeoverride.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeOverride extends Model {
    static associate(models) {
      EmployeeOverride.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
      EmployeeOverride.belongsTo(models.Employee, { 
        foreignKey: 'createdBy', 
        as: 'creator',
        allowNull: true 
      });
    }
  }

  EmployeeOverride.init(
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
      shiftType: {
        type: DataTypes.ENUM('day', 'night'),
        allowNull: false,
        field: 'shift_type',
      },
      checkInTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'check_in_time',
      },
      checkOutTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'check_out_time',
      },
      lunchDurationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'lunch_duration_minutes',
      },
      dinnerDurationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'dinner_duration_minutes',
      },
      dinnerStartTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'dinner_start_time',
      },
      overtimeAfterTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'overtime_after_time',
      },
      effectiveFrom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'effective_from',
      },
      effectiveTo: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'effective_to',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
      },
    },
    {
      sequelize,
      modelName: 'EmployeeOverride',
      tableName: 'employee_overrides',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['employee_id', 'shift_type', 'effective_from', 'effective_to'],
          name: 'idx_emp_shift_effective',
        },
      ],
    }
  );

  return EmployeeOverride;
};