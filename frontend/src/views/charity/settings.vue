<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <h1>Charity Settings</h1>
      <p>Configure payment schedules and global defaults</p>
    </div>

    <div v-if="loading" class="loading-state">Loading settings...</div>
    <div v-else-if="error" class="error-alert">{{ error }} <button @click="fetchSettings">Retry</button></div>

    <template v-else>
      <!-- Tabs -->
      <div class="settings-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="settings-content">
        <!-- ═══════════════ DISTRIBUTION RELEASES ═══════════════ -->
        <div v-if="activeTab === 'dates'" class="settings-card">
          <div class="card-header">
            <div class="header-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
                <path d="M8 2v4M16 2v4M3 10h18M21 14.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5"/>
              </svg>
              <h3>Distribution Schedule</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="release-form" v-if="canEdit">
              <h4>Add New Release</h4>
              <div class="form-row">
                <div class="form-group">
                  <label>Date</label>
                  <input type="date" v-model="newRelease.date" />
                </div>
                <div class="form-group">
                  <label>Coverage (Days)</label>
                  <input type="number" v-model.number="newRelease.payment_for_indays" min="1" />
                </div>
                <div class="form-group action">
                  <button class="btn-primary small" @click="confirmAddRelease">Add to Schedule</button>
                </div>
              </div>
            </div>

            <div class="history-list">
              <h4>Planned & Past Releases</h4>
              <table class="history-table" v-if="settings.distributionRelease?.length > 0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Coverage</th>
                    <th>Status</th>
                    <th v-if="canEdit">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rel in sortedReleases" :key="rel.distribution_release_id">
                    <td>{{ CharityService.formatDate(rel.date) }}</td>
                    <td>{{ rel.payment_for_indays }} days</td>
                    <td @click="canEdit && confirmToggleCompletion(rel)" :class="{ 'clickable': canEdit }">
                      <span :class="['status-pill', rel.is_completed ? 'completed' : 'pending']">
                        {{ rel.is_completed ? 'Completed' : 'Active' }}
                      </span>
                    </td>
                    <td v-if="canEdit">
                      <div v-if="rel.usageCount > 0" class="usage-locked">
                        You have {{ rel.usageCount }} beneficiary delivery notes on this release date so you can't remove it.
                      </div>
                      <button v-else class="btn-text-danger" @click="confirmRemoveRelease(rel.distribution_release_id)">Remove</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-hint">No distribution releases scheduled.</div>
            </div>
          </div>
        </div>

        <!-- ═══════════════ DEFAULTS ═══════════════ -->
        <div v-if="activeTab === 'defaults'" class="settings-card">
          <div class="card-header">
            <div class="header-left">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <h3>Global Defaults</h3>
            </div>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>Default Monthly Allocation (ETB)</label>
                <input type="number" step="0.01" v-model.number="settings.defaults.monthly_allocation" :disabled="!canEdit" />
              </div>
              <div class="form-group">
                <label>Default Payment Method</label>
                <select v-model="settings.defaults.payment_method" :disabled="!canEdit">
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div class="form-group action" v-if="canEdit">
                <button class="btn-primary small" @click="confirmUpdateDefaults">Update Defaults</button>
              </div>
            </div>

            <!-- Special Cases Management -->
            <div class="special-cases-section">
              <h4>Beneficiary Special Cases</h4>
              <p class="section-desc">Managed categories for flagging specific beneficiary needs (e.g. Elderly, Disabled).</p>
              
              <div class="tags-container" v-if="settings.defaults.beneficiaries_special_cases?.length > 0">
                <div v-for="(sc, idx) in settings.defaults.beneficiaries_special_cases" :key="idx" class="tag">
                  <span>{{ sc }}</span>
                  <button v-if="canEdit" @click="removeSpecialCase(idx)" class="tag-remove">×</button>
                </div>
              </div>
              <div v-else class="empty-tags">No special cases defined.</div>

              <div class="add-tag-form" v-if="canEdit">
                <input 
                  type="text" 
                  v-model="newSpecialCase" 
                  placeholder="Add new category..." 
                  @keyup.enter="addSpecialCase"
                />
                <button @click="addSpecialCase" class="btn-add-tag">+</button>
              </div>
            </div>

            <div class="audit-info" v-if="settings.lastUpdatedBy">
              Last updated by {{ settings.lastUpdatedBy.fullName }} on {{ CharityService.formatDate(settings.updatedAt) }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="confirm.show"
      :title="confirm.title"
      :message="confirm.message"
      :type="confirm.type"
      :loading="confirm.loading"
      @close="confirm.show = false"
      @confirm="handleConfirm"
    />

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted,watch } from 'vue'
import CharityService from '@/stores/charity'
import { useAuthStore } from '@/stores/auth'
import ConfirmationModal from './components/modals/ConfirmationModal.vue'

