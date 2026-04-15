<template>
  <div class="hr-analytics">
    <div class="bg-gradient"></div>

    <!-- Header -->
    <div class="analytics-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1>HR Intelligence Platform</h1>
          <p>Real-time workforce analytics & document compliance</p>
        </div>
      </div>
      <div class="header-right">
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" v-for="kpi in kpiList" :key="kpi.label">
          <div class="kpi-icon" :style="{ background: kpi.gradient }">
            <component :is="kpi.icon" />
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ kpi.value }}</span>
            <span class="kpi-label">{{ kpi.label }}</span>
          </div>
        </div>
      </div>

      <!-- Main Analytics Grid -->
      <div class="analytics-grid">
        <!-- Hiring Trends Chart (Hires + Terminations) -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Hiring & Termination Trends</h3>
            </div>
            <div class="filter-group-small">
              <select v-model="hiringFilters.departmentId" @change="loadHiringTrends" class="filter-select-small">
                <option value="all">All Departments</option>
                <option v-for="dept in allDepartments" :key="dept.departmentId" :value="dept.departmentId">
                  {{ dept.departmentName }}
                </option>
              </select>
              <select v-model="hiringFilters.timeRange" @change="loadHiringTrends" class="filter-select-small">
                <option value="1">Last 1 Month</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
                <option value="24">Last 24 Months</option>
                <option value="36">Last 36 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="hiringChartCanvas"></canvas>
          </div>
          <div class="chart-stats" v-if="hiringStats.totalHired > 0 || hiringStats.totalTerminated > 0">
            <div class="stat"><span>Total Hired</span><strong>{{ hiringStats.totalHired || 0 }}</strong></div>
            <div class="stat"><span>Total Terminated</span><strong>{{ hiringStats.totalTerminated || 0 }}</strong></div>
            <div class="stat"><span>Net Growth</span><strong :class="hiringStats.netGrowth >= 0 ? 'positive' : 'negative'">{{ hiringStats.netGrowth >= 0 ? '+' : '' }}{{ hiringStats.netGrowth || 0 }}</strong></div>
          </div>
          <div v-if="(!hiringChartData || hiringChartData.length === 0) && !loading" class="no-data-message">
            No hiring/termination data available
          </div>
        </div>

        <!-- Department Distribution -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Department Distribution</h3>
            </div>
            <button class="expand-btn" @click="openDepartmentModal">View Details</button>
          </div>
          <div class="dept-list">
            <div v-for="dept in departments" :key="dept.departmentId" class="dept-row">
              <div class="dept-info">
                <span class="dept-name">{{ dept.departmentName }}</span>
                <span class="dept-count">{{ dept.count }} employees</span>
              </div>
              <div class="dept-metrics">
                <div class="metric">
                  <div class="metric-bar" :style="{ width: dept.percentage + '%', background: '#6366f1' }"></div>
                  <span>{{ dept.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Salary Distribution -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h3>Salary Distribution</h3>
            </div>
            <button class="expand-btn" @click="openSalaryModal">Show Details</button>
          </div>
          <div class="chart-container small">
            <canvas ref="salaryChartCanvas"></canvas>
          </div>
          <div class="salary-stats" v-if="salaryStats.avgSalary > 0">
            <div class="stat"><span>Average Salary</span><strong>ETB {{ formatNumber(salaryStats.avgSalary) }}</strong></div>
            <div class="stat"><span>Highest Dept</span><strong>{{ salaryStats.highestDept }}</strong></div>
            <div class="stat"><span>Total Pool</span><strong>ETB {{ formatNumber(salaryStats.totalPool) }}</strong></div>
          </div>
          <div v-if="(!salaryChartData || salaryChartData.length === 0) && !loading" class="no-data-message">
            No salary data available
          </div>
        </div>

        <!-- Employment Type Distribution -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Employment Type</h3>
            </div>
            <button class="expand-btn" @click="openEmploymentTypeModal">Show Details</button>
          </div>
          <div class="employment-types">
            <div v-for="type in employmentTypes" :key="type.type" class="type-row">
              <div class="type-label">
                <span>{{ getEmploymentTypeLabel(type.type) }}</span>
                <span>{{ type.count }}</span>
              </div>
              <div class="type-bar">
                <div class="type-fill" :style="{ width: type.percentage + '%', background: getTypeColor(type.type) }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Hires -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 8v4l3 3M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                </svg>
              </div>
              <h3>Recent Hires</h3>
            </div>
            <div class="filter-group-small">
              <input type="number" v-model.number="recentHireDaysParam" placeholder="Days" class="filter-input-small" @change="loadRecentHires">
              <button class="expand-btn" @click="openRecentHiresModal">View All</button>
            </div>
          </div>
          <div class="recent-hires-list">
            <div v-for="hire in recentHires.slice(0, 5)" :key="hire.id" class="hire-item" @click="viewEmployee(hire.id)">
              <div class="hire-avatar">{{ getInitials(hire.fullName) }}</div>
              <div class="hire-info">
                <span class="hire-name">{{ hire.fullName }}</span>
                <span class="hire-dept">{{ hire.department }} • {{ hire.position }}</span>
              </div>
              <div class="hire-date">{{ hire.daysSinceHire }} days ago</div>
            </div>
            <div v-if="recentHires.length === 0" class="no-data-message small">
              <p>No recent hires</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Compliance Section -->
      <div class="compliance-section">
        <div class="section-header">
          <div>
            <h2>Document Compliance Status</h2>
            <p>Track employee document submission and verification</p>
          </div>
          <div class="filter-group-small">
            <select v-model="complianceFilters.documentType" @change="loadDocumentCompliance" class="filter-select-small">
              <option value="all">All Documents</option>
              <option value="guarantee_letter">Missing Guarantee Letter</option>
              <option value="id_card">Missing ID Card</option>
              <option value="cv">Missing CV</option>
              <option value="degree">Missing Degree</option>
            </select>
            <input type="number" v-model.number="complianceFilters.guaranteeMonths" placeholder="Old guarantee (months)" class="filter-input-small" @change="loadDocumentCompliance">
            <select v-model="complianceFilters.departmentId" @change="loadDocumentCompliance" class="filter-select-small">
              <option value="all">All Departments</option>
              <option v-for="dept in allDepartments" :key="dept.departmentId" :value="dept.departmentId">
                {{ dept.departmentName }}
              </option>
            </select>
          </div>
          <div class="overall-compliance">
            <div class="compliance-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" stroke-width="8"/>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" stroke-width="8" 
                  :stroke-dasharray="283" :stroke-dashoffset="283 - (283 * docComplianceRate / 100)" 
                  transform="rotate(-90 50 50)"/>
              </svg>
              <span class="ring-value">{{ docComplianceRate }}%</span>
            </div>
            <span class="ring-label">Overall Compliance</span>
          </div>
        </div>
        <div class="compliance-grid">
          <div v-for="doc in documentTypes" :key="doc.name" class="compliance-card">
            <div class="compliance-header">
              <div class="doc-icon" :style="{ background: doc.bgColor }">
                <component :is="doc.icon" />
              </div>
              <div>
                <h4>{{ doc.name }}</h4>
                <span>{{ doc.submitted }}/{{ doc.total }} submitted</span>
              </div>
            </div>
            <div class="compliance-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: doc.rate + '%', background: doc.color }"></div>
              </div>
              <span class="progress-rate">{{ doc.rate }}%</span>
            </div>
            <div class="compliance-status" :class="doc.rate >= 80 ? 'good' : doc.rate >= 60 ? 'warning' : 'bad'">
              {{ doc.rate >= 80 ? 'Compliant' : doc.rate >= 60 ? 'Attention Needed' : 'Critical' }}
            </div>
          </div>
        </div>
        
        <!-- Employees with Missing Documents -->
        <div class="missing-docs-section" v-if="employeesWithMissingDocs.length > 0">
          <h4>⚠️ Employees Missing Documents ({{ employeesWithMissingDocs.length }})</h4>
          <div class="missing-docs-table">
            <table>
              <thead>
                <tr><th>Employee</th><th>Department</th><th>Missing Documents</th><th>Action</th></tr>
              </thead>
              <tbody>
                <tr v-for="emp in employeesWithMissingDocs.slice(0, 5)" :key="emp.id">
                  <td @click="viewEmployee(emp.id)" style="cursor: pointer">{{ emp.fullName }}</td>
                  <td @click="viewEmployee(emp.id)" style="cursor: pointer">{{ emp.department }}</td>
                  <td class="missing-list">{{ emp.missingList }}</td>
                  <td><button class="remind-btn" @click.stop="remindEmployee(emp)">Remind</button></td>
                </tr>
              </tbody>
            </table>
            <div v-if="employeesWithMissingDocs.length > 5" class="view-all">
              <button @click="openMissingDocsModal">View all {{ employeesWithMissingDocs.length }} employees →</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Department Modal -->
    <div v-if="showDepartmentModal" class="modal-overlay" @click="closeDepartmentModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Department Distribution - Employee List</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('department')">🖨️ Print</button>
            <button class="modal-action-btn" @click="saveModalAsCSV('department')">💾 Save as CSV</button>
            <button class="modal-action-btn" @click="closeDepartmentModal">✕</button>
          </div>
        </div>
        <div class="modal-body" id="department-modal-content">
          <div class="modal-filter">
            <input type="text" v-model="departmentFilter" placeholder="Filter by department or employee..." class="filter-input">
          </div>
          <table class="modal-table">
            <thead>
              <tr><th>Department</th><th>Employee Name</th><th>Email</th></tr>
            </thead>
            <tbody>
              <tr v-for="emp in flattenedDepartmentEmployees" :key="emp.id" @click="viewEmployee(emp.id)" style="cursor: pointer">
                <td>{{ emp.department }}</td>
                <td>{{ emp.fullName }}</td>
                <td>{{ emp.email }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="closeDepartmentModal">Close</button></div>
      </div>
    </div>

    <!-- Salary Details Modal -->
    <div v-if="showSalaryModal" class="modal-overlay" @click="closeSalaryModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Salary Analysis Details</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('salary')">🖨️ Print</button>
            <button class="modal-action-btn" @click="saveModalAsCSV('salary')">💾 Save as CSV</button>
            <button class="modal-action-btn" @click="closeSalaryModal">✕</button>
          </div>
        </div>
        <div class="modal-body" id="salary-modal-content">
          <h4>Top 10 Highest Paid</h4>
          <table class="modal-table">
            <thead><tr><th>#</th><th>Employee</th><th>Department</th><th>Salary</th></tr></thead>
            <tbody>
              <tr v-for="(emp, index) in highestPaid" :key="emp.employee_id" @click="viewEmployee(emp.employee_id)" style="cursor: pointer">
                <td>{{ index + 1 }}</td>
                <td>{{ emp.full_name }}</td>
                <td>{{ emp.department_name }}</td>
                <td>ETB {{ formatNumber(emp.basic_salary) }}</td>
              </tr>
            </tbody>
          </table>
          <h4 style="margin-top: 24px;">Salary by Department</h4>
          <table class="modal-table">
            <thead><tr><th>Department</th><th>Employees</th><th>Avg Salary</th><th>Min Salary</th><th>Max Salary</th></tr></thead>
            <tbody>
              <tr v-for="dept in salaryByDepartment" :key="dept.department_id">
                <td>{{ dept.department_name }}</td>
                <td>{{ dept.employee_count }}</td>
                <td>ETB {{ formatNumber(dept.avg_salary) }}</td>
                <td>ETB {{ formatNumber(dept.min_salary) }}</td>
                <td>ETB {{ formatNumber(dept.max_salary) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="closeSalaryModal">Close</button></div>
      </div>
    </div>

    <!-- Employment Type Modal -->
    <div v-if="showEmploymentTypeModal" class="modal-overlay" @click="closeEmploymentTypeModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Employment Type - Employee List</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('employmentType')">🖨️ Print</button>
            <button class="modal-action-btn" @click="saveModalAsCSV('employmentType')">💾 Save as CSV</button>
            <button class="modal-action-btn" @click="closeEmploymentTypeModal">✕</button>
          </div>
        </div>
        <div class="modal-body" id="employment-type-modal-content">
          <div class="modal-filter">
            <input type="text" v-model="employmentTypeFilter" placeholder="Filter by employee..." class="filter-input">
          </div>
          <table class="modal-table">
            <thead><tr><th>Employment Type</th><th>Employee Name</th><th>Email</th></tr></thead>
            <tbody>
              <tr v-for="emp in flattenedEmploymentTypeEmployees" :key="emp.id" @click="viewEmployee(emp.id)" style="cursor: pointer">
                <td>{{ getEmploymentTypeLabel(emp.type) }}</td>
                <td>{{ emp.fullName }}</td>
                <td>{{ emp.email }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="closeEmploymentTypeModal">Close</button></div>
      </div>
    </div>

    <!-- Recent Hires Modal -->
    <div v-if="showRecentHiresModal" class="modal-overlay" @click="closeRecentHiresModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Recent Hires (Last {{ recentHireDaysParam }} Days)</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('recentHires')">🖨️ Print</button>
            <button class="modal-action-btn" @click="saveModalAsCSV('recentHires')">💾 Save as CSV</button>
            <button class="modal-action-btn" @click="closeRecentHiresModal">✕</button>
          </div>
        </div>
        <div class="modal-body" id="recent-hires-modal-content">
          <div class="modal-filter">
            <input type="text" v-model="recentHiresFilter" placeholder="Filter by name, department, or position..." class="filter-input">
          </div>
          <table class="modal-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Position</th><th>Hire Date</th><th>Days Ago</th></tr></thead>
            <tbody>
              <tr v-for="hire in filteredRecentHires" :key="hire.id" @click="viewEmployee(hire.id)" style="cursor: pointer">
                <td>{{ hire.fullName }}</td>
                <td>{{ hire.department }}</td>
                <td>{{ hire.position }}</td>
                <td>{{ formatDate(hire.hireDate) }}</td>
                <td>{{ hire.daysSinceHire }} days</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="closeRecentHiresModal">Close</button></div>
      </div>
    </div>

    <!-- Missing Documents Modal -->
    <div v-if="showMissingDocsModal" class="modal-overlay" @click="closeMissingDocsModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Employees Missing Documents</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('missingDocs')">🖨️ Print</button>
            <button class="modal-action-btn" @click="saveModalAsCSV('missingDocs')">💾 Save as CSV</button>
            <button class="modal-action-btn" @click="closeMissingDocsModal">✕</button>
          </div>
        </div>
        <div class="modal-body" id="missing-docs-modal-content">
          <div class="modal-filter">
            <input type="text" v-model="missingDocsFilter" placeholder="Filter by employee or department..." class="filter-input">
          </div>
          <table class="modal-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Missing Documents</th><th>Action</th></tr></thead>
            <tbody>
              <tr v-for="emp in filteredMissingDocs" :key="emp.id">
                <td @click="viewEmployee(emp.id)" style="cursor: pointer">{{ emp.fullName }}</td>
                <td @click="viewEmployee(emp.id)" style="cursor: pointer">{{ emp.department }}</td>
                <td class="missing-list">{{ emp.missingList }}</td>
                <td><button class="remind-btn" @click.stop="remindEmployee(emp)">Remind</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer"><button class="btn-secondary" @click="closeMissingDocsModal">Close</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'
import employeeService from '@/stores/employee'

Chart.register(...registerables)

const router = useRouter()
const loading = ref(false)

// Chart refs
const hiringChartCanvas = ref(null)
const salaryChartCanvas = ref(null)

// Chart instances
let hiringChart = null
let salaryChart = null

// Filter states
const hiringFilters = reactive({ 
  departmentId: 'all',
  timeRange: 'all'
})
const complianceFilters = reactive({ 
  documentType: 'all', 
  guaranteeMonths: 6,
  departmentId: 'all'
})
const recentHireDaysParam = ref(90)

// Modal states
const showDepartmentModal = ref(false)
const showSalaryModal = ref(false)
const showEmploymentTypeModal = ref(false)
const showRecentHiresModal = ref(false)
const showMissingDocsModal = ref(false)

// Filter values for modals
const departmentFilter = ref('')
const employmentTypeFilter = ref('')
const recentHiresFilter = ref('')
const missingDocsFilter = ref('')

// Data stores
const kpiData = ref({ total: 0, active: 0, onLeave: 0, terminated: 0, fullyCompliant: 0, missingDocs: 0, complianceRate: '0' })
const departments = ref([])
const allDepartments = ref([])
const employmentTypes = ref([])
const recentHires = ref([])
const employeesWithMissingDocs = ref([])
const employeesByDepartment = ref({})
const employeesByType = ref({})
const highestPaid = ref([])
const salaryByDepartment = ref([])

// Chart data
const hiringChartData = ref([])
const salaryChartData = ref([])
const hiringStats = ref({ totalHired: 0, totalTerminated: 0, netGrowth: 0 })
const salaryStats = ref({ avgSalary: 0, highestDept: '-', totalPool: 0 })
const docComplianceRate = ref(0)
const documentTypes = ref([])

// Computed values for modals
const filteredRecentHires = computed(() => {
  return recentHires.value.filter(hire =>
    hire.fullName.toLowerCase().includes(recentHiresFilter.value.toLowerCase()) ||
    hire.department?.toLowerCase().includes(recentHiresFilter.value.toLowerCase()) ||
    hire.position?.toLowerCase().includes(recentHiresFilter.value.toLowerCase())
  )
})

const filteredMissingDocs = computed(() => {
  return employeesWithMissingDocs.value.filter(emp =>
    emp.fullName.toLowerCase().includes(missingDocsFilter.value.toLowerCase()) ||
    emp.department.toLowerCase().includes(missingDocsFilter.value.toLowerCase())
  )
})

const flattenedDepartmentEmployees = computed(() => {
  const result = []
  Object.entries(employeesByDepartment.value).forEach(([deptName, employees]) => {
    employees.forEach(emp => {
      if (emp.fullName.toLowerCase().includes(departmentFilter.value.toLowerCase()) ||
          deptName.toLowerCase().includes(departmentFilter.value.toLowerCase())) {
        result.push({ ...emp, department: deptName })
      }
    })
  })
  return result
})

const flattenedEmploymentTypeEmployees = computed(() => {
  const result = []
  Object.entries(employeesByType.value).forEach(([typeName, employees]) => {
    employees.forEach(emp => {
      if (emp.fullName.toLowerCase().includes(employmentTypeFilter.value.toLowerCase())) {
        result.push({ ...emp, type: typeName })
      }
    })
  })
  return result
})

// KPI Cards
const kpiList = computed(() => [
  { label: 'Total Headcount', value: kpiData.value.total || '0', icon: 'UsersIcon', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { label: 'Active Employees', value: kpiData.value.active || '0', icon: 'ActivityIcon', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { label: 'On Leave', value: kpiData.value.onLeave || '0', icon: 'CalendarIcon', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  { label: 'Fully Compliant', value: kpiData.value.complianceRate || '0%', icon: 'CheckIcon', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { label: 'Missing Docs', value: kpiData.value.missingDocs || '0', icon: 'AlertIcon', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' }
])

// Helper functions
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getEmploymentTypeLabel = (type) => {
  const labels = { 'full-time': 'Full Time', 'part-time': 'Part Time', contract: 'Contract', intern: 'Intern' }
  return labels[type] || type
}

const getTypeColor = (type) => {
  const colors = { 'full-time': '#10b981', 'part-time': '#f59e0b', 'contract': '#8b5cf6', 'intern': '#ef4444' }
  return colors[type] || '#6366f1'
}

// ============================================================================
// CHART INITIALIZATION FUNCTIONS
// ============================================================================

const initHiringChart = () => {
  console.log('initHiringChart called with data length:', hiringChartData.value?.length)
  
  if (!hiringChartCanvas.value) {
    console.log('Hiring chart canvas not found, retrying...')
    setTimeout(() => {
      if (hiringChartData.value?.length > 0) {
        initHiringChart()
      }
    }, 100)
    return false
  }
  
  const ctx = hiringChartCanvas.value.getContext('2d')
  if (!ctx) return false
  
  // Destroy existing chart
  if (hiringChart) {
    console.log('Destroying existing hiring chart')
    hiringChart.destroy()
    hiringChart = null
  }
  
  if (!hiringChartData.value || hiringChartData.value.length === 0) {
    console.log('No hiring data available')
    return false
  }
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const labels = hiringChartData.value.map(m => {
    const [year, month] = m.month.split('-')
    return `${monthNames[parseInt(month) - 1]} ${year}`
  })
  
  const hiresData = hiringChartData.value.map(m => m.hired || 0)
  const terminatedData = hiringChartData.value.map(m => m.terminated || 0)
  
  console.log('Creating new hiring chart with labels:', labels)
  console.log('Hires data:', hiresData)
  console.log('Terminations data:', terminatedData)
  
  hiringChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hires',
          data: hiresData,
          backgroundColor: '#10b981',
          borderRadius: 8,
          barPercentage: 0.7
        },
        {
          label: 'Terminations',
          data: terminatedData,
          backgroundColor: '#ef4444',
          borderRadius: 8,
          barPercentage: 0.7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} employee${ctx.raw !== 1 ? 's' : ''}` } }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          title: { display: true, text: 'Number of Employees' }, 
          grid: { color: '#e2e8f0' }, 
          ticks: { precision: 0, stepSize: 1 }
        },
        x: { 
          title: { display: true, text: 'Month' }, 
          grid: { display: false }
        }
      }
    }
  })
  
  console.log('Hiring chart created successfully')
  return true
}

const initSalaryChart = () => {
  if (!salaryChartCanvas.value) return false
  
  const ctx = salaryChartCanvas.value.getContext('2d')
  if (!ctx) return false
  
  if (salaryChart) {
    salaryChart.destroy()
    salaryChart = null
  }
  
  if (!salaryChartData.value || salaryChartData.value.length === 0) return false
  
  salaryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: salaryChartData.value.map(s => s.salary_range),
      datasets: [{
        label: 'Number of Employees',
        data: salaryChartData.value.map(s => s.employee_count),
        backgroundColor: '#10b981',
        borderRadius: 8,
        barPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw} employee${ctx.raw !== 1 ? 's' : ''}` } } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Number of Employees' }, grid: { color: '#e2e8f0' }, ticks: { precision: 0 } },
        x: { title: { display: true, text: 'Salary Range (ETB)' }, grid: { display: false } }
      }
    }
  })
  
  return true
}

// ============================================================================
// WATCHERS FOR DATA CHANGES
// ============================================================================

// Watch for hiring chart data changes to re-render chart
watch(hiringChartData, async (newData, oldData) => {
  console.log('hiringChartData changed from', oldData?.length, 'to', newData?.length)
  if (newData && newData.length > 0) {
    await nextTick()
    setTimeout(() => {
      initHiringChart()
    }, 100)
  } else if (newData && newData.length === 0) {
    if (hiringChart) {
      hiringChart.destroy()
      hiringChart = null
    }
  }
}, { deep: true })

// Watch for loading to complete
watch(loading, (newVal) => {
  if (!newVal && hiringChartData.value && hiringChartData.value.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        initHiringChart()
      }, 100)
    })
  }
})

