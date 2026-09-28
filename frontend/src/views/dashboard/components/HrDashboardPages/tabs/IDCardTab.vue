<template>
  <div class="tab-component">
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
            placeholder="Search by Amharic name, English name, or Employee ID..."
            class="search-input"
            @input="debounceSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">✕</button>
        </div>
      </div>
      <div class="filter-group">
        <label>Export</label>
        <button class="export-btn" @click="exportToExcel" title="Export to Excel">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 2v12M7 11l3 3 3-3"/>
            <path d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"/>
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading data...</p>
    </div>

    <!-- Missing View -->
    <div v-if="!loading" class="table-container">
      <div class="table-header">
        <h4>⚠️ Employees Missing National ID</h4>
        <div class="table-header-actions">
          <span class="table-stats">{{ missingPagination.total }} total employees</span>
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Department</th>
              <th>Position</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(emp, idx) in paginatedMissing"
              :key="emp.id"
              class="data-row"
            >
              <td class="text-center">{{ getMissingRowIndex(idx) }}</td>
              <td>
                <div class="employee-cell">
                  <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                    {{ getInitials(emp.fullName) }}
                  </div>
                  <div class="employee-names">
                    <span class="employee-name">{{ emp.fullName }}</span>
                    <span class="employee-name-english">{{ emp.fullNameEnglish || emp.fullName }}</span>
                  </div>
                </div>
              </td>
              <td><span class="employee-id-badge">{{ emp.employeeId || 'N/A' }}</span></td>
              <td><span class="dept-badge">{{ emp.department || 'N/A' }}</span></td>
              <td>{{ emp.position || 'N/A' }}</td>
              <td>
                <button class="btn-edit" @click.stop="goToEdit(emp.id)">
                  ✏️ Edit
                </button>
              </td>
            </tr>
            <tr v-if="paginatedMissing.length === 0">
              <td colspan="7" class="empty-state">
                {{ searchQuery ? 'No employees found matching your search' : '✅ All employees have submitted National IDs!' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="pagination" v-if="missingPagination.totalPages > 1">
        <button
          @click="changeMissingPage(missingPagination.page - 1)"
          :disabled="!missingPagination.hasPrevPage || loading"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <div class="pagination-pages">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="changeMissingPage(page)"
            :class="['page-btn', { active: page === missingPagination.page }]"
          >
            {{ page }}
          </button>
        </div>
        <button
          @click="changeMissingPage(missingPagination.page + 1)"
          :disabled="!missingPagination.hasNextPage || loading"
          class="pagination-btn"
        >
          Next →
        </button>
        <span class="pagination-info">
          Page {{ missingPagination.page }} of {{ missingPagination.totalPages }}
          ({{ missingPagination.total }} total)
        </span>
      </div>
      <!-- Show page info even when only 1 page -->
      <div v-else-if="missingPagination.total > 0" class="pagination-info-simple">
        Showing {{ paginatedMissing.length }} of {{ missingPagination.total }} employees
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";

const router = useRouter();

const emit = defineEmits(['update-count']);

// ========== STATE ==========
const loading = ref(false);
const searchQuery = ref('');
const departmentFilter = ref('all');

const departments = ref([]);
const missingData = ref([]);

// Pagination (10 per page)
const missingPagination = ref({
  page: 1,
  limit: 10,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
  total: 0
});

let searchTimeout = null;

// ========== COMPUTED ==========
const paginatedMissing = computed(() => {
  return missingData.value;
});

const visiblePages = computed(() => {
  const total = missingPagination.value.totalPages;
  const current = missingPagination.value.page;
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
const getMissingRowIndex = (idx) => {
  return idx + 1 + (missingPagination.value.page - 1) * missingPagination.value.limit;
};

const goToEdit = (id) => {
  router.push(`/employees/${id}/edit`);
};

const changeMissingPage = (page) => {
  if (page >= 1 && page <= missingPagination.value.totalPages) {
    missingPagination.value.page = page;
    loadData();
    const table = document.querySelector('.table-container');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

const updatePaginationFromResponse = (paginationData) => {
  if (paginationData) {
    missingPagination.value = {
      ...missingPagination.value,
      totalPages: paginationData.totalPages || 1,
      hasNextPage: paginationData.hasNextPage || false,
      hasPrevPage: paginationData.hasPrevPage || false,
      total: paginationData.total || 0
    };
  }
};

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    missingPagination.value.page = 1;
    loadData();
  }, 400);
};

const clearSearch = () => {
  searchQuery.value = '';
  missingPagination.value.page = 1;
  loadData();
};

const applyFilters = () => {
  missingPagination.value.page = 1;
  loadData();
};

const loadData = async () => {
  loading.value = true;
  try {
    const response = await employeeService.getEmployeesWithoutNationalId({
      departmentId: departmentFilter.value,
      search: searchQuery.value,
      page: missingPagination.value.page,
      limit: missingPagination.value.limit
    });
    
    if (response.success && response.data) {
      missingData.value = response.data.employees || [];
      updatePaginationFromResponse(response.data.pagination);
    }
    
    emit('update-count', missingPagination.value.total || 0);
  } catch (error) {
    console.error('Error loading data:', error);
    missingData.value = [];
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
const exportToExcel = async () => {
  loading.value = true;
  try {
    const response = await employeeService.getEmployeesWithoutNationalId({
      departmentId: departmentFilter.value,
      search: searchQuery.value,
      page: 1,
      limit: 9999
    });
    
    if (response.success && response.data) {
      const allEmployees = response.data.employees || [];
      if (allEmployees.length === 0) {
        alert('No employees to export');
        loading.value = false;
        return;
      }

      let deptName = 'All_Departments';
      if (departmentFilter.value !== 'all') {
        const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
        if (dept) deptName = dept.departmentName.replace(/\s+/g, '_');
      }

      const searchTerm = searchQuery.value ? `_Search_${searchQuery.value.replace(/\s+/g, '_')}` : '';

      let csv = 'National ID - Missing Employees Report\n';
      csv += `Generated: ${new Date().toLocaleString()}\n`;
      csv += `Department: ${departmentFilter.value !== 'all' ? getDepartmentName() : 'All Departments'}\n`;
      csv += `Search: ${searchQuery.value || 'None'}\n`;
      csv += `Total Missing: ${allEmployees.length}\n\n`;
      
      csv += 'Employee ID,Full Name (Amharic),Full Name (English),Department,Position,Email\n';
      
      allEmployees.forEach(emp => {
        csv += `"${emp.employeeId || emp.employeeCode || 'N/A'}"`;
        csv += `,"${emp.fullName || 'N/A'}"`;
        csv += `,"${emp.fullNameEnglish || emp.fullName || 'N/A'}"`;
        csv += `,"${emp.department || 'N/A'}"`;
        csv += `,"${emp.position || 'N/A'}"`;
        csv += `,"${emp.email || 'N/A'}"\n`;
      });

      csv += `\nTotal Employees Missing: ${allEmployees.length}`;

      downloadCSV(csv, `National_ID_Missing_${deptName}${searchTerm}`);
    }
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Failed to export data');
  } finally {
    loading.value = false;
  }
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
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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

// ========== WATCHERS ==========
watch([() => departmentFilter.value], () => {
  missingPagination.value.page = 1;
  loadData();
});

// ========== LIFECYCLE ==========
onMounted(() => {
  loadDepartments();
  loadData();
});
</script>

<style scoped>
.tab-component {
  width: 100%;
}

/* Filters */
.filters-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
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
  padding: 4px;
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

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  height: 40px;
  white-space: nowrap;
}

.export-btn:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.export-btn svg {
  width: 18px;
  height: 18px;
  stroke: white;
}

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

.data-row {
  cursor: default;
}

.data-row:hover {
  background: #f8fafc;
}

.text-center {
  text-align: center;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 180px;
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

.employee-names {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.employee-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
}

.employee-name-english {
  font-size: 11px;
  color: #94a3b8;
}

.employee-id-badge {
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  display: inline-block;
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

.btn-edit {
  padding: 4px 14px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

.empty-state {
  text-align: center;
  padding: 30px !important;
  color: #94a3b8;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
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

.pagination-info-simple {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
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

/* Responsive */
@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .export-btn {
    width: 100%;
    justify-content: center;
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
  
  .employee-cell {
    min-width: 120px;
  }
  
  .pagination {
    gap: 4px;
  }
  
  .pagination-btn {
    padding: 4px 10px;
    font-size: 12px;
  }
  
  .page-btn {
    padding: 4px 8px;
    font-size: 12px;
    min-width: 30px;
  }
}
</style>