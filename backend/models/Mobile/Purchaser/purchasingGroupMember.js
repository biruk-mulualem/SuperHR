'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchasingGroupMember extends Model {
    static associate(models) {
      PurchasingGroupMember.belongsTo(models.PurchasingGroup, {
        foreignKey: 'groupId',
        as: 'group',
        onDelete: 'CASCADE',
      });

      PurchasingGroupMember.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  PurchasingGroupMember.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
        // ✅ your User model uses user_id as primary key
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
      modelName: 'PurchasingGroupMember',
      tableName: 'purchasing_group_members',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['group_id', 'user_id'] },
        { fields: ['group_id'] },
        { fields: ['user_id'] },
      ],
    }
  );

  return PurchasingGroupMember;
};