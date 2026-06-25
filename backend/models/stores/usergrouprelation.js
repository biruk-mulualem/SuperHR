'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserGroupRelation extends Model {
    static associate(models) {
      UserGroupRelation.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      UserGroupRelation.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group'
      });
    }
  }

  UserGroupRelation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id',
        references: {
          model: 'groups',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'UserGroupRelation',
      tableName: 'user_group_relations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'group_id'],
          name: 'unique_user_group',
        },
      ],
    }
  );

  return UserGroupRelation;
};