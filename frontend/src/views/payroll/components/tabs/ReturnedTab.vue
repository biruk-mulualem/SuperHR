<template>
  <div class="section-card">
    <!-- Toast Message -->
    <div v-if="message.show" class="toast-message" :class="message.type">
      <span class="toast-icon">{{ message.type === 'success' ? '✓' : '⚠️' }}</span>
      <span class="toast-text">{{ message.text }}</span>
    </div>

    <div class="card-header">
      <h2>Returned Salary</h2>
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

        <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Fully Paid</option>
        </select>
        
        <button class="btn-export" @click="exportReturned" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading returned salaries...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="payroll-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Dept</th>
            <th>Payroll Month</th>
            <th>Return Date</th>
            <th class="text-right">Original Amount</th>
            <th class="text-right">Paid Amount</th>
            <th class="text-right">Kept Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedReturned" :key="item.returned_id">
            <td class="employee-cell">
              <strong>{{ item.employee_name }}</strong>
              <div class="employee-code">{{ item.employee_code }}</div>
            </td>
            <td class="text-center">{{ item.department }}</td>
            <td class="text-center">{{ formatMonth(item.month) }}</td>
            <td class="text-center">{{ formatDate(item.return_date) }}</td>
            <td class="text-right">{{ formatCurrency(parseFloat(item.original_amount)) }}</td>
            <td class="text-right text-green">{{ formatCurrency(parseFloat(item.paid_amount || 0)) }}</td>
            <td class="text-right text-red">{{ formatCurrency(parseFloat(item.kept_amount || 0)) }}</td>
            <td class="text-center">
              <span class="status-badge" :class="getStatusClass(item.status)">
                {{ getStatusText(item.status) }}
              </span>
              <div v-if="item.status === 'partially_paid'" class="progress-bar">
                <div class="progress-fill" :style="{ width: item.percent_paid + '%' }"></div>
                <span class="progress-text">{{ item.percent_paid }}% paid</span>
              </div>
            </td>
            <td class="text-center">
              <button
                v-if="item.status !== 'paid'"
                class="btn-small success"
                @click="openPaymentModal(item)"
                :disabled="processingPaymentLocal"
              >
                Pay Now
              </button>
              <span v-else class="paid-badge">✓ Paid</span>
            </td>
          </tr>
          
          <tr v-if="filteredReturned.length === 0">
            <td colspan="9" class="empty-state-cell">
              <div class="empty-state-content">
                <div class="empty-icon">📭</div>
                <p>No returned salaries found</p>
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
      </select>
    </div>

    <!-- Payment Modal -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="closePaymentModal">
      <div class="modal-container payment-modal">
        <div class="modal-header">
          <h3>Process Payment - {{ selectedItem?.employee_name }}</h3>
          <button class="modal-close" @click="closePaymentModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="employee-info-card">
            <div class="info-row">
              <span>Employee:</span>
              <strong>{{ selectedItem?.employee_name }} ({{ selectedItem?.employee_code }})</strong>
            </div>
            <div class="info-row">
              <span>Department:</span>
              <strong>{{ selectedItem?.department }}</strong>
            </div>
            <div class="info-row">
              <span>Payroll Month:</span>
              <strong>{{ formatMonth(selectedItem?.month) }}</strong>
            </div>
            <div class="info-row">
              <span>Original Returned Amount:</span>
              <strong class="text-purple">{{ formatCurrency(parseFloat(selectedItem?.original_amount || 0)) }}</strong>
            </div>
            <div class="info-row">
              <span>Already Paid:</span>
              <strong class="text-green">{{ formatCurrency(parseFloat(selectedItem?.paid_amount || 0)) }}</strong>
            </div>
            <div class="info-row">
              <span>Remaining to Pay:</span>
              <strong class="text-orange">{{ formatCurrency(parseFloat(selectedItem?.remaining_amount || selectedItem?.original_amount)) }}</strong>
            </div>
            <div class="info-row">
              <span>Return Reason:</span>
              <strong class="text-red">{{ selectedItem?.return_reason || 'No reason provided' }}</strong>
            </div>
          </div>

          <div class="form-field">
            <label>Payment Type</label>
            <select v-model="paymentType" class="form-select" @change="generatePaymentNotes">
              <option value="full">Full Payment (Pay Remaining Amount)</option>
              <option value="percent">Partial Payment - Percentage</option>
              <option value="amount">Partial Payment - Fixed Amount</option>
            </select>
          </div>

          <div v-if="paymentType === 'percent'" class="form-field">
            <label>Percentage to Pay Employee (%)</label>
            <input
              type="number"
              v-model.number="paymentPercent"
              class="form-input"
              min="0"
              max="100"
              step="1"
              @input="calculatePercentAmount; generatePaymentNotes"
            />
            <div class="input-hint">Enter percentage of the remaining amount to give to employee (0-100%)</div>
            <div class="calculation-preview">
              <div class="preview-row paid">
                <span>💰 Paid to Employee:</span>
                <strong class="text-green">{{ formatCurrency(calculatedAmount) }} ({{ paymentPercent }}%)</strong>
              </div>
              <div class="preview-row kept">
                <span>🏦 Kept by Company:</span>
                <strong class="text-red">{{ formatCurrency(remainingAmount - calculatedAmount) }} ({{ 100 - paymentPercent }}%)</strong>
              </div>
            </div>
          </div>

          <div v-if="paymentType === 'amount'" class="form-field">
            <label>Amount to Pay Employee (ETB)</label>
            <input
              type="number"
              v-model.number="paymentAmount"
              class="form-input"
              min="0"
              :max="remainingAmount"
              step="100"
              @input="validateAmount; generatePaymentNotes"
            />
            <div class="input-hint">Max: {{ formatCurrency(remainingAmount) }}</div>
            <div class="calculation-preview">
              <div class="preview-row paid">
                <span>💰 Paid to Employee:</span>
                <strong class="text-green">{{ formatCurrency(paymentAmount) }}</strong>
              </div>
              <div class="preview-row kept">
                <span>🏦 Kept by Company:</span>
                <strong class="text-red">{{ formatCurrency(remainingAmount - paymentAmount) }}</strong>
              </div>
            </div>
          </div>

          <div v-if="paymentType === 'full'" class="info-banner full">
            <span>💰</span>
            <div>You are about to pay the remaining amount of {{ formatCurrency(remainingAmount) }} to the employee.</div>
          </div>

          <div class="form-field">
            <label>Payment Method</label>
            <select v-model="paymentMethod" class="form-select" @change="generatePaymentNotes">
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div v-if="paymentMethod === 'Bank Transfer'" class="form-field">
            <label>Transaction Reference</label>
            <input 
              type="text" 
              v-model="transactionReference" 
              class="form-input" 
              placeholder="Enter transaction ID"
              @input="generatePaymentNotes"
            />
          </div>

          <div v-if="paymentMethod === 'Cash'" class="form-field">
            <label>Cash Receipt Reference</label>
            <input 
              type="text" 
              v-model="cashReference" 
              class="form-input" 
              placeholder="Enter receipt number"
              @input="generatePaymentNotes"
            />
          </div>

          <div class="form-field">
            <label>Payment Notes (Auto-generated, editable)</label>
            <textarea 
              v-model="paymentNotes" 
              class="form-textarea" 
              rows="5" 
              placeholder="Payment notes will appear here..."
              @input="onNotesEdit"
            ></textarea>
            <div class="input-hint">Notes are auto-generated but you can edit them</div>
          </div>

          <div class="warning-note">
            ⚠️ This action cannot be undone. The unpaid portion will be kept by the company.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closePaymentModal">Cancel</button>
          <button class="btn-primary-pay" @click="confirmPayment" :disabled="processingPaymentLocal || !isValidPayment">
            {{ processingPaymentLocal ? "Processing..." : "Confirm Payment" }}
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
const emit = defineEmits(['payment-processed', 'returned-updated']);

