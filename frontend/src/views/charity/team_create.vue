<template>
  <div class="team-create">
    <!-- Back header -->
    <div class="create-header">
      <router-link to="/charity/teams" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
      </router-link>
      <div class="header-title">
        <h1>{{ isView ? 'View Team' : isEdit ? 'Edit Team' : 'Create Charity Team' }}</h1>
        <p>{{ isView ? 'Viewing team details (Read-only)' : isEdit ? 'Update team information and leadership' : 'Form a new team and assign leaders' }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading team data...</div>
    <div v-else-if="error" class="error-alert">{{ error }} <button @click="loadInitialData">Retry</button></div>

    <form v-else @submit.prevent="handleSubmit" class="team-form">
      <!-- Basic Info (Collapsible) -->
      <div class="form-card">
        <div class="card-header collapsible-header" @click="collapsed.identity = !collapsed.identity">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3>Team Identity</h3>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: !collapsed.identity }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="!collapsed.identity" class="card-body">
            <div class="form-field full">
              <label>Team Name <span class="required">*</span></label>
              <input type="text" v-model="form.name" placeholder="e.g. Addis Hope Team" :disabled="isView" />
              <span class="error" v-if="errors.name">{{ errors.name }}</span>
            </div>
            <div class="form-field full">
              <label>Description</label>
              <textarea v-model="form.description" rows="3" placeholder="What is the mission of this team?" :disabled="isView"></textarea>
            </div>
          </div>
        </transition>
      </div>

      <!-- Members (Collapsible) -->
      <div class="form-card">
        <div class="card-header collapsible-header" @click="collapsed.members = !collapsed.members">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
            <h3>Team Members</h3>
            <span class="count-badge">{{ form.members.length }} members</span>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: !collapsed.members }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="!collapsed.members" class="card-body">
            <div v-if="!isView" class="member-search-bar">
              <div class="combobox full">
                <input type="text" v-model="memberSearch" @focus="showMemberDropdown = true" @blur="hideDropdown('member')" placeholder="Search and add employees to team..." />
                <div v-if="showMemberDropdown" class="combobox-dropdown">
                  <div v-if="loadingEmps" class="dropdown-item loading">Loading employees...</div>
                  <template v-else>
                    <div v-for="emp in filteredMembers" :key="emp.id" class="dropdown-item" @mousedown.prevent="addMember(emp)">{{ emp.fullName }}</div>
                    <div v-if="filteredMembers.length === 0" class="dropdown-item empty">No results found</div>
                  </template>
                </div>
              </div>
            </div>
            <div class="members-grid" v-if="form.members.length > 0">
              <div v-for="mId in form.members" :key="mId" class="member-card">
                <div class="m-avatar">{{ getEmployeeName(mId)[0] }}</div>
                <div class="m-info"><span class="m-name">{{ getEmployeeName(mId) }}</span><span class="m-role">Member</span></div>
                <button v-if="!isView" @click="removeMember(mId)" class="m-remove">×</button>
              </div>
            </div>
            <div v-else class="empty-members"><p>No members added to this team yet. Add members first to pick leaders.</p></div>
          </div>
        </transition>
      </div>

      <!-- Leadership (Collapsible) -->
      <div class="form-card">
        <div class="card-header collapsible-header" @click="collapsed.leadership = !collapsed.leadership">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <h3>Team Leadership</h3>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: !collapsed.leadership }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="!collapsed.leadership" class="card-body">
            <div class="form-row">
              <div class="form-field">
                <label>Team Head <span class="required">*</span></label>
                <div class="combobox">
                  <input v-if="!selectedHead" type="text" v-model="headSearch" @focus="showHeadDropdown = true" @blur="hideDropdown('head')" placeholder="Pick from members..." :disabled="isView || form.members.length === 0" />
                  <div v-else class="selected-chip"><div class="chip-avatar">{{ selectedHead.fullName[0] }}</div><span>{{ selectedHead.fullName }}</span><button v-if="!isView" @click="clearLeadership('head')" class="clear-btn">×</button></div>
                  <div v-if="showHeadDropdown" class="combobox-dropdown">
                    <div v-for="emp in filteredHeads" :key="emp.id" class="dropdown-item" @mousedown.prevent="selectLeadership('head', emp)">{{ emp.fullName }}</div>
                    <div v-if="filteredHeads.length === 0" class="dropdown-item empty">{{ form.members.length === 0 ? 'Add members first' : 'No members found' }}</div>
                  </div>
                </div>
                <span class="error" v-if="errors.head">{{ errors.head }}</span>
              </div>
              <div class="form-field">
                <label>Vice Head</label>
                <div class="combobox">
                  <input v-if="!selectedVice" type="text" v-model="viceSearch" @focus="showViceDropdown = true" @blur="hideDropdown('vice')" placeholder="Pick from members..." :disabled="isView || form.members.length === 0" />
                  <div v-else class="selected-chip vice"><div class="chip-avatar">{{ selectedVice.fullName[0] }}</div><span>{{ selectedVice.fullName }}</span><button v-if="!isView" @click="clearLeadership('vice')" class="clear-btn">×</button></div>
                  <div v-if="showViceDropdown" class="combobox-dropdown">
                    <div v-for="emp in filteredVices" :key="emp.id" class="dropdown-item" @mousedown.prevent="selectLeadership('vice', emp)">{{ emp.fullName }}</div>
                    <div v-if="filteredVices.length === 0" class="dropdown-item empty">{{ form.members.length === 0 ? 'Add members first' : 'No members found' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Beneficiaries (Collapsible, only for existing team) -->
      <div class="form-card" v-if="isEdit || isView">
        <div class="card-header collapsible-header" @click="collapsed.beneficiaries = !collapsed.beneficiaries">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3>Assigned Beneficiaries</h3>
            <span class="count-badge">{{ beneficiaries.length }} beneficiaries</span>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: !collapsed.beneficiaries }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="!collapsed.beneficiaries" class="card-body">
            <FilterBar
              v-model:search="benSearch"
              search-placeholder="Search beneficiaries..."
              @clear="benSearch = ''"
            />
            
            <ListTable
              :columns="benColumns"
              :rows="beneficiaries"
              row-key="beneficiaryId"
              :loading="loadingBeneficiaries"
              :pagination="null"
            >
              <template #cell-fullname="{ row }">
                <router-link :to="`/charity/beneficiaries/${row.beneficiaryId}/details`" class="ben-link">
                  {{ row.fullname }}
                </router-link>
              </template>
              <template #cell-monthlyAllocation="{ value }">
                <strong>{{ CharityService.formatCurrency(value) }}</strong>
              </template>
              <template #cell-isActive="{ value }">
                <span :class="['lt-badge', value ? 'lt-badge--active' : 'lt-badge--inactive']">
                  {{ value ? 'Active' : 'Inactive' }}
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
          </div>
        </transition>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/teams" class="btn-outline">{{ isView ? 'Back to List' : 'Cancel' }}</router-link>
        <button v-if="!isView" type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : isEdit ? 'Update Team' : 'Create Team' }}
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CharityService from '@/stores/charity'
import FilterBar from './components/common/FilterBar.vue'
import ListTable from './components/common/ListTable.vue'
import ConfirmationModal from './components/modals/ConfirmationModal.vue'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id && route.path.includes('edit'))
const isView = computed(() => !!route.params.id && !route.path.includes('edit'))

