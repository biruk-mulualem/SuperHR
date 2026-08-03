<template>
  <div class="employment-type-page">
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
          <h1>Employment Type Distribution</h1>
          <p class="subtitle">
            {{ totalEmployees }} total employees • {{ employmentTypes.length }} employment types
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
        <div class="stat-icon blue">👥</div>
        <div class="stat-info">
          <span class="stat-label">Total Employees</span>
          <span class="stat-value">{{ totalEmployees }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📋</div>
        <div class="stat-info">
          <span class="stat-label">Employment Types</span>
          <span class="stat-value">{{ employmentTypes.length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">🏆</div>
        <div class="stat-info">
          <span class="stat-label">Most Common</span>
          <span class="stat-value">{{ mostCommonType }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">📊</div>
        <div class="stat-info">
          <span class="stat-label">Diversity Index</span>
          <span class="stat-value">{{ diversityIndex }}%</span>
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
            placeholder="Search by employee name, type, or department..."
            class="search-input"
            @input="debounceSearch"
          />
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">✕</button>
        </div>
      </div>
      <div class="filter-group">
        <label>Employment Type</label>
        <select v-model="typeFilter" @change="applyFilters" class="filter-select">
          <option value="all">All Types</option>
          <option
            v-for="type in employmentTypes"
            :key="type.type"
            :value="type.type"
          >
            {{ getEmploymentTypeLabel(type.type) }} ({{ type.count }})
          </option>
        </select>
      </div>
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
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading employment type data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Employment Type Cards -->
      <div class="type-cards">
        <div
          v-for="type in filteredTypes"
          :key="type.type"
          class="type-card"
          :class="{ expanded: expandedType === type.type }"
          @click="toggleType(type.type)"
        >
          <div class="type-header">
            <div class="type-icon" :style="{ background: getTypeColor(type.type) + '20' }">
              <span style="font-size: 24px;">{{ getTypeIcon(type.type) }}</span>
            </div>
            <div class="type-info">
              <div class="type-name">{{ getEmploymentTypeLabel(type.type) }}</div>
              <div class="type-meta">
                <span class="type-count">{{ type.count }} employees</span>
                <span class="type-percentage">{{ type.percentage }}%</span>
              </div>
            </div>
            <div class="type-actions">
              <span class="expand-icon">{{ expandedType === type.type ? '−' : '+' }}</span>
            </div>
          </div>
          <div class="type-progress">
            <div
              class="type-progress-bar"
              :style="{
                width: type.percentage + '%',
                background: getTypeColor(type.type)
              }"
            ></div>
          </div>

          <!-- Expanded Employee List -->
          <div v-if="expandedType === type.type" class="type-expand">
            <div class="employee-list-header">
              <span class="employee-count">{{ getTypeEmployees(type.type).length }} employees</span>
              <input
                type="text"
                v-model="typeEmployeeSearch[type.type]"
                placeholder="Filter employees..."
                class="employee-search"
                @input="debounceTypeSearch(type.type)"
              />
            </div>
            <div class="employee-list">
              <div
                v-for="emp in getFilteredTypeEmployees(type.type)"
                :key="emp.id"
                class="employee-item"
                @click="viewEmployee(emp.id)"
              >
                <div class="employee-avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                  {{ getInitials(emp.fullName) }}
                </div>
                <div class="employee-info">
                  <span class="employee-name">{{ emp.fullName }}</span>
                  <span class="employee-detail">{{ emp.department }} • {{ emp.email }}</span>
                </div>
                <button class="btn-view" @click.stop="viewEmployee(emp.id)">
                  View →
                </button>
              </div>
              <div v-if="getFilteredTypeEmployees(type.type).length === 0" class="empty-employees">
                <span>No employees found</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredTypes.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No employment types found</p>
        <span class="empty-hint">Try adjusting your search or filter criteria</span>
      </div>

      <!-- All Employees Table -->
      <div class="table-section">
        <div class="table-header">
          <h3>📋 All Employees by Employment Type</h3>
          <div class="table-actions">
            <span class="table-info">{{ paginatedEmployees.length }} employees shown</span>
            <span class="table-total">{{ filteredEmployees.length }} total</span>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Employment Type</th>
                <th>Department</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(emp, index) in paginatedEmployees"
                :key="emp.id"
                @click="viewEmployee(emp.id)"
                class="clickable-row"
              >
                <td class="text-center">{{ getEmployeeRowIndex(index) }}</td>
                <td>
                  <div class="employee-cell">
                    <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                      {{ getInitials(emp.fullName) }}
                    </div>
                    <span class="employee-name">{{ emp.fullName }}</span>
                  </div>
                </td>
                <td>
                  <span
                    class="type-badge"
                    :style="{
                      background: getTypeColor(emp.type) + '20',
                      color: getTypeColor(emp.type)
                    }"
                  >
                    {{ getEmploymentTypeLabel(emp.type) }}
                  </span>
                </td>
                <td><span class="dept-badge">{{ emp.department || 'N/A' }}</span></td>
                <td>{{ emp.email || 'N/A' }}</td>
                <td>
                  <button class="btn-view" @click.stop="viewEmployee(emp.id)">
                    👁 View
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedEmployees.length === 0">
                <td colspan="6" class="empty-state">
                  <div class="empty-icon">📭</div>
                  <p>No employees found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="employeePagination.totalPages > 1">
          <button
            @click="changeEmployeePage(employeePagination.page - 1)"
            :disabled="!employeePagination.hasPrevPage || loading"
            class="pagination-btn"
          >
            ← Previous
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in employeeVisiblePages"
              :key="page"
              @click="changeEmployeePage(page)"
              :class="['page-btn', { active: page === employeePagination.page }]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="changeEmployeePage(employeePagination.page + 1)"
            :disabled="!employeePagination.hasNextPage || loading"
            class="pagination-btn"
          >
            Next →
          </button>
          <span class="pagination-info">
            Page {{ employeePagination.page }} of {{ employeePagination.totalPages }}
            ({{ employeePagination.total }} employees)
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
        <span>{{ employmentTypes.length }} employment types</span>
        <span class="separator">•</span>
        <span>Most common: {{ mostCommonType }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import employeeService from "@/stores/employee";

const router = useRouter();
const route = useRoute();

// ========== STATE ==========
const loading = ref(false);
const searchQuery = ref('');
const typeFilter = ref('all');
const departmentFilter = ref('all');
const expandedType = ref(null);
const typeEmployeeSearch = ref({});
const lastUpdated = ref(new Date().toLocaleString());

// Data
const employmentTypes = ref([]);
const employeesByType = ref({});
const departments = ref([]);
const allEmployees = ref([]);

// Pagination
const employeePagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false
});

let searchTimeout = null;
let typeSearchTimeouts = {};

// ========== COMPUTED ==========
const totalEmployees = computed(() => {
  let total = 0;
  employmentTypes.value.forEach(type => total += type.count);
  return total;
});

const mostCommonType = computed(() => {
  if (employmentTypes.value.length === 0) return 'N/A';
  const sorted = [...employmentTypes.value].sort((a, b) => b.count - a.count);
  return getEmploymentTypeLabel(sorted[0]?.type);
});

const diversityIndex = computed(() => {
  if (employmentTypes.value.length === 0) return '0';
  const total = totalEmployees.value;
  if (total === 0) return '0';
  
  // Calculate Shannon diversity index
  let sum = 0;
  employmentTypes.value.forEach(type => {
    const p = type.count / total;
    sum += p * Math.log(p);
  });
  const shannon = -sum;
  
  // Normalize to percentage (max diversity is ln(n))
  const maxDiversity = Math.log(employmentTypes.value.length);
  return maxDiversity > 0 ? ((shannon / maxDiversity) * 100).toFixed(1) : '0';
});

const filteredTypes = computed(() => {
  let list = [...employmentTypes.value];
  
  if (typeFilter.value !== 'all') {
    list = list.filter(t => t.type === typeFilter.value);
  }
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    list = list.filter(type => {
      const employees = getTypeEmployees(type.type);
      return getEmploymentTypeLabel(type.type).toLowerCase().includes(s) ||
             employees.some(emp => 
               emp.fullName.toLowerCase().includes(s) ||
               emp.department?.toLowerCase().includes(s)
             );
    });
  }
  
  return list;
});

