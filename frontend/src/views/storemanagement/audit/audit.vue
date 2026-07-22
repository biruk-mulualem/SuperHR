<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🔍 Audit & Reconciliation Dashboard</h2>
        <span class="total-badge">{{ filteredAuditData.length }} Products</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search products..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-refresh" @click="refreshData" :disabled="refreshing">
          <span v-if="refreshing" class="spinner-small"></span>
          <span v-else>🔄</span>
          {{ refreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="btn-export" @click="openExportModal" :disabled="exporting || filteredAuditData.length === 0">
          📊 {{ exporting ? 'Exporting...' : 'Export' }}
        </button>
      </div>
    </div>

    <!-- ==================== SUMMARY STATS ==================== -->
    <div class="summary-cards">
      <div class="summary-card">
        <span class="summary-label">Total Products</span>
        <span class="summary-value">{{ filteredAuditData.length }}</span>
      </div>
      <div class="summary-card" v-if="selectedStore">
        <span class="summary-label">Store</span>
        <span class="summary-value store-name">{{ selectedStoreName }}</span>
      </div>
      <div class="summary-card success">
        <span class="summary-label">✅ Matched</span>
        <span class="summary-value">{{ matchedCount }}</span>
      </div>
      <div class="summary-card warning">
        <span class="summary-label">⚠️ Outlier</span>
        <span class="summary-value">{{ outlierCount }}</span>
      </div>
      <div class="summary-card critical">
        <span class="summary-label">🚨 Conflict</span>
        <span class="summary-value">{{ conflictCount }}</span>
      </div>
      <div class="summary-card date-diff">
        <span class="summary-label">📅 Date Diff</span>
        <span class="summary-value">{{ dateDiffCount }}</span>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="selectedStoreId" class="filter-select" @change="onStoreChange">
        <option v-for="store in stores" :key="store.id" :value="store.id">
          {{ store.name }} <span v-if="storeBalanceCounts[store.id] > 0">({{ storeBalanceCounts[store.id] }})</span>
        </option>
      </select>
      <select v-model="filterCategory" class="filter-select" @change="onFilterChange">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="Matched">✅ Matched</option>
        <option value="Outlier">⚠️ Outlier</option>
        <option value="Conflict">🚨 Conflict</option>
        <option value="DateDiff">📅 Date Diff</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="filterCategory || filterStatus">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== PRODUCT COMPARISON TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <!-- ⭐ LOADING STATE - Show this when loading -->
      <div v-if="loading || refreshing" class="loading-state">
        <div class="spinner-large"></div>
        <p class="loading-text">{{ loading ? 'Loading audit data...' : 'Refreshing data...' }}</p>
        <p class="loading-subtext">Please wait while we fetch the data</p>
      </div>

      <!-- ⭐ INITIAL LOADING STATE - When no store is selected yet -->
      <div v-else-if="!selectedStoreId && !loading && !error" class="loading-state">
        <div class="spinner-large"></div>
        <p class="loading-text">Loading available stores...</p>
      
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h3>Error Loading Data</h3>
        <p>{{ error }}</p>
        <button class="btn-retry" @click="retryLoad">Retry</button>
      </div>

      <!-- ⭐ No Data State - Only show when NOT loading and data is empty -->
      <div v-else-if="storeStockData.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No Products Found</h3>
        <p v-if="selectedStore">
          No products are currently tracked in <strong>{{ selectedStore.name }}</strong>
        </p>
        <p v-else>Please select a store to view audit data</p>
        <div class="empty-actions">
          <p class="empty-hint">💡 To add products, you need to:</p>
          <ul class="empty-list">
            <li>1. Create items in the Items module</li>
            <li>2. Initialize balances for each store-group combination</li>
          </ul>
        </div>
      </div>

      <!-- ⭐ No Results State (filtered out) -->
      <div v-else-if="filteredAuditData.length === 0 && storeStockData.length > 0 && !loading" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No Results Found</h3>
        <p>No products match your current filters</p>
        <button class="btn-clear-filters" @click="clearFilters">Clear Filters</button>
      </div>

      <!-- Table -->
      <table v-else-if="filteredAuditData.length > 0" class="audit-table">
        <thead>
          <tr>
            <th rowspan="2" style="width:35px">#</th>
            <th rowspan="2" style="min-width:80px">Item Code</th>
            <th rowspan="2" style="min-width:120px">Product Name</th>
            <th rowspan="2" style="min-width:100px">Category</th>
            <th rowspan="2" style="min-width:60px">UOM</th>
            <th v-for="group in activeGroups" :key="group.id" :colspan="1" style="min-width:80px">
              {{ group.name }}
            </th>
            <th rowspan="2" style="min-width:80px">Status</th>
            <th rowspan="2" style="min-width:60px">Action</th>
          </tr>
          <tr>
            <!-- Empty row for group sub-headers -->
          </tr>
        </thead>
        <tbody>
          <template v-for="(item, index) in paginatedAuditData" :key="item.productId || item.itemId">
            <tr :class="getRowClass(item)">
              <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="code">{{ item.code }}</td>
              <td>
                <div class="product-info">
                  <span class="common-name">{{ item.commonName || item.itemName }}</span>
                  <span class="standard-name">{{ item.standardName || '' }}</span>
                 
                </div>
              </td>
              <td>{{ item.category || '-' }}</td>
              <td>{{ item.uom || item.uomCode || '-' }}</td>

              <!-- Group Balances -->
              <td v-for="group in activeGroups" :key="group.id"
                  :class="getCellClass(item, group.id)">
                {{ getGroupValue(item, group.id) }}
              </td>

           <td>
  <span :class="['status-badge', getStatusClass(item.status)]">
    {{ item.status }}
  </span>
  <span 
    v-if="item.hasDateDiff" 
    class="date-diff-icon clickable" 
    title="Different last transaction dates across groups - Click to update"
    @click.stop="openDateUpdateModal(item)"
  >
    📅
  </span>
</td>
              <td>
                <button
                  @click="openTransactionModal(item)"
                  class="btn-transaction"
                  title="View Transactions"
                  :disabled="!item.itemId"
                >
                  📋
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="filteredAuditData.length > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Next →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
      </select>
    </div>

    <!-- ==================== TRANSACTION DETAIL MODAL ==================== -->
    <div v-if="showTransactionModal" class="modal-overlay" @click.self="closeTransactionModal">
      <div class="modal-container transaction-modal">
        <div class="modal-header">
          <h3>📋 Transaction History</h3>
          <button class="modal-close" @click="closeTransactionModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Product Info -->
          <div class="transaction-product">
            <h4>{{ selectedItem?.commonName || selectedItem?.itemName }}</h4>
            <div class="product-meta">
              <span><strong>Code:</strong> {{ selectedItem?.code }}</span>
              <span><strong>Category:</strong> {{ selectedItem?.category || '-' }}</span>
              <span><strong>Store:</strong> {{ selectedStoreName }}</span>
              <span><strong>Status:</strong>
                <span :class="['status-badge', getStatusClass(selectedItem?.status)]">
                  {{ selectedItem?.status }}
                </span>
                <span v-if="selectedItem?.hasDateDiff" class="date-diff-icon" title="Different last transaction dates across groups">
                  📅
                </span>
              </span>
            </div>
          </div>

          <!-- Group Tabs -->
          <div class="group-tabs">
            <button
              v-for="group in activeGroups"
              :key="group.id"
              :class="['group-tab', { active: selectedGroupTab === group.id }]"
              @click="selectedGroupTab = group.id"
            >
              {{ group.name }}
            </button>
          </div>

          <!-- Transaction List -->
          <div class="transaction-list">
            <div v-if="loadingTransactions" class="loading-transactions">
              <div class="spinner-small"></div>
              <span>Loading transactions...</span>
            </div>

            <div v-else-if="getGroupTransactions(selectedGroupTab).length === 0" class="no-transactions">
              <div class="empty-icon-small">📭</div>
              <p>No transactions found for this group</p>
            </div>

            <div v-else class="transaction-items">
              <div
                v-for="(tx, idx) in getGroupTransactions(selectedGroupTab)"
                :key="idx"
                class="transaction-item"
                :class="(tx.transactionType || tx.type || 'adjustment').toLowerCase()"
              >
                <div class="tx-header">
                  <span class="tx-date">{{ formatDate(tx.createdAt || tx.date) }}</span>
                  <span :class="['tx-type-badge', (tx.transactionType || tx.type || 'adjustment').toLowerCase()]">
                    {{ tx.transactionType || tx.type || 'ADJUSTMENT' }}
                  </span>
                  <span class="tx-reference" v-if="tx.referenceId || tx.reference">Ref: {{ tx.referenceId || tx.reference }}</span>
                </div>
                <div class="tx-details">
                  <span class="tx-quantity" :class="(tx.changeAmount || tx.quantity || 0) > 0 ? 'positive' : 'negative'">
                    {{ (tx.changeAmount || tx.quantity || 0) > 0 ? '+' : '' }}{{ tx.changeAmount || tx.quantity || 0 }}
                  </span>
                  <span class="tx-balance">Balance: {{ tx.newBalance || tx.balanceAfter || 0 }}</span>
                  <span class="tx-user" v-if="tx.changedBy || tx.user">👤 {{ tx.changedBy || tx.user }}</span>
                </div>
                <div class="tx-notes" v-if="tx.remark || tx.notes">💬 {{ tx.remark || tx.notes }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeTransactionModal">Close</button>
        </div>
      </div>
    </div>


<!-- ==================== DATE UPDATE MODAL ==================== -->
<div v-if="showDateUpdateModal" class="modal-overlay" @click.self="closeDateUpdateModal">
  <div class="modal-container date-update-modal">
    <div class="modal-header">
      <h3>📅 Update Last Transaction Dates</h3>
      <button class="modal-close" @click="closeDateUpdateModal">✕</button>
    </div>
    <div class="modal-body">
      <!-- Product Info -->
      <div class="transaction-product">
        <h4>{{ selectedDateItem?.commonName || selectedDateItem?.itemName }}</h4>
        <div class="product-meta">
          <span><strong>Code:</strong> {{ selectedDateItem?.code }}</span>
          <span><strong>Category:</strong> {{ selectedDateItem?.category || '-' }}</span>
          <span><strong>Store:</strong> {{ selectedStoreName }}</span>
          <span><strong>Status:</strong> 
            <span :class="['status-badge', getStatusClass(selectedDateItem?.status)]">
              {{ selectedDateItem?.status }}
            </span>
            <span v-if="selectedDateItem?.hasDateDiff" class="date-diff-icon">📅</span>
          </span>
        </div>
        <div class="date-diff-summary" v-if="selectedDateItem?.dateDiffDetails">
          <span class="diff-badge">
            ⚠️ Different dates detected: 
            {{ selectedDateItem.dateDiffDetails.diffDays }} day(s) apart
          </span>
        </div>
      </div>

      <!-- Group Date Cards -->
      <div class="group-date-cards">
        <div 
          v-for="group in activeGroups" 
          :key="group.id"
          class="group-date-card"
          :class="{ 'has-date': getGroupLastTxDate(selectedDateItem, group.id) }"
        >
          <div class="group-date-header">
            <span class="group-name">{{ group.name }}</span>
            <span class="group-balance">Balance: {{ getGroupValue(selectedDateItem, group.id) }}</span>
          </div>
          <div class="group-date-body">
            <div class="date-display">
              <span class="date-label">Last Transaction:</span>
              <span class="date-value" v-if="getGroupLastTxDate(selectedDateItem, group.id)">
                {{ formatDate(getGroupLastTxDate(selectedDateItem, group.id)) }}
              </span>
              <span class="date-value no-date" v-else>No transactions</span>
            </div>
            <div class="date-actions">
              <button 
                class="btn-update-date" 
                @click="openDatePicker(selectedDateItem, group.id)"
                :disabled="!getGroupLastTxDate(selectedDateItem, group.id)"
              >
                ✏️ Update
              </button>
              <button 
                class="btn-reset-date" 
                @click="resetToLatestDate(selectedDateItem, group.id)"
                v-if="getGroupLastTxDate(selectedDateItem, group.id)"
                title="Set to latest date across all groups"
              >
                📋 Sync
              </button>
            </div>
          </div>
          <div class="group-date-footer" v-if="selectedDateItem?._tempDate && selectedDateItem._tempDate[group.id]">
            <span class="temp-date-label">New date:</span>
            <span class="temp-date-value">{{ formatDate(selectedDateItem._tempDate[group.id]) }}</span>
            <button class="btn-apply-date" @click="applyDateUpdate(selectedDateItem, group.id)">
              ✅ Apply
            </button>
            <button class="btn-cancel-date" @click="cancelDateUpdate(selectedDateItem, group.id)">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Date Picker (hidden input) -->
      <input 
        type="datetime-local" 
        ref="datePickerInput"
        style="display: none;"
        @change="onDatePickerChange"
      />
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" @click="closeDateUpdateModal">Close</button>
      <button class="btn-primary" @click="saveAllDateUpdates" :disabled="savingDates">
        {{ savingDates ? 'Saving...' : '💾 Save All Changes' }}
      </button>
    </div>
  </div>
</div>
    

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Audit Report</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Report
            </div>
            <div class="export-option" @click="exportType = 'outlier'">
              <input type="radio" v-model="exportType" value="outlier" /> Outliers Only
            </div>
            <div class="export-option" @click="exportType = 'conflict'">
              <input type="radio" v-model="exportType" value="conflict" /> Conflicts Only
            </div>
            <div class="export-option" @click="exportType = 'dateDiff'">
              <input type="radio" v-model="exportType" value="dateDiff" /> 📅 Date Diff Only
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary Report
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
          <button class="btn-primary" @click="exportSelectedReport" :disabled="exporting || filteredAuditData.length === 0">
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
import auditService from '@/stores/auditService'

// ================================================================
// STATE
// ================================================================
const stores = ref([])
const selectedStoreId = ref('')
const searchQuery = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

const loading = ref(false)
const refreshing = ref(false)
const exporting = ref(false)
const loadingTransactions = ref(false)
const error = ref(null)

// Stock data for selected store
const storeStockData = ref([])
const auditData = ref(null)
const categoriesList = ref([])

// Store balance counts
const storeBalanceCounts = ref({})

// Modal
const showTransactionModal = ref(false)
const selectedItem = ref(null)
const selectedGroupTab = ref('')
const showExportModal = ref(false)
const exportType = ref('full')

// Transaction data per group
const groupTransactions = ref({})

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// NEW STATE FOR DATE UPDATE
// ================================================================
const showDateUpdateModal = ref(false)
const selectedDateItem = ref(null)
const savingDates = ref(false)
const datePickerInput = ref(null)
let currentDatePickerGroup = null


// ================================================================
// COMPUTED
// ================================================================
const selectedStore = computed(() => {
  return stores.value.find(s => s.id === selectedStoreId.value)
})

const selectedStoreName = computed(() => {
  return selectedStore.value?.name || ''
})

const activeGroups = computed(() => {
  if (auditData.value?.groups) {
    return auditData.value.groups.map(g => ({
      id: g.groupId,
      groupId: g.groupId,
      name: g.name,
      code: g.code || ''
    }))
  }
  return selectedStore.value?.groups || []
})

const categories = computed(() => {
  if (auditData.value?.categories && auditData.value.categories.length > 0) {
    return auditData.value.categories
  }
  const cats = new Set()
  storeStockData.value.forEach(item => {
    if (item.category) cats.add(item.category)
  })
  return Array.from(cats)
})

const filteredAuditData = computed(() => {
  let result = storeStockData.value

  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      (item.code || '').toLowerCase().includes(s) ||
      (item.commonName || item.itemName || '').toLowerCase().includes(s) ||
      (item.standardName || '').toLowerCase().includes(s)
    )
  }

  if (filterCategory.value) {
    result = result.filter(item => item.category === filterCategory.value)
  }

  if (filterStatus.value) {
    if (filterStatus.value === 'DateDiff') {
      result = result.filter(item => item.hasDateDiff === true)
    } else {
      result = result.filter(item => item.status === filterStatus.value)
    }
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredAuditData.value.length / pageSize.value) || 1
})

const paginatedAuditData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredAuditData.value.slice(start, start + pageSize.value)
})

