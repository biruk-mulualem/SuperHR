'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkflowStage extends Model {
    static associate(models) {
      WorkflowStage.hasMany(models.WorkflowStageGroup, {
        foreignKey: 'stageId',
        as: 'groupLinks',
        onDelete: 'CASCADE',
        hooks: true,
      });
    }
  }

  WorkflowStage.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      label: { type: DataTypes.STRING(120), allowNull: false, defaultValue: '' },
      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'order_index',
      },
    },
    {
      sequelize,
      modelName: 'WorkflowStage',
      tableName: 'workflow_stages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['order_index'] }],
    }
  );

  return WorkflowStage;
};