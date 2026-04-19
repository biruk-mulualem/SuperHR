// models/attendancelog.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AttendanceLog extends Model {
    static associate(models) {
      AttendanceLog.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
    }
  }

  AttendanceLog.init(
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
      attendanceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'attendance_date',
      },
      shiftType: {
        type: DataTypes.ENUM('day', 'night'),
        allowNull: false,
        field: 'shift_type',
      },
      checkInTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'check_in_time',
      },
      checkOutTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'check_out_time',
      },
      isLate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_late',
      },
      lateMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'late_minutes',
      },
      isAbsent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_absent',
      },
      isHoliday: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_holiday',
      },
      isFieldWork: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_field_work',
      },
      overtimeMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'overtime_minutes',
      },
      overtimeRateApplied: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
        field: 'overtime_rate_applied',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AttendanceLog',
      tableName: 'attendance_logs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['employee_id', 'attendance_date'],
          name: 'uk_employee_date',
        },
        {
          fields: ['attendance_date'],
          name: 'idx_date',
        },
        {
          fields: ['employee_id', 'attendance_date'],
          name: 'idx_employee_date',
        },
        {
          fields: ['shift_type', 'attendance_date'],
          name: 'idx_shift_date',
        },
      ],
    }
  );

  return AttendanceLog;
};