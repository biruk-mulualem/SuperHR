<template>
  <div class="section-card">
    <div class="card-header">
      <h2>Payment Queue - {{ formatMonth(selectedMonth) }}</h2>
      <div class="header-filters">
        <div class="search-box">
          <input type="text" v-model="paymentSearch" placeholder="Search..." />
        </div>
        <select v-model="paymentDeptFilter" class="filter-select">
          <option value="all">All Departments</option>
          <option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
        <button
          class="btn-success"
          @click="openBatchPaymentModal"
          :disabled="selectedPaymentsList.length === 0 || !isPaymentWindowActive || processingPayment"
        >
          <span v-if="processingPayment" class="spinner-small"></span>
          <span v-else>💰</span>
          {{ processingPayment ? "Processing..." : `Batch Pay (${selectedPaymentsList.length})` }}
        </button>
      </div>
    </div>

    <div v-if="paymentSession" class="payment-info-bar">
      <div class="info-group">
        <span>Pay Date:</span>
        <strong>{{ formatDate(paymentSession.payDate) }}</strong>
      </div>
      <div class="info-group">
        <span>Total:</span>
        <strong>{{ formatCurrency(paymentSession.totalAmount) }}</strong>
      </div>
      <div class="info-group">
        <span>Employees:</span>
        <strong>{{ paymentSession.employeeCount }}</strong>
      </div>
      <div class="info-group">
        <span>Status:</span>
        <strong :class="isPaymentWindowActive ? 'text-green' : 'text-orange'">
          {{ isPaymentWindowActive ? "Available" : "Locked" }}
        </strong>
      </div>
    </div>

    <div class="table-container">
      <table class="payroll-table">
        <thead>
          <tr>
            <th style="width: 35px">
              <input
                type="checkbox"
                @change="toggleSelectAllPayments"
                v-model="selectAllPayment"
                :disabled="!isPaymentWindowActive"
              />
            </th>
            <th>#</th>
            <th>Employee</th>
            <th>Dept</th>
            <th class="text-right">Net Pay</th>
            <th>Due Date</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in paginatedPaymentQueue" :key="item.id">
            <td class="text-center">
              <input type="checkbox" v-model="item.selected" :disabled="!isPaymentWindowActive" />
            </td>
            <td class="text-center">
              {{ (paymentPagination.page - 1) * paymentPagination.limit + idx + 1 }}
            </td>
            <td class="employee-cell">
              <strong>{{ item.employeeName }}</strong>
              <div class="employee-code">{{ item.employeeCode }}</div>
            </td>
            <td class="text-center">{{ item.department }}</td>
            <td class="text-right net">{{ formatCurrency(item.amount) }}</td>
            <td class="text-center">{{ formatDate(item.dueDate) }}</td>
            <td class="text-center">
              <button
                class="btn-small success"
                @click="openPaymentMethodModal(item)"
                :disabled="!isPaymentWindowActive || processingPayment"
              >
                Pay Now
              </button>
            </td>
          </tr>
          <tr v-if="filteredPaymentQueue.length === 0">
            <td colspan="7" class="empty-state-cell">
              <div class="empty-state-content">
                <div class="empty-icon">💸</div>
                <p>No pending payments. Process payroll first.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="paymentPagination.totalPages > 1">
      <button class="page-btn" :disabled="paymentPagination.page === 1" @click="changePaymentPage(paymentPagination.page - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ paymentPagination.page }} of {{ paymentPagination.totalPages }}</span>
      <button class="page-btn" :disabled="paymentPagination.page === paymentPagination.totalPages" @click="changePaymentPage(paymentPagination.page + 1)">
        Next →
      </button>
      <select v-model="paymentPagination.limit" @change="changePaymentLimit" class="limit-select">
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>
  </div>

  <!-- Payment Method Modal -->
  <div v-if="showPaymentMethodModal" class="modal-overlay" @click.self="closePaymentMethodModal">
    <div class="modal-container payment-method-modal">
      <div class="modal-header">
        <h3>Select Payment Method</h3>
        <button class="modal-close" @click="closePaymentMethodModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="employee-info-card-styled">
          <div class="emp-avatar-small">{{ getInitials(selectedPaymentItem?.employeeName) }}</div>
          <div class="emp-details">
            <div class="emp-name">{{ selectedPaymentItem?.employeeName }}</div>
            <div class="emp-code">{{ selectedPaymentItem?.employeeCode }}</div>
            <div class="emp-dept">{{ selectedPaymentItem?.department }}</div>
          </div>
          <div class="emp-amount-large">{{ formatCurrency(selectedPaymentItem?.amount) }}</div>
        </div>
        <div class="payment-options-styled">
          <div class="payment-option-styled" :class="{ active: selectedPaymentMethod === 'Cash' }" @click="selectedPaymentMethod = 'Cash'">
            <div class="option-radio"><input type="radio" :checked="selectedPaymentMethod === 'Cash'" /></div>
            <div class="option-icon">💵</div>
            <div class="option-info">
              <div class="option-label">Cash</div>
              <div class="option-desc">Physical cash payment</div>
            </div>
          </div>
          <div class="payment-option-styled" :class="{ active: selectedPaymentMethod === 'Bank Transfer' }" @click="selectedPaymentMethod = 'Bank Transfer'">
            <div class="option-radio"><input type="radio" :checked="selectedPaymentMethod === 'Bank Transfer'" /></div>
            <div class="option-icon">🏦</div>
            <div class="option-info">
              <div class="option-label">Bank Transfer</div>
              <div class="option-desc">Direct bank transfer</div>
            </div>
          </div>
        </div>
        <div v-if="selectedPaymentMethod === 'Bank Transfer'" class="form-field">
          <label>Transaction Reference</label>
          <input type="text" v-model="transactionReference" class="form-input" placeholder="Enter transaction ID" />
        </div>
        <div v-if="selectedPaymentMethod === 'Cash'" class="form-field">
          <label>Cash Receipt Reference</label>
          <input type="text" v-model="cashReference" class="form-input" placeholder="Enter receipt number" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closePaymentMethodModal">Cancel</button>
        <button class="btn-primary" @click="confirmPaymentWithMethod" :disabled="processingPayment">
          {{ processingPayment ? "Processing..." : "Confirm Payment" }}
        </button>
      </div>
    </div>
  </div>

  <!-- Batch Payment Modal -->
  <div v-if="showBatchModal" class="modal-overlay" @click.self="closeBatchModal">
    <div class="modal-container batch-modal">
      <div class="modal-header">
        <h3>Batch Payment</h3>
        <button class="modal-close" @click="closeBatchModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="batch-summary">
          <div>Selected: <strong>{{ selectedPaymentsList.length }}</strong> employees</div>
          <div>Total: <strong>{{ formatCurrency(selectedPaymentsTotal) }}</strong></div>
          <div>Method: <select v-model="batchMethod" class="form-select"><option>Bank Transfer</option><option>Cash</option></select></div>
        </div>
        <div class="batch-list">
          <div v-for="emp in selectedPaymentsList" :key="emp.id" class="batch-item">
            <span>{{ emp.employeeName }}</span><span>{{ formatCurrency(emp.amount) }}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeBatchModal">Cancel</button>
        <button class="btn-primary" @click="confirmBatchPayment" :disabled="processingPayment">
          {{ processingPayment ? "Processing..." : "Process Payment" }}
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

