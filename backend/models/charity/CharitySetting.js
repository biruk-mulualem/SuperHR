'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharitySetting extends Model {
    static associate(models) {
      // Who last updated this setting row
      CharitySetting.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'lastUpdatedBy',
      });
    }
  }

  CharitySetting.init(
    {
      settingId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'setting_id',
      },
      // 'main' | 'reporting' | … — unique per row
      settingKey: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        defaultValue: 'main',
        field: 'setting_key',
      },
      // [{ distribution_release_id, date, payment_for_indays }]
      distributionRelease: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'distribution_release',
      },
      // { monthly_allocation: 3000, payment_method: 'bank' }
      defaults: {
        type: DataTypes.JSONB,
        defaultValue: {
          monthly_allocation: 3000,
          payment_method: 'bank'
        },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: { model: 'users', key: 'user_id' },
      },
    },
    {
      sequelize,
      modelName: 'CharitySetting',
      tableName: 'charity_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return CharitySetting;
};
