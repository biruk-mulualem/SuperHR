<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>⚖️ Converted Balance</h2>
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
        <button class="btn-convert" @click="openConvertModal">
          🔄 Convert
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
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.convertibleItems }}</div>
          <div class="stat-label">Available to Convert</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.zeroStock }}</div>
          <div class="stat-label">Zero Stock</div>
        </div>
      </div>
    </div>

    <!-- ==================== CONVERTED BALANCE TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading converted balances...</p>
      </div>
      <table v-else class="balance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>UOM</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="text-center">
              <div class="loading-spinner">Loading...</div>
            </td>
          </tr>
          <tr v-else-if="paginatedItems.length === 0">
            <td colspan="6" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">⚖️</span>
                <p>No converted balances found</p>
              </div>
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedItems" :key="item.id">
            <td class="text-center">
              {{ (currentPage - 1) * pageSize + index + 1 }}
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
              <div class="balance-wrapper">
                <div
                  class="balance-value"
                  :class="getBalanceClass(item.balance)"
                >
                  {{ formatNumber(item.balance) }}
                </div>
              </div>
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

    <!-- ==================== CONVERT MODAL ==================== -->
    <div
      v-if="showConvertModal"
      class="modal-overlay"
      @click.self="closeConvertModal"
    >
      <div class="modal-container convert-modal">
        <div class="modal-header">
          <h3>🔄 Convert</h3>
          <button class="modal-close" @click="closeConvertModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="convert-info">
            Select items and enter quantity to convert from their current UOM to the base UOM.
            Once converted, the balance will be added to the existing item in the table.
          </p>

          <!-- Search Bar -->
          <div class="convert-search">
            <div class="search-box-small">
              <span class="search-icon-small">🔍</span>
              <input
                type="text"
                v-model="convertSearchQuery"
                placeholder="Search items..."
                @input="refreshConvertableItems"
              />
            </div>
          </div>

          <div class="convert-filters">
            <select v-model="convertFilterCategory" class="filter-select" @change="refreshConvertableItems">
              <option value="">All Categories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <select v-model="convertFilterUom" class="filter-select" @change="refreshConvertableItems">
              <option value="">All UOM</option>
              <option value="Drum">Drum</option>
              <option value="Bag">Bag</option>
              <option value="Roll">Roll</option>
              <option value="Packet">Packet</option>
            </select>
          </div>

          <div class="convert-item-list">
            <div
              v-for="item in filteredConvertableItems"
              :key="item.id"
              class="convert-item"
            >
              <div class="convert-item-info">
                <input
                  type="checkbox"
                  :checked="item.selected"
                  @change="toggleItemSelection(item, $event)"
                  :disabled="item.balance <= 0"
                />
                <span class="convert-item-code">{{ item.itemCode }}</span>
                <span class="convert-item-name">{{ item.itemName }}</span>
                <span class="convert-item-uom">{{ item.uomCode }}</span>
                <span class="convert-item-balance">{{ formatNumber(item.balance) }}</span>
                <span class="convert-item-target">→ {{ item.convertToUom }}</span>
                <span class="convert-item-rate">(1 {{ item.uomCode }} = {{ item.conversionRate }} {{ item.convertToUom }})</span>
              </div>
              <div class="convert-item-input" v-if="item.selected">
                <label>Quantity to convert:</label>
                <input
                  type="number"
                  v-model.number="item.convertQty"
                  :max="item.balance"
                  min="1"
                  step="1"
                  class="convert-qty-input"
                  @focus="selectAllText($event)"
                  @input="validateQty(item)"
                />
                <span class="convert-result" v-if="item.convertQty > 0 && item.convertQty <= item.balance">
                  → {{ formatNumber(item.convertQty * item.conversionRate) }} {{ item.convertToUom }}
                </span>
                <span class="convert-error" v-if="item.convertQty > item.balance">
                  ⚠️ Exceeds max ({{ formatNumber(item.balance) }})
                </span>
                <span class="convert-max">(Max: {{ formatNumber(item.balance) }})</span>
              </div>
            </div>
            <div v-if="filteredConvertableItems.length === 0" class="no-convert-items">
              No items available for conversion. All items are already converted or have zero balance.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeConvertModal">Cancel</button>
          <button
            class="btn-primary"
            @click="openConfirmationModal"
            :disabled="!hasSelectedItems || converting"
          >
            {{ converting ? 'Processing...' : `Convert ${selectedCount} Item(s)` }}
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
        <div class="modal-header">
          <h3>⚠️ Confirm Conversion</h3>
          <button class="modal-close" @click="closeConfirmationModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">🔄</div>
          <p class="confirmation-text">
            Are you sure you want to convert the following items?
          </p>
          <div class="confirmation-list">
            <div
              v-for="item in selectedItemsForConfirmation"
              :key="item.id"
              class="confirmation-item"
            >
              <span class="conf-item-code">{{ item.itemCode }}</span>
              <span class="conf-item-name">{{ item.itemName }}</span>
              <span class="conf-item-detail">
                {{ item.convertQty }} {{ item.uomCode }} → 
                {{ formatNumber(item.convertQty * item.conversionRate) }} {{ item.convertToUom }}
              </span>
            </div>
          </div>
          <p class="confirmation-warning">
            ⚠️ This action cannot be undone. The source balance will be reduced.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeConfirmationModal">Cancel</button>
          <button
            class="btn-danger"
            @click="confirmConversion"
            :disabled="converting"
          >
            {{ converting ? 'Processing...' : 'Yes, Convert' }}
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
          <h3>📊 Generate Converted Balance Report</h3>
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
const exporting = ref(false)
const converting = ref(false)
const exportType = ref('full')
const showExportModal = ref(false)
const showConvertModal = ref(false)
const showConfirmationModal = ref(false)
const searchQuery = ref('')
const filterCategory = ref('')
const filterUom = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Convert modal filters
const convertFilterCategory = ref('')
const convertFilterUom = ref('')
const convertSearchQuery = ref('')
const convertableItems = ref([])
const selectedItemsForConfirmation = ref([])

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
// DEMO DATA - CONVERTED BALANCE ITEMS
// ================================================================
const convertedItems = ref([
  // Raw Materials - kg (already converted)
  {
    id: 1,
    itemCode: 'SDT000001',
    itemName: 'Cement',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    balance: 25000,
    isConverted: true,
    status: 'Converted'
  },
  {
    id: 2,
    itemCode: 'SDT000002',
    itemName: 'Sand',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    balance: 45000,
    isConverted: true,
    status: 'Converted'
  },
  {
    id: 3,
    itemCode: 'SDT000003',
    itemName: 'Gravel',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    balance: 120000,
    isConverted: true,
    status: 'Converted'
  },

  // Drum items - NOT converted yet
  {
    id: 4,
    itemCode: 'SDT000004',
    itemName: 'Homopolymer Glue',
    categoryName: 'Chemicals',
    uomCode: 'Drum',
    balance: 12,
    convertToUom: 'kg',
    conversionRate: 200,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },
  {
    id: 5,
    itemCode: 'SDT000005',
    itemName: 'Epoxy Resin',
    categoryName: 'Chemicals',
    uomCode: 'Drum',
    balance: 42,
    convertToUom: 'kg',
    conversionRate: 200,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },
  {
    id: 6,
    itemCode: 'SDT000006',
    itemName: 'Hardener',
    categoryName: 'Chemicals',
    uomCode: 'Drum',
    balance: 6,
    convertToUom: 'kg',
    conversionRate: 200,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },
  {
    id: 7,
    itemCode: 'SDT000007',
    itemName: 'Solvent',
    categoryName: 'Chemicals',
    uomCode: 'Drum',
    balance: 17,
    convertToUom: 'kg',
    conversionRate: 200,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },

  // Bag items - NOT converted yet
  {
    id: 8,
    itemCode: 'SDT000008',
    itemName: 'Cement Bag',
    categoryName: 'Raw Materials',
    uomCode: 'Bag',
    balance: 500,
    convertToUom: 'kg',
    conversionRate: 50,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },
  {
    id: 9,
    itemCode: 'SDT000009',
    itemName: 'Lime Powder',
    categoryName: 'Raw Materials',
    uomCode: 'Bag',
    balance: 300,
    convertToUom: 'kg',
    conversionRate: 50,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },

  // Roll items - NOT converted yet
  {
    id: 10,
    itemCode: 'SDT000010',
    itemName: 'Fiberglass Roll',
    categoryName: 'Packaging',
    uomCode: 'Roll',
    balance: 25,
    convertToUom: 'm',
    conversionRate: 50,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },
  {
    id: 11,
    itemCode: 'SDT000011',
    itemName: 'Pallet Wrap Roll',
    categoryName: 'Packaging',
    uomCode: 'Roll',
    balance: 40,
    convertToUom: 'm',
    conversionRate: 100,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },

  // Packet items - NOT converted yet
  {
    id: 12,
    itemCode: 'SDT000012',
    itemName: 'Plastic Bags',
    categoryName: 'Packaging',
    uomCode: 'Packet',
    balance: 150,
    convertToUom: 'pcs',
    conversionRate: 100,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },
  {
    id: 13,
    itemCode: 'SDT000013',
    itemName: 'Cardboard Boxes',
    categoryName: 'Packaging',
    uomCode: 'Packet',
    balance: 85,
    convertToUom: 'pcs',
    conversionRate: 50,
    canConvert: true,
    isConverted: false,
    status: 'Pending'
  },

  // Additives - kg (already converted)
  {
    id: 14,
    itemCode: 'SDT000014',
    itemName: 'Plasticizer',
    categoryName: 'Additives',
    uomCode: 'kg',
    balance: 450,
    isConverted: true,
    status: 'Converted'
  },
  {
    id: 15,
    itemCode: 'SDT000015',
    itemName: 'Accelerator',
    categoryName: 'Additives',
    uomCode: 'kg',
    balance: 280,
    isConverted: true,
    status: 'Converted'
  },
  {
    id: 16,
    itemCode: 'SDT000016',
    itemName: 'Fly Ash',
    categoryName: 'Raw Materials',
    uomCode: 'kg',
    balance: 0,
    isConverted: true,
    status: 'Converted'
  }
])