const departments = ["IT", "Finance", "Operations", "HR"];
const currentUser = "HR Admin";

// State
const selectedMonth = ref("");
const paymentQueue = ref([]);
const paymentHistory = ref([]);
const paymentSession = ref(null);
const paymentSearch = ref("");
const paymentDeptFilter = ref("all");
const paymentPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const selectAllPayment = ref(false);
const processingPayment = ref(false);
const showPaymentMethodModal = ref(false);
const showBatchModal = ref(false);
const selectedPaymentItem = ref(null);
const selectedPaymentMethod = ref("Cash");
const transactionReference = ref("");
const cashReference = ref("");
const batchMethod = ref("Bank Transfer");
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// Computed
const filteredPaymentQueue = computed(() => {
  let data = paymentQueue.value;
  if (paymentSearch.value) {
    data = data.filter(e => e.employeeName?.toLowerCase().includes(paymentSearch.value.toLowerCase()));
  }
  if (paymentDeptFilter.value !== "all") {
    data = data.filter(e => e.department === paymentDeptFilter.value);
  }
  paymentPagination.value.total = data.length;
  paymentPagination.value.totalPages = Math.ceil(data.length / paymentPagination.value.limit) || 1;
  return data;
});

const paginatedPaymentQueue = computed(() => {
  const start = (paymentPagination.value.page - 1) * paymentPagination.value.limit;
  return filteredPaymentQueue.value.slice(start, start + paymentPagination.value.limit);
});

