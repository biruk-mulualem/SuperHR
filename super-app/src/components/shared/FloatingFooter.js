// super-app/src/components/FloatingFooter.js
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export default function FloatingFooter({ activeTab, setActiveTab, darkMode }) {
  const footerBg = darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.85)';
  const borderColor = darkMode ? '#334155' : 'rgba(226, 232, 240, 0.8)';
  const unselectedColor = darkMode ? '#94A3B8' : '#64748B';
  const selectedColor = darkMode ? '#93C5FD' : '#1E3A8A';

  return (
    <View style={styles.floatingNavContainer} pointerEvents="box-none">
      <View style={[styles.navBar, { backgroundColor: footerBg, borderColor }]}>

        {/* Posts Tab */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('posts')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'posts' && styles.activeIcon,
              { opacity: activeTab === 'posts' ? 1 : 0.6 },
            ]}
          >
            💬
          </Text>
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
});