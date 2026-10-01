// src/stores/socketService.js
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/config';

// ================================================================
// SOCKET URL — same host as the API, without the /api suffix
// ================================================================
const SOCKET_URL = String(API_BASE || '').replace(/\/api\/?$/, '');

// ================================================================
// STATE
// ================================================================
let socket = null;
let currentGroupId = null;
let currentPostId = null;

// ================================================================
// CONNECT / DISCONNECT
// ================================================================
export async function connectSocket() {
  if (socket?.connected) return socket;

  let token = null;
  try {
    token = await AsyncStorage.getItem('token');
  } catch (e) {
    console.warn('[socket] token read failed:', e?.message);
  }

  if (!token) {
    console.warn('[socket] no token — skipping connect');
    return null;
  }

  console.log('[socket] connecting to', SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    forceNew: false,
  });

  socket.on('connect', () => {
    console.log('[socket] ✅ connected:', socket.id);
    if (currentGroupId) socket.emit('group:join', currentGroupId);
    if (currentPostId) socket.emit('post:join', currentPostId);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] ❌ disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err?.message, '|', err?.description || '');
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch (e) {
    console.warn('[socket] disconnect failed:', e?.message);
  }
  socket = null;
  currentGroupId = null;
  currentPostId = null;
}

export function getSocket() {
  return socket;
}

// ================================================================
// ROOMS — group
// ================================================================
export function joinGroupRoom(groupId) {
  if (!groupId) return;
  currentGroupId = groupId;
  if (socket?.connected) {
    socket.emit('group:join', groupId);
    console.log('[socket] join group:', groupId);
  }
}

export function leaveGroupRoom(groupId) {
  if (!groupId) return;
  if (socket?.connected) {
    socket.emit('group:leave', groupId);
    console.log('[socket] leave group:', groupId);
  }
  if (Number(currentGroupId) === Number(groupId)) currentGroupId = null;
}

// ================================================================
// ROOMS — post
// ================================================================
export function joinPostRoom(postId) {
  if (!postId) return;
  currentPostId = postId;
  if (socket?.connected) {
    socket.emit('post:join', postId);
    console.log('[socket] join post:', postId);
  }
}

export function leavePostRoom(postId) {
  if (!postId) return;
  if (socket?.connected) {
    socket.emit('post:leave', postId);
    console.log('[socket] leave post:', postId);
  }
  if (Number(currentPostId) === Number(postId)) currentPostId = null;
}

// ================================================================
// EVENT LISTENERS — each returns an unsubscribe function
// ================================================================
const noop = () => {};

function safeListener(event, handler) {
  if (!socket) {
    console.warn(`[socket] cannot listen for ${event} — socket is null`);
    return noop;
  }
  socket.on(event, handler);
  return () => {
    try {
      socket?.off(event, handler);
    } catch {}
  };
}

export function onPostNew(handler) {
  return safeListener('post:new', handler);
}

export function onPostUpdated(handler) {
  return safeListener('post:updated', handler);
}

export function onPostDeleted(handler) {
  return safeListener('post:deleted', handler);
}

export function onCommentNew(handler) {
  return safeListener('comment:new', handler);
}

export function onCommentUpdated(handler) {
  return safeListener('comment:updated', handler);
}

export function onCommentDeleted(handler) {
  return safeListener('comment:deleted', handler);
}

export function onPostImageUpdated(handler) {
  return safeListener('post:image-updated', handler);
}

// ✅ NEW — group-wide pin changed (payload: { groupId, pinnedPostId | null })
export function onGroupPinned(handler) {
  return safeListener('group:pinned', handler);
}