// AppRouter.js
import React, { useState, useEffect } from 'react';
import { BackHandler, LogBox, View, ActivityIndicator } from 'react-native';

// Suppress specific warnings
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'SafeAreaView has been deprecated',
]);

// Layouts
import MainLayout from '../layouts/MainLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';

// Dashboard Pages
import DashboardPage from '../pages/dashboard/DashboardPage';

// Main Pages
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import NotificationPage from '../pages/notification/NotificationPage';

// Settings branch views
import PreferencesPage from '../pages/settings/subpages/PreferencesPage';
import SystemInfoPage from '../pages/settings/subpages/SystemInfoPage';
import SecurityPage from '../pages/settings/subpages/SecurityPage';

// Purchase Pages (manager)
import TotalRequestsPage from '../pages/manager/TotalRequestsPage';
import PendingApprovalPage from '../pages/manager/PendingApprovalPage';
import ApprovedNotPaidPage from '../pages/manager/ApprovedNotPaidPage';

// Pending Detail Page
import PendingDetailPage from '../pages/manager/PendingDetailPage';

// Purchaser pages
import PendingSubmissionPage from '../pages/purchaser/PendingSubmissionPage';
import SubmittedPage from '../pages/purchaser/SubmittedPage';

// 🔥 Auth service + hook
import authService from '../stores/authService';
import { useAuth } from '../hooks/useAuth';
import { setUnauthorizedHandler } from '../stores/interceptor';

// ================================================================
// MASTER ENTERPRISE PERMISSION CONFIGURATION MATRIX
// ================================================================
const ROLE_PERMISSIONS = {
  admin:      { catalog: true,  alerts: true,  purchase: true  },
  manager:    { catalog: true,  alerts: true,  purchase: true  },
  purchaser:  { catalog: true,  alerts: true,  purchase: true  }, // 🔔 now shown
  sales:      { catalog: true,  alerts: true,  purchase: false },
  banker:     { catalog: false, alerts: true,  purchase: false },
  supervisor: { catalog: true,  alerts: true,  purchase: true  },
  auditor:    { catalog: true,  alerts: false, purchase: false },
};

export default function AppRouter() {
  // ---------- Auth (single source of truth) ----------
  const auth = useAuth();

  // ---------- Local UI state ----------
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState('main');
  const [purchaseSubView, setPurchaseSubView] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);

  // ---------- Derived from auth ----------
  const isLoggedIn = auth.isAuthenticated;
  const userRole = (auth.userRole || 'sales').toLowerCase();

  // ================================================================
  // 1) BOOT: initialize auth service from AsyncStorage
  // ================================================================
  useEffect(() => {
    (async () => {
      try {
        await authService.init();
      } catch (e) {
        console.warn('Auth init failed:', e);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // ================================================================
  // 2) Register global 401 handler
  // ================================================================
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setActiveTab('home');
      setSettingsSubView('main');
      setPurchaseSubView(null);
      setPendingOrder(null);
    });
  }, []);

  // ================================================================
  // 3) Hardware Back Navigation Interceptor
  // ================================================================
  useEffect(() => {
    const handleHardwareBackPress = () => {
      if (!isLoggedIn) return false;

      if (activeTab === 'pendingDetail') {
        setPendingOrder(null);
        setActiveTab('purchase');
        setPurchaseSubView('pendingApproval');
        return true;
      }

      if (purchaseSubView !== null) {
        setPurchaseSubView(null);
        setActiveTab('home');
        return true;
      }

      if (activeTab === 'settings' && settingsSubView !== 'main') {
        setSettingsSubView('main');
        return true;
      }

      if (activeTab !== 'home') {
        setActiveTab('home');
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
        return true;
      }

      return false;
    };

    const sub = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBackPress
    );

    return () => sub.remove();
  }, [isLoggedIn, activeTab, settingsSubView, purchaseSubView, pendingOrder]);

  // ================================================================
  // 4) Logout handler
  // ================================================================
  const logoutHandler = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout failed:', e);
    } finally {
      setActiveTab('home');
      setDarkMode(false);
      setSettingsSubView('main');
      setPurchaseSubView(null);
      setPendingOrder(null);
    }
  };

  // ================================================================
  // 5) Access control helper
  // ================================================================
  const hasAccess = (permissionKey) => {
    return ROLE_PERMISSIONS[userRole]?.[permissionKey] ?? false;
  };

  // ================================================================
  // 6) Navigation helpers
  // ================================================================
  const navigateToPurchasePage = (page) => {
    setPurchaseSubView(page);
    setActiveTab('purchase');
  };

