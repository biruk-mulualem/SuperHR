<template>
  <div class="leave-management-hr">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <span class="header-icon">🏢</span>
        <div>
          <h1>Leave Management</h1>
          <p>Manage and monitor employee leave requests</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openAddLeaveModal">
          <span>➕</span> Add Leave
        </button>
        <button class="btn-secondary" @click="exportReport">
          <span>📊</span> Export CSV
        </button>
        <button class="btn-secondary" @click="refreshData">
          <span>🔄</span> Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards with Overdue Returns -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total_requests || 0 }}</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-orange">{{ stats.pending_requests || 0 }}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">{{ stats.approved_requests || 0 }}</div>
        <div class="stat-label">Approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">{{ stats.rejected_requests || 0 }}</div>
        <div class="stat-label">Rejected</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-blue">{{ stats.employees_on_leave_today || 0 }}</div>
        <div class="stat-label">On Leave Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-purple">{{ stats.total_days_requested || 0 }}</div>
        <div class="stat-label">Total Days</div>
      </div>
    </div>

    <!-- Overdue Returns Alert -->
    <div v-if="stats.overdue_returns > 0" class="overdue-alert">
      <span class="alert-icon">⚠️</span>
      <span class="alert-message">{{ stats.overdue_returns }} employee(s) have not returned from leave!</span>
      <button class="alert-btn" @click="activeTab = 'overdue'">View Details</button>
    </div>

    <!-- Evenly Spaced Tabs -->
    <div class="tabs-container">
      <button class="tab-btn" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
        <span>⏳</span> Pending
        <span class="tab-badge" v-if="stats.pending_requests > 0">{{ stats.pending_requests }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'approved' }" @click="activeTab = 'approved'">
        <span>✅</span> Approved
        <span class="tab-badge" v-if="stats.approved_requests > 0">{{ stats.approved_requests }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'rejected' }" @click="activeTab = 'rejected'">
        <span>❌</span> Rejected
        <span class="tab-badge" v-if="stats.rejected_requests > 0">{{ stats.rejected_requests }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'overdue' }" @click="activeTab = 'overdue'">
        <span>⚠️</span> Overdue
        <span class="tab-badge danger" v-if="stats.overdue_returns > 0">{{ stats.overdue_returns }}</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'calendar' }" @click="activeTab = 'calendar'">
        <span>📅</span> Calendar
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'balance' }" @click="activeTab = 'balance'">
        <span>⚖️</span> Balance
      </button>
    </div>

    <!-- ==================== PENDING TAB ==================== -->
    <div v-if="activeTab === 'pending'" class="section-container">
      <div class="section-header">
        <h3>⏳ Pending Approval</h3>
        <span class="badge">{{ filteredPendingRequests.length }} requests waiting</span>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="pendingFilters.search" placeholder="Search employee..." class="search-input" />
        </div>
        <select v-model="pendingFilters.department" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
        </select>
        <select v-model="pendingFilters.leaveType" class="filter-select">
          <option :value="null">All Leave Types</option>
          <option v-for="type in leaveTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
      </div>

      <div v-if="filteredPendingRequests.length === 0" class="empty-state">
        <span class="empty-icon">✅</span>
        <p>No pending requests</p>
      </div>

      <div v-else class="compact-requests-grid">
        <div v-for="request in paginatedPendingRequests" :key="request.id" class="compact-card">
          <div class="compact-card-left">
            <div class="compact-avatar">{{ getInitials(request.employee_name) }}</div>
            <div class="compact-info">
              <div class="compact-name">{{ request.employee_name }}</div>
              <div class="compact-code">{{ request.employee_code }} • {{ request.department_name }}</div>
              <div class="compact-dates">📅 {{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }} ({{ request.total_days }} days)</div>
            </div>
          </div>
          <div class="compact-card-right">
            <div class="compact-type" :class="getLeaveTypeClass(request.leave_type_name)">{{ request.leave_type_name }}</div>
            <div class="compact-actions">
              <button class="btn-view-small" @click="goToDetailPage(request.id)">👁️</button>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="pendingTotalPages > 1">
        <button class="page-btn" :disabled="pendingPage === 1" @click="pendingPage--">←</button>
        <span>{{ pendingPage }} / {{ pendingTotalPages }}</span>
        <button class="page-btn" :disabled="pendingPage === pendingTotalPages" @click="pendingPage++">→</button>
      </div>
    </div>

    <!-- ==================== APPROVED TAB ==================== -->
    <div v-if="activeTab === 'approved'" class="section-container">
      <div class="section-header">
        <h3>✅ Approved Requests</h3>
        <span class="badge">{{ filteredApprovedRequests.length }} records</span>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="approvedFilters.search" placeholder="Search employee..." class="search-input" />
        </div>
        <select v-model="approvedFilters.department" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
        </select>
        <select v-model="approvedFilters.leaveType" class="filter-select">
          <option :value="null">All Leave Types</option>
          <option v-for="type in leaveTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
        <input type="month" v-model="approvedFilters.month" class="month-picker" />
      </div>

      <div v-if="filteredApprovedRequests.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No approved requests found</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dept</th>
              <th>Type</th>
              <th>Period</th>
              <th>Days</th>
              <th>Return Status</th>
              <th>Approved</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in paginatedApprovedRequests" :key="request.id">
              <td>
                <strong>{{ request.employee_name }}</strong>
                <div class="employee-code">{{ request.employee_code }}</div>
              </td>
              <td>{{ request.department_name }}</td>
              <td>{{ request.leave_type_name }}</td>
              <td>{{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}</td>
              <td class="text-center">{{ request.total_days }}</td>
              <td class="text-center">
                <span :class="getReturnStatusClass(request.return_status)">
                  {{ getReturnStatusText(request) }}
                </span>
              </td>
              <td class="text-center">{{ formatDate(request.approved_date) }}</td>
              <td class="text-center">
                <button class="btn-icon" @click="goToDetailPage(request.id)" title="View Details">👁️</button>
                <button v-if="request.return_status === 'overdue'" class="btn-icon" @click="confirmReturn(request.id)" title="Confirm Return">✅</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="approvedTotalPages > 1">
        <button class="page-btn" :disabled="approvedPage === 1" @click="approvedPage--">←</button>
        <span>{{ approvedPage }} / {{ approvedTotalPages }}</span>
        <button class="page-btn" :disabled="approvedPage === approvedTotalPages" @click="approvedPage++">→</button>
      </div>
    </div>

    <!-- ==================== REJECTED TAB ==================== -->
    <div v-if="activeTab === 'rejected'" class="section-container">
      <div class="section-header">
        <h3>❌ Rejected Requests</h3>
        <span class="badge">{{ filteredRejectedRequests.length }} records</span>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="rejectedFilters.search" placeholder="Search employee..." class="search-input" />
        </div>
        <select v-model="rejectedFilters.department" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
        </select>
        <select v-model="rejectedFilters.leaveType" class="filter-select">
          <option :value="null">All Leave Types</option>
          <option v-for="type in leaveTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
        <input type="month" v-model="rejectedFilters.month" class="month-picker" />
      </div>

      <div v-if="filteredRejectedRequests.length === 0" class="empty-state">
        <span class="empty-icon">✅</span>
        <p>No rejected requests</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>Employee</th><th>Dept</th><th>Type</th><th>Period</th><th>Days</th><th>Rejected</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="request in paginatedRejectedRequests" :key="request.id">
              <td><strong>{{ request.employee_name }}</strong><div class="employee-code">{{ request.employee_code }}</div></td>
              <td>{{ request.department_name }}</td>
              <td>{{ request.leave_type_name }}</td>
              <td>{{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}</td>
              <td class="text-center">{{ request.total_days }}</td>
              <td class="text-center">{{ formatDate(request.rejected_date) || 'N/A' }}</td>
              <td class="text-center"><button class="btn-icon" @click="goToDetailPage(request.id)">👁️</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="rejectedTotalPages > 1">
        <button class="page-btn" :disabled="rejectedPage === 1" @click="rejectedPage--">←</button>
        <span>{{ rejectedPage }} / {{ rejectedTotalPages }}</span>
        <button class="page-btn" :disabled="rejectedPage === rejectedTotalPages" @click="rejectedPage++">→</button>
      </div>
    </div>

    <!-- ==================== OVERDUE RETURNS TAB ==================== -->
    <div v-if="activeTab === 'overdue'" class="section-container">
      <div class="section-header">
        <h3>⚠️ Overdue Returns</h3>
        <span class="badge danger">{{ overdueReturnsList.length }} employees overdue</span>
      </div>

      <div v-if="overdueReturnsList.length === 0" class="empty-state">
        <span class="empty-icon">✅</span>
        <p>All employees have returned on time</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dept</th>
              <th>Leave Type</th>
              <th>End Date</th>
              <th>Return Date</th>
              <th>Days Overdue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in overdueReturnsList" :key="request.id">
              <td><strong>{{ request.employee_name }}</strong><div class="employee-code">{{ request.employee_code }}</div></td>
              <td>{{ request.department_name }}</td>
              <td>{{ request.leave_type_name }}</td>
              <td>{{ formatDate(request.end_date) }}</td>
              <td>{{ formatDate(request.return_date) }}</td>
              <td class="text-center"><span class="badge-danger">{{ request.days_overdue }} days</span></td>
              <td class="text-center">
                <button class="btn-primary-small" @click="confirmReturn(request.id)">✅ Confirm Return</button>
                <button class="btn-icon" @click="goToDetailPage(request.id)">👁️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== CALENDAR TAB ==================== -->
    <div v-if="activeTab === 'calendar'" class="section-container">
      <div class="calendar-header">
        <button class="month-nav" @click="calendarMonth--">←</button>
        <h3>{{ getMonthName(calendarMonth) }} {{ calendarYear }}</h3>
        <button class="month-nav" @click="calendarMonth++">→</button>
        <button class="today-btn" @click="goToToday">Today</button>
      </div>
      
      <div class="calendar">
        <div class="calendar-weekdays">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>
        <div class="calendar-days">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index" 
            class="calendar-day" 
            :class="{ 
              'other-month': !day.isCurrentMonth, 
              'today': day.isToday, 
              'has-leave': day.hasLeave,
              'return-day': day.isReturnDay
            }"
            @mouseenter="showTooltip(day, $event)" 
            @mouseleave="hideTooltip"
          >
            <span class="day-number">{{ day.day }}</span>
            <div v-if="day.hasLeave" class="leave-count-badge">
              <span class="count-number">{{ day.leaves.length }}</span>
            </div>
            <div v-if="day.isReturnDay" class="return-badge">
              <span>🔄</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Tooltip with Return Info -->
      <div v-if="tooltipVisible" class="calendar-tooltip" :style="tooltipStyle">
        <div class="tooltip-title">📋 Leave Information:</div>
        <div class="tooltip-list">
          <div v-for="leave in tooltipLeaves" :key="leave.id" class="tooltip-item">
            <div class="tooltip-header">
              <span class="tooltip-dot" :class="getLeaveTypeClass(leave.leave_type_name)"></span>
              <span class="tooltip-name">{{ leave.employee_name }}</span>
              <span class="tooltip-type">({{ leave.leave_type_name }})</span>
            </div>
            <div class="tooltip-dates">
              <div>📅 Leave: {{ formatDate(leave.start_date) }} - {{ formatDate(leave.end_date) }}</div>
              <div class="return-date">🔄 Returns: {{ formatDate(getReturnDate(leave.end_date)) }}</div>
              <div v-if="leave.return_status === 'overdue'" class="overdue-text">⚠️ OVERDUE!</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== BALANCE TAB ==================== -->
    <div v-if="activeTab === 'balance'" class="section-container">
      <div class="section-header">
        <h3>⚖️ Leave Balance</h3>
        <button class="btn-export-small" @click="exportBalanceReport">📊 Export CSV</button>
      </div>

      <div class="balance-summary-cards">
        <div class="balance-summary-card"><div class="summary-value">{{ totalBalanceStats.total_employees }}</div><div class="summary-label">Employees</div></div>
        <div class="balance-summary-card"><div class="summary-value text-green">{{ totalBalanceStats.avg_available_days }}</div><div class="summary-label">Avg Annual Available</div></div>
        <div class="balance-summary-card"><div class="summary-value text-orange">{{ totalBalanceStats.total_sick_used }}</div><div class="summary-label">Sick Days Used</div></div>
        <div class="balance-summary-card"><div class="summary-value text-red">{{ totalBalanceStats.employees_low_balance }}</div><div class="summary-label">Low Balance</div></div>
      </div>

      <div class="balance-filters">
        <input type="text" v-model="balanceSearch" placeholder="Search..." class="search-input" />
        <select v-model="balanceDepartmentFilter" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
        </select>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dept</th>
              <th>Annual Leave</th>
              <th>Sick Leave (No Fixed Limit)</th>
              <th>Maternity</th>
              <th>Paternity</th>
              <th>Bereavement</th>
              <th>Unpaid</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in paginatedBalanceData" :key="emp.id">
              <td><strong>{{ emp.name }}</strong><div class="employee-code">{{ emp.code }}</div></td>
              <td>{{ emp.department }}</td>
              <td class="text-center"><div class="progress-bar-small"><div class="progress-fill" :style="{ width: (emp.annual_used / emp.annual_total * 100) + '%' }"></div></div>{{ emp.annual_used }}/{{ emp.annual_total }}</td>
              <td class="text-center"><span class="sick-days">{{ emp.sick_used }} days used</span><div class="sick-note">(monitored for patterns)</div></td>
              <td class="text-center">{{ emp.maternity_used || 0 }}</td>
              <td class="text-center">{{ emp.paternity_used || 0 }}</td>
              <td class="text-center">{{ emp.bereavement_used || 0 }}</td>
              <td class="text-center">{{ emp.unpaid_used || 0 }}</td>
              <td class="text-center"><span :class="getBalanceStatusClass(emp.annual_total - emp.annual_used)">{{ emp.annual_total - emp.annual_used }} days</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="balanceTotalPages > 1">
        <button class="page-btn" :disabled="balancePage === 1" @click="balancePage--">←</button>
        <span>{{ balancePage }} / {{ balanceTotalPages }}</span>
        <button class="page-btn" :disabled="balancePage === balanceTotalPages" @click="balancePage++">→</button>
      </div>
    </div>

    <!-- Add Leave Modal with Validation -->
    <div v-if="showAddLeaveModal" class="modal-overlay" @click.self="showAddLeaveModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header"><h3>➕ Add Leave</h3><button class="close-btn" @click="showAddLeaveModal = false">✕</button></div>
        <div class="modal-body-compact">
          <div class="form-group" :class="{ 'has-error': validationErrors.employee_id }">
            <label>Employee <span class="required">*</span></label>
            <select v-model="newLeave.employee_id" @change="onEmployeeChange" class="form-select">
              <option :value="null">Select Employee</option>
              <option v-for="emp in employeeBalances" :key="emp.id" :value="emp.id">{{ emp.name }} ({{ emp.code }})</option>
            </select>
            <span class="error-text" v-if="validationErrors.employee_id">{{ validationErrors.employee_id }}</span>
          </div>
          
          <div class="form-group" :class="{ 'has-error': validationErrors.leave_type_id }">
            <label>Leave Type <span class="required">*</span></label>
            <select v-model="newLeave.leave_type_id" @change="onLeaveTypeChange" class="form-select">
              <option :value="null">Select Type</option>
              <option v-for="type in leaveTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
            <span class="error-text" v-if="validationErrors.leave_type_id">{{ validationErrors.leave_type_id }}</span>
          </div>
          
          <!-- Annual Leave Balance Info -->
          <div v-if="selectedLeaveType?.name === 'Annual Leave' && selectedEmployee" class="info-box">
            <div class="info-title">📊 Available Annual Leave Balance</div>
            <div class="info-value">{{ getAnnualAvailable(selectedEmployee) }} days available</div>
          </div>
          
          <!-- Fixed Leave Info -->
          <div v-if="isFixedLeave && selectedLeaveType" class="info-box info-blue">
            <div class="info-title">📅 {{ selectedLeaveType.name }}</div>
            <div class="info-value">Fixed duration: {{ selectedLeaveType.default_days }} days</div>
          </div>
          
          <div class="form-row">
            <div class="form-group" :class="{ 'has-error': validationErrors.start_date }">
              <label>Start Date <span class="required">*</span></label>
              <input type="date" v-model="newLeave.start_date" @change="validateDates" class="form-input" />
              <span class="error-text" v-if="validationErrors.start_date">{{ validationErrors.start_date }}</span>
            </div>
            <div class="form-group" :class="{ 'has-error': validationErrors.end_date }">
              <label>End Date <span class="required">*</span></label>
              <input type="date" v-model="newLeave.end_date" @change="validateDates" class="form-input" :readonly="isFixedLeave" />
              <span class="error-text" v-if="validationErrors.end_date">{{ validationErrors.end_date }}</span>
            </div>
          </div>
          
          <!-- Balance Warning -->
          <div v-if="selectedLeaveType?.name === 'Annual Leave' && newLeave.start_date && newLeave.end_date && selectedEmployee && exceedsAnnualBalance" class="warning-box error-box">
            <div class="info-title">⚠️ Exceeds Available Balance</div>
            <div class="info-value">Requesting {{ calculatedDays }} days | Available: {{ getAnnualAvailable(selectedEmployee) }} days</div>
          </div>
          
          <div class="form-group" :class="{ 'has-error': validationErrors.reason }">
            <label>Reason <span class="required">*</span></label>
            <textarea v-model="newLeave.reason" rows="2" placeholder="Enter reason for leave..." class="form-textarea"></textarea>
            <span class="error-text" v-if="validationErrors.reason">{{ validationErrors.reason }}</span>
          </div>
          
          <div class="form-group">
            <label>Status</label>
            <select v-model="newLeave.status" class="form-select">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddLeaveModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmAddLeave" :disabled="!isFormValid">Add Leave</button>
        </div>
      </div>
    </div>
    

    <!-- Confirmation Modal for Return -->
    <div v-if="showReturnConfirmModal" class="modal-overlay" @click.self="showReturnConfirmModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>✅ Confirm Employee Return</h3>
          <button class="close-btn" @click="showReturnConfirmModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Confirm that <strong>{{ returnConfirmEmployee?.employee_name }}</strong> has returned from leave?</p>
          <div class="info-group-modal">
            <div class="info-row-modal"><label>Expected Return:</label><span>{{ formatDate(returnConfirmEmployee?.return_date) }}</span></div>
            <div class="info-row-modal"><label>Days Overdue:</label><span class="text-red">{{ returnConfirmEmployee?.days_overdue || 0 }} days</span></div>
          </div>
          <div class="form-group">
            <label>Actual Return Date</label>
            <input type="date" v-model="actualReturnDate" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showReturnConfirmModal = false">Cancel</button>
          <button class="btn-primary" @click="processConfirmReturn">Confirm Return</button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
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

const router = useRouter()

// State
const loading = ref(false)
const activeTab = ref('pending')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastIcon = ref('✅')

// Validation
const validationErrors = ref({})
const isFormValid = ref(false)

// Return confirmation
const showReturnConfirmModal = ref(false)
const returnConfirmEmployee = ref(null)
const actualReturnDate = ref('')

// Filters
const pendingFilters = ref({ search: '', department: null, leaveType: null })
const approvedFilters = ref({ search: '', department: null, leaveType: null, month: new Date().toISOString().slice(0, 7) })
const rejectedFilters = ref({ search: '', department: null, leaveType: null, month: new Date().toISOString().slice(0, 7) })

// Pagination
const pendingPage = ref(1)
const approvedPage = ref(1)
const rejectedPage = ref(1)
const balancePage = ref(1)
const itemsPerPage = 10

// Calendar
const calendarMonth = ref(new Date().getMonth())
const calendarYear = ref(new Date().getFullYear())
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Tooltip
const tooltipVisible = ref(false)
const tooltipLeaves = ref([])
const tooltipStyle = ref({})

// Balance filters
const balanceSearch = ref('')
const balanceDepartmentFilter = ref(null)

// Modals
const showAddLeaveModal = ref(false)
const selectedRequest = ref(null)

// New Leave Form
const newLeave = ref({ employee_id: null, leave_type_id: null, start_date: '', end_date: '', reason: '', status: 'pending' })
const selectedEmployee = ref(null)
const selectedLeaveType = ref(null)

// Helper functions
function calculateDays(startDate, endDate) {
  const start = new Date(startDate), end = new Date(endDate)
  return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1
}

function getReturnDate(endDate) {
  const date = new Date(endDate)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

function getAnnualAvailable(employee) {
  const emp = employeeBalances.value.find(e => e.id === employee.id)
  return emp ? (emp.annual_total - emp.annual_used) : 0
}

// Validation Functions
function validateForm() {
  const errors = {}
  
  if (!newLeave.value.employee_id) errors.employee_id = 'Please select an employee'
  if (!newLeave.value.leave_type_id) errors.leave_type_id = 'Please select a leave type'
  
  if (!newLeave.value.start_date) {
    errors.start_date = 'Please select a start date'
  } else {
    const startDate = new Date(newLeave.value.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (startDate < today) errors.start_date = 'Start date cannot be in the past'
  }
  
  if (!newLeave.value.end_date) {
    errors.end_date = 'Please select an end date'
  } else if (newLeave.value.start_date) {
    const start = new Date(newLeave.value.start_date)
    const end = new Date(newLeave.value.end_date)
    if (end < start) errors.end_date = 'End date cannot be before start date'
    const diffDays = calculateDays(newLeave.value.start_date, newLeave.value.end_date)
    if (diffDays > 30) errors.end_date = 'Leave cannot exceed 30 consecutive days'
  }
  
  if (!newLeave.value.reason) {
    errors.reason = 'Please provide a reason'
  } else if (newLeave.value.reason.trim().length < 5) {
    errors.reason = 'Reason must be at least 5 characters'
  }
  
  validationErrors.value = errors
  isFormValid.value = Object.keys(errors).length === 0
  return isFormValid.value
}

function validateDates() {
  validateForm()
}

// Watch for form changes
watch(newLeave, () => validateForm(), { deep: true })

const calculatedDays = computed(() => newLeave.value.start_date && newLeave.value.end_date ? calculateDays(newLeave.value.start_date, newLeave.value.end_date) : 0)
const exceedsAnnualBalance = computed(() => selectedLeaveType.value?.name === 'Annual Leave' && selectedEmployee.value && calculatedDays.value > getAnnualAvailable(selectedEmployee.value))
const isFixedLeave = computed(() => selectedLeaveType.value && ['Maternity Leave', 'Paternity Leave', 'Bereavement Leave'].includes(selectedLeaveType.value.name))

function calculateEndDateForFixedLeave() {
  if (isFixedLeave.value && selectedLeaveType.value && newLeave.value.start_date) {
    const start = new Date(newLeave.value.start_date)
    start.setDate(start.getDate() + selectedLeaveType.value.default_days - 1)
    newLeave.value.end_date = start.toISOString().split('T')[0]
    validateDates()
  }
}

function onEmployeeChange() { 
  selectedEmployee.value = employeeBalances.value.find(e => e.id === newLeave.value.employee_id)
  validateForm()
}

function onLeaveTypeChange() {
  selectedLeaveType.value = leaveTypes.value.find(t => t.id === newLeave.value.leave_type_id)
  if (isFixedLeave.value && newLeave.value.start_date) calculateEndDateForFixedLeave()
  else if (selectedLeaveType.value?.name !== 'Annual Leave') newLeave.value.end_date = ''
  validateForm()
}

// Navigate to detail page
function goToDetailPage(leaveId) {
  router.push(`/leave-detail/${leaveId}`)
}

// Return status functions
function getReturnStatusClass(status) {
  const classes = { 'on_time': 'status-success', 'returned_late': 'status-warning', 'overdue': 'status-danger', 'on_leave': 'status-info' }
  return classes[status] || 'status-default'
}

function getReturnStatusText(request) {
  if (request.actual_return_date) {
    const expectedReturn = new Date(request.return_date)
    const actual = new Date(request.actual_return_date)
    if (actual > expectedReturn) return `Returned ${request.days_late} days late`
    return 'Returned on time'
  }
  const today = new Date()
  const returnDate = new Date(request.return_date)
  if (today > returnDate) return `Overdue by ${request.days_late} days`
  if (today.toDateString() === returnDate.toDateString()) return 'Expected today'
  return `Returns ${formatDate(request.return_date)}`
}

function confirmReturn(leaveId) {
  const leave = leaveRequests.value.find(l => l.id === leaveId)
  if (leave) {
    returnConfirmEmployee.value = leave
    actualReturnDate.value = new Date().toISOString().split('T')[0]
    showReturnConfirmModal.value = true
  }
}

function processConfirmReturn() {
  const index = leaveRequests.value.findIndex(l => l.id === returnConfirmEmployee.value.id)
  if (index !== -1) {
    const expectedReturn = new Date(returnConfirmEmployee.value.return_date)
    const actual = new Date(actualReturnDate.value)
    const daysLate = Math.max(0, Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24)))
    
    leaveRequests.value[index] = {
      ...leaveRequests.value[index],
      return_status: daysLate > 0 ? 'returned_late' : 'returned',
      actual_return_date: actualReturnDate.value,
      days_late: daysLate,
      return_confirmed_by: 'HR Manager',
      return_confirmed_date: new Date().toISOString().split('T')[0]
    }
    
    showToastMessage(daysLate > 0 ? `${returnConfirmEmployee.value.employee_name} returned ${daysLate} days late` : `${returnConfirmEmployee.value.employee_name} returned on time`, daysLate > 0 ? 'warning' : 'success')
  }
  showReturnConfirmModal.value = false
  refreshData()
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

// Data
const departments = ref([
  { id: 1, name: 'IT' }, { id: 2, name: 'Finance' }, { id: 3, name: 'HR' },
  { id: 4, name: 'Sales' }, { id: 5, name: 'Marketing' }, { id: 6, name: 'Operations' }
])

const leaveTypes = ref([
  { id: 1, name: 'Annual Leave', default_days: 16 }, // Ethiopian: 16 days for first year
  { id: 2, name: 'Sick Leave', default_days: null, noFixedLimit: true },
  { id: 3, name: 'Maternity Leave', default_days: 90 },
  { id: 4, name: 'Paternity Leave', default_days: 3 }, // Ethiopian: 3 days
  { id: 5, name: 'Bereavement Leave', default_days: 3 }, // Ethiopian: 3 days
  { id: 6, name: 'Unpaid Leave', default_days: null }
])

const leaveRequests = ref([
  { id: 1, employee_id: 44, employee_name: 'Nuru Seid', employee_code: 'EMP006', department_name: 'Finance', leave_type_id: 1, leave_type_name: 'Annual Leave', start_date: '2026-05-10', end_date: '2026-05-14', return_date: '2026-05-15', total_days: 5, reason: 'Dubai trip', status: 'pending', requested_date: '2026-04-15' },
  { id: 2, employee_id: 39, employee_name: 'Biruk Mulualem', employee_code: 'EMP001', department_name: 'IT', leave_type_id: 2, leave_type_name: 'Sick Leave', start_date: '2026-05-20', end_date: '2026-05-22', return_date: '2026-05-23', total_days: 3, reason: 'Medical checkup', status: 'pending', requested_date: '2026-05-18' },
  { id: 3, employee_id: 45, employee_name: 'Tadese Jemberu', employee_code: 'EMP007', department_name: 'IT', leave_type_id: 2, leave_type_name: 'Sick Leave', start_date: '2026-05-05', end_date: '2026-05-06', return_date: '2026-05-07', total_days: 2, reason: 'Flu', status: 'approved', requested_date: '2026-05-03', approved_by: 'HR Manager', approved_date: '2026-05-04', return_status: 'overdue', days_late: 4, extensions: [{ id: 1, requested_date: '2026-05-06', additional_days: 3, reason: 'Still fever', status: 'approved', new_end_date: '2026-05-09' }] },
  { id: 4, employee_id: 47, employee_name: 'Haymanot Abebaw', employee_code: 'EMP009', department_name: 'IT', leave_type_id: 3, leave_type_name: 'Maternity Leave', start_date: '2026-05-01', end_date: '2026-07-29', return_date: '2026-07-30', total_days: 90, reason: 'Maternity', status: 'approved', requested_date: '2026-03-01', approved_by: 'HR Manager', approved_date: '2026-03-05', return_status: 'on_leave' },
  { id: 5, employee_id: 40, employee_name: 'Dagmawi Hadgu', employee_code: 'EMP002', department_name: 'IT', leave_type_id: 1, leave_type_name: 'Annual Leave', start_date: '2026-06-01', end_date: '2026-06-10', return_date: '2026-06-11', total_days: 8, reason: 'Wedding', status: 'pending', requested_date: '2026-05-01' },
  { id: 6, employee_id: 46, employee_name: 'Eshete Worke', employee_code: 'EMP008', department_name: 'IT', leave_type_id: 1, leave_type_name: 'Annual Leave', start_date: '2026-05-15', end_date: '2026-05-19', return_date: '2026-05-20', total_days: 5, reason: 'Family visit', status: 'approved', requested_date: '2026-04-20', approved_by: 'HR Manager', approved_date: '2026-04-22', return_status: 'returned', actual_return_date: '2026-05-20', days_late: 0 },
  { id: 7, employee_id: 41, employee_name: 'Melkamu Zewdu', employee_code: 'EMP003', department_name: 'IT', leave_type_id: 4, leave_type_name: 'Paternity Leave', start_date: '2026-06-15', end_date: '2026-06-17', return_date: '2026-06-18', total_days: 3, reason: 'New baby', status: 'pending', requested_date: '2026-05-10' },
  { id: 8, employee_id: 42, employee_name: 'Melaku Tewodros', employee_code: 'EMP004', department_name: 'IT', leave_type_id: 5, leave_type_name: 'Bereavement Leave', start_date: '2026-05-08', end_date: '2026-05-10', return_date: '2026-05-11', total_days: 3, reason: 'Funeral', status: 'rejected', requested_date: '2026-05-07', rejection_reason: 'Insufficient documentation', rejected_date: '2026-05-07' }
])

// Ethiopian progressive entitlement calculation
function calculateEthiopianAnnualEntitlement(yearsOfService) {
  if (yearsOfService <= 2) return 16
  return 16 + Math.ceil((yearsOfService - 2) / 2)
}

const employeeBalances = ref([
  { id: 39, name: 'Biruk Mulualem', code: 'EMP001', department: 'IT', hire_date: '2025-03-15', years_of_service: 1, annual_total: calculateEthiopianAnnualEntitlement(1), annual_used: 0, sick_used: 5, maternity_used: 0, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 },
  { id: 40, name: 'Dagmawi Hadgu', code: 'EMP002', department: 'IT', hire_date: '2024-06-10', years_of_service: 2, annual_total: calculateEthiopianAnnualEntitlement(2), annual_used: 12, sick_used: 3, maternity_used: 0, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 },
  { id: 41, name: 'Melkamu Zewdu', code: 'EMP003', department: 'IT', hire_date: '2023-05-20', years_of_service: 3, annual_total: calculateEthiopianAnnualEntitlement(3), annual_used: 5, sick_used: 2, maternity_used: 0, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 },
  { id: 42, name: 'Melaku Tewodros', code: 'EMP004', department: 'IT', hire_date: '2020-06-01', years_of_service: 6, annual_total: calculateEthiopianAnnualEntitlement(6), annual_used: 18, sick_used: 8, maternity_used: 0, paternity_used: 0, bereavement_used: 5, unpaid_used: 0 },
  { id: 43, name: 'Tamrat Zerihun', code: 'EMP005', department: 'IT', hire_date: '2019-01-15', years_of_service: 7, annual_total: calculateEthiopianAnnualEntitlement(7), annual_used: 3, sick_used: 4, maternity_used: 0, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 },
  { id: 44, name: 'Nuru Seid', code: 'EMP006', department: 'Finance', hire_date: '2025-09-01', years_of_service: 1, annual_total: calculateEthiopianAnnualEntitlement(1), annual_used: 5, sick_used: 1, maternity_used: 0, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 },
  { id: 45, name: 'Tadese Jemberu', code: 'EMP007', department: 'IT', hire_date: '2024-01-10', years_of_service: 2, annual_total: calculateEthiopianAnnualEntitlement(2), annual_used: 8, sick_used: 9, maternity_used: 0, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 },
  { id: 46, name: 'Eshete Worke', code: 'EMP008', department: 'IT', hire_date: '2022-03-20', years_of_service: 4, annual_total: calculateEthiopianAnnualEntitlement(4), annual_used: 15, sick_used: 4, maternity_used: 0, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 },
  { id: 47, name: 'Haymanot Abebaw', code: 'EMP009', department: 'IT', hire_date: '2020-11-01', years_of_service: 6, annual_total: calculateEthiopianAnnualEntitlement(6), annual_used: 2, sick_used: 0, maternity_used: 90, paternity_used: 0, bereavement_used: 0, unpaid_used: 0 }
])

// Computed
const filteredPendingRequests = computed(() => {
  let r = leaveRequests.value.filter(r => r.status === 'pending')
  if (pendingFilters.value.search) r = r.filter(r => r.employee_name.toLowerCase().includes(pendingFilters.value.search.toLowerCase()) || r.employee_code.toLowerCase().includes(pendingFilters.value.search.toLowerCase()))
  if (pendingFilters.value.department) { const d = departments.value.find(d => d.id === pendingFilters.value.department); if (d) r = r.filter(r => r.department_name === d.name) }
  if (pendingFilters.value.leaveType) r = r.filter(r => r.leave_type_id === pendingFilters.value.leaveType)
  return r
})

const pendingTotalPages = computed(() => Math.ceil(filteredPendingRequests.value.length / itemsPerPage))
const paginatedPendingRequests = computed(() => filteredPendingRequests.value.slice((pendingPage.value - 1) * itemsPerPage, pendingPage.value * itemsPerPage))

const filteredApprovedRequests = computed(() => {
  let r = leaveRequests.value.filter(r => r.status === 'approved')
  if (approvedFilters.value.search) r = r.filter(r => r.employee_name.toLowerCase().includes(approvedFilters.value.search.toLowerCase()) || r.employee_code.toLowerCase().includes(approvedFilters.value.search.toLowerCase()))
  if (approvedFilters.value.department) { const d = departments.value.find(d => d.id === approvedFilters.value.department); if (d) r = r.filter(r => r.department_name === d.name) }
  if (approvedFilters.value.leaveType) r = r.filter(r => r.leave_type_id === approvedFilters.value.leaveType)
  if (approvedFilters.value.month) { const [y, m] = approvedFilters.value.month.split('-'); if (y && m) r = r.filter(r => new Date(r.start_date).getFullYear() === parseInt(y) && new Date(r.start_date).getMonth() + 1 === parseInt(m)) }
  return r
})

const approvedTotalPages = computed(() => Math.ceil(filteredApprovedRequests.value.length / itemsPerPage))
const paginatedApprovedRequests = computed(() => filteredApprovedRequests.value.slice((approvedPage.value - 1) * itemsPerPage, approvedPage.value * itemsPerPage))

const filteredRejectedRequests = computed(() => {
  let r = leaveRequests.value.filter(r => r.status === 'rejected')
  if (rejectedFilters.value.search) r = r.filter(r => r.employee_name.toLowerCase().includes(rejectedFilters.value.search.toLowerCase()) || r.employee_code.toLowerCase().includes(rejectedFilters.value.search.toLowerCase()))
  if (rejectedFilters.value.department) { const d = departments.value.find(d => d.id === rejectedFilters.value.department); if (d) r = r.filter(r => r.department_name === d.name) }
  if (rejectedFilters.value.leaveType) r = r.filter(r => r.leave_type_id === rejectedFilters.value.leaveType)
  if (rejectedFilters.value.month) { const [y, m] = rejectedFilters.value.month.split('-'); if (y && m) r = r.filter(r => new Date(r.start_date).getFullYear() === parseInt(y) && new Date(r.start_date).getMonth() + 1 === parseInt(m)) }
  return r
})

const rejectedTotalPages = computed(() => Math.ceil(filteredRejectedRequests.value.length / itemsPerPage))
const paginatedRejectedRequests = computed(() => filteredRejectedRequests.value.slice((rejectedPage.value - 1) * itemsPerPage, rejectedPage.value * itemsPerPage))

// Overdue returns
const overdueReturnsList = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return leaveRequests.value.filter(r => {
    if (r.status !== 'approved') return false
    if (r.actual_return_date) return false
    const returnDate = new Date(r.return_date)
    const currentDate = new Date(today)
    return currentDate > returnDate
  }).map(r => ({ ...r, days_overdue: Math.ceil((new Date(today) - new Date(r.return_date)) / (1000 * 60 * 60 * 24)) }))
})

