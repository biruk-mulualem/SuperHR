<template>
  <div class="department-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div>
          <h1>Department Distribution</h1>
          <p class="subtitle">
            {{ totalEmployees }} employees • {{ departments.length }} departments
            <span v-if="loading" class="loading-badge">Loading...</span>
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="exportAllDepartments">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export All
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

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-box-value">{{ departments.length }}</span>
        <span class="stat-box-label">Departments</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-value">{{ totalEmployees }}</span>
        <span class="stat-box-label">Total Employees</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-value">{{ averagePerDept }}</span>
        <span class="stat-box-label">Avg per Dept</span>
      </div>
      <div class="stat-box highlight">
        <span class="stat-box-value">{{ largestDepartment }}</span>
        <span class="stat-box-label">🏆 Largest</span>
      </div>
      <div class="stat-box highlight">
        <span class="stat-box-value">{{ smallestDepartment }}</span>
        <span class="stat-box-label">📉 Smallest</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-row">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search departments or employees..."
          class="search-input"
          @input="debounceSearch"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">✕</button>
      </div>
      <div class="filter-group">
        <select v-model="sortBy" @change="applyFilters" class="filter-select">
          <option value="name">Sort by Name</option>
          <option value="count">Sort by Count</option>
          <option value="percentage">Sort by %</option>
        </select>
        <select v-model="sortOrder" @change="applyFilters" class="filter-select">
          <option value="asc">↑ Ascending</option>
          <option value="desc">↓ Descending</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading departments...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Department List -->
      <div class="department-list">
        <div
          v-for="dept in paginatedDepartments"
          :key="dept.departmentId"
          class="department-item"
          :class="{ expanded: expandedDept === dept.departmentId }"
        >
          <div class="dept-main" @click="toggleDepartment(dept.departmentId)">
            <div class="dept-info">
              <div class="dept-name">
                <span class="dept-icon">🏢</span>
                <span>{{ dept.departmentName }}</span>
                <span class="dept-code" v-if="dept.departmentCode">({{ dept.departmentCode }})</span>
              </div>
              <div class="dept-meta">
                <span class="dept-count">{{ dept.count }} employees</span>
                <span class="dept-percent">{{ dept.percentage }}%</span>
              </div>
            </div>
            <div class="dept-bar-wrap">
              <div class="dept-bar">
                <div
                  class="dept-bar-fill"
                  :style="{
                    width: dept.percentage + '%',
                    background: getDepartmentColor(dept.departmentId)
                  }"
                ></div>
              </div>
              <div class="dept-actions">
                <button 
                  class="export-dept-btn" 
                  @click.stop="exportDepartment(dept)"
                  title="Export department employees to Excel"
                >
                  📊
                </button>
                <span class="expand-icon">{{ expandedDept === dept.departmentId ? '−' : '+' }}</span>
              </div>
            </div>
          </div>

          <!-- Expanded Employees -->
          <div v-if="expandedDept === dept.departmentId" class="dept-employees">
            <div class="emp-header">
              <span>{{ getDepartmentEmployees(dept.departmentId).length }} employees</span>
              <div class="emp-header-actions">
                <button 
                  class="export-emp-btn" 
                  @click.stop="exportDepartment(dept)"
                  title="Export these employees to Excel"
                >
                  📊 Export to Excel
                </button>
                <input
                  type="text"
                  v-model="deptEmployeeSearch[dept.departmentId]"
                  placeholder="Filter employees..."
                  class="emp-search"
                  @click.stop
                />
              </div>
            </div>
            <div class="emp-list">
              <div
                v-for="emp in getFilteredDepartmentEmployees(dept.departmentId)"
                :key="emp.id"
                class="emp-item"
              >
                <div class="emp-avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                  {{ getInitials(emp.fullName) }}
                </div>
                <div class="emp-details">
                  <span class="emp-name">{{ emp.fullName }}</span>
                  <span class="emp-email">{{ emp.email }}</span>
                </div>
                <button class="emp-view-btn" @click.stop="viewEmployee(emp.id)">
                  View →
                </button>
              </div>
              <div v-if="getFilteredDepartmentEmployees(dept.departmentId).length === 0" class="emp-empty">
                No employees found
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="filteredDepartments.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>No departments found</p>
        <span>Try adjusting your search</span>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="!pagination.hasPrevPage"
          class="page-btn"
        >
          ←
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          :class="['page-num', { active: page === pagination.page }]"
        >
          {{ page }}
        </button>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="!pagination.hasNextPage"
          class="page-btn"
        >
          →
        </button>
        <span class="page-info">{{ pagination.page }} of {{ pagination.totalPages }}</span>
      </div>
    </template>

    <!-- Footer -->
    <div class="page-footer">
      <span>Updated: {{ lastUpdated }}</span>
      <span>•</span>
      <span>{{ totalEmployees }} employees</span>
      <span>•</span>
      <span>{{ departments.length }} departments</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";

