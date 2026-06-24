<!-- pages/StoreBalance.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>💰 Store Balance</h2>
        <span class="total-badge">{{ filteredBalances.length }} Items</span>
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
        <button class="btn-add" @click="openAddBalanceModal">➕ Add Balance</button>
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
        <option v-for="group in allGroups" :key="group.id" :value="group.id">
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
      <div class="filter-actions">
        <button class="btn-print" @click="printReport">🖨️ Print</button>
        <button class="btn-export" @click="openExportModal">📊 Export</button>
      </div>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalStores }}</div>
          <div class="stat-label">Total Stores</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-number">{{ lowStockItems }}</div>
          <div class="stat-label">Low Stock Items</div>
        </div>
      </div>
    </div>

    <!-- ==================== STORE BALANCE TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <table class="balance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Store</th>
            <th>Group</th>
            <th>Item</th>
            <th>UOM</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedBalances.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">💰</span>
                <p>No balance records found</p>
                <button class="btn-secondary" @click="openAddBalanceModal">Add First Balance</button>
              </div>
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedBalances" :key="item.id">
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="store-name">{{ getStoreName(item.storeId) }}</td>
            <td>
              <span class="group-tag">{{ getGroupName(item.groupId) }}</span>
            </td>
            <td>
              <div class="item-name-wrapper">
                <div class="item-code">{{ getItemCode(item.itemId) }}</div>
                <div class="standard-name">{{ getItemName(item.itemId) }}</div>
                <div class="common-name">{{ getItemCommonName(item.itemId) }}</div>
              </div>
            </td>
            <td>
              <div class="uom-wrapper">
                <div class="uom-code">{{ getItemUnit(item.itemId) }}</div>
                <div class="conversion-info" v-if="getConversionValue(item.itemId) > 1">
                  {{ getConversionValue(item.itemId) }} {{ getBaseUOM(item.itemId) }} = 1 {{ getItemUnit(item.itemId) }}
                </div>
                <div class="conversion-info base" v-else>1 {{ getItemUnit(item.itemId) }} = 1 {{ getItemUnit(item.itemId) }}</div>
              </div>
            </td>
            <td>
              <div class="balance-wrapper">
                <div class="balance-value" :class="getBalanceClass(item)">
                  {{ formatNumber(item.balance) }}
                </div>
                <div class="base-balance">
                  = {{ formatNumber(getBaseBalance(item)) }} {{ getBaseUOM(item.itemId) }}
                </div>
              </div>
            </td>
            <td>
              <span :class="['status-badge', item.status.toLowerCase()]">
                {{ item.status }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="icon-btn" @click="editBalance(item)" title="Edit">✏️</button>
                <button class="icon-btn" @click="openStockModal(item)" title="Stock">📦</button>
                <button class="icon-btn" @click="toggleStatus(item)" :title="item.status === 'Active' ? 'Deactivate' : 'Activate'">
                  {{ item.status === 'Active' ? '⏸️' : '▶️' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="filteredBalances.length > 0">
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

    <!-- ==================== ADD/EDIT BALANCE MODAL ==================== -->
    <div v-if="showBalanceModal" class="modal-overlay" @click.self="closeBalanceModal">
      <div class="modal-container balance-modal">
        <div class="modal-header">
          <h3>{{ editingBalance ? '✏️ Edit Balance' : '➕ Add Balance' }}</h3>
          <button class="modal-close" @click="closeBalanceModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveBalance" class="balance-form">
            <div class="form-row">
              <div class="form-group">
                <label>Store *</label>
                <select v-model="form.storeId" required>
                  <option value="">Select Store</option>
                  <option v-for="store in stores" :key="store.id" :value="store.id">
                    {{ store.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Group *</label>
                <select v-model="form.groupId" required>
                  <option value="">Select Group</option>
                  <option v-for="group in allGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Item *</label>
                <select v-model="form.itemId" required @change="onItemChange">
                  <option value="">Select Item</option>
                  <option v-for="item in inventoryItems" :key="item.id" :value="item.id">
                    {{ item.code }} - {{ item.standardName }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Balance ({{ getItemUnit(form.itemId) }}) *</label>
                <input v-model.number="form.balance" type="number" required placeholder="0" min="0" step="1" @input="onBalanceChange" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div class="form-group">
                <label>Minimum Stock Alert</label>
                <input v-model.number="form.minStock" type="number" placeholder="Min stock level" min="0" step="1" />
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeBalanceModal">Cancel</button>
          <button class="btn-primary" @click="saveBalance">
            {{ editingBalance ? 'Update' : 'Add' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== STOCK IN/OUT MODAL (TABS) ==================== -->
    <div v-if="showStockModal" class="modal-overlay" @click.self="closeStockModal">
      <div class="modal-container stock-modal">
        <div class="modal-header">
          <h3>📦 Stock Movement</h3>
          <button class="modal-close" @click="closeStockModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Tabs -->
          <div class="stock-tabs">
            <button class="stock-tab" :class="{ active: stockTab === 'in' }" @click="stockTab = 'in'">📥 Stock In</button>
            <button class="stock-tab" :class="{ active: stockTab === 'out' }" @click="stockTab = 'out'">📤 Stock Out</button>
          </div>

          <form @submit.prevent="saveStock" class="stock-form">
            <!-- Item Info -->
            <div class="stock-item-info">
              <div><strong>{{ stockItem ? getItemCode(stockItem.itemId) : '' }}</strong> - {{ stockItem ? getItemName(stockItem.itemId) : '' }}</div>
              <div v-if="stockItem">
                Balance: <strong>{{ formatNumber(stockItem.balance) }}</strong> {{ getItemUnit(stockItem.itemId) }}
                <span class="base-info">({{ formatNumber(getBaseBalance(stockItem)) }} {{ getBaseUOM(stockItem.itemId) }})</span>
              </div>
            </div>

            <!-- Stock In Fields -->
            <div v-if="stockTab === 'in'">
              <div class="form-group">
                <label>Source Store *</label>
                <select v-model="stockForm.sourceStoreId" required>
                  <option value="">Select Source Store</option>
                  <option v-for="store in allStores" :key="store.id" :value="store.id">
                    {{ store.name }}
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group" v-if="stockForm.sourceStoreId === 'other'">
                <label>Other Store Name</label>
                <input v-model="stockForm.otherStore" type="text" placeholder="Enter store name" />
              </div>
              <div class="form-group">
                <label>Quantity ({{ stockItem ? getItemUnit(stockItem.itemId) : '' }}) *</label>
                <input v-model.number="stockForm.quantity" type="number" required placeholder="Enter quantity" min="1" step="1" @input="onStockQuantityChange" />
                <small class="hint-text" v-if="stockItem && stockForm.quantity > 0">
                  Adds {{ formatNumber(stockForm.quantity * getConversionValue(stockItem.itemId)) }} {{ getBaseUOM(stockItem.itemId) }}
                </small>
              </div>
              <div class="form-group">
                <label>Reference / Reason</label>
                <input v-model="stockForm.reason" type="text" placeholder="e.g., Purchase order #123" />
              </div>
            </div>

            <!-- Stock Out Fields -->
            <div v-if="stockTab === 'out'">
              <div class="form-group">
                <label>Destination Store *</label>
                <select v-model="stockForm.destinationStoreId" required>
                  <option value="">Select Destination Store</option>
                  <option v-for="store in allStores" :key="store.id" :value="store.id">
                    {{ store.name }}
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group" v-if="stockForm.destinationStoreId === 'other'">
                <label>Other Store Name</label>
                <input v-model="stockForm.otherStore" type="text" placeholder="Enter store name" />
              </div>
              <div class="form-group">
                <label>Quantity ({{ stockItem ? getItemUnit(stockItem.itemId) : '' }}) *</label>
                <input v-model.number="stockForm.quantity" type="number" required placeholder="Enter quantity" min="1" step="1" :max="stockItem?.balance || 0" @input="onStockQuantityChange" />
                <small class="hint-text">Max: {{ stockItem?.balance || 0 }}</small>
                <small class="hint-text" v-if="stockItem && stockForm.quantity > 0">
                  Removes {{ formatNumber(stockForm.quantity * getConversionValue(stockItem.itemId)) }} {{ getBaseUOM(stockItem.itemId) }}
                </small>
              </div>
              <div class="form-group">
                <label>Reference / Reason</label>
                <input v-model="stockForm.reason" type="text" placeholder="e.g., Issued to department" />
              </div>
              <p v-if="stockForm.quantity > (stockItem?.balance || 0)" class="error-text">
                ⚠️ Cannot exceed current balance ({{ stockItem?.balance || 0 }})
              </p>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStockModal">Cancel</button>
          <button class="btn-primary" @click="saveStock" :disabled="stockTab === 'out' && (stockForm.quantity > (stockItem?.balance || 0) || stockForm.quantity <= 0)">
            {{ stockTab === 'in' ? 'Add Stock' : 'Remove Stock' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOGGLE STATUS CONFIRMATION ==================== -->
    <div v-if="showToggleModal" class="modal-overlay" @click.self="closeToggleModal">
      <div class="modal-container toggle-modal">
        <div class="modal-header">
          <h3>{{ toggleItem?.status === 'Active' ? '⏸️' : '▶️' }} Confirm Status Change</h3>
          <button class="modal-close" @click="closeToggleModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="toggle-icon">🔄</div>
          <p><strong>Item:</strong> {{ toggleItem ? getItemName(toggleItem.itemId) : '' }}</p>
          <p><strong>Current Status:</strong> 
            <span :class="['status-badge', toggleItem?.status.toLowerCase()]">
              {{ toggleItem?.status }}
            </span>
          </p>
          <p><strong>New Status:</strong> 
            <span :class="['status-badge', toggleNewStatus?.toLowerCase()]">
              {{ toggleNewStatus }}
            </span>
          </p>
          <p class="warning-text">⚠️ Are you sure you want to change the status?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeToggleModal">Cancel</button>
          <button class="btn-primary" @click="confirmToggle">Confirm</button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Balance Data</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Balance Report
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
import { ref, computed } from 'vue'

// ================================================================
// STORE DATA
// ================================================================
const stores = [
  { id: 1, name: 'Main Store', code: 'STORE-001' },
  { id: 2, name: 'Fiber Mini Store', code: 'STORE-002' },
  { id: 3, name: 'Paint Mini Store', code: 'STORE-003' },
  { id: 4, name: 'Fiber Mini Mini Store', code: 'STORE-004' },
  { id: 5, name: 'Paint Mini Mini Store', code: 'STORE-005' },
  { id: 6, name: 'Metal Store', code: 'STORE-006' },
  { id: 7, name: 'Technic Store', code: 'STORE-007' },
  { id: 8, name: 'Calcium Store', code: 'STORE-008' },
  { id: 9, name: 'Finishing Store', code: 'STORE-009' },
]

// ================================================================
// GROUPS DATA
// ================================================================
const allGroups = [
  { id: 1, name: 'Storekeeper' },
  { id: 2, name: 'IT' },
  { id: 3, name: 'Auditor' },
  { id: 4, name: 'Supplier' },
  { id: 5, name: 'Quality Control' },
  { id: 6, name: 'Warehouse' },
  { id: 7, name: 'Logistics' },
]

// ================================================================
// INVENTORY ITEMS (Master List with Conversion)
// ================================================================
const inventoryItems = [
  { id: 1, code: 'ITEM-001', standardName: 'Cement 50kg', commonName: 'Cement', unit: 'bags', baseUom: 'KG', conversionValue: 50 },
  { id: 2, code: 'ITEM-002', standardName: 'Steel Rod 12mm', commonName: 'Steel Rod', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 3, code: 'ITEM-003', standardName: 'Laptop Dell Latitude', commonName: 'Laptop', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 4, code: 'ITEM-004', standardName: 'Printer HP LaserJet', commonName: 'Printer', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 5, code: 'ITEM-005', standardName: 'Audit File Folders', commonName: 'Audit Files', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 6, code: 'ITEM-006', standardName: 'Fiber Sheets 4x8', commonName: 'Fiber Sheets', unit: 'm²', baseUom: 'm²', conversionValue: 1 },
  { id: 7, code: 'ITEM-007', standardName: 'Adhesive Glue 5L', commonName: 'Adhesive', unit: 'ltr', baseUom: 'L', conversionValue: 1 },
  { id: 8, code: 'ITEM-008', standardName: 'Monitor 24 Inch', commonName: 'Monitor', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 9, code: 'ITEM-009', standardName: 'Paint White 20L', commonName: 'White Paint', unit: 'ltr', baseUom: 'L', conversionValue: 1 },
  { id: 10, code: 'ITEM-010', standardName: 'Paint Red 20L', commonName: 'Red Paint', unit: 'ltr', baseUom: 'L', conversionValue: 1 },
  { id: 11, code: 'ITEM-011', standardName: 'Paint Blue 20L', commonName: 'Blue Paint', unit: 'ltr', baseUom: 'L', conversionValue: 1 },
  { id: 12, code: 'ITEM-012', standardName: 'Fiber Glass Mat', commonName: 'Fiber Glass', unit: 'kg', baseUom: 'KG', conversionValue: 1 },
  { id: 13, code: 'ITEM-013', standardName: 'Quality Control Reports', commonName: 'QC Reports', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 14, code: 'ITEM-014', standardName: 'Metal Sheets 2mm', commonName: 'Metal Sheets', unit: 'm²', baseUom: 'm²', conversionValue: 1 },
  { id: 15, code: 'ITEM-015', standardName: 'Screws M6x30', commonName: 'Screws', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 16, code: 'ITEM-016', standardName: 'Network Switch 24 Port', commonName: 'Network Switch', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 17, code: 'ITEM-017', standardName: 'Technic Parts Kit', commonName: 'Technic Parts', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
  { id: 18, code: 'ITEM-018', standardName: 'Tools Set 50pcs', commonName: 'Tools Set', unit: 'sets', baseUom: 'Each', conversionValue: 1 },
  { id: 19, code: 'ITEM-019', standardName: 'Calcium Powder 25kg', commonName: 'Calcium Powder', unit: 'kg', baseUom: 'KG', conversionValue: 1 },
  { id: 20, code: 'ITEM-020', standardName: 'Finishing Materials Set', commonName: 'Finishing Materials', unit: 'kg', baseUom: 'KG', conversionValue: 1 },
  { id: 21, code: 'ITEM-021', standardName: 'Quality Check Tools Kit', commonName: 'QC Tools', unit: 'pcs', baseUom: 'Each', conversionValue: 1 },
]

// ================================================================
// BALANCE DATA
// ================================================================
const balances = ref([
  { id: 1, storeId: 1, groupId: 1, itemId: 1, balance: 150, minStock: 50, status: 'Active' },
  { id: 2, storeId: 1, groupId: 1, itemId: 2, balance: 80, minStock: 30, status: 'Active' },
  { id: 3, storeId: 1, groupId: 2, itemId: 3, balance: 5, minStock: 2, status: 'Active' },
  { id: 4, storeId: 1, groupId: 2, itemId: 4, balance: 3, minStock: 1, status: 'Active' },
  { id: 5, storeId: 1, groupId: 3, itemId: 5, balance: 200, minStock: 100, status: 'Active' },
  { id: 6, storeId: 2, groupId: 1, itemId: 6, balance: 300, minStock: 100, status: 'Active' },
  { id: 7, storeId: 2, groupId: 1, itemId: 7, balance: 45, minStock: 20, status: 'Active' },
  { id: 8, storeId: 2, groupId: 2, itemId: 8, balance: 2, minStock: 1, status: 'Active' },
  { id: 9, storeId: 3, groupId: 1, itemId: 9, balance: 200, minStock: 50, status: 'Active' },
  { id: 10, storeId: 3, groupId: 1, itemId: 10, balance: 80, minStock: 30, status: 'Active' },
  { id: 11, storeId: 3, groupId: 1, itemId: 11, balance: 0, minStock: 20, status: 'Active' },
  { id: 12, storeId: 4, groupId: 1, itemId: 12, balance: 150, minStock: 40, status: 'Active' },
  { id: 13, storeId: 4, groupId: 3, itemId: 13, balance: 50, minStock: 20, status: 'Active' },
  { id: 14, storeId: 6, groupId: 1, itemId: 14, balance: 120, minStock: 40, status: 'Active' },
  { id: 15, storeId: 6, groupId: 1, itemId: 15, balance: 500, minStock: 100, status: 'Active' },
  { id: 16, storeId: 6, groupId: 2, itemId: 16, balance: 4, minStock: 2, status: 'Active' },
  { id: 17, storeId: 7, groupId: 1, itemId: 17, balance: 200, minStock: 50, status: 'Active' },
  { id: 18, storeId: 7, groupId: 1, itemId: 18, balance: 15, minStock: 5, status: 'Active' },
  { id: 19, storeId: 8, groupId: 1, itemId: 19, balance: 100, minStock: 30, status: 'Active' },
  { id: 20, storeId: 9, groupId: 1, itemId: 20, balance: 75, minStock: 25, status: 'Active' },
  { id: 21, storeId: 9, groupId: 3, itemId: 21, balance: 8, minStock: 3, status: 'Active' },
])

// ================================================================
// STATE
// ================================================================
const searchQuery = ref('')
const filterStore = ref('')
const filterGroup = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const showBalanceModal = ref(false)
const editingBalance = ref(null)
const showStockModal = ref(false)
const stockItem = ref(null)
const stockTab = ref('in')
const showToggleModal = ref(false)
const toggleItem = ref(null)
const toggleNewStatus = ref('')
const exporting = ref(false)
const exportType = ref('full')
const showExportModal = ref(false)

const form = ref({
  storeId: '',
  groupId: '',
  itemId: '',
  balance: 0,
  status: 'Active',
  minStock: 0,
})

const stockForm = ref({
  sourceStoreId: '',
  destinationStoreId: '',
  quantity: 0,
  reason: '',
  otherStore: '',
})

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() => {
  return filterStore.value || filterGroup.value || filterStatus.value || searchQuery.value
})

const allStores = computed(() => {
  if (!stockItem.value) return stores
  return stores.filter(s => s.id !== stockItem.value.storeId)
})

const filteredBalances = computed(() => {
  let result = balances.value
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    result = result.filter(item => {
      const itemName = getItemName(item.itemId).toLowerCase()
      const itemCode = getItemCode(item.itemId).toLowerCase()
      const storeName = getStoreName(item.storeId).toLowerCase()
      return itemName.includes(s) || itemCode.includes(s) || storeName.includes(s)
    })
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

const paginatedBalances = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredBalances.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredBalances.value.length / pageSize.value) || 1
})

const totalStores = computed(() => {
  const uniqueStores = new Set(balances.value.map(item => item.storeId))
  return uniqueStores.size
})

const totalItems = computed(() => {
  return balances.value.length
})

const lowStockItems = computed(() => {
  return balances.value.filter(item => 
    item.balance <= item.minStock && item.balance > 0
  ).length
})

// ================================================================
// HELPER METHODS
// ================================================================
const getItemName = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId)
  return item ? item.standardName : 'Unknown'
}

const getItemCode = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId)
  return item ? item.code : 'Unknown'
}

const getItemCommonName = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId)
  return item ? item.commonName : 'Unknown'
}

const getItemUnit = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId)
  return item ? item.unit : ''
}

const getBaseUOM = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId)
  return item ? item.baseUom || item.unit : ''
}

