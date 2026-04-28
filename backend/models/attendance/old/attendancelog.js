// models/attendancelog.js - Add dayType field
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AttendanceLog extends Model {
    static associate(models) {
      AttendanceLog.belongsTo(models.Employee, {
        foreignKey: "employeeId",
        as: "employee",
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
        field: "employee_id",
        references: {
          model: "employees",
          key: "employee_id",
        },
        onDelete: "CASCADE",
      },
      attendanceDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "attendance_date",
      },
      isWorkingDay: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_working_day",
      },
      shiftType: {
        type: DataTypes.ENUM("day", "night"),
        allowNull: false,
        field: "shift_type",
      },
      checkInTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "check_in_time",
      },
      allowUntilTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: "allow_until_time",
      },
      checkOutTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "check_out_time",
      },
      effectiveCheckInTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: "effective_check_in_time",
        comment: "Scheduled check-in time from priority hierarchy",
      },
      effectiveCheckOutTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: "effective_check_out_time",
        comment: "Scheduled check-out time from priority hierarchy",
      },
      isLate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_late",
      },
      lateMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "late_minutes",
      },
      isAbsent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_absent",
      },
      isHalfDay: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_half_day",
      },
      isHoliday: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_holiday",
      },
      isFieldWork: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_field_work",
      },
      isOnLeave: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_on_leave",
      },
      totalHours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        field: "total_hours",
      },
      overtimeMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "overtime_minutes",
      },
      overtimeRateApplied: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
        field: "overtime_rate_applied",
      },
      checkInLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "check_in_location",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // ✅ MORNING/AFTERNOON TRACKING
      morningStatus: {
        type: DataTypes.ENUM("present", "late", "absent"),
        defaultValue: "absent",
        field: "morning_status",
      },
      afternoonStatus: {
        type: DataTypes.ENUM("present", "absent"),
        defaultValue: "absent",
        field: "afternoon_status",
      },
      sessionType: {
        type: DataTypes.ENUM(
          "full_day",
          "morning_only",
          "afternoon_only",
          "absent",
        ),
        defaultValue: "absent",
        field: "session_type",
      },
      payableHours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        field: "payable_hours",
      },
      status: {
        type: DataTypes.ENUM(
          "FULL_DAY",
          "HALF_DAY",
          "ABSENT",
          "PENDING",
          "ON_LEAVE",
          "SICK",
        ),
        defaultValue: "PENDING",
        field: "status",
      },
      // ✅ ADD THIS NEW FIELD - DAY TYPE
      dayType: {
        type: DataTypes.ENUM("normal", "weekend", "holiday", "overtime"),
        defaultValue: "normal",
        field: "day_type",
      },
    },
    {
      sequelize,
      modelName: "AttendanceLog",
      tableName: "attendance_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["employee_id", "attendance_date"],
          name: "uk_employee_date",
        },
        {
          fields: ["attendance_date"],
          name: "idx_date",
        },
        {
          fields: ["employee_id", "attendance_date"],
          name: "idx_employee_date",
        },
        {
          fields: ["shift_type", "attendance_date"],
          name: "idx_shift_date",
        },
      ],
    },
  );

  return AttendanceLog;
};