const router = useRouter();

// State
const loading = ref(false);
const searchQuery = ref('');
const sortBy = ref('count');
const sortOrder = ref('desc');
const expandedDept = ref(null);
const deptEmployeeSearch = ref({});
const lastUpdated = ref(new Date().toLocaleString());

const departments = ref([]);
const employeesByDepartment = ref({});

const pagination = reactive({
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false
});

let searchTimeout = null;

// Computed
const totalEmployees = computed(() => {
  return departments.value.reduce((sum, d) => sum + d.count, 0);
});

const averagePerDept = computed(() => {
  if (!departments.value.length) return '0';
  return (totalEmployees.value / departments.value.length).toFixed(1);
});

const largestDepartment = computed(() => {
  if (!departments.value.length) return 'N/A';
  const d = [...departments.value].sort((a, b) => b.count - a.count)[0];
  return `${d.departmentName} (${d.count})`;
});

const smallestDepartment = computed(() => {
  if (!departments.value.length) return 'N/A';
  const d = [...departments.value].sort((a, b) => a.count - b.count)[0];
  return `${d.departmentName} (${d.count})`;
});

const filteredDepartments = computed(() => {
  let list = [...departments.value];
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    list = list.filter(d =>
      d.departmentName.toLowerCase().includes(s) ||
      d.departmentCode?.toLowerCase().includes(s) ||
      getDepartmentEmployees(d.departmentId).some(e =>
        e.fullName.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s)
      )
    );
  }
  
  list.sort((a, b) => {
    let va, vb;
    switch (sortBy.value) {
      case 'name': va = a.departmentName; vb = b.departmentName; break;
      case 'count': va = a.count; vb = b.count; break;
      case 'percentage': va = parseFloat(a.percentage); vb = parseFloat(b.percentage); break;
      default: va = a.count; vb = b.count;
    }
    if (typeof va === 'string') {
      return sortOrder.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortOrder.value === 'asc' ? va - vb : vb - va;
  });
  
  return list;
});

