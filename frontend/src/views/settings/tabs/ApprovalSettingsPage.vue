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
      <!-- Current Status -->
      <div class="status-card" :class="{ configured: approvalConfig.configured }">
        <div class="status-header">
          <span class="status-icon">{{ approvalConfig.configured ? '✅' : '⚠️' }}</span>
          <div>
            <strong>{{ approvalConfig.configured ? 'Approval Department Configured' : 'No Approval Department Set' }}</strong>
            <p class="status-message">{{ approvalConfig.message }}</p>
          </div>
        </div>
        <div v-if="approvalConfig.configured" class="status-details">
          <div class="detail-item">
            <span class="label">Department:</span>
            <span class="value">{{ approvalConfig.department?.name }} ({{ approvalConfig.department?.code }})</span>
          </div>
          <div class="detail-item">
            <span class="label">Status:</span>
            <span class="value" :class="approvalConfig.requiresApproval ? 'active' : 'inactive'">
              {{ approvalConfig.requiresApproval ? '✅ Enabled' : '❌ Disabled' }}
            </span>
          </div>
          <div class="detail-item" v-if="approvalConfig.applyToStores?.length">
            <span class="label">Apply To Stores:</span>
            <span class="value">{{ approvalConfig.applyToStores.join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="rule-section">
        <h3>Settings</h3>
        <p class="help-text">Configure which department approves requests for specific stores</p>

        <div class="rule-grid side-by-side">
          <div class="rule-item">
            <label>Select Approval Department</label>
            <select v-model="approvalForm.departmentId" class="form-control">
              <option value="">-- Select Department --</option>
              <option
                v-for="dept in departmentsForApproval"
                :key="dept.departmentId"
                :value="dept.departmentId"
              >
                {{ dept.name }} ({{ dept.code }})
              </option>
            </select>
          </div>
          <div class="rule-item">
            <label>Requires Approval?</label>
            <select v-model="approvalForm.requiresApproval" class="form-control">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </div>
        </div>

        <!-- Apply To Stores -->
        <div class="rule-item" style="margin-top: 20px;">
          <div class="stores-header">
            <label>Apply To Stores</label>
            <div class="stores-actions">
              <span class="store-count">{{ approvalForm.applyToStores.length }} store(s) selected</span>
              <button
                type="button"
                class="btn-select-all"
                @click="selectAllStores"
                v-if="allStores.length > 0"
              >
                Select All
              </button>
              <button
                type="button"
                class="btn-deselect-all"
                @click="deselectAllStores"
                v-if="approvalForm.applyToStores.length > 0"
              >
                Deselect All
              </button>
            </div>
          </div>
          <p class="help-text">Select which stores require department approval</p>

          <div class="stores-list" v-if="allStores.length > 0">
            <label
              v-for="store in allStores"
              :key="store.storeId"
              class="store-item"
              :class="{ checked: approvalForm.applyToStores.includes(store.code) }"
            >
              <span class="checkbox-wrapper">
                <input
                  type="checkbox"
                  :value="store.code"
                  v-model="approvalForm.applyToStores"
                  :id="'store-' + store.storeId"
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
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons" style="margin-top: 20px;">
        <button class="btn-save" @click="saveApprovalSettings" :disabled="savingApproval">
          {{ savingApproval ? 'Saving...' : 'Save Settings' }}
        </button>
        <button
          class="btn-remove"
          @click="removeApprovalDepartment"
          v-if="approvalConfig.configured"
        >
          Remove Department
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import settingService from '@/stores/settingService'

const addToast = inject('addToast')

const savingApproval = ref(false)

const approvalConfig = ref({
  configured: false,
  department: null,
  requiresApproval: true,
  applyToStores: [],
  message: 'No department configured'
})

const approvalForm = reactive({
  departmentId: '',
  requiresApproval: true,
  applyToStores: []
})

const departmentsForApproval = ref([])
const allStores = ref([])

const loadApprovalDepartment = async () => {
  try {
    const response = await settingService.getApprovalDepartment()
    if (response.success) {
      const data = response.data
      approvalConfig.value = data
      if (data.configured && data.department) {
        approvalForm.departmentId = data.department.id
        approvalForm.requiresApproval = data.requiresApproval !== false
        approvalForm.applyToStores = data.applyToStores || []
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
      if (response.selected && response.selected.length > 0) {
        approvalForm.applyToStores = response.selected
      }
    }
  } catch (error) {
    console.error('Error loading stores:', error)
  }
}

const saveApprovalSettings = async () => {
  if (!approvalForm.departmentId) {
    addToast('Please select a department', 'error')
    return
  }

  savingApproval.value = true
  try {
    const payload = {
      departmentId: parseInt(approvalForm.departmentId),
      requiresApproval: approvalForm.requiresApproval,
      applyToStores: approvalForm.applyToStores || []
    }
    const response = await settingService.setApprovalDepartment(payload)
    if (response.success) {
      addToast(response.message || 'Approval settings saved successfully', 'success')
      await Promise.all([
        loadApprovalDepartment(),
        loadDepartmentsForApproval(),
        loadStoresForApproval()
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
  if (!confirm('Remove approval department? Requests will not require department approval.')) {
    return
  }
  try {
    const response = await settingService.removeApprovalDepartment()
    if (response.success) {
      addToast('Approval department removed', 'success')
      await Promise.all([
        loadApprovalDepartment(),
        loadDepartmentsForApproval(),
        loadStoresForApproval()
      ])
    } else {
      addToast(response.error || 'Failed to remove', 'error')
    }
  } catch (error) {
    console.error('Error removing:', error)
    addToast(error.response?.data?.error || 'Failed to remove', 'error')
  }
}

const selectAllStores = () => {
  approvalForm.applyToStores = allStores.value.map(s => s.code)
}

const deselectAllStores = () => {
  approvalForm.applyToStores = []
}

onMounted(async () => {
  await Promise.all([
    loadApprovalDepartment(),
    loadDepartmentsForApproval(),
    loadStoresForApproval()
  ])
})
</script>

<style scoped>
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
.btn-save:hover {
  background: #059669;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.rules-container {
  padding: 20px;
}
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
.rule-grid.side-by-side {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
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

/* Status Card */
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
.status-card .status-icon {
  font-size: 24px;
}
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}
.detail-item {
  font-size: 13px;
}
.detail-item .label {
  color: #64748b;
  font-weight: 500;
}
.detail-item .value {
  color: #1e293b;
  font-weight: 500;
}
.detail-item .value.active {
  color: #10b981;
}
.detail-item .value.inactive {
  color: #ef4444;
}

/* Stores List */
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
.btn-select-all:hover {
  background: #4f46e5;
}
.btn-deselect-all {
  background: #f1f5f9;
  color: #475569;
}
.btn-deselect-all:hover {
  background: #e2e8f0;
}
.stores-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fafbfc;
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
.btn-remove:hover {
  background: #fecaca;
}

@media (max-width: 768px) {
  .rule-grid.side-by-side {
    grid-template-columns: 1fr;
  }
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
  .store-item {
    padding: 10px 12px;
    gap: 10px;
  }
  .store-info {
    gap: 8px;
  }
  .store-code {
    min-width: 60px;
    font-size: 11px;
  }
  .store-name {
    font-size: 13px;
  }
  .store-location {
    font-size: 11px;
    padding: 1px 8px;
  }
}
</style>