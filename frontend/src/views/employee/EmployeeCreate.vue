<template>
  <div class="employee-create">
   

    <CreateHeader
  :t="t" 
     @import-click="openImportModal" />
    
    <form @submit.prevent="saveAllData" class="employee-form">
      
      <BasicInfoForm 
        :form="form"
        :errors="errors"
        :countries="countries"
         :t="t" 
        :profile-preview="profilePreview"
        @update:form="updateForm"
        @update:profileFile="updateProfileFile"
        @update:profilePreview="updateProfilePreview"
        @update:nationalIdFile="updateNationalIdFile"
        @file-selected="addToast"
        @upload-document="openDocumentUpload"
      />

      <CurrentCompanyInfoForm 
        :current-company="form.currentCompany"
            :t="t" 
        @update:currentCompany="updateCurrentCompany"
      />
      
      <EmploymentForm 
        :form="form"
        :work-experience="form.workExperience"
        :errors="errors"
            :t="t" 
        :departments="departments"
        :positions="positions"
        :employees="employeeList"
        @update:form="updateForm"
        @update:work-experience="updateWorkExperience"
        @update:work-document="updateWorkDocument"
        @file-selected="addToast"
        @upload-document="openDocumentUpload"
      />
      
      <FamilyInfoForm 
        :spouse-info="form.spouseInfo"
        :children="form.children"
        :parents-info="form.parentsInfo"
            :t="t" 
        @update:spouseInfo="updateSpouseInfo"
        @update:children="updateChildren"
        @update:parentsInfo="updateParentsInfo"
        @file-selected="addToast"
        @upload-document="openDocumentUpload"
      />
      
      <EducationForm 
        :education="form.education"
        @update:education="updateEducation"
            :t="t" 
        @upload-document="openDocumentUpload"
      />
      
      <TrainingForm 
        :training="form.training"
        @update:training="updateTraining"
            :t="t" 
        @upload-document="openDocumentUpload"
      />
      
      <LanguageSkillsForm 
        :language-skills="form.languageSkills"
        :other-skills="form.otherSkills"
            :t="t" 
        @update:languageSkills="updateLanguageSkills"
        @update:otherSkills="updateOtherSkills"
      />
      
      <NationalityForm 
        :nationality-acquisition="form.nationalityAcquisition"
            :t="t" 
        @update:nationalityAcquisition="updateNationalityAcquisition"
        @upload-document="openDocumentUpload"
      />
      
      <HealthLegalForm 
        :health-info="form.healthInfo"
        :legal-info="form.legalInfo"
            :t="t" 
        @update:healthInfo="updateHealthInfo"
        @update:legalInfo="updateLegalInfo"
      />
      
      <GuaranteeInfoForm 
        :guarantee-info="form.guaranteeInfo"
            :t="t" 
        @update:guaranteeInfo="updateGuaranteeInfo"
        @file-selected="addToast"
        @upload-document="openDocumentUpload"
      />
      
      <AdditionalInfoForm 
        :emergency="emergencyContact"
        :emergency-address="form.emergencyContactAddress"
        :bank="bankAccount"
        :ethiopian-banks="ethiopianBanks"
            :t="t" 
        @update:emergency="updateEmergencyContact"
        @update:emergencyAddress="updateEmergencyAddress"
        @update:bank="updateBankAccount"
      />
      
      <div class="form-actions">
        <router-link to="/employees" class="btn-outline">{{ $t('common.cancel') }}</router-link>
        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? $t('common.saving') : $t('common.saveEmployee') }}
        </button>
      </div>
    </form>

    <!-- Rest of your modals -->
    <DocumentUploadModal 
      v-if="showDocumentModal"
      :context="documentUploadContext"
          :t="t" 
      @close="showDocumentModal = false"
      @uploaded="handleDocumentUploaded"
    />

    <ImportModal 
      v-model:show="showImportModal"
          :t="t" 
      @import="handleImport"
      @toast="addToast"
    />

    <ToastContainer 
      :toasts="toasts"
          :t="t" 
      @remove-toast="removeToast"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import EmployeesService from '@/stores/employee'
import UsersService from '@/stores/users'
import CreateHeader from './components/employeeCreate/CreateHeader.vue'









