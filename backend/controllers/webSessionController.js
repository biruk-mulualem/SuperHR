// controllers/webSessionController.js
'use strict';

const { WebSession, User, Role } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

class WebSessionController {

  // ================================================================
  // HELPERS
  // ================================================================
  static isAdmin(user) {
    if (!user) return false;
    const role = String(user.role || '').toLowerCase();
    return ['admin', 'superadmin'].includes(role);
  }

  static parseUserAgent(ua = '') {
    const s = String(ua);
    let browser = 'Unknown';
    let version = '';
    if (/Edg\/([\d.]+)/.test(s))            { browser = 'Edge';    version = s.match(/Edg\/([\d.]+)/)[1]; }
    else if (/OPR\/([\d.]+)/.test(s))       { browser = 'Opera';   version = s.match(/OPR\/([\d.]+)/)[1]; }
    else if (/Chrome\/([\d.]+)/.test(s) && !/Edg|OPR/.test(s))
                                            { browser = 'Chrome';  version = s.match(/Chrome\/([\d.]+)/)[1]; }
    else if (/Firefox\/([\d.]+)/.test(s))   { browser = 'Firefox'; version = s.match(/Firefox\/([\d.]+)/)[1]; }
    else if (/Version\/([\d.]+).*Safari/.test(s))
                                            { browser = 'Safari';  version = s.match(/Version\/([\d.]+)/)[1]; }

    let os = 'Unknown';
    if (/Windows NT 10/.test(s))         os = 'Windows 10/11';
    else if (/Windows NT/.test(s))       os = 'Windows';
    else if (/Mac OS X/.test(s))         os = 'macOS';
    else if (/Android/.test(s))          os = 'Android';
    else if (/iPhone|iPad|iPod/.test(s)) os = 'iOS';
    else if (/Linux/.test(s))            os = 'Linux';

    return {
      browser: version ? `${browser} ${version.split('.')[0]}` : browser,
      os,
    };
  }

  static getIp(req) {
    return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
      .split(',')[0].trim();
  }

  static formatSession(s) {
    const d = s.toJSON ? s.toJSON() : s;
    return {
      id: d.id,
      sessionId: d.sessionId,
      deviceId: d.deviceId,
      browser: d.browser,
      os: d.os,
      deviceName: d.deviceName,
      ip: d.ip,
      lastIp: d.lastIp,
      status: d.status,
      loggedInAt: d.loggedInAt,
      lastSeenAt: d.lastSeenAt,
      expiresAt: d.expiresAt,
      terminatedAt: d.terminatedAt,
      terminatedBy: d.terminatedBy,
      terminatedReason: d.terminatedReason,
      user: d.user
        ? {
            userId: d.user.userId,
            username: d.user.username,
            fullName: d.user.fullName,
            email: d.user.email,
            role: d.user.Role?.name || null,
          }
        : null,
      terminator: d.terminator
        ? {
            userId: d.terminator.userId,
            username: d.terminator.username,
            fullName: d.terminator.fullName,
          }
        : null,
    };
  }

