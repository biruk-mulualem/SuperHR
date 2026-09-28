// models/purchase_request_item.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseRequestItem extends Model {
    static associate(models) {
      // Existing
      PurchaseRequestItem.belongsTo(models.PurchaseRequest, {
        foreignKey: 'requestId',
        as: 'request',
        onDelete: 'CASCADE',
      });

      // ✅ Join master `items` table via `code`
      PurchaseRequestItem.belongsTo(models.Item, {
        foreignKey: 'code',       // column on purchase_request_items
        targetKey: 'code',        // column on items
        as: 'item',
        constraints: false,       // don't let Sequelize try to enforce an FK
      });

      // ============================================================
      // ✅ NEW — every price submitted for this PR line item
      // ============================================================
      PurchaseRequestItem.hasMany(models.PurchaseFollowUpPrice, {
        foreignKey: 'purchaseRequestItemId',
        as: 'prices',
        onDelete: 'CASCADE',
        hooks: true,
      });
    }
  }

  PurchaseRequestItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'request_id',
        references: { model: 'purchase_requests', key: 'id' },
      },
      // ❌ name: REMOVED
      code: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      brand: { type: DataTypes.STRING(120), allowNull: true },
      model: { type: DataTypes.STRING(120), allowNull: true },
      uom: { type: DataTypes.STRING(20), allowNull: false },
      baseUom: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'base_uom',
      },
      conversionUom: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'conversion_uom',
      },
      quantity: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      specification: { type: DataTypes.TEXT, allowNull: true },
      remark: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: 'PurchaseRequestItem',
      tableName: 'purchase_request_items',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['request_id'] },
        { fields: ['code'] },
      ],
    }
  );

  return PurchaseRequestItem;
};