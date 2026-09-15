import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  Switch,
  TouchableWithoutFeedback 
} from 'react-native';

export default function Header({ 
  onLogout, 
  onNavigateToProfile, 
  onNavigateToSettings, 
  onNavigateToNotifications, 
  onNavigateToCatalog, 
  darkMode,
  setDarkMode,
  permissions,
  userRole,
  onNavigateToPurchase
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const headerBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderBottomColor = darkMode ? '#334155' : '#E2E8F0';
  const titleColor = darkMode ? '#FFFFFF' : '#1E3A8A';
  const notifBtnBg = darkMode ? '#334155' : '#F1F5F9';

  const modalBgColor = darkMode ? '#1E293B' : '#FFFFFF';
  const modalTextColor = darkMode ? '#F1F5F9' : '#1E293B';
  const modalSubTextColor = darkMode ? '#94A3B8' : '#64748B';
  const modalBorderColor = darkMode ? '#334155' : '#F1F5F9';

  // Check if user is manager
  const isManager = userRole === 'manager';

  // Purchase navigation items - only visible to manager, listed like profile
  const purchaseNavItems = [
    { 
      id: 'totalRequests', 
      label: 'Total Requests', 
      emoji: '📋', 
      page: 'totalRequests'
    },
    { 
      id: 'pendingApproval', 
      label: 'Pending Approval', 
      emoji: '⏳', 
      page: 'pendingApproval'
    },
    { 
      id: 'approvedNotPaid', 
      label: 'Approved Not Paid', 
      emoji: '✅', 
      page: 'approvedNotPaid'
    },
    { 
      id: 'paidNotArrived', 
      label: 'Paid Not Arrived', 
      emoji: '💳', 
      page: 'paidNotArrived'
    },
  ];

  return (
    <View style={[styles.headerWrapper, { backgroundColor: headerBg, borderBottomColor }]}>
      <View style={styles.headerContainer}>
        
        <View style={styles.brandGroup}>
          <Text style={[styles.companyName, { color: titleColor }]}>SUPER APP</Text>
        </View>

        <View style={styles.actionGroup}>
          
          {/* Notification icon maps dynamically if the active role contains alerts tokens */}
          {permissions?.alerts && (
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: notifBtnBg }]} 
              onPress={onNavigateToNotifications}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiIcon}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.avatarButton} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
            <Text style={styles.avatarInitials}>FR</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* ================= CLEAN ROUTING MENU SHEET ================= */}
      <Modal
        animationType="slide" 
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: modalBgColor }]}>
                <View style={[styles.modalAccentBar, { backgroundColor: darkMode ? '#334155' : '#E2E8F0' }]} />

                <Text style={[styles.panelTitle, { color: modalTextColor }]}>Navigation Menu</Text>

                {setDarkMode && (
                  <View style={[styles.toggleMenuRow, { borderColor: modalBorderColor }]}>
                    <Text style={[styles.toggleLabel, { color: modalTextColor }]}>🌙 Night Vision Mode</Text>
                    <Switch
                      trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
                      thumbColor={darkMode ? '#F8FAFC' : '#F1F5F9'}
                      onValueChange={(value) => setDarkMode(value)}
                      value={darkMode}
                    />
                  </View>
                )}

                <View style={styles.linksContainer}>
                  
                  {/* Profile Dashboard link */}
                  <TouchableOpacity 
                    style={[styles.menuLinkRow, { borderBottomColor: modalBorderColor }]}
                    onPress={() => {
                      setModalVisible(false);
                      if (onNavigateToProfile) onNavigateToProfile();
                    }}
                  >
                    <Text style={styles.linkEmoji}>👤</Text>
                    <Text style={[styles.linkText, { color: modalTextColor }]}>Profile Dashboard</Text>
                  </TouchableOpacity>

                  {/* Purchase Section - Listed like profile items, only visible to Manager */}
                  {isManager && (
                    <>
                      {purchaseNavItems.map((item) => (
                        <TouchableOpacity 
                          key={item.id}
                          style={[styles.menuLinkRow, { borderBottomColor: modalBorderColor }]}
                          onPress={() => {
                            setModalVisible(false);
                            if (onNavigateToPurchase) {
                              onNavigateToPurchase(item.page);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.linkEmoji}>{item.emoji}</Text>
                          <Text style={[styles.linkText, { color: modalTextColor }]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  {/* Tanker Catalog link - checks layout clearances matrix */}
                  {permissions?.catalog && (
                    <TouchableOpacity 
                      style={[styles.menuLinkRow, { borderBottomColor: modalBorderColor }]}
                      onPress={() => {
                        setModalVisible(false);
                        if (onNavigateToCatalog) onNavigateToCatalog();
                      }}
                    >
                      <Text style={styles.linkEmoji}>🚰</Text>
                      <Text style={[styles.linkText, { color: modalTextColor }]}>Tanker Catalog</Text>
                    </TouchableOpacity>
                  )}

                  {/* General Settings link */}
                  <TouchableOpacity 
                    style={[styles.menuLinkRow, { borderBottomColor: modalBorderColor }]}
                    onPress={() => {
                      setModalVisible(false);
                      if (onNavigateToSettings) onNavigateToSettings();
                    }}
                  >
                    <Text style={styles.linkEmoji}>⚙️</Text>
                    <Text style={[styles.linkText, { color: modalTextColor }]}>App Settings</Text>
                  </TouchableOpacity>

                  {/* System Alerts link */}
                  {permissions?.alerts && (
                    <TouchableOpacity 
                      style={[styles.menuLinkRow, { borderBottomColor: modalBorderColor }]}
                      onPress={() => {
                        setModalVisible(false);
                        if (onNavigateToNotifications) onNavigateToNotifications();
                      }}
                    >
                      <Text style={styles.linkEmoji}>🔔</Text>
                      <Text style={[styles.linkText, { color: modalTextColor }]}>System Alerts</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={[styles.menuLinkRow, styles.logoutBorderRow]} onPress={() => { setModalVisible(false); if (onLogout) onLogout(); }}>
                    <Text style={styles.linkEmoji}>🚪</Text>
                    <Text style={[styles.linkText, { color: '#EF4444', fontWeight: '700' }]}>Log Out Securely</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.closeButton, { backgroundColor: darkMode ? '#334155' : '#F1F5F9' }]} onPress={() => setModalVisible(false)}>
                  <Text style={[styles.closeButtonText, { color: modalSubTextColor }]}>Close Panel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: { borderBottomWidth: 1 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  companyName: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emojiIcon: { fontSize: 18 },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#F97316', borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  avatarButton: { width: 40, height: 40, backgroundColor: '#0284C7', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 34, elevation: 24 },
  modalAccentBar: { width: 50, height: 5, borderRadius: 2.5, alignSelf: 'center', marginBottom: 16 },
  panelTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 16, letterSpacing: 0.3 },
  toggleMenuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '700' },
  
  linksContainer: { marginBottom: 20 },
  menuLinkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  logoutBorderRow: { borderBottomWidth: 0, marginTop: 4 },
  linkEmoji: { fontSize: 18, marginRight: 14 },
  linkText: { fontSize: 15, fontWeight: '600' },
  closeButton: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeButtonText: { fontSize: 14, fontWeight: '700' },
});