<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>💰 Inventory Cost Calculation</h2>
        <span class="total-badge">{{ filteredItems.length }} Items</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search items..."
            @input="onSearchChange"
          />
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
          <option value="Active">Active</option>
          <option value="Partial">Partial</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS - Dynamic based on filter ==================== -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-number">{{ filteredItems.length }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-number">${{ formatCurrency(filteredTotalValue) }}</div>
          <div class="stat-label">Total Inventory Value</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-number">{{ filteredStoresCount }}</div>
          <div class="stat-label">Stores</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-number">{{ filteredPartialItems }}</div>
          <div class="stat-label">Items with Partial Cost</div>
        </div>
      </div>
    </div>

    <!-- ==================== COST TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <table class="cost-table">
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
          <tr v-if="paginatedItems.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">💰</span>
                <p>No cost data found</p>
                <p class="empty-sub" v-if="selectedStoreId">Try selecting a different store or clear the filter</p>
              </div>
            </td>
          </tr>
          <template v-for="item in paginatedItems" :key="item.id">
            <tr
              :class="{
                'expanded-row': expandedRow === item.id,
                'partial-row': item.status === 'Partial',
                'inactive-row': item.status === 'Inactive'
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
                <span class="unit-cost">${{ formatCurrency(item.unitCost) }}</span>
              </td>
              <td class="total-cell">
                <span class="total-value" :class="{ 
                  'high-value': item.totalCost > 10000,
                  'inactive-value': item.status === 'Inactive'
                }">
                  ${{ formatCurrency(item.totalCost) }}
                </span>
                <span v-if="item.status === 'Partial'" class="partial-tag">(Partial)</span>
                <span v-if="item.status === 'Inactive'" class="inactive-tag">(Inactive)</span>
              </td>
              <td>
                <span 
                  :class="['status-badge', item.status.toLowerCase()]"
                  @click="toggleItemStatus(item)"
                  style="cursor: pointer;"
                  title="Click to toggle status"
                >
                  {{ item.status }}
                </span>
                <span v-if="item.status === 'Partial'" class="partial-hint" title="Some stores excluded due to conflicts">
                  ⚠️
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
                            <span>Status</span>
                            <span 
                              :class="['status-badge', item.status.toLowerCase(), 'clickable-status']"
                              @click="toggleItemStatus(item)"
                              style="cursor: pointer;"
                            >
                              {{ item.status }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-card cost-summary-card" :class="{ 
                        'partial-card': item.status === 'Partial',
                        'inactive-card': item.status === 'Inactive'
                      }">
                        <h4>💰 Cost Summary</h4>
                        <div class="detail-vertical">
                          <div><span>Unit Cost</span><span class="value">${{ formatCurrency(item.unitCost) }} / {{ item.baseUOM }}</span></div>
                          <div><span>Total Quantity</span><span class="value">{{ formatNumber(item.totalQty) }} {{ item.baseUOM }}</span></div>
                          <div><span>Total Cost</span><span class="value highlight-total">${{ formatCurrency(item.totalCost) }}</span></div>
                          <div v-if="item.status === 'Partial'">
                            <span>Status</span>
                            <span class="value partial-text">⚠️ Partial - Some stores excluded</span>
                          </div>
                          <div v-if="item.status === 'Inactive'">
                            <span>Status</span>
                            <span class="value inactive-text">⛔ Inactive - Excluded from total cost</span>
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
                        <div v-if="item.status === 'Partial'" class="partial-note">
                          <span class="partial-icon">⚠️</span>
                          <span class="partial-text">Some stores have conflicting quantities and are excluded from total cost.</span>
                        </div>
                        <div v-if="item.status === 'Inactive'" class="inactive-note">
                          <span class="inactive-icon">⛔</span>
                          <span class="inactive-text">This item is inactive and excluded from total inventory value.</span>
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
                                Qty: {{ formatNumber(store.agreedQuantity) }} {{ item.baseUOM }}
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
                                <span class="qty-uom">{{ item.baseUOM }}</span>
                                <span 
                                  v-if="group.conversionRate && group.conversionRate > 1" 
                                  class="conversion-badge"
                                >
                                  {{ group.originalUOM }} → {{ item.baseUOM }}
                                  <span class="conversion-rate">(×{{ group.conversionRate }})</span>
                                </span>
                                <span v-if="store.hasConflict" class="conflict-indicator">⚠️</span>
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
                        'partial-summary': item.status === 'Partial',
                        'inactive-summary': item.status === 'Inactive'
                      }">
                        <div class="total-summary-item">
                          <span class="total-label">Total Quantity (Included Stores)</span>
                          <span class="total-value-highlight">{{ formatNumber(item.totalQty) }} {{ item.baseUOM }}</span>
                        </div>
                        <div class="total-summary-item">
                          <span class="total-label">Total Cost</span>
                          <span class="total-value-highlight">${{ formatCurrency(item.totalCost) }}</span>
                        </div>
                        <div v-if="item.status === 'Partial'" class="total-summary-sub partial-sub">
                          <span class="sub-label partial-label">⚠️ {{ item.excludedStores.length }} store(s) excluded due to conflicts</span>
                          <span class="sub-detail">Excluded: {{ item.excludedStores.join(', ') }}</span>
                        </div>
                        <div v-if="item.status === 'Inactive'" class="total-summary-sub inactive-sub">
                          <span class="sub-label inactive-label">⛔ Item is inactive — excluded from total inventory value</span>
                        </div>
                        <div v-else-if="item.status !== 'Partial'" class="total-summary-sub">
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
                            <td>${{ formatCurrency(history.previousCost) }}</td>
                            <td>${{ formatCurrency(history.newCost) }}</td>
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
        <tfoot v-if="paginatedItems.length > 0">
          <tr class="footer-total">
            <td colspan="6" class="text-right"><strong>Page Total:</strong></td>
            <td class="total-cell"><strong>${{ formatCurrency(pageTotal) }}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="filteredItems.length > 0">
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
import { ref, computed } from 'vue'

