<template>
  <div class="section-card">
    <div class="card-header">
      <h2>Penalty Summary - {{ dateRangeLabel }}</h2>
      <div class="header-filters">
        <button class="btn-primary" @click="openImportModal" :disabled="loading">
          📥 Import
        </button>
        <button class="btn-export" @click="exportPenaltySummary" :disabled="exportingPenalty || loading">
          <span v-if="exportingPenalty" class="spinner-small"></span>
          <span v-else>📤</span>
          {{ exportingPenalty ? "Exporting..." : "Export" }}
        </button>
      </div>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" v-model="penaltySearch" placeholder="Search employee..." @input="debouncedSearch" />
      </div>
      
      <select v-model="penaltyDeptFilter" class="filter-select" @change="loadPenaltyData">
        <option value="all">All Departments</option>
        <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
      </select>
      
      <div class="quick-months">
        <button class="quick-month-btn" @click="setMonthFilter('current')" :class="{ active: isCurrentMonth }">This Month</button>
        <button class="quick-month-btn" @click="setMonthFilter('last')" :class="{ active: isLastMonth }">Last Month</button>
        <button class="quick-month-btn" @click="setMonthFilter('next')" :class="{ active: isNextMonth }">Next Month</button>
      </div>
      
      <div class="date-range-filter">
        <div class="date-input-group">
          <span class="date-label">From:</span>
          <input type="date" v-model="penaltyDateFrom" @change="onDateRangeChange" class="date-input" />
        </div>
        <div class="date-input-group">
          <span class="date-label">To:</span>
          <input type="date" v-model="penaltyDateTo" @change="onDateRangeChange" class="date-input" />
        </div>
        <button class="btn-clear-dates" @click="clearDateRange" v-if="penaltyDateFrom || penaltyDateTo" title="Clear date range">✕</button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading penalty data...</p>
    </div>

    <div v-else class="table-container">
      <table class="payroll-table penalty-table">
        <thead>
          <tr>
        
            <th>Employee</th>
            <th>Dept</th>
            <th class="text-center">Penalty %</th>
            <th class="text-right">Asset Penalty (ETB)</th>
            <th class="text-right">Other Penalty (ETB)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(penalty, idx) in paginatedPenaltiesList" :key="penalty.id">
           
            <td class="employee-cell">
    
              <div class="employee-info">
                <strong>{{ penalty.employeeName }}</strong>
                <div class="employee-code">{{ penalty.employeeCode }}</div>
              </div>
            </td>
            <td class="text-center">{{ penalty.department }}</td>
            <td class="text-center percent-cell"><strong class="text-orange">{{ penalty.percentPenalty || 0 }}%</strong></td>
            <td class="text-right asset-cell"><strong class="text-blue">{{ formatCurrency(penalty.assetPenalty || 0) }}</strong></td>
            <td class="text-right other-cell"><strong class="text-purple">{{ formatCurrency(penalty.otherPenalty || 0) }}</strong></td>
            <td class="text-center"><span class="status-badge" :class="getStatusClass(penalty)">{{ getStatusText(penalty) }}</span></td>
            <td class="text-center">
              <button class="btn-small primary" @click="openPenaltyReductionModal(penalty)">Reduce</button>
              <button class="btn-small info" @click="openPenaltyDetailModal(penalty)">Details</button>
            </td>
          </tr>
          <tr v-if="filteredPenaltiesList.length === 0 && !loading">
            <td colspan="8" class="empty-state-cell">
              <div class="empty-state-content">
                <div class="empty-icon">✅</div>
                <p>No penalties found for {{ dateRangeLabel }}</p>
                <p class="empty-sub">Try adjusting your date range or search criteria</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="penaltyPagination.totalPages > 1">
      <button class="page-btn" :disabled="penaltyPagination.page === 1" @click="changePenaltyPage(penaltyPagination.page - 1)">← Previous</button>
      <span class="page-info">Page {{ penaltyPagination.page }} of {{ penaltyPagination.totalPages }}</span>
      <button class="page-btn" :disabled="penaltyPagination.page === penaltyPagination.totalPages" @click="changePenaltyPage(penaltyPagination.page + 1)">Next →</button>
      <select v-model="penaltyPagination.limit" @change="changePenaltyLimit" class="limit-select">
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>
  </div>

  <!-- ==================== PENALTY REDUCTION MODAL ==================== -->
  <div v-if="showPenaltyReductionModal" class="modal-overlay" @click.self="showPenaltyReductionModal = false">
    <div class="modal-container penalty-reduction-modal">
      <div class="modal-header">
        <h3>Reduce Penalty - {{ selectedPenaltyEmployee?.employeeName }}</h3>
        <button class="modal-close" @click="showPenaltyReductionModal = false">✕</button>
      </div>
      <div class="modal-body">
        <div class="current-penalty-info">
          <div class="info-row" v-if="selectedPenaltyEmployee?.percentPenalty > 0"><span>Current Penalty %:</span><strong class="text-orange">{{ selectedPenaltyEmployee?.percentPenalty || 0 }}%</strong></div>
          <div class="info-row" v-if="selectedPenaltyEmployee?.assetPenalty > 0"><span>Current Asset Penalty:</span><strong class="text-blue">{{ formatCurrency(selectedPenaltyEmployee?.assetPenalty || 0) }}</strong></div>
          <div class="info-row" v-if="selectedPenaltyEmployee?.otherPenalty > 0"><span>Current Other Penalty:</span><strong class="text-purple">{{ formatCurrency(selectedPenaltyEmployee?.otherPenalty || 0) }}</strong></div>
        </div>

        <div class="form-field" v-if="selectedPenaltyEmployee?.percentPenalty > 0">
          <label>Reduce Penalty % by (0 to {{ selectedPenaltyEmployee?.percentPenalty || 0 }}%)</label>
          <input type="number" v-model.number="penaltyPercentReduction" class="form-input" min="0" :max="selectedPenaltyEmployee?.percentPenalty" step="1" @input="validatePercentReduction" placeholder="Enter percentage to reduce" />
          <div class="input-hint">New Penalty %: {{ Math.max(0, (selectedPenaltyEmployee?.percentPenalty || 0) - penaltyPercentReduction) }}%</div>
        </div>

        <div class="form-field" v-if="selectedPenaltyEmployee?.otherPenalty > 0">
          <label>Reduce Other Penalty by (0 to {{ formatCurrency(selectedPenaltyEmployee?.otherPenalty || 0) }})</label>
          <input type="number" v-model.number="penaltyOtherReduction" class="form-input" min="0" :max="selectedPenaltyEmployee?.otherPenalty" step="1" @input="validateOtherReduction" placeholder="Enter amount to reduce" />
          <div class="input-hint">New Other Penalty: {{ formatCurrency(Math.max(0, (selectedPenaltyEmployee?.otherPenalty || 0) - penaltyOtherReduction)) }}</div>
        </div>

        <div class="form-field" v-if="selectedPenaltyEmployee?.assetPenalty > 0">
          <label>Reduce Asset Penalty by (0 to {{ formatCurrency(selectedPenaltyEmployee?.assetPenalty || 0) }})</label>
          <input type="number" v-model.number="penaltyAssetReduction" class="form-input" min="0" :max="selectedPenaltyEmployee?.assetPenalty" step="1" @input="validateAssetReduction" placeholder="Enter amount to reduce" />
          <div class="input-hint">New Asset Penalty: {{ formatCurrency(Math.max(0, (selectedPenaltyEmployee?.assetPenalty || 0) - penaltyAssetReduction)) }}</div>
        </div>

        <div class="form-field">
          <label>Reason for Reduction</label>
          <textarea v-model="penaltyReductionReason" class="form-textarea" rows="2" placeholder="Enter reason for penalty reduction..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="showPenaltyReductionModal = false">Cancel</button>
        <button class="btn-primary" @click="applyPenaltyReductionToEmployee" :disabled="applyingReduction">
          <span v-if="applyingReduction" class="spinner-small"></span><span v-else>Apply Reduction</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== PENALTY DETAIL MODAL ==================== -->
  <div v-if="showPenaltyDetailModal" class="modal-overlay" @click.self="showPenaltyDetailModal = false">
    <div class="modal-container penalty-detail-modal">
      <div class="modal-header">
        <h3>Penalty Details - {{ selectedDetailEmployee?.employeeName }}</h3>
        <button class="modal-close" @click="showPenaltyDetailModal = false">✕</button>
      </div>
      <div class="modal-body">
        <div class="detail-summary-cards">
          <div class="detail-card-small percent">
            <div class="detail-card-title">Penalty %</div>
            <div class="detail-card-value">{{ selectedDetailEmployee?.percentPenalty || 0 }}%</div>
           
            <div class="detail-card-status" :class="getDetailStatusClass('percent')">{{ getDetailStatusText('percent') }}</div>
          </div>
          <div class="detail-card-small asset">
            <div class="detail-card-title">Asset Penalty</div>
            <div class="detail-card-value">{{ formatCurrency(selectedDetailEmployee?.assetPenalty || 0) }}</div>
            <div class="detail-card-status" :class="getDetailStatusClass('asset')">{{ getDetailStatusText('asset') }}</div>
          </div>
          <div class="detail-card-small other">
            <div class="detail-card-title">Other Penalty</div>
            <div class="detail-card-value">{{ formatCurrency(selectedDetailEmployee?.otherPenalty || 0) }}</div>
        
            <div class="detail-card-status" :class="getDetailStatusClass('other')">{{ getDetailStatusText('other') }}</div>
          </div>
        </div>

        <div class="reduction-history" v-if="reductionHistory.length > 0">
          <h4>Reduction History</h4>
          <div class="history-list">
            <div v-for="(record, idx) in reductionHistory" :key="idx" class="history-item">
              <div class="history-date">{{ formatDate(record.date) }}</div>
              <div class="history-details">
                <span class="history-type">{{ record.type }}</span>
                <span class="history-amount">-{{ record.amount }} {{ record.isPercent ? '%' : 'ETB' }}</span>
              </div>
              <div class="history-reason">{{ record.reason }}</div>
              <div class="history-by">by: {{ record.processedBy }}</div>
              <div class="history-actions">
                <button class="history-edit-btn" @click="editReduction(record, idx)" title="Edit Reduction">✏️</button>
                <button class="history-delete-btn" @click="deleteReduction(record, idx)" title="Delete Reduction">🗑️</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-history"><p>No reduction history found for this employee.</p></div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="showPenaltyDetailModal = false">Close</button>
      </div>
    </div>
  </div>

  <!-- ==================== EDIT REDUCTION MODAL ==================== -->
  <div v-if="showEditReductionModal" class="modal-overlay" @click.self="showEditReductionModal = false">
    <div class="modal-container edit-reduction-modal">
      <div class="modal-header">
        <h3>Edit Reduction - {{ editingReduction?.type }}</h3>
        <button class="modal-close" @click="showEditReductionModal = false">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-field">
          <label>Reduction Amount</label>
          <input type="number" v-model.number="editingReductionAmount" class="form-input" min="0" step="1" placeholder="Enter new reduction amount" />
        </div>
        <div class="form-field">
          <label>Reason</label>
          <textarea v-model="editingReductionReason" class="form-textarea" rows="2" placeholder="Enter reason for this reduction..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="showEditReductionModal = false">Cancel</button>
        <button class="btn-primary" @click="saveEditedReduction" :disabled="savingEdit">
          <span v-if="savingEdit" class="spinner-small"></span><span v-else>Save Changes</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
  <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="showDeleteConfirmModal = false">
    <div class="modal-container delete-confirm-modal">
      <div class="modal-header">
        <h3>Confirm Delete</h3>
        <button class="modal-close" @click="showDeleteConfirmModal = false">✕</button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete this reduction?</p>
        <p><strong>Type:</strong> {{ deletingReduction?.type }}</p>
        <p><strong>Amount:</strong> {{ deletingReduction?.amount }} {{ deletingReduction?.isPercent ? '%' : 'ETB' }}</p>
        <p><strong>Reason:</strong> {{ deletingReduction?.reason }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="showDeleteConfirmModal = false">Cancel</button>
        <button class="btn-danger" @click="confirmDeleteReduction" :disabled="deleting">
          <span v-if="deleting" class="spinner-small"></span><span v-else>Delete</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== IMPORT MODAL ==================== -->
  <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
    <div class="modal-container import-modal">
      <div class="modal-header">
        <h3>Import Penalty Reductions</h3>
        <button class="modal-close" @click="closeImportModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="info-banner">
          <span>ℹ️</span>
          <div>
            <strong>Instructions:</strong><br>
            1. Export the current penalty summary first to get the template format<br>
            2. Edit the exported CSV file (modify the reduction amounts)<br>
            3. Import the edited file back<br>
            <strong>Required columns:</strong> Employee Code, Employee Name, Department, Penalty %, Asset Penalty (ETB), Other Penalty (ETB)
          </div>
        </div>
        <div class="form-field">
          <label>Select CSV File to Import</label>
          <input type="file" ref="fileInput" accept=".csv" @change="handleFileUpload" class="file-input" />
          <div class="input-hint">Only CSV files are accepted. Maximum size: 5MB</div>
        </div>
        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>Preview ({{ importPreview.length }} records)</h4>
          <div class="preview-table-container">
            <table class="preview-table">
              <thead><tr><th>Employee Code</th><th>Employee Name</th><th>Department</th><th>Penalty %</th><th>Asset Penalty</th><th>Other Penalty</th></tr></thead>
              <tbody>
                <tr v-for="(item, idx) in importPreview.slice(0, 5)" :key="idx">
                  <td>{{ item.employeeCode }}</td><td>{{ item.employeeName }}</td><td>{{ item.department }}</td><td>{{ item.percentPenalty }}%</td>
                  <td>{{ formatCurrency(item.assetPenalty) }}</td><td>{{ formatCurrency(item.otherPenalty) }}</td>
                </tr>
                <tr v-if="importPreview.length > 5"><td colspan="6" class="preview-more">... and {{ importPreview.length - 5 }} more records</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="importErrors.length > 0" class="import-errors">
          <h4>Errors ({{ importErrors.length }})</h4>
          <div class="errors-list"><div v-for="(error, idx) in importErrors" :key="idx" class="error-item">{{ error }}</div></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeImportModal">Cancel</button>
        <button class="btn-primary" @click="confirmImport" :disabled="importing || importPreview.length === 0">
          <span v-if="importing" class="spinner-small"></span><span v-else>Import {{ importPreview.length }} Records</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div v-if="showToast" class="toast" :class="toastType"><span>{{ toastMessage }}</span></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import payrollService from "@/stores/payrollService";
import penaltySummaryService from "@/stores/penaltySummaryService";

const departments = ["IT", "Finance", "Operations", "HR"];

// State
const penaltiesList = ref([]);
const loading = ref(false);
const reductionHistory = ref([]);
const penaltyDateFrom = ref("");
const penaltyDateTo = ref("");
const applyingReduction = ref(false);
const penaltySearch = ref("");
const penaltyDeptFilter = ref("all");
const penaltyPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const showPenaltyReductionModal = ref(false);
const showPenaltyDetailModal = ref(false);
const showEditReductionModal = ref(false);
const showDeleteConfirmModal = ref(false);
const showImportModal = ref(false);
const selectedPenaltyEmployee = ref(null);
const selectedDetailEmployee = ref(null);
const penaltyPercentReduction = ref(0);
const penaltyOtherReduction = ref(0);
const penaltyAssetReduction = ref(0);
const penaltyReductionReason = ref("");
const editingReduction = ref(null);
const editingReductionIndex = ref(-1);
const editingReductionAmount = ref(0);
const editingReductionReason = ref("");
const deletingReduction = ref(null);
const deletingReductionIndex = ref(-1);
const savingEdit = ref(false);
const deleting = ref(false);
const exportingPenalty = ref(false);
const importing = ref(false);
const importPreview = ref([]);
const importErrors = ref([]);
const fileInput = ref(null);
const isCurrentMonth = ref(false);
const isLastMonth = ref(false);
const isNextMonth = ref(false);
let searchTimeout = null;

// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// Computed
const dateRangeLabel = computed(() => {
  if (penaltyDateFrom.value && penaltyDateTo.value) return `${formatDate(penaltyDateFrom.value)} - ${formatDate(penaltyDateTo.value)}`;
  if (penaltyDateFrom.value) return `From ${formatDate(penaltyDateFrom.value)}`;
  if (penaltyDateTo.value) return `Until ${formatDate(penaltyDateTo.value)}`;
  return "All Time";
});

const filteredPenaltiesList = computed(() => penaltiesList.value);
const paginatedPenaltiesList = computed(() => {
  const start = (penaltyPagination.value.page - 1) * penaltyPagination.value.limit;
  return filteredPenaltiesList.value.slice(start, start + penaltyPagination.value.limit);
});
const penaltiesTotalAmount = computed(() => filteredPenaltiesList.value.reduce((sum, p) => sum + (p.totalPenaltyAmount || 0), 0));

// Helpers
function formatCurrency(amt) { return payrollService.formatCurrency(amt); }
function formatDate(d) { if (!d) return ''; return payrollService.formatDate(d); }
function getInitials(name) { if (!name) return "?"; return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
function showToastMessage(msg, type) { toastMessage.value = msg; toastType.value = type; showToast.value = true; setTimeout(() => { showToast.value = false; }, 3000); }
function downloadCSV(data, filename) { const csv = data.map(row => row.join(",")).join("\n"); const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function formatDateValue(date) { return date.toISOString().split('T')[0]; }
function clearMonthFilters() { isCurrentMonth.value = false; isLastMonth.value = false; isNextMonth.value = false; }

// Status Functions
function getStatusText(penalty) {
  const hasPercent = penalty.percentPenalty > 0, hasAsset = penalty.assetPenalty > 0, hasOther = penalty.otherPenalty > 0;
  if (!hasPercent && !hasAsset && !hasOther) return "No Penalties";
  const statuses = [];
  if (hasPercent) statuses.push("Has %");
  if (hasAsset) statuses.push("Has Asset");
  if (hasOther) statuses.push("Has Other");
  return statuses.join(", ");
}
function getStatusClass(penalty) { return (penalty.percentPenalty > 0 || penalty.assetPenalty > 0 || penalty.otherPenalty > 0) ? 'status-warning' : 'status-success'; }
function getDetailStatusText(type) { return "Active"; }
function getDetailStatusClass(type) { return 'status-active'; }

// Month Filters
function setMonthFilter(type) {
  const now = new Date();
  let startDate, endDate;
  if (type === 'current') { startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); isCurrentMonth.value = true; isLastMonth.value = false; isNextMonth.value = false; }
  else if (type === 'last') { startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); endDate = new Date(now.getFullYear(), now.getMonth(), 0); isCurrentMonth.value = false; isLastMonth.value = true; isNextMonth.value = false; }
  else if (type === 'next') { startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); isCurrentMonth.value = false; isLastMonth.value = false; isNextMonth.value = true; }
  penaltyDateFrom.value = formatDateValue(startDate);
  penaltyDateTo.value = formatDateValue(endDate);
  loadPenaltyData();
}

