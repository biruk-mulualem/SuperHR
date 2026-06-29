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
        <button class="btn-export" @click="openExportModal" :disabled="exporting">
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
        <span class="summary-value">{{ selectedStoreName }}</span>
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
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="selectedStoreId" class="filter-select" @change="onStoreChange">
        <option v-for="store in stores" :key="store.id" :value="store.id">
          {{ store.name }}
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
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="filterCategory || filterStatus">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== PRODUCT COMPARISON TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <table class="audit-table">
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
          <template v-for="(item, index) in paginatedAuditData" :key="item.productId">
            <tr :class="getRowClass(item)">
              <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="code">{{ item.code }}</td>
              <td>
                <div class="product-info">
                  <span class="common-name">{{ item.commonName }}</span>
                  <span class="standard-name">{{ item.standardName }}</span>
                </div>
              </td>
              <td>{{ item.category || '-' }}</td>
              <td>{{ item.uom }}</td>
              
              <!-- Group Balances -->
              <td v-for="group in activeGroups" :key="group.id" 
                  :class="getCellClass(item, group.id)">
                {{ getGroupValue(item, group.id) }}
              </td>
              
              <td>
                <span :class="['status-badge', item.status.toLowerCase()]">
                  {{ item.status }}
                </span>
              </td>
              <td>
                <button 
                  @click="openTransactionModal(item)" 
                  class="btn-transaction"
                  title="View Transactions"
                >
                  📋
                </button>
              </td>
            </tr>
          </template>
          
          <tr v-if="paginatedAuditData.length === 0" class="empty-row">
            <td :colspan="5 + activeGroups.length + 2" class="empty-cell">
              <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No products found</h3>
                <p>No products are currently tracked in this store</p>
              </div>
            </td>
          </tr>
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
            <h4>{{ selectedItem?.commonName }}</h4>
            <div class="product-meta">
              <span><strong>Code:</strong> {{ selectedItem?.code }}</span>
              <span><strong>Category:</strong> {{ selectedItem?.category }}</span>
              <span><strong>Store:</strong> {{ selectedStoreName }}</span>
              <span><strong>Status:</strong> 
                <span :class="['status-badge', selectedItem?.status?.toLowerCase()]">
                  {{ selectedItem?.status }}
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
                :class="tx.type.toLowerCase()"
              >
                <div class="tx-header">
                  <span class="tx-date">{{ formatDate(tx.date) }}</span>
                  <span :class="['tx-type-badge', tx.type.toLowerCase()]">
                    {{ tx.type }}
                  </span>
                  <span class="tx-reference" v-if="tx.reference">Ref: {{ tx.reference }}</span>
                </div>
                <div class="tx-details">
                  <span class="tx-quantity" :class="tx.quantity > 0 ? 'positive' : 'negative'">
                    {{ tx.quantity > 0 ? '+' : '' }}{{ tx.quantity }}
                  </span>
                  <span class="tx-balance">Balance: {{ tx.balanceAfter }}</span>
                  <span class="tx-user" v-if="tx.user">👤 {{ tx.user }}</span>
                </div>
                <div class="tx-notes" v-if="tx.notes">💬 {{ tx.notes }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeTransactionModal">Close</button>
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
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary Report
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

// Stock data for selected store
const storeStockData = ref([])

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
// COMPUTED
// ================================================================
const selectedStore = computed(() => {
  return stores.value.find(s => s.id === selectedStoreId.value)
})

const selectedStoreName = computed(() => {
  return selectedStore.value?.name || ''
})

const activeGroups = computed(() => {
  return selectedStore.value?.groups || []
})

const categories = computed(() => {
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
      item.code.toLowerCase().includes(s) ||
      item.commonName.toLowerCase().includes(s) ||
      item.standardName?.toLowerCase().includes(s)
    )
  }
  
  if (filterCategory.value) {
    result = result.filter(item => item.category === filterCategory.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
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

// ================================================================
// METHODS
// ================================================================

// -- Load Data --
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    stores.value = getMockStores()
    // Set first store as default
    if (stores.value.length > 0) {
      selectedStoreId.value = stores.value[0].id
      storeStockData.value = getMockStoreStockData(selectedStoreId.value)
    }
    loading.value = false
  }, 300)
}

