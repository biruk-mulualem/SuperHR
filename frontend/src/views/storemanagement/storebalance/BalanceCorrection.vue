<!-- views/storemanagement/balancecorrection/BalanceCorrection.vue -->
<template>
  <div class="balance-correction-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">🔧</div>
        <div>
          <h1 class="page-title">Balance Correction</h1>
          <p class="page-subtitle">Adjust and fix store balances</p>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-refresh" @click="loadAllData" :disabled="loading">
          🔄 {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-section">
      <div class="filter-bar">
        <div class="filter-group">
          <label>Store</label>
          <select v-model="filters.storeId" @change="applyFilters">
            <option value="">All Stores</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Group</label>
          <select v-model="filters.groupId" @change="applyFilters">
            <option value="">All Groups</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.name }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Status</label>
          <select v-model="filters.status" @change="applyFilters">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div class="filter-group search-group">
          <label>Search</label>
          <div class="search-wrapper">
            <input
              type="text"
              v-model="filters.search"
              placeholder="Search..."
              @input="applyFiltersDebounced"
            />
            <button v-if="filters.search" class="clear-search" @click="clearSearch">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading balances...</p>
    </div>

    <!-- Balance Table -->
    <div v-else class="table-container">
      <table class="balance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Store</th>
            <th>Group</th>
            <th>UOM</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedBalances.length === 0">
            <td colspan="8" class="empty-state">
              <span class="empty-icon">📭</span>
              <p>No balances found</p>
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedBalances" :key="item.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>
              <div class="item-info">
                <span class="item-code">{{ item.itemCode || 'N/A' }}</span>
                <span class="item-name">{{ item.itemCommonName || item.itemName || 'Unnamed' }}</span>
              </div>
            </td>
            <td>
              <span class="store-name">{{ item.storeName || 'Unknown' }}</span>
            </td>
            <td>
              <span class="group-name">{{ item.groupName || 'Unknown' }}</span>
            </td>
            <td>
              <span class="uom-badge">{{ item.uomCode || 'N/A' }}</span>
            </td>
            <td>
              <span class="balance-value" :class="getBalanceClass(item)">
                {{ formatNumber(item.balance) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="item.status.toLowerCase()">
                {{ item.status }}
              </span>
            </td>
            <td>
              <button class="btn-correction" @click="openCorrectionModal(item)">
                ✏️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="filteredBalances.length > 0" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ←
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
      </select>
    </div>

    <!-- ============================================================ -->
    <!-- COMPACT CORRECTION MODAL -->
    <!-- ============================================================ -->
    <div v-if="showCorrectionModal" class="modal-overlay" @click.self="closeCorrectionModal">
      <div class="modal-container correction-modal">
        <div class="modal-header">
          <h3>✏️ Balance Correction</h3>
          <button class="modal-close" @click="closeCorrectionModal">✕</button>
        </div>

        <div class="modal-body">
          <!-- Item Info -->
          <div class="item-card">
            <div class="item-row">
              <span class="item-label">Item</span>
              <span class="item-value">{{ selectedBalance?.itemCommonName || selectedBalance?.itemName || 'N/A' }}</span>
            </div>
            <div class="item-row">
              <span class="item-label">Code</span>
              <span class="item-value code">{{ selectedBalance?.itemCode || 'N/A' }}</span>
            </div>
            <div class="item-row">
              <span class="item-label">Store</span>
              <span class="item-value store">{{ selectedBalance?.storeName || 'N/A' }}</span>
            </div>
            <div class="item-row">
              <span class="item-label">Group</span>
              <span class="item-value group">{{ selectedBalance?.groupName || 'N/A' }}</span>
            </div>
            <div class="item-row highlight">
              <span class="item-label">Current Balance</span>
              <span class="item-value current">{{ formatNumber(selectedBalance?.balance || 0) }} {{ selectedBalance?.uomCode || '' }}</span>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="submitCorrection" class="correction-form">
            <div class="form-row">
              <div class="form-group">
                <label>New Balance</label>
                <input
                  type="number"
                  v-model.number="newBalanceValue"
                  min="0"
                  step="1"
                  class="input-balance"
                />
              </div>
              <div class="form-group change-group">
                <label>Change</label>
                <span class="change-value" :class="getChangeClass()">
                  {{ getChangeAmount() >= 0 ? '+' : '' }}{{ formatNumber(getChangeAmount()) }}
                </span>
              </div>
            </div>

            <div class="form-group full">
              <label>Reason</label>
              <textarea
                v-model="correctionReason"
                placeholder="Reason for correction..."
                rows="2"
                class="input-reason"
              ></textarea>
              <span class="char-count">{{ correctionReason.length }}/500</span>
            </div>

            <div v-if="newBalanceValue < 0" class="warning">
              ⚠️ Cannot be negative
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeCorrectionModal">Cancel</button>
          <button
            class="btn-update"
            @click="submitCorrection"
            :disabled="newBalanceValue < 0 || correctionReason.length < 3 || submitting"
          >
            {{ submitting ? '...' : 'Update' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import balanceService from '@/stores/balanceService'

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const submitting = ref(false)
const balances = ref([])
const stores = ref([])
const groups = ref([])
const showCorrectionModal = ref(false)
const selectedBalance = ref(null)
const newBalanceValue = ref(0)
const correctionReason = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const filters = ref({
  storeId: '',
  groupId: '',
  status: '',
  search: ''
})

let searchTimeout = null

// ================================================================
// COMPUTED
// ================================================================
const filteredBalances = computed(() => {
  let result = [...balances.value]

  if (filters.value.storeId) {
    result = result.filter(b => b.storeId === Number(filters.value.storeId))
  }
  if (filters.value.groupId) {
    result = result.filter(b => b.groupId === Number(filters.value.groupId))
  }
  if (filters.value.status) {
    result = result.filter(b => b.status === filters.value.status)
  }
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(b => {
      const code = (b.itemCode || '').toLowerCase()
      const name = (b.itemCommonName || b.itemName || '').toLowerCase()
      return code.includes(search) || name.includes(search)
    })
  }

  return result
})

const paginatedBalances = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBalances.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredBalances.value.length / pageSize.value) || 1
})

