// backend/models/Mobile/MobileNotification.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const MobileNotification = sequelize.define(
    'MobileNotification',
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

      // ==================== SCOPE ====================
      scope: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'local',
        validate: {
          isIn: {
            args: [['local', 'foreign', 'posts', 'store']],
            msg: "scope must be 'local', 'foreign', 'posts', or 'store'",
          },
        },
      },

      // ==================== EVENT TYPE ====================
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
      tableName: 'mobile_notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,

      indexes: [
        {
          name: 'idx_mobile_notifications_user_created',
          fields: ['user_id', { name: 'created_at', order: 'DESC' }],
        },
        {
          name: 'idx_mobile_notifications_user_unread',
          fields: ['user_id', 'is_read'],
          where: { is_read: false },
        },
        {
          name: 'idx_mobile_notifications_type',
          fields: ['type'],
        },
        {
          name: 'idx_mobile_notifications_scope',
          fields: ['scope'],
        },
        {
          name: 'idx_mobile_notifications_user_scope',
          fields: ['user_id', 'scope', 'is_read'],
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

        afterCreate: async (notification) => {
          try {
            const { sendPushToUser } = require('../../services/pushService');
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
  MobileNotification.associate = (models) => {
    MobileNotification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  // ==================== ENUMS ====================
  MobileNotification.SCOPES = {
    LOCAL: 'local',
    FOREIGN: 'foreign',
    POSTS: 'posts',
    STORE: 'store',
  };

  // ==================== STATIC HELPERS ====================

  MobileNotification.notify = async function ({
    userId,
    scope = 'local',
    type,
    title,
    body = null,
    referenceId = null,
    referenceType = null,
    metadata = {},
  }) {
    return MobileNotification.create({
      user_id: userId,
      scope,
      type,
      title,
      body,
      reference_id: referenceId,
      reference_type: referenceType,
      metadata,
    });
  };

  MobileNotification.notifyMany = async function (
    userIds,
    {
      scope = 'local',
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
      scope,
      type,
      title,
      body,
      reference_id: referenceId,
      reference_type: referenceType,
      metadata,
    }));

    const created = await MobileNotification.bulkCreate(rows, {
      returning: true,
    });

    try {
      const { sendPushToUsers } = require('../../services/pushService');
      await sendPushToUsers(uniqueIds, {
        title,
        body: body || '',
        data: { type, referenceId, referenceType },
      });
    } catch (err) {
      console.error('⚠️ notifyMany push error:', err.message);
    }

    return created;
  };

  MobileNotification.unreadCountFor = async function (userId, scope = null) {
    const where = { user_id: userId, is_read: false };
    if (scope) where.scope = scope;
    return MobileNotification.count({ where });
  };

  MobileNotification.markRead = async function (notificationId, userId) {
    const row = await MobileNotification.findOne({
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

  MobileNotification.markAllRead = async function (userId, scope = null) {
    const where = { user_id: userId, is_read: false };
    if (scope) where.scope = scope;

    const [affected] = await MobileNotification.update(
      { is_read: true, read_at: new Date() },
      { where }
    );
    return affected;
  };

  MobileNotification.listForUser = async function (
    userId,
    {
      scope = null,
      unreadOnly = false,
      limit = 50,
      offset = 0,
      order = [['created_at', 'DESC']],
    } = {}
  ) {
    const where = { user_id: userId };
    if (scope) where.scope = scope;
    if (unreadOnly) where.is_read = false;

    const { rows, count } = await MobileNotification.findAndCountAll({
      where,
      order,
      limit,
      offset,
    });

    return { items: rows, total: count };
  };

  // ============================================================================
  // POSTS / GROUPS EVENT HELPERS
  // ============================================================================
  MobileNotification.posts = {
    memberInvited: ({ recipientId, groupId, groupName, inviterName }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.member_invited',
        title: '📨 Group invitation',
        body: `${inviterName} invited you to join "${groupName}".`,
        referenceId: groupId,
        referenceType: 'post_group',
        metadata: { groupId, groupName, inviterName },
      }),

    memberAccepted: ({ recipientId, groupId, groupName, memberName }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.member_accepted',
        title: '✅ Member joined',
        body: `${memberName} accepted your invitation to "${groupName}".`,
        referenceId: groupId,
        referenceType: 'post_group',
        metadata: { groupId, groupName, memberName },
      }),

    memberRemoved: ({ recipientId, groupId, groupName }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.member_removed',
        title: '🚪 Removed from group',
        body: `You were removed from "${groupName}".`,
        referenceId: groupId,
        referenceType: 'post_group',
        metadata: { groupId, groupName },
      }),

    postSubmitted: ({
      recipientIds,
      postId,
      groupId,
      groupName,
      authorName,
      title,
    }) =>
      MobileNotification.notifyMany(recipientIds, {
        scope: 'posts',
        type: 'posts.post_submitted',
        title: '📝 New post awaiting review',
        body: `${authorName} submitted "${title}" in ${groupName}.`,
        referenceId: postId,
        referenceType: 'post_group_post',
        metadata: { postId, groupId, groupName, authorName },
      }),

    postApproved: ({ recipientId, postId, groupId, groupName, title, note }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.post_approved',
        title: '✅ Post approved',
        body: `Your post "${title}" in ${groupName} was approved.${
          note ? ` Note: ${note}` : ''
        }`,
        referenceId: postId,
        referenceType: 'post_group_post',
        metadata: { postId, groupId, groupName, note },
      }),

    postDeclined: ({ recipientId, postId, groupId, groupName, title, reason }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.post_declined',
        title: '⛔ Post declined',
        body: `Your post "${title}" in ${groupName} was declined.${
          reason ? ` Reason: ${reason}` : ''
        }`,
        referenceId: postId,
        referenceType: 'post_group_post',
        metadata: { postId, groupId, groupName, reason },
      }),

    postComment: ({
      recipientId,
      postId,
      groupId,
      groupName,
      commenterName,
      snippet,
    }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.post_comment',
        title: '💬 New comment',
        body: `${commenterName} commented on a post in ${groupName}: "${snippet}"`,
        referenceId: postId,
        referenceType: 'post_group_post',
        metadata: { postId, groupId, groupName, commenterName },
      }),

    postImageSigned: ({
      recipientId,
      postId,
      groupId,
      groupName,
      signerName,
    }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.image_signed',
        title: '✍️ Image signed',
        body: `${signerName} signed an image on your post in ${groupName}.`,
        referenceId: postId,
        referenceType: 'post_group_post',
        metadata: { postId, groupId, groupName, signerName },
      }),

    groupDeactivated: ({ recipientIds, groupId, groupName }) =>
      MobileNotification.notifyMany(recipientIds, {
        scope: 'posts',
        type: 'posts.group_deactivated',
        title: '⏸ Group deactivated',
        body: `"${groupName}" was deactivated. Only the owner can reactivate it.`,
        referenceId: groupId,
        referenceType: 'post_group',
        metadata: { groupId, groupName },
      }),

    ownershipTransferred: ({
      recipientId,
      groupId,
      groupName,
      previousOwner,
    }) =>
      MobileNotification.notify({
        userId: recipientId,
        scope: 'posts',
        type: 'posts.ownership_transferred',
        title: '👑 You are now the owner',
        body: `${previousOwner} handed ownership of "${groupName}" to you.`,
        referenceId: groupId,
        referenceType: 'post_group',
        metadata: { groupId, groupName, previousOwner },
      }),
  };

  // ============================================================================
  // STORE / INVENTORY EVENT HELPERS
  // ============================================================================
  MobileNotification.store = {
    // ────────────────────────────────────────────────────────────
    // Per-item alert (kept for compatibility)
    // ────────────────────────────────────────────────────────────
    stockAlert: ({
      recipientIds,
      itemId,
      itemName,
      itemSku = null,
      storeId,
      storeName,
      groupId = null,
      groupName = null,
      balance,
      threshold,
      unit = 'units',
    }) =>
      MobileNotification.notifyMany(recipientIds, {
        scope: 'store',
        type: 'stock_alert',
        title: `⚠️ Low stock: ${itemName}`,
        body:
          `Balance at ${storeName}${groupName ? ` · ${groupName}` : ''} ` +
          `dropped to ${balance} ${unit} (threshold ${threshold}).` +
          (itemSku ? ` SKU: ${itemSku}.` : ''),
        referenceId: itemId,
        referenceType: 'item',
        metadata: {
          itemId,
          itemName,
          itemSku,
          storeId,
          storeName,
          groupId: groupId ?? null,
          groupName: groupName ?? null,
          balance,
          threshold,
          unit,
        },
      }),

    // ────────────────────────────────────────────────────────────
    // ✅ Summary alert — ONE notification covering N triggered items
    //
    //   await MobileNotification.store.stockAlertSummary({
    //     recipientIds: [12, 34],
    //     items: [
    //       { itemId: 5, itemName: 'Widget A', itemSku: 'WDG-001',
    //         balance: 3, threshold: 5, unit: 'pcs' },
    //       { itemId: 6, itemName: 'Widget B', itemSku: 'WDG-002',
    //         balance: 1, threshold: 10, unit: 'pcs' },
    //     ],
    //   });
    // ────────────────────────────────────────────────────────────
    stockAlertSummary: ({ recipientIds, items }) => {
      const list = Array.isArray(items) ? items.filter(Boolean) : [];
      const count = list.length;
      if (count === 0) return Promise.resolve([]);

      const preview = list
        .slice(0, 3)
        .map((it) => it.itemName || `Item #${it.itemId}`)
        .join(', ');
      const more = count > 3 ? ` +${count - 3} more` : '';

      const title =
        count === 1
          ? `⚠️ 1 item on low stock`
          : `⚠️ ${count} items on low stock`;

      const body =
        `${preview}${more} — ` +
        (count === 1
          ? 'this item is at or below its threshold.'
          : 'these items are at or below their thresholds.');

      return MobileNotification.notifyMany(recipientIds, {
        scope: 'store',
        type: 'stock_alert',
        title,
        body,
        referenceId: null,
        referenceType: 'stock_alert',
        metadata: {
          count,
          items: list.map((it) => ({
            itemId: it.itemId,
            itemName: it.itemName || null,
            itemSku: it.itemSku || null,
            balance: it.balance,
            threshold: it.threshold,
            unit: it.unit || 'units',
          })),
        },
      });
    },
  };

  return MobileNotification;
};