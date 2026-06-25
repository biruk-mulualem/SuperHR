'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoreGroupRelation extends Model {
    static associate(models) {
      StoreGroupRelation.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store'
      });
      StoreGroupRelation.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group'
      });
    }
  }

  StoreGroupRelation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'store_id',
        references: {
          model: 'stores',
          key: 'id',
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
      modelName: 'StoreGroupRelation',
      tableName: 'store_group_relations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'group_id'],
          name: 'unique_store_group',
        },
      ],
    }
  );

  return StoreGroupRelation;
};