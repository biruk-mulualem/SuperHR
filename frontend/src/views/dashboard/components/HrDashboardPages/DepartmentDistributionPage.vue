<template>
  <div class="department-page">
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
          <h1>Department Distribution</h1>
          <p class="subtitle">
            {{ totalEmployees }} total employees across {{ departments.length }} departments
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
        <div class="stat-icon blue">🏢</div>
        <div class="stat-info">
          <span class="stat-label">Total Departments</span>
          <span class="stat-value">{{ departments.length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">👥</div>
        <div class="stat-info">
          <span class="stat-label">Total Employees</span>
          <span class="stat-value">{{ totalEmployees }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📊</div>
        <div class="stat-info">
          <span class="stat-label">Average Per Dept</span>
          <span class="stat-value">{{ averagePerDept }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">🏆</div>
        <div class="stat-info">
          <span class="stat-label">Largest Department</span>
          <span class="stat-value">{{ largestDepartment }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">📉</div>
        <div class="stat-info">
          <span class="stat-label">Smallest Department</span>
          <span class="stat-value">{{ smallestDepartment }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
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
            placeholder="Search by department or employee..."
            class="search-input"
            @input="debounceSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">✕</button>
        </div>
      </div>
      <div class="filter-group">
        <label>Sort By</label>
        <select v-model="sortBy" @change="applyFilters" class="filter-select">
          <option value="name">Department Name</option>
          <option value="count">Employee Count</option>
          <option value="percentage">Percentage</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Order</label>
        <select v-model="sortOrder" @change="applyFilters" class="filter-select">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Min Employees</label>
        <input
          type="number"
          v-model="minEmployees"
          @input="applyFilters"
          class="filter-input"
          min="0"
          placeholder="0"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading department data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Department Cards -->
      <div class="department-grid">
        <div
          v-for="dept in paginatedDepartments"
          :key="dept.departmentId"
          class="department-card"
          :class="{ expanded: expandedDept === dept.departmentId }"
        >
          <div class="dept-header" @click="toggleDepartment(dept.departmentId)">
            <div class="dept-info">
              <div class="dept-name-wrapper">
                <span class="dept-icon">🏢</span>
                <span class="dept-name">{{ dept.departmentName }}</span>
                <span class="dept-code" v-if="dept.departmentCode">({{ dept.departmentCode }})</span>
              </div>
              <div class="dept-meta">
                <span class="dept-count">{{ dept.count }} employees</span>
                <span class="dept-percentage">{{ dept.percentage }}% of total</span>
              </div>
            </div>
            <div class="dept-actions">
              <span class="expand-icon">{{ expandedDept === dept.departmentId ? '−' : '+' }}</span>
            </div>
          </div>
          
          <div class="dept-progress" @click="toggleDepartment(dept.departmentId)">
            <div
              class="dept-progress-bar"
              :style="{
                width: dept.percentage + '%',
                background: getDepartmentColor(dept.departmentId)
              }"
            ></div>
          </div>

          <!-- Expanded Employee List -->
          <div v-if="expandedDept === dept.departmentId" class="dept-expand">
            <div class="employee-list-header">
              <span class="employee-count">{{ getDepartmentEmployees(dept.departmentId).length }} employees</span>
              <input
                type="text"
                v-model="deptEmployeeSearch[dept.departmentId]"
                placeholder="Filter employees..."
                class="employee-search"
                @input="debounceEmployeeSearch(dept.departmentId)"
              />
            </div>
            <div class="employee-list">
              <div
                v-for="emp in getFilteredDepartmentEmployees(dept.departmentId)"
                :key="emp.id"
                class="employee-item"
                @click="viewEmployee(emp.id)"
              >
                <div class="employee-avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                  {{ getInitials(emp.fullName) }}
                </div>
                <div class="employee-info">
                  <span class="employee-name">{{ emp.fullName }}</span>
                  <span class="employee-email">{{ emp.email }}</span>
                  <span class="employee-id">ID: {{ emp.employeeId || 'N/A' }}</span>
                </div>
                <button class="btn-view-employee" @click.stop="viewEmployee(emp.id)">
                  View →
                </button>
              </div>
              <div v-if="getFilteredDepartmentEmployees(dept.departmentId).length === 0" class="empty-employees">
                <span>No employees found</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredDepartments.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No departments found</p>
        <span class="empty-hint">Try adjusting your search or filter criteria</span>
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
          ({{ pagination.total }} departments)
        </span>
      </div>
    </template>

    <!-- Page Footer -->
    <div class="page-footer">
      <div class="footer-info">
        <span>Last updated: {{ lastUpdated }}</span>
        <span class="separator">•</span>
        <span>{{ totalEmployees }} total employees</span>
        <span class="separator">•</span>
        <span>{{ departments.length }} departments</span>
        <span class="separator">•</span>
        <span>Showing {{ paginatedDepartments.length }} departments</span>
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
const searchQuery = ref('');
const sortBy = ref('name');
const sortOrder = ref('asc');
const minEmployees = ref(0);
const expandedDept = ref(null);
const deptEmployeeSearch = ref({});
const lastUpdated = ref(new Date().toLocaleString());

// Data
const departments = ref([]);
const employeesByDepartment = ref({});

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
let employeeSearchTimeout = {};

// ========== COMPUTED ==========
const totalEmployees = computed(() => {
  let total = 0;
  departments.value.forEach(dept => total += dept.count);
  return total;
});

const averagePerDept = computed(() => {
  if (departments.value.length === 0) return '0';
  return (totalEmployees.value / departments.value.length).toFixed(1);
});

const largestDepartment = computed(() => {
  if (departments.value.length === 0) return 'N/A';
  const largest = [...departments.value].sort((a, b) => b.count - a.count)[0];
  return `${largest.departmentName} (${largest.count})`;
});

const smallestDepartment = computed(() => {
  if (departments.value.length === 0) return 'N/A';
  const smallest = [...departments.value].sort((a, b) => a.count - b.count)[0];
  return `${smallest.departmentName} (${smallest.count})`;
});

const filteredDepartments = computed(() => {
  let list = [...departments.value];
  
  // Filter by min employees
  if (minEmployees.value > 0) {
    list = list.filter(dept => dept.count >= minEmployees.value);
  }
  
  // Filter by search
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    list = list.filter(dept =>
      dept.departmentName.toLowerCase().includes(s) ||
      dept.departmentCode?.toLowerCase().includes(s) ||
      getDepartmentEmployees(dept.departmentId).some(emp =>
        emp.fullName.toLowerCase().includes(s) ||
        emp.email.toLowerCase().includes(s)
      )
    );
  }
  
  // Sort
  list.sort((a, b) => {
    let valA, valB;
    switch (sortBy.value) {
      case 'name':
        valA = a.departmentName;
        valB = b.departmentName;
        break;
      case 'count':
        valA = a.count;
        valB = b.count;
        break;
      case 'percentage':
        valA = parseFloat(a.percentage);
        valB = parseFloat(b.percentage);
        break;
      default:
        valA = a.departmentName;
        valB = b.departmentName;
    }
    
    if (typeof valA === 'string') {
      return sortOrder.value === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortOrder.value === 'asc' ? valA - valB : valB - valA;
  });
  
  return list;
});

const paginatedDepartments = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  return filteredDepartments.value.slice(start, end);
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

const getDepartmentEmployees = (deptId) => {
  const dept = departments.value.find(d => d.departmentId === deptId);
  if (!dept) return [];
  return employeesByDepartment.value[dept.departmentName] || [];
};

const getFilteredDepartmentEmployees = (deptId) => {
  const employees = getDepartmentEmployees(deptId);
  const search = deptEmployeeSearch.value[deptId] || '';
  if (!search) return employees;
  
  const s = search.toLowerCase();
  return employees.filter(emp =>
    emp.fullName.toLowerCase().includes(s) ||
    emp.email.toLowerCase().includes(s) ||
    emp.employeeId?.toLowerCase().includes(s)
  );
};

const getDepartmentColor = (deptId) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#3b82f6', '#06b6d4', '#8b5cf6', '#d946ef',
    '#f43f5e', '#e11d48', '#d97706', '#059669', '#0284c7'
  ];
  return colors[deptId % colors.length];
};

const getAvatarColor = (name) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#3b82f6', '#06b6d4'
  ];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const toggleDepartment = (deptId) => {
  if (expandedDept.value === deptId) {
    expandedDept.value = null;
  } else {
    expandedDept.value = deptId;
    // Load employees for this department if not loaded
    if (!employeesByDepartment.value[departments.value.find(d => d.departmentId === deptId)?.departmentName]) {
      loadDepartmentEmployees(deptId);
    }
  }
};

const viewEmployee = (id) => {
  if (id) {
    router.push(`/employees/${id}`);
  }
};

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    updatePagination();
  }, 300);
};

