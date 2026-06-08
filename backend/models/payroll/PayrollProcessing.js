// models/PayrollProcessing.js - Simplified version
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PayrollProcessing extends Model {
    static associate(models) {
      // No associations needed - just track processed months
    }
  }

  PayrollProcessing.init({
    processing_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    month_year: {
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'completed',
    },
    processed_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    processed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    unclaimed_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    paid_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    unclaimed_file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'PayrollProcessing',
    tableName: 'payroll_processing',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return PayrollProcessing;
};