const matchedCount = computed(() => {
  return filteredAuditData.value.filter(item => item.status === 'Matched').length
})

const outlierCount = computed(() => {
  return filteredAuditData.value.filter(item => item.status === 'Outlier').length
})

const conflictCount = computed(() => {
  return filteredAuditData.value.filter(item => item.status === 'Conflict').length
})

const dateDiffCount = computed(() => {
  return filteredAuditData.value.filter(item => item.hasDateDiff === true).length
})





// ================================================================
// NEW METHODS FOR DATE UPDATE
// ================================================================

/**
 * Open the date update modal
 */
const openDateUpdateModal = (item) => {
  if (!item.hasDateDiff) {
    showToastMessage('No date differences to update', 'info')
    return
  }
  
  // Create a deep copy to avoid mutating the original
  selectedDateItem.value = JSON.parse(JSON.stringify(item))
  selectedDateItem.value._tempDate = {}
  showDateUpdateModal.value = true
}

/**
 * Close the date update modal
 */
const closeDateUpdateModal = () => {
  showDateUpdateModal.value = false
  selectedDateItem.value = null
  currentDatePickerGroup = null
}

/**
 * Get the last transaction date for a specific group
 */
const getGroupLastTxDate = (item, groupId) => {
  if (!item || !item.groupLastTxDates) return null
  return item.groupLastTxDates[groupId] || null
}

