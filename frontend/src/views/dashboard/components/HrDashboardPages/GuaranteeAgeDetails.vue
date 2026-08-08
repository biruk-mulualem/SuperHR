<template>
  <div class="guarantee-age-details">
    <div class="page-header">
      <div class="header-left">
        <router-link to="/dashboard" class="back-btn">
          ← Back to Dashboard
        </router-link>
        <h1>📊 Guarantee Letter Age Distribution - Details</h1>
        <p>Detailed breakdown of employees by guarantee letter age</p>
      </div>
      <div class="header-right">
        <button class="refresh-btn" @click="loadData" :disabled="loading">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- ========== GUARANTEE COUNT DISTRIBUTION CARDS ========== -->
    <div class="distribution-section">
      <div class="section-header">
        <h3 class="section-title">📊 Guarantee Count Distribution</h3>
        <span class="section-subtitle">{{ summary.totalEmployees || 0 }} total employees</span>
      </div>
      
      <div class="distribution-grid">
        <!-- 0 Guarantees -->
        <div class="distribution-card zero">
          <div class="card-top">
            <span class="card-icon">📋</span>
            <span class="card-badge">No Guarantee</span>
          </div>
          <div class="card-body">
            <span class="card-value">{{ summary.guaranteeDistribution?.zero || 0 }}</span>
            <span class="card-label">Employees</span>
          </div>
          <div class="card-bottom">
            <div class="card-bar">
              <div class="bar-fill" :style="{ width: getDistributionPercentage('zero') + '%' }"></div>
            </div>
            <span class="card-percentage">{{ getDistributionPercentage('zero') }}%</span>
          </div>
        </div>

        <!-- 1 Guarantee -->
        <div class="distribution-card one">
          <div class="card-top">
            <span class="card-icon">📄</span>
            <span class="card-badge">1 Guarantee</span>
          </div>
          <div class="card-body">
            <span class="card-value">{{ summary.guaranteeDistribution?.one || 0 }}</span>
            <span class="card-label">Employees</span>
          </div>
          <div class="card-bottom">
            <div class="card-bar">
              <div class="bar-fill" :style="{ width: getDistributionPercentage('one') + '%' }"></div>
            </div>
            <span class="card-percentage">{{ getDistributionPercentage('one') }}%</span>
          </div>
        </div>

        <!-- 2 Guarantees -->
        <div class="distribution-card two">
          <div class="card-top">
            <span class="card-icon">📑</span>
            <span class="card-badge">2 Guarantees</span>
          </div>
          <div class="card-body">
            <span class="card-value">{{ summary.guaranteeDistribution?.two || 0 }}</span>
            <span class="card-label">Employees</span>
          </div>
          <div class="card-bottom">
            <div class="card-bar">
              <div class="bar-fill" :style="{ width: getDistributionPercentage('two') + '%' }"></div>
            </div>
            <span class="card-percentage">{{ getDistributionPercentage('two') }}%</span>
          </div>
        </div>

        <!-- 2+ Guarantees -->
        <div class="distribution-card two-plus">
          <div class="card-top">
            <span class="card-icon">📚</span>
            <span class="card-badge">2+ Guarantees</span>
          </div>
          <div class="card-body">
            <span class="card-value">{{ summary.guaranteeDistribution?.twoPlus || 0 }}</span>
            <span class="card-label">Employees</span>
          </div>
          <div class="card-bottom">
            <div class="card-bar">
              <div class="bar-fill" :style="{ width: getDistributionPercentage('twoPlus') + '%' }"></div>
            </div>
            <span class="card-percentage">{{ getDistributionPercentage('twoPlus') }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-section">
      <div class="filter-group">
        <label>Department</label>
        <select v-model="departmentFilter" @change="onFilterChange" class="filter-select">
          <option value="all">All Departments</option>
          <option v-for="dept in departments" :key="dept.departmentId" :value="dept.departmentId">
            {{ dept.departmentName }} ({{ dept.count }})
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Search</label>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by Amharic name, English name, or code..." 
          class="search-input"
          @input="onSearch"
        />
        <span class="search-hint">Search works with Amharic, English, and Employee Code</span>
      </div>
      <div class="filter-group">
        <label>Age Range</label>
        <select v-model="ageRangeFilter" @change="onRangeFilterChange" class="filter-select">
          <option value="all">All Ranges</option>
          <option v-for="range in ageRanges" :key="range.label" :value="range.label">
            {{ range.label }} ({{ range.count }})
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading data...</p>
    </div>

    <!-- Employee Table -->
    <div v-else class="table-container">
      <div class="table-header">
        <h3>All Employees</h3>
        <div class="table-header-actions">
          <span class="total-count">{{ filteredEmployees.length }} employees</span>
          <button class="export-btn" @click="exportData">
            📥 Export Data
          </button>
        </div>
      </div>

      <!-- Employee Table -->
      <div class="table-wrapper">
        <table class="data-table" v-if="filteredEmployees.length > 0">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Code</th>
              <th>Department</th>
              <th>Since Last Checked</th>
              <th>Age Range</th>
              <th>Last Confirmed Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(emp, index) in paginatedEmployees" :key="emp.id || index">
              <td>{{ getRowIndex(index) }}</td>
              <td>
                <div class="employee-cell">
                  <div class="avatar" :style="{ background: getAvatarColor(emp.fullName) }">
                    {{ getInitials(emp.fullName) }}
                  </div>
                  <div class="employee-info">
                    <span class="employee-name">{{ emp.fullName || 'N/A' }}</span>
                    <span class="employee-name-english">{{ emp.fullNameEnglish || '' }}</span>
                  </div>
                </div>
              </td>
              <td><span class="employee-code">{{ emp.employeeCode }}</span></td>
              <td>{{ emp.department || 'N/A' }}</td>
              <td>
                <span :class="['age-badge', getAgeBadgeClass(emp.ageInMonths)]">
                  {{ emp.ageInMonths }} months
                </span>
              </td>
              <td>
                <span class="range-label" :style="{ background: getAgeBarColor(emp.ageInMonths) }">
                  {{ emp.ageCategory || getAgeCategoryLabel(emp.ageInMonths) }}
                </span>
              </td>
              <td>
                <span class="ec-date">{{ emp.confirmedDateEC || 'N/A' }} E.C</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-view" @click="viewEmployee(emp.id)">
                    👁 
                  </button>
                  <button class="btn-renew" @click="openRenewModal(emp)">
                    🔄 
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          No employees found matching the filters
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="filteredEmployees.length > pageSize">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ← Previous
        </button>
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
          ({{ filteredEmployees.length }} employees)
        </span>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- ========== RENEW MODAL - COMPACT NO SCROLL ========== -->
    <div v-if="showRenewModal" class="modal-overlay" @click.self="closeRenewModal">
      <div class="modal-content modal-compact">
        <div class="modal-header">
          <h3>🔄 Renew Guarantee</h3>
          <button class="modal-close" @click="closeRenewModal">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- Employee Info - Compact -->
          <div class="employee-info-compact">
            <div class="avatar-small" :style="{ background: getAvatarColor(selectedEmployee?.fullName) }">
              {{ getInitials(selectedEmployee?.fullName) }}
            </div>
            <div class="employee-details-compact">
              <div class="emp-name">{{ selectedEmployee?.fullName }}</div>
              <div class="emp-meta">
                <span class="emp-id">{{ selectedEmployee?.employeeCode }}</span>
                <span class="emp-dept">{{ selectedEmployee?.department }}</span>
              </div>
              <div class="emp-date-info">
                <span class="date-label">Last Confirmed:</span>
                <span class="date-value">{{ selectedEmployee?.confirmedDateEC || 'N/A' }} E.C</span>
                <span class="date-badge" :class="getAgeBadgeClass(selectedEmployee?.ageInMonths)">
                  {{ selectedEmployee?.ageInMonths || 0 }} months since last confirmed
                </span>
              </div>
            </div>
          </div>

          <!-- Form - Compact -->
          <div class="form-group-compact">
            <label for="newDate"> Guarantee Confirmed Date (EC) <span class="required">*</span></label>
            <input
              id="newDate"
              type="text"
              v-model="newDateEC"
              placeholder="DD/MM/YYYY"
              class="form-input-compact"
              :class="{ 'error': dateError }"
              @keyup.enter="saveRenewal"
            />
            <span v-if="dateError" class="error-message-compact">{{ dateError }}</span>
            <small class="help-text-compact">Format: DD/MM/YYYY(In Ethiopian calendar)</small>
          </div>
        </div>

        <div class="modal-footer-compact">
          <button class="btn-cancel-compact" @click="closeRenewModal" :disabled="saving">Cancel</button>
          <button class="btn-save-compact" @click="saveRenewal" :disabled="saving || !newDateEC">
            <span v-if="saving" class="spinner-small"></span>
            {{ saving ? 'Saving...' : 'Update Date' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="toast-container" :class="toast.type">
      <span>{{ toast.message }}</span>
      <button @click="toast.show = false">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import employeeService from '@/stores/employee';

const router = useRouter();

// State
const loading = ref(false);
const departments = ref([]);
const allEmployees = ref([]);
const summary = ref({
  totalGuarantees: 0,
  totalEmployeesWithGuarantees: 0,
  averageAgeMonths: 0,
  oldestAgeMonths: 0,
  youngestAgeMonths: 0,
  totalEmployees: 0,
  employeesWithoutGuarantees: 0,
  guaranteeDistribution: {
    zero: 0,
    one: 0,
    two: 0,
    twoPlus: 0
  }
});

const departmentFilter = ref('all');
const searchQuery = ref('');
const ageRangeFilter = ref('all');
const currentPage = ref(1);
const pageSize = ref(20);

// Renew Modal State
const showRenewModal = ref(false);
const selectedEmployee = ref(null);
const newDateEC = ref('');
const dateError = ref('');
const saving = ref(false);

// Toast State
const toast = ref({
  show: false,
  type: 'success',
  message: ''
});

// Age ranges for filter dropdown
const ageRanges = ref([]);

// ========== COMPUTED ==========
const filteredEmployees = computed(() => {
  let employees = allEmployees.value || [];
  
  if (ageRangeFilter.value !== 'all') {
    const range = ageRanges.value.find(r => r.label === ageRangeFilter.value);
    if (range) {
      employees = employees.filter(e => 
        e.ageInMonths >= range.min && e.ageInMonths <= range.max
      );
    }
  }
  
  if (searchQuery.value.trim()) {
    const search = searchQuery.value.toLowerCase().trim();
    employees = employees.filter(e => {
      const amharicMatch = e.fullName?.toLowerCase().includes(search);
      const englishMatch = e.fullNameEnglish?.toLowerCase().includes(search);
      const codeMatch = e.employeeCode?.toLowerCase().includes(search);
      const deptMatch = e.department?.toLowerCase().includes(search);
      const positionMatch = e.position?.toLowerCase().includes(search);
      
      return amharicMatch || englishMatch || codeMatch || deptMatch || positionMatch;
    });
  }
  
  return employees;
});

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredEmployees.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredEmployees.value.length / pageSize.value);
});

