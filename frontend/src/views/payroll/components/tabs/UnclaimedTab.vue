<template>
  <div class="section-card">
     <div v-if="message.show" class="toast-message" :class="message.type">
      <span class="toast-icon">{{ message.type === 'success' ? '✓' : '⚠️' }}</span>
      <span class="toast-text">{{ message.text }}</span>
    </div>
    <div class="card-header">
      <h2>Unclaimed Salary</h2>
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
        
        <div class="days-filter-wrapper">
          <input
            type="number"
            v-model.number="overdueDaysThreshold"
            placeholder="overdue"
            class="days-input"
            min="0"
            @input="onFilterChange"
          />
          <span class="days-suffix">days+</span>
        </div>
        
        <button class="btn-export" @click="exportUnclaimed" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading unclaimed salaries...</p>
    </div>

    <!-- Bulk Actions Bar -->
    <div class="bulk-actions-bar" v-else-if="selectedUnclaimedIds.length > 0">
      <div class="selected-count">
        <span>✓ {{ selectedUnclaimedIds.length }} item(s) selected</span>
      </div>
      <div class="bulk-buttons">
        <button class="btn-warning" @click="openBulkReturnConfirmation" :disabled="movingToReturned">
          <span v-if="movingToReturned" class="spinner-small"></span>
          <span v-else>↩️</span>
          Return Selected
        </button>
        <button class="btn-secondary" @click="clearSelection">Clear</button>
      </div>
    </div>

    <div class="table-container" v-if="!loading">
      <table class="payroll-table">
        <thead>
          <tr>
            <th style="width: 35px">
              <input type="checkbox" @change="toggleSelectAll" v-model="selectAll" />
            </th>
            <th>Employee</th>
            <th>Dept</th>
            <th>Payroll Month</th>
            <th>Due Date</th>
            <th class="text-right">Amount</th>
            <th>Overdue Days</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedUnclaimed" :key="item.unclaimed_id" :class="{ 'overdue-critical': item.days_overdue > 60 }">
            <td class="text-center">
              <input type="checkbox" v-model="item.selected" @change="updateSelected" />
            </td>
            <td class="employee-cell">
              <strong>{{ item.employee_name }}</strong>
              <div class="employee-code">{{ item.employee_code }}</div>
            </td>
            <td class="text-center">{{ item.department }}</td>
            <td class="text-center">{{ formatMonth(item.month) }}</td>
            <td class="text-center">{{ formatDate(item.due_date) }}</td>
            <td class="text-right net">{{ formatCurrency(parseFloat(item.amount)) }}</td>
            <td class="text-center">
              <span class="overdue-badge" :class="getOverdueClass(item.days_overdue)">
                {{ item.days_overdue }} days
              </span>
            </td>
            <td class="text-center">
              <button class="btn-small pay" @click="openPayNowModal(item)" :disabled="processingPayment">
                Pay
              </button>
            </td>
          </tr>
          
          <tr v-if="filteredUnclaimed.length === 0">
            <td colspan="8" class="empty-state-cell">
              <div class="empty-state-content">
                <div class="empty-icon">✅</div>
                <p>No unclaimed salaries found</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="!loading && pagination.totalPages > 1">
      <button class="page-btn" :disabled="pagination.currentPage === 1" @click="changePage(pagination.currentPage - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
      <button class="page-btn" :disabled="pagination.currentPage === pagination.totalPages" @click="changePage(pagination.currentPage + 1)">
        Next →
      </button>
      <select v-model="pagination.recordsPerPage" @change="changeLimit" class="limit-select">
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
        <option :value="100">100 per page</option>
      </select>
    </div>

    <!-- Pay Now Confirmation Modal with Notes -->
    <div v-if="showPayNowModal" class="modal-overlay" @click.self="closePayNowModal">
      <div class="modal-container simple-modal">
        <div class="modal-header">
          <h3>Confirm Payment</h3>
          <button class="modal-close" @click="closePayNowModal">✕</button>
        </div>
        <div class="modal-body simple-body">
          <p>Are you sure you want to pay <strong>{{ selectedItem?.employee_name }}</strong>?</p>
          <p class="amount-text">Amount: {{ formatCurrency(parseFloat(selectedItem?.amount || 0)) }}</p>
          
          <div class="form-field">
            <label>Payment Method</label>
            <select v-model="paymentMethod" class="form-select">
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          
          <div class="form-field">
            <label>Payment Notes</label>
            <textarea 
              v-model="paymentNotes" 
              class="form-textarea-small" 
              rows="3" 
              placeholder="Add payment notes..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closePayNowModal">Cancel</button>
          <button class="btn-primary-pay" @click="confirmPayNow" :disabled="processingPayment">
            {{ processingPayment ? "Processing..." : "Confirm Payment" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Return Confirmation Modal -->
    <div v-if="showBulkReturnModal" class="modal-overlay" @click.self="closeBulkReturnModal">
      <div class="modal-container simple-modal">
        <div class="modal-header">
          <h3>Confirm Bulk Return</h3>
          <button class="modal-close" @click="closeBulkReturnModal">✕</button>
        </div>
        <div class="modal-body simple-body">
          <p>Are you sure you want to return <strong>{{ bulkReturnItems.length }}</strong> selected {{ bulkReturnItems.length === 1 ? 'salary' : 'salaries' }}?</p>
          <p class="amount-text">Total Amount: {{ formatCurrency(bulkReturnTotalAmount) }}</p>
          <div class="form-field">
            <textarea v-model="bulkReturnReason" class="form-textarea-small" rows="2" placeholder="Reason for return (optional)"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeBulkReturnModal">Cancel</button>
          <button class="btn-primary" @click="confirmBulkReturn" :disabled="movingToReturned">
            {{ movingToReturned ? "Processing..." : "Confirm Return" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import payrollService from "@/stores/payrollService";

// ==================== PROPS ====================
const props = defineProps({
  departments: {
    type: Array,
    default: () => []
  }
});

// ==================== EMITS ====================
const emit = defineEmits(['payment-processed', 'unclaimed-updated']);

// ==================== STATE ====================
const search = ref("");
const monthFilter = ref("");
const yearFilter = ref("");
const deptFilter = ref("all");
const overdueDaysThreshold = ref("");
const exporting = ref(false);
const movingToReturned = ref(false);
const processingPayment = ref(false);
const loading = ref(false);
const pagination = ref({ currentPage: 1, recordsPerPage: 10, totalRecords: 0, totalPages: 1 });

// Modal states
const showPayNowModal = ref(false);
const showBulkReturnModal = ref(false);

// Selected items
const selectedItem = ref(null);
const bulkReturnItems = ref([]);
const bulkReturnReason = ref("");
const paymentNotes = ref("");
const paymentMethod = ref("Bank Transfer");

// Selection state
const selectedUnclaimedIds = ref([]);
const selectAll = ref(false);

// Local data
const unclaimedList = ref([]);

// ==================== COMPUTED ====================

const availableYears = computed(() => {
  const years = [...new Set(unclaimedList.value.map(p => p.month?.split('-')[0]).filter(Boolean))];
  return years.sort((a, b) => b - a);
});

const filteredUnclaimed = computed(() => {
  let data = [...unclaimedList.value];
  
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
  if (overdueDaysThreshold.value && overdueDaysThreshold.value > 0) {
    data = data.filter(e => e.days_overdue >= overdueDaysThreshold.value);
  }
  
  return data;
});

const paginatedUnclaimed = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.recordsPerPage;
  const end = start + pagination.value.recordsPerPage;
  return filteredUnclaimed.value.slice(start, end);
});

const bulkReturnTotalAmount = computed(() => {
  return bulkReturnItems.value.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
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

function getOverdueClass(days) {
  if (days > 60) return 'critical';
  if (days > 30) return 'high';
  if (days > 14) return 'medium';
  if (days > 0) return 'low';
  return 'new';
}

function changePage(page) { 
  pagination.value.currentPage = page; 
  loadUnclaimedData();
}

function changeLimit() { 
  pagination.value.currentPage = 1; 
  loadUnclaimedData();
}

function onSearchChange() { 
  pagination.value.currentPage = 1; 
  loadUnclaimedData();
}

function onFilterChange() { 
  pagination.value.currentPage = 1; 
  loadUnclaimedData();
}

// ==================== API METHODS ====================
async function loadUnclaimedData() {
  loading.value = true;
  try {
    const response = await payrollService.getUnclaimedPayroll({
      page: pagination.value.currentPage,
      limit: pagination.value.recordsPerPage,
      month: monthFilter.value,
      year: yearFilter.value,
      department: deptFilter.value,
      search: search.value
    });
    
    if (response.success) {
      unclaimedList.value = response.data || [];
      if (response.pagination) {
        pagination.value = {
          currentPage: response.pagination.currentPage || 1,
          recordsPerPage: response.pagination.recordsPerPage || 10,
          totalRecords: response.pagination.totalRecords || 0,
          totalPages: response.pagination.totalPages || 1
        };
      }
      clearSelection();
    } else {
      console.error('Failed to load unclaimed data:', response.error);
      unclaimedList.value = [];
    }
  } catch (error) {
    console.error('Error loading unclaimed data:', error);
    unclaimedList.value = [];
  } finally {
    loading.value = false;
  }
}

// ==================== PAY NOW METHODS ====================
function openPayNowModal(item) {
  // Store a copy of the item to avoid reference issues
  selectedItem.value = { ...item };
  const overdueText = item.days_overdue > 0 
    ? `Payment processed after ${item.days_overdue} days of overdue. `
    : `Payment processed on time. `;
  paymentNotes.value = overdueText + `Amount: ${formatCurrency(parseFloat(item.amount))} - ${item.employee_name} (${item.employee_code})`;
  paymentMethod.value = "Bank Transfer";
  showPayNowModal.value = true;
}

function closePayNowModal() {
  showPayNowModal.value = false;
  // Don't set selectedItem to null immediately, wait for modal to close
  setTimeout(() => {
    selectedItem.value = null;
    paymentNotes.value = "";
    paymentMethod.value = "Bank Transfer";
  }, 300);
}

async function confirmPayNow() {
  // Check if selectedItem exists before proceeding
  if (!selectedItem.value) {
    console.error('No item selected for payment');
    closePayNowModal();
    return;
  }

  processingPayment.value = true;
  
  // Store the selected item data before closing modal
  const itemToPay = { ...selectedItem.value };
  const amount = parseFloat(itemToPay.amount || 0);
  const employeeName = itemToPay.employee_name || 'Unknown';
  const unclaimedId = itemToPay.unclaimed_id;
  
  try {
    const response = await payrollService.payUnclaimedSalary(unclaimedId, {
      paymentDate: new Date().toISOString().split('T')[0],
      method: paymentMethod.value,
      notes: paymentNotes.value
    });
    
    if (response.success) {
      // Remove from local list
      const index = unclaimedList.value.findIndex(u => u.unclaimed_id === unclaimedId);
      if (index !== -1) {
        unclaimedList.value.splice(index, 1);
      }
      
      // Emit event to refresh payment history
      emit('payment-processed', response.data.paymentRecord);
      emit('unclaimed-updated');
      
      closePayNowModal();
      clearSelection();
      
      // Show success message (you can replace this with a toast/notification)
      console.log(`Payment of ${formatCurrency(amount)} processed successfully for ${employeeName}`);
      
      // Optional: Show a temporary success indicator
      showTemporaryMessage('success', `Payment of ${formatCurrency(amount)} processed successfully!`);
    } else {
      console.error('Payment failed:', response.error);
      showTemporaryMessage('error', response.error || 'Failed to process payment');
      closePayNowModal();
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    showTemporaryMessage('error', 'Failed to process payment. Please try again.');
    closePayNowModal();
  } finally {
    processingPayment.value = false;
  }
}

// ==================== BULK RETURN METHODS ====================
function openBulkReturnConfirmation() {
  bulkReturnItems.value = filteredUnclaimed.value.filter(item => selectedUnclaimedIds.value.includes(item.unclaimed_id));
  bulkReturnReason.value = "";
  showBulkReturnModal.value = true;
}

function closeBulkReturnModal() {
  showBulkReturnModal.value = false;
  setTimeout(() => {
    bulkReturnItems.value = [];
    bulkReturnReason.value = "";
  }, 300);
}

async function confirmBulkReturn() {
  if (bulkReturnItems.value.length === 0) {
    console.error('No items selected for return');
    closeBulkReturnModal();
    return;
  }

  movingToReturned.value = true;
  
  const itemsToReturn = [...bulkReturnItems.value];
  const unclaimedIds = itemsToReturn.map(item => item.unclaimed_id);
  
  try {
    const response = await payrollService.bulkReturnUnclaimed(unclaimedIds, bulkReturnReason.value);
    
    if (response.success) {
      // Remove returned items from local list
      for (const item of itemsToReturn) {
        const index = unclaimedList.value.findIndex(u => u.unclaimed_id === item.unclaimed_id);
        if (index !== -1) {
          unclaimedList.value.splice(index, 1);
        }
      }
      
      closeBulkReturnModal();
      clearSelection();
      emit('unclaimed-updated');
      
      console.log(`${response.data.returnedCount} salaries marked as returned successfully`);
      showTemporaryMessage('success', `${response.data.returnedCount} salaries marked as returned successfully!`);
    } else {
      console.error('Bulk return failed:', response.error);
      showTemporaryMessage('error', response.error || 'Failed to process bulk return');
      closeBulkReturnModal();
    }
  } catch (error) {
    console.error('Error in bulk return:', error);
    showTemporaryMessage('error', 'Failed to process bulk return. Please try again.');
    closeBulkReturnModal();
  } finally {
    movingToReturned.value = false;
  }
}

// ==================== TEMPORARY MESSAGE SYSTEM ====================
const message = ref({ show: false, type: '', text: '' });
let messageTimeout = null;

function showTemporaryMessage(type, text) {
  // Clear existing timeout
  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }
  
  message.value = { show: true, type, text };
  
  // Auto-hide after 3 seconds
  messageTimeout = setTimeout(() => {
    message.value.show = false;
  }, 3000);
}

// ==================== SELECTION METHODS ====================
function updateSelected() {
  selectedUnclaimedIds.value = filteredUnclaimed.value.filter(item => item.selected).map(item => item.unclaimed_id);
  selectAll.value = selectedUnclaimedIds.value.length === filteredUnclaimed.value.length && filteredUnclaimed.value.length > 0;
}

function toggleSelectAll() {
  filteredUnclaimed.value.forEach(item => item.selected = selectAll.value);
  updateSelected();
}

function clearSelection() {
  selectedUnclaimedIds.value = [];
  selectAll.value = false;
  unclaimedList.value.forEach(item => item.selected = false);
}

// ==================== EXPORT ====================
async function exportUnclaimed() {
  exporting.value = true;
  try {
    const headers = ["Employee Code", "Employee Name", "Department", "Payroll Month", "Due Date", "Amount (ETB)", "Days Overdue"];
    const rows = filteredUnclaimed.value.map(u => [
      u.employee_code, 
      u.employee_name, 
      u.department, 
      u.month, 
      u.due_date, 
      parseFloat(u.amount), 
      u.days_overdue
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unclaimed_salary_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export error:", error);
  } finally {
    exporting.value = false;
  }
}

// ==================== WATCHERS ====================
watch(() => props.departments, () => {
  loadUnclaimedData();
}, { deep: true });

// ==================== INITIALIZATION ====================
onMounted(() => {
  loadUnclaimedData();
});
</script>

<style scoped>

/* Toast Message Styles */
.toast-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 400px;
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

.toast-message.success {
  background: #10b981;
  color: white;
  border-left: 4px solid #047857;
}

.toast-message.error {
  background: #ef4444;
  color: white;
  border-left: 4px solid #b91c1c;
}

.toast-icon {
  font-size: 18px;
  font-weight: bold;
}

.toast-text {
  flex: 1;
}
/* Add loading state styles */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  margin-top: 4px;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Rest of the styles remain the same as your original component */
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
  gap: 10px;
}

.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.header-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 240px;
  background: #f8fafc;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
  min-width: 110px;
}

.days-filter-wrapper {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.days-input {
  width: 100px;
  padding: 8px 4px 8px 10px;
  border: none;
  font-size: 13px;
  background: transparent;
}

.days-input:focus {
  outline: none;
}

.days-suffix {
  padding-right: 10px;
  font-size: 12px;
  color: #64748b;
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

.bulk-actions-bar {
  background: #eff6ff;
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.selected-count {
  font-size: 13px;
  font-weight: 500;
  color: #1e40af;
}

.bulk-buttons {
  display: flex;
  gap: 10px;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

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

.net {
  font-weight: 600;
  color: #dc2626;
}

.overdue-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.overdue-badge.critical {
  background: #fee2e2;
  color: #991b1b;
}

.overdue-badge.high {
  background: #fef3c7;
  color: #92400e;
}

.overdue-badge.medium {
  background: #fed7aa;
  color: #9a3412;
}

.overdue-badge.low {
  background: #d1fae5;
  color: #065f46;
}

.overdue-badge.new {
  background: #e0e7ff;
  color: #4338ca;
}

.overdue-critical {
  background-color: #fef2f2;
}

.btn-small.pay {
  background: #10b981;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  border: none;
  cursor: pointer;
}

.btn-small.pay:hover:not(:disabled) {
  background: #059669;
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
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  overflow: hidden;
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
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f1f5f9;
}

.simple-body {
  padding: 24px 20px;
}

.simple-body p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1e293b;
}

.amount-text {
  font-weight: 600;
  color: #10b981;
  font-size: 16px;
  margin-bottom: 16px;
}

.form-field {
  margin-top: 16px;
}

.form-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 6px;
}

.form-textarea-small {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  resize: vertical;
  font-family: inherit;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-primary {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary-pay {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary:hover, .btn-primary-pay:hover {
  opacity: 0.9;
}

.empty-state-cell {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
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
</style>

