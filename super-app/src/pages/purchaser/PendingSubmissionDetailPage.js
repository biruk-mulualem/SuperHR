// pages/purchaser/PendingSubmissionDetailPage.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Dimensions,
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

import purchaserService from '../../stores/purchaserService';

const { width, height } = Dimensions.get('window');

// ================================================================
// MOCK DOCUMENT — only used when the PR has no real document
// ================================================================
const MOCK_DOC_URL =
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=1100&fit=crop';

const getPriorityColor = (priority) => {
  const colors = {
    Urgent: '#EF4444',
    High: '#EF4444',
    Medium: '#F59E0B',
    Low: '#10B981',
    Normal: '#3B82F6',
  };
  return colors[priority] || '#64748B';
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
// MAIN COMPONENT
// ================================================================
export default function PendingSubmissionDetailPage({
  request,
  onBack,
  onRefresh,
  darkMode = false,
  textColor,
  subTextColor,
  cardBg,
  borderColor,
}) {
  const resolvedTextColor = textColor || (darkMode ? '#F1F5F9' : '#1E293B');
  const resolvedSubTextColor = subTextColor || (darkMode ? '#94A3B8' : '#64748B');
  const resolvedCardBg = cardBg || (darkMode ? '#1E293B' : '#FFFFFF');
  const resolvedBorderColor = borderColor || (darkMode ? '#334155' : '#E2E8F0');

  // ---------- Bid drafts (preload the user's current bid) ----------
  const initialDrafts = useMemo(() => {
    const init = {};
    (request?.items || []).forEach((it) => {
      const hasMine = !!it.hasMyBid;

      init[it.id] = {
        unitPrice: hasMine && it.myUnitPrice != null
          ? String(it.myUnitPrice)
          : '',
        discount: hasMine && it.myDiscount
          ? String(it.myDiscount)
          : '',
        matchesRequirement: hasMine
          ? it.myMatchesRequirement ?? true
          : null,
        remark: hasMine ? it.myRemark || '' : '',
        notes: hasMine ? it.myNotes || '' : '',
      };
    });
    return init;
  }, [request]);

  const [drafts, setDrafts] = useState(initialDrafts);
  const [activeItemId, setActiveItemId] = useState(null);
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDrafts(initialDrafts);
  }, [initialDrafts]);

  // ---------- Helpers ----------
  const getDraft = (id) => drafts[id] || {};
  const updateDraft = (id, patch) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const calcTotal = (item, draft) => {
    const unit = parseFloat(draft?.unitPrice) || 0;
    return unit * (item?.quantity || 0);
  };
  const calcFinal = (item, draft) => {
    const total = calcTotal(item, draft);
    const disc = parseFloat(draft?.discount) || 0;
    return Math.max(0, total - disc);
  };
  const isDraftValid = (item, draft) => {
    const unit = parseFloat(draft?.unitPrice) || 0;
    if (unit <= 0) return false;
    if (draft?.matchesRequirement === null) return false;
    if (draft?.matchesRequirement === false && !draft?.remark?.trim())
      return false;
    return true;
  };

  const activeItem =
    (request?.items || []).find((i) => i.id === activeItemId) || null;
  const activeDraft = activeItem ? getDraft(activeItem.id) : {};
  const activeTotal = activeItem ? calcTotal(activeItem, activeDraft) : 0;
  const activeFinal = activeItem ? calcFinal(activeItem, activeDraft) : 0;
  const activeValid = activeItem ? isDraftValid(activeItem, activeDraft) : false;

  const openBidModal = (itemId) => setActiveItemId(itemId);
  const closeBidModal = () => setActiveItemId(null);

  const openFullImage = (url) => {
    if (!url) return;
    setSelectedImage(url);
    setFullImageVisible(true);
  };

  // ================================================================
  // SUBMIT
  // ================================================================
  const submitPriceFor = async (item) => {
    const draft = getDraft(item.id);
    if (!isDraftValid(item, draft)) return;
    if (submitting) return;

    setSubmitting(true);

    try {
      const payload = {
        unitPrice: parseFloat(draft.unitPrice),
        discount: parseFloat(draft.discount) || 0,
        matchesRequirement: draft.matchesRequirement === true,
        remark: draft.remark || null,
        notes: draft.notes || null,
      };

      const res = await purchaserService.submitPrice(item.id, payload);

      if (res?.success) {
        const updatedItem = res.data?.items?.find((i) => i.id === item.id);
        const finalPrice = Number(
          updatedItem?.myFinalPrice ?? calcFinal(item, draft),
        );

        updateDraft(item.id, {
          unitPrice: updatedItem?.myUnitPrice != null
            ? String(updatedItem.myUnitPrice)
            : draft.unitPrice,
          discount: '',
          matchesRequirement: updatedItem?.myMatchesRequirement ?? null,
          remark: updatedItem?.myRemark ?? '',
          notes: updatedItem?.myNotes ?? '',
        });

        Alert.alert(
          item.hasMyBid ? '✅ Price Updated' : '✅ Price Submitted',
          `${item.item}\nFinal: ETB ${finalPrice.toFixed(2)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                closeBidModal();
                onRefresh?.();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          '❌ Submission Failed',
          res?.error || 'Please try again.',
        );
      }
    } catch (err) {
      console.error('submitPrice error:', err);
      Alert.alert(
        '❌ Submission Failed',
        err?.response?.data?.error ||
          err?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Empty state ----------
  if (!request) {
    return (
      <View
        style={[
          styles.detailContainer,
          { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' },
        ]}
      >
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: resolvedSubTextColor }]}>
            No request selected
          </Text>
        </View>
      </View>
    );
  }

  const items = Array.isArray(request.items) ? request.items : [];
  const itemCount = items.length;

  // 👇 Use the server-resolved URL; fall back to the mock only if truly absent
 const imageUrl =
  request.imageUrl ||
  request.approvedDocFront ||
  request.approvedDocBack ||
  MOCK_DOC_URL;

  // 👇 Prefer the pre-formatted label; fall back to the raw date
  const dateLabel =
    request.dateLabel ||
    request.date ||
    request.requestedDateLabel ||
    request.requestedDate ||
    'N/A';

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
          style={[
            styles.orderSummary,
            { backgroundColor: resolvedCardBg, borderColor: resolvedBorderColor },
          ]}
        >
          <View style={styles.orderHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.orderNumber, { color: resolvedTextColor }]}>
                {request.requestNumber || 'N/A'}
              </Text>
              <Text style={[styles.orderId, { color: resolvedSubTextColor }]}>
                {request.id || 'N/A'}
              </Text>
            </View>
            <View
              style={[
                styles.priorityBadgeLarge,
                { backgroundColor: getPriorityColor(request.priority) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.priorityTextLarge,
                  { color: getPriorityColor(request.priority) },
                ]}
              >
                {request.priority || 'Normal'} Priority
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: resolvedSubTextColor }]}>
                Requester
              </Text>
              <Text style={[styles.summaryValue, { color: resolvedTextColor }]}>
                {request.requester || 'N/A'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: resolvedSubTextColor }]}>
                Department
              </Text>
              <Text style={[styles.summaryValue, { color: resolvedTextColor }]}>
                {request.department || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: resolvedSubTextColor }]}>
                Date
              </Text>
              <Text style={[styles.summaryValue, { color: resolvedTextColor }]}>
                {dateLabel}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: resolvedSubTextColor }]}>
                Items
              </Text>
              <Text style={[styles.summaryValue, { color: resolvedTextColor }]}>
                {itemCount} items
              </Text>
            </View>
          </View>
        </View>

        {/* Document */}
        <View
          style={[
            styles.imageSection,
            { backgroundColor: resolvedCardBg, borderColor: resolvedBorderColor },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: resolvedTextColor }]}>
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
              <Text style={styles.imageOverlayText}>🔍 Tap to view & zoom</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reason */}
        {request.reason && (
          <View
            style={[
              styles.reasonSection,
              { backgroundColor: resolvedCardBg, borderColor: resolvedBorderColor },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: resolvedTextColor }]}>
              📝 Request Reason
            </Text>
            <View style={styles.reasonContainer}>
              <Text style={[styles.reasonText, { color: resolvedTextColor }]}>
                {request.reason}
              </Text>
            </View>
          </View>
        )}

        {/* Items */}
        <Text
          style={[
            styles.sectionTitle,
            { color: resolvedTextColor, marginTop: 4, marginBottom: 12 },
          ]}
        >
          📦 Items ({itemCount})
        </Text>

        {items.map((item, idx) => {
          const draft = getDraft(item.id);
          const hasPrice = parseFloat(draft.unitPrice) > 0;
          const alreadyMine = !!item.hasMyBid;
          const serverPrice = item.myFinalPrice;

          return (
            <View
              key={item.id}
              style={[
                styles.itemBlock,
                { backgroundColor: resolvedCardBg, borderColor: resolvedBorderColor },
              ]}
            >
              <View style={styles.itemHeaderRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.itemNumber, { color: resolvedSubTextColor }]}>
                    Item #{idx + 1}
                  </Text>
                  <Text style={[styles.itemName, { color: resolvedTextColor }]}>
                    {item.item}
                  </Text>
                  <Text style={[styles.itemMeta, { color: resolvedSubTextColor }]}>
                    {item.code} · {item.quantity} {item.uom}
                  </Text>
                </View>

                {hasPrice && (
                  <View style={styles.priceChip}>
                    <Text style={styles.priceChipText}>
                      ETB {calcFinal(item, draft).toFixed(2)}
                    </Text>
                  </View>
                )}

                {!hasPrice && alreadyMine && serverPrice != null && (
                  <View style={styles.priceChip}>
                    <Text style={styles.priceChipText}>
                      ✓ ETB {Number(serverPrice).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor:
                      hasPrice || alreadyMine ? '#F1F5F9' : '#F59E0B',
                  },
                ]}
                onPress={() => openBidModal(item.id)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.submitBtnText,
                    {
                      color:
                        hasPrice || alreadyMine ? '#475569' : '#FFFFFF',
                    },
                  ]}
                >
                  {hasPrice || alreadyMine
                    ? '✏️ Edit Price'
                    : '📤 Submit Price'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==================== BID MODAL ==================== */}
      <Modal
        visible={activeItemId !== null}
        transparent
        animationType="slide"
        onRequestClose={closeBidModal}
      >
        <TouchableWithoutFeedback onPress={closeBidModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: resolvedCardBg }]}>
                <View
                  style={[styles.modalHandle, { backgroundColor: resolvedBorderColor }]}
                />
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 12 }}
                >
                  <Text style={[styles.modalTitle, { color: resolvedTextColor }]}>
                    💰 Submit Price
                  </Text>

                  {activeItem && (
                    <>
                      <View
                        style={[
                          styles.modalInfoBox,
                          { borderColor: resolvedBorderColor },
                        ]}
                      >
                        <Text
                          style={[styles.modalInfoTitle, { color: resolvedTextColor }]}
                        >
                          {activeItem.item}
                        </Text>
                        <Text
                          style={[styles.modalInfoSub, { color: resolvedSubTextColor }]}
                        >
                          {activeItem.code} · {activeItem.quantity} {activeItem.uom}
                        </Text>
                      </View>

                      <View style={styles.fieldRow}>
                        <View style={styles.fieldCol}>
                          <Text style={[styles.fieldLabel, { color: resolvedTextColor }]}>
                            Unit Price (ETB) *
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                color: resolvedTextColor,
                                borderColor: resolvedBorderColor,
                              },
                            ]}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={resolvedSubTextColor}
                            value={activeDraft.unitPrice}
                            onChangeText={(t) =>
                              updateDraft(activeItem.id, { unitPrice: t })
                            }
                            editable={!submitting}
                          />
                        </View>

                        <View style={styles.fieldCol}>
                          <Text style={[styles.fieldLabel, { color: resolvedTextColor }]}>
                            Total Price (ETB)
                          </Text>
                          <View
                            style={[
                              styles.input,
                              styles.computedInline,
                              { borderColor: resolvedBorderColor },
                            ]}
                          >
                            <Text
                              style={[
                                styles.computedInlineText,
                                { color: resolvedTextColor },
                              ]}
                            >
                              {activeTotal.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.fieldRow}>
                        <View style={styles.fieldCol}>
                          <Text style={[styles.fieldLabel, { color: resolvedTextColor }]}>
                            Discount (ETB)
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              {
                                color: resolvedTextColor,
                                borderColor: resolvedBorderColor,
                              },
                            ]}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={resolvedSubTextColor}
                            value={activeDraft.discount}
                            onChangeText={(t) =>
                              updateDraft(activeItem.id, { discount: t })
                            }
                            editable={!submitting}
                          />
                        </View>

                        <View style={styles.fieldCol}>
                          <Text style={[styles.fieldLabel, { color: resolvedTextColor }]}>
                            Final Price (ETB)
                          </Text>
                          <View
                            style={[
                              styles.input,
                              styles.finalInline,
                              { borderColor: '#10B981' },
                            ]}
                          >
                            <Text style={styles.finalInlineText}>
                              {activeFinal.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: resolvedTextColor, marginTop: 14 },
                        ]}
                      >
                        Does this match the specification? *
                      </Text>
                      <View style={styles.radioRow}>
                        <TouchableOpacity
                          style={[
                            styles.radioBtn,
                            {
                              borderColor:
                                activeDraft.matchesRequirement === true
                                  ? '#10B981'
                                  : resolvedBorderColor,
                              backgroundColor:
                                activeDraft.matchesRequirement === true
                                  ? '#10B98115'
                                  : 'transparent',
                            },
                          ]}
                          onPress={() =>
                            updateDraft(activeItem.id, { matchesRequirement: true })
                          }
                          activeOpacity={0.85}
                          disabled={submitting}
                        >
                          <Text
                            style={[
                              styles.radioText,
                              {
                                color:
                                  activeDraft.matchesRequirement === true
                                    ? '#10B981'
                                    : resolvedSubTextColor,
                              },
                            ]}
                          >
                            ✅ Yes — Match
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.radioBtn,
                            {
                              borderColor:
                                activeDraft.matchesRequirement === false
                                  ? '#EF4444'
                                  : resolvedBorderColor,
                              backgroundColor:
                                activeDraft.matchesRequirement === false
                                  ? '#EF444415'
                                  : 'transparent',
                            },
                          ]}
                          onPress={() =>
                            updateDraft(activeItem.id, { matchesRequirement: false })
                          }
                          activeOpacity={0.85}
                          disabled={submitting}
                        >
                          <Text
                            style={[
                              styles.radioText,
                              {
                                color:
                                  activeDraft.matchesRequirement === false
                                    ? '#EF4444'
                                    : resolvedSubTextColor,
                              },
                            ]}
                          >
                            ❌ No — Different
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {activeDraft.matchesRequirement === false && (
                        <>
                          <Text
                            style={[
                              styles.fieldLabel,
                              { color: resolvedTextColor, marginTop: 12 },
                            ]}
                          >
                            What's different? *
                          </Text>
                          <TextInput
                            style={[
                              styles.textarea,
                              {
                                color: resolvedTextColor,
                                borderColor: resolvedBorderColor,
                              },
                            ]}
                            multiline
                            numberOfLines={2}
                            placeholder="Explain why it doesn't match the spec..."
                            placeholderTextColor={resolvedSubTextColor}
                            value={activeDraft.remark}
                            onChangeText={(t) =>
                              updateDraft(activeItem.id, { remark: t })
                            }
                            editable={!submitting}
                          />
                        </>
                      )}

                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: resolvedTextColor, marginTop: 12 },
                        ]}
                      >
                        Additional Notes
                      </Text>
                      <TextInput
                        style={[
                          styles.textarea,
                          {
                            color: resolvedTextColor,
                            borderColor: resolvedBorderColor,
                          },
                        ]}
                        multiline
                        numberOfLines={2}
                        placeholder="Optional notes..."
                        placeholderTextColor={resolvedSubTextColor}
                        value={activeDraft.notes}
                        onChangeText={(t) =>
                          updateDraft(activeItem.id, { notes: t })
                        }
                        editable={!submitting}
                      />
                    </>
                  )}
                </ScrollView>

                <View style={[styles.modalFooter, { borderColor: resolvedBorderColor }]}>
                  <TouchableOpacity
                    style={[
                      styles.modalCancelBtn,
                      { borderColor: resolvedBorderColor },
                    ]}
                    onPress={closeBidModal}
                    activeOpacity={0.85}
                    disabled={submitting}
                  >
                    <Text style={[styles.modalCancelText, { color: resolvedTextColor }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalSubmitBtn,
                      {
                        backgroundColor: activeValid && !submitting
                          ? '#10B981'
                          : '#94A3B8',
                      },
                    ]}
                    onPress={() => activeItem && submitPriceFor(activeItem)}
                    disabled={!activeValid || submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSubmitText}>📤 Submit Price</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ==================== FULL-SCREEN ZOOMABLE DOC VIEWER ==================== */}
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
}

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  detailContainer: { flex: 1 },

  content: { flex: 1 },
  contentContainer: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

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
    gap: 12,
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

  itemBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  itemName: { fontSize: 14, fontWeight: '800' },
  itemMeta: { fontSize: 12, marginTop: 3 },
  priceChip: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceChipText: { color: '#10B981', fontSize: 11, fontWeight: '800' },
  submitBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { fontSize: 13, fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  modalInfoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  modalInfoTitle: { fontSize: 14, fontWeight: '800' },
  modalInfoSub: { fontSize: 12, marginTop: 3 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  fieldCol: { flex: 1 },
  computedInline: {
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  computedInlineText: {
    fontSize: 14,
    fontWeight: '700',
  },
  finalInline: {
    justifyContent: 'center',
    backgroundColor: '#10B98115',
    borderWidth: 2,
  },
  finalInlineText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10B981',
  },

  radioRow: { flexDirection: 'row', gap: 10 },
  radioBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  radioText: { fontSize: 12, fontWeight: '800' },

  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    marginTop: 6,
    borderTopWidth: 1,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 13, fontWeight: '700' },
  modalSubmitBtn: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

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

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14 },
});