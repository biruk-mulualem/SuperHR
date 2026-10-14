'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseRequestApproval extends Model {
    static associate(models) {
      PurchaseRequestApproval.belongsTo(models.PurchaseRequest, {
        foreignKey: 'requestId', as: 'request', onDelete: 'CASCADE',
      });
      PurchaseRequestApproval.belongsTo(models.WorkflowStage, {
        foreignKey: 'stageId', as: 'stage',
      });
      PurchaseRequestApproval.belongsTo(models.PurchasingGroup, {
        foreignKey: 'groupId', as: 'group',
      });
      PurchaseRequestApproval.belongsTo(models.PurchasingSubgroup, {
        foreignKey: 'subgroupId', as: 'subgroup',
      });
      PurchaseRequestApproval.belongsTo(models.User, {
        foreignKey: 'decidedByUserId', as: 'decidedBy',
      });
    }
  }

  PurchaseRequestApproval.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      requestId: {
        type: DataTypes.INTEGER, allowNull: false, field: 'request_id',
        references: { model: 'purchase_requests', key: 'id' },
      },
      stageId: {
        type: DataTypes.INTEGER, allowNull: false, field: 'stage_id',
        references: { model: 'workflow_stages', key: 'id' },
      },
      stageIndex: { type: DataTypes.INTEGER, allowNull: false, field: 'stage_index' },
      groupId: {
        type: DataTypes.INTEGER, allowNull: false, field: 'group_id',
        references: { model: 'purchasing_groups', key: 'id' },
      },
      subgroupId: {
        type: DataTypes.INTEGER, allowNull: false, field: 'subgroup_id',
        references: { model: 'purchasing_subgroups', key: 'id' },
      },
      decidedByUserId: {
        type: DataTypes.INTEGER, allowNull: false, field: 'decided_by_user_id',
        references: { model: 'users', key: 'user_id' },
      },
      decision: { type: DataTypes.ENUM('approve', 'reject'), allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: true },
      actedAt: {
        type: DataTypes.DATE, allowNull: false, field: 'acted_at',
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'PurchaseRequestApproval',
      tableName: 'purchase_request_approvals',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['request_id', 'stage_id', 'subgroup_id'] },
        { fields: ['request_id'] },
        { fields: ['stage_id'] },
        { fields: ['subgroup_id'] },
        { fields: ['decided_by_user_id'] },
      ],
    }
  );

  return PurchaseRequestApproval;
};