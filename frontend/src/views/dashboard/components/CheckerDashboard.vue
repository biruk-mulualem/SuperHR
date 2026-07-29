<!-- views/dashboard/CheckerDashboard.vue -->
<template>
  <div class="analytics-dashboard">
    <!-- ==================== HEADER ==================== -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5" />
            <rect x="2" y="7" width="20" height="10" rx="1" />
          </svg>
        </div>
        <div>
          <h1>📊 Analytics Dashboard</h1>
          <p>Inventory & Audit Performance Overview</p>
        </div>
      </div>
      <div class="header-right">
        <div class="date-display">
          <span class="date-icon">📅</span>
          <span class="date-text">{{ currentDate }}</span>
        </div>
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span v-else class="spinner-small"></span>
          <span class="btn-text">{{ loading ? 'Loading...' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics data...</p>
    </div>

    <!-- ==================== ERROR ==================== -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>Error Loading Data</h3>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="loadDashboardData">Retry</button>
    </div>

    <template v-else>
      <!-- ============================================================ -->
      <!-- SECTION: THREE MAIN CARDS                                     -->
      <!-- ============================================================ -->
      <div class="main-cards-grid">
        
        <!-- CARD 1: Total Items Card -->
        <div class="main-card">
          <div class="main-card-header">
            <div class="main-card-icon blue">
              <span>📦</span>
            </div>
            <div class="main-card-title-group">
              <h3>Total Items</h3>
              <span class="main-card-subtitle">Item master data health</span>
            </div>
          </div>
          <div class="main-card-body">
            <div class="main-stat-value">{{ formatNumber(inventoryStats.totalItems) }}</div>
            <div class="main-stat-label">Total Items in System</div>
            
            <!-- Sub Data: Active & Inactive -->
            <div class="sub-data-grid">
              <div class="sub-data-item">
                <div class="sub-data-dot active"></div>
                <div class="sub-data-content">
                  <span class="sub-data-label">Active</span>
                  <span class="sub-data-value">{{ formatNumber(inventoryStats.activeItems) }}</span>
                  <span class="sub-data-percent">{{ getPercent(inventoryStats.activeItems, inventoryStats.totalItems) }}%</span>
                </div>
              </div>
              <div class="sub-data-item">
                <div class="sub-data-dot inactive"></div>
                <div class="sub-data-content">
                  <span class="sub-data-label">Inactive</span>
                  <span class="sub-data-value">{{ formatNumber(inventoryStats.inactiveItems) }}</span>
                  <span class="sub-data-percent">{{ getPercent(inventoryStats.inactiveItems, inventoryStats.totalItems) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 2: Missing Data Card -->
     
<div class="main-card">
  <div class="main-card-header">
    <div class="main-card-icon orange">
      <span>⚠️</span>
    </div>
    <div class="main-card-title-group">
      <h3>Missing Data</h3>
      <span class="main-card-subtitle">Items needing attention</span>
    </div>
  </div>
  <div class="main-card-body">
    <div class="main-stat-value">{{ formatNumber(138 + 184 - 13) }}</div>
    <div class="main-stat-label">Items with Missing Data</div>
    
    <!-- Sub Data: Missing Cost & Conversion Issues -->
    <div class="sub-data-grid two-items">
      <div class="sub-data-item">
        <div class="sub-data-dot cost"></div>
        <div class="sub-data-content">
          <span class="sub-data-label">Missing Cost</span>
          <span class="sub-data-value">{{ formatNumber(138) }}</span>
          <span class="sub-data-percent">5.3%</span>
        </div>
      </div>
      <div class="sub-data-item">
        <div class="sub-data-dot conversion-merged"></div>
        <div class="sub-data-content">
          <span class="sub-data-label">Conversion Issues</span>
          <span class="sub-data-value">{{ formatNumber(184) }}</span>
          <span class="sub-data-percent">7.1%</span>
        </div>
      </div>
    </div>
    
   
  </div>
</div>

        <!-- CARD 3: Total Stores Card -->
        <div class="main-card">
          <div class="main-card-header">
            <div class="main-card-icon purple">
              <span>🏪</span>
            </div>
            <div class="main-card-title-group">
              <h3>Total Stores</h3>
              <span class="main-card-subtitle">Store reconciliation status</span>
            </div>
          </div>
          <div class="main-card-body">
            <div class="main-stat-value">{{ formatNumber(auditStats.totalStores) }}</div>
            <div class="main-stat-label">Active Stores</div>
            
            <!-- Sub Data: Conflict, Date Diff -->
            <div class="sub-data-grid two-items">
              <div class="sub-data-item">
                <div class="sub-data-dot conflict"></div>
                <div class="sub-data-content">
                  <span class="sub-data-label">Conflict</span>
                  <span class="sub-data-value">{{ formatNumber(auditStats.conflicts) }}</span>
                  <span class="sub-data-percent">{{ getPercent(auditStats.conflicts, auditStats.totalItems) }}%</span>
                </div>
              </div>
              <div class="sub-data-item">
                <div class="sub-data-dot date-diff"></div>
                <div class="sub-data-content">
                  <span class="sub-data-label">Date Diff</span>
                  <span class="sub-data-value">{{ formatNumber(auditStats.dateDiffs) }}</span>
                  <span class="sub-data-percent">{{ getPercent(auditStats.dateDiffs, auditStats.totalItems) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ============================================================ -->
      <!-- SECTION: STORE CONFLICT CHART (Horizontal Bar Chart)         -->
      <!-- ============================================================ -->
      <div class="section-title">
        <div class="section-title-left">
          <h2>🏪 Stores with Most Conflicts</h2>
          <span class="section-subtitle">Sorted by conflict count (highest to lowest)</span>
        </div>
      </div>

      <div class="section-card">
        <div v-if="storeConflictData.length === 0" class="empty-state-small">
          No store data available
        </div>
        <div v-else class="conflict-chart">
          <div 
            v-for="store in sortedByConflicts" 
            :key="store.name" 
            class="conflict-bar-row"
          >
            <div class="conflict-bar-label">
              <span class="store-name">{{ store.name }}</span>
              <!-- <span class="store-conflict-count">{{ store.conflicts }}</span> -->
            </div>
            <div class="conflict-bar-track">
              <div 
                class="conflict-bar-fill" 
                :style="{ 
                  width: getConflictPercentage(store.conflicts) + '%',
                  background: getConflictColor(store.conflicts)
                }"
              >
                <span class="conflict-bar-value">{{ store.conflicts }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- SECTION: TOP ISSUES - LIMITED TO 10 EACH                     -->
      <!-- ============================================================ -->
      <div class="section-title">
        <div class="section-title-left">
          <h2>⚠️ Top Issues</h2>
          <span class="section-subtitle">Top 10 items needing immediate attention</span>
        </div>
      </div>

      <div class="issues-grid">
        <div class="section-card">
          <div class="section-header">
            <h3>🚨 Top Conflicts</h3>
            <span class="badge danger">{{ topConflicts.length }}</span>
          </div>
          <div class="issues-list">
            <div v-if="topConflicts.length === 0" class="empty-state-small">✅ No conflicts</div>
            <div v-for="(item, index) in topConflicts" :key="index" class="issue-item conflict">
              <span class="issue-rank">{{ index + 1 }}</span>
              <span class="issue-code">{{ item.code }}</span>
              <span class="issue-name">{{ item.name }}</span>
              <span class="issue-store">{{ item.store }}</span>
              <span class="issue-value">Diff: {{ item.diff }}</span>
            </div>
          </div>
        </div>
        <div class="section-card">
          <div class="section-header">
            <h3>📅 Date Differences</h3>
            <span class="badge purple">{{ topDateDiffs.length }}</span>
          </div>
          <div class="issues-list">
            <div v-if="topDateDiffs.length === 0" class="empty-state-small">✅ No date diffs</div>
            <div v-for="(item, index) in topDateDiffs" :key="index" class="issue-item date-diff">
              <span class="issue-rank">{{ index + 1 }}</span>
              <span class="issue-code">{{ item.code }}</span>
              <span class="issue-name">{{ item.name }}</span>
              <span class="issue-store">{{ item.store }}</span>
            
            </div>
          </div>
        </div>
      </div>

      <!-- Last Updated -->
      <div class="last-updated" v-if="lastUpdated">
        <span>🔄 Last updated: {{ formatDateTime(lastUpdated) }}</span>
      </div>
    </template>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import checkerDashboardService from '@/stores/checkerDashboardService'

// ================================================================
// STATE
// ================================================================

const loading = ref(true)
const error = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Dashboard data from API
const dashboardData = ref(null)

// ================================================================
// COMPUTED - Data from API
// ================================================================

const inventoryStats = computed(() => {
  return dashboardData.value?.inventoryStats || {
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    missingConversion: 0,
    missingCost: 0,
    healthyItems: 0
  }
})

const auditStats = computed(() => {
  return dashboardData.value?.auditStats || {
    totalStores: 0,
    totalItems: 0,
    matched: 0,
    conflicts: 0,
    dateDiffs: 0
  }
})

const storeConflictData = computed(() => {
  return dashboardData.value?.storeConflictData || []
})

const topConflicts = computed(() => {
  return dashboardData.value?.topConflicts || []
})

const topDateDiffs = computed(() => {
  return dashboardData.value?.topDateDiffs || []
})

const lastUpdated = computed(() => {
  return dashboardData.value?.summary?.lastUpdated || null
})

// ================================================================
// COMPUTED - UI Helpers
// ================================================================

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
})

// Sort stores by conflicts (highest to lowest)
const sortedByConflicts = computed(() => {
  return [...storeConflictData.value]
    .sort((a, b) => b.conflicts - a.conflicts)
})

// Get max conflicts for percentage calculation
const maxConflicts = computed(() => {
  if (sortedByConflicts.value.length === 0) return 0
  return sortedByConflicts.value[0].conflicts
})

// ================================================================
// METHODS
// ================================================================

/**
 * Load dashboard data from API
 */
const loadDashboardData = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('📊 Loading dashboard data...')
    const result = await checkerDashboardService.getDashboardSummary()
    
    if (result.success) {
      dashboardData.value = result.data
      console.log('✅ Dashboard data loaded:', dashboardData.value)
    } else {
      error.value = result.error || 'Failed to load dashboard data'
      showToastMessage(error.value, 'error')
    }
  } catch (err) {
    console.error('❌ Error loading dashboard:', err)
    error.value = err.message || 'Failed to load dashboard data'
    showToastMessage(error.value, 'error')
  } finally {
    loading.value = false
  }
}

/**
 * Refresh data
 */
const refreshData = async () => {
  try {
    loading.value = true
    const result = await checkerDashboardService.refreshDashboard()
    
    if (result.success) {
      showToastMessage('Data refreshed successfully!', 'success')
      await loadDashboardData()
    } else {
      showToastMessage(result.message || 'Failed to refresh data', 'error')
    }
  } catch (err) {
    console.error('❌ Error refreshing data:', err)
    showToastMessage('Failed to refresh data', 'error')
  } finally {
    loading.value = false
  }
}

/**
 * Format number with commas
 */
const formatNumber = (value) => {
  if (!value && value !== 0) return '0'
  return value.toLocaleString()
}

/**
 * Get percentage
 */
const getPercent = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Get conflict percentage for bar width
 */
const getConflictPercentage = (conflicts) => {
  if (maxConflicts.value === 0) return 0
  return Math.round((conflicts / maxConflicts.value) * 100)
}

/**
 * Get conflict color based on severity
 */
const getConflictColor = (conflicts) => {
  if (conflicts === 0) return '#94a3b8'
  if (conflicts <= 5) return '#f59e0b'
  if (conflicts <= 20) return '#f97316'
  if (conflicts <= 50) return '#ef4444'
  return '#dc2626'
}

/**
 * Format datetime
 */
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Show toast message
 */
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* ================================================================
   MAIN CONTAINER
   ================================================================ */
.analytics-dashboard {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* ================================================================
   HEADER
   ================================================================ */
.dashboard-header {
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-badge {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-badge svg {
  width: 28px;
  height: 28px;
  color: white;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================
   ERROR STATE
   ================================================================ */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 16px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.error-state h3 {
  color: #dc2626;
  margin-bottom: 8px;
}

.error-state p {
  color: #64748b;
  margin-bottom: 16px;
}

.btn-retry {
  padding: 8px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #2563eb;
}

/* ================================================================
   SECTION TITLE
   ================================================================ */
.section-title {
  margin: 24px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.section-subtitle {
  font-size: 13px;
  color: #64748b;
}

/* ================================================================
   THREE MAIN CARDS GRID
   ================================================================ */
.main-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.main-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
  transition: all 0.2s;
}

.main-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.main-card-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.main-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.main-card-icon.blue { background: #dbeafe; }
.main-card-icon.orange { background: #fef3c7; }
.main-card-icon.purple { background: #ede9fe; }

.main-card-title-group {
  flex: 1;
}

.main-card-title-group h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.main-card-subtitle {
  font-size: 11px;
  color: #94a3b8;
}

.main-card-body {
  padding: 16px 20px 20px;
}

.main-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.main-stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 14px;
}

/* Sub Data Grid */
.sub-data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.sub-data-grid.two-items {
  grid-template-columns: 1fr 1fr;
}

.sub-data-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8ecf0;
  transition: all 0.2s;
}

.sub-data-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.sub-data-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sub-data-dot.active { background: #10b981; }
.sub-data-dot.inactive { background: #94a3b8; }
.sub-data-dot.conversion-merged { background: #f59e0b; }
.sub-data-dot.cost { background: #ef4444; }
.sub-data-dot.conflict { background: #ef4444; }
.sub-data-dot.date-diff { background: #8b5cf6; }

.sub-data-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.sub-data-label {
  font-size: 11px;
  color: #64748b;
  min-width: 70px;
}

.sub-data-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-left: auto;
}

.sub-data-percent {
  font-size: 11px;
  color: #94a3b8;
  min-width: 35px;
  text-align: right;
}

/* ================================================================
   SECTION CARD
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 24px;
}

/* ================================================================
   CONFLICT CHART - HORIZONTAL BAR
   ================================================================ */
.conflict-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.conflict-bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.conflict-bar-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 200px;
  gap: 12px;
}

.conflict-bar-label .store-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
}

.conflict-bar-label .store-conflict-count {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 30px;
  text-align: right;
}

.conflict-bar-track {
  flex: 1;
  height: 28px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.conflict-bar-fill {
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  transition: width 0.8s ease;
  min-width: 30px;
}

.conflict-bar-value {
  font-size: 12px;
  font-weight: 600;
  color: white;
}

/* ================================================================
   ISSUES
   ================================================================ */
.issues-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.badge {
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.badge.purple {
  background: #ede9fe;
  color: #6d28d9;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 12px;
}

.issue-item .issue-rank {
  font-weight: 700;
  color: #94a3b8;
  min-width: 20px;
  font-size: 11px;
}

.issue-item .issue-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
  min-width: 70px;
}

.issue-item .issue-name {
  flex: 1;
  color: #1e293b;
}

.issue-item .issue-store {
  color: #64748b;
  font-size: 11px;
}

.issue-item .issue-value {
  font-weight: 600;
  color: #475569;
  font-size: 11px;
}

.issue-item.conflict { border-left: 3px solid #ef4444; }
.issue-item.date-diff { border-left: 3px solid #8b5cf6; }

.empty-state-small {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

/* ================================================================
   LOADING
   ================================================================ */
.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

/* ================================================================
   LAST UPDATED
   ================================================================ */
.last-updated {
  text-align: center;
  padding: 16px;
  color: #94a3b8;
  font-size: 13px;
  margin-top: 8px;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
  font-size: 13px;
}

.toast.error { border-left-color: #ef4444; }
.toast.info { border-left-color: #3b82f6; }
.toast.warning { border-left-color: #f59e0b; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0%); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1200px) {
  .main-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .issues-grid {
    grid-template-columns: 1fr;
  }
  .conflict-bar-label {
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .analytics-dashboard { padding: 16px; }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { width: 100%; justify-content: space-between; flex-wrap: wrap; }
  .main-cards-grid {
    grid-template-columns: 1fr;
  }
  .issues-grid {
    grid-template-columns: 1fr;
  }
  .sub-data-grid {
    grid-template-columns: 1fr;
  }
  .sub-data-grid.two-items {
    grid-template-columns: 1fr;
  }
  .conflict-bar-row {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .conflict-bar-label {
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .issues-grid {
    grid-template-columns: 1fr;
  }
  .conflict-bar-label .store-name {
    font-size: 12px;
  }
}
</style>