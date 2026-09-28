// pages/manager/PendingDetailPage.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import mobileManagerDetailService from '../../stores/mobileManagerDetailService';
import { API_BASE } from '../../constants/config';

const { width, height } = Dimensions.get('window');

// ================================================================
// Resolve relative /uploads/... URLs into full URLs
// ================================================================
const resolveDocUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_BASE.replace(/\/api$/, '')}${url}`;
  return url;
};

// ================================================================
// ZOOMABLE IMAGE VIEWER
// ================================================================
const ZoomableImage = ({ uri, onClose, containerWidth, containerHeight }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        scale.value = withTiming(2.5);
      }
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      'worklet';
      if (scale.value < 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 5) {
        scale.value = withTiming(5);
        savedScale.value = 5;
      } else {
        savedScale.value = scale.value;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const resetZoom = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  return (
    <View style={styles.fullImageContainer}>
      <TouchableOpacity
        style={styles.fullImageReset}
        onPress={resetZoom}
        activeOpacity={0.7}
      >
        <Text style={styles.fullImageResetText}>⟲</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fullImageClose}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Text style={styles.fullImageCloseText}>✕</Text>
      </TouchableOpacity>

      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            styles.zoomContainer,
            { width: containerWidth, height: containerHeight },
          ]}
        >
          <Animated.Image
            source={{ uri }}
            style={[styles.fullImage, animatedStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>

      <Text style={styles.zoomHint}>
        Pinch to zoom · Double-tap to toggle · Drag to pan
      </Text>
    </View>
  );
};

// ================================================================
// MAIN DETAIL PAGE
// ================================================================
const PendingDetailPage = ({
  onBack,
  onActionComplete, // 👈 NEW: called after successful approve/decline
  order,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // 👇 per-action in-flight flags (replaces the generic `submitting`)
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);

  // 👇 set once the action succeeds → hides the buttons
  const [actionDone, setActionDone] = useState(null); // 'approved' | 'declined' | null

  // ----------------------------------------------------------------
  // Fetch full detail on mount
  // ----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const passed = order?.order || order;

        if (passed?.items?.length > 0) {
          if (!cancelled) {
            setData(passed);
            setLoading(false);
          }
          return;
        }

        if (!passed?.id) {
          if (!cancelled) {
            setError('No request ID was provided');
            setLoading(false);
          }
          return;
        }

        const res = await mobileManagerDetailService.getRequestDetail(
          passed.id,
        );

        if (cancelled) return;

        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || 'Failed to load request');
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order]);

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  const getPriorityColor = (priority) => {
    const p = String(priority || '').toLowerCase();
    const colors = {
      urgent: '#EF4444',
      high: '#EF4444',
      medium: '#F59E0B',
      low: '#10B981',
      normal: '#3B82F6',
    };
    return colors[p] || '#64748B';
  };

  const openFullImage = (url) => {
    setSelectedImage(url);
    setFullImageVisible(true);
  };

  const busy = approving || declining;

  // ----------------------------------------------------------------
  // APPROVE
  // ----------------------------------------------------------------
  const handleApprove = async () => {
    if (!data?.id || busy) return; // guard against double-tap
    try {
      setApproving(true);
      const res = await mobileManagerDetailService.approveRequest(data.id);

      if (res.success) {
        setActionDone('approved');
        setApprovalModalVisible(false);

        // Notify the parent list to refresh
        if (typeof onActionComplete === 'function') {
          onActionComplete({ type: 'approved', id: data.id });
        }

        Alert.alert(
          '✅ Order Approved',
          `Order "${data.requestNumber}" has been approved successfully.`,
          [{ text: 'OK', onPress: onBack }],
        );
      } else {
        Alert.alert('Error', res.error || 'Failed to approve');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Network error');
    } finally {
      setApproving(false);
    }
  };

  // ----------------------------------------------------------------
  // DECLINE
  // ----------------------------------------------------------------
  const handleDecline = async () => {
    if (!data?.id || busy) return; // guard against double-tap
    if (!declineReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for declining');
      return;
    }

    try {
      setDeclining(true);
      const res = await mobileManagerDetailService.declineRequest(
        data.id,
        declineReason.trim(),
      );

      if (res.success) {
        setActionDone('declined');
        setDeclineModalVisible(false);

        if (typeof onActionComplete === 'function') {
          onActionComplete({ type: 'declined', id: data.id });
        }

        Alert.alert(
          '❌ Order Declined',
          `Order "${data.requestNumber}" has been declined.\n\nReason: ${declineReason}`,
          [{ text: 'OK', onPress: onBack }],
        );
      } else {
        Alert.alert('Error', res.error || 'Failed to decline');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Network error');
    } finally {
      setDeclining(false);
    }
  };

  // ----------------------------------------------------------------
  // Loading / Error states
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <View
        style={[
          styles.detailContainer,
          {
            backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text
          style={{
            fontSize: 13,
            marginTop: 12,
            color: darkMode ? '#94A3B8' : '#64748B',
          }}
        >
          Loading request...
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View
        style={[
          styles.detailContainer,
          {
            backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          },
        ]}
      >
        <Text style={{ fontSize: 44, marginBottom: 12 }}>⚠️</Text>
        <Text
          style={{
            color: darkMode ? '#94A3B8' : '#64748B',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          {error || 'Request not found'}
        </Text>
        <TouchableOpacity
          style={{
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: '#3B82F6',
          }}
          onPress={onBack}
        >
          <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: '700' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const itemCount = items.length;
  const imageUrl = resolveDocUrl(data.approvedDocFront || data.imageUrl);

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <View
      style={[
        styles.detailContainer,
        { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' },
      ]}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Order Summary */}
        <View
          style={[styles.orderSummary, { backgroundColor: cardBg, borderColor }]}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderNumber, { color: textColor }]}>
                {data.requestNumber || 'N/A'}
              </Text>
              <Text style={[styles.orderId, { color: subTextColor }]}>
                {data.poNumber || data.id || 'N/A'}
              </Text>
            </View>
            <View
              style={[
                styles.priorityBadgeLarge,
                { backgroundColor: getPriorityColor(data.priority) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.priorityTextLarge,
                  { color: getPriorityColor(data.priority) },
                ]}
              >
                {data.priority || 'Normal'} Priority
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>
                Requester
              </Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>
                {data.requester || 'N/A'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>
                Department
              </Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>
                {data.department || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>
                Date
              </Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>
                {data.date || 'N/A'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>
                Items
              </Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>
                {itemCount} items
              </Text>
            </View>
          </View>
        </View>

        {/* Document Image */}
        {imageUrl ? (
          <View
            style={[
              styles.imageSection,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              📄 Request Document
            </Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => openFullImage(imageUrl)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.requestImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>
                  🔍 Tap to view & zoom
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Message from purchaser */}
        {data.bossMessage ? (
          <View
            style={[
              styles.messageSection,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              📩 Message from Purchaser
            </Text>
            <View style={styles.messageContainer}>
              <Text style={[styles.messageText, { color: textColor }]}>
                {data.bossMessage}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Reason */}
        {data.reason ? (
          <View
            style={[
              styles.reasonSection,
              { backgroundColor: cardBg, borderColor },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              📝 Request Reason
            </Text>
            <View style={styles.reasonContainer}>
              <Text style={[styles.reasonText, { color: textColor }]}>
                {data.reason}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!actionDone && (
            <>
              <TouchableOpacity
                style={[
                  styles.declineButton,
                  {
                    borderColor: '#EF4444',
                    opacity: busy && !declining ? 0.5 : 1,
                  },
                ]}
                onPress={() => setDeclineModalVisible(true)}
                disabled={busy}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.declineButtonText, { color: '#EF4444' }]}
                >
                  ❌ Decline
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.approveButton,
                  {
                    backgroundColor: busy && !approving ? '#94A3B8' : '#10B981',
                  },
                ]}
                onPress={() => setApprovalModalVisible(true)}
                disabled={busy}
                activeOpacity={0.85}
              >
                {approving ? (
                  <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.approveButtonText, { marginLeft: 8 }]}>
                      Approving...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.approveButtonText}>✅ Approve</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {actionDone ? (
            <View
              style={[
                styles.doneBox,
                {
                  backgroundColor:
                    actionDone === 'approved' ? '#DCFCE7' : '#FEE2E2',
                  borderColor:
                    actionDone === 'approved' ? '#86EFAC' : '#FECACA',
                },
              ]}
            >
              <Text
                style={[
                  styles.doneText,
                  {
                    color:
                      actionDone === 'approved' ? '#166534' : '#991B1B',
                  },
                ]}
              >
                {actionDone === 'approved'
                  ? '✅ Order approved'
                  : '❌ Order declined'}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Approve Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={approvalModalVisible}
        onRequestClose={() => !approving && setApprovalModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => !approving && setApprovalModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' },
                ]}
              >
                <View
                  style={[
                    styles.modalAccentBar,
                    { backgroundColor: darkMode ? '#334155' : '#E2E8F0' },
                  ]}
                />

                <Text style={[styles.modalTitle, { color: textColor }]}>
                  ✅ Confirm Approval
                </Text>

                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalInfoRow}>
                    <Text
                      style={[styles.modalInfoLabel, { color: subTextColor }]}
                    >
                      Order
                    </Text>
                    <Text style={[styles.modalInfoValue, { color: textColor }]}>
                      {data.requestNumber}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text
                      style={[styles.modalInfoLabel, { color: subTextColor }]}
                    >
                      Requester
                    </Text>
                    <Text style={[styles.modalInfoValue, { color: textColor }]}>
                      {data.requester}
                    </Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text
                      style={[styles.modalInfoLabel, { color: subTextColor }]}
                    >
                      Items
                    </Text>
                    <Text style={[styles.modalInfoValue, { color: textColor }]}>
                      {itemCount} items
                    </Text>
                  </View>
                </View>

                <Text style={[styles.modalConfirmText, { color: subTextColor }]}>
                  Are you sure you want to approve this order?
                </Text>

                <View style={styles.modalActionContainer}>
                  <TouchableOpacity
                    style={[styles.modalCancelButton, { borderColor }]}
                    onPress={() => setApprovalModalVisible(false)}
                    disabled={approving}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalCancelText, { color: textColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalApproveButton,
                      { backgroundColor: approving ? '#94A3B8' : '#10B981' },
                    ]}
                    onPress={handleApprove}
                    disabled={approving}
                    activeOpacity={0.85}
                  >
                    {approving ? (
                      <View style={styles.buttonLoadingRow}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          style={[styles.modalApproveButtonText, { marginLeft: 8 }]}
                        >
                          Approving...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.modalApproveButtonText}>
                        ✅ Confirm
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Decline Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={declineModalVisible}
        onRequestClose={() => !declining && setDeclineModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => !declining && setDeclineModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' },
                ]}
              >
                <View
                  style={[
                    styles.modalAccentBar,
                    { backgroundColor: darkMode ? '#334155' : '#E2E8F0' },
                  ]}
                />

                <Text style={[styles.modalTitle, { color: textColor }]}>
                  ❌ Decline Order
                </Text>

                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalInfoRow}>
                    <Text
                      style={[styles.modalInfoLabel, { color: subTextColor }]}
                    >
                      Order
                    </Text>
                    <Text style={[styles.modalInfoValue, { color: textColor }]}>
                      {data.requestNumber}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSignatureInputContainer}>
                  <Text
                    style={[styles.modalSignatureLabel, { color: textColor }]}
                  >
                    Reason for declining *
                  </Text>
                  <TextInput
                    style={[
                      styles.modalSignatureInput,
                      {
                        backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                        borderColor,
                        color: textColor,
                      },
                    ]}
                    placeholder="Please provide a reason for declining this order..."
                    placeholderTextColor={subTextColor}
                    value={declineReason}
                    onChangeText={setDeclineReason}
                    multiline={true}
                    numberOfLines={4}
                    editable={!declining}
                  />
                </View>

                <View style={styles.modalActionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modalDeclineButton,
                      { backgroundColor: declining ? '#94A3B8' : '#EF4444' },
                    ]}
                    onPress={handleDecline}
                    disabled={declining}
                    activeOpacity={0.85}
                  >
                    {declining ? (
                      <View style={styles.buttonLoadingRow}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text
                          style={[styles.modalDeclineButtonText, { marginLeft: 8 }]}
                        >
                          Declining...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.modalDeclineButtonText}>
                        ❌ Confirm Decline
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalCloseButton,
                    { backgroundColor: darkMode ? '#334155' : '#F1F5F9' },
                  ]}
                  onPress={() => setDeclineModalVisible(false)}
                  disabled={declining}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalCloseButtonText,
                      { color: subTextColor },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full Screen Image Modal with Zoom */}
      <Modal
        visible={fullImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageVisible(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          {selectedImage && (
            <ZoomableImage
              uri={selectedImage}
              onClose={() => setFullImageVisible(false)}
              containerWidth={width}
              containerHeight={height}
            />
          )}
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  detailContainer: { flex: 1, paddingTop: 0 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 30 },

  // Order Summary
  orderSummary: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: { fontSize: 20, fontWeight: '800' },
  orderId: { fontSize: 13, fontFamily: 'monospace', marginTop: 2 },
  priorityBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityTextLarge: { fontSize: 12, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: { flex: 1 },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  summaryValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },

  // Image Section
  imageSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  requestImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E2E8F0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    alignItems: 'center',
  },
  imageOverlayText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },

  // Message
  messageSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  messageContainer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Reason
  reasonSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  reasonContainer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  reasonText: { fontSize: 14, lineHeight: 22 },

  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: { fontSize: 15, fontWeight: '700' },
  approveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Loading row inside buttons
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Done state
  doneBox: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontSize: 15, fontWeight: '800' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    elevation: 24,
    maxHeight: '92%',
  },
  modalAccentBar: {
    width: 50,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  modalInfoContainer: { marginBottom: 12 },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F020',
  },
  modalInfoLabel: { fontSize: 13, fontWeight: '500' },
  modalInfoValue: { fontSize: 13, fontWeight: '700' },
  modalConfirmText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  modalActionContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700' },
  modalApproveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApproveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalDeclineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeclineButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: { fontSize: 14, fontWeight: '700' },
  modalSignatureInputContainer: { marginBottom: 12 },
  modalSignatureLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  modalSignatureInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Full Screen Image
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: { justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '100%' },
  fullImageClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageCloseText: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
  fullImageReset: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageResetText: { color: '#FFFFFF', fontSize: 22, fontWeight: '600' },
  zoomHint: {
    position: 'absolute',
    bottom: 30,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
});

export default PendingDetailPage;