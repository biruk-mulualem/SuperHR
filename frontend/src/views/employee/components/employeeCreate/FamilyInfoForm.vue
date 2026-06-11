<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        <path d="M12 2v20" />
      </svg>
      <h3>{{ props.t('family.title') || 'Family Information' }}</h3>
    </div>
    <div class="card-body">
      
      <!-- ========== SPOUSE SECTION ========== -->
      <div class="section-title">{{ props.t('family.spouseTitle') || 'Spouse Information' }}</div>
      
      <!-- Row 1: TIN Number, Spouse Full Name, Date of Birth -->
      <div class="form-row-three">
        <div class="form-field">
          <label>{{ props.t('family.tinNumber') || 'TIN Number' }}</label>
          <input 
            type="text" 
            :value="spouseInfo.tinNumber" 
            @input="updateSpouse('tinNumber', $event.target.value)"
            :placeholder="props.t('family.tinPlaceholder') || 'Tax Identification Number'"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('family.spouseFullName') || 'Spouse Full Name' }}</label>
          <input 
            type="text" 
            :value="spouseInfo.fullName" 
            @input="updateSpouse('fullName', $event.target.value)"
            :placeholder="props.t('family.spouseNamePlaceholder') || 'Spouse full name'"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('family.dateOfBirth') || 'Date of Birth' }}</label>
          <input 
            type="date" 
            :value="spouseInfo.dateOfBirth" 
            @input="updateSpouse('dateOfBirth', $event.target.value)"
          >
        </div>
      </div>
      
      <!-- Row 2: Job Status, Company Name, Company Address -->
      <div class="form-row-three">
        <div class="form-field">
          <label>{{ props.t('family.jobStatus') || 'Job Status' }}</label>
          <select :value="spouseInfo.jobStatus" @change="updateSpouse('jobStatus', $event.target.value)">
            <option value="">{{ props.t('common.select') || 'Select' }}</option>
            <option value="family.government">{{ props.t('family.government') || 'Government' }}</option>
            <option value="family.private">{{ props.t('family.private') || 'Private Company' }}</option>
            <option value="family.unemployed">{{ props.t('family.unemployed') || 'Unemployed' }}</option>
            <option value="family.business">{{ props.t('family.business') || 'Own Business' }}</option>
            <option value="family.other">{{ props.t('family.other') || 'Other' }}</option>
          </select>
        </div>
        <div class="form-field">
          <label>{{ props.t('family.companyName') || 'Company Name' }}</label>
          <input 
            :value="spouseInfo.companyName" 
            @input="updateSpouse('companyName', $event.target.value)"
            :placeholder="props.t('company.namePlaceholder') || 'Company name'"
          >
        </div>
        <div class="form-field">
          <label>{{ props.t('family.companyAddress') || 'Company Address' }}</label>
          <input 
            type="text" 
            :value="spouseInfo.companyAddress" 
            @input="updateSpouse('companyAddress', $event.target.value)"
            :placeholder="props.t('company.addressPlaceholder') || 'Company address'"
          >
        </div>
      </div>
      
      <!-- Row 3: Profile Picture, Marriage Certificate (2 fields, third empty) -->
      <div class="form-row-three">
        <div class="form-field">
          <label>{{ props.t('family.profilePicture') || 'Profile Picture' }}</label>
          <div class="file-upload-row">
            <button type="button" class="btn-small" @click="triggerSpouseProfileInput">
              {{ spouseInfo.profilePictureFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
            </button>
            <span v-if="spouseInfo.profilePictureFile" class="file-name">{{ spouseInfo.profilePictureFile.name }}</span>
            <span v-else class="file-name no-file">{{ props.t('family.noFileSelected') || 'No file selected' }}</span>
          </div>
          <input type="file" ref="spouseProfileInput" @change="handleSpouseProfileSelect" accept="image/jpeg,image/jpg,image/png" style="display: none" />
          <small class="field-hint">{{ props.t('family.profileHint') || 'Select photo (will be uploaded on save)' }}</small>
        </div>
        <div class="form-field">
          <label>{{ props.t('family.marriageCertificate') || 'Marriage Certificate' }}</label>
          <div class="file-upload-row">
            <button type="button" class="btn-small" @click="triggerMarriageCertificateInput">
              {{ spouseInfo.marriageCertificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
            </button>
            <span v-if="spouseInfo.marriageCertificateFile" class="file-name">{{ spouseInfo.marriageCertificateFile.name }}</span>
            <span v-else class="file-name no-file">{{ props.t('family.noFileSelected') || 'No file selected' }}</span>
          </div>
          <input type="file" ref="marriageCertificateInput" @change="handleMarriageCertificateSelect" accept=".pdf,.jpg,.jpeg,.png" style="display: none" />
          <small class="field-hint">{{ props.t('family.certificateHint') || 'Select certificate (will be uploaded on save)' }}</small>
        </div>
        <div class="form-field">
          <!-- Empty for alignment -->
        </div>
      </div>
      
      <!-- ========== CHILDREN SECTION ========== -->
      <div class="section-title" style="margin-top: 24px;">
        {{ props.t('family.childrenTitle') || 'Children' }}
        <button type="button" class="btn-add" @click="addChild">+ {{ props.t('common.add') || 'Add Child' }}</button>
      </div>
      
      <div v-for="(child, idx) in localChildren" :key="idx" class="child-card">
        <div class="child-header">
          <span>{{ props.t('family.child') || 'Child' }} {{ idx + 1 }}</span>
          <button type="button" class="btn-remove" @click="removeChild(idx)">×</button>
        </div>
        
        <!-- Row 1: Child Name, Date of Birth -->
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ props.t('family.childFullName') || "Child's Full Name" }}</label>
            <input 
              type="text" 
              :value="child.name" 
              @input="updateChild(idx, 'name', $event.target.value)"
              :placeholder="props.t('family.childNamePlaceholder') || 'Child\'s name'"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('family.dateOfBirth') || 'Date of Birth' }}</label>
            <input 
              type="date" 
              :value="child.dateOfBirth" 
              @input="updateChild(idx, 'dateOfBirth', $event.target.value)"
            >
          </div>
          <div class="form-field">
            <!-- Empty for alignment -->
          </div>
        </div>
        
        <!-- Age Warning Message (full width) -->
        <div v-if="child.ageWarning" class="warning-message full-width-message">
          ⚠️ {{ child.ageWarning }}
        </div>
        
        <!-- Row 2: Has Medical Condition, Is Adopted -->
        <div class="form-row-three">
          <div class="form-field">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                :checked="child.hasMedicalCondition" 
                @change="updateChild(idx, 'hasMedicalCondition', $event.target.checked)"
              >
              {{ props.t('family.hasMedicalCondition') || 'Has Medical Condition / Disability' }}
            </label>
          </div>
          <div class="form-field">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                :checked="child.isAdopted" 
                @change="updateChild(idx, 'isAdopted', $event.target.checked)"
              >
              {{ props.t('family.isAdopted') || 'Is Adopted' }}
            </label>
          </div>
          <div class="form-field">
            <!-- Empty for alignment -->
          </div>
        </div>
        
        <!-- Medical Condition Notes (full width) - only if has medical condition -->
        <div v-if="child.hasMedicalCondition" class="form-row-full">
          <div class="form-field">
            <label>{{ props.t('family.medicalConditionNotes') || 'Medical Condition Notes' }}</label>
            <textarea 
              :value="child.medicalConditionNotes" 
              @input="updateChild(idx, 'medicalConditionNotes', $event.target.value)"
              rows="2" 
              :placeholder="props.t('family.medicalNotesPlaceholder') || 'Describe medical condition or disability'"
            ></textarea>
          </div>
        </div>
        
        <!-- Row 3: Birth Certificate, Medical Report (only if medical condition), Adoption Certificate (if adopted) -->
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ props.t('family.birthCertificate') || 'Birth Certificate' }}</label>
            <div class="file-upload-row">
              <button type="button" class="btn-small" @click="triggerChildDocumentInput(idx, 'birthCertificate')">
                {{ child.birthCertificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
              </button>
              <span v-if="child.birthCertificateFile" class="file-name">{{ child.birthCertificateFile.name }}</span>
              <span v-else class="file-name no-file">{{ props.t('family.noFile') || 'No file' }}</span>
            </div>
            <input type="file" :ref="el => setChildDocumentRef(idx, 'birthCertificate', el)" @change="handleChildDocumentSelect(idx, 'birthCertificate', $event)" accept=".pdf,.jpg,.jpeg,.png" style="display: none" />
          </div>
          
          <!-- Medical Report - ONLY SHOW IF hasMedicalCondition is true -->
          <div class="form-field" v-if="child.hasMedicalCondition">
            <label>{{ props.t('family.medicalReport') || 'Medical Report' }}</label>
            <div class="file-upload-row">
              <button type="button" class="btn-small" @click="triggerChildDocumentInput(idx, 'medicalReport')">
                {{ child.medicalReportFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
              </button>
              <span v-if="child.medicalReportFile" class="file-name">{{ child.medicalReportFile.name }}</span>
              <span v-else class="file-name no-file">{{ props.t('family.noFile') || 'No file' }}</span>
            </div>
            <input type="file" :ref="el => setChildDocumentRef(idx, 'medicalReport', el)" @change="handleChildDocumentSelect(idx, 'medicalReport', $event)" accept=".pdf,.jpg,.jpeg,.png" style="display: none" />
          </div>
          
          <!-- Empty placeholder when no medical condition -->
          <div class="form-field" v-else>
            <!-- Empty for alignment -->
          </div>
          
          <!-- Adoption Certificate - ONLY SHOW IF isAdopted is true -->
          <div class="form-field" v-if="child.isAdopted">
            <label>{{ props.t('family.adoptionCertificate') || 'Adoption Certificate' }}</label>
            <div class="file-upload-row">
              <button type="button" class="btn-small" @click="triggerChildDocumentInput(idx, 'adoptionCertificate')">
                {{ child.adoptionCertificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
              </button>
              <span v-if="child.adoptionCertificateFile" class="file-name">{{ child.adoptionCertificateFile.name }}</span>
              <span v-else class="file-name no-file">{{ props.t('family.noFile') || 'No file' }}</span>
            </div>
            <input type="file" :ref="el => setChildDocumentRef(idx, 'adoptionCertificate', el)" @change="handleChildDocumentSelect(idx, 'adoptionCertificate', $event)" accept=".pdf,.jpg,.jpeg,.png" style="display: none" />
          </div>
          <div class="form-field" v-if="!child.isAdopted">
            <!-- Empty for alignment -->
          </div>
        </div>
        
        <!-- Row 4: Child Profile Picture -->
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ props.t('family.childProfilePicture') || "Child's Profile Picture" }}</label>
            <div class="file-upload-row">
              <button type="button" class="btn-small" @click="triggerChildProfileInput(idx)">
                {{ child.profilePictureFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
              </button>
              <span v-if="child.profilePictureFile" class="file-name">{{ child.profilePictureFile.name }}</span>
              <span v-else class="file-name no-file">{{ props.t('family.noFileSelected') || 'No file selected' }}</span>
            </div>
            <input type="file" :ref="el => setChildProfileRef(idx, el)" @change="handleChildProfileSelect(idx, $event)" accept="image/jpeg,image/jpg,image/png" style="display: none" />
          </div>
          <div class="form-field">
            <!-- Empty for alignment -->
          </div>
          <div class="form-field">
            <!-- Empty for alignment -->
          </div>
        </div>
      </div>
      
      <div v-if="localChildren.length === 0" class="empty-state">
        {{ props.t('family.noChildrenAdded') || 'No children added. Click "Add Child" to add.' }}
      </div>
      
      <!-- ========== PARENTS INFORMATION SECTION ========== -->
      <div class="section-title" style="margin-top: 24px;">
        {{ props.t('family.parentsTitle') || 'Parents Information' }}
      </div>
      
      <!-- Father Information -->
      <div class="parent-card">
        <div class="parent-header">{{ props.t('family.fatherInfo') || "Father's Information" }}</div>
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ props.t('family.fullName') || 'Full Name' }}</label>
            <input 
              type="text" 
              :value="parentsInfo.father?.fullName" 
              @input="updateParent('father', 'fullName', $event.target.value)"
              :placeholder="props.t('family.fatherNamePlaceholder') || 'Father\'s full name'"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('family.monthlyIncome') || 'Monthly Income (ETB)' }}</label>
            <input 
              type="number" 
              :value="parentsInfo.father?.monthlyIncome" 
              @input="updateParent('father', 'monthlyIncome', parseFloat($event.target.value))"
              placeholder="0.00"
              step="100"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('family.jobOccupation') || 'Job / Occupation' }}</label>
            <input 
              type="text" 
              :value="parentsInfo.father?.job" 
              @input="updateParent('father', 'job', $event.target.value)"
              :placeholder="props.t('family.jobPlaceholder') || 'e.g., Government Employee, Farmer'"
            >
          </div>
        </div>
      </div>
      
      <!-- Mother Information -->
      <div class="parent-card">
        <div class="parent-header">{{ props.t('family.motherInfo') || "Mother's Information" }}</div>
        <div class="form-row-three">
          <div class="form-field">
            <label>{{ props.t('family.fullName') || 'Full Name' }}</label>
            <input 
              type="text" 
              :value="parentsInfo.mother?.fullName" 
              @input="updateParent('mother', 'fullName', $event.target.value)"
              :placeholder="props.t('family.motherNamePlaceholder') || 'Mother\'s full name'"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('family.monthlyIncome') || 'Monthly Income (ETB)' }}</label>
            <input 
              type="number" 
              :value="parentsInfo.mother?.monthlyIncome" 
              @input="updateParent('mother', 'monthlyIncome', parseFloat($event.target.value))"
              placeholder="0.00"
              step="100"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('family.jobOccupation') || 'Job / Occupation' }}</label>
            <input 
              type="text" 
              :value="parentsInfo.mother?.job" 
              @input="updateParent('mother', 'job', $event.target.value)"
              :placeholder="props.t('family.jobPlaceholder') || 'e.g., Government Employee, Housewife'"
            >
          </div>
        </div>
      </div>
      
      <!-- Support Information -->
      <div class="support-section">
        <div class="section-subtitle">{{ props.t('family.supportTitle') || 'Support Information' }}</div>
        
        <!-- Financial Support (full width) -->
        <div class="form-row-full">
          <div class="form-field">
            <label>{{ props.t('family.financialSupport') || 'Financial Support (Money)' }}</label>
            <textarea 
              :value="parentsInfo.financialSupport" 
              @input="updateParentsInfo('financialSupport', $event.target.value)"
              rows="2" 
              :placeholder="props.t('family.financialPlaceholder') || 'Describe any financial support provided to parents (amount, frequency, etc.)'"
            ></textarea>
          </div>
        </div>
        
        <!-- Other Support (full width) -->
        <div class="form-row-full">
          <div class="form-field">
            <label>{{ props.t('family.otherSupport') || 'Other Support' }}</label>
            <textarea 
              :value="parentsInfo.otherSupport" 
              @input="updateParentsInfo('otherSupport', $event.target.value)"
              rows="2" 
              :placeholder="props.t('family.otherPlaceholder') || 'Describe any other support provided (medical, housing, etc.)'"
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- Info Note about age limits -->
      <div class="info-note">
        <small>📌 {{ props.t('family.ageNote') || 'Note: Children under 18 years old are eligible as dependents. Children with disabilities under 21 years old may also be eligible.' }}</small>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  spouseInfo: {
    type: Object,
    default: () => ({})
  },
  children: {
    type: Array,
    default: () => []
  },
  parentsInfo: {
    type: Object,
    default: () => ({
      father: { fullName: '', monthlyIncome: null, job: '' },
      mother: { fullName: '', monthlyIncome: null, job: '' },
      financialSupport: '',
      otherSupport: ''
    })
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:spouseInfo', 'update:children', 'update:parentsInfo', 'file-selected'])

// Local reactive copy of children
const localChildren = ref([...(props.children || [])])

// Flag to prevent recursive updates
let isUpdating = false

// Watch for changes from parent - only update if not from local
watch(() => props.children, (newVal) => {
  if (!isUpdating) {
    localChildren.value = [...(newVal || [])]
  }
}, { deep: true })

// Refs for file inputs
const spouseProfileInput = ref(null)
const marriageCertificateInput = ref(null)
const childDocumentRefs = ref({})
const childProfileRefs = ref({})

// Helper function to calculate age
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Update spouse info - emits directly, no watch needed
const updateSpouse = (field, value) => {
  const newSpouse = { ...props.spouseInfo, [field]: value }
  emit('update:spouseInfo', newSpouse)
}

// Spouse file handlers
const triggerSpouseProfileInput = () => {
  spouseProfileInput.value?.click()
}

const handleSpouseProfileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      emit('file-selected', props.t('validation.invalidFileType') || 'Invalid file type. Allowed: JPG, PNG', 'error')
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      emit('file-selected', props.t('validation.fileTooLarge') || 'File size must be less than 2MB', 'error')
      event.target.value = ''
      return
    }
    const newSpouse = { ...props.spouseInfo, profilePictureFile: file }
    emit('update:spouseInfo', newSpouse)
    emit('file-selected', `${props.t('family.profilePicture') || 'Profile picture'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
  }
}

const triggerMarriageCertificateInput = () => {
  marriageCertificateInput.value?.click()
}

const handleMarriageCertificateSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
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
    const newSpouse = { ...props.spouseInfo, marriageCertificateFile: file }
    emit('update:spouseInfo', newSpouse)
    emit('file-selected', `${props.t('family.marriageCertificate') || 'Marriage certificate'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
  }
}

