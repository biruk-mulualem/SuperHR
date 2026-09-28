<template>
  <div class="approved-leave-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <span class="header-icon">✅</span>
        <div>
          <h1>Approved Leave Requests</h1>
          <p>View and manage all approved employee leave requests</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportToExcel" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? 'Exporting...' : 'Export to Excel' }}
        </button>
        <button class="btn-secondary" @click="refreshData" :disabled="refreshing">
          <span v-if="refreshing" class="spinner-small"></span>
          <span v-else>🔄</span>
          {{ refreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </div>

  

    <!-- Overdue Alert -->
    <div v-if="stats.overdueReturns > 0" class="overdue-alert">
      <span class="alert-icon">⚠️</span>
      <span class="alert-message">{{ stats.overdueReturns }} employee(s) have not returned from leave!</span>
      <button class="alert-btn" @click="scrollToOverdue">View Details</button>
    </div>

    <!-- Filters -->
    <div class="filter-section">
      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            v-model="filters.search" 
            @input="debouncedLoadData" 
            placeholder="Search employee..." 
            class="search-input" 
          />
        </div>
        <select v-model="filters.departmentId" @change="loadApprovedRequests" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departmentsList" :key="dept.departmentId" :value="dept.departmentId">{{ dept.name }}</option>
        </select>
        <select v-model="filters.leaveTypeId" @change="loadApprovedRequests" class="filter-select">
          <option :value="null">All Leave Types</option>
          <option v-for="type in leaveTypesList" :key="type.leaveTypeId" :value="type.leaveTypeId">{{ type.name }}</option>
        </select>
        <select v-model="filters.status" @change="loadApprovedRequests" class="filter-select">
          <option :value="null">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">On Leave</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
        <input type="month" v-model="filters.month" @change="loadApprovedRequests" class="month-picker" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading approved leave requests...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredLeaveRequests.length === 0" class="empty-state">
      <div class="empty-icon">✅</div>
      <p>No approved leave requests found</p>
      <p class="empty-hint">Approved leave requests will appear here</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <div class="table-header">
        <h3>Approved Leave Requests</h3>
        <span class="record-count">{{ pagination.total }} records found</span>
      </div>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dept</th>
              <th>Leave Type</th>
              <th>Period</th>
              <th class="text-center">Days</th>
              <th>Return Status</th>
              <th>Approved Date</th>
          
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in paginatedLeaveRequests" :key="request.leaveRequestId">
              <td class="employee-cell">
                <strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong>
                <div class="employee-code">{{ request.employee?.employeeCode }}</div>
              </td>
              <td>{{ request.department?.name || '-' }}</td>
              <td>
                <span :class="['leave-type-badge', getLeaveTypeClass(request.leaveTypeName)]">
                  {{ request.leaveTypeName }}
                </span>
              </td>
              <td class="date-range">
                {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}
              </td>
              <td class="text-center days-cell">
                <span class="days-badge">{{ request.totalDays }} days</span>
              </td>
              <td>
                <span :class="['status-badge', getReturnStatusClass(request)]">
                  {{ getReturnStatusText(request) }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(request.approvedDate) || formatDate(request.approved_at) || 'N/A' }}</td>
              
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button class="page-btn" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">
          ← Previous
        </button>
        <span class="page-info">Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <button class="page-btn" :disabled="pagination.page === pagination.totalPages" @click="changePage(pagination.page + 1)">
          Next →
        </button>
        <select v-model="pagination.limit" @change="changeLimit" class="limit-select">
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>
      </div>
    </div>

    <!-- Return Confirmation Modal -->
    <div v-if="showReturnConfirmModal" class="modal-overlay" @click.self="showReturnConfirmModal = false">
      <div class="modal-container return-modal">
        <div class="modal-header">
          <h3>✅ Confirm Employee Return</h3>
          <button class="modal-close" @click="showReturnConfirmModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="employee-info-card">
            <div class="emp-avatar">{{ getInitials(returnConfirmEmployee?.employee?.firstName + ' ' + returnConfirmEmployee?.employee?.lastName) }}</div>
            <div class="emp-details">
              <div class="emp-name">{{ returnConfirmEmployee?.employee?.firstName }} {{ returnConfirmEmployee?.employee?.lastName }}</div>
              <div class="emp-code">{{ returnConfirmEmployee?.employee?.employeeCode }}</div>
              <div class="emp-dept">{{ returnConfirmEmployee?.department?.name }}</div>
            </div>
          </div>
          
          <div class="leave-info">
            <div class="info-row">
              <span class="info-label">Leave Type:</span>
              <span class="info-value">{{ returnConfirmEmployee?.leaveTypeName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Leave Period:</span>
              <span class="info-value">{{ formatDate(returnConfirmEmployee?.startDate) }} - {{ formatDate(returnConfirmEmployee?.endDate) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Expected Return:</span>
              <span class="info-value">{{ formatDate(returnConfirmEmployee?.returnDate) }}</span>
            </div>
          </div>
          
          <div class="form-field">
            <label>Actual Return Date</label>
            <input type="date" v-model="actualReturnDate" class="form-input" :max="today" />
            <div class="input-hint" v-if="actualReturnDate > returnConfirmEmployee?.returnDate">
              ⚠️ This return is {{ getDaysDifference(actualReturnDate, returnConfirmEmployee?.returnDate) }} days late
            </div>
          </div>
          
          <div class="form-field">
            <label>Notes (Optional)</label>
            <textarea v-model="returnNotes" class="form-textarea" rows="2" placeholder="Add any notes about the return..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showReturnConfirmModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmReturn">Confirm Return</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span class="toast-icon">{{ toastIcon }}</span>
      <span class="toast-message">{{ toastMessage }}</span>
      <button class="toast-close" @click="showToast = false">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import leaveService from '@/stores/leaveService'
import employeeService from '@/stores/employee'

const router = useRouter()

// State
const loading = ref(false)
const refreshing = ref(false)
const exporting = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastIcon = ref('✅')
const showReturnConfirmModal = ref(false)
const returnConfirmEmployee = ref(null)
const actualReturnDate = ref('')
const returnNotes = ref('')
const today = new Date().toISOString().split('T')[0]

// Data
const departmentsList = ref([])
const leaveTypesList = ref([])
const approvedLeaveRequests = ref([])

// Filters
const filters = ref({
  search: '',
  departmentId: null,
  leaveTypeId: null,
  status: null,
  month: new Date().toISOString().slice(0, 7)
})

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
})

// Computed - Filtered and Paginated Data
const filteredLeaveRequests = computed(() => {
  let data = [...approvedLeaveRequests.value]
  
  // Filter by search
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    data = data.filter(req => 
      `${req.employee?.firstName} ${req.employee?.lastName}`.toLowerCase().includes(searchLower) ||
      req.employee?.employeeCode?.toLowerCase().includes(searchLower)
    )
  }
  
  // Filter by status (upcoming, ongoing, returned, overdue)
  if (filters.value.status) {
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    
    data = data.filter(req => {
      const startDate = new Date(req.startDate)
      const endDate = new Date(req.endDate)
      const returnDate = new Date(req.returnDate)
      
      if (filters.value.status === 'upcoming') {
        return startDate > todayDate && !req.actualReturnDate
      } else if (filters.value.status === 'ongoing') {
        return startDate <= todayDate && endDate >= todayDate && !req.actualReturnDate
      } else if (filters.value.status === 'returned') {
        return req.actualReturnDate
      } else if (filters.value.status === 'overdue') {
        return !req.actualReturnDate && returnDate < todayDate
      }
      return true
    })
  }
  
  return data
})

const paginatedLeaveRequests = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.limit
  const end = start + pagination.value.limit
  return filteredLeaveRequests.value.slice(start, end)
})

