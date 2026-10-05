<!-- FILE: src/views/tabs/ApprovalSettingsPage.vue -->
<template>
  <div class="approval-settings-page">
    <!-- ============================================================
         HEADER
         ============================================================ -->
    <div class="page-header">
      <div class="header-left">
        <h2>⚙️ Approval Settings</h2>
        <p>Control how item requests are approved across your stores.</p>
      </div>
    </div>

    <!-- ============================================================
         SECTION 1: ASKING STORE GROUP APPROVAL TOGGLE
         ============================================================ -->
    <div
      class="toggle-card"
      :class="{ 'toggle-card--off': !askStoreApprovalEnabled }"
    >
      <div class="toggle-card__left">
        <div class="toggle-card__title">
          <span class="toggle-card__icon">🏪</span>
          <span>Asking Store Group Approval</span>
          <span
            class="toggle-badge"
            :class="askStoreApprovalEnabled ? 'toggle-badge--on' : 'toggle-badge--off'"
          >
            {{ askStoreApprovalEnabled ? 'ACTIVE' : 'BYPASSED' }}
          </span>
        </div>
        <p class="toggle-card__desc">
          When <strong>enabled</strong>, the asking store's groups approve a request
          <em>before</em> it reaches the supplying store.
          When <strong>disabled</strong>, requests go straight to the supplying store.
        </p>
        <div v-if="loadingAskToggle" class="toggle-hint toggle-hint--loading">
          ⏳ Loading…
        </div>
        <div
          v-else-if="!askStoreApprovalEnabled"
          class="toggle-hint toggle-hint--warn"
        >
          ⚠️ <strong>Stage 1 is bypassed.</strong> New requests skip asking-store
          group approval.
        </div>
        <div v-else class="toggle-hint toggle-hint--ok">
          ✅ <strong>Stage 1 is active.</strong> Asking-store groups approve first.
        </div>
      </div>

      <div class="toggle-card__right">
        <label class="switch">
          <input
            type="checkbox"
            :checked="askStoreApprovalEnabled"
            :disabled="loadingAskToggle || savingAskToggle"
            @change="onToggleAskStoreApproval(!askStoreApprovalEnabled)"
          />
          <span class="slider"></span>
        </label>
        <div class="switch-labels">
          <span :class="{ active: askStoreApprovalEnabled }">ON</span>
          <span :class="{ active: !askStoreApprovalEnabled }">OFF</span>
        </div>
        <div v-if="savingAskToggle" class="saving-text">💾 Saving…</div>
      </div>
    </div>

    <!-- ============================================================
         SECTION 2: DEPARTMENT APPROVAL
         ============================================================ -->
    <div class="section-card">
      <!-- Section header -->
      <div class="section-header">
        <div class="section-header__left">
          <h3>
            <span class="section-icon">🏛️</span>
            Department Approval
          </h3>
          <p class="section-subtitle">
            Departments that must approve <strong>asset</strong> requests, per store.
          </p>
        </div>
        <div class="section-header__actions">
          <button
            class="btn-primary"
            :disabled="savingApproval || !hasDepartmentChanges"
            @click="saveApprovalSettings"
          >
            {{ savingApproval ? '💾 Saving…' : '💾 Save Changes' }}
          </button>
          <button
            v-if="approvalConfig.configured"
            class="btn-danger-ghost"
            :disabled="savingApproval"
            @click="removeApprovalDepartment"
          >
            🗑️ Remove All
          </button>
        </div>
      </div>

      <!-- Requires approval toggle -->
      <div class="requires-row">
        <label class="requires-label">Requires Approval</label>
        <div class="segmented">
          <button
            type="button"
            class="segmented__btn"
            :class="{ active: approvalForm.requiresApproval === true }"
            @click="approvalForm.requiresApproval = true"
          >
            Yes
          </button>
          <button
            type="button"
            class="segmented__btn"
            :class="{ active: approvalForm.requiresApproval === false }"
            @click="approvalForm.requiresApproval = false"
          >
            No
          </button>
        </div>
      </div>

      <!-- ============================================================
           TWO-PANEL LAYOUT: Departments | Stores
           ============================================================ -->
      <div class="dual-panel">
        <!-- LEFT: Department list -->
        <div class="panel panel--departments">
          <div class="panel__header">
            <div class="panel__title">
              <span class="panel__icon">🏛️</span>
              <span>Departments</span>
            </div>
            <span class="panel__count">
              {{ selectedDepartments.length }} / {{ departmentsForApproval.length }}
            </span>
          </div>

          <div class="panel__body">
            <div v-if="departmentsForApproval.length === 0" class="empty-inline">
              No active departments found
            </div>

            <ul v-else class="dept-list">
              <li
                v-for="dept in departmentsForApproval"
                :key="dept.departmentId"
                class="dept-row"
                :class="{
                  'dept-row--active': activeDepartmentId === dept.departmentId,
                  'dept-row--selected': isDepartmentSelected(dept.departmentId),
                }"
                @click="setActiveDepartment(dept.departmentId)"
              >
                <label class="dept-checkbox" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isDepartmentSelected(dept.departmentId)"
                    @change="toggleDepartment(dept.departmentId)"
                  />
                  <span class="dept-checkmark"></span>
                </label>
                <div class="dept-row__info">
                  <span class="dept-row__name">{{ dept.name }}</span>
                  <span class="dept-row__code">{{ dept.code }}</span>
                </div>
                <div
                  v-if="isDepartmentSelected(dept.departmentId)"
                  class="dept-row__count"
                >
                  {{ formFor(dept.departmentId).appliesTo.length }}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- RIGHT: Store selection for active department -->
        <div class="panel panel--stores">
          <!-- No active department -->
          <div
            v-if="!activeDepartmentId || !isDepartmentSelected(activeDepartmentId)"
            class="panel__empty"
          >
            <span class="panel__empty-icon">👈</span>
            <p>Select a department on the left to configure its stores</p>
          </div>

          <!-- Active department -->
          <template v-else>
            <div class="panel__header panel__header--stores">
              <div class="panel__title">
                <span class="panel__icon">🏪</span>
                <span>{{ activeDepartment?.name || 'Department' }}</span>
                <span class="panel__code">{{ activeDepartment?.code }}</span>
              </div>
              <div class="panel__actions">
                <button
                  type="button"
                  class="btn-mini btn-mini--ghost"
                  @click="selectAllFor(activeDepartmentId)"
                  :disabled="allStores.length === 0"
                >
                  ✅ Select All
                </button>
                <button
                  type="button"
                  class="btn-mini btn-mini--ghost"
                  @click="deselectAllFor(activeDepartmentId)"
                  :disabled="formFor(activeDepartmentId).appliesTo.length === 0"
                >
                  ⭕ Clear
                </button>
                <button
                  type="button"
                  class="btn-mini btn-mini--danger"
                  @click="toggleDepartment(activeDepartmentId)"
                >
                  ✕ Remove
                </button>
              </div>
            </div>

            <!-- Search bar -->
            <div class="store-search">
              <span class="store-search__icon">🔍</span>
              <input
                v-model="storeSearch"
                type="text"
                placeholder="Search stores by name or code…"
                class="store-search__input"
              />
              <button
                v-if="storeSearch"
                class="store-search__clear"
                @click="storeSearch = ''"
              >
                ✕
              </button>
            </div>

            <!-- Store selection -->
            <div class="store-selection">
              <div class="store-selection__header">
                <span class="store-selection__counter">
                  <strong>{{ formFor(activeDepartmentId).appliesTo.length }}</strong>
                  of {{ allStores.length }} selected
                </span>
              </div>

              <div v-if="allStores.length === 0" class="empty-inline">
                No active stores found
              </div>

              <div
                v-else-if="filteredStores.length === 0"
                class="empty-inline"
              >
                No stores match "{{ storeSearch }}"
              </div>

              <ul v-else class="store-list">
                <li
                  v-for="store in filteredStores"
                  :key="`${activeDepartmentId}-${store.storeId}`"
                  class="store-row"
                  :class="{
                    'store-row--on': formFor(activeDepartmentId).appliesTo.includes(store.code),
                  }"
                  @click="toggleStoreForActiveDept(store.code)"
                >
                  <span class="store-row__check">
                    {{
                      formFor(activeDepartmentId).appliesTo.includes(store.code)
                        ? '✓'
                        : ''
                    }}
                  </span>
                  <span class="store-row__code">{{ store.code }}</span>
                  <span class="store-row__name">{{ store.name }}</span>
                  <span v-if="store.location" class="store-row__loc">
                    📍 {{ store.location }}
                  </span>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject, computed } from 'vue'