// Load Data
async function loadPenaltyData() {
  loading.value = true;
  penaltyPagination.value.page = 1;
  try {
    const response = await penaltySummaryService.getPenaltySummary({
      fromDate: penaltyDateFrom.value || undefined,
      toDate: penaltyDateTo.value || undefined,
      department: penaltyDeptFilter.value !== 'all' ? penaltyDeptFilter.value : undefined,
      search: penaltySearch.value || undefined,
      page: penaltyPagination.value.page,
      limit: penaltyPagination.value.limit
    });
    if (response.success && response.data) {
      penaltiesList.value = response.data.map(item => ({
        id: item.id, employeeId: item.id, employeeCode: item.employeeCode, employeeName: item.employeeName,
        department: item.department, percentPenalty: item.percentPenalty || 0, assetPenalty: item.assetPenalty || 0,
        otherPenalty: item.otherPenalty || 0, totalPenaltyAmount: item.totalPenalty || 0,
        summary: item.summary || { percent: { original: 0, deducted: 0, current: 0, status: 'active' }, asset: { original: 0, deducted: 0, current: 0, status: 'active' }, other: { original: 0, deducted: 0, current: 0, status: 'active' } }
      }));
      penaltyPagination.value.total = response.pagination?.total || 0;
      penaltyPagination.value.totalPages = response.pagination?.totalPages || 1;
    } else { penaltiesList.value = []; }
  } catch (error) { console.error("Load penalty data error:", error); penaltiesList.value = []; } 
  finally { loading.value = false; }
}

