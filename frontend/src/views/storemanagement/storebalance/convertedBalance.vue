<!-- views/storemanagement/convertedbalance/convertedbalance.vue -->
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
        <button class="btn-add" @click="openInitializeModal">
          📦 Initialize Balance
        </button>
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
      <!-- Store filter - only for admin -->
      <select
        v-if="isAdmin"
        v-model="filterStore"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Stores</option>
        <option
          v-for="store in availableStores"
          :key="store.id"
          :value="store.id"
        >
          🏪 {{ store.name }}
        </option>
      </select>

      <!-- Group filter - only for admin -->
      <select
        v-if="isAdmin"
        v-model="filterGroup"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Groups</option>
        <option
          v-for="group in availableGroups"
          :key="group.id"
          :value="group.id"
        >
          👥 {{ group.name }}
        </option>
      </select>

      <select
        v-model="filterCategory"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Categories</option>
        <option
          v-for="cat in availableCategories"
          :key="cat.id || cat.categoryId"
          :value="cat.id || cat.categoryId"
        >
          {{ cat.name }}
        </option>
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedItems.length === 0">
            <td colspan="7" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">⚖️</span>
                <p>No converted balances found</p>
                <button class="btn-secondary" @click="openInitializeModal">
                  Initialize First Balance
                </button>
              </div>
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedItems" :key="item.id">
            <td class="text-center">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>
            <td>
              <div class="item-code">{{ item.itemCode }}</div>
            </td>
            <td>
              <div class="item-name-wrapper">
                <div class="item-common-name">{{ item.itemName }}</div>
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
                  :class="getBalanceClass(item.convertedBalance)"
                >
                  {{ formatNumber(item.convertedBalance) }}
                </div>
              </div>
            </td>
            <td>
              <button
                class="btn-delete"
                @click="openDeleteModal(item)"
                title="Delete converted balance"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="totalItems > 0">
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

    <!-- ==================== INITIALIZE MODAL ==================== -->
    <InitializeConvertedBalanceModal
      v-if="showInitializeModal"
      :is-admin="isAdmin"
      :user-data="userData"
      :store-id="userStoreId"
      :group-id="userGroupId"
      :store-name="userData?.assignedStore?.name || ''"
      :group-name="userData?.assignedGroup?.name || ''"
      :stores="availableStores"          
      :groups="availableGroups"           
      :categories="availableCategories"
      :inventory-items="inventoryItems"
      :visible="showInitializeModal"
      @update:visible="showInitializeModal = $event"
      @close="closeInitializeModal"
      @success="onInitializeSuccess"
    />

    <!-- ==================== CONVERT MODAL ==================== -->
    <ConvertModal
      v-if="showConvertModal"
      v-model:visible="showConvertModal"
      :store-id="userStoreId"
      :group-id="userGroupId"
      :store-name="storeName"
      :categories="categories"
      @success="onConvertSuccess"
      @error="onConvertError"
    />

    <!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="closeDeleteModal"
    >
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>🗑️ Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">⚠️</div>
          <p class="delete-question">
            Are you sure you want to delete this converted balance?
          </p>
          <div class="delete-details">
            <p><strong>Item:</strong> {{ deleteTarget?.itemName || 'Unknown' }}</p>
            <p><strong>Code:</strong> {{ deleteTarget?.itemCode || 'N/A' }}</p>
            <p><strong>Balance:</strong> {{ formatNumber(deleteTarget?.convertedBalance || 0) }} {{ deleteTarget?.uomCode || '' }}</p>
            <p><strong>Store:</strong> {{ deleteTarget?.storeName || 'N/A' }}</p>
            <p><strong>Group:</strong> {{ deleteTarget?.groupName || 'N/A' }}</p>
          </div>
          <p class="delete-warning">⚠️ This action cannot be undone!</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal" :disabled="deleting">
            Cancel
          </button>
          <button class="btn-danger" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
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
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
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
import { ref, computed, onMounted, watch } from 'vue'
import convertedBalanceService from '@/stores/convertedBalanceService'
import itemService from '@/stores/itemService'
import InitializeConvertedBalanceModal from './components/InitializeConvertedBalanceModal.vue'
import ConvertModal from './components/ConvertModal.vue'

