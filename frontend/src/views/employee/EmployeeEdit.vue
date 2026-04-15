<template>
  <div class="employee-edit">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading employee information...</p>
    </div>

    <div v-else-if="employeeData" class="edit-wrapper">
      <!-- Header Actions -->
      <div class="action-bar">
        <router-link to="/employees" class="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to List
        </router-link>
        <button @click="saveEmployee" class="action-btn primary" :disabled="saving">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-left">
          <div class="employee-avatar-large" @click="triggerProfileInput">
            <img :src="profilePreview || employeeData.profilePicture || getAvatarUrl(employeeData.fullName)" :alt="employeeData.fullName">
            <div class="avatar-overlay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          </div>
          <input type="file" ref="profileInput" @change="handleProfileUpload" accept="image/jpeg,image/png" style="display: none">
          <div class="employee-basic">
            <div class="edit-name-container">
              <input type="text" v-model="form.firstName" placeholder="First Name" class="name-input">
              <input type="text" v-model="form.lastName" placeholder="Last Name" class="name-input">
            </div>
            <div class="employee-tags">
              <span class="tag">{{ getPositionName }}</span>
              <span class="tag">{{ getDepartmentName }}</span>
            </div>
          </div>
        </div>
        <div class="hero-right">
          <div class="employee-code">
            <span class="code-label">Employee ID</span>
            <strong class="code-value">{{ employeeData.employeeId }}</strong>
          </div>
          <select v-model="form.status" class="status-select" :class="form.status">
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">Department</span><span class="stat-number">{{ getDepartmentName }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">Hire Date</span><span class="stat-number">{{ formatDate(form.hireDate) }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">Employment Type</span><span class="stat-number">{{ getEmploymentTypeLabel(form.employmentType) }}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-3.31 0-6 2.69-6 6 0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6 0-3.31-2.69-6-6-6z" /><path d="M12 2v2M22 12h-2M4 12H2M12 22v2" /></svg></div>
          <div class="stat-card-info"><span class="stat-label">Salary</span><span class="stat-number">{{ form.salary ? `ETB ${Number(form.salary).toLocaleString()}` : '—' }}</span></div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Personal Info Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></div>
              <h3>Personal Information</h3>
            </div>
            <div class="info-list">
              <div class="info-item"><span class="info-label">First Name</span><div class="info-value"><input type="text" v-model="form.firstName" placeholder="First Name"></div></div>
              <div class="info-item"><span class="info-label">Last Name</span><div class="info-value"><input type="text" v-model="form.lastName" placeholder="Last Name"></div></div>
              <div class="info-item"><span class="info-label">Middle Name</span><div class="info-value"><input type="text" v-model="form.middleName" placeholder="Middle Name"></div></div>
              <div class="info-item"><span class="info-label">Work Email</span><div class="info-value"><input type="email" v-model="form.email" placeholder="employee@company.com"></div></div>
              <div class="info-item"><span class="info-label">Personal Email</span><div class="info-value"><input type="email" v-model="form.personalEmail" placeholder="personal@email.com"></div></div>
              <div class="info-item"><span class="info-label">Phone</span><div class="info-value"><input type="tel" v-model="form.phone" placeholder="+251 911 000 000"></div></div>
              <div class="info-item"><span class="info-label">Date of Birth</span><div class="info-value"><input type="date" v-model="form.dob"></div></div>
              <div class="info-item"><span class="info-label">Gender</span><div class="info-value"><select v-model="form.gender"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div></div>
              
              <!-- Nationality Dropdown -->
              <div class="info-item">
                <span class="info-label">Nationality</span>
                <div class="info-value">
                  <select v-model="form.nationality">
                    <option value="">Select Nationality</option>
                    <option value="Ethiopian">Ethiopian</option>
                    <option value="American">American</option>
                    <option value="British">British</option>
                    <option value="Canadian">Canadian</option>
                    <option value="Australian">Australian</option>
                    <option value="German">German</option>
                    <option value="French">French</option>
                    <option value="Italian">Italian</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Indian">Indian</option>
                    <option value="Kenyan">Kenyan</option>
                    <option value="Nigerian">Nigerian</option>
                    <option value="South African">South African</option>
                  </select>
                </div>
              </div>
              
              <div class="info-item"><span class="info-label">Marital Status</span><div class="info-value"><select v-model="form.maritalStatus"><option value="">Select</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option></select></div></div>
            </div>
          </div>

          <!-- Address Card -->
          <div class="info-card address-card">
            <div class="card-header">
              <div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
              <h3>Address Information</h3>
            </div>
            <div class="address-content">
              <textarea v-model="form.address" rows="3" placeholder="Current Address - Street, City, State, Zip Code" class="address-input"></textarea>
            </div>
          </div>

          <!-- Emergency Contact Card -->
          <div class="info-card emergency-card">
            <div class="card-header">
              <div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg></div>
              <h3>Emergency Contact</h3>
            </div>
            <div class="info-list">
              <div class="info-item"><span class="info-label">Contact Name</span><div class="info-value"><input type="text" v-model="form.emergencyContactName" placeholder="Full name"></div></div>
              <div class="info-item"><span class="info-label">Phone</span><div class="info-value"><input type="tel" v-model="form.emergencyContactPhone" placeholder="Phone number"></div></div>
              <div class="info-item"><span class="info-label">Alternative Phone</span><div class="info-value"><input type="tel" v-model="form.emergencyContactAltPhone" placeholder="Alternative phone"></div></div>
              
              <!-- Relationship Dropdown -->
              <div class="info-item">
                <span class="info-label">Relationship</span>
                <div class="info-value">
                  <select v-model="form.emergencyContactRelation">
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Relative</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Employment Card -->
          <div class="info-card">
            <div class="card-header">
              <div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg></div>
              <h3>Employment Information</h3>
            </div>
            <div class="info-list">
              <!-- Department Dropdown -->
              <div class="info-item">
                <span class="info-label">Department</span>
                <div class="info-value">
                  <select v-model="form.departmentId" @change="onDepartmentChange">
                    <option :value="null">Select Department</option>
                    <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">
                      {{ dept.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Position Dropdown -->
              <div class="info-item">
                <span class="info-label">Position</span>
                <div class="info-value">
                  <select v-model="form.positionId">
                    <option :value="null">Select Position</option>
                    <option v-for="pos in positions" :key="pos.positionId" :value="pos.positionId">
                      {{ pos.title }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Employment Type -->
              <div class="info-item">
                <span class="info-label">Employment Type</span>
                <div class="info-value">
                  <select v-model="form.employmentType">
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
              </div>

              <!-- Hire Date -->
              <div class="info-item">
                <span class="info-label">Hire Date</span>
                <div class="info-value">
                  <input type="date" v-model="form.hireDate">
                </div>
              </div>

              <!-- Confirmation Date -->
              <div class="info-item">
                <span class="info-label">Confirmation Date</span>
                <div class="info-value">
                  <input type="date" v-model="form.confirmationDate">
                </div>
              </div>

              <!-- Termination Date -->
              <div class="info-item">
                <span class="info-label">Termination Date</span>
                <div class="info-value">
                  <input type="date" v-model="form.terminationDate">
                </div>
              </div>

              <!-- Salary -->
              <div class="info-item">
                <span class="info-label">Salary (ETB)</span>
                <div class="info-value">
                  <input type="number" v-model="form.salary" step="1000" placeholder="0.00">
                </div>
              </div>

              <!-- Manager Dropdown -->
              <div class="info-item">
                <span class="info-label">Manager</span>
                <div class="info-value">
                  <select v-model="form.managerId">
                    <option :value="null">None</option>
                    <option v-for="mgr in managers" :key="mgr.id" :value="mgr.id">
                      {{ mgr.fullName }} ({{ mgr.employeeId }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Work Location -->
              <div class="info-item">
                <span class="info-label">Work Location</span>
                <div class="info-value">
                  <input type="text" v-model="form.workLocation" placeholder="Head Office, Branch Name">
                </div>
              </div>
            </div>
          </div>

          <!-- Bank Account Card -->
          <div class="info-card bank-card">
            <div class="card-header">
              <div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 7H7M17 17H7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></svg></div>
              <h3>Bank Account</h3>
            </div>
            <div class="info-list">
              <!-- Bank Name Dropdown -->
              <div class="info-item">
                <span class="info-label">Bank Name</span>
                <div class="info-value">
                  <select v-model="form.bankName">
                    <option value="">Select Bank</option>
                    <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</option>
                    <option value="Awash Bank">Awash Bank</option>
                    <option value="Dashen Bank">Dashen Bank</option>
                    <option value="United Bank">United Bank</option>
                    <option value="Nib International Bank">Nib International Bank</option>
                    <option value="Hibret Bank">Hibret Bank</option>
                    <option value="Wegagen Bank">Wegagen Bank</option>
                    <option value="Oromia Bank">Oromia Bank</option>
                    <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                    <option value="Zemen Bank">Zemen Bank</option>
                  </select>
                </div>
              </div>
              <div class="info-item"><span class="info-label">Account Number</span><div class="info-value"><input type="text" v-model="form.accountNumber" placeholder="Account number"></div></div>
              <div class="info-item"><span class="info-label">Account Holder</span><div class="info-value"><input type="text" v-model="form.accountHolderName" placeholder="Account holder name"></div></div>
              <div class="info-item"><span class="info-label">Branch</span><div class="info-value"><input type="text" v-model="form.branch" placeholder="Branch name"></div></div>
            </div>
          </div>

          <!-- Documents Card -->
          <div class="info-card documents-card">
            <div class="card-header">
              <div class="card-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></svg></div>
              <h3>Documents</h3>
            </div>
            <div class="documents-list">
              <div class="document-row">
                <div class="document-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></div>
                <div class="document-info"><span class="document-name">ID Card</span><span class="document-status" :class="documents.id_card ? 'uploaded' : 'missing'">{{ documents.id_card ? 'Uploaded' : 'Not provided' }}</span></div>
                <button type="button" class="upload-small-btn" @click="triggerFileInput('id_card')">{{ documents.id_card ? 'Change' : 'Upload' }}</button>
                <input type="file" ref="idFileInput" @change="handleFileUpload('id_card', $event)" accept=".pdf,.jpg,.jpeg,.png" style="display: none">
              </div>
              <div class="document-row">
                <div class="document-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg></div>
                <div class="document-info"><span class="document-name">CV / Resume</span><span class="document-status" :class="documents.cv ? 'uploaded' : 'missing'">{{ documents.cv ? 'Uploaded' : 'Not provided' }}</span></div>
                <button type="button" class="upload-small-btn" @click="triggerFileInput('cv')">{{ documents.cv ? 'Change' : 'Upload' }}</button>
                <input type="file" ref="cvFileInput" @change="handleFileUpload('cv', $event)" accept=".pdf,.doc,.docx" style="display: none">
              </div>
              <div class="document-row">
                <div class="document-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10-5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></div>
                <div class="document-info"><span class="document-name">Degree / Certificate</span><span class="document-status" :class="documents.degree ? 'uploaded' : 'missing'">{{ documents.degree ? 'Uploaded' : 'Not provided' }}</span></div>
                <button type="button" class="upload-small-btn" @click="triggerFileInput('degree')">{{ documents.degree ? 'Change' : 'Upload' }}</button>
                <input type="file" ref="degreeFileInput" @change="handleFileUpload('degree', $event)" accept=".pdf,.jpg,.jpeg,.png" style="display: none">
              </div>
              <div class="document-row guarantee-row">
                <div class="document-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg></div>
                <div class="document-info"><span class="document-name">Guarantee Letters</span><span class="document-status" :class="documents.guarantee_letters?.length ? 'uploaded' : 'missing'">{{ documents.guarantee_letters?.length ? `${documents.guarantee_letters.length} file(s)` : 'Not provided' }}</span></div>
                <button type="button" class="upload-small-btn" @click="openGuaranteeModal">Manage</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Guarantee Letters Modal -->
    <div v-if="showGuaranteeModal" class="modal-overlay" @click="closeGuaranteeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Guarantee Letters</h3>
          <button class="modal-close" @click="closeGuaranteeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="guarantee-list">
            <div v-for="(file, index) in pendingGuarantees" :key="file.id" class="guarantee-file">
              <div class="file-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <span>{{ file.fileName || file.name }}</span>
                <span v-if="file.isNew" class="new-badge">New</span>
              </div>
              <button class="remove-file" @click="deletePendingGuarantee(index)">×</button>
            </div>
            <div v-if="pendingGuarantees.length === 0" class="empty-guarantee">
              <p>No guarantee letters uploaded</p>
            </div>
          </div>
          <div class="upload-guarantee-btn" @click="triggerGuaranteeInput">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add Guarantee Letter</span>
          </div>
          <input type="file" ref="guaranteeFileInput" @change="handleGuaranteeUpload" style="display: none" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeGuaranteeModal">Cancel</button>
          <button class="btn-primary" @click="saveGuarantees">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="`toast toast-${toast.type}`">
        <span>{{ toast.message }}</span>
        <button @click="removeToast(toast.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmployeesService from '@/stores/employee'

const route = useRoute()
const router = useRouter()
const employeeId = route.params.id

// State
const employeeData = ref(null)
const loading = ref(true)
const saving = ref(false)
const toasts = ref([])
const showGuaranteeModal = ref(false)
const profilePreview = ref(null)
const pendingGuarantees = ref([])

// Dropdown data
const departments = ref([])
const positions = ref([])
const managers = ref([])

// Refs for file inputs
const profileInput = ref(null)
const idFileInput = ref(null)
const cvFileInput = ref(null)
const degreeFileInput = ref(null)
const guaranteeFileInput = ref(null)

// Documents
const documents = ref({
  id_card: null,
  cv: null,
  degree: null,
  guarantee_letters: []
})

// Computed properties for display
const getDepartmentName = computed(() => {
  const dept = departments.value.find(d => d.departmentId === form.value.departmentId)
  return dept?.name || form.value.departmentName || '—'
})

const getPositionName = computed(() => {
  const pos = positions.value.find(p => p.positionId === form.value.positionId)
  return pos?.title || form.value.position || '—'
})

// Form data
const form = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  personalEmail: '',
  phone: '',
  dob: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  departmentId: null,
  departmentName: '',
  positionId: null,
  position: '',
  managerId: null,
  managerName: '',
  employmentType: '',
  status: 'active',
  hireDate: '',
  confirmationDate: '',
  terminationDate: '',
  salary: '',
  workLocation: '',
  address: '',
  permanentAddress: '',
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
  branch: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactAltPhone: '',
  emergencyContactRelation: ''
})

// Load employee data
const loadEmployeeData = async () => {
  try {
    loading.value = true
    const response = await EmployeesService.getEmployeeById(employeeId)
    
    if (response.success && response.data) {
      const emp = response.data
      employeeData.value = emp
      
      // Parse address correctly - FIXED
      let addressStr = ''
      let permanentAddressStr = ''
      
      if (emp.address) {
        if (typeof emp.address === 'string') {
          addressStr = emp.address
        } else if (emp.address.street) {
          addressStr = emp.address.street
        }
      }
      
      if (emp.permanentAddress) {
        if (typeof emp.permanentAddress === 'string') {
          permanentAddressStr = emp.permanentAddress
        } else if (emp.permanentAddress.street) {
          permanentAddressStr = emp.permanentAddress.street
        }
      }
      
      form.value = {
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        middleName: emp.middleName || '',
        email: emp.email || '',
        personalEmail: emp.personalEmail || '',
        phone: emp.phone || '',
        dob: emp.dob ? emp.dob.split('T')[0] : '',
        gender: emp.gender || '',
        maritalStatus: emp.maritalStatus || '',
        nationality: emp.nationality || '',
        departmentId: emp.departmentId || null,
        departmentName: emp.departmentName || '',
        positionId: emp.positionId || null,
        position: emp.position || '',
        managerId: emp.managerId || null,
        managerName: emp.managerName || '',
        employmentType: emp.employmentType || '',
        status: emp.status || 'active',
        hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '',
        confirmationDate: emp.confirmationDate ? emp.confirmationDate.split('T')[0] : '',
        terminationDate: emp.terminationDate ? emp.terminationDate.split('T')[0] : '',
        salary: emp.salary || '',
        workLocation: emp.workLocation || '',
        address: addressStr,
        permanentAddress: permanentAddressStr,
        bankName: emp.bankAccount?.bankName || '',
        accountNumber: emp.bankAccount?.accountNumber || '',
        accountHolderName: emp.bankAccount?.accountHolderName || '',
        branch: emp.bankAccount?.branch || '',
        emergencyContactName: emp.emergencyContact?.name || '',
        emergencyContactPhone: emp.emergencyContact?.phone || '',
        emergencyContactAltPhone: emp.emergencyContact?.alternatePhone || '',
        emergencyContactRelation: emp.emergencyContact?.relationship || ''
      }
      
      if (emp.documents) {
        documents.value = emp.documents
      }
    } else {
      addToast(response.error || 'Failed to load employee', 'error')
    }
  } catch (error) {
    console.error('Load employee error:', error)
    addToast('Failed to load employee data', 'error')
  } finally {
    loading.value = false
  }
}

// Load dropdown data
const loadDropdownData = async () => {
  try {
    const deptResponse = await EmployeesService.getDepartments()
    if (deptResponse.success) {
      departments.value = deptResponse.data
    }
    
    const posResponse = await EmployeesService.getPositions()
    if (posResponse.success) {
      positions.value = posResponse.data
    }
    
    const empResponse = await EmployeesService.getEmployees({ limit: 100 })
    if (empResponse.success) {
      managers.value = empResponse.data.filter(e => e.id != employeeId)
    }
  } catch (error) {
    console.error('Load dropdown error:', error)
  }
}

// Handle department change
const onDepartmentChange = async () => {
  if (form.value.departmentId) {
    try {
      const response = await EmployeesService.getPositionsByDepartment?.(form.value.departmentId)
      if (response?.success) {
        positions.value = response.data
      }
    } catch (error) {
      console.error('Load positions error:', error)
    }
  }
}

// Toast functions
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 3000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Profile picture handlers
const triggerProfileInput = () => profileInput.value.click()

const handleProfileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    addToast('Image size must be less than 2MB', 'error')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => profilePreview.value = e.target.result
  reader.readAsDataURL(file)
  
  const response = await EmployeesService.uploadProfilePicture(employeeId, file)
  if (response.success) {
    addToast('Profile picture updated', 'success')
    await loadEmployeeData()
  } else {
    addToast(response.error || 'Upload failed', 'error')
  }
}

// Document handlers
const triggerFileInput = (type) => {
  if (type === 'id_card') idFileInput.value.click()
  else if (type === 'cv') cvFileInput.value.click()
  else if (type === 'degree') degreeFileInput.value.click()
}

const handleFileUpload = async (type, event) => {
  const file = event.target.files[0]
  if (!file) return
  
  let response
  switch (type) {
    case 'id_card': response = await EmployeesService.uploadIdCard(employeeId, file); break
    case 'cv': response = await EmployeesService.uploadCv(employeeId, file); break
    case 'degree': response = await EmployeesService.uploadDegree(employeeId, file); break
  }
  
  if (response?.success) {
    addToast(`${file.name} uploaded`, 'success')
    await loadEmployeeData()
  } else {
    addToast(response?.error || 'Upload failed', 'error')
  }
  event.target.value = ''
}

// Guarantee letter handlers - FIXED (staged upload)
const openGuaranteeModal = () => {
  pendingGuarantees.value = documents.value.guarantee_letters.map(doc => ({
    ...doc,
    isNew: false
  }))
  showGuaranteeModal.value = true
}

const closeGuaranteeModal = () => {
  showGuaranteeModal.value = false
  pendingGuarantees.value = []
}

const triggerGuaranteeInput = () => guaranteeFileInput.value.click()

const handleGuaranteeUpload = (event) => {
  const files = Array.from(event.target.files)
  for (const file of files) {
    pendingGuarantees.value.push({
      id: Date.now() + Math.random(),
      file: file,
      fileName: file.name,
      isNew: true
    })
  }
  guaranteeFileInput.value.value = ''
}

const deletePendingGuarantee = (index) => {
  pendingGuarantees.value.splice(index, 1)
}

const saveGuarantees = async () => {
  try {
    const keptIds = pendingGuarantees.value.filter(g => !g.isNew).map(g => g.id)
    
    // Delete removed files
    for (const existing of documents.value.guarantee_letters) {
      if (!keptIds.includes(existing.id)) {
        await EmployeesService.deleteDocument(employeeId, existing.id)
      }
    }
    
    // Upload new files
    for (const pending of pendingGuarantees.value) {
      if (pending.isNew && pending.file) {
        await EmployeesService.uploadGuaranteeLetter(employeeId, pending.file)
      }
    }
    
    await loadEmployeeData()
    addToast('Guarantee letters updated successfully', 'success')
    closeGuaranteeModal()
  } catch (error) {
    addToast('Failed to update guarantee letters', 'error')
  }
}

// Save employee - FIXED with null values for empty dates
const saveEmployee = async () => {
  saving.value = true
  try {
    const updateData = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      middleName: form.value.middleName,
      email: form.value.email,
      personalEmail: form.value.personalEmail,
      phone: form.value.phone,
      dob: form.value.dob || null,
      gender: form.value.gender,
      maritalStatus: form.value.maritalStatus,
      nationality: form.value.nationality,
      departmentId: form.value.departmentId,
      positionId: form.value.positionId,
      managerId: form.value.managerId,
      employmentType: form.value.employmentType,
      status: form.value.status,
      hireDate: form.value.hireDate || null,
      confirmationDate: form.value.confirmationDate || null,
      terminationDate: form.value.terminationDate || null,
      salary: form.value.salary,
      workLocation: form.value.workLocation,
      address: form.value.address,
      permanentAddress: form.value.permanentAddress,
      bankAccount: {
        bankName: form.value.bankName,
        accountNumber: form.value.accountNumber,
        accountHolderName: form.value.accountHolderName,
        branch: form.value.branch
      },
      emergencyContact: {
        name: form.value.emergencyContactName,
        phone: form.value.emergencyContactPhone,
        alternatePhone: form.value.emergencyContactAltPhone,
        relationship: form.value.emergencyContactRelation
      }
    }
    
    const response = await EmployeesService.updateEmployee(employeeId, updateData)
    if (response.success) {
      addToast('Employee updated successfully!', 'success')
      setTimeout(() => router.push(`/employees/${employeeId}`), 1500)
    } else {
      addToast(response.error || 'Update failed', 'error')
    }
  } catch (error) {
    addToast('Update failed', 'error')
  } finally {
    saving.value = false
  }
}

// Utility functions
const getEmploymentTypeLabel = (type) => {
  const labels = { 'full-time': 'Full Time', 'part-time': 'Part Time', contract: 'Contract', intern: 'Intern' }
  return labels[type] || type || '—'
}

const getAvatarUrl = (name) => `https://ui-avatars.com/api/?background=6366f1&color=fff&bold=true&size=120&name=${encodeURIComponent(name || 'User')}`

const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadEmployeeData(),
    loadDropdownData()
  ])
})
</script>

