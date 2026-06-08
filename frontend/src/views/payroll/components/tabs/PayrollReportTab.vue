<template>
  <div class="section-card">
    <div class="card-header">
<div class="header-title">
  <h2>Payroll Report - {{ formatMonth(selectedMonth) }}</h2>
 <div class="month-selector">
  <select v-model="selectedYear" class="year-select" @change="changeMonth">
    <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
  </select>
  <select v-model="selectedMonthNum" class="month-select" @change="changeMonth">
    <option 
      v-for="month in 12" 
      :key="month" 
      :value="month"
      :disabled="isFutureMonth(month)"
    >
      {{ getMonthName(month) }}
    </option>
  </select>
</div>
</div>










      <div class="header-filters">
        <div class="dropdown-card" ref="deptDropdownRef">
          <button
            class="dropdown-trigger"
            @click.stop="showDeptDropdown = !showDeptDropdown"
          >
            <span>🏢</span>
            <span>{{ selectedDeptName || "All Departments" }}</span>
            <span>▼</span>
          </button>
          <div v-if="showDeptDropdown" class="dropdown-menu-card">
            <div class="dropdown-header">Filter by Department</div>
            <div
              class="dropdown-item"
              :class="{ active: selectedDept === null }"
              @click="selectDept(null)"
            >
              <span>📁</span> All Departments
              <span class="count">{{ employees.length }}</span>
            </div>
            <div class="dropdown-divider"></div>
            <div
              v-for="dept in departments"
              :key="dept"
              class="dropdown-item"
              :class="{ active: selectedDept === dept }"
              @click="selectDept(dept)"
            >
              <span>🏢</span> {{ dept }}
              <span class="count">{{ getDeptCount(dept) }}</span>
            </div>
          </div>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="payrollSearch"
            placeholder="Search employee..."
          />
        </div>
        <button class="btn-export" @click="openExportModal" :disabled="exporting">
          <span v-if="exporting" class="spinner-small"></span>
          <span v-else>📊</span>
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
      </div>
    </div>

    <div class="table-container">
      <table class="payroll-table">
        <thead>
          <tr>
            <th style="width: 35px"></th>
            
            <th>Employee</th>
            <th>Dept</th>
            <th class="text-right">Basic</th>
            <th class="text-right">Allowances</th>
            <th class="text-right">Gross</th>
            <th class="text-right">Tax</th>
            <th class="text-right">Pension</th>
            <th class="text-right">Net</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(emp, idx) in paginatedPayrollData" :key="emp.id">
            <tr
              :class="{
                'expanded-row': expandedRow === emp.id,
                'on-hold-row': emp.isOnHold,
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(emp.id)">
                  {{ expandedRow === emp.id ? "▼" : "▶" }}
                </button>
              </td>
             
              <td class="employee-cell">
                <strong>{{ emp.fullName }}</strong>
                <div class="employee-code">{{ emp.employeeCode }}</div>
              </td>
              <td>{{ emp.department }}</td>
              <td class="text-right">{{ formatCurrency(emp.basicSalary) }}</td>
              <td class="text-right">{{ formatCurrency(emp.allowancesTotal) }}</td>
              <td class="text-right"><strong>{{ formatCurrency(emp.grossPay) }}</strong></td>
              <td class="text-right tax">{{ formatCurrency(emp.tax) }}</td>
              <td class="text-right pension">{{ formatCurrency(emp.pension7) }}</td>
              <td class="text-right net">{{ formatCurrency(emp.governmentNet) }}</td>
              <td>
                <span v-if="emp.isOnHold" class="badge-hold">HOLD</span>
                <span v-else class="badge-active">Active</span>
              </td>
              <td>
                <button class="icon-btn" @click="editEmployeePenality(emp)" title="Edit">✏️</button>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr v-if="expandedRow === emp.id" class="detail-expand-row">
              <td colspan="12">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- First row: 2 cards -->
                    <div class="detail-row-two-cols">
                      <!-- Card 1: Income & Allowances -->
                      <div class="detail-card">
                        <h4>Income & Allowances</h4>
                        <div><span>Basic Salary</span><span>{{ formatCurrency(emp.basicSalary) }}</span></div>
                        <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap">
                          <div style="background: #e3f2fd; padding: 4px 10px; border-radius: 20px">
                            <span style="font-size: 11px; color: #666">Daily Rate</span>
                            <strong style="color: #1976d2; margin-left: 4px">{{ formatCurrency(emp.dailyRate) }}</strong>
                          </div>
                          <div style="background: #e3f2fd; padding: 4px 10px; border-radius: 20px">
                            <span style="font-size: 11px; color: #666">Hourly Rate</span>
                            <strong style="color: #1976d2; margin-left: 4px">{{ formatCurrency(emp.hourlyRate) }}</strong>
                          </div>
                          <div style="background: #e3f2fd; padding: 4px 10px; border-radius: 20px">
                            <span style="font-size: 11px; color: #666">Working Days</span>
                            <strong style="color: #1976d2; margin-left: 4px">{{ emp.totalDaysInMonth || 30 }}</strong>
                          </div>
                        </div>
                        <div><span>Housing Allowance</span><span>{{ formatCurrency(emp.housingAllowance) }}</span></div>
                        <div><span>Transport Allowance</span><span>{{ formatCurrency(emp.transportAllowance) }}</span></div>
                        <div><span>Position Allowance</span><span>{{ formatCurrency(emp.positionAllowance) }}</span></div>
                        <div><span>Mobile Allowance</span><span>{{ formatCurrency(emp.mobileAllowance) }}</span></div>
                        <div>
                          <span>
                            Total Allowances
                            <span class="allowance-badge" v-if="emp.allowanceCalculationMethod === 'proportional'">
                              ⚠️ Proportional ({{ (emp.allowanceFactor * 100).toFixed(0) }}% of full)
                            </span>
                            <span class="allowance-badge success" v-else>✓ Full (100%)</span>
                          </span>
                          <span>{{ formatCurrency(emp.allowancesTotal) }}</span>
                        </div>
                        <div><span>Overtime Hours</span><span>{{ emp.overtimeHours || 0 }} hrs</span></div>
                        <div><span>Overtime Pay</span><span>{{ formatCurrency(emp.overtimePay) }}</span></div>
                        <div class="total"><span>Gross Pay</span><span>{{ formatCurrency(emp.grossPay) }}</span></div>
                      </div>

                      <!-- Card 2: Penalties -->
                      <div class="detail-card">
                        <h4>Penalties</h4>
                        <div><span>Absent Days</span><span class="text-red">{{ emp.absentDays || 0 }} days</span></div>
                        <div><span>Absent Penalty Amount</span><span class="text-red">{{ formatCurrency(emp.absentPenalty || 0) }}</span></div>
                        <div><span>Late Minutes</span><span class="text-red">{{ emp.lateMinutes || 0 }} min</span></div>
                        <div><span>Late Penalty Amount</span><span class="text-red">{{ formatCurrency(emp.latePenalty || 0) }}</span></div>
                        <div class="total"><span>Total Penalties (Display Only)</span><span class="text-red">{{ formatCurrency(emp.totalPenalties) }}</span></div>
                        <div class="penalty-note" style="font-size: 11px; color: #666; margin-top: 8px">
                          * Absent deducted BEFORE tax | Late deducted AFTER tax
                        </div>
                      </div>
                    </div>

                    <!-- Second row: 2 cards -->
                    <div class="detail-row-two-cols">
                      <!-- Card 3: Tax & Pension -->
                      <div class="detail-card">
                        <h4>Tax & Pension</h4>
                        <div><span>Tax Rate</span><span class="text-info">{{ emp.taxRate }}%</span></div>
                        <div><span>Tax Penality</span><span class="text-info">{{ formatCurrency(emp.taxPenality) }}</span></div>
                        <div><span>Tax Bracket</span><span class="text-muted">{{ emp.taxBracketRange }}</span></div>
                        <div>
                          <span>Taxable Income <span class="penalty-note" style="font-size: 11px; color: #666">(Gross Salary - Absent Penalty)</span></span>
                          <span class="text-info">{{ formatCurrency(emp.taxableIncome) }}</span>
                        </div>
                        <div><span>Tax Formula</span><span class="text-muted small">{{ emp.taxCalculationFormula }}</span></div>
                        <div><span>Income Tax (PAYE)</span><span class="text-orange">{{ formatCurrency(emp.tax) }}</span></div>
                        <div>
                          <span>Pension (7% Employee) - <span class="penalty-note" style="font-size: 11px; color: #666">
                            {{ emp.pensionCalculationMethod === "proportional" ? "Proportional (worked <15 days)" : "Full (on basic salary)" }}
                          </span></span>
                          <span>{{ formatCurrency(emp.pension7) }}</span>
                        </div>
                        <div>
                          <span>Pension (11% Company) - <span class="penalty-note" style="font-size: 11px; color: #666">
                            {{ emp.pensionCalculationMethod === "proportional" ? "Proportional (worked <15 days)" : "Full (on basic salary)" }}
                          </span></span>
                          <span class="text-purple">{{ formatCurrency(emp.pension11) }}</span>
                        </div>
                        <div class="total"><span>Government Net</span><span class="text-purple">{{ formatCurrency(emp.governmentNet) }}</span></div>
                        <div class="penalty-note" style="font-size: 11px; color: #666; margin-top: 8px">
                          * Government Net = Taxable Income - Income Tax - Pension(7% Employee)
                        </div>
                      </div>

                      <!-- Card 4: Other Penalties -->
                      <div class="detail-card penalties-card">
                        <h4>📋 Other Penalties</h4>
                        <div class="penalties-stack">
                          <div v-for="ded in emp.Penality || []" :key="ded.id" class="penalty-stack">
                            <div class="stack-header">
                              <span class="stack-name">{{ ded.name }}</span>
                              <span class="stack-badge" :class="ded.type === 'percent' ? 'badge-percent' : 'badge-fixed'">
                                {{ ded.type === "percent" ? ded.value + "%" : formatCurrency(ded.value) }}
                              </span>
                            </div>
                            <div v-if="ded.type === 'percent'" class="stack-amount-info">
                              <span class="amount-label">Equals:</span>
                              <span class="amount-value">{{ formatCurrency(ded.amount) }}</span>
                            </div>
                            <div class="stack-meta">
                              <span v-if="ded.reference" class="meta-item">📄 {{ ded.reference }}</span>
                              <span v-if="ded.submittedBy" class="meta-item">👤 {{ ded.submittedBy }}</span>
                              <span v-if="ded.contact" class="meta-item">📞 {{ ded.contact }}</span>
                              <span v-if="ded.date" class="meta-item">📅 {{ formatDate(ded.date) }}</span>
                            </div>
                            <div v-if="ded.reason" class="stack-reason">💬 {{ ded.reason }}</div>
                          </div>
                          <div v-if="!emp.Penality || emp.Penality.length === 0" class="empty-state">✨ No penalties recorded</div>
                        </div>
                        <div class="total-stack" v-if="emp.Penality && emp.Penality.length">
                          <span>Total Penalties</span>
                          <strong>{{ formatCurrency(emp.otherPenalityTotal || 0) }}</strong>
                        </div>
                      </div>
                    </div>

                    <!-- Third row: Final Net Pay Card -->
                    <div class="final-net-card">
                      <h4>Final Net Pay Calculation</h4>
                      <div class="calculation-summary">
                        <div class="calc-row"><span>Government Net</span><span>{{ formatCurrency(emp.governmentNet) }}</span></div>
                        <div class="calc-row" v-if="emp.latePenalty > 0">
                          <span>Late Penalty</span><span class="text-red">- {{ formatCurrency(emp.latePenalty) }}</span>
                        </div>
                        <div class="calc-row" v-if="(emp.otherPenalityTotal || 0) > 0">
                          <span>Other Penality</span><span class="text-red">- {{ formatCurrency(emp.otherPenalityTotal || 0) }}</span>
                        </div>
                        <div class="calc-divider"></div>
                        <div class="calc-row final">
                          <span><strong>Final Net Pay</strong></span>
                          <span class="final-amount"><strong>{{ formatCurrency(emp.finalNetPay) }}</strong></span>
                        </div>
                      </div>
                      <div class="calculation-note" style="font-size: 11px; color: #666; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee">
                        <strong>Calculation Note:</strong> Absent penalty is deducted from Basic Salary BEFORE tax calculation. Late penalty is deducted from Government Net AFTER tax calculation.
                      </div>
                      <div v-if="emp.isOnHold" class="hold-note">⏸️ ON HOLD - {{ emp.holdDetails?.reason }}</div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="filteredPayrollData.length === 0">
            <td colspan="12" class="empty-state-cell">
              <div class="empty-state-content">
                <div class="empty-icon">📭</div>
                <p>No payroll data found for {{ formatMonth(selectedMonth) }}</p>
                <p class="empty-sub">Process payroll to generate data</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="payrollPagination.totalPages > 1">
      <button class="page-btn" :disabled="payrollPagination.page === 1" @click="changePayrollPage(payrollPagination.page - 1)">← Previous</button>
      <span class="page-info">Page {{ payrollPagination.page }} of {{ payrollPagination.totalPages }}</span>
      <button class="page-btn" :disabled="payrollPagination.page === payrollPagination.totalPages" @click="changePayrollPage(payrollPagination.page + 1)">Next →</button>
      <select v-model="payrollPagination.limit" @change="changePayrollLimit" class="limit-select">
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>
  </div>

  <!-- ==================== PENALTY MODAL ==================== -->
  <div v-if="showPenalityModal" class="modal-overlay" @click.self="closePenalityModal">
    <div class="modal-container Penality-modal">
      <div class="modal-header">
        <div class="employee-info-compact">
          <div class="emp-avatar">{{ getInitials(editingEmployee?.fullName) }}</div>
          <div>
            <strong>{{ editingEmployee?.fullName }}</strong>
            <div class="emp-meta">{{ editingEmployee?.employeeCode }} • {{ editingEmployee?.department }}</div>
          </div>
        </div>
        <button class="modal-close" @click="closePenalityModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-field">
          <label class="checkbox-label">
            <input type="checkbox" v-model="hasHold" /> Apply Salary Hold (up to 6 months)
          </label>
          <div v-if="hasHold" class="hold-details">
            <div class="duration-buttons">
              <button v-for="n in 6" :key="n" :class="['duration-btn', { active: holdDuration === n }]" @click="holdDuration = n">{{ n }}m</button>
            </div>
            <input type="text" v-model="holdReason" placeholder="Reason for hold" class="form-input" />
            <button class="btn-warning-small" @click="removeEmployeeHold">Remove Hold</button>
          </div>
        </div>

        <div class="Penality-list">
          <div v-for="(ded, idx) in employeePenality" :key="idx" class="Penality-item">
            <div class="Penality-header">
              <span>{{ ded.name || "New Penality" }}</span>
              <button class="remove-btn" @click="removePenality(idx)">✕</button>
            </div>
            <div class="Penality-fields">
              <select v-model="ded.name">
                <option value="">Select penalty reason...</option>
                <option value="Absent Penalty">Absent Penalty</option>
                <option value="Lateness">Lateness</option>
                <option value="Unauthorized Leave">Unauthorized Leave</option>
                <option value="Poor Performance">Poor Performance</option>
                <option value="Policy Violation">Policy Violation</option>
                <option value="Asset Penalty">Asset Penalty</option>
                <option value="Misconduct">Misconduct</option>
                <option value="Suspension">Suspension</option>
              </select>
              <input type="text" v-model="ded.reference" placeholder="Hardcopy Reference #" />
              <input type="text" v-model="ded.submittedBy" placeholder="Submitted By" />
              <input type="text" v-model="ded.contact" placeholder="Contact" />
              <select v-model="ded.type">
                <option value="fixed">Fixed Amount (ETB)</option>
                <option value="percent">Percentage (%)</option>
              </select>
              <input type="number" v-model="ded.value" placeholder="Amount" />
              <textarea v-model="ded.reason" placeholder="Reason for penalty/Penalty..." rows="2"></textarea>
            </div>
          </div>
          <button class="add-btn" @click="addPenality">+ Add Penalty</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closePenalityModal">Cancel</button>
        <button class="btn-primary" @click="savePenality" :disabled="savingPenality">
          {{ savingPenality ? "Saving..." : "Save Changes" }}
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== EXPORT MODAL ==================== -->
  <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
    <div class="modal-container export-modal">
      <div class="modal-header">
        <h3>Export Payroll Report</h3>
        <button class="modal-close" @click="closeExportModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="export-options">
          <div class="export-option" @click="exportType = 'government'">
            <input type="radio" v-model="exportType" value="government" /> Government Report (Tax & Pension)
          </div>
          <div class="export-option" @click="exportType = 'internal'">
            <input type="radio" v-model="exportType" value="internal" /> Internal Report (Bank Transfer)
          </div>
          <div class="export-option" @click="exportType = 'full'">
            <input type="radio" v-model="exportType" value="full" /> Full Comparison Report
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeExportModal">Cancel</button>
        <button class="btn-primary" @click="exportSelectedReport" :disabled="exporting">
          {{ exporting ? "Exporting..." : "Export" }}
        </button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div v-if="showToast" class="toast" :class="toastType">
    <span>{{ toastMessage }}</span>
  </div>
