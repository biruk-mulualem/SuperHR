// controllers/orderController.js
'use strict';
const { Order, OrderItem, FinishedGood, User, Store, OrderNotification, sequelize } = require('../models');
const { Op } = require('sequelize');

class OrderController {
    // ================================================================
    // GET ALL ORDERS
    // ================================================================
 
static async getAll(req, res) {
    try {
        const {
            search,
            status,
            priority,
            productType,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;

        // ✅ Get the logged-in user
        const user = req.user;
        const userId = user?.userId || user?.id;

        // ✅ Filter: Only show orders created by the logged-in user
        // Unless the user is admin, then show all
        if (user?.role !== 'admin' && user?.role !== 'Admin') {
            where.createdById = userId;
        }

        const productInclude = {
            model: FinishedGood,
            as: 'product',
            attributes: ['id', 'fgCode', 'name', 'type']
        };

        if (productType) {
            productInclude.where = { type: productType };
        }

        if (search) {
            productInclude.where = {
                ...productInclude.where,
                [Op.or]: [
                    { fgCode: { [Op.iLike]: `%${search}%` } },
                    { name: { [Op.iLike]: `%${search}%` } }
                ]
            };
            where[Op.or] = [
                { orderNumber: { [Op.iLike]: `%${search}%` } },
                { packaging: { [Op.iLike]: `%${search}%` } },
                { salesPersonName: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const include = [
            productInclude,
            {
                model: User,
                as: 'salesPerson',
                attributes: ['userId', 'username', 'fullName']
            },
            {
                model: OrderItem,
                as: 'items'
            }
        ];

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const order = [[sortBy, sortOrder.toUpperCase()]];

        const { count, rows } = await Order.findAndCountAll({
            where,
            include,
            order,
            offset,
            limit: parseInt(limit),
            distinct: true
        });

        const formattedData = rows.map(order => {
            const fullOrder = order.toJSON();
            return {
                id: fullOrder.id,
                orderNumber: fullOrder.orderNumber,
                productId: fullOrder.productId,
                productName: fullOrder.product?.name || null,
                productType: fullOrder.product?.type || null,
                fgCode: fullOrder.product?.fgCode || null,
                quantity: parseFloat(fullOrder.quantity),
                uom: fullOrder.uom,
                packaging: fullOrder.packaging,
                salesPersonId: fullOrder.salesPersonId || null,
                salesPersonName: fullOrder.salesPersonName || '',
                salesPersonPhone: fullOrder.salesPersonPhone || '',
                priority: fullOrder.priority,
                status: fullOrder.status,
                createdDate: fullOrder.createdDate,
                dueDate: fullOrder.dueDate,
                sentAt: fullOrder.sentAt,
                createdBy: fullOrder.createdBy || null,
                createdById: fullOrder.createdById || null,
                sentBy: fullOrder.sentBy || null,
                sentById: fullOrder.sentById || null,
                acceptedAt: fullOrder.acceptedAt,
                acceptedBy: fullOrder.acceptedBy,
                rejectedAt: fullOrder.rejectedAt,
                rejectedBy: fullOrder.rejectedBy,
                rejectionReason: fullOrder.rejectionReason,
                completedAt: fullOrder.completedAt,
                completedBy: fullOrder.completedBy,
                cancelledAt: fullOrder.cancelledAt,
                cancelledBy: fullOrder.cancelledBy,
                restoredFromCancelled: fullOrder.restoredFromCancelled,
                restoredAt: fullOrder.restoredAt,
                storeId: fullOrder.storeId || null,
                storeName: fullOrder.storeName || null,
                notes: fullOrder.notes,
                items: fullOrder.items?.map(item => ({
                    id: item.id,
                    orderId: item.orderId,
                    itemName: item.itemName,
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    uom: item.uom,
                    packaging: item.packaging
                })) || [],
                createdAt: fullOrder.createdAt,
                updatedAt: fullOrder.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: error.message
        });
    }
}

    // ================================================================
    // GET ORDER BY ID
    // ================================================================
  // controllers/orderController.js - Updated getById

static async getById(req, res) {
    try {
        const { id } = req.params;
        const user = req.user;
        const userId = user?.userId || user?.id;

        const order = await Order.findByPk(id, {
            include: [
                {
                    model: FinishedGood,
                    as: 'product',
                    attributes: ['id', 'fgCode', 'name', 'type']
                },
                {
                    model: User,
                    as: 'salesPerson',
                    attributes: ['userId', 'username', 'fullName']
                },
                {
                    model: OrderItem,
                    as: 'items'
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // ✅ Check if user owns this order (unless admin)
        if (user?.role !== 'admin' && user?.role !== 'Admin') {
            if (order.createdById !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this order'
                });
            }
        }

        const fullOrder = order.toJSON();
        const formattedData = {
            id: fullOrder.id,
            orderNumber: fullOrder.orderNumber,
            productId: fullOrder.productId,
            productName: fullOrder.product?.name || null,
            productType: fullOrder.product?.type || null,
            fgCode: fullOrder.product?.fgCode || null,
            quantity: parseFloat(fullOrder.quantity),
            uom: fullOrder.uom,
            packaging: fullOrder.packaging,
            salesPersonId: fullOrder.salesPersonId || null,
            salesPersonName: fullOrder.salesPersonName || '',
            salesPersonPhone: fullOrder.salesPersonPhone || '',
            priority: fullOrder.priority,
            status: fullOrder.status,
            createdDate: fullOrder.createdDate,
            dueDate: fullOrder.dueDate,
            sentAt: fullOrder.sentAt,
            createdBy: fullOrder.createdBy || null,
            createdById: fullOrder.createdById || null,
            sentBy: fullOrder.sentBy || null,
            sentById: fullOrder.sentById || null,
            acceptedAt: fullOrder.acceptedAt,
            acceptedBy: fullOrder.acceptedBy,
            rejectedAt: fullOrder.rejectedAt,
            rejectedBy: fullOrder.rejectedBy,
            rejectionReason: fullOrder.rejectionReason,
            completedAt: fullOrder.completedAt,
            completedBy: fullOrder.completedBy,
            cancelledAt: fullOrder.cancelledAt,
            cancelledBy: fullOrder.cancelledBy,
            restoredFromCancelled: fullOrder.restoredFromCancelled,
            restoredAt: fullOrder.restoredAt,
            storeId: fullOrder.storeId || null,
            storeName: fullOrder.storeName || null,
            notes: fullOrder.notes,
            items: fullOrder.items?.map(item => ({
                id: item.id,
                orderId: item.orderId,
                itemName: item.itemName,
                description: item.description,
                quantity: parseFloat(item.quantity),
                uom: item.uom,
                packaging: item.packaging
            })) || [],
            createdAt: fullOrder.createdAt,
            updatedAt: fullOrder.updatedAt
        };

        res.status(200).json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: error.message
        });
    }
}

    // ================================================================
    // CREATE ORDER
    // ================================================================
 
static async create(req, res) {
    const transaction = await sequelize.transaction();

    try {
        const {
            productId,
            quantity,
            uom,
            packaging,
            priority = 'medium',
            dueDate,
            notes,
            salesPersonName,
            salesPersonPhone,
            items
        } = req.body;

        if (!productId || !quantity || !uom || !packaging || !dueDate) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: productId, quantity, uom, packaging, dueDate'
            });
        }

        const product = await FinishedGood.findByPk(productId);
        if (!product) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // ✅ Get the logged-in user who is creating the order
        const user = req.user;
        const createdBy = user?.fullName || user?.username || 'Unknown User';
        const createdById = user?.userId || user?.id || null;

        const year = new Date().getFullYear();
        const lastOrder = await Order.findOne({
            order: [['id', 'DESC']],
            attributes: ['id']
        });
        const nextId = (lastOrder?.id || 0) + 1;
        const orderNumber = `ORD-${year}-${String(nextId).padStart(3, '0')}`;

        const order = await Order.create({
            orderNumber,
            productId,
            quantity,
            uom,
            packaging,
            salesPersonId: null,
            salesPersonName: salesPersonName || '',
            salesPersonPhone: salesPersonPhone || '',
            priority,
            dueDate,
            notes,
            status: 'draft',
            createdDate: new Date().toISOString().split('T')[0],
            // ✅ Save who created the order
            createdBy: createdBy,
            createdById: createdById
        }, { transaction });

        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                orderId: order.id,
                itemName: item.itemName || product.name,
                description: item.description,
                quantity: item.quantity || quantity,
                uom: item.uom || uom,
                packaging: item.packaging || packaging
            }));

            await OrderItem.bulkCreate(orderItems, { transaction });
        }

