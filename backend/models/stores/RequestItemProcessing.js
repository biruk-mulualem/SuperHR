'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RequestItemProcessing extends Model {
    static associate(models) {
      // Link back to the parent request
      RequestItemProcessing.belongsTo(models.ItemRequest, {
        foreignKey: 'requestId',
        as: 'request',
        targetKey: 'requestId',
      });

      // Link back to the specific request line item
      RequestItemProcessing.belongsTo(models.ItemRequestDetail, {
        foreignKey: 'requestDetailId',
        as: 'requestDetail',
      });

      // Link to the group that processed it
      RequestItemProcessing.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group',
      });

      // Link to the store where it was processed
      RequestItemProcessing.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store',
      });

      // Link to the actual inventory item
      RequestItemProcessing.belongsTo(models.Item, {
        foreignKey: 'itemId',
        as: 'item',
      });

      // Link to the user who processed it
      RequestItemProcessing.belongsTo(models.User, {
        foreignKey: 'processedBy',
        as: 'processedByUser',
      });
    }

    // ----------------------------------------------------------------
    // Helper: is this row fully processed?
    // ----------------------------------------------------------------
    get isCompleted() {
      return parseFloat(this.remainingQuantity) <= 0;
    }

    // ----------------------------------------------------------------
    // Helper: has this row been partially processed?
    // ----------------------------------------------------------------
    get isPartial() {
      const processed = parseFloat(this.processedQuantity) || 0;
      const remaining = parseFloat(this.remainingQuantity) || 0;
      return processed > 0 && remaining > 0;
    }
  }

  RequestItemProcessing.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // Which request this belongs to
      requestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'request_id',
      },

      // Which specific line item in that request
      requestDetailId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'request_detail_id',
      },

      // Which group processed it
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'group_id',
      },

      // Which store
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'store_id',
      },

      // Which inventory item
      itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id',
      },

      // How much was requested (snapshot at time of processing)
      requestedQuantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'requested_quantity',
      },

      // How much has been processed by this group
      processedQuantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'processed_quantity',
      },

      // How much is still remaining
      remainingQuantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'remaining_quantity',
      },

      // Progress status for this item + group combination
      status: {
        type: DataTypes.ENUM('pending', 'partial', 'completed'),
        allowNull: false,
        defaultValue: 'pending',
      },

      // Which UOM was used (for display purposes)
      uomCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'uom_code',
      },

      // Was this processed using base UOM or converted UOM?
      isBaseUom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_base_uom',
      },

      // When it was last processed
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at',
      },

      // Who processed it
      processedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'processed_by',
      },

      // Optional note
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Timestamps
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
      modelName: 'RequestItemProcessing',
      tableName: 'request_item_processing',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // ✅ One row per (request, item, group) — no duplicates
        {
          unique: true,
          fields: ['request_id', 'request_detail_id', 'group_id'],
          name: 'unique_request_item_group',
        },
        // Fast lookups by request + group (most common query)
        {
          fields: ['request_id', 'group_id'],
          name: 'idx_request_group',
        },
        // Fast lookups by status
        {
          fields: ['status'],
          name: 'idx_status',
        },
        // Fast lookups by item
        {
          fields: ['item_id'],
          name: 'idx_item',
        },
      ],
    }
  );

  // ================================================================
  // STATIC HELPER METHODS
  // ================================================================

  /**
   * Get all item-processing records for a request + group
   */
  RequestItemProcessing.getForRequestAndGroup = async function (
    requestId,
    groupId
  ) {
    return this.findAll({
      where: {
        requestId: parseInt(requestId),
        groupId: parseInt(groupId),
      },
    });
  };

  /**
   * Check if a group has fully processed every item in a request.
   * Returns true only when ALL items are 'completed'.
   */
  RequestItemProcessing.hasGroupCompletedAllItems = async function (
    requestId,
    groupId,
    expectedItemIds
  ) {
    const records = await this.findAll({
      where: {
        requestId: parseInt(requestId),
        groupId: parseInt(groupId),
      },
    });

    // Every expected item must have a completed record
    return expectedItemIds.every((itemId) => {
      const record = records.find(
        (r) => parseInt(r.requestDetailId) === parseInt(itemId)
      );
      return record && parseFloat(record.remainingQuantity) <= 0;
    });
  };

  /**
   * Get a summary of progress for a request + group
   */
  RequestItemProcessing.getProgressSummary = async function (
    requestId,
    groupId
  ) {
    const records = await this.findAll({
      where: {
        requestId: parseInt(requestId),
        groupId: parseInt(groupId),
      },
    });

    const total = records.length;
    const completed = records.filter((r) => r.status === 'completed').length;
    const partial = records.filter((r) => r.status === 'partial').length;
    const pending = records.filter((r) => r.status === 'pending').length;

    return { total, completed, partial, pending, records };
  };

  return RequestItemProcessing;
};