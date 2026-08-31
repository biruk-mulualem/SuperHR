<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🏭 Production</h2>
        <span class="total-badge">{{ productionItems.length }} Records</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search records..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-issue" @click="openIssueModal">
          📤 Out for Production
        </button>
        <button class="btn-return" @click="openReturnModal">
          📥 Return from Production
        </button>
        <button class="btn-export" @click="openExportModal" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Report..." : "Report" }}
        </button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select
        v-model="filterCategory"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Categories</option>
        <option
          v-for="cat in categories"
          :key="cat.id"
          :value="cat.id"
        >
          {{ cat.name }}
        </option>
      </select>

      <select
        v-model="filterUom"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All UOM</option>
        <option value="kg">kg</option>
        <option value="pcs">pcs</option>
        <option value="m">m</option>
        <option value="L">L</option>
      </select>

      <select
        v-model="filterStatus"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Status</option>
        <option value="Out for Production">Out for Production</option>
        <option value="Additional Out for Production">Additional Out for Production</option>
        <option value="Returned from Production">Returned from Production</option>
      </select>

      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-grid" v-if="!isLoading">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalRecords }}</div>
          <div class="stat-label">Total Records</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📤</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalOutForProduction }}</div>
          <div class="stat-label">Out for Production</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📥</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalReturned }}</div>
          <div class="stat-label">Returned from Production</div>
        </div>
      </div>
    </div>

    <!-- ==================== PRODUCTION RECORDS TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading production records...</p>
      </div>
      <table v-else class="production-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>UOM</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="8" class="text-center">
              <div class="loading-spinner">Loading...</div>
            </td>
          </tr>
          <tr v-else-if="paginatedItems.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🏭</span>
                <p>No production records found</p>
              </div>
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedItems" :key="item.id">
            <td class="text-center">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>
            <td>
              <div class="date-value">
                {{ formatDate(item.date) }}
              </div>
            </td>
            <td>
              <div class="item-code">
                {{ item.itemCode }}
              </div>
            </td>
            <td>
              <div class="item-name-wrapper">
                <div class="item-common-name">
                  {{ item.itemName }}
                </div>
              </div>
            </td>
            <td>
              <span class="category-tag has-category">
                {{ item.categoryName || 'Uncategorized' }}
              </span>
            </td>
            <td>
              <div class="uom-wrapper">
                <div class="uom-code">{{ item.uomCode }}</div>
              </div>
            </td>
            <td>
              <div class="quantity-wrapper">
                <div
                  class="quantity-value"
                  :class="item.status.includes('Returned') ? 'returned' : 'issued'"
                >
                  {{ item.status.includes('Returned') ? '+' : '-' }}{{ formatNumber(item.quantity) }}
                </div>
              </div>
            </td>
            <td>
              <span
                :class="['status-badge', getStatusClass(item)]"
              >
                {{ item.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="filteredItems.length > 0">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        Next →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>

    <!-- ==================== OUT FOR PRODUCTION MODAL ==================== -->
    <div
      v-if="showIssueModal"
      class="modal-overlay"
      @click.self="closeIssueModal"
    >
      <div class="modal-container issue-modal">
        <div class="modal-header">
          <h3>📤 Out for Production</h3>
          <button class="modal-close" @click="closeIssueModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="issue-info">
            Record materials sent out for production.
          </p>

          <!-- Issue Type -->
          <div class="issue-type">
            <label>Type:</label>
            <div class="type-options">
              <label class="type-option">
                <input type="radio" v-model="issueType" value="Out for Production" checked />
                Normal
              </label>
              <label class="type-option">
                <input type="radio" v-model="issueType" value="Additional Out for Production" />
                Additional
              </label>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="issue-search">
            <div class="search-box-small">
              <span class="search-icon-small">🔍</span>
              <input
                type="text"
                v-model="issueSearchQuery"
                placeholder="Search materials..."
                @input="refreshIssueItems"
              />
            </div>
          </div>

          <div class="issue-filters">
            <select v-model="issueFilterCategory" class="filter-select" @change="refreshIssueItems">
              <option value="">All Categories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="issue-item-list">
            <div
              v-for="item in filteredIssueItems"
              :key="item.id"
              class="issue-item"
            >
              <div class="issue-item-info">
                <input
                  type="checkbox"
                  :checked="item.selected"
                  @change="toggleIssueItemSelection(item, $event)"
                  :disabled="item.currentStock <= 0"
                />
                <span class="issue-item-code">{{ item.itemCode }}</span>
                <span class="issue-item-name">{{ item.itemName }}</span>
                <span class="issue-item-uom">{{ item.uomCode }}</span>
                <span class="issue-item-balance">Balance: {{ formatNumber(item.currentStock) }}</span>
              </div>
              <div class="issue-item-input" v-if="item.selected">
                <label>Quantity:</label>
                <input
                  type="number"
                  v-model.number="item.issueQty"
                  :max="item.currentStock"
                  min="1"
                  step="1"
                  class="issue-qty-input"
                  @focus="selectAllText($event)"
                  @input="validateIssueQty(item)"
                />
                <span class="issue-after" v-if="item.issueQty > 0 && item.issueQty <= item.currentStock">
                  After: {{ formatNumber(item.currentStock - item.issueQty) }} {{ item.uomCode }}
                </span>
                <span class="issue-error" v-if="item.issueQty > item.currentStock">
                  ⚠️ Exceeds balance ({{ formatNumber(item.currentStock) }})
                </span>
                <span class="issue-max">(Max: {{ formatNumber(item.currentStock) }})</span>
              </div>
            </div>
            <div v-if="filteredIssueItems.length === 0" class="no-issue-items">
              No materials available. All items have zero balance.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeIssueModal">Cancel</button>
          <button
            class="btn-primary"
            @click="processIssue"
            :disabled="!hasSelectedIssueItems || processing"
          >
            {{ processing ? 'Processing...' : `Out ${selectedIssueCount} Item(s)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== RETURN FROM PRODUCTION MODAL ==================== -->
    <div
      v-if="showReturnModal"
      class="modal-overlay"
      @click.self="closeReturnModal"
    >
      <div class="modal-container return-modal">
        <div class="modal-header">
          <h3>📥 Return from Production</h3>
          <button class="modal-close" @click="closeReturnModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="return-info">
            Record materials returned from production.
          </p>

          <!-- Search Bar -->
          <div class="return-search">
            <div class="search-box-small">
              <span class="search-icon-small">🔍</span>
              <input
                type="text"
                v-model="returnSearchQuery"
                placeholder="Search materials..."
                @input="refreshReturnItems"
              />
            </div>
          </div>

          <div class="return-filters">
            <select v-model="returnFilterCategory" class="filter-select" @change="refreshReturnItems">
              <option value="">All Categories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="return-item-list">
            <div
              v-for="item in filteredReturnItems"
              :key="item.id"
              class="return-item"
            >
              <div class="return-item-info">
                <input
                  type="checkbox"
                  :checked="item.selected"
                  @change="toggleReturnItemSelection(item, $event)"
                />
                <span class="return-item-code">{{ item.itemCode }}</span>
                <span class="return-item-name">{{ item.itemName }}</span>
                <span class="return-item-uom">{{ item.uomCode }}</span>
              </div>
              <div class="return-item-input" v-if="item.selected">
                <label>Quantity:</label>
                <input
                  type="number"
                  v-model.number="item.returnQty"
                  min="1"
                  step="1"
                  class="return-qty-input"
                  @focus="selectAllText($event)"
                />
              </div>
            </div>
            <div v-if="filteredReturnItems.length === 0" class="no-return-items">
              No materials available for return.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeReturnModal">Cancel</button>
          <button
            class="btn-success"
            @click="processReturn"
            :disabled="!hasSelectedReturnItems || processing"
          >
            {{ processing ? 'Processing...' : `Return ${selectedReturnCount} Item(s)` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== CONFIRMATION MODAL ==================== -->
    <div
      v-if="showConfirmationModal"
      class="modal-overlay"
      @click.self="closeConfirmationModal"
    >
      <div class="modal-container confirmation-modal">
        <div class="modal-header confirmation-header">
          <div class="header-icon-wrapper">
            <span class="header-icon">⚠️</span>
          </div>
          <div>
            <h3>Confirm {{ confirmationType }}</h3>
            <p class="header-subtitle">Please review the records before confirming</p>
          </div>
          <button class="modal-close" @click="closeConfirmationModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-summary">
            <div class="summary-card">
              <span class="summary-label">Items</span>
              <span class="summary-value">{{ selectedItemsForConfirmation.length }}</span>
            </div>
            <div class="summary-card">
              <span class="summary-label">Total Quantity</span>
              <span class="summary-value">{{ totalConfirmationQty }}</span>
            </div>
          </div>

          <div class="confirmation-list-wrapper">
            <div class="list-header">
              <span>Item</span>
              <span>Quantity</span>
            </div>
            <div
              v-for="item in selectedItemsForConfirmation"
              :key="item.id"
              class="confirmation-item"
            >
              <div class="conf-item-info">
                <span class="conf-item-code">{{ item.itemCode }}</span>
                <span class="conf-item-name">{{ item.itemName }}</span>
              </div>
              <div class="conf-item-details">
                <span class="conf-item-source">
                  {{ item.qty }} {{ item.uomCode }}
                </span>
              </div>
            </div>
          </div>

          <div class="confirmation-warning">
            <span class="warning-icon">ℹ️</span>
            <span>This record will be added to the production history.</span>
          </div>
        </div>
        <div class="modal-footer confirmation-footer">
          <button class="btn-cancel" @click="closeConfirmationModal">✕ Cancel</button>
          <button
            class="btn-confirm"
            @click="confirmAction"
            :disabled="processing"
          >
            <span v-if="processing" class="spinner-small"></span>
            <span v-else>✅ Yes, Confirm</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div
      v-if="showExportModal"
      class="modal-overlay"
      @click.self="closeExportModal"
    >
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Generate Production Report</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" />
              Summary by Category
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="exportSelectedReport"
            :disabled="exporting"
          >
            {{ exporting ? "Generating..." : "Generate Report" }}
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

// ================================================================
// STATE
// ================================================================
const isLoading = ref(false)
const processing = ref(false)
const exporting = ref(false)
const exportType = ref('full')
const showExportModal = ref(false)
const showIssueModal = ref(false)
const showReturnModal = ref(false)
const showConfirmationModal = ref(false)
const searchQuery = ref('')
const filterCategory = ref('')
const filterUom = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Issue Type
const issueType = ref('Out for Production')

// Issue modal filters
const issueSearchQuery = ref('')
const issueFilterCategory = ref('')
const issueItems = ref([])

// Return modal filters
const returnSearchQuery = ref('')
const returnFilterCategory = ref('')
const returnItems = ref([])

// Confirmation
const selectedItemsForConfirmation = ref([])
const confirmationType = ref('Out for Production')

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// DEMO DATA - CATEGORIES
// ================================================================
const categories = ref([
  { id: 1, name: 'Raw Materials' },
  { id: 2, name: 'Chemicals' },
  { id: 3, name: 'Packaging' },
  { id: 4, name: 'Additives' }
])

// ================================================================
// DEMO DATA - PRODUCTION HISTORY RECORDS
// ================================================================
const productionItems = ref([
  {
    id: 1,
    date: '2026-08-25',
    itemCode: 'SDT000001',
    itemName: 'Cement',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    quantity: 500,
    status: 'Out for Production'
  },
  {
    id: 2,
    date: '2026-08-25',
    itemCode: 'SDT000002',
    itemName: 'Sand',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    quantity: 1000,
    status: 'Out for Production'
  },
  {
    id: 3,
    date: '2026-08-26',
    itemCode: 'SDT000004',
    itemName: 'Homopolymer Glue',
    categoryName: 'Chemicals',
    uomCode: 'kg',
    quantity: 50,
    status: 'Out for Production'
  },
  {
    id: 4,
    date: '2026-08-26',
    itemCode: 'SDT000005',
    itemName: 'Epoxy Resin',
    categoryName: 'Chemicals',
    uomCode: 'kg',
    quantity: 200,
    status: 'Out for Production'
  },
  {
    id: 5,
    date: '2026-08-27',
    itemCode: 'SDT000001',
    itemName: 'Cement',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    quantity: 300,
    status: 'Out for Production'
  },
  {
    id: 6,
    date: '2026-08-27',
    itemCode: 'SDT000014',
    itemName: 'Plasticizer',
    categoryName: 'Additives',
    uomCode: 'kg',
    quantity: 25,
    status: 'Returned from Production'
  },
  {
    id: 7,
    date: '2026-08-28',
    itemCode: 'SDT000007',
    itemName: 'Solvent',
    categoryName: 'Chemicals',
    uomCode: 'kg',
    quantity: 100,
    status: 'Additional Out for Production'
  },
  {
    id: 8,
    date: '2026-08-28',
    itemCode: 'SDT000006',
    itemName: 'Hardener',
    categoryName: 'Chemicals',
    uomCode: 'kg',
    quantity: 30,
    status: 'Returned from Production'
  },
  {
    id: 9,
    date: '2026-08-29',
    itemCode: 'SDT000003',
    itemName: 'Gravel',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    quantity: 2000,
    status: 'Out for Production'
  },
  {
    id: 10,
    date: '2026-08-29',
    itemCode: 'SDT000010',
    itemName: 'Fiberglass Roll',
    categoryName: 'Packaging',
    uomCode: 'm',
    quantity: 150,
    status: 'Out for Production'
  }
])

// ================================================================
// COMPUTED
// ================================================================

const hasActiveFilters = computed(() => {
  return filterCategory.value || filterUom.value || filterStatus.value || searchQuery.value
})

const filteredItems = computed(() => {
  let result = [...productionItems.value]

  if (filterCategory.value) {
    const category = categories.value.find(c => c.id === Number(filterCategory.value))
    result = result.filter(item => item.categoryName === category?.name)
  }

  if (filterUom.value) {
    result = result.filter(item => item.uomCode === filterUom.value)
  }

  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.itemCode.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search)
    )
  }

  return result
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredItems.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / pageSize.value) || 1
})

const stats = computed(() => {
  const total = productionItems.value.length
  const totalOutForProduction = productionItems.value.filter(item => 
    item.status === 'Out for Production' || item.status === 'Additional Out for Production'
  ).length
  const totalReturned = productionItems.value.filter(item => 
    item.status === 'Returned from Production'
  ).length

  return {
    totalRecords: total,
    totalOutForProduction: totalOutForProduction,
    totalReturned: totalReturned
  }
})

// ================================================================
// ISSUE MODAL COMPUTED
// ================================================================

const filteredIssueItems = computed(() => {
  let items = issueItems.value

  if (issueSearchQuery.value) {
    const search = issueSearchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.itemCode.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search)
    )
  }

  return items
})

const hasSelectedIssueItems = computed(() => {
  return issueItems.value.some(item => item.selected && item.issueQty > 0 && item.issueQty <= item.currentStock)
})

const selectedIssueCount = computed(() => {
  return issueItems.value.filter(item => item.selected && item.issueQty > 0 && item.issueQty <= item.currentStock).length
})

// ================================================================
// RETURN MODAL COMPUTED
// ================================================================

const filteredReturnItems = computed(() => {
  let items = returnItems.value

  if (returnSearchQuery.value) {
    const search = returnSearchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.itemCode.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search)
    )
  }

  return items
})

const hasSelectedReturnItems = computed(() => {
  return returnItems.value.some(item => item.selected && item.returnQty > 0)
})

const selectedReturnCount = computed(() => {
  return returnItems.value.filter(item => item.selected && item.returnQty > 0).length
})

// ================================================================
// CONFIRMATION COMPUTED
// ================================================================

const totalConfirmationQty = computed(() => {
  return selectedItemsForConfirmation.value.reduce((sum, item) => sum + item.qty, 0)
})

// ================================================================
// METHODS
// ================================================================

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat().format(num)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusClass = (item) => {
  if (item.status === 'Out for Production') return 'issued'
  if (item.status === 'Additional Out for Production') return 'additional'
  if (item.status === 'Returned from Production') return 'returned'
  return ''
}

const onSearchChange = () => {
  currentPage.value = 1
}

const onFilterChange = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  filterCategory.value = ''
  filterUom.value = ''
  filterStatus.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
}

const selectAllText = (event) => {
  event.target.select()
}

// ================================================================
// ISSUE MODAL
// ================================================================

const refreshIssueItems = () => {
  // Get all items from production history and calculate current balance
  const itemMap = new Map()
  productionItems.value.forEach(record => {
    const key = record.itemCode
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        itemCode: record.itemCode,
        itemName: record.itemName,
        categoryName: record.categoryName,
        uomCode: record.uomCode,
        currentStock: 0
      })
    }
    const item = itemMap.get(key)
    if (record.status.includes('Returned')) {
      item.currentStock += record.quantity
    } else {
      item.currentStock -= record.quantity
    }
  })

  // Only show items with balance > 0
  let items = Array.from(itemMap.values()).filter(item => item.currentStock > 0)

  if (issueFilterCategory.value) {
    const category = categories.value.find(c => c.id === Number(issueFilterCategory.value))
    items = items.filter(item => item.categoryName === category?.name)
  }

  issueItems.value = items.map(item => ({
    ...item,
    selected: false,
    issueQty: 1
  }))
}

const openIssueModal = () => {
  issueType.value = 'Out for Production'
  issueFilterCategory.value = ''
  issueSearchQuery.value = ''
  refreshIssueItems()
  showIssueModal.value = true
}

const closeIssueModal = () => {
  showIssueModal.value = false
  issueItems.value = []
}

const toggleIssueItemSelection = (item, event) => {
  const isChecked = event.target.checked
  item.selected = isChecked
  if (isChecked) {
    item.issueQty = 1
  } else {
    item.issueQty = 0
  }
  issueItems.value = [...issueItems.value]
}

const validateIssueQty = (item) => {
  if (item.issueQty > item.currentStock) {
    item.issueQty = item.currentStock
  }
  if (item.issueQty < 0) {
    item.issueQty = 0
  }
  issueItems.value = [...issueItems.value]
}

const processIssue = async () => {
  const selectedItems = issueItems.value.filter(item => item.selected && item.issueQty > 0 && item.issueQty <= item.currentStock)

  if (selectedItems.length === 0) {
    showToastMessage('No valid items selected', 'warning')
    return
  }

  confirmationType.value = issueType.value
  selectedItemsForConfirmation.value = selectedItems.map(item => ({
    ...item,
    qty: item.issueQty
  }))
  closeIssueModal()
  showConfirmationModal.value = true
}

// ================================================================
// RETURN MODAL
// ================================================================

const refreshReturnItems = () => {
  // Get all items from production history
  const itemMap = new Map()
  productionItems.value.forEach(record => {
    const key = record.itemCode
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        itemCode: record.itemCode,
        itemName: record.itemName,
        categoryName: record.categoryName,
        uomCode: record.uomCode,
        currentStock: 0
      })
    }
    const item = itemMap.get(key)
    if (record.status.includes('Returned')) {
      item.currentStock += record.quantity
    } else {
      item.currentStock -= record.quantity
    }
  })

  let items = Array.from(itemMap.values())

  if (returnFilterCategory.value) {
    const category = categories.value.find(c => c.id === Number(returnFilterCategory.value))
    items = items.filter(item => item.categoryName === category?.name)
  }

  returnItems.value = items.map(item => ({
    ...item,
    selected: false,
    returnQty: 1
  }))
}

const openReturnModal = () => {
  returnFilterCategory.value = ''
  returnSearchQuery.value = ''
  refreshReturnItems()
  showReturnModal.value = true
}

const closeReturnModal = () => {
  showReturnModal.value = false
  returnItems.value = []
}

const toggleReturnItemSelection = (item, event) => {
  const isChecked = event.target.checked
  item.selected = isChecked
  if (isChecked) {
    item.returnQty = 1
  } else {
    item.returnQty = 0
  }
  returnItems.value = [...returnItems.value]
}

const processReturn = async () => {
  const selectedItems = returnItems.value.filter(item => item.selected && item.returnQty > 0)

  if (selectedItems.length === 0) {
    showToastMessage('No items selected for return', 'warning')
    return
  }

  confirmationType.value = 'Returned from Production'
  selectedItemsForConfirmation.value = selectedItems.map(item => ({
    ...item,
    qty: item.returnQty
  }))
  closeReturnModal()
  showConfirmationModal.value = true
}

// ================================================================
// CONFIRMATION
// ================================================================

const closeConfirmationModal = () => {
  showConfirmationModal.value = false
  selectedItemsForConfirmation.value = []
}

const confirmAction = async () => {
  if (selectedItemsForConfirmation.value.length === 0) {
    showToastMessage('No items to process', 'warning')
    return
  }

  processing.value = true

  try {
    const today = new Date().toISOString().split('T')[0]
    let logs = []

    for (const item of selectedItemsForConfirmation.value) {
      const newRecord = {
        id: Date.now() + Math.random(),
        date: today,
        itemCode: item.itemCode,
        itemName: item.itemName,
        categoryName: item.categoryName,
        uomCode: item.uomCode,
        quantity: item.qty,
        status: confirmationType.value
      }
      productionItems.value.unshift(newRecord)
      logs.push(`${item.itemCode}: ${item.qty} ${item.uomCode} ${confirmationType.value}`)
    }

    closeConfirmationModal()
    showToastMessage(
      `✅ ${confirmationType.value} recorded successfully!\n${logs.join('\n')}`,
      'success'
    )

  } catch (error) {
    console.error('Error:', error)
    showToastMessage('Failed to process action', 'error')
  } finally {
    processing.value = false
  }
}

// ================================================================
// EXPORT
// ================================================================

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
    const data = productionItems.value.map(item => ({
      'Date': item.date,
      'Item Code': item.itemCode,
      'Item Name': item.itemName,
      'Category': item.categoryName,
      'UOM': item.uomCode,
      'Quantity': item.quantity,
      'Status': item.status
    }))

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `production_history_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    showToastMessage('✅ Export completed successfully!', 'success')
    closeExportModal()
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export data', 'error')
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
  }, 4000)
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})
</script>

