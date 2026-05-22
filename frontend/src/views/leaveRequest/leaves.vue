


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

    <!-- Stats Cards -->
   <!-- Stats Cards - Use camelCase to match the fixed stats object -->
<div class="stats-cards">
  <div class="stat-card">
    <div class="stat-value">{{ stats.totalRequests || 0 }}</div>
    <div class="stat-label">Total Requests</div>
  </div>
  <div class="stat-card">
    <div class="stat-value text-orange">{{ stats.pendingRequests || 0 }}</div>
    <div class="stat-label">Pending</div>
  </div>
  <div class="stat-card">
    <div class="stat-value text-green">{{ stats.approvedRequests || 0 }}</div>
    <div class="stat-label">Approved</div>
  </div>
  <div class="stat-card">
    <div class="stat-value text-red">{{ stats.rejectedRequests || 0 }}</div>
    <div class="stat-label">Rejected</div>
  </div>
  <div class="stat-card">
    <div class="stat-value text-blue">{{ stats.employeesOnLeaveToday || 0 }}</div>
    <div class="stat-label">On Leave Today</div>
  </div>
  <div class="stat-card">
    <div class="stat-value text-purple">{{ stats.totalDaysRequested || 0 }}</div>
    <div class="stat-label">Total Days</div>
  </div>
</div>

    <!-- Overdue Returns Alert -->
   <div v-if="stats.overdueReturns > 0" class="overdue-alert">
  <span class="alert-icon">⚠️</span>
  <span class="alert-message">{{ stats.overdueReturns }} employee(s) have not returned from leave!</span>
  <button class="alert-btn" @click="activeTab = 'overdue'">View Details</button>
</div>
    <!-- Evenly Spaced Tabs -->
   <div class="tabs-container">
  <button class="tab-btn" :class="{ active: activeTab === 'pending' }" @click="switchTab('pending')">
    <span>⏳</span> Pending
    <span class="tab-badge" v-if="stats.pendingRequests > 0">{{ stats.pendingRequests }}</span>
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'approved' }" @click="switchTab('approved')">
    <span>✅</span> Approved
    <span class="tab-badge" v-if="stats.approvedRequests > 0">{{ stats.approvedRequests }}</span>
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'rejected' }" @click="switchTab('rejected')">
    <span>❌</span> Rejected
    <span class="tab-badge" v-if="stats.rejectedRequests > 0">{{ stats.rejectedRequests }}</span>
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'overdue' }" @click="switchTab('overdue')">
    <span>⚠️</span> Overdue
    <span class="tab-badge danger" v-if="stats.overdueReturns > 0">{{ stats.overdueReturns }}</span>
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'calendar' }" @click="switchTab('calendar')">
    <span>📅</span> Calendar
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'balance' }" @click="switchTab('balance')">
    <span>⚖️</span> Balance
  </button>
