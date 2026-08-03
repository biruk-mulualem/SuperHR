<template>
  <div class="salary-page">
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
          <h1>Salary Distribution</h1>
          <p class="subtitle">
            {{ totalEmployees }} employees • Total Salary Pool: ETB {{ formatNumber(totalSalaryPool) }}
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

    <!-- Summary Stats -->
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-icon green">💰</div>
        <div class="stat-info">
          <span class="stat-label">Average Salary</span>
          <span class="stat-value">ETB {{ formatNumber(avgSalary) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">📊</div>
        <div class="stat-info">
          <span class="stat-label">Total Salary Pool</span>
          <span class="stat-value">ETB {{ formatNumber(totalSalaryPool) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">⬆️</div>
        <div class="stat-info">
          <span class="stat-label">Highest Salary</span>
          <span class="stat-value">ETB {{ formatNumber(maxSalary) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">⬇️</div>
        <div class="stat-info">
          <span class="stat-label">Lowest Salary</span>
          <span class="stat-value">ETB {{ formatNumber(minSalary) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pink">🏢</div>
        <div class="stat-info">
          <span class="stat-label">Highest Paid Dept</span>
          <span class="stat-value">{{ highestPaidDept || 'N/A' }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Department</label>
        <select v-model="departmentFilter" @change="applyFilters" class="filter-select">
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
        <label>Salary Range</label>
        <select v-model="salaryRangeFilter" @change="applyFilters" class="filter-select">
          <option value="all">All Ranges</option>
          <option value="0-5000">Under 5K</option>
          <option value="5000-10000">5K - 10K</option>
          <option value="10000-20000">10K - 20K</option>
          <option value="20000-30000">20K - 30K</option>
          <option value="30000-50000">30K - 50K</option>
          <option value="50000-75000">50K - 75K</option>
          <option value="75000+">75K+</option>
        </select>
      </div>
      <div class="filter-group search-group">
        <label>Search Employee</label>
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by name or department..."
            class="search-input"
            @input="debounceSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">✕</button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading salary data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Salary Chart -->
      <div class="chart-section">
        <div class="chart-header">
          <h3>📊 Salary Distribution</h3>
          <span class="chart-info">{{ salaryDistribution.length }} salary ranges</span>
        </div>
        <div class="chart-container">
          <canvas ref="salaryChartCanvas"></canvas>
        </div>
      </div>

      <!-- Department Salary Table -->
      <div class="table-section">
        <div class="table-header">
          <h3>🏢 Salary by Department</h3>
          <span class="table-info">{{ salaryByDepartment.length }} departments</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Employees</th>
                <th>Avg Salary</th>
                <th>Min Salary</th>
                <th>Max Salary</th>
                <th>Total Pool</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="dept in paginatedSalaryByDept"
                :key="dept.department_name"
                @click="viewDepartment(dept.department_name)"
                class="clickable-row"
              >
                <td>
                  <span class="dept-name">{{ dept.department_name }}</span>
                </td>
                <td class="text-center">{{ dept.employee_count }}</td>
                <td class="salary-cell">ETB {{ formatNumber(dept.avg_salary) }}</td>
                <td class="salary-cell">ETB {{ formatNumber(dept.min_salary) }}</td>
                <td class="salary-cell">ETB {{ formatNumber(dept.max_salary) }}</td>
                <td class="salary-cell">ETB {{ formatNumber(dept.avg_salary * dept.employee_count) }}</td>
                <td>
                  <button class="btn-view" @click.stop="viewDepartment(dept.department_name)">
                    👁 View
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedSalaryByDept.length === 0">
                <td colspan="7" class="empty-state">
                  <div class="empty-icon">📭</div>
                  <p>No salary data available</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination for Department Table -->
        <div class="pagination" v-if="deptPagination.totalPages > 1">
          <button
            @click="changeDeptPage(deptPagination.page - 1)"
            :disabled="!deptPagination.hasPrevPage || loading"
            class="pagination-btn"
          >
            ← Previous
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in deptVisiblePages"
              :key="page"
              @click="changeDeptPage(page)"
              :class="['page-btn', { active: page === deptPagination.page }]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="changeDeptPage(deptPagination.page + 1)"
            :disabled="!deptPagination.hasNextPage || loading"
            class="pagination-btn"
          >
            Next →
          </button>
          <span class="pagination-info">
            Page {{ deptPagination.page }} of {{ deptPagination.totalPages }}
            ({{ deptPagination.total }} departments)
          </span>
        </div>
      </div>

      <!-- Highest Paid Employees -->
      <div class="highest-paid-section">
        <div class="section-header">
          <h3>🏆 Highest Paid Employees</h3>
          <span class="section-info">Top {{ highestPaid.length }} earners</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Rank</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(emp, index) in paginatedHighestPaid"
                :key="emp.employee_id"
                @click="viewEmployee(emp.employee_id)"
                class="clickable-row"
              >
                <td class="text-center">{{ index + 1 + (highestPaidPagination.page - 1) * highestPaidPagination.limit }}</td>
                <td>
                  <div class="employee-cell">
                    <div class="avatar" :style="{ background: getAvatarColor(emp.full_name) }">
                      {{ getInitials(emp.full_name) }}
                    </div>
                    <span class="employee-name">{{ emp.full_name }}</span>
                  </div>
                </td>
                <td><span class="dept-badge">{{ emp.department_name || 'N/A' }}</span></td>
                <td class="salary-cell">ETB {{ formatNumber(emp.basic_salary) }}</td>
                <td>
                  <span class="rank-badge" :class="getRankClass(index)">
                    #{{ index + 1 + (highestPaidPagination.page - 1) * highestPaidPagination.limit }}
                  </span>
                </td>
                <td>
                  <button class="btn-view" @click.stop="viewEmployee(emp.employee_id)">
                    👁 View
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedHighestPaid.length === 0">
                <td colspan="6" class="empty-state">
                  <div class="empty-icon">📭</div>
                  <p>No employee data available</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination for Highest Paid -->
        <div class="pagination" v-if="highestPaidPagination.totalPages > 1">
          <button
            @click="changeHighestPaidPage(highestPaidPagination.page - 1)"
            :disabled="!highestPaidPagination.hasPrevPage || loading"
            class="pagination-btn"
          >
            ← Previous
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in highestPaidVisiblePages"
              :key="page"
              @click="changeHighestPaidPage(page)"
              :class="['page-btn', { active: page === highestPaidPagination.page }]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="changeHighestPaidPage(highestPaidPagination.page + 1)"
            :disabled="!highestPaidPagination.hasNextPage || loading"
            class="pagination-btn"
          >
            Next →
          </button>
          <span class="pagination-info">
            Page {{ highestPaidPagination.page }} of {{ highestPaidPagination.totalPages }}
            ({{ highestPaidPagination.total }} employees)
          </span>
        </div>
      </div>
    </template>

    <!-- Page Footer -->
    <div class="page-footer">
      <div class="footer-info">
        <span>Last updated: {{ lastUpdated }}</span>
        <span class="separator">•</span>
        <span>{{ totalEmployees }} total employees</span>
        <span class="separator">•</span>
        <span>ETB {{ formatNumber(totalSalaryPool) }} total salary pool</span>
        <span class="separator">•</span>
        <span>{{ salaryByDepartment.length }} departments</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Chart, registerables } from "chart.js";
import employeeService from "@/stores/employee";

Chart.register(...registerables);

const router = useRouter();
const route = useRoute();

// ========== STATE ==========
const loading = ref(false);
const searchQuery = ref('');
const departmentFilter = ref('all');
const salaryRangeFilter = ref('all');
const lastUpdated = ref(new Date().toLocaleString());

// Chart ref
const salaryChartCanvas = ref(null);
let salaryChart = null;

// Data
const departments = ref([]);
const avgSalary = ref(0);
const totalSalaryPool = ref(0);
const maxSalary = ref(0);
const minSalary = ref(0);
const highestPaidDept = ref('');
const salaryDistribution = ref([]);
const salaryByDepartment = ref([]);
const highestPaid = ref([]);

// Pagination for Department Table
const deptPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false
});

// Pagination for Highest Paid
const highestPaidPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false
});

let searchTimeout = null;

// ========== COMPUTED ==========
const filteredSalaryByDept = computed(() => {
  let list = [...salaryByDepartment.value];
  
  if (departmentFilter.value !== 'all') {
    const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
    if (dept) {
      list = list.filter(d => d.department_name === dept.departmentName);
    }
  }
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    list = list.filter(dept =>
      dept.department_name.toLowerCase().includes(s)
    );
  }
  
  return list;
});

const filteredHighestPaid = computed(() => {
  let list = [...highestPaid.value];
  
  if (departmentFilter.value !== 'all') {
    const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
    if (dept) {
      list = list.filter(emp => emp.department_name === dept.departmentName);
    }
  }
  
  if (salaryRangeFilter.value !== 'all') {
    const [min, max] = salaryRangeFilter.value.split('-').map(Number);
    list = list.filter(emp => {
      const salary = emp.basic_salary || 0;
      if (salaryRangeFilter.value === '75000+') return salary >= 75000;
      return salary >= min && salary <= max;
    });
  }
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    list = list.filter(emp =>
      emp.full_name.toLowerCase().includes(s) ||
      emp.department_name?.toLowerCase().includes(s)
    );
  }
  
  return list;
});

const paginatedSalaryByDept = computed(() => {
  const start = (deptPagination.page - 1) * deptPagination.limit;
  const end = start + deptPagination.limit;
  return filteredSalaryByDept.value.slice(start, end);
});

const paginatedHighestPaid = computed(() => {
  const start = (highestPaidPagination.page - 1) * highestPaidPagination.limit;
  const end = start + highestPaidPagination.limit;
  return filteredHighestPaid.value.slice(start, end);
});

const deptVisiblePages = computed(() => {
  const total = deptPagination.totalPages;
  const current = deptPagination.page;
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

const highestPaidVisiblePages = computed(() => {
  const total = highestPaidPagination.totalPages;
  const current = highestPaidPagination.page;
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

const totalEmployees = computed(() => {
  return salaryByDepartment.value.reduce((sum, dept) => sum + dept.employee_count, 0);
});

// ========== METHODS ==========
const goBack = () => {
  router.push({ name: 'dashboard' });
};

const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return num.toLocaleString();
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

const getRankClass = (index) => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return 'rank-normal';
};

const viewEmployee = (id) => {
  if (id) {
    router.push(`/employees/${id}`);
  }
};

const viewDepartment = (deptName) => {
  // Filter by department
  departmentFilter.value = 'all';
  const dept = departments.value.find(d => d.departmentName === deptName);
  if (dept) {
    departmentFilter.value = String(dept.departmentId);
    applyFilters();
  }
};

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    deptPagination.page = 1;
    highestPaidPagination.page = 1;
    updatePagination();
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  deptPagination.page = 1;
  highestPaidPagination.page = 1;
  updatePagination();
};

const applyFilters = () => {
  deptPagination.page = 1;
  highestPaidPagination.page = 1;
  updatePagination();
};

const changeDeptPage = (page) => {
  if (page >= 1 && page <= deptPagination.totalPages) {
    deptPagination.page = page;
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }
};

const changeHighestPaidPage = (page) => {
  if (page >= 1 && page <= highestPaidPagination.totalPages) {
    highestPaidPagination.page = page;
  }
};

const updatePagination = () => {
  // Update department pagination
  const deptTotal = filteredSalaryByDept.value.length;
  deptPagination.total = deptTotal;
  deptPagination.totalPages = Math.max(1, Math.ceil(deptTotal / deptPagination.limit));
  deptPagination.hasNextPage = deptPagination.page < deptPagination.totalPages;
  deptPagination.hasPrevPage = deptPagination.page > 1;
  if (deptPagination.page > deptPagination.totalPages) {
    deptPagination.page = deptPagination.totalPages;
  }
  
  // Update highest paid pagination
  const highestTotal = filteredHighestPaid.value.length;
  highestPaidPagination.total = highestTotal;
  highestPaidPagination.totalPages = Math.max(1, Math.ceil(highestTotal / highestPaidPagination.limit));
  highestPaidPagination.hasNextPage = highestPaidPagination.page < highestPaidPagination.totalPages;
  highestPaidPagination.hasPrevPage = highestPaidPagination.page > 1;
  if (highestPaidPagination.page > highestPaidPagination.totalPages) {
    highestPaidPagination.page = highestPaidPagination.totalPages;
  }
};

// ========== CHART FUNCTIONS ==========
const initSalaryChart = () => {
  if (!salaryChartCanvas.value) return false;
  
  const ctx = salaryChartCanvas.value.getContext('2d');
  if (!ctx) return false;
  
  if (salaryChart) {
    salaryChart.destroy();
    salaryChart = null;
  }
  
  if (!salaryDistribution.value || salaryDistribution.value.length === 0) return false;
  
  salaryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: salaryDistribution.value.map(s => s.salary_range),
      datasets: [{
        label: 'Number of Employees',
        data: salaryDistribution.value.map(s => s.employee_count),
        backgroundColor: [
          '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
          '#059669', '#047857', '#065f46'
        ],
        borderRadius: 8,
        barPercentage: 0.7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} employee${ctx.raw !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Number of Employees', font: { size: 12 } },
          grid: { color: '#e2e8f0' },
          ticks: { precision: 0 }
        },
        x: {
          title: { display: true, text: 'Salary Range (ETB)', font: { size: 12 } },
          grid: { display: false }
        }
      }
    }
  });
  
  return true;
};

// ========== DATA LOADING ==========
const loadSalaryData = async () => {
  loading.value = true;
  try {
    const result = await employeeService.getSalaryAnalysis();
    
    if (result.success && result.data) {
      // Overview
      const overview = result.data.overview || {};
      avgSalary.value = overview.avg_salary || 0;
      totalSalaryPool.value = overview.total_salary_pool || 0;
      maxSalary.value = overview.max_salary || 0;
      minSalary.value = overview.min_salary || 0;
      
      // Department data
      salaryByDepartment.value = result.data.byDepartment || [];
      
      // Distribution
      salaryDistribution.value = result.data.distribution || [];
      
      // Highest paid
      highestPaid.value = result.data.highestPaid || [];
      
      // Get departments for filter
      const deptResult = await employeeService.getDepartmentDistribution();
      if (deptResult.success && deptResult.data) {
        departments.value = deptResult.data.departments || [];
      }
      
      // Find highest paid department
      if (salaryByDepartment.value.length > 0) {
        const sorted = [...salaryByDepartment.value].sort((a, b) => b.avg_salary - a.avg_salary);
        highestPaidDept.value = sorted[0]?.department_name || 'N/A';
      }
      
      lastUpdated.value = new Date().toLocaleString();
      updatePagination();
      
      // Initialize chart
      await nextTick();
      setTimeout(() => initSalaryChart(), 200);
    }
  } catch (error) {
    console.error('Error loading salary data:', error);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadSalaryData();
};

// ========== EXPORT FUNCTIONS ==========
const printPage = () => {
  window.print();
};

const exportCSV = () => {
  let csvContent = 'Department,Employees,Avg Salary,Min Salary,Max Salary,Total Pool\n';
  
  salaryByDepartment.value.forEach(dept => {
    const total = dept.avg_salary * dept.employee_count;
    csvContent += `"${dept.department_name}",${dept.employee_count},${dept.avg_salary},${dept.min_salary},${dept.max_salary},${total}\n`;
  });
  
  csvContent += '\nHighest Paid Employees\n';
  csvContent += 'Rank,Employee,Department,Salary\n';
  highestPaid.value.forEach((emp, index) => {
    csvContent += `#${index + 1},"${emp.full_name}","${emp.department_name || 'N/A'}",${emp.basic_salary}\n`;
  });
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `salary_distribution_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ========== WATCHERS ==========
watch([() => deptPagination.page, () => highestPaidPagination.page], () => {
  updatePagination();
});

// ========== LIFECYCLE ==========
onMounted(() => {
  loadSalaryData();
});
</script>

<style scoped>
/* ========== PAGE CONTAINER ========== */
.salary-page {
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

/* ========== SUMMARY STATS ========== */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
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
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
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

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  min-height: 40px;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* ========== CHART SECTION ========== */
.chart-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.chart-info {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 12px;
}

.chart-container {
  height: 300px;
  position: relative;
}

/* ========== TABLE SECTION ========== */
.table-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.table-info {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 12px;
}

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

.dept-name {
  font-weight: 500;
  color: #1e293b;
}

.salary-cell {
  font-weight: 500;
  color: #0f172a;
}

.dept-badge {
  background: #e2e8f0;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  display: inline-block;
}

/* ========== HIGHEST PAID SECTION ========== */
.highest-paid-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.section-info {
  font-size: 12px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 12px;
}

/* ========== EMPLOYEE CELL ========== */
.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.employee-name {
  font-weight: 500;
  color: #1e293b;
}

/* ========== RANK BADGES ========== */
.rank-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.rank-gold {
  background: #fef3c7;
  color: #d97706;
}

.rank-silver {
  background: #e2e8f0;
  color: #64748b;
}

.rank-bronze {
  background: #fef3c7;
  color: #b45309;
}

.rank-normal {
  background: #f1f5f9;
  color: #64748b;
}

/* ========== BUTTONS ========== */
.btn-view {
  padding: 4px 12px;
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

/* ========== EMPTY STATE ========== */
.empty-state {
  text-align: center;
  padding: 40px 20px !important;
  color: #94a3b8;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* ========== LOADING ========== */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
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
  
  .salary-page {
    padding: 0;
    background: white;
  }
  
  .page-header {
    box-shadow: none;
    border-bottom: 2px solid #e2e8f0;
    border-radius: 0;
    padding: 16px 0;
  }
  
  .summary-stats {
    break-inside: avoid;
  }
  
  .chart-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .table-section,
  .highest-paid-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .data-table {
    font-size: 11px;
  }
  
  .data-table th {
    background: #f1f5f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
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
  .salary-page {
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
  
  .summary-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 10px;
    font-size: 12px;
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
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>