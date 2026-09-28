<template>
  <div class="scanned-documents-card info-card">
    <div class="card-header">
      <div class="card-header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16v16H4V4z" />
          <path d="M8 4v16" />
          <path d="M16 4v16" />
          <path d="M4 8h16" />
          <path d="M4 16h16" />
          <path d="M12 4v16" />
        </svg>
      </div>
      <h3>{{ $t("documents.otherDocuments") || "Other Documents" }}</h3>
      <span class="doc-count-badge">{{ documentCount }} {{ $t("documents.files") || "files" }}</span>
    </div>
    
    <div class="scanned-documents-content">
      <p class="section-description">
        {{ $t("documents.otherDocsHint") || "Upload supporting documents such as guarantee letters, employment letters, and other official documents." }}
      </p>
      
      <!-- Three Document Types Side by Side -->
      <div class="documents-grid">
        <!-- 1. Guarantee Letter -->
        <div class="document-upload-item" :class="{ 'has-file': documentFiles.guaranteeLetter }">
          <div class="doc-icon">📑</div>
          <div class="doc-info">
            <span class="doc-label">{{ $t("guarantee.guaranteeLetter") || "Guarantee Letter" }}</span>
            <span class="doc-status">{{ documentFiles.guaranteeLetter ? $t("common.uploaded") : $t("common.missing") }}</span>
          </div>
          <div class="doc-actions">
            <button 
              type="button" 
              class="upload-btn" 
              @click="triggerFileUpload('guaranteeLetter')"
              :title="documentFiles.guaranteeLetter ? $t('common.edit') : $t('common.upload')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <span v-if="documentFiles.guaranteeLetter" class="file-name">{{ documentFiles.guaranteeLetter.name }}</span>
          </div>
          <input 
            type="file" 
            ref="guaranteeLetterInput" 
            @change="handleFileUpload($event, 'guaranteeLetter')" 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style="display: none"
          />
        </div>

        <!-- 2. Employment Letter -->
        <div class="document-upload-item" :class="{ 'has-file': documentFiles.employmentLetter }">
          <div class="doc-icon">✉️</div>
          <div class="doc-info">
            <span class="doc-label">{{ $t("documents.employmentLetter") || "Employment Letter" }}</span>
            <span class="doc-status">{{ documentFiles.employmentLetter ? $t("common.uploaded") : $t("common.missing") }}</span>
          </div>
          <div class="doc-actions">
            <button 
              type="button" 
              class="upload-btn" 
              @click="triggerFileUpload('employmentLetter')"
              :title="documentFiles.employmentLetter ? $t('common.edit') : $t('common.upload')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <span v-if="documentFiles.employmentLetter" class="file-name">{{ documentFiles.employmentLetter.name }}</span>
          </div>
          <input 
            type="file" 
            ref="employmentLetterInput" 
            @change="handleFileUpload($event, 'employmentLetter')" 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style="display: none"
          />
        </div>

        <!-- 3. Other Document -->
        <div class="document-upload-item" :class="{ 'has-file': documentFiles.other }">
          <div class="doc-icon">📎</div>
          <div class="doc-info">
            <div class="doc-label-group">
              <input 
                type="text" 
                v-model="otherDocumentName" 
                :placeholder="$t('documents.otherDocumentName') || 'Other document name...'" 
                class="doc-name-input"
              />
            </div>
            <span class="doc-status">{{ documentFiles.other ? $t("common.uploaded") : $t("common.missing") }}</span>
          </div>
          <div class="doc-actions">
            <button 
              type="button" 
              class="upload-btn" 
              @click="triggerFileUpload('other')"
              :title="documentFiles.other ? $t('common.edit') : $t('common.upload')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <button 
              v-if="documentFiles.other || otherDocumentName" 
              type="button" 
              class="remove-btn" 
              @click="clearOtherDocument"
              :title="$t('common.remove')"
            >
              ✕
            </button>
            <span v-if="documentFiles.other" class="file-name">{{ documentFiles.other.name }}</span>
          </div>
          <input 
            type="file" 
            ref="otherInput" 
            @change="handleFileUpload($event, 'other')" 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style="display: none"
          />
        </div>
      </div>

      <!-- Add Custom Document Button -->
      <button type="button" class="add-doc-btn" @click="addCustomDocument">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {{ $t("common.add") }} {{ $t("documents.customDocument") || "Custom Document" }}
      </button>

      <!-- Custom Documents List -->
      <div 
        v-for="(doc, index) in customDocuments" 
        :key="`custom-${index}`" 
        class="document-upload-item custom-doc" 
        :class="{ 'has-file': doc.file }"
      >
        <div class="doc-icon">📎</div>
        <div class="doc-info">
          <input 
            type="text" 
            v-model="doc.name" 
            :placeholder="$t('documents.documentName') || 'Document name...'" 
            class="doc-name-input"
          />
          <span class="doc-status">{{ doc.file ? $t("common.uploaded") : $t("common.missing") }}</span>
        </div>
        <div class="doc-actions">
          <button 
            type="button" 
            class="upload-btn" 
            @click="triggerCustomFileUpload(index)"
            :title="doc.file ? $t('common.edit') : $t('common.upload')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
          <button 
            type="button" 
            class="remove-btn" 
            @click="removeCustomDocument(index)"
            :title="$t('common.remove')"
          >
            ✕
          </button>
          <span v-if="doc.file" class="file-name">{{ doc.file.name }}</span>
        </div>
        <input 
          :ref="el => setCustomInputRef(el, index)"
          type="file" 
          @change="handleCustomFileUpload($event, index)" 
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style="display: none"
        />
      </div>
      
      <!-- File Size Warning -->
      <div class="file-info-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>{{ $t("documents.fileInfo") || "Accepted formats: PDF, JPG, PNG, DOC, DOCX. Max size: 5MB per file." }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
  t: {
    type: Function,
    required: true
  }
})