// ================================================================
// USER DATA
// ================================================================

const getUserData = () => {
  try {
    const data = JSON.parse(localStorage.getItem('user') || '{}')
    return data
  } catch (error) {
    console.error('Error parsing user data:', error)
    return {}
  }
}

const userData = ref(getUserData())
const isAdmin = computed(() => userData.value?.isAdmin || false)

// ================================================================
// TOAST SYSTEM
// ================================================================
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
let toastTimeout = null

const showToastMessage = (msg, type = 'success') => {
  if (toastTimeout) clearTimeout(toastTimeout)
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  toastTimeout = setTimeout(() => {
    showToast.value = false
    toastTimeout = null
  }, 4000)
}

// ================================================================
// STATE
// ================================================================
const isLoading = ref(false)
const exporting = ref(false)
const deleting = ref(false)
const exportType = ref('full')
const showExportModal = ref(false)
const showInitializeModal = ref(false)
const showConvertModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const searchQuery = ref('')
const filterStore = ref('')
const filterGroup = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Data
const convertedItems = ref([])
const totalItems = ref(0)
const totalPages = ref(1)
const stats = ref({
  totalItems: 0,
  convertibleItems: 0,
  zeroStock: 0
})

// Master data
const stores = ref([])
const allGroups = ref([])
const categories = ref([])
const inventoryItems = ref([])

// Store/Group from user data
const userStoreId = computed(() => userData.value?.assignedStore?.id || null)
const userGroupId = computed(() => userData.value?.assignedGroup?.id || null)
const storeName = ref('')

// ================================================================
// COMPUTED - Available data based on role
// ================================================================

const availableStores = computed(() => {
  if (!Array.isArray(stores.value)) {
    return []
  }
  if (isAdmin.value) {
    return stores.value
  }
  if (userData.value?.assignedStore) {
    return stores.value.filter((s) => s.id === userData.value.assignedStore.id)
  }
  return []  
})

const availableGroups = computed(() => {
  if (!Array.isArray(allGroups.value)) {
    return []
  }
  if (isAdmin.value) {
    return allGroups.value
  }
  if (userData.value?.assignedGroup) {
    return allGroups.value.filter((g) => g.id === userData.value.assignedGroup.id)
  }
  return []
})

const availableCategories = computed(() => {
  if (!Array.isArray(categories.value)) {
    return []
  }
  return categories.value.filter((c) => c.status === 'Active' || c.status === undefined)
})

// ================================================================
// COMPUTED - Filtered items
// ================================================================

const hasActiveFilters = computed(() => {
  return filterStore.value || filterGroup.value || filterCategory.value || searchQuery.value
})

const filteredItems = computed(() => {
  let result = [...convertedItems.value]

  if (!isAdmin.value && userData.value?.hasAccess) {
    const assignedStoreId = userData.value.assignedStore?.id
    const assignedGroupId = userData.value.assignedGroup?.id

    if (assignedStoreId) {
      result = result.filter((item) => item.storeId === assignedStoreId)
    }
    if (assignedGroupId) {
      result = result.filter((item) => item.groupId === assignedGroupId)
    }
  }

  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    result = result.filter((item) => {
      const itemName = (item.itemName || '').toLowerCase()
      const itemCode = (item.itemCode || '').toLowerCase()
      const categoryName = (item.categoryName || '').toLowerCase()
      return itemName.includes(s) || itemCode.includes(s) || categoryName.includes(s)
    })
  }

  if (filterStore.value && filterStore.value !== '') {
    const storeId = Number(filterStore.value)
    if (!isNaN(storeId)) {
      result = result.filter((item) => item.storeId === storeId)
    }
  }

  if (filterGroup.value && filterGroup.value !== '') {
    const groupId = Number(filterGroup.value)
    if (!isNaN(groupId)) {
      result = result.filter((item) => item.groupId === groupId)
    }
  }

  if (filterCategory.value && filterCategory.value !== '') {
    const categoryId = Number(filterCategory.value)
    if (!isNaN(categoryId)) {
      result = result.filter((item) => item.categoryId === categoryId)
    }
  }

  return result
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredItems.value.slice(start, end)
})

// ================================================================
// METHODS - Data Fetching
// ================================================================