// ================================================================
// STORE LIST
// ================================================================

const allStores = ref([
  { id: 1, name: 'Fiber Main Store' },
  { id: 2, name: 'Fiber Mini Store' },
  { id: 3, name: 'Paint Main Store' },
  { id: 4, name: 'Fiber Warehouse' }
])

// ================================================================
// DEMO DATA - WITH CORRECT STORE NAMES
// ================================================================

const getStoreName = (storeId) => {
  const store = allStores.value.find(s => s.id === storeId)
  return store ? store.name : 'Unknown Store'
}

// Helper to process store breakdown
const processStoreBreakdown = (store) => {
  const quantities = store.groups.map(g => g.baseQuantity || g.quantity)
  const firstQty = quantities[0]
  const allSame = quantities.every(q => q === firstQty)
  
  return {
    ...store,
    hasConflict: !allSame,
    isExcluded: !allSame,
    agreedQuantity: allSame ? firstQty : 0,
    groups: store.groups.map(g => ({
      ...g,
      baseQuantity: g.baseQuantity || g.quantity
    }))
  }
}

// Process all items
const processItem = (item) => {
  const processedStores = item.storeBreakdown.map(processStoreBreakdown)
  
  const excludedStores = processedStores
    .filter(s => s.isExcluded)
    .map(s => s.storeName)
  
  const includedStores = processedStores.filter(s => !s.isExcluded)
  const totalQty = includedStores.reduce((sum, s) => sum + s.agreedQuantity, 0)
  const totalCost = totalQty * item.unitCost
  
  let status = item.userStatus || 'Active' // Use user-set status if exists
  if (status !== 'Inactive') {
    if (excludedStores.length > 0 && includedStores.length > 0) {
      status = 'Partial'
    } else if (excludedStores.length === processedStores.length) {
      status = 'Conflict'
    } else {
      status = 'Active'
    }
  }
  
  return {
    ...item,
    storeBreakdown: processedStores,
    status: status,
    totalQty: status === 'Inactive' ? 0 : totalQty,
    totalCost: status === 'Inactive' ? 0 : totalCost,
    excludedStores: excludedStores,
    includedStoresCount: includedStores.length,
    excludedStoresCount: excludedStores.length
  }
}

