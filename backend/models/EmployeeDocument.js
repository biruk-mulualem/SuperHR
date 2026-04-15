"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class EmployeeDocument extends Model {
    static associate(models) {
      EmployeeDocument.belongsTo(models.Employee, { foreignKey: "employeeId" });
      EmployeeDocument.belongsTo(models.User, { 
        foreignKey: "uploadedBy", 
        as: "uploader" 
      });
    }
  }

  EmployeeDocument.init(
    {
      documentId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "document_id",
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      documentType: {
        type: DataTypes.ENUM(
          "id_card",
          "cv", 
          "degree", 
          "guarantee_letter",
          "resume", 
          "id-card", 
          "passport", 
          "certificate", 
          "contract", 
          "performance-review"
        ),
        allowNull: false,
        field: "document_type",
      },
      documentName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "document_name",
      },
      fileUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: "file_url",
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "file_size",
      },
      mimeType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "mime_type",
      },
      uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "uploaded_by",
      },
      expiryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "expiry_date",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      sequelize,
      modelName: "EmployeeDocument",
      tableName: "employee_documents",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return EmployeeDocument;
};