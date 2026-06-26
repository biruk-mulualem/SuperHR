'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoreBalanceHistory extends Model {
    static associate(models) {
      StoreBalanceHistory.belongsTo(models.StoreBalance, {
        foreignKey: 'balanceId',
        as: 'balance',
      });
      StoreBalanceHistory.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store',
      });
      StoreBalanceHistory.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group',
      });
      StoreBalanceHistory.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item',
      });
      StoreBalanceHistory.belongsTo(models.Store, {
        foreignKey: 'sourceStoreId',
        as: 'sourceStore',
      });
      StoreBalanceHistory.belongsTo(models.Store, {
        foreignKey: 'destinationStoreId',
        as: 'destinationStore',
      });
      StoreBalanceHistory.belongsTo(models.User, {
        foreignKey: 'changedBy',
        as: 'changedByUser',
        targetKey: 'userId',
      });
    }

    // Helper methods
    getFullInfo() {
      return {
        id: this.id,
        balanceId: this.balanceId,
        store: this.store,
        group: this.group,
        item: this.item,
        previousBalance: this.previousBalance,
        newBalance: this.newBalance,
        changeAmount: this.changeAmount,
        transactionType: this.transactionType,
        sourceStore: this.sourceStore,
        destinationStore: this.destinationStore,
        referenceType: this.referenceType,
        referenceId: this.referenceId,
        changedByUser: this.changedByUser,
        remark: this.remark,
        createdAt: this.createdAt,
      };
    }

    getDisplayType() {
      return this.transactionType === 'Stock In' ? '📥 Stock In' : '📤 Stock Out';
    }

    getFromTo() {
      if (this.transactionType === 'Stock In') {
        return this.sourceStore ? this.sourceStore.name : 'Supplier';
      }
      return this.destinationStore ? this.destinationStore.name : 'External';
    }
  }

  StoreBalanceHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      balanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'balance_id',
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'store_id',
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id',
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id',
      },
      previousBalance: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'previous_balance',
        validate: { min: 0 },
      },
      newBalance: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'new_balance',
        validate: { min: 0 },
      },
      changeAmount: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        field: 'change_amount',
      },
      transactionType: {
        type: DataTypes.ENUM('Stock In', 'Stock Out'),
        allowNull: false,
        field: 'transaction_type',
      },
      sourceStoreId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'source_store_id',
      },
      destinationStoreId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'destination_store_id',
      },
      referenceType: {
        type: DataTypes.ENUM('purchase', 'transfer', 'adjustment', 'return', 'sale', 'initialization', 'request'),
        allowNull: false,
        defaultValue: 'adjustment',
        field: 'reference_type',
      },
      referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'reference_id',
      },
      changedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'changed_by',
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
    },
    {
      sequelize,
      modelName: 'StoreBalanceHistory',
      tableName: 'store_balance_histories',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        { fields: ['balance_id'], name: 'idx_balance_id' },
        { fields: ['store_id'], name: 'idx_store_id' },
        { fields: ['item_id'], name: 'idx_item_id' },
        { fields: ['created_at'], name: 'idx_created_at' },
        { fields: ['transaction_type'], name: 'idx_transaction_type' },
      ],
    }
  );

  // ========== STATIC METHODS ==========

  // Get all transactions with filters
  StoreBalanceHistory.findAllWithFilters = async function(filters = {}) {
    const { Op } = require('sequelize');
    const where = {};
    const include = [
      { model: sequelize.models.Store, as: 'store' },
      { model: sequelize.models.Group, as: 'group' },
      { 
        model: sequelize.models.Item, 
        as: 'item',
        include: [
          { model: sequelize.models.UOM, as: 'uom' },
        ]
      },
      { model: sequelize.models.Store, as: 'sourceStore' },
      { model: sequelize.models.Store, as: 'destinationStore' },
      { 
        model: sequelize.models.User, 
        as: 'changedByUser',
        attributes: ['userId', 'username', 'fullName', 'email']
      },
    ];

    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.groupId) where.groupId = filters.groupId;
    if (filters.itemId) where.itemId = filters.itemId;
    if (filters.transactionType) where.transactionType = filters.transactionType;

    // Date range filter
    if (filters.startDate) {
      where.createdAt = {
        [Op.gte]: new Date(filters.startDate)
      };
    }
    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        [Op.lte]: new Date(filters.endDate + 'T23:59:59')
      };
    }

    // Search filter (PostgreSQL ILIKE)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      where[Op.or] = [
        { remark: { [Op.iLike]: searchTerm } },
      ];
      
      include.push({
        model: sequelize.models.Item,
        as: 'item',
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: searchTerm } },
            { code: { [Op.iLike]: searchTerm } },
            { standardName: { [Op.iLike]: searchTerm } },
            { commonName: { [Op.iLike]: searchTerm } },
          ],
        },
        include: [
          { model: sequelize.models.UOM, as: 'uom' },
        ]
      });
    }

    return this.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });
  };

  return StoreBalanceHistory;
};