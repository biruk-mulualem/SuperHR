<template>
  <div class="top-actions no-print" v-if="requestData || !loading">
    <button class="btn-back-top" @click="goBack">← Back to Requests</button>
    <button class="btn-print-top" @click="printPage">🖨️ Print Form</button>
  </div>

  <div class="print-page" v-if="requestData">
    <header class="form-header">
      <h1 class="motto">WE TRUST IN GOD!!!</h1> <h1 class="motto">    እግዚአብሔር ይባረክ!!!</h1>
  

      <h2 class="company-name">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>
      <h3 class="form-subtitle-title">ITEM VOUCHER FOR {{ requestData?.askingStore?.name || '-' }} </h3>
      
      <div class="date-row">
        <span><strong>REQ. NO:-</strong> {{ requestData.requestCode || requestData.id }}</span>
        <span><strong>DATE:-</strong> {{ formatDate(requestData.requestedDate) }}</span>
      </div>
    </header>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">No</th>
          <th style="width: 18%;">Item</th>
          <th style="width: 5%;">U.O.M</th>
          <th style="width: 5%;">Qty</th>
          <th style="width: 10%;">Brand</th>
          <th style="width: 15%;">Specification</th>
          <th style="width: 9%;">Location</th>
          <th style="width: 6%;">Store Balance</th>
        
          <th style="width: 16%;">Remark</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!requestData.items || requestData.items.length === 0">
          <td colspan="10" class="no-items">No items in this request</td>
        </tr>
        <tr v-for="(item, index) in requestData.items" :key="index">
          <td>{{ index + 1 }}</td>
          <td class="text-left">{{ getItemName(item.itemId) }}</td> 
          <td>{{ getItemUOM(item.itemId) || 'Pcs' }}</td>
          <td class="font-bold">{{ item.quantity }}</td>
          <td>{{ getItemBrand(item.itemId) || '-' }}</td>
          <td>{{ stripHtml(getItemSpecification(item.itemId)) || '-' }}</td>
          <td>{{ getItemModel(item.itemId) || '-' }}</td>
          <td>-</td>
          
          <td>{{ item.remark || '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="meta-grid">
      <div class="meta-col">
        <div class="block-header text-center">Department / Store</div>
        <div class="block-body dept-body">
          <strong>{{ getStoreName(requestData.askingStoreId) }}</strong>
        </div>
      </div>

      <div class="meta-col">
        <div class="block-header text-center">Requested By</div>
        <div class="block-body workflow-body">
          <p><strong>Name:-</strong> {{ getRequesterName() }}</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>

      <div class="meta-col">
        <div class="block-header text-center">Approved</div>
        <div class="block-body workflow-body">
          <p><strong>Name :-</strong> ____________________</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>
    </div>

    <div class="footer-sections">
      <div class="input-row">
        <div class="gray-label">Reason</div>
        <div class="lines-container">
          <div class="reason-content-text">
            {{ requestData.remark || '' }}
          </div>
        </div>
      </div>

      <div class="input-row short-width">
        <div class="gray-label">Comment</div>
        <div class="lines-container">
          <div class="write-line"></div>
          <div class="write-line"></div>
        </div>
      </div>

      <div class="checked-by-section">
        <div class="gray-label inline-label">Checked By</div>
        <div class="checked-by-body">
          <p><strong>Name</strong> _____________________________.</p>
          <p><strong>Signature</strong> _____________________</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading request data...</p>
  </div>

  <div v-else class="error-state">
    <div class="error-icon">❌</div>
    <h2>Request Not Found</h2>
    <p>The request you're looking for doesn't exist or has been removed.</p>
    <button class="btn-back" @click="goBack">← Back to Requests</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import itemRequestService from '@/stores/itemRequestService'
import type { ItemRequest, Store, Item } from '@/stores/itemRequestService'

// ================================================================
// STATE
// ================================================================

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const requestData = ref<ItemRequest | null>(null)
const stores = ref<Store[]>([])
const items = ref<Item[]>([])

// ================================================================
// METHODS
// ================================================================

const loadStores = async () => {
  try {
    const response = await itemRequestService.getActiveStores()
    if (response.success) {
      stores.value = response.data
    }
  } catch (error) {
    console.error('Load stores error:', error)
  }
}

const loadItems = async () => {
  try {
    const response = await itemRequestService.getActiveItems()
    if (response.success) {
      items.value = response.data
    }
  } catch (error) {
    console.error('Load items error:', error)
  }
}

const loadRequest = async (requestId: string) => {
  try {
    const response = await itemRequestService.getRequestById(Number(requestId))
    if (response.success) {
      requestData.value = response.data
    }
  } catch (error) {
    console.error('Load request error:', error)
  } finally {
    loading.value = false
  }
}

// -- Helper Methods --
const getStoreName = (storeId: number): string => {
  const store = stores.value.find(s => (s.storeId || s.id) === storeId)
  return store ? store.name : 'Unknown Store'
}

const getStoreCode = (storeId: number): string => {
  const store = stores.value.find(s => (s.storeId || s.id) === storeId)
  return store ? store.code : 'N/A'
}

const getItemName = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item ? item.name : 'Unknown Item'
}

const getItemCode = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item ? item.code : 'N/A'
}

