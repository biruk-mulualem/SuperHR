// models/purchase_follow_up_price.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseFollowUpPrice extends Model {
    static associate(models) {
      // 🔗 Attached to the PR line item — this is the source of truth
      PurchaseFollowUpPrice.belongsTo(models.PurchaseRequestItem, {
        foreignKey: 'purchaseRequestItemId',
        as: 'purchaseRequestItem',
        onDelete: 'CASCADE',
      });

      PurchaseFollowUpPrice.belongsTo(models.User, {
        foreignKey: 'submittedById',
        as: 'submittedBy',
        constraints: false,
      });

      PurchaseFollowUpPrice.belongsTo(models.User, {
        foreignKey: 'removedById',
        as: 'removedBy',
        constraints: false,
      });
    }
  }

  PurchaseFollowUpPrice.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // 🔗 The exact PR line item this price is for
      purchaseRequestItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'purchase_request_item_id',
        references: { model: 'purchase_request_items', key: 'id' },
      },

      // Sales person who quoted (free-text name, matches the UI dropdown)
      employee: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      submittedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'submitted_by_id',
        references: { model: 'users', key: 'user_id' },
      },

      // Prices
      unitPrice: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'unit_price',
      },
      totalPrice: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_price',
      },
      discount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      finalPrice: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'final_price',
      },

      // Requirement match + notes
      matchesRequirement: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: 'matches_requirement',
      },
      remark: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },

      // Winner selection
      isWinner: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_winner',
      },
      winnerManuallySelected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'winner_manually_selected',
      },

      // Lifecycle
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      submittedDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'submitted_date',
      },

      // Soft-delete fields (matches your UI's remove flow)
      removedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'removed_by_id',
        references: { model: 'users', key: 'user_id' },
      },
      removedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'removed_at',
      },
      removedRemark: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'removed_remark',
      },
    },
    {
      sequelize,
      modelName: 'PurchaseFollowUpPrice',
      tableName: 'purchase_follow_up_prices',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['purchase_request_item_id'] },
        { fields: ['status'] },
        { fields: ['is_winner'] },
        { fields: ['submitted_by_id'] },
      ],
    }
  );

  return PurchaseFollowUpPrice;
};