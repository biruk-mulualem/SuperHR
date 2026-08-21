<!-- views/storemanagement/StoreDashboard.vue -->
<template>
  <div class="store-dashboard">
    <!-- ==================== HEADER ==================== -->
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
          <span class="date-text">{{ currentDate }}</span>
        </div>
        <div class="header-actions">
          <button class="btn-export" @click="exportDashboard" :disabled="exporting">
            <span v-if="exporting" class="spinner-small"></span>
            <span v-else>📊</span>
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>
          <button class="refresh-btn" @click="refreshData" :disabled="loading">
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span v-else class="spinner-small"></span>
            <span class="btn-text">{{ loading ? 'Loading...' : 'Refresh' }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ==================== LOADING STATE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <template v-else>
    

      <!-- ==================== ALERT BANNER ==================== -->
      <!-- ==================== ALERT BANNER ==================== -->
<div v-if="totalAlerts > 0" class="alert-banner critical">
  <span class="alert-icon">🚨</span>
  <span class="alert-message">
    <strong>{{ totalAlerts }}</strong> item(s) need attention:
    <span class="alert-detail">
      <!-- <span class="alert-critical">{{ criticalAlerts.length }} zero stock</span> -->
      <span v-if="warningAlerts.length > 0" class="alert-warning">
        • {{ warningAlerts.length }} low stock
      </span>
    </span>
    <span class="alert-action" @click="scrollToLowStock">View and restock →</span>
  </span>
</div>
      <div v-else-if="warningAlerts.length > 0" class="alert-banner warning">
        <span class="alert-icon">⚠️</span>
        <span class="alert-message">
          <strong>{{ warningAlerts.length }}</strong> item(s) are below minimum stock level.
          <span class="alert-action" @click="scrollToLowStock">View alerts →</span>
        </span>
      </div>

      <!-- ==================== SECTION 1: STOCK SUMMARY ==================== -->
      <div class="section-title">
        <h2>📊 Stock Summary</h2>
        <span class="section-subtitle">Real-time inventory overview</span>
      </div>

      <div class="stats-grid">
        <div class="stat-card" @click="navigateTo('store-balance')" style="cursor:pointer">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ stockSummary.totalItems || 0 }}</div>
            <div class="stat-label">Total Items</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">📥</div>
          <div class="stat-content">
            <div class="stat-value">{{ stockSummary.totalStockIn || 0 }}</div>
            <div class="stat-label">Total Stock In</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon">📤</div>
          <div class="stat-content">
            <div class="stat-value">{{ stockSummary.totalStockOut || 0 }}</div>
            <div class="stat-label">Total Stock Out</div>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stockSummary.pendingRequests || 0 }}</div>
            <div class="stat-label">Approved Requests</div>
            <div class="stat-sub">Awaiting Process</div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 2: QUICK LINKS ==================== -->
      <div class="section-title">
        <h2>🔗 Quick Actions</h2>
        <span class="section-subtitle">Navigate to management pages</span>
      </div>

      <div class="quick-actions-grid">
        <div class="quick-action-card" @click="navigateTo('store-balance')">
          <span class="quick-icon">💰</span>
          <div class="quick-content">
            <h3>Store Balance</h3>
            <p>View and manage item balances</p>
            <span class="quick-badge">{{ stockSummary.totalItems || 0 }} items</span>
          </div>
          <span class="quick-arrow">→</span>
        </div>
        <div class="quick-action-card" @click="navigateTo('store-transaction')">
          <span class="quick-icon">📋</span>
          <div class="quick-content">
            <h3>Store Transactions</h3>
            <p>View stock movement history</p>
            <span class="quick-badge">{{ transactionStats.total || 0 }} transactions</span>
          </div>
          <span class="quick-arrow">→</span>
        </div>
        <div class="quick-action-card" @click="navigateTo('item-requests')">
          <span class="quick-icon">📦</span>
          <div class="quick-content">
            <h3>Item Requests</h3>
            <p>Manage stock requests</p>
            <span class="quick-badge">{{ stockSummary.pendingRequests || 0 }} waiting Process</span>
          </div>
          <span class="quick-arrow">→</span>
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
            <span class="health-number">{{ stockHealth.healthy || 0 }}</span>
            <span class="health-label">Healthy Stock</span>
          </div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: (stockHealth.healthyPercent || 0) + '%', background: '#10b981' }"></div>
          </div>
          <span class="health-percent">{{ stockHealth.healthyPercent || 0 }}%</span>
        </div>
        <div class="health-card warning" @click="scrollToLowStock" style="cursor:pointer">
          <div class="health-icon">⚠️</div>
          <div class="health-info">
            <span class="health-number">{{ stockHealth.lowStock || 0 }}</span>
            <span class="health-label">Low Stock</span>
          </div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: (stockHealth.lowStockPercent || 0) + '%', background: '#f59e0b' }"></div>
          </div>
          <span class="health-percent">{{ stockHealth.lowStockPercent || 0 }}%</span>
        </div>
        <div class="health-card danger" @click="navigateTo('store-balance')" style="cursor:pointer">
          <div class="health-icon">🚨</div>
          <div class="health-info">
            <span class="health-number">{{ stockHealth.zeroStock || 0 }}</span>
            <span class="health-label">Zero Stock</span>
          </div>
          <div class="health-bar">
            <div class="health-fill" :style="{ width: (stockHealth.zeroStockPercent || 0) + '%', background: '#ef4444' }"></div>
          </div>
          <span class="health-percent">{{ stockHealth.zeroStockPercent || 0 }}%</span>
        </div>
      </div>

      <!-- ==================== SECTION 4: RECENT TRANSACTIONS ==================== -->
      <div class="section-title">
        <h2>🔄 Recent Transactions</h2>
        <span class="section-subtitle">Latest stock movements</span>
      </div>

      <div class="section-card">
        <div class="table-container">
        <!-- Find the recent transactions table and add the item code column -->