// ============================================================================
// WATCHERS FOR FILTERS
// ============================================================================

watch(() => hiringFilters.departmentId, (newVal, oldVal) => {
  console.log('Department filter changed from', oldVal, 'to', newVal)
  loadHiringTrends()
})

watch(() => hiringFilters.timeRange, (newVal, oldVal) => {
  console.log('Time range filter changed from', oldVal, 'to', newVal)
  loadHiringTrends()
})

watch(() => complianceFilters.documentType, (newVal) => {
  console.log('Document type filter changed to:', newVal)
  loadDocumentCompliance()
})

watch(() => complianceFilters.guaranteeMonths, (newVal) => {
  console.log('Guarantee months filter changed to:', newVal)
  loadDocumentCompliance()
})

watch(() => complianceFilters.departmentId, (newVal) => {
  console.log('Compliance department filter changed to:', newVal)
  loadDocumentCompliance()
})

watch(() => recentHireDaysParam, (newVal) => {
  console.log('Recent hires days changed to:', newVal)
  loadRecentHires()
})

// ============================================================================
// DATA LOADING FUNCTIONS
// ============================================================================

const loadKpiStats = async () => {
  try {
    const result = await employeeService.getKpiStats()
    if (result.success && result.data) {
      kpiData.value = result.data
    }
  } catch (error) {
    console.error('Error loading KPI stats:', error)
  }
}

