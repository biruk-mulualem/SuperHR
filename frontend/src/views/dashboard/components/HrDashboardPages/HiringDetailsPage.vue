<template>
  <div class="hiring-details-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Dashboard
        </button>
        <div class="header-title">
          <h1>Hiring & Termination Details</h1>
          <p class="subtitle">
            <span v-if="departmentId !== 'all'">{{ getDepartmentName(departmentId) }} • </span>
            {{ getTimeRangeLabel(timeRange) }}
            <span v-if="loading" class="loading-badge">⏳ Loading...</span>
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="printPage" title="Print">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M18 9H6"/>
            <rect x="6" y="14" width="12" height="8"/>
            <polyline points="6 18 4 18 4 12 20 12 20 18 18 18"/>
          </svg>
          Print
        </button>
        <button class="action-btn" @click="exportCSV" title="Export CSV">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
        <button class="action-btn" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Department</label>
        <select v-model="departmentId" @change="onFilterChange" class="filter-select">
          <option value="all">All Departments</option>
          <option
            v-for="dept in departments"
            :key="dept.departmentId"
            :value="dept.departmentId"
          >
            {{ dept.departmentName }} ({{ dept.count }})
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Time Range</label>
        <select v-model="timeRange" @change="onFilterChange" class="filter-select">
          <option value="1">Last 1 Month</option>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last 12 Months</option>
          <option value="24">Last 24 Months</option>
          <option value="36">Last 36 Months</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <div class="filter-group search-group">
        <label>Search</label>
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by name, department, position..."
            class="search-input"
            @input="debounceSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">✕</button>
        </div>
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="stats-summary">
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div class="stat-info">
          <span class="stat-label">Total Hired</span>
          <span class="stat-value">{{ hiringStats.totalHired || 0 }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">🚫</div>
        <div class="stat-info">
          <span class="stat-label">Total Terminated</span>
          <span class="stat-value">{{ hiringStats.totalTerminated || 0 }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">📈</div>
        <div class="stat-info">
          <span class="stat-label">Net Growth</span>
          <span class="stat-value" :class="hiringStats.netGrowth >= 0 ? 'positive' : 'negative'">
            {{ hiringStats.netGrowth >= 0 ? '+' : '' }}{{ hiringStats.netGrowth || 0 }}
          </span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🔄</div>
        <div class="stat-info">
          <span class="stat-label">Turnover Rate</span>
          <span class="stat-value">{{ turnoverRate }}%</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs">
        <button
          :class="['tab-btn', { active: activeTab === 'hired' }]"
          @click="switchTab('hired')"
        >
          <span class="tab-icon">🎉</span>
          Hired Employees
          <span class="tab-count">{{ hiredEmployees.length }}</span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'terminated' }]"
          @click="switchTab('terminated')"
        >
          <span class="tab-icon">⚠️</span>
          Terminated Employees
          <span class="tab-count">{{ terminatedEmployees.length }}</span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'comparison' }]"
          @click="switchTab('comparison')"
        >
          <span class="tab-icon">📊</span>
          Monthly Comparison
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- ==================== HIRED TAB ==================== -->
      <div v-show="activeTab === 'hired'" class="tab-content">
        <div class="table-toolbar">
          <div class="table-info">
            Showing <strong>{{ filteredHired.length }}</strong> of <strong>{{ hiredEmployees.length }}</strong> employees
          </div>
          <div class="table-actions">
            <span class="badge success">✅ Active</span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-number">#</th>
                <th class="col-employee">Employee</th>
                <th class="col-department">Department</th>
                <th class="col-position">Position</th>
                <th class="col-date">Hire Date</th>
              
               
                <th class="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(emp, index) in paginatedHired"
                :key="emp.id"
                @click="viewEmployee(emp.id)"
                class="clickable-row"
              >
                <td class="text-center">{{ getRowIndex(index) }}</td>
                <td>
                  <div class="employee-cell">
                    <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                      {{ getInitials(emp.fullName) }}
                    </div>
                    <div>
                      <div class="employee-name">{{ emp.fullName }}</div>
                      <div class="employee-id">ID: {{ emp.employeeId || 'N/A' }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="dept-badge">{{ emp.department || 'N/A' }}</span></td>
                <td>{{ emp.position || 'N/A' }}</td>
                <td>
                  <span class="date-badge">{{ emp.hireDate || 'N/A' }}</span>
                  <span class="date-label">EC</span>
                </td>
              
                
                <td>
                  <button class="btn-view" @click.stop="viewEmployee(emp.id)">
                    View
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedHired.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-icon">📭</div>
                  <p>No hired employees found</p>
                  <span class="empty-hint">Try adjusting your filters or search criteria</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="pagination.totalPages > 1">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="!pagination.hasPrevPage || loading"
            class="pagination-btn"
          >
            ← Previous
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="['page-btn', { active: page === pagination.page }]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="!pagination.hasNextPage || loading"
            class="pagination-btn"
          >
            Next →
          </button>
          <span class="pagination-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
            ({{ pagination.total }} total)
          </span>
        </div>
      </div>

      <!-- ==================== TERMINATED TAB ==================== -->
      <div v-show="activeTab === 'terminated'" class="tab-content">
        <div class="table-toolbar">
          <div class="table-info">
            Showing <strong>{{ filteredTerminated.length }}</strong> of <strong>{{ terminatedEmployees.length }}</strong> employees
          </div>
          <div class="table-actions">
            <span class="badge danger">⚠️ Terminated</span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-number">#</th>
                <th class="col-employee">Employee</th>
                <th class="col-department">Department</th>
                <th class="col-position">Position</th>
                <th class="col-date">Termination Date</th>
          
            
                <th class="col-status">Status</th>
                <th class="col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(emp, index) in paginatedTerminated"
                :key="emp.id"
                @click="viewEmployee(emp.id)"
                class="clickable-row"
              >
                <td class="text-center">{{ getRowIndex(index) }}</td>
                <td>
                  <div class="employee-cell">
                    <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                      {{ getInitials(emp.fullName) }}
                    </div>
                    <div>
                      <div class="employee-name">{{ emp.fullName }}</div>
                      <div class="employee-id">ID: {{ emp.employeeId || 'N/A' }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="dept-badge">{{ emp.department || 'N/A' }}</span></td>
                <td>{{ emp.position || 'N/A' }}</td>
                <td>
                  <span class="date-badge terminated">{{ emp.terminationDate || 'N/A' }}</span>
                  <span class="date-label">EC</span>
                </td>
               
               
                <td>
                  <span class="status-badge terminated">Terminated</span>
                </td>
                <td>
                  <button class="btn-view" @click.stop="viewEmployee(emp.id)">
                     View
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedTerminated.length === 0">
                <td colspan="9" class="empty-state">
                  <div class="empty-icon">🎉</div>
                  <p>No terminated employees found</p>
                  <span class="empty-hint">Try adjusting your filters or search criteria</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="pagination.totalPages > 1">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="!pagination.hasPrevPage || loading"
            class="pagination-btn"
          >
            ← Previous
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="['page-btn', { active: page === pagination.page }]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="!pagination.hasNextPage || loading"
            class="pagination-btn"
          >
            Next →
          </button>
          <span class="pagination-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
            ({{ pagination.total }} total)
          </span>
        </div>
      </div>

      <!-- ==================== COMPARISON TAB ==================== -->
      <div v-show="activeTab === 'comparison'" class="tab-content">
        <div class="comparison-container">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-icon">📈</div>
              <div class="summary-info">
                <span class="summary-label">Total Hired</span>
                <span class="summary-value positive">{{ hiringStats.totalHired || 0 }}</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">📉</div>
              <div class="summary-info">
                <span class="summary-label">Total Terminated</span>
                <span class="summary-value negative">{{ hiringStats.totalTerminated || 0 }}</span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">📊</div>
              <div class="summary-info">
                <span class="summary-label">Net Growth</span>
                <span
                  class="summary-value"
                  :class="hiringStats.netGrowth >= 0 ? 'positive' : 'negative'"
                >
                  {{ hiringStats.netGrowth >= 0 ? '+' : '' }}{{ hiringStats.netGrowth || 0 }}
                </span>
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">🔄</div>
              <div class="summary-info">
                <span class="summary-label">Turnover Rate</span>
                <span class="summary-value">{{ turnoverRate }}%</span>
              </div>
            </div>
          </div>

          <!-- Monthly Table -->
          <div class="monthly-section">
            <div class="section-header">
              <h4>📅 Monthly Breakdown</h4>
              <span class="total-months">{{ hiringChartData.length }} months</span>
            </div>

            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th class="text-center">Hired</th>
                    <th class="text-center">Terminated</th>
                    <th class="text-center">Net Change</th>
                    <th class="text-center">Turnover Rate</th>
                    <th class="text-center">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="month in hiringChartData" :key="month.month">
                    <td><strong>{{ formatMonth(month.month) }}</strong></td>
                    <td class="text-center hired-count">{{ month.hired || 0 }}</td>
                    <td class="text-center terminated-count">{{ month.terminated || 0 }}</td>
                    <td class="text-center" :class="month.netChange >= 0 ? 'positive' : 'negative'">
                      {{ month.netChange >= 0 ? '+' : '' }}{{ month.netChange || 0 }}
                    </td>
                    <td class="text-center">
                      <span
                        class="turnover-badge"
                        :class="getTurnoverClass(month)"
                      >
                        {{ calculateTurnoverRate(month) }}%
                      </span>
                    </td>
                    <td class="text-center">
                      <span class="trend-indicator" :class="getTrendClass(month)">
                        {{ getTrendIcon(month) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="hiringChartData.length === 0">
                    <td colspan="6" class="empty-state">
                      <div class="empty-icon">📊</div>
                      <p>No data available for this period</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Page Footer -->
    <div class="page-footer">
      <div class="footer-info">
        <span>Last updated: {{ lastUpdated }}</span>
        <span class="separator">•</span>
        <span>{{ totalRecords }} total records</span>
        <span class="separator">•</span>
        <span v-if="departmentId !== 'all'">{{ getDepartmentName(departmentId) }}</span>
        <span class="separator">•</span>
        <span>{{ getTimeRangeLabel(timeRange) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import employeeService from "@/stores/employee";

const router = useRouter();
const route = useRoute();

// ========== STATE ==========
const loading = ref(false);
const activeTab = ref('hired');
const departmentId = ref(route.query.departmentId || 'all');
const timeRange = ref(route.query.timeRange || 'all');
const searchQuery = ref('');
const lastUpdated = ref(new Date().toLocaleString());

// Data
const departments = ref([]);
const hiredEmployees = ref([]);
const terminatedEmployees = ref([]);
const hiringChartData = ref([]);
const hiringStats = ref({ totalHired: 0, totalTerminated: 0, netGrowth: 0 });

// Pagination
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false
});

let searchTimeout = null;

// ========== COMPUTED ==========
const filteredHired = computed(() => {
  if (!searchQuery.value) return hiredEmployees.value;
  const s = searchQuery.value.toLowerCase();
  return hiredEmployees.value.filter(emp =>
    (emp.fullName || '').toLowerCase().includes(s) ||
    (emp.department || '').toLowerCase().includes(s) ||
    (emp.position || '').toLowerCase().includes(s) ||
    (emp.email || '').toLowerCase().includes(s) ||
    (emp.employeeId || '').toLowerCase().includes(s)
  );
});

const filteredTerminated = computed(() => {
  if (!searchQuery.value) return terminatedEmployees.value;
  const s = searchQuery.value.toLowerCase();
  return terminatedEmployees.value.filter(emp =>
    (emp.fullName || '').toLowerCase().includes(s) ||
    (emp.department || '').toLowerCase().includes(s) ||
    (emp.position || '').toLowerCase().includes(s) ||
    (emp.email || '').toLowerCase().includes(s) ||
    (emp.employeeId || '').toLowerCase().includes(s)
  );
});

const paginatedHired = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  return filteredHired.value.slice(start, end);
});

const paginatedTerminated = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  return filteredTerminated.value.slice(start, end);
});

