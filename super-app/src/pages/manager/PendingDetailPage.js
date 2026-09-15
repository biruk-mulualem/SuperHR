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
  Share 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Demo order data with multiple items
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
  totalAmount: 3200.00,
  reason: 'Urgent replacement for production line equipment. The current pipes and pumps are worn out and need immediate replacement to maintain production efficiency.',
  imageUrl: 'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop',
  items: [
    {
      id: 1,
      item: 'Steel Pipe 2 inch',
      code: 'SP-002',
      quantity: 50,
      uom: 'PCS',
      amount: 1200.00,
      bids: [
        { employee: 'Selam Tesfaye', unitPrice: 25.00, date: '2026-09-04', notes: 'Available in 3 days' },
        { employee: 'Mekonnen Alemu', unitPrice: 23.60, date: '2026-09-03', notes: 'In stock, ready for delivery' },
        { employee: 'Tigist Hailu', unitPrice: 26.00, date: '2026-09-02', notes: 'Premium quality' },
        { employee: 'Dawit Solomon', unitPrice: 23.00, date: '2026-09-01', notes: 'Bulk discount available' },
      ]
    },
    {
      id: 2,
      item: 'Industrial Paint',
      code: 'IP-100',
      quantity: 30,
      uom: 'LTR',
      amount: 450.00,
      bids: [
        { employee: 'Abebe Kebede', unitPrice: 15.33, date: '2026-09-04', notes: 'Premium quality' },
        { employee: 'Tigist Hailu', unitPrice: 14.67, date: '2026-09-03', notes: 'Fast delivery' },
        { employee: 'Meron Ayele', unitPrice: 15.67, date: '2026-09-02', notes: 'Available now' },
        { employee: 'Fikru Tsegaye', unitPrice: 14.33, date: '2026-09-01', notes: 'Wholesale price' },
      ]
    },
    {
      id: 3,
      item: 'Hydraulic Pump',
      code: 'HP-500',
      quantity: 2,
      uom: 'SET',
      amount: 1550.00,
      bids: [
        { employee: 'Dawit Solomon', unitPrice: 775.00, date: '2026-09-04', notes: 'In stock' },
        { employee: 'Meron Ayele', unitPrice: 750.00, date: '2026-09-03', notes: 'Available in 2 days' },
        { employee: 'Selam Tesfaye', unitPrice: 800.00, date: '2026-09-02', notes: 'Premium quality' },
        { employee: 'Mekonnen Alemu', unitPrice: 740.00, date: '2026-09-01', notes: 'Best price' },
      ]
    },
    {
      id: 4,
      item: 'Conveyor Belt 10m',
      code: 'CB-010',
      quantity: 3,
      uom: 'ROLL',
      amount: 2400.00,
      bids: [
        { employee: 'Tigist Hailu', unitPrice: 816.67, date: '2026-09-04', notes: 'Available' },
        { employee: 'Mekonnen Alemu', unitPrice: 793.33, date: '2026-09-03', notes: 'In stock' },
        { employee: 'Meron Ayele', unitPrice: 833.33, date: '2026-09-02', notes: 'Premium material' },
      ]
    },
    {
      id: 5,
      item: 'Electrical Cable 100m',
      code: 'EC-100',
      quantity: 5,
      uom: 'ROLL',
      amount: 750.00,
      bids: [
        { employee: 'Dawit Solomon', unitPrice: 152.00, date: '2026-09-04', notes: 'Available' },
        { employee: 'Selam Tesfaye', unitPrice: 148.00, date: '2026-09-03', notes: 'In stock' },
      ]
    }
  ]
};

