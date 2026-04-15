"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Payroll extends Model {
    static associate(models) {
      Payroll.belongsTo(models.Employee, { foreignKey: "employeeId" });
      Payroll.belongsTo(models.Salary, { foreignKey: "salaryId" });
      Payroll.belongsTo(models.User, { 
        foreignKey: "processedBy", 
        as: "processor" 
      });
    }
  }

  Payroll.init(
    {
      payrollId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "payroll_id",
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      salaryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "salary_id",
      },
      basicSalary: {
        type: DataTypes.DECIMAL(15, 2),
        field: "basic_salary",
      },
      allowances: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      deductions: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      netPayable: {
        type: DataTypes.DECIMAL(15, 2),
        field: "net_payable",
      },
      paymentDate: {
        type: DataTypes.DATEONLY,
        field: "payment_date",
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "processed", "completed", "failed"),
        defaultValue: "pending",
        field: "payment_status",
      },
      transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "transaction_id",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "processed_by",
      },
    },
    {
      sequelize,
      modelName: "Payroll",
      tableName: "payrolls",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Payroll;
};