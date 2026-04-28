"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Salary extends Model {
    static associate(models) {
      Salary.belongsTo(models.Employee, { foreignKey: "employeeId" });
      Salary.belongsTo(models.User, { 
        foreignKey: "createdBy", 
        as: "creator" 
      });
    }
  }

  Salary.init(
    {
      salaryId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "salary_id",
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      effectiveDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "effective_date",
      },
      basicSalary: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        field: "basic_salary",
      },
      housingAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: "housing_allowance",
      },
      transportAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: "transport_allowance",
      },
      medicalAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: "medical_allowance",
      },
      communicationAllowance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: "communication_allowance",
      },
      otherAllowances: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: "other_allowances",
      },
      deductions: {
        type: DataTypes.JSONB,
        defaultValue: { tax: 0, pension: 0, insurance: 0, loan: 0, other: [] },
      },
      netSalary: {
        type: DataTypes.DECIMAL(15, 2),
        field: "net_salary",
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "USD",
      },
      paymentMethod: {
        type: DataTypes.ENUM("bank", "cash", "cheque"),
        defaultValue: "bank",
        field: "payment_method",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "created_by",
      },
    },
    {
      sequelize,
      modelName: "Salary",
      tableName: "salaries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Salary;
};