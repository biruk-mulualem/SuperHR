<template>
  <div class="beneficiaries-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Beneficiaries</h1>
        <p class="page-subtitle">Manage all registered beneficiaries</p>
      </div>
      <router-link to="/charity/beneficiaries/create" class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Add Beneficiary
      </router-link>
    </div>

    <div v-if="error" class="error-alert">
      {{ error }}
      <button @click="fetchBeneficiaries">Retry</button>
    </div>

    <!-- Stats Cards -->
    <StatsCards :cards="statsCards" />

    <!-- Filters -->
    <FilterBar
      v-model:search="filters.search"
      search-placeholder="Search beneficiaries…"
      @clear="clearFilters"
    >
      <template #filters>
        <select v-model="filters.teamId" class="fb-select">
          <option value="">All Teams</option>
          <option v-for="t in teams" :key="t.teamId" :value="t.teamId">{{ t.name }}</option>
        </select>
      </template>
      <template #actions>
        <button class="btn-outline" :disabled="loading" @click="fetchBeneficiaries">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </template>
    </FilterBar>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedIds.length > 0" class="bulk-actions-bar">
      <div class="bulk-info">
        <span class="count-badge">{{ selectedIds.length }}</span>
        <span>beneficiaries selected</span>
      </div>
      <div class="bulk-btns">
        <button class="btn-bulk edit-bulk" @click="openBulkEdit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Bulk Edit
        </button>
        <button class="btn-bulk delivery" @click="openBulkDelivery">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          Bulk Delivery
        </button>
        <button class="btn-bulk adjustment" @click="openBulkAdjustment">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          Bulk Adjustment
        </button>
        <button class="btn-text" @click="clearSelection">Cancel</button>
      </div>
    </div>

    <!-- Table -->
    <ListTable
      :columns="benColumns"
      :rows="beneficiaries"
      row-key="beneficiaryId"
      :pagination="pagination"
      :loading="loading"
      selectable
      @selection-change="onSelectionChange"
      @page-change="onPageChange"
      @sort-change="onSort"
    >
      <template #cell-fullname="{ value }">
        <span class="fullname-text">{{ value }}</span>
      </template>
      <template #cell-monthlyAllocation="{ value }">
        <span class="amount-text">{{ CharityService.formatCurrency(value) }}</span>
      </template>
      <template #cell-team="{ row }">
        {{ row.team ? row.team.name : '—' }}
      </template>
      <template #cell-paymentMethod="{ value }">
        <span :class="['lt-badge', `lt-badge--${value}`]">{{ value }}</span>
      </template>
      <template #cell-isActive="{ row }">
        <span
          :class="['lt-badge', row.isActive ? 'lt-badge--active' : 'lt-badge--inactive']"
          style="cursor:pointer; user-select:none"
          @click.stop="toggleActive(row)"
          :title="row.isActive ? 'Click to deactivate' : 'Click to activate'"
        >
          {{ row.isActive ? 'Active' : 'Inactive' }}
        </span>
      </template>
      <!-- Actions – Edit and Details -->
      <template #actions="{ row }">
        <router-link :to="`/charity/beneficiaries/${row.beneficiaryId}/edit`" class="action-btn edit" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </router-link>
        <router-link :to="`/charity/beneficiaries/${row.beneficiaryId}/details`" class="action-btn details" title="Details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none"/></svg>
        </router-link>
      </template>
    </ListTable>

    <!-- Bulk Delivery Modal -->
    <div v-if="showBulkDelivery" class="modal-overlay" @click.self="showBulkDelivery = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Bulk Add Delivery ({{ selectedIds.length }} selected)</h3>
          <button class="modal-close" @click="showBulkDelivery = false">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Only active beneficiaries without a record for this release will be processed.</p>
          <div class="form-row">
            <div class="form-field full">
              <label>Distribution Release</label>
              <select v-model="bulkDelivery.distribution_release_id">
                <option value="">Select a release date</option>
                <option v-for="rel in activeReleases" :key="rel.distribution_release_id" :value="rel.distribution_release_id">
                  {{ CharityService.formatDate(rel.date) }} ({{ rel.payment_for_indays }} days)
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Delivered?</label>
              <select v-model="bulkDelivery.is_delivered">
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>
            </div>
            <div class="form-field">
              <label>Receipt Reference (optional)</label>
              <input type="text" v-model="bulkDelivery.recipt" placeholder="Bulk Receipt #" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field full">
              <label>Return Reason (if applicable)</label>
              <input type="text" v-model="bulkDelivery.is_returned.reason" placeholder="Bulk reason for return (sets Delivered to No)" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showBulkDelivery = false">Cancel</button>
          <button class="btn-primary" @click="confirmBulkAction('delivery')" :disabled="submitting || !bulkDelivery.distribution_release_id">
            {{ submitting ? 'Processing...' : 'Apply Bulk Delivery' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Adjustment Modal -->
    <div v-if="showBulkAdjustment" class="modal-overlay" @click.self="showBulkAdjustment = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Bulk Add Adjustment ({{ selectedIds.length }} selected)</h3>
          <button class="modal-close" @click="showBulkAdjustment = false">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Only active beneficiaries will be processed.</p>
          <div class="form-row">
            <div class="form-field">
              <label>Type</label>
              <select v-model="bulkAdjustment.type">
                <option value="increase">Increase Allocation</option>
                <option value="Deduct">Deduct Allocation</option>
              </select>
            </div>
            <div class="form-field">
              <label>Amount (ETB)</label>
              <input type="number" step="0.01" v-model.number="bulkAdjustment.amount" placeholder="0.00" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field full">
              <label>Reason</label>
              <textarea v-model="bulkAdjustment.reason" rows="2" placeholder="Reason for bulk adjustment"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showBulkAdjustment = false">Cancel</button>
          <button class="btn-primary" @click="confirmBulkAction('adjustment')" :disabled="submitting || !bulkAdjustment.amount || !bulkAdjustment.reason">
            {{ submitting ? 'Processing...' : 'Apply Bulk Adjustment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Edit Modal -->
    <div v-if="showBulkEdit" class="modal-overlay" @click.self="showBulkEdit = false">
      <div class="modal large">
        <div class="modal-header">
          <h3>Bulk Edit Beneficiaries ({{ selectedIds.length }} selected)</h3>
          <button class="modal-close" @click="showBulkEdit = false">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">Check the fields you want to update for all selected records.</p>
          
          <div class="bulk-edit-container">
            <div class="edit-section">
              <!-- Team Selection (Admin/Charity Admin Only) -->
              <div v-if="!isTeamLeader" class="edit-field">
                <label class="toggle-label">
                  <input type="checkbox" v-model="bulkEdit.fields.teamId" />
                  <span>Change Team</span>
                </label>
                <select v-model="bulkEdit.values.teamId" :disabled="!bulkEdit.fields.teamId">
                  <option value="">Select Target Team</option>
                  <option v-for="t in teams" :key="t.teamId" :value="t.teamId">{{ t.name }}</option>
                </select>
              </div>

              <div class="edit-field">
                <label class="toggle-label">
                  <input type="checkbox" v-model="bulkEdit.fields.paymentMethod" />
                  <span>Change Payment Method</span>
                </label>
                <select v-model="bulkEdit.values.paymentMethod" :disabled="!bulkEdit.fields.paymentMethod">
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div class="edit-field">
                <label class="toggle-label">
                  <input type="checkbox" v-model="bulkEdit.fields.isActive" />
                  <span>Change Status</span>
                </label>
                <select v-model="bulkEdit.values.isActive" :disabled="!bulkEdit.fields.isActive">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div class="edit-section">
              <div class="edit-field full">
                <label class="toggle-label">
                  <input type="checkbox" v-model="bulkEdit.fields.monthlyAllocation" />
                  <span>Set Monthly Allocation (ETB)</span>
                </label>
                <input type="number" step="0.01" v-model.number="bulkEdit.values.monthlyAllocation" :disabled="!bulkEdit.fields.monthlyAllocation" placeholder="0.00" />
              </div>
            </div>

            <div class="edit-section">
              <div class="edit-field full">
                <label class="toggle-label">
                  <input type="checkbox" v-model="bulkEdit.fields.location" />
                  <span>Update Location (Region, City, Woreda)</span>
                </label>
                <div class="multi-input" :class="{ disabled: !bulkEdit.fields.location }">
                  <input type="text" v-model="bulkEdit.values.location.region" placeholder="Region" :disabled="!bulkEdit.fields.location" />
                  <input type="text" v-model="bulkEdit.values.location.city" placeholder="City" :disabled="!bulkEdit.fields.location" />
                  <input type="text" v-model="bulkEdit.values.location.woreda" placeholder="Woreda" :disabled="!bulkEdit.fields.location" />
                </div>
              </div>
            </div>

            
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showBulkEdit = false">Cancel</button>
          <button class="btn-primary" @click="confirmBulkAction('update')" :disabled="submitting || !hasSelectedFields">
            {{ submitting ? 'Updating...' : 'Apply Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Global Confirmation Modal -->
    <ConfirmationModal
      :show="confirm.show"
      :title="confirm.title"
      :message="confirm.message"
      :type="confirm.type"
      :loading="submitting"
      @close="confirm.show = false"
      @confirm="confirm.action === 'toggleStatus' ? processToggleActive() : processBulkAction()"
    />

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import CharityService from '@/stores/charity'
import StatsCards from './components/common/StatsCards.vue'
import FilterBar   from './components/common/FilterBar.vue'
import ListTable   from './components/common/ListTable.vue'
import ConfirmationModal from './components/modals/ConfirmationModal.vue'

const authStore = useAuthStore()
const isTeamLeader = computed(() => authStore.userRole === 'charity_teamleader')

const beneficiaries = ref([])
const teams = ref([])
const settings = ref(null)
const loading = ref(false)
const error = ref(null)
const submitting = ref(false)
const selectedIds = ref([])

const filters = ref({ 
  search: '', 
  teamId: '',
  isActive: undefined
})

const pagination = ref({ 
  currentPage: 1, 
  totalPages: 1, 
  totalItems: 0, 
  pageSize: 10 
})

// Bulk state
const showBulkDelivery = ref(false)
const showBulkAdjustment = ref(false)
const showBulkEdit = ref(false)

const bulkDelivery = reactive({ 
  distribution_release_id: '', 
  is_delivered: true, 
  recipt: '',
  is_returned: { reason: '' }
})
const bulkAdjustment = reactive({ type: 'increase', amount: 0, reason: '' })

const activeReleases = computed(() => {
  return (settings.value?.distributionRelease || []).filter(rel => !rel.is_completed)
})

const bulkEdit = reactive({
  fields: { teamId: false, paymentMethod: false, monthlyAllocation: false, location: false, contact: false, isActive: false },
  values: {
    teamId: '',
    paymentMethod: 'bank',
    monthlyAllocation: 0,
    location: { region: '', city: '', woreda: '' },
    contact: { phone: '', email: '' },
    isActive: true
  }
})

const hasSelectedFields = computed(() => Object.values(bulkEdit.fields).some(v => v))

// Enforce mutual exclusivity for bulk delivery
watch(() => bulkDelivery.is_delivered, (val) => {
  if (val) bulkDelivery.is_returned.reason = ''
})
watch(() => bulkDelivery.is_returned.reason, (val) => {
  if (val && val.trim()) bulkDelivery.is_delivered = false
})

const confirm = reactive({
  show: false,
  title: '',
  message: '',
  type: 'primary',
  action: null
})

const fetchTeams = async () => {
  try {
    const res = await CharityService.getTeams({ size: 100, isActive: true })
    if (res.success) teams.value = res.data
  } catch (err) { console.error('Failed to fetch teams', err) }
}

const fetchSettings = async () => {
  try {
    const res = await CharityService.getSettings()
    if (res.success) settings.value = res.data
  } catch (err) { console.error('Failed to fetch settings', err) }
}

const fetchBeneficiaries = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await CharityService.getBeneficiaries({
      page: pagination.value.currentPage,
      size: pagination.value.pageSize,
      search: filters.value.search,
      teamId: filters.value.teamId || undefined,
      isActive: filters.value.isActive
    })
    if (res.success) {
      beneficiaries.value = res.data
      pagination.value.totalItems = res.pagination.totalItems
      pagination.value.totalPages = res.pagination.totalPages
    } else {
      error.value = res.error
    }
  } catch (err) {
    error.value = 'Failed to fetch beneficiaries'
  } finally {
    loading.value = false
  }
}

const onSelectionChange = (ids) => {
  selectedIds.value = ids
}

const clearSelection = () => {
  selectedIds.value = []
}

const openBulkDelivery = () => {
  bulkDelivery.distribution_release_id = ''
  bulkDelivery.is_delivered = true
  bulkDelivery.recipt = ''
  showBulkDelivery.value = true
}

const openBulkAdjustment = () => {
  bulkAdjustment.type = 'increase'
  bulkAdjustment.amount = 0
  bulkAdjustment.reason = ''
  showBulkAdjustment.value = true
}

const openBulkEdit = () => {
  bulkEdit.fields = { teamId: false, paymentMethod: false, monthlyAllocation: false, location: false, contact: false }
  showBulkEdit.value = true
}

const confirmBulkAction = (type) => {
  confirm.show = true
  confirm.action = type
  if (type === 'delivery') {
    confirm.title = 'Confirm Bulk Delivery'
    confirm.message = `Are you sure you want to add a delivery record for ${selectedIds.value.length} beneficiaries?`
    confirm.type = 'primary'
  } else if (type === 'adjustment') {
    confirm.title = 'Confirm Bulk Adjustment'
    confirm.message = `Are you sure you want to apply a ${bulkAdjustment.type} adjustment of ${bulkAdjustment.amount} ETB to ${selectedIds.value.length} beneficiaries?`
    confirm.type = 'warning'
  } else {
    confirm.title = 'Confirm Bulk Edit'
    confirm.message = `Are you sure you want to update ${selectedIds.value.length} beneficiaries with the selected fields?`
    confirm.type = 'warning'
  }
}

const processBulkAction = async () => {
  submitting.value = true
  try {
    let res
    if (confirm.action === 'delivery') {
      res = await CharityService.bulkAddDelivery({
        beneficiaryIds: selectedIds.value,
        ...bulkDelivery
      })
    } else if (confirm.action === 'adjustment') {
      res = await CharityService.bulkAddAdjustment({
        beneficiaryIds: selectedIds.value,
        ...bulkAdjustment
      })
    } else {
      // Prepare bulk update payload
      const updates = {}
      if (bulkEdit.fields.teamId) updates.teamId = bulkEdit.values.teamId
      if (bulkEdit.fields.paymentMethod) updates.paymentMethod = bulkEdit.values.paymentMethod
      if (bulkEdit.fields.monthlyAllocation) updates.monthlyAllocation = bulkEdit.values.monthlyAllocation
      if (bulkEdit.fields.isActive) updates.isActive = bulkEdit.values.isActive
      
      if (bulkEdit.fields.location || bulkEdit.fields.contact) {
        updates.fullInfo = {}
        if (bulkEdit.fields.location) updates.fullInfo.location = bulkEdit.values.location
        if (bulkEdit.fields.contact) updates.fullInfo.contact = bulkEdit.values.contact
      }

      res = await CharityService.bulkUpdateBeneficiaries({
        beneficiaryIds: selectedIds.value,
        updates
      })
    }

    if (res.success) {
      addToast(`✅ Successfully processed ${res.count} beneficiaries.`)
      showBulkDelivery.value = false
      showBulkAdjustment.value = false
      showBulkEdit.value = false
      confirm.show = false
      selectedIds.value = []
      fetchBeneficiaries()
    } else {
      addToast(res.error, 'error')
    }
  } catch (err) {
    addToast('An error occurred during bulk operation', 'error')
  } finally {
    submitting.value = false
  }
}

const clearFilters = () => { 
  filters.value = { search: '', teamId: '', isActive: undefined }
  pagination.value.currentPage = 1
  fetchBeneficiaries()
}

const onPageChange = (page) => { 
  pagination.value.currentPage = page 
  fetchBeneficiaries()
}

const onSort = ({ key, dir }) => { 
  console.log('Sort:', key, dir) 
}

const statsCards = computed(() => {
  const cards = [
    { key: 'total', label: 'Total Beneficiaries', value: pagination.value.totalItems },
    { key: 'active', label: 'Active', value: beneficiaries.value.filter(b => b.isActive).length, color: '#10b981' },
    { key: 'allocated', label: 'Total Allocated (ETB)', value: beneficiaries.value.reduce((s, b) => s + parseFloat(b.monthlyAllocation || 0), 0), format: 'currency' },
  ]
  
  if (!isTeamLeader.value) {
    cards.push({ key: 'teams', label: 'Assigned Teams', value: teams.value.length, color: '#3b82f6' })
  }
  
  return cards
})

const benColumns = [
  { key: 'beneficiaryId', label: 'ID', width: '60px' },
  { key: 'fullname', label: 'Full Name' },
  { key: 'team', label: 'Team' },
  { key: 'monthlyAllocation', label: 'Monthly Allocation', format: 'currency', sortable: true },
  { key: 'paymentMethod', label: 'Payment', format: 'badge' },
  { key: 'isActive', label: 'Active' },
]

const toggleActive = (row) => {
  confirm.show = true
  confirm.action = 'toggleStatus'
  confirm.targetId = row.beneficiaryId
  confirm.title = row.isActive ? 'Deactivate Beneficiary' : 'Activate Beneficiary'
  confirm.message = `Are you sure you want to ${row.isActive ? 'deactivate' : 'activate'} "${row.fullname}"?`
  confirm.type = row.isActive ? 'warning' : 'primary'
  confirm.tempRow = row
}

const processToggleActive = async () => {
  const row = confirm.tempRow
  submitting.value = true
  try {
    const res = await CharityService.updateBeneficiary(row.beneficiaryId, { isActive: !row.isActive })
    if (res.success) {
      row.isActive = res.data.isActive
      addToast(`Beneficiary ${row.isActive ? 'activated' : 'deactivated'}`)
      confirm.show = false
    } else {
      addToast(res.error, 'error')
    }
  } catch (err) {
    addToast('Failed to toggle status', 'error')
  } finally {
    submitting.value = false
  }
}

const toasts = ref([])
function addToast(msg, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

// Watchers for filtering
watch(() => filters.value.teamId, () => {
  pagination.value.currentPage = 1
  fetchBeneficiaries()
})

let searchTimeout
watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.currentPage = 1
    fetchBeneficiaries()
  }, 500)
})

onMounted(() => {
  fetchTeams()
  fetchSettings()
  fetchBeneficiaries()
})
</script>

<style scoped>
.beneficiaries-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #64748b; }

.btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; text-decoration: none; }
.btn-icon { width: 18px; height: 18px; }
.btn-icon-small { width: 16px; height: 16px; margin-right: 4px; }
.btn-outline { display: inline-flex; align-items: center; padding: 8px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; color: #475569; }
.btn-outline:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; }
.export-btn { background: #f8fafc; border-color: #cbd5e1; }
.export-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #6366f1; }

.fb-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; font-size: 13px; color: #475569; outline: none; }
.fullname-text { font-weight: 600; color: #1e293b; }
.amount-text { font-weight: 600; color: #1e293b; }

/* Bulk Actions Bar */
.bulk-actions-bar {
  display: flex; justify-content: space-between; align-items: center;
  background: white; border: 1px solid #e0e7ff; padding: 12px 20px;
  border-radius: 12px; margin-bottom: 16px;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.05);
  animation: slide-down 0.3s ease-out;
}
@keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.bulk-info { display: flex; align-items: center; gap: 10px; color: #4338ca; font-weight: 600; font-size: 14px; }
.count-badge { background: #6366f1; color: white; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 12px; }
.bulk-btns { display: flex; align-items: center; gap: 10px; }
.btn-bulk { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-bulk svg { width: 14px; height: 14px; }
.btn-bulk.delivery { background: #eef2ff; color: #4f46e5; }
.btn-bulk.delivery:hover { background: #e0e7ff; }
.btn-bulk.adjustment { background: #fff7ed; color: #c2410c; }
.btn-bulk.adjustment:hover { background: #ffedd5; }
.btn-bulk.edit-bulk { background: #f0fdf4; color: #166534; }
.btn-bulk.edit-bulk:hover { background: #dcfce7; }
.btn-text { background: none; border: none; color: #64748b; font-size: 13px; cursor: pointer; text-decoration: underline; }

.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; margin-right: 6px; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.details:hover { border-color: #10b981; color: #10b981; background: #e6f7ee; }

.lt-badge--active { background: #e6f7ee; color: #0d6b36; border: 1px solid #b7e4cf; border-radius: 20px; padding: 2px 8px;}
.lt-badge--inactive { background: #fef1f1; color: #b91c1c; border: 1px solid #fecaca; border-radius: 20px; padding: 2px 8px;}
.lt-badge--bank { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 20px; padding: 2px 8px;}
.lt-badge--cash { background: #fdf2f7; color: #be185d; border: 1px solid #fbcfe8; border-radius: 20px; padding: 2px 8px;}

/* Modals */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 20px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; font-size: 18px; color: #1e293b; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 24px; }
.modal-hint { font-size: 13px; color: #64748b; margin-bottom: 20px; font-style: italic; }

/* Bulk Edit Modal Styles */
.modal.large { max-width: 800px; }
.bulk-edit-container { display: flex; flex-direction: column; gap: 20px; }
.edit-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }
.edit-section:last-child { border-bottom: none; }
.edit-field { display: flex; flex-direction: column; gap: 10px; }
.edit-field.full { grid-column: 1 / -1; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.toggle-label span { font-size: 14px; font-weight: 600; color: #1e293b; }
.toggle-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #6366f1; }
.multi-input { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.multi-input.disabled { opacity: 0.6; }
.edit-field select:disabled, .edit-field input:disabled { background: #f8fafc; cursor: not-allowed; }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field.full { grid-column: 1 / -1; }
.form-field label { font-size: 13px; font-weight: 600; color: #475569; }
input, select, textarea { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
input:focus, select:focus, textarea:focus { border-color: #6366f1; }

.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
.error-alert button { background: #b91c1c; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }

.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
</style>