function debouncedSearch() { if (searchTimeout) clearTimeout(searchTimeout); searchTimeout = setTimeout(() => loadPenaltyData(), 500); }
function onDateRangeChange() { clearMonthFilters(); loadPenaltyData(); }
function clearDateRange() { penaltyDateFrom.value = ""; penaltyDateTo.value = ""; clearMonthFilters(); loadPenaltyData(); }

// Detail Modal
async function openPenaltyDetailModal(penalty) {
  selectedDetailEmployee.value = penalty;
  try {
    const response = await penaltySummaryService.getReductionHistory(penalty.id, { fromDate: penaltyDateFrom.value, toDate: penaltyDateTo.value });
    if (response.success && response.data) {
      reductionHistory.value = response.data.map(item => ({ id: item.id, type: item.type, amount: item.amount, isPercent: item.isPercent, reason: item.reason, processedBy: item.processedBy, date: item.date }));
    } else { reductionHistory.value = []; }
  } catch (error) { console.error("Load history error:", error); reductionHistory.value = []; }
  showPenaltyDetailModal.value = true;
}

// Reduction Functions
function openPenaltyReductionModal(penalty) { selectedPenaltyEmployee.value = { ...penalty }; penaltyPercentReduction.value = 0; penaltyOtherReduction.value = 0; penaltyAssetReduction.value = 0; penaltyReductionReason.value = ""; showPenaltyReductionModal.value = true; }
function validatePercentReduction() { const max = selectedPenaltyEmployee.value?.percentPenalty || 0; if (penaltyPercentReduction.value > max) penaltyPercentReduction.value = max; if (penaltyPercentReduction.value < 0) penaltyPercentReduction.value = 0; }
function validateOtherReduction() { const max = selectedPenaltyEmployee.value?.otherPenalty || 0; if (penaltyOtherReduction.value > max) penaltyOtherReduction.value = max; if (penaltyOtherReduction.value < 0) penaltyOtherReduction.value = 0; }
function validateAssetReduction() { const max = selectedPenaltyEmployee.value?.assetPenalty || 0; if (penaltyAssetReduction.value > max) penaltyAssetReduction.value = max; if (penaltyAssetReduction.value < 0) penaltyAssetReduction.value = 0; }

