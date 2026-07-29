<!-- views/dashboard/AnalyticsDashboard.vue -->
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

    <template v-else>
      <!-- ============================================================ -->
      <!-- SECTION 1: INVENTORY SUMMARY                                 -->
      <!-- ============================================================ -->
      <div class="section-title">
        <h2>📦 Inventory Analysis</h2>
        <span class="section-subtitle">Item master data health check</span>
      </div>

      <div class="stats-grid inventory-grid">
        <div class="stat-card primary">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">📦</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(inventoryStats.totalItems) }}</div>
            <div class="stat-label">Total Items</div>
            <div class="stat-sub">All items in system</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">✅</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(inventoryStats.activeItems) }}</div>
            <div class="stat-label">Active Items</div>
            <div class="stat-sub">{{ getPercent(inventoryStats.activeItems, inventoryStats.totalItems) }}% of total</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⏸️</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(inventoryStats.inactiveItems) }}</div>
            <div class="stat-label">Inactive Items</div>
            <div class="stat-sub">{{ getPercent(inventoryStats.inactiveItems, inventoryStats.totalItems) }}% of total</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">🔄</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(inventoryStats.missingConversion) }}</div>
            <div class="stat-label">Missing Conversion</div>
            <div class="stat-sub">No conversion UOM or value</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">💰</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(inventoryStats.missingCost) }}</div>
            <div class="stat-label">Missing Cost</div>
            <div class="stat-sub">Zero or null cost price</div>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">📊</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(inventoryStats.healthyItems) }}</div>
            <div class="stat-label">Healthy Items</div>
            <div class="stat-sub">Complete data (Active + Cost + Conversion)</div>
          </div>
        </div>
      </div>

      <!-- Inventory Charts -->
      <div class="chart-row">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-header-title">📊 Item Status Distribution</span>
          </div>
          <div class="chart-body">
            <div class="bar-chart">
              <div class="bar-item" v-for="item in statusChartData" :key="item.label">
                <div class="bar-label">{{ item.label }}</div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }">
                    <span class="bar-value">{{ item.value }}</span>
                  </div>
                </div>
                <div class="bar-percent">{{ item.percent }}%</div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-header-title">📋 Data Completeness</span>
          </div>
          <div class="chart-body">
            <div class="donut-container">
              <div class="donut-chart">
                <svg viewBox="0 0 200 200" class="donut-svg">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" stroke-width="35" />
                  <circle 
                    v-for="(segment, index) in completenessSegments" 
                    :key="index"
                    cx="100" 
                    cy="100" 
                    r="80" 
                    fill="none" 
                    :stroke="segment.color" 
                    stroke-width="35"
                    :stroke-dasharray="`${segment.circumference} ${totalCircumference}`"
                    :stroke-dashoffset="segment.offset"
                    transform="rotate(-90 100 100)"
                    class="donut-segment"
                  />
                  <text x="100" y="95" text-anchor="middle" font-size="18" font-weight="700" fill="#1e293b">
                    {{ inventoryStats.healthyItems }}
                  </text>
                  <text x="100" y="115" text-anchor="middle" font-size="10" fill="#94a3b8">
                    Healthy Items
                  </text>
                </svg>
              </div>
              <div class="donut-legend">
                <div v-for="item in completenessLegend" :key="item.label" class="legend-item">
                  <span class="legend-color" :style="{ background: item.color }"></span>
                  <span class="legend-label">{{ item.label }}</span>
                  <span class="legend-value">{{ item.value }}</span>
                  <span class="legend-percent">{{ item.percent }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 2: AUDIT SUMMARY                                     -->
      <!-- ============================================================ -->
      <div class="section-title" style="margin-top: 32px;">
        <h2>🔍 Audit Analysis</h2>
        <span class="section-subtitle">Store balance reconciliation status</span>
      </div>

      <div class="stats-grid audit-grid">
        <div class="stat-card info">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">🏪</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(auditStats.totalStores) }}</div>
            <div class="stat-label">Total Stores</div>
            <div class="stat-sub">Active stores</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">✅</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(auditStats.matched) }}</div>
            <div class="stat-label">Matched</div>
            <div class="stat-sub">{{ getPercent(auditStats.matched, auditStats.totalItems) }}% of items</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⚠️</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(auditStats.outliers) }}</div>
            <div class="stat-label">Outliers</div>
            <div class="stat-sub">{{ getPercent(auditStats.outliers, auditStats.totalItems) }}% of items</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">🚨</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(auditStats.conflicts) }}</div>
            <div class="stat-label">Conflicts</div>
            <div class="stat-sub">{{ getPercent(auditStats.conflicts, auditStats.totalItems) }}% of items</div>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">📅</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(auditStats.dateDiffs) }}</div>
            <div class="stat-label">Date Differences</div>
            <div class="stat-sub">{{ getPercent(auditStats.dateDiffs, auditStats.totalItems) }}% of items</div>
          </div>
        </div>
        <div class="stat-card primary">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">📊</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(auditStats.totalItems) }}</div>
            <div class="stat-label">Total Items Audited</div>
            <div class="stat-sub">Across all stores</div>
          </div>
        </div>
      </div>

      <!-- Audit Charts -->
      <div class="chart-row">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-header-title">🏪 Store-wise Status</span>
          </div>
          <div class="chart-body">
            <div class="store-chart">
              <div v-for="store in storeStatusData" :key="store.name" class="store-bar-row">
                <div class="store-bar-info">
                  <span class="store-name">{{ store.name }}</span>
                  <span class="store-total">{{ store.total }} items</span>
                </div>
                <div class="store-bar-track">
                  <div class="store-bar-fill" :style="{ width: store.percent + '%' }">
                    <div class="store-bar-segments">
                      <div 
                        v-for="(seg, idx) in store.segments" 
                        :key="idx"
                        class="segment"
                        :style="{ 
                          width: seg.percent + '%', 
                          background: seg.color 
                        }"
                        :title="seg.label + ': ' + seg.count"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="store-bar-legend">
                  <span v-for="(seg, idx) in store.segments" :key="idx" class="legend-dot" :style="{ background: seg.color }">
                    {{ seg.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-header-title">📊 Audit Status Distribution</span>
          </div>
          <div class="chart-body">
            <div class="audit-pie-container">
              <div class="audit-pie">
                <svg viewBox="0 0 200 200" class="pie-svg">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" stroke-width="35" />
                  <circle 
                    v-for="(segment, index) in auditPieSegments" 
                    :key="index"
                    cx="100" 
                    cy="100" 
                    r="80" 
                    fill="none" 
                    :stroke="segment.color" 
                    stroke-width="35"
                    :stroke-dasharray="`${segment.circumference} ${totalCircumference}`"
                    :stroke-dashoffset="segment.offset"
                    transform="rotate(-90 100 100)"
                    class="pie-segment"
                  />
                  <text x="100" y="95" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">
                    {{ auditStats.totalItems }}
                  </text>
                  <text x="100" y="115" text-anchor="middle" font-size="10" fill="#94a3b8">
                    Total Items
                  </text>
                </svg>
              </div>
              <div class="audit-pie-legend">
                <div v-for="item in auditPieLegend" :key="item.label" class="legend-item">
                  <span class="legend-color" :style="{ background: item.color }"></span>
                  <span class="legend-label">{{ item.label }}</span>
                  <span class="legend-value">{{ item.value }}</span>
                  <span class="legend-percent">{{ item.percent }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 3: STORE COMPARISON TABLE                           -->
      <!-- ============================================================ -->
      <div class="section-title">
        <div class="section-title-left">
          <h2>📋 Store Comparison</h2>
          <span class="section-subtitle">Detailed breakdown by store</span>
        </div>
      </div>

      <div class="section-card">
        <div class="table-container">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Total Items</th>
                <th>✅ Matched</th>
                <th>⚠️ Outliers</th>
                <th>🚨 Conflicts</th>
                <th>📅 Date Diff</th>
                <th>Health Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="store in storeComparison" :key="store.name">
                <td class="store-cell">{{ store.name }}</td>
                <td class="text-center">{{ formatNumber(store.total) }}</td>
                <td class="text-center success-text">{{ formatNumber(store.matched) }}</td>
                <td class="text-center warning-text">{{ formatNumber(store.outliers) }}</td>
                <td class="text-center danger-text">{{ formatNumber(store.conflicts) }}</td>
                <td class="text-center purple-text">{{ formatNumber(store.dateDiffs) }}</td>
                <td>
                  <div class="health-score">
                    <div class="score-bar">
                      <div class="score-fill" :style="{ width: store.health + '%', background: getHealthColor(store.health) }"></div>
                    </div>
                    <span class="score-value">{{ store.health }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- SECTION 4: TOP ISSUES                                        -->
      <!-- ============================================================ -->
      <div class="section-title">
        <div class="section-title-left">
          <h2>⚠️ Top Issues</h2>
          <span class="section-subtitle">Items needing immediate attention</span>
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
            <h3>⚠️ Top Outliers</h3>
            <span class="badge warning">{{ topOutliers.length }}</span>
          </div>
          <div class="issues-list">
            <div v-if="topOutliers.length === 0" class="empty-state-small">✅ No outliers</div>
            <div v-for="(item, index) in topOutliers" :key="index" class="issue-item outlier">
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
              <span class="issue-value">{{ item.days }} days</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// ================================================================
// STATE
// ================================================================

const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// DEMO DATA
// ================================================================

// Inventory Stats
const inventoryStats = ref({
  totalItems: 2136,
  activeItems: 1958,
  inactiveItems: 178,
  missingConversion: 171,
  missingCost: 138,
  healthyItems: 1649
})

// Audit Stats
const auditStats = ref({
  totalStores: 6,
  totalItems: 2136,
  matched: 1859,
  outliers: 127,
  conflicts: 4,
  dateDiffs: 146
})

// Store Comparison Data
const storeComparison = ref([
  { name: 'MainStore_1_yeshi', total: 1859, matched: 1723, outliers: 116, conflicts: 2, dateDiffs: 18 },
  { name: 'MainStore_3', total: 116, matched: 89, outliers: 11, conflicts: 1, dateDiffs: 15 },
  { name: 'Mainstore_2_DULENTY_store _1', total: 126, matched: 47, outliers: 0, conflicts: 1, dateDiffs: 78 },
  { name: 'MainStore_1_Ground', total: 63, matched: 0, outliers: 0, conflicts: 0, dateDiffs: 63 },
  { name: 'MainStore_1_Dulenty', total: 2, matched: 0, outliers: 0, conflicts: 0, dateDiffs: 2 },
  { name: 'MainStore_1_Mekanisa', total: 3, matched: 0, outliers: 0, conflicts: 0, dateDiffs: 3 }
])

// Top Issues
const topConflicts = ref([
  { code: 'SDT001031', name: '10 Channel Mixer Pro', store: 'MainStore_1_yeshi', diff: 5 },
  { code: 'SDT001032', name: 'HDMI Splitter 4K', store: 'MainStore_1_yeshi', diff: 3 },
  { code: 'STORE3-003', name: 'Power Adapter 12V', store: 'MainStore_3', diff: 3 }
])

const topOutliers = ref([
  { code: 'SDT002599', name: 'Aluminium Paste 250kg', store: 'MainStore_1_yeshi', diff: 2 },
  { code: 'SDT001543', name: 'ATS Cabinet 2500A', store: 'MainStore_1_yeshi', diff: 2 },
  { code: 'STORE3-002', name: 'Network Switch 24 Port', store: 'MainStore_3', diff: 1 }
])

const topDateDiffs = ref([
  { code: 'SDT002600', name: 'Paint Thinner 1L', store: 'MainStore_1_yeshi', days: 14 },
  { code: 'SDT002601', name: 'Primer Coating', store: 'MainStore_1_yeshi', days: 17 },
  { code: 'SDT002602', name: 'Industrial Adhesive', store: 'MainStore_1_yeshi', days: 1 }
])

// ================================================================
// COMPUTED
// ================================================================

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
})

const statusChartData = computed(() => {
  const total = inventoryStats.value.totalItems
  return [
    { label: 'Active', value: inventoryStats.value.activeItems, percent: Math.round((inventoryStats.value.activeItems / total) * 100), color: '#10b981' },
    { label: 'Inactive', value: inventoryStats.value.inactiveItems, percent: Math.round((inventoryStats.value.inactiveItems / total) * 100), color: '#94a3b8' },
    { label: 'Missing Conversion', value: inventoryStats.value.missingConversion, percent: Math.round((inventoryStats.value.missingConversion / total) * 100), color: '#f59e0b' },
    { label: 'Missing Cost', value: inventoryStats.value.missingCost, percent: Math.round((inventoryStats.value.missingCost / total) * 100), color: '#ef4444' },
    { label: 'Healthy', value: inventoryStats.value.healthyItems, percent: Math.round((inventoryStats.value.healthyItems / total) * 100), color: '#3b82f6' }
  ]
})

const completenessSegments = computed(() => {
  const total = inventoryStats.value.totalItems
  const segments = [
    { label: 'Healthy', value: inventoryStats.value.healthyItems, color: '#3b82f6' },
    { label: 'Missing Conversion', value: inventoryStats.value.missingConversion, color: '#f59e0b' },
    { label: 'Missing Cost', value: inventoryStats.value.missingCost, color: '#ef4444' },
    { label: 'Inactive', value: inventoryStats.value.inactiveItems, color: '#94a3b8' }
  ]
  
  const circumference = 2 * Math.PI * 80
  let offset = 0
  
  return segments.map(seg => {
    const percent = total > 0 ? seg.value / total : 0
    const value = percent * circumference
    const result = {
      ...seg,
      circumference: value,
      offset: -offset,
      percent: Math.round(percent * 100)
    }
    offset += value
    return result
  }).filter(s => s.value > 0)
})

const totalCircumference = computed(() => 2 * Math.PI * 80)

const completenessLegend = computed(() => {
  return completenessSegments.value.map(s => ({
    label: s.label,
    color: s.color,
    value: s.value,
    percent: s.percent
  }))
})

const storeStatusData = computed(() => {
  return storeComparison.value.map(store => {
    const total = store.total
    const segments = [
      { label: 'Matched', count: store.matched, color: '#10b981' },
      { label: 'Outliers', count: store.outliers, color: '#f59e0b' },
      { label: 'Conflicts', count: store.conflicts, color: '#ef4444' },
      { label: 'Date Diff', count: store.dateDiffs, color: '#8b5cf6' }
    ]
    
    return {
      ...store,
      segments: segments.map(s => ({
        ...s,
        percent: total > 0 ? Math.round((s.count / total) * 100) : 0
      })),
      percent: total > 0 ? Math.round((store.matched / total) * 100) : 0
    }
  })
})

const auditPieSegments = computed(() => {
  const total = auditStats.value.totalItems
  const segments = [
    { label: 'Matched', value: auditStats.value.matched, color: '#10b981' },
    { label: 'Outliers', value: auditStats.value.outliers, color: '#f59e0b' },
    { label: 'Conflicts', value: auditStats.value.conflicts, color: '#ef4444' },
    { label: 'Date Diff', value: auditStats.value.dateDiffs, color: '#8b5cf6' }
  ]
  
  const circumference = 2 * Math.PI * 80
  let offset = 0
  
  return segments.map(seg => {
    const percent = total > 0 ? seg.value / total : 0
    const value = percent * circumference
    const result = {
      ...seg,
      circumference: value,
      offset: -offset,
      percent: Math.round(percent * 100)
    }
    offset += value
    return result
  }).filter(s => s.value > 0)
})

const auditPieLegend = computed(() => {
  return auditPieSegments.value.map(s => ({
    label: s.label,
    color: s.color,
    value: s.value,
    percent: s.percent
  }))
})

// ================================================================
// METHODS
// ================================================================

const formatNumber = (value) => {
  if (!value && value !== 0) return '0'
  return value.toLocaleString()
}

const getPercent = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

const getHealthColor = (score) => {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    showToastMessage('Data refreshed!', 'success')
  }, 800)
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
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
   HEADER (same as before)
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
   STATS GRID
   ================================================================ */
.stats-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.inventory-grid {
  grid-template-columns: repeat(6, 1fr);
}

.audit-grid {
  grid-template-columns: repeat(6, 1fr);
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 24px;
}

.stat-card.primary .stat-icon-wrapper { background: #dbeafe; }
.stat-card.success .stat-icon-wrapper { background: #dcfce7; }
.stat-card.warning .stat-icon-wrapper { background: #fef3c7; }
.stat-card.danger .stat-icon-wrapper { background: #fee2e2; }
.stat-card.purple .stat-icon-wrapper { background: #ede9fe; }
.stat-card.info .stat-icon-wrapper { background: #e0f2fe; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.stat-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.stat-card.primary .stat-value { color: #2563eb; }
.stat-card.success .stat-value { color: #16a34a; }
.stat-card.warning .stat-value { color: #d97706; }
.stat-card.danger .stat-value { color: #dc2626; }
.stat-card.purple .stat-value { color: #7c3aed; }
.stat-card.info .stat-value { color: #0891b2; }

/* ================================================================
   CHART ROW
   ================================================================ */
.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.chart-header-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.chart-body {
  padding: 20px 24px;
}

/* ================================================================
   BAR CHART
   ================================================================ */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  min-width: 120px;
}

.bar-track {
  flex: 1;
  height: 24px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  transition: width 0.8s ease;
  min-width: 30px;
}

.bar-value {
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.bar-percent {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  min-width: 45px;
  text-align: right;
}

/* ================================================================
   DONUT CHART
   ================================================================ */
.donut-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.donut-chart {
  width: 200px;
  height: 200px;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-segment {
  transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-label {
  color: #1e293b;
  min-width: 60px;
}

.legend-value {
  font-weight: 600;
  color: #1e293b;
  margin-left: auto;
  min-width: 30px;
  text-align: right;
}

.legend-percent {
  font-size: 12px;
  color: #94a3b8;
  min-width: 40px;
  text-align: right;
}

/* ================================================================
   STORE CHART
   ================================================================ */
.store-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.store-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.store-bar-info {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.store-name {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.store-total {
  font-size: 10px;
  color: #94a3b8;
}

.store-bar-track {
  flex: 1;
  height: 20px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  min-width: 100px;
}

.store-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.8s ease;
}

.store-bar-segments {
  display: flex;
  height: 100%;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
}

.segment {
  height: 100%;
  transition: width 0.8s ease;
}

.store-bar-legend {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: #64748b;
  flex-wrap: wrap;
  min-width: 80px;
}

.legend-dot {
  display: inline-block;
  padding: 0 6px;
  border-radius: 10px;
  color: white;
  font-weight: 500;
}

/* ================================================================
   AUDIT PIE
   ================================================================ */
.audit-pie-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.audit-pie {
  width: 200px;
  height: 200px;
}

.pie-svg {
  width: 100%;
  height: 100%;
}

.pie-segment {
  transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;
}

.audit-pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.comparison-table th,
.comparison-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.comparison-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.store-cell {
  font-weight: 500;
  color: #1e293b;
}

.text-center {
  text-align: center;
}

.success-text { color: #16a34a; font-weight: 600; }
.warning-text { color: #d97706; font-weight: 600; }
.danger-text { color: #dc2626; font-weight: 600; }
.purple-text { color: #7c3aed; font-weight: 600; }

/* ================================================================
   HEALTH SCORE
   ================================================================ */
.health-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  min-width: 60px;
}

.score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.score-value {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  min-width: 40px;
}

/* ================================================================
   ISSUES
   ================================================================ */
.issues-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
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

.badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.badge.purple {
  background: #ede9fe;
  color: #6d28d9;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 250px;
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
.issue-item.outlier { border-left: 3px solid #f59e0b; }
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
  .inventory-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .audit-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .issues-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 992px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-dashboard { padding: 16px; }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { width: 100%; justify-content: space-between; flex-wrap: wrap; }
  .inventory-grid {
    grid-template-columns: 1fr 1fr;
  }
  .audit-grid {
    grid-template-columns: 1fr 1fr;
  }
  .issues-grid {
    grid-template-columns: 1fr;
  }
  .store-bar-row {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .store-bar-info {
    flex-direction: row;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .inventory-grid {
    grid-template-columns: 1fr;
  }
  .audit-grid {
    grid-template-columns: 1fr;
  }
  .donut-container,
  .audit-pie-container {
    flex-direction: column;
    gap: 16px;
  }
  .bar-item {
    flex-wrap: wrap;
  }
  .bar-label {
    min-width: 80px;
    font-size: 11px;
  }
}
</style>