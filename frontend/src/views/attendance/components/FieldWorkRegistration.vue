<template>
  <div class="config-card">
    <div class="card-header">
      <div class="header-left">
        <span class="header-icon">🏔️</span>
        <div class="header-info">
          <h3>Field Work Registration</h3>
          <p class="header-subtitle">Register employees working outside the office</p>
        </div>
        <span class="badge">{{ assignments.length }}</span>
      </div>
      <div class="header-actions">
        <button class="btn-add-small" @click="openAddModal">
          <span class="btn-icon">+</span> Register Field Work
        </button>
      </div>
    </div>
    
    <div class="card-body">
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Loading field work assignments...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">Try Again</button>
      </div>
      
      <div v-else class="table-container">
        <table class="data-table compact">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th style="width: 100px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fw in assignments" :key="fw.id">
              <td class="employee-cell">
                <div class="employee-info">
                  <span class="employee-avatar">🏔️</span>
                  <span class="employee-name">{{ fw.employeeName }}</span>
                </div>
              </td>
              <td>
                <span class="dept-badge">{{ fw.departmentName }}</span>
              </td>
              <td>
                <span :class="['type-badge', fw.assignmentType]">
                  {{ getTypeLabel(fw.assignmentType) }}
                </span>
              </td>
              <td>
                <span class="date-badge start-date">
                  📅 {{ formatDate(fw.startDate) }}
                </span>
              </td>
              <td>
                <span v-if="fw.endDate" class="date-badge end-date">
                  📅 {{ formatDate(fw.endDate) }}
                </span>
                <span v-else class="permanent-badge">∞ Permanent</span>
              </td>
              <td>
                <span class="status-badge active-field">
                  <span class="status-dot"></span>
                  Active
                </span>
              </td>
              <td class="action-buttons">
                <button class="btn-icon complete" @click="completeFieldWork(fw.id)" title="Mark as completed">
                  ✅ Complete
                </button>
                <button class="btn-icon delete" @click="confirmDelete(fw.id, fw.employeeName)" title="Delete assignment">
                  🗑️
                </button>
              </td>
            </tr>
            
            <tr v-if="assignments.length === 0">
              <td colspan="7" class="empty-row">
                <div class="empty-state-small">
                  <span class="empty-icon">🏔️</span>
                  <p>No active field work assignments</p>
                  <button class="btn-link" @click="openAddModal">Register your first assignment</button>
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
            <span class="modal-icon">{{ editingItem ? '✏️' : '🏔️' }}</span>
            <h3>{{ editingItem ? 'Edit' : 'Register' }} Field Work</h3>
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
          
          <div class="form-field">
            <label>Duration Type <span class="required">*</span></label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="formData.assignmentType" value="today">
                <span class="radio-custom"></span>
                <span class="radio-label-text">📅 Today Only</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="formData.assignmentType" value="range">
                <span class="radio-custom"></span>
                <span class="radio-label-text">📆 Date Range</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="formData.assignmentType" value="permanent">
                <span class="radio-custom"></span>
                <span class="radio-label-text">♾️ Permanent</span>
              </label>
            </div>
          </div>
          
          <div v-if="formData.assignmentType === 'today'" class="animate-in">
            <div class="form-field">
              <label>📅 Date <span class="required">*</span></label>
              <input type="date" v-model="formData.startDate" class="input">
            </div>
          </div>
          
          <div v-if="formData.assignmentType === 'range'" class="animate-in">
            <div class="form-row">
              <div class="form-field">
                <label>📅 Start Date <span class="required">*</span></label>
                <input type="date" v-model="formData.startDate" class="input">
              </div>
              <div class="form-field">
                <label>📅 End Date <span class="required">*</span></label>
                <input type="date" v-model="formData.endDate" class="input">
              </div>
            </div>
          </div>
          
          <div v-if="formData.assignmentType === 'permanent'" class="info-banner">
            <span class="info-icon">ℹ️</span>
            <div class="info-content">
              <strong>Permanent Field Work</strong>
              <p>This assignment has no end date and will remain active until manually completed.</p>
            </div>
          </div>
          
          <div class="form-field">
            <label>📍 Location <span class="optional">(Optional)</span></label>
            <div class="location-input-wrapper">
              <span class="location-icon">📍</span>
              <input type="text" v-model="formData.location" class="input" placeholder="e.g., Client site, Remote work, Construction site">
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-modal cancel" @click="closeModal">Cancel</button>
          <button class="btn-modal confirm" @click="saveItem" :disabled="saving">
            {{ saving ? 'Saving...' : (editingItem ? 'Update' : 'Register') }}
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
          <p>Are you sure you want to delete field work for <strong>{{ deleteItemName }}</strong>?</p>
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

const assignments = ref([])
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
  assignmentType: 'today',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  location: ''
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

