<template>
  <div class="top-actions no-print" v-if="requestData || !loading">
    <button class="btn-back-top" @click="goBack">← Back to Requests</button>
    <button class="btn-print-top" @click="printPage">🖨️ Print Form</button>
  </div>

  <div class="print-page" v-if="requestData">
    <header class="form-header">
      <h1 class="motto">WE TRUST IN GOD!!!</h1>
      <h1 class="motto">እግዚአብሔር ይባረክ!!!</h1>

      <h2 class="company-name">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>
      
      <h3 class="form-subtitle-title">
        ITEM REQUEST FROM 
        <span class="store-name">{{ getStoreName(requestData.supplyingStoreId) }}</span> 
        TO 
        <span class="store-name">{{ getStoreName(requestData.askingStoreId) }}</span>
      </h3>
      
      <div class="date-row">
        <span><strong>REQ. NO:-</strong> {{ requestData.requestCode || requestData.id }}</span>
        <span><strong>DATE:-</strong> {{ formatDate(requestData.requestedDate) }}</span>
      </div>
    </header>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">No</th>
          <th style="width: 22%;">Item</th>
          <th style="width: 8%;">U.O.M</th>
          <th style="width: 8%;">Qty</th>
          <th style="width: 10%;">Brand</th>
          <th style="width: 17%;">Specification</th>
          <th style="width: 10%;">Location</th>
          <th style="width: 8%;">Store Balance</th>
          <th style="width: 12%;">Remark</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!requestData.items || requestData.items.length === 0">
          <td colspan="9" class="no-items">No items in this request</td>
        </tr>
        <tr v-for="(item, index) in requestData.items" :key="index">
          <td>{{ index + 1 }}</td>
          <td class="text-left">{{ getItemNameOnly(item.itemId, requestData.items) }}</td>
          <td>{{ getItemUOM(item.itemId, requestData.items) || 'Pcs' }}</td>
          <td class="font-bold">{{ formatQuantity(item.quantity) }}</td>
          <td>{{ getItemBrand(item.itemId, requestData.items) || '-' }}</td>
          <td class="spec-cell">{{ stripHtml(getItemSpecification(item.itemId, requestData.items)) || '-' }}</td>
          <td>{{ getItemModel(item.itemId, requestData.items) || '-' }}</td>
          <td>-</td>
          <td>{{ item.remark || '-' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="meta-grid">
      <!-- Department - Centered -->
      <div class="meta-col">
        <div class="block-header text-center">Department</div>
        <div class="block-body dept-body">
          <strong class="dept-value">{{ getRequestingDepartment() }}</strong>
        </div>
      </div>

      <!-- Requested By -->
      <div class="meta-col">
        <div class="block-header text-center">Requested By</div>
        <div class="block-body workflow-body">
          <p><strong>Name:-</strong> {{ getRequesterName() }}</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>

      <!-- Approved -->
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
import employeesService from '@/stores/employee'  // ✅ Import employee service
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
const departments = ref<any[]>([])

// ================================================================
// DATA LOADING
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

// ✅ Use employeesService.getDepartments()
const loadDepartments = async () => {
  try {
    const response = await employeesService.getDepartments()
    if (response.success) {
      departments.value = response.data
      console.log('✅ Departments loaded:', departments.value.length)
    } else {
      console.warn('Failed to load departments:', response.error)
    }
  } catch (error) {
    console.error('Load departments error:', error)
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

// ================================================================
// DEPARTMENT & USER HELPERS
// ================================================================

const getRequestingDepartment = (): string => {
  if (!requestData.value) return 'N/A'
  
  const req = requestData.value as any
  const user = req.requestedByUser
  
  // 1. If department object is already included in the response
  if (user?.department) {
    if (typeof user.department === 'string') return user.department
    if (typeof user.department === 'object' && user.department.name) {
      return user.department.name
    }
  }
  
  // 2. Look up by departmentId from departments list
  if (user?.departmentId) {
    const dept = departments.value.find(d => 
      d.departmentId === user.departmentId || 
      d.id === user.departmentId ||
      d.department_id === user.departmentId
    )
    if (dept) {
      return dept.name || dept.departmentName || `Department ${user.departmentId}`
    }
    return `Department ${user.departmentId}`
  }
  
  return 'N/A'
}

const getRequesterName = (): string => {
  if (!requestData.value) return 'N/A'
  
  const req = requestData.value
  const user = req.requestedByUser
  
  if (user) {
    const userData = user as any
    if (user.fullName) return user.fullName
    if (user.full_name) return user.full_name
    // if (user.username) return user.username
    // if (userData.name) return userData.name
  }
  
  if (req.requestedBy) {
    return req.requestedBy
  }
  
  return 'N/A'
}

// ================================================================
// STORE HELPERS
// ================================================================

const getStoreName = (storeId: number): string => {
  const store = stores.value.find(s => (s.storeId || s.id) === storeId)
  return store ? store.name : 'Unknown Store'
}

// ================================================================
// ITEM HELPERS
// ================================================================

const getItemNameOnly = (itemId: number, requestItems?: any[]): string => {
  if (requestItems) {
    const found = requestItems.find((i) => Number(i.itemId || i.id) === itemId)
    if (found) {
      if (found.item?.name) return found.item.name
      if (found.item?.standardName) return found.item.standardName
      if (found.itemName) return found.itemName
      if (found.name) return found.name
    }
  }
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  if (!item) return 'Unknown Item'
  return item.standardName || item.name || 'Unknown Item'
}

const getItemBrand = (itemId: number, requestItems?: any[]): string => {
  if (requestItems) {
    const found = requestItems.find((i) => Number(i.itemId || i.id) === itemId)
    if (found) {
      if (found.item?.brand) return found.item.brand
      if (found.brand) return found.brand
    }
  }
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.brand || ''
}

const getItemModel = (itemId: number, requestItems?: any[]): string => {
  if (requestItems) {
    const found = requestItems.find((i) => Number(i.itemId || i.id) === itemId)
    if (found) {
      if (found.item?.model) return found.item.model
      if (found.model) return found.model
    }
  }
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.model || ''
}

const getItemUOM = (itemId: number, requestItems?: any[]): string => {
  if (requestItems) {
    const found = requestItems.find((i) => Number(i.itemId || i.id) === itemId)
    if (found) {
      if (found.uom_code) return found.uom_code
      if (found.uomCode) return found.uomCode
      if (found.item?.uom?.code) return found.item.uom.code
      if (found.item?.uom) return found.item.uom
    }
  }
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  if (item?.uom) {
    if (typeof item.uom === 'string') return item.uom
    if (typeof item.uom === 'object' && item.uom.code) return item.uom.code
  }
  return ''
}

const getItemSpecification = (itemId: number, requestItems?: any[]): string => {
  if (requestItems) {
    const found = requestItems.find((i) => Number(i.itemId || i.id) === itemId)
    if (found) {
      if (found.item?.specText) return found.item.specText
      if (found.specText) return found.specText
    }
  }
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.specText || ''
}

// ================================================================
// FORMATTING HELPERS
// ================================================================

const formatQuantity = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return '0.00'
  return num.toFixed(2)
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

const stripHtml = (htmlContent: string): string => {
  if (!htmlContent) return ''
  return htmlContent
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

// ================================================================
// NAVIGATION
// ================================================================

const goBack = (): void => {
  router.push('/item-requests')
}

const printPage = (): void => { 
  window.print() 
}

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  const requestId = route.query.id as string
  if (requestId) {
    await Promise.all([
      loadStores(),
      loadItems(),
      loadDepartments()  // ✅ Uses employeesService.getDepartments()
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
}

.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1100px;
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
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 0 0 15px 0;
  color: #1a1a1a;
}

.store-name {
  color: #000000;
  font-weight: 800;
  font-size: 16px;
  text-decoration: none;
}

.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 12px;
}

/* ================================================================
   TABLE CONFIGURATION - ENHANCED FOR PRINT
   ================================================================ */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 25px;
  font-size: 12px;
  table-layout: fixed;
}

.items-table th, 
.items-table td {
  border: 1px solid #7f7f7f;
  padding: 6px 4px;
  text-align: center;
  height: 28px;
  word-wrap: break-word;
  vertical-align: middle;
}

.items-table th {
  background-color: #e6e6e6;
  font-weight: bold;
  font-size: 11px;
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
  text-align: center !important;
}

.spec-cell {
  font-size: 11px;
  line-height: 1.3;
}

/* ================================================================
   META GRID - DEPARTMENT CENTERED
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
  min-height: 80px;
}

/* Department Block - Centered */
.dept-body {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.dept-value {
  font-size: 20px;
  color: #0f172a;
  font-weight: 600;
  text-align: center;
  padding: 0px 0px;
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
  min-height: 46px;
}

.lines-container {
  flex-grow: 1;
  border: 1px solid #7f7f7f;
  background-color: #ffffff;
  min-height: 46px;
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

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state h2 {
  color: #1e293b;
  margin-bottom: 8px;
}

.error-state p {
  color: #64748b;
  margin-bottom: 16px;
}

.btn-back {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

/* ================================================================
   CRITICAL PRINT DRIVER OVERRIDES
   ================================================================ */
@media print {
  .no-print {
    display: none !important;
  }
  
  body {
    background-color: #fff !important;
  }
  
  .print-page {
    max-width: 100% !important;
    padding: 10px !important;
    margin: 0 !important;
  }
  
  /* Force exact colors for print */
  .gray-label, 
  .block-header, 
  .items-table th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }
  
  .store-name {
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  .items-table th,
  .items-table td {
    border-color: #000000 !important;
  }
  
  .items-table {
    font-size: 10px !important;
  }
  
  .items-table td {
    padding: 4px 3px !important;
    height: 24px !important;
  }
  
  .motto {
    font-size: 16px !important;
  }
  
  .company-name {
    font-size: 18px !important;
  }
  
  .form-subtitle-title {
    font-size: 13px !important;
  }
  
  .store-name {
    font-size: 14px !important;
  }
  
  .meta-grid {
    gap: 15px !important;
  }
  
  .input-row {
    width: 90% !important;
  }
  
  .input-row.short-width {
    width: 70% !important;
  }
  
  .dept-value {
    font-size: 18px !important;
  }
  
  /* Page break control */
  .meta-grid {
    page-break-inside: avoid !important;
  }
  
  .footer-sections {
    page-break-inside: avoid !important;
  }
  
  /* Ensure no page breaks inside table rows */
  .items-table tr {
    page-break-inside: avoid !important;
  }
  
  .items-table {
    page-break-after: avoid !important;
  }
}

/* ================================================================
   RESPONSIVE ADJUSTMENTS
   ================================================================ */
@media (max-width: 768px) {
  .print-page {
    padding: 10px;
  }
  
  .meta-grid {
    flex-direction: column;
    gap: 15px;
  }
  
  .input-row,
  .input-row.short-width {
    width: 100%;
  }
  
  .gray-label {
    width: 100px;
    font-size: 11px;
    min-height: 38px;
  }
  
  .inline-label {
    width: 100px;
  }
  
  .top-actions {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  
  .top-actions button {
    width: 100%;
    justify-content: center;
  }
  
  .items-table {
    font-size: 10px;
  }
  
  .items-table th,
  .items-table td {
    padding: 3px 2px;
    height: 20px;
  }
  
  .items-table th {
    font-size: 9px;
  }
  
  .date-row {
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
  }
  
  .motto {
    font-size: 15px;
  }
  
  .company-name {
    font-size: 16px;
  }
  
  .form-subtitle-title {
    font-size: 12px;
  }
  
  .store-name {
    font-size: 13px;
  }
  
  .dept-value {
    font-size: 16px !important;
  }
}
</style>