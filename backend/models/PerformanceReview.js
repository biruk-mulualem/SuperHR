"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PerformanceReview extends Model {
    static associate(models) {
      PerformanceReview.belongsTo(models.Employee, { foreignKey: "employeeId" });
      PerformanceReview.belongsTo(models.Employee, { 
        foreignKey: "reviewerId", 
        as: "reviewer" 
      });
    }
  }

  PerformanceReview.init(
    {
      reviewId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "review_id",
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      reviewerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "reviewer_id",
      },
      reviewPeriod: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: "review_period",
      },
      rating: {
        type: DataTypes.DECIMAL(3, 1),
        validate: { min: 1, max: 5 },
      },
      strengths: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      weaknesses: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      goals: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      recommendations: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      nextReviewDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "next_review_date",
      },
      status: {
        type: DataTypes.ENUM("draft", "submitted", "approved", "rejected"),
        defaultValue: "draft",
      },
    },
    {
      sequelize,
      modelName: "PerformanceReview",
      tableName: "performance_reviews",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PerformanceReview;
};