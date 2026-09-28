// models/RequestGroupProcessing.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RequestGroupProcessing extends Model {
    static associate(models) {
      RequestGroupProcessing.belongsTo(models.ItemRequest, {
        foreignKey: 'requestId',
        as: 'request',
        onDelete: 'CASCADE',
      });
      
      RequestGroupProcessing.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group',
        onDelete: 'CASCADE',
      });
      
      RequestGroupProcessing.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store',
        onDelete: 'CASCADE',
      });
      
      RequestGroupProcessing.belongsTo(models.User, {
        foreignKey: 'processedBy',
        as: 'processedByUser',
        targetKey: 'userId',
      });
    }
  }

  RequestGroupProcessing.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'request_id',
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id',
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'store_id',
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at',
      },
      status: {
        type: DataTypes.ENUM('pending', 'processed', 'skipped'),
        defaultValue: 'pending',
        allowNull: false,
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'processed_by',
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
      modelName: 'RequestGroupProcessing',
      tableName: 'request_group_processing',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return RequestGroupProcessing;
};