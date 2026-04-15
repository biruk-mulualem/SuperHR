<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <h1>System Settings</h1>
      <p>Manage departments, positions, roles, and attendance rules</p>
    </div>

    <!-- Tabs -->
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
        
        <div class="rules-container">
          <!-- Work Schedule -->
          <div class="rule-section">
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
          </div>

          <!-- Break Rules -->
          <div class="rule-section">
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
          <div class="rule-section">
            <h3>💰 Overtime Rules</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Overtime Threshold (hours/day)</label>
                <input type="number" step="0.5" v-model="attendanceRules.overtimeRules.threshold">
              </div>
              <div class="rule-item">
                <label>Weekday Rate (multiplier)</label>
                <input type="number" step="0.1" v-model="attendanceRules.overtimeRules.weekdayRate">
              </div>
              <div class="rule-item">
                <label>Weekend Rate</label>
                <input type="number" step="0.1" v-model="attendanceRules.overtimeRules.weekendRate">
              </div>
              <div class="rule-item">
                <label>Holiday Rate</label>
                <input type="number" step="0.1" v-model="attendanceRules.overtimeRules.holidayRate">
              </div>
              <div class="rule-item">
                <label>Max Overtime/Day</label>
                <input type="number" v-model="attendanceRules.overtimeRules.maxPerDay">
              </div>
              <div class="rule-item">
                <label>Max Overtime/Week</label>
                <input type="number" v-model="attendanceRules.overtimeRules.maxPerWeek">
              </div>
              <div class="rule-item">
                <label>Approval Required?</label>
                <select v-model="attendanceRules.overtimeRules.approvalRequired">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Leave Rules -->
          <div class="rule-section">
            <h3>🌴 Leave Rules</h3>
            <div class="rule-grid">
              <div class="rule-item">
                <label>Annual Leave (days/year)</label>
                <input type="number" v-model="attendanceRules.leaveRules.annual">
              </div>
              <div class="rule-item">
                <label>Sick Leave (days/year)</label>
                <input type="number" v-model="attendanceRules.leaveRules.sick">
              </div>
              <div class="rule-item">
                <label>Maternity Leave (days)</label>
                <input type="number" v-model="attendanceRules.leaveRules.maternity">
              </div>
              <div class="rule-item">
                <label>Paternity Leave (days)</label>
                <input type="number" v-model="attendanceRules.leaveRules.paternity">
              </div>
              <div class="rule-item">
                <label>Max Consecutive Leave</label>
                <input type="number" v-model="attendanceRules.leaveRules.maxConsecutive">
              </div>
              <div class="rule-item">
                <label>Leave Notice (days)</label>
                <input type="number" v-model="attendanceRules.leaveRules.noticeDays">
              </div>
              <div class="rule-item">
                <label>Carryover Allowed?</label>
                <select v-model="attendanceRules.leaveRules.carryover">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
              <div class="rule-item" v-if="attendanceRules.leaveRules.carryover">
                <label>Max Carryover Days</label>
                <input type="number" v-model="attendanceRules.leaveRules.maxCarryover">
              </div>
            </div>
          </div>

          <!-- Working Days -->
          <div class="rule-section">
            <h3>📅 Working Days</h3>
            <div class="checkbox-group">
              <label v-for="day in weekDays" :key="day.value" class="checkbox-label">
                <input type="checkbox" :value="day.value" v-model="attendanceRules.workSchedule.workingDays">
                {{ day.label }}
              </label>
            </div>
          </div>

          <!-- Holidays -->
          <div class="rule-section">
            <h3>🎉 Ethiopian Holidays</h3>
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
          </div>

          <!-- Field Work Rules -->
          <div class="rule-section">
            <h3>🏔️ Field Work Rules</h3>
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
              <div class="rule-item">
                <label>Require Check-in?</label>
                <select v-model="attendanceRules.fieldWorkRules.requireCheckin">
                  <option :value="true">Yes</option>
                  <option :value="false">No</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
            <input type="text" v-model="departmentForm.code" placeholder="e.g., IT">
          </div>
          <div class="form-group">
            <label>Name *</label>
            <input type="text" v-model="departmentForm.name" placeholder="Department name">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="departmentForm.description" rows="2" placeholder="Description"></textarea>
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
              <input type="text" v-model="positionForm.code" placeholder="e.g., SE-001">
            </div>
            <div class="form-group">
              <label>Title *</label>
              <input type="text" v-model="positionForm.title" placeholder="Position title">
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
          <div class="form-row">
            <div class="form-group">
              <label>Min Salary (ETB)</label>
              <input type="number" v-model="positionForm.minSalary" placeholder="0">
            </div>
            <div class="form-group">
              <label>Max Salary (ETB)</label>
              <input type="number" v-model="positionForm.maxSalary" placeholder="0">
            </div>
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
            <input type="text" v-model="roleForm.name" placeholder="Role name (e.g., admin, hr)">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="roleForm.description" rows="2" placeholder="Role description"></textarea>
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
import { ref, reactive, onMounted } from 'vue'
import settingService from '@/stores/settingService'
// ==================== STATE ====================
const activeTab = ref('departments')
const loading = ref(false)
const savingRules = ref(false)
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
    weekdayRate: 1.5,
    weekendRate: 2.0,
    holidayRate: 2.5,
    maxPerDay: 4,
    maxPerWeek: 20,
    approvalRequired: true,
    eligiblePositions: []
  },
  leaveRules: {
    annual: 20,
    sick: 10,
    maternity: 90,
    paternity: 10,
    bereavement: 5,
    unpaid: true,
    maxConsecutive: 30,
    noticeDays: 3,
    carryover: true,
    maxCarryover: 30
  },
  holidayRules: {
    holidays: [
      { date: '2026-01-01', name: 'New Year', type: 'public' },
      { date: '2026-01-07', name: 'Ethiopian Christmas', type: 'religious' },
      { date: '2026-01-19', name: 'Timkat', type: 'religious' },
      { date: '2026-03-02', name: 'Adwa Victory Day', type: 'public' },
      { date: '2026-04-18', name: 'Good Friday', type: 'religious' },
      { date: '2026-04-20', name: 'Easter Monday', type: 'religious' },
      { date: '2026-05-01', name: 'Labour Day', type: 'public' },
      { date: '2026-05-05', name: 'Patriots Day', type: 'public' },
      { date: '2026-05-28', name: 'Derg Downfall Day', type: 'public' },
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
  minSalary: '',
  maxSalary: '',
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
  { id: 'attendance', name: 'Attendance Rules' }
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

// ==================== API CALLS USING SETTING SERVICE ====================

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
        if (loadedData.leaveRules) Object.assign(attendanceRules.value.leaveRules, loadedData.leaveRules)
        if (loadedData.holidayRules) Object.assign(attendanceRules.value.holidayRules, loadedData.holidayRules)
        if (loadedData.fieldWorkRules) Object.assign(attendanceRules.value.fieldWorkRules, loadedData.fieldWorkRules)
      }
    }
  } catch (error) {
    addToast(error.error || 'Failed to load data', 'error')
  } finally {
    loading.value = false
  }
}

