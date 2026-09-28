<!-- FILE: src/views/tabs/AttendanceRulesPage.vue -->
<template>
  <div class="settings-card">
    <div class="card-header">
      <h2>Attendance Rules</h2>
      <button class="btn-save" @click="saveRules" :disabled="savingRules">
        {{ savingRules ? 'Saving...' : 'Save Rules' }}
      </button>
    </div>

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

      <!-- Extensions -->
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
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import settingService from '@/stores/settingService'

const addToast = inject('addToast')

const attendanceSubTab = ref('workSchedule')
const savingRules = ref(false)

const attendanceSubTabs = [
  { id: 'workSchedule', name: '📋 Schedule' },
  { id: 'breakRules', name: '🍽️ Breaks' },
  { id: 'overtimeRules', name: '💰 Overtime' },
  { id: 'leaveTypes', name: '🌴 Leave Types' },
  { id: 'validation', name: '✅ Validation' },
  { id: 'extensions', name: '➕ Extensions' },
  { id: 'workflow', name: '⚙️ Workflow' },
  { id: 'notifications', name: '🔔 Notifications' },
  { id: 'holidays', name: '🎉 Holidays' }
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
    afternoonBreak: 15
  },
  overtimeRules: {
    threshold: 8,
    normalOTRate: 1.5,
    weekendOTRate: 2.0,
    holidayOTRate: 2.5,
    maxPerDay: 4,
    maxPerWeek: 20
  },
  leaveRules: {
    annualLeave: {
      baseDays: 16,
      incrementInterval: 2,
      carryOverLimit: 30,
      carryOverExpiryYears: 3
    },
    sickLeave: {
      requiresDoctorNoteAfter: 3,
      alertThreshold: 15
    },
    maternityLeave: {
      defaultDays: 90,
      isPaid: true,
      minNoticeDays: 30
    },
    paternityLeave: {
      defaultDays: 3,
      minNoticeDays: 14
    },
    bereavementLeave: {
      defaultDays: 3,
      immediateFamilyDays: 5,
      eligibleRelationships: ['spouse', 'parent', 'child', 'sibling']
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
      maxConcurrentEmployees: 5000,
      overlapAllowed: false,
      futureDateOnly: true
    }
  },
  returnTracking: {
    enabled: true,
    gracePeriodHours: 24,
    overdueAlertDays: [1, 3, 5, 7]
  },
  extensions: {
    maxExtensionsPerLeave: 2,
    maxTotalExtensionDays: 30
  },
  approvalWorkflow: {
    requiresManagerApproval: true,
    requiresHrApproval: true,
    autoApproveThresholdDays: 3,
    approvalChain: ['manager', 'hr', 'director']
  },
  yearEndProcessing: {
    processingDate: '2026-12-31',
    autoCarryOver: true
  },
  notifications: {
    reminderDaysBefore: [30, 14, 7, 3, 1],
    expiryAlertDays: [60, 30, 14, 7],
    channels: ['email', 'in_app']
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
      { date: '2026-08-26', name: 'Mawlid', type: 'religious' },
      { date: '2026-09-11', name: 'Ethiopian New Year', type: 'public' },
      { date: '2026-09-27', name: 'Meskel', type: 'religious' }
    ]
  },
  fieldWorkRules: {
    consideredPresent: true,
    defaultHours: 8
  }
})

const loadAttendanceRules = async () => {
  try {
    const response = await settingService.getAttendanceRules()
    if (response.success && response.data) {
      attendanceRules.value = { ...attendanceRules.value, ...response.data }
    }
  } catch (error) {
    addToast('Failed to load attendance rules', 'error')
  }
}

const saveRules = async () => {
  savingRules.value = true
  try {
    const response = await settingService.updateAttendanceRules(attendanceRules.value)
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

onMounted(loadAttendanceRules)
</script>

<style scoped>
.settings-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
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
.btn-save {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: #10b981;
  color: white;
}
.btn-save:hover {
  background: #059669;
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
@media (max-width: 768px) {
  .rule-grid {
    grid-template-columns: 1fr;
  }
  .sub-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
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