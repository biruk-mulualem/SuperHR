<template>
  <div class="top-actions no-print" v-if="requestData || !loading">
    <button class="btn-back-top" @click="goBack">← Back to Purchase Requests</button>
    <button class="btn-print-top" @click="printPage">🖨️ Print Form</button>
  </div>

  <div class="print-page" v-if="requestData">
    <header class="form-header">
      <h1 class="motto">WE TRUST IN GOD!!!</h1>
      <h1 class="motto">እግዚአብሔር ይባረክ!!!</h1>

      <h2 class="company-name">SUPER DOUBLE "T" GENERAL TRADING PLC .</h2>

      <h3 class="form-subtitle-title">
        PURCHASE REQUEST FROM 
      </h3>

      <!-- PR NO & DATE - Table for print-safe alignment -->
      <table class="info-row-table">
        <tr>
          <td class="info-left">
            <strong>PR NO:-</strong> {{ requestData.prNumber || requestData.id }}
          </td>
          <td class="info-right">
            <strong>DATE:-</strong> {{ formatDate(requestData.requestedDate) }}
          </td>
        </tr>
      </table>
    </header>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 4%;">No</th>
          <th style="width: 20%;">Item</th>
          <th style="width: 6%;">U.O.M</th>
          <th style="width: 5%;">Qty</th>
          <th style="width: 10%;">Brand</th>
          <th style="width: 11%;">Model</th>
          <th style="width: 15%;">Specification</th>
          <th style="width: 8%;">Department</th>
          <th style="width: 10%;">Expert Name</th>
          <th style="width: 11%;">Remark</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!requestData.items || requestData.items.length === 0">
          <td colspan="10" class="no-items">No items in this request</td>
        </tr>
        <tr v-for="(item, index) in requestData.items" :key="index">
          <td>{{ index + 1 }}</td>
          <td class="text-left">{{ getItemName(item) }}</td>
          <td>{{ getItemUOM(item) || 'Pcs' }}</td>
          <td class="font-bold">{{ formatQuantity(item.quantity) }}</td>
          <td>{{ getItemBrand(item) || '-' }}</td>
          <td>{{ getItemModel(item) || '-' }}</td>
          <td class="spec-cell">{{ getItemSpecification(item) || '-' }}</td>

          <!-- Department - Merged across all rows -->
          <td
            v-if="index === 0"
            :rowspan="requestData.items.length"
            class="dept-cell"
          >
            {{ requestData.department || 'N/A' }}
          </td>

          <!-- Expert Name - Merged across all rows -->
          <td
            v-if="index === 0"
            :rowspan="requestData.items.length"
            class="expert-cell"
          >
            {{ requestData.expertName || 'N/A' }}
          </td>

          <!-- ✅ Remark - Smart merge: Only render if NOT part of a merged group -->
          <td
            v-if="shouldRenderRemark(index)"
            :rowspan="getRemarkRowspan(index)"
            class="remark-cell"
          >
            {{ getItemRemark(item) || '-' }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ==================== PREPARED BY & APPROVED BY ==================== -->
    <table class="signature-table">
      <tr>
        <td class="signature-cell">
          <div class="signature-title">Prepared by</div>
          <div class="signature-body">
            <p><strong>Name:-</strong> {{ requestData.preparedBy || 'N/A' }}</p>
            <p><strong>Signature:-</strong> _______________________</p>
          </div>
        </td>
        <td class="signature-cell">
          <div class="signature-title">Approved By</div>
          <div class="signature-body">
            <p><strong>Name:-</strong> ____________________</p>
            <p><strong>Signature:-</strong> _______________________</p>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <div v-else-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading purchase request data...</p>
  </div>

  <div v-else class="error-state">
    <div class="error-icon">❌</div>
    <h2>Purchase Request Not Found</h2>
    <p>The purchase request you're looking for doesn't exist or has been removed.</p>
    <button class="btn-back" @click="goBack">← Back to Purchase Requests</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// ================================================================
// TYPES
// ================================================================

interface PurchaseItem {
  id: number;
  name: string;
  code: string;
  brand?: string;
  model?: string;
  uom: string;
  quantity: number;
  specification?: string;
  remark?: string;
}

interface PurchaseRequest {
  id: number;
  prNumber: string;
  department?: string;
  expertName?: string;
  preparedBy?: string;
  requestedBy: string;
  requestedDate: string;
  requiredDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseItem[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ================================================================
// DEMO DATA
// ================================================================

const DEMO_REQUESTS: PurchaseRequest[] = [
  {
    id: 1,
    prNumber: "PR-2026-001",
    department: "ኦፊስ ተ/ዳ/ር",
    expertName: "Mesfin Endris(0911993351)",
    preparedBy: "LUKAS BULTUMO",
    requestedBy: "Fantabil W.",
    requestedDate: "2026-09-01",
    requiredDate: "2026-09-20",
    priority: "high",
    status: "pending",
    notes: "Urgent order for the new production line.",
    items: [
      { 
        id: 1, 
        name: "L3150 COLOUR PRINTER WASTE PAD", 
        code: "SDT000101", 
        brand: "", 
        model: "", 
        uom: "Pcs", 
        quantity: 2, 
        specification: "", 
        remark: "ለአሳታሚ ዲፓርትመንት በቀጣይ የሚገዛ" 
      },
      { 
        id: 2, 
        name: "IR CANON 2318 PHOTO COPY PRESSURE ROLLER", 
        code: "SDT000102", 
        brand: "", 
        model: "", 
        uom: "Pcs", 
        quantity: 1, 
        specification: "", 
        remark: "ለአሳታሚ ዲፓርትመንት በቀጣይ የሚገዛ" 
      },
      { 
        id: 3, 
        name: "PRINTER FRONT DOOR", 
        code: "SDT000103", 
        brand: "", 
        model: "HP laser jet P2035", 
        uom: "Pcs", 
        quantity: 1, 
        specification: "", 
        remark: "ለማምረቻ ዲፓርትመንት በቀጣይ የሚገዛ" 
      }
    ],
    createdAt: "2026-09-01T08:30:00.000Z"
  }
];

// ================================================================
// STATE
// ================================================================

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const requestData = ref<PurchaseRequest | null>(null)

// ================================================================
// COMPUTED - REMARK MERGE GROUPS
// ================================================================

/**
 * Compute remark groups: which remark belongs to which range of items
 * This builds an array of { remark, startIndex, rowspan } for sequential identical remarks
 */
const remarkGroups = computed(() => {
  if (!requestData.value?.items || requestData.value.items.length === 0) {
    return [];
  }

  const groups: Array<{ remark: string; startIndex: number; rowspan: number }> = [];
  const items = requestData.value.items;

  let currentRemark: string | null = null;
  let startIndex = 0;
  let count = 0;

  items.forEach((item, index) => {
    const remark = (item.remark || '').trim();

    if (currentRemark === null) {
      // First item
      currentRemark = remark;
      startIndex = index;
      count = 1;
    } else if (remark === currentRemark) {
      // Same remark → extend the group
      count++;
    } else {
      // Different remark → close current group, start new one
      groups.push({
        remark: currentRemark,
        startIndex,
        rowspan: count,
      });
      currentRemark = remark;
      startIndex = index;
      count = 1;
    }
  });

  // Push the last group
  if (count > 0) {
    groups.push({
      remark: currentRemark || '',
      startIndex,
      rowspan: count,
    });
  }

  return groups;
});

// ================================================================
// DATA LOADING
// ================================================================

const loadRequest = async (requestId: string) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const found = DEMO_REQUESTS.find(r => String(r.id) === requestId);

    if (found) {
      requestData.value = found;
      console.log('✅ Purchase request loaded:', requestData.value);
    } else {
      console.warn('❌ Purchase request not found');
    }
  } catch (error) {
    console.error('Load request error:', error)
  } finally {
    loading.value = false
  }
}

// ================================================================
// HELPERS
// ================================================================

const getItemName = (item: any): string => {
  if (!item) return 'Unknown Item'
  if (item.name) return item.name
  if (item.item?.name) return item.item.name
  return 'Unknown Item'
}

const getItemBrand = (item: any): string => {
  if (!item) return ''
  if (item.brand) return item.brand
  if (item.item?.brand) return item.item.brand
  return ''
}

const getItemModel = (item: any): string => {
  if (!item) return ''
  if (item.model) return item.model
  if (item.item?.model) return item.item.model
  return ''
}

const getItemUOM = (item: any): string => {
  if (!item) return ''
  if (item.uom) return item.uom
  if (item.uom_code) return item.uom_code
  if (item.item?.uom?.code) return item.item.uom.code
  return ''
}

const getItemSpecification = (item: any): string => {
  if (!item) return ''
  if (item.specification) return item.specification
  if (item.item?.specText) return item.item.specText
  if (item.specText) return item.specText
  return ''
}

const getItemRemark = (item: any): string => {
  if (!item) return ''
  return item.remark || ''
}

// ================================================================
// REMARK MERGE HELPERS
// ================================================================

/**
 * Check if this item index should render the remark cell
 * (Only the FIRST item of each remark group renders the cell)
 */
const shouldRenderRemark = (index: number): boolean => {
  return remarkGroups.value.some(group => group.startIndex === index);
};

/**
 * Get the rowspan for this item's remark cell
 * Returns the size of the remark group if this is the start index, otherwise 1
 */
const getRemarkRowspan = (index: number): number => {
  const group = remarkGroups.value.find(g => g.startIndex === index);
  return group ? group.rowspan : 1;
};

// ================================================================
// FORMATTING
// ================================================================

const formatQuantity = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || num === 0) return '0'
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(2)
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// ================================================================
// NAVIGATION
// ================================================================

