'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FormulationDetail extends Model {
    static associate(models) {
      // 🔗 Link to Formulation
      FormulationDetail.belongsTo(models.Formulation, {
        foreignKey: 'formulationId',
        as: 'formulation'
        // ✅ No targetKey needed - Formulation uses 'id' as primary key
      });

      // 🔗 Link to Item (Raw Material)
      FormulationDetail.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item',
        targetKey: 'itemId'  // ✅ Item uses 'itemId' as primary key (field: 'id')
      });

      // 🔗 Link to UOM
      FormulationDetail.belongsTo(models.UOM, {
        foreignKey: 'uomId',
        as: 'uom',
        targetKey: 'uomId'  // ✅ UOM uses 'uomId' as primary key (field: 'id')
      });
    }

    // ✅ Instance methods
    getTotalCost() {
      return this.quantity * (this.item?.costPrice || 0);
    }

    getConversionDisplay() {
      if (this.item?.conversionUom && this.item?.conversionValue > 0) {
        return `${this.item.conversionValue} ${this.item.conversionUom.code} = 1 ${this.uom?.code || 'unit'}`;
      }
      return `1 ${this.uom?.code || 'unit'} = 1 ${this.uom?.code || 'unit'}`;
    }

    isValidQuantity() {
      return this.quantity > 0;
    }

    // 🔥 Get full detail data with all related info
    getFullData() {
      return {
        id: this.id,
        formulationId: this.formulationId,
        itemId: this.itemId,
        itemCode: this.item?.code || null,
        itemName: this.item?.name || null,
        quantity: this.quantity,
        uomId: this.uomId,
        uomCode: this.uom?.code || null,
        uomName: this.uom?.name || null,
        costPrice: this.item?.costPrice || 0,
        totalCost: this.quantity * (this.item?.costPrice || 0),
        conversionUomId: this.item?.conversionUomId || null,
        conversionUomCode: this.item?.conversionUom?.code || null,
        conversionValue: this.item?.conversionValue || 0,
        conversionDisplay: this.getConversionDisplay(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  }

  FormulationDetail.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      formulationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'formulation_id',
        references: {
          model: 'formulations',
          key: 'id'
        },
        validate: {
          notNull: {
            msg: 'Formulation ID is required'
          },
          isInt: {
            msg: 'Formulation ID must be an integer'
          }
        }
      },
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id',
        references: {
          model: 'items',
          key: 'id'
        },
        validate: {
          notNull: {
            msg: 'Item (raw material) is required'
          },
          isInt: {
            msg: 'Item ID must be an integer'
          }
        }
      },
      quantity: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: {
            args: [0.0001],
            msg: 'Quantity must be greater than 0'
          },
          isDecimal: {
            msg: 'Quantity must be a valid number'
          }
        }
      },
      uomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'uom_id',
        references: {
          model: 'uom',
          key: 'id'
        },
        validate: {
          notNull: {
            msg: 'Unit of measurement is required'
          },
          isInt: {
            msg: 'UOM ID must be an integer'
          }
        }
      },
      // 🔥 VIRTUAL FIELDS - From Item table
      itemCode: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.item?.code || null;
        }
      },
      itemName: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.item?.name || null;
        }
      },
      itemCostPrice: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.item?.costPrice || 0;
        }
      },
      conversionUomId: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.item?.conversionUomId || null;
        }
      },
      conversionValue: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.item?.conversionValue || 0;
        }
      },
      totalCost: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.quantity * (this.item?.costPrice || 0);
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    },
    {
      sequelize,
      modelName: 'FormulationDetail',
      tableName: 'formulation_details',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        // ✅ Before create - validate
        beforeCreate: async (detail) => {
          // Check if item exists
          const item = await sequelize.models.Item.findByPk(detail.itemId);
          if (!item) {
            throw new Error(`Item with ID ${detail.itemId} not found`);
          }
          
          // Check if formulation exists
          const formulation = await sequelize.models.Formulation.findByPk(detail.formulationId);
          if (!formulation) {
            throw new Error(`Formulation with ID ${detail.formulationId} not found`);
          }
          
          // If uomId not provided, use item's default uomId
          if (!detail.uomId) {
            detail.uomId = item.uomId;
          }
          
          // Check if same item already exists in this formulation
          const existing = await sequelize.models.FormulationDetail.findOne({
            where: {
              formulationId: detail.formulationId,
              itemId: detail.itemId
            }
          });
          
          if (existing) {
            throw new Error('This item is already added to the formulation');
          }
        },
        
        // ✅ Before update - validate
        beforeUpdate: async (detail) => {
          // Check if formulation is editable
          const formulation = await sequelize.models.Formulation.findByPk(detail.formulationId);
          if (!formulation) {
            throw new Error(`Formulation with ID ${detail.formulationId} not found`);
          }
          
          if (!formulation.isEditable()) {
            throw new Error('Cannot modify details of an inactive or discontinued formulation');
          }
          
          // Check if quantity is valid
          if (detail.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
          }
        }
      }
    }
  );

  // ================================================================
  // 🔥 STATIC METHODS
  // ================================================================

  // Get all details for a formulation
  FormulationDetail.getByFormulation = async function(formulationId) {
    return this.findAll({
      where: { formulationId },
      include: [
        { 
          model: sequelize.models.Item, 
          as: 'item',
          include: [
            { model: sequelize.models.UOM, as: 'conversionUom' }
          ]
        },
        { model: sequelize.models.UOM, as: 'uom' }
      ],
      order: [['id', 'ASC']]
    });
  };

  // Get total quantity for an item across all formulations
  FormulationDetail.getTotalUsage = async function(itemId) {
    const result = await this.sum('quantity', {
      where: { itemId }
    });
    return result || 0;
  };

  // Check if item is used in any active formulation
  FormulationDetail.isItemUsed = async function(itemId) {
    const count = await this.count({
      where: { itemId },
      include: [
        {
          model: sequelize.models.Formulation,
          as: 'formulation',
          where: { status: 'Active' }
        }
      ]
    });
    return count > 0;
  };

  // Get formulations using a specific item
  FormulationDetail.getFormulationsByItem = async function(itemId) {
    const details = await this.findAll({
      where: { itemId },
      include: [
        {
          model: sequelize.models.Formulation,
          as: 'formulation',
          include: [
            { model: sequelize.models.FinishedGood, as: 'finishedGood' }
          ]
        },
        { model: sequelize.models.UOM, as: 'uom' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return details.map(d => d.getFullData());
  };

  // Bulk create details with validation
  FormulationDetail.bulkCreateWithValidation = async function(details, options = {}) {
    const { formulationId } = options;
    
    // Check if formulation exists and is editable
    const formulation = await sequelize.models.Formulation.findByPk(formulationId);
    if (!formulation) {
      throw new Error(`Formulation with ID ${formulationId} not found`);
    }
    
    if (!formulation.isEditable()) {
      throw new Error('Cannot add details to an inactive or discontinued formulation');
    }
    
    // Validate all items exist
    const itemIds = details.map(d => d.itemId);
    const items = await sequelize.models.Item.findAll({
      where: { itemId: itemIds },
      attributes: ['itemId', 'uomId']
    });
    
    if (items.length !== itemIds.length) {
      const foundIds = items.map(i => i.itemId);
      const missingIds = itemIds.filter(id => !foundIds.includes(id));
      throw new Error(`Items not found: ${missingIds.join(', ')}`);
    }
    
    // Check for duplicates
    const uniqueItemIds = new Set(itemIds);
    if (uniqueItemIds.size !== itemIds.length) {
      throw new Error('Duplicate items detected in the list');
    }
    
    // Prepare details with default uomId if not provided
    const preparedDetails = details.map(d => {
      const item = items.find(i => i.itemId === d.itemId);
      return {
        ...d,
        uomId: d.uomId || item.uomId,
        formulationId
      };
    });
    
    return this.bulkCreate(preparedDetails, {
      validate: true,
      individualHooks: true
    });
  };

  return FormulationDetail;
};