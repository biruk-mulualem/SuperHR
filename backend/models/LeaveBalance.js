"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LeaveBalance extends Model {
    static associate(models) {
      LeaveBalance.belongsTo(models.Employee, { foreignKey: "employeeId" });
    }
  }

  LeaveBalance.init(
    {
      balanceId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: "balance_id",
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "employee_id",
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      annual: {
        type: DataTypes.JSONB,
        defaultValue: { total: 20, used: 0, remaining: 20 },
      },
      sick: {
        type: DataTypes.JSONB,
        defaultValue: { total: 12, used: 0, remaining: 12 },
      },
      casual: {
        type: DataTypes.JSONB,
        defaultValue: { total: 10, used: 0, remaining: 10 },
      },
      unpaid: {
        type: DataTypes.JSONB,
        defaultValue: { total: 0, used: 0, remaining: 0 },
      },
      carriedOver: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "carried_over",
      },
    },
    {
      sequelize,
      modelName: "LeaveBalance",
      tableName: "leave_balances",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return LeaveBalance;
};