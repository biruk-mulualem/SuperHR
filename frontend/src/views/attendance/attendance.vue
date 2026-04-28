<template>
  <div class="attendance-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <span class="header-icon">📊</span>
        <div>
          <h1>Attendance Management</h1>
          <p>Import and manage monthly attendance records</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="showImportModal = true">
          <span>📥</span> Import Attendance
        </button>
        <button class="btn-secondary" @click="refreshData">
          <span>🔄</span> Refresh
        </button>
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

    <!-- Year/Month Filter -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Year</label>
        <select v-model="selectedYear" @change="loadData">
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Month</label>
        <select v-model="selectedMonth" @change="loadData">
          <option v-for="(m, idx) in months" :key="idx" :value="idx + 1">{{ m }}</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Department</label>
        <select v-model="filters.departmentId" @change="loadData">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.department_id" :value="dept.department_id">
            {{ dept.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Search</label>
        <input type="text" v-model="filters.search" placeholder="Employee name or code..." @input="debounceLoad" />
      </div>
      
      <button class="btn-reset" @click="resetFilters">Reset</button>
      <button class="btn-export" @click="exportData">📊 Export</button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards" v-if="statistics">
      <div class="stat-card">
        <div class="stat-value">{{ statistics.total_employees || 0 }}</div>
        <div class="stat-label">Total Employees</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ monthInfo.total_days_in_month || 0 }}</div>
        <div class="stat-label">Days in Month</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">{{ monthInfo.total_working_days || 0 }}</div>
        <div class="stat-label">Working Days</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-blue">{{ statistics.total_submitted_days || 0 }}</div>
        <div class="stat-label">Submitted Days</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ formatTime(statistics.total_late_minutes || 0) }}</div>
        <div class="stat-label">Late Hours</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-purple">{{ statistics.total_weekend_ot_hours || 0 }}h</div>
        <div class="stat-label">Weekend OT</div>
      </div>
    </div>

    <!-- Month Info Banner -->
    <div class="month-info" v-if="monthInfo">
      <div class="info-badge">
        <span class="info-icon">📅</span>
        <span>{{ monthInfo.month_name }} {{ monthInfo.year }} - {{ monthInfo.total_days_in_month }} days total, {{ monthInfo.total_working_days }} working days (Mon-Sat)</span>
      </div>
    </div>

    <!-- Attendance Records Table -->
    <div class="data-table-container" v-if="activeTab === 'records'">
      <div class="table-header">
        <h3>Attendance Records</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Loading records...</span>
      </div>

      <div v-else-if="attendanceRecords.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No attendance records found for {{ monthInfo.month_name }} {{ selectedYear }}</p>
        <button class="btn-primary" @click="showImportModal = true">Import Attendance</button>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
<thead>
  <tr>
    <th>Employee</th>
    <th>Department</th>
    <th>Submitted Days</th>
    <th>Present</th>
    <th>Absent</th>
    <th>Late (min)</th>
    <th>Weekend OT</th>
    <th>Holiday OT</th>
    <th>Attendance %</th>
  
    <th>Actions</th>
  </tr>