// Raw demo data
const rawItems = [
  {
    id: 1,
    itemCode: 'SDT000001',
    itemName: 'Dell Laptop',
    itemStandardName: 'Dell Latitude 3420',
    categoryName: 'Electronics',
    brand: 'Dell',
    model: 'Latitude 3420',
    baseUOM: 'PCS',
    unitCost: 850.00,
    userStatus: 'Active',
    storeBreakdown: [
      {
        storeId: 1,
        storeName: 'Fiber Main Store',
        groups: [
          { groupId: 1, groupName: 'Fiber Mainstore IT', quantity: 15, originalUOM: 'PCS', conversionRate: 1 },
          { groupId: 2, groupName: 'Fiber Mainstore Storekeeper', quantity: 15, originalUOM: 'PCS', conversionRate: 1 }
        ]
      },
      {
        storeId: 2,
        storeName: 'Fiber Mini Store',
        groups: [
          { groupId: 3, groupName: 'Fiber Ministore IT', quantity: 12, originalUOM: 'PCS', conversionRate: 1 },
          { groupId: 4, groupName: 'Fiber Ministore Storekeeper', quantity: 12, originalUOM: 'PCS', conversionRate: 1 }
        ]
      }
    ],
    costHistory: [
      { id: 1, previousCost: 800.00, newCost: 850.00, changedBy: 'Admin', reason: 'Price increase', createdAt: '2024-06-15T10:30:00' }
    ]
  },
  {
    id: 2,
    itemCode: 'SDT000002',
    itemName: 'HP Monitor',
    itemStandardName: 'HP 24" LED Monitor',
    categoryName: 'Electronics',
    brand: 'HP',
    model: 'E243',
    baseUOM: 'PCS',
    unitCost: 320.00,
    userStatus: 'Active',
    storeBreakdown: [
      {
        storeId: 1,
        storeName: 'Fiber Main Store',
        groups: [
          { groupId: 1, groupName: 'Fiber Mainstore IT', quantity: 30, originalUOM: 'PCS', conversionRate: 1 },
          { groupId: 2, groupName: 'Fiber Mainstore Storekeeper', quantity: 15, originalUOM: 'PCS', conversionRate: 1 }
        ]
      },
      {
        storeId: 2,
        storeName: 'Fiber Mini Store',
        groups: [
          { groupId: 3, groupName: 'Fiber Ministore IT', quantity: 10, originalUOM: 'PCS', conversionRate: 1 },
          { groupId: 4, groupName: 'Fiber Ministore Storekeeper', quantity: 10, originalUOM: 'PCS', conversionRate: 1 }
        ]
      }
    ],
    costHistory: []
  },
  {
    id: 3,
    itemCode: 'SDT000003',
    itemName: 'Dulenti Chemical',
    itemStandardName: 'Dulenti Chemical Base',
    categoryName: 'Chemicals',
    brand: 'Dulenti',
    model: 'DC-100',
    baseUOM: 'KG',
    unitCost: 45.50,
    userStatus: 'Active',
    storeBreakdown: [
      {
        storeId: 1,
        storeName: 'Fiber Main Store',
        groups: [
          { groupId: 1, groupName: 'Fiber Mainstore IT', quantity: 3, originalUOM: 'Drum', conversionRate: 165, baseQuantity: 495 },
          { groupId: 2, groupName: 'Fiber Mainstore Storekeeper', quantity: 3, originalUOM: 'Drum', conversionRate: 165, baseQuantity: 495 }
        ]
      },
      {
        storeId: 2,
        storeName: 'Fiber Mini Store',
        groups: [
          { groupId: 3, groupName: 'Fiber Ministore IT', quantity: 300, originalUOM: 'KG', conversionRate: 1, baseQuantity: 300 }
        ]
      },
      {
        storeId: 3,
        storeName: 'Paint Main Store',
        groups: [
          { groupId: 5, groupName: 'Paint Mainstore IT', quantity: 5, originalUOM: 'Bag', conversionRate: 25, baseQuantity: 125 }
        ]
      }
    ],
    costHistory: [
      { id: 1, previousCost: 42.00, newCost: 45.50, changedBy: 'Admin', reason: 'Price increase', createdAt: '2024-06-15T10:30:00' }
    ]
  },
  {
    id: 4,
    itemCode: 'SDT000004',
    itemName: 'Industrial Paint',
    itemStandardName: 'Industrial Paint Base',
    categoryName: 'Chemicals',
    brand: 'PaintCo',
    model: 'PC-200',
    baseUOM: 'L',
    unitCost: 12.75,
    userStatus: 'Active',
    storeBreakdown: [
      {
        storeId: 1,
        storeName: 'Fiber Main Store',
        groups: [
          { groupId: 1, groupName: 'Fiber Mainstore IT', quantity: 1, originalUOM: 'Drum', conversionRate: 200, baseQuantity: 200 },
          { groupId: 2, groupName: 'Fiber Mainstore Storekeeper', quantity: 2, originalUOM: 'Drum', conversionRate: 200, baseQuantity: 400 }
        ]
      },
      {
        storeId: 3,
        storeName: 'Paint Main Store',
        groups: [
          { groupId: 5, groupName: 'Paint Mainstore IT', quantity: 400, originalUOM: 'L', conversionRate: 1, baseQuantity: 400 }
        ]
      }
    ],
    costHistory: []
  },
  {
    id: 5,
    itemCode: 'SDT000005',
    itemName: 'USB Flash Drive',
    itemStandardName: 'SanDisk 64GB USB',
    categoryName: 'Accessories',
    brand: 'SanDisk',
    model: 'Ultra 64GB',
    baseUOM: 'PCS',
    unitCost: 12.50,
    userStatus: 'Active',
    storeBreakdown: [
      {
        storeId: 1,
        storeName: 'Fiber Main Store',
        groups: [
          { groupId: 1, groupName: 'Fiber Mainstore IT', quantity: 100, originalUOM: 'PCS', conversionRate: 1 },
          { groupId: 2, groupName: 'Fiber Mainstore Storekeeper', quantity: 100, originalUOM: 'PCS', conversionRate: 1 }
        ]
      },
      {
        storeId: 2,
        storeName: 'Fiber Mini Store',
        groups: [
          { groupId: 3, groupName: 'Fiber Ministore IT', quantity: 50, originalUOM: 'PCS', conversionRate: 1 },
          { groupId: 4, groupName: 'Fiber Ministore Storekeeper', quantity: 50, originalUOM: 'PCS', conversionRate: 1 }
        ]
      },
      {
        storeId: 3,
        storeName: 'Paint Main Store',
        groups: [
          { groupId: 5, groupName: 'Paint Mainstore IT', quantity: 50, originalUOM: 'PCS', conversionRate: 1 }
        ]
      }
    ],
    costHistory: []
  }
]