const stats = computed(() => {
  const pending = leaveRequests.value.filter(r => r.status === 'pending').length
  const approved = leaveRequests.value.filter(r => r.status === 'approved').length
  const rejected = leaveRequests.value.filter(r => r.status === 'rejected').length
  const today = new Date().toISOString().split('T')[0]
  const onLeaveToday = leaveRequests.value.filter(r => r.status === 'approved' && r.start_date <= today && r.end_date >= today).length
  return {
    total_requests: leaveRequests.value.length, pending_requests: pending, approved_requests: approved,
    rejected_requests: rejected, employees_on_leave_today: onLeaveToday,
    total_days_requested: leaveRequests.value.reduce((s, r) => s + r.total_days, 0),
    departments_with_leave: new Set(leaveRequests.value.map(r => r.department_name)).size,
    overdue_returns: overdueReturnsList.value.length
  }
})

const totalBalanceStats = computed(() => {
  const e = employeeBalances.value
  const totalAvail = e.reduce((s, e) => s + (e.annual_total - e.annual_used), 0)
  return {
    total_employees: e.length, avg_available_days: (totalAvail / e.length).toFixed(1),
    total_sick_used: e.reduce((s, e) => s + e.sick_used, 0),
    employees_low_balance: e.filter(e => (e.annual_total - e.annual_used) < 5).length
  }
})

