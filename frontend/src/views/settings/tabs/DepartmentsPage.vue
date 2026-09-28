<!-- FILE: src/views/tabs/DepartmentsPage.vue -->
<template>
  <div class="settings-card">
    <div class="card-header">
      <h2>Departments</h2>
      <button class="btn-add" @click="openModal()">+ Add Department</button>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Manager</th>
            <th>Status</th>
            <th style="width: 100px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dept in departments" :key="dept.departmentId">
            <td>{{ dept.code }}</td>
            <td>{{ dept.name }}</td>
            <td>{{ dept.manager?.fullName || dept.managerName || '-' }}</td>
            <td>
              <button
                @click="toggleStatus(dept)"
                :class="['status-toggle', dept.isActive ? 'active' : 'inactive']"
              >
                <span class="status-dot"></span>
                {{ dept.isActive ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="actions">
              <button class="action-btn edit" @click="openModal(dept)" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                </svg>
              </button>
              <button class="action-btn delete" @click="confirmDelete(dept)" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="departments.length === 0">
            <td colspan="5" class="empty">No departments found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Department Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingItem ? 'Edit Department' : 'Add Department' }}</h3>
          <button class="close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Code *</label>
            <input type="text" v-model="form.code">
          </div>
          <div class="form-group">
            <label>Name *</label>
            <input type="text" v-model="form.name">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="form.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Manager</label>
            <select v-model="form.managerId">
              <option :value="null">Select Manager</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.fullName || emp.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="form.isActive">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancel</button>
          <button class="btn-save" @click="handleSave" :disabled="saving">Save</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDelete" class="modal-overlay" @click="closeDelete">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close" @click="closeDelete">×</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Are you sure you want to delete <strong>{{ deleteTarget?.name || deleteTarget?.title }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDelete">Cancel</button>
          <button class="btn-delete" @click="handleDelete" :disabled="deleting">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import settingService from '@/stores/settingService'
import employeeService from '@/stores/employee'

const addToast = inject('addToast')

const departments = ref([])
const employees = ref([])
const showModal = ref(false)
const showDelete = ref(false)
const editingItem = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({
  code: '',
  name: '',
  description: '',
  managerId: null,
  isActive: true
})

const loadData = async () => {
  try {
    const res = await settingService.getDepartments(1, 100, true)
    if (res.success) departments.value = res.data
  } catch (error) {
    addToast(error.error || 'Failed to load departments', 'error')
  }
}

const loadEmployees = async () => {
  try {
    const res = await employeeService.getEmployees({ limit: 100 })
    if (res.success) employees.value = res.data || []
  } catch (error) {
    console.error('Error loading employees:', error)
  }
}

const openModal = (item = null) => {
  editingItem.value = item
  if (item) {
    form.code = item.code
    form.name = item.name
    form.description = item.description || ''
    form.managerId = item.managerId
    form.isActive = item.isActive
  } else {
    form.code = ''
    form.name = ''
    form.description = ''
    form.managerId = null
    form.isActive = true
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
}

const handleSave = async () => {
  saving.value = true
  try {
    let res
    if (editingItem.value) {
      res = await settingService.updateDepartment(editingItem.value.departmentId, form)
    } else {
      res = await settingService.createDepartment(form)
    }
    if (res.success) {
      addToast(res.message || 'Department saved', 'success')
      await loadData()
      closeModal()
    } else {
      addToast(res.error || 'Failed to save', 'error')
    }
  } catch (error) {
    addToast(error.message || 'Failed to save', 'error')
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (dept) => {
  try {
    const res = await settingService.toggleDepartmentStatus(dept.departmentId, !dept.isActive)
    if (res.success) {
      dept.isActive = !dept.isActive
      addToast(`Department ${dept.isActive ? 'activated' : 'deactivated'}`, 'success')
    }
  } catch (error) {
    addToast(error.error || 'Failed to update status', 'error')
  }
}

const confirmDelete = (item) => {
  deleteTarget.value = item
  showDelete.value = true
}

const closeDelete = () => {
  showDelete.value = false
  deleteTarget.value = null
}

const handleDelete = async () => {
  deleting.value = true
  try {
    const res = await settingService.deleteDepartment(deleteTarget.value.departmentId)
    if (res.success) {
      addToast('Department deleted successfully', 'success')
      await loadData()
      closeDelete()
    }
  } catch (error) {
    addToast(error.error || 'Failed to delete', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadData(), loadEmployees()])
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
.btn-add {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: #6366f1;
  color: white;
  transition: background 0.2s;
}
.btn-add:hover {
  background: #4f46e5;
}
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}
.data-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
}
.data-table td {
  font-size: 14px;
  color: #334155;
}
.empty {
  text-align: center;
  padding: 40px !important;
  color: #94a3b8;
}
.status-toggle {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.status-toggle.active {
  background: #d1fae5;
  color: #059669;
}
.status-toggle.inactive {
  background: #fee2e2;
  color: #dc2626;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
  margin-right: 6px;
}
.actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn svg {
  width: 14px;
  height: 14px;
}
.action-btn.edit {
  background: #3b82f620;
  color: #3b82f6;
}
.action-btn.edit:hover {
  background: #3b82f640;
}
.action-btn.delete {
  background: #ef444420;
  color: #ef4444;
}
.action-btn.delete:hover {
  background: #ef444440;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 550px;
  max-height: 85vh;
  overflow-y: auto;
}
.delete-modal {
  max-width: 400px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}
.close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
}
.modal-body {
  padding: 20px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #334155;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}
.btn-cancel {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
}
.btn-save {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-save:disabled,
.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-delete {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}
.delete-warning {
  text-align: center;
  padding: 20px;
}
.delete-warning svg {
  width: 48px;
  height: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}
.delete-warning p {
  margin: 8px 0;
  color: #475569;
}
.warning-text {
  font-size: 12px;
  color: #94a3b8;
}
</style>