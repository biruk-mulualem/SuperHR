<template>
  <div class="top-actions no-print" v-if="balanceItems.length > 0 || !loading">
    <button class="btn-back-top" @click="goBack">← Back to Balances</button>
    <button class="btn-print-top" @click="printPage">🖨️ Print Balance Sheet</button>
  </div>

  <div class="print-page" v-if="balanceItems.length > 0">
    <header class="form-header">
      <h1 class="motto">WE TRUST IN GOD!!!</h1>
      <h1 class="motto">እግዚአብሔር ይባረክ!!!</h1>
      <h2 class="company-name">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>
      
      <h3 class="form-subtitle-title"> {{ currentStoreName }} BALANCE REPORT </h3>
      
      <div class="date-row">
        <span><strong>Group:</strong> {{ currentGroupName }}</span>
        <span style="margin-left: auto;"><strong>PRINTED DATE:-</strong> {{ formatCurrentDate() }}</span>
      </div>
    </header>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">No</th>
          <th style="width: 12%;">Item Code</th>
          <th style="width: 20%;">Standard Name</th>
          <th style="width: 20%;">Common Name</th>
          <th style="width: 6%;">U.O.M</th>
          <th style="width: 10%;">Balance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in balanceItems" :key="item.id || index">
          <td>{{ index + 1 }}</td>
          <td><strong>{{ item.itemCode || '-' }}</strong></td>
          <td class="text-left">
            {{ item.itemName || '-' }}
          </td>
           <td class="text-left">
            {{ item.itemCommonName }}
          </td>

          <td>{{ item.uomCode || 'Pcs' }}</td>
          <td class="font-bold highlight-balance">{{ item.balance || 0 }}</td>
        </tr>
      </tbody>
    </table>

    <div class="meta-grid">
     <!--  <div class="meta-col">
        <div class="block-header text-center">Prepared By (Storekeeper)</div>
        <div class="block-body workflow-body">
          <p><strong>Name:-</strong> ____________________</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>

      <div class="meta-col">
        <div class="block-header text-center">Checked By</div>
        <div class="block-body workflow-body">
          <p><strong>Name:-</strong> ____________________</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>

      <div class="meta-col">
        <div class="block-header text-center">Approved By</div>
        <div class="block-body workflow-body">
          <p><strong>Name :-</strong> ____________________</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div> -->
    </div>
  </div>

  <div v-else-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading store balance data...</p>
  </div>

  <div v-else class="error-state">
    <h2 style="color: lightgray;">No Balance Records Found</h2>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Define the structural interface based on your payload object
interface StoreBalanceItem {
  id: number
  storeId: number
  storeName: string
  groupId: number
  groupName: string
  itemId: number
  itemCode: string
  itemName: string
  itemCommonName: string
  uomCode: string
  uomName: string
  conversionUomCode: string | null
  conversionValue: number
  balance: number
  minStock: number
  baseBalance: number
  status: string
  statusClass: string
  createdAt: string
  updatedAt: string
}

// ================================================================
// STATE
// ================================================================

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const balanceItems = ref<StoreBalanceItem[]>([])

// ================================================================
// COMPUTED PROPERTIES FOR HEADERS
// ================================================================

const currentStoreName = computed(() => {
  return balanceItems.value[0]?.storeName || 'Unknown Store'
})

const currentGroupName = computed(() => {
  return balanceItems.value[0]?.groupName || 'N/A'
})

// ================================================================
// METHODS
// ================================================================

const loadStoreBalances = async () => {
  try {
    loading.value = true
    
    const storedData = localStorage.getItem('printBalanceData')
    if (storedData) {
      balanceItems.value = JSON.parse(storedData)
    } else {
      balanceItems.value = []
    }
  } catch (error) {
    console.error('Failed to load store balance records:', error)
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

// -- Navigation --
const goBack = (): void => {
  router.push('/store-balance')
}

const printPage = (): void => { window.print() }

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  await loadStoreBalances()
})
</script>

<style scoped>
/* ================================================================
   PAGE SETUP & INTERACTIVE UI
   ================================================================ */
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

/* ================================================================
   FORM COMPONENT TYPOGRAPHY & HEADERS
   ================================================================ */
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

/* ================================================================
   TABLE CONFIGURATION
   ================================================================ */
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

/* ================================================================
   WORKFLOW LAYOUT BLOCKS
   ================================================================ */
.meta-grid {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 25px;
}

.meta-col {
  flex: 1;
}

.block-header {
  background-color: #d9d9d9;
  border: 1px solid #7f7f7f;
  padding: 5px;
  font-weight: bold;
  font-size: 14px;
}

.text-center {
  text-align: center;
}

.block-body {
  padding-top: 10px;
  font-size: 13px;
}

.workflow-body p {
  margin: 12px 0;
}

/* ================================================================
   LOADING & ERROR LAYOUT SYSTEM
   ================================================================ */
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

/* ================================================================
   CRITICAL PRINT DRIVER OVERRIDES
   ================================================================ */
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
  .block-header, .items-table th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }
}
</style>