const authStore = useAuthStore()
const canEdit = computed(() => ['admin', 'charity_admin'].includes(authStore.user?.role))

const tabs = [
  { id: 'dates', name: 'Distribution Schedule' },
  { id: 'defaults', name: 'Defaults' },
]

const activeTab = ref('dates')
const loading = ref(true)
const error = ref(null)
const toasts = ref([])

const settings = ref({
  distributionRelease: [],
  defaults: { monthly_allocation: 3000, payment_method: 'bank', beneficiaries_special_cases: [] }
})

const newRelease = reactive({
  date: '',
  payment_for_indays: 30
})

const newSpecialCase = ref('')

const addSpecialCase = () => {
  const val = newSpecialCase.value.trim()
  if (!val) return
  
  if (!settings.value.defaults.beneficiaries_special_cases) {
    settings.value.defaults.beneficiaries_special_cases = []
  }

  if (settings.value.defaults.beneficiaries_special_cases.includes(val)) {
    return addToast('This category already exists', 'error')
  }
  settings.value.defaults.beneficiaries_special_cases.push(val)
  newSpecialCase.value = ''
}

const removeSpecialCase = (index) => {
  settings.value.defaults.beneficiaries_special_cases.splice(index, 1)
}

// Auto-calculate coverage days when date changes
watch(() => newRelease.date, (newDate) => {
  if (!newDate) return
  
  // Find the latest release with at least one delivery note (usageCount > 0)
  const usedReleases = (settings.value.distributionRelease || [])
    .filter(r => (r.usageCount || 0) > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (usedReleases.length > 0) {
    const lastDate = new Date(usedReleases[0].date)
    const current = new Date(newDate)
    
    // Calculate difference in days
    const diffMs = current - lastDate
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays > 0) {
      newRelease.payment_for_indays = diffDays
    }
  }
})

const confirm = reactive({
  show: false,
  title: '',
  message: '',
  type: 'primary',
  loading: false,
  action: null,
  payload: null
})

