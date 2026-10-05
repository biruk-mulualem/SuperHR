<template>
  <!-- NEW PURCHASE PAGE -->
  <NewPurchasePage
    v-if="showNewPurchase"
    :saving="savingNewPurchase"
    @save="handleSaveNewPurchase"
    @cancel="closeNewPurchase"
  />

  <!-- DETAIL PAGE -->
  <ProformaDetailPage
    v-else-if="selectedProforma"
    :proforma="selectedProforma"
    @back="closeDetail"
    @add-payment="addPayment"
  />

  <!-- LIST PAGE -->
  <div v-else class="payfollow-page">
    <!-- HEADER -->
    <header class="page-header">
      <div>
        <h1>In-Transit Payment Follow-Up</h1>
        <p>Track payments for purchased items from foreign suppliers.</p>
      </div>
      <div class="header-actions">
        <button class="btn" @click="refreshAll">Refresh</button>
        <button class="btn btn--primary" @click="openNewPurchase">New Purchase</button>
      </div>
    </header>

    <!-- COUNTRY TABS -->
    <nav class="tabs">
      <button
        v-for="tab in countryTabs"
        :key="tab.key"
        class="tab"
        :class="{ 'tab--active': activeCountry === tab.key }"
        @click="activeCountry = tab.key"
      >
        <span class="tab__label">{{ tab.label }}</span>
        <span class="tab__count">{{ tab.count }}</span>
        <span
          v-if="tab.custom"
          class="tab__remove"
          title="Remove country"
          @click.stop="removeCountry(tab.key)"
        >✕</span>
      </button>

      <button class="tab tab--add" @click="openAddCountry">＋ Add Country</button>
    </nav>

    <!-- FILTERS -->
    <div class="filters">
      <input
        v-model="search"
        type="text"
        placeholder="Search item, supplier, proforma #…"
        class="search-input"
      />
      <select v-model="statusFilter" class="select-input">
        <option value="">All Statuses</option>
        <option value="unpaid">Unpaid</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
      </select>
      <select v-model.number="perPage" class="select-input">
        <option :value="5">5 / page</option>
        <option :value="10">10 / page</option>
        <option :value="25">25 / page</option>
        <option :value="50">50 / page</option>
        <option :value="100">100 / page</option>
      </select>
    </div>

    <!-- TABLE -->
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 100px;">Proforma</th>
            <th>Item</th>
            <th style="width: 130px;" class="right">Total</th>
            <th style="width: 130px;" class="right">Paid</th>
            <th style="width: 80px;" class="right">Paid %</th>
            <th style="width: 90px;" class="center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in paginatedProformas"
            :key="p.id"
            class="row"
            :class="`row--${p.paymentStatus}`"
          >
            <td>{{ p.proformaNo }}</td>
            <td>
              <span class="item-name">{{ p.items[0]?.itemName || '—' }}</span>
              <span v-if="p.items.length > 1" class="more-badge">
                +{{ p.items.length - 1 }} more item{{ p.items.length - 1 === 1 ? '' : 's' }}
              </span>
            </td>
            <td class="right">{{ p.totalValue }}</td>
            <td class="right">{{ p.amountPaid }}</td>
            <td class="right">{{ p.paidPercent }}%</td>
            <td class="center">
              <button class="btn-detail" @click="openDetail(p)">Detail</button>
            </td>
          </tr>

          <tr v-if="filteredProformas.length === 0">
            <td colspan="6" class="empty">
              No purchases match your filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PAGINATION -->
    <div v-if="totalPages > 1" class="pagination">
      <div class="pagination__info">
        Showing
        <strong>{{ rangeStart }}</strong>–<strong>{{ rangeEnd }}</strong>
        of <strong>{{ filteredProformas.length }}</strong>
      </div>

      <div class="pagination__controls">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="goToPage(1)"
        >« First</button>

        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >‹ Prev</button>

        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >Next ›</button>

        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(totalPages)"
        >Last »</button>
      </div>
    </div>

    <!-- ADD COUNTRY MODAL -->
    <Modal v-if="showAddCountry" title="Add Country" @close="closeAddCountry">
      <div class="modal-field">
        <label class="modal-label">Country Name</label>
        <input
          v-model="newCountryName"
          type="text"
          class="modal-input"
          placeholder="e.g. Turkey"
          @keyup.enter="confirmAddCountry"
          autofocus
        />
      </div>

      <div class="modal-actions">
        <button class="btn" @click="closeAddCountry">Cancel</button>
        <button
          class="btn btn--primary"
          :disabled="!newCountryName.trim()"
          @click="confirmAddCountry"
        >Add</button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ProformaDetailPage from './ProformaDetailPage.vue'
import NewPurchasePage from './NewPurchasePage.vue'

// ================================================================
// INLINE MODAL (tiny — avoids extra file)
// ================================================================
const Modal = {
  props: {
    title: String,
  },
  emits: ['close'],
  template: `
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
      </div>
    </div>
  `,
}

// ================================================================
// STATE
// ================================================================
const activeCountry = ref('all')
const search = ref('')
const statusFilter = ref('')
const selectedProforma = ref(null)
const showNewPurchase = ref(false)
const savingNewPurchase = ref(false)

// Extra countries the user has added
const extraCountries = ref([])

// Pagination
const perPage = ref(10)
const currentPage = ref(1)

// Add country modal
const showAddCountry = ref(false)
const newCountryName = ref('')

