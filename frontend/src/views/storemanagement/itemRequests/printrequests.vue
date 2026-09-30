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

      <h3 v-if="!isEditingHeader" class="form-subtitle-title">{{ displayHeader }}</h3>
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
        >{{ isMergingRemarks ? '✖ Exit Merge' : '🔀 Merge Remarks' }}</button>

        <button
          v-if="!isEditingHeader && !isManagingColumns"
          class="btn-merge-toggle"
          @click="openColumnManager"
        >🧩 Columns ({{ visibleColumnCount }}/{{ columns.length }})</button>
        <button
          v-if="!isEditingHeader && isManagingColumns"
          class="btn-cancel-header"
          @click="closeColumnManager"
        >✖ Close Columns</button>
      </div>

      <!-- Column manager panel -->
      <div v-if="isManagingColumns && !isEditingHeader" class="column-manager no-print">
        <div class="column-manager-title">Show / hide columns</div>
        <div class="column-manager-list">
          <label
            v-for="col in columns"
            :key="col.key"
            class="column-manager-item"
            :class="{
              'is-hidden': !col.visible,
              'is-empty': isColumnEmpty(col) && !col.locked,
              'is-locked': isColumnLocked(col),
              'is-locked-data': !col.locked && !isColumnEmpty(col),
            }"
          >
            <input
              type="checkbox"
              :checked="col.visible"
              @change="toggleColumn(col.key)"
              :disabled="isColumnLocked(col)"
            />
            <span class="column-manager-label">{{ col.label }}</span>

            <!-- Built-in structural lock -->
            <span
              v-if="col.locked"
              class="column-manager-lock"
              title="Required column — cannot be hidden or removed"
            >🔒</span>

            <!-- Locked because it has data in at least one row -->
            <span
              v-else-if="!isColumnEmpty(col)"
              class="column-manager-lock-data"
              title="Has data in at least one row — cannot be hidden"
            >🔒 has data</span>

            <!-- Fully empty → safe to hide -->
            <span
              v-else
              class="column-manager-empty"
              title="No data in any row — safe to hide"
            >empty</span>

            <button
              v-if="col.custom"
              class="column-manager-remove"
              @click.prevent="removeCustomColumn(col.key)"
              :disabled="isColumnLocked(col) && !col.locked"
              :title="isColumnLocked(col) && !col.locked
                ? 'This column has data — clear all its values first'
                : 'Remove this column'"
            >✕</button>
          </label>
        </div>

        <div class="column-manager-actions">
          <button
            class="btn-merge-apply"
            :disabled="!hasAnyEmptyVisibleColumn"
            @click="hideEmptyColumns"
          >🧹 Hide empty columns</button>
          <button
            class="btn-merge-clear"
            :disabled="!hasAnyHiddenColumn"
            @click="showAllColumns"
          >↺ Show all</button>
        </div>

        <!-- Add column dropdown -->
        <div class="column-manager-add">
          <label class="column-manager-add-label">Add column:</label>
          <select v-model="newColumnChoice" class="column-manager-select">
            <option value="">— Select a column —</option>
            <option
              v-for="opt in COLUMN_OPTIONS"
              :key="opt.value"
              :value="opt.value"
              :disabled="isColumnOptionDisabled(opt.value)"
            >{{ opt.label }}</option>
          </select>

          <input
            v-if="newColumnChoice === '__other__'"
            v-model="newColumnCustomLabel"
            type="text"
            class="column-manager-input"
            placeholder="Type the store / column name"
            @keydown.enter.prevent="addColumnFromDropdown"
          />

          <button
            class="btn-merge-apply"
            :disabled="!canAddColumn"
            @click="addColumnFromDropdown"
          >＋ Add</button>
        </div>
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

          <th
            v-for="col in dataColumns"
            :key="col.key"
            :style="{ width: col.width }"
          >{{ col.label }}</th>

          <th style="width: 10%;">Remark</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!requestData.items || requestData.items.length === 0">
          <td
            :colspan="(isMergingRemarks ? 3 : 2) + dataColumns.length"
            class="no-items"
          >No items in this request</td>
        </tr>

        <tr
          v-for="(item, index) in requestData.items"
          :key="index"
          :class="{
            'row-selected': isRowSelected(index),
            'row-merged-absorbed': isRowAbsorbedByMerge(index)
          }"
        >
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

          <td
            v-for="col in dataColumns"
            :key="col.key"
            :class="{
              'text-left': col.align === 'left',
              'font-bold': col.bold,
              'spec-cell': col.key === 'specification',
              'custom-cell': isEditableColumn(col),
              'computed-cell': isComputedColumn(col),
            }"
          >
            <template v-if="isComputedColumn(col)">
              <span class="computed-value">{{ getComputedCellValue(item, index, col) }}</span>
            </template>

            <template v-else-if="isEditableColumn(col)">
              <div
                class="custom-cell-editor no-print"
                contenteditable="true"
                :data-placeholder="'—'"
                @blur="onCustomCellBlur(index, col.key, $event)"
                @keydown.enter.prevent="onCustomCellEnter"
                @paste="onPastePlain"
                v-html="getCustomCellValue(index, col.key)"
              ></div>
              <span class="custom-cell-print">{{ getCustomCellValue(index, col.key) }}</span>
            </template>

            <template v-else>
              {{ getColumnValue(item, col, index) }}
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
              <button
                v-if="isMergingRemarks"
                class="btn-unmerge no-print"
                @click="unmergeGroup(index)"
              >✖ Unmerge</button>
            </div>
          </td>
          <td
            v-else-if="!isRowAbsorbedByMerge(index)"
            class="remark-cell"
          >{{ item.remark || '' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="meta-grid">
      <!-- Department — editable -->
      <div class="meta-col">
        <div class="block-header text-center">Department</div>
        <div class="block-body dept-body">
          <div
            v-if="!isEditingDepartment"
            class="dept-display"
            @click="startEditingDepartment"
            title="Click to edit"
          >
            <strong class="dept-value">{{ displayDepartment }}</strong>
            <span class="dept-edit-pencil no-print" aria-hidden="true">✏️</span>
          </div>
          <div v-else class="dept-edit-wrap">
            <input
              ref="departmentInputRef"
              v-model="departmentDraft"
              type="text"
              class="dept-input no-print"
              @keydown.enter.prevent="saveDepartment"
              @keydown.esc.prevent="cancelEditingDepartment"
              @blur="saveDepartment"
            />
            <div class="dept-edit-actions no-print">
              <button class="btn-save-header" @click="saveDepartment">💾 Save</button>
              <button class="btn-cancel-header" @click="cancelEditingDepartment">✖ Cancel</button>
              <button
                v-if="departmentOverride !== null"
                class="btn-cancel-header"
                @click="resetDepartment"
                title="Reset to API value"
              >↺ Reset</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Requested By — read-only (from API) -->
      <div class="meta-col">
        <div class="block-header text-center">Requested By</div>
        <div class="block-body workflow-body">
          <p><strong>Name:-</strong> {{ getRequesterName() }}</p>
          <p><strong>Signature</strong> _______________________</p>
        </div>
      </div>

      <!-- Approved By — editable Name -->
      <div class="meta-col">
        <div class="block-header text-center">Approved By</div>
        <div class="block-body workflow-body">
          <p class="approved-name-row">
            <strong>Name :-</strong>
            <div
              class="approved-name-editor no-print"
              contenteditable="true"
              :data-placeholder="'Type approver name…'"
              @blur="onApprovedNameBlur"
              @keydown.enter.prevent="(e) => (e.target as HTMLElement).blur()"
              @paste="onPastePlain"
              v-html="approvedByName"
            ></div>
            <span class="approved-name-print">{{ approvedByName }}</span>
          </p>
          <p><strong>Signature</strong> _______________________</p>
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

// ================================================================
// EDITABLE DEPARTMENT + APPROVED-BY STATE
// ================================================================

const isEditingDepartment = ref(false)
const departmentDraft = ref('')
const departmentInputRef = ref<HTMLInputElement | null>(null)
const departmentOverride = ref<string | null>(null)
const approvedByName = ref('')

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
// COLUMN MANAGEMENT
// ================================================================

type ColumnAlign = 'left' | 'center'

interface ColumnDef {
  key: string
  label: string
  width: string
  visible: boolean
  getValue: (item: any) => string
  align?: ColumnAlign
  bold?: boolean
  custom?: boolean
  locked?: boolean
  editable?: boolean
  kind?: 'text' | 'number'
  computed?: 'totalPrice'
  pairedKey?: string
}

const isManagingColumns = ref(false)
const newColumnChoice = ref<string>('')
const newColumnCustomLabel = ref('')

const COLUMN_OPTIONS = [
  { value: 'unitPrice',        label: 'Unit Price' },
  { value: 'totalPrice',       label: 'Total Price' },
  { value: 'neberetStock',     label: 'Neberet Astedader Stock Balance' },
  { value: 'mainStoreBalance', label: 'Main Store Balance' },
  { value: 'miniStoreBalance', label: 'Mini Store Balance' },
  { value: 'miniMinBalance',   label: 'Mini Min Store Balance' },
  { value: '__other__',        label: 'Other… (type a name)' },
]

const columns = ref<ColumnDef[]>([
  {
    key: 'item',
    label: 'Item',
    width: '20%',
    visible: true,
    locked: true,
    align: 'left',
    getValue: (it: any) => getItemNameOnly(it),
  },
  {
    key: 'uom',
    label: 'U.O.M',
    width: '7%',
    visible: true,
    locked: true,
    getValue: (it: any) => getItemUOM(it) || 'Pcs',
  },
  {
    key: 'quantity',
    label: 'Qty',
    width: '7%',
    visible: true,
    locked: true,
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
])

const customCellData = ref<Record<string, Record<string, Record<string, string>>>>({})

const visibleColumns = computed(() => columns.value.filter((c) => c.visible))
const dataColumns = computed(() => visibleColumns.value)
const visibleColumnCount = computed(() => visibleColumns.value.length)
const hasAnyHiddenColumn = computed(() => columns.value.some((c) => !c.visible))

const isEditableColumn = (col: ColumnDef) => !!col.editable && !col.computed
const isComputedColumn = (col: ColumnDef) => !!col.computed

// ================================================================
// EMPTINESS + LOCKING
// ================================================================

// A column is EMPTY only if EVERY row has no value.
// If even ONE row has data → NOT empty → becomes locked.
const isColumnEmpty = (col: ColumnDef): boolean => {
  const list = requestData.value?.items || []
  if (list.length === 0) return false

  if (col.computed) {
    return !list.some((it, idx) =>
      String(getComputedCellValue(it, idx, col) || '').trim() !== ''
    )
  }
  if (col.editable) {
    const reqKey = currentRequestKey.value
    if (!reqKey) return true
    const data = customCellData.value[reqKey] || {}
    return !list.some((_, idx) => {
      const v = data[String(idx)]?.[col.key]
      return v != null && String(v).trim() !== ''
    })
  }
  return !list.some((it) => String(col.getValue(it) || '').trim() !== '')
}

// A column is effectively locked if:
//  - it's a built-in structural lock (Item/U.O.M/Qty), OR
//  - ANY row has data in it (can't be hidden once it has content)
const isColumnLocked = (col: ColumnDef): boolean => {
  if (col.locked) return true
  if (isColumnEmpty(col)) return false
  return true
}

const hasAnyEmptyVisibleColumn = computed(() =>
  columns.value.some((col) => col.visible && !isColumnLocked(col) && isColumnEmpty(col))
)

const toggleColumn = (key: string) => {
  const col = columns.value.find((c) => c.key === key)
  if (!col) return
  if (isColumnLocked(col)) return
  col.visible = !col.visible
}

const hideEmptyColumns = () => {
  columns.value.forEach((col) => {
    if (isColumnLocked(col)) return
    if (!col.visible) return
    if (isColumnEmpty(col)) col.visible = false
  })
  persistColumnState()
}

const showAllColumns = () => {
  columns.value.forEach((col) => { col.visible = true })
  persistColumnState()
}

const openColumnManager = () => { isManagingColumns.value = true }
const closeColumnManager = () => {
  isManagingColumns.value = false
  newColumnChoice.value = ''
  newColumnCustomLabel.value = ''
}

const isColumnOptionDisabled = (value: string) => {
  if (!value || value === '__other__') return false
  return columns.value.some((c) => c.key === value)
}

const canAddColumn = computed(() => {
  if (!newColumnChoice.value) return false
  if (newColumnChoice.value === '__other__') return !!newColumnCustomLabel.value.trim()
  return !columns.value.some((c) => c.key === newColumnChoice.value)
})

const addColumnFromDropdown = () => {
  if (!canAddColumn.value) return
  const choice = newColumnChoice.value

  if (choice === '__other__') {
    const label = newColumnCustomLabel.value.trim()
    if (!label) return
    const key = `custom_${Date.now()}`
    columns.value.push({
      key, label, width: '12%', visible: true, custom: true,
      editable: true, kind: 'text', getValue: () => '',
    })
    newColumnChoice.value = ''
    newColumnCustomLabel.value = ''
    persistColumnState()
    return
  }

  const isUnitPrice = choice === 'unitPrice'
  const isTotalPrice = choice === 'totalPrice'

  if (isUnitPrice) {
    if (!columns.value.some((c) => c.key === 'unitPrice')) {
      columns.value.push({
        key: 'unitPrice', label: 'Unit Price', width: '9%', visible: true,
        custom: true, editable: true, kind: 'number',
        pairedKey: 'totalPrice', getValue: () => '',
      })
    }
    if (!columns.value.some((c) => c.key === 'totalPrice')) {
      columns.value.push({
        key: 'totalPrice', label: 'Total Price', width: '10%', visible: true,
        custom: true, computed: 'totalPrice', getValue: () => '',
      })
    }
  } else if (isTotalPrice) {
    if (!columns.value.some((c) => c.key === 'totalPrice')) {
      columns.value.push({
        key: 'totalPrice', label: 'Total Price', width: '10%', visible: true,
        custom: true, computed: 'totalPrice', getValue: () => '',
      })
    }
    if (!columns.value.some((c) => c.key === 'unitPrice')) {
      columns.value.push({
        key: 'unitPrice', label: 'Unit Price', width: '9%', visible: true,
        custom: true, editable: true, kind: 'number',
        pairedKey: 'totalPrice', getValue: () => '',
      })
    }
  } else {
    const preset = COLUMN_OPTIONS.find((o) => o.value === choice)
    if (preset && !columns.value.some((c) => c.key === preset.value)) {
      columns.value.push({
        key: preset.value, label: preset.label, width: '11%', visible: true,
        custom: true, editable: true, kind: 'number', getValue: () => '',
      })
    }
  }

  newColumnChoice.value = ''
  newColumnCustomLabel.value = ''
  persistColumnState()
}

const removeCustomColumn = (key: string) => {
  const col = columns.value.find((c) => c.key === key)
  if (!col || col.locked) return
  // Refuse to remove a column that still has data
  if (!isColumnEmpty(col)) return

  const keysToRemove: string[] = [key]
  if (col.key === 'unitPrice') keysToRemove.push('totalPrice')
  if (col.key === 'totalPrice') keysToRemove.push('unitPrice')

  columns.value = columns.value.filter((c) => !(c.custom && keysToRemove.includes(c.key)))

  const reqKey = currentRequestKey.value
  if (reqKey && customCellData.value[reqKey]) {
    Object.values(customCellData.value[reqKey]).forEach((rowMap) => {
      keysToRemove.forEach((k) => delete rowMap[k])
    })
  }
  persistColumnState()
}

const getColumnValue = (item: any, col: ColumnDef, _index: number): string => {
  try { return col.getValue(item) ?? '' } catch { return '' }
}

// ================================================================
// CUSTOM CELL EDITING
// ================================================================

const getCustomCellValue = (rowIndex: number, colKey: string): string => {
  const reqKey = currentRequestKey.value
  if (!reqKey) return ''
  const row = customCellData.value[reqKey]?.[String(rowIndex)]
  return row?.[colKey] || ''
}

const setCustomCellValue = (rowIndex: number, colKey: string, value: string) => {
  const reqKey = currentRequestKey.value
  if (!reqKey) return
  if (!customCellData.value[reqKey]) customCellData.value[reqKey] = {}
  const rowKey = String(rowIndex)
  if (!customCellData.value[reqKey][rowKey]) customCellData.value[reqKey][rowKey] = {}
  customCellData.value[reqKey][rowKey][colKey] = value
  persistCustomCells()
}

const onCustomCellBlur = (rowIndex: number, colKey: string, e: FocusEvent) => {
  const el = e.target as HTMLElement
  let text = (el.innerText || '').replace(/\u00a0/g, ' ').trim()
  const col = columns.value.find((c) => c.key === colKey)
  if (col?.kind === 'number') {
    const cleaned = text.replace(/[^0-9.\-]/g, '')
    if (cleaned !== text) text = cleaned
  }
  setCustomCellValue(rowIndex, colKey, text)
  el.innerText = text
}

const onCustomCellEnter = (e: KeyboardEvent) => {
  ;(e.target as HTMLElement).blur()
}

const getComputedCellValue = (item: any, rowIndex: number, col: ColumnDef): string => {
  if (col.computed === 'totalPrice') {
    const unitStr = getCustomCellValue(rowIndex, 'unitPrice')
    const unit = parseFloat(unitStr) || 0
    const qty = parseFloat(String(item?.quantity ?? 0)) || 0
    if (!unit || !qty) return ''
    const total = unit * qty
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return ''
}

// ================================================================
// DEPARTMENT — display + edit
// ================================================================

const apiDepartment = computed<string>(() => getRequestingDepartment())
const displayDepartment = computed<string>(() =>
  departmentOverride.value !== null && departmentOverride.value !== ''
    ? departmentOverride.value
    : apiDepartment.value
)

const startEditingDepartment = async () => {
  departmentDraft.value = displayDepartment.value === 'N/A' ? '' : displayDepartment.value
  isEditingDepartment.value = true
  await nextTick()
  departmentInputRef.value?.focus()
  departmentInputRef.value?.select?.()
}

const saveDepartment = () => {
  if (!isEditingDepartment.value) return
  const cleaned = departmentDraft.value.trim()
  departmentOverride.value = cleaned === '' ? null : cleaned
  isEditingDepartment.value = false
  persistExtras()
}

const cancelEditingDepartment = () => {
  isEditingDepartment.value = false
  departmentDraft.value = ''
}

const resetDepartment = () => {
  departmentOverride.value = null
  isEditingDepartment.value = false
  departmentDraft.value = ''
  persistExtras()
}

// ================================================================
// APPROVED BY NAME — editable
// ================================================================

const onApprovedNameBlur = (e: FocusEvent) => {
  const el = e.target as HTMLElement
  const text = (el.innerText || '').replace(/\u00a0/g, ' ').trim()
  approvedByName.value = text
  el.innerText = text
  persistExtras()
}

// ================================================================
// PERSISTENCE
// ================================================================

const LS_COLUMNS_KEY = 'itemRequest:columns:v1'
const LS_CUSTOM_CELLS_KEY = 'itemRequest:customCells:v1'
const LS_EXTRAS_KEY = 'itemRequest:extras:v1'

interface ExtrasShape {
  department?: string
  approvedBy?: string
}
const extrasByRequest = ref<Record<string, ExtrasShape>>({})

const persistExtras = () => {
  try {
    const reqKey = currentRequestKey.value
    if (!reqKey) return
    const current = extrasByRequest.value[reqKey] || {}
    const next: ExtrasShape = { ...current }
    if (departmentOverride.value !== null && departmentOverride.value !== '') {
      next.department = departmentOverride.value
    } else {
      delete next.department
    }
    if (approvedByName.value) next.approvedBy = approvedByName.value
    else delete next.approvedBy
    extrasByRequest.value = { ...extrasByRequest.value, [reqKey]: next }
    localStorage.setItem(LS_EXTRAS_KEY, JSON.stringify(extrasByRequest.value))
  } catch { /* ignore */ }
}

const restoreExtras = () => {
  try {
    const raw = localStorage.getItem(LS_EXTRAS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') extrasByRequest.value = parsed
  } catch { /* ignore */ }
}

const applyExtrasForCurrentRequest = () => {
  const reqKey = currentRequestKey.value
  const extras = reqKey ? extrasByRequest.value[reqKey] : undefined
  departmentOverride.value = extras?.department ?? null
  approvedByName.value = extras?.approvedBy ?? ''
  isEditingDepartment.value = false
  departmentDraft.value = ''
}

const persistColumnState = () => {
  try {
    const snapshot = columns.value.map((c) => ({
      key: c.key, label: c.label, width: c.width, visible: c.visible,
      custom: !!c.custom, locked: !!c.locked, editable: !!c.editable,
      kind: c.kind, computed: c.computed, pairedKey: c.pairedKey,
      align: c.align, bold: !!c.bold,
    }))
    localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(snapshot))
  } catch { /* ignore */ }
}

const restoreColumnState = () => {
  try {
    const raw = localStorage.getItem(LS_COLUMNS_KEY)
    if (!raw) return
    const snap = JSON.parse(raw) as Array<Partial<ColumnDef> & { key: string }>
    if (!Array.isArray(snap) || snap.length === 0) return

    const builtinMap = new Map<string, ColumnDef>([
      ['item', {
        key: 'item', label: 'Item', width: '20%', locked: true, align: 'left',
        visible: true, getValue: (it: any) => getItemNameOnly(it),
      }],
      ['uom', {
        key: 'uom', label: 'U.O.M', width: '7%', locked: true, visible: true,
        getValue: (it: any) => getItemUOM(it) || 'Pcs',
      }],
      ['quantity', {
        key: 'quantity', label: 'Qty', width: '7%', locked: true, bold: true, visible: true,
        getValue: (it: any) => formatQuantity(it.quantity),
      }],
      ['brand', {
        key: 'brand', label: 'Brand', width: '11%', visible: true,
        getValue: (it: any) => getItemBrand(it) || '',
      }],
      ['model', {
        key: 'model', label: 'Model', width: '11%', visible: true,
        getValue: (it: any) => getItemModel(it) || '',
      }],
      ['specification', {
        key: 'specification', label: 'Specification', width: '20%', visible: true,
        getValue: (it: any) => stripHtml(getItemSpecification(it)) || '',
      }],
    ])

    const restored: ColumnDef[] = []
    snap.forEach((s) => {
      const b = builtinMap.get(s.key)
      if (b) {
        restored.push({ ...b, visible: s.visible !== false })
      } else if (s.custom) {
        restored.push({
          key: s.key, label: s.label || 'Custom', width: s.width || '12%',
          visible: s.visible !== false, custom: true,
          editable: s.editable ?? true, kind: (s.kind as any) || 'text',
          computed: s.computed as any, pairedKey: s.pairedKey,
          getValue: () => '',
        })
      }
    })

    builtinMap.forEach((b, k) => {
      if (!restored.find((c) => c.key === k)) restored.push({ ...b, visible: true })
    })

    ensurePricePairing(restored)
    columns.value = restored
  } catch { /* ignore */ }
}

const ensurePricePairing = (list: ColumnDef[]) => {
  const hasUnit = list.some((c) => c.key === 'unitPrice')
  const hasTotal = list.some((c) => c.key === 'totalPrice')
  if (hasUnit && !hasTotal) {
    list.push({
      key: 'totalPrice', label: 'Total Price', width: '10%', visible: true,
      custom: true, computed: 'totalPrice', getValue: () => '',
    })
  }
  if (hasTotal && !hasUnit) {
    list.push({
      key: 'unitPrice', label: 'Unit Price', width: '9%', visible: true,
      custom: true, editable: true, kind: 'number',
      pairedKey: 'totalPrice', getValue: () => '',
    })
  }
}

const persistCustomCells = () => {
  try {
    localStorage.setItem(LS_CUSTOM_CELLS_KEY, JSON.stringify(customCellData.value))
  } catch { /* ignore */ }
}

const restoreCustomCells = () => {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_CELLS_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') customCellData.value = parsed
  } catch { /* ignore */ }
}

// ================================================================
// HEADER — DEFAULT GENERATION
// ================================================================

const defaultHeader = computed<string>(() => {
  if (!requestData.value) return ''
  const fromName = getStoreName(requestData.value.supplyingStoreId)
  const toName = getAskingStoreDisplay()
  return `ITEM REQUEST FROM ${fromName} TO ${toName}`
})

const displayHeader = computed<string>(() => customHeader.value ?? defaultHeader.value)

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

  isManagingColumns.value = false
  newColumnChoice.value = ''
  newColumnCustomLabel.value = ''

  applyExtrasForCurrentRequest()
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

const cancelEditingHeader = () => { isEditingHeader.value = false }

const saveHeader = () => {
  if (!requestData.value) return
  const el = headerLineRef.value
  const rawText = el?.innerText ?? ''
  const cleaned = rawText.replace(/\s+/g, ' ').trim()
  customHeader.value = (!cleaned || cleaned === defaultHeader.value) ? null : cleaned
  isEditingHeader.value = false
}

const onPastePlain = (e: ClipboardEvent) => {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text)
}

// ================================================================
// MERGE
// ================================================================

const toggleMergeMode = () => {
  isMergingRemarks.value = !isMergingRemarks.value
  if (!isMergingRemarks.value) selectedRowIndexes.value = []
}

const isRowSelected = (index: number): boolean => selectedRowIndexes.value.includes(index)

const toggleRowSelection = (index: number) => {
  const pos = selectedRowIndexes.value.indexOf(index)
  if (pos >= 0) selectedRowIndexes.value.splice(pos, 1)
  else selectedRowIndexes.value.push(index)
}

const clearSelection = () => { selectedRowIndexes.value = [] }

const isRowMerged = (index: number): boolean =>
  mergeGroups.value.some((g) => index >= g.start && index < g.start + g.size)

const isRowAbsorbedByMerge = (index: number): boolean =>
  mergeGroups.value.some((g) => index > g.start && index < g.start + g.size)

const isMergeStartRow = (index: number): boolean =>
  mergeGroups.value.some((g) => g.start === index)

const getMergeSize = (startIndex: number): number => {
  const g = mergeGroups.value.find((grp) => grp.start === startIndex)
  return g ? g.size : 1
}

const getMergedRemarkText = (startIndex: number): string => {
  const g = mergeGroups.value.find((grp) => grp.start === startIndex)
  return g ? g.text : ''
}

const applyMerge = () => {
  const selected = [...selectedRowIndexes.value].sort((a, b) => a - b)
  if (selected.length < 2) return
  if (selected.some((i) => isRowMerged(i))) {
    alert('Some selected rows are already part of a merge. Unmerge them first.')
    return
  }
  for (let i = 1; i < selected.length; i++) {
    if (selected[i] !== selected[i - 1]! + 1) {
      alert('Please select consecutive rows to merge their remarks.')
      return
    }
  }
  const firstRow = selected[0]
  if (firstRow === undefined) return
  const originalText = requestData.value?.items?.[firstRow]?.remark
  const text = originalText && String(originalText).trim() ? String(originalText).trim() : '—'
  mergeGroups.value = [...mergeGroups.value, { start: firstRow, size: selected.length, text }]
  selectedRowIndexes.value = []
}

const unmergeGroup = (startIndex: number) => {
  mergeGroups.value = mergeGroups.value.filter((g) => g.start !== startIndex)
}

// ================================================================
// DATA LOADING
// ================================================================

const loadStores = async () => {
  try {
    const response = await itemRequestService.getActiveStores()
    if (response.success) stores.value = response.data
  } catch (error) { console.error('Load stores error:', error) }
}

const loadItems = async () => {
  try {
    const response = await itemRequestService.getActiveItems()
    if (response.success) items.value = response.data
  } catch (error) { console.error('Load items error:', error) }
}

const loadDepartments = async () => {
  try {
    const response = await employeesService.getDepartments()
    if (response.success) departments.value = response.data
  } catch (error) { console.error('Load departments error:', error) }
}

const loadRequest = async (requestId: string) => {
  loading.value = true
  try {
    const response = await itemRequestService.getRequestById(Number(requestId))
    if (response.success) requestData.value = response.data
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
    if (typeof user.department === 'object' && user.department.name) return user.department.name
  }
  if (user?.departmentId) {
    const dept = departments.value.find((d) =>
      d.departmentId === user.departmentId ||
      d.id === user.departmentId ||
      d.department_id === user.departmentId
    )
    if (dept) return dept.name || dept.departmentName || `Department ${user.departmentId}`
    return `Department ${user.departmentId}`
  }
  return 'N/A'
}

const getRequesterName = (): string => {
  if (!requestData.value) return 'N/A'
  const req = requestData.value
  if (req.requestedBy && String(req.requestedBy).trim()) return String(req.requestedBy).trim()
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

const isOtherStore = (storeOrId: number | Store | null | undefined): boolean => {
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
  const askingStore = stores.value.find((s) => (s.storeId || s.id) === req.askingStoreId)
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
  const globalItem = items.value.find((i) => (i.itemId || i.id) === item.itemId)
  if (globalItem?.brand) return globalItem.brand
  return ''
}

const getItemModel = (item: any): string => {
  if (!item) return ''
  if (item.model) return item.model
  if (item.item?.model) return item.item.model
  const globalItem = items.value.find((i) => (i.itemId || i.id) === item.itemId)
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
  if (isManagingColumns.value) isManagingColumns.value = false
  if (isEditingDepartment.value) saveDepartment()
  setTimeout(() => window.print(), 50)
}

// ================================================================
// LIFECYCLE
// ================================================================

const initialize = async () => {
  const requestId = route.query.id as string
  if (requestId) {
    await Promise.all([loadStores(), loadItems(), loadDepartments()])
    await loadRequest(requestId)
    applyExtrasForCurrentRequest()
  } else {
    loading.value = false
  }
}

onMounted(() => {
  restoreColumnState()
  restoreCustomCells()
  restoreExtras()
  initialize()
})

watch(
  () => route.query.id,
  (newId, oldId) => { if (newId && newId !== oldId) initialize() }
)

watch(
  () => columns.value.map((c) => `${c.key}:${c.visible}`).join(','),
  () => persistColumnState()
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

.form-subtitle-title.is-editing:focus { background: #dbeafe; }

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
}

.btn-edit-header:hover,
.btn-save-header:hover,
.btn-cancel-header:hover,
.btn-merge-toggle:hover { filter: brightness(0.95); }

.btn-edit-header { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }
.btn-save-header { background: #16a34a; color: #fff; }
.btn-cancel-header { background: #e2e8f0; color: #334155; }
.btn-merge-toggle { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
.btn-merge-toggle.active { background: #dc2626; color: #fff; border-color: #dc2626; }

.edit-hint { font-size: 10px; color: #64748b; font-style: italic; margin-left: 4px; }

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

.merge-bar-info { color: #78350f; white-space: nowrap; }
.merge-hint { color: #a16207; font-style: italic; margin-left: 4px; }
.merge-groups-info { color: #166534; margin-left: auto; white-space: nowrap; }

.btn-merge-apply,
.btn-merge-clear {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
}

.btn-merge-apply { background: #d97706; color: #fff; }
.btn-merge-apply:disabled { background: #cbd5e1; color: #64748b; cursor: not-allowed; }
.btn-merge-clear { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }
.btn-merge-clear:disabled { opacity: 0.5; cursor: not-allowed; }

/* ================================================================
   COLUMN MANAGER
   ================================================================ */
.column-manager {
  margin: 0 0 12px 0;
  padding: 12px 14px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.column-manager-title {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.column-manager-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.column-manager-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}

/* Locked because column has data — cannot be hidden */
.column-manager-item.is-locked-data {
  border-color: #94a3b8;
  background: #e2e8f0;
  cursor: default;
}

/* Hidden column */
.column-manager-item.is-hidden {
  background: #f8fafc;
  color: #94a3b8;
  border-style: dashed;
}

/* Fully empty — can be hidden */
.column-manager-item.is-empty {
  border-color: #fcd34d;
  background: #fffbeb;
}

/* Structurally locked (Item / U.O.M / Qty) */
.column-manager-item.is-locked {
  background: #e2e8f0;
  cursor: default;
}

.column-manager-item input[type="checkbox"] { cursor: pointer; }
.column-manager-item input[type="checkbox"]:disabled { cursor: not-allowed; opacity: 0.5; }

.column-manager-label { font-weight: 600; }
.column-manager-lock { font-size: 10px; opacity: 0.7; }

.column-manager-lock-data {
  font-size: 10px;
  color: #334155;
  background: #cbd5e1;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 800;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.column-manager-empty {
  font-size: 10px;
  color: #92400e;
  background: #fef3c7;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.column-manager-hasdata {
  font-size: 10px;
  color: #166534;
  background: #dcfce7;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 900;
}

.column-manager-remove {
  background: transparent;
  border: none;
  color: #dc2626;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.column-manager-remove:hover:not(:disabled) { color: #991b1b; }
.column-manager-remove:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  color: #94a3b8;
}

.column-manager-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding-top: 10px;
  border-top: 1px dashed #cbd5e1;
}

.column-manager-add {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px dashed #cbd5e1;
}

.column-manager-add-label { font-size: 12px; font-weight: 700; color: #334155; }

.column-manager-select {
  flex: 1;
  min-width: 220px;
  padding: 7px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  background: #ffffff;
  outline: none;
  cursor: pointer;
}

.column-manager-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.column-manager-input {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  background: #ffffff;
}

.column-manager-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* ================================================================
   TABLE
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

.items-table th {
  background-color: #c8c8c8;
  font-weight: 800;
  font-size: 13.5px;
  letter-spacing: 0.4px;
  padding: 10px 6px;
  color: #000;
}

.items-table td.text-left { text-align: left; padding-left: 8px; }
.font-bold { font-weight: 700; }
.no-items { padding: 20px !important; color: #7f7f7f; font-style: italic; text-align: center !important; }
.spec-cell { font-size: 12px; line-height: 1.35; }

.cell-checkbox { text-align: center !important; padding: 2px !important; }
.cell-checkbox input[type="checkbox"] { cursor: pointer; width: 14px; height: 14px; }
.merged-lock { font-size: 12px; opacity: 0.6; }
.row-selected td { background-color: #fef9c3; }

/* ================================================================
   EDITABLE / COMPUTED CELLS
   ================================================================ */
.custom-cell { padding: 2px !important; }

.custom-cell-editor {
  min-height: 22px;
  padding: 4px 6px;
  border-radius: 4px;
  outline: none;
  font-size: 12px;
  text-align: center;
  word-break: break-word;
  white-space: pre-wrap;
  transition: background-color 0.15s ease, outline 0.15s ease;
  cursor: text;
}

.custom-cell-editor:empty::before {
  content: attr(data-placeholder);
  color: #cbd5e1;
  font-style: italic;
}

.custom-cell-editor:hover { background: #f8fafc; outline: 1px dashed #cbd5e1; }
.custom-cell-editor:focus { background: #eff6ff; outline: 2px solid #2563eb; }

.custom-cell-print { display: none; }

.computed-cell { background: #f8fafc !important; }
.computed-value { font-weight: 700; color: #0f172a; font-size: 12.5px; }

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

.items-table tr td.merged-remark-cell { border-top: 1px solid #7f7f7f !important; }

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

.row-merged-absorbed td { background: #fafafa; }

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

.block-body { padding-top: 10px; font-size: 13px; min-height: 80px; }

/* Department editable */
.dept-body {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}

.dept-display {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, outline 0.15s ease;
  outline: 1px dashed transparent;
  outline-offset: 2px;
}

.dept-display:hover {
  background: #f1f5f9;
  outline-color: #cbd5e1;
}

.dept-value {
  font-size: 20px;
  color: #0f172a;
  font-weight: 600;
  text-align: center;
}

.dept-edit-pencil {
  font-size: 14px;
  opacity: 0.5;
}

.dept-display:hover .dept-edit-pencil { opacity: 1; }

.dept-edit-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.dept-input {
  width: 100%;
  max-width: 260px;
  padding: 8px 12px;
  border: 2px solid #2563eb;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  outline: none;
  background: #eff6ff;
  color: #0f172a;
}

.dept-edit-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

/* Approved By editable name */
.workflow-body p { margin: 6px 0; }

.approved-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.approved-name-editor {
  flex: 1;
  min-width: 120px;
  min-height: 22px;
  padding: 4px 8px;
  border-radius: 6px;
  outline: none;
  font-size: 13px;
  font-weight: 500;
  cursor: text;
  transition: background-color 0.15s ease, outline 0.15s ease;
  border-bottom: 1px dashed transparent;
}

.approved-name-editor:empty::before {
  content: attr(data-placeholder);
  color: #cbd5e1;
  font-style: italic;
}

.approved-name-editor:hover {
  background: #f8fafc;
  border-bottom-color: #cbd5e1;
}

.approved-name-editor:focus {
  background: #eff6ff;
  outline: 2px solid #2563eb;
}

.approved-name-print { display: none; }

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
  body { background-color: #fff !important; }

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

  .block-header { background-color: #d9d9d9 !important; color: #000000 !important; }

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
  .column-manager,
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

  .items-table td { padding: 5px 4px !important; height: 26px !important; }

  .merged-remark-cell {
    border-top: none !important;
    border-bottom: none !important;
    background: #ffffff !important;
  }

  .items-table tr td.merged-remark-cell { border-top: 1px solid #000000 !important; }
  .row-merged-absorbed td { background: #ffffff !important; }
  .row-selected td { background: transparent !important; }
  .items-table th, .items-table td { border-color: #000000 !important; }

  .motto { font-size: 16px !important; }
  .company-name { font-size: 18px !important; }
  .form-subtitle-title { font-size: 13px !important; }

  .meta-grid { gap: 15px !important; }
  .dept-value { font-size: 18px !important; }

  .meta-grid { page-break-inside: avoid !important; }
  .items-table tr { page-break-inside: avoid !important; }
  .items-table { page-break-after: avoid !important; }

  .custom-cell-editor { display: none !important; }
  .custom-cell-print {
    display: inline !important;
    font-size: 11px !important;
    text-align: center;
  }

  .computed-cell { background: #ffffff !important; }

  .dept-display {
    background: transparent !important;
    outline: none !important;
    padding: 0 !important;
    cursor: default !important;
  }
  .dept-edit-pencil { display: none !important; }

  .approved-name-editor { display: none !important; }
  .approved-name-print {
    display: inline !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #000 !important;
  }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .print-page { padding: 10px; }

  .meta-grid { flex-direction: column; gap: 15px; }
  .top-actions { flex-direction: column; gap: 8px; padding: 10px; }
  .top-actions button { width: 100%; justify-content: center; }

  .items-table { font-size: 10px; }
  .items-table th, .items-table td { padding: 3px 2px; height: 20px; }
  .items-table th { font-size: 9px; }

  .date-row { flex-direction: column; gap: 4px; font-size: 11px; }

  .motto { font-size: 15px; }
  .company-name { font-size: 16px; }
  .form-subtitle-title { font-size: 12px; }
  .dept-value { font-size: 16px !important; }

  .header-edit-controls { flex-wrap: wrap; gap: 6px; }
  .merge-bar { flex-direction: column; align-items: stretch; gap: 6px; }
  .column-manager-list { flex-direction: column; }
  .column-manager-item { width: 100%; }

  .column-manager-add { flex-direction: column; align-items: stretch; }
  .column-manager-select,
  .column-manager-input { min-width: 0; width: 100%; }
}
</style>