<template>
  <div class="proforma-detail-page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="$emit('back')">← Back</button>
        <div>
          <h1>Proforma {{ proforma.proformaNo }}</h1>
          <p>
            {{ proforma.flag }} {{ proforma.country }} ·
            {{ proforma.supplier }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn--primary" @click="$emit('add-payment', proforma)">
          + Record Payment
        </button>
      </div>
    </header>

    <!-- Purchase Details -->
    <section class="detail-section">
      <h2 class="section-title">Purchase Details</h2>

      <div class="info-blocks">
        <!-- Supplier -->
        <div class="info-block">
          <h3 class="info-block__title">Supplier</h3>
          <div class="info-row"><span class="k">Company</span><span class="v">{{ proforma.supplier }}</span></div>
          <div class="info-row"><span class="k">Contact Person</span><span class="v">{{ proforma.supplierContact || proforma.contactPerson || '—' }}</span></div>
          <div class="info-row"><span class="k">Phone</span><span class="v">{{ proforma.supplierPhone || '—' }}</span></div>
          <div class="info-row"><span class="k">Country</span><span class="v">{{ proforma.country }}</span></div>
        </div>

        <!-- Buyer -->
        <div class="info-block">
          <h3 class="info-block__title">Buyer</h3>
          <div class="info-row"><span class="k">Buyer</span><span class="v">{{ proforma.buyer || '—' }}</span></div>
          <div class="info-row"><span class="k">Payment By</span><span class="v">{{ proforma.paymentBy || '—' }}</span></div>
          <div class="info-row"><span class="k">Transitor</span><span class="v">{{ proforma.transitor || '—' }}</span></div>
        </div>

        <!-- Buyer from SDT -->
        <div class="info-block">
          <h3 class="info-block__title">Buyer from SDT</h3>
          <div class="info-row"><span class="k">Contact Person</span><span class="v">{{ proforma.sdtContact || '—' }}</span></div>
          <div class="info-row"><span class="k">Phone</span><span class="v">{{ proforma.sdtPhone || '—' }}</span></div>
        </div>

        <!-- Purchase -->
        <div class="info-block">
          <h3 class="info-block__title">Purchase</h3>
          <div class="info-row"><span class="k">Proforma No</span><span class="v">{{ proforma.proformaNo }}</span></div>
          <div class="info-row"><span class="k">Purchase Date</span><span class="v">{{ proforma.purchaseDate || '—' }}</span></div>
          <div class="info-row"><span class="k">Containers</span><span class="v">{{ proforma.containers || '—' }}</span></div>
          <div class="info-row"><span class="k">Payment Term</span><span class="v">{{ proforma.paymentTerm }}</span></div>
        </div>

        <!-- Money -->
        <div class="info-block">
          <h3 class="info-block__title">Money</h3>
          <div class="info-row"><span class="k">Total Price</span><span class="v">{{ proforma.totalValue }}</span></div>
          <div class="info-row"><span class="k">Amount Paid</span><span class="v">{{ proforma.amountPaid }}</span></div>
          <div class="info-row"><span class="k">Remaining</span><span class="v">{{ proforma.balance }}</span></div>
          <div class="info-row"><span class="k">Paid %</span><span class="v">{{ proforma.paidPercent }}%</span></div>
          <div class="info-row"><span class="k">Freight / Con.</span><span class="v">{{ proforma.freight || '—' }}</span></div>
          <div class="info-row"><span class="k">Remark</span><span class="v">{{ proforma.remark || '—' }}</span></div>
        </div>

        <!-- Received (Dubai only) -->
        <div class="info-block" v-if="proforma.receivedQty || proforma.grn">
          <h3 class="info-block__title">Received</h3>
          <div class="info-row"><span class="k">Received Qty</span><span class="v">{{ proforma.receivedQty || '—' }}</span></div>
          <div class="info-row"><span class="k">GRN</span><span class="v">{{ proforma.grn || '—' }}</span></div>
        </div>
      </div>
    </section>

    <!-- Items -->
    <section class="detail-section">
      <h2 class="section-title">
        Items ({{ items.length }})
        <span class="section-hint">
          Qty / UOM / Conversion / Unit Price / Discount are editable · totals recalculate automatically
        </span>
      </h2>

      <div class="table-wrap">
        <table class="sub-table sub-table--items">
          <thead>
            <tr>
              <th style="width: 36px;">#</th>
              <th>Item</th>
              <th style="width: 180px;">Company</th>
              <th style="width: 90px;" class="right">Qty</th>
              <th style="width: 90px;">UOM</th>
              <th style="width: 80px;" class="right">×Conv</th>
              <th style="width: 80px;">Per</th>
              <th style="width: 160px;" class="right">Unit Price</th>
              <th style="width: 130px;" class="right">Discount</th>
              <th style="width: 150px;" class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, i) in items" :key="i">
              <td>{{ i + 1 }}</td>
              <td class="item-name-cell">{{ it.itemName }}</td>

              <td>
                <input v-model="it.company" type="text" class="cell-input cell-input--text" />
              </td>

              <!-- Qty -->
              <td class="right">
                <input
                  v-model.number="it.quantity"
                  type="number"
                  min="0"
                  class="cell-input cell-input--number"
                  @input="recalcItem(it)"
                />
              </td>

              <!-- UOM -->
              <td>
                <select
                  v-model="it.unit"
                  class="cell-select cell-select--uom"
                  @change="recalcItem(it)"
                >
                  <option v-for="u in UOM_OPTIONS" :key="u" :value="u">{{ u }}</option>
                </select>
              </td>

              <!-- Conversion -->
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

              <!-- Per UOM -->
              <td>
                <select
                  v-model="it.priceUom"
                  class="cell-select cell-select--uom"
                  @change="recalcItem(it)"
                >
                  <option v-for="u in UOM_OPTIONS" :key="u" :value="u">{{ u }}</option>
                </select>
              </td>

              <!-- Unit Price -->
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

              <!-- Line Discount (money) -->
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

              <!-- Total (auto) -->
              <td class="right cell-total">
                {{ formatMoney(it.totalPriceNumber, it.currency) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals & Discounts panel -->
      <div class="totals-panel">
        <div class="totals-row">
          <span class="totals-label">Items Subtotal</span>
          <span class="totals-value">{{ formatMoney(itemsSubtotal, proforma.currency || 'USD') }}</span>
        </div>

        <div class="totals-row">
          <span class="totals-label">Line Discounts</span>
          <span class="totals-value totals-value--red">
            −{{ formatMoney(lineDiscountsTotal, proforma.currency || 'USD') }}
          </span>
        </div>

        <div class="totals-row totals-row--edit">
          <span class="totals-label">
            Proforma Discount
            <span class="totals-hint">fixed amount</span>
          </span>
          <span class="totals-edit">
            <span class="totals-currency">{{ proforma.currency || 'USD' }}</span>
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
            {{ formatMoney(grandTotal, proforma.currency || 'USD') }}
          </span>
        </div>
      </div>
    </section>

    <!-- Payment History -->
    <section class="detail-section">
      <h2 class="section-title">Payment History ({{ proforma.payments.length }})</h2>

      <div v-if="proforma.payments.length === 0" class="no-payments">
        No payments recorded yet.
      </div>

      <div v-else class="table-wrap">
        <table class="sub-table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th style="width: 70px;">%</th>
              <th style="width: 140px;" class="right">Amount</th>
              <th style="width: 90px;">Currency</th>
              <th style="width: 110px;">Date</th>
              <th style="width: 140px;">Method</th>
              <th style="width: 240px;">Paid From</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(pay, i) in proforma.payments" :key="i">
              <td>{{ i + 1 }}</td>
              <td>{{ pay.percent }}%</td>
              <td class="right">{{ pay.amount }}</td>
              <td><span class="currency-pill">{{ pay.currency }}</span></td>
              <td>{{ pay.date }}</td>
              <td>{{ pay.method }}</td>
              <td>
                <div class="origin">
                  <span>{{ pay.originIcon }}</span>
                  <span>
                    <span class="origin-name">{{ pay.originName }}</span>
                    <span class="origin-acct">{{ pay.originAccount }}</span>
                  </span>
                </div>
              </td>
              <td>{{ pay.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  proforma: { type: Object, required: true },
})

defineEmits(['back', 'add-payment'])

// ================================================================
// UOM OPTIONS
// ================================================================
const UOM_OPTIONS = [
  'SET', 'PCS', 'KG', 'G', 'TON', 'MTR', 'CM', 'MM',
  'ROLL', 'DRUM', 'BAG', 'BOX', 'CAN', 'LOT', 'PAIR',
  'UNIT', 'LTR', 'ML', 'SQM', '—',
]

// ================================================================
// LOCAL EDITABLE COPY
// ================================================================
const items = ref([])
const proformaDiscountAmount = ref(0)

watch(
  () => props.proforma,
  (p) => hydrate(p),
  { immediate: true }
)

function hydrate(p) {
  const src = p.items || []
  items.value = src.map((it) => {
    const quantity = Number(it.quantity) || 0
    const parsedPrice = parseNumeric(it.unitPrice)
    const currency = parseCurrency(it.unitPrice) || p.currency || 'USD'

    return {
      itemName: it.itemName,
      company: it.company || p.supplier,
      quantity,
      unit: it.unit || 'unit',
      conversion: Number(it.conversion) || 1,
      priceUom: it.priceUom || it.unit || 'unit',
      unitPriceNumber: parsedPrice,
      currency,
      discountAmount: Number(it.discountAmount) || 0,
      totalPriceNumber: Number(it.totalPriceNumber) || 0,
    }
  })
  items.value.forEach(recalcItem)
  proformaDiscountAmount.value = Number(p.discountAmount) || 0
}

// ================================================================
// HELPERS
// ================================================================
function parseNumeric(str) {
  if (str == null) return 0
  if (typeof str === 'number') return str
  const cleaned = String(str).replace(/[^0-9.\-]/g, '')
  const n = Number(cleaned)
  return isNaN(n) ? 0 : n
}

function parseCurrency(str) {
  if (!str) return null
  const m = String(str).match(/^([A-Z]{3})/)
  return m ? m[1] : null
}

function formatMoney(n, currency = 'USD') {
  const num = Number(n) || 0
  const parts = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency} ${parts}`
}

// ================================================================
// RECALC — Per line
// ------------------------------------------------------------------
// qtyInPriceUom = quantity × conversion
// subtotal      = qtyInPriceUom × unitPrice
// total         = subtotal − discountAmount
// ================================================================
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
// TOTALS
// ================================================================
const itemsSubtotal = computed(() =>
  items.value.reduce((sum, it) => sum + (Number(it._subtotal) || 0), 0)
)

const lineDiscountsTotal = computed(() =>
  items.value.reduce((sum, it) => sum + (Number(it.discountAmount) || 0), 0)
)

const grandTotal = computed(() => {
  const pd = Number(proformaDiscountAmount.value) || 0
  const t = itemsSubtotal.value - lineDiscountsTotal.value - pd
  return +Math.max(0, t).toFixed(2)
})
</script>

<style scoped>
.proforma-detail-page {
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
.btn--primary { background: #4f46e5; color: white; border-color: #4f46e5; }
.btn--primary:hover { background: #4338ca; }
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
.detail-section { margin-bottom: 20px; }
.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #6b7280;
  margin: 0 0 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.section-hint {
  font-size: 10.5px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: #9ca3af;
  font-style: italic;
}

/* Info blocks */
.info-blocks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.info-block {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 16px;
}
.info-block__title {
  margin: 0 0 8px 0;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #4f46e5;
  padding-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
}
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
  padding: 5px 0;
  border-bottom: 1px solid #f9fafb;
}
.info-row:last-child { border-bottom: none; }
.info-row .k { color: #6b7280; flex-shrink: 0; }
.info-row .v {
  color: #111827;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}

/* ================================================================
   TABLES — no truncation
   ================================================================ */
.table-wrap {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
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
.sub-table .no-wrap { white-space: nowrap; }

/* Item name — allowed to wrap, all else nowrap */
.item-name-cell {
  white-space: normal;
  word-break: break-word;
  line-height: 1.3;
  font-weight: 500;
  color: #111827;
  min-width: 180px;
  max-width: 280px;
}

/* ================================================================
   EDITABLE CELLS
   ================================================================ */
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
  font-size: 12px;
  font-family: inherit;
  color: #111827;
  font-weight: 700;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%239ca3af' d='M0 0l5 6 5-6z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 4px center;
}
.cell-select:hover {
  border-color: #e5e7eb;
  background-color: #fafbfc;
}
.cell-select:focus {
  outline: none;
  border-color: #4f46e5;
  background-color: white;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
}
.cell-select--uom {
  text-transform: uppercase;
  letter-spacing: 0.2px;
  color: #4b5563;
  font-size: 11px;
}

/* Under price — "/ UOM" */
.under-price {
  font-size: 9.5px;
  color: #9ca3af;
  font-weight: 600;
  text-align: right;
  margin-top: 1px;
  white-space: nowrap;
}

/* Total cell */
.cell-total {
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ================================================================
   TOTALS PANEL
   ================================================================ */
.totals-panel {
  margin-top: 10px;
  background: white;
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
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}
.totals-row--grand {
  padding-top: 8px;
  border-top: 2px solid #e5e7eb;
}
.totals-label {
  font-weight: 600;
  color: #4b5563;
}
.totals-hint {
  font-size: 10.5px;
  font-weight: 500;
  color: #9ca3af;
  font-style: italic;
  margin-left: 4px;
}
.totals-value {
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.totals-value--red {
  color: #dc2626;
}
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

/* Currency pill */
.currency-pill {
  display: inline-block;
  padding: 2px 8px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

/* Origin */
.origin { display: flex; align-items: center; gap: 6px; }
.origin-name {
  display: block;
  font-weight: 600;
  color: #111827;
  font-size: 11.5px;
}
.origin-acct {
  display: block;
  font-size: 10.5px;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}

/* Empty */
.no-payments {
  padding: 20px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  background: white;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
}
</style>