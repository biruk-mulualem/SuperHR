'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Item extends Model {
    static associate(models) {
      Item.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category',
      });
      Item.belongsTo(models.UOM, {
        foreignKey: 'uomId',
        as: 'uom',
      });
      Item.belongsTo(models.UOM, {
        foreignKey: 'conversionUomId',
        as: 'conversionUom',
      });
    }

    // Instance method to get full item info
    getFullInfo() {
      return {
        id: this.itemId,
        code: this.code,
        name: this.name,
        standardName: this.standardName,
        description: this.description,
        brand: this.brand,
        model: this.model,
        barcode: this.barcode,
        category: this.category,
        uom: this.uom,
        conversionUom: this.conversionUom,
        conversionValue: this.conversionValue,
        costPrice: this.costPrice,
        status: this.status,
        specType: this.specType,
        specText: this.specText,
        specPdfName: this.specPdfName,
        specPdfSize: this.specPdfSize,
        specPdfUrl: this.specPdfUrl,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      };
    }

    // Instance method to check if item is active
    isActive() {
      return this.status === 'Active';
    }

    // Instance method to get conversion display
    getConversionDisplay() {
      if (this.conversionUom && this.conversionValue > 0) {
        return `${this.conversionValue} ${this.conversionUom.code} = 1 ${this.uom.code}`;
      }
      return `1 ${this.uom.code} = 1 ${this.uom.code}`;
    }
  }

  Item.init(
    {
      itemId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id',
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          is: /^SDT\d{6}$/,
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      standardName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'standard_name',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      brand: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      barcode: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          len: [0, 100],
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'category_id',
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      uomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'uom_id',
        references: {
          model: 'uom',
          key: 'id',
        },
      },
      conversionUomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'conversion_uom_id',
        references: {
          model: 'uom',
          key: 'id',
        },
      },
      conversionValue: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'conversion_value',
        validate: {
          min: 0,
        },
      },
      costPrice: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'cost_price',
        validate: {
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM('Active', 'Inactive', 'Discontinued'),
        allowNull: false,
        defaultValue: 'Active',
      },
      isActive: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.status === 'Active';
        },
        set(value) {
          this.status = value ? 'Active' : 'Inactive';
        }
      },
      specType: {
        type: DataTypes.ENUM('text', 'pdf'),
        allowNull: false,
        defaultValue: 'text',
        field: 'spec_type',
      },
      specText: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'spec_text',
      },
      specPdfName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'spec_pdf_name',
      },
      specPdfSize: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'spec_pdf_size',
      },
      specPdfUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'spec_pdf_url',
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
      modelName: 'Item',
      tableName: 'items',
      // ================================================================
      // 🔥 ADD THESE FOR UTF-8 SUPPORT
      // ================================================================
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: (item) => {
          if (!item.code) {
            // Generate code if not provided
            const timestamp = Date.now().toString().slice(-6);
            item.code = 'SDT' + timestamp.padStart(6, '0');
          }
        },
        beforeUpdate: (item) => {
          // You can add any pre-update logic here
        },
      },
    }
  );

  // Static method to generate next item code
  Item.generateItemCode = async function() {
    const lastItem = await this.findOne({
      order: [['itemId', 'DESC']],
      attributes: ['code'],
    });

    if (!lastItem) {
      return 'SDT000001';
    }

    const lastCode = lastItem.code;
    const lastNumber = parseInt(lastCode.replace('SDT', ''));
    const nextNumber = lastNumber + 1;
    return 'SDT' + String(nextNumber).padStart(6, '0');
  };

  // Static method to get active items
  Item.getActiveItems = function() {
    return this.findAll({
      where: { status: 'Active' },
      include: [
        { model: sequelize.models.Category, as: 'category' },
        { model: sequelize.models.UOM, as: 'uom' },
        { model: sequelize.models.UOM, as: 'conversionUom' },
      ],
      order: [['name', 'ASC']],
    });
  };

  // Static method to search items
  Item.searchItems = function(searchTerm) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { code: { [Op.iLike]: `%${searchTerm}%` } },
          { standardName: { [Op.iLike]: `%${searchTerm}%` } },
          { brand: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: sequelize.models.Category, as: 'category' },
        { model: sequelize.models.UOM, as: 'uom' },
      ],
    });
  };

  // Static method to get items by category
  Item.getItemsByCategory = function(categoryId) {
    return this.findAll({
      where: { categoryId, status: 'Active' },
      include: [
        { model: sequelize.models.Category, as: 'category' },
        { model: sequelize.models.UOM, as: 'uom' },
      ],
      order: [['name', 'ASC']],
    });
  };

  // Static method to deactivate item
  Item.deactivateItem = async function(itemId) {
    const item = await this.findByPk(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    item.status = 'Inactive';
    await item.save();
    return item;
  };

  // Static method to activate item
  Item.activateItem = async function(itemId) {
    const item = await this.findByPk(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    item.status = 'Active';
    await item.save();
    return item;
  };

  return Item;
};