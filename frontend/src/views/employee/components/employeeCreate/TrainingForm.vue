<template>
  <div class="form-card">
    <div class="card-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
      <h3>{{ props.t('training.title') || 'Training History' }}</h3>
      <span class="optional-badge">{{ props.t('common.optional') || 'Optional' }}</span>
    </div>
    <div class="card-body">
      <div class="section-title">
        {{ props.t('training.sectionTitle') || 'Training & Certifications' }}
        <button type="button" class="btn-add" @click="addTraining">+ {{ props.t('common.add') || 'Add Training' }}</button>
      </div>
      
      <div v-for="(item, idx) in localTraining" :key="idx" class="training-card">
        <div class="item-header">
          <span>{{ props.t('training.training') || 'Training' }} {{ idx + 1 }}</span>
          <button type="button" class="btn-remove" @click="removeTraining(idx)">×</button>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label>{{ props.t('training.trainingName') || 'Training/Course Name' }}</label>
            <input 
              type="text" 
              :value="item.trainingName" 
              @input="updateTraining(idx, 'trainingName', $event.target.value)"
              :placeholder="props.t('training.trainingNamePlaceholder') || 'Training name'"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('training.institution') || 'Institution/Provider' }}</label>
            <input 
              type="text" 
              :value="item.institutionName" 
              @input="updateTraining(idx, 'institutionName', $event.target.value)"
              :placeholder="props.t('training.institutionPlaceholder') || 'Institution name'"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label>{{ props.t('training.institutionAddress') || 'Institution Address' }}</label>
            <input 
              type="text" 
              :value="item.institutionAddress" 
              @input="updateTraining(idx, 'institutionAddress', $event.target.value)"
              :placeholder="props.t('address.address') || 'Address'"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label>{{ props.t('training.startDate') || 'Start Date' }}</label>
            <input 
              type="date" 
              :value="item.startDate" 
              @input="updateTraining(idx, 'startDate', $event.target.value)"
            >
          </div>
          <div class="form-field">
            <label>{{ props.t('training.endDate') || 'End Date' }}</label>
            <input 
              type="date" 
              :value="item.endDate" 
              @input="updateTraining(idx, 'endDate', $event.target.value)"
            >
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-field">
            <label>{{ props.t('training.certificate') || 'Certificate' }}</label>
            <div class="file-upload-row">
              <button type="button" class="btn-small" @click="triggerCertificateInput(idx)">
                {{ item.certificateFile ? (props.t('common.change') || 'Change File') : (props.t('common.select') || 'Select File') }}
              </button>
              <span v-if="item.certificateFile" class="file-name">{{ item.certificateFile.name }}</span>
              <span v-else class="file-name no-file">{{ props.t('training.noFileSelected') || 'No file selected' }}</span>
            </div>
            <input 
              type="file" 
              :ref="el => setFileInputRef(idx, el)"
              @change="handleCertificateSelect(idx, $event)"
              accept=".pdf,.jpg,.jpeg,.png"
              style="display: none"
            />
            <small class="field-hint">{{ props.t('training.certificateHint') || 'Select certificate (will be uploaded when you save the form)' }}</small>
          </div>
        </div>
      </div>
      
      <div v-if="!localTraining || localTraining.length === 0" class="empty-state">
        {{ props.t('training.emptyState') || 'No training records added. Click "Add Training" to add.' }}
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  training: {
    type: Array,
    default: () => []
  },
  t: { type: Function, default: (key) => key }  // ← ADD THIS
})

const emit = defineEmits(['update:training', 'file-selected'])

const localTraining = ref([...(props.training || [])])
const fileInputs = ref({})

let isUpdating = false

watch(() => props.training, (newVal) => {
  if (!isUpdating) {
    localTraining.value = [...(newVal || [])]
  }
}, { deep: true })

const setFileInputRef = (index, el) => {
  if (el) {
    fileInputs.value[index] = el
  }
}

const addTraining = () => {
  isUpdating = true
  const newTraining = [...localTraining.value, {
    trainingName: '',
    institutionName: '',
    institutionAddress: '',
    startDate: '',
    endDate: '',
    certificateFile: null
  }]
  localTraining.value = newTraining
  emit('update:training', newTraining)
  isUpdating = false
}

const updateTraining = (index, field, value) => {
  isUpdating = true
  const newTraining = [...localTraining.value]
  newTraining[index][field] = value
  localTraining.value = newTraining
  emit('update:training', newTraining)
  isUpdating = false
}

const removeTraining = (index) => {
  isUpdating = true
  const newTraining = [...localTraining.value]
  newTraining.splice(index, 1)
  localTraining.value = newTraining
  emit('update:training', newTraining)
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
    const newTraining = [...localTraining.value]
    newTraining[index].certificateFile = file
    localTraining.value = newTraining
    emit('update:training', newTraining)
    emit('file-selected', `${props.t('training.certificate') || 'Certificate'} "${file.name}" ${props.t('messages.selected') || 'selected - ready to save'}`, 'success')
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

.training-card {
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