const emit = defineEmits([
  'update:documents',
  'file-selected'
])

// Document files state - Only 3 types
const documentFiles = reactive({
  guaranteeLetter: null,
  employmentLetter: null,
  other: null
})

const otherDocumentName = ref('')
const customDocuments = ref([])
const customInputRefs = ref({})

// File input refs
const guaranteeLetterInput = ref(null)
const employmentLetterInput = ref(null)
const otherInput = ref(null)

// Computed
const documentCount = computed(() => {
  let count = 0
  Object.values(documentFiles).forEach(file => {
    if (file) count++
  })
  customDocuments.value.forEach(doc => {
    if (doc.file) count++
  })
  return count
})

// Methods
const triggerFileUpload = (type) => {
  const inputMap = {
    guaranteeLetter: guaranteeLetterInput,
    employmentLetter: employmentLetterInput,
    other: otherInput
  }
  
  const input = inputMap[type]
  if (input && input.value) {
    input.value.click()
  }
}

const handleFileUpload = (event, type) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  if (!validateFile(file)) {
    event.target.value = ''
    return
  }
  
  documentFiles[type] = file
  
  emit('file-selected', `${file.name} uploaded successfully`, 'success')
  emit('update:documents', getAllDocuments())
  
  event.target.value = ''
}

const clearOtherDocument = () => {
  documentFiles.other = null
  otherDocumentName.value = ''
  emit('update:documents', getAllDocuments())
}

const addCustomDocument = () => {
  customDocuments.value.push({ 
    id: Date.now(), 
    name: '', 
    file: null 
  })
}

const removeCustomDocument = (index) => {
  customDocuments.value.splice(index, 1)
  emit('update:documents', getAllDocuments())
}

const setCustomInputRef = (el, index) => {
  if (el) {
    customInputRefs.value[index] = el
  }
}

const triggerCustomFileUpload = (index) => {
  const input = customInputRefs.value[index]
  if (input) {
    input.click()
  }
}

const handleCustomFileUpload = (event, index) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  if (!validateFile(file)) {
    event.target.value = ''
    return
  }
  
  customDocuments.value[index].file = file
  
  emit('file-selected', `${file.name} uploaded successfully`, 'success')
  emit('update:documents', getAllDocuments())
  
  event.target.value = ''
}

