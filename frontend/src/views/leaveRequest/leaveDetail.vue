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
        </div>
      </div>

      <!-- Main Content Grid (keep the same) -->
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
                <label>Total Days</label>
                <span class="days-number">{{ leaveRequest.total_days }} days</span>
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
            <div v-if="leaveRequest.leave_type_name === 'Annual Leave'" class="balance-card">
              <div class="balance-header">
                <span class="balance-title">Annual Leave Balance</span>
                <span class="balance-used">{{ employeeBalance?.annual_used || 0 }} / {{ employeeBalance?.annual_total || 22 }} days used</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: ((employeeBalance?.annual_used || 0) / 22 * 100) + '%' }"></div>
              </div>
              <div class="balance-footer">
                <span>✅ Remaining: <strong>{{ (employeeBalance?.annual_total || 22) - (employeeBalance?.annual_used || 0) }} days</strong></span>
                <span v-if="((employeeBalance?.annual_total || 22) - (employeeBalance?.annual_used || 0)) < 5" class="warning-text">⚠️ Low balance</span>
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
                <span v-if="(employeeBalance?.other_used || 0) > 0">Employee has used {{ employeeBalance?.other_used }} days of this leave type.</span>
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

    <!-- Success Modal -->
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
          <button class="btn-primary" @click="closeSuccessAndGoBack">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const leaveId = route.params.id

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
const showSuccessModal = ref(false)
const successMessage = ref('')

const extensionDays = ref(1)
const extensionReason = ref('')
const approvalNotes = ref('')
const rejectionReason = ref('')
const rejectionNotes = ref('')

// Mock data
const mockLeaveRequests = [
  { id: 1, employee_id: 44, employee_name: 'Nuru Seid', employee_code: 'EMP006', department_name: 'Finance', leave_type_id: 1, leave_type_name: 'Annual Leave', start_date: '2026-05-10', end_date: '2026-05-14', total_days: 5, reason: 'Family vacation to Dubai', status: 'pending', requested_date: '2026-04-15' },
  { id: 2, employee_id: 39, employee_name: 'Biruk Mulualem', employee_code: 'EMP001', department_name: 'IT', leave_type_id: 2, leave_type_name: 'Sick Leave', start_date: '2026-05-20', end_date: '2026-05-22', total_days: 3, reason: 'Medical checkup and treatment', status: 'pending', requested_date: '2026-05-18' },
  { id: 3, employee_id: 45, employee_name: 'Tadese Jemberu', employee_code: 'EMP007', department_name: 'IT', leave_type_id: 2, leave_type_name: 'Sick Leave', start_date: '2026-05-05', end_date: '2026-05-06', total_days: 2, reason: 'Flu symptoms', status: 'approved', requested_date: '2026-05-03', approved_by: 'HR Manager', approved_date: '2026-05-04', extensions: [{ id: 1, requested_date: '2026-05-06', additional_days: 3, reason: 'Still have fever', status: 'approved', new_end_date: '2026-05-09' }] },
  { id: 4, employee_id: 47, employee_name: 'Haymanot Abebaw', employee_code: 'EMP009', department_name: 'IT', leave_type_id: 3, leave_type_name: 'Maternity Leave', start_date: '2026-05-01', end_date: '2026-07-29', total_days: 90, reason: 'Maternity leave', status: 'approved', requested_date: '2026-03-01', approved_by: 'HR Manager', approved_date: '2026-03-05' },
  { id: 5, employee_id: 40, employee_name: 'Dagmawi Hadgu', employee_code: 'EMP002', department_name: 'IT', leave_type_id: 1, leave_type_name: 'Annual Leave', start_date: '2026-06-01', end_date: '2026-06-10', total_days: 8, reason: 'Wedding ceremony', status: 'pending', requested_date: '2026-05-01' },
  { id: 6, employee_id: 46, employee_name: 'Eshete Worke', employee_code: 'EMP008', department_name: 'IT', leave_type_id: 1, leave_type_name: 'Annual Leave', start_date: '2026-05-15', end_date: '2026-05-19', total_days: 5, reason: 'Family visit', status: 'approved', requested_date: '2026-04-20', approved_by: 'HR Manager', approved_date: '2026-04-22' },
  { id: 7, employee_id: 41, employee_name: 'Melkamu Zewdu', employee_code: 'EMP003', department_name: 'IT', leave_type_id: 4, leave_type_name: 'Paternity Leave', start_date: '2026-06-15', end_date: '2026-06-24', total_days: 10, reason: 'New baby arrival', status: 'pending', requested_date: '2026-05-10' },
  { id: 8, employee_id: 42, employee_name: 'Melaku Tewodros', employee_code: 'EMP004', department_name: 'IT', leave_type_id: 5, leave_type_name: 'Bereavement Leave', start_date: '2026-05-08', end_date: '2026-05-12', total_days: 5, reason: 'Family funeral', status: 'rejected', requested_date: '2026-05-07', rejection_reason: 'Insufficient documentation, please provide death certificate', rejection_date: '2026-05-07', approved_by: 'HR Manager', approved_date: '2026-05-07' }
]

