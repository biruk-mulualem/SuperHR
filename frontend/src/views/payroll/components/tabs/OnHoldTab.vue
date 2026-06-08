<template>
  <div class="section-card">
    <div class="card-header">
      <h2>Employees On Hold</h2>
      <div class="header-filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="search"
            placeholder="Search employee..."
            @input="onSearchChange"
          />
        </div>
        <select v-model="deptFilter" class="filter-select" @change="onFilterChange">
          <option value="all">All Departments</option>
          <option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
        <button
          class="btn-export"
          @click="exportOnHoldList"
          :disabled="exporting"
        >
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
      </div>
    </div>

    <!-- Warning Banner for Long-term Holds -->
    <div v-if="longTermHolds.length > 0" class="warning-banner">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <strong>{{ longTermHolds.length }} employee(s)</strong> have been on hold for 
        <strong>3 months</strong>. Maximum hold period reached. Action required.
      </div>
    </div>

    <div class="stats-mini-row">
      <div class="stat-mini-card">
        <div class="stat-mini-value text-red">{{ onHoldStats.total }}</div>
        <div class="stat-mini-label">Employees on Hold</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-mini-value">
          {{ formatCurrency(onHoldStats.totalAmount) }}
        </div>
        <div class="stat-mini-label">Total Unpaid Salary</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-mini-value text-orange">{{ onHoldStats.maxDuration }} months</div>
        <div class="stat-mini-label">Longest Hold</div>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="payroll-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Dept</th>
            <th class="text-right">Total On Hold</th>
            <th>Months on Hold</th>
            <th>Hold Started</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(emp, idx) in paginatedOnHoldList" :key="emp.id" :class="{ 'long-term': emp.monthsOnHold >= 6 }">
            <td class="employee-cell">
              <strong>{{ emp.fullName }}</strong>
              <div class="employee-code">{{ emp.employeeCode }}</div>
            </td>
            <td class="text-center">{{ emp.department }}</td>
            <td class="text-right text-purple">
              <strong>{{ formatCurrency(emp.totalOnHold) }}</strong>
            </td>
            <td class="text-center">
              <span class="duration-badge" :class="getDurationClass(emp.monthsOnHold)">
                {{ emp.monthsOnHold }} months
              </span>
            </td>
            <td class="text-center">
              {{ formatDate(emp.holdStartDate) }}
            </td>
            <td class="text-center">
              <button 
                class="btn-small warning" 
                @click="openReleaseModal(emp)"
                :disabled="releasingEmployeeId === emp.id"
              >
                <span v-if="releasingEmployeeId === emp.id" class="spinner-small-white"></span>
              
                {{ releasingEmployeeId === emp.id ? "Releasing..." : "Release" }}
              </button>
            </td>
          </tr>
          
          <tr v-if="filteredOnHoldList.length === 0">
            <td colspan="6" class="empty-state-cell">
              <div class="empty-state-content">
                <div class="empty-icon">✅</div>
                <p>No employees on hold</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="pagination.totalPages > 1">
      <button
        class="page-btn"
        :disabled="pagination.page === 1"
        @click="changePage(pagination.page - 1)"
      >
        ← Previous
      </button>
      <span class="page-info"
        >Page {{ pagination.page }} of {{ pagination.totalPages }}</span
      >
      <button
        class="page-btn"
        :disabled="pagination.page === pagination.totalPages"
        @click="changePage(pagination.page + 1)"
      >
        Next →
      </button>
      <select
        v-model="pagination.limit"
        @change="changeLimit"
        class="limit-select"
      >
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>

    <!-- Single Release Modal -->
    <div
      v-if="showSingleReleaseModal"
      class="modal-overlay"
      @click.self="closeReleaseModal"
    >
      <div class="modal-container release-modal">
        <div class="modal-header">
          <h3>Release Hold - {{ selectedEmployee?.fullName }}</h3>
          <button class="modal-close" @click="closeReleaseModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="employee-info-card">
            <div class="info-row">
              <span>Employee:</span>
              <strong>{{ selectedEmployee?.fullName }} ({{ selectedEmployee?.employeeCode }})</strong>
            </div>
            <div class="info-row">
              <span>Department:</span>
              <strong>{{ selectedEmployee?.department }}</strong>
            </div>
            <div class="info-row">
              <span>Total On Hold:</span>
              <strong class="text-purple">{{ formatCurrency(selectedEmployee?.totalOnHold) }}</strong>
            </div>
            <div class="info-row">
              <span>Months on Hold:</span>
              <strong>{{ selectedEmployee?.monthsOnHold }} months</strong>
            </div>
            <div class="info-row">
              <span>Hold Started:</span>
              <strong>{{ formatDate(selectedEmployee?.holdStartDate) }}</strong>
            </div>
            <div class="info-row">
              <span>Original Hold Reason:</span>
              <strong>{{ selectedEmployee?.holdReason || "No reason" }}</strong>
            </div>
          </div>

          <!-- Monthly Breakdown Section -->
          <div class="monthly-breakdown" v-if="selectedEmployee?.monthlyDetails?.length > 0">
            <h4>Monthly Breakdown (Since Hold Started)</h4>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th class="text-right">Basic Salary</th>
                  <th class="text-right">Allowances</th>
                  <th class="text-right">% Penalties</th>
                  <th class="text-right">Asset Penalty</th>
                  <th class="text-right">Other Deductions</th>
                  <th class="text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="detail in selectedEmployee.monthlyDetails" :key="detail.month">
                  <td class="text-center">{{ formatMonth(detail.month) }}</td>
                  <td class="text-right">{{ formatCurrency(detail.basicSalary) }}</td>
                  <td class="text-right">{{ formatCurrency(detail.allowances) }}</td>
                  <td class="text-right text-red">{{ formatCurrency(detail.percentagePenalty) }}</td>
                  <td class="text-right text-red">{{ formatCurrency(detail.assetPenalty) }}</td>
                  <td class="text-right text-red">{{ formatCurrency(detail.otherDeductions) }}</td>
                  <td class="text-right text-purple"><strong>{{ formatCurrency(detail.amount) }}</strong></td>
                </tr>
                <tr class="total-row">
                  <td><strong>TOTAL</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(totalBasic) }}</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(totalAllowances) }}</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(totalPercentagePenalty) }}</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(totalAssetPenalty) }}</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(totalOtherDeductions) }}</strong></td>
                  <td class="text-right"><strong>{{ formatCurrency(selectedEmployee?.totalOnHold) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="form-field">
            <label>Release Type</label>
            <select v-model="releaseType" class="form-select" @change="generateReleaseNotes">
              <option value="full">Full Release (Release all {{ selectedEmployee?.monthsOnHold }} months)</option>
              <option value="partial_months">Partial Release - Specific Months</option>
              <option value="percent">Partial Release - Percentage</option>
              <option value="amount">Partial Release - Fixed Amount</option>
            </select>
          </div>

          <div v-if="releaseType === 'partial_months'" class="form-field">
            <label>Select Months to Release</label>
            <div class="months-checkbox-group">
              <label v-for="(detail, idx) in selectedEmployee?.monthlyDetails" :key="detail.month" class="month-checkbox">
                <input type="checkbox" v-model="selectedMonths" :value="idx" @change="generateReleaseNotes" />
                {{ formatMonth(detail.month) }} - {{ formatCurrency(detail.amount) }}
              </label>
            </div>
          </div>

          <div class="form-field" v-if="releaseType === 'percent'">
            <label>Release Percentage (%) of Total</label>
            <input
              type="number"
              v-model.number="releasePercent"
              class="form-input"
              min="0"
              max="100"
              placeholder="e.g., 50"
              @input="calculatePercentAmount; generateReleaseNotes"
            />
          </div>

          <div class="form-field" v-if="releaseType === 'amount'">
            <label>Release Amount (ETB)</label>
            <input
              type="number"
              v-model.number="releaseAmount"
              class="form-input"
              min="0"
              :max="selectedEmployee?.totalOnHold"
              placeholder="Enter amount to release"
              @input="validateAmount; generateReleaseNotes"
            />
          </div>

          <div
            class="preview-section"
            v-if="
              (releaseType === 'percent' && releasePercent > 0) ||
              (releaseType === 'amount' && releaseAmount > 0) ||
              (releaseType === 'partial_months' && selectedMonths.length > 0)
            "
          >
            <div class="preview-row">
              Amount to Release Now:
              <strong class="text-green">{{ formatCurrency(calculatedReleaseAmount) }}</strong>
            </div>
            <div class="preview-row" v-if="calculatedRemainingAmount > 0">
              Remaining on Hold:
              <strong class="text-orange">{{ formatCurrency(calculatedRemainingAmount) }}</strong>
            </div>
          </div>

          <div class="form-field">
            <label>Release Notes (Auto-generated, editable)</label>
            <textarea
              v-model="releaseNotes"
              class="form-textarea"
              rows="4"
              placeholder="Release notes will appear here..."
              @input="onNotesEdit"
            ></textarea>
            <div class="input-hint">Notes are auto-generated but you can edit them</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeReleaseModal">
            Cancel
          </button>
          <button class="btn-primary" @click="confirmSingleRelease" :disabled="isReleasing">
            <span v-if="isReleasing" class="spinner-small-white"></span>
            
            {{ isReleasing ? "Processing..." : "Confirm Release" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastVisible" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import payrollService from "@/stores/payrollService";

// ==================== PROPS ====================
const props = defineProps({
  onHoldEmployees: {
    type: Array,
    default: () => []
  },
  departments: {
    type: Array,
    default: () => ['IT', 'Finance', 'Operations', 'HR']
  }
});

// ==================== EMITS ====================
const emit = defineEmits(['release-hold', 'export']);

// ==================== CONSTANTS ====================
const MAX_HOLD_MONTHS = 3;

// ==================== DEMO DATA (1-6 months hold) ====================
const generateDemoData = () => {
  const generateMonthlyDetails = (startDate, monthlySalary, hasPercentagePenalty = false, hasAssetPenalty = false, hasOtherDeductions = false, numMonths = 1) => {
    const details = [];
    const start = new Date(startDate);
    let tempDate = new Date(start);
    
    for (let i = 0; i < numMonths; i++) {
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      
      const percentagePenalty = hasPercentagePenalty ? Math.floor(monthlySalary * (Math.random() * 0.05 + 0.02)) : 0;
      const assetPenalty = hasAssetPenalty ? Math.floor(Math.random() * 1000) : 0;
      const otherDeductions = hasOtherDeductions ? Math.floor(Math.random() * 500) : 0;
      
      const allowances = Math.floor(monthlySalary * 0.45);
      const basicSalary = monthlySalary;
      const totalDeductions = percentagePenalty + assetPenalty + otherDeductions;
      const netAmount = basicSalary + allowances - totalDeductions;
      
      details.push({
        month: monthStr,
        basicSalary: basicSalary,
        allowances: allowances,
        percentagePenalty: percentagePenalty,
        assetPenalty: assetPenalty,
        otherDeductions: otherDeductions,
        amount: Math.max(0, netAmount)
      });
      
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
    
    return details;
  };
  
  const calculateTotal = (details) => {
    return details.reduce((sum, d) => sum + d.amount, 0);
  };
  
  // Employee 1: 1 month hold
  const details1 = generateMonthlyDetails(new Date(2024, 4, 15), 18750, true, false, false, 1);
  
  // Employee 2: 2 months hold
  const details2 = generateMonthlyDetails(new Date(2024, 3, 10), 21000, false, true, false, 2);
  
  // Employee 3: 3 months hold
  const details3 = generateMonthlyDetails(new Date(2024, 2, 5), 28000, true, true, false, 3);
  
  // Employee 4: 4 months hold
  const details4 = generateMonthlyDetails(new Date(2024, 0, 20), 32000, false, false, true, 4);
  
  // Employee 5: 5 months hold
  const details5 = generateMonthlyDetails(new Date(2023, 11, 1), 15000, true, false, true, 5);
  
  // Employee 6: 6 months hold (max)
  const details6 = generateMonthlyDetails(new Date(2023, 9, 10), 12000, true, true, true, 6);
  
  // Employee 7: 3 months hold (different)
  const details7 = generateMonthlyDetails(new Date(2024, 1, 25), 22000, false, false, false, 3);
  
  const demoOnHold = [
    {
      id: 1,
      employeeCode: 'EMP001',
      fullName: 'Biruk Mulualem',
      department: 'IT',
      monthlySalary: 18750,
      totalOnHold: calculateTotal(details1),
      monthsOnHold: details1.length,
      holdStartDate: new Date(2024, 4, 15).toISOString().split('T')[0],
      holdReason: 'Pending disciplinary investigation',
      monthlyDetails: details1
    },
    {
      id: 2,
      employeeCode: 'EMP002',
      fullName: 'Dagmawi Hadgu',
      department: 'IT',
      monthlySalary: 21000,
      totalOnHold: calculateTotal(details2),
      monthsOnHold: details2.length,
      holdStartDate: new Date(2024, 3, 10).toISOString().split('T')[0],
      holdReason: 'Bank account verification pending',
      monthlyDetails: details2
    },
    {
      id: 3,
      employeeCode: 'EMP003',
      fullName: 'Melkamu Zewdu',
      department: 'Operations',
      monthlySalary: 28000,
      totalOnHold: calculateTotal(details3),
      monthsOnHold: details3.length,
      holdStartDate: new Date(2024, 2, 5).toISOString().split('T')[0],
      holdReason: 'Salary dispute under review',
      monthlyDetails: details3
    },
    {
      id: 4,
      employeeCode: 'EMP004',
      fullName: 'Melaku Tewodros',
      department: 'Finance',
      monthlySalary: 32000,
      totalOnHold: calculateTotal(details4),
      monthsOnHold: details4.length,
      holdStartDate: new Date(2024, 0, 20).toISOString().split('T')[0],
      holdReason: 'Missing tax documents',
      monthlyDetails: details4
    },
    {
      id: 5,
      employeeCode: 'EMP005',
      fullName: 'Tamrat Zerihun',
      department: 'IT',
      monthlySalary: 15000,
      totalOnHold: calculateTotal(details5),
      monthsOnHold: details5.length,
      holdStartDate: new Date(2023, 11, 1).toISOString().split('T')[0],
      holdReason: 'Pending legal case',
      monthlyDetails: details5
    },
    {
      id: 6,
      employeeCode: 'EMP006',
      fullName: 'Nuru Seid',
      department: 'Finance',
      monthlySalary: 12000,
      totalOnHold: calculateTotal(details6),
      monthsOnHold: details6.length,
      holdStartDate: new Date(2023, 9, 10).toISOString().split('T')[0],
      holdReason: 'Awaiting HR decision - 6 months max',
      monthlyDetails: details6
    },
    {
      id: 7,
      employeeCode: 'EMP007',
      fullName: 'Tadese Jemberu',
      department: 'Operations',
      monthlySalary: 22000,
      totalOnHold: calculateTotal(details7),
      monthsOnHold: details7.length,
      holdStartDate: new Date(2024, 1, 25).toISOString().split('T')[0],
      holdReason: 'Awaiting document submission',
      monthlyDetails: details7
    }
  ];
  
  return demoOnHold;
};

// ==================== STATE ====================
const search = ref("");
const deptFilter = ref("all");
const exporting = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

// Modal state
const showSingleReleaseModal = ref(false);
const selectedEmployee = ref(null);
const releaseType = ref("full");
const releasePercent = ref(0);
const releaseAmount = ref(0);
const selectedMonths = ref([]);
const releaseNotes = ref("");
const isManualEdit = ref(false);
const isReleasing = ref(false);
const releasingEmployeeId = ref(null);

// Toast state
const toastVisible = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// Local data
const localOnHoldList = ref([]);

// ==================== COMPUTED ====================

const totalBasic = computed(() => {
  if (!selectedEmployee.value?.monthlyDetails) return 0;
  return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.basicSalary, 0);
});

const totalAllowances = computed(() => {
  if (!selectedEmployee.value?.monthlyDetails) return 0;
  return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.allowances, 0);
});

const totalPercentagePenalty = computed(() => {
  if (!selectedEmployee.value?.monthlyDetails) return 0;
  return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.percentagePenalty, 0);
});

const totalAssetPenalty = computed(() => {
  if (!selectedEmployee.value?.monthlyDetails) return 0;
  return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.assetPenalty, 0);
});

const totalOtherDeductions = computed(() => {
  if (!selectedEmployee.value?.monthlyDetails) return 0;
  return selectedEmployee.value.monthlyDetails.reduce((sum, d) => sum + d.otherDeductions, 0);
});

const longTermHolds = computed(() => {
  return filteredOnHoldList.value.filter(e => e.monthsOnHold >= MAX_HOLD_MONTHS);
});

const filteredOnHoldList = computed(() => {
  let data = [...localOnHoldList.value];
  
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    data = data.filter(e =>
      e.fullName?.toLowerCase().includes(searchLower) ||
      e.employeeCode?.toLowerCase().includes(searchLower)
    );
  }
  
  if (deptFilter.value !== "all") {
    data = data.filter(e => e.department === deptFilter.value);
  }
  
  pagination.value.total = data.length;
  pagination.value.totalPages = Math.ceil(data.length / pagination.value.limit) || 1;
  
  return data;
});