const PendingDetailPage = ({ 
  onBack, 
  order, 
  darkMode, 
  textColor, 
  subTextColor, 
  cardBg, 
  borderColor 
}) => {
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  
  // Stored signature data
  const [signatureName, setSignatureName] = useState('Abebe Kebede');
  const [signatureTitle, setSignatureTitle] = useState('Operations Manager');

  // Load stored signature on component mount
  useEffect(() => {
    loadStoredSignature();
  }, []);

  // Load signature from AsyncStorage
  const loadStoredSignature = async () => {
    try {
      const savedSignature = await AsyncStorage.getItem('user_signature');
      if (savedSignature) {
        const parsed = JSON.parse(savedSignature);
        setSignatureName(parsed.name || 'Abebe Kebede');
        setSignatureTitle(parsed.title || 'Operations Manager');
      }
    } catch (error) {
      console.error('Error loading signature:', error);
    }
  };

  // Use demo data if no order is passed or order is invalid
  let data = order;
  if (!data || !data.items || data.items.length === 0) {
    data = DEMO_ORDER;
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const itemCount = items.length;

  const calculateFinalPrice = (bid, quantity) => {
    return (bid.unitPrice || 0) * quantity;
  };

  const getLowestBid = (bids, quantity) => {
    if (!bids || !Array.isArray(bids) || bids.length === 0) return null;
    return bids.reduce((min, bid) => {
      const minFinal = calculateFinalPrice(min, quantity);
      const currentFinal = calculateFinalPrice(bid, quantity);
      return currentFinal < minFinal ? bid : min;
    });
  };

  const getHighestBid = (bids, quantity) => {
    if (!bids || !Array.isArray(bids) || bids.length === 0) return null;
    return bids.reduce((max, bid) => {
      const maxFinal = calculateFinalPrice(max, quantity);
      const currentFinal = calculateFinalPrice(bid, quantity);
      return currentFinal > maxFinal ? bid : max;
    });
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0.00';
    return price.toFixed(2);
  };

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

  const calculateTotal = () => {
    let total = 0;
    if (items.length === 0) return 0;
    items.forEach(item => {
      const quantity = item.quantity || 1;
      const lowest = getLowestBid(item.bids, quantity);
      if (lowest) {
        total += calculateFinalPrice(lowest, quantity);
      } else {
        total += item.amount || 0;
      }
    });
    return total;
  };

  const totalAmount = calculateTotal();
  const imageUrl = data.imageUrl || 'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&h=600&fit=crop';

  // Handle signing with stored signature - stays in modal
  const handleSignWithStored = () => {
    setIsSigned(true);
    // Don't close modal, just update state
  };

  // Handle Decline
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
      [{ text: 'OK', onPress: onBack }]
    );
  };

  // Handle Approve - closes modal
  const handleApprove = () => {
    if (!isSigned) {
      Alert.alert('Signature Required', 'Please sign the document first');
      return;
    }
    setIsApproved(true);
    setApprovalModalVisible(false);
    Alert.alert(
      '✅ Order Approved',
      `Order "${data.requestNumber || 'N/A'}" has been approved successfully!\n\nTotal Amount: ETB ${formatPrice(totalAmount)}`,
      [{ text: 'OK', onPress: onBack }]
    );
  };

  // Share document
  const downloadSignedDocument = async () => {
    try {
      const shareOptions = {
        message: `Signed Document for Order ${data.requestNumber}\nTotal Amount: ETB ${formatPrice(totalAmount)}\nDate: ${new Date().toLocaleDateString()}`,
        title: `Signed Order ${data.requestNumber}`,
      };
      const result = await Share.share(shareOptions);
    } catch (error) {
      Alert.alert('Error', 'Failed to share document');
    }
  };

  // If no items, show a message
  if (itemCount === 0) {
    return (
      <View style={[styles.detailContainer, { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' }]}>
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateText, { color: subTextColor }]}>No items in this order</Text>
          <TouchableOpacity onPress={onBack} style={styles.backButtonLarge}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.detailContainer, { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Order Summary */}
        <View style={[styles.orderSummary, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderNumber, { color: textColor }]}>{data.requestNumber || 'N/A'}</Text>
              <Text style={[styles.orderId, { color: subTextColor }]}>{data.id || 'N/A'}</Text>
            </View>
            <View style={[styles.priorityBadgeLarge, { backgroundColor: getPriorityColor(data.priority) + '20' }]}>
              <Text style={[styles.priorityTextLarge, { color: getPriorityColor(data.priority) }]}>
                {data.priority || 'Normal'} Priority
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>Requester</Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>{data.requester || 'N/A'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>Department</Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>{data.department || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>Date</Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>{data.date || 'N/A'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>Items</Text>
              <Text style={[styles.summaryValue, { color: textColor }]}>{itemCount} items</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: subTextColor }]}>Total Amount</Text>
              <Text style={[styles.totalAmount, { color: '#10B981' }]}>ETB {formatPrice(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Document with Stored Signature - Centered */}
        <View style={[styles.imageSection, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>📄 Request Document</Text>
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
            
            {/* Stored Signature Overlay - Centered on Image */}
            {isSigned && (
              <View style={styles.signatureOverlay}>
                <View style={styles.signatureContainer}>
                  <Text style={styles.signatureNameText}>{signatureName}</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureTitleText}>{signatureTitle}</Text>
                  <Text style={styles.signatureDateText}>{new Date().toLocaleDateString()}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>Tap to view full image</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reason */}
        {data.reason && (
          <View style={[styles.reasonSection, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>📝 Request Reason</Text>
            <View style={styles.reasonContainer}>
              <Text style={[styles.reasonText, { color: textColor }]}>
                {data.reason}
              </Text>
            </View>
          </View>
        )}

        {/* Items with Price Comparison */}
        <Text style={[styles.itemsTitle, { color: textColor }]}>🛒 Items & Price Comparison</Text>
        
        {items.map((item, index) => {
          const quantity = item.quantity || 1;
          const lowestBid = getLowestBid(item.bids, quantity);
          const highestBid = getHighestBid(item.bids, quantity);
          const hasBids = item.bids && Array.isArray(item.bids) && item.bids.length > 0;
          const selectedFinalPrice = lowestBid ? calculateFinalPrice(lowestBid, quantity) : item.amount || 0;
          const isExpanded = expandedItem === item.id;
          const itemNumber = index + 1;

          return (
            <View key={item.id || index} style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}>
              <TouchableOpacity 
                style={styles.itemHeader}
                onPress={() => toggleExpandItem(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemTitleContainer}>
                  <Text style={[styles.itemNumber, { color: '#3B82F6' }]}>#{itemNumber}</Text>
                  <Text style={[styles.itemName, { color: textColor }]}>{item.item || 'Unknown Item'}</Text>
                  <Text style={[styles.itemCode, { color: subTextColor }]}>{item.code || 'N/A'}</Text>
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

              <View style={styles.selectedTotalRow}>
                <Text style={[styles.selectedTotalLabel, { color: subTextColor }]}>Selected Total:</Text>
                <Text style={[styles.selectedTotalValue, { color: '#10B981' }]}>
                  ETB {formatPrice(selectedFinalPrice)}
                </Text>
                {lowestBid && (
                  <Text style={[styles.selectedBy, { color: subTextColor }]}>
                    (by {lowestBid.employee})
                  </Text>
                )}
              </View>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  {hasBids ? (
                    <>
                      <View style={styles.bidSummary}>
                        <View style={styles.bidMetric}>
                          <Text style={[styles.bidMetricLabel, { color: subTextColor }]}>Lowest</Text>
                          <Text style={[styles.bidMetricValue, { color: '#10B981' }]}>
                            ETB {formatPrice(calculateFinalPrice(lowestBid, quantity))}
                          </Text>
                          <Text style={[styles.bidMetricSub, { color: subTextColor }]}>
                            {lowestBid?.employee}
                          </Text>
                        </View>
                        <View style={styles.bidMetric}>
                          <Text style={[styles.bidMetricLabel, { color: subTextColor }]}>Highest</Text>
                          <Text style={[styles.bidMetricValue, { color: '#EF4444' }]}>
                            ETB {formatPrice(calculateFinalPrice(highestBid, quantity))}
                          </Text>
                          <Text style={[styles.bidMetricSub, { color: subTextColor }]}>
                            {highestBid?.employee}
                          </Text>
                        </View>
                        <View style={styles.bidMetric}>
                          <Text style={[styles.bidMetricLabel, { color: subTextColor }]}>Selected</Text>
                          <Text style={[styles.bidMetricValue, { color: '#8B5CF6' }]}>
                            ETB {formatPrice(selectedFinalPrice)}
                          </Text>
                          <Text style={[styles.bidMetricSub, { color: subTextColor }]}>🏆 Winner</Text>
                        </View>
                      </View>

                      <View style={styles.bidderList}>
                        <Text style={[styles.bidderListTitle, { color: subTextColor }]}>All Bids:</Text>
                        {item.bids.map((bid, bidIndex) => {
                          const finalPrice = calculateFinalPrice(bid, quantity);
                          const isLowest = bid === lowestBid;
                          const isHighest = bid === highestBid && bid !== lowestBid;

                          return (
                            <View key={bidIndex} style={[styles.bidderItem, { borderColor: borderColor }]}>
                              <View style={styles.bidderInfo}>
                                <Text style={[styles.bidderName, { color: textColor }]}>{bid.employee || 'N/A'}</Text>
                                {bid.notes && (
                                  <Text style={[styles.bidderNotes, { color: subTextColor }]}>{bid.notes}</Text>
                                )}
                                {bid.date && (
                                  <Text style={[styles.bidderDate, { color: subTextColor }]}>📅 {bid.date}</Text>
                                )}
                              </View>
                              <View style={styles.bidderPriceContainer}>
                                <Text style={[styles.bidderPrice, { 
                                  color: isLowest ? '#10B981' : 
                                         isHighest ? '#EF4444' : '#3B82F6' 
                                }]}>
                                  ETB {formatPrice(finalPrice)}
                                </Text>
                                {isLowest && (
                                  <View style={styles.winnerBadge}>
                                    <Text style={styles.winnerBadgeText}>🏆 Lowest</Text>
                                  </View>
                                )}
                                {isHighest && (
                                  <View style={[styles.winnerBadge, { backgroundColor: '#EF444420' }]}>
                                    <Text style={[styles.winnerBadgeText, { color: '#EF4444' }]}>📈 Highest</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <View style={styles.noBidsContainer}>
                      <Text style={[styles.noBidsText, { color: subTextColor }]}>No bids submitted yet</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Grand Total */}
        <View style={[styles.grandTotalCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.grandTotalLabel, { color: textColor }]}>💰 Grand Total</Text>
          <Text style={[styles.grandTotalValue, { color: '#10B981' }]}>ETB {formatPrice(totalAmount)}</Text>
          <Text style={[styles.grandTotalSub, { color: subTextColor }]}>
            Total of all selected lowest bids
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!isApproved && !isDeclined && (
            <>
              <TouchableOpacity 
                style={[styles.declineButton, { borderColor: '#EF4444' }]}
                onPress={() => setDeclineModalVisible(true)}
              >
                <Text style={[styles.declineButtonText, { color: '#EF4444' }]}>❌ Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.approveButton, { backgroundColor: isSigned ? '#10B981' : '#94A3B8' }]}
                onPress={() => setApprovalModalVisible(true)}
                disabled={isApproved}
              >
                <Text style={styles.approveButtonText}>
                  {isApproved ? '✅ Approved' : '✅ Approve'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {isApproved && (
            <TouchableOpacity 
              style={[styles.downloadButton, { backgroundColor: '#3B82F6' }]}
              onPress={downloadSignedDocument}
            >
              <Text style={styles.downloadButtonText}>📤 Share Document</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Approval Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={approvalModalVisible}
        onRequestClose={() => setApprovalModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setApprovalModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' }]}>
                <View style={[styles.modalAccentBar, { backgroundColor: darkMode ? '#334155' : '#E2E8F0' }]} />

                <Text style={[styles.modalTitle, { color: textColor }]}>
                  {isSigned ? '✅ Signed' : '📋 Sign & Approve'}
                </Text>

                {/* Document Preview */}
                <View style={styles.modalImageContainer}>
                  <Image 
                    source={{ uri: imageUrl }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  
                  {/* Signature Preview - Centered */}
                  {isSigned && (
                    <View style={styles.modalSignatureOverlay}>
                      <View style={styles.modalSignatureContainer}>
                        <Text style={styles.modalSignatureName}>{signatureName}</Text>
                        <View style={styles.modalSignatureLine} />
                        <Text style={styles.modalSignatureTitle}>{signatureTitle}</Text>
                        <Text style={styles.modalSignatureDate}>{new Date().toLocaleDateString()}</Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.modalImageOverlay}>
                    <Text style={styles.modalImageText}>
                      {isSigned ? '✓ Signed' : 'Preview - Click Sign to apply'}
                    </Text>
                  </View>
                </View>

                {/* Order Info */}
                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalInfoRow}>
                    <Text style={[styles.modalInfoLabel, { color: subTextColor }]}>Order</Text>
                    <Text style={[styles.modalInfoValue, { color: textColor }]}>{data.requestNumber}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={[styles.modalInfoLabel, { color: subTextColor }]}>Total</Text>
                    <Text style={[styles.modalInfoValue, { color: '#10B981' }]}>ETB {formatPrice(totalAmount)}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={[styles.modalInfoLabel, { color: subTextColor }]}>Items</Text>
                    <Text style={[styles.modalInfoValue, { color: textColor }]}>{itemCount} items</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActionContainer}>
                  {!isSigned ? (
                    <TouchableOpacity 
                      style={[styles.modalSignButton, { backgroundColor: '#8B5CF6' }]}
                      onPress={handleSignWithStored}
                    >
                      <Text style={styles.modalSignButtonText}>✍️ Sign</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.modalSignedBadge}>
                      <Text style={styles.modalSignedBadgeText}>✅ Signed</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={[styles.modalApproveButton, { backgroundColor: isSigned ? '#10B981' : '#94A3B8' }]}
                    onPress={handleApprove}
                    disabled={!isSigned}
                  >
                    <Text style={styles.modalApproveButtonText}>✅ Approve</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.modalCloseButton, { backgroundColor: darkMode ? '#334155' : '#F1F5F9' }]} 
                  onPress={() => setApprovalModalVisible(false)}
                >
                  <Text style={[styles.modalCloseButtonText, { color: subTextColor }]}>Cancel</Text>
                </TouchableOpacity>
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
              <View style={[styles.modalCard, { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' }]}>
                <View style={[styles.modalAccentBar, { backgroundColor: darkMode ? '#334155' : '#E2E8F0' }]} />

                <Text style={[styles.modalTitle, { color: textColor }]}>❌ Decline Order</Text>

                <View style={styles.modalInfoContainer}>
                  <View style={styles.modalInfoRow}>
                    <Text style={[styles.modalInfoLabel, { color: subTextColor }]}>Order</Text>
                    <Text style={[styles.modalInfoValue, { color: textColor }]}>{data.requestNumber}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={[styles.modalInfoLabel, { color: subTextColor }]}>Total</Text>
                    <Text style={[styles.modalInfoValue, { color: '#10B981' }]}>ETB {formatPrice(totalAmount)}</Text>
                  </View>
                </View>

                <View style={styles.modalSignatureInputContainer}>
                  <Text style={[styles.modalSignatureLabel, { color: textColor }]}>Reason for declining *</Text>
                  <TextInput
                    style={[styles.modalSignatureInput, { 
                      backgroundColor: darkMode ? '#0F172A' : '#F8FAFC',
                      borderColor: borderColor,
                      color: textColor,
                      minHeight: 80,
                      textAlignVertical: 'top',
                    }]}
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
                    style={[styles.modalDeclineButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleDecline}
                  >
                    <Text style={styles.modalDeclineButtonText}>❌ Confirm Decline</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.modalCloseButton, { backgroundColor: darkMode ? '#334155' : '#F1F5F9' }]} 
                  onPress={() => setDeclineModalVisible(false)}
                >
                  <Text style={[styles.modalCloseButtonText, { color: subTextColor }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageVisible(false)}
      >
        <View style={styles.fullImageContainer}>
          <TouchableOpacity 
            style={styles.fullImageClose}
            onPress={() => setFullImageVisible(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.fullImageCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
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

  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  backButtonLarge: {
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
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
  signatureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureContainer: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E40AF',
    minWidth: 200,
  },
  signatureNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E40AF',
    fontFamily: Platform.OS === 'ios' ? 'Zapfino' : 'cursive',
  },
  signatureLine: {
    width: 120,
    height: 2,
    backgroundColor: '#1E40AF',
    marginVertical: 6,
  },
  signatureTitleText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  signatureDateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
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

  // Items
  itemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
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
  itemNumber: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 30,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemCode: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  itemHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQuantity: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  itemQtyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  selectedTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  selectedTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  selectedBy: {
    fontSize: 11,
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bidSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  bidMetric: {
    alignItems: 'center',
    flex: 1,
  },
  bidMetricLabel: {
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  bidMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bidMetricSub: {
    fontSize: 9,
    marginTop: 1,
  },
  bidderList: {
    marginTop: 4,
  },
  bidderListTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  bidderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 13,
    fontWeight: '500',
  },
  bidderNotes: {
    fontSize: 11,
    marginTop: 1,
  },
  bidderDate: {
    fontSize: 10,
    marginTop: 1,
  },
  bidderPriceContainer: {
    alignItems: 'flex-end',
  },
  bidderPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  winnerBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  winnerBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10B981',
  },
  noBidsContainer: {
    padding: 12,
    alignItems: 'center',
  },
  noBidsText: {
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Grand Total
  grandTotalCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  grandTotalValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  grandTotalSub: {
    fontSize: 12,
    marginTop: 4,
  },

  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
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
  downloadButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButtonText: {
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
  modalImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  modalImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
  },
  modalImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    alignItems: 'center',
  },
  modalImageText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  modalSignatureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSignatureContainer: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E40AF',
    minWidth: 160,
  },
  modalSignatureName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E40AF',
    fontFamily: Platform.OS === 'ios' ? 'Zapfino' : 'cursive',
  },
  modalSignatureLine: {
    width: 100,
    height: 2,
    backgroundColor: '#1E40AF',
    marginVertical: 4,
  },
  modalSignatureTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  modalSignatureDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalInfoContainer: {
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  modalActionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modalSignButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSignButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalSignedBadge: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSignedBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
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
  fullImage: {
    width: width,
    height: height * 0.8,
  },
});

export default PendingDetailPage;