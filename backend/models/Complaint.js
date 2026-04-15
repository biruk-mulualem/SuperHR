"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Complaint extends Model {
    static associate(models) {
      Complaint.belongsTo(models.Employee, { foreignKey: "employeeId" });
      Complaint.belongsTo(models.Employee, { 
        foreignKey: "againstEmployeeId", 
        as: "accused" 
      });
      Complaint.belongsTo(models.Employee, { 
        foreignKey: "assignedTo", 
        as: "assignee" 
      });
    }
  }

  Complaint.init(
    {
      complaintId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "complaint_id",
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      againstEmployeeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "against_employee_id",
      },
      type: {
        type: DataTypes.ENUM("harassment", "discrimination", "workplace", "salary", "other"),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM("pending", "investigating", "resolved", "dismissed"),
        defaultValue: "pending",
      },
      assignedTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "assigned_to",
      },
      resolution: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "resolved_at",
      },
    },
    {
      sequelize,
      modelName: "Complaint",
      tableName: "complaints",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Complaint;
};