const paginatedOnHoldList = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.limit;
  return filteredOnHoldList.value.slice(start, start + pagination.value.limit);
});

const onHoldStats = computed(() => ({
  total: filteredOnHoldList.value.length,
  totalAmount: filteredOnHoldList.value.reduce((sum, e) => sum + (e.totalOnHold || 0), 0),
  maxDuration: filteredOnHoldList.value.length > 0 
    ? Math.max(...filteredOnHoldList.value.map(e => e.monthsOnHold))
    : 0
}));

const calculatedReleaseAmount = computed(() => {
  if (!selectedEmployee.value) return 0;
  
  switch(releaseType.value) {
    case "full":
      return selectedEmployee.value.totalOnHold;
    case "partial_months":
      return selectedMonths.value.reduce((sum, idx) => sum + selectedEmployee.value.monthlyDetails[idx].amount, 0);
    case "percent":
      return Math.floor((selectedEmployee.value.totalOnHold * releasePercent.value) / 100);
    case "amount":
      return Math.min(releaseAmount.value, selectedEmployee.value.totalOnHold);
    default:
      return 0;
  }
});

const calculatedRemainingAmount = computed(() => {
  if (!selectedEmployee.value) return 0;
  return selectedEmployee.value.totalOnHold - calculatedReleaseAmount.value;
});

