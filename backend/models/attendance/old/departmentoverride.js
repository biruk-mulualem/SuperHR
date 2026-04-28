// models/departmentoverride.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DepartmentOverride extends Model {
    static associate(models) {
      DepartmentOverride.belongsTo(models.Department, { 
        foreignKey: 'departmentId', 
        as: 'department' 
      });
      DepartmentOverride.belongsTo(models.Employee, { 
        foreignKey: 'createdBy', 
        as: 'creator',
        allowNull: true 
      });
    }
  }

  DepartmentOverride.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'department_id',
        references: {
          model: 'departments',
          key: 'department_id',
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
      modelName: 'DepartmentOverride',
      tableName: 'department_overrides',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['department_id', 'shift_type', 'effective_from', 'effective_to'],
          name: 'idx_dept_shift_effective',
        },
      ],
    }
  );

  return DepartmentOverride;
};