// ==================== STATE ====================
const search = ref("");
const monthFilter = ref("");
const yearFilter = ref("");
const deptFilter = ref("all");
const statusFilter = ref("all");
const exporting = ref(false);
const processingPaymentLocal = ref(false);
const loading = ref(false);
const pagination = ref({ currentPage: 1, recordsPerPage: 10, totalRecords: 0, totalPages: 1 });

// Modal state
const showPaymentModal = ref(false);
const selectedItem = ref(null);
const paymentType = ref("full");
const paymentPercent = ref(100);
const paymentAmount = ref(0);
const paymentMethod = ref("Cash");
const transactionReference = ref("");
const cashReference = ref("");
const paymentNotes = ref("");
const isManualEdit = ref(false);

// Local data
const returnedList = ref([]);

// Message toast
const message = ref({ show: false, type: '', text: '' });
let messageTimeout = null;

// ==================== COMPUTED ====================

const availableYears = computed(() => {
  const years = [...new Set(returnedList.value.map(p => p.month?.split('-')[0]).filter(Boolean))];
  return years.sort((a, b) => b - a);
});

const remainingAmount = computed(() => {
  if (!selectedItem.value) return 0;
  return parseFloat(selectedItem.value.remaining_amount || selectedItem.value.original_amount || 0);
});

