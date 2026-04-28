'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      Employee.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Employee.belongsTo(models.Department, { foreignKey: 'departmentId' });
      Employee.belongsTo(models.Position, { foreignKey: 'positionId' });
      Employee.belongsTo(models.Employee, { foreignKey: 'managerId', as: 'manager' });
      Employee.hasMany(models.Employee, { foreignKey: 'managerId', as: 'subordinates' });
      // Employee.hasMany(models.AttendanceLog, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.LeaveRequest, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.LeaveBalance, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.Salary, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.Payroll, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.PerformanceReview, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.PerformanceReview, { foreignKey: 'reviewerId', as: 'givenReviews' });
      Employee.hasMany(models.EmployeeDocument, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.Complaint, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.Complaint, { foreignKey: 'againstEmployeeId', as: 'complaintsAgainst' });

        Employee.hasMany(models.AttendanceRecord, { 
        foreignKey: 'employee_id',
        as: 'attendance_records'
    });
    }
  }

  Employee.init(
    {
      employeeId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'employee_id',
      },
      employeeCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'employee_code',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'last_name',
      },
      middleName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'middle_name',
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth',
      },
      // Add to your existing Employee model init
shiftType: {
  type: DataTypes.ENUM('day', 'night'),
  defaultValue: 'day',
  field: 'shift_type',
},
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true,
      },
      maritalStatus: {
        type: DataTypes.ENUM('single', 'married', 'divorced', 'widowed'),
        allowNull: true,
        field: 'marital_status',
      },
      nationality: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      personalEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'personal_email',
      },
      workEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'work_email',
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'phone_number',
      },
      emergencyContact: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'emergency_contact',
      },
      currentAddress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'current_address',
      },
      permanentAddress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'permanent_address',
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'department_id',
      },
      positionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'position_id',
      },
      managerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'manager_id',
      },
      employmentType: {
        type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'intern'),
        defaultValue: 'full-time',
        field: 'employment_type',
      },
      employmentStatus: {
        type: DataTypes.ENUM('active', 'inactive', 'on-leave', 'terminated', 'retired'),
        defaultValue: 'active',
        field: 'employment_status',
      },
      hireDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'hire_date',
      },
      confirmationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'confirmation_date',
      },
      terminationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'termination_date',
      },
      basicSalary: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: 'basic_salary',
      },
      bankAccount: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'bank_account',
      },
      workLocation: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'work_location',
      },
      // Profile Picture Fields
      profilePicture: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_picture',
      },
      profilePictureUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_picture_url',
      },
      profilePicturePublicId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'profile_picture_public_id',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      modelName: 'Employee',
      tableName: 'employees',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Employee;
};