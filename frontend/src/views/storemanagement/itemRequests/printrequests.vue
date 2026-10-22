<!-- views/storemanagement/itemRequests/printrequests.vue -->
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

      <h3 class="form-subtitle-title">{{ displayHeader }}</h3>

      <div class="date-row">
        <span>
          <strong>REQ. NO:-</strong>
          {{ requestData.requestCode || requestData.id }}
        </span>

        <span class="date-field">
          <strong>DATE:-</strong>
          <span class="date-display">{{ displayDate }}</span>
        </span>
      </div>
    </header>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;">No</th>
          <th
            v-for="col in visibleColumns"
            :key="col.key"
            :style="{ width: col.width }"
          >{{ col.label }}</th>
          <th style="width: 10%;">Remark</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!requestData.items || requestData.items.length === 0">
          <td :colspan="visibleColumns.length + 2" class="no-items">
            No items in this request
          </td>
        </tr>

        <tr
          v-for="(item, index) in requestData.items"
          :key="index"
          :class="{ 'row-merged-absorbed': isRowAbsorbedByMerge(index) }"
        >
          <td>{{ index + 1 }}</td>

          <td
            v-for="col in visibleColumns"
            :key="col.key"
            :class="{
              'text-left': col.align === 'left',
              'font-bold': col.bold,
              'spec-cell': col.key === 'specification',
              'computed-cell': col.computed === 'totalPrice',
            }"
          >
            <template v-if="col.computed === 'totalPrice'">
              <span class="computed-value">{{ getComputedCellValue(item, index, col) }}</span>
            </template>

            <template v-else-if="isEditableColumn(col)">
              <span>{{ getCustomCellValue(index, col.key) || '' }}</span>
            </template>

            <template v-else>
              {{ getColumnValue(item, col) }}
            </template>
          </td>

          <td
            v-if="isMergeStartRow(index)"
            class="remark-cell merged-remark-cell"
            :rowspan="getMergeSize(index)"
          >
            <div class="merged-remark-content">
              <span class="merged-remark-text">
                {{ getMergedRemarkText(index) || '—' }}
              </span>
            </div>
          </td>
          <td
            v-else-if="!isRowAbsorbedByMerge(index)"
            class="remark-cell"
          >{{ item.remark || '' }}</td>
        </tr>

        <tr v-if="hasTotalPriceColumn" class="grand-total-row">
          <td class="grand-total-spacer-cell"></td>

          <template v-for="col in visibleColumns" :key="`tot-${col.key}`">
            <td
              v-if="col.key === 'unitPrice'"
              class="grand-total-label-cell"
            >TOTAL</td>
            <td
              v-else-if="col.key === 'totalPrice'"
              class="grand-total-value-cell"
            >
              <span class="grand-total-value">{{ grandTotalFormatted }}</span>
            </td>
            <td v-else class="grand-total-spacer-cell"></td>
          </template>

          <td class="grand-total-spacer-cell"></td>
        </tr>
      </tbody>
    </table>

    <div class="meta-grid">
      <div v-if="sectionVisibility.department" class="meta-col">
        <div class="block-header text-center">Department</div>
        <div class="block-body dept-body">
          <strong class="dept-value">{{ displayDepartment }}</strong>
        </div>
      </div>

      <div class="meta-col">
        <div class="block-header text-center">Requested By</div>
        <div class="block-body workflow-body">
          <p><strong>Name:-</strong> {{ displayRequesterName }}</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>

      <div class="meta-col">
        <div class="block-header text-center">Approved By</div>
        <div class="block-body workflow-body">
          <p><strong>Name :-</strong> {{ displayApprovedByName || '_______________________' }}</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>
    </div>

    <!-- ============ FOOTER SECTIONS (all four) ============ -->
    <div class="footer-sections">
      <!-- Reason — shows even when empty, respects sectionVisibility.reason -->
      <div v-if="sectionVisibility.reason" class="input-row">
        <div class="gray-label">Reason</div>
        <div class="lines-container">
          <div class="reason-text">{{ displayRemark || '' }}</div>
        </div>
      </div>

      <!-- Comment -->
      <div v-if="sectionVisibility.comment" class="input-row short-width">
        <div class="gray-label">Comment</div>
        <div class="lines-container">
          <div class="write-line"></div>
          <div class="write-line"></div>
        </div>
      </div>

      <!-- Checked By -->
      <div v-if="sectionVisibility.checkedBy" class="checked-by-section">
        <div class="gray-label inline-label">Checked By</div>
        <div class="checked-by-body">
          <p><strong>Name</strong> _____________________________.</p>
          <p><strong>Signature</strong> _____________________.</p>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import itemRequestService from '@/stores/itemRequestService'
