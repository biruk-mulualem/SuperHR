<template>
  <div class="leave-detail-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading leave details...</p>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!leaveRequest" class="not-found-container">
      <span class="not-found-icon">📭</span>
      <h2>Leave Request Not Found</h2>
      <p>The leave request you're looking for doesn't exist or has been removed.</p>
      <button class="btn-primary" @click="goBack">← Back to Leave Management</button>
    </div>

    <!-- Leave Detail Content -->
    <div v-else class="detail-content">
      <!-- Header with Status Banner -->
      <div class="detail-header">
        <div class="header-top">
          <button class="back-btn" @click="goBack">← Back to Leave Management</button>
          <div class="header-actions">
            <!-- For Pending Requests -->
            <button v-if="leaveRequest.status === 'pending'" class="btn-approve" @click="openApproveModal">
              ✓ Approve Request
            </button>
            <button v-if="leaveRequest.status === 'pending'" class="btn-reject" @click="openRejectModal">
              ✗ Reject Request
            </button>
            
            <!-- For Rejected Requests - Re-initialize button -->
            <button v-if="leaveRequest.status === 'rejected'" class="btn-warning" @click="openReinitializeModal">
              🔄 Re-initialize Request
            </button>
            
            <!-- For Approved Leaves - Confirm Return button -->
            <button v-if="leaveRequest.status === 'approved' && !leaveRequest.actual_return_date && leaveRequest.return_date <= today" class="btn-success" @click="openReturnConfirmModal">
              ✅ Confirm Return
            </button>
            
            <button class="btn-secondary" @click="exportToCSV">📄 Export CSV</button>
          </div>
        </div>
        
        <!-- Status Banner -->
        <div class="status-banner" :class="getStatusClass(leaveRequest.status)">
          <div class="status-icon">{{ getStatusIcon(leaveRequest.status) }}</div>
          <div class="status-info">
            <div class="status-label">Current Status</div>
            <div class="status-value">{{ leaveRequest.status?.toUpperCase() }}</div>
          </div>
          <div class="status-date" v-if="leaveRequest.approved_date">
            <span>Approved on:</span>
            <strong>{{ formatDate(leaveRequest.approved_date) }}</strong>
          </div>
          <div class="status-date" v-if="leaveRequest.rejection_reason">
            <span>Rejected:</span>
            <strong>{{ formatDate(leaveRequest.rejection_date) || formatDate(leaveRequest.approved_date) || 'N/A' }}</strong>
          </div>
          <div class="status-date" v-if="leaveRequest.actual_return_date">
            <span>Returned on:</span>
            <strong>{{ formatDate(leaveRequest.actual_return_date) }}</strong>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="detail-main">
        <!-- Left Column - Leave Information -->
        <div class="detail-card">
          <div class="card-header">
            <span class="card-icon">📋</span>
            <h3>Leave Information</h3>
          </div>
          <div class="card-body">
            <div class="info-group">
              <div class="info-row">
                <label>Request ID</label>
                <span class="request-id">#{{ leaveRequest.id }}</span>
              </div>
              <div class="info-row">
                <label>Request Date</label>
                <span>{{ formatDate(leaveRequest.requested_date) }}</span>
              </div>
              <div class="info-row">
                <label>Leave Type</label>
                <span class="leave-type-badge" :class="getLeaveTypeClass(leaveRequest.leave_type_name)">
                  {{ leaveRequest.leave_type_name }}
                </span>
              </div>
              <div class="info-row">
                <label>Start Date</label>
                <span class="date-highlight">{{ formatDate(leaveRequest.start_date) }}</span>
              </div>
              <div class="info-row">
                <label>End Date</label>
                <span class="date-highlight">{{ formatDate(leaveRequest.end_date) }}</span>
              </div>
              <div class="info-row">
                <label>Return Date</label>
                <span class="date-highlight">{{ formatDate(leaveRequest.return_date) }}</span>
              </div>
              <div class="info-row">
                <label>Total Days</label>
                <span class="days-number">{{ leaveRequest.total_days }} days</span>
              </div>
              <div class="info-row full-width">
                <label>Return Status</label>
                <span :class="getReturnStatusClass(leaveRequest)">
                  {{ getReturnStatusText(leaveRequest) }}
                </span>
              </div>
              <div class="info-row full-width">
                <label>Reason for Leave</label>
                <div class="reason-box">{{ leaveRequest.reason }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Employee Information -->
        <div class="detail-card">
          <div class="card-header">
            <span class="card-icon">👤</span>
            <h3>Employee Information</h3>
          </div>
          <div class="card-body">
            <div class="info-group">
              <div class="info-row">
                <label>Full Name</label>
                <span class="employee-name">{{ leaveRequest.employee_name }}</span>
              </div>
              <div class="info-row">
                <label>Employee Code</label>
                <span>{{ leaveRequest.employee_code }}</span>
              </div>
              <div class="info-row">
                <label>Department</label>
                <span class="department-badge">{{ leaveRequest.department_name }}</span>
              </div>
              <div class="info-row">
                <label>Position</label>
                <span>{{ employeeDetails?.position || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <label>Email</label>
                <span>{{ employeeDetails?.email || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <label>Join Date</label>
                <span>{{ formatDate(employeeDetails?.join_date) || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <label>Years of Service</label>
                <span>{{ employeeDetails?.years_of_service || 0 }} years</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Leave Balance Section -->
      <div class="detail-card">
        <div class="card-header">
          <span class="card-icon">⚖️</span>
          <h3>Leave Balance Summary</h3>
        </div>
        <div class="card-body">
          <div class="balance-container">
            <!-- Annual Leave Balance -->
           <!-- Annual Leave Balance - Updated to show correct values -->
<div v-if="leaveRequest.leave_type_name === 'Annual Leave'" class="balance-card">
  <div class="balance-header">
    <span class="balance-title">Annual Leave Balance</span>
    <span class="balance-used">{{ employeeBalance?.annual_used || 0 }} / {{ employeeBalance?.annual_total || 16 }} days used</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" :style="{ width: ((employeeBalance?.annual_used || 0) / (employeeBalance?.annual_total || 16) * 100) + '%' }"></div>
  </div>
  <div class="balance-details">
    <div class="balance-row">
      <span>📊 Total Accrued:</span>
      <strong>{{ employeeBalance?.annual_total || 16 }} days</strong>
    </div>
    <div class="balance-row">
      <span>✅ Used:</span>
      <strong>{{ employeeBalance?.annual_used || 0 }} days</strong>
    </div>
    <div class="balance-row" v-if="employeeBalance?.carried_over > 0">
      <span>📦 Carried Over:</span>
      <strong class="text-purple">{{ employeeBalance?.carried_over }} days</strong>
    </div>
    <div class="balance-row">
      <span>🎯 Current Period Entitlement:</span>
      <strong>{{ employeeBalance?.currentPeriodEntitlement || 16 }} days/year</strong>
    </div>
    <div class="balance-footer">
      <span>✨ Remaining: <strong class="text-success">{{ employeeBalance?.available_days || employeeBalance?.availableDays || 0 }} days</strong></span>
      <span v-if="(employeeBalance?.available_days || employeeBalance?.availableDays || 0) < 5" class="warning-text">⚠️ Low balance</span>
    </div>
  </div>
</div>

            <!-- Sick Leave Usage -->
            <div v-else-if="leaveRequest.leave_type_name === 'Sick Leave'" class="balance-card sick-card">
              <div class="balance-header">
                <span class="balance-title">Sick Leave Usage</span>
                <span class="balance-used">{{ employeeBalance?.sick_used || 0 }} days used this year</span>
              </div>
              <div class="balance-note">
                <span class="info-icon">ℹ️</span>
                No fixed limit - monitored for patterns and potential abuse
              </div>
              <div class="balance-warning" v-if="(employeeBalance?.sick_used || 0) > 15">
                ⚠️ Employee has used {{ employeeBalance?.sick_used }} sick days this year - monitor for pattern
              </div>
            </div>

            <!-- Fixed Duration Leaves -->
            <div v-else class="balance-card fixed-card">
              <div class="balance-header">
                <span class="balance-title">{{ leaveRequest.leave_type_name }}</span>
                <span class="balance-used">Fixed duration: {{ getLeaveTypeDays() }} days</span>
              </div>
              <div class="balance-info">
                This leave type has a fixed duration of {{ getLeaveTypeDays() }} days.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Extension Section (Only for Sick Leave when approved) -->
      <div v-if="leaveRequest.leave_type_name === 'Sick Leave'" class="detail-card extension-card">
        <div class="card-header">
          <span class="card-icon">🔄</span>
          <h3>Extension Management</h3>
          <button v-if="leaveRequest.status === 'approved'" class="btn-extension" @click="openExtensionModal">
            + Request Extension
          </button>
        </div>
        <div class="card-body">
          <!-- Extension Timeline -->
          <div v-if="leaveRequest.extensions && leaveRequest.extensions.length > 0" class="extension-timeline">
            <div v-for="(ext, idx) in leaveRequest.extensions" :key="idx" class="timeline-item">
              <div class="timeline-dot" :class="ext.status"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-date">📅 {{ formatDate(ext.requested_date) }}</span>
                  <span class="timeline-status" :class="ext.status">{{ ext.status.toUpperCase() }}</span>
                </div>
                <div class="timeline-body">
                  <div class="timeline-field">
                    <strong>Additional Days:</strong> 
                    <span class="days-badge">+{{ ext.additional_days }} days</span>
                  </div>
                  <div class="timeline-field">
                    <strong>Reason:</strong> 
                    <span>{{ ext.reason }}</span>
                  </div>
                  <div v-if="ext.new_end_date" class="timeline-field highlight">
                    <strong>New End Date:</strong> 
                    <span>{{ formatDate(ext.new_end_date) }}</span>
                  </div>
                  <div v-if="ext.approved_by" class="timeline-field">
                    <strong>Approved By:</strong> 
                    <span>{{ ext.approved_by }}</span>
                  </div>
                  <div v-if="ext.approved_date" class="timeline-field">
                    <strong>Approved On:</strong> 
                    <span>{{ formatDate(ext.approved_date) }}</span>
                  </div>
                  <div v-if="ext.rejection_reason" class="timeline-field rejection-field">
                    <strong>Rejection Reason:</strong> 
                    <span>{{ ext.rejection_reason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-extensions">
            <span class="no-extensions-icon">📭</span>
            <p>No extension requests yet</p>
            <p class="sub-text">If the employee needs more time, click "Request Extension" above</p>
          </div>
        </div>
      </div>

      <!-- Approval Information (for approved leaves) -->
      <div v-if="leaveRequest.status === 'approved' && leaveRequest.approved_by" class="detail-card approval-card">
        <div class="card-header">
          <span class="card-icon">✅</span>
          <h3>Approval Information</h3>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <label>Approved By</label>
              <span>{{ leaveRequest.approved_by }}</span>
            </div>
            <div class="info-item">
              <label>Approved Date</label>
              <span>{{ formatDate(leaveRequest.approved_date) }}</span>
            </div>
            <div class="info-item full-width" v-if="leaveRequest.hr_notes">
              <label>HR Notes</label>
              <div class="notes-box">{{ leaveRequest.hr_notes }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rejection Information (for rejected leaves) -->
      <div v-if="leaveRequest.status === 'rejected'" class="detail-card rejection-card">
        <div class="card-header">
          <span class="card-icon">❌</span>
          <h3>Rejection Information</h3>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item full-width">
              <label>Rejection Reason</label>
              <div class="rejection-box">{{ leaveRequest.rejection_reason }}</div>
            </div>
            <div class="info-item full-width" v-if="leaveRequest.hr_notes">
              <label>HR Notes</label>
              <div class="notes-box">{{ leaveRequest.hr_notes }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Extension Modal -->
    <div v-if="showExtensionModal" class="modal-overlay" @click.self="showExtensionModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔄 Request Leave Extension</h3>
          <button class="close-btn" @click="showExtensionModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-group-modal">
            <div class="info-row-modal">
              <label>Employee:</label>
              <span>{{ leaveRequest?.employee_name }}</span>
            </div>
            <div class="info-row-modal">
              <label>Current Period:</label>
              <span>{{ formatDate(leaveRequest?.start_date) }} - {{ formatDate(leaveRequest?.end_date) }}</span>
            </div>
            <div class="info-row-modal">
              <label>Current Days:</label>
              <span class="days-highlight">{{ leaveRequest?.total_days }} days</span>
            </div>
          </div>
          <div class="form-group">
            <label>Additional Days Requested <span class="required">*</span></label>
            <input type="number" v-model="extensionDays" min="1" max="30" class="form-input" />
          </div>
          <div class="form-group">
            <label>Reason for Extension <span class="required">*</span></label>
            <textarea v-model="extensionReason" rows="3" placeholder="e.g., Still sick, doctor advised more rest, medical complications..." class="form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showExtensionModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmExtension">Submit Extension Request</button>
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
              <p><strong>{{ leaveRequest?.employee_name }}</strong> ({{ leaveRequest?.employee_code }})</p>
              <p class="return-period">{{ leaveRequest?.leave_type_name }} • {{ formatDate(leaveRequest?.start_date) }} - {{ formatDate(leaveRequest?.end_date) }}</p>
            </div>
          </div>
          <div class="return-dates">
            <div class="date-box">
              <label>Expected Return</label>
              <div class="date-value">{{ formatDate(leaveRequest?.return_date) }}</div>
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

    <!-- Approve Confirmation Modal -->
    <div v-if="showApproveConfirmModal" class="modal-overlay" @click.self="showApproveConfirmModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>✅ Confirm Approval</h3>
          <button class="close-btn" @click="showApproveConfirmModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to approve this leave request?</p>
          <div class="info-group-modal">
            <div class="info-row-modal">
              <label>Employee:</label>
              <span>{{ leaveRequest?.employee_name }}</span>
            </div>
            <div class="info-row-modal">
              <label>Period:</label>
              <span>{{ formatDate(leaveRequest?.start_date) }} - {{ formatDate(leaveRequest?.end_date) }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>HR Notes (Optional)</label>
            <textarea v-model="approvalNotes" rows="3" placeholder="Add any notes..." class="form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showApproveConfirmModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmApprove">Confirm Approval</button>
        </div>
      </div>
    </div>

    <!-- Reject Confirmation Modal -->
    <div v-if="showRejectConfirmModal" class="modal-overlay" @click.self="showRejectConfirmModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>❌ Confirm Rejection</h3>
          <button class="close-btn" @click="showRejectConfirmModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to reject this leave request?</p>
          <div class="info-group-modal">
            <div class="info-row-modal">
              <label>Employee:</label>
              <span>{{ leaveRequest?.employee_name }}</span>
            </div>
            <div class="info-row-modal">
              <label>Leave Type:</label>
              <span>{{ leaveRequest?.leave_type_name }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>Rejection Reason <span class="required">*</span></label>
            <textarea v-model="rejectionReason" rows="3" placeholder="Please provide reason for rejection..." class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>HR Notes (Optional)</label>
            <textarea v-model="rejectionNotes" rows="2" placeholder="Internal notes..." class="form-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showRejectConfirmModal = false">Cancel</button>
          <button class="btn-danger" @click="confirmReject">Confirm Rejection</button>
        </div>
      </div>
    </div>

    <!-- Re-initialize Confirmation Modal -->
    <div v-if="showReinitializeConfirmModal" class="modal-overlay" @click.self="showReinitializeConfirmModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>🔄 Confirm Re-initialize</h3>
          <button class="close-btn" @click="showReinitializeConfirmModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to re-initialize this request?</p>
          <p class="warning-text">This will move the request back to pending for approval.</p>
          <div class="info-group-modal">
            <div class="info-row-modal">
              <label>Employee:</label>
              <span>{{ leaveRequest?.employee_name }}</span>
            </div>
            <div class="info-row-modal">
              <label>Current Status:</label>
              <span class="text-red">Rejected</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showReinitializeConfirmModal = false">Cancel</button>
          <button class="btn-warning" @click="confirmReinitialize">Yes, Re-initialize</button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>✅ Success</h3>
          <button class="close-btn" @click="showSuccessModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>{{ successMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="closeSuccessModal">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import leaveService from '@/stores/leaveService'
import employeeService from '@/stores/employee'

const route = useRoute()
const router = useRouter()
const leaveId = route.params.id
const today = new Date().toISOString().split('T')[0]

// State
const loading = ref(false)
const leaveRequest = ref(null)
const employeeDetails = ref(null)
const employeeBalance = ref(null)

// Modal states
const showExtensionModal = ref(false)
const showApproveConfirmModal = ref(false)
const showRejectConfirmModal = ref(false)
const showReinitializeConfirmModal = ref(false)
const showReturnConfirmModal = ref(false)
const showSuccessModal = ref(false)
const successMessage = ref('')
const actualReturnDate = ref(today)

const extensionDays = ref(1)
const extensionReason = ref('')
const approvalNotes = ref('')
const rejectionReason = ref('')
const rejectionNotes = ref('')

// ==================== HELPER FUNCTIONS ====================

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
  } catch (error) {
    return 'N/A'
  }
}

function getAnnualEntitlement(yearsOfService) {
  if (yearsOfService <= 2) return 16
  return 16 + Math.ceil((yearsOfService - 2) / 2)
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

function getStatusClass(status) {
  const classes = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
    cancelled: 'status-cancelled'
  }
  return classes[status] || 'status-default'
}

function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
    cancelled: '🚫'
  }
  return icons[status] || '📋'
}

function getLeaveTypeDays() {
  const days = {
    'Maternity Leave': 90,
    'Paternity Leave': 10,
    'Bereavement Leave': 5
  }
  return days[leaveRequest.value?.leave_type_name] || 'N/A'
}

function getReturnStatusClass(request) {
  if (!request) return 'status-info'
  if (request.actual_return_date) {
    const expectedReturn = new Date(request.return_date)
    const actual = new Date(request.actual_return_date)
    if (actual > expectedReturn) return 'status-warning'
    return 'status-success'
  }
  const currentDate = new Date()
  const returnDate = new Date(request.return_date)
  if (currentDate > returnDate) return 'status-danger'
  if (currentDate.toDateString() === returnDate.toDateString()) return 'status-warning'
  return 'status-info'
}

function getReturnStatusText(request) {
  if (!request) return 'N/A'
  if (request.actual_return_date) {
    const expectedReturn = new Date(request.return_date)
    const actual = new Date(request.actual_return_date)
    if (actual > expectedReturn) {
      const daysLate = Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24))
      return `Returned ${daysLate} days late`
    }
    return 'Returned on time'
  }
  const currentDate = new Date()
  const returnDate = new Date(request.return_date)
  if (currentDate > returnDate) {
    const daysOverdue = Math.ceil((currentDate - returnDate) / (1000 * 60 * 60 * 24))
    return `Overdue by ${daysOverdue} days`
  }
  if (currentDate.toDateString() === returnDate.toDateString()) return 'Expected today'
  return `Returns ${formatDate(request.return_date)}`
}

function showToastMessage(message, type = 'success') {
  successMessage.value = message
  showSuccessModal.value = true
}

// ==================== API CALLS ====================

async function loadLeaveData() {
  loading.value = true
  try {
    const result = await leaveService.getLeaveRequestById(parseInt(leaveId))
    console.log('API Response:', result)
    
    if (result.success && result.data) {
      const data = result.data
      
      // Map the API response to snake_case for template compatibility
      leaveRequest.value = {
        id: data.leaveRequestId,
        employee_id: data.employeeId,
        employee_name: data.employee ? `${data.employee.firstName} ${data.employee.lastName}` : 'N/A',
        employee_code: data.employee?.employeeCode || 'N/A',
        department_name: data.department?.name || 'N/A',
        leave_type_id: data.leaveTypeId,
        leave_type_name: data.leaveTypeName,
        start_date: data.startDate,
        end_date: data.endDate,
        return_date: data.returnDate,
        total_days: data.totalDays,
        reason: data.reason,
        status: data.status,
        requested_date: data.requestedDate,
        approved_by: data.approvedBy,
        approved_date: data.approvedDate,
        rejection_reason: data.rejectionReason,
        rejection_date: data.rejectedDate,
        hr_notes: data.hrNotes,
        return_status: data.returnStatus,
        actual_return_date: data.actualReturnDate,
        days_late: data.daysLate,
        extensions: data.extensions || []
      }
      
      console.log('Mapped leave request:', leaveRequest.value)
      
      // Load employee balance and details
      if (data.employeeId) {
        await Promise.all([
          loadEmployeeBalance(data.employeeId),
          loadEmployeeDetails(data.employeeId)
        ])
      }
    } else {
      console.error('Failed to load leave request:', result.error)
      showToastMessage(result.error || 'Failed to load leave request', 'error')
    }
  } catch (error) {
    console.error('Error loading leave data:', error)
    showToastMessage('Error loading leave request details', 'error')
  } finally {
    loading.value = false
  }
}

async function loadEmployeeBalance(employeeId) {
  try {
    const result = await leaveService.getEmployeeBalance(employeeId, new Date().getFullYear())
    console.log('Balance API Response:', result)
    
    if (result.success && result.data) {
      const balance = result.data
      
      // FIXED: Use the correct field names from your API response
      employeeBalance.value = {
        // Total days available = totalAccrued (includes carry over)
        annual_total: balance.totalAccrued || balance.totalAllocation || balance.yearlyEntitlement || 16,
        // Days used = totalUsed
        annual_used: balance.totalUsed || balance.usedThisYear || 0,
        // Available days
        available_days: balance.availableDays || 0,
        // Years of service
        years_of_service: balance.yearsOfService || 
          (balance.anniversaryPeriods ? balance.anniversaryPeriods.length - 1 : 1),
        // Carried over days
        carried_over: balance.carryOverDetails?.reduce((sum, detail) => sum + detail.carriedOver, 0) || 0,
        // Sick leave used
        sick_used: balance.sickUsedThisYear || 0,
        // Additional details for better display
        currentPeriodEntitlement: balance.currentPeriodEntitlement,
        currentPeriodUsed: balance.currentPeriodUsed,
        currentPeriodAccrued: balance.currentPeriodAccrued,
        totalAccrued: balance.totalAccrued,
        totalUsed: balance.totalUsed
      }
      
      // Debug log to verify values
      console.log('Mapped employee balance:', {
        annual_total: employeeBalance.value.annual_total,
        annual_used: employeeBalance.value.annual_used,
        available_days: employeeBalance.value.available_days,
        carried_over: employeeBalance.value.carried_over
      })
      
    } else {
      employeeBalance.value = {
        annual_total: 16,
        annual_used: 0,
        available_days: 16,
        years_of_service: 1,
        carried_over: 0,
        sick_used: 0
      }
    }
  } catch (error) {
    console.error('Error loading employee balance:', error)
    employeeBalance.value = {
      annual_total: 16,
      annual_used: 0,
      available_days: 16,
      years_of_service: 1,
      carried_over: 0,
      sick_used: 0
    }
  }
}

async function loadEmployeeDetails(employeeId) {
  try {
    const result = await employeeService.getEmployeeById(employeeId)
    console.log('Employee Details API Response:', result)
    
    if (result.success && result.data) {
      const emp = result.data
      
      // Calculate years of service from hireDate
      let yearsOfService = 0
      if (emp.hireDate) {
        const hireDate = new Date(emp.hireDate)
        const todayDate = new Date()
        yearsOfService = Math.floor((todayDate - hireDate) / (1000 * 60 * 60 * 24 * 365))
      }
      
      employeeDetails.value = {
        position: emp.position || emp.Position?.title || 'N/A',
        email: emp.email || emp.workEmail || emp.personalEmail || 'N/A',
        join_date: emp.hireDate,
        years_of_service: yearsOfService
      }
    } else {
      employeeDetails.value = {
        position: 'N/A',
        email: 'N/A',
        join_date: null,
        years_of_service: 0
      }
    }
  } catch (error) {
    console.error('Error loading employee details:', error)
    employeeDetails.value = {
      position: 'N/A',
      email: 'N/A',
      join_date: null,
      years_of_service: 0
    }
  }
}

// ==================== ACTION FUNCTIONS ====================

async function confirmApprove() {
  try {
    const result = await leaveService.approveLeave(leaveRequest.value.id, approvalNotes.value)
    if (result.success) {
      leaveRequest.value.status = 'approved'
      leaveRequest.value.approved_date = new Date().toISOString().split('T')[0]
      leaveRequest.value.approved_by = 'HR Manager'
      if (approvalNotes.value) {
        leaveRequest.value.hr_notes = approvalNotes.value
      }
      
      showApproveConfirmModal.value = false
      showToastMessage(result.message || 'Leave request approved successfully!', 'success')
      await loadLeaveData()
    } else {
      showToastMessage(result.error || 'Failed to approve leave request', 'error')
    }
  } catch (error) {
    console.error('Error approving leave:', error)
    showToastMessage('Failed to approve leave request', 'error')
  }
}

async function confirmReject() {
  if (!rejectionReason.value) {
    showToastMessage('Please provide a rejection reason', 'error')
    return
  }
  
  try {
    const result = await leaveService.rejectLeave(leaveRequest.value.id, rejectionReason.value, rejectionNotes.value)
    if (result.success) {
      leaveRequest.value.status = 'rejected'
      leaveRequest.value.rejection_reason = rejectionReason.value
      leaveRequest.value.rejection_date = new Date().toISOString().split('T')[0]
      if (rejectionNotes.value) {
        leaveRequest.value.hr_notes = rejectionNotes.value
      }
      
      showRejectConfirmModal.value = false
      showToastMessage(result.message || 'Leave request rejected', 'success')
      await loadLeaveData()
    } else {
      showToastMessage(result.error || 'Failed to reject leave request', 'error')
    }
  } catch (error) {
    console.error('Error rejecting leave:', error)
    showToastMessage('Failed to reject leave request', 'error')
  }
}

async function confirmExtension() {
  if (!extensionDays.value || extensionDays.value < 1) {
    showToastMessage('Please enter a valid number of days', 'error')
    return
  }
  if (!extensionReason.value) {
    showToastMessage('Please provide a reason for the extension', 'error')
    return
  }
  
  try {
    const result = await leaveService.requestExtension(leaveRequest.value.id, extensionDays.value, extensionReason.value)
    if (result.success) {
      const extension = result.data
      if (!leaveRequest.value.extensions) {
        leaveRequest.value.extensions = []
      }
      leaveRequest.value.extensions.push({
        requested_date: extension.requestedDate,
        additional_days: extension.additionalDays,
        reason: extension.reason,
        status: extension.status,
        new_end_date: extension.newEndDate,
        approved_by: extension.approvedBy,
        approved_date: extension.approvedDate,
        rejection_reason: extension.rejectionReason
      })
      
      showExtensionModal.value = false
      showToastMessage(`Extension request submitted for ${extensionDays.value} days. HR will review it.`, 'success')
    } else {
      showToastMessage(result.error || 'Failed to submit extension request', 'error')
    }
  } catch (error) {
    console.error('Error requesting extension:', error)
    showToastMessage('Failed to submit extension request', 'error')
  }
}

async function processConfirmReturn() {
  try {
    const result = await leaveService.confirmReturn(leaveRequest.value.id, actualReturnDate.value)
    if (result.success) {
      const expectedReturn = new Date(leaveRequest.value.return_date)
      const actual = new Date(actualReturnDate.value)
      const daysLate = Math.max(0, Math.ceil((actual - expectedReturn) / (1000 * 60 * 60 * 24)))
      
      leaveRequest.value.return_status = daysLate > 0 ? 'returned_late' : 'returned'
      leaveRequest.value.actual_return_date = actualReturnDate.value
      leaveRequest.value.days_late = daysLate
      
      showReturnConfirmModal.value = false
      showToastMessage(daysLate > 0 
        ? `${leaveRequest.value.employee_name} returned ${daysLate} days late` 
        : `${leaveRequest.value.employee_name} returned on time`, 'success')
      await loadLeaveData()
    } else {
      showToastMessage(result.error || 'Failed to confirm return', 'error')
    }
  } catch (error) {
    console.error('Error confirming return:', error)
    showToastMessage('Failed to confirm return', 'error')
  }
}

async function confirmReinitialize() {
  try {
    const result = await leaveService.updateLeaveRequest(leaveRequest.value.id, { status: 'pending' })
    if (result.success) {
      leaveRequest.value.status = 'pending'
      leaveRequest.value.rejection_reason = null
      leaveRequest.value.rejection_date = null
      
      showReinitializeConfirmModal.value = false
      showToastMessage('Request has been re-initialized and moved to pending for approval.', 'success')
      await loadLeaveData()
    } else {
      showToastMessage(result.error || 'Failed to re-initialize request', 'error')
    }
  } catch (error) {
    console.error('Error re-initializing leave:', error)
    showToastMessage('Failed to re-initialize request', 'error')
  }
}

function exportToCSV() {
  if (!leaveRequest.value) return
  
  const data = [{
    'Request ID': leaveRequest.value.id,
    'Employee Name': leaveRequest.value.employee_name,
    'Employee Code': leaveRequest.value.employee_code,
    'Department': leaveRequest.value.department_name,
    'Leave Type': leaveRequest.value.leave_type_name,
    'Start Date': leaveRequest.value.start_date,
    'End Date': leaveRequest.value.end_date,
    'Return Date': leaveRequest.value.return_date,
    'Total Days': leaveRequest.value.total_days,
    'Reason': leaveRequest.value.reason,
    'Status': leaveRequest.value.status,
    'Requested Date': leaveRequest.value.requested_date,
    'Approved/Rejected Date': leaveRequest.value.approved_date || leaveRequest.value.rejection_date || '',
    'Approved/Rejected By': leaveRequest.value.approved_by || '',
    'Rejection Reason': leaveRequest.value.rejection_reason || '',
    'Return Status': leaveRequest.value.return_status || '',
    'Actual Return Date': leaveRequest.value.actual_return_date || ''
  }]
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || ''
      return `"${String(value).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leave_request_${leaveRequest.value.id}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  showToastMessage('CSV exported successfully!', 'success')
}

// Modal open functions
function openApproveModal() {
  approvalNotes.value = ''
  showApproveConfirmModal.value = true
}

function openRejectModal() {
  rejectionReason.value = ''
  rejectionNotes.value = ''
  showRejectConfirmModal.value = true
}

function openReinitializeModal() {
  showReinitializeConfirmModal.value = true
}

function openExtensionModal() {
  extensionDays.value = 1
  extensionReason.value = ''
  showExtensionModal.value = true
}

function openReturnConfirmModal() {
  actualReturnDate.value = today
  showReturnConfirmModal.value = true
}

function closeSuccessModal() {
  showSuccessModal.value = false
}

function goBack() {
  router.push('/leaves')
}

// ==================== INITIALIZATION ====================

onMounted(() => {
  loadLeaveData()
})
</script>
<style scoped>
/* Keep all existing styles and add these */

.warning-text {
  color: #ef4444;
}

.btn-success {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.balance-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: #475569;
}

.balance-row span {
  color: #64748b;
}

.text-success {
  color: #10b981;
}

.text-purple {
  color: #8b5cf6;
}

.balance-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
}

.btn-success:hover {
  background: #059669;
}

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

.status-success { background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }
.status-warning { background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }
.status-danger { background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }
.status-info { background: #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 20px; font-size: 11px; display: inline-block; }

/* Responsive */
@media (max-width: 768px) {
  .return-dates {
    flex-direction: column;
  }
  .date-arrow {
    transform: rotate(90deg);
  }
}

.leave-detail-page {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;
}

/* Header */
.detail-header {
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.back-btn:hover { background: #f1f5f9; }

.header-actions { display: flex; gap: 12px; }

/* Status Banner */
.status-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.status-banner.status-pending { border-left: 4px solid #f59e0b; }
.status-banner.status-approved { border-left: 4px solid #10b981; }
.status-banner.status-rejected { border-left: 4px solid #ef4444; }

.status-icon { font-size: 32px; }
.status-info { flex: 1; }
.status-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
.status-value { font-size: 20px; font-weight: 700; }
.status-banner.status-pending .status-value { color: #f59e0b; }
.status-banner.status-approved .status-value { color: #10b981; }
.status-banner.status-rejected .status-value { color: #ef4444; }
.status-date { font-size: 13px; color: #64748b; }

/* Detail Cards */
.detail-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.detail-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2ff;
}

.card-icon { font-size: 24px; }
.card-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }

.card-body { padding: 24px; }

.info-group { display: flex; flex-direction: column; gap: 16px; }
.info-row { display: flex; justify-content: space-between; align-items: flex-start; }
.info-row label { font-size: 12px; font-weight: 600; color: #64748b; min-width: 120px; }
.info-row span { font-size: 14px; color: #1e293b; }
.info-row.full-width { flex-direction: column; gap: 8px; }

.request-id { font-family: monospace; font-weight: 600; color: #3b82f6; }
.date-highlight { font-weight: 600; color: #3b82f6; }
.days-number { font-size: 24px; font-weight: 700; color: #3b82f6; }
.reason-box, .rejection-box, .notes-box { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.5; }

.leave-type-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.type-annual { background: #d1fae5; color: #059669; }
.type-sick { background: #fee2e2; color: #dc2626; }
.type-maternity { background: #fef3c7; color: #d97706; }
.type-paternity { background: #dbeafe; color: #2563eb; }
.type-bereavement { background: #f3e8ff; color: #9333ea; }

.department-badge { background: #e0e7ff; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
.employee-name { font-size: 16px; font-weight: 700; color: #1e293b; }

/* Balance Section */
.balance-container { display: flex; flex-direction: column; gap: 16px; }
.balance-card { background: #f8fafc; border-radius: 12px; padding: 16px; }
.balance-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.balance-title { font-weight: 600; color: #1e293b; }
.balance-used { font-size: 14px; color: #64748b; }
.progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
.progress-fill { height: 100%; background: #10b981; border-radius: 4px; }
.balance-footer { display: flex; justify-content: space-between; font-size: 13px; }
.balance-note { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.balance-warning { background: #fef3c7; color: #d97706; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-top: 12px; }

/* Extension Timeline */
.extension-timeline { margin-top: 8px; }
.timeline-item { display: flex; gap: 16px; margin-bottom: 20px; position: relative; }
.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 24px;
  bottom: -20px;
  width: 2px;
  background: #e2e8f0;
}
.timeline-dot { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.timeline-dot.pending { background: #f59e0b; }
.timeline-dot.approved { background: #10b981; }
.timeline-dot.rejected { background: #ef4444; }
.timeline-content { flex: 1; background: #f8fafc; border-radius: 12px; padding: 12px 16px; }
.timeline-header { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
.timeline-date { font-size: 12px; color: #64748b; }
.timeline-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
.timeline-status.pending { background: #fef3c7; color: #d97706; }
.timeline-status.approved { background: #d1fae5; color: #059669; }
.timeline-status.rejected { background: #fee2e2; color: #dc2626; }
.timeline-body { font-size: 13px; color: #475569; }
.timeline-field { margin-bottom: 6px; }
.timeline-field.highlight { color: #3b82f6; }
.days-badge { background: #dbeafe; color: #2563eb; padding: 2px 6px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.btn-extension { background: #f59e0b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-left: auto; }
.btn-extension:hover { background: #d97706; }
.no-extensions { text-align: center; padding: 40px; color: #94a3b8; }
.no-extensions-icon { font-size: 48px; opacity: 0.5; display: block; margin-bottom: 12px; }
.sub-text { font-size: 12px; margin-top: 8px; }

/* Loading & Not Found */
.loading-container, .not-found-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
.not-found-icon { font-size: 64px; opacity: 0.5; margin-bottom: 20px; }

/* Buttons */
.btn-primary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-danger { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-danger:hover { background: #dc2626; }
.btn-approve { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-approve:hover { background: #059669; }
.btn-reject { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-reject:hover { background: #dc2626; }
.btn-warning { background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-warning:hover { background: #d97706; }

/* Modals */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 85vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eef2ff; }
.modal-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 20px; }
.modal-footer { padding: 16px 20px; border-top: 1px solid #eef2ff; display: flex; justify-content: flex-end; gap: 12px; }
.info-group-modal { background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.info-row-modal { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
.info-row-modal:last-child { border-bottom: none; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #1e293b; }
.form-input, .form-textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; }
.form-input:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; }
.required { color: #ef4444; }

/* Responsive */
@media (max-width: 768px) {
  .leave-detail-page { padding: 16px; }
  .detail-main { grid-template-columns: 1fr; }
  .header-top { flex-direction: column; align-items: flex-start; }
  .status-banner { flex-direction: column; align-items: flex-start; }
  .info-row { flex-direction: column; gap: 4px; }
  .info-row label { min-width: auto; }
}

.warning-text {
  color: #ef4444;
}
.leave-detail-page {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;
}

/* Header */
.detail-header {
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.back-btn:hover { background: #f1f5f9; }

.header-actions { display: flex; gap: 12px; }

/* Status Banner */
.status-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.status-banner.status-pending { border-left: 4px solid #f59e0b; }
.status-banner.status-approved { border-left: 4px solid #10b981; }
.status-banner.status-rejected { border-left: 4px solid #ef4444; }

.status-icon { font-size: 32px; }
.status-info { flex: 1; }
.status-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
.status-value { font-size: 20px; font-weight: 700; }
.status-banner.status-pending .status-value { color: #f59e0b; }
.status-banner.status-approved .status-value { color: #10b981; }
.status-banner.status-rejected .status-value { color: #ef4444; }
.status-date { font-size: 13px; color: #64748b; }

/* Detail Cards */
.detail-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.detail-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2ff;
}

.card-icon { font-size: 24px; }
.card-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }

.card-body { padding: 24px; }

.info-group { display: flex; flex-direction: column; gap: 16px; }
.info-row { display: flex; justify-content: space-between; align-items: flex-start; }
.info-row label { font-size: 12px; font-weight: 600; color: #64748b; min-width: 120px; }
.info-row span { font-size: 14px; color: #1e293b; }
.info-row.full-width { flex-direction: column; gap: 8px; }

.request-id { font-family: monospace; font-weight: 600; color: #3b82f6; }
.date-highlight { font-weight: 600; color: #3b82f6; }
.days-number { font-size: 24px; font-weight: 700; color: #3b82f6; }
.reason-box, .rejection-box, .notes-box { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 13px; line-height: 1.5; }

.leave-type-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.type-annual { background: #d1fae5; color: #059669; }
.type-sick { background: #fee2e2; color: #dc2626; }
.type-maternity { background: #fef3c7; color: #d97706; }
.type-paternity { background: #dbeafe; color: #2563eb; }
.type-bereavement { background: #f3e8ff; color: #9333ea; }

.department-badge { background: #e0e7ff; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
.employee-name { font-size: 16px; font-weight: 700; color: #1e293b; }

/* Balance Section */
.balance-container { display: flex; flex-direction: column; gap: 16px; }
.balance-card { background: #f8fafc; border-radius: 12px; padding: 16px; }
.balance-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.balance-title { font-weight: 600; color: #1e293b; }
.balance-used { font-size: 14px; color: #64748b; }
.progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
.progress-fill { height: 100%; background: #10b981; border-radius: 4px; }
.balance-footer { display: flex; justify-content: space-between; font-size: 13px; }
.warning-text { color: #ef4444; font-size: 12px; }
.balance-note { font-size: 13px; color: #64748b; display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.balance-warning { background: #fef3c7; color: #d97706; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-top: 12px; }

/* Extension Timeline */
.extension-timeline { margin-top: 8px; }
.timeline-item { display: flex; gap: 16px; margin-bottom: 20px; position: relative; }
.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 24px;
  bottom: -20px;
  width: 2px;
  background: #e2e8f0;
}
.timeline-dot { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.timeline-dot.pending { background: #f59e0b; }
.timeline-dot.approved { background: #10b981; }
.timeline-dot.rejected { background: #ef4444; }
.timeline-content { flex: 1; background: #f8fafc; border-radius: 12px; padding: 12px 16px; }
.timeline-header { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
.timeline-date { font-size: 12px; color: #64748b; }
.timeline-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
.timeline-status.pending { background: #fef3c7; color: #d97706; }
.timeline-status.approved { background: #d1fae5; color: #059669; }
.timeline-status.rejected { background: #fee2e2; color: #dc2626; }
.timeline-body { font-size: 13px; color: #475569; }
.timeline-field { margin-bottom: 6px; }
.timeline-field.highlight { color: #3b82f6; }
.days-badge { background: #dbeafe; color: #2563eb; padding: 2px 6px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.btn-extension { background: #f59e0b; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-left: auto; }
.btn-extension:hover { background: #d97706; }
.no-extensions { text-align: center; padding: 40px; color: #94a3b8; }
.no-extensions-icon { font-size: 48px; opacity: 0.5; display: block; margin-bottom: 12px; }
.sub-text { font-size: 12px; margin-top: 8px; }

/* Pending Extensions Box */
.pending-extensions-box { background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 12px; margin-bottom: 16px; }
.pending-title { font-size: 13px; font-weight: 600; color: #92400e; margin-bottom: 8px; }
.pending-item { font-size: 12px; color: #78350f; padding: 4px 0; border-bottom: 1px solid #fde68a; }
.pending-item:last-child { border-bottom: none; }

/* Loading & Not Found */
.loading-container, .not-found-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
.not-found-icon { font-size: 64px; opacity: 0.5; margin-bottom: 20px; }

/* Buttons */
.btn-primary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-danger { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-danger:hover { background: #dc2626; }
.btn-approve { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-approve:hover { background: #059669; }
.btn-reject { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-reject:hover { background: #dc2626; }
.btn-warning { background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.btn-warning:hover { background: #d97706; }

/* Modals */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 85vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eef2ff; }
.modal-header h3 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 20px; }
.modal-footer { padding: 16px 20px; border-top: 1px solid #eef2ff; display: flex; justify-content: flex-end; gap: 12px; }
.info-group-modal { background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
.info-row-modal { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
.info-row-modal:last-child { border-bottom: none; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #1e293b; }
.form-input, .form-textarea { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: inherit; }
.form-input:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; }
.required { color: #ef4444; }

/* Responsive */
@media (max-width: 768px) {
  .leave-detail-page { padding: 16px; }
  .detail-main { grid-template-columns: 1fr; }
  .header-top { flex-direction: column; align-items: flex-start; }
  .status-banner { flex-direction: column; align-items: flex-start; }
  .info-row { flex-direction: column; gap: 4px; }
  .info-row label { min-width: auto; }
}
</style>