<style scoped>
/* ================================================================ */
/* SECTION CARD */
/* ================================================================ */
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

.btn-issue {
  background: #ef4444;
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

.btn-issue:hover {
  background: #dc2626;
}

.btn-return {
  background: #22c55e;
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

.btn-return:hover {
  background: #16a34a;
}

.btn-export {
  background: #3b82f6;
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
  background: #2563eb;
}
.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #22c55e;
  color: white;
  border: none;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
}
.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================ */
/* FILTER BAR */
/* ================================================================ */
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

/* ================================================================ */
/* STATS */
/* ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-container {
  overflow-x: auto;
  min-height: 200px;
}

.production-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 700px;
}

.production-table th,
.production-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.production-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center {
  text-align: center;
}

.date-value {
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

.item-common-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.category-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.category-tag.has-category {
  background: #e0e7ff;
  color: #4338ca;
}

.uom-code {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.quantity-value {
  font-weight: 700;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 3px;
}

.quantity-value.issued {
  color: #dc2626;
}

.quantity-value.returned {
  color: #16a34a;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.issued {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.additional {
  background: #fef3c7;
  color: #d97706;
  border: 1px solid #d97706;
}

.status-badge.returned {
  background: #dbeafe;
  color: #1e40af;
}

/* ================================================================ */
/* LOADING */
/* ================================================================ */
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
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 40px !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.3;
}