import { useI18n } from 'vue-i18n'  // ← ADD THIS LINE
import BasicInfoForm from './components/employeeCreate/BasicInfoForm.vue'
import EmploymentForm from './components/employeeCreate/EmploymentForm.vue'
import FamilyInfoForm from './components/employeeCreate/FamilyInfoForm.vue'
import EducationForm from './components/employeeCreate/EducationForm.vue'
import TrainingForm from './components/employeeCreate/TrainingForm.vue'
import CurrentCompanyInfoForm from './components/employeeCreate/CurrentCompanyInfoForm.vue'
import LanguageSkillsForm from './components/employeeCreate/LanguageSkillsForm.vue'
import NationalityForm from './components/employeeCreate/NationalityForm.vue'
import HealthLegalForm from './components/employeeCreate/HealthLegalForm.vue'
import AdditionalInfoForm from './components/employeeCreate/AdditionalInfoForm.vue'
import ImportModal from './components/employeeCreate/ImportModal.vue'
import ToastContainer from './components/employeeCreate/ToastContainer.vue'
import DocumentUploadModal from './components/employeeCreate/DocumentUploadModal.vue'
import GuaranteeInfoForm from './components/employeeCreate/GuaranteeInfoForm.vue'



const { t, locale } = useI18n()



// Language state
const currentLanguage = ref(locale.value)






const router = useRouter()
const route = useRoute()
const toasts = ref([])
const showImportModal = ref(false)
const showDocumentModal = ref(false)
const documentUploadContext = ref({ type: null, index: null, field: null })
const isSubmitting = ref(false)
const profileFile = ref(null)
const profilePreview = ref(null)
const nationalIdFile = ref(null)

const departments = ref([])
const positions = ref([])
const employeeList = ref([])

const emergencyContact = reactive({
  name: '',
  relationship: '',
  phone: '',
  alternatePhone: ''
})

// Toggle language function
const toggleLanguage = () => {
  const newLang = currentLanguage.value === 'en' ? 'am' : 'en'
  locale.value = newLang
  currentLanguage.value = newLang
  localStorage.setItem('language', newLang)
  // Optional: show a toast notification
  addToast(newLang === 'en' ? 'Switched to English' : 'ወደ አማርኛ ተቀይሯል', 'success')
}


const bankAccount = reactive({
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
  branch: ''
})

// Form data
const form = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  email: '',
  personalEmail: '',
  fullNameEnglish: '',
  phone: '',
  dob: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  nationalId: '',
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
  workLocation: '',
  
  currentCompany: {
    companyName: '',
    companyTin: '',
    companyPhone: '',
    companyEmail: '',
    companyAddress: '',
    poBox: '',
    website: ''
  },
  
  birthPlace: {
    region: '',
    city: '',
    subcity: '',
    district: ''
  },
  
  currentAddress: {
    region: '',
    subcity: '',
    kebele: '',
    district: '',
    poBox: '',
    houseNumber: ''
  },
  
  mothersFullName: '',
  
  spouseInfo: {
    tinNumber: '',
    fullName: '',
    dateOfBirth: '',
    jobStatus: '',
    companyName: '',
    companyAddress: '',
    profilePictureFile: null,
    marriageCertificateFile: null
  },
  children: [],
  parentsInfo: {
    father: { fullName: '', monthlyIncome: null, job: '' },
    mother: { fullName: '', monthlyIncome: null, job: '' },
    financialSupport: '',
    otherSupport: ''
  },
  
  workExperience: [],
  education: [],
  training: [],
  languageSkills: [],
  otherSkills: '',
  parentSupport: [],
  
  nationalityAcquisition: {
    type: 'by_birth',
    documentId: null,
    documentUrl: null
  },
  
  healthInfo: {
    hasPhysicalInjury: false,
    injuryDescription: ''
  },
  legalInfo: {
    hasCriminalRecord: false,
    criminalRecordDescription: ''
  },
  
  guaranteeInfo: [],
  
  emergencyContactAddress: {
    city: '',
    subcity: '',
    district: '',
    kebele: ''
  }
})

const errors = ref({})

// Update methods
const updateForm = (newForm) => {
  form.value = newForm
}

const updateCurrentCompany = (newCompany) => {
  form.value.currentCompany = newCompany
}

const updateProfileFile = (file) => {
  profileFile.value = file
}

const updateProfilePreview = (preview) => {
  profilePreview.value = preview
}

const updateNationalIdFile = (file) => {
  nationalIdFile.value = file
}

const updateWorkExperience = (newWorkExperience) => {
  form.value.workExperience = newWorkExperience
}

const updateWorkDocument = ({ index, file }) => {
  if (form.value.workExperience[index]) {
    form.value.workExperience[index].experienceLetterFile = file
  }
}

const updateSpouseInfo = (newSpouseInfo) => {
  form.value.spouseInfo = newSpouseInfo
}

const updateChildren = (newChildren) => {
  form.value.children = newChildren
}

const updateParentsInfo = (newParentsInfo) => {
  form.value.parentsInfo = newParentsInfo
}

const updateGuaranteeInfo = (newGuaranteeInfo) => {
  form.value.guaranteeInfo = newGuaranteeInfo
}

const updateEmergencyContact = (newEmergency) => {
  Object.assign(emergencyContact, newEmergency)
}

