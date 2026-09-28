// models/posts/PostGroupMember.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostGroupMember extends Model {
    static associate(models) {
      PostGroupMember.belongsTo(models.PostGroup, {
        foreignKey: 'groupId',
        as: 'group',
      });

      PostGroupMember.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });

      PostGroupMember.belongsTo(models.User, {
        foreignKey: 'invitedBy',
        as: 'inviter',
      });
    }
  }

  PostGroupMember.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'group_id',
        references: { model: 'post_groups', key: 'id' },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
      },
      role: {
        type: DataTypes.ENUM('owner', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      status: {
        type: DataTypes.ENUM('active', 'pending'),
        allowNull: false,
        defaultValue: 'pending',
      },
      invitedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'invited_by',
        references: { model: 'users', key: 'user_id' },
      },
      invitedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'invited_at',
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'joined_at',
      },
    },
    {
      sequelize,
      modelName: 'PostGroupMember',
      tableName: 'post_group_members',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { unique: true, fields: ['group_id', 'user_id'] },
        { fields: ['user_id'] },
      ],
    }
  );

  return PostGroupMember;
};