.empty-content p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

/* ================================================================ */
/* PAGINATION */
/* ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 4px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
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
  padding: 3px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
}

/* ================================================================ */
/* MODALS */
/* ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.issue-modal .modal-container,
.return-modal .modal-container {
  max-width: 750px;
}

.confirmation-modal .modal-container {
  max-width: 500px;
}

.export-modal .modal-container {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
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
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 7px 15px;
  border-radius: 8px;
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 7px 15px;
  border-radius: 8px;
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

/* ================================================================ */
/* ISSUE TYPE */
/* ================================================================ */
.issue-type {
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}

.issue-type label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-right: 16px;
}

.type-options {
  display: inline-flex;
  gap: 16px;
}

.type-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  color: #1e293b;
}

.type-option input[type="radio"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

/* ================================================================ */
/* ISSUE MODAL */
/* ================================================================ */
.issue-info,
.return-info {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.issue-search,
.return-search {
  margin-bottom: 12px;
}

.search-box-small {
  position: relative;
}

.search-box-small input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box-small input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.issue-filters,
.return-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.issue-item-list,
.return-item-list {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.issue-item,
.return-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  gap: 6px;
}

.issue-item:last-child,
.return-item:last-child {
  border-bottom: none;
}

.issue-item-info,
.return-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.issue-item-info input[type="checkbox"],
.return-item-info input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.issue-item-code,
.return-item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  min-width: 90px;
}

.issue-item-name,
.return-item-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  min-width: 120px;
}

