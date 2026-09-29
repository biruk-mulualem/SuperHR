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

      <!-- VIEW MODE -->
      <h3
        v-if="!isEditingHeader"
        class="form-subtitle-title"
      >{{ displayHeader }}</h3>

      <!-- EDIT MODE -->
      <h3
        v-else
        ref="headerLineRef"
        class="form-subtitle-title is-editing"
        contenteditable="true"
        @keydown.enter.prevent="saveHeader"
        @keydown.esc.prevent="cancelEditingHeader"
        @paste="onPastePlain"
      ></h3>

      <!-- Header controls -->
      <div class="header-edit-controls no-print">
        <button
          v-if="!isEditingHeader"
          class="btn-edit-header"
          @click="startEditingHeader"
          title="Edit header line"
        >✏️ Edit Header</button>
        <template v-else>
          <button class="btn-save-header" @click="saveHeader">💾 Save</button>
          <button class="btn-cancel-header" @click="cancelEditingHeader">✖ Cancel</button>
          <span class="edit-hint">Press Enter to save · Esc to cancel</span>
        </template>

        <button
          v-if="!isEditingHeader"
          class="btn-merge-toggle"
          :class="{ active: isMergingRemarks }"
          @click="toggleMergeMode"
          :title="isMergingRemarks ? 'Exit merge mode' : 'Merge remarks across rows'"
        >{{ isMergingRemarks ? '✖ Exit Merge' : '🔀 Merge Remarks' }}</button>
      </div>

      <div class="date-row">
        <span><strong>REQ. NO:-</strong> {{ requestData.requestCode || requestData.id }}</span>
        <span><strong>DATE:-</strong> {{ formatDate(requestData.requestedDate) }}</span>
      </div>
    </header>

    <!-- Merge helper bar -->
    <div v-if="isMergingRemarks" class="merge-bar no-print">
      <span class="merge-bar-info">
        <strong>{{ selectedRowIndexes.length }}</strong> row(s) selected
        <span v-if="selectedRowIndexes.length < 2" class="merge-hint">
          (select at least 2 consecutive rows)
        </span>
      </span>
      <button
        class="btn-merge-apply"
        :disabled="selectedRowIndexes.length < 2"
        @click="applyMerge"
      >🔀 Merge Selected Remarks</button>
      <button
        class="btn-merge-clear"
        :disabled="selectedRowIndexes.length === 0"
        @click="clearSelection"
      >Clear Selection</button>
      <span v-if="mergeGroups.length > 0" class="merge-groups-info">
        Active merges: <strong>{{ mergeGroups.length }}</strong>
      </span>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th v-if="isMergingRemarks" class="no-print" style="width: 3%;">☑</th>
          <th style="width: 5%;">No</th>
          <th style="width: 25%;">Item</th>
          <th style="width: 8%;">U.O.M</th>
          <th style="width: 8%;">Qty</th>
          <th style="width: 12%;">Brand</th>
          <th style="width: 12%;">Model</th>
          <th style="width: 20%;">Specification</th>
          <th style="width: 10%;">Remark</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!requestData.items || requestData.items.length === 0">
          <td :colspan="isMergingRemarks ? 9 : 8" class="no-items">No items in this request</td>
        </tr>

        <tr
          v-for="(item, index) in requestData.items"
          :key="index"
          :class="{
            'row-selected': isRowSelected(index),
            'row-merged-absorbed': isRowAbsorbedByMerge(index)
          }"
        >
          <!-- Checkbox column (merge mode only) -->
          <td v-if="isMergingRemarks" class="no-print cell-checkbox">
            <input
              v-if="!isRowMerged(index)"
              type="checkbox"
              :checked="isRowSelected(index)"
              @change="toggleRowSelection(index)"
            />
            <span v-else class="merged-lock" title="Part of a merge">🔗</span>
          </td>

          <td>{{ index + 1 }}</td>
          <td class="text-left">{{ getItemNameOnly(item) }}</td>
          <td>{{ getItemUOM(item) || 'Pcs' }}</td>
          <td class="font-bold">{{ formatQuantity(item.quantity) }}</td>
          <td>{{ getItemBrand(item) || '' }}</td>
          <td>{{ getItemModel(item) || '' }}</td>
          <td class="spec-cell">{{ stripHtml(getItemSpecification(item)) || '' }}</td>

          <!-- Merged remark cell (only on first row of group) -->
          <td
            v-if="isMergeStartRow(index)"
            class="remark-cell merged-remark-cell"
            :rowspan="getMergeSize(index)"
          >
            <div class="merged-remark-content">
              <span class="merged-remark-text">
                {{ getMergedRemarkText(index) || '—' }}
              </span>
              <button
                v-if="isMergingRemarks"
                class="btn-unmerge no-print"
                @click="unmergeGroup(index)"
                title="Unmerge this group"
              >✖ Unmerge</button>
            </div>
          </td>
          <!-- Normal remark cell (non-merged, non-absorbed rows) -->
          <td
            v-else-if="!isRowAbsorbedByMerge(index)"
            class="remark-cell"
          >{{ item.remark || '' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="meta-grid">
      <div class="meta-col">
        <div class="block-header text-center">Department</div>
        <div class="block-body dept-body">
          <strong class="dept-value">{{ getRequestingDepartment() }}</strong>
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
        <div class="block-header text-center">Approved By</div>
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
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import itemRequestService from '@/stores/itemRequestService'
import employeesService from '@/stores/employee'
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
// EDITABLE HEADER STATE
// ================================================================

const isEditingHeader = ref(false)
const headerLineRef = ref<HTMLElement | null>(null)
let headerSnapshot = ''
const customHeader = ref<string | null>(null)

// Default header for this form
const DEFAULT_HEADER = 'ASSET REQUISITION FORM'

const displayHeader = computed<string>(() => customHeader.value ?? DEFAULT_HEADER)

// ================================================================
// REMARK MERGE STATE
// ================================================================

const isMergingRemarks = ref(false)
const selectedRowIndexes = ref<number[]>([])

interface MergeGroup {
  start: number
  size: number
  text: string
}
const mergeGroups = ref<MergeGroup[]>([])

// ================================================================
// RESET WHEN REQUEST CHANGES
// ================================================================

const currentRequestKey = computed<string>(() => {
  if (!requestData.value) return ''
  const r = requestData.value as any
  return String(r.requestCode || r.id || '')
})

watch(currentRequestKey, () => {
  customHeader.value = null
  isEditingHeader.value = false
  headerSnapshot = ''

  isMergingRemarks.value = false
  selectedRowIndexes.value = []
  mergeGroups.value = []
})

// ================================================================
// HEADER EDIT FLOW
// ================================================================

const startEditingHeader = async () => {
  if (!requestData.value) return
  headerSnapshot = displayHeader.value
  isEditingHeader.value = true

  await nextTick()
  const el = headerLineRef.value
  if (el) {
    el.innerText = headerSnapshot
    el.focus()
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(el)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }
}

const cancelEditingHeader = () => {
  isEditingHeader.value = false
}

const saveHeader = () => {
  if (!requestData.value) return
  const el = headerLineRef.value
  const rawText = el?.innerText ?? ''
  const cleaned = rawText.replace(/\s+/g, ' ').trim()

  customHeader.value = (!cleaned || cleaned === DEFAULT_HEADER) ? null : cleaned
  isEditingHeader.value = false
}

const onPastePlain = (e: ClipboardEvent) => {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text)
}

// ================================================================
// MERGE — MODE TOGGLE
// ================================================================

const toggleMergeMode = () => {
  isMergingRemarks.value = !isMergingRemarks.value
  if (!isMergingRemarks.value) {
    selectedRowIndexes.value = []
  }
}

const isRowSelected = (index: number): boolean => selectedRowIndexes.value.includes(index)

const toggleRowSelection = (index: number) => {
  const pos = selectedRowIndexes.value.indexOf(index)
  if (pos >= 0) selectedRowIndexes.value.splice(pos, 1)
  else selectedRowIndexes.value.push(index)
}

const clearSelection = () => {
  selectedRowIndexes.value = []
}

// ================================================================
// MERGE — ROW / GROUP LOOKUPS
// ================================================================

const isRowMerged = (index: number): boolean => {
  return mergeGroups.value.some(g => index >= g.start && index < g.start + g.size)
}

const isRowAbsorbedByMerge = (index: number): boolean => {
  return mergeGroups.value.some(g => index > g.start && index < g.start + g.size)
}

const isMergeStartRow = (index: number): boolean => {
  return mergeGroups.value.some(g => g.start === index)
}

const getMergeSize = (startIndex: number): number => {
  const g = mergeGroups.value.find(grp => grp.start === startIndex)
  return g ? g.size : 1
}

const getMergedRemarkText = (startIndex: number): string => {
  const g = mergeGroups.value.find(grp => grp.start === startIndex)
  return g ? g.text : ''
}

// ================================================================
// MERGE — APPLY / UNMERGE
// ================================================================

const applyMerge = () => {
  const selected = [...selectedRowIndexes.value].sort((a, b) => a - b)
  if (selected.length < 2) return

  if (selected.some(i => isRowMerged(i))) {
    alert('Some selected rows are already part of a merge. Unmerge them first.')
    return
  }

  for (let i = 1; i < selected.length; i++) {
    const previous = selected[i - 1]
    const current = selected[i]

    if (current === undefined || previous === undefined || current !== previous + 1) {
      alert('Please select consecutive rows to merge their remarks.')
      return
    }
  }

  const firstRow = selected[0]
  if (firstRow === undefined) {
    alert('Please select at least two rows to merge their remarks.')
    return
  }

  const originalText = requestData.value?.items?.[firstRow]?.remark
  const text = originalText && String(originalText).trim() ? String(originalText).trim() : '—'

  mergeGroups.value = [
    ...mergeGroups.value,
    { start: firstRow, size: selected.length, text },
  ]

  selectedRowIndexes.value = []
}

const unmergeGroup = (startIndex: number) => {
  mergeGroups.value = mergeGroups.value.filter(g => g.start !== startIndex)
}

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
  loading.value = true
  try {
    const response = await itemRequestService.getRequestById(Number(requestId))
    if (response.success) {
      requestData.value = response.data
      console.log('✅ Request loaded:', requestData.value)
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
  const store = stores.value.find(s => (s.storeId || s.id) === storeId)
  return store ? store.name : 'Unknown Store'
}

const isOtherStore = (storeOrId: number | Store | null | undefined): boolean => {
  if (storeOrId === null || storeOrId === undefined) return false

  let store: Store | undefined = undefined

  if (typeof storeOrId === 'object') {
    store = storeOrId
  } else {
    store = stores.value.find(s => (s.storeId || s.id) === storeOrId)
  }

  if (!store) return false

  const code = ((store as any).code || '').toUpperCase()
  const name = (store.name || '').trim().toLowerCase()

  return code === 'STORE-008' || name === 'other'
}

const getAskingStoreDisplay = (): string => {
  if (!requestData.value) return 'Unknown Store'

  const req = requestData.value

  const askingStore = stores.value.find(
    s => (s.storeId || s.id) === req.askingStoreId
  )

  if (isOtherStore(askingStore)) {
    return getRequestingDepartment()
  }

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

  const globalItem = items.value.find(i => (i.itemId || i.id) === item.itemId)
  if (globalItem?.brand) return globalItem.brand

  return ''
}

const getItemModel = (item: any): string => {
  if (!item) return ''
  if (item.model) return item.model
  if (item.item?.model) return item.item.model

  const globalItem = items.value.find(i => (i.itemId || i.id) === item.itemId)
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
  router.push('/item-requests')
}

const printPage = (): void => {
  if (isEditingHeader.value) cancelEditingHeader()
  if (isMergingRemarks.value) isMergingRemarks.value = false
  setTimeout(() => window.print(), 50)
}

// ================================================================
// LIFECYCLE
// ================================================================

const initialize = async () => {
  const requestId = route.query.id as string
  if (requestId) {
    await Promise.all([
      loadStores(),
      loadItems(),
      loadDepartments()
    ])
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
  }
)
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
  transition: background-color 0.15s ease, outline 0.15s ease;
  border-radius: 6px;
  padding: 6px 10px;
  outline: 1px dashed transparent;
  outline-offset: 2px;
}

.form-subtitle-title:not(.is-editing):hover {
  outline-color: #cbd5e1;
  background: #f8fafc;
}

.form-subtitle-title.is-editing {
  background: #eff6ff;
  outline: 2px solid #2563eb;
  cursor: text;
  text-transform: none;
  letter-spacing: 0.3px;
  white-space: pre-wrap;
  word-break: break-word;
}

.form-subtitle-title.is-editing:focus {
  background: #dbeafe;
}

.header-edit-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: -8px 0 15px 0;
  flex-wrap: wrap;
}