import settingService from '@/stores/settingService'

const addToast = inject('addToast')

// ================================================================
// STATE
// ================================================================

const savingApproval = ref(false)

// Ask-store toggle
const askStoreApprovalEnabled = ref(true)
const loadingAskToggle = ref(false)
const savingAskToggle = ref(false)

// Department approval
const approvalConfig = ref({
  configured: false,
  departments: [],
  requiresApproval: true,
  message: 'No departments configured',
})

const approvalForm = reactive({
  requiresApproval: true,
  departmentStores: {}, // departmentId -> { appliesTo: [storeCodes] }
})

const departmentsForApproval = ref([])
const allStores = ref([])

// UI state
const activeDepartmentId = ref(null)
const storeSearch = ref('')

// Snapshot for dirty tracking
let originalSnapshot = ''

// ================================================================
// COMPUTED
// ================================================================

const selectedDepartments = computed(() =>
  departmentsForApproval.value.filter(
    (d) => approvalForm.departmentStores[d.departmentId] !== undefined
  )
)

const activeDepartment = computed(() =>
  departmentsForApproval.value.find((d) => d.departmentId === activeDepartmentId.value)
)

const filteredStores = computed(() => {
  const q = storeSearch.value.trim().toLowerCase()
  if (!q) return allStores.value
  return allStores.value.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q)
  )
})

