'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LeaveNotification extends Model {
    static associate(models) {
      LeaveNotification.belongsTo(models.Employee, { 
        foreignKey: 'employeeId', 
        as: 'employee' 
      });
      LeaveNotification.belongsTo(models.LeaveRequest, { 
        foreignKey: 'leaveRequestId', 
        as: 'leaveRequest' 
      });
    }
  }

  LeaveNotification.init({
    notificationId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'notification_id',
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'employees', key: 'employee_id' },
      field: 'employee_id',
    },
    leaveRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'leave_requests', key: 'leave_request_id' },
      field: 'leave_request_id',
    },
    notificationType: {
      type: DataTypes.ENUM('reminder', 'overdue', 'expiry', 'approval', 'rejection', 'extension_approved', 'extension_rejected'),
      allowNull: false,
      field: 'notification_type',
    },
    channel: {
      type: DataTypes.ENUM('email', 'sms', 'in_app'),
      defaultValue: 'email',
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sentDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'sent_date',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at',
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'failed', 'read'),
      defaultValue: 'sent',
    },
  }, {
    sequelize,
    modelName: 'LeaveNotification',
    tableName: 'leave_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['notification_type', 'status'] },
      { fields: ['sent_date'] }
    ]
  });

  return LeaveNotification;
};