</template>

      <script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import payrollService from "@/stores/payrollService";
import employeePenaltyService from "@/stores/employeePenaltyService";

// Props & Emits
const emit = defineEmits(['update-stats']);

// ==================== CONSTANTS ====================
const WORKING_DAYS = 22;
const HOURLY_FACTOR = WORKING_DAYS * 8;
const ALLOWANCE_RATE = 0.45;
const PENSION_RATE = 0.07;
const COMPANY_PENSION_RATE = 0.11;
const currentUser = "HR Admin";

const taxBrackets = [
  { min: 0, max: 600, rate: 0 },
  { min: 601, max: 1650, rate: 10 },
  { min: 1651, max: 3200, rate: 15 },
  { min: 3201, max: 5250, rate: 20 },
  { min: 5251, max: 7800, rate: 25 },
  { min: 7801, max: 10900, rate: 30 },
  { min: 10901, max: Infinity, rate: 35 },
];

const departments = ["IT", "Finance", "Operations", "HR"];

// ==================== STATE ====================
const selectedMonth = computed(() => {
  return `${selectedYear.value}-${String(selectedMonthNum.value).padStart(2, '0')}`;
});
const payrollData = ref([]);
const Penality = ref([]);
const holds = ref([]);
const carryForward = ref([]);
const penaltiesList = ref([]);

