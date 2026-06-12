'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharityLog extends Model {
    static associate(models) {
      CharityLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  CharityLog.init(
    {
      logId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'log_id',
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      targetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'target_id',
      },
      details: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
      },
    },
    {
      sequelize,
      modelName: 'CharityLog',
      tableName: 'charity_logs',
      timestamps: true,
      updatedAt: false,
      createdAt: 'created_at',
    }
  );

  return CharityLog;
};