</thead>
<tbody>
  <tr v-for="record in attendanceRecords" :key="record.employee_id">
    <td class="employee-cell">
      <div class="employee-info">
        <strong>{{ record.employee_name }}</strong>
        <span class="employee-code">{{ record.employee_code }}</span>
      </div>
    </td>
    <td class="dept-cell">{{ record.department_name || '-' }}</td>
    <td class="text-center">
{{ record.submitted_days || record.imported_days }}/{{ record.total_days_in_month }}

    </td>
    <td class="text-center text-green"><strong>{{ record.days_present }}</strong></td>
    <td class="text-center text-red">{{ record.days_absent }}</td>
    <td class="text-center">{{ record.late_minutes }}</td>
    <td class="text-center">{{ record.weekend_ot_hours }}h</td>
    <td class="text-center">{{ record.holiday_ot_hours }}h</td>
    <td class="text-center">
      <span :class="getRateClass(record.attendance_rate)">
        {{ record.attendance_rate }}%
      </span>
    </td>
 
    <td class="text-center">
      <button class="btn-icon btn-edit" @click="editRecord(record)" title="Edit">✏️</button>
      <button class="btn-icon btn-delete" @click="deleteRecord(record.employee_id)" title="Delete">🗑️</button>
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
        <select v-model="pagination.limit" @change="changeLimit" class="limit-select">
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
          <option :value="100">100 per page</option>
        </select>
      </div>
    </div>

    <!-- Import Batches Table -->
    <div class="data-table-container" v-if="activeTab === 'imports'">
      <div class="table-header">
        <h3>Import History</h3>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>Loading imports...</span>
      </div>

      <div v-else-if="importBatches.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No imports found</p>
        <button class="btn-primary" @click="showImportModal = true">Start Your First Import</button>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Import Date</th>
              <th>Period</th>
              <th>Total</th>
              <th>Success</th>
              <th>Errors</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="batch in importBatches" :key="batch.id">
              <td class="file-name-cell">{{ batch.file_name }}</td>
              <td>{{ formatDateTime(batch.import_date) }}</td>
              <td>{{ formatDate(batch.period_start) }} - {{ formatDate(batch.period_end) }}</td>
              <td class="text-center">{{ batch.total_rows }}</td>
              <td class="text-center text-green">{{ batch.success_rows }}</td>
              <td class="text-center text-red">{{ batch.error_rows }}</td>
              <td class="text-center">
                <span :class="getStatusClass(batch.status)">{{ batch.status }}</span>
              </td>
              <td class="text-center">
                <button class="btn-icon" @click="viewBatchDetails(batch)" title="View Details">👁️</button>
                <button v-if="batch.error_rows > 0" class="btn-icon" @click="viewBatchErrors(batch.id)" title="View Errors">⚠️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="importPagination.totalPages > 1">
        <button class="page-btn" :disabled="importPagination.page === 1" @click="changeImportPage(importPagination.page - 1)">← Previous</button>
        <span class="page-info">Page {{ importPagination.page }} of {{ importPagination.totalPages }}</span>
        <button class="page-btn" :disabled="importPagination.page === importPagination.totalPages" @click="changeImportPage(importPagination.page + 1)">Next →</button>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal-content modal-import">
        <div class="modal-header">
          <h3>📥 Import Attendance Data</h3>
          <button class="close-btn" @click="showImportModal = false">✕</button>
        </div>
        <div class="modal-body no-scroll">
          <div class="alert-info">
            <span>ℹ️</span>
            <div>You can only import attendance for the <strong>current month</strong>. The period must be within the same month.</div>
          </div>

          <div class="form-group">
            <label>Period Start Date <span class="required">*</span></label>
            <input type="date" v-model="importPeriod.startDate" required />
          </div>
          
          <div class="form-group">
            <label>Period End Date <span class="required">*</span></label>
            <input type="date" v-model="importPeriod.endDate" required />
          </div>
          
          <div class="upload-area" :class="{ dragging: isDragging, hasFile: selectedFile }"
               @dragover.prevent="isDragging = true" 
               @dragleave.prevent="isDragging = false" 
               @drop.prevent="handleDrop">
            <div v-if="!selectedFile" class="upload-placeholder">
              <span class="upload-icon">📂</span>
              <p>Drag & drop your CSV/Excel file here</p>
              <button class="btn-secondary" @click="$refs.fileInput.click()">Browse Files</button>
              <p class="upload-hint"><a href="#" @click.prevent="downloadTemplate">Download Template</a></p>
            </div>
            <div v-else class="file-preview">
              <span class="file-icon">📄</span>
              <div class="file-info">
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button class="btn-remove" @click="clearFile">✕</button>
            </div>
            <input type="file" ref="fileInput" @change="handleFileSelect" accept=".csv,.xlsx,.xls" style="display: none" />
          </div>
          
          <div v-if="importResult" class="import-result">
            <div class="result-success" v-if="importResult.success">
              <span>✅ Import completed!</span>
              <p>{{ importResult.data?.success || 0 }} records imported, {{ importResult.data?.failed || 0 }} failed</p>
            </div>
            <div class="result-error" v-else>
              <span>❌ {{ importResult.message }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showImportModal = false">Cancel</button>
          <button class="btn-primary" @click="processImport" :disabled="!selectedFile || importing">
            <span v-if="importing" class="spinner-small"></span>
            {{ importing ? 'Importing...' : 'Import' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Record Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>✏️ Edit Attendance Record</h3>
          <button class="close-btn" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Employee</label>
            <input type="text" :value="editRecordData.employee_name" disabled />
          </div>
          <div class="form-group">
            <label>Period</label>
            <input type="text" :value="`${monthInfo.month_name} ${selectedYear}`" disabled />
          </div>
          <div class="form-group">
            <label>Submitted Days</label>
            <input type="text" :value="editRecordData.submitted_days || editRecordData.imported_days" disabled />
          </div>
          <div class="form-group">
            <label>Late Minutes</label>
            <input type="number" v-model.number="editRecordData.late_minutes" min="0" />
          </div>
          <div class="form-group">
            <label>Absence Days (including half days as 0.5)</label>
            <input type="number" step="0.5" v-model.number="editRecordData.days_absent" min="0" />
          </div>
          <div class="form-group">
            <label>Weekend OT Minutes</label>
            <input type="number" v-model.number="editRecordData.weekend_ot_minutes" min="0" />
          </div>
          <div class="form-group">
            <label>Holiday OT Minutes</label>
            <input type="number" v-model.number="editRecordData.holiday_ot_minutes" min="0" />
          </div>
          <div class="form-group">
            <label>Present Days (auto-calculated)</label>
            <input type="text" :value="(editRecordData.submitted_days || editRecordData.imported_days) - editRecordData.days_absent" disabled />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showEditModal = false">Cancel</button>
          <button class="btn-primary" @click="saveEditRecord">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Import Batch Details Modal -->
    <div v-if="showBatchDetailsModal" class="modal-overlay" @click.self="showBatchDetailsModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>📦 Import Batch Details</h3>
          <button class="close-btn" @click="showBatchDetailsModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="batch-info" v-if="selectedBatch">
            <div class="info-row"><strong>File:</strong> {{ selectedBatch.file_name }}</div>
            <div class="info-row"><strong>Imported:</strong> {{ formatDateTime(selectedBatch.import_date) }}</div>
            <div class="info-row"><strong>Period:</strong> {{ formatDate(selectedBatch.period_start) }} - {{ formatDate(selectedBatch.period_end) }}</div>
            <div class="info-row"><strong>Status:</strong> <span :class="getStatusClass(selectedBatch.status)">{{ selectedBatch.status }}</span></div>
            <div class="info-row"><strong>Total Rows:</strong> {{ selectedBatch.total_rows }}</div>
            <div class="info-row"><strong>Successful:</strong> {{ selectedBatch.success_rows }}</div>
            <div class="info-row"><strong>Failed:</strong> {{ selectedBatch.error_rows }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showBatchDetailsModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Error Details Modal -->
    <div v-if="showErrorsModal" class="modal-overlay" @click.self="showErrorsModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>⚠️ Import Errors (Batch #{{ currentBatchId }})</h3>
          <button class="close-btn" @click="showErrorsModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="error-summary">
            <p>Total errors: <strong>{{ importErrors.length }}</strong></p>
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Employee ID</th>
                  <th>Error Message</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="error in importErrors" :key="error.id">
                  <td class="text-center">{{ error.row_number }}</td>
                  <td class="text-center">{{ error.employee_id || '-' }}</td>
                  <td class="error-message">{{ error.error_message }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="downloadTemplate">Download Template</button>
          <button class="btn-primary" @click="showErrorsModal = false; showImportModal = true">Re-import</button>
          <button class="btn-secondary" @click="showErrorsModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import attendanceService from '@/stores/attendanceService'
import employeeService from '@/stores/employee'

// ============== State ==============
const activeTab = ref('records')
const loading = ref(false)
const importing = ref(false)
const isDragging = ref(false)
const showImportModal = ref(false)
const showErrorsModal = ref(false)
const showBatchDetailsModal = ref(false)
const showEditModal = ref(false)
const selectedFile = ref(null)
const fileInput = ref(null)
const importResult = ref(null)
const importErrors = ref([])
const currentBatchId = ref(null)
const selectedBatch = ref(null)
const editRecordData = ref({})

const tabs = [
  { value: 'records', label: 'Attendance', icon: '📋' },
  { value: 'imports', label: 'Import History', icon: '📦' }
]

const availableYears = ref([2024, 2025, 2026, 2027])
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Data
const attendanceRecords = ref([])
const importBatches = ref([])
const departments = ref([])
const statistics = ref(null)
const monthInfo = ref({})

// Filters
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const filters = ref({
  departmentId: null,
  search: ''
})

const importPeriod = ref({
  startDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
  endDate: new Date().toISOString().split('T')[0]
})

// Pagination
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })
const importPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 })

let debounceTimer = null

// ============== Helper Functions ==============
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

function formatTime(minutes) {
  if (!minutes) return '0h'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function getCompletionClass(record) {
  const percent = ((record.submitted_days || record.imported_days) / record.total_days_in_month) * 100
  if (percent >= 100) return 'completion-full'
  if (percent >= 75) return 'completion-high'
  if (percent >= 50) return 'completion-medium'
  if (percent >= 25) return 'completion-low'
  return 'completion-minimal'
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getRateClass(rate) {
  const numRate = parseFloat(rate)
  if (numRate >= 90) return 'rate-excellent'
  if (numRate >= 75) return 'rate-good'
  if (numRate >= 60) return 'rate-average'
  return 'rate-poor'
}

function getStatusClass(status) {
  const classes = {
    completed: 'status-success',
    processing: 'status-warning',
    failed: 'status-danger'
  }
  return classes[status] || 'status-info'
}

// Template Download
function downloadTemplate() {
  const headers = ['Employee ID', 'Late Minutes', 'Half Day Absence', 'Absence Days', 'Weekend OT Minutes', 'Holiday OT Minutes']
  const sampleRows = [
    ['44', '15', '0', '2', '0', '0'],
    ['45', '30', '0', '1', '60', '0'],
    ['46', '0', '0', '0', '0', '0']
  ]
  
  let csvContent = headers.join(',') + '\n'
  sampleRows.forEach(row => {
    csvContent += row.join(',') + '\n'
  })
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'attendance_import_template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

// Load departments
async function loadDepartments() {
  try {
    const res = await employeeService.getDepartments()
    if (res.success) departments.value = res.data
  } catch (error) {
    console.error('Failed to load departments:', error)
  }
}

// Load attendance records (using monthly summary)
async function loadAttendanceRecords() {
  loading.value = true
  try {
    const params = {
      year: selectedYear.value,
      month: selectedMonth.value,
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...(filters.value.departmentId && { departmentId: filters.value.departmentId }),
      ...(filters.value.search && { search: filters.value.search })
    }
    
    const res = await attendanceService.getMonthlySummary(params)
    
    if (res.success) {
      attendanceRecords.value = res.data
      pagination.value = res.pagination
      monthInfo.value = res.month_info || {}
      
      // Calculate statistics from records
      const stats = {
        total_employees: attendanceRecords.value.length,
        total_submitted_days: attendanceRecords.value.reduce((sum, r) => sum + (r.submitted_days || r.imported_days || 0), 0),
        total_late_minutes: attendanceRecords.value.reduce((sum, r) => sum + (r.late_minutes || 0), 0),
        total_absence_days: attendanceRecords.value.reduce((sum, r) => sum + parseFloat(r.days_absent || 0), 0),
        total_weekend_ot_hours: attendanceRecords.value.reduce((sum, r) => sum + parseFloat(r.weekend_ot_hours || 0), 0),
        total_holiday_ot_hours: attendanceRecords.value.reduce((sum, r) => sum + parseFloat(r.holiday_ot_hours || 0), 0)
      }
      statistics.value = stats
    }
  } catch (error) {
    console.error('Failed to load attendance records:', error)
  } finally {
    loading.value = false
  }
}

// Load import batches
async function loadImportBatches() {
  loading.value = true
  try {
    const res = await attendanceService.getImportBatches({
      page: importPagination.value.page,
      limit: importPagination.value.limit
    })
    
    if (res.success) {
      importBatches.value = res.data
      importPagination.value = res.pagination
    }
  } catch (error) {
    console.error('Failed to load import batches:', error)
  } finally {
    loading.value = false
  }
}

async function loadData() {
  if (activeTab.value === 'records') {
    await loadAttendanceRecords()
  } else {
    await loadImportBatches()
  }
}

function debounceLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1
    loadData()
  }, 500)
}

// Event Handlers
function switchTab(tab) {
  activeTab.value = tab
  loadData()
}

function resetFilters() {
  filters.value = {
    departmentId: null,
    search: ''
  }
  pagination.value.page = 1
  loadData()
}

function changePage(page) {
  pagination.value.page = page
  loadAttendanceRecords()
}

function changeLimit() {
  pagination.value.page = 1
  loadAttendanceRecords()
}

function changeImportPage(page) {
  importPagination.value.page = page
  loadImportBatches()
}

function refreshData() {
  loadData()
}

// Import Functions
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    importResult.value = null
  }
}