// Stats
const stats = computed(() => {
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  
  let returned = 0
  let onLeave = 0
  let upcoming = 0
  let overdueReturns = 0
  
  approvedLeaveRequests.value.forEach(req => {
    const startDate = new Date(req.startDate)
    const endDate = new Date(req.endDate)
    const returnDate = new Date(req.returnDate)
    
    if (req.actualReturnDate) {
      returned++
    } else if (startDate <= todayDate && endDate >= todayDate) {
      onLeave++
    } else if (startDate > todayDate) {
      upcoming++
    }
    
    if (!req.actualReturnDate && returnDate < todayDate) {
      overdueReturns++
    }
  })
  
  return {
    totalApproved: approvedLeaveRequests.value.length,
    returned,
    onLeave,
    upcoming,
    overdueReturns
  }
})

// Debounce
let debounceTimeout
function debounce(func, delay = 500) {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(func, delay)
}

function debouncedLoadData() {
  debounce(() => {
    pagination.value.page = 1
    loadApprovedRequests()
  })
}

// Helper Functions
function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getLeaveTypeClass(type) {
  const classes = {
    'Annual Leave': 'type-annual',
    'Sick Leave': 'type-sick',
    'Maternity Leave': 'type-maternity',
    'Paternity Leave': 'type-paternity',
    'Bereavement Leave': 'type-bereavement',
    'Unpaid Leave': 'type-unpaid',
    'Study Leave': 'type-study'
  }
  return classes[type] || 'type-default'
}

