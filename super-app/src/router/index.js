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
import ManagerDashboard from '../pages/dashboard/roles/ManagerDashboard';

// Main Pages
import CatalogPage from '../pages/catalog/CatalogPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import NotificationPage from '../pages/notification/NotificationPage';

// Settings branch views
import PreferencesPage from '../pages/settings/subpages/PreferencesPage';
import SystemInfoPage from '../pages/settings/subpages/SystemInfoPage';
import SecurityPage from '../pages/settings/subpages/SecurityPage';

// Purchase Pages - All in manager folder
import TotalRequestsPage from '../pages/manager/TotalRequestsPage';
import PendingApprovalPage from '../pages/manager/PendingApprovalPage';
import ApprovedNotPaidPage from '../pages/manager/ApprovedNotPaidPage';
import PaidNotArrivedPage from '../pages/manager/PaidNotArrivedPage';

// Pending Detail Page
import PendingDetailPage from '../pages/manager/PendingDetailPage';

// 🔥 Auth service + hook
import authService from '../stores/authService';
import { useAuth } from '../hooks/useAuth';
import { setUnauthorizedHandler } from '../stores/interceptor';

// MASTER ENTERPRISE PERMISSION CONFIGURATION MATRIX
const ROLE_PERMISSIONS = {
  admin:      { catalog: true,  alerts: true,  purchase: true  },
  manager:    { catalog: true,  alerts: true,  purchase: true  },
  purchaser:  { catalog: true,  alerts: false, purchase: true  },
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
  const userRole = auth.userRole || 'sales';

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
  //    Any API call that returns 401 will trigger this
  // ================================================================
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // authService already cleared the storage in the interceptor.
      // Just reset local navigation state.
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
  // 4) Logout handler (uses authService so token is cleared properly)
  // ================================================================
  const logoutHandler = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout failed:', e);
    } finally {
      // Reset all local UI state
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

  const navigateToPendingDetail = (orderData) => {
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

    // ---------- Purchase detail pages ----------
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
        case 'paidNotArrived':
          return <PaidNotArrivedPage {...commonProps} />;
        default:
          return <TotalRequestsPage {...commonProps} />;
      }
    }

    // ---------- Main tabs ----------
    switch (activeTab) {
      case 'home':
        if (userRole === 'manager') {
          return (
            <ManagerDashboard
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
        return (
          <DashboardPage
            darkMode={darkMode}
            setActiveTab={setActiveTab}
            userRole={userRole}
            permissions={ROLE_PERMISSIONS[userRole]}
            onNavigateToPurchase={navigateToPurchasePage}
          />
        );

      case 'catalog':
        if (!hasAccess('catalog')) {
          alert(`🛡️ Access Denied: The '${userRole}' role cannot view the Product Catalog.`);
          setActiveTab('home');
          return (
            <DashboardPage
              darkMode={darkMode}
              setActiveTab={setActiveTab}
              userRole={userRole}
              permissions={ROLE_PERMISSIONS[userRole]}
              onNavigateToPurchase={navigateToPurchasePage}
            />
          );
        }
        return <CatalogPage darkMode={darkMode} />;

      case 'profile':
        return <ProfilePage darkMode={darkMode} userRole={userRole} />;

      case 'notification':
        if (!hasAccess('alerts')) {
          alert(`🛡️ Access Denied: The '${userRole}' role does not hold Alert Clearance.`);
          setActiveTab('home');
          return (
            <DashboardPage
              darkMode={darkMode}
              setActiveTab={setActiveTab}
              userRole={userRole}
              permissions={ROLE_PERMISSIONS[userRole]}
              onNavigateToPurchase={navigateToPurchasePage}
            />
          );
        }
        return <NotificationPage darkMode={darkMode} />;

      case 'settings':
        switch (settingsSubView) {
          case 'pref':
            return <PreferencesPage darkMode={darkMode} setDarkMode={setDarkMode} />;
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
          onLoginSuccess={(roleAssigned /* , userId */) => {
            // authService has already:
            //   - stored the token + user in AsyncStorage
            //   - set user / token internally
            //   - triggered a `_notify()`, which our `useAuth()` hook
            //     reacts to, flipping isAuthenticated → true
            //
            // So we don't need to set role / isLoggedIn here — it's
            // already reflected through the hook. We only reset the
            // local navigation state so we land on the correct first
            // screen.
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
        if (tab === 'catalog' && !ROLE_PERMISSIONS[userRole]?.catalog) {
          alert(`🛡️ Access Denied: Your active role context lacks Catalog clearance.`);
          return;
        }
        if (tab === 'notification' && !ROLE_PERMISSIONS[userRole]?.alerts) {
          alert(`🛡️ Access Denied: Your active role context lacks Alert clearance.`);
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
      onNavigateToCatalog={() => {
        if (!ROLE_PERMISSIONS[userRole]?.catalog) {
          alert(`🛡️ Access Denied: Catalog clearance tokens required.`);
          return;
        }
        setActiveTab('catalog');
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