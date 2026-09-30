<template>
  <div class="page-shell">
    <!-- ============================================================
         TOP BAR
         ============================================================ -->
    <div class="top-bar">
      <div class="top-bar-left">
        <button class="btn-back" @click="goBack">← Back</button>
        <div>
          <h1 class="page-title">Item Returns</h1>
          <p class="page-subtitle">Demo — returns are stored in memory only</p>
        </div>
      </div>

      <div class="top-bar-right">
        <input
          v-model="searchQuery"
          class="input search-input"
          type="text"
          placeholder="🔍 Search returns…"
        />
        <button class="btn-primary btn-lg" @click="openModal">
          ＋ Return Item
        </button>
      </div>
    </div>

    <!-- ============================================================
         SUMMARY STRIP
         ============================================================ -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-label">Total Returns</span>
        <span class="summary-value">{{ returns.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Pending</span>
        <span class="summary-value pending">{{ countByStatus('pending') }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Accepted</span>
        <span class="summary-value accepted">{{ countByStatus('accepted') }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Rejected</span>
        <span class="summary-value rejected">{{ countByStatus('rejected') }}</span>
      </div>
    </div>

    <!-- ============================================================
         RETURNS LIST
         ============================================================ -->
    <div class="list-card">
      <table class="returns-table">
        <thead>
          <tr>
            <th style="width: 9%;">Return #</th>
            <th style="width: 18%;">Item</th>
            <th style="width: 5%;">Qty</th>
            <th style="width: 14%;">From</th>
            <th style="width: 13%;">To Store</th>
            <th style="width: 14%;">Reason</th>
            <th style="width: 13%;">Remark</th>
            <th style="width: 9%;">Status</th>
            <th style="width: 8%;">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredReturns.length === 0">
            <td colspan="9" class="no-items">
              <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p>No returns match your search.</p>
                <button class="btn-secondary" @click="openModal">
                  ＋ Return your first item
                </button>
              </div>
            </td>
          </tr>

          <tr v-for="r in filteredReturns" :key="r.id">
            <td class="font-bold">{{ r.returnCode }}</td>
            <td class="text-left">
              <div class="item-name">{{ r.itemName }}</div>
              <div class="item-meta">{{ r.itemCode }} · {{ r.brand }} {{ r.model }}</div>
            </td>
            <td class="font-bold">{{ r.qty }} <span class="uom">{{ r.uom }}</span></td>
            <td>
              <div>{{ r.returnedByName }}</div>
              <div v-if="r.department" class="item-meta">{{ r.department }}</div>
            </td>
            <td>{{ r.storeName }}</td>
            <td class="reason-cell">{{ r.reason }}</td>
            <td class="text-left remark-cell">
              <span v-if="r.remark">{{ r.remark }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td>
              <span class="status-badge" :class="'status-' + r.status">
                {{ statusLabel(r.status) }}
              </span>
            </td>
            <td>{{ formatDate(r.submittedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ============================================================
         RETURN ITEM MODAL
         ============================================================ -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Return Item</h2>
          <button class="modal-close" @click="closeModal">✖</button>
        </div>

        <div class="modal-body">
          <!-- Who + Where -->
          <div class="modal-section">
            <div class="modal-section-label">1. Returning From / To</div>

            <div class="field-grid">
              <div class="field">
                <label>Department <span class="req">*</span></label>
                <select v-model="form.department" class="input">
                  <option value="" disabled>Select department…</option>
                  <option v-for="d in demoDepartments" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>

              <div class="field">
                <label>Name <span class="req">*</span></label>
                <input
                  v-model="form.returnedByName"
                  class="input"
                  type="text"
                  placeholder="e.g. Biruk Mulualem"
                />
              </div>

              <div class="field">
                <label>Return To Store <span class="req">*</span></label>
                <select v-model="form.storeId" class="input">
                  <option value="" disabled>Select…</option>
                  <option v-for="s in demoStores" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Item picker -->
          <div class="modal-section">
            <div class="modal-section-label">2. Select Item <span class="req">*</span></div>

            <input
              v-model="itemSearch"
              class="input"
              type="text"
              placeholder="🔍 Search item by name, code, brand…"
            />

            <div class="item-picker">
              <div
                v-for="item in filteredItems"
                :key="item.id"
                class="item-option"
                :class="{ selected: form.itemId === item.id }"
                @click="selectItem(item)"
              >
                <div class="item-option-info">
                  <div class="item-option-name">{{ item.name }}</div>
                  <div class="item-option-meta">
                    {{ item.code }} · {{ item.brand }} {{ item.model }} · {{ item.uom }}
                  </div>
                </div>
                <div class="item-option-right">
                  <div class="item-option-qty">
                    Issued: <strong>{{ item.qtyIssued }}</strong>
                  </div>
                  <div v-if="form.itemId === item.id" class="item-option-check">✓</div>
                </div>
              </div>

              <div v-if="filteredItems.length === 0" class="no-items">
                No matching items
              </div>
            </div>

            <div v-if="selectedItem" class="qty-block">
              <div class="field">
                <label>
                  Return Qty <span class="req">*</span>
                  <span class="qty-hint">(max {{ selectedItem.qtyIssued }})</span>
                </label>
                <input
                  v-model.number="form.qty"
                  class="input qty-input"
                  type="number"
                  min="1"
                  :max="selectedItem.qtyIssued"
                />
              </div>
            </div>
          </div>

          <!-- Reason + remark -->
          <div class="modal-section">
            <div class="modal-section-label">3. Reason &amp; Remark</div>

            <div class="field">
              <label>Reason <span class="req">*</span></label>
              <select v-model="form.reason" class="input">
                <option value="" disabled>Select reason…</option>
                <option v-for="r in demoReasons" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>

            <div class="field">
              <label>Remark (optional)</label>
              <textarea
                v-model="form.remark"
                class="input textarea"
                rows="3"
                placeholder="e.g. Item in good condition, original box included…"
              ></textarea>
            </div>
          </div>

          <p v-if="attemptSubmit && !canSubmit" class="validation-hint">
            Please fill all required fields (*) before submitting.
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button
            class="btn-primary"
            :disabled="!canSubmit"
            @click="submitReturn"
          >📩 Send Return Request</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ================================================================
// TYPES
// ================================================================

interface ReturnRecord {
  id: number
  returnCode: string
  itemId: number
  itemCode: string
  itemName: string
  brand: string
  model: string
  uom: string
  qty: number
  returnedByName: string
  department: string
  storeId: number
  storeName: string
  reason: string
  remark: string
  status: 'pending' | 'accepted' | 'rejected'
  submittedAt: string
}

interface DemoItem {
  id: number
  code: string
  name: string
  brand: string
  model: string
  uom: string
  qtyIssued: number
}

// ================================================================
// DEMO DATA
// ================================================================

const demoDepartments = [
  'IT Department',
  'Finance',
  'Operations',
  'HR',
  'Administration',
  'Sales',
  'Marketing',
  'Procurement',
  'Maintenance',
]

const demoStores = [
  { id: 1, name: 'MainStore 1 (Yeshi)' },
  { id: 2, name: 'MainStore 2 (Warehouse)' },
  { id: 3, name: 'Foreign Purchase' },
  { id: 4, name: 'IT Store' },
]

const demoReasons = [
  'Employee Terminated',
  'Employee Resigned',
  'Employee Transferred',
  'End of Contract',
  'Unused — Project Cancelled',
  'Replaced by Newer Model',
  'Damaged in Use',
  'Wrong Item Issued',
  'Excess Quantity',
  'Retirement / End of Life',
  'Other',
]

const demoItems = ref<DemoItem[]>([
  { id: 1, code: 'ITM-001', name: 'Dell Latitude 5520 Laptop',  brand: 'Dell',      model: 'L5520',    uom: 'Pcs', qtyIssued: 2 },
  { id: 2, code: 'ITM-002', name: 'Logitech MX Master 3 Mouse', brand: 'Logitech',  model: 'MX3',      uom: 'Pcs', qtyIssued: 5 },
  { id: 3, code: 'ITM-003', name: 'HP 24" Monitor',             brand: 'HP',        model: 'E24i',     uom: 'Pcs', qtyIssued: 3 },
  { id: 4, code: 'ITM-004', name: 'Canon LBP Laser Printer',    brand: 'Canon',     model: 'LBP2900',  uom: 'Pcs', qtyIssued: 1 },
  { id: 5, code: 'ITM-005', name: 'Epson Projector',            brand: 'Epson',     model: 'EB-X51',   uom: 'Pcs', qtyIssued: 1 },
  { id: 6, code: 'ITM-006', name: 'Cisco Network Switch',       brand: 'Cisco',     model: 'SG350',    uom: 'Pcs', qtyIssued: 2 },
  { id: 7, code: 'ITM-007', name: 'APC UPS 1500VA',             brand: 'APC',       model: 'BXR1500',  uom: 'Pcs', qtyIssued: 4 },
  { id: 8, code: 'ITM-008', name: 'Samsung 1TB SSD',            brand: 'Samsung',   model: '870 EVO',  uom: 'Pcs', qtyIssued: 10 },
  { id: 9, code: 'ITM-009', name: 'Logitech C920 Webcam',       brand: 'Logitech',  model: 'C920',     uom: 'Pcs', qtyIssued: 3 },
  { id: 10, code: 'ITM-010', name: 'Steelcase Office Chair',    brand: 'Steelcase', model: 'Series 1', uom: 'Pcs', qtyIssued: 6 },
])

const returns = ref<ReturnRecord[]>([
  {
    id: 1,
    returnCode: 'RET-2026-001',
    itemId: 3,
    itemCode: 'ITM-003',
    itemName: 'HP 24" Monitor',
    brand: 'HP', model: 'E24i', uom: 'Pcs',
    qty: 1,
    returnedByName: 'Biruk Mulualem',
    department: 'IT Department',
    storeId: 1, storeName: 'MainStore 1 (Yeshi)',
    reason: 'Replaced by Newer Model',
    remark: 'Original box and cables included',
    status: 'accepted',
    submittedAt: '2026-09-20T09:15:00.000Z',
  },
  {
    id: 2,
    returnCode: 'RET-2026-002',
    itemId: 8,
    itemCode: 'ITM-008',
    itemName: 'Samsung 1TB SSD',
    brand: 'Samsung', model: '870 EVO', uom: 'Pcs',
    qty: 2,
    returnedByName: 'Abebe Kebede',
    department: 'Finance',
    storeId: 4, storeName: 'IT Store',
    reason: 'Employee Terminated',
    remark: 'Returned after employee exit clearance',
    status: 'pending',
    submittedAt: '2026-09-24T13:40:00.000Z',
  },
  {
    id: 3,
    returnCode: 'RET-2026-003',
    itemId: 7,
    itemCode: 'ITM-007',
    itemName: 'APC UPS 1500VA',
    brand: 'APC', model: 'BXR1500', uom: 'Pcs',
    qty: 1,
    returnedByName: 'Sara Haile',
    department: 'Operations',
    storeId: 2, storeName: 'MainStore 2 (Warehouse)',
    reason: 'Damaged in Use',
    remark: 'Battery not holding charge — needs inspection',
    status: 'rejected',
    submittedAt: '2026-09-25T10:05:00.000Z',
  },
  {
    id: 4,
    returnCode: 'RET-2026-004',
    itemId: 2,
    itemCode: 'ITM-002',
    itemName: 'Logitech MX Master 3 Mouse',
    brand: 'Logitech', model: 'MX3', uom: 'Pcs',
    qty: 1,
    returnedByName: 'Biruk Mulualem',
    department: 'IT Department',
    storeId: 4, storeName: 'IT Store',
    reason: 'Employee Resigned',
    remark: 'Never opened',
    status: 'pending',
    submittedAt: '2026-09-27T08:20:00.000Z',
  },
])

// ================================================================
// LIST STATE
// ================================================================

const searchQuery = ref('')

const filteredReturns = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return returns.value
  return returns.value.filter(r =>
    r.returnCode.toLowerCase().includes(q) ||
    r.itemName.toLowerCase().includes(q) ||
    r.itemCode.toLowerCase().includes(q) ||
    r.returnedByName.toLowerCase().includes(q) ||
    r.department.toLowerCase().includes(q) ||
    r.storeName.toLowerCase().includes(q) ||
    r.reason.toLowerCase().includes(q) ||
    r.remark.toLowerCase().includes(q)
  )
})

const countByStatus = (s: ReturnRecord['status']) =>
  returns.value.filter(r => r.status === s).length

const statusLabel = (s: ReturnRecord['status']) =>
  s === 'pending' ? '🟡 Pending'
  : s === 'accepted' ? '🟢 Accepted'
  : '🔴 Rejected'

// ================================================================
// MODAL STATE
// ================================================================

const showModal = ref(false)
const itemSearch = ref('')
const attemptSubmit = ref(false)

const form = ref({
  department: '',
  returnedByName: '',
  storeId: '' as number | '',
  itemId: 0,
  qty: 1,
  reason: '',
  remark: '',
})

const filteredItems = computed(() => {
  const q = itemSearch.value.trim().toLowerCase()
  if (!q) return demoItems.value
  return demoItems.value.filter(it =>
    it.name.toLowerCase().includes(q) ||
    it.code.toLowerCase().includes(q) ||
    it.brand.toLowerCase().includes(q) ||
    it.model.toLowerCase().includes(q)
  )
})

const selectedItem = computed<DemoItem | null>(() => {
  if (!form.value.itemId) return null
  return demoItems.value.find(i => i.id === form.value.itemId) ?? null
})

const canSubmit = computed(() => {
  return (
    !!form.value.department &&
    form.value.returnedByName.trim().length > 0 &&
    !!form.value.storeId &&
    !!form.value.itemId &&
    !!form.value.reason &&
    form.value.qty > 0 &&
    (!selectedItem.value || form.value.qty <= selectedItem.value.qtyIssued)
  )
})

// ================================================================
// MODAL ACTIONS
// ================================================================

const openModal = () => {
  resetForm()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  attemptSubmit.value = false
}

const resetForm = () => {
  form.value = {
    department: '',
    returnedByName: '',
    storeId: '',
    itemId: 0,
    qty: 1,
    reason: '',
    remark: '',
  }
  itemSearch.value = ''
  attemptSubmit.value = false
}

const selectItem = (item: DemoItem) => {
  form.value.itemId = item.id
  form.value.qty = Math.min(form.value.qty || 1, item.qtyIssued)
}

// ================================================================
// SUBMIT
// ================================================================

const submitReturn = () => {
  attemptSubmit.value = true
  if (!canSubmit.value) return

  const store = demoStores.find(s => s.id === form.value.storeId)!
  const item = demoItems.value.find(i => i.id === form.value.itemId)!

  const nextId = returns.value.length
    ? Math.max(...returns.value.map(r => r.id)) + 1
    : 1

  const year = new Date().getFullYear()
  const returnCode = `RET-${year}-${String(nextId).padStart(3, '0')}`

  const newReturn: ReturnRecord = {
    id: nextId,
    returnCode,
    itemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    brand: item.brand,
    model: item.model,
    uom: item.uom,
    qty: form.value.qty,
    returnedByName: form.value.returnedByName.trim(),
    department: form.value.department,
    storeId: store.id,
    storeName: store.name,
    reason: form.value.reason,
    remark: form.value.remark.trim(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
  }

  returns.value = [newReturn, ...returns.value]
  closeModal()
}

// ================================================================
// HELPERS
// ================================================================

const formatDate = (iso: string): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
/* ================================================================
   PAGE SHELL
   ================================================================ */
.page-shell {
  font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
  max-width: 1500px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 40px;
  background: #f1f5f9;
  min-height: 100vh;
  color: #0f172a;
  box-sizing: border-box;
}

/* ================================================================
   TOP BAR
   ================================================================ */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 22px;
  padding: 20px 26px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  justify-content: flex-end;
}

.btn-back {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
}

.btn-back:hover {
  background: #e2e8f0;
}

.page-title {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.page-subtitle {
  margin: 4px 0 0 0;
  font-size: 12.5px;
  color: #64748b;
  font-style: italic;
}

.search-input {
  min-width: 340px;
  max-width: 420px;
  font-size: 13.5px;
}

/* ================================================================
   SUMMARY STRIP
   ================================================================ */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}

.summary-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.summary-label {
  font-size: 11.5px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
}

.summary-value {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.summary-value.pending { color: #d97706; }
.summary-value.accepted { color: #16a34a; }
.summary-value.rejected { color: #dc2626; }

/* ================================================================
   LIST CARD
   ================================================================ */
.list-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.returns-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  table-layout: fixed;
}

.returns-table th,
.returns-table td {
  padding: 16px 14px;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  word-wrap: break-word;
}

.returns-table th {
  background: #c8c8c8;
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.4px;
  color: #000;
  border-bottom: 1px solid #94a3b8;
  text-transform: uppercase;
}

.returns-table tbody tr {
  transition: background 0.12s ease;
}

.returns-table tbody tr:hover {
  background: #f8fafc;
}

.returns-table td.text-left {
  text-align: left;
}

.font-bold {
  font-weight: 700;
}

.item-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 13.5px;
}

.item-meta {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 3px;
}

.uom {
  font-size: 11.5px;
  color: #64748b;
  font-weight: 500;
}

.reason-cell {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.remark-cell {
  font-size: 13px;
  line-height: 1.4;
}

.muted {
  color: #94a3b8;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-accepted {
  background: #dcfce7;
  color: #166534;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* Empty state */
.no-items {
  padding: 60px 20px !important;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 10px 0;
  color: #64748b;
  font-style: italic;
  font-size: 14px;
}

/* ================================================================
   MODAL
   ================================================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  width: 100%;
  max-width: 900px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(14px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  padding: 6px 10px;
  border-radius: 6px;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 28px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 14px 14px;
}

/* Modal sections */
.modal-section {
  margin-bottom: 26px;
}

.modal-section:last-child {
  margin-bottom: 0;
}

.modal-section-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 14px;
  padding-bottom: 7px;
  border-bottom: 1px solid #e2e8f0;
}

/* Field grid */
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.req {
  color: #dc2626;
  font-weight: 700;
}

.qty-hint {
  font-weight: 400;
  color: #64748b;
  font-size: 11.5px;
  margin-left: 5px;
}

.input {
  width: 100%;
  padding: 10px 14px;
  font-size: 13.5px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #ffffff;
  color: #0f172a;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.qty-block {
  margin-top: 14px;
  max-width: 260px;
}

.qty-input {
  text-align: center;
  font-weight: 600;
  font-size: 14px;
}

/* ================================================================
   ITEM PICKER
   ================================================================ */
.item-picker {
  margin-top: 12px;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #f8fafc;
}

.item-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background 0.12s ease;
}

.item-option:last-child {
  border-bottom: none;
}

.item-option:hover {
  background: #eff6ff;
}

.item-option.selected {
  background: #dbeafe;
  border-left: 4px solid #2563eb;
  padding-left: 14px;
}

.item-option-info {
  flex: 1;
  min-width: 0;
}

.item-option-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.item-option-meta {
  font-size: 12px;
  color: #64748b;
  margin-top: 3px;
}

.item-option-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.item-option-qty {
  font-size: 12.5px;
  color: #475569;
}

.item-option-check {
  width: 26px;
  height: 26px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
}

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-primary,
.btn-secondary {
  padding: 10px 22px;
  font-size: 13.5px;
  font-weight: 600;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: filter 0.15s ease, background-color 0.15s ease;
  white-space: nowrap;
}

.btn-lg {
  padding: 11px 26px;
  font-size: 14px;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
}

.btn-primary:disabled {
  background: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* ================================================================
   VALIDATION
   ================================================================ */
.validation-hint {
  margin: 8px 0 0 0;
  font-size: 12.5px;
  color: #b91c1c;
  text-align: center;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1280px) {
  .page-shell {
    padding: 24px;
  }

  .search-input {
    min-width: 240px;
  }
}

@media (max-width: 900px) {
  .summary-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .top-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .top-bar-right {
    justify-content: stretch;
  }

  .search-input {
    min-width: 0;
    max-width: none;
  }

  .returns-table {
    font-size: 12px;
  }

  .returns-table th,
  .returns-table td {
    padding: 10px 6px;
  }
}

@media (max-width: 600px) {
  .page-shell {
    padding: 14px;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  .modal {
    max-height: 96vh;
  }

  .modal-body {
    padding: 18px 20px;
  }

  .modal-header,
  .modal-footer {
    padding: 16px 20px;
  }
}
</style>