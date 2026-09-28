// controllers/deviceController.js
const { Device, User, Role } = require('../models');
const { Op } = require('sequelize');
const deviceService = require('../services/deviceService');

// ============================================================================
// HELPERS
// ============================================================================

const isAdminUser = (user) => {
  if (!user) return false;
  const role = String(user.role || user.Role?.name || '').toLowerCase();
  return ['admin', 'superadmin'].includes(role);
};

/**
 * Attach a resolved user object to each device row.
 * Sequelize already gives us `device.user` when we include the association.
 * This normalizer flattens the response so the frontend gets a clean shape.
 */
const serializeDevice = (device) => {
  const d = device.toJSON ? device.toJSON() : device;

  return {
    id: d.id,
    userId: d.userId,
    deviceId: d.deviceId,
    fingerprint: d.fingerprint,
    platform: d.platform,
    brand: d.brand,
    model: d.model,
    osVersion: d.osVersion,
    deviceName: d.deviceName,
    isEmulator: d.isEmulator,
    appVersion: d.appVersion,
    status: d.status,
    requestedAt: d.requestedAt,
    approvedAt: d.approvedAt,
    approvedBy: d.approvedBy,
    blockedAt: d.blockedAt,
    blockedBy: d.blockedBy,
    blockedReason: d.blockedReason,
    lastSeenAt: d.lastSeenAt,

    // Resolved relations
    user: d.user
      ? {
          userId: d.user.userId,
          username: d.user.username,
          fullName: d.user.fullName,
          email: d.user.email,
          role: d.user.Role?.name || null,
        }
      : null,

    approver: d.approver
      ? {
          userId: d.approver.userId,
          username: d.approver.username,
          fullName: d.approver.fullName,
        }
      : null,

    blocker: d.blocker
      ? {
          userId: d.blocker.userId,
          username: d.blocker.username,
          fullName: d.blocker.fullName,
        }
      : null,
  };
};

// ============================================================================
// LIST DEVICES
// GET /api/admin/devices
// Query:
//   status    — pending | approved | blocked (optional)
//   userId    — filter by owner (optional)
//   search    — search username, device name, model (optional)
//   page      — default 1
//   limit     — default 25 (max 100)
// ============================================================================
exports.listDevices = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin only.',
      });
    }

    const {
      status,
      userId,
      search = '',
      page = 1,
      limit = 25,
    } = req.query;

    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (userId) {
      where.userId = parseInt(userId, 10);
    }

    const userWhere = {};
    if (search && search.trim()) {
      userWhere[Op.or] = [
        { username: { [Op.iLike]: `%${search.trim()}%` } },
        { fullName: { [Op.iLike]: `%${search.trim()}%` } },
        { email: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const queryLimit = Math.min(parseInt(limit, 10) || 25, 100);

    const { count, rows } = await Device.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'fullName', 'email'],
          required: search ? true : false,
          where: search ? userWhere : undefined,
          include: [{ model: Role, attributes: ['name'] }],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['userId', 'username', 'fullName'],
          required: false,
        },
        {
          model: User,
          as: 'blocker',
          attributes: ['userId', 'username', 'fullName'],
          required: false,
        },
      ],
      order: [['requestedAt', 'DESC']],
      limit: queryLimit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      data: rows.map(serializeDevice),
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: queryLimit,
        totalPages: Math.ceil(count / queryLimit),
      },
    });
  } catch (error) {
    console.error('❌ listDevices error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

// ============================================================================
// GET ONE DEVICE
// GET /api/admin/devices/:id
// ============================================================================
exports.getDevice = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, error: 'Admin only.' });
    }

    const device = await Device.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'fullName', 'email'],
          include: [{ model: Role, attributes: ['name'] }],
        },
        { model: User, as: 'approver', attributes: ['userId', 'username', 'fullName'], required: false },
        { model: User, as: 'blocker', attributes: ['userId', 'username', 'fullName'], required: false },
      ],
    });

    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    return res.status(200).json({ success: true, data: serializeDevice(device) });
  } catch (error) {
    console.error('❌ getDevice error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// ============================================================================
// LIST DEVICES FOR A SPECIFIC USER
// GET /api/admin/users/:userId/devices
// ============================================================================
exports.listUserDevices = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, error: 'Admin only.' });
    }

    const { userId } = req.params;

    const devices = await Device.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'fullName', 'email'],
          include: [{ model: Role, attributes: ['name'] }],
        },
      ],
      order: [['requestedAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: devices.map(serializeDevice),
    });
  } catch (error) {
    console.error('❌ listUserDevices error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// ============================================================================
// APPROVE DEVICE
// POST /api/admin/devices/:id/approve
// ============================================================================
exports.approveDevice = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, error: 'Admin only.' });
    }

    const result = await deviceService.approve(req.params.id, req.user.userId);

    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Device approved',
      data: serializeDevice(result.device),
    });
  } catch (error) {
    console.error('❌ approveDevice error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// ============================================================================
// BLOCK DEVICE
// POST /api/admin/devices/:id/block
// Body: { reason?: string }
// ============================================================================
exports.blockDevice = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, error: 'Admin only.' });
    }

    const { reason } = req.body || {};
    const result = await deviceService.block(req.params.id, req.user.userId, reason);

    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Device blocked',
      data: serializeDevice(result.device),
    });
  } catch (error) {
    console.error('❌ blockDevice error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// ============================================================================
// UNBLOCK DEVICE
// POST /api/admin/devices/:id/unblock
// ============================================================================
exports.unblockDevice = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, error: 'Admin only.' });
    }

    const result = await deviceService.unblock(req.params.id, req.user.userId);

    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Device unblocked',
      data: serializeDevice(result.device),
    });
  } catch (error) {
    console.error('❌ unblockDevice error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// ============================================================================
// DELETE DEVICE (remove entirely — user must re-register)
// DELETE /api/admin/devices/:id
// ============================================================================
exports.deleteDevice = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, error: 'Admin only.' });
    }

    const result = await deviceService.remove(req.params.id);

    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, message: 'Device deleted' });
  } catch (error) {
    console.error('❌ deleteDevice error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// ============================================================================
// STATS — counts per status (for admin dashboard tiles)
// GET /api/admin/devices/stats
// ============================================================================
exports.getDeviceStats = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, error: 'Admin only.' });
    }

    const [pending, approved, blocked, total] = await Promise.all([
      Device.count({ where: { status: 'pending' } }),
      Device.count({ where: { status: 'approved' } }),
      Device.count({ where: { status: 'blocked' } }),
      Device.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, pending, approved, blocked },
    });
  } catch (error) {
    console.error('❌ getDeviceStats error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};