'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchasingGroup extends Model {
    static associate(models) {
      PurchasingGroup.hasMany(models.PurchasingGroupMember, {
        foreignKey: 'groupId',
        as: 'members',
        onDelete: 'CASCADE',
        hooks: true,
      });
    }

    /**
     * Generates the next unique "GRP-XXX" code.
     * Optional `transaction` keeps it safe against races.
     */
    static async generateCode(transaction = null) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const last = await PurchasingGroup.findOne({
          order: [['id', 'DESC']],
          attributes: ['code'],
          transaction,
        });

        const lastNum = last?.code
          ? parseInt(last.code.replace(/[^0-9]/g, ''), 10) || 0
          : 0;

        const next = `GRP-${String(lastNum + 1 + attempt).padStart(3, '0')}`;

        const exists = await PurchasingGroup.findOne({
          where: { code: next },
          attributes: ['id'],
          transaction,
        });

        if (!exists) return next;
      }
      throw new Error('Could not generate unique group code');
    }
  }

  PurchasingGroup.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: { len: [2, 120] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
    },
    {
      sequelize,
      modelName: 'PurchasingGroup',
      tableName: 'purchasing_groups',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['status'] },
        { fields: ['name'] },
      ],
    }
  );

  return PurchasingGroup;
};