const validateFile = (file) => {
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    emit('file-selected', 'File size must be less than 5MB', 'error')
    return false
  }
  
  // Validate file type
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!validTypes.includes(file.type) && 
      !file.name.endsWith('.pdf') && 
      !file.name.endsWith('.doc') && 
      !file.name.endsWith('.docx') &&
      !file.name.endsWith('.png') &&
      !file.name.endsWith('.jpg') &&
      !file.name.endsWith('.jpeg')) {
    emit('file-selected', 'Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX.', 'error')
    return false
  }
  
  return true
}

const getAllDocuments = () => {
  const docs = []
  
  // Pre-defined documents
  const docTypes = {
    guaranteeLetter: 'Guarantee Letter',
    employmentLetter: 'Employment Letter',
    other: otherDocumentName.value || 'Other Document'
  }
  
  Object.entries(documentFiles).forEach(([key, file]) => {
    if (file) {
      docs.push({
        type: key,
        name: docTypes[key] || key,
        file: file
      })
    }
  })
  
  // Custom documents
  customDocuments.value.forEach(doc => {
    if (doc.file) {
      docs.push({
        type: 'custom',
        name: doc.name || 'Custom Document',
        file: doc.file
      })
    }
  })
  
  return docs
}

// Expose for parent component
defineExpose({
  getAllDocuments,
  documentFiles,
  customDocuments
})
</script>

<style scoped>
.scanned-documents-card {
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

.doc-count-badge {
  margin-left: auto;
  font-size: 11px;
  background: #e2e8f0;
  padding: 2px 10px;
  border-radius: 20px;
  color: #475569;
}

.scanned-documents-content {
  padding: 20px 24px;
}

.section-description {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

/* Grid layout for 3 documents side by side */
.documents-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.document-upload-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #eef2ff;
  transition: all 0.2s;
  text-align: center;
}

.document-upload-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.document-upload-item.has-file {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.document-upload-item.has-file:hover {
  background: #dcfce7;
}

.document-upload-item.custom-doc {
  border-style: dashed;
}

.doc-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.doc-label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.doc-label-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.doc-name-input {
  width: 100%;
  padding: 4px 8px;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background: transparent;
  font-size: 12px;
  color: #1e293b;
  text-align: center;
}

.doc-name-input:focus {
  outline: none;
  border-bottom-color: #6366f1;
}

.doc-name-input::placeholder {
  color: #94a3b8;
  font-size: 11px;
}

.doc-status {
  font-size: 11px;
  color: #94a3b8;
}

.document-upload-item.has-file .doc-status {
  color: #10b981;
}

.doc-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  flex-wrap: wrap;
}

.upload-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #eef2ff;
  color: #6366f1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.upload-btn:hover {
  background: #e0e7ff;
  transform: scale(1.05);
}

.upload-btn svg {
  width: 16px;
  height: 16px;
}

.document-upload-item.has-file .upload-btn {
  background: #d1fae5;
  color: #059669;
}

.document-upload-item.has-file .upload-btn:hover {
  background: #a7f3d0;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
  padding: 0;
}

.remove-btn:hover {
  background: #fecaca;
  transform: scale(1.1);
}

.file-name {
  font-size: 10px;
  color: #64748b;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-doc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 10px;
  color: #6366f1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.add-doc-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.add-doc-btn svg {
  width: 16px;
  height: 16px;
}

.file-info-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2ff;
  color: #94a3b8;
  font-size: 12px;
}

.file-info-note svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
}

@media (max-width: 900px) {
  .documents-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .documents-grid {
    grid-template-columns: 1fr;
  }
  
  .document-upload-item {
    flex-direction: row;
    text-align: left;
    padding: 12px 14px;
  }
  
  .doc-info {
    align-items: flex-start;
  }
  
  .doc-label-group {
    align-items: flex-start;
  }
  
  .doc-name-input {
    text-align: left;
  }
  
  .doc-actions {
    justify-content: flex-end;
    width: auto;
  }
  
  .file-name {
    max-width: 60px;
  }
}
</style>