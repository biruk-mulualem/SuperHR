'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsToMany(models.Store, {
        through: models.StoreGroupRelation,
        foreignKey: 'groupId',
        otherKey: 'storeId',
        as: 'stores'
      });
      
      Group.belongsToMany(models.User, {
        through: models.UserGroupRelation,
        foreignKey: 'groupId',
        otherKey: 'userId',
        as: 'users'
      });
    }
  }

  Group.init(
    {
      groupId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id',
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
        allowNull: false,
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
      modelName: 'Group',
      tableName: 'groups',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (group) => {
          if (!group.code) {
            const lastGroup = await Group.findOne({
              order: [['groupId', 'DESC']],
            });
            let nextNumber = 1;
            if (lastGroup) {
              const match = lastGroup.code.match(/GRP-(\d+)/);
              if (match) {
                nextNumber = parseInt(match[1]) + 1;
              }
            }
            group.code = `GRP-${String(nextNumber).padStart(3, '0')}`;
          }
        },
      },
    }
  );

  return Group;
};