<style scoped>
/* ============================================
   MAIN CONTAINER
   ============================================ */
.employee-edit {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f4f8 100%);
}

/* ============================================
   LOADING STATE
   ============================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 16px;
}

.loading-state p {
  color: #64748b;
  font-size: 14px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   ACTION BAR
   ============================================ */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  transition: all 0.2s;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.action-btn.primary {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.action-btn.primary:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* ============================================
   HERO SECTION
   ============================================ */
.hero-section {
  background: white;
  border-radius: 24px;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.employee-avatar-large {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  cursor: pointer;
}

.employee-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.employee-avatar-large:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay svg {
  width: 32px;
  height: 32px;
  color: white;
}

.employee-basic h1 {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.edit-name-container {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.name-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 600;
  width: 200px;
}

.name-input:focus {
  outline: none;
  border-color: #6366f1;
}

.employee-tags {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tag {
  padding: 5px 14px;
  background: #f1f5f9;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.hero-right {
  text-align: right;
}

.employee-code {
  margin-bottom: 12px;
}

.code-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
}

.code-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.status-select {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.status-select.active { background: #10b98115; color: #10b981; }
.status-select.on-leave { background: #f59e0b15; color: #f59e0b; }
.status-select.terminated { background: #ef444415; color: #ef4444; }

/* ============================================
   STATS CARDS
   ============================================ */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-card-icon {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card-icon svg {
  width: 24px;
  height: 24px;
  color: #6366f1;
}

.stat-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* ============================================
   CONTENT GRID
   ============================================ */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ============================================
   INFO CARDS
   ============================================ */
.info-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
}

.card-header-icon {
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-header-icon svg {
  width: 16px;
  height: 16px;
  color: #6366f1;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.info-list {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.info-label {
  width: 130px;
  font-size: 13px;
  color: #64748b;
}

.info-value {
  flex: 1;
}

.info-value input, .info-value select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}

.info-value input:focus, .info-value select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

/* ============================================
   ADDRESS CARD
   ============================================ */
.address-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.address-card .card-header {
  background: rgba(255, 255, 255, 0.1);
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.address-card .card-header-icon {
  background: rgba(255, 255, 255, 0.2);
}

.address-card .card-header-icon svg {
  color: white;
}

.address-card .card-header h3 {
  color: white;
}

.address-content {
  padding: 24px;
}

.address-input {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

.address-input:focus {
  outline: none;
  border-color: white;
  background: rgba(255, 255, 255, 0.15);
}

.address-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* ============================================
   DOCUMENTS
   ============================================ */
.documents-list {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.document-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.document-row:last-child {
  border-bottom: none;
}

.document-icon {
  width: 36px;
  height: 36px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-icon svg {
  width: 18px;
  height: 18px;
  color: #6366f1;
}

.document-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.document-status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
}

.document-status.uploaded {
  background: #10b98115;
  color: #10b981;
}

.document-status.missing {
  background: #f1f5f9;
  color: #94a3b8;
}

.upload-small-btn {
  padding: 5px 12px;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-small-btn:hover {
  background: #e2e8f0;
}

/* ============================================
   MODAL
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 460px;
  max-width: calc(100vw - 40px);
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #e9edf2;
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e9edf2;
}

.guarantee-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e9edf2;
  border-radius: 12px;
}

.guarantee-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e9edf2;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-info svg {
  width: 18px;
  height: 18px;
  color: #6366f1;
}

.new-badge {
  background: #10b981;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.remove-file {
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
}

.remove-file:hover {
  background: #fee2e2;
  color: #ef4444;
}

.empty-guarantee {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  font-size: 13px;
}

.upload-guarantee-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafcff;
}

.upload-guarantee-btn:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.upload-guarantee-btn svg {
  width: 18px;
  height: 18px;
  color: #6366f1;
}

.btn-primary {
  background: #6366f1;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f8fafc;
}

/* ============================================
   TOAST
   ============================================ */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 260px;
  animation: slideIn 0.2s ease;
}

.toast-success {
  border-left: 3px solid #10b981;
  background: #f0fdf4;
}

.toast-error {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}

.toast button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  margin-left: auto;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 900px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .employee-edit {
    padding: 20px 16px;
  }
  
  .hero-section {
    flex-direction: column;
    text-align: center;
    gap: 24px;
  }
  
  .hero-left {
    flex-direction: column;
  }
  
  .hero-right {
    text-align: center;
  }
  
  .employee-tags {
    justify-content: center;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-label {
    width: 100%;
  }
  
  .document-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .edit-name-container {
    flex-direction: column;
  }
  
  .name-input {
    width: 100%;
  }
}
</style>