const hasDepartmentChanges = computed(() => {
  return buildSnapshot() !== originalSnapshot
})

// ================================================================
// SNAPSHOT
// ================================================================

function buildSnapshot() {
  const depts = Object.entries(approvalForm.departmentStores)
    .map(([id, entry]) => ({
      departmentId: Number(id),
      appliesTo: [...(entry.appliesTo || [])].sort(),
    }))
    .sort((a, b) => a.departmentId - b.departmentId)

  return JSON.stringify({
    requiresApproval: approvalForm.requiresApproval,
    departments: depts,
  })
}

// ================================================================
// HELPERS
// ================================================================

const isDepartmentSelected = (departmentId) =>
  approvalForm.departmentStores[departmentId] !== undefined

const formFor = (departmentId) => {
  if (!approvalForm.departmentStores[departmentId]) {
    approvalForm.departmentStores[departmentId] = { appliesTo: [] }
  }
  return approvalForm.departmentStores[departmentId]
}

const setActiveDepartment = (departmentId) => {
  // If not selected, select it first
  if (!isDepartmentSelected(departmentId)) {
    approvalForm.departmentStores[departmentId] = { appliesTo: [] }
  }
  activeDepartmentId.value = departmentId
  storeSearch.value = ''
}

const toggleStoreForActiveDept = (storeCode) => {
  if (!activeDepartmentId.value) return
  const entry = formFor(activeDepartmentId.value)
  const idx = entry.appliesTo.indexOf(storeCode)
  if (idx === -1) {
    entry.appliesTo.push(storeCode)
  } else {
    entry.appliesTo.splice(idx, 1)
  }
}

// ================================================================
// ASK-STORE TOGGLE
// ================================================================

const loadAskStoreApproval = async () => {
  loadingAskToggle.value = true
  try {
    const res = await settingService.getAskStoreApprovalEnabled()
    if (res.success && res.data) {
      askStoreApprovalEnabled.value = res.data.enabled
    }
  } catch (err) {
    console.warn('⚠️ Failed to load ask-store toggle:', err)
  } finally {
    loadingAskToggle.value = false
  }
}

const onToggleAskStoreApproval = async (newValue) => {
  const enabled = Boolean(newValue)

  savingAskToggle.value = true
  try {
    const res = await settingService.setAskStoreApprovalEnabled(enabled)
    if (res.success) {
      askStoreApprovalEnabled.value = enabled
      addToast(
        enabled
          ? '✅ Asking store group approval enabled'
          : '⏭️ Asking store group approval disabled',
        'success'
      )
    } else {
      addToast(res.error || 'Failed to update toggle', 'error')
    }
  } catch (err) {
    addToast(err.error || 'Failed to update toggle', 'error')
  } finally {
    savingAskToggle.value = false
  }
}

