'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PurchaseRequest extends Model {
    static associate(models) {
      // ---------- existing associations ----------
      PurchaseRequest.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdBy',
      });

      PurchaseRequest.hasMany(models.PurchaseRequestItem, {
        foreignKey: 'requestId',
        as: 'items',
        onDelete: 'CASCADE',
        hooks: true,
      });

      // ---------- approval workflow ----------
      PurchaseRequest.hasMany(models.PurchaseRequestApproval, {
        foreignKey: 'requestId',
        as: 'approvals',
        onDelete: 'CASCADE',
        hooks: true,
      });

      PurchaseRequest.hasMany(models.PurchaseNotification, {
        foreignKey: 'requestId',
        as: 'notifications',
        onDelete: 'CASCADE',
      });

      PurchaseRequest.belongsTo(models.WorkflowStage, {
        foreignKey: 'currentStageId',
        as: 'currentStage',
      });
    }

    /**
     * Generates a unique PR number like PR-2026-0001.
     * Keeps incrementing until it finds an unused number.
     */
    static async generatePRNumber(transaction = null) {
      const year = new Date().getFullYear();
      const prefix = `PR-${year}-`;

      for (let attempt = 0; attempt < 10; attempt++) {
        const last = await PurchaseRequest.findOne({
          where: { prNumber: { [require('sequelize').Op.like]: `${prefix}%` } },
          order: [['id', 'DESC']],
          attributes: ['prNumber'],
          transaction,
        });

        const lastNum = last?.prNumber
          ? parseInt(last.prNumber.replace(prefix, ''), 10) || 0
          : 0;

        const next = `${prefix}${String(lastNum + 1 + attempt).padStart(4, '0')}`;

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
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },

      // ---------- approval workflow ----------
      currentStageIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'current_stage_index',
      },
      currentStageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'current_stage_id',
        references: { model: 'workflow_stages', key: 'id' },
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'submitted_at',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'rejected_at',
      },
      rejectedByStageIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'rejected_by_stage_index',
      },
      rejectedBySubgroupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'rejected_by_subgroup_id',
        references: { model: 'purchasing_subgroups', key: 'id' },
      },

      // ---------- approved-document fields (existing) ----------
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at',
      },
      approvedDocFront: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'approved_doc_front',
      },
      approvedDocFrontName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'approved_doc_front_name',
      },
      approvedDocBack: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'approved_doc_back',
      },
      approvedDocBackName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'approved_doc_back_name',
      },

      // ---------- owner ----------
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by_id',
        references: { model: 'users', key: 'user_id' },
      },
    },
    {
      sequelize,
      modelName: 'PurchaseRequest',
      tableName: 'purchase_requests',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['status'] },
        { fields: ['priority'] },
        { fields: ['department'] },
        { fields: ['created_by_id'] },
        { fields: ['current_stage_id'] },
        { fields: ['current_stage_index'] },
      ],
    }
  );

  return PurchaseRequest;
};