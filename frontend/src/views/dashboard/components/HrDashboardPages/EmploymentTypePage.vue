<template>
  <div class="employment-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 10H5M10 15l-5-5 5-5"/>
          </svg>
          Back
        </button>
        <div>
          <h1>Employment Types</h1>
          <p class="subtitle">
            {{ totalEmployees }} employees • {{ employmentTypes.length }} types
            <span v-if="loading" class="loading-badge">Loading...</span>
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 4v6h-6M1 16v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L19 10M1 14l4.64 4.36A9 9 0 0 0 18.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-card-icon blue">👥</div>
        <div class="stat-card-content">
          <span class="stat-card-value">{{ totalEmployees }}</span>
          <span class="stat-card-label">Total Employees</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon purple">📋</div>
        <div class="stat-card-content">
          <span class="stat-card-value">{{ employmentTypes.length }}</span>
          <span class="stat-card-label">Employment Types</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon green">🏆</div>
        <div class="stat-card-content">
          <span class="stat-card-value">{{ mostCommonType }}</span>
          <span class="stat-card-label">Most Common</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon orange">📊</div>
        <div class="stat-card-content">
          <span class="stat-card-value">{{ diversityIndex }}%</span>
          <span class="stat-card-label">Diversity Index</span>
        </div>
      </div>
    </div>

    <!-- Global Search -->
    <div class="global-search">
      <svg class="global-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="9" r="7"/>
        <path d="M19 19l-4.35-4.35"/>
      </svg>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search by type name or employee..."
        class="global-search-input"
        @input="debounceSearch"
      />
      <button v-if="searchQuery" class="global-search-clear" @click="clearSearch">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <div class="type-grid">
        <div
          v-for="type in filteredTypes"
          :key="type.type"
          class="type-card"
        >
          <!-- Card Header -->
          <div class="type-card-header" @click="toggleType(type.type)">
            <div class="type-badge" :style="{ background: getTypeColor(type.type) }">
              {{ getTypeIcon(type.type) }}
            </div>
            <div class="type-info">
              <div class="type-name">{{ getEmploymentTypeLabel(type.type) }}</div>
              <div class="type-stats">
                <span>{{ type.count }} employees</span>
                <span class="type-dot">•</span>
                <span class="type-percent">{{ type.percentage }}%</span>
              </div>
            </div>
            <div class="type-actions">
              <button class="type-export-btn" @click.stop="exportType(type)" title="Export to Excel">
                📊
              </button>
              <span class="type-toggle">{{ expandedType === type.type ? '−' : '+' }}</span>
            </div>
          </div>

          <!-- Progress -->
          <div class="type-progress">
            <div
              class="type-progress-bar"
              :style="{
                width: type.percentage + '%',
                background: getTypeColor(type.type)
              }"
            ></div>
          </div>

          <!-- Expanded Content - Lazy Loaded -->
          <div v-if="expandedType === type.type" class="type-expand">
            <!-- Loading state -->
            <div v-if="typeEmployeeLoading[type.type]" class="type-loading">
              <div class="spinner-small"></div>
              <span>Loading employees...</span>
            </div>

            <!-- Employee List -->
            <template v-else>
              <div class="type-dept-filter">
                <svg class="type-dept-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="5" width="18" height="14" rx="2"/>
                  <path d="M12 3v2M8 3v2M1 9h18"/>
                </svg>
                <select
                  v-model="typeDeptFilter[type.type]"
                  @change="applyTypeFilter(type.type)"
                  class="type-dept-select"
                >
                  <option value="all">All Departments</option>
                  <option
                    v-for="dept in departments"
                    :key="dept.departmentId"
                    :value="dept.departmentId"
                  >
                    {{ dept.departmentName }} ({{ dept.count }})
                  </option>
                </select>
                <span class="type-dept-count">{{ getTypeEmployees(type.type).length }} employees</span>
              </div>

              <div class="type-employees">
                <div class="type-employee-search">
                  <input
                    type="text"
                    v-model="typeEmployeeSearch[type.type]"
                    placeholder="Filter employees..."
                    class="type-employee-input"
                    @input="searchTypeEmployees(type.type)"
                    @click.stop
                  />
                </div>
                <div class="type-employee-list-scroll">
                  <div
                    v-for="emp in getFilteredTypeEmployees(type.type)"
                    :key="emp.id"
                    class="type-employee"
                  >
                    <div class="type-employee-avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                      {{ getInitials(emp.fullName) }}
                    </div>
                    <div class="type-employee-info">
                      <span class="type-employee-name">{{ emp.fullName || 'N/A' }}</span>
                      <span class="type-employee-name-en" v-if="emp.fullNameEnglish">{{ emp.fullNameEnglish }}</span>
                      <span class="type-employee-dept">{{ emp.department || 'N/A' }}</span>
                    </div>
                    <span class="type-employee-id">ID: {{ emp.employeeId || emp.id }}</span>
                    <button class="type-employee-view" @click.stop="viewEmployee(emp.id)">
                      View →
                    </button>
                  </div>
                  <div v-if="getFilteredTypeEmployees(type.type).length === 0" class="type-employee-empty">
                    No employees found
                  </div>
                </div>
                <div class="type-employee-footer">
                  <span class="type-employee-total">
                    Showing {{ getFilteredTypeEmployees(type.type).length }} of {{ getTypeEmployees(type.type).length }} employees
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="filteredTypes.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>No employment types found</p>
        <span>Try adjusting your search</span>
      </div>
    </template>

    <!-- Footer -->
    <div class="page-footer">
      <span>Updated: {{ lastUpdated }}</span>
      <span>•</span>
      <span>{{ totalEmployees }} employees</span>
      <span>•</span>
      <span>{{ employmentTypes.length }} types</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import employeeService from "@/stores/employee";

