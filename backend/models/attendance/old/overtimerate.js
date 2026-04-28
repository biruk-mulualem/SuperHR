// models/overtimerate.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OvertimeRate extends Model {
    static associate(models) {
      // optional: associate with company
    }
  }

  OvertimeRate.init(
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
      dayType: {
        type: DataTypes.ENUM('weekday', 'weekend', 'holiday'),
        allowNull: false,
        field: 'day_type',
      },
      rate: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: false,
        validate: {
          min: 1.0,
          max: 5.0,
        },
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
      modelName: 'OvertimeRate',
      tableName: 'overtime_rates',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['shift_type', 'day_type', 'effective_from', 'effective_to'],
          name: 'idx_shift_daytype_effective',
        },
      ],
    }
  );

  return OvertimeRate;
};