const filteredBalanceData = computed(() => {
  let d = [...employeeBalances.value]
  if (balanceSearch.value) d = d.filter(e => e.name.toLowerCase().includes(balanceSearch.value.toLowerCase()) || e.code.toLowerCase().includes(balanceSearch.value.toLowerCase()))
  if (balanceDepartmentFilter.value) { const dept = departments.value.find(d => d.id === balanceDepartmentFilter.value); if (dept) d = d.filter(e => e.department === dept.name) }
  return d
})

const balanceTotalPages = computed(() => Math.ceil(filteredBalanceData.value.length / itemsPerPage))
const paginatedBalanceData = computed(() => filteredBalanceData.value.slice((balancePage.value - 1) * itemsPerPage, balancePage.value * itemsPerPage))

// Calendar days with return dates
const calendarDays = computed(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1), lastDay = new Date(calendarYear.value, calendarMonth.value + 1, 0), startWeek = firstDay.getDay()
  const days = [], today = new Date(); today.setHours(0,0,0,0)
  const approved = leaveRequests.value.filter(r => r.status === 'approved')
  const prevLast = new Date(calendarYear.value, calendarMonth.value, 0).getDate()
  for (let i = startWeek - 1; i >= 0; i--) days.push({ day: prevLast - i, isCurrentMonth: false, isToday: false, hasLeave: false, isReturnDay: false, leaves: [] })
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(calendarYear.value, calendarMonth.value, i), dateStr = date.toISOString().split('T')[0], isToday = date.toDateString() === today.toDateString()
    const dayLeaves = approved.filter(l => l.start_date <= dateStr && l.end_date >= dateStr)
    const isReturnDay = approved.some(l => l.return_date === dateStr)
    days.push({ day: i, isCurrentMonth: true, isToday: isToday, hasLeave: dayLeaves.length > 0, isReturnDay: isReturnDay, leaves: dayLeaves.map(l => ({ id: l.id, employee_name: l.employee_name, leave_type_name: l.leave_type_name, start_date: l.start_date, end_date: l.end_date, return_status: l.return_status })) })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) days.push({ day: i, isCurrentMonth: false, isToday: false, hasLeave: false, isReturnDay: false, leaves: [] })
  return days
})

