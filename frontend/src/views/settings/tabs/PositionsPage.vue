<!-- FILE: src/views/tabs/PositionsPage.vue -->
<template>
  <div class="settings-card">
    <div class="card-header">
      <h2>Positions</h2>
      <button class="btn-add" @click="openModal()">+ Add Position</button>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Department</th>
            <th>Level</th>
            <th>Status</th>
            <th style="width: 100px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="position in positions" :key="position.positionId">
            <td>{{ position.code }}</td>
            <td>{{ position.title }}</td>
            <td>{{ getDepartmentName(position.departmentId) }}</td>
            <td>{{ position.level || '-' }}</td>
            <td>
              <button
                @click="toggleStatus(position)"
                :class="['status-toggle', position.isActive ? 'active' : 'inactive']"
              >
                <span class="status-dot"></span>
                {{ position.isActive ? 'Active' : 'Inactive' }}
              </button>
            </td>
            <td class="actions">
              <button class="action-btn edit" @click="openModal(position)" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                </svg>
              </button>
              <button class="action-btn delete" @click="confirmDelete(position)" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="positions.length === 0">
            <td colspan="6" class="empty">No positions found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Position Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingItem ? 'Edit Position' : 'Add Position' }}</h3>
          <button class="close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Code *</label>
              <input type="text" v-model="form.code">
            </div>
            <div class="form-group">
              <label>Title *</label>
              <input type="text" v-model="form.title">
            </div>
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model="form.departmentId">
              <option :value="null">Select Department</option>
              <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">{{ dept.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Level</label>
            <select v-model="form.level">
              <option value="">Select Level</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
              <option>Manager</option>
              <option>Director</option>
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
            <p>Are you sure you want to delete <strong>{{ deleteTarget?.title || deleteTarget?.name }}</strong>?</p>
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

const addToast = inject('addToast')

const positions = ref([])
const departments = ref([])
const showModal = ref(false)
const showDelete = ref(false)
const editingItem = ref(null)
const deleteTarget = ref(null)
const saving = ref(false)
const deleting = ref(false)

const form = reactive({
  code: '',
  title: '',
  departmentId: null,
  level: '',
  isActive: true
})

const loadData = async () => {
  try {
    const [posRes, deptRes] = await Promise.all([
      settingService.getPositions(1, 100, true),
      settingService.getDepartments(1, 100, true)
    ])
    if (posRes.success) positions.value = posRes.data
    if (deptRes.success) departments.value = deptRes.data
  } catch (error) {
    addToast(error.error || 'Failed to load data', 'error')
  }
}

const getDepartmentName = (id) => {
  const dept = departments.value.find(d => d.departmentId === id)
  return dept ? dept.name : '-'
}

const openModal = (item = null) => {
  editingItem.value = item
  if (item) {
    form.code = item.code
    form.title = item.title
    form.departmentId = item.departmentId
    form.level = item.level || ''
    form.isActive = item.isActive
  } else {
    form.code = ''
    form.title = ''
    form.departmentId = null
    form.level = ''
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
    const formData = {
      code: form.code,
      title: form.title,
      departmentId: form.departmentId || null,
      level: form.level || null,
      isActive: form.isActive
    }
    let res
    if (editingItem.value) {
      res = await settingService.updatePosition(editingItem.value.positionId, formData)
    } else {
      res = await settingService.createPosition(formData)
    }
    if (res.success) {
      addToast(res.message || 'Position saved', 'success')
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

const toggleStatus = async (item) => {
  try {
    const res = await settingService.togglePositionStatus(item.positionId, !item.isActive)
    if (res.success) {
      item.isActive = !item.isActive
      addToast(`Position ${item.isActive ? 'activated' : 'deactivated'}`, 'success')
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
    const res = await settingService.deletePosition(deleteTarget.value.positionId)
    if (res.success) {
      addToast('Position deleted successfully', 'success')
      await loadData()
      closeDelete()
    }
  } catch (error) {
    addToast(error.error || 'Failed to delete', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
/* Reuse styles from DepartmentsPage */
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
}
.btn-add:hover {
  background: #4f46e5;
}
.table-responsive { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}
.data-table th { background: #f8fafc; font-weight: 600; font-size: 13px; color: #475569; }
.data-table td { font-size: 14px; color: #334155; }
.empty { text-align: center; padding: 40px !important; color: #94a3b8; }
.status-toggle {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
.status-toggle.active { background: #d1fae5; color: #059669; }
.status-toggle.inactive { background: #fee2e2; color: #dc2626; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; margin-right: 6px; }
.actions { display: flex; gap: 8px; }
.action-btn { width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; }
.action-btn svg { width: 14px; height: 14px; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.delete { background: #ef444420; color: #ef4444; }

/* Modal Styles - same as DepartmentsPage */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
.delete-modal { max-width: 400px; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 { font-size: 18px; font-weight: 600; }
.close { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 20px; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}
.form-group { margin-bottom: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #334155; }
.form-group input, .form-group select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.btn-cancel { padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; }
.btn-save { padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; }
.btn-save:disabled, .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-delete { padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; }
.btn-delete:hover:not(:disabled) { background: #dc2626; }
.delete-warning { text-align: center; padding: 20px; }
.delete-warning svg { width: 48px; height: 48px; color: #ef4444; margin-bottom: 16px; }
.delete-warning p { margin: 8px 0; color: #475569; }
.warning-text { font-size: 12px; color: #94a3b8; }

@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>