// Process the data
const aggregatedItems = ref(rawItems.map(processItem))

// ================================================================
// STATE
// ================================================================
const searchQuery = ref('')
const selectedStoreId = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRow = ref(null)
const exporting = ref(false)

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// STATUS TOGGLE
// ================================================================

const toggleItemStatus = (item) => {
  const newStatus = item.status === 'Inactive' ? 'Active' : 'Inactive'
  const itemIndex = aggregatedItems.value.findIndex(i => i.id === item.id)
  
  if (itemIndex !== -1) {
    // Update userStatus
    aggregatedItems.value[itemIndex].userStatus = newStatus
    
    // Reprocess the item
    const processed = processItem(aggregatedItems.value[itemIndex])
    aggregatedItems.value[itemIndex] = processed
    
    showToastMessage(`Item "${item.itemName}" status changed to ${newStatus}`, 
      newStatus === 'Inactive' ? 'warning' : 'success')
  }
}

// ================================================================
// FILTER LOGIC
// ================================================================

const isStoreVisible = (storeId) => {
  if (!selectedStoreId.value) return true
  return storeId === Number(selectedStoreId.value)
}

const filterItemsByStore = (items) => {
  if (!selectedStoreId.value) return items
  
  return items.map(item => {
    const filteredBreakdown = item.storeBreakdown.filter(
      s => s.storeId === Number(selectedStoreId.value)
    )
    
    const includedStores = filteredBreakdown.filter(s => !s.isExcluded)
    const totalQty = includedStores.reduce((sum, s) => sum + s.agreedQuantity, 0)
    const totalCost = totalQty * item.unitCost
    
    const excludedStores = filteredBreakdown
      .filter(s => s.isExcluded)
      .map(s => s.storeName)
    
    let status = item.userStatus === 'Inactive' ? 'Inactive' : 'Active'
    if (status !== 'Inactive') {
      if (filteredBreakdown.length === 0) {
        status = 'Inactive'
      } else if (excludedStores.length > 0 && includedStores.length > 0) {
        status = 'Partial'
      } else if (excludedStores.length === filteredBreakdown.length) {
        status = 'Conflict'
      }
    }
    
    return {
      ...item,
      storeBreakdown: filteredBreakdown,
      status: status,
      totalQty: status === 'Inactive' ? 0 : totalQty,
      totalCost: status === 'Inactive' ? 0 : totalCost,
      excludedStores: excludedStores,
      includedStoresCount: includedStores.length,
      excludedStoresCount: excludedStores.length,
      isFiltered: true
    }
  }).filter(item => item.storeBreakdown.length > 0 || item.status === 'Inactive')
}