const router = useRouter();

// State
const loading = ref(false);
const searchQuery = ref('');
const expandedType = ref(null);
const typeEmployeeSearch = ref({});
const typeDeptFilter = ref({});
const typeEmployeeData = ref({});
const typeEmployeeLoading = ref({});
const lastUpdated = ref(new Date().toLocaleString());

const employmentTypes = ref([]);
const departments = ref([]);

let searchTimeout = null;

// Computed
const totalEmployees = computed(() => {
  return employmentTypes.value.reduce((sum, t) => sum + t.count, 0);
});

const mostCommonType = computed(() => {
  if (!employmentTypes.value.length) return 'N/A';
  const sorted = [...employmentTypes.value].sort((a, b) => b.count - a.count);
  return getEmploymentTypeLabel(sorted[0]?.type);
});

const diversityIndex = computed(() => {
  if (!employmentTypes.value.length) return '0';
  const total = totalEmployees.value;
  if (!total) return '0';
  let sum = 0;
  employmentTypes.value.forEach(t => {
    const p = t.count / total;
    sum += p * Math.log(p);
  });
  const shannon = -sum;
  const maxDiversity = Math.log(employmentTypes.value.length);
  return maxDiversity > 0 ? ((shannon / maxDiversity) * 100).toFixed(1) : '0';
});

const filteredTypes = computed(() => {
  let list = [...employmentTypes.value];
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    list = list.filter(t => {
      const label = getEmploymentTypeLabel(t.type).toLowerCase();
      return label.includes(s);
    });
  }
  
  return list;
});

// Methods
const goBack = () => router.push({ name: 'dashboard' });

const getEmploymentTypeLabel = (type) => ({
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  'contract': 'Contract',
  'intern': 'Intern'
})[type] || type;

const getTypeColor = (type) => ({
  'full-time': '#10b981',
  'part-time': '#f59e0b',
  'contract': '#8b5cf6',
  'intern': '#ef4444'
})[type] || '#6366f1';

const getTypeIcon = (type) => ({
  'full-time': '💼',
  'part-time': '⏰',
  'contract': '📄',
  'intern': '🎓'
})[type] || '👤';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

// ========== TYPE EMPLOYEE METHODS ==========

const getTypeEmployees = (type) => {
  return typeEmployeeData.value[type] || [];
};