// UI State
const expandedRow = ref(null);
const showDeptDropdown = ref(false);
const deptDropdownRef = ref(null);
const loading = ref(false);

// Filters
const payrollSearch = ref("");
const selectedDept = ref(null);

// ==================== MONTH SELECTOR STATE ====================
const currentDate = new Date();
const selectedYear = ref(currentDate.getFullYear());
const selectedMonthNum = ref(currentDate.getMonth() + 1);

// Generate years from 2020 to 2030
// Replace the existing availableYears computed
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // Start from 2020 up to current year only
  for (let y = 2020; y <= currentYear; y++) {
    years.push(y);
  }
  return years;
});

// Add this computed property
const isMonthValid = computed(() => {
  const selected = new Date(selectedYear.value, selectedMonthNum.value - 1);
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  
  // Check if selected date is in the future (beyond current month)
  const currentYearMonth = new Date(current.getFullYear(), current.getMonth());
  return selected <= currentYearMonth;
});

// Pagination
const payrollPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

// Modal States
const showPenalityModal = ref(false);
const showExportModal = ref(false);

// Modal Data
const editingEmployee = ref(null);
const employeePenality = ref([]);
const hasHold = ref(false);
const holdDuration = ref(1);
const holdReason = ref("");
const exportType = ref("government");

