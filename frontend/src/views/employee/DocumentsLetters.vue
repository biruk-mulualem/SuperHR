<template>
  <div class="documents-page">
    <!-- Floating Buttons -->
    <div class="right-float-buttons">
      <button @click="goBack" class="float-btn back-float">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <button @click="openCreateModal" class="float-btn create-float" title="አዲስ ደብዳቤ ፍጠር (Create)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button @click="openEditModal" class="float-btn edit-template-float" :disabled="!selectedDocument || selectedDocument.isStatic" title="ደብዳቤውን ማስተካከያ (Edit Template)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button @click="openAdjustmentModal" class="float-btn adjust-float" :disabled="!selectedDocument">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      <button @click="printDocument" class="float-btn print-float" :disabled="!selectedDocument">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2z" />
        </svg>
      </button>
    </div>

    <!-- Document Display -->
    <div v-if="!selectedDocument" class="empty-preview">
      <div class="empty-icon">📄</div>
      <h3>እባክዎ ሰነድ ይምረጡ</h3>
      <p>በቀኝ በኩል ባለው ማስተካከያ ቁልፍ ሰነድ ይምረጡ</p>
    </div>
    <div v-else class="document-container">
      <component 
        :is="selectedDocument.isStatic ? customComponents[selectedDocument.component] : DynamicDocument"
        :template="selectedDocument" 
        :employee="selectedEmployee || {}" 
        :formData="documentData" 
        @save="handleInlineSave"
      />
    </div>

    <!-- Adjustment Modal -->
    <div v-if="showAdjustmentModal" class="modal-overlay" @click.self="closeAdjustmentModal">
      <div class="modal-container modal-adjustment">
        <div class="modal-header">
          <h2>ማስተካከያ - {{ selectedDocument?.name }}</h2>
          <button @click="closeAdjustmentModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-section">
            <label class="modal-label">ሰነድ ይምረጡ</label>
            <select v-model="selectedDocument" @change="onDocumentChange" class="modal-select">
              <option v-for="doc in documents" :key="doc.id" :value="doc">
                {{ doc.name }}
              </option>
            </select>
          </div>

          <div class="modal-section">
            <label class="modal-label">ሰራተኛ ይምረጡ</label>
            <div class="employee-select-wrapper">
              <div v-if="selectedEmployee" class="selected-employee-modal" @click="showEmployeePicker = true">
                <div class="emp-info-modal">
                  <div class="emp-name-modal">{{ selectedEmployee.fullName }}</div>
                  <div class="emp-detail-modal">{{ selectedEmployee.position }} • {{ selectedEmployee.idNumber }}</div>
                </div>
                <button @click.stop="clearEmployee" class="remove-emp-modal">×</button>
              </div>
              <button v-else @click="showEmployeePicker = true" class="select-emp-modal-btn">
                + ሰራተኛ ምረጥ
              </button>
            </div>
          </div>

          <div class="modal-divider"></div>

          <!-- Dynamic Fields based on document type -->
          <div v-for="field in documentFields" :key="field.key" class="modal-field">
            <label>{{ field.label }}</label>
            <input v-model="documentData[field.key]" type="text" :placeholder="field.placeholder" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAdjustmentModal" class="cancel-btn">ይቅር</button>
          <button @click="saveAdjustments" class="save-btn">አስቀምጥ</button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Template Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-container modal-large">
        <div class="modal-header">
          <h2>{{ newTemplate.id ? 'ደብዳቤ ማስተካከያ (Edit Template)' : 'አዲስ ደብዳቤ መፍጠሪያ (Create Template)' }}</h2>
          <button @click="closeCreateModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-section">
            <label class="modal-label">የደብዳቤው ስም (Template Name)</label>
            <input v-model="newTemplate.name" type="text" class="modal-search" placeholder="ለምሳሌ፡ የልምድ ማስረጃ..." />
          </div>

          <div class="modal-section branding-options">
            <label class="modal-label">ምልክቶች (Branding Options)</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newTemplate.meta.includeHeader" />
                ራስጌ (Header)
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="newTemplate.meta.includeFooter" />
                ግርጌ (Footer)
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="newTemplate.meta.includeBackground" />
                ጀርባ (Background)
              </label>
            </div>
          </div>
          
          <div class="modal-section">
            <label class="modal-label">ይዘት (Content - HTML & Variables)</label>
            <p class="help-text" v-pre>ተለዋዋጮችን ለመጠቀም {{ employee.fullName }} ወይም {{ formData.date }} ይጠቀሙ</p>
            <div class="editor-container">
              <QuillEditor theme="snow" v-model:content="newTemplate.content" contentType="html" placeholder="የደብዳቤው ይዘት እዚህ ይፃፉ..." />
            </div>
          </div>

          <div class="modal-divider"></div>
          
          <div class="modal-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <label class="modal-label" style="margin: 0;">ተጨማሪ መረጃዎች (Form Fields)</label>
              <button @click="addField" class="add-field-btn">+ አዲስ መረጃ</button>
            </div>
            <p class="help-text" style="margin-bottom: 10px;" v-pre>ቁልፍ ስምን (Key) ካስቀመጡ በኋላ <strong>{{ formData.KEY }}</strong> ወደ ምስጢር ቁምፊ ይለጥፉ — ከታቹ ያለውን chip ይጫኑ ለመቅዳት</p>
            
            <div v-for="(field, index) in newTemplate.fields" :key="index" class="field-row">
              <div class="field-row-inputs">
                <input v-model="field.key" placeholder="Key (e.g. date)" class="field-input" />
                <input v-model="field.label" placeholder="Label (e.g. ቀን)" class="field-input" />
                <input v-model="field.placeholder" placeholder="Default value" class="field-input" />
                <button @click="removeField(index)" class="remove-btn">×</button>
              </div>
              <div v-if="field.key" class="field-variable-tag" @click="copyVariable(fieldVar(field.key))" title="Click to copy">
                <span class="tag-icon">📋</span>
                <code>{{ fieldVar(field.key) }}</code>
                <span class="tag-copy-hint">click to copy</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCreateModal" class="cancel-btn">ይቅር</button>
          <button @click="saveTemplate" class="save-btn" :disabled="!newTemplate.name || !newTemplate.content">አስቀምጥ</button>
        </div>
      </div>
    </div>

    <!-- Employee Picker Modal -->
    <div v-if="showEmployeePicker" class="modal-overlay" @click.self="showEmployeePicker = false">
      <div class="modal-container">
        <div class="modal-header">
          <h2>ሰራተኛ ይምረጡ</h2>
          <button @click="showEmployeePicker = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <input v-model="employeeSearch" placeholder="በስም ወይም መታወቂያ ይፈልጉ..." class="modal-search" />
          <div class="employees-list">
            <div v-for="emp in filteredEmployees" :key="emp.id" @click="selectEmployee(emp)" class="employee-item">
              <div class="emp-avatar">{{ emp.fullName.charAt(0) }}</div>
              <div class="emp-info">
                <div class="emp-name">{{ emp.fullName }}</div>
                <div class="emp-dept">{{ emp.department }} • {{ emp.position }}</div>
                <div class="emp-id">መታወቂያ: {{ emp.idNumber }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>
66102822650
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// Import document components
import DynamicDocument from './components/documents/DynamicDocument.vue'
import Tureta from './components/documents/tureta.vue'

import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import '@vueup/vue-quill/dist/vue-quill.bubble.css'

// Import Services
import letterTemplateService from '@/stores/letterTemplateService'
import employeesService from '@/stores/employee'

const router = useRouter()

// Custom Components Map
const customComponents = {
  'Tureta': Tureta,
}

// Letter Templates State
const dbDocuments = ref([])
const loadingTemplates = ref(false)

// Complex / Complex Static Templates
const staticDocuments = [
  {
    id: 'static-tureta',
    name: 'የሠራተኞች ቅጽ (Tureta registration Form)',
    component: 'Tureta',
    isStatic: true,
    fields: [
      { key: 'referenceNumber', label: 'የደብዳቤ ቁጥር', placeholder: '001/2025' }
    ],
    meta: { includeHeader: false, includeFooter: false, includeBackground: false }
  }
]

// Combined list of database + static templates
const documents = computed(() => {
  return [...staticDocuments, ...dbDocuments.value]
})

// State
const selectedDocument = ref(null)
const selectedEmployee = ref(null)
const documentData = ref({})
const showAdjustmentModal = ref(false)
const showCreateModal = ref(false)
const showEmployeePicker = ref(false)
const employeeSearch = ref('')
const toasts = ref([])
const loadingEmployees = ref(false)

const newTemplate = ref({
  id: null,
  name: '',
  content: '',
  fields: [],
  meta: {
    includeHeader: true,
    includeFooter: true,
    includeBackground: false
  }
})

// Employees
const allEmployees = ref([])

// Fetch Templates from Backend
const fetchTemplates = async () => {
  loadingTemplates.value = true
  try {
    const response = await letterTemplateService.getAllLetterTemplates()
    if (response.success) {
      dbDocuments.value = response.data
      
      // Update selectedDocument reference
      if (selectedDocument.value) {
        const fresh = documents.value.find(d => d.id === selectedDocument.value.id)
        if (fresh) {
          selectedDocument.value = fresh
          onDocumentChange()
        }
      } else if (documents.value.length > 0) {
        selectedDocument.value = documents.value[0]
        onDocumentChange()
      }
    } else {
      addToast(response.error, 'error')
    }
  } catch (err) {
    addToast('Error loading templates', 'error')
  } finally {
    loadingTemplates.value = false
  }
}

// Fetch Employees from Backend
const fetchEmployees = async (search = '') => {
  loadingEmployees.value = true
  const response = await employeesService.getEmployees({ search, limit: 100 })
  if (response.success) {
    allEmployees.value = response.data.map(emp => ({
      ...emp,
      fullName: emp.fullName || `${emp.firstName} ${emp.middleName ? emp.middleName + ' ' : ''}${emp.lastName}`,
      idNumber: emp.employeeCode || emp.employeeId,
      position: emp.Position?.title || emp.position,
      department: emp.Department?.name || emp.departmentName,
      startDate: emp.hireDate,
      salary: emp.basicSalary
    }))
  }
  loadingEmployees.value = false
}

watch(employeeSearch, (newSearch) => {
  fetchEmployees(newSearch)
})

const filteredEmployees = computed(() => allEmployees.value)

const documentFields = computed(() => {
  if (!selectedDocument.value) return []
  return selectedDocument.value.fields || []
})

// Methods
const goBack = () => {
  router.push('/employees')
}

const openCreateModal = () => {
  newTemplate.value = {
    id: null,
    name: '',
    content: '',
    fields: [],
    meta: {
      includeHeader: true,
      includeFooter: true,
      includeBackground: false
    }
  }
  showCreateModal.value = true
}

const openEditModal = () => {
  if (!selectedDocument.value || selectedDocument.value.isStatic) return
  newTemplate.value = {
    id: selectedDocument.value.id,
    name: selectedDocument.value.name,
    content: selectedDocument.value.content,
    fields: (selectedDocument.value.fields || []).map(f => ({ ...f })),
    meta: {
      includeHeader: selectedDocument.value.meta?.includeHeader ?? true,
      includeFooter: selectedDocument.value.meta?.includeFooter ?? true,
      includeBackground: selectedDocument.value.meta?.includeBackground ?? false
    }
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const addField = () => {
  newTemplate.value.fields.push({ key: '', label: '', placeholder: '', value: '' })
}

const removeField = (index) => {
  newTemplate.value.fields.splice(index, 1)
}

const saveTemplate = async () => {
  if (!newTemplate.value.name || !newTemplate.value.content) return
  
  const filteredFields = (newTemplate.value.fields || [])
    .filter(f => f.key && f.key.trim() !== '')
    .map(f => ({
      key: f.key.trim(),
      label: f.label || f.key,
      placeholder: f.placeholder || '',
      value: f.value || ''
    }))

  const templateToSave = {
    name: newTemplate.value.name,
    content: newTemplate.value.content,
    fields: filteredFields,
    meta: newTemplate.value.meta
  }
  
  let response
  if (newTemplate.value.id) {
    response = await letterTemplateService.updateLetterTemplate(newTemplate.value.id, templateToSave)
  } else {
    response = await letterTemplateService.createLetterTemplate(templateToSave)
  }

  if (response.success) {
    addToast(response.message || 'ተቀምጧል', 'success')
    const savedId = response.data?.id || newTemplate.value.id
    
    await fetchTemplates()
    
    if (savedId) {
      const saved = documents.value.find(d => d.id === savedId)
      if (saved) {
        selectedDocument.value = saved
        onDocumentChange()
      }
    }
    
    closeCreateModal()
  } else {
    addToast(response.error, 'error')
  }
}

const onDocumentChange = () => {
  if (selectedDocument.value) {
    const oldData = { ...documentData.value }
    documentData.value = {}
    const fields = selectedDocument.value.fields || []
    fields.forEach(field => {
      documentData.value[field.key] = oldData[field.key] || field.value || field.placeholder || ''
    })
    addToast(`${selectedDocument.value.name} ተመርጧል`, 'success')
  }
}

const selectEmployee = (employee) => {
  selectedEmployee.value = employee
  showEmployeePicker.value = false
  employeeSearch.value = ''
  addToast(`${employee.fullName} ተመርጧል`, 'success')
}

const clearEmployee = () => {
  selectedEmployee.value = null
  addToast('ሰራተኛ ተወግዷል', 'info')
}

const openAdjustmentModal = () => {
  showAdjustmentModal.value = true
}

const closeAdjustmentModal = () => {
  showAdjustmentModal.value = false
}

const handleInlineSave = async (updatedContent) => {
  if (!selectedDocument.value || selectedDocument.value.isStatic) return
  
  const response = await letterTemplateService.updateLetterTemplate(selectedDocument.value.id, {
    content: updatedContent,
    meta: selectedDocument.value.meta,
    fields: selectedDocument.value.fields
  })

  if (response.success) {
    selectedDocument.value.content = updatedContent
    addToast('ደብዳቤው በቋሚነት ተቀምጧል', 'success')
    await fetchTemplates()
  } else {
    addToast(response.error, 'error')
  }
}

const saveAdjustments = () => {
  closeAdjustmentModal()
  addToast('ሰነዱ ተዘምኗል', 'success')
}

const printDocument = () => {
  window.print()
}

const fieldVar = (key) => `{{ formData.${key} }}`

const copyVariable = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    addToast(`ተገልብጧል (Copied): ${text}`, 'success')
  }).catch(() => {
    addToast('መገልበጥ አልተሳካም', 'info')
  })
}