async function applyPenaltyReductionToEmployee() {
  if (!selectedPenaltyEmployee.value) return;
  const percentReduction = penaltyPercentReduction.value, otherReduction = penaltyOtherReduction.value, assetReduction = penaltyAssetReduction.value;
  if (percentReduction === 0 && otherReduction === 0 && assetReduction === 0) { showToastMessage("No reduction values entered", "error"); return; }
  const employeeId = selectedPenaltyEmployee.value.id || selectedPenaltyEmployee.value.employeeId;
  if (!employeeId) { showToastMessage("Employee ID not found", "error"); return; }
  if (!penaltyReductionReason.value.trim()) { showToastMessage("Please provide a reason for the reduction", "error"); return; }
  applyingReduction.value = true;
  try {
    const results = [], errors = [];
    if (percentReduction > 0) {
      const resp = await penaltySummaryService.applyPenaltyReduction(employeeId, { deductionPercentage: percentReduction, reason: penaltyReductionReason.value, processedBy: "HR Admin", periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `RED-${Date.now()}-${employeeId}-percent` });
      if (resp.success) results.push(`% reduced by ${percentReduction}%`); else errors.push(`Percent: ${resp.error}`);
    }
    if (otherReduction > 0) {
      const resp = await penaltySummaryService.applyPenaltyReduction(employeeId, { deductionAmount: otherReduction, penaltyType: 'other', reason: penaltyReductionReason.value, processedBy: "HR Admin", periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `RED-${Date.now()}-${employeeId}-other` });
      if (resp.success) results.push(`Other reduced by ${formatCurrency(otherReduction)}`); else errors.push(`Other: ${resp.error}`);
    }
    if (assetReduction > 0) {
      const resp = await penaltySummaryService.applyPenaltyReduction(employeeId, { deductionAmount: assetReduction, penaltyType: 'asset', reason: penaltyReductionReason.value, processedBy: "HR Admin", periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `RED-${Date.now()}-${employeeId}-asset` });
      if (resp.success) results.push(`Asset reduced by ${formatCurrency(assetReduction)}`); else errors.push(`Asset: ${resp.error}`);
    }
    if (results.length > 0) { showToastMessage(`Penalty reduced for ${selectedPenaltyEmployee.value.employeeName}: ${results.join(", ")}`, errors.length > 0 ? "warning" : "success"); showPenaltyReductionModal.value = false; await loadPenaltyData(); } 
    else { showToastMessage("No reductions were applied", "error"); }
  } catch (error) { console.error("Apply reduction error:", error); showToastMessage("Failed to apply reduction", "error"); } 
  finally { applyingReduction.value = false; }
}