const updateEmergencyAddress = (newAddress) => {
  form.value.emergencyContactAddress = newAddress
}

const updateBankAccount = (newBank) => {
  Object.assign(bankAccount, newBank)
}

const updateEducation = (newEducation) => {
  form.value.education = newEducation
}

const updateTraining = (newTraining) => {
  form.value.training = newTraining
}

const updateLanguageSkills = (newLanguages) => {
  form.value.languageSkills = newLanguages
}

const updateOtherSkills = (newSkills) => {
  form.value.otherSkills = newSkills
}

const updateNationalityAcquisition = (newData) => {
  form.value.nationalityAcquisition = newData
}

const updateHealthInfo = (newHealth) => {
  form.value.healthInfo = newHealth
}

const updateLegalInfo = (newLegal) => {
  form.value.legalInfo = newLegal
}

const saveAllData = async () => {
  if (!validateForm()) {
    addToast('Please fix validation errors', 'error')
    return
  }
  
  console.log('=== SAVING EMPLOYEE DATA ===')
  console.log('Required fields:', {
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    departmentId: form.value.departmentId,
    positionId: form.value.positionId,
    employmentType: form.value.employmentType,
    hireDate: form.value.hireDate
  })
  
  isSubmitting.value = true
  
  try {
    const employeeData = {
      firstName: form.value.firstName?.trim(),
      lastName: form.value.lastName?.trim(),
      middleName: form.value.middleName?.trim() || null,
      fullNameEnglish: form.value.fullNameEnglish?.trim() || null, 
      email: form.value.email?.trim(),
      personalEmail: form.value.personalEmail?.trim() || null,
      phone: form.value.phone?.trim(),
      dob: form.value.dob || null,
      gender: form.value.gender || null,
      maritalStatus: form.value.maritalStatus || null,
      nationality: form.value.nationality || null,
      nationalId: form.value.nationalId || null,
      departmentId: form.value.departmentId ? parseInt(form.value.departmentId) : null,
      positionId: form.value.positionId ? parseInt(form.value.positionId) : null,
      managerId: form.value.managerId ? parseInt(form.value.managerId) : null,
      employmentType: form.value.employmentType,
      hireDate: form.value.hireDate,
      basicSalary: form.value.basicSalary,
      housingAllowance: parseFloat(form.value.housingAllowance) || 0,
      positionAllowance: parseFloat(form.value.positionAllowance) || 0,
      transportAllowance: parseFloat(form.value.transportAllowance) || 0,
      mobileAllowance: parseFloat(form.value.mobileAllowance) || 0,
      workLocation: form.value.workLocation?.trim() || null,
      currentCompany: form.value.currentCompany,
      birthPlace: form.value.birthPlace,
      currentAddress: form.value.currentAddress,
      mothersFullName: form.value.mothersFullName,
      spouseInfo: form.value.spouseInfo,
      children: form.value.children,
      parentsInfo: form.value.parentsInfo,
      workExperience: form.value.workExperience,
      education: form.value.education,
      training: form.value.training,
      languageSkills: form.value.languageSkills,
      otherSkills: form.value.otherSkills,
      parentSupport: form.value.parentSupport,
      nationalityAcquisition: form.value.nationalityAcquisition,
      healthInfo: form.value.healthInfo,
      legalInfo: form.value.legalInfo,
      guaranteeInfo: form.value.guaranteeInfo,
      emergencyContactAddress: form.value.emergencyContactAddress,
      emergencyContact: JSON.stringify(emergencyContact),
      bankAccount: JSON.stringify(bankAccount)
    }
    
    console.log('Sending employeeData:', employeeData)
    
    let employeeId
  
    if (route.params.id) {
      const result = await EmployeesService.updateEmployee(route.params.id, employeeData)
      if (!result.success) throw new Error(result.error)
      employeeId = route.params.id
      addToast('Employee updated successfully!', 'success')
    } else {
      const result = await EmployeesService.createEmployee(employeeData)
      console.log('Create result:', result)
      if (!result.success) throw new Error(result.error || 'Failed to create employee')
      employeeId = result.data.id
      addToast('Employee created successfully!', 'success')
    }
    
    await uploadAllDocuments(employeeId)
    
    setTimeout(() => {
      router.push('/employees')
    }, 2000)
    
  } catch (error) {
    console.error('Save error:', error)
    addToast(error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const uploadAllDocuments = async (employeeId) => {
  console.log('Uploading documents for employee:', employeeId)
  
  // 1. Profile Picture
  if (profileFile.value) {
    await EmployeesService.uploadEmployeeDocument(employeeId, profileFile.value, 'profile_picture')
  }
  
  // 2. National ID Document
  if (nationalIdFile.value) {
    await EmployeesService.uploadEmployeeDocument(employeeId, nationalIdFile.value, 'national_id')
  }
  
  // 3. Spouse Profile Picture
  if (form.value.spouseInfo?.profilePictureFile) {
    await EmployeesService.uploadEmployeeDocument(
      employeeId, 
      form.value.spouseInfo.profilePictureFile, 
      'spouse_profile'
    )
  }
  
  // 4. Marriage Certificate
  if (form.value.spouseInfo?.marriageCertificateFile) {
    await EmployeesService.uploadEmployeeDocument(
      employeeId, 
      form.value.spouseInfo.marriageCertificateFile, 
      'marriage_certificate'
    )
  }
  
  // 5. Children Documents
  for (let i = 0; i < form.value.children.length; i++) {
    const child = form.value.children[i]
    
    if (child.birthCertificateFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, child.birthCertificateFile, 'child_birth_certificate', { index: i }
      )
    }
    if (child.medicalReportFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, child.medicalReportFile, 'child_medical_report', { index: i }
      )
    }
    if (child.adoptionCertificateFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, child.adoptionCertificateFile, 'child_adoption_certificate', { index: i }
      )
    }
    if (child.profilePictureFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, child.profilePictureFile, 'child_profile', { index: i }
      )
    }
  }
  
  // 6. Work Experience Documents
  for (let i = 0; i < form.value.workExperience.length; i++) {
    const work = form.value.workExperience[i]
    if (work.experienceLetterFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, work.experienceLetterFile, 'experience_letter', { index: i }
      )
    }
  }
  
  // 7. Guarantee Documents
  for (let i = 0; i < form.value.guaranteeInfo.length; i++) {
    const guarantee = form.value.guaranteeInfo[i]
    
    if (guarantee.guaranteeLetterFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, guarantee.guaranteeLetterFile, 'guarantee_letter', { index: i }
      )
    }
    if (guarantee.sdtLetterFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, guarantee.sdtLetterFile, 'sdt_letter', { index: i }
      )
    }
    if (guarantee.otherDocumentFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, guarantee.otherDocumentFile, 'guarantee_other', { index: i }
      )
    }
  }
  
  // 8. Education Certificates
  for (let i = 0; i < form.value.education.length; i++) {
    const edu = form.value.education[i]
    if (edu.certificateFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, edu.certificateFile, 'education_certificate', { index: i }
      )
    }
  }
  
  // 9. Training Certificates
  for (let i = 0; i < form.value.training.length; i++) {
    const train = form.value.training[i]
    if (train.certificateFile) {
      await EmployeesService.uploadEmployeeDocument(
        employeeId, train.certificateFile, 'training_certificate', { index: i }
      )
    }
  }
  
  // 10. Naturalization Certificate
  if (form.value.nationalityAcquisition?.documentFile) {
    await EmployeesService.uploadEmployeeDocument(
      employeeId, form.value.nationalityAcquisition.documentFile, 'naturalization_certificate'
    )
  }

  // 11. Health Document
