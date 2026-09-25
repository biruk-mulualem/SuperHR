// models/purchase_follow_up_dispatch.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseFollowUpDispatch extends Model {
    static associate(models) {
      // 🔗 Attached to the PR header
      PurchaseFollowUpDispatch.belongsTo(models.PurchaseRequest, {
        foreignKey: 'purchaseRequestId',
        as: 'purchaseRequest',
        onDelete: 'CASCADE',
      });

      PurchaseFollowUpDispatch.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        constraints: false,
      });
    }
  }

  PurchaseFollowUpDispatch.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // 🔗 The PR this dispatch belongs to
      purchaseRequestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'purchase_request_id',
        references: { model: 'purchase_requests', key: 'id' },
      },

      // Nullable: the boss may be identified by name/email only
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
      },

      // Snapshot of the person at dispatch time
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },

      // True when this row is the boss (rather than a purchaser)
      isBoss: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_boss',
      },

      // Optional per-recipient message
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'PurchaseFollowUpDispatch',
      tableName: 'purchase_follow_up_dispatches',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['purchase_request_id'] },
        { fields: ['user_id'] },
        { fields: ['is_boss'] },
      ],
    }
  );

  return PurchaseFollowUpDispatch;
};