const filteredEmployees = computed(() => {
  let list = [...allEmployees.value];
  
  if (typeFilter.value !== 'all') {
    list = list.filter(emp => emp.type === typeFilter.value);
  }
  
  if (departmentFilter.value !== 'all') {
    const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
    if (dept) {
      list = list.filter(emp => emp.department === dept.departmentName);
    }
  }
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    list = list.filter(emp =>
      emp.fullName.toLowerCase().includes(s) ||
      emp.department?.toLowerCase().includes(s) ||
      getEmploymentTypeLabel(emp.type).toLowerCase().includes(s) ||
      emp.email?.toLowerCase().includes(s)
    );
  }
  
  return list;
});

const paginatedEmployees = computed(() => {
  const start = (employeePagination.page - 1) * employeePagination.limit;
  const end = start + employeePagination.limit;
  return filteredEmployees.value.slice(start, end);
});

const employeeVisiblePages = computed(() => {
  const total = employeePagination.totalPages;
  const current = employeePagination.page;
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

const getEmploymentTypeLabel = (type) => {
  const labels = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'intern': 'Intern'
  };
  return labels[type] || type;
};

const getTypeColor = (type) => {
  const colors = {
    'full-time': '#10b981',
    'part-time': '#f59e0b',
    'contract': '#8b5cf6',
    'intern': '#ef4444'
  };
  return colors[type] || '#6366f1';
};

const getTypeIcon = (type) => {
  const icons = {
    'full-time': '💼',
    'part-time': '⏰',
    'contract': '📄',
    'intern': '🎓'
  };
  return icons[type] || '👤';
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

const getTypeEmployees = (type) => {
  return employeesByType.value[type] || [];
};

const getFilteredTypeEmployees = (type) => {
  const employees = getTypeEmployees(type);
  const search = typeEmployeeSearch.value[type] || '';
  if (!search) return employees;
  
  const s = search.toLowerCase();
  return employees.filter(emp =>
    emp.fullName.toLowerCase().includes(s) ||
    emp.department?.toLowerCase().includes(s) ||
    emp.email?.toLowerCase().includes(s)
  );
};

const getEmployeeRowIndex = (index) => {
  return index + 1 + (employeePagination.page - 1) * employeePagination.limit;
};

const toggleType = (type) => {
  if (expandedType.value === type) {
    expandedType.value = null;
  } else {
    expandedType.value = type;
    // Load employees if not already loaded
    if (!employeesByType.value[type] || employeesByType.value[type].length === 0) {
      loadTypeEmployees(type);
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
    employeePagination.page = 1;
    updatePagination();
  }, 300);
};

const debounceTypeSearch = (type) => {
  clearTimeout(typeSearchTimeouts[type]);
  typeSearchTimeouts[type] = setTimeout(() => {
    // Just trigger re-render via computed
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  employeePagination.page = 1;
  updatePagination();
};

const applyFilters = () => {
  employeePagination.page = 1;
  updatePagination();
};

const changeEmployeePage = (page) => {
  if (page >= 1 && page <= employeePagination.totalPages) {
    employeePagination.page = page;
    window.scrollTo({ top: 500, behavior: 'smooth' });
  }
};

const updatePagination = () => {
  const total = filteredEmployees.value.length;
  employeePagination.total = total;
  employeePagination.totalPages = Math.max(1, Math.ceil(total / employeePagination.limit));
  employeePagination.hasNextPage = employeePagination.page < employeePagination.totalPages;
  employeePagination.hasPrevPage = employeePagination.page > 1;
  
  if (employeePagination.page > employeePagination.totalPages) {
    employeePagination.page = employeePagination.totalPages;
  }
};

// ========== DATA LOADING ==========
const loadEmploymentTypes = async () => {
  loading.value = true;
  try {
    const result = await employeeService.getEmploymentTypeDistribution();
    
    if (result.success && result.data) {
      employmentTypes.value = result.data.types || [];
      employeesByType.value = result.data.employeesByType || {};
      
      // Build all employees list
      allEmployees.value = [];
      Object.entries(employeesByType.value).forEach(([type, employees]) => {
        employees.forEach(emp => {
          allEmployees.value.push({ ...emp, type });
        });
      });
      
      // Load departments
      const deptResult = await employeeService.getDepartmentDistribution();
      if (deptResult.success && deptResult.data) {
        departments.value = deptResult.data.departments || [];
      }
      
      lastUpdated.value = new Date().toLocaleString();
      updatePagination();
    }
  } catch (error) {
    console.error('Error loading employment types:', error);
  } finally {
    loading.value = false;
  }
};

const loadTypeEmployees = async (type) => {
  try {
    // If we already have employees, skip
    if (employeesByType.value[type] && employeesByType.value[type].length > 0) return;
    
    const result = await employeeService.getEmploymentTypeDistributionPaginated({
      employmentTypeFilter: type,
      page: 1,
      limit: 100
    });
    
    if (result.success && result.data) {
      const employees = result.data.employeesByType?.[type] || [];
      employeesByType.value = {
        ...employeesByType.value,
        [type]: employees
      };
    }
  } catch (error) {
    console.error('Error loading type employees:', error);
  }
};

const refreshData = () => {
  loadEmploymentTypes();
};

// ========== EXPORT FUNCTIONS ==========
const printPage = () => {
  window.print();
};

const exportCSV = () => {
  let csvContent = 'Employment Type,Count,Percentage\n';
  employmentTypes.value.forEach(type => {
    csvContent += `"${getEmploymentTypeLabel(type.type)}",${type.count},${type.percentage}%\n`;
  });
  
  csvContent += '\nEmployee,Employment Type,Department,Email\n';
  allEmployees.value.forEach(emp => {
    csvContent += `"${emp.fullName}","${getEmploymentTypeLabel(emp.type)}","${emp.department || 'N/A'}","${emp.email || 'N/A'}"\n`;
  });
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `employment_type_distribution_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ========== WATCHERS ==========
watch([() => employeePagination.page, () => employeePagination.limit], () => {
  updatePagination();
});

// ========== LIFECYCLE ==========
onMounted(() => {
  loadEmploymentTypes();
});
</script>

<style scoped>
/* ========== PAGE CONTAINER ========== */
.employment-type-page {
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

/* ========== TYPE CARDS ========== */
.type-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.type-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  overflow: hidden;
}

.type-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.type-card.expanded {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.type-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.type-header:hover {
  background: #f8fafc;
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.type-info {
  flex: 1;
}

.type-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.type-meta {
  display: flex;
  gap: 16px;
  margin-top: 2px;
}

.type-count {
  font-size: 13px;
  color: #475569;
}

.type-percentage {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}

.type-actions {
  display: flex;
  align-items: center;
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

.type-header:hover .expand-icon {
  background: #e2e8f0;
}

.type-progress {
  height: 4px;
  background: #e2e8f0;
}

.type-progress-bar {
  height: 100%;
  border-radius: 0 2px 2px 0;
  transition: width 0.6s ease;
}

/* ========== EXPANDED EMPLOYEE LIST ========== */
.type-expand {
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
  padding: 8px 12px;
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

.employee-detail {
  font-size: 12px;
  color: #64748b;
}

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
  opacity: 0;
}

.employee-item:hover .btn-view {
  opacity: 1;
}

.btn-view:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

.empty-employees {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
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

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-info {
  font-size: 12px;
  color: #94a3b8;
}

.table-total {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
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

/* ========== BADGES ========== */
.type-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
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
  .btn-view,
  .expand-icon,
  .employee-search {
    display: none !important;
  }
  
  .employment-type-page {
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
  
  .type-card {
    break-inside: avoid;
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #e2e8f0;
  }
  
  .type-expand {
    display: block !important;
  }
  
  .employee-list {
    max-height: none !important;
    overflow: visible !important;
  }
  
  .employee-item {
    break-inside: avoid;
  }
  
  .table-section {
    break-inside: avoid;
    page-break-inside: avoid;
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
  .employment-type-page {
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
  
  .type-cards {
    grid-template-columns: 1fr;
  }
  
  .type-header {
    padding: 12px 16px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 10px;
    font-size: 12px;
  }
  
  .employee-list-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .employee-search {
    width: 100%;
  }
  
  .btn-view {
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
  
  .table-actions {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>