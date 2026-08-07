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
          ስም (firstName), የአባት ስም (lastName), ኢሜይል (email), ስልክ (phone), ክፍል መለያ (departmentId),
          የሥራ ዓይነት (employmentType), የተቀጠረበት ቀን (hireDate)<br>
          
          <strong>{{ t('import.optionalColumns') || 'Optional columns:' }}</strong><br>
          የአያት ስም (middleName), የእንግሊዝኛ ሙሉ ስም (fullNameEnglish), የግል ኢሜይል (personalEmail), 
          <span class="highlight">የትውልድ ቀን (dateOfBirthEC)</span>, ፆታ (gender),
          የጋብቻ ሁኔታ (maritalStatus), ዜግነት (nationality), 
          <span class="highlight">ሹመት መለያ (positionId)</span>, መሰረታዊ ደሞዝ (salary), አድራሻ (address), የስራ ቦታ (workLocation), 
          የቤት አበል (housingAllowance), የሹመት አበል (positionAllowance), የትራንስፖርት አበል (transportAllowance)<br>
          
          <strong style="color: #dc2626;">⚠️ Important:</strong> 
          All dates must be in <strong>Ethiopian Calendar format (DD/MM/YYYY)</strong>, e.g., 25/05/2001<br>
          <strong style="color: #2563eb;">📌 Tip:</strong> 
          Use the <strong>"References"</strong> sheet in the template to find the correct IDs for departments, positions, and employment types.
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
import * as XLSX from 'xlsx'
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

