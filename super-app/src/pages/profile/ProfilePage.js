import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

// የሁሉንም ተጠቃሚዎች የግል መረጃ እና የስራ ክፍላቸውን (Role) የያዘ ዳታቤዝ
const USER_PROFILES = {
  john_doe: {
    name: 'John Doe',
    title: 'System Administrator',
    role: 'Admin (Master Access)', // 🌟 አዲስ፡ የሲስተም ሮል መግለጫ
    id: 'EMP-2026-01',
    department: 'IT & Security Infrastructure',
    email: 'john_doe@superfiber.com',
    phone: '+251 900 11 22 33',
    joinedDate: 'Mar 2022',
    initials: 'JD',
    stats: { deliveries: 'Full', rating: '5.0', efficiency: '99%' }
  },
  flynn_rider: {
    name: 'Flynn Rider',
    title: 'Senior Distribution Lead',
    role: 'Sales Representative', // 🌟 አዲስ፡ የሲስተም ሮል መግለጫ
    id: 'EMP-2026-99',
    department: 'Logistics & Supply Chain',
    email: 'flynn_rider@superfiber.com',
    phone: '+251 911 23 45 67',
    joinedDate: 'Jan 2024',
    initials: 'FR',
    stats: { deliveries: '142', rating: '4.9', efficiency: '96%' }
  },
  sam_purchaser: {
    name: 'Sam Purchaser',
    title: 'Procurement Specialist',
    role: 'Purchaser', // 🌟 አዲስ፡ የሲስተም ሮል መግለጫ
    id: 'EMP-2026-04',
    department: 'Purchasing & Inventory',
    email: 'sam_p@superfiber.com',
    phone: '+251 922 44 55 66',
    joinedDate: 'Jul 2023',
    initials: 'SP',
    stats: { deliveries: '94', rating: '4.7', efficiency: '91%' }
  },
  alex_manager: {
    name: 'Alex Manager',
    title: 'Operations Director',
    role: 'General Manager', // 🌟 አዲስ፡ የሲስተም ሮል መግለጫ
    id: 'EMP-2026-02',
    department: 'Corporate Management',
    email: 'alex_m@superfiber.com',
    phone: '+251 933 77 88 99',
    joinedDate: 'Nov 2021',
    initials: 'AM',
    stats: { deliveries: '310', rating: '4.8', efficiency: '95%' }
  },
  elena_auditor: {
    name: 'Elena Auditor',
    title: 'Financial Compliance Officer',
    role: 'Auditor', // 🌟 አዲስ፡ የሲስተም ሮል መግለጫ
    id: 'EMP-2026-07',
    department: 'Auditing & Finance',
    email: 'elena_a@superfiber.com',
    phone: '+251 944 22 33 44',
    joinedDate: 'May 2024',
    initials: 'EA',
    stats: { deliveries: 'Audit', rating: '4.9', efficiency: '98%' }
  }
};

export default function ProfilePage({ darkMode, userRole }) {
  // በጨለማ ሁነታ ላይ ተመስርቶ ቀለማትን በዲናሚክ መንገድ መምረጥ
  const textColor = darkMode ? '#F1F5F9' : '#1E293B';
  const subTextColor = darkMode ? '#94A3B8' : '#64748B';
  const cardBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#334155' : '#E2E8F0';

  // የገባው ተጠቃሚ ስም በዳታቤዝ ውስጥ ከሌለ እንደ ፎልባክ 'flynn_rider'ን ይጭናል
  const activeProfileKey = userRole || 'flynn_rider';
  const employeeData = USER_PROFILES[activeProfileKey] || USER_PROFILES['flynn_rider'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* 1. የላይኛው ዋና የአቫታር እና የባጅ መግለጫ ካርድ ክፍል */}
      <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{employeeData.initials}</Text>
          <View style={styles.statusBadge} />
        </View>
        <Text style={[styles.nameText, { color: textColor }]}>{employeeData.name}</Text>
        <Text style={[styles.titleText, { color: subTextColor }]}>{employeeData.title}</Text>
        
        <View style={[styles.badgeContainer, { backgroundColor: darkMode ? '#0F172A' : '#F1F5F9' }]}>
          <Text style={[styles.badgeText, { color: darkMode ? '#93C5FD' : '#1E3A8A' }]}>
            {employeeData.id}
          </Text>
        </View>
      </View>

      {/* 2. የስራ አፈጻጸም መግለጫ ቁጥሮች (Quick Stats) */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.statNumber, { color: darkMode ? '#93C5FD' : '#1E3A8A' }]}>
            {employeeData.stats.deliveries}
          </Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Deliveries</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>
            {employeeData.stats.rating}
          </Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Rating</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
            {employeeData.stats.efficiency}
          </Text>
          <Text style={[styles.statLabel, { color: subTextColor }]}>Efficiency</Text>
        </View>
      </View>

      {/* 3. ዝርዝር የግል፣ የስራ እና የሮል (Role) መረጃዎች ክፍል */}
      <View style={[styles.detailsCard, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Detailed Information</Text>

        {/* 🌟 አዲስ መስመር፡ የሲስተም ሮል (Assigned Role) ማሳያ */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>Assigned Role</Text>
          <Text style={[styles.roleValueText, { color: darkMode ? '#93C5FD' : '#0284C7' }]}>
            {employeeData.role}
          </Text>
        </View>

        <View style={[styles.infoRow, { borderTopWidth: 1, borderColor, paddingTop: 12, marginTop: 12 }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>Department</Text>
          <Text style={[styles.infoValue, { color: textColor }]}>{employeeData.department}</Text>
        </View>

        <View style={[styles.infoRow, { borderTopWidth: 1, borderColor, paddingTop: 12, marginTop: 12 }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>Email Address</Text>
          <Text style={[styles.infoValue, { color: textColor }]}>{employeeData.email}</Text>
        </View>

        <View style={[styles.infoRow, { borderTopWidth: 1, borderColor, paddingTop: 12, marginTop: 12 }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>Phone Number</Text>
          <Text style={[styles.infoValue, { color: textColor }]}>{employeeData.phone}</Text>
        </View>

        <View style={[styles.infoRow, { borderTopWidth: 1, borderColor, paddingTop: 12, marginTop: 12 }]}>
          <Text style={[styles.infoLabel, { color: subTextColor }]}>Joined Date</Text>
          <Text style={[styles.infoValue, { color: textColor }]}>{employeeData.joinedDate}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#0284C7',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  statusBadge: {
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  badgeContainer: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleValueText: {
    fontSize: 14,
    fontWeight: '700',
  }
});
