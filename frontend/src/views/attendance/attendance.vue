<template>
  <div class="attendance-system">
    <!-- Header -->
    <div class="system-header">
      <div>
        <h1>Attendance Management System</h1>
        <p>Manual attendance entry with shift management, tickets, and field work</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openManualEntry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Manual Entry
        </button>
        <button class="btn-secondary" @click="exportData">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon present">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div class="stat-info">
          <span>Present Today</span>
          <strong>{{ stats.present }}</strong>
          <small>{{ stats.presentRate }}% of workforce</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon late">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="stat-info">
          <span>Late Today</span>
          <strong>{{ stats.late }}</strong>
          <small>{{ stats.lateRate }}% of present</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon absent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </div>
        <div class="stat-info">
          <span>Absent Today</span>
          <strong>{{ stats.absent }}</strong>
          <small>{{ stats.absentRate }}% of workforce</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="stat-info">
          <span>Field Work</span>
          <strong>{{ stats.fieldWork }}</strong>
          <small>Today</small>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Date Navigation -->
    <div class="date-nav">
      <button class="nav-btn" @click="changeWeek(-1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div class="current-date">
        <span>{{ dateRange }}</span>
      </div>
      <button class="nav-btn" @click="changeWeek(1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <button class="today-btn" @click="goToToday">Today</button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input type="text" v-model="filters.search" placeholder="Search employee..." class="search-input">
      </div>
      <select v-model="filters.department" class="filter-select">
        <option value="">All Departments</option>
        <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
      </select>
      <select v-model="filters.shift" class="filter-select">
        <option value="">All Shifts</option>
        <option value="morning">Morning Shift</option>
        <option value="night">Night Shift</option>
      </select>
      <button class="filter-btn" @click="resetFilters">Clear</button>
    </div>

    <!-- ==================== WEEKLY ATTENDANCE TABLE ==================== -->
    <div v-if="activeTab === 'weekly'" class="attendance-table-wrapper">
      <table class="attendance-table">
        <thead>
          <tr>
            <th class="col-employee">Employee</th>
            <th v-for="day in weekDays" :key="day.date" class="col-day">
              <div>{{ day.name }}</div>
              <small>{{ day.dateShort }}</small>
            </th>
            <th class="col-total">Total Hrs</th>
            <th class="col-ot">OT Hrs</th>
            <th class="col-late">Late (min)</th>
            <th class="col-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="employee in paginatedFilteredEmployees" :key="employee.id">
            <td class="col-employee">
              <div class="avatar" :style="{ background: getAvatarColor(employee.name) }">
                {{ getInitials(employee.name) }}
              </div>
              <div class="employee-info">
                <div class="name">{{ employee.name }}</div>
                <div class="dept">{{ employee.department }}</div>
              </div>
            </td>
            <td v-for="day in weekDays" :key="day.date" class="col-day">
              <div class="attendance-cell" :class="getDayStatusClass(employee, day.date)">
                <div class="status-icon">{{ getStatusIcon(employee, day.date) }}</div>
                <div class="hours">{{ getDayHours(employee, day.date) }}</div>
                <div class="late-minutes" v-if="getLateMinutes(employee, day.date) > 0">
                  {{ getLateMinutes(employee, day.date) }}min
                </div>
              </div>
            </td>
            <td class="col-total">{{ getWeeklyTotalHours(employee) }}h</td>
            <td class="col-ot">{{ getWeeklyOTHours(employee) }}h</td>
            <td class="col-late">{{ getWeeklyLateMinutes(employee) }}min</td>
            <td class="col-status">
              <div class="status-badges">
                <span class="badge present" v-if="getWeeklyPresent(employee) > 0">
                  P:{{ getWeeklyPresent(employee) }}
                </span>
                <span class="badge late" v-if="getWeeklyLate(employee) > 0">
                  L:{{ getWeeklyLate(employee) }}
                </span>
                <span class="badge field" v-if="getWeeklyFieldWork(employee) > 0">
                  F:{{ getWeeklyFieldWork(employee) }}
                </span>
                <span class="badge absent" v-if="getWeeklyAbsent(employee) > 0">
                  A:{{ getWeeklyAbsent(employee) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">Prev</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
      </div>
    </div>

    <!-- ==================== MONTHLY VIEW ==================== -->
    <div v-if="activeTab === 'monthly'" class="monthly-view">
      <div class="monthly-stats">
        <div class="stat-item">
          <label>Working Days</label>
          <span>{{ monthlyStats.workingDays }}</span>
        </div>
        <div class="stat-item">
          <label>Total Hours</label>
          <span>{{ monthlyStats.totalHours }}h</span>
        </div>
        <div class="stat-item">
          <label>OT Hours</label>
          <span>{{ monthlyStats.totalOT }}h</span>
        </div>
        <div class="stat-item">
          <label>Attendance Rate</label>
          <span>{{ monthlyStats.attendanceRate }}%</span>
        </div>
      </div>

      <div class="monthly-table-wrapper">
        <table class="monthly-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Days Worked</th>
              <th>Present</th>
              <th>Late</th>
              <th>Absent</th>
              <th>Leave</th>
              <th>Field Work</th>
              <th>Total Hours</th>
              <th>OT Hours</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in paginatedMonthlyData" :key="employee.id">
              <td>
                <div class="employee-cell">
                  <div class="avatar small" :style="{ background: getAvatarColor(employee.name) }">
                    {{ getInitials(employee.name) }}
                  </div>
                  {{ employee.name }}
                </div>
              </td>
              <td>{{ employee.department }}</td>
              <td>{{ employee.daysWorked }}/{{ monthlyStats.workingDays }}</td>
              <td>{{ employee.present }}</td>
              <td>{{ employee.late }}</td>
              <td>{{ employee.absent }}</td>
              <td>{{ employee.leave }}</td>
              <td>{{ employee.fieldWork }}</td>
              <td>{{ employee.totalHours }}h</td>
              <td>{{ employee.otHours }}h</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: employee.performance + '%' }"></div>
                  <span>{{ employee.performance }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== MANUAL ENTRY MODAL ==================== -->
    <div v-if="showManualEntry" class="modal-overlay" @click="closeManualEntry">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Manual Attendance Entry</h3>
          <button class="close" @click="closeManualEntry">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Employee</label>
            <select v-model="manualEntry.employeeId" class="form-select">
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="manualEntry.date" class="form-input">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Check In</label>
              <input type="time" v-model="manualEntry.checkIn" class="form-input">
            </div>
            <div class="form-group">
              <label>Check Out</label>
              <input type="time" v-model="manualEntry.checkOut" class="form-input">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Lunch Leave</label>
              <input type="time" v-model="manualEntry.lunchLeave" class="form-input">
            </div>
            <div class="form-group">
              <label>Lunch Return</label>
              <input type="time" v-model="manualEntry.lunchReturn" class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="manualEntry.status" class="form-select">
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
              <option value="field-work">Field Work</option>
            </select>
          </div>
          <div class="form-group">
            <label>Ticket Number (if applicable)</label>
            <input type="text" v-model="manualEntry.ticketNumber" class="form-input" placeholder="TKT-001">
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="manualEntry.notes" class="form-textarea" rows="2" placeholder="Meeting, boss call, etc."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeManualEntry">Cancel</button>
          <button class="btn-save" @click="saveManualEntry">Save Entry</button>
        </div>
      </div>
    </div>

    <!-- ==================== TICKET MODAL ==================== -->
    <div v-if="showTicketModal" class="modal-overlay" @click="closeTicketModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Create Lunch Ticket</h3>
          <button class="close" @click="closeTicketModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Employee</label>
            <select v-model="ticketForm.employeeId" class="form-select">
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="ticketForm.date" class="form-input">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Leave Time</label>
              <input type="time" v-model="ticketForm.leaveTime" class="form-input">
            </div>
            <div class="form-group">
              <label>Expected Return</label>
              <input type="time" v-model="ticketForm.expectedReturn" class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label>Reason</label>
            <select v-model="ticketForm.reason" class="form-select">
              <option value="batch2">Batch 2 Lunch</option>
              <option value="meeting">Meeting</option>
              <option value="boss_call">Boss Call</option>
              <option value="appointment">Appointment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="ticketForm.notes" class="form-textarea" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeTicketModal">Cancel</button>
          <button class="btn-save" @click="saveTicket">Create Ticket</button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ==================== STATE ====================
const activeTab = ref('weekly')
const currentDate = ref(new Date())
const showManualEntry = ref(false)
const showTicketModal = ref(false)
const currentPage = ref(1)
const itemsPerPage = 20

const filters = ref({
  search: '',
  department: '',
  shift: ''
})

const toasts = ref([])

// ==================== MOCK DATA ====================

// Departments
const departments = ref([
  { id: 1, name: 'Information Technology' },
  { id: 2, name: 'Human Resources' },
  { id: 3, name: 'Finance' },
  { id: 4, name: 'Marketing' },
  { id: 5, name: 'Sales' },
  { id: 6, name: 'Operations' }
])

// Employees with their settings
const employees = ref([
  { 
    id: 1, 
    employeeId: 'EMP001', 
    name: 'Alemu Bekele', 
    department: 'Information Technology', 
    departmentId: 1,
    position: 'Software Engineer',
    shift: 'morning',
    defaultCheckIn: '06:20',
    defaultCheckOut: '18:00',
    lunchBatch: 1,
    lunchDuration: 40,
    isFieldWorker: false
  },
  { 
    id: 2, 
    employeeId: 'EMP002', 
    name: 'Tigist Haile', 
    department: 'Human Resources', 
    departmentId: 2,
    position: 'HR Manager',
    shift: 'morning',
    defaultCheckIn: '06:20',
    defaultCheckOut: '18:00',
    lunchBatch: 2,
    lunchDuration: 40,
    isFieldWorker: false
  },
  { 
    id: 3, 
    employeeId: 'EMP003', 
    name: 'Biruk Tesfaye', 
    department: 'Finance', 
    departmentId: 3,
    position: 'Financial Analyst',
    shift: 'morning',
    defaultCheckIn: '07:00',
    defaultCheckOut: '19:00',
    lunchBatch: 1,
    lunchDuration: 50,
    isFieldWorker: false
  },
  { 
    id: 4, 
    employeeId: 'EMP004', 
    name: 'Selam Awoke', 
    department: 'Marketing', 
    departmentId: 4,
    position: 'Marketing Specialist',
    shift: 'morning',
    defaultCheckIn: '06:20',
    defaultCheckOut: '18:00',
    lunchBatch: 1,
    lunchDuration: 40,
    isFieldWorker: false
  },
  { 
    id: 5, 
    employeeId: 'EMP005', 
    name: 'Abel Desta', 
    department: 'Sales', 
    departmentId: 5,
    position: 'Sales Manager',
    shift: 'morning',
    defaultCheckIn: '08:00',
    defaultCheckOut: '20:00',
    lunchBatch: 2,
    lunchDuration: 40,
    isFieldWorker: false
  },
  { 
    id: 6, 
    employeeId: 'EMP006', 
    name: 'Meron Mekonnen', 
    department: 'Operations', 
    departmentId: 6,
    position: 'Operations Manager',
    shift: 'night',
    defaultCheckIn: '22:00',
    defaultCheckOut: '06:00',
    lunchBatch: null,
    lunchDuration: null,
    isFieldWorker: false
  },
  { 
    id: 7, 
    employeeId: 'EMP007', 
    name: 'Yared Tefera', 
    department: 'Information Technology', 
    departmentId: 1,
    position: 'System Admin',
    shift: 'morning',
    defaultCheckIn: '06:20',
    defaultCheckOut: '18:00',
    lunchBatch: 1,
    lunchDuration: 40,
    isFieldWorker: true
  },
  { 
    id: 8, 
    employeeId: 'EMP008', 
    name: 'Hiwot Girma', 
    department: 'Field Operations', 
    departmentId: 6,
    position: 'Field Officer',
    shift: 'morning',
    defaultCheckIn: '06:20',
    defaultCheckOut: '18:00',
    lunchBatch: 2,
    lunchDuration: 50,
    isFieldWorker: true
  },
  { 
    id: 9, 
    employeeId: 'EMP009', 
    name: 'Dawit Assefa', 
    department: 'Finance', 
    departmentId: 3,
    position: 'Accountant',
    shift: 'morning',
    defaultCheckIn: '06:20',
    defaultCheckOut: '18:00',
    lunchBatch: 1,
    lunchDuration: 40,
    isFieldWorker: false
  },
  { 
    id: 10, 
    employeeId: 'EMP010', 
    name: 'Eden Haile', 
    department: 'Human Resources', 
    departmentId: 2,
    position: 'Recruiter',
    shift: 'morning',
    defaultCheckIn: '06:20',
    defaultCheckOut: '18:00',
    lunchBatch: 1,
    lunchDuration: 40,
    isFieldWorker: false
  }
])

// Attendance records (mock data for the current week)
const attendanceRecords = ref([])

// Generate mock attendance for a date range
const generateMockAttendance = () => {
  const records = []
  const statuses = ['present', 'present', 'present', 'late', 'field-work', 'absent', 'leave']
  const lateMinutes = [0, 0, 0, 15, 30, 45, 60]
  
  // Get week range
  const weekRange = getWeekRange(currentDate.value)
  
  for (let emp of employees.value) {
    for (let d = new Date(weekRange.start); d <= weekRange.end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d, 'iso')
      const random = Math.random()
      let status = statuses[Math.floor(Math.random() * statuses.length)]
      let lateMin = 0
      let hours = 0
      let otHours = 0
      
      if (status === 'late') {
        lateMin = lateMinutes[Math.floor(Math.random() * lateMinutes.length)]
        hours = 11.5 - (lateMin / 60)
      } else if (status === 'present') {
        hours = 11.67
      } else if (status === 'field-work') {
        hours = 8
      } else if (status === 'absent' || status === 'leave') {
        hours = 0
      }
      
      // Add overtime for some
      if (random > 0.8 && (status === 'present' || status === 'late')) {
        otHours = Math.floor(Math.random() * 3) + 1
        hours += otHours
      }
      
      // For night shift
      if (emp.shift === 'night') {
        hours = 8
        otHours = random > 0.7 ? 2 : 0
      }
      
      records.push({
        id: `${emp.id}_${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        checkIn: status !== 'absent' && status !== 'leave' ? `${Math.floor(6 + Math.random() * 2)}:${Math.floor(Math.random() * 60)}`.padStart(5, '0') : null,
        checkOut: status !== 'absent' && status !== 'leave' ? `18:${Math.floor(Math.random() * 60)}`.padStart(5, '0') : null,
        status: status,
        lateMinutes: lateMin,
        hours: hours,
        otHours: otHours,
        regularHours: hours - otHours,
        ticketNumber: status === 'late' && Math.random() > 0.7 ? `TKT-${Math.floor(Math.random() * 100)}` : null,
        notes: ''
      })
    }
  }
  
  return records
}

// Initialize attendance records
const initAttendance = () => {
  attendanceRecords.value = generateMockAttendance()
}

// ==================== COMPUTED ====================

// Week days
const weekDays = computed(() => {
  const weekRange = getWeekRange(currentDate.value)
  const days = []
  for (let d = new Date(weekRange.start); d <= weekRange.end; d.setDate(d.getDate() + 1)) {
    days.push({
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: formatDate(d, 'iso'),
      dateShort: formatDate(d, 'short')
    })
  }
  return days
})

const dateRange = computed(() => {
  const weekRange = getWeekRange(currentDate.value)
  return `${formatDate(weekRange.start, 'full')} - ${formatDate(weekRange.end, 'full')}`
})

// Filtered employees
const filteredEmployees = computed(() => {
  let filtered = [...employees.value]
  
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(searchLower) || 
      e.employeeId.toLowerCase().includes(searchLower)
    )
  }
  
  if (filters.value.department) {
    filtered = filtered.filter(e => e.departmentId === parseInt(filters.value.department))
  }
  
  if (filters.value.shift) {
    filtered = filtered.filter(e => e.shift === filters.value.shift)
  }
  
  return filtered
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / itemsPerPage))
const paginatedFilteredEmployees = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredEmployees.value.slice(start, start + itemsPerPage)
})

// Stats
const stats = computed(() => {
  const today = formatDate(currentDate.value, 'iso')
  const todayRecords = attendanceRecords.value.filter(r => r.date === today)
  
  const present = todayRecords.filter(r => r.status === 'present').length
  const late = todayRecords.filter(r => r.status === 'late').length
  const absent = todayRecords.filter(r => r.status === 'absent').length
  const fieldWork = todayRecords.filter(r => r.status === 'field-work').length
  const total = employees.value.length
  
  return {
    present,
    late,
    absent,
    fieldWork,
    presentRate: total ? ((present / total) * 100).toFixed(1) : 0,
    lateRate: present + late ? ((late / (present + late)) * 100).toFixed(1) : 0,
    absentRate: total ? ((absent / total) * 100).toFixed(1) : 0
  }
})

// Monthly data
const monthlyStats = computed(() => {
  const monthRange = getMonthRange(currentDate.value)
  const monthRecords = attendanceRecords.value.filter(r => 
    r.date >= monthRange.startStr && r.date <= monthRange.endStr
  )
  
  const totalHours = monthRecords.reduce((sum, r) => sum + (r.hours || 0), 0)
  const totalOT = monthRecords.reduce((sum, r) => sum + (r.otHours || 0), 0)
  const workingDays = monthRange.end.getDate()
  
  return {
    workingDays,
    totalHours: totalHours.toFixed(1),
    totalOT: totalOT.toFixed(1),
    attendanceRate: (monthRecords.filter(r => r.status !== 'absent').length / (employees.value.length * workingDays) * 100).toFixed(1)
  }
})

const monthlyData = computed(() => {
  const monthRange = getMonthRange(currentDate.value)
  const monthRecords = attendanceRecords.value.filter(r => 
    r.date >= monthRange.startStr && r.date <= monthRange.endStr
  )
  
  return employees.value.map(emp => {
    const empRecords = monthRecords.filter(r => r.employeeId === emp.id)
    const present = empRecords.filter(r => r.status === 'present').length
    const late = empRecords.filter(r => r.status === 'late').length
    const absent = empRecords.filter(r => r.status === 'absent').length
    const leave = empRecords.filter(r => r.status === 'leave').length
    const fieldWork = empRecords.filter(r => r.status === 'field-work').length
    const daysWorked = present + late + fieldWork
    const totalHours = empRecords.reduce((sum, r) => sum + (r.hours || 0), 0)
    const otHours = empRecords.reduce((sum, r) => sum + (r.otHours || 0), 0)
    const performance = monthlyStats.value.workingDays ? (daysWorked / monthlyStats.value.workingDays * 100).toFixed(1) : 0
    
    return {
      ...emp,
      present,
      late,
      absent,
      leave,
      fieldWork,
      daysWorked,
      totalHours: totalHours.toFixed(1),
      otHours: otHours.toFixed(1),
      performance
    }
  })
})

const paginatedMonthlyData = computed(() => {
  return monthlyData.value.slice(0, 50)
})

// ==================== METHODS ====================

const formatDate = (date, format = 'iso') => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  if (format === 'iso') return `${year}-${month}-${day}`
  if (format === 'short') return `${month}/${day}`
  if (format === 'full') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return `${year}-${month}-${day}`
}

const getWeekRange = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const start = new Date(d)
  start.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end, startStr: formatDate(start, 'iso'), endStr: formatDate(end, 'iso') }
}

const getMonthRange = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start, end, startStr: formatDate(start, 'iso'), endStr: formatDate(end, 'iso') }
}

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getAvatarColor = (name) => {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
  const index = (name?.length || 0) % colors.length
  return colors[index]
}

// Attendance helpers
const getDayStatusClass = (employee, date) => {
  const record = attendanceRecords.value.find(r => r.employeeId === employee.id && r.date === date)
  if (!record) return ''
  return record.status
}

const getStatusIcon = (employee, date) => {
  const record = attendanceRecords.value.find(r => r.employeeId === employee.id && r.date === date)
  if (!record) return '—'
  const icons = { present: '✓', late: '⏰', absent: '✗', leave: '🌴', 'field-work': '🏔️' }
  return icons[record.status] || '—'
}

const getDayHours = (employee, date) => {
  const record = attendanceRecords.value.find(r => r.employeeId === employee.id && r.date === date)
  if (!record || !record.hours) return '—'
  return `${record.hours.toFixed(1)}h`
}

const getLateMinutes = (employee, date) => {
  const record = attendanceRecords.value.find(r => r.employeeId === employee.id && r.date === date)
  return record?.lateMinutes || 0
}

const getWeeklyTotalHours = (employee) => {
  const weekRange = getWeekRange(currentDate.value)
  const records = attendanceRecords.value.filter(r => 
    r.employeeId === employee.id && 
    r.date >= weekRange.startStr && 
    r.date <= weekRange.endStr
  )
  const total = records.reduce((sum, r) => sum + (r.hours || 0), 0)
  return total.toFixed(1)
}

const getWeeklyOTHours = (employee) => {
  const weekRange = getWeekRange(currentDate.value)
  const records = attendanceRecords.value.filter(r => 
    r.employeeId === employee.id && 
    r.date >= weekRange.startStr && 
    r.date <= weekRange.endStr
  )
  const total = records.reduce((sum, r) => sum + (r.otHours || 0), 0)
  return total.toFixed(1)
}

const getWeeklyLateMinutes = (employee) => {
  const weekRange = getWeekRange(currentDate.value)
  const records = attendanceRecords.value.filter(r => 
    r.employeeId === employee.id && 
    r.date >= weekRange.startStr && 
    r.date <= weekRange.endStr
  )
  const total = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0)
  return total
}

const getWeeklyPresent = (employee) => {
  const weekRange = getWeekRange(currentDate.value)
  const records = attendanceRecords.value.filter(r => 
    r.employeeId === employee.id && 
    r.date >= weekRange.startStr && 
    r.date <= weekRange.endStr
  )
  return records.filter(r => r.status === 'present').length
}

const getWeeklyLate = (employee) => {
  const weekRange = getWeekRange(currentDate.value)
  const records = attendanceRecords.value.filter(r => 
    r.employeeId === employee.id && 
    r.date >= weekRange.startStr && 
    r.date <= weekRange.endStr
  )
  return records.filter(r => r.status === 'late').length
}

const getWeeklyFieldWork = (employee) => {
  const weekRange = getWeekRange(currentDate.value)
  const records = attendanceRecords.value.filter(r => 
    r.employeeId === employee.id && 
    r.date >= weekRange.startStr && 
    r.date <= weekRange.endStr
  )
  return records.filter(r => r.status === 'field-work').length
}

const getWeeklyAbsent = (employee) => {
  const weekRange = getWeekRange(currentDate.value)
  const records = attendanceRecords.value.filter(r => 
    r.employeeId === employee.id && 
    r.date >= weekRange.startStr && 
    r.date <= weekRange.endStr
  )
  return records.filter(r => r.status === 'absent').length
}

// Navigation
const changeWeek = (direction) => {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + (direction * 7))
  currentDate.value = newDate
  initAttendance()
  currentPage.value = 1
}

const goToToday = () => {
  currentDate.value = new Date()
  initAttendance()
  currentPage.value = 1
}

const resetFilters = () => {
  filters.value = { search: '', department: '', shift: '' }
  currentPage.value = 1
}

// Manual entry
const manualEntry = ref({
  employeeId: '',
  date: '',
  checkIn: '',
  checkOut: '',
  lunchLeave: '',
  lunchReturn: '',
  status: 'present',
  ticketNumber: '',
  notes: ''
})

const openManualEntry = () => {
  manualEntry.value = {
    employeeId: '',
    date: formatDate(new Date(), 'iso'),
    checkIn: '',
    checkOut: '',
    lunchLeave: '',
    lunchReturn: '',
    status: 'present',
    ticketNumber: '',
    notes: ''
  }
  showManualEntry.value = true
}

const closeManualEntry = () => {
  showManualEntry.value = false
}

const saveManualEntry = () => {
  // Calculate hours based on check-in/out
  let hours = 0
  let otHours = 0
  let lateMinutes = 0
  
  if (manualEntry.value.checkIn && manualEntry.value.checkOut) {
    const [inHour, inMin] = manualEntry.value.checkIn.split(':').map(Number)
    const [outHour, outMin] = manualEntry.value.checkOut.split(':').map(Number)
    hours = (outHour + outMin/60) - (inHour + inMin/60)
    hours = Math.round(hours * 10) / 10
    
    // Check if late (after 6:20 AM for morning shift)
    if (inHour > 6 || (inHour === 6 && inMin > 20)) {
      lateMinutes = ((inHour - 6) * 60) + (inMin - 20)
    }
    
    // Overtime after 6:00 PM
    if (outHour > 18 || (outHour === 18 && outMin > 0)) {
      otHours = ((outHour - 18) * 60 + outMin) / 60
      otHours = Math.round(otHours * 10) / 10
    }
  }
  
  const newRecord = {
    id: `${manualEntry.value.employeeId}_${manualEntry.value.date}`,
    employeeId: manualEntry.value.employeeId,
    date: manualEntry.value.date,
    checkIn: manualEntry.value.checkIn,
    checkOut: manualEntry.value.checkOut,
    status: manualEntry.value.status,
    lateMinutes: lateMinutes,
    hours: hours,
    otHours: otHours,
    regularHours: hours - otHours,
    ticketNumber: manualEntry.value.ticketNumber,
    notes: manualEntry.value.notes
  }
  
  // Check if record exists
  const existingIndex = attendanceRecords.value.findIndex(r => 
    r.employeeId === newRecord.employeeId && r.date === newRecord.date
  )
  
  if (existingIndex !== -1) {
    attendanceRecords.value[existingIndex] = newRecord
    addToast('Attendance updated successfully', 'success')
  } else {
    attendanceRecords.value.push(newRecord)
    addToast('Attendance added successfully', 'success')
  }
  
  closeManualEntry()
}

// Ticket modal
const ticketForm = ref({
  employeeId: '',
  date: '',
  leaveTime: '',
  expectedReturn: '',
  reason: 'batch2',
  notes: ''
})

const openTicketModal = () => {
  ticketForm.value = {
    employeeId: '',
    date: formatDate(new Date(), 'iso'),
    leaveTime: '',
    expectedReturn: '',
    reason: 'batch2',
    notes: ''
  }
  showTicketModal.value = true
}

const closeTicketModal = () => {
  showTicketModal.value = false
}

const saveTicket = () => {
  const ticketNumber = `TKT-${Math.floor(Math.random() * 1000)}`
  addToast(`Ticket ${ticketNumber} created for ${getEmployeeName(ticketForm.value.employeeId)}`, 'success')
  closeTicketModal()
}

const getEmployeeName = (id) => {
  const emp = employees.value.find(e => e.id === id)
  return emp ? emp.name : 'Unknown'
}

// Export
const exportData = () => {
  addToast('Export started', 'success')
}

// Toast
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

// Tabs
const tabs = [
  { id: 'weekly', name: 'Weekly View' },
  { id: 'monthly', name: 'Monthly View' }
]

// Initialize
onMounted(() => {
  initAttendance()
})
</script>

<style scoped>
.attendance-system {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fb;
}

/* Header */
.system-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.system-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.system-header p {
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #6366f1;
  border: none;
  color: white;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-primary svg, .btn-secondary svg {
  width: 16px;
  height: 16px;
}

/* Stats Cards */
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
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-icon.present { background: #10b981; }
.stat-icon.late { background: #f59e0b; }
.stat-icon.absent { background: #ef4444; }
.stat-icon.field { background: #8b5cf6; }

.stat-info {
  flex: 1;
}

.stat-info span {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.stat-info strong {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-info small {
  font-size: 11px;
  color: #94a3b8;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: white;
  padding: 4px;
  border-radius: 12px;
  width: fit-content;
  border: 1px solid #e2e8f0;
}

.tabs button {
  padding: 8px 24px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
}

.tabs button.active {
  background: #6366f1;
  color: white;
}

/* Date Navigation */
.date-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.current-date {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.today-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

/* Filters */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  position: relative;
  min-width: 200px;
}

.search-box svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  min-width: 140px;
}

.filter-btn {
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
}

/* Weekly Table */
.attendance-table-wrapper {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.attendance-table th,
.attendance-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.attendance-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
}

.col-employee {
  min-width: 180px;
}

.col-day {
  text-align: center;
  min-width: 80px;
}

.col-total, .col-ot, .col-late, .col-status {
  text-align: center;
  min-width: 80px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.avatar.small {
  width: 28px;
  height: 28px;
  font-size: 11px;
}

.employee-info {
  margin-left: 10px;
  display: inline-block;
  vertical-align: middle;
}

.name {
  font-weight: 600;
  font-size: 13px;
}

.dept {
  font-size: 11px;
  color: #64748b;
}

.attendance-cell {
  text-align: center;
  padding: 6px;
  border-radius: 8px;
}

.attendance-cell.present {
  background: #d1fae5;
  color: #059669;
}

.attendance-cell.late {
  background: #fed7aa;
  color: #ea580c;
}

.attendance-cell.absent {
  background: #fee2e2;
  color: #dc2626;
}

.attendance-cell.leave {
  background: #dbeafe;
  color: #2563eb;
}

.attendance-cell.field-work {
  background: #e0e7ff;
  color: #4f46e5;
}

.status-icon {
  font-size: 16px;
}

.hours {
  font-size: 11px;
  font-weight: 500;
}

.late-minutes {
  font-size: 9px;
  opacity: 0.8;
}

.status-badges {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.badge.present {
  background: #d1fae5;
  color: #059669;
}

.badge.late {
  background: #fed7aa;
  color: #ea580c;
}

.badge.field {
  background: #e0e7ff;
  color: #4f46e5;
}

.badge.absent {
  background: #fee2e2;
  color: #dc2626;
}

/* Monthly View */
.monthly-view {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.monthly-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-item label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-item span {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.monthly-table-wrapper {
  overflow-x: auto;
}

.monthly-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.monthly-table th,
.monthly-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.monthly-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar .progress-fill {
  width: 60px;
  height: 6px;
  background: #10b981;
  border-radius: 3px;
}

.progress-bar span {
  font-size: 12px;
  font-weight: 500;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
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

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #334155;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.btn-cancel {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
}

.btn-save {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* Toast */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
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
@media (max-width: 768px) {
  .attendance-system {
    padding: 16px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tabs {
    width: 100%;
  }
  
  .tabs button {
    flex: 1;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .search-box {
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>