const calculatedAmount = computed(() => {
  if (paymentType.value === "percent") {
    return Math.floor((remainingAmount.value * paymentPercent.value) / 100);
  }
  return paymentAmount.value;
});

const isValidPayment = computed(() => {
  if (paymentType.value === "full") return true;
  if (paymentType.value === "percent") {
    return paymentPercent.value > 0 && paymentPercent.value <= 100;
  }
  if (paymentType.value === "amount") {
    return paymentAmount.value > 0 && paymentAmount.value <= remainingAmount.value;
  }
  return false;
});

const filteredReturned = computed(() => {
  let data = [...returnedList.value];
  
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
  if (statusFilter.value !== "all") {
    data = data.filter(e => e.status === statusFilter.value);
  }
  
  pagination.value.totalRecords = data.length;
  pagination.value.totalPages = Math.ceil(data.length / pagination.value.recordsPerPage) || 1;
  
  if (pagination.value.currentPage > pagination.value.totalPages) {
    pagination.value.currentPage = 1;
  }
  
  return data;
});

const paginatedReturned = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.recordsPerPage;
  const end = start + pagination.value.recordsPerPage;
  return filteredReturned.value.slice(start, end);
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

function getStatusClass(status) {
  const classes = {
    pending: 'status-pending',
    partially_paid: 'status-partial',
    paid: 'status-paid'
  };
  return classes[status] || 'status-pending';
}

function getStatusText(status) {
  const texts = {
    pending: 'Pending',
    partially_paid: 'Partially Paid',
    paid: 'Fully Paid'
  };
  return texts[status] || status;
}

function showTemporaryMessage(type, text) {
  if (messageTimeout) clearTimeout(messageTimeout);
  message.value = { show: true, type, text };
  messageTimeout = setTimeout(() => {
    message.value.show = false;
  }, 3000);
}

function changePage(page) { 
  pagination.value.currentPage = page; 
  loadReturnedData();
}

function changeLimit() { 
  pagination.value.currentPage = 1; 
  pagination.value.recordsPerPage = parseInt(pagination.value.recordsPerPage); 
  loadReturnedData();
}

function onSearchChange() { 
  pagination.value.currentPage = 1; 
  loadReturnedData();
}

function onFilterChange() { 
  pagination.value.currentPage = 1; 
  loadReturnedData();
}

