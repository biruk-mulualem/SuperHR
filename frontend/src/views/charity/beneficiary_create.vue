<template>
  <div class="beneficiary-create">
    <!-- Back header -->
    <div class="create-header">
      <router-link to="/charity/beneficiaries" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </router-link>
      <div class="header-title">
        <h1>{{ isView ? 'View Beneficiary' : isEdit ? 'Edit Beneficiary' : 'Add Beneficiary' }}</h1>
        <p>{{ isView ? 'Beneficiary details (read-only)' : isEdit ? 'Update beneficiary information' : 'Register a new beneficiary' }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading data...</div>
    <div v-else-if="error" class="error-alert">{{ error }} <button @click="initData">Retry</button></div>

    <form v-else @submit.prevent="handleSubmit" class="ben-form">
      <!-- Basic Information (Collapsible) -->
      <div class="form-card">
        <div class="card-header collapsible-header" @click="collapsed.basic = !collapsed.basic">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <h3>Basic Information</h3>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: !collapsed.basic }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="!collapsed.basic" class="card-body">
            <div class="form-field full">
              <label>Full Name <span class="required">*</span></label>
              <input type="text" v-model="form.fullname" placeholder="e.g. Abebe Kebede" :disabled="isView" />
              <span class="error" v-if="errors.fullname">{{ errors.fullname }}</span>
            </div>
            <div class="form-field full">
              <label>Charity Team <span class="required">*</span></label>
              <div class="combobox">
                <input
                  v-if="!selectedTeam"
                  type="text"
                  v-model="teamSearch"
                  @focus="showTeamDropdown = true"
                  @blur="hideDropdown('team')"
                  placeholder="Search team..."
                  :disabled="isView"
                />
                <div v-else class="selected-chip">
                  <div class="chip-avatar">{{ selectedTeam.name[0] }}</div>
                  <span>{{ selectedTeam.name }}</span>
                  <button v-if="!isView" @click="clearTeam" class="clear-btn">×</button>
                </div>
                <div v-if="showTeamDropdown" class="combobox-dropdown">
                  <div v-for="t in filteredTeams" :key="t.teamId" class="dropdown-item" @mousedown.prevent="selectTeam(t)">
                    {{ t.name }}
                  </div>
                  <div v-if="filteredTeams.length === 0" class="dropdown-item empty">No teams found</div>
                </div>
              </div>
              <span class="error" v-if="errors.teamId">{{ errors.teamId }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- Allocation & Payment (Collapsible) -->
      <div class="form-card">
        <div class="card-header collapsible-header" @click="collapsed.allocation = !collapsed.allocation">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 7H7M17 17H7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
            <h3>Allocation & Payment</h3>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: !collapsed.allocation }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="!collapsed.allocation" class="card-body">
            <div class="form-row">
              <div class="form-field">
                <label>Special Case</label>
                <select v-model="form.isSpecialCase" :disabled="isView">
                  <option :value="null">None</option>
                  <option v-for="sc in specialCases" :key="sc" :value="sc">{{ sc }}</option>
                </select>
              </div>
              <div class="form-field">
                <label>Monthly Allocation (ETB) <span class="required">*</span></label>
                <input type="number" step="0.01" v-model.number="form.monthlyAllocation" placeholder="0.00" :disabled="isView" />
              </div>
            </div>
            <div class="form-field full" v-if="form.paymentMethod === 'bank'">
              <div class="form-row">
                <div class="form-field">
                  <label>Bank Name <span class="required">*</span></label>
                  <input type="text" v-model="form.bankInfo.bank" placeholder="e.g. CBE, Dashen" :disabled="isView" />
                  <span class="error" v-if="errors['bankInfo.bank']">{{ errors['bankInfo.bank'] }}</span>
                </div>
                <div class="form-field">
                  <label>Account Number <span class="required">*</span></label>
                  <input type="text" v-model="form.bankInfo.account_no" placeholder="Enter account number" :disabled="isView" />
                  <span class="error" v-if="errors['bankInfo.account_no']">{{ errors['bankInfo.account_no'] }}</span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Location & Contact (Collapsible) -->
      <div class="form-card">
        <div class="card-header collapsible-header" @click="collapsed.location = !collapsed.location">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.66 17.66a8 8 0 1 0-11.32 0L12 22l5.66-4.34z"/><circle cx="12" cy="10" r="3"/></svg>
            <h3>Location & Contact</h3>
            <span class="optional-badge">Optional</span>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: !collapsed.location }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="!collapsed.location" class="card-body">
            <div class="form-row">
              <div class="form-field">
                <label>Region</label>
                <input type="text" v-model="form.fullInfo.location.region" placeholder="e.g. Addis Ababa" :disabled="isView" />
              </div>
              <div class="form-field">
                <label>City</label>
                <input type="text" v-model="form.fullInfo.location.city" placeholder="e.g. Addis Ababa" :disabled="isView" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Woreda</label>
                <input type="text" v-model="form.fullInfo.location.woreda" placeholder="e.g. Bole" :disabled="isView" />
              </div>
              <div class="form-field">
                <label>Phone</label>
                <input type="tel" v-model="form.fullInfo.contact.phone" placeholder="+251 9..." :disabled="isView" />
              </div>
            </div>
            <div class="form-field full">
              <label>Email</label>
              <input type="email" v-model="form.fullInfo.contact.email" placeholder="contact@example.com" :disabled="isView" />
            </div>
          </div>
        </transition>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/beneficiaries" class="btn-outline">{{ isView ? 'Back to List' : 'Cancel' }}</router-link>
        <button v-if="!isView" type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : isEdit ? 'Update Beneficiary' : 'Create Beneficiary' }}
        </button>
      </div>
    </form>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="confirm.show"
      :title="confirm.title"
      :message="confirm.message"
      :type="confirm.type"
      :loading="isSubmitting"
      @close="confirm.show = false"
      @confirm="processSubmit"
    />

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CharityService from '@/stores/charity'
import ConfirmationModal from './components/modals/ConfirmationModal.vue'

