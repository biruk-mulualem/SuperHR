<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>Upload Document</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="upload-zone" @click="triggerFileInput">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Click to upload file</span>
          <small>PDF, JPG, PNG (Max 5MB)</small>
        </div>
        <input type="file" ref="fileInput" @change="handleFileSelect" accept=".pdf,.jpg,.jpeg,.png" style="display: none">
        
        <div v-if="selectedFile" class="selected-file">
          <span>Selected: {{ selectedFile.name }}</span>
          <button @click="selectedFile = null" class="remove-file">×</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="uploadFile" :disabled="!selectedFile || isUploading">
          {{ isUploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EmployeesService from '@/stores/employee'

const props = defineProps({
  context: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'uploaded'])

const fileInput = ref(null)
const selectedFile = ref(null)
const isUploading = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

const uploadFile = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  
  try {
    // Determine document type based on context
    let documentType = 'certificate'
    
    if (props.context.type === 'basic_info') {
      documentType = 'national_id_card'
    } else if (props.context.type === 'spouse') {
      documentType = 'marriage_certificate'
    } else if (props.context.type === 'child') {
      documentType = 'birth_certificate'
    } else if (props.context.type === 'education') {
      documentType = 'education_certificate'
    } else if (props.context.type === 'training') {
      documentType = 'training_certificate'
    } else if (props.context.type === 'work') {
      documentType = 'experience_letter'
    } else if (props.context.type === 'parent') {
      documentType = 'parent_support_document'
    } else if (props.context.type === 'nationality') {
      documentType = 'naturalization_certificate'
    }
    
    // Upload to existing employee (you'll need employeeId)
    // For new employee, store temp and upload after creation
    const formData = new FormData()
    formData.append('document', selectedFile.value)
    formData.append('documentType', documentType)
    
    // This assumes you have an endpoint for temporary uploads
    // Or you can return the file info and save documentId after employee is created
    const result = await EmployeesService.uploadDocumentTemp(formData)
    
    if (result.success) {
      emit('uploaded', {
        documentId: result.data.documentId,
        fileUrl: result.data.fileUrl
      })
    } else {
      throw new Error(result.error)
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    alert('Failed to upload file')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 450px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9edf2;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e9edf2;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.upload-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.upload-zone svg {
  width: 40px;
  height: 40px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.upload-zone span {
  display: block;
  font-size: 14px;
  color: #475569;
  margin-bottom: 4px;
}

.upload-zone small {
  font-size: 12px;
  color: #94a3b8;
}

.selected-file {
  margin-top: 16px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.remove-file {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #ef4444;
}

.btn-primary,
.btn-secondary {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: #6366f1;
  border: none;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #f8fafc;
}
</style>