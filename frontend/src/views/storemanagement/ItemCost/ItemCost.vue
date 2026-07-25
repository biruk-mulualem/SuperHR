<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>💰 Inventory Cost Calculation</h2>
        <span class="total-badge">{{ totalItems }} Items</span>
        <span v-if="searchQuery" class="search-badge">
          🔍 "{{ searchQuery }}"
        </span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by code, name, brand..."
            @input="onSearchChange"
            @keyup.esc="clearSearch"
          />
          <span 
            v-if="searchQuery" 
            class="search-clear" 
            @click="clearSearch"
            title="Clear search"
          >
            ✕
          </span>
        </div>
        <button class="btn-export" @click="exportReport" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export Report" }}
        </button>
        <button class="btn-print" @click="printReport">🖨️ Print</button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Store</label>
        <select v-model="selectedStoreId" class="filter-select" @change="onFilterChange">
          <option value="">All Stores</option>
          <option v-for="store in allStores" :key="store.id" :value="store.id">
            {{ store.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
          <option value="">All Status</option>
          <option value="Active">🟢 Active</option>
          <option value="Partial">🟡 Partial</option>
          <option value="Incomplete">🔴 Incomplete</option>
          <option value="Inactive">⛔ Inactive</option>
        </select>
      </div>
      
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
      
      <span v-if="searchQuery" class="search-results-badge">
        Showing {{ totalItems }} result(s) for "{{ searchQuery }}"
      </span>
    </div>

    <!-- ==================== COST TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading cost data...</p>
      </div>

      <table v-else class="cost-table">
        <thead>
          <tr>
            <th style="width:35px"></th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Base UOM</th>
            <th>Total Qty</th>
            <th>Unit Cost</th>
            <th>Total Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">💰</span>
                <p v-if="searchQuery">No items found matching "{{ searchQuery }}"</p>
                <p v-else>No cost data found</p>
                <p class="empty-sub" v-if="selectedStoreId">Try selecting a different store or clear the filter</p>
                <p class="empty-sub" v-if="searchQuery && !selectedStoreId">Try adjusting your search terms</p>
              </div>
            </td>
          </tr>
          <template v-for="item in items" :key="item.id">
            <tr
              :class="{
                'expanded-row': expandedRow === item.id,
                'status-row-active': item.status === 'Active' || item.status === 'Completed',
                'status-row-partial': item.status === 'Partial',
                'status-row-incomplete': item.status === 'Incomplete',
                'status-row-inactive': item.status === 'Inactive' || item.isExcluded
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(item.id)">
                  {{ expandedRow === item.id ? "▼" : "▶" }}
                </button>
              </td>
              <td class="item-code">{{ item.itemCode }}</td>
              <td>
                <div class="item-info">
                  <span class="item-name">{{ item.itemName }}</span>
                  <span class="item-standard">{{ item.itemStandardName }}</span>
                </div>
              </td>
              <td class="uom-code">{{ item.baseUOM }}</td>
              <td class="balance-cell">
                <span class="balance-value">{{ formatNumber(item.totalQty) }}</span>
              </td>
            <td class="cost-cell">
  <div class="cost-details">
    <span class="unit-cost">ETB {{ formatCurrency(item.unitCost) }}</span>
    
  
  </div>
</td>
              <td class="total-cell">
                <span class="total-value" :class="{
                  'active-value': item.status === 'Active' || item.status === 'Completed',
                  'partial-value': item.status === 'Partial',
                  'incomplete-value': item.status === 'Incomplete',
                  'inactive-value': item.status === 'Inactive' || item.isExcluded
                }">
                  ETB {{ formatCurrency(item.totalCost) }}
                </span>
              </td>
              <td>
                <span 
                  :class="['status-badge', 
                    item.status === 'Active' || item.status === 'Completed' ? 'status-active' : 
                    item.status === 'Partial' ? 'status-partial' : 
                    item.status === 'Incomplete' ? 'status-incomplete' : 
                    'status-inactive'
                  ]"
                  @click="toggleItemStatus(item)"
                  style="cursor: pointer;"
                  :title="item.isExcluded ? 'Click to include in cost calculations' : 'Click to exclude from cost calculations'"
                >
                  {{ item.status }}
                  <span v-if="item.isExcluded" class="exclusion-icon">⛔</span>
                </span>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr v-if="expandedRow === item.id" class="detail-expand-row">
              <td colspan="8">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Top Section: Item Details & Cost Summary -->
                    <div class="detail-top-section">
                      <div class="detail-card item-detail-card">
                        <h4>📋 Item Details</h4>
                        <div class="detail-vertical">
                          <div><span>Item Code</span><span class="value">{{ item.itemCode }}</span></div>
                          <div><span>Item Name</span><span class="value">{{ item.itemName }}</span></div>
                          <div><span>Standard Name</span><span class="value">{{ item.itemStandardName || '-' }}</span></div>
                          <div><span>Category</span><span class="value">{{ item.categoryName || '-' }}</span></div>
                          <div><span>Brand</span><span class="value">{{ item.brand || '-' }}</span></div>
                          <div><span>Model</span><span class="value">{{ item.model || '-' }}</span></div>
                          <div><span>Base UOM</span><span class="value"><strong>{{ item.baseUOM }}</strong></span></div>
                          <div>
                            <span>Cost Status</span>
                            <span 
                              :class="['status-badge', 
                                item.status === 'Active' || item.status === 'Completed' ? 'status-active' : 
                                item.status === 'Partial' ? 'status-partial' : 
                                item.status === 'Incomplete' ? 'status-incomplete' : 
                                'status-inactive'
                              ]"
                              @click="toggleItemStatus(item)"
                              style="cursor: pointer;"
                            >
                              {{ item.status }}
                            </span>
                          </div>
                          <div v-if="item.isExcluded && item.exclusionReason">
                            <span>Exclusion Reason</span>
                            <span class="value inactive-text">{{ item.exclusionReason }}</span>
                          </div>
                          <div v-if="item.statusMessage">
                            <span>Message</span>
                            <span class="value">{{ item.statusMessage }}</span>
                          </div>
                          <div v-if="item.hasMissingData && item.missingData && item.missingData.length > 0">
                            <span>Missing Data</span>
                            <span class="value missing-data">{{ item.missingData.join(', ') }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-card cost-summary-card" :class="{
                        'card-active': item.status === 'Active' || item.status === 'Completed',
                        'card-partial': item.status === 'Partial',
                        'card-incomplete': item.status === 'Incomplete',
                        'card-inactive': item.status === 'Inactive' || item.isExcluded
                      }">
                        <h4>💰 Cost Summary</h4>
                        <div class="detail-vertical">
                          <div><span>Unit Cost</span><span class="value">ETB {{ formatCurrency(item.unitCost) }} / {{ item.conversionUOM }}</span></div>
                          <div><span>Total Quantity</span><span class="value">{{ formatNumber(item.totalQty) }} {{ item.conversionUOM }}</span></div>
                          <div><span>Total Cost</span><span class="value highlight-total">ETB {{ formatCurrency(item.totalCost) }}</span></div>
                          <div v-if="item.isExcluded">
                            <span>Cost Status</span>
                            <span class="value inactive-text">⛔ Excluded from cost calculations</span>
                          </div>
                          <div v-if="item.status === 'Partial'">
                            <span>Status</span>
                            <span class="value partial-text">⚠️ Partial - Some stores excluded</span>
                          </div>
                          <div v-if="item.status === 'Incomplete'">
                            <span>Status</span>
                            <span class="value incomplete-text">❌ Incomplete - Missing required data</span>
                          </div>
                          <div v-if="item.status === 'Active' || item.status === 'Completed'">
                            <span>Status</span>
                            <span class="value active-text">✅ Complete - All data available</span>
                          </div>
                          <div v-if="item.status === 'Partial' && item.excludedStores.length > 0">
                            <span>Excluded Stores</span>
                            <span class="value partial-text">{{ item.excludedStores.join(', ') }}</span>
                          </div>
                          <div v-if="selectedStoreId">
                            <span>Filtered Store</span>
                            <span class="value highlight-total">{{ getStoreName(Number(selectedStoreId)) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Store & Group Breakdown -->
                    <div class="detail-card full-width breakdown-card">
                      <h4>📊 Store & Group Quantity Breakdown</h4>
                      
                      <div class="breakdown-container">
                        <div 
                          v-for="store in item.storeBreakdown" 
                          :key="store.storeId" 
                          class="store-breakdown-card"
                          :class="{ 
                            'store-conflict': store.hasConflict,
                            'store-excluded': store.isExcluded,
                            'store-hidden': !isStoreVisible(store.storeId)
                          }"
                          v-show="isStoreVisible(store.storeId)"
                        >
                          <div class="store-header">
                            <div class="store-info">
                              <span class="store-icon">🏪</span>
                              <span class="store-name">{{ store.storeName }}</span>
                              <span v-if="store.isExcluded" class="excluded-badge">⛔ Excluded</span>
                              <span v-if="selectedStoreId && store.storeId === Number(selectedStoreId)" class="active-filter-badge">🎯 Filtered</span>
                            </div>
                            <div class="store-status">
                              <span 
                                class="store-status-badge" 
                                :class="store.hasConflict ? 'conflict' : 'active'"
                              >
                                {{ store.hasConflict ? '⚠️ Conflict' : '✅ Included' }}
                              </span>
                              <span class="store-total-qty">
                                Qty: {{ formatNumber(store.agreedQuantity) }} {{ item.conversionUOM }}
                                <span v-if="store.hasConflict" class="conflict-note-small">(Groups disagree - excluded)</span>
                              </span>
                            </div>
                          </div>

                          <div class="groups-list">
                            <div 
                              v-for="group in store.groups" 
                              :key="group.groupId" 
                              class="group-row"
                              :class="{ 'group-conflict': store.hasConflict }"
                            >
                              <div class="group-info">
                                <span class="group-dot" :class="{ 'conflict-dot': store.hasConflict }"></span>
                                <span class="group-name">{{ group.groupName }}</span>
                              </div>
                              <div class="group-quantity">
                                <span class="qty-value">{{ formatNumber(group.quantity) }}</span>
                                <span class="qty-uom">{{ item.conversionUOM }}</span>
                                <span 
                                  v-if="group.conversionRate && group.conversionRate > 1" 
                                  class="conversion-badge"
                                >
                                  {{ group.originalUOM }} → {{ item.conversionUOM }}
                                  <span class="conversion-rate">(×{{ group.conversionRate }})</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div v-if="store.hasConflict" class="conflict-warning-bar">
                            <span class="warning-icon">⛔</span>
                            <span class="warning-text">
                              Groups disagree on quantity — this store is <strong>EXCLUDED</strong> from total cost
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- Total Summary -->
                      <div class="total-summary-bar" :class="{
                        'summary-active': item.status === 'Active' || item.status === 'Completed',
                        'summary-partial': item.status === 'Partial',
                        'summary-incomplete': item.status === 'Incomplete',
                        'summary-inactive': item.status === 'Inactive' || item.isExcluded
                      }">
                        <div class="total-summary-item">
                          <span class="total-label">Total Quantity (Included Stores)</span>
                       <span class="total-value-highlight">
  {{ formatNumber(item.totalQty) }} {{ item.conversionUOM }}
  <span class="total-value-sub">
    ({{ formatNumber(item.totalQty / item.conversionValue) }} {{ item.baseUOM }})
  </span>
</span> </div>
                        <div class="total-summary-item">
                          <span class="total-label">Total Cost</span>
                          <span class="total-value-highlight">ETB {{ formatCurrency(item.totalCost) }}</span>
                        </div>
                        <div v-if="item.isExcluded" class="total-summary-sub inactive-sub">
                          <span class="sub-label inactive-label">⛔ Item is excluded from cost calculations</span>
                          <span class="sub-detail" v-if="item.exclusionReason">Reason: {{ item.exclusionReason }}</span>
                        </div>
                        <div v-if="item.status === 'Partial'" class="total-summary-sub partial-sub">
                          <span class="sub-label partial-label">⚠️ {{ item.excludedStores.length }} store(s) excluded due to conflicts</span>
                          <span class="sub-detail">Excluded: {{ item.excludedStores.join(', ') }}</span>
                        </div>
                        <div v-if="item.status === 'Incomplete'" class="total-summary-sub incomplete-sub">
                          <span class="sub-label incomplete-label">❌ Incomplete — missing required data</span>
                          <span class="sub-detail">Missing: {{ item.missingData?.join(', ') || 'Unknown' }}</span>
                        </div>
                        <div v-else-if="(item.status === 'Active' || item.status === 'Completed') && !item.isExcluded" class="total-summary-sub">
                          <span class="sub-label">✅ All stores included — complete cost</span>
                        </div>
                        <div v-if="selectedStoreId" class="total-summary-sub filter-info">
                          <span class="sub-label filter-label">🎯 Showing data for: {{ getStoreName(Number(selectedStoreId)) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Cost History -->
                    <div class="detail-card full-width" v-if="item.costHistory && item.costHistory.length > 0">
                      <h4>📈 Cost History</h4>
                      <table class="history-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Previous Cost</th>
                            <th>New Cost</th>
                            <th>Changed By</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="history in item.costHistory.slice(0, 5)" :key="history.id">
                            <td>{{ formatDate(history.createdAt) }}</td>
                            <td>ETB {{ formatCurrency(history.previousCost) }}</td>
                            <td>ETB {{ formatCurrency(history.newCost) }}</td>
                            <td>{{ history.changedBy || 'System' }}</td>
                            <td>{{ history.reason || '-' }}</td>
                          </tr>
                          <tr v-if="item.costHistory.length > 5">
                            <td colspan="5" class="text-center more-history">
                              ... and {{ item.costHistory.length - 5 }} more entries
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot v-if="items.length > 0">
          <tr class="footer-total">
            <td colspan="6" class="text-right"><strong>Page Total:</strong></td>
            <td class="total-cell"><strong>ETB {{ formatCurrency(pageTotal) }}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="totalItems > 0">
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

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import itemCostService from '@/stores/itemCostService'
import { debounce } from 'lodash-es'

// ================================================================
// STATE
// ================================================================

const loading = ref(false)
const exporting = ref(false)
const searchQuery = ref('')
const selectedStoreId = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRow = ref(null)
const totalItems = ref(0)
const totalPages = ref(0)

// Data from API
const allStores = ref([])
const allGroups = ref([])
const items = ref([])

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// PERFORMANCE: Debounced search
// ================================================================

const debouncedLoad = debounce(async () => {
  currentPage.value = 1
  await loadAllData()
}, 300)

const onSearchChange = () => {
  if (!searchQuery.value) {
    currentPage.value = 1
    loadAllData()
    return
  }
  debouncedLoad()
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  loadAllData()
}

// ================================================================
// COMPUTED - FILTERED & PAGINATED ITEMS
// ================================================================

const pageTotal = computed(() => {
  if (!items.value || items.value.length === 0) return 0
  
  return items.value
    .filter(item => (item.status === 'Active' || item.status === 'Completed') && !item.isExcluded)
    .reduce((sum, item) => sum + (item.totalCost || 0), 0)
})

const hasActiveFilters = computed(() => {
  return selectedStoreId.value || filterStatus.value || searchQuery.value
})

// ================================================================
// METHODS
// ================================================================

const getStoreName = (storeId) => {
  const store = allStores.value.find(s => s.id === storeId)
  return store ? store.name : 'Unknown Store'
}

const isStoreVisible = (storeId) => {
  if (!selectedStoreId.value) return true
  return storeId === Number(selectedStoreId.value)
}

// ================================================================
// 🔥 TOGGLE COST EXCLUSION
// ================================================================

const toggleItemStatus = async (item) => {
  try {
    const isCurrentlyExcluded = item.isExcluded || item.status === 'Inactive'
    const newStatus = isCurrentlyExcluded ? 'Active' : 'Inactive'
    
    const response = await itemCostService.toggleItemStatus(item.id, newStatus)
    
    if (response.success) {
      const updatedItem = response.data.item
      
      const index = items.value.findIndex(i => i.id === item.id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }

      showToastMessage(
        response.message || `Item "${item.itemName}" ${updatedItem.isExcluded ? 'excluded from' : 'included in'} cost calculations`,
        updatedItem.isExcluded ? 'warning' : 'success'
      )
    } else {
      showToastMessage(response.error || 'Failed to update status', 'error')
    }
  } catch (error) {
    console.error('Error toggling status:', error)
    showToastMessage('Failed to update status', 'error')
  }
}

// ================================================================
// API METHODS
// ================================================================

const loadStores = async () => {
  try {
    const response = await itemCostService.getStores()
    if (response.success) {
      allStores.value = response.data
    }
  } catch (error) {
    console.error('Error loading stores:', error)
    showToastMessage('Failed to load stores', 'error')
  }
}

const loadItems = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (selectedStoreId.value) {
      params.storeId = Number(selectedStoreId.value)
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    
    console.log('📄 Loading page:', currentPage.value, 'with params:', params)
    
    const response = await itemCostService.getItemsWithCost(params)

    if (response.success) {
      items.value = response.data
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.pages
      console.log('✅ Loaded page', currentPage.value, 'of', totalPages.value)
    } else {
      showToastMessage(response.error || 'Failed to load items', 'error')
    }
  } catch (error) {
    console.error('Error loading items:', error)
    showToastMessage('Failed to load items', 'error')
  } finally {
    loading.value = false
  }
}

const loadAllData = async () => {
  await loadItems()
}

const exportReport = async () => {
  exporting.value = true
  try {
    const response = await itemCostService.exportCostReport({
      storeId: selectedStoreId.value ? Number(selectedStoreId.value) : undefined,
    })

    if (response.success && response.data.length > 0) {
      const headers = Object.keys(response.data[0])
      const csv = [
        headers.join(','),
        ...response.data.map(row => 
          headers.map(key => `"${(row[key] ?? '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cost_report_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToastMessage(`Export completed! ${response.total} items exported`, 'success')
    } else {
      showToastMessage(response.error || 'No data to export', 'error')
    }
  } catch (error) {
    console.error('Error exporting:', error)
    showToastMessage('Failed to export report', 'error')
  } finally {
    exporting.value = false
  }
}

const printReport = () => {
  window.print()
}

// ================================================================
// UI METHODS
// ================================================================

const onFilterChange = () => {
  currentPage.value = 1
  loadAllData()
}

const clearFilters = () => {
  selectedStoreId.value = ''
  filterStatus.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
  loadAllData()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadItems()
  }
}

const changePageSize = () => {
  currentPage.value = 1
  loadAllData()
}

const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

// ================================================================
// HELPER METHODS
// ================================================================

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00'
  return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return Number(value).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
// WATCHERS
// ================================================================

watch([selectedStoreId, filterStatus], () => {
  currentPage.value = 1
  loadAllData()
}, { deep: true })

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  await loadStores()
  await loadAllData()
})

onUnmounted(() => {
  debouncedLoad.cancel()
})
</script>

<style scoped>
/* ================================================================
   SEARCH BOX WITH CLEAR BUTTON
   ================================================================ */
.search-box {
  position: relative;
  display: inline-block;
}

.search-box input {
  padding: 8px 32px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 250px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.search-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 50%;
  transition: all 0.2s;
}

.search-clear:hover {
  background: #e2e8f0;
  color: #475569;
}

.search-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.search-results-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
}

/* ================================================================
   STATUS BADGE - 4 Statuses Only
   ================================================================ */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.status-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  text-decoration: line-through;
  opacity: 0.7;
}

.exclusion-icon {
  font-size: 10px;
  margin-left: 2px;
}

/* ================================================================
   ROW STYLES
   ================================================================ */
.status-row-active {
  background: #ffffff;
  border-left: 4px solid #22c55e;
}

.status-row-partial {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
}

.status-row-incomplete {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.status-row-inactive {
  background: #f8fafc;
  border-left: 4px solid #94a3b8;
  opacity: 0.7;
}

/* ================================================================
   TABLE CELL STYLES
   ================================================================ */
.total-value.active-value {
  color: #16a34a;
}

.total-value.partial-value {
  color: #d97706;
}

.total-value.incomplete-value {
  color: #dc2626;
}

.total-value.inactive-value {
  color: #94a3b8;
  text-decoration: line-through;
}

/* ================================================================
   LOADING STATE
   ================================================================ */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #10b981;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 6px;
}

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
   FILTER BAR
   ================================================================ */
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  min-width: 180px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
}

.cost-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

.cost-table th,
.cost-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.cost-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}

/* ================================================================
   TABLE CELL STYLES
   ================================================================ */
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

.uom-code {
  font-weight: 600;
  font-size: 12px;
  color: #1e293b;
}

.balance-cell {
  font-weight: 600;
}

.balance-value {
  font-size: 14px;
  color: #1e293b;
}

.cost-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-cost {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.total-cell {
  font-weight: 600;
}

.total-value {
  font-size: 14px;
  color: #1e293b;
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
  padding: 20px;
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

/* ================================================================
   DETAIL SECTIONS
   ================================================================ */
.detail-top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
}

.detail-card.full-width {
  grid-column: 1 / -1;
}

.detail-card h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

.detail-card.card-active {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.detail-card.card-partial {
  border-color: #fde68a;
  background: #fffbeb;
}

.detail-card.card-incomplete {
  border-color: #fecaca;
  background: #fef2f2;
}

.detail-card.card-inactive {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.detail-vertical {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-vertical > div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}

.detail-vertical > div:last-child {
  border-bottom: none;
}

.detail-vertical .value { 
  font-weight: 500; 
  color: #1e293b; 
}

.detail-vertical .highlight-total { 
  color: #2563eb; 
  font-weight: 700; 
  font-size: 14px; 
}

.missing-data {
  color: #dc2626;
  font-weight: 600;
}

.partial-text {
  color: #d97706;
  font-weight: 600;
}

.incomplete-text {
  color: #dc2626;
  font-weight: 600;
}

.inactive-text {
  color: #94a3b8;
  font-weight: 600;
}

.active-text {
  color: #16a34a;
  font-weight: 600;
}

/* ================================================================
   BREAKDOWN CARD
   ================================================================ */
.breakdown-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.breakdown-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.store-breakdown-card {
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s;
}

.store-breakdown-card.store-conflict {
  border-color: #f59e0b;
  background: #fffbeb;
}

.store-breakdown-card.store-excluded {
  opacity: 0.85;
}

.store-breakdown-card.store-hidden {
  display: none;
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.store-breakdown-card.store-conflict .store-header {
  background: #fef3c7;
  border-bottom-color: #fde68a;
}

.store-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-icon {
  font-size: 16px;
}

.store-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.excluded-badge {
  font-size: 10px;
  font-weight: 600;
  color: #dc2626;
  background: #fee2e2;
  padding: 1px 8px;
  border-radius: 10px;
}

.active-filter-badge {
  font-size: 10px;
  font-weight: 600;
  color: #2563eb;
  background: #dbeafe;
  padding: 1px 8px;
  border-radius: 10px;
}

.store-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.store-status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.store-status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.store-status-badge.conflict {
  background: #fef3c7;
  color: #92400e;
}

.store-total-qty {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.conflict-note-small {
  font-size: 10px;
  color: #f59e0b;
  font-weight: 400;
}

.groups-list {
  padding: 6px 16px;
}

.group-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

.group-row:last-child {
  border-bottom: none;
}

.group-row.group-conflict {
  background: #fffbeb;
  border-radius: 4px;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}

.group-dot.conflict-dot {
  background: #f59e0b;
}

.group-name {
  font-size: 13px;
  color: #475569;
}

.group-quantity {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty-value {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.qty-uom {
  font-size: 11px;
  color: #94a3b8;
}

.conversion-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.conversion-rate {
  font-weight: 400;
  font-size: 9px;
  color: #6b8cbf;
}

.conflict-warning-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: #fef3c7;
  border-top: 1px solid #fde68a;
}

.warning-icon {
  font-size: 14px;
}

.warning-text {
  font-size: 11px;
  color: #92400e;
}

.warning-text strong {
  color: #dc2626;
}

/* ================================================================
   TOTAL SUMMARY
   ================================================================ */
.total-summary-bar {
  margin-top: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.total-summary-bar.summary-active {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.total-summary-bar.summary-partial {
  background: #fffbeb;
  border-color: #fde68a;
}

.total-summary-bar.summary-incomplete {
  background: #fef2f2;
  border-color: #fecaca;
}

.total-summary-bar.summary-inactive {
  background: #f1f5f9;
  border-color: #e2e8f0;
  opacity: 0.7;
}

.total-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.total-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.total-value-highlight {
  font-size: 16px;
  font-weight: 700;
  color: #2563eb;
}

.total-summary-sub {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #e2e8f0;
}

.total-summary-sub.partial-sub {
  border-top-color: #fde68a;
}

.total-summary-sub.incomplete-sub {
  border-top-color: #fecaca;
}

.total-summary-sub.inactive-sub {
  border-top-color: #e2e8f0;
}

.total-summary-sub.filter-info {
  border-top-color: #bfdbfe;
}

.sub-label {
  font-size: 12px;
  color: #22c55e;
}

.sub-label.partial-label {
  color: #d97706;
}

.sub-label.incomplete-label {
  color: #dc2626;
}

.sub-label.inactive-label {
  color: #94a3b8;
}

.sub-label.filter-label {
  color: #2563eb;
}

.sub-detail {
  display: block;
  font-size: 11px;
  color: #92400e;
  margin-top: 2px;
}

/* ================================================================
   HISTORY TABLE
   ================================================================ */
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.history-table th {
  background: #e2e8f0;
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
}

.history-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.more-history {
  color: #94a3b8;
  font-style: italic;
  padding: 8px;
}

/* ================================================================
   TABLE FOOTER
   ================================================================ */
.footer-total {
  background: #f8fafc;
  font-weight: 600;
}

.footer-total td {
  padding: 10px;
  border-top: 2px solid #e2e8f0;
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
   EMPTY STATE
   ================================================================ */
.empty-state { text-align: center; padding: 40px !important; }
.empty-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-icon { font-size: 40px; opacity: 0.3; }
.empty-content p { color: #64748b; margin: 0; font-size: 14px; }
.empty-sub { font-size: 12px !important; color: #94a3b8 !important; }

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
.toast.warning { border-left-color: #f59e0b; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1024px) {
  .detail-top-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detail-top-section {
    grid-template-columns: 1fr;
  }
  
  .detail-vertical {
    gap: 2px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .cost-table {
    font-size: 12px;
    min-width: 600px;
  }
  
  .store-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .store-status {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .section-card {
    padding: 12px;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
  
  .group-row {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .group-quantity {
    flex-wrap: wrap;
  }
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-export,
  .btn-print,
  .btn-clear-filters,
  .search-box,
  .pagination,
  .filter-bar {
    display: none !important;
  }

  .section-card {
    box-shadow: none !important;
    padding: 10px !important;
  }

  .expand-btn {
    display: none !important;
  }

  .expand-details {
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .detail-expand-row td {
    padding: 0 !important;
  }

  .cost-table {
    font-size: 10px !important;
    min-width: auto !important;
  }

  .cost-table th {
    background: #e2e8f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge.status-active {
    background: #dcfce7 !important;
  }
  .status-badge.status-partial {
    background: #fef3c7 !important;
  }
  .status-badge.status-incomplete {
    background: #fee2e2 !important;
  }
  .status-badge.status-inactive {
    background: #f1f5f9 !important;
  }
}
</style>