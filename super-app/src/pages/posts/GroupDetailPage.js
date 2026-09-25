// super-app/src/pages/posts/GroupDetailPage.js
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

// ================================================================
// DEMO DATA
// ================================================================
const DEMO_POSTS = [
  {
    id: 101,
    title: 'New opening hours from Monday',
    body: 'Starting next Monday, all stores open at 7:00 AM and close at 9:00 PM. Please update your schedules accordingly.',
    author: 'Sara',
    authorId: 101,
    createdAt: Date.now() - 1000 * 60 * 12,
    unread: true,
    status: 'pending',
    reviewNote: '',
    reviewedBy: null,
    reviewedAt: null,
    images: [
      'https://picsum.photos/seed/store1/1200/800',
      'https://picsum.photos/seed/store2/1200/800',
    ],
    comments: [
      { id: 1, author: 'Dawit', authorId: 102, body: 'Does this apply to the warehouse too, or just the stores?', createdAt: Date.now() - 1000 * 60 * 10 },
      { id: 2, author: 'Hanna', authorId: 103, body: 'Thanks for the heads up!', createdAt: Date.now() - 1000 * 60 * 8 },
      { id: 3, author: 'Mulu',  authorId: 201, body: 'Noted — I will update the schedule board.', createdAt: Date.now() - 1000 * 60 * 5 },
    ],
  },
  {
    id: 102,
    title: 'Cash register #3 needs repair',
    body: 'The paper feed is jamming constantly. Reported to IT yesterday. Anyone else having the same issue?',
    author: 'Dawit',
    authorId: 102,
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    unread: true,
    status: 'pending',
    reviewNote: '',
    reviewedBy: null,
    reviewedAt: null,
    images: ['https://picsum.photos/seed/register/1200/800'],
    comments: [
      { id: 4, author: 'Mulu', authorId: 201, body: 'Same issue on register #4 yesterday.', createdAt: Date.now() - 1000 * 60 * 60 * 2 },
    ],
  },
  {
    id: 103,
    title: 'Cycle count results — Oct',
    body: 'Monthly cycle count complete. 3 SKUs below threshold. Full report attached in the drive folder.',
    author: 'Mulu',
    authorId: 201,
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    unread: false,
    status: 'approved',
    reviewNote: 'Great work, please share the report with Finance too.',
    reviewedBy: 'Boss',
    reviewedAt: Date.now() - 1000 * 60 * 60 * 24,
    images: [],
    comments: [
      { id: 5, author: 'Sara', authorId: 101, body: 'Which SKUs are below threshold?', createdAt: Date.now() - 1000 * 60 * 60 * 20 },
    ],
  },
  {
    id: 104,
    title: 'New supplier onboarding',
    body: 'Welcome Tianjin Steel. Their first shipment is expected on Oct 12. Everyone please double-check the incoming BOLs.',
    author: 'Boss',
    authorId: 324,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    unread: false,
    status: 'approved',
    reviewNote: '',
    reviewedBy: null,
    reviewedAt: null,
    images: [
      'https://picsum.photos/seed/supplier1/1200/800',
      'https://picsum.photos/seed/supplier2/1200/800',
      'https://picsum.photos/seed/supplier3/1200/800',
    ],
    comments: [],
  },
  {
    id: 105,
    title: 'Reminder: safety training Friday',
    body: 'Mandatory safety training this Friday at 2 PM in the main hall. Attendance will be recorded.',
    author: 'Hanna',
    authorId: 103,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    unread: false,
    status: 'approved',
    reviewNote: '',
    reviewedBy: null,
    reviewedAt: null,
    images: ['https://picsum.photos/seed/safety/1200/800'],
    comments: [],
  },
  {
    id: 106,
    title: 'Q4 targets published',
    body: 'Please review the Q4 targets shared in the drive. Reach out if you have questions about your store.',
    author: 'Yared',
    authorId: 202,
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
    unread: false,
    status: 'declined',
    reviewNote: 'These targets are outdated — please use the revised Q4 numbers.',
    reviewedBy: 'Boss',
    reviewedAt: Date.now() - 1000 * 60 * 60 * 90,
    images: [],
    comments: [],
  },
];

const INITIAL_MEMBERS = [
  { userId: 324, name: 'Boss',   role: 'admin',  initials: 'B',  color: '#8B5CF6', department: 'Management',    canPost: true,  status: 'active'  },
  { userId: 101, name: 'Sara',   role: 'member', initials: 'SA', color: '#10B981', department: 'Sales',         canPost: true,  status: 'active'  },
  { userId: 102, name: 'Dawit',  role: 'member', initials: 'DA', color: '#3B82F6', department: 'Inventory',     canPost: true,  status: 'active'  },
  { userId: 103, name: 'Hanna',  role: 'member', initials: 'HA', color: '#EC4899', department: 'HR',            canPost: true,  status: 'active'  },
  { userId: 201, name: 'Mulu',   role: 'member', initials: 'MU', color: '#F59E0B', department: 'Warehouse',     canPost: true,  status: 'active'  },
  { userId: 202, name: 'Yared',  role: 'member', initials: 'YA', color: '#06B6D4', department: 'Logistics',     canPost: false, status: 'active'  },
  { userId: 301, name: 'Abel',   role: 'member', initials: 'AB', color: '#EF4444', department: 'Maintenance',   canPost: false, status: 'active'  },
  { userId: 302, name: 'Tigist', role: 'member', initials: 'TI', color: '#8B5CF6', department: 'Finance',       canPost: true,  status: 'pending' },
  { userId: 304, name: 'Aster',  role: 'member', initials: 'AS', color: '#10B981', department: 'Customer Care', canPost: false, status: 'pending' },
  { userId: 305, name: 'Brook',  role: 'member', initials: 'BR', color: '#3B82F6', department: 'IT Support',    canPost: true,  status: 'pending' },
];

