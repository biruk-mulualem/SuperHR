<template>
  <div class="lt-container">
    <table class="lt-table">

      <!-- ── HEAD ──────────────────────────────────────────────────────────── -->
      <thead>
        <tr>
          <!-- Checkbox column (opt-in) -->
          <th v-if="selectable" class="lt-th lt-th--check">
            <input
              type="checkbox"
              :checked="allSelected"
              :indeterminate="someSelected"
              @change="toggleSelectAll"
            />
          </th>

          <!-- Column headers (defined via :columns prop) -->
          <th
            v-for="col in columns"
            :key="col.key"
            class="lt-th"
            :class="[col.thClass, col.sortable ? 'lt-th--sortable' : '']"
            :style="col.width ? { width: col.width } : {}"
            @click="col.sortable ? onSort(col.key) : null"
          >
            <span class="lt-th-inner">
              {{ col.label }}
              <span v-if="col.sortable" class="lt-sort-icon">
                <svg v-if="sortKey === col.key && sortDir === 'asc'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>
                <svg v-else-if="sortKey === col.key && sortDir === 'desc'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>
              </span>
            </span>
          </th>

          <!-- Actions column (shown if parent provides an `actions` slot) -->
          <th v-if="$slots.actions" class="lt-th lt-th--actions">
            {{ actionsLabel }}
          </th>
        </tr>
      </thead>

      <!-- ── BODY ──────────────────────────────────────────────────────────── -->
      <tbody>
        <template v-if="rows.length > 0">
          <tr
            v-for="(row, rowIndex) in rows"
            :key="rowKey ? row[rowKey] : rowIndex"
            class="lt-row"
            :class="[
              rowClass ? rowClass(row) : '',
              selectedRows.has(rowKey ? row[rowKey] : rowIndex) ? 'lt-row--selected' : '',
              clickable ? 'lt-row--clickable' : ''
            ]"
            @click="clickable ? $emit('row-click', row) : null"
          >
            <!-- Checkbox cell -->
            <td v-if="selectable" class="lt-td lt-td--check" @click.stop>
              <input
                type="checkbox"
                :checked="selectedRows.has(rowKey ? row[rowKey] : rowIndex)"
                @change="toggleRow(rowKey ? row[rowKey] : rowIndex)"
              />
            </td>

            <!-- Data cells -->
            <td
              v-for="col in columns"
              :key="col.key"
              class="lt-td"
              :class="col.tdClass"
            >
              <!--
                Priority:
                  1. Named slot  `cell-{col.key}`  → full custom render
                  2. col.render(value, row)         → custom formatter function
                  3. col.format  ('currency' | 'date' | 'badge')  → built-in
                  4. Raw value fallback
              -->
              <slot
                v-if="$slots[`cell-${col.key}`]"
                :name="`cell-${col.key}`"
                :value="getVal(row, col.key)"
                :row="row"
                :col="col"
              />
              <template v-else-if="col.render">
                <span v-html="col.render(getVal(row, col.key), row)" />
              </template>
              <template v-else-if="col.format === 'currency'">
                <span class="lt-currency">{{ formatCurrency(getVal(row, col.key)) }}</span>
              </template>
              <template v-else-if="col.format === 'date'">
                <span class="lt-date">{{ formatDate(getVal(row, col.key)) }}</span>
              </template>
              <template v-else-if="col.format === 'badge'">
                <span class="lt-badge" :class="`lt-badge--${getVal(row, col.key)}`">
                  {{ col.badgeLabel ? col.badgeLabel(getVal(row, col.key)) : getVal(row, col.key) }}
                </span>
              </template>
              <template v-else-if="col.format === 'boolean'">
                <span :class="getVal(row, col.key) ? 'lt-bool--yes' : 'lt-bool--no'">
                  {{ getVal(row, col.key) ? (col.trueLabel ?? 'Yes') : (col.falseLabel ?? 'No') }}
                </span>
              </template>
              <template v-else>
                {{ getVal(row, col.key) ?? col.fallback ?? '—' }}
              </template>
            </td>

            <!-- Actions cell — parent decides what buttons appear per row -->
            <td v-if="$slots.actions" class="lt-td lt-td--actions" @click.stop>
              <div class="lt-actions">
                <slot name="actions" :row="row" :index="rowIndex" />
              </div>
            </td>
          </tr>
        </template>

        <!-- ── EMPTY STATE ──────────────────────────────────────────────── -->
        <tr v-else>
          <td
            :colspan="totalCols"
            class="lt-empty"
          >
            <!-- Fully custom empty state -->
            <slot name="empty">
              <div class="lt-empty-content">
                <svg class="lt-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <slot name="empty-icon">
                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
                  </slot>
                </svg>
                <p class="lt-empty-title">{{ emptyTitle }}</p>
                <p class="lt-empty-msg">{{ emptyMessage }}</p>
                <button v-if="showEmptyAction" class="lt-empty-btn" @click="$emit('empty-action')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  {{ emptyActionLabel }}
                </button>
              </div>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ── FOOTER: selection summary + pagination ──────────────────────────── -->
    <div class="lt-footer">
      <!-- Selection summary -->
      <div v-if="selectable && selectedRows.size > 0" class="lt-selection-bar">
        <span>{{ selectedRows.size }} selected</span>
        <slot name="bulk-actions" :selected="[...selectedRows]" />
        <button class="lt-deselect" @click="selectedRows.clear()">Clear</button>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination && pagination.totalPages > 1"
        class="lt-pagination"
      >
        <button
          class="lt-page-btn"
          :disabled="pagination.currentPage <= 1"
          @click="$emit('page-change', pagination.currentPage - 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <!-- Page number pills -->
        <template v-for="p in pageRange" :key="p">
          <span v-if="p === '...'" class="lt-page-ellipsis">…</span>
          <button
            v-else
            class="lt-page-btn"
            :class="{ 'lt-page-btn--active': p === pagination.currentPage }"
            @click="$emit('page-change', p)"
          >
            {{ p }}
          </button>
        </template>

        <button
          class="lt-page-btn"
          :disabled="pagination.currentPage >= pagination.totalPages"
          @click="$emit('page-change', pagination.currentPage + 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <span class="lt-page-info">
          {{ pagination.currentPage * pagination.pageSize - pagination.pageSize + 1 }}–{{
            Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)
          }} of {{ pagination.totalItems }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps({
  /**
   * Column definitions:
   * {
   *   key: string,          // dot-notation supported: 'team.name'
   *   label: string,
   *   width?: string,       // e.g. '120px'
   *   sortable?: boolean,
   *   format?: 'currency' | 'date' | 'badge' | 'boolean',
   *   render?: (value, row) => string,       // raw HTML string
   *   badgeLabel?: (value) => string,        // label formatter for badge format
   *   trueLabel?: string, falseLabel?: string,  // for boolean format
   *   fallback?: string,    // shown when value is null/undefined (default '—')
   *   thClass?: string,
   *   tdClass?: string,
   * }
   */
  columns: {
    type: Array,
    required: true,
  },
  /** Array of row data objects */
  rows: {
    type: Array,
    default: () => [],
  },
  /** Property to use as the unique row key (e.g. 'donationId') */
  rowKey: {
    type: String,
    default: null,
  },
  /**
   * Pagination object:
   * { currentPage, totalPages, totalItems, pageSize }
   * Pass null / undefined to hide pagination entirely.
   */
  pagination: {
    type: Object,
    default: null,
  },
  /** Enable row checkboxes for bulk selection */
  selectable: {
    type: Boolean,
  },
  /** Make the whole row clickable (emits row-click) */
  clickable: {
    type: Boolean,
    default: false,
  },
  /** Function that returns extra classes for a given row: (row) => string */
  rowClass: {
    type: Function,
    default: null,
  },
  /** Label for the actions column header */
  actionsLabel: {
    type: String,
    default: 'Actions',
  },
  /** Empty state */
  emptyTitle: {
    type: String,
    default: 'No records found',
  },
  emptyMessage: {
    type: String,
    default: 'Try adjusting your search or filter criteria',
  },
  showEmptyAction: {
    type: Boolean,
    default: true,
  },
  emptyActionLabel: {
    type: String,
    default: 'Clear Filters',
  },
  /** Loading skeleton */
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'page-change',
  'sort-change',
  'row-click',
  'selection-change',
  'empty-action',
]);

// ── Sorting ───────────────────────────────────────────────────────────────────

const sortKey = ref(null);
const sortDir = ref('asc');

function onSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
  emit('sort-change', { key: sortKey.value, dir: sortDir.value });
}

