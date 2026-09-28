// models/posts/PostGroupPostImage.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostGroupPostImage extends Model {
    static associate(models) {
      PostGroupPostImage.belongsTo(models.PostGroupPost, {
        foreignKey: 'postId',
        as: 'post',
      });

      PostGroupPostImage.belongsTo(models.PostGroupPostImage, {
        foreignKey: 'annotatedFromId',
        as: 'original',
      });

      PostGroupPostImage.hasMany(models.PostGroupPostImage, {
        foreignKey: 'annotatedFromId',
        as: 'annotations',
      });
    }
  }

  PostGroupPostImage.init(
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
      url: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'order_index',
      },
      annotatedFromId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'annotated_from_id',
        references: { model: 'post_images', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'PostGroupPostImage',
      tableName: 'post_images',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      indexes: [{ fields: ['post_id'] }],
    }
  );

  return PostGroupPostImage;
};