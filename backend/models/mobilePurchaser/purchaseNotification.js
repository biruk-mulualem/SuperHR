// backend/models/purchaseNotification.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const PurchaseNotification = sequelize.define(
    'PurchaseNotification',
    {
      // ==================== PRIMARY KEY ====================
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      // ==================== OWNER ====================
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      // ==================== PURCHASE TYPE ====================
      // 'local'   — Local Purchase workflow
      // 'foreign' — Foreign / Import Purchase workflow
      purchase_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'local',
        validate: {
          isIn: {
            args: [['local', 'foreign']],
            msg: "purchase_type must be 'local' or 'foreign'",
          },
        },
      },

      // ==================== EVENT TYPE ====================
      // Local:
      //   'dispatch'            — a purchase request was assigned to you
      //   'approval_request'    — prices sent to you for approval
      //   'price_submitted'     — someone submitted a price
      //   'winner_selected'     — a winner was chosen
      //   'request_approved'    — the request was approved
      //   'request_declined'    — the request was declined
      //   'request_deleted'     — the request was deleted
      //   'purchase_reminder'   — reminder for a pending action
      //
      // Foreign (future):
      //   'shipment_update'
      //   'lc_opened'
      //   'customs_cleared'
      //   'delivery_scheduled'
      //   ...
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 50],
        },
      },

      // ==================== DISPLAY ====================
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 200],
        },
      },

      body: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // ==================== REFERENCE ====================
      reference_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      reference_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: { len: [0, 50] },
      },

      // ==================== METADATA ====================
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },

      // ==================== READ TRACKING ====================
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      // ==================== TIMESTAMPS ====================
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
      tableName: 'purchase_notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,

      indexes: [
        {
          name: 'idx_purchase_notifications_user_created',
          fields: ['user_id', { name: 'created_at', order: 'DESC' }],
        },
        {
          name: 'idx_purchase_notifications_user_unread',
          fields: ['user_id', 'is_read'],
          where: { is_read: false },
        },
        {
          name: 'idx_purchase_notifications_type',
          fields: ['type'],
        },
        {
          name: 'idx_purchase_notifications_purchase_type',
          fields: ['purchase_type'],
        },
        {
          name: 'idx_purchase_notifications_user_type',
          fields: ['user_id', 'purchase_type', 'is_read'],
        },
      ],

      hooks: {
        beforeUpdate: (notification) => {
          if (
            notification.changed('is_read') &&
            notification.is_read === true &&
            !notification.read_at
          ) {
            notification.read_at = new Date();
          }
        },

        // ------------------------------------------------------------------
        // Fire a push notification after a single notification row is created.
        // Lazy require avoids a circular dependency with models/index.js.
        // Wrapped in try/catch — a push failure NEVER breaks the DB write.
        // Silently no-ops if PUSH_ENABLED !== 'true'.
        // ------------------------------------------------------------------
        afterCreate: async (notification) => {
          try {
            const { sendPushToUser } = require('../services/pushService');

            await sendPushToUser(notification.user_id, {
              title: notification.title,
              body: notification.body || '',
              data: {
                notificationId: notification.id,
                type: notification.type,
                referenceId: notification.reference_id,
                referenceType: notification.reference_type,
              },
            });
          } catch (err) {
            console.error('⚠️ Push afterCreate error:', err.message);
          }
        },
      },
    }
  );

  // ==================== ASSOCIATIONS ====================
  PurchaseNotification.associate = (models) => {
    PurchaseNotification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  // ==================== ENUMS (export for convenience) ====================
  PurchaseNotification.PURCHASE_TYPES = {
    LOCAL: 'local',
    FOREIGN: 'foreign',
  };

  // ==================== STATIC HELPERS ====================

  /**
   * Create one purchase notification for a user.
   *
   * @example
   *   await PurchaseNotification.notify({
   *     userId: 42,
   *     purchaseType: 'local',
   *     type: 'dispatch',
   *     title: '📤 New Purchase Request',
   *     body: 'Request PR-2026-012 has been assigned to you.',
   *     referenceId: 15,
   *     referenceType: 'purchase_request',
   *   });
   */
  PurchaseNotification.notify = async function ({
    userId,
    purchaseType = 'local',
    type,
    title,
    body = null,
    referenceId = null,
    referenceType = null,
    metadata = {},
  }) {
    return PurchaseNotification.create({
      user_id: userId,
      purchase_type: purchaseType,
      type,
      title,
      body,
      reference_id: referenceId,
      reference_type: referenceType,
      metadata,
    });
  };

  /**
   * Create the same purchase notification for many users in one query.
   *
   * bulkCreate does not fire per-row afterCreate hooks, so we also
   * fire a single batched push for all recipients here.
   */
  PurchaseNotification.notifyMany = async function (
    userIds,
    {
      purchaseType = 'local',
      type,
      title,
      body = null,
      referenceId = null,
      referenceType = null,
      metadata = {},
    }
  ) {
    const uniqueIds = [...new Set((userIds || []).filter((id) => !!id))];
    if (uniqueIds.length === 0) return [];

    const rows = uniqueIds.map((uid) => ({
      user_id: uid,
      purchase_type: purchaseType,
      type,
      title,
      body,
      reference_id: referenceId,
      reference_type: referenceType,
      metadata,
    }));

    const created = await PurchaseNotification.bulkCreate(rows, {
      returning: true,
    });

    // ------------------------------------------------------------------
    // Fire a push for every created row. Best-effort — try/catch so a
    // push failure NEVER breaks the notification insert.
    // ------------------------------------------------------------------
    try {
      const { sendPushToUsers } = require('../services/pushService');

      await sendPushToUsers(uniqueIds, {
        title,
        body: body || '',
        data: {
          type,
          referenceId,
          referenceType,
        },
      });
    } catch (err) {
      console.error('⚠️ notifyMany push error:', err.message);
    }

    return created;
  };

  /**
   * Unread count for a user, optionally scoped to one purchase_type.
   */
  PurchaseNotification.unreadCountFor = async function (
    userId,
    purchaseType = null
  ) {
    const where = { user_id: userId, is_read: false };
    if (purchaseType) where.purchase_type = purchaseType;
    return PurchaseNotification.count({ where });
  };

  /**
   * Mark one notification as read (scoped to owner).
   */
  PurchaseNotification.markRead = async function (notificationId, userId) {
    const row = await PurchaseNotification.findOne({
      where: { id: notificationId, user_id: userId },
    });
    if (!row) return null;
    if (!row.is_read) {
      row.is_read = true;
      row.read_at = new Date();
      await row.save();
    }
    return row;
  };

  /**
   * Mark all unread notifications as read for a user,
   * optionally scoped to one purchase_type.
   */
  PurchaseNotification.markAllRead = async function (
    userId,
    purchaseType = null
  ) {
    const where = { user_id: userId, is_read: false };
    if (purchaseType) where.purchase_type = purchaseType;

    const [affected] = await PurchaseNotification.update(
      { is_read: true, read_at: new Date() },
      { where }
    );
    return affected;
  };

  /**
   * Convenience: fetch paginated notifications for a user,
   * optionally filtered by purchase_type.
   */
  PurchaseNotification.listForUser = async function (
    userId,
    {
      purchaseType = null,
      unreadOnly = false,
      limit = 50,
      offset = 0,
      order = [['created_at', 'DESC']],
    } = {}
  ) {
    const where = { user_id: userId };
    if (purchaseType) where.purchase_type = purchaseType;
    if (unreadOnly) where.is_read = false;

    const { rows, count } = await PurchaseNotification.findAndCountAll({
      where,
      order,
      limit,
      offset,
    });

    return { items: rows, total: count };
  };

  return PurchaseNotification;
};