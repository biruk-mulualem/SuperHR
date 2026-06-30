<template>
  <div class="top-actions no-print" v-if="transactionItems.length > 0 || !loading">
    <button class="btn-back-top" @click="goBack">← Back to Transactions</button>
    <button class="btn-print-top" @click="printPage">🖨️ Print Transaction Report</button>
  </div>

  <div class="print-page" v-if="transactionItems.length > 0">
    <header class="form-header">
      <h1 class="motto">WE TRUST IN GOD!!!</h1>
      <h1 class="motto">እግዚአብሔር ይባረክ!!!</h1>
      <h2 class="company-name">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>
      
      <h3 class="form-subtitle-title">STORE TRANSACTION REPORT</h3>
      
      <div class="date-row">
        <span style="margin-left: auto;"><strong>PRINTED DATE:-</strong> {{ formatCurrentDate() }}</span>
      </div>
    </header>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 3%;">No</th>
          <th style="width: 10%;">Date</th>
          <th style="width: 10%;">Store</th>
          <th style="width: 9%;">Group</th>
          <th style="width: 6%;">Type</th>
          <th style="width: 16%;">Item</th>
          <th style="width: 7%;">Qty</th>
          <th style="width: 10%;">Source</th>
          <th style="width: 10%;">Dest.</th>
          <th style="width: 19%;">Remark</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in transactionItems" :key="item.id || index">
          <td>{{ index + 1 }}</td>
          <td>{{ formatDateTime(item.createdAt) }}</td>
          <td>{{ item.storeName || '-' }}</td>
          <td>{{ item.groupName || '-' }}</td>
          <td>{{ item.type || '-' }}</td>
          <td class="text-left">
            <strong>{{ item.itemCode || '-' }}</strong><br/>
            {{ item.itemName || '-' }}
            <div v-if="item.itemCommonName" style="font-size: 0.9em; color: #555;">({{ item.itemCommonName }})</div>
          </td>
          <td class="font-bold highlight-balance">{{ item.type === 'Stock In' ? '+' : '-' }}{{ item.quantity || 0 }} <br/> <small>{{ item.uom || '' }}</small></td>
          <td>{{ item.sourceStore || '-' }}</td>
          <td>{{ item.destinationStore || '-' }}</td>
          <td>{{ item.remark || '-' }}</td>
        </tr>
      </tbody>
    </table>

  </div>

  <div v-else-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading store transaction data...</p>
  </div>

  <div v-else class="error-state">
    <h2 style="color: lightgray;">No Transaction Records Found</h2>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface StoreTransactionItem {
  id: number
  createdAt: string
  storeId: number
  storeName: string
  groupId: number
  groupName: string
  itemId: number
  itemCode: string
  itemName: string
  itemCommonName: string
  uom: string
  type: string
  quantity: number
  remark: string
  updatedBy: string
  sourceStore?: string | null
  destinationStore?: string | null
}

const router = useRouter()
const loading = ref(true)
const transactionItems = ref<StoreTransactionItem[]>([])

const loadStoreTransactions = async () => {
  try {
    loading.value = true
    
    const storedData = localStorage.getItem('printTransactionData')
    if (storedData) {
      transactionItems.value = JSON.parse(storedData)
    } else {
      transactionItems.value = []
    }
  } catch (error) {
    console.error('Failed to load store transaction records:', error)
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

const formatDateTime = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = (): void => {
  router.push('/store-transaction')
}

const printPage = (): void => { window.print() }

onMounted(async () => {
  await loadStoreTransactions()
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

.btn-back-top {
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

.font-bold {
  font-weight: bold;
}

.highlight-balance {
  font-size: 13px;
  background-color: #fafdff;
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
  .items-table th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }
}
</style>