const paginatedDepartments = computed(() => {
  const start = (pagination.page - 1) * pagination.limit;
  return filteredDepartments.value.slice(start, start + pagination.limit);
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

// Methods
const goBack = () => router.push({ name: 'dashboard' });

const getDepartmentEmployees = (deptId) => {
  const dept = departments.value.find(d => d.departmentId === deptId);
  return dept ? (employeesByDepartment.value[dept.departmentName] || []) : [];
};

const getFilteredDepartmentEmployees = (deptId) => {
  const employees = getDepartmentEmployees(deptId);
  const search = deptEmployeeSearch.value[deptId] || '';
  if (!search) return employees;
  const s = search.toLowerCase();
  return employees.filter(e =>
    e.fullName.toLowerCase().includes(s) ||
    e.email.toLowerCase().includes(s)
  );
};

const getDepartmentColor = (id) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#d946ef', '#f43f5e'];
  return colors[id % colors.length];
};

const getAvatarColor = (name) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4'];
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
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const toggleDepartment = (id) => {
  expandedDept.value = expandedDept.value === id ? null : id;
  if (expandedDept.value === id) {
    const dept = departments.value.find(d => d.departmentId === id);
    if (dept && !employeesByDepartment.value[dept.departmentName]) {
      loadDepartmentEmployees(id);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const updatePagination = () => {
  const total = filteredDepartments.value.length;
  pagination.total = total;
  pagination.totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  pagination.hasNextPage = pagination.page < pagination.totalPages;
  pagination.hasPrevPage = pagination.page > 1;
  if (pagination.page > pagination.totalPages) pagination.page = pagination.totalPages;
};

// ===== EXPORT FUNCTIONS =====

// Export a single department to Excel
const exportDepartment = (dept) => {
  const employees = getDepartmentEmployees(dept.departmentId);
  
  if (employees.length === 0) {
    alert(`No employees found in ${dept.departmentName} department`);
    return;
  }

  let csv = `Department: ${dept.departmentName}\n`;
  csv += `Total Employees: ${dept.count}\n`;
  csv += `Percentage of Total: ${dept.percentage}%\n\n`;
  csv += 'Employee ID,Full Name,Email,Department,Position\n';
  
  employees.forEach(emp => {
    csv += `"${emp.employeeId || 'N/A'}"`;
    csv += `,"${emp.fullName}"`;
    csv += `,"${emp.email || 'N/A'}"`;
    csv += `,"${dept.departmentName}"`;
    csv += `,"${emp.position || 'N/A'}"\n`;
  });

  csv += `\nReport Generated: ${new Date().toLocaleString()}`;

  downloadCSV(csv, `${dept.departmentName}_Employees`);
};

// Export all departments
const exportAllDepartments = () => {
  if (departments.value.length === 0) {
    alert('No departments available to export');
    return;
  }

  let csv = 'DEPARTMENT DISTRIBUTION REPORT\n';
  csv += `Generated: ${new Date().toLocaleString()}\n`;
  csv += `Total Departments: ${departments.value.length}\n`;
  csv += `Total Employees: ${totalEmployees.value}\n\n`;
  csv += '='.repeat(80) + '\n\n';
  
  departments.value.forEach((dept, index) => {
    const employees = getDepartmentEmployees(dept.departmentId);
    
    csv += `DEPARTMENT #${index + 1}: ${dept.departmentName}\n`;
    csv += `Employees: ${dept.count} (${dept.percentage}% of total)\n`;
    csv += '-'.repeat(60) + '\n';
    csv += 'Employee ID,Full Name,Email,Position\n';
    
    if (employees.length > 0) {
      employees.forEach(emp => {
        csv += `"${emp.employeeId || 'N/A'}"`;
        csv += `,"${emp.fullName}"`;
        csv += `,"${emp.email || 'N/A'}"`;
        csv += `,"${emp.position || 'N/A'}"\n`;
      });
    } else {
      csv += 'No employees found in this department\n';
    }
    
    csv += '\n' + '-'.repeat(60) + '\n\n';
  });

  downloadCSV(csv, 'All_Departments_Report');
};

// Helper function to download CSV
const downloadCSV = (csvContent, filename) => {
  const blob = new Blob(['\uFEFF' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Data
const loadDepartmentData = async () => {
  loading.value = true;
  try {
    const result = await employeeService.getDepartmentDistribution();
    if (result.success && result.data) {
      departments.value = result.data.departments || [];
      employeesByDepartment.value = result.data.employeesByDepartment || {};
      if (departments.value.length) {
        const first = departments.value[0];
        if (first && !employeesByDepartment.value[first.departmentName]) {
          await loadDepartmentEmployees(first.departmentId);
        }
      }
      lastUpdated.value = new Date().toLocaleString();
      updatePagination();
    }
  } catch (error) {
    console.error('Error:', error);
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
    console.error('Error loading employees:', error);
  }
};

const refreshData = () => loadDepartmentData();

// Watch
watch([() => pagination.page, () => pagination.limit], updatePagination);

// Mount
onMounted(loadDepartmentData);
</script>

<style scoped>
/* ===== PAGE ===== */
.department-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f7fb;
}

/* ===== HEADER ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  transform: translateX(-2px);
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 2px 0 0;
}

.loading-badge {
  font-size: 11px;
  color: #6366f1;
  background: #e0e7ff;
  padding: 2px 10px;
  border-radius: 12px;
  margin-left: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f1f5f9;
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

/* ===== STATS ROW ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-box {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #e2e8f0;
}

.stat-box-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.stat-box-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.stat-box.highlight {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.stat-box.highlight .stat-box-value {
  font-size: 16px;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .stat-box.highlight {
    display: none;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }
}

/* ===== FILTERS ===== */
.filters-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.search-box {
  flex: 2;
  min-width: 200px;
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
  background: #f8fafc;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  color: #ef4444;
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
}

/* ===== LOADING ===== */
.loading-state {
  text-align: center;
  padding: 60px;
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

/* ===== DEPARTMENT LIST ===== */
.department-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.department-item {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  overflow: hidden;
}

.department-item:hover {
  border-color: #cbd5e1;
}

.department-item.expanded {
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99,102,241,0.08);
}

.dept-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.dept-main:hover {
  background: #f8fafc;
}

.dept-info {
  flex: 1;
}

.dept-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.dept-icon {
  font-size: 18px;
}

.dept-code {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
}

.dept-meta {
  display: flex;
  gap: 16px;
  margin-top: 2px;
}

.dept-count {
  font-size: 13px;
  color: #475569;
}

.dept-percent {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}

.dept-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.dept-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.dept-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.dept-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.export-dept-btn {
  padding: 4px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.export-dept-btn:hover {
  background: #10b981;
  color: white;
  border-color: #10b981;
  transform: scale(1.05);
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
  flex-shrink: 0;
}

.dept-main:hover .expand-icon {
  background: #e2e8f0;
}

/* ===== EMPLOYEES ===== */
.dept-employees {
  padding: 0 20px 16px;
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.emp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.emp-header span {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.emp-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.export-emp-btn {
  padding: 4px 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-emp-btn:hover {
  background: #059669;
  transform: scale(1.05);
}

.emp-search {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  width: 180px;
  background: #f8fafc;
  transition: all 0.2s;
}

.emp-search:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
}

.emp-list {
  max-height: 280px;
  overflow-y: auto;
}

.emp-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s;
  cursor: default;
}

.emp-item:hover {
  background: #f8fafc;
}

.emp-avatar {
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

.emp-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.emp-name {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.emp-email {
  font-size: 12px;
  color: #94a3b8;
}

.emp-view-btn {
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

.emp-item:hover .emp-view-btn {
  opacity: 1;
}

.emp-view-btn:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

.emp-empty {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

/* ===== EMPTY STATE ===== */
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
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  margin: 0;
}

.empty-state span {
  font-size: 13px;
  color: #94a3b8;
}

/* ===== PAGINATION ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0;
}

.page-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-num {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 36px;
  text-align: center;
}

.page-num:hover:not(.active) {
  background: #f1f5f9;
}

.page-num.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.page-info {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 8px;
}

/* ===== FOOTER ===== */
.page-footer {
  margin-top: 24px;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ===== PRINT ===== */
@media print {
  .back-btn, .header-actions, .filters-row, .pagination, .emp-view-btn, .expand-icon, .emp-search, .export-dept-btn, .export-emp-btn {
    display: none !important;
  }
  .department-page { padding: 0; background: white; }
  .page-header { border-bottom: 2px solid #e2e8f0; padding: 16px 0; }
  .department-item { break-inside: avoid; border: 1px solid #ddd; }
  .dept-employees { display: block !important; }
  .emp-list { max-height: none !important; overflow: visible !important; }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .department-page { padding: 16px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-left { flex-wrap: wrap; }
  .header-actions { justify-content: flex-start; }
  .filters-row { flex-direction: column; }
  .filter-group { flex-wrap: wrap; }
  .emp-search { width: 100%; }
  .dept-main { flex-direction: column; align-items: stretch; gap: 8px; }
  .dept-bar-wrap { min-width: unset; }
  .emp-header { flex-direction: column; align-items: stretch; }
  .emp-header-actions { flex-direction: column; align-items: stretch; }
}

@media (max-width: 480px) {
  .header-left h1 { font-size: 18px; }
  .stat-box-value { font-size: 18px; }
  .dept-name { font-size: 14px; }
}
</style>