const addToast = (message, type) => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

onMounted(() => {
  fetchTemplates()
  fetchEmployees()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.documents-page {
  width: 100%;
  min-height: 100vh;
  background: #f1f5f9;
}

/* Floating Buttons */
.right-float-buttons {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 200;
}

.float-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.float-btn svg {
  width: 24px;
  height: 24px;
}

.back-float {
  background: white;
  color: #1e293b;
}

.back-float:hover {
  background: #e2e8f0;
  transform: scale(1.05);
}

.create-float {
  background: #10b981;
  color: white;
}

.create-float:hover {
  background: #059669;
  transform: scale(1.05);
}

.edit-template-float {
  background: #3b82f6;
  color: white;
}

.edit-template-float:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.05);
}

.adjust-float {
  background: #f59e0b;
  color: white;
}

.adjust-float:hover:not(:disabled) {
  background: #d97706;
  transform: scale(1.05);
}

.print-float {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
}

.print-float:hover:not(:disabled) {
  transform: scale(1.05);
}

.float-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty Preview */
.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #94a3b8;
  text-align: center;
  background: #f1f5f9;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty-preview h3 {
  font-size: 20px;
  color: #64748b;
  margin-bottom: 8px;
}

.empty-preview p {
  font-size: 14px;
}