function getReturnStatusClass(request) {
  if (request.actualReturnDate) {
    const expectedReturn = new Date(request.returnDate)
    const actual = new Date(request.actualReturnDate)
    if (actual > expectedReturn) return 'status-warning'
    return 'status-success'
  }
  const currentDate = new Date()
  const returnDate = new Date(request.returnDate)
  if (currentDate > returnDate) return 'status-danger'
  if (currentDate.toDateString() === returnDate.toDateString()) return 'status-warning'
  return 'status-info'
}

function getReturnStatusText(request) {
  if (request.actualReturnDate) {
    const expectedReturn = new Date(request.returnDate)
    const actual = new Date(request.actualReturnDate)
    if (actual > expectedReturn) {
      const daysLate = Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24))
      return `Returned ${daysLate} day${daysLate > 1 ? 's' : ''} late`
    }
    return 'Returned on time'
  }
  const currentDate = new Date()
  const returnDate = new Date(request.returnDate)
  if (currentDate > returnDate) {
    const daysOverdue = Math.ceil((currentDate - returnDate) / (1000 * 60 * 60 * 24))
    return `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`
  }
  if (currentDate.toDateString() === returnDate.toDateString()) return 'Expected today'
  return `Returns ${formatDate(request.returnDate)}`
}

function getDaysDifference(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diff = Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24))
  return diff
}

// API Calls
async function loadDepartments() {
  const result = await employeeService.getDepartments()
  if (result.success) {
    departmentsList.value = result.data
  }
}

async function loadLeaveTypes() {
  const result = await leaveService.getLeaveTypes()
  if (result.success) {
    leaveTypesList.value = result.data
  }
}

async function loadApprovedRequests() {
  loading.value = true
  try {
    const params = {
      status: 'approved',
      page: 1,
      limit: 100,
      search: filters.value.search || undefined,
      departmentId: filters.value.departmentId || undefined,
      leaveTypeId: filters.value.leaveTypeId || undefined
    }
    
    if (filters.value.month) {
      const [year, month] = filters.value.month.split('-')
      params.startDate = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      params.endDate = `${year}-${month}-${lastDay}`
    }
    
    const result = await leaveService.getLeaveRequests(params)
    if (result.success) {
      approvedLeaveRequests.value = result.data.map(request => ({
        ...request,
        approvedDate: request.approvedDate || request.approved_at || request.approvedAt || null
      }))
      pagination.value.total = filteredLeaveRequests.value.length
      pagination.value.totalPages = Math.ceil(pagination.value.total / pagination.value.limit)
    }
  } catch (error) {
    console.error('Error loading approved requests:', error)
    showToastMessage('Failed to load approved requests', 'error')
  } finally {
    loading.value = false
  }
}

async function confirmReturn() {
  if (!actualReturnDate.value) {
    showToastMessage('Please select actual return date', 'error')
    return
  }
  
  try {
    const result = await leaveService.confirmReturn(
      returnConfirmEmployee.value.leaveRequestId, 
      actualReturnDate.value,
      returnNotes.value
    )
    if (result.success) {
      showToastMessage(result.message || 'Return confirmed successfully', 'success')
      await loadApprovedRequests()
      showReturnConfirmModal.value = false
      actualReturnDate.value = ''
      returnNotes.value = ''
    } else {
      showToastMessage(result.error || 'Failed to confirm return', 'error')
    }
  } catch (error) {
    console.error('Error confirming return:', error)
    showToastMessage('Failed to confirm return', 'error')
  }
}