/**
 * Open the date picker for a specific group
 */
const openDatePicker = (item, groupId) => {
  const currentDate = getGroupLastTxDate(item, groupId)
  if (!currentDate) {
    showToastMessage('No transaction date to update', 'error')
    return
  }
  
  currentDatePickerGroup = groupId
  
  // Format the date for the datetime-local input
  const date = new Date(currentDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  // Set the value and trigger the picker
  if (datePickerInput.value) {
    datePickerInput.value.value = `${year}-${month}-${day}T${hours}:${minutes}`
    datePickerInput.value.showPicker()
  }
}

/**
 * Handle date picker change
 */
const onDatePickerChange = (event) => {
  if (!selectedDateItem.value || !currentDatePickerGroup) return
  
  const newDate = event.target.value
  if (newDate) {
    if (!selectedDateItem.value._tempDate) {
      selectedDateItem.value._tempDate = {}
    }
    selectedDateItem.value._tempDate[currentDatePickerGroup] = newDate
    showToastMessage('Date updated temporarily. Click "Apply" to save.', 'info')
  }
  currentDatePickerGroup = null
}

/**
 * Apply a single date update
 */
const applyDateUpdate = (item, groupId) => {
  if (!item._tempDate || !item._tempDate[groupId]) {
    showToastMessage('No date change to apply', 'error')
    return
  }
  
  // Update the actual date
  item.groupLastTxDates[groupId] = item._tempDate[groupId]
  delete item._tempDate[groupId]
  
  // Recalculate date diff
  recalculateDateDiff(item)
  
  showToastMessage('Date updated successfully', 'success')
}

/**
 * Cancel a date update
 */
const cancelDateUpdate = (item, groupId) => {
  if (item._tempDate) {
    delete item._tempDate[groupId]
  }
  showToastMessage('Date update cancelled', 'info')
}

/**
 * Reset to the latest date across all groups
 */
const resetToLatestDate = (item, groupId) => {
  const allDates = Object.values(item.groupLastTxDates || {}).filter(d => d)
  if (allDates.length === 0) return
  
  const latestDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())))
  
  if (!item._tempDate) {
    item._tempDate = {}
  }
  item._tempDate[groupId] = latestDate.toISOString()
  
  showToastMessage(`Set to latest date: ${formatDate(latestDate.toISOString())}`, 'info')
}