/* Document Container */
.document-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 0 60px 0;
  min-height: 100vh;
  background: #f1f5f9;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-large {
  max-width: 750px;
}

.modal-adjustment {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
}

.close-btn:hover {
  color: #ef4444;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-section {
  margin-bottom: 20px;
}

.modal-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.modal-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.employee-select-wrapper {
  width: 100%;
}

.selected-employee-modal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  cursor: pointer;
}

.emp-info-modal {
  flex: 1;
}

.emp-name-modal {
  font-weight: 600;
  color: #166534;
  font-size: 14px;
}

.emp-detail-modal {
  font-size: 12px;
  color: #15803d;
}

.remove-emp-modal {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fee2e2;
  border: none;
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
}

.select-emp-modal-btn {
  width: 100%;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #6a11cb;
  font-size: 14px;
  cursor: pointer;
}

.select-emp-modal-btn:hover {
  background: #f3e8ff;
  border-color: #6a11cb;
}

.modal-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 20px 0;
}

.modal-field {
  margin-bottom: 16px;
}

.modal-field label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.modal-field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}

.cancel-btn, .save-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
}

.cancel-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-search {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.employees-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.employee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
}

.employee-item:hover {
  background: #f8fafc;
  border-color: #6a11cb;
}

.emp-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.emp-info {
  flex: 1;
}

