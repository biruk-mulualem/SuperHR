// models/ItemRequestDetail.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemRequestDetail extends Model {
    static associate(models) {
      ItemRequestDetail.belongsTo(models.ItemRequest, {
        foreignKey: 'requestId',
        as: 'request',
        onDelete: 'CASCADE',
      });
      ItemRequestDetail.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item',
      });
    }

    getFullInfo() {
      return {
        id: this.detailId,
        requestId: this.requestId,
        item: this.item,
        quantity: this.quantity,
        remark: this.remark,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    }
  }

  ItemRequestDetail.init(
    {
      detailId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id',
      },
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'request_id',
        references: {
          model: 'item_requests',
          key: 'id',
        },
        validate: {
          notNull: true,
        },
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id',
        references: {
          model: 'items',
          key: 'id',
        },
        validate: {
          notNull: true,
        },
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        validate: {
          min: 0.01,
          notNull: true,
        },
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      modelName: 'ItemRequestDetail',
      tableName: 'item_request_details',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return ItemRequestDetail;
};