/**
 * Recalculate date diff after updates
 */
const recalculateDateDiff = (item) => {
  const dates = Object.values(item.groupLastTxDates || {}).filter(d => d)
  const uniqueDateStrings = [...new Set(dates.map(d => new Date(d).toDateString()))]
  const hasDateDiff = uniqueDateStrings.length > 1
  
  item.hasDateDiff = hasDateDiff
  
  if (hasDateDiff && dates.length > 1) {
    const dateObjects = dates.map(d => new Date(d))
    const latestDate = new Date(Math.max(...dateObjects.map(d => d.getTime())))
    const earliestDate = new Date(Math.min(...dateObjects.map(d => d.getTime())))
    const diffMs = latestDate - earliestDate
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    
    item.dateDiffDetails = {
      latestDate: latestDate.toISOString(),
      earliestDate: earliestDate.toISOString(),
      diffDays: diffDays,
      diffHours: Math.round(diffMs / (1000 * 60 * 60)),
      uniqueDates: uniqueDateStrings,
    }
  } else {
    item.dateDiffDetails = null
  }
}

/**
 * Save all date updates to the backend
 */
const saveAllDateUpdates = async () => {
  if (!selectedDateItem.value) return
  
  savingDates.value = true
  
  try {
    // Build the update payload
    const updates = {}
    const groups = activeGroups.value
    
    for (const group of groups) {
      const date = getGroupLastTxDate(selectedDateItem.value, group.id)
      if (date) {
        updates[group.id] = date
      }
    }
    
    // Call API to update dates
    const result = await auditService.updateItemTransactionDates(
      selectedStoreId.value,
      selectedDateItem.value.itemId,
      updates
    )
    
    if (result.success) {
      showToastMessage('All dates updated successfully!', 'success')
      
      // Update local data
      const originalItem = storeStockData.value.find(
        item => item.itemId === selectedDateItem.value.itemId
      )
      if (originalItem) {
        originalItem.groupLastTxDates = { ...selectedDateItem.value.groupLastTxDates }
        originalItem.hasDateDiff = selectedDateItem.value.hasDateDiff
        originalItem.dateDiffDetails = selectedDateItem.value.dateDiffDetails
      }
      
      closeDateUpdateModal()
      
      // Refresh data to reflect changes
      await refreshData()
    } else {
      showToastMessage(result.error || 'Failed to update dates', 'error')
    }
  } catch (error) {
    console.error('Error saving date updates:', error)
    showToastMessage('Failed to save date updates', 'error')
  } finally {
    savingDates.value = false
  }
}

// ================================================================
// METHODS
// ================================================================

const getStatusClass = (status) => {
  if (!status) return 'unknown'
  const map = {
    'Matched': 'matched',
    'Outlier': 'outlier',
    'Conflict': 'conflict',
    'No Data': 'unknown'
  }
  return map[status] || 'unknown'
}

