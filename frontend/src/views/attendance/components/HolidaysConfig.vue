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
        <span v-if="hasChanges" class="badge unsaved">Unsaved</span>
      </div>
      <div class="header-actions">
        <button class="btn-add-small" @click="addHoliday" :disabled="saving">
          <span class="btn-icon">+</span> Add
        </button>
        <button class="btn-save-small" @click="saveAll" :disabled="saving || !hasChanges">
          <span v-if="saving" class="spinner-small"></span>
          <span v-else class="btn-icon">💾</span>
          {{ saving ? 'Saving...' : 'Save' }}
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
              <th style="width: 30%">Holiday Name</th>
              <th style="width: 20%">Type</th>
              <th style="width: 15%">OT Rate</th>
              <th style="width: 10%">Recurring</th>
              <th style="width: 10%">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(holiday, index) in holidays" 
              :key="index" 
              :class="{ 
                'new-holiday': !holiday.id,
                'has-changes': holiday._hasChanges
              }"
            >
              <td class="date-cell">
                <div class="date-input-wrapper">
                  <span class="date-icon">📅</span>
                  <input 
                    type="date" 
                    v-model="holiday.holidayDate" 
                    class="input-sm"
                    @change="markChanged(holiday)"
                  >
                </div>
              </td>
              <td>
                <input 
                  type="text" 
                  v-model="holiday.name" 
                  class="input-sm" 
                  placeholder="e.g., Meskel"
                  @input="markChanged(holiday)"
                >
              </td>
              <td>
                <div class="select-wrapper">
                  <select 
                    v-model="holiday.holidayType" 
                    class="select-sm"
                    @change="markChanged(holiday)"
                  >
                    <option value="public">Public</option>
                    <option value="religious">Religious</option>
                    <option value="company">Company</option>
                  </select>
                  <span class="select-arrow">▼</span>
                </div>
              </td>
              <td>
                <div class="select-wrapper">
                  <select 
                    v-model.number="holiday.overtimeRate" 
                    class="select-sm rate-select"
                    @change="markChanged(holiday)"
                  >
                    <option :value="1.5">1.5x</option>
                    <option :value="2.0">2.0x</option>
                    <option :value="2.5">2.5x</option>
                    <option :value="3.0">3.0x</option>
                  </select>
                  <span class="select-arrow">▼</span>
                </div>
              </td>
              <td class="recurring-cell">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="holiday.isRecurring" 
                    class="checkbox"
                    @change="markChanged(holiday)"
                  >
                  <span class="checkbox-text">Yearly</span>
                </label>
              </td>
              <td class="action-buttons">
                <button 
                  class="btn-icon delete" 
                  @click="removeHoliday(holiday.id, index)" 
                  title="Delete holiday"
                  :disabled="saving"
                >
                  🗑️
                </button>
              </td>
            </tr>
            
            <tr v-if="holidays.length === 0">
              <td colspan="6" class="empty-row">
                <div class="empty-state-small">
                  <span class="empty-icon">🎉</span>
                  <p>No holidays configured</p>
                  <button class="btn-link" @click="addHoliday" :disabled="saving">Add your first holiday</button>
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
          <h3>Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body confirm-body">
          <div class="confirm-icon">🗑️</div>
          <p>Delete <strong>{{ deleteItemName }}</strong>?</p>
          <p class="confirm-warning">This cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-modal cancel" @click="closeDeleteModal">Cancel</button>
          <button class="btn-modal danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import attendanceService from '@/stores/attendanceService'

const holidays = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const showDeleteModal = ref(false)
const deleteId = ref(null)
const deleteIndex = ref(null)
const deleteItemName = ref('')
const originalHolidays = ref([])

const hasChanges = computed(() => {
  return JSON.stringify(holidays.value) !== JSON.stringify(originalHolidays.value)
})