</div>

    <!-- ==================== PENDING TAB ==================== -->
    <div v-if="activeTab === 'pending'" class="section-container">
      <div class="section-header">
        <h3>⏳ Pending Approval</h3>
        <span class="badge">{{ pendingPagination.total }} requests waiting</span>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="pendingFilters.search" @input="debouncedLoadPending" placeholder="Search employee..." class="search-input" />
        </div>
        <select v-model="pendingFilters.department" @change="loadPendingRequests" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departmentsList" :key="dept.departmentId" :value="dept.departmentId">{{ dept.name }}</option>
        </select>
        <select v-model="pendingFilters.leaveType" @change="loadPendingRequests" class="filter-select">
          <option :value="null">All Leave Types</option>
          <option v-for="type in leaveTypesList" :key="type.leaveTypeId" :value="type.leaveTypeId">{{ type.name }}</option>
        </select>
      </div>

      <div v-if="loadingPending" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>Loading...</p>
      </div>

      <div v-else-if="pendingLeaveRequests.length === 0" class="empty-state">
        <span class="empty-icon">✅</span>
        <p>No pending requests</p>
      </div>

      <div v-else class="compact-requests-grid">
        <div v-for="request in pendingLeaveRequests" :key="request.leaveRequestId" class="compact-card">
          <div class="compact-card-left">
            <div class="compact-avatar">{{ getInitials(request.employee?.firstName + ' ' + request.employee?.lastName) }}</div>
            <div class="compact-info">
              <div class="compact-name">{{ request.employee?.firstName }} {{ request.employee?.lastName }}</div>
              <div class="compact-code">{{ request.employee?.employeeCode }} • {{ request.department?.name }}</div>
              <div class="compact-dates">📅 {{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }} ({{ request.totalDays }} days)</div>
            </div>
          </div>
          <div class="compact-card-right">
            <div class="compact-type" :class="getLeaveTypeClass(request.leaveTypeName)">{{ request.leaveTypeName }}</div>
            <div class="compact-actions">
              <button class="btn-view-small" @click="goToDetailPage(request.leaveRequestId)">👁️</button>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="pendingPagination.totalPages > 1">
        <button class="page-btn" :disabled="pendingPagination.page === 1" @click="changePendingPage(pendingPagination.page - 1)">←</button>
        <span>{{ pendingPagination.page }} / {{ pendingPagination.totalPages }}</span>
        <button class="page-btn" :disabled="pendingPagination.page === pendingPagination.totalPages" @click="changePendingPage(pendingPagination.page + 1)">→</button>
      </div>
    </div>

    <!-- ==================== APPROVED TAB ==================== -->
    <div v-if="activeTab === 'approved'" class="section-container">
      <div class="section-header">
        <h3>✅ Approved Requests</h3>
        <span class="badge">{{ approvedPagination.total }} records</span>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="approvedFilters.search" @input="debouncedLoadApproved" placeholder="Search employee..." class="search-input" />
        </div>
        <select v-model="approvedFilters.department" @change="loadApprovedRequests" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departmentsList" :key="dept.departmentId" :value="dept.departmentId">{{ dept.name }}</option>
        </select>
        <select v-model="approvedFilters.leaveType" @change="loadApprovedRequests" class="filter-select">
          <option :value="null">All Leave Types</option>
          <option v-for="type in leaveTypesList" :key="type.leaveTypeId" :value="type.leaveTypeId">{{ type.name }}</option>
        </select>
        <input type="month" v-model="approvedFilters.month" @change="loadApprovedRequests" class="month-picker" />
      </div>

      <div v-if="loadingApproved" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>Loading...</p>
      </div>

      <div v-else-if="filteredApprovedLeaveRequests.length === 0" class="empty-state">
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
            <tr v-for="request in filteredApprovedLeaveRequests" :key="request.leaveRequestId">
              <td>
                <strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong>
                <div class="employee-code">{{ request.employee?.employeeCode }}</div>
               </td>
              <td>{{ request.department?.name }}</td>
              <td>{{ request.leaveTypeName }}</td>
              <td>{{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}</td>
              <td class="text-center">{{ request.totalDays }}</td>
              <td class="text-center">
                <span :class="getReturnStatusClass(request)">
                  {{ getReturnStatusText(request) }}
                </span>
              </td>
              <td class="text-center">{{ formatDate(request.approvedDate) || formatDate(request.approved_at) || 'N/A' }}</td>
              <td class="text-center">
                <button class="btn-icon" @click="goToDetailPage(request.leaveRequestId)" title="View Details">👁️</button>
                <button v-if="!request.actualReturnDate && request.returnDate <= today" class="btn-icon confirm-return" @click="openReturnConfirmModalFromLeave(request)" title="Confirm Return">✅</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="approvedPagination.totalPages > 1">
        <button class="page-btn" :disabled="approvedPagination.page === 1" @click="changeApprovedPage(approvedPagination.page - 1)">←</button>
        <span>{{ approvedPagination.page }} / {{ approvedPagination.totalPages }}</span>
        <button class="page-btn" :disabled="approvedPagination.page === approvedPagination.totalPages" @click="changeApprovedPage(approvedPagination.page + 1)">→</button>
      </div>
    </div>

    <!-- ==================== REJECTED TAB ==================== -->
    <div v-if="activeTab === 'rejected'" class="section-container">
      <div class="section-header">
        <h3>❌ Rejected Requests</h3>
        <span class="badge">{{ rejectedPagination.total }} records</span>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="rejectedFilters.search" @input="debouncedLoadRejected" placeholder="Search employee..." class="search-input" />
        </div>
        <select v-model="rejectedFilters.department" @change="loadRejectedRequests" class="filter-select">
          <option :value="null">All Departments</option>
          <option v-for="dept in departmentsList" :key="dept.departmentId" :value="dept.departmentId">{{ dept.name }}</option>
        </select>
        <select v-model="rejectedFilters.leaveType" @change="loadRejectedRequests" class="filter-select">
          <option :value="null">All Leave Types</option>
          <option v-for="type in leaveTypesList" :key="type.leaveTypeId" :value="type.leaveTypeId">{{ type.name }}</option>
        </select>
        <input type="month" v-model="rejectedFilters.month" @change="loadRejectedRequests" class="month-picker" />
      </div>

      <div v-if="loadingRejected" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>Loading...</p>
      </div>

      <div v-else-if="filteredRejectedLeaveRequests.length === 0" class="empty-state">
        <span class="empty-icon">✅</span>
        <p>No rejected requests</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>Employee</th><th>Dept</th><th>Type</th><th>Period</th><th>Days</th><th>Rejected</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredRejectedLeaveRequests" :key="request.leaveRequestId">
              <td><strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong><div class="employee-code">{{ request.employee?.employeeCode }}</div></td>
              <td>{{ request.department?.name }}</td>
              <td>{{ request.leaveTypeName }}</td>
              <td>{{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}</td>
              <td class="text-center">{{ request.totalDays }}</td>
              <td class="text-center">{{ formatDate(request.rejectedDate) || formatDate(request.rejected_at) || 'N/A' }}</td>
              <td class="text-center"><button class="btn-icon" @click="goToDetailPage(request.leaveRequestId)">👁️</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="rejectedPagination.totalPages > 1">
        <button class="page-btn" :disabled="rejectedPagination.page === 1" @click="changeRejectedPage(rejectedPagination.page - 1)">←</button>
        <span>{{ rejectedPagination.page }} / {{ rejectedPagination.totalPages }}</span>
        <button class="page-btn" :disabled="rejectedPagination.page === rejectedPagination.totalPages" @click="changeRejectedPage(rejectedPagination.page + 1)">→</button>
      </div>
    </div>

    <!-- ==================== OVERDUE RETURNS TAB ==================== -->
    <div v-if="activeTab === 'overdue'" class="section-container">
      <div class="section-header">
        <h3>⚠️ Overdue Returns</h3>
        <span class="badge danger">{{ overdueReturnsList.length }} employees overdue</span>
      </div>

      <div v-if="loadingOverdue" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>Loading...</p>
      </div>

      <div v-else-if="overdueReturnsList.length === 0" class="empty-state">
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
              <th>Expected Return</th>
              <th>Days Overdue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in overdueReturnsList" :key="request.leaveRequestId">
              <td><strong>{{ request.employee?.firstName }} {{ request.employee?.lastName }}</strong><div class="employee-code">{{ request.employee?.employeeCode }}</div></td>
              <td>{{ request.department?.name }}</td>
              <td>{{ request.leaveTypeName }}</td>
              <td>{{ formatDate(request.endDate) }}</td>
              <td>{{ formatDate(request.returnDate) }}</td>
              <td class="text-center"><span class="badge-danger">{{ request.daysOverdue }} days</span></td>
              <td class="text-center">
                <button class="btn-primary-small" @click="openReturnConfirmModalFromOverdue(request)">✅ Confirm Return</button>
                <button class="btn-icon" @click="goToDetailPage(request.leaveRequestId)">👁️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== CALENDAR TAB ==================== -->
    <div v-if="activeTab === 'calendar'" class="section-container">
      <div class="calendar-header">
        <button class="month-nav" @click="changeMonth(-1)">←</button>
        <h3>{{ getMonthName(calendarMonth) }} {{ calendarYear }}</h3>
        <button class="month-nav" @click="changeMonth(1)">→</button>
        <button class="today-btn" @click="goToToday">Today</button>
      </div>
      
      <div v-if="loadingCalendar" class="loading-state">
        <span class="loading-icon">⏳</span>
        <p>Loading calendar...</p>
      </div>

      <div v-else class="calendar">
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
              'return-day': day.returnCount > 0
            }"
            @mouseenter="showTooltip(day, $event)" 
            @mouseleave="hideTooltip"
          >
            <span class="day-number">{{ day.day }}</span>
            <div v-if="day.hasLeave" class="leave-count-badge">
              <span class="count-number">{{ day.leaves.length }}</span>
              <span class="count-text">on leave</span>
            </div>
            <div v-if="day.returnCount > 0" class="return-count-badge">
              <span class="count-number">{{ day.returnCount }}</span>
              <span class="count-text">returning</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="tooltipVisible" class="calendar-tooltip" :style="tooltipStyle">
        <div class="tooltip-title">📋 Information:</div>
        <div class="tooltip-list">
          <div v-if="tooltipLeaves.length > 0" class="tooltip-section">
            <div class="tooltip-subtitle">On Leave:</div>
            <div v-for="leave in tooltipLeaves" :key="'leave-'+leave.id" class="tooltip-item">
              <span class="tooltip-dot" :class="getLeaveTypeClass(leave.leaveTypeName)"></span>
              <span class="tooltip-name">{{ leave.employeeName }}</span>
              <span class="tooltip-type">({{ leave.leaveTypeName }})</span>
            </div>
          </div>
          <div v-if="tooltipReturns.length > 0" class="tooltip-section">
            <div class="tooltip-subtitle">Returning:</div>
            <div v-for="ret in tooltipReturns" :key="'return-'+ret.id" class="tooltip-item">
              <span class="tooltip-dot return-dot"></span>
              <span class="tooltip-name">{{ ret.employeeName }}</span>
              <span class="tooltip-type">(from {{ ret.leaveTypeName }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== BALANCE TAB ==================== -->
   <!-- ==================== BALANCE TAB ==================== -->
<div v-if="activeTab === 'balance'" class="section-container">
  <div class="section-header">
    <h3>⚖️ Annual Leave Balance</h3>
    <button class="btn-export-small" @click="exportBalanceReport">📊 Export CSV</button>
  </div>

  <div class="balance-summary-cards">
    <div class="balance-summary-card">
      <div class="summary-value">{{ totalBalanceStats.total_employees }}</div>
      <div class="summary-label">Employees</div>
    </div>
    <div class="balance-summary-card">
      <div class="summary-value text-green">{{ totalBalanceStats.avg_available_days }}</div>
      <div class="summary-label">Avg Available Days</div>
    </div>
    <div class="balance-summary-card">
      <div class="summary-value text-orange">{{ totalBalanceStats.total_used_days }}</div>
      <div class="summary-label">Total Used Days</div>
    </div>
    <div class="balance-summary-card">
      <div class="summary-value text-red">{{ totalBalanceStats.employees_low_balance }}</div>
      <div class="summary-label">Low Balance (<5 days)</div>
    </div>
  </div>

  <div class="balance-filters">
    <input type="text" v-model="balanceSearch" @input="debouncedLoadBalance" placeholder="Search employee..." class="search-input" />
    <select v-model="balanceDepartmentFilter" @change="loadBalanceData" class="filter-select">
      <option :value="null">All Departments</option>
      <option v-for="dept in departmentsList" :key="dept.departmentId" :value="dept.departmentId">{{ dept.name }}</option>
    </select>
  </div>

  <div v-if="loadingBalance" class="loading-state">
    <span class="loading-icon">⏳</span>
    <p>Loading balance data...</p>
  </div>

  <div v-else class="table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Employee</th>
          <th>Dept</th>
          <th>Annual Leave Usage</th>
          <th>Available Days</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="emp in paginatedBalanceData" :key="emp.employeeId">
          <td>
            <strong>{{ emp.name }}</strong>
            <div class="employee-code">{{ emp.code }}</div>
          </td>
          <td>{{ emp.department }}</td>
          <td>
            <div class="progress-container">
              <div class="progress-label">{{ emp.usedDays }}/{{ emp.totalDays }} days used</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getUsagePercentage(emp) + '%' }"></div>
              </div>
              <div v-if="emp.carriedOver > 0" class="carried-over-info">
                <small>📦 {{ emp.carriedOver }} days carried over</small>
              </div>
              <div class="entitlement-info">
                <small>🏷️ Annual entitlement: {{ emp.yearlyEntitlement }} days/year</small>
              </div>
            </div>
          </td>
          <td class="text-center">
            <span :class="getBalanceStatusClass(emp.availableDays)">
              {{ emp.availableDays }} days
            </span>
          </td>
          <td class="text-center">
            <span :class="getEmployeeStatusClass(emp.availableDays)">
              {{ getEmployeeStatus(emp.availableDays) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="pagination" v-if="balanceTotalPages > 1">
    <button class="page-btn" :disabled="balancePage === 1" @click="changeBalancePage(balancePage - 1)">←</button>
    <span>{{ balancePage }} / {{ balanceTotalPages }}</span>
    <button class="page-btn" :disabled="balancePage === balanceTotalPages" @click="changeBalancePage(balancePage + 1)">→</button>
  </div>
</div>

  <!-- Add Leave Modal -->
<div v-if="showAddLeaveModal" class="modal-overlay" @click.self="showAddLeaveModal = false">
  <div class="modal-content modal-fixed">
    <div class="modal-header">
      <h3>➕ Add Leave</h3>
      <button class="close-btn" @click="closeAddModal">✕</button>
    </div>
    <div class="modal-body-fixed">
      <div class="form-group" :class="{ 'has-error': formSubmitted && validationErrors.employeeId }">
        <label>Employee <span class="required">*</span></label>
        <select v-model="newLeave.employeeId" @change="onEmployeeChange" class="form-select">
          <option :value="null">Select Employee</option>
          <option v-for="emp in employeesList" :key="emp.id" :value="emp.id">
            {{ getEmployeeDisplayName(emp) }}
          </option>
        </select>
        <span class="error-text" v-if="formSubmitted && validationErrors.employeeId">{{ validationErrors.employeeId }}</span>
      </div>
      
      <!-- rest of the modal remains the same -->
      <div class="form-group" :class="{ 'has-error': formSubmitted && validationErrors.leaveTypeId }">
        <label>Leave Type <span class="required">*</span></label>
        <select v-model="newLeave.leaveTypeId" @change="onLeaveTypeChange" class="form-select">
          <option :value="null">Select Type</option>
          <option v-for="type in leaveTypesList" :key="type.leaveTypeId" :value="type.leaveTypeId">{{ type.name }}</option>
        </select>
        <span class="error-text" v-if="formSubmitted && validationErrors.leaveTypeId">{{ validationErrors.leaveTypeId }}</span>
      </div>
      
      <!-- Annual Leave Balance Info -->
      <div v-if="selectedLeaveType?.name === 'Annual Leave' && selectedEmployee" class="info-box-compact">
        <span class="info-icon">📊</span>
        <span class="info-text">Available: <strong>{{ getAnnualAvailable(selectedEmployee) }} days</strong></span>
      </div>
      
      <!-- Fixed Leave Info -->
      <div v-if="isFixedLeave && selectedLeaveType" class="info-box-compact info-blue">
        <span class="info-icon">📅</span>
        <span class="info-text">{{ selectedLeaveType.name }}: <strong>{{ selectedLeaveType.defaultDays }} days</strong> fixed</span>
      </div>
      
      <div class="form-row">
        <div class="form-group half" :class="{ 'has-error': formSubmitted && validationErrors.startDate }">
          <label>Start Date <span class="required">*</span></label>
          <input type="date" v-model="newLeave.startDate" @change="onStartDateChange" class="form-input" />
          <span class="error-text" v-if="formSubmitted && validationErrors.startDate">{{ validationErrors.startDate }}</span>
        </div>
        <div class="form-group half" :class="{ 'has-error': formSubmitted && validationErrors.endDate }">
          <label>End Date <span class="required">*</span></label>
          <input type="date" v-model="newLeave.endDate" @change="validateDates" class="form-input" :readonly="isFixedLeave" />
          <span class="error-text" v-if="formSubmitted && validationErrors.endDate">{{ validationErrors.endDate }}</span>
        </div>
      </div>
      
      <div class="form-group" :class="{ 'has-error': formSubmitted && validationErrors.reason }">
        <label>Reason <span class="required">*</span></label>
        <textarea v-model="newLeave.reason" rows="2" placeholder="Enter reason for leave..." class="form-textarea"></textarea>
        <span class="error-text" v-if="formSubmitted && validationErrors.reason">{{ validationErrors.reason }}</span>
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
      <button class="btn-secondary" @click="closeAddModal">Cancel</button>
      <button class="btn-primary" @click="confirmAddLeave">Add Leave</button>
    </div>
  </div>
</div>

    <!-- Return Confirmation Modal -->
    <div v-if="showReturnConfirmModal" class="modal-overlay" @click.self="showReturnConfirmModal = false">
      <div class="modal-content return-modal">
        <div class="modal-header">
          <h3>✅ Confirm Employee Return</h3>
          <button class="close-btn" @click="showReturnConfirmModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="return-info">
            <div class="return-icon">🔄</div>
            <div class="return-details">
              <p><strong>{{ returnConfirmEmployee?.employee?.firstName }} {{ returnConfirmEmployee?.employee?.lastName }}</strong> ({{ returnConfirmEmployee?.employee?.employeeCode }})</p>
              <p class="return-period">{{ returnConfirmEmployee?.leaveTypeName }} • {{ formatDate(returnConfirmEmployee?.startDate) }} - {{ formatDate(returnConfirmEmployee?.endDate) }}</p>
            </div>
          </div>
          <div class="return-dates">
            <div class="date-box">
              <label>Expected Return</label>
              <div class="date-value">{{ formatDate(returnConfirmEmployee?.returnDate) }}</div>
            </div>
            <div class="date-arrow">→</div>
            <div class="date-box">
              <label>Actual Return</label>
              <input type="date" v-model="actualReturnDate" class="form-input" :max="today" />
            </div>
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
import leaveService from '@/stores/leaveService'
import employeeService from '@/stores/employee'

const router = useRouter()

// State
const loading = ref(false)
const loadingPending = ref(false)
const loadingApproved = ref(false)
const loadingRejected = ref(false)
const loadingOverdue = ref(false)
const loadingCalendar = ref(false)
const loadingBalance = ref(false)
const activeTab = ref('pending')
const formSubmitted = ref(false)
const today = new Date().toISOString().split('T')[0]

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

// Data lists
const departmentsList = ref([])
const leaveTypesList = ref([])
const employeesList = ref([])
const employeeBalances = ref({})

// Pagination state for each tab
const pendingPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
const approvedPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })
const rejectedPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 })

