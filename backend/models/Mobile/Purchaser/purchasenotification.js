'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseNotification extends Model {
    static associate(models) {
      PurchaseNotification.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
      PurchaseNotification.belongsTo(models.PurchaseRequest, {
        foreignKey: 'requestId',
        as: 'request',
      });
    }
  }

  PurchaseNotification.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
      },
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'request_id',
        references: { model: 'purchase_requests', key: 'id' },
      },
      type: {
        type: DataTypes.ENUM(
          'stage_ready',
          'approved',
          'rejected',
          'advanced',
          'submitted'
        ),
        allowNull: false,
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
    },
    {
      sequelize,
      modelName: 'PurchaseNotification',
      tableName: 'purchase_notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id', 'read_at'] },
        { fields: ['user_id', 'created_at'] },
        { fields: ['request_id'] },
      ],
    }
  );

  return PurchaseNotification;
};