const getConversionValue = (itemId) => {
  const item = inventoryItems.find(i => i.id === itemId)
  return item ? item.conversionValue || 1 : 1
}

const getConversionDisplay = (itemId) => {
  if (!itemId) return ''
  const val = getConversionValue(itemId)
  const base = getBaseUOM(itemId)
  const unit = getItemUnit(itemId)
  if (val > 1) {
    return `${val} ${base} = 1 ${unit}`
  }
  return `1 ${unit} = 1 ${unit}`
}

const getBaseBalance = (item) => {
  const conversionValue = getConversionValue(item.itemId)
  return item.balance * conversionValue
}

const getBaseBalanceForm = (itemId, balance) => {
  if (!itemId || !balance) return 0
  const conversionValue = getConversionValue(itemId)
  return balance * conversionValue
}

const getStoreName = (storeId) => {
  const store = stores.find(s => s.id === storeId)
  return store ? store.name : 'Unknown'
}

const getGroupName = (groupId) => {
  const group = allGroups.find(g => g.id === groupId)
  return group ? group.name : 'Unknown'
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

const getBalanceClass = (item) => {
  if (item.balance === 0) return 'zero'
  if (item.balance <= item.minStock) return 'low'
  return 'normal'
}

// ================================================================
// UI HELPERS
// ================================================================
const onItemChange = () => {}
const onBalanceChange = () => {}
const onStockQuantityChange = () => {}

// ================================================================
// BALANCE CRUD
// ================================================================
const openAddBalanceModal = () => {
  editingBalance.value = null
  form.value = {
    storeId: '',
    groupId: '',
    itemId: '',
    balance: 0,
    status: 'Active',
    minStock: 0,
  }
  showBalanceModal.value = true
}

const editBalance = (item) => {
  editingBalance.value = item
  form.value = {
    storeId: item.storeId,
    groupId: item.groupId,
    itemId: item.itemId,
    balance: item.balance,
    status: item.status || 'Active',
    minStock: item.minStock || 0,
  }
  showBalanceModal.value = true
}

const closeBalanceModal = () => {
  showBalanceModal.value = false
  editingBalance.value = null
}

const saveBalance = () => {
  if (!form.value.storeId) {
    showToastMessage('Please select a store', 'error')
    return
  }
  if (!form.value.groupId) {
    showToastMessage('Please select a group', 'error')
    return
  }
  if (!form.value.itemId) {
    showToastMessage('Please select an item', 'error')
    return
  }
  if (form.value.balance < 0) {
    showToastMessage('Balance cannot be negative', 'error')
    return
  }

  const exists = balances.value.some(b => 
    b.storeId === Number(form.value.storeId) &&
    b.groupId === Number(form.value.groupId) &&
    b.itemId === Number(form.value.itemId) &&
    b.id !== (editingBalance.value?.id || -1)
  )
  
  if (exists) {
    showToastMessage('This item already has a balance in this store and group', 'error')
    return
  }

  if (editingBalance.value) {
    const index = balances.value.findIndex(b => b.id === editingBalance.value.id)
    if (index !== -1) {
      balances.value[index] = {
        ...balances.value[index],
        storeId: Number(form.value.storeId),
        groupId: Number(form.value.groupId),
        itemId: Number(form.value.itemId),
        balance: Number(form.value.balance),
        status: form.value.status,
        minStock: Number(form.value.minStock),
      }
    }
    showToastMessage('Balance updated successfully!', 'success')
  } else {
    balances.value.push({
      id: balances.value.length + 1,
      storeId: Number(form.value.storeId),
      groupId: Number(form.value.groupId),
      itemId: Number(form.value.itemId),
      balance: Number(form.value.balance),
      status: form.value.status,
      minStock: Number(form.value.minStock),
    })
    showToastMessage('Balance added successfully!', 'success')
  }
  closeBalanceModal()
}

// ================================================================
// STOCK IN/OUT
// ================================================================
const openStockModal = (item) => {
  stockItem.value = item
  stockTab.value = 'in'
  stockForm.value = { sourceStoreId: '', destinationStoreId: '', quantity: 0, reason: '', otherStore: '' }
  showStockModal.value = true
}

const closeStockModal = () => {
  showStockModal.value = false
  stockItem.value = null
}

const saveStock = () => {
  if (stockTab.value === 'in') {
    if (!stockForm.value.sourceStoreId) {
      showToastMessage('Please select source store', 'error')
      return
    }
    if (!stockForm.value.quantity || stockForm.value.quantity <= 0) {
      showToastMessage('Please enter a valid quantity', 'error')
      return
    }
    
    const index = balances.value.findIndex(b => b.id === stockItem.value.id)
    if (index !== -1) {
      balances.value[index].balance += Number(stockForm.value.quantity)
      const source = stockForm.value.sourceStoreId === 'other' 
        ? stockForm.value.otherStore || 'Other' 
        : getStoreName(Number(stockForm.value.sourceStoreId))
      const baseQty = Number(stockForm.value.quantity) * getConversionValue(stockItem.value.itemId)
      showToastMessage(`Stock In: ${stockForm.value.quantity} ${getItemUnit(stockItem.value.itemId)} (${baseQty} ${getBaseUOM(stockItem.value.itemId)}) from ${source}`, 'success')
    }
  } else {
    if (!stockForm.value.destinationStoreId) {
      showToastMessage('Please select destination store', 'error')
      return
    }
    if (!stockForm.value.quantity || stockForm.value.quantity <= 0) {
      showToastMessage('Please enter a valid quantity', 'error')
      return
    }
    if (stockForm.value.quantity > stockItem.value.balance) {
      showToastMessage(`Insufficient stock! Available: ${stockItem.value.balance}`, 'error')
      return
    }
    
    const index = balances.value.findIndex(b => b.id === stockItem.value.id)
    if (index !== -1) {
      balances.value[index].balance -= Number(stockForm.value.quantity)
      const dest = stockForm.value.destinationStoreId === 'other' 
        ? stockForm.value.otherStore || 'Other' 
        : getStoreName(Number(stockForm.value.destinationStoreId))
      const baseQty = Number(stockForm.value.quantity) * getConversionValue(stockItem.value.itemId)
      showToastMessage(`Stock Out: ${stockForm.value.quantity} ${getItemUnit(stockItem.value.itemId)} (${baseQty} ${getBaseUOM(stockItem.value.itemId)}) to ${dest}`, 'success')
    }
  }
  closeStockModal()
}

// ================================================================
// TOGGLE STATUS
// ================================================================
const toggleStatus = (item) => {
  toggleItem.value = item
  toggleNewStatus.value = item.status === 'Active' ? 'Inactive' : 'Active'
  showToggleModal.value = true
}

const closeToggleModal = () => {
  showToggleModal.value = false
  toggleItem.value = null
  toggleNewStatus.value = ''
}

const confirmToggle = () => {
  if (toggleItem.value) {
    const index = balances.value.findIndex(b => b.id === toggleItem.value.id)
    if (index !== -1) {
      balances.value[index].status = toggleNewStatus.value
      showToastMessage(`Status changed to ${toggleNewStatus.value}`, 'success')
    }
    closeToggleModal()
  }
}

// ================================================================
// FILTERS & PAGINATION
// ================================================================
const onSearchChange = () => { currentPage.value = 1 }
const onFilterChange = () => { currentPage.value = 1 }

const clearFilters = () => {
  filterStore.value = ''
  filterGroup.value = ''
  filterStatus.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
}

const changePage = (page) => { currentPage.value = page }
const changePageSize = () => { currentPage.value = 1 }

// ================================================================
// PRINT & EXPORT
// ================================================================
const printReport = () => {
  const printContents = document.getElementById('printable-area').innerHTML
  const originalContents = document.body.innerHTML
  
  document.body.innerHTML = `
    <html>
      <head>
        <title>Store Balance Report</title>
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
        <h2>💰 Store Balance Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
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

const exportSelectedReport = () => {
  exporting.value = true
  setTimeout(() => {
    let headers = [], rows = []
    const data = filteredBalances.value
    
    if (exportType.value === 'full') {
      headers = ['#', 'Store', 'Group', 'Item Code', 'Item Name', 'UOM', 'Conversion', 'Balance', 'Base Balance', 'Status']
      rows = data.map((item, index) => [
        index + 1,
        getStoreName(item.storeId),
        getGroupName(item.groupId),
        getItemCode(item.itemId),
        getItemName(item.itemId),
        getItemUnit(item.itemId),
        getConversionDisplay(item.itemId),
        item.balance,
        getBaseBalance(item),
        item.status
      ])
    } else {
      const storeSummary = {}
      data.forEach(item => {
        const key = item.storeId
        if (!storeSummary[key]) {
          storeSummary[key] = {
            storeName: getStoreName(item.storeId),
            totalItems: 0,
            totalBalance: 0,
            totalBaseBalance: 0
          }
        }
        storeSummary[key].totalItems++
        storeSummary[key].totalBalance += item.balance
        storeSummary[key].totalBaseBalance += getBaseBalance(item)
      })
      headers = ['Store Name', 'Total Items', 'Total Balance', 'Total Base Balance']
      rows = Object.values(storeSummary).map(summary => [
        summary.storeName,
        summary.totalItems,
        summary.totalBalance,
        summary.totalBaseBalance
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
    a.download = `store_balance_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    exporting.value = false
    closeExportModal()
    showToastMessage('Export completed successfully!', 'success')
  }, 500)
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

