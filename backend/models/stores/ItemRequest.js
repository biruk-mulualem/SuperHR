// models/ItemRequest.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItemRequest extends Model {
    static associate(models) {
      ItemRequest.belongsTo(models.Store, {
        foreignKey: 'askingStoreId',
        as: 'askingStore',
      });
      ItemRequest.belongsTo(models.Store, {
        foreignKey: 'supplyingStoreId',
        as: 'supplyingStore',
      });
      ItemRequest.belongsTo(models.User, {
        foreignKey: 'requestedById',
        as: 'requestedByUser',
        targetKey: 'userId', // User model uses userId as primary key
      });
      ItemRequest.hasMany(models.ItemRequestDetail, {
        foreignKey: 'requestId',
        as: 'items',
        onDelete: 'CASCADE',
      });
// ✅ Print override (one per request)
ItemRequest.hasOne(models.PrintOverride, {
  foreignKey: 'requestId',
  as: 'printOverride',
  onDelete: 'CASCADE',
});
     


ItemRequest.hasMany(models.RequestNotification, {
  foreignKey: 'request_id',
  as: 'notifications',
});

      ItemRequest.hasMany(models.TemelashRecord, {
        foreignKey: 'request_id',
        as: 'temelashRecords',
      });

      
    }

    // Get full request info with all details
    getFullInfo() {
      return {
        id: this.requestId,
        requestCode: this.requestCode,
        askingStore: this.askingStore,
        supplyingStore: this.supplyingStore,
        items: this.items,
        requestedBy: this.requestedByUser ? {
          userId: this.requestedByUser.userId,
          username: this.requestedByUser.username,
          fullName: this.requestedByUser.fullName || this.requestedByUser.username,
          email: this.requestedByUser.email,
          roleId: this.requestedByUser.roleId,
          departmentId: this.requestedByUser.departmentId
        } : null,
        requestedDate: this.requestedDate,
        status: this.status,
        remark: this.remark,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        approvedAt: this.approvedAt,
        finalizedAt: this.finalizedAt,
        statusHistory: this.getStatusHistory(),
      };
    }

    // Status check methods
    canEdit() {
      return this.status !== 'finalized';
    }

    canApprove() {
      return this.status === 'pending';
    }

    canReject() {
      return this.status === 'pending';
    }

    canFinalize() {
      return this.status === 'approved';
    }

    getStatusHistory() {
      return {
        current: this.status,
        canEdit: this.canEdit(),
        canApprove: this.canApprove(),
        canReject: this.canReject(),
        canFinalize: this.canFinalize(),
      };
    }

    // Get total items count
    getTotalItems() {
      return this.items?.length || 0;
    }

    // Get total quantity (sum of all item quantities)
    getTotalQuantity() {
      if (!this.items) return 0;
      return this.items.reduce((sum, item) => {
        return sum + parseFloat(item.quantity || 0);
      }, 0);
    }

    // Check if request has items
    hasItems() {
      return this.items && this.items.length > 0;
    }
  }

  ItemRequest.init(
    {
      requestId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id',
      },
      requestCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'request_code',
        validate: {
          notEmpty: true,
        },
      },
      askingStoreId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'asking_store_id',
        references: {
          model: 'stores',
          key: 'id',
        },
        validate: {
          notNull: true,
        },
      },
      supplyingStoreId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'supplying_store_id',
        references: {
          model: 'stores',
          key: 'id',
        },
        validate: {
          notNull: true,
        },
      },
      requestedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'requested_by_id',
        references: {
          model: 'users',
          key: 'user_id', // Use user_id since that's the actual primary key
        },
      },

      requestedBy: {
  type: DataTypes.STRING(255),
  allowNull: true,
  field: 'requested_by',
},
isAsset: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  field: 'is_asset',
},

      requestedDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'requested_date',
        validate: {
          isDate: true,
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'finalized'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'approved', 'rejected', 'finalized']],
        },
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      finalizedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'finalized_at',
      },

       // ✅ Departments the requester chose NOT to notify
      excludedDepartmentIds: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        field: 'excluded_department_ids',
      },

      // ✅ Temelash (temporary loan) flag
      isTemelash: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_temelash',
      },
      // ✅ NEW: Temelash loan window (only meaningful when isTemelash = true)
temelashFromDate: {
  type: DataTypes.DATEONLY,
  allowNull: true,
  field: 'temelash_from_date',
},
temelashToDate: {
  type: DataTypes.DATEONLY,
  allowNull: true,
  field: 'temelash_to_date',
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
      modelName: 'ItemRequest',
      tableName: 'item_requests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (request) => {
          // ✅ SAFETY NET ONLY — normally the controller supplies requestCode
          // via ItemRequest.generateRequestCode(). This fallback only runs
          // if a caller forgot to pass one.
          if (!request.requestCode) {
            console.warn(
              "⚠️ ItemRequest created without requestCode — using safe fallback generator"
            );
            request.requestCode = await ItemRequest.generateRequestCode();
          }
        },
        beforeUpdate: async (request) => {
          // Set approval/finalization timestamps when status changes
          if (request.changed('status')) {
            if (request.status === 'approved' && !request.approvedAt) {
              request.approvedAt = new Date();
            }
            if (request.status === 'finalized' && !request.finalizedAt) {
              request.finalizedAt = new Date();
            }
          }
        },
      },
    }
  
  );

  // ================================================================
  // STATIC METHODS
  // ================================================================

  // Generate next request code