// Edit/Delete Reduction Functions
function editReduction(record, index) { editingReduction.value = { ...record }; editingReductionIndex.value = index; editingReductionAmount.value = record.amount; editingReductionReason.value = record.reason; showEditReductionModal.value = true; }
function deleteReduction(record, index) { deletingReduction.value = record; deletingReductionIndex.value = index; showDeleteConfirmModal.value = true; }

async function saveEditedReduction() {
  if (editingReductionAmount.value <= 0) { showToastMessage("Reduction amount must be greater than 0", "error"); return; }
  savingEdit.value = true;
  try {
    const response = await penaltySummaryService.updateReduction(selectedDetailEmployee.value.id, editingReduction.value.id, { amount: editingReductionAmount.value, reason: editingReductionReason.value, type: editingReduction.value.type });
    if (response.success) { showToastMessage("Reduction updated successfully!", "success"); showEditReductionModal.value = false; await openPenaltyDetailModal(selectedDetailEmployee.value); await loadPenaltyData(); } 
    else { showToastMessage(response.error || "Failed to update reduction", "error"); }
  } catch (error) { console.error("Update reduction error:", error); showToastMessage("Failed to update reduction", "error"); } 
  finally { savingEdit.value = false; }
}

async function confirmDeleteReduction() {
  deleting.value = true;
  try {
    const response = await penaltySummaryService.deleteReduction(selectedDetailEmployee.value.id, deletingReduction.value.id);
    if (response.success) { showToastMessage("Reduction deleted successfully!", "success"); showDeleteConfirmModal.value = false; await openPenaltyDetailModal(selectedDetailEmployee.value); await loadPenaltyData(); } 
    else { showToastMessage(response.error || "Failed to delete reduction", "error"); }
  } catch (error) { console.error("Delete reduction error:", error); showToastMessage("Failed to delete reduction", "error"); } 
  finally { deleting.value = false; }
}

