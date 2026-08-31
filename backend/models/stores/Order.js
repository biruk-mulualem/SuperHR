// models/Order.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // Link to Product (Finished Good)
      Order.belongsTo(models.FinishedGood, {
        foreignKey: 'productId',
        as: 'product'
      });

      // Link to User (Sales Person - optional)
      Order.belongsTo(models.User, {
        foreignKey: 'salesPersonId',
        as: 'salesPerson'
      });

      // Link to Order Items
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items',
        onDelete: 'CASCADE'
      });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'order_number'
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id'
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
      salesPersonId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'sales_person_id'
      },
      salesPersonName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'sales_person_name'
      },
      salesPersonPhone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'sales_person_phone'
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      createdDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'created_date'
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'due_date'
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
      acceptedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'accepted_at'
      },
      acceptedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'accepted_by'
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'rejected_at'
      },
      rejectedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'rejected_by'
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason'
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at'
      },
      completedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'completed_by'
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'cancelled_at'
      },
      cancelledBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'cancelled_by'
      },
      restoredFromCancelled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'restored_from_cancelled'
      },
      restoredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'restored_at'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
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
      modelName: 'Order',
      tableName: 'orders',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (order) => {
          if (!order.orderNumber) {
            const year = new Date().getFullYear();
            const lastOrder = await sequelize.models.Order.findOne({
              order: [['id', 'DESC']],
              attributes: ['id']
            });
            const nextId = (lastOrder?.id || 0) + 1;
            order.orderNumber = `ORD-${year}-${String(nextId).padStart(3, '0')}`;
          }
        }
      }
    }
  );

  return Order;
};