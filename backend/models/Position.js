"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Position extends Model {
    static associate(models) {
      Position.belongsTo(models.Department, { foreignKey: "departmentId" });
      Position.hasMany(models.Employee, { foreignKey: "positionId" });
    }
  }

  Position.init(
    {
      positionId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "position_id",
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "department_id",
      },
      level: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      minSalary: {
        type: DataTypes.DECIMAL(15, 2),
        field: "min_salary",
      },
      maxSalary: {
        type: DataTypes.DECIMAL(15, 2),
        field: "max_salary",
      },
      requirements: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      responsibilities: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      sequelize,
      modelName: "Position",
      tableName: "positions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Position;
};