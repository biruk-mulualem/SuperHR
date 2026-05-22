// models/CompensationHistory.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CompensationHistory extends Model {
    static associate(models) {
      CompensationHistory.belongsTo(models.Employee, {
        foreignKey: 'employee_id',
        as: 'employee'
      });
      CompensationHistory.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
      });
    }
  }

  CompensationHistory.init({
    history_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id'
    },
    component_type: {
      type: DataTypes.STRING(50),
      field: 'component_type'
    },
    old_value: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'old_value'
    },
    new_value: {
      type: DataTypes.DECIMAL(12, 2),
      field: 'new_value'
    },
    change_percent: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'change_percent'
    },
    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'effective_date'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'CompensationHistory',
    tableName: 'compensation_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['effective_date'] }
    ]
  });

  return CompensationHistory;
};