const getMockStores = () => {
  return [
    { 
      id: 'store-1', 
      name: 'Fiber Main Store', 
      groups: [
        { id: 'g1', name: 'Storekeeper' },
        { id: 'g2', name: 'IT' },
        { id: 'g3', name: 'Auditor' },
        { id: 'g4', name: 'Supplier' }
      ] 
    },
    { 
      id: 'store-2', 
      name: 'Paint Main Store', 
      groups: [
        { id: 'g5', name: 'Storekeeper' },
        { id: 'g6', name: 'IT' },
        { id: 'g7', name: 'Auditor' }
      ] 
    },
    { 
      id: 'store-3', 
      name: 'Fiber Mini Store', 
      groups: [
        { id: 'g8', name: 'Storekeeper' },
        { id: 'g9', name: 'IT' },
        { id: 'g10', name: 'Auditor' }
      ] 
    }
  ]
}

const getMockStoreStockData = (storeId) => {
  const allProducts = [
    { 
      productId: 'p1', 
      code: 'SDT000001', 
      commonName: 'Fiberglass Resin', 
      standardName: 'Fiberglass Reinforced Polyester Resin',
      category: 'Fiber Raw Material', 
      uom: 'KG' 
    },
    { 
      productId: 'p2', 
      code: 'SDT000002', 
      commonName: 'Titanium Dioxide Pigment', 
      standardName: 'Titanium Dioxide White Pigment',
      category: 'Paint Raw Material', 
      uom: 'KG' 
    },
    { 
      productId: 'p3', 
      code: 'SDT000003', 
      commonName: 'Steel Sheets', 
      standardName: 'Industrial Steel Sheets 2mm',
      category: 'Metals', 
      uom: 'Each' 
    },
    { 
      productId: 'p4', 
      code: 'SDT000004', 
      commonName: 'Industrial Solvent', 
      standardName: 'Industrial Solvent 99% Purity',
      category: 'Chemicals', 
      uom: 'L' 
    },
    { 
      productId: 'p5', 
      code: 'SDT000005', 
      commonName: 'Epoxy Hardener', 
      standardName: 'Epoxy Resin Hardener Type II',
      category: 'Hardeners', 
      uom: 'KG' 
    }
  ]

  const store = stores.value.find(s => s.id === storeId)
  if (!store) return []

  return allProducts.map((product, productIndex) => {
    const groupBalances = {}
    const values = []
    
    store.groups.forEach((group, index) => {
      let baseValue = 100 - (index * 3) + Math.floor(Math.random() * 6)
      
      // Create different scenarios for demo
      // Matched: Product 2 (p2) - all groups have the same value
      if (product.productId === 'p2') {
        baseValue = 150 // All groups match
      }
      // Outlier: Product 1 (p1) - Auditor is different
      else if (product.productId === 'p1' && group.id === 'g3') {
        baseValue = 145 // Auditor is different (Outlier)
      } 
      // Outlier: Product 4 (p4) - Supplier is different
      else if (product.productId === 'p4' && group.id === 'g4') {
        baseValue = 155 // Supplier is different (Outlier)
      }
      // Outlier: Product 3 (p3) - Storekeeper is different
      else if (product.productId === 'p3' && group.id === 'g1') {
        baseValue = 120 // Storekeeper is different
      }
      // Conflict: Product 5 (p5) - All three different (only for stores with 3+ groups)
      else if (product.productId === 'p5' && store.groups.length >= 3) {
        if (group.id === 'g8') baseValue = 20
        else if (group.id === 'g9') baseValue = 25
        else if (group.id === 'g10') baseValue = 30
        else baseValue = 22 // for other groups
      }
      // Outlier: Product 1 in store-2
      else if (storeId === 'store-2' && product.productId === 'p1' && group.id === 'g6') {
        baseValue = 95 // IT is different
      }
      else {
        baseValue = Math.max(0, Math.round(100 + (index * 2) + Math.floor(Math.random() * 5)))
      }
      
      groupBalances[group.id] = baseValue
      values.push(baseValue)
    })
    
    // Determine status
    const uniqueValues = [...new Set(values)]
    let status
    
    if (uniqueValues.length === 1) {
      status = 'Matched'
    } else if (uniqueValues.length === 2) {
      status = 'Outlier'
    } else {
      status = 'Conflict'
    }
    
    return {
      ...product,
      groupBalances,
      status
    }
  })
}

