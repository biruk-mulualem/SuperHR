// models/fieldworkassignment.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FieldWorkAssignment extends Model {
    static associate(models) {
      FieldWorkAssignment.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
      FieldWorkAssignment.belongsTo(models.Employee, { 
        foreignKey: 'createdBy', 
        as: 'creator',
        allowNull: true 
      });
    }
  }

  FieldWorkAssignment.init(
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
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date',
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'end_date',
      },
      assignmentType: {
        type: DataTypes.ENUM('today', 'range', 'permanent'),
        allowNull: false,
        field: 'assignment_type',
      },
      noOfficeCheckin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'no_office_checkin',
      },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'cancelled', 'expired'),
        defaultValue: 'active',
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
    },
    {
      sequelize,
      modelName: 'FieldWorkAssignment',
      tableName: 'field_work_assignments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          fields: ['employee_id', 'status'],
          name: 'idx_emp_status',
        },
        {
          fields: ['status', 'start_date'],
          name: 'idx_status_startdate',
        },
        {
          fields: ['start_date', 'end_date'],
          name: 'idx_date_range',
        },
      ],
    }
  );

  return FieldWorkAssignment;
};