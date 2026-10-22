'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchasingSubgroup extends Model {
    static associate(models) {
      PurchasingSubgroup.belongsTo(models.PurchasingGroup, {
        foreignKey: 'groupId',
        as: 'group',
        onDelete: 'CASCADE',
      });

      PurchasingSubgroup.hasMany(models.PurchasingSubgroupMember, {
        foreignKey: 'subgroupId',
        as: 'members',
        onDelete: 'CASCADE',
        hooks: true,
      });
    }

    /**
     * Generates a unique code inside the parent group.
     * Format: SUB-{groupNumber}-{letter}  → SUB-001-A, SUB-001-B, ...
     */
    static async generateCode(groupId, transaction = null) {
      const group = await sequelize.models.PurchasingGroup.findByPk(groupId, {
        attributes: ['code'],
        transaction,
      });
      if (!group) throw new Error('Parent group not found for code generation');

      const groupNumber = (group.code.match(/\d+/) || ['000'])[0];

      for (let attempt = 0; attempt < 50; attempt++) {
        const count = await PurchasingSubgroup.count({
          where: { groupId },
          transaction,
        });

        const index = count + attempt;
        const letter =
          index < 26
            ? String.fromCharCode(65 + index)
            : `Z${String(index - 25).padStart(2, '0')}`;

        const code = `SUB-${groupNumber}-${letter}`;
        const exists = await PurchasingSubgroup.findOne({
          where: { code },
          attributes: ['id'],
          transaction,
        });
        if (!exists) return code;
      }
      throw new Error('Could not generate unique subgroup code');
    }
  }

  PurchasingSubgroup.init(
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
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id',
        references: { model: 'purchasing_groups', key: 'id' },
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
      modelName: 'PurchasingSubgroup',
      tableName: 'purchasing_subgroups',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['group_id'] },
        { fields: ['status'] },
      ],
    }
  );

  return PurchasingSubgroup;
};