// ================================================================
// DATA
// ================================================================
const proformas = ref([
  // ==============================================================
  // 🇨🇳 CHINA
  // ==============================================================
  {
    id: 'C-300', country: 'China', flag: '🇨🇳', proformaNo: 'C-300',
    supplier: 'SUZHOU FIRST PACKING MACHINERY',
    supplierContact: 'ELEN', supplierPhone: '+86-13656210926',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2022-10-02', containers: '—',
    paymentTerm: '70% + 30%',
    totalValue: 'USD 96,500', totalValueRaw: 96500,
    amountPaid: 'USD 96,500', paidValueRaw: 96500,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid', remark: 'HAS NO RCT',
    items: [
      { itemName: 'GTIB-15 SLITTING MACHINE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 3, unit: 'SET', unitPrice: 'USD 4,200', totalPrice: 'USD 12,600' },
      { itemName: 'CY400-AT AUTOMATIC ROLL FORMING MACHINE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'SET', unitPrice: 'USD 5,500', totalPrice: 'USD 11,000' },
      { itemName: 'FB 2000-A SEAM WELDING MACHINE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'SET', unitPrice: 'USD 15,300', totalPrice: 'USD 30,600' },
      { itemName: 'FB-A FLANGING MACHINE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'SET', unitPrice: 'USD 2,300', totalPrice: 'USD 4,600' },
      { itemName: 'GT4A68 PNEUMATIC SEALING MACHINE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 4, unit: 'SET', unitPrice: 'USD 4,100', totalPrice: 'USD 16,400' },
      { itemName: 'DN60B EARLUG SPOT WELDER MACHINE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'SET', unitPrice: 'USD 3,500', totalPrice: 'USD 7,000' },
      { itemName: '9M CONVEYOR', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'SET', unitPrice: 'USD 2,300', totalPrice: 'USD 4,600' },
      { itemName: 'GT2C3 COMPOUND LINING MACHINE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'SET', unitPrice: 'USD 3,200', totalPrice: 'USD 6,400' },
      { itemName: 'WELDING TOOL', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'PCS', unitPrice: 'USD 1,200', totalPrice: 'USD 2,400' },
      { itemName: 'FLANGING TOOL', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'PCS', unitPrice: 'USD 900', totalPrice: 'USD 1,800' },
      { itemName: 'SEALING TOOL', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 4, unit: 'PCS', unitPrice: 'USD 445', totalPrice: 'USD 1,780' },
      { itemName: 'LINING TOOL', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 2, unit: 'PCS', unitPrice: 'USD 350', totalPrice: 'USD 700' },
      { itemName: 'RUBBER & GRINDING', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 8, unit: 'PCS', unitPrice: 'USD 250', totalPrice: 'USD 2,000' },
      { itemName: 'CONVEYOR BELT', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 1, unit: 'SET', unitPrice: 'USD 80', totalPrice: 'USD 80' },
      { itemName: 'COPPER WIRE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 1500, unit: 'SET', unitPrice: 'USD 13', totalPrice: 'USD 19,500' },
      { itemName: 'SERVICE CHARGE', company: 'SUZHOU FIRST PACKING MACHINERY', quantity: 1, unit: '—', unitPrice: 'USD 2,000', totalPrice: 'USD 2,000' },
    ],
    payments: [
      { percent: 70, amount: '67,550', currency: 'USD', date: '2022-02-14', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 30, amount: '28,950', currency: 'USD', date: '2022-07-14', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-301', country: 'China', flag: '🇨🇳', proformaNo: 'C-301',
    supplier: 'FARFLY', supplierContact: 'JOANA', supplierPhone: '+86-18017196377',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2022-03-17', containers: '—',
    paymentTerm: '2 payments',
    totalValue: 'USD 66,160', totalValueRaw: 66160,
    amountPaid: 'USD 43,005', paidValueRaw: 43005,
    balance: 'USD 23,155', paidPercent: 65,
    paymentStatus: 'partial',
    items: [
      { itemName: 'FWE30 HORIZONTAL BEAD MILL', company: 'FARFLY', quantity: 2, unit: 'SET', unitPrice: 'USD 12,000', totalPrice: 'USD 24,000' },
      { itemName: 'FG260 ROLLER MILL', company: 'FARFLY', quantity: 2, unit: 'SET', unitPrice: 'USD 5,500', totalPrice: 'USD 11,000' },
      { itemName: 'ZIRCONIA BEADS 95%', company: 'FARFLY', quantity: 100, unit: 'SET', unitPrice: 'USD 26', totalPrice: 'USD 2,600' },
      { itemName: 'PRESSURE GAGE (EX PROOF)', company: 'FARFLY', quantity: 4, unit: 'SET', unitPrice: 'USD 260', totalPrice: 'USD 1,040' },
      { itemName: 'AIR PUMP DN25', company: 'FARFLY', quantity: 2, unit: 'SET', unitPrice: 'USD 500', totalPrice: 'USD 1,000' },
      { itemName: 'SOLENOID VALVE', company: 'FARFLY', quantity: 3, unit: 'SET', unitPrice: 'USD 120', totalPrice: 'USD 360' },
      { itemName: 'FIRST SPARE PART (DHL AIR)', company: 'FARFLY', quantity: 1, unit: '—', unitPrice: 'USD 600', totalPrice: 'USD 600' },
      { itemName: 'SECOND SPARE PARTS (DHL AIR)', company: 'FARFLY', quantity: 1, unit: '—', unitPrice: 'USD 1,900', totalPrice: 'USD 1,900' },
      { itemName: 'THIRD SPARE PARTS (DHL AIR)', company: 'FARFLY', quantity: 1, unit: '—', unitPrice: 'USD 505', totalPrice: 'USD 505' },
    ],
    payments: [
      { percent: 10, amount: '6,750', currency: 'USD', date: '2022-03-25', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 55, amount: '36,255', currency: 'USD', date: '2023-02-11', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-302', country: 'China', flag: '🇨🇳', proformaNo: 'C-302',
    supplier: 'SHIJIAZHUANG HAOSHUO CHEMICAL',
    supplierContact: 'CASSIE', supplierPhone: '+86-13315985648',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'MELAKU', sdtPhone: '0982954890',
    purchaseDate: '2023-05-13', containers: "4*40''",
    paymentTerm: '30 / 30 / 40',
    totalValue: 'USD 225,600', totalValueRaw: 225600,
    amountPaid: 'USD 225,600', paidValueRaw: 225600,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid', remark: '24 DAY', freight: '2,135',
    items: [
      { itemName: 'HPMC_25kg', company: 'SHIJIAZHUANG HAOSHUO CHEMICAL', quantity: 96000, unit: 'kg', unitPrice: 'USD 2.35', totalPrice: 'USD 225,600' },
    ],
    payments: [
      { percent: 30, amount: '67,680', currency: 'USD', date: '2023-05-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 30, amount: '67,680', currency: 'USD', date: '2023-07-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
      { percent: 40, amount: '90,240', currency: 'USD', date: '2023-07-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '3rd payment' },
    ],
  },
  {
    id: 'C-303', country: 'China', flag: '🇨🇳', proformaNo: 'C-303',
    supplier: 'HAINAN YANGHANG INDUSTRIAL',
    supplierContact: 'KEVIN YAN', supplierPhone: '+86-13136075187',
    buyer: '—', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'ENDASHAW', sdtPhone: '0925273328',
    purchaseDate: '2023-06-28', containers: '56 bag',
    paymentTerm: '100%',
    totalValue: 'RMB 2,058', totalValueRaw: 2058,
    amountPaid: 'RMB 2,058', paidValueRaw: 2058,
    balance: 'RMB 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'SODIUM SULFATE ANHYDROUS_25kg', company: 'HAINAN YANGHANG INDUSTRIAL', quantity: 2800, unit: 'kg', unitPrice: 'RMB 0.735', totalPrice: 'RMB 2,058' },
    ],
    payments: [
      { percent: 100, amount: '2,058', currency: 'RMB', date: '2023-07-25', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
    ],
  },
  {
    id: 'C-304', country: 'China', flag: '🇨🇳', proformaNo: 'C-304',
    supplier: 'SHANDONG JINHAI TITANIUM RESOURCES',
    supplierContact: 'HELENA', supplierPhone: '+86-15154358605',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'ZENA', sdtPhone: '0910604660',
    purchaseDate: '2023-06-28', containers: "5*20''",
    paymentTerm: '30% + 70%',
    totalValue: 'USD 248,400', totalValueRaw: 248400,
    amountPaid: 'USD 248,400', paidValueRaw: 248400,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid', remark: '24 DAY', freight: '1,898',
    items: [
      { itemName: 'TITANIUM_25kg', company: 'SHANDONG JINHAI TITANIUM RESOURCES', quantity: 120000, unit: 'kg', unitPrice: 'USD 2.07', totalPrice: 'USD 248,400' },
    ],
    payments: [
      { percent: 30, amount: '74,520', currency: 'USD', date: '2023-07-11', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 70, amount: '173,880', currency: 'USD', date: '2023-08-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-305', country: 'China', flag: '🇨🇳', proformaNo: 'C-305',
    supplier: 'COLORCOM INTERNATIONAL LIMITED',
    supplierContact: 'AMY YAO', supplierPhone: '+86-15967226716',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'MELAKU', sdtPhone: '0982954890',
    purchaseDate: '2023-06-30', containers: '180 bag',
    paymentTerm: '30 / 30 / 40',
    totalValue: 'USD 7,020', totalValueRaw: 7020,
    amountPaid: 'USD 7,020', paidValueRaw: 7020,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'CARBON BLACK_20kg', company: 'COLORCOM INTERNATIONAL', quantity: 3600, unit: 'kg', unitPrice: 'USD 1.95', totalPrice: 'USD 7,020' },
    ],
    payments: [
      { percent: 30, amount: '2,106', currency: 'USD', date: '2023-07-11', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 30, amount: '2,106', currency: 'USD', date: '2023-08-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
      { percent: 40, amount: '2,808', currency: 'USD', date: '2023-08-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '3rd payment' },
    ],
  },
  {
    id: 'C-306', country: 'China', flag: '🇨🇳', proformaNo: 'C-306',
    supplier: 'FARFLY', supplierContact: 'JOANA', supplierPhone: '+86-18017196377',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-07-12', containers: '1 pcs',
    paymentTerm: '100%',
    totalValue: 'USD 3,850', totalValueRaw: 3850,
    amountPaid: 'USD 3,850', paidValueRaw: 3850,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: '100HP INVERTER ABB BRAND', company: 'FARFLY', quantity: 1, unit: 'PCS', unitPrice: 'USD 3,850', totalPrice: 'USD 3,850' },
    ],
    payments: [
      { percent: 100, amount: '3,850', currency: 'USD', date: '2023-07-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
    ],
  },
  {
    id: 'C-307', country: 'China', flag: '🇨🇳', proformaNo: 'C-307',
    supplier: 'DONGYING CITY DAYONG PETROLEUM ADDITIVES',
    supplierContact: 'ABBIE CHENG', supplierPhone: '+86-15254464732',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'GULF',
    sdtContact: 'DAWIT', sdtPhone: '0934767915',
    purchaseDate: '2023-07-17', containers: '80 drum',
    paymentTerm: '3 payments',
    totalValue: 'USD 27,606', totalValueRaw: 27606,
    amountPaid: 'USD 27,606', paidValueRaw: 27606,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid', remark: 'CIF',
    items: [
      { itemName: 'LABSA_215kg', company: 'DONGYING CITY DAYONG', quantity: 17200, unit: 'kg', unitPrice: 'USD 1.605', totalPrice: 'USD 27,606' },
    ],
    payments: [
      { percent: 17, amount: '4,572.40', currency: 'USD', date: '2023-07-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 13, amount: '3,709.39', currency: 'USD', date: '2023-08-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
      { percent: 70, amount: '19,324.21', currency: 'USD', date: '2023-11-24', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '3rd payment' },
    ],
  },
  {
    id: 'C-308', country: 'China', flag: '🇨🇳', proformaNo: 'C-308',
    supplier: 'HENAN YULIN CHEMICAL',
    supplierContact: 'VIC', supplierPhone: '+86-13283865237',
    buyer: '—', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'BIRUK', sdtPhone: '0963204279',
    purchaseDate: '2023-07-17', containers: '28 bag',
    paymentTerm: '100%',
    totalValue: 'RMB 1,701', totalValueRaw: 1701,
    amountPaid: 'RMB 1,701', paidValueRaw: 1701,
    balance: 'RMB 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'TSP (TRISODIUM PHOSPHATE)_25kg', company: 'HENAN YULIN CHEMICAL', quantity: 700, unit: 'kg', unitPrice: 'RMB 2.43', totalPrice: 'RMB 1,701' },
    ],
    payments: [
      { percent: 100, amount: '1,701', currency: 'RMB', date: '2023-07-25', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
    ],
  },
  {
    id: 'C-309', country: 'China', flag: '🇨🇳', proformaNo: 'C-309',
    supplier: 'HEBEI JIUFU INDUSTRIAL AND MINING ACCESSORIES',
    supplierContact: 'ALISA', supplierPhone: '+86-15630032403',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'BIYADGLGN', sdtPhone: '0921434989',
    purchaseDate: '2023-07-27', containers: '210,000 pcs',
    paymentTerm: '2 payments',
    totalValue: 'USD 23,694', totalValueRaw: 23694,
    amountPaid: 'USD 23,693.80', paidValueRaw: 23693.8,
    balance: 'USD 0.20', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'HEX BOLT M80*30', company: 'HEBEI JIUFU INDUSTRIAL', quantity: 210000, unit: 'PCS', unitPrice: 'USD 5.28', totalPrice: 'USD 18,600' },
      { itemName: 'NUT M8', company: 'HEBEI JIUFU INDUSTRIAL', quantity: 230000, unit: 'PCS', unitPrice: 'USD 5.43', totalPrice: 'USD 5,094' },
    ],
    payments: [
      { percent: 30, amount: '7,108', currency: 'USD', date: '2023-08-07', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 70, amount: '16,585.80', currency: 'USD', date: '2023-09-23', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-310', country: 'China', flag: '🇨🇳', proformaNo: 'C-310',
    supplier: 'D&R METAL INDUSTRIES',
    supplierContact: 'KELLY', supplierPhone: '+86-18069228910',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'BIRUK', sdtPhone: '0963204279',
    purchaseDate: '2023-07-27', containers: '70000 PCS',
    paymentTerm: '2 payments',
    totalValue: 'USD 70,980', totalValueRaw: 70980,
    amountPaid: 'USD 70,850', paidValueRaw: 70850,
    balance: 'USD 130', paidPercent: 100,
    paymentStatus: 'paid', remark: 'Includes 130 USD special transportation refund',
    items: [
      { itemName: 'NIPPLES 3/4"', company: 'D&R METAL INDUSTRIES', quantity: 70000, unit: 'PCS', unitPrice: 'USD 0.57', totalPrice: 'USD 39,900' },
      { itemName: 'NIPPLES 1"', company: 'D&R METAL INDUSTRIES', quantity: 42000, unit: 'PCS', unitPrice: 'USD 0.74', totalPrice: 'USD 31,080' },
    ],
    payments: [
      { percent: 30, amount: '21,255', currency: 'USD', date: '2023-09-21', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 70, amount: '49,595', currency: 'USD', date: '2023-11-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-311', country: 'China', flag: '🇨🇳', proformaNo: 'C-311',
    supplier: 'SHANDONG JIUDING MATERIAL',
    supplierContact: 'CRYSTAL', supplierPhone: '+86-15269263916',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-08-02', containers: "12*20''",
    paymentTerm: '2 payments',
    totalValue: 'USD 136,123.20', totalValueRaw: 136123.2,
    amountPaid: 'USD 136,123.20', paidValueRaw: 136123.2,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'FIBERGLASS MAT', company: 'SHANDONG JIUDING MATERIAL', quantity: 198720, unit: 'KG', unitPrice: 'USD 0.685', totalPrice: 'USD 136,123.20' },
    ],
    payments: [
      { percent: 50, amount: '68,061.60', currency: 'USD', date: '2023-02-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 50, amount: '68,061.60', currency: 'USD', date: '2023-06-09', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-312', country: 'China', flag: '🇨🇳', proformaNo: 'C-312',
    supplier: 'SHANDONG JIUDING MATERIAL',
    supplierContact: 'CRYSTAL', supplierPhone: '+86-15269263916',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-08-02', containers: "2*20''",
    paymentTerm: '2 payments',
    totalValue: 'USD 26,600', totalValueRaw: 26600,
    amountPaid: 'USD 26,600', paidValueRaw: 26600,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'FIBERGLASS WOVEN ROVING', company: 'SHANDONG JIUDING MATERIAL', quantity: 40000, unit: 'KG', unitPrice: 'USD 0.665', totalPrice: 'USD 26,600' },
    ],
    payments: [
      { percent: 30, amount: '7,980', currency: 'USD', date: '2023-02-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 70, amount: '18,620', currency: 'USD', date: '2023-06-09', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-313', country: 'China', flag: '🇨🇳', proformaNo: 'C-313',
    supplier: 'SICHUAN XINGHAOYU COMPOSITE MATERIALS',
    supplierContact: 'IRIS', supplierPhone: '+86-13882139787',
    buyer: '—', paymentBy: '—', transitor: '—',
    sdtContact: 'TAMRAT', sdtPhone: '0920459092',
    purchaseDate: '2023-08-02', containers: "8*20''",
    paymentTerm: '2 payments',
    totalValue: 'USD 90,086.40', totalValueRaw: 90086.4,
    amountPaid: 'USD 90,086.40', paidValueRaw: 90086.4,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'FIBERGLASS MAT', company: 'SICHUAN XINGHAOYU COMPOSITE MATERIALS', quantity: 132480, unit: 'KG', unitPrice: 'USD 0.68', totalPrice: 'USD 90,086.40' },
    ],
    payments: [
      { percent: 30, amount: '25,524.48', currency: 'USD', date: '2023-02-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 70, amount: '64,561.92', currency: 'USD', date: '2023-08-29', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-314', country: 'China', flag: '🇨🇳', proformaNo: 'C-314',
    supplier: 'HAINAN YANGHANG INDUSTRIAL',
    supplierContact: 'KEVIN YAN', supplierPhone: '+86-13136075187',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'ENDASHAW', sdtPhone: '0925273328',
    purchaseDate: '2023-08-07', containers: '24 bag',
    paymentTerm: '100%',
    totalValue: 'RMB 882', totalValueRaw: 882,
    amountPaid: 'RMB 882', paidValueRaw: 882,
    balance: 'RMB 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'SODIUM SULFATE ANHYDROUS_25kg', company: 'HAINAN YANGHANG INDUSTRIAL', quantity: 600, unit: 'kg', unitPrice: 'RMB 0.735', totalPrice: 'RMB 882' },
    ],
    payments: [
      { percent: 100, amount: '882', currency: 'RMB', date: '2023-07-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
    ],
  },
  {
    id: 'C-315', country: 'China', flag: '🇨🇳', proformaNo: 'C-315',
    supplier: 'HENAN YULIN CHEMICAL',
    supplierContact: 'VIC', supplierPhone: '+86-13283865237',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'BIRUK', sdtPhone: '0963204279',
    purchaseDate: '2023-07-08', containers: '24 bag',
    paymentTerm: '100%',
    totalValue: 'USD 204', totalValueRaw: 204,
    amountPaid: 'USD 204', paidValueRaw: 204,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'TSP (TRISODIUM PHOSPHATE)_25kg', company: 'HENAN YULIN CHEMICAL', quantity: 600, unit: 'kg', unitPrice: 'USD 0.34', totalPrice: 'USD 204' },
    ],
    payments: [
      { percent: 100, amount: '204', currency: 'USD', date: '2023-07-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
    ],
  },
  {
    id: 'C-316', country: 'China', flag: '🇨🇳', proformaNo: 'C-316',
    supplier: 'GUANGXI FUDE CHEMICAL TECHNOLOGY',
    supplierContact: 'CAMILA', supplierPhone: '+86-18154618889',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'ABU', sdtPhone: '0930541055',
    purchaseDate: '2023-08-10', containers: '640 BAG',
    paymentTerm: '2 payments',
    totalValue: 'USD 5,680', totalValueRaw: 5680,
    amountPaid: 'USD 4,320', paidValueRaw: 4320,
    balance: 'USD 1,360', paidPercent: 76,
    paymentStatus: 'partial',
    items: [
      { itemName: 'TALC 80 MICRO', company: 'GUANGXI FUDE CHEMICAL', quantity: 16000, unit: 'kg', unitPrice: 'USD 0.17', totalPrice: 'USD 2,720' },
      { itemName: 'TALC 30 MICRO', company: 'GUANGXI FUDE CHEMICAL', quantity: 8000, unit: 'kg', unitPrice: 'USD 0.20', totalPrice: 'USD 1,600' },
      { itemName: 'INVERTER', company: 'FARFLY', quantity: 1, unit: 'PCS', unitPrice: 'USD 1,360', totalPrice: 'USD 1,360' },
    ],
    payments: [
      { percent: 23, amount: '1,296', currency: 'USD', date: '2023-08-14', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 53, amount: '3,024', currency: 'USD', date: '2023-10-12', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-317', country: 'China', flag: '🇨🇳', proformaNo: 'C-317',
    supplier: 'FARFLY', supplierContact: 'JOANA', supplierPhone: '+86-18017196377',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-07-08', containers: '1 PCS',
    paymentTerm: 'Partial payment',
    totalValue: 'USD 14,810', totalValueRaw: 14810,
    amountPaid: 'USD 10,164', paidValueRaw: 10164,
    balance: 'USD 4,646', paidPercent: 69,
    paymentStatus: 'partial',
    items: [
      { itemName: '100HP (75KW) INVERTER ABB BRAND', company: 'FARFLY', quantity: 1, unit: 'PCS', unitPrice: 'USD 3,300', totalPrice: 'USD 3,300' },
      { itemName: '75HP (55KW) INVERTER ABB BRAND', company: 'FARFLY', quantity: 1, unit: 'PCS', unitPrice: 'USD 2,400', totalPrice: 'USD 2,400' },
      { itemName: 'MECHANICAL SEAL FWE30', company: 'FARFLY', quantity: 8, unit: 'PCS', unitPrice: 'USD 550', totalPrice: 'USD 4,400' },
      { itemName: 'POTENTION SWITCH', company: 'FARFLY', quantity: 8, unit: 'PCS', unitPrice: 'USD 8', totalPrice: 'USD 64' },
      { itemName: 'PUTTY MACHINE', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 1, unit: 'PCS', unitPrice: 'USD 4,646', totalPrice: 'USD 4,646' },
    ],
    payments: [
      { percent: 69, amount: '10,164', currency: 'USD', date: '2023-08-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
    ],
  },
  {
    id: 'C-318', country: 'China', flag: '🇨🇳', proformaNo: 'C-318',
    supplier: 'SHANGHAI POLYE TECHNOLOGY',
    supplierContact: 'LINNA', supplierPhone: '+86-13816774633',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-07-08', containers: '1 SET',
    paymentTerm: '1st payment only',
    totalValue: 'USD 84,090', totalValueRaw: 84090,
    amountPaid: 'USD 18,849', paidValueRaw: 18849,
    balance: 'USD 65,241', paidPercent: 22,
    paymentStatus: 'partial',
    items: [
      { itemName: '1500L PUTTY MIXER', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 1, unit: 'SET', unitPrice: 'USD 29,800', totalPrice: 'USD 29,800' },
      { itemName: '1500L MOVABLE TANK', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 2, unit: 'SET', unitPrice: 'USD 4,900', totalPrice: 'USD 9,800' },
      { itemName: 'PRESSING MACHINE', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 1, unit: 'SET', unitPrice: 'USD 11,500', totalPrice: 'USD 11,500' },
      { itemName: 'FILLING MACHINE', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 1, unit: 'SET', unitPrice: 'USD 6,500', totalPrice: 'USD 6,500' },
      { itemName: 'ZIRCONIA BEADS Dn1.4-1.6mm', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 150, unit: 'KG', unitPrice: 'USD 26', totalPrice: 'USD 3,900' },
      { itemName: 'DISC FOR PUTTY MIXER (SS304)', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 4, unit: 'SET', unitPrice: 'USD 200', totalPrice: 'USD 800' },
      { itemName: 'O-RING, SEAL RING', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 4, unit: 'SET', unitPrice: 'USD 135', totalPrice: 'USD 540' },
      { itemName: 'OIL SOLENOID VALVE', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 2, unit: 'SET', unitPrice: 'USD 400', totalPrice: 'USD 800' },
      { itemName: 'OIL SOLENOID VALVE COIL 220VAC', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 10, unit: 'SET', unitPrice: 'USD 200', totalPrice: 'USD 2,000' },
      { itemName: 'DOUBLE LAYER DISPERSING DISC HSD75', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 2, unit: 'SET', unitPrice: 'USD 250', totalPrice: 'USD 500' },
      { itemName: 'DOUBLE LAYER DISPERSING DISC HSD100', company: 'SHANGHAI POLYE TECHNOLOGY', quantity: 2, unit: 'SET', unitPrice: 'FREE', totalPrice: 'USD 0' },
    ],
    payments: [
      { percent: 22, amount: '18,849', currency: 'USD', date: '2023-08-14', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
    ],
  },
  {
    id: 'C-319', country: 'China', flag: '🇨🇳', proformaNo: 'C-319',
    supplier: 'TIANJIN RUIFUXIN CHEMICAL',
    supplierContact: 'CARLA', supplierPhone: '+86 152 2242 7997',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'BIRUK', sdtPhone: '0963204279',
    purchaseDate: '2023-09-18', containers: '32 drum',
    paymentTerm: '2 payments',
    totalValue: 'USD 10,080', totalValueRaw: 10080,
    amountPaid: 'USD 10,080', paidValueRaw: 10080,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'CALCIUM HYPOCHLORITE', company: 'TIANJIN RUIFUXIN CHEMICAL', quantity: 1440, unit: 'kg', unitPrice: 'USD 7', totalPrice: 'USD 10,080' },
    ],
    payments: [
      { percent: 30, amount: '3,024', currency: 'USD', date: '2023-09-25', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 70, amount: '7,056', currency: 'USD', date: '2023-10-16', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-320', country: 'China', flag: '🇨🇳', proformaNo: 'C-320',
    supplier: 'SHENZHEN ANGES MACHINERY',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '2023-10-10', containers: '4 SET',
    paymentTerm: '2 payments',
    totalValue: 'USD 6,480', totalValueRaw: 6480,
    amountPaid: 'USD 6,480', paidValueRaw: 6480,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'AIR COOLED INDUSTRIAL CHILLER ACK_5', company: 'SHENZHEN ANGES MACHINERY', quantity: 4, unit: 'SET', unitPrice: 'USD 1,620', totalPrice: 'USD 6,480' },
    ],
    payments: [
      { percent: 30, amount: '1,944', currency: 'USD', date: '2023-10-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 70, amount: '4,536', currency: 'USD', date: '2023-10-25', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-321', country: 'China', flag: '🇨🇳', proformaNo: 'C-321',
    supplier: 'CANRI CHEMICAL', supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-10-13', containers: '10,000/25',
    paymentTerm: '2 payments',
    totalValue: 'USD 32,380', totalValueRaw: 32380,
    amountPaid: 'USD 22,735', paidValueRaw: 22735,
    balance: 'USD 9,645', paidPercent: 70,
    paymentStatus: 'partial',
    items: [
      { itemName: 'IRON OXIDE RED 130', company: 'CANRI CHEMICAL', quantity: 10000, unit: 'kg', unitPrice: 'USD 0.75', totalPrice: 'USD 7,500' },
      { itemName: 'IRON OXIDE YELLOW 313', company: 'CANRI CHEMICAL', quantity: 14000, unit: 'kg', unitPrice: 'USD 0.74', totalPrice: 'USD 10,360' },
      { itemName: 'IRON OXIDE YELLOW 313', company: 'CANRI CHEMICAL', quantity: 6500, unit: 'kg', unitPrice: 'USD 0.75', totalPrice: 'USD 4,875' },
    ],
    payments: [
      { percent: 17, amount: '5,358', currency: 'USD', date: '2023-10-16', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '1st payment' },
      { percent: 53, amount: '17,377', currency: 'USD', date: '2023-12-28', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG Balance', originAccount: 'from ABG balance', note: '2nd payment' },
    ],
  },
  {
    id: 'C-322', country: 'China', flag: '🇨🇳', proformaNo: 'C-322',
    supplier: 'XIMAI ELECTRIC (WUHAN)',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'FROM ABG', transitor: 'ZOOM',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '—', containers: '1SET',
    paymentTerm: '1st payment only',
    totalValue: 'USD 64,500', totalValueRaw: 64500,
    amountPaid: 'USD 19,350', paidValueRaw: 19350,
    balance: 'USD 45,150', paidPercent: 30,
    paymentStatus: 'partial',
    items: [
      { itemName: '2500 KVA TRANSFORMER (COMPACT SUBSTATION)', company: 'XIMAI ELECTRIC (WUHAN)', quantity: 1, unit: 'SET', unitPrice: 'USD 64,500', totalPrice: 'USD 64,500' },
    ],
    payments: [
      { percent: 30, amount: '19,350', currency: 'USD', date: '2023-10-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG', note: '1st payment' },
    ],
  },
  {
    id: 'C-323', country: 'China', flag: '🇨🇳', proformaNo: 'C-323',
    supplier: 'JIANGSU JIANGHAO GENERATOR',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'FROM ABG', transitor: 'ZOOM',
    sdtContact: 'MELAKU', sdtPhone: '—',
    purchaseDate: '—', containers: '3 sets',
    paymentTerm: '2 payments',
    totalValue: 'USD 55,062', totalValueRaw: 55062,
    amountPaid: 'USD 55,062', paidValueRaw: 55062,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'GENERATOR_450kva WITH ACCESSORIES', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 3, unit: 'SET', unitPrice: 'USD 17,700', totalPrice: 'USD 53,100' },
      { itemName: 'OIL FILTER', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 30, unit: 'PCS', unitPrice: 'USD 15', totalPrice: 'USD 450' },
      { itemName: 'FUEL FILTER', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 30, unit: 'PCS', unitPrice: 'USD 13', totalPrice: 'USD 390' },
      { itemName: 'AIR FILTER', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 15, unit: 'PCS', unitPrice: 'USD 70', totalPrice: 'USD 1,050' },
      { itemName: 'BELT', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 3, unit: 'PCS', unitPrice: 'USD 24', totalPrice: 'USD 72' },
    ],
    payments: [
      { percent: 30, amount: '16,518.60', currency: 'USD', date: '2023-10-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG', note: '1st payment' },
      { percent: 70, amount: '38,543.40', currency: 'USD', date: '2023-12-14', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG', note: '2nd payment' },
    ],
  },
  {
    id: 'C-324', country: 'China', flag: '🇨🇳', proformaNo: 'C-324',
    supplier: 'HEBEI XINQIU INTERNATIONAL TRADING',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '—', containers: '2160 ROLL',
    paymentTerm: '2 payments',
    totalValue: 'USD 11,293.16', totalValueRaw: 11293.16,
    amountPaid: 'USD 11,293.16', paidValueRaw: 11293.16,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'MASKING TAPE (WHITE) 306KG/ROLL', company: 'HEBEI XINQIU INTERNATIONAL TRADING', quantity: 2160, unit: 'ROLL', unitPrice: 'USD 0.696', totalPrice: 'USD 1,503.36' },
      { itemName: 'STRETCH FILM (CLEAR)', company: 'HEBEI XINQIU INTERNATIONAL TRADING', quantity: 620, unit: 'ROLL', unitPrice: 'USD 15.79', totalPrice: 'USD 9,789.80' },
    ],
    payments: [
      { percent: 30, amount: '3,387.95', currency: 'USD', date: '2023-10-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG', note: '1st payment' },
      { percent: 70, amount: '7,905.21', currency: 'USD', date: '2023-11-12', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG', note: '2nd payment' },
    ],
  },
  {
    id: 'C-325', country: 'China', flag: '🇨🇳', proformaNo: 'C-325',
    supplier: 'SHANDONG JIUDING MATERIAL',
    supplierContact: 'CRYSTAL', supplierPhone: '+86-15269263916',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-11-13', containers: '7200 ROLL',
    paymentTerm: '2 payments',
    totalValue: 'USD 102,340.40', totalValueRaw: 102340.4,
    amountPaid: 'USD 102,340.40', paidValueRaw: 102340.4,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'FIBERGLASS MAT', company: 'SHANDONG JIUDING MATERIAL', quantity: 331200, unit: 'KG', unitPrice: 'USD 0.618', totalPrice: 'USD 102,340.40' },
    ],
    payments: [
      { percent: 60, amount: '61,404.08', currency: 'USD', date: '2023-11-20', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG', note: '1st payment' },
      { percent: 40, amount: '40,936.32', currency: 'USD', date: '2023-12-19', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG', note: '2nd payment' },
    ],
  },
  {
    id: 'C-326', country: 'China', flag: '🇨🇳', proformaNo: 'C-326',
    supplier: 'SHANXI HENGYUAN KAOLIN SALES',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from HENOS PETTY CASH', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2023-11-13', containers: '11000BAGS',
    paymentTerm: '2 payments',
    totalValue: 'USD 408,650', totalValueRaw: 408650,
    amountPaid: 'USD 408,650', paidValueRaw: 408650,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'CALCINED KAOLIN HY-Z-90 (10*40")', company: 'SHANXI HENGYUAN KAOLIN SALES', quantity: 275000, unit: 'KG', unitPrice: 'USD 1.486', totalPrice: 'USD 408,650' },
    ],
    payments: [
      { percent: 20, amount: '81,730', currency: 'USD', date: '2023-06-12', method: 'Wire Transfer', originIcon: '💼', originName: 'HENOS Petty Cash', originAccount: 'from HENOS PETTY CASH', note: '1st payment' },
      { percent: 80, amount: '326,920', currency: 'USD', date: '2023-12-17', method: 'Wire Transfer', originIcon: '💼', originName: 'HENOS Petty Cash', originAccount: 'from HENOS PETTY CASH', note: '2nd payment' },
    ],
  },
  {
    id: 'C-327', country: 'China', flag: '🇨🇳', proformaNo: 'C-327',
    supplier: 'TANGSHAN SUNFAR NANOMATERIALS',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: '—', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '—', containers: '2400 BAG',
    paymentTerm: '—',
    totalValue: 'USD 67,200', totalValueRaw: 67200,
    amountPaid: 'USD 0', paidValueRaw: 0,
    balance: 'USD 67,200', paidPercent: 0,
    paymentStatus: 'unpaid',
    items: [
      { itemName: 'FUMED SILICA (SILICON DIOXIDE K-200R)', company: 'TANGSHAN SUNFAR NANOMATERIALS', quantity: 24000, unit: 'KG', unitPrice: 'USD 2.80', totalPrice: 'USD 67,200' },
    ],
    payments: [],
  },
  {
    id: 'C-328', country: 'China', flag: '🇨🇳', proformaNo: 'C-328',
    supplier: 'HANGHOU JINGYI CHEMICAL',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from HENOS PETTY CASH', transitor: '—',
    sdtContact: 'TAMRAT', sdtPhone: '0920459092',
    purchaseDate: '—', containers: '10,000KG',
    paymentTerm: '1st payment only',
    totalValue: 'USD 160,000', totalValueRaw: 160000,
    amountPaid: 'USD 48,000', paidValueRaw: 48000,
    balance: 'USD 112,000', paidPercent: 30,
    paymentStatus: 'partial',
    items: [
      { itemName: 'RHEOLOGY MODIFIER (BENTON)', company: 'HANGHOU JINGYI CHEMICAL', quantity: 10000, unit: 'KG', unitPrice: 'USD 16', totalPrice: 'USD 160,000' },
    ],
    payments: [
      { percent: 30, amount: '48,000', currency: 'USD', date: '2023-12-03', method: 'Wire Transfer', originIcon: '💼', originName: 'HENOS Petty Cash', originAccount: 'FROM HENOS PETTY CASH', note: '1st payment' },
    ],
  },
  {
    id: 'C-329', country: 'China', flag: '🇨🇳', proformaNo: 'C-329',
    supplier: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'FROM ABG BALANCE', transitor: '—',
    sdtContact: 'MELAKU', sdtPhone: '—',
    purchaseDate: '2023-11-21', containers: '2SET',
    paymentTerm: 'Partial payment',
    totalValue: 'USD 131,354', totalValueRaw: 131354,
    amountPaid: 'USD 20,250', paidValueRaw: 20250,
    balance: 'USD 111,104', paidPercent: 15,
    paymentStatus: 'partial',
    items: [
      { itemName: 'HAMMER CRUSHER', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'SET', unitPrice: 'USD 10,200', totalPrice: 'USD 20,400' },
      { itemName: 'LINER VIBRATING SCREEN', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'SET', unitPrice: 'USD 9,560', totalPrice: 'USD 19,120' },
      { itemName: 'MATERIAL DISTRIBUTOR', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'SET', unitPrice: 'USD 1,650', totalPrice: 'USD 3,300' },
      { itemName: 'BUCKET ELEVATOR', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'SET', unitPrice: 'USD 6,990', totalPrice: 'USD 13,980' },
      { itemName: 'SPARE HAMMERS', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 384, unit: 'PCS', unitPrice: 'USD 24', totalPrice: 'USD 9,216' },
      { itemName: 'FILTER PLATE 12MM', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'PCS', unitPrice: 'USD 265', totalPrice: 'USD 530' },
      { itemName: 'FILTER PLATE 20MM', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'PCS', unitPrice: 'USD 265', totalPrice: 'USD 530' },
      { itemName: 'FILTER PLATE 6MM', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'PCS', unitPrice: 'USD 265', totalPrice: 'USD 530' },
      { itemName: 'SILO (DIA.2*0.55+2.45)', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'SET', unitPrice: 'USD 1,900', totalPrice: 'USD 1,900' },
      { itemName: 'SILO (DIA.1.5*1.5+1.5)', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'SET', unitPrice: 'USD 1,300', totalPrice: 'USD 1,300' },
      { itemName: 'SILO BOTTOM (600*2PIPES)', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'PCS', unitPrice: 'USD 430', totalPrice: 'USD 860' },
      { itemName: 'SILO BOTTOM (600*1PIPES)', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'PCS', unitPrice: 'USD 220', totalPrice: 'USD 440' },
      { itemName: 'PNEUMATIC BAR VALVE', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 2, unit: 'SET', unitPrice: 'USD 1,640', totalPrice: 'USD 3,280' },
      { itemName: 'HYDRAULIC JACK', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'SET', unitPrice: 'USD 65', totalPrice: 'USD 65' },
      { itemName: 'STAINLESS WIRE SIEVE 10MESH*30M', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'ROLL', unitPrice: 'USD 168', totalPrice: 'USD 168' },
      { itemName: 'STAINLESS WIRE SIEVE 12MESH*30M', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'ROLL', unitPrice: 'USD 168', totalPrice: 'USD 168' },
      { itemName: 'STAINLESS WIRE SIEVE 40MESH*30M', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'ROLL', unitPrice: 'USD 168', totalPrice: 'USD 168' },
      { itemName: 'STAINLESS WIRE SIEVE 70MESH*30M', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'ROLL', unitPrice: 'USD 168', totalPrice: 'USD 168' },
      { itemName: 'STAINLESS WIRE SIEVE 80MESH*30M', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'ROLL', unitPrice: 'USD 168', totalPrice: 'USD 168' },
      { itemName: 'STAINLESS WIRE SIEVE 100MESH*30M', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'ROLL', unitPrice: 'USD 168', totalPrice: 'USD 168' },
      { itemName: 'VIBRATOR ANALYZER', company: 'ZHENGZHOU TURUI MACHINERY EQUIPMENTS', quantity: 1, unit: 'SET', unitPrice: 'USD 440', totalPrice: 'USD 440' },
    ],
    payments: [
      { percent: 15, amount: '20,250', currency: 'USD', date: '2023-12-02', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG BALANCE', note: '1st payment' },
    ],
  },
  {
    id: 'C-330', country: 'China', flag: '🇨🇳', proformaNo: 'C-330',
    supplier: 'JIANGSU JIANGHAO GENERATOR',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '—', containers: '2SET',
    paymentTerm: '1st payment only',
    totalValue: 'USD 122,378', totalValueRaw: 122378,
    amountPaid: 'USD 36,713.40', paidValueRaw: 36713.4,
    balance: 'USD 85,664.60', paidPercent: 30,
    paymentStatus: 'partial',
    items: [
      { itemName: '100KVA WEICHAI SUPER SILENT DIESEL GENERATOR', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 2, unit: 'SET', unitPrice: 'USD 6,864', totalPrice: 'USD 13,728' },
      { itemName: '150KVA WEICHAI SUPER SILENT DIESEL GENERATOR', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 2, unit: 'SET', unitPrice: 'USD 7,450', totalPrice: 'USD 14,900' },
      { itemName: 'FUEL FILTER (1000700909)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 30, unit: 'PCS', unitPrice: 'USD 9', totalPrice: 'USD 270' },
      { itemName: 'OIL FILTER (13055724)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 30, unit: 'PCS', unitPrice: 'USD 10', totalPrice: 'USD 300' },
      { itemName: 'AIR FILTER (13058098)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 15, unit: 'PCS', unitPrice: 'USD 47', totalPrice: 'USD 705' },
      { itemName: 'BELT (13023462)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 2, unit: 'PCS', unitPrice: 'USD 7', totalPrice: 'USD 14' },
      { itemName: '1500KVA WEICHAI CONTAINERIZED DIESEL GENERATOR', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 1, unit: 'SET', unitPrice: 'USD 87,852', totalPrice: 'USD 87,852' },
      { itemName: 'OIL FILTER (1000428205)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 30, unit: 'PCS', unitPrice: 'USD 15', totalPrice: 'USD 450' },
      { itemName: 'FINE FILTRATION (1000422382)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 5, unit: 'PCS', unitPrice: 'USD 50', totalPrice: 'USD 250' },
      { itemName: 'COARSE FILTRATION (1004239637)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 5, unit: 'PCS', unitPrice: 'USD 45', totalPrice: 'USD 225' },
      { itemName: 'COARSE FILTRATION (1000588583)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 5, unit: 'PCS', unitPrice: 'USD 30', totalPrice: 'USD 150' },
      { itemName: 'AIR FILTER (331008000249)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 10, unit: 'PCS', unitPrice: 'USD 230', totalPrice: 'USD 2,300' },
      { itemName: 'BELT (1004553364)', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 1, unit: 'PCS', unitPrice: 'USD 34', totalPrice: 'USD 34' },
      { itemName: 'PLATE SHEET', company: 'JIANGSU JIANGHAO GENERATOR', quantity: 1, unit: '—', unitPrice: 'USD 1,200', totalPrice: 'USD 1,200' },
    ],
    payments: [
      { percent: 30, amount: '36,713.40', currency: 'USD', date: '2023-11-30', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG BALANCE', note: '1st payment' },
    ],
  },
  {
    id: 'C-331', country: 'China', flag: '🇨🇳', proformaNo: 'C-331',
    supplier: 'SHANDONG JINHAI TITANIUM RESOURCES',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: 'ZOOM',
    sdtContact: 'ZENA', sdtPhone: '0910604660',
    purchaseDate: '—', containers: '7680 BAG',
    paymentTerm: '2 payments',
    totalValue: 'USD 405,120', totalValueRaw: 405120,
    amountPaid: 'USD 405,120', paidValueRaw: 405120,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'RUTILE TITANIUM DIOXIDE (8*20")', company: 'SHANDONG JINHAI TITANIUM RESOURCES', quantity: 192000, unit: 'KG', unitPrice: 'USD 2.11', totalPrice: 'USD 405,120' },
    ],
    payments: [
      { percent: 30, amount: '121,536', currency: 'USD', date: '2023-12-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG BALANCE', note: '1st payment' },
      { percent: 70, amount: '283,584', currency: 'USD', date: '2023-12-19', method: 'Wire Transfer', originIcon: '🏦', originName: 'ABG', originAccount: 'FROM ABG BALANCE', note: '2nd payment' },
    ],
  },
  {
    id: 'C-332', country: 'China', flag: '🇨🇳', proformaNo: 'C-332',
    supplier: 'JIANGXI SUORUIDA INTELLIGENT EQUIPMENT',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from HK ACCOUNT', transitor: '—',
    sdtContact: 'ZENA', sdtPhone: '0910604660',
    purchaseDate: '—', containers: '2',
    paymentTerm: '2 payments',
    totalValue: 'USD 11,600', totalValueRaw: 11600,
    amountPaid: 'USD 11,600', paidValueRaw: 11600,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'AUTOMATIC PAINT DISPENSER (INCLUDE COMPUTER & SOFTWARE)', company: 'JIANGXI SUORUIDA INTELLIGENT EQUIPMENT', quantity: 2, unit: 'SET', unitPrice: 'USD 2,200', totalPrice: 'USD 4,400' },
      { itemName: 'AUTOMATIC SHAKER', company: 'JIANGXI SUORUIDA INTELLIGENT EQUIPMENT', quantity: 2, unit: 'SET', unitPrice: 'USD 1,200', totalPrice: 'USD 2,400' },
      { itemName: 'COLOUR PASTE T SERIES', company: 'JIANGXI SUORUIDA INTELLIGENT EQUIPMENT', quantity: 20, unit: 'SET', unitPrice: 'USD 240', totalPrice: 'USD 4,800' },
    ],
    payments: [
      { percent: 30, amount: '3,480', currency: 'USD', date: '2023-11-11', method: 'Wire Transfer', originIcon: '🏦', originName: 'HK Account', originAccount: 'from HK ACCOUNT', note: '1st payment' },
      { percent: 70, amount: '8,120', currency: 'USD', date: '2023-11-12', method: 'Wire Transfer', originIcon: '🏦', originName: 'HK Account', originAccount: 'from HK ACCOUNT', note: '2nd payment' },
    ],
  },
  {
    id: 'C-333', country: 'China', flag: '🇨🇳', proformaNo: 'C-333',
    supplier: 'INNOVY CHEMICAL', supplierContact: '—', supplierPhone: '—',
    buyer: '—', paymentBy: 'from HK ACCOUNT', transitor: '—',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '—', containers: '—',
    paymentTerm: '1st payment only',
    totalValue: 'USD 20,960', totalValueRaw: 20960,
    amountPaid: 'USD 6,288', paidValueRaw: 6288,
    balance: 'USD 14,672', paidPercent: 30,
    paymentStatus: 'partial',
    items: [
      { itemName: 'MARBLE POWDER (ZINC STEARATE) 5020', company: 'INNOVY CHEMICAL', quantity: 16000, unit: 'KG', unitPrice: 'USD 1.31', totalPrice: 'USD 20,960' },
    ],
    payments: [
      { percent: 30, amount: '6,288', currency: 'USD', date: '2023-12-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'HK Account', originAccount: 'from HK ACCOUNT', note: '1st payment' },
    ],
  },
  {
    id: 'C-335', country: 'China', flag: '🇨🇳', proformaNo: 'C-335',
    supplier: 'GUANGHOU QIANTAL ENERGY ENVIRONMENTAL',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: '—', transitor: '—',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '—', containers: '102 PCS',
    paymentTerm: '—',
    totalValue: 'USD 161,160', totalValueRaw: 161160,
    amountPaid: 'USD 0', paidValueRaw: 0,
    balance: 'USD 161,160', paidPercent: 0,
    paymentStatus: 'unpaid',
    items: [
      { itemName: 'SOLAR WATER HEATER-200L WITHOUT PRESSURIZED', company: 'GUANGHOU QIANTAL', quantity: 102, unit: 'PCS', unitPrice: 'USD 1,580', totalPrice: 'USD 161,160' },
    ],
    payments: [],
  },
  {
    id: 'C-336', country: 'China', flag: '🇨🇳', proformaNo: 'C-336',
    supplier: 'SHANGHAI ALLIFE INDUSTRY',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'HENOS', paymentBy: 'FROM HENOS PETTY CASH', transitor: '—',
    sdtContact: 'TAMRAT', sdtPhone: '0920459092',
    purchaseDate: '2023-12-14', containers: '400 PCS',
    paymentTerm: '1st payment only',
    totalValue: 'USD 11,390', totalValueRaw: 11390,
    amountPaid: 'USD 3,094.50', paidValueRaw: 3094.5,
    balance: 'USD 8,295.50', paidPercent: 27,
    paymentStatus: 'partial', freight: '355',
    items: [
      { itemName: 'VALVE FOR 6KG AND 9KG', company: 'SHANGHAI ALLIFE INDUSTRY', quantity: 400, unit: 'PCS', unitPrice: 'USD 17.40', totalPrice: 'USD 6,960' },
      { itemName: 'CE GAUGE', company: 'SHANGHAI ALLIFE INDUSTRY', quantity: 400, unit: 'PCS', unitPrice: 'USD 4.76', totalPrice: 'USD 1,904' },
      { itemName: 'DIP TUBE FOR 6KG', company: 'SHANGHAI ALLIFE INDUSTRY', quantity: 200, unit: 'PCS', unitPrice: 'USD 0.93', totalPrice: 'USD 186' },
      { itemName: 'DIP TUBE FOR 9KG', company: 'SHANGHAI ALLIFE INDUSTRY', quantity: 200, unit: 'PCS', unitPrice: 'USD 1.07', totalPrice: 'USD 214' },
      { itemName: 'HOSE FOR 6KG', company: 'SHANGHAI ALLIFE INDUSTRY', quantity: 200, unit: 'PCS', unitPrice: 'USD 1.63', totalPrice: 'USD 326' },
      { itemName: 'HOSE FOR 9KG', company: 'SHANGHAI ALLIFE INDUSTRY', quantity: 200, unit: 'PCS', unitPrice: 'USD 1.85', totalPrice: 'USD 370' },
    ],
    payments: [
      { percent: 27, amount: '3,094.50', currency: 'USD', date: '2023-12-16', method: 'Cash', originIcon: '💼', originName: 'HENOS Petty Cash', originAccount: 'FROM HENOS PETTY CASH', note: '1st payment' },
    ],
  },
  {
    id: 'C-337', country: 'China', flag: '🇨🇳', proformaNo: 'C-337',
    supplier: 'JE ENERGY TECHNOLOGY',
    supplierContact: '—', supplierPhone: '—',
    buyer: 'ABG', paymentBy: 'from ABG balance', transitor: '—',
    sdtContact: 'ZENA', sdtPhone: '0910604660',
    purchaseDate: '2023-12-15', containers: '150 Meter',
    paymentTerm: '—',
    totalValue: 'USD 97,500', totalValueRaw: 97500,
    amountPaid: 'USD 0', paidValueRaw: 0,
    balance: 'USD 97,500', paidPercent: 0,
    paymentStatus: 'unpaid',
    items: [
      { itemName: 'HIGH TENSION CABLE 3*240', company: 'JE ENERGY TECHNOLOGY', quantity: 150, unit: 'MTR', unitPrice: 'USD 55', totalPrice: 'USD 8,250' },
      { itemName: 'LOW TENSION CABLE 3*240+120', company: 'JE ENERGY TECHNOLOGY', quantity: 100, unit: 'MTR', unitPrice: 'USD 56', totalPrice: 'USD 5,600' },
      { itemName: 'SEMI FLEXIBLE LT CABLE 3*120+70', company: 'JE ENERGY TECHNOLOGY', quantity: 1500, unit: 'MTR', unitPrice: 'USD 29.95', totalPrice: 'USD 44,925' },
      { itemName: 'SEMI FLEXIBLE LT CABLE 3*70+35', company: 'JE ENERGY TECHNOLOGY', quantity: 500, unit: 'MTR', unitPrice: 'USD 15.64', totalPrice: 'USD 7,820' },
      { itemName: 'SEMI FLEXIBLE LT CABLE 3*50+25', company: 'JE ENERGY TECHNOLOGY', quantity: 500, unit: 'MTR', unitPrice: 'USD 10.88', totalPrice: 'USD 5,440' },
      { itemName: 'SEMI FLEXIBLE LT CABLE 3*35+16', company: 'JE ENERGY TECHNOLOGY', quantity: 500, unit: 'MTR', unitPrice: 'USD 8.84', totalPrice: 'USD 4,420' },
      { itemName: 'SEMI FLEXIBLE LT CABLE 3*25+10', company: 'JE ENERGY TECHNOLOGY', quantity: 500, unit: 'MTR', unitPrice: 'USD 6.12', totalPrice: 'USD 3,060' },
      { itemName: 'SEMI FLEXIBLE LT CABLE 4*16', company: 'JE ENERGY TECHNOLOGY', quantity: 500, unit: 'MTR', unitPrice: 'USD 4.488', totalPrice: 'USD 2,244' },
      { itemName: 'FLEXIBLE LT CABLE 4*10', company: 'JE ENERGY TECHNOLOGY', quantity: 500, unit: 'MTR', unitPrice: 'USD 2.856', totalPrice: 'USD 1,428' },
      { itemName: 'FLEXIBLE LT CABLE 4*6', company: 'JE ENERGY TECHNOLOGY', quantity: 1000, unit: 'MTR', unitPrice: 'USD 1.836', totalPrice: 'USD 1,836' },
      { itemName: 'FLEXIBLE LT CABLE 4*4', company: 'JE ENERGY TECHNOLOGY', quantity: 1000, unit: 'MTR', unitPrice: 'USD 1.224', totalPrice: 'USD 1,224' },
      { itemName: 'FLEXIBLE LT CABLE 4*2.5', company: 'JE ENERGY TECHNOLOGY', quantity: 1000, unit: 'MTR', unitPrice: 'USD 0.816', totalPrice: 'USD 816' },
      { itemName: 'FLEXIBLE LT CABLE 3*2.5', company: 'JE ENERGY TECHNOLOGY', quantity: 1000, unit: 'MTR', unitPrice: 'USD 0.646', totalPrice: 'USD 646' },
      { itemName: 'FLEXIBLE LT CABLE 2*2.5', company: 'JE ENERGY TECHNOLOGY', quantity: 500, unit: 'MTR', unitPrice: 'USD 0.462', totalPrice: 'USD 231' },
      { itemName: 'FLEXIBLE LT CABLE 1*2.5', company: 'JE ENERGY TECHNOLOGY', quantity: 1000, unit: 'ROLL', unitPrice: 'USD 13.06', totalPrice: 'USD 13,060' },
    ],
    payments: [],
  },

  // ==============================================================
  // 🇦🇪 DUBAI
  // ==============================================================
  {
    id: 'D-300', country: 'Dubai', flag: '🇦🇪', proformaNo: 'D-300',
    supplier: 'VISEN', supplierContact: 'Mr Ramish', supplierPhone: '+919-892658247',
    buyer: 'ALSAM NOK', paymentBy: 'from samson balance', transitor: 'zoom',
    sdtContact: 'SAMI', sdtPhone: '0911082545 / +971508095144',
    purchaseDate: '2023-05-16', containers: "50*20''",
    paymentTerm: '4 payments · 25% each',
    totalValue: 'USD 810,000', totalValueRaw: 810000,
    amountPaid: 'USD 810,000', paidValueRaw: 810000,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'HOMOPOLYMER 250KG_3001', company: 'VISEN', quantity: 4000, unit: 'bags', unitPrice: 'USD 0.81', totalPrice: 'USD 810,000' },
    ],
    payments: [
      { percent: 25, amount: '202,500', currency: 'USD', date: '2023-05-19', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '1st payment' },
      { percent: 25, amount: '202,500', currency: 'USD', date: '2023-06-19', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '2nd payment' },
      { percent: 25, amount: '202,500', currency: 'USD', date: '2023-08-07', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '3rd payment' },
      { percent: 25, amount: '202,500', currency: 'USD', date: '2023-09-04', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '4th payment' },
    ],
  },
  {
    id: 'D-301', country: 'Dubai', flag: '🇦🇪', proformaNo: 'D-301',
    supplier: 'OCEAN PAINT', supplierContact: 'Mr Ismail', supplierPhone: '+971-566331325',
    buyer: 'shimels', paymentBy: 'from samson balance', transitor: 'zoom',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '2023-07-12', containers: "20*20''",
    paymentTerm: '3 payments',
    totalValue: 'USD 7,800', totalValueRaw: 7800,
    amountPaid: 'USD 7,800', paidValueRaw: 7800,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'DULENTY _165kg', company: 'OCEAN PAINT', quantity: 2040, unit: 'kg', unitPrice: 'USD 3.82', totalPrice: 'USD 7,800' },
    ],
    payments: [
      { percent: 40, amount: '3,120', currency: 'USD', date: '2023-07-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '1st payment' },
      { percent: 30, amount: '2,340', currency: 'USD', date: '2023-08-16', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '2nd payment' },
      { percent: 30, amount: '2,340', currency: 'USD', date: '2023-09-06', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '3rd payment' },
    ],
  },
  {
    id: 'D-306', country: 'Dubai', flag: '🇦🇪', proformaNo: 'D-306',
    supplier: 'IFFCO', supplierContact: 'Mr Kemel', supplierPhone: '+971-503050453',
    buyer: 'shimels', paymentBy: '—', transitor: '—',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '2023-07-15', containers: '1836 drum',
    paymentTerm: '3 payments',
    totalValue: 'USD 4,149,675.33', totalValueRaw: 4149675.33,
    amountPaid: 'USD 4,149,675.33', paidValueRaw: 4149675.33,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'LONG OIL _190kg', company: 'IFFCO', quantity: 348840, unit: 'kg', unitPrice: 'USD 4.9518', totalPrice: 'USD 1,727,000' },
      { itemName: 'LONG OIL _190kg (additional)', company: 'IFFCO', quantity: 101460, unit: 'kg', unitPrice: 'USD 4.8601', totalPrice: 'USD 493,100' },
      { itemName: 'UPR _225kg', company: 'IFFCO', quantity: 288000, unit: 'kg', unitPrice: 'USD 5.46532', totalPrice: 'USD 1,574,000' },
      { itemName: 'UPR _225kg (additional)', company: 'IFFCO', quantity: 79200, unit: 'kg', unitPrice: 'USD 5.57536', totalPrice: 'USD 355,575.33' },
    ],
    payments: [
      { percent: 30, amount: '1,235,435', currency: 'USD', date: '2023-07-17', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '1st payment' },
      { percent: 30, amount: '1,496,625', currency: 'USD', date: '2023-07-27', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '2nd payment' },
      { percent: 40, amount: '1,417,615.33', currency: 'USD', date: '2023-09-04', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '3rd payment' },
    ],
  },
  {
    id: 'D-309', country: 'Dubai', flag: '🇦🇪', proformaNo: 'D-309',
    supplier: 'OCEAN PAINT', supplierContact: 'Mr Ismail', supplierPhone: '+971-566331325',
    buyer: 'shimels', paymentBy: 'from samson balance', transitor: 'zoom',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '2023-07-18', containers: '32 drum',
    paymentTerm: '1st payment only',
    totalValue: 'USD 406,697.40', totalValueRaw: 406697.4,
    amountPaid: 'USD 217,387.20', paidValueRaw: 217387.2,
    balance: 'USD 189,310.20', paidPercent: 53,
    paymentStatus: 'partial',
    items: [
      { itemName: 'EPOXY RESIN_240kg', company: 'OCEAN PAINT', quantity: 7680, unit: 'kg', unitPrice: 'USD 7.88', totalPrice: 'USD 60,518.40' },
      { itemName: 'EPOXY HARDNER_195kg', company: 'OCEAN PAINT', quantity: 7410, unit: 'kg', unitPrice: 'USD 17.48', totalPrice: 'USD 129,526.80' },
      { itemName: 'EPOXY ANTIFOM_150kg', company: 'OCEAN PAINT', quantity: 150, unit: 'kg', unitPrice: 'USD 31.80', totalPrice: 'USD 4,770' },
      { itemName: 'REACTIVE DULENTY_180kg', company: 'OCEAN PAINT', quantity: 1980, unit: 'kg', unitPrice: 'USD 11.40', totalPrice: 'USD 22,572' },
    ],
    payments: [
      { percent: 53, amount: '217,387.20', currency: 'USD', date: '2023-07-24', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '1st payment' },
    ],
  },
  {
    id: 'D-311', country: 'Dubai', flag: '🇦🇪', proformaNo: 'D-311',
    supplier: 'M.H.ENTERPRISES L.L.C', supplierContact: 'Mr Amit', supplierPhone: '+971 52 528 4142',
    buyer: 'ALSAM NOK', paymentBy: 'from samson balance', transitor: 'zoom',
    sdtContact: '—', sdtPhone: '—',
    purchaseDate: '2023-08-15', containers: '80 drum',
    paymentTerm: '2 payments',
    totalValue: 'USD 36,900', totalValueRaw: 36900,
    amountPaid: 'USD 36,900', paidValueRaw: 36900,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'FORMALDEHYDE (225KG/DRUM)', company: 'M.H.ENTERPRISES', quantity: 18000, unit: 'kg', unitPrice: 'USD 2.05', totalPrice: 'USD 36,900' },
    ],
    payments: [
      { percent: 30, amount: '11,070', currency: 'USD', date: '2023-08-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '1st payment' },
      { percent: 70, amount: '25,830', currency: 'USD', date: '2023-08-29', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '2nd payment' },
    ],
  },
  {
    id: 'D-319', country: 'Dubai', flag: '🇦🇪', proformaNo: 'D-319',
    supplier: 'VISEN', supplierContact: 'Mr Ramish', supplierPhone: '—',
    buyer: 'ALSAM NOK', paymentBy: 'from samson balance', transitor: 'zoom',
    sdtContact: 'SAMI', sdtPhone: '0911082545 / +971508095144',
    purchaseDate: '2023-10-16', containers: '6400 DRUM',
    paymentTerm: '5 payments · 20% each',
    totalValue: 'USD 1,232,000', totalValueRaw: 1232000,
    amountPaid: 'USD 1,232,000', paidValueRaw: 1232000,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'HOMOPOLYMER_250KG/DRUM', company: 'VISEN', quantity: 1600000, unit: 'kg', unitPrice: 'USD 0.77', totalPrice: 'USD 1,232,000' },
    ],
    payments: [
      { percent: 20, amount: '246,400', currency: 'USD', date: '2023-10-17', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '1st payment' },
      { percent: 20, amount: '246,400', currency: 'USD', date: '2023-10-30', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '2nd payment' },
      { percent: 20, amount: '246,400', currency: 'USD', date: '2023-11-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '3rd payment' },
      { percent: 20, amount: '246,400', currency: 'USD', date: '2023-11-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '4th payment' },
      { percent: 20, amount: '246,400', currency: 'USD', date: '2023-11-23', method: 'Wire Transfer', originIcon: '🏦', originName: 'Samson Balance', originAccount: 'from samson balance', note: '5th payment' },
    ],
  },

  // ==============================================================
  // 🇮🇳 INDIA
  // ==============================================================
  {
    id: 'I-300', country: 'India', flag: '🇮🇳', proformaNo: 'I-300',
    supplier: 'TRISHALA ENTERPRISES_PARAKASH',
    supplierContact: 'PARAKASH', supplierPhone: '+918-104161041',
    buyer: 'super', paymentBy: 'from raju balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2022-06-20', containers: '—',
    paymentTerm: '3 payments',
    totalValue: 'USD 32,100', totalValueRaw: 32100,
    amountPaid: 'USD 32,100', paidValueRaw: 32100,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid', remark: '105 USD paid for bank charge 3×35',
    items: [
      { itemName: '4 LIT D T DIE MOLD (4 NO)', company: 'TRISHALA ENTERPRISES', quantity: 1, unit: 'SET', unitPrice: 'USD 9,000', totalPrice: 'USD 9,000' },
      { itemName: '1 LIT D T DIE MOLD (4 NO)', company: 'TRISHALA ENTERPRISES', quantity: 1, unit: 'SET', unitPrice: 'USD 7,200', totalPrice: 'USD 7,200' },
      { itemName: 'SPARE TOOLING FOR 4 LIT DIE MOLD', company: 'TRISHALA ENTERPRISES', quantity: 9, unit: 'SET', unitPrice: 'USD 408', totalPrice: 'USD 3,672' },
      { itemName: 'SPARE TOOLING FOR 1 LIT DIE MOLD', company: 'TRISHALA ENTERPRISES', quantity: 9, unit: 'SET', unitPrice: 'USD 223', totalPrice: 'USD 2,007' },
      { itemName: 'ROLL FEED ATTACHMENT 10"', company: 'TRISHALA ENTERPRISES', quantity: 3, unit: 'SET', unitPrice: 'USD 1,400', totalPrice: 'USD 4,200' },
      { itemName: 'ROLL FEED ATTACHMENT 7"', company: 'TRISHALA ENTERPRISES', quantity: 3, unit: 'SET', unitPrice: 'USD 1,200', totalPrice: 'USD 3,600' },
      { itemName: 'TRANSFER SYSTEM 4LIT & 1 LIT', company: 'TRISHALA ENTERPRISES', quantity: 2, unit: 'SET', unitPrice: 'USD 3,600', totalPrice: 'USD 7,200' },
      { itemName: 'DROP CURLING MACHINE 4 LIT & 1 LIT', company: 'TRISHALA ENTERPRISES', quantity: 2, unit: 'SET', unitPrice: 'USD 2,100', totalPrice: 'USD 4,200' },
      { itemName: 'LUG MOLD SINGLE CAVITY', company: 'TRISHALA ENTERPRISES', quantity: 2, unit: 'SET', unitPrice: 'USD 600', totalPrice: 'USD 1,200' },
      { itemName: 'STACKER FOR LID', company: 'TRISHALA ENTERPRISES', quantity: 2, unit: 'SET', unitPrice: 'USD 625', totalPrice: 'USD 1,250' },
      { itemName: 'WOODEN PACKING', company: 'TRISHALA ENTERPRISES', quantity: 1, unit: '—', unitPrice: 'USD 571', totalPrice: 'USD 571' },
    ],
    payments: [
      { percent: 40, amount: '13,050', currency: 'USD', date: '2022-09-30', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 35, amount: '11,000', currency: 'USD', date: '2022-11-18', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
      { percent: 25, amount: '8,050', currency: 'USD', date: '2023-10-11', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '3rd payment' },
    ],
  },
  {
    id: 'I-301', country: 'India', flag: '🇮🇳', proformaNo: 'I-301',
    supplier: 'GANGA SINGH ENG_PUNJAB',
    supplierContact: 'SUNNY', supplierPhone: '+919-920226692',
    buyer: 'rodas', paymentBy: 'from raju balance', transitor: '—',
    sdtContact: 'HENOS', sdtPhone: '0933717171 / +25377340845',
    purchaseDate: '2022-09-23', containers: '—',
    paymentTerm: '2 payments',
    totalValue: 'USD 30,000', totalValueRaw: 30000,
    amountPaid: 'USD 30,000', paidValueRaw: 30000,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: '15 TON UNGEAR POWER PRESS', company: 'GANGA SINGH ENG_PUNJAB', quantity: 1, unit: 'NOS', unitPrice: 'USD 2,400', totalPrice: 'USD 2,400' },
      { itemName: '25 TON GEAR WITH 3 HP', company: 'GANGA SINGH ENG_PUNJAB', quantity: 2, unit: 'NOS', unitPrice: 'USD 4,150', totalPrice: 'USD 8,300' },
      { itemName: '25 TON UNGEAR WITH 3 HP', company: 'GANGA SINGH ENG_PUNJAB', quantity: 2, unit: 'NOS', unitPrice: 'USD 4,000', totalPrice: 'USD 8,000' },
      { itemName: '35 TON UNGEAR WITH 5 HP', company: 'GANGA SINGH ENG_PUNJAB', quantity: 2, unit: 'NOS', unitPrice: 'USD 5,100', totalPrice: 'USD 10,200' },
      { itemName: '50 TON GEAR WITH 7.5 HP', company: 'GANGA SINGH ENG_PUNJAB', quantity: 2, unit: 'NOS', unitPrice: 'USD 8,250', totalPrice: 'USD 16,500' },
      { itemName: 'CAN BEADING MACHINE', company: 'GANGA SINGH ENG_PUNJAB', quantity: 1, unit: 'NOS', unitPrice: 'USD 1,600', totalPrice: 'USD 1,600' },
      { itemName: 'ROUND DISK CURLLER 4 LIT', company: 'GANGA SINGH ENG_PUNJAB', quantity: 2, unit: 'NOS', unitPrice: 'USD 2,200', totalPrice: 'USD 4,400' },
      { itemName: 'ROUND DISK CURLLER 1 LIT', company: 'GANGA SINGH ENG_PUNJAB', quantity: 2, unit: 'NOS', unitPrice: 'USD 1,800', totalPrice: 'USD 3,600' },
    ],
    payments: [
      { percent: 60, amount: '18,240', currency: 'USD', date: '2022-10-06', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 40, amount: '11,760', currency: 'USD', date: '2023-04-08', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
    ],
  },
  {
    id: 'I-302', country: 'India', flag: '🇮🇳', proformaNo: 'I-302',
    supplier: 'MERCURY', supplierContact: 'Mr Mekush', supplierPhone: '+919838006703',
    buyer: 'BHUMIKA', paymentBy: 'from raju balance', transitor: '—',
    sdtContact: 'SAMI', sdtPhone: '0911082545 / +971508095144',
    purchaseDate: '2023-05-07', containers: "8*40''",
    paymentTerm: '4 payments',
    totalValue: 'USD 329,108', totalValueRaw: 329108,
    amountPaid: 'USD 329,108', paidValueRaw: 329108,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: '1 LIT TIN PLAIN NO PRINT', company: 'MERCURY', quantity: 216000, unit: 'KG', unitPrice: 'USD 1.44', totalPrice: 'USD 311,180' },
      { itemName: '4 LIT TIN PLAIN NO PRINT', company: 'MERCURY', quantity: 0, unit: '—', unitPrice: '—', totalPrice: 'USD 17,928' },
    ],
    payments: [
      { percent: 16, amount: '54,000', currency: 'USD', date: '2023-07-19', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 42, amount: '137,554', currency: 'USD', date: '2023-07-19', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
      { percent: 17, amount: '57,554', currency: 'USD', date: '2023-10-25', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '3rd payment' },
      { percent: 24, amount: '80,000', currency: 'USD', date: '2023-10-30', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '4th payment' },
    ],
  },
  {
    id: 'I-303', country: 'India', flag: '🇮🇳', proformaNo: 'I-303',
    supplier: 'GOODLUCK', supplierContact: 'Mr Harsh', supplierPhone: '+919873712874',
    buyer: 'alsam', paymentBy: 'from raju balance', transitor: '—',
    sdtContact: 'MELAKU & SAMI', sdtPhone: '0982954890 / 0911082545',
    purchaseDate: '2023-05-20', containers: "6*20''",
    paymentTerm: '3 payments',
    totalValue: 'USD 168,283.54', totalValueRaw: 168283.54,
    amountPaid: 'USD 168,283.54', paidValueRaw: 168283.54,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'BRIDGE SLOT SCREEN (SPIRAL PIPE)', company: 'GOODLUCK', quantity: 546, unit: 'PCS', unitPrice: 'USD 158.15', totalPrice: 'USD 86,349.90' },
      { itemName: 'CASING PIPE', company: 'GOODLUCK', quantity: 364, unit: 'PCS', unitPrice: 'USD 225.09', totalPrice: 'USD 81,933.64' },
    ],
    payments: [
      { percent: 20, amount: '33,656', currency: 'USD', date: '2023-05-23', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 40, amount: '67,313', currency: 'USD', date: '2023-09-14', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
      { percent: 40, amount: '67,313', currency: 'USD', date: '2023-09-15', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '3rd payment' },
    ],
  },
  {
    id: 'I-304', country: 'India', flag: '🇮🇳', proformaNo: 'I-304',
    supplier: 'MEGHNA', supplierContact: 'KULWANT SINGH RATHORE', supplierPhone: '+919099087943',
    buyer: 'BHUMIKA', paymentBy: 'from raju balance', transitor: '—',
    sdtContact: 'SAMI', sdtPhone: '0911082545 / +971508095144',
    purchaseDate: '2023-08-02', containers: "1*40''",
    paymentTerm: '3 payments',
    totalValue: 'USD 110,250', totalValueRaw: 110250,
    amountPaid: 'USD 110,250', paidValueRaw: 110250,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'PIGMENT BLUE_25kg', company: 'MEGHNA', quantity: 21000, unit: 'KG', unitPrice: 'USD 5.25', totalPrice: 'USD 110,250' },
    ],
    payments: [
      { percent: 30, amount: '33,075', currency: 'USD', date: '2023-08-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 41, amount: '45,000', currency: 'USD', date: '2023-10-02', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
      { percent: 29, amount: '32,175', currency: 'USD', date: '2023-10-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '3rd payment' },
    ],
  },
  {
    id: 'I-305', country: 'India', flag: '🇮🇳', proformaNo: 'I-305',
    supplier: 'UNILEX', supplierContact: 'DEEPIKA', supplierPhone: '+917021688433',
    buyer: 'BHUMIKA', paymentBy: 'from raju balance', transitor: '—',
    sdtContact: 'ENDASHAW', sdtPhone: '0925273328',
    purchaseDate: '2023-08-02', containers: "1*40''",
    paymentTerm: '5 payments',
    totalValue: 'USD 213,280', totalValueRaw: 213280,
    amountPaid: 'USD 213,280', paidValueRaw: 213280,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'PIGMENT GREEN 7_25kg', company: 'UNILEX', quantity: 24000, unit: 'KG', unitPrice: 'USD 5.60', totalPrice: 'USD 134,400' },
      { itemName: 'PIGMENT RED 112_25kg', company: 'UNILEX', quantity: 9700, unit: 'KG', unitPrice: 'USD 9.18', totalPrice: 'USD 89,046' },
    ],
    payments: [
      { percent: 30, amount: '40,320', currency: 'USD', date: '2023-08-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 20, amount: '26,880', currency: 'USD', date: '2023-10-02', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
      { percent: 20, amount: '26,880', currency: 'USD', date: '2023-10-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '3rd payment' },
      { percent: 15, amount: '20,160', currency: 'USD', date: '2023-10-04', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '4th payment' },
      { percent: 15, amount: '20,160', currency: 'USD', date: '2023-10-05', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '5th payment' },
    ],
  },
  {
    id: 'I-306', country: 'India', flag: '🇮🇳', proformaNo: 'I-306',
    supplier: 'HERCULES', supplierContact: 'SWETSL', supplierPhone: '+919820101024',
    buyer: 'BHUMIKA', paymentBy: 'from raju balance', transitor: '—',
    sdtContact: 'SAMI', sdtPhone: '0911082545 / +971508095144',
    purchaseDate: '2023-08-02', containers: '—',
    paymentTerm: '2 payments',
    totalValue: 'USD 57,743', totalValueRaw: 57743,
    amountPaid: 'USD 57,743', paidValueRaw: 57743,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'PIGMENT YELLOW 74_25kg', company: 'HERCULES', quantity: 7300, unit: 'KG', unitPrice: 'USD 7.91', totalPrice: 'USD 57,743' },
    ],
    payments: [
      { percent: 30, amount: '17,323', currency: 'USD', date: '2023-08-04', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 70, amount: '40,420', currency: 'USD', date: '2023-10-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
    ],
  },
  {
    id: 'I-307', country: 'India', flag: '🇮🇳', proformaNo: 'I-307',
    supplier: 'KRISHNA HASTKALA', supplierContact: 'KRISHNA', supplierPhone: '+919913413108',
    buyer: '—', paymentBy: '—', transitor: '—',
    sdtContact: 'BELAY', sdtPhone: '0924313549',
    purchaseDate: '2023-08-03', containers: '—',
    paymentTerm: '2 payments',
    totalValue: 'USD 18,000', totalValueRaw: 18000,
    amountPaid: 'USD 18,000', paidValueRaw: 18000,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'PIGMENT VIOLET_25kg', company: 'KRISHNA HASTKALA', quantity: 2000, unit: 'KG', unitPrice: 'USD 9', totalPrice: 'USD 18,000' },
    ],
    payments: [
      { percent: 30, amount: '5,400', currency: 'USD', date: '2023-08-03', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 70, amount: '12,600', currency: 'USD', date: '2023-10-02', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
    ],
  },
  {
    id: 'I-308', country: 'India', flag: '🇮🇳', proformaNo: 'I-308',
    supplier: 'ARIHANT', supplierContact: 'JINAL', supplierPhone: '—',
    buyer: '—', paymentBy: '—', transitor: '—',
    sdtContact: 'SAMI', sdtPhone: '0911082545 / +971508095144',
    purchaseDate: '2023-10-12', containers: '1*20"',
    paymentTerm: '2 payments',
    totalValue: 'USD 68,237', totalValueRaw: 68237,
    amountPaid: 'USD 68,237', paidValueRaw: 68237,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'COBALT OCTATE 10%_30KG', company: 'ARIHANT', quantity: 4080, unit: 'KG', unitPrice: 'USD 4.17', totalPrice: 'USD 17,013.60' },
      { itemName: 'COBALT OCTATE 10%_200KG', company: 'ARIHANT', quantity: 6800, unit: 'KG', unitPrice: 'USD 4.17', totalPrice: 'USD 28,356' },
      { itemName: 'LEAD OCTATE 36%_250KG', company: 'ARIHANT', quantity: 5000, unit: 'KG', unitPrice: 'USD 2.09', totalPrice: 'USD 10,450' },
      { itemName: 'CALCIUM OCTATE 10%_200KG', company: 'ARIHANT', quantity: 2800, unit: 'KG', unitPrice: 'USD 2.00', totalPrice: 'USD 5,600' },
      { itemName: 'METHYL ETHYL KETOIME (MEKO)_190KG', company: 'ARIHANT', quantity: 2280, unit: 'KG', unitPrice: 'USD 2.08', totalPrice: 'USD 4,742.40' },
    ],
    payments: [
      { percent: 30, amount: '19,848', currency: 'USD', date: '2023-10-12', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 70, amount: '46,313.40', currency: 'USD', date: '2023-11-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
    ],
  },
  {
    id: 'I-309', country: 'India', flag: '🇮🇳', proformaNo: 'I-309',
    supplier: 'ARIHANT', supplierContact: '—', supplierPhone: '—',
    buyer: '—', paymentBy: '—', transitor: '—',
    sdtContact: 'SAMI', sdtPhone: '0911082545 / +971508095144',
    purchaseDate: '2023-10-12', containers: '1*20"',
    paymentTerm: '2 payments',
    totalValue: 'USD 61,200', totalValueRaw: 61200,
    amountPaid: 'USD 61,200', paidValueRaw: 61200,
    balance: 'USD 0', paidPercent: 100,
    paymentStatus: 'paid',
    items: [
      { itemName: 'MEKO_M60 (HARDNER)_30KG', company: 'ARIHANT', quantity: 20400, unit: 'KG', unitPrice: 'USD 3.00', totalPrice: 'USD 61,200' },
    ],
    payments: [
      { percent: 30, amount: '18,360', currency: 'USD', date: '2023-10-12', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '1st payment' },
      { percent: 70, amount: '42,840', currency: 'USD', date: '2023-11-13', method: 'Wire Transfer', originIcon: '🏦', originName: 'Raju Balance', originAccount: 'from raju balance', note: '2nd payment' },
    ],
  },
])

// ================================================================
// COUNTRY TABS
// ================================================================
const countryTabs = computed(() => {
  const all = proformas.value
  const baseCountries = ['China', 'Dubai', 'India']
  const extraNames = extraCountries.value

  const tabs = [
    { key: 'all', label: 'All', count: all.length, custom: false },
  ]

  // Base countries (only show if they have data OR always show)
  for (const c of baseCountries) {
    tabs.push({
      key: c,
      label: c,
      count: all.filter((i) => i.country === c).length,
      custom: false,
    })
  }

  // Extra countries
  for (const c of extraNames) {
    tabs.push({
      key: c,
      label: c,
      count: all.filter((i) => i.country === c).length,
      custom: true,
    })
  }

  return tabs
})

// ================================================================
// FILTERED
// ================================================================
const filteredProformas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return proformas.value.filter((p) => {
    if (activeCountry.value !== 'all' && p.country !== activeCountry.value) return false
    if (statusFilter.value && p.paymentStatus !== statusFilter.value) return false
    if (!q) return true
    return (
      p.proformaNo.toLowerCase().includes(q) ||
      p.supplier.toLowerCase().includes(q) ||
      p.items.some((it) => it.itemName.toLowerCase().includes(q))
    )
  })
})

// ================================================================
// PAGINATION
// ================================================================
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProformas.value.length / perPage.value))
)

const paginatedProformas = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredProformas.value.slice(start, start + perPage.value)
})

const rangeStart = computed(() => {
  if (filteredProformas.value.length === 0) return 0
  return (currentPage.value - 1) * perPage.value + 1
})

const rangeEnd = computed(() =>
  Math.min(currentPage.value * perPage.value, filteredProformas.value.length)
)

function goToPage(n) {
  const t = totalPages.value
  let next = Number(n) || 1
  if (next < 1) next = 1
  if (next > t) next = t
  currentPage.value = next
}

// Reset page when filters change
watch([activeCountry, search, statusFilter, perPage], () => {
  currentPage.value = 1
})

// ================================================================
// ADD COUNTRY
// ================================================================
function openAddCountry() {
  newCountryName.value = ''
  showAddCountry.value = true
}

function closeAddCountry() {
  showAddCountry.value = false
  newCountryName.value = ''
}

function confirmAddCountry() {
  const name = newCountryName.value.trim()
  if (!name) return
  const exists =
    ['China', 'Dubai', 'India'].includes(name) ||
    extraCountries.value.includes(name)
  if (exists) {
    alert(`"${name}" is already in the tabs.`)
    return
  }
  extraCountries.value = [...extraCountries.value, name]
  activeCountry.value = name
  closeAddCountry()
}

function removeCountry(name) {
  const idx = extraCountries.value.indexOf(name)
  if (idx === -1) return
  extraCountries.value = extraCountries.value.filter((c) => c !== name)
  if (activeCountry.value === name) activeCountry.value = 'all'
}

// ================================================================
// ACTIONS
// ================================================================
function openDetail(p) {
  selectedProforma.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeDetail() {
  selectedProforma.value = null
}

function openNewPurchase() {
  showNewPurchase.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeNewPurchase() {
  showNewPurchase.value = false
  savingNewPurchase.value = false
}

async function handleSaveNewPurchase(payload) {
  savingNewPurchase.value = true
  try {
    const newId = `${payload.proformaNo}-${Date.now()}`
    proformas.value = [
      { id: newId, ...payload },
      ...proformas.value,
    ]
    showNewPurchase.value = false
  } catch (err) {
    console.error('Failed to save new purchase:', err)
    alert('Failed to save. Please try again.')
  } finally {
    savingNewPurchase.value = false
  }
}

// ================================================================
// HELPERS
// ================================================================
function refreshAll() { console.log('refresh') }
function addPayment(p) { console.log('pay', p.proformaNo) }
</script>

<style scoped>
/* ================================================================
   PAGE
   ================================================================ */
.payfollow-page {
  padding: 20px 24px;
  max-width: 1400px;
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
  margin-bottom: 12px;
}
.page-header h1 { margin: 0 0 2px 0; font-size: 18px; font-weight: 700; }
.page-header p  { margin: 0; font-size: 12px; color: #6b7280; }
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

/* Tabs */
.tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
  overflow-x: auto;
  align-items: stretch;
}
.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
}
.tab:hover { color: #374151; }
.tab--active { color: #4f46e5; border-bottom-color: #4f46e5; }
.tab__label { }
.tab__count {
  padding: 1px 7px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-size: 10.5px;
  font-weight: 700;
}
.tab--active .tab__count { background: #eef2ff; color: #4f46e5; }
.tab__remove {
  margin-left: 2px;
  font-size: 10px;
  color: #9ca3af;
  padding: 2px 4px;
  border-radius: 4px;
}
.tab__remove:hover { background: #fee2e2; color: #dc2626; }
.tab--add {
  color: #4f46e5;
  font-weight: 700;
  border-bottom-color: transparent;
}
.tab--add:hover { color: #4338ca; }

/* Filters */
.filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; align-items: center; }
.search-input,
.select-input {
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 12.5px;
  color: #374151;
}
.search-input { flex: 1; min-width: 200px; max-width: 380px; }
.search-input:focus, .select-input:focus { outline: none; border-color: #4f46e5; }
.select-input { min-width: 120px; cursor: pointer; }

/* Table */
.table-wrap {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  table-layout: fixed;
}
.table thead th {
  text-align: left;
  padding: 8px 12px;
  background: #f9fafb;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  color: #374151;
  word-break: break-word;
}
.table .right { text-align: right; }
.table .center { text-align: center; }

.row { transition: filter 0.12s; }
.row:hover { filter: brightness(0.97); }
.row--paid    { background: #ecfdf5; border-left: 4px solid #10b981; }
.row--unpaid  { background: #fef9c3; border-left: 4px solid #eab308; }
.row--partial { background: #fdf2f2; border-left: 4px solid #7f1d1d; }

.item-name { color: #111827; font-weight: 500; }
.more-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  background: rgba(0,0,0,0.06);
  color: #4b5563;
  border-radius: 8px;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
}

.btn-detail {
  padding: 5px 12px;
  background: white;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-detail:hover { background: #eef2ff; }

.empty {
  padding: 30px;
  text-align: center;
  color: #9ca3af;
  font-size: 12.5px;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 4px 4px;
  font-size: 12.5px;
  color: #4b5563;
}
.pagination__info strong { color: #111827; font-weight: 700; }
.pagination__controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.page-btn {
  padding: 6px 10px;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.page-btn:hover:not(:disabled) { background: #f9fafb; }
.page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.page-info {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  padding: 0 8px;
}

/* ================================================================
   MODAL
   ================================================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}
.modal-box {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title { margin: 0; font-size: 15px; font-weight: 800; color: #111827; }
.modal-close {
  background: transparent;
  border: none;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.modal-close:hover { background: #f1f5f9; color: #0f172a; }
.modal-body { padding: 16px 18px; }
.modal-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.modal-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
}
.modal-input {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  font-family: inherit;
}
.modal-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>