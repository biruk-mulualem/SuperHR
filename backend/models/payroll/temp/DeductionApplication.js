// models/DeductionApplication.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DeductionApplication extends Model {
    static associate(models) {
      DeductionApplication.belongsTo(models.RecurringDeduction, {
        foreignKey: 'deduction_id',
        as: 'deduction'
      });
      DeductionApplication.belongsTo(models.PayrollPeriod, {
        foreignKey: 'period_id',
        as: 'period'
      });
      DeductionApplication.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      DeductionApplication.belongsTo(models.User, {
        foreignKey: 'submitted_by',
        as: 'submitter'
      });
    }
  }

  DeductionApplication.init({
    application_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    deduction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'deduction_id'
    },
    period_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'period_id'
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    amount_applied: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'amount_applied'
    },
    // ========== FRONTEND FIELDS ==========
    // Who submitted this deduction application
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'submitted_by',
      comment: 'User ID who submitted this deduction'
    },
    submitted_by_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'submitted_by_name',
      comment: 'Name of the person who submitted (for display)'
    },
    // Contact information
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'contact',
      comment: 'Contact person or phone number'
    },
    // Reason for deduction
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reason',
      comment: 'Reason for this deduction'
    },
    // Additional notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes',
      comment: 'Internal notes about this deduction'
    },
    // Application date (when it was applied)
    application_date: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
      field: 'application_date',
      comment: 'Date when this deduction was applied'
    },
    // Status of this application
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'applied'),
      defaultValue: 'applied',
      field: 'status',
      comment: 'Status of the deduction application'
    },
    // Approval reference
    approval_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'approval_reference',
      comment: 'Reference number for approval'
    },
    // For tracking partial applications
    is_partial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_partial',
      comment: 'Whether this is a partial application of the deduction'
    },
    original_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'original_amount',
      comment: 'Original deduction amount before partial application'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'DeductionApplication',
    tableName: 'deduction_applications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
      { unique: true, fields: ['deduction_id', 'period_id'] },
      { fields: ['employee_id'] },
      { fields: ['period_id'] },
      { fields: ['submitted_by'] },
      { fields: ['status'] },
      { fields: ['application_date'] }
    ],
    
    hooks: {
      beforeCreate: (application) => {
        // Set application date if not provided
        if (!application.application_date) {
          application.application_date = new Date().toISOString().split('T')[0];
        }
      },
      beforeUpdate: (application) => {
        // Update timestamp
        application.updated_at = new Date();
      }
    }
  });

  return DeductionApplication;
};