<template>
  <div class="new-purchase-page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="$emit('cancel')">← Back</button>
        <div>
          <h1>New Purchase</h1>
          <p>Record a new in-transit purchase from a foreign supplier.</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn" @click="$emit('cancel')" :disabled="saving">Cancel</button>
        <button class="btn btn--primary" @click="save" :disabled="saving || !isValid">
          {{ saving ? 'Saving…' : 'Save Purchase' }}
        </button>
      </div>
    </header>

    <!-- ============================================================
         SECTION — Purchase Details
         ============================================================ -->
    <section class="form-section">
      <h2 class="section-title">Purchase Details</h2>
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Country *</label>
          <select v-model="form.country" class="field-input">
            <option value="China">🇨🇳 China</option>
            <option value="Dubai">🇦🇪 Dubai</option>
            <option value="India">🇮🇳 India</option>
          </select>
        </div>

        <div class="field">
          <label class="field-label">Proforma No *</label>
          <input
            v-model="form.proformaNo"
            type="text"
            class="field-input"
            placeholder="e.g. C-338"
          />
        </div>

        <div class="field">
          <label class="field-label">Purchase Date</label>
          <input v-model="form.purchaseDate" type="date" class="field-input" />
        </div>

        <div class="field">
          <label class="field-label">Containers (FCL/drum/bag/pcs)</label>
          <input
            v-model="form.containers"
            type="text"
            class="field-input"
            placeholder="e.g. 4*40''"
          />
        </div>

        <div class="field">
          <label class="field-label">Payment Term</label>
          <input
            v-model="form.paymentTerm"
            type="text"
            class="field-input"
            placeholder="e.g. 30 / 30 / 40"
          />
        </div>

        <div class="field">
          <label class="field-label">Currency</label>
          <select v-model="form.currency" class="field-input">
            <option value="USD">USD</option>
            <option value="RMB">RMB</option>
            <option value="EUR">EUR</option>
            <option value="ETB">ETB</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION — Supplier
         ============================================================ -->
    <section class="form-section">
      <h2 class="section-title">Supplier</h2>
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Company Name *</label>
          <input
            v-model="form.supplier"
            type="text"
            class="field-input"
            placeholder="e.g. SUZHOU FIRST PACKING MACHINERY"
          />
        </div>

        <div class="field">
          <label class="field-label">Contact Person</label>
          <input
            v-model="form.supplierContact"
            type="text"
            class="field-input"
            placeholder="e.g. ELEN"
          />
        </div>

        <div class="field">
          <label class="field-label">Phone</label>
          <input
            v-model="form.supplierPhone"
            type="text"
            class="field-input"
            placeholder="e.g. +86-13656210926"
          />
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION — Buyer
         ============================================================ -->
    <section class="form-section">
      <h2 class="section-title">Buyer</h2>
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Buyer</label>
          <input
            v-model="form.buyer"
            type="text"
            class="field-input"
            placeholder="e.g. ABG"
          />
        </div>

        <div class="field">
          <label class="field-label">Payment By</label>
          <input
            v-model="form.paymentBy"
            type="text"
            class="field-input"
            placeholder="e.g. from ABG balance"
          />
        </div>

        <div class="field">
          <label class="field-label">Transitor</label>
          <input
            v-model="form.transitor"
            type="text"
            class="field-input"
            placeholder="e.g. ZOOM"
          />
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION — Buyer from SDT
         ============================================================ -->
    <section class="form-section">
      <h2 class="section-title">Buyer from SDT</h2>
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Contact Person</label>
          <input
            v-model="form.sdtContact"
            type="text"
            class="field-input"
            placeholder="e.g. HENOS"
          />
        </div>

        <div class="field">
          <label class="field-label">Phone</label>
          <input
            v-model="form.sdtPhone"
            type="text"
            class="field-input"
            placeholder="e.g. 0933717171"
          />
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION — Items
         ============================================================ -->
    <section class="form-section">
      <div class="section-header-row">
        <h2 class="section-title">Items ({{ form.items.length }})</h2>
        <button class="btn btn--small" @click="addItem">＋ Add Item</button>
      </div>

      <div class="table-wrap">
        <table class="sub-table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Item Description</th>
              <th style="width: 200px;">Company</th>
              <th style="width: 90px;" class="right">Qty</th>
              <th style="width: 90px;">UOM</th>
              <th style="width: 80px;" class="right">×Conv</th>
              <th style="width: 80px;">Per</th>
              <th style="width: 160px;" class="right">Unit Price</th>
              <th style="width: 130px;" class="right">Discount</th>
              <th style="width: 150px;" class="right">Total</th>
              <th style="width: 50px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, i) in form.items" :key="i">
              <td>{{ i + 1 }}</td>
              <td>
                <input
                  v-model="it.itemName"
                  type="text"
                  class="cell-input cell-input--text"
                  placeholder="Item description"
                />
              </td>
              <td>
                <input
                  v-model="it.company"
                  type="text"
                  class="cell-input cell-input--text"
                  :placeholder="form.supplier || 'Company'"
                />
              </td>
              <td class="right">
                <input
                  v-model.number="it.quantity"
                  type="number"
                  min="0"
                  class="cell-input cell-input--number"
                  @input="recalcItem(it)"
                />
              </td>
              <td>
                <select
                  v-model="it.unit"
                  class="cell-select"
                  @change="recalcItem(it)"
                >
                  <option v-for="u in UOM_OPTIONS" :key="u" :value="u">{{ u }}</option>
                </select>
              </td>
              <td class="right">
                <input
                  v-model.number="it.conversion"
                  type="number"
                  min="0"
                  step="any"
                  class="cell-input cell-input--number"
                  @input="recalcItem(it)"
                />
              </td>
              <td>
                <select
                  v-model="it.priceUom"
                  class="cell-select"
                  @change="recalcItem(it)"
                >
                  <option v-for="u in UOM_OPTIONS" :key="u" :value="u">{{ u }}</option>
                </select>
              </td>
              <td class="right">
                <input
                  v-model.number="it.unitPriceNumber"
                  type="number"
                  min="0"
                  step="any"
                  class="cell-input cell-input--number"
                  @input="recalcItem(it)"
                />
                <div class="under-price">/ {{ it.priceUom || 'unit' }}</div>
              </td>
              <td class="right">
                <input
                  v-model.number="it.discountAmount"
                  type="number"
                  min="0"
                  step="any"
                  class="cell-input cell-input--number"
                  @input="recalcItem(it)"
                />
              </td>
              <td class="right cell-total">
                {{ formatMoney(it.totalPriceNumber, form.currency) }}
              </td>
              <td class="center">
                <button
                  class="icon-btn"
                  @click="removeItem(i)"
                  :disabled="form.items.length === 1"
                  title="Remove"
                >✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals panel -->
      <div class="totals-panel">
        <div class="totals-row">
          <span class="totals-label">Items Subtotal</span>
          <span class="totals-value">{{ formatMoney(itemsSubtotal, form.currency) }}</span>
        </div>

        <div class="totals-row">
          <span class="totals-label">Line Discounts</span>
          <span class="totals-value totals-value--red">
            −{{ formatMoney(lineDiscountsTotal, form.currency) }}
          </span>
        </div>

        <div class="totals-row totals-row--edit">
          <span class="totals-label">Proforma Discount</span>
          <span class="totals-edit">
            <span class="totals-currency">{{ form.currency }}</span>
            <input
              v-model.number="proformaDiscountAmount"
              type="number"
              min="0"
              step="any"
              class="cell-input cell-input--number"
            />
          </span>
        </div>

        <div class="totals-row totals-row--grand">
          <span class="totals-label">Grand Total</span>
          <span class="totals-value totals-value--grand">
            {{ formatMoney(grandTotal, form.currency) }}
          </span>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION — Notes
         ============================================================ -->
    <section class="form-section">
      <h2 class="section-title">Notes</h2>
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Freight / Con.</label>
          <input
            v-model="form.freight"
            type="text"
            class="field-input"
            placeholder="e.g. 2,135"
          />
        </div>

        <div class="field field--full">
          <label class="field-label">Remark</label>
          <textarea
            v-model="form.remark"
            class="field-input field-textarea"
            placeholder="e.g. HAS NO RCT"
            rows="3"
          />
        </div>
      </div>
    </section>

    <!-- Footer actions -->
    <div class="footer-actions">
      <button class="btn" @click="$emit('cancel')" :disabled="saving">Cancel</button>
      <button class="btn btn--primary" @click="save" :disabled="saving || !isValid">
        {{ saving ? 'Saving…' : 'Save Purchase' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

defineProps({
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['save', 'cancel'])

// ================================================================
// UOM
// ================================================================
const UOM_OPTIONS = [
  'SET', 'PCS', 'KG', 'G', 'TON', 'MTR', 'CM', 'MM',
  'ROLL', 'DRUM', 'BAG', 'BOX', 'CAN', 'LOT', 'PAIR',
  'UNIT', 'LTR', 'ML', 'SQM', '—',
]

// ================================================================
// FORM STATE
// ================================================================
const form = reactive({
  country: 'China',
  proformaNo: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  containers: '',
  paymentTerm: '',
  currency: 'USD',

  supplier: '',
  supplierContact: '',
  supplierPhone: '',

  buyer: '',
  paymentBy: '',
  transitor: '',

  sdtContact: '',
  sdtPhone: '',

  freight: '',
  remark: '',

  items: [makeEmptyItem()],
})

const proformaDiscountAmount = ref(0)

function makeEmptyItem() {
  return {
    itemName: '',
    company: '',
    quantity: 1,
    unit: 'SET',
    conversion: 1,
    priceUom: 'SET',
    unitPriceNumber: 0,
    discountAmount: 0,
    totalPriceNumber: 0,
    _subtotal: 0,
  }
}

// ================================================================
// ITEM OPERATIONS
// ================================================================
function addItem() {
  form.items.push(makeEmptyItem())
}

function removeItem(i) {
  if (form.items.length <= 1) return
  form.items.splice(i, 1)
}

function recalcItem(it) {
  const qty = Number(it.quantity) || 0
  const conv = Number(it.conversion) || 1
  const price = Number(it.unitPriceNumber) || 0
  const disc = Number(it.discountAmount) || 0

  const subtotal = qty * conv * price
  const total = Math.max(0, subtotal - disc)

  it._subtotal = +subtotal.toFixed(2)
  it.totalPriceNumber = +total.toFixed(2)
}

// ================================================================
// HELPERS
// ================================================================
function formatMoney(n, currency = 'USD') {
  const num = Number(n) || 0
  const parts = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency} ${parts}`
}

// ================================================================
// TOTALS
// ================================================================
const itemsSubtotal = computed(() =>
  form.items.reduce((s, it) => s + (Number(it._subtotal) || 0), 0)
)

const lineDiscountsTotal = computed(() =>
  form.items.reduce((s, it) => s + (Number(it.discountAmount) || 0), 0)
)

const grandTotal = computed(() => {
  const pd = Number(proformaDiscountAmount.value) || 0
  const t = itemsSubtotal.value - lineDiscountsTotal.value - pd
  return +Math.max(0, t).toFixed(2)
})

// ================================================================
// VALIDATION
// ================================================================
const isValid = computed(() => {
  if (!form.proformaNo.trim()) return false
  if (!form.supplier.trim()) return false
  if (form.items.length === 0) return false
  return form.items.every((it) => it.itemName.trim() !== '')
})

// ================================================================
// SAVE
// ================================================================
function save() {
  if (!isValid.value) return

  const payload = {
    country: form.country,
    flag: countryFlag(form.country),
    proformaNo: form.proformaNo.trim(),
    supplier: form.supplier.trim(),
    supplierContact: form.supplierContact.trim(),
    supplierPhone: form.supplierPhone.trim(),
    buyer: form.buyer.trim(),
    paymentBy: form.paymentBy.trim(),
    transitor: form.transitor.trim(),
    sdtContact: form.sdtContact.trim(),
    sdtPhone: form.sdtPhone.trim(),
    purchaseDate: form.purchaseDate,
    containers: form.containers.trim() || '—',
    paymentTerm: form.paymentTerm.trim() || '—',
    currency: form.currency,
    freight: form.freight.trim() || '',
    remark: form.remark.trim() || '',

    items: form.items.map((it) => ({
      itemName: it.itemName.trim(),
      company: it.company.trim() || form.supplier.trim(),
      quantity: Number(it.quantity) || 0,
      unit: it.unit,
      conversion: Number(it.conversion) || 1,
      priceUom: it.priceUom,
      unitPriceNumber: Number(it.unitPriceNumber) || 0,
      unitPrice: `${form.currency} ${Number(it.unitPriceNumber) || 0}`,
      discountAmount: Number(it.discountAmount) || 0,
      totalPriceNumber: Number(it.totalPriceNumber) || 0,
      totalPrice: `${form.currency} ${Number(it.totalPriceNumber) || 0}`,
    })),

    discountAmount: Number(proformaDiscountAmount.value) || 0,
    totalValueRaw: grandTotal.value,
    totalValue: `${form.currency} ${grandTotal.value.toLocaleString('en-US')}`,

    amountPaid: `${form.currency} 0`,
    paidValueRaw: 0,
    balance: `${form.currency} ${grandTotal.value.toLocaleString('en-US')}`,
    paidPercent: 0,
    paymentStatus: 'unpaid',
    payments: [],
  }

  emit('save', payload)
}

function countryFlag(country) {
  return { China: '🇨🇳', Dubai: '🇦🇪', India: '🇮🇳' }[country] || '🌍'
}
</script>

<style scoped>
.new-purchase-page {
  padding: 20px 24px;
  max-width: 1500px;
  margin: 0 auto;
  color: #1f2937;
  font-size: 13px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.header-left h1 { margin: 0 0 2px 0; font-size: 18px; font-weight: 700; }
.header-left p  { margin: 0; font-size: 12px; color: #6b7280; }
.header-actions { display: flex; gap: 6px; }

.btn {
  padding: 7px 12px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.btn:hover { background: #f9fafb; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #4f46e5; color: white; border-color: #4f46e5; }
.btn--primary:hover:not(:disabled) { background: #4338ca; }
.btn--small {
  padding: 5px 12px;
  font-size: 12px;
}
.btn-back {
  padding: 7px 12px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.btn-back:hover { background: #f9fafb; }

/* Sections */
.form-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6b7280;
  margin: 0 0 12px 0;
}
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.section-header-row .section-title { margin: 0; }

/* Form grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
.field { display: flex; flex-direction: column; gap: 4px; }
.field--full { grid-column: 1 / -1; }
.field-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
}
.field-input {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 12.5px;
  color: #111827;
  font-family: inherit;
  box-sizing: border-box;
  width: 100%;
}
.field-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
}
.field-textarea {
  resize: vertical;
  min-height: 60px;
  line-height: 1.5;
}

/* Tables */
.table-wrap {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow-x: auto;
}

.sub-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.sub-table thead th {
  text-align: left;
  padding: 8px 8px;
  background: #f9fafb;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.sub-table tbody td {
  padding: 6px 8px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: middle;
  white-space: nowrap;
}
.sub-table tbody tr:last-child td { border-bottom: none; }
.sub-table tbody tr:hover { background: #fafbfc; }
.sub-table .right { text-align: right; }
.sub-table .center { text-align: center; }

/* Editable cells */
.cell-input {
  border: 1px solid transparent;
  background: transparent;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  color: #111827;
  font-weight: 600;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.12s, background 0.12s;
}
.cell-input:hover {
  border-color: #e5e7eb;
  background: #fafbfc;
}
.cell-input:focus {
  outline: none;
  border-color: #4f46e5;
  background: white;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
}
.cell-input--number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.cell-input--text {
  font-weight: 500;
}

/* Selects */
.cell-select {
  border: 1px solid transparent;
  background: transparent;
  padding: 4px 18px 4px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  color: #4b5563;
  font-weight: 700;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%239ca3af' d='M0 0l5 6 5-6z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 4px center;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}
.cell-select:hover {
  border-color: #e5e7eb;
  background-color: #fafbfc;
}
.cell-select:focus {
  outline: none;
  border-color: #4f46e5;
  background-color: white;
}

/* Under price */
.under-price {
  font-size: 9.5px;
  color: #9ca3af;
  font-weight: 600;
  text-align: right;
  margin-top: 1px;
  white-space: nowrap;
}

/* Total */
.cell-total {
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Icon button */
.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-btn:hover:not(:disabled) { background: #fee2e2; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Totals panel */
.totals-panel {
  margin-top: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 520px;
  margin-left: auto;
}
.totals-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}
.totals-row--edit {
  padding: 8px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}
.totals-row--grand {
  padding-top: 8px;
  border-top: 2px solid #d1d5db;
}
.totals-label { font-weight: 600; color: #4b5563; }
.totals-value {
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.totals-value--red { color: #dc2626; }
.totals-value--grand {
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
}
.totals-edit {
  display: flex;
  align-items: center;
  gap: 6px;
}
.totals-currency {
  font-size: 11px;
  font-weight: 800;
  color: #6b7280;
}
.totals-edit .cell-input {
  width: 120px;
  border: 1px solid #d1d5db;
  background: white;
  text-align: right;
}

/* Footer actions */
.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 0 24px;
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
}
</style>