import employeesService from '@/stores/employee'
import type {
  ItemRequest,
  Store,
  Item,
  PageSnapshot,
} from '@/stores/itemRequestService'

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

// Snapshot-driven page state
const snapshot = ref<PageSnapshot | null>(null)
const customHeader = ref<string | null>(null)
const departmentOverride = ref<string>('')
const approvedByNameOverride = ref<string>('')
const dateOverride = ref<string | null>(null)
const sectionVisibility = ref({
  department: true,
  reason: true,
  comment: true,
  checkedBy: true,
})
const customCells = ref<Record<string, Record<string, string>>>({})
const mergeGroups = ref<Array<{ start: number; size: number; text: string }>>([])

// ================================================================
// COLUMNS — built from snapshot, falls back to defaults
// ================================================================

type ColumnAlign = 'left' | 'center'

interface ColumnDef {
  key: string
  label: string
  width: string
  visible: boolean
  align?: ColumnAlign
  bold?: boolean
  custom?: boolean
  editable?: boolean
  computed?: string
  kind?: string
  pairedKey?: string
  getValue: (item: any) => string
}

const buildDefaultColumns = (): ColumnDef[] => [
  {
    key: 'item',
    label: 'Item',
    width: '20%',
    visible: true,
    align: 'left',
    getValue: (it: any) => getItemNameOnly(it),
  },
  {
    key: 'uom',
    label: 'U.O.M',
    width: '7%',
    visible: true,
    getValue: (it: any) => getItemUOM(it) || 'Pcs',
  },
  {
    key: 'quantity',
    label: 'Qty',
    width: '7%',
    visible: true,
    bold: true,
    getValue: (it: any) => formatQuantity(it.quantity),
  },
  {
    key: 'brand',
    label: 'Brand',
    width: '11%',
    visible: true,
    getValue: (it: any) => getItemBrand(it) || '',
  },
  {
    key: 'model',
    label: 'Model',
    width: '11%',
    visible: true,
    getValue: (it: any) => getItemModel(it) || '',
  },
  {
    key: 'specification',
    label: 'Specification',
    width: '20%',
    visible: true,
    getValue: (it: any) => stripHtml(getItemSpecification(it)) || '',
  },
]

const columns = ref<ColumnDef[]>(buildDefaultColumns())
const visibleColumns = computed(() => columns.value.filter((c) => c.visible))

const isEditableColumn = (col: ColumnDef) =>
  !!col.editable && col.computed !== 'totalPrice'
const hasTotalPriceColumn = computed(() =>
  visibleColumns.value.some((c) => c.key === 'totalPrice'),
)

// ================================================================
// SNAPSHOT HYDRATION
// ================================================================

