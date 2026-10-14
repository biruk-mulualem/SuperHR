'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchasingSubgroupMember extends Model {
    static associate(models) {
      PurchasingSubgroupMember.belongsTo(models.PurchasingSubgroup, {
        foreignKey: 'subgroupId',
        as: 'subgroup',
        onDelete: 'CASCADE',
      });

      PurchasingSubgroupMember.belongsTo(models.PurchasingGroup, {
        foreignKey: 'groupId',
        as: 'group',
        onDelete: 'CASCADE',
      });

      PurchasingSubgroupMember.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  PurchasingSubgroupMember.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      subgroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'subgroup_id',
        references: { model: 'purchasing_subgroups', key: 'id' },
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id',
        references: { model: 'purchasing_groups', key: 'id' },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
      },
      role: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'joined_at',
      },
    },
    {
      sequelize,
      modelName: 'PurchasingSubgroupMember',
      tableName: 'purchasing_subgroup_members',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['group_id', 'user_id'] },
        { fields: ['subgroup_id'] },
        { fields: ['group_id'] },
        { fields: ['user_id'] },
      ],
    }
  );

  return PurchasingSubgroupMember;
};