const fetchEmployees = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/employees?limit=100`)
    if (res.data.success) employees.value = res.data.data || []
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
      leaveRules: attendanceRules.value.leaveRules,
      holidayRules: attendanceRules.value.holidayRules,
      fieldWorkRules: attendanceRules.value.fieldWorkRules
    }
    const response = await settingService.updateAttendanceRules(rulesToSave)
    if (response.success) {
      addToast('Attendance rules saved successfully', 'success')
      await loadTabData('attendance')
    } else {
      addToast(response.error || 'Failed to save rules', 'error')
    }
  } catch (error) {
    addToast(error.error || 'Failed to save rules', 'error')
  } finally {
    savingRules.value = false
  }
}

// ==================== DELETE CONFIRMATION ====================

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
    }
  } catch (error) {
    addToast(error.error || 'Failed to save', 'error')
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
    positionForm.minSalary = position.minSalary || ''
    positionForm.maxSalary = position.maxSalary || ''
    positionForm.isActive = position.isActive
  } else {
    positionForm.code = ''
    positionForm.title = ''
    positionForm.departmentId = null
    positionForm.level = ''
    positionForm.minSalary = ''
    positionForm.maxSalary = ''
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
      minSalary: positionForm.minSalary ? parseFloat(positionForm.minSalary) : 0,
      maxSalary: positionForm.maxSalary ? parseFloat(positionForm.maxSalary) : 0,
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
    }
  } catch (error) {
    addToast(error.error || 'Failed to save', 'error')
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
    }
  } catch (error) {
    addToast(error.error || 'Failed to save', 'error')
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

/* Rules Container */
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
  max-width: 550px;
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

.btn-save {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
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

.delete-modal {
  max-width: 400px;
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
}
</style>