const loading = ref(true)
const loadingBeneficiaries = ref(false)
const error = ref<string | null>(null)

// ── Confirmation state ────────────────────────────────────────────────
const confirm = reactive({
  show: false,
  title: '',
  message: '',
  type: 'primary' as 'primary' | 'danger' | 'warning'
})

// ── Collapsible state ─────────────────────────────────────────────────
const collapsed = reactive({
  identity: false,
  members: false,
  leadership: false,
  beneficiaries: false,
})

// ── Form state ────────────────────────────────────────────────────────
const form = ref({
  name: '',
  description: '',
  head: null as number | null,
  vice: null as number | null,
  members: [] as number[],
  isActive: true
})

const beneficiaries = ref<any[]>([])
const benSearch = ref('')
const errors = ref({ name: '', head: '' })
const isSubmitting = ref(false)
const loadingEmps = ref(false)
const toasts = ref<any[]>([])

// Employee data
const employees = ref<any[]>([])
const headSearch = ref('')
const viceSearch = ref('')
const memberSearch = ref('')
const showHeadDropdown = ref(false)
const showViceDropdown = ref(false)
const showMemberDropdown = ref(false)

const selectedHead = computed(() => employees.value.find(e => e.id === form.value.head))
const selectedVice = computed(() => employees.value.find(e => e.id === form.value.vice))