// -- Load Categories --
const loadCategories = async () => {
  try {
    console.log('📂 Loading categories...')
    const result = await auditService.getCategories()
    if (result.success) {
      categoriesList.value = result.data.map(cat => cat.name)
    }
  } catch (err) {
    console.error('❌ Error loading categories:', err)
  }
}

// -- Load Stores --
const loadStores = async () => {
  try {
    console.log('🏪 Loading stores...')
    const result = await auditService.getStoresWithGroups()
    console.log('📥 Stores response:', result)

    if (result.success && result.data.length > 0) {
      stores.value = result.data.map((store) => {
        const storeId = store.id;
        return {
          ...store,
          id: storeId,
          groups: (store.groups || []).map(group => ({
            ...group,
            id: group.id || group.groupId,
            groupId: group.groupId || group.id
          }))
        }
      })

      await autoSelectStore()
    } else {
      console.warn('No stores found')
      error.value = 'No stores available'
    }
  } catch (err) {
    console.error('❌ Error loading stores:', err)
    error.value = 'Failed to load stores'
    showToastMessage('Failed to load stores', 'error')
  }
}

const autoSelectStore = async () => {
  console.log('🔄 Auto-selecting store...');

  if (!stores.value || stores.value.length === 0) {
    console.warn('No stores available to auto-select');
    return;
  }

  const storesToCheck = stores.value.filter(store => store.id);

  if (storesToCheck.length === 0) {
    console.warn('No valid stores to check');
    return;
  }

  // Check stores with balances
  for (const store of storesToCheck) {
    try {
      const result = await auditService.getStoreAudit(store.id, {
        includeTransactions: false,
        transactionLimit: 1
      });
      if (result.success) {
        const count = result.data.summary?.totalItems || 0;
        storeBalanceCounts.value[store.id] = count;
      }
    } catch (err) {
      storeBalanceCounts.value[store.id] = 0;
    }
  }

  // Find a store with balances
  let storeWithBalances = storesToCheck.find(store => (storeBalanceCounts.value[store.id] || 0) > 0);

  if (storeWithBalances) {
    selectedStoreId.value = storeWithBalances.id;
  } else if (storesToCheck.length > 0) {
    selectedStoreId.value = storesToCheck[0].id;
  } else {
    return;
  }

  if (selectedStoreId.value) {
    await loadStoreData(selectedStoreId.value);
  }
}

// -- Load Store Data --
const loadStoreData = async (storeId) => {
  if (!storeId) {
    storeStockData.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log(`🔍 Loading audit data for store: ${storeId}`)
    const result = await auditService.getStoreAudit(storeId, {
      includeTransactions: true,
      transactionLimit: 10
    })

    if (result.success) {
      auditData.value = result.data

      if (result.data.categories) {
        categoriesList.value = result.data.categories
      }

      const transformedData = transformAuditData(result.data)
      storeStockData.value = transformedData

      storeBalanceCounts.value[storeId] = transformedData.length

      if (result.data.store) {
        const existingStore = stores.value.find(s => s.id === result.data.store.id)
        if (existingStore && result.data.groups) {
          existingStore.groups = result.data.groups.map(g => ({
            id: g.groupId,
            groupId: g.groupId,
            name: g.name,
            code: g.code || ''
          }))
        }
      }

      if (transformedData.length === 0) {
        console.log(`ℹ️ No products found for this store`)
      } else {
        showToastMessage(`Loaded ${transformedData.length} products`, 'success')
      }
    } else {
      console.error('Failed to load audit data:', result)
      error.value = result.error || 'Failed to load audit data'
      showToastMessage('Failed to load audit data', 'error')
    }
  } catch (err) {
    console.error('❌ Error loading store audit:', err)
    error.value = err.message || 'Failed to load audit data'
    showToastMessage('Failed to load audit data', 'error')
  } finally {
    loading.value = false
  }
}

