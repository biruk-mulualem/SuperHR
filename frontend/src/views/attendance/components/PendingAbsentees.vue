<template>
  <div class="pending-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1>⚠️ Pending Attendance Review</h1>
        <p class="subtitle">Employees who have passed their check-in threshold</p>
      </div>
      <div class="header-right">
        <div class="time-badge">{{ currentTime }}</div>
        <button class="refresh-btn" @click="fetchPending" :disabled="loading">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-number">{{ pagination.total }}</div>
        <div class="stat-label">Need Review</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ selectedIds.length }}</div>
        <div class="stat-label">Selected</div>
      </div>
    </div>

    <!-- Warning Box -->
    <div class="warning-box">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <strong>Important: Different Actions Have Different Consequences</strong>
        <div class="warning-list">
          <span class="badge-absent">ABSENT</span> = No pay, can work afternoon (half day)
          <span class="badge-sick">SICK</span> = Paid sick leave, cannot work
          <span class="badge-leave">LEAVE</span> = <strong>Paid leave</strong> (full day pay), cannot work
          <span class="badge-late">ALLOW LATE</span> = Full day pay, just late
        </div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search by name or employee code..."
          class="search-input"
          @input="onSearchChange"
        />
      </div>
      <select v-model="filters.departmentId" class="filter-select" @change="fetchPending">
        <option value="">All Departments</option>
        <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">
          {{ dept.name }}
        </option>
      </select>
      <select v-model="filters.sortBy" class="filter-select" @change="fetchPending">
        <option value="lateMinutes">Sort by Minutes Late</option>
        <option value="employeeName">Sort by Employee Name</option>
      </select>
      <select v-model="filters.sortOrder" class="filter-select" @change="fetchPending">
        <option value="ASC">Ascending (Smallest first)</option>
        <option value="DESC">Descending (Largest first)</option>
      </select>
    </div>

    <!-- Recent Actions Panel -->
    <div v-if="recentActions.length > 0" class="recent-actions">
      <div class="recent-header">
        <span>📋 Recent Actions (Last 5 minutes)</span>
        <button class="clear-recent" @click="clearRecentActions">Clear</button>
      </div>
      <div v-for="action in recentActions" :key="action.id" class="action-item">
        <span class="action-time">{{ action.time }}</span>
        <span class="action-user">{{ action.user }}</span>
        <span :class="['action-badge', action.action]">{{ action.action.toUpperCase() }}</span>
        <span class="action-count">{{ action.employeeCount }} employee(s)</span>
        <button class="undo-btn" @click="undoAction(action.id)">↩️ Undo</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading pending employees...</span>
    </div>

    <!-- Table -->
    <div v-else-if="pendingEmployees.length === 0" class="empty-state">
      <div class="empty-icon">✅</div>
      <h3>All caught up!</h3>
      <p>No employees are past their check-in threshold</p>
    </div>

    <div v-else class="table-container">
      <table class="pending-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" @change="toggleSelectAll" v-model="selectAll" />
            </th>
            <th>Employee</th>
            <th>Department</th>
            <th>Expected Check-in</th>
            <th>Absent At</th>
            <th>Minutes Late</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in pendingEmployees" :key="emp.employeeId">
            <td class="checkbox-col">
              <input type="checkbox" v-model="selectedIds" :value="emp.employeeId" />
            </td>
            <td class="employee-cell">
              <div class="employee-info">
                <div class="employee-avatar">
                  <img v-if="emp.profilePictureUrl" :src="emp.profilePictureUrl" class="avatar-img" />
                  <span v-else>{{ (emp.employeeName?.charAt(0) || 'U') }}</span>
                </div>
                <div>
                  <div class="employee-name">{{ emp.employeeName }}</div>
                  <div class="employee-code">{{ emp.employeeCode }}</div>
                </div>
              </div>
            </td>
            <td>{{ emp.departmentName || '—' }}</td>
            <td class="time-cell">{{ formatTimeDisplay(emp.expectedCheckIn) }}</td>
            <td class="warning-cell">{{ formatTimeDisplay(emp.absentThreshold) }}</td>
            <td class="late-cell">
              <span class="late-badge">{{ emp.lateMinutes }} min</span>
            </td>
            <td><span class="badge pending">No check-in</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button 
        class="page-btn" 
        :disabled="pagination.page === 1" 
        @click="changePage(pagination.page - 1)"
      >
        ← Previous
      </button>
      <span class="page-info">
        Page {{ pagination.page }} of {{ pagination.totalPages }} ({{ pagination.total }} total)
      </span>
      <button 
        class="page-btn" 
        :disabled="pagination.page === pagination.totalPages" 
        @click="changePage(pagination.page + 1)"
      >
        Next →
      </button>
    </div>

    <!-- Action Buttons - Color Coded -->
    <div v-if="selectedIds.length > 0" class="action-bar">
      <!-- <div class="selected-info">
        <strong>{{ selectedIds.length }}</strong> employee(s) selected
      </div> -->
      <div class="action-buttons">
        <button class="btn-absent" @click="openConfirmModal('absent')" :disabled="processing">
          ❌ MARK as ABSENT (No Pay)
        </button>
        <button class="btn-sick" @click="openConfirmModal('sick')" :disabled="processing">
          🤒 MARK as SICK (Paid Leave)
        </button>
        <button class="btn-leave" @click="openConfirmModal('leave')" :disabled="processing">
          📝 MARK as LEAVE (Paid)
        </button>
        <button class="btn-late" @click="openLateModal" :disabled="processing">
          ⏰ ALLOW Late Check-in
        </button>
      </div>
    </div>

    <!-- Enhanced Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
      <div class="modal-content">
        <div class="modal-header" :class="pendingAction">
          <h3>⚠️ Confirm Action</h3>
          <button class="modal-close" @click="showConfirmModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>You are about to mark <strong>{{ selectedIds.length }}</strong> employee(s) as:</p>
          
          <div v-if="pendingAction === 'absent'" class="action-description absent">
            <div class="action-icon">❌</div>
            <div class="action-details">
              <strong>ABSENT (No Pay)</strong>
              <ul>
                <li>Employee will receive <strong>NO pay</strong> for today</li>
                <li>Can still check in afternoon for <strong>HALF DAY</strong></li>
                <li>Will appear as <strong>"Absent"</strong> in reports</li>
                <li>Counts toward attendance percentage</li>
              </ul>
            </div>
          </div>
          
          <div v-if="pendingAction === 'sick'" class="action-description sick">
            <div class="action-icon">🤒</div>
            <div class="action-details">
              <strong>SICK (Paid Leave)</strong>
              <ul>
                <li>Employee receives <strong>paid sick leave</strong> (if policy applies)</li>
                <li><strong>Cannot check in</strong> for the day</li>
                <li>Will appear as <strong>"Sick Leave"</strong> in reports</li>
                <li><strong>Does NOT count</strong> as absent</li>
              </ul>
            </div>
          </div>
          
          <div v-if="pendingAction === 'leave'" class="action-description leave">
            <div class="action-icon">📝</div>
            <div class="action-details">
              <strong>LEAVE (Paid)</strong>
              <ul>
                <li>Employee receives <strong>paid leave</strong> (full day pay)</li>
                <li><strong>Cannot check in</strong> for the day</li>
                <li>Will appear as <strong>"On Leave"</strong> in reports</li>
                <li><strong>Does NOT count</strong> as absent</li>
              </ul>
            </div>
          </div>
          
          <div v-if="pendingAction === 'allow_late'" class="action-description allow-late">
            <div class="action-icon">⏰</div>
            <div class="action-details">
              <strong>ALLOW LATE Check-in</strong>
              <ul>
                <li>Employee can check in after absent threshold</li>
                <li>When they check in → Marked as <strong>LATE (Full day pay)</strong></li>
                <li>If they don't check in → Will need to be marked absent later</li>
              </ul>
            </div>
          </div>
          
          <p class="warning-text">⚠️ This action cannot be undone easily. Please confirm.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showConfirmModal = false">Cancel</button>
          <button class="btn-confirm" :class="pendingAction" @click="executeAction" :disabled="processing">
            Confirm {{ pendingAction.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>

    <!-- Late Approval Modal -->
    <div v-if="showLateModal" class="modal-overlay" @click.self="showLateModal = false">
      <div class="modal-content">
        <div class="modal-header allow-late">
          <h3>⏰ Allow Late Check-in</h3>
          <button class="modal-close" @click="showLateModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Selected: <strong>{{ selectedIds.length }}</strong> employee(s)</p>
          <div class="action-description allow-late">
            <strong>What happens:</strong>
            <ul>
              <li>Employee can check in after the absent threshold</li>
              <li>When they check in → Marked as <strong>LATE (Full day pay)</strong></li>
              <li>If they don't check in → Will need to be marked absent later</li>
            </ul>
          </div>
          <div class="form-group">
            <label>Allow check-in until:</label>
            <input type="time" v-model="allowUntilTime" class="time-input" />
            <small>Employees can check in until this time without being marked absent</small>
          </div>
          <div class="form-group">
            <label>Reason (optional):</label>
            <input type="text" v-model="lateReason" placeholder="e.g., Traffic, Emergency, Manager approval" class="reason-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showLateModal = false">Cancel</button>
          <button class="btn-confirm allow-late" @click="executeAction" :disabled="processing">Confirm Allow Late</button>
        </div>
      </div>
    </div>

    <!-- Undo Toast -->
    <div v-if="undoMessage" class="undo-toast">
      <span>{{ undoMessage }}</span>
      <button @click="undoLastAction" class="undo-action-btn">Undo</button>
    </div>

    <!-- Toast -->
    <div v-if="toastMessage" :class="['toast', toastType]">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import attendanceService from '@/stores/attendanceService'
import employeesService from '@/stores/employee'

// State
const pendingEmployees = ref([])
const selectedIds = ref([])
const selectAll = ref(false)
const loading = ref(false)
const processing = ref(false)
const currentTime = ref('')
const showLateModal = ref(false)
const showConfirmModal = ref(false)
const pendingAction = ref('')
const allowUntilTime = ref('10:30')
const lateReason = ref('')
const toastMessage = ref('')
const toastType = ref('success')
const departments = ref([])

// Undo state
const recentActions = ref([])
const undoMessage = ref('')

// Pagination
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

// Filters
const filters = reactive({
  search: '',
  departmentId: '',
  sortBy: 'lateMinutes',
  sortOrder: 'ASC'
})

let searchTimeout = null
let refreshInterval = null
let timeInterval = null

// Helper: Format time display
const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '—'
  return timeStr.substring(0, 5)
}

// Add to recent actions
const addToRecentActions = (action, employeeIds, employeeNames) => {
  const actionId = Date.now()
  recentActions.value.unshift({
    id: actionId,
    action: action,
    employeeIds: [...employeeIds],
    employeeNames: employeeNames,
    employeeCount: employeeIds.length,
    time: new Date().toLocaleTimeString(),
    user: 'Admin',
    timestamp: Date.now()
  })
  
  if (recentActions.value.length > 10) {
    recentActions.value.pop()
  }
  
  setTimeout(() => {
    recentActions.value = recentActions.value.filter(a => a.id !== actionId)
  }, 300000)
}

// Undo action
const undoAction = async (actionId) => {
  const action = recentActions.value.find(a => a.id === actionId)
  if (!action) return
  
  try {
    await attendanceService.revertAttendanceUpdate(action.employeeIds, action.action)
    await fetchPending()
    recentActions.value = recentActions.value.filter(a => a.id !== actionId)
    showToast(`Undo successful: ${action.action} for ${action.employeeCount} employee(s)`, 'success')
  } catch (error) {
    showToast('Undo failed', 'error')
  }
}

// Clear recent actions
const clearRecentActions = () => {
  recentActions.value = []
}

// Fetch departments
const fetchDepartments = async () => {
  try {
    const res = await employeesService.getDepartments()
    if (res.success && res.data) {
      departments.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch departments:', error)
  }
}

// Fetch pending employees
const fetchPending = async () => {
  loading.value = true
  try {
    const res = await attendanceService.getPendingAbsentees({
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: filters.search,
      departmentId: filters.departmentId,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    })
    
    if (res.success) {
      pendingEmployees.value = res.data
      pagination.value = {
        page: res.pagination.page,
        limit: res.pagination.limit,
        total: res.pagination.total,
        totalPages: res.pagination.totalPages
      }
    } else {
      showToast('Failed to load pending employees', 'error')
    }
  } catch (error) {
    console.error('Error:', error)
    showToast('Failed to load pending employees', 'error')
  } finally {
    loading.value = false
  }
}

// Handle search with debounce
const onSearchChange = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchPending()
  }, 500)
}