// UI Flags
const exporting = ref(false);
const savingPenality = ref(false);

// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// ==================== COMPUTED ====================
const selectedDeptName = computed(() => selectedDept.value || null);

const filteredPayrollData = computed(() => {
  let data = payrollData.value;
  if (payrollSearch.value) {
    data = data.filter((e) =>
      e.fullName?.toLowerCase().includes(payrollSearch.value.toLowerCase())
    );
  }
  if (selectedDept.value) {
    data = data.filter((e) => e.department === selectedDept.value);
  }
  payrollPagination.value.total = data.length;
  payrollPagination.value.totalPages = Math.ceil(data.length / payrollPagination.value.limit) || 1;
  return data;
});

const paginatedPayrollData = computed(() => {
  const start = (payrollPagination.value.page - 1) * payrollPagination.value.limit;
  return filteredPayrollData.value.slice(start, start + payrollPagination.value.limit);
});

const employees = computed(() => payrollData.value);
const currentPenalityTotal = computed(() =>
  employeePenality.value.reduce(
    (s, d) =>
      s +
      (d.type === "percent"
        ? Math.floor(((editingEmployee.value?.governmentNet || 0) * d.value) / 100)
        : d.value || 0),
    0
  )
);

// ==================== HELPER FUNCTIONS ====================

