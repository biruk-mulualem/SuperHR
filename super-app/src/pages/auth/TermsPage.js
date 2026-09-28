import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';

// ================================================================
// CONTENT
// ================================================================

const sections = [
  {
    title: '1. What This App Is',
    body:
      'SUPER APP is a digital logistics and inventory platform for managing Super Fiber water tanker products — from 200L domestic units up to 25,000L industrial assets. It gives authenticated crew members a single place to browse configurations, verify client records, review field updates, and receive operational alerts.',
  },
  {
    title: '2. Who It Is For',
    body:
      'The platform is used by admins, managers, sales staff, purchasers, and field crew. Each role sees a tailored experience: managers review and approve submissions, sales and purchasers submit requests and manage the catalog, and crew receive updates and notifications in real time.',
  },
];

const features = [
  {
    title: 'Authentication & Roles',
    items: [
      'Secure sign-in with assigned credentials',
      'Role-based access — Admin, Manager, Sales, Purchaser, Member',
      'Session management with automatic expiry',
      'Profile and settings per user',
    ],
  },
  {
    title: 'Catalog & Purchasing',
    items: [
      'Browse products from 200L to 25,000L',
      'Search, filter, and view product details',
      'Submit purchase requests',
      'Manager approval workflow with notes',
      'Approval history on every request',
    ],
  },
  {
    title: 'Posts & Groups',
    items: [
      'Create groups with name and description',
      'Add, remove, and manage members',
      'Owner-controlled activate / deactivate / delete',
      'Create posts with title, body, and up to 10 images',
      'Status flow: Pending → Approved / Declined',
      'Comments with author avatars and timestamps',
      'Search and filter posts by status or #number',
      'Mark posts as read, unread indicators',
    ],
  },
  {
    title: 'Media & Files',
    items: [
      'Multi-select image picker (up to 10 at once)',
      'In-app image viewer — pinch zoom, double-tap, drag',
      'Draw and sign directly on images',
      'Document picker and file sharing',
      'Save downloads to your device library',
    ],
  },
  {
    title: 'Notifications & Alerts',
    items: [
      'Real-time in-app notifications',
      'Push notifications with custom icon',
      'Unread badge counts across modules',
      'Alerts for approvals, rejections, and messages',
    ],
  },
  {
    title: 'Design & Experience',
    items: [
      'Light and dark mode with synced preferences',
      'Consistent layout across every screen',
      'Keyboard-aware modals and inputs',
      'Safe-area aware for notches and gesture bars',
      'Pull-to-refresh and infinite scroll',
    ],
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Sign in securely',
    body:
      'Use your assigned credentials to authenticate. Sessions are encrypted and expire automatically after a period of inactivity to protect company data.',
  },
  {
    step: '02',
    title: 'Browse and act',
    body:
      'Navigate between catalog, purchase, notifications, posts, and profile. Each action you take — adding items, submitting a purchase, updating a profile — is logged and reflected across the workspace in real time.',
  },
  {
    step: '03',
    title: 'Managers review',
    body:
      'Purchase requests, posts, and important updates are routed to managers for approval. You will see the status of each submission update automatically as reviewers act on it.',
  },
  {
    step: '04',
    title: 'Stay informed',
    body:
      'In-app notifications alert you when something needs your attention — an approval, a rejection, a new message, or a system update. Alerts are delivered in real time.',
  },
];

const responsibilities = [
  {
    title: 'Keep credentials private',
    body:
      'Never share your username, password, or session with anyone. Report lost or compromised access to your administrator immediately.',
  },
  {
    title: 'Use accurate data',
    body:
      'Enter truthful information about products, quantities, and clients. Mistakes in submissions can disrupt inventory, logistics, and billing.',
  },
  {
    title: 'Respect company property',
    body:
      'The app, its data, and its content belong to the organisation. Do not extract, copy, or redistribute company information outside approved workflows.',
  },
  {
    title: 'Report issues promptly',
    body:
      'If you notice a bug, incorrect record, or suspicious activity, notify your manager or IT support right away so it can be resolved quickly.',
  },
  {
    title: 'Follow local policy',
    body:
      "Your use of the app is also governed by your organisation's internal policies — attendance, safety, privacy, and code of conduct.",
  },
];

// ================================================================
// COMPONENT
// ================================================================

export default function TermsPage({ onClose }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>LEGAL</Text>
          <Text style={styles.heroTitle}>Welcome to SUPER APP</Text>
          <Text style={styles.heroSub}>
            Please read these terms carefully before continuing to use the platform.
          </Text>
        </View>

        {/* About sections */}
        {sections.map((s, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}

        {/* App Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. App Features</Text>
          <Text style={styles.cardBody}>
            A quick tour of what you can do inside SUPER APP.
          </Text>

          <View style={styles.featureGroups}>
            {features.map((group, gi) => (
              <View
                key={group.title}
                style={[
                  styles.featureGroup,
                  gi !== features.length - 1 && styles.featureGroupDivider,
                ]}
              >
                <Text style={styles.featureGroupTitle}>{group.title}</Text>
                {group.items.map((item, ii) => (
                  <View key={ii} style={styles.featureRow}>
                    <View style={styles.featureDot} />
                    <Text style={styles.featureText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. How It Works</Text>
          <Text style={styles.cardBody}>
            A short walkthrough of what happens from the moment you sign in.
          </Text>

          <View style={styles.stepsWrap}>
            {howItWorks.map((s, i) => (
              <View
                key={s.step}
                style={[
                  styles.stepRow,
                  i !== howItWorks.length - 1 && styles.stepDivider,
                ]}
              >
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{s.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepBody}>{s.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Responsibilities */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>5. Your Responsibilities</Text>
          <Text style={styles.cardBody}>
            By using SUPER APP you agree to the following:
          </Text>

          <View style={styles.responsibilitiesWrap}>
            {responsibilities.map((r) => (
              <View key={r.title} style={styles.respRow}>
                <View style={styles.respBullet}>
                  <Text style={styles.respBulletText}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.respTitle}>{r.title}</Text>
                  <Text style={styles.respBody}>{r.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Continued use of the platform constitutes acceptance of these terms.
        </Text>
      </ScrollView>

      {/* Accept button */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptBtnText}>I Understand & Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
    minWidth: 64,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  headerSpacer: {
    minWidth: 64,
  },

  /* Scroll content */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },

  /* Hero */
  hero: {
    marginBottom: 20,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  heroSub: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 8,
    lineHeight: 19,
  },

  /* Cards */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  cardBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#475569',
  },

  /* App Features */
  featureGroups: {
    marginTop: 14,
  },
  featureGroup: {
    paddingVertical: 12,
  },
  featureGroupDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  featureGroupTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#6D28D9',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 7,
  },
  featureText: {
    flex: 1,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },

  /* Steps (How it works) */
  stepsWrap: {
    marginTop: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  stepBody: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  /* Responsibilities */
  responsibilitiesWrap: {
    marginTop: 12,
    gap: 12,
  },
  respRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  respBullet: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  respBulletText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#059669',
  },
  respTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  respBody: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  /* Footer note */
  footerNote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 12,
    lineHeight: 16,
  },

  /* Bottom accept bar */
  footerBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  acceptBtn: {
    backgroundColor: '#1E3A8A',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});