// ✅ Generate Excel file with data and reference sheets
const downloadTemplate = async () => {
  try {
    // ========== FETCH REFERENCE DATA ==========
    // Fetch departments
    const deptResponse = await EmployeesService.getDepartments()
    const departments = deptResponse?.data?.data || deptResponse?.data || []
    
    // Fetch positions
    const posResponse = await EmployeesService.getPositions()
    const positions = posResponse?.data?.data || posResponse?.data || []
    
    // Employment types
    const employmentTypes = [
      { id: 'full-time', nameAm: 'ሙሉ ጊዜ', nameEn: 'Full Time' },
      { id: 'part-time', nameAm: 'የትርፍ ጊዜ', nameEn: 'Part Time' },
      { id: 'contract', nameAm: 'ውል', nameEn: 'Contract' },
      { id: 'intern', nameAm: 'ተለማማጅ', nameEn: 'Intern' }
    ]

    // ========== SHEET 1: EMPLOYEES (Data Entry) ==========
    // Headers - includes positionId but NOT managerId
    const headers = [
      ['ስም', 'የአባት ስም', 'የአያት ስም', 'የእንግሊዝኛ ሙሉ ስም', 'ኢሜይል', 'የግል ኢሜይል', 'ስልክ', 
       'የትውልድ ቀን', 'ፆታ', 'የጋብቻ ሁኔታ', 'ዜግነት', 'ክፍል መለያ', 
       'ሹመት መለያ', 'የሥራ ዓይነት', 'የተቀጠረበት ቀን', 
       'መሰረታዊ ደሞዝ', 'የቤት አበል', 'የሹመት አበል', 'የትራንስፖርት አበል', 
       'አድራሻ', 'የሥራ ቦታ']
    ]

    // Sample data with ETHIOPIAN dates (DD/MM/YYYY)
    const sampleData = [
      ['ብሩክ', 'ታደሰ', 'አድማሱ', 'Biruk Tadese Admasu', 'biruk@email.com', '', '+251911000001', 
       '15/02/1992', 'male', 'single', 'ኢትዮጵያዊ', 
       departments.length > 0 ? departments[0]?.departmentId || 1 : 1, 
       positions.length > 0 ? positions[0]?.positionId || 1 : 1, 
       'full-time', 
       '25/05/2001', '15000', '3000', '2250', '1500', 'አዲስ አበባ, ኢትዮጵያ', 'ዋና መሥሪያ ቤት'],
      
      ['ሰላም', 'አለሙ', 'ተስፋዬ', 'Selam Alemu Tesfaye', 'selam@email.com', '', '+251911000002',
       '23/03/1988', 'female', 'married', 'ኢትዮጵያዊ', 
       departments.length > 1 ? departments[1]?.departmentId || 2 : 2, 
       positions.length > 1 ? positions[1]?.positionId || 2 : 2, 
       'contract',
       '08/09/2001', '20000', '4000', '3000', '2000', 'ባህር ዳር, ኢትዮጵያ', 'ቅርንጫፍ ቢሮ']
    ]

    // Create Data Entry worksheet
    const wsData = XLSX.utils.aoa_to_sheet([...headers, ...sampleData])
    wsData['!cols'] = headers[0].map(() => ({ wch: 22 }))

    // ========== SHEET 2: REFERENCES ==========
    const refData = []

    // --- Departments Section ---
    refData.push(['=== ዲፓርትመንቶች / DEPARTMENTS ==='])
    refData.push([])
    refData.push(['መለያ (ID)', 'ስም (Amharic)', 'ስም (English)', 'ኮድ (Code)'])
    if (departments.length > 0) {
      departments.forEach(d => {
        refData.push([
          d.departmentId || d.id || '',
          d.nameAm || d.name_am || d.name || '',
          d.name || '',
          d.code || ''
        ])
      })
    } else {
      refData.push(['1', 'ሰብአዊ ሀብት', 'Human Resources', 'HR'])
      refData.push(['2', 'የአይቲ', 'IT', 'IT'])
      refData.push(['3', 'ፋይናንስ', 'Finance', 'FIN'])
    }
    refData.push([])
    refData.push([])

    // --- Positions Section ---
    refData.push(['=== ሹመቶች / POSITIONS ==='])
    refData.push([])
    refData.push(['መለያ (ID)', 'ሹመት (Amharic)', 'ሹመት (English)', 'ደረጃ (Level)'])
    if (positions.length > 0) {
      positions.forEach(p => {
        refData.push([
          p.positionId || p.id || '',
          p.titleAm || p.title_am || p.title || '',
          p.title || '',
          p.level || ''
        ])
      })
    } else {
      refData.push(['1', 'ሥራ አስኪያጅ', 'Manager', 'Senior'])
      refData.push(['2', 'ባለሙያ', 'Specialist', 'Mid'])
      refData.push(['3', 'ጁኒየር', 'Junior', 'Junior'])
    }
    refData.push([])
    refData.push([])

    // --- Employment Types Section ---
    refData.push(['=== የሥራ ዓይነቶች / EMPLOYMENT TYPES ==='])
    refData.push([])
    refData.push(['መለያ (ID)', 'ዓይነት (Amharic)', 'ዓይነት (English)'])
    employmentTypes.forEach(e => {
      refData.push([e.id, e.nameAm, e.nameEn])
    })
    refData.push([])
    refData.push([])

    // --- Gender Section ---
    refData.push(['=== ፆታ / GENDER ==='])
    refData.push([])
    refData.push(['መለያ (ID)', 'ፆታ (Amharic)', 'ፆታ (English)'])
    refData.push(['male', 'ወንድ', 'Male'])
    refData.push(['female', 'ሴት', 'Female'])
    refData.push(['other', 'ሌላ', 'Other'])
    refData.push([])
    refData.push([])

    // --- Marital Status Section ---
    refData.push(['=== የጋብቻ ሁኔታ / MARITAL STATUS ==='])
    refData.push([])
    refData.push(['መለያ (ID)', 'ሁኔታ (Amharic)', 'ሁኔታ (English)'])
    refData.push(['single', 'ያላገባ', 'Single'])
    refData.push(['married', 'ያገባ', 'Married'])
    refData.push(['divorced', 'የተፋታ', 'Divorced'])
    refData.push(['widowed', 'የባለትዳር ሞት', 'Widowed'])

    // Create References worksheet
    const wsRef = XLSX.utils.aoa_to_sheet(refData)
    wsRef['!cols'] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 30 },
      { wch: 15 }
    ]

    // ========== CREATE WORKBOOK ==========
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsData, 'Employees')
    XLSX.utils.book_append_sheet(wb, wsRef, 'References')

    // ========== GENERATE AND DOWNLOAD ==========
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_import_template.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error generating template:', error)
    emit('toast', 'Failed to generate template. Please try again.', 'error')
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
  width: 650px;
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

.template-link { 
  background: none; 
  border: none; 
  color: #6366f1; 
  cursor: pointer; 
  font-size: 13px; 
  margin-top: 12px; 
  text-decoration: underline; 
}

.import-results { 
  margin-top: 15px; 
  padding: 12px; 
  background: #f8fafc; 
  border-radius: 8px; 
  border: 1px solid #e2e8f0; 
}

.result-row { 
  font-weight: 600; 
  margin-bottom: 5px; 
}

.result-row.success { color: #10b981; }
.result-row.fail { color: #ef4444; }

.failed-list { 
  margin-top: 8px; 
  padding-top: 8px; 
  border-top: 1px solid #e2e8f0; 
}

.fail-item { 
  font-size: 12px; 
  color: #ef4444; 
  margin-bottom: 2px; 
}

.btn-primary, .btn-secondary {
  padding: 8px 20px; 
  border-radius: 10px; 
  font-size: 13px; 
  font-weight: 500; 
  cursor: pointer;
}

.btn-primary { 
  background: #6366f1; 
  border: none; 
  color: white; 
}

.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary { 
  background: white; 
  border: 1px solid #e2e8f0; 
  color: #475569; 
}

.btn-secondary:hover { background: #f8fafc; }
</style>