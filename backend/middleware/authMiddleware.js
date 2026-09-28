// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User, WebSession } = require('../models');   // ✅ ADDED User
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ============================================================================
// WEB SESSION CHECK
// ----------------------------------------------------------------------------
// Only runs when the request is from a web client (x-client-type: web).
// Verifies the session row exists and isn't terminated.
// Fails open on DB errors so a broken WebSession table doesn't lock everyone out.
//
// Returns:
//   null   → OK to proceed
//   object → { status, body } to send and stop
// ============================================================================
async function checkWebSession(req) {
  // Only web clients are subject to this check
  if (req.headers['x-client-type'] !== 'web') return null;

  // Old tokens (minted before this feature) have no jti — skip
  const sessionId = req.user?.jti || req.user?.sessionId;
  if (!sessionId) return null;

  try {
    const session = await WebSession.findOne({
      where: { sessionId, userId: req.user.userId },
    });

    if (!session) {
      return {
        status: 401,
        body: {
          success: false,
          code: 'SESSION_NOT_FOUND',
          error: 'This session no longer exists. Please log in again.',
        },
      };
    }

    if (session.status === 'terminated') {
      return {
        status: 401,
        body: {
          success: false,
          code: 'SESSION_TERMINATED',
          error: 'This session was terminated by an administrator.',
        },
      };
    }

    // Bump lastSeen without blocking the request
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
      .split(',')[0]
      .trim();
    session.update({ lastSeenAt: new Date(), lastIp: ip }).catch(() => {});

    return null; // OK
  } catch (e) {
    // Fail open — don't lock users out if the WebSession table is broken
    console.warn('WebSession check failed (failing open):', e.message);
    return null;
  }
}

// ============================================================================
// AUTH MIDDLEWARE
// Verifies the JWT, enforces user active status, enforces web session status,
// and optionally checks roles.
// ============================================================================
const authMiddleware = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      console.log('=== AUTH MIDDLEWARE DEBUG ===');
      console.log('Auth header present:', !!authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No Bearer token found');
        return res.status(401).json({
          error: 'No token provided. Please log in.',
        });
      }

      const token = authHeader.split(' ')[1];
      console.log('Token found, verifying...');

      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);

      console.log('Token decoded successfully:', {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        fullName: decoded.fullName,
        jti: decoded.jti,
      });

      // Attach user info to request
      req.user = decoded;

      // ✅ ADDED — Verify the user still exists and is active.
      // Without this, deactivating a user doesn't kill their existing JWT.
      const dbUser = await User.findByPk(decoded.userId, {
        attributes: ['userId', 'isActive'],
      });

      if (!dbUser) {
        console.log('User no longer exists:', decoded.userId);
        return res.status(401).json({
          success: false,
          error: 'User no longer exists.',
        });
      }

      if (!dbUser.isActive) {
        console.log('Account deactivated:', decoded.username);
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_DEACTIVATED',
          error: 'Your account has been deactivated. Please contact an administrator.',
        });
      }
      // ✅ END ADDED

      // ✅ Web session enforcement (no-op for mobile)
      const sessionError = await checkWebSession(req);
      if (sessionError) {
        console.log('Web session check failed:', sessionError.body.code);
        return res.status(sessionError.status).json(sessionError.body);
      }

      // Check role if required
      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        console.log(
          `Role check failed: required ${allowedRoles.join(', ')}, got ${decoded.role}`
        );
        return res.status(403).json({
          error: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${decoded.role}`,
        });
      }

      console.log('Auth successful for user:', decoded.username);
      next();
    } catch (error) {
      console.error('Auth error:', error.message);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token. Please log in again.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please log in again.' });
      }

      return res.status(401).json({ error: 'Authentication failed.' });
    }
  };
};

// ============================================================================
// HELPER — generate JWT token
// ============================================================================
const generateToken = (user) => {
  // Make sure we have the correct field names
  const payload = {
    userId: user.user_id || user.userId || user.id,
    username: user.username,
    email: user.email,
    role: user.role || user.role_name,
    roleId: user.role_id || user.roleId,
  };

  console.log('Generating token with payload:', payload);

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h',
  });

  return token;
};

module.exports = {
  authMiddleware,
  generateToken,
};