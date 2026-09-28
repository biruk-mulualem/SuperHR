// backend/socket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

// Simple map: userId -> Set of socketIds (a user can have multiple devices)
const userSockets = new Map();

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',                     // tighten in production if you want
      methods: ['GET', 'POST'],
    },
    // Prefer websocket, fall back to polling if the network blocks it
   transports: ['polling', 'websocket'],
  });

  // ── Auth middleware — runs once per connection ──
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        return next(new Error('AUTH_MISSING'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // Match whatever your JWT payload contains
      const userId =
        payload.userId || payload.id || payload.user_id || payload.sub;
      const role = payload.role || payload.userRole || null;

      if (!userId) return next(new Error('AUTH_NO_USER'));

      socket.userId = String(userId);
      socket.userRole = role;
      next();
    } catch (err) {
      console.warn('[socket] auth failed:', err.message);
      next(new Error('AUTH_INVALID'));
    }
  });

  // ── Connection lifecycle ──
  io.on('connection', (socket) => {
    const { userId } = socket;

    // Track this socket
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    console.log(`[socket] ✅ user ${userId} connected (${socket.id})`);

    // Auto-join a personal room so you can target a single user later
    socket.join(`user:${userId}`);

    // ── Room: join a group to receive its live posts/comments ──
    socket.on('group:join', (groupId) => {
      if (!groupId) return;
      const room = `group:${groupId}`;
      socket.join(room);
      console.log(`[socket] user ${userId} joined ${room}`);
    });

    socket.on('group:leave', (groupId) => {
      if (!groupId) return;
      const room = `group:${groupId}`;
      socket.leave(room);
      console.log(`[socket] user ${userId} left ${room}`);
    });

    // ── Room: join a single post thread (for live comments) ──
    socket.on('post:join', (postId) => {
      if (!postId) return;
      const room = `post:${postId}`;
      socket.join(room);
      console.log(`[socket] user ${userId} joined ${room}`);
    });

    socket.on('post:leave', (postId) => {
      if (!postId) return;
      socket.leave(`post:${postId}`);
    });

    socket.on('disconnect', (reason) => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }
      console.log(`[socket] ❌ user ${userId} disconnected (${reason})`);
    });
  });

  return io;
}

// ── Helpers — use these from your routes ──
function emitToGroup(groupId, event, payload) {
  if (!io || !groupId) return;
  io.to(`group:${groupId}`).emit(event, payload);
}

function emitToPost(postId, event, payload) {
  if (!io || !postId) return;
  io.to(`post:${postId}`).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function getIO() {
  return io;
}

module.exports = {
  initSocket,
  emitToGroup,
  emitToPost,
  emitToUser,
  getIO,
};