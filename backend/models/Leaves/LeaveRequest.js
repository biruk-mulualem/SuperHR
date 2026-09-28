'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LeaveRequest extends Model {
    static associate(models) {
      LeaveRequest.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
      LeaveRequest.belongsTo(models.Department, { 
        foreignKey: 'departmentId', 
        as: 'department' 
      });
      LeaveRequest.belongsTo(models.LeaveType, { 
        foreignKey: 'leaveTypeId', 
        as: 'leaveType' 
      });
      LeaveRequest.belongsTo(models.User, { 
        foreignKey: 'approvedBy', 
        as: 'approver' 
      });
      LeaveRequest.belongsTo(models.User, { 
        foreignKey: 'rejectedBy', 
        as: 'rejector' 
      });
      LeaveRequest.belongsTo(models.User, { 
        foreignKey: 'returnConfirmedBy', 
        as: 'returnConfirmer' 
      });
      LeaveRequest.hasMany(models.LeaveExtension, { 
        foreignKey: 'leaveRequestId', 
        as: 'extensions' 
      });
      LeaveRequest.hasMany(models.LeaveNotification, { 
        foreignKey: 'leaveRequestId', 
        as: 'notifications' 
      });
    }
  }

  LeaveRequest.init({
    leaveRequestId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'leave_request_id',
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' },
      field: 'employee_id',
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'department_id' },
      field: 'department_id',
    },
    leaveTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'leave_types', key: 'leave_type_id' },
      field: 'leave_type_id',
    },
    leaveTypeName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'leave_type_name',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date',
    },
    returnDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'return_date',
    },
    totalDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'total_days',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending',
    },
    requestedDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      field: 'requested_date',
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      field: 'approved_by',
    },
    approvedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'approved_date',
    },
    approvalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'approval_notes',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      field: 'rejected_by',
    },
    rejectedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'rejected_date',
    },
    hrNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'hr_notes',
    },
    returnStatus: {
      type: DataTypes.ENUM('on_leave', 'returned', 'returned_late', 'overdue'),
      defaultValue: 'on_leave',
      field: 'return_status',
    },
    actualReturnDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'actual_return_date',
    },
    daysLate: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'days_late',
    },
    returnConfirmedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      field: 'return_confirmed_by',
    },
    returnConfirmedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'return_confirmed_date',
    },
    extensionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'extension_count',
    },
    totalExtensionDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_extension_days',
    },
    lastExtendedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'last_extended_date',
    },
  }, {
    sequelize,
    modelName: 'LeaveRequest',
    tableName: 'leave_requests',
    timestamps: true,
     underscored: true,  
    createdAt: 'created_at',  // Change from 'createdAt' to 'created_at'
    updatedAt: 'updated_at',  // Change from 'updatedAt' to 'updated_at'
  });

  return LeaveRequest;
};