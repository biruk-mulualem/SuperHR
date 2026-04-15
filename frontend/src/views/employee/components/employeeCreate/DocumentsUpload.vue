<template>
  <div class="documents-section">
    <div class="section-title">
      <h2>Employee Documents (Optional)</h2>
      <p>Select documents to upload - they will be uploaded automatically after employee creation</p>
    </div>

    <div class="documents-grid-full">
      <!-- ID Card Upload -->
      <div class="document-card">
        <div class="document-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <h3>ID Card</h3>
        </div>
        <div class="document-card-body">
          <div class="file-info" v-if="documents.id.file">
            <span>{{ documents.id.file.name }}</span>
            <span class="file-status pending">📎</span>
          </div>
          <div class="file-input-wrapper">
            <input type="file" ref="idFileInput" @change="selectIdCard" accept=".pdf,.jpg,.png">
            <button class="btn-secondary" @click="triggerIdCardInput" type="button">Choose File</button>
          </div>
          <div class="file-note" v-if="!documents.id.file">
            <small>No file selected</small>
          </div>
        </div>
      </div>

      <!-- CV/Resume Upload -->
      <div class="document-card">
        <div class="document-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3>CV / Resume</h3>
        </div>
        <div class="document-card-body">
          <div class="file-info" v-if="documents.cv.file">
            <span>{{ documents.cv.file.name }}</span>
            <span class="file-status pending">📎</span>
          </div>
          <div class="file-input-wrapper">
            <input type="file" ref="cvFileInput" @change="selectCv" accept=".pdf,.doc,.docx">
            <button class="btn-secondary" @click="triggerCvInput" type="button">Choose File</button>
          </div>
          <div class="file-note" v-if="!documents.cv.file">
            <small>No file selected</small>
          </div>
        </div>
      </div>

      <!-- Degree/Certificate Upload -->
      <div class="document-card">
        <div class="document-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10-5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <h3>Degree/Certificate</h3>
        </div>
        <div class="document-card-body">
          <div class="file-info" v-if="documents.degree.file">
            <span>{{ documents.degree.file.name }}</span>
            <span class="file-status pending">📎</span>
          </div>
          <div class="file-input-wrapper">
            <input type="file" ref="degreeFileInput" @change="selectDegree" accept=".pdf,.jpg,.png">
            <button class="btn-secondary" @click="triggerDegreeInput" type="button">Choose File</button>
          </div>
          <div class="file-note" v-if="!documents.degree.file">
            <small>No file selected</small>
          </div>
        </div>
      </div>

      <!-- Guarantee Letters Upload -->
      <div class="document-card">
        <div class="document-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <h3>Guarantee Letters</h3>
        </div>
        <div class="document-card-body">
          <div class="guarantee-list-mini">
            <div v-for="(file, index) in documents.guarantees" :key="index" class="guarantee-item-mini">
              <span>{{ file.name }}</span>
              <button class="remove-btn" @click="removeGuarantee(index)" type="button">×</button>
            </div>
            <div v-if="documents.guarantees.length === 0" class="empty-guarantee-mini">
              <small>No files selected</small>
            </div>
          </div>
          <div class="file-input-wrapper">
            <input type="file" ref="guaranteeFileInput" @change="selectGuarantees" accept=".pdf,.jpg,.png,.doc,.docx" multiple>
            <button class="btn-secondary" @click="triggerGuaranteeInput" type="button">Choose Files</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  documents: Object
})

const emit = defineEmits(['update:documents', 'file-selected'])

const idFileInput = ref(null)
const cvFileInput = ref(null)
const degreeFileInput = ref(null)
const guaranteeFileInput = ref(null)

const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png']

const validateFileType = (file, allowedTypes, typeName) => {
  if (!allowedTypes.includes(file.type)) {
    emit('file-selected', `Invalid file type for ${typeName}. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`, 'error')
    return false
  }
  return true
}

const validateFileSize = (file, maxSizeMB, typeName) => {
  if (file.size > maxSizeMB * 1024 * 1024) {
    emit('file-selected', `${typeName} size must be less than ${maxSizeMB}MB`, 'error')
    return false
  }
  return true
}