        await transaction.commit();

        const created = await Order.findByPk(order.id, {
            include: [
                { model: FinishedGood, as: 'product' },
                { model: OrderItem, as: 'items' }
            ]
        });

        const fullOrder = created.toJSON();
        const formattedData = {
            id: fullOrder.id,
            orderNumber: fullOrder.orderNumber,
            productId: fullOrder.productId,
            productName: fullOrder.product?.name || null,
            productType: fullOrder.product?.type || null,
            fgCode: fullOrder.product?.fgCode || null,
            quantity: parseFloat(fullOrder.quantity),
            uom: fullOrder.uom,
            packaging: fullOrder.packaging,
            salesPersonId: null,
            salesPersonName: fullOrder.salesPersonName || '',
            salesPersonPhone: fullOrder.salesPersonPhone || '',
            priority: fullOrder.priority,
            status: fullOrder.status,
            createdDate: fullOrder.createdDate,
            dueDate: fullOrder.dueDate,
            // ✅ Include createdBy in response
            createdBy: fullOrder.createdBy || null,
            createdById: fullOrder.createdById || null,
            sentAt: fullOrder.sentAt,
            sentBy: fullOrder.sentBy || null,
            sentById: fullOrder.sentById || null,
            acceptedAt: fullOrder.acceptedAt,
            acceptedBy: fullOrder.acceptedBy,
            rejectedAt: fullOrder.rejectedAt,
            rejectedBy: fullOrder.rejectedBy,
            rejectionReason: fullOrder.rejectionReason,
            completedAt: fullOrder.completedAt,
            completedBy: fullOrder.completedBy,
            cancelledAt: fullOrder.cancelledAt,
            cancelledBy: fullOrder.cancelledBy,
            restoredFromCancelled: fullOrder.restoredFromCancelled,
            restoredAt: fullOrder.restoredAt,
            notes: fullOrder.notes,
            items: fullOrder.items?.map(item => ({
                id: item.id,
                orderId: item.orderId,
                itemName: item.itemName,
                description: item.description,
                quantity: parseFloat(item.quantity),
                uom: item.uom,
                packaging: item.packaging
            })) || [],
            createdAt: fullOrder.createdAt,
            updatedAt: fullOrder.updatedAt
        };

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: formattedData
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
}

    // ================================================================
    // UPDATE ORDER
    // ================================================================
    static async update(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const {
                productId,
                quantity,
                uom,
                packaging,
                priority,
                dueDate,
                notes,
                salesPersonName,
                salesPersonPhone,
                items
            } = req.body;

            const order = await Order.findByPk(id, {
                include: [{ model: OrderItem, as: 'items' }],
                transaction
            });

            if (!order) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const editableStatuses = ['draft', 'rejected', 'cancelled'];
            if (!editableStatuses.includes(order.status)) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Order cannot be edited. Only Draft, Rejected, or Cancelled orders can be edited.'
                });
            }

            let statusMessage = '';

            if (order.status === 'rejected' || order.status === 'cancelled') {
                const oldStatus = order.status;
                order.status = 'draft';
                statusMessage = ` restored to Draft from ${oldStatus}`;

                if (oldStatus === 'rejected') {
                    order.rejectionReason = null;
                    order.rejectedAt = null;
                    order.rejectedBy = null;
                }

                if (oldStatus === 'cancelled') {
                    order.cancelledAt = null;
                    order.cancelledBy = null;
                    order.restoredFromCancelled = true;
                    order.restoredAt = new Date();
                }
            }

            if (productId) {
                const product = await FinishedGood.findByPk(productId, { transaction });
                if (!product) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Product not found'
                    });
                }
                order.productId = productId;
            }

            if (quantity) order.quantity = quantity;
            if (uom) order.uom = uom;
            if (packaging) order.packaging = packaging;
            if (priority) order.priority = priority;
            if (dueDate) order.dueDate = dueDate;
            if (notes !== undefined) order.notes = notes;

            if (salesPersonName !== undefined) order.salesPersonName = salesPersonName || '';
            if (salesPersonPhone !== undefined) order.salesPersonPhone = salesPersonPhone || '';

            await order.save({ transaction });

            if (items && items.length > 0) {
                await OrderItem.destroy({
                    where: { orderId: id },
                    transaction
                });

                const orderItems = items.map(item => ({
                    orderId: order.id,
                    itemName: item.itemName,
                    description: item.description,
                    quantity: item.quantity || quantity || order.quantity,
                    uom: item.uom || uom || order.uom,
                    packaging: item.packaging || packaging || order.packaging
                }));

                await OrderItem.bulkCreate(orderItems, { transaction });
            }

            await transaction.commit();

            const updated = await Order.findByPk(id, {
                include: [
                    { model: FinishedGood, as: 'product' },
                    { model: OrderItem, as: 'items' }
                ]
            });

            const fullOrder = updated.toJSON();
            const formattedData = {
                id: fullOrder.id,
                orderNumber: fullOrder.orderNumber,
                productId: fullOrder.productId,
                productName: fullOrder.product?.name || null,
                productType: fullOrder.product?.type || null,
                fgCode: fullOrder.product?.fgCode || null,
                quantity: parseFloat(fullOrder.quantity),
                uom: fullOrder.uom,
                packaging: fullOrder.packaging,
                salesPersonId: null,
                salesPersonName: fullOrder.salesPersonName || '',
                salesPersonPhone: fullOrder.salesPersonPhone || '',
                priority: fullOrder.priority,
                status: fullOrder.status,
                createdDate: fullOrder.createdDate,
                dueDate: fullOrder.dueDate,
                sentAt: fullOrder.sentAt,
                acceptedAt: fullOrder.acceptedAt,
                acceptedBy: fullOrder.acceptedBy,
                rejectedAt: fullOrder.rejectedAt,
                rejectedBy: fullOrder.rejectedBy,
                rejectionReason: fullOrder.rejectionReason,
                completedAt: fullOrder.completedAt,
                completedBy: fullOrder.completedBy,
                cancelledAt: fullOrder.cancelledAt,
                cancelledBy: fullOrder.cancelledBy,
                restoredFromCancelled: fullOrder.restoredFromCancelled,
                restoredAt: fullOrder.restoredAt,
                notes: fullOrder.notes,
                items: fullOrder.items?.map(item => ({
                    id: item.id,
                    orderId: item.orderId,
                    itemName: item.itemName,
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    uom: item.uom,
                    packaging: item.packaging
                })) || [],
                createdAt: fullOrder.createdAt,
                updatedAt: fullOrder.updatedAt
            };

            res.status(200).json({
                success: true,
                message: `Order updated${statusMessage}`,
                data: formattedData
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error updating order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order',
                error: error.message
            });
        }
    }

    // ================================================================
    // DELETE ORDER (Only Draft)
    // ================================================================
    static async delete(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;

            const order = await Order.findByPk(id, { transaction });

            if (!order) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status !== 'draft') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Only Draft orders can be deleted'
                });
            }

            await OrderItem.destroy({
                where: { orderId: id },
                transaction
            });

            await order.destroy({ transaction });

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Order deleted successfully'
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error deleting order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete order',
                error: error.message
            });
        }
    }

    // ================================================================
    // SEND ORDER (Draft → Sent) WITH NOTIFICATION
    // ================================================================

