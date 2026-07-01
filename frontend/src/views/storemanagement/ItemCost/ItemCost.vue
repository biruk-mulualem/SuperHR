<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>💰 Inventory Cost Calculation</h2>
        <span class="total-badge">{{ totalItems }} Items</span>
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
      <select v-model="filterStore" class="filter-select" @change="onFilterChange">
        <option value="">All Stores</option>
        <option v-for="store in stores" :key="store.id" :value="store.id">
          {{ store.name }}
        </option>
      </select>
      <select v-model="filterGroup" class="filter-select" @change="onFilterChange">
        <option value="">All Groups</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-number">${{ formatCurrency(totalInventoryValue) }}</div>
          <div class="stat-label">Total Inventory Value</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">${{ formatCurrency(averageCost) }}</div>
          <div class="stat-label">Average Cost Per Item</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-number">{{ uniqueStores }}</div>
          <div class="stat-label">Stores</div>
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
            <th>Store</th>
            <th>Group</th>
            <th>UOM</th>
            <th>Balance</th>
            <th>Unit Cost</th>
            <th>Total Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedItems.length === 0">
            <td colspan="10" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">💰</span>
                <p>No cost data found</p>
              </div>
            </td>
          </tr>
          <template v-for="item in paginatedItems" :key="item.id">
            <tr
              :class="{
                'expanded-row': expandedRow === item.id,
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
              <td class="store-name">{{ item.storeName }}</td>
              <td>
                <span class="group-tag">{{ item.groupName }}</span>
              </td>
              <td class="uom-code">{{ item.uomCode }}</td>
              <td class="balance-cell">
                <span class="balance-value">{{ formatNumber(item.balance) }}</span>
                <span class="base-balance" v-if="item.conversionValue > 1">
                  ({{ formatNumber(item.balance * item.conversionValue) }} {{ item.conversionUomCode }})
                </span>
              </td>
              <td class="cost-cell">
                <div class="cost-wrapper">
                  <span class="unit-cost">${{ formatCurrency(item.unitCost) }}</span>
                </div>
                <button class="edit-cost-btn" @click="openEditCost(item)" title="Edit Cost">✏️</button>
              </td>
              <td class="total-cell">
                <span class="total-value" :class="{ 'high-value': item.totalValue > 10000 }">
                  ${{ formatCurrency(item.totalValue) }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', item.status.toLowerCase()]">
                  {{ item.status }}
                </span>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr v-if="expandedRow === item.id" class="detail-expand-row">
              <td colspan="10">
                <div class="expand-details">
                  <div class="detail-container">
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📋 Item Details</h4>
                        <div><span>Item Code</span><span class="value">{{ item.itemCode }}</span></div>
                        <div><span>Item Name</span><span class="value">{{ item.itemName }}</span></div>
                        <div><span>Standard Name</span><span class="value">{{ item.itemStandardName || '-' }}</span></div>
                        <div><span>Category</span><span class="value">{{ item.categoryName || '-' }}</span></div>
                        <div><span>Brand</span><span class="value">{{ item.brand || '-' }}</span></div>
                        <div><span>Model</span><span class="value">{{ item.model || '-' }}</span></div>
                      </div>

                      <div class="detail-card">
                        <h4>💰 Cost Details</h4>
                        <div><span>Unit Cost</span><span class="value">${{ formatCurrency(item.unitCost) }}</span></div>
                        <div><span>Balance</span><span class="value">{{ formatNumber(item.balance) }} {{ item.uomCode }}</span></div>
                        <div><span>Conversion</span><span class="value">{{ item.conversionValue }} {{ item.conversionUomCode || item.uomCode }} = 1 {{ item.uomCode }}</span></div>
                        <div><span>Base Balance</span><span class="value">{{ formatNumber(item.balance * item.conversionValue) }} {{ item.conversionUomCode || item.uomCode }}</span></div>
                        <div><span>Total Value</span><span class="value highlight-total">${{ formatCurrency(item.totalValue) }}</span></div>
                      </div>

                      <div class="detail-card">
                        <h4>📊 Store & Group</h4>
                        <div><span>Store</span><span class="value">{{ item.storeName }}</span></div>
                        <div><span>Store Code</span><span class="value">{{ item.storeCode || '-' }}</span></div>
                        <div><span>Group</span><span class="value">{{ item.groupName }}</span></div>
                        <div><span>Group Code</span><span class="value">{{ item.groupCode || '-' }}</span></div>
                        <div><span>Status</span><span class="value"><span :class="['status-badge', item.status.toLowerCase()]">{{ item.status }}</span></span></div>
                      </div>
                    </div>

                    <!-- Cost History -->
                    <div class="detail-card full-width">
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
                          <tr v-for="history in item.costHistory" :key="history.id">
                            <td>{{ formatDate(history.createdAt) }}</td>
                            <td>${{ formatCurrency(history.previousCost) }}</td>
                            <td>${{ formatCurrency(history.newCost) }}</td>
                            <td>{{ history.changedBy || 'System' }}</td>
                            <td>{{ history.reason || '-' }}</td>
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
        <!-- Table Footer with Totals -->
        <tfoot v-if="paginatedItems.length > 0">
          <tr class="footer-total">
            <td colspan="8" class="text-right"><strong>Page Total:</strong></td>
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

    <!-- ==================== EDIT COST MODAL ==================== -->
    <div v-if="showCostModal" class="modal-overlay" @click.self="closeCostModal">
      <div class="modal-container cost-modal">
        <div class="modal-header">
          <h3>✏️ Edit Unit Cost</h3>
          <button class="modal-close" @click="closeCostModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="cost-item-info">
            <div class="info-row">
              <span class="label">Item:</span>
              <span class="value">{{ editingItem?.itemName }} ({{ editingItem?.itemCode }})</span>
            </div>
            <div class="info-row">
              <span class="label">Store:</span>
              <span class="value">{{ editingItem?.storeName }}</span>
            </div>
            <div class="info-row">
              <span class="label">Group:</span>
              <span class="value">{{ editingItem?.groupName }}</span>
            </div>
            <div class="info-row">
              <span class="label">Current Cost:</span>
              <span class="value current-cost">${{ formatCurrency(editingItem?.unitCost) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Balance:</span>
              <span class="value">{{ formatNumber(editingItem?.balance) }} {{ editingItem?.uomCode }}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Value:</span>
              <span class="value highlight-total">${{ formatCurrency(editingItem?.totalValue) }}</span>
            </div>
          </div>

          <form @submit.prevent="saveCost" class="cost-form">
            <div class="form-group">
              <label>New Unit Cost ($) *</label>
              <input 
                v-model.number="newCost" 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="Enter new unit cost"
              />
              <span class="hint">Enter the cost per {{ editingItem?.uomCode }}</span>
            </div>
            <div class="form-group">
              <label>Reason for Change</label>
              <textarea v-model="costReason" rows="2" placeholder="Optional: Reason for cost update"></textarea>
            </div>
            <div class="form-preview" v-if="newCost !== null && newCost !== undefined && editingItem">
              <div class="preview-item">
                <span>New Total Value:</span>
                <strong class="highlight-total">${{ formatCurrency(editingItem.balance * newCost) }}</strong>
              </div>
              <div class="preview-item">
                <span>Change:</span>
                <strong :class="editingItem.balance * newCost - editingItem.totalValue > 0 ? 'positive' : 'negative'">
                  {{ editingItem.balance * newCost - editingItem.totalValue > 0 ? '+' : '' }}
                  ${{ formatCurrency(editingItem.balance * newCost - editingItem.totalValue) }}
                </strong>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeCostModal">Cancel</button>
          <button class="btn-primary" @click="saveCost" :disabled="saving || !newCost || newCost < 0">
            {{ saving ? 'Saving...' : 'Update Cost' }}
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
import { ref, computed } from 'vue'

// ================================================================
// DEMO DATA
// ================================================================

// Stores
const stores = ref([
  { id: 1, name: 'Main Store', code: 'STORE-001' },
  { id: 2, name: 'Warehouse A', code: 'STORE-002' },
  { id: 3, name: 'Warehouse B', code: 'STORE-003' },
  { id: 4, name: 'Retail Store', code: 'STORE-004' }
])

// Groups
const groups = ref([
  { id: 1, name: 'Fiber Mainstore IT', code: 'GRP-001' },
  { id: 2, name: 'Fiber Ministore IT', code: 'GRP-002' },
  { id: 3, name: 'Fiber Storekeeper', code: 'GRP-003' },
  { id: 4, name: 'HR Department', code: 'GRP-004' }
])

// Demo Cost Items
const costItems = ref([
  {
    id: 1,
    itemCode: 'SDT000001',
    itemName: 'Dell Laptop',
    itemStandardName: 'Dell Latitude 3420',
    storeId: 1,
    storeName: 'Main Store',
    storeCode: 'STORE-001',
    groupId: 1,
    groupName: 'Fiber Mainstore IT',
    groupCode: 'GRP-001',
    categoryName: 'Electronics',
    brand: 'Dell',
    model: 'Latitude 3420',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 25,
    unitCost: 850.00,
    totalValue: 21250.00,
    status: 'Active',
    costHistory: [
      { id: 1, previousCost: 800.00, newCost: 850.00, changedBy: 'Admin', reason: 'Price increase', createdAt: '2024-06-15T10:30:00' },
      { id: 2, previousCost: 750.00, newCost: 800.00, changedBy: 'Manager', reason: 'Supplier update', createdAt: '2024-05-20T14:20:00' }
    ]
  },
  {
    id: 2,
    itemCode: 'SDT000002',
    itemName: 'HP Monitor',
    itemStandardName: 'HP 24" LED Monitor',
    storeId: 1,
    storeName: 'Main Store',
    storeCode: 'STORE-001',
    groupId: 1,
    groupName: 'Fiber Mainstore IT',
    groupCode: 'GRP-001',
    categoryName: 'Electronics',
    brand: 'HP',
    model: 'E243',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 40,
    unitCost: 320.00,
    totalValue: 12800.00,
    status: 'Active',
    costHistory: [
      { id: 1, previousCost: 300.00, newCost: 320.00, changedBy: 'Admin', reason: 'Market adjustment', createdAt: '2024-06-10T09:15:00' }
    ]
  },
  {
    id: 3,
    itemCode: 'SDT000003',
    itemName: 'Office Chair',
    itemStandardName: 'Ergonomic Office Chair',
    storeId: 2,
    storeName: 'Warehouse A',
    storeCode: 'STORE-002',
    groupId: 2,
    groupName: 'Fiber Ministore IT',
    groupCode: 'GRP-002',
    categoryName: 'Furniture',
    brand: 'Herman Miller',
    model: 'Aeron',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 15,
    unitCost: 1200.00,
    totalValue: 18000.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 4,
    itemCode: 'SDT000004',
    itemName: 'Wireless Keyboard',
    itemStandardName: 'Logitech MX Keys',
    storeId: 3,
    storeName: 'Warehouse B',
    storeCode: 'STORE-003',
    groupId: 3,
    groupName: 'Fiber Storekeeper',
    groupCode: 'GRP-003',
    categoryName: 'Electronics',
    brand: 'Logitech',
    model: 'MX Keys',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 60,
    unitCost: 95.00,
    totalValue: 5700.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 5,
    itemCode: 'SDT000005',
    itemName: 'USB Flash Drive',
    itemStandardName: 'SanDisk 64GB USB',
    storeId: 1,
    storeName: 'Main Store',
    storeCode: 'STORE-001',
    groupId: 1,
    groupName: 'Fiber Mainstore IT',
    groupCode: 'GRP-001',
    categoryName: 'Accessories',
    brand: 'SanDisk',
    model: 'Ultra 64GB',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 200,
    unitCost: 12.50,
    totalValue: 2500.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 6,
    itemCode: 'SDT000006',
    itemName: 'Paper Ream (A4)',
    itemStandardName: 'A4 Copy Paper 80gsm',
    storeId: 2,
    storeName: 'Warehouse A',
    storeCode: 'STORE-002',
    groupId: 2,
    groupName: 'Fiber Ministore IT',
    groupCode: 'GRP-002',
    categoryName: 'Stationery',
    brand: 'Double A',
    model: '80gsm',
    uomCode: 'REAM',
    conversionValue: 500,
    conversionUomCode: 'SHEETS',
    balance: 150,
    unitCost: 4.50,
    totalValue: 675.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 7,
    itemCode: 'SDT000007',
    itemName: 'Ink Cartridge',
    itemStandardName: 'HP 62XL Ink Cartridge',
    storeId: 3,
    storeName: 'Warehouse B',
    storeCode: 'STORE-003',
    groupId: 3,
    groupName: 'Fiber Storekeeper',
    groupCode: 'GRP-003',
    categoryName: 'Consumables',
    brand: 'HP',
    model: '62XL',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 80,
    unitCost: 35.00,
    totalValue: 2800.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 8,
    itemCode: 'SDT000008',
    itemName: 'Desk Phone',
    itemStandardName: 'IP Office Phone',
    storeId: 1,
    storeName: 'Main Store',
    storeCode: 'STORE-001',
    groupId: 4,
    groupName: 'HR Department',
    groupCode: 'GRP-004',
    categoryName: 'Electronics',
    brand: 'Cisco',
    model: '8841',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 30,
    unitCost: 180.00,
    totalValue: 5400.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 9,
    itemCode: 'SDT000009',
    itemName: 'Filing Cabinet',
    itemStandardName: '4-Drawer Vertical File',
    storeId: 2,
    storeName: 'Warehouse A',
    storeCode: 'STORE-002',
    groupId: 4,
    groupName: 'HR Department',
    groupCode: 'GRP-004',
    categoryName: 'Furniture',
    brand: 'Steelcase',
    model: '4-Drawer',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 10,
    unitCost: 450.00,
    totalValue: 4500.00,
    status: 'Inactive',
    costHistory: [
      { id: 1, previousCost: 400.00, newCost: 450.00, changedBy: 'Admin', reason: 'Cost adjustment', createdAt: '2024-05-01T10:00:00' }
    ]
  },
  {
    id: 10,
    itemCode: 'SDT000010',
    itemName: 'Whiteboard Marker',
    itemStandardName: 'Dry Erase Marker',
    storeId: 3,
    storeName: 'Warehouse B',
    storeCode: 'STORE-003',
    groupId: 3,
    groupName: 'Fiber Storekeeper',
    groupCode: 'GRP-003',
    categoryName: 'Stationery',
    brand: 'Expo',
    model: 'Low Odor',
    uomCode: 'BOX',
    conversionValue: 12,
    conversionUomCode: 'PCS',
    balance: 30,
    unitCost: 8.00,
    totalValue: 240.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 11,
    itemCode: 'SDT000011',
    itemName: 'Network Switch',
    itemStandardName: 'Cisco 2960 Switch',
    storeId: 1,
    storeName: 'Main Store',
    storeCode: 'STORE-001',
    groupId: 1,
    groupName: 'Fiber Mainstore IT',
    groupCode: 'GRP-001',
    categoryName: 'Networking',
    brand: 'Cisco',
    model: '2960-24',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 8,
    unitCost: 650.00,
    totalValue: 5200.00,
    status: 'Active',
    costHistory: []
  },
  {
    id: 12,
    itemCode: 'SDT000012',
    itemName: 'Projector',
    itemStandardName: 'Epson Projector',
    storeId: 4,
    storeName: 'Retail Store',
    storeCode: 'STORE-004',
    groupId: 2,
    groupName: 'Fiber Ministore IT',
    groupCode: 'GRP-002',
    categoryName: 'Electronics',
    brand: 'Epson',
    model: 'EB-X51',
    uomCode: 'PCS',
    conversionValue: 1,
    conversionUomCode: 'PCS',
    balance: 3,
    unitCost: 950.00,
    totalValue: 2850.00,
    status: 'Active',
    costHistory: []
  }
])

// ================================================================
// STATE
// ================================================================
const searchQuery = ref('')
const filterStore = ref('')
const filterGroup = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRow = ref(null)
const exporting = ref(false)
const saving = ref(false)

// Cost Modal
const showCostModal = ref(false)
const editingItem = ref(null)
const newCost = ref(null)
const costReason = ref('')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================

const filteredItems = computed(() => {
  let result = [...costItems.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.itemName?.toLowerCase().includes(query) ||
      item.itemCode?.toLowerCase().includes(query) ||
      item.itemStandardName?.toLowerCase().includes(query)
    )
  }
  
  if (filterStore.value) {
    result = result.filter(item => item.storeId === Number(filterStore.value))
  }
  
  if (filterGroup.value) {
    result = result.filter(item => item.groupId === Number(filterGroup.value))
  }
  
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

const totalItems = computed(() => costItems.value.length)
const uniqueStores = computed(() => {
  return new Set(costItems.value.map(item => item.storeId)).size
})

const totalInventoryValue = computed(() => {
  return costItems.value.reduce((sum, item) => sum + (item.totalValue || 0), 0)
})

const averageCost = computed(() => {
  if (costItems.value.length === 0) return 0
  const totalCost = costItems.value.reduce((sum, item) => sum + (item.unitCost || 0), 0)
  return totalCost / costItems.value.length
})

const pageTotal = computed(() => {
  return paginatedItems.value.reduce((sum, item) => sum + (item.totalValue || 0), 0)
})

const hasActiveFilters = computed(() => {
  return filterStore.value || filterGroup.value || filterStatus.value || searchQuery.value
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
  filterStore.value = ''
  filterGroup.value = ''
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
// COST EDITING
// ================================================================

const openEditCost = (item) => {
  editingItem.value = item
  newCost.value = item.unitCost
  costReason.value = ''
  showCostModal.value = true
}

const closeCostModal = () => {
  showCostModal.value = false
  editingItem.value = null
  newCost.value = null
  costReason.value = ''
}

const saveCost = () => {
  if (!editingItem.value || !newCost.value || newCost.value < 0) return
  
  saving.value = true
  
  // Simulate API call
  setTimeout(() => {
    // Update the cost
    const item = costItems.value.find(i => i.id === editingItem.value.id)
    if (item) {
      const oldCost = item.unitCost
      item.unitCost = newCost.value
      item.totalValue = item.balance * newCost.value
      
      // Add to history
      item.costHistory.unshift({
        id: Date.now(),
        previousCost: oldCost,
        newCost: newCost.value,
        changedBy: 'Current User',
        reason: costReason.value || 'Manual update',
        createdAt: new Date().toISOString()
      })
    }
    
    showToastMessage('Unit cost updated successfully!', 'success')
    closeCostModal()
    saving.value = false
  }, 500)
}

// ================================================================
// EXPORT & PRINT
// ================================================================

const exportReport = () => {
  exporting.value = true
  
  // Simulate export
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
  min-width: 120px;
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
  min-width: 1000px;
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

.store-name {
  font-weight: 500;
  font-size: 12px;
}

.group-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
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

.base-balance {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  font-weight: normal;
}

.cost-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cost-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.unit-cost {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.cost-currency {
  font-size: 10px;
  color: #94a3b8;
}

.edit-cost-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0;
}

.cost-cell:hover .edit-cost-btn {
  opacity: 1;
}

.edit-cost-btn:hover {
  background: #f1f5f9;
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

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
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

.detail-row-two-cols {
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

.detail-card.full-width {
  grid-column: 1 / -1;
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
.detail-card .highlight-total { color: #2563eb; font-weight: 700; }

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
   MODAL
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
  max-width: 500px;
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

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}
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

.cost-item-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}
.info-row:last-child { border-bottom: none; }
.info-row .label { color: #64748b; }
.info-row .value { font-weight: 500; color: #1e293b; }
.current-cost { color: #2563eb; font-weight: 700; }
.highlight-total { color: #2563eb; font-weight: 700; }

.cost-form .form-group {
  margin-bottom: 14px;
}
.cost-form .form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}
.cost-form .form-group input,
.cost-form .form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
}
.cost-form .form-group input:focus,
.cost-form .form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.cost-form .hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.form-preview {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}
.preview-item .positive { color: #16a34a; }
.preview-item .negative { color: #dc2626; }

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

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1024px) {
  .detail-row-two-cols {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .detail-row-two-cols {
    grid-template-columns: 1fr;
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
  }
  
  .filter-bar select {
    width: 100%;
  }
  
  .cost-table {
    font-size: 12px;
    min-width: 700px;
  }
  
  .modal-container {
    max-width: 95%;
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
}
</style>