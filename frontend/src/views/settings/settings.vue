<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <h1>System Settings</h1>
      <p>Manage departments, positions, roles, attendance rules, and tax rules</p>
    </div>

    <!-- Main Tabs -->
    <div class="settings-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id; loadTabData(tab.id)"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else>
      <!-- ==================== DEPARTMENTS ==================== -->
      <div v-if="activeTab === 'departments'" class="settings-card">
        <div class="card-header">
          <h2>Departments</h2>
          <button class="btn-add" @click="openDepartmentModal()">+ Add Department</button>
        </div>
        
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Manager</th>
                <th>Status</th>
                <th style="width: 100px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dept in departments" :key="dept.departmentId">
                <td>{{ dept.code }}</td>
                <td>{{ dept.name }}</td>
                <td>{{ dept.manager?.fullName || dept.managerName || '-' }}</td>
                <td>
                  <button 
                    @click="toggleDepartmentStatus(dept)"
                    :class="['status-toggle', dept.isActive ? 'active' : 'inactive']"
                  >
                    <span class="status-dot"></span>
                    {{ dept.isActive ? 'Active' : 'Inactive' }}
                  </button>
                </td>
                <td class="actions">
                  <button class="action-btn edit" @click="openDepartmentModal(dept)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                    </svg>
                  </button>
                  <button class="action-btn delete" @click="confirmDelete('department', dept)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="departments.length === 0">
                <td colspan="5" class="empty">No departments found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== POSITIONS ==================== -->
      <div v-if="activeTab === 'positions'" class="settings-card">
        <div class="card-header">
          <h2>Positions</h2>
          <button class="btn-add" @click="openPositionModal()">+ Add Position</button>
        </div>
        
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Department</th>
                <th>Level</th>
                <th>Status</th>
                <th style="width: 100px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="position in positions" :key="position.positionId">
                <td>{{ position.code }}</td>
                <td>{{ position.title }}</td>
                <td>{{ getDepartmentName(position.departmentId) }}</td>
                <td>{{ position.level || '-' }}</td>
                <td>
                  <button 
                    @click="togglePositionStatus(position)"
                    :class="['status-toggle', position.isActive ? 'active' : 'inactive']"
                  >
                    <span class="status-dot"></span>
                    {{ position.isActive ? 'Active' : 'Inactive' }}
                  </button>
                </td>
                <td class="actions">
                  <button class="action-btn edit" @click="openPositionModal(position)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                    </svg>
                  </button>
                  <button class="action-btn delete" @click="confirmDelete('position', position)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="positions.length === 0">
                <td colspan="6" class="empty">No positions found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== ROLES ==================== -->
      <div v-if="activeTab === 'roles'" class="settings-card">
        <div class="card-header">
          <h2>Roles</h2>
          <button class="btn-add" @click="openRoleModal()">+ Add Role</button>
        </div>
        
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th style="width: 100px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="role in roles" :key="role.roleId">
                <td>{{ role.name }}</td>
                <td>{{ role.description || '-' }}</td>
                <td>
                  <button 
                    @click="toggleRoleStatus(role)"
                    :class="['status-toggle', role.isActive ? 'active' : 'inactive']"
                  >
                    <span class="status-dot"></span>
                    {{ role.isActive ? 'Active' : 'Inactive' }}
                  </button>
                </td>
                <td class="actions">
                  <button class="action-btn edit" @click="openRoleModal(role)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                    </svg>
                  </button>
                  <button class="action-btn delete" @click="confirmDelete('role', role)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="roles.length === 0">
                <td colspan="4" class="empty">No roles found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== ATTENDANCE RULES ==================== -->
      <div v-if="activeTab === 'attendance'" class="settings-card">
        <div class="card-header">
          <h2>Attendance Rules</h2>
          <button class="btn-save" @click="saveAttendanceRules" :disabled="savingRules">Save Rules</button>
        </div>
        
        <!-- Sub Tabs -->
        <div class="sub-tabs">
          <button 
            v-for="subTab in attendanceSubTabs" 
            :key="subTab.id"
            @click="attendanceSubTab = subTab.id"
            :class="{ active: attendanceSubTab === subTab.id }"
          >
            {{ subTab.name }}
          </button>
        </div>

        <div class="rules-container">
          <!-- Work Schedule -->
          <div v-if="attendanceSubTab === 'workSchedule'" class="rule-section">
            <h3>⏰ Work Schedule</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Expected Check-In</label>
                <input type="time" v-model="attendanceRules.workSchedule.expectedCheckIn">
              </div>
              <div class="rule-item">
                <label>Expected Check-Out</label>
                <input type="time" v-model="attendanceRules.workSchedule.expectedCheckOut">
              </div>
              <div class="rule-item">
                <label>Late Threshold (minutes)</label>
                <input type="number" v-model="attendanceRules.workSchedule.lateThreshold">
              </div>
              <div class="rule-item">
                <label>Grace Period (minutes)</label>
                <input type="number" v-model="attendanceRules.workSchedule.gracePeriod">
              </div>
              <div class="rule-item">
                <label>Early Departure Threshold</label>
                <input type="number" v-model="attendanceRules.workSchedule.earlyDepartureThreshold">
              </div>
              <div class="rule-item">
                <label>Minimum Work Hours</label>
                <input type="number" step="0.5" v-model="attendanceRules.workSchedule.minWorkHours">
              </div>
            </div>
            
            <h3 style="margin-top: 24px">📅 Working Days</h3>
            <div class="checkbox-group">
              <label v-for="day in weekDays" :key="day.value" class="checkbox-label">
                <input type="checkbox" :value="day.value" v-model="attendanceRules.workSchedule.workingDays">
                {{ day.label }}
              </label>
            </div>
          </div>

          <!-- Break Rules -->
          <div v-if="attendanceSubTab === 'breakRules'" class="rule-section">
            <h3>🍽️ Break & Lunch Rules</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Lunch Start</label>
                <input type="time" v-model="attendanceRules.breakRules.lunchStart">
              </div>
              <div class="rule-item">
                <label>Lunch End</label>
                <input type="time" v-model="attendanceRules.breakRules.lunchEnd">
              </div>
              <div class="rule-item">
                <label>Lunch Duration (minutes)</label>
                <input type="number" v-model="attendanceRules.breakRules.lunchDuration">
              </div>
              <div class="rule-item">
                <label>Is Lunch Paid?</label>
                <select v-model="attendanceRules.breakRules.isLunchPaid">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
              <div class="rule-item">
                <label>Morning Break (minutes)</label>
                <input type="number" v-model="attendanceRules.breakRules.morningBreak">
              </div>
              <div class="rule-item">
                <label>Afternoon Break (minutes)</label>
                <input type="number" v-model="attendanceRules.breakRules.afternoonBreak">
              </div>
            </div>
          </div>

          <!-- Overtime Rules -->
          <div v-if="attendanceSubTab === 'overtimeRules'" class="rule-section">
            <h3>💰 Overtime Rules</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Overtime Threshold (hours/day)</label>
                <input type="number" step="0.5" v-model="attendanceRules.overtimeRules.threshold">
              </div>
              <div class="rule-item">
                <label>Normal OT Rate (multiplier)</label>
                <input type="number" step="0.1" v-model="attendanceRules.overtimeRules.normalOTRate">
              </div>
              <div class="rule-item">
                <label>Weekend Rate</label>
                <input type="number" step="0.1" v-model="attendanceRules.overtimeRules.weekendOTRate">
              </div>
              <div class="rule-item">
                <label>Holiday Rate</label>
                <input type="number" step="0.1" v-model="attendanceRules.overtimeRules.holidayOTRate">
              </div>
              <div class="rule-item">
                <label>Max Overtime/Day</label>
                <input type="number" v-model="attendanceRules.overtimeRules.maxPerDay">
              </div>
              <div class="rule-item">
                <label>Max Overtime/Week</label>
                <input type="number" v-model="attendanceRules.overtimeRules.maxPerWeek">
              </div>
            </div>
          </div>

          <!-- Leave Types -->
          <div v-if="attendanceSubTab === 'leaveTypes'" class="rule-section">
            <div class="rule-subsection">
              <h3>🌴 Annual Leave</h3>
              <div class="rule-grid">
                <div class="rule-item">
                  <label>Base Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.annualLeave.baseDays">
                </div>
                <div class="rule-item">
                  <label>Increment Interval (years)</label>
                  <input type="number" v-model="attendanceRules.leaveRules.annualLeave.incrementInterval">
                </div>
                <div class="rule-item">
                  <label>Carry Over Limit</label>
                  <input type="number" v-model="attendanceRules.leaveRules.annualLeave.carryOverLimit">
                </div>
                <div class="rule-item">
                  <label>Carry Over Expiry (years)</label>
                  <input type="number" v-model="attendanceRules.leaveRules.annualLeave.carryOverExpiryYears">
                </div>
              </div>
            </div>

            <div class="rule-subsection">
              <h3>🤒 Sick Leave</h3>
              <div class="rule-grid">
                <div class="rule-item">
                  <label>Doctor Note After (days)</label>
                  <input type="number" v-model="attendanceRules.leaveRules.sickLeave.requiresDoctorNoteAfter">
                </div>
                <div class="rule-item">
                  <label>Alert Threshold</label>
                  <input type="number" v-model="attendanceRules.leaveRules.sickLeave.alertThreshold">
                </div>
              </div>
            </div>

            <div class="rule-subsection">
              <h3>👶 Maternity Leave</h3>
              <div class="rule-grid">
                <div class="rule-item">
                  <label>Default Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.maternityLeave.defaultDays">
                </div>
                <div class="rule-item">
                  <label>Is Paid?</label>
                  <select v-model="attendanceRules.leaveRules.maternityLeave.isPaid">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
                <div class="rule-item">
                  <label>Min Notice Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.maternityLeave.minNoticeDays">
                </div>
              </div>
            </div>

            <div class="rule-subsection">
              <h3>👨 Paternity Leave</h3>
              <div class="rule-grid">
                <div class="rule-item">
                  <label>Default Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.paternityLeave.defaultDays">
                </div>
                <div class="rule-item">
                  <label>Min Notice Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.paternityLeave.minNoticeDays">
                </div>
              </div>
            </div>

            <div class="rule-subsection">
              <h3>💔 Bereavement Leave</h3>
              <div class="rule-grid">
                <div class="rule-item">
                  <label>Default Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.bereavementLeave.defaultDays">
                </div>
                <div class="rule-item">
                  <label>Immediate Family Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.bereavementLeave.immediateFamilyDays">
                </div>
              </div>
              <div class="rule-item" style="margin-top: 12px">
                <label>Eligible Relationships</label>
                <input type="text" :value="attendanceRules.leaveRules.bereavementLeave.eligibleRelationships.join(', ')" 
                       @input="updateEligibleRelationships">
              </div>
            </div>

            <div class="rule-subsection">
              <h3>💰 Unpaid Leave</h3>
              <div class="rule-grid">
                <div class="rule-item">
                  <label>Is Paid?</label>
                  <select v-model="attendanceRules.leaveRules.unpaidLeave.isPaid">
                    <option :value="false">No (Unpaid)</option>
                    <option :value="true">Yes</option>
                  </select>
                </div>
                <div class="rule-item">
                  <label>Requires Approval?</label>
                  <select v-model="attendanceRules.leaveRules.unpaidLeave.requiresApproval">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
                <div class="rule-item">
                  <label>Requires Director Approval?</label>
                  <select v-model="attendanceRules.leaveRules.unpaidLeave.requiresDirectorApproval">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
                <div class="rule-item">
                  <label>Min Notice Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.unpaidLeave.minNoticeDays">
                </div>
                <div class="rule-item">
                  <label>Max Consecutive Days</label>
                  <input type="number" v-model="attendanceRules.leaveRules.unpaidLeave.maxConsecutiveDays">
                </div>
                <div class="rule-item">
                  <label>Max Per Year</label>
                  <input type="number" v-model="attendanceRules.leaveRules.unpaidLeave.maxPerYear">
                </div>
                <div class="rule-item">
                  <label>Requires Reason?</label>
                  <select v-model="attendanceRules.leaveRules.unpaidLeave.requiresReason">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Validation -->
          <div v-if="attendanceSubTab === 'validation'" class="rule-section">
            <h3>✓ Validation Rules</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Min Days Per Request</label>
                <input type="number" v-model="attendanceRules.leaveRules.validation.minDaysPerRequest">
              </div>
              <div class="rule-item">
                <label>Max Days Per Request</label>
                <input type="number" v-model="attendanceRules.leaveRules.validation.maxDaysPerRequest">
              </div>
              <div class="rule-item">
                <label>Max Concurrent Employees</label>
                <input type="number" v-model="attendanceRules.leaveRules.validation.maxConcurrentEmployees">
              </div>
              <div class="rule-item">
                <label>Overlap Allowed?</label>
                <select v-model="attendanceRules.leaveRules.validation.overlapAllowed">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
              <div class="rule-item">
                <label>Future Date Only?</label>
                <select v-model="attendanceRules.leaveRules.validation.futureDateOnly">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Extensions & Return -->
          <div v-if="attendanceSubTab === 'extensions'" class="rule-section">
            <h3>➕ Extensions</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Max Extensions Per Leave</label>
                <input type="number" v-model="attendanceRules.extensions.maxExtensionsPerLeave">
              </div>
              <div class="rule-item">
                <label>Max Total Extension Days</label>
                <input type="number" v-model="attendanceRules.extensions.maxTotalExtensionDays">
              </div>
            </div>

            <h3 style="margin-top: 24px">🔄 Return Tracking</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Enabled?</label>
                <select v-model="attendanceRules.returnTracking.enabled">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
              <div class="rule-item">
                <label>Grace Period (hours)</label>
                <input type="number" v-model="attendanceRules.returnTracking.gracePeriodHours">
              </div>
            </div>
          </div>

          <!-- Workflow -->
          <div v-if="attendanceSubTab === 'workflow'" class="rule-section">
            <h3>✅ Approval Workflow</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Requires Manager Approval?</label>
                <select v-model="attendanceRules.approvalWorkflow.requiresManagerApproval">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
              <div class="rule-item">
                <label>Requires HR Approval?</label>
                <select v-model="attendanceRules.approvalWorkflow.requiresHrApproval">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
              <div class="rule-item">
                <label>Auto Approve Threshold (days)</label>
                <input type="number" v-model="attendanceRules.approvalWorkflow.autoApproveThresholdDays">
              </div>
            </div>
            <div class="rule-item" style="margin-top: 12px">
              <label>Approval Chain</label>
              <input type="text" :value="attendanceRules.approvalWorkflow.approvalChain.join(', ')" 
                     @input="updateApprovalChain">
            </div>

            <h3 style="margin-top: 24px">📅 Year End Processing</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Processing Date</label>
                <input type="date" v-model="attendanceRules.yearEndProcessing.processingDate">
              </div>
              <div class="rule-item">
                <label>Auto Carry Over?</label>
                <select v-model="attendanceRules.yearEndProcessing.autoCarryOver">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Notifications -->
          <div v-if="attendanceSubTab === 'notifications'" class="rule-section">
            <h3>🔔 Notifications</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Reminder Days Before</label>
                <input type="text" :value="attendanceRules.notifications.reminderDaysBefore.join(', ')" 
                       @input="updateReminderDays">
              </div>
              <div class="rule-item">
                <label>Overdue Alert Days</label>
                <input type="text" :value="attendanceRules.returnTracking.overdueAlertDays.join(', ')" 
                       @input="updateOverdueAlertDays">
              </div>
              <div class="rule-item">
                <label>Expiry Alert Days</label>
                <input type="text" :value="attendanceRules.notifications.expiryAlertDays.join(', ')" 
                       @input="updateExpiryAlertDays">
              </div>
              <div class="rule-item">
                <label>Channels</label>
                <select multiple v-model="attendanceRules.notifications.channels" style="height: 80px">
                  <option value="email">Email</option>
                  <option value="in_app">In-App</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Holidays -->
          <div v-if="attendanceSubTab === 'holidays'" class="rule-section">
            <h3>🎉 Holidays</h3>
            <div class="holidays-list">
              <div v-for="(holiday, index) in attendanceRules.holidayRules.holidays" :key="index" class="holiday-item">
                <input type="date" v-model="holiday.date" class="holiday-date">
                <input type="text" v-model="holiday.name" class="holiday-name" placeholder="Holiday name">
                <select v-model="holiday.type" class="holiday-type">
                  <option value="public">Public</option>
                  <option value="religious">Religious</option>
                  <option value="company">Company</option>
                </select>
                <button class="remove-holiday" @click="removeHoliday(index)">×</button>
              </div>
              <button class="add-holiday" @click="addHoliday">+ Add Holiday</button>
            </div>

            <h3 style="margin-top: 24px">🏔️ Field Work Rules</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Considered Present?</label>
                <select v-model="attendanceRules.fieldWorkRules.consideredPresent">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
              <div class="rule-item">
                <label>Default Hours</label>
                <input type="number" step="0.5" v-model="attendanceRules.fieldWorkRules.defaultHours">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== TAX RULES ==================== -->
      <div v-if="activeTab === 'tax'" class="settings-card">
        <div class="card-header">
          <h2>Tax Rules - Employment Income Tax (Schedule A)</h2>
          <button class="btn-save" @click="saveTaxRules" :disabled="savingTaxRules">Save Tax Rules</button>
        </div>

        <!-- Tax Sub Tabs -->
        <div class="sub-tabs">
          <button 
            v-for="subTab in taxSubTabs" 
            :key="subTab.id"
            @click="taxSubTab = subTab.id"
            :class="{ active: taxSubTab === subTab.id }"
          >
            {{ subTab.name }}
          </button>
        </div>

        <div class="rules-container">
          <!-- Tax Brackets -->
          <div v-if="taxSubTab === 'brackets'" class="rule-section">
            <h3>📊 Employment Income Tax Brackets</h3>
            <div class="tax-info-card">
              <p><strong>Formula:</strong> {{ taxRules.employmentTax?.calculationFormula || 'Tax = (Income × Rate ÷ 100) - Deduction' }}</p>
              <p><strong>Rounding:</strong> {{ taxRules.employmentTax?.roundingMethod || 'floor' }}</p>
              <p><strong>Effective From:</strong> {{ taxRules.effectiveFrom || '2024-01-01' }}</p>
              <p><strong>Version:</strong> {{ taxRules.version || '1.0' }}</p>
            </div>
            
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Min Income (ETB)</th>
                    <th>Max Income (ETB)</th>
                    <th>Rate (%)</th>
                    <th>Deduction (ETB)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bracket, index) in taxRules.employmentTax?.brackets" :key="index">
                    <td>
                      <input type="number" v-model="bracket.min" class="tax-input" :disabled="index === 0">
                    </td>
                    <td>
                      <input type="number" v-model="bracket.max" class="tax-input" :disabled="bracket.max === null">
                    </td>
                    <td>
                      <input type="number" v-model="bracket.rate" class="tax-input" step="1">
                    </td>
                    <td>
                      <input type="number" v-model="bracket.deduction" class="tax-input" step="0.01">
                    </td>
                    <td>
                      <input type="text" v-model="bracket.description" class="tax-input">
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pension Rules -->
          <div v-if="taxSubTab === 'pension'" class="rule-section">
            <h3>🏦 Pension Contribution Rules</h3>
            <div class="tax-info-card">
              <p><strong>Legal Reference:</strong> {{ taxRules.legalReference?.pensionProclamation || 'No. 715/2011 as amended by No. 908/2015' }}</p>
            </div>
            
            <div class="rule-grid">
              <div class="rule-item">
                <label>Employee Contribution Rate (%)</label>
                <input type="number" v-model="taxRules.pension.employeeRate" step="0.5" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Employer Contribution Rate (%)</label>
                <input type="number" v-model="taxRules.pension.employerRate" step="0.5" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Monthly Salary Cap (ETB)</label>
                <input type="number" v-model="taxRules.pension.monthlyCap" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Max Employee Contribution (ETB)</label>
                <input type="number" v-model="taxRules.pension.maxEmployeeContribution" class="tax-input" disabled>
                <small class="field-hint">Auto-calculated: {{ taxRules.pension.monthlyCap }} × {{ taxRules.pension.employeeRate }}%</small>
              </div>
              <div class="rule-item">
                <label>Max Employer Contribution (ETB)</label>
                <input type="number" v-model="taxRules.pension.maxEmployerContribution" class="tax-input" disabled>
                <small class="field-hint">Auto-calculated: {{ taxRules.pension.monthlyCap }} × {{ taxRules.pension.employerRate }}%</small>
              </div>
              <div class="rule-item">
                <label>Calculation Base</label>
                <select v-model="taxRules.pension.calculationBase" class="tax-input">
                  <option value="basic_salary_only">Basic Salary Only</option>
                  <option value="gross_salary">Gross Salary</option>
                </select>
              </div>
            </div>
            <div class="info-note">
              <strong>Note:</strong> {{ taxRules.pension.notes }}
            </div>
          </div>

          <!-- Exemptions -->
          <div v-if="taxSubTab === 'exemptions'" class="rule-section">
            <h3>✅ Tax Exemptions (Schedule E)</h3>
            
            <div class="rule-subsection">
              <h4>🚗 Transport Allowance Exemption</h4>
              <div class="rule-grid">
                <div class="rule-item">
                  <label>Is Exempt?</label>
                  <select v-model="taxRules.exemptions.transportAllowance.isExempt" class="tax-input">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
                <div class="rule-item">
                  <label>Max Exempt Amount (ETB)</label>
                  <input type="number" v-model="taxRules.exemptions.transportAllowance.maxExemptAmount" class="tax-input">
                </div>
                <div class="rule-item">
                  <label>Alternative Limit</label>
                  <input type="text" v-model="taxRules.exemptions.transportAllowance.alternativeLimit" class="tax-input" disabled>
                </div>
                <div class="rule-item">
                  <label>Calculation Method</label>
                  <input type="text" v-model="taxRules.exemptions.transportAllowance.calculationMethod" class="tax-input" disabled>
                </div>
              </div>
            </div>

            <div class="rule-subsection">
              <h4>🏥 Medical Reimbursement</h4>
              <div class="rule-item">
                <label>Is Exempt?</label>
                <select v-model="taxRules.exemptions.medicalReimbursement.isExempt" class="tax-input">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>

            <div class="rule-subsection">
              <h4>⛰️ Hardship Allowance</h4>
              <div class="rule-item">
                <label>Is Exempt?</label>
                <select v-model="taxRules.exemptions.hardshipAllowance.isExempt" class="tax-input">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>

            <div class="rule-subsection">
              <h4>✈️ Travel Reimbursement</h4>
              <div class="rule-item">
                <label>Is Exempt?</label>
                <select v-model="taxRules.exemptions.travelReimbursement.isExempt" class="tax-input">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Withholding Tax & VAT -->
          <div v-if="taxSubTab === 'withholding'" class="rule-section">
            <h3>💰 Withholding Tax</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Standard Rate (%)</label>
                <input type="number" v-model="taxRules.withholdingTax.standardRate" step="0.5" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Goods Threshold (ETB)</label>
                <input type="number" v-model="taxRules.withholdingTax.goodsThreshold" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Services Threshold (ETB)</label>
                <input type="number" v-model="taxRules.withholdingTax.servicesThreshold" class="tax-input">
              </div>
              <div class="rule-item">
                <label>No TIN Rate (%)</label>
                <input type="number" v-model="taxRules.withholdingTax.noTinRate" step="0.5" class="tax-input">
              </div>
            </div>

            <h3 style="margin-top: 24px">📋 Applies To</h3>
            <div class="checkbox-group">
              <label v-for="type in ['service_fees', 'dividends', 'royalties', 'interest']" :key="type" class="checkbox-label">
                <input type="checkbox" :value="type" v-model="taxRules.withholdingTax.appliesTo">
                {{ type.replace('_', ' ').toUpperCase() }}
              </label>
            </div>

            <h3 style="margin-top: 24px">💰 VAT & Turnover Tax</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>VAT Registration Threshold (ETB)</label>
                <input type="number" v-model="taxRules.vat.registrationThreshold" class="tax-input">
              </div>
              <div class="rule-item">
                <label>VAT Standard Rate (%)</label>
                <input type="number" v-model="taxRules.vat.standardRate" step="0.5" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Turnover Tax - Goods (%)</label>
                <input type="number" v-model="taxRules.turnoverTax.goodsRate" step="0.5" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Turnover Tax - Services Others (%)</label>
                <input type="number" v-model="taxRules.turnoverTax.servicesOthersRate" step="0.5" class="tax-input">
              </div>
            </div>
          </div>

          <!-- Tax Residency -->
          <div v-if="taxSubTab === 'residency'" class="rule-section">
            <h3>🌍 Tax Residency Rules (Foreigners)</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Days Threshold for Residency</label>
                <input type="number" v-model="taxRules.taxResidency.daysThreshold" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Permanent Residence Criteria?</label>
                <select v-model="taxRules.taxResidency.permanentResidenceCriteria" class="tax-input">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>
            <div class="info-note">
              <strong>Note:</strong> {{ taxRules.taxResidency.description }}
            </div>

            <h3 style="margin-top: 24px">📅 Filing Deadlines</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Tax Remittance Day (of month)</label>
                <input type="number" v-model="taxRules.deadlines.taxRemittanceDay" min="1" max="28" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Pension Remittance Day (of month)</label>
                <input type="number" v-model="taxRules.deadlines.pensionRemittanceDay" min="1" max="28" class="tax-input">
              </div>
            </div>
          </div>

          <!-- Legal Reference -->
          <div v-if="taxSubTab === 'legal'" class="rule-section">
            <h3>⚖️ Legal References</h3>
            <div class="rule-grid">
              <div class="rule-item full-width">
                <label>Income Tax Proclamation</label>
                <input type="text" v-model="taxRules.legalReference.incomeTaxProclamation" class="tax-input">
              </div>
              <div class="rule-item full-width">
                <label>Pension Proclamation</label>
                <input type="text" v-model="taxRules.legalReference.pensionProclamation" class="tax-input">
              </div>
            </div>

            <h3 style="margin-top: 24px">📝 Version Information</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Version</label>
                <input type="text" v-model="taxRules.version" class="tax-input" disabled>
              </div>
              <div class="rule-item">
                <label>Effective From</label>
                <input type="date" v-model="taxRules.effectiveFrom" class="tax-input">
              </div>
              <div class="rule-item">
                <label>Last Updated</label>
                <input type="text" :value="formatDate(taxRules.lastUpdated)" class="tax-input" disabled>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Department Modal -->
    <div v-if="showDepartmentModal" class="modal-overlay" @click="closeDepartmentModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingDepartment ? 'Edit Department' : 'Add Department' }}</h3>
          <button class="close" @click="closeDepartmentModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Code *</label>
            <input type="text" v-model="departmentForm.code">
          </div>
          <div class="form-group">
            <label>Name *</label>
            <input type="text" v-model="departmentForm.name">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="departmentForm.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Manager</label>
            <select v-model="departmentForm.managerId">
              <option :value="null">Select Manager</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.fullName || emp.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="departmentForm.isActive">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDepartmentModal">Cancel</button>
          <button class="btn-save" @click="saveDepartment" :disabled="savingDepartment">Save</button>
        </div>
      </div>
    </div>

    <!-- Position Modal -->
    <div v-if="showPositionModal" class="modal-overlay" @click="closePositionModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingPosition ? 'Edit Position' : 'Add Position' }}</h3>
          <button class="close" @click="closePositionModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Code *</label>
              <input type="text" v-model="positionForm.code">
            </div>
            <div class="form-group">
              <label>Title *</label>
              <input type="text" v-model="positionForm.title">
            </div>
          </div>
          <div class="form-group">
            <label>Department</label>
            <select v-model="positionForm.departmentId">
              <option :value="null">Select Department</option>
              <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">{{ dept.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Level</label>
            <select v-model="positionForm.level">
              <option value="">Select Level</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
              <option>Manager</option>
              <option>Director</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="positionForm.isActive">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closePositionModal">Cancel</button>
          <button class="btn-save" @click="savePosition" :disabled="savingPosition">Save</button>
        </div>
      </div>
    </div>

    <!-- Role Modal -->
    <div v-if="showRoleModal" class="modal-overlay" @click="closeRoleModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingRole ? 'Edit Role' : 'Add Role' }}</h3>
          <button class="close" @click="closeRoleModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" v-model="roleForm.name">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="roleForm.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="roleForm.isActive">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeRoleModal">Cancel</button>
          <button class="btn-save" @click="saveRole" :disabled="savingRole">Save</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Are you sure you want to delete <strong>{{ deleteItem?.name || deleteItem?.title }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDeleteModal">Cancel</button>
          <button class="btn-delete" @click="executeDelete" :disabled="deleting">Delete</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import settingService from '@/stores/settingService'
import employeeService from '@/stores/employee'

// ==================== STATE ====================
const activeTab = ref('departments')
const attendanceSubTab = ref('workSchedule')
const taxSubTab = ref('brackets')
const loading = ref(false)
const savingRules = ref(false)
const savingTaxRules = ref(false)
const savingDepartment = ref(false)
const savingPosition = ref(false)
const savingRole = ref(false)
const deleting = ref(false)
const toasts = ref([])

// Modals
const showDepartmentModal = ref(false)
const showPositionModal = ref(false)
const showRoleModal = ref(false)
const showDeleteModal = ref(false)
const editingDepartment = ref(null)
const editingPosition = ref(null)
const editingRole = ref(null)
const deleteItem = ref(null)
const deleteType = ref('')

// Data
const departments = ref([])
const positions = ref([])
const roles = ref([])
const employees = ref([])

// Attendance Rules
const attendanceRules = ref({
  workSchedule: {
    expectedCheckIn: '06:20',
    expectedCheckOut: '18:00',
    lateThreshold: 5,
    gracePeriod: 15,
    earlyDepartureThreshold: 30,
    minWorkHours: 4,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  },
  breakRules: {
    lunchStart: '12:00',
    lunchEnd: '13:00',
    lunchDuration: 60,
    isLunchPaid: false,
    morningBreak: 15,
    afternoonBreak: 15,
    flexibleBreaks: false
  },
  overtimeRules: {
    threshold: 8,
    normalOTRate: 1.5,
    weekendOTRate: 2.0,
    holidayOTRate: 2.5,
    maxPerDay: 4,
    maxPerWeek: 20,
    approvalRequired: true,
    eligiblePositions: []
  },
  leaveRules: {
    annualLeave: {
      baseDays: 16,
      incrementInterval: 2,
      incrementAmount: 1,
      maxDays: null,
      carryOverLimit: 30,
      carryOverExpiryYears: 3,
      accrualType: "anniversary",
      requiresApproval: true,
      minNoticeDays: 0,
      maxConsecutiveDays: 120
    },
    sickLeave: {
      hasFixedLimit: false,
      requiresDoctorNoteAfter: 3,
      alertThreshold: 15,
      resetFrequency: "yearly",
      requiresApproval: false,
      minNoticeDays: 0
    },
    maternityLeave: {
      defaultDays: 90,
      isPaid: true,
      requiresApproval: true,
      requiresDocumentation: true,
      minNoticeDays: 30,
      isOneTime: true,
      genderRestriction: "female",
      extensionAllowed: true,
      maxExtensionDays: 30
    },
    paternityLeave: {
      defaultDays: 3,
      isPaid: true,
      requiresApproval: true,
      minNoticeDays: 14,
      isOneTime: true,
      genderRestriction: "male",
      mustTakeWithinDays: 30
    },
    bereavementLeave: {
      defaultDays: 3,
      isPaid: true,
      requiresApproval: true,
      requiresDocumentation: true,
      minNoticeDays: 0,
      eligibleRelationships: ["spouse", "parent", "child", "sibling"],
      immediateFamilyDays: 5,
      isOneTime: false,
      maxPerYear: 10
    },
    unpaidLeave: {
      isPaid: false,
      requiresApproval: true,
      requiresDirectorApproval: true,
      minNoticeDays: 14,
      maxConsecutiveDays: 30,
      maxPerYear: 60,
      requiresReason: true
    },
    validation: {
      minDaysPerRequest: 1,
      maxDaysPerRequest: 30,
      minNoticeDaysPerType: {
        annual: 7,
        sick: 0,
        maternity: 30,
        paternity: 14,
        bereavement: 0,
        unpaid: 14
      },
      overlapAllowed: false,
      concurrentLeavesAllowed: true,
      maxConcurrentEmployees: 5000,
      pendingRequestsBlockNew: true,
      futureDateOnly: true,
      maxFutureDays: 365,
      weekendCounting: true,
      holidayCounting: false
    }
  },
  returnTracking: {
    enabled: true,
    returnConfirmationRequired: true,
    gracePeriodHours: 24,
    overdueAlertDays: [1, 3, 5, 7],
    allowEarlyReturn: true,
    allowLateReturn: true,
    requireReturnNotes: false,
    autoMarkReturned: false,
    overdueAction: "notify",
    overdueEscalationDays: [1, 3, 5, 7]
  },
  extensions: {
    maxExtensionsPerLeave: 2,
    maxTotalExtensionDays: 30,
    extensionRequiresApproval: true,
    extensionApprovalChain: ["manager", "hr"],
    autoApproveExtensionDays: 2,
    extensionReasonRequired: true,
    doctorNoteRequiredForExtension: true,
    allowedLeaveTypesForExtension: ["sick_leave"]
  },
  yearEndProcessing: {
    processingDate: "2026-12-31",
    carryOverDeadline: "2026-12-15",
    expiryNotificationDays: [60, 30, 14, 7, 3, 1],
    autoCarryOver: true,
    resetSickLeave: true,
    notificationRecipients: ["hr", "employee", "manager"]
  },
  approvalWorkflow: {
    requiresManagerApproval: true,
    requiresHrApproval: true,
    autoApproveThresholdDays: 3,
    autoApproveLeaveTypes: ["sick_leave"],
    escalationDays: 7,
    approvalChain: ["manager", "hr", "director"],
    allowSelfCancellation: true,
    cancellationDeadlineDays: 2,
    rejectionReasonRequired: true
  },
  notifications: {
    reminderDaysBefore: [30, 14, 7, 3, 1],
    overdueAlertDays: [1, 3, 5, 7],
    expiryAlertDays: [60, 30, 14, 7],
    pendingApprovalReminderDays: [3, 5, 7],
    channels: ["email", "in_app"],
    notifyOn: {
      requestSubmitted: ["manager", "hr"],
      requestApproved: ["employee"],
      requestRejected: ["employee"],
      extensionRequested: ["manager", "hr"],
      extensionApproved: ["employee"],
      extensionRejected: ["employee"],
      returnOverdue: ["employee", "manager", "hr"],
      balanceLow: ["employee"],
      leaveExpiring: ["employee"],
      carryOverApplied: ["employee"]
    }
  },
  blackoutPeriods: {
    enabled: true,
    global: [],
    departmentSpecific: {},
    exceptionAllowed: true,
    exceptionRequiresDirectorApproval: true
  },
  holidayRules: {
    holidays: [
      { date: '2026-01-01', name: 'New Year', type: 'public' },
      { date: '2026-01-07', name: 'Ethiopian Christmas', type: 'religious' },
      { date: '2026-01-19', name: 'Timkat', type: 'religious' },
      { date: '2026-03-02', name: 'Adwa Victory Day', type: 'public' },
      { date: '2026-03-20', name: 'Eid al-Fitr', type: 'religious' },
      { date: '2026-04-10', name: 'Good Friday', type: 'religious' },
      { date: '2026-04-12', name: 'Fasika (Easter)', type: 'religious' },
      { date: '2026-05-01', name: 'Labour Day', type: 'public' },
      { date: '2026-05-05', name: 'Patriots Day', type: 'public' },
      { date: '2026-05-27', name: 'Eid al-Adha', type: 'religious' },
      { date: '2026-05-28', name: 'Derg Downfall Day', type: 'public' },
      { date: '2026-08-26', name: 'Mawlid (Prophet Muhammad\'s Birthday)', type: 'religious' },
      { date: '2026-09-11', name: 'Ethiopian New Year', type: 'public' },
      { date: '2026-09-27', name: 'Meskel', type: 'religious' }
    ],
    holidayOvertimeRate: 2.5
  },
  fieldWorkRules: {
    consideredPresent: true,
    defaultHours: 8,
    requireCheckin: false,
    eligiblePositions: []
  }
})

// Tax Rules
const taxRules = ref({
  version: "1.0",
  effectiveFrom: "2024-01-01",
  lastUpdated: new Date().toISOString(),
  legalReference: {
    incomeTaxProclamation: "No. 286/2002 as amended",
    pensionProclamation: "No. 715/2011 as amended by No. 908/2015"
  },
  employmentTax: {
    brackets: [
      { min: 0, max: 2000, rate: 0, deduction: 0, description: "Exempt" },
      { min: 2001, max: 4000, rate: 15, deduction: 0, description: "15% on amount over 2,000" },
      { min: 4001, max: 7000, rate: 20, deduction: 200, description: "20% minus 200" },
      { min: 7001, max: 10000, rate: 25, deduction: 550, description: "25% minus 550" },
      { min: 10001, max: 14000, rate: 30, deduction: 1050, description: "30% minus 1,050" },
      { min: 14001, max: null, rate: 35, deduction: 1750, description: "35% minus 1,750" }
    ],
    calculationFormula: "Tax = (Income * Rate / 100) - Deduction",
    roundingMethod: "floor"
  },
  pension: {
    employeeRate: 7,
    employerRate: 11,
    monthlyCap: 15000,
    maxEmployeeContribution: 1050,
    maxEmployerContribution: 1650,
    calculationBase: "basic_salary_only",
    notes: "Any salary above 15,000 ETB is not subject to pension contribution"
  },
  exemptions: {
    transportAllowance: {
      isExempt: true,
      maxExemptAmount: 2200,
      alternativeLimit: "25_percent_of_salary",
      calculationMethod: "min_of_fixed_or_percentage"
    },
    medicalReimbursement: { isExempt: true },
    hardshipAllowance: { isExempt: true },
    travelReimbursement: { isExempt: true }
  },
  taxResidency: {
    daysThreshold: 183,
    permanentResidenceCriteria: true,
    description: "Foreigners become tax residents after 183 days or if they have permanent residence"
  },
  withholdingTax: {
    standardRate: 15,
    goodsThreshold: 10000,
    servicesThreshold: 3000,
    noTinRate: 30,
    appliesTo: ["service_fees", "dividends", "royalties", "interest"]
  },
  deadlines: {
    taxRemittanceDay: 8,
    pensionRemittanceDay: 10
  },
  vat: {
    registrationThreshold: 1000000,
    standardRate: 15,
    notes: "Businesses exceeding threshold must register for VAT"
  },
  turnoverTax: {
    goodsRate: 2,
    servicesContractorsRate: 2,
    servicesOthersRate: 10
  }
})

// Form Models
const departmentForm = reactive({
  code: '',
  name: '',
  description: '',
  managerId: null,
  isActive: true
})

const positionForm = reactive({
  code: '',
  title: '',
  departmentId: null,
  level: '',
  isActive: true
})

const roleForm = reactive({
  name: '',
  description: '',
  isActive: true
})

// Tabs
const tabs = [
  { id: 'departments', name: 'Departments' },
  { id: 'positions', name: 'Positions' },
  { id: 'roles', name: 'Roles' },
  { id: 'attendance', name: 'Attendance Rules' },
  { id: 'tax', name: 'Tax Rules' }
]

const attendanceSubTabs = [
  { id: 'workSchedule', name: ' Schedule' },
  { id: 'breakRules', name: ' Breaks' },
  { id: 'overtimeRules', name: ' Overtime' },
  { id: 'leaveTypes', name: ' Leave Types' },
  { id: 'validation', name: ' Validation' },
  { id: 'extensions', name: ' Extensions' },
  { id: 'workflow', name: ' Workflow' },
  { id: 'notifications', name: ' Notifications' },
  { id: 'holidays', name: ' Holidays' }
]

const taxSubTabs = [
  { id: 'brackets', name: '📊 Tax Brackets' },
  { id: 'pension', name: '🏦 Pension' },
  { id: 'exemptions', name: '✅ Exemptions' },
  { id: 'withholding', name: '💰 Withholding & VAT' },
  { id: 'residency', name: '🌍 Residency & Deadlines' },
  { id: 'legal', name: '⚖️ Legal & Version' }
]

const weekDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

// ==================== WATCHERS ====================

// Auto-calculate max pension contributions
watch(() => [taxRules.value.pension.monthlyCap, taxRules.value.pension.employeeRate, taxRules.value.pension.employerRate], () => {
  taxRules.value.pension.maxEmployeeContribution = Math.floor(taxRules.value.pension.monthlyCap * taxRules.value.pension.employeeRate / 100)
  taxRules.value.pension.maxEmployerContribution = Math.floor(taxRules.value.pension.monthlyCap * taxRules.value.pension.employerRate / 100)
}, { deep: true })

// ==================== API CALLS ====================

const loadTabData = async (tabId) => {
  loading.value = true
  try {
    if (tabId === 'departments') {
      const res = await settingService.getDepartments(1, 100, true)
      if (res.success) departments.value = res.data
    } else if (tabId === 'positions') {
      const res = await settingService.getPositions(1, 100, true)
      if (res.success) positions.value = res.data
    } else if (tabId === 'roles') {
      const res = await settingService.getRoles(1, 100, true)
      if (res.success) roles.value = res.data
    } else if (tabId === 'attendance') {
      const res = await settingService.getAttendanceRules()
      if (res.success && res.data) {
        const loadedData = res.data
        if (loadedData.workSchedule) Object.assign(attendanceRules.value.workSchedule, loadedData.workSchedule)
        if (loadedData.breakRules) Object.assign(attendanceRules.value.breakRules, loadedData.breakRules)
        if (loadedData.overtimeRules) Object.assign(attendanceRules.value.overtimeRules, loadedData.overtimeRules)
        if (loadedData.holidayRules) Object.assign(attendanceRules.value.holidayRules, loadedData.holidayRules)
        if (loadedData.fieldWorkRules) Object.assign(attendanceRules.value.fieldWorkRules, loadedData.fieldWorkRules)
        if (loadedData.returnTracking) Object.assign(attendanceRules.value.returnTracking, loadedData.returnTracking)
        if (loadedData.extensions) Object.assign(attendanceRules.value.extensions, loadedData.extensions)
        if (loadedData.yearEndProcessing) Object.assign(attendanceRules.value.yearEndProcessing, loadedData.yearEndProcessing)
        if (loadedData.approvalWorkflow) Object.assign(attendanceRules.value.approvalWorkflow, loadedData.approvalWorkflow)
        if (loadedData.leaveRules) {
          if (loadedData.leaveRules.annualLeave) Object.assign(attendanceRules.value.leaveRules.annualLeave, loadedData.leaveRules.annualLeave)
          if (loadedData.leaveRules.sickLeave) Object.assign(attendanceRules.value.leaveRules.sickLeave, loadedData.leaveRules.sickLeave)
          if (loadedData.leaveRules.maternityLeave) Object.assign(attendanceRules.value.leaveRules.maternityLeave, loadedData.leaveRules.maternityLeave)
          if (loadedData.leaveRules.paternityLeave) Object.assign(attendanceRules.value.leaveRules.paternityLeave, loadedData.leaveRules.paternityLeave)
          if (loadedData.leaveRules.bereavementLeave) Object.assign(attendanceRules.value.leaveRules.bereavementLeave, loadedData.leaveRules.bereavementLeave)
          if (loadedData.leaveRules.unpaidLeave) Object.assign(attendanceRules.value.leaveRules.unpaidLeave, loadedData.leaveRules.unpaidLeave)
          if (loadedData.leaveRules.validation) Object.assign(attendanceRules.value.leaveRules.validation, loadedData.leaveRules.validation)
        }
      }
    } else if (tabId === 'tax') {
      await loadTaxRules()
    }
  } catch (error) {
    addToast(error.error || 'Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

const loadTaxRules = async () => {
  try {
    const response = await settingService.getAttendanceRules()
    if (response.success && response.data && response.data['tax.rules']) {
      taxRules.value = JSON.parse(JSON.stringify(response.data['tax.rules']))
    }
  } catch (error) {
    console.error('Error loading tax rules:', error)
    addToast('Failed to load tax rules', 'error')
  }
}

const fetchEmployees = async () => {
  try {
    const response = await employeeService.getEmployees({ limit: 100 })
    if (response.success) {
      employees.value = response.data || []
    }
  } catch (error) {
    console.error('Error fetching employees:', error)
  }
}

const saveAttendanceRules = async () => {
  savingRules.value = true
  try {
    const rulesToSave = {
      workSchedule: attendanceRules.value.workSchedule,
      breakRules: attendanceRules.value.breakRules,
      overtimeRules: attendanceRules.value.overtimeRules,
      holidayRules: attendanceRules.value.holidayRules,
      fieldWorkRules: attendanceRules.value.fieldWorkRules,
      returnTracking: attendanceRules.value.returnTracking,
      extensions: attendanceRules.value.extensions,
      yearEndProcessing: attendanceRules.value.yearEndProcessing,
      approvalWorkflow: attendanceRules.value.approvalWorkflow,
      leaveRules: {
        annualLeave: attendanceRules.value.leaveRules.annualLeave,
        sickLeave: attendanceRules.value.leaveRules.sickLeave,
        maternityLeave: attendanceRules.value.leaveRules.maternityLeave,
        paternityLeave: attendanceRules.value.leaveRules.paternityLeave,
        bereavementLeave: attendanceRules.value.leaveRules.bereavementLeave,
        unpaidLeave: attendanceRules.value.leaveRules.unpaidLeave,
        validation: attendanceRules.value.leaveRules.validation
      }
    }
    
    const response = await settingService.updateAttendanceRules(rulesToSave)
    if (response.success) {
      addToast('Attendance rules saved successfully', 'success')
    } else {
      addToast(response.error || 'Failed to save rules', 'error')
    }
  } catch (error) {
    addToast(error.message || 'Failed to save rules', 'error')
  } finally {
    savingRules.value = false
  }
}

const saveTaxRules = async () => {
  savingTaxRules.value = true
  try {
    const currentSettings = await settingService.getAttendanceRules()
    const updatedSettings = {
      ...currentSettings.data,
      'tax.rules': taxRules.value
    }
    
    const response = await settingService.updateAttendanceRules(updatedSettings)
    if (response.success) {
      addToast('Tax rules saved successfully', 'success')
      taxRules.value.lastUpdated = new Date().toISOString()
      taxRules.value.version = (parseInt(taxRules.value.version) + 1).toString()
    } else {
      addToast(response.error || 'Failed to save tax rules', 'error')
    }
  } catch (error) {
    addToast(error.message || 'Failed to save tax rules', 'error')
  } finally {
    savingTaxRules.value = false
  }
}

// ==================== DEPARTMENT CRUD ====================

const openDepartmentModal = (dept = null) => {
  editingDepartment.value = dept
  if (dept) {
    departmentForm.code = dept.code
    departmentForm.name = dept.name
    departmentForm.description = dept.description || ''
    departmentForm.managerId = dept.managerId
    departmentForm.isActive = dept.isActive
  } else {
    departmentForm.code = ''
    departmentForm.name = ''
    departmentForm.description = ''
    departmentForm.managerId = null
    departmentForm.isActive = true
  }
  showDepartmentModal.value = true
}

const closeDepartmentModal = () => {
  showDepartmentModal.value = false
  editingDepartment.value = null
}

const saveDepartment = async () => {
  savingDepartment.value = true
  try {
    let res
    if (editingDepartment.value) {
      res = await settingService.updateDepartment(editingDepartment.value.departmentId, departmentForm)
    } else {
      res = await settingService.createDepartment(departmentForm)
    }
    if (res.success) {
      addToast(res.message || 'Department saved', 'success')
      await loadTabData('departments')
      closeDepartmentModal()
    } else {
      addToast(res.error || 'Failed to save', 'error')
    }
  } catch (error) {
    addToast(error.message || 'Failed to save', 'error')
  } finally {
    savingDepartment.value = false
  }
}

const toggleDepartmentStatus = async (dept) => {
  try {
    const res = await settingService.toggleDepartmentStatus(dept.departmentId, !dept.isActive)
    if (res.success) {
      dept.isActive = !dept.isActive
      addToast(`Department ${dept.isActive ? 'activated' : 'deactivated'}`, 'success')
    }
  } catch (error) {
    addToast(error.error || 'Failed to update status', 'error')
  }
}

// ==================== POSITION CRUD ====================

const openPositionModal = (position = null) => {
  editingPosition.value = position
  if (position) {
    positionForm.code = position.code
    positionForm.title = position.title
    positionForm.departmentId = position.departmentId
    positionForm.level = position.level || ''
    positionForm.isActive = position.isActive
  } else {
    positionForm.code = ''
    positionForm.title = ''
    positionForm.departmentId = null
    positionForm.level = ''
    positionForm.isActive = true
  }
  showPositionModal.value = true
}

const closePositionModal = () => {
  showPositionModal.value = false
  editingPosition.value = null
}

const savePosition = async () => {
  savingPosition.value = true
  try {
    const formData = {
      code: positionForm.code,
      title: positionForm.title,
      departmentId: positionForm.departmentId || null,
      level: positionForm.level || null,
      isActive: positionForm.isActive
    }
    let res
    if (editingPosition.value) {
      res = await settingService.updatePosition(editingPosition.value.positionId, formData)
    } else {
      res = await settingService.createPosition(formData)
    }
    if (res.success) {
      addToast(res.message || 'Position saved', 'success')
      await loadTabData('positions')
      closePositionModal()
    } else {
      addToast(res.error || 'Failed to save', 'error')
    }
  } catch (error) {
    addToast(error.message || 'Failed to save', 'error')
  } finally {
    savingPosition.value = false
  }
}

const togglePositionStatus = async (position) => {
  try {
    const res = await settingService.togglePositionStatus(position.positionId, !position.isActive)
    if (res.success) {
      position.isActive = !position.isActive
      addToast(`Position ${position.isActive ? 'activated' : 'deactivated'}`, 'success')
    }
  } catch (error) {
    addToast(error.error || 'Failed to update status', 'error')
  }
}

// ==================== ROLE CRUD ====================

const openRoleModal = (role = null) => {
  editingRole.value = role
  if (role) {
    roleForm.name = role.name
    roleForm.description = role.description || ''
    roleForm.isActive = role.isActive
  } else {
    roleForm.name = ''
    roleForm.description = ''
    roleForm.isActive = true
  }
  showRoleModal.value = true
}

const closeRoleModal = () => {
  showRoleModal.value = false
  editingRole.value = null
}

const saveRole = async () => {
  savingRole.value = true
  try {
    let res
    if (editingRole.value) {
      res = await settingService.updateRole(editingRole.value.roleId, roleForm)
    } else {
      res = await settingService.createRole(roleForm)
    }
    if (res.success) {
      addToast(res.message || 'Role saved', 'success')
      await loadTabData('roles')
      closeRoleModal()
    } else {
      addToast(res.error || 'Failed to save', 'error')
    }
  } catch (error) {
    addToast(error.message || 'Failed to save', 'error')
  } finally {
    savingRole.value = false
  }
}

const toggleRoleStatus = async (role) => {
  try {
    const res = await settingService.toggleRoleStatus(role.roleId, !role.isActive)
    if (res.success) {
      role.isActive = !role.isActive
      addToast(`Role ${role.isActive ? 'activated' : 'deactivated'}`, 'success')
    }
  } catch (error) {
    addToast(error.error || 'Failed to update status', 'error')
  }
}

// ==================== DELETE FUNCTIONS ====================

const confirmDelete = (type, item) => {
  deleteType.value = type
  deleteItem.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteItem.value = null
  deleteType.value = ''
}

const executeDelete = async () => {
  deleting.value = true
  try {
    let res
    if (deleteType.value === 'department') {
      res = await settingService.deleteDepartment(deleteItem.value.departmentId)
      if (res.success) {
        addToast('Department deleted successfully', 'success')
        await loadTabData('departments')
      }
    } else if (deleteType.value === 'position') {
      res = await settingService.deletePosition(deleteItem.value.positionId)
      if (res.success) {
        addToast('Position deleted successfully', 'success')
        await loadTabData('positions')
      }
    } else if (deleteType.value === 'role') {
      res = await settingService.deleteRole(deleteItem.value.roleId)
      if (res.success) {
        addToast('Role deleted successfully', 'success')
        await loadTabData('roles')
      }
    }
    closeDeleteModal()
  } catch (error) {
    addToast(error.error || 'Failed to delete', 'error')
  } finally {
    deleting.value = false
  }
}

// ==================== HELPERS ====================

const getDepartmentName = (deptId) => {
  const dept = departments.value.find(d => d.departmentId === deptId)
  return dept ? dept.name : '-'
}

const addHoliday = () => {
  attendanceRules.value.holidayRules.holidays.push({ date: '', name: '', type: 'public' })
}

const removeHoliday = (index) => {
  attendanceRules.value.holidayRules.holidays.splice(index, 1)
}

const updateEligibleRelationships = (event) => {
  attendanceRules.value.leaveRules.bereavementLeave.eligibleRelationships = 
    event.target.value.split(',').map(s => s.trim())
}

const updateOverdueAlertDays = (event) => {
  attendanceRules.value.returnTracking.overdueAlertDays = 
    event.target.value.split(',').map(s => parseInt(s.trim()))
}

const updateReminderDays = (event) => {
  attendanceRules.value.notifications.reminderDaysBefore = 
    event.target.value.split(',').map(s => parseInt(s.trim()))
}

const updateExpiryAlertDays = (event) => {
  attendanceRules.value.notifications.expiryAlertDays = 
    event.target.value.split(',').map(s => parseInt(s.trim()))
}

const updateApprovalChain = (event) => {
  attendanceRules.value.approvalWorkflow.approvalChain = 
    event.target.value.split(',').map(s => s.trim())
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

// Initialize
onMounted(async () => {
  await Promise.all([
    loadTabData('departments'),
    loadTabData('positions'),
    loadTabData('roles'),
    loadTabData('attendance'),
    loadTabData('tax'),
    fetchEmployees()
  ])
})
</script>

<style scoped>
.settings-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: 100vh;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.settings-header p {
  color: #64748b;
  font-size: 14px;
}

.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 4px;
  border-radius: 12px;
  width: fit-content;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.settings-tabs button {
  padding: 8px 24px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
}

.settings-tabs button.active {
  background: #6366f1;
  color: white;
}

.settings-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.btn-add, .btn-save {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-add {
  background: #6366f1;
  color: white;
}

.btn-save {
  background: #10b981;
  color: white;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
}

.data-table td {
  font-size: 14px;
  color: #334155;
}

.empty {
  text-align: center;
  padding: 40px !important;
  color: #94a3b8;
}

.status-toggle {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.status-toggle.active {
  background: #d1fae5;
  color: #059669;
}

.status-toggle.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
  margin-right: 6px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn.edit {
  background: #3b82f620;
  color: #3b82f6;
}

.action-btn.delete {
  background: #ef444420;
  color: #ef4444;
}

.sub-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.sub-tabs button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.sub-tabs button:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.sub-tabs button.active {
  background: #6366f1;
  color: white;
}

.rules-container {
  padding: 20px;
}

.rule-section {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.rule-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.rule-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.rule-subsection {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.rule-subsection:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.rule-subsection h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #10b981;
}

.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.rule-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rule-item.full-width {
  grid-column: 1 / -1;
}

.rule-item label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.rule-item input,
.rule-item select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}

.holidays-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.holiday-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.holiday-date {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 130px;
}

.holiday-name {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  min-width: 150px;
}

.holiday-type {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 110px;
}

.remove-holiday {
  padding: 8px 12px;
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #dc2626;
}

.add-holiday {
  width: 100%;
  padding: 10px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  color: #6366f1;
  margin-top: 12px;
}

/* Tax Rules Styles */
.tax-info-card {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.tax-info-card p {
  margin: 6px 0;
  font-size: 13px;
  color: #166534;
}

.tax-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
}

.tax-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.tax-input:disabled {
  background: #f1f5f9;
  color: #64748b;
}

.info-note {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px 16px;
  margin-top: 20px;
  font-size: 13px;
  color: #92400e;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  display: block;
}

/* Modal Styles */
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
  max-width: 550px;
  max-height: 85vh;
  overflow-y: auto;
}

.delete-modal {
  max-width: 400px;
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

.form-group input,
.form-group select,
.form-group textarea {
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

.btn-delete {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-save:disabled,
.btn-add:disabled,
.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-warning {
  text-align: center;
  padding: 20px;
}

.delete-warning svg {
  width: 48px;
  height: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.delete-warning p {
  margin: 8px 0;
  color: #475569;
}

.warning-text {
  font-size: 12px;
  color: #94a3b8;
}

.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

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

@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }
  
  .settings-tabs {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
  }
  
  .rule-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .holiday-item {
    flex-direction: column;
  }
  
  .holiday-date,
  .holiday-name,
  .holiday-type {
    width: 100%;
  }
  
  .sub-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
}
</style>