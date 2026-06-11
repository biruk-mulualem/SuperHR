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
          "performance-review",
          // ADD NEW DOCUMENT TYPES FOR CHILDREN
          "child_profile",
          "child_birth_certificate",
          "child_medical_report",
          "child_adoption_certificate",
          "profile_picture",
          "education_certificate",
          "training_certificate",
          "experience_letter",
          "sdt_letter",
          "national_id",
          "naturalization_certificate",
          "health_document",
          "legal_document",
          "spouse_profile",
          "marriage_certificate"
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
      // ========== NEW COLUMNS ==========
      subType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "sub_type",
        comment: "Sub-category like 'profile', 'birth', 'medical', 'adoption'"
      },
      index: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "index",
        comment: "Index for child documents (0, 1, 2, etc.)"
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "description",
        comment: "Additional description or notes about the document"
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "metadata",
        comment: "Additional JSON metadata for the document"
      }
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