.btn-edit-header,
.btn-save-header,
.btn-cancel-header,
.btn-merge-toggle {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  transition: filter 0.15s ease, background-color 0.15s ease;
}

.btn-edit-header:hover,
.btn-save-header:hover,
.btn-cancel-header:hover,
.btn-merge-toggle:hover {
  filter: brightness(0.95);
}

.btn-edit-header {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn-save-header {
  background: #16a34a;
  color: #fff;
}

.btn-cancel-header {
  background: #e2e8f0;
  color: #334155;
}

.btn-merge-toggle {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.btn-merge-toggle.active {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}

.edit-hint {
  font-size: 10px;
  color: #64748b;
  font-style: italic;
  margin-left: 4px;
}

.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 12px;
}

/* ================================================================
   MERGE BAR
   ================================================================ */
.merge-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin: 0 0 12px 0;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.merge-bar-info {
  color: #78350f;
  white-space: nowrap;
}

.merge-hint {
  color: #a16207;
  font-style: italic;
  margin-left: 4px;
}

.merge-groups-info {
  color: #166534;
  margin-left: auto;
  white-space: nowrap;
}

.btn-merge-apply,
.btn-merge-clear {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
}

.btn-merge-apply {
  background: #d97706;
  color: #fff;
}

.btn-merge-apply:disabled {
  background: #cbd5e1;
  color: #64748b;
  cursor: not-allowed;
}

.btn-merge-clear {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn-merge-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   TABLE CONFIGURATION
   ================================================================ */
.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 25px;
  font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
  font-size: 12.5px;
  table-layout: fixed;
}

.items-table th,
.items-table td {
  border: 1px solid #7f7f7f;
  padding: 7px 5px;
  text-align: center;
  height: 30px;
  word-wrap: break-word;
  vertical-align: middle;
  font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
}

/* Header row: bigger + darker background */
.items-table th {
  background-color: #c8c8c8;
  font-weight: 800;
  font-size: 13.5px;
  letter-spacing: 0.4px;
  padding: 10px 6px;
  color: #000;
  text-transform: none;
}

.items-table td.text-left {
  text-align: left;
  padding-left: 8px;
}

.font-bold {
  font-weight: 700;
}

.no-items {
  padding: 20px !important;
  color: #7f7f7f;
  font-style: italic;
  text-align: center !important;
}

.spec-cell {
  font-size: 12px;
  line-height: 1.35;
}

.cell-checkbox {
  text-align: center !important;
  padding: 2px !important;
}

.cell-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.merged-lock {
  font-size: 12px;
  opacity: 0.6;
}

.row-selected td {
  background-color: #fef9c3;
}

/* ================================================================
   REMARK CELL & MERGED CELL
   ================================================================ */
.remark-cell {
  padding: 5px !important;
  font-size: 12px;
  line-height: 1.4;
  vertical-align: middle;
  word-break: break-word;
}

.merged-remark-cell {
  background: #ffffff;
  vertical-align: middle !important;
  border-top: none !important;
  border-bottom: none !important;
}

.items-table tr td.merged-remark-cell {
  border-top: 1px solid #7f7f7f !important;
}

.merged-remark-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px;
  min-height: 100%;
  height: 100%;
  text-align: center;
}

