<template>
  <div class="hr-analytics">
    <div class="bg-gradient"></div>

    <!-- Header -->
    <div class="analytics-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1>HR Dashboard</h1>
          <p>Real-time workforce analytics & document compliance</p>
        </div>
      </div>
      <div class="header-right">
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics data...</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" v-for="kpi in kpiList" :key="kpi.label">
          <div class="kpi-icon" :style="{ background: kpi.gradient }">
            <component :is="kpi.icon" />
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ kpi.value }}</span>
            <span class="kpi-label">{{ kpi.label }}</span>
          </div>
        </div>
      </div>

      <!-- Main Analytics Grid -->
      <div class="analytics-grid">
        <!-- Hiring Trends Chart -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title" style="width: 100%">
              <div class="title-icon blue">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Hiring & Termination Trends</h3>
            </div>
            <div class="filter-group-small">
              <select
                v-model="hiringFilters.departmentId"
                @change="loadHiringTrends"
                class="filter-select-small"
              >
                <option value="all">All Departments</option>
                <option
                  v-for="dept in allDepartments"
                  :key="dept.departmentId"
                  :value="dept.departmentId"
                >
                  {{ dept.departmentName }}
                </option>
              </select>
              <select
                v-model="hiringFilters.timeRange"
                @change="loadHiringTrends"
                class="filter-select-small"
              >
                <option value="1">Last 1 Month</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
                <option value="24">Last 24 Months</option>
                <option value="36">Last 36 Months</option>
                <option value="all">All Time</option>
              </select>
              <router-link to="/dashboard/hiring-details" class="expand-btn">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="width: 14px; height: 14px; margin-right: 4px"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View
              </router-link>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="hiringChartCanvas"></canvas>
          </div>
          <div
            class="chart-stats"
            v-if="hiringStats.totalHired > 0 || hiringStats.totalTerminated > 0"
          >
            <div class="stat">
              <span>Total Hired</span
              ><strong>{{ hiringStats.totalHired || 0 }}</strong>
            </div>
            <div class="stat">
              <span>Total Terminated</span
              ><strong>{{ hiringStats.totalTerminated || 0 }}</strong>
            </div>
            <div class="stat">
              <span>Net Growth</span
              ><strong
                :class="hiringStats.netGrowth >= 0 ? 'positive' : 'negative'"
                >{{ hiringStats.netGrowth >= 0 ? "+" : ""
                }}{{ hiringStats.netGrowth || 0 }}</strong
              >
            </div>
          </div>
          <div
            v-if="
              (!hiringChartData || hiringChartData.length === 0) && !loading
            "
            class="no-data-message"
          >
            No hiring/termination data available
          </div>
        </div>

        <!-- Department Distribution -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon purple">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h3>Department Distribution</h3>
            </div>
            <router-link to="/dashboard/department-distribution" class="expand-btn">
              View Details
            </router-link>
          </div>
          <div class="dept-list">
            <div
              v-for="dept in departments"
              :key="dept.departmentId"
              class="dept-row"
            >
              <div class="dept-info">
                <span class="dept-name">{{ dept.departmentName }}</span>
                <span class="dept-count">{{ dept.count }} employees</span>
              </div>
              <div class="dept-metrics">
                <div class="metric">
                  <div
                    class="metric-bar"
                    :style="{
                      width: dept.percentage + '%',
                      background: '#6366f1',
                    }"
                  ></div>
                  <span>{{ dept.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Salary Distribution -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon green">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  />
                </svg>
              </div>
              <h3>Salary Distribution</h3>
            </div>
            <router-link to="/dashboard/salary-distribution" class="expand-btn">
              Show Details
            </router-link>
          </div>
          <div class="chart-container small">
            <canvas ref="salaryChartCanvas"></canvas>
          </div>
          <div class="salary-stats" v-if="salaryStats.avgSalary > 0">
            <div class="stat">
              <span>Average Salary</span
              ><strong>ETB {{ formatNumber(salaryStats.avgSalary) }}</strong>
            </div>
            <div class="stat">
              <span>Highest Dept</span
              ><strong>{{ salaryStats.highestDept }}</strong>
            </div>
            <div class="stat">
              <span>Total Pool</span
              ><strong>ETB {{ formatNumber(salaryStats.totalPool) }}</strong>
            </div>
          </div>
          <div
            v-if="
              (!salaryChartData || salaryChartData.length === 0) && !loading
            "
            class="no-data-message"
          >
            No salary data available
          </div>
        </div>

        <!-- Employment Type Distribution -->
        <div class="analytics-card">
          <div class="card-header">
            <div class="header-title">
              <div class="title-icon pink">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Employment Type</h3>
            </div>
            <router-link to="/dashboard/employment-distribution" class="expand-btn">
              Show Details
            </router-link>
          </div>
          <div class="employment-types">
            <div
              v-for="type in employmentTypes"
              :key="type.type"
              class="type-row"
            >
              <div class="type-label">
                <span>{{ getEmploymentTypeLabel(type.type) }}</span>
                <span>{{ type.count }}</span>
              </div>
              <div class="type-bar">
                <div
                  class="type-fill"
                  :style="{
                    width: type.percentage + '%',
                    background: getTypeColor(type.type),
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Compliance Section - Simplified -->
      <div class="compliance-section">
        <div class="section-header">
          <div>
            <h2>Document Compliance Status</h2>
            <p>Overview of employee document submission status</p>
          </div>
          <div class="header-actions">
            <router-link to="/dashboard/document-compliance" class="view-full-btn">
              📄 View Full Details
            </router-link>
            <div class="overall-compliance">
              <div class="compliance-ring">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e2e8f0"
                    stroke-width="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#6366f1"
                    stroke-width="8"
                    :stroke-dasharray="283"
                    :stroke-dashoffset="283 - (283 * docComplianceRate) / 100"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span class="ring-value">{{ docComplianceRate }}%</span>
              </div>
              <span class="ring-label">Overall Compliance</span>
            </div>
          </div>
        </div>

        <!-- Department Filter -->
        <div class="global-filters">
          <div class="filter-card">
            <div class="filter-icon">🏢</div>
            <div class="filter-content">
              <label>Department</label>
              <select
                v-model="complianceFilters.departmentId"
                @change="loadDocumentCompliance"
                class="filter-select-modern"
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
            </div>
          </div>
        </div>

        <!-- Document Status Cards -->
        <div class="compliance-status-grid">
          <!-- ID Card Status -->
          <div class="status-card">
            <div class="status-card-header">
              <span class="status-icon">🪪</span>
              <span class="status-title">ID Card</span>
            </div>
            <div class="status-stats">
              <div class="stat-item">
                <span class="stat-label">Submitted</span>
                <span class="stat-value success">{{ idCardData.submitted?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Missing</span>
                <span class="stat-value danger">{{ idCardData.missing?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Compliance</span>
                <span class="stat-value">{{ idCardComplianceRate }}%</span>
              </div>
            </div>
            <div class="status-progress">
              <div
                class="status-progress-bar"
                :style="{
                  width: idCardComplianceRate + '%',
                  background: idCardComplianceRate >= 80 ? '#10b981' : idCardComplianceRate >= 50 ? '#f59e0b' : '#ef4444'
                }"
              ></div>
            </div>
          </div>

          <!-- CV Status -->
          <div class="status-card">
            <div class="status-card-header">
              <span class="status-icon">📄</span>
              <span class="status-title">CV / Resume</span>
            </div>
            <div class="status-stats">
              <div class="stat-item">
                <span class="stat-label">Submitted</span>
                <span class="stat-value success">{{ cvData.submitted?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Missing</span>
                <span class="stat-value danger">{{ cvData.missing?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Compliance</span>
                <span class="stat-value">{{ cvComplianceRate }}%</span>
              </div>
            </div>
            <div class="status-progress">
              <div
                class="status-progress-bar"
                :style="{
                  width: cvComplianceRate + '%',
                  background: cvComplianceRate >= 80 ? '#10b981' : cvComplianceRate >= 50 ? '#f59e0b' : '#ef4444'
                }"
              ></div>
            </div>
          </div>

          <!-- Degree Status -->
          <div class="status-card">
            <div class="status-card-header">
              <span class="status-icon">🎓</span>
              <span class="status-title">Degree / Certificate</span>
            </div>
            <div class="status-stats">
              <div class="stat-item">
                <span class="stat-label">Submitted</span>
                <span class="stat-value success">{{ degreeData.submitted?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Missing</span>
                <span class="stat-value danger">{{ degreeData.missing?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Compliance</span>
                <span class="stat-value">{{ degreeComplianceRate }}%</span>
              </div>
            </div>
            <div class="status-progress">
              <div
                class="status-progress-bar"
                :style="{
                  width: degreeComplianceRate + '%',
                  background: degreeComplianceRate >= 80 ? '#10b981' : degreeComplianceRate >= 50 ? '#f59e0b' : '#ef4444'
                }"
              ></div>
            </div>
          </div>

          <!-- Guarantee Letter Status -->
          <div class="status-card">
            <div class="status-card-header">
              <span class="status-icon">📋</span>
              <span class="status-title">Guarantee Letter</span>
            </div>
            <div class="status-stats">
              <div class="stat-item">
                <span class="stat-label">Has 2+</span>
                <span class="stat-value success">{{ guaranteeData.withTwo?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Has 1</span>
                <span class="stat-value warning">{{ guaranteeData.needSecond?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">None</span>
                <span class="stat-value danger">{{ guaranteeData.missing?.length || 0 }}</span>
              </div>
            </div>
            <div class="status-progress">
              <div
                class="status-progress-bar"
                :style="{
                  width: guaranteeComplianceRate + '%',
                  background: guaranteeComplianceRate >= 80 ? '#10b981' : guaranteeComplianceRate >= 50 ? '#f59e0b' : '#ef4444'
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Quick Summary Footer -->
        <div class="compliance-summary-footer">
          <div class="summary-item">
            <span class="summary-label">✅ Fully Compliant</span>
            <span class="summary-value">{{ fullyCompliantCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">⚠️ Partially Compliant</span>
            <span class="summary-value">{{ partiallyCompliantCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">❌ Missing Documents</span>
            <span class="summary-value">{{ missingDocsCount }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { Chart, registerables } from "chart.js";
import employeeService from "@/stores/employee";

Chart.register(...registerables);

const router = useRouter();
const loading = ref(false);

// Chart refs
const hiringChartCanvas = ref(null);
const salaryChartCanvas = ref(null);

// Chart instances
let hiringChart = null;
let salaryChart = null;
let searchTimeout = null;

// Filter states
const hiringFilters = reactive({ departmentId: "all", timeRange: "all" });
const complianceFilters = reactive({
  documentType: "all",
  guaranteeMonths: 6,
  departmentId: "all",
});

// Data stores
const kpiData = ref({
  total: 0,
  active: 0,
  onLeave: 0,
  terminated: 0,
  fullyCompliant: 0,
  missingDocs: 0,
  complianceRate: "0",
});
const departments = ref([]);
const allDepartments = ref([]);
const employmentTypes = ref([]);
const employeesByDepartment = ref({});
const employeesByType = ref({});
const salaryByDepartment = ref([]);

// Chart data
const hiringChartData = ref([]);
const salaryChartData = ref([]);
const hiringStats = ref({ totalHired: 0, totalTerminated: 0, netGrowth: 0 });
const salaryStats = ref({ avgSalary: 0, highestDept: "-", totalPool: 0 });
const docComplianceRate = ref(0);

// Document Compliance Data - Simplified
const idCardData = ref({ submitted: [], missing: [] });
const cvData = ref({ submitted: [], missing: [] });
const degreeData = ref({ submitted: [], missing: [] });
const guaranteeData = ref({
  all: [],
  missing: [],
  needSecond: [],
  withTwo: [],
});

// ID Card State
const idCardView = ref("missing");
const idCardAgeFilter = ref("all");
const idCardSearch = ref("");
const idCardMissingList = ref([]);
const idCardSubmittedList = ref([]);

// CV State
const cvView = ref("missing");
const cvAgeFilter = ref("all");
const cvSearch = ref("");
const cvMissingList = ref([]);
const cvSubmittedList = ref([]);

// Degree State
const degreeView = ref("missing");
const degreeAgeFilter = ref("all");
const degreeSearch = ref("");
const degreeMissingList = ref([]);
const degreeSubmittedList = ref([]);

// Guarantee State
const guaranteeFilter = ref("missing");
const guaranteeAgeFilter = ref("all");
const guaranteeSearch = ref("");
const guaranteeList = ref([]);

// ========== COMPUTED ==========

// Document Compliance Rates
const idCardComplianceRate = computed(() => {
  const total = (idCardData.value.submitted?.length || 0) + (idCardData.value.missing?.length || 0);
  if (total === 0) return 0;
  return Math.round(((idCardData.value.submitted?.length || 0) / total) * 100);
});

const cvComplianceRate = computed(() => {
  const total = (cvData.value.submitted?.length || 0) + (cvData.value.missing?.length || 0);
  if (total === 0) return 0;
  return Math.round(((cvData.value.submitted?.length || 0) / total) * 100);
});

const degreeComplianceRate = computed(() => {
  const total = (degreeData.value.submitted?.length || 0) + (degreeData.value.missing?.length || 0);
  if (total === 0) return 0;
  return Math.round(((degreeData.value.submitted?.length || 0) / total) * 100);
});

const guaranteeComplianceRate = computed(() => {
  const total = (guaranteeData.value.withTwo?.length || 0) + 
                (guaranteeData.value.needSecond?.length || 0) + 
                (guaranteeData.value.missing?.length || 0);
  if (total === 0) return 0;
  return Math.round(((guaranteeData.value.withTwo?.length || 0) / total) * 100);
});

const fullyCompliantCount = computed(() => {
  // Employee is fully compliant if they have: ID Card, CV, Degree, and 2+ Guarantee Letters
  const idCardSubmitted = idCardData.value.submitted?.length || 0;
  const cvSubmitted = cvData.value.submitted?.length || 0;
  const degreeSubmitted = degreeData.value.submitted?.length || 0;
  const hasTwoGuarantees = guaranteeData.value.withTwo?.length || 0;
  
  // Find the minimum count (assuming each employee needs all 4)
  return Math.min(idCardSubmitted, cvSubmitted, degreeSubmitted, hasTwoGuarantees);
});

const partiallyCompliantCount = computed(() => {
  const total = idCardData.value.submitted?.length || 0;
  return total - fullyCompliantCount.value;
});

const missingDocsCount = computed(() => {
  return (idCardData.value.missing?.length || 0) + 
         (cvData.value.missing?.length || 0) + 
         (degreeData.value.missing?.length || 0) + 
         (guaranteeData.value.missing?.length || 0);
});

const documentTabs = computed(() => [
  {
    id: "id_card",
    name: "ID Card",
    count: idCardData.missing?.length || 0,
    status: idCardData.missing?.length > 0 ? "warning" : "success",
  },
  {
    id: "cv",
    name: "CV / Resume",
    count: cvData.missing?.length || 0,
    status: cvData.missing?.length > 0 ? "warning" : "success",
  },
  {
    id: "degree",
    name: "Degree",
    count: degreeData.missing?.length || 0,
    status: degreeData.missing?.length > 0 ? "warning" : "success",
  },
  {
    id: "guarantee_letter",
    name: "Guarantee Letter",
    count: guaranteeData.missing?.length || 0,
    status: guaranteeData.missing?.length > 0 ? "critical" : "success",
  },
]);

const kpiList = computed(() => [
  {
    label: "Total Headcount",
    value: kpiData.value.total || "0",
    icon: "UsersIcon",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
  },
  {
    label: "Active Employees",
    value: kpiData.value.active || "0",
    icon: "ActivityIcon",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
  {
    label: "On Leave",
    value: kpiData.value.onLeave || "0",
    icon: "CalendarIcon",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  },
  {
    label: "Fully Compliant",
    value: kpiData.value.complianceRate || "0%",
    icon: "CheckIcon",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
  },
  {
    label: "Missing Docs",
    value: kpiData.value.missingDocs || "0",
    icon: "AlertIcon",
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
  },
]);

// ========== HELPER FUNCTIONS ==========
const formatNumber = (num) => (!num ? "0" : num.toLocaleString());
const formatDate = (date) =>
  !date ? "N/A" : new Date(date).toLocaleDateString();
const getEmploymentTypeLabel = (type) =>
  ({
    "full-time": "Full Time",
    "part-time": "Part Time",
    contract: "Contract",
    intern: "Intern",
  })[type] || type;
const getTypeColor = (type) =>
  ({
    "full-time": "#10b981",
    "part-time": "#f59e0b",
    contract: "#8b5cf6",
    intern: "#ef4444",
  })[type] || "#6366f1";
const getAgeClass = (months) => {
  if (!months) return "";
  if (months > 12) return "age-critical";
  if (months > 6) return "age-warning";
  if (months > 3) return "age-attention";
  return "age-ok";
};
const getStatusClass = (status) =>
  ({
    valid: "status-ok",
    recent: "status-attention",
    expiring_soon: "status-warning",
    expired: "status-critical",
    missing: "status-critical",
    no_guarantee: "status-critical",
    need_second: "status-warning",
    compliant: "status-ok",
  })[status] || "status-ok";
const getStatusLabel = (status) =>
  ({
    valid: "✅ Valid",
    recent: "📄 Recent",
    expiring_soon: "⚠️ Expiring Soon",
    expired: "🔴 Expired",
    missing: "❌ Missing",
    no_guarantee: "⚠️ No Guarantee",
    need_second: "🟡 Need 1 more",
    compliant: "✅ Compliant",
  })[status] || status;

const viewEmployee = (id) => {
  router.push(`/employees/${id}`);
};

// ========== DATA LOADING FUNCTIONS ==========

const loadIdCardData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: "id_card",
      departmentId: complianceFilters.departmentId,
      guaranteeMonths: 6,
    });
    if (response.success && response.data) {
      const data = response.data;
      idCardData.value = {
        submitted: data.id_card?.submitted || [],
        missing: data.id_card?.missing || [],
      };
      if (idCardView.value === "missing") {
        let list = [...idCardData.value.missing];
        if (idCardSearch.value) {
          const search = idCardSearch.value.toLowerCase();
          list = list.filter(
            (emp) =>
              emp.fullName.toLowerCase().includes(search) ||
              emp.department?.toLowerCase().includes(search),
          );
        }
        idCardMissingList.value = list;
      } else {
        let list = [...idCardData.value.submitted];
        if (idCardAgeFilter.value !== "all") {
          list = list.filter((emp) => {
            const months = emp.monthsOld || 0;
            switch (idCardAgeFilter.value) {
              case "0-3":
                return months < 3;
              case "3-6":
                return months >= 3 && months < 6;
              case "6-12":
                return months >= 6 && months < 12;
              case "12+":
                return months >= 12;
              default:
                return true;
            }
          });
        }
        if (idCardSearch.value) {
          const search = idCardSearch.value.toLowerCase();
          list = list.filter(
            (emp) =>
              emp.fullName.toLowerCase().includes(search) ||
              emp.department?.toLowerCase().includes(search),
          );
        }
        idCardSubmittedList.value = list;
      }
    }
  } catch (error) {
    console.error("Error loading ID card data:", error);
  }
};

const loadCvData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: "cv",
      departmentId: complianceFilters.departmentId,
      guaranteeMonths: 6,
    });
    if (response.success && response.data) {
      const data = response.data;
      cvData.value = {
        submitted: data.cv?.submitted || [],
        missing: data.cv?.missing || [],
      };
      if (cvView.value === "missing") {
        let list = [...cvData.value.missing];
        if (cvSearch.value) {
          const search = cvSearch.value.toLowerCase();
          list = list.filter(
            (emp) =>
              emp.fullName.toLowerCase().includes(search) ||
              emp.department?.toLowerCase().includes(search),
          );
        }
        cvMissingList.value = list;
      } else {
        let list = [...cvData.value.submitted];
        if (cvAgeFilter.value !== "all") {
          list = list.filter((emp) => {
            const months = emp.monthsOld || 0;
            switch (cvAgeFilter.value) {
              case "0-3":
                return months < 3;
              case "3-6":
                return months >= 3 && months < 6;
              case "6-12":
                return months >= 6 && months < 12;
              case "12+":
                return months >= 12;
              default:
                return true;
            }
          });
        }
        if (cvSearch.value) {
          const search = cvSearch.value.toLowerCase();
          list = list.filter(
            (emp) =>
              emp.fullName.toLowerCase().includes(search) ||
              emp.department?.toLowerCase().includes(search),
          );
        }
        cvSubmittedList.value = list;
      }
    }
  } catch (error) {
    console.error("Error loading CV data:", error);
  }
};

const loadDegreeData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: "degree",
      departmentId: complianceFilters.departmentId,
      guaranteeMonths: 6,
    });
    if (response.success && response.data) {
      const data = response.data;
      degreeData.value = {
        submitted: data.degree?.submitted || [],
        missing: data.degree?.missing || [],
      };
      if (degreeView.value === "missing") {
        let list = [...degreeData.value.missing];
        if (degreeSearch.value) {
          const search = degreeSearch.value.toLowerCase();
          list = list.filter(
            (emp) =>
              emp.fullName.toLowerCase().includes(search) ||
              emp.department?.toLowerCase().includes(search),
          );
        }
        degreeMissingList.value = list;
      } else {
        let list = [...degreeData.value.submitted];
        if (degreeAgeFilter.value !== "all") {
          list = list.filter((emp) => {
            const months = emp.monthsOld || 0;
            switch (degreeAgeFilter.value) {
              case "0-3":
                return months < 3;
              case "3-6":
                return months >= 3 && months < 6;
              case "6-12":
                return months >= 6 && months < 12;
              case "12+":
                return months >= 12;
              default:
                return true;
            }
          });
        }
        if (degreeSearch.value) {
          const search = degreeSearch.value.toLowerCase();
          list = list.filter(
            (emp) =>
              emp.fullName.toLowerCase().includes(search) ||
              emp.department?.toLowerCase().includes(search),
          );
        }
        degreeSubmittedList.value = list;
      }
    }
  } catch (error) {
    console.error("Error loading degree data:", error);
  }
};

const loadGuaranteeData = async () => {
  try {
    const response = await employeeService.getDocumentCompliance({
      documentType: "guarantee_letter",
      departmentId: complianceFilters.departmentId,
      guaranteeMonths: 6,
    });
    if (response.success && response.data) {
      const data = response.data;
      guaranteeData.value = {
        all: data.guarantee_letter?.all || [],
        missing: data.guarantee_letter?.missing || [],
        needSecond: data.guarantee_letter?.needSecond || [],
        withTwo: data.guarantee_letter?.withTwo || [],
      };
      applyGuaranteeFilters();
    }
  } catch (error) {
    console.error("Error loading guarantee data:", error);
  }
};

const applyGuaranteeFilters = () => {
  let sourceList = [];
  switch (guaranteeFilter.value) {
    case "missing":
      sourceList = [...guaranteeData.value.missing];
      break;
    case "one":
      sourceList = [...guaranteeData.value.needSecond];
      break;
    case "two":
      sourceList = [...guaranteeData.value.withTwo];
      break;
    default:
      sourceList = [...guaranteeData.value.all];
  }
  if (guaranteeAgeFilter.value !== "all") {
    sourceList = sourceList.filter((emp) => {
      const age = emp.latestAge || 0;
      switch (guaranteeAgeFilter.value) {
        case "0-3":
          return age < 3;
        case "3-6":
          return age >= 3 && age < 6;
        case "6-12":
          return age >= 6 && age < 12;
        case "12+":
          return age >= 12;
        default:
          return true;
      }
    });
  }
  if (guaranteeSearch.value) {
    const search = guaranteeSearch.value.toLowerCase();
    sourceList = sourceList.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(search) ||
        emp.department?.toLowerCase().includes(search),
    );
  }
  guaranteeList.value = sourceList;
};

const loadDocumentCompliance = async () => {
  try {
    await Promise.all([
      loadIdCardData(),
      loadCvData(),
      loadDegreeData(),
      loadGuaranteeData(),
    ]);
    const result = await employeeService.getDocumentCompliance({
      documentType: "all",
      departmentId: complianceFilters.departmentId,
      guaranteeMonths: 6,
    });
    if (result.success && result.data)
      docComplianceRate.value = parseFloat(
        result.data.summary?.complianceRate || "0",
      );
  } catch (error) {
    console.error("Error loading document compliance:", error);
  }
};

// Other Data Loading Functions
const loadKpiStats = async () => {
  try {
    const result = await employeeService.getKpiStats();
    if (result.success && result.data) kpiData.value = result.data;
  } catch (error) {
    console.error("Error loading KPI stats:", error);
  }
};

const loadHiringTrends = async () => {
  try {
    const result = await employeeService.getHiringTrends({
      departmentId: hiringFilters.departmentId,
      months:
        hiringFilters.timeRange === "all" ? "all" : hiringFilters.timeRange,
    });
    if (result.success && result.data && result.data.trends) {
      hiringChartData.value = [...result.data.trends];
      hiringStats.value = {
        totalHired: result.data.totalHired || 0,
        totalTerminated: result.data.totalTerminated || 0,
        netGrowth: result.data.netGrowth || 0,
      };
      await nextTick();
      setTimeout(() => initHiringChart(), 100);
    }
  } catch (error) {
    console.error("Error loading hiring trends:", error);
  }
};

const loadDepartmentDistribution = async () => {
  try {
    const result = await employeeService.getDepartmentDistribution();
    if (result.success && result.data) {
      departments.value = result.data.departments || [];
      allDepartments.value = result.data.departments || [];
      employeesByDepartment.value = result.data.employeesByDepartment || {};
    }
  } catch (error) {
    console.error("Error loading department distribution:", error);
  }
};

const loadEmploymentTypeDistribution = async () => {
  try {
    const result = await employeeService.getEmploymentTypeDistribution();
    if (result.success && result.data) {
      employmentTypes.value = result.data.types || [];
      employeesByType.value = result.data.employeesByType || {};
    }
  } catch (error) {
    console.error("Error loading employment type distribution:", error);
  }
};

const loadSalaryAnalysis = async () => {
  try {
    const result = await employeeService.getSalaryAnalysis();
    if (result.success && result.data) {
      salaryChartData.value = result.data.distribution || [];
      salaryStats.value = {
        avgSalary: result.data.overview?.avg_salary || 0,
        highestDept: result.data.byDepartment?.[0]?.department_name || "-",
        totalPool: result.data.overview?.total_salary_pool || 0,
      };
      salaryByDepartment.value = result.data.byDepartment || [];
      await nextTick();
      setTimeout(() => initSalaryChart(), 100);
    }
  } catch (error) {
    console.error("Error loading salary analysis:", error);
  }
};

const loadAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadKpiStats(),
      loadHiringTrends(),
      loadDepartmentDistribution(),
      loadEmploymentTypeDistribution(),
      loadSalaryAnalysis(),
      loadDocumentCompliance(),
    ]);
    await nextTick();
    setTimeout(() => {
      if (hiringChartData.value?.length > 0) initHiringChart();
      if (salaryChartData.value?.length > 0) initSalaryChart();
    }, 200);
  } catch (error) {
    console.error("Error loading analytics data:", error);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  hiringFilters.departmentId = "all";
  hiringFilters.timeRange = "all";
  complianceFilters.documentType = "all";
  complianceFilters.guaranteeMonths = 6;
  complianceFilters.departmentId = "all";
  loadAllData();
};

// ========== CHART FUNCTIONS ==========

const initHiringChart = () => {
  if (!hiringChartCanvas.value) {
    setTimeout(() => {
      if (hiringChartData.value?.length > 0) initHiringChart();
    }, 100);
    return false;
  }
  const ctx = hiringChartCanvas.value.getContext("2d");
  if (!ctx) return false;
  if (hiringChart) {
    hiringChart.destroy();
    hiringChart = null;
  }
  if (!hiringChartData.value?.length) return false;
  const labels = hiringChartData.value.map((m) => {
    const [year, month] = m.month.split("-");
    return (
      [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][parseInt(month) - 1] +
      " " +
      year
    );
  });
  hiringChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Hires",
          data: hiringChartData.value.map((m) => m.hired || 0),
          backgroundColor: "#10b981",
          borderRadius: 8,
          barPercentage: 0.7,
        },
        {
          label: "Terminations",
          data: hiringChartData.value.map((m) => m.terminated || 0),
          backgroundColor: "#ef4444",
          borderRadius: 8,
          barPercentage: 0.7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.raw} employee${ctx.raw !== 1 ? "s" : ""}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Employees" },
          grid: { color: "#e2e8f0" },
          ticks: { precision: 0, stepSize: 1 },
        },
        x: {
          title: { display: true, text: "Month" },
          grid: { display: false },
        },
      },
    },
  });
  return true;
};

