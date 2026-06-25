'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    static associate(models) {
      Store.belongsToMany(models.Group, {
        through: models.StoreGroupRelation,
        foreignKey: 'storeId',
        otherKey: 'groupId',
        as: 'groups'
      });
    }
  }

  Store.init(
    {
      storeId: {
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
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Closed'),
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
      modelName: 'Store',
      tableName: 'stores',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (store) => {
          if (!store.code) {
            const lastStore = await Store.findOne({
              order: [['storeId', 'DESC']],
            });
            let nextNumber = 1;
            if (lastStore) {
              const match = lastStore.code.match(/STORE-(\d+)/);
              if (match) {
                nextNumber = parseInt(match[1]) + 1;
              }
            }
            store.code = `STORE-${String(nextNumber).padStart(3, '0')}`;
          }
        },
      },
    }
  );

  return Store;
};