const ALL_USERS = [
  { userId: 101, name: 'Sara',     initials: 'SA', color: '#10B981', department: 'Sales'         },
  { userId: 102, name: 'Dawit',    initials: 'DA', color: '#3B82F6', department: 'Inventory'     },
  { userId: 103, name: 'Hanna',    initials: 'HA', color: '#EC4899', department: 'HR'            },
  { userId: 104, name: 'Kalkidan', initials: 'KA', color: '#8B5CF6', department: 'Marketing'     },
  { userId: 105, name: 'Bereket',  initials: 'BE', color: '#F59E0B', department: 'IT Support'    },
  { userId: 106, name: 'Selam',    initials: 'SE', color: '#10B981', department: 'Customer Care' },
  { userId: 107, name: 'Nahom',    initials: 'NA', color: '#3B82F6', department: 'Sales'         },
  { userId: 108, name: 'Rahel',    initials: 'RA', color: '#EC4899', department: 'Finance'       },
  { userId: 109, name: 'Ermias',   initials: 'ER', color: '#06B6D4', department: 'Logistics'     },
  { userId: 110, name: 'Marta',    initials: 'MA', color: '#EF4444', department: 'Quality'       },
  { userId: 111, name: 'Samuel',   initials: 'SM', color: '#8B5CF6', department: 'R&D'           },
  { userId: 112, name: 'Liya',     initials: 'LI', color: '#F59E0B', department: 'Marketing'     },
  { userId: 201, name: 'Mulu',     initials: 'MU', color: '#F59E0B', department: 'Warehouse'     },
  { userId: 202, name: 'Yared',    initials: 'YA', color: '#06B6D4', department: 'Logistics'     },
  { userId: 203, name: 'Genet',    initials: 'GE', color: '#10B981', department: 'Training'      },
  { userId: 204, name: 'Tesfaye',  initials: 'TE', color: '#3B82F6', department: 'Warehouse'     },
  { userId: 205, name: 'Hiwot',    initials: 'HI', color: '#EC4899', department: 'HR'            },
  { userId: 301, name: 'Abel',     initials: 'AB', color: '#EF4444', department: 'Maintenance'   },
  { userId: 302, name: 'Tigist',   initials: 'TI', color: '#8B5CF6', department: 'Finance'       },
  { userId: 303, name: 'Fikru',    initials: 'FI', color: '#F59E0B', department: 'Security'      },
  { userId: 304, name: 'Aster',    initials: 'AS', color: '#10B981', department: 'Customer Care' },
  { userId: 305, name: 'Brook',    initials: 'BR', color: '#3B82F6', department: 'IT Support'    },
  { userId: 306, name: 'Meron',    initials: 'ME', color: '#EC4899', department: 'Procurement'   },
];

const CURRENT_USER = { userId: 324, name: 'Boss', role: 'admin' };

const POST_FILTERS = [
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'declined', label: 'Declined' },
];

const MEMBER_FILTERS = [
  { key: 'active',  label: 'Active'  },
  { key: 'pending', label: 'Pending' },
];

const CARD_IMAGE_HEIGHT = 180;
const SCREEN = Dimensions.get('window');

const PEN_COLORS = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#111827', '#FFFFFF'];
const PEN_SIZES = [3, 6, 10, 16];

// ================================================================
// Helpers
// ================================================================
const fmtTimeAgo = (ts) => {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - ts) / 1000);
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
// ANNOTATION SCREEN — Gesture.Pan + Reanimated worklets
// ================================================================