const applySnapshot = (snap: PageSnapshot | null | undefined) => {
  if (!snap) return
  snapshot.value = snap

  if (typeof snap.header === 'string' && snap.header.trim()) {
    customHeader.value = snap.header.trim()
  }

  if (snap.sectionVisibility) {
    sectionVisibility.value = Object.assign(
      {
        department: true,
        reason: true,
        comment: true,
        checkedBy: true,
      },
      snap.sectionVisibility,
    )
  }

  if (typeof snap.department === 'string') {
    departmentOverride.value = snap.department.trim()
  }
  if (typeof snap.approvedByName === 'string') {
    approvedByNameOverride.value = snap.approvedByName.trim()
  }
  if (typeof snap.overrideDate === 'string' && snap.overrideDate.trim()) {
    dateOverride.value = snap.overrideDate
  }

  if (Array.isArray(snap.columnsConfig) && snap.columnsConfig.length > 0) {
    const builtin = new Map(buildDefaultColumns().map((c) => [c.key, c]))
    const restored: ColumnDef[] = []

    snap.columnsConfig.forEach((s: any) => {
      const base = builtin.get(s.key)
      if (base) {
        restored.push({ ...base, visible: s.visible !== false })
      } else if (s.custom) {
        restored.push({
          key: s.key,
          label: s.label || 'Custom',
          width: s.width || '12%',
          visible: s.visible !== false,
          align: s.align,
          bold: !!s.bold,
          custom: true,
          editable: s.editable ?? true,
          computed: s.computed,
          kind: s.kind,
          pairedKey: s.pairedKey,
          getValue: () => '',
        })
      }
    })

    builtin.forEach((b, k) => {
      if (!restored.find((c) => c.key === k)) {
        restored.push({ ...b, visible: true })
      }
    })

    columns.value = restored
  }

  if (snap.customCells && typeof snap.customCells === 'object') {
    customCells.value = JSON.parse(JSON.stringify(snap.customCells))
  }

  if (Array.isArray(snap.mergeGroups)) {
    mergeGroups.value = snap.mergeGroups
      .map((g: any) => ({
        start: Number(g.start) || 0,
        size: Number(g.size) || 1,
        text: String(g.text ?? '—'),
      }))
      .filter((g) => g.size > 1)
  }
}

// ================================================================
// COLUMN / CELL HELPERS
// ================================================================

const getColumnValue = (item: any, col: ColumnDef): string => {
  try {
    return col.getValue(item) ?? ''
  } catch {
    return ''
  }
}

const getCustomCellValue = (rowIndex: number, colKey: string): string =>
  customCells.value[String(rowIndex)]?.[colKey] || ''

