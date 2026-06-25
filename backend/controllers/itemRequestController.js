// controllers/itemRequestController.js
'use strict';

const db = require('../models');
const { ItemRequest, ItemRequestDetail, Store, Item, UOM, User } = db;
const { Op } = require('sequelize');

// ================================================================
// GET ALL REQUESTS (with pagination and filters)
// ================================================================
exports.getRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      storeId = 'all',
      userId = 'all',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Apply store filter
    if (storeId !== 'all') {
      where[Op.or] = [
        { askingStoreId: storeId },
        { supplyingStoreId: storeId }
      ];
    }

    // Apply user filter
    if (userId !== 'all') {
      where.requestedById = userId;
    }

    // Apply search filter
    if (search) {
      where[Op.or] = [
        { requestCode: { [Op.like]: `%${search}%` } },
        { remark: { [Op.like]: `%${search}%` } }
      ];
    }

    // IMPORTANT: Get count separately without includes to avoid join duplication
    const count = await ItemRequest.count({
      where,
      // Add any additional conditions here
    });

    // Get the actual data with includes
    const rows = await ItemRequest.findAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ]
    });

    console.log('Count:', count);
    console.log('Rows returned:', rows.length);

    res.json({
      success: true,
      data: {
        requests: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests'
    });
  }
};

// ================================================================
// GET SINGLE REQUEST BY ID
// ================================================================
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ItemRequest.findByPk(id, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request'
    });
  }
};

// ================================================================
// GET REQUESTS BY USER
// ================================================================
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get by user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests for user'
    });
  }
};

// ================================================================
// GET MY REQUESTS (current authenticated user)
// ================================================================
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const requests = await ItemRequest.findAll({
      where: { requestedById: userId },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your requests'
    });
  }
};

// ================================================================
// GET REQUESTS BY STATUS
// ================================================================
exports.getByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const validStatuses = ['pending', 'approved', 'rejected', 'finalized'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, finalized'
      });
    }

    const requests = await ItemRequest.findAll({
      where: { status },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get by status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests by status'
    });
  }
};

// ================================================================
// GET REQUESTS BY DATE RANGE
// ================================================================
exports.getByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const requests = await ItemRequest.findAll({
      where: {
        requestedDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ],
      order: [['requestedDate', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get by date range error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch requests by date range'
    });
  }
};

// ================================================================
// CREATE REQUEST
// ================================================================
exports.createRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedDate,
      status = 'pending',
      remark
    } = req.body;

    // Validate required fields
    if (!askingStoreId || !supplyingStoreId) {
      return res.status(400).json({
        success: false,
        error: 'Asking store and supplying store are required'
      });
    }

    // Validate that asking and supplying stores are not the same
    if (askingStoreId === supplyingStoreId) {
      return res.status(400).json({
        success: false,
        error: 'Asking store and supplying store cannot be the same'
      });
    }

    // Validate stores exist
    const askingStore = await Store.findByPk(askingStoreId);
    const supplyingStore = await Store.findByPk(supplyingStoreId);

    if (!askingStore || !supplyingStore) {
      return res.status(404).json({
        success: false,
        error: 'One or both stores not found'
      });
    }

    // Validate user exists (if provided)
    if (requestedById) {
      const user = await User.findByPk(requestedById);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.itemId || !item.quantity) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have itemId and quantity'
        });
      }

      const itemExists = await Item.findByPk(item.itemId);
      if (!itemExists) {
        return res.status(404).json({
          success: false,
          error: `Item with ID ${item.itemId} not found`
        });
      }
    }

    // Generate request code
    const requestCode = await ItemRequest.generateRequestCode();

    // Create the main request
    const request = await ItemRequest.create({
      requestCode,
      askingStoreId,
      supplyingStoreId,
      requestedById: requestedById || null,
      requestedDate,
      status: status || 'pending',
      remark: remark || null
    }, { transaction: t });

    // Create the item details
    await Promise.all(
      items.map(async (item) => {
        return ItemRequestDetail.create({
          requestId: request.requestId,
          itemId: item.itemId,
          quantity: item.quantity,
          remark: item.remark || null
        }, { transaction: t });
      })
    );

    await t.commit();

    // Fetch the complete request with details
    const completeRequest = await ItemRequest.findByPk(request.requestId, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      data: completeRequest
    });
  } catch (error) {
    await t.rollback();
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create request'
    });
  }
};

