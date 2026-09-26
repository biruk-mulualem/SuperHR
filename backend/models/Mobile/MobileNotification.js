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
      // 'local'   — Local Purchase workflow
      // 'foreign' — Foreign / Import Purchase workflow
      // 'posts'   — Posts / Groups workflow
      purchase_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'local',
        validate: {
          isIn: {
            args: [['local', 'foreign', 'posts']],
            msg: "purchase_type must be 'local', 'foreign', or 'posts'",
          },
        },
      },

      // ==================== EVENT TYPE ====================
      // Purchase:
      //   'dispatch', 'approval_request', 'price_submitted', 'winner_selected',
      //   'request_approved', 'request_declined', 'request_deleted',
      //   'purchase_reminder'
      // Foreign (future):
      //   'shipment_update', 'lc_opened', 'customs_cleared', 'delivery_scheduled'
      // Posts:
      //   'posts.member_invited', 'posts.member_accepted', 'posts.member_removed',
      //   'posts.post_submitted', 'posts.post_approved', 'posts.post_declined',
      //   'posts.post_comment', 'posts.image_signed',
      //   'posts.group_deactivated', 'posts.ownership_transferred'
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
          name: 'idx_mobile_notifications_purchase_type',
          fields: ['purchase_type'],
        },
        {
          name: 'idx_mobile_notifications_user_type',
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

        // Lazy require + try/catch. Never breaks the DB write on push failure.
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
  MobileNotification.PURCHASE_TYPES = {
    LOCAL: 'local',
    FOREIGN: 'foreign',
    POSTS: 'posts',
  };

  // ==================== STATIC HELPERS ====================

  MobileNotification.notify = async function ({
    userId,
    purchaseType = 'local',
    type,
    title,
    body = null,
    referenceId = null,
    referenceType = null,
    metadata = {},
  }) {
    return MobileNotification.create({
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

  MobileNotification.notifyMany = async function (
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

  MobileNotification.unreadCountFor = async function (userId, purchaseType = null) {
    const where = { user_id: userId, is_read: false };
    if (purchaseType) where.purchase_type = purchaseType;
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

  MobileNotification.markAllRead = async function (userId, purchaseType = null) {
    const where = { user_id: userId, is_read: false };
    if (purchaseType) where.purchase_type = purchaseType;

    const [affected] = await MobileNotification.update(
      { is_read: true, read_at: new Date() },
      { where }
    );
    return affected;
  };

  MobileNotification.listForUser = async function (
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
        purchaseType: 'posts',
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
        purchaseType: 'posts',
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
        purchaseType: 'posts',
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
        purchaseType: 'posts',
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
        purchaseType: 'posts',
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
        purchaseType: 'posts',
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
        purchaseType: 'posts',
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
        purchaseType: 'posts',
        type: 'posts.image_signed',
        title: '✍️ Image signed',
        body: `${signerName} signed an image on your post in ${groupName}.`,
        referenceId: postId,
        referenceType: 'post_group_post',
        metadata: { postId, groupId, groupName, signerName },
      }),

    groupDeactivated: ({ recipientIds, groupId, groupName }) =>
      MobileNotification.notifyMany(recipientIds, {
        purchaseType: 'posts',
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
        purchaseType: 'posts',
        type: 'posts.ownership_transferred',
        title: '👑 You are now the owner',
        body: `${previousOwner} handed ownership of "${groupName}" to you.`,
        referenceId: groupId,
        referenceType: 'post_group',
        metadata: { groupId, groupName, previousOwner },
      }),
  };

  return MobileNotification;
};