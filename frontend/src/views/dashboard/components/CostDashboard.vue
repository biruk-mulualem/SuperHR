<!-- views/cost/CostDashboard.vue -->
<template>
  <div class="cost-dashboard">
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
          <h1>💰 Cost Dashboard</h1>
          <p>Inventory Cost Analysis & Monitoring</p>
        </div>
      </div>
      <div class="header-right">
        <div class="date-display">
          <span class="date-icon">📅</span>
          <span class="date-text">{{ currentDate }}</span>
        </div>
        <div class="header-actions">
          <button class="btn-info" @click="goToRules" title="How costs are calculated">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>Rules</span>
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

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading cost dashboard...</p>
    </div>

    <template v-else>
      <!-- ==================== SUMMARY STATS CARDS ==================== -->
      <div class="section-title">
        <h2>📊 Cost Summary</h2>
        <span class="section-subtitle">Real-time inventory cost overview</span>
      </div>

      <div class="stats-grid">
        <div class="stat-card" @click="navigateTo('item-cost')" style="cursor:pointer">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(summary.totalItems) }}</div>
            <div class="stat-label">Total Items</div>
            <div class="stat-sub">With active balances</div>
          </div>
        </div>
        <div class="stat-card danger" @click="scrollToZeroCost" style="cursor:pointer">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(summary.zeroCostItems) }}</div>
            <div class="stat-label">Items with Zero Cost</div>
            <div class="stat-sub">Need cost assignment</div>
          </div>
        </div>
        <div class="stat-card info" style="flex: 2;">
          <div class="stat-content">
            <div class="stat-value">ETB {{ formatCurrency(summary.totalCost) }}</div>
            <div class="stat-label">Total Inventory Cost</div>
            <div class="stat-sub">{{ formatNumber(summary.itemsWithCost || 0) }} items with cost</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(summary.excludedByConflict) }}</div>
            <div class="stat-label">Excluded (Conflict)</div>
            <div class="stat-sub">Store balance disagreements</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(summary.excludedByData) }}</div>
            <div class="stat-label">Excluded (Incomplete)</div>
            <div class="stat-sub">Missing conversion data</div>
          </div>
        </div>
      </div>

      <!-- ==================== COST BY STORE - FULL WIDTH ==================== -->
      <div class="section-title">
        <div class="section-title-left">
          <h2>🏪 Cost by Store</h2>
          <span class="section-subtitle">Inventory cost distribution across stores</span>
        </div>
        <div class="section-title-right">
          <span class="store-total-badge">
            Total: ETB {{ formatCurrency(storeTotal) }}
            <span class="store-count">({{ costByStore.length }} stores)</span>
          </span>
        </div>
      </div>

      <div class="chart-card full-width">
        <div class="chart-header">
          <span class="chart-header-title">Store Cost Distribution</span>
          <div class="chart-header-actions">
            <button class="btn-export-icon" @click="handleExportCostByStore" :disabled="exportingStore" title="Export Store Cost Data">
              <svg v-if="!exportingStore" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span v-else class="spinner-small"></span>
            </button>
          </div>
        </div>
        <div class="chart-body">
          <div v-if="costByStore.length === 0" class="empty-state-small">
            No store data available
          </div>
          <div v-else class="chart-bars">
            <div 
              v-for="(store, index) in costByStore" 
              :key="store.id" 
              class="chart-bar-row"
              :style="{ animationDelay: (index * 0.05) + 's' }"
            >
              <div class="chart-bar-info">
                <span class="chart-bar-rank">{{ index + 1 }}</span>
                <span class="chart-bar-name" :title="store.name">{{ store.name }}</span>
                <span class="chart-bar-sub">{{ formatNumber(store.itemCount) }} items</span>
              </div>
              <div class="chart-bar-track">
                <div 
                  class="chart-bar-fill store-fill" 
                  :style="{ 
                    width: getBarWidth(store.totalCost, maxStoreCost) + '%',
                    background: store.color || getStoreColor(store.id)
                  }"
                >
                  <span class="chart-bar-value">
                    ETB {{ formatCurrency(store.totalCost) }}
                  </span>
                </div>
              </div>
              <span class="chart-bar-percent">{{ store.percent.toFixed(3) }}%</span>
            </div>
          </div>
        </div>
        <div class="chart-footer" v-if="costByStore.length > 0">
          <span class="chart-total">Total Store Cost: ETB {{ formatCurrency(storeTotal) }}</span>
          <span class="chart-stores">{{ costByStore.length }} stores</span>
        </div>
      </div>

      <!-- ==================== TOP COST ITEMS - TABLE ==================== -->
      <div class="section-title">
        <div class="section-title-left">
          <h2>💰 Top Cost Items</h2>
          <span class="section-subtitle">Highest value inventory items (Top 10)</span>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <div class="section-header-left">
            <h3>Top 10 Highest Cost Items</h3>
            <span class="header-subtitle">Items with the highest total cost</span>
          </div>
          <div class="section-header-right">
            <button class="btn-export-icon" @click="handleExportTopCostItems" :disabled="exportingTop" title="Export Top Cost Items">
              <svg v-if="!exportingTop" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span v-else class="spinner-small"></span>
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table class="mini-table top-items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Total Cost</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="topCostItems.length === 0">
                <td colspan="5" class="empty-state-small">No data available</td>
              </tr>
              <tr v-for="(item, index) in topCostItems" :key="item.id">
                <td class="rank-cell">{{ index + 1 }}</td>
                <td class="item-code">{{ item.itemCode }}</td>
                <td>
                  <div class="item-info">
                    <span class="item-name">{{ item.itemName }}</span>
                    <span class="item-standard">{{ item.itemStandardName || '' }}</span>
                  </div>
                </td>
                <td class="total-cell">ETB {{ formatCurrency(item.totalCost) }}</td>
                <td>
                  <div class="percent-cell">
                    <span class="percent-value">{{ item.percent.toFixed(3) }}%</span>
                    <div class="percent-bar-track">
                      <div class="percent-bar-fill" :style="{ width: Math.min(item.percent, 100) + '%', background: getPercentColor(item.percent) }"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-footer" v-if="topCostItems.length > 0">
          <span class="footer-total">Total: ETB {{ formatCurrency(topItemsTotal) }}</span>
          <span class="footer-count">{{ topCostItems.length }} items</span>
        </div>
      </div>

      <!-- ==================== ZERO COST ITEMS ==================== -->
      <div class="section-title" id="zero-cost-section">
        <h2>⚠️ Zero Cost Items</h2>
        <span class="section-subtitle">Items with no cost assigned ({{ zeroCostPagination.total }} items)</span>
      </div>

      <div class="section-card alert-card warning">
        <div class="section-header">
          <div class="section-header-left">
            <h3>⚠️ Items with Zero Unit Cost</h3>
            <span class="header-subtitle">These items need cost review</span>
          </div>
          <div class="section-header-right">
            <span class="badge warning">⚠️ {{ zeroCostPagination.total }} items</span>
            <button class="btn-export-icon zero" @click="handleExportZeroCostItems" :disabled="exportingZero" title="Export Zero Cost Items">
              <svg v-if="!exportingZero" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span v-else class="spinner-small"></span>
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table class="mini-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>UOM</th>
                <th>Balance</th>
                <th>Status</th>
            
             
              </tr>
            </thead>
            <tbody>
              <tr v-if="zeroCostItems.length === 0">
                <td colspan="9" class="empty-state-small">
                  ✅ No zero cost items found
                </td>
              </tr>
              <tr v-for="(item, index) in zeroCostItems" :key="item.id">
                <td>{{ (zeroCostPagination.page - 1) * zeroCostPagination.limit + index + 1 }}</td>
                <td class="item-code">{{ item.itemCode }}</td>
                <td>
                  <div class="item-info">
                    <span class="item-name">{{ item.itemName }}</span>
                    <span class="item-standard">{{ item.itemStandardName || '' }}</span>
                  </div>
                </td>
                <td>{{ item.categoryName || 'Uncategorized' }}</td>
                <td>{{ item.baseUOM || 'PCS' }}</td>
                <td class="balance-cell">{{ formatNumber(item.balance) }}</td>
                <td>
                  <span class="status-badge status-zero-cost">
                    ⚠️ Zero Cost
                  </span>
                </td>
               
              
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination for Zero Cost Items -->
        <div class="pagination" v-if="zeroCostPagination.total > 0">
          <button class="page-btn" :disabled="zeroCostPagination.page === 1" @click="changeZeroCostPage(zeroCostPagination.page - 1)">
            ← Previous
          </button>
          <span class="page-info">
            Page {{ zeroCostPagination.page }} of {{ zeroCostPagination.totalPages }}
            ({{ zeroCostPagination.total }} items)
          </span>
          <button class="page-btn" :disabled="zeroCostPagination.page === zeroCostPagination.totalPages" @click="changeZeroCostPage(zeroCostPagination.page + 1)">
            Next →
          </button>
          <select v-model="zeroCostPagination.limit" @change="changeZeroCostPageSize" class="limit-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import costDashboardService from '@/stores/costDashboardService'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// ================================================================