.btn-add {
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

.btn-add:hover {
  background: #2563eb;
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

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-print {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-print:hover {
  background: #7c3aed;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #059669;
}

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
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

/* ================================================================
   TABLE - Compact with no horizontal scroll
   ================================================================ */
.table-container {
  overflow-x: hidden;
}

.balance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.balance-table th,
.balance-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.balance-table th {
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

.store-name {
  font-weight: 500;
  font-size: 12px;
}

.item-name-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
}

.standard-name {
  font-size: 12px;
  color: #1e293b;
}

.common-name {
  font-size: 10px;
  color: #94a3b8;
}

.group-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.uom-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.uom-code {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.conversion-info {
  font-size: 9px;
  color: #64748b;
}

.conversion-info.base {
  color: #94a3b8;
  font-style: italic;
}

.balance-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.balance-value {
  font-weight: 600;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 3px;
}

.balance-value.normal {
  color: #166534;
}

.balance-value.low {
  color: #f59e0b;
}

.balance-value.zero {
  color: #ef4444;
}

.base-balance {
  font-size: 10px;
  color: #94a3b8;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
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
   ACTION BUTTONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 2px;
  flex-wrap: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 3px 5px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.icon-btn:hover {
  background: #f1f5f9;
}

/* ================================================================
   BUTTONS
   ================================================================ */
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

.readonly-field {
  background: #f1f5f9 !important;
  color: #64748b !important;
  cursor: not-allowed;
}

/* ================================================================
   PAGINATION
   ================================================================ */
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
  padding: 20px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.stock-modal .modal-container {
  max-width: 420px;
}

.toggle-modal .modal-container {
  max-width: 380px;
}

.export-modal .modal-container {
  max-width: 380px;
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

/* ================================================================
   FORMS
   ================================================================ */
.balance-form .form-row,
.stock-form .form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.balance-form .form-group,
.stock-form .form-group {
  flex: 1;
  min-width: 120px;
}

.balance-form .form-group label,
.stock-form .form-group label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.balance-form .form-group input,
.balance-form .form-group select,
.stock-form .form-group input,
.stock-form .form-group select {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
}

.balance-form .form-group input:focus,
.balance-form .form-group select:focus,
.stock-form .form-group input:focus,
.stock-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.balance-form .hint {
  display: block;
  font-size: 9px;
  color: #94a3b8;
  margin-top: 2px;
}

.stock-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 3px;
}

.stock-tab {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  background: transparent;
  color: #64748b;
  transition: all 0.2s;
}

.stock-tab.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stock-tab:hover:not(.active) {
  background: #e2e8f0;
}

.stock-item-info {
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px;
}

.base-info {
  color: #64748b;
  font-size: 11px;
}

.hint-text {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* ================================================================
   TOGGLE MODAL
   ================================================================ */
.toggle-icon {
  font-size: 32px;
  text-align: center;
  margin-bottom: 6px;
}

.warning-text {
  color: #f59e0b;
  font-weight: 500;
  margin-top: 10px;
  padding: 6px 10px;
  background: #fffbeb;
  border-radius: 4px;
  border: 1px solid #fef3c7;
  font-size: 13px;
}

/* ================================================================
   EXPORT MODAL
   ================================================================ */
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

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 30px !important;
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

/* ================================================================
   TOAST
   ================================================================ */
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
  white-space: nowrap;
  max-width: 90vw;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
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
  .btn-add, .btn-print, .btn-export, .search-box, .filter-bar, .pagination, .action-buttons, .icon-btn {
    display: none !important;
  }
  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }
  .balance-table th, .balance-table td {
    border: 1px solid #ddd !important;
  }
  .stats-grid {
    display: none !important;
  }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .card-header { flex-wrap: wrap; }
  .header-actions { width: 100%; flex-wrap: wrap; }
  .search-box input { width: 100%; }
  .filter-bar { flex-direction: column; }
  .filter-bar select { width: 100%; }
  .filter-actions { width: 100%; margin-left: 0; justify-content: flex-start; }
  .stats-grid { grid-template-columns: 1fr; }
  .pagination { flex-wrap: wrap; }
  .balance-form .form-row, .stock-form .form-row { flex-direction: column; }
  .modal-container { margin: 10px; max-width: 100% !important; }
  .stock-item-info { flex-direction: column; gap: 4px; }
}
</style>