<table class="mini-table">
  <thead>
    <tr>
      <th>Date</th>
      <th>Item Code</th>  <!-- ✅ Added -->
      <th>Item</th>
      <th>Type</th>
      <th>Quantity</th>
    </tr>
  </thead>
  <tbody>
    <tr v-if="recentTransactions.length === 0">
      <td colspan="5" class="empty-state-small">No recent transactions</td>
    </tr>
    <tr v-for="tx in recentTransactions" :key="tx.id">
      <td>{{ formatDateShort(tx.createdAt) }}</td>
      <td><span class="item-code-tag">{{ tx.itemCode || 'N/A' }}</span></td>  <!-- ✅ Added -->
      <td>{{ tx.itemName }}</td>
      <td>
        <span :class="['type-badge', tx.type === 'Stock In' ? 'stock-in' : 'stock-out']">
          {{ tx.type === 'Stock In' ? '📥 In' : '📤 Out' }}
        </span>
      </td>
      <td :class="tx.type === 'Stock In' ? 'positive' : 'negative'">
        {{ tx.type === 'Stock In' ? '+' : '-' }}{{ formatNumber(tx.quantity) }}
      </td>
    </tr>
  </tbody>
</table>
        </div>
        <div class="view-all-link" @click="navigateTo('store-transaction')">
          View All Transactions →
        </div>
      </div>

      <!-- ==================== SECTION 5: HIGH & LOW MOVING ITEMS ==================== -->
      <div class="section-title">
        <h2>📈 Item Movement Analysis</h2>
        <span class="section-subtitle">High moving vs low moving items by transaction level</span>
      </div>

      <!-- DATE FILTER ONLY FOR MOVING ITEMS -->
      <div class="movement-filter-section">
        <div class="movement-filter-wrapper">
          <label class="movement-filter-label">📅 Date Range:</label>
          <select v-model="movementDateRange" class="movement-filter-select" @change="onMovementDateChange">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="all">All Time</option>
          </select>
          <span class="movement-filter-hint" v-if="movementDateRange !== 'all'">
            📊 Showing data for: {{ getDateRangeLabel(movementDateRange) }}
          </span>
        </div>
      </div>

      <!-- Chart Legend -->
      <div class="chart-legend">
        <div class="chart-legend-item">
          <span class="legend-color high"></span>
          <span class="legend-label">High Moving Items (Top 10)</span>
          <span class="legend-count">{{ highTransactionItems.length }}</span>
        </div>
        <div class="chart-legend-item">
          <span class="legend-color low"></span>
          <span class="legend-label">Low Moving Items (Bottom 10)</span>
          <span class="legend-count">{{ lowTransactionItems.length }}</span>
        </div>
        <div class="chart-legend-item">
          <span class="legend-color grouped"></span>
          <span class="legend-label">Multiple items with same transaction count</span>
          <span class="legend-count">{{ groupedItemsCount }}</span>
        </div>
      </div>

      <div class="movement-charts-grid">
        <!-- High Moving Items Chart -->
        <div class="movement-chart-card high-chart full-width">
          <div class="chart-header">
            <span class="chart-icon">🔥</span>
            <span class="chart-title">High Moving Items</span>
            <span class="chart-badge">{{ highTransactionItems.length }}</span>
          </div>
          <div class="chart-body">
            <div v-if="!highTransactionItems || highTransactionItems.length === 0" class="empty-state-small">
              No data available for the selected date range
            </div>
            <div v-else-if="groupedHighItems.length === 0" class="empty-state-small">
              No items with transactions
            </div>
            <div v-else class="chart-bars">
              <div 
                v-for="(group, index) in groupedHighItems" 
                :key="group.transactionCount" 
                class="chart-bar-row grouped-row"
                :style="{ animationDelay: (index * 0.05) + 's' }"
              >
                <div class="chart-bar-info">
                  <span class="chart-bar-rank">{{ index + 1 }}</span>
                  <div class="chart-bar-name-wrapper" :title="group.itemNames.join(', ')">
                    <span class="chart-bar-name">
                      {{ group.itemNames.length === 1 ? group.itemNames[0] : group.itemNames[0] + ' +' + (group.itemNames.length - 1) }}
                    </span>
                    <span class="chart-bar-code" v-if="group.items && group.items.length > 1">
                      ({{ group.items.length }} items)
                    </span>
                  </div>
                </div>
                <div class="chart-bar-track">
                  <div 
                    class="chart-bar-fill high-fill" 
                    :style="{ 
                      width: getBarWidth(group.transactionCount, maxTransactions) + '%',
                      background: `linear-gradient(90deg, #f59e0b, #d97706)`
                    }"
                  >
                    <span class="chart-bar-value">{{ group.transactionCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-footer">
            <span class="chart-total">Total: {{ highTransactionItems.reduce((sum, i) => sum + (i.transactions || 0), 0) }} transactions</span>
            <span class="chart-action" @click="navigateTo('store-transaction')">View All →</span>
          </div>
        </div>

        <!-- Low Moving Items Chart -->
        <div class="movement-chart-card low-chart full-width">
          <div class="chart-header">
            <span class="chart-icon">❄️</span>
            <span class="chart-title">Low Moving Items</span>
            <span class="chart-badge low">{{ lowTransactionItems.length }}</span>
          </div>
          <div class="chart-body">
            <div v-if="!lowTransactionItems || lowTransactionItems.length === 0" class="empty-state-small">
              No data available for the selected date range
            </div>
            <div v-else-if="groupedLowItems.length === 0" class="empty-state-small">
              No items with transactions
            </div>
            <div v-else class="chart-bars">
              <div 
                v-for="(group, index) in groupedLowItems" 
                :key="group.transactionCount" 
                class="chart-bar-row grouped-row"
                :style="{ animationDelay: (index * 0.05) + 's' }"
              >
                <div class="chart-bar-info">
                  <span class="chart-bar-rank">{{ index + 1 }}</span>
                  <div class="chart-bar-name-wrapper" :title="group.itemNames.join(', ')">
                    <span class="chart-bar-name">
                      {{ group.itemNames.length === 1 ? group.itemNames[0] : group.itemNames[0] + ' +' + (group.itemNames.length - 1) }}
                    </span>
                    <span class="chart-bar-code" v-if="group.items && group.items.length > 1">
                      ({{ group.items.length }} items)
                    </span>
                  </div>
                </div>
                <div class="chart-bar-track">
                  <div 
                    class="chart-bar-fill low-fill" 
                    :style="{ 
                      width: getBarWidth(group.transactionCount, maxLowTransactions) + '%',
                      background: `linear-gradient(90deg, #3b82f6, #6366f1)`
                    }"
                  >
                    <span class="chart-bar-value">{{ group.transactionCount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-footer">
            <span class="chart-total">Total: {{ lowTransactionItems.reduce((sum, i) => sum + (i.transactions || 0), 0) }} transactions</span>
            <span class="chart-action" @click="navigateTo('store-transaction')">View All →</span>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 6: LOW STOCK ALERTS ==================== -->
    <div class="section-title" id="low-stock-section">
  <h2>🔔 Stock Alerts</h2>

</div>

      <div class="section-card alert-card warning">
        <div class="section-header">
          <h3>⚠️ Items In critical Condition</h3>
          <span class="badge warning">{{ lowStockAlerts.length }} / {{ lowStockPagination.total }}</span>
        </div>
        
        <div 
          class="scroll-container" 
          @scroll="handleLowStockScroll"
          ref="lowStockContainer"
        >
          <div v-if="lowStockAlerts.length === 0" class="empty-state-small">
            ✅ No low stock alerts
          </div>
          <div v-else class="item-list">
            <div 
              v-for="item in lowStockAlerts" 
              :key="item.id" 
              class="list-item alert-item low"
            >
              <div class="list-avatar alert-avatar">{{ getInitials(item.name) }}</div>
              <div class="list-info">
                <div class="list-name">{{ item.name }}</div>
                <div class="list-detail">{{ item.code }} • {{ item.category }}</div>
                <div class="alert-details">
                  <span class="current-stock">Current: {{ item.currentStock }} {{ item.uom }}</span>
                  <span class="min-stock">Min: {{ item.minStock }} {{ item.uom }}</span>
                  <span class="shortage">Shortage: {{ item.shortage }} {{ item.uom }}</span>
                </div>
              </div>
              <button class="btn-quick-reorder" @click="quickReorder(item)">🔄 Reorder</button>
            </div>
            
            <div v-if="lowStockLoading" class="load-more-indicator">
              <span class="spinner-small"></span>
              <span>Loading more...</span>
            </div>
            
            <div v-else-if="lowStockLoadedAll && lowStockAlerts.length > 0" class="load-more-indicator">
              <span>✅ All {{ lowStockPagination.total }} alerts loaded</span>
            </div>
            
            <div 
              v-else-if="lowStockPagination.hasMore && !lowStockLoading" 
              class="load-more-button"
              @click="loadMoreLowStockAlerts"
            >
              <span>📥 Load {{ Math.min(10, lowStockPagination.total - lowStockAlerts.length) }} more</span>
              <span class="load-more-hint">(Scroll down to load more)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== SECTION 7: APPROVED REQUESTS ==================== -->
      <div class="section-title">
        <h2>📋 Approved Requests</h2>
        <span class="section-subtitle">Requests awaiting processing</span>
      </div>

      <div class="section-card alert-card info">
        <div class="section-header">
          <h3>📋 Approved Requests Awaiting Processing</h3>
          <span class="badge info">{{ pendingRequestsList.length }}</span>
        </div>
        <div class="scroll-container">
          <div v-if="pendingRequestsList.length === 0" class="empty-state-small">✅ No approved requests waiting</div>
          <div v-else class="item-list">
            <div v-for="request in pendingRequestsList.slice(0, 5)" :key="request.id" class="list-item request-item">
              <div class="list-avatar request-avatar">{{ getInitials(request.requestedBy) }}</div>
              <div class="list-info">
                <div class="list-name">{{ request.requestCode }}</div>
                <div class="list-detail">
                  <span v-for="(item, index) in request.items" :key="item.itemId">
                    {{ item.itemName }} ({{ item.quantity }} {{ item.uom }})
                  </span>
                </div>
                <div class="list-date">Requested: {{ formatDate(request.requestedDate) }}</div>
              </div>
          
              <button class="btn-process" @click="navigateTo('item-requests')">⚙️ Review</button>
            </div>
            <div v-if="pendingRequestsList.length > 5" class="view-more-link" @click="navigateTo('item-requests')">
              View all {{ pendingRequestsList.length }} approved requests →
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import storeDashboardService from '@/stores/storeDashboardService'
import { useAuthStore } from '@/stores/auth'
// Add to the imports at the top
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const exporting = ref(false)
const selectedStore = ref('all')
const selectedGroup = ref('all')
const movementDateRange = ref('week')



dayjs.extend(utc)
dayjs.extend(timezone)

// Dashboard data
const stockSummary = ref<any>({})
const stockHealth = ref<any>({})
const transactionStats = ref<any>({})
const recentTransactions = ref<any[]>([])
const lowStockAlerts = ref<any[]>([])
const pendingRequestsList = ref<any[]>([])
const categoryDistribution = ref<any[]>([])
const highTransactionItems = ref<any[]>([])
const lowTransactionItems = ref<any[]>([])
const stores = ref<any[]>([])
const groups = ref<any[]>([])
const lowStockContainer = ref<HTMLElement | null>(null)

// ✅ Low Stock Alerts Pagination
const lowStockPagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
})
const lowStockLoading = ref(false)
const lowStockLoadedAll = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

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

// Add this to your computed section
const totalAlerts = computed(() => {
  return lowStockPagination.value.total || 0;
})

const hasActiveFilters = computed(() => {
  return selectedStore.value !== 'all' || selectedGroup.value !== 'all'
})

const criticalAlerts = computed(() => {
  return lowStockAlerts.value.filter((item: any) => item.currentStock === 0)
})

const warningAlerts = computed(() => {
  return lowStockAlerts.value.filter((item: any) => item.currentStock > 0 && item.currentStock <= item.minStock)
})

// ✅ FIXED: Group items by transaction count for high moving items
const groupedHighItems = computed(() => {
  const groups = new Map<number, any[]>()
  
  if (!highTransactionItems.value || highTransactionItems.value.length === 0) {
    return []
  }
  
  highTransactionItems.value.forEach(item => {
    const key = item.transactions || 0
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  })
  
  return Array.from(groups.entries())
    .map(([transactionCount, items]) => ({
      transactionCount,
      items,
      itemNames: items.map(i => i.name || i.itemName || 'Unknown Item')
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 10)
})

// ✅ FIXED: Group items by transaction count for low moving items
const groupedLowItems = computed(() => {
  const groups = new Map<number, any[]>()
  
  if (!lowTransactionItems.value || lowTransactionItems.value.length === 0) {
    return []
  }
  
  lowTransactionItems.value.forEach(item => {
    const key = item.transactions || 0
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  })
  
  return Array.from(groups.entries())
    .map(([transactionCount, items]) => ({
      transactionCount,
      items,
      itemNames: items.map(i => i.name || i.itemName || 'Unknown Item')
    }))
    .sort((a, b) => a.transactionCount - b.transactionCount)
    .slice(0, 10)
})

// ✅ FIXED: maxTransactions
const maxTransactions = computed(() => {
  if (!highTransactionItems.value || highTransactionItems.value.length === 0) {
    return 1
  }
  const max = Math.max(...highTransactionItems.value.map((g: any) => g.transactions || 0), 1)
  return max
})

// ✅ FIXED: maxLowTransactions
const maxLowTransactions = computed(() => {
  if (!lowTransactionItems.value || lowTransactionItems.value.length === 0) {
    return 1
  }
  const max = Math.max(...lowTransactionItems.value.map((g: any) => g.transactions || 0), 1)
  return max
})

// ✅ FIXED: groupedItemsCount
const groupedItemsCount = computed(() => {
  let count = 0
  if (groupedHighItems.value) {
    groupedHighItems.value.forEach(group => {
      if (group.items && group.items.length > 1) count += group.items.length
    })
  }
  if (groupedLowItems.value) {
    groupedLowItems.value.forEach(group => {
      if (group.items && group.items.length > 1) count += group.items.length
    })
  }
  return count
})

// ================================================================
// METHODS
// ================================================================

// ✅ Get bar width for chart
const getBarWidth = (value: number, max: number): number => {
  if (max === 0) return 0
  return Math.max((value / max) * 100, 5)
}

const loadAllDashboardData = async () => {
  loading.value = true
  try {
    const storeId = authStore.userStoreId
    const groupId = authStore.userGroupId
    
    console.log('📍 Setting user context from auth store:', { storeId, groupId })
    
    if (storeId && groupId) {
      storeDashboardService.setUserContext(storeId, groupId)
    } else {
      console.warn('⚠️ No store or group found in auth store')
    }
    
    // ✅ Reset low stock pagination
    lowStockPagination.value.page = 1
    lowStockAlerts.value = []
    lowStockLoadedAll.value = false
    
    // Load all sections in parallel
    await Promise.all([
      loadStockSummary(),
      loadStockHealth(),
    
      loadLowStockAlerts(1),
      loadApprovedRequests(),
      loadRecentTransactions(),
      loadMovingItems(),
      loadTransactionStats(),
      loadFilterOptions()
    ])
    
    console.log('✅ All dashboard data loaded successfully')
  } catch (error) {
    console.error('❌ Failed to load dashboard data:', error)
    showToastMessage('Failed to load dashboard data', 'error')
  } finally {
    loading.value = false
  }
}

const loadStockSummary = async () => {
  try {
    const response = await storeDashboardService.getStockSummary()
    if (response.success) {
      stockSummary.value = response.data
    }
  } catch (error) {
    console.error('❌ Failed to load stock summary:', error)
  }
}

const loadStockHealth = async () => {
  try {
    const response = await storeDashboardService.getStockHealth()
    if (response.success) {
      stockHealth.value = response.data
    }
  } catch (error) {
    console.error('❌ Failed to load stock health:', error)
  }
}



const loadLowStockAlerts = async (page: number = 1) => {
  try {
    lowStockLoading.value = true
    const limit = 10
    
    const response = await storeDashboardService.getLowStockAlerts(limit, page)
    
    if (response.success) {
      const data = response.data
      
      if (page === 1) {
        lowStockAlerts.value = data.alerts
      } else {
        lowStockAlerts.value = [...lowStockAlerts.value, ...data.alerts]
      }
      
      lowStockPagination.value = data.pagination
      lowStockLoadedAll.value = !data.pagination.hasMore
      
      console.log(`✅ Loaded ${data.alerts.length} alerts (page ${page})`)
    }
  } catch (error) {
    console.error('❌ Failed to load low stock alerts:', error)
  } finally {
    lowStockLoading.value = false
  }
}

const loadMoreLowStockAlerts = () => {
  if (!lowStockLoading.value && !lowStockLoadedAll.value && lowStockPagination.value.hasMore) {
    const nextPage = lowStockPagination.value.page + 1
    loadLowStockAlerts(nextPage)
  }
}

const handleLowStockScroll = (event: Event) => {
  const container = event.target as HTMLElement
  if (!container) return
  
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight
  
  if (scrollTop + clientHeight >= scrollHeight * 0.8) {
    loadMoreLowStockAlerts()
  }
}

const loadApprovedRequests = async () => {
  try {
    const response = await storeDashboardService.getApprovedRequests(10)
    if (response.success) {
      pendingRequestsList.value = response.data
    }
  } catch (error) {
    console.error('❌ Failed to load approved requests:', error)
  }
}

const loadRecentTransactions = async () => {
  try {
    const response = await storeDashboardService.getRecentTransactions(10)
    if (response.success) {
      recentTransactions.value = response.data
    }
  } catch (error) {
    console.error('❌ Failed to load recent transactions:', error)
  }
}

const loadMovingItems = async () => {
  try {
    const response = await storeDashboardService.getMovingItems(movementDateRange.value)
    if (response.success) {
      highTransactionItems.value = response.data.highMoving
      lowTransactionItems.value = response.data.lowMoving
      console.log('✅ High moving items:', highTransactionItems.value)
      console.log('✅ Low moving items:', lowTransactionItems.value)
    }
  } catch (error) {
    console.error('❌ Failed to load moving items:', error)
  }
}

const loadTransactionStats = async () => {
  try {
    const response = await storeDashboardService.getTransactionStats()
    if (response.success) {
      transactionStats.value = response.data
    }
  } catch (error) {
    console.error('❌ Failed to load transaction stats:', error)
  }
}

const loadFilterOptions = async () => {
  try {
    const response = await storeDashboardService.getFilterOptions()
    if (response.success) {
      stores.value = response.data.stores
      groups.value = response.data.groups
      
      if (response.data.userAccess.storeId) {
        selectedStore.value = response.data.userAccess.storeId.toString()
      }
      if (response.data.userAccess.groupId) {
        selectedGroup.value = response.data.userAccess.groupId.toString()
      }
    }
  } catch (error) {
    console.error('❌ Failed to load filter options:', error)
  }
}

const refreshData = async () => {
  showToastMessage('Refreshing dashboard...', 'info')
  await loadAllDashboardData()
  showToastMessage('Dashboard refreshed successfully!', 'success')
}

const exportDashboard = async () => {
  exporting.value = true
  try {
    const response = await storeDashboardService.exportDashboard(movementDateRange.value)
    if (response.success) {
      const dataStr = JSON.stringify(response.data, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      const exportFileDefaultName = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      showToastMessage('Dashboard exported successfully!', 'success')
    }
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export dashboard', 'error')
  } finally {
    exporting.value = false
  }
}

const getStoreName = (storeId: number): string => {
  return storeDashboardService.getStoreName(stores.value, storeId)
}

const getGroupName = (groupId: number): string => {
  return storeDashboardService.getGroupName(groups.value, groupId)
}

const getDateRangeLabel = (range: string): string => {
  return storeDashboardService.getDateRangeLabel(range)
}

const formatNumber = (num: number): string => {
  return storeDashboardService.formatNumber(num)
}

// ✅ FIXED - Converting UTC to local time (UTC+6 based on your system)
const formatDateShort = (dateString?: string): string => {
  if (!dateString) return ''
  return dayjs.utc(dateString)
    .add(6, 'hour')  // ✅ Your system shows UTC+6
    .format('MMM D, h:mm A')
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  return dayjs.utc(dateString)
    .add(6, 'hour')  // ✅ Your system shows UTC+6
    .format('MMM D, YYYY')
}

const getInitials = (name: string): string => {
  return storeDashboardService.getInitials(name)
}

const onFilterChange = () => {
  loadAllDashboardData()
}

const onMovementDateChange = () => {
  loadMovingItems()
  showToastMessage(`📅 Date range changed to: ${getDateRangeLabel(movementDateRange.value)}`, 'info')
}

const clearFilters = () => {
  selectedStore.value = 'all'
  selectedGroup.value = 'all'
  movementDateRange.value = 'week'
  loadAllDashboardData()
  showToastMessage('Filters cleared', 'info')
}

const navigateTo = (page: string) => {
  router.push(`/${page}`)
}

const scrollToLowStock = () => {
  const element = document.getElementById('low-stock-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const quickReorder = (item: any) => {
  showToastMessage(`Quick reorder initiated for ${item.name}`, 'info')
  router.push(`/item-requests?item=${item.id}`)
}

const showToastMessage = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  loadAllDashboardData()
})
</script>

<style scoped>
/* Add to the style section */
.item-code-tag {
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}
/* ================================================================
   PROCESS BUTTON - Fix styles
   ================================================================ */
.btn-process {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-process:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.btn-process:active {
  transform: scale(0.96);
}

.status-badge.approved {
  background: #dbeafe;
  color: #1e40af;
}

.request-item {
  background: #f0fdf4;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

.request-item .list-avatar {
  background: linear-gradient(135deg, #10b981, #059669);
}

/* ================================================================
   DASHBOARD CONTAINER
   ================================================================ */
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
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
   FILTER SECTION (Store & Group only)
   ================================================================ */
.filter-section {
  background: white;
  border-radius: 16px;
  padding: 16px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  white-space: nowrap;
}

.filter-select {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  min-width: 150px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.filter-hint {
  font-size: 12px;
  color: #2563eb;
  font-weight: 500;
  margin-left: 8px;
}

.btn-clear-filter {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
  white-space: nowrap;
  margin-left: auto;
}

.btn-clear-filter:hover {
  background: #e2e8f0;
}

/* ================================================================
   MOVEMENT FILTER SECTION
   ================================================================ */
.movement-filter-section {
  background: white;
  border-radius: 16px;
  padding: 12px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  border-left: 4px solid #8b5cf6;
}

.movement-filter-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.movement-filter-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  white-space: nowrap;
}

.movement-filter-select {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  min-width: 140px;
  cursor: pointer;
}

.movement-filter-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.movement-filter-hint {
  font-size: 12px;
  color: #8b5cf6;
  font-weight: 500;
}

/* ================================================================
   ALERT BANNER
   ================================================================ */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 14px;
}

.alert-banner.critical {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.alert-banner.warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #92400e;
}

.alert-icon {
  font-size: 20px;
}

.alert-message {
  flex: 1;
}

.alert-action {
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
}

.alert-action:hover {
  text-decoration: underline;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

.stat-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.stat-card.success .stat-value { color: #10b981; }
.stat-card.danger .stat-value { color: #ef4444; }
.stat-card.info .stat-value { color: #3b82f6; }

/* ================================================================
   QUICK ACTIONS
   ================================================================ */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.quick-action-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.quick-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.quick-content {
  flex: 1;
}

.quick-content h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.quick-content p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.quick-badge {
  display: inline-block;
  padding: 2px 10px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-top: 4px;
}

.quick-arrow {
  font-size: 20px;
  color: #94a3b8;
  transition: all 0.2s;
}

.quick-action-card:hover .quick-arrow {
  color: #f59e0b;
  transform: translateX(4px);
}

/* ================================================================
   STOCK HEALTH
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

.scroll-container {
  max-height: 280px;
  overflow-y: auto;
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

/* ================================================================
   MINI TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mini-table th,
.mini-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.mini-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.type-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.type-badge.stock-in {
  background: #dcfce7;
  color: #166534;
}

.type-badge.stock-out {
  background: #fee2e2;
  color: #991b1b;
}

.positive { color: #16a34a; font-weight: 600; }
.negative { color: #dc2626; font-weight: 600; }

.view-all-link {
  text-align: center;
  padding: 12px 0 4px;
  color: #3b82f6;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.view-more-link {
  text-align: center;
  padding: 8px 0;
  color: #3b82f6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-more-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* ================================================================
   MOVEMENT CHARTS - FULL WIDTH LAYOUT
   ================================================================ */
.movement-charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.movement-chart-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: all 0.2s;
  width: 100%;
}

.movement-chart-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.movement-chart-card.high-chart {
  border-top: 4px solid #f59e0b;
}

.movement-chart-card.low-chart {
  border-top: 4px solid #3b82f6;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.chart-icon {
  font-size: 20px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.chart-badge {
  background: #f59e0b;
  color: white;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.chart-badge.low {
  background: #3b82f6;
}

.chart-body {
  padding: 16px 20px;
  max-height: 400px;
  overflow-y: auto;
}

.chart-body::-webkit-scrollbar {
  width: 4px;
}

.chart-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.chart-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chart-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.4s ease forwards;
  opacity: 0;
  position: relative;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.chart-bar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  flex-shrink: 0;
}

.chart-bar-rank {
  font-weight: 700;
  color: #94a3b8;
  font-size: 12px;
  min-width: 24px;
  text-align: center;
}

.chart-bar-name-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 200px;
  overflow: hidden;
}

.chart-bar-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.chart-bar-code {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 400;
  white-space: nowrap;
}

.chart-bar-track {
  flex: 1;
  height: 28px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  min-width: 60px;
}

.chart-bar-fill {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: width 0.6s ease;
  min-width: 30px;
}

.chart-bar-fill.high-fill {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.chart-bar-fill.low-fill {
  background: linear-gradient(90deg, #3b82f6, #6366f1);
}

.chart-bar-value {
  font-size: 11px;
  font-weight: 600;
  color: white;
  z-index: 2;
  position: relative;
}

.chart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 12px;
}

.chart-total {
  color: #64748b;
}

.chart-action {
  color: #3b82f6;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-action:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* ================================================================
   CHART LEGEND
   ================================================================ */
.chart-legend {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  flex-wrap: wrap;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 8px;
  border-radius: 4px;
}

.legend-color.high {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.legend-color.low {
  background: linear-gradient(90deg, #3b82f6, #6366f1);
}

.legend-color.grouped {
  background: repeating-linear-gradient(
    45deg,
    #8b5cf6,
    #8b5cf6 4px,
    #a78bfa 4px,
    #a78bfa 8px
  );
}

.legend-count {
  background: #f1f5f9;
  padding: 0px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
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
}

.alert-avatar { background: linear-gradient(135deg, #f59e0b, #d97706); }
.request-avatar { background: linear-gradient(135deg, #10b981, #059669); }

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

.alert-item.low {
  background: #fffbeb;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
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

.request-item {
  background: #f0fdf4;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

/* ================================================================
   QUICK ACTION BUTTONS
   ================================================================ */
.btn-quick-reorder {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-quick-reorder:hover {
  background: #2563eb;
}

.btn-approve {
  background: #10b981;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-approve:hover {
  background: #059669;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

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
   LOAD MORE INDICATOR
   ================================================================ */
.load-more-indicator {
  text-align: center;
  padding: 16px;
  color: #64748b;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.load-more-indicator .spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.load-more-button {
  text-align: center;
  padding: 12px;
  margin-top: 8px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px dashed #e2e8f0;
}

.load-more-button:hover {
  background: #f1f5f9;
  border-color: #f59e0b;
}

.load-more-button span {
  display: block;
  color: #3b82f6;
  font-weight: 500;
  font-size: 13px;
}

.load-more-hint {
  color: #94a3b8 !important;
  font-weight: 400 !important;
  font-size: 11px !important;
  margin-top: 4px;
}

/* ================================================================
   CATEGORY DISTRIBUTION
   ================================================================ */
.category-table-container {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.category-mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.category-mini-table th,
.category-mini-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.category-mini-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
}

.number-cell {
  text-align: center;
  font-weight: 500;
}

.distribution-cell {
  min-width: 160px;
}

.mini-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.mini-fill {
  height: 100%;
  transition: width 0.3s;
}

.mini-fill.green { background: #10b981; }
.mini-fill.yellow { background: #f59e0b; }
.mini-fill.red { background: #ef4444; }

.percent-label {
  font-size: 10px;
  color: #94a3b8;
}

.percent-green { color: #10b981; font-weight: 600; }
.percent-yellow { color: #f59e0b; font-weight: 600; }
.percent-red { color: #ef4444; font-weight: 600; }

/* ================================================================
   LEGEND BOX
   ================================================================ */
.legend-box {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  display: inline-block;
  flex-shrink: 0;
}

.legend-dot.green { background: #10b981; }
.legend-dot.yellow { background: #f59e0b; }
.legend-dot.red { background: #ef4444; }

.legend-label {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.legend-desc {
  font-size: 11px;
  color: #64748b;
}

.legend-item.example {
  border-left: 2px solid #e2e8f0;
  padding-left: 16px;
}

.legend-example {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.legend-example-desc {
  font-size: 11px;
  color: #64748b;
}

.legend-note {
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
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
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .quick-actions-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 992px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .store-dashboard { padding: 16px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .quick-actions-grid { grid-template-columns: 1fr; }
  .stock-health-grid { grid-template-columns: 1fr; }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { width: 100%; justify-content: space-between; flex-wrap: wrap; }
  .filter-section { flex-direction: column; align-items: stretch; }
  .filter-wrapper { width: 100%; }
  .filter-select { width: 100%; min-width: unset; }
  .btn-clear-filter { margin-left: 0; width: 100%; justify-content: center; }
  .movement-filter-section { flex-direction: column; align-items: stretch; }
  .movement-filter-wrapper { width: 100%; }
  .movement-filter-select { width: 100%; min-width: unset; }
  .category-mini-table { font-size: 12px; }
  .distribution-cell { min-width: 120px; }
  .mini-table { font-size: 12px; }
  .legend-box { flex-direction: column; gap: 8px; }
  .legend-item.example { border-left: none; padding-left: 0; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  .header-actions { width: 100%; justify-content: stretch; }
  .btn-export { flex: 1; justify-content: center; }
  .refresh-btn { flex: 1; justify-content: center; }
  .chart-bar-info { min-width: 120px; }
  .chart-bar-name { max-width: 80px; font-size: 12px; }
  .chart-legend { flex-direction: column; gap: 8px; }
  .chart-bar-name-wrapper { max-width: 120px; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .section-title { flex-direction: column; align-items: flex-start; }
  .alert-details { flex-direction: column; gap: 4px; }
  .refresh-btn { padding: 6px 14px; font-size: 12px; }
  .list-item { flex-wrap: wrap; }
  .chart-bar-info { min-width: 100px; }
  .chart-bar-name { max-width: 60px; font-size: 11px; }
  .chart-bar-code { display: none; }
  .chart-bar-name-wrapper { max-width: 80px; }
}
</style>