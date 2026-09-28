// super-app/src/pages/posts/GroupDetailPage.js
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  BackHandler,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import {
  GestureHandlerRootView,
  Swipeable,
} from 'react-native-gesture-handler';

import api from '../../stores/interceptor';
import mobilePostsGroupService from '../../stores/mobilePostsGroupService';
import mobilePostsPostService from '../../stores/mobilePostsPostService';

// ✅ Socket.IO — real-time updates
import {
  joinGroupRoom,
  leaveGroupRoom,
  joinPostRoom,
  leavePostRoom,
  onPostNew,
  onPostUpdated,
  onPostDeleted,
  onCommentNew,
  onCommentUpdated,
  onCommentDeleted,
} from '../../stores/socketService';

// Sibling pages
import GroupMembersPage from './GroupMembersPage';
import GroupAboutPage from './GroupAboutPage';

// ================================================================
// STATIC FILE URL HELPER
// ================================================================
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const absoluteUrl = (u) => {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^(file|content|data|blob):/i.test(u)) return u;
  const base = API_BASE.replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
};

// ================================================================
// CONSTANTS
// ================================================================
const POST_FILTERS = [
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'declined', label: 'Declined' },
];

const CARD_IMAGE_HEIGHT = 180;
const SCREEN = Dimensions.get('window');

// ✅ Pagination: load 10 posts per request
const POSTS_PER_PAGE = 10;

const PEN_COLORS = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#111827', '#FFFFFF'];
const PEN_SIZES = [3, 6, 10, 16];

// ================================================================
// Helpers
// ================================================================
const fmtTimeAgo = (ts) => {
  if (!ts) return '—';
  const t = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const fmtPostNumber = (n) => `#${n}`;

const postStatusConfig = (status, darkMode) => {
  switch (status) {
    case 'pending':
      return { label: '⏳ PENDING', bg: darkMode ? '#422006' : '#FEF3C7', color: darkMode ? '#FCD34D' : '#92400E' };
    case 'approved':
      return { label: '✓ APPROVED', bg: darkMode ? '#064E3B' : '#ECFDF5', color: darkMode ? '#6EE7B7' : '#047857' };
    case 'declined':
      return { label: '✕ DECLINED', bg: darkMode ? '#7F1D1D' : '#FEE2E2', color: darkMode ? '#FCA5A5' : '#991B1B' };
    default:
      return { label: '—', bg: darkMode ? '#1E293B' : '#F1F5F9', color: darkMode ? '#94A3B8' : '#64748B' };
  }
};

const normalizePost = (p) => ({
  id: p.id,
  groupId: p.groupId,
  title: p.title,
  body: p.body || '',
  status: p.status,
  reviewNote: p.reviewNote || '',
  reviewedBy: p.reviewedBy || null,
  reviewedBy_name: p.reviewedBy_name || null,
  reviewedAt: p.reviewedAt || null,
  author: p.author || 'Unknown',
  authorId: p.authorId,
  createdAt: p.createdAt,
  unread: !!p.unread,
  images: (p.images || []).map((img) => {
    const raw = typeof img === 'string' ? img : img.url;
    return absoluteUrl(raw);
  }),
  imageRecords: p.images || [],
  commentCount: Number(p.commentCount) || 0,
  ...(Array.isArray(p.comments) ? { comments: p.comments } : {}),
});

const normalizeMember = (m) => ({
  userId: m.userId,
  name: m.name,
  initials: m.initials || (m.name || '?').slice(0, 2).toUpperCase(),
  color: m.color || '#8B5CF6',
  department: m.department || null,
  role: m.role,
  status: m.status,
});

// ================================================================
// IMAGE VIEWER
// ================================================================
function ImageViewer({ visible, uri, onClose }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const currentX = useRef(0);
  const currentY = useRef(0);

  const lastTap = useRef(0);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const lastPanX = useRef(0);
  const lastPanY = useRef(0);

  const reset = () => {
    currentScale.current = 1;
    currentX.current = 0;
    currentY.current = 0;
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  };

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  const distanceBetween = (touches) => {
    const [a, b] = touches;
    const dx = a.pageX - b.pageX;
    const dy = a.pageY - b.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          initialDistance.current = distanceBetween(touches);
          initialScale.current = currentScale.current;
        } else {
          lastPanX.current = currentX.current;
          lastPanY.current = currentY.current;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dist = distanceBetween(touches);
          if (initialDistance.current > 0) {
            const factor = dist / initialDistance.current;
            let next = initialScale.current * factor;
            if (next < 1) next = 1;
            if (next > 5) next = 5;
            currentScale.current = next;
            scale.setValue(next);
          }
          return;
        }
        if (touches.length === 1 && currentScale.current > 1) {
          const nx = lastPanX.current + gestureState.dx;
          const ny = lastPanY.current + gestureState.dy;
          currentX.current = nx;
          currentY.current = ny;
          translateX.setValue(nx);
          translateY.setValue(ny);
        }
      },
      onPanResponderRelease: () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          if (currentScale.current > 1) {
            reset();
          } else {
            currentScale.current = 2.5;
            Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }).start();
          }
        }
        lastTap.current = now;
        if (currentScale.current < 1) reset();
        initialDistance.current = 0;
      },
      onPanResponderTerminate: () => {
        initialDistance.current = 0;
      },
    })
  ).current;

  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity onPress={onClose} hitSlop={14} activeOpacity={0.7} style={styles.viewerCloseBtn}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.viewerHintWrap} pointerEvents="none">
            <Text style={styles.viewerHint}>Pinch to zoom · Double-tap to toggle · Drag to pan</Text>
          </View>
          <View style={styles.viewerStage} {...panResponder.panHandlers}>
            <Animated.Image
              source={{ uri }}
              resizeMode="contain"
              style={[styles.viewerImage, { transform: [{ scale }, { translateX }, { translateY }] }]}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ================================================================