// Data arrays
const pendingLeaveRequests = ref([])
const approvedLeaveRequests = ref([])
const rejectedLeaveRequests = ref([])
const overdueReturnsList = ref([])
const calendarData = ref([])

// Filters
const pendingFilters = ref({ search: '', department: null, leaveType: null })
const approvedFilters = ref({ search: '', department: null, leaveType: null, month: new Date().toISOString().slice(0, 7) })
const rejectedFilters = ref({ search: '', department: null, leaveType: null, month: new Date().toISOString().slice(0, 7) })

// Balance filters
const balanceSearch = ref('')
const balanceDepartmentFilter = ref(null)
const balancePage = ref(1)
const balanceData = ref([])
const balanceTotalPages = ref(1)
const itemsPerPage = 10

// Calendar
const calendarMonth = ref(new Date().getMonth())
const calendarYear = ref(new Date().getFullYear())
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Tooltip
const tooltipVisible = ref(false)
const tooltipLeaves = ref([])
const tooltipReturns = ref([])
const tooltipStyle = ref({})

// Modal
const showAddLeaveModal = ref(false)

// New Leave Form
const newLeave = ref({ 
  employeeId: null,
  leaveTypeId: null, 
  startDate: '', 
  endDate: '', 
  reason: '', 
  status: 'pending' 
})
const selectedEmployee = ref(null)
const selectedLeaveType = ref(null)

