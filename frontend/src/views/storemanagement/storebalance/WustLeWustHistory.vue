<!-- views/storemanagement/storebalance/WustLeWustHistory.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📋 ውስጥ ለውስጥ History</h2>
        <span class="total-badge">{{ filteredRecords.length }} Transfers</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="filters.search"
            placeholder="Search by item, code, or transfer no…"
            @input="onSearchInput"
          />
        </div>
        <div class="action-buttons">
          <button
            class="btn-filter-toggle"
            :class="{ 'btn-filter-active': filters.missingTransferNumber }"
            @click="toggleMissingFilter"
            :disabled="loading"
            title="Show only records without a transfer number"
          >
            {{ filters.missingTransferNumber ? '✓' : '⚠️' }} Missing Transfer No.
            <span v-if="missingTransferCount > 0" class="filter-count">
              {{ missingTransferCount }}
            </span>
          </button>
          <button
            class="btn-filter-toggle"
            @click="showFilters = !showFilters"
          >
            {{ showFilters ? '▲ Hide Filters' : '▼ Show Filters' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== FILTERS - COLLAPSIBLE ==================== -->
    <div class="filter-wrapper" :class="{ 'filter-expanded': showFilters }">
      <div class="filter-bar">
        <div class="filter-group">
          <input
            type="date"
            v-model="filters.fromDate"
            class="filter-select"
            title="From date"
            @change="onFilterChange"
          />
        </div>
        <div class="filter-group">
          <input
            type="date"
            v-model="filters.toDate"
            class="filter-select"
            title="To date"
            @change="onFilterChange"
          />
        </div>

        <button
          class="btn-clear-filters"
          @click="clearFilters"
          v-if="hasFilters"
        >
          ✕ Clear Filters
        </button>
      </div>
    </div>

    <!-- ==================== LOADING / TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading history…</p>
    </div>

    <div v-else class="table-container">
      <table class="transaction-table">
        <thead>
          <tr>
            <th style="width:30px"></th>
            <th>Date</th>
            <th>Transfer No.</th>
            <th>Source Item</th>
            <th>Source UOM</th>
            <th>Source Qty</th>
            <th>Target Item</th>
            <th>Target UOM</th>
            <th>Target Qty</th>
            <th style="width:60px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRecords.length === 0">
            <td colspan="10" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📋</span>
                <p v-if="filters.missingTransferNumber">
                  No transfers missing a transfer number
                </p>
                <p v-else>No conversion history found</p>
              </div>
            </td>
          </tr>

          <template v-for="rec in paginatedRecords" :key="rec.id">
            <tr :class="{ 'expanded-row': expandedRow === rec.id }">
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(rec.id)">
                  {{ expandedRow === rec.id ? '▼' : '▶' }}
                </button>
              </td>

              <td class="date-time">{{ formatDateShort(rec.createdAt) }}</td>

              <td>
                <span v-if="rec.transferNumber" class="code-tag">
                  {{ rec.transferNumber }}
                </span>
                <span v-else class="empty-mark">—</span>
              </td>

              <td>
                <div class="item-info">
                  <div class="item-common-name">{{ rec.sourceItemName }}</div>
                  <div class="item-standard-name">{{ rec.sourceItemCode }}</div>
                </div>
              </td>

              <td>
                <span class="uom-display">{{ rec.sourceUom }}</span>
              </td>

              <td>
                <span class="quantity-value negative">
                  −{{ formatNumber(rec.quantity) }}
                </span>
              </td>

              <td>
                <div class="item-info">
                  <div class="item-common-name">{{ rec.targetItemName }}</div>
                  <div class="item-standard-name">{{ rec.targetItemCode }}</div>
                </div>
              </td>

              <td>
                <span class="uom-display">{{ rec.targetUom }}</span>
              </td>

              <td>
                <span class="quantity-value positive">
                  +{{ formatNumber(rec.resultQuantity) }}
                </span>
              </td>

              <td class="text-center">
                <button
                  class="icon-btn edit-btn"
                  @click="openEditTransferNumber(rec)"
                  title="Edit transfer number"
                >
                  ✏️
                </button>
              </td>
            </tr>

            <!-- Expanded detail -->
            <tr v-if="expandedRow === rec.id" class="detail-expand-row">
              <td colspan="10">
                <div class="expand-details">
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">Transfer No.</span>
                      <span class="detail-value">{{ rec.transferNumber || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Date &amp; Time</span>
                      <span class="detail-value">{{ formatDateTime(rec.createdAt) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Changed By</span>
                      <span class="detail-value">{{ rec.changedBy || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Conversion</span>
                      <span class="detail-value">× {{ rec.conversionValue }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Source Prev. Balance</span>
                      <span class="detail-value">
                        {{ formatNumber(rec.sourcePreviousBalance) }} {{ rec.sourceUom }}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Source New Balance</span>
                      <span class="detail-value">
                        {{ formatNumber(rec.sourceNewBalance) }} {{ rec.sourceUom }}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Target Prev. Balance</span>
                      <span class="detail-value">
                        {{ formatNumber(rec.targetPreviousBalance) }} {{ rec.targetUom }}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Target New Balance</span>
                      <span class="detail-value">
                        {{ formatNumber(rec.targetNewBalance) }} {{ rec.targetUom }}
                      </span>
                    </div>
                    <div v-if="rec.remark" class="detail-item detail-item-full">
                      <span class="detail-label">Remark</span>
                      <span class="detail-value">{{ rec.remark }}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="!loading && filteredRecords.length > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
        Next →
      </button>
      <select v-model.number="pageSize" @change="currentPage = 1" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>

    <!-- ==================== EDIT TRANSFER NUMBER MODAL ==================== -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>✏️ Edit Transfer Number</h3>
          <button class="modal-close" @click="closeEditModal" :disabled="savingTransferNumber">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-intro">
            Update the transfer number for the conversion on
            <strong>{{ editingRecord?.createdAt ? formatDateTime(editingRecord.createdAt) : '' }}</strong>.
          </p>

          <div class="modal-form-group">
            <label class="modal-label">Transfer Number</label>
            <input
              v-model.trim="editTransferNumber"
              type="text"
              placeholder="e.g. WLW-2026-0042"
              class="modal-input"
              :disabled="savingTransferNumber"
              @keyup.enter="saveTransferNumber"
            />
            <span class="modal-hint">Leave empty to clear the transfer number.</span>
          </div>

          <p v-if="editError" class="modal-error">{{ editError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeEditModal" :disabled="savingTransferNumber">
            Cancel
          </button>
          <button class="btn-primary" @click="saveTransferNumber" :disabled="savingTransferNumber">
            <span v-if="savingTransferNumber" class="btn-spinner"></span>
            {{ savingTransferNumber ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import balanceService from '@/stores/balanceService';

dayjs.extend(utc);
dayjs.extend(timezone);

/* ================================================================
   STATE
   ================================================================ */

const records = ref([]);
const loading = ref(false);

const expandedRow = ref(null);
const showFilters = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

const filters = ref({
  search: '',
  fromDate: '',
  toDate: '',
  missingTransferNumber: false,
});

// Edit-transfer-number modal
const showEditModal = ref(false);
const editingRecord = ref(null);
const editTransferNumber = ref('');
const editError = ref('');
const savingTransferNumber = ref(false);

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

/* ================================================================
   LOAD FROM BACKEND
   ================================================================ */

const loadHistory = async () => {
  loading.value = true;
  try {
    const res = await balanceService.getWustLeWustHistory({
      search: filters.value.search.trim() || undefined,
      fromDate: filters.value.fromDate || undefined,
      toDate: filters.value.toDate || undefined,
      missingTransferNumber: filters.value.missingTransferNumber,
    });

    if (res.success && res.data) {
      records.value = res.data;
    } else {
      showToastMessage(res.error || 'Failed to load history', 'error');
      records.value = [];
    }
  } catch (err) {
    console.error('Load history error:', err);
    showToastMessage(
      err.response?.data?.error || err.message || 'Failed to load history',
      'error',
    );
    records.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadHistory);

/* ================================================================
   COMPUTED
   ================================================================ */

const hasFilters = computed(
  () =>
    !!filters.value.search.trim() ||
    !!filters.value.fromDate ||
    !!filters.value.toDate ||
    filters.value.missingTransferNumber,
);

const missingTransferCount = computed(
  () =>
    records.value.filter(
      (r) => !r.transferNumber || String(r.transferNumber).trim() === '',
    ).length,
);

// The backend already filtered the list, so this is just a pass-through
const filteredRecords = computed(() => records.value);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRecords.value.length / pageSize.value)),
);

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRecords.value.slice(start, start + pageSize.value);
});

/* ================================================================
   FILTERS
   ================================================================ */

let searchTimer = null;

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    loadHistory();
  }, 300);
};

const onFilterChange = () => {
  currentPage.value = 1;
  loadHistory();
};

const toggleMissingFilter = () => {
  filters.value.missingTransferNumber = !filters.value.missingTransferNumber;
  currentPage.value = 1;
  loadHistory();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    fromDate: '',
    toDate: '',
    missingTransferNumber: false,
  };
  currentPage.value = 1;
  loadHistory();
};

/* ================================================================
   HELPERS
   ================================================================ */

const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const formatNumber = (num) => new Intl.NumberFormat().format(num);

const formatDateShort = (dateString) => {
  if (!dateString) return '';
  return dayjs.utc(dateString).add(6, 'hour').format('MMM D, h:mm A');
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return dayjs.utc(dateString).add(6, 'hour').format('MMM D, YYYY h:mm A');
};

/* ================================================================
   EDIT TRANSFER NUMBER — real backend call
   ================================================================ */

const openEditTransferNumber = (rec) => {
  editingRecord.value = rec;
  editTransferNumber.value = rec.transferNumber || '';
  editError.value = '';
  showEditModal.value = true;
};

const closeEditModal = () => {
  if (savingTransferNumber.value) return;
  showEditModal.value = false;
  editingRecord.value = null;
  editTransferNumber.value = '';
  editError.value = '';
};

const saveTransferNumber = async () => {
  if (!editingRecord.value) return;

  const trimmed = editTransferNumber.value.trim();

  if (trimmed && trimmed.length > 100) {
    editError.value = 'Transfer number must be 100 characters or fewer';
    return;
  }

  savingTransferNumber.value = true;
  editError.value = '';

  try {
    const res = await balanceService.updateWustLeWustTransferNumber(
      editingRecord.value.id,
      trimmed || null,
    );

    if (res.success) {
      // Update the local record so the table reflects the change
      const target = records.value.find(
        (r) => r.id === editingRecord.value.id,
      );
      if (target) target.transferNumber = trimmed || null;

      showToastMessage(
        trimmed ? 'Transfer number updated' : 'Transfer number cleared',
        'success',
      );

      savingTransferNumber.value = false;
      closeEditModal();
    } else {
      editError.value = res.error || res.message || 'Failed to save';
      savingTransferNumber.value = false;
    }
  } catch (err) {
    console.error('Save transfer number error:', err);
    editError.value =
      err.response?.data?.error || err.message || 'Failed to save';
    savingTransferNumber.value = false;
  }
};

/* ================================================================
   TOAST
   ================================================================ */

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
};
</script>

<style scoped>
/* ================================================================
   SECTION CARD
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
  white-space: nowrap;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 240px;
  background: #f8fafc;
  transition: all 0.2s;
  font-family: inherit;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-filter-toggle {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: inherit;
}

.btn-filter-toggle:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-filter-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-filter-toggle.btn-filter-active {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.btn-filter-toggle.btn-filter-active:hover:not(:disabled) {
  background: #fde68a;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #dc2626;
  color: white;
  font-size: 10px;
  font-weight: 700;
}

/* ================================================================
   FILTER WRAPPER - COLLAPSIBLE
   ================================================================ */
.filter-wrapper {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease, margin 0.3s ease;
  margin-bottom: 0;
}

.filter-wrapper.filter-expanded {
  max-height: 400px;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  min-width: 150px;
  font-family: inherit;
}

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: inherit;
}

.btn-clear-filters:hover {
  background: #e2e8f0;
}

/* ================================================================
   LOADING
   ================================================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: #64748b;
}

.loading-state .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
  min-height: 200px;
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.transaction-table th,
.transaction-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.transaction-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.text-center {
  text-align: center;
}

.date-time {
  font-size: 12px;
  white-space: nowrap;
}

.empty-mark {
  color: #cbd5e1;
  font-weight: 600;
}

/* ================================================================
   TRANSFER NUMBER TAG
   ================================================================ */
.code-tag {
  display: inline-block;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  color: #4338ca;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================================================================
   ITEM INFO
   ================================================================ */
.item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-common-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
}

.item-standard-name {
  font-size: 11px;
  color: #64748b;
  font-weight: 400;
  font-style: italic;
  line-height: 1.2;
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

/* ================================================================
   UOM DISPLAY
   ================================================================ */
.uom-display {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #e0f2fe;
  color: #0369a1;
  white-space: nowrap;
}

/* ================================================================
   QUANTITY
   ================================================================ */
.quantity-value {
  font-weight: 600;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.quantity-value.positive {
  color: #166534;
}

.quantity-value.negative {
  color: #991b1b;
}

/* ================================================================
   ACTION BUTTONS IN ROW
   ================================================================ */
.icon-btn {
  background: transparent;
  border: 1px solid #e2e8f0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.edit-btn {
  color: #3b82f6;
}

.edit-btn:hover {
  background: #e0e7ff;
  border-color: #a5b4fc;
  color: #2563eb;
}

/* ================================================================
   EXPAND
   ================================================================ */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
}

.expand-btn:hover {
  background: #e0e7ff;
}

.expanded-row {
  background: #f8fafc;
}

.detail-expand-row td {
  padding: 0 !important;
}

.expand-details {
  padding: 14px 18px;
  background: white;
  border-radius: 10px;
  margin: 6px 0;
  border: 1px solid #e2e8f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.detail-item-full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.detail-value {
  font-size: 12.5px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 40px !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.3;
}

.empty-content p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: inherit;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}

/* ================================================================
   MODAL
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #94a3b8;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-body {
  padding: 18px 20px;
}

.modal-intro {
  margin: 0 0 14px 0;
  font-size: 12.5px;
  color: #64748b;
  line-height: 1.5;
}

.modal-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #475569;
}

.modal-input {
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  font-family: inherit;
  transition: all 0.18s;
}

.modal-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.modal-hint {
  font-size: 11px;
  color: #94a3b8;
}

.modal-error {
  margin: 10px 0 0 0;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 12px;
  color: #991b1b;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  font-family: inherit;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  color: #475569;
  transition: all 0.15s;
  font-family: inherit;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 10px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  border-left: 3px solid #10b981;
  font-size: 13px;
  color: #0f172a;
  font-weight: 500;
  animation: slideIn 0.3s ease;
  max-width: 90vw;
}

.toast.error {
  border-left-color: #ef4444;
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

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box input {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
  }

  .filter-bar select,
  .filter-bar input {
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-wrapper.filter-expanded {
    max-height: 600px;
  }
}

@media (max-width: 600px) {
  .section-card {
    padding: 12px;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .transaction-table {
    font-size: 12px;
  }

  .transaction-table th,
  .transaction-table td {
    padding: 6px 8px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>