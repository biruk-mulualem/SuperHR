<!-- views/storemanagement/audit/convertedAudit.vue -->
<!-- CONVERTED BALANCE (KG) AUDIT - SAME STRUCTURE AS BASE AUDIT -->

<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📊 Converted Balance  Audit</h2>
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
        <router-link to="/audit" class="btn-link-audit">
          📦 Main balance Audit
        </router-link>
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
      <div class="summary-card critical">
        <span class="summary-label">🚨 Conflict</span>
        <span class="summary-value">{{ conflictCount }}</span>
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
        <option value="Conflict">🚨 Conflict</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="filterCategory || filterStatus">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== PRODUCT COMPARISON TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <!-- Loading State -->
      <div v-if="loading || refreshing" class="loading-state">
        <div class="spinner-large"></div>
        <p class="loading-text">{{ loading ? 'Loading converted audit data...' : 'Refreshing data...' }}</p>
        <p class="loading-subtext">Please wait while we fetch the data</p>
      </div>

      <!-- Initial Loading State -->
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

      <!-- No Data State -->
      <div v-else-if="storeStockData.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No Converted Balances Found</h3>
        <p v-if="selectedStore">
          No converted balances  are currently tracked in <strong>{{ selectedStore.name }}</strong>
        </p>
        <p v-else>Please select a store to view converted audit data</p>
        <div class="empty-actions">
          <p class="empty-hint">💡 Converted balances are created when:</p>
          <ul class="empty-list">
            <li>1. Items with conversion UOM  are created</li>
            <li>2. Stock transactions are processed with KG as the converted UOM</li>
          </ul>
        </div>
      </div>

      <!-- No Results State -->
      <div v-else-if="filteredAuditData.length === 0 && storeStockData.length > 0 && !loading" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No Results Found</h3>
        <p>No products match your current filters</p>
        <button class="btn-clear-filters" @click="clearFilters">Clear Filters</button>
      </div>

      <!-- ✅ TABLE - ONE COLUMN PER GROUP -->
      <table v-else-if="filteredAuditData.length > 0" class="audit-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item Code</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>UOM</th>
            <th v-for="group in activeGroups" :key="group.id">
              {{ group.name }}
            </th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedAuditData" :key="item.itemId" :class="getRowClass(item)">
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="code">{{ item.code || '-' }}</td>
            <td>
              <div class="product-info">
                <span class="common-name">{{ item.commonName || item.itemName || 'Unknown' }}</span>
                <span class="standard-name" v-if="item.standardName">{{ item.standardName }}</span>
              </div>
            </td>
            <td>{{ item.category || '-' }}</td>
            <td>{{ item.uom || item.uomCode || 'KG' }}</td>
            <td v-for="group in activeGroups" :key="'val-'+group.id" :class="getCellClass(item, group.id)">
              {{ getGroupValue(item, group.id) }}
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(item.status)]">
                {{ item.status || 'No Data' }}
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
          <h3>📋 Converted Balance Transaction History</h3>
          <button class="modal-close" @click="closeTransactionModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="transaction-product">
            <h4>{{ selectedItem?.commonName || selectedItem?.itemName || 'Unknown' }}</h4>
            <div class="product-meta">
              <span><strong>Code:</strong> {{ selectedItem?.code || '-' }}</span>
              <span><strong>Category:</strong> {{ selectedItem?.category || '-' }}</span>
              <span><strong>Store:</strong> {{ selectedStoreName }}</span>
              <span><strong>Status:</strong>
                <span :class="['status-badge', getStatusClass(selectedItem?.status)]">
                  {{ selectedItem?.status || 'No Data' }}
                </span>
              </span>
            </div>
          </div>

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

          <div class="transaction-list">
            <div v-if="loadingTransactions" class="loading-transactions">
              <div class="spinner-small"></div>
              <span>Loading transactions...</span>
            </div>
            <div v-else-if="getGroupTransactions(selectedGroupTab).length === 0" class="no-transactions">
              <div class="empty-icon-small">📭</div>
              <p>No converted balance transactions found for this group</p>
            </div>
            <div v-else class="transaction-items">
              <div
                v-for="(tx, idx) in getGroupTransactions(selectedGroupTab)"
                :key="idx"
                class="transaction-item"
                :class="tx.transactionType === 'Stock In' ? 'stock-in' : tx.transactionType === 'Stock Out' ? 'stock-out' : 'adjustment'"
              >
                <div class="tx-header">
                  <span class="tx-date">{{ formatDate(tx.createdAt || tx.date) }}</span>
                  <span :class="['tx-type-badge', tx.transactionType === 'Stock In' ? 'stock-in' : tx.transactionType === 'Stock Out' ? 'stock-out' : 'adjustment']">
                    {{ tx.transactionType || 'ADJUSTMENT' }}
                  </span>
                  <span class="tx-reference" v-if="tx.referenceId || tx.reference">Ref: {{ tx.referenceId || tx.reference }}</span>
                </div>
              <!-- Replace the tx-quantity div with this -->
