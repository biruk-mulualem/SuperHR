// models/TemelashRecord.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TemelashRecord extends Model {
    static associate(models) {
      // Parent request
      TemelashRecord.belongsTo(models.ItemRequest, {
        foreignKey: 'requestId',
        as: 'request',
        targetKey: 'requestId',
      });

      // Asking store
      TemelashRecord.belongsTo(models.Store, {
        foreignKey: 'askingStoreId',
        as: 'askingStore',
      });

      // Supplying store
      TemelashRecord.belongsTo(models.Store, {
        foreignKey: 'supplyingStoreId',
        as: 'supplyingStore',
      });

      // The user who requested it
      TemelashRecord.belongsTo(models.User, {
        foreignKey: 'requestedById',
        as: 'requestedByUser',
        targetKey: 'userId',
      });

      // The user who marked it returned
      TemelashRecord.belongsTo(models.User, {
        foreignKey: 'returnedById',
        as: 'returnedByUser',
        targetKey: 'userId',
      });
    }

    // ------------------------------------------------------------
    // Instance helpers
    // ------------------------------------------------------------

    isOut() {
      return this.status === 'out';
    }

    isReturned() {
      return this.status === 'returned';
    }

    canReturn() {
      return this.status === 'out';
    }

    getTotalQuantity() {
      if (!this.items || !Array.isArray(this.items)) return 0;
      return this.items.reduce((sum, item) => {
        return sum + parseFloat(item.quantity || 0);
      }, 0);
    }

    getTotalItems() {
      return Array.isArray(this.items) ? this.items.length : 0;
    }

    // ✅ NEW: is the loan past its return-by date?
    isOverdue() {
      if (!this.toDate || this.status !== 'out') return false;
      return new Date() > new Date(this.toDate);
    }

    // ✅ NEW: how many days until (or past) the deadline?
    daysUntilDue() {
      if (!this.toDate) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(this.toDate);
      due.setHours(0, 0, 0, 0);
      return Math.round((due - today) / (1000 * 60 * 60 * 24));
    }

    getFullInfo() {
      return {
        id: this.id,
        requestId: this.requestId,
        requestCode: this.requestCode,
        askingStore: this.askingStore,
        supplyingStore: this.supplyingStore,
        requestedByUser: this.requestedByUser,
        requestedBy: this.requestedBy,
        items: this.items,
        remark: this.remark,
        status: this.status,
        issuedAt: this.issuedAt,
        returnedAt: this.returnedAt,
        returnedByUser: this.returnedByUser,
        returnRemark: this.returnRemark,
        // ✅ NEW
        fromDate: this.fromDate,
        toDate: this.toDate,
        returnedLate: this.returnedLate,
        isOverdue: this.isOverdue(),
        daysUntilDue: this.daysUntilDue(),
        totalItems: this.getTotalItems(),
        totalQuantity: this.getTotalQuantity(),
        createdAt: this.created_at,
        updatedAt: this.updated_at,
      };
    }
  }

  TemelashRecord.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'request_id',
        references: {
          model: 'item_requests',
          key: 'id',
        },
      },
      requestCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'request_code',
      },
      askingStoreId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'asking_store_id',
        references: {
          model: 'stores',
          key: 'id',
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
      },
      requestedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'requested_by_id',
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      requestedBy: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'requested_by',
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('out', 'returned'),
        allowNull: false,
        defaultValue: 'out',
        validate: {
          isIn: [['out', 'returned']],
        },
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'issued_at',
      },
      returnedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'returned_at',
      },
      returnedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'returned_by_id',
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      returnRemark: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'return_remark',
      },

      // ✅ NEW: loan window + late-return flag
      fromDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'from_date',
      },
      toDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'to_date',
      },
      returnedLate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'returned_late',
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      modelName: 'TemelashRecord',
      tableName: 'temelash_records',
      timestamps: false, // we manage created_at / updated_at ourselves
      hooks: {
        beforeUpdate: (record) => {
          record.updated_at = new Date();
        },
      },
    }
  );

  // ================================================================
  // STATIC METHODS
  // ================================================================

  // Get all records that are still out
  TemelashRecord.getOut = function () {
    return this.findAll({
      where: { status: 'out' },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        {
          model: sequelize.models.User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email'],
        },
      ],
      order: [['issued_at', 'DESC']],
    });
  };

  // Get all records that have been returned
  TemelashRecord.getReturned = function () {
    return this.findAll({
      where: { status: 'returned' },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        {
          model: sequelize.models.User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email'],
        },
      ],
      order: [['returned_at', 'DESC']],
    });
  };

  // ✅ NEW: get all overdue OUT records (past to_date)
  TemelashRecord.getOverdue = function () {
    const today = new Date().toISOString().split('T')[0];
    return this.findAll({
      where: {
        status: 'out',
        toDate: { [sequelize.Op.lt]: today },
      },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        {
          model: sequelize.models.User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email'],
        },
      ],
      order: [['to_date', 'ASC']],
    });
  };

  // Find record by request ID (only the "out" one)
  TemelashRecord.findByRequest = function (requestId) {
    return this.findOne({
      where: { requestId, status: 'out' },
      include: [
        { model: sequelize.models.Store, as: 'askingStore' },
        { model: sequelize.models.Store, as: 'supplyingStore' },
        {
          model: sequelize.models.User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email'],
        },
      ],
    });
  };

  // Get records for a specific store (either as asking or supplying)
  TemelashRecord.getByStore = function (storeId) {
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
          model: sequelize.models.User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email'],
        },
      ],
      order: [['issued_at', 'DESC']],
    });
  };

  // Simple stats for a store
  TemelashRecord.getStats = async function () {
    const out = await this.count({ where: { status: 'out' } });
    const returned = await this.count({ where: { status: 'returned' } });
    const total = await this.count();

    // ✅ NEW: how many are currently overdue?
    const today = new Date().toISOString().split('T')[0];
    const overdue = await this.count({
      where: {
        status: 'out',
        toDate: { [sequelize.Op.lt]: today },
      },
    });

    return { total, out, returned, overdue };
  };

  return TemelashRecord;
};