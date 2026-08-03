<!-- ImportModal.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click="$emit('update:show', false)">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>{{ t('import.title') || 'Import Employees' }}</h3>
        <button class="modal-close" @click="$emit('update:show', false)">×</button>
      </div>
      <div class="modal-body">
        
        <!-- Instructions Block -->
        <div class="excel-info">
          <strong>{{ t('import.requiredColumns') || 'Required columns:' }}</strong><br>
          ስም (firstName), የአባት ስም (lastName), ኢሜይል (email), ስልክ (phone), ክፍል መለያ (departmentId), ሹመት መለያ (positionId),
           የሥራ ዓይነት (employmentType), የተቀጠረበት ቀን (hireDate)<br>
          <strong>{{ t('import.optionalColumns') || 'Optional columns:' }}</strong><br>
          የአያት ስም (middleName), <span class="highlight">የእንግሊዝኛ ሙሉ ስም (fullNameEnglish)</span>, <span class="highlight"> የግል ኢሜይል (personalEmail), የትውልድ ቀን (dob), ፆታ (gender),
           የጋብቻ ሁኔታ (maritalStatus), 
          ዜግነት (nationality), ሥራ አስኪያጅ መለያ (managerId), መሰረታዊ ደሞዝ (salary), አድራሻ (address), የስራ ቦታ (workLocation), 
          የቤት አበል (housingAllowance), የሹመት አበል (positionAllowance), የትራንስፖርት አበል (transportAllowance) </span>
        </div>
        
        <!-- Upload Zone -->
        <div class="upload-zone" @click="triggerFileInput">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span v-if="!file">{{ t('import.clickToUpload') || 'Click to upload Excel file' }}</span>
          <span v-else style="color: #10b981; font-weight: bold;">✅ {{ file.name }}</span>
          <small>{{ t('import.supportedFormat') || 'Supported format: .xlsx, .xls' }}</small>
        </div>
        
        <!-- Hidden File Input -->
        <input type="file" ref="fileInput" @change="handleFileSelect" accept=".xlsx,.xls" style="display: none">
        
        <button class="template-link" @click="downloadTemplate">{{ t('import.downloadTemplate') || 'Download template' }}</button>
        
        <!-- Import Results -->
        <div v-if="importResults" class="import-results">
          <div class="result-row success">✅ {{ t('import.successful') || 'Successful' }}: {{ importResults.successCount }}</div>
          <div class="result-row fail">❌ {{ t('import.failed') || 'Failed' }}: {{ importResults.failedCount }}</div>
          <div v-if="importResults.failedCount > 0" class="failed-list">
            <div v-for="(fail, idx) in importResults.failed.slice(0, 3)" :key="idx" class="fail-item">
              {{ fail.data?.email || 'Row' }}: {{ fail.error }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('update:show', false)">{{ t('common.cancel') || 'Cancel' }}</button>
        <button class="btn-primary" @click="importEmployees" :disabled="!file || isImporting">
          {{ isImporting ? (t('common.importing') || 'Importing...') : (t('common.import') || 'Import') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n' 
import * as XLSX from 'xlsx' // ✅ Import true Excel library
import EmployeesService from '@/stores/employee'

const { t } = useI18n()

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['update:show', 'import', 'toast'])

const file = ref(null)
const isImporting = ref(false)
const importResults = ref(null)
const fileInput = ref(null)

const triggerFileInput = () => fileInput.value?.click()

const handleFileSelect = (event) => {
  const selectedFile = event.target.files[0]
  if (selectedFile) {
    file.value = selectedFile
    importResults.value = null 
    emit('toast', `📁 ${t('import.fileSelected') || 'File selected'}: ${selectedFile.name}`, 'success')
  }
}

const importEmployees = async () => {
  if (!file.value) return
  
  isImporting.value = true
  importResults.value = null
  
  try {
    const formData = new FormData()
    formData.append('file', file.value)

    const result = await EmployeesService.importEmployeesFromExcel(formData)
    
    if (result.success && result.data) {
      importResults.value = result.data
      let message = `✅ Import completed: ${result.data.successCount} successful`
      if (result.data.failedCount > 0) {
        message += `, ${result.data.failedCount} failed`
        emit('toast', message, 'warning')
      } else {
        emit('toast', message, 'success')
      }
      
      emit('update:show', false)
      emit('import', result.data)
    } else {
      emit('toast', result.error || 'Import failed', 'error')
    }
  } catch (error) {
    console.error('Import error:', error)
    emit('toast', error.message || 'Failed to import employees', 'error')
  } finally {
    isImporting.value = false
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
  }
}

// ✅ Generate a true .xlsx Excel file with Amharic headers
const downloadTemplate = () => {
  // 1. Define 22 Headers (Including English Full Name)
  const headers = [
    ['ስም', 'የአባት ስም', 'የአያት ስም', 'የእንግሊዝኛ ሙሉ ስም', 'ኢሜይል', 'የግል ኢሜይል', 'ስልክ', 
     'የትውልድ ቀን', 'ፆታ', 'የጋብቻ ሁኔታ', 'ዜግነት', 'ክፍል መለያ', 
     'ሹመት መለያ', 'ሥራ አስኪያጅ መለያ', 'የሥራ ዓይነት', 'የተቀጠረበት ቀን', 
     'መሰረታዊ ደሞዝ', 'የቤት አበል', 'የሹመት አበል', 'የትራንስፖርት አበል', 
     'አድራሻ', 'የሥራ ቦታ']
  ]

  // 2. Sample Data Row with English Full Name filled in
  const sampleData = [
    ['ብሩክ', 'ታደሰ', 'አድማሱ', 'Biruk Tadese Admasu', 'biruk@email.com', '', '+251911000001', 
     '1990-01-01', 'male', 'single', 'ኢትዮጵያዊ', '1', '1', '', 'full-time', 
     '2024-01-01', '15000', '3000', '2250', '1500', 'አዲስ አበባ, ኢትዮጵያ', 'ዋና መሥሪያ ቤት']
  ]

  // 3. Create the Excel Worksheet
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
  ws['!cols'] = headers[0].map(() => ({ wch: 22 }));

  // 4. Create Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  // 5. Generate Buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  // 6. Trigger Download
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employee_import_template.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  width: 600px;
  max-width: 95%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9edf2;
}

.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }

.modal-body { padding: 20px; }
.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e9edf2;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.excel-info {
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #92400e;
}

.excel-info .highlight {
  color: #059669;
  font-weight: 500;
}

.upload-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.upload-zone:hover { border-color: #6366f1; background: #f8fafc; }
.upload-zone svg { width: 40px; height: 40px; color: #94a3b8; margin-bottom: 12px; }
.upload-zone span { display: block; font-size: 14px; color: #475569; margin-bottom: 4px; }
.upload-zone small { font-size: 12px; color: #94a3b8; }

.template-link { background: none; border: none; color: #6366f1; cursor: pointer; font-size: 13px; margin-top: 12px; text-decoration: underline; }

.import-results { margin-top: 15px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
.result-row { font-weight: 600; margin-bottom: 5px; }
.result-row.success { color: #10b981; }
.result-row.fail { color: #ef4444; }
.failed-list { margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
.fail-item { font-size: 12px; color: #ef4444; margin-bottom: 2px; }

.btn-primary, .btn-secondary {
  padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer;
}
.btn-primary { background: #6366f1; border: none; color: white; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: white; border: 1px solid #e2e8f0; color: #475569; }
.btn-secondary:hover { background: #f8fafc; }
</style>