.emp-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.emp-dept {
  font-size: 12px;
  color: #64748b;
}

.emp-id {
  font-size: 11px;
  color: #94a3b8;
}

/* Template Builder Specific */
.editor-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}
.editor-container :deep(.ql-editor) {
  min-height: 250px;
  font-family: 'Times New Roman', 'Ethiopic', 'Nyala', serif;
  font-size: 14px;
}
.editor-container :deep(.ql-toolbar) {
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #e2e8f0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background: #f8fafc;
}
.editor-container :deep(.ql-container) {
  border: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.modal-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  resize: vertical;
}

.help-text {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 8px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.field-row-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}

.field-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
}

.add-field-btn {
  background: #f1f5f9;
  color: #6a11cb;
  border: 1px dashed #cbd5e1;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.add-field-btn:hover {
  background: #e2e8f0;
}

.remove-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.field-variable-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #c4b5fd;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
}

.field-variable-tag:hover {
  background: #f3e8ff;
  border-color: #7c3aed;
}

.field-variable-tag code {
  font-family: monospace;
  font-size: 12px;
  color: #7c3aed;
  font-weight: bold;
}

.tag-copy-hint {
  font-size: 10px;
  color: #6b7280;
}

/* Toast */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 10px 16px;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #10b981;
}

.toast.info {
  background: #3b82f6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Scrollbar */
.modal-body::-webkit-scrollbar,
.employees-list::-webkit-scrollbar {
  width: 5px;
}

.modal-body::-webkit-scrollbar-track,
.employees-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.modal-body::-webkit-scrollbar-thumb,
.employees-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* Branding Options */
.branding-options {
  background: #f8fafc;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.checkbox-group {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1e293b;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .right-float-buttons {
    right: 16px;
    gap: 8px;
  }
  
  .float-btn {
    width: 44px;
    height: 44px;
  }
  
  .float-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .modal-container {
    max-width: 95%;
  }
}

@media print {
  /* Hide UI elements and App Navigation */
  .right-float-buttons,
  .toast-container,
  .modal-overlay,
  .empty-preview,
  :global(.header),
  :global(.sidebar),
  :global(.footer) {
    display: none !important;
  }

  /* Reset layout for natural flow */
  :global(body), :global(#app), :global(.app-layout), :global(.layout-body), :global(.main-container) {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    display: block !important;
    position: static !important;
  }

  :global(.content-wrapper) {
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    position: static !important;
  }

  .documents-page {
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    overflow: visible !important;
    position: static !important;
  }

  .document-container {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    position: static !important;
  }
}
</style>