const loadHiringTrends = async () => {
  try {
    const timeRangeValue = hiringFilters.timeRange === 'all' ? 'all' : hiringFilters.timeRange
    
    console.log('🔄 Loading hiring trends with:', {
      departmentId: hiringFilters.departmentId,
      months: timeRangeValue
    })
    
    const result = await employeeService.getHiringTrends({ 
      departmentId: hiringFilters.departmentId,
      months: timeRangeValue
    })
    
    console.log('📊 Hiring trends API response:', result)
    
    if (result.success && result.data && result.data.trends) {
      hiringChartData.value = [...result.data.trends]
      hiringStats.value = {
        totalHired: result.data.totalHired || 0,
        totalTerminated: result.data.totalTerminated || 0,
        netGrowth: result.data.netGrowth || 0
      }
      console.log('✅ Hiring chart data updated with', hiringChartData.value.length, 'months')
      
      await nextTick()
      setTimeout(() => {
        initHiringChart()
      }, 100)
    } else {
      hiringChartData.value = []
      hiringStats.value = { totalHired: 0, totalTerminated: 0, netGrowth: 0 }
    }
  } catch (error) {
    console.error('❌ Error loading hiring trends:', error)
    hiringChartData.value = []
  }
}

const loadDepartmentDistribution = async () => {
  try {
    const result = await employeeService.getDepartmentDistribution()
    if (result.success && result.data) {
      departments.value = result.data.departments || []
      allDepartments.value = result.data.departments || []
      employeesByDepartment.value = result.data.employeesByDepartment || {}
    }
  } catch (error) {
    console.error('Error loading department distribution:', error)
  }
}