// ID Card
const triggerIdCardInput = () => {
  idFileInput.value?.click()
}

const selectIdCard = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!validateFileType(file, ALLOWED_DOC_TYPES, 'ID Card')) {
      event.target.value = ''
      return
    }
    if (!validateFileSize(file, 5, 'ID Card')) {
      event.target.value = ''
      return
    }
    const newDocuments = { ...props.documents, id: { file } }
    emit('update:documents', newDocuments)
    emit('file-selected', `ID Card "${file.name}" selected`, 'success')
  }
}

// CV
const triggerCvInput = () => {
  cvFileInput.value?.click()
}

const selectCv = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!validateFileType(file, ALLOWED_DOC_TYPES, 'CV')) {
      event.target.value = ''
      return
    }
    if (!validateFileSize(file, 5, 'CV')) {
      event.target.value = ''
      return
    }
    const newDocuments = { ...props.documents, cv: { file } }
    emit('update:documents', newDocuments)
    emit('file-selected', `CV "${file.name}" selected`, 'success')
  }
}

// Degree
const triggerDegreeInput = () => {
  degreeFileInput.value?.click()
}

const selectDegree = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!validateFileType(file, ALLOWED_DOC_TYPES, 'Degree')) {
      event.target.value = ''
      return
    }
    if (!validateFileSize(file, 5, 'Degree')) {
      event.target.value = ''
      return
    }
    const newDocuments = { ...props.documents, degree: { file } }
    emit('update:documents', newDocuments)
    emit('file-selected', `Degree "${file.name}" selected`, 'success')
  }
}

// Guarantee Letters
const triggerGuaranteeInput = () => {
  guaranteeFileInput.value?.click()
}

const selectGuarantees = (event) => {
  const files = Array.from(event.target.files)
  let validFiles = 0
  
  const newGuarantees = [...props.documents.guarantees]
  files.forEach(file => {
    if (validateFileType(file, ALLOWED_DOC_TYPES, 'Guarantee letter') && 
        validateFileSize(file, 5, 'Guarantee letter')) {
      newGuarantees.push({ file, name: file.name })
      validFiles++
    }
  })
  
  if (validFiles > 0) {
    const newDocuments = { ...props.documents, guarantees: newGuarantees }
    emit('update:documents', newDocuments)
    emit('file-selected', `${validFiles} guarantee letter(s) selected`, 'success')
  }
  
  if (guaranteeFileInput.value) {
    guaranteeFileInput.value.value = ''
  }
}

const removeGuarantee = (index) => {
  const newGuarantees = [...props.documents.guarantees]
  const removed = newGuarantees.splice(index, 1)[0]
  const newDocuments = { ...props.documents, guarantees: newGuarantees }
  emit('update:documents', newDocuments)
  emit('file-selected', `${removed.name} removed`, 'info')
}
</script>

<style scoped>
.documents-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid #e2e8f0;
}

.section-title {
  margin-bottom: 24px;
}

.section-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.section-title p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.documents-grid-full {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.document-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e9edf2;
  overflow: hidden;
  transition: all 0.3s ease;
}

.document-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.document-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #fafcfc 0%, #ffffff 100%);
  border-bottom: 1px solid #e9edf2;
}

.document-card-header svg {
  width: 20px;
  height: 20px;
  color: #6366f1;
}

.document-card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.document-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
}

.file-input-wrapper {
  display: flex;
  gap: 8px;
}

.file-input-wrapper input {
  display: none;
}

.file-note {
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

.file-status.pending {
  background: #94a3b8;
  color: white;
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-secondary {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.guarantee-list-mini {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #e9edf2;
  border-radius: 8px;
}

.guarantee-item-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e9edf2;
  font-size: 12px;
}

.guarantee-item-mini:last-child {
  border-bottom: none;
}

.empty-guarantee-mini {
  text-align: center;
  padding: 12px;
  color: #94a3b8;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.remove-btn:hover {
  background: #fee2e2;
}

@media (max-width: 768px) {
  .documents-grid-full {
    grid-template-columns: 1fr;
  }
}
</style>