// -- Transform Audit Data --
const transformAuditData = (data) => {
  console.log('🔄 Transform audit data:', data)

  if (!data) {
    return []
  }

  if (data.comparison && data.comparison.items) {
    const totalGroups = data.groups ? data.groups.length : 0

    return data.comparison.items.map(item => {
      const groupBalances = item.groupBalances || {}
      const groupLastTxDates = item.groupLastTxDates || {}

      const values = Object.values(groupBalances).filter(v => v !== undefined && v !== null)
      const missingCount = totalGroups - values.length

      // Check for date differences
      const dates = Object.values(groupLastTxDates).filter(d => d !== undefined && d !== null)
      const uniqueDates = [...new Set(dates.map(d => new Date(d).toDateString()))]
      const hasDateDiff = uniqueDates.length > 1

      let status = 'No Data'
      let statusClass = 'unknown'

      if (values.length === 0) {
        status = 'No Data'
        statusClass = 'no-data'
      } else if (missingCount > 0) {
        status = 'Conflict'
        statusClass = 'conflict'
      } else {
        const uniqueValues = [...new Set(values)]
        if (uniqueValues.length === 1) {
          status = 'Matched'
          statusClass = 'matched'
        } else if (uniqueValues.length === 2) {
          status = 'Outlier'
          statusClass = 'outlier'
        } else {
          status = 'Conflict'
          statusClass = 'conflict'
        }
      }

      return {
        productId: item.itemId,
        itemId: item.itemId,
        code: item.code || '',
        commonName: item.commonName || item.itemName || 'Unknown',
        itemName: item.itemName || 'Unknown',
        standardName: item.standardName || '',
        category: item.category || 'General',
        uom: item.uomCode || '',
        uomCode: item.uomCode || '',
        groupBalances: groupBalances,
        groupLastTxDates: groupLastTxDates,
        hasDateDiff: hasDateDiff,
        dateDiffDetails: hasDateDiff ? {
          uniqueDates: uniqueDates,
          dateCount: dates.length,
          latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null,
          earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : null,
        } : null,
        status: status,
        statusClass: statusClass
      }
    })
  }

  // Fallback: Build from groups data
  if (!data.groups) {
    return []
  }

  const groups = data.groups || []
  const totalGroups = groups.length
  const itemMap = new Map()

  groups.forEach(group => {
    const balances = group.balances || []
    balances.forEach(balance => {
      if (!itemMap.has(balance.itemId)) {
        itemMap.set(balance.itemId, {
          productId: balance.itemId,
          itemId: balance.itemId,
          code: balance.itemCode || '',
          commonName: balance.itemCommonName || balance.itemName || 'Unknown',
          itemName: balance.itemName || 'Unknown',
          standardName: balance.itemCommonName || '',
          category: balance.category || 'General',
          uom: balance.uomCode || '',
          uomCode: balance.uomCode || '',
          groupBalances: {},
          groupLastTxDates: {},
          hasDateDiff: false,
          dateDiffDetails: null,
          status: 'Matched'
        })
      }
    })
  })

  groups.forEach(group => {
    const groupId = group.groupId
    const balances = group.balances || []

    balances.forEach(balance => {
      const item = itemMap.get(balance.itemId)
      if (item) {
        item.groupBalances[groupId] = balance.balance
        if (balance.lastTransactionDate) {
          item.groupLastTxDates[groupId] = balance.lastTransactionDate
        }
      }
    })
  })

  itemMap.forEach((item) => {
    const values = Object.values(item.groupBalances).filter(v => v !== undefined && v !== null)
    const missingCount = totalGroups - values.length

    const dates = Object.values(item.groupLastTxDates).filter(d => d !== undefined && d !== null)
    const uniqueDates = [...new Set(dates.map(d => new Date(d).toDateString()))]
    const hasDateDiff = uniqueDates.length > 1

    if (values.length === 0) {
      item.status = 'No Data'
      item.statusClass = 'no-data'
    } else if (missingCount > 0) {
      item.status = 'Conflict'
      item.statusClass = 'conflict'
    } else {
      const uniqueValues = [...new Set(values)]
      if (uniqueValues.length === 1) {
        item.status = 'Matched'
        item.statusClass = 'matched'
      } else if (uniqueValues.length === 2) {
        item.status = 'Outlier'
        item.statusClass = 'outlier'
      } else {
        item.status = 'Conflict'
        item.statusClass = 'conflict'
      }
    }

    item.hasDateDiff = hasDateDiff
    item.dateDiffDetails = hasDateDiff ? {
      uniqueDates: uniqueDates,
      dateCount: dates.length,
      latestDate: dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null,
      earliestDate: dates.length > 0 ? new Date(Math.min(...dates.map(d => new Date(d).getTime()))) : null,
    } : null
  })

  return Array.from(itemMap.values())
}

// -- Store Change --
const onStoreChange = async () => {
  if (selectedStoreId.value) {
    currentPage.value = 1
    filterCategory.value = ''
    filterStatus.value = ''
    searchQuery.value = ''
    await loadStoreData(selectedStoreId.value)
  } else {
    storeStockData.value = []
  }
}

const getGroupValue = (item, groupId) => {
  const value = item.groupBalances?.[groupId]
  return value !== undefined && value !== null ? value : '-'
}

const getRowClass = (item) => {
  if (item.status === 'Conflict') return 'conflict-row'
  if (item.status === 'Outlier') return 'outlier-row'
  if (item.status === 'Matched' && item.hasDateDiff) return 'date-diff-row'
  if (item.status === 'Matched') return 'matched-row'
  return ''
}

const getCellClass = (item, groupId) => {
  const value = getGroupValue(item, groupId)
  const values = Object.values(item.groupBalances || {})

  if (values.length === 0) return 'normal-cell'

  const uniqueValues = [...new Set(values)]

  if (uniqueValues.length === 1) {
    return 'normal-cell'
  } else if (uniqueValues.length === 2) {
    const majorityValue = values.find(v => values.filter(x => x === v).length > 1)

    if (value === majorityValue) {
      return 'normal-cell'
    } else {
      return 'outlier-cell'
    }
  } else {
    return 'conflict-cell'
  }
}