// ================================================================
// DEPARTMENT APPROVAL LOADERS
// ================================================================

const loadApprovalDepartment = async () => {
  try {
    const response = await settingService.getApprovalDepartment()
    if (response.success) {
      const data = response.data
      approvalConfig.value = data

      approvalForm.requiresApproval = data.requiresApproval !== false
      approvalForm.departmentStores = {}

      if (Array.isArray(data.departments)) {
        data.departments.forEach((d) => {
          approvalForm.departmentStores[d.departmentId] = {
            appliesTo: Array.isArray(d.appliesTo) ? [...d.appliesTo] : [],
          }
        })
        // Auto-select first department
        if (data.departments.length > 0) {
          activeDepartmentId.value = data.departments[0].departmentId
        }
      }

      originalSnapshot = buildSnapshot()
    }
  } catch (error) {
    console.error('Error loading approval department:', error)
    addToast('Failed to load approval settings', 'error')
  }
}

const loadDepartmentsForApproval = async () => {
  try {
    const response = await settingService.getDepartmentsForApproval()
    if (response.success) {
      departmentsForApproval.value = response.data
    }
  } catch (error) {
    console.error('Error loading departments:', error)
  }
}

const loadStoresForApproval = async () => {
  try {
    const response = await settingService.getStoresForApproval()
    if (response.success) {
      allStores.value = response.data
    }
  } catch (error) {
    console.error('Error loading stores:', error)
  }
}

// ================================================================
// ACTIONS
// ================================================================

const toggleDepartment = (departmentId) => {
  if (approvalForm.departmentStores[departmentId] !== undefined) {
    delete approvalForm.departmentStores[departmentId]
    if (activeDepartmentId.value === departmentId) {
      // Pick another selected department or null
      const remaining = Object.keys(approvalForm.departmentStores)
      activeDepartmentId.value = remaining.length > 0 ? Number(remaining[0]) : null
    }
  } else {
    approvalForm.departmentStores[departmentId] = { appliesTo: [] }
    activeDepartmentId.value = departmentId
  }
}

const selectAllFor = (departmentId) => {
  approvalForm.departmentStores[departmentId].appliesTo = allStores.value.map(
    (s) => s.code
  )
}

const deselectAllFor = (departmentId) => {
  approvalForm.departmentStores[departmentId].appliesTo = []
}

// ================================================================
// SAVE
// ================================================================

const saveApprovalSettings = async () => {
  const departments = Object.entries(approvalForm.departmentStores).map(
    ([departmentId, entry]) => ({
      departmentId: parseInt(departmentId),
      appliesTo: entry.appliesTo || [],
    })
  )

  if (departments.length === 0) {
    addToast('Please select at least one department', 'error')
    return
  }

  const emptyDepts = departments.filter((d) => d.appliesTo.length === 0)
  if (emptyDepts.length > 0) {
    const names = emptyDepts
      .map(
        (d) =>
          departmentsForApproval.value.find(
            (x) => x.departmentId === d.departmentId
          )?.name || `#${d.departmentId}`
      )
      .join(', ')
    const proceed = confirm(
      `${emptyDepts.length} department(s) have no stores selected (${names}). ` +
        `They will not be notified for any requests. Continue?`
    )
    if (!proceed) return
  }

  savingApproval.value = true
  try {
    const payload = {
      departments,
      requiresApproval: approvalForm.requiresApproval,
    }
    const response = await settingService.setApprovalDepartment(payload)
    if (response.success) {
      addToast(
        response.message || 'Approval settings saved successfully',
        'success'
      )
      await Promise.all([
        loadApprovalDepartment(),
        loadDepartmentsForApproval(),
        loadStoresForApproval(),
      ])
    } else {
      addToast(response.error || 'Failed to save', 'error')
    }
  } catch (error) {
    console.error('Error saving:', error)
    addToast(error.response?.data?.error || 'Failed to save', 'error')
  } finally {
    savingApproval.value = false
  }
}