.issue-item-uom,
.return-item-uom {
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #475569;
}

.issue-item-balance {
  font-weight: 600;
  color: #166534;
}

.issue-item-input,
.return-item-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 28px;
  flex-wrap: wrap;
}

.issue-item-input label,
.return-item-input label {
  font-size: 12px;
  color: #64748b;
}

.issue-qty-input,
.return-qty-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
}

.issue-qty-input:focus,
.return-qty-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.issue-after {
  font-weight: 600;
  color: #3b82f6;
  font-size: 13px;
}

.issue-error {
  font-weight: 600;
  color: #dc2626;
  font-size: 12px;
}

.issue-max {
  font-size: 11px;
  color: #94a3b8;
}

.no-issue-items,
.no-return-items {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
}

/* ================================================================ */
/* CONFIRMATION MODAL */
/* ================================================================ */
.confirmation-modal .modal-container {
  max-width: 500px;
}

.confirmation-header {
  background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
  border-bottom: 2px solid #f59e0b !important;
  padding: 18px 20px !important;
}

.confirmation-header .header-icon-wrapper {
  width: 48px;
  height: 48px;
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirmation-header .header-icon {
  font-size: 24px;
}

.confirmation-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.confirmation-header .header-subtitle {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

.confirmation-header .modal-close {
  margin-left: auto;
}

.confirmation-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.summary-card .summary-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 2px;
}

.confirmation-list-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.confirmation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.confirmation-item:last-child {
  border-bottom: none;
}

.confirmation-item:hover {
  background: #f8fafc;
}

.conf-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conf-item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  font-family: monospace;
  min-width: 90px;
}