// Methods
function formatDate(d) { return d ? new Date(d).toLocaleDateString() : '' }
function getInitials(n) { return n ? n.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '' }
function getMonthName(m) { return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] }
function getLeaveTypeClass(t) { const c = { 'Annual Leave': 'type-annual', 'Sick Leave': 'type-sick', 'Maternity Leave': 'type-maternity', 'Paternity Leave': 'type-paternity', 'Bereavement Leave': 'type-bereavement' }; return c[t] || 'type-default' }
function getBalanceStatusClass(a) { if (a <= 0) return 'text-danger'; if (a <= 5) return 'text-warning'; return 'text-success' }
function goToToday() { calendarMonth.value = new Date().getMonth(); calendarYear.value = new Date().getFullYear() }

function showTooltip(day, e) {
  if (day.hasLeave && day.leaves.length) {
    tooltipLeaves.value = day.leaves
    tooltipVisible.value = true
    const r = e.target.getBoundingClientRect()
    tooltipStyle.value = { top: `${r.top + window.scrollY - 10}px`, left: `${r.left + window.scrollX + 30}px`, transform: 'translateY(-100%)' }
  }
}
function hideTooltip() { tooltipVisible.value = false; tooltipLeaves.value = [] }
function refreshData() { loading.value = true; setTimeout(() => { loading.value = false }, 500) }