// ================================================================
// COMPUTED
// ================================================================

const displayItems = computed(() => {
  return convertedItems.value.filter(item => item.isConverted === true)
})

const hasActiveFilters = computed(() => {
  return filterCategory.value || filterUom.value || searchQuery.value
})

const filteredItems = computed(() => {
  let result = [...displayItems.value]

  if (filterCategory.value) {
    const category = categories.value.find(c => c.id === Number(filterCategory.value))
    result = result.filter(item => item.categoryName === category?.name)
  }

  if (filterUom.value) {
    result = result.filter(item => item.uomCode === filterUom.value)
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
  const total = filteredItems.value.length
  const convertible = convertedItems.value.filter(item => item.canConvert && item.balance > 0 && item.isConverted === false).length
  const zeroStock = filteredItems.value.filter(item => item.balance === 0).length

  return {
    totalItems: total,
    convertibleItems: convertible,
    zeroStock: zeroStock
  }
})

const filteredConvertableItems = computed(() => {
  let items = convertableItems.value

  if (convertSearchQuery.value) {
    const search = convertSearchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.itemCode.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search)
    )
  }

  return items
})

const hasSelectedItems = computed(() => {
  return convertableItems.value.some(item => item.selected && item.convertQty > 0 && item.convertQty <= item.balance)
})

