"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AttendanceRecord extends Model {
    static associate(models) {
      AttendanceRecord.belongsTo(models.ImportBatch, {
        foreignKey: "import_batch_id",
        as: "import_batch",
      });
      AttendanceRecord.belongsTo(models.Employee, {
        foreignKey: "employee_id",
        as: "employee",
      });
    }

    // Helper method to calculate total overtime
    getTotalOvertimeMinutes() {
      return (this.normal_ot_minutes || 0) + 
             (this.weekend_ot_minutes || 0) + 
             (this.holiday_ot_minutes || 0);
    }

    // Helper method to get overtime breakdown
    getOvertimeBreakdown() {
      return {
        normal: this.normal_ot_minutes || 0,
        weekend: this.weekend_ot_minutes || 0,
        holiday: this.holiday_ot_minutes || 0,
        total: this.getTotalOvertimeMinutes()
      };
    }
  }

  AttendanceRecord.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      import_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "import_batches",
          key: "id",
        },
        field: "import_batch_id",
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "employee_id",
        },
        field: "employee_id",
      },
      // Penalties
      late_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "late_minutes",
      },
      half_day_absence: {
        type: DataTypes.DECIMAL(5, 1),
        defaultValue: 0,
        field: "half_day_absence",
      },
      early_leave_days: {
        type: DataTypes.DECIMAL(5, 1),
        defaultValue: 0,
        field: "early_leave_days",
      },
      imported_dates: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: "imported_dates",
      },
      absence_days: {
        type: DataTypes.DECIMAL(5, 1),
        defaultValue: 0,
        field: "absence_days",
      },
      
      // ========== OVERTIME TYPES ==========
      // Normal OT (weekdays after work hours)
      normal_ot_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "normal_ot_minutes",
        comment: "Normal overtime minutes on weekdays"
      },
      // Weekend OT (Saturday and Sunday)
      weekend_ot_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "weekend_ot_minutes",
        comment: "Weekend overtime minutes"
      },
      // Holiday OT (Public holidays)
      holiday_ot_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "holiday_ot_minutes",
        comment: "Holiday overtime minutes"
      },
      // ===================================
      
      period_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "period_start_date",
      },
      period_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "period_end_date",
      },
      period_days: {
        type: DataTypes.INTEGER,
        field: "period_days",
      },
      raw_data: {
        type: DataTypes.JSONB,
        field: "raw_data",
      },
      is_valid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_valid",
      },
      validation_errors: {
        type: DataTypes.TEXT,
        field: "validation_errors",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
      period_year: {
        type: DataTypes.INTEGER,
        field: "period_year",
      },
      period_month: {
        type: DataTypes.INTEGER,
        field: "period_month",
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "AttendanceRecord",
      tableName: "attendance_records",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return AttendanceRecord;
};