const getComputedCellValue = (
  item: any,
  rowIndex: number,
  col: ColumnDef,
): string => {
  if (col.computed === 'totalPrice') {
    const unit = parseFloat(getCustomCellValue(rowIndex, 'unitPrice')) || 0
    const qty = parseFloat(String(item?.quantity ?? 0)) || 0
    if (!unit || !qty) return ''
    return (unit * qty).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return ''
}

const grandTotalFormatted = computed<string>(() => {
  const totalCol = visibleColumns.value.find((c) => c.key === 'totalPrice')
  if (!totalCol) return ''
  let sum = 0
  const list = requestData.value?.items || []
  list.forEach((it: any, idx: number) => {
    const raw = getComputedCellValue(it, idx, totalCol)
    const num = parseFloat(String(raw).replace(/[^0-9.\-]/g, '')) || 0
    sum += num
  })
  return sum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
})

// ================================================================
// MERGE HELPERS
// ================================================================

const isRowAbsorbedByMerge = (i: number) =>
  mergeGroups.value.some((g) => i > g.start && i < g.start + g.size)

const isMergeStartRow = (i: number) =>
  mergeGroups.value.some((g) => g.start === i)

const getMergeSize = (start: number) => {
  const g = mergeGroups.value.find((grp) => grp.start === start)
  return g ? g.size : 1
}

const getMergedRemarkText = (start: number) => {
  const g = mergeGroups.value.find((grp) => grp.start === start)
  return g ? g.text : ''
}

// ================================================================
// HEADER / DATE / DEPARTMENT / REQUESTER / APPROVED BY
// ================================================================

const defaultHeader = computed<string>(() => {
  if (!requestData.value) return ''
  const fromName = getStoreName(requestData.value.supplyingStoreId)
  const toName = getAskingStoreDisplay()
  return `ITEM REQUEST FROM ${fromName} TO ${toName}`
})

const displayHeader = computed<string>(
  () => customHeader.value ?? defaultHeader.value,
)

const displayDate = computed<string>(() =>
  formatDate(dateOverride.value || requestData.value?.requestedDate),
)

const displayDepartment = computed<string>(() => {
  if (departmentOverride.value && departmentOverride.value.trim()) {
    return departmentOverride.value
  }
  return getRequestingDepartment()
})

const displayRequesterName = computed<string>(() => getRequesterName())

const displayApprovedByName = computed<string>(() => {
  if (approvedByNameOverride.value && approvedByNameOverride.value.trim()) {
    return approvedByNameOverride.value
  }
  return ''
})

const displayRemark = computed<string>(() => {
  if (snapshot.value?.remark && snapshot.value.remark.trim()) {
    return snapshot.value.remark
  }
  return requestData.value?.remark || ''
})

// ================================================================
// DATA LOADING
// ================================================================

const loadStores = async () => {
  try {
    const response = await itemRequestService.getActiveStores()
    if (response.success) stores.value = response.data
  } catch (error) {
    console.error('Load stores error:', error)
  }
}

const loadItems = async () => {
  try {
    const response = await itemRequestService.getActiveItems()
    if (response.success) items.value = response.data
  } catch (error) {
    console.error('Load items error:', error)
  }
}

const loadDepartments = async () => {
  try {
    const response = await employeesService.getDepartments()
    if (response.success) departments.value = response.data
  } catch (error) {
    console.error('Load departments error:', error)
  }
}

const loadRequest = async (requestId: string) => {
  loading.value = true
  try {
    const response = await itemRequestService.getRequestById(
      Number(requestId),
    )
    if (response.success && response.data) {
      requestData.value = response.data

      const snap = (response.data as any).printOverride?.pageSnapshot ?? null
      if (snap) applySnapshot(snap)
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
  if (user?.department) {
    if (typeof user.department === 'string') return user.department
    if (typeof user.department === 'object' && user.department.name) {
      return user.department.name
    }
  }
  if (user?.departmentId) {
    const dept = departments.value.find(
      (d) =>
        d.departmentId === user.departmentId ||
        d.id === user.departmentId ||
        d.department_id === user.departmentId,
    )
    if (dept) {
      return (
        dept.name ||
        dept.departmentName ||
        `Department ${user.departmentId}`
      )
    }
    return `Department ${user.departmentId}`
  }
  return 'N/A'
}

const getRequesterName = (): string => {
  if (!requestData.value) return 'N/A'
  const req = requestData.value
  if (req.requestedBy && String(req.requestedBy).trim()) {
    return String(req.requestedBy).trim()
  }
  const user = req.requestedByUser
  if (user) {
    if (user.fullName) return user.fullName
    if (user.full_name) return user.full_name
    if (user.username) return user.username
  }
  return 'N/A'
}

// ================================================================
// STORE HELPERS
// ================================================================

const getStoreName = (storeId: number): string => {
  const store = stores.value.find((s) => (s.storeId || s.id) === storeId)
  return store ? store.name : 'Unknown Store'
}

const isOtherStore = (
  storeOrId: number | Store | null | undefined,
): boolean => {
  if (storeOrId === null || storeOrId === undefined) return false
  let store: Store | undefined = undefined
  if (typeof storeOrId === 'object') store = storeOrId
  else store = stores.value.find((s) => (s.storeId || s.id) === storeOrId)
  if (!store) return false
  const code = ((store as any).code || '').toUpperCase()
  const name = (store.name || '').trim().toLowerCase()
  return code === 'STORE-008' || name === 'other'
}

const getAskingStoreDisplay = (): string => {
  if (!requestData.value) return 'Unknown Store'
  const req = requestData.value
  const askingStore = stores.value.find(
    (s) => (s.storeId || s.id) === req.askingStoreId,
  )
  if (isOtherStore(askingStore)) return getRequestingDepartment()
  return getStoreName(req.askingStoreId)
}

// ================================================================
// ITEM HELPERS
// ================================================================

const getItemNameOnly = (item: any): string => {
  if (!item) return 'Unknown Item'
  if (item.item) {
    if (item.item.name) return item.item.name
    if (item.item.standardName) return item.item.standardName
  }
  if (item.itemName) return item.itemName
  if (item.name) return item.name
  return 'Unknown Item'
}

const getItemBrand = (item: any): string => {
  if (!item) return ''
  if (item.brand) return item.brand
  if (item.item?.brand) return item.item.brand
  const globalItem = items.value.find(
    (i) => (i.itemId || i.id) === item.itemId,
  )
  if (globalItem?.brand) return globalItem.brand
  return ''
}

const getItemModel = (item: any): string => {
  if (!item) return ''
  if (item.model) return item.model
  if (item.item?.model) return item.item.model
  const globalItem = items.value.find(
    (i) => (i.itemId || i.id) === item.itemId,
  )
  if (globalItem?.model) return globalItem.model
  return ''
}

const getItemUOM = (item: any): string => {
  if (!item) return ''
  if (item.uom_code) return item.uom_code
  if (item.uomCode) return item.uomCode
  if (item.item?.uom?.code) return item.item.uom.code
  if (item.item?.uom) {
    if (typeof item.item.uom === 'string') return item.item.uom
  }
  return ''
}

const getItemSpecification = (item: any): string => {
  if (!item) return ''
  if (item.specification) return item.specification
  if (item.item?.specText) return item.item.specText
  if (item.specText) return item.specText
  return ''
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
  if (isNaN(date.getTime())) return 'N/A'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const stripHtml = (htmlContent: string): string => {
  if (!htmlContent) return ''
  return htmlContent
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<p[^>]*>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .trim()
}

// ================================================================
// NAVIGATION
// ================================================================

const goBack = (): void => {
  router.push({ name: 'item-requests' })
}

const printPage = (): void => {
  setTimeout(() => window.print(), 50)
}

// ================================================================
// LIFECYCLE
// ================================================================

const initialize = async () => {
  const requestId =
    (route.query.id as string) || (route.params.id as string)
  if (requestId) {
    await Promise.all([loadStores(), loadItems(), loadDepartments()])
    await loadRequest(requestId)
  } else {
    loading.value = false
  }
}

onMounted(() => {
  initialize()
})

watch(
  () => route.query.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) initialize()
  },
)
</script>

<style scoped>
/* ================================================================
   PAGE SETUP
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
   FORM HEADERS
   ================================================================ */
.form-header { margin-bottom: 5px; }
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
  padding: 6px 10px;
}
.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 12px;
}
.date-field { display: inline-flex; align-items: center; gap: 6px; }
.date-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
}