function openAddLeaveModal() { 
  newLeave.value = { employee_id: null, leave_type_id: null, start_date: '', end_date: '', reason: '', status: 'pending' }
  selectedEmployee.value = null; selectedLeaveType.value = null
  validationErrors.value = {}
  showAddLeaveModal.value = true 
}

function confirmAddLeave() {
  if (!validateForm()) {
    showToastMessage('Please fix validation errors', 'error')
    return
  }
  if (selectedLeaveType.value?.name === 'Annual Leave' && exceedsAnnualBalance.value) {
    showToastMessage(`Cannot request ${calculatedDays.value} days. Only ${getAnnualAvailable(selectedEmployee.value)} days available.`, 'error')
    return
  }
  
  // Check for overlapping or pending requests
  const hasPending = leaveRequests.value.some(r => r.employee_id === newLeave.value.employee_id && r.status === 'pending')
  if (hasPending) {
    showToastMessage('Employee has a pending leave request. Please resolve it first.', 'error')
    return
  }
  
  const overlapping = leaveRequests.value.some(r => r.employee_id === newLeave.value.employee_id && r.status === 'approved' && 
    datesOverlap(r.start_date, r.end_date, newLeave.value.start_date, newLeave.value.end_date))
  if (overlapping) {
    showToastMessage('Employee already has approved leave during this period.', 'error')
    return
  }
  
  const emp = employeeBalances.value.find(e => e.id === newLeave.value.employee_id)
  const type = leaveTypes.value.find(t => t.id === newLeave.value.leave_type_id)
  const total = calculateDays(newLeave.value.start_date, newLeave.value.end_date)
  const newId = Math.max(...leaveRequests.value.map(r => r.id), 0) + 1
  const returnDate = getReturnDate(newLeave.value.end_date)
  
  const req = { 
    id: newId, employee_id: emp.id, employee_name: emp.name, employee_code: emp.code, 
    department_name: emp.department, leave_type_id: type.id, leave_type_name: type.name, 
    start_date: newLeave.value.start_date, end_date: newLeave.value.end_date, return_date: returnDate,
    total_days: total, reason: newLeave.value.reason, status: newLeave.value.status, requested_date: new Date().toISOString().split('T')[0],
    return_status: newLeave.value.status === 'approved' ? 'on_leave' : null
  }
  if (newLeave.value.status === 'approved') { 
    req.approved_by = 'HR Manager'
    req.approved_date = new Date().toISOString().split('T')[0]
  }
  leaveRequests.value.unshift(req)
  showAddLeaveModal.value = false
  showToastMessage(`Leave added successfully for ${emp.name}!`, 'success')
  refreshData()
}

