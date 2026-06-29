<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📋 Store Transactions</h2>
        <span class="total-badge">{{ transactions.length }} Transactions</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search transactions..."
            @input="onSearchChange"
          />
        </div>
        <div class="action-buttons">
          <button class="btn-export" @click="openExportModal" :disabled="exporting">
            <span v-if="exporting" class="spinner-small"></span>
            <span v-else>📊</span>
            {{ exporting ? "Exporting..." : "Export" }}
          </button>
          <button class="btn-print" @click="printReport">🖨️ Print</button>
        </div>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <div class="filter-group">
        <select 
          v-model="filterStore" 
          class="filter-select" 
          @change="onFilterChange"
          :disabled="!userIsAdmin && !!userAssignedStoreId"
        >
          <option value="">All Stores</option>
          <option v-for="store in stores" :key="store.id" :value="store.id">
            {{ store.name }}
          </option>
        </select>
       
      </div>
      
      <div class="filter-group">
        <select 
          v-model="filterGroup" 
          class="filter-select" 
          @change="onFilterChange"
          :disabled="!userIsAdmin && !!userAssignedGroupId"
        >
          <option value="">All Groups</option>
          <option v-for="group in allGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
       
      </div>
      
      <select v-model="filterItem" class="filter-select" @change="onFilterChange">
        <option value="">All Items</option>
        <option v-for="item in inventoryItems" :key="item.id" :value="item.id">
          {{ item.code }} - {{ item.standardName }}
        </option>
      </select>
      <select v-model="filterType" class="filter-select" @change="onFilterChange">
        <option value="">All Types</option>
        <option value="Stock In">📥 Stock In</option>
        <option value="Stock Out">📤 Stock Out</option>
      </select>
      <select v-model="filterDate" class="filter-select" @change="onFilterChange">
        <option value="">All Dates</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="3months">Last 3 Months</option>
        <option value="6months">Last 6 Months</option>
        <option value="12months">Last 12 Months</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters && userIsAdmin">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-grid" v-if="!isLoading">
      <div class="stat-card">
        <div class="stat-icon">📥</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalStockIn }}</div>
          <div class="stat-label">Stock In</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📤</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalStockOut }}</div>
          <div class="stat-label">Stock Out</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalTransactions }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
    </div>

    <!-- ==================== TRANSACTION TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading transactions...</p>
      </div>
      <table v-else class="transaction-table">
        <thead>
          <tr>
            <th style="width:35px"></th>
            <th>Date</th>
            <th>Store</th>
            <th>Group</th>
            <th>Type</th>
            <th>Item</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedTransactions.length === 0">
            <td colspan="7" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📋</span>
                <p>No transactions found</p>
              </div>
            </td>
          </tr>
          <template v-for="(transaction, index) in paginatedTransactions" :key="transaction.id">
            <tr
              :class="{
                'expanded-row': expandedRow === transaction.id
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(transaction.id)">
                  {{ expandedRow === transaction.id ? "▼" : "▶" }}
                </button>
              </td>
              <td class="date-time">{{ formatDateShort(transaction.createdAt) }}</td>
              <td class="store-name">{{ getStoreName(transaction.storeId) }}</td>
              <td>
                <span class="group-tag">{{ getGroupName(transaction.groupId) }}</span>
              </td>
              <td>
                <span :class="['type-badge', transaction.type === 'Stock In' ? 'stock-in' : 'stock-out']">
                  {{ transaction.type === 'Stock In' ? '📥' : '📤' }}
                </span>
              </td>
              <td>
                <div class="item-info">
                  <div class="item-code">{{ getItemCode(transaction.itemId) }}</div>
                  <div class="item-name">{{ getItemName(transaction.itemId) }}</div>
                  <div class="item-common">{{ getItemCommonName(transaction.itemId) }}</div>
                </div>
              </td>
              <td class="quantity-amount">
                <span :class="['quantity-value', transaction.type === 'Stock In' ? 'positive' : 'negative']">
                  {{ transaction.type === 'Stock In' ? '+' : '-' }}{{ formatNumber(transaction.quantity) }}
                </span>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr v-if="expandedRow === transaction.id" class="detail-expand-row">
              <td colspan="7">
                <div class="expand-details">
                  <div class="detail-container">
                    <div class="detail-row">
                      <div class="detail-card">
                        <h4>📋 Transaction Details</h4>
                        <div><span>Transaction ID</span><span class="value">#{{ transaction.id }}</span></div>
                        <div><span>Date & Time</span><span class="value">{{ formatDateTime(transaction.createdAt) }}</span></div>
                        <div><span>Store</span><span class="value">{{ getStoreName(transaction.storeId) }}</span></div>
                        <div><span>Group</span><span class="value">{{ getGroupName(transaction.groupId) }}</span></div>
                        <div><span>Type</span><span class="value">{{ transaction.type }}</span></div>
                      </div>

                      <div class="detail-card">
                        <h4>📦 Item Details</h4>
                        <div><span>Item Code</span><span class="value">{{ getItemCode(transaction.itemId) }}</span></div>
                        <div><span>Item Name</span><span class="value">{{ getItemName(transaction.itemId) }}</span></div>
                        <div><span>Common Name</span><span class="value">{{ getItemCommonName(transaction.itemId) }}</span></div>
                        <div><span>Unit of Measure</span><span class="value">{{ getItemUnit(transaction.itemId) }}</span></div>
                        <div><span>Quantity</span><span class="value">{{ transaction.type === 'Stock In' ? '+' : '-' }} {{ formatNumber(transaction.quantity) }}</span></div>
                        <div>
                          <span>{{ transaction.type === 'Stock In' ? 'From' : 'To' }}</span>
                          <span class="value">{{ transaction.type === 'Stock In' ? transaction.sourceStore : transaction.destinationStore }}</span>
                        </div>
                      </div>

                      <div class="detail-card">
                        <h4>📝 Additional Information</h4>
                        <div><span>Updated By</span><span class="value">{{ transaction.updatedBy || 'System' }}</span></div>
                        <div><span>Remark</span><span class="value">{{ transaction.remark || '-' }}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="transactions.length > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Next →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="5">5</option>
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
      </select>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Transaction Data</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary by Store
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
          <button class="btn-primary" @click="exportSelectedReport" :disabled="exporting">
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import transactionService from '@/stores/transactionService'
import balanceService from '@/stores/balanceService'

