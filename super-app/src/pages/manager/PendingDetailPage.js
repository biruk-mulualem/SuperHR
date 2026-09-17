import React, { useState } from 'react';
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

const { width, height } = Dimensions.get('window');

// Demo order data
const DEMO_ORDER = {
  id: 'PO-2026-001',
  requestNumber: 'PR-2026-0001',
  requester: 'Abebe Kebede',
  employeeId: 'EMP-001',
  email: 'abebe.kebede@company.com',
  department: 'Production',
  date: '2026-09-05',
  status: 'pending',
  priority: 'High',
  reason:
    'Urgent replacement for production line equipment. The current pipes and pumps are worn out and need immediate replacement to maintain production efficiency.',
  imageUrl:
    'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop',
  items: [
    { id: 1, item: 'Steel Pipe 2 inch', code: 'SP-002', quantity: 50, uom: 'PCS' },
    { id: 2, item: 'Industrial Paint', code: 'IP-100', quantity: 30, uom: 'LTR' },
    { id: 3, item: 'Hydraulic Pump', code: 'HP-500', quantity: 2, uom: 'SET' },
    { id: 4, item: 'Conveyor Belt 10m', code: 'CB-010', quantity: 3, uom: 'ROLL' },
    { id: 5, item: 'Electrical Cable 100m', code: 'EC-100', quantity: 5, uom: 'ROLL' },
  ],
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
  order,
  darkMode,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) => {
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);

  let data = order;
  if (!data || !data.items || data.items.length === 0) {
    data = DEMO_ORDER;
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const itemCount = items.length;

  const getPriorityColor = (priority) => {
    const colors = {
      High: '#EF4444',
      Medium: '#F59E0B',
      Low: '#10B981',
      Normal: '#3B82F6',
    };
    return colors[priority] || '#64748B';
  };

  const openFullImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setFullImageVisible(true);
  };

  const imageUrl =
    data.imageUrl ||
    'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop';

  const openApprovalModal = () => {
    setApprovalModalVisible(true);
  };

  const handleApprove = () => {
    setIsApproved(true);
    setApprovalModalVisible(false);
    Alert.alert(
      '✅ Order Approved',
      `Order "${data.requestNumber || 'N/A'}" has been approved successfully.`,
      [{ text: 'OK', onPress: onBack }],
    );
  };

  const handleDecline = () => {
    if (!declineReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for declining');
      return;
    }
    setIsDeclined(true);
    setDeclineModalVisible(false);
    Alert.alert(
      '❌ Order Declined',
      `Order "${data.requestNumber || 'N/A'}" has been declined.\n\nReason: ${declineReason}`,
      [{ text: 'OK', onPress: onBack }],
    );
  };

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
                {data.id || 'N/A'}
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
        <View
          style={[styles.imageSection, { backgroundColor: cardBg, borderColor }]}
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

        {/* Reason */}
        {data.reason && (
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
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!isApproved && !isDeclined && (
            <>
              <TouchableOpacity
                style={[styles.declineButton, { borderColor: '#EF4444' }]}
                onPress={() => setDeclineModalVisible(true)}
              >
                <Text style={[styles.declineButtonText, { color: '#EF4444' }]}>
                  ❌ Decline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.approveButton, { backgroundColor: '#10B981' }]}
                onPress={openApprovalModal}
              >
                <Text style={styles.approveButtonText}>✅ Approve</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Approve Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={approvalModalVisible}
        onRequestClose={() => setApprovalModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setApprovalModalVisible(false)}
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
                  >
                    <Text style={[styles.modalCancelText, { color: textColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalApproveButton,
                      { backgroundColor: '#10B981' },
                    ]}
                    onPress={handleApprove}
                  >
                    <Text style={styles.modalApproveButtonText}>
                      ✅ Confirm
                    </Text>
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
        onRequestClose={() => setDeclineModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDeclineModalVisible(false)}>
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
                  />
                </View>

                <View style={styles.modalActionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modalDeclineButton,
                      { backgroundColor: '#EF4444' },
                    ]}
                    onPress={handleDecline}
                  >
                    <Text style={styles.modalDeclineButtonText}>
                      ❌ Confirm Decline
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalCloseButton,
                    { backgroundColor: darkMode ? '#334155' : '#F1F5F9' },
                  ]}
                  onPress={() => setDeclineModalVisible(false)}
                >
                  <Text
                    style={[styles.modalCloseButtonText, { color: subTextColor }]}
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

const styles = StyleSheet.create({
  detailContainer: {
    flex: 1,
    paddingTop: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },

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
  orderNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  orderId: {
    fontSize: 13,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  priorityBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityTextLarge: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  // Image Section
  imageSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
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
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },

  // Reason Section
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
  reasonText: {
    fontSize: 14,
    lineHeight: 22,
  },

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
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  approveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

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
  modalInfoContainer: {
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F020',
  },
  modalInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalInfoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  modalActionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalApproveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
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
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSignatureInputContainer: {
    marginBottom: 12,
  },
  modalSignatureLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
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
  zoomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
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
  fullImageCloseText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
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
  fullImageResetText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
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