// ================================================================
// SAFE REQUEST CODE GENERATOR
// Uses MAX(sequence) scoped by today's prefix — survives deletions,
// gaps, and concurrent creates. Never uses count().
// ================================================================
ItemRequest.generateRequestCode = async function (transaction = null, attempt = 0) {
  const dayjs = require("dayjs");
  const { Op } = require("sequelize");

  const prefix = `REQ-${dayjs().format("YYMMDD")}-`;

  const lastToday = await ItemRequest.findOne({
    where: { requestCode: { [Op.like]: `${prefix}%` } },
    order: [["requestCode", "DESC"]],
    attributes: ["requestCode"],
    transaction,
  });

  const lastSeq = lastToday
    ? parseInt(String(lastToday.requestCode).split("-").pop(), 10) || 0
    : 0;

  return `${prefix}${String(lastSeq + 1 + attempt).padStart(3, "0")}`;
};

  // Get requests by user
  ItemRequest.getByUser = function(userId) {
    return this.findAll({
      where: { requestedById: userId },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        { 
          model: sequelize.models.ItemRequestDetail, 
          as: 'items',
          include: [
            { model: sequelize.models.Item, as: 'item' }
          ]
        },
        { 
          model: sequelize.models.User, 
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['createdAt', 'DESC']],
    });
  };

  // Get requests by status
  ItemRequest.getByStatus = function(status) {
    return this.findAll({
      where: { status },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        { 
          model: sequelize.models.ItemRequestDetail, 
          as: 'items',
          include: [
            { model: sequelize.models.Item, as: 'item' }
          ]
        },
        { 
          model: sequelize.models.User, 
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['createdAt', 'DESC']],
    });
  };

  // Get pending requests
  ItemRequest.getPending = function() {
    return this.getByStatus('pending');
  };

  // Get approved requests
  ItemRequest.getApproved = function() {
    return this.getByStatus('approved');
  };

  // Get rejected requests
  ItemRequest.getRejected = function() {
    return this.getByStatus('rejected');
  };

  // Get finalized requests
  ItemRequest.getFinalized = function() {
    return this.getByStatus('finalized');
  };

  // Get requests by store (either as asking or supplying)
  ItemRequest.getByStore = function(storeId) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { askingStoreId: storeId },
          { supplyingStoreId: storeId },
        ],
      },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        { 
          model: sequelize.models.ItemRequestDetail, 
          as: 'items',
          include: [
            { model: sequelize.models.Item, as: 'item' }
          ]
        },
        { 
          model: sequelize.models.User, 
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['createdAt', 'DESC']],
    });
  };

  // Get requests with search
  ItemRequest.search = function(searchTerm) {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        [Op.or]: [
          { requestCode: { [Op.like]: `%${searchTerm}%` } },
          { '$requestedByUser.username$': { [Op.like]: `%${searchTerm}%` } },
          { '$requestedByUser.fullName$': { [Op.like]: `%${searchTerm}%` } },
          { '$requestedByUser.email$': { [Op.like]: `%${searchTerm}%` } },
          { remark: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        { 
          model: sequelize.models.ItemRequestDetail, 
          as: 'items',
          include: [
            { model: sequelize.models.Item, as: 'item' }
          ]
        },
        { 
          model: sequelize.models.User, 
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['createdAt', 'DESC']],
    });
  };

  // Get requests by date range
  ItemRequest.getByDateRange = function(startDate, endDate) {
    return this.findAll({
      where: {
        requestedDate: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        { 
          model: sequelize.models.ItemRequestDetail, 
          as: 'items',
          include: [
            { model: sequelize.models.Item, as: 'item' }
          ]
        },
        { 
          model: sequelize.models.User, 
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['requestedDate', 'DESC']],
    });
  };

  // Get requests with items count
  ItemRequest.getWithItemCount = function() {
    return this.findAll({
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        { 
          model: sequelize.models.ItemRequestDetail, 
          as: 'items',
          include: [
            { model: sequelize.models.Item, as: 'item' }
          ]
        },
        { 
          model: sequelize.models.User, 
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*) 
              FROM item_request_details 
              WHERE item_request_details.request_id = ItemRequest.id
            )`),
            'itemCount'
          ]
        ]
      },
      order: [['createdAt', 'DESC']],
    });
  };

  // Get statistics
  ItemRequest.getStats = async function() {
    const stats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    const total = await this.count();
    
    return {
      total,
      byStatus: stats,
    };
  };

  return ItemRequest;
};