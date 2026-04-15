"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    static associate(models) {
      Department.hasMany(models.User, { foreignKey: "departmentId" });
      Department.hasMany(models.Employee, { foreignKey: "departmentId" });
      Department.belongsTo(models.User, { 
        foreignKey: "managerId", 
        as: "manager" 
      });
      Department.hasMany(models.Department, { 
        foreignKey: "parentDepartmentId", 
        as: "subDepartments" 
      });
      Department.belongsTo(models.Department, { 
        foreignKey: "parentDepartmentId", 
        as: "parent" 
      });
    }
  }

  Department.init(
    {
      departmentId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "department_id",
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      managerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "manager_id",
      },
      parentDepartmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "parent_department_id",
      },
      budget: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      location: {
        type: DataTypes.STRING(200),
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
      modelName: "Department",
      tableName: "departments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Department;
};