const navigateToPendingDetail = (screen, payload) => {
  // We're called as navigateToPendingDetail('pendingDetail', { id, requestNumber })
  const orderData = payload ?? screen;   // handle both calling conventions
  setPendingOrder(orderData);
  setActiveTab('pendingDetail');
};

  // ================================================================
  // 7) Theme tokens
  // ================================================================
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';

  // ================================================================
  // 8) Page content renderer
  // ================================================================
  const renderPageContent = () => {
    // ---------- Pending Detail Page ----------
    if (activeTab === 'pendingDetail' && pendingOrder) {
      return (
        <PendingDetailPage
          onBack={() => {
            setPendingOrder(null);
            setActiveTab('purchase');
            setPurchaseSubView('pendingApproval');
          }}
          order={pendingOrder}
          darkMode={darkMode}
          textColor={textColor}
          subTextColor={subTextColor}
          cardBg={cardBg}
          borderColor={borderColor}
        />
      );
    }

    // ---------- Purchase sub-pages ----------
    if (activeTab === 'purchase' && purchaseSubView !== null) {
      const commonProps = {
        onBack: () => {
          setPurchaseSubView(null);
          setActiveTab('home');
        },
        darkMode,
        textColor,
        subTextColor,
        cardBg,
        borderColor,
        onNavigateToDetail: navigateToPendingDetail,
      };

      switch (purchaseSubView) {
        case 'totalRequests':
          return <TotalRequestsPage {...commonProps} />;
        case 'pendingApproval':
          return <PendingApprovalPage {...commonProps} />;
        case 'approvedNotPaid':
          return <ApprovedNotPaidPage {...commonProps} />;

        // ✅ Purchaser pages
        case 'pendingSubmission':
          return <PendingSubmissionPage {...commonProps} />;
        case 'submitted':
          return <SubmittedPage {...commonProps} />;

        default:
          return <TotalRequestsPage {...commonProps} />;
      }
    }

    // ---------- Main tabs ----------
    switch (activeTab) {
      case 'home':
        // ✅ DashboardPage handles role dispatch internally
        return (
          <DashboardPage
            darkMode={darkMode}
            setActiveTab={setActiveTab}
            userRole={userRole}
            permissions={ROLE_PERMISSIONS[userRole]}
            onNavigateToPurchase={navigateToPurchasePage}
            textColor={textColor}
            subTextColor={subTextColor}
            cardBg={cardBg}
            borderColor={borderColor}
          />
        );

      case 'profile':
        return <ProfilePage darkMode={darkMode} userRole={userRole} />;

      case 'notification':
        if (!hasAccess('alerts')) {
          alert(
            `🛡️ Access Denied: The '${userRole}' role does not hold Alert Clearance.`
          );
          setActiveTab('home');
          return (
            <DashboardPage
              darkMode={darkMode}
              setActiveTab={setActiveTab}
              userRole={userRole}
              permissions={ROLE_PERMISSIONS[userRole]}
              onNavigateToPurchase={navigateToPurchasePage}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          );
        }
        return <NotificationPage darkMode={darkMode} />;

      case 'settings':
        switch (settingsSubView) {
          case 'pref':
            return (
              <PreferencesPage darkMode={darkMode} setDarkMode={setDarkMode} />
            );
          case 'sys':
            return <SystemInfoPage darkMode={darkMode} />;
          case 'sec':
            return <SecurityPage darkMode={darkMode} />;
          case 'main':
          default:
            return (
              <SettingsPage
                darkMode={darkMode}
                onLogout={logoutHandler}
                setSubView={setSettingsSubView}
                userRole={userRole}
                permissions={{
                  ...ROLE_PERMISSIONS[userRole],
                  security: true,
                  systemInfo: true,
                }}
              />
            );
        }

      default:
        return (
          <DashboardPage
            darkMode={darkMode}
            setActiveTab={setActiveTab}
            userRole={userRole}
            permissions={ROLE_PERMISSIONS[userRole]}
            onNavigateToPurchase={navigateToPurchasePage}
            textColor={textColor}
            subTextColor={subTextColor}
            cardBg={cardBg}
            borderColor={borderColor}
          />
        );
    }
  };

  // ================================================================
  // 9) BOOTING SPLASH
  // ================================================================
  if (booting) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  // ================================================================
  // 10) NOT LOGGED IN → Login Page
  // ================================================================
  if (!isLoggedIn) {
    return (
      <MainLayout
        showHeader={false}
        darkMode={darkMode}
        userRole={userRole}
        onNavigateToPurchase={navigateToPurchasePage}
      >
        <LoginPage
          onLoginSuccess={(roleAssigned) => {
            setActiveTab('home');
            setSettingsSubView('main');
            setPurchaseSubView(null);
            setPendingOrder(null);
          }}
        />
      </MainLayout>
    );
  }

  // ================================================================
  // 11) LOGGED IN → Main App
  // ================================================================
  return (
    <MainLayout
      onLogout={logoutHandler}
      showHeader={true}
      activeTab={activeTab}
      setActiveTab={(tab) => {
        if (tab === 'notification' && !ROLE_PERMISSIONS[userRole]?.alerts) {
          alert(
            `🛡️ Access Denied: Your active role context lacks Alert clearance.`
          );
          return;
        }
        setActiveTab(tab);
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
      }}
      onNavigateToProfile={() => {
        setActiveTab('profile');
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
      }}
      onNavigateToSettings={() => {
        setActiveTab('settings');
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
      }}
      onNavigateToNotifications={() => {
        if (!ROLE_PERMISSIONS[userRole]?.alerts) {
          alert(`🛡️ Access Denied: Alert clearance tokens required.`);
          return;
        }
        setActiveTab('notification');
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
      }}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      permissions={{
        ...ROLE_PERMISSIONS[userRole],
        security: true,
        systemInfo: true,
      }}
      userRole={userRole}
      onNavigateToPurchase={navigateToPurchasePage}
    >
      {renderPageContent()}
    </MainLayout>
  );
}