const totalRecords = computed(() => {
  return activeTab.value === 'hired' 
    ? hiredEmployees.value.length 
    : terminatedEmployees.value.length;
});

const turnoverRate = computed(() => {
  const total = hiringStats.value.totalHired + hiringStats.value.totalTerminated;
  if (total === 0) return '0';
  return ((hiringStats.value.totalTerminated / total) * 100).toFixed(1);
});

const visiblePages = computed(() => {
  const total = pagination.totalPages;
  const current = pagination.page;
  const pages = [];
  const delta = 2;
  
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= delta) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return pages;
});

// ========== METHODS ==========
const goBack = () => {
  router.push({ name: 'dashboard' });
};

const getDepartmentName = (deptId) => {
  const dept = departments.value.find(d => d.departmentId === parseInt(deptId));
  return dept?.departmentName || 'All Departments';
};

const getTimeRangeLabel = (range) => {
  const labels = {
    '1': 'Last 1 Month',
    '3': 'Last 3 Months',
    '6': 'Last 6 Months',
    '12': 'Last 12 Months',
    '24': 'Last 24 Months',
    '36': 'Last 36 Months',
    'all': 'All Time'
  };
  return labels[range] || 'All Time';
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return num.toLocaleString();
};

const formatMonth = (monthStr) => {
  if (!monthStr) return 'N/A';
  const [year, month] = monthStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(month) - 1] + ' ' + year;
};