const selectedPaymentsList = computed(() => filteredPaymentQueue.value.filter(e => e.selected));
const selectedPaymentsTotal = computed(() => selectedPaymentsList.value.reduce((s, e) => s + (e.amount || 0), 0));
const isPaymentWindowActive = computed(() => paymentSession.value && new Date() >= new Date(paymentSession.value.payDate));

// Helpers
function formatCurrency(amt) { return payrollService.formatCurrency(amt); }
function formatDate(d) { return payrollService.formatDate(d); }
function formatMonth(m) { return payrollService.formatMonth(m); }
function getInitials(name) { if (!name) return "?"; return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
function showToastMessage(msg, type) { toastMessage.value = msg; toastType.value = type; showToast.value = true; setTimeout(() => { showToast.value = false; }, 3000); }

// Payment Methods
function openPaymentMethodModal(item) {
  selectedPaymentItem.value = item;
  selectedPaymentMethod.value = "Cash";
  transactionReference.value = "";
  cashReference.value = "";
  showPaymentMethodModal.value = true;
}

function closePaymentMethodModal() {
  showPaymentMethodModal.value = false;
  selectedPaymentItem.value = null;
}

function confirmPaymentWithMethod() {
  processingPayment.value = true;
  setTimeout(() => {
    const ref = selectedPaymentMethod.value === "Bank Transfer"
      ? transactionReference.value || `TXN${Date.now()}`
      : cashReference.value || `CASH${Date.now()}`;
    
    paymentHistory.value.push({
      id: Date.now(),
      employeeId: selectedPaymentItem.value.employeeId,
      employeeName: selectedPaymentItem.value.employeeName,
      employeeCode: selectedPaymentItem.value.employeeCode,
      department: selectedPaymentItem.value.department,
      amount: selectedPaymentItem.value.amount,
      paymentDate: new Date().toISOString().split("T")[0],
      month: selectedPaymentItem.value.month,
      method: selectedPaymentMethod.value,
      transactionId: ref,
      processedBy: currentUser,
    });
    
    const idx = paymentQueue.value.findIndex(p => p.id === selectedPaymentItem.value.id);
    if (idx !== -1) paymentQueue.value.splice(idx, 1);
    
    processingPayment.value = false;
    showToastMessage(`${selectedPaymentItem.value.employeeName} paid via ${selectedPaymentMethod.value}!`, "success");
    closePaymentMethodModal();
  }, 500);
}

// Batch Payment
function openBatchPaymentModal() { if (selectedPaymentsList.value.length) showBatchModal.value = true; }
function closeBatchModal() { showBatchModal.value = false; }

function confirmBatchPayment() {
  processingPayment.value = true;
  setTimeout(() => {
    selectedPaymentsList.value.forEach(p => {
      paymentHistory.value.push({
        id: Date.now(),
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        employeeCode: p.employeeCode,
        department: p.department,
        amount: p.amount,
        paymentDate: new Date().toISOString().split("T")[0],
        month: p.month,
        method: batchMethod.value,
        transactionId: `BATCH${Date.now()}`,
        processedBy: currentUser,
      });
      const idx = paymentQueue.value.findIndex(pq => pq.id === p.id);
      if (idx !== -1) paymentQueue.value.splice(idx, 1);
    });
    processingPayment.value = false;
    closeBatchModal();
    showToastMessage(`Batch payment completed for ${selectedPaymentsList.value.length} employees`, "success");
  }, 500);
}

function toggleSelectAllPayments() {
  filteredPaymentQueue.value.forEach(e => e.selected = selectAllPayment.value);
}

// Pagination
function changePaymentPage(page) { paymentPagination.value.page = page; }
function changePaymentLimit() { paymentPagination.value.page = 1; paymentPagination.value.limit = parseInt(paymentPagination.value.limit); }

// Refresh handler
function handleRefreshAllTabs() {
  // Refresh logic
}

// Event handler for process payroll
function handleProcessPayroll(event) {
  const { month, paymentDate: payDate, paymentWindowDays, unclaimedWindowDays } = event.detail;
  selectedMonth.value = month;
  paymentSession.value = { month, payDate, totalAmount: 0, employeeCount: 0 };
  
  // In a real app, you would fetch from API
  // For now, we'll use mock data
  const demoPayments = [
    { id: 1, employeeId: 1, employeeName: "Biruk Mulualem", employeeCode: "EMP001", department: "IT", amount: 18750, dueDate: payDate, month: month, selected: false },
    { id: 2, employeeId: 2, employeeName: "Dagmawi Hadgu", employeeCode: "EMP002", department: "IT", amount: 26250, dueDate: payDate, month: month, selected: false },
    { id: 3, employeeId: 3, employeeName: "Melkamu Zewdu", employeeCode: "EMP003", department: "Operations", amount: 21000, dueDate: payDate, month: month, selected: false },
    { id: 4, employeeId: 6, employeeName: "Nuru Seid", employeeCode: "EMP006", department: "Finance", amount: 11250, dueDate: payDate, month: month, selected: false },
    { id: 5, employeeId: 5, employeeName: "Tamrat Zerihun", employeeCode: "EMP005", department: "IT", amount: 13500, dueDate: payDate, month: month, selected: false },
  ];
  
  paymentQueue.value = demoPayments;
  paymentSession.value.totalAmount = paymentQueue.value.reduce((s, e) => s + e.amount, 0);
  paymentSession.value.employeeCount = paymentQueue.value.length;
  paymentPagination.value.page = 1;
}

// Initialization
function init() {
  selectedMonth.value = new Date().toISOString().slice(0, 7);
}

onMounted(() => {
  init();
  window.addEventListener('process-payroll', handleProcessPayroll);
  window.addEventListener('refresh-all-tabs', handleRefreshAllTabs);
});

onUnmounted(() => {
  window.removeEventListener('process-payroll', handleProcessPayroll);
  window.removeEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
</script>

<style scoped>
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
.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  width: 200px;
  background: #f8fafc;
  transition: all 0.2s;
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
}

/* ==================== PAYMENT INFO BAR ==================== */
.payment-info-bar {
  background: #dbeafe;
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.info-group {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
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

.net {
  font-weight: 600;
  color: #10b981;
}

/* ==================== BUTTONS ==================== */
.btn-success {
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

.btn-success:hover:not(:disabled) {
  background: #059669;
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

.btn-small.success {
  background: #10b981;
}

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
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
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
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.batch-modal {
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

/* Payment Method Modal */
.payment-method-modal {
  max-width: 480px;
}

.employee-info-card-styled {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.emp-avatar-small {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.emp-details {
  flex: 1;
}

.emp-name {
  font-weight: 600;
  font-size: 16px;
}

.emp-code {
  font-size: 11px;
  color: #64748b;
}

.emp-dept {
  font-size: 11px;
  color: #94a3b8;
}

.emp-amount-large {
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
}

.payment-options-styled {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.payment-option-styled {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-option-styled:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.payment-option-styled.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.option-radio input {
  margin: 0;
}

.option-icon {
  font-size: 28px;
}

.option-info {
  flex: 1;
}

.option-label {
  font-weight: 600;
  font-size: 14px;
}

.option-desc {
  font-size: 11px;
  color: #64748b;
}

/* Batch Modal */
.batch-summary {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.batch-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.batch-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
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

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: white;
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

/* Text Colors */
.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }
.text-red { color: #ef4444; }
.text-blue { color: #3b82f6; }

/* Responsive */
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
  
  .payment-info-bar {
    flex-direction: column;
    gap: 8px;
  }
}
</style>