const debounceEmployeeSearch = (deptId) => {
  clearTimeout(employeeSearchTimeout[deptId]);
  employeeSearchTimeout[deptId] = setTimeout(() => {
    // Just trigger re-render via computed
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  pagination.page = 1;
  updatePagination();
};

const applyFilters = () => {
  pagination.page = 1;
  updatePagination();
};

const changePage = (page) => {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page;
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const updatePagination = () => {
  const total = filteredDepartments.value.length;
  pagination.total = total;
  pagination.totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  pagination.hasNextPage = pagination.page < pagination.totalPages;
  pagination.hasPrevPage = pagination.page > 1;
  
  if (pagination.page > pagination.totalPages) {
    pagination.page = pagination.totalPages;
  }
};

// ========== DATA LOADING ==========
const loadDepartmentData = async () => {
  loading.value = true;
  try {
    const result = await employeeService.getDepartmentDistribution();
    if (result.success && result.data) {
      departments.value = result.data.departments || [];
      employeesByDepartment.value = result.data.employeesByDepartment || {};
      
      // Pre-load first department employees if any
      if (departments.value.length > 0) {
        const firstDept = departments.value[0];
        if (firstDept && !employeesByDepartment.value[firstDept.departmentName]) {
          await loadDepartmentEmployees(firstDept.departmentId);
        }
      }
      
      lastUpdated.value = new Date().toLocaleString();
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading department data:', error);
  } finally {
    loading.value = false;
  }
};

const loadDepartmentEmployees = async (deptId) => {
  try {
    const dept = departments.value.find(d => d.departmentId === deptId);
    if (!dept) return;
    
    const result = await employeeService.getDepartmentDistributionPaginated({
      departmentId: deptId,
      page: 1,
      limit: 100
    });
    
    if (result.success && result.data) {
      const employees = result.data.employeesByDepartment?.[dept.departmentName] || [];
      employeesByDepartment.value = {
        ...employeesByDepartment.value,
        [dept.departmentName]: employees
      };
    }
  } catch (error) {
    console.error('Error loading department employees:', error);
  }
};

const refreshData = () => {
  loadDepartmentData();
};

// ========== EXPORT FUNCTIONS ==========
const printPage = () => {
  window.print();
};

const exportCSV = () => {
  let csvContent = 'Department,Employee Count,Percentage,Employees\n';
  
  departments.value.forEach(dept => {
    const employees = getDepartmentEmployees(dept.departmentId);
    const employeeNames = employees.map(e => e.fullName).join('; ');
    csvContent += `"${dept.departmentName}",${dept.count},${dept.percentage}%,"${employeeNames}"\n`;
  });
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `department_distribution_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ========== WATCHERS ==========
watch([() => pagination.page, () => pagination.limit], () => {
  updatePagination();
});

// ========== LIFECYCLE ==========
onMounted(() => {
  loadDepartmentData();
});
</script>

<style scoped>
/* ========== PAGE CONTAINER ========== */
.department-page {
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
  font-size: 20px;
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

.search-input,
.filter-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  min-height: 40px;
  transition: all 0.2s;
}

.filter-input {
  padding: 8px 12px;
}

.search-input:focus,
.filter-input:focus,
.filter-select:focus {
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

/* ========== DEPARTMENT GRID ========== */
.department-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.department-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  overflow: hidden;
}

.department-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.department-card.expanded {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.dept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.dept-header:hover {
  background: #f8fafc;
}

.dept-info {
  flex: 1;
}

.dept-name-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.dept-icon {
  font-size: 18px;
}

.dept-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.dept-code {
  font-size: 12px;
  color: #94a3b8;
}

.dept-meta {
  display: flex;
  gap: 16px;
}

.dept-count {
  font-size: 13px;
  color: #475569;
}

.dept-percentage {
  font-size: 13px;
  color: #6366f1;
  font-weight: 500;
}

.dept-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 50%;
  font-size: 18px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.dept-header:hover .expand-icon {
  background: #e2e8f0;
}

.dept-progress {
  height: 4px;
  background: #e2e8f0;
  cursor: pointer;
}

.dept-progress-bar {
  height: 100%;
  border-radius: 0 2px 2px 0;
  transition: width 0.6s ease;
}

/* ========== EXPANDED EMPLOYEE LIST ========== */
.dept-expand {
  padding: 0 20px 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.employee-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.employee-count {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.employee-search {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  width: 200px;
}

.employee-search:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.employee-list {
  max-height: 300px;
  overflow-y: auto;
}

.employee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.2s;
  cursor: pointer;
}

.employee-item:hover {
  background: #f8fafc;
}

.employee-avatar {
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

.employee-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.employee-email {
  font-size: 12px;
  color: #64748b;
}

.employee-id {
  font-size: 11px;
  color: #94a3b8;
}

.btn-view-employee {
  padding: 4px 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
}

.employee-item:hover .btn-view-employee {
  opacity: 1;
}

.btn-view-employee:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

.empty-employees {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

/* ========== EMPTY STATE ========== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
}

.empty-hint {
  font-size: 13px;
  color: #94a3b8;
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
  padding: 16px 0;
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
  .btn-view-employee,
  .expand-icon,
  .employee-search {
    display: none !important;
  }
  
  .department-page {
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
  
  .department-card {
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #e2e8f0;
  }
  
  .dept-expand {
    display: block !important;
  }
  
  .employee-list {
    max-height: none !important;
    overflow: visible !important;
  }
  
  .employee-item {
    break-inside: avoid;
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
  .department-page {
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
  
  .department-grid {
    grid-template-columns: 1fr;
  }
  
  .dept-header {
    padding: 12px 16px;
  }
  
  .dept-meta {
    flex-direction: column;
    gap: 2px;
  }
  
  .employee-list-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .employee-search {
    width: 100%;
  }
  
  .btn-view-employee {
    opacity: 1;
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