// controllers/orderController.js - Updated sendOrder method

static async sendOrder(req, res) {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { storeId } = req.body;

        if (!storeId) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Please select a store to send the order'
            });
        }

        const order = await Order.findByPk(id, {
            include: [
                {
                    model: FinishedGood,
                    as: 'product',
                    attributes: ['id', 'fgCode', 'name', 'type']
                },
                {
                    model: OrderItem,
                    as: 'items'
                }
            ],
            transaction
        });

        if (!order) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'draft') {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'Only Draft orders can be sent to production'
            });
        }

        const store = await Store.findByPk(storeId, {
            attributes: ['id', 'name', 'code'],
            transaction
        });

        if (!store) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Store not found'
            });
        }

        // Capture the logged-in user
        const user = req.user;
        const sentBy = user?.fullName || user?.username || 'Unknown User';
        const sentById = user?.userId || user?.id || null;

        order.status = 'sent';
        order.sentAt = new Date();
        order.sentBy = sentBy;
        order.sentById = sentById;
        order.storeId = storeId;
        order.storeName = store.name;
        await order.save({ transaction });

        // ✅ Include orderNumber in the notification
        const notification = await OrderNotification.create({
            orderId: order.id,
            orderNumber: order.orderNumber,  // ✅ ADD THIS - Store the order number
            storeId: storeId,
            productName: order.product?.name || '',
            productType: order.product?.type || '',
            fgCode: order.product?.fgCode || '',
            quantity: order.quantity,
            uom: order.uom,
            packaging: order.packaging,
            salesPersonName: order.salesPersonName || '',
            salesPersonPhone: order.salesPersonPhone || '',
            priority: order.priority || 'medium',
            status: 'pending',
            dueDate: order.dueDate,
            sentAt: new Date(),
            sentBy: sentBy,
            sentById: sentById,
            notes: order.notes,
            items: order.items?.map(item => ({
                itemName: item.itemName,
                quantity: item.quantity,
                uom: item.uom,
                packaging: item.packaging
            })) || []
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `Order sent to ${store.name} successfully`,
            data: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                sentAt: order.sentAt,
                sentBy: order.sentBy,
                sentById: order.sentById,
                storeId: storeId,
                storeName: store.name,
                notificationId: notification.id
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error sending order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send order',
            error: error.message
        });
    }
}

    // ================================================================
    // CANCEL ORDER (Draft or Sent → Cancelled)
    // ================================================================
    static async cancelOrder(req, res) {
        try {
            const { id } = req.params;

            const order = await Order.findByPk(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (!['draft', 'sent'].includes(order.status)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only Draft or Sent orders can be cancelled'
                });
            }

            const oldStatus = order.status;
            order.status = 'cancelled';
            order.cancelledAt = new Date();
            order.cancelledBy = req.user?.fullName || req.user?.username || 'System';
            await order.save();

            res.status(200).json({
                success: true,
                message: `Order cancelled from ${oldStatus}`,
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    cancelledAt: order.cancelledAt,
                    cancelledBy: order.cancelledBy
                }
            });

        } catch (error) {
            console.error('Error cancelling order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order',
                error: error.message
            });
        }
    }

    // ================================================================
    // RESTORE ORDER (Cancelled → Draft)
    // ================================================================
    static async restoreOrder(req, res) {
        try {
            const { id } = req.params;

            const order = await Order.findByPk(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status !== 'cancelled') {
                return res.status(403).json({
                    success: false,
                    message: 'Only Cancelled orders can be restored'
                });
            }

            order.status = 'draft';
            order.restoredFromCancelled = true;
            order.restoredAt = new Date();
            order.cancelledAt = null;
            order.cancelledBy = null;
            await order.save();

            res.status(200).json({
                success: true,
                message: 'Order restored to Draft successfully',
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    restoredAt: order.restoredAt
                }
            });

        } catch (error) {
            console.error('Error restoring order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to restore order',
                error: error.message
            });
        }
    }

    // ================================================================
    // PRODUCTION ACTIONS (Admin Only)
    // ================================================================

    static async acceptOrder(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const order = await Order.findByPk(id, { transaction });

            if (!order) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status !== 'sent') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Only Sent orders can be accepted'
                });
            }

            order.status = 'accepted';
            order.acceptedAt = new Date();
            order.acceptedBy = userId;
            await order.save({ transaction });

            await OrderNotification.update(
                {
                    status: 'accepted',
                    respondedAt: new Date(),
                    respondedBy: userId
                },
                {
                    where: { orderId: order.id },
                    transaction
                }
            );

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Order accepted by Production',
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    acceptedAt: order.acceptedAt,
                    acceptedBy: order.acceptedBy
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error accepting order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to accept order',
                error: error.message
            });
        }
    }

    static async rejectOrder(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.userId;

            if (!reason) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            const order = await Order.findByPk(id, { transaction });

            if (!order) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status !== 'sent') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Only Sent orders can be rejected'
                });
            }

            order.status = 'rejected';
            order.rejectedAt = new Date();
            order.rejectedBy = userId;
            order.rejectionReason = reason;
            await order.save({ transaction });

            await OrderNotification.update(
                {
                    status: 'rejected',
                    respondedAt: new Date(),
                    respondedBy: userId,
                    rejectionReason: reason
                },
                {
                    where: { orderId: order.id },
                    transaction
                }
            );

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Order rejected by Production',
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    rejectedAt: order.rejectedAt,
                    rejectedBy: order.rejectedBy,
                    rejectionReason: order.rejectionReason
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error rejecting order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject order',
                error: error.message
            });
        }
    }

    static async completeOrder(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const order = await Order.findByPk(id, { transaction });

            if (!order) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status !== 'accepted') {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Only Accepted orders can be completed'
                });
            }

            order.status = 'completed';
            order.completedAt = new Date();
            order.completedBy = userId;
            await order.save({ transaction });

            await OrderNotification.update(
                {
                    status: 'completed',
                    respondedAt: new Date(),
                    respondedBy: userId
                },
                {
                    where: { orderId: order.id },
                    transaction
                }
            );

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Order completed by Production',
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    completedAt: order.completedAt,
                    completedBy: order.completedBy
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error completing order:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete order',
                error: error.message
            });
        }
    }

    // ================================================================
    // GET STATISTICS
    // ================================================================
    static async getStats(req, res) {
        try {
            const stats = {
                total: await Order.count(),
                draft: await Order.count({ where: { status: 'draft' } }),
                sent: await Order.count({ where: { status: 'sent' } }),
                accepted: await Order.count({ where: { status: 'accepted' } }),
                rejected: await Order.count({ where: { status: 'rejected' } }),
                completed: await Order.count({ where: { status: 'completed' } }),
                cancelled: await Order.count({ where: { status: 'cancelled' } })
            };

            res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get statistics',
                error: error.message
            });
        }
    }

    // ================================================================
    // ORDER NOTIFICATION METHODS
    // ================================================================


