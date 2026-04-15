<template>
  <div class="attendance-config">
    <!-- Header -->
    <div class="config-header">
      <div>
        <h1>Attendance Configuration</h1>
        <p>Configure work schedules, shifts, lunch rules, overtime policies, and more</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="saveAllConfig">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Save Configuration
        </button>
      </div>
    </div>

    <!-- Main Shift Type Tabs -->
    <div class="shift-tabs">
      <button @click="activeShift = 'day'" :class="{ active: activeShift === 'day' }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        Day Shift
      </button>
      <button @click="activeShift = 'night'" :class="{ active: activeShift === 'night' }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        Night Shift
      </button>
    </div>

    <!-- ==================== DAY SHIFT CONFIGURATION ==================== -->
    <div v-if="activeShift === 'day'" class="shift-config">
      
      <!-- Day Shift Sub Tabs -->
      <div class="sub-tabs">
        <button 
          v-for="subTab in daySubTabs" 
          :key="subTab.id"
          @click="activeDaySubTab = subTab.id"
          :class="{ active: activeDaySubTab === subTab.id }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path :d="subTab.icon" />
          </svg>
          {{ subTab.name }}
        </button>
      </div>

      <!-- Day Shift - Company Defaults Sub Tab -->
      <div v-if="activeDaySubTab === 'defaults'" class="config-card">
        <div class="card-header">
          <h3>☀️ Company Defaults</h3>
          <span class="badge">Base settings for all day shift employees</span>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Default Check-In Time</label>
              <input type="time" v-model="dayConfig.companyDefaults.defaultCheckIn" class="form-input">
              <small>Standard arrival time (e.g., 06:20 AM)</small>
            </div>
            <div class="form-group">
              <label>Default Check-Out Time</label>
              <input type="time" v-model="dayConfig.companyDefaults.defaultCheckOut" class="form-input">
              <small>Standard departure time (e.g., 06:00 PM)</small>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Late Threshold (minutes)</label>
              <input type="number" v-model="dayConfig.lateThreshold" class="form-input">
              <small>Employee is marked late after this many minutes</small>
            </div>
            <div class="form-group">
              <label>Absent After (minutes late)</label>
              <input type="number" v-model="dayConfig.absentAfterMinutes" class="form-input">
              <small>If late exceeds this, mark as ABSENT (e.g., 60 = 1 hour)</small>
            </div>
          </div>
          <div class="form-group">
            <label>Working Days</label>
            <div class="checkbox-group">
              <label v-for="day in weekDays" :key="day.value" class="checkbox-label">
                <input type="checkbox" :value="day.value" v-model="dayConfig.workingDays">
                {{ day.label }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Day Shift - Department Overrides Sub Tab -->
      <div v-if="activeDaySubTab === 'deptOverrides'" class="config-card">
        <div class="card-header">
          <h3>🏢 Department Overrides</h3>
          <button class="btn-icon" @click="openDeptModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Lunch Duration</th>
                  <th>OT After</th>
                  <th style="width: 100px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dept in dayConfig.departmentOverrides" :key="dept.departmentId">
                  <td>{{ dept.departmentName }}</td>
                  <td>{{ formatTimeDisplay(dept.checkIn) || '—' }}</td>
                  <td>{{ formatTimeDisplay(dept.checkOut) || '—' }}</td>
                  <td>{{ dept.lunchDuration ? `${dept.lunchDuration} min` : '—' }}</td>
                  <td>{{ formatTimeDisplay(dept.overtimeAfter) || '—' }}</td>
                  <td class="actions">
                    <button class="action-btn edit" @click="editDeptOverride(dept)" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                      </svg>
                    </button>
                    <button class="action-btn delete" @click="confirmDeleteDept(dept)" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="dayConfig.departmentOverrides.length === 0">
                  <td colspan="6" class="empty">No department overrides configured</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Day Shift - Employee Overrides Sub Tab -->
      <div v-if="activeDaySubTab === 'empOverrides'" class="config-card">
        <div class="card-header">
          <h3>👤 Employee Overrides (Highest Priority)</h3>
          <button class="btn-icon" @click="openEmployeeModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Lunch Duration</th>
                  <th>OT After</th>
                  <th style="width: 100px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="emp in dayConfig.employeeOverrides" :key="emp.employeeId">
                  <td>{{ emp.employeeName }}</td>
                  <td>{{ emp.department }}</td>
                  <td>{{ formatTimeDisplay(emp.checkIn) || '—' }}</td>
                  <td>{{ formatTimeDisplay(emp.checkOut) || '—' }}</td>
                  <td>{{ emp.lunchDuration ? `${emp.lunchDuration} min` : '—' }}</td>
                  <td>{{ formatTimeDisplay(emp.overtimeAfter) || '—' }}</td>
                  <td class="actions">
                    <button class="action-btn edit" @click="editEmployeeOverride(emp)" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                      </svg>
                    </button>
                    <button class="action-btn delete" @click="confirmDeleteEmployee(emp)" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="dayConfig.employeeOverrides.length === 0">
                  <td colspan="7" class="empty">No employee overrides configured</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Day Shift - Lunch Rules Sub Tab -->
      <div v-if="activeDaySubTab === 'lunch'" class="config-card">
        <div class="card-header">
          <h3>🍽️ Lunch Break Rules</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Lunch Break Start Time</label>
              <input type="time" v-model="dayConfig.lunchConfig.startTime" class="form-input">
              <small>When employees go for lunch (e.g., 12:00 PM)</small>
            </div>
            <div class="form-group">
              <label>Default Lunch Duration</label>
              <input type="number" v-model="dayConfig.lunchConfig.defaultDuration" class="form-input" step="5">
              <small>minutes - Overridable by department/employee</small>
            </div>
          </div>
          <div class="info-note">
            <small>📝 Priority: Employee Override > Department Override > Company Default ({{ dayConfig.lunchConfig.defaultDuration }} min)</small>
          </div>
        </div>
      </div>

      <!-- Day Shift - Live Lunch Tracking Sub Tab -->
      <div v-if="activeDaySubTab === 'liveTracking'" class="config-card">
        <div class="card-header">
          <h3>🎫 Live Lunch Tracking</h3>
          <button class="btn-primary-small" @click="openTicketModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Issue Ticket
          </button>
        </div>
        <div class="card-body">
          <div class="info-note" style="margin-bottom: 16px;">
            <small>📌 Break-out time auto-set to current time. Expected return calculated from employee's lunch duration.</small>
          </div>
          
          <!-- Active Tickets -->
          <div class="section-title">Currently on Lunch</div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Dept</th><th>Break-Out</th><th>Expected Return</th><th>Status</th><th>Late</th><th style="width:80px">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ticket in activeTickets" :key="ticket.id">
                  <td>{{ ticket.employeeName }}</td>
                  <td>{{ ticket.department }}</td>
                  <td>{{ formatTimeDisplay(ticket.breakOutTime) }}</td>
                  <td>{{ formatTimeDisplay(ticket.expectedReturn) }}</td>
                  <td><span :class="['status-badge', ticket.status]">{{ getStatusText(ticket.status) }}</span></td>
                  <td class="late-minutes">{{ ticket.status === 'late' ? calculateLateMinutes(ticket) + ' min' : '—' }}</td>
                  <td class="actions">
                    <button class="action-btn checkin" @click="returnFromLunch(ticket.id)" title="Return">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
                <tr v-if="activeTickets.length === 0"><td colspan="7" class="empty">No employees on lunch</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Ticket History -->
          <div class="section-title" style="margin-top:24px">📋 Ticket History</div>
          <div class="filters-bar">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" v-model="historyFilters.search" placeholder="Search employee..." class="search-input">
            </div>
            <select v-model="historyFilters.status" class="filter-select">
              <option value="">All Status</option>
              <option value="on-time">On Time</option><option value="late">Late</option><option value="absent">Absent</option>
            </select>
            <button class="filter-btn" @click="resetHistoryFilters">Clear</button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Employee</th><th>Date</th><th>Break-Out</th><th>Expected</th><th>Actual</th><th>Status</th><th>Late</th></tr></thead>
              <tbody>
                <tr v-for="ticket in paginatedHistoryTickets" :key="ticket.id">
                  <td>{{ ticket.employeeName }}</td>
                  <td>{{ formatDate(ticket.date) }}</td>
                  <td>{{ formatTimeDisplay(ticket.breakOutTime) }}</td>
                  <td>{{ formatTimeDisplay(ticket.expectedReturn) }}</td>
                  <td>{{ ticket.actualReturn ? formatTimeDisplay(ticket.actualReturn) : '—' }}</td>
                  <td><span :class="['status-badge', ticket.status]">{{ getStatusText(ticket.status) }}</span></td>
                  <td>{{ ticket.lateMinutes || '—' }}</td>
                </tr>
                <tr v-if="paginatedHistoryTickets.length === 0"><td colspan="7" class="empty">No tickets found</td></tr>
              </tbody>
            </table>
          </div>
          <div class="pagination" v-if="filteredHistoryTickets.length > historyPageSize">
            <button class="page-btn" :disabled="historyPage===1" @click="historyPage--">Prev</button>
            <span>Page {{ historyPage }} of {{ historyTotalPages }}</span>
            <button class="page-btn" :disabled="historyPage===historyTotalPages" @click="historyPage++">Next</button>
          </div>
        </div>
      </div>

      <!-- Day Shift - Overtime Rules Sub Tab -->
      <div v-if="activeDaySubTab === 'overtime'" class="config-card">
        <div class="card-header">
          <h3>⏰ Overtime Rules</h3>
        </div>
        <div class="card-body">
          <div class="info-note" style="margin-bottom:16px"><small>💡 OT starts after each employee's individual clock-out time.</small></div>
          <div class="form-row">
            <div class="form-group"><label>Weekday OT Rate</label><input type="number" step="0.1" v-model="dayConfig.overtime.weekdayRate" class="form-input"></div>
            <div class="form-group"><label>Weekend OT Rate</label><input type="number" step="0.1" v-model="dayConfig.overtime.weekendRate" class="form-input"></div>
            <div class="form-group"><label>Holiday OT Rate</label><input type="number" step="0.1" v-model="dayConfig.overtime.holidayRate" class="form-input"></div>
          </div>

          <!-- Late Night OT Adjustment -->
          <div style="margin-top:20px; padding-top:20px; border-top:1px solid #e2e8f0">
            <label>🌙 Late Night OT Adjustment</label>
            <div class="info-note" style="margin-bottom:12px"><small>Employees who worked past midnight have their next day check-in adjusted.</small></div>
            <div class="table-responsive">
              <table class="data-table">
                <thead><tr><th>Employee</th><th>Date</th><th>Worked Until</th><th>Adjusted Check-In</th><th style="width:80px">Actions</th></tr></thead>
                <tbody>
                  <tr v-for="adj in dayConfig.lateNightOTRules.activeAdjustments" :key="adj.employeeId">
                    <td>{{ adj.employeeName }}</td>
                    <td>{{ formatDate(adj.date) }}</td>
                    <td>{{ formatTimeDisplay(adj.workedUntil) }}</td>
                    <td>{{ formatTimeDisplay(adj.adjustedCheckIn) }}</td>
                    <td class="actions"><button class="action-btn delete" @click="confirmDeleteAdjustment(adj)" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button></td>
                  </tr>
                  <tr v-if="dayConfig.lateNightOTRules.activeAdjustments.length === 0"><td colspan="5" class="empty">No active adjustments</td></tr>
                </tbody>
              </table>
            </div>
            <button class="add-btn" @click="openLateNightModal">+ Add Late Night Adjustment</button>
          </div>
        </div>
      </div>

      <!-- Day Shift - Field Work Sub Tab -->
      <div v-if="activeDaySubTab === 'fieldWork'" class="config-card">
        <div class="card-header">
          <h3>🏔️ Field Work Registration</h3>
          <button class="btn-primary-small" @click="openFieldWorkModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg>
            Register
          </button>
        </div>
        <div class="card-body">
          <div class="info-note" style="margin-bottom:16px"><small>📋 Field work is considered a regular work day.</small></div>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Employee</th><th>Dept</th><th>Duration</th><th>Start Date</th><th>End Date</th><th>Status</th><th style="width:100px">Actions</th></tr></thead>
              <tbody>
                <tr v-for="fw in dayConfig.fieldWorkRules.activeFieldWork" :key="fw.id">
                  <td>{{ fw.employeeName }}</td>
                  <td>{{ fw.department }}</td>
                  <td><span :class="['duration-badge', fw.durationType]">{{ getDurationTypeLabel(fw.durationType) }}</span></td>
                  <td>{{ formatDate(fw.startDate) }}</td>
                  <td>{{ fw.endDate ? formatDate(fw.endDate) : '—' }}</td>
                  <td><span class="status-badge field">Active</span></td>
                  <td class="actions">
                    <button class="action-btn checkin" @click="completeFieldWork(fw.id)" title="Complete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg></button>
                    <button class="action-btn delete" @click="deleteFieldWork(fw.id)" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                  </td>
                </tr>
                <tr v-if="dayConfig.fieldWorkRules.activeFieldWork.length === 0"><td colspan="7" class="empty">No active field work</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== NIGHT SHIFT CONFIGURATION ==================== -->
    <div v-if="activeShift === 'night'" class="shift-config">
      
      <!-- Night Shift Sub Tabs -->
      <div class="sub-tabs">
        <button 
          v-for="subTab in nightSubTabs" 
          :key="subTab.id"
          @click="activeNightSubTab = subTab.id"
          :class="{ active: activeNightSubTab === subTab.id }"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path :d="subTab.icon" />
          </svg>
          {{ subTab.name }}
        </button>
      </div>

      <!-- Night Shift - Company Defaults Sub Tab -->
      <div v-if="activeNightSubTab === 'defaults'" class="config-card">
        <div class="card-header">
          <h3>🌙 Night Shift - Company Defaults</h3>
          <span class="badge">Base settings for night shift employees</span>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label>Default Check-In Time</label><input type="time" v-model="nightConfig.companyDefaults.defaultCheckIn" class="form-input"><small>e.g., 10:00 PM</small></div>
            <div class="form-group"><label>Default Check-Out Time</label><input type="time" v-model="nightConfig.companyDefaults.defaultCheckOut" class="form-input"><small>e.g., 06:00 AM (next day)</small></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Check-Out Day Offset</label><select v-model="nightConfig.companyDefaults.checkOutDayOffset" class="form-select"><option :value="0">Same Day</option><option :value="1">Next Day</option></select></div>
            <div class="form-group"><label>Late Threshold (minutes)</label><input type="number" v-model="nightConfig.lateThreshold" class="form-input"></div>
          </div>
          <div class="form-group">
            <label>Working Days</label>
            <div class="checkbox-group"><label v-for="day in weekDays" :key="day.value" class="checkbox-label"><input type="checkbox" :value="day.value" v-model="nightConfig.workingDays">{{ day.label }}</label></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Dinner Break Start</label><input type="time" v-model="nightConfig.dinnerBreak.defaultStart" class="form-input"></div>
            <div class="form-group"><label>Dinner Break Duration</label><input type="number" v-model="nightConfig.dinnerBreak.defaultDuration" class="form-input" step="5"><small>minutes</small></div>
          </div>
        </div>
      </div>

      <!-- Night Shift - Department Overrides Sub Tab -->
      <div v-if="activeNightSubTab === 'deptOverrides'" class="config-card">
        <div class="card-header">
          <h3>🏢 Night Shift - Department Overrides</h3>
          <button class="btn-icon" @click="openNightDeptModal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg></button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Department</th><th>Check-In</th><th>Check-Out</th><th>Dinner Start</th><th>Dinner Duration</th><th style="width:100px">Actions</th></tr></thead>
              <tbody>
                <tr v-for="dept in nightConfig.departmentOverrides" :key="dept.departmentId">
                  <td>{{ dept.departmentName }}</td>
                  <td>{{ formatTimeDisplay(dept.checkIn) || '—' }}</td>
                  <td>{{ formatTimeDisplay(dept.checkOut) || '—' }}</td>
                  <td>{{ formatTimeDisplay(dept.dinnerStart) || '—' }}</td>
                  <td>{{ dept.dinnerDuration ? `${dept.dinnerDuration} min` : '—' }}</td>
                  <td class="actions"><button class="action-btn edit" @click="editNightDeptOverride(dept)" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3l4 4-7 7H10v-4l7-7z" /></svg></button><button class="action-btn delete" @click="confirmDeleteNightDept(dept)" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button></td>
                </tr>
                <tr v-if="nightConfig.departmentOverrides.length === 0"><td colspan="6" class="empty">No department overrides</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Night Shift - Employee Overrides Sub Tab -->
      <div v-if="activeNightSubTab === 'empOverrides'" class="config-card">
        <div class="card-header">
          <h3>👤 Night Shift - Employee Overrides</h3>
          <button class="btn-icon" @click="openNightEmployeeModal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" /></svg></button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Employee</th><th>Department</th><th>Check-In</th><th>Check-Out</th><th>Dinner Start</th><th>Dinner Duration</th><th style="width:100px">Actions</th></tr></thead>
              <tbody>
                <tr v-for="emp in nightConfig.employeeOverrides" :key="emp.employeeId">
                  <td>{{ emp.employeeName }}</td>
                  <td>{{ emp.department }}</td>
                  <td>{{ formatTimeDisplay(emp.checkIn) || '—' }}</td>
                  <td>{{ formatTimeDisplay(emp.checkOut) || '—' }}</td>
                  <td>{{ formatTimeDisplay(emp.dinnerStart) || '—' }}</td>
                  <td>{{ emp.dinnerDuration ? `${emp.dinnerDuration} min` : '—' }}</td>
                  <td class="actions"><button class="action-btn edit" @click="editNightEmployeeOverride(emp)" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3l4 4-7 7H10v-4l7-7z" /></svg></button><button class="action-btn delete" @click="confirmDeleteNightEmployee(emp)" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button></td>
                </tr>
                <tr v-if="nightConfig.employeeOverrides.length === 0"><td colspan="7" class="empty">No employee overrides</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Night Shift - Overtime Rules Sub Tab -->
      <div v-if="activeNightSubTab === 'overtime'" class="config-card">
        <div class="card-header">
          <h3>⏰ Night Shift - Overtime Rules</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label>Weekday OT Rate</label><input type="number" step="0.1" v-model="nightConfig.overtime.weekdayRate" class="form-input"></div>
            <div class="form-group"><label>Weekend OT Rate</label><input type="number" step="0.1" v-model="nightConfig.overtime.weekendRate" class="form-input"></div>
            <div class="form-group"><label>Holiday OT Rate</label><input type="number" step="0.1" v-model="nightConfig.overtime.holidayRate" class="form-input"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- All Modals (same as before) -->
    <!-- Issue Lunch Ticket Modal -->
    <div v-if="showTicketModal" class="modal-overlay" @click="closeTicketModal">
      <div class="modal" @click.stop>
        <div class="modal-header"><h3>Issue Lunch Ticket</h3><button class="close" @click="closeTicketModal">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Employee</label><select v-model="ticketForm.employeeId" class="form-select"><option v-for="emp in mockEmployees" :key="emp.id" :value="emp.id">{{ emp.name }} ({{ emp.department }})</option></select></div>
          <div class="info-note"><small>⏰ Break-out: {{ currentTimeDisplay }}</small></div>
          <div class="form-group"><label>Lunch Duration</label><input type="number" v-model="ticketForm.lunchDuration" class="form-input" readonly disabled></div>
          <div class="form-group"><label>Expected Return</label><input type="time" v-model="ticketForm.expectedReturn" class="form-input" readonly disabled></div>
          <div class="form-group"><label>Reason</label><select v-model="ticketForm.reason" class="form-select"><option value="meeting">Meeting</option><option value="boss_call">Boss Call</option><option value="appointment">Appointment</option><option value="other">Other</option></select></div>
        </div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeTicketModal">Cancel</button><button class="btn-save" @click="issueTicket">Issue Ticket</button></div>
      </div>
    </div>

    <!-- Department Modal -->
    <div v-if="showDeptModal" class="modal-overlay" @click="closeDeptModal">
      <div class="modal" @click.stop>
        <div class="modal-header"><h3>{{ editingDept ? 'Edit Department Override' : 'Add Department Override' }}</h3><button class="close" @click="closeDeptModal">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Department</label><select v-model="deptForm.departmentId" class="form-select"><option v-for="dept in mockDepartments" :key="dept.id" :value="dept.id">{{ dept.name }}</option></select></div>
          <div class="form-row"><div class="form-group"><label>Check-In</label><input type="time" v-model="deptForm.checkIn" class="form-input"></div><div class="form-group"><label>Check-Out</label><input type="time" v-model="deptForm.checkOut" class="form-input"></div></div>
          <div class="form-row"><div class="form-group"><label>Lunch Duration (min)</label><input type="number" v-model="deptForm.lunchDuration" class="form-input"></div><div class="form-group"><label>OT After</label><input type="time" v-model="deptForm.overtimeAfter" class="form-input"></div></div>
        </div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeDeptModal">Cancel</button><button class="btn-save" @click="saveDeptOverride">Save</button></div>
      </div>
    </div>

    <!-- Employee Modal -->
    <div v-if="showEmployeeModal" class="modal-overlay" @click="closeEmployeeModal">
      <div class="modal" @click.stop>
        <div class="modal-header"><h3>{{ editingEmployee ? 'Edit Employee Override' : 'Add Employee Override' }}</h3><button class="close" @click="closeEmployeeModal">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Employee</label><select v-model="employeeForm.employeeId" class="form-select"><option v-for="emp in mockEmployees" :key="emp.id" :value="emp.id">{{ emp.name }} ({{ emp.department }})</option></select></div>
          <div class="form-row"><div class="form-group"><label>Check-In</label><input type="time" v-model="employeeForm.checkIn" class="form-input"></div><div class="form-group"><label>Check-Out</label><input type="time" v-model="employeeForm.checkOut" class="form-input"></div></div>
          <div class="form-row"><div class="form-group"><label>Lunch Duration (min)</label><input type="number" v-model="employeeForm.lunchDuration" class="form-input"></div><div class="form-group"><label>OT After</label><input type="time" v-model="employeeForm.overtimeAfter" class="form-input"></div></div>
        </div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeEmployeeModal">Cancel</button><button class="btn-save" @click="saveEmployeeOverride">Save</button></div>
      </div>
    </div>

    <!-- Late Night Modal -->
    <div v-if="showLateNightModal" class="modal-overlay" @click="closeLateNightModal">
      <div class="modal" @click.stop>
        <div class="modal-header"><h3>Add Late Night Adjustment</h3><button class="close" @click="closeLateNightModal">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Employee</label><select v-model="lateNightForm.employeeId" class="form-select"><option v-for="emp in mockEmployees" :key="emp.id" :value="emp.id">{{ emp.name }}</option></select></div>
          <div class="form-group"><label>Date</label><input type="date" v-model="lateNightForm.date" class="form-input"></div>
          <div class="form-group"><label>Worked Until</label><input type="time" v-model="lateNightForm.workedUntil" class="form-input"></div>
          <div class="form-group"><label>Adjusted Check-In</label><input type="time" v-model="lateNightForm.adjustedCheckIn" class="form-input"></div>
        </div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeLateNightModal">Cancel</button><button class="btn-save" @click="addLateNightAdjustment">Add</button></div>
      </div>
    </div>

    <!-- Field Work Modal -->
    <div v-if="showFieldWorkModal" class="modal-overlay" @click="closeFieldWorkModal">
      <div class="modal" @click.stop>
        <div class="modal-header"><h3>Register Field Work</h3><button class="close" @click="closeFieldWorkModal">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Employee</label><select v-model="fieldWorkForm.employeeId" class="form-select"><option v-for="emp in mockEmployees" :key="emp.id" :value="emp.id">{{ emp.name }} ({{ emp.department }})</option></select></div>
          <div class="form-group"><label>Duration Type</label><div class="radio-group"><label class="radio-label"><input type="radio" v-model="fieldWorkForm.durationType" value="today"> Today Only</label><label class="radio-label"><input type="radio" v-model="fieldWorkForm.durationType" value="range"> Date Range</label><label class="radio-label"><input type="radio" v-model="fieldWorkForm.durationType" value="permanent"> Permanent</label></div></div>
          <div class="form-group" v-if="fieldWorkForm.durationType === 'today'"><label>Date</label><input type="date" v-model="fieldWorkForm.startDate" class="form-input"></div>
          <div class="form-row" v-if="fieldWorkForm.durationType === 'range'"><div class="form-group"><label>Start Date</label><input type="date" v-model="fieldWorkForm.startDate" class="form-input"></div><div class="form-group"><label>End Date</label><input type="date" v-model="fieldWorkForm.endDate" class="form-input"></div></div>
          <div class="info-note" v-if="fieldWorkForm.durationType === 'permanent'"><small>📌 Permanent field work assignment</small></div>
          <div class="form-group"><label class="checkbox-label"><input type="checkbox" v-model="fieldWorkForm.noOfficeCheckin"> No Office Check-in</label></div>
        </div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeFieldWorkModal">Cancel</button><button class="btn-save" @click="registerFieldWork">Register</button></div>
      </div>
    </div>

    <!-- Night Department Modal -->
    <div v-if="showNightDeptModal" class="modal-overlay" @click="closeNightDeptModal">
      <div class="modal" @click.stop>
        <div class="modal-header"><h3>{{ editingNightDept ? 'Edit Night Department' : 'Add Night Department' }}</h3><button class="close" @click="closeNightDeptModal">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Department</label><select v-model="nightDeptForm.departmentId" class="form-select"><option v-for="dept in mockDepartments" :key="dept.id" :value="dept.id">{{ dept.name }}</option></select></div>
          <div class="form-row"><div class="form-group"><label>Check-In</label><input type="time" v-model="nightDeptForm.checkIn" class="form-input"></div><div class="form-group"><label>Check-Out</label><input type="time" v-model="nightDeptForm.checkOut" class="form-input"></div></div>
          <div class="form-row"><div class="form-group"><label>Dinner Start</label><input type="time" v-model="nightDeptForm.dinnerStart" class="form-input"></div><div class="form-group"><label>Dinner Duration (min)</label><input type="number" v-model="nightDeptForm.dinnerDuration" class="form-input"></div></div>
        </div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeNightDeptModal">Cancel</button><button class="btn-save" @click="saveNightDeptOverride">Save</button></div>
      </div>
    </div>

    <!-- Night Employee Modal -->
    <div v-if="showNightEmployeeModal" class="modal-overlay" @click="closeNightEmployeeModal">
      <div class="modal" @click.stop>
        <div class="modal-header"><h3>{{ editingNightEmployee ? 'Edit Night Employee' : 'Add Night Employee' }}</h3><button class="close" @click="closeNightEmployeeModal">×</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Employee</label><select v-model="nightEmployeeForm.employeeId" class="form-select"><option v-for="emp in mockEmployees" :key="emp.id" :value="emp.id">{{ emp.name }} ({{ emp.department }})</option></select></div>
          <div class="form-row"><div class="form-group"><label>Check-In</label><input type="time" v-model="nightEmployeeForm.checkIn" class="form-input"></div><div class="form-group"><label>Check-Out</label><input type="time" v-model="nightEmployeeForm.checkOut" class="form-input"></div></div>
          <div class="form-row"><div class="form-group"><label>Dinner Start</label><input type="time" v-model="nightEmployeeForm.dinnerStart" class="form-input"></div><div class="form-group"><label>Dinner Duration (min)</label><input type="number" v-model="nightEmployeeForm.dinnerDuration" class="form-input"></div></div>
        </div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeNightEmployeeModal">Cancel</button><button class="btn-save" @click="saveNightEmployeeOverride">Save</button></div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header"><h3>Confirm Delete</h3><button class="close" @click="closeConfirmModal">×</button></div>
        <div class="modal-body"><div class="delete-warning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" /></svg><p>Delete <strong>{{ deleteItem?.name }}</strong>? This cannot be undone.</p></div></div>
        <div class="modal-footer"><button class="btn-cancel" @click="closeConfirmModal">Cancel</button><button class="btn-delete" @click="executeDelete">Delete</button></div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-container"><div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">{{ toast.message }}</div></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// ==================== STATE ====================
const activeShift = ref('day')
const activeDaySubTab = ref('defaults')
const activeNightSubTab = ref('defaults')
const toasts = ref([])
const currentTimeDisplay = ref('')

// Day Shift Sub Tabs
const daySubTabs = [
  { id: 'defaults', name: 'Company Defaults', icon: 'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' },
  { id: 'deptOverrides', name: 'Department Overrides', icon: 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4' },
  { id: 'empOverrides', name: 'Employee Overrides', icon: 'M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1z' },
  { id: 'lunch', name: 'Lunch Rules', icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
  { id: 'liveTracking', name: 'Live Lunch Tracking', icon: 'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' },
  { id: 'overtime', name: 'Overtime Rules', icon: 'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' },
  { id: 'fieldWork', name: 'Field Work', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }
]

// Night Shift Sub Tabs
const nightSubTabs = [
  { id: 'defaults', name: 'Company Defaults', icon: 'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' },
  { id: 'deptOverrides', name: 'Department Overrides', icon: 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4' },
  { id: 'empOverrides', name: 'Employee Overrides', icon: 'M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1z' },
  { id: 'overtime', name: 'Overtime Rules', icon: 'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' }
]

// Modal states (same as before)
const showTicketModal = ref(false)
const showDeptModal = ref(false)
const showEmployeeModal = ref(false)
const showLateNightModal = ref(false)
const showFieldWorkModal = ref(false)
const showNightDeptModal = ref(false)
const showNightEmployeeModal = ref(false)
const showConfirmModal = ref(false)

// Editing states
const editingDept = ref(null)
const editingEmployee = ref(null)
const editingNightDept = ref(null)
const editingNightEmployee = ref(null)
const deleteItem = ref(null)
const deleteType = ref('')

// History filters
const historyFilters = ref({ search: '', status: '' })
const historyPage = ref(1)
const historyPageSize = 10

// Intervals
let lunchCheckInterval = null
let timeInterval = null

// Mock data
const mockEmployees = ref([
  { id: 1, name: 'Alemu Bekele', department: 'IT' },
  { id: 2, name: 'Tigist Haile', department: 'HR' },
  { id: 3, name: 'Biruk Tesfaye', department: 'Finance' },
  { id: 4, name: 'Selam Awoke', department: 'Marketing' },
  { id: 5, name: 'Abel Desta', department: 'Sales' },
  { id: 6, name: 'Meron Mekonnen', department: 'Operations' }
])

const mockDepartments = ref([
  { id: 1, name: 'IT' }, { id: 2, name: 'HR' }, { id: 3, name: 'Finance' },
  { id: 4, name: 'Marketing' }, { id: 5, name: 'Sales' }, { id: 6, name: 'Operations' }
])

const weekDays = [
  { value: 'monday', label: 'Monday' }, { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' }, { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' }, { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

// Helper functions
const formatTimeDisplay = (time) => {
  if (!time) return null
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getDurationTypeLabel = (type) => {
  const labels = { 'today': 'Today Only', 'range': 'Date Range', 'permanent': 'Permanent' }
  return labels[type] || type
}

const getEmployeeLunchDuration = (employeeId) => {
  const employeeOverride = dayConfig.value.employeeOverrides.find(e => e.employeeId === employeeId)
  if (employeeOverride?.lunchDuration) return employeeOverride.lunchDuration
  const employee = mockEmployees.value.find(e => e.id === employeeId)
  const deptOverride = dayConfig.value.departmentOverrides.find(d => d.departmentName === employee?.department)
  if (deptOverride?.lunchDuration) return deptOverride.lunchDuration
  return dayConfig.value.lunchConfig.defaultDuration
}

const getStatusText = (status) => {
  const map = { 'active': 'On Lunch', 'late': 'Late', 'absent': 'Absent', 'on-time': 'On Time' }
  return map[status] || status
}

const calculateLateMinutes = (ticket) => {
  const now = new Date()
  const [expHour, expMin] = ticket.expectedReturn.split(':').map(Number)
  const expDate = new Date()
  expDate.setHours(expHour, expMin, 0, 0)
  return now > expDate ? Math.floor((now - expDate) / 60000) : 0
}

// Form models
const deptForm = ref({ departmentId: null, checkIn: '', checkOut: '', lunchDuration: null, overtimeAfter: '' })
const employeeForm = ref({ employeeId: null, checkIn: '', checkOut: '', lunchDuration: null, overtimeAfter: '' })
const ticketForm = ref({ employeeId: null, lunchDuration: 40, expectedReturn: '', reason: 'meeting' })
const lateNightForm = ref({ employeeId: null, date: new Date().toISOString().split('T')[0], workedUntil: '', adjustedCheckIn: '' })
const fieldWorkForm = ref({ employeeId: null, durationType: 'today', startDate: new Date().toISOString().split('T')[0], endDate: '', noOfficeCheckin: false })
const nightDeptForm = ref({ departmentId: null, checkIn: '', checkOut: '', dinnerStart: '', dinnerDuration: null })
const nightEmployeeForm = ref({ employeeId: null, checkIn: '', checkOut: '', dinnerStart: '', dinnerDuration: null })

// Day Config
const dayConfig = ref({
  companyDefaults: { defaultCheckIn: '06:20', defaultCheckOut: '18:00' },
  lateThreshold: 5, absentAfterMinutes: 60,
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  departmentOverrides: [], employeeOverrides: [],
  lunchConfig: { startTime: '12:00', defaultDuration: 40 },
  overtime: { weekdayRate: 1.5, weekendRate: 2.0, holidayRate: 2.5 },
  lateNightOTRules: { activeAdjustments: [], history: [] },
  fieldWorkRules: { activeFieldWork: [], history: [] }
})

// Night Config
const nightConfig = ref({
  companyDefaults: { defaultCheckIn: '22:00', defaultCheckOut: '06:00', checkOutDayOffset: 1 },
  lateThreshold: 5, workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  departmentOverrides: [], employeeOverrides: [],
  dinnerBreak: { defaultStart: '02:00', defaultDuration: 40 },
  overtime: { weekdayRate: 1.5, weekendRate: 2.0, holidayRate: 2.5 }
})

// Active lunch tickets
const activeTickets = ref([])
const ticketHistory = ref([])
let nextTicketId = 1

// Computed
const filteredHistoryTickets = computed(() => {
  let filtered = [...ticketHistory.value]
  if (historyFilters.value.search) filtered = filtered.filter(t => t.employeeName.toLowerCase().includes(historyFilters.value.search.toLowerCase()))
  if (historyFilters.value.status) filtered = filtered.filter(t => t.status === historyFilters.value.status)
  return filtered
})
const historyTotalPages = computed(() => Math.ceil(filteredHistoryTickets.value.length / historyPageSize))
const paginatedHistoryTickets = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize
  return filteredHistoryTickets.value.slice(start, start + historyPageSize)
})

// Watch
watch(() => ticketForm.value.employeeId, (newId) => {
  if (newId) {
    const duration = getEmployeeLunchDuration(newId)
    ticketForm.value.lunchDuration = duration
    const now = new Date()
    const expected = new Date(now.getTime() + duration * 60000)
    ticketForm.value.expectedReturn = `${String(expected.getHours()).padStart(2, '0')}:${String(expected.getMinutes()).padStart(2, '0')}`
  }
})

const updateCurrentTime = () => {
  const now = new Date()
  currentTimeDisplay.value = formatTimeDisplay(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
}

// Ticket Methods
const openTicketModal = () => {
  ticketForm.value = { employeeId: null, lunchDuration: dayConfig.value.lunchConfig.defaultDuration, expectedReturn: '', reason: 'meeting' }
  showTicketModal.value = true
}
const closeTicketModal = () => { showTicketModal.value = false }
const issueTicket = () => {
  if (!ticketForm.value.employeeId) { addToast('Select employee', 'error'); return }
  const employee = mockEmployees.value.find(e => e.id === ticketForm.value.employeeId)
  const now = new Date()
  const newTicket = {
    id: nextTicketId++, employeeId: employee.id, employeeName: employee.name, department: employee.department,
    date: now.toISOString().split('T')[0], breakOutTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    expectedReturn: ticketForm.value.expectedReturn, lunchDuration: ticketForm.value.lunchDuration,
    status: 'active', issuedAt: now.toISOString(), reason: ticketForm.value.reason
  }
  activeTickets.value.push(newTicket)
  addToast(`Lunch ticket issued to ${employee.name}`, 'success')
  closeTicketModal()
}
const returnFromLunch = (ticketId) => {
  const ticket = activeTickets.value.find(t => t.id === ticketId)
  if (ticket) {
    const now = new Date()
    const actualReturn = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const [expHour, expMin] = ticket.expectedReturn.split(':').map(Number)
    const [actHour, actMin] = actualReturn.split(':').map(Number)
    const expDate = new Date(); expDate.setHours(expHour, expMin, 0, 0)
    const actDate = new Date(); actDate.setHours(actHour, actMin, 0, 0)
    let lateMinutes = 0, status = 'on-time'
    if (actDate > expDate) {
      lateMinutes = Math.floor((actDate - expDate) / 60000)
      status = lateMinutes > (dayConfig.value.absentAfterMinutes || 60) ? 'absent' : 'late'
    }
    ticketHistory.value.unshift({ ...ticket, actualReturn, status, lateMinutes: lateMinutes || null, completedAt: now.toISOString() })
    activeTickets.value = activeTickets.value.filter(t => t.id !== ticketId)
    addToast(`${ticket.employeeName} returned ${status === 'late' ? `${lateMinutes} min late` : status}`, status === 'late' ? 'warning' : 'success')
  }
}
const resetHistoryFilters = () => { historyFilters.value = { search: '', status: '' }; historyPage.value = 1 }
const checkLunchStatus = () => {
  const now = new Date()
  const absentAfter = dayConfig.value.absentAfterMinutes || 60
  activeTickets.value.forEach(ticket => {
    const [expHour, expMin] = ticket.expectedReturn.split(':').map(Number)
    const expDate = new Date(); expDate.setHours(expHour, expMin, 0, 0)
    if (now > expDate && ticket.status === 'active') {
      const lateMinutes = Math.floor((now - expDate) / 60000)
      if (lateMinutes > absentAfter) { ticket.status = 'absent'; addToast(`${ticket.employeeName} marked absent for exceeding lunch break`, 'error') }
      else if (lateMinutes > 0) { ticket.status = 'late' }
    }
  })
}

// Department Methods
const openDeptModal = () => { editingDept.value = null; deptForm.value = { departmentId: null, checkIn: '', checkOut: '', lunchDuration: null, overtimeAfter: '' }; showDeptModal.value = true }
const editDeptOverride = (dept) => { editingDept.value = dept; deptForm.value = { ...dept }; showDeptModal.value = true }
const closeDeptModal = () => { showDeptModal.value = false; editingDept.value = null }
const saveDeptOverride = () => {
  if (!deptForm.value.departmentId) { addToast('Select department', 'error'); return }
  const dept = mockDepartments.value.find(d => d.id === deptForm.value.departmentId)
  if (editingDept.value) {
    const index = dayConfig.value.departmentOverrides.findIndex(d => d.departmentId === editingDept.value.departmentId)
    dayConfig.value.departmentOverrides[index] = { ...deptForm.value, departmentName: dept?.name }
    addToast('Department override updated', 'success')
  } else {
    dayConfig.value.departmentOverrides.push({ ...deptForm.value, departmentName: dept?.name })
    addToast('Department override added', 'success')
  }
  closeDeptModal()
}
const confirmDeleteDept = (dept) => { deleteItem.value = { id: dept.departmentId, name: dept.departmentName, type: 'department' }; deleteType.value = 'department'; showConfirmModal.value = true }

// Employee Methods
const openEmployeeModal = () => { editingEmployee.value = null; employeeForm.value = { employeeId: null, checkIn: '', checkOut: '', lunchDuration: null, overtimeAfter: '' }; showEmployeeModal.value = true }
const editEmployeeOverride = (emp) => { editingEmployee.value = emp; employeeForm.value = { ...emp }; showEmployeeModal.value = true }
const closeEmployeeModal = () => { showEmployeeModal.value = false; editingEmployee.value = null }
const saveEmployeeOverride = () => {
  if (!employeeForm.value.employeeId) { addToast('Select employee', 'error'); return }
  const emp = mockEmployees.value.find(e => e.id === employeeForm.value.employeeId)
  if (editingEmployee.value) {
    const index = dayConfig.value.employeeOverrides.findIndex(e => e.employeeId === editingEmployee.value.employeeId)
    dayConfig.value.employeeOverrides[index] = { ...employeeForm.value, employeeName: emp?.name, department: emp?.department }
    addToast('Employee override updated', 'success')
  } else {
    dayConfig.value.employeeOverrides.push({ ...employeeForm.value, employeeName: emp?.name, department: emp?.department })
    addToast('Employee override added', 'success')
  }
  closeEmployeeModal()
}
const confirmDeleteEmployee = (emp) => { deleteItem.value = { id: emp.employeeId, name: emp.employeeName, type: 'employee' }; deleteType.value = 'employee'; showConfirmModal.value = true }

// Late Night Methods
const openLateNightModal = () => { lateNightForm.value = { employeeId: null, date: new Date().toISOString().split('T')[0], workedUntil: '', adjustedCheckIn: '' }; showLateNightModal.value = true }
const closeLateNightModal = () => { showLateNightModal.value = false }
const addLateNightAdjustment = () => {
  if (!lateNightForm.value.employeeId) { addToast('Select employee', 'error'); return }
  const employee = mockEmployees.value.find(e => e.id === lateNightForm.value.employeeId)
  dayConfig.value.lateNightOTRules.activeAdjustments.push({ ...lateNightForm.value, employeeName: employee.name, department: employee.department })
  addToast(`Late night adjustment added for ${employee.name}`, 'success')
  closeLateNightModal()
}
const confirmDeleteAdjustment = (adj) => { deleteItem.value = { id: adj.employeeId, name: adj.employeeName, type: 'adjustment' }; deleteType.value = 'adjustment'; showConfirmModal.value = true }

// Field Work Methods
const openFieldWorkModal = () => { fieldWorkForm.value = { employeeId: null, durationType: 'today', startDate: new Date().toISOString().split('T')[0], endDate: '', noOfficeCheckin: false }; showFieldWorkModal.value = true }
const closeFieldWorkModal = () => { showFieldWorkModal.value = false }
const registerFieldWork = () => {
  if (!fieldWorkForm.value.employeeId) { addToast('Select employee', 'error'); return }
  const employee = mockEmployees.value.find(e => e.id === fieldWorkForm.value.employeeId)
  let endDate = null
  if (fieldWorkForm.value.durationType === 'today') endDate = fieldWorkForm.value.startDate
  else if (fieldWorkForm.value.durationType === 'range') endDate = fieldWorkForm.value.endDate
  dayConfig.value.fieldWorkRules.activeFieldWork.push({
    id: Date.now(), employeeId: employee.id, employeeName: employee.name, department: employee.department,
    durationType: fieldWorkForm.value.durationType, startDate: fieldWorkForm.value.startDate, endDate,
    noOfficeCheckin: fieldWorkForm.value.noOfficeCheckin, status: 'active', registeredAt: new Date().toISOString()
  })
  addToast(`${employee.name} registered for field work`, 'success')
  closeFieldWorkModal()
}
const completeFieldWork = (id) => {
  const fw = dayConfig.value.fieldWorkRules.activeFieldWork.find(f => f.id === id)
  if (fw) {
    dayConfig.value.fieldWorkRules.history.push({ ...fw, completedAt: new Date().toISOString() })
    dayConfig.value.fieldWorkRules.activeFieldWork = dayConfig.value.fieldWorkRules.activeFieldWork.filter(f => f.id !== id)
    addToast(`Field work completed for ${fw.employeeName}`, 'success')
  }
}
const deleteFieldWork = (id) => { deleteItem.value = { id, name: 'field work record', type: 'fieldwork' }; deleteType.value = 'fieldwork'; showConfirmModal.value = true }

// Night Methods
const openNightDeptModal = () => { editingNightDept.value = null; nightDeptForm.value = { departmentId: null, checkIn: '', checkOut: '', dinnerStart: '', dinnerDuration: null }; showNightDeptModal.value = true }
const editNightDeptOverride = (dept) => { editingNightDept.value = dept; nightDeptForm.value = { ...dept }; showNightDeptModal.value = true }
const closeNightDeptModal = () => { showNightDeptModal.value = false; editingNightDept.value = null }
const saveNightDeptOverride = () => {
  if (!nightDeptForm.value.departmentId) { addToast('Select department', 'error'); return }
  const dept = mockDepartments.value.find(d => d.id === nightDeptForm.value.departmentId)
  if (editingNightDept.value) {
    const index = nightConfig.value.departmentOverrides.findIndex(d => d.departmentId === editingNightDept.value.departmentId)
    nightConfig.value.departmentOverrides[index] = { ...nightDeptForm.value, departmentName: dept?.name }
    addToast('Night department updated', 'success')
  } else {
    nightConfig.value.departmentOverrides.push({ ...nightDeptForm.value, departmentName: dept?.name })
    addToast('Night department added', 'success')
  }
  closeNightDeptModal()
}
const confirmDeleteNightDept = (dept) => { deleteItem.value = { id: dept.departmentId, name: dept.departmentName, type: 'nightDept' }; deleteType.value = 'nightDept'; showConfirmModal.value = true }

const openNightEmployeeModal = () => { editingNightEmployee.value = null; nightEmployeeForm.value = { employeeId: null, checkIn: '', checkOut: '', dinnerStart: '', dinnerDuration: null }; showNightEmployeeModal.value = true }
const editNightEmployeeOverride = (emp) => { editingNightEmployee.value = emp; nightEmployeeForm.value = { ...emp }; showNightEmployeeModal.value = true }
const closeNightEmployeeModal = () => { showNightEmployeeModal.value = false; editingNightEmployee.value = null }
const saveNightEmployeeOverride = () => {
  if (!nightEmployeeForm.value.employeeId) { addToast('Select employee', 'error'); return }
  const emp = mockEmployees.value.find(e => e.id === nightEmployeeForm.value.employeeId)
  if (editingNightEmployee.value) {
    const index = nightConfig.value.employeeOverrides.findIndex(e => e.employeeId === editingNightEmployee.value.employeeId)
    nightConfig.value.employeeOverrides[index] = { ...nightEmployeeForm.value, employeeName: emp?.name, department: emp?.department }
    addToast('Night employee updated', 'success')
  } else {
    nightConfig.value.employeeOverrides.push({ ...nightEmployeeForm.value, employeeName: emp?.name, department: emp?.department })
    addToast('Night employee added', 'success')
  }
  closeNightEmployeeModal()
}
const confirmDeleteNightEmployee = (emp) => { deleteItem.value = { id: emp.employeeId, name: emp.employeeName, type: 'nightEmployee' }; deleteType.value = 'nightEmployee'; showConfirmModal.value = true }

// Confirmation Methods
const closeConfirmModal = () => { showConfirmModal.value = false; deleteItem.value = null; deleteType.value = '' }
const executeDelete = () => {
  if (deleteType.value === 'department') dayConfig.value.departmentOverrides = dayConfig.value.departmentOverrides.filter(d => d.departmentId !== deleteItem.value.id)
  else if (deleteType.value === 'employee') dayConfig.value.employeeOverrides = dayConfig.value.employeeOverrides.filter(e => e.employeeId !== deleteItem.value.id)
  else if (deleteType.value === 'adjustment') dayConfig.value.lateNightOTRules.activeAdjustments = dayConfig.value.lateNightOTRules.activeAdjustments.filter(a => a.employeeId !== deleteItem.value.id)
  else if (deleteType.value === 'fieldwork') dayConfig.value.fieldWorkRules.activeFieldWork = dayConfig.value.fieldWorkRules.activeFieldWork.filter(f => f.id !== deleteItem.value.id)
  else if (deleteType.value === 'nightDept') nightConfig.value.departmentOverrides = nightConfig.value.departmentOverrides.filter(d => d.departmentId !== deleteItem.value.id)
  else if (deleteType.value === 'nightEmployee') nightConfig.value.employeeOverrides = nightConfig.value.employeeOverrides.filter(e => e.employeeId !== deleteItem.value.id)
  addToast('Item deleted', 'success')
  closeConfirmModal()
}

// General Methods
const saveAllConfig = () => {
  console.log('Saving config:', { dayShift: dayConfig.value, nightShift: nightConfig.value, activeTickets: activeTickets.value, ticketHistory: ticketHistory.value })
  addToast('All configuration saved successfully', 'success')
}
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
}

// Initialize
onMounted(() => {
  lunchCheckInterval = setInterval(checkLunchStatus, 60000)
  timeInterval = setInterval(updateCurrentTime, 1000)
  updateCurrentTime()
})
onUnmounted(() => {
  if (lunchCheckInterval) clearInterval(lunchCheckInterval)
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
/* All styles from previous version remain */
.attendance-config { padding: 24px; min-height: 100vh; background: #f5f7fb; }
.config-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
.config-header h1 { font-size: 24px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.config-header p { color: #64748b; font-size: 14px; }
.header-actions { display: flex; gap: 16px; }
.btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; font-size: 14px; transition: all 0.2s; }
.btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
.btn-primary-small { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-primary-small:hover { background: #4f46e5; }

/* Main Shift Tabs */
.shift-tabs { display: flex; gap: 12px; margin-bottom: 24px; background: white; padding: 6px; border-radius: 12px; width: fit-content; border: 1px solid #e2e8f0; }
.shift-tabs button { display: flex; align-items: center; gap: 8px; padding: 10px 28px; border: none; background: transparent; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; color: #64748b; transition: all 0.2s; }
.shift-tabs button svg { width: 18px; height: 18px; }
.shift-tabs button.active { background: #6366f1; color: white; }

/* Sub Tabs */
.sub-tabs { display: flex; gap: 8px; margin-bottom: 20px; background: #f8fafc; padding: 4px; border-radius: 10px; border: 1px solid #e2e8f0; flex-wrap: wrap; }
.sub-tabs button { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; background: transparent; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; color: #64748b; transition: all 0.2s; }
.sub-tabs button svg { width: 14px; height: 14px; }
.sub-tabs button.active { background: #6366f1; color: white; }

.config-card { background: white; border-radius: 12px; margin-bottom: 24px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.card-header h3 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; }
.badge { font-size: 11px; padding: 4px 10px; background: #e0e7ff; color: #4f46e5; border-radius: 20px; }
.card-body { padding: 24px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
.form-input, .form-select { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.form-input:focus, .form-select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
small { font-size: 11px; color: #64748b; display: block; margin-top: 6px; }
.checkbox-group { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 8px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
.radio-group { display: flex; gap: 24px; margin-top: 8px; }
.radio-label { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
.btn-icon { width: 34px; height: 34px; border-radius: 8px; background: #f1f5f9; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-icon:hover { background: #e2e8f0; }
.btn-icon svg { width: 18px; height: 18px; color: #6366f1; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; background: none; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.edit:hover { background: #3b82f640; }
.action-btn.delete { background: #ef444420; color: #ef4444; }
.action-btn.delete:hover { background: #ef444440; }
.action-btn.checkin { background: #10b98120; color: #10b981; }
.action-btn.checkin:hover { background: #10b98140; }
.actions { display: flex; gap: 10px; align-items: center; }
.add-btn { width: 100%; padding: 10px; background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; cursor: pointer; color: #6366f1; margin-top: 12px; font-size: 13px; font-weight: 500; transition: all 0.2s; }
.add-btn:hover { background: #e2e8f0; border-color: #6366f1; }
.section-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 16px; margin-top: 8px; }
.filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.search-box { flex: 1; position: relative; min-width: 220px; }
.search-box svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }
.search-input { width: 100%; padding: 10px 12px 10px 38px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; }
.filter-select { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; font-size: 13px; min-width: 130px; }
.filter-btn { padding: 10px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; }
.filter-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
.table-responsive { overflow-x: auto; margin-top: 8px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.data-table th { background: #f8fafc; font-weight: 600; color: #475569; }
.data-table tr:hover { background: #f8fafc; }
.empty { text-align: center; padding: 48px !important; color: #94a3b8; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.status-badge.active { background: #fef3c7; color: #d97706; }
.status-badge.late { background: #fed7aa; color: #ea580c; }
.status-badge.absent { background: #fee2e2; color: #dc2626; }
.status-badge.on-time { background: #d1fae5; color: #059669; }
.status-badge.field { background: #e0e7ff; color: #4f46e5; }
.duration-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.duration-badge.today { background: #dbeafe; color: #2563eb; }
.duration-badge.range { background: #fef3c7; color: #d97706; }
.duration-badge.permanent { background: #d1fae5; color: #059669; }
.late-minutes { font-weight: 600; color: #dc2626; }
.info-note { padding: 10px 14px; background: #fef3c7; border-radius: 8px; color: #d97706; font-size: 12px; margin-bottom: 16px; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding: 12px; }
.page-btn { padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; }
.page-btn:hover:not(:disabled) { background: #f8fafc; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 16px; width: 90%; max-width: 550px; max-height: 85vh; overflow-y: auto; }
.delete-modal { max-width: 420px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { font-size: 18px; font-weight: 600; color: #1e293b; }
.close { background: none; border: none; font-size: 28px; cursor: pointer; color: #94a3b8; transition: color 0.2s; }
.close:hover { color: #ef4444; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px 24px; border-top: 1px solid #e2e8f0; }
.btn-cancel { padding: 10px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-cancel:hover { background: #f8fafc; }
.btn-save { padding: 10px 24px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-save:hover { background: #4f46e5; }
.btn-delete { padding: 10px 24px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
.btn-delete:hover { background: #dc2626; }
.delete-warning { text-align: center; padding: 20px; }
.delete-warning svg { width: 48px; height: 48px; color: #ef4444; margin-bottom: 16px; }
.delete-warning p { margin: 12px 0; color: #475569; }
.warning-text { font-size: 12px; color: #94a3b8; }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 1100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; animation: slideIn 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.toast.success { background: #10b981; color: white; }
.toast.error { background: #ef4444; color: white; }
.toast.warning { background: #f59e0b; color: white; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@media (max-width: 768px) {
  .attendance-config { padding: 16px; }
  .shift-tabs { width: 100%; overflow-x: auto; }
  .shift-tabs button { flex: 1; justify-content: center; padding: 8px 16px; }
  .sub-tabs { width: 100%; overflow-x: auto; }
  .sub-tabs button { flex: 1; justify-content: center; padding: 6px 12px; }
  .form-row { grid-template-columns: 1fr; }
  .filters-bar { flex-direction: column; }
  .search-box { width: 100%; }
  .radio-group { flex-direction: column; gap: 12px; }
  .modal { width: 95%; }
}
</style>

