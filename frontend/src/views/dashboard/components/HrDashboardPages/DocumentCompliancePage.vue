<template>
  <div class="compliance-page">
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
          <h1>Document Compliance Status</h1>
          <p class="subtitle">
            Track employee document submission and verification
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
          <span class="stat-value">{{ summaryStats.totalEmployees || 0 }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-info">
          <span class="stat-label">Fully Compliant</span>
          <span class="stat-value">{{ summaryStats.fullyCompliant || 0 }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">❌</div>
        <div class="stat-info">
          <span class="stat-label">Missing Documents</span>
          <span class="stat-value">{{ summaryStats.missingDocuments || 0 }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">📊</div>
        <div class="stat-info">
          <span class="stat-label">Compliance Rate</span>
          <span class="stat-value">{{ summaryStats.complianceRate || '0' }}%</span>
        </div>
      </div>
    </div>

    <!-- Compliance Ring -->
    <div class="compliance-ring-section">
      <div class="ring-container">
        <div class="compliance-ring">
          <svg viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#e2e8f0"
              stroke-width="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#6366f1"
              stroke-width="10"
              :stroke-dasharray="314.16"
              :stroke-dashoffset="314.16 - (314.16 * complianceRate) / 100"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div class="ring-content">
            <span class="ring-value">{{ complianceRate }}%</span>
            <span class="ring-label">Compliance</span>
          </div>
        </div>
        <div class="ring-legend">
          <div class="legend-item">
            <span class="legend-dot green"></span>
            <span>Fully Compliant: {{ summaryStats.fullyCompliant || 0 }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot red"></span>
            <span>Missing Docs: {{ summaryStats.missingDocuments || 0 }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot blue"></span>
            <span>Total Active: {{ summaryStats.totalEmployees || 0 }}</span>
          </div>
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
            placeholder="Search by employee name or department..."
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
      <p>Loading compliance data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Document Type Tabs -->
      <div class="tabs-container">
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="switchTab(tab.id)"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-name">{{ tab.name }}</span>
            <span
              class="tab-badge"
              :class="getTabBadgeClass(tab)"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- ID Card Tab -->
        <div v-show="activeTab === 'id_card'" class="tab-panel">
          <DocumentTab
            :title="'ID Card'"
            :icon="'🪪'"
            :missing-data="idCardData.missing"
            :submitted-data="idCardData.submitted"
            :view="idCardView"
            @change-view="changeIdCardView"
            @search="handleIdCardSearch"
            @view-employee="viewEmployee"
          />
        </div>

        <!-- CV Tab -->
        <div v-show="activeTab === 'cv'" class="tab-panel">
          <DocumentTab
            :title="'CV / Resume'"
            :icon="'📄'"
            :missing-data="cvData.missing"
            :submitted-data="cvData.submitted"
            :view="cvView"
            @change-view="changeCvView"
            @search="handleCvSearch"
            @view-employee="viewEmployee"
          />
        </div>

        <!-- Degree Tab -->
        <div v-show="activeTab === 'degree'" class="tab-panel">
          <DocumentTab
            :title="'Degree / Certificate'"
            :icon="'🎓'"
            :missing-data="degreeData.missing"
            :submitted-data="degreeData.submitted"
            :view="degreeView"
            @change-view="changeDegreeView"
            @search="handleDegreeSearch"
            @view-employee="viewEmployee"
          />
        </div>

        <!-- Guarantee Letter Tab -->
        <div v-show="activeTab === 'guarantee_letter'" class="tab-panel">
          <GuaranteeTab
            :all-data="guaranteeData.all"
            :missing-data="guaranteeData.missing"
            :need-second-data="guaranteeData.needSecond"
            :with-two-data="guaranteeData.withTwo"
            :filter="guaranteeFilter"
            @change-filter="changeGuaranteeFilter"
            @search="handleGuaranteeSearch"
            @view-employee="viewEmployee"
          />
        </div>
      </div>
    </template>

    <!-- Page Footer -->
    <div class="page-footer">
      <div class="footer-info">
        <span>Last updated: {{ lastUpdated }}</span>
        <span class="separator">•</span>
        <span>{{ summaryStats.totalEmployees || 0 }} total employees</span>
        <span class="separator">•</span>
        <span>{{ summaryStats.complianceRate || '0' }}% compliance rate</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import employeeService from "@/stores/employee";

// Import sub-components
import DocumentTab from "./DocumentTab.vue";
import GuaranteeTab from "./GuaranteeTab.vue";

const router = useRouter();
const route = useRoute();

// ========== STATE ==========
const loading = ref(false);
const searchQuery = ref('');
const departmentFilter = ref('all');
const activeTab = ref('id_card');
const lastUpdated = ref(new Date().toLocaleString());

// View states for each tab
const idCardView = ref('missing');
const cvView = ref('missing');
const degreeView = ref('missing');
const guaranteeFilter = ref('missing');

// Data stores
const departments = ref([]);
const summaryStats = ref({
  totalEmployees: 0,
  fullyCompliant: 0,
  missingDocuments: 0,
  complianceRate: '0'
});

const idCardData = ref({ submitted: [], missing: [] });
const cvData = ref({ submitted: [], missing: [] });
const degreeData = ref({ submitted: [], missing: [] });
const guaranteeData = ref({
  all: [],
  missing: [],
  needSecond: [],
  withTwo: []
});

// Search timeouts
let searchTimeout = null;

// ========== COMPUTED ==========
const tabs = computed(() => [
  {
    id: 'id_card',
    name: 'ID Card',
    icon: '🪪',
    count: idCardData.value.missing?.length || 0,
    status: idCardData.value.missing?.length > 0 ? 'warning' : 'success'
  },
  {
    id: 'cv',
    name: 'CV / Resume',
    icon: '📄',
    count: cvData.value.missing?.length || 0,
    status: cvData.value.missing?.length > 0 ? 'warning' : 'success'
  },
  {
    id: 'degree',
    name: 'Degree',
    icon: '🎓',
    count: degreeData.value.missing?.length || 0,
    status: degreeData.value.missing?.length > 0 ? 'warning' : 'success'
  },
  {
    id: 'guarantee_letter',
    name: 'Guarantee Letter',
    icon: '📋',
    count: guaranteeData.value.missing?.length || 0,
    status: guaranteeData.value.missing?.length > 0 ? 'critical' : 'success'
  }
]);

const complianceRate = computed(() => {
  return parseFloat(summaryStats.value.complianceRate) || 0;
});

// ========== METHODS ==========
const goBack = () => {
  router.push({ name: 'dashboard' });
};

const viewEmployee = (id) => {
  if (id) {
    router.push(`/employees/${id}`);
  }
};

const getTabBadgeClass = (tab) => {
  if (tab.status === 'success') return 'badge-success';
  if (tab.status === 'warning') return 'badge-warning';
  if (tab.status === 'critical') return 'badge-critical';
  return 'badge-neutral';
};

const switchTab = (tabId) => {
  activeTab.value = tabId;
  // Load data for the tab if not loaded
  switch (tabId) {
    case 'id_card':
      if (idCardData.value.submitted.length === 0 && idCardData.value.missing.length === 0) {
        loadIdCardData();
      }
      break;
    case 'cv':
      if (cvData.value.submitted.length === 0 && cvData.value.missing.length === 0) {
        loadCvData();
      }
      break;
    case 'degree':
      if (degreeData.value.submitted.length === 0 && degreeData.value.missing.length === 0) {
        loadDegreeData();
      }
      break;
    case 'guarantee_letter':
      if (guaranteeData.value.all.length === 0) {
        loadGuaranteeData();
      }
      break;
  }
};

const changeIdCardView = (view) => {
  idCardView.value = view;
  loadIdCardData();
};

const changeCvView = (view) => {
  cvView.value = view;
  loadCvData();
};

const changeDegreeView = (view) => {
  degreeView.value = view;
  loadDegreeData();
};

const changeGuaranteeFilter = (filter) => {
  guaranteeFilter.value = filter;
  applyGuaranteeFilters();
};

const handleIdCardSearch = (search) => {
  // Handled in DocumentTab component
};

const handleCvSearch = (search) => {
  // Handled in DocumentTab component
};

const handleDegreeSearch = (search) => {
  // Handled in DocumentTab component
};

const handleGuaranteeSearch = (search) => {
  // Handled in GuaranteeTab component
};

const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    // Reload all data with search filter
    loadDocumentCompliance();
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  loadDocumentCompliance();
};

const applyFilters = () => {
  loadDocumentCompliance();
};

// ========== DATA LOADING ==========
const loadIdCardData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: 'id_card',
      departmentId: departmentFilter.value,
      guaranteeMonths: 6,
      view: idCardView.value,
      search: searchQuery.value
    });
    if (response.success && response.data) {
      const data = response.data;
      idCardData.value = {
        submitted: data.id_card?.submitted || [],
        missing: data.id_card?.missing || []
      };
    }
  } catch (error) {
    console.error('Error loading ID card data:', error);
  }
};