// Import Functions
function openImportModal() { showImportModal.value = true; importPreview.value = []; importErrors.value = []; if (fileInput.value) fileInput.value.value = ''; }
function closeImportModal() { showImportModal.value = false; importPreview.value = []; importErrors.value = []; }

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) { showToastMessage('Please upload a CSV file', 'error'); return; }
  if (file.size > 5 * 1024 * 1024) { showToastMessage('File size must be less than 5MB', 'error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => { parseCSVAndPreview(e.target.result); };
  reader.readAsText(file);
}

function parseCSVAndPreview(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const expectedHeaders = ['Employee Code', 'Employee Name', 'Department', 'Penalty %', 'Asset Penalty (ETB)', 'Other Penalty (ETB)'];
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) { showToastMessage(`Missing columns: ${missingHeaders.join(', ')}`, 'error'); return; }
  const preview = [], errors = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    if (values.length < headers.length) continue;
    const employeeCode = values[headers.indexOf('Employee Code')];
    const employeeName = values[headers.indexOf('Employee Name')];
    const department = values[headers.indexOf('Department')];
    const percentPenalty = parseFloat(values[headers.indexOf('Penalty %')]) || 0;
    const assetPenalty = parseFloat(values[headers.indexOf('Asset Penalty (ETB)')]) || 0;
    const otherPenalty = parseFloat(values[headers.indexOf('Other Penalty (ETB)')]) || 0;
    if (!employeeCode) { errors.push(`Row ${i}: Missing employee code`); continue; }
    const employee = penaltiesList.value.find(e => e.employeeCode === employeeCode);
    if (!employee) { errors.push(`Row ${i}: Employee ${employeeCode} not found`); continue; }
    preview.push({ row: i, employeeId: employee.id, employeeCode, employeeName, department, percentPenalty, assetPenalty, otherPenalty, originalPercent: employee.percentPenalty, originalAsset: employee.assetPenalty, originalOther: employee.otherPenalty });
  }
  if (errors.length > 0) importErrors.value = errors;
  importPreview.value = preview;
  if (preview.length === 0 && errors.length === 0) showToastMessage('No valid records found in the file', 'error');
  else if (preview.length > 0) showToastMessage(`Loaded ${preview.length} records for preview`, 'success');
}