<div class="tx-details">
  <span 
    class="tx-quantity" 
    :class="tx.transactionType === 'Stock In' ? 'positive' : tx.transactionType === 'Stock Out' ? 'negative' : 'adjustment'"
  >
    {{ tx.transactionType === 'Stock In' ? '+' : '' }}{{ tx.changeAmount || tx.quantity || 0 }}
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

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Converted Audit Report</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Report
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

const storeStockData = ref([])
const auditData = ref(null)
const categoriesList = ref([])
const storeBalanceCounts = ref({})

// Modal
const showTransactionModal = ref(false)
const selectedItem = ref(null)
const selectedGroupTab = ref('')
const showExportModal = ref(false)
const exportType = ref('full')
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

const conflictCount = computed(() => {
  return filteredAuditData.value.filter(item => item.status === 'Conflict').length
})

// ================================================================
// METHODS
// ================================================================

const getStatusClass = (status) => {
  if (!status) return 'unknown'
  const map = {
    'Matched': 'matched',
    'Conflict': 'conflict',
    'No Data': 'unknown'
  }
  return map[status] || 'unknown'
}

const getGroupValue = (item, groupId) => {
  if (!item || !item.groupBalances) return '-'
  const value = item.groupBalances[groupId]
  return value !== undefined && value !== null ? value : '-'
}

const getRowClass = (item) => {
  if (!item) return ''
  if (item.status === 'Conflict') return 'conflict-row'
  if (item.status === 'Matched') return 'matched-row'
  return ''
}

const getCellClass = (item, groupId) => {
  if (!item || !item.groupBalances) return 'normal-cell'
  
  const values = Object.values(item.groupBalances || {}).filter(v => v !== undefined && v !== null)

  if (values.length === 0) return 'normal-cell'

  const uniqueValues = [...new Set(values)]

  if (uniqueValues.length === 1) {
    return 'normal-cell'
  } else {
    return 'conflict-cell'
  }
}

// ================================================================
// ✅ TRANSFORM CONVERTED AUDIT DATA
// ================================================================
const transformAuditData = (data) => {
  if (!data) return []

  if (data.comparison && data.comparison.items) {
    return data.comparison.items.map(item => {
      const groupBalances = item.groupBalances || {}
      const groupLastTxDates = item.groupLastTxDates || {}

      const values = Object.values(groupBalances).filter(v => v !== undefined && v !== null)
      const missingCount = activeGroups.value.length - values.length

      let status = 'No Data'
      let statusClass = 'unknown'

      if (values.length === 0) {
        status = 'No Data'
        statusClass = 'unknown'
      } else if (missingCount > 0) {
        status = 'Conflict'
        statusClass = 'conflict'
      } else {
        const uniqueValues = [...new Set(values)]
        if (uniqueValues.length === 1) {
          status = 'Matched'
          statusClass = 'matched'
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
        uom: item.uomCode || item.uom || 'KG',
        uomCode: item.uomCode || item.uom || 'KG',
        groupBalances: groupBalances,
        groupLastTxDates: groupLastTxDates,
        status: status,
        statusClass: statusClass
      }
    })
  }

  // Fallback: Build from groups data
  if (!data.groups) return []

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
          uom: balance.uomCode || 'KG',
          uomCode: balance.uomCode || 'KG',
          groupBalances: {},
          groupLastTxDates: {},
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
      }
    })
  })

  itemMap.forEach((item) => {
    const values = Object.values(item.groupBalances).filter(v => v !== undefined && v !== null)
    const missingCount = totalGroups - values.length

    if (values.length === 0) {
      item.status = 'No Data'
      item.statusClass = 'unknown'
    } else if (missingCount > 0) {
      item.status = 'Conflict'
      item.statusClass = 'conflict'
    } else {
      const uniqueValues = [...new Set(values)]
      if (uniqueValues.length === 1) {
        item.status = 'Matched'
        item.statusClass = 'matched'
      } else {
        item.status = 'Conflict'
        item.statusClass = 'conflict'
      }
    }
  })

  return Array.from(itemMap.values())
}

