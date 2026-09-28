<template>
  <div class="config-card">
    <div class="card-header">
      <div class="header-left">
        <span class="header-icon">👥</span>
        <div class="header-info">
          <h3>Employee Overrides</h3>
          <p class="header-subtitle">Individual employee schedule customizations</p>
        </div>
        <span class="badge">{{ overrides.length }}</span>
      </div>
      <div class="header-actions">
        <button class="btn-add-small" @click="openAddModal">
          <span class="btn-icon">+</span> Add Employee
        </button>
        <button class="btn-save-small" @click="saveAll" :disabled="saving">
          <span class="btn-icon">💾</span> Save All
        </button>
      </div>
    </div>
    
    <div class="card-body">
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Loading employee overrides...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">Try Again</button>
      </div>
      
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Lunch <span class="th-sub">(min)</span></th>
              <th>OT After</th>
              <th style="width: 100px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in overrides" :key="emp.id">
              <td class="employee-cell">
                <div class="employee-info">
                  <span class="employee-avatar">👤</span>
                  <span class="employee-name">{{ emp.employeeName }}</span>
                </div>
               </td>
              <td>
                <span class="dept-badge">{{ emp.departmentName || 'N/A' }}</span>
               </td>
              <td>
                <input type="time" v-model="emp.checkInTime" class="input-sm" placeholder="--:--">
               </td>
              <td>
                <input type="time" v-model="emp.checkOutTime" class="input-sm" placeholder="--:--">
               </td>
              <td>
                <input type="number" v-model="emp.lunchDurationMinutes" class="input-sm" min="0" step="5">
               </td>
              <td>
                <input type="time" v-model="emp.overtimeAfterTime" class="input-sm" placeholder="--:--">
               </td>
              <td class="action-buttons">
                <button class="btn-icon edit" @click="openEditModal(emp)" title="Edit employee override">
                  ✏️
                </button>
                <button class="btn-icon delete" @click="confirmDelete(emp.id, emp.employeeName)" title="Delete employee override">
                  🗑️
                </button>
               </td>
             </tr>
            <tr v-if="overrides.length === 0">
              <td colspan="7" class="empty-row">
                <div class="empty-state-small">
                  <span class="empty-icon">👥</span>
                  <p>No employee overrides configured</p>
                  <button class="btn-link" @click="openAddModal">Add your first override</button>
                </div>
               </td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-left">
            <span class="modal-icon">{{ editingItem ? '✏️' : '➕' }}</span>
            <h3>{{ editingItem ? 'Edit' : 'Add' }} Employee Override</h3>
          </div>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-field">
            <label>Employee <span class="required">*</span></label>
            <div class="select-wrapper">
              <select v-model="formData.employeeId" class="input" :disabled="editingItem">
                <option value="">Select an employee</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                  {{ emp.fullName || emp.firstName + ' ' + emp.lastName }} ({{ emp.departmentName || 'N/A' }})
                </option>
              </select>
              <span class="select-arrow">▼</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label>⏰ Check-In Time</label>
              <input type="time" v-model="formData.checkInTime" class="input" placeholder="--:--">
              <span class="field-hint">Leave empty to use defaults</span>
            </div>
            <div class="form-field">
              <label>⏰ Check-Out Time</label>
              <input type="time" v-model="formData.checkOutTime" class="input" placeholder="--:--">
              <span class="field-hint">Leave empty to use defaults</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label>🍽️ Lunch Duration <span class="label-hint">(minutes)</span></label>
              <input type="number" v-model="formData.lunchDurationMinutes" class="input" min="0" step="5" placeholder="e.g., 60">
            </div>
            <div class="form-field">
              <label>⏱️ OT After Time</label>
              <input type="time" v-model="formData.overtimeAfterTime" class="input" placeholder="--:--">
            </div>
          </div>
          
          <div class="info-banner" v-if="formData.lunchDurationMinutes && formData.lunchDurationMinutes > 120">
            <span class="info-icon">ℹ️</span>
            <span>Lunch duration exceeds 2 hours. Please verify this is correct.</span>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-modal cancel" @click="closeModal">Cancel</button>
          <button class="btn-modal confirm" @click="saveItem" :disabled="saving">
            {{ saving ? 'Saving...' : (editingItem ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body confirm-body">
          <div class="confirm-icon">⚠️</div>
          <p>Are you sure you want to delete override for <strong>{{ deleteItemName }}</strong>?</p>
          <p class="confirm-warning">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-modal cancel" @click="closeDeleteModal">Cancel</button>
          <button class="btn-modal danger" @click="deleteItem">Delete Permanently</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import attendanceService from '@/stores/attendanceService'
import employeesService from '@/stores/employee'

const overrides = ref([])
const employees = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingItem = ref(null)
const deleteId = ref(null)
const deleteItemName = ref('')

const formData = ref({
  employeeId: null,
  checkInTime: '',
  checkOutTime: '',
  lunchDurationMinutes: null,
  overtimeAfterTime: ''
})

const fetchEmployees = async () => {
  try {
    const result = await employeesService.getEmployees({ limit: 100 })
    if (result.success && result.data) employees.value = result.data
  } catch (err) {
    console.error('Failed to fetch employees:', err)
  }
}

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    overrides.value = await attendanceService.getEmployeeOverrides()
  } catch (err) {
    error.value = 'Failed to load employee overrides'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const saveAll = async () => {
  saving.value = true
  error.value = null
  try {
    for (const emp of overrides.value) {
      await attendanceService.updateEmployeeOverride(emp.id, emp)
    }
    alert('✓ All employee overrides saved successfully')
  } catch (err) {
    error.value = 'Failed to save changes'
    console.error(err)
  } finally {
    saving.value = false
  }
}

const openAddModal = () => {
  editingItem.value = null
  formData.value = {
    employeeId: null,
    checkInTime: '',
    checkOutTime: '',
    lunchDurationMinutes: null,
    overtimeAfterTime: ''
  }
  showModal.value = true
}

const openEditModal = (emp) => {
  editingItem.value = emp
  formData.value = { ...emp }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const saveItem = async () => {
  if (!formData.value.employeeId) {
    alert('Please select an employee')
    return
  }
  
  saving.value = true
  try {
    if (editingItem.value) {
      await attendanceService.updateEmployeeOverride(editingItem.value.id, formData.value)
    } else {
      await attendanceService.createEmployeeOverride({ ...formData.value, shiftType: 'day' })
    }
    await fetchData()
    closeModal()
  } catch (err) {
    error.value = 'Failed to save employee override'
    console.error(err)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (id, name) => {
  deleteId.value = id
  deleteItemName.value = name
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteId.value = null
}

const deleteItem = async () => {
  try {
    await attendanceService.deleteEmployeeOverride(deleteId.value)
    await fetchData()
    closeDeleteModal()
  } catch (err) {
    error.value = 'Failed to delete employee override'
    console.error(err)
  }
}

onMounted(() => {
  fetchEmployees()
  fetchData()
})
</script>

<style scoped>
.config-card {
  background: white;
  border-radius: 20px;
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}

.config-card:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 28px;
}

.header-info h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.header-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.badge {
  background: #8b5cf6;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 30px;
  margin-left: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-add-small, .btn-save-small {
  padding: 8px 18px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
}

.btn-add-small {
  background: #8b5cf6;
  color: white;
}

.btn-add-small:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139,92,246,0.3);
}

.btn-save-small {
  background: #10b981;
  color: white;
}

.btn-save-small:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}

.btn-add-small:disabled, .btn-save-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 14px;
}

.card-body {
  padding: 0;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 16px;
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.th-sub {
  font-weight: 400;
  font-size: 11px;
  color: #94a3b8;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:hover {
  background: #f8fafc;
}

.employee-cell {
  font-weight: 500;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-avatar {
  font-size: 20px;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
}

.dept-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #ede9fe;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  color: #7c3aed;
}

.input-sm {
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 12px;
  width: 100%;
  transition: all 0.2s;
  background: white;
}

.input-sm:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-icon.edit {
  background: #dbeafe;
  color: #2563eb;
}

.btn-icon.edit:hover {
  background: #2563eb;
  color: white;
  transform: scale(1.05);
}

.btn-icon.delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-icon.delete:hover {
  background: #dc2626;
  color: white;
  transform: scale(1.05);
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #64748b;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.error-state {
  text-align: center;
  padding: 60px;
  color: #dc2626;
  background: #fef2f2;
  margin: 24px;
  border-radius: 12px;
}

.error-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.empty-row td {
  padding: 60px !important;
}

.empty-state-small {
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
  display: block;
  margin-bottom: 12px;
}

.btn-link {
  background: none;
  border: none;
  color: #8b5cf6;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
  text-decoration: underline;
}

.btn-link:hover {
  color: #7c3aed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 28px;
  width: 90%;
  max-width: 560px;
  max-height: 85vh;
  overflow: hidden;
  animation: slideIn 0.2s ease;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 24px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s;
  line-height: 1;
}

.modal-close:hover {
  color: #ef4444;
}

.modal-body {
  padding: 24px;
  max-height: calc(85vh - 160px);
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.label-hint, .field-hint {
  font-weight: 400;
  color: #94a3b8;
  font-size: 11px;
}

.field-hint {
  display: block;
  margin-top: 4px;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

.input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  padding-right: 32px;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #94a3b8;
  pointer-events: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.info-banner {
  background: #fef3c7;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 12px;
  color: #d97706;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.btn-modal {
  padding: 10px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-modal.cancel {
  background: white;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
}

.btn-modal.cancel:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-modal.confirm {
  background: #8b5cf6;
  color: white;
}

.btn-modal.confirm:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139,92,246,0.3);
}

.btn-modal.danger {
  background: #ef4444;
  color: white;
}

.btn-modal.danger:hover {
  background: #dc2626;
}

.btn-modal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.confirm-modal {
  max-width: 440px;
}

.confirm-body {
  text-align: center;
  padding: 32px;
}

.confirm-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.confirm-body p {
  margin: 8px 0;
  font-size: 14px;
  color: #475569;
}

.confirm-warning {
  font-size: 12px;
  color: #94a3b8;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .btn-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .employee-avatar {
    font-size: 16px;
  }
}
</style>