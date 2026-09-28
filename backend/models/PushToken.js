// models/PushToken.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const PushToken = sequelize.define(
    'PushToken',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      platform: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      deviceName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'device_name',
      },
      appVersion: {
        type: DataTypes.STRING(40),
        allowNull: true,
        field: 'app_version',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_used_at',
      },
    },
    {
      sequelize,
      modelName: 'PushToken',
      tableName: 'push_tokens',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['token'], name: 'push_tokens_token_unique' },
        { fields: ['user_id'], name: 'push_tokens_user_active_idx' },
        { fields: ['last_used_at'], name: 'push_tokens_last_used_idx' },
      ],
    }
  );

  PushToken.associate = function (models) {
    PushToken.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return PushToken;
};