const loadEmploymentTypeDistribution = async () => {
  try {
    const result = await employeeService.getEmploymentTypeDistribution()
    if (result.success && result.data) {
      employmentTypes.value = result.data.types || []
      employeesByType.value = result.data.employeesByType || {}
    }
  } catch (error) {
    console.error('Error loading employment type distribution:', error)
  }
}

const loadRecentHires = async () => {
  try {
    const result = await employeeService.getRecentHires({ days: recentHireDaysParam.value })
    if (result.success && result.data) {
      recentHires.value = result.data.hires || []
    }
  } catch (error) {
    console.error('Error loading recent hires:', error)
    recentHires.value = []
  }
}

const loadSalaryAnalysis = async () => {
  try {
    const result = await employeeService.getSalaryAnalysis()
    if (result.success && result.data) {
      if (result.data.distribution && result.data.distribution.length > 0) {
        salaryChartData.value = result.data.distribution
      } else {
        salaryChartData.value = []
      }
      
      salaryStats.value = {
        avgSalary: result.data.overview?.avg_salary || 0,
        highestDept: result.data.byDepartment?.[0]?.department_name || '-',
        totalPool: result.data.overview?.total_salary_pool || 0
      }
      highestPaid.value = result.data.highestPaid || []
      salaryByDepartment.value = result.data.byDepartment || []
    }
  } catch (error) {
    console.error('Error loading salary analysis:', error)
    salaryChartData.value = []
  }
}

