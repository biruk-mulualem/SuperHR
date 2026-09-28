// super-app/src/components/shared/FloatingFooter.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import mobilePostsGroupService from '../../stores/mobilePostsGroupService';
import authService from '../../stores/authService';

const POLL_MS = 30000;

export default function FloatingFooter({ activeTab, setActiveTab, darkMode }) {
  const footerBg = darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.85)';
  const borderColor = darkMode ? '#334155' : 'rgba(226, 232, 240, 0.8)';
  const unselectedColor = darkMode ? '#94A3B8' : '#64748B';
  const selectedColor = darkMode ? '#93C5FD' : '#1E3A8A';

  // ── Pending approvals badge (sum across all active groups) ──
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const user = authService.user;
      if (!user?.userId) {
        if (!cancelled) setPendingApprovals(0);
        return;
      }
      try {
        const res = await mobilePostsGroupService.listGroups({
          filter: 'active',
          page: 1,
          limit: 100,
        });
        if (!cancelled && res?.success) {
          const total = (res.data?.items || []).reduce(
            (sum, g) => sum + (g.pendingCount || 0),
            0
          );
          setPendingApprovals(total);
        }
      } catch {
        // silent — tab bar polling should never crash the app
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <View style={styles.floatingNavContainer} pointerEvents="box-none">
      <View style={[styles.navBar, { backgroundColor: footerBg, borderColor }]}>

        {/* Posts Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('posts')}
          activeOpacity={0.7}
        >
          <View style={styles.navIconWrap}>
            <Text
              style={[
                styles.navIcon,
                activeTab === 'posts' && styles.activeIcon,
                { opacity: activeTab === 'posts' ? 1 : 0.6 },
              ]}
            >
              💬
            </Text>

            {pendingApprovals > 0 && (
              <View style={[styles.tabBadge, { borderColor: footerBg }]}>
                <Text style={styles.tabBadgeText}>
                  {pendingApprovals > 99 ? '99+' : pendingApprovals}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.navText,
              {
                color: activeTab === 'posts' ? selectedColor : unselectedColor,
                fontWeight: activeTab === 'posts' ? '700' : '500',
              },
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'profile' && styles.activeIcon,
              { opacity: activeTab === 'profile' ? 1 : 0.6 },
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.navText,
              {
                color: activeTab === 'profile' ? selectedColor : unselectedColor,
                fontWeight: activeTab === 'profile' ? '700' : '500',
              },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>

        {/* Settings Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'settings' && styles.activeIcon,
              { opacity: activeTab === 'settings' ? 1 : 0.6 },
            ]}
          >
            ⚙️
          </Text>
          <Text
            style={[
              styles.navText,
              {
                color: activeTab === 'settings' ? selectedColor : unselectedColor,
                fontWeight: activeTab === 'settings' ? '700' : '500',
              },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingNavContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIconWrap: {
    position: 'relative',
  },
  navIcon: {
    fontSize: 20,
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  navText: {
    fontSize: 11,
    marginTop: 2,
  },

  // ── Golden pending-approvals badge on the Posts icon ──
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -12,
    backgroundColor: '#F5C842',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  tabBadgeText: {
    color: '#7A5A00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});