// ================================================================
// METHODS
// ================================================================

const loadAllData = async () => {
  loading.value = true
  try {
    // Load stores
    const storesRes = await balanceService.getStores()
    if (storesRes.success) {
      stores.value = storesRes.data || []
    }

    // Load groups
    const groupsRes = await balanceService.getGroups()
    if (groupsRes.success) {
      groups.value = groupsRes.data || []
    }

    // Load balances with filters
    await loadBalances()
  } catch (error) {
    console.error('Error loading data:', error)
    showToastMessage('Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

const loadBalances = async () => {
  try {
    const params = {
      page: 1,
      limit: 10000
    }

    if (filters.value.storeId) {
      params.storeId = Number(filters.value.storeId)
    }
    if (filters.value.groupId) {
      params.groupId = Number(filters.value.groupId)
    }
    if (filters.value.status) {
      params.status = filters.value.status
    }
    if (filters.value.search) {
      params.search = filters.value.search
    }

    const response = await balanceService.getBalances(params)
    if (response.success) {
      balances.value = response.data || []
    }
  } catch (error) {
    console.error('Error loading balances:', error)
    showToastMessage('Failed to load balances', 'error')
  }
}

const applyFilters = () => {
  currentPage.value = 1
  loadBalances()
}

const applyFiltersDebounced = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadBalances()
  }, 300)
}

const clearSearch = () => {
  filters.value.search = ''
  currentPage.value = 1
  loadBalances()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
}

const getBalanceClass = (item) => {
  if (item.balance === 0) return 'zero'
  if (item.balance <= (item.minStock || 0)) return 'low'
  return 'normal'
}

const getChangeClass = () => {
  const change = getChangeAmount()
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return 'zero'
}

const getChangeAmount = () => {
  if (!selectedBalance.value) return 0
  return (newBalanceValue.value || 0) - (selectedBalance.value.balance || 0)
}

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0'
  return new Intl.NumberFormat().format(num)
}

const openCorrectionModal = (item) => {
  selectedBalance.value = item
  newBalanceValue.value = item.balance
  correctionReason.value = ''
  showCorrectionModal.value = true
}

const closeCorrectionModal = () => {
  showCorrectionModal.value = false
  selectedBalance.value = null
  newBalanceValue.value = 0
  correctionReason.value = ''
  submitting.value = false
}

const submitCorrection = async () => {
  if (!selectedBalance.value) return
  if (newBalanceValue.value < 0) {
    showToastMessage('Balance cannot be negative', 'error')
    return
  }
  if (!correctionReason.value || correctionReason.value.trim().length < 3) {
    showToastMessage('Please provide a reason (minimum 3 characters)', 'warning')
    return
  }

  submitting.value = true

  try {
    const payload = {
      balanceId: selectedBalance.value.id,
      newBalance: newBalanceValue.value,
      reason: correctionReason.value.trim()
    }

    const response = await balanceService.correctBalance(payload)

    if (response.success) {
      // Update the balance in the local array
      const index = balances.value.findIndex(b => b.id === selectedBalance.value.id)
      if (index !== -1) {
        balances.value[index] = {
          ...balances.value[index],
          balance: newBalanceValue.value
        }
      }

      showToastMessage('✅ Balance corrected successfully!', 'success')
      closeCorrectionModal()
      
      // Refresh balances to get latest data
      await loadBalances()
    } else {
      showToastMessage(response.error || 'Failed to correct balance', 'error')
    }
  } catch (error) {
    console.error('Error correcting balance:', error)
    showToastMessage(error.response?.data?.error || 'Failed to correct balance', 'error')
  } finally {
    submitting.value = false
  }
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2500)
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  loadAllData()
})

watch([() => filters.value.storeId, () => filters.value.groupId, () => filters.value.status], () => {
  currentPage.value = 1
  loadBalances()
})
</script>