// STATE
// ================================================================

const loading = ref(false)
const exportingZero = ref(false)
const exportingStore = ref(false)
const exportingTop = ref(false)

// Dashboard Data
const summary = ref({
  totalItems: 0,
  zeroCostItems: 0,
  totalCost: 0,
  excludedByConflict: 0,
  excludedByData: 0,
  itemsWithCost: 0
})

const costByStore = ref([])
const topCostItems = ref([])
const zeroCostItems = ref([])
const zeroCostPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

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

const maxStoreCost = computed(() => {
  if (costByStore.value.length === 0) return 1
  return Math.max(...costByStore.value.map(s => s.totalCost), 1)
})

const storeTotal = computed(() => {
  return costByStore.value.reduce((sum, s) => sum + s.totalCost, 0)
})

const topItemsTotal = computed(() => {
  return topCostItems.value.reduce((sum, i) => sum + i.totalCost, 0)
})

// ================================================================
// METHODS
// ================================================================

const getStoreColor = (storeId) => {
  return costDashboardService.getStoreColor(storeId)
}

const getPercentColor = (percent) => {
  return costDashboardService.getPercentColor(percent)
}

const getBarWidth = (value, max) => {
  if (max === 0) return 0
  const percent = (value / max) * 100
  return Math.max(Math.min(percent, 100), 8)
}