const calculateTurnoverRate = (month) => {
  const total = (month.hired || 0) + (month.terminated || 0);
  if (total === 0) return '0';
  return ((month.terminated || 0) / total * 100).toFixed(1);
};

const getTurnoverClass = (month) => {
  const rate = parseFloat(calculateTurnoverRate(month));
  if (rate > 50) return 'critical';
  if (rate > 30) return 'warning';
  return 'normal';
};

const getTrendClass = (month) => {
  if (!month || month.netChange === 0) return 'neutral';
  return month.netChange > 0 ? 'positive' : 'negative';
};

const getTrendIcon = (month) => {
  if (!month || month.netChange === 0) return '➖';
  return month.netChange > 0 ? '📈' : '📉';
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef'
  ];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return colors[Math.abs(hash) % colors.length];
};

const getRowIndex = (index) => {
  return index + 1 + (pagination.page - 1) * pagination.limit;
};

const viewEmployee = (id) => {
  if (id) {
    router.push(`/employees/${id}`);
  }
};

const switchTab = (tab) => {
  activeTab.value = tab;
  pagination.page = 1;
  updatePagination();
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page;
  }
};

const updatePagination = () => {
  const total = activeTab.value === 'hired' 
    ? filteredHired.value.length 
    : filteredTerminated.value.length;
  pagination.total = total;
  pagination.totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  pagination.hasNextPage = pagination.page < pagination.totalPages;
  pagination.hasPrevPage = pagination.page > 1;
  
  if (pagination.page > pagination.totalPages) {
    pagination.page = pagination.totalPages;
  }
};

