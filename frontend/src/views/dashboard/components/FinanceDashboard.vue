<template>
  <div class="finance-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 10h18M6 14h12M12 4v16M8 4h8M8 20h8M12 8v4M12 12v4"/>
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
          </svg>
        </div>
        <div>
          <h1>Finance Dashboard</h1>
          <p>Employee, Attendance & Payroll Overview</p>
        </div>
      </div>
      <div class="header-right">
        <div class="date-display">
          <span class="date-icon">📅</span>
          <span class="date-text">{{ formatDate(new Date()) }}</span>
        </div>
        <select v-model="selectedMonth" class="month-selector" @change="refreshData">
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">{{ m.name }}</option>
        </select>
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading finance data...</p>
    </div>

    <template v-else>
      <!-- KPI Cards Row 1 - Employee Stats -->
      <div class="stats-grid">
        <div class="stat-card" @click="goToEmployees">
          
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.total }}</div>
            <div class="stat-label">Total Employees</div>
            <div class="stat-sub">{{ employeeStats.active }} active</div>
          </div>
        </div>
        <div class="stat-card" @click="goToEmployees">
      
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.newHires }}</div>
            <div class="stat-label">New Hires</div>
            <div class="stat-sub">This month</div>
          </div>
        </div>
        <div class="stat-card" @click="goToEmployees">
         
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.terminations }}</div>
            <div class="stat-label">Terminations</div>
            <div class="stat-sub">This month</div>
          </div>
        </div>
        <div class="stat-card" @click="goToAttendance">
       
          <div class="stat-info">
            <div class="stat-value">{{ attendanceStats.avgAttendanceRate }}%</div>
            <div class="stat-label">Attendance Rate</div>
            <div class="stat-sub">{{ selectedMonthName }}</div>
          </div>
        </div>
        <div class="stat-card" @click="goToAttendance">
        
          <div class="stat-info">
            <div class="stat-value">{{ attendanceStats.totalAbsentDays }}</div>
            <div class="stat-label">Absent Days</div>
            <div class="stat-sub">{{ attendanceStats.lateCount }} late arrivals</div>
          </div>
        </div>
        <div class="stat-card" @click="goToPayroll">
     
          <div class="stat-info">
            <div class="stat-value">{{ formatCurrency(payrollStats.totalNetPay) }}</div>
            <div class="stat-label">Monthly Payroll</div>
            <div class="stat-sub">{{ formatCurrency(payrollStats.totalTax) }} tax</div>
          </div>
        </div>
      </div>

      <!-- KPI Cards Row 2 - Financial Summary -->
      <div class="summary-grid">
        <div class="summary-card">
      
          <div class="summary-content">
            <div class="summary-value">{{ formatCurrency(payrollStats.totalGrossPay) }}</div>
            <div class="summary-label">Gross Payroll</div>
            <div class="summary-trend">Before deductions</div>
          </div>
        </div>
        <div class="summary-card">
         
          <div class="summary-content">
            <div class="summary-value">{{ formatCurrency(payrollStats.totalPension7) }}</div>
            <div class="summary-label">Employee Pension (7%)</div>
            <div class="summary-trend">{{ formatCurrency(payrollStats.totalPension11) }} employer</div>
          </div>
        </div>
        <div class="summary-card">
         
          <div class="summary-content">
            <div class="summary-value">{{ formatCurrency(payrollStats.totalPenalties) }}</div>
            <div class="summary-label">Total Penalties</div>
            <div class="summary-trend">{{ payrollStats.employeesWithPenalties }} employees</div>
          </div>
        </div>
        <div class="summary-card">
       
          <div class="summary-content">
            <div class="summary-value">{{ payrollStats.employeesOnHold }}</div>
            <div class="summary-label">On Hold</div>
            <div class="summary-trend">{{ formatCurrency(payrollStats.holdAmount) }} withheld</div>
          </div>
        </div>
      </div>

      <!-- Main Analytics Grid -->
      <div class="analytics-grid">
        <!-- Department Payroll Summary -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon blue">🏢</div>
              <h3>Department Payroll Summary</h3>
            </div>
            <router-link to="/payroll" class="view-link">View Details →</router-link>
          </div>
          <div class="analytics-list hover-scroll">
            <div v-for="dept in departmentPayroll" :key="dept.name" class="analytics-item">
              <div class="item-rank">{{ dept.rank }}</div>
              <div class="item-name">{{ dept.name }}</div>
              <div class="item-stats">
                <span class="emp-count">{{ dept.employeeCount }} emp</span>
                <span class="payroll-amount">{{ formatCurrency(dept.totalPayroll) }}</span>
              </div>
              <div class="item-bar">
                <div class="bar-fill" :style="{ width: dept.percentage + '%', background: '#3b82f6' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attendance by Department -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon green">📊</div>
              <h3>Attendance by Department</h3>
            </div>
            <router-link to="/attendance" class="view-link">View Details →</router-link>
          </div>
          <div class="analytics-list hover-scroll">
            <div v-for="dept in departmentAttendance" :key="dept.name" class="analytics-item">
              <div class="item-rank">{{ dept.rank }}</div>
              <div class="item-name">{{ dept.name }}</div>
              <div class="item-stats">
                <span class="attendance-rate">{{ dept.attendanceRate }}%</span>
                <span class="absent-days">{{ dept.absentDays }} absent</span>
              </div>
              <div class="item-bar">
                <div class="bar-fill" :style="{ width: dept.attendanceRate + '%', background: '#10b981' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payroll Composition - Pie Chart -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon green">🥧</div>
              <h3>Payroll Composition</h3>
            </div>
            <router-link to="/payroll" class="view-link">View Details →</router-link>
          </div>
          <div class="pie-chart-container">
            <canvas ref="payrollCompositionChart"></canvas>
          </div>
          <div class="composition-legend">
            <div class="legend-item">
              <div class="color-box basic"></div>
              <div class="legend-text">
                <span class="legend-label">Basic Salary</span>
                <span class="legend-percent">65%</span>
                <span class="legend-amount">{{ formatCurrency(payrollComposition.basicSalary) }}</span>
              </div>
            </div>
            <div class="legend-item">
              <div class="color-box allowances"></div>
              <div class="legend-text">
                <span class="legend-label">Allowances</span>
                <span class="legend-percent">20%</span>
                <span class="legend-amount">{{ formatCurrency(payrollComposition.allowances) }}</span>
              </div>
            </div>
            <div class="legend-item">
              <div class="color-box overtime"></div>
              <div class="legend-text">
                <span class="legend-label">Overtime</span>
                <span class="legend-percent">8%</span>
                <span class="legend-amount">{{ formatCurrency(payrollComposition.overtime) }}</span>
              </div>
            </div>
            <div class="legend-item">
              <div class="color-box bonuses"></div>
              <div class="legend-text">
                <span class="legend-label">Bonuses</span>
                <span class="legend-percent">7%</span>
                <span class="legend-amount">{{ formatCurrency(payrollComposition.bonuses) }}</span>
              </div>
            </div>
          </div>
          <div class="total-payroll">
            <span>Total Monthly Payroll</span>
            <strong>{{ formatCurrency(payrollComposition.total) }}</strong>
          </div>
        </div>

        <!-- Payment Status -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon purple">💳</div>
              <h3>Payment Status</h3>
            </div>
            <router-link to="/payroll" class="view-link">View Details →</router-link>
          </div>
          <div class="payment-status-list">
            <div class="status-item">
              <div class="status-label">Paid</div>
              <div class="status-value">{{ paymentStatus.paid }}</div>
              <div class="status-bar"><div class="status-fill green" :style="{ width: paymentStatus.paidPercent + '%' }"></div></div>
            </div>
            <div class="status-item">
              <div class="status-label">Pending</div>
              <div class="status-value">{{ paymentStatus.pending }}</div>
              <div class="status-bar"><div class="status-fill orange" :style="{ width: paymentStatus.pendingPercent + '%' }"></div></div>
            </div>
            <div class="status-item">
              <div class="status-label">Unclaimed</div>
              <div class="status-value">{{ paymentStatus.unclaimed }}</div>
              <div class="status-bar"><div class="status-fill red" :style="{ width: paymentStatus.unclaimedPercent + '%' }"></div></div>
            </div>
            <div class="status-item">
              <div class="status-label">Returned</div>
              <div class="status-value">{{ paymentStatus.returned }}</div>
              <div class="status-bar"><div class="status-fill purple" :style="{ width: paymentStatus.returnedPercent + '%' }"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Sections - Two Column Layout -->
      <div class="two-column-layout">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Top 5 Highest Paid Employees -->
          <div class="section-card">
            <div class="section-header">
              <h3>🏆 Top 5 Highest Paid Employees</h3>
              <router-link to="/employees" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="(emp, idx) in highestPaid" :key="emp.id" class="list-item">
                  <div class="top-rank" :class="{ gold: idx === 0, silver: idx === 1, bronze: idx === 2 }">
                    {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1 }}
                  </div>
                  <div class="list-avatar">{{ getInitials(emp.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.name }}</div>
                    <div class="list-detail">{{ emp.position }} • {{ emp.department }}</div>
                  </div>
                  <div class="list-value">{{ formatCurrency(emp.salary) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Most Absent Employees -->
          <div class="section-card">
            <div class="section-header">
              <h3>⚠️ Most Absent Employees</h3>
              <router-link to="/attendance" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="(emp, idx) in mostAbsent" :key="emp.id" class="list-item absent-item">
                  <div class="top-rank">{{ idx + 1 }}</div>
                  <div class="list-avatar warning-avatar">{{ getInitials(emp.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.name }}</div>
                    <div class="list-detail">{{ emp.department }}</div>
                  </div>
                  <div class="list-value red">
                    <div class="absent-count">{{ emp.absentDays }} days</div>
                    <div class="penalty-amount">-{{ formatCurrency(emp.penalty) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- On Hold Employees -->
          <div class="section-card hold-card">
            <div class="section-header">
              <h3>⏸️ On Hold Salary</h3>
              <router-link to="/payroll" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="emp in onHoldEmployees" :key="emp.id" class="list-item hold-item">
                  <div class="list-avatar hold-avatar">{{ getInitials(emp.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.name }}</div>
                    <div class="list-detail">{{ emp.department }} • {{ emp.position }}</div>
                    <div class="hold-reason">{{ emp.holdReason }}</div>
                  </div>
                  <div class="list-value red">{{ formatCurrency(emp.amount) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Top 5 Late Employees -->
          <div class="section-card">
            <div class="section-header">
              <h3>⏰ Top 5 Late Employees</h3>
              <router-link to="/attendance" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="(emp, idx) in mostLate" :key="emp.id" class="list-item late-item">
                  <div class="top-rank">{{ idx + 1 }}</div>
                  <div class="list-avatar late-avatar">{{ getInitials(emp.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.name }}</div>
                    <div class="list-detail">{{ emp.department }}</div>
                  </div>
                  <div class="list-value orange">
                    <div class="late-count">{{ emp.lateMinutes }} min</div>
                    <div class="late-times">{{ emp.lateCount }} times</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Leave Requests -->
          <div class="section-card">
            <div class="section-header">
              <h3>📋 Pending Leave Requests</h3>
              <router-link to="/leaves" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="leave in pendingLeaves" :key="leave.id" class="list-item">
                  <div class="list-avatar">{{ getInitials(leave.employeeName) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ leave.employeeName }}</div>
                    <div class="list-detail">{{ leave.leaveType }} • {{ leave.totalDays }} days</div>
                    <div class="list-date">Requested: {{ formatDate(leave.requestedDate) }}</div>
                  </div>
                  <div class="list-actions">
                    <button class="btn-small success" @click="quickApprove(leave)">Approve</button>
                    <button class="btn-small danger" @click="quickReject(leave)">Reject</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Payment History -->
          <div class="section-card">
            <div class="section-header">
              <h3>🔄 Recent Payments</h3>
              <router-link to="/payroll" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="payment in recentPayments" :key="payment.id" class="activity-item">
                  <div class="activity-icon">💰</div>
                  <div class="activity-info">
                    <div class="activity-text">{{ payment.employeeName }} - {{ payment.method }}</div>
                    <div class="activity-amount">{{ formatCurrency(payment.amount) }}</div>
                    <div class="activity-time">{{ formatDate(payment.paymentDate) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Net Pay vs Deductions Trend Section -->
      <div class="trend-section">
        <div class="trend-header">
          <div class="header-title">
            <div class="title-icon purple">📊</div>
            <h3>Monthly Net Pay vs Deductions Trend</h3>
          </div>
          <div class="trend-filters">
            <select v-model="trendYear" class="filter-select-small">
              <option :value="2024">2024</option>
              <option :value="2025">2025</option>
              <option :value="2026">2026</option>
            </select>
          </div>
        </div>
        
        <!-- Summary Stats -->
        <div class="trend-summary-stats">
          <div class="summary-stat-card">
            <div class="stat-label">Avg Monthly Net Pay</div>
            <div class="stat-value text-green">{{ formatCurrency(averageNetPay) }}</div>
            <div class="stat-trend positive">↑ {{ netPayGrowth }}% vs last year</div>
          </div>
          <div class="summary-stat-card">
            <div class="stat-label">Avg Monthly Deductions</div>
            <div class="stat-value text-red">{{ formatCurrency(averageDeductions) }}</div>
            <div class="stat-trend negative">↑ {{ deductionsGrowth }}% vs last year</div>
          </div>
          <div class="summary-stat-card">
            <div class="stat-label">Net Pay Ratio</div>
            <div class="stat-value text-blue">{{ netPayRatio }}%</div>
            <div class="stat-trend">of gross pay</div>
          </div>
        </div>
        
        <!-- Chart Container -->
        <div class="chart-container">
          <canvas ref="netPayDeductionsChart"></canvas>
        </div>
        
        <!-- Legend and Insights -->
        <div class="chart-insights">
          <div class="insight-item">
            <div class="insight-dot green"></div>
            <span>Net Pay (Take Home)</span>
          </div>
          <div class="insight-item">
            <div class="insight-dot red"></div>
            <span>Total Deductions</span>
          </div>
          <div class="insight-note">
            💡 Deductions include: Tax, Pension, Penalties, Loans, Other Deductions
          </div>
        </div>
      </div>
    </template>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span class="toast-icon">{{ toastIcon }}</span>
      <span class="toast-message">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()

// State
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastIcon = ref('✅')
const selectedMonth = ref('2026-05')
const trendYear = ref(2026)
let compositionChart = null
let netPayChart = null
const payrollCompositionChart = ref(null)
const netPayDeductionsChart = ref(null)

const availableMonths = ref([
  { value: '2026-01', name: 'January 2026' },
  { value: '2026-02', name: 'February 2026' },
  { value: '2026-03', name: 'March 2026' },
  { value: '2026-04', name: 'April 2026' },
  { value: '2026-05', name: 'May 2026' },
  { value: '2026-06', name: 'June 2026' }
])

const selectedMonthName = computed(() => {
  const month = availableMonths.value.find(m => m.value === selectedMonth.value)
  return month ? month.name : selectedMonth.value
})

// Employee Stats
const employeeStats = ref({
  total: 180,
  active: 156,
  newHires: 5,
  terminations: 3
})

// Attendance Stats
const attendanceStats = ref({
  avgAttendanceRate: 91,
  totalAbsentDays: 42,
  lateCount: 28
})

// Payroll Stats
const payrollStats = ref({
  totalGrossPay: 3425000,
  totalNetPay: 2850000,
  totalTax: 275000,
  totalPension7: 210000,
  totalPension11: 330000,
  totalPenalties: 45000,
  employeesWithPenalties: 12,
  employeesOnHold: 5,
  holdAmount: 125000
})

// Payroll Composition Data
const payrollComposition = ref({
  basicSalary: 2226250,
  allowances: 685000,
  overtime: 274000,
  bonuses: 239750,
  total: 3425000
})

// Monthly Net Pay vs Deductions Data
const monthlyNetPayData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  netPay: [2350000, 2380000, 2420000, 2450000, 2480000, 2520000, 2550000, 2580000, 2620000, 2650000, 2680000, 2720000],
  deductions: [500000, 520000, 530000, 540000, 550000, 560000, 570000, 580000, 590000, 600000, 610000, 620000]
})

// Computed values for summary stats
const averageNetPay = computed(() => {
  const sum = monthlyNetPayData.value.netPay.reduce((a, b) => a + b, 0)
  return Math.round(sum / monthlyNetPayData.value.netPay.length)
})

const averageDeductions = computed(() => {
  const sum = monthlyNetPayData.value.deductions.reduce((a, b) => a + b, 0)
  return Math.round(sum / monthlyNetPayData.value.deductions.length)
})

const netPayRatio = computed(() => {
  const totalNet = monthlyNetPayData.value.netPay.reduce((a, b) => a + b, 0)
  const totalDeductions = monthlyNetPayData.value.deductions.reduce((a, b) => a + b, 0)
  const totalGross = totalNet + totalDeductions
  return Math.round((totalNet / totalGross) * 100)
})

const netPayGrowth = computed(() => {
  const firstHalf = monthlyNetPayData.value.netPay.slice(0, 6).reduce((a, b) => a + b, 0) / 6
  const secondHalf = monthlyNetPayData.value.netPay.slice(6).reduce((a, b) => a + b, 0) / 6
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
})

const deductionsGrowth = computed(() => {
  const firstHalf = monthlyNetPayData.value.deductions.slice(0, 6).reduce((a, b) => a + b, 0) / 6
  const secondHalf = monthlyNetPayData.value.deductions.slice(6).reduce((a, b) => a + b, 0) / 6
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
})

// Department Payroll
const departmentPayroll = ref([
  { rank: 1, name: 'IT', employeeCount: 45, totalPayroll: 1125000, percentage: 100 },
  { rank: 2, name: 'Operations', employeeCount: 38, totalPayroll: 950000, percentage: 84 },
  { rank: 3, name: 'Finance', employeeCount: 32, totalPayroll: 800000, percentage: 71 },
  { rank: 4, name: 'Sales', employeeCount: 26, totalPayroll: 650000, percentage: 58 },
  { rank: 5, name: 'HR', employeeCount: 15, totalPayroll: 375000, percentage: 33 },
  { rank: 6, name: 'Marketing', employeeCount: 18, totalPayroll: 450000, percentage: 40 }
])

// Department Attendance
const departmentAttendance = ref([
  { rank: 1, name: 'HR', attendanceRate: 95, absentDays: 8 },
  { rank: 2, name: 'Finance', attendanceRate: 92, absentDays: 12 },
  { rank: 3, name: 'IT', attendanceRate: 89, absentDays: 22 },
  { rank: 4, name: 'Marketing', attendanceRate: 87, absentDays: 18 },
  { rank: 5, name: 'Sales', attendanceRate: 84, absentDays: 20 },
  { rank: 6, name: 'Operations', attendanceRate: 82, absentDays: 28 }
])

// Payment Status
const paymentStatus = ref({
  paid: 145,
  paidPercent: 80,
  pending: 12,
  pendingPercent: 7,
  unclaimed: 8,
  unclaimedPercent: 4,
  returned: 5,
  returnedPercent: 3
})

// Top Lists
const highestPaid = ref([
  { id: 1, name: 'Biruk Mulualem', position: 'Senior Developer', department: 'IT', salary: 35000 },
  { id: 2, name: 'Melaku Tewodros', position: 'Finance Manager', department: 'Finance', salary: 32000 },
  { id: 3, name: 'Haymanot Abebaw', position: 'HR Manager', department: 'HR', salary: 30000 },
  { id: 4, name: 'Melkamu Zewdu', position: 'Operations Manager', department: 'Operations', salary: 28000 },
  { id: 5, name: 'Dagmawi Hadgu', position: 'Team Lead', department: 'IT', salary: 27000 }
])

const mostAbsent = ref([
  { id: 1, name: 'Melkamu Zewdu', department: 'Operations', absentDays: 8, penalty: 8000 },
  { id: 2, name: 'Nuru Seid', department: 'Finance', absentDays: 7, penalty: 7000 },
  { id: 3, name: 'Tadese Jemberu', department: 'Operations', absentDays: 6, penalty: 6000 },
  { id: 4, name: 'Tamrat Zerihun', department: 'IT', absentDays: 5, penalty: 5000 },
  { id: 5, name: 'Eshete Worke', department: 'IT', absentDays: 4, penalty: 4000 }
])

const mostLate = ref([
  { id: 1, name: 'Tamrat Zerihun', department: 'IT', lateMinutes: 245, lateCount: 12 },
  { id: 2, name: 'Nuru Seid', department: 'Finance', lateMinutes: 189, lateCount: 10 },
  { id: 3, name: 'Tadese Jemberu', department: 'Operations', lateMinutes: 156, lateCount: 9 },
  { id: 4, name: 'Eshete Worke', department: 'IT', lateMinutes: 142, lateCount: 8 },
  { id: 5, name: 'Haymanot Abebaw', department: 'HR', lateMinutes: 98, lateCount: 7 }
])

const onHoldEmployees = ref([
  { id: 1, name: 'Biruk Mulualem', department: 'IT', position: 'Senior Developer', amount: 25000, holdReason: 'Pending disciplinary review' },
  { id: 2, name: 'Melkamu Zewdu', department: 'Operations', position: 'Manager', amount: 28000, holdReason: 'Awaiting document submission' },
  { id: 3, name: 'Tadese Jemberu', department: 'Operations', position: 'Coordinator', amount: 12000, holdReason: 'Salary dispute' },
  { id: 4, name: 'Nuru Seid', department: 'Finance', position: 'Accountant', amount: 15000, holdReason: 'Bank verification pending' }
])

const pendingLeaves = ref([
  { id: 1, employeeName: 'Tamrat Zerihun', leaveType: 'Annual Leave', totalDays: 3, requestedDate: '2026-05-20' },
  { id: 2, employeeName: 'Nuru Seid', leaveType: 'Sick Leave', totalDays: 2, requestedDate: '2026-05-21' },
  { id: 3, employeeName: 'Eshete Worke', leaveType: 'Annual Leave', totalDays: 4, requestedDate: '2026-05-19' }
])

const recentPayments = ref([
  { id: 1, employeeName: 'Biruk Mulualem', method: 'Bank Transfer', amount: 28500, paymentDate: '2026-05-15' },
  { id: 2, employeeName: 'Dagmawi Hadgu', method: 'Cash', amount: 32000, paymentDate: '2026-05-15' },
  { id: 3, employeeName: 'Melaku Tewodros', method: 'Bank Transfer', amount: 29500, paymentDate: '2026-05-14' },
  { id: 4, employeeName: 'Haymanot Abebaw', method: 'Bank Transfer', amount: 27500, paymentDate: '2026-05-14' },
  { id: 5, employeeName: 'Tamrat Zerihun', method: 'Cash', amount: 16500, paymentDate: '2026-05-13' }
])

// Helper Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US').format(amount || 0)
}

function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function goToEmployees() { router.push('/employees') }
function goToAttendance() { router.push('/attendance') }
function goToPayroll() { router.push('/payroll') }

function quickApprove(leave) {
  showToastMessage(`Leave approved for ${leave.employeeName}`, 'success')
  pendingLeaves.value = pendingLeaves.value.filter(l => l.id !== leave.id)
}

function quickReject(leave) {
  showToastMessage(`Leave rejected for ${leave.employeeName}`, 'warning')
  pendingLeaves.value = pendingLeaves.value.filter(l => l.id !== leave.id)
}

function initPayrollCompositionChart() {
  if (!payrollCompositionChart.value) {
    setTimeout(() => {
      initPayrollCompositionChart()
    }, 200)
    return
  }
  
  const ctx = payrollCompositionChart.value.getContext('2d')
  if (!ctx) return
  
  if (compositionChart) {
    compositionChart.destroy()
    compositionChart = null
  }
  
  compositionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Basic Salary', 'Allowances', 'Overtime', 'Bonuses'],
      datasets: [{
        data: [
          payrollComposition.value.basicSalary,
          payrollComposition.value.allowances,
          payrollComposition.value.overtime,
          payrollComposition.value.bonuses
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        borderColor: 'white',
        borderWidth: 2,
        hoverOffset: 10,
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.raw
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `${label}: ${formatCurrency(value)} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

function initNetPayDeductionsChart() {
  if (!netPayDeductionsChart.value) {
    setTimeout(() => {
      initNetPayDeductionsChart()
    }, 200)
    return
  }
  
  const ctx = netPayDeductionsChart.value.getContext('2d')
  if (!ctx) return
  
  if (netPayChart) {
    netPayChart.destroy()
    netPayChart = null
  }
  
  netPayChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthlyNetPayData.value.labels,
      datasets: [
        {
          label: 'Net Pay (Take Home)',
          data: monthlyNetPayData.value.netPay,
          type: 'line',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Total Deductions',
          data: monthlyNetPayData.value.deductions,
          type: 'bar',
          backgroundColor: '#ef4444',
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || ''
              let value = context.raw
              let percentage = ''
              if (context.dataset.label === 'Net Pay (Take Home)') {
                const total = value + (monthlyNetPayData.value.deductions[context.dataIndex] || 0)
                percentage = ` (${Math.round((value / total) * 100)}% of gross)`
              }
              return `${label}: ${formatCurrency(value)}${percentage}`
            },
            footer: function(tooltipItems) {
              const index = tooltipItems[0].dataIndex
              const netPay = monthlyNetPayData.value.netPay[index]
              const deductions = monthlyNetPayData.value.deductions[index]
              const gross = netPay + deductions
              return `Gross Pay: ${formatCurrency(gross)}`
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: 'Amount (ETB)',
            font: { weight: 'bold', size: 12 }
          },
          ticks: {
            callback: (val) => formatCurrency(val),
            stepSize: 500000
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Month',
            font: { weight: 'bold', size: 12 }
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

function refreshData() {
  showToastMessage(`Dashboard refreshed for ${selectedMonthName.value}`, 'success')
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚠️')
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initPayrollCompositionChart()
      initNetPayDeductionsChart()
    }, 300)
  })
})

onUnmounted(() => {
  if (compositionChart) {
    compositionChart.destroy()
    compositionChart = null
  }
  if (netPayChart) {
    netPayChart.destroy()
    netPayChart = null
  }
})
</script>

<style scoped>
.finance-dashboard {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* Header */
.dashboard-header {
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-badge {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-badge svg {
  width: 28px;
  height: 28px;
  color: white;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}

.month-selector {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #e2e8f0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.blue { background: #dbeafe; }
.stat-icon.green { background: #d1fae5; }
.stat-icon.red { background: #fee2e2; }
.stat-icon.orange { background: #fed7aa; }
.stat-icon.purple { background: #f3e8ff; }
.stat-icon.pink { background: #fce7f3; }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.stat-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.summary-icon.green { background: #d1fae5; }
.summary-icon.orange { background: #fed7aa; }
.summary-icon.red { background: #fee2e2; }
.summary-icon.blue { background: #dbeafe; }

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.summary-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.summary-trend {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.analytics-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.title-icon.blue { background: #dbeafe; }
.title-icon.green { background: #d1fae5; }
.title-icon.red { background: #fee2e2; }
.title-icon.purple { background: #f3e8ff; }

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.view-link {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}

/* Analytics List */
.analytics-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.analytics-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.item-rank {
  width: 30px;
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
}

.item-name {
  width: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.item-stats {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  font-size: 12px;
}

.emp-count, .attendance-rate {
  color: #10b981;
  font-weight: 500;
}

.absent-days, .payroll-amount {
  color: #64748b;
}

.item-bar {
  width: 120px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

/* Pie Chart Styles */
.pie-chart-container {
  padding: 20px;
  height: 200px !important;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-chart-container canvas {
  max-width: 200px;
  max-height: 200px;
  margin: 0 auto;
}

/* Composition Legend */
.composition-legend {
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  border-top: 1px solid #eef2ff;
  border-bottom: 1px solid #eef2ff;
  background: #fafcfc;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.color-box.basic { background: #3b82f6; }
.color-box.allowances { background: #10b981; }
.color-box.overtime { background: #f59e0b; }
.color-box.bonuses { background: #8b5cf6; }

.legend-text {
  flex: 1;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}

.legend-label {
  font-size: 11px;
  font-weight: 500;
  color: #1e293b;
}

.legend-percent {
  font-size: 11px;
  font-weight: 700;
  color: #3b82f6;
}

.legend-amount {
  font-size: 10px;
  color: #64748b;
  margin-left: auto;
}

/* Total Payroll */
.total-payroll {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  margin: 0;
  flex-shrink: 0;
}

.total-payroll span {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
}

.total-payroll strong {
  font-size: 18px;
  font-weight: 800;
  color: #1e40af;
}

/* Payment Status List */
.payment-status-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label {
  width: 80px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.status-value {
  width: 40px;
  font-size: 13px;
  font-weight: 600;
}

.status-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.status-fill.green { background: #10b981; }
.status-fill.orange { background: #f59e0b; }
.status-fill.red { background: #ef4444; }
.status-fill.purple { background: #8b5cf6; }

/* Two Column Layout */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 380px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
}

.scroll-container::-webkit-scrollbar {
  width: 4px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* List Items */
.item-list {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.list-item:hover {
  background: #f8fafc;
}

.top-rank {
  width: 32px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.top-rank.gold { color: #f59e0b; }
.top-rank.silver { color: #94a3b8; }
.top-rank.bronze { color: #cd7a32; }

.list-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.warning-avatar, .late-avatar, .hold-avatar {
  background: #ef4444;
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.list-detail {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.list-date, .hold-reason {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.list-value {
  text-align: right;
  font-weight: 600;
}

.list-value.red { color: #ef4444; }
.list-value.orange { color: #f59e0b; }

.absent-count, .late-count {
  font-size: 14px;
  font-weight: 600;
}

.penalty-amount, .late-times {
  font-size: 10px;
  opacity: 0.8;
}

.list-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* Activity Items */
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.activity-icon {
  font-size: 20px;
}

.activity-info {
  flex: 1;
}

.activity-text {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.activity-amount {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
}

.activity-time {
  font-size: 10px;
  color: #94a3b8;
}

/* Buttons */
.btn-small {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.btn-small.success {
  background: #10b981;
  color: white;
}

.btn-small.success:hover {
  background: #059669;
}

.btn-small.danger {
  background: #ef4444;
  color: white;
}

.btn-small.danger:hover {
  background: #dc2626;
}

/* Hold Card */
.hold-card {
  border-left: 4px solid #f59e0b;
}

.hold-item {
  background: #fffbeb;
}

/* Trend Section - Updated for Net Pay vs Deductions */
.trend-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.trend-header .header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.trend-header .title-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.trend-header .title-icon.purple { background: #f3e8ff; }

.trend-header h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.trend-filters {
  display: flex;
  gap: 12px;
}

.filter-select-small {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

/* Trend Summary Stats */
.trend-summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-stat-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s;
  border: 1px solid #eef2ff;
}

.summary-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  background: white;
}

.summary-stat-card .stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.summary-stat-card .stat-value {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 6px;
}

.summary-stat-card .stat-value.text-green { color: #10b981; }
.summary-stat-card .stat-value.text-red { color: #ef4444; }
.summary-stat-card .stat-value.text-blue { color: #3b82f6; }

.summary-stat-card .stat-trend {
  font-size: 11px;
}

.summary-stat-card .stat-trend.positive { color: #10b981; }
.summary-stat-card .stat-trend.negative { color: #ef4444; }

/* Chart Container */
.chart-container {
  height: 380px;
  position: relative;
  margin-bottom: 20px;
}

/* Chart Insights */
.chart-insights {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #eef2ff;
  flex-wrap: wrap;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}

.insight-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.insight-dot.green { background: #10b981; }
.insight-dot.red { background: #ef4444; }

.insight-note {
  font-size: 12px;
  color: #64748b;
  padding: 6px 12px;
  background: #fef3c7;
  border-radius: 20px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
}

.toast.error { border-left-color: #ef4444; }
.toast.warning { border-left-color: #f59e0b; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .finance-dashboard {
    padding: 16px;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  .list-item {
    flex-wrap: wrap;
  }
  .composition-legend {
    grid-template-columns: 1fr;
  }
  .pie-chart-container {
    height: 180px !important;
  }
  .pie-chart-container canvas {
    max-width: 160px;
    max-height: 160px;
  }
  .trend-section {
    padding: 16px;
  }
  .trend-header h3 {
    font-size: 14px;
  }
  .trend-summary-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .summary-stat-card .stat-value {
    font-size: 20px;
  }
  .chart-container {
    height: 280px;
  }
  .chart-insights {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>