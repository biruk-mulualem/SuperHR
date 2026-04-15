"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    static associate(models) {
      Attendance.belongsTo(models.Employee, { foreignKey: "employeeId" });
    }
  }

  Attendance.init(
    {
      attendanceId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "attendance_id",
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      checkIn: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "check_in",
      },
      checkOut: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "check_out",
      },
      totalHours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        field: "total_hours",
      },
      overtime: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("present", "absent", "late", "half-day", "holiday", "leave"),
        defaultValue: "present",
      },
      lateMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "late_minutes",
      },
      earlyDepartureMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "early_departure_minutes",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Attendance",
      tableName: "attendances",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Attendance;
};