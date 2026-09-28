// services/deviceService.js
const { Device, User } = require('../models');

class DeviceService {
  /**
   * Checks a device against the DB and returns the login state.
   * Returns: { status: 'ok' | 'new_device' | 'pending' | 'blocked', reason?: string }
   */
  async checkOrRegister(userId, device) {
    if (!device || !device.deviceId || !device.fingerprint) {
      throw new Error('Missing device information');
    }

    const existing = await Device.findOne({
      where: { userId, deviceId: device.deviceId },
    });

    if (!existing) {
      await Device.create({
        userId,
        deviceId: device.deviceId,
        fingerprint: device.fingerprint,
        platform: device.platform,
        brand: device.brand,
        model: device.model,
        osVersion: device.osVersion,
        deviceName: device.deviceName,
        isEmulator: !!device.isEmulator,
        appVersion: device.appVersion,
        status: 'pending',
        requestedAt: new Date(),
      });

      // TODO: notify admins here
      return { status: 'new_device' };
    }

    if (existing.status === 'blocked') {
      return { status: 'blocked', reason: existing.blockedReason };
    }
    if (existing.status === 'pending') {
      return { status: 'pending' };
    }

    await existing.update({ lastSeenAt: new Date() });
    return { status: 'ok' };
  }

  async isApproved(userId, deviceId) {
    if (!deviceId) return true; // web tokens have no deviceId
    const row = await Device.findOne({ where: { userId, deviceId } });
    return !!row && row.status === 'approved';
  }

  async listPending() {
    return Device.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'user', attributes: ['userId', 'username', 'fullName', 'email'] },
      ],
      order: [['requestedAt', 'DESC']],
    });
  }

  async listForUser(userId) {
    return Device.findAll({
      where: { userId },
      order: [['requestedAt', 'DESC']],
    });
  }

  async approve(deviceId, adminUserId) {
    const row = await Device.findByPk(deviceId);
    if (!row) return { success: false, error: 'Device not found' };
    await row.update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminUserId,
      blockedAt: null,
      blockedBy: null,
      blockedReason: null,
    });
    return { success: true, device: row };
  }

  async block(deviceId, adminUserId, reason) {
    const row = await Device.findByPk(deviceId);
    if (!row) return { success: false, error: 'Device not found' };
    await row.update({
      status: 'blocked',
      blockedAt: new Date(),
      blockedBy: adminUserId,
      blockedReason: reason || null,
    });
    return { success: true, device: row };
  }

  async unblock(deviceId, adminUserId) {
    const row = await Device.findByPk(deviceId);
    if (!row) return { success: false, error: 'Device not found' };
    await row.update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminUserId,
      blockedAt: null,
      blockedBy: null,
      blockedReason: null,
    });
    return { success: true, device: row };
  }

  async remove(deviceId) {
    const row = await Device.findByPk(deviceId);
    if (!row) return { success: false, error: 'Device not found' };
    await row.destroy();
    return { success: true };
  }
}

module.exports = new DeviceService();