const getTypeLabel = (type) => {
  const labels = { 'today': 'Today Only', 'range': 'Date Range', 'permanent': 'Permanent' }
  return labels[type] || type
}

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
    assignments.value = await attendanceService.getAllFieldWork?.() || []
  } catch (err) {
    error.value = 'Failed to load field work assignments'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingItem.value = null
  formData.value = {
    employeeId: null,
    assignmentType: 'today',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    location: ''
  }
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
  if (formData.value.assignmentType !== 'permanent' && !formData.value.startDate) {
    alert('Start date is required')
    return
  }
  if (formData.value.assignmentType === 'range' && !formData.value.endDate) {
    alert('End date is required for range type')
    return
  }
  
  saving.value = true
  try {
    if (editingItem.value) {
      await attendanceService.updateFieldWork(editingItem.value.id, formData.value)
    } else {
      await attendanceService.registerFieldWork(
        formData.value.employeeId,
        formData.value.assignmentType,
        formData.value.startDate,
        formData.value.assignmentType === 'range' ? formData.value.endDate : null,
        formData.value.location
      )
    }
    await fetchData()
    closeModal()
    
    // Show success message
    const successMsg = document.createElement('div')
    successMsg.className = 'success-toast'
    successMsg.innerHTML = '✓ Field work ' + (editingItem.value ? 'updated' : 'registered') + ' successfully'
    document.body.appendChild(successMsg)
    setTimeout(() => successMsg.remove(), 3000)
  } catch (err) {
    error.value = 'Failed to save field work assignment'
    console.error(err)
  } finally {
    saving.value = false
  }
}

const completeFieldWork = async (id) => {
  try {
    await attendanceService.completeFieldWork(id)
    await fetchData()
    
    const successMsg = document.createElement('div')
    successMsg.className = 'success-toast'
    successMsg.innerHTML = '✓ Field work marked as completed'
    document.body.appendChild(successMsg)
    setTimeout(() => successMsg.remove(), 3000)
  } catch (err) {
    error.value = 'Failed to complete field work'
    console.error(err)
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
    await attendanceService.deleteFieldWork(deleteId.value)
    await fetchData()
    closeDeleteModal()
  } catch (err) {
    error.value = 'Failed to delete field work'
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
  transition: box-shadow 0.2s;
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
  background: #059669;
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

.btn-add-small {
  background: #059669;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-add-small:hover {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5,150,105,0.3);
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
  font-size: 18px;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
}

.dept-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e0e7ff;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  color: #4f46e5;
}

.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.type-badge.today {
  background: #dbeafe;
  color: #2563eb;
}

.type-badge.range {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.permanent {
  background: #d1fae5;
  color: #059669;
}

.date-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.start-date {
  background: #f0fdf4;
  color: #059669;
}

.end-date {
  background: #fef3c7;
  color: #d97706;
}

.permanent-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #f3e8ff;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #9333ea;
}

.status-badge.active-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #e0e7ff;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #4f46e5;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #4f46e5;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-icon {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-icon.complete {
  background: #d1fae5;
  color: #059669;
}

.btn-icon.complete:hover {
  background: #059669;
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
  border-top-color: #059669;
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
  background: #059669;
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
  color: #059669;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
  text-decoration: underline;
}

.btn-link:hover {
  color: #047857;
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

.required {
  color: #ef4444;
  margin-left: 4px;
}

.optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 11px;
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
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5,150,105,0.1);
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

.location-input-wrapper {
  position: relative;
}

.location-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  pointer-events: none;
}

.location-input-wrapper .input {
  padding-left: 36px;
}

.radio-group {
  display: flex;
  gap: 24px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  padding-left: 24px;
}

.radio-label input {
  position: absolute;
  opacity: 0;
}

.radio-custom {
  position: absolute;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: white;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
}

.radio-label input:checked ~ .radio-custom {
  border-color: #059669;
}

.radio-custom:after {
  content: "";
  position: absolute;
  display: none;
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #059669;
}

.radio-label input:checked ~ .radio-custom:after {
  display: block;
}

.radio-label-text {
  font-size: 13px;
  color: #334155;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.info-banner {
  background: #ecfdf5;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.info-icon {
  font-size: 20px;
}

.info-content strong {
  display: block;
  font-size: 13px;
  color: #065f46;
  margin-bottom: 4px;
}

.info-content p {
  font-size: 12px;
  color: #047857;
  margin: 0;
}

.animate-in {
  animation: fadeInUp 0.3s ease;
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
  background: #059669;
  color: white;
}

.btn-modal.confirm:hover {
  background: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5,150,105,0.3);
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

.success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #10b981;
  color: white;
  padding: 12px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
  
  .radio-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .btn-icon {
    padding: 4px 8px;
    font-size: 10px;
  }
}
</style>