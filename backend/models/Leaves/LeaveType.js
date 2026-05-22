'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LeaveType extends Model {
    static associate(models) {
      LeaveType.hasMany(models.LeaveRequest, { 
        foreignKey: 'leaveTypeId', 
        as: 'leaveRequests' 
      });
    }
  }

  LeaveType.init({
    leaveTypeId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'leave_type_id',
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    defaultDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'default_days',
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_paid',
    },
    hasFixedLimit: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'has_fixed_limit',
    },
    isOneTime: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_one_time',
    },
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'requires_approval',
    },
    minNoticeDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'min_notice_days',
    },
    maxConsecutiveDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_consecutive_days',
    },
    requiresDocumentation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'requires_documentation',
    },
    genderRestriction: {
      type: DataTypes.ENUM('male', 'female', 'none'),
      defaultValue: 'none',
      field: 'gender_restriction',
    },
    carryOverLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      field: 'carry_over_limit',
    },
    carryOverExpiryYears: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
      field: 'carry_over_expiry_years',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order',
    },
  }, {
    sequelize,
    modelName: 'LeaveType',
    tableName: 'leave_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return LeaveType;
};