async function confirmImport() {
  if (importPreview.value.length === 0) { showToastMessage('No records to import', 'error'); return; }
  importing.value = true;
  let successCount = 0, errorCount = 0;
  try {
    for (const record of importPreview.value) {
      const percentReduction = record.originalPercent - record.percentPenalty;
      const assetReduction = record.originalAsset - record.assetPenalty;
      const otherReduction = record.originalOther - record.otherPenalty;
      if (percentReduction > 0) {
        const resp = await penaltySummaryService.applyPenaltyReduction(record.employeeId, { deductionPercentage: percentReduction, reason: 'Bulk import from CSV', processedBy: 'HR Admin', periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `IMPORT-${Date.now()}-${record.employeeCode}-percent` });
        if (resp.success) successCount++; else errorCount++;
      }
      if (assetReduction > 0) {
        const resp = await penaltySummaryService.applyPenaltyReduction(record.employeeId, { deductionAmount: assetReduction, penaltyType: 'asset', reason: 'Bulk import from CSV', processedBy: 'HR Admin', periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `IMPORT-${Date.now()}-${record.employeeCode}-asset` });
        if (resp.success) successCount++; else errorCount++;
      }
      if (otherReduction > 0) {
        const resp = await penaltySummaryService.applyPenaltyReduction(record.employeeId, { deductionAmount: otherReduction, penaltyType: 'other', reason: 'Bulk import from CSV', processedBy: 'HR Admin', periodStartDate: penaltyDateFrom.value, periodEndDate: penaltyDateTo.value, reference: `IMPORT-${Date.now()}-${record.employeeCode}-other` });
        if (resp.success) successCount++; else errorCount++;
      }
    }
    showToastMessage(`Import completed: ${successCount} reductions applied, ${errorCount} failed`, errorCount > 0 ? 'warning' : 'success');
    closeImportModal();
    await loadPenaltyData();
  } catch (error) { console.error('Import error:', error); showToastMessage('Failed to process import', 'error'); } 
  finally { importing.value = false; }
}