// ==================== API METHODS ====================
async function loadReturnedData() {
  loading.value = true;
  try {
    const response = await payrollService.getReturnedPayroll({
      page: pagination.value.currentPage,
      limit: pagination.value.recordsPerPage,
      month: monthFilter.value,
      year: yearFilter.value,
      department: deptFilter.value,
      search: search.value,
      status: statusFilter.value
    });
    
    if (response.success) {
      returnedList.value = response.data || [];
      if (response.pagination) {
        pagination.value = {
          currentPage: response.pagination.currentPage || 1,
          recordsPerPage: response.pagination.recordsPerPage || 10,
          totalRecords: response.pagination.totalRecords || 0,
          totalPages: response.pagination.totalPages || 1
        };
      }
    } else {
      console.error('Failed to load returned data:', response.error);
      returnedList.value = [];
    }
  } catch (error) {
    console.error('Error loading returned data:', error);
    returnedList.value = [];
  } finally {
    loading.value = false;
  }
}

// ==================== PAYMENT METHODS ====================
function generatePaymentNotes() {
  if (isManualEdit.value) return;
  
  const employee = selectedItem.value;
  if (!employee) return;
  
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let notes = `[${date}] `;
  
  if (paymentType.value === 'full') {
    notes += `✅ FULL PAYMENT - `;
  } else if (paymentType.value === 'percent') {
    notes += `📊 PARTIAL PAYMENT (${paymentPercent.value}%) - `;
  } else {
    notes += `💰 PARTIAL PAYMENT (Fixed Amount) - `;
  }
  
  if (paymentMethod.value === 'Bank Transfer') {
    const ref = transactionReference.value || 'pending reference';
    notes += `Paid via BANK TRANSFER with Reference #${ref}. `;
  } else {
    const ref = cashReference.value || 'pending receipt';
    notes += `Paid via CASH with Receipt #${ref}. `;
  }
  
  const paidAmount = calculatedAmount.value;
  const keptAmount = remainingAmount.value - paidAmount;
  
  notes += `Paid ${formatCurrency(paidAmount)} to employee. `;
  notes += `Remaining ${formatCurrency(keptAmount)} kept by company. `;
  
  if (employee.return_reason) {
    notes += `Original return reason: ${employee.return_reason}.`;
  }
  
  paymentNotes.value = notes;
}

function onNotesEdit() {
  isManualEdit.value = true;
}

function calculatePercentAmount() {
  if (paymentPercent.value > 100) paymentPercent.value = 100;
  if (paymentPercent.value < 0) paymentPercent.value = 0;
  generatePaymentNotes();
}

function validateAmount() {
  if (paymentAmount.value > remainingAmount.value) {
    paymentAmount.value = remainingAmount.value;
  }
  if (paymentAmount.value < 0) paymentAmount.value = 0;
  generatePaymentNotes();
}

function openPaymentModal(item) {
  selectedItem.value = { ...item };
  paymentType.value = "full";
  paymentPercent.value = 100;
  paymentAmount.value = remainingAmount.value;
  paymentMethod.value = "Cash";
  transactionReference.value = "";
  cashReference.value = "";
  isManualEdit.value = false;
  generatePaymentNotes();
  showPaymentModal.value = true;
}

function closePaymentModal() {
  showPaymentModal.value = false;
  setTimeout(() => {
    selectedItem.value = null;
    isManualEdit.value = false;
  }, 300);
}