// Stats - FIXED: Use camelCase to match API
const stats = ref({
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  employeesOnLeaveToday: 0,
  totalDaysRequested: 0,
  departmentsWithLeave: 0,
  overdueReturns: 0
})

// Debounce function
let debounceTimeout
function debounce(func, delay = 500) {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(func, delay)
}


// Helper function to get employee display name with department and code

function getEmployeeDisplayName(emp) {
  const fullName = `${emp.firstName} ${emp.lastName}`.trim()
  
  // Get department name - available as departmentName directly
  const departmentName = emp.departmentName || 'No Dept'
  
  // Get employee code - it's actually called employeeId in your API response
  const employeeCode = emp.employeeId || emp.employeeCode || emp.code || 'No Code'
  
  return `${fullName} (${departmentName} / ${employeeCode})`
}

const debouncedLoadPending = () => debounce(() => loadPendingRequests())
const debouncedLoadApproved = () => debounce(() => loadApprovedRequests())
const debouncedLoadRejected = () => debounce(() => loadRejectedRequests())
const debouncedLoadBalance = () => debounce(() => loadBalanceData())

// ==================== API CALLS ====================

async function loadPendingRequests() {
  loadingPending.value = true
  try {
    const params = {
      status: 'pending',
      page: pendingPagination.value.page,
      limit: pendingPagination.value.limit,
      search: pendingFilters.value.search || undefined,
      departmentId: pendingFilters.value.department || undefined,
      leaveTypeId: pendingFilters.value.leaveType || undefined
    }
    const result = await leaveService.getLeaveRequests(params)
    if (result.success) {
      pendingLeaveRequests.value = result.data
      pendingPagination.value = {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }
    }
  } catch (error) {
    console.error('Error loading pending requests:', error)
  } finally {
    loadingPending.value = false
  }
}

async function loadApprovedRequests() {
  loadingApproved.value = true
  try {
    const params = {
      status: 'approved',
      page: approvedPagination.value.page,
      limit: approvedPagination.value.limit,
      search: approvedFilters.value.search || undefined,
      departmentId: approvedFilters.value.department || undefined,
      leaveTypeId: approvedFilters.value.leaveType || undefined
    }
    
    // Add month filter if present
    if (approvedFilters.value.month) {
      const [year, month] = approvedFilters.value.month.split('-')
      params.startDate = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      params.endDate = `${year}-${month}-${lastDay}`
    }
    
    const result = await leaveService.getLeaveRequests(params)
    if (result.success) {
      // FIXED: Map the data to ensure approvedDate is available
      approvedLeaveRequests.value = result.data.map(request => ({
        ...request,
        // Ensure approvedDate is set from either field
        approvedDate: request.approvedDate || request.approved_at || request.approvedAt || null,
        // Also map other date fields consistently
        rejectedDate: request.rejectedDate || request.rejected_at || request.rejectedAt || null,
        requestedDate: request.requestedDate || request.requested_at || request.requestedAt || null
      }))
      
      approvedPagination.value = {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }
      
      // Debug: Log first request to see structure
      if (approvedLeaveRequests.value.length > 0) {
        console.log('Sample approved request:', approvedLeaveRequests.value[0])
        console.log('Approved date field:', approvedLeaveRequests.value[0].approvedDate)
      }
    }
  } catch (error) {
    console.error('Error loading approved requests:', error)
  } finally {
    loadingApproved.value = false
  }
}