// Add these helper functions
function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

function isFutureMonth(month) {
  if (selectedYear.value > new Date().getFullYear()) return true;
  if (selectedYear.value === new Date().getFullYear() && month > new Date().getMonth() + 1) return true;
  return false;
}
function formatCurrency(amt) {
  return payrollService.formatCurrency(amt);
}

function formatDate(d) {
  return payrollService.formatDate(d);
}

function formatMonth(m) {
  return payrollService.formatMonth(m);
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function showToastMessage(msg, type) {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

function getDeptCount(dept) {
  return payrollData.value.filter((e) => e.department === dept).length;
}

function downloadCSV(data, filename) {
  const csv = data.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== TAX CALCULATION ====================
function calculateTax(income) {
  let tax = 0,
    remaining = income;
  for (const b of taxBrackets) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, b.max) - b.min + 1;
    if (taxable > 0) {
      tax += (taxable * b.rate) / 100;
      remaining -= taxable;
    }
  }
  return Math.floor(Math.max(0, tax));
}

// ==================== LOAD DATA ====================
async function loadPayrollData() {
  loading.value = true;
  try {
    const [year, month] = selectedMonth.value.split("-");
    const result = await payrollService.getPayrollData({
      year: parseInt(year),
      month: parseInt(month),
      department: selectedDept.value || undefined,
      search: payrollSearch.value || undefined,
    });

    if (result.success && result.data && result.data.length > 0) {
      payrollData.value = result.data;
      // Emit stats to parent
      const totalGross = payrollData.value.reduce((s, e) => s + (e.grossPay || 0), 0);
      const totalTax = payrollData.value.reduce((s, e) => s + (e.tax || 0), 0);
      const totalPension7 = payrollData.value.reduce((s, e) => s + (e.pension7 || 0), 0);
      const totalPension11 = payrollData.value.reduce((s, e) => s + (e.pension11 || 0), 0);
      const activeHolds = payrollData.value.filter((e) => e.isOnHold).length;
      
      emit('update-stats', {
        employees: payrollData.value.length,
        grossPay: totalGross,
        tax: totalTax,
        pension7: totalPension7,
        pension11: totalPension11,
        activeHolds: activeHolds
      });
    } else {
      calculatePayroll();
    }
  } catch (error) {
    console.error("Error loading payroll data:", error);
    calculatePayroll();
  } finally {
    loading.value = false;
  }
}
// Replace the existing changeMonth function
function changeMonth() {
  // Check if selected month is valid (not future)
  const selected = new Date(selectedYear.value, selectedMonthNum.value - 1);
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  const currentYearMonth = new Date(current.getFullYear(), current.getMonth());
  
  if (selected > currentYearMonth) {
    // Reset to current month if trying to select future month
    const now = new Date();
    selectedYear.value = now.getFullYear();
    selectedMonthNum.value = now.getMonth() + 1;
    showToastMessage("Cannot select future months. Only current and past months are allowed.", "error");
    return;
  }
  
  loadPayrollData();
}

// Demo data calculation (fallback)
function calculatePayroll() {
  const employeesData = [
    { id: 1, employeeCode: "EMP001", fullName: "Biruk Mulualem", department: "IT", basicSalary: 25000, position: "Senior Developer" },
    { id: 2, employeeCode: "EMP002", fullName: "Dagmawi Hadgu", department: "IT", basicSalary: 35000, position: "Team Lead" },
    { id: 3, employeeCode: "EMP003", fullName: "Melkamu Zewdu", department: "Operations", basicSalary: 28000, position: "Manager" },
    { id: 4, employeeCode: "EMP004", fullName: "Melaku Tewodros", department: "Finance", basicSalary: 32000, position: "Finance Manager" },
    { id: 5, employeeCode: "EMP005", fullName: "Tamrat Zerihun", department: "IT", basicSalary: 18000, position: "Developer" },
    { id: 6, employeeCode: "EMP006", fullName: "Nuru Seid", department: "Finance", basicSalary: 15000, position: "Accountant" },
    { id: 7, employeeCode: "EMP007", fullName: "Tadese Jemberu", department: "Operations", basicSalary: 12000, position: "Coordinator" },
    { id: 8, employeeCode: "EMP008", fullName: "Eshete Worke", department: "IT", basicSalary: 22000, position: "System Admin" },
    { id: 9, employeeCode: "EMP009", fullName: "Haymanot Abebaw", department: "HR", basicSalary: 30000, position: "HR Manager" },
  ];

  payrollData.value = employeesData.map((emp) => {
    const allowancesTotal = Math.floor(emp.basicSalary * ALLOWANCE_RATE);
    const housingAllowance = Math.floor(emp.basicSalary * 0.2);
    const transportAllowance = Math.floor(emp.basicSalary * 0.1);
    const positionAllowance = Math.floor(emp.basicSalary * 0.15);
    const mobileAllowance = Math.floor(emp.basicSalary * 0.05);
    const overtimeHours = Math.floor(Math.random() * 12);
    const hourlyRate = emp.basicSalary / HOURLY_FACTOR;
    const overtimePay = Math.floor(hourlyRate * overtimeHours * 1.5);
    const grossPay = emp.basicSalary + allowancesTotal + overtimePay;
    const tax = calculateTax(grossPay);
    const pension7 = Math.floor(emp.basicSalary * PENSION_RATE);
    const pension11 = Math.floor(emp.basicSalary * COMPANY_PENSION_RATE);
    const governmentNet = grossPay - tax - pension7;
    const finalNetPay = governmentNet;

    return {
      ...emp,
      allowancesTotal,
      housingAllowance,
      transportAllowance,
      positionAllowance,
      mobileAllowance,
      overtimeHours,
      overtimePay,
      grossPay,
      tax,
      pension7,
      pension11,
      governmentNet,
      finalNetPay,
      isOnHold: false,
      Penality: [],
      otherPenalityTotal: 0,
      absentDays: 0,
      absentPenalty: 0,
      lateMinutes: 0,
      latePenalty: 0,
      totalPenalties: 0,
      dailyRate: emp.basicSalary / 30,
      hourlyRate: emp.basicSalary / (30 * 8),
      totalDaysInMonth: 30,
      allowanceCalculationMethod: 'full',
      allowanceFactor: 1,
      taxRate: 0,
      taxPenality: 0,
      taxBracketRange: '',
      taxableIncome: grossPay,
      taxCalculationFormula: '',
      pensionCalculationMethod: 'full'
    };
  });
}

// ==================== PENALTY FUNCTIONS ====================
function editEmployeePenality(emp) {
  editingEmployee.value = emp;
  employeePenality.value = (emp.Penality || []).map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    value: p.value,
    reference: p.reference || "",
    submittedBy: p.submittedBy || currentUser,
    contact: p.contact || "",
    reason: p.reason || "",
    date: p.date || new Date().toISOString().split("T")[0],
  }));

  if (!employeePenality.value.length) {
    employeePenality.value.push({
      id: Date.now(),
      name: "",
      type: "fixed",
      value: 0,
      reason: "",
      reference: "",
      submittedBy: currentUser,
      contact: "",
      date: new Date().toISOString().split("T")[0],
    });
  }

  const existingHold = holds.value.find(
    (h) => h.employeeId === emp.id && h.startMonth === selectedMonth.value
  );
  if (existingHold) {
    hasHold.value = true;
    holdDuration.value = existingHold.duration;
    holdReason.value = existingHold.reason;
  } else {
    hasHold.value = false;
    holdDuration.value = 1;
    holdReason.value = "";
  }
  showPenalityModal.value = true;
}

