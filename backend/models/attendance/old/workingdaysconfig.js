// models/workingdaysconfig.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkingDaysConfig extends Model {
    static associate(models) {
      // no associations needed
    }
  }

  WorkingDaysConfig.init(
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
      dayOfWeek: {
        type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        allowNull: false,
        field: 'day_of_week',
      },
      isWorkingDay: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_working_day',
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
    },
    {
      sequelize,
      modelName: 'WorkingDaysConfig',
      tableName: 'working_days_config',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['shift_type', 'day_of_week', 'effective_from'],
          name: 'uk_shift_day_effective',
        },
        {
          fields: ['effective_from', 'effective_to'],
          name: 'idx_effective',
        },
      ],
    }
  );

  return WorkingDaysConfig;
};