const initSalaryChart = () => {
  if (!salaryChartCanvas.value) return false;
  const ctx = salaryChartCanvas.value.getContext("2d");
  if (!ctx) return false;
  if (salaryChart) {
    salaryChart.destroy();
    salaryChart = null;
  }
  if (!salaryChartData.value?.length) return false;
  salaryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: salaryChartData.value.map((s) => s.salary_range),
      datasets: [
        {
          label: "Number of Employees",
          data: salaryChartData.value.map((s) => s.employee_count),
          backgroundColor: "#10b981",
          borderRadius: 8,
          barPercentage: 0.7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} employee${ctx.raw !== 1 ? "s" : ""}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Employees" },
          grid: { color: "#e2e8f0" },
          ticks: { precision: 0 },
        },
        x: {
          title: { display: true, text: "Salary Range (ETB)" },
          grid: { display: false },
        },
      },
    },
  });
  return true;
};

// Icons
const UsersIcon = {
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
};
const ActivityIcon = {
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
};
const CalendarIcon = {
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
};
const CheckIcon = {
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
};
const AlertIcon = {
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>',
};

// ========== LIFECYCLE ==========
onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
/* ========== MAIN CONTAINER ========== */
.hr-analytics {
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #f0f4f8 100%);
}
.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

/* ========== HEADER ========== */
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo-badge {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-badge svg {
  width: 28px;
  height: 28px;
  color: white;
}
.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}
.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.header-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}
.refresh-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