const getFilteredTypeEmployees = (type) => {
  const employees = getTypeEmployees(type);
  const search = typeEmployeeSearch.value[type] || '';
  if (!search) return employees;
  const s = search.toLowerCase();
  return employees.filter(e =>
    e.fullName?.toLowerCase().includes(s) ||
    e.fullNameEnglish?.toLowerCase().includes(s) ||
    e.employeeId?.toLowerCase().includes(s) ||
    e.department?.toLowerCase().includes(s) ||
    e.email?.toLowerCase().includes(s)
  );
};

// ✅ Load ALL employees for a type (lazy loading)
const loadTypeEmployees = async (type) => {
  if (typeEmployeeLoading.value[type]) return;
  
  typeEmployeeLoading.value[type] = true;
  
  try {
    const deptFilter = typeDeptFilter.value[type] || 'all';
    const search = typeEmployeeSearch.value[type] || '';
    
    console.log(`📊 Loading employees for type: ${type}, Dept: ${deptFilter}, Search: "${search}"`);
    
    const response = await employeeService.getTypeEmployees({
      type: type,
      search: search,
      departmentId: deptFilter
    });
    
    if (response.success && response.data) {
      const data = response.data;
      typeEmployeeData.value[type] = data.employees || [];
      console.log(`✅ Loaded ${data.employees?.length || 0} employees for ${type}`);
    }
  } catch (error) {
    console.error('Error loading type employees:', error);
  } finally {
    typeEmployeeLoading.value[type] = false;
  }
};

const toggleType = async (type) => {
  // If clicking the same type, collapse it
  if (expandedType.value === type) {
    expandedType.value = null;
    return;
  }
  
  // Expand the type
  expandedType.value = type;
  
  // ✅ Load employees ONLY for this type (lazy loading)
  if (!typeEmployeeData.value[type] || typeEmployeeData.value[type].length === 0) {
    await loadTypeEmployees(type);
  }
};

const applyTypeFilter = (type) => {
  // Reload employees with new department filter
  loadTypeEmployees(type);
};

const searchTypeEmployees = (type) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadTypeEmployees(type);
  }, 300);
};

const viewEmployee = (id) => {
  if (id) router.push(`/employees/${id}`);
};

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {}, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
};

// ========== EXPORT FUNCTIONS ==========