// ANNOTATION SCREEN
// ================================================================
function AnnotationScreen({
  visible,
  uri,
  onClose,
  onSave,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const viewRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [live, setLive] = useState('');
  const [saving, setSaving] = useState(false);
  const [penColor, setPenColor] = useState('#EF4444');
  const [penWidth, setPenWidth] = useState(6);

  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (visible) {
      setStrokes([]);
      setLive('');
      setSaving(false);
    }
  }, [visible, uri]);

  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => setImgSize({ w, h }),
      () => setImgSize({ w: SCREEN.width, h: SCREEN.height * 0.48 })
    );
  }, [uri]);

  const maxW = SCREEN.width - 24;
  const maxH = SCREEN.height * 0.48;

  let frameW = maxW;
  let frameH = maxH;
  if (imgSize.w && imgSize.h) {
    const scaleFactor = Math.min(maxW / imgSize.w, maxH / imgSize.h);
    frameW = imgSize.w * scaleFactor;
    frameH = imgSize.h * scaleFactor;
  }

  const handleStart = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setLive(`M ${locationX} ${locationY}`);
  };
  const handleMove = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setLive((prev) => (prev ? `${prev} L ${locationX} ${locationY}` : `M ${locationX} ${locationY}`));
  };
  const handleEnd = () => {
    setLive((prev) => {
      if (prev && prev.length > 4) {
        setStrokes((all) => [...all, { d: prev, color: penColor, width: penWidth }]);
      }
      return '';
    });
  };
  const undo = () => setStrokes((prev) => prev.slice(0, -1));
  const clearAll = () => { setStrokes([]); setLive(''); };

  const save = async () => {
    if (!viewRef.current) return;
    try {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 200));
      const tmpUri = await captureRef(viewRef, { format: 'jpg', quality: 0.92 });
      onSave?.(tmpUri);
    } catch (e) {
      console.warn('captureRef failed', e);
      Alert.alert('Could not save', 'Annotation could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.annotBackdrop, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <View style={[styles.annotSheet, { backgroundColor: darkMode ? '#0B1220' : '#F8FAFC' }]}>
            <View style={[styles.annotHeader, { borderBottomColor: borderColor }]}>
              <TouchableOpacity onPress={onClose} hitSlop={10} activeOpacity={0.7} style={styles.annotHeaderBtn}>
                <Text style={[styles.annotHeaderBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.annotTitle, { color: textColor }]}>Draw & Sign</Text>
              <TouchableOpacity
                onPress={save}
                disabled={saving || strokes.length === 0}
                hitSlop={10}
                activeOpacity={0.7}
                style={styles.annotHeaderBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#8B5CF6" />
                ) : (
                  <Text style={[
                    styles.annotHeaderBtnText,
                    { color: strokes.length > 0 ? '#8B5CF6' : subTextColor, fontWeight: '900' },
                  ]}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.annotCanvasWrap}>
              {imgSize.w > 0 && (
                <View ref={viewRef} collapsable={false} style={[styles.annotCanvas, { width: frameW, height: frameH }]}>
                  <Image
                    source={{ uri }}
                    style={{ position: 'absolute', width: frameW, height: frameH }}
                    resizeMode="cover"
                    pointerEvents="none"
                  />
                  <Svg
                    width={frameW}
                    height={frameH}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={handleStart}
                    onResponderMove={handleMove}
                    onResponderRelease={handleEnd}
                    onResponderTerminate={handleEnd}
                  >
                    {strokes.map((s, i) => (
                      <Path key={`s-${i}`} d={s.d} stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    ))}
                    {live ? (
                      <Path d={live} stroke={penColor} strokeWidth={penWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    ) : null}
                  </Svg>
                </View>
              )}
            </View>

            <Text style={[styles.annotHint, { color: subTextColor }]}>
              Draw with your finger to sign or mark the image
            </Text>

            <View style={styles.annotPaletteRow}>
              {PEN_COLORS.map((c) => {
                const active = c === penColor;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setPenColor(c)}
                    activeOpacity={0.8}
                    style={[styles.annotColorSwatch, {
                      backgroundColor: c,
                      borderColor: active ? '#8B5CF6' : 'rgba(0,0,0,0.2)',
                      borderWidth: active ? 3 : 1,
                    }]}
                  />
                );
              })}
            </View>

            <View style={[styles.annotToolRow, { borderTopColor: borderColor, backgroundColor: cardBg }]}>
              {PEN_SIZES.map((w) => {
                const active = w === penWidth;
                return (
                  <TouchableOpacity
                    key={w}
                    onPress={() => setPenWidth(w)}
                    activeOpacity={0.85}
                    style={[styles.annotSizeBtn, {
                      backgroundColor: active ? (darkMode ? '#312E81' : '#EEF2FF') : (darkMode ? '#1E293B' : '#F1F5F9'),
                      borderColor: active ? '#8B5CF6' : borderColor,
                    }]}
                  >
                    <View style={{
                      width: Math.max(6, w),
                      height: Math.max(6, w),
                      borderRadius: w / 2,
                      backgroundColor: active ? '#8B5CF6' : textColor,
                    }} />
                  </TouchableOpacity>
                );
              })}

              <View style={{ flex: 1 }} />

              <TouchableOpacity onPress={undo} disabled={strokes.length === 0} activeOpacity={0.85}
                style={[styles.annotActionBtn, {
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                  borderColor, opacity: strokes.length === 0 ? 0.5 : 1,
                }]}
              >
                <Text style={[styles.annotToolText, { color: textColor }]}>↶</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={clearAll} disabled={strokes.length === 0} activeOpacity={0.85}
                style={[styles.annotActionBtn, {
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                  borderColor, opacity: strokes.length === 0 ? 0.5 : 1,
                }]}
              >
                <Text style={[styles.annotToolText, { color: '#EF4444' }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ================================================================
// MAIN
// ================================================================
export default function GroupDetailPage({
  group,
  currentUser,
  onGroupUpdated,
  onGroupRemoved,
  onBack,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  // ----------------------------------------------------------------
  // Auth / permissions
  // ----------------------------------------------------------------
  const currentUserId = currentUser?.userId;
  const isManager =
    !!currentUser &&
    (currentUser.isAdmin === true ||
      ['admin', 'administrator', 'superadmin', 'manager'].includes(
        String(currentUser.role || '').toLowerCase()
      ));

  const groupCreatorId = group?.createdBy;
  const isGroupAdmin =
    !!currentUserId && Number(currentUserId) === Number(groupCreatorId);

  // ----------------------------------------------------------------
  // State
  // ----------------------------------------------------------------
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // ✅ Pagination
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [postsPage, setPostsPage] = useState({ pending: 1, approved: 1, declined: 1 });
  const [postsTotalPages, setPostsTotalPages] = useState({ pending: 1, approved: 1, declined: 1 });
  const [postsTotals, setPostsTotals] = useState({ pending: 0, approved: 0, declined: 0 });

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [postFilter, setPostFilter] = useState('pending');

  const [page, setPage] = useState('posts');

  const [confirmDeletePost, setConfirmDeletePost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(false);

  const [reviewPage, setReviewPage] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [postError, setPostError] = useState(null);
  const [submittingPost, setSubmittingPost] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState(null);

  const [viewerUri, setViewerUri] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const [annotUri, setAnnotUri] = useState(null);
  const [annotVisible, setAnnotVisible] = useState(false);
  const [annotTarget, setAnnotTarget] = useState(null);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const commentInputRef = useRef(null);

  // ✅ Comment edit/delete state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState(null);
  const [deleteCommentSubmitting, setDeleteCommentSubmitting] = useState(false);

  // ✅ Swipe-to-reveal bookkeeping
  const swipeableRefs = useRef(new Map());
  const openSwipeIdRef = useRef(null);
  const editInputRef = useRef(null);

  const closeAllSwipes = useCallback((exceptId = null) => {
    swipeableRefs.current.forEach((ref, id) => {
      if (String(id) !== String(exceptId)) {
        try { ref?.close?.(); } catch (e) { /* noop */ }
      }
    });
    openSwipeIdRef.current = exceptId;
  }, []);

  const myMembership = members.find((m) => Number(m.userId) === Number(currentUserId));
  const canCreatePost = !!myMembership && myMembership.status === 'active';

  // ----------------------------------------------------------------
  // Loaders
  // ----------------------------------------------------------------
  const loadPosts = useCallback(
    async (pageToLoad = 1, statusToLoad = postFilter) => {
      if (!group?.id) return;

      const isFirstPage = pageToLoad === 1;

      if (isFirstPage) setPostsLoading(true);
      else setPostsLoadingMore(true);

      try {
        const res = await mobilePostsPostService.listGroupPosts(group.id, {
          status: statusToLoad,
          page: pageToLoad,
          limit: POSTS_PER_PAGE,
        });

        if (!res.success) {
          Alert.alert('Error', res.error || 'Failed to load posts');
          return;
        }

        const items = (res.data.items || []).map(normalizePost);
        const totalPages = res.data.totalPages || 1;
        const total = res.data.total ?? items.length;

        setPostsTotalPages((prev) => ({ ...prev, [statusToLoad]: totalPages }));
        setPostsPage((prev) => ({ ...prev, [statusToLoad]: pageToLoad }));
        setPostsTotals((prev) => ({ ...prev, [statusToLoad]: total }));

        if (isFirstPage) {
          setPosts((prev) => {
            const others = prev.filter((p) => p.status !== statusToLoad);
            return [...items, ...others];
          });
        } else {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => String(p.id)));
            const fresh = items.filter((p) => !existingIds.has(String(p.id)));
            return [...prev, ...fresh];
          });
        }
      } catch (e) {
        Alert.alert('Error', e?.message || 'Failed to load posts');
      } finally {
        setPostsLoading(false);
        setPostsLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [group?.id, postFilter]
  );

  const loadMembers = useCallback(async () => {
    if (!group?.id) return;
    setMembersLoading(true);
    try {
      const res = await mobilePostsGroupService.listMembers(group.id);
      if (res.success) {
        setMembers((res.data.items || []).map(normalizeMember));
      }
    } catch (e) {
      console.warn('loadMembers:', e);
    } finally {
      setMembersLoading(false);
    }
  }, [group?.id]);

  // Members once per group
  useEffect(() => {
    if (group?.id) loadMembers();
  }, [group?.id, loadMembers]);

  // Posts page 1 whenever group OR filter changes
  useEffect(() => {
    if (!group?.id) return;
    setPosts([]);
    setPostsPage({ pending: 1, approved: 1, declined: 1 });
    setPostsTotalPages({ pending: 1, approved: 1, declined: 1 });
    loadingMoreRef.current = false;
    loadPosts(1, postFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, postFilter]);

  // Infinite-scroll trigger
  const loadMorePosts = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (postsLoading || postsLoadingMore) return;

    const currentPage = postsPage[postFilter] || 1;
    const totalPages = postsTotalPages[postFilter] || 1;
    if (currentPage >= totalPages) return;

    loadingMoreRef.current = true;
    loadPosts(currentPage + 1, postFilter);
  }, [
    postsLoading,
    postsLoadingMore,
    postsPage,
    postsTotalPages,
    postFilter,
    loadPosts,
  ]);

  // ✅ Live socket — join group room + subscribe to events
  useEffect(() => {
    if (!group?.id) return;

    joinGroupRoom(group.id);

    const offNewPost = onPostNew((newPost) => {
      const norm = normalizePost(newPost);
      setPosts((prev) => {
        if (prev.some((p) => String(p.id) === String(norm.id))) return prev;
        return [norm, ...prev];
      });
      setPostsTotals((prev) => ({
        ...prev,
        [norm.status]: (prev[norm.status] || 0) + 1,
      }));
    });

    const offUpdatedPost = onPostUpdated((updatedPost) => {
      const norm = normalizePost(updatedPost);
      setPosts((prev) => {
        const old = prev.find((p) => String(p.id) === String(norm.id));
        const oldStatus = old?.status;

        const updated = prev.map((p) =>
          String(p.id) === String(norm.id) ? { ...p, ...norm } : p
        );

        if (oldStatus && oldStatus !== norm.status) {
          return updated.filter((p) => String(p.id) !== String(norm.id));
        }
        return updated;
      });
    });

    const offDeletedPost = onPostDeleted(({ id }) => {
      setPosts((prev) => {
        const old = prev.find((p) => String(p.id) === String(id));
        const oldStatus = old?.status;
        if (oldStatus) {
          setPostsTotals((prevTotals) => ({
            ...prevTotals,
            [oldStatus]: Math.max(0, (prevTotals[oldStatus] || 0) - 1),
          }));
        }
        return prev.filter((p) => String(p.id) !== String(id));
      });
      setSelectedPostId((curr) => (String(curr) === String(id) ? null : curr));
    });

    const offCommentNew = onCommentNew(({ postId, comment }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(postId)) return p;
          const already = (p.comments || []).some(
            (c) => String(c.id) === String(comment.id)
          );
          if (already) return p;
          return {
            ...p,
            comments: [...(p.comments || []), comment],
            commentCount: (p.commentCount || 0) + 1,
          };
        })
      );
    });

    const offCommentUpdated = onCommentUpdated(({ postId, comment }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(postId)) return p;
          return {
            ...p,
            comments: (p.comments || []).map((c) =>
              String(c.id) === String(comment.id) ? { ...c, ...comment } : c
            ),
          };
        })
      );
    });

    const offCommentDeleted = onCommentDeleted(({ postId, commentId }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(postId)) return p;
          const filtered = (p.comments || []).filter(
            (c) => String(c.id) !== String(commentId)
          );
          return {
            ...p,
            comments: filtered,
            commentCount: Math.max(0, (p.commentCount || 0) - 1),
          };
        })
      );
    });

    return () => {
      leaveGroupRoom(group.id);
      offNewPost();
      offUpdatedPost();
      offDeletedPost();
      offCommentNew();
      offCommentUpdated();
      offCommentDeleted();
    };
  }, [group?.id]);

  // Join post room when a post is opened
  useEffect(() => {
    if (!selectedPostId) return;
    joinPostRoom(selectedPostId);
    return () => {
      leavePostRoom(selectedPostId);
    };
  }, [selectedPostId]);

  // Reset composer + edit state when switching posts
  useEffect(() => {
    setCommentText('');
    setIsComposing(false);
    setEditingCommentId(null);
    setEditCommentText('');
    setConfirmDeleteComment(null);
    swipeableRefs.current.clear();
    openSwipeIdRef.current = null;
  }, [selectedPostId]);

  // ----------------------------------------------------------------
  // Hardware back
  // ----------------------------------------------------------------
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (annotVisible) { closeAnnotation(); return true; }
      if (viewerVisible) { setViewerVisible(false); return true; }
      if (confirmDeleteComment) { setConfirmDeleteComment(null); return true; }
      if (editingCommentId) { cancelEditComment(); return true; }
      if (openSwipeIdRef.current) { closeAllSwipes(null); return true; }
      if (reviewPage) { cancelReviewPage(); return true; }
      if (confirmDeletePost) { setConfirmDeletePost(null); return true; }
      if (selectedPostId) { setSelectedPostId(null); return true; }
      if (showCreatePost) { setShowCreatePost(false); return true; }
      if (page !== 'posts') { setPage('posts'); return true; }
      onBack?.();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotVisible, viewerVisible, confirmDeleteComment, editingCommentId, reviewPage, confirmDeletePost, selectedPostId, showCreatePost, page, onBack]);

  // ----------------------------------------------------------------
  // Derived
  // ----------------------------------------------------------------
  const postCounts = useMemo(() => ({
    pending:  postsTotals.pending  ?? 0,
    approved: postsTotals.approved ?? 0,
    declined: postsTotals.declined ?? 0,
  }), [postsTotals]);

  const visiblePosts = useMemo(() => {
    const raw = search.trim().toLowerCase();
    const numeric = raw.replace(/^#/, '');
    return posts
      .filter((p) => {
        const matchesFilter = p.status === postFilter;
        if (!raw) return matchesFilter;
        const numStr = String(p.id);
        const matchesSearch =
          (p.title || '').toLowerCase().includes(raw) ||
          (p.body || '').toLowerCase().includes(raw) ||
          (p.author || '').toLowerCase().includes(raw) ||
          numStr.includes(numeric) ||
          `#${numStr}`.includes(raw);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, search, postFilter]);

  const selectedPost = useMemo(
    () => posts.find((p) => String(p.id) === String(selectedPostId)) || null,
    [posts, selectedPostId]
  );

  // ----------------------------------------------------------------
  // Image viewer / annotation
  // ----------------------------------------------------------------
  const openImageViewer = (uri) => { setViewerUri(uri); setViewerVisible(true); };
  const closeImageViewer = () => setViewerVisible(false);

  const openAnnotation = (postId, imageIndex, uri) => {
    setAnnotTarget({ postId, imageIndex });
    setAnnotUri(uri);
    setAnnotVisible(true);
  };
  const closeAnnotation = () => {
    setAnnotVisible(false);
    setAnnotUri(null);
    setAnnotTarget(null);
  };

  const applyAnnotation = async (newUri) => {
    if (!annotTarget) return;
    const { postId, imageIndex } = annotTarget;
    try {
      const res = await mobilePostsPostService.annotatePostImage(postId, imageIndex, {
        uri: newUri,
        name: 'annotated.jpg',
        type: 'image/jpeg',
      });
      if (res.success) {
        const fresh = await mobilePostsPostService.getPost(postId);
        if (fresh.success) {
          const norm = normalizePost(fresh.data);
          setPosts((prev) =>
            prev.map((p) => (String(p.id) === String(postId) ? norm : p))
          );
        }
      } else {
        Alert.alert('Error', res.error || 'Could not save annotation');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save annotation');
    } finally {
      closeAnnotation();
    }
  };

  // ----------------------------------------------------------------
  // Post actions
  // ----------------------------------------------------------------
  const pickImages = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.85,
      });
      if (result.canceled) return;
      const uris = result.assets.map((a) => a.uri);
      setNewPostImages((prev) => [...prev, ...uris]);
    } catch (e) {
      console.warn('pickImages:', e);
      Alert.alert('Picker unavailable', 'Could not open the image picker.');
    }
  };

  const removeImageAt = (index) => {
    setNewPostImages((prev) => prev.filter((_, i) => i !== index));
  };

  const cancelCreatePost = () => {
    setShowCreatePost(false);
    setNewPostTitle('');
    setNewPostBody('');
    setNewPostImages([]);
    setPostError(null);
  };

  const submitPost = async () => {
    if (!canCreatePost) {
      Alert.alert('Not allowed', 'You do not have permission to post in this group.');
      return;
    }
    if (!newPostTitle.trim()) {
      setPostError('Title is required');
      return;
    }
    setSubmittingPost(true);
    try {
      const res = await mobilePostsPostService.createPost(group.id, {
        title: newPostTitle.trim(),
        body: newPostBody.trim(),
        images: newPostImages.map((uri) => ({ uri })),
      });
      if (res.success) {
        const norm = normalizePost(res.data);
        setPosts((prev) => {
          if (prev.some((p) => String(p.id) === String(norm.id))) return prev;
          return [norm, ...prev];
        });
        setPostsTotals((prev) => ({
          ...prev,
          [norm.status]: (prev[norm.status] || 0) + 1,
        }));
        setShowCreatePost(false);
        setNewPostTitle('');
        setNewPostBody('');
        setNewPostImages([]);
        setPostError(null);
      } else {
        setPostError(res.error || 'Could not create post');
      }
    } catch (e) {
      setPostError(e?.message || 'Could not create post');
    } finally {
      setSubmittingPost(false);
    }
  };

  const openPost = async (post) => {
    setSelectedPostId(post.id);

    if (post.unread) {
      mobilePostsPostService.markPostRead(post.id).catch(() => {});
      setPosts((prev) =>
        prev.map((p) => (String(p.id) === String(post.id) ? { ...p, unread: false } : p))
      );
    }

    if (!post.comments || post.comments.length === 0) {
      try {
        const res = await mobilePostsPostService.getPost(post.id);
        if (res.success) {
          const norm = normalizePost(res.data);
          setPosts((prev) =>
            prev.map((p) => (String(p.id) === String(norm.id) ? norm : p))
          );
        }
      } catch (e) {
        // ignore
      }
    }
  };

  const requestDeletePost = (post) => setConfirmDeletePost(post);

  const applyDeletePost = async () => {
    const target = confirmDeletePost;
    if (!target) return;
    setDeletingPost(true);
    try {
      const res = await mobilePostsPostService.deletePost(target.id);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => String(p.id) !== String(target.id)));
        setPostsTotals((prev) => ({
          ...prev,
          [target.status]: Math.max(0, (prev[target.status] || 0) - 1),
        }));
        if (String(selectedPostId) === String(target.id)) setSelectedPostId(null);
        setConfirmDeletePost(null);
      } else {
        Alert.alert('Error', res.error || 'Could not delete post');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not delete post');
    } finally {
      setDeletingPost(false);
    }
  };

  const submitComment = async () => {
    if (!selectedPost) return;
    const text = commentText.trim();
    if (!text) return;

    setSubmittingComment(true);
    try {
      const res = await mobilePostsPostService.addComment(selectedPost.id, text);
      if (res.success) {
        const newComment = {
          id: res.data.id,
          author: res.data.author,
          authorId: res.data.authorId,
          body: res.data.body,
          createdAt: res.data.createdAt,
          editedAt: res.data.editedAt || null,
        };
        setPosts((prev) =>
          prev.map((p) => {
            if (String(p.id) !== String(selectedPost.id)) return p;
            const already = (p.comments || []).some(
              (c) => String(c.id) === String(newComment.id)
            );
            if (already) return p;
            return {
              ...p,
              comments: [...(p.comments || []), newComment],
              commentCount: (p.commentCount || 0) + 1,
            };
          })
        );
        setCommentText('');
        setIsComposing(false);
      } else {
        Alert.alert('Error', res.error || 'Could not post comment');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const openComposer = () => {
    setIsComposing(true);
    setTimeout(() => commentInputRef.current?.focus(), 120);
  };

  const closeComposer = () => {
    setIsComposing(false);
  };

  // ✅ Comment permission helper
  const canEditComment = (c) =>
    String(c.authorId) === String(currentUserId);

  const canDeleteComment = (c) =>
    String(c.authorId) === String(currentUserId) ||
    isManager ||
    isGroupAdmin;

  // ✅ Comment edit/delete handlers (swipe-driven)
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // ✅ Bulletproof comment edit: always merge locally, regardless of response shape.
  const submitEditComment = async () => {
    if (!selectedPost || !editingCommentId) return;

    const text = editCommentText.trim();
    if (!text) {
      Alert.alert('Empty', 'Comment cannot be empty.');
      return;
    }

    // Capture ids BEFORE the await so we don't rely on stale closures
    const targetCommentId = editingCommentId;
    const targetPostId = selectedPost.id;

    setEditSubmitting(true);
    try {
      const res = await mobilePostsPostService.editComment(
        targetPostId,
        targetCommentId,
        text
      );

      // Only bail if server explicitly says it failed
      if (res && res.success === false) {
        Alert.alert('Error', res.error || 'Could not edit comment');
        return;
      }

      // Best-effort: try to read the dto out of whatever shape came back
      const dto =
        (res && res.data && typeof res.data === 'object' && res.data) ||
        (res && res.comment && typeof res.comment === 'object' && res.comment) ||
        {};

      const mergedBody = typeof dto.body === 'string' && dto.body.length > 0
        ? dto.body
        : text;

      const mergedEditedAt =
        dto.editedAt || dto.edited_at || new Date().toISOString();

      // Always apply the update locally so the UI reflects it immediately
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(targetPostId)) return p;
          return {
            ...p,
            comments: (p.comments || []).map((c) =>
              String(c.id) === String(targetCommentId)
                ? {
                    ...c,
                    ...dto,
                    id: c.id,                 // never let the server change the local id
                    body: mergedBody,
                    editedAt: mergedEditedAt,
                  }
                : c
            ),
          };
        })
      );

      // Close editor
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not edit comment');
    } finally {
      setEditSubmitting(false);
    }
  };

  const applyDeleteComment = async () => {
    const target = confirmDeleteComment;
    if (!target || !selectedPost) return;
    setDeleteCommentSubmitting(true);
    try {
      const res = await mobilePostsPostService.deleteComment(
        selectedPost.id,
        target.id
      );
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (String(p.id) !== String(selectedPost.id)) return p;
            const filtered = (p.comments || []).filter(
              (c) => String(c.id) !== String(target.id)
            );
            return {
              ...p,
              comments: filtered,
              commentCount: Math.max(0, (p.commentCount || 0) - 1),
            };
          })
        );
        swipeableRefs.current.delete(target.id);
        setConfirmDeleteComment(null);
      } else {
        Alert.alert('Error', res.error || 'Could not delete comment');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not delete comment');
    } finally {
      setDeleteCommentSubmitting(false);
    }
  };

  const openReviewPage = (post, action) => {
    if (!isManager) return;
    setConfirmDeletePost(null);
    setReviewNote('');
    setReviewError(null);
    setReviewPage({ post, action });
  };

  const applyReviewPage = async () => {
    if (!reviewPage) return;
    if (!reviewNote.trim()) {
      setReviewError(
        reviewPage.action === 'approve'
          ? 'Please add a short note before approving.'
          : 'Please explain why this post is declined.'
      );
      return;
    }
    setReviewSubmitting(true);
    const { post, action } = reviewPage;
    try {
      const res = action === 'approve'
        ? await mobilePostsPostService.approvePost(post.id, reviewNote.trim())
        : await mobilePostsPostService.declinePost(post.id, reviewNote.trim());

      if (res.success) {
        const norm = normalizePost(res.data);
        const newStatus = norm.status;

        setPosts((prev) => {
          const filtered = prev.filter(
            (p) => String(p.id) !== String(norm.id) || p.status === newStatus
          );
          return filtered.map((p) =>
            String(p.id) === String(norm.id) ? { ...p, ...norm } : p
          );
        });

        setPostsTotals((prev) => {
          const oldStatus = 'pending';
          if (oldStatus === newStatus) return prev;
          return {
            ...prev,
            [oldStatus]: Math.max(0, (prev[oldStatus] || 0) - 1),
            [newStatus]: (prev[newStatus] || 0) + 1,
          };
        });

        setReviewPage(null);
        setReviewNote('');
        setReviewError(null);
      } else {
        setReviewError(res.error || 'Could not save review');
      }
    } catch (e) {
      setReviewError(e?.message || 'Could not save review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const cancelReviewPage = () => {
    setReviewPage(null);
    setReviewNote('');
    setReviewError(null);
  };

  // ----------------------------------------------------------------
  // Renderers
  // ----------------------------------------------------------------
  const renderPostMedia = (p) => {
    const images = p.images || [];
    const total = images.length;
    if (total === 0) return null;

    if (total === 1) {
      return (
        <TouchableOpacity activeOpacity={0.85} onPress={() => openImageViewer(images[0])}>
          <Image
            source={{ uri: images[0] }}
            style={[styles.cardImage, { height: CARD_IMAGE_HEIGHT, backgroundColor: borderColor }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    const items = images.slice(0, 4);
    const extra = total - items.length;

    return (
      <View style={styles.cardImageGrid}>
        {items.map((m, i) => {
          const isLast = i === 3 && extra > 0;
          return (
            <TouchableOpacity
              key={`media-${p.id}-${i}`}
              activeOpacity={0.85}
              onPress={() => openImageViewer(m)}
              style={[styles.cardImageCell, { backgroundColor: borderColor }]}
            >
              <Image source={{ uri: m }} style={styles.cardImageTile} />
              {isLast && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreOverlayText}>+{extra}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderPost = ({ item: p }) => {
    const cfg = postStatusConfig(p.status, darkMode);
    const commentCount =
      Array.isArray(p.comments) && p.comments.length > 0
        ? p.comments.length
        : (Number(p.commentCount) || 0);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openPost(p)}
        style={[styles.postCard, {
          backgroundColor: cardBg,
          borderColor: p.unread ? (darkMode ? '#1E40AF' : '#BFDBFE') : borderColor,
        }]}
      >
        {p.unread && <View style={[styles.unreadDot, { backgroundColor: '#3B82F6' }]} />}
        {renderPostMedia(p)}
        <View style={styles.postBody}>
          <View style={styles.postTopRow}>
            <View style={[styles.postStatusPill, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.postStatusPillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={[styles.postNumberText, { color: subTextColor }]}>
              {fmtPostNumber(p.id)}
            </Text>
          </View>
          <Text style={[styles.postTitle, { color: textColor, fontWeight: p.unread ? '900' : '800' }]} numberOfLines={2}>
            {p.title}
          </Text>
          {p.body ? (
            <Text style={[styles.postText, { color: subTextColor }]} numberOfLines={2}>{p.body}</Text>
          ) : null}
          <View style={[styles.postMeta, { borderTopColor: darkMode ? '#334155' : '#F1F5F9' }]}>
            <Text style={[styles.postAuthor, { color: textColor }]}>{p.author}</Text>
            <Text style={[styles.postDot, { color: subTextColor }]}>·</Text>
            <Text style={[styles.postTime, { color: subTextColor }]}>{fmtTimeAgo(p.createdAt)}</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.postStat, { color: subTextColor }]}>💬 {commentCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ Comment renderer with SWIPE-TO-REVEAL + compact inline edit (input + send icon)
  const renderComment = ({ item: c }) => {
    const member = members.find((m) => Number(m.userId) === Number(c.authorId));
    const memberColor = member?.color || '#8B5CF6';
    const memberInitials =
      member?.initials || (c.author || '?').slice(0, 2).toUpperCase();

    const isEditing = String(editingCommentId) === String(c.id);
    const wasEdited = !!c.editedAt;
    const canEdit = canEditComment(c);
    const canDelete = canDeleteComment(c);
    const canSwipe = canEdit || canDelete;

    // ---- Inline edit mode: input + round send icon on the right ----
    if (isEditing) {
      const canSave = !!editCommentText.trim() && !editSubmitting;

      return (
        <View
          style={[
            styles.commentEditRow,
            { backgroundColor: cardBg, borderColor },
          ]}
        >
          <View style={[styles.avatarSmall, { backgroundColor: memberColor }]}>
            <Text style={styles.avatarSmallText}>{memberInitials}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.commentHeaderRow}>
              <Text
                style={[styles.commentAuthor, { color: textColor }]}
                numberOfLines={1}
              >
                {c.author}
              </Text>
              <Text style={[styles.commentTime, { color: subTextColor }]}>
                · editing…
              </Text>
            </View>

            <View style={styles.commentEditInputRow}>
              <TextInput
                ref={editInputRef}
                value={editCommentText}
                onChangeText={setEditCommentText}
                multiline
                autoFocus
                editable={!editSubmitting}
                textAlignVertical="top"
                style={[
                  styles.commentEditInputInline,
                  {
                    color: textColor,
                    backgroundColor: darkMode ? '#0F172A' : '#F1F5F9',
                    borderColor: darkMode ? '#334155' : '#E2E8F0',
                  },
                ]}
              />

              <TouchableOpacity
                onPress={submitEditComment}
                disabled={!canSave}
                activeOpacity={0.85}
                style={[
                  styles.commentEditSendBtn,
                  {
                    backgroundColor: canSave
                      ? '#8B5CF6'
                      : (darkMode ? '#334155' : '#CBD5E1'),
                  },
                ]}
              >
                {editSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.commentEditSendIcon,
                      { color: canSave ? '#FFFFFF' : (darkMode ? '#64748B' : '#94A3B8') },
                    ]}
                  >
                    ➤
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    // ---- Right-hand action panel (revealed on swipe-left) ----
    const renderRightActions = (progress, dragX) => {
      const translateX = dragX.interpolate({
        inputRange: [-160, 0],
        outputRange: [0, 160],
        extrapolate: 'clamp',
      });

      const actionWidth = 74;

      return (
        <Animated.View
          style={[
            styles.swipeActionsWrap,
            { transform: [{ translateX }] },
          ]}
        >
          {canEdit && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const ref = swipeableRefs.current.get(c.id);
                try { ref?.close?.(); } catch (e) { /* noop */ }
                openSwipeIdRef.current = null;
                setEditingCommentId(c.id);
                setEditCommentText(c.body || '');
              }}
              style={[
                styles.swipeActionBtn,
                { width: actionWidth, backgroundColor: '#3B82F6' },
              ]}
            >
              <Text style={styles.swipeActionIcon}>✎</Text>
              <Text style={styles.swipeActionLabel}>Edit</Text>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                const ref = swipeableRefs.current.get(c.id);
                try { ref?.close?.(); } catch (e) { /* noop */ }
                openSwipeIdRef.current = null;
                setConfirmDeleteComment(c);
              }}
              style={[
                styles.swipeActionBtn,
                { width: actionWidth, backgroundColor: '#EF4444' },
              ]}
            >
              <Text style={styles.swipeActionIcon}>🗑️</Text>
              <Text style={styles.swipeActionLabel}>Delete</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    };

    // ---- The comment row content ----
    const commentContent = (
      <View
        style={[
          styles.commentRow,
          {
            backgroundColor: cardBg,
            borderColor,
            marginBottom: 0,
          },
        ]}
      >
        <View style={[styles.avatarSmall, { backgroundColor: memberColor }]}>
          <Text style={styles.avatarSmallText}>{memberInitials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.commentHeaderRow}>
            <Text
              style={[styles.commentAuthor, { color: textColor }]}
              numberOfLines={1}
            >
              {c.author}
            </Text>
            <Text style={[styles.commentTime, { color: subTextColor }]}>
              · {fmtTimeAgo(c.createdAt)}
              {wasEdited ? ' · edited' : ''}
            </Text>
          </View>
          <Text style={[styles.commentBody, { color: textColor }]}>
            {c.body}
          </Text>
        </View>
      </View>
    );

    if (!canSwipe) {
      return <View style={{ marginBottom: 8 }}>{commentContent}</View>;
    }

    return (
      <View style={{ marginBottom: 8, borderRadius: 12, overflow: 'hidden' }}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(c.id, ref);
            else swipeableRefs.current.delete(c.id);
          }}
          renderRightActions={renderRightActions}
          rightThreshold={40}
          overshootRight={false}
          friction={2}
          onSwipeableWillOpen={() => {
            closeAllSwipes(c.id);
          }}
          onSwipeableWillClose={() => {
            if (String(openSwipeIdRef.current) === String(c.id)) {
              openSwipeIdRef.current = null;
            }
          }}
        >
          {commentContent}
        </Swipeable>
      </View>
    );
  };

  const renderDeleteModal = () => (
    <Modal
      visible={!!confirmDeletePost}
      transparent
      animationType="fade"
      onRequestClose={() => setConfirmDeletePost(null)}
      statusBarTranslucent
    >
      <View style={styles.centerBackdrop}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFillObject}
          onPress={() => setConfirmDeletePost(null)}
        />
        {confirmDeletePost && (
          <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Delete post?</Text>
            <Text style={[styles.modalSub, { color: subTextColor }]}>
              {fmtPostNumber(confirmDeletePost.id)} · “{confirmDeletePost.title}” will be permanently removed. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmDeletePost(null)}
                disabled={deletingPost}
                style={[styles.modalBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor }]}
              >
                <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyDeletePost}
                disabled={deletingPost}
                style={[styles.modalBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
              >
                {deletingPost ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  // ================================================================
  // NEW POST — FULL SCREEN PAGE
  // ================================================================
  if (showCreatePost) {
    return (
      <View style={[styles.container, { backgroundColor: darkMode ? '#0B1220' : '#F8FAFC' }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={cancelCreatePost}
            hitSlop={10}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>New Post</Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
              In {group?.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={submitPost}
            activeOpacity={0.85}
            disabled={submittingPost}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: submittingPost ? '#94A3B8' : '#8B5CF6',
              },
            ]}
          >
            {submittingPost ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.headerActionText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.createPostContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.fieldLabel, { color: subTextColor }]}>TITLE</Text>
          <TextInput
            value={newPostTitle}
            onChangeText={(v) => { setNewPostTitle(v); setPostError(null); }}
            placeholder="What's this about?"
            placeholderTextColor={subTextColor}
            editable={!submittingPost}
            autoFocus
            style={[styles.input, {
              color: textColor,
              backgroundColor: cardBg,
              borderColor: postError ? '#EF4444' : borderColor,
            }]}
          />

          <Text style={[styles.fieldLabel, { color: subTextColor, marginTop: 18 }]}>BODY</Text>
          <TextInput
            value={newPostBody}
            onChangeText={setNewPostBody}
            placeholder="Write your post…"
            placeholderTextColor={subTextColor}
            multiline
            numberOfLines={6}
            editable={!submittingPost}
            style={[styles.input, styles.textarea, {
              color: textColor,
              backgroundColor: cardBg,
              borderColor,
            }]}
          />

          <Text style={[styles.fieldLabel, { color: subTextColor, marginTop: 18 }]}>
            MEDIA ({newPostImages.length})
          </Text>

          <TouchableOpacity
            onPress={pickImages}
            activeOpacity={0.85}
            disabled={submittingPost}
            style={[styles.uploadZone, {
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor: '#8B5CF6',
            }]}
          >
            <View style={styles.uploadIconWrap}>
              <Text style={styles.uploadIcon}>🖼️</Text>
            </View>
            <Text style={[styles.uploadTitle, { color: textColor }]}>
              Add photos
            </Text>
            <Text style={[styles.uploadSub, { color: subTextColor }]}>
              Tap to choose from your library · up to 10
            </Text>
          </TouchableOpacity>

          {newPostImages.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 14 }}
              contentContainerStyle={{ gap: 10 }}
            >
              {newPostImages.map((uri, i) => (
                <View key={`new-img-${i}`} style={styles.attachmentPreviewWrap}>
                  <Image source={{ uri }} style={styles.attachmentPreview} />
                  <TouchableOpacity
                    onPress={() => removeImageAt(i)}
                    style={styles.attachmentRemoveBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.attachmentRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={[styles.pendingInfoBox, {
            backgroundColor: darkMode ? '#422006' : '#FEF3C7',
            borderColor: darkMode ? '#78350F' : '#FDE68A',
          }]}>
            <Text style={[styles.pendingInfoText, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
              ⏳ Your post will be submitted as <Text style={{ fontWeight: '900' }}>Pending</Text> and needs review before it's approved.
            </Text>
          </View>

          {postError && (
            <Text style={{ color: '#EF4444', marginTop: 10, fontWeight: '600' }}>
              {postError}
            </Text>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  // ================================================================
  // REVIEW PAGE
  // ================================================================
  if (reviewPage) {
    const { post, action } = reviewPage;
    const isApprove = action === 'approve';
    const accent = isApprove ? '#10B981' : '#EF4444';
    const accentDark = isApprove ? (darkMode ? '#064E3B' : '#ECFDF5') : (darkMode ? '#7F1D1D' : '#FEE2E2');
    const accentText = isApprove ? (darkMode ? '#6EE7B7' : '#047857') : (darkMode ? '#FCA5A5' : '#991B1B');
    const images = post.images || [];
    const canSubmit = reviewNote.trim() && !reviewSubmitting;

    return (
      <View style={[styles.container, { backgroundColor: darkMode ? '#0B1220' : '#F8FAFC' }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={cancelReviewPage} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
              {isApprove ? 'Approve post' : 'Decline post'}
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
              {fmtPostNumber(post.id)} · in {group?.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={applyReviewPage}
            activeOpacity={0.9}
            disabled={!canSubmit}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: canSubmit ? accent : '#94A3B8',
              },
            ]}
          >
            {reviewSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.headerActionText}>
                {isApprove ? 'Approve' : 'Decline'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.reviewPageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.reviewPostCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.reviewPostTitle, { color: textColor }]}>{post.title}</Text>
            {post.body ? <Text style={[styles.reviewPostBody, { color: subTextColor }]}>{post.body}</Text> : null}

            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 10 }}>
                {images.map((uri, i) => (
                  <Image key={`review-img-${i}`} source={{ uri }} style={[styles.reviewImageThumb, { backgroundColor: borderColor }]} resizeMode="cover" />
                ))}
              </ScrollView>
            )}

            <View style={[styles.reviewMetaRow, { borderTopColor: borderColor }]}>
              <Text style={[styles.reviewMetaLabel, { color: subTextColor }]}>Author</Text>
              <Text style={[styles.reviewMetaValue, { color: textColor }]}>{post.author}</Text>
            </View>
            <View style={styles.reviewMetaRow}>
              <Text style={[styles.reviewMetaLabel, { color: subTextColor }]}>Submitted</Text>
              <Text style={[styles.reviewMetaValue, { color: textColor }]}>{fmtTimeAgo(post.createdAt)}</Text>
            </View>
          </View>

          <Text style={[styles.reviewFieldLabel, { color: subTextColor }]}>
            {isApprove ? 'APPROVAL NOTE (required)' : 'REASON FOR DECLINING (required)'}
          </Text>
          <TextInput
            value={reviewNote}
            onChangeText={(v) => { setReviewNote(v); setReviewError(null); }}
            placeholder={isApprove ? 'e.g. Looks good — go ahead.' : 'e.g. Needs more details before publishing.'}
            placeholderTextColor={subTextColor}
            multiline
            numberOfLines={6}
            editable={!reviewSubmitting}
            style={[styles.reviewInput, {
              color: textColor,
              backgroundColor: cardBg,
              borderColor: reviewError ? '#EF4444' : borderColor,
            }]}
          />
          {reviewError && <Text style={styles.reviewErrorText}>{reviewError}</Text>}

          <View style={[styles.reviewInfoBox, { backgroundColor: accentDark, borderColor: accent }]}>
            <Text style={[styles.reviewInfoText, { color: accentText }]}>
              {isApprove
                ? '✓ Your note will be saved on the post and visible to everyone.'
                : '✕ Your reason will be saved on the post and visible to everyone.'}
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  // ================================================================
  // POST DETAIL PAGE
  // ================================================================
  if (selectedPost) {
    const p = selectedPost;
    const images = p.images || [];
    const galleryWidth = SCREEN.width - 32;
    const cfg = postStatusConfig(p.status, darkMode);
    const isPending = p.status === 'pending';
    const isApproved = p.status === 'approved';
    const isDeclined = p.status === 'declined';
    const hasReviewNote = !!p.reviewNote;
    const comments = p.comments || [];
    const num = fmtPostNumber(p.id);

    const ageMs = Date.now() - new Date(p.createdAt).getTime();
    const withinWindow = ageMs < 5 * 60 * 1000;
    const canDelete = isManager || isGroupAdmin || (Number(p.authorId) === Number(currentUserId) && withinWindow);

    const commentsBoxHeight = Math.max(160, Math.min(400, comments.length * 96 + 12));

    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => setSelectedPostId(null)} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>Post {num}</Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>In {group?.name}</Text>
          </View>
          {canDelete && (
            <TouchableOpacity
              onPress={() => requestDeletePost(p)}
              hitSlop={10}
              activeOpacity={0.7}
              style={[styles.headerDeleteBtn, { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2' }]}
            >
              <Text style={styles.headerDeleteText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.detailPageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View style={styles.detailTopRow}>
            <View style={[styles.postStatusPill, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.postStatusPillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={[styles.detailPostNumber, { color: subTextColor }]}>{num}</Text>
          </View>

          <Text style={[styles.detailTitle, { color: textColor }]}>{p.title}</Text>

          <View style={styles.detailAuthorRow}>
            <View style={[styles.avatarSmall, {
              backgroundColor: members.find((m) => Number(m.userId) === Number(p.authorId))?.color || '#8B5CF6',
            }]}>
              <Text style={styles.avatarSmallText}>
                {members.find((m) => Number(m.userId) === Number(p.authorId))?.initials || (p.author || '?').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.detailAuthor, { color: textColor }]} numberOfLines={1}>{p.author}</Text>
              <Text style={[styles.detailMeta, { color: subTextColor }]} numberOfLines={1}>{fmtTimeAgo(p.createdAt)}</Text>
            </View>
          </View>

          {p.body ? <Text style={[styles.detailBody, { color: textColor }]}>{p.body}</Text> : null}

          {images.length > 0 && (
            <View style={styles.galleryWrap}>
              {images.map((uri, i) => (
                <View key={`gallery-${p.id}-${i}`} style={{ marginBottom: 10, position: 'relative' }}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => openImageViewer(uri)}>
                    <Image
                      source={{ uri }}
                      style={[styles.galleryImage, {
                        width: galleryWidth,
                        height: galleryWidth * 0.625,
                        backgroundColor: borderColor,
                      }]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {isManager && p.imageRecords && p.imageRecords[i] && (
                    <TouchableOpacity
                      onPress={() => openAnnotation(p.id, p.imageRecords[i].id, uri)}
                      activeOpacity={0.85}
                      hitSlop={6}
                      style={styles.signImageBtn}
                    >
                      <Text style={styles.signImageBtnIcon}>✎</Text>
                      <Text style={styles.signImageBtnText}>Sign</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={[styles.commentsSection, { borderTopColor: darkMode ? '#334155' : '#F1F5F9' }]}>
            <View style={styles.commentsHeaderRow}>
              <Text style={[styles.commentsHeader, { color: textColor }]}>Comments</Text>
              <View style={styles.commentsHeaderRight}>
                <Text style={[styles.commentsSub, { color: subTextColor }]}>{comments.length} total</Text>
                {!isComposing && !editingCommentId && (
                  <TouchableOpacity
                    onPress={openComposer}
                    activeOpacity={0.85}
                    style={[
                      styles.composeBtn,
                      {
                        backgroundColor: darkMode ? '#312E81' : '#EEF2FF',
                        borderColor: darkMode ? '#4338CA' : '#C7D2FE',
                      },
                    ]}
                  >
                    <Text style={[styles.composeBtnIcon, { color: darkMode ? '#C7D2FE' : '#4338CA' }]}>✎</Text>
                    <Text style={[styles.composeBtnText, { color: darkMode ? '#C7D2FE' : '#4338CA' }]}>
                      Write
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {isComposing && (
              <View style={[styles.inlineCommentBar, {
                backgroundColor: darkMode ? '#0F172A' : '#F1F5F9',
                borderColor,
              }]}>
                <View style={[styles.inlineCommentAvatar, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.inlineCommentAvatarText}>
                    {(currentUser?.name || 'ME').slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <TextInput
                  ref={commentInputRef}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Write a comment…"
                  placeholderTextColor={subTextColor}
                  editable={!submittingComment}
                  style={[styles.inlineCommentInput, { color: textColor }]}
                  multiline
                  numberOfLines={3}
                  autoFocus
                />

                <TouchableOpacity
                  onPress={closeComposer}
                  disabled={submittingComment}
                  activeOpacity={0.85}
                  style={[styles.inlineCommentCancelBtn, {
                    backgroundColor: darkMode ? '#1E293B' : '#E2E8F0',
                  }]}
                >
                  <Text style={[styles.inlineCommentCancelText, {
                    color: darkMode ? '#94A3B8' : '#64748B',
                  }]}>✕</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={submitComment}
                  disabled={!commentText.trim() || submittingComment}
                  activeOpacity={0.85}
                  style={[styles.inlineCommentSendBtn, {
                    backgroundColor: commentText.trim() && !submittingComment
                      ? '#8B5CF6'
                      : (darkMode ? '#1E293B' : '#E2E8F0'),
                  }]}
                >
                  {submittingComment ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.inlineCommentSendText, {
                      color: commentText.trim() ? '#FFFFFF' : (darkMode ? '#64748B' : '#94A3B8'),
                    }]}>➤</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {comments.length === 0 ? (
              <View style={styles.commentsEmptyBox}>
                <Text style={styles.commentsEmptyEmoji}>💬</Text>
                <Text style={[styles.commentsEmptyTitle, { color: textColor }]}>No comments yet</Text>
                <Text style={[styles.commentsEmptyBody, { color: subTextColor }]}>
                  {isComposing
                    ? 'Write the first comment above.'
                    : 'Swipe a comment left to edit or delete it.'}
                </Text>
              </View>
            ) : (
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ScrollView
                  style={[
                    styles.commentsScrollBox,
                    {
                      height: commentsBoxHeight,
                      borderColor: darkMode ? '#334155' : '#E2E8F0',
                      backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                    },
                  ]}
                  contentContainerStyle={styles.commentsScrollContent}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  keyboardShouldPersistTaps="handled"
                  onScrollBeginDrag={() => closeAllSwipes(null)}
                >
                  {comments
                    .slice()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((c) => (
                      <React.Fragment key={`comment-${c.id}`}>
                        {renderComment({ item: c })}
                      </React.Fragment>
                    ))}
                </ScrollView>
              </GestureHandlerRootView>
            )}
          </View>

          {isPending && (
            <View style={[styles.viewerNotice, {
              backgroundColor: darkMode ? '#422006' : '#FEF3C7',
              borderColor: darkMode ? '#78350F' : '#FDE68A',
            }]}>
              <Text style={[styles.viewerNoticeText, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                {isManager ? '⏳ Waiting for your review' : '⏳ Awaiting manager review'}
              </Text>
              <Text style={[styles.viewerNoticeSub, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                This post is visible to everyone while it's being reviewed.
              </Text>
            </View>
          )}

          {isApproved && (
            <View style={[styles.viewerNotice, {
              backgroundColor: darkMode ? '#064E3B' : '#ECFDF5',
              borderColor: darkMode ? '#065F46' : '#A7F3D0',
            }]}>
              <Text style={[styles.viewerNoticeText, { color: darkMode ? '#6EE7B7' : '#047857' }]}>✓ Approved</Text>
              <Text style={[styles.viewerNoticeSub, { color: darkMode ? '#6EE7B7' : '#047857' }]}>
                {p.reviewedAt ? `Approved · ${fmtTimeAgo(p.reviewedAt)}` : 'Approved by the manager.'}
              </Text>
            </View>
          )}

          {isDeclined && (
            <View style={[styles.viewerNotice, {
              backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2',
              borderColor: darkMode ? '#991B1B' : '#FECACA',
            }]}>
              <Text style={[styles.viewerNoticeText, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>✕ Declined</Text>
              <Text style={[styles.viewerNoticeSub, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>
                {p.reviewedAt ? `Declined · ${fmtTimeAgo(p.reviewedAt)}` : 'Declined by the manager.'}
              </Text>
            </View>
          )}

          {hasReviewNote && !isPending && (
            <View style={[styles.reviewNoteCard, {
              backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
              borderColor: isApproved ? (darkMode ? '#065F46' : '#A7F3D0') : (darkMode ? '#991B1B' : '#FECACA'),
            }]}>
              <View style={styles.reviewNoteHeader}>
                <Text style={[styles.reviewNoteLabel, {
                  color: isApproved ? (darkMode ? '#6EE7B7' : '#047857') : (darkMode ? '#FCA5A5' : '#991B1B'),
                }]}>
                  {isApproved ? '✓ MANAGER NOTE' : '✕ MANAGER NOTE'}
                </Text>
              </View>
              <Text style={[styles.reviewNoteBody, { color: textColor }]}>{p.reviewNote}</Text>
            </View>
          )}

          {isManager && isPending && (
            <View style={styles.approvalActionsInline}>
              <TouchableOpacity
                onPress={() => openReviewPage(p, 'decline')}
                activeOpacity={0.85}
                style={[styles.approvalBtn, { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2', borderColor: '#EF4444' }]}
              >
                <Text style={[styles.approvalBtnText, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>✕ Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openReviewPage(p, 'approve')}
                activeOpacity={0.85}
                style={[styles.approvalBtn, { backgroundColor: darkMode ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }]}
              >
                <Text style={[styles.approvalBtnText, { color: darkMode ? '#6EE7B7' : '#047857' }]}>✓ Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {renderDeleteModal()}

        {/* Delete comment confirmation */}
        <Modal
          visible={!!confirmDeleteComment}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmDeleteComment(null)}
          statusBarTranslucent
        >
          <View style={styles.centerBackdrop}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFillObject}
              onPress={() => setConfirmDeleteComment(null)}
            />
            {confirmDeleteComment && (
              <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Delete comment?</Text>
                <Text style={[styles.modalSub, { color: subTextColor }]}>
                  This comment will be permanently removed. This cannot be undone.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={() => setConfirmDeleteComment(null)}
                    disabled={deleteCommentSubmitting}
                    style={[styles.modalBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor }]}
                  >
                    <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={applyDeleteComment}
                    disabled={deleteCommentSubmitting}
                    style={[styles.modalBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
                  >
                    {deleteCommentSubmitting ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

        <ImageViewer visible={viewerVisible} uri={viewerUri} onClose={closeImageViewer} />
        <AnnotationScreen
          visible={annotVisible}
          uri={annotUri}
          onClose={closeAnnotation}
          onSave={applyAnnotation}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />
      </View>
    );
  }

  // ================================================================
  // MEMBERS PAGE
  // ================================================================
  if (page === 'members') {
    return (
      <GroupMembersPage
        group={group}
        members={members}
        onMembersChanged={loadMembers}
        isGroupAdmin={isGroupAdmin}
        currentUser={currentUser}
        onGroupUpdated={onGroupUpdated}
        onBack={() => setPage('posts')}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    );
  }

  // ================================================================
  // ABOUT PAGE
  // ================================================================
  if (page === 'about') {
    return (
      <GroupAboutPage
        group={group}
        members={members}
        postsCount={Object.values(postsTotals).reduce((a, b) => a + b, 0)}
        pendingPosts={postCounts.pending}
        currentUserId={currentUserId}
        canManage={isGroupAdmin}
        onBack={() => setPage('posts')}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    );
  }

  // ================================================================
  // POSTS (default)
  // ================================================================
  const totalPostsAcrossStatuses = (postsTotals.pending || 0)
    + (postsTotals.approved || 0)
    + (postsTotals.declined || 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{group?.name || 'Group'}</Text>
          <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
            {members.length} members · {totalPostsAcrossStatuses} posts{postCounts.pending > 0 ? ` · ${postCounts.pending} awaiting` : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setPage('about')}
          hitSlop={10}
          activeOpacity={0.7}
          style={[styles.headerIconBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }]}
        >
          <Text style={[styles.headerIconText, { color: subTextColor }]}>ⓘ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPage('members')}
          hitSlop={10}
          activeOpacity={0.7}
          style={[styles.headerIconBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }]}
        >
          <Text style={[styles.headerIconText, { color: subTextColor }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: cardBg, borderColor }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search posts or #number…"
          placeholderTextColor={subTextColor}
          style={[styles.searchInput, { color: textColor }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.postFilterRow}>
        {POST_FILTERS.map((f) => {
          const active = postFilter === f.key;
          const activeBg =
            f.key === 'pending' ? '#F59E0B'
            : f.key === 'approved' ? '#10B981'
            : '#EF4444';
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setPostFilter(f.key)}
              activeOpacity={0.85}
              style={[styles.postFilterPill, {
                backgroundColor: active ? activeBg : (darkMode ? '#1E293B' : '#F1F5F9'),
                borderColor: active ? activeBg : borderColor,
              }]}
            >
              <Text style={[styles.postFilterText, { color: active ? '#FFFFFF' : textColor }]} numberOfLines={1}>
                {f.label} ({postCounts[f.key]})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={visiblePosts}
        keyExtractor={(it) => `post-${it.id}`}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          postsLoadingMore ? (
            <View style={styles.postsFooterLoader}>
              <ActivityIndicator color="#8B5CF6" />
              <Text style={[styles.postsFooterLoaderText, { color: subTextColor }]}>
                Loading more…
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          postsLoading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color="#8B5CF6" />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>
                {postFilter === 'pending' ? '⏳' : postFilter === 'approved' ? '✓' : '✕'}
              </Text>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                {search ? 'No matches'
                  : postFilter === 'pending' ? 'No pending posts'
                  : postFilter === 'approved' ? 'No approved posts'
                  : 'No declined posts'}
              </Text>
              <Text style={[styles.emptyBody, { color: subTextColor }]}>
                {search ? `No posts match "${search}".` : 'Try a different filter.'}
              </Text>
            </View>
          )
        }
      />

      {canCreatePost && (
        <TouchableOpacity
          onPress={() => setShowCreatePost(true)}
          activeOpacity={0.85}
          style={[styles.fab, { backgroundColor: '#8B5CF6' }]}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}

      {renderDeleteModal()}

      <ImageViewer visible={viewerVisible} uri={viewerUri} onClose={closeImageViewer} />
      <AnnotationScreen
        visible={annotVisible}
        uri={annotUri}
        onClose={closeAnnotation}
        onSave={applyAnnotation}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
        cardBg={cardBg}
        borderColor={borderColor}
      />
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, fontWeight: '300', marginTop: -6 },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerIconText: { fontSize: 20, fontWeight: '700' },
  headerDeleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerDeleteText: { fontSize: 16 },

  headerActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, height: 44, gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },

  postFilterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 10 },
  postFilterPill: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  postFilterText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  listContent: { paddingHorizontal: 16, paddingBottom: 140 },

  postsFooterLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postsFooterLoaderText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  postCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  unreadDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, zIndex: 3 },
  postTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  postStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  postStatusPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  postNumberText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  cardImage: { width: '100%', overflow: 'hidden', position: 'relative' },
  cardImageGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardImageCell: { width: '50%', height: CARD_IMAGE_HEIGHT / 2, position: 'relative' },
  cardImageTile: { width: '100%', height: '100%' },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  moreOverlayText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },

  postBody: { padding: 14 },
  postTitle: { fontSize: 15, letterSpacing: -0.2, lineHeight: 20 },
  postText: { fontSize: 12.5, fontWeight: '500', marginTop: 6, lineHeight: 17 },
  postMeta: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, marginTop: 12, paddingTop: 10, gap: 6,
  },
  postAuthor: { fontSize: 12, fontWeight: '700' },
  postDot: { fontSize: 12 },
  postTime: { fontSize: 11, fontWeight: '500' },
  postStat: { fontSize: 11.5, fontWeight: '600', marginLeft: 10 },

  detailPageContent: { paddingHorizontal: 16, paddingBottom: 40 },
  detailTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  detailPostNumber: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  detailTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4, lineHeight: 28, marginBottom: 14 },
  detailAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  detailAuthor: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
  detailMeta: { fontSize: 11.5, fontWeight: '500', marginTop: 1 },
  detailBody: { fontSize: 15, fontWeight: '500', lineHeight: 23 },

  galleryWrap: { marginTop: 18 },
  galleryImage: { borderRadius: 14 },

  signImageBtn: {
    position: 'absolute', right: 10, bottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  signImageBtnIcon: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  signImageBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  commentsSection: { borderTopWidth: 1, marginTop: 22, paddingTop: 16 },
  commentsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  commentsHeader: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  commentsHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  commentsSub: { fontSize: 11.5, fontWeight: '600' },

  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  composeBtnIcon: { fontSize: 13, fontWeight: '900' },
  composeBtnText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },

  inlineCommentBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  inlineCommentAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  inlineCommentAvatarText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  inlineCommentInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inlineCommentSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  inlineCommentSendText: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: -1,
  },
  inlineCommentCancelBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  inlineCommentCancelText: {
    fontSize: 14,
    fontWeight: '900',
  },

  commentsScrollBox: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  commentsScrollContent: {
    padding: 10,
    gap: 8,
  },

  commentsEmptyBox: { alignItems: 'center', paddingVertical: 26 },
  commentsEmptyEmoji: { fontSize: 34, marginBottom: 6 },
  commentsEmptyTitle: { fontSize: 14, fontWeight: '800' },
  commentsEmptyBody: { fontSize: 12, fontWeight: '500', marginTop: 4, textAlign: 'center' },

  commentRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderRadius: 12, borderWidth: 1,
  },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  commentTime: { fontSize: 11, fontWeight: '500' },
  commentBody: { fontSize: 13.5, fontWeight: '500', lineHeight: 19, marginTop: 2 },

  // ✅ Compact inline edit — avatar row + input with round send icon on the right
  commentEditRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentEditInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  commentEditInputInline: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
    minHeight: 40,
    maxHeight: 140,
    textAlignVertical: 'top',
  },
  commentEditSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  commentEditSendIcon: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: -1,
  },

  // Swipe-to-reveal action panel
  swipeActionsWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: '100%',
  },
  swipeActionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 4,
  },
  swipeActionIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  swipeActionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  viewerNotice: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  viewerNoticeText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  viewerNoticeSub: { fontSize: 11.5, fontWeight: '600', marginTop: 4, textAlign: 'center', opacity: 0.9 },

  reviewNoteCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  reviewNoteHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  reviewNoteLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  reviewNoteBody: { fontSize: 13.5, fontWeight: '500', lineHeight: 20 },

  approvalActionsInline: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approvalBtn: { flex: 1, paddingVertical: 13, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  approvalBtnText: { fontSize: 13.5, fontWeight: '900', letterSpacing: 0.2 },

  reviewPageContent: { paddingHorizontal: 16, paddingBottom: 32 },
  reviewPostCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  reviewPostTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, lineHeight: 24 },
  reviewPostBody: { fontSize: 13.5, fontWeight: '500', marginTop: 8, lineHeight: 20 },
  reviewImageThumb: { width: 130, height: 130, borderRadius: 12 },
  reviewMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  reviewMetaLabel: { fontSize: 12.5, fontWeight: '600' },
  reviewMetaValue: { fontSize: 13, fontWeight: '800' },
  reviewFieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  reviewInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14.5, fontWeight: '500', minHeight: 130, textAlignVertical: 'top',
  },
  reviewErrorText: { color: '#EF4444', marginTop: 6, fontWeight: '700', fontSize: 12.5 },
  reviewInfoBox: { marginTop: 14, padding: 12, borderRadius: 10, borderWidth: 1 },
  reviewInfoText: { fontSize: 12, fontWeight: '700', lineHeight: 17 },

  annotBackdrop: { flex: 1, justifyContent: 'flex-end' },
  annotSheet: { height: SCREEN.height * 0.75, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  annotHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  annotHeaderBtn: { minWidth: 64, height: 34, alignItems: 'center', justifyContent: 'center' },
  annotHeaderBtnText: { fontSize: 14, fontWeight: '800' },
  annotTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  annotCanvasWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  annotCanvas: { overflow: 'hidden', borderRadius: 12 },
  annotHint: { fontSize: 12, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24, paddingVertical: 6 },
  annotPaletteRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  annotColorSwatch: { width: 28, height: 28, borderRadius: 14 },
  annotToolRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 22 : 14, borderTopWidth: 1,
  },
  annotSizeBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  annotActionBtn: { minWidth: 54, height: 36, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  annotToolText: { fontSize: 13.5, fontWeight: '800', letterSpacing: 0.2 },

  viewerBackdrop: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  viewerCloseBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 24, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewerCloseText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: -2 },
  viewerHintWrap: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  viewerHint: { color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontWeight: '600', letterSpacing: 0.2 },
  viewerStage: { width: SCREEN.width, height: SCREEN.height, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: SCREEN.width, height: SCREEN.height },

  centerBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 24 },
  centerModal: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 1, padding: 20 },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: { fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center', paddingHorizontal: 24 },

  fab: {
    position: 'absolute', right: 20, bottom: 44,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 10,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginTop: -3 },

  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontWeight: '500',
  },
  textarea: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' },

  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3, marginBottom: 8 },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },

  avatarSmall: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },

  createPostContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  uploadZone: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 16, paddingHorizontal: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  uploadIcon: { fontSize: 22 },
  uploadTitle: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
  uploadSub: { fontSize: 11, fontWeight: '500', marginTop: 2, textAlign: 'center' },

  attachmentPreviewWrap: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  attachmentPreview: { width: '100%', height: '100%' },
  attachmentRemoveBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  attachmentRemoveText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  pendingInfoBox: {
    marginTop: 20, padding: 12, borderRadius: 10, borderWidth: 1,
  },
  pendingInfoText: { fontSize: 12, fontWeight: '700', lineHeight: 17, textAlign: 'center' },
});