if (form.value.healthInfo?.documentFile) {
  await EmployeesService.uploadEmployeeDocument(
    employeeId, form.value.healthInfo.documentFile, 'health_document'
  )
}

// 12. Legal Document
if (form.value.legalInfo?.documentFile) {
  await EmployeesService.uploadEmployeeDocument(
    employeeId, form.value.legalInfo.documentFile, 'legal_document'
  )
}
}

const openDocumentUpload = (context) => {
  documentUploadContext.value = context
  showDocumentModal.value = true
}

const handleDocumentUploaded = async (result) => {
  const { type, index, field, documentId, fileUrl } = documentUploadContext.value
  
  addToast('Document uploaded successfully', 'success')
  showDocumentModal.value = false
}

const validateForm = () => {
  const newErrors = {}
  if (!form.value.firstName?.trim()) newErrors.firstName = 'First name is required'
  if (!form.value.lastName?.trim()) newErrors.lastName = 'Last name is required'
  if (!form.value.email?.trim()) newErrors.email = 'Email is required'
  if (!form.value.phone?.trim()) newErrors.phone = 'Phone is required'
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
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

onMounted(() => {
  loadDepartments()
  loadPositions()
  loadManagers()
})
</script>

<style scoped>

/* Language Toggle Button - Simple and clean */
.language-toggle-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.lang-toggle-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.lang-toggle-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.lang-toggle-btn:active {
  transform: translateY(0);
}

/* Rest of your existing styles remain the same */
.employee-create {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #f5f7fa;
  min-height: 100vh;
}




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

@media (max-width: 768px) {
  .employee-create {
    padding: 16px;
  }
}

/* Your existing styles remain the same */
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

@media (max-width: 768px) {
  .employee-create {
    padding: 16px;
  }
}

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