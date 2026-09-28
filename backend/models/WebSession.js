// models/WebSession.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const WebSession = sequelize.define('WebSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: 'session_id',
    },
    deviceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'device_id',
    },
    browser: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: 'browser',
    },
    os: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: 'os',
    },
    deviceName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'device_name',
    },
    userAgent: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'user_agent',
    },
    ip: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'ip',
    },
    lastIp: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'last_ip',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      field: 'status',
    },
    loggedInAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'logged_in_at',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_seen_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
    terminatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'terminated_at',
    },
    terminatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'terminated_by',
    },
    terminatedReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'terminated_reason',
    },
  }, {
    tableName: 'web_sessions',
    timestamps: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['session_id'], name: 'web_sessions_session_id_unique' },
      { fields: ['user_id', 'status'], name: 'web_sessions_user_status_idx' },
      { fields: ['device_id'], name: 'web_sessions_device_id_idx' },
      { fields: ['last_seen_at'], name: 'web_sessions_last_seen_idx' },
    ],
  });

  WebSession.associate = function (models) {
    WebSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    WebSession.belongsTo(models.User, {
      foreignKey: 'terminatedBy',
      as: 'terminator',
      constraints: false,
    });
  };

  return WebSession;
};