const mockEmployeeBalances = [
  { id: 39, name: 'Biruk Mulualem', code: 'EMP001', department: 'IT', annual_total: 22, annual_used: 7, sick_used: 5, other_used: 0 },
  { id: 40, name: 'Dagmawi Hadgu', code: 'EMP002', department: 'IT', annual_total: 22, annual_used: 12, sick_used: 3, other_used: 0 },
  { id: 41, name: 'Melkamu Zewdu', code: 'EMP003', department: 'IT', annual_total: 22, annual_used: 5, sick_used: 2, other_used: 0 },
  { id: 42, name: 'Melaku Tewodros', code: 'EMP004', department: 'IT', annual_total: 22, annual_used: 18, sick_used: 8, other_used: 5 },
  { id: 44, name: 'Nuru Seid', code: 'EMP006', department: 'Finance', annual_total: 22, annual_used: 5, sick_used: 1, other_used: 0 },
  { id: 45, name: 'Tadese Jemberu', code: 'EMP007', department: 'IT', annual_total: 22, annual_used: 8, sick_used: 9, other_used: 0 },
  { id: 46, name: 'Eshete Worke', code: 'EMP008', department: 'IT', annual_total: 22, annual_used: 15, sick_used: 4, other_used: 0 },
  { id: 47, name: 'Haymanot Abebaw', code: 'EMP009', department: 'IT', annual_total: 22, annual_used: 2, sick_used: 0, other_used: 90 }
]

// Computed
const pendingExtensions = computed(() => {
  if (leaveRequest.value?.extensions) {
    return leaveRequest.value.extensions.filter(ext => ext.status === 'pending')
  }
  return []
})

// Methods
function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString()
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
    rejected: 'status-rejected'
  }
  return classes[status] || 'status-default'
}

