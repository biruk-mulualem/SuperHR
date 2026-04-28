// models/companyshiftdefault.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CompanyShiftDefault extends Model {
    static associate(models) {
      // no direct associations needed, but can add createdBy user
      CompanyShiftDefault.belongsTo(models.Employee, { 
        foreignKey: 'createdBy', 
        as: 'creator',
        allowNull: true 
      });
    }
  }

  CompanyShiftDefault.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      shiftType: {
        type: DataTypes.ENUM('day', 'night'),
        allowNull: false,
        field: 'shift_type',
      },
      checkInTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'check_in_time',
      },
      checkOutTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'check_out_time',
      },
      checkOutDayOffset: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
        field: 'check_out_day_offset',
        comment: '0=same day, 1=next day',
      },
      lateThresholdMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        field: 'late_threshold_minutes',
        comment: 'Minutes after check-in time to be considered late',
      },
      absentAfterMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
        field: 'absent_after_minutes',
        comment: 'Minutes after check-in time to be considered absent',
      },
      lunchDurationMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 40,
        field: 'lunch_duration_minutes',
      },
      lunchStartTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'lunch_start_time',
        comment: 'Default lunch start time for day shift (e.g., 12:00)',
      },
      dinnerDurationMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 40,
        field: 'dinner_duration_minutes',
      },
      dinnerStartTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'dinner_start_time',
      },
      // ✅ Late night trigger time - when compensation starts
      lateNightTriggerTime: {
        type: DataTypes.TIME,
        allowNull: true,
        field: 'late_night_trigger_time',
        comment: 'Time when late night adjustment is triggered (e.g., 00:00 midnight)',
      },
      // ✅ Late night compensatory hours - how much time to add to next check-in
      lateNightCompensatoryHours: {
        type: DataTypes.DECIMAL(3,1),
        defaultValue: 2.0,
        field: 'late_night_compensatory_hours',
        comment: 'Hours added to next day check-in as compensation for working late',
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
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      modelName: 'CompanyShiftDefault',
      tableName: 'company_shift_defaults',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['shift_type', 'effective_from', 'effective_to'],
          name: 'idx_shift_effective',
        },
      ],
    }
  );

  return CompanyShiftDefault;
};