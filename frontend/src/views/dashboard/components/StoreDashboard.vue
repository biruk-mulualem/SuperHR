<template>
  <div class="store-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <div>
          <h1>🏪 Store Dashboard</h1>
          <p>Inventory Management & Stock Monitoring</p>
        </div>
      </div>
      <div class="header-right">
        <div class="date-display">
          <span class="date-icon">📅</span>
          <span class="date-text">{{ formatDate(new Date()) }}</span>
        </div>
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span v-else class="spinner-small"></span>
          <span class="btn-text">{{ loading ? '' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading store data...</p>
    </div>

    <template v-else>
      <!-- ==================== SECTION 1: STOCK SUMMARY ==================== -->
      <div class="section-title">
        <h2>📊 Stock Summary</h2>
        <span class="section-subtitle">Real-time inventory overview</span>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stockSummary.totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ stockSummary.totalStockIn }}</div>
          <div class="stat-label">Total Stock In</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">{{ stockSummary.totalStockOut }}</div>
          <div class="stat-label">Total Stock Out</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">{{ stockSummary.zeroStock }}</div>
          <div class="stat-label">Zero Balance</div>
          <div class="stat-sub">🚨 {{ stockSummary.zeroStockPercentage }}% of total</div>
        </div>
        <div class="stat-card critical">
          <div class="stat-value">{{ stockSummary.minStockAlert }}</div>
          <div class="stat-label">Min Stock Alert</div>
          <div class="stat-sub">🔔 Items below minimum</div>
        </div>
        <div class="stat-card info">
          <div class="stat-value">{{ stockSummary.pendingRequests }}</div>
          <div class="stat-label">Pending Requests</div>
          <div class="stat-sub">📋 Approved not processed</div>
        </div>
      </div>

      <!-- ==================== SECTION 2: ANALYSIS BY CATEGORY ==================== -->
      <div class="section-title">
        <h2>📂 Analysis by Category</h2>
        <span class="section-subtitle">Stock distribution across categories</span>
      </div>

      <div class="category-analysis-grid">
        <div v-for="cat in categoryAnalysis" :key="cat.name" class="category-card">
          <div class="category-header">
            <span class="category-name">{{ cat.name }}</span>
            <span class="category-total">{{ cat.total }} items</span>
          </div>
          <div class="category-bar-container">
            <div class="category-bar">
              <div class="category-fill in-stock" :style="{ width: cat.inStockPercent + '%', background: '#10b981' }" 
                   :title="'In Stock: ' + cat.inStock + ' (' + cat.inStockPercent + '%)'"></div>
              <div class="category-fill low-stock" :style="{ width: cat.lowStockPercent + '%', background: '#f59e0b' }"
                   :title="'Low Stock: ' + cat.lowStock + ' (' + cat.lowStockPercent + '%)'"></div>
              <div class="category-fill zero-stock" :style="{ width: cat.zeroStockPercent + '%', background: '#ef4444' }"
                   :title="'Zero Stock: ' + cat.zeroStock + ' (' + cat.zeroStockPercent + '%)'"></div>
            </div>
          </div>
          <div class="category-legend">
            <span class="legend-item"><span class="dot green"></span> In: {{ cat.inStock }}</span>
            <span class="legend-item"><span class="dot yellow"></span> Low: {{ cat.lowStock }}</span>
            <span class="legend-item"><span class="dot red"></span> Zero: {{ cat.zeroStock }}</span>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 3: STOCK HEALTH ==================== -->
      <div class="section-title">
        <h2>📊 Stock Health Overview</h2>
        <span class="section-subtitle">Overall inventory health status</span>
      </div>

      <div class="stock-health-grid">
        <div class="health-card healthy">
          <div class="health-icon">✅</div>
          <div class="health-info">
            <span class="health-number">{{ stockHealth.healthy }}</span>
            <span class="health-label">Healthy Stock</span>
          </div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: stockHealth.healthyPercent + '%', background: '#10b981' }"></div>
          </div>
          <span class="health-percent">{{ stockHealth.healthyPercent }}%</span>
        </div>
        <div class="health-card warning">
          <div class="health-icon">⚠️</div>
          <div class="health-info">
            <span class="health-number">{{ stockHealth.lowStock }}</span>
            <span class="health-label">Low Stock</span>
          </div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: stockHealth.lowStockPercent + '%', background: '#f59e0b' }"></div>
          </div>
          <span class="health-percent">{{ stockHealth.lowStockPercent }}%</span>
        </div>
        <div class="health-card danger">
          <div class="health-icon">🚨</div>
          <div class="health-info">
            <span class="health-number">{{ stockHealth.zeroStock }}</span>
            <span class="health-label">Zero Stock</span>
          </div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: stockHealth.zeroStockPercent + '%', background: '#ef4444' }"></div>
          </div>
          <span class="health-percent">{{ stockHealth.zeroStockPercent }}%</span>
        </div>
      </div>

      <!-- ==================== SECTION 4: LOW STOCK ALERTS ==================== -->
      <div class="section-title">
        <h2>🔔 Low Stock Alerts</h2>
        <span class="section-subtitle">Items that have passed their minimum stock level</span>
      </div>

      <div class="section-card alert-card warning">
        <div class="section-header">
          <h3>⚠️ Items Below Minimum Stock</h3>
          <span class="badge warning">{{ lowStockAlerts.length }}</span>
        </div>
        <div class="scroll-container">
          <div v-if="lowStockAlerts.length === 0" class="empty-state-small">✅ No low stock alerts</div>
          <div v-else class="item-list">
            <div v-for="item in lowStockAlerts" :key="item.id" class="list-item alert-item low">
              <div class="list-avatar alert-avatar">{{ getInitials(item.name) }}</div>
              <div class="list-info">
                <div class="list-name">{{ item.name }}</div>
                <div class="list-detail">{{ item.code }} • {{ item.category }}</div>
                <div class="alert-details">
                  <span class="current-stock">Current: {{ item.currentStock }} {{ item.uom }}</span>
                  <span class="min-stock">Min: {{ item.minStock }} {{ item.uom }}</span>
                  <span class="shortage">Shortage: {{ item.minStock - item.currentStock }} {{ item.uom }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="lowStockAlerts.length > 5" class="scroll-indicator">▼ Scroll for more</div>
        </div>
      </div>

      <!-- ==================== SECTION 5: PENDING REQUESTS ==================== -->
      <div class="section-title">
        <h2>📋 Pending Requests</h2>
        <span class="section-subtitle">Approved requests waiting to be processed</span>
      </div>

      <div class="section-card alert-card info">
        <div class="section-header">
          <h3>📋 Approved Requests Not Processed</h3>
          <span class="badge info">{{ pendingRequestsList.length }}</span>
        </div>
        <div class="scroll-container">
          <div v-if="pendingRequestsList.length === 0" class="empty-state-small">✅ No pending requests</div>
          <div v-else class="item-list">
            <div v-for="request in pendingRequestsList" :key="request.id" class="list-item request-item">
              <div class="list-avatar request-avatar">{{ getInitials(request.requestedBy) }}</div>
              <div class="list-info">
                <div class="list-name">{{ request.requestCode }}</div>
                <div class="list-detail">{{ request.item }} • {{ request.quantity }} {{ request.uom }}</div>
                <div class="list-date">Requested: {{ formatDate(request.requestedDate) }}</div>
              </div>
              <button class="btn-small success" @click="processRequest(request)">Process</button>
            </div>
          </div>
          <div v-if="pendingRequestsList.length > 5" class="scroll-indicator">▼ Scroll for more</div>
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
import { ref, onMounted } from 'vue'

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastIcon = ref('✅')

// ================================================================
// STOCK SUMMARY
// ================================================================

const stockSummary = ref({
  totalItems: 284,
  totalStockIn: 1247,
  totalStockOut: 892,
  zeroStock: 31,
  zeroStockPercentage: 11,
  minStockAlert: 38,
  pendingRequests: 12
})

// ================================================================
// STOCK HEALTH
// ================================================================

const stockHealth = ref({
  healthy: 197,
  lowStock: 42,
  zeroStock: 31,
  healthyPercent: 69,
  lowStockPercent: 15,
  zeroStockPercent: 11
})

// ================================================================
// CATEGORY ANALYSIS
// ================================================================

const categoryAnalysis = ref([
  { name: 'Paint', total: 45, inStock: 28, lowStock: 10, zeroStock: 7, inStockPercent: 62, lowStockPercent: 22, zeroStockPercent: 16 },
  { name: 'Raw Materials', total: 38, inStock: 22, lowStock: 8, zeroStock: 8, inStockPercent: 58, lowStockPercent: 21, zeroStockPercent: 21 },
  { name: 'Tools', total: 32, inStock: 24, lowStock: 5, zeroStock: 3, inStockPercent: 75, lowStockPercent: 16, zeroStockPercent: 9 },
  { name: 'Lubricants', total: 28, inStock: 18, lowStock: 6, zeroStock: 4, inStockPercent: 64, lowStockPercent: 21, zeroStockPercent: 14 },
  { name: 'Chemicals', total: 24, inStock: 14, lowStock: 4, zeroStock: 6, inStockPercent: 58, lowStockPercent: 17, zeroStockPercent: 25 },
  { name: 'Supplies', total: 22, inStock: 18, lowStock: 3, zeroStock: 1, inStockPercent: 82, lowStockPercent: 14, zeroStockPercent: 5 }
])

// ================================================================
// LOW STOCK ALERTS
// ================================================================

const lowStockAlerts = ref([
  { id: 1, name: 'Lacquer Thinner', code: 'SDT000001', category: 'Paint', currentStock: 5, minStock: 20, uom: 'DRUM' },
  { id: 2, name: 'Industrial Oil', code: 'SDT000015', category: 'Lubricants', currentStock: 8, minStock: 25, uom: 'LTR' },
  { id: 3, name: 'Steel Sheets', code: 'SDT000023', category: 'Raw Materials', currentStock: 12, minStock: 30, uom: 'PCS' },
  { id: 4, name: 'Welding Rods', code: 'SDT000045', category: 'Tools', currentStock: 3, minStock: 15, uom: 'BOX' },
  { id: 5, name: 'Paint Brushes', code: 'SDT000067', category: 'Tools', currentStock: 7, minStock: 20, uom: 'PCS' },
  { id: 6, name: 'Primer Paint', code: 'SDT000134', category: 'Paint', currentStock: 4, minStock: 15, uom: 'DRUM' },
  { id: 7, name: 'Sandpaper Grit 80', code: 'SDT000089', category: 'Tools', currentStock: 2, minStock: 10, uom: 'PCS' }
])

// ================================================================
// PENDING REQUESTS
// ================================================================

const pendingRequestsList = ref([
  { id: 1, requestCode: 'REQ-260719-006', item: 'Lacquer Thinner', quantity: 10, uom: 'DRUM', requestedBy: 'Biruk Mulualem', requestedDate: '2026-07-19' },
  { id: 2, requestCode: 'REQ-260719-007', item: 'Industrial Oil', quantity: 20, uom: 'LTR', requestedBy: 'Dagmawi Hadgu', requestedDate: '2026-07-19' },
  { id: 3, requestCode: 'REQ-260719-008', item: 'Steel Sheets', quantity: 5, uom: 'PCS', requestedBy: 'Eshete Worke', requestedDate: '2026-07-18' },
  { id: 4, requestCode: 'REQ-260719-009', item: 'Welding Rods', quantity: 10, uom: 'BOX', requestedBy: 'Melaku Tewodros', requestedDate: '2026-07-18' },
  { id: 5, requestCode: 'REQ-260719-010', item: 'Paint Brushes', quantity: 8, uom: 'PCS', requestedBy: 'Tigist Mulugeta', requestedDate: '2026-07-17' },
  { id: 6, requestCode: 'REQ-260719-011', item: 'Primer Paint', quantity: 15, uom: 'DRUM', requestedBy: 'Haymanot Abebaw', requestedDate: '2026-07-17' }
])

// ================================================================
// METHODS
// ================================================================

function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function processRequest(request) {
  showToastMessage(`Processing request ${request.requestCode}...`, 'info')
  pendingRequestsList.value = pendingRequestsList.value.filter(r => r.id !== request.id)
}

function refreshData() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    showToastMessage('Dashboard refreshed successfully!', 'success')
  }, 1500)
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = type === 'success' ? '✅' : (type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : 'ℹ️'))
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style scoped>
.store-dashboard {
  min-height: 100vh;
  background: #f5f7fb;
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
  background: linear-gradient(135deg, #f59e0b, #d97706);
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

/* ================================================================
   REFRESH BUTTON - VISIBLE
   ================================================================ */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.refresh-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.refresh-btn svg {
  stroke: white;
  flex-shrink: 0;
}

.spinner-small {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

.btn-text {
  font-size: 13px;
  font-weight: 500;
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
   LOADING STATE
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
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

/* ================================================================
   STATS GRID
   ================================================================ */
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
.stat-card.danger .stat-value { color: #ef4444; }
.stat-card.warning .stat-value { color: #f59e0b; }
.stat-card.critical .stat-value { color: #8b5cf6; }
.stat-card.info .stat-value { color: #3b82f6; }

/* ================================================================
   CATEGORY ANALYSIS GRID
   ================================================================ */
.category-analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.category-card {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.category-total {
  font-size: 12px;
  color: #64748b;
}

.category-bar-container {
  margin-bottom: 8px;
}

.category-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  transition: width 0.3s;
}

.category-legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.green { background: #10b981; }
.dot.yellow { background: #f59e0b; }
.dot.red { background: #ef4444; }

/* ================================================================
   STOCK HEALTH GRID
   ================================================================ */
.stock-health-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.health-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  text-align: center;
}

.health-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.health-info {
  margin-bottom: 12px;
}

.health-number {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.health-label {
  font-size: 12px;
  color: #64748b;
}

.health-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.health-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.health-percent {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.health-card.healthy .health-percent { color: #10b981; }
.health-card.warning .health-percent { color: #f59e0b; }
.health-card.danger .health-percent { color: #ef4444; }

/* ================================================================
   SECTION CARDS
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alert-card {
  border-left: 4px solid transparent;
}

.alert-card.warning { border-left-color: #f59e0b; }
.alert-card.info { border-left-color: #3b82f6; }

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

.badge.warning { background: #fef3c7; color: #92400e; }
.badge.info { background: #dbeafe; color: #1e40af; }

/* ================================================================
   SCROLL CONTAINER
   ================================================================ */
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

/* ================================================================
   ITEM LIST
   ================================================================ */
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
  background: linear-gradient(135deg, #f59e0b, #d97706);
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

.list-date {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* ================================================================
   ALERT ITEMS
   ================================================================ */
.alert-item.low {
  background: #fffbeb;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

.alert-avatar {
  background: #f59e0b;
}

.alert-details {
  display: flex;
  gap: 12px;
  font-size: 11px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.alert-details .current-stock { color: #1e293b; font-weight: 500; }
.alert-details .min-stock { color: #94a3b8; }
.alert-details .shortage { color: #dc2626; font-weight: 600; }

/* ================================================================
   REQUEST ITEMS
   ================================================================ */
.request-item {
  background: #f0fdf4;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

.request-avatar { background: #10b981; }

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-small {
  padding: 4px 12px;
  font-size: 11px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.btn-small.success { background: #10b981; color: white; }
.btn-small.success:hover { background: #059669; }

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state-small {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 13px;
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
  to { transform: translateX(0%); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .category-analysis-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .store-dashboard { padding: 16px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .category-analysis-grid { grid-template-columns: 1fr; }
  .stock-health-grid { grid-template-columns: 1fr; }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { 
    width: 100%; 
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .list-item { flex-wrap: wrap; }
  .alert-details { flex-direction: column; gap: 4px; }
  .refresh-btn {
    padding: 6px 14px;
    font-size: 12px;
  }
  .btn-text {
    font-size: 12px;
  }
}
</style>