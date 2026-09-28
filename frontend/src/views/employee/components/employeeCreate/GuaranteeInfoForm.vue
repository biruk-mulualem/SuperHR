<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        <path d="M12 2v20" />
      </svg>
      <h3>{{ props.t('guarantee.title') || 'Guarantee Information' }}</h3>
      <span class="optional-badge">{{ props.t('common.optional') || 'Optional' }}</span>
    </div>
    <div class="card-body">
      
      <div class="section-title">
        {{ props.t('guarantee.guarantors') || 'Guarantors' }}
        <button type="button" class="btn-add" @click="addGuarantor">+ {{ props.t('common.add') || 'Add Guarantor' }}</button>
      </div>
      
      <div v-for="(guarantor, index) in localGuaranteeInfo" :key="index" class="guarantor-card">
        <div class="item-header">
          <span>{{ props.t('guarantee.guarantor') || 'Guarantor' }} {{ index + 1 }}</span>
          <button type="button" class="btn-remove" @click="removeGuarantor(index)">×</button>
        </div>
        
        <!-- Row 1: Guarantor Name, Guarantor Job, Guarantor Office Name, Guarantor Office Address (4 columns) -->
        <div class="form-row-four">
          <div class="form-field">
            <label>{{ props.t('guarantee.guarantorName') || 'Guarantor Name' }}</label>
            <input 
              type="text" 
              :value="guarantor.guarantorName" 
              @input="updateGuarantor(index, 'guarantorName', $event.target.value)"
              :placeholder="props.t('guarantee.guarantorNamePlaceholder') || 'Full name of guarantor'"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('guarantee.guarantorJob') || 'Guarantor Job / Position' }}</label>
            <input 
              type="text" 
              :value="guarantor.guarantorJob" 
              @input="updateGuarantor(index, 'guarantorJob', $event.target.value)"
              :placeholder="props.t('guarantee.jobPlaceholder') || 'Job title or position'"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('guarantee.guarantorOfficeName') || 'Guarantor Office Name' }}</label>
            <input 
              type="text" 
              :value="guarantor.guarantorOfficeName" 
              @input="updateGuarantor(index, 'guarantorOfficeName', $event.target.value)"
              :placeholder="props.t('guarantee.officeNamePlaceholder') || 'Company/Office name'"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('guarantee.guarantorOfficeAddress') || 'Guarantor Office Address' }}</label>
            <input 
              type="text" 
              :value="guarantor.guarantorOfficeAddress" 
              @input="updateGuarantor(index, 'guarantorOfficeAddress', $event.target.value)"
              :placeholder="props.t('guarantee.addressPlaceholder') || 'Office address'"
            >
          </div>
        </div>
        
        <!-- Row 2: Guarantee Letter Details and SDT Letter Details side by side (2 columns) -->
        <div class="form-row-two">
          <!-- Guarantee Letter Details Column -->
          <div class="sub-section-card">
            <div class="sub-section-title">{{ props.t('guarantee.guaranteeLetterTitle') || 'Guarantee Letter Details' }}</div>
            <div class="form-field">
              <label>{{ props.t('guarantee.letterNumber') || 'Guarantee Letter Number' }}</label>
              <input 
                type="text" 
                :value="guarantor.guaranteeLetterNo" 
                @input="updateGuarantor(index, 'guaranteeLetterNo', $event.target.value)"
                :placeholder="props.t('guarantee.letterNumberPlaceholder') || 'Letter reference number'"
              >
            </div>
            <div class="form-field">
  <label>{{ props.t('guarantee.letterDate') || 'Guarantee Letter Date' }}</label>
  <EthiopianDateSelector 
    :model-value="guarantor.guaranteeLetterDateEC"
    @update:model-value="(value) => updateGuarantor(index, 'guaranteeLetterDateEC', value)"
  />