// ================================================================
// UPDATE REQUEST
// ================================================================
exports.updateRequest = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      askingStoreId,
      supplyingStoreId,
      items,
      requestedById,
      requestedDate,
      remark
    } = req.body;

    // Find the request
    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Check if request is finalized - cannot edit finalized requests
    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit finalized requests'
      });
    }

    // Validate stores if provided
    if (askingStoreId && supplyingStoreId) {
      if (askingStoreId === supplyingStoreId) {
        return res.status(400).json({
          success: false,
          error: 'Asking store and supplying store cannot be the same'
        });
      }

      const askingStore = await Store.findByPk(askingStoreId);
      const supplyingStore = await Store.findByPk(supplyingStoreId);

      if (!askingStore || !supplyingStore) {
        return res.status(404).json({
          success: false,
          error: 'One or both stores not found'
        });
      }
    }

    // Validate user exists if provided
    if (requestedById) {
      const user = await User.findByPk(requestedById);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
    }

    // Update the request - status always resets to pending on edit
    await request.update({
      askingStoreId: askingStoreId || request.askingStoreId,
      supplyingStoreId: supplyingStoreId || request.supplyingStoreId,
      requestedById: requestedById !== undefined ? requestedById : request.requestedById,
      requestedDate: requestedDate || request.requestedDate,
      status: 'pending', // Always reset to pending on edit
      remark: remark !== undefined ? remark : request.remark
    }, { transaction: t });

    // Update items if provided
    if (items && items.length > 0) {
      // Validate items
      for (const item of items) {
        if (!item.itemId || !item.quantity) {
          return res.status(400).json({
            success: false,
            error: 'Each item must have itemId and quantity'
          });
        }

        const itemExists = await Item.findByPk(item.itemId);
        if (!itemExists) {
          return res.status(404).json({
            success: false,
            error: `Item with ID ${item.itemId} not found`
          });
        }
      }

      // Delete existing items
      await ItemRequestDetail.destroy({
        where: { requestId: id },
        transaction: t
      });

      // Create new items
      await Promise.all(
        items.map(async (item) => {
          return ItemRequestDetail.create({
            requestId: request.requestId,
            itemId: item.itemId,
            quantity: item.quantity,
            remark: item.remark || null
          }, { transaction: t });
        })
      );
    }

    await t.commit();

    // Fetch the updated request
    const updatedRequest = await ItemRequest.findByPk(id, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Request updated successfully. Status reset to Pending',
      data: updatedRequest
    });
  } catch (error) {
    await t.rollback();
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update request'
    });
  }
};

// ================================================================
// UPDATE REQUEST STATUS
// ================================================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'finalized'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, finalized'
      });
    }

    // Find the request
    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Validate status transitions
    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change status of finalized requests'
      });
    }

    if (request.status === 'approved' && status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject an approved request. Edit the request to modify'
      });
    }

    if (request.status === 'rejected' && status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Cannot approve a rejected request. Edit the request to reset status to pending'
      });
    }

    // Update status
    await request.update({
      status: status
    });

    // Fetch the updated request
    const updatedRequest = await ItemRequest.findByPk(id, {
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email', 'roleId', 'departmentId']
        }
      ]
    });

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update status'
    });
  }
};

// ================================================================
// DELETE REQUEST
// ================================================================
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ItemRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Only allow deletion of pending or rejected requests
    if (request.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete approved requests. Edit the request to reset status to pending first'
      });
    }

    if (request.status === 'finalized') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete finalized requests'
      });
    }

    // Delete the request (cascade will delete details)
    await request.destroy();

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete request'
    });
  }
};

// ================================================================
// EXPORT REQUESTS
// ================================================================
exports.exportRequests = async (req, res) => {
  try {
    const { status, storeId, userId } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    if (storeId && storeId !== 'all') {
      where[Op.or] = [
        { askingStoreId: storeId },
        { supplyingStoreId: storeId }
      ];
    }

    if (userId && userId !== 'all') {
      where.requestedById = userId;
    }

    const requests = await ItemRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ItemRequestDetail,
          as: 'items',
          include: [
            {
              model: Item,
              as: 'item',
              include: [
                { model: UOM, as: 'uom' }
              ]
            }
          ]
        },
        {
          model: Store,
          as: 'askingStore'
        },
        {
          model: Store,
          as: 'supplyingStore'
        },
        {
          model: User,
          as: 'requestedByUser',
          attributes: ['userId', 'username', 'fullName', 'email']
        }
      ]
    });

    // Format data for export
    const exportData = requests.map(req => ({
      'Request Code': req.requestCode,
      'Asking Store': req.askingStore?.name || 'N/A',
      'Supplying Store': req.supplyingStore?.name || 'N/A',
      'Requested By': req.requestedByUser?.fullName || req.requestedByUser?.username || 'N/A',
      'Requested By Email': req.requestedByUser?.email || 'N/A',
      'Requested Date': req.requestedDate,
      'Status': req.status,
      'Items': req.items.map(item => 
        `${item.item?.name || 'Unknown'} (${item.quantity} ${item.item?.uom?.code || 'Units'})`
      ).join('; '),
      'Remark': req.remark || ''
    }));

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export requests'
    });
  }
};

// ================================================================
// GET REQUEST STATISTICS
// ================================================================
exports.getStats = async (req, res) => {
  try {
    const stats = await ItemRequest.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });

    const total = await ItemRequest.count();

    // Get additional stats
    const pendingCount = await ItemRequest.count({ where: { status: 'pending' } });
    const approvedCount = await ItemRequest.count({ where: { status: 'approved' } });
    const rejectedCount = await ItemRequest.count({ where: { status: 'rejected' } });
    const finalizedCount = await ItemRequest.count({ where: { status: 'finalized' } });

    res.json({
      success: true,
      data: {
        total,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        finalized: finalizedCount,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
};

// ================================================================
// GET ACTIVE STORES
// ================================================================
exports.getActiveStores = async (req, res) => {
  try {
    const stores = await Store.findAll({
      where: { status: 'Active' },
      attributes: ['storeId', 'code', 'name', 'location', 'status'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Get active stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active stores'
    });
  }
};

// ================================================================
// GET ACTIVE ITEMS (for dropdown)
// ================================================================
exports.getActiveItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      where: { status: 'Active' },
      attributes: ['itemId', 'code', 'name', 'standardName', 'brand', 'model', 'uomId', 'specText'],
      include: [
        {
          model: UOM,
          as: 'uom',
          attributes: ['uomId', 'code', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get active items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active items'
    });
  }
};