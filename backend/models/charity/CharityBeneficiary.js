'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CharityBeneficiary extends Model {
    static associate(models) {
      // Which team this beneficiary belongs to
      CharityBeneficiary.belongsTo(models.CharityTeam, {
        foreignKey: 'teamId',
        as: 'team',
      });

      // Who registered this beneficiary
      CharityBeneficiary.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator',
      });

      // Who last updated this beneficiary
      CharityBeneficiary.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updater',
      });

      // Who deleted this beneficiary
      CharityBeneficiary.belongsTo(models.User, {
        foreignKey: 'deletedBy',
        as: 'deleter',
      });
    }
  }

  CharityBeneficiary.init(
    {
      beneficiaryId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'beneficiary_id',
      },
      fullname: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true },
      },
      // Future-proof info bag:
      // { location: { region, city, woreda }, contact: { phone, email }, … }
      fullInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'full_info',
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'team_id',
        references: { model: 'charity_teams', key: 'team_id' },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      monthlyAllocation: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
        field: 'monthly_allocation',
      },
      paymentMethod: {
        type: DataTypes.ENUM('cash', 'bank'),
        defaultValue: 'bank',
        allowNull: false,
        field: 'payment_method',
      },
      bankInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: { account_no: '', bank: '' },
        field: 'bank_info',
      },
      isSpecialCase: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'is_specialcase',
      },
      // Array of objects for deliveries
      deliveries: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // Array of objects for adjustments
      adjustments: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: { model: 'users', key: 'user_id' },
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: { model: 'users', key: 'user_id' },
      },
      deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'deleted_by',
        references: { model: 'users', key: 'user_id' },
      },
    },
    {
      sequelize,
      modelName: 'CharityBeneficiary',
      tableName: 'charity_beneficiaries',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return CharityBeneficiary;
};
