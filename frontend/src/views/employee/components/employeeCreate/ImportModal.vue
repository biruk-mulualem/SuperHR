<!-- ImportModal.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click="$emit('update:show', false)">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>{{ $t('import.title') || 'Import Employees' }}</h3>
        <button class="modal-close" @click="$emit('update:show', false)">×</button>
      </div>
      <div class="modal-body">
        <div class="csv-info">
          <strong>{{ $t('import.requiredColumns') || 'Required columns:' }}</strong> firstName, lastName, email, phone, departmentId, positionId, employmentType, hireDate<br>
          <strong>{{ $t('import.optionalColumns') || 'Optional columns:' }}</strong> middleName, personalEmail, dob, gender, maritalStatus, nationality, managerId, salary, address, workLocation, <span class="highlight">housingAllowance, positionAllowance, transportAllowance</span>
        </div>
        <div class="upload-zone" @click="triggerCsvInput">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{{ $t('import.clickToUpload') || 'Click to upload CSV file' }}</span>
          <small>{{ $t('import.supportedFormat') || 'Supported format: .csv' }}</small>
        </div>
        <input type="file" ref="csvFileInput" @change="handleCsvUpload" accept=".csv" style="display: none">
        <button class="template-link" @click="downloadTemplate">{{ $t('import.downloadTemplate') || 'Download template' }}</button>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('update:show', false)">{{ $t('common.cancel') || 'Cancel' }}</button>
        <button class="btn-primary" @click="importEmployees" :disabled="!csvData.length || isImporting">
          {{ isImporting ? ($t('common.importing') || 'Importing...') : ($t('common.import') || 'Import') }} ({{ csvData.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Papa from 'papaparse'
import EmployeesService from '@/stores/employee'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['update:show', 'import', 'toast'])

const csvData = ref([])
const isImporting = ref(false)
const csvFileInput = ref(null)

const triggerCsvInput = () => {
  csvFileInput.value?.click()
}

const handleCsvUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validRows = results.data.filter(row => {
          return row.firstName && row.lastName && row.email && row.phone && 
                 row.departmentId && row.positionId && row.employmentType && row.hireDate
        })
        
        if (validRows.length === 0) {
          emit('toast', 'CSV file must contain required columns', 'error')
          return
        }
        
        csvData.value = validRows
        emit('toast', `${validRows.length} valid records found in CSV`, 'success')
      },
      error: (error) => {
        emit('toast', 'Error parsing CSV file', 'error')
        console.error('CSV Parse Error:', error)
      }
    })
  }
}

const importEmployees = async () => {
  if (!csvData.value.length) return
  
  isImporting.value = true
  
  try {
    const employeesToImport = csvData.value.map(row => ({
      firstName: row.firstName?.trim(),
      lastName: row.lastName?.trim(),
      middleName: row.middleName?.trim() || null,
      email: row.email?.trim(),
      personalEmail: row.personalEmail?.trim() || null,
      phone: row.phone?.trim(),
      dob: row.dob || null,
      // Fix for enum fields: convert empty strings to null
      gender: row.gender === '' ? null : (row.gender || null),
      maritalStatus: row.maritalStatus === '' ? null : (row.maritalStatus || null),
      nationality: row.nationality === '' ? null : (row.nationality || null),
      departmentId: parseInt(row.departmentId),
      positionId: parseInt(row.positionId),
      managerId: row.managerId ? parseInt(row.managerId) : null,
      employmentType: row.employmentType,
      hireDate: row.hireDate,
      salary: row.salary ? parseFloat(row.salary) : 0,
      // ========== ADDED ALLOWANCE FIELDS ==========
      housingAllowance: row.housingAllowance ? parseFloat(row.housingAllowance) : 0,
      positionAllowance: row.positionAllowance ? parseFloat(row.positionAllowance) : 0,
      transportAllowance: row.transportAllowance ? parseFloat(row.transportAllowance) : 0,
      // ===========================================
      address: row.address?.trim() || null,
      workLocation: row.workLocation?.trim() || null
    }))
    
    const result = await EmployeesService.importEmployees(employeesToImport)
    
    if (result.success && result.data) {
      const importResults = result.data
      let message = `✅ Import completed: ${importResults.successCount} successful`
      if (importResults.failedCount > 0) {
        message += `, ${importResults.failedCount} failed`
        emit('toast', message, 'warning')
        importResults.failed.slice(0, 3).forEach(fail => {
          emit('toast', `Failed: ${fail.data.email} - ${fail.error}`, 'error')
        })
      } else {
        emit('toast', message, 'success')
      }
      
      emit('update:show', false)
      emit('import', importResults)
    } else {
      emit('toast', result.error || 'Import failed', 'error')
    }
  } catch (error) {
    console.error('Import error:', error)
    emit('toast', 'Failed to import employees', 'error')
  } finally {
    isImporting.value = false
    csvData.value = []
  }
}

const downloadTemplate = () => {
  const template = [
    'firstName,lastName,middleName,email,personalEmail,phone,dob,gender,maritalStatus,nationality,departmentId,positionId,managerId,employmentType,hireDate,salary,housingAllowance,positionAllowance,transportAllowance,address,workLocation',
    'John,Doe,,john.doe@company.com,,+251911000001,1990-01-01,male,single,Ethiopian,1,1,,full-time,2024-01-01,15000,3000,2250,1500,"Addis Ababa, Ethiopia","Head Office"'
  ].join('\n')
  
  const blob = new Blob([template], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'employee_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
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
  width: 550px;
  max-width: 90%;
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

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
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

.csv-info {
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #92400e;
}

.csv-info .highlight {
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

.template-link {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 13px;
  margin-top: 12px;
  text-decoration: underline;
}

.btn-primary,
.btn-secondary {
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

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
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