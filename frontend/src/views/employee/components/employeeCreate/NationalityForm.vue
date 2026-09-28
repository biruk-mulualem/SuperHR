<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 21h18M3 10h18M5 6h14M8 3l-2 3h12l-2-3" />
      </svg>
      <h3>{{ props.t('nationality.title') || 'Nationality Information' }}</h3>
      <span class="optional-badge">{{ props.t('common.optional') || 'Optional' }}</span>
    </div>
    <div class="card-body">
      
      <div class="form-row">
        <div class="form-field">
          <label>{{ props.t('nationality.acquired') || 'How was nationality acquired?' }}</label>
          <select :value="nationalityAcquisition.type" @change="updateType($event.target.value)">
            <option value="by_birth">{{ props.t('nationality.byBirth') || 'By Birth' }}</option>
            <option value="by_law">{{ props.t('nationality.byLaw') || 'By Law (Naturalization)' }}</option>
            <option value="ethiopian_birth">{{ props.t('nationality.ethiopianBirth') || 'Ethiopian by Birth' }}</option>
          </select>
        </div>
      </div>
      
      <div v-if="nationalityAcquisition.type === 'by_law'" class="form-row">
        <div class="form-field">
          <label>{{ props.t('nationality.naturalizationCert') || 'Naturalization Certificate' }}</label>
          <div class="file-upload-row">
            <button type="button" class="btn-small" @click="triggerFileInput">
              {{ nationalityAcquisition.documentFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
            </button>
            <span v-if="nationalityAcquisition.documentFile" class="file-name">{{ nationalityAcquisition.documentFile.name }}</span>
            <span v-else class="file-name no-file">{{ props.t('nationality.noFileSelected') || 'No file selected' }}</span>
          </div>
          <input type="file" ref="fileInput" @change="handleFileSelect" accept=".pdf,.jpg,.jpeg,.png" style="display: none" />
          <small class="field-hint">{{ props.t('nationality.certificateHint') || 'Select certificate (will be uploaded when you save the form)' }}</small>
        </div>
      </div>
      
      <div v-if="nationalityAcquisition.type === 'by_law' && !nationalityAcquisition.documentFile && !nationalityAcquisition.documentUrl" class="warning-message">
        ⚠️ {{ props.t('nationality.certificateWarning') || 'Please select the naturalization certificate' }}
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  nationalityAcquisition: {
    type: Object,
    default: () => ({ type: 'by_birth', documentId: null, documentUrl: null })
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:nationalityAcquisition', 'file-selected'])

const fileInput = ref(null)

const updateType = (value) => {
  emit('update:nationalityAcquisition', { ...props.nationalityAcquisition, type: value })
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
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
    
    emit('update:nationalityAcquisition', { 
      ...props.nationalityAcquisition, 
      documentFile: file,
      documentUrl: null 
    })
    emit('file-selected', `${props.t('nationality.certificate') || 'Certificate'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
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

.form-field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}

.form-field select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
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

.warning-message {
  margin-top: 12px;
  padding: 10px;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>