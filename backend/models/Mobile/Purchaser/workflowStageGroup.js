'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkflowStageGroup extends Model {
    static associate(models) {
      WorkflowStageGroup.belongsTo(models.WorkflowStage, {
        foreignKey: 'stageId',
        as: 'stage',
        onDelete: 'CASCADE',
      });
      WorkflowStageGroup.belongsTo(models.PurchasingGroup, {
        foreignKey: 'groupId',
        as: 'group',
        onDelete: 'CASCADE',
      });
    }
  }

  WorkflowStageGroup.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      stageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'stage_id',
        references: { model: 'workflow_stages', key: 'id' },
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id',
        references: { model: 'purchasing_groups', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'WorkflowStageGroup',
      tableName: 'workflow_stage_groups',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['group_id'] },   // 👈 the rule
        { fields: ['stage_id'] },
      ],
    }
  );

  return WorkflowStageGroup;
};