const removeApprovalDepartment = async () => {
  if (
    !confirm(
      'Remove all approval departments? Requests will not require department approval.'
    )
  ) {
    return
  }
  try {
    const response = await settingService.removeApprovalDepartment()
    if (response.success) {
      addToast('Approval departments removed', 'success')
      activeDepartmentId.value = null
      await Promise.all([
        loadApprovalDepartment(),
        loadDepartmentsForApproval(),
        loadStoresForApproval(),
      ])
    } else {
      addToast(response.error || 'Failed to remove', 'error')
    }
  } catch (error) {
    console.error('Error removing:', error)
    addToast(error.response?.data?.error || 'Failed to remove', 'error')
  }
}

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  await Promise.all([
    loadAskStoreApproval(),
    loadApprovalDepartment(),
    loadDepartmentsForApproval(),
    loadStoresForApproval(),
  ])
})
</script>

<style scoped>
/* ================================================================
   PAGE LAYOUT
   ================================================================ */
.approval-settings-page {
  padding: 24px 28px;
  max-width: 1300px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}
.page-header p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* ================================================================
   TOGGLE CARD
   ================================================================ */
.toggle-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 22px 26px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-left: 4px solid #0ea5e9;
  border-radius: 14px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  transition: all 0.25s ease;
}

.toggle-card--off {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fcd34d;
  border-left-color: #f59e0b;
}

.toggle-card__left {
  flex: 1;
  min-width: 300px;
}

.toggle-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #0c4a6e;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.toggle-card--off .toggle-card__title {
  color: #78350f;
}

.toggle-card__icon {
  font-size: 22px;
}

.toggle-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 12px;
  letter-spacing: 0.5px;
  margin-left: 4px;
}
.toggle-badge--on {
  background: #10b981;
  color: white;
}
.toggle-badge--off {
  background: #f59e0b;
  color: white;
}

.toggle-card__desc {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}
.toggle-card__desc strong {
  color: #0f172a;
}

.toggle-hint {
  font-size: 12px;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  display: inline-block;
  line-height: 1.5;
}
.toggle-hint--ok {
  color: #065f46;
  border-left: 3px solid #10b981;
}
.toggle-hint--warn {
  color: #92400e;
  border-left: 3px solid #f59e0b;
}
.toggle-hint--loading {
  color: #64748b;
  font-style: italic;
}

