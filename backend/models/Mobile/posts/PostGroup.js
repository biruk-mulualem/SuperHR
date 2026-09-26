// models/posts/PostGroup.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostGroup extends Model {
    static associate(models) {
      PostGroup.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });

      PostGroup.hasMany(models.PostGroupMember, {
        foreignKey: 'groupId',
        as: 'members',
      });

      PostGroup.hasMany(models.PostGroupPost, {
        foreignKey: 'groupId',
        as: 'posts',
      });

      PostGroup.hasMany(models.PostGroupAuditLog, {
        foreignKey: 'groupId',
        as: 'auditLogs',
      });
    }
  }

  PostGroup.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      emoji: {
        type: DataTypes.STRING(16),
        allowNull: true,
        defaultValue: '💬',
      },
      accent: {
        type: DataTypes.STRING(16),
        allowNull: true,
        defaultValue: '#8B5CF6',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by',
        references: { model: 'users', key: 'user_id' },
      },
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_activity',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      modelName: 'PostGroup',
      tableName: 'post_groups',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      paranoid: false,
    }
  );

  return PostGroup;
};