// Change page
const changePage = (page) => {
  pagination.value.page = page
  fetchPending()
}

// Toggle select all
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedIds.value = pendingEmployees.value.map(e => e.employeeId)
  } else {
    selectedIds.value = []
  }
}

// Open confirmation modal
const openConfirmModal = (action) => {
  pendingAction.value = action
  showConfirmModal.value = true
}

// Execute action after confirmation
const executeAction = async () => {
  await massAction(pendingAction.value)
  showConfirmModal.value = false
  pendingAction.value = ''
}

// Mass action
const massAction = async (action) => {
  if (selectedIds.value.length === 0 || processing.value) return
  
  const actionEmployeeIds = [...selectedIds.value]
  const actionEmployeeNames = pendingEmployees.value
    .filter(e => actionEmployeeIds.includes(e.employeeId))
    .map(e => e.employeeName)
  
  processing.value = true
  try {
    let res
    if (action === 'allow_late') {
      res = await attendanceService.massUpdateAttendance(
        selectedIds.value, 
        action, 
        allowUntilTime.value
      )
    } else {
      res = await attendanceService.massUpdateAttendance(selectedIds.value, action)
    }
    
    if (res.success) {
      addToRecentActions(action, actionEmployeeIds, actionEmployeeNames)
      
      const actionMessages = {
        absent: 'marked as ABSENT (no pay for today)',
        allow_late: 'approved for late check-in (can check in late)',
        leave: 'marked as LEAVE (paid full day)',
        sick: 'marked as SICK (paid sick leave)'
      }
      
      undoMessage.value = `${selectedIds.value.length} employee(s) ${actionMessages[action]}`
      setTimeout(() => {
        undoMessage.value = ''
      }, 5000)
      
      showToast(`${selectedIds.value.length} employee(s) ${actionMessages[action]}`, 'success')
      
      await fetchPending()
      selectedIds.value = []
      selectAll.value = false
      showLateModal.value = false
      lateReason.value = ''
    } else {
      showToast(res.message || 'Action failed', 'error')
    }
  } catch (error) {
    console.error('Error:', error)
    showToast('Action failed', 'error')
  } finally {
    processing.value = false
  }
}