.merged-remark-text {
  font-size: 12px;
  line-height: 1.4;
  color: #000;
  word-break: break-word;
  white-space: pre-wrap;
  text-align: center;
}

.row-merged-absorbed td {
  background: #fafafa;
}

.btn-unmerge {
  font-size: 10px;
  padding: 2px 8px;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
  border-radius: 3px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 2px;
}

.btn-unmerge:hover {
  background: #fecaca;
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
   FOOTER SECTIONS
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
   PRINT OVERRIDES
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

  .gray-label,
  .block-header,
  .items-table th {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .items-table th {
    background-color: #c0c0c0 !important;
    color: #000000 !important;
    font-size: 12px !important;
    padding: 8px 5px !important;
  }

  .gray-label,
  .block-header {
    background-color: #d9d9d9 !important;
    color: #000000 !important;
  }

  .form-subtitle-title,
  .form-subtitle-title.is-editing {
    outline: none !important;
    background: transparent !important;
    padding: 0 !important;
    border-radius: 0 !important;
    cursor: default !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    margin-bottom: 15px !important;
  }

  .header-edit-controls,
  .merge-bar,
  .btn-unmerge {
    display: none !important;
  }

  .items-table,
  .items-table th,
  .items-table td {
    font-family: 'Segoe UI', Tahoma, Verdana, sans-serif !important;
    font-size: 11px !important;
    letter-spacing: 0.2px !important;
  }

  .items-table td {
    padding: 5px 4px !important;
    height: 26px !important;
  }

  .merged-remark-cell {
    border-top: none !important;
    border-bottom: none !important;
    background: #ffffff !important;
  }

  .items-table tr td.merged-remark-cell {
    border-top: 1px solid #000000 !important;
  }

  .row-merged-absorbed td {
    background: #ffffff !important;
  }

  .row-selected td {
    background: transparent !important;
  }

  .items-table th,
  .items-table td {
    border-color: #000000 !important;
  }

  .motto { font-size: 16px !important; }
  .company-name { font-size: 18px !important; }
  .form-subtitle-title { font-size: 13px !important; }

  .meta-grid { gap: 15px !important; }
  .input-row { width: 90% !important; }
  .input-row.short-width { width: 70% !important; }
  .dept-value { font-size: 18px !important; }

  .meta-grid,
  .footer-sections {
    page-break-inside: avoid !important;
  }

  .items-table tr {
    page-break-inside: avoid !important;
  }

  .items-table {
    page-break-after: avoid !important;
  }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .print-page { padding: 10px; }

  .meta-grid {
    flex-direction: column;
    gap: 15px;
  }

  .input-row,
  .input-row.short-width { width: 100%; }

  .gray-label {
    width: 100px;
    font-size: 11px;
    min-height: 38px;
  }

  .inline-label { width: 100px; }

  .top-actions {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }

  .top-actions button {
    width: 100%;
    justify-content: center;
  }

  .items-table { font-size: 10px; }

  .items-table th,
  .items-table td {
    padding: 3px 2px;
    height: 20px;
  }

  .items-table th { font-size: 9px; }

  .date-row {
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
  }

  .motto { font-size: 15px; }
  .company-name { font-size: 16px; }
  .form-subtitle-title { font-size: 12px; }
  .dept-value { font-size: 16px !important; }

  .header-edit-controls {
    flex-wrap: wrap;
    gap: 6px;
  }

  .merge-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
}
</style>