<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 10v6M2 10l10-5 10-5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
      <h3>{{ t('education.title') || 'Education Background' }}</h3>
    </div>
    <div class="card-body">
      <div class="section-title">
        {{ t('education.history') || 'Education History' }}
        <button type="button" class="btn-add" @click="addEducation">+ {{ t('common.add') || 'Add Education' }}</button>
      </div>
      
      <div v-for="(item, idx) in localEducation" :key="idx" class="education-card">
        <div class="item-header">
          <span>{{ t('education.education') || 'Education' }} {{ idx + 1 }}</span>
          <button type="button" class="btn-remove" @click="removeEducation(idx)">×</button>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label>{{ t('education.level') || 'Education Level' }}</label>
            <select :value="item.level" @change="updateEducation(idx, 'level', $event.target.value)">
              <option value="">{{ t('common.select') || 'Select level' }}</option>
              <option value="primary">{{ t('education.primary') || 'Primary School' }}</option>
              <option value="secondary">{{ t('education.secondary') || 'Secondary School' }}</option>
              <option value="diploma">{{ t('education.diploma') || 'Diploma' }}</option>
              <option value="bachelor">{{ t('education.bachelor') || "Bachelor's Degree" }}</option>
              <option value="master">{{ t('education.master') || "Master's Degree" }}</option>
              <option value="phd">{{ t('education.phd') || 'PhD/Doctorate' }}</option>
              <option value="certificate">{{ t('education.certificate') || 'Certificate' }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ t('education.institutionName') || 'Institution Name' }}</label>
            <input 
              type="text" 
              :value="item.institutionName" 
              @input="updateEducation(idx, 'institutionName', $event.target.value)"
              :placeholder="t('education.institutionPlaceholder') || 'Institution name'"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label>{{ t('education.institutionAddress') || 'Institution Address' }}</label>
            <input 
              type="text" 
              :value="item.institutionAddress" 
              @input="updateEducation(idx, 'institutionAddress', $event.target.value)"
              :placeholder="t('address.address') || 'Address'"
            >
          </div>
          <div class="form-field">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                :checked="item.isCurrent" 
                @change="updateEducation(idx, 'isCurrent', $event.target.checked)"
              >
              {{ t('education.currentlyStudying') || 'Currently Studying' }}
            </label>
          </div>
        </div>
        
      <div class="form-row">
  <div class="form-field">
    <label>{{ t('education.startDate') || 'Start Date' }}</label>
    <EthiopianDateSelector 
      :model-value="item.startDateEC"
      @update:model-value="(value) => updateEducation(idx, 'startDateEC', value)"
    />
  </div>
  <div class="form-field">
    <label>{{ t('education.endDate') || 'End Date' }}</label>
    <EthiopianDateSelector 
      :model-value="item.endDateEC"
      @update:model-value="(value) => updateEducation(idx, 'endDateEC', value)"
      :disabled="item.isCurrent"
    />
  </div>
</div>
        
        <div class="form-row">
          <div class="form-field">
            <label>{{ t('education.certificate') || 'Certificate' }}</label>
            <div class="file-upload-row">
              <button type="button" class="btn-small" @click="triggerCertificateInput(idx)">
                {{ item.certificateFile ? (t('common.change') || 'Change File') : (t('common.select') || 'Select File') }}
              </button>
              <span v-if="item.certificateFile" class="file-name">{{ item.certificateFile.name }}</span>
              <span v-else class="file-name no-file">{{ t('education.noFileSelected') || 'No file selected' }}</span>
            </div>
            <input 
              type="file" 
              :ref="el => setFileInputRef(idx, el)"
              @change="handleCertificateSelect(idx, $event)"
              accept=".pdf,.jpg,.jpeg,.png"
              style="display: none"
            />
            <small class="field-hint">{{ t('education.certificateHint') || 'Select certificate (will be uploaded when you save the form)' }}</small>
          </div>
        </div>
      </div>
      
      <div v-if="!localEducation || localEducation.length === 0" class="empty-state">
        {{ t('education.emptyState') || 'No education records added. Click "Add Education" to add.' }}
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import EthiopianDateSelector from '@/components/shared/EthiopianDateSelector.vue'

const props = defineProps({
  education: {
    type: Array,
    default: () => []
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:education', 'file-selected'])

const localEducation = ref([...(props.education || [])])
const fileInputs = ref({})

let isUpdating = false

watch(() => props.education, (newVal) => {
  if (!isUpdating) {
    localEducation.value = [...(newVal || [])]
  }
}, { deep: true })

const setFileInputRef = (index, el) => {
  if (el) {
    fileInputs.value[index] = el
  }
}

const addEducation = () => {
  isUpdating = true
  const newEducation = [...localEducation.value, {
    level: '',
    institutionName: '',
    institutionAddress: '',
    startDateEC: '',    // Changed from startDate
    endDateEC: '',      // Changed from endDate
    isCurrent: false,
    certificateFile: null
  }]
  localEducation.value = newEducation
  emit('update:education', newEducation)
  isUpdating = false
}

const updateEducation = (index, field, value) => {
  isUpdating = true
  const newEducation = [...localEducation.value]
  newEducation[index][field] = value
  localEducation.value = newEducation
  emit('update:education', newEducation)
  isUpdating = false
}

const removeEducation = (index) => {
  isUpdating = true
  const newEducation = [...localEducation.value]
  newEducation.splice(index, 1)
  localEducation.value = newEducation
  emit('update:education', newEducation)
  isUpdating = false
}

const triggerCertificateInput = (index) => {
  if (fileInputs.value[index]) {
    fileInputs.value[index].click()
  }
}

const handleCertificateSelect = (index, event) => {
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
    const newEducation = [...localEducation.value]
    newEducation[index].certificateFile = file
    localEducation.value = newEducation
    emit('update:education', newEducation)
    emit('file-selected', `${props.t('education.certificate')} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
.form-field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field input:focus,
.form-field select:focus {
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

.education-card {
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>