// Undo last action
const undoLastAction = async () => {
  if (recentActions.value.length === 0) return
  const lastActionItem = recentActions.value[0]
  await undoAction(lastActionItem.id)
  undoMessage.value = ''
}

// Open late modal
const openLateModal = () => {
  pendingAction.value = 'allow_late'
  allowUntilTime.value = '10:30'
  lateReason.value = ''
  showLateModal.value = true
}

// Show toast
const showToast = (message, type) => {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

// Update current time
const updateCurrentTime = () => {
  currentTime.value = new Date().toLocaleTimeString()
}

// Watch for filter changes
watch([() => filters.departmentId, () => filters.sortBy, () => filters.sortOrder], () => {
  pagination.value.page = 1
  fetchPending()
})

// Lifecycle
onMounted(() => {
  fetchDepartments()
  fetchPending()
  updateCurrentTime()
  refreshInterval = setInterval(fetchPending, 120000)
  timeInterval = setInterval(updateCurrentTime, 1000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (timeInterval) clearInterval(timeInterval)
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<style scoped>
/* Warning Box */
.warning-box {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 24px;
}

.warning-content strong {
  display: block;
  margin-bottom: 8px;
  color: #92400e;
}

.warning-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}

.badge-absent {
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.badge-sick {
  background: #dbeafe;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.badge-leave {
  background: #d1fae5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.badge-late {
  background: #d1fae5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

/* Recent Actions Panel */
.recent-actions {
  background: white;
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #eef2ff;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.clear-recent {
  background: none;
  border: none;
  font-size: 11px;
  color: #64748b;
  cursor: pointer;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.action-time {
  color: #64748b;
  font-size: 11px;
  min-width: 70px;
}

.action-user {
  font-weight: 500;
  min-width: 60px;
}

.action-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.action-badge.absent {
  background: #fee2e2;
  color: #dc2626;
}

.action-badge.sick {
  background: #dbeafe;
  color: #2563eb;
}

.action-badge.leave {
  background: #d1fae5;
  color: #059669;
}

.action-badge.allow_late {
  background: #d1fae5;
  color: #059669;
}

.action-count {
  flex: 1;
  color: #64748b;
}

.undo-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.undo-btn:hover {
  background: #f8fafc;
  border-color: #6366f1;
}

/* Color Coded Action Buttons */
.btn-absent {
  background: #dc2626;
  color: white;
}

.btn-absent:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-sick {
  background: #2563eb;
  color: white;
}

.btn-sick:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-leave {
  background: #059669;
  color: white;
}

.btn-leave:hover:not(:disabled) {
  background: #047857;
}

.btn-late {
  background: #059669;
  color: white;
}

.btn-late:hover:not(:disabled) {
  background: #047857;
}

/* Enhanced Modal */
.modal-header.absent {
  background: #fee2e2;
  border-bottom-color: #dc2626;
}

.modal-header.sick {
  background: #dbeafe;
  border-bottom-color: #2563eb;
}

.modal-header.leave {
  background: #d1fae5;
  border-bottom-color: #059669;
}

.modal-header.allow-late {
  background: #d1fae5;
  border-bottom-color: #059669;
}

.action-description {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0;
}

.action-description.absent {
  background: #fee2e2;
  border-left: 4px solid #dc2626;
}

.action-description.sick {
  background: #dbeafe;
  border-left: 4px solid #2563eb;
}

.action-description.leave {
  background: #d1fae5;
  border-left: 4px solid #059669;
}

.action-description.allow-late {
  background: #d1fae5;
  border-left: 4px solid #059669;
}

.action-icon {
  font-size: 32px;
}

.action-details ul {
  margin: 8px 0 0 20px;
  font-size: 13px;
}

.action-details li {
  margin: 4px 0;
}

.btn-confirm.absent {
  background: #dc2626;
}

.btn-confirm.sick {
  background: #2563eb;
}

.btn-confirm.leave {
  background: #059669;
}

.btn-confirm.allow-late {
  background: #059669;
}

/* Undo Toast */
.undo-toast {
  position: fixed;
  bottom: 80px;
  right: 24px;
  background: #1e293b;
  color: white;
  padding: 12px 20px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1100;
  animation: slideIn 0.3s ease;
}

.undo-action-btn {
  background: #4f46e5;
  border: none;
  color: white;
  padding: 4px 12px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 12px;
}

.undo-action-btn:hover {
  background: #6366f1;
}

/* Rest of existing styles */
.pending-dashboard {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time-badge {
  background: white;
  padding: 8px 16px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.refresh-btn {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 40px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #f8fafc;
  border-color: #6366f1;
}

.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  min-width: 150px;
}

.stat-number {
  font-size: 32px;
  font-weight: 800;
  color: #4f46e5;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.filters-bar {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.6;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  font-size: 13px;
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  min-width: 150px;
}

.table-container {
  background: white;
  border-radius: 20px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.pending-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.pending-table th {
  text-align: left;
  padding: 16px;
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #eef2ff;
}

.pending-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.checkbox-col {
  width: 40px;
  text-align: center;
}

.checkbox-col input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.employee-cell {
  min-width: 200px;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.employee-avatar {
  width: 36px;
  height: 36px;
  background: #e0e7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4f46e5;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
}

.employee-code {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.time-cell {
  font-weight: 500;
  color: #1e293b;
}

.warning-cell {
  font-weight: 600;
  color: #dc2626;
}

.late-cell {
  font-weight: 600;
}

.late-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 20px;
  font-size: 12px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 16px;
}

.page-btn {
  padding: 8px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  cursor: pointer;
  font-size: 13px;
}

.page-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #6366f1;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
}

.action-bar {
  margin-top: 24px;
  background: white;
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.selected-info {
  font-size: 14px;
  color: #1e293b;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 10px 20px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.action-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

.modal-content {
  background: white;
  border-radius: 24px;
  width: 500px;
  max-width: 90%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eef2ff;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.time-input, .reason-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eef2ff;
}

.btn-cancel {
  padding: 8px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 40px;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 20px;
  color: white;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin-bottom: 8px;
  color: #1e293b;
}

.empty-state p {
  color: #64748b;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 40px;
  font-weight: 500;
  z-index: 1100;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #10b981;
  color: white;
}

.toast.error {
  background: #ef4444;
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
  .pending-dashboard {
    padding: 16px;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .search-box, .filter-select {
    width: 100%;
  }
  
  .action-bar {
    flex-direction: column;
    gap: 16px;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .warning-list {
    flex-direction: column;
    gap: 8px;
  }
}
</style>