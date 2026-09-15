import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const NOTIFICATIONS = [
  { id: '1', title: '🚚 New Order Assigned', desc: '5,000L Fiber Tanker delivery dispatched to Bole.', time: '5 mins ago' },
  { id: '2', title: '✅ Payment Verified', desc: 'Invoice payment for 10,000L Mega Storage completed.', time: '2 hours ago' },
  { id: '3', title: '⚠️ Low Stock Warning', desc: '25,000L Maxi Industrial Tanks are running low in the warehouse.', time: 'Yesterday' },
];

export default function NotificationPage({ darkMode }) {
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardBg = darkMode ? '#1E293B' : '#FFFFFF';
  const titleColor = darkMode ? '#93C5FD' : '#1E3A8A';

  return (
    <View style={styles.container}>
      <Text style={[styles.pageTitle, { color: titleColor }]}>Notifications</Text>
      
      {/* 🌟 FIXED: Swapped out FlatList for a clean .map rendering block */}
      {/* This removes the nested vertical list conflict inside MainLayout completely */}
      {NOTIFICATIONS.map((item) => (
        <View key={item.id} style={[styles.notifCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.notifTitle, { color: textColor }]}>{item.title}</Text>
          <Text style={[styles.notifDesc, { color: subTextColor }]}>{item.desc}</Text>
          <Text style={[styles.notifTime, { color: darkMode ? '#64748B' : '#94A3B8' }]}>{item.time}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
  },
  pageTitle: { 
    fontSize: 20, 
    fontWeight: '750', 
    marginBottom: 16 
  },
  notifCard: { 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  notifTitle: { 
    fontSize: 16, 
    fontWeight: '700' 
  },
  notifDesc: { 
    fontSize: 14, 
    marginTop: 4 
  },
  notifTime: { 
    fontSize: 11, 
    marginTop: 8, 
    textAlign: 'right' 
  },
});
