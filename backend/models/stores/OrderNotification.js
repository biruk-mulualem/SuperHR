// models/OrderNotification.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderNotification extends Model {
    static associate(models) {
      // Link to Order
      OrderNotification.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });

      // Link to Store
      OrderNotification.belongsTo(models.Store, {
        foreignKey: 'storeId',
        as: 'store'
      });

      // Link to User who responded
      OrderNotification.belongsTo(models.User, {
        foreignKey: 'respondedBy',
        as: 'respondedByUser'
      });
    }

  // models/OrderNotification.js

getFullData() {
  return {
    id: this.id,
    orderId: this.orderId,
    storeId: this.storeId,
    storeName: this.store?.name || null,
     orderNumber: this.order?.orderNumber || null,  // ✅ Get from associated Order
    productName: this.productName,
    productType: this.productType,
    fgCode: this.fgCode,  // Add this if it exists
    quantity: parseFloat(this.quantity),
    uom: this.uom,
    packaging: this.packaging,
    salesPersonName: this.salesPersonName || '',  // Add this if it exists
    salesPersonPhone: this.salesPersonPhone || '',  // Add this if it exists
    priority: this.priority,
    status: this.status,
    dueDate: this.dueDate,
    sentAt: this.sentAt,
    // ✅ ADD THESE LINES
    sentBy: this.sentBy || null,
    sentById: this.sentById || null,
    respondedAt: this.respondedAt,
    respondedBy: this.respondedByUser?.fullName || this.respondedByUser?.username || null,
    rejectionReason: this.rejectionReason,
    notes: this.notes,
    items: this.items || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
}
  }

  OrderNotification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'order_id'
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'store_id'
      },
      productName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'product_name'
      },
      productType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'product_type'
      },
      quantity: {
        type: DataTypes.DECIMAL(20, 4),
        allowNull: false
      },
      uom: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      packaging: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
      },
      status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed'),
        defaultValue: 'pending'
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'due_date'
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'sent_at'
      },
      sentBy: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'sent_by'
},
sentById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sent_by_id'
},
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'responded_at'
      },
      respondedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'responded_by'
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      items: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
      }
    },
    {
      sequelize,
      modelName: 'OrderNotification',
      tableName: 'order_notifications',
      timestamps: true
    }
  );

  return OrderNotification;
};