async function loadRejectedRequests() {
  loadingRejected.value = true
  try {
    const params = {
      status: 'rejected',
      page: rejectedPagination.value.page,
      limit: rejectedPagination.value.limit,
      search: rejectedFilters.value.search || undefined,
      departmentId: rejectedFilters.value.department || undefined,
      leaveTypeId: rejectedFilters.value.leaveType || undefined
    }
    
    // Add month filter if present
    if (rejectedFilters.value.month) {
      const [year, month] = rejectedFilters.value.month.split('-')
      params.startDate = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      params.endDate = `${year}-${month}-${lastDay}`
    }
    
    const result = await leaveService.getLeaveRequests(params)
    if (result.success) {
      // FIXED: Map the data to ensure rejectedDate is available
      rejectedLeaveRequests.value = result.data.map(request => ({
        ...request,
        approvedDate: request.approvedDate || request.approved_at || request.approvedAt || null,
        rejectedDate: request.rejectedDate || request.rejected_at || request.rejectedAt || null,
        requestedDate: request.requestedDate || request.requested_at || request.requestedAt || null
      }))
      
      rejectedPagination.value = {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages
      }
    }
  } catch (error) {
    console.error('Error loading rejected requests:', error)
  } finally {
    loadingRejected.value = false
  }
}

async function loadOverdueReturns() {
  loadingOverdue.value = true
  try {
    const result = await leaveService.getOverdueReturns()
    if (result.success) {
      overdueReturnsList.value = result.data || []
    }
  } catch (error) {
    console.error('Error loading overdue returns:', error)
  } finally {
    loadingOverdue.value = false
  }
}

async function loadCalendarData() {
  loadingCalendar.value = true
  try {
    const result = await leaveService.getCalendarData(calendarYear.value, calendarMonth.value + 1)
    if (result.success) {
      calendarData.value = result.data || []
    }
  } catch (error) {
    console.error('Error loading calendar data:', error)
  } finally {
    loadingCalendar.value = false
  }
}

async function loadBalanceData() {
  loadingBalance.value = true
  try {
    // Fetch all employees with filters
    const params = {
      limit: 100,
      search: balanceSearch.value || undefined,
      departmentId: balanceDepartmentFilter.value || undefined
    }
    const result = await employeeService.getEmployees(params)
    if (result.success) {
      const employees = result.data
      
      // Fetch balance for each employee
      const balances = await Promise.all(
        employees.map(async (emp) => {
          try {
            const balanceResult = await leaveService.getEmployeeBalance(emp.id, new Date().getFullYear())
            console.log(`Employee ${emp.firstName} ${emp.lastName}:`, {
              employeeData: emp,
              balanceData: balanceResult.data
            })
            
            // FIXED: Get department name from employee data
            let departmentName = 'N/A'
            if (emp.department) {
              // If department is an object with name property
              departmentName = emp.department.name || emp.department.departmentName || 'N/A'
            } else if (emp.departmentId) {
              // If we have departmentId but no department object, try to find it from departmentsList
              const foundDept = departmentsList.value.find(d => d.departmentId === emp.departmentId)
              departmentName = foundDept ? foundDept.name : 'N/A'
            } else if (emp.Department) {
              // Alternative property name
              departmentName = emp.Department.name || 'N/A'
            }
            
            if (balanceResult.success && balanceResult.data) {
              const data = balanceResult.data
              return {
                employeeId: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                code: emp.employeeCode,
                department: departmentName,
                totalDays: data.totalAccrued || data.currentPeriodAccrued || 0,
                usedDays: data.totalUsed || data.currentPeriodUsed || 0,
                availableDays: data.availableDays || 0,
                yearlyEntitlement: data.currentPeriodEntitlement || 0,
                carriedOver: data.carryOverDetails?.reduce((sum, detail) => sum + detail.carriedOver, 0) || 0,
                currentPeriodUsed: data.currentPeriodUsed,
                currentPeriodAccrued: data.currentPeriodAccrued
              }
            }
          } catch (err) {
            console.error(`Error fetching balance for employee ${emp.id}:`, err)
          }
          // Return default if fetch fails
          let departmentName = 'N/A'
          if (emp.department) {
            departmentName = emp.department.name || 'N/A'
          } else if (emp.departmentId) {
            const foundDept = departmentsList.value.find(d => d.departmentId === emp.departmentId)
            departmentName = foundDept ? foundDept.name : 'N/A'
          }
          
          return {
            employeeId: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            code: emp.employeeCode,
            department: departmentName,
            totalDays: 0,
            usedDays: 0,
            availableDays: 0,
            yearlyEntitlement: 0,
            carriedOver: 0
          }
        })
      )
      balanceData.value = balances
      balanceTotalPages.value = Math.ceil(balanceData.value.length / itemsPerPage)
      
      console.log('Final balance data with departments:', balanceData.value)
    }
  } catch (error) {
    console.error('Error loading balance data:', error)
    showToastMessage('Failed to load balance data', 'error')
  } finally {
    loadingBalance.value = false
  }
}

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

async function loadEmployees() {
  try {
    const result = await employeeService.getEmployees({ limit: 100 })
    if (result.success) {
      console.log('Employees loaded:', result.data)
      // Log first employee to see structure
      if (result.data && result.data.length > 0) {
        // console.log('First employee structure:', JSON.stringify(result.data[0], null, 2))
      }
      employeesList.value = result.data
      
      // Also populate employeeBalances for quick lookup
      for (const emp of result.data) {
        try {
          const balanceResult = await leaveService.getEmployeeBalance(emp.id, new Date().getFullYear())
          if (balanceResult.success) {
            employeeBalances.value[emp.id] = balanceResult.data
          }
        } catch (err) {
          console.error(`Error loading balance for ${emp.id}:`, err)
        }
      }
    }
  } catch (error) {
    console.error('Error loading employees:', error)
  }
}

async function loadDashboardStats() {
  try {
    const result = await leaveService.getDashboardStats()
    if (result.success && result.data) {
      // FIXED: Map the API response correctly
      stats.value = {
        totalRequests: result.data.totalRequests || 0,
        pendingRequests: result.data.pendingRequests || 0,
        approvedRequests: result.data.approvedRequests || 0,
        rejectedRequests: result.data.rejectedRequests || 0,
        employeesOnLeaveToday: result.data.employeesOnLeaveToday || 0,
        totalDaysRequested: result.data.totalDaysRequested || 0,
        departmentsWithLeave: result.data.departmentsWithLeave || 0,
        overdueReturns: result.data.overdueReturns || 0
      }
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
  }
}

// ==================== COMPUTED ====================

const filteredApprovedLeaveRequests = computed(() => approvedLeaveRequests.value)
const filteredRejectedLeaveRequests = computed(() => rejectedLeaveRequests.value)

const totalBalanceStats = computed(() => {
  const totalAvailable = balanceData.value.reduce((sum, b) => sum + (b.availableDays || 0), 0)
  const totalUsed = balanceData.value.reduce((sum, b) => sum + (b.usedDays || 0), 0)
  const totalAllocated = balanceData.value.reduce((sum, b) => sum + (b.totalDays || 0), 0)
  const lowBalanceCount = balanceData.value.filter(b => (b.availableDays || 0) <= 5).length
  
  return {
    total_employees: balanceData.value.length,
    avg_available_days: balanceData.value.length > 0 
      ? (totalAvailable / balanceData.value.length).toFixed(1)
      : 'N/A',
    total_used_days: totalUsed,
    total_allocated_days: totalAllocated,
    employees_low_balance: lowBalanceCount
  }
})

const paginatedBalanceData = computed(() => {
  const start = (balancePage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return balanceData.value.slice(start, end)
})

// Calendar days with hover data
const calendarDays = computed(() => {
  const firstDay = new Date(calendarYear.value, calendarMonth.value, 1)
  const lastDay = new Date(calendarYear.value, calendarMonth.value + 1, 0)
  const startWeek = firstDay.getDay()
  const days = []
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  const prevLast = new Date(calendarYear.value, calendarMonth.value, 0).getDate()
  for (let i = startWeek - 1; i >= 0; i--) {
    days.push({ day: prevLast - i, isCurrentMonth: false, isToday: false, hasLeave: false, returnCount: 0, leaves: [], returns: [] })
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(calendarYear.value, calendarMonth.value, i)
    const dateStr = date.toISOString().split('T')[0]
    const isToday = date.toDateString() === currentDate.toDateString()
    
    const dayLeaves = calendarData.value.filter(l => l.startDate <= dateStr && l.endDate >= dateStr)
    const dayReturns = calendarData.value.filter(l => l.returnDate === dateStr && !l.actualReturnDate)
    
    days.push({
      day: i,
      isCurrentMonth: true,
      isToday: isToday,
      hasLeave: dayLeaves.length > 0,
      returnCount: dayReturns.length,
      leaves: dayLeaves.map(l => ({ 
        id: l.leaveRequestId, 
        employeeName: `${l.employee?.firstName} ${l.employee?.lastName}`,
        leaveTypeName: l.leaveTypeName 
      })),
      returns: dayReturns.map(l => ({ 
        id: l.leaveRequestId, 
        employeeName: `${l.employee?.firstName} ${l.employee?.lastName}`,
        leaveTypeName: l.leaveTypeName 
      }))
    })
  }
  
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false, isToday: false, hasLeave: false, returnCount: 0, leaves: [], returns: [] })
  }
  return days
})