// -- Get Mock Transactions --
const getMockTransactions = (productId, groupId) => {
  const types = ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']
  const users = ['Biruk Mulualem', 'Dagmawi Hadgu', 'Melkamu Zewdu', 'Melaku Tewodros', 'Tamrat Zerihun']
  const notes = ['Regular stock in', 'Customer order', 'Inventory adjustment', 'Damaged goods return', 'Supplier delivery']
  const references = ['PO-2024-001', 'SO-2024-001', 'ADJ-2024-001', 'RET-2024-001']
  
  const transactions = []
  let runningBalance = 100 + Math.floor(Math.random() * 50)
  
  // Ensure at least one transaction of each type
  const forcedTypes = ['STOCK_IN', 'STOCK_OUT', 'STOCK_IN']
  forcedTypes.forEach((type, i) => {
    const qty = type === 'STOCK_IN' ? Math.floor(Math.random() * 20) + 5 : -(Math.floor(Math.random() * 15) + 3)
    runningBalance += qty
    transactions.push({
      date: new Date(Date.now() - (i * 86400000 * 5)).toISOString(),
      type: type,
      quantity: qty,
      balanceAfter: runningBalance,
      user: users[i % users.length],
      reference: references[i % references.length] + '-' + String(i + 1).padStart(3, '0'),
      notes: notes[i % notes.length]
    })
  })
  
  // Add random transactions
  for (let i = 0; i < 7; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const qty = type === 'STOCK_IN' ? Math.floor(Math.random() * 20) + 5 : -(Math.floor(Math.random() * 15) + 3)
    runningBalance += qty
    
    transactions.push({
      date: new Date(Date.now() - ((i + 3) * 86400000 * 2)).toISOString(),
      type: type,
      quantity: qty,
      balanceAfter: runningBalance,
      user: users[Math.floor(Math.random() * users.length)],
      reference: references[Math.floor(Math.random() * references.length)] + '-' + String(i + 4).padStart(3, '0'),
      notes: notes[Math.floor(Math.random() * notes.length)]
    })
  }
  
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// -- Store Change --
const onStoreChange = () => {
  if (selectedStoreId.value) {
    storeStockData.value = getMockStoreStockData(selectedStoreId.value)
    currentPage.value = 1
    filterCategory.value = ''
    filterStatus.value = ''
    searchQuery.value = ''
  } else {
    storeStockData.value = []
  }
}

// -- Get Group Value --
const getGroupValue = (item, groupId) => {
  return item.groupBalances?.[groupId] ?? '-'
}

// -- Row Class --
const getRowClass = (item) => {
  if (item.status === 'Conflict') return 'conflict-row'
  if (item.status === 'Outlier') return 'outlier-row'
  return 'matched-row'
}

// -- Cell Class --
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

// -- Is Mismatch Value (Outlier) --
const isMismatchValue = (item, groupId) => {
  const value = getGroupValue(item, groupId)
  const values = Object.values(item.groupBalances || {})
  if (values.length === 0) return false
  
  const uniqueValues = [...new Set(values)]
  if (uniqueValues.length !== 2) return false
  
  const majorityValue = values.find(v => values.filter(x => x === v).length > 1)
  return value !== majorityValue
}

// -- Is Majority Value --
const isMajorityValue = (item, groupId) => {
  const value = getGroupValue(item, groupId)
  const values = Object.values(item.groupBalances || {})
  if (values.length === 0) return false
  
  const uniqueValues = [...new Set(values)]
  if (uniqueValues.length !== 2) return false
  
  const majorityValue = values.find(v => values.filter(x => x === v).length > 1)
  return value === majorityValue
}

// -- Get Mismatch Groups --
const getMismatchGroups = (item) => {
  if (!item) return []
  const mismatches = []
  const groups = selectedStore.value?.groups || []
  groups.forEach(group => {
    if (isMismatchValue(item, group.id)) {
      mismatches.push(group)
    }
  })
  return mismatches
}

// -- Get Majority Groups --
const getMajorityGroups = (item) => {
  if (!item) return []
  const majority = []
  const groups = selectedStore.value?.groups || []
  groups.forEach(group => {
    if (isMajorityValue(item, group.id)) {
      majority.push(group)
    }
  })
  return majority
}

// -- Transaction Modal --
const openTransactionModal = (item) => {
  selectedItem.value = item
  selectedGroupTab.value = activeGroups.value[0]?.id || ''
  groupTransactions.value = {}
  
  // Load transactions for all groups
  loadingTransactions.value = true
  setTimeout(() => {
    activeGroups.value.forEach(group => {
      groupTransactions.value[group.id] = getMockTransactions(item.productId, group.id)
    })
    loadingTransactions.value = false
  }, 500)
  
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
  const d = new Date(dateStr)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
const refreshData = () => {
  refreshing.value = true
  setTimeout(() => {
    if (selectedStoreId.value) {
      storeStockData.value = getMockStoreStockData(selectedStoreId.value)
    }
    refreshing.value = false
    showToastMessage('Data refreshed successfully!', 'success')
  }, 1000)
}

// -- Export --
const openExportModal = () => {
  exportType.value = 'full'
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const exportSelectedReport = () => {
  exporting.value = true
  setTimeout(() => {
    let headers = [], rows = []
    const data = filteredAuditData.value
    
    if (exportType.value === 'full') {
      headers = ['Code', 'Product Name', 'Category', 'UOM', ...activeGroups.value.map(g => g.name), 'Status']
      rows = data.map(item => [
        item.code,
        item.commonName,
        item.category || '',
        item.uom,
        ...activeGroups.value.map(g => item.groupBalances?.[g.id] || '-'),
        item.status
      ])
    } else if (exportType.value === 'outlier') {
      headers = ['Code', 'Product Name', 'Category', 'UOM', 'Outlier Group', 'Majority Groups']
      rows = data.filter(item => item.status === 'Outlier').map(item => [
        item.code,
        item.commonName,
        item.category || '',
        item.uom,
        getMismatchGroups(item).map(g => g.name).join(', '),
        getMajorityGroups(item).map(g => g.name).join(', ')
      ])
    } else if (exportType.value === 'conflict') {
      headers = ['Code', 'Product Name', 'Category', 'UOM', 'Groups', 'Values']
      rows = data.filter(item => item.status === 'Conflict').map(item => [
        item.code,
        item.commonName,
        item.category || '',
        item.uom,
        activeGroups.value.map(g => g.name).join(', '),
        activeGroups.value.map(g => item.groupBalances?.[g.id] || '-').join(', ')
      ])
    } else {
      headers = ['Code', 'Product Name', 'Category', 'Status']
      rows = data.map(item => [
        item.code,
        item.commonName,
        item.category || '',
        item.status
      ])
    }
    
    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_report_${selectedStoreName.value}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    exporting.value = false
    closeExportModal()
    showToastMessage('Export completed successfully!', 'success')
  }, 500)
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
  loadData()
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

.empty-row td {
  padding: 40px 20px;
}

.empty-cell {
  text-align: center;
}

.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state h3 {
  color: #1e293b;
  margin-bottom: 4px;
}

.empty-state p {
  color: #94a3b8;
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

.btn-transaction:hover {
  background: #c7d2fe;
  transform: scale(1.05);
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

@keyframes spin {
  to { transform: rotate(360deg); }
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