const exportType = (type) => {
  if (!type) return;
  
  const employees = getTypeEmployees(type.type);
  const typeLabel = getEmploymentTypeLabel(type.type);
  
  if (employees.length === 0) {
    alert(`No employees found in ${typeLabel}`);
    return;
  }
  
  let csv = `Employment Type: ${typeLabel}\n`;
  csv += `Total Employees: ${employees.length}\n`;
  csv += `Percentage: ${type.percentage}%\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;
  csv += 'Employee ID,Full Name,English Name,Department,Email,Position\n';
  
  employees.forEach(emp => {
    csv += `"${emp.employeeId || emp.id || 'N/A'}"`;
    csv += `,"${emp.fullName || 'N/A'}"`;
    csv += `,"${emp.fullNameEnglish || ''}"`;
    csv += `,"${emp.department || 'N/A'}"`;
    csv += `,"${emp.email || 'N/A'}"`;
    csv += `,"${emp.position || 'N/A'}"\n`;
  });

  csv += `\nTotal Employees Exported: ${employees.length}`;

  downloadCSV(csv, `${typeLabel}_Employees_All`);
};

const downloadCSV = (content, name) => {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ========== DATA LOADING ==========

const loadEmploymentTypes = async () => {
  loading.value = true;
  try {
    const result = await employeeService.getEmploymentTypeDistribution();
    if (result.success && result.data) {
      employmentTypes.value = result.data.types || [];
      
      const deptResult = await employeeService.getDepartmentDistribution();
      if (deptResult.success && deptResult.data) {
        departments.value = deptResult.data.departments || [];
      }
      
      lastUpdated.value = new Date().toLocaleString();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  // Clear cached employee data
  typeEmployeeData.value = {};
  typeEmployeeLoading.value = {};
  typeEmployeeSearch.value = {};
  typeDeptFilter.value = {};
  expandedType.value = null;
  loadEmploymentTypes();
};

onMounted(loadEmploymentTypes);
</script>

<style scoped>
/* ===== PAGE ===== */
.employment-page {
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
  width: 16px;
  height: 16px;
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
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== STATS CARDS ===== */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.stat-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-card-icon.blue { background: #dbeafe; }
.stat-card-icon.purple { background: #ede9fe; }
.stat-card-icon.green { background: #dcfce7; }
.stat-card-icon.orange { background: #fef3c7; }

.stat-card-content { flex: 1; }

.stat-card-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.stat-card-label {
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 1024px) {
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .stats-cards { grid-template-columns: 1fr; }
}

/* ===== GLOBAL SEARCH ===== */
.global-search {
  position: relative;
  margin-bottom: 20px;
}

.global-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #94a3b8;
}

.global-search-input {
  width: 100%;
  padding: 10px 44px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.global-search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.global-search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
}

.global-search-clear:hover {
  color: #ef4444;
}

/* ===== TYPE GRID ===== */
.type-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s;
}

.type-card:hover {
  border-color: #cbd5e1;
}

.type-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.type-card-header:hover {
  background: #fafafa;
}

.type-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.type-info { flex: 1; }

.type-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.type-stats {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-dot { color: #cbd5e1; }
.type-percent {
  color: #6366f1;
  font-weight: 600;
}

.type-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-export-btn {
  padding: 6px 10px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.type-export-btn:hover {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.type-toggle {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
  flex-shrink: 0;
}

.type-card-header:hover .type-toggle {
  background: #e2e8f0;
}

/* ===== PROGRESS ===== */
.type-progress {
  height: 3px;
  background: #f1f5f9;
}

.type-progress-bar {
  height: 100%;
  transition: width 0.6s ease;
}

/* ===== EXPAND ===== */
.type-expand {
  padding: 0 20px 20px;
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== TYPE LOADING ===== */
.type-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px;
  color: #64748b;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ===== TYPE DEPT FILTER ===== */
.type-dept-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.type-dept-icon {
  width: 18px;
  height: 18px;
  color: #94a3b8;
  flex-shrink: 0;
}

.type-dept-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
  flex: 1;
  min-width: 150px;
  transition: all 0.2s;
}

.type-dept-select:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
}

.type-dept-count {
  font-size: 12px;
  color: #94a3b8;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 20px;
}

/* ===== EMPLOYEES ===== */
.type-employees {
  margin-top: 8px;
}

.type-employee-search {
  margin-bottom: 10px;
}

.type-employee-input {
  width: 100%;
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}

.type-employee-input:focus {
  outline: none;
  border-color: #6366f1;
  background: white;
}

/* ✅ Scrollable employee list */
.type-employee-list-scroll {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.type-employee-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.type-employee-list-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.type-employee-list-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.type-employee-list-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.type-employee {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s;
}

.type-employee:last-child {
  border-bottom: none;
}

.type-employee:hover {
  background: #f8fafc;
}

.type-employee-avatar {
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

.type-employee-info {
  flex: 1;
  min-width: 0;
}

.type-employee-name {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.type-employee-name-en {
  font-size: 11px;
  color: #94a3b8;
}

.type-employee-dept {
  font-size: 11px;
  color: #94a3b8;
}

.type-employee-id {
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
}

.type-employee-view {
  padding: 4px 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.type-employee-view:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

.type-employee-empty {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

/* Employee footer */
.type-employee-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 4px 0;
  margin-top: 8px;
}

.type-employee-total {
  font-size: 12px;
  color: #94a3b8;
}

/* ===== EMPTY ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.empty-icon {
  font-size: 48px;
  display: block;
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

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .employment-page { padding: 16px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-left { flex-wrap: wrap; }
  .header-actions { justify-content: flex-start; }
  .type-card-header { flex-wrap: wrap; gap: 8px; }
  .type-actions { margin-left: auto; }
  .type-dept-filter { flex-direction: column; align-items: stretch; }
  .type-dept-select { width: 100%; }
  .type-employee-list-scroll { max-height: 250px; }
}

@media (max-width: 480px) {
  .header-left h1 { font-size: 18px; }
  .stats-cards { grid-template-columns: 1fr; }
  .type-badge { width: 36px; height: 36px; font-size: 18px; }
  .type-name { font-size: 14px; }
  .type-employee-id { display: none; }
  .type-employee-list-scroll { max-height: 200px; }
}
</style>