function addPenality() {
  employeePenality.value.push({
    id: Date.now(),
    name: "",
    type: "fixed",
    value: 0,
    reason: "",
    reference: "",
    submittedBy: currentUser,
    contact: "",
    date: new Date().toISOString().split("T")[0],
  });
}

function removePenality(idx) {
  employeePenality.value.splice(idx, 1);
}

function removeEmployeeHold() {
  holds.value = holds.value.filter((h) => h.employeeId !== editingEmployee.value.id);
  hasHold.value = false;
  calculatePayroll();
  showToastMessage("Hold removed", "success");
}

async function savePenality() {
  savingPenality.value = true;
  try {
    const validPenalties = employeePenality.value.filter((d) => d.name && d.value > 0);

    const existingPenalties = await employeePenaltyService.getEmployeePenalties(
      editingEmployee.value.id,
      { month: selectedMonth.value, status: 'active' }
    );

    if (existingPenalties.success && existingPenalties.data) {
      for (const penalty of existingPenalties.data) {
        await employeePenaltyService.deletePenalty(penalty.penalty_id);
      }
    }

    for (const penalty of validPenalties) {
      await employeePenaltyService.createPenalty(editingEmployee.value.id, {
        penalty_type: penalty.name,
        calculation_type: penalty.type === "percent" ? "percent" : "fixed",
        value: penalty.value,
        reference: penalty.reference,
        submitted_by: penalty.submittedBy || currentUser,
        contact: penalty.contact,
        reason: penalty.reason,
        month: selectedMonth.value,
      });
    }

    await loadPayrollData();
    showToastMessage(`${validPenalties.length} penalty/penalties saved!`, "success");
    closePenalityModal();
  } catch (error) {
    console.error("Save penalties error:", error);
    showToastMessage("Failed to save penalties", "error");
  } finally {
    savingPenality.value = false;
  }
}