const loadCvData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: 'cv',
      departmentId: departmentFilter.value,
      guaranteeMonths: 6,
      view: cvView.value,
      search: searchQuery.value
    });
    if (response.success && response.data) {
      const data = response.data;
      cvData.value = {
        submitted: data.cv?.submitted || [],
        missing: data.cv?.missing || []
      };
    }
  } catch (error) {
    console.error('Error loading CV data:', error);
  }
};

const loadDegreeData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: 'degree',
      departmentId: departmentFilter.value,
      guaranteeMonths: 6,
      view: degreeView.value,
      search: searchQuery.value
    });
    if (response.success && response.data) {
      const data = response.data;
      degreeData.value = {
        submitted: data.degree?.submitted || [],
        missing: data.degree?.missing || []
      };
    }
  } catch (error) {
    console.error('Error loading degree data:', error);
  }
};

const loadGuaranteeData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: 'guarantee_letter',
      departmentId: departmentFilter.value,
      guaranteeMonths: 6,
      search: searchQuery.value
    });
    if (response.success && response.data) {
      const data = response.data;
      guaranteeData.value = {
        all: data.guarantee_letter?.all || [],
        missing: data.guarantee_letter?.missing || [],
        needSecond: data.guarantee_letter?.needSecond || [],
        withTwo: data.guarantee_letter?.withTwo || []
      };
      applyGuaranteeFilters();
    }
  } catch (error) {
    console.error('Error loading guarantee data:', error);
  }
};