.toggle-card__right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.switch {
  position: relative;
  display: inline-block;
  width: 64px;
  height: 34px;
  cursor: pointer;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  inset: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 34px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.12);
}
.slider::before {
  position: absolute;
  content: "";
  height: 28px;
  width: 28px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.switch input:checked + .slider {
  background-color: #10b981;
}
.switch input:checked + .slider::before {
  transform: translateX(30px);
}
.switch input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-labels {
  display: flex;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.5px;
}
.switch-labels span.active:first-child {
  color: #10b981;
}
.switch-labels span.active:last-child {
  color: #f59e0b;
}

.saving-text {
  font-size: 11px;
  color: #64748b;
  font-style: italic;
}

/* ================================================================
   SECTION CARD
   ================================================================ */
.section-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px 26px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.section-header__left h3 {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-icon {
  font-size: 18px;
}
.section-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.section-subtitle strong {
  color: #0f172a;
}

.section-header__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 9px 18px;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger-ghost {
  padding: 9px 16px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-danger-ghost:hover:not(:disabled) {
  background: #fef2f2;
}
.btn-danger-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   REQUIRES APPROVAL ROW
   ================================================================ */
.requires-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  flex-wrap: wrap;
}
.requires-label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.segmented {
  display: inline-flex;
  background: #e2e8f0;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.segmented__btn {
  padding: 6px 18px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.segmented__btn:hover {
  color: #0f172a;
}
.segmented__btn.active {
  background: white;
  color: #4f46e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ================================================================
   DUAL PANEL LAYOUT
   ================================================================ */
.dual-panel {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #fafbfc;
  min-height: 480px;
}

.panel {
  display: flex;
  flex-direction: column;
  background: white;
}

.panel--departments {
  border-right: 1px solid #e2e8f0;
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.panel__header--stores {
  padding: 14px 20px;
}

.panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.panel__icon {
  font-size: 15px;
}

.panel__code {
  font-size: 10px;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.panel__count {
  font-size: 11px;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 700;
}

.panel__body {
  flex: 1;
  overflow-y: auto;
  max-height: 540px;
}

.panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #94a3b8;
  text-align: center;
  gap: 8px;
}
.panel__empty-icon {
  font-size: 40px;
  opacity: 0.5;
}
.panel__empty p {
  margin: 0;
  font-size: 13px;
}

/* ================================================================
   DEPARTMENT LIST (left panel)
   ================================================================ */
.dept-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dept-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid transparent;
}

.dept-row:hover {
  background: #f1f5f9;
}

.dept-row--active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.dept-row--selected .dept-row__name {
  color: #1e293b;
  font-weight: 700;
}

.dept-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}
.dept-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}
.dept-checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid #cbd5e1;
  background: white;
  transition: all 0.15s;
}
.dept-checkmark::after {
  content: "✓";
  font-size: 12px;
  font-weight: 800;
  color: white;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.15s;
}
.dept-checkbox input:checked + .dept-checkmark {
  background: #4f46e5;
  border-color: #4f46e5;
}
.dept-checkbox input:checked + .dept-checkmark::after {
  opacity: 1;
  transform: scale(1);
}

.dept-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dept-row__name {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dept-row__code {
  font-size: 10px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
}

.dept-row__count {
  font-size: 10px;
  font-weight: 800;
  color: white;
  background: #4f46e5;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

/* ================================================================
   STORE PANEL (right)
   ================================================================ */
.panel__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-mini {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background: #4f46e5;
  color: white;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-mini:hover:not(:disabled) {
  background: #4338ca;
}
.btn-mini:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-mini--ghost {
  background: #f1f5f9;
  color: #475569;
}
.btn-mini--ghost:hover:not(:disabled) {
  background: #e2e8f0;
}
.btn-mini--danger {
  background: #fee2e2;
  color: #dc2626;
}
.btn-mini--danger:hover:not(:disabled) {
  background: #fecaca;
}

/* Search */
.store-search {
  position: relative;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}
.store-search__icon {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #94a3b8;
  pointer-events: none;
}
.store-search__input {
  width: 100%;
  padding: 8px 32px 8px 34px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.15s;
}
.store-search__input:focus {
  outline: none;
  border-color: #4f46e5;
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}
.store-search__clear {
  position: absolute;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
}
.store-search__clear:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Store selection area */
.store-selection {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.store-selection__header {
  padding: 10px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}
.store-selection__counter {
  font-size: 12px;
  color: #64748b;
}
.store-selection__counter strong {
  color: #4f46e5;
  font-weight: 700;
}

.store-list {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
  overflow-y: auto;
  max-height: 380px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.store-row {
  display: grid;
  grid-template-columns: 24px 90px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  border: 1px solid transparent;
}

.store-row:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.store-row--on {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.store-row--on:hover {
  background: #e0e7ff;
  border-color: #a5b4fc;
}

.store-row__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 2px solid #cbd5e1;
  background: white;
  color: white;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
  transition: all 0.15s;
}

.store-row--on .store-row__check {
  background: #4f46e5;
  border-color: #4f46e5;
}

.store-row__code {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #4f46e5;
  background: white;
  padding: 2px 8px;
  border-radius: 6px;
  text-align: center;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-row__name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-row__loc {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 8px;
  background: #f8fafc;
  border-radius: 6px;
}

/* ================================================================
   EMPTY / LOADING
   ================================================================ */
.empty-inline {
  font-size: 13px;
  color: #94a3b8;
  font-style: italic;
  padding: 20px;
  text-align: center;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .dual-panel {
    grid-template-columns: 1fr;
  }
  .panel--departments {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  .panel__body {
    max-height: 260px;
  }
  .store-list {
    max-height: none;
  }
}

@media (max-width: 768px) {
  .approval-settings-page {
    padding: 16px;
  }
  .toggle-card {
    flex-direction: column;
    align-items: stretch;
  }
  .toggle-card__right {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  .section-header__actions {
    width: 100%;
  }
  .section-header__actions button {
    flex: 1;
  }
  .requires-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .store-row {
    grid-template-columns: 24px 1fr auto;
  }
  .store-row__code {
    grid-column: 2;
    justify-self: start;
  }
  .store-row__name {
    grid-column: 2;
  }
  .store-row__loc {
    grid-column: 2 / -1;
    justify-self: start;
    margin-top: 2px;
  }
}

@media (max-width: 480px) {
  .panel__header--stores {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .panel__actions {
    justify-content: flex-start;
  }
}
</style>