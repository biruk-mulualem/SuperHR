<template>
  <div class="employee-create">
    <CreateHeader @import-click="openImportModal" />
    
    <form @submit.prevent="createEmployee" class="employee-form">
      <ProfileUpload 
        v-model:profile-file="profileFile"
        v-model:profile-preview="profilePreview"
      />
      
      <BasicInfoForm 
        v-model:form="form"
        :errors="errors"
        :countries="countries"
      />
      
      <EmploymentForm 
        v-model:form="form"
        :errors="errors"
        :departments="departments"
        :positions="positions"
        :employees="employeeList"
      />
      
      
      
      <AdditionalInfoForm 
        v-model:emergency="emergencyContact"
        v-model:bank="bankAccount"
        v-model:form="form"
        :ethiopian-banks="ethiopianBanks"
      />
      
      <DocumentsUpload 
        v-model:documents="documents"
        @file-selected="addToast"
      />
      
      <div class="form-actions">
        <router-link to="/employees" class="btn-outline">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="isSubmitting || !isFormValid">
          {{ isSubmitting ? 'Creating...' : 'Create Employee' }}
        </button>
      </div>
    </form>

    <div v-if="isSubmitting" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Creating employee and uploading documents...</p>
    </div>

    <ImportModal 
      v-model:show="showImportModal"
      @import="handleImport"
      @toast="addToast"
    />

    <ToastContainer 
      :toasts="toasts"
      @remove-toast="removeToast"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import EmployeesService from '@/stores/employee'
import UsersService from '@/stores/users'
import CreateHeader from './components/employeeCreate/CreateHeader.vue'
import ProfileUpload from './components/employeeCreate/ProfileUpload.vue'
import BasicInfoForm from './components/employeeCreate/BasicInfoForm.vue'
import EmploymentForm from './components/employeeCreate/EmploymentForm.vue'
import AdditionalInfoForm from './components/employeeCreate/AdditionalInfoForm.vue'
import DocumentsUpload from './components/employeeCreate/DocumentsUpload.vue'
import ImportModal from './components/employeeCreate/ImportModal.vue'
import ToastContainer from './components/employeeCreate/ToastContainer.vue'

const router = useRouter()
const toasts = ref([])
const showImportModal = ref(false)
const isSubmitting = ref(false)
const profileFile = ref(null)
const profilePreview = ref(null)

const departments = ref([])
const positions = ref([])
const employeeList = ref([])

const documents = ref({
  profile: { file: null },
  id: { file: null },
  cv: { file: null },
  degree: { file: null },
  guarantees: []
})

const emergencyContact = reactive({
  name: '',
  relationship: '',
  phone: '',
  alternatePhone: ''
})

const bankAccount = reactive({
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
  branch: ''
})

// Form with allowance fields
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
  positionId: null,
  managerId: null,
  employmentType: '',
  hireDate: '',
  salary: '',
  basicSalary: '',
  housingAllowance: '',
  positionAllowance: '',
  transportAllowance: '',
  mobileAllowance: '',
  address: '',
  workLocation: ''
})

// Validation errors
const allowanceErrors = ref({
  basicSalary: '',
  housingAllowance: '',
  positionAllowance: '',
  transportAllowance: '',
   mobileAllowance: '',
})

const errors = ref({})

// Computed properties for allowances
const basicSalaryAmount = computed(() => parseFloat(form.value.basicSalary) || 0)
const housingAllowanceAmount = computed(() => parseFloat(form.value.housingAllowance) || 0)
const positionAllowanceAmount = computed(() => parseFloat(form.value.positionAllowance) || 0)
const transportAllowanceAmount = computed(() => parseFloat(form.value.transportAllowance) || 0)
const mobileAllowanceAmount = computed(() => parseFloat(form.value.mobileAllowance) || 0)
const totalAllowances = computed(() => housingAllowanceAmount.value + positionAllowanceAmount.value + transportAllowanceAmount.value + mobileAllowanceAmount.value)
const grossPay = computed(() => basicSalaryAmount.value + totalAllowances.value)