// ========== TOAST METHODS ==========
const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    type,
    message
  };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
};

// ========== RENEW MODAL METHODS ==========
const openRenewModal = (employee) => {
  selectedEmployee.value = employee;
  newDateEC.value = '';
  dateError.value = '';
  showRenewModal.value = true;
};

const closeRenewModal = () => {
  if (saving.value) return;
  showRenewModal.value = false;
  selectedEmployee.value = null;
  newDateEC.value = '';
  dateError.value = '';
};

const validateDate = (date) => {
  if (!date || date.trim() === '') {
    return 'Date is required';
  }
  
  const pattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!pattern.test(date)) {
    return 'Invalid format. Use DD/MM/YYYY';
  }
  
  const parts = date.split('/');
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return 'Invalid date values';
  }
  
  if (day < 1 || day > 30) {
    return 'Day must be between 1 and 30';
  }
  
  if (month < 1 || month > 13) {
    return 'Month must be between 1 and 13 (Ethiopian calendar has 13 months)';
  }
  
  if (year < 1900 || year > 2100) {
    return 'Year must be between 1900 and 2100';
  }
  
  return null;
};

const saveRenewal = async () => {
  // Validate date
  const error = validateDate(newDateEC.value);
  if (error) {
    dateError.value = error;
    return;
  }
  
  dateError.value = '';
  saving.value = true;
  
  try {
    const employeeData = await employeeService.getEmployeeById(selectedEmployee.value.id);
    
    if (!employeeData.success || !employeeData.data) {
      throw new Error('Could not fetch employee data');
    }
    
    const employee = employeeData.data;
    const guaranteeInfo = employee.guaranteeInfo || [];
    
    // Find which guarantor this is
    let targetIndex = -1;
    
    // Try to find by confirmedDateEC first
    if (selectedEmployee.value.confirmedDateEC) {
      targetIndex = guaranteeInfo.findIndex(
        g => g.confirmedDateEC === selectedEmployee.value.confirmedDateEC
      );
    }
    
    // If not found, try by guarantorName
    if (targetIndex === -1 && selectedEmployee.value.guarantorName) {
      targetIndex = guaranteeInfo.findIndex(
        g => g.guarantorName === selectedEmployee.value.guarantorName
      );
    }
    
    // If still not found, use the first one
    if (targetIndex === -1 && guaranteeInfo.length > 0) {
      targetIndex = 0;
    }
    
    if (targetIndex === -1) {
      throw new Error('Could not find the guarantee record to update');
    }
    
    // ✅ UPDATE BOTH DATES - confirmedDateEC (for age calculation) AND guaranteeLetterDateEC (for reference)
    guaranteeInfo[targetIndex].confirmedDateEC = newDateEC.value;  // ✅ Primary for age calculation
    guaranteeInfo[targetIndex].guaranteeLetterDateEC = newDateEC.value;  // For reference
    
    // Update the employee with new guarantee info
    const updateData = {
      guaranteeInfo: guaranteeInfo
    };
    
    const result = await employeeService.updateEmployee(selectedEmployee.value.id, updateData);
    
    if (result.success) {
      showToast('✅ Guarantee date updated successfully!', 'success');
      closeRenewModal();
      setTimeout(() => loadData(), 500);
    } else {
      throw new Error(result.error || 'Update failed');
    }
    
  } catch (error) {
    console.error('Error updating guarantee date:', error);
    showToast('❌ ' + (error.message || 'Failed to update guarantee date'), 'error');
  } finally {
    saving.value = false;
  }
};