function closePenalityModal() {
  showPenalityModal.value = false;
  editingEmployee.value = null;
  employeePenality.value = [];
}

// ==================== EXPORT FUNCTIONS ====================
function openExportModal() {
  showExportModal.value = true;
}

function closeExportModal() {
  showExportModal.value = false;
}

function exportSelectedReport() {
  exporting.value = true;
  setTimeout(() => {
    let headers = [], rows = [];
    if (exportType.value === "government") {
      headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Housing Allowance", "Transport Allowance", "Position Allowance", "Mobile Allowance", "OT Pay", "Gross Pay", "Absent Days", "Absent Penalty", "Tax (PAYE)", "Pension (7%)", "Pension (11%)", "Net Pay"];
      rows = filteredPayrollData.value.map((e) => [
        e.employeeCode, e.fullName, e.department, e.basicSalary, e.housingAllowance,
        e.transportAllowance, e.positionAllowance, e.mobileAllowance, e.overtimePay,
        e.grossPay, e.absentDays || 0, e.absentPenalty || 0, e.tax, e.pension7, e.pension11, e.governmentNet
      ]);
    } else if (exportType.value === "internal") {
      headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Gross Pay", "Tax", "Pension", "Total Penalties", "Other Penality", "Final Net Pay"];
      rows = filteredPayrollData.value.map((e) => [
        e.employeeCode, e.fullName, e.department, e.basicSalary, e.grossPay,
        e.tax, e.pension7, e.totalPenalties, e.otherPenalityTotal, e.finalNetPay
      ]);
    } else {
      headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Gross Pay", "Government Net", "Total Penalties", "Other Penality", "Final Net Pay", "Difference"];
      rows = filteredPayrollData.value.map((e) => [
        e.employeeCode, e.fullName, e.department, e.basicSalary, e.grossPay,
        e.governmentNet, e.totalPenalties, e.otherPenalityTotal, e.finalNetPay,
        e.governmentNet - e.finalNetPay
      ]);
    }
    downloadCSV([headers, ...rows], `${exportType.value}_report_${selectedMonth.value}.csv`);
    exporting.value = false;
    closeExportModal();
    showToastMessage("Export completed!", "success");
  }, 500);
}

// ==================== UI HANDLERS ====================
function toggleExpand(id) {
  expandedRow.value = expandedRow.value === id ? null : id;
}

function selectDept(dept) {
  selectedDept.value = dept;
  showDeptDropdown.value = false;
  payrollPagination.value.page = 1;
  loadPayrollData();
}

function changePayrollPage(page) {
  payrollPagination.value.page = page;
}

function changePayrollLimit() {
  payrollPagination.value.page = 1;
  payrollPagination.value.limit = parseInt(payrollPagination.value.limit);
}

function handleClickOutside(event) {
  if (deptDropdownRef.value && !deptDropdownRef.value.contains(event.target)) {
    showDeptDropdown.value = false;
  }
}

// ==================== WATCHERS ====================
watch([payrollSearch, selectedDept], () => {
  payrollPagination.value.page = 1;
  loadPayrollData();
});

// Listen for global refresh events
function handleRefreshAllTabs() {
  loadPayrollData();
}

// Add this after other watch statements
watch([selectedYear, selectedMonthNum], ([newYear, newMonth]) => {
  const selected = new Date(newYear, newMonth - 1);
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  const currentYearMonth = new Date(current.getFullYear(), current.getMonth());
  
  if (selected > currentYearMonth) {
    const now = new Date();
    selectedYear.value = now.getFullYear();
    selectedMonthNum.value = now.getMonth() + 1;
    showToastMessage("Cannot select future months. Reset to current month.", "error");
  }
});

// ==================== INITIALIZATION ====================
// Replace the existing init function
async function init() {

  await loadPayrollData();
}

onMounted(() => {
  init();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener('refresh-all-tabs', handleRefreshAllTabs);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener('refresh-all-tabs', handleRefreshAllTabs);
});
</script>

<style scoped>

.month-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.year-select, .month-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

.year-select:hover, .month-select:hover {
  background: #e2e8f0;
}







