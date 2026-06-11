<template>
  <div class="documents-page">
    <!-- Floating Buttons -->
    <div class="right-float-buttons">
      <button @click="goBack" class="float-btn back-float">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
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
        :is="selectedDocument.component" 
        :employee="selectedEmployee || {}" 
        :formData="documentData" 
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Import document components
import GuaranteeLetter1 from './components/documents/GuaranteeLetter1.vue'

const router = useRouter()

// Document registry
const documents = ref([
  {
    id: 1,
    name: 'የዋስትና ደብዳቤ',
    component: GuaranteeLetter1,
    fields: [
      { key: 'referenceNumber', label: 'የደብዳቤ ቁጥር', placeholder: 'ሰድቲ/ሰሀ/2015/18', value: 'ሰድቲ/ሰሀ/2015/18' },
      { key: 'date', label: 'ቀን', placeholder: '15/01/2018', value: '15/01/2018' },
      { key: 'companyName', label: 'የድርጅት ስም', placeholder: 'አልሚ አሊንዶ ኮንትሪክተርስ', value: 'አልሚ አሊንዶ ኮንትሪክተርስ' },
      { key: 'companyAddress', label: 'የድርጅት አድራሻ', placeholder: 'አዳስ አበባ', value: 'አዳስ አበባ' },
      { key: 'subject', label: 'ጉዳይ', placeholder: 'ትብብርን ይመለከታል', value: 'ትብብርን ይመለከታል' },
      { key: 'signature', label: 'የፈራሚው ስም', placeholder: 'አበበ በቀለ', value: 'አበበ በቀለ' },
      { key: 'position', label: 'የስራ መደብ', placeholder: 'ዋና ስራ አስኪያጅ', value: 'ዋና ስራ አስኪያጅ' }
    ]
  }
])

// State
const selectedDocument = ref(null)
const selectedEmployee = ref(null)
const documentData = ref({})
const showAdjustmentModal = ref(false)
const showEmployeePicker = ref(false)
const employeeSearch = ref('')
const toasts = ref([])

// Demo Employees
const allEmployees = ref([
  { id: 1, fullName: 'ተመስገን አሸቱ', position: 'ዋና ስራ አስኪያጅ', department: 'ማኔጅመንት', idNumber: '356/ሲ/አልማጥርሶ/18', hireDate: '21/06/2018', startDate: '01/01/2015', salary: '25,000' },
  { id: 2, fullName: 'አልማዝ በቀለ', position: 'የሂሳብ ኃላፊ', department: 'ፋይናንስ', idNumber: '789/ሰ/አ/2020', hireDate: '15/03/2019', startDate: '15/03/2019', salary: '20,000' },
  { id: 3, fullName: 'ብርሃኑ አለሙ', position: 'የሰው ሃይል ኃላፊ', department: 'ኤችአር', idNumber: '123/ሰሀ/2021', hireDate: '10/01/2020', startDate: '10/01/2020', salary: '22,000' },
  { id: 4, fullName: 'ማርያም አበበ', position: 'ሶፍትዌር መሐንዲስ', department: 'አይቲ', idNumber: '456/አይ/2022', hireDate: '05/06/2021', startDate: '05/06/2021', salary: '18,000' },
  { id: 5, fullName: 'ካልኪዳን ተሾመ', position: 'ገበያ ኃላፊ', department: 'ማርኬቲንግ', idNumber: '567/ማ/2021', hireDate: '20/08/2020', startDate: '20/08/2020', salary: '19,000' }
])

// Computed
const filteredEmployees = computed(() => {
  if (!employeeSearch.value) return allEmployees.value
  const search = employeeSearch.value.toLowerCase()
  return allEmployees.value.filter(emp => 
    emp.fullName.toLowerCase().includes(search) || emp.idNumber.toLowerCase().includes(search)
  )
})

const documentFields = computed(() => {
  if (!selectedDocument.value) return []
  return selectedDocument.value.fields
})

// Methods
const goBack = () => {
  router.push('/employees')
}

const onDocumentChange = () => {
  if (selectedDocument.value) {
    documentData.value = {}
    selectedDocument.value.fields.forEach(field => {
      documentData.value[field.key] = field.value
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

const saveAdjustments = () => {
  closeAdjustmentModal()
  addToast('ለውጦች ተቀብለዋል', 'success')
}

const printDocument = () => {
  window.print()
  addToast('ወደ አታሚ ተልኳል', 'success')
}

const addToast = (message, type) => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

// Initialize
onMounted(() => {
  selectedDocument.value = documents.value[0]
  onDocumentChange()
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
  background: white;
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
  background: #f1f5f9;
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
  background: white;
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
  padding: 0;
  min-height: 100vh;
  background: white;
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
  .right-float-buttons {
    display: none;
  }
}
</style>