// ================================================================
// ANNOTATION SCREEN — SVG touch drawing
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
  const [strokes, setStrokes] = useState([]);       // [{ d, color, width }]
  const [live, setLive] = useState('');             // path string
  const [saving, setSaving] = useState(false);
  const [penColor, setPenColor] = useState('#EF4444');
  const [penWidth, setPenWidth] = useState(6);

  useEffect(() => {
    if (visible) {
      setStrokes([]);
      setLive('');
      setSaving(false);
    }
  }, [visible, uri]);

  const frameW = SCREEN.width;
  const frameH = SCREEN.height * 0.55;

  // SVG-level touch handlers
  const handleStart = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setLive(`M ${locationX} ${locationY}`);
  };

  const handleMove = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    setLive((prev) => {
      if (!prev) return `M ${locationX} ${locationY}`;
      return `${prev} L ${locationX} ${locationY}`;
    });
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.annotBackdrop, { backgroundColor: darkMode ? '#0B1220' : '#F8FAFC' }]}>
          {/* Header */}
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

          {/* Canvas */}
          <View style={styles.annotCanvasWrap}>
            <View
              ref={viewRef}
              collapsable={false}
              style={[styles.annotCanvas, {
                width: frameW,
                height: frameH,
                backgroundColor: '#000',
              }]}
            >
              {/* Image (bottom layer, non-interactive) */}
              <Image
                source={{ uri }}
                style={{ position: 'absolute', width: frameW, height: frameH }}
                resizeMode="contain"
                pointerEvents="none"
              />

              {/* SVG (top layer, receives the touch) */}
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
                  <Path
                    key={`s-${i}`}
                    d={s.d}
                    stroke={s.color}
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                {live ? (
                  <Path
                    d={live}
                    stroke={penColor}
                    strokeWidth={penWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ) : null}
              </Svg>
            </View>
          </View>

          <Text style={[styles.annotHint, { color: subTextColor }]}>
            Draw with your finger to sign or mark the image
          </Text>

          {/* Colors */}
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

          {/* Tools */}
          <View style={[styles.annotToolRow, { borderTopColor: borderColor, backgroundColor: cardBg }]}>
            {PEN_SIZES.map((w) => {
              const active = w === penWidth;
              return (
                <TouchableOpacity
                  key={w}
                  onPress={() => setPenWidth(w)}
                  activeOpacity={0.85}
                  style={[styles.annotSizeBtn, {
                    backgroundColor: active
                      ? (darkMode ? '#312E81' : '#EEF2FF')
                      : (darkMode ? '#1E293B' : '#F1F5F9'),
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

            <TouchableOpacity
              onPress={undo}
              disabled={strokes.length === 0}
              activeOpacity={0.85}
              style={[styles.annotActionBtn, {
                backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                borderColor,
                opacity: strokes.length === 0 ? 0.5 : 1,
              }]}
            >
              <Text style={[styles.annotToolText, { color: textColor }]}>↶</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearAll}
              disabled={strokes.length === 0}
              activeOpacity={0.85}
              style={[styles.annotActionBtn, {
                backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
                borderColor,
                opacity: strokes.length === 0 ? 0.5 : 1,
              }]}
            >
              <Text style={[styles.annotToolText, { color: '#EF4444' }]}>Clear</Text>
            </TouchableOpacity>
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
  onBack,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [search, setSearch] = useState('');
  const [postFilter, setPostFilter] = useState('pending');

  const isManager = CURRENT_USER.role === 'admin';

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [infoTab, setInfoTab] = useState('members');
  const [memberFilter, setMemberFilter] = useState('active');

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [grantPost, setGrantPost] = useState(true);

  const [confirmPermMember, setConfirmPermMember] = useState(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);

  const [reviewPage, setReviewPage] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState(null);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [postError, setPostError] = useState(null);

  const [selectedPostId, setSelectedPostId] = useState(null);

  const [viewerUri, setViewerUri] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const [annotUri, setAnnotUri] = useState(null);
  const [annotVisible, setAnnotVisible] = useState(false);
  const [annotTarget, setAnnotTarget] = useState(null);

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
  const applyAnnotation = (newUri) => {
    if (!annotTarget) return;
    const { postId, imageIndex } = annotTarget;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextImages = (p.images || []).slice();
        nextImages[imageIndex] = newUri;
        return { ...p, images: nextImages };
      })
    );
    closeAnnotation();
  };

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) || null,
    [posts, selectedPostId]
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (annotVisible) { closeAnnotation(); return true; }
      if (viewerVisible) { setViewerVisible(false); return true; }
      if (reviewPage) { cancelReviewPage(); return true; }
      if (confirmDeletePost) { setConfirmDeletePost(null); return true; }
      if (selectedPostId) { setSelectedPostId(null); return true; }
      if (showCreatePost) { setShowCreatePost(false); return true; }
      if (confirmPermMember) { setConfirmPermMember(null); return true; }
      if (confirmRemoveMember) { setConfirmRemoveMember(null); return true; }
      if (showAddMember) { setShowAddMember(false); return true; }
      if (showGroupInfo) { setShowGroupInfo(false); return true; }
      onBack?.();
      return true;
    });
    return () => sub.remove();
  }, [
    annotVisible,
    viewerVisible,
    reviewPage,
    confirmDeletePost,
    selectedPostId,
    showCreatePost,
    confirmPermMember,
    confirmRemoveMember,
    showAddMember,
    showGroupInfo,
    onBack,
  ]);

  const postCounts = useMemo(() => ({
    pending:  posts.filter((p) => p.status === 'pending').length,
    approved: posts.filter((p) => p.status === 'approved').length,
    declined: posts.filter((p) => p.status === 'declined').length,
  }), [posts]);

  const visiblePosts = useMemo(() => {
    const raw = search.trim().toLowerCase();
    const numeric = raw.replace(/^#/, '');
    return posts
      .filter((p) => {
        const matchesFilter = p.status === postFilter;
        if (!raw) return matchesFilter;
        const numStr = String(p.id);
        const matchesSearch =
          p.title.toLowerCase().includes(raw) ||
          p.body.toLowerCase().includes(raw) ||
          p.author.toLowerCase().includes(raw) ||
          numStr.includes(numeric) ||
          `#${numStr}`.includes(raw);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, search, postFilter]);

  const memberCounts = useMemo(() => ({
    active: members.filter((m) => m.status === 'active').length,
    pending: members.filter((m) => m.status === 'pending').length,
  }), [members]);

  const visibleMembers = useMemo(() => {
    return members.filter((m) => m.status === memberFilter);
  }, [members, memberFilter]);

  const addableUsers = useMemo(() => {
    const ids = new Set(members.map((m) => m.userId));
    const q = memberSearch.trim().toLowerCase();
    return ALL_USERS.filter((u) => !ids.has(u.userId))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q));
  }, [members, memberSearch]);

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

  const submitPost = () => {
    if (!newPostTitle.trim()) {
      setPostError('Title is required');
      return;
    }
    const id = posts.length ? Math.max(...posts.map((p) => p.id)) + 1 : 101;
    setPosts((prev) => [
      {
        id,
        title: newPostTitle.trim(),
        body: newPostBody.trim(),
        author: CURRENT_USER.name,
        authorId: CURRENT_USER.userId,
        createdAt: Date.now(),
        unread: false,
        status: 'pending',
        reviewNote: '',
        reviewedBy: null,
        reviewedAt: null,
        images: newPostImages,
        comments: [],
      },
      ...prev,
    ]);
    setShowCreatePost(false);
    setNewPostTitle('');
    setNewPostBody('');
    setNewPostImages([]);
    setPostError(null);
  };

  const openPost = (post) => {
    setSelectedPostId(post.id);
    if (post.unread) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, unread: false } : p)));
    }
  };

  const requestDeletePost = (post) => setConfirmDeletePost(post);

  const applyDeletePost = () => {
    const target = confirmDeletePost;
    if (!target) return;
    setPosts((prev) => prev.filter((p) => p.id !== target.id));
    if (selectedPostId === target.id) setSelectedPostId(null);
    setConfirmDeletePost(null);
  };

  const openReviewPage = (post, action) => {
    if (!isManager) return;
    setConfirmDeletePost(null);
    setReviewNote('');
    setReviewError(null);
    setReviewPage({ post, action });
  };

  const applyReviewPage = () => {
    if (!reviewPage) return;
    if (!reviewNote.trim()) {
      setReviewError(
        reviewPage.action === 'approve'
          ? 'Please add a short note before approving.'
          : 'Please explain why this post is declined.'
      );
      return;
    }
    const { post, action } = reviewPage;
    const nextStatus = action === 'approve' ? 'approved' : 'declined';
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              status: nextStatus,
              reviewNote: reviewNote.trim(),
              reviewedBy: CURRENT_USER.name,
              reviewedAt: Date.now(),
            }
          : p
      )
    );
    setReviewPage(null);
    setReviewNote('');
    setReviewError(null);
  };

  const cancelReviewPage = () => {
    setReviewPage(null);
    setReviewNote('');
    setReviewError(null);
  };

  const openAddMember = () => {
    setSelectedUser(null);
    setMemberSearch('');
    setGrantPost(true);
    setShowAddMember(true);
  };

  const confirmAddMember = () => {
    if (!selectedUser) return;
    setMembers((prev) => [
      ...prev,
      {
        userId: selectedUser.userId,
        name: selectedUser.name,
        role: 'member',
        initials: selectedUser.initials,
        color: selectedUser.color,
        department: selectedUser.department,
        canPost: grantPost,
        status: 'pending',
      },
    ]);
    setShowAddMember(false);
  };

  const requestToggleMemberPost = (member) => {
    if (member.role === 'admin') return;
    setConfirmPermMember(member);
  };

  const applyToggleMemberPost = () => {
    const target = confirmPermMember;
    if (!target) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.userId === target.userId ? { ...m, canPost: !m.canPost } : m
      )
    );
    setConfirmPermMember(null);
  };

  const requestRemoveMember = (member) => {
    if (member.role === 'admin') return;
    setConfirmRemoveMember(member);
  };

  const applyRemoveMember = () => {
    const target = confirmRemoveMember;
    if (!target) return;
    setMembers((prev) => prev.filter((m) => m.userId !== target.userId));
    setConfirmRemoveMember(null);
  };

  // ================================================================
  // POST MEDIA
  // ================================================================
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
              key={i}
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
    const commentCount = (p.comments || []).length;
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

  const renderComment = ({ item: c }) => {
    const memberColor = members.find((m) => m.userId === c.authorId)?.color || '#8B5CF6';
    const memberInitials = members.find((m) => m.userId === c.authorId)?.initials || c.author.slice(0, 2).toUpperCase();

    return (
      <View style={[styles.commentRow, {
        backgroundColor: cardBg,
        borderColor: borderColor,
      }]}>
        <View style={[styles.avatarSmall, { backgroundColor: memberColor }]}>
          <Text style={styles.avatarSmallText}>{memberInitials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.commentHeaderRow}>
            <Text style={[styles.commentAuthor, { color: textColor }]} numberOfLines={1}>{c.author}</Text>
            <Text style={[styles.commentTime, { color: subTextColor }]}>· {fmtTimeAgo(c.createdAt)}</Text>
          </View>
          <Text style={[styles.commentBody, { color: textColor }]}>{c.body}</Text>
        </View>
      </View>
    );
  };

  const renderMember = ({ item: m }) => {
    const isPending = m.status === 'pending';
    return (
      <View style={[styles.memberRow, {
        backgroundColor: cardBg,
        borderColor: isPending ? (darkMode ? '#78350F' : '#FDE68A') : borderColor,
      }]}>
        <View style={[styles.avatar, { backgroundColor: m.color }]}>
          <Text style={styles.avatarText}>{m.initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.memberNameRow}>
            <Text style={[styles.memberName, { color: textColor }]} numberOfLines={1}>{m.name}</Text>
            {isPending && (
              <View style={[styles.pendingPill, { backgroundColor: darkMode ? '#422006' : '#FEF3C7' }]}>
                <Text style={[styles.pendingPillText, { color: darkMode ? '#FCD34D' : '#92400E' }]}>⏳ PENDING</Text>
              </View>
            )}
          </View>
          <View style={styles.memberRoleRow}>
            <Text style={[styles.memberRole, { color: subTextColor }]}>
              {m.department || (m.role === 'admin' ? 'Administrator' : 'Member')}
            </Text>
            {m.role !== 'admin' && !isPending && (
              <Text style={[styles.memberRole, styles.postPermText, {
                color: m.canPost ? (darkMode ? '#6EE7B7' : '#047857') : (darkMode ? '#FCA5A5' : '#991B1B'),
              }]}>
                · {m.canPost ? 'Can post' : 'Read only'}
              </Text>
            )}
            {m.role !== 'admin' && isPending && (
              <Text style={[styles.memberRole, styles.postPermText, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                · Awaiting response
              </Text>
            )}
          </View>
        </View>
        {m.role === 'admin' ? (
          <View style={[styles.adminPill, { backgroundColor: darkMode ? '#312E81' : '#EEF2FF' }]}>
            <Text style={[styles.adminPillText, { color: darkMode ? '#C7D2FE' : '#4338CA' }]}>ADMIN</Text>
          </View>
        ) : (
          <View style={styles.memberActions}>
            {!isPending && (
              <TouchableOpacity
                onPress={() => requestToggleMemberPost(m)}
                activeOpacity={0.85}
                style={[styles.smallBtn, {
                  backgroundColor: m.canPost ? (darkMode ? '#064E3B' : '#ECFDF5') : (darkMode ? '#422006' : '#FEF3C7'),
                  borderColor: m.canPost ? '#10B981' : '#F59E0B',
                }]}
              >
                <Text style={[styles.smallBtnText, {
                  color: m.canPost ? (darkMode ? '#6EE7B7' : '#047857') : (darkMode ? '#FCD34D' : '#92400E'),
                }]}>
                  {m.canPost ? '✎ Post' : '🔒 Read'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => requestRemoveMember(m)}
              hitSlop={6}
              activeOpacity={0.7}
              style={[styles.smallIconBtn, { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2' }]}
            >
              <Text style={styles.smallIconText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderAbout = () => (
    <ScrollView contentContainerStyle={styles.aboutContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.infoLabel, { color: subTextColor }]}>DESCRIPTION</Text>
        <Text style={[styles.infoValue, { color: textColor }]}>{group?.description || 'No description'}</Text>
      </View>
      <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.statCell}>
          <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{posts.length}</Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Posts</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
        <View style={styles.statCell}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{members.length}</Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Members</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
        <View style={styles.statCell}>
          <Text style={[styles.statValue, { color: postCounts.pending > 0 ? '#F59E0B' : '#94A3B8' }]}>
            {postCounts.pending}
          </Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Awaiting</Text>
        </View>
      </View>
      <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: subTextColor }]}>Status</Text>
          <View style={[styles.statusPill, {
            backgroundColor: group?.status === 'inactive' ? (darkMode ? '#422006' : '#FEF3C7') : (darkMode ? '#064E3B' : '#ECFDF5'),
          }]}>
            <Text style={[styles.statusPillText, {
              color: group?.status === 'inactive' ? (darkMode ? '#FCD34D' : '#92400E') : (darkMode ? '#6EE7B7' : '#047857'),
            }]}>
              {group?.status === 'inactive' ? '⏸ Inactive' : '● Active'}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: subTextColor }]}>Members</Text>
          <Text style={[styles.metaValue, { color: textColor }]}>{members.length}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: subTextColor }]}>Pending invites</Text>
          <Text style={[styles.metaValue, { color: memberCounts.pending > 0 ? (darkMode ? '#FCD34D' : '#92400E') : textColor }]}>
            {memberCounts.pending}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: subTextColor }]}>Posts awaiting approval</Text>
          <Text style={[styles.metaValue, { color: postCounts.pending > 0 ? (darkMode ? '#FCD34D' : '#92400E') : textColor }]}>
            {postCounts.pending}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: subTextColor }]}>Last activity</Text>
          <Text style={[styles.metaValue, { color: textColor }]}>{fmtTimeAgo(group?.lastActivity)}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderDeleteModal = () => (
    <Modal visible={!!confirmDeletePost} transparent animationType="fade" onRequestClose={() => setConfirmDeletePost(null)}>
      <View style={styles.centerBackdrop}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setConfirmDeletePost(null)} />
        {confirmDeletePost && (
          <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Delete post?</Text>
            <Text style={[styles.modalSub, { color: subTextColor }]}>
              {fmtPostNumber(confirmDeletePost.id)} · “{confirmDeletePost.title}” will be permanently removed. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmDeletePost(null)}
                style={[styles.modalBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor }]}
              >
                <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyDeletePost}
                style={[styles.modalBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
              >
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

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
        </View>

        <ScrollView
          contentContainerStyle={styles.reviewPageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.reviewPostCard, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.reviewPostTitle, { color: textColor }]}>{post.title}</Text>
            {post.body ? (
              <Text style={[styles.reviewPostBody, { color: subTextColor }]}>{post.body}</Text>
            ) : null}

            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
                contentContainerStyle={{ gap: 10 }}
              >
                {images.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={[styles.reviewImageThumb, { backgroundColor: borderColor }]}
                    resizeMode="cover"
                  />
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
            style={[styles.reviewInput, {
              color: textColor,
              backgroundColor: cardBg,
              borderColor: reviewError ? '#EF4444' : borderColor,
            }]}
          />
          {reviewError && (
            <Text style={styles.reviewErrorText}>{reviewError}</Text>
          )}

          <View style={[styles.reviewInfoBox, {
            backgroundColor: accentDark,
            borderColor: accent,
          }]}>
            <Text style={[styles.reviewInfoText, { color: accentText }]}>
              {isApprove
                ? '✓ Your note will be saved on the post and visible to everyone.'
                : '✕ Your reason will be saved on the post and visible to everyone.'}
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.reviewFooter, {
          backgroundColor: darkMode ? '#0B1220' : '#FFFFFF',
          borderTopColor: borderColor,
        }]}>
          <TouchableOpacity
            onPress={cancelReviewPage}
            activeOpacity={0.85}
            style={[styles.reviewFooterBtn, {
              backgroundColor: darkMode ? '#1E293B' : '#F1F5F9',
              borderColor,
            }]}
          >
            <Text style={[styles.reviewFooterBtnText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={applyReviewPage}
            activeOpacity={0.9}
            disabled={!reviewNote.trim()}
            style={[styles.reviewFooterBtn, {
              backgroundColor: reviewNote.trim() ? accent : '#94A3B8',
              borderColor: reviewNote.trim() ? accent : '#94A3B8',
              flex: 1.4,
            }]}
          >
            <Text style={[styles.reviewFooterBtnText, { color: '#FFFFFF' }]}>
              {isApprove ? '✓ Approve & save' : '✕ Decline & save'}
            </Text>
          </TouchableOpacity>
        </View>
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

    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => setSelectedPostId(null)} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
              Post {num}
            </Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>In {group?.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => requestDeletePost(p)}
            hitSlop={10}
            activeOpacity={0.7}
            style={[styles.headerDeleteBtn, { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2' }]}
          >
            <Text style={styles.headerDeleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.detailPageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              backgroundColor: members.find((m) => m.userId === p.authorId)?.color || '#8B5CF6',
            }]}>
              <Text style={styles.avatarSmallText}>
                {(members.find((m) => m.userId === p.authorId)?.initials) || p.author.slice(0, 2).toUpperCase()}
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
                <View key={`img-${i}`} style={{ marginBottom: 10, position: 'relative' }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openImageViewer(uri)}
                  >
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

                  {isManager && (
                    <TouchableOpacity
                      onPress={() => openAnnotation(p.id, i, uri)}
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
              <Text style={[styles.commentsSub, { color: subTextColor }]}>{comments.length} total</Text>
            </View>

            {comments.length === 0 ? (
              <View style={styles.commentsEmptyBox}>
                <Text style={styles.commentsEmptyEmoji}>💬</Text>
                <Text style={[styles.commentsEmptyTitle, { color: textColor }]}>No comments yet</Text>
                <Text style={[styles.commentsEmptyBody, { color: subTextColor }]}>
                  Comments on this post will appear here.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 4 }}>
                {comments
                  .slice()
                  .sort((a, b) => a.createdAt - b.createdAt)
                  .map((c) => (
                    <React.Fragment key={c.id}>{renderComment({ item: c })}</React.Fragment>
                  ))}
              </View>
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
                {p.reviewedBy ? `Approved by ${p.reviewedBy} · ${fmtTimeAgo(p.reviewedAt)}` : 'Approved by the manager.'}
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
                {p.reviewedBy ? `Declined by ${p.reviewedBy} · ${fmtTimeAgo(p.reviewedAt)}` : 'Declined by the manager.'}
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
                {p.reviewedBy && (
                  <Text style={[styles.reviewNoteMeta, { color: subTextColor }]}>— {p.reviewedBy}</Text>
                )}
              </View>
              <Text style={[styles.reviewNoteBody, { color: textColor }]}>{p.reviewNote}</Text>
            </View>
          )}

          {isManager && isPending && (
            <View style={styles.approvalActionsInline}>
              <TouchableOpacity
                onPress={() => openReviewPage(p, 'decline')}
                activeOpacity={0.85}
                style={[styles.approvalBtn, {
                  backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2',
                  borderColor: '#EF4444',
                }]}
              >
                <Text style={[styles.approvalBtnText, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>✕ Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openReviewPage(p, 'approve')}
                activeOpacity={0.85}
                style={[styles.approvalBtn, {
                  backgroundColor: darkMode ? '#064E3B' : '#ECFDF5',
                  borderColor: '#10B981',
                }]}
              >
                <Text style={[styles.approvalBtnText, { color: darkMode ? '#6EE7B7' : '#047857' }]}>✓ Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {renderDeleteModal()}

        <ImageViewer
          visible={viewerVisible}
          uri={viewerUri}
          onClose={closeImageViewer}
        />

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
  // GROUP INFO PAGE
  // ================================================================
  if (showGroupInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => setShowGroupInfo(false)} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
            <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{group?.name || 'Group'}</Text>
            <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>Group info</Text>
          </View>
          {infoTab === 'members' && (
            <TouchableOpacity onPress={openAddMember} activeOpacity={0.85} style={[styles.addBtn, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.addBtnText}>＋ Member</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.segRow}>
          <TouchableOpacity onPress={() => setInfoTab('members')} activeOpacity={0.85} style={[styles.segBtn, {
            backgroundColor: infoTab === 'members' ? '#8B5CF6' : (darkMode ? '#1E293B' : '#F1F5F9'),
            borderColor: infoTab === 'members' ? '#8B5CF6' : borderColor,
          }]}>
            <Text style={[styles.segBtnText, { color: infoTab === 'members' ? '#FFFFFF' : textColor }]}>
              Members ({members.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInfoTab('about')} activeOpacity={0.85} style={[styles.segBtn, {
            backgroundColor: infoTab === 'about' ? '#8B5CF6' : (darkMode ? '#1E293B' : '#F1F5F9'),
            borderColor: infoTab === 'about' ? '#8B5CF6' : borderColor,
          }]}>
            <Text style={[styles.segBtnText, { color: infoTab === 'about' ? '#FFFFFF' : textColor }]}>About</Text>
          </TouchableOpacity>
        </View>

        {infoTab === 'members' ? (
          <>
            <View style={styles.memberFilterRow}>
              {MEMBER_FILTERS.map((f) => {
                const active = memberFilter === f.key;
                const isPending = f.key === 'pending';
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setMemberFilter(f.key)}
                    activeOpacity={0.85}
                    style={[styles.memberFilterPill, {
                      backgroundColor: active ? (isPending ? '#F59E0B' : '#8B5CF6') : (darkMode ? '#1E293B' : '#F1F5F9'),
                      borderColor: active ? (isPending ? '#F59E0B' : '#8B5CF6') : borderColor,
                    }]}
                  >
                    <Text style={[styles.memberFilterText, { color: active ? '#FFFFFF' : textColor }]} numberOfLines={1}>
                      {f.label} ({memberCounts[f.key]})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <FlatList
              data={visibleMembers}
              keyExtractor={(it) => String(it.userId)}
              renderItem={renderMember}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>{memberFilter === 'pending' ? '⏳' : '👥'}</Text>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>
                    {memberFilter === 'pending' ? 'No pending invites' : 'No active members'}
                  </Text>
                  <Text style={[styles.emptyBody, { color: subTextColor }]}>
                    {memberFilter === 'pending' ? 'Everyone has responded to their invite.' : 'Tap “＋ Member” to add people to this group.'}
                  </Text>
                </View>
              }
            />
          </>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>{renderAbout()}</View>
        )}

        <Modal visible={showAddMember} transparent animationType="slide" onRequestClose={() => setShowAddMember(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setShowAddMember(false)} />
            <View style={[styles.modal, styles.addMemberModal, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Add Member</Text>
              <Text style={[styles.modalSub, { color: subTextColor }]}>Pick someone to invite to {group?.name}</Text>

              <View style={[styles.searchWrap, styles.searchWrapTight, {
                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                borderColor,
              }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  value={memberSearch}
                  onChangeText={setMemberSearch}
                  placeholder="Search by name or department…"
                  placeholderTextColor={subTextColor}
                  style={[styles.searchInput, { color: textColor }]}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {memberSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setMemberSearch('')} hitSlop={8}>
                    <Text style={[styles.clearIcon, { color: subTextColor }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ maxHeight: 220, marginTop: 6 }}>
                <FlatList
                  data={addableUsers}
                  keyExtractor={(it) => String(it.userId)}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: u }) => {
                    const selected = selectedUser?.userId === u.userId;
                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedUser(u)}
                        activeOpacity={0.85}
                        style={[styles.userPickRow, {
                          backgroundColor: selected ? (darkMode ? '#312E81' : '#EEF2FF') : (darkMode ? '#0F172A' : '#FFFFFF'),
                          borderColor: selected ? '#8B5CF6' : borderColor,
                        }]}
                      >
                        <View style={[styles.avatarSmall, { backgroundColor: u.color }]}>
                          <Text style={styles.avatarSmallText}>{u.initials}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.userPickName, { color: textColor }]} numberOfLines={1}>{u.name}</Text>
                          <Text style={[styles.userPickDept, { color: subTextColor }]} numberOfLines={1}>{u.department}</Text>
                        </View>
                        {selected && <Text style={[styles.checkMark, { color: '#8B5CF6' }]}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={[styles.emptySmall, { color: subTextColor }]}>
                      {memberSearch ? `No people match "${memberSearch}".` : 'Everyone is already in this group.'}
                    </Text>
                  }
                />
              </View>

              {selectedUser && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.fieldLabel, { color: subTextColor }]}>POSTING PERMISSION</Text>
                  <View style={styles.permRow}>
                    <TouchableOpacity onPress={() => setGrantPost(true)} activeOpacity={0.85} style={[styles.permBtn, {
                      backgroundColor: grantPost ? (darkMode ? '#064E3B' : '#ECFDF5') : (darkMode ? '#0F172A' : '#FFFFFF'),
                      borderColor: grantPost ? '#10B981' : borderColor,
                    }]}>
                      <Text style={styles.permIcon}>✎</Text>
                      <Text style={[styles.permTitle, { color: grantPost ? (darkMode ? '#6EE7B7' : '#047857') : textColor }]}>Can post</Text>
                      <Text style={[styles.permSub, { color: grantPost ? (darkMode ? '#6EE7B7' : '#047857') : subTextColor }]}>Create and edit posts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setGrantPost(false)} activeOpacity={0.85} style={[styles.permBtn, {
                      backgroundColor: !grantPost ? (darkMode ? '#422006' : '#FEF3C7') : (darkMode ? '#0F172A' : '#FFFFFF'),
                      borderColor: !grantPost ? '#F59E0B' : borderColor,
                    }]}>
                      <Text style={styles.permIcon}>🔒</Text>
                      <Text style={[styles.permTitle, { color: !grantPost ? (darkMode ? '#FCD34D' : '#92400E') : textColor }]}>Read only</Text>
                      <Text style={[styles.permSub, { color: !grantPost ? (darkMode ? '#FCD34D' : '#92400E') : subTextColor }]}>View posts only</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.pendingHint, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
                    ⏳ They will be added as <Text style={{ fontWeight: '900' }}>Pending</Text> until they accept the invite.
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowAddMember(false)} activeOpacity={0.85} style={[styles.modalBtn, {
                  backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor,
                }]}>
                  <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmAddMember} activeOpacity={0.85} disabled={!selectedUser} style={[styles.modalBtn, {
                  backgroundColor: selectedUser ? '#8B5CF6' : '#94A3B8',
                  borderColor: selectedUser ? '#8B5CF6' : '#94A3B8',
                }]}>
                  <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Send invite</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={!!confirmPermMember} transparent animationType="fade" onRequestClose={() => setConfirmPermMember(null)}>
          <View style={styles.centerBackdrop}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setConfirmPermMember(null)} />
            {confirmPermMember && (
              <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Change posting access?</Text>
                <Text style={[styles.modalSub, { color: subTextColor }]}>
                  {confirmPermMember.canPost
                    ? `${confirmPermMember.name} will no longer be able to create posts in this group. They will only be able to read.`
                    : `${confirmPermMember.name} will be able to create and edit posts in this group.`}
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setConfirmPermMember(null)} activeOpacity={0.85} style={[styles.modalBtn, {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor,
                  }]}>
                    <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={applyToggleMemberPost} activeOpacity={0.85} style={[styles.modalBtn, {
                    backgroundColor: confirmPermMember.canPost ? '#F59E0B' : '#10B981',
                    borderColor: confirmPermMember.canPost ? '#F59E0B' : '#10B981',
                  }]}>
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>
                      {confirmPermMember.canPost ? 'Make read only' : 'Allow posting'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

        <Modal visible={!!confirmRemoveMember} transparent animationType="fade" onRequestClose={() => setConfirmRemoveMember(null)}>
          <View style={styles.centerBackdrop}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setConfirmRemoveMember(null)} />
            {confirmRemoveMember && (
              <View style={[styles.centerModal, { backgroundColor: cardBg, borderColor }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Remove member?</Text>
                <Text style={[styles.modalSub, { color: subTextColor }]}>
                  {confirmRemoveMember.name} will be removed from {group?.name}. They can be added back later.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setConfirmRemoveMember(null)} activeOpacity={0.85} style={[styles.modalBtn, {
                    backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor,
                  }]}>
                    <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={applyRemoveMember} activeOpacity={0.85} style={[styles.modalBtn, {
                    backgroundColor: '#EF4444', borderColor: '#EF4444',
                  }]}>
                    <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </View>
    );
  }

  // ================================================================
  // POSTS (default)
  // ================================================================
  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} hitSlop={10} activeOpacity={0.7} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: textColor }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>{group?.name || 'Group'}</Text>
          <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
            {members.length} members · {posts.length} posts{postCounts.pending > 0 ? ` · ${postCounts.pending} awaiting` : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setInfoTab('members'); setMemberFilter('active'); setShowGroupInfo(true); }}
          hitSlop={10}
          activeOpacity={0.7}
          style={[styles.headerMenuBtn, { backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }]}
        >
          <Text style={[styles.headerMenuText, { color: subTextColor }]}>⋮</Text>
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
        keyExtractor={(it) => String(it.id)}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>
              {postFilter === 'pending' ? '⏳'
                : postFilter === 'approved' ? '✓'
                : '✕'}
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
        }
      />

      <TouchableOpacity onPress={() => setShowCreatePost(true)} activeOpacity={0.85} style={[styles.fab, { backgroundColor: '#8B5CF6' }]}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {renderDeleteModal()}

      <Modal visible={showCreatePost} transparent animationType="slide" onRequestClose={() => setShowCreatePost(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setShowCreatePost(false)} />
          <View style={[styles.modal, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>New Post</Text>
            <Text style={[styles.modalSub, { color: subTextColor }]}>In {group?.name}</Text>

            <Text style={[styles.fieldLabel, { color: subTextColor }]}>TITLE</Text>
            <TextInput
              value={newPostTitle}
              onChangeText={(v) => { setNewPostTitle(v); setPostError(null); }}
              placeholder="What's this about?"
              placeholderTextColor={subTextColor}
              style={[styles.input, {
                color: textColor,
                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                borderColor: postError ? '#EF4444' : borderColor,
              }]}
            />

            <Text style={[styles.fieldLabel, { color: subTextColor }]}>BODY</Text>
            <TextInput
              value={newPostBody}
              onChangeText={setNewPostBody}
              placeholder="Write your post…"
              placeholderTextColor={subTextColor}
              multiline
              numberOfLines={5}
              style={[styles.input, styles.textarea, {
                color: textColor,
                backgroundColor: darkMode ? '#0F172A' : '#FFFFFF',
                borderColor,
              }]}
            />

            <Text style={[styles.fieldLabel, { color: subTextColor }]}>
              MEDIA ({newPostImages.length})
            </Text>

            <View style={styles.pickerRow}>
              <TouchableOpacity
                onPress={pickImages}
                activeOpacity={0.85}
                style={[styles.pickerBtn, { backgroundColor: darkMode ? '#0F172A' : '#FFFFFF', borderColor }]}
              >
                <Text style={styles.pickerBtnIcon}>🖼️</Text>
                <Text style={[styles.pickerBtnText, { color: textColor }]}>Add photos</Text>
              </TouchableOpacity>
            </View>

            {newPostImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
                {newPostImages.map((uri, i) => (
                  <View key={`img-${i}`} style={styles.attachmentPreviewWrap}>
                    <Image source={{ uri }} style={styles.attachmentPreview} />
                    <TouchableOpacity onPress={() => removeImageAt(i)} style={styles.attachmentRemoveBtn} hitSlop={8}>
                      <Text style={styles.attachmentRemoveText}>✕</Text>
                    </TouchableOpacity>
                    <View style={styles.attachmentTypeBadge}>
                      <Text style={styles.attachmentTypeBadgeText}>IMG</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.pendingHint, { color: darkMode ? '#FCD34D' : '#92400E' }]}>
              ⏳ Your post will be submitted as <Text style={{ fontWeight: '900' }}>Pending</Text> and needs review before it's approved.
            </Text>

            {postError && (
              <Text style={{ color: '#EF4444', marginTop: 6, fontWeight: '600' }}>{postError}</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCreatePost(false)} activeOpacity={0.85} style={[styles.modalBtn, {
                backgroundColor: darkMode ? '#1E293B' : '#F1F5F9', borderColor,
              }]}>
                <Text style={[styles.modalBtnText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitPost} activeOpacity={0.85} style={[styles.modalBtn, {
                backgroundColor: '#8B5CF6', borderColor: '#8B5CF6',
              }]}>
                <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Submit for review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ImageViewer
        visible={viewerVisible}
        uri={viewerUri}
        onClose={closeImageViewer}
      />

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, fontWeight: '300', marginTop: -6 },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  headerSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },
  headerMenuBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerMenuText: { fontSize: 22, fontWeight: '700', marginTop: -2 },
  headerDeleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerDeleteText: { fontSize: 16 },

  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, height: 44, gap: 8,
  },
  searchWrapTight: { height: 40, marginHorizontal: 0, marginBottom: 0, borderRadius: 10 },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearIcon: { fontSize: 14, fontWeight: '700', padding: 4 },

  postFilterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 10 },
  postFilterPill: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  postFilterText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

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

  detailPageContent: { paddingHorizontal: 16, paddingBottom: 60 },
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
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  signImageBtnIcon: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  signImageBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  commentsSection: { borderTopWidth: 1, marginTop: 22, paddingTop: 16 },
  commentsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  commentsHeader: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  commentsSub: { fontSize: 11.5, fontWeight: '600' },
  commentsEmptyBox: { alignItems: 'center', paddingVertical: 26 },
  commentsEmptyEmoji: { fontSize: 34, marginBottom: 6 },
  commentsEmptyTitle: { fontSize: 14, fontWeight: '800' },
  commentsEmptyBody: { fontSize: 12, fontWeight: '500', marginTop: 4, textAlign: 'center' },

  commentRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  commentTime: { fontSize: 11, fontWeight: '500' },
  commentBody: { fontSize: 13.5, fontWeight: '500', lineHeight: 19, marginTop: 2 },

  viewerNotice: {
    padding: 14, borderRadius: 12, borderWidth: 1,
    marginBottom: 16, alignItems: 'center',
  },
  viewerNoticeText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  viewerNoticeSub: {
    fontSize: 11.5, fontWeight: '600', marginTop: 4, textAlign: 'center', opacity: 0.9,
  },

  reviewNoteCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  reviewNoteHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  reviewNoteLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  reviewNoteMeta: { fontSize: 10.5, fontWeight: '600', marginLeft: 4 },
  reviewNoteBody: { fontSize: 13.5, fontWeight: '500', lineHeight: 20 },

  approvalActionsInline: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approvalBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 11, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  approvalBtnText: { fontSize: 13.5, fontWeight: '900', letterSpacing: 0.2 },

  reviewPageContent: { paddingHorizontal: 16, paddingBottom: 32 },
  reviewPostCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  reviewPostTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, lineHeight: 24 },
  reviewPostBody: { fontSize: 13.5, fontWeight: '500', marginTop: 8, lineHeight: 20 },
  reviewImageThumb: { width: 130, height: 130, borderRadius: 12 },
  reviewMetaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  reviewMetaLabel: { fontSize: 12.5, fontWeight: '600' },
  reviewMetaValue: { fontSize: 13, fontWeight: '800' },
  reviewFieldLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
    marginBottom: 8, marginTop: 4,
  },
  reviewInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14.5, fontWeight: '500',
    minHeight: 130, textAlignVertical: 'top',
  },
  reviewErrorText: { color: '#EF4444', marginTop: 6, fontWeight: '700', fontSize: 12.5 },
  reviewInfoBox: {
    marginTop: 14, padding: 12, borderRadius: 10, borderWidth: 1,
  },
  reviewInfoText: { fontSize: 12, fontWeight: '700', lineHeight: 17 },
  reviewFooter: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1,
  },
  reviewFooterBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewFooterBtnText: { fontSize: 14.5, fontWeight: '900', letterSpacing: 0.2 },

  annotBackdrop: { flex: 1 },
  annotHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 52 : 22, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  annotHeaderBtn: { minWidth: 64, height: 34, alignItems: 'center', justifyContent: 'center' },
  annotHeaderBtnText: { fontSize: 14, fontWeight: '800' },
  annotTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
  annotCanvasWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  annotCanvas: { overflow: 'hidden', borderRadius: 12 },
  annotHint: {
    fontSize: 12, fontWeight: '600', textAlign: 'center',
    paddingHorizontal: 24, paddingBottom: 12,
  },
  annotPaletteRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 10,
  },
  annotColorSwatch: {
    width: 28, height: 28, borderRadius: 14,
  },
  annotToolRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1,
  },
  annotSizeBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  annotActionBtn: {
    minWidth: 54, height: 36, paddingHorizontal: 10,
    borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  annotToolText: { fontSize: 13.5, fontWeight: '800', letterSpacing: 0.2 },

  viewerBackdrop: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  viewerCloseBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 24, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewerCloseText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: -2 },
  viewerHintWrap: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  viewerHint: {
    color: 'rgba(255,255,255,0.7)', fontSize: 11.5, fontWeight: '600', letterSpacing: 0.2,
  },
  viewerStage: { width: SCREEN.width, height: SCREEN.height, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: SCREEN.width, height: SCREEN.height },

  pickerRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  pickerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
  },
  pickerBtnIcon: { fontSize: 18 },
  pickerBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  attachmentPreviewWrap: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  attachmentPreview: { width: '100%', height: '100%' },
  attachmentRemoveBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  attachmentRemoveText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  attachmentTypeBadge: {
    position: 'absolute', bottom: 4, left: 4,
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.65)',
  },
  attachmentTypeBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },

  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, gap: 12,
  },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  memberName: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  memberRoleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  memberRole: { fontSize: 11.5, fontWeight: '500' },
  postPermText: { fontWeight: '800', marginLeft: 6 },
  pendingPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  pendingPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  adminPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  adminPillText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  smallBtnText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.2 },
  smallIconBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  smallIconText: { color: '#EF4444', fontSize: 13, fontWeight: '900' },

  memberFilterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 10 },
  memberFilterPill: {
    flex: 1, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  memberFilterText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  aboutContent: { paddingBottom: 100 },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  infoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  infoValue: { fontSize: 13.5, fontWeight: '500', lineHeight: 20 },
  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  statLabel: {
    fontSize: 10.5, fontWeight: '700', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  statDivider: { width: 1, height: 36, opacity: 0.6 },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8,
  },
  metaLabel: { fontSize: 13, fontWeight: '600' },
  metaValue: { fontSize: 13.5, fontWeight: '800' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: {
    fontSize: 10, fontWeight: '900', letterSpacing: 0.4, textTransform: 'uppercase',
  },

  segRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  segBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  segBtnText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },

  addMemberModal: { maxHeight: '90%' },
  userPickRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1, marginBottom: 5, gap: 10,
  },
  userPickName: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
  userPickDept: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  avatarSmall: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  checkMark: { fontSize: 18, fontWeight: '900' },
  emptySmall: { fontSize: 12.5, fontWeight: '500', textAlign: 'center', paddingVertical: 16 },

  permRow: { flexDirection: 'row', gap: 10 },
  permBtn: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1, alignItems: 'flex-start',
  },
  permIcon: { fontSize: 18, marginBottom: 4 },
  permTitle: { fontSize: 13.5, fontWeight: '900', letterSpacing: -0.2 },
  permSub: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  pendingHint: { fontSize: 11.5, fontWeight: '600', marginTop: 10, lineHeight: 16 },

  centerBackdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 24,
  },
  centerModal: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 1, padding: 20 },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyBody: {
    fontSize: 13, fontWeight: '500', marginTop: 6, textAlign: 'center', paddingHorizontal: 24,
  },

  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginTop: -3 },

  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modal: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1,
    padding: 20, paddingBottom: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, fontWeight: '600', marginTop: 3, marginBottom: 8 },

  fieldLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontWeight: '500',
  },
  textarea: { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  modalBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
});