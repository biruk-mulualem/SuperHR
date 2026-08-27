<template>
  <!-- =========================================================
       TOP ACTIONS - NO GENERATE BUTTON
  ========================================================== -->

  <div class="top-actions no-print">
    <button class="btn-back-top" @click="goBack">
      ← Back to Transactions
    </button>
    
    <div class="item-select-wrapper">
      <input
        v-model="itemSearchQuery"
        type="text"
        class="item-search-input"
        placeholder="🔍 Search item by code or name..."
        @input="onItemSearch"
        @focus="showItemDropdown = true"
      />
      <div v-if="showItemDropdown && filteredItems.length > 0" class="item-dropdown">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="item-dropdown-option"
          @click="selectItem(item)"
        >
          <span class="item-dropdown-code">{{ item.code }}</span>
          <span class="item-dropdown-name">{{ item.name || item.standardName || 'Unnamed' }}</span>
          <span class="item-dropdown-uom">{{ item.uomCode || 'Pcs' }}</span>
        </div>
      </div>
    </div>

    <!-- ✅ Only Print button remains -->
    <button class="btn-print-top" @click="printPage" :disabled="!hasStockData">
      🖨️ Print
    </button>
  </div>

  <!-- Selected Item Display -->
  <div v-if="selectedItem" class="selected-item-display no-print">
    <span class="selected-badge">✅ Selected:</span>
    <span class="selected-code">{{ selectedItem.code }}</span>
    <span class="selected-name">{{ selectedItem.name || selectedItem.standardName }}</span>
    <span class="selected-uom">{{ selectedItem.uomCode || 'Pcs' }}</span>
    <span v-if="selectedItem.costPrice" class="selected-cost">
      Cost: {{ displayMoney(selectedItem.costPrice) }}
    </span>
    <span v-if="generating" class="generating-indicator">⏳ Loading...</span>
    <button class="clear-selection" @click="clearSelectedItem">✕</button>
  </div>

  <!-- ✅ Only Date Range Filters - No Store/Group -->
  <div v-if="selectedItem" class="filter-options no-print">
    <div class="filter-group">
      <label>📅 From:</label>
      <input type="date" v-model="filterStartDate" @change="onFilterChange" />
    </div>
    <div class="filter-group">
      <label>📅 To:</label>
      <input type="date" v-model="filterEndDate" @change="onFilterChange" />
    </div>
  </div>

  <!-- =========================================================
       ALL STOCK CARD PAGES
  ========================================================== -->

  <div class="pages-container" id="print-container">

    <!-- Loading State -->
    <div v-if="generating" class="loading-overlay">
      <div class="loading-spinner">⏳</div>
      <p>Generating stock card...</p>
    </div>

    <div
      v-for="(pageRows, pageIndex) in paginatedRows"
      :key="pageIndex"
      class="page-wrapper"
    >

      <div class="page">
        <div class="stock-card">

          <!-- =====================================================
               HEADER
          ====================================================== -->

          <header class="header">

            <!-- TRUST - TOP LEFT -->

            <div class="trust-english">
              We trust in God !!!
            </div>


            <!-- COMPANY NAME - AMHARIC -->

            <div
              class="company-name-amharic"
              lang="am"
            >
              ሱፐር ዳብል ቲ ጄኔራል ትሬዲንግ ኃላፊነቱ የተወሰነ የግል ማህበር
            </div>


            <!-- COMPANY NAME - ENGLISH -->

            <div class="company-name-english">
              SUPER DOUBLE 'T' GENERAL TRADING P.L.C.
            </div>


            <!-- STOCK CARD -->

            <div class="stock-title">
              STOCK CARD
            </div>


            <!-- PAGE -->

            <div class="page-number">

              <div
                class="page-amharic"
                lang="am"
              >
                ገጽ
              </div>

              <div class="page-english">
                Page
              </div>

              <div class="page-value">
                {{ pageIndex + 1 }}
              </div>

            </div>

          </header>


          <!-- =====================================================
               INFORMATION SECTION
          ====================================================== -->

          <section class="information">

            <!-- MAXIMUM STOCK LEVEL -->

            <div class="maximum-stock field">

              <div class="field-label">

                <span
                  class="amharic-label"
                  lang="am"
                >
                  ከፍተኛ የእቃ ደረጃ
                </span>

                <span class="english-label">
                  Maximum Stock Level
                </span>

              </div>

              <div class="field-value">
                {{ form.maximumStockLevel }}
              </div>

            </div>


            <!-- THREE FIELDS -->

            <div class="three-fields">

              <!-- MERCHANDISE -->

              <div class="field merchandise">

                <div class="field-label">

                  <span
                    class="amharic-label"
                    lang="am"
                  >
                    እቃ
                  </span>

                  <span class="english-label">
                    Merchandise
                  </span>

                </div>

                <div class="field-value">
                  {{ form.merchandise }}
                </div>

              </div>


              <!-- UNIT OF MEASUREMENT -->

              <div class="field unit-measurement">

                <div class="field-label">

                  <span
                    class="amharic-label"
                    lang="am"
                  >
                    መለኪያ
                  </span>

                  <span class="english-label">
                    Unit of Measurement
                  </span>

                </div>

                <div class="field-value">
                  {{ form.unitOfMeasurement }}
                </div>

              </div>


              <!-- CODE NUMBER -->

              <div class="field code-number">

                <div class="field-label">

                  <span
                    class="amharic-label"
                    lang="am"
                  >
                    ኮድ ቁጥር
                  </span>

                  <span class="english-label">
                    Code No.
                  </span>

                </div>

                <div class="field-value">
                  {{ form.codeNo }}
                </div>

              </div>

            </div>

          </section>


          <!-- =====================================================
               STOCK TABLE
          ====================================================== -->

          <table class="stock-table">

            <colgroup>

              <col class="col-date" />
              <col class="col-grn" />
              <col class="col-siv" />
              <col class="col-particulars" />

              <col class="col-quantity" />
              <col class="col-quantity" />
              <col class="col-quantity" />

              <col class="col-unit-cost" />

              <col class="col-total" />
              <col class="col-total" />
              <col class="col-total" />

            </colgroup>


            <!-- TABLE HEADER -->

            <thead>

              <tr>

                <!-- DATE -->

                <th rowspan="2">

                  <div
                    class="th-amharic"
                    lang="am"
                  >
                    ቀን
                  </div>

                  <div class="th-english">
                    DATE
                  </div>

                </th>


                <!-- GRN -->

                <th rowspan="2">

                  <div
                    class="th-amharic"
                    lang="am"
                  >
                    የመግቢያ ደረሰኝ ቁጥር
                  </div>

                  <div class="th-english">
                    Rep. GRN No.
                  </div>

                </th>


                <!-- SIV -->

                <th rowspan="2">

                  <div
                    class="th-amharic"
                    lang="am"
                  >
                    የዕቃ መውጫ ደረሰኝ ቁጥር
                  </div>

                  <div class="th-english">
                    S.I.V No.
                  </div>

                </th>


                <!-- PARTICULARS -->

                <th rowspan="2">

                  <div
                    class="th-amharic"
                    lang="am"
                  >
                    ማብራሪያ
                  </div>

                  <div class="th-english">
                    Particulars
                  </div>

                </th>


                <!-- QUANTITY -->

                <th colspan="3">

                  <div
                    class="th-amharic"
                    lang="am"
                  >
                    ብዛት
                  </div>

                  <div class="th-english">
                    QUANTITY
                  </div>

                </th>


                <!-- UNIT COST -->

                <th rowspan="2">

                  <div
                    class="th-amharic"
                    lang="am"
                  >
                    የአንዱ ዋጋ
                  </div>

                  <div class="th-english">
                    UNIT COST
                  </div>

                </th>


                <!-- TOTAL COST -->

                <th colspan="3">

                  <div
                    class="th-amharic"
                    lang="am"
                  >
                    ጠቅላላ ዋጋ
                  </div>

                  <div class="th-english">
                    TOTAL COST
                  </div>

                </th>

              </tr>


              <!-- SECOND HEADER ROW -->

              <tr>

                <!-- QUANTITY IN -->

                <th>

                  <div
                    class="th-amharic small"
                    lang="am"
                  >
                    ገቢ
                  </div>

                  <div class="th-english">
                    IN
                  </div>

                </th>


                <!-- QUANTITY OUT -->

                <th>

                  <div
                    class="th-amharic small"
                    lang="am"
                  >
                    ወጪ
                  </div>

                  <div class="th-english">
                    OUT
                  </div>

                </th>


                <!-- QUANTITY BALANCE -->

                <th>

                  <div
                    class="th-amharic small"
                    lang="am"
                  >
                    ቀሪ
                  </div>

                  <div class="th-english">
                    BALANCE
                  </div>

                </th>


                <!-- TOTAL COST IN -->

                <th>

                  <div
                    class="th-amharic small"
                    lang="am"
                  >
                    ገቢ
                  </div>

                  <div class="th-english">
                    IN
                  </div>

                </th>


                <!-- TOTAL COST OUT -->

                <th>

                  <div
                    class="th-amharic small"
                    lang="am"
                  >
                    ወጪ
                  </div>

                  <div class="th-english">
                    OUT
                  </div>

                </th>


                <!-- TOTAL COST BALANCE -->

                <th>

                  <div
                    class="th-amharic small"
                    lang="am"
                  >
                    ቀሪ
                  </div>

                  <div class="th-english">
                    BALANCE
                  </div>

                </th>

              </tr>

            </thead>


            <!-- TABLE BODY -->

            <tbody>

              <tr
                v-for="(row, localIndex) in pageRows"
                :key="`${pageIndex}-${localIndex}`"
              >

                <!-- DATE -->

                <td>
                  <span class="table-value">
                    {{ row.date }}
                  </span>
                </td>


                <!-- GRN -->

                <td>
                  <span class="table-value">
                    {{ row.grn }}
                  </span>
                </td>


                <!-- SIV -->

                <td>
                  <span class="table-value">
                    {{ row.siv }}
                  </span>
                </td>


                <!-- PARTICULARS -->

                <td>
                  <span class="table-value text-left">
                    {{ row.particulars }}
                  </span>
                </td>


                <!-- QUANTITY IN -->

                <td>
                  <span class="table-value">
                    {{ displayNumber(row.quantityIn) }}
                  </span>
                </td>


                <!-- QUANTITY OUT -->

                <td>
                  <span class="table-value">
                    {{ displayNumber(row.quantityOut) }}
                  </span>
                </td>


                <!-- QUANTITY BALANCE -->

                <td class="calculated">

                  <span
                    v-if="hasRowData(row)"
                  >
                    {{ displayNumber(row.runningQuantityBalance) }}
                  </span>

                </td>


                <!-- UNIT COST -->

                <td>
                  <span class="table-value">
                    {{ displayMoney(row.unitCost) }}
                  </span>
                </td>


                <!-- TOTAL COST IN -->

                <td class="calculated">

                  <span
                    v-if="hasRowData(row)"
                  >
                    {{ displayMoney(
                      Number(row.quantityIn || 0) *
                      Number(row.unitCost || 0)
                    ) }}
                  </span>

                </td>


                <!-- TOTAL COST OUT -->

                <td class="calculated">

                  <span
                    v-if="hasRowData(row)"
                  >
                    {{ displayMoney(
                      Number(row.quantityOut || 0) *
                      Number(row.unitCost || 0)
                    ) }}
                  </span>

                </td>


                <!-- TOTAL COST BALANCE -->

                <td class="calculated">

                  <span
                    v-if="hasRowData(row)"
                  >
                    {{ displayMoney(row.runningCostBalance) }}
                  </span>

                </td>

              </tr>


              <!-- TOTAL C/F -->

              <tr
                v-if="pageIndex === paginatedRows.length - 1"
                class="total-row"
              >

                <td colspan="3"></td>

                <td class="total-label">
                  TOTAL C/F
                </td>

                <td>
                  {{ totalQuantityIn || '' }}
                </td>

                <td>
                  {{ totalQuantityOut || '' }}
                </td>

                <td>
                  {{ totalQuantityBalance || '' }}
                </td>

                <td></td>

                <td>
                  {{ displayMoney(totalCostIn) }}
                </td>

                <td>
                  {{ displayMoney(totalCostOut) }}
                </td>

                <td>
                  {{ displayMoney(totalCostBalance) }}
                </td>

              </tr>

            </tbody>

          </table>

        </div>
      </div>

    </div>

  </div>

  <!-- =========================================================
       TOAST
  ========================================================== -->

  <div v-if="showToast" class="toast" :class="toastType">
    <span>{{ toastMessage }}</span>
  </div>

