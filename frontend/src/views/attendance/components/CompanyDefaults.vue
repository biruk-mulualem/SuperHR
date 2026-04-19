<template>
  <div class="config-card">
    <div class="card-header">
      <div class="header-left">
        <span class="header-icon">🏢</span>
        <h3>{{ title }}</h3>
      </div>
      <button class="btn-save-small" @click="saveData" :disabled="loading">
        <span class="btn-icon">💾</span> {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>
    <div class="card-body">
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <p>Loading...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <span>⚠️ {{ error }}</span>
        <button @click="fetchData" class="retry-btn">Retry</button>
      </div>
      <div v-else>
        <!-- Company Defaults Form -->
        <div class="form-grid">
          <div class="form-field">
            <label>Check-In Time</label>
            <input type="time" v-model="formData.checkInTime" class="input">
            <small class="field-hint">Standard arrival time for employees</small>
          </div>

          <div class="form-field">
            <label>Check-Out Time</label>
            <input type="time" v-model="formData.checkOutTime" class="input">
            <small class="field-hint">Standard departure time for employees</small>
          </div>

          <div v-if="shiftType === 'day'" class="form-field">
            <label>Late Threshold</label>
            <input type="number" v-model="formData.lateThresholdMinutes" class="input" min="0">
            <small class="field-hint">Minutes after check-in to be marked as late</small>
          </div>

          <div v-if="shiftType === 'day'" class="form-field">
            <label>Absent After</label>
            <input type="number" v-model="formData.absentAfterMinutes" class="input" min="0">
            <small class="field-hint">Minutes after check-in to be marked as absent</small>
          </div>

          <div v-if="shiftType === 'day'" class="form-field">
            <label>Lunch Duration</label>
            <input type="number" v-model="formData.lunchDurationMinutes" class="input" min="0">
            <small class="field-hint">Default lunch break duration in minutes</small>
          </div>

          <div v-if="shiftType === 'day'" class="form-field">
            <label>Lunch Start Time</label>
            <input type="time" v-model="formData.lunchStartTime" class="input">
            <small class="field-hint">Default time when lunch break begins</small>
          </div>

          <div v-if="shiftType === 'day'" class="form-field">
            <label>Late Night Trigger Time</label>
            <input type="time" v-model="formData.lateNightTriggerTime" class="input">
            <small class="field-hint">Time when late night adjustment is triggered (e.g., 00:00)</small>
          </div>

          <div v-if="shiftType === 'day'" class="form-field">
            <label>Late Night Compensatory Hrs</label>
            <input type="number" v-model="formData.lateNightCompensatoryHours" class="input" min="0" step="0.5">
            <small class="field-hint">Hours added to next day's check-in as compensation</small>
          </div>

          <div v-if="shiftType === 'night'" class="form-field">
            <label>Dinner Start Time</label>
            <input type="time" v-model="formData.dinnerStartTime" class="input">
            <small class="field-hint">Default time when dinner break begins for night shift</small>
          </div>

          <div v-if="shiftType === 'night'" class="form-field">
            <label>Dinner Duration</label>
            <input type="number" v-model="formData.dinnerDurationMinutes" class="input" min="1">
            <small class="field-hint">Dinner break duration in minutes for night shift</small>
          </div>
        </div>

        <!-- Working Days Configuration Section -->
        <div class="working-days-section">
          <div class="section-header">
            <span class="section-icon">📅</span>
            <h4>Working Days Configuration</h4>
            <small class="section-hint">{{ shiftType === 'day' ? 'Day Shift' : 'Night Shift' }}</small>
          </div>
          
          <div v-if="workingDaysLoading" class="working-days-loading">
            <div class="mini-loader"></div>
            <span>Loading working days...</span>
          </div>
          
          <div v-else-if="filteredWorkingDays.length === 0" class="working-days-empty">
            <span>📅</span>
            <p>No working days configuration found</p>
          </div>
          
          <div v-else class="working-days-grid">
            <div v-for="config in filteredWorkingDays" :key="config.id" class="working-day-card" :class="{ 'non-working': !config.isWorkingDay }">
              <div class="day-header">
                <span class="day-icon">{{ getDayIcon(config.dayOfWeek) }}</span>
                <span class="day-name">{{ formatDayName(config.dayOfWeek) }}</span>
              </div>
              <div class="day-toggle">
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="config.isWorkingDay" 
                    @change="updateWorkingDay(config)"
                  >
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label" :class="{ 'working': config.isWorkingDay, 'non-working': !config.isWorkingDay }">
                  {{ config.isWorkingDay ? 'Working' : 'Non-Working' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import attendanceService from '@/stores/attendanceService'

const props = defineProps({
  shiftType: {
    type: String,
    default: 'day'
  }
})

const title = props.shiftType === 'day' ? 'Company Defaults (Day Shift)' : 'Company Defaults (Night Shift)'
const formData = ref({})
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const configId = ref(null)

// Working days state
const allWorkingDays = ref([])
const workingDaysLoading = ref(false)

// Filter working days by current shift type
const filteredWorkingDays = computed(() => {
  if (!allWorkingDays.value || !Array.isArray(allWorkingDays.value)) {
    return []
  }
  return allWorkingDays.value.filter(day => day.shiftType === props.shiftType)
})

const showToast = (message, type = 'success') => {
  const toast = document.createElement('div')
  toast.className = `success-toast ${type}`
  toast.innerHTML = type === 'success' ? `✓ ${message}` : type === 'error' ? `⚠️ ${message}` : `ℹ️ ${message}`
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

const getDayIcon = (day) => {
  const icons = {
    'monday': '',
    'tuesday': '',
    'wednesday': '',
    'thursday': '',
    'friday': '',
    'saturday': '',
    'sunday': ''
  }
  return icons[day?.toLowerCase()] || '📅'
}

const formatDayName = (day) => {
  if (!day) return ''
  return day.charAt(0).toUpperCase() + day.slice(1)
}

const fetchWorkingDays = async () => {
  workingDaysLoading.value = true
  try {
    const data = await attendanceService.getWorkingDaysConfig()
    console.log('Working days data received:', data)
    
    if (data && Array.isArray(data)) {
      allWorkingDays.value = data
    } else {
      allWorkingDays.value = []
    }
    console.log('Filtered working days:', filteredWorkingDays.value)
  } catch (err) {
    console.error('Failed to fetch working days:', err)
    showToast('Failed to load working days configuration', 'error')
    allWorkingDays.value = []
  } finally {
    workingDaysLoading.value = false
  }
}

const updateWorkingDay = async (config) => {
  const originalValue = config.isWorkingDay
  try {
    await attendanceService.updateWorkingDaysConfig(config.id, { isWorkingDay: config.isWorkingDay })
    showToast(`${formatDayName(config.dayOfWeek)} updated to ${config.isWorkingDay ? 'Working Day' : 'Non-Working Day'}`, 'success')
  } catch (err) {
    console.error('Failed to update working day:', err)
    showToast('Failed to update working day', 'error')
    config.isWorkingDay = originalValue
  }
}

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const defaults = await attendanceService.getCompanyDefaults()
    
    const configs = defaults.filter(d => d.shiftType === props.shiftType && d.isActive === true)
    const config = configs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]
    
    if (config) {
      configId.value = config.id
      formData.value = {
        checkInTime: config.checkInTime?.slice(0,5) || (props.shiftType === 'day' ? '06:20' : '22:00'),
        checkOutTime: config.checkOutTime?.slice(0,5) || (props.shiftType === 'day' ? '18:00' : '06:00'),
        lateThresholdMinutes: config.lateThresholdMinutes ?? 5,
        absentAfterMinutes: config.absentAfterMinutes ?? 60,
        lunchDurationMinutes: config.lunchDurationMinutes ?? 40,
        lunchStartTime: config.lunchStartTime?.slice(0,5) || '12:00',
        lateNightTriggerTime: config.lateNightTriggerTime?.slice(0,5) || '00:00',
        lateNightCompensatoryHours: config.lateNightCompensatoryHours ?? 2,
        dinnerStartTime: config.dinnerStartTime?.slice(0,5) || '02:00',
        dinnerDurationMinutes: config.dinnerDurationMinutes ?? 40
      }
    }
  } catch (err) {
    error.value = 'Failed to load company defaults'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const saveData = async () => {
  if (!configId.value) {
    error.value = 'No configuration found to update'
    return
  }
  
  saving.value = true
  error.value = null
  
  try {
    const payload = {
      shiftType: props.shiftType,
      checkInTime: formData.value.checkInTime,
      checkOutTime: formData.value.checkOutTime,
      checkOutDayOffset: props.shiftType === 'night' ? 1 : 0,
      isActive: true
    }
    
    if (props.shiftType === 'day') {
      payload.lateThresholdMinutes = parseInt(formData.value.lateThresholdMinutes)
      payload.absentAfterMinutes = parseInt(formData.value.absentAfterMinutes)
      payload.lunchDurationMinutes = parseInt(formData.value.lunchDurationMinutes)
      payload.lunchStartTime = formData.value.lunchStartTime
      payload.lateNightTriggerTime = formData.value.lateNightTriggerTime
      payload.lateNightCompensatoryHours = parseFloat(formData.value.lateNightCompensatoryHours)
    } else {
      payload.dinnerStartTime = formData.value.dinnerStartTime
      payload.dinnerDurationMinutes = parseInt(formData.value.dinnerDurationMinutes)
    }
    
    await attendanceService.updateCompanyDefault(configId.value, payload)
    showToast(`${title} saved successfully`, 'success')
    await fetchData()
  } catch (err) {
    console.error('Save error:', err)
    error.value = err.response?.data?.error || 'Failed to save'
    showToast(error.value, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchData()
  fetchWorkingDays()
})
</script>

<style scoped>
/* Keep all your existing styles, just add these */
.working-days-empty {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 12px;
}

.working-days-empty span {
  font-size: 48px;
  opacity: 0.5;
  display: block;
  margin-bottom: 12px;
}

.working-days-empty p {
  font-size: 14px;
  margin: 0;
}

/* Rest of your existing styles */
.config-card {
  background: white;
  border-radius: 20px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid #e8edf2;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fafcff;
  border-bottom: 1px solid #e8edf2;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-icon { font-size: 22px; }
.card-header h3 { font-size: 16px; font-weight: 600; color: #1e293b; }
.btn-save-small {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 30px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-save-small:hover {
  background: #059669;
  transform: translateY(-1px);
}
.btn-save-small:disabled { 
  opacity: 0.6; 
  cursor: not-allowed;
  transform: none;
}
.btn-icon { font-size: 12px; }
.card-body { padding: 24px; }
.form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e8edf2;
}
.form-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}
.field-hint {
  display: block;
  font-size: 10px;
  color: #10b981;
  margin-top: 6px;
  line-height: 1.3;
}
.input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
}
.input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
}
.working-days-section {
  margin-top: 8px;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8edf2;
}
.section-icon {
  font-size: 24px;
}
.section-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}
.section-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
}
.working-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}
.working-day-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}
.working-day-card.non-working {
  background: #fef2f2;
  border-color: #fecaca;
}
.working-day-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.day-icon {
  font-size: 28px;
}
.day-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.working-day-card.non-working .day-name {
  color: #dc2626;
}
.day-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}
input:checked + .toggle-slider {
  background-color: #10b981;
}
input:checked + .toggle-slider:before {
  transform: translateX(26px);
}
.toggle-label {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
}
.toggle-label.working {
  color: #059669;
  background: #d1fae5;
}
.toggle-label.non-working {
  color: #dc2626;
  background: #fee2e2;
}
.working-days-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #64748b;
}
.mini-loader {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.loading-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
}
.loader {
  width: 30px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: #10b981;
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
.retry-btn {
  margin-top: 12px;
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
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
@media (max-width: 1024px) {
  .form-grid { grid-template-columns: repeat(2, 1fr); }
  .working-days-grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .working-days-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>