// ================================================================
// STATE
// ================================================================
const authStore = useAuthStore()

const transactions = ref([])
const stores = ref([])
const allGroups = ref([])
const inventoryItems = ref([])
const isLoading = ref(true)
const paginationInfo = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
})

// User data
const userAssignedStoreId = ref(null)
const userAssignedStoreName = ref(null)
const userAssignedGroupId = ref(null)
const userAssignedGroupName = ref(null)
const userIsAdmin = ref(false)

const searchQuery = ref('')
const filterStore = ref('')
const filterGroup = ref('')
const filterItem = ref('')
const filterType = ref('')
const filterDate = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRow = ref(null)
const exporting = ref(false)
const exportType = ref('full')
const showExportModal = ref(false)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() => {
  return filterStore.value || filterGroup.value || filterItem.value || filterType.value || filterDate.value || searchQuery.value
})

// Filter transactions client-side for date filter only (API handles other filters)
const filteredTransactions = computed(() => {
  let result = transactions.value
  
  // Only apply date filter client-side
  if (filterDate.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    result = result.filter(t => {
      const date = new Date(t.createdAt)
      const tDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      
      switch(filterDate.value) {
        case 'today':
          return tDate.getTime() === today.getTime()
        case 'yesterday':
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          return tDate.getTime() === yesterday.getTime()
        case 'week':
          const weekStart = new Date(today)
          weekStart.setDate(weekStart.getDate() - 7)
          return tDate >= weekStart
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          return tDate >= monthStart
        case '3months':
          const threeMonthsAgo = new Date(today)
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
          return tDate >= threeMonthsAgo
        case '6months':
          const sixMonthsAgo = new Date(today)
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          return tDate >= sixMonthsAgo
        case '12months':
          const twelveMonthsAgo = new Date(today)
          twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
          return tDate >= twelveMonthsAgo
        default:
          return true
      }
    })
  }
  
  return result
})