/* ========== LOADING STATE ========== */
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
  to {
    transform: rotate(360deg);
  }
}

/* ========== KPI GRID ========== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
.kpi-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}
.kpi-content {
  flex: 1;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  display: block;
  line-height: 1.2;
}
.kpi-label {
  font-size: 13px;
  color: #64748b;
  display: block;
  margin-top: 4px;
}

/* ========== ANALYTICS GRID ========== */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}
@media (max-width: 1200px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
.analytics-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}
.analytics-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title-icon.blue {
  background: #dbeafe;
}
.title-icon.blue svg {
  color: #3b82f6;
}
.title-icon.purple {
  background: #f3e8ff;
}
.title-icon.purple svg {
  color: #8b5cf6;
}
.title-icon.green {
  background: #dcfce7;
}
.title-icon.green svg {
  color: #10b981;
}
.title-icon.pink {
  background: #fce7f3;
}
.title-icon.pink svg {
  color: #ec4899;
}
.title-icon svg {
  width: 16px;
  height: 16px;
}
.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

/* ========== FILTERS ========== */
.filter-group-small {
  display: flex;
  gap: 4px;
  align-items: center;
}
.filter-select-small,
.filter-input-small {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
}
.filter-input-small {
  width: 70px;
}
.expand-btn {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #4f46e5;
  text-decoration: none;
}
.expand-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}
.expand-btn svg {
  width: 14px;
  height: 14px;
  margin-right: 4px;
}

