// models/storetostorerelationship.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoreToStoreRelationship extends Model {
    static associate(models) {
      // Source store (asking store)
      StoreToStoreRelationship.belongsTo(models.Store, {
        foreignKey: 'sourceStoreId',
        as: 'sourceStore',
      });
      
      // Target store (supplying store)
      StoreToStoreRelationship.belongsTo(models.Store, {
        foreignKey: 'targetStoreId',
        as: 'targetStore',
      });
    }
  }

  StoreToStoreRelationship.init(
    {
      relationshipId: {
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
      sourceStoreId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'source_store_id',
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      targetStoreId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'target_store_id',
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
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
      modelName: 'StoreToStoreRelationship',
      tableName: 'store_to_store_relationships',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (relationship) => {
          if (!relationship.code) {
            const lastRelationship = await StoreToStoreRelationship.findOne({
              order: [['relationshipId', 'DESC']],
            });
            let nextNumber = 1;
            if (lastRelationship) {
              const match = lastRelationship.code.match(/REL-(\d+)/);
              if (match) {
                nextNumber = parseInt(match[1]) + 1;
              }
            }
            relationship.code = `REL-${String(nextNumber).padStart(3, '0')}`;
          }
        },
        beforeValidate: async (relationship) => {
          // Prevent source and target from being the same
          if (relationship.sourceStoreId === relationship.targetStoreId) {
            throw new Error('A store cannot have a relationship with itself');
          }
        },
      },
    }
  );

  return StoreToStoreRelationship;
};