const onFilterChange = () => {
  pagination.page = 1;
  loadData();
};

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    updatePagination();
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  pagination.page = 1;
  updatePagination();
};

// ========== DATA LOADING ==========
const loadDepartments = async () => {
  try {
    const result = await employeeService.getDepartmentDistribution();
    if (result.success && result.data) {
      departments.value = result.data.departments || [];
    }
  } catch (error) {
    console.error('Error loading departments:', error);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      departmentId: departmentId.value === 'all' ? null : departmentId.value,
      months: timeRange.value === 'all' ? 'all' : timeRange.value,
    };
    
    const result = await employeeService.getHiringDetails(params);
    
    if (result.success && result.data) {
      hiredEmployees.value = result.data.hired || [];
      terminatedEmployees.value = result.data.terminated || [];
      hiringChartData.value = result.data.trends || [];
      hiringStats.value = result.data.summary || { 
        totalHired: 0, 
        totalTerminated: 0, 
        netGrowth: 0 
      };
      
      lastUpdated.value = new Date().toLocaleString();
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading hiring details:', error);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadData();
};

// ========== EXPORT FUNCTIONS ==========
const printPage = () => {
  window.print();
};

const exportCSV = () => {
  let csvContent = '';
  let filename = '';
  
  if (activeTab.value === 'hired') {
    csvContent = 'Employee,Department,Position,Hire Date (EC),Email,Salary (ETB)\n';
    csvContent += hiredEmployees.value.map(emp => 
      `"${emp.fullName || ''}","${emp.department || ''}","${emp.position || ''}","${emp.hireDate || ''}","${emp.email || ''}","${emp.salary || 0}"`
    ).join('\n');
    filename = `hired_employees_${new Date().toISOString().split('T')[0]}.csv`;
  } else if (activeTab.value === 'terminated') {
    csvContent = 'Employee,Department,Position,Termination Date (EC),Email,Last Salary (ETB)\n';
    csvContent += terminatedEmployees.value.map(emp => 
      `"${emp.fullName || ''}","${emp.department || ''}","${emp.position || ''}","${emp.terminationDate || ''}","${emp.email || ''}","${emp.salary || 0}"`
    ).join('\n');
    filename = `terminated_employees_${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    csvContent = 'Month,Hired,Terminated,Net Change,Turnover Rate (%)\n';
    csvContent += hiringChartData.value.map(month => 
      `"${formatMonth(month.month)}",${month.hired || 0},${month.terminated || 0},${month.netChange || 0},${calculateTurnoverRate(month)}`
    ).join('\n');
    filename = `monthly_comparison_${new Date().toISOString().split('T')[0]}.csv`;
  }
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ========== WATCHERS ==========
watch([() => pagination.page, () => activeTab.value], () => {
  updatePagination();
});

watch(() => route.query, (newQuery) => {
  if (newQuery.departmentId && newQuery.departmentId !== departmentId.value) {
    departmentId.value = newQuery.departmentId;
    loadData();
  }
  if (newQuery.timeRange && newQuery.timeRange !== timeRange.value) {
    timeRange.value = newQuery.timeRange;
    loadData();
  }
}, { deep: true });

// ========== LIFECYCLE ==========
onMounted(() => {
  loadDepartments();
  loadData();
});
</script>

<style scoped>
/* ========== PAGE CONTAINER ========== */
.hiring-details-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* ========== HEADER ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.back-btn:hover {
  background: #e2e8f0;
  transform: translateX(-2px);
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-badge {
  font-size: 11px;
  color: #6366f1;
  background: #e0e7ff;
  padding: 2px 10px;
  border-radius: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== FILTERS ========== */
.filters-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 140px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-group {
  flex: 2;
  min-width: 200px;
}

.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  min-height: 40px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.clear-search:hover {
  color: #ef4444;
}

/* ========== STATS SUMMARY ========== */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

/* ========== TABS ========== */
.tabs-container {
  background: white;
  border-radius: 12px 12px 0 0;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e2e8f0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #1e293b;
  background: #f8fafc;
}

.tab-btn.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}

.tab-icon {
  font-size: 16px;
}

.tab-count {
  background: #e2e8f0;
  padding: 1px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.tab-btn.active .tab-count {
  background: #e0e7ff;
  color: #6366f1;
}

/* ========== TAB CONTENT ========== */
.tab-content {
  background: white;
  border-radius: 0 0 12px 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* ========== TABLE TOOLBAR ========== */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.table-info {
  font-size: 13px;
  color: #64748b;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.badge.success {
  background: #dcfce7;
  color: #10b981;
}

.badge.danger {
  background: #fef2f2;
  color: #ef4444;
}

/* ========== TABLE ========== */
.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 12px 16px;
  text-align: left;
  background: #f8fafc;
  font-weight: 600;
  font-size: 11px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.data-table tbody tr {
  transition: background 0.15s;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.clickable-row {
  cursor: pointer;
}

.text-center {
  text-align: center;
}

/* Column widths */
.col-number { width: 50px; }
.col-employee { min-width: 200px; }
.col-department { min-width: 120px; }
.col-position { min-width: 130px; }
.col-date { min-width: 120px; }
.col-email { min-width: 160px; }
.col-salary { min-width: 100px; text-align: right; }
.col-status { min-width: 100px; }
.col-action { width: 80px; text-align: center; }

/* ========== EMPLOYEE CELL ========== */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.employee-name {
  font-weight: 500;
  color: #1e293b;
}

.employee-id {
  font-size: 11px;
  color: #94a3b8;
}

/* ========== BADGES ========== */
.dept-badge {
  background: #e2e8f0;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  display: inline-block;
}

.date-badge {
  font-weight: 500;
  color: #1e293b;
}

.date-badge.terminated {
  color: #ef4444;
}

.date-label {
  font-size: 10px;
  color: #94a3b8;
  margin-left: 4px;
}

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.terminated {
  background: #fef2f2;
  color: #ef4444;
}

.salary-cell {
  font-weight: 500;
  color: #0f172a;
  text-align: right;
}

.email-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 12px;
}

.email-link:hover {
  text-decoration: underline;
}

/* ========== BUTTONS ========== */
.btn-view {
  padding: 4px 14px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

/* ========== PAGINATION ========== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.page-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 36px;
  text-align: center;
}

.page-btn:hover:not(.active) {
  background: #f1f5f9;
}

.page-btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.pagination-info {
  font-size: 13px;
  color: #64748b;
}

/* ========== COMPARISON ========== */
.comparison-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.summary-icon {
  font-size: 28px;
}

.summary-info {
  flex: 1;
}

.summary-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.summary-value.positive {
  color: #10b981;
}

.summary-value.negative {
  color: #ef4444;
}

.monthly-section {
  margin-top: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.total-months {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 12px;
}

.hired-count {
  color: #10b981;
  font-weight: 600;
}

.terminated-count {
  color: #ef4444;
  font-weight: 600;
}

.turnover-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.turnover-badge.normal {
  background: #dcfce7;
  color: #10b981;
}

.turnover-badge.warning {
  background: #fef3c7;
  color: #f59e0b;
}

.turnover-badge.critical {
  background: #fef2f2;
  color: #ef4444;
}

.trend-indicator {
  font-size: 20px;
}

/* ========== EMPTY STATE ========== */
.empty-state {
  text-align: center;
  padding: 50px 20px !important;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
}

.empty-hint {
  font-size: 13px;
  color: #94a3b8;
}

/* ========== LOADING ========== */
.loading-state {
  background: white;
  border-radius: 0 0 12px 12px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== FOOTER ========== */
.page-footer {
  margin-top: 24px;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.footer-info {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.separator {
  margin: 0 4px;
}

/* ========== PRINT STYLES ========== */
@media print {
  .back-btn,
  .header-actions,
  .filters-bar,
  .pagination,
  .page-footer .separator,
  .btn-view {
    display: none !important;
  }
  
  .hiring-details-page {
    padding: 0;
    background: white;
  }
  
  .page-header {
    box-shadow: none;
    border-bottom: 2px solid #e2e8f0;
    border-radius: 0;
    padding: 16px 0;
  }
  
  .stats-summary {
    break-inside: avoid;
  }
  
  .table-wrapper {
    border: none;
    overflow: visible;
  }
  
  .data-table {
    font-size: 11px;
  }
  
  .data-table th {
    background: #f1f5f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .tab-content {
    box-shadow: none;
    padding: 0;
  }
  
  .tabs-container {
    box-shadow: none;
    padding: 0;
  }
  
  .tab-btn {
    font-size: 12px;
    padding: 8px 16px;
  }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-left {
    flex-wrap: wrap;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .hiring-details-page {
    padding: 12px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .header-title h1 {
    font-size: 20px;
  }
  
  .filters-bar {
    flex-direction: column;
    padding: 12px 16px;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .stats-summary {
    grid-template-columns: 1fr 1fr;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1;
    justify-content: center;
    font-size: 12px;
    padding: 10px 12px;
  }
  
  .tab-content {
    padding: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
  
  .pagination {
    gap: 8px;
  }
  
  .pagination-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
  
  .page-btn {
    padding: 4px 8px;
    font-size: 12px;
    min-width: 30px;
  }
  
  .pagination-info {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .stats-summary {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .tab-btn .tab-count {
    display: none;
  }
  
  .col-email,
  .col-action {
    display: none;
  }
}
</style>