function getStatusIcon(status) {
  const icons = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌'
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

function goBack() {
  router.push('/leaves')
}

function exportToCSV() {
  const data = [{
    'Request ID': leaveRequest.value.id,
    'Employee Name': leaveRequest.value.employee_name,
    'Employee Code': leaveRequest.value.employee_code,
    'Department': leaveRequest.value.department_name,
    'Leave Type': leaveRequest.value.leave_type_name,
    'Start Date': leaveRequest.value.start_date,
    'End Date': leaveRequest.value.end_date,
    'Total Days': leaveRequest.value.total_days,
    'Reason': leaveRequest.value.reason,
    'Status': leaveRequest.value.status,
    'Requested Date': leaveRequest.value.requested_date,
    'Approved/Rejected Date': leaveRequest.value.approved_date || leaveRequest.value.rejection_date || '',
    'Approved/Rejected By': leaveRequest.value.approved_by || '',
    'Rejection Reason': leaveRequest.value.rejection_reason || ''
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
  
  successMessage.value = 'CSV exported successfully!'
  showSuccessModal.value = true
}

// Extension functions
function openExtensionModal() {
  extensionDays.value = 1
  extensionReason.value = ''
  showExtensionModal.value = true
}

function confirmExtension() {
  if (!extensionDays.value || extensionDays.value < 1) {
    successMessage.value = 'Please enter a valid number of days'
    showSuccessModal.value = true
    return
  }
  if (!extensionReason.value) {
    successMessage.value = 'Please provide a reason for the extension'
    showSuccessModal.value = true
    return
  }
  
  const extension = {
    id: Date.now(),
    requested_date: new Date().toISOString().split('T')[0],
    additional_days: extensionDays.value,
    reason: extensionReason.value,
    status: 'pending'
  }
  
  if (!leaveRequest.value.extensions) {
    leaveRequest.value.extensions = []
  }
  leaveRequest.value.extensions.push(extension)
  
  showExtensionModal.value = false
  successMessage.value = `Extension request submitted for ${extensionDays.value} days. HR will review it.`
  showSuccessModal.value = true
}

// Approve functions
function openApproveModal() {
  approvalNotes.value = ''
  showApproveConfirmModal.value = true
}

function confirmApprove() {
  // Process pending extensions
  if (leaveRequest.value.extensions && leaveRequest.value.extensions.length > 0) {
    for (const ext of leaveRequest.value.extensions) {
      if (ext.status === 'pending') {
        ext.status = 'approved'
        ext.approved_date = new Date().toISOString().split('T')[0]
        ext.approved_by = 'HR Manager'
        
        const currentEnd = new Date(leaveRequest.value.end_date)
        currentEnd.setDate(currentEnd.getDate() + ext.additional_days)
        ext.new_end_date = currentEnd.toISOString().split('T')[0]
        leaveRequest.value.end_date = ext.new_end_date
        leaveRequest.value.total_days += ext.additional_days
      }
    }
  }
  
  leaveRequest.value.status = 'approved'
  leaveRequest.value.approved_by = 'HR Manager'
  leaveRequest.value.approved_date = new Date().toISOString().split('T')[0]
  leaveRequest.value.hr_notes = approvalNotes.value
  
  showApproveConfirmModal.value = false
  successMessage.value = 'Leave request approved successfully!'
  showSuccessModal.value = true
}

// Reject functions
function openRejectModal() {
  rejectionReason.value = ''
  rejectionNotes.value = ''
  showRejectConfirmModal.value = true
}

function confirmReject() {
  if (!rejectionReason.value) {
    successMessage.value = 'Please provide a rejection reason'
    showSuccessModal.value = true
    return
  }
  
  leaveRequest.value.status = 'rejected'
  leaveRequest.value.rejection_reason = rejectionReason.value
  leaveRequest.value.rejection_date = new Date().toISOString().split('T')[0]
  leaveRequest.value.hr_notes = rejectionNotes.value
  
  showRejectConfirmModal.value = false
  successMessage.value = 'Leave request rejected'
  showSuccessModal.value = true
}

// Re-initialize functions
function openReinitializeModal() {
  showReinitializeConfirmModal.value = true
}

function confirmReinitialize() {
  const index = mockLeaveRequests.findIndex(r => r.id == leaveId)
  if (index !== -1) {
    mockLeaveRequests[index].status = 'pending'
    delete mockLeaveRequests[index].rejection_reason
    delete mockLeaveRequests[index].rejection_date
    
    leaveRequest.value.status = 'pending'
    leaveRequest.value.rejection_reason = null
  }
  
  showReinitializeConfirmModal.value = false
  successMessage.value = 'Request has been re-initialized and moved to pending for approval.'
  showSuccessModal.value = true
}

function closeSuccessAndGoBack() {
  showSuccessModal.value = false
  goBack()
}

// Load leave data
function loadLeaveData() {
  loading.value = true
  
  setTimeout(() => {
    const found = mockLeaveRequests.find(l => l.id == leaveId)
    if (found) {
      leaveRequest.value = JSON.parse(JSON.stringify(found))
      const empBalance = mockEmployeeBalances.find(e => e.id === found.employee_id)
      if (empBalance) {
        employeeBalance.value = empBalance
        employeeDetails.value = {
          position: empBalance.name.includes('Biruk') ? 'Senior Developer' : 
                    empBalance.name.includes('Dagmawi') ? 'Team Lead' :
                    empBalance.name.includes('Nuru') ? 'Finance Manager' : 'Staff',
          email: `${empBalance.name.toLowerCase().replace(' ', '.')}@company.com`,
          join_date: '2020-01-15'
        }
      }
    }
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadLeaveData()
})
</script>


<style scoped>
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