</template>


<script setup>

import {
  computed,
  reactive,
  ref,
  onMounted,
  watch
} from 'vue'

import {
  useRouter
} from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import balanceService from '@/stores/balanceService'
import stockCardService from '@/stores/stockCardService'


const router = useRouter()
const authStore = useAuthStore()


// =========================================================
// NAVIGATION
// =========================================================

const goBack = () => {
  router.push('/store-transaction')
}


const printPage = () => {
  const printWindow = window.open('', '_blank', 'width=1200,height=800')
  if (!printWindow) {
    window.print()
    return
  }
  
  const wrappers = document.querySelectorAll('.page-wrapper')
  
  let printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Stock Card Print</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          width: 210mm;
          margin: 0;
          padding: 0;
          background: white;
          font-family: Arial, Helvetica, sans-serif;
        }
        .page-wrapper {
          width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;
          margin: 0;
          padding: 0;
          display: block;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
          overflow: hidden;
          background: #e4efde;
        }
        .page-wrapper:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .page {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
          display: block;
          overflow: hidden;
        }
        .stock-card {
          width: 210mm;
          height: 297mm;
          padding: 6mm 8mm 5mm;
          overflow: hidden;
          background: #e4efde;
          color: #293129;
          font-family: Arial, Helvetica, sans-serif;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .header {
          position: relative;
          width: 100%;
          height: 35mm;
          text-align: center;
        }
        .trust-english {
          position: absolute;
          top: 1mm;
          left: 2mm;
          font-size: 9px;
          font-weight: 600;
          text-align: left;
        }
        .company-name-amharic {
          position: absolute;
          top: 2mm;
          left: 0;
          right: 0;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          font-family: "Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", sans-serif;
        }
        .company-name-english {
          position: absolute;
          top: 9mm;
          left: 0;
          right: 0;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
        }
        .stock-title {
          position: absolute;
          top: 20mm;
          left: 0;
          right: 0;
          font-size: 13px;
          font-weight: 600;
          text-decoration: underline;
        }
        .page-number {
          position: absolute;
          top: 1mm;
          right: 0;
          display: flex;
          align-items: center;
          gap: 3mm;
          font-size: 7.8px;
        }
        .page-amharic {
          position: absolute;
          right: 0;
          top: -4mm;
          font-size: 7px;
          font-family: "Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", sans-serif;
        }
        .page-english {
          font-size: 7.8px;
        }
        .page-value {
          min-width: 14mm;
          height: 12px;
          padding: 0 1mm;
          border-bottom: 1px solid #414941;
          font-size: 7.8px;
          text-align: left;
        }
        .information {
          position: relative;
          width: 100%;
          height: 20mm;
          margin-bottom: 2mm;
        }
        .field {
          position: absolute;
          display: flex;
          align-items: flex-end;
          gap: 1.5mm;
          white-space: nowrap;
          font-size: 7.8px;
        }
        .maximum-stock {
          top: 0;
          left: 0;
          width: 50%;
        }
        .three-fields {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 10mm;
        }
        .merchandise {
          left: 0;
          width: 31%;
        }
        .unit-measurement {
          left: 34%;
          width: 32%;
        }
        .code-number {
          right: 0;
          width: 30%;
        }
        .field-label {
          display: flex;
          flex-direction: column;
          flex: 0 0 auto;
          line-height: 1.2;
        }
        .amharic-label {
          font-size: 7.3px;
          font-weight: 500;
          font-family: "Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", sans-serif;
        }
        .english-label {
          font-size: 7.8px;
          white-space: nowrap;
        }
        .field-value {
          height: 12px;
          min-width: 30mm;
          padding: 0 1mm;
          border-bottom: 1px solid #414941;
          color: #202720;
          font-size: 7.8px;
          line-height: 12px;
        }
        .stock-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 6.8px;
          color: #293129;
        }
        .col-date { width: 8%; }
        .col-grn { width: 11%; }
        .col-siv { width: 11%; }
        .col-particulars { width: 18%; }
        .col-quantity { width: 6.5%; }
        .col-unit-cost { width: 8%; }
        .col-total { width: 7.5%; }
        .stock-table th, .stock-table td {
          border: 1px solid #596258;
          padding: 1.5px;
          text-align: center;
          vertical-align: middle;
          height: 7.5mm;
        }
        .stock-table thead th {
          padding: 1.5px;
          text-align: center;
          vertical-align: middle;
          font-weight: 500;
          line-height: 1.1;
        }
        .stock-table thead tr:first-child th {
          height: 12mm;
        }
        .stock-table thead tr:nth-child(2) th {
          height: 6mm;
        }
        .th-amharic {
          display: block;
          margin-bottom: 1px;
          font-size: 6.7px;
          font-weight: 500;
          line-height: 1.3;
          white-space: nowrap;
          font-family: "Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", sans-serif;
        }
        .th-amharic.small {
          font-size: 6.5px;
        }
        .th-english {
          display: block;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 6.6px;
          font-weight: 500;
          line-height: 1.1;
        }
        .table-value {
          display: block;
          width: 100%;
          padding: 1px 2px;
          color: #293129;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 6.8px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .table-value.text-left {
          text-align: left;
        }
        .calculated {
          text-align: center;
          font-size: 6.8px;
          white-space: nowrap;
        }
        .total-row td {
          height: 7.5mm;
          font-size: 6.8px;
          font-weight: 500;
          text-align: center;
        }
        .total-label {
          text-align: left !important;
          padding-left: 2px !important;
          font-size: 7px !important;
          font-weight: 600 !important;
        }
        [lang="am"] {
          font-family: "Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", sans-serif;
          font-style: normal;
          font-synthesis: none;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }
      </style>
    </head>
    <body>
  `
  
  wrappers.forEach(wrapper => {
    printHTML += wrapper.outerHTML
  })
  
  printHTML += `
    </body>
    </html>
  `
  
  printWindow.document.write(printHTML)
  printWindow.document.close()
  
  printWindow.onload = function() {
    setTimeout(function() {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}


// =========================================================
// ITEM SELECTION STATE
// =========================================================

const itemSearchQuery = ref('')
const showItemDropdown = ref(false)
const selectedItem = ref(null)
const inventoryItems = ref([])
const generating = ref(false)
const hasStockData = ref(false)
const stockCardData = ref(null)


// =========================================================
// FILTER STATE - Only Date Range
// =========================================================

const filterStartDate = ref('')
const filterEndDate = ref('')


// =========================================================
// FILTERED ITEMS
// =========================================================

const filteredItems = computed(() => {
  if (!itemSearchQuery.value || !inventoryItems.value.length) {
    return []
  }
  
  const query = itemSearchQuery.value.toLowerCase().trim()
  
  return inventoryItems.value.filter(item => {
    const code = (item.code || '').toLowerCase()
    const name = (item.name || '').toLowerCase()
    const standardName = (item.standardName || '').toLowerCase()
    
    return code.includes(query) || 
           name.includes(query) || 
           standardName.includes(query)
  }).slice(0, 15)
})


// =========================================================
// ITEM SELECTION METHODS - AUTO-GENERATE
// =========================================================

const onItemSearch = () => {
  showItemDropdown.value = true
}

// ✅ AUTO-GENERATE when item is selected
const selectItem = (item) => {
  selectedItem.value = item
  itemSearchQuery.value = item.code || item.name || ''
  showItemDropdown.value = false
  
  // Auto-generate with a small delay to let UI update
  setTimeout(() => {
    generateStockCard()
  }, 300)
}

const clearSelectedItem = () => {
  selectedItem.value = null
  itemSearchQuery.value = ''
  showItemDropdown.value = false
  stockCardData.value = null
  loadBlankStockCard()
  hasStockData.value = false
}


// =========================================================
// FETCH ITEMS - Filtered by User's Store and Group
// =========================================================

const fetchItems = async () => {
  try {
    const storeId = authStore.userStoreId
    const groupId = authStore.userGroupId
    
    const response = await balanceService.getActiveItems({
      storeId: storeId,
      groupId: groupId
    })
    
    if (response.success && response.data.length > 0) {
      inventoryItems.value = response.data
    } else {
      inventoryItems.value = []
    }
  } catch (error) {
    console.error('Error fetching items:', error)
    inventoryItems.value = []
  }
}


// =========================================================
// LOAD BLANK STOCK CARD
// =========================================================

const loadBlankStockCard = () => {
  rows.splice(0, rows.length)
  
  for (let i = 0; i < 27; i++) {
    rows.push({
      date: '',
      grn: '',
      siv: '',
      particulars: '',
      quantityIn: 0,
      quantityOut: 0,
      unitCost: 0,
      runningQuantityBalance: 0,
      runningCostBalance: 0
    })
  }
  
  form.maximumStockLevel = ''
  form.merchandise = ''
  form.unitOfMeasurement = ''
  form.codeNo = ''
}


// =========================================================
// GENERATE STOCK CARD FOR SELECTED ITEM
// =========================================================

const generateStockCard = async () => {
  if (!selectedItem.value) {
    showToastMessage('Please select an item first', 'error')
    return
  }
  
  const storeId = authStore.userStoreId
  const groupId = authStore.userGroupId
  
  if (!storeId || !groupId) {
    showToastMessage('User store or group not found.', 'error')
    return
  }
  
  generating.value = true
  
  try {
    const filters = {
      storeId: storeId,
      groupId: groupId,
      limit: 100
    }
    
    if (filterStartDate.value) filters.startDate = filterStartDate.value
    if (filterEndDate.value) filters.endDate = filterEndDate.value
    
    const response = await stockCardService.getStockCard(
      selectedItem.value.id,
      filters
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to load stock card')
    }

    stockCardData.value = response.data
    const { form: formData, rows: dataRows, summary, item } = response.data

    form.maximumStockLevel = formData.maximumStockLevel || ''
    form.merchandise = formData.merchandise || ''
    form.unitOfMeasurement = formData.unitOfMeasurement || ''
    form.codeNo = formData.codeNo || ''

    rows.splice(0, rows.length)

    if (!dataRows || dataRows.length === 0 || 
        (dataRows.length === 1 && dataRows[0].particulars?.includes('No transactions'))) {
      rows.push({
        date: '',
        grn: '',
        siv: '',
        particulars: `No transactions found for ${selectedItem.value.code}`,
        quantityIn: 0,
        quantityOut: 0,
        unitCost: item?.costPrice || 0,
        runningQuantityBalance: response.data.currentBalance || 0,
        runningCostBalance: (response.data.currentBalance || 0) * (item?.costPrice || 0)
      })
      
      while (rows.length % 27 !== 0) {
        rows.push({
          date: '',
          grn: '',
          siv: '',
          particulars: '',
          quantityIn: 0,
          quantityOut: 0,
          unitCost: 0,
          runningQuantityBalance: 0,
          runningCostBalance: 0
        })
      }
      
      showToastMessage(`⚠️ No transactions found for ${selectedItem.value.code}`, 'info')
    } else {
      dataRows.forEach(row => {
        rows.push({
          date: row.date || '',
          grn: row.grn || '',
          siv: row.siv || '',
          particulars: row.particulars || '',
          quantityIn: row.quantityIn || 0,
          quantityOut: row.quantityOut || 0,
          unitCost: row.unitCost || 0,
          runningQuantityBalance: row.runningQuantityBalance || 0,
          runningCostBalance: row.runningCostBalance || 0
        })
      })
      
      while (rows.length % 27 !== 0) {
        rows.push({
          date: '',
          grn: '',
          siv: '',
          particulars: '',
          quantityIn: 0,
          quantityOut: 0,
          unitCost: 0,
          runningQuantityBalance: 0,
          runningCostBalance: 0
        })
      }

      const totalTx = summary?.totalTransactions || dataRows.filter(r => r.date).length
      showToastMessage(
        `✅ Loaded ${totalTx} transactions for ${selectedItem.value.code}`,
        'success'
      )
    }

    hasStockData.value = true

  } catch (error) {
    console.error('❌ Error generating stock card:', error)
    showToastMessage(error.message || 'Failed to load stock card data', 'error')
    loadBlankStockCard()
    hasStockData.value = false
  } finally {
    generating.value = false
  }
}


// =========================================================
// FILTER CHANGE - Auto-refresh
// =========================================================

const onFilterChange = () => {
  if (selectedItem.value) {
    clearTimeout(window._filterTimeout)
    window._filterTimeout = setTimeout(() => {
      generateStockCard()
    }, 500)
  }
}


// =========================================================
// FORM / HEADER DATA
// =========================================================

const form = reactive({
  maximumStockLevel: '',
  merchandise: '',
  unitOfMeasurement: '',
  codeNo: ''
})


// =========================================================
// STOCK ROWS
// =========================================================

const rows = reactive([])


/* =========================================================
   ADD ORIGINAL INDEX
========================================================= */

const indexedRows = computed(() => {
  return rows.map((row, index) => ({
    ...row,
    originalIndex: index
  }))
})


/* =========================================================
   ROWS PER A4 PAGE
========================================================= */

const ROWS_PER_PAGE = 27


/* =========================================================
   PAGINATE DATA
========================================================= */

const paginatedRows = computed(() => {
  const result = []

  for (let i = 0; i < indexedRows.value.length; i += ROWS_PER_PAGE) {
    const pageRows = indexedRows.value.slice(i, i + ROWS_PER_PAGE)

    while (pageRows.length < ROWS_PER_PAGE) {
      pageRows.push({
        date: '',
        grn: '',
        siv: '',
        particulars: '',
        quantityIn: 0,
        quantityOut: 0,
        unitCost: 0,
        runningQuantityBalance: 0,
        runningCostBalance: 0,
        originalIndex: -1
      })
    }

    result.push(pageRows)
  }

  return result
})


/* =========================================================
   CHECK WHETHER ROW ACTUALLY HAS DATA
========================================================= */

function hasRowData(row) {
  if (!row) return false

  return (
    String(row.date || '').trim() !== '' ||
    String(row.grn || '').trim() !== '' ||
    String(row.siv || '').trim() !== '' ||
    String(row.particulars || '').trim() !== '' ||
    Number(row.quantityIn || 0) !== 0 ||
    Number(row.quantityOut || 0) !== 0 ||
    Number(row.unitCost || 0) !== 0
  )
}


/* =========================================================
   DISPLAY NUMBER
========================================================= */

function displayNumber(value) {
  const number = Number(value || 0)
  if (number === 0) return ''
  return number.toLocaleString('en-US')
}


/* =========================================================
   DISPLAY MONEY
========================================================= */

function displayMoney(value) {
  const number = Number(value || 0)
  if (number === 0) return ''
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}


/* =========================================================
   RUNNING QUANTITY BALANCE
========================================================= */

function quantityBalance(index) {
  if (index < 0) return ''
  
  const row = rows[index]
  if (row && row.runningQuantityBalance !== undefined) {
    const balance = Number(row.runningQuantityBalance || 0)
    return balance === 0 ? '' : balance.toLocaleString('en-US')
  }
  
  let balance = 0
  for (let i = 0; i <= index; i++) {
    balance += Number(rows[i].quantityIn || 0)
    balance -= Number(rows[i].quantityOut || 0)
  }
  return balance === 0 ? '' : balance.toLocaleString('en-US')
}


/* =========================================================
   RUNNING COST BALANCE
========================================================= */

function runningCostBalance(index) {
  if (index < 0) return 0
  
  const row = rows[index]
  if (row && row.runningCostBalance !== undefined) {
    return Number(row.runningCostBalance || 0)
  }
  
  let balance = 0
  for (let i = 0; i <= index; i++) {
    const quantityIn = Number(rows[i].quantityIn || 0)
    const quantityOut = Number(rows[i].quantityOut || 0)
    const unitCost = Number(rows[i].unitCost || 0)
    balance += quantityIn * unitCost
    balance -= quantityOut * unitCost
  }
  return balance
}


/* =========================================================
   TOTALS
========================================================= */

const totalQuantityIn = computed(() => {
  return rows.reduce((total, row) => total + Number(row.quantityIn || 0), 0)
})

const totalQuantityOut = computed(() => {
  return rows.reduce((total, row) => total + Number(row.quantityOut || 0), 0)
})

const totalQuantityBalance = computed(() => {
  return totalQuantityIn.value - totalQuantityOut.value
})

const totalCostIn = computed(() => {
  return rows.reduce((total, row) => total + Number(row.quantityIn || 0) * Number(row.unitCost || 0), 0)
})

const totalCostOut = computed(() => {
  return rows.reduce((total, row) => total + Number(row.quantityOut || 0) * Number(row.unitCost || 0), 0)
})

const totalCostBalance = computed(() => {
  return totalCostIn.value - totalCostOut.value
})


// =========================================================
// TOAST
// =========================================================

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}


// =========================================================
// LIFECYCLE
// =========================================================

onMounted(async () => {
  await fetchItems()
  loadBlankStockCard()
})


// =========================================================
// WATCH for auth changes
// =========================================================

watch(
  () => [authStore.userStoreId, authStore.userGroupId],
  async ([newStoreId, newGroupId], [oldStoreId, oldGroupId]) => {
    if (newStoreId !== oldStoreId || newGroupId !== oldGroupId) {
      await fetchItems()
      loadBlankStockCard()
      if (selectedItem.value) {
        selectedItem.value = null
        itemSearchQuery.value = ''
        showItemDropdown.value = false
        hasStockData.value = false
      }
    }
  },
  { deep: true }
)


/* =========================================================
   CLOSE DROPDOWN ON CLICK OUTSIDE
========================================================= */

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.item-select-wrapper')
    if (wrapper && !wrapper.contains(e.target)) {
      showItemDropdown.value = false
    }
  })
}

</script>


<style scoped>

/* =========================================================
   RESET
========================================================= */

* {
  box-sizing: border-box;
}


/* =========================================================
   SCREEN - MAIN CONTAINER WITH SCROLL
========================================================= */

.pages-container {
  width: 100%;
  min-height: 100vh;
  max-height: 100vh;
  padding: 20px 0 40px;
  background: #d4d4d4;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
}


/* =========================================================
   LOADING OVERLAY
========================================================= */

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 16px;
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
}


/* =========================================================
   TOP ACTIONS - NO GENERATE BUTTON
========================================================= */

.top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 210mm;
  margin: 0 auto 10px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  gap: 12px;
  flex-wrap: wrap;
}

.btn-back-top {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-back-top:hover {
  background: #e2e8f0;
}

.item-select-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 350px;
}

.item-search-input {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
}
.item-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.item-search-input::placeholder {
  color: #94a3b8;
}

.item-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 280px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 200;
  margin-top: 4px;
}

.item-dropdown-option {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
  transition: background 0.15s;
}
.item-dropdown-option:hover {
  background: #f1f5f9;
}
.item-dropdown-option:last-child {
  border-bottom: none;
}

.item-dropdown-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  min-width: 80px;
}

.item-dropdown-name {
  flex: 1;
  color: #1e293b;
  font-size: 13px;
}

.item-dropdown-uom {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 12px;
  border-radius: 12px;
}

.btn-print-top {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-print-top:hover:not(:disabled) {
  background: #1d4ed8;
}
.btn-print-top:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


/* =========================================================
   SELECTED ITEM DISPLAY
========================================================= */

.selected-item-display {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 210mm;
  margin: 0 auto 12px;
  padding: 8px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  flex-wrap: wrap;
}

.selected-badge {
  font-weight: 600;
  color: #166534;
  font-size: 12px;
}

.selected-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
}

.selected-name {
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
}

.selected-uom {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 12px;
  border-radius: 12px;
}

.selected-cost {
  font-size: 12px;
  color: #166534;
  background: #dcfce7;
  padding: 1px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.generating-indicator {
  font-size: 12px;
  color: #2563eb;
  font-weight: 500;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.clear-selection {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 16px;
  padding: 0 6px;
  margin-left: auto;
}
.clear-selection:hover {
  color: #dc2626;
}


/* =========================================================
   FILTER OPTIONS - Only Date Range
========================================================= */

.filter-options {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 210mm;
  margin: 0 auto 12px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.filter-group input {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  min-width: 140px;
}

.filter-group input:focus {
  outline: none;
  border-color: #3b82f6;
}


/* =========================================================
   TOAST
========================================================= */

.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 12px 20px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  border-left: 4px solid #10b981;
  font-size: 13px;
  max-width: 90vw;
  animation: slideIn 0.3s ease;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.info {
  border-left-color: #3b82f6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}


/* =========================================================
   PAGE WRAPPER
========================================================= */

.page-wrapper {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto 24px;
  display: block;
}


/* =========================================================
   EACH SCREEN PAGE
========================================================= */

.page {
  width: 210mm;
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto 24px;
  display: block;
  overflow: visible;
}


/* =========================================================
   A4 STOCK CARD
========================================================= */

.stock-card {
  position: relative;
  width: 100%;
  max-width: 210mm;
  height: auto;
  min-height: 297mm;
  padding: 8mm 10mm 6mm;
  overflow: visible;
  background: #e4efde;
  color: #293129;
  font-family: Arial, Helvetica, sans-serif;
}


/* =========================================================
   AMHARIC FONT
========================================================= */

[lang="am"],
.amharic-label,
.company-name-amharic,
.th-amharic,
.page-amharic {
  font-family: "Noto Sans Ethiopic", "Nyala", "Abyssinica SIL", sans-serif;
  font-style: normal;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}


/* =========================================================
   HEADER
========================================================= */

.header {
  position: relative;
  width: 100%;
  height: 38mm;
  text-align: center;
}

.trust-english {
  position: absolute;
  top: 2mm;
  left: 2mm;
  font-size: 9px;
  font-weight: 600;
  text-align: left;
}

.company-name-amharic {
  position: absolute;
  top: 3mm;
  left: 0;
  right: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.company-name-english {
  position: absolute;
  top: 11mm;
  left: 0;
  right: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.stock-title {
  position: absolute;
  top: 22mm;
  left: 0;
  right: 0;
  font-size: 15px;
  font-weight: 600;
  text-decoration: underline;
}

.page-number {
  position: absolute;
  top: 2mm;
  right: 0;
  display: flex;
  align-items: center;
  gap: 3mm;
  font-size: 8px;
}

.page-amharic {
  position: absolute;
  right: 0;
  top: -4mm;
  font-size: 7px;
}

.page-english {
  font-size: 8px;
}

.page-value {
  min-width: 14mm;
  height: 12px;
  padding: 0 1mm;
  border-bottom: 1px solid #414941;
  font-size: 8px;
  text-align: left;
}


/* =========================================================
   INFORMATION SECTION
========================================================= */

.information {
  position: relative;
  width: 100%;
  height: 22mm;
  margin-bottom: 3mm;
}

.field {
  position: absolute;
  display: flex;
  align-items: flex-end;
  gap: 2mm;
  white-space: nowrap;
  font-size: 8px;
}

.maximum-stock {
  top: 0;
  left: 0;
  width: 50%;
}

.three-fields {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 11mm;
}

.merchandise {
  left: 0;
  width: 31%;
}

.unit-measurement {
  left: 34%;
  width: 32%;
}

.code-number {
  right: 0;
  width: 30%;
}

.field-label {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  line-height: 1.3;
}

.amharic-label {
  font-size: 7.5px;
  font-weight: 500;
}

.english-label {
  font-size: 8px;
  white-space: nowrap;
}

.field-value {
  height: 14px;
  min-width: 30mm;
  padding: 0 2mm;
  border-bottom: 1px solid #414941;
  color: #202720;
  font-size: 8px;
  line-height: 14px;
}


/* =========================================================
   TABLE
========================================================= */

.stock-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 7px;
  color: #293129;
}

.col-date { width: 9%; }
.col-grn { width: 11%; }
.col-siv { width: 11%; }
.col-particulars { width: 18%; }
.col-quantity { width: 7%; }
.col-unit-cost { width: 9%; }
.col-total { width: 8%; }

.stock-table th,
.stock-table td {
  border: 1px solid #596258;
  padding: 2.5px 4px;
  text-align: center;
  vertical-align: middle;
  height: 8mm;
}

.stock-table thead th {
  padding: 3px 4px;
  text-align: center;
  vertical-align: middle;
  font-weight: 500;
  line-height: 1.2;
}

.stock-table thead tr:first-child th {
  height: 13mm;
}

.stock-table thead tr:nth-child(2) th {
  height: 7mm;
}

.th-amharic {
  display: block;
  margin-bottom: 1px;
  font-size: 7px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
}

.th-amharic.small {
  font-size: 6.5px;
}

.th-english {
  display: block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 6.8px;
  font-weight: 500;
  line-height: 1.1;
}

.stock-table tbody td {
  height: 8mm;
  padding: 2.5px 4px;
  vertical-align: middle;
  text-align: center;
}

.table-value {
  display: block;
  width: 100%;
  padding: 1px 2px;
  color: #293129;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 7px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-value.text-left {
  text-align: left;
}

.calculated {
  text-align: center;
  font-size: 7px;
  white-space: nowrap;
}

.total-row td {
  height: 8mm;
  font-size: 7px;
  font-weight: 500;
  text-align: center;
}

.total-label {
  text-align: left !important;
  padding-left: 4px !important;
  font-size: 7.5px !important;
  font-weight: 600 !important;
}


/* =========================================================
   RESPONSIVE
========================================================= */

@media screen and (max-width: 850px) {
  .pages-container {
    padding: 20px 10px 40px;
  }

  .top-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px 16px;
  }

  .item-select-wrapper {
    max-width: 100%;
  }

  .filter-options {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-group input {
    flex: 1;
    min-width: 0;
  }

  .page-wrapper {
    flex-shrink: 0;
    margin-left: auto;
    margin-right: auto;
    transform: scale(0.85);
    transform-origin: top center;
  }
}

@media screen and (max-width: 650px) {
  .page-wrapper {
    transform: scale(0.7);
    transform-origin: top center;
  }
}

@media screen and (max-width: 500px) {
  .page-wrapper {
    transform: scale(0.55);
    transform-origin: top center;
  }
}

@media screen and (max-width: 400px) {
  .page-wrapper {
    transform: scale(0.45);
    transform-origin: top center;
  }
}

@media screen and (max-width: 480px) {
  .top-actions {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 12px;
  }

  .selected-item-display {
    font-size: 12px;
    gap: 6px;
    padding: 6px 12px;
  }

  .item-dropdown-option {
    flex-wrap: wrap;
  }

  .item-dropdown-name {
    flex: 1 1 100%;
    font-size: 12px;
  }

  .btn-back-top,
  .btn-print-top {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}

</style>