const formatCurrency = (value) => {
  return costDashboardService.formatCurrency(value)
}

const formatNumber = (value) => {
  return costDashboardService.formatNumber(value)
}

const navigateTo = (page) => {
  router.push(`/${page}`)
}

const scrollToZeroCost = () => {
  const element = document.getElementById('zero-cost-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const goToRules = () => {
  router.push('/cost-calculation-rules')
}

// ================================================================
// 📤 EXPORT: Cost by Store (using new endpoint with pagination)
// ================================================================

const handleExportCostByStore = async () => {
  exportingStore.value = true
  try {
    const response = await costDashboardService.exportCostByStore(1, 100)
    if (response.success && response.data && response.data.length > 0) {
      const exportData = response.data
      const headers = Object.keys(exportData[0])
      
      const metadata = [
        `"Export Date","${new Date().toISOString()}"`,
        `"Total Stores","${response.pagination?.total || exportData.length}"`,
        `"Page","${response.pagination?.page || 1}"`,
        `"Total Cost (ETB)","${response.totalCost || 'N/A'}"`,
        ""
      ]
      
      const rows = exportData.map(row => {
        return headers.map(header => {
          const value = row[header] ?? ''
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
      })
      
      const csvContent = [
        ...metadata,
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      downloadCSV(csvContent, 'cost_by_store_export')
      showToastMessage(`Exported ${exportData.length} stores!`, 'success')
    } else {
      showToastMessage(response.error || 'No data to export', 'warning')
    }
  } catch (error) {
    console.error('Error exporting cost by store:', error)
    showToastMessage('Export failed', 'error')
  } finally {
    exportingStore.value = false
  }
}

// ================================================================
// 📤 EXPORT: Top Cost Items (using new endpoint with pagination)
// ================================================================

const handleExportTopCostItems = async () => {
  exportingTop.value = true
  try {
    const response = await costDashboardService.exportTopCostItems(1, 10)
    if (response.success && response.data && response.data.length > 0) {
      const exportData = response.data
      const headers = Object.keys(exportData[0])
      
      const metadata = [
        `"Export Date","${new Date().toISOString()}"`,
        `"Total Items","${response.pagination?.total || exportData.length}"`,
        `"Total Inventory Cost (ETB)","${response.totalInventoryCost || 'N/A'}"`,
        ""
      ]
      
      const rows = exportData.map(row => {
        return headers.map(header => {
          const value = row[header] ?? ''
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
      })
      
      const csvContent = [
        ...metadata,
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      downloadCSV(csvContent, 'top_cost_items_export')
      showToastMessage(`Exported ${exportData.length} items!`, 'success')
    } else {
      showToastMessage(response.error || 'No data to export', 'warning')
    }
  } catch (error) {
    console.error('Error exporting top cost items:', error)
    showToastMessage('Export failed', 'error')
  } finally {
    exportingTop.value = false
  }
}

// ================================================================
// 📤 EXPORT: Zero Cost Items (using new endpoint with pagination)
// ================================================================

const handleExportZeroCostItems = async () => {
  exportingZero.value = true
  try {
    const response = await costDashboardService.exportZeroCostItems(
      zeroCostPagination.value.page,
      zeroCostPagination.value.limit
    )
    if (response.success && response.data && response.data.length > 0) {
      const exportData = response.data
      const headers = Object.keys(exportData[0])
      
      const metadata = [
        `"Export Date","${new Date().toISOString()}"`,
        `"Page","${response.pagination?.page || zeroCostPagination.value.page}"`,
        `"Items Per Page","${response.pagination?.limit || zeroCostPagination.value.limit}"`,
        `"Total Items","${response.pagination?.total || zeroCostPagination.value.total}"`,
        `"Total Pages","${response.pagination?.totalPages || zeroCostPagination.value.totalPages}"`,
        ""
      ]
      
      const rows = exportData.map(row => {
        return headers.map(header => {
          const value = row[header] ?? ''
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
      })
      
      const csvContent = [
        ...metadata,
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      downloadCSV(csvContent, `zero_cost_items_page_${zeroCostPagination.value.page}`)
      showToastMessage(`Exported ${exportData.length} zero-cost items from page ${zeroCostPagination.value.page}!`, 'success')
    } else {
      showToastMessage(response.error || 'No data to export', 'warning')
    }
  } catch (error) {
    console.error('Error exporting zero cost items:', error)
    showToastMessage('Export failed', 'error')
  } finally {
    exportingZero.value = false
  }
}

// ================================================================
// 🔥 Helper: Download CSV
// ================================================================

const downloadCSV = (csvContent, filename) => {
  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ================================================================
// LOAD DATA
// ================================================================

const loadDashboardData = async () => {
  loading.value = true
  try {
    const user = authStore.user
    if (user) {
      costDashboardService.setUserContext(
        user.storeId || null,
        user.groupId || null
      )
    }

    const response = await costDashboardService.getDashboardData()
    
    if (response.success && response.data) {
      summary.value = {
        ...response.data.summary,
        itemsWithCost: response.data.summary.itemsWithCost || 0
      }
      
      costByStore.value = [...response.data.costByStore]
        .sort((a, b) => b.totalCost - a.totalCost)
        .map((store, index) => ({
          ...store,
          color: store.color || getStoreColor(store.id)
        }))
      
      topCostItems.value = response.data.topCostItems || []
      zeroCostItems.value = response.data.zeroCostItems || []
      zeroCostPagination.value = response.data.zeroCostPagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
      
      console.log('✅ Cost dashboard data loaded successfully')
    } else {
      showToastMessage(response.error || 'Failed to load dashboard data', 'error')
    }
  } catch (error) {
    console.error('Error loading dashboard:', error)
    showToastMessage('Failed to load dashboard data', 'error')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  showToastMessage('Refreshing dashboard...', 'info')
  await loadDashboardData()
  showToastMessage('Dashboard refreshed!', 'success')
}

// ================================================================
// ZERO COST PAGINATION
// ================================================================

const changeZeroCostPage = async (page) => {
  if (page >= 1 && page <= zeroCostPagination.value.totalPages) {
    zeroCostPagination.value.page = page
    await loadZeroCostItems()
  }
}

const changeZeroCostPageSize = async () => {
  zeroCostPagination.value.page = 1
  await loadZeroCostItems()
}

const loadZeroCostItems = async () => {
  try {
    const response = await costDashboardService.getZeroCostItems(
      zeroCostPagination.value.page,
      zeroCostPagination.value.limit
    )
    if (response.success) {
      zeroCostItems.value = response.data
      zeroCostPagination.value = response.pagination
    }
  } catch (error) {
    console.error('Error loading zero cost items:', error)
    showToastMessage('Failed to load zero cost items', 'error')
  }
}

// ================================================================
// TOAST
// ================================================================

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

watch(() => authStore.user, () => {
  loadDashboardData()
}, { deep: true })
</script>

<style scoped>
/* ================================================================
   MAIN CONTAINER
   ================================================================ */
.cost-dashboard {
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
  background: linear-gradient(135deg, #3b82f6, #2563eb);
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

.btn-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-info:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-info svg {
  stroke: currentColor;
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

.section-title-right {
  display: flex;
  align-items: center;
  gap: 12px;
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

.store-total-badge {
  background: #f1f5f9;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.store-total-badge .store-count {
  font-weight: 400;
  color: #64748b;
  font-size: 12px;
}

/* ================================================================
   CHART HEADER
   ================================================================ */
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

.chart-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ================================================================
   EXPORT ICON BUTTONS
   ================================================================ */
.btn-export-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
}

.btn-export-icon:hover:not(:disabled) {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
  transform: scale(1.05);
}

.btn-export-icon:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-export-icon svg {
  stroke: currentColor;
}

.btn-export-icon.zero {
  background: transparent;
  color: #8b5cf6;
  border: 1px solid #8b5cf6;
  width: 32px;
  height: 32px;
}

.btn-export-icon.zero:hover:not(:disabled) {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
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
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

/* ================================================================
   STATS GRID
   ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 1fr 1fr;
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

.stat-card.info .stat-value { color: #3b82f6; }
.stat-card.warning .stat-value { color: #f59e0b; }
.stat-card.danger .stat-value { color: #ef4444; }

/* ================================================================
   CHART CARD - FULL WIDTH
   ================================================================ */
.chart-card.full-width {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  margin-bottom: 24px;
}

.chart-card .chart-body {
  padding: 20px 24px;
  max-height: 450px;
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

/* ================================================================
   CHART BARS - HORIZONTAL (Store Distribution)
   ================================================================ */
.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

.chart-bar-row {
  display: flex;
  align-items: center;
  gap: 16px;
  animation: slideIn 0.4s ease forwards;
  opacity: 0;
  min-height: 44px;
  padding: 6px 0;
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
  gap: 12px;
  min-width: 300px;
  max-width: 320px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

.chart-bar-rank {
  font-weight: 700;
  color: #94a3b8;
  font-size: 14px;
  min-width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.chart-bar-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  max-width: 200px;
}

.chart-bar-name:hover {
  overflow: visible;
  background: white;
  position: relative;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.chart-bar-sub {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  min-width: 60px;
}

.chart-bar-track {
  flex: 1;
  height: 36px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-width: 150px;
}

.chart-bar-fill {
  height: 100%;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 16px;
  transition: width 0.8s ease;
  min-width: 130px;
  position: relative;
}

.chart-bar-fill.store-fill {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.chart-bar-value {
  font-size: 12px;
  font-weight: 600;
  color: white;
  z-index: 2;
  position: relative;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.chart-bar-percent {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  min-width: 55px;
  max-width: 55px;
  text-align: right;
  flex-shrink: 0;
  white-space: nowrap;
}

/* ================================================================
   TOP ITEMS TABLE
   ================================================================ */
.top-items-table {
  font-size: 13px;
}

.top-items-table .rank-cell {
  font-weight: 700;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  width: 40px;
}

.top-items-table .item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  white-space: nowrap;
}

.top-items-table .item-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.top-items-table .item-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.top-items-table .item-standard {
  font-size: 11px;
  color: #94a3b8;
}

.top-items-table .total-cell {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
  white-space: nowrap;
}

/* Percent Cell */
.percent-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.percent-value {
  font-weight: 700;
  font-size: 14px;
  color: #1e293b;
  min-width: 45px;
  text-align: right;
}

.percent-bar-track {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  min-width: 60px;
}

.percent-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* Table Footer */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 4px;
  border-top: 1px solid #f1f5f9;
  margin-top: 8px;
  font-size: 13px;
}

.footer-total {
  font-weight: 700;
  color: #1e293b;
}

.footer-count {
  color: #64748b;
}

/* ================================================================
   CHART FOOTER
   ================================================================ */
.chart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 13px;
}

.chart-total {
  color: #1e293b;
  font-weight: 600;
}

.chart-stores {
  color: #64748b;
}

/* ================================================================
   SECTION CARD
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.section-card.alert-card.warning {
  border-left: 4px solid #f59e0b;
}

/* ================================================================
   SECTION HEADER
   ================================================================ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-header-left h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.header-subtitle {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
}

.section-header-right {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.badge.warning {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

/* ================================================================
   STATUS BADGES
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.status-active,
.status-badge.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.status-partial {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-incomplete {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.status-inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

.status-badge.status-zero-cost {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
}

.balance-cell {
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

/* ================================================================
   TABLE
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

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

.item-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.item-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.item-standard {
  font-size: 11px;
  color: #94a3b8;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
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
  .stats-grid { 
    grid-template-columns: 1fr 1fr 1fr; 
  }
  .chart-bar-info {
    min-width: 240px;
    max-width: 260px;
  }
  .chart-bar-name {
    max-width: 150px;
  }
  .chart-bar-track {
    min-width: 120px;
  }
}

@media (max-width: 992px) {
  .stats-grid { 
    grid-template-columns: 1fr 1fr; 
  }
  .chart-bar-info {
    min-width: 200px;
    max-width: 220px;
  }
  .chart-bar-name {
    max-width: 120px;
    font-size: 13px;
  }
  .chart-bar-sub {
    font-size: 11px;
    min-width: 50px;
  }
  .chart-bar-track {
    min-width: 100px;
    height: 32px;
  }
  .chart-bar-fill {
    min-width: 80px;
    padding-right: 12px;
  }
  .chart-bar-value {
    font-size: 11px;
  }
  .top-items-table {
    font-size: 12px;
  }
  .top-items-table .item-name {
    font-size: 12px;
  }
  .top-items-table .total-cell {
    font-size: 13px;
  }
  .percent-cell {
    min-width: 100px;
  }
  .percent-value {
    font-size: 13px;
    min-width: 38px;
  }
}

@media (max-width: 768px) {
  .cost-dashboard { padding: 16px; }
  .stats-grid { 
    grid-template-columns: 1fr 1fr; 
  }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { width: 100%; justify-content: space-between; flex-wrap: wrap; }
  .chart-bar-info {
    min-width: 160px;
    max-width: 180px;
  }
  .chart-bar-name {
    max-width: 90px;
    font-size: 12px;
  }
  .chart-bar-sub { 
    display: none; 
  }
  .chart-bar-track {
    min-width: 80px;
    height: 28px;
  }
  .chart-bar-fill {
    min-width: 60px;
    padding-right: 8px;
  }
  .chart-bar-value { 
    font-size: 10px; 
  }
  .chart-bar-percent { 
    min-width: 38px; 
    max-width: 38px; 
    font-size: 11px; 
  }
  .top-items-table .rank-cell {
    width: 30px;
    font-size: 12px;
  }
  .top-items-table .item-code {
    font-size: 11px;
  }
  .top-items-table .item-name {
    font-size: 11px;
  }
  .top-items-table .item-standard {
    font-size: 10px;
  }
  .top-items-table .total-cell {
    font-size: 12px;
  }
  .percent-cell {
    min-width: 80px;
    gap: 6px;
  }
  .percent-value {
    font-size: 12px;
    min-width: 32px;
  }
  .percent-bar-track {
    min-width: 40px;
  }
  .section-header { flex-direction: column; align-items: flex-start; }
  .section-header-right { width: 100%; }
  .section-title { flex-direction: column; align-items: flex-start; }
  .section-title-left { width: 100%; }
  .btn-export-icon { 
    width: 32px; 
    height: 32px; 
  }
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .stats-grid { 
    grid-template-columns: 1fr; 
  }
  .mini-table { font-size: 12px; }
  .mini-table th,
  .mini-table td { padding: 6px 8px; }
  .header-actions { width: 100%; flex-direction: column; }
  .refresh-btn { width: 100%; justify-content: center; }
  .btn-export-icon { 
    width: 100%; 
    justify-content: center; 
  }
  .chart-bar-info {
    min-width: 120px;
    max-width: 140px;
    gap: 6px;
  }
  .chart-bar-name { 
    max-width: 60px; 
    font-size: 11px; 
  }
  .chart-bar-rank { 
    min-width: 20px;
    font-size: 11px;
  }
  .chart-bar-track { 
    min-width: 60px; 
    height: 24px; 
  }
  .chart-bar-fill { 
    min-width: 40px; 
    padding-right: 4px; 
  }
  .chart-bar-value { 
    font-size: 9px; 
  }
  .chart-bar-percent { 
    min-width: 32px; 
    max-width: 32px; 
    font-size: 10px; 
  }
  .top-items-table {
    font-size: 11px;
  }
  .top-items-table th,
  .top-items-table td {
    padding: 6px 8px;
  }
  .top-items-table .rank-cell {
    width: 24px;
    font-size: 11px;
  }
  .top-items-table .item-code {
    font-size: 10px;
  }
  .top-items-table .item-name {
    font-size: 10px;
  }
  .top-items-table .item-standard {
    display: none;
  }
  .top-items-table .total-cell {
    font-size: 11px;
  }
  .percent-cell {
    min-width: 60px;
    gap: 4px;
  }
  .percent-value {
    font-size: 11px;
    min-width: 28px;
  }
  .percent-bar-track {
    min-width: 30px;
  }
  .pagination { gap: 8px; }
  .page-info { font-size: 11px; }
}
</style>