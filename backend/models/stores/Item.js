'use strict';
const { Model } = require('sequelize');

// 🔥 Import Op for operators
const { Op } = require('sequelize');

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
      // 🔥 UTF-8 SUPPORT
      // ================================================================
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (item) => {
          if (!item.code) {
            // 🔥 Use the static method to generate code
            item.code = await Item.generateItemCode();
          }
        },
        beforeUpdate: (item) => {
          // You can add any pre-update logic here
        },
      },
    }
  );

  // ================================================================
  // 🔥 FIXED: generateItemCode - Checks for existing codes
  // ================================================================
  
  Item.generateItemCode = async function() {
    const prefix = 'SDT';
    const paddingLength = 6;
    
    // Get the highest existing code
    const lastItem = await this.findOne({
      order: [['code', 'DESC']],
      where: {
        code: {
          [Op.startsWith]: prefix
        }
      }
    });

    let nextNumber = 1;
    
    if (lastItem && lastItem.code) {
      const codeStr = lastItem.code.replace(prefix, '');
      const parsedNum = parseInt(codeStr, 10);
      if (!isNaN(parsedNum)) {
        nextNumber = parsedNum + 1;
      }
    }

    // 🔥 Check if the generated code already exists
    let code = `${prefix}${String(nextNumber).padStart(paddingLength, '0')}`;
    let exists = await this.findOne({ where: { code } });
    let attempts = 0;
    const maxAttempts = 1000;

    // 🔥 Keep incrementing until we find a unique code
    while (exists && attempts < maxAttempts) {
      nextNumber++;
      code = `${prefix}${String(nextNumber).padStart(paddingLength, '0')}`;
      exists = await this.findOne({ where: { code } });
      attempts++;
    }

    if (exists) {
      throw new Error('Unable to generate unique item code after ' + maxAttempts + ' attempts');
    }

    console.log('📝 Generated unique item code:', code);
    return code;
  };

  // ================================================================
  // STATIC METHODS
  // ================================================================

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

  // 🔥 FIXED: searchItems - Uses Op from import
  Item.searchItems = function(searchTerm) {
    return this.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { code: { [Op.iLike]: `%${searchTerm}%` } },
          { standardName: { [Op.iLike]: `%${searchTerm}%` } },
          { brand: { [Op.iLike]: `%${searchTerm}%` } },
          { model: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: sequelize.models.Category, as: 'category' },
        { model: sequelize.models.UOM, as: 'uom' },
        { model: sequelize.models.UOM, as: 'conversionUom' },
      ],
      order: [['name', 'ASC']],
    });
  };

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

  Item.deactivateItem = async function(itemId) {
    const item = await this.findByPk(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    item.status = 'Inactive';
    await item.save();
    return item;
  };

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