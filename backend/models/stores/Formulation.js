'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Formulation extends Model {
    static associate(models) {
      // 🔗 Link to Finished Good (Product)
      Formulation.belongsTo(models.FinishedGood, {
        foreignKey: 'finishedGoodId',
        as: 'finishedGood'
      });

      // 🔗 Link to Formulation Details (Raw Materials)
      Formulation.hasMany(models.FormulationDetail, {
        foreignKey: 'formulationId',
        as: 'details',
        onDelete: 'CASCADE'
      });

      // 🔗 Link to User who created/updated
      Formulation.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'createdByUser',
        targetKey: 'userId'
      });
      Formulation.belongsTo(models.User, {
        foreignKey: 'updatedBy',
        as: 'updatedByUser',
        targetKey: 'userId'
      });
    }

    // ✅ Instance method to get full formulation data
    getFullData() {
      return {
        id: this.id,
        finishedGoodId: this.finishedGoodId,
        fgCode: this.finishedGood?.fgCode || null,
        productName: this.finishedGood?.name || null,
        productType: this.finishedGood?.type || null,
        status: this.status,
        description: this.description,
        version: this.version,
        isActive: this.status === 'Active',
        rawMaterials: this.details?.map(detail => ({
          id: detail.id,
          itemId: detail.itemId,
          itemCode: detail.item?.code || null,
          itemName: detail.item?.name || null,
          quantity: detail.quantity,
          uomId: detail.uomId,
          uomCode: detail.uom?.code || null,
          uomName: detail.uom?.name || null,
          conversionUomId: detail.item?.conversionUomId || null,
          conversionUomCode: detail.item?.conversionUom?.code || null,
          conversionValue: detail.item?.conversionValue || 0,
          costPrice: detail.item?.costPrice || 0,
          totalCost: detail.quantity * (detail.item?.costPrice || 0)
        })),
        totalRawMaterials: this.details?.length || 0,
        totalCost: this.details?.reduce((sum, d) => 
          sum + (d.quantity * (d.item?.costPrice || 0)), 0
        ) || 0,
        createdBy: this.createdBy,
        createdByUser: this.createdByUser ? {
          userId: this.createdByUser.userId,
          username: this.createdByUser.username,
          fullName: this.createdByUser.fullName
        } : null,
        updatedBy: this.updatedBy,
        updatedByUser: this.updatedByUser ? {
          userId: this.updatedByUser.userId,
          username: this.updatedByUser.username,
          fullName: this.updatedByUser.fullName
        } : null,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }

    // ✅ Check if formulation is active
    isActive() {
      return this.status === 'Active';
    }

    // ✅ Check if formulation is editable
    isEditable() {
      return this.status === 'Draft' || this.status === 'Active';
    }

    // ✅ Check if formulation can be deleted
    isDeletable() {
      return this.status === 'Draft';
    }
  }

  Formulation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      finishedGoodId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'finished_good_id',
        references: {
          model: 'finished_goods',
          key: 'id'
        },
        validate: {
          notNull: {
            msg: 'Finished good is required'
          },
          isInt: {
            msg: 'Finished good ID must be an integer'
          }
        }
      },
      status: {
        type: DataTypes.ENUM('Draft', 'Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Draft',
        validate: {
          isIn: {
            args: [['Draft', 'Active', 'Inactive']],
            msg: 'Status must be Draft, Active, or Inactive'
          }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 5000],
            msg: 'Description cannot exceed 5000 characters'
          }
        }
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: {
            args: [1],
            msg: 'Version must be at least 1'
          },
          isInt: {
            msg: 'Version must be an integer'
          }
        }
      },
      // 🔥 VIRTUAL FIELD - Not stored in database
      isActive: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.status === 'Active';
        },
        set(value) {
          this.status = value ? 'Active' : 'Inactive';
        }
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'updated_by',
        references: {
          model: 'users',
          key: 'user_id'
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
      modelName: 'Formulation',
      tableName: 'formulations',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        // ✅ Before validate - auto increment version
        beforeValidate: async (formulation) => {
          if (!formulation.version || formulation.version === 1) {
            const existing = await sequelize.models.Formulation.findOne({
              where: {
                finishedGoodId: formulation.finishedGoodId
              },
              order: [['version', 'DESC']],
              attributes: ['version']
            });
            
            if (existing && existing.version) {
              if (!formulation.id) {
                formulation.version = existing.version + 1;
              }
            }
          }
        },
        
        // ✅ Before create - set default status
        beforeCreate: (formulation) => {
          if (!formulation.status) {
            formulation.status = 'Draft';
          }
        },
        
        // ✅ Before update - prevent certain changes
        beforeUpdate: async (formulation) => {
          if (formulation.changed('finishedGoodId')) {
            const current = await sequelize.models.Formulation.findByPk(formulation.id);
            if (current && current.status === 'Active') {
              throw new Error('Cannot change finished good for an active formulation');
            }
          }
        }
      }
    }
  );

  // ================================================================
  // 🔥 STATIC METHODS
  // ================================================================

  // Get active formulations
  Formulation.getActive = async function() {
    return this.findAll({
      where: { status: 'Active' },
      include: [
        { model: sequelize.models.FinishedGood, as: 'finishedGood' },
        { model: sequelize.models.FormulationDetail, as: 'details' }
      ],
      order: [['createdAt', 'DESC']]
    });
  };

  // Get formulations by finished good
  Formulation.getByFinishedGood = async function(finishedGoodId) {
    return this.findAll({
      where: { finishedGoodId },
      include: [
        { model: sequelize.models.FinishedGood, as: 'finishedGood' },
        { 
          model: sequelize.models.FormulationDetail, 
          as: 'details',
          include: [
            { model: sequelize.models.Item, as: 'item' },
            { model: sequelize.models.UOM, as: 'uom' }
          ]
        }
      ],
      order: [['version', 'DESC']]
    });
  };

  // Search formulations
  Formulation.search = async function(searchTerm) {
    const { Op } = require('sequelize');
    
    return this.findAll({
      include: [
        {
          model: sequelize.models.FinishedGood,
          as: 'finishedGood',
          where: {
            [Op.or]: [
              { fgCode: { [Op.like]: `%${searchTerm}%` } },
              { name: { [Op.like]: `%${searchTerm}%` } }
            ]
          }
        },
        {
          model: sequelize.models.FormulationDetail,
          as: 'details',
          include: [
            { model: sequelize.models.Item, as: 'item' },
            { model: sequelize.models.UOM, as: 'uom' }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  };

  // Get formulation stats
  Formulation.getStats = async function() {
    const total = await this.count();
    const active = await this.count({ where: { status: 'Active' } });
    const draft = await this.count({ where: { status: 'Draft' } });
    const inactive = await this.count({ where: { status: 'Inactive' } });
    
    // Get unique raw materials used
    const details = await sequelize.models.FormulationDetail.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('item_id')), 'item_id']
      ]
    });
    
    return {
      total,
      active,
      draft,
      inactive,
      uniqueMaterials: details.length
    };
  };

  return Formulation;
};