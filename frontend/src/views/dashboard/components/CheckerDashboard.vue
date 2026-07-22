<template>
  <div class="checker-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <h1>🔍 Checker Dashboard</h1>
          <p>Inventory Data Quality & Balance Reconciliation</p>
        </div>
      </div>
      <div class="header-right">
        <div class="date-display">
          <span class="date-icon">📅</span>
          <span class="date-text">{{ formatDate(new Date()) }}</span>
        </div>
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading checker data...</p>
    </div>

    <template v-else>
      <!-- ==================== SECTION 1: DATA QUALITY ==================== -->
      <div class="section-title">
        <h2>📊 Inventory Data Quality</h2>
        <span class="section-subtitle">Check for missing or incomplete item data</span>
      </div>

      <!-- Data Quality Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ dataQuality.totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ dataQuality.completeItems }}</div>
          <div class="stat-label">Complete Data</div>
          <div class="stat-sub">✅ {{ dataQuality.completePercentage }}%</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">{{ dataQuality.partialItems }}</div>
          <div class="stat-label">Partial Data</div>
          <div class="stat-sub">⚠️ {{ dataQuality.partialPercentage }}%</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">{{ dataQuality.missingItems }}</div>
          <div class="stat-label">Missing Data</div>
          <div class="stat-sub">❌ {{ dataQuality.missingPercentage }}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dataQuality.dataCompleteness }}%</div>
          <div class="stat-label">Data Completeness</div>
          <div class="stat-sub">📈 Overall quality score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ dataQuality.categoriesWithIssues }}</div>
          <div class="stat-label">Categories with Issues</div>
        </div>
      </div>

      <!-- Data Quality Breakdown -->
      <div class="two-column-layout">
        <div class="left-column">
          <!-- Missing Fields Overview -->
          <div class="section-card">
            <div class="section-header">
              <h3>🔍 Missing Fields Overview</h3>
              <span class="badge danger">{{ totalMissingFields }}</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="field in missingFields" :key="field.name" class="missing-field-item">
                  <div class="field-icon">{{ field.icon }}</div>
                  <div class="field-info">
                    <div class="field-name">{{ field.name }}</div>
                    <div class="field-count">{{ field.count }} items missing</div>
                  </div>
                  <div class="field-bar">
                    <div class="field-fill" :style="{ width: field.percentage + '%', background: field.color }"></div>
                  </div>
                  <div class="field-percent">{{ field.percentage }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items with Most Missing Fields -->
          <div class="section-card">
            <div class="section-header">
              <h3>🚨 Items with Most Missing Fields</h3>
              <span class="badge danger">{{ itemsWithMostIssues.length }}</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="(item, idx) in itemsWithMostIssues" :key="item.id" class="list-item issue-item">
                  <div class="top-rank">{{ idx + 1 }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ item.name }}</div>
                    <div class="list-detail">{{ item.code }} • {{ item.category }}</div>
                    <div class="missing-fields-list">
                      <span v-for="field in item.missingFields" :key="field" class="missing-tag">
                        {{ field }}
                      </span>
                    </div>
                  </div>
                  <div class="missing-count">{{ item.missingCount }} missing</div>
                </div>
              </div>
              <div v-if="itemsWithMostIssues.length > 5" class="scroll-indicator">▼ Scroll for more</div>
            </div>
          </div>
        </div>

        <div class="right-column">
          <!-- Data Quality by Category -->
          <div class="section-card">
            <div class="section-header">
              <h3>📂 Data Quality by Category</h3>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="cat in categoryQuality" :key="cat.name" class="category-quality-item">
                  <div class="category-quality-name">{{ cat.name }}</div>
                  <div class="category-quality-bar">
                    <div class="category-quality-fill" :style="{ width: cat.completeness + '%', background: cat.color }"></div>
                  </div>
                  <div class="category-quality-stats">
                    <span class="complete">{{ cat.complete }}</span>
                    <span class="partial">{{ cat.partial }}</span>
                    <span class="missing">{{ cat.missing }}</span>
                  </div>
                  <div class="category-quality-score">{{ cat.completeness }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items with Missing Data List -->
          <div class="section-card">
            <div class="section-header">
              <h3>📋 Items with Missing Data</h3>
              <span class="badge warning">{{ itemsWithMissingData.length }}</span>
            </div>
            <div class="scroll-container">
              <div v-if="itemsWithMissingData.length === 0" class="empty-state-small">✅ All items have complete data</div>
              <div v-else class="item-list">
                <div v-for="item in itemsWithMissingData" :key="item.id" class="list-item missing-item">
                  <div class="list-avatar missing-avatar">{{ getInitials(item.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ item.name }}</div>
                    <div class="list-detail">{{ item.code }}</div>
                    <div class="missing-fields">
                      <span v-for="field in item.missingFields" :key="field" class="missing-badge">
                        ❌ {{ field }}
                      </span>
                    </div>
                  </div>
                  <button class="btn-small warning" @click="fixItem(item)">Fix</button>
                </div>
              </div>
              <div v-if="itemsWithMissingData.length > 5" class="scroll-indicator">▼ Scroll for more</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 2: BALANCE RECONCILIATION ==================== -->
      <div class="section-title">
        <h2>⚖️ Balance Reconciliation</h2>
        <span class="section-subtitle">Compare balances across stores and groups</span>
      </div>

      <!-- Balance Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ reconciliation.totalProducts }}</div>
          <div class="stat-label">Total Products</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ reconciliation.matched }}</div>
          <div class="stat-label">✅ Matched</div>
          <div class="stat-sub">{{ reconciliation.matchedPercentage }}% of total</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">{{ reconciliation.outlier }}</div>
          <div class="stat-label">⚠️ Outlier</div>
          <div class="stat-sub">{{ reconciliation.outlierPercentage }}% of total</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">{{ reconciliation.conflict }}</div>
          <div class="stat-label">🚨 Conflict</div>
          <div class="stat-sub">{{ reconciliation.conflictPercentage }}% of total</div>
        </div>
        <div class="stat-card critical">
          <div class="stat-value">{{ reconciliation.dateDiff }}</div>
          <div class="stat-label">📅 Date Diff</div>
          <div class="stat-sub">Different last transaction dates</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ reconciliation.totalGroups }}</div>
          <div class="stat-label">Total Groups</div>
          <div class="stat-sub">{{ reconciliation.totalStores }} stores</div>
        </div>
      </div>

      <!-- Balance Comparison Details -->
      <div class="two-column-layout">
        <div class="left-column">
          <!-- Conflict Details -->
          <div class="section-card conflict-card">
            <div class="section-header">
              <h3>🚨 Conflicts</h3>
              <span class="badge danger">{{ conflictItems.length }}</span>
            </div>
            <div class="scroll-container">
              <div v-if="conflictItems.length === 0" class="empty-state-small">✅ No conflicts detected</div>
              <div v-else class="item-list">
                <div v-for="item in conflictItems" :key="item.id" class="list-item conflict-item">
                  <div class="list-avatar conflict-avatar">{{ getInitials(item.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ item.name }}</div>
                    <div class="list-detail">{{ item.code }} • {{ item.category }}</div>
                    <div class="conflict-details">
                      <span v-for="(balance, group) in item.balances" :key="group" class="balance-diff">
                        {{ group }}: {{ balance }}
                      </span>
                    </div>
                  </div>
                  <button class="btn-small warning" @click="viewConflict(item)">View</button>
                </div>
              </div>
              <div v-if="conflictItems.length > 5" class="scroll-indicator">▼ Scroll for more</div>
            </div>
          </div>

          <!-- Date Diff Items -->
          <div class="section-card date-diff-card">
            <div class="section-header">
              <h3>📅 Date Differences</h3>
              <span class="badge critical">{{ dateDiffItems.length }}</span>
            </div>
            <div class="scroll-container">
              <div v-if="dateDiffItems.length === 0" class="empty-state-small">✅ No date differences</div>
              <div v-else class="item-list">
                <div v-for="item in dateDiffItems" :key="item.id" class="list-item date-diff-item">
                  <div class="list-avatar date-diff-avatar">{{ getInitials(item.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ item.name }}</div>
                    <div class="list-detail">{{ item.code }} • {{ item.category }}</div>
                    <div class="date-diff-details">
                      <span v-for="(date, group) in item.dates" :key="group" class="date-group">
                        {{ group }}: {{ formatDate(date) }}
                      </span>
                    </div>
                  </div>
                  <div class="date-diff-badge">{{ item.diffDays }} days apart</div>
                </div>
              </div>
              <div v-if="dateDiffItems.length > 5" class="scroll-indicator">▼ Scroll for more</div>
            </div>
          </div>
        </div>

        <div class="right-column">
          <!-- Outlier Items -->
          <div class="section-card outlier-card">
            <div class="section-header">
              <h3>⚠️ Outliers</h3>
              <span class="badge warning">{{ outlierItems.length }}</span>
            </div>
            <div class="scroll-container">
              <div v-if="outlierItems.length === 0" class="empty-state-small">✅ No outliers detected</div>
              <div v-else class="item-list">
                <div v-for="item in outlierItems" :key="item.id" class="list-item outlier-item">
                  <div class="list-avatar outlier-avatar">{{ getInitials(item.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ item.name }}</div>
                    <div class="list-detail">{{ item.code }} • {{ item.category }}</div>
                    <div class="outlier-details">
                      <span v-for="(balance, group) in item.balances" :key="group" class="balance-outlier">
                        {{ group }}: {{ balance }}
                      </span>
                    </div>
                  </div>
                  <button class="btn-small info" @click="viewOutlier(item)">View</button>
                </div>
              </div>
              <div v-if="outlierItems.length > 5" class="scroll-indicator">▼ Scroll for more</div>
            </div>
          </div>

          <!-- Matched Items Summary -->
          <div class="section-card matched-card">
            <div class="section-header">
              <h3>✅ Matched Items</h3>
              <span class="badge success">{{ matchedItems.length }}</span>
            </div>
            <div class="scroll-container">
              <div v-if="matchedItems.length === 0" class="empty-state-small">No matched items</div>
              <div v-else class="item-list">
                <div v-for="item in matchedItems.slice(0, 10)" :key="item.id" class="list-item matched-item">
                  <div class="list-avatar matched-avatar">{{ getInitials(item.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ item.name }}</div>
                    <div class="list-detail">{{ item.code }} • {{ item.category }}</div>
                    <div class="matched-balance">✅ All groups match: {{ item.commonBalance }}</div>
                  </div>
                </div>
              </div>
              <div v-if="matchedItems.length > 10" class="scroll-indicator">▼ Scroll for more ({{ matchedItems.length - 10 }} more)</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span class="toast-icon">{{ toastIcon }}</span>
      <span class="toast-message">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// State
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastIcon = ref('✅')

// ================================================================
// DATA QUALITY
// ================================================================

const dataQuality = ref({
  totalItems: 284,
  completeItems: 156,
  completePercentage: 55,
  partialItems: 89,
  partialPercentage: 31,
  missingItems: 39,
  missingPercentage: 14,
  dataCompleteness: 78,
  categoriesWithIssues: 8
})

const totalMissingFields = ref(142)

const missingFields = ref([
  { name: 'Brand', icon: '🏷️', count: 45, percentage: 16, color: '#ef4444' },
  { name: 'Model', icon: '📱', count: 38, percentage: 13, color: '#f59e0b' },
  { name: 'Spec Text', icon: '📝', count: 32, percentage: 11, color: '#8b5cf6' },
  { name: 'Conversion Value', icon: '🔄', count: 28, percentage: 10, color: '#3b82f6' },
  { name: 'Conversion UOM', icon: '📦', count: 24, percentage: 8, color: '#ec4899' },
  { name: 'Cost Price', icon: '💰', count: 18, percentage: 6, color: '#10b981' },
  { name: 'Barcode', icon: '📊', count: 12, percentage: 4, color: '#6366f1' }
])

const itemsWithMostIssues = ref([
  { id: 1, name: 'Lacquer Thinner', code: 'SDT000001', category: 'Paint', missingFields: ['Brand', 'Model', 'Spec Text', 'Cost Price'], missingCount: 4 },
  { id: 2, name: 'Industrial Oil', code: 'SDT000015', category: 'Lubricants', missingFields: ['Brand', 'Conversion UOM', 'Barcode'], missingCount: 3 },
  { id: 3, name: 'Steel Sheets', code: 'SDT000023', category: 'Raw Materials', missingFields: ['Model', 'Spec Text', 'Conversion Value'], missingCount: 3 },
  { id: 4, name: 'Welding Rods', code: 'SDT000045', category: 'Tools', missingFields: ['Brand', 'Cost Price'], missingCount: 2 },
  { id: 5, name: 'Paint Brushes', code: 'SDT000067', category: 'Tools', missingFields: ['Model', 'Spec Text'], missingCount: 2 }
])

const categoryQuality = ref([
  { name: 'Paint', complete: 45, partial: 12, missing: 3, completeness: 75, color: '#3b82f6' },
  { name: 'Raw Materials', complete: 28, partial: 15, missing: 5, completeness: 58, color: '#10b981' },
  { name: 'Tools', complete: 32, partial: 8, missing: 2, completeness: 76, color: '#f59e0b' },
  { name: 'Lubricants', complete: 18, partial: 8, missing: 2, completeness: 64, color: '#8b5cf6' },
  { name: 'Chemicals', complete: 12, partial: 6, missing: 6, completeness: 50, color: '#ef4444' },
  { name: 'Supplies', complete: 21, partial: 1, missing: 0, completeness: 95, color: '#ec4899' }
])

const itemsWithMissingData = ref([
  { id: 1, name: 'Lacquer Thinner', code: 'SDT000001', missingFields: ['Brand', 'Model', 'Spec Text', 'Cost Price'] },
  { id: 2, name: 'Industrial Oil', code: 'SDT000015', missingFields: ['Brand', 'Conversion UOM', 'Barcode'] },
  { id: 3, name: 'Steel Sheets', code: 'SDT000023', missingFields: ['Model', 'Spec Text', 'Conversion Value'] },
  { id: 4, name: 'Welding Rods', code: 'SDT000045', missingFields: ['Brand', 'Cost Price'] },
  { id: 5, name: 'Paint Brushes', code: 'SDT000067', missingFields: ['Model', 'Spec Text'] }
])

// ================================================================
// BALANCE RECONCILIATION
// ================================================================

const reconciliation = ref({
  totalProducts: 284,
  matched: 156,
  outlier: 89,
  conflict: 24,
  dateDiff: 15,
  matchedPercentage: 55,
  outlierPercentage: 31,
  conflictPercentage: 8,
  dateDiffPercentage: 5,
  totalGroups: 8,
  totalStores: 5
})

const conflictItems = ref([
  { id: 1, name: 'Lacquer Thinner', code: 'SDT000001', category: 'Paint', balances: { 'IT': 5, 'Storekeeper': 20, 'Finance': 15 } },
  { id: 2, name: 'Industrial Oil', code: 'SDT000015', category: 'Lubricants', balances: { 'IT': 8, 'Storekeeper': 25, 'Operations': 10 } },
  { id: 3, name: 'Steel Sheets', code: 'SDT000023', category: 'Raw Materials', balances: { 'IT': 12, 'Storekeeper': 30, 'Sales': 5 } }
])

const dateDiffItems = ref([
  { id: 1, name: 'Lacquer Thinner', code: 'SDT000001', category: 'Paint', dates: { 'IT': '2026-07-18', 'Storekeeper': '2026-07-19' }, diffDays: 1 },
  { id: 2, name: 'Industrial Oil', code: 'SDT000015', category: 'Lubricants', dates: { 'IT': '2026-07-17', 'Storekeeper': '2026-07-19' }, diffDays: 2 },
  { id: 3, name: 'Steel Sheets', code: 'SDT000023', category: 'Raw Materials', dates: { 'IT': '2026-07-18', 'Storekeeper': '2026-07-20' }, diffDays: 2 }
])

const outlierItems = ref([
  { id: 1, name: 'Lacquer Thinner', code: 'SDT000001', category: 'Paint', balances: { 'IT': 5, 'Storekeeper': 20, 'Finance': 15 } },
  { id: 2, name: 'Industrial Oil', code: 'SDT000015', category: 'Lubricants', balances: { 'IT': 8, 'Storekeeper': 25, 'Operations': 10 } },
  { id: 3, name: 'Steel Sheets', code: 'SDT000023', category: 'Raw Materials', balances: { 'IT': 12, 'Storekeeper': 30, 'Sales': 5 } },
  { id: 4, name: 'Welding Rods', code: 'SDT000045', category: 'Tools', balances: { 'IT': 3, 'Storekeeper': 15 } },
  { id: 5, name: 'Paint Brushes', code: 'SDT000067', category: 'Tools', balances: { 'IT': 7, 'Storekeeper': 20 } }
])

const matchedItems = ref([
  { id: 1, name: 'Lacquer Thinner', code: 'SDT000001', category: 'Paint', commonBalance: 165 },
  { id: 2, name: 'Industrial Oil', code: 'SDT000015', category: 'Lubricants', commonBalance: 25 },
  { id: 3, name: 'Steel Sheets', code: 'SDT000023', category: 'Raw Materials', commonBalance: 30 },
  { id: 4, name: 'Welding Rods', code: 'SDT000045', category: 'Tools', commonBalance: 15 },
  { id: 5, name: 'Paint Brushes', code: 'SDT000067', category: 'Tools', commonBalance: 20 },
  { id: 6, name: 'Primer Paint', code: 'SDT000134', category: 'Paint', commonBalance: 10 },
  { id: 7, name: 'Sandpaper Grit 80', code: 'SDT000089', category: 'Tools', commonBalance: 50 },
  { id: 8, name: 'Thinner Solvent', code: 'SDT000102', category: 'Chemicals', commonBalance: 8 },
  { id: 9, name: 'Masking Tape', code: 'SDT000118', category: 'Supplies', commonBalance: 100 },
  { id: 10, name: 'Industrial Grease', code: 'SDT000156', category: 'Lubricants', commonBalance: 12 }
])

// ================================================================
// METHODS
// ================================================================

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function fixItem(item) {
  showToastMessage(`Opening editor for ${item.name}...`, 'info')
}

function viewConflict(item) {
  showToastMessage(`Viewing conflict details for ${item.name}...`, 'info')
}

function viewOutlier(item) {
  showToastMessage(`Viewing outlier details for ${item.name}...`, 'info')
}

function refreshData() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    showToastMessage('Dashboard refreshed', 'success')
  }, 1000)
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = type === 'success' ? '✅' : (type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : 'ℹ️'))
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style scoped>
.checker-dashboard {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* Header */
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-badge {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
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
  gap: 20px;
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
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #e2e8f0;
}

/* Section Title */
.section-title {
  margin: 24px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
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

/* Loading State */
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
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  text-align: center;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.stat-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.stat-card.success .stat-value { color: #10b981; }
.stat-card.warning .stat-value { color: #f59e0b; }
.stat-card.danger .stat-value { color: #ef4444; }
.stat-card.critical .stat-value { color: #8b5cf6; }

/* Two Column Layout */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.badge.success { background: #dcfce7; color: #166534; }
.badge.warning { background: #fef3c7; color: #92400e; }
.badge.danger { background: #fee2e2; color: #991b1b; }
.badge.critical { background: #ede9fe; color: #6d28d9; }
.badge.info { background: #dbeafe; color: #1e40af; }

/* Scroll Container */
.scroll-container {
  flex: 1;
  overflow-y: auto;
  max-height: 280px;
}

.scroll-container::-webkit-scrollbar {
  width: 4px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.scroll-indicator {
  text-align: center;
  font-size: 10px;
  color: #94a3b8;
  padding: 8px;
  border-top: 1px solid #eef2ff;
  margin-top: 8px;
}

/* Item List */
.item-list {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.list-item:last-child {
  border-bottom: none;
}

.list-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: white;
  flex-shrink: 0;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-name {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.list-detail {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.top-rank {
  width: 28px;
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  text-align: center;
  flex-shrink: 0;
}

/* Missing Fields */
.missing-field-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.field-icon { font-size: 18px; width: 32px; text-align: center; }
.field-info { flex: 1; }
.field-name { font-size: 13px; font-weight: 500; color: #1e293b; }
.field-count { font-size: 11px; color: #64748b; }

.field-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  max-width: 120px;
}

.field-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.field-percent {
  width: 45px;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  text-align: right;
}

/* Missing Tags */
.missing-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 12px;
  font-size: 10px;
  margin: 2px 4px 2px 0;
}

.missing-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 10px;
  margin: 2px 4px 2px 0;
}

.missing-count {
  font-size: 14px;
  font-weight: 700;
  color: #ef4444;
}

/* Category Quality */
.category-quality-item {
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.category-quality-name {
  font-weight: 500;
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 4px;
}

.category-quality-bar {
  display: flex;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.category-quality-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.category-quality-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.category-quality-stats .complete { color: #10b981; }
.category-quality-stats .partial { color: #f59e0b; }
.category-quality-stats .missing { color: #ef4444; }

.category-quality-score {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  margin-top: 4px;
}

/* Conflict Items */
.conflict-item {
  background: #fef2f2;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

.conflict-avatar { background: #dc2626; }

.conflict-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.balance-diff {
  font-size: 11px;
  padding: 2px 8px;
  background: #fee2e2;
  border-radius: 12px;
  color: #991b1b;
}

/* Date Diff Items */
.date-diff-item {
  background: #f5f3ff;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

.date-diff-avatar { background: #8b5cf6; }

.date-diff-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.date-group {
  font-size: 11px;
  padding: 2px 8px;
  background: #ede9fe;
  border-radius: 12px;
  color: #6d28d9;
}

.date-diff-badge {
  font-size: 12px;
  font-weight: 600;
  color: #8b5cf6;
  padding: 4px 12px;
  background: #ede9fe;
  border-radius: 20px;
}

/* Outlier Items */
.outlier-item {
  background: #fffbeb;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

.outlier-avatar { background: #f59e0b; }

.outlier-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.balance-outlier {
  font-size: 11px;
  padding: 2px 8px;
  background: #fef3c7;
  border-radius: 12px;
  color: #92400e;
}

/* Matched Items */
.matched-item {
  padding: 8px 0;
}

.matched-avatar { background: #10b981; }

.matched-balance {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
  margin-top: 2px;
}

/* Buttons */
.btn-small {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-small.success { background: #10b981; color: white; }
.btn-small.success:hover { background: #059669; }

.btn-small.danger { background: #ef4444; color: white; }
.btn-small.danger:hover { background: #dc2626; }

.btn-small.warning { background: #f59e0b; color: white; }
.btn-small.warning:hover { background: #d97706; }

.btn-small.info { background: #3b82f6; color: white; }
.btn-small.info:hover { background: #2563eb; }

/* Empty State */
.empty-state-small {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 13px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
}

.toast.error { border-left-color: #ef4444; }
.toast.warning { border-left-color: #f59e0b; }
.toast.info { border-left-color: #3b82f6; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .two-column-layout { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .checker-dashboard { padding: 16px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { width: 100%; justify-content: space-between; }
  .list-item { flex-wrap: wrap; }
}
</style>