// Form validation - check if all fields are valid
const isFormValid = computed(() => {
  return basicSalaryAmount.value > 0 &&
         housingAllowanceAmount.value >= 0 &&
         positionAllowanceAmount.value >= 0 &&
         transportAllowanceAmount.value >= 0 &&
         mobileAllowanceAmount.value >= 0 &&
         !allowanceErrors.value.basicSalary &&
         !allowanceErrors.value.housingAllowance &&
         !allowanceErrors.value.positionAllowance &&
         !allowanceErrors.value.transportAllowance &&
         !allowanceErrors.value.mobileAllowance
})

// Validation functions
const validateBasicSalary = () => {
  const value = parseFloat(form.value.basicSalary)
  if (isNaN(value) || value <= 0) {
    allowanceErrors.value.basicSalary = 'Basic salary must be greater than 0'
    return false
  }
  allowanceErrors.value.basicSalary = ''
  return true
}

const validateHousingAllowance = () => {
  const value = parseFloat(form.value.housingAllowance)
  if (isNaN(value)) {
    form.value.housingAllowance = 0
    allowanceErrors.value.housingAllowance = ''
    return true
  }
  if (value < 0) {
    allowanceErrors.value.housingAllowance = 'Housing allowance cannot be negative'
    return false
  }
  allowanceErrors.value.housingAllowance = ''
  return true
}

const validatePositionAllowance = () => {
  const value = parseFloat(form.value.positionAllowance)
  if (isNaN(value)) {
    form.value.positionAllowance = 0
    allowanceErrors.value.positionAllowance = ''
    return true
  }
  if (value < 0) {
    allowanceErrors.value.positionAllowance = 'Position allowance cannot be negative'
    return false
  }
  allowanceErrors.value.positionAllowance = ''
  return true
}

const validateTransportAllowance = () => {
  const value = parseFloat(form.value.transportAllowance)
  if (isNaN(value)) {
    form.value.transportAllowance = 0
    allowanceErrors.value.transportAllowance = ''
    return true
  }
  if (value < 0) {
    allowanceErrors.value.transportAllowance = 'Transport allowance cannot be negative'
    return false
  }
  allowanceErrors.value.transportAllowance = ''
  return true
}

const validateMobileAllowance = () => {
  const value = parseFloat(form.value.mobileAllowance)
  if (isNaN(value)) {
    form.value.mobileAllowance = 0
    allowanceErrors.value.mobileAllowance = ''
    return true
  }
  if (value < 0) {
    allowanceErrors.value.mobileAllowance = 'Mobile allowance cannot be negative'
    return false
  }
  allowanceErrors.value.mobileAllowance = ''
  return true
}


const formatCurrency = (value) => {
  if (!value && value !== 0) return '—'
  return `ETB ${Number(value).toLocaleString()}`
}

const countries = [
  { code: 'ET', name: 'Ethiopian' },
  { code: 'US', name: 'American' },
  { code: 'GB', name: 'British' },
  { code: 'CA', name: 'Canadian' },
  { code: 'AU', name: 'Australian' },
  { code: 'DE', name: 'German' },
  { code: 'FR', name: 'French' },
  { code: 'IT', name: 'Italian' },
  { code: 'ES', name: 'Spanish' }
]

const ethiopianBanks = [
  { code: 'CBE', name: 'Commercial Bank of Ethiopia' },
  { code: 'AWB', name: 'Awash Bank' },
  { code: 'DB', name: 'Dashen Bank' },
  { code: 'UB', name: 'United Bank' },
  { code: 'NIB', name: 'Nib International Bank' },
  { code: 'HB', name: 'Hibret Bank' },
  { code: 'WB', name: 'Wegagen Bank' }
]

const getErrorMessage = (error) => {
  return error.response?.data?.error || error.message || 'An error occurred'
}