async function confirmPayment() {
  if (!isValidPayment.value) return;
  if (!selectedItem.value) return;
  
  processingPaymentLocal.value = true;
  
  const itemToPay = { ...selectedItem.value };
  const paidAmount = paymentType.value === "full" 
    ? remainingAmount.value
    : (paymentType.value === "percent" ? calculatedAmount.value : paymentAmount.value);
  const keptAmount = remainingAmount.value - paidAmount;
  const reference = paymentMethod.value === "Bank Transfer" 
    ? transactionReference.value || `TXN${Date.now()}`
    : cashReference.value || `CASH${Date.now()}`;
  
  try {
    const response = await payrollService.payReturnedPayroll(itemToPay.returned_id, {
      paymentType: paymentType.value,
      paidAmount: paidAmount,
      keptAmount: keptAmount,
      percentagePaid: paymentType.value === "percent" ? paymentPercent.value : null,
      paymentMethod: paymentMethod.value,
      transactionReference: reference,
      paymentNotes: paymentNotes.value
    });
    
    if (response.success) {
      // Refresh the list
      await loadReturnedData();
      
      emit('payment-processed', response.data.paymentRecord);
      emit('returned-updated');
      
      closePaymentModal();
      showTemporaryMessage('success', `Payment of ${formatCurrency(paidAmount)} processed successfully!`);
    } else {
      showTemporaryMessage('error', response.error || 'Failed to process payment');
    }
  } catch (error) {
    console.error('Payment error:', error);
    showTemporaryMessage('error', 'Failed to process payment. Please try again.');
  } finally {
    processingPaymentLocal.value = false;
  }
}

// ==================== EXPORT ====================
async function exportReturned() {
  exporting.value = true;
  try {
    const headers = ["Employee Code", "Employee Name", "Department", "Payroll Month", "Return Date", "Original Amount", "Paid Amount", "Kept Amount", "Status", "Return Reason"];
    const rows = filteredReturned.value.map(r => [
      r.employee_code, 
      r.employee_name, 
      r.department, 
      r.month, 
      r.return_date, 
      parseFloat(r.original_amount), 
      parseFloat(r.paid_amount || 0), 
      parseFloat(r.kept_amount || 0), 
      r.status, 
      r.return_reason || '-'
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `returned_payroll_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showTemporaryMessage('success', `Exported ${filteredReturned.value.length} records`);
  } catch (error) {
    console.error("Export error:", error);
    showTemporaryMessage('error', 'Failed to export data');
  } finally {
    exporting.value = false;
  }
}

// ==================== WATCHERS ====================
watch([paymentType, paymentPercent, paymentAmount, paymentMethod, transactionReference, cashReference], () => {
  if (!isManualEdit.value && selectedItem.value) {
    generatePaymentNotes();
  }
});

// ==================== INITIALIZATION ====================
onMounted(() => {
  loadReturnedData();
});
</script>

<style scoped>
/* Add new styles */
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

.text-green {
  color: #10b981;
}

.text-red {
  color: #ef4444;
}

.text-orange {
  color: #f59e0b;
}

.text-purple {
  color: #8b5cf6;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-partial {
  background: #dbeafe;
  color: #1e40af;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.progress-bar {
  margin-top: 6px;
  width: 80px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  white-space: nowrap;
}

.paid-badge {
  color: #10b981;
  font-weight: 500;
  font-size: 12px;
}



@keyframes spin {
  to { transform: rotate(360deg); }
}

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

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
  min-width: 110px;
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

.table-wrapper {
  overflow-x: auto;
  width: 100%;
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

.btn-small {
  padding: 4px 12px;
  font-size: 11px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
}

.btn-small.success {
  background: #10b981;
  color: white;
}

.btn-small.success:hover:not(:disabled) {
  background: #059669;
}

/* Modal Styles */
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

.payment-modal {
  max-width: 600px;
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
}

.modal-close:hover {
  background: #f1f5f9;
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

/* Employee Info Card */
.employee-info-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.info-row:last-child {
  border-bottom: none;
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

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  transition: all 0.2s;
}

.form-input:focus, .form-select:focus {
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

.calculation-preview {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.preview-row.paid {
  border-bottom: 1px solid #e2e8f0;
}

.preview-row.kept {
  padding-top: 8px;
}

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

.info-banner.full {
  background: #d1fae5;
  border-left-color: #10b981;
}

.warning-note {
  background: #fef3c7;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  margin-top: 16px;
}

.btn-primary-pay {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary-pay:hover:not(:disabled) {
  background: #059669;
}

.btn-primary-pay:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
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