// ================================================================
// COMPUTED
// ================================================================

const filteredItems = computed(() => {
  let result = [...aggregatedItems.value]
  
  // Apply store filter first
  if (selectedStoreId.value) {
    result = filterItemsByStore(result)
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.itemName?.toLowerCase().includes(query) ||
      item.itemCode?.toLowerCase().includes(query) ||
      item.itemStandardName?.toLowerCase().includes(query)
    )
  }
  
  // Apply status filter
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
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

// Filtered stats - exclude inactive items
const filteredTotalValue = computed(() => {
  return filteredItems.value
    .filter(item => item.status === 'Active' || item.status === 'Partial')
    .reduce((sum, item) => sum + (item.totalCost || 0), 0)
})

const filteredStoresCount = computed(() => {
  const stores = new Set()
  filteredItems.value.forEach(item => {
    if (item.status !== 'Inactive') {
      item.storeBreakdown.forEach(s => stores.add(s.storeId))
    }
  })
  return stores.size
})

const filteredPartialItems = computed(() => {
  return filteredItems.value.filter(item => item.status === 'Partial').length
})

const pageTotal = computed(() => {
  return paginatedItems.value
    .filter(item => item.status === 'Active' || item.status === 'Partial')
    .reduce((sum, item) => sum + (item.totalCost || 0), 0)
})

const hasActiveFilters = computed(() => {
  return selectedStoreId.value || filterStatus.value || searchQuery.value
})

// ================================================================
// METHODS
// ================================================================

const onSearchChange = () => {
  currentPage.value = 1
}

const onFilterChange = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  selectedStoreId.value = ''
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

const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

// ================================================================
// EXPORT & PRINT
// ================================================================

const exportReport = () => {
  exporting.value = true
  setTimeout(() => {
    showToastMessage('Export completed!', 'success')
    exporting.value = false
  }, 1000)
}

const printReport = () => {
  window.print()
}

// ================================================================
// HELPER METHODS
// ================================================================

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0.00'
  return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
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
   STATS
   ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  transition: all 0.2s;
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
  font-size: 18px;
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
   STATUS BADGE - FIXED COLORS
   ================================================================ */
.status-badge {
  display: inline-block;
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

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.partial {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.conflict {
  background: #fef3c7;
  color: #92400e;
}

.clickable-status {
  cursor: pointer;
}

.clickable-status:hover {
  opacity: 0.8;
}

/* ================================================================
   TABLE STYLES
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

.total-value.high-value {
  color: #dc2626;
}

.total-value.inactive-value {
  color: #94a3b8;
  text-decoration: line-through;
}

.partial-tag {
  font-size: 10px;
  color: #f59e0b;
  font-weight: 500;
  margin-left: 4px;
}

.inactive-tag {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
  margin-left: 4px;
}

.partial-row {
  background: #fffbeb;
}

.inactive-row {
  background: #f8fafc;
  opacity: 0.7;
}

.partial-hint {
  color: #f59e0b;
  font-size: 14px;
  margin-left: 4px;
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
   DETAIL TOP SECTION
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

.conflict-indicator {
  color: #f59e0b;
  font-size: 14px;
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
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.total-summary-bar.partial-summary {
  background: #fffbeb;
  border-color: #fde68a;
}

.total-summary-bar.inactive-summary {
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
  color: #f59e0b;
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
   COST SUMMARY CARD
   ================================================================ */
.cost-summary-card.partial-card {
  border-color: #f59e0b;
  background: #fffbeb;
}

.cost-summary-card.inactive-card {
  border-color: #e2e8f0;
  background: #f8fafc;
  opacity: 0.7;
}

.partial-text {
  color: #92400e;
  font-weight: 600;
}

.inactive-text {
  color: #94a3b8;
  font-weight: 600;
}

.partial-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 6px;
  border: 1px solid #fde68a;
  font-size: 12px;
}

.inactive-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
}

.partial-icon {
  font-size: 16px;
}

.inactive-icon {
  font-size: 16px;
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
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
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
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
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
</style>