/* ========== CHARTS ========== */
.chart-container {
  padding: 20px;
  height: 300px;
  position: relative;
  width: 100%;
}
.chart-container.small {
  height: 250px;
}
.chart-stats,
.salary-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 20px 20px;
  border-top: 1px solid #e9edf2;
  background: #fafcfc;
}
.stat {
  text-align: center;
}
.stat span {
  font-size: 11px;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}
.stat strong {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.stat strong.positive {
  color: #10b981;
}
.stat strong.negative {
  color: #ef4444;
}
.no-data-message {
  text-align: center;
  padding: 40px;
  color: #64748b;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.no-data-message.small {
  padding: 20px;
}

/* ========== DEPARTMENT LIST ========== */
.dept-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dept-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.dept-info {
  flex: 1;
}
.dept-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}
.dept-count {
  font-size: 12px;
  color: #64748b;
  margin-left: 8px;
}
.dept-metrics {
  width: 200px;
}
.metric {
  display: flex;
  align-items: center;
  gap: 8px;
}
.metric-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}
.metric span {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
  min-width: 40px;
}

/* ========== EMPLOYMENT TYPES ========== */
.employment-types {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.type-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.type-label {
  width: 100px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #1e293b;
}
.type-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.type-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

/* ========== DOCUMENT COMPLIANCE ========== */
.compliance-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  margin-top: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 20px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.section-header p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.view-full-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  transition: all 0.2s;
}