/* ================================================================
   TABLE
   ================================================================ */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 25px;
  font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
  font-size: 15px;
  table-layout: fixed;
}
.items-table th,
.items-table td {
  border: 1px solid #7f7f7f;
  padding: 10px 6px;
  text-align: center;
  height: 36px;
  word-wrap: break-word;
  vertical-align: middle;
}
.items-table th {
  background-color: #c8c8c8;
  font-weight: 800;
  font-size: 16.5px;
  letter-spacing: 0.4px;
  padding: 12px 6px;
}
.items-table td.text-left { text-align: left; padding-left: 8px; }
.font-bold { font-weight: 700; }
.no-items {
  padding: 20px !important;
  color: #7f7f7f;
  font-style: italic;
  text-align: center !important;
}
.spec-cell { font-size: 14.5px; line-height: 1.4; }

.remark-cell {
  padding: 8px !important;
  font-size: 14.5px;
  line-height: 1.4;
  vertical-align: middle;
  word-break: break-word;
}

/* ================================================================
   MERGED REMARK CELL — full border, including bottom
   ================================================================ */
.merged-remark-cell {
  background: #ffffff;
  vertical-align: middle !important;
  border: 1px solid #7f7f7f !important;
}

.merged-remark-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px;
  min-height: 100%;
  text-align: center;
}

.merged-remark-text {
  font-size: 14.5px;
  line-height: 1.4;
  color: #000;
  text-align: center;
}