// ==================== TOAST METHODS ====================
function showToast(message, type = "success") {
  toastMessage.value = message;
  toastType.value = type;
  toastVisible.value = true;
  setTimeout(() => {
    toastVisible.value = false;
  }, 3000);
}

// ==================== AUTO-GENERATE NOTES METHODS ====================
function generateReleaseNotes() {
  if (isManualEdit.value) return;
  
  const employee = selectedEmployee.value;
  if (!employee) return;
  
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let notes = `[${date}] `;
  
  if (releaseType.value === 'full') {
    notes += `✅ FULL RELEASE - `;
  } else if (releaseType.value === 'partial_months') {
    notes += `📅 PARTIAL RELEASE (Specific Months) - `;
  } else if (releaseType.value === 'percent') {
    notes += `📊 PERCENTAGE RELEASE (${releasePercent.value}%) - `;
  } else {
    notes += `💰 FIXED AMOUNT RELEASE - `;
  }
  
  if (releaseType.value === 'full') {
    notes += `All held salary (${employee.monthsOnHold} months, total ${formatCurrency(employee.totalOnHold)}) has been released. `;
  } else if (releaseType.value === 'partial_months') {
    const selectedMonthsList = selectedMonths.value.map(idx => formatMonth(employee.monthlyDetails[idx].month)).join(', ');
    notes += `Months released: ${selectedMonthsList}. Total released: ${formatCurrency(calculatedReleaseAmount.value)}. `;
    if (calculatedRemainingAmount.value > 0) {
      notes += `Remaining on hold: ${formatCurrency(calculatedRemainingAmount.value)} (${employee.monthsOnHold - selectedMonths.value.length} months). `;
    }
  } else if (releaseType.value === 'percent') {
    notes += `${releasePercent.value}% (${formatCurrency(calculatedReleaseAmount.value)}) of total held salary (${formatCurrency(employee.totalOnHold)}) has been released. `;
    if (calculatedRemainingAmount.value > 0) {
      notes += `Remaining on hold: ${formatCurrency(calculatedRemainingAmount.value)} (${100 - releasePercent.value}%). `;
    }
  } else {
    notes += `${formatCurrency(releaseAmount.value)} has been released from total held salary of ${formatCurrency(employee.totalOnHold)}. `;
    if (calculatedRemainingAmount.value > 0) {
      notes += `Remaining on hold: ${formatCurrency(calculatedRemainingAmount.value)}. `;
    }
  }
  
  notes += `Original hold reason: ${employee.holdReason}. `;
  notes += `Employee has been on hold for ${employee.monthsOnHold} months since ${formatDate(employee.holdStartDate)}.`;
  
  releaseNotes.value = notes;
}