// Export Function
async function exportPenaltySummary() {
  exportingPenalty.value = true;
  try {
    const headers = ["Employee Code", "Employee Name", "Department", "Penalty %", "Asset Penalty (ETB)", "Other Penalty (ETB)"];
    const rows = filteredPenaltiesList.value.map(p => [p.employeeCode, p.employeeName, p.department, p.percentPenalty || 0, p.assetPenalty || 0, p.otherPenalty || 0]);
    rows.push(["", "", "TOTAL", "", penaltiesTotalAmount.value, ""]);
    downloadCSV([headers, ...rows], `penalty_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    showToastMessage("Penalty summary exported!", "success");
  } catch (error) { showToastMessage("Failed to export penalty summary", "error"); } 
  finally { exportingPenalty.value = false; }
}

// Pagination
function changePenaltyPage(page) { penaltyPagination.value.page = page; loadPenaltyData(); }
function changePenaltyLimit() { penaltyPagination.value.page = 1; penaltyPagination.value.limit = parseInt(penaltyPagination.value.limit); loadPenaltyData(); }

// Refresh Handler
function handleRefreshAllTabs() { loadPenaltyData(); }

// Init
function init() {
  const now = new Date();
  penaltyDateFrom.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  penaltyDateTo.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  isCurrentMonth.value = true;
  loadPenaltyData();
}

onMounted(() => { init(); window.addEventListener('refresh-all-tabs', handleRefreshAllTabs); });
onUnmounted(() => { window.removeEventListener('refresh-all-tabs', handleRefreshAllTabs); if (searchTimeout) clearTimeout(searchTimeout); });
</script>


<style scoped>
/* Add these new styles to your existing CSS */
/* History Action Buttons */
.history-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.history-edit-btn,
.history-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.history-edit-btn:hover {
  background: #dbeafe;
}

.history-delete-btn:hover {
  background: #fee2e2;
}

/* Delete Confirmation Modal */
.delete-confirm-modal {
  max-width: 400px;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Edit Reduction Modal */
.edit-reduction-modal {
  max-width: 450px;
}
.status-fully-deducted {
  background: #fee2e2;
  color: #dc2626;
}
.detail-card-sub {
  font-size: 10px;
  color: #64748b;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-partially-deducted {
  background: #fef3c7;
  color: #d97706;
}

.status-active {
  background: #d1fae5;
  color: #059669;
}
/* Quick Month Filters */
.quick-months {
  display: flex;
  gap: 6px;
  align-items: center;
}

.quick-month-btn {
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  color: #475569;
  transition: all 0.2s;
}

.quick-month-btn:hover {
  background: #e2e8f0;
}

.quick-month-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-warning {
  background: #fef3c7;
  color: #d97706;
}

.status-success {
  background: #d1fae5;
  color: #059669;
}

/* Employee Avatar */
.employee-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-right: 10px;
}

.employee-cell {
  display: flex;
  align-items: center;
}

.employee-info {
  flex: 1;
}

/* Detail Modal Styles */
.penalty-detail-modal {
  max-width: 600px;
}

.detail-summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card-small {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.detail-card-small.percent {
  border-top: 3px solid #f59e0b;
}

.detail-card-small.asset {
  border-top: 3px solid #3b82f6;
}

.detail-card-small.other {
  border-top: 3px solid #8b5cf6;
}

.detail-card-title {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 8px;
}

.detail-card-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.detail-card-status {
  font-size: 10px;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.status-active {
  background: #d1fae5;
  color: #059669;
}

/* Reduction History */
.reduction-history {
  margin-top: 20px;
}

.reduction-history h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e293b;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
}

.history-date {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.history-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.history-type {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.history-amount {
  font-weight: 700;
  color: #dc2626;
}

.history-reason {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.history-by {
  font-size: 10px;
  color: #94a3b8;
}

.no-history {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

/* Button Styles */
.btn-small.info {
  background: #64748b;
  margin-left: 6px;
}

.btn-small.info:hover {
  background: #475569;
}

/* ==================== SECTION CARD ==================== */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

/* ==================== FILTERS ==================== */
.header-filters,
.filters-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  width: 220px;
  background: #f8fafc;
  transition: all 0.2s;
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

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

/* Date Range Filter */
.date-range-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.date-input {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  background: white;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-clear-dates {
  padding: 4px 8px;
  background: #fee2e2;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  color: #dc2626;
  transition: all 0.2s;
}

.btn-clear-dates:hover {
  background: #fecaca;
}

/* ==================== BUTTONS ==================== */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-small {
  padding: 4px 12px;
  font-size: 11px;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
}

.btn-small.primary {
  background: #3b82f6;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==================== TABLE ==================== */
.table-container {
  overflow-x: auto;
}

.payroll-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

.payroll-table th,
.payroll-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.payroll-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.employee-cell .employee-code {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.percent-cell,
.asset-cell,
.other-cell {
  vertical-align: top;
}

.penalty-wrapper {
  display: inline-block;
  text-align: right;
}

.penalty-items-list {
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed #e2e8f0;
}

.penalty-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 10px;
  padding: 2px 0;
}

.penalty-name {
  color: #475569;
}

.penalty-amount {
  font-weight: 500;
  color: #1e293b;
}

.more-items {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 10px;
  background: #e2e8f0;
  color: #64748b;
  display: inline-block;
  margin-top: 4px;
}

.has-asset-penalty {
  background-color: #f8fafc;
}

/* ==================== TEXT COLORS ==================== */
.text-orange {
  color: #f59e0b;
}

.text-blue {
  color: #3b82f6;
}

.text-purple {
  color: #8b5cf6;
}

.text-red {
  color: #ef4444;
}

.text-green {
  color: #10b981;
}

/* ==================== PAGINATION ==================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
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
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

/* ==================== MODALS ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.batch-penalty-config-modal {
  max-width: 900px;
}

.penalty-reduction-modal {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.modal-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1e293b;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* Current Penalty Info */
.current-penalty-info {
  background: #fef2f2;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

/* Form Elements */
.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1e293b;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
}

.input-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.input-hint.text-red {
  color: #ef4444;
}

/* Batch Penalty Rules Section */
.rules-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.section-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.section-unit {
  font-size: 12px;
  color: #64748b;
}

.rules-table {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
}

.rules-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f1f5f9;
  border-radius: 8px;
}

.rule-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 10px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.rule-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.rule-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.range-input {
  width: 110px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  transition: all 0.2s;
}

.range-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.range-sep {
  color: #94a3b8;
  font-weight: 500;
}

.range-unit {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}

.rule-arrow {
  color: #3b82f6;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.rule-reduction {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.reduction-input {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}

.reduction-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.reduction-unit {
  font-size: 12px;
  color: #64748b;
}

.remove-rule-btn {
  background: #fee2e2;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: #dc2626;
  transition: all 0.2s;
  font-weight: 500;
}

.remove-rule-btn:hover {
  background: #fecaca;
}

.add-rule-btn {
  width: 100%;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #3b82f6;
  transition: all 0.2s;
  font-weight: 500;
}

.add-rule-btn:hover {
  background: #e2e8f0;
  border-color: #3b82f6;
}

/* Info Banner */
.info-banner {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

/* Preview Summary */
.preview-summary {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
  border-radius: 12px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #1e40af;
}

/* Empty State */
.empty-state-cell {
  text-align: center;
  padding: 60px 20px;
}

.empty-state-content {
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-content p {
  color: #94a3b8;
  margin: 0;
}

.empty-sub {
  font-size: 12px;
  margin-top: 8px;
  color: #cbd5e1;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
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

/* Responsive */
@media (max-width: 900px) {
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range-filter {
    justify-content: center;
  }
  
  .rules-header,
  .rule-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .rule-arrow {
    transform: rotate(90deg);
  }
  
  .batch-penalty-config-modal {
    max-width: 95%;
  }
}

@media (max-width: 600px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-filters {
    flex-direction: column;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .date-range-filter {
    flex-wrap: wrap;
  }
  
  .preview-summary {
    flex-direction: column;
    gap: 12px;
  }
}
</style>