// Export Function
async function exportToExcel() {
  exporting.value = true
  try {
    const headers = [
      'Employee Name',
      'Employee Code',
      'Department',
      'Leave Type',
      'Start Date',
      'End Date',
      'Total Days',
      'Return Status',
      'Actual Return Date',
      'Approved Date'
    ]
    
    const csvRows = [headers.join(',')]
    
    for (const req of filteredLeaveRequests.value) {
      const row = [
        `"${req.employee?.firstName} ${req.employee?.lastName}"`,
        `"${req.employee?.employeeCode}"`,
        `"${req.department?.name || '-'}"`,
        `"${req.leaveTypeName}"`,
        req.startDate,
        req.endDate,
        req.totalDays,
        getReturnStatusText(req),
        req.actualReturnDate || '',
        req.approvedDate || ''
      ]
      csvRows.push(row.join(','))
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `approved_leaves_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showToastMessage('Export successful', 'success')
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export data', 'error')
  } finally {
    exporting.value = false
  }
}

// UI Functions
function refreshData() {
  refreshing.value = true
  loadApprovedRequests()
  setTimeout(() => {
    refreshing.value = false
  }, 500)
}

function goToDetailPage(leaveId) {
  router.push(`/leave-detail/${leaveId}`)
}

function openReturnConfirmModal(request) {
  returnConfirmEmployee.value = request
  actualReturnDate.value = today
  returnNotes.value = ''
  showReturnConfirmModal.value = true
}

function scrollToOverdue() {
  filters.value.status = 'overdue'
  loadApprovedRequests()
}

function changePage(page) {
  pagination.value.page = page
}

function changeLimit() {
  pagination.value.page = 1
  pagination.value.limit = parseInt(pagination.value.limit)
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Watchers
watch(() => filters.value.departmentId, () => {
  pagination.value.page = 1
  loadApprovedRequests()
})

watch(() => filters.value.leaveTypeId, () => {
  pagination.value.page = 1
  loadApprovedRequests()
})

watch(() => filters.value.month, () => {
  pagination.value.page = 1
  loadApprovedRequests()
})

watch(() => filters.value.status, () => {
  pagination.value.page = 1
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadDepartments(),
    loadLeaveTypes()
  ])
  await loadApprovedRequests()
})
</script>

<style scoped>
.approved-leave-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 36px;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Buttons */
.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f1f5f9;
}

.btn-icon.confirm-return {
  color: #10b981;
}

.btn-icon.confirm-return:hover {
  background: #d1fae5;
}

.btn-icon.warning {
  color: #f59e0b;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.stat-icon.blue { background: #dbeafe; }
.stat-icon.green { background: #d1fae5; }
.stat-icon.orange { background: #fed7aa; }
.stat-icon.purple { background: #e0e7ff; }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

/* Overdue Alert */
.overdue-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.alert-icon {
  font-size: 20px;
}

.alert-message {
  flex: 1;
  color: #dc2626;
  font-weight: 500;
}

.alert-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.alert-btn:hover {
  background: #b91c1c;
}

/* Filter Section */
.filter-section {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.search-wrapper {
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
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.filter-select, .month-picker {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

.filter-select:focus, .month-picker:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
}

.table-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.record-count {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 12px 12px;
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 12px 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.text-center {
  text-align: center;
}

/* Employee Cell */
.employee-cell .employee-code {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Leave Type Badges */
.leave-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.type-annual {
  background: #d1fae5;
  color: #059669;
}

.type-sick {
  background: #fee2e2;
  color: #dc2626;
}

.type-maternity {
  background: #fef3c7;
  color: #d97706;
}

.type-paternity {
  background: #dbeafe;
  color: #2563eb;
}

.type-bereavement {
  background: #f3e8ff;
  color: #9333ea;
}

.type-unpaid {
  background: #f1f5f9;
  color: #475569;
}

.type-study {
  background: #cffafe;
  color: #0891b2;
}

.type-default {
  background: #e2e8f0;
  color: #475569;
}

/* Days Badge */
.days-badge {
  background: #e2e8f0;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

/* Status Badges */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-success {
  background: #d1fae5;
  color: #059669;
}

.status-warning {
  background: #fef3c7;
  color: #d97706;
}

.status-danger {
  background: #fee2e2;
  color: #dc2626;
}

.status-info {
  background: #dbeafe;
  color: #2563eb;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eef2ff;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

/* Loading State */
.loading-state {
  background: white;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

/* Empty State */
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  color: #94a3b8;
  margin: 0;
}

.empty-hint {
  font-size: 12px;
  margin-top: 8px;
  color: #cbd5e1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0,0,0,0.05);
  color: #1e293b;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* Return Modal */
.return-modal {
  max-width: 480px;
}

.employee-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.emp-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.emp-details {
  flex: 1;
}

.emp-name {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}

.emp-code {
  font-size: 11px;
  color: #64748b;
}

.emp-dept {
  font-size: 11px;
  color: #94a3b8;
}

.leave-info {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.info-label {
  color: #64748b;
}

.info-value {
  font-weight: 500;
  color: #1e293b;
}

/* Form Elements */
.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1e293b;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
}

.input-hint {
  font-size: 11px;
  color: #f59e0b;
  margin-top: 6px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.warning {
  border-left-color: #f59e0b;
}

.toast-icon {
  font-size: 16px;
}

.toast-message {
  flex: 1;
  font-size: 13px;
  color: #1e293b;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #94a3b8;
  padding: 4px;
  border-radius: 4px;
}

.toast-close:hover {
  background: #f1f5f9;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .approved-leave-page {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .search-wrapper {
    width: 100%;
  }
  
  .filter-select, .month-picker {
    width: 100%;
  }
  
  .table-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .data-table {
    min-width: 700px;
  }
}
</style>