function onNotesEdit() {
  isManualEdit.value = true;
}

// ==================== OTHER METHODS ====================
function formatCurrency(amt) {
  return payrollService.formatCurrency(amt);
}

function formatDate(d) {
  return payrollService.formatDate(d);
}

function formatMonth(m) {
  return payrollService.formatMonth(m);
}

function getDurationClass(months) {
  if (months >= 6) return 'critical';
  if (months >= 4) return 'warning';
  if (months >= 2) return 'medium';
  return 'normal';
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

function calculatePercentAmount() {
  if (releasePercent.value > 100) releasePercent.value = 100;
  if (releasePercent.value < 0) releasePercent.value = 0;
  generateReleaseNotes();
}

function validateAmount() {
  if (releaseAmount.value > (selectedEmployee.value?.totalOnHold || 0)) {
    releaseAmount.value = selectedEmployee.value?.totalOnHold || 0;
  }
  if (releaseAmount.value < 0) releaseAmount.value = 0;
  generateReleaseNotes();
}

function openReleaseModal(emp) {
  selectedEmployee.value = emp;
  releaseType.value = "full";
  releasePercent.value = 0;
  releaseAmount.value = 0;
  selectedMonths.value = [];
  isManualEdit.value = false;
  generateReleaseNotes();
  showSingleReleaseModal.value = true;
}

function closeReleaseModal() {
  showSingleReleaseModal.value = false;
  selectedEmployee.value = null;
  selectedMonths.value = [];
  isManualEdit.value = false;
}

async function confirmSingleRelease() {
  if (!selectedEmployee.value) {
    showToast("No employee selected", "error");
    return;
  }
  
  // Store employee data locally before any potential nullification
  const employee = { ...selectedEmployee.value };
  const releasedAmount = calculatedReleaseAmount.value;
  const remainingAmount = calculatedRemainingAmount.value;
  
  if (releasedAmount <= 0) {
    showToast("Please select a valid release amount", "error");
    return;
  }
  
  isReleasing.value = true;
  releasingEmployeeId.value = employee.id;
  
  try {
    let releasedMonths = [];
    if (releaseType.value === "partial_months") {
      releasedMonths = selectedMonths.value.map(idx => employee.monthlyDetails[idx].month);
    }
    
    const finalNotes = releaseNotes.value;
    
    const releaseData = {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.fullName,
      department: employee.department,
      totalOnHold: employee.totalOnHold,
      releasedAmount: releasedAmount,
      remainingAmount: remainingAmount,
      releaseType: releaseType.value,
      releasePercent: releaseType.value === "percent" ? releasePercent.value : null,
      releasedMonths: releasedMonths,
      releaseReason: finalNotes,
      releaseDate: new Date().toISOString().split('T')[0],
      monthsOnHold: employee.monthsOnHold,
      monthlyDetails: employee.monthlyDetails
    };
    
    // Remove from local list if fully released
    if (remainingAmount === 0) {
      const index = localOnHoldList.value.findIndex(e => e.id === employee.id);
      if (index !== -1) {
        localOnHoldList.value.splice(index, 1);
      }
    } else if (releaseType.value !== "full") {
      // Update the employee's total on hold for partial release
      const index = localOnHoldList.value.findIndex(e => e.id === employee.id);
      if (index !== -1) {
        localOnHoldList.value[index].totalOnHold = remainingAmount;
        // Also update the monthly details if needed
        if (releaseType.value === "partial_months" && releasedMonths.length > 0) {
          const remainingDetails = localOnHoldList.value[index].monthlyDetails.filter(d => !releasedMonths.includes(d.month));
          localOnHoldList.value[index].monthlyDetails = remainingDetails;
          localOnHoldList.value[index].monthsOnHold = remainingDetails.length;
        }
      }
    }
    
    // Emit the release data to parent
    emit('release-hold', releaseData);
    
    // Close modal first
    closeReleaseModal();
    
    // Show toast after modal is closed
    showToast(`${employee.fullName}: ${formatCurrency(releasedAmount)} released successfully!`, "success");
    
  } catch (error) {
    console.error("Release error:", error);
    showToast("Failed to release salary. Please try again.", "error");
  } finally {
    isReleasing.value = false;
    releasingEmployeeId.value = null;
  }
}

async function exportOnHoldList() {
  exporting.value = true;
  
  try {
    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Total On Hold",
      "Months on Hold",
      "Hold Start Date",
      "Hold Reason"
    ];
    
    const rows = filteredOnHoldList.value.map((emp) => [
      emp.employeeCode,
      emp.fullName,
      emp.department,
      emp.totalOnHold,
      emp.monthsOnHold,
      emp.holdStartDate,
      emp.holdReason
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `on_hold_employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    emit('export', { success: true, count: filteredOnHoldList.value.length });
    showToast(`Exported ${filteredOnHoldList.value.length} on-hold employees`, "success");
  } catch (error) {
    console.error("Export error:", error);
    emit('export', { success: false, error: error.message });
    showToast("Failed to export data", "error");
  } finally {
    exporting.value = false;
  }
}

// Watch for changes to auto-update notes
watch([releaseType, releasePercent, releaseAmount, selectedMonths], () => {
  if (!isManualEdit.value && selectedEmployee.value) {
    generateReleaseNotes();
  }
});

// ==================== INITIALIZATION ====================
function init() {
  if (props.onHoldEmployees && props.onHoldEmployees.length > 0) {
    localOnHoldList.value = props.onHoldEmployees;
  } else {
    localOnHoldList.value = generateDemoData();
  }
}

watch(() => props.onHoldEmployees, (newVal) => {
  if (newVal && newVal.length > 0) {
    localOnHoldList.value = newVal;
  }
}, { deep: true });

onMounted(() => {
  init();
});
</script>

<style scoped>
/* Add spinner-white for button loading states */
.spinner-small-white {
  width: 12px;
  height: 12px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  margin-right: 4px;
}

/* Toast Styles */
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

.toast.success {
  border-left-color: #10b981;
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
  width: 200px;
  background: #f8fafc;
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
  min-width: 150px;
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

.stats-mini-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-mini-card {
  background: #f8fafc;
  padding: 16px 24px;
  border-radius: 12px;
  flex: 1;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-mini-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-mini-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
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

.table-wrapper {
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

.duration-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.duration-badge.normal {
  background: #d1fae5;
  color: #065f46;
}

.duration-badge.medium {
  background: #fed7aa;
  color: #9a3412;
}

.duration-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.duration-badge.critical {
  background: #fee2e2;
  color: #991b1b;
}

.long-term {
  background-color: #fef2f2;
}

.btn-small {
  padding: 4px 12px;
  font-size: 11px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
}

.btn-small.warning {
  background: #f59e0b;
  color: white;
}

.btn-small.warning:hover:not(:disabled) {
  background: #d97706;
}

.warning-banner {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.warning-icon {
  font-size: 20px;
}

.warning-content {
  font-size: 13px;
  color: #92400e;
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
  max-width: 650px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.release-modal {
  max-width: 650px;
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
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
  background: #f8fafc;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.input-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.preview-section {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
}

.text-green {
  color: #10b981;
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
}

.monthly-breakdown {
  margin: 20px 0;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.monthly-breakdown h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e293b;
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.breakdown-table th,
.breakdown-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.breakdown-table th {
  background: #f8fafc;
  font-weight: 600;
}

.total-row {
  background: #f8fafc;
  font-weight: 600;
}

.months-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.month-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.month-checkbox:hover {
  background: #f8fafc;
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

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
  background: #f8fafc;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.input-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

/* Keep all existing styles from previous version */
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
  width: 200px;
  background: #f8fafc;
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
  min-width: 150px;
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

.stats-mini-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-mini-card {
  background: #f8fafc;
  padding: 16px 24px;
  border-radius: 12px;
  flex: 1;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-mini-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-mini-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
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

.table-wrapper {
  overflow-x: auto;
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

.duration-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.duration-badge.normal {
  background: #d1fae5;
  color: #065f46;
}

.duration-badge.medium {
  background: #fed7aa;
  color: #9a3412;
}

.duration-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.duration-badge.critical {
  background: #fee2e2;
  color: #991b1b;
}

.long-term {
  background-color: #fef2f2;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-small {
  padding: 4px 12px;
  font-size: 11px;
  border-radius: 6px;
  cursor: pointer;
  border: none;
}

.btn-small.warning {
  background: #f59e0b;
  color: white;
}

.btn-small.warning:hover:not(:disabled) {
  background: #d97706;
}

/* Notes Tooltip */
.notes-tooltip {
  position: relative;
  display: inline-block;
  cursor: help;
}

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
  font-size: 14px;
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
  max-width: 300px;
  font-size: 11px;
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

.penalty-note {
  color: #f87171;
  font-size: 10px;
  margin-left: 8px;
}

.warning-banner {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.warning-icon {
  font-size: 20px;
}

.warning-content {
  font-size: 13px;
  color: #92400e;
}

.bulk-release-container {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.bulk-release-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #eff6ff;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
  flex-wrap: wrap;
}

.selected-count {
  font-size: 13px;
  font-weight: 500;
  color: #1e40af;
}

.total-amount {
  margin-left: 12px;
  font-weight: 600;
  color: #10b981;
}

.bulk-buttons {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.bulk-summary {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.bulk-preview {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
}

.preview-header {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 12px;
  color: #1e293b;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.monthly-breakdown {
  margin: 20px 0;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.monthly-breakdown h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e293b;
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.breakdown-table th,
.breakdown-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.breakdown-table th {
  background: #f8fafc;
  font-weight: 600;
}

.total-row {
  background: #f8fafc;
  font-weight: 600;
}

.months-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.month-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}

.month-checkbox:hover {
  background: #f8fafc;
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
  max-width: 650px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.release-modal {
  max-width: 650px;
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
}

.preview-section {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
}

.text-green {
  color: #10b981;
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
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
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

.empty-state-cell {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
</style>