.row-merged-absorbed td { background: #fafafa; }

/* ================================================================
   COMPUTED / GRAND TOTAL
   ================================================================ */
.computed-cell { background: #f8fafc !important; }
.computed-value { font-weight: 700; color: #0f172a; font-size: 14.5px; }

.grand-total-row td {
  background: #e5e7eb !important;
  font-weight: 800;
  border-color: #7f7f7f !important;
  height: 40px;
}
.grand-total-spacer-cell { background: #e5e7eb !important; }
.grand-total-label-cell {
  background: #e5e7eb !important;
  text-align: center !important;
  font-weight: 900;
  letter-spacing: 0.6px;
  color: #111827;
  font-size: 15px;
  padding: 8px 4px !important;
}
.grand-total-value-cell {
  background: #e5e7eb !important;
  text-align: center !important;
}
.grand-total-value {
  font-weight: 900;
  font-size: 16px;
  color: #111827;
  letter-spacing: 0.3px;
}

/* ================================================================
   META GRID
   ================================================================ */
.meta-grid {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 25px;
}
.meta-col { flex: 1; }
.block-header {
  background-color: #d9d9d9;
  border: 1px solid #7f7f7f;
  padding: 5px;
  font-weight: bold;
  font-size: 14px;
}
.text-center { text-align: center; }
.block-body {
  padding-top: 10px;
  font-size: 13px;
  min-height: 80px;
}
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
}
.workflow-body p { margin: 6px 0; }

/* ================================================================
   FOOTER SECTIONS — Reason / Comment / Checked By
   ================================================================ */
.footer-sections {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.input-row {
  display: flex;
  width: 100%;
  border: 1px solid #7f7f7f;
  border-radius: 6px;
  overflow: hidden;
}
.input-row.short-width { width: 65%; }

.gray-label {
  background-color: #d9d9d9;
  color: #000;
  font-weight: bold;
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  min-height: 46px;
  padding: 10px 12px;
  text-align: center;
  flex-shrink: 0;
}

.lines-container {
  flex-grow: 1;
  background-color: #fff;
  min-height: 46px;
}

.reason-text {
  font-size: 13px;
  padding: 10px 12px;
  line-height: 1.5;
  min-height: 46px;
  box-sizing: border-box;
  color: #1e293b;
  white-space: pre-wrap;
}

.write-line {
  height: 22px;
  border-bottom: 1px solid #7f7f7f;
  background: #fff;
}
.write-line:last-child { border-bottom: none; background: #f9f9f9; }

.checked-by-section {
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
.checked-by-body p { margin: 6px 0; }

/* ================================================================
   LOADING & ERROR
   ================================================================ */
.loading-state,
.error-state {
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
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 48px; margin-bottom: 16px; }
.error-state h2 { color: #1e293b; margin-bottom: 8px; }
.error-state p { color: #64748b; margin-bottom: 16px; }
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
   PRINT OVERRIDES
   ================================================================ */
@media print {
  .no-print { display: none !important; }
  .top-actions { display: none !important; }
  body { background-color: #fff !important; }

  .print-page {
    max-width: 100% !important;
    padding: 10px !important;
    margin: 0 !important;
  }

  .block-header,
  .items-table th,
  .grand-total-row td,
  .gray-label {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .items-table th {
    background-color: #c0c0c0 !important;
    color: #000000 !important;
    font-size: 13px !important;
    padding: 9px 5px !important;
  }

  .grand-total-row td {
    background-color: #dcdcdc !important;
    color: #000000 !important;
    font-size: 13px !important;
  }

  .grand-total-label-cell,
  .grand-total-value {
    font-weight: 900 !important;
    font-size: 13.5px !important;
    color: #000000 !important;
  }

  .block-header {
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }

  .gray-label {
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }

  .items-table,
  .items-table th,
  .items-table td {
    font-family: 'Segoe UI', Tahoma, Verdana, sans-serif !important;
    font-size: 12.5px !important;
    letter-spacing: 0.2px !important;
  }

  .items-table td {
    padding: 6px 4px !important;
    height: 30px !important;
  }

  .items-table th,
  .items-table td {
    border-color: #000000 !important;
  }

  .merged-remark-cell {
    background: #ffffff !important;
    border: 1px solid #000000 !important;
  }
  .row-merged-absorbed td { background: #ffffff !important; }
  .computed-cell { background: #ffffff !important; }

  .motto { font-size: 16px !important; }
  .company-name { font-size: 18px !important; }
  .form-subtitle-title { font-size: 13px !important; }

  .meta-grid { gap: 15px !important; }
  .dept-value { font-size: 18px !important; }

  .meta-grid { page-break-inside: avoid !important; }
  .items-table tr { page-break-inside: avoid !important; }
  .items-table { page-break-after: avoid !important; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .print-page { padding: 10px; }
  .meta-grid { flex-direction: column; gap: 15px; }
  .top-actions {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .top-actions button {
    width: 100%;
    justify-content: center;
  }
  .items-table { font-size: 12px; }
  .items-table th,
  .items-table td {
    padding: 5px 3px;
    height: 26px;
  }
  .items-table th { font-size: 11.5px; }
  .date-row { flex-direction: column; gap: 4px; font-size: 11px; }
  .motto { font-size: 15px; }
  .company-name { font-size: 16px; }
  .form-subtitle-title { font-size: 12px; }
  .dept-value { font-size: 16px !important; }

  .input-row.short-width { width: 100%; }
  .gray-label { width: 120px; font-size: 12px; }
  .checked-by-section { width: 100%; }
}

/* ================================================================
   PRINT OVERRIDES
   ================================================================ */
@media print {
  .no-print { display: none !important; }
  .top-actions { display: none !important; }
  body { background-color: #fff !important; }

  .print-page {
    max-width: 100% !important;
    padding: 10px !important;
    margin: 0 !important;
  }

  .block-header,
  .items-table th,
  .grand-total-row td,
  .gray-label {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .items-table th {
    background-color: #c0c0c0 !important;
    color: #000000 !important;
    font-size: 13px !important;
    padding: 9px 5px !important;
  }

  .grand-total-row td {
    background-color: #dcdcdc !important;
    color: #000000 !important;
    font-size: 13px !important;
  }

  .grand-total-label-cell,
  .grand-total-value {
    font-weight: 900 !important;
    font-size: 13.5px !important;
    color: #000000 !important;
  }

  .block-header {
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }

  .gray-label {
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }

  .items-table,
  .items-table th,
  .items-table td {
    font-family: 'Segoe UI', Tahoma, Verdana, sans-serif !important;
    font-size: 12.5px !important;
    letter-spacing: 0.2px !important;
  }

  .items-table td {
    padding: 6px 4px !important;
    height: 30px !important;
  }

  .items-table th,
  .items-table td {
    border-color: #000000 !important;
  }

  .merged-remark-cell {
    background: #ffffff !important;
    border: 1px solid #000000 !important;
  }
  .row-merged-absorbed td { background: #ffffff !important; }
  .computed-cell { background: #ffffff !important; }

  .motto { font-size: 16px !important; }
  .company-name { font-size: 18px !important; }
  .form-subtitle-title { font-size: 13px !important; }

  .meta-grid { gap: 15px !important; }
  .dept-value { font-size: 18px !important; }

  .meta-grid { page-break-inside: avoid !important; }
  .items-table tr { page-break-inside: avoid !important; }
  .items-table { page-break-after: avoid !important; }

  .footer-sections { page-break-inside: avoid !important; }
  .input-row { page-break-inside: avoid !important; }
  .checked-by-section { page-break-inside: avoid !important; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .print-page { padding: 10px; }
  .meta-grid { flex-direction: column; gap: 15px; }
  .top-actions {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .top-actions button {
    width: 100%;
    justify-content: center;
  }
  .items-table { font-size: 12px; }
  .items-table th,
  .items-table td {
    padding: 5px 3px;
    height: 26px;
  }
  .items-table th { font-size: 11.5px; }
  .date-row { flex-direction: column; gap: 4px; font-size: 11px; }
  .motto { font-size: 15px; }
  .company-name { font-size: 16px; }
  .form-subtitle-title { font-size: 12px; }
  .dept-value { font-size: 16px !important; }

  .input-row.short-width { width: 100%; }
  .gray-label { width: 120px; font-size: 12px; }
  .checked-by-section { width: 100%; }
}
</style>