const selectedCount = computed(() => {
  return convertableItems.value.filter(item => item.selected && item.convertQty > 0 && item.convertQty <= item.balance).length
})

// ================================================================
// METHODS
// ================================================================

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat().format(num)
}

const getBalanceClass = (balance) => {
  if (balance === 0) return 'zero'
  if (balance < 100) return 'low'
  if (balance < 500) return 'medium'
  return 'normal'
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

// ================================================================
// CONVERT MODAL
// ================================================================

const refreshConvertableItems = () => {
  let items = convertedItems.value.filter(item => item.canConvert && item.balance > 0 && item.isConverted === false)

  if (convertFilterCategory.value) {
    const category = categories.value.find(c => c.id === Number(convertFilterCategory.value))
    items = items.filter(item => item.categoryName === category?.name)
  }

  if (convertFilterUom.value) {
    items = items.filter(item => item.uomCode === convertFilterUom.value)
  }

  convertableItems.value = items.map(item => ({
    ...item,
    selected: false,
    convertQty: 1
  }))
}

const openConvertModal = () => {
  convertFilterCategory.value = ''
  convertFilterUom.value = ''
  convertSearchQuery.value = ''
  refreshConvertableItems()
  showConvertModal.value = true
}

const closeConvertModal = () => {
  showConvertModal.value = false
  convertableItems.value = []
  convertSearchQuery.value = ''
}

const toggleItemSelection = (item, event) => {
  const isChecked = event.target.checked
  item.selected = isChecked
  if (isChecked) {
    item.convertQty = 1
  } else {
    item.convertQty = 0
  }
  convertableItems.value = [...convertableItems.value]
}

const selectAllText = (event) => {
  event.target.select()
}

const validateQty = (item) => {
  if (item.convertQty > item.balance) {
    item.convertQty = item.balance
  }
  if (item.convertQty < 0) {
    item.convertQty = 0
  }
}

// ================================================================
// CONFIRMATION MODAL
// ================================================================

const openConfirmationModal = () => {
  const selectedItems = convertableItems.value.filter(item => item.selected && item.convertQty > 0 && item.convertQty <= item.balance)
  if (selectedItems.length === 0) {
    showToastMessage('No valid items selected for conversion', 'warning')
    return
  }
  selectedItemsForConfirmation.value = selectedItems
  showConfirmationModal.value = true
}

const closeConfirmationModal = () => {
  showConfirmationModal.value = false
  selectedItemsForConfirmation.value = []
}

const confirmConversion = async () => {
  const selectedItems = selectedItemsForConfirmation.value

  if (selectedItems.length === 0) {
    showToastMessage('No items selected for conversion', 'warning')
    return
  }

  converting.value = true

  try {
    let conversionLog = []

    for (const item of selectedItems) {
      const qtyToConvert = item.convertQty
      const convertedAmount = qtyToConvert * item.conversionRate

      // Find the source item
      const mainItem = convertedItems.value.find(i => i.id === item.id)
      if (mainItem) {
        // Reduce source balance
        mainItem.balance = mainItem.balance - qtyToConvert

        // If balance becomes 0, mark as no longer convertible
        if (mainItem.balance === 0) {
          mainItem.isConverted = false
        }

        // Check if the converted item already exists in the table
        const existingConvertedItem = convertedItems.value.find(
          i => i.itemCode === item.itemCode && 
               i.uomCode === item.convertToUom && 
               i.isConverted === true
        )

        if (existingConvertedItem) {
          // Add to existing converted item
          existingConvertedItem.balance = existingConvertedItem.balance + convertedAmount
          conversionLog.push(
            `${item.itemCode}: ${qtyToConvert} ${item.uomCode} → ${convertedAmount} ${item.convertToUom} (Added to existing balance)`
          )
        } else {
          // Create new converted item
          const newItem = {
            id: Date.now() + Math.random(),
            itemCode: item.itemCode,
            itemName: item.itemName,
            categoryName: item.categoryName,
            uomCode: item.convertToUom,
            balance: convertedAmount,
            isConverted: true,
            status: 'Converted'
          }
          convertedItems.value.push(newItem)
          conversionLog.push(
            `${item.itemCode}: ${qtyToConvert} ${item.uomCode} → ${convertedAmount} ${item.convertToUom} (New entry created)`
          )
        }
      }
    }

    // Close both modals
    closeConfirmationModal()
    closeConvertModal()
    
    showToastMessage(
      `✅ Converted ${selectedItems.length} item(s) successfully!\n${conversionLog.join('\n')}`,
      'success'
    )

  } catch (error) {
    console.error('Conversion error:', error)
    showToastMessage('Failed to process conversion', 'error')
  } finally {
    converting.value = false
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
    const data = filteredItems.value.map(item => ({
      'Item Code': item.itemCode,
      'Item Name': item.itemName,
      'Category': item.categoryName,
      'UOM': item.uomCode,
      'Balance': item.balance
    }))

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted_balance_${new Date().toISOString().split('T')[0]}.csv`
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

.btn-convert {
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

.btn-convert:hover {
  background: #7c3aed;
}

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

.btn-export:hover:not(:disabled) {
  background: #059669;
}
.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #ef4444;
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

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}
.btn-danger:disabled {
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

.balance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 500px;
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

.balance-value {
  font-weight: 600;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 3px;
}

.balance-value.normal {
  color: #166534;
}
.balance-value.medium {
  color: #d97706;
}
.balance-value.low {
  color: #f97316;
}
.balance-value.zero {
  color: #dc2626;
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

.convert-modal .modal-container {
  max-width: 750px;
}

.confirmation-modal .modal-container {
  max-width: 750px;
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
/* CONVERT MODAL */
/* ================================================================ */
.convert-info {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.convert-search {
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
  border-color: #8b5cf6;
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

.convert-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.convert-item-list {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.convert-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  gap: 6px;
}

.convert-item:last-child {
  border-bottom: none;
}

.convert-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.convert-item-info input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.convert-item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  min-width: 90px;
}

.convert-item-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  min-width: 120px;
}

.convert-item-uom {
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #475569;
}

.convert-item-balance {
  font-weight: 600;
  color: #1e293b;
}

.convert-item-target {
  background: #dbeafe;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #1e40af;
}

.convert-item-rate {
  font-size: 11px;
  color: #94a3b8;
}

.convert-item-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 28px;
  flex-wrap: wrap;
}

.convert-item-input label {
  font-size: 12px;
  color: #64748b;
}

.convert-qty-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
}

.convert-qty-input:focus {
  outline: none;
  border-color: #8b5cf6;
}

.convert-result {
  font-weight: 600;
  color: #8b5cf6;
  font-size: 13px;
}

.convert-error {
  font-weight: 600;
  color: #dc2626;
  font-size: 12px;
}

.convert-max {
  font-size: 11px;
  color: #94a3b8;
}

.no-convert-items {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
}

/* ================================================================ */
/* CONFIRMATION MODAL */
/* ================================================================ */
.confirmation-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.confirmation-text {
  text-align: center;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 16px;
}

.confirmation-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
}

.confirmation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.confirmation-item:last-child {
  border-bottom: none;
}

.conf-item-code {
  font-weight: 600;
  color: #2563eb;
  min-width: 90px;
}

.conf-item-name {
  flex: 1;
  color: #1e293b;
}

.conf-item-detail {
  color: #8b5cf6;
  font-weight: 500;
}

.confirmation-warning {
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 13px;
  color: #991b1b;
  text-align: center;
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
  .balance-table {
    font-size: 12px;
    min-width: 500px;
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

  .convert-item-info {
    flex-wrap: wrap;
  }

  .convert-item-input {
    padding-left: 0;
  }

  .confirmation-item {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .balance-table {
    font-size: 11px;
    min-width: 400px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .convert-filters {
    flex-direction: column;
  }
}

/* ================================================================ */
/* PRINT STYLES */
/* ================================================================ */
@media print {
  .btn-convert,
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

  .balance-table th,
  .balance-table td {
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