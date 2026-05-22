'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LeaveExtension extends Model {
    static associate(models) {
      LeaveExtension.belongsTo(models.LeaveRequest, { 
        foreignKey: 'leaveRequestId', 
        as: 'leaveRequest' 
      });
      LeaveExtension.belongsTo(models.User, { 
        foreignKey: 'approvedBy', 
        as: 'approver' 
      });
      LeaveExtension.belongsTo(models.User, { 
        foreignKey: 'rejectedBy', 
        as: 'rejector' 
      });
    }
  }

  LeaveExtension.init({
    extensionId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'extension_id',
    },
    leaveRequestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'leave_requests', key: 'leave_request_id' },
      field: 'leave_request_id',
    },
    requestedDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      field: 'requested_date',
    },
    originalEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'original_end_date',
    },
    additionalDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'additional_days',
    },
    requestedNewEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'requested_new_end_date',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
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
    newEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'new_end_date',
    },
  }, {
    sequelize,
    modelName: 'LeaveExtension',
    tableName: 'leave_extensions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    hooks: {
      beforeCreate: async (extension) => {
        if (extension.originalEndDate && extension.additionalDays) {
          const newEnd = new Date(extension.originalEndDate);
          newEnd.setDate(newEnd.getDate() + extension.additionalDays);
          extension.requestedNewEndDate = newEnd.toISOString().split('T')[0];
        }
      }
    }
  });

  return LeaveExtension;
};