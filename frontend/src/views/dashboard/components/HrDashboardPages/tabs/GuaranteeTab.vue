<template>
  <div class="guarantee-tab">
    <!-- Filters -->
    <div class="filters-row">
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
      <div class="filter-group search-group">
        <label>Search</label>
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="9" r="7"/>
            <path d="M19 19l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by name, code, department..."
            class="search-input"
            @input="handleSearchInput"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">✕</button>
        </div>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="filter-controls">
      <button
        :class="['filter-btn', { active: filter === 'missing' }]"
        @click="changeFilter('missing')"
      >
        <span class="dot red"></span>
        No Guarantee ({{ missingData.length }})
      </button>
      <button
        :class="['filter-btn', { active: filter === 'one' }]"
        @click="changeFilter('one')"
      >
        <span class="dot orange"></span>
        Only 1 ({{ needSecondData.length }})
      </button>
      <button
        :class="['filter-btn', { active: filter === 'two' }]"
        @click="changeFilter('two')"
      >
        <span class="dot green"></span>
        Has 2+ ({{ withTwoData.length }})
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading guarantee data...</p>
    </div>

    <!-- Table -->
    <div v-if="!loading" class="table-container">
      <div class="table-header">
        <h4>📋 Guarantee Letter Status</h4>
        <div class="table-header-actions">
          <span class="table-stats">{{ getFilteredData.length }} total employees</span>
          <button class="export-btn" @click="exportToExcel" title="Export to Excel">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 2v12M7 11l3 3 3-3"/>
              <path d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"/>
            </svg>
            Export
          </button>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Code</th>
              <th>Department</th>
              <th>Position</th>
              <th>Guarantees</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(emp, idx) in paginatedData"
              :key="emp.id || emp.employeeId"
              class="data-row"
            >
              <td class="text-center">{{ getRowIndex(idx) }}</td>
              <td>
                <div class="employee-cell">
                  <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                    {{ getInitials(emp.fullName) }}
                  </div>
                  <div class="employee-info">
                    <span class="employee-name">{{ emp.fullName || emp.fullNameEnglish || 'N/A' }}</span>
                    <span class="employee-email">{{ emp.email || 'No email' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="employee-code">{{ emp.employeeCode || emp.employeeId || 'N/A' }}</span>
              </td>
              <td><span class="dept-badge">{{ emp.department || 'N/A' }}</span></td>
              <td>{{ emp.position || 'N/A' }}</td>
              <td>
                <span :class="['guarantee-badge', getGuaranteeCountClass(emp.guaranteeCount)]">
                  {{ emp.guaranteeCount || 0 }}
                </span>
              </td>
              <td>
                <button
                  class="btn-view"
                  @click.stop="$emit('view-employee', emp.id || emp.employeeId)"
                >
                  👁 View
                </button>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td colspan="7" class="empty-state">
                No employees found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="pagination" v-if="pagination.totalPages > 1">
        <button
          @click="goToPreviousPage"
          :disabled="!pagination.hasPrevPage"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
          <span class="pagination-details">
            ({{ getFilteredData.length }} items)
          </span>
        </span>
        <button
          @click="goToNextPage"
          :disabled="!pagination.hasNextPage"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
      <!-- Page numbers -->
      <div class="pagination-numbers" v-if="pagination.totalPages > 1">
        <button
          v-for="page in getPageNumbers"
          :key="page"
          @click="goToPage(page)"
          :class="['page-number', { active: page === pagination.page }]"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import employeeService from "@/stores/employee";

const emit = defineEmits(['update-count', 'view-employee']);

// ========== STATE ==========
const loading = ref(false);
const filter = ref('missing');
const searchQuery = ref('');
const departmentFilter = ref('all');

const departments = ref([]);
const allData = ref([]);
const missingData = ref([]);
const needSecondData = ref([]);
const withTwoData = ref([]);

const pagination = ref({
  page: 1,
  limit: 20,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
  totalItems: 0
});

let searchTimeout = null;
let isApplyingFilter = false;

// ========== COMPUTED ==========
const getFilteredData = computed(() => {
  let source = [];
  switch (filter.value) {
    case 'missing':
      source = missingData.value;
      break;
    case 'one':
      source = needSecondData.value;
      break;
    case 'two':
      source = withTwoData.value;
      break;
    default:
      source = allData.value;
  }

  // Client-side filtering for search when data is already loaded
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return source;
  }
  
  const s = searchQuery.value.toLowerCase().trim();
  return source.filter(emp => {
    const fullName = (emp.fullName || emp.fullNameEnglish || '').toLowerCase();
    const employeeCode = (emp.employeeCode || emp.employeeId || '').toLowerCase();
    const department = (emp.department || '').toLowerCase();
    const position = (emp.position || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    
    return fullName.includes(s) ||
           employeeCode.includes(s) ||
           department.includes(s) ||
           position.includes(s) ||
           email.includes(s);
  });
});

const paginatedData = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.limit;
  const end = start + pagination.value.limit;
  return getFilteredData.value.slice(start, end);
});

