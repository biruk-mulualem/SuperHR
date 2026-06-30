<template>
  <div class="top-actions no-print" v-if="auditItems.length > 0 || !loading">
    <button class="btn-back-top" @click="goBack">← Back to Audit</button>
    <button class="btn-print-top" @click="printPage">🖨️ Print Audit Report</button>
  </div>

  <div class="print-page" v-if="auditItems.length > 0">
    <header class="form-header">
      <h1 class="motto">WE TRUST IN GOD!!!</h1>
      <h1 class="motto">እግዚአብሔር ይባረክ!!!</h1>
      <h2 class="company-name">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>
      
      <h3 class="form-subtitle-title">AUDIT & RECONCILIATION REPORT: {{ currentStoreName }}</h3>
      
      <div class="date-row">
        <span style="margin-left: auto;"><strong>PRINTED DATE:-</strong> {{ formatCurrentDate() }}</span>
      </div>
    </header>

    <table class="items-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 4%;">No</th>
          <th rowspan="2" style="width: 12%;">Item Code</th>
          <th rowspan="2" style="width: 25%;">Product Name</th>
          <th rowspan="2" style="width: 10%;">Category</th>
          <th rowspan="2" style="width: 8%;">UOM</th>
          <th :colspan="activeGroups.length || 1" style="width: 26%;">Groups</th>
          <th rowspan="2" style="width: 15%;">Status</th>
        </tr>
        <tr>
          <th v-if="activeGroups.length === 0">-</th>
          <th v-for="group in activeGroups" :key="group.id">{{ group.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in auditItems" :key="item.itemId || index" :class="getRowClass(item.status)">
          <td>{{ index + 1 }}</td>
          <td><strong>{{ item.code || '-' }}</strong></td>
          <td class="text-left">
            {{ item.itemName || item.commonName || '-' }}
            <div v-if="item.commonName && item.itemName && item.commonName !== item.itemName" style="font-size: 0.9em; color: #555;">({{ item.commonName }})</div>
          </td>
          <td>{{ item.category || '-' }}</td>
          <td>{{ item.uom || item.uomCode || '-' }}</td>
          <td v-if="activeGroups.length === 0">-</td>
          <td v-for="group in activeGroups" :key="group.id" :class="getCellClass(item, group.id)">
            {{ getGroupValue(item, group.id) }}
          </td>
          <td>{{ item.status || '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading audit data...</p>
  </div>

  <div v-else class="error-state">
    <div class="error-icon">❌</div>
    <h2>No Audit Records Found</h2>
    <p>We couldn't find any audit data for this selection.</p>
    <button class="btn-back" @click="goBack">← Back to Audit</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface AuditItem {
  productId: number
  itemId: number
  code: string
  commonName: string
  itemName: string
  standardName: string
  category: string
  uom: string
  uomCode: string
  groupBalances: Record<string, number>
  status: string
  statusClass: string
}

interface AuditGroup {
  id: number
  groupId: number
  name: string
  code: string
}

const router = useRouter()
const loading = ref(true)
const auditItems = ref<AuditItem[]>([])
const activeGroups = ref<AuditGroup[]>([])
const currentStoreName = ref('Unknown Store')

const loadAuditData = async () => {
  try {
    loading.value = true
    
    const storedData = localStorage.getItem('printAuditData')
    const storedGroups = localStorage.getItem('printAuditGroups')
    const storedStore = localStorage.getItem('printAuditStoreName')
    
    if (storedData) auditItems.value = JSON.parse(storedData)
    if (storedGroups) activeGroups.value = JSON.parse(storedGroups)
    if (storedStore) currentStoreName.value = storedStore
  } catch (error) {
    console.error('Failed to load audit records:', error)
  } finally {
    loading.value = false
  }
}

const formatCurrentDate = (): string => {
  const date = new Date()
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const getGroupValue = (item: AuditItem, groupId: number) => {
  const value = item.groupBalances?.[groupId]
  return value !== undefined && value !== null ? value : '-'
}

const getRowClass = (status: string) => {
  if (status === 'Conflict') return 'conflict-row'
  if (status === 'Outlier') return 'outlier-row'
  if (status === 'Matched') return 'matched-row'
  return ''
}

const getCellClass = (item: AuditItem, groupId: number) => {
  const value = getGroupValue(item, groupId)
  const values = Object.values(item.groupBalances || {})
  
  if (values.length === 0) return 'normal-cell'
  
  const uniqueValues = [...new Set(values)]
  
  if (uniqueValues.length === 1) {
    return 'normal-cell'
  } else if (uniqueValues.length === 2) {
    const majorityValue = values.find(v => values.filter(x => x === v).length > 1)
    if (value === majorityValue) {
      return 'normal-cell'
    } else {
      return 'outlier-cell'
    }
  } else {
    return 'conflict-cell'
  }
}

const goBack = (): void => {
  router.push({ name: 'audit' })
}

const printPage = (): void => { window.print() }

onMounted(async () => {
  await loadAuditData()
})
</script>

<style scoped>
.print-page {
  font-family: 'Arial', sans-serif;
  color: #000;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
}

.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1000px;
  margin: 10px auto 20px auto;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.btn-back-top, .btn-back {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.btn-print-top {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.form-header {
  margin-bottom: 5px;
}

.motto {
  text-align: center;
  font-family: 'Georgia', serif;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0 0 4px 0;
}

.company-name {
  text-align: center;
  font-size: 21px;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.form-subtitle-title {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 0 0 15px 0;
  color: #1a1a1a;
}

.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 12px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 35px;
  font-size: 12px;
  table-layout: fixed;
}

.items-table th, 
.items-table td {
  border: 1px solid #7f7f7f;
  padding: 6px 4px;
  text-align: center;
  height: 24px;
  word-wrap: break-word;
}

.items-table th {
  background-color: #e6e6e6;
  font-weight: bold;
}

.items-table td.text-left {
  text-align: left;
  padding-left: 6px;
}

/* Row colors */
.conflict-row {
  background: #fef2f2;
}
.outlier-row {
  background: #fffbeb;
}
.matched-row {
  background: #f0fdf4;
}

/* Cell colors */
.outlier-cell {
  background: #fee2e2 !important;
  font-weight: 700;
  color: #dc2626;
}
.conflict-cell {
  background: #fef2f2 !important;
  font-weight: 700;
  color: #dc2626;
}
.normal-cell {
  background: transparent;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-family: sans-serif;
}
.spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media print {
  .no-print {
    display: none !important;
  }
  body {
    background-color: #fff;
  }
  .print-page {
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .items-table th, .items-table td {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .items-table th {
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }
  .conflict-row {
    background: #fef2f2 !important;
  }
  .outlier-row {
    background: #fffbeb !important;
  }
  .matched-row {
    background: #f0fdf4 !important;
  }
  .outlier-cell {
    background: #fee2e2 !important;
  }
  .conflict-cell {
    background: #fef2f2 !important;
  }
}
</style>
