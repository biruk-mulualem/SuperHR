// index.js
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

// Manager sub-dashboards (drill-ins from ManagerDashboard)
import ManagerPurchaseDashboard from '../pages/dashboard/roles/manager/ManagerPurchaseDashboard';
import ManagerStoreDashboard from '../pages/dashboard/roles/manager/ManagerStoreDashboard';
import ManagerHRDashboard from '../pages/dashboard/roles/manager/ManagerHRDashboard';
import ManagerFinanceDashboard from '../pages/dashboard/roles/manager/ManagerFinanceDashboard';

// Store pages
import StoresListPage from '../pages/stores/StoresListPage';
import ItemsListPage from '../pages/stores/ItemsListPage';
import BalanceAuditPage from '../pages/stores/BalanceAuditPage';
import LowStockAlertsPage from '../pages/stores/LowStockAlertsPage';

// Posts pages  ← NEW
import PostsPage from '../pages/posts/PostsPage';
// NOTE: GroupDetailPage is imported by PostsPage directly when a group is
// opened. We do NOT import it here because it lazily loads expo-av and other
// native modules, and eager-loading it at app boot crashes Expo Go.
// Auth service + hook
import authService from '../stores/authService';
import { useAuth } from '../hooks/useAuth';
import { setUnauthorizedHandler } from '../stores/interceptor';

