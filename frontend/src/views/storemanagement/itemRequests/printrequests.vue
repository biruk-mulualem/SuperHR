<!-- views/storemanagement/itemRequests/printrequests.vue -->
<template>
  <div class="print-page" v-if="requestData">
    <!-- ==================== TOP ACTION BUTTONS ==================== -->
    <div class="top-actions no-print">
      <button class="btn-back-top" @click="goBack">← Back to Requests</button>
      <button class="btn-print-top" @click="printPage">🖨️ Print</button>
    </div>

    <!-- Print Header -->
    <div class="print-header">
      <div class="header-content">
        <h1>📦 Item Request Form</h1>
        <div class="request-code">#{{ requestData.requestCode || requestData.id }}</div>
      </div>
      <div class="print-date">Printed: {{ new Date().toLocaleString() }}</div>
    </div>

    <!-- Status Banner -->
    <div class="status-banner" :class="requestData.status">
      <span class="status-label">Status:</span>
      <span :class="['status-badge', requestData.status]">
        {{ requestData.status }}
      </span>
    </div>

    <!-- Two Column Grid for Request Info and Store Details -->
    <div class="print-grid">
      <!-- Left Column -->
      <div class="print-column">
        <!-- Request Information -->
        <div class="print-card">
          <h4>📋 Request Information</h4>
          <div class="print-field">
            <span class="field-label">Request Code</span>
            <span class="field-value">{{ requestData.requestCode || requestData.id }}</span>
          </div>
          <div class="print-field">
            <span class="field-label">Requested By</span>
            <span class="field-value">{{ getRequesterName() }}</span>
          </div>
          <div class="print-field">
            <span class="field-label">Requested Date</span>
            <span class="field-value">{{ formatDate(requestData.requestedDate) }}</span>
          </div>
          <div class="print-field">
            <span class="field-label">Created At</span>
            <span class="field-value">{{ formatDateTime(requestData.createdAt) }}</span>
          </div>
          <div v-if="requestData.approvedAt" class="print-field">
            <span class="field-label">Approved At</span>
            <span class="field-value">{{ formatDateTime(requestData.approvedAt) }}</span>
          </div>
          <div v-if="requestData.finalizedAt" class="print-field">
            <span class="field-label">Finalized At</span>
            <span class="field-value">{{ formatDateTime(requestData.finalizedAt) }}</span>
          </div>
          <div v-if="requestData.updatedAt" class="print-field">
            <span class="field-label">Last Updated</span>
            <span class="field-value">{{ formatDateTime(requestData.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="print-column">
        <!-- Store Details -->
        <div class="print-card">
          <h4>🏪 Store Details</h4>
          <div class="print-field">
            <span class="field-label">Asking Store</span>
            <span class="field-value">{{ getStoreName(requestData.askingStoreId) }}</span>
          </div>
          <div class="print-field">
            <span class="field-label">Asking Store Code</span>
            <span class="field-value">{{ getStoreCode(requestData.askingStoreId) }}</span>
          </div>
          <div class="print-field">
            <span class="field-label">Supplying Store</span>
            <span class="field-value">{{ getStoreName(requestData.supplyingStoreId) }}</span>
          </div>
          <div class="print-field">
            <span class="field-label">Supplying Store Code</span>
            <span class="field-value">{{ getStoreCode(requestData.supplyingStoreId) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- FULL WIDTH ITEMS SECTION WITH BRAND, MODEL, SPECIFICATION       -->
    <!-- ================================================================ -->
    <div class="items-full-section">
      <div class="section-title">
        <h3>📦 Items Requested</h3>
        <span class="item-count-badge">{{ requestData.items?.length || 0 }} item(s)</span>
      </div>
      
      <div class="items-table-wrapper">
        <table class="print-items-table">
          <thead>
            <tr>
              <th class="col-sno">#</th>
              <th class="col-item-name">Item Name</th>
              <th class="col-item-code">Item Code</th>
              <th class="col-brand">Brand</th>
              <th class="col-model">Model</th>
              <th class="col-uom">UOM</th>
              <th class="col-qty">Qty</th>
              <th class="col-spec">Specification</th>
              <th class="col-remark">Remark</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!requestData.items || requestData.items.length === 0">
              <td colspan="9" class="text-center no-items">No items in this request</td>
            </tr>
            <tr v-for="(item, index) in requestData.items" :key="index">
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ getItemName(item.itemId) }}</td>
              <td>{{ getItemCode(item.itemId) }}</td>
              <td>{{ getItemBrand(item.itemId) || 'N/A' }}</td>
              <td>{{ getItemModel(item.itemId) || 'N/A' }}</td>
              <td>{{ getItemUOM(item.itemId) || 'N/A' }}</td>
              <td class="text-center qty-highlight">{{ item.quantity }}</td>
              <td class="spec-cell">{{ getItemSpecification(item.itemId) || 'N/A' }}</td>
              <td>{{ item.remark || '-' }}</td>
            </tr>
            <tr class="total-row">
              <td colspan="8" class="text-right"><strong>Total Items:</strong></td>
              <td class="text-center"><strong>{{ requestData.items?.length || 0 }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- GENERAL REMARK SECTION                                           -->
    <!-- ================================================================ -->
    <div class="remark-full-section">
      <div class="section-title">
        <h4>📝 General Remark</h4>
      </div>
      <div class="remark-text" :class="{ empty: !requestData.remark }">
        {{ requestData.remark || 'No general remarks provided' }}
      </div>
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-field">
        <div class="signature-line"></div>
        <span class="signature-label">Requested By Signature</span>
      </div>
      <div class="signature-field">
        <div class="signature-line"></div>
        <span class="signature-label">Approved By Signature</span>
      </div>
      <div class="signature-field">
        <div class="signature-line"></div>
        <span class="signature-label">Received By Signature</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="print-footer">
      <div class="footer-line"></div>
      <div class="footer-text">
        <span>Generated by Store Management System</span>
        <span>Page 1 of 1</span>
      </div>
    </div>

    <!-- Bottom Action Buttons (hidden when printing) -->
    <div class="action-buttons no-print">
      <button class="btn-back" @click="goBack">← Back to Requests</button>
      <button class="btn-print" @click="printPage">🖨️ Print</button>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading request data...</p>
  </div>

  <!-- Error State -->
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

const getItemStandardName = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.standardName || ''
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

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// -- Navigation --
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
   PRINT PAGE STYLES
   ================================================================ */

.print-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px;
  background: white;
  font-family: Arial, sans-serif;
  color: #1e293b;
}

/* ================================================================
   TOP ACTION BUTTONS
   ================================================================ */
.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.btn-back-top {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-back-top:hover {
  background: #e2e8f0;
}

.btn-print-top {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-print-top:hover {
  background: #2563eb;
}

/* Header */
.print-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 26px;
  margin: 0;
  color: #0f172a;
}

.request-code {
  font-size: 16px;
  color: #64748b;
  margin-top: 4px;
}

.print-date {
  font-size: 13px;
  color: #94a3b8;
  text-align: right;
}

/* Status Banner */
.status-banner {
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 15px;
}

.status-banner.pending { background: #fef3c7; }
.status-banner.approved { background: #dbeafe; }
.status-banner.rejected { background: #fee2e2; }
.status-banner.finalized { background: #dcfce7; }

.status-label {
  font-weight: 600;
  color: #1e293b;
}

.status-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.pending { background: #f59e0b; color: white; }
.status-badge.approved { background: #3b82f6; color: white; }
.status-badge.rejected { background: #ef4444; color: white; }
.status-badge.finalized { background: #22c55e; color: white; }

/* Print Grid for Request Info and Store Details */
.print-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 30px;
}

.print-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
}

.print-card h4 {
  margin: 0 0 14px 0;
  font-size: 15px;
  color: #0f172a;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
}

.print-field {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.print-field:last-child {
  border-bottom: none;
}

.field-label {
  color: #64748b;
}

.field-value {
  font-weight: 500;
  color: #0f172a;
}

/* ================================================================
   FULL WIDTH ITEMS SECTION
   ================================================================ */
.items-full-section {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.section-title h3 {
  margin: 0;
  font-size: 17px;
  color: #0f172a;
  font-weight: 600;
}

.section-title h4 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
  font-weight: 600;
}

.item-count-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.items-table-wrapper {
  overflow-x: auto;
}

.print-items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.print-items-table thead th {
  background: #f1f5f9;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.print-items-table tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.print-items-table tbody tr:last-child td {
  border-bottom: none;
}

.print-items-table .total-row {
  background: #f8fafc;
  font-weight: 500;
  border-top: 2px solid #e2e8f0;
}

.print-items-table .total-row td {
  padding: 10px 12px;
}

/* Column widths */
.col-sno { width: 35px; text-align: center; }
.col-item-name { min-width: 130px; }
.col-item-code { min-width: 90px; }
.col-brand { min-width: 90px; }
.col-model { min-width: 100px; }
.col-uom { width: 70px; }
.col-qty { width: 60px; text-align: center; }
.col-spec { min-width: 160px; max-width: 250px; }
.col-remark { min-width: 120px; }

.qty-highlight {
  font-weight: 700;
  color: #2563eb;
  font-size: 14px;
}

.spec-cell {
  font-size: 11px;
  color: #475569;
  line-height: 1.4;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.no-items {
  padding: 20px !important;
  color: #94a3b8;
  text-align: center;
}

/* ================================================================
   REMARK FULL SECTION
   ================================================================ */
.remark-full-section {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
}

.remark-text {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
  min-height: 50px;
  border: 1px solid #e2e8f0;
}

.remark-text.empty {
  color: #94a3b8;
  font-style: italic;
}

/* Signature Section */
.signature-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 30px;
  margin: 30px 0 20px;
  padding: 20px 0;
  border-top: 2px solid #e2e8f0;
}

.signature-field {
  text-align: center;
}

.signature-line {
  border-bottom: 2px solid #cbd5e1;
  height: 40px;
  margin-bottom: 8px;
}

.signature-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

/* Footer */
.print-footer {
  margin-top: 32px;
  border-top: 2px solid #e2e8f0;
  padding-top: 16px;
}

.footer-text {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

/* Bottom Action Buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-back {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e2e8f0;
}

.btn-print {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-print:hover {
  background: #2563eb;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin-top: 16px;
  color: #94a3b8;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-state h2 {
  color: #1e293b;
  margin-bottom: 8px;
}

.error-state p {
  color: #94a3b8;
  margin-bottom: 24px;
}

/* ================================================================
   PRINT STYLES
   ================================================================ */

@media print {
  .no-print {
    display: none !important;
  }

  .print-page {
    padding: 15px !important;
    max-width: 100% !important;
  }

  .print-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .items-full-section {
    break-inside: avoid;
    page-break-inside: avoid;
    border-color: #cbd5e1 !important;
  }

  .remark-full-section {
    break-inside: avoid;
    page-break-inside: avoid;
    border-color: #cbd5e1 !important;
  }

  .signature-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-grid {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .status-banner {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-items-table {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-items-table thead th {
    background: #e2e8f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */

@media (max-width: 768px) {
  .print-grid {
    grid-template-columns: 1fr;
  }

  .signature-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .print-header {
    flex-direction: column;
    gap: 8px;
  }

  .print-date {
    text-align: left;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
    justify-content: center;
  }

  .print-items-table {
    font-size: 10px;
  }

  .print-items-table thead th,
  .print-items-table tbody td {
    padding: 4px 6px;
  }

  .items-full-section {
    padding: 12px 14px;
  }

  .remark-full-section {
    padding: 12px 14px;
  }

  .section-title h3 {
    font-size: 14px;
  }

  .col-sno { width: 25px; }
  .col-item-name { min-width: 80px; }
  .col-item-code { min-width: 60px; }
  .col-brand { min-width: 60px; }
  .col-model { min-width: 70px; }
  .col-uom { width: 50px; }
  .col-qty { width: 45px; }
  .col-spec { min-width: 100px; max-width: 150px; }
  .col-remark { min-width: 80px; }

  .top-actions {
    flex-direction: column;
    gap: 8px;
  }

  .top-actions button {
    width: 100%;
    justify-content: center;
  }
}

@media print and (max-width: 768px) {
  .print-grid {
    grid-template-columns: 1fr;
  }

  .signature-section {
    grid-template-columns: 1fr;
  }

  .items-full-section {
    border-color: #cbd5e1 !important;
  }

  .remark-full-section {
    border-color: #cbd5e1 !important;
  }
}

@media (max-width: 480px) {
  .print-items-table {
    font-size: 9px;
  }

  .print-items-table thead th,
  .print-items-table tbody td {
    padding: 3px 4px;
  }

  .items-full-section {
    padding: 8px 10px;
  }

  .remark-full-section {
    padding: 8px 10px;
  }

  .section-title h3 {
    font-size: 12px;
  }

  .spec-cell {
    font-size: 9px;
  }
}
</style>