// ========== METHODS ==========
const loadData = async () => {
  loading.value = true;
  try {
    const response = await employeeService.getGuaranteeAgeDetails({
      departmentId: departmentFilter.value === 'all' ? 'all' : departmentFilter.value,
      search: searchQuery.value,
      ageRange: ageRangeFilter.value,
      includeDetails: 'true',
      page: currentPage.value,
      limit: pageSize.value
    });

    console.log('📥 Details Response:', response);

    if (response && response.data && response.data.success && response.data.data) {
      const payload = response.data.data;
      const distribution = payload.distribution || [];
      summary.value = payload.summary || {};
      
      allEmployees.value = payload.employees || [];
      
      ageRanges.value = distribution.map(range => ({
        ...range,
        min: range.months === 1 ? 0 : range.months - 2,
        max: range.months === 13 ? Infinity : range.months
      }));
      
      if (payload.pagination) {
        currentPage.value = payload.pagination.page || 1;
        pageSize.value = payload.pagination.limit || 20;
      }
    }
  } catch (error) {
    console.error('Error loading guarantee age details:', error);
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

const onFilterChange = () => {
  currentPage.value = 1;
  loadData();
};

const onSearch = () => {
  currentPage.value = 1;
  loadData();
};

const onRangeFilterChange = () => {
  currentPage.value = 1;
  loadData();
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadData();
  }
};

const getRowIndex = (index) => {
  return index + 1 + (currentPage.value - 1) * pageSize.value;
};

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

const getAgeBarColor = (months) => {
  if (months <= 1) return '#10b981';
  if (months <= 3) return '#34d399';
  if (months <= 6) return '#fbbf24';
  if (months <= 9) return '#f59e0b';
  if (months <= 12) return '#ef4444';
  return '#dc2626';
};

const getAgeBadgeClass = (months) => {
  if (months <= 1) return 'age-fresh';
  if (months <= 3) return 'age-recent';
  if (months <= 6) return 'age-moderate';
  if (months <= 9) return 'age-aging';
  if (months <= 12) return 'age-old';
  return 'age-very-old';
};

const getAgeCategoryLabel = (months) => {
  if (months <= 1) return '1 Month';
  if (months <= 3) return '3 Months';
  if (months <= 6) return '6 Months';
  if (months <= 9) return '9 Months';
  if (months <= 12) return '12 Months';
  return '> 12 Months';
};

const viewEmployee = (id) => {
  router.push(`/employees/${id}`);
};

const getDepartmentName = () => {
  if (departmentFilter.value === 'all') return 'All Departments';
  const dept = departments.value.find(d => d.departmentId === parseInt(departmentFilter.value));
  return dept?.departmentName || 'Unknown';
};

// ========== DISTRIBUTION PERCENTAGE ==========
const getDistributionPercentage = (key) => {
  const total = summary.value.totalEmployees || 1;
  const count = summary.value.guaranteeDistribution?.[key] || 0;
  return Math.round((count / total) * 100);
};

// ========== EXPORT FUNCTION ==========
const exportData = () => {
  if (filteredEmployees.value.length === 0) {
    alert('No data to export');
    return;
  }
  
  let csv = `Guarantee Age Distribution Report\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n`;
  csv += `Department: ${getDepartmentName()}\n`;
  csv += `Age Range: ${ageRangeFilter.value === 'all' ? 'All Ranges' : ageRangeFilter.value}\n`;
  csv += `Total Employees: ${filteredEmployees.value.length}\n\n`;
  csv += 'Employee Code,Full Name (Amharic),Full Name (English),Department,Position,Since Last Checked (months),Age Range,Last Checked Date (EC)\n';
  
  filteredEmployees.value.forEach(emp => {
    csv += `"${emp.employeeCode}","${emp.fullName || 'N/A'}","${emp.fullNameEnglish || ''}","${emp.department || 'N/A'}","${emp.position || 'N/A'}",${emp.ageInMonths || 0},"${emp.ageCategory || getAgeCategoryLabel(emp.ageInMonths)}","${emp.guaranteeDateEC || 'N/A'}"\n`;
  });
  
  const totalAge = filteredEmployees.value.reduce((sum, e) => sum + (e.ageInMonths || 0), 0);
  const avgAge = Math.round(totalAge / filteredEmployees.value.length);
  const oldest = Math.max(...filteredEmployees.value.map(e => e.ageInMonths || 0));
  const youngest = Math.min(...filteredEmployees.value.map(e => e.ageInMonths || 0));
  
  csv += `\n--- SUMMARY ---\n`;
  csv += `Total Employees: ${filteredEmployees.value.length}\n`;
  csv += `Average Since Last Checked: ${avgAge} months\n`;
  csv += `Oldest: ${oldest} months\n`;
  csv += `Youngest: ${youngest} months\n`;
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Guarantee_Age_Report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ========== LIFECYCLE ==========
onMounted(() => {
  loadDepartments();
  loadData();
});
</script>

<style scoped>
.guarantee-age-details {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #f0f4f8 100%);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 8px 0 4px 0;
}

.header-left p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6366f1;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.back-btn:hover {
  text-decoration: underline;
}

.refresh-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== DISTRIBUTION SECTION ========== */
.distribution-section {
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
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.section-subtitle {
  font-size: 14px;
  color: #64748b;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .distribution-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .distribution-grid {
    grid-template-columns: 1fr;
  }
}

/* Distribution Cards */
.distribution-card {
  background: #fafcfc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.distribution-card.zero {
  border-top: 4px solid #ef4444;
}

.distribution-card.one {
  border-top: 4px solid #f59e0b;
}

.distribution-card.two {
  border-top: 4px solid #10b981;
}

.distribution-card.two-plus {
  border-top: 4px solid #6366f1;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-icon {
  font-size: 28px;
}

.card-badge {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-body {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.card-value {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.card-label {
  font-size: 13px;
  color: #64748b;
}

.card-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease;
}

.distribution-card.zero .bar-fill { background: #ef4444; }
.distribution-card.one .bar-fill { background: #f59e0b; }
.distribution-card.two .bar-fill { background: #10b981; }
.distribution-card.two-plus .bar-fill { background: #6366f1; }

.card-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  min-width: 44px;
  text-align: right;
}

/* ========== FILTERS ========== */
.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  background: white;
  padding: 16px 20px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
}

.filter-select:focus,
.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-hint {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* ========== LOADING ========== */
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

/* ========== TABLE ========== */
.table-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.table-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.table-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-count {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #059669;
  transform: scale(1.05);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
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
  line-height: 1.2;
}

.employee-name-english {
  font-size: 11px;
  color: #64748b;
  line-height: 1.2;
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

.employee-code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.age-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.age-fresh { background: #dcfce7; color: #10b981; }
.age-recent { background: #dbeafe; color: #3b82f6; }
.age-moderate { background: #fef3c7; color: #f59e0b; }
.age-aging { background: #fde68a; color: #d97706; }
.age-old { background: #fecaca; color: #dc2626; }
.age-very-old { background: #fca5a5; color: #991b1b; }

.range-label {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.ec-date {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #1e293b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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
}

.btn-view:hover {
  background: #4f46e5;
  transform: scale(1.05);
}

.btn-renew {
  padding: 4px 12px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-renew:hover {
  background: #d97706;
  transform: scale(1.05);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
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

/* ========== COMPACT MODAL STYLES - NO SCROLL ========== */
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
  animation: fadeIn 0.2s ease;
  padding: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-compact {
  max-height: 80vh;
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  transition: all 0.2s;
  border-radius: 6px;
}

.modal-close:hover {
  color: #ef4444;
  background: #fef2f2;
}

.modal-body {
  padding: 16px 20px;
  flex: 1;
  overflow: visible;
}

/* Employee Info - Compact */
.employee-info-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 14px;
}

.avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.employee-details-compact {
  flex: 1;
  min-width: 0;
}

.emp-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emp-meta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: #64748b;
  margin-top: 1px;
}

.emp-meta span {
  display: inline-block;
}

.emp-id {
  background: #e2e8f0;
  padding: 0 8px;
  border-radius: 10px;
}

.emp-date-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 11px;
  flex-wrap: wrap;
}

.date-label {
  color: #64748b;
}

.date-value {
  color: #0f172a;
  font-weight: 500;
}

.date-badge {
  padding: 1px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.date-badge.age-fresh { background: #dcfce7; color: #10b981; }
.date-badge.age-recent { background: #dbeafe; color: #3b82f6; }
.date-badge.age-moderate { background: #fef3c7; color: #f59e0b; }
.date-badge.age-aging { background: #fde68a; color: #d97706; }
.date-badge.age-old { background: #fecaca; color: #dc2626; }
.date-badge.age-very-old { background: #fca5a5; color: #991b1b; }

/* Form - Compact */
.form-group-compact {
  margin-bottom: 12px;
}

.form-group-compact:last-child {
  margin-bottom: 0;
}

.form-group-compact label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.required {
  color: #ef4444;
}

.form-input-compact {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
  height: 34px;
}

.form-input-compact:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input-compact.error {
  border-color: #ef4444;
}

.form-input-compact.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message-compact {
  font-size: 11px;
  color: #ef4444;
  margin-top: 3px;
  display: block;
}

.help-text-compact {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Footer - Compact */
.modal-footer-compact {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
}

.btn-cancel-compact {
  padding: 6px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  height: 32px;
}

.btn-cancel-compact:hover:not(:disabled) {
  background: #f1f5f9;
}

.btn-cancel-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save-compact {
  padding: 6px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
}

.btn-save-compact:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-save-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

/* ========== TOAST ========== */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  max-width: 360px;
  font-size: 13px;
}

.toast-container.success {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  color: #065f46;
}

.toast-container.error {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  color: #991b1b;
}

.toast-container button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
}

.toast-container button:hover {
  color: #1e293b;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .guarantee-age-details {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  
  .filter-section {
    flex-direction: column;
  }
  
  .table-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table-header-actions {
    justify-content: space-between;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .distribution-grid {
    grid-template-columns: 1fr;
  }
  
  .employee-name-english {
    display: none;
  }
  
  .action-buttons {
    flex-direction: column;
  }

  .btn-view,
  .btn-renew {
    width: 100%;
    text-align: center;
  }
  
  .modal-content {
    max-width: 100%;
    margin: 10px;
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 12px 16px;
  }
  
  .modal-header h3 {
    font-size: 14px;
  }
  
  .modal-body {
    padding: 12px 16px;
  }
  
  .modal-footer-compact {
    padding: 10px 16px;
  }
  
  .employee-info-compact {
    padding: 8px 12px;
    flex-wrap: wrap;
  }
  
  .avatar-small {
    width: 32px;
    height: 32px;
    font-size: 11px;
  }
  
  .emp-name {
    font-size: 12px;
  }
  
  .form-input-compact {
    height: 32px;
    font-size: 12px;
  }
  
  .btn-cancel-compact,
  .btn-save-compact {
    flex: 1;
    justify-content: center;
    font-size: 11px;
  }

  .emp-date-info {
    font-size: 10px;
  }

  .date-badge {
    font-size: 9px;
  }
}
</style>