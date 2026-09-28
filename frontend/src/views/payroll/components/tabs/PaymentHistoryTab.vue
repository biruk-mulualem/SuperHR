<template>
  <div class="section-card">
    <div class="card-header">
      <h2>Payment History</h2>
      <div class="header-filters">
        <div class="search-box">
          <input
            type="text"
            v-model="search"
            placeholder="Search employee..."
            @input="onSearchChange"
          />
        </div>
        
        <select v-model="monthFilter" class="filter-select" @change="onFilterChange">
          <option value="">All Months</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        
        <select v-model="yearFilter" class="filter-select" @change="onFilterChange">
          <option value="">All Years</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        
        <select v-model="deptFilter" class="filter-select" @change="onFilterChange">
          <option value="all">All Departments</option>
          <option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
        
        <select v-model="sourceFilter" class="filter-select" @change="onFilterChange">
          <option value="all">All Sources</option>
          <option value="normal">Normal Payroll</option>
          <option value="unclaimed">From Unclaimed</option>
          <option value="returned">From Returned</option>
        </select>
        
        <button class="btn-export" @click="exportHistory" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="payroll-table">
        <thead>
          <tr>
            <th>Payment Date</th>
            <th>Payroll Month</th>
            <th>Employee</th>
            <th>Dept</th>
            <th class="text-right">Amount</th>
            <th>Processed By</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in paginatedHistory" :key="payment.history_id">
            <td class="text-center">{{ formatDate(payment.payment_date) }}</td>
            <td class="text-center">{{ formatMonth(payment.month) }}</td>
            <td class="employee-cell">
              <strong>{{ payment.employee_name }}</strong>
              <div class="employee-code">{{ payment.employee_code }}</div>
            </td>
            <td class="text-center">{{ payment.department }}</td>
            <td class="text-right">{{ formatCurrency(parseFloat(payment.amount)) }}</td>
            <td class="text-center">{{ payment.processed_by || 'System' }}</td>
            <td class="text-center">
              <span class="status-completed">✓ Completed</span>
            </td>
            <td class="text-center notes-cell">
              <div v-if="payment.notes" class="notes-tooltip notes-tooltip-left">
                <span class="note-icon">📝</span>
                <span class="note-text">{{ payment.notes }}</span>
              </div>
              <span v-else class="no-notes">—</span>
            </td>
          </tr>
          
          <tr v-if="filteredHistory.length === 0">
            <td colspan="8" class="empty-state-cell">
              <div class="empty-state-content">
                <div class="empty-icon">📭</div>
                <p>No payment records found</p>
              </div>
            </td>
           </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="pagination.totalPages > 1">
      <button class="page-btn" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
      <button class="page-btn" :disabled="pagination.page === pagination.totalPages" @click="changePage(pagination.page + 1)">
        Next →
      </button>
      <select v-model="pagination.limit" @change="changeLimit" class="limit-select">
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import payrollService from "@/stores/payrollService";

const props = defineProps({
  paymentHistory: {
    type: Array,
    default: () => []
  },
  departments: {
    type: Array,
    default: () => ['IT', 'Finance', 'Operations', 'HR']
  }
});

const emit = defineEmits(['update:history', 'export']);

// ==================== STATE ====================
const search = ref("");
const monthFilter = ref("");
const yearFilter = ref("");
const deptFilter = ref("all");
const sourceFilter = ref("all");
const exporting = ref(false);
const loading = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const paymentHistoryData = ref([]);

// ==================== COMPUTED ====================

const availableYears = computed(() => {
  const years = [...new Set(paymentHistoryData.value.map(p => p.month?.split('-')[0]).filter(Boolean))];
  return years.sort((a, b) => b - a);
});

const filteredHistory = computed(() => {
  let data = [...paymentHistoryData.value];
  
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    data = data.filter(e => 
      e.employee_name?.toLowerCase().includes(searchLower) || 
      e.employee_code?.toLowerCase().includes(searchLower)
    );
  }
  if (monthFilter.value) {
    data = data.filter(e => e.month?.split('-')[1] === monthFilter.value);
  }
  if (yearFilter.value) {
    data = data.filter(e => e.month?.startsWith(yearFilter.value));
  }
  if (deptFilter.value !== "all") {
    data = data.filter(e => e.department === deptFilter.value);
  }
  if (sourceFilter.value !== "all") {
    data = data.filter(e => e.source === sourceFilter.value);
  }
  
  pagination.value.total = data.length;
  pagination.value.totalPages = Math.ceil(data.length / pagination.value.limit) || 1;
  
  // Reset to first page if current page is out of range
  if (pagination.value.page > pagination.value.totalPages) {
    pagination.value.page = 1;
  }
  
  return data;
});