// -- Transaction Modal --
const openTransactionModal = async (item) => {
  if (!item.itemId) {
    showToastMessage('No item ID found for this product', 'error')
    return
  }

  selectedItem.value = item
  const groups = activeGroups.value
  selectedGroupTab.value = groups.length > 0 ? groups[0].id : ''
  groupTransactions.value = {}

  loadingTransactions.value = true

  try {
    const result = await auditService.getItemTransactions(
      selectedStoreId.value,
      item.itemId,
      20
    )

    if (result.success && result.data) {
      const data = result.data

      if (data.groupTransactions) {
        Object.entries(data.groupTransactions).forEach(([groupId, groupData]) => {
          groupTransactions.value[groupId] = groupData.transactions.map(tx => ({
            ...tx,
            date: tx.createdAt,
            type: tx.transactionType || 'ADJUSTMENT',
            quantity: tx.changeAmount,
            balanceAfter: tx.newBalance,
            user: tx.changedBy,
            reference: tx.referenceId,
            notes: tx.remark
          }))
        })
      }

      if (Object.keys(groupTransactions.value).length === 0) {
        showToastMessage('No transactions found for this item', 'info')
      }
    } else {
      // Fallback: try loading transactions per group
      for (const group of groups) {
        try {
          const groupResult = await auditService.getGroupTransactions(
            selectedStoreId.value,
            group.id,
            { page: 1, limit: 20 }
          )
          if (groupResult.success) {
            const itemTransactions = groupResult.data.transactions?.filter(
              tx => tx.itemId === item.itemId || tx.itemCode === item.code
            ) || []
            groupTransactions.value[group.id] = itemTransactions.map(tx => ({
              ...tx,
              date: tx.createdAt,
              type: tx.transactionType || 'ADJUSTMENT',
              quantity: tx.changeAmount,
              balanceAfter: tx.newBalance,
              user: tx.changedBy,
              reference: tx.referenceId,
              notes: tx.remark
            }))
          }
        } catch (err) {
          console.warn(`Failed to load transactions for group ${group.id}:`, err)
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to load transactions:', error)
    showToastMessage('Failed to load transactions', 'error')
  } finally {
    loadingTransactions.value = false
  }

  showTransactionModal.value = true
}

const closeTransactionModal = () => {
  showTransactionModal.value = false
  selectedItem.value = null
  selectedGroupTab.value = ''
  groupTransactions.value = {}
}

const getGroupTransactions = (groupId) => {
  return groupTransactions.value[groupId] || []
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

// -- Filters --
const onSearchChange = () => {
  currentPage.value = 1
}

const onFilterChange = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  filterCategory.value = ''
  filterStatus.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
}

// -- Refresh --
const refreshData = async () => {
  refreshing.value = true
  try {
    await loadStoreData(selectedStoreId.value)
    showToastMessage('Data refreshed successfully!', 'success')
  } catch (error) {
    showToastMessage('Failed to refresh data', 'error')
  } finally {
    refreshing.value = false
  }
}

// -- Retry --
const retryLoad = () => {
  error.value = null
  if (selectedStoreId.value) {
    loadStoreData(selectedStoreId.value)
  } else {
    loadStores()
  }
}

// -- Export --
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
    const blob = await auditService.exportAuditData(selectedStoreId.value, {
      includeTransactions: exportType.value === 'full' || exportType.value === 'summary',
      filterBy: exportType.value
    })

    const filename = `audit_report_${selectedStoreName.value || 'store'}_${new Date().toISOString().split('T')[0]}.csv`
    auditService.downloadFile(blob, filename)

    showToastMessage('Export completed successfully!', 'success')
  } catch (error) {
    console.error('Export failed:', error)
    showToastMessage('Failed to export data', 'error')
  } finally {
    exporting.value = false
    closeExportModal()
  }
}

// -- Pagination --
const changePage = (page) => {
  currentPage.value = page
}

const changePageSize = () => {
  currentPage.value = 1
}

// -- Toast --
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
  loadStores()
  loadCategories()
})
</script>

<style scoped>
/* ================================================================
   EXISTING STYLES (keep all your existing styles)
   ================================================================ */

/* ⭐ NEW: Enhanced Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.loading-state .loading-text {
  font-size: 18px;
  font-weight: 500;
  color: #1e293b;
  margin-top: 12px;
  margin-bottom: 4px;
}

.loading-state .loading-subtext {
  font-size: 14px;
  color: #94a3b8;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ⭐ NEW: Date Diff styles */
.summary-card.date-diff .summary-value {
  color: #8b5cf6;
}

.date-diff-row {
  background: #f5f3ff;
}

.date-diff-row:hover {
  background: #ede9fe;
}

.date-diff-indicator {
  font-size: 10px;
  margin-left: 4px;
  cursor: help;
}

.date-diff-icon {
  font-size: 10px;
  margin-left: 4px;
  cursor: help;
}