<style scoped>
/* ================================================================
   PAGE
   ================================================================ */
.balance-correction-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f0f2f6;
  min-height: 100vh;
}

/* ================================================================
   HEADER
   ================================================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 28px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.btn-refresh {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
}
.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   FILTERS
   ================================================================ */
.filter-section {
  background: white;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.filter-group label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.filter-group select,
.filter-group input {
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}
.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #6a11cb;
}

.search-group {
  flex: 1;
  min-width: 150px;
}
.search-wrapper {
  position: relative;
}
.search-wrapper input {
  width: 100%;
  padding-right: 30px;
}
.clear-search {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 14px;
  color: #94a3b8;
  cursor: pointer;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow-x: auto;
}

.balance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.balance-table th {
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e2e8f0;
}

.balance-table td {
  padding: 7px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.balance-table tbody tr:hover {
  background: #f8fafc;
}

.item-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
  font-family: monospace;
}
.item-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.store-name {
  font-size: 13px;
  color: #1e293b;
}

.group-name {
  font-size: 13px;
  color: #1e293b;
}

.uom-badge {
  display: inline-block;
  padding: 1px 8px;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.balance-value {
  font-weight: 600;
  font-size: 14px;
}
.balance-value.normal { color: #166534; }
.balance-value.low { color: #f59e0b; }
.balance-value.zero { color: #ef4444; }

.status-badge {
  display: inline-block;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}
.status-badge.active {
  background: #dcfce7;
  color: #166534;
}
.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.btn-correction {
  padding: 4px 10px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.btn-correction:hover {
  background: #d97706;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.page-btn {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}
.page-btn:hover:not(:disabled) {
  background: #f8fafc;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}

/* ================================================================
   LOADING
   ================================================================ */
.loading-state {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}
.empty-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}
.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* ================================================================
   MODAL - COMPACT
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 340px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.modal-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
}
.modal-close:hover {
  color: #1e293b;
}

.modal-body {
  padding: 14px 16px;
  overflow-y: auto;
  flex: 1;
}

/* Item Card */
.item-card {
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}
.item-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 12px;
}
.item-row .item-label {
  color: #94a3b8;
}
.item-row .item-value {
  color: #1e293b;
  font-weight: 500;
}
.item-row .item-value.code {
  color: #2563eb;
  font-family: monospace;
}
.item-row .item-value.store {
  color: #059669;
}
.item-row .item-value.group {
  color: #7c3aed;
}
.item-row.highlight {
  border-top: 1px solid #e2e8f0;
  margin-top: 4px;
  padding-top: 4px;
}
.item-row.highlight .item-value.current {
  color: #6a11cb;
  font-weight: 700;
}

/* Form */
.correction-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-row {
  display: flex;
  gap: 8px;
}
.form-group {
  flex: 1;
}
.form-group.full {
  flex: 1 1 100%;
}
.form-group label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
}

.input-balance {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
}
.input-balance:focus {
  outline: none;
  border-color: #6a11cb;
}

.change-group {
  max-width: 70px;
  text-align: center;
}
.change-value {
  display: block;
  padding: 4px 0;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}
.change-value.positive { color: #22c55e; }
.change-value.negative { color: #ef4444; }
.change-value.zero { color: #94a3b8; }

.input-reason {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  font-family: inherit;
  min-height: 40px;
}
.input-reason:focus {
  outline: none;
  border-color: #6a11cb;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 9px;
  color: #94a3b8;
  margin-top: 1px;
}

.warning {
  padding: 4px 8px;
  background: #fee2e2;
  border-radius: 4px;
  color: #991b1b;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 10px 16px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.btn-cancel {
  padding: 4px 14px;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.btn-cancel:hover {
  background: #cbd5e1;
}

.btn-update {
  padding: 4px 14px;
  background: #6a11cb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.btn-update:hover:not(:disabled) {
  background: #7c3aed;
}
.btn-update:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 9999;
  animation: slideIn 0.2s ease, fadeOut 0.2s ease 2s forwards;
}
.toast.success { background: #10b981; }
.toast.error { background: #ef4444; }
.toast.warning { background: #f59e0b; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes fadeOut {
  to { opacity: 0; transform: translateY(-10px); }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .balance-correction-page { padding: 12px; }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-right {
    display: flex;
    justify-content: stretch;
  }
  .header-right button {
    flex: 1;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 8px;
  }
  .filter-group {
    min-width: 100%;
  }
  .search-group {
    min-width: 100%;
  }
  
  .modal-container {
    max-width: 100%;
    margin: 10px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 6px;
  }
  .change-group {
    max-width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .change-group label {
    margin-bottom: 0;
  }
  .change-value {
    padding: 2px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .balance-table {
    font-size: 12px;
  }
  .balance-table th,
  .balance-table td {
    padding: 5px 8px;
  }
  .item-code {
    font-size: 10px;
  }
  .item-name {
    font-size: 12px;
  }
  .store-name,
  .group-name {
    font-size: 12px;
  }
}
</style>