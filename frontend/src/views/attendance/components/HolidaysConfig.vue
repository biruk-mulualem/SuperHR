<template>
  <div class="config-card">
    <div class="card-header">
      <div class="header-left">
        <span class="header-icon">🎉</span>
        <div class="header-info">
          <h3>Ethiopian Holidays</h3>
          <p class="header-subtitle">Configure national, religious, and company holidays</p>
        </div>
        <span class="badge">{{ holidays.length }}</span>
      </div>
      <div class="header-actions">
        <button class="btn-add-small" @click="addHoliday">
          <span class="btn-icon">+</span> Add Holiday
        </button>
        <button class="btn-save-small" @click="saveAll" :disabled="saving">
          <span class="btn-icon">💾</span> Save All
        </button>
      </div>
    </div>
    
    <div class="card-body">
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Loading holidays...</p>
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
              <th style="width: 15%">Date</th>
              <th style="width: 35%">Holiday Name</th>
              <th style="width: 20%">Type</th>
              <th style="width: 20%">OT Rate</th>
              <th style="width: 10%">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(holiday, index) in holidays" :key="index" :class="{ 'new-holiday': !holiday.id }">
              <td class="date-cell">
                <div class="date-input-wrapper">
                  <span class="date-icon">📅</span>
                  <input type="date" v-model="holiday.holidayDate" class="input-sm">
                </div>
               </td>
               <td>
                <input type="text" v-model="holiday.name" class="input-sm" placeholder="e.g., Meskel, Ethiopian Christmas">
               </td>
               <td>
                <div class="select-wrapper">
                  <select v-model="holiday.holidayType" class="select-sm">
                    <option value="public">🏛️ Public</option>
                    <option value="religious">⛪ Religious</option>
                    <option value="company">🏢 Company</option>
                  </select>
                  <span class="select-arrow">▼</span>
                </div>
               </td>
               <td>
                <div class="select-wrapper">
                  <select v-model="holiday.overtimeRate" class="select-sm rate-select">
                    <option :value="1.5">1.5x (Time and a half)</option>
                    <option :value="2.0">2.0x (Double time)</option>
                    <option :value="2.5">2.5x (Double time and a half)</option>
                    <option :value="3.0">3.0x (Triple time)</option>
                  </select>
                  <span class="select-arrow">▼</span>
                </div>
               </td>
              <td class="action-buttons">
                <button class="btn-icon delete" @click="removeHoliday(holiday.id, index)" title="Delete holiday">
                  🗑️
                </button>
               </td>
             </tr>
            
            <tr v-if="holidays.length === 0">
              <td colspan="5" class="empty-row">
                <div class="empty-state-small">
                  <span class="empty-icon">🎉</span>
                  <p>No holidays configured</p>
                  <button class="btn-link" @click="addHoliday">Add your first holiday</button>
                </div>
               </td>
             </tr>
          </tbody>
        </table>
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
          <p>Are you sure you want to delete this holiday?</p>
          <p class="confirm-warning">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-modal cancel" @click="closeDeleteModal">Cancel</button>
          <button class="btn-modal danger" @click="confirmDelete">Delete Permanently</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import attendanceService from '@/stores/attendanceService'

const holidays = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const showDeleteModal = ref(false)
const deleteId = ref(null)
const deleteIndex = ref(null)

// Toast function
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div')
  toast.className = `success-toast ${type}`
  toast.innerHTML = type === 'success' ? `✓ ${message}` : `⚠️ ${message}`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    holidays.value = await attendanceService.getHolidays()
  } catch (err) {
    error.value = 'Failed to load holidays'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const addHoliday = () => {
  holidays.value.push({
    id: null,
    name: '',
    holidayDate: new Date().toISOString().split('T')[0],
    holidayType: 'public',
    overtimeRate: 2.5
  })
  showToast('New holiday added', 'info')
}

const removeHoliday = (id, index) => {
  if (id) {
    deleteId.value = id
    deleteIndex.value = index
    showDeleteModal.value = true
  } else {
    holidays.value.splice(index, 1)
    showToast('Holiday removed', 'info')
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteId.value = null
  deleteIndex.value = null
}

const confirmDelete = async () => {
  try {
    await attendanceService.deleteHoliday(deleteId.value)
    holidays.value.splice(deleteIndex.value, 1)
    closeDeleteModal()
    showToast('Holiday deleted successfully', 'success')
  } catch (err) {
    showToast('Failed to delete holiday', 'error')
    console.error(err)
  }
}

const saveAll = async () => {
  saving.value = true
  error.value = null
  let savedCount = 0
  let createdCount = 0
  let updatedCount = 0
  
  try {
    for (const holiday of holidays.value) {
      if (holiday.id) {
        await attendanceService.updateHoliday(holiday.id, holiday)
        updatedCount++
      } else if (holiday.name && holiday.holidayDate) {
        await attendanceService.createHoliday(holiday)
        createdCount++
        savedCount++
      }
    }
    await fetchData()
    
    if (createdCount > 0 && updatedCount > 0) {
      showToast(`Created ${createdCount} and updated ${updatedCount} holiday(s)`, 'success')
    } else if (createdCount > 0) {
      showToast(`Created ${createdCount} new holiday(s)`, 'success')
    } else if (updatedCount > 0) {
      showToast(`Updated ${updatedCount} holiday(s)`, 'success')
    } else {
      showToast('No changes to save', 'info')
    }
  } catch (err) {
    showToast('Failed to save holidays', 'error')
    console.error(err)
  } finally {
    saving.value = false
  }
}

onMounted(fetchData)
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
  background: #ef4444;
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
  background: #ef4444;
  color: white;
}

.btn-add-small:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239,68,68,0.3);
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

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:hover {
  background: #f8fafc;
}

.new-holiday {
  background: #fef3c7;
}

.new-holiday:hover {
  background: #fde68a;
}

.date-cell {
  min-width: 130px;
}

.date-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-icon {
  font-size: 14px;
  opacity: 0.6;
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
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
}

.select-sm {
  padding: 8px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 12px;
  width: 100%;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.select-sm:focus {
  outline: none;
  border-color: #ef4444;
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

.rate-select {
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
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
  border-top-color: #ef4444;
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
  background: #ef4444;
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
  color: #ef4444;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
  text-decoration: underline;
}

.btn-link:hover {
  color: #dc2626;
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
  max-width: 440px;
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
  text-align: center;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: white;
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

.btn-modal.danger {
  background: #ef4444;
  color: white;
}

.btn-modal.danger:hover {
  background: #dc2626;
}

.success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.success-toast.success {
  background: #10b981;
  color: white;
}

.success-toast.error {
  background: #ef4444;
  color: white;
}

.success-toast.info {
  background: #3b82f6;
  color: white;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  
  .input-sm, .select-sm {
    font-size: 11px;
    padding: 6px 8px;
  }
}
</style>