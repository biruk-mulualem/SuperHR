<template>
  <div class="attendance-management-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <span class="header-icon">📊</span>
        <div>
          <h1>Attendance Management</h1>
          <p>Import attendance records and view daily, weekly & monthly attendance</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-import" @click="showImportModal = true">
          <span>📥</span> Import Attendance
        </button>
        <button class="btn-help" @click="showHelp = true">
          <span>❓</span> Help
        </button>
      </div>
    </div>

    <!-- Help Modal -->
    <div v-if="showHelp" class="modal-overlay" @click.self="showHelp = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📖 Import Guide</h3>
          <button class="close-btn" @click="showHelp = false">✕</button>
        </div>
        <div class="modal-body">
          <h4>Supported File Formats:</h4>
          <ul>
            <li>Excel (.xlsx, .xls)</li>
            <li>CSV (.csv)</li>
          </ul>
          <h4>Required Columns:</h4>
          <ul>
            <li><strong>Employee ID</strong> - Employee code in the system</li>
            <li><strong>Punch Time</strong> - Date and time of punch</li>
            <li><strong>Punch State</strong> - Check In, Check Out, Break Out, Break In</li>
          </ul>
          <h4>Working Days:</h4>
          <ul>
            <li><strong>Ethiopian Work Week:</strong> Monday to Saturday (6 days/week)</li>
            <li><strong>Sunday:</strong> Non-working day</li>
            <li><strong>Attendance Rate = (Days Present / Total Working Days) × 100%</strong></li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showHelp = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content import-modal">
        <div class="modal-header">
          <h3>📥 Import Attendance Records</h3>
          <button class="close-btn" @click="showImportModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="import-type-section">
            <label>Import Type</label>
            <div class="type-cards">
              <div class="type-card" :class="{ active: importType === 'daily' }" @click="importType = 'daily'">
                <span class="type-icon">📅</span>
                <span>Daily</span>
              </div>
              <div class="type-card" :class="{ active: importType === 'weekly' }" @click="importType = 'weekly'">
                <span class="type-icon">📆</span>
                <span>Weekly</span>
              </div>
              <div class="type-card" :class="{ active: importType === 'monthly' }" @click="importType = 'monthly'">
                <span class="type-icon">📊</span>
                <span>Monthly</span>
              </div>
            </div>
          </div>

          <div class="upload-area" :class="{ dragging: isDragging, hasFile: selectedFile }"
               @dragover.prevent="isDragging = true" 
               @dragleave.prevent="isDragging = false" 
               @drop.prevent="handleDrop">
            <div v-if="!selectedFile" class="upload-placeholder">
              <span class="upload-icon">📂</span>
              <p>Drag & drop your file here</p>
              <button class="btn-primary" @click="$refs.fileInput.click()">Browse</button>
            </div>
            <div v-else class="file-preview">
              <span class="file-icon">📄</span>
              <div class="file-info">
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button class="btn-remove" @click="clearFile">✕</button>
            </div>
            <input type="file" ref="fileInput" @change="handleFileSelect" accept=".xlsx,.xls,.csv" style="display: none" />
          </div>

          <div v-if="importResults" class="import-results">
            <div class="results-summary">
              <div class="stat success">
                <span class="stat-value">{{ importResults.data?.success || 0 }}</span>
                <span class="stat-label">Success</span>
              </div>
              <div class="stat failed">
                <span class="stat-value">{{ importResults.data?.failed || 0 }}</span>
                <span class="stat-label">Failed</span>
              </div>
              <div class="stat total">
                <span class="stat-value">{{ importResults.data?.total || 0 }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
            <div v-if="importResults.message" class="success-message">{{ importResults.message }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showImportModal = false">Cancel</button>
          <button class="btn-primary" @click="processImport" :disabled="!selectedFile || importing">
            <span v-if="importing" class="spinner"></span>
            <span v-else>🚀</span>
            {{ importing ? 'Importing...' : 'Import' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-btn" 
        :class="{ active: activeTab === tab.value }"
        @click="switchTab(tab.value)"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group" v-if="activeTab === 'daily'">
        <label>Date Range</label>
        <div class="date-range">
          <input type="date" v-model="filters.startDate" @change="loadData" />
          <span>to</span>
          <input type="date" v-model="filters.endDate" @change="loadData" />
        </div>
      </div>
      
      <div class="filter-group" v-if="activeTab !== 'daily'">
        <label>Year</label>
        <select v-model="selectedYear" @change="loadData">
          <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Search</label>
        <input type="text" v-model="filters.search" placeholder="Employee name or code..." @input="debounceLoad" />
      </div>
      
      <div class="filter-group">
        <label>Department</label>
        <select v-model="filters.departmentId" @change="loadData">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.departmentId" :value="Number(dept.departmentId)">
            {{ dept.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group" v-if="activeTab === 'daily'">
        <label>Status</label>
        <select v-model="filters.status" @change="loadData">
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="half_day">Half Day</option>
          <option value="absent">Absent</option>
        </select>
      </div>
      
      <button class="btn-refresh" @click="resetFilters">
        <span>🔄</span> Reset
      </button>
      
      <button class="btn-export" @click="exportData">📊 Export</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ summary.total_records || 0 }}</div>
        <div class="stat-label">{{ summaryLabel }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">{{ summary.total_hours || '0.0' }}</div>
        <div class="stat-label">Total Hours</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ summary.total_late_minutes || 0 }}</div>
        <div class="stat-label">Late Minutes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">{{ summary.half_days || 0 }}</div>
        <div class="stat-label">Half Days</div>
      </div>
    </div>

    <!-- Daily Attendance Table -->
    <div class="attendance-table-container" v-if="activeTab === 'daily'">
      <div class="table-header">
        <h3>Daily Attendance Records</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Loading attendance data...</span>
      </div>

      <div v-else-if="attendanceRecords.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No attendance records found</p>
        <button class="btn-primary" @click="showImportModal = true">Import First Records</button>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Break Out</th>
              <th>Break In</th>
              <th>Hours</th>
              <th>Late</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in attendanceRecords" :key="record.id">
              <td class="employee-cell">
                <div class="employee-info">
                  <strong>{{ record.employee_name }}</strong>
                  <span class="employee-code">{{ record.employee_code }}</span>
                </div>
              </td>
              <td>{{ record.department }}</td>
              <td class="date-cell">{{ formatDate(record.attendance_date) }}</td>
              <td class="time-cell">{{ formatTime(record.first_check_in) }}</td>
              <td class="time-cell">{{ formatTime(record.last_check_out) }}</td>
              <td class="time-cell">{{ formatTime(record.break_out_time) }}</td>
              <td class="time-cell">{{ formatTime(record.break_in_time) }}</td>
              <td class="text-center">{{ record.total_hours }}</td>
              <td class="text-center">
                <span v-if="record.late_minutes > 0" class="late-badge">{{ record.late_minutes }} min</span>
                <span v-else class="on-time-badge">On Time</span>
              </td>
              <td class="text-center">
                <span :class="getStatusClass(record)">{{ getStatusText(record) }}</span>
              </td>
              </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button class="page-btn" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">← Previous</button>
        <span class="page-info">Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <button class="page-btn" :disabled="pagination.page === pagination.totalPages" @click="changePage(pagination.page + 1)">Next →</button>
      </div>
    </div>

    <!-- Weekly Summary Table -->
    <div class="attendance-table-container" v-if="activeTab === 'weekly'">
      <div class="table-header">
        <h3>Weekly Attendance Summary (Mon-Sat Working Days)</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Loading weekly summary...</span>
      </div>

      <div v-else-if="weeklyRecords.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No weekly summary found</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Week</th>
             
              <th>Working Days</th>
              <th>Days Present</th>
                <th>Absent Days</th>
                    <th>Late Days</th>
              <th>Total Working Hours</th>
              
              <th>Late Minutes</th>
         
            
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in weeklyRecords" :key="`${record.employee_id}-${record.week_number}-${index}`">
              <td class="employee-cell">
                <div class="employee-info">
                  <strong>{{ record.employee_name }}</strong>
                  <span class="employee-code">{{ record.employee_code }}</span>
                </div>
              </td>
              <td>{{ record.department }}</td>
              <td class="week-cell">
                Week {{ record.week_number }}<br>
                <small>{{ formatDate(record.week_start) }} - {{ formatDate(record.week_end) }}</small>
              </td>
       
              <td class="text-center">{{ record.total_working_days || 6 }}</td>
              <td class="text-center">{{ record.effective_days }}</td>
              <td class="text-center">{{ record.days_absent }}</td>
                     <td class="text-center">{{ record.late_days }}</td>
              <td class="text-center">{{ record.total_hours }}</td>
              
              <td class="text-center">{{ record.total_late_minutes }}</td>
       
            
              
              <td class="text-center">
                <span :class="getAttendanceRateClass(record.attendance_rate)">
                  {{ record.attendance_rate }}%
                </span>
                
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="weeklyPagination.totalPages > 1">
        <button class="page-btn" :disabled="weeklyPagination.page === 1" @click="changeWeeklyPage(weeklyPagination.page - 1)">← Previous</button>
        <span class="page-info">Page {{ weeklyPagination.page }} of {{ weeklyPagination.totalPages }}</span>
        <button class="page-btn" :disabled="weeklyPagination.page === weeklyPagination.totalPages" @click="changeWeeklyPage(weeklyPagination.page + 1)">Next →</button>
      </div>
    </div>

    <!-- Monthly Summary Table -->
    <div class="attendance-table-container" v-if="activeTab === 'monthly'">
      <div class="table-header">
        <h3>Monthly Attendance Summary (Mon-Sat Working Days)</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Loading monthly summary...</span>
      </div>

      <div v-else-if="monthlyRecords.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No monthly summary found</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Month</th>
                         <th>Total Days in Month</th>
                                     <th>Total Working Days</th>
              <th>Days Present</th>
              
              <th>Absent Days</th>
                <th>Late Days</th>
  
   
              
              <th>Total Working Hours</th>
          
              <th>Late Minutes</th>
            
          
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in monthlyRecords" :key="`${record.employee_id}-${record.year}-${record.month}-${index}`">
              <td class="employee-cell">
                <div class="employee-info">
                  <strong>{{ record.employee_name }}</strong>
                  <span class="employee-code">{{ record.employee_code }}</span>
                </div>
              </td>
              <td>{{ record.department }}</td>
              <td class="month-cell">
                {{ record.month_name }} {{ record.year }}<br>
                <small>{{ formatDate(record.month_start) }} - {{ formatDate(record.month_end) }}</small>
              </td>
               <td class="text-center">{{ record.total_days_in_month }}</td>
                      <td class="text-center"><strong>{{ record.total_working_days }}</strong></td>
              <td class="text-center"><strong>{{ record.effective_days }}</strong></td>
       
               
              <td class="text-center">{{ record.days_absent }}</td>
                         <td class="text-center">{{ record.late_days }}</td>
        
              <td class="text-center">{{ record.total_hours }}</td>
              
              <td class="text-center">{{ record.total_late_minutes }}</td>
   
          
              <td class="text-center">
                <span :class="getAttendanceRateClass(record.attendance_rate)">
                  {{ record.attendance_rate }}%
                </span>
       
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="monthlyPagination.totalPages > 1">
        <button class="page-btn" :disabled="monthlyPagination.page === 1" @click="changeMonthlyPage(monthlyPagination.page - 1)">← Previous</button>
        <span class="page-info">Page {{ monthlyPagination.page }} of {{ monthlyPagination.totalPages }}</span>
        <button class="page-btn" :disabled="monthlyPagination.page === monthlyPagination.totalPages" @click="changeMonthlyPage(monthlyPagination.page + 1)">Next →</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import attendanceService from '@/stores/attendanceService'
import employeeService from '@/stores/employee'

// ============== Configuration ==============
const tabs = [
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '📊' }
]

const availableYears = ref([2024, 2025, 2026, 2027])

// ============== State ==============
// UI State
const showHelp = ref(false)
const showImportModal = ref(false)
const activeTab = ref('daily')
const loading = ref(false)
const importing = ref(false)
const isDragging = ref(false)

// Data State
const attendanceRecords = ref([])
const weeklyRecords = ref([])
const monthlyRecords = ref([])
const departments = ref([])

// Import State
const importType = ref('daily')
const selectedFile = ref(null)
const importResults = ref(null)
const fileInput = ref(null)

// Filter State
const selectedYear = ref(new Date().getFullYear())
const filters = ref({
  startDate: getFirstDayOfMonth(),
  endDate: getToday(),
  search: '',
  status: '',
  departmentId: null
})

// Pagination State
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const weeklyPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const monthlyPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })

let debounceTimer = null

// ============== Helper Functions ==============
function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getFirstDayOfMonth() {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

// ============== Computed ==============
const summaryLabel = computed(() => {
  const labels = { daily: 'Total Records', weekly: 'Total Weeks', monthly: 'Total Months' }
  return labels[activeTab.value] || 'Total Records'
})

const summary = computed(() => {
  if (activeTab.value === 'daily') {
    const records = attendanceRecords.value
    return {
      total_records: records.length,
      total_hours: records.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0).toFixed(1),
      total_late_minutes: records.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
      half_days: records.filter(r => r.is_half_day).length
    }
  }
  
  const records = activeTab.value === 'weekly' ? weeklyRecords.value : monthlyRecords.value
  return {
    total_records: records.length,
    total_hours: records.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0).toFixed(1),
    total_late_minutes: records.reduce((sum, r) => sum + (r.total_late_minutes || 0), 0),
    half_days: records.reduce((sum, r) => sum + (r.half_days || 0), 0)
  }
})

// ============== Formatting Functions ==============
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const formatTime = (timestamp) => {
  if (!timestamp) return '—'
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getStatusClass = (record) => {
  if (record.is_half_day) return 'status-half-day'
  if (record.late_minutes > 30) return 'status-late'
  if (record.late_minutes > 0) return 'status-minor-late'
  return 'status-present'
}

const getStatusText = (record) => {
  if (record.is_half_day) return 'Half Day'
  if (record.late_minutes > 30) return 'Late'
  if (record.late_minutes > 0) return `${record.late_minutes} min late`
  return 'Present'
}

const getAttendanceRateClass = (rate) => {
  const numRate = parseFloat(rate)
  if (numRate >= 90) return 'rate-excellent'
  if (numRate >= 75) return 'rate-good'
  if (numRate >= 60) return 'rate-average'
  return 'rate-poor'
}

// ============== Data Loading Functions ==============
const loadDepartments = async () => {
  try {
    const res = await employeeService.getDepartments()
    if (res.success) departments.value = res.data
  } catch (error) {
    console.error('Failed to load departments:', error)
  }
}

const loadDailyAttendance = async () => {
  try {
    const params = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...(filters.value.search && { search: filters.value.search.trim() }),
      ...(filters.value.departmentId && { departmentId: Number(filters.value.departmentId) }),
      ...(filters.value.status && { status: filters.value.status })
    }
    
    const res = await attendanceService.getDailyAttendance(params)
    
    if (res.success) {
      attendanceRecords.value = (res.data || []).map(record => ({
        ...record,
        employee_name: record.employee_name || `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'N/A',
        department: record.department || record.department_name || 'N/A',
        total_hours: record.total_hours || '0.0',
        late_minutes: record.late_minutes || 0
      }))
      
      pagination.value = res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
    }
  } catch (error) {
    console.error('Failed to load daily attendance:', error)
  }
}

const loadWeeklySummary = async () => {
  try {
    const params = {
      startDate: `${selectedYear.value}-01-01`,
      endDate: `${selectedYear.value}-12-31`,
      page: weeklyPagination.value.page,
      limit: weeklyPagination.value.limit,
      ...(filters.value.search && { search: filters.value.search.trim() }),
      ...(filters.value.departmentId && { departmentId: Number(filters.value.departmentId) })
    }
    
    const res = await attendanceService.getWeeklyAttendance(params)
    
    if (res.success) {
      weeklyRecords.value = res.data || []
      weeklyPagination.value = res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
    }
  } catch (error) {
    console.error('Failed to load weekly summary:', error)
  }
}

const loadMonthlySummary = async () => {
  try {
    const params = {
      year: selectedYear.value,
      page: monthlyPagination.value.page,
      limit: monthlyPagination.value.limit,
      ...(filters.value.search && { search: filters.value.search.trim() }),
      ...(filters.value.departmentId && { departmentId: Number(filters.value.departmentId) })
    }
    
    const res = await attendanceService.getMonthlyAttendance(params)
    
    if (res.success) {
      monthlyRecords.value = res.data || []
      monthlyPagination.value = res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
    }
  } catch (error) {
    console.error('Failed to load monthly summary:', error)
  }
}

const loadData = () => {
  if (activeTab.value === 'daily') loadDailyAttendance()
  else if (activeTab.value === 'weekly') loadWeeklySummary()
  else loadMonthlySummary()
}

// ============== Event Handlers ==============
const switchTab = (tab) => {
  activeTab.value = tab
  resetPagination()
  loadData()
}

const resetPagination = () => {
  pagination.value.page = 1
  weeklyPagination.value.page = 1
  monthlyPagination.value.page = 1
}

const debounceLoad = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    resetPagination()
    loadData()
  }, 500)
}

const resetFilters = () => {
  filters.value = {
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
    search: '',
    status: '',
    departmentId: null
  }
  selectedYear.value = new Date().getFullYear()
  resetPagination()
  loadData()
}

const changePage = (page) => {
  pagination.value.page = page
  loadDailyAttendance()
}

const changeWeeklyPage = (page) => {
  weeklyPagination.value.page = page
  loadWeeklySummary()
}

const changeMonthlyPage = (page) => {
  monthlyPagination.value.page = page
  loadMonthlySummary()
}

// ============== Import Functions ==============
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) selectedFile.value = file
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) selectedFile.value = file
}

const clearFile = () => {
  selectedFile.value = null
  importResults.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const processImport = async () => {
  if (!selectedFile.value) return

  importing.value = true
  importResults.value = null

  try {
    const result = await attendanceService.importAttendanceFile(selectedFile.value, importType.value)
    importResults.value = result
    
    if (result.success) {
      await loadData()
      setTimeout(() => {
        showImportModal.value = false
        clearFile()
      }, 2000)
    }
  } catch (error) {
    console.error('Import failed:', error)
    importResults.value = {
      success: false,
      message: error.response?.data?.error || 'Import failed',
      data: { success: 0, failed: 0, total: 0 }
    }
  } finally {
    importing.value = false
  }
}

// ============== Export Functions ==============
const exportData = () => {
  let csvData = []
  let filename = ''
  
  if (activeTab.value === 'daily') {
    csvData = attendanceRecords.value.map(record => ({
      'Employee Code': record.employee_code,
      'Employee Name': record.employee_name,
      'Department': record.department,
      'Date': record.attendance_date,
      'Check In': formatTime(record.first_check_in),
      'Check Out': formatTime(record.last_check_out),
      'Break Out': formatTime(record.break_out_time),
      'Break In': formatTime(record.break_in_time),
      'Total Hours': record.total_hours,
      'Late Minutes': record.late_minutes,
      'Status': getStatusText(record)
    }))
    filename = `daily_attendance_${filters.value.startDate}_to_${filters.value.endDate}.csv`
  } else if (activeTab.value === 'weekly') {
    csvData = weeklyRecords.value.map(record => ({
      'Employee Code': record.employee_code,
      'Employee Name': record.employee_name,
      'Department': record.department,
      'Week': `Week ${record.week_number}`,
      'Week Start': record.week_start,
      'Week End': record.week_end,
      'Days Present': record.days_present,
      'Total Working Days': record.total_working_days || 6,
      'Effective Days': record.effective_days,
      'Total Hours': record.total_hours,
      'Late Minutes': record.total_late_minutes,
      'Attendance Rate': `${record.attendance_rate}%`
    }))
    filename = `weekly_attendance_${selectedYear.value}.csv`
  } else {
    csvData = monthlyRecords.value.map(record => ({
      'Employee Code': record.employee_code,
      'Employee Name': record.employee_name,
      'Department': record.department,
      'Month': `${record.month_name} ${record.year}`,
      'Days Present': record.days_present,
      'Total Working Days': record.total_working_days,
      'Total Days in Month': record.total_days_in_month,
      'Effective Days': record.effective_days,
      'Total Hours': record.total_hours,
      'Late Minutes': record.total_late_minutes,
      'Attendance Rate': `${record.attendance_rate}%`
    }))
    filename = `monthly_attendance_${selectedYear.value}.csv`
  }
  
  if (csvData.length === 0) return
  
  const headers = Object.keys(csvData[0])
  const csv = [headers.join(','), ...csvData.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============== Lifecycle ==============
onMounted(() => {
  loadDepartments()
  loadData()
})
</script>

<style scoped>
/* Tabs */
.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.tab-btn {
  flex: 1;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.tab-btn:hover {
  background: #f1f5f9;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
}

/* Week and Month cells */
.week-cell, .month-cell {
  font-size: 12px;
}

.week-cell small, .month-cell small {
  color: #94a3b8;
  font-size: 10px;
}

/* Attendance rate colors */
.rate-excellent {
  background: #d1fae5;
  color: #059669;
  padding: 4px 8px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-block;
}

.rate-good {
  background: #dbeafe;
  color: #2563eb;
  padding: 4px 8px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-block;
}

.rate-average {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-block;
}

.rate-poor {
  background: #fee2e2;
  color: #dc2626;
  padding: 4px 8px;
  border-radius: 20px;
  font-weight: 600;
  display: inline-block;
}

.rate-detail {
  font-size: 10px;
  color: #64748b;
  margin-left: 4px;
}

/* Keep all your existing styles below */
.attendance-management-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 32px;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-import, .btn-help {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-import {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-import:hover {
  background: #2563eb;
}

.btn-help:hover {
  background: #f8fafc;
}

.filter-bar {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range input, .filter-group input, .filter-group select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

.btn-refresh {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  height: 38px;
}

.btn-refresh:hover {
  background: #e2e8f0;
}

.btn-export {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-export:hover {
  background: #f8fafc;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }
.text-red { color: #ef4444; }

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.attendance-table-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
}

.table-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
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
  padding: 12px 10px;
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.employee-cell .employee-info {
  display: flex;
  flex-direction: column;
}

.employee-code {
  font-size: 11px;
  color: #94a3b8;
}

.text-center {
  text-align: center;
}

.late-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.on-time-badge {
  background: #d1fae5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.status-half-day {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.status-late {
  background: #fee2e2;
  color: #dc2626;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.status-minor-late {
  background: #fed7aa;
  color: #ea580c;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.status-present {
  background: #d1fae5;
  color: #059669;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

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
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.5;
}

.import-modal {
  max-width: 500px;
}

.import-type-section {
  margin-bottom: 20px;
}

.import-type-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.type-cards {
  display: flex;
  gap: 12px;
}

.type-card {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.type-card.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.type-icon {
  font-size: 20px;
  margin-right: 6px;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.2s;
}

.upload-area.dragging {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-area.hasFile {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.file-icon {
  font-size: 28px;
}

.file-info {
  text-align: left;
}

.file-name {
  font-weight: 600;
  margin: 0;
}

.file-size {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0;
}

.btn-remove {
  background: #fee2e2;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  color: #ef4444;
}

.import-results {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}

.results-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
}

.stat {
  text-align: center;
}

.stat .stat-value {
  font-size: 20px;
  font-weight: 700;
}

.stat.success .stat-value { color: #10b981; }
.stat.failed .stat-value { color: #ef4444; }
.stat.total .stat-value { color: #3b82f6; }

.stat .stat-label {
  font-size: 10px;
}

.success-message {
  background: #d1fae5;
  color: #059669;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  text-align: center;
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
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2ff;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(85vh - 120px);
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eef2ff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .attendance-management-page {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range {
    flex-wrap: wrap;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .data-table {
    font-size: 11px;
  }
  
  .data-table th, .data-table td {
    padding: 8px 6px;
  }
} 
</style>