// ==================== HELPER FUNCTIONS ====================

function switchTab(tab) {
  activeTab.value = tab
  // Reset pagination when switching tabs
  if (tab === 'pending') {
    pendingPagination.value.page = 1
    loadPendingRequests()
  } else if (tab === 'approved') {
    approvedPagination.value.page = 1
    loadApprovedRequests()
  } else if (tab === 'rejected') {
    rejectedPagination.value.page = 1
    loadRejectedRequests()
  } else if (tab === 'overdue') {
    loadOverdueReturns()
  } else if (tab === 'calendar') {
    loadCalendarData()
  } else if (tab === 'balance') {
    balancePage.value = 1
    loadBalanceData()
  }
}

function changePendingPage(page) {
  pendingPagination.value.page = page
  loadPendingRequests()
}

function changeApprovedPage(page) {
  approvedPagination.value.page = page
  loadApprovedRequests()
}

function changeRejectedPage(page) {
  rejectedPagination.value.page = page
  loadRejectedRequests()
}

function changeBalancePage(page) {
  balancePage.value = page
}

function changeMonth(delta) {
  let newMonth = calendarMonth.value + delta
  let newYear = calendarYear.value
  if (newMonth < 0) {
    newMonth = 11
    newYear--
  } else if (newMonth > 11) {
    newMonth = 0
    newYear++
  }
  calendarMonth.value = newMonth
  calendarYear.value = newYear
  loadCalendarData()
}

function goToToday() {
  calendarMonth.value = new Date().getMonth()
  calendarYear.value = new Date().getFullYear()
  loadCalendarData()
}

function showTooltip(day, e) {
  if ((day.leaves && day.leaves.length > 0) || (day.returns && day.returns.length > 0)) {
    tooltipLeaves.value = day.leaves || []
    tooltipReturns.value = day.returns || []
    tooltipVisible.value = true
    const rect = e.target.getBoundingClientRect()
    tooltipStyle.value = { 
      top: `${rect.top + window.scrollY - 10}px`, 
      left: `${rect.left + window.scrollX + 30}px`, 
      transform: 'translateY(-100%)' 
    }
  }
}

function hideTooltip() { 
  tooltipVisible.value = false
  tooltipLeaves.value = []
  tooltipReturns.value = []
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate), end = new Date(endDate)
  return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1
}

function getReturnDate(endDate) {
  if (!endDate) return ''
  const date = new Date(endDate)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    // Handle different date formats
    let date
    if (typeof dateStr === 'string') {
      // Try parsing the string directly
      date = new Date(dateStr)
    } else if (dateStr instanceof Date) {
      date = dateStr
    } else if (typeof dateStr === 'number') {
      date = new Date(dateStr)
    } else {
      return 'N/A'
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A'
    
    // Format as MM/DD/YYYY or your preferred format
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateStr)
    return 'N/A'
  }
}


function formatApprovedDate(request) {
  // Try multiple possible field names
  const dateValue = request.approvedDate || request.approved_at || request.approvedAt || request.approved_date || null
  
  if (!dateValue) {
    console.log('No approved date found for request:', request.leaveRequestId, 'Keys:', Object.keys(request))
    return 'N/A'
  }
  
  return formatDate(dateValue)
}


function getInitials(name) {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getMonthName(month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month]
}

function getLeaveTypeClass(type) {
  const classes = {
    'Annual Leave': 'type-annual',
    'Sick Leave': 'type-sick',
    'Maternity Leave': 'type-maternity',
    'Paternity Leave': 'type-paternity',
    'Bereavement Leave': 'type-bereavement'
  }
  return classes[type] || 'type-default'
}

function getBalanceStatusClass(available) {
  if (available <= 0) return 'text-danger'
  if (available <= 5) return 'text-warning'
  return 'text-success'
}

function getEmployeeStatusClass(available) {
  if (available <= 0) return 'status-danger'
  if (available <= 5) return 'status-warning'
  return 'status-success'
}

function getEmployeeStatus(available) {
  if (available <= 0) return 'Exhausted'
  if (available <= 5) return 'Low Balance'
  return 'Good'
}

function getUsagePercentage(emp) {
  // If no total days, return 0
  if (!emp.totalDays || emp.totalDays === 0) return 0
  // Calculate percentage based on used vs total accrued
  const percentage = (emp.usedDays / emp.totalDays) * 100
  return Math.min(100, percentage)
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
      return `Returned ${daysLate} days late`
    }
    return 'Returned on time'
  }
  const currentDate = new Date()
  const returnDate = new Date(request.returnDate)
  if (currentDate > returnDate) {
    const daysOverdue = Math.ceil((currentDate - returnDate) / (1000 * 60 * 60 * 24))
    return `Overdue by ${daysOverdue} days`
  }
  if (currentDate.toDateString() === returnDate.toDateString()) return 'Expected today'
  return `Returns ${formatDate(request.returnDate)}`
}

function getAnnualAvailable(employee) {
  if (!employee) return 0
  const balance = employeeBalances.value[employee.id || employee.employeeId]
  return balance?.availableDays || 0
}

function refreshData() {
  loadDashboardStats()
  if (activeTab.value === 'pending') loadPendingRequests()
  else if (activeTab.value === 'approved') loadApprovedRequests()
  else if (activeTab.value === 'rejected') loadRejectedRequests()
  else if (activeTab.value === 'overdue') loadOverdueReturns()
  else if (activeTab.value === 'calendar') loadCalendarData()
  else if (activeTab.value === 'balance') loadBalanceData()
}