const paginatedHistory = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.limit;
  const end = start + pagination.value.limit;
  return filteredHistory.value.slice(start, end);
});

// ==================== METHODS ====================
function formatCurrency(amt) {
  return payrollService.formatCurrency(amt);
}

function formatDate(d) {
  return payrollService.formatDate(d);
}

function formatMonth(m) {
  return payrollService.formatMonth(m);
}

function changePage(page) { 
  pagination.value.page = page; 
}

function changeLimit() { 
  pagination.value.page = 1; 
  pagination.value.limit = parseInt(pagination.value.limit); 
}

function onSearchChange() { 
  pagination.value.page = 1; 
}

function onFilterChange() { 
  pagination.value.page = 1; 
}

// ==================== LOAD DATA FROM API ====================
async function loadPaymentHistory() {
  loading.value = true;
  try {
    // Fetch payment history from API
    const response = await payrollService.getPaymentHistory();
    
    if (response.success && response.data) {
      paymentHistoryData.value = response.data;
    } else if (props.paymentHistory && props.paymentHistory.length > 0) {
      // Fallback to props if API fails
      paymentHistoryData.value = props.paymentHistory;
    } else {
      // Fallback to empty array
      paymentHistoryData.value = [];
    }
  } catch (error) {
    console.error('Error loading payment history:', error);
    // Fallback to props
    if (props.paymentHistory && props.paymentHistory.length > 0) {
      paymentHistoryData.value = props.paymentHistory;
    } else {
      paymentHistoryData.value = [];
    }
  } finally {
    loading.value = false;
  }
}

// ==================== EXPORT ====================
async function exportHistory() {
  exporting.value = true;
  try {
    const headers = ["Payment Date", "Payroll Month", "Employee Code", "Employee Name", "Department", "Amount (ETB)", "Processed By", "Status", "Source", "Notes"];
    const rows = filteredHistory.value.map(p => [
      p.payment_date, 
      p.month, 
      p.employee_code, 
      p.employee_name, 
      p.department, 
      parseFloat(p.amount), 
      p.processed_by || "System", 
      "Completed", 
      p.source || "normal", 
      p.notes || ""
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_history_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    emit('export', { success: true, count: filteredHistory.value.length });
  } catch (error) {
    console.error('Export error:', error);
    emit('export', { success: false, error: error.message });
  } finally {
    exporting.value = false;
  }
}

// ==================== WATCH PROPS ====================
watch(() => props.paymentHistory, (newVal) => {
  if (newVal && newVal.length > 0 && paymentHistoryData.value.length === 0) {
    paymentHistoryData.value = newVal;
  }
}, { deep: true });

// ==================== REFRESH HANDLER ====================
function handleRefreshAllTabs() {
  loadPaymentHistory();
}

// ==================== INITIALIZATION ====================
onMounted(() => {
  loadPaymentHistory();
  window.addEventListener('refresh-all-tabs', handleRefreshAllTabs);
});

// Cleanup
import { onUnmounted } from 'vue';
onUnmounted(() => {
  window.removeEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
</script>

<style scoped>
/* All styles remain exactly the same */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
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

.header-filters {
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
  width: 180px;
  background: #f8fafc;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
  min-width: 120px;
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
  white-space: nowrap;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.payroll-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 900px;
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

.status-completed {
  color: #10b981;
  font-weight: 500;
}

.notes-cell {
  text-align: center;
  width: 50px;
}

.notes-tooltip {
  position: relative;
  display: inline-block;
  cursor: help;
}

/* Left-side tooltip */
.notes-tooltip-left .note-text {
  right: 100%;
  bottom: 50%;
  left: auto;
  transform: translateY(50%) translateX(-8px);
}

.notes-tooltip-left .note-text::after {
  top: 50%;
  right: -6px;
  left: auto;
  bottom: auto;
  transform: translateY(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent transparent #1e293b;
}

.notes-tooltip .note-icon {
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.notes-tooltip:hover .note-icon {
  opacity: 1;
}

.notes-tooltip .note-text {
  visibility: hidden;
  background-color: #1e293b;
  color: #fff;
  text-align: left;
  border-radius: 8px;
  padding: 10px 14px;
  position: absolute;
  z-index: 1000;
  white-space: normal;
  word-break: break-word;
  min-width: 250px;
  max-width: 350px;
  font-size: 12px;
  line-height: 1.5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.notes-tooltip:hover .note-text {
  visibility: visible;
  opacity: 1;
}

.no-notes {
  color: #cbd5e1;
  font-size: 12px;
}

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
  to { transform: rotate(360deg); }
}
</style>