const paginatedTransactions = computed(() => {
  const data = filteredTransactions.value
  const start = (currentPage.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  const data = filteredTransactions.value
  return Math.ceil(data.length / pageSize.value) || 1
})

const totalStockIn = computed(() => {
  return transactions.value.filter(t => t.type === 'Stock In').length
})

const totalStockOut = computed(() => {
  return transactions.value.filter(t => t.type === 'Stock Out').length
})

const totalTransactions = computed(() => {
  return transactions.value.length
})

// ================================================================
// USER DATA
// ================================================================

const loadUserData = () => {
  const user = authStore.user
  if (user) {
    userIsAdmin.value = user.isAdmin || user.role === 'admin' || user.role === 'Admin'
    
    // Check if user has assignedStore property
    if (user && 'assignedStore' in user && user.assignedStore) {
      const assignedStore = user.assignedStore
      userAssignedStoreId.value = assignedStore.id || null
      userAssignedStoreName.value = assignedStore.name || null
    } else {
      userAssignedStoreId.value = null
      userAssignedStoreName.value = null
    }
    
    // Check if user has assignedGroup property
    if (user && 'assignedGroup' in user && user.assignedGroup) {
      const assignedGroup = user.assignedGroup
      userAssignedGroupId.value = assignedGroup.id || null
      userAssignedGroupName.value = assignedGroup.name || null
    } else {
      userAssignedGroupId.value = null
      userAssignedGroupName.value = null
    }
  }
}

// ================================================================
// API METHODS
// ================================================================

const fetchStores = async () => {
  try {
    const response = await balanceService.getStores()
    stores.value = response.data || []
  } catch (error) {
    console.error('Error fetching stores:', error)
  }
}

const fetchGroups = async () => {
  try {
    const response = await balanceService.getGroups()
    allGroups.value = response.data || []
  } catch (error) {
    console.error('Error fetching groups:', error)
  }
}

const fetchItems = async () => {
  try {
    const response = await balanceService.getActiveItems()
    inventoryItems.value = response.data || []
  } catch (error) {
    console.error('Error fetching items:', error)
  }
}

const fetchTransactions = async () => {
  isLoading.value = true
  try {
    const filters = {}
    
    // If non-admin with assigned store, filter by their store
    if (!userIsAdmin.value && userAssignedStoreId.value) {
      filters.storeId = userAssignedStoreId.value
    }
    
    // If non-admin with assigned group, filter by their group
    if (!userIsAdmin.value && userAssignedGroupId.value) {
      filters.groupId = userAssignedGroupId.value
    }
    
    // Add UI filters (these override role-based filters if set)
    // But for non-admin users, we don't allow changing store/group filters
    if (userIsAdmin.value) {
      if (filterStore.value) {
        filters.storeId = Number(filterStore.value)
      }
      if (filterGroup.value) {
        filters.groupId = Number(filterGroup.value)
      }
    } else {
      // Non-admin users: store and group are forced from user data
      // Only allow item, type, and date filters
      if (filterItem.value) {
        filters.itemId = Number(filterItem.value)
      }
      if (filterType.value) {
        filters.transactionType = filterType.value
      }
    }
    
    if (searchQuery.value) {
      filters.search = searchQuery.value
    }
    
    filters.page = currentPage.value
    filters.limit = pageSize.value
    
    const response = await transactionService.getTransactions(filters)
    
    transactions.value = response.data || []
    
    if (response.pagination) {
      paginationInfo.value = {
        page: response.pagination.page || 1,
        limit: response.pagination.limit || 10,
        total: response.pagination.total || 0,
        totalPages: response.pagination.totalPages || 1
      }
      currentPage.value = paginationInfo.value.page
      pageSize.value = paginationInfo.value.limit
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    showToastMessage('Failed to load transactions', 'error')
    transactions.value = []
  } finally {
    isLoading.value = false
  }
}

// ================================================================
// HELPER METHODS
// ================================================================
const getItemName = (itemId) => {
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.standardName || item.name : 'Unknown'
}

const getItemCode = (itemId) => {
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.code : 'Unknown'
}

const getItemCommonName = (itemId) => {
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.commonName : ''
}

const getItemUnit = (itemId) => {
  const item = inventoryItems.value.find(i => i.id === itemId)
  return item ? item.uomCode || '' : ''
}

const getStoreName = (storeId) => {
  const store = stores.value.find(s => s.id === storeId)
  return store ? store.name : 'Unknown'
}

const getStoreShortName = (storeId) => {
  const store = stores.value.find(s => s.id === storeId)
  return store ? store.name.replace(' Store', '') : 'Unknown'
}

const getGroupName = (groupId) => {
  const group = allGroups.value.find(g => g.id === groupId)
  return group ? group.name : 'Unknown'
}

const getGroupShortName = (groupId) => {
  const group = allGroups.value.find(g => g.id === groupId)
  return group ? group.name.substring(0, 8) : 'Unknown'
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateShort = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ================================================================
// UI HELPERS
// ================================================================
const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

// ================================================================
// FILTERS & PAGINATION
// ================================================================
const onSearchChange = () => { 
  currentPage.value = 1
  fetchTransactions()
}

const onFilterChange = () => { 
  currentPage.value = 1
  fetchTransactions()
}

const clearFilters = () => {
  filterStore.value = ''
  filterGroup.value = ''
  filterItem.value = ''
  filterType.value = ''
  filterDate.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
  fetchTransactions()
}

const changePage = (page) => {
  const total = Math.ceil(filteredTransactions.value.length / pageSize.value) || 1
  if (page >= 1 && page <= total) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
}

// ================================================================
// PRINT & EXPORT
// ================================================================
const printReport = () => {
  const printContents = document.getElementById('printable-area').innerHTML
  const originalContents = document.body.innerHTML
  
  document.body.innerHTML = `
    <html>
      <head>
        <title>Store Transaction Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h2 { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <h2>📋 Store Transaction Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Transactions: ${transactions.value.length}</p>
        ${printContents}
        <div class="print-footer">Printed from Store Management System</div>
      </body>
    </html>
  `
  
  window.print()
  document.body.innerHTML = originalContents
  window.location.reload()
}

const openExportModal = () => {
  exportType.value = 'full'
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const exportSelectedReport = async () => {
  exporting.value = true
  try {
    const filters = {}
    
    // Add filters for export
    if (userIsAdmin.value) {
      if (filterStore.value) {
        filters.storeId = Number(filterStore.value)
      }
      if (filterGroup.value) {
        filters.groupId = Number(filterGroup.value)
      }
    } else {
      // Non-admin users: force store and group from user data
      if (userAssignedStoreId.value) {
        filters.storeId = userAssignedStoreId.value
      }
      if (userAssignedGroupId.value) {
        filters.groupId = userAssignedGroupId.value
      }
    }
    
    if (filterItem.value) {
      filters.itemId = Number(filterItem.value)
    }
    if (filterType.value) {
      filters.transactionType = filterType.value
    }
    if (searchQuery.value) {
      filters.search = searchQuery.value
    }
    filters.type = exportType.value
    
    const blob = await transactionService.exportTransactions(filters)
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `store_transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    closeExportModal()
    showToastMessage('Export completed successfully!', 'success')
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export transactions', 'error')
  } finally {
    exporting.value = false
  }
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE HOOKS
// ================================================================
onMounted(async () => {
  // Load user data first
  loadUserData()
  
  try {
    await Promise.all([
      fetchStores(),
      fetchGroups(),
      fetchItems()
    ])
    
    // If non-admin with assigned store and/or group, set the filters
    if (!userIsAdmin.value) {
      if (userAssignedStoreId.value) {
        filterStore.value = String(userAssignedStoreId.value)
        console.log('🔒 Auto-selected store filter:', userAssignedStoreName.value)
      }
      if (userAssignedGroupId.value) {
        filterGroup.value = String(userAssignedGroupId.value)
        console.log('🔒 Auto-selected group filter:', userAssignedGroupName.value)
      }
    }
    
    await fetchTransactions()
  } catch (error) {
    console.error('Error loading page:', error)
    showToastMessage('Failed to load data', 'error')
  }
})
</script>

<style scoped>
/* ================================================================
   SECTION CARD
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
  white-space: nowrap;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 200px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* ================================================================
   BUTTONS
   ================================================================ */
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
.btn-export:hover:not(:disabled) { background: #059669; }
.btn-export:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-print {
  background: #8b5cf6;
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
.btn-print:hover { background: #7c3aed; }

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
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
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }

/* ================================================================
   FILTER BAR
   ================================================================ */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  min-width: 150px;
}

.filter-select:disabled {
  background: #f1f5f9;
  color: #475569;
  cursor: not-allowed;
  opacity: 0.8;
}

.filter-hint {
  font-size: 10px;
  color: #2563eb;
  font-weight: 500;
  padding-left: 4px;
  white-space: nowrap;
}

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-clear-filters:hover { background: #e2e8f0; }

/* ================================================================
   STATS
   ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card:hover {
  background: #f1f5f9;
}

.stat-icon {
  font-size: 24px;
  background: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
  min-height: 200px;
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.transaction-table th,
.transaction-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.transaction-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center {
  text-align: center;
}

.date-time {
  font-size: 12px;
  white-space: nowrap;
}

.store-name {
  font-weight: 500;
  font-size: 13px;
}

.group-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.type-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.type-badge.stock-in {
  background: #dcfce7;
  color: #166534;
}

.type-badge.stock-out {
  background: #fee2e2;
  color: #991b1b;
}

.item-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
}

.item-name {
  font-size: 12px;
  color: #1e293b;
}

.item-common {
  font-size: 10px;
  color: #94a3b8;
}

.quantity-amount {
  font-weight: 600;
  font-size: 13px;
}

.quantity-value {
  padding: 2px 6px;
  border-radius: 4px;
}

.quantity-value.positive {
  color: #166534;
}

.quantity-value.negative {
  color: #991b1b;
}

/* ================================================================
   EXPAND ROW
   ================================================================ */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
}
.expand-btn:hover { background: #e0e7ff; }
.expanded-row { background: #f8fafc; }
.detail-expand-row td { padding: 0 !important; }

.expand-details {
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
}

.detail-card h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

.detail-card > div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}
.detail-card > div:last-child { border-bottom: none; }
.detail-card .value { font-weight: 500; color: #1e293b; }

/* ================================================================
   LOADING STATE
   ================================================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #64748b;
}
.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
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
.page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #3b82f6; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 12px; color: #64748b; white-space: nowrap; }
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
   MODALS
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.modal-header h3 { margin: 0; font-size: 16px; font-weight: 600; color: #1e293b; }

.modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover { background: #f1f5f9; color: #1e293b; }

.export-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.export-option:hover { background: #f8fafc; border-color: #3b82f6; }

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state { text-align: center; padding: 40px !important; }
.empty-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-icon { font-size: 40px; opacity: 0.3; }
.empty-content p { color: #64748b; margin: 0; font-size: 14px; }

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 10px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 3px solid #10b981;
  white-space: nowrap;
  max-width: 90vw;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}
.toast.error { border-left-color: #ef4444; }
.toast.info { border-left-color: #3b82f6; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-export, .btn-print, .search-box, .filter-bar, .pagination, .action-buttons, .expand-btn {
    display: none !important;
  }
  .section-card { box-shadow: none !important; padding: 0 !important; }
  .transaction-table th, .transaction-table td { border: 1px solid #ddd !important; }
  .stats-grid { display: none !important; }
  .detail-expand-row { display: table-row !important; }
  .loading-state { display: none !important; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .detail-row { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: stretch; }
  .header-actions { flex-direction: column; align-items: stretch; }
  .search-box input { width: 100%; }
  .filter-bar { flex-direction: column; }
  .filter-bar select { width: 100%; }
  .filter-group { width: 100%; }
}

@media (max-width: 600px) {
  .section-card { padding: 12px; }
  .stats-grid { grid-template-columns: 1fr; }
  .pagination { flex-wrap: wrap; }
  .modal-container { margin: 10px; max-height: 95vh; }
  .transaction-table { font-size: 12px; }
  .transaction-table th, .transaction-table td { padding: 6px 8px; }
}
</style>