const loadDocumentCompliance = async () => {
  try {
    const result = await employeeService.getDocumentCompliance({
      documentType: complianceFilters.documentType,
      guaranteeMonths: complianceFilters.guaranteeMonths,
      departmentId: complianceFilters.departmentId
    })
    if (result.success && result.data) {
      employeesWithMissingDocs.value = result.data.employeesWithMissingDocs || []
      docComplianceRate.value = parseFloat(result.data.summary?.complianceRate || '0')
      
      const docTypes = result.data.byDocumentType || {}
      const activeTotal = result.data.summary?.activeEmployees || 1
      documentTypes.value = [
        { name: 'ID Card', rate: parseFloat(docTypes.id_card?.submissionRate || '0'), submitted: docTypes.id_card?.submitted || 0, total: activeTotal, color: '#3b82f6', bgColor: '#dbeafe', icon: 'IdCardIcon' },
        { name: 'CV / Resume', rate: parseFloat(docTypes.cv?.submissionRate || '0'), submitted: docTypes.cv?.submitted || 0, total: activeTotal, color: '#10b981', bgColor: '#dcfce7', icon: 'FileTextIcon' },
        { name: 'Degree / Certificate', rate: parseFloat(docTypes.degree?.submissionRate || '0'), submitted: docTypes.degree?.submitted || 0, total: activeTotal, color: '#8b5cf6', bgColor: '#f3e8ff', icon: 'GraduationCapIcon' },
        { name: 'Guarantee Letter', rate: parseFloat(docTypes.guarantee_letter?.submissionRate || '0'), submitted: docTypes.guarantee_letter?.submitted || 0, total: activeTotal, color: '#f59e0b', bgColor: '#fed7aa', icon: 'FileIcon' }
      ]
    }
  } catch (error) {
    console.error('Error loading document compliance:', error)
  }
}