// ── Selection ─────────────────────────────────────────────────────────────────

const selectedRows = ref(new Set());

const allSelected = computed(() =>
  props.rows.length > 0 && props.rows.every((r, i) => {
    const id = props.rowKey ? r[props.rowKey] : i;
    return selectedRows.value.has(id);
  })
);

const someSelected = computed(() =>
  !allSelected.value &&
  props.rows.some((r, i) => selectedRows.value.has(props.rowKey ? r[props.rowKey] : i))
);

function toggleSelectAll() {
  if (allSelected.value) {
    selectedRows.value.clear();
  } else {
    props.rows.forEach((r, i) => selectedRows.value.add(props.rowKey ? r[props.rowKey] : i));
  }
  emit('selection-change', [...selectedRows.value]);
}

function toggleRow(id) {
  if (selectedRows.value.has(id)) selectedRows.value.delete(id);
  else selectedRows.value.add(id);
  emit('selection-change', [...selectedRows.value]);
}

// Clear selection when rows change (page turn, filter)
watch(() => props.rows, () => selectedRows.value.clear());

// ── Pagination page-range helper ──────────────────────────────────────────────

const pageRange = computed(() => {
  if (!props.pagination) return [];
  const { currentPage, totalPages } = props.pagination;
  const delta = 2;
  const range = [];
  const rangeWithDots = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  let prev = null;
  for (const p of range) {
    if (prev && p - prev > 1) rangeWithDots.push('...');
    rangeWithDots.push(p);
    prev = p;
  }
  return rangeWithDots;
});