const router = useRouter()
const route  = useRoute()

const isEdit = computed(() => !!route.params.id && route.path.includes('edit'))
const isView = computed(() => !!route.params.id && !route.path.includes('edit'))

const loading = ref(true)
const error = ref(null)

// ── Confirmation state ────────────────────────────────────────────────
const confirm = reactive({
  show: false,
  title: '',
  message: '',
  type: 'primary'
})

// Collapsible state
const collapsed = reactive({
  basic: false,
  allocation: false,
  location: false,
})

// ── Teams for dropdown ──────────────────────────────────────────────────
const teams = ref([])
const teamSearch = ref('')
const showTeamDropdown = ref(false)

const filteredTeams = computed(() => {
  const q = teamSearch.value.toLowerCase()
  return teams.value.filter(t => t.name.toLowerCase().includes(q))
})

const selectedTeam = computed(() => teams.value.find(t => t.teamId === form.teamId))

const selectTeam = (team) => {
  form.teamId = team ? team.teamId : null
  teamSearch.value = ''
  showTeamDropdown.value = false
}

const clearTeam = () => {
  form.teamId = null
  teamSearch.value = ''
}

const hideDropdown = (type) => {
  setTimeout(() => {
    if (type === 'team') showTeamDropdown.value = false
  }, 200)
}

// ── Form ──────────────────────────────────────────────────────────────
const specialCases = ref([])
const form = reactive({
  fullname: '',
  teamId: null,
  monthlyAllocation: 0,
  paymentMethod: 'bank',
  bankInfo: { account_no: '', bank: '' },
  isSpecialCase: null,
  fullInfo: {
    location: { region: '', city: '', woreda: '' },
    contact: { phone: '', email: '' },
  },
})

const errors = ref({})
const isSubmitting = ref(false)
const toasts = ref([])

const initData = async () => {
  loading.value = true
  error.value = null
  try {
    const [teamsRes, settingsRes] = await Promise.all([
      CharityService.getTeams({ size: 200, isActive: true }),
      CharityService.getSettings()
    ])

    if (teamsRes.success) teams.value = teamsRes.data
    
    if (settingsRes.success) {
      specialCases.value = settingsRes.data.defaults.beneficiaries_special_cases || []
      if (!isEdit.value && !isView.value) {
        // Set defaults for new beneficiary
        form.monthlyAllocation = settingsRes.data.defaults.monthly_allocation
        form.paymentMethod = settingsRes.data.defaults.payment_method
      }
    }

    if (isEdit.value || isView.value) {
      const benRes = await CharityService.getBeneficiaryById(route.params.id)
      if (benRes.success) {
        const b = benRes.data
        form.fullname = b.fullname
        form.teamId = b.teamId
        form.monthlyAllocation = b.monthlyAllocation
        form.paymentMethod = b.paymentMethod
        form.isSpecialCase = b.isSpecialCase
        if (b.bankInfo) form.bankInfo = { ...b.bankInfo }
        if (b.fullInfo) {
           if (b.fullInfo.location) form.fullInfo.location = { ...b.fullInfo.location }
           if (b.fullInfo.contact) form.fullInfo.contact = { ...b.fullInfo.contact }
        }
      } else {
        error.value = benRes.error
      }
    }
  } catch (err) {
    error.value = 'Failed to load initial data'
  } finally {
    loading.value = false
  }
}

