// models/breakticket.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BreakTicket extends Model {
    static associate(models) {
      BreakTicket.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
    }
  }

  BreakTicket.init(
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
      breakType: {
        type: DataTypes.ENUM('lunch', 'dinner'),
        allowNull: false,
        field: 'break_type',
      },
      breakOutTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'break_out_time',
      },
      expectedReturnTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expected_return_time',
      },
      actualReturnTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'actual_return_time',
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_minutes',
      },
      status: {
        type: DataTypes.ENUM('active', 'on-time', 'late', 'absent'),
        defaultValue: 'active',
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lateMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'late_minutes',
      },
    },
    {
      sequelize,
      modelName: 'BreakTicket',
      tableName: 'break_tickets',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['employee_id', 'status'],
          name: 'idx_emp_status',
        },
        {
          fields: ['status', 'break_out_time'],
          name: 'idx_status_breakout',
        },
        {
          fields: ['break_type', 'status'],
          name: 'idx_type_status',
        },
      ],
    }
  );

  return BreakTicket;
};