/* ⭐ Store name fix */
.summary-card .store-name {
  font-size: 14px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ⭐ No results state */
.empty-state .btn-clear-filters {
  margin-top: 12px;
  padding: 8px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.empty-state .btn-clear-filters:hover {
  background: #2563eb;
}

/* ⭐ NEW: Date Diff styles */
.summary-card.date-diff .summary-value {
  color: #8b5cf6;
}

.date-diff-row {
  background: #f5f3ff;
}

.date-diff-row:hover {
  background: #ede9fe;
}

.date-diff-indicator {
  font-size: 10px;
  margin-left: 4px;
  cursor: help;
}

.date-diff-icon {
  font-size: 10px;
  margin-left: 4px;
  cursor: help;
}

/* ⭐ Store name fix */
.summary-card .store-name {
  font-size: 14px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ⭐ No results state */
.empty-state .btn-clear-filters {
  margin-top: 12px;
  padding: 8px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.empty-state .btn-clear-filters:hover {
  background: #2563eb;
}


/* ⭐ NEW: Date Diff styles */
.summary-card.date-diff .summary-value {
  color: #8b5cf6;
}

.date-diff-row {
  background: #f5f3ff;
}

.date-diff-row:hover {
  background: #ede9fe;
}

/* ⭐ NEW: Store name fix */
.summary-card .store-name {
  font-size: 14px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


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
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
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

.btn-refresh, .btn-export {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-refresh {
  background: #f1f5f9;
  color: #475569;
}

.btn-refresh:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-export {
  background: #10b981;
  color: white;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-refresh:disabled, .btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================
   LOADING STATE
   ================================================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-bottom: 12px;
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
   SUMMARY CARDS
   ================================================================ */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.summary-card .summary-label {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-card .summary-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.summary-card.success .summary-value {
  color: #10b981;
}

.summary-card.warning .summary-value {
  color: #f59e0b;
}

.summary-card.critical .summary-value {
  color: #ef4444;
}

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

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
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
}

.btn-clear-filters:hover {
  background: #e2e8f0;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 850px;
}

.audit-table th,
.audit-table td {
  padding: 8px 10px;
  text-align: center;
  border: 1px solid #e2e8f0;
  vertical-align: middle;
}

.audit-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.audit-table thead tr:first-child th {
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
}

.text-center {
  text-align: center;
}

.code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
}

.product-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.common-name {
  font-weight: 500;
  font-size: 12px;
}

.standard-name {
  font-size: 10px;
  color: #94a3b8;
}

/* Row colors */
.conflict-row {
  background: #fef2f2;
}

.conflict-row:hover {
  background: #fee2e2;
}

.outlier-row {
  background: #fffbeb;
}

.outlier-row:hover {
  background: #fef3c7;
}

.matched-row {
  background: #f0fdf4;
}

.matched-row:hover {
  background: #dcfce7;
}

/* Cell colors */
.outlier-cell {
  background: #fee2e2 !important;
  font-weight: 700;
  color: #dc2626;
}

.conflict-cell {
  background: #fef2f2 !important;
  font-weight: 700;
  color: #dc2626;
}

.normal-cell {
  background: white;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.matched {
  background: #dcfce7;
  color: #166534;
}

.status-badge.outlier {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.conflict {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.unknown {
  background: #f1f5f9;
  color: #64748b;
}

/* Transaction Button */
.btn-transaction {
  background: #e0e7ff;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-transaction:hover:not(:disabled) {
  background: #c7d2fe;
  transform: scale(1.05);
}

.btn-transaction:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 8px;
  font-size: 20px;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 16px;
  font-size: 14px;
}

.empty-state p strong {
  color: #1e293b;
}








/* ================================================================
   DATE UPDATE MODAL STYLES
   ================================================================ */
.date-update-modal .modal-container {
  max-width: 650px;
}

.date-diff-summary {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.diff-badge {
  font-size: 13px;
  color: #92400e;
  font-weight: 500;
}

.group-date-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.group-date-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
  transition: all 0.2s;
}

.group-date-card.has-date {
  border-left: 3px solid #3b82f6;
}

.group-date-card:hover {
  border-color: #cbd5e1;
}

.group-date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.group-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.group-balance {
  font-size: 12px;
  color: #64748b;
}

.group-date-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.date-label {
  font-size: 12px;
  color: #94a3b8;
}

.date-value {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.date-value.no-date {
  color: #94a3b8;
  font-style: italic;
}

.date-actions {
  display: flex;
  gap: 6px;
}

.btn-update-date,
.btn-reset-date,
.btn-apply-date,
.btn-cancel-date {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-update-date {
  background: #e0e7ff;
  color: #1e40af;
}

.btn-update-date:hover:not(:disabled) {
  background: #c7d2fe;
}

.btn-update-date:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-reset-date {
  background: #fef3c7;
  color: #92400e;
}

.btn-reset-date:hover {
  background: #fde68a;
}

.btn-apply-date {
  background: #10b981;
  color: white;
}

.btn-apply-date:hover {
  background: #059669;
}

.btn-cancel-date {
  background: #fee2e2;
  color: #991b1b;
}

.btn-cancel-date:hover {
  background: #fecaca;
}

.group-date-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.temp-date-label {
  font-size: 12px;
  color: #64748b;
}

.temp-date-value {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  transform: scale(1.2);
}


















.empty-actions {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px 24px;
  max-width: 500px;
  margin: 0 auto;
  text-align: left;
}

.empty-hint {
  color: #475569 !important;
  font-weight: 500;
  margin-bottom: 8px !important;
}

.empty-list {
  color: #64748b;
  margin: 0;
  padding-left: 20px;
}

.empty-list li {
  padding: 4px 0;
  font-size: 13px;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
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
   TRANSACTION MODAL
   ================================================================ */
.transaction-modal .modal-container {
  max-width: 750px;
}

.transaction-product {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.transaction-product h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}

.product-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.group-tab {
  padding: 6px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.group-tab:hover {
  background: #f1f5f9;
}

.group-tab.active {
  color: #3b82f6;
  background: #eff6ff;
}

.transaction-list {
  max-height: 400px;
  overflow-y: auto;
}

.loading-transactions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: #64748b;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.no-transactions {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-icon-small {
  font-size: 32px;
  margin-bottom: 8px;
}

.transaction-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  background: white;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.transaction-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.transaction-item.stock_in {
  border-left: 3px solid #10b981;
}

.transaction-item.stock_out {
  border-left: 3px solid #ef4444;
}

.transaction-item.adjustment {
  border-left: 3px solid #f59e0b;
}

.tx-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.tx-date {
  font-size: 12px;
  color: #64748b;
}

.tx-type-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.tx-type-badge.stock_in {
  background: #dcfce7;
  color: #166534;
}

.tx-type-badge.stock_out {
  background: #fee2e2;
  color: #991b1b;
}

.tx-type-badge.adjustment {
  background: #fef3c7;
  color: #92400e;
}

.tx-reference {
  font-size: 11px;
  color: #94a3b8;
}

.tx-details {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.tx-quantity {
  font-weight: 600;
  font-size: 14px;
}

.tx-quantity.positive {
  color: #16a34a;
}

.tx-quantity.negative {
  color: #dc2626;
}

.tx-balance {
  font-size: 13px;
  color: #475569;
}

.tx-user {
  font-size: 12px;
  color: #64748b;
}

.tx-notes {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
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
  max-width: 750px;
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
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

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

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

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

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

/* ================================================================
   EXPORT MODAL
   ================================================================ */
.export-modal .modal-container {
  max-width: 400px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
  white-space: nowrap;
  max-width: 90vw;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.info {
  border-left-color: #3b82f6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-refresh,
  .btn-export,
  .search-box,
  .filter-bar,
  .pagination,
  .btn-transaction {
    display: none !important;
  }
  
  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }
  
  .audit-table th,
  .audit-table td {
    border: 1px solid #ddd !important;
  }
  
  .status-badge {
    border: 1px solid #ddd !important;
  }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-bar select {
    width: 100%;
  }
  
  .audit-table {
    min-width: 700px;
  }
  
  .modal-container {
    margin: 10px;
    max-width: 100%;
  }
  
  .product-meta {
    flex-direction: column;
    gap: 4px;
  }
  
  .tx-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .tx-details {
    flex-wrap: wrap;
  }
}
</style>