.conf-item-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.conf-item-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conf-item-source {
  font-weight: 600;
  color: #ef4444;
  font-size: 13px;
  background: #fef2f2;
  padding: 2px 10px;
  border-radius: 4px;
}

.confirmation-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fef3c7;
  border-radius: 8px;
  border: 1px solid #fcd34d;
  font-size: 13px;
  color: #92400e;
}

.confirmation-warning .warning-icon {
  font-size: 18px;
}

.confirmation-footer {
  background: #fafbfc !important;
  padding: 14px 20px !important;
}

.btn-cancel {
  padding: 8px 20px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-confirm {
  padding: 8px 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ================================================================ */
/* EXPORT MODAL */
/* ================================================================ */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 3px solid #10b981;
  max-width: 90vw;
  font-size: 13px;
  white-space: pre-line;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.info {
  border-left-color: #3b82f6;
}

.toast.warning {
  border-left-color: #f59e0b;
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

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 1024px) {
  .production-table {
    font-size: 12px;
    min-width: 700px;
  }
}

@media (max-width: 768px) {
  .section-card {
    padding: 12px;
  }

  .card-header {
    flex-wrap: wrap;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .search-box input {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-bar select {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .modal-container {
    margin: 10px;
    max-width: 100% !important;
  }

  .issue-item-info,
  .return-item-info {
    flex-wrap: wrap;
  }

  .issue-item-input,
  .return-item-input {
    padding-left: 0;
  }

  .confirmation-summary {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }

  .summary-card .summary-value {
    font-size: 18px;
  }

  .issue-type {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .production-table {
    font-size: 11px;
    min-width: 600px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .issue-filters,
  .return-filters {
    flex-direction: column;
  }

  .confirmation-summary {
    grid-template-columns: 1fr;
  }

  .conf-item-info {
    flex-wrap: wrap;
  }

  .conf-item-details {
    flex-wrap: wrap;
  }

  .confirmation-footer {
    flex-direction: column;
  }

  .confirmation-footer button {
    width: 100%;
    justify-content: center;
  }

  .type-options {
    flex-direction: column;
    gap: 6px;
  }
}

/* ================================================================ */
/* PRINT STYLES */
/* ================================================================ */
@media print {
  .btn-issue,
  .btn-return,
  .btn-export,
  .search-box,
  .filter-bar,
  .pagination {
    display: none !important;
  }

  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }

  .production-table th,
  .production-table td {
    border: 1px solid #ddd !important;
  }

  .stats-grid {
    display: none !important;
  }

  .loading-state {
    display: none !important;
  }
}
</style>