.header-title {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
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
.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.dropdown-card {
  position: relative;
}

.dropdown-trigger {
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.dropdown-menu-card {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 240px;
  margin-top: 8px;
  overflow: hidden;
}

.dropdown-header {
  padding: 10px 16px;
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.dropdown-item.active {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.dropdown-item .count {
  margin-left: auto;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
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

/* ==================== TABLE ==================== */
.table-container {
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

.badge-hold {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}

.badge-active {
  background: #d1fae5;
  color: #059669;
  padding: 4px 8px;
  border-radius: 20px;
  display: inline-block;
}

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
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin: 8px;
  border: 1px solid #e2e8f0;
}

/* ==================== DETAIL CARDS ==================== */
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-row-two-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.detail-card h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

.detail-card > div {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.detail-card .total {
  border-top: 2px solid #e2e8f0;
  border-bottom: none;
  margin-top: 8px;
  padding-top: 10px;
  font-weight: 600;
}

.allowance-badge {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  background: #fff3e0;
  color: #ed6c02;
  font-weight: normal;
  margin-left: 6px;
  vertical-align: middle;
}

.allowance-badge.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.text-muted {
  color: #757575;
}

.small {
  font-size: 11px;
}

/* Penalties Card */
.penalties-card {
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #edeff2;
}

.penalties-card h4 {
  margin: 0;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1a2c3e;
  background: #fafbfc;
  border-bottom: 1px solid #edeff2;
}

.penalties-stack {
  padding: 8px 12px;
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.penalties-stack::-webkit-scrollbar {
  width: 4px;
}

.penalties-stack::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.penalties-stack::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.penalty-stack {
  background: #fefefe;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.2s;
}

.penalty-stack:hover {
  border-color: #e2e8f0;
  background: #fafafa;
}

.stack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.stack-name {
  font-weight: 700;
  font-size: 14px;
  color: #1e293b;
}

.stack-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.badge-fixed {
  background: #fee2e2;
  color: #dc2626;
}

.badge-percent {
  background: #fef3c7;
  color: #d97706;
}

.stack-amount-info {
  margin-bottom: 8px;
  padding: 6px 0 6px 8px;
  border-left: 3px solid #f59e0b;
  background: #fffbeb;
  border-radius: 0 8px 8px 0;
}

.amount-label {
  font-size: 10px;
  color: #92400e;
  margin-right: 6px;
}

.amount-value {
  font-size: 13px;
  font-weight: 700;
  color: #d97706;
}

.stack-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
  padding: 6px 0;
  border-top: 1px dashed #f0f0f0;
  border-bottom: 1px dashed #f0f0f0;
}

.meta-item {
  font-size: 10px;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.stack-reason {
  font-size: 11px;
  color: #64748b;
  background: #f8fafc;
  padding: 8px 10px;
  border-radius: 8px;
  margin-top: 4px;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #94a3b8;
  font-size: 12px;
}

.total-stack {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fef2f2;
  border-top: 1px solid #fee2e2;
  font-size: 13px;
  font-weight: 500;
}

.total-stack strong {
  font-size: 16px;
  font-weight: 700;
  color: #dc2626;
}

/* Final Net Pay Card */
.final-net-card {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #10b981;
  margin-top: 8px;
}

.final-net-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: #065f46;
  text-align: center;
}

.calculation-summary {
  max-width: 400px;
  margin: 0 auto;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
}

.calc-row.final {
  font-weight: 800;
  font-size: 18px;
  margin-top: 8px;
}

.calc-divider {
  height: 1px;
  background: rgba(16, 185, 129, 0.3);
  margin: 4px 0;
}

.final-amount {
  font-size: 24px;
  font-weight: 800;
  color: #065f46;
}

.hold-note {
  background: #fee2e2;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  margin-top: 16px;
  color: #dc2626;
  font-size: 13px;
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
  max-width: 750px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
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

/* Penalty Modal */
.Penality-modal {
  max-width: 750px;
}

.employee-info-compact {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emp-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.emp-meta {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.Penality-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.Penality-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.Penality-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 500;
  font-size: 13px;
}

.Penality-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.Penality-fields select,
.Penality-fields input,
.Penality-fields textarea {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  width: 100%;
}

.Penality-fields textarea {
  grid-column: span 3;
  resize: vertical;
  font-family: inherit;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
  font-size: 14px;
  padding: 4px;
  border-radius: 4px;
}

.add-btn {
  width: 100%;
  padding: 10px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  color: #3b82f6;
  margin-top: 12px;
  transition: all 0.2s;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  margin-bottom: 12px;
}

.hold-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.duration-buttons {
  display: flex;
  gap: 8px;
}

.duration-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.duration-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-warning-small {
  padding: 6px 12px;
  font-size: 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* Export Modal */
.export-modal {
  max-width: 400px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
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

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f1f5f9;
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

/* ==================== FORM ELEMENTS ==================== */
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

/* ==================== EMPTY STATE ==================== */
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

/* ==================== TOAST ==================== */
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

/* ==================== TEXT COLORS ==================== */
.text-orange {
  color: #f59e0b;
}
.text-blue {
  color: #3b82f6;
}
.text-red {
  color: #ef4444;
}
.text-green {
  color: #10b981;
}
.text-purple {
  color: #8b5cf6;
}
.text-info {
  color: #3b82f6;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 900px) {
  .detail-row-two-cols {
    grid-template-columns: 1fr;
  }
  .Penality-fields {
    grid-template-columns: 1fr;
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
  .dropdown-trigger {
    width: 100%;
    justify-content: space-between;
  }
}
</style>