// Child management - emit directly to parent
const addChild = () => {
  isUpdating = true
  const newChildren = [...localChildren.value, {
    name: '',
    dateOfBirth: '',
    hasMedicalCondition: false,
    medicalConditionNotes: '',
    isAdopted: false,
    ageWarning: null,
    birthCertificateFile: null,
    medicalReportFile: null,
    adoptionCertificateFile: null,
    profilePictureFile: null
  }]
  localChildren.value = newChildren
  emit('update:children', newChildren)
  isUpdating = false
}

const updateChild = (index, field, value) => {
  isUpdating = true
  const newChildren = [...localChildren.value]
  newChildren[index] = { ...newChildren[index], [field]: value }
  
  if (field === 'dateOfBirth' || field === 'hasMedicalCondition') {
    const age = calculateAge(newChildren[index].dateOfBirth)
    const hasDisability = newChildren[index].hasMedicalCondition
    let warning = null
    
    if (age !== null) {
      if (hasDisability) {
        if (age >= 21) {
          warning = props.t('family.warningAgeDisabilityOver21') || `Child is ${age} years old. With disability, maximum age for dependent is 21 years.`
        } else if (age >= 18) {
          warning = props.t('family.warningAgeDisability18to21') || `Child is ${age} years old (with disability). Eligible up to 21 years.`
        }
      } else {
        if (age >= 18) {
          warning = props.t('family.warningAgeOver18') || `Child is ${age} years old. Without disability, maximum age for dependent is 18 years.`
        } else if (age >= 16) {
          warning = props.t('family.warningAge16to18') || `Child is ${age} years old. Will age out of dependent status soon.`
        }
      }
    }
    newChildren[index].ageWarning = warning
  }
  
  // If medical condition is unchecked, clear medical report file
  if (field === 'hasMedicalCondition' && value === false) {
    newChildren[index].medicalReportFile = null
  }
  
  localChildren.value = newChildren
  emit('update:children', newChildren)
  isUpdating = false
}

