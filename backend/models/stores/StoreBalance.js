'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StoreBalance extends Model {
    static associate(models) {
      StoreBalance.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store',
      });
      StoreBalance.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group',
      });
      StoreBalance.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item',
      });
      StoreBalance.hasMany(models.StoreBalanceHistory, {
        foreignKey: 'balanceId',
        as: 'history',
      });
    }

    // Helper methods
    getBaseBalance() {
      if (this.item && this.item.conversionValue) {
        return parseFloat(this.balance) * parseFloat(this.item.conversionValue);
      }
      return parseFloat(this.balance);
    }

    isLowStock() {
      return parseFloat(this.balance) <= parseFloat(this.minStockAlert || 0) && 
             parseFloat(this.balance) > 0;
    }

    getBalanceClass() {
      if (parseFloat(this.balance) === 0) return 'zero';
      if (this.isLowStock()) return 'low';
      return 'normal';
    }

    getFullInfo() {
      return {
        id: this.id,
        store: this.store,
        group: this.group,
        item: this.item,
        balance: this.balance,
        minStockAlert: this.minStockAlert,
        status: this.status,
        baseBalance: this.getBaseBalance(),
        isLowStock: this.isLowStock(),
        balanceClass: this.getBalanceClass(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    }
  }

  StoreBalance.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      balance: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      minStockAlert: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'min_stock_alert',
        validate: { min: 0 },
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active',
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
      modelName: 'StoreBalance',
      tableName: 'store_balances',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'group_id', 'item_id'],
          name: 'unique_balance',
        },
      ],
    }
  );

  // ========== STATIC METHODS ==========

  // Get all balances with filters
  StoreBalance.findAllWithFilters = async function(filters = {}) {
    const where = {};
    const include = [
      { model: sequelize.models.Store, as: 'store' },
      { model: sequelize.models.Group, as: 'group' },
      { 
        model: sequelize.models.Item, 
        as: 'item',
        include: [
          { model: sequelize.models.UOM, as: 'uom' },
          { model: sequelize.models.UOM, as: 'conversionUom' },
        ]
      },
    ];

    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.groupId) where.groupId = filters.groupId;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      // PostgreSQL ILIKE for case-insensitive search
      const { Op } = require('sequelize');
      include.push({
        model: sequelize.models.Item,
        as: 'item',
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${filters.search}%` } },
            { code: { [Op.iLike]: `%${filters.search}%` } },
            { standardName: { [Op.iLike]: `%${filters.search}%` } },
            { commonName: { [Op.iLike]: `%${filters.search}%` } },
          ],
        },
        include: [
          { model: sequelize.models.UOM, as: 'uom' },
          { model: sequelize.models.UOM, as: 'conversionUom' },
        ]
      });
    }

    return this.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });
  };

  // Find by store, group, item
  StoreBalance.findByStoreGroupItem = async function(storeId, groupId, itemId) {
    return this.findOne({
      where: { storeId, groupId, itemId },
      include: [
        { model: sequelize.models.Store, as: 'store' },
        { model: sequelize.models.Group, as: 'group' },
        { 
          model: sequelize.models.Item, 
          as: 'item',
          include: [
            { model: sequelize.models.UOM, as: 'uom' },
            { model: sequelize.models.UOM, as: 'conversionUom' },
          ]
        },
      ],
    });
  };

  // Get low stock items
  StoreBalance.getLowStockItems = async function() {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        status: 'Active',
        [Op.and]: [
          sequelize.where(
            sequelize.col('balance'),
            '<=',
            sequelize.col('min_stock_alert')
          ),
          sequelize.where(
            sequelize.col('balance'),
            '>',
            0
          ),
        ],
      },
      include: [
        { model: sequelize.models.Store, as: 'store' },
        { model: sequelize.models.Group, as: 'group' },
        { 
          model: sequelize.models.Item, 
          as: 'item',
          include: [
            { model: sequelize.models.UOM, as: 'uom' },
          ]
        },
      ],
    });
  };

  // Get statistics
  StoreBalance.getStats = async function() {
    const { QueryTypes } = require('sequelize');
    
    const [totalStores] = await sequelize.query(
      'SELECT COUNT(DISTINCT store_id) as count FROM store_balances',
      { type: QueryTypes.SELECT }
    );
    
    const totalItems = await this.count();
    
    const { Op } = require('sequelize');
    const lowStock = await this.count({
      where: {
        status: 'Active',
        [Op.and]: [
          sequelize.where(
            sequelize.col('balance'),
            '<=',
            sequelize.col('min_stock_alert')
          ),
          sequelize.where(
            sequelize.col('balance'),
            '>',
            0
          ),
        ],
      },
    });
    
    const [pendingRequests] = await sequelize.query(
      'SELECT COUNT(*) as count FROM item_requests WHERE status = \'approved\'',
      { type: QueryTypes.SELECT }
    );

    return {
      totalStores: totalStores?.count || 0,
      totalItems: totalItems || 0,
      lowStockItems: lowStock || 0,
      pendingRequestsCount: pendingRequests?.count || 0,
    };
  };

  return StoreBalance;
};