const goBack = (): void => {
  router.push('/purchase-requests')
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
    await loadRequest(requestId)
  } else {
    loading.value = false
    console.warn('No request ID provided')
  }
})
</script>

<style scoped>
/* ================================================================ */
/* PAGE SETUP & INTERACTIVE UI */
/* ================================================================ */
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

/* ================================================================ */
/* FORM COMPONENT TYPOGRAPHY & HEADERS */
/* ================================================================ */
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

/* ================================================================ */
/* PR NO & DATE ROW - TABLE BASED (PRINT-SAFE) */
/* ================================================================ */
.info-row-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
  border: none;
}

.info-row-table tr {
  border: none;
}

.info-row-table td {
  border: none;
  padding: 0;
  font-size: 13px;
  vertical-align: middle;
}

.info-left {
  text-align: left;
  width: 50%;
}

.info-right {
  text-align: right;
  width: 50%;
}

/* ================================================================ */
/* TABLE CONFIGURATION */
/* ================================================================ */
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

.dept-cell {
  font-size: 13px;
  font-weight: 600;
  vertical-align: middle !important;
  padding: 8px !important;
}

.expert-cell {
  font-size: 12px;
  font-weight: 600;
  vertical-align: middle !important;
  padding: 8px !important;
}

/* ✅ Remark cell - Merged style */
.remark-cell {
  font-size: 11px;
  line-height: 1.4;
  vertical-align: middle !important;
  padding: 6px 8px !important;
  text-align: center;
}