const applyGuaranteeFilters = () => {
  // The GuaranteeTab component handles filtering internally
};

const loadDocumentCompliance = async () => {
  loading.value = true;
  try {
    // Load summary
    const summaryResult = await employeeService.getDocumentCompliance({
      documentType: 'all',
      departmentId: departmentFilter.value,
      guaranteeMonths: 6
    });
    if (summaryResult.success && summaryResult.data) {
      summaryStats.value = summaryResult.data.summary || {
        totalEmployees: 0,
        fullyCompliant: 0,
        missingDocuments: 0,
        complianceRate: '0'
      };
    }

    // Load departments for filter
    const deptResult = await employeeService.getDepartmentDistribution();
    if (deptResult.success && deptResult.data) {
      departments.value = deptResult.data.departments || [];
    }

    // Load current tab data
    await loadTabData();

    lastUpdated.value = new Date().toLocaleString();
  } catch (error) {
    console.error('Error loading document compliance:', error);
  } finally {
    loading.value = false;
  }
};

const loadTabData = async () => {
  switch (activeTab.value) {
    case 'id_card':
      await loadIdCardData();
      break;
    case 'cv':
      await loadCvData();
      break;
    case 'degree':
      await loadDegreeData();
      break;
    case 'guarantee_letter':
      await loadGuaranteeData();
      break;
  }
};

const refreshData = () => {
  loadDocumentCompliance();
};

// ========== EXPORT FUNCTIONS ==========
const printPage = () => {
  window.print();
};