const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadKpiStats(),
      loadHiringTrends(),
      loadDepartmentDistribution(),
      loadEmploymentTypeDistribution(),
      loadRecentHires(),
      loadSalaryAnalysis(),
      loadDocumentCompliance()
    ])
    
    await nextTick()
    setTimeout(() => {
      if (hiringChartData.value && hiringChartData.value.length > 0) {
        console.log('Initial chart data loaded, rendering chart...')
        initHiringChart()
      }
      if (salaryChartData.value && salaryChartData.value.length > 0) {
        initSalaryChart()
      }
    }, 200)
  } catch (error) {
    console.error('Error loading analytics data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  hiringFilters.departmentId = 'all'
  hiringFilters.timeRange = 'all'
  complianceFilters.documentType = 'all'
  complianceFilters.guaranteeMonths = 6
  complianceFilters.departmentId = 'all'
  recentHireDaysParam.value = 90
  loadAllData()
}

// Modal functions
const openDepartmentModal = () => { showDepartmentModal.value = true; departmentFilter.value = '' }
const closeDepartmentModal = () => { showDepartmentModal.value = false }
const openSalaryModal = () => { showSalaryModal.value = true }
const closeSalaryModal = () => { showSalaryModal.value = false }
const openEmploymentTypeModal = () => { showEmploymentTypeModal.value = true; employmentTypeFilter.value = '' }
const closeEmploymentTypeModal = () => { showEmploymentTypeModal.value = false }
const openRecentHiresModal = () => { showRecentHiresModal.value = true; recentHiresFilter.value = '' }
const closeRecentHiresModal = () => { showRecentHiresModal.value = false }
const openMissingDocsModal = () => { showMissingDocsModal.value = true; missingDocsFilter.value = '' }
const closeMissingDocsModal = () => { showMissingDocsModal.value = false }

// Print and Save functions
const printModal = (modalType) => {
  let elementId = ''
  switch(modalType) {
    case 'department': elementId = 'department-modal-content'; break
    case 'salary': elementId = 'salary-modal-content'; break
    case 'employmentType': elementId = 'employment-type-modal-content'; break
    case 'recentHires': elementId = 'recent-hires-modal-content'; break
    case 'missingDocs': elementId = 'missing-docs-modal-content'; break
  }
  const printContent = document.getElementById(elementId).innerHTML
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html><head><title>HR Analytics Report</title>
    <style>body { font-family: Arial, sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background: #f2f2f2; }</style>
    </head><body>${printContent}</body></html>
  `)
  printWindow.document.close()
  printWindow.print()
}

const saveModalAsCSV = (modalType) => {
  let csvContent = '', filename = ''
  switch(modalType) {
    case 'department':
      csvContent = 'Department,Employee Name,Email\n' + flattenedDepartmentEmployees.value.map(emp => `"${emp.department}","${emp.fullName}","${emp.email}"`).join('\n')
      filename = 'department_employees'
      break
    case 'salary':
      csvContent = 'Type,Name,Value\n' + highestPaid.value.map((emp, i) => `"Highest Paid ${i+1}","${emp.full_name}","ETB ${formatNumber(emp.basic_salary)}"`).join('\n') + '\n' +
        'Department,Employees,Avg Salary,Min Salary,Max Salary\n' + salaryByDepartment.value.map(dept => `"${dept.department_name}","${dept.employee_count}","ETB ${formatNumber(dept.avg_salary)}","ETB ${formatNumber(dept.min_salary)}","ETB ${formatNumber(dept.max_salary)}"`).join('\n')
      filename = 'salary_details'
      break
    case 'employmentType':
      csvContent = 'Employment Type,Employee Name,Email\n' + flattenedEmploymentTypeEmployees.value.map(emp => `"${getEmploymentTypeLabel(emp.type)}","${emp.fullName}","${emp.email}"`).join('\n')
      filename = 'employment_type_employees'
      break
    case 'recentHires':
      csvContent = 'Employee Name,Department,Position,Hire Date,Days Ago\n' + filteredRecentHires.value.map(hire => `"${hire.fullName}","${hire.department}","${hire.position}","${formatDate(hire.hireDate)}","${hire.daysSinceHire} days"`).join('\n')
      filename = 'recent_hires'
      break
    case 'missingDocs':
      csvContent = 'Employee Name,Department,Missing Documents\n' + filteredMissingDocs.value.map(emp => `"${emp.fullName}","${emp.department}","${emp.missingList}"`).join('\n')
      filename = 'missing_documents'
      break
  }
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const remindEmployee = (employee) => {
  alert(`Reminder sent to ${employee.fullName} for missing: ${employee.missingList}`)
}

const viewEmployee = (id) => {
  router.push(`/employees/${id}`)
}

// Icons
const UsersIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }
const ActivityIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' }
const CalendarIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' }
const CheckIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' }
const AlertIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>' }
const IdCardIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 2v20"/></svg>' }
const FileTextIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' }
const GraduationCapIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10-5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' }
const FileIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>' }

onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
/* MAIN CONTAINER */
.hr-analytics {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #f0f4f8 100%);
}

/* HEADER */
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
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
  color: #0f172a;
  margin: 0 0 4px 0;
}

.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

/* LOADING STATE */
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

/* KPI GRID - 5 cards in one row */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

.kpi-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  display: block;
  line-height: 1.2;
}

.kpi-label {
  font-size: 13px;
  color: #64748b;
  display: block;
  margin-top: 4px;
}

/* ANALYTICS GRID */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

@media (max-width: 1200px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

.analytics-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.analytics-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
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
}

.title-icon.blue { background: #dbeafe; }
.title-icon.blue svg { color: #3b82f6; }
.title-icon.purple { background: #f3e8ff; }
.title-icon.purple svg { color: #8b5cf6; }
.title-icon.green { background: #dcfce7; }
.title-icon.green svg { color: #10b981; }
.title-icon.pink { background: #fce7f3; }
.title-icon.pink svg { color: #ec4899; }

.title-icon svg {
  width: 16px;
  height: 16px;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

/* FILTERS */
.filter-group-small {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select-small, .filter-input-small {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}

.filter-input-small {
  width: 70px;
}

.expand-btn {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* CHARTS */
.chart-container {
  padding: 20px;
  height: 300px;
  position: relative;
  width: 100%;
}

.chart-container.small {
  height: 250px;
}

/* CHART STATS */
.chart-stats, .salary-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 20px 20px;
  border-top: 1px solid #e9edf2;
  background: #fafcfc;
}

.stat {
  text-align: center;
}

.stat span {
  font-size: 11px;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.stat strong {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.stat strong.positive {
  color: #10b981;
}

.stat strong.negative {
  color: #ef4444;
}

/* NO DATA MESSAGE */
.no-data-message {
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.no-data-message.small {
  padding: 20px;
}

.no-data-message svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

/* DEPARTMENT LIST */
.dept-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dept-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dept-info {
  flex: 1;
}

.dept-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.dept-count {
  font-size: 12px;
  color: #64748b;
  margin-left: 8px;
}

.dept-metrics {
  width: 200px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.metric span {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  min-width: 40px;
}

/* EMPLOYMENT TYPES */
.employment-types {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-label {
  width: 100px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #1e293b;
}

.type-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.type-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

/* RECENT HIRES */
.recent-hires-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hire-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.hire-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.hire-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.hire-info {
  flex: 1;
}

.hire-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: block;
}

.hire-dept {
  font-size: 11px;
  color: #64748b;
}

.hire-date {
  font-size: 11px;
  color: #94a3b8;
}

.recent-count {
  background: #6366f1;
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.view-all {
  text-align: center;
  padding-top: 8px;
}

.view-all button {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 12px;
  cursor: pointer;
}

.view-all button:hover {
  text-decoration: underline;
}

/* COMPLIANCE SECTION */
.compliance-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.section-header p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.overall-compliance {
  text-align: center;
}

.compliance-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.compliance-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.ring-label {
  font-size: 11px;
  color: #64748b;
  display: block;
  margin-top: 8px;
}

.compliance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .compliance-grid {
    grid-template-columns: 1fr;
  }
}

.compliance-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 16px;
  transition: all 0.2s;
}

.compliance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.compliance-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.doc-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doc-icon svg {
  width: 20px;
  height: 20px;
  color: white;
}

.compliance-header h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.compliance-header span {
  font-size: 11px;
  color: #64748b;
}

.compliance-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-rate {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.compliance-status {
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 20px;
  display: inline-block;
}

.compliance-status.good {
  background: #10b98115;
  color: #10b981;
}

.compliance-status.warning {
  background: #f59e0b15;
  color: #f59e0b;
}

.compliance-status.bad {
  background: #ef444415;
  color: #ef4444;
}

/* MISSING DOCUMENTS TABLE */
.missing-docs-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e9edf2;
}

.missing-docs-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
}

.missing-docs-table {
  overflow-x: auto;
}

.missing-docs-table table {
  width: 100%;
  border-collapse: collapse;
}

.missing-docs-table th,
.missing-docs-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e9edf2;
}

.missing-docs-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
}

.missing-docs-table td {
  font-size: 13px;
  color: #1e293b;
}

.missing-list {
  color: #ef4444;
  font-size: 12px;
}

.remind-btn {
  padding: 4px 12px;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.remind-btn:hover {
  background: #e2e8f0;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-container.large {
  max-width: 1200px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9edf2;
  background: #fafcfc;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 8px;
}

.modal-action-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-action-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-filter {
  margin-bottom: 16px;
}

.modal-filter .filter-input {
  width: 100%;
  padding: 10px 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e9edf2;
  background: #fafcfc;
}

.modal-table {
  width: 100%;
  border-collapse: collapse;
}

.modal-table th,
.modal-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e9edf2;
}

.modal-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
}

.modal-table td {
  font-size: 13px;
  color: #1e293b;
}

.btn-secondary {
  padding: 8px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f8fafc;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hr-analytics {
    padding: 16px;
  }
  
  .analytics-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .dept-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .dept-metrics {
    width: 100%;
  }
}
</style>