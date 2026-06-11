<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
      <h3>{{ props.t('employee.employmentInfo') || 'Employment Details' }}</h3>
    </div>
    <div class="card-body">
      <!-- Current Employment -->
      <div class="section-title">{{ props.t('employee.currentEmployment') || 'Current Employment' }}</div>
      
      <!-- Row 1: Department, Position, Manager -->
      <div class="form-row-three">
        <div class="form-field">
          <label>{{ props.t('employee.department') || 'Department' }} <span class="required">*</span></label>
          <select 
            :value="form.departmentId" 
            @change="$emit('update:form', { ...form, departmentId: $event.target.value ? parseInt($event.target.value) : null })"
          >
            <option :value="null">{{ props.t('common.select') || 'Select department' }}</option>
            <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">
              {{ dept.name }}
            </option>
          </select>
          <span class="error" v-if="errors.departmentId">{{ errors.departmentId }}</span>
        </div>
        <div class="form-field">
          <label>{{ props.t('employee.position') || 'Position' }} <span class="required">*</span></label>
          <select 
            :value="form.positionId" 
            @change="$emit('update:form', { ...form, positionId: $event.target.value ? parseInt($event.target.value) : null })"
          >
            <option :value="null">{{ props.t('common.select') || 'Select position' }}</option>
            <option v-for="pos in positions" :key="pos.positionId" :value="pos.positionId">
              {{ pos.title }}
            </option>
          </select>
          <span class="error" v-if="errors.positionId">{{ errors.positionId }}</span>
        </div>
        <div class="form-field">
          <label>{{ props.t('employee.manager') || 'Manager' }}</label>
          <select 
            :value="form.managerId" 
            @change="$emit('update:form', { ...form, managerId: $event.target.value ? parseInt($event.target.value) : null })"
          >
            <option :value="null">{{ props.t('common.select') || 'Select manager' }}</option>
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ emp.fullName }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Row 2: Work Location, Employment Type, Hire Date -->
      <div class="form-row-three">
        <div class="form-field">
          <label>{{ props.t('employee.workLocation') || 'Work Location' }}</label>
          <input 
            type="text" 
            :value="form.workLocation" 
            @input="$emit('update:form', { ...form, workLocation: $event.target.value })" 
            :placeholder="props.t('employee.workLocationPlaceholder') || 'Head Office, Addis Ababa'"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('employee.employmentType') || 'Employment Type' }} <span class="required">*</span></label>
          <select 
            :value="form.employmentType" 
            @change="$emit('update:form', { ...form, employmentType: $event.target.value })"
          >
            <option value="">{{ props.t('common.select') || 'Select type' }}</option>
            <option value="employee.fullTime">{{ props.t('employee.fullTime') || 'Full Time' }}</option>
            <option value="employee.partTime">{{ props.t('employee.partTime') || 'Part Time' }}</option>
            <option value="employee.contract">{{ props.t('employee.contract') || 'Contract' }}</option>
            <option value="employee.intern">{{ props.t('employee.intern') || 'Intern' }}</option>
          </select>
          <span class="error" v-if="errors.employmentType">{{ errors.employmentType }}</span>
        </div>
        <div class="form-field">
          <label>{{ props.t('employee.hireDate') || 'Hire Date' }} <span class="required">*</span></label>
          <input 
            type="date" 
            :value="form.hireDate" 
            @input="$emit('update:form', { ...form, hireDate: $event.target.value })"
          >
          <span class="error" v-if="errors.hireDate">{{ errors.hireDate }}</span>
        </div>
      </div>

      <!-- ========== ALLOWANCES SECTION ========== -->
      <div class="allowances-card">
        <div class="allowances-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <div>
            <h4>{{ props.t('employee.compensationAllowances') || '💰 Compensation & Allowances' }}</h4>
            <p>{{ props.t('employee.basicSalaryAllowanceDesc') || 'Basic salary and allowance details' }}</p>
          </div>
        </div>
        
        <div class="allowances-body">
          <!-- Basic Salary - Full Width -->
          <div class="salary-field">
            <div class="form-field">
              <label>{{ props.t('employee.basicSalary') || 'Basic Salary (ETB)' }} <span class="required">*</span></label>
              <input 
                type="number" 
                :value="form.basicSalary"
                @input="updateBasicSalary"
                placeholder="0.00"
                step="100"
              />
              <small class="field-hint">{{ props.t('employee.basicSalaryHint') || 'Monthly basic salary before allowances' }}</small>
            </div>
          </div>
          
          <!-- Allowances: Housing, Position, Transport, Mobile (4 in a row) -->
          <div class="allowances-grid">
            <div class="form-field">
              <label>{{ props.t('employee.housingAllowance') || 'Housing Allowance (ETB)' }}</label>
              <input 
                type="number" 
                :value="form.housingAllowance"
                @input="updateAllowance('housingAllowance', $event.target.value)"
                placeholder="0.00"
                step="100"
              />
            </div>
            
            <div class="form-field">
              <label>{{ props.t('employee.positionAllowance') || 'Position Allowance (ETB)' }}</label>
              <input 
                type="number" 
                :value="form.positionAllowance"
                @input="updateAllowance('positionAllowance', $event.target.value)"
                placeholder="0.00"
                step="100"
              />
            </div>
            
            <div class="form-field">
              <label>{{ props.t('employee.transportAllowance') || 'Transport Allowance (ETB)' }}</label>
              <input 
                type="number" 
                :value="form.transportAllowance"
                @input="updateAllowance('transportAllowance', $event.target.value)"
                placeholder="0.00"
                step="100"
              />
            </div>

            <div class="form-field">
              <label>{{ props.t('employee.mobileAllowance') || 'Mobile Allowance (ETB)' }}</label>
              <input 
                type="number" 
                :value="form.mobileAllowance"
                @input="updateAllowance('mobileAllowance', $event.target.value)"
                placeholder="0.00"
                step="100"
              />
            </div>
          </div>
          
          <!-- Allowance Summary -->
          <div class="allowance-summary" v-if="totalAllowances > 0 || basicSalaryAmount > 0">
            <div class="summary-title">{{ props.t('employee.summary') || 'Summary' }}</div>
            <div class="summary-grid">
              <div class="summary-item">
                <span>{{ props.t('employee.basicSalary') || 'Basic Salary:' }}</span>
                <strong>{{ formatCurrency(basicSalaryAmount) }}</strong>
              </div>
              <div class="summary-item">
                <span>{{ props.t('employee.housingAllowance') || 'Housing:' }}</span>
                <strong>{{ formatCurrency(housingAllowanceAmount) }}</strong>
              </div>
              <div class="summary-item">
                <span>{{ props.t('employee.positionAllowance') || 'Position:' }}</span>
                <strong>{{ formatCurrency(positionAllowanceAmount) }}</strong>
              </div>
              <div class="summary-item">
                <span>{{ props.t('employee.transportAllowance') || 'Transport:' }}</span>
                <strong>{{ formatCurrency(transportAllowanceAmount) }}</strong>
              </div>
              <div class="summary-item">
                <span>{{ props.t('employee.mobileAllowance') || 'Mobile:' }}</span>
                <strong>{{ formatCurrency(mobileAllowanceAmount) }}</strong>
              </div>
              <div class="summary-item total">
                <span>{{ props.t('employee.totalAllowances') || 'Total Allowances:' }}</span>
                <strong>{{ formatCurrency(totalAllowances) }}</strong>
              </div>
              <div class="summary-item gross">
                <span>{{ props.t('employee.grossPay') || 'Gross Monthly Pay:' }}</span>
                <strong>{{ formatCurrency(grossPay) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========== WORK EXPERIENCE SECTION ========== -->
      <div class="work-experience-section">
        <div class="section-title">
          {{ props.t('employee.workExperience') || 'Previous Work Experience' }}
          <button type="button" class="btn-add" @click="addWorkExperience">+ {{ props.t('common.add') || 'Add Experience' }}</button>
        </div>
        
        <div v-for="(item, idx) in localWorkExperience" :key="idx" class="work-card">
          <div class="item-header">
            <span>{{ props.t('employee.experience') || 'Experience' }} {{ idx + 1 }}</span>
            <button type="button" class="btn-remove" @click="removeWorkExperience(idx)">×</button>
          </div>
          
          <!-- Row 1: Position, Company Name, Company TIN -->
          <div class="form-row-three">
            <div class="form-field">
              <label>{{ props.t('employee.positionTitle') || 'Position Title' }}</label>
              <input 
                type="text" 
                :value="item.position" 
                @input="updateWorkExperience(idx, 'position', $event.target.value)"
                :placeholder="props.t('employee.positionPlaceholder') || 'e.g., Software Engineer'"
              >
            </div>
            <div class="form-field">
              <label>{{ props.t('employee.companyName') || 'Company Name' }}</label>
              <input 
                type="text" 
                :value="item.companyName" 
                @input="updateWorkExperience(idx, 'companyName', $event.target.value)"
                :placeholder="props.t('employee.companyNamePlaceholder') || 'Company name'"
              >
            </div>
            <div class="form-field">
              <label>{{ props.t('employee.companyTin') || 'Company TIN Number' }}</label>
              <input 
                type="text" 
                :value="item.companyTin" 
                @input="updateWorkExperience(idx, 'companyTin', $event.target.value)"
                :placeholder="props.t('employee.tinPlaceholder') || 'Tax Identification Number'"
              >
            </div>
          </div>
          
          <!-- Row 2: Company Type, Company Address -->
          <div class="form-row-three">
            <div class="form-field">
              <label>{{ props.t('employee.companyType') || 'Company Type' }}</label>
              <select :value="item.companyType" @change="updateWorkExperience(idx, 'companyType', $event.target.value)">
                <option value="">{{ props.t('common.select') || 'Select company type' }}</option>
                <option value="employee.government">{{ props.t('employee.government') || 'Government' }}</option>
                <option value="employee.private">{{ props.t('employee.private') || 'Private' }}</option>
                <option value="employee.military">{{ props.t('employee.military') || 'Military' }}</option>
                <option value="employee.civil">{{ props.t('employee.civil') || 'Civil' }}</option>
                <option value="employee.provident_fund">{{ props.t('employee.providentFund') || 'Provident Fund' }}</option>
                <option value="employee.ngo">{{ props.t('employee.ngo') || 'NGO' }}</option>
                <option value="employee.international">{{ props.t('employee.international') || 'International Organization' }}</option>
                <option value="employee.other">{{ props.t('employee.other') || 'Other' }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>{{ props.t('employee.companyAddress') || 'Company Address' }}</label>
              <input 
                type="text" 
                :value="item.companyAddress" 
                @input="updateWorkExperience(idx, 'companyAddress', $event.target.value)"
                :placeholder="props.t('employee.companyAddressPlaceholder') || 'Company address'"
              >
            </div>
            <div class="form-field">
              <!-- Empty for alignment -->
            </div>
          </div>
          
          <!-- Row 3: Start Date, End Date, Monthly Salary -->
          <div class="form-row-three">
            <div class="form-field">
              <label>{{ props.t('employee.startDate') || 'Start Date' }}</label>
              <input 
                type="date" 
                :value="item.startDate" 
                @input="updateWorkExperience(idx, 'startDate', $event.target.value)"
              >
            </div>
            <div class="form-field">
              <label>{{ props.t('employee.endDate') || 'End Date' }}</label>
              <input 
                type="date" 
                :value="item.endDate" 
                @input="updateWorkExperience(idx, 'endDate', $event.target.value)"
              >
            </div>
            <div class="form-field">
              <label>{{ props.t('employee.monthlySalary') || 'Monthly Salary (ETB)' }}</label>
              <input 
                type="number" 
                :value="item.monthlySalary" 
                @input="updateWorkExperience(idx, 'monthlySalary', parseFloat($event.target.value) || 0)"
                placeholder="0.00"
                step="100"
              >
            </div>
          </div>
          
          <!-- Row 4: Salary When Left, Provident Fund Submitted, Provident Fund Start Date -->
          <div class="form-row-three">
            <div class="form-field">
              <label>{{ props.t('employee.salaryWhenLeft') || 'Salary When Left (ETB)' }}</label>
              <input 
                type="number" 
                :value="item.salaryWhenLeft" 
                @input="updateWorkExperience(idx, 'salaryWhenLeft', parseFloat($event.target.value) || 0)"
                placeholder="0.00"
                step="100"
              >
            </div>
            <div class="form-field">
              <label>{{ props.t('employee.providentFundSubmitted') || 'Provident Fund Submitted?' }}</label>
              <select :value="item.providentFundSubmitted" @change="updateWorkExperience(idx, 'providentFundSubmitted', $event.target.value)">
                <option value="">{{ props.t('common.select') || 'Select' }}</option>
                <option value="common.yes">{{ props.t('common.yes') || 'Yes' }}</option>
                <option value="common.no">{{ props.t('common.no') || 'No' }}</option>
              </select>
            </div>
            <div class="form-field" v-if="item.providentFundSubmitted === 'common.yes'">
              <label>{{ props.t('employee.providentFundStartDate') || 'Provident Fund Starting From' }}</label>
              <input 
                type="date" 
                :value="item.providentFundStartDate" 
                @input="updateWorkExperience(idx, 'providentFundStartDate', $event.target.value)"
              >
            </div>
            <div class="form-field" v-if="item.providentFundSubmitted !== 'yes'">
              <!-- Empty for alignment -->
            </div>
          </div>
          
          <!-- Row 5: Reason for Termination -->
          <div class="form-row-full">
            <div class="form-field">
              <label>{{ props.t('employee.terminationReason') || 'Reason for Employment Termination' }}</label>
              <textarea 
                :value="item.terminationReason" 
                @input="updateWorkExperience(idx, 'terminationReason', $event.target.value)"
                rows="2" 
                :placeholder="props.t('employee.terminationPlaceholder') || 'e.g., Resignation, Contract ended, Layoff, Retirement, etc.'"
              ></textarea>
            </div>
          </div>
          
          <!-- Row 6: Document Select -->
          <div class="form-row-full">
            <div class="form-field">
              <label>{{ props.t('employee.experienceLetter') || 'Experience Letter/Contract' }}</label>
              <div class="file-upload-row">
                <button type="button" class="btn-small" @click="triggerWorkDocumentInput(idx)">
                  {{ item.experienceLetterFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
                </button>
                <span v-if="item.experienceLetterFile" class="file-name">{{ item.experienceLetterFile.name }}</span>
                <span v-else class="file-name no-file">{{ props.t('employee.noFileSelected') || 'No file selected' }}</span>
              </div>
              <input 
                type="file" 
                :ref="el => setWorkDocumentInputRef(idx, el)"
                @change="handleWorkDocumentSelect(idx, $event)"
                accept=".pdf,.jpg,.jpeg,.png"
                style="display: none"
              />
              <small class="field-hint">{{ props.t('employee.documentHint') || 'Select document (will be uploaded when you save the form)' }}</small>
            </div>
          </div>
        </div>
        
        <div v-if="!localWorkExperience || localWorkExperience.length === 0" class="empty-state">
          {{ props.t('employee.noWorkExperience') || 'No previous work experience added. Click "Add Experience" to add.' }}
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  workExperience: {
    type: Array,
    default: () => []
  },
  errors: {
    type: Object,
    default: () => ({})
  },
  departments: {
    type: Array,
    default: () => []
  },
  positions: {
    type: Array,
    default: () => []
  },
  employees: {
    type: Array,
    default: () => []
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:form', 'update:workExperience', 'update:workDocument', 'file-selected'])

// Initialize localWorkExperience from props
const localWorkExperience = ref([...(props.workExperience || [])])

// Store refs for file inputs
const workDocumentInputs = ref({})

// Flag to prevent recursive updates
let isUpdating = false

// Watch for parent changes
watch(() => props.workExperience, (newVal) => {
  if (!isUpdating) {
    localWorkExperience.value = [...(newVal || [])]
  }
}, { deep: true })

const setWorkDocumentInputRef = (index, el) => {
  if (el) {
    workDocumentInputs.value[index] = el
  }
}

// Computed properties for allowance calculations
const basicSalaryAmount = computed(() => parseFloat(props.form.basicSalary) || 0)
const housingAllowanceAmount = computed(() => parseFloat(props.form.housingAllowance) || 0)
const positionAllowanceAmount = computed(() => parseFloat(props.form.positionAllowance) || 0)
const transportAllowanceAmount = computed(() => parseFloat(props.form.transportAllowance) || 0)
const mobileAllowanceAmount = computed(() => parseFloat(props.form.mobileAllowance) || 0)
const totalAllowances = computed(() => housingAllowanceAmount.value + positionAllowanceAmount.value + transportAllowanceAmount.value + mobileAllowanceAmount.value)
const grossPay = computed(() => basicSalaryAmount.value + totalAllowances.value)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

const updateBasicSalary = (event) => {
  const value = event.target.value
  emit('update:form', { ...props.form, basicSalary: value })
}

const updateAllowance = (field, value) => {
  emit('update:form', { ...props.form, [field]: value })
}

// Work Experience methods - emit directly to parent
const addWorkExperience = () => {
  isUpdating = true
  const newWorkExp = {
    position: '',
    companyName: '',
    companyTin: '',
    companyType: '',
    companyAddress: '',
    startDate: '',
    endDate: '',
    monthlySalary: null,
    salaryWhenLeft: null,
    providentFundSubmitted: '',
    providentFundStartDate: '',
    terminationReason: '',
    experienceLetterFile: null
  }
  const newArray = [...localWorkExperience.value, newWorkExp]
  localWorkExperience.value = newArray
  emit('update:workExperience', newArray)
  isUpdating = false
}

const updateWorkExperience = (index, field, value) => {
  isUpdating = true
  const newArray = [...localWorkExperience.value]
  newArray[index][field] = value
  localWorkExperience.value = newArray
  emit('update:workExperience', newArray)
  isUpdating = false
}

const removeWorkExperience = (index) => {
  isUpdating = true
  const newArray = [...localWorkExperience.value]
  newArray.splice(index, 1)
  localWorkExperience.value = newArray
  delete workDocumentInputs.value[index]
  emit('update:workExperience', newArray)
  isUpdating = false
}

const triggerWorkDocumentInput = (index) => {
  if (workDocumentInputs.value[index]) {
    workDocumentInputs.value[index].click()
  }
}

const handleWorkDocumentSelect = (index, event) => {
  const file = event.target.files[0]
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      emit('file-selected', props.t('validation.invalidFileType') || 'Invalid file type. Allowed: PDF, JPG, PNG', 'error')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      emit('file-selected', props.t('validation.fileTooLarge') || 'File size must be less than 5MB', 'error')
      event.target.value = ''
      return
    }
    
    isUpdating = true
    const newArray = [...localWorkExperience.value]
    newArray[index].experienceLetterFile = file
    localWorkExperience.value = newArray
    emit('update:workDocument', { index, file })
    emit('update:workExperience', newArray)
    emit('file-selected', `${props.t('employee.document') || 'Document'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
    isUpdating = false
  }
}
</script>

<style scoped>
/* Keep all your existing styles - they remain unchanged */
.form-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #eef2ff;
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #eef2ff;
}

.card-header svg {
  width: 20px;
  height: 20px;
  color: #6366f1;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 20px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9edf2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title:first-of-type {
  margin-top: 0;
}

.form-row-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

.form-row-full {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.required {
  color: #ef4444;
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
  width: 100%;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.error {
  font-size: 11px;
  color: #ef4444;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.allowances-card {
  margin-top: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #eef2ff;
  overflow: hidden;
}

.allowances-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-bottom: 1px solid #bbf7d0;
}

.allowances-header svg {
  width: 24px;
  height: 24px;
  color: #10b981;
  flex-shrink: 0;
  margin-top: 2px;
}

.allowances-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 4px 0;
}

.allowances-header p {
  font-size: 11px;
  color: #047857;
  margin: 0;
}

.allowances-body {
  padding: 20px;
}

.salary-field {
  margin-bottom: 20px;
}

.allowances-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.allowance-summary {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  margin-top: 8px;
}

.summary-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  color: #475569;
}

.summary-item strong {
  font-weight: 600;
  color: #1e293b;
}

.summary-item.total {
  grid-column: span 2;
  font-weight: 600;
  color: #1e293b;
}

.summary-item.total strong {
  color: #1e293b;
  font-size: 14px;
}

.summary-item.gross {
  grid-column: span 2;
  font-weight: 700;
  color: #10b981;
  font-size: 14px;
}

.summary-item.gross strong {
  color: #059669;
  font-size: 16px;
}

.work-experience-section {
  margin-top: 24px;
  padding-top: 8px;
}

.work-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  color: #6366f1;
}

.btn-add {
  background: #6366f1;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-remove {
  background: #ef4444;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.btn-small {
  background: #e2e8f0;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}

.btn-small:hover {
  background: #cbd5e1;
}

.file-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.file-name {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name.no-file {
  color: #94a3b8;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 12px;
}

@media (max-width: 1024px) {
  .allowances-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .summary-item.total,
  .summary-item.gross {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .form-row-three {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .allowances-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .allowances-header {
    padding: 12px 16px;
  }
  
  .allowances-body {
    padding: 16px;
  }
}
</style>