const showToast = (message, type = 'success') => {
  const toast = document.createElement('div')
  toast.className = `success-toast ${type}`
  toast.innerHTML = type === 'success' ? `✓ ${message}` : type === 'error' ? `⚠️ ${message}` : `ℹ️ ${message}`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

const markChanged = (holiday) => {
  holiday._hasChanges = true
}

const saveOriginalState = () => {
  originalHolidays.value = JSON.parse(JSON.stringify(holidays.value))
}

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await attendanceService.getHolidays()
    holidays.value = data.map(h => ({
      ...h,
      overtimeRate: parseFloat(h.overtimeRate) // Ensure it's a number
    }))
    saveOriginalState()
  } catch (err) {
    error.value = 'Failed to load holidays'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const addHoliday = () => {
  const newHoliday = {
    id: null,
    name: '',
    holidayDate: new Date().toISOString().split('T')[0],
    holidayType: 'public',
    overtimeRate: 2.5,
    isRecurring: false,
    _hasChanges: true
  }
  holidays.value.push(newHoliday)
  showToast('New holiday added', 'info')
}

const removeHoliday = (id, index) => {
  if (id) {
    deleteId.value = id
    deleteIndex.value = index
    deleteItemName.value = holidays.value[index].name || 'this holiday'
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
  deleteItemName.value = ''
}

const confirmDelete = async () => {
  try {
    await attendanceService.deleteHoliday(deleteId.value)
    holidays.value.splice(deleteIndex.value, 1)
    saveOriginalState()
    closeDeleteModal()
    showToast('Holiday deleted', 'success')
  } catch (err) {
    showToast('Failed to delete', 'error')
    console.error(err)
  }
}

const saveAll = async () => {
  saving.value = true
  error.value = null
  let savedCount = 0
  
  try {
    for (const holiday of holidays.value) {
      if (!holiday.name || !holiday.holidayDate) continue
      
      // Ensure overtimeRate is a proper number
      let overtimeRateValue = parseFloat(holiday.overtimeRate)
      if (isNaN(overtimeRateValue)) {
        overtimeRateValue = 2.5
      }
      
      console.log(`Saving ${holiday.name} with OT rate: ${overtimeRateValue}`)
      
      const payload = {
        name: holiday.name,
        holidayDate: holiday.holidayDate,
        holidayType: holiday.holidayType,
        overtimeRate: overtimeRateValue,
        isRecurring: holiday.isRecurring || false
      }
      
      if (payload.isRecurring) {
        payload.year = null
      } else {
        payload.year = new Date(payload.holidayDate).getFullYear()
      }
      
      if (holiday.id) {
        await attendanceService.updateHoliday(holiday.id, payload)
      } else {
        await attendanceService.createHoliday(payload)
      }
      savedCount++
    }
    
    await fetchData()
    showToast(`Saved ${savedCount} holiday(s)`, 'success')
  } catch (err) {
    console.error('Save error:', err)
    showToast(err.response?.data?.error || 'Failed to save holidays', 'error')
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-icon {
  font-size: 24px;
}

.header-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-subtitle {
  font-size: 11px;
  color: #64748b;
  margin: 0;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 30px;
}

.badge.unsaved {
  background: #f59e0b;
  animation: pulse 1.5s infinite;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-add-small, .btn-save-small {
  padding: 5px 14px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
}

.btn-add-small {
  background: #ef4444;
  color: white;
}

.btn-add-small:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-save-small {
  background: #10b981;
  color: white;
}

.btn-save-small:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.btn-add-small:disabled, .btn-save-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 11px;
}

.card-body {
  padding: 20px;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:hover {
  background: #f8fafc;
}

.new-holiday {
  background: #fef3c7;
}

.has-changes {
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.date-cell {
  min-width: 120px;
}

.date-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-icon {
  font-size: 12px;
  opacity: 0.6;
}

.input-sm {
  padding: 6px 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 11px;
  width: 100%;
  background: white;
}

.input-sm:focus {
  outline: none;
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.1);
}

.select-sm {
  padding: 6px 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 11px;
  width: 100%;
  background: white;
  cursor: pointer;
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  padding-right: 28px;
}

.select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #94a3b8;
  pointer-events: none;
}

.rate-select {
  font-weight: 500;
}

.recurring-cell {
  text-align: center;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 10px;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon.delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-icon.delete:hover:not(:disabled) {
  background: #dc2626;
  color: white;
  transform: scale(1.05);
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #ef4444;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

.error-state {
  text-align: center;
  padding: 40px;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 12px;
}

.error-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.retry-btn {
  margin-top: 12px;
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.empty-row td {
  padding: 40px !important;
}

.empty-state-small {
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
  display: block;
  margin-bottom: 8px;
}

.btn-link {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 12px;
  margin-top: 6px;
  text-decoration: underline;
}

.btn-link:hover:not(:disabled) {
  color: #dc2626;
}

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
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideIn 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
}

.modal-close:hover {
  color: #ef4444;
}

.modal-body {
  padding: 20px;
  text-align: center;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.confirm-body p {
  margin: 6px 0;
  font-size: 13px;
  color: #475569;
}

.confirm-warning {
  font-size: 11px;
  color: #94a3b8;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-modal {
  padding: 8px 20px;
  border-radius: 30px;
  font-size: 12px;
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

.btn-modal.danger {
  background: #ef4444;
  color: white;
}

.btn-modal.danger:hover {
  background: #dc2626;
}

.success-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 13px;
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
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
    gap: 12px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .card-body {
    padding: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 6px 8px;
    font-size: 10px;
  }
  
  .btn-icon {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .input-sm, .select-sm {
    font-size: 10px;
    padding: 4px 6px;
  }
}
</style>