</div>
            <div class="form-field">
              <label>{{ props.t('guarantee.letterDocument') || 'Guarantee Letter Document' }}</label>
              <div class="file-upload-row">
                <button type="button" class="btn-small" @click="triggerGuaranteeLetterInput(index)">
                  {{ guarantor.guaranteeLetterFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
                </button>
                <span v-if="guarantor.guaranteeLetterFile" class="file-name">{{ guarantor.guaranteeLetterFile.name }}</span>
                <span v-else class="file-name no-file">{{ props.t('guarantee.noFileSelected') || 'No file selected' }}</span>
              </div>
              <input 
                type="file" 
                :ref="el => setDocumentRef(index, 'guaranteeLetter', el)"
                @change="handleDocumentSelect(index, 'guaranteeLetter', $event)"
                accept=".pdf,.jpg,.jpeg,.png"
                style="display: none"
              />
              <small class="field-hint">{{ props.t('guarantee.guaranteeLetterHint') || 'Select signed guarantee letter' }}</small>
            </div>
          </div>
          
          <!-- SDT Letter Details Column -->
          <div class="sub-section-card">
            <div class="sub-section-title">{{ props.t('guarantee.sdtLetterTitle') || 'SDT Letter Details' }}</div>
            <div class="form-field">
              <label>{{ props.t('guarantee.sdtLetterNumber') || 'SDT Letter Number' }}</label>
              <input 
                type="text" 
                :value="guarantor.sdtLetterNo" 
                @input="updateGuarantor(index, 'sdtLetterNo', $event.target.value)"
                :placeholder="props.t('guarantee.sdtNumberPlaceholder') || 'SDT letter number'"
              >
            </div>
           <div class="form-field">
  <label>{{ props.t('guarantee.sdtLetterDate') || 'SDT Letter Date' }}</label>
  <EthiopianDateSelector 
    :model-value="guarantor.sdtLetterDateEC"
    @update:model-value="(value) => updateGuarantor(index, 'sdtLetterDateEC', value)"
  />
</div>
            <div class="form-field">
              <label>{{ props.t('guarantee.sdtLetterDocument') || 'SDT Letter Document' }}</label>
              <div class="file-upload-row">
                <button type="button" class="btn-small" @click="triggerSdtLetterInput(index)">
                  {{ guarantor.sdtLetterFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
                </button>
                <span v-if="guarantor.sdtLetterFile" class="file-name">{{ guarantor.sdtLetterFile.name }}</span>
                <span v-else class="file-name no-file">{{ props.t('guarantee.noFileSelected') || 'No file selected' }}</span>
              </div>
              <input 
                type="file" 
                :ref="el => setDocumentRef(index, 'sdtLetter', el)"
                @change="handleDocumentSelect(index, 'sdtLetter', $event)"
                accept=".pdf,.jpg,.jpeg,.png"
                style="display: none"
              />
              <small class="field-hint">{{ props.t('guarantee.sdtLetterHint') || 'Select SDT letter document' }}</small>
            </div>
          </div>
        </div>
        
        <!-- Row 3: Confirmation Details and Supporting Documents side by side (2 columns) -->
        <div class="form-row-two">
          <!-- Empty for now - can be populated later -->
        </div>
      </div>
      
      <div v-if="!localGuaranteeInfo || localGuaranteeInfo.length === 0" class="empty-state">
        {{ props.t('guarantee.noGuarantors') || 'No guarantors added. Click "Add Guarantor" to add.' }}
      </div>
      
      <div class="info-note">
        <small>📌 {{ props.t('guarantee.note') || 'Note: Guarantee information is required for employees handling financial responsibilities.' }}</small>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import EthiopianDateSelector from '@/components/shared/EthiopianDateSelector.vue'

const props = defineProps({
  guaranteeInfo: {
    type: Array,
    default: () => []
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:guaranteeInfo', 'file-selected'])

// Local reactive copy of guaranteeInfo
const localGuaranteeInfo = ref([...(props.guaranteeInfo || [])])

// Store refs for file inputs
const documentRefs = ref({})

const setDocumentRef = (index, type, el) => {
  if (!documentRefs.value[index]) documentRefs.value[index] = {}
  if (el) documentRefs.value[index][type] = el
}

// Flag to prevent recursive updates
let isUpdating = false

// Watch for changes from parent - only update if not from local
watch(() => props.guaranteeInfo, (newVal) => {
  if (!isUpdating) {
    localGuaranteeInfo.value = [...(newVal || [])]
  }
}, { deep: true })

const addGuarantor = () => {
  isUpdating = true
  const newGuarantor = {
    guarantorName: '',
    guarantorJob: '',
    guarantorOfficeName: '',
    guarantorOfficeAddress: '',
    guaranteeLetterNo: '',
    guaranteeLetterDateEC: '',    // Changed from guaranteeLetterDate
    sdtLetterNo: '',
    sdtLetterDateEC: '',          // Changed from sdtLetterDate
    confirmedDateEC: '',          // Changed from confirmedDate
    guaranteeLetterFile: null,
    sdtLetterFile: null,
    otherDocumentFile: null
  }
  const newArray = [...localGuaranteeInfo.value, newGuarantor]
  localGuaranteeInfo.value = newArray
  emit('update:guaranteeInfo', newArray)
  isUpdating = false
}

const removeGuarantor = (index) => {
  isUpdating = true
  const newArray = [...localGuaranteeInfo.value]
  newArray.splice(index, 1)
  localGuaranteeInfo.value = newArray
  delete documentRefs.value[index]
  emit('update:guaranteeInfo', newArray)
  isUpdating = false
}

const updateGuarantor = (index, field, value) => {
  isUpdating = true
  const newArray = [...localGuaranteeInfo.value]
  newArray[index][field] = value
  localGuaranteeInfo.value = newArray
  emit('update:guaranteeInfo', newArray)
  isUpdating = false
}

const triggerGuaranteeLetterInput = (index) => {
  if (documentRefs.value[index]?.guaranteeLetter) {
    documentRefs.value[index].guaranteeLetter.click()
  }
}

const triggerSdtLetterInput = (index) => {
  if (documentRefs.value[index]?.sdtLetter) {
    documentRefs.value[index].sdtLetter.click()
  }
}

const triggerOtherDocumentInput = (index) => {
  if (documentRefs.value[index]?.otherDocument) {
    documentRefs.value[index].otherDocument.click()
  }
}

const handleDocumentSelect = (index, type, event) => {
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
    const fieldMap = {
      guaranteeLetter: 'guaranteeLetterFile',
      sdtLetter: 'sdtLetterFile',
      otherDocument: 'otherDocumentFile'
    }
    const newArray = [...localGuaranteeInfo.value]
    newArray[index][fieldMap[type]] = file
    localGuaranteeInfo.value = newArray
    emit('update:guaranteeInfo', newArray)
    emit('file-selected', `${props.t('guarantee.document') || 'Document'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
    isUpdating = false
  }
}
</script>

<style scoped>
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

.optional-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background: #e2e8f0;
  color: #64748b;
  border-radius: 20px;
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

.sub-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #6366f1;
}

.sub-section-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

/* Four column layout */
.form-row-four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

/* Two column layout for side by side sections */
.form-row-two {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.form-field input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.guarantor-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
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
  padding: 8px 16px;
  border-radius: 8px;
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

.empty-state {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 12px;
}

.info-note {
  margin-top: 16px;
  padding: 12px;
  background: #e0f2fe;
  border-radius: 8px;
  color: #0369a1;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .form-row-four {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .form-row-two {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .form-row-four {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-body {
    padding: 16px;
  }
}
</style>