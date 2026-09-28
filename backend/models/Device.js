// models/Device.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define(
    'Device',
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
      deviceId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'device_id',
      },
      fingerprint: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'fingerprint',
      },
      platform: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      brand: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      osVersion: {
        type: DataTypes.STRING(40),
        allowNull: true,
        field: 'os_version',
      },
      deviceName: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'device_name',
      },
      isEmulator: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_emulator',
      },
      appVersion: {
        type: DataTypes.STRING(40),
        allowNull: true,
        field: 'app_version',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        // 'pending' | 'approved' | 'blocked'
      },
      requestedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'requested_at',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
      },
      blockedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'blocked_at',
      },
      blockedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'blocked_by',
      },
      blockedReason: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'blocked_reason',
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_seen_at',
      },
    },
    {
      tableName: 'devices',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'device_id'],
          name: 'devices_user_device_unique',
        },
        { fields: ['user_id', 'status'], name: 'devices_user_status_idx' },
        { fields: ['device_id'], name: 'devices_device_id_idx' },
      ],
    }
  );

  Device.associate = function (models) {
    // Each device belongs to a user
    Device.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });

    // Optional: who approved / blocked it
    Device.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
      constraints: false,
    });
    Device.belongsTo(models.User, {
      foreignKey: 'blockedBy',
      as: 'blocker',
      constraints: false,
    });
  };

  return Device;
};