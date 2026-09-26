// models/posts/PostGroupPostComment.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostGroupPostComment extends Model {
    static associate(models) {
      PostGroupPostComment.belongsTo(models.PostGroupPost, {
        foreignKey: 'postId',
        as: 'post',
      });

      PostGroupPostComment.belongsTo(models.User, {
        foreignKey: 'authorId',
        as: 'author',
      });
    }
  }

  PostGroupPostComment.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      postId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'post_id',
        references: { model: 'post_posts', key: 'id' },
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'author_id',
        references: { model: 'users', key: 'user_id' },
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'PostGroupPostComment',
      tableName: 'post_comments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [{ fields: ['post_id'] }],
    }
  );

  return PostGroupPostComment;
};