  // ================================================================
  // CLIENT — HEARTBEAT (called by web on boot / every few minutes)
  // POST /api/web/sessions/heartbeat
  // ================================================================
  static async heartbeat(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { sessionId, deviceId } = req.body || {};

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'sessionId is required',
        });
      }

      const ua = req.headers['user-agent'] || '';
      const ip = WebSessionController.getIp(req);

      let session = await WebSession.findOne({
        where: { sessionId, userId },
      });

      if (session) {
        if (session.status === 'terminated') {
          return res.status(401).json({
            success: false,
            code: 'SESSION_TERMINATED',
            message: 'This session was terminated by an administrator.',
          });
        }

        await session.update({ lastSeenAt: new Date(), lastIp: ip });
      } else {
        // First time we see this session — register it
        const uaParsed = WebSessionController.parseUserAgent(ua);

        session = await WebSession.create({
          userId,
          sessionId,
          deviceId: deviceId || null,
          browser: uaParsed.browser,
          os: uaParsed.os,
          deviceName: `${uaParsed.browser} on ${uaParsed.os}`,
          userAgent: ua,
          ip,
          lastIp: ip,
          status: 'active',
          loggedInAt: new Date(),
          lastSeenAt: new Date(),
          expiresAt: req.user?.exp ? new Date(req.user.exp * 1000) : null,
        });
      }

      return res.status(200).json({
        success: true,
        data: WebSessionController.formatSession(session),
      });
    } catch (error) {
      console.error('Error in heartbeat:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to record session heartbeat',
        error: error.message,
      });
    }
  }

  // ================================================================
  // CLIENT — LIST MY OWN SESSIONS
  // GET /api/web/sessions
  // ================================================================
  static async listMySessions(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;

      const sessions = await WebSession.findAll({
        where: { userId },
        order: [['lastSeenAt', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        data: sessions.map(WebSessionController.formatSession),
        current: req.user?.jti || req.user?.sessionId || null,
      });
    } catch (error) {
      console.error('Error listing my sessions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list sessions',
        error: error.message,
      });
    }
  }

  // ================================================================
  // CLIENT — SIGN OUT MY OWN SESSION
  // POST /api/web/sessions/:id/revoke
  // ================================================================
  static async revokeMySession(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      const { id } = req.params;

      const session = await WebSession.findOne({ where: { id, userId } });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      await session.update({
        status: 'terminated',
        terminatedAt: new Date(),
        terminatedBy: userId,
        terminatedReason: 'User signed out this session',
      });

      return res.status(200).json({
        success: true,
        message: 'Signed out',
      });
    } catch (error) {
      console.error('Error revoking my session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to sign out session',
        error: error.message,
      });
    }
  }

  // ================================================================
  // ADMIN — LIST ALL WEB SESSIONS
  // GET /api/admin/web-sessions?status=&userId=&search=&page=&limit=
  // ================================================================
  static async listAll(req, res) {
    try {
      if (!WebSessionController.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
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
      if (status && status !== 'all') where.status = status;
      if (userId) where.userId = parseInt(userId, 10);

      const userWhere = {};
      if (search.trim()) {
        userWhere[Op.or] = [
          { username: { [Op.iLike]: `%${search.trim()}%` } },
          { fullName: { [Op.iLike]: `%${search.trim()}%` } },
          { email:    { [Op.iLike]: `%${search.trim()}%` } },
        ];
      }

      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const queryLimit = Math.min(parseInt(limit, 10) || 25, 100);

      const { count, rows } = await WebSession.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userId', 'username', 'fullName', 'email'],
            required: search.trim() ? true : false,
            where: search.trim() ? userWhere : undefined,
            include: [{ model: Role, attributes: ['name'] }],
          },
        ],
        order: [['lastSeenAt', 'DESC']],
        limit: queryLimit,
        offset,
        distinct: true,
      });

      return res.status(200).json({
        success: true,
        data: rows.map(WebSessionController.formatSession),
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: queryLimit,
          totalPages: Math.ceil(count / queryLimit),
        },
      });
    } catch (error) {
      console.error('Error listing web sessions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list web sessions',
        error: error.message,
      });
    }
  }

  // ================================================================
  // ADMIN — GET ONE
  // GET /api/admin/web-sessions/:id
  // ================================================================
  static async getById(req, res) {
    try {
      if (!WebSessionController.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const session = await WebSession.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['userId', 'username', 'fullName', 'email'],
            include: [{ model: Role, attributes: ['name'] }],
          },
          {
            model: User,
            as: 'terminator',
            attributes: ['userId', 'username', 'fullName'],
            required: false,
          },
        ],
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: WebSessionController.formatSession(session),
      });
    } catch (error) {
      console.error('Error getting web session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get session',
        error: error.message,
      });
    }
  }

  // ================================================================
  // ADMIN — TERMINATE (kill the session)
  // POST /api/admin/web-sessions/:id/terminate
  // Body: { reason? }
  // ================================================================
  static async terminate(req, res) {
    try {
      if (!WebSessionController.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const adminId = req.user?.userId || req.user?.id;
      const { reason } = req.body || {};

      const session = await WebSession.findByPk(req.params.id);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      if (session.status === 'terminated') {
        return res.status(400).json({
          success: false,
          message: 'Session is already terminated',
        });
      }

      await session.update({
        status: 'terminated',
        terminatedAt: new Date(),
        terminatedBy: adminId,
        terminatedReason: reason || 'Terminated by admin',
      });

      const fresh = await WebSession.findByPk(session.id);
      return res.status(200).json({
        success: true,
        message: 'Session terminated successfully',
        data: WebSessionController.formatSession(fresh),
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to terminate session',
        error: error.message,
      });
    }
  }

  // ================================================================
  // ADMIN — ALLOW AGAIN (un-terminate)
  // POST /api/admin/web-sessions/:id/allow
  // ================================================================
  static async allow(req, res) {
    try {
      if (!WebSessionController.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const session = await WebSession.findByPk(req.params.id);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      if (session.status !== 'terminated') {
        return res.status(400).json({
          success: false,
          message: 'Only terminated sessions can be allowed again',
        });
      }

      await session.update({
        status: 'active',
        terminatedAt: null,
        terminatedBy: null,
        terminatedReason: null,
      });

      const fresh = await WebSession.findByPk(session.id);
      return res.status(200).json({
        success: true,
        message: 'Session allowed again',
        data: WebSessionController.formatSession(fresh),
      });
    } catch (error) {
      console.error('Error allowing session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to allow session',
        error: error.message,
      });
    }
  }

  // ================================================================
  // ADMIN — TERMINATE ALL FOR USER
  // POST /api/admin/users/:userId/terminate-all-sessions
  // ================================================================
  static async terminateAllForUser(req, res) {
    try {
      if (!WebSessionController.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const adminId = req.user?.userId || req.user?.id;
      const { userId } = req.params;
      const { reason } = req.body || {};

      const sessions = await WebSession.findAll({
        where: { userId, status: 'active' },
      });

      for (const s of sessions) {
        await s.update({
          status: 'terminated',
          terminatedAt: new Date(),
          terminatedBy: adminId,
          terminatedReason: reason || 'All sessions terminated by admin',
        });
      }

      return res.status(200).json({
        success: true,
        message: `Terminated ${sessions.length} session(s)`,
        data: { count: sessions.length },
      });
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to terminate sessions',
        error: error.message,
      });
    }
  }

  // ================================================================
  // ADMIN — DELETE (remove the row entirely)
  // DELETE /api/admin/web-sessions/:id
  // ================================================================
  static async delete(req, res) {
    try {
      if (!WebSessionController.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const session = await WebSession.findByPk(req.params.id);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
        });
      }

      await session.destroy();

      return res.status(200).json({
        success: true,
        message: 'Session deleted',
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete session',
        error: error.message,
      });
    }
  }

  // ================================================================
  // ADMIN — STATS
  // GET /api/admin/web-sessions/stats
  // ================================================================
  static async getStats(req, res) {
    try {
      if (!WebSessionController.isAdmin(req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.',
        });
      }

      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [total, active, activeNow, activeToday, terminated] = await Promise.all([
        WebSession.count(),
        WebSession.count({ where: { status: 'active' } }),
        WebSession.count({ where: { status: 'active', lastSeenAt: { [Op.gte]: fiveMinAgo } } }),
        WebSession.count({ where: { status: 'active', lastSeenAt: { [Op.gte]: dayAgo } } }),
        WebSession.count({ where: { status: 'terminated' } }),
      ]);

      return res.status(200).json({
        success: true,
        data: { total, active, activeNow, activeToday, terminated },
      });
    } catch (error) {
      console.error('Error getting web session stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get stats',
        error: error.message,
      });
    }
  }
}

module.exports = WebSessionController;