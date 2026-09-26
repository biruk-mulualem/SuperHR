// models/posts/PostGroupAuditLog.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostGroupAuditLog extends Model {
    static associate(models) {
      PostGroupAuditLog.belongsTo(models.User, {
        foreignKey: 'actorId',
        as: 'actor',
      });

      PostGroupAuditLog.belongsTo(models.PostGroup, {
        foreignKey: 'groupId',
        as: 'group',
      });
    }
  }

  PostGroupAuditLog.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      actorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'actor_id',
        references: { model: 'users', key: 'user_id' },
      },
      action: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      targetType: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: 'target_type',
      },
      targetId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'target_id',
      },
      groupId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'group_id',
        references: { model: 'post_groups', key: 'id' },
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PostGroupAuditLog',
      tableName: 'post_audit_logs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
      indexes: [
        { fields: ['group_id'] },
        { fields: ['action'] },
      ],
    }
  );

  return PostGroupAuditLog;
};