function datesOverlap(start1, end1, start2, end2) {
  return new Date(start1) <= new Date(end2) && new Date(end1) >= new Date(start2)
}

function exportReport() {
  const data = leaveRequests.value.map(request => ({
    'Request ID': request.id, 'Employee Name': request.employee_name, 'Employee Code': request.employee_code,
    'Department': request.department_name, 'Leave Type': request.leave_type_name,
    'Start Date': request.start_date, 'End Date': request.end_date, 'Return Date': request.return_date,
    'Total Days': request.total_days, 'Reason': request.reason, 'Status': request.status,
    'Requested Date': request.requested_date, 'Approved Date': request.approved_date || '',
    'Approved By': request.approved_by || '', 'Rejection Reason': request.rejection_reason || '',
    'Return Status': request.return_status || '', 'Actual Return Date': request.actual_return_date || ''
  }))
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  for (const row of data) {
    const values = headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`)
    csvRows.push(values.join(','))
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  showToastMessage('Report exported successfully to CSV!', 'success')
}

function exportBalanceReport() {
  const data = employeeBalances.value.map(emp => ({
    'Employee Name': emp.name, 'Employee Code': emp.code, 'Department': emp.department,
    'Hire Date': emp.hire_date, 'Years of Service': emp.years_of_service,
    'Annual Leave Total': emp.annual_total, 'Annual Leave Used': emp.annual_used,
    'Sick Leave Used': emp.sick_used, 'Maternity Leave Used': emp.maternity_used || 0,
    'Paternity Leave Used': emp.paternity_used || 0, 'Bereavement Leave Used': emp.bereavement_used || 0,
    'Unpaid Leave Used': emp.unpaid_used || 0, 'Annual Leave Available': emp.annual_total - emp.annual_used
  }))
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  for (const row of data) {
    const values = headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`)
    csvRows.push(values.join(','))
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `leave_balance_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  showToastMessage('Balance report exported successfully to CSV!', 'success')
}

onMounted(refreshData)
</script>

<style scoped>
/* Keep all existing styles and add these new ones */

.overdue-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon { font-size: 20px; }
.alert-message { flex: 1; color: #dc2626; font-weight: 500; }
.alert-btn { background: #dc2626; color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; }

.tab-badge.danger { background: #dc2626; color: white; }

.status-success { background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }
.status-warning { background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }
.status-danger { background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }
.status-info { background: #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }

.badge-danger { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.btn-primary-small { background: #3b82f6; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; }

.return-badge { position: absolute; bottom: 4px; right: 4px; background: #10b981; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; }

.return-date { color: #10b981; margin-top: 4px; }
.overdue-text { color: #dc2626; font-weight: 600; margin-top: 4px; }

.sick-days { font-size: 14px; font-weight: 600; color: #f59e0b; }
.sick-note { font-size: 10px; color: #94a3b8; font-style: italic; }

.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea { border-color: #ef4444; }
.error-text { font-size: 11px; color: #ef4444; margin-top: 4px; display: block; }

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  min-width: 300px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10000;
  animation: slideIn 0.3s ease-out;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.toast.success { border-left: 4px solid #10b981; }
.toast.error { border-left: 4px solid #ef4444; }
.toast.warning { border-left: 4px solid #f59e0b; }
.toast-icon { font-size: 18px; }
.toast-message { flex: 1; font-size: 13px; color: #1e293b; }
.toast-close { background: none; border: none; cursor: pointer; font-size: 14px; color: #94a3b8; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Calendar return day styling */
.calendar-day.return-day { background: #d1fae5; border-color: #10b981; position: relative; }
.calendar-day.return-day::before { content: '🔄'; position: absolute; top: 2px; right: 4px; font-size: 10px; opacity: 0.7; }

/* Enhanced tooltip */
.calendar-tooltip { min-width: 260px; }
.tooltip-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.tooltip-name { font-weight: 600; font-size: 13px; }
.tooltip-type { font-size: 10px; color: #94a3b8; }
.tooltip-dates { font-size: 11px; color: #cbd5e1; padding-left: 16px; }

/* Info boxes */
.info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; margin-bottom: 16px; }
.info-box.info-blue { background: #eff6ff; border-color: #bfdbfe; }
.info-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #166534; }
.info-box.info-blue .info-title { color: #1e40af; }
.info-value { font-size: 20px; font-weight: 700; color: #15803d; }
.warning-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 12px; margin-bottom: 16px; }
.warning-box.error-box { background: #fef2f2; border-color: #fecaca; }
.warning-box.error-box .info-title { color: #dc2626; }
.warning-box.error-box .info-value { color: #dc2626; }

.leave-management-hr {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon { font-size: 32px; }
.header-left h1 { font-size: 22px; font-weight: 600; color: #1e293b; margin: 0; }
.header-left p { font-size: 13px; color: #64748b; margin: 4px 0 0; }
.header-actions { display: flex; gap: 12px; }

.stats-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-value { font-size: 28px; font-weight: 700; color: #1e293b; }
.stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }

.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.tab-btn:hover { background: #f1f5f9; color: #1e293b; }
.tab-btn.active { background: #3b82f6; color: white; box-shadow: 0 2px 4px rgba(59,130,246,0.3); }
.tab-badge { background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px; font-size: 11px; margin-left: 4px; }

.section-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
}
.section-header h3 { font-size: 18px; font-weight: 600; margin: 0; }
.badge { background: #e0e7ff; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; }

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef2ff;
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
  width: 80%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}
.search-input:focus { outline: none; border-color: #3b82f6; }
.filter-select, .month-picker {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.compact-requests-grid { display: flex; flex-direction: column; gap: 10px; }
.compact-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}
.compact-card:hover { background: white; border-color: #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.compact-card-left { display: flex; align-items: center; gap: 12px; }
.compact-avatar {
  width: 40px; height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}
.compact-info { display: flex; flex-direction: column; gap: 2px; }
.compact-name { font-weight: 600; font-size: 14px; color: #1e293b; }
.compact-code { font-size: 11px; color: #64748b; }
.compact-dates { font-size: 12px; color: #475569; }
.compact-card-right { display: flex; align-items: center; gap: 16px; }
.compact-type { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.compact-actions { display: flex; gap: 6px; }
.btn-view-small {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  background: #e2e8f0;
  color: #475569;
}
.btn-view-small:hover { background: #cbd5e1; }

.btn-primary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: 6px; }
.btn-icon:hover { background: #f1f5f9; }
.btn-export-small { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }

.type-annual { background: #d1fae5; color: #059669; }
.type-sick { background: #fee2e2; color: #dc2626; }
.type-maternity { background: #fef3c7; color: #d97706; }
.type-paternity { background: #dbeafe; color: #2563eb; }
.type-bereavement { background: #f3e8ff; color: #9333ea; }

.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 12px 10px; background: #f8fafc; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
.data-table td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; }
.employee-code { font-size: 11px; color: #94a3b8; }
.text-center { text-align: center; }

.progress-bar-small { width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; display: inline-block; margin-right: 8px; }
.progress-fill { height: 100%; background: #10b981; border-radius: 3px; }

.balance-summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.balance-summary-card { background: #f8fafc; border-radius: 12px; padding: 16px; text-align: center; }
.summary-value { font-size: 28px; font-weight: 700; }
.summary-label { font-size: 12px; color: #64748b; margin-top: 4px; }
.balance-filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }

.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.month-nav, .today-btn { padding: 6px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; }
.calendar-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 8px; }
.weekday { padding: 8px; font-weight: 600; font-size: 12px; color: #64748b; }
.calendar-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.calendar-day { min-height: 80px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; position: relative; }
.calendar-day.other-month { background: #fafafa; color: #cbd5e1; }
.calendar-day.today { border-color: #3b82f6; background: #eff6ff; }
.calendar-day.has-leave { cursor: pointer; }
.day-number { font-size: 14px; font-weight: 500; }
.leave-count-badge { margin-top: 8px; text-align: center; background: #3b82f6; border-radius: 12px; padding: 2px 6px; display: inline-block; }
.count-number { color: white; font-size: 11px; font-weight: 600; }

.calendar-tooltip { position: fixed; background: #1e293b; color: white; border-radius: 8px; padding: 8px 12px; min-width: 150px; z-index: 1000; pointer-events: none; }
.tooltip-title { font-size: 11px; font-weight: 600; margin-bottom: 4px; }
.tooltip-item { display: flex; align-items: center; gap: 6px; padding: 2px 0; font-size: 11px; }
.tooltip-dot { width: 6px; height: 6px; border-radius: 50%; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; border-radius: 16px; width: 90%; max-width: 400px; overflow: visible; }
.modal-small { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eef2ff; }
.modal-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8; }
.modal-body-compact { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.modal-footer { padding: 16px 20px; border-top: 1px solid #eef2ff; display: flex; justify-content: flex-end; gap: 12px; }
.form-select, .form-input, .form-textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; }
.form-select:focus, .form-input:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eef2ff; }
.page-btn { padding: 4px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.text-green { color: #10b981; font-weight: 600; }
.text-orange { color: #f59e0b; font-weight: 600; }
.text-red { color: #ef4444; font-weight: 600; }
.text-purple { color: #8b5cf6; font-weight: 600; }
.text-blue { color: #3b82f6; font-weight: 600; }

.empty-state { text-align: center; padding: 40px; color: #94a3b8; }
.empty-icon { font-size: 48px; opacity: 0.5; display: block; margin-bottom: 12px; }

@media (max-width: 768px) {
  .leave-management-hr { padding: 12px; }
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .tabs-container { flex-direction: column; }
  .compact-card { flex-direction: column; align-items: flex-start; gap: 10px; }
  .compact-card-right { width: 100%; justify-content: space-between; }
  .filter-bar { flex-direction: column; }
  .search-wrapper { width: 100%; }
  .filter-select, .month-picker { width: 100%; }
}
</style>