static async getNotificationsByStore(req, res) {
    try {
        const { storeId } = req.params;
        const {
            status,
            priority,
            page = 1,
            limit = 10,
            sortBy = 'sentAt',
            sortOrder = 'DESC'
        } = req.query;

        const user = req.user;
        if (user?.role !== 'admin' && user?.role !== 'Admin') {
            const userStoreId = user?.storeId || user?.assignedStoreId;
            if (userStoreId && userStoreId !== parseInt(storeId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this store'
                });
            }
        }

        const where = { storeId };
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const order = [[sortBy, sortOrder.toUpperCase()]];

        const { count, rows } = await OrderNotification.findAndCountAll({
            where,
            include: [
                { 
                    model: Store, 
                    as: 'store',
                    attributes: ['id', 'name', 'code']
                },
                { 
                    model: Order, 
                    as: 'order',
                    // ✅ Include orderNumber from Order table
                    attributes: ['id', 'orderNumber', 'sentBy', 'sentById', 'salesPersonName', 'salesPersonPhone']
                },
                { 
                    model: User, 
                    as: 'respondedByUser', 
                    attributes: ['userId', 'username', 'fullName'] 
                }
            ],
            order,
            offset,
            limit: parseInt(limit)
        });

        const formattedData = rows.map(notification => {
            // Get the raw data
            const fullData = notification.toJSON();
            
            // ✅ Get orderNumber from the included order
            const orderData = fullData.order || {};
            
            return {
                id: fullData.id,
                orderId: fullData.orderId,
                // ✅ Use orderNumber from the order association
                orderNumber: orderData.orderNumber || null,
                storeId: fullData.storeId,
                storeName: fullData.store?.name || null,
                productName: fullData.productName,
                productType: fullData.productType,
                fgCode: fullData.fgCode,
                quantity: parseFloat(fullData.quantity),
                uom: fullData.uom,
                packaging: fullData.packaging,
                salesPersonName: fullData.salesPersonName || orderData.salesPersonName || '',
                salesPersonPhone: fullData.salesPersonPhone || orderData.salesPersonPhone || '',
                priority: fullData.priority,
                status: fullData.status,
                dueDate: fullData.dueDate,
                sentAt: fullData.sentAt,
                sentBy: fullData.sentBy || orderData.sentBy || null,
                sentById: fullData.sentById || orderData.sentById || null,
                respondedAt: fullData.respondedAt,
                respondedBy: fullData.respondedByUser?.fullName || null,
                rejectionReason: fullData.rejectionReason,
                notes: fullData.notes,
                items: fullData.items || [],
                createdAt: fullData.createdAt,
                updatedAt: fullData.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting order notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order notifications',
            error: error.message
        });
    }
}