const currentMembers = computed(() => {
  return employees.value.filter(e => form.value.members.includes(e.id))
})

const filteredHeads = computed(() => {
  const q = headSearch.value.toLowerCase()
  return currentMembers.value.filter(e => e.fullName.toLowerCase().includes(q) && e.id !== form.value.vice)
})
const filteredVices = computed(() => {
  const q = viceSearch.value.toLowerCase()
  return currentMembers.value.filter(e => e.fullName.toLowerCase().includes(q) && e.id !== form.value.head)
})
const filteredMembers = computed(() => {
  const q = memberSearch.value.toLowerCase()
  return employees.value.filter(e =>
    e.fullName.toLowerCase().includes(q) &&
    !form.value.members.includes(e.id)
  )
})

const benColumns = [
  { key: 'fullname', label: 'Full Name' },
  { key: 'monthlyAllocation', label: 'Allocation' },
  { key: 'paymentMethod', label: 'Payment', format: 'badge' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: 'Actions', width: '100px' },
]

const fetchBeneficiaries = async () => {
  if (!route.params.id) return
  loadingBeneficiaries.value = true
  try {
    const res = await CharityService.getBeneficiaries({
      teamId: Number(route.params.id),
      search: benSearch.value,
      size: 500
    })
    if (res.success) beneficiaries.value = res.data
  } catch (err) {
    console.error('Failed to fetch beneficiaries', err)
  } finally {
    loadingBeneficiaries.value = false
  }
}

// Watch for search changes
let searchTimeout: any
watch(benSearch, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchBeneficiaries, 500)
})

const loadInitialData = async () => {
  loading.value = true
  error.value = null
  try {
    const empRes = await CharityService.getEmployeesForDropdown()
    if (empRes.success) employees.value = empRes.data

    if (isEdit.value || isView.value) {
      const res = await CharityService.getTeamById(route.params.id as string)
      if (res.success) {
        const team = res.data
        form.value.name = team.name
        form.value.description = team.description
        form.value.head = team.head
        form.value.vice = team.vice
        form.value.members = team.members || []
        form.value.isActive = team.isActive
        
        await fetchBeneficiaries()
      } else {
        error.value = res.error
      }
    }
  } catch (err) {
    error.value = 'Failed to load team data'
  } finally {
    loading.value = false
  }
}

const getEmployeeName = (id: number) => {
  return employees.value.find(e => e.id === id)?.fullName || 'Loading...'
}

const selectLeadership = (role: 'head' | 'vice', emp: any) => {
  if (role === 'head') { form.value.head = emp.id; showHeadDropdown.value = false; errors.value.head = '' }
  else { form.value.vice = emp.id; showViceDropdown.value = false }
}

const clearLeadership = (role: 'head' | 'vice') => {
  if (role === 'head') { form.value.head = null; headSearch.value = '' }
  else { form.value.vice = null; viceSearch.value = '' }
}

const addMember = (emp: any) => {
  form.value.members.push(emp.id)
  memberSearch.value = ''
  showMemberDropdown.value = false
}

const removeMember = (id: number) => {
  form.value.members = form.value.members.filter(mId => mId !== id)
  // If member was head or vice, clear it
  if (form.value.head === id) form.value.head = null
  if (form.value.vice === id) form.value.vice = null
}

const hideDropdown = (type: string) => {
  setTimeout(() => {
    if (type === 'head') showHeadDropdown.value = false
    if (type === 'vice') showViceDropdown.value = false
    if (type === 'member') showMemberDropdown.value = false
  }, 250)
}

const addToast = (message: string, type: string = 'success') => {
  const tId = Date.now()
  toasts.value.push({ id: tId, message, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== tId), 5000)
}

const handleSubmit = () => {
  errors.value = { name: '', head: '' }
  if (!form.value.name.trim()) errors.value.name = 'Team name is required'
  if (!form.value.head) errors.value.head = 'Team head is required'
  if (errors.value.name || errors.value.head) return

  confirm.show = true
  confirm.title = isEdit.value ? 'Update Team' : 'Create Team'
  confirm.message = `Are you sure you want to ${isEdit.value ? 'update' : 'create'} the team "${form.value.name}"?`
  confirm.type = isEdit.value ? 'warning' : 'primary'
}