const getItemBrand = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.brand || ''
}

const getItemModel = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.model || ''
}

const getItemUOM = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  if (item?.uom) {
    if (typeof item.uom === 'string') return item.uom
    if (typeof item.uom === 'object' && item.uom.code) return item.uom.code
  }
  return ''
}

const getItemSpecification = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.specText || ''
}

const getRequesterName = (): string => {
  if (!requestData.value) return 'N/A'
  if (requestData.value.requestedByUser) {
    return requestData.value.requestedByUser.fullName || 
           requestData.value.requestedByUser.full_name || 
           requestData.value.requestedByUser.username || 
           'N/A'
  }
  return requestData.value.requestedBy || 'N/A'
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

/**
 * Filter and remove all HTML elements/entities generated by rich text editors
 */
const stripHtml = (htmlContent: string): string => {
  if (!htmlContent) return ''
  return htmlContent
    .replace(/<[^>]*>/g, '')         // Strips out matching HTML tags
    .replace(/&nbsp;/g, ' ')         // Replaces rich text space entity breaks
    .replace(/&amp;/g, '&')          // Decodes basic text entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

// -- Navigation --
const goBack = (): void => {
  router.push('/item-requests')
}

const printPage = (): void => { window.print() }

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  const requestId = route.query.id as string
  if (requestId) {
    await Promise.all([
      loadStores(),
      loadItems()
    ])
    await loadRequest(requestId)
  } else {
    loading.value = false
  }
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
  margin-bottom: 25px;
  font-size: 12px;
  table-layout: fixed; /* Maintains structural rigid proportions */
}

.items-table th, 
.items-table td {
  border: 1px solid #7f7f7f;
  padding: 6px 4px;
  text-align: center;
  height: 24px;
  word-wrap: break-word; /* Wraps clean long text within custom sizes */
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

.no-items {
  padding: 20px !important;
  color: #7f7f7f;
  font-style: italic;
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

.dept-body {
  text-align: center;
  padding-top: 12px;
}

.workflow-body p {
  margin: 6px 0;
}

/* ================================================================
   DYNAMIC INPUT ROWS WITH PRINT-FRIENDLY BACKGROUNDS
   ================================================================ */
.footer-sections {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-row {
  display: flex;
  width: 85%;
}

.input-row.short-width {
  width: 65%;
}

.gray-label {
  background-color: #d9d9d9; 
  color: #000000; 
  font-weight: bold;
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border: 1px solid #7f7f7f;
}

.lines-container {
  flex-grow: 1;
  border: 1px solid #7f7f7f;
  background-color: #ffffff;
}

.reason-content-text {
  font-size: 13px;
  padding: 8px 10px;
  line-height: 1.5;
  min-height: 46px;
  box-sizing: border-box;
}

.write-line {
  height: 22px;
  border-bottom: 1px solid #7f7f7f;
  background-color: #ffffff;
}

.write-line:last-child {
  border-bottom: none;
  background-color: #f9f9f9;
}

.checked-by-section {
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.inline-label {
  width: 220px;
  padding: 4px 0;
  text-align: center;
  margin-bottom: 10px;
}

.checked-by-body {
  font-size: 13px;
  padding-left: 2px;
}

.checked-by-body p {
  margin: 6px 0;
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
  .gray-label, .block-header, .items-table th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }
}


</style>


