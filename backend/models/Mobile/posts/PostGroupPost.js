// models/posts/PostGroupPost.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostGroupPost extends Model {
    static associate(models) {
      PostGroupPost.belongsTo(models.PostGroup, {
        foreignKey: 'groupId',
        as: 'group',
      });

      PostGroupPost.belongsTo(models.User, {
        foreignKey: 'authorId',
        as: 'author',
      });

      PostGroupPost.belongsTo(models.User, {
        foreignKey: 'reviewedBy',
        as: 'reviewer',
      });

      PostGroupPost.hasMany(models.PostGroupPostImage, {
        foreignKey: 'postId',
        as: 'images',
      });

      PostGroupPost.hasMany(models.PostGroupPostComment, {
        foreignKey: 'postId',
        as: 'comments',
      });

      PostGroupPost.hasMany(models.PostGroupPostRead, {
        foreignKey: 'postId',
        as: 'reads',
      });
    }
  }

  PostGroupPost.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'group_id',
        references: { model: 'post_groups', key: 'id' },
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'author_id',
        references: { model: 'users', key: 'user_id' },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'declined'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reviewNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'review_note',
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reviewed_by',
        references: { model: 'users', key: 'user_id' },
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
      },
    },
    {
      sequelize,
      modelName: 'PostGroupPost',
      tableName: 'post_posts',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [
        { fields: ['group_id', 'status'] },
        { fields: ['author_id'] },
      ],
    }
  );

  return PostGroupPost;
};