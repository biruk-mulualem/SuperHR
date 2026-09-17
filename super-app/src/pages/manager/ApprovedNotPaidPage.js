import React, { useState, useRef, useEffect } from 'react';
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
  Platform,
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
import SignatureScreen from 'react-native-signature-canvas';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ================================================================
// DEMO DATA
// ================================================================
const DEMO_ORDER = {
  id: 'PO-2026-001',
  requestNumber: 'PR-2026-0001',
  requester: 'Abebe Kebede',
  department: 'Production',
  date: '2026-09-05',
  status: 'pending_payment',
  priority: 'High',
  reason:
    'Urgent replacement for production line equipment. The current pipes and pumps are worn out and need immediate replacement to maintain production efficiency.',
  imageUrl:
    'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop',
  items: [
    {
      id: 1,
      item: 'Steel Pipe 2 inch',
      code: 'SP-002',
      quantity: 50,
      uom: 'PCS',
      bids: [
        { employee: 'Selam Tesfaye', unitPrice: 25.0 },
        { employee: 'Mekonnen Alemu', unitPrice: 23.6 },
        { employee: 'Tigist Hailu', unitPrice: 26.0 },
      ],
    },
    {
      id: 2,
      item: 'Industrial Paint',
      code: 'IP-100',
      quantity: 30,
      uom: 'LTR',
      bids: [
        { employee: 'Abebe Kebede', unitPrice: 15.33 },
        { employee: 'Tigist Hailu', unitPrice: 14.67 },
        { employee: 'Meron Ayele', unitPrice: 15.67 },
      ],
    },
    {
      id: 3,
      item: 'Hydraulic Pump',
      code: 'HP-500',
      quantity: 2,
      uom: 'SET',
      bids: [
        { employee: 'Dawit Solomon', unitPrice: 775.0 },
        { employee: 'Meron Ayele', unitPrice: 750.0 },
        { employee: 'Selam Tesfaye', unitPrice: 800.0 },
      ],
    },
    {
      id: 4,
      item: 'Conveyor Belt 10m',
      code: 'CB-010',
      quantity: 3,
      uom: 'ROLL',
      bids: [
        { employee: 'Tigist Hailu', unitPrice: 816.67 },
        { employee: 'Mekonnen Alemu', unitPrice: 793.33 },
      ],
    },
    {
      id: 5,
      item: 'Electrical Cable 100m',
      code: 'EC-100',
      quantity: 5,
      uom: 'ROLL',
      bids: [
        { employee: 'Dawit Solomon', unitPrice: 152.0 },
        { employee: 'Selam Tesfaye', unitPrice: 148.0 },
      ],
    },
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
// SIGNATURE MODAL — sign on the image
// ================================================================
const SignatureModal = ({
  visible,
  imageUrl,
  onCancel,
  onSave,
  darkMode,
  textColor,
  subTextColor,
}) => {
  const ref = useRef(null);

  const handleEmpty = () => {
    Alert.alert('Signature Required', 'Please sign before saving.');
  };

  const handleOK = (signature) => {
    onSave(signature);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  // Style for the webview — transparent so the image shows through
  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: transparent;
    }
    .m-signature-pad--body {
      border: none;
      background-color: transparent;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      background-color: transparent;
      margin: 0;
      padding: 0;
    }
  `;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View
        style={[
          styles.signatureModalContainer,
          { backgroundColor: darkMode ? '#0F172A' : '#F1F5F9' },
        ]}
      >
        {/* Header */}
        <View style={styles.signatureHeader}>
          <TouchableOpacity
            onPress={onCancel}
            style={styles.signatureHeaderBtn}
          >
            <Text style={[styles.signatureHeaderBtnText, { color: textColor }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.signatureHeaderTitle, { color: textColor }]}>
            ✍️ Sign Document
          </Text>
          <TouchableOpacity
            onPress={handleClear}
            style={styles.signatureHeaderBtn}
          >
            <Text
              style={[styles.signatureHeaderBtnText, { color: '#EF4444' }]}
            >
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {/* The document + signature overlay */}
        <View style={styles.signatureStage}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.signatureBackgroundImage}
            resizeMode="contain"
          />
          <View style={styles.signatureOverlayWrapper}>
            <SignatureScreen
              ref={ref}
              onOK={handleOK}
              onEmpty={handleEmpty}
              webStyle={webStyle}
              backgroundColor="transparent"
              penColor="#1E40AF"
              dotSize={2}
              minWidth={2}
              maxWidth={4}
              style={styles.signatureCanvas}
            />
          </View>
        </View>

        <Text style={[styles.signatureHint, { color: subTextColor }]}>
          Sign directly on the document with your finger
        </Text>

        {/* Footer */}
        <View style={styles.signatureFooter}>
          <TouchableOpacity
            style={[styles.signatureSaveBtn, { backgroundColor: '#10B981' }]}
            onPress={handleConfirm}
          >
            <Text style={styles.signatureSaveBtnText}>✅ Save Signature</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ================================================================
// MAIN PAGE
// ================================================================
const PendingPaymentPage = ({
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
  const [expandedItem, setExpandedItem] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const [signature, setSignature] = useState(null);

  // Load any previously saved signature for this order
  useEffect(() => {
    (async () => {
      try {
        const orderId = order?.id || order?.requestId;
        if (!orderId) return;
        const stored = await AsyncStorage.getItem(`sig_${orderId}`);
        if (stored) setSignature(stored);
      } catch (e) {
        console.warn('Failed to load signature', e);
      }
    })();
  }, [order]);

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

  const toggleExpandItem = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const imageUrl =
    data.imageUrl ||
    'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop';

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0.00';
    return Number(price).toFixed(2);
  };

  const calculateFinalPrice = (bid, quantity) => {
    if (!bid) return 0;
    return (bid.unitPrice || 0) * (quantity || 1);
  };

  const getLowestBid = (bids, quantity) => {
    if (!bids || !Array.isArray(bids) || bids.length === 0) return null;
    return bids.reduce((min, bid) => {
      const minFinal = calculateFinalPrice(min, quantity);
      const currentFinal = calculateFinalPrice(bid, quantity);
      return currentFinal < minFinal ? bid : min;
    });
  };

  const getSortedBids = (bids, quantity) => {
    if (!Array.isArray(bids)) return [];
    return [...bids].sort(
      (a, b) =>
        calculateFinalPrice(a, quantity) - calculateFinalPrice(b, quantity),
    );
  };

  const calculateTotal = () => {
    let total = 0;
    items.forEach((item) => {
      const qty = item.quantity || 1;
      const lowest = getLowestBid(item.bids, qty);
      if (lowest) total += calculateFinalPrice(lowest, qty);
    });
    return total;
  };

  const grandTotal = calculateTotal();

  // ---------- Signature flow ----------
  const openSignatureModal = () => {
    setSignatureModalVisible(true);
  };

  const handleSignatureSave = async (dataUrl) => {
    setSignature(dataUrl);
    setSignatureModalVisible(false);
    try {
      const orderId = data.id || data.requestId;
      if (orderId) {
        await AsyncStorage.setItem(`sig_${orderId}`, dataUrl);
      }
    } catch (e) {
      console.warn('Failed to persist signature', e);
    }
  };

  // ---------- Approval flow ----------
  const openApprovalModal = () => {
    if (!signature) {
      Alert.alert(
        'Signature Required',
        'Please sign the document before approving the payment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Now', onPress: openSignatureModal },
        ],
      );
      return;
    }
    setApprovalModalVisible(true);
  };

  const handleApprove = () => {
    setIsApproved(true);
    setApprovalModalVisible(false);
    Alert.alert(
      '💵 Payment Approved',
      `Payment for order "${data.requestNumber || 'N/A'}" has been approved.\n\nAmount: ETB ${formatPrice(grandTotal)}`,
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
      '❌ Payment Declined',
      `Payment for order "${data.requestNumber || 'N/A'}" has been declined.\n\nReason: ${declineReason}`,
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

        {/* Document with optional signature overlay */}
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
            {signature && (
              <Image
                source={{ uri: signature }}
                style={styles.signatureOverlayImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>
                🔍 Tap to view & zoom
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sign / Re-sign button */}
          <TouchableOpacity
            style={[
              styles.signButton,
              {
                backgroundColor: signature ? '#F1F5F9' : '#8B5CF6',
                borderColor: signature ? '#CBD5E1' : '#8B5CF6',
              },
            ]}
            onPress={openSignatureModal}
          >
            <Text
              style={[
                styles.signButtonText,
                { color: signature ? '#475569' : '#FFFFFF' },
              ]}
            >
              {signature ? '✍️ Re-sign Document' : '✍️ Sign Document'}
            </Text>
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

        {/* Items & Prices */}
        <Text style={[styles.itemsTitle, { color: textColor }]}>
          💰 Items & Prices
        </Text>

        {items.map((item, index) => {
          const quantity = item.quantity || 1;
          const hasBids = item.bids && item.bids.length > 0;
          const lowestBid = getLowestBid(item.bids, quantity);
          const winningTotal = lowestBid
            ? calculateFinalPrice(lowestBid, quantity)
            : 0;
          const isExpanded = expandedItem === item.id;
          const itemNumber = index + 1;
          const sortedBids = getSortedBids(item.bids, quantity);

          return (
            <View
              key={item.id || index}
              style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}
            >
              <TouchableOpacity
                style={styles.itemHeader}
                onPress={() => toggleExpandItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemTitleContainer}>
                  <Text style={[styles.itemNumber, { color: '#3B82F6' }]}>
                    #{itemNumber}
                  </Text>
                  <Text style={[styles.itemName, { color: textColor }]}>
                    {item.item || 'Unknown Item'}
                  </Text>
                  <Text style={[styles.itemCode, { color: subTextColor }]}>
                    {item.code || 'N/A'}
                  </Text>
                </View>
                <View style={styles.itemHeaderRight}>
                  <View style={styles.itemQuantity}>
                    <Text style={[styles.itemQtyText, { color: subTextColor }]}>
                      {quantity} {item.uom || ''}
                    </Text>
                  </View>
                  <Text style={[styles.expandIcon, { color: subTextColor }]}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Winning price */}
              <View style={styles.winningRow}>
                <Text style={[styles.winningLabel, { color: subTextColor }]}>
                  💵 Winning Price
                </Text>
                {hasBids ? (
                  <View style={styles.winningValueBlock}>
                    <Text style={[styles.winningValue, { color: '#10B981' }]}>
                      ETB {formatPrice(winningTotal)}
                    </Text>
                    <Text style={[styles.winningBy, { color: subTextColor }]}>
                      by {lowestBid?.employee || 'N/A'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.noBidsText, { color: subTextColor }]}>
                    No bids yet
                  </Text>
                )}
              </View>

              {/* Expanded bid list — no sub-texts */}
              {isExpanded && hasBids && (
                <View style={styles.expandedContent}>
                  <Text style={[styles.bidListTitle, { color: subTextColor }]}>
                    All Bids ({sortedBids.length})
                  </Text>
                  {sortedBids.map((bid, bidIndex) => {
                    const finalPrice = calculateFinalPrice(bid, quantity);
                    const isWinner = bidIndex === 0;

                    return (
                      <View
                        key={bidIndex}
                        style={[
                          styles.bidRow,
                          { borderColor: borderColor },
                          isWinner && styles.bidRowWinner,
                        ]}
                      >
                        <View style={styles.bidNameRow}>
                          <Text style={[styles.bidName, { color: textColor }]}>
                            {bid.employee || 'N/A'}
                          </Text>
                          {isWinner && (
                            <View style={styles.winnerBadge}>
                              <Text style={styles.winnerBadgeText}>
                                🏆 Winner
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.bidPrice,
                            { color: isWinner ? '#10B981' : '#3B82F6' },
                          ]}
                        >
                          ETB {formatPrice(finalPrice)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {isExpanded && !hasBids && (
                <View style={styles.expandedContent}>
                  <Text style={[styles.noBidsText, { color: subTextColor }]}>
                    No bids have been submitted for this item yet.
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Grand Total */}
        <View
          style={[
            styles.grandTotalCard,
            { backgroundColor: cardBg, borderColor },
          ]}
        >
          <Text style={[styles.grandTotalLabel, { color: subTextColor }]}>
            💰 GRAND TOTAL
          </Text>
          <Text style={styles.grandTotalValue}>
            ETB {formatPrice(grandTotal)}
          </Text>
          <Text style={[styles.grandTotalSub, { color: subTextColor }]}>
            Sum of all winning bids
          </Text>
        </View>

        {/* Actions */}
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
                <Text style={styles.approveButtonText}>
                  💵 Approve Payment
                </Text>
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
                  💵 Confirm Payment
                </Text>

                {/* Signed document preview */}
                {signature && (
                  <View style={styles.modalSignedPreview}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.modalSignedImage}
                      resizeMode="cover"
                    />
                    <Image
                      source={{ uri: signature }}
                      style={styles.modalSignedSignature}
                      resizeMode="contain"
                    />
                  </View>
                )}

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
                      Total Amount
                    </Text>
                    <Text
                      style={[
                        styles.modalInfoValue,
                        { color: '#10B981', fontSize: 16 },
                      ]}
                    >
                      ETB {formatPrice(grandTotal)}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.modalConfirmText, { color: subTextColor }]}>
                  Confirm payment approval for this order?
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
                      💵 Confirm
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
                  ❌ Decline Payment
                </Text>

                <View style={styles.modalInputContainer}>
                  <Text style={[styles.modalInputLabel, { color: textColor }]}>
                    Reason for declining *
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                        borderColor,
                        color: textColor,
                      },
                    ]}
                    placeholder="Please provide a reason..."
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

      {/* Signature Modal */}
      <SignatureModal
        visible={signatureModalVisible}
        imageUrl={imageUrl}
        onCancel={() => setSignatureModalVisible(false)}
        onSave={handleSignatureSave}
        darkMode={darkMode}
        textColor={textColor}
        subTextColor={subTextColor}
      />

      {/* Fullscreen Zoomable Image */}
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
  detailContainer: { flex: 1 },
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

  // Image section
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
  signatureOverlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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

  signButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  signButtonText: { fontSize: 14, fontWeight: '700' },

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

  // Items
  itemsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemNumber: { fontSize: 13, fontWeight: '700', minWidth: 30 },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemCode: { fontSize: 11, fontFamily: 'monospace' },
  itemHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemQuantity: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  itemQtyText: { fontSize: 12, fontWeight: '600' },
  expandIcon: { fontSize: 14, fontWeight: '600', paddingHorizontal: 4 },

  winningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  winningLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  winningValueBlock: { alignItems: 'flex-end' },
  winningValue: { fontSize: 16, fontWeight: '800' },
  winningBy: { fontSize: 11, marginTop: 1 },

  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bidListTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderRadius: 6,
    marginBottom: 2,
  },
  bidRowWinner: { backgroundColor: '#10B98115' },
  bidNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  bidName: { fontSize: 13, fontWeight: '600' },
  bidPrice: { fontSize: 14, fontWeight: '700' },
  winnerBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  winnerBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  noBidsText: { fontSize: 12, fontStyle: 'italic' },

  grandTotalCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  grandTotalValue: { fontSize: 30, fontWeight: '900', color: '#10B981' },
  grandTotalSub: { fontSize: 11, marginTop: 4 },

  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  declineButtonText: { fontSize: 15, fontWeight: '700' },
  approveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Modals (approve / decline)
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
  },
  modalSignedPreview: {
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  modalSignedImage: {
    width: '100%',
    height: '100%',
  },
  modalSignedSignature: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
  },
  modalCancelText: { fontSize: 14, fontWeight: '700' },
  modalApproveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalApproveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
  modalCloseButtonText: { fontSize: 14, fontWeight: '700' },
  modalInputContainer: { marginBottom: 12 },
  modalInputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Signature modal
  signatureModalContainer: { flex: 1 },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  signatureHeaderBtn: { padding: 6 },
  signatureHeaderBtnText: { fontSize: 15, fontWeight: '700' },
  signatureHeaderTitle: { fontSize: 16, fontWeight: '800' },
  signatureStage: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  signatureBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  signatureOverlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  signatureCanvas: { flex: 1, backgroundColor: 'transparent' },
  signatureHint: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 8,
  },
  signatureFooter: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  signatureSaveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signatureSaveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Fullscreen zoom viewer
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

export default PendingPaymentPage;