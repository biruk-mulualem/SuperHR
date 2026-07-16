<template>
  <div class="hr-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1>HR Dashboard</h1>
          <p>Workforce Analytics & Employee Management</p>
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
      <p>Loading dashboard data...</p>
    </div>

    <template v-else>
      <!-- Stats Cards Row 1 - Employee Overview -->
      <div class="stats-grid">
        <div class="stat-card" @click="goToEmployees">
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.total }}</div>
            <div class="stat-label">Total Employees</div>
          </div>
        </div>
        <div class="stat-card" @click="goToEmployees">
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.active }}</div>
            <div class="stat-label">Active Employees</div>
          </div>
        </div>
        <div class="stat-card" @click="goToEmployees">
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.inactive }}</div>
            <div class="stat-label">Inactive</div>
          </div>
        </div>
        <div class="stat-card" @click="goToEmployees">
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.terminated }}</div>
            <div class="stat-label">Terminated</div>
          </div>
        </div>
        <div class="stat-card" @click="goToEmployees">
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.newHires }}</div>
            <div class="stat-label">New Hires</div>
          </div>
        </div>
        <div class="stat-card" @click="goToEmployees">
          <div class="stat-info">
            <div class="stat-value">{{ employeeStats.turnoverRate }}%</div>
            <div class="stat-label">Turnover Rate</div>
          </div>
        </div>
      </div>

      <!-- Summary Cards Row 2 -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon green">📊</div>
          <div class="summary-content">
            <div class="summary-value">{{ employeeStats.genderRatio.male }}%</div>
            <div class="summary-label">Male / Female</div>
            <div class="summary-trend">{{ employeeStats.genderRatio.female }}% Female</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon orange">📅</div>
          <div class="summary-content">
            <div class="summary-value">{{ employeeStats.avgTenure }}</div>
            <div class="summary-label">Avg Tenure</div>
            <div class="summary-trend">{{ employeeStats.tenureDistribution['5+'] }}% over 5 years</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon purple">👥</div>
          <div class="summary-content">
            <div class="summary-value">{{ employeeStats.departmentsWithStaff }}</div>
            <div class="summary-label">Departments</div>
            <div class="summary-trend">{{ employeeStats.averageDeptSize }} avg per dept</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon blue">📄</div>
          <div class="summary-content">
            <div class="summary-value">{{ employeeStats.docComplianceRate }}%</div>
            <div class="summary-label">Doc Compliance</div>
            <div class="summary-trend warning">{{ employeeStats.missingDocsCount }} missing</div>
          </div>
        </div>
      </div>

      <!-- Department Analytics Grid - 2x2 Equal Height Cards -->
      <div class="dept-analytics-full">
        <h3 class="section-title">📊 Department Analytics</h3>
        <div class="analytics-full-grid">
          <!-- Card 1: Active Employees by Department -->
          <div class="analytics-full-card">
            <div class="analytics-full-header">
              <span class="analytics-full-icon">👥</span>
              <span>Active Employees by Department</span>
            </div>
            <div class="analytics-full-list hover-scroll">
              <div v-for="dept in activeEmployeesByDept" :key="dept.name" class="analytics-full-item">
                <div class="analytics-full-rank">{{ dept.rank }}</div>
                <div class="analytics-full-name">{{ dept.name }}</div>
                <div class="analytics-full-bar">
                  <div class="analytics-full-fill" :style="{ width: dept.percentage + '%', background: '#10b981' }"></div>
                </div>
                <div class="analytics-full-value">{{ dept.count }} emp</div>
              </div>
            </div>
          </div>

          <!-- Card 2: Inactive & Terminated by Department -->
          <div class="analytics-full-card">
            <div class="analytics-full-header">
              <span class="analytics-full-icon">⚠️</span>
              <span>Inactive & Terminated</span>
            </div>
            <div class="analytics-full-list hover-scroll">
              <div v-for="dept in inactiveEmployeesByDept" :key="dept.name" class="analytics-full-item">
                <div class="analytics-full-rank">{{ dept.rank }}</div>
                <div class="analytics-full-name">{{ dept.name }}</div>
                <div class="analytics-full-bar">
                  <div class="analytics-full-fill" :style="{ width: dept.percentage + '%', background: '#ef4444' }"></div>
                </div>
                <div class="analytics-full-value">{{ dept.inactive }} / {{ dept.terminated }}</div>
              </div>
            </div>
          </div>

          <!-- Card 3: New Hires vs Terminations -->
          <div class="analytics-full-card">
            <div class="analytics-full-header">
              <span class="analytics-full-icon">📈</span>
              <span>Hiring vs Terminations</span>
            </div>
            <div class="analytics-full-list hover-scroll">
              <div class="comparison-stats-vertical">
                <div class="comparison-item">
                  <span class="comparison-label">New Hires (YTD)</span>
                  <span class="comparison-value positive">{{ hiringComparison.newHires }}</span>
                  <div class="mini-bar">
                    <div class="mini-fill green" :style="{ width: hiringComparison.newHiresPercent + '%' }"></div>
                  </div>
                </div>
                <div class="comparison-item">
                  <span class="comparison-label">Terminations (YTD)</span>
                  <span class="comparison-value negative">{{ hiringComparison.terminations }}</span>
                  <div class="mini-bar">
                    <div class="mini-fill red" :style="{ width: hiringComparison.terminationsPercent + '%' }"></div>
                  </div>
                </div>
                <div class="comparison-divider"></div>
                <div class="comparison-item">
                  <span class="comparison-label">Net Growth</span>
                  <span class="comparison-value positive">+{{ hiringComparison.netGrowth }}</span>
                </div>
                <div class="comparison-item">
                  <span class="comparison-label">Turnover Rate</span>
                  <span class="comparison-value">{{ employeeStats.turnoverRate }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: Tenure Distribution -->
          <div class="analytics-full-card">
            <div class="analytics-full-header">
              <span class="analytics-full-icon">⏰</span>
              <span>Tenure Distribution</span>
            </div>
            <div class="analytics-full-list hover-scroll">
              <div v-for="tenure in tenureDistribution" :key="tenure.range" class="tenure-item">
                <div class="tenure-label">{{ tenure.range }}</div>
                <div class="tenure-bar">
                  <div class="tenure-fill" :style="{ width: tenure.percentage + '%', background: '#8b5cf6' }"></div>
                </div>
                <div class="tenure-value">{{ tenure.count }} ({{ tenure.percentage }}%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Employment Type Distribution - Equal Cards -->
      <div class="employment-type-section">
        <div class="distribution-header">
          <h3>📋 Employment Type Distribution</h3>
          <router-link to="/employees" class="view-link">View Details →</router-link>
        </div>
        <div class="employment-grid">
          <div v-for="type in employmentTypes" :key="type.name" class="employment-card">
            <div class="employment-icon" :style="{ background: type.color }">
              <span>{{ type.icon }}</span>
            </div>
            <div class="employment-info">
              <div class="employment-name">{{ type.name }}</div>
              <div class="employment-count">{{ type.count }} employees</div>
              <div class="employment-bar">
                <div class="employment-fill" :style="{ width: type.percentage + '%', background: type.color }"></div>
              </div>
              <div class="employment-percent">{{ type.percentage }}% of workforce</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Two Column Layout - Equal Number of Cards (5 on each side) -->
      <div class="two-column-layout">
        <!-- Left Column - 5 Cards -->
        <div class="left-column">
          <!-- Card 1: Pending Leave Requests -->
          <div class="section-card">
            <div class="section-header">
              <h3>⏳ Pending Leave Requests</h3>
              <span class="badge info">{{ pendingLeaves.length }}</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="request in pendingLeaves" :key="request.leaveRequestId" class="list-item">
                  <div class="list-avatar">{{ getInitials(request.employeeName) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ request.employeeName }}</div>
                    <div class="list-detail">{{ request.leaveType }} • {{ request.totalDays }} days</div>
                    <div class="list-date">Requested: {{ formatDate(request.requestedDate) }}</div>
                  </div>
                  <div class="list-actions">
                    <button class="btn-small success" @click="quickApprove(request)">Approve</button>
                    <button class="btn-small danger" @click="quickReject(request)">Reject</button>
                  </div>
                </div>
              </div>
              <div v-if="pendingLeaves.length === 0" class="empty-state-small">No pending requests</div>
              <div v-if="pendingLeaves.length > 4" class="scroll-indicator">▼ Scroll for more ({{ pendingLeaves.length - 4 }} more)</div>
            </div>
          </div>

          <!-- Card 2: Today's Leave Schedule -->
          <div class="section-card">
            <div class="section-header">
              <h3>📋 Today's Leave Schedule</h3>
              <span class="badge info">{{ todayLeaves.length }}</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="leave in todayLeaves" :key="leave.leaveRequestId" class="list-item">
                  <div class="list-avatar">{{ getInitials(leave.employeeName) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ leave.employeeName }}</div>
                    <div class="list-detail">{{ leave.leaveType }} • Returns {{ formatDate(leave.returnDate) }}</div>
                  </div>
                  <div class="list-status">
                    <span class="status-badge on-leave">On Leave</span>
                  </div>
                </div>
              </div>
              <div v-if="todayLeaves.length === 0" class="empty-state-small">No leaves today</div>
              <div v-if="todayLeaves.length > 4" class="scroll-indicator">▼ Scroll for more ({{ todayLeaves.length - 4 }} more)</div>
            </div>
          </div>

          <!-- Card 3: Document Compliance Overview -->
          <div class="section-card">
            <div class="section-header">
              <h3>📄 Document Compliance</h3>
              <router-link to="/employees" class="view-link">Manage →</router-link>
            </div>
            <div class="compliance-summary">
              <div class="compliance-ring-small">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" stroke-width="8"/>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" stroke-width="8" 
                    :stroke-dasharray="283" :stroke-dashoffset="283 - (283 * employeeStats.docComplianceRate / 100)" 
                    transform="rotate(-90 50 50)"/>
                </svg>
                <span class="ring-value">{{ employeeStats.docComplianceRate }}%</span>
              </div>
              <div class="compliance-stats">
                <div class="doc-stat"><span>Fully Compliant:</span><strong>{{ employeeStats.fullyCompliant }}/{{ employeeStats.active }}</strong></div>
                <div class="doc-stat warning"><span>Missing Docs:</span><strong>{{ employeeStats.missingDocsCount }}</strong></div>
              </div>
            </div>
            <div class="doc-types-list scroll-container">
              <div class="item-list">
                <div v-for="doc in documentTypeStats" :key="doc.name" class="doc-type-row">
                  <span class="doc-type-name">{{ doc.name }}</span>
                  <div class="doc-type-bar"><div class="doc-type-fill" :style="{ width: doc.rate + '%', background: doc.color }"></div></div>
                  <span class="doc-type-rate">{{ doc.rate }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: Employment Type Distribution Summary -->
          <div class="section-card">
            <div class="section-header">
              <h3>👔 Employment Type Summary</h3>
              <router-link to="/employees" class="view-link">View →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="type in employmentTypes" :key="type.name" class="employment-summary-item">
                  <div class="emp-type-icon" :style="{ background: type.color }">{{ type.icon }}</div>
                  <div class="emp-type-info">
                    <div class="emp-type-name">{{ type.name }}</div>
                    <div class="emp-type-count">{{ type.count }} employees</div>
                  </div>
                  <div class="emp-type-percent">{{ type.percentage }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 5: Department Headcount Summary -->
          <div class="section-card">
            <div class="section-header">
              <h3>🏢 Department Headcount</h3>
              <router-link to="/employees" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="dept in departmentHeadcount" :key="dept.name" class="dept-summary-item">
                  <div class="dept-summary-name">{{ dept.name }}</div>
                  <div class="dept-summary-stats">
                    <span class="active-count">{{ dept.active }}</span>
                    <span class="inactive-count" v-if="dept.inactive > 0"> ({{ dept.inactive }} inc)</span>
                  </div>
                  <div class="dept-summary-bar"><div class="dept-summary-fill" :style="{ width: dept.percentage + '%', background: '#3b82f6' }"></div></div>
                </div>
              </div>
              <div v-if="departmentHeadcount.length > 4" class="scroll-indicator">▼ Scroll for more ({{ departmentHeadcount.length - 4 }} more)</div>
            </div>
          </div>
        </div>

        <!-- Right Column - 5 Cards -->
        <div class="right-column">
          <!-- Card 1: SALES DEPT - Missing Guarantee Letters (Priority Card) -->
          <div class="section-card sales-critical-card">
            <div class="section-header">
              <h3>⚠️ SALES DEPT - Missing Guarantee Letters</h3>
              <span class="badge critical">{{ salesMissingGuarantee.length }} employees</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="emp in salesMissingGuarantee" :key="emp.id" class="list-item critical-item">
                  <div class="list-avatar critical-avatar">{{ getInitials(emp.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.name }}</div>
                    <div class="list-detail">{{ emp.position }} • {{ emp.department }}</div>
                    <div class="warning-text">⚠️ {{ emp.guaranteeCount }} guarantee letter(s)</div>
                  </div>
                  <button class="btn-small warning" @click="remindGuarantee(emp)">Remind</button>
                </div>
              </div>
              <div v-if="salesMissingGuarantee.length === 0" class="empty-state-small">✅ All Sales employees have guarantee letters</div>
              <div v-if="salesMissingGuarantee.length > 4" class="scroll-indicator">▼ Scroll for more ({{ salesMissingGuarantee.length - 4 }} more)</div>
            </div>
          </div>

          <!-- Card 2: Employees Missing Documents (All Depts) -->
          <div class="section-card warning-card">
            <div class="section-header">
              <h3>⚠️ Missing Documents (All Depts)</h3>
              <span class="badge warning">{{ employeesMissingDocs.length }}</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="emp in employeesMissingDocs" :key="emp.id" class="list-item missing-doc-item">
                  <div class="list-avatar warning-avatar">{{ getInitials(emp.fullName) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.fullName }}</div>
                    <div class="list-detail">{{ emp.department }}</div>
                    <div class="missing-docs-list">{{ emp.missingList }}</div>
                  </div>
                  <button class="btn-small warning" @click="remindEmployee(emp)">Remind</button>
                </div>
              </div>
              <div v-if="employeesMissingDocs.length === 0" class="empty-state-small">All documents complete</div>
              <div v-if="employeesMissingDocs.length > 4" class="scroll-indicator">▼ Scroll for more ({{ employeesMissingDocs.length - 4 }} more)</div>
            </div>
          </div>

          <!-- Card 3: Upcoming Contract Endings -->
          <div class="section-card">
            <div class="section-header">
              <h3>📅 Upcoming Contract Endings</h3>
              <span class="badge info">{{ upcomingContractEndings.length }}</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="contract in upcomingContractEndings" :key="contract.id" class="list-item">
                  <div class="list-avatar">{{ getInitials(contract.employeeName) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ contract.employeeName }}</div>
                    <div class="list-detail">{{ contract.position }} • {{ contract.department }}</div>
                    <div class="list-date">Ends: {{ formatDate(contract.endDate) }}</div>
                  </div>
                  <div class="contract-status" :class="contract.status">{{ contract.daysLeft }} days</div>
                </div>
              </div>
              <div v-if="upcomingContractEndings.length === 0" class="empty-state-small">No upcoming contract endings</div>
              <div v-if="upcomingContractEndings.length > 4" class="scroll-indicator">▼ Scroll for more ({{ upcomingContractEndings.length - 4 }} more)</div>
            </div>
          </div>

          <!-- Card 4: Top Late Employees -->
          <div class="section-card">
            <div class="section-header">
              <h3>⏰ Top Late Employees</h3>
              <router-link to="/attendance" class="view-link">View All →</router-link>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="(emp, idx) in topLateEmployees" :key="emp.id" class="list-item">
                  <div class="top-rank">{{ idx + 1 }}</div>
                  <div class="list-avatar">{{ getInitials(emp.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.name }}</div>
                    <div class="list-detail">{{ emp.department }}</div>
                  </div>
                  <div class="top-value">
                    <div class="late-count">{{ emp.lateCount }} times</div>
                    <div class="late-minutes">{{ emp.totalLateMinutes }} min</div>
                  </div>
                </div>
              </div>
              <div v-if="topLateEmployees.length > 4" class="scroll-indicator">▼ Scroll for more ({{ topLateEmployees.length - 4 }} more)</div>
            </div>
          </div>

          <!-- Card 5: Recent Terminations -->
          <div class="section-card termination-card">
            <div class="section-header">
              <h3>📋 Recent Terminations</h3>
              <span class="badge danger">{{ recentTerminations.length }}</span>
            </div>
            <div class="scroll-container">
              <div class="item-list">
                <div v-for="emp in recentTerminations" :key="emp.id" class="list-item termination-item">
                  <div class="list-avatar termination-avatar">{{ getInitials(emp.name) }}</div>
                  <div class="list-info">
                    <div class="list-name">{{ emp.name }}</div>
                    <div class="list-detail">{{ emp.position }} • {{ emp.department }}</div>
                    <div class="list-date">Terminated: {{ formatDate(emp.terminationDate) }}</div>
                  </div>
                  <div class="termination-reason">{{ emp.reason }}</div>
                </div>
              </div>
              <div v-if="recentTerminations.length === 0" class="empty-state-small">No recent terminations</div>
              <div v-if="recentTerminations.length > 4" class="scroll-indicator">▼ Scroll for more ({{ recentTerminations.length - 4 }} more)</div>
            </div>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import employeeService from '@/stores/employee'

const router = useRouter()

// State
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const toastIcon = ref('✅')
const selectedMonth = ref('2026-05')

const availableMonths = ref([
  { value: '2026-01', name: 'January 2026' },
  { value: '2026-02', name: 'February 2026' },
  { value: '2026-03', name: 'March 2026' },
  { value: '2026-04', name: 'April 2026' },
  { value: '2026-05', name: 'May 2026' },
  { value: '2026-06', name: 'June 2026' }
])

// Employee Stats
const employeeStats = ref({
  total: 180,
  active: 156,
  inactive: 8,
  terminated: 16,
  newHires: 5,
  turnoverRate: 8.9,
  genderRatio: { male: 58, female: 42 },
  avgTenure: '3.2 years',
  tenureDistribution: { '0-1': 28, '1-3': 42, '3-5': 18, '5+': 12 },
  departmentsWithStaff: 6,
  averageDeptSize: 26,
  docComplianceRate: 78,
  fullyCompliant: 112,
  missingDocsCount: 32
})

// Department Data
const activeEmployeesByDept = ref([
  { rank: 1, name: 'IT', count: 45, percentage: 100 },
  { rank: 2, name: 'Operations', count: 38, percentage: 84 },
  { rank: 3, name: 'Finance', count: 32, percentage: 71 },
  { rank: 4, name: 'Sales', count: 26, percentage: 58 },
  { rank: 5, name: 'HR', count: 15, percentage: 33 },
  { rank: 6, name: 'Marketing', count: 18, percentage: 40 }
])

const inactiveEmployeesByDept = ref([
  { rank: 1, name: 'Operations', inactive: 4, terminated: 6, percentage: 100 },
  { rank: 2, name: 'IT', inactive: 2, terminated: 4, percentage: 75 },
  { rank: 3, name: 'Sales', inactive: 1, terminated: 3, percentage: 50 },
  { rank: 4, name: 'Finance', inactive: 1, terminated: 2, percentage: 38 },
  { rank: 5, name: 'Marketing', inactive: 0, terminated: 1, percentage: 13 },
  { rank: 6, name: 'HR', inactive: 0, terminated: 0, percentage: 0 }
])

const departmentHeadcount = ref([
  { name: 'IT', active: 45, inactive: 2, total: 47, percentage: 100 },
  { name: 'Operations', active: 38, inactive: 4, total: 42, percentage: 89 },
  { name: 'Finance', active: 32, inactive: 1, total: 33, percentage: 70 },
  { name: 'Sales', active: 26, inactive: 1, total: 27, percentage: 57 },
  { name: 'Marketing', active: 18, inactive: 0, total: 18, percentage: 38 },
  { name: 'HR', active: 15, inactive: 0, total: 15, percentage: 32 }
])

// Sales Department - Employees Missing Guarantee Letters
const salesMissingGuarantee = ref([
  { id: 1, name: 'Abebech Demisse', position: 'Sales Manager', department: 'Sales', guaranteeCount: 0 },
  { id: 2, name: 'Getachew Mulu', position: 'Sales Representative', department: 'Sales', guaranteeCount: 0 },
  { id: 3, name: 'Tigist Mekonnen', position: 'Sales Coordinator', department: 'Sales', guaranteeCount: 1 },
  { id: 4, name: 'Dawit Assefa', position: 'Account Executive', department: 'Sales', guaranteeCount: 0 },
  { id: 5, name: 'Meseret Alemu', position: 'Sales Associate', department: 'Sales', guaranteeCount: 1 },
  { id: 6, name: 'Henok Tesfaye', position: 'Business Developer', department: 'Sales', guaranteeCount: 0 }
])

// Hiring Comparison
const hiringComparison = ref({
  newHires: 24,
  terminations: 16,
  netGrowth: 8,
  newHiresPercent: 60,
  terminationsPercent: 40
})

// Tenure Distribution
const tenureDistribution = ref([
  { range: '0-1 year', count: 28, percentage: 28 },
  { range: '1-3 years', count: 42, percentage: 42 },
  { range: '3-5 years', count: 18, percentage: 18 },
  { range: '5+ years', count: 12, percentage: 12 }
])

// Employment Types
const employmentTypes = ref([
  { name: 'Full Time', count: 112, percentage: 62, color: '#10b981', icon: '👔' },
  { name: 'Part Time', count: 24, percentage: 13, color: '#f59e0b', icon: '⏰' },
  { name: 'Contract', count: 28, percentage: 16, color: '#8b5cf6', icon: '📄' },
  { name: 'Intern', count: 16, percentage: 9, color: '#3b82f6', icon: '🎓' }
])

// Document Type Stats
const documentTypeStats = ref([
  { name: 'ID Card', rate: 85, color: '#3b82f6' },
  { name: 'CV/Resume', rate: 92, color: '#10b981' },
  { name: 'Degree', rate: 78, color: '#8b5cf6' },
  { name: 'Guarantee Letter', rate: 65, color: '#f59e0b' }
])

// Pending Leaves
const pendingLeaves = ref([
  { leaveRequestId: 10, employeeName: 'Tamrat Zerihun', leaveType: 'Annual Leave', totalDays: 3, requestedDate: '2026-05-20' },
  { leaveRequestId: 11, employeeName: 'Nuru Seid', leaveType: 'Sick Leave', totalDays: 2, requestedDate: '2026-05-21' },
  { leaveRequestId: 12, employeeName: 'Eshete Worke', leaveType: 'Annual Leave', totalDays: 4, requestedDate: '2026-05-19' },
  { leaveRequestId: 13, employeeName: 'Dagmawi Hadgu', leaveType: 'Sick Leave', totalDays: 1, requestedDate: '2026-05-22' },
  { leaveRequestId: 14, employeeName: 'Melaku Tewodros', leaveType: 'Annual Leave', totalDays: 5, requestedDate: '2026-05-18' }
])

// Today's Leaves
const todayLeaves = ref([
  { leaveRequestId: 1, employeeName: 'Biruk Mulualem', leaveType: 'Annual Leave', returnDate: '2026-05-25' },
  { leaveRequestId: 2, employeeName: 'Melkamu Zewdu', leaveType: 'Maternity Leave', returnDate: '2026-07-20' },
  { leaveRequestId: 3, employeeName: 'Dagmawi Hadgu', leaveType: 'Sick Leave', returnDate: '2026-05-22' },
  { leaveRequestId: 4, employeeName: 'Nuru Seid', leaveType: 'Annual Leave', returnDate: '2026-05-28' },
  { leaveRequestId: 5, employeeName: 'Eshete Worke', leaveType: 'Sick Leave', returnDate: '2026-05-23' }
])

// Employees Missing Documents (All Depts)
const employeesMissingDocs = ref([
  { id: 1, fullName: 'Biruk Mulualem', department: 'IT', missingList: 'ID Card, Guarantee Letter' },
  { id: 2, fullName: 'Dagmawi Hadgu', department: 'Finance', missingList: 'Degree Certificate' },
  { id: 3, fullName: 'Eshete Worke', department: 'Operations', missingList: 'Guarantee Letter' },
  { id: 4, fullName: 'Melaku Tewodros', department: 'Sales', missingList: 'ID Card, Degree' },
  { id: 5, fullName: 'Tigist Mulugeta', department: 'HR', missingList: 'CV/Resume' },
  { id: 6, fullName: 'Haymanot Abebaw', department: 'IT', missingList: 'Guarantee Letter' }
])

// Upcoming Contract Endings
const upcomingContractEndings = ref([
  { id: 1, employeeName: 'Melaku Tewodros', position: 'Sales Manager', department: 'Sales', endDate: '2026-06-15', daysLeft: 25, status: 'warning' },
  { id: 2, employeeName: 'Tigist Mulugeta', position: 'HR Coordinator', department: 'HR', endDate: '2026-07-01', daysLeft: 41, status: 'info' },
  { id: 3, employeeName: 'Haymanot Abebaw', position: 'Software Engineer', department: 'IT', endDate: '2026-05-30', daysLeft: 9, status: 'critical' },
  { id: 4, employeeName: 'Abebech Demisse', position: 'Accountant', department: 'Finance', endDate: '2026-06-10', daysLeft: 20, status: 'warning' }
])

// Top Late Employees
const topLateEmployees = ref([
  { id: 1, name: 'Tamrat Zerihun', department: 'IT', lateCount: 12, totalLateMinutes: 245 },
  { id: 2, name: 'Nuru Seid', department: 'Finance', lateCount: 10, totalLateMinutes: 189 },
  { id: 3, name: 'Tadese Jemberu', department: 'Operations', lateCount: 9, totalLateMinutes: 156 },
  { id: 4, name: 'Eshete Worke', department: 'IT', lateCount: 8, totalLateMinutes: 142 },
  { id: 5, name: 'Haymanot Abebaw', department: 'HR', lateCount: 7, totalLateMinutes: 98 },
  { id: 6, name: 'Melaku Tewodros', department: 'Sales', lateCount: 6, totalLateMinutes: 87 }
])

// Recent Terminations
const recentTerminations = ref([
  { id: 1, name: 'Abebech Demisse', position: 'Accountant', department: 'Finance', terminationDate: '2026-05-10', reason: 'Resignation' },
  { id: 2, name: 'Getachew Mulu', position: 'Sales Rep', department: 'Sales', terminationDate: '2026-05-05', reason: 'Contract Ended' },
  { id: 3, name: 'Wondimu Ayele', position: 'Support Specialist', department: 'Operations', terminationDate: '2026-04-28', reason: 'Resignation' },
  { id: 4, name: 'Tigist Mekonnen', position: 'Marketing Lead', department: 'Marketing', terminationDate: '2026-04-15', reason: 'Resignation' }
])

// Helper Functions
function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function goToEmployees() { router.push('/employees') }

function quickApprove(request) {
  showToastMessage(`Leave approved for ${request.employeeName}`, 'success')
  pendingLeaves.value = pendingLeaves.value.filter(r => r.leaveRequestId !== request.leaveRequestId)
}

function quickReject(request) {
  showToastMessage(`Leave rejected for ${request.employeeName}`, 'warning')
  pendingLeaves.value = pendingLeaves.value.filter(r => r.leaveRequestId !== request.leaveRequestId)
}

function remindEmployee(employee) {
  showToastMessage(`Reminder sent to ${employee.fullName} for missing: ${employee.missingList}`, 'info')
}

function remindGuarantee(employee) {
  showToastMessage(`Guarantee letter reminder sent to ${employee.name} (Sales Dept)`, 'warning')
}

async function loadDashboardData() {
  loading.value = true
  try {
    const kpiResult = await employeeService.getKpiStats()
    if (kpiResult.success && kpiResult.data) {
      employeeStats.value.total = kpiResult.data.total || 0
      employeeStats.value.active = kpiResult.data.active || 0
      employeeStats.value.fullyCompliant = kpiResult.data.fullyCompliant || 0
      employeeStats.value.missingDocsCount = kpiResult.data.missingDocs || 0
      employeeStats.value.docComplianceRate = parseFloat(kpiResult.data.complianceRate || '0')
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
}

function refreshData() {
  loadDashboardData()
  showToastMessage(`Dashboard refreshed`, 'success')
}

function showToastMessage(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  toastIcon.value = type === 'success' ? '✅' : (type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : 'ℹ️'))
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 3000)
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.hr-dashboard {
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
  background: linear-gradient(135deg, #6366f1, #4f46e5);
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
  border-top-color: #6366f1;
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
  text-align: center;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
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
.summary-icon.purple { background: #e0e7ff; }
.summary-icon.blue { background: #dbeafe; }

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-value {
  font-size: 24px;
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
  margin-top: 4px;
}

.summary-trend.positive { color: #10b981; }
.summary-trend.warning { color: #f59e0b; }

/* Department Analytics */
.dept-analytics-full {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
}

.analytics-full-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.analytics-full-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  height: 320px;
}

.analytics-full-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  flex-shrink: 0;
}

.analytics-full-icon {
  font-size: 18px;
}

.analytics-full-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

/* Custom scrollbar for all scrollable containers */
.scroll-container {
  flex: 1;
  overflow-y: auto;
  max-height: 280px;
  position: relative;
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

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Item list styling */
.item-list {
  display: flex;
  flex-direction: column;
}

.scroll-indicator {
  text-align: center;
  font-size: 10px;
  color: #94a3b8;
  padding: 8px;
  border-top: 1px solid #eef2ff;
  margin-top: 8px;
}

/* Analytics items */
.analytics-full-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.analytics-full-rank {
  width: 28px;
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
}

.analytics-full-name {
  width: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.analytics-full-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.analytics-full-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.analytics-full-value {
  width: 70px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-align: right;
}

/* Comparison Stats Vertical */
.comparison-stats-vertical {
  padding: 8px 0;
}

.comparison-item {
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.comparison-label {
  font-size: 12px;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.comparison-value {
  font-size: 18px;
  font-weight: 700;
  display: block;
  margin-bottom: 6px;
}

.comparison-value.positive { color: #10b981; }
.comparison-value.negative { color: #ef4444; }

.mini-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.mini-fill.green { background: #10b981; }
.mini-fill.red { background: #ef4444; }

.comparison-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 8px 0;
}

/* Tenure Items */
.tenure-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.tenure-label {
  width: 75px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
}

.tenure-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.tenure-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.tenure-value {
  width: 95px;
  font-size: 11px;
  color: #64748b;
  text-align: right;
}

/* Employment Type Section */
.employment-type-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
}

.distribution-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.employment-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.employment-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}

.employment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.employment-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.employment-info {
  flex: 1;
}

.employment-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
}

.employment-count {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.employment-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.employment-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.employment-percent {
  font-size: 11px;
  color: #94a3b8;
}

.view-link {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}

/* Two Column Layout */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
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
  height: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.badge.info { background: #dbeafe; color: #2563eb; }
.badge.warning { background: #fed7aa; color: #f59e0b; }
.badge.danger { background: #fee2e2; color: #dc2626; }
.badge.critical { background: #dc2626; color: white; }

/* List Items */
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: #f8fafc;
}

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

.critical-avatar, .warning-avatar, .termination-avatar {
  background: #dc2626;
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-detail {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-date {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.list-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* Critical Items */
.critical-item {
  background: #fef2f2;
  border: 1px solid #fecaca;
  margin-bottom: 8px;
  border-radius: 10px;
}

.missing-doc-item {
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 8px;
}

.termination-item {
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 8px;
}

.warning-text {
  font-size: 10px;
  color: #dc2626;
  margin-top: 2px;
}

.missing-docs-list {
  font-size: 10px;
  color: #ef4444;
  margin-top: 2px;
}

.termination-reason {
  font-size: 10px;
  padding: 4px 8px;
  background: #fee2e2;
  border-radius: 12px;
  color: #dc2626;
}

/* Sales Critical Card */
.sales-critical-card {
  border-left: 4px solid #dc2626;
}

/* Status Badges */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.status-badge.on-leave {
  background: #dbeafe;
  color: #2563eb;
}

.contract-status {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.contract-status.critical {
  background: #fee2e2;
  color: #dc2626;
}

.contract-status.warning {
  background: #fed7aa;
  color: #f59e0b;
}

.contract-status.info {
  background: #dbeafe;
  color: #3b82f6;
}

/* Top Lists */
.top-rank {
  width: 28px;
  font-size: 16px;
  font-weight: 700;
  color: #3b82f6;
  text-align: center;
  flex-shrink: 0;
}

.top-value {
  text-align: right;
  min-width: 100px;
  flex-shrink: 0;
}

.late-count {
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
}

.late-minutes {
  font-size: 10px;
  color: #f59e0b;
  margin-top: 2px;
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

.btn-small.warning {
  background: #f59e0b;
  color: white;
}

.btn-small.warning:hover {
  background: #d97706;
}

/* Document Compliance */
.compliance-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.compliance-ring-small {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.compliance-ring-small svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.compliance-ring-small .ring-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.compliance-stats {
  flex: 1;
}

.doc-stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.doc-stat.warning {
  color: #ef4444;
}

.doc-stat strong {
  font-weight: 600;
}

.doc-types-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doc-type-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.doc-type-name {
  width: 100px;
  font-size: 12px;
  color: #475569;
}

.doc-type-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.doc-type-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.doc-type-rate {
  width: 40px;
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  text-align: right;
}

/* Employment Summary Items */
.employment-summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.emp-type-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.emp-type-info {
  flex: 1;
}

.emp-type-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.emp-type-count {
  font-size: 11px;
  color: #64748b;
}

.emp-type-percent {
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

/* Department Summary */
.dept-summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dept-summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.dept-summary-name {
  width: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.dept-summary-stats {
  width: 90px;
  font-size: 12px;
}

.active-count {
  color: #10b981;
  font-weight: 600;
}

.inactive-count {
  color: #f59e0b;
  font-size: 11px;
}

.dept-summary-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.dept-summary-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

/* Empty State */
.empty-state-small {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 13px;
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
.toast.info { border-left-color: #3b82f6; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .employment-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .two-column-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hr-dashboard {
    padding: 16px;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .analytics-full-grid {
    grid-template-columns: 1fr;
  }
  .employment-grid {
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
  .top-value {
    min-width: auto;
  }
}
</style>