const validateForm = () => {
  const newErrors = {}
  
  // Basic Info validation
  if (!form.value.firstName?.trim()) newErrors.firstName = 'First name is required'
  if (!form.value.lastName?.trim()) newErrors.lastName = 'Last name is required'
  if (!form.value.email?.trim()) newErrors.email = 'Email is required'
  if (!form.value.phone?.trim()) newErrors.phone = 'Phone number is required'
  if (!form.value.departmentId) newErrors.departmentId = 'Department is required'
  if (!form.value.positionId) newErrors.positionId = 'Position is required'
  if (!form.value.employmentType) newErrors.employmentType = 'Employment type is required'
  if (!form.value.hireDate) newErrors.hireDate = 'Hire date is required'
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (form.value.email && !emailRegex.test(form.value.email)) {
    newErrors.email = 'Valid email is required'
  }
  
  // Allowance validations
  const basicSalaryValid = validateBasicSalary()
  const housingValid = validateHousingAllowance()
  const positionValid = validatePositionAllowance()
  const transportValid = validateTransportAllowance()
  const mobileValid = validateMobileAllowance()

  if (!basicSalaryValid) {
    newErrors.basicSalary = allowanceErrors.value.basicSalary
  }
  if (!housingValid) {
    newErrors.housingAllowance = allowanceErrors.value.housingAllowance
  }
  if (!positionValid) {
    newErrors.positionAllowance = allowanceErrors.value.positionAllowance
  }
  if (!transportValid) {
    newErrors.transportAllowance = allowanceErrors.value.transportAllowance
  }
  if (!mobileValid) {
    newErrors.mobileAllowance = allowanceErrors.value.mobileAllowance
  }

  // Fix for enum error: Convert empty strings to null for enum fields
  if (form.value.gender === '') form.value.gender = null
  if (form.value.maritalStatus === '') form.value.maritalStatus = null
  if (form.value.nationality === '') form.value.nationality = null
  if (form.value.employmentType === '') form.value.employmentType = null
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0 && basicSalaryValid && housingValid && positionValid && transportValid && mobileValid
}

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

const createEmployee = async () => {
  if (!validateForm()) {
    addToast('Please fix validation errors before submitting', 'error')
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Use basicSalary as the primary salary field
    const finalSalary = form.value.basicSalary || form.value.salary
    
    // Prepare data - convert empty strings to null for enum fields
    const employeeData = {
      firstName: form.value.firstName?.trim(),
      lastName: form.value.lastName?.trim(),
      email: form.value.email?.trim(),
      phone: form.value.phone?.trim(),
      departmentId: form.value.departmentId,
      positionId: form.value.positionId,
      employmentType: form.value.employmentType,
      hireDate: form.value.hireDate,
      middleName: form.value.middleName?.trim() || null,
      personalEmail: form.value.personalEmail?.trim() || null,
      dob: form.value.dob || null,
      gender: form.value.gender || null,
      maritalStatus: form.value.maritalStatus || null,
      nationality: form.value.nationality || null,
      managerId: form.value.managerId || null,
      salary: finalSalary,
      basicSalary: finalSalary,
      housingAllowance: form.value.housingAllowance || 0,
      positionAllowance: form.value.positionAllowance || 0,
      transportAllowance: form.value.transportAllowance || 0,
      mobileAllowance: form.value.mobileAllowance || 0,
      address: form.value.address?.trim() || null,
      workLocation: form.value.workLocation?.trim() || null,
      emergencyContact: JSON.stringify(emergencyContact),
      bankAccount: JSON.stringify(bankAccount)
    }
    
    addToast('Creating employee...', 'info')
    const result = await EmployeesService.createEmployee(employeeData)
    
    if (!result.success) {
      addToast(result.error || 'Failed to create employee', 'error')
      isSubmitting.value = false
      return
    }
    
    const employeeId = result.data.id
    addToast(`✅ Employee created! Now uploading files...`, 'success')
    
    let successCount = 0
    let totalFiles = 0
    
    // Upload profile picture
    if (profileFile.value) {
      totalFiles++
      addToast('Uploading profile picture...', 'info')
      const profileResult = await EmployeesService.uploadProfilePicture(employeeId, profileFile.value)
      if (profileResult.success) successCount++
      else addToast('❌ Failed to upload profile picture', 'error')
    }
    
    // Upload ID Card
    if (documents.value.id && documents.value.id.file) {
      totalFiles++
      addToast('Uploading ID card...', 'info')
      const idResult = await EmployeesService.uploadIdCard(employeeId, documents.value.id.file)
      if (idResult.success) successCount++
      else addToast('❌ Failed to upload ID Card', 'error')
    }
    
    // Upload CV
    if (documents.value.cv && documents.value.cv.file) {
      totalFiles++
      addToast('Uploading CV...', 'info')
      const cvResult = await EmployeesService.uploadCv(employeeId, documents.value.cv.file)
      if (cvResult.success) successCount++
      else addToast('❌ Failed to upload CV', 'error')
    }
    
    // Upload Degree
    if (documents.value.degree && documents.value.degree.file) {
      totalFiles++
      addToast('Uploading degree...', 'info')
      const degreeResult = await EmployeesService.uploadDegree(employeeId, documents.value.degree.file)
      if (degreeResult.success) successCount++
      else addToast('❌ Failed to upload Degree', 'error')
    }
    
    // Upload Guarantee Letters
    if (documents.value.guarantees && documents.value.guarantees.length > 0) {
      for (const guarantee of documents.value.guarantees) {
        totalFiles++
        addToast(`Uploading guarantee letter: ${guarantee.name}...`, 'info')
        const guaranteeResult = await EmployeesService.uploadGuaranteeLetter(employeeId, guarantee.file)
        if (guaranteeResult.success) successCount++
        else addToast(`❌ Failed to upload "${guarantee.name}"`, 'error')
      }
    }
    
    if (totalFiles > 0 && successCount === totalFiles) {
      addToast(`🎉 Employee "${result.data.fullName}" created with all ${totalFiles} file(s) uploaded successfully!`, 'success')
    } else if (totalFiles > 0) {
      addToast(`⚠️ Employee created but ${totalFiles - successCount} file(s) failed to upload.`, 'warning')
    } else {
      addToast(`🎉 Employee "${result.data.fullName}" created successfully!`, 'success')
    }
    
    setTimeout(() => {
      router.push('/employees')
    }, 3000)
    
  } catch (error) {
    console.error('Error creating employee:', error)
    addToast(getErrorMessage(error), 'error')
  } finally {
    isSubmitting.value = false
  }
}