function goToDetailPage(leaveId) {
  router.push(`/leave-detail/${leaveId}`)
}

// ==================== EXPORT FUNCTIONS ====================

async function exportReport() {
  try {
    const result = await leaveService.exportToCSV()
    if (result.success && result.data) {
      // Convert to CSV
      const headers = ['Request ID', 'Employee', 'Employee Code', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Requested Date', 'Approved Date']
      const csvRows = [headers.join(',')]
      
      for (const row of result.data) {
        const values = headers.map(header => {
          const value = row[header] || ''
          const escaped = String(value).replace(/"/g, '""')
          return escaped.includes(',') ? `"${escaped}"` : escaped
        })
        csvRows.push(values.join(','))
      }
      
      // Download file
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      showToastMessage('Export successful', 'success')
    } else {
      showToastMessage('Export failed: ' + (result.error || 'Unknown error'), 'error')
    }
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export data', 'error')
  }
}

async function exportBalanceReport() {
  try {
    const headers = ['Employee Name', 'Employee Code', 'Department', 'Total Annual Days', 'Used Days', 'Available Days', 'Status']
    const csvRows = [headers.join(',')]
    
    for (const emp of balanceData.value) {
      const status = getEmployeeStatus(emp.availableDays)
      const row = [
        `"${emp.name}"`,
        `"${emp.code}"`,
        `"${emp.department}"`,
        emp.totalDays,
        emp.usedDays,
        emp.availableDays,
        `"${status}"`
      ]
      csvRows.push(row.join(','))
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leave_balance_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showToastMessage('Export successful', 'success')
  } catch (error) {
    console.error('Export error:', error)
    showToastMessage('Failed to export balance data', 'error')
  }
}

// ==================== LEAVE FORM VALIDATION ====================

function validateForm() {
  const errors = {}
  
  if (!newLeave.value.employeeId) errors.employeeId = 'Please select an employee'
  if (!newLeave.value.leaveTypeId) errors.leaveTypeId = 'Please select a leave type'
  
  if (!newLeave.value.startDate) {
    errors.startDate = 'Please select a start date'
  } else {
    const startDate = new Date(newLeave.value.startDate)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    if (startDate < todayDate) errors.startDate = 'Start date cannot be in the past'
  }
  
  if (!newLeave.value.endDate) {
    errors.endDate = 'Please select an end date'
  } else if (newLeave.value.startDate) {
    const start = new Date(newLeave.value.startDate)
    const end = new Date(newLeave.value.endDate)
    if (end < start) errors.endDate = 'End date cannot be before start date'
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
  if (formSubmitted.value) validateForm()
}

function onStartDateChange() {
  if (isFixedLeave.value && selectedLeaveType.value && newLeave.value.startDate) {
    calculateEndDateForFixedLeave()
  }
  validateDates()
}

const calculatedDays = computed(() => newLeave.value.startDate && newLeave.value.endDate ? calculateDays(newLeave.value.startDate, newLeave.value.endDate) : 0)

const isFixedLeave = computed(() => selectedLeaveType?.value && ['Maternity Leave', 'Paternity Leave', 'Bereavement Leave'].includes(selectedLeaveType.value.name))

function calculateEndDateForFixedLeave() {
  if (isFixedLeave.value && selectedLeaveType.value && newLeave.value.startDate) {
    const start = new Date(newLeave.value.startDate)
    start.setDate(start.getDate() + selectedLeaveType.value.defaultDays - 1)
    newLeave.value.endDate = start.toISOString().split('T')[0]
    if (formSubmitted.value) validateForm()
  }
}

function onEmployeeChange() { 
  selectedEmployee.value = employeesList.value.find(e => e.id === newLeave.value.employeeId)
  if (selectedEmployee.value) {
    loadEmployeeBalance(selectedEmployee.value.id)
  }
  if (formSubmitted.value) validateForm()
}

async function loadEmployeeBalance(employeeId) {
  try {
    const result = await leaveService.getEmployeeBalance(employeeId, new Date().getFullYear())
    if (result.success && result.data) {
      employeeBalances.value[employeeId] = result.data
    }
  } catch (error) {
    console.error('Error loading employee balance:', error)
  }
}

function onLeaveTypeChange() {
  selectedLeaveType.value = leaveTypesList.value.find(t => t.leaveTypeId === newLeave.value.leaveTypeId)
  if (isFixedLeave.value && newLeave.value.startDate) {
    calculateEndDateForFixedLeave()
  } else if (!isFixedLeave.value) {
    newLeave.value.endDate = ''
  }
  if (formSubmitted.value) validateForm()
}

function openAddLeaveModal() { 
  newLeave.value = { employeeId: null, leaveTypeId: null, startDate: '', endDate: '', reason: '', status: 'pending' }
  selectedEmployee.value = null
  selectedLeaveType.value = null
  validationErrors.value = {}
  formSubmitted.value = false
  showAddLeaveModal.value = true 
}

function closeAddModal() {
  showAddLeaveModal.value = false
  formSubmitted.value = false
  validationErrors.value = {}
}

async function confirmAddLeave() {
  formSubmitted.value = true
  
  if (!validateForm()) {
    showToastMessage('Please fix validation errors', 'error')
    return
  }
  
  try {
    const result = await leaveService.createLeaveRequest({
      employeeId: newLeave.value.employeeId,
      leaveTypeId: newLeave.value.leaveTypeId,
      startDate: newLeave.value.startDate,
      endDate: newLeave.value.endDate,
      reason: newLeave.value.reason,
      status: newLeave.value.status
    })
    
    if (result.success) {
      showAddLeaveModal.value = false
      formSubmitted.value = false
      showToastMessage(`Leave added successfully!`, 'success')
      refreshData()
    } else {
      showToastMessage(result.error, 'error')
    }
  } catch (error) {
    showToastMessage('Failed to add leave request', 'error')
  }
}

// ==================== RETURN CONFIRMATION ====================

function openReturnConfirmModalFromLeave(leave) {
  returnConfirmEmployee.value = leave
  actualReturnDate.value = today
  showReturnConfirmModal.value = true
}

function openReturnConfirmModalFromOverdue(leave) {
  returnConfirmEmployee.value = leave
  actualReturnDate.value = today
  showReturnConfirmModal.value = true
}

async function processConfirmReturn() {
  try {
    const result = await leaveService.confirmReturn(returnConfirmEmployee.value.leaveRequestId, actualReturnDate.value)
    if (result.success) {
      showToastMessage(result.message, 'success')
      refreshData()
    } else {
      showToastMessage(result.error, 'error')
    }
  } catch (error) {
    showToastMessage('Failed to confirm return', 'error')
  }
  showReturnConfirmModal.value = false
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

// ==================== INITIALIZATION ====================

onMounted(async () => {
  loading.value = true
  await Promise.all([
    loadDepartments(),
    loadLeaveTypes(),
    loadEmployees()
  ])
  await loadDashboardStats()
  await loadPendingRequests()
  loading.value = false
})

// Watch for filter changes
watch(() => pendingFilters.value, () => {
  pendingPagination.value.page = 1
  debouncedLoadPending()
}, { deep: true })

watch(() => approvedFilters.value, () => {
  approvedPagination.value.page = 1
  debouncedLoadApproved()
}, { deep: true })

watch(() => rejectedFilters.value, () => {
  rejectedPagination.value.page = 1
  debouncedLoadRejected()
}, { deep: true })
</script>

<style scoped>
.leave-management-hr {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Page Header */
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

/* Stats Cards */
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
}
.alert-icon { font-size: 20px; }
.alert-message { flex: 1; color: #dc2626; font-weight: 500; }
.alert-btn { background: #dc2626; color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; }

/* Tabs */
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
.tab-badge.danger { background: #dc2626; color: white; }

/* Section Container */
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

/* Filter Bar */
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
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-select, .month-picker {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

/* Balance Tab Enhancements */
.carried-over-info {
  font-size: 10px;
  color: #8b5cf6;
  margin-top: 4px;
}

.entitlement-info {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.progress-container {
  min-width: 180px;
}

.progress-label {
  font-size: 11px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Compact Cards */
.compact-requests-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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

.compact-card:hover {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.compact-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compact-avatar {
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.compact-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.compact-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.compact-code {
  font-size: 11px;
  color: #64748b;
}

.compact-dates {
  font-size: 12px;
  color: #475569;
}

.compact-card-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.compact-type {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.compact-actions {
  display: flex;
  gap: 6px;
}

/* Buttons */
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

.btn-view-small:hover {
  background: #cbd5e1;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-icon:hover {
  background: #f1f5f9;
}

.btn-export-small {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-primary-small {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
}

.btn-primary-small:hover {
  background: #2563eb;
}

/* Leave Type Badges */
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

/* Status Badges */
.status-success {
  background: #d1fae5;
  color: #059669;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.status-warning {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.status-danger {
  background: #fee2e2;
  color: #dc2626;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.status-info {
  background: #dbeafe;
  color: #2563eb;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.badge-danger {
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

/* Table */
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
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.employee-code {
  font-size: 11px;
  color: #94a3b8;
}

.text-center {
  text-align: center;
}

/* Progress Bar */
.progress-bar-small {
  width: 60px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  display: inline-block;
  margin-right: 8px;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
}

/* Balance Summary */
.balance-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.balance-summary-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
}

.summary-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.balance-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

/* Sick Leave Display */
.sick-days {
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
}

.sick-note {
  font-size: 10px;
  color: #94a3b8;
  font-style: italic;
}

/* Calendar */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.month-nav, .today-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
}

.calendar {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.weekday {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: #64748b;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 100px;
  padding: 8px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  position: relative;
  transition: background 0.2s;
}

.calendar-day:hover {
  background: #f8fafc;
}

.calendar-day.other-month {
  background: #fafafa;
  color: #cbd5e1;
}

.calendar-day.today {
  background: #eff6ff;
  border-color: #3b82f6;
}

.calendar-day.today .day-number {
  background: #3b82f6;
  color: white;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  border-radius: 50%;
}

/* Calendar Badges */
.leave-count-badge {
  margin-top: 8px;
  text-align: center;
  background: #3b82f6;
  border-radius: 12px;
  padding: 2px 6px;
  display: inline-block;
}

.return-count-badge {
  margin-top: 4px;
  text-align: center;
  background: #10b981;
  border-radius: 12px;
  padding: 2px 6px;
  display: inline-block;
}

.count-number {
  color: white;
  font-size: 11px;
  font-weight: 600;
}

.count-text {
  font-size: 9px;
  color: rgba(255,255,255,0.8);
  margin-left: 2px;
}

/* Calendar return day styling */
.calendar-day.return-day {
  background: #d1fae5;
  border-color: #10b981;
}

/* Calendar Tooltip */
.calendar-tooltip {
  position: fixed;
  background: #1e293b;
  color: white;
  border-radius: 12px;
  padding: 12px;
  min-width: 260px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: none;
  animation: fadeIn 0.2s ease-out;
}

.tooltip-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #334155;
}

.tooltip-section {
  margin-bottom: 10px;
}

.tooltip-subtitle {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}

.tooltip-list {
  max-height: 200px;
  overflow-y: auto;
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tooltip-dot.type-annual { background: #10b981; }
.tooltip-dot.type-sick { background: #ef4444; }
.tooltip-dot.type-maternity { background: #f59e0b; }
.tooltip-dot.type-paternity { background: #3b82f6; }
.tooltip-dot.type-bereavement { background: #8b5cf6; }
.tooltip-dot.return-dot { background: #10b981; }

.tooltip-name {
  flex: 1;
  font-weight: 500;
}

.tooltip-type {
  font-size: 10px;
  color: #94a3b8;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-fixed {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eef2ff;
  background: white;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body-fixed {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  max-height: calc(90vh - 120px);
}

.modal-body-fixed::-webkit-scrollbar {
  width: 6px;
}

.modal-body-fixed::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.modal-body-fixed::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eef2ff;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: white;
  flex-shrink: 0;
}

/* Form Styles */
.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #1e293b;
}

.form-select, .form-input, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-select:focus, .form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.form-group.half {
  flex: 1;
  margin-bottom: 0;
}

.required {
  color: #ef4444;
}

/* Error States */
.form-group.has-error input,
.form-group.has-error select,
.form-group.has-error textarea {
  border-color: #ef4444;
}

.error-text {
  font-size: 10px;
  color: #ef4444;
  margin-top: 4px;
  display: block;
}

/* Info Boxes */
.info-box-compact {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.info-box-compact.info-blue {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.info-icon {
  font-size: 14px;
}

.info-text {
  color: #166534;
}

.info-box-compact.info-blue .info-text {
  color: #1e40af;
}

.warning-box-compact {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #dc2626;
}

/* Return Modal */
.return-modal {
  max-width: 450px;
}

.return-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 20px;
}

.return-icon {
  font-size: 32px;
}

.return-details p {
  margin: 0;
}

.return-details p:first-child {
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.return-period {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.return-dates {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.date-box {
  flex: 1;
}

.date-box label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 4px;
  display: block;
}

.date-value {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  padding: 8px 0;
}

.date-arrow {
  font-size: 20px;
  color: #94a3b8;
}

/* Toast */
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

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eef2ff;
}

.page-btn {
  padding: 4px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Text Colors */
.text-green { color: #10b981; font-weight: 600; }
.text-orange { color: #f59e0b; font-weight: 600; }
.text-red { color: #ef4444; font-weight: 600; }
.text-purple { color: #8b5cf6; font-weight: 600; }
.text-blue { color: #3b82f6; font-weight: 600; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
  display: block;
  margin-bottom: 16px;
}

/* Animations */
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .leave-management-hr {
    padding: 12px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tabs-container {
    flex-direction: column;
  }
  
  .compact-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .compact-card-right {
    width: 100%;
    justify-content: space-between;
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
  
  .calendar-day {
    min-height: 80px;
    font-size: 11px;
  }
  
  .return-dates {
    flex-direction: column;
  }
  
  .date-arrow {
    transform: rotate(90deg);
  }
}


</style>
