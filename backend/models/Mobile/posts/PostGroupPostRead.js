// models/posts/PostGroupPostRead.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PostGroupPostRead extends Model {
    static associate(models) {
      PostGroupPostRead.belongsTo(models.PostGroupPost, {
        foreignKey: 'postId',
        as: 'post',
      });

      PostGroupPostRead.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    }
  }

  PostGroupPostRead.init(
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: { model: 'users', key: 'user_id' },
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'read_at',
      },
    },
    {
      sequelize,
      modelName: 'PostGroupPostRead',
      tableName: 'post_reads',
      timestamps: false,
      underscored: true,
      indexes: [
        { unique: true, fields: ['post_id', 'user_id'] },
        { fields: ['user_id'] },
      ],
    }
  );

  return PostGroupPostRead;
};