// ================================================================
// MASTER ENTERPRISE PERMISSION CONFIGURATION MATRIX
// ================================================================
const ROLE_PERMISSIONS = {
  admin:               { catalog: true,  alerts: true,  purchase: true  },
  administrator:       { catalog: true,  alerts: true,  purchase: true  },
  superadmin:          { catalog: true,  alerts: true,  purchase: true  },
  manager:             { catalog: true,  alerts: true,  purchase: true  },
  supervisor:          { catalog: true,  alerts: true,  purchase: true  },
  purchaser:           { catalog: true,  alerts: true,  purchase: true  },
  purchasing_checkers: { catalog: true,  alerts: true,  purchase: true  },
  sales:               { catalog: true,  alerts: true,  purchase: false },
  banker:              { catalog: false, alerts: true,  purchase: false },
  auditor:             { catalog: true,  alerts: false, purchase: false },
  storekeeper:         { catalog: true,  alerts: true,  purchase: false },
  store_it:            { catalog: true,  alerts: true,  purchase: false },
  checker:             { catalog: true,  alerts: true,  purchase: false },
  finance:             { catalog: true,  alerts: true,  purchase: false },
  hr:                  { catalog: true,  alerts: true,  purchase: false },
  employee:            { catalog: true,  alerts: true,  purchase: false },
  attendance:          { catalog: false, alerts: true,  purchase: false },
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
  const [purchaseReturnTo, setPurchaseReturnTo] = useState(null);

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
      setPurchaseReturnTo(null);
    });
  }, []);

  // ================================================================
  // 3) Hardware Back Navigation Interceptor
  // ================================================================
  useEffect(() => {
    const handleHardwareBackPress = () => {
      if (!isLoggedIn) return false;

      // ---------- Pending detail page ----------
      if (activeTab === 'pendingDetail') {
        setPendingOrder(null);
        setActiveTab('purchase');
        setPurchaseSubView('pendingApproval');
        return true;
      }

      // ---------- Inside a purchase sub-page ----------
      if (activeTab === 'purchase' && purchaseSubView !== null) {
        if (purchaseReturnTo === 'managerDashboard') {
          setPurchaseSubView('purchaseDashboard');
          setActiveTab('managerDashboard');
          setPurchaseReturnTo(null);
        } else {
          setPurchaseSubView(null);
          setActiveTab('home');
        }
        return true;
      }

      // ---------- Inside a manager drill-in ----------
      if (activeTab === 'managerDashboard' && purchaseSubView !== null) {
        if (
          purchaseSubView === 'storesList' ||
          purchaseSubView === 'inventory' ||
          purchaseSubView === 'storeDetail' ||
          purchaseSubView === 'balanceAudit' ||
          purchaseSubView === 'lowStock' ||
          purchaseSubView === 'transfers'
        ) {
          setPurchaseSubView('storeDashboard');
          return true;
        }
        setPurchaseSubView(null);
        setActiveTab('home');
        return true;
      }

      // ---------- Settings branch ----------
      if (activeTab === 'settings' && settingsSubView !== 'main') {
        setSettingsSubView('main');
        return true;
      }

      // ---------- Any other non-home tab ----------
      if (activeTab !== 'home') {
        setActiveTab('home');
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
        setPurchaseReturnTo(null);
        return true;
      }

      return false;
    };

    const sub = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBackPress
    );

    return () => sub.remove();
  }, [
    isLoggedIn,
    activeTab,
    settingsSubView,
    purchaseSubView,
    pendingOrder,
    purchaseReturnTo,
  ]);

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
      setPurchaseReturnTo(null);
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
  const navigateToPurchasePage = (page, returnTo = null) => {
    setPurchaseReturnTo(returnTo);
    setPurchaseSubView(page);
    setActiveTab('purchase');
  };

  const navigateToManagerDashboard = (sectionKey) => {
    setPurchaseSubView(sectionKey);
    setActiveTab('managerDashboard');
  };

  const navigateToPendingDetail = (screen, payload) => {
    const orderData = payload ?? screen;
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

    // ---------- Manager sub-dashboards (drill-ins) ----------
    if (activeTab === 'managerDashboard') {
      const commonProps = {
        onNavigateToPurchase: (page) =>
          navigateToPurchasePage(page, 'managerDashboard'),
        onNavigateToManagerDashboard: (section) =>
          navigateToManagerDashboard(section),
        darkMode,
        textColor,
        subTextColor,
        cardBg,
        borderColor,
      };

      switch (purchaseSubView) {
        case 'purchaseDashboard':
          return <ManagerPurchaseDashboard {...commonProps} />;
        case 'storeDashboard':
          return <ManagerStoreDashboard {...commonProps} />;
        case 'hrDashboard':
          return <ManagerHRDashboard {...commonProps} />;
        case 'financeDashboard':
          return <ManagerFinanceDashboard {...commonProps} />;

        case 'storesList':
          return (
            <StoresListPage
              onNavigateToDetail={(store) => {
                console.log('Open store detail:', store);
              }}
              darkMode={darkMode}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          );

        case 'inventory':
          return (
            <ItemsListPage
              onNavigateToDetail={(item) => {
                console.log('Open item detail:', item);
              }}
              darkMode={darkMode}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          );

        case 'balanceAudit':
          return (
            <BalanceAuditPage
              onNavigateToStoreDetail={(store) => {
                console.log('Open store detail:', store);
              }}
              darkMode={darkMode}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          );

        case 'lowStock':
          return (
            <LowStockAlertsPage
              onNavigateToItemDetail={(item) => {
                console.log('Open item detail:', item);
              }}
              darkMode={darkMode}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          );

        case 'storeDetail':
        case 'transfers':
          return <ManagerStoreDashboard {...commonProps} />;

        default:
          return <ManagerPurchaseDashboard {...commonProps} />;
      }
    }

    // ---------- Purchase sub-pages ----------
    if (activeTab === 'purchase' && purchaseSubView !== null) {
      const commonProps = {
        onBack: () => {
          if (purchaseReturnTo === 'managerDashboard') {
            setPurchaseSubView('purchaseDashboard');
            setActiveTab('managerDashboard');
            setPurchaseReturnTo(null);
          } else {
            setPurchaseSubView(null);
            setActiveTab('home');
          }
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
        return (
          <DashboardPage
            darkMode={darkMode}
            setActiveTab={setActiveTab}
            userRole={userRole}
            permissions={ROLE_PERMISSIONS[userRole]}
            onNavigateToPurchase={navigateToPurchasePage}
            onNavigateToManagerDashboard={navigateToManagerDashboard}
            textColor={textColor}
            subTextColor={subTextColor}
            cardBg={cardBg}
            borderColor={borderColor}
          />
        );

      // ---------- Posts tab  ← NEW ----------
      case 'posts':
        return (
          <PostsPage
            darkMode={darkMode}
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
              onNavigateToManagerDashboard={navigateToManagerDashboard}
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
            onNavigateToManagerDashboard={navigateToManagerDashboard}
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
          onLoginSuccess={() => {
            setActiveTab('home');
            setSettingsSubView('main');
            setPurchaseSubView(null);
            setPendingOrder(null);
            setPurchaseReturnTo(null);
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
        setPurchaseReturnTo(null);
      }}
      onNavigateToProfile={() => {
        setActiveTab('profile');
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
        setPurchaseReturnTo(null);
      }}
      onNavigateToSettings={() => {
        setActiveTab('settings');
        setSettingsSubView('main');
        setPurchaseSubView(null);
        setPendingOrder(null);
        setPurchaseReturnTo(null);
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
        setPurchaseReturnTo(null);
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