// -- Load Categories --
const loadCategories = async () => {
  try {
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
    const result = await auditService.getStoresWithGroups()

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
  if (!stores.value || stores.value.length === 0) {
    console.warn('No stores available to auto-select');
    return;
  }

  const storesToCheck = stores.value.filter(store => store.id);

  if (storesToCheck.length === 0) {
    console.warn('No valid stores to check');
    return;
  }

  for (const store of storesToCheck) {
    try {
      const result = await auditService.getConvertedAudit(store.id, {
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

// -- Load Store Data (Converted) --
const loadStoreData = async (storeId) => {
  if (!storeId) {
    storeStockData.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await auditService.getConvertedAudit(storeId, {
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
        // No products found
      } else {
        showToastMessage(`Loaded ${transformedData.length} converted products`, 'success')
      }
    } else {
      console.error('Failed to load converted audit data:', result)
      error.value = result.error || 'Failed to load converted audit data'
      showToastMessage('Failed to load converted audit data', 'error')
    }
  } catch (err) {
    console.error('❌ Error loading converted store audit:', err)
    error.value = err.message || 'Failed to load converted audit data'
    showToastMessage('Failed to load converted audit data', 'error')
  } finally {
    loading.value = false
  }
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

// -- Transaction Modal --
const openTransactionModal = async (item) => {
  if (!item || !item.itemId) {
    showToastMessage('No item ID found for this product', 'error')
    return
  }

  selectedItem.value = item
  const groups = activeGroups.value
  selectedGroupTab.value = groups.length > 0 ? groups[0].id : ''
  groupTransactions.value = {}

  loadingTransactions.value = true

  try {
    const result = await auditService.getConvertedItemTransactions(
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
        showToastMessage('No converted transactions found for this item', 'info')
      }
    } else {
      for (const group of groups) {
        try {
          const groupResult = await auditService.getConvertedGroupTransactions(
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
          console.warn(`Failed to load converted transactions for group ${group.id}:`, err)
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to load converted transactions:', error)
    showToastMessage('Failed to load converted transactions', 'error')
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
    const blob = await auditService.exportConvertedAudit(selectedStoreId.value, {
      includeTransactions: exportType.value === 'full' || exportType.value === 'summary',
      filterBy: exportType.value
    })

    const filename = `converted_audit_${selectedStoreName.value || 'store'}_${new Date().toISOString().split('T')[0]}.xlsx`
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

.btn-refresh,
.btn-export,
.btn-link-audit {
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
  text-decoration: none;
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

.btn-link-audit {
  background: #1a237e;
  color: white;
}

.btn-link-audit:hover {
  background: #0d1445;
}

.btn-refresh:disabled,
.btn-export:disabled {
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

.summary-card .store-name {
  font-size: 14px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-card.success .summary-value {
  color: #10b981;
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
  min-width: 650px;
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

.conflict-row {
  background: #fef2f2;
}

.conflict-row:hover {
  background: #fee2e2;
}

.matched-row {
  background: #f0fdf4;
}

.matched-row:hover {
  background: #dcfce7;
}

.conflict-cell {
  background: #fef2f2 !important;
  font-weight: 700;
  color: #dc2626;
}

.normal-cell {
  background: white;
}

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

.status-badge.conflict {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.unknown {
  background: #f1f5f9;
  color: #64748b;
}

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
}

.modal-close:hover {
  background: #f1f5f9;
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

.transaction-item.stock-in {
  border-left: 3px solid #10b981;
}

.transaction-item.stock-out {
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

.tx-type-badge.stock-in {
  background: #dcfce7;
  color: #166534;
}

.tx-type-badge.stock-out {
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
    min-width: 600px;
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