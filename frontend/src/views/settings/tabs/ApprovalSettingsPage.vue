<!-- FILE: src/views/tabs/ApprovalSettingsPage.vue -->
<template>
  <div class="settings-card">
    <div class="card-header">
      <h2>Request Approval Settings</h2>
      <button class="btn-save" @click="saveApprovalSettings" :disabled="savingApproval">
        {{ savingApproval ? 'Saving...' : 'Save Settings' }}
      </button>
    </div>

    <div class="rules-container">
      <!-- ==================== CURRENT STATUS ==================== -->
      <div class="status-card" :class="{ configured: approvalConfig.configured }">
        <div class="status-header">
          <span class="status-icon">{{ approvalConfig.configured ? '✅' : '⚠️' }}</span>
          <div>
            <strong>
              {{ approvalConfig.configured
                ? `${approvalConfig.departments.length} Approval Department(s) Configured`
                : 'No Approval Departments Set' }}
            </strong>
            <p class="status-message">{{ approvalConfig.message }}</p>
          </div>
        </div>

        <div v-if="approvalConfig.departments?.length" class="status-details">
          <div
            v-for="dept in approvalConfig.departments"
            :key="dept.departmentId"
            class="detail-item"
          >
            <span class="label">
              🏛️ {{ dept.name }}
              <span v-if="!dept.isActive" class="inactive-badge">inactive</span>
            </span>
            <span class="value">
              {{ dept.appliesTo.length }} store(s)
              <span v-if="dept.appliesTo.length === 0" class="empty-badge">no stores</span>
            </span>
          </div>
        </div>

        <div v-if="approvalConfig.departments?.length" class="detail-item status-enabled-row">
          <span class="label">Status:</span>
          <span class="value" :class="approvalConfig.requiresApproval ? 'active' : 'inactive'">
            {{ approvalConfig.requiresApproval ? '✅ Enabled' : '❌ Disabled' }}
          </span>
        </div>
      </div>

      <!-- ==================== SETTINGS ==================== -->
      <div class="rule-section">
        <h3>Approval Departments</h3>
        <p class="help-text">
          Select which departments approve requests, and for each department, which stores it applies to.
          When a request is submitted for a store, <strong>every</strong> department whose list
          includes that store will be asked to approve.
        </p>

        <!-- Requires Approval toggle -->
        <div class="rule-item" style="margin-bottom: 20px; max-width: 300px;">
          <label>Requires Approval?</label>
          <select v-model="approvalForm.requiresApproval" class="form-control">
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>

        <!-- Department picker -->
        <div class="dept-picker">
          <label class="picker-label">Select Departments</label>
          <div class="dept-chips" v-if="departmentsForApproval.length > 0">
            <button
              v-for="dept in departmentsForApproval"
              :key="dept.departmentId"
              type="button"
              class="dept-chip"
              :class="{ selected: isDepartmentSelected(dept.departmentId) }"
              @click="toggleDepartment(dept.departmentId)"
            >
              {{ dept.name }} ({{ dept.code }})
            </button>
          </div>
          <p v-else class="empty-hint">No active departments found</p>
        </div>

        <!-- Per-department store lists -->
        <div
          v-for="dept in selectedDepartments"
          :key="dept.departmentId"
          class="dept-card"
        >
          <div class="dept-card-header">
            <div>
              <strong>🏛️ {{ dept.name }} ({{ dept.code }})</strong>
              <p class="dept-card-sub">
                {{ formFor(dept.departmentId).appliesTo.length }} store(s) selected
              </p>
            </div>
            <div class="dept-card-actions">
              <button
                type="button"
                class="btn-select-all"
                @click="selectAllFor(dept.departmentId)"
                v-if="allStores.length > 0"
              >
                Select All
              </button>
              <button
                type="button"
                class="btn-deselect-all"
                @click="deselectAllFor(dept.departmentId)"
                v-if="formFor(dept.departmentId).appliesTo.length > 0"
              >
                Deselect All
              </button>
              <button
                type="button"
                class="btn-remove-dept"
                @click="toggleDepartment(dept.departmentId)"
              >
                ✕ Remove
              </button>
            </div>
          </div>

          <div class="stores-list" v-if="allStores.length > 0">
            <label
              v-for="store in allStores"
              :key="`${dept.departmentId}-${store.storeId}`"
              class="store-item"
              :class="{ checked: formFor(dept.departmentId).appliesTo.includes(store.code) }"
            >
              <span class="checkbox-wrapper">
                <input
                  type="checkbox"
                  :value="store.code"
                  v-model="formFor(dept.departmentId).appliesTo"
                  :id="`store-${dept.departmentId}-${store.storeId}`"
                >
                <span class="checkmark"></span>
              </span>
              <span class="store-info">
                <span class="store-code">{{ store.code }}</span>
                <span class="store-name">{{ store.name }}</span>
                <span class="store-location" v-if="store.location">📍 {{ store.location }}</span>
              </span>
            </label>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon">🏪</span>
            <p>No active stores found</p>
            <p class="empty-hint">Add stores to start configuring approvals</p>
          </div>
        </div>

        <!-- Empty selection state -->
        <div v-if="selectedDepartments.length === 0" class="empty-state">
          <span class="empty-icon">🏛️</span>
          <p>No departments selected</p>
          <p class="empty-hint">Click a department above to configure which stores it approves</p>
        </div>
      </div>

      <!-- ==================== ACTION BUTTONS ==================== -->
      <div class="action-buttons" style="margin-top: 20px;">
        <button class="btn-save" @click="saveApprovalSettings" :disabled="savingApproval">
          {{ savingApproval ? 'Saving...' : 'Save Settings' }}
        </button>
        <button
          class="btn-remove"
          @click="removeApprovalDepartment"
          v-if="approvalConfig.configured"
        >
          Remove All Departments
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject, computed } from 'vue'
import settingService from '@/stores/settingService'