// ── Column count for empty-state colspan ─────────────────────────────────────

const totalCols = computed(() => {
  let n = props.columns.length;
  if (props.selectable) n++;
  if (/* has actions slot */ true) n++;  // we can't check slots in script, always +1 is safe
  return n;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Supports dot-notation: 'team.name', 'fullInfo.location.city' */
function getVal(row, key) {
  return key.split('.').reduce((obj, k) => obj?.[k], row);
}

function formatCurrency(val) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(val ?? 0);
}

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-ET', {
    year: 'numeric', month: 'short', day: '2-digit',
  });
}
</script>

<style scoped>
/* ── Container ──────────────────────────────────────────────────────────────── */
.lt-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* ── Table ──────────────────────────────────────────────────────────────────── */
.lt-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  font-size: 13px;
}

/* ── Head ───────────────────────────────────────────────────────────────────── */
.lt-th {
  padding: 11px 14px;
  text-align: left;
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  user-select: none;
}
.lt-th--sortable { cursor: pointer; }
.lt-th--sortable:hover { background: #f1f5f9; color: #1e293b; }
.lt-th--check { width: 40px; text-align: center; }
.lt-th--actions { width: 120px; text-align: center; }

.lt-th-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lt-sort-icon svg {
  width: 13px;
  height: 13px;
  color: #94a3b8;
}

/* ── Rows ───────────────────────────────────────────────────────────────────── */
.lt-row { transition: background 0.15s; }
.lt-row:hover { background: #f8fafc; }
.lt-row--selected { background: #ede9fe !important; }
.lt-row--clickable { cursor: pointer; }

/* ── Cells ──────────────────────────────────────────────────────────────────── */
.lt-td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.lt-td--check { text-align: center; }
.lt-td--actions { text-align: center; }

.lt-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
}

/* ── Built-in formats ───────────────────────────────────────────────────────── */
.lt-currency { font-weight: 600; color: #1e293b; font-variant-numeric: tabular-nums; }
.lt-date     { white-space: nowrap; color: #475569; }

/* Badge */
.lt-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  text-transform: capitalize;
}
/* Status colours — extend by adding more .lt-badge--{value} classes in your view */
.lt-badge--draft      { background: #f1f5f9; color: #475569; }
.lt-badge--pending    { background: #fef3c7; color: #b45309; }
.lt-badge--approved   { background: #dcfce7; color: #15803d; }
.lt-badge--rejected   { background: #fee2e2; color: #b91c1c; }
.lt-badge--cancelled  { background: #fee2e2; color: #b91c1c; }
.lt-badge--commented  { background: #dbeafe; color: #1d4ed8; }
.lt-badge--individual { background: #ede9fe; color: #6d28d9; }
.lt-badge--organization { background: #fce7f3; color: #be185d; }
.lt-badge--money   { background: #dcfce7; color: #15803d; }
.lt-badge--goods   { background: #fef3c7; color: #b45309; }
.lt-badge--service { background: #dbeafe; color: #1d4ed8; }
.lt-badge--active   { background: #dcfce7; color: #15803d; }
.lt-badge--inactive { background: #f1f5f9; color: #64748b; }

/* Boolean */
.lt-bool--yes { color: #15803d; font-weight: 600; }
.lt-bool--no  { color: #94a3b8; }

/* ── Empty state ────────────────────────────────────────────────────────────── */
.lt-empty {
  text-align: center;
  padding: 60px 20px !important;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}
.lt-empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.lt-empty-icon {
  width: 72px;
  height: 72px;
  color: #94a3b8;
  opacity: 0.55;
}
.lt-empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #475569;
  margin: 0;
}
.lt-empty-msg {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.lt-empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #6a11cb;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.lt-empty-btn svg { width: 14px; height: 14px; }
.lt-empty-btn:hover { background: #6a11cb; border-color: #6a11cb; color: white; }

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.lt-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 16px;
  border-top: 1px solid #f1f5f9;
  min-height: 56px;
}

/* Selection bar */
.lt-selection-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #6d28d9;
  font-weight: 500;
}
.lt-deselect {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

/* Pagination */
.lt-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.lt-page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.lt-page-btn svg { width: 15px; height: 15px; }
.lt-page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
.lt-page-btn--active { background: #6a11cb; border-color: #6a11cb; color: white; font-weight: 600; }
.lt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.lt-page-ellipsis { padding: 0 4px; color: #94a3b8; }
.lt-page-info { font-size: 12px; color: #94a3b8; margin-left: 8px; white-space: nowrap; }

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .lt-table { min-width: 500px; }
  .lt-footer { flex-direction: column; align-items: flex-start; }
  .lt-pagination { margin-left: 0; }
}
</style>