const sortedReleases = computed(() => {
  return [...(settings.value.distributionRelease || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const fetchSettings = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await CharityService.getSettings()
    if (res.success) settings.value = res.data
    else error.value = res.error
  } catch (err) {
    error.value = 'Failed to load settings'
  } finally {
    loading.value = false
  }
}

const confirmAddRelease = () => {
  if (!newRelease.date) return addToast('Please select a date', 'error')
  
  // Check for uncompleted releases
  const hasUncompleted = settings.value.distributionRelease?.some(r => !r.is_completed)
  if (hasUncompleted) {
    return addToast('Please complete all existing releases before adding a new one.', 'error')
  }

  confirm.show = true
  confirm.title = 'Add Distribution Release'
  confirm.message = `Are you sure you want to add a new distribution release for ${CharityService.formatDate(newRelease.date)}?`
  confirm.type = 'primary'
  confirm.action = 'addRelease'
}

const confirmToggleCompletion = (rel) => {
  confirm.show = true
  confirm.title = rel.is_completed ? 'Re-activate Release' : 'Complete Release'
  confirm.message = `Are you sure you want to mark this release as ${rel.is_completed ? 'Active' : 'Completed'}?`
  confirm.type = rel.is_completed ? 'warning' : 'primary'
  confirm.action = 'toggleCompletion'
  confirm.payload = rel.distribution_release_id
}

const confirmRemoveRelease = (id) => {
  const rel = settings.value.distributionRelease.find(r => r.distribution_release_id === id)
  confirm.show = true
  confirm.title = 'Remove Distribution Release'
  confirm.message = `Are you sure you want to remove the distribution release for ${CharityService.formatDate(rel.date)}?`
  confirm.type = 'danger'
  confirm.action = 'removeRelease'
  confirm.payload = id
}

const confirmUpdateDefaults = () => {
  confirm.show = true
  confirm.title = 'Update Global Defaults'
  confirm.message = 'Are you sure you want to update the global default settings for all beneficiaries?'
  confirm.type = 'warning'
  confirm.action = 'updateDefaults'
}

const handleConfirm = async () => {
  confirm.loading = true
  try {
    let updatedSettings = { ...settings.value }
    
    if (confirm.action === 'addRelease') {
      updatedSettings.distributionRelease.push({
        distribution_release_id: Date.now(),
        date: newRelease.date,
        payment_for_indays: newRelease.payment_for_indays,
        is_completed: false
      })
    } else if (confirm.action === 'removeRelease') {
      updatedSettings.distributionRelease = updatedSettings.distributionRelease.filter(r => r.distribution_release_id !== confirm.payload)
    } else if (confirm.action === 'toggleCompletion') {
      updatedSettings.distributionRelease = updatedSettings.distributionRelease.map(r => 
        r.distribution_release_id === confirm.payload ? { ...r, is_completed: !r.is_completed } : r
      )
    }
    // For updateDefaults, settings.value is already reactive and bound to inputs

    const res = await CharityService.updateSettings(updatedSettings)
    if (res.success) {
      settings.value = res.data
      addToast('Settings updated successfully')
      if (confirm.action === 'addRelease') {
        newRelease.date = ''
      }
      confirm.show = false
    } else {
      addToast(res.error, 'error')
    }
  } catch (err) {
    addToast('Failed to update settings', 'error')
  } finally {
    confirm.loading = false
  }
}

const addToast = (msg, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.settings-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.settings-header { margin-bottom: 24px; }
.settings-header h1 { font-size: 24px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.settings-header p { color: #64748b; font-size: 14px; }
.settings-tabs { display: flex; gap: 8px; margin-bottom: 24px; background: white; padding: 4px; border-radius: 12px; width: fit-content; border: 1px solid #e2e8f0; }
.settings-tabs button { padding: 8px 24px; border: none; background: transparent; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; color: #64748b; }
.settings-tabs button.active { background: #6366f1; color: white; }
.settings-card { background: white; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid #f1f5f9; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #fafcfd; border-bottom: 1px solid #f1f5f9; }
.header-left { display: flex; align-items: center; gap: 12px; }
.header-icon { width: 22px; height: 22px; color: #6a11cb; }
.card-header h3 { font-size: 16px; font-weight: 700; color: #334155; margin: 0; }
.card-body { padding: 24px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 20px; margin-bottom: 20px; align-items: flex-end; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.form-group input, .form-group select { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
.release-form { background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
.release-form h4 { margin: 0 0 12px; font-size: 14px; color: #1e293b; }
.history-list h4 { font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 12px; }
.history-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.history-table th, .history-table td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
.history-table th { font-weight: 600; color: #475569; background: #f8fafc; }
.btn-save { padding: 8px 18px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(106,17,203,0.2); }
.btn-primary.small { padding: 10px 16px; background: #6366f1; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-text-danger { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 13px; padding: 4px; }
.usage-locked { font-size: 12px; color: #f59e0b; font-style: italic; max-width: 250px; line-height: 1.4; }

.status-pill { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }
.status-pill.completed { background: #e6f7ee; color: #0d6b36; border: 1px solid #b7e4cf; }
.status-pill.pending { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.clickable { cursor: pointer; }

/* Special Cases Styles */
.special-cases-section { margin-top: 32px; padding-top: 24px; border-top: 1px dashed #e2e8f0; }
.special-cases-section h4 { margin: 0 0 8px; font-size: 15px; color: #1e293b; }
.section-desc { font-size: 13px; color: #64748b; margin: 0 0 20px; }

.tags-container { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
.tag { display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 6px 12px; border-radius: 10px; font-size: 13px; color: #475569; border: 1px solid #e2e8f0; }
.tag-remove { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 0; line-height: 1; }
.tag-remove:hover { color: #ef4444; }
.empty-tags { font-size: 13px; color: #94a3b8; font-style: italic; margin-bottom: 20px; }

.add-tag-form { display: flex; gap: 10px; max-width: 400px; }
.add-tag-form input { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; }
.btn-add-tag { width: 40px; height: 40px; border-radius: 10px; background: #6366f1; color: white; border: none; cursor: pointer; font-size: 20px; font-weight: 600; transition: all 0.2s; }
.btn-add-tag:hover { background: #4f46e5; transform: translateY(-1px); }

.audit-info { margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: right; }
.loading-state { padding: 40px; text-align: center; color: #64748b; }
.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 16px; border-radius: 12px; text-align: center; }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
</style>