const addToast = inject('addToast')

const savingApproval = ref(false)

const approvalConfig = ref({
  configured: false,
  departments: [],
  requiresApproval: true,
  message: 'No departments configured',
})

const approvalForm = reactive({
  requiresApproval: true,
  // Map: departmentId -> { appliesTo: [storeCodes] }
  departmentStores: {},
})

const departmentsForApproval = ref([])
const allStores = ref([])

// ================================================================
// COMPUTED
// ================================================================
const selectedDepartments = computed(() =>
  departmentsForApproval.value.filter(
    (d) => approvalForm.departmentStores[d.departmentId] !== undefined
  )
)

const isDepartmentSelected = (departmentId) =>
  approvalForm.departmentStores[departmentId] !== undefined

// Ensures the entry exists before v-model tries to write to it
const formFor = (departmentId) => {
  if (!approvalForm.departmentStores[departmentId]) {
    approvalForm.departmentStores[departmentId] = { appliesTo: [] }
  }
  return approvalForm.departmentStores[departmentId]
}

// ================================================================
// LOADERS
// ================================================================
const loadApprovalDepartment = async () => {
  try {
    const response = await settingService.getApprovalDepartment()
    if (response.success) {
      const data = response.data
      approvalConfig.value = data

      // Rebuild form state from the config
      approvalForm.requiresApproval = data.requiresApproval !== false
      approvalForm.departmentStores = {}

      if (Array.isArray(data.departments)) {
        data.departments.forEach((d) => {
          approvalForm.departmentStores[d.departmentId] = {
            appliesTo: Array.isArray(d.appliesTo) ? [...d.appliesTo] : [],
          }
        })
      }
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
// DEPARTMENT TOGGLE
// ================================================================
const toggleDepartment = (departmentId) => {
  if (approvalForm.departmentStores[departmentId] !== undefined) {
    delete approvalForm.departmentStores[departmentId]
  } else {
    approvalForm.departmentStores[departmentId] = { appliesTo: [] }
  }
}

// ================================================================
// PER-DEPARTMENT STORE SELECTION
// ================================================================
const selectAllFor = (departmentId) => {
  approvalForm.departmentStores[departmentId].appliesTo = allStores.value.map((s) => s.code)
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

  // Warn if some departments have no stores (they'd be inert)
  const emptyDepts = departments.filter((d) => d.appliesTo.length === 0)
  if (emptyDepts.length > 0) {
    const names = emptyDepts
      .map(
        (d) =>
          departmentsForApproval.value.find((x) => x.departmentId === d.departmentId)?.name ||
          `#${d.departmentId}`
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
      addToast(response.message || 'Approval settings saved successfully', 'success')
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

// ================================================================
// REMOVE ALL
// ================================================================
const removeApprovalDepartment = async () => {
  if (!confirm('Remove all approval departments? Requests will not require department approval.')) {
    return
  }
  try {
    const response = await settingService.removeApprovalDepartment()
    if (response.success) {
      addToast('Approval departments removed', 'success')
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
    loadApprovalDepartment(),
    loadDepartmentsForApproval(),
    loadStoresForApproval(),
  ])
})
</script>

<style scoped>
/* ================================================================
   BASE LAYOUT (unchanged from original)
   ================================================================ */
.settings-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}
.btn-save {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: #10b981;
  color: white;
}
.btn-save:hover { background: #059669; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.rules-container { padding: 20px; }
.help-text {
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0 12px 0;
}
.rule-section {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}
.rule-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.rule-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}
.rule-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rule-item label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}
.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* ================================================================
   STATUS CARD
   ================================================================ */
.status-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
}
.status-card.configured {
  background: #f0fdf4;
  border-color: #bbf7d0;
}
.status-card .status-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.status-card .status-icon { font-size: 24px; }
.status-card .status-message {
  font-size: 13px;
  color: #64748b;
  margin: 2px 0 0 0;
}
.status-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.detail-item { font-size: 13px; }
.detail-item .label {
  color: #64748b;
  font-weight: 500;
}
.detail-item .value {
  color: #1e293b;
  font-weight: 500;
}
.detail-item .value.active { color: #10b981; }
.detail-item .value.inactive { color: #ef4444; }
.status-enabled-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
}

.inactive-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
.empty-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
  font-size: 10px;
  font-weight: 600;
}

/* ================================================================
   DEPARTMENT PICKER
   ================================================================ */
.dept-picker { margin-bottom: 20px; }
.picker-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 10px;
}
.dept-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.dept-chip {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.dept-chip:hover {
  border-color: #818cf8;
  background: #f5f3ff;
}
.dept-chip.selected {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}
.dept-chip.selected:hover {
  background: #4f46e5;
}

/* ================================================================
   PER-DEPARTMENT CARD
   ================================================================ */
.dept-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  background: #fafbfc;
}
.dept-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.dept-card-header strong {
  font-size: 14px;
  color: #1e293b;
}
.dept-card-sub {
  font-size: 12px;
  color: #64748b;
  margin: 4px 0 0 0;
}
.dept-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.btn-remove-dept {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-remove-dept:hover { background: #fecaca; }

/* ================================================================
   STORES LIST (reused per-department)
   ================================================================ */
.stores-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 4px;
}
.stores-header label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.stores-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.store-count {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 20px;
  font-weight: 500;
}
.btn-select-all,
.btn-deselect-all {
  padding: 4px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.btn-select-all {
  background: #6366f1;
  color: white;
}
.btn-select-all:hover { background: #4f46e5; }
.btn-deselect-all {
  background: #f1f5f9;
  color: #475569;
}
.btn-deselect-all:hover { background: #e2e8f0; }

.stores-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
}
.store-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1.5px solid transparent;
  background: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  width: 100%;
}
.store-item:hover {
  background: #f1f4f9;
  border-color: #e2e8f0;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.store-item.checked {
  background: #eef2ff;
  border-color: #818cf8;
}
.store-item.checked .store-code {
  background: #dbeafe;
  color: #4f46e5;
}
.checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.checkbox-wrapper input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid #cbd5e1;
  background: white;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.checkmark::after {
  content: "✓";
  font-size: 14px;
  font-weight: 700;
  color: white;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s ease;
}
.checkbox-wrapper input[type="checkbox"]:checked + .checkmark {
  background: #6366f1;
  border-color: #6366f1;
}
.checkbox-wrapper input[type="checkbox"]:checked + .checkmark::after {
  opacity: 1;
  transform: scale(1);
}
.store-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}
.store-code {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 4px;
  flex-shrink: 0;
  min-width: 80px;
  text-align: center;
}
.store-name {
  color: #334155;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.store-location {
  color: #94a3b8;
  font-size: 12px;
  flex-shrink: 0;
  background: #f8fafc;
  padding: 2px 10px;
  border-radius: 4px;
  white-space: nowrap;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #94a3b8;
}
.empty-state .empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}
.empty-state p {
  margin: 4px 0;
  font-size: 14px;
}
.empty-state .empty-hint {
  font-size: 12px;
  color: #cbd5e1;
}
.empty-hint {
  font-size: 12px;
  color: #cbd5e1;
  margin: 4px 0;
}

/* ================================================================
   ACTION BUTTONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-remove {
  padding: 8px 16px;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}
.btn-remove:hover { background: #fecaca; }

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .stores-list {
    max-height: 250px;
    padding: 6px;
  }
  .stores-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .stores-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .dept-card-header {
    flex-direction: column;
    align-items: stretch;
  }
  .dept-card-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .store-item {
    padding: 10px 12px;
    gap: 10px;
  }
  .store-info { gap: 8px; }
  .store-code {
    min-width: 60px;
    font-size: 11px;
  }
  .store-name { font-size: 13px; }
  .store-location {
    font-size: 11px;
    padding: 1px 8px;
  }
}
</style>