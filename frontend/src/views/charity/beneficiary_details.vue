<template>
  <div class="beneficiary-details">
    <!-- Back header -->
    <div class="details-header">
      <router-link to="/charity/beneficiaries" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </router-link>
      <div class="header-title">
        <h1>Beneficiary Details</h1>
        <p v-if="beneficiary">{{ beneficiary.fullname }} – Manage deliveries and adjustments</p>
      </div>
      <div class="header-actions">
        <button v-if="beneficiary" class="btn-outline transfer-btn" @click="showTransferModal = true" :disabled="!beneficiary.isActive" :title="!beneficiary.isActive ? 'Inactive beneficiary cannot be transferred' : ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-small"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
          Transfer Team
        </button>
        <router-link v-if="beneficiary" :to="`/charity/beneficiaries/${beneficiaryId}/edit`" class="btn-outline">
          Edit Beneficiary
        </router-link>
      </div>
    </div>

    <!-- Modals -->
    <TransferBeneficiaryModal 
      :is-open="showTransferModal" 
      :beneficiary="beneficiary"
      :current-team-name="beneficiary?.team?.name || 'Unassigned'"
      @close="showTransferModal = false"
      @success="handleTransferSuccess"
    />

    <div v-if="loading" class="loading-state">Loading beneficiary data...</div>
    <div v-else-if="error" class="error-alert">{{ error }} <button @click="fetchBeneficiary">Retry</button></div>

    <template v-else-if="beneficiary">
      <!-- Beneficiary Summary Card -->
      <div class="summary-card">
        <div class="summary-grid">
          <div class="summary-item"><span class="label">Full Name</span><span class="value">{{ beneficiary.fullname }}</span></div>
          <div class="summary-item"><span class="label">Team</span><span class="value">{{ beneficiary.team?.name || '—' }}</span></div>
          <div class="summary-item"><span class="label">Monthly Allocation</span><span class="value allocation-value">{{ CharityService.formatCurrency(beneficiary.monthlyAllocation) }}</span></div>
          <div class="summary-item">
            <span class="label">Payment Method</span>
            <span class="value">
              {{ beneficiary.paymentMethod }}
              <span v-if="beneficiary.paymentMethod === 'bank' && beneficiary.bankInfo" class="bank-acc">
                ({{ beneficiary.bankInfo.bank }}: {{ beneficiary.bankInfo.account_no }})
              </span>
            </span>
          </div>
          <div class="summary-item"><span class="label">Special Case</span><span class="value">{{ beneficiary.isSpecialCase || 'None' }}</span></div>
          <div class="summary-item"><span class="label">Status</span><span :class="['status-badge', beneficiary.isActive ? 'active' : 'inactive']">{{ beneficiary.isActive ? 'Active' : 'Inactive' }}</span></div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="details-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
        >
          {{ tab.name }}
          <span class="tab-count">{{ tab.id === 'deliveries' ? (beneficiary.deliveries?.length || 0) : (beneficiary.adjustments?.length || 0) }}</span>
        </button>
      </div>

      <!-- Inactive Hint -->
      <div v-if="!beneficiary.isActive" class="inactive-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>This beneficiary is inactive. Delivery and adjustment operations are disabled until reactivated.</span>
      </div>

      <div class="tab-content">
        <!-- Deliveries Tab -->
        <div v-if="activeTab === 'deliveries'" class="tab-pane">
          <div class="actions-bar">
            <button class="btn-primary small" @click="openDeliveryModal()" :disabled="!beneficiary.isActive">
              + New Delivery
            </button>
          </div>

          <!-- Add/Edit Delivery Modal -->
          <div v-if="showAddDelivery" class="modal-overlay" @click.self="showAddDelivery = false">
            <div class="modal">
              <div class="modal-header">
                <h3>{{ isEditingDelivery ? 'Edit Delivery' : 'Add New Delivery' }}</h3>
                <button class="modal-close" @click="showAddDelivery = false">×</button>
              </div>
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-field full">
                    <label>Distribution Release</label>
                    <select v-model="newDelivery.distribution_release_id" :disabled="isEditingDelivery">
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
                    <select v-model="newDelivery.is_delivered">
                      <option :value="true">Yes</option>
                      <option :value="false">No</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>Receipt Reference</label>
                    <input type="text" v-model="newDelivery.recipt" placeholder="Receipt #" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full">
                    <label>Return Reason (if applicable)</label>
                    <input type="text" v-model="newDelivery.is_returned.reason" placeholder="Reason for return (optional)" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-outline" @click="showAddDelivery = false">Cancel</button>
                <button class="btn-primary" @click="handleDeliverySubmit" :disabled="submitting">
                  {{ submitting ? 'Saving...' : isEditingDelivery ? 'Update Delivery' : 'Add Delivery' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Deliveries Table -->
          <ListTable
            :columns="deliveryColumns"
            :rows="beneficiary.deliveries || []"
            row-key="delivery_id"
            :pagination="null"
          >
            <template #cell-distribution_release_date="{ row }">
              <span class="release-date">{{ CharityService.formatDate(row.distribution_release_date) }}</span>
            </template>
            <template #cell-distribution_release_payment_for_indays="{ value }">{{ value }} days</template>
            <template #cell-is_returned="{ row }">
              <span v-if="row.is_returned?.reason" class="return-badge" :title="row.is_returned.reason">Returned</span>
              <span v-else>—</span>
            </template>
            <template #cell-created_at="{ value }">{{ CharityService.formatDate(value) }}</template>
            <template #cell-created_by="{ value }">User #{{ value }}</template>
            <template #cell-updated_by="{ value }">User #{{ value }}</template>
            <!-- Actions – Edit -->
            <template #actions="{ row }">
              <button class="action-btn edit" title="Edit Delivery" @click="openDeliveryModal(row)" :disabled="!beneficiary.isActive">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </template>
          </ListTable>
        </div>

        <!-- Adjustments Tab -->
        <div v-if="activeTab === 'adjustments'" class="tab-pane">
          <div class="actions-bar">
            <button class="btn-primary small" @click="showAddAdjustment = true" :disabled="!beneficiary.isActive">+ New Adjustment</button>
          </div>

          <!-- Add Adjustment Modal -->
          <div v-if="showAddAdjustment" class="modal-overlay" @click.self="showAddAdjustment = false">
            <div class="modal">
              <div class="modal-header">
                <h3>Add New Adjustment</h3>
                <button class="modal-close" @click="showAddAdjustment = false">×</button>
              </div>
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-field">
                    <label>Type</label>
                    <select v-model="newAdjustment.type">
                      <option value="increase">Increase Allocation</option>
                      <option value="Deduct">Deduct Allocation</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label>Amount (ETB)</label>
                    <input type="number" step="0.01" v-model.number="newAdjustment.amount" placeholder="0.00" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-field full">
                    <label>Reason</label>
                    <textarea v-model="newAdjustment.reason" rows="2" placeholder="Reason for adjustment"></textarea>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-outline" @click="showAddAdjustment = false">Cancel</button>
                <button class="btn-primary" @click="handleAddAdjustment" :disabled="submitting">
                   {{ submitting ? 'Adding...' : 'Add Adjustment' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Adjustments Table -->
          <ListTable
            :columns="adjustmentColumns"
            :rows="beneficiary.adjustments || []"
            row-key="adjustment_id"
            :pagination="null"
          >
            <template #cell-type="{ value }">
              <span :class="['type-badge', value === 'increase' ? 'increase' : 'deduct']">{{ value === 'increase' ? 'Increase' : 'Deduct' }}</span>
            </template>
            <template #cell-amount="{ value }">{{ CharityService.formatCurrency(value) }}</template>
            <template #cell-created_at="{ value }">{{ CharityService.formatDate(value) }}</template>
            <template #cell-created_by="{ value }">User #{{ value }}</template>
          </ListTable>
        </div>
      </div>
    </template>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted,watch,computed  } from 'vue'
import { useRoute } from 'vue-router'
import CharityService from '@/stores/charity'
import ListTable from './components/common/ListTable.vue'
import TransferBeneficiaryModal from './components/modals/beneficiaries/TransferBeneficiaryModal.vue'

const route = useRoute()
const beneficiaryId = route.params.id

const beneficiary = ref(null)
const settings = ref(null)
const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const showTransferModal = ref(false)

const tabs = [
  { id: 'deliveries', name: 'Deliveries' },
  { id: 'adjustments', name: 'Adjustments' },
]
const activeTab = ref('deliveries')
const showAddDelivery = ref(false)
const showAddAdjustment = ref(false)
const isEditingDelivery = ref(false)
const currentDeliveryId = ref(null)

const activeReleases = computed(() => {
  const all = settings.value?.distributionRelease || []
  // If editing, make sure the current release is in the list even if it's completed
  if (isEditingDelivery.value && newDelivery.distribution_release_id) {
    return all.filter(rel => !rel.is_completed || rel.distribution_release_id === newDelivery.distribution_release_id)
  }
  return all.filter(rel => !rel.is_completed)
})

const newDelivery = reactive({
  distribution_release_id: '',
  is_delivered: true,
  recipt: '',
  is_returned: { reason: '' }
})

// Enforce mutual exclusivity for delivered vs returned
watch(() => newDelivery.is_delivered, (val) => {
  if (val) newDelivery.is_returned.reason = ''
})
watch(() => newDelivery.is_returned.reason, (val) => {
  if (val && val.trim()) newDelivery.is_delivered = false
})

const newAdjustment = reactive({
  type: 'increase',
  amount: 0,
  reason: ''
})

const deliveryColumns = [
  { key: 'distribution_release_date', label: 'Release Date' },
  { key: 'distribution_release_payment_for_indays', label: 'Coverage' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'is_delivered', label: 'Delivered', format: 'boolean' },
  { key: 'is_returned', label: 'Return' },
  { key: 'recipt', label: 'Receipt' },
  { key: 'created_at', label: 'Created At' },
  { key: 'created_by', label: 'Created By' },
  { key: 'updated_by', label: 'Updated By' },
]

const adjustmentColumns = [
  { key: 'created_at', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'reason', label: 'Reason' },
  { key: 'created_by', label: 'By User' },
]

const toasts = ref([])
function addToast(msg, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

const fetchBeneficiary = async () => {
  loading.value = true
  try {
    const res = await CharityService.getBeneficiaryById(beneficiaryId)
    if (res.success) beneficiary.value = res.data
    else error.value = res.error
  } catch (err) {
    error.value = 'Failed to load beneficiary details'
  } finally {
    loading.value = false
  }
}

const fetchSettings = async () => {
  try {
    const res = await CharityService.getSettings()
    if (res.success) settings.value = res.data
  } catch (err) {
    console.error('Failed to fetch settings', err)
  }
}

const openDeliveryModal = (editRow = null) => {
  if (editRow) {
    isEditingDelivery.value = true
    currentDeliveryId.value = editRow.delivery_id
    newDelivery.distribution_release_id = editRow.distribution_release_id
    newDelivery.is_delivered = editRow.is_delivered
    newDelivery.recipt = editRow.recipt || ''
    newDelivery.is_returned.reason = editRow.is_returned?.reason || ''
  } else {
    isEditingDelivery.value = false
    currentDeliveryId.value = null
    newDelivery.distribution_release_id = ''
    newDelivery.is_delivered = true
    newDelivery.recipt = ''
    newDelivery.is_returned.reason = ''
  }
  showAddDelivery.value = true
}

const handleDeliverySubmit = async () => {
  if (!newDelivery.distribution_release_id) return addToast('Please select a release', 'error')
  submitting.value = true
  try {
    const payload = {
      ...newDelivery,
      is_returned: newDelivery.is_returned.reason ? newDelivery.is_returned : null
    }
    
    const res = isEditingDelivery.value
      ? await CharityService.updateDelivery(beneficiaryId, currentDeliveryId.value, payload)
      : await CharityService.addDelivery(beneficiaryId, payload)

    if (res.success) {
      addToast(isEditingDelivery.value ? 'Delivery updated successfully' : 'Delivery recorded successfully')
      showAddDelivery.value = false
      beneficiary.value = res.data
    } else addToast(res.error, 'error')
  } catch (err) { addToast('Failed to save delivery', 'error') }
  finally { submitting.value = false }
}

const handleAddAdjustment = async () => {
  if (!newAdjustment.amount || newAdjustment.amount <= 0) return addToast('Invalid amount', 'error')
  if (!newAdjustment.reason) return addToast('Reason is required', 'error')
  
  submitting.value = true
  try {
    const res = await CharityService.addAdjustment(beneficiaryId, newAdjustment)
    if (res.success) {
      addToast('Adjustment applied successfully')
      showAddAdjustment.value = false
      beneficiary.value = res.data
      newAdjustment.amount = 0
      newAdjustment.reason = ''
    } else addToast(res.error, 'error')
  } catch (err) { addToast('Failed to apply adjustment', 'error') }
  finally { submitting.value = false }
}

const handleTransferSuccess = (data) => {
  addToast(`Beneficiary transferred to ${data.targetTeamName}`)
  beneficiary.value = data.beneficiary
}

onMounted(() => {
  fetchBeneficiary()
  fetchSettings()
})
</script>

<style scoped>
.beneficiary-details { max-width: 1200px; margin: 0 auto; padding: 32px 24px; background: #f5f7fb; min-height: 100vh; }
.details-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; color: #475569; text-decoration: none; }
.header-title { flex: 1; }
.header-title h1 { font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.header-title p { font-size: 14px; color: #64748b; margin: 0; }
.header-actions { display: flex; gap: 12px; }
.header-actions .btn-outline { padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: #475569; font-weight: 500; display: flex; align-items: center; gap: 6px; cursor: pointer; }
.btn-icon-small { width: 14px; height: 14px; }
.summary-card { background: white; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; border: 1px solid #e9edf2; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.summary-item .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
.summary-item .value { font-size: 16px; font-weight: 600; color: #1e293b; }
.allocation-value { color: #6a11cb; background: #f5f3ff; padding: 2px 8px; border-radius: 20px; display: inline-block; }
.bank-acc { font-size: 13px; color: #64748b; font-weight: 400; margin-left: 4px; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge.active { background: #e6f7ee; color: #0d6b36; }
.status-badge.inactive { background: #fef1f1; color: #b91c1c; }
.details-tabs { display: flex; gap: 8px; margin-bottom: 24px; background: white; padding: 4px; border-radius: 12px; width: fit-content; border: 1px solid #e2e8f0; }
.details-tabs button { padding: 8px 24px; border: none; background: transparent; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; color: #64748b; display: flex; align-items: center; gap: 8px; }
.details-tabs button.active { background: #6366f1; color: white; }
.tab-count { background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 20px; font-size: 12px; }
.details-tabs button.active .tab-count { background: rgba(255,255,255,0.2); }
.tab-content { background: white; border-radius: 16px; border: 1px solid #e9edf2; overflow: hidden; }
.tab-pane { padding: 24px; }
.actions-bar { display: flex; justify-content: flex-end; margin-bottom: 20px; }
.btn-primary.small { padding: 8px 16px; font-size: 13px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; cursor: pointer; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 20px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field.full { grid-column: 1 / -1; }
.form-field label { font-size: 13px; font-weight: 500; color: #334155; }
input, select, textarea { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; }
input:disabled, select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; margin-right: 6px; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.return-badge { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
.release-date { font-weight: 600; color: #1e293b; }
.type-badge { padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.type-badge.increase { background: #e0f2fe; color: #0369a1; }
.type-badge.deduct { background: #fee2e2; color: #b91c1c; }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
.loading-state { padding: 40px; text-align: center; color: #64748b; font-size: 16px; }
.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 16px; border-radius: 12px; margin: 24px; text-align: center; }
.error-alert button { margin-top: 8px; padding: 6px 16px; background: #b91c1c; color: white; border: none; border-radius: 6px; cursor: pointer; }

.inactive-warning { display: flex; align-items: center; gap: 12px; background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; font-weight: 500; }
.warning-icon { width: 20px; height: 20px; color: #f59e0b; flex-shrink: 0; }
button:disabled { opacity: 0.5; cursor: not-allowed !important; }
</style>