const removeChild = (index) => {
  isUpdating = true
  const newChildren = [...localChildren.value]
  newChildren.splice(index, 1)
  localChildren.value = newChildren
  emit('update:children', newChildren)
  isUpdating = false
}

// Child document handlers
const setChildDocumentRef = (index, type, el) => {
  if (!childDocumentRefs.value[index]) childDocumentRefs.value[index] = {}
  if (el) childDocumentRefs.value[index][type] = el
}

const triggerChildDocumentInput = (index, type) => {
  if (childDocumentRefs.value[index]?.[type]) {
    childDocumentRefs.value[index][type].click()
  }
}

const handleChildDocumentSelect = (index, type, event) => {
  const file = event.target.files[0]
  if (file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
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
    const newChildren = [...localChildren.value]
    const fieldMap = {
      birthCertificate: 'birthCertificateFile',
      medicalReport: 'medicalReportFile',
      adoptionCertificate: 'adoptionCertificateFile'
    }
    newChildren[index][fieldMap[type]] = file
    localChildren.value = newChildren
    emit('update:children', newChildren)
    emit('file-selected', `${props.t('family.document') || 'Document'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
    isUpdating = false
  }
}

// Child profile picture handlers
const setChildProfileRef = (index, el) => {
  if (el) childProfileRefs.value[index] = el
}

const triggerChildProfileInput = (index) => {
  if (childProfileRefs.value[index]) {
    childProfileRefs.value[index].click()
  }
}

const handleChildProfileSelect = (index, event) => {
  const file = event.target.files[0]
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      emit('file-selected', props.t('validation.invalidFileType') || 'Invalid file type. Allowed: JPG, PNG', 'error')
      event.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      emit('file-selected', props.t('validation.fileTooLarge') || 'File size must be less than 2MB', 'error')
      event.target.value = ''
      return
    }
    
    isUpdating = true
    const newChildren = [...localChildren.value]
    newChildren[index].profilePictureFile = file
    localChildren.value = newChildren
    emit('update:children', newChildren)
    emit('file-selected', `${props.t('family.childProfilePicture') || 'Child profile picture'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
    isUpdating = false
  }
}

// Parents Information - emits directly, no watch needed
const updateParent = (parent, field, value) => {
  const newParentsInfo = {
    ...props.parentsInfo,
    [parent]: { ...props.parentsInfo[parent], [field]: value }
  }
  emit('update:parentsInfo', newParentsInfo)
}

const updateParentsInfo = (field, value) => {
  const newParentsInfo = { ...props.parentsInfo, [field]: value }
  emit('update:parentsInfo', newParentsInfo)
}
</script>

<style scoped>
/* Your existing styles remain exactly the same - no changes needed */
.form-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e9edf2;
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
}

.card-header svg {
  width: 18px;
  height: 18px;
  color: #6366f1;
}

.card-header h3 {
  font-size: 15px;
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
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9edf2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 16px;
}

/* Three column layout */
.form-row-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 16px;
}

/* Full width row */
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
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input {
  width: auto;
  margin: 0;
}

.child-card,
.parent-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
}

.parent-header {
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 16px;
  font-size: 14px;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  color: #6366f1;
}

.support-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid #e2e8f0;
}

.warning-message {
  background: #fef3c7;
  color: #92400e;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  margin-bottom: 16px;
}

.full-width-message {
  grid-column: span 3;
}

.info-note {
  margin-top: 16px;
  padding: 12px;
  background: #e0f2fe;
  border-radius: 8px;
  color: #0369a1;
  font-size: 12px;
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
  gap: 8px;
  flex-wrap: wrap;
}

.file-name {
  font-size: 11px;
  color: #10b981;
  font-weight: 500;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name.no-file {
  color: #94a3b8;
}

.field-hint {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row-three {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .full-width-message {
    grid-column: span 1;
  }
  
  .card-body {
    padding: 16px;
  }
}
</style>