const fetchCategories = async () => {
  try {
    const response = await itemService.getActiveCategories?.() || await itemService.getCategories?.()
    if (response?.success) {
      categories.value = response.data.map(cat => ({
        id: cat.categoryId || cat.id,
        name: cat.name,
        status: cat.status || 'Active'
      }))
    } else {
      categories.value = []
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const fetchStores = async () => {
  try {
    const response = await itemService.getStores?.() || { data: [] }
    stores.value = Array.isArray(response.data) ? response.data : []
    console.log('✅ Stores loaded:', stores.value.length)
  } catch (error) {
    console.error('Error fetching stores:', error)
    stores.value = []
  }
}

const fetchGroups = async () => {
  try {
    const response = await itemService.getGroups?.() || { data: [] }
    allGroups.value = Array.isArray(response.data) ? response.data : []
    console.log('✅ Groups loaded:', allGroups.value.length)
  } catch (error) {
    console.error('Error fetching groups:', error)
    allGroups.value = []
  }
}

const fetchInventoryItems = async () => {
  try {
    const response = await itemService.getActiveItems?.() || { data: [] }
    inventoryItems.value = response.data || []
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    inventoryItems.value = []
  }
}

const fetchConvertedBalances = async () => {
  isLoading.value = true
  try {
    const storeId = userStoreId.value
    const groupId = userGroupId.value

    if (!storeId || !groupId) {
      console.warn('No store or group found for user')
      isLoading.value = false
      return
    }

    const response = await convertedBalanceService.getConvertedBalances({
      storeId,
      groupId,
      categoryId: filterCategory.value || undefined,
      search: searchQuery.value || undefined,
      page: currentPage.value,
      limit: pageSize.value
    })

    if (response.success) {
      convertedItems.value = response.data
      totalItems.value = response.pagination.total
      totalPages.value = response.pagination.totalPages
    } else {
      showToastMessage('Failed to fetch converted balances', 'error')
    }
  } catch (error) {
    console.error('Error fetching converted balances:', error)
    showToastMessage('Failed to fetch converted balances', 'error')
  } finally {
    isLoading.value = false
  }
}

const fetchStats = async () => {
  try {
    const storeId = userStoreId.value
    const groupId = userGroupId.value

    if (!storeId || !groupId) {
      return
    }

    const response = await convertedBalanceService.getStats({
      storeId,
      groupId
    })

    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// ================================================================
// METHODS - UI Interactions
// ================================================================

const onSearchChange = () => {
  currentPage.value = 1
  fetchConvertedBalances()
}

const onFilterChange = () => {
  currentPage.value = 1
  fetchConvertedBalances()
}

const clearFilters = () => {
  filterStore.value = ''
  filterGroup.value = ''
  filterCategory.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  fetchConvertedBalances()
  showToastMessage('Filters cleared', 'info')
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchConvertedBalances()
  }
}

const changePageSize = () => {
  currentPage.value = 1
  fetchConvertedBalances()
}

// ================================================================
// METHODS - Initialize Modal
// ================================================================

const openInitializeModal = () => {
  showInitializeModal.value = true
}

const closeInitializeModal = () => {
  showInitializeModal.value = false
}

const onInitializeSuccess = () => {
  showToastMessage('Converted balance initialized successfully!', 'success')
  fetchConvertedBalances()
  fetchStats()
}

// ================================================================
// METHODS - Convert Modal
// ================================================================

const openConvertModal = () => {
  showConvertModal.value = true
}

const onConvertSuccess = () => {
  showToastMessage('Conversion completed successfully!', 'success')
  fetchConvertedBalances()
  fetchStats()
}

const onConvertError = (errors) => {
  if (errors && errors.length > 0) {
    errors.forEach(err => {
      showToastMessage(err.error || 'Conversion failed', 'error')
    })
  }
}

// ================================================================
// METHODS - Delete
// ================================================================

const openDeleteModal = (item) => {
  deleteTarget.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
  deleting.value = false
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  
  deleting.value = true
  
  try {
    const response = await convertedBalanceService.delete(deleteTarget.value.id)
    
    if (response.success) {
      showToastMessage(
        `✅ Converted balance for "${deleteTarget.value.itemName}" deleted successfully!`,
        'success'
      )
      closeDeleteModal()
      await fetchConvertedBalances()
      await fetchStats()
    } else {
      showToastMessage(response.error || 'Failed to delete converted balance', 'error')
      deleting.value = false
    }
  } catch (error) {
    console.error('Error deleting converted balance:', error)
    showToastMessage('Failed to delete converted balance', 'error')
    deleting.value = false
  }
}

// ================================================================
// METHODS - Export
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
    const storeId = userStoreId.value
    const groupId = userGroupId.value

    if (!storeId || !groupId) {
      showToastMessage('No store or group assigned', 'warning')
      return
    }

    const response = await convertedBalanceService.getConvertedBalances({
      storeId,
      groupId,
      categoryId: filterCategory.value || undefined,
      search: searchQuery.value || undefined,
      page: 1,
      limit: 99999
    })

    if (!response.success) {
      showToastMessage('Failed to fetch data for export', 'error')
      return
    }

    let csv = 'Item Code,Item Name,Category,UOM,Converted Balance\n'
    
    response.data.forEach(item => {
      csv += `${item.itemCode},"${item.itemName}","${item.categoryName || 'Uncategorized'}","${item.uomCode}",${item.convertedBalance}\n`
    })

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted_balance_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    showToastMessage('Export completed successfully!', 'success')
    closeExportModal()
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export data', 'error')
  } finally {
    exporting.value = false
  }
}

// ================================================================
// METHODS - Utility
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

// ================================================================
// WATCHERS
// ================================================================

watch([userStoreId, userGroupId], ([newStoreId, newGroupId]) => {
  if (newStoreId && newGroupId) {
    fetchConvertedBalances()
    fetchStats()
  }
}, { immediate: true })

watch(
  () => localStorage.getItem('user'),
  (newVal) => {
    if (newVal) {
      userData.value = getUserData()
      if (!isAdmin.value) {
        if (userData.value?.assignedStore?.id) {
          filterStore.value = String(userData.value.assignedStore.id)
        }
        if (userData.value?.assignedGroup?.id) {
          filterGroup.value = String(userData.value.assignedGroup.id)
        }
      }
      fetchConvertedBalances()
      fetchStats()
    }
  }
)

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  isLoading.value = true
  
  userData.value = getUserData()
  storeName.value = userData.value.assignedStore?.name || ''
  
  if (!isAdmin.value) {
    if (userData.value?.assignedStore?.id) {
      filterStore.value = String(userData.value.assignedStore.id)
    }
    if (userData.value?.assignedGroup?.id) {
      filterGroup.value = String(userData.value.assignedGroup.id)
    }
  }
  
  await Promise.all([
    fetchCategories(),
    fetchStores(),
    fetchGroups(),
    fetchInventoryItems()
  ])
  
  if (userStoreId.value && userGroupId.value) {
    await fetchConvertedBalances()
    await fetchStats()
  }
  
  isLoading.value = false
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

/* ... keep all existing styles ... */

/* ================================================================ */
/* DELETE BUTTON */
/* ================================================================ */
.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  color: #94a3b8;
}

.btn-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* ================================================================ */
/* DELETE MODAL */
/* ================================================================ */
.delete-modal .modal-container {
  max-width: 450px;
}

.delete-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.delete-question {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.delete-details {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}

.delete-details p {
  margin: 4px 0;
}

.delete-warning {
  color: #dc2626;
  font-weight: 600;
  text-align: center;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 13px;
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
/* TABLE ACTIONS COLUMN */
/* ================================================================ */
.balance-table th:last-child,
.balance-table td:last-child {
  text-align: center;
  width: 60px;
}


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

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
/* LOADING & EMPTY */
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
  from { opacity: 0; }
  to { opacity: 1; }
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
  padding: 12px 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  max-width: 90vw;
  font-size: 13px;
  white-space: pre-line;
  border-left: 3px solid #10b981;
  animation: slideIn 0.3s ease;
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
}

@media (max-width: 480px) {
  .balance-table {
    font-size: 11px;
    min-width: 400px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* ================================================================ */
/* PRINT STYLES */
/* ================================================================ */
@media print {
  .btn-add,
  .btn-convert,
  .btn-export,
  .search-box,
  .filter-bar,
  .pagination,
  .toast {
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