const exportCSV = () => {
  let csvContent = 'Document Compliance Report\n\n';
  csvContent += `Generated: ${new Date().toLocaleString()}\n`;
  csvContent += `Department: ${departmentFilter.value !== 'all' ? getDepartmentName(departmentFilter.value) : 'All Departments'}\n\n`;
  
  csvContent += 'Summary\n';
  csvContent += `Total Employees,${summaryStats.value.totalEmployees || 0}\n`;
  csvContent += `Fully Compliant,${summaryStats.value.fullyCompliant || 0}\n`;
  csvContent += `Missing Documents,${summaryStats.value.missingDocuments || 0}\n`;
  csvContent += `Compliance Rate,${summaryStats.value.complianceRate || '0'}%\n\n`;
  
  // Add current tab data
  switch (activeTab.value) {
    case 'id_card':
      csvContent += 'ID Card - Missing Employees\n';
      csvContent += 'Employee,Department,Position,Email\n';
      idCardData.value.missing.forEach(emp => {
        csvContent += `"${emp.fullName}","${emp.department}","${emp.position || 'N/A'}","${emp.email}"\n`;
      });
      csvContent += '\nID Card - Submitted Employees\n';
      csvContent += 'Employee,Department,Position,Submitted Date,Status\n';
      idCardData.value.submitted.forEach(emp => {
        csvContent += `"${emp.fullName}","${emp.department}","${emp.position || 'N/A'}","${emp.submittedDate || 'N/A'}","${emp.status || 'N/A'}"\n`;
      });
      break;
    case 'cv':
      csvContent += 'CV - Missing Employees\n';
      csvContent += 'Employee,Department,Position,Email\n';
      cvData.value.missing.forEach(emp => {
        csvContent += `"${emp.fullName}","${emp.department}","${emp.position || 'N/A'}","${emp.email}"\n`;
      });
      csvContent += '\nCV - Submitted Employees\n';
      csvContent += 'Employee,Department,Position,Submitted Date,Status\n';
      cvData.value.submitted.forEach(emp => {
        csvContent += `"${emp.fullName}","${emp.department}","${emp.position || 'N/A'}","${emp.submittedDate || 'N/A'}","${emp.status || 'N/A'}"\n`;
      });
      break;
    case 'degree':
      csvContent += 'Degree - Missing Employees\n';
      csvContent += 'Employee,Department,Position,Email\n';
      degreeData.value.missing.forEach(emp => {
        csvContent += `"${emp.fullName}","${emp.department}","${emp.position || 'N/A'}","${emp.email}"\n`;
      });
      csvContent += '\nDegree - Submitted Employees\n';
      csvContent += 'Employee,Department,Position,Submitted Date,Status\n';
      degreeData.value.submitted.forEach(emp => {
        csvContent += `"${emp.fullName}","${emp.department}","${emp.position || 'N/A'}","${emp.submittedDate || 'N/A'}","${emp.status || 'N/A'}"\n`;
      });
      break;
    case 'guarantee_letter':
      csvContent += 'Guarantee Letter Status\n';
      csvContent += 'Employee,Department,Position,Guarantees,Status\n';
      guaranteeData.value.all.forEach(emp => {
        csvContent += `"${emp.fullName}","${emp.department}","${emp.position || 'N/A'}","${emp.guaranteeCount || 0}","${emp.status || 'N/A'}"\n`;
      });
      break;
  }
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `document_compliance_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getDepartmentName = (deptId) => {
  const dept = departments.value.find(d => d.departmentId === parseInt(deptId));
  return dept?.departmentName || 'All Departments';
};

// ========== WATCHERS ==========
watch(() => departmentFilter.value, () => {
  loadDocumentCompliance();
});

// ========== LIFECYCLE ==========
onMounted(() => {
  loadDocumentCompliance();
});
</script>

<style scoped>
/* ========== PAGE CONTAINER ========== */
.compliance-page {
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

/* ========== COMPLIANCE RING ========== */
.compliance-ring-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.ring-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.compliance-ring {
  position: relative;
  width: 140px;
  height: 140px;
}

.compliance-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.ring-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
}

.ring-label {
  font-size: 12px;
  color: #64748b;
}

.ring-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.green { background: #10b981; }
.legend-dot.red { background: #ef4444; }
.legend-dot.blue { background: #6366f1; }

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
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
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

.tab-badge {
  padding: 1px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge-success {
  background: #dcfce7;
  color: #10b981;
}

.badge-warning {
  background: #fef3c7;
  color: #f59e0b;
}

.badge-critical {
  background: #fef2f2;
  color: #ef4444;
}

.badge-neutral {
  background: #e2e8f0;
  color: #64748b;
}

/* ========== TAB CONTENT ========== */
.tab-content {
  background: white;
  border-radius: 0 0 12px 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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
  .page-footer .separator {
    display: none !important;
  }
  
  .compliance-page {
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
  
  .compliance-ring-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .tabs-container {
    box-shadow: none;
    padding: 0;
  }
  
  .tab-content {
    box-shadow: none;
    padding: 0;
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
  .compliance-page {
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
  
  .ring-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .tabs {
    flex-wrap: nowrap;
  }
  
  .tab-btn {
    padding: 10px 14px;
    font-size: 12px;
  }
  
  .tab-badge {
    display: none;
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