const openImportModal = () => {
  showImportModal.value = true
}

const handleImport = async (csvData) => {
  addToast('Import completed!', 'success')
}

const loadDepartments = async () => {
  try {
    const result = await UsersService.getDepartments()
    if (result.success) departments.value = result.departments
  } catch (error) {
    console.error('Error loading departments:', error)
  }
}

const loadPositions = async () => {
  try {
    const result = await UsersService.getPositions()
    if (result.success) positions.value = result.positions
  } catch (error) {
    console.error('Error loading positions:', error)
  }
}

const loadManagers = async () => {
  try {
    const result = await EmployeesService.getEmployees({ employmentStatus: 'active', limit: 100 })
    if (result.success) {
      employeeList.value = result.data.map(emp => ({ id: emp.id, fullName: emp.fullName }))
    }
  } catch (error) {
    console.error('Error loading managers:', error)
  }
}

onMounted(() => {
  loadDepartments()
  loadPositions()
  loadManagers()
})
</script>

<style scoped>
.employee-create {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.employee-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Allowances Card */
.allowances-card {
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

.allowances-content {
  padding: 20px 24px;
}

.allowance-field {
  margin-bottom: 16px;
}

.allowance-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
}

.allowance-field input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}

.allowance-field input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.allowance-field small {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

.allowance-field.has-error label {
  color: #ef4444;
}

.error-input {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

.error-text {
  color: #ef4444;
  font-size: 11px;
  margin-top: 4px;
  display: block;
}

.required {
  color: #ef4444;
}

.field-hint {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

.allowance-summary {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid #eef2ff;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: #475569;
}

.summary-row strong {
  font-weight: 600;
  color: #1e293b;
}

.summary-row.total {
  font-weight: 600;
  color: #1e293b;
}

.summary-row.total strong {
  color: #f59e0b;
}

.summary-row.gross {
  font-weight: 700;
  font-size: 14px;
}

.summary-row.gross strong {
  color: #10b981;
  font-size: 16px;
}

.summary-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 8px 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary,
.btn-outline {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #6366f1;
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.loading-section {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 16px;
  margin-top: 32px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .employee-create {
    padding: 16px;
  }
}
</style>