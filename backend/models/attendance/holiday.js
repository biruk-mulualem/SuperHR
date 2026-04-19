// models/holiday.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Holiday extends Model {
    static associate(models) {
      // no associations needed
    }
  }

  Holiday.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      holidayDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'holiday_date',
      },
      ethiopianDate: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'ethiopian_date',
      },
      holidayType: {
        type: DataTypes.ENUM('public', 'religious', 'company'),
        allowNull: false,
        field: 'holiday_type',
      },
      overtimeRate: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 2.5,
        field: 'overtime_rate',
      },
      isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_recurring',
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Holiday',
      tableName: 'holidays',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['holiday_date'],
          name: 'idx_date',
        },
        {
          fields: ['holiday_type'],
          name: 'idx_type',
        },
        {
          unique: true,
          fields: ['holiday_date', 'name'],
          name: 'uk_date_name',
        },
      ],
    }
  );

  return Holiday;
};