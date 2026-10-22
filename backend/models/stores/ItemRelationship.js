'use strict';
const { Model } = require('sequelize');
const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemRelationship extends Model {
    static associate(models) {
      // Both items in the pair
      ItemRelationship.belongsTo(models.Item, {
        foreignKey: 'itemAId',
        as: 'itemA',
      });
      ItemRelationship.belongsTo(models.Item, {
        foreignKey: 'itemBId',
        as: 'itemB',
      });

      // Audit users — target is users.user_id (User.userId)
      ItemRelationship.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'createdByUser',
      });
      ItemRelationship.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updatedByUser',
      });
    }

    // ================================================================
    // INSTANCE METHODS
    // ================================================================

    /**
     * Enriched JSON matching what the frontend expects.
     */
    toApiJSON() {
      return {
        id: this.id,
        relationshipCode: this.relationshipCode,
        remark: this.remark || null,
        status: this.status,
        itemAId: this.itemAId,
        itemBId: this.itemBId,
        itemA: this.itemA
          ? {
              itemId: this.itemA.itemId,
              code: this.itemA.code,
              name: this.itemA.standardName || this.itemA.name,
              uom: this.itemA.uom?.code || null,
            }
          : null,
        itemB: this.itemB
          ? {
              itemId: this.itemB.itemId,
              code: this.itemB.code,
              name: this.itemB.standardName || this.itemB.name,
              uom: this.itemB.uom?.code || null,
            }
          : null,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    }

    isActive() {
      return this.status === 'Active';
    }

    /**
     * Sorted "lowId-highId" key — used to check duplicates
     * in either direction (A↔B or B↔A).
     */
    getPairKey() {
      const [lo, hi] = [this.itemAId, this.itemBId].sort((a, b) => a - b);
      return `${lo}-${hi}`;
    }
  }

  ItemRelationship.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },

      relationshipCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        field: 'relationship_code',
        validate: {
          notEmpty: true,
          is: /^REL\d{4,}$/,
        },
      },

      itemAId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_a_id',
        references: {
          model: 'items',
          key: 'id',              // items.itemId → field: 'id'
        },
      },

      itemBId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_b_id',
        references: {
          model: 'items',
          key: 'id',              // items.itemId → field: 'id'
        },
      },

      remark: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      status: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'Active',
        validate: {
          isIn: [['Active', 'Inactive']],
        },
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'user_id',         // users.userId → field: 'user_id'
        },
      },

      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: {
          model: 'users',
          key: 'user_id',         // users.userId → field: 'user_id'
        },
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'ItemRelationship',
      tableName: 'item_relationships',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // ============================================================
      // MODEL-LEVEL VALIDATION — enforce A ≠ B
      // (DB also enforces via chk_item_relationships_distinct)
      // ============================================================
      validate: {
        itemPairDistinct() {
          if (
            this.itemAId &&
            this.itemBId &&
            Number(this.itemAId) === Number(this.itemBId)
          ) {
            throw new Error('Item A and Item B cannot be the same.');
          }
        },
      },

      // ============================================================
      // HOOKS
      // ============================================================
      hooks: {
        beforeCreate: async (row) => {
          if (!row.relationshipCode) {
            row.relationshipCode = await ItemRelationship.generateRelationshipCode();
          }
        },
        beforeUpdate: async (row) => {
          // relationshipCode is immutable — refuse silent changes
          if (row.changed('relationshipCode')) {
            row.relationshipCode = row.previous('relationshipCode');
          }
        },
        beforeBulkCreate: async (rows) => {
          for (const row of rows) {
            if (!row.relationshipCode) {
              row.relationshipCode = await ItemRelationship.generateRelationshipCode();
            }
          }
        },
      },
    }
  );

  // ================================================================
  // STATIC METHOD: generateRelationshipCode
  // Mirrors Item.generateItemCode() — checks for existing codes so
  // concurrent creates don't collide.
  // ================================================================
  ItemRelationship.generateRelationshipCode = async function (transaction = null) {
    const prefix = 'REL';
    const paddingLength = 4;

    const lastRow = await this.findOne({
      order: [['relationship_code', 'DESC']],
      where: {
        relationship_code: {
          [Op.startsWith]: prefix,
        },
      },
      attributes: ['relationship_code'],
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
      transaction,
    });

    let nextNumber = 1;

    if (lastRow && lastRow.relationshipCode) {
      const numStr = lastRow.relationshipCode.replace(prefix, '');
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }

    // Collision check — bump until unique
    let code = `${prefix}${String(nextNumber).padStart(paddingLength, '0')}`;
    let exists = await this.findOne({
      where: { relationship_code: code },
      attributes: ['id'],
      transaction,
    });
    let attempts = 0;
    const maxAttempts = 1000;

    while (exists && attempts < maxAttempts) {
      nextNumber++;
      code = `${prefix}${String(nextNumber).padStart(paddingLength, '0')}`;
      exists = await this.findOne({
        where: { relationship_code: code },
        attributes: ['id'],
        transaction,
      });
      attempts++;
    }

    if (exists) {
      throw new Error(
        `Unable to generate unique relationship code after ${maxAttempts} attempts`
      );
    }

    console.log('📝 Generated unique relationship code:', code);
    return code;
  };

  // ================================================================
  // STATIC METHOD: findExistingPair
  // Find a relationship between two items, regardless of direction.
  // ================================================================
  ItemRelationship.findExistingPair = async function (itemAId, itemBId, options = {}) {
    const { excludeId = null, transaction = null } = options;

    const where = {
      [Op.or]: [
        { itemAId: Number(itemAId), itemBId: Number(itemBId) },
        { itemAId: Number(itemBId), itemBId: Number(itemAId) },
      ],
    };
    if (excludeId != null) {
      where.id = { [Op.ne]: Number(excludeId) };
    }

    return this.findOne({ where, transaction });
  };

  // ================================================================
  // STATIC METHOD: getActiveRelationships
  // Returns all Active relationships with both items joined.
  // ================================================================
  ItemRelationship.getActiveRelationships = function () {
    return this.findAll({
      where: { status: 'Active' },
      include: [
        {
          model: sequelize.models.Item,
          as: 'itemA',
          include: [{ model: sequelize.models.UOM, as: 'uom' }],
        },
        {
          model: sequelize.models.Item,
          as: 'itemB',
          include: [{ model: sequelize.models.UOM, as: 'uom' }],
        },
      ],
      order: [['id', 'DESC']],
    });
  };

  // ================================================================
  // STATIC METHOD: findRelatedItems
  // Given an item, return the item(s) it is related to.
  // Useful later when the request form needs to resolve families.
  // ================================================================
  ItemRelationship.findRelatedItems = async function (itemId) {
    const rows = await this.findAll({
      where: {
        status: 'Active',
        [Op.or]: [
          { itemAId: Number(itemId) },
          { itemBId: Number(itemId) },
        ],
      },
      include: [
        {
          model: sequelize.models.Item,
          as: 'itemA',
          include: [{ model: sequelize.models.UOM, as: 'uom' }],
        },
        {
          model: sequelize.models.Item,
          as: 'itemB',
          include: [{ model: sequelize.models.UOM, as: 'uom' }],
        },
      ],
    });

    const relatedIds = new Set();
    rows.forEach((r) => {
      if (r.itemAId !== Number(itemId)) relatedIds.add(r.itemAId);
      if (r.itemBId !== Number(itemId)) relatedIds.add(r.itemBId);
    });

    if (relatedIds.size === 0) return [];

    return sequelize.models.Item.findAll({
      where: { itemId: { [Op.in]: [...relatedIds] }, status: 'Active' },
      include: [{ model: sequelize.models.UOM, as: 'uom' }],
    });
  };

  return ItemRelationship;
};