const getPageNumbers = computed(() => {
  const total = pagination.value.totalPages;
  const current = pagination.value.page;
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
});

// ========== METHODS ==========
const getRowIndex = (idx) => {
  return idx + 1 + (pagination.value.page - 1) * pagination.value.limit;
};

const changeFilter = (newFilter) => {
  if (isApplyingFilter) return;
  filter.value = newFilter;
  pagination.value.page = 1;
  // Reload data with new filter
  loadData();
};

const goToPreviousPage = () => {
  if (pagination.value.hasPrevPage) {
    const newPage = pagination.value.page - 1;
    goToPage(newPage);
  }
};

const goToNextPage = () => {
  if (pagination.value.hasNextPage) {
    const newPage = pagination.value.page + 1;
    goToPage(newPage);
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page;
    // Load data for new page
    loadData();
    // Scroll to top of table
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

const updatePagination = () => {
  const total = getFilteredData.value.length;
  const limit = pagination.value.limit || 20;
  pagination.value.totalItems = total;
  pagination.value.totalPages = Math.max(1, Math.ceil(total / limit));
  pagination.value.hasNextPage = pagination.value.page < pagination.value.totalPages;
  pagination.value.hasPrevPage = pagination.value.page > 1;
  
  // Ensure current page is valid
  if (pagination.value.page > pagination.value.totalPages) {
    pagination.value.page = pagination.value.totalPages;
  }
};

const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    // Use client-side filtering or server-side search
    if (searchQuery.value && searchQuery.value.trim().length > 0) {
      // Client-side filtering is handled by computed property
      updatePagination();
    } else {
      // Reload data when search is cleared
      loadData();
    }
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  pagination.value.page = 1;
  loadData();
};

const applyFilters = () => {
  if (isApplyingFilter) return;
  isApplyingFilter = true;
  pagination.value.page = 1;
  loadData().finally(() => {
    isApplyingFilter = false;
  });
};

const loadData = async () => {
  loading.value = true;
  try {
    // Use the new API endpoint with pagination parameters
    const response = await employeeService.getGuaranteeStatus({
      departmentId: departmentFilter.value,
      search: searchQuery.value,
      filter: filter.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    });
    
    if (response.success && response.data) {
      const data = response.data;
      
      // Map data from backend response
      allData.value = data.all || [];
      missingData.value = data.missing || [];
      needSecondData.value = data.needSecond || [];
      withTwoData.value = data.withTwo || [];
      
      // Update pagination from backend or client-side
      if (data.pagination) {
        pagination.value = {
          page: data.pagination.page || 1,
          limit: data.pagination.limit || 20,
          totalPages: data.pagination.totalPages || 1,
          hasPrevPage: data.pagination.hasPrevPage || false,
          hasNextPage: data.pagination.hasNextPage || false,
          totalItems: data.pagination.total || 0
        };
      } else {
        // Fallback to client-side pagination
        updatePagination();
      }
      
      // Emit count for parent component
      emit('update-count', missingData.value.length);
    }
  } catch (error) {
    console.error('Error loading guarantee data:', error);
  } finally {
    loading.value = false;
  }
};

const loadDepartments = async () => {
  try {
    const res = await employeeService.getDepartmentDistribution();
    if (res.success && res.data) {
      departments.value = res.data.departments || [];
    }
  } catch (error) {
    console.error('Error loading departments:', error);
  }
};

// ========== EXPORT TO EXCEL ==========
const exportToExcel = () => {
  if (getFilteredData.value.length === 0) {
    alert('No employees to export');
    return;
  }

  let deptName = 'All_Departments';
  if (departmentFilter.value !== 'all') {
    const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
    if (dept) deptName = dept.departmentName.replace(/\s+/g, '_');
  }

  let filterLabel = '';
  switch (filter.value) {
    case 'missing': filterLabel = 'No_Guarantee'; break;
    case 'one': filterLabel = 'Only_1'; break;
    case 'two': filterLabel = 'Has_2'; break;
    default: filterLabel = 'All';
  }

  let csv = `Guarantee Letter - ${filterLabel.replace(/_/g, ' ')} Report\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n`;
  csv += `Department: ${departmentFilter.value !== 'all' ? getDepartmentName() : 'All Departments'}\n`;
  csv += `Total Employees: ${getFilteredData.value.length}\n\n`;
  
  csv += 'Employee Code,Full Name,Email,Department,Position,Guarantee Count\n';
  
  getFilteredData.value.forEach(emp => {
    csv += `"${emp.employeeCode || emp.employeeId || 'N/A'}"`;
    csv += `,"${emp.fullName || emp.fullNameEnglish || 'N/A'}"`;
    csv += `,"${emp.email || 'N/A'}"`;
    csv += `,"${emp.department || 'N/A'}"`;
    csv += `,"${emp.position || 'N/A'}"`;
    csv += `,${emp.guaranteeCount || 0}\n`;
  });

  csv += `\nTotal Employees: ${getFilteredData.value.length}`;

  downloadCSV(csv, `Guarantee_${filterLabel}_${deptName}`);
};

const getDepartmentName = () => {
  if (departmentFilter.value === 'all') return 'All Departments';
  const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
  return dept?.departmentName || 'Unknown';
};

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

// ========== HELPER FUNCTIONS ==========
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
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

const getGuaranteeCountClass = (count) => {
  if (count === 0) return 'count-critical';
  if (count === 1) return 'count-warning';
  return 'count-success';
};

// ========== WATCHERS ==========
// Watch for filter changes
watch(filter, () => {
  pagination.value.page = 1;
  if (!isApplyingFilter) {
    loadData();
  }
});

// Watch for department changes
watch(departmentFilter, () => {
  pagination.value.page = 1;
  if (!isApplyingFilter) {
    loadData();
  }
});

// Watch for search query changes (handled by debounce)
watch(searchQuery, (newVal, oldVal) => {
  if (newVal === '' && oldVal !== '') {
    // Search was cleared, reload data
    pagination.value.page = 1;
    loadData();
  }
});

// Watch for pagination page changes to update UI
watch(() => pagination.value.page, () => {
  // Scroll to top when page changes
  const tableWrapper = document.querySelector('.table-wrapper');
  if (tableWrapper) {
    tableWrapper.scrollTop = 0;
  }
});

// ========== LIFECYCLE ==========
onMounted(() => {
  loadDepartments();
  loadData();
});
</script>

<style scoped>
.guarantee-tab {
  width: 100%;
}

/* Filters */
.filters-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
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
  background: #f8fafc;
  transition: all 0.2s;
  height: 40px;
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

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
  height: 40px;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
}