const processSubmit = async () => {
  isSubmitting.value = true
  try {
    const res = isEdit.value
      ? await CharityService.updateTeam(Number(route.params.id), form.value)
      : await CharityService.createTeam(form.value)

    if (res.success) {
      addToast(isEdit.value ? 'Team updated successfully!' : 'Team created successfully!')
      confirm.show = false
      setTimeout(() => router.push('/charity/teams'), 1500)
    } else {
      addToast(res.error || 'Failed to save team', 'error')
    }
  } catch (err) {
    addToast('An unexpected error occurred', 'error')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadInitialData)
</script>

<style scoped>
.team-create { max-width: 1000px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; min-height: 100vh; }
.create-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.back-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #64748b; text-decoration: none; }
.header-title h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.header-title p { font-size: 14px; color: #64748b; margin-top: 4px; }

.team-form { display: flex; flex-direction: column; gap: 24px; }
.form-card { background: white; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; position: relative; overflow: visible; }
.card-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: #fafcfd; border-bottom: 1px solid #f1f5f9; border-top-left-radius: 20px; border-top-right-radius: 20px; }
.card-header svg { width: 20px; height: 20px; color: #6a11cb; }
.card-header h3 { font-size: 16px; font-weight: 700; color: #334155; margin: 0; }
.count-badge { margin-left: auto; font-size: 12px; padding: 4px 12px; background: #eff6ff; color: #2563eb; border-radius: 20px; font-weight: 600; }
.card-body { padding: 24px; overflow: visible; }

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

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.form-field { display: flex; flex-direction: column; gap: 8px; }
.form-field.full { width: 100%; margin-bottom: 16px; }
.form-field label { font-size: 13px; font-weight: 600; color: #475569; }
.required { color: #ef4444; }

input, textarea, select { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; }
input:focus, textarea:focus { border-color: #6a11cb; box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1); }
input:disabled, textarea:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

.combobox { position: relative; z-index: 60; }
.selected-chip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; color: #6d28d9; font-weight: 600; }
.selected-chip.vice { background: #fefce8; border-color: #fef08a; color: #a16207; }
.chip-avatar { width: 24px; height: 24px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.clear-btn { background: none; border: none; color: #ef4444; font-size: 18px; cursor: pointer; padding: 0 4px; }

.combobox-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.dropdown-item { padding: 10px 16px; font-size: 14px; cursor: pointer; }
.dropdown-item:hover { background: #f1f5f9; }
.dropdown-item.loading, .dropdown-item.empty { color: #94a3b8; font-style: italic; cursor: default; }

.member-search-bar { margin-bottom: 24px; }
.members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.member-card { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; position: relative; }
.m-avatar { width: 36px; height: 36px; border-radius: 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #475569; }
.m-info { display: flex; flex-direction: column; }
.m-name { font-size: 13px; font-weight: 700; color: #334155; }
.m-role { font-size: 11px; color: #94a3b8; }
.m-remove { position: absolute; right: 8px; top: 8px; width: 20px; height: 20px; border-radius: 50%; border: none; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; opacity: 0; transition: opacity 0.2s; }
.member-card:hover .m-remove { opacity: 1; }

.empty-members { text-align: center; padding: 32px; border: 2px dashed #f1f5f9; border-radius: 16px; color: #94a3b8; font-size: 14px; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
.btn-outline { padding: 12px 28px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; color: #64748b; font-weight: 600; text-decoration: none; }
.btn-primary { padding: 12px 32px; border-radius: 12px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(106, 17, 203, 0.2); }
.btn-primary:disabled { opacity: 0.6; }

.error { font-size: 12px; color: #ef4444; margin-top: 4px; font-weight: 500; }

.ben-link { color: #6a11cb; font-weight: 600; text-decoration: none; }
.ben-link:hover { text-decoration: underline; }

.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; margin-right: 6px; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.details:hover { border-color: #10b981; color: #10b981; background: #e6f7ee; }

.lt-badge--active { background: #e6f7ee; color: #0d6b36; border: 1px solid #b7e4cf; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
.lt-badge--inactive { background: #fef1f1; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 12px; font-size: 11px; }

.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

.loading-state { padding: 40px; text-align: center; color: #64748b; font-size: 16px; }
.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 16px; border-radius: 12px; text-align: center; }
.error-alert button { margin-top: 8px; padding: 6px 16px; background: #b91c1c; color: white; border: none; border-radius: 6px; cursor: pointer; }

@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
</style>