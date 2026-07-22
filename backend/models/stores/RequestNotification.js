// models/RequestNotification.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RequestNotification extends Model {
    static associate(models) {
      RequestNotification.belongsTo(models.ItemRequest, {
        foreignKey: 'request_id',
        as: 'request',
      });
      RequestNotification.belongsTo(models.Group, {
        foreignKey: 'group_id',
        as: 'group',
      });
      RequestNotification.belongsTo(models.Store, {
        foreignKey: 'store_id',
        as: 'store',
      });
      RequestNotification.belongsTo(models.User, {
        foreignKey: 'responded_by',
        as: 'respondedByUser',
      });
    }
  }

  RequestNotification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      request_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      store_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      },
      rejected_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      responded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      viewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'RequestNotification',
      tableName: 'request_notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return RequestNotification;
};