/* Filter Controls */
.filter-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 40px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-btn.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.red { background: #ef4444; }
.dot.orange { background: #f59e0b; }
.dot.green { background: #10b981; }

/* Table */
.table-container {
  margin-top: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.table-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-stats {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #059669;
  transform: scale(1.05);
}

.export-btn svg {
  width: 16px;
  height: 16px;
  stroke: white;
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

.data-table th {
  padding: 10px 14px;
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
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

/* Row styling */
.data-row {
  cursor: default;
}

.text-center {
  text-align: center;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employee-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.employee-email {
  font-size: 11px;
  color: #94a3b8;
}

.employee-code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
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

.dept-badge {
  background: #e2e8f0;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  display: inline-block;
}

.guarantee-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.count-success { background: #dcfce7; color: #10b981; }
.count-warning { background: #fef3c7; color: #f59e0b; }
.count-critical { background: #fef2f2; color: #ef4444; }

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

.empty-state {
  text-align: center;
  padding: 30px !important;
  color: #94a3b8;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
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
  border-color: #6366f1;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  color: #64748b;
}

.pagination-details {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 8px;
}

.pagination-numbers {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.page-number {
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 32px;
  text-align: center;
}

.page-number:hover:not(.active) {
  background: #f1f5f9;
  border-color: #6366f1;
}

.page-number.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
  }
  .filter-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  .filter-btn {
    font-size: 12px;
    padding: 4px 12px;
  }
  .data-table th,
  .data-table td {
    padding: 6px 8px;
    font-size: 12px;
  }
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .table-header-actions {
    justify-content: space-between;
  }
  .employee-info .employee-email {
    display: none;
  }
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }
  .pagination-numbers {
    gap: 2px;
  }
  .page-number {
    padding: 2px 6px;
    font-size: 12px;
    min-width: 28px;
  }
}
</style>