function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    selectedFile.value = file
    importResult.value = null
  }
}

function clearFile() {
  selectedFile.value = null
  importResult.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function processImport() {
  if (!selectedFile.value) {
    alert('Please select a file to import')
    return
  }
  
  if (!importPeriod.value.startDate || !importPeriod.value.endDate) {
    alert('Please select period start and end dates')
    return
  }
  
  importing.value = true
  importResult.value = null
  
  try {
    const result = await attendanceService.importAttendanceFile(selectedFile.value, importPeriod.value)
    importResult.value = result
    
    if (result.success && result.data?.success > 0) {
      setTimeout(() => {
        showImportModal.value = false
        clearFile()
        loadData()
      }, 2000)
    }
  } catch (error) {
    importResult.value = {
      success: false,
      message: error.response?.data?.error || 'Import failed',
      data: { success: 0, failed: 0, total: 0 }
    }
  } finally {
    importing.value = false
  }
}

// Edit Functions
function editRecord(record) {
  editRecordData.value = { 
    ...record,
    absence_days: parseFloat(record.days_absent) || 0,
    weekend_ot_minutes: parseFloat(record.weekend_ot_hours) * 60 || 0,
    holiday_ot_minutes: parseFloat(record.holiday_ot_hours) * 60 || 0
  }
  showEditModal.value = true
}

async function saveEditRecord() {
  try {
    const payload = {
      late_minutes: editRecordData.value.late_minutes,
      absence_days: editRecordData.value.absence_days,
      weekend_ot_minutes: editRecordData.value.weekend_ot_minutes,
      holiday_ot_minutes: editRecordData.value.holiday_ot_minutes
    }
    
    await attendanceService.updateAttendanceRecord(editRecordData.value.id, payload)
    showEditModal.value = false
    await loadAttendanceRecords()
    alert('Record updated successfully')
  } catch (error) {
    console.error('Failed to update record:', error)
    alert('Failed to update record')
  }
}

// Batch Functions
async function viewBatchDetails(batch) {
  selectedBatch.value = batch
  showBatchDetailsModal.value = true
}

async function viewBatchErrors(batchId) {
  try {
    const res = await attendanceService.getImportErrors({ batchId, resolved: false })
    if (res.success) {
      importErrors.value = res.data
      currentBatchId.value = batchId
      showErrorsModal.value = true
    }
  } catch (error) {
    console.error('Failed to load errors:', error)
  }
}

async function deleteRecord(employeeId) {
  if (confirm('Are you sure you want to delete this record?')) {
    try {
      // Find the record by employee_id and current month/year
      const record = attendanceRecords.value.find(r => r.employee_id === employeeId)
      if (record) {
        await attendanceService.deleteAttendanceRecord(record.id)
        await loadAttendanceRecords()
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
      alert('Failed to delete record')
    }
  }
}

function exportData() {
  if (attendanceRecords.value.length === 0) return
  
  const headers = ['Employee Code', 'Employee Name', 'Department', 'Days in Month', 'Working Days', 'Submitted', 'Present', 'Absent', 'Missing', 'Late Minutes', 'Weekend OT (h)', 'Holiday OT (h)', 'Attendance Rate (%)', 'Status']
  const rows = attendanceRecords.value.map(record => [
    record.employee_code,
    record.employee_name,
    record.department_name,
    record.total_days_in_month,
    record.total_working_days,
    record.submitted_days || record.imported_days,
    record.days_present,
    record.days_absent,
    record.missing_days,
    record.late_minutes,
    record.weekend_ot_hours,
    record.holiday_ot_hours,
    record.attendance_rate,
    record.is_complete ? 'Complete' : 'Partial'
  ])
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `attendance_${selectedYear.value}_${selectedMonth.value}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Watchers
watch(() => selectedYear.value, () => loadData())
watch(() => selectedMonth.value, () => loadData())
watch(() => filters.value.departmentId, () => loadData())
watch(() => filters.value.search, () => debounceLoad())

// Lifecycle
onMounted(() => {
  loadDepartments()
  loadData()
})
</script>

<style scoped>
/* Add these new styles */
.partial-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.text-blue {
  color: #3b82f6;
}

/* Keep all existing styles from your original file */
.alert-info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.month-info {
  margin-bottom: 20px;
}

.completion-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
}

.completion-full {
  background: #d1fae5;
  color: #059669;
}

.completion-high {
  background: #dbeafe;
  color: #2563eb;
}

.completion-medium {
  background: #fef3c7;
  color: #d97706;
}

.completion-low {
  background: #fed7aa;
  color: #ea580c;
}

.completion-minimal {
  background: #fee2e2;
  color: #dc2626;
}

.info-badge {
  background: #e0e7ff;
  border-radius: 8px;
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1e40af;
}

.info-icon {
  font-size: 16px;
}

.btn-edit:hover {
  background: #dbeafe;
}

/* Keep all existing styles from your original file */
.attendance-management {
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
  min-width: 130px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.filter-group select, .filter-group input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

.btn-reset {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  height: 38px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
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
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }
.text-red { color: #ef4444; }
.text-purple { color: #8b5cf6; }

.data-table-container {
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

.text-center {
  text-align: center;
}

.employee-cell .employee-info {
  display: flex;
  flex-direction: column;
}

.employee-code {
  font-size: 11px;
  color: #94a3b8;
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

.absence-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

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

.status-success {
  background: #d1fae5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.status-warning {
  background: #fef3c7;
  color: #d97706;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.status-danger {
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-icon:hover {
  background: #f1f5f9;
}

.btn-delete:hover {
  background: #fee2e2;
}

.btn-edit:hover {
  background: #dbeafe;
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

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.limit-select {
  margin-left: 16px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
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

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.5;
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
  max-width: 500px;
  max-height: 85vh;
  overflow: auto;
}

.modal-large {
  max-width: 800px;
}

.modal-import {
  max-width: 550px;
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

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #1e293b;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  margin-top: 16px;
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

.import-result {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
}

.result-success {
  background: #d1fae5;
  color: #059669;
}

.result-error {
  background: #fee2e2;
  color: #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 12px;
}

.upload-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
}

.upload-hint a {
  color: #3b82f6;
  text-decoration: none;
}

.upload-hint a:hover {
  text-decoration: underline;
}

.required {
  color: #ef4444;
}

.batch-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.error-summary {
  background: #fef2f2;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.file-name-cell {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>