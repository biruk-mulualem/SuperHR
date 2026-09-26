'use strict';
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseRequest extends Model {
    static associate(models) {
      PurchaseRequest.hasMany(models.PurchaseRequestItem, {
        foreignKey: 'requestId',
        as: 'items',
        onDelete: 'CASCADE',
        hooks: true,
      });

      // ✅ Who created this purchase request
      // targetKey is required because users PK is 'userId' (column 'user_id'),
      // not the default 'id' that Sequelize assumes.
      PurchaseRequest.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdBy',
        targetKey: 'userId',
      });

      // ============================================================
      // ✅ NEW — everyone this PR was dispatched to
      // (purchasers + boss; one row per recipient)
      // ============================================================
      PurchaseRequest.hasMany(models.PurchaseFollowUpDispatch, {
        foreignKey: 'purchaseRequestId',
        as: 'dispatchedTo',
        onDelete: 'CASCADE',
        hooks: true,
      });
    }

    /**
     * Generates the next unique PR code like "PR-2026-001".
     * Safe under concurrency (retries on collision).
     */
    static async generatePRNumber(transaction = null) {
      const year = new Date().getFullYear();

      for (let attempt = 0; attempt < 5; attempt++) {
        const last = await PurchaseRequest.findOne({
          where: { prNumber: { [Op.like]: `PR-${year}-%` } },
          order: [['id', 'DESC']],
          attributes: ['prNumber'],
          transaction,
        });

        const lastNum = last?.prNumber
          ? parseInt(last.prNumber.split('-')[2], 10) || 0
          : 0;

        const next = `PR-${year}-${String(lastNum + 1 + attempt).padStart(3, '0')}`;

        const exists = await PurchaseRequest.findOne({
          where: { prNumber: next },
          attributes: ['id'],
          transaction,
        });

        if (!exists) return next;
      }
      throw new Error('Could not generate unique PR number');
    }
  }

  PurchaseRequest.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      prNumber: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
        field: 'pr_number',
      },
      department: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      expertName: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'expert_name',
      },
      preparedBy: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'prepared_by',
      },
      requestedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'requested_date',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
         type: DataTypes.ENUM(
    'draft',
    'pending',
    'submitted',
    'approved',
    'rejected',
  ),
        allowNull: false,
        defaultValue: 'draft',
      },

      

      // ✅ Who created this request (FK to users.user_id)
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by_id',
        references: { model: 'users', key: 'user_id' },
      },

      approvedDocFront: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'approved_doc_front',
      },
      approvedDocFrontName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'approved_doc_front_name',
      },
      approvedDocBack: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'approved_doc_back',
      },
      bossReviewedAt: {
  type: DataTypes.DATE,
  allowNull: true,
  field: 'boss_reviewed_at',
},
declineReason: {
  type: DataTypes.TEXT,
  allowNull: true,
  field: 'decline_reason',
},
      approvedDocBackName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'approved_doc_back_name',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
    },
    {
      sequelize,
      modelName: 'PurchaseRequest',
      tableName: 'purchase_requests',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['department'] },
        { fields: ['requested_date'] },
        { fields: ['created_by_id'] },
      ],
    }
  );

  return PurchaseRequest;
};