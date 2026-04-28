"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LeaveRequest extends Model {
    static associate(models) {
      LeaveRequest.belongsTo(models.Employee, { foreignKey: "employeeId" });
      LeaveRequest.belongsTo(models.Employee, { 
        foreignKey: "approvedBy", 
        as: "approver" 
      });
    }
  }

  LeaveRequest.init(
    {
      leaveRequestId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "leave_request_id",
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      leaveType: {
        type: DataTypes.ENUM("annual", "sick", "casual", "unpaid", "maternity", "paternity", "bereavement"),
        allowNull: false,
        field: "leave_type",
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "start_date",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "end_date",
      },
      totalDays: {
        type: DataTypes.DECIMAL(5, 1),
        allowNull: false,
        field: "total_days",
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled"),
        defaultValue: "pending",
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "approved_by",
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "approved_at",
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "rejection_reason",
      },
      attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "LeaveRequest",
      tableName: "leave_requests",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return LeaveRequest;
};