// ── Validation ────────────────────────────────────────────────────────
const validateForm = () => {
  const newErrors = {}
  if (!form.fullname?.trim()) newErrors.fullname = 'Full name is required'
  if (!form.teamId) newErrors.teamId = 'Team is mandatory'
  if (form.paymentMethod === 'bank') {
    if (!form.bankInfo.bank?.trim()) newErrors['bankInfo.bank'] = 'Bank name is required'
    if (!form.bankInfo.account_no?.trim()) newErrors['bankInfo.account_no'] = 'Account number is required'
  }
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// ── Submit ────────────────────────────────────────────────────────────
const handleSubmit = () => {
  if (!validateForm()) return
  
  confirm.show = true
  confirm.title = isEdit.value ? 'Update Beneficiary' : 'Create Beneficiary'
  confirm.message = `Are you sure you want to ${isEdit.value ? 'update' : 'register'} the beneficiary "${form.fullname}"?`
  confirm.type = isEdit.value ? 'warning' : 'primary'
}

const processSubmit = async () => {
  isSubmitting.value = true

  try {
    const res = isEdit.value 
      ? await CharityService.updateBeneficiary(route.params.id, form)
      : await CharityService.createBeneficiary(form)

    if (res.success) {
      addToast(`✅ Beneficiary "${form.fullname}" ${isEdit.value ? 'updated' : 'created'} successfully!`)
      confirm.show = false
      setTimeout(() => router.push('/charity/beneficiaries'), 1500)
    } else {
      addToast(res.error, 'error')
    }
  } catch (err) {
    addToast('An unexpected error occurred', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const addToast = (msg, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.beneficiary-create { max-width: 900px; margin: 0 auto; padding: 32px 24px; background: #f5f7fb; min-height: 100vh; }
.create-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; color: #475569; text-decoration: none; }
.back-btn svg { width: 18px; height: 18px; }
.header-title h1 { font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.header-title p { font-size: 14px; color: #64748b; margin: 0; }

.ben-form { display: flex; flex-direction: column; gap: 20px; }
.form-card { background: white; border-radius: 16px; border: 1px solid #e9edf2; position: relative; }
.card-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #fafcfc; border-bottom: 1px solid #e9edf2; border-top-left-radius: 16px; border-top-right-radius: 16px; }
.card-header svg { width: 18px; height: 18px; color: #6366f1; }
.card-header h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
.optional-badge { margin-left: auto; font-size: 11px; padding: 2px 8px; background: #e2e8f0; color: #64748b; border-radius: 20px; }
.card-body { padding: 20px; overflow: visible; }

/* Collapsible header */
.card-header.collapsible-header {
  cursor: pointer;
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-right .collapse-chevron { width: 20px; height: 20px; transition: transform 0.3s ease; color: #94a3b8; }
.collapse-chevron.rotated { transform: rotate(180deg); }

/* Collapse transition */
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease; max-height: 3000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
.form-row:last-child { margin-bottom: 0; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field.full { width: 100%; margin-bottom: 16px; }
.form-field label { font-size: 13px; font-weight: 500; color: #334155; }
.required { color: #ef4444; }
input, select { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; transition: all 0.2s; background: white; }
input:focus, select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
input:disabled, select:disabled { background: #f8fafc; color: #94a3b8; }
.error { font-size: 11px; color: #ef4444; }

.combobox { position: relative; z-index: 60; }
.selected-chip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; color: #6d28d9; font-weight: 600; }
.chip-avatar { width: 24px; height: 24px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.clear-btn { background: none; border: none; color: #ef4444; font-size: 18px; cursor: pointer; padding: 0 4px; }
.combobox-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.dropdown-item { padding: 10px 16px; font-size: 14px; cursor: pointer; }
.dropdown-item:hover { background: #f1f5f9; }
.dropdown-item.empty { color: #94a3b8; font-style: italic; cursor: default; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; }
.btn-outline { padding: 10px 24px; border-radius: 10px; background: white; border: 1px solid #e2e8f0; color: #475569; text-decoration: none; cursor: pointer; font-weight: 500; }
.btn-primary { padding: 10px 24px; border-radius: 10px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; font-weight: 500; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

.loading-state { padding: 40px; text-align: center; color: #64748b; font-size: 16px; }
.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 16px; border-radius: 12px; text-align: center; }
.error-alert button { margin-top: 8px; padding: 6px 16px; background: #b91c1c; color: white; border: none; border-radius: 6px; cursor: pointer; }

@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
</style>