.view-full-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  color: #6366f1;
}

.overall-compliance {
  text-align: center;
}

.compliance-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.compliance-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.ring-label {
  font-size: 11px;
  color: #64748b;
  display: block;
  margin-top: 8px;
}

/* Global Filters */
.global-filters {
  margin-bottom: 24px;
}

.filter-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e2e8f0;
}

.filter-icon {
  font-size: 28px;
}

.filter-content {
  flex: 1;
}

.filter-content label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select-modern {
  width: 100%;
  max-width: 300px;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select-modern:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Compliance Status Grid */
.compliance-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.status-card {
  background: white;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.status-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.status-icon {
  font-size: 22px;
}

.status-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.status-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.stat-value.success {
  color: #10b981;
}

.stat-value.warning {
  color: #f59e0b;
}

.stat-value.danger {
  color: #ef4444;
}

.status-progress {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.status-progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

/* Compliance Summary Footer */
.compliance-summary-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 16px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.summary-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .hr-analytics {
    padding: 16px;
  }
  .analytics-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-right {
    width: 100%;
  }
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  .dept-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .dept-metrics {
    width: 100%;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .compliance-status-grid {
    grid-template-columns: 1fr 1fr;
  }
  .compliance-summary-footer {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .compliance-status-grid {
    grid-template-columns: 1fr;
  }
  .status-stats {
    flex-direction: row;
  }
}
</style>