static async getMyNotifications(req, res) {
    try {
        const {
            status,
            priority,
            page = 1,
            limit = 10
        } = req.query;

        const user = req.user;

        if (user?.role === 'admin' || user?.role === 'Admin') {
            const where = {};
            if (status) where.status = status;
            if (priority) where.priority = priority;

            const offset = (parseInt(page) - 1) * parseInt(limit);
            const { count, rows } = await OrderNotification.findAndCountAll({
                where,
                include: [
                    { 
                        model: Store, 
                        as: 'store',
                        attributes: ['id', 'name', 'code']
                    },
                    { 
                        model: Order, 
                        as: 'order',
                        attributes: ['id', 'orderNumber', 'sentBy', 'sentById', 'salesPersonName', 'salesPersonPhone']
                    },
                    { 
                        model: User, 
                        as: 'respondedByUser', 
                        attributes: ['userId', 'username', 'fullName'] 
                    }
                ],
                order: [['sentAt', 'DESC']],
                offset,
                limit: parseInt(limit)
            });

            const formattedData = rows.map(notification => {
                const fullData = notification.toJSON();
                const orderData = fullData.order || {};
                
                return {
                    id: fullData.id,
                    orderId: fullData.orderId,
                    orderNumber: orderData.orderNumber || null,
                    storeId: fullData.storeId,
                    storeName: fullData.store?.name || null,
                    productName: fullData.productName,
                    productType: fullData.productType,
                    fgCode: fullData.fgCode,
                    quantity: parseFloat(fullData.quantity),
                    uom: fullData.uom,
                    packaging: fullData.packaging,
                    salesPersonName: fullData.salesPersonName || orderData.salesPersonName || '',
                    salesPersonPhone: fullData.salesPersonPhone || orderData.salesPersonPhone || '',
                    priority: fullData.priority,
                    status: fullData.status,
                    dueDate: fullData.dueDate,
                    sentAt: fullData.sentAt,
                    sentBy: fullData.sentBy || orderData.sentBy || null,
                    sentById: fullData.sentById || orderData.sentById || null,
                    respondedAt: fullData.respondedAt,
                    respondedBy: fullData.respondedByUser?.fullName || null,
                    rejectionReason: fullData.rejectionReason,
                    notes: fullData.notes,
                    items: fullData.items || [],
                    createdAt: fullData.createdAt,
                    updatedAt: fullData.updatedAt
                };
            });

            return res.status(200).json({
                success: true,
                data: formattedData,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            });
        }

        const storeId = user?.storeId || user?.assignedStoreId;
        if (!storeId) {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
            });
        }

        const where = { storeId };
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await OrderNotification.findAndCountAll({
            where,
            include: [
                { 
                    model: Store, 
                    as: 'store',
                    attributes: ['id', 'name', 'code']
                },
                { 
                    model: Order, 
                    as: 'order',
                    attributes: ['id', 'orderNumber', 'sentBy', 'sentById', 'salesPersonName', 'salesPersonPhone']
                },
                { 
                    model: User, 
                    as: 'respondedByUser', 
                    attributes: ['userId', 'username', 'fullName'] 
                }
            ],
            order: [['sentAt', 'DESC']],
            offset,
            limit: parseInt(limit)
        });

        const formattedData = rows.map(notification => {
            const fullData = notification.toJSON();
            const orderData = fullData.order || {};
            
            return {
                id: fullData.id,
                orderId: fullData.orderId,
                orderNumber: orderData.orderNumber || null,
                storeId: fullData.storeId,
                storeName: fullData.store?.name || null,
                productName: fullData.productName,
                productType: fullData.productType,
                fgCode: fullData.fgCode,
                quantity: parseFloat(fullData.quantity),
                uom: fullData.uom,
                packaging: fullData.packaging,
                salesPersonName: fullData.salesPersonName || orderData.salesPersonName || '',
                salesPersonPhone: fullData.salesPersonPhone || orderData.salesPersonPhone || '',
                priority: fullData.priority,
                status: fullData.status,
                dueDate: fullData.dueDate,
                sentAt: fullData.sentAt,
                sentBy: fullData.sentBy || orderData.sentBy || null,
                sentById: fullData.sentById || orderData.sentById || null,
                respondedAt: fullData.respondedAt,
                respondedBy: fullData.respondedByUser?.fullName || null,
                rejectionReason: fullData.rejectionReason,
                notes: fullData.notes,
                items: fullData.items || [],
                createdAt: fullData.createdAt,
                updatedAt: fullData.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting my order notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order notifications',
            error: error.message
        });
    }
}

    /**
     * Get notification count for badge
     */
    static async getNotificationCount(req, res) {
        try {
            const user = req.user;

            if (user?.role === 'admin' || user?.role === 'Admin') {
                const count = await OrderNotification.count({
                    where: { status: 'pending' }
                });
                return res.status(200).json({
                    success: true,
                    data: { pending: count }
                });
            }

            const storeId = user?.storeId || user?.assignedStoreId;
            if (!storeId) {
                return res.status(200).json({
                    success: true,
                    data: { pending: 0 }
                });
            }

            const count = await OrderNotification.count({
                where: { storeId, status: 'pending' }
            });

            res.status(200).json({
                success: true,
                data: { pending: count }
            });

        } catch (error) {
            console.error('Error getting notification count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get count',
                error: error.message
            });
        }
    }

    /**
     * Accept order notification
     */
    static async acceptNotification(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const notification = await OrderNotification.findByPk(id, {
                include: [{ model: Order, as: 'order' }],
                transaction
            });

            if (!notification) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            if (notification.status !== 'pending') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Only pending notifications can be accepted'
                });
            }

            notification.status = 'accepted';
            notification.respondedAt = new Date();
            notification.respondedBy = userId;
            await notification.save({ transaction });

            if (notification.order) {
                notification.order.status = 'accepted';
                notification.order.acceptedAt = new Date();
                notification.order.acceptedBy = userId;
                await notification.order.save({ transaction });
            }

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Order accepted successfully',
                data: notification.getFullData ? notification.getFullData() : notification.toJSON()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error accepting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to accept notification',
                error: error.message
            });
        }
    }

    /**
     * Reject order notification
     */
    static async rejectNotification(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.userId;

            if (!reason) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required'
                });
            }

            const notification = await OrderNotification.findByPk(id, {
                include: [{ model: Order, as: 'order' }],
                transaction
            });

            if (!notification) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            if (notification.status !== 'pending') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Only pending notifications can be rejected'
                });
            }

            notification.status = 'rejected';
            notification.respondedAt = new Date();
            notification.respondedBy = userId;
            notification.rejectionReason = reason;
            await notification.save({ transaction });

            if (notification.order) {
                notification.order.status = 'rejected';
                notification.order.rejectedAt = new Date();
                notification.order.rejectedBy = userId;
                notification.order.rejectionReason = reason;
                await notification.order.save({ transaction });
            }

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Order rejected',
                data: notification.getFullData ? notification.getFullData() : notification.toJSON()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error rejecting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject notification',
                error: error.message
            });
        }
    }

    /**
     * Complete order notification
     */
    static async completeNotification(req, res) {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const notification = await OrderNotification.findByPk(id, {
                include: [{ model: Order, as: 'order' }],
                transaction
            });

            if (!notification) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            if (notification.status !== 'accepted') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Only accepted notifications can be completed'
                });
            }

            notification.status = 'completed';
            notification.respondedAt = new Date();
            notification.respondedBy = userId;
            await notification.save({ transaction });

            if (notification.order) {
                notification.order.status = 'completed';
                notification.order.completedAt = new Date();
                notification.order.completedBy = userId;
                await notification.order.save({ transaction });
            }

            await transaction.commit();

            res.status(200).json({
                success: true,
                message: 'Order completed',
                data: notification.getFullData ? notification.getFullData() : notification.toJSON()
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error completing notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete notification',
                error: error.message
            });
        }
    }
}

module.exports = OrderController;