/* ================================================================ */
/* SIGNATURE SECTION - SIMPLE TABLE, ALWAYS SIDE BY SIDE */
/* ================================================================ */
.signature-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
  border: none;
}

.signature-table tr {
  border: none;
}

.signature-cell {
  width: 50%;
  vertical-align: top;
  padding: 10px 20px;
  border: none;
  text-align: left;
}

.signature-cell:first-child {
  padding-left: 0;
}

.signature-cell:last-child {
  padding-right: 0;
}

.signature-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #1a1a1a;
  font-style: italic;
}

.signature-body {
  font-size: 13px;
}

.signature-body p {
  margin: 8px 0;
  line-height: 1.6;
}

.signature-body strong {
  font-weight: 600;
  color: #333;
}

/* ================================================================ */
/* LOADING & ERROR */
/* ================================================================ */
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

/* ================================================================ */
/* PRINT OVERRIDES */
/* ================================================================ */
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

  .items-table th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    background-color: #d9d9d9 !important;
    color: #000000 !important;
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

  /* INFO ROW - PR NO & DATE SIDE BY SIDE */
  .info-row-table {
    width: 100% !important;
    display: table !important;
    table-layout: fixed !important;
    margin-bottom: 10px !important;
  }

  .info-row-table td {
    display: table-cell !important;
    font-size: 11px !important;
  }

  .info-left {
    text-align: left !important;
    width: 50% !important;
  }

  .info-right {
    text-align: right !important;
    width: 50% !important;
  }

  /* SIGNATURE TABLE - ALWAYS SIDE BY SIDE */
  .signature-table {
    width: 100% !important;
    display: table !important;
    table-layout: fixed !important;
    margin-top: 20px !important;
    page-break-inside: avoid !important;
  }

  .signature-cell {
    display: table-cell !important;
    width: 50% !important;
    vertical-align: top !important;
    padding: 5px 10px !important;
  }

  .signature-title {
    font-size: 13px !important;
  }

  .signature-body {
    font-size: 11px !important;
  }

  .items-table tr {
    page-break-inside: avoid !important;
  }

  @page {
    size: landscape;
    margin: 10mm;
  }
}

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 768px) {
  .print-page {
    padding: 10px;
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

  .info-row-table td {
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

  .signature-cell {
    padding: 5px;
  }
}
</style>