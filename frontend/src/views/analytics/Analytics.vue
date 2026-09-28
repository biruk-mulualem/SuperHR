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
          <h1>HR Analytics</h1>
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
              <button class="expand-btn" @click="openHiringDetailsModal">
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
              </button>
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
            <button class="expand-btn" @click="openDepartmentModal">
              View Details
            </button>
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
            <button class="expand-btn" @click="openSalaryModal">
              Show Details
            </button>
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
            <button class="expand-btn" @click="openEmploymentTypeModal">
              Show Details
            </button>
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

      <!-- Document Compliance Section -->
      <div class="compliance-section">
        <div class="section-header">
          <div>
            <h2>Document Compliance Status</h2>
            <p>Track employee document submission and verification</p>
          </div>
          <div class="header-actions">
            <button class="print-compliance-btn" @click="printComplianceTab">
              🖨️ Print Current View
            </button>
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

        <!-- Document Type Tabs -->
        <div class="compliance-tabs-modern">
          <button
            v-for="tab in documentTabs"
            :key="tab.id"
            :class="['tab-btn-modern', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <div class="tab-content-wrapper">
              <span class="tab-name">{{ tab.name }}</span>
            </div>
          </button>
        </div>

        <!-- ID CARD TAB -->
        <div v-show="activeTab === 'id_card'" class="tab-content-modern">
          <div class="panel-filters-modern">
            <div class="filter-group-modern">
              <div class="toggle-switch-modern">
                <button
                  :class="{ active: idCardView === 'missing' }"
                  @click="changeIdCardView('missing')"
                >
                  <span class="toggle-icon">⚠️</span> Missing
                  <span class="toggle-count">{{
                    idCardData.missing?.length || 0
                  }}</span>
                </button>
                <button
                  :class="{ active: idCardView === 'submitted' }"
                  @click="changeIdCardView('submitted')"
                >
                  <span class="toggle-icon">✅</span> Submitted
                  <span class="toggle-count">{{
                    idCardData.submitted?.length || 0
                  }}</span>
                </button>
              </div>
            </div>
            <div v-if="idCardView === 'submitted'" class="filter-group-modern">
              <select
                v-model="idCardAgeFilter"
                @change="loadIdCardData"
                class="filter-select-modern small"
              >
                <option value="all">All Time</option>
                <option value="0-3">Less than 3 months</option>
                <option value="3-6">3 - 6 months</option>
                <option value="6-12">6 - 12 months</option>
                <option value="12+">More than 12 months</option>
              </select>
            </div>
            <div class="filter-group-modern search-group">
              <input
                type="text"
                v-model="idCardSearch"
                placeholder="🔍 Search employee..."
                @input="debouncedIdCardSearch"
                class="filter-input-modern"
              />
            </div>
          </div>

          <!-- Missing ID Card Table -->
          <div v-if="idCardView === 'missing'" class="employees-table-modern">
            <div class="table-header">
              <h4>⚠️ Employees Missing ID Card</h4>
              <div class="table-stats">
                {{ idCardData.missing?.length || 0 }} total employees
              </div>
            </div>
            <div class="table-wrapper" id="id-card-missing-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Email</th>
                    
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, idx) in idCardMissingList"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span class="employee-name">{{ emp.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="dept-badge">{{ emp.department }}</span>
                    </td>
                    <td>{{ emp.position }}</td>
                    <td>{{ emp.email }}</td>
                    
                  </tr>
                  <tr v-if="idCardMissingList.length === 0">
                    <td colspan="6" class="empty-state">
                      ✅ All employees have submitted ID cards!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Submitted ID Card Table -->
          <div v-if="idCardView === 'submitted'" class="employees-table-modern">
            <div class="table-header">
              <h4>📄 Employees Who Submitted ID Card</h4>
              <div class="table-stats">
                {{ idCardData.submitted?.length || 0 }} total employees
              </div>
            </div>
            <div class="table-wrapper" id="id-card-submitted-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Submitted Date</th>
                    <th>Age</th>
                    <th>Status</th>
                    
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, idx) in idCardSubmittedList"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span class="employee-name">{{ emp.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="dept-badge">{{ emp.department }}</span>
                    </td>
                    <td>{{ emp.position }}</td>
                    <td>{{ formatDate(emp.submittedDate) }}</td>
                    <td>
                      <span :class="['age-badge', getAgeClass(emp.monthsOld)]"
                        >{{ emp.monthsOld }} months</span
                      >
                    </td>
                    <td>
                      <span
                        :class="[
                          'status-badge-modern',
                          getStatusClass(emp.status),
                        ]"
                        >{{ getStatusLabel(emp.status) }}</span
                      >
                    </td>
                   
                  </tr>
                  <tr v-if="idCardSubmittedList.length === 0">
                    <td colspan="8" class="empty-state">
                      No submitted ID cards found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- CV TAB -->
        <div v-show="activeTab === 'cv'" class="tab-content-modern">
          <div class="panel-filters-modern">
            <div class="filter-group-modern">
              <div class="toggle-switch-modern">
                <button
                  :class="{ active: cvView === 'missing' }"
                  @click="changeCvView('missing')"
                >
                  <span class="toggle-icon">⚠️</span> Missing
                  <span class="toggle-count">{{
                    cvData.missing?.length || 0
                  }}</span>
                </button>
                <button
                  :class="{ active: cvView === 'submitted' }"
                  @click="changeCvView('submitted')"
                >
                  <span class="toggle-icon">✅</span> Submitted
                  <span class="toggle-count">{{
                    cvData.submitted?.length || 0
                  }}</span>
                </button>
              </div>
            </div>
            <div v-if="cvView === 'submitted'" class="filter-group-modern">
              <select
                v-model="cvAgeFilter"
                @change="loadCvData"
                class="filter-select-modern small"
              >
                <option value="all">All Time</option>
                <option value="0-3">Less than 3 months</option>
                <option value="3-6">3 - 6 months</option>
                <option value="6-12">6 - 12 months</option>
                <option value="12+">More than 12 months</option>
              </select>
            </div>
            <div class="filter-group-modern search-group">
              <input
                type="text"
                v-model="cvSearch"
                placeholder="🔍 Search employee..."
                @input="debouncedCvSearch"
                class="filter-input-modern"
              />
            </div>
          </div>

          <div v-if="cvView === 'missing'" class="employees-table-modern">
            <div class="table-header">
              <h4>⚠️ Employees Missing CV/Resume</h4>
              <div class="table-stats">
                {{ cvData.missing?.length || 0 }} total employees
              </div>
            </div>
            <div class="table-wrapper" id="cv-missing-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Email</th>
                   
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, idx) in cvMissingList"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span class="employee-name">{{ emp.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="dept-badge">{{ emp.department }}</span>
                    </td>
                    <td>{{ emp.position }}</td>
                    <td>{{ emp.email }}</td>
                  
                  </tr>
                  <tr v-if="cvMissingList.length === 0">
                    <td colspan="6" class="empty-state">
                      ✅ All employees have submitted CVs!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="cvView === 'submitted'" class="employees-table-modern">
            <div class="table-header">
              <h4>📄 Employees Who Submitted CV/Resume</h4>
              <div class="table-stats">
                {{ cvData.submitted?.length || 0 }} total employees
              </div>
            </div>
            <div class="table-wrapper" id="cv-submitted-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Submitted Date</th>
                    <th>Age</th>
                    <th>Status</th>
                  
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, idx) in cvSubmittedList"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span class="employee-name">{{ emp.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="dept-badge">{{ emp.department }}</span>
                    </td>
                    <td>{{ emp.position }}</td>
                    <td>{{ formatDate(emp.submittedDate) }}</td>
                    <td>
                      <span :class="['age-badge', getAgeClass(emp.monthsOld)]"
                        >{{ emp.monthsOld }} months</span
                      >
                    </td>
                    <td>
                      <span
                        :class="[
                          'status-badge-modern',
                          getStatusClass(emp.status),
                        ]"
                        >{{ getStatusLabel(emp.status) }}</span
                      >
                    </td>
                  
                  </tr>
                  <tr v-if="cvSubmittedList.length === 0">
                    <td colspan="8" class="empty-state">
                      No submitted CVs found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- DEGREE TAB -->
        <div v-show="activeTab === 'degree'" class="tab-content-modern">
          <div class="panel-filters-modern">
            <div class="filter-group-modern">
              <div class="toggle-switch-modern">
                <button
                  :class="{ active: degreeView === 'missing' }"
                  @click="changeDegreeView('missing')"
                >
                  <span class="toggle-icon">⚠️</span> Missing
                  <span class="toggle-count">{{
                    degreeData.missing?.length || 0
                  }}</span>
                </button>
                <button
                  :class="{ active: degreeView === 'submitted' }"
                  @click="changeDegreeView('submitted')"
                >
                  <span class="toggle-icon">✅</span> Submitted
                  <span class="toggle-count">{{
                    degreeData.submitted?.length || 0
                  }}</span>
                </button>
              </div>
            </div>
            <div v-if="degreeView === 'submitted'" class="filter-group-modern">
              <select
                v-model="degreeAgeFilter"
                @change="loadDegreeData"
                class="filter-select-modern small"
              >
                <option value="all">All Time</option>
                <option value="0-3">Less than 3 months</option>
                <option value="3-6">3 - 6 months</option>
                <option value="6-12">6 - 12 months</option>
                <option value="12+">More than 12 months</option>
              </select>
            </div>
            <div class="filter-group-modern search-group">
              <input
                type="text"
                v-model="degreeSearch"
                placeholder="🔍 Search employee..."
                @input="debouncedDegreeSearch"
                class="filter-input-modern"
              />
            </div>
          </div>

          <div v-if="degreeView === 'missing'" class="employees-table-modern">
            <div class="table-header">
              <h4>⚠️ Employees Missing Degree/Certificate</h4>
              <div class="table-stats">
                {{ degreeData.missing?.length || 0 }} total employees
              </div>
            </div>
            <div class="table-wrapper" id="degree-missing-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Email</th>
                  
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, idx) in degreeMissingList"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span class="employee-name">{{ emp.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="dept-badge">{{ emp.department }}</span>
                    </td>
                    <td>{{ emp.position }}</td>
                    <td>{{ emp.email }}</td>
                  
                  </tr>
                  <tr v-if="degreeMissingList.length === 0">
                    <td colspan="6" class="empty-state">
                      ✅ All employees have submitted degrees!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="degreeView === 'submitted'" class="employees-table-modern">
            <div class="table-header">
              <h4>📄 Employees Who Submitted Degree/Certificate</h4>
              <div class="table-stats">
                {{ degreeData.submitted?.length || 0 }} total employees
              </div>
            </div>
            <div class="table-wrapper" id="degree-submitted-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Submitted Date</th>
                    <th>Age</th>
                    <th>Status</th>
                   
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, idx) in degreeSubmittedList"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span class="employee-name">{{ emp.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="dept-badge">{{ emp.department }}</span>
                    </td>
                    <td>{{ emp.position }}</td>
                    <td>{{ formatDate(emp.submittedDate) }}</td>
                    <td>
                      <span :class="['age-badge', getAgeClass(emp.monthsOld)]"
                        >{{ emp.monthsOld }} months</span
                      >
                    </td>
                    <td>
                      <span
                        :class="[
                          'status-badge-modern',
                          getStatusClass(emp.status),
                        ]"
                        >{{ getStatusLabel(emp.status) }}</span
                      >
                    </td>
                   
                  </tr>
                  <tr v-if="degreeSubmittedList.length === 0">
                    <td colspan="8" class="empty-state">
                      No submitted degrees found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- GUARANTEE LETTER TAB -->
        <div
          v-show="activeTab === 'guarantee_letter'"
          class="tab-content-modern"
        >
          <div class="panel-filters-modern">
            <div class="filter-group-modern">
              <div class="guarantee-filters-modern">
                <button
                  :class="{ active: guaranteeFilter === 'missing' }"
                  @click="changeGuaranteeFilter('missing')"
                >
                  <span class="dot red"></span> No Guarantee ({{
                    guaranteeMissingCount
                  }})
                </button>
                <button
                  :class="{ active: guaranteeFilter === 'one' }"
                  @click="changeGuaranteeFilter('one')"
                >
                  <span class="dot orange"></span> Only 1 ({{
                    guaranteeNeedSecondCount
                  }})
                </button>
                <button
                  :class="{ active: guaranteeFilter === 'two' }"
                  @click="changeGuaranteeFilter('two')"
                >
                  <span class="dot green"></span> Has 2 ({{
                    guaranteeWithTwoCount
                  }})
                </button>
                <button
                  :class="{ active: guaranteeFilter === 'all' }"
                  @click="changeGuaranteeFilter('all')"
                >
                  <span class="dot blue"></span> All ({{ guaranteeTotalCount }})
                </button>
              </div>
            </div>
            <div
              v-if="guaranteeFilter !== 'missing'"
              class="filter-group-modern"
            >
              <select
                v-model="guaranteeAgeFilter"
                @change="applyGuaranteeFilters"
                class="filter-select-modern small"
              >
                <option value="all">All Time</option>
                <option value="0-3">Less than 3 months</option>
                <option value="3-6">3 - 6 months</option>
                <option value="6-12">6 - 12 months</option>
                <option value="12+">More than 12 months</option>
              </select>
            </div>
            <div class="filter-group-modern search-group">
              <input
                type="text"
                v-model="guaranteeSearch"
                placeholder="🔍 Search employee..."
                @input="debouncedGuaranteeSearch"
                class="filter-input-modern"
              />
            </div>
          </div>

          <div class="employees-table-modern">
            <div class="table-header">
              <h4>📋 Guarantee Letter Status</h4>
              <div class="table-stats">
                {{ guaranteeTotalCount }} total employees
              </div>
            </div>
            <div class="table-wrapper" id="guarantee-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Guarantees</th>
                    <th v-if="guaranteeFilter !== 'missing'">Latest Date</th>
                    <th v-if="guaranteeFilter !== 'missing'">Latest Age</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, idx) in guaranteeList"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span class="employee-name">{{ emp.fullName }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="dept-badge">{{ emp.department }}</span>
                    </td>
                    <td>{{ emp.position }}</td>
                    <td>
                      <span
                        :class="[
                          'guarantee-badge',
                          getGuaranteeCountClass(emp.guaranteeCount),
                        ]"
                        >{{ emp.guaranteeCount }}
                      </span>
                    </td>
                    <td v-if="guaranteeFilter !== 'missing'">
                      {{ formatDate(emp.latestDate) }}
                    </td>
                    <td v-if="guaranteeFilter !== 'missing'">
                      <span :class="['age-badge', getAgeClass(emp.latestAge)]"
                        >{{ emp.latestAge || "N/A" }}
                        {{ emp.latestAge ? "months" : "" }}</span
                      >
                    </td>
                    <td>
                      <span
                        :class="[
                          'status-badge-modern',
                          getGuaranteeStatusClass(emp),
                        ]"
                        >{{ getGuaranteeStatusLabel(emp) }}</span
                      >
                    </td>
                  </tr>
                  <tr v-if="guaranteeList.length === 0">
                    <td
                      :colspan="guaranteeFilter !== 'missing' ? 9 : 7"
                      class="empty-state"
                    >
                      No employees found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Department Modal -->
    <div
      v-if="showDepartmentModal"
      class="modal-overlay"
      @click="closeDepartmentModal"
    >
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Department Distribution - Employee List</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('department')">
              🖨️ Print
            </button>
            <button
              class="modal-action-btn"
              @click="saveModalAsCSV('department')"
            >
              💾 Save as CSV
            </button>
            <button class="modal-action-btn" @click="closeDepartmentModal">
              ✕
            </button>
          </div>
        </div>
        <div class="modal-body" id="department-modal-content">
          <div class="modal-filter">
            <input
              type="text"
              v-model="departmentFilter"
              placeholder="Filter by department or employee..."
              class="filter-input"
            />
          </div>
          <table class="modal-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Employee Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="emp in flattenedDepartmentEmployees"
                :key="emp.id"
                @click="viewEmployee(emp.id)"
                style="cursor: pointer"
              >
                <td>{{ emp.department }}</td>
                <td>{{ emp.fullName }}</td>
                <td>{{ emp.email }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDepartmentModal">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Salary Details Modal -->
    <div v-if="showSalaryModal" class="modal-overlay" @click="closeSalaryModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Salary Analysis Details</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('salary')">
              🖨️ Print
            </button>
            <button class="modal-action-btn" @click="saveModalAsCSV('salary')">
              💾 Save as CSV
            </button>
            <button class="modal-action-btn" @click="closeSalaryModal">
              ✕
            </button>
          </div>
        </div>
        <div class="modal-body" id="salary-modal-content">
          <div
            v-if="salaryPagination.totalPages > 1"
            class="pagination-controls"
          >
            <button
              @click="changeSalaryPage(salaryPagination.page - 1)"
              :disabled="!salaryPagination.hasPrevPage"
              class="pagination-btn"
            >
              ← Previous
            </button>
            <span class="pagination-info"
              >Page {{ salaryPagination.page }} of
              {{ salaryPagination.totalPages }} ({{
                salaryPagination.total
              }}
              total employees)</span
            >
            <button
              @click="changeSalaryPage(salaryPagination.page + 1)"
              :disabled="!salaryPagination.hasNextPage"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
          <h4 style="margin-top: 24px">Salary by Department</h4>
          <div class="modal-table-wrapper">
            <table class="modal-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Avg Salary</th>
                  <th>Min Salary</th>
                  <th>Max Salary</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="dept in salaryByDepartment"
                  :key="dept.department_name"
                >
                  <td>{{ dept.department_name }}</td>
                  <td>{{ dept.employee_count }}</td>
                  <td>ETB {{ formatNumber(dept.avg_salary) }}</td>
                  <td>ETB {{ formatNumber(dept.min_salary) }}</td>
                  <td>ETB {{ formatNumber(dept.max_salary) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeSalaryModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Employment Type Modal -->
    <div
      v-if="showEmploymentTypeModal"
      class="modal-overlay"
      @click="closeEmploymentTypeModal"
    >
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Employment Type - Employee List</h3>
          <div class="modal-actions">
            <button
              class="modal-action-btn"
              @click="printModal('employmentType')"
            >
              🖨️ Print
            </button>
            <button
              class="modal-action-btn"
              @click="saveModalAsCSV('employmentType')"
            >
              💾 Save as CSV
            </button>
            <button class="modal-action-btn" @click="closeEmploymentTypeModal">
              ✕
            </button>
          </div>
        </div>
        <div class="modal-body" id="employment-type-modal-content">
          <div class="modal-filter">
            <select
              v-model="employmentTypeFilterParam"
              @change="loadEmploymentTypeEmployees"
              class="filter-select"
            >
              <option value="all">All Employment Types</option>
              <option
                v-for="type in employmentTypes"
                :key="type.type"
                :value="type.type"
              >
                {{ getEmploymentTypeLabel(type.type) }} ({{ type.count }})
              </option>
            </select>
            <input
              type="text"
              v-model="employmentTypeSearchFilter"
              placeholder="Filter by employee name, department, or email..."
              class="filter-input"
              @input="loadEmploymentTypeEmployees"
            />
          </div>
          <div class="modal-table-wrapper">
            <table class="modal-table">
              <thead>
                <tr>
                  <th>Employment Type</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="emp in paginatedEmploymentTypeEmployees"
                  :key="emp.id"
                  @click="viewEmployee(emp.id)"
                  style="cursor: pointer"
                >
                  <td>
                    <span
                      class="type-badge"
                      :style="{
                        background: getTypeColor(emp.type) + '20',
                        color: getTypeColor(emp.type),
                      }"
                      >{{ getEmploymentTypeLabel(emp.type) }}</span
                    >
                  </td>
                  <td>{{ emp.fullName }}</td>
                  <td>{{ emp.department }}</td>
                  <td>{{ emp.email }}</td>
                </tr>
                <tr v-if="paginatedEmploymentTypeEmployees.length === 0">
                  <td colspan="4" class="no-data-cell">No employees found</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-if="employmentTypePagination.totalPages > 1"
            class="pagination-controls"
          >
            <button
              @click="
                changeEmploymentTypePage(employmentTypePagination.page - 1)
              "
              :disabled="!employmentTypePagination.hasPrevPage"
              class="pagination-btn"
            >
              ← Previous
            </button>
            <span class="pagination-info"
              >Page {{ employmentTypePagination.page }} of
              {{ employmentTypePagination.totalPages }} ({{
                employmentTypePagination.total
              }}
              total employees)</span
            >
            <button
              @click="
                changeEmploymentTypePage(employmentTypePagination.page + 1)
              "
              :disabled="!employmentTypePagination.hasNextPage"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeEmploymentTypeModal">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Missing Documents Modal -->
    <div
      v-if="showMissingDocsModal"
      class="modal-overlay"
      @click="closeMissingDocsModal"
    >
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3>Employees Missing Documents</h3>
          <div class="modal-actions">
            <button class="modal-action-btn" @click="printModal('missingDocs')">
              🖨️ Print
            </button>
            <button
              class="modal-action-btn"
              @click="saveModalAsCSV('missingDocs')"
            >
              💾 Save as CSV
            </button>
            <button class="modal-action-btn" @click="closeMissingDocsModal">
              ✕
            </button>
          </div>
        </div>
        <div class="modal-body" id="missing-docs-modal-content">
          <div class="modal-filter">
            <input
              type="text"
              v-model="missingDocsFilter"
              placeholder="Filter by employee or department..."
              class="filter-input"
            />
          </div>
          <table class="modal-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Missing Documents</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in filteredMissingDocs" :key="emp.id">
                <td @click="viewEmployee(emp.id)" style="cursor: pointer">
                  {{ emp.fullName }}
                </td>
                <td @click="viewEmployee(emp.id)" style="cursor: pointer">
                  {{ emp.department }}
                </td>
                <td class="missing-list">{{ emp.missingList }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeMissingDocsModal">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Hiring & Termination Details Modal -->
    <div
      v-if="showHiringDetailsModal"
      class="modal-overlay"
      @click="closeHiringDetailsModal"
    >
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <div>
            <h3>Hiring & Termination Details</h3>
            <div class="modal-subtitle">
              <span v-if="hiringFilters.departmentId !== 'all'"
                >{{ getDepartmentName(hiringFilters.departmentId) }} •
              </span>
              {{ getTimeRangeLabel(hiringFilters.timeRange) }}
            </div>
          </div>
          <div class="modal-actions">
            <button
              class="modal-action-btn"
              @click="printModal('hiringDetails')"
            >
              🖨️ Print
            </button>
            <button
              class="modal-action-btn"
              @click="saveModalAsCSV('hiringDetails')"
            >
              💾 Save as CSV
            </button>
            <button class="modal-action-btn" @click="closeHiringDetailsModal">
              ✕
            </button>
          </div>
        </div>
        <div class="modal-body" id="hiring-details-modal-content">
          <div class="modal-tabs">
            <button
              :class="['tab-btn', { active: activeHiringTab === 'hired' }]"
              @click="activeHiringTab = 'hired'"
            >
              🎉 Hired Employees ({{ hiredEmployeesList.length }})
            </button>
            <button
              :class="['tab-btn', { active: activeHiringTab === 'terminated' }]"
              @click="activeHiringTab = 'terminated'"
            >
              ⚠️ Terminated Employees ({{ terminatedEmployeesList.length }})
            </button>
            <button
              :class="['tab-btn', { active: activeHiringTab === 'comparison' }]"
              @click="activeHiringTab = 'comparison'"
            >
              📊 Monthly Comparison
            </button>
          </div>
          <div v-show="activeHiringTab === 'hired'" class="tab-content">
            <div class="modal-filter">
              <input
                type="text"
                v-model="hiredFilter"
                placeholder="Filter by name, department, position, or email..."
                class="filter-input"
              />
              <div class="filter-stats">
                Showing {{ filteredHiredEmployees.length }} of
                {{ hiredEmployeesList.length }} employees
              </div>
            </div>
            <div class="modal-table-wrapper">
              <table class="modal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Hire Date</th>
                    <th>Email</th>
                    <th>Salary (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, index) in filteredHiredEmployees"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td>{{ index + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span>{{ emp.full_name }}</span>
                      </div>
                    </td>
                    <td>{{ emp.department }}</td>
                    <td>{{ emp.position }}</td>
                    <td>{{ formatDate(emp.hiredate) }}</td>
                    <td>{{ emp.email }}</td>
                    <td>{{ formatNumber(emp.salary) }}</td>
                  </tr>
                  <tr v-if="filteredHiredEmployees.length === 0">
                    <td colspan="7" class="no-data-cell">
                      No hired employees found in this period
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-show="activeHiringTab === 'terminated'" class="tab-content">
            <div class="modal-filter">
              <input
                type="text"
                v-model="terminatedFilter"
                placeholder="Filter by name, department, position, or email..."
                class="filter-input"
              />
              <div class="filter-stats">
                Showing {{ filteredTerminatedEmployees.length }} of
                {{ terminatedEmployeesList.length }} employees
              </div>
            </div>
            <div class="modal-table-wrapper">
              <table class="modal-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Termination Date</th>
                    <th>Email</th>
                    <th>Last Salary (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(emp, index) in filteredTerminatedEmployees"
                    :key="emp.id"
                    @click="viewEmployee(emp.id)"
                    style="cursor: pointer"
                  >
                    <td>{{ index + 1 }}</td>
                    <td>
                      <div class="employee-cell">
                        <span>{{ emp.full_name }}</span>
                      </div>
                    </td>
                    <td>{{ emp.department }}</td>
                    <td>{{ emp.position }}</td>
                    <td>{{ formatDate(emp.terminationdate) }}</td>
                    <td>{{ emp.email }}</td>
                    <td>{{ formatNumber(emp.salary) }}</td>
                  </tr>
                  <tr v-if="filteredTerminatedEmployees.length === 0">
                    <td colspan="7" class="no-data-cell">
                      No terminated employees found in this period
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-show="activeHiringTab === 'comparison'" class="tab-content">
            <div class="comparison-grid">
              <div class="comparison-summary">
                <div class="summary-card">
                  <div class="summary-icon">📈</div>
                  <div class="summary-info">
                    <span class="summary-label">Total Hired</span
                    ><span class="summary-value">{{
                      hiringStats.totalHired
                    }}</span>
                  </div>
                </div>
                <div class="summary-card">
                  <div class="summary-icon">📉</div>
                  <div class="summary-info">
                    <span class="summary-label">Total Terminated</span
                    ><span class="summary-value">{{
                      hiringStats.totalTerminated
                    }}</span>
                  </div>
                </div>
                <div class="summary-card">
                  <div class="summary-icon">📊</div>
                  <div class="summary-info">
                    <span class="summary-label">Net Growth</span
                    ><span
                      class="summary-value"
                      :class="
                        hiringStats.netGrowth >= 0 ? 'positive' : 'negative'
                      "
                      >{{ hiringStats.netGrowth >= 0 ? "+" : ""
                      }}{{ hiringStats.netGrowth }}</span
                    >
                  </div>
                </div>
              </div>
              <div class="monthly-table-wrapper">
                <table class="modal-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Hired</th>
                      <th>Terminated</th>
                      <th>Net Change</th>
                      <th>Turnover Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="month in hiringChartData" :key="month.month">
                      <td>
                        <strong>{{ formatMonth(month.month) }}</strong>
                      </td>
                      <td class="hired-count">{{ month.hired }}</td>
                      <td class="terminated-count">{{ month.terminated }}</td>
                      <td
                        :class="month.netChange >= 0 ? 'positive' : 'negative'"
                      >
                        {{ month.netChange >= 0 ? "+" : ""
                        }}{{ month.netChange }}
                      </td>
                      <td>
                        <span
                          class="turnover-badge"
                          :class="getTurnoverClass(month)"
                          >{{ calculateTurnoverRate(month) }}%</span
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeHiringDetailsModal">
            Close
          </button>
        </div>
      </div>
    </div>
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
const recentHireDaysParam = ref(90);

// Modal states
const showDepartmentModal = ref(false);
const showSalaryModal = ref(false);
const showEmploymentTypeModal = ref(false);
const showRecentHiresModal = ref(false);
const showMissingDocsModal = ref(false);
const showHiringDetailsModal = ref(false);
const activeHiringTab = ref("hired");

// Filter values for modals
const departmentFilter = ref("");
const employmentTypeFilter = ref("");
const recentHiresFilter = ref("");
const missingDocsFilter = ref("");
const hiredFilter = ref("");
const terminatedFilter = ref("");

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
const recentHires = ref([]);
const employeesWithMissingDocs = ref([]);
const employeesByDepartment = ref({});
const employeesByType = ref({});
const highestPaid = ref([]);
const salaryByDepartment = ref([]);
const hiredEmployeesList = ref([]);
const terminatedEmployeesList = ref([]);

// Chart data
const hiringChartData = ref([]);
const salaryChartData = ref([]);
const hiringStats = ref({ totalHired: 0, totalTerminated: 0, netGrowth: 0 });
const salaryStats = ref({ avgSalary: 0, highestDept: "-", totalPool: 0 });
const docComplianceRate = ref(0);

// Document Compliance Data
const idCardData = ref({ submitted: [], missing: [] });
const cvData = ref({ submitted: [], missing: [] });
const degreeData = ref({ submitted: [], missing: [] });
const guaranteeData = ref({
  all: [],
  missing: [],
  needSecond: [],
  withTwo: [],
});
const activeTab = ref("id_card");

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

// Employment Type Pagination
const employmentTypeFilterParam = ref("all");
const employmentTypeSearchFilter = ref("");
const employmentTypePagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});
const paginatedEmploymentTypeEmployees = ref([]);

// Salary Pagination
const salaryRangeFilter = ref("all");
const salaryDistributionData = ref([]);
const salaryPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});
const paginatedHighestPaid = ref([]);

// Department Pagination
const departmentFilterParam = ref("all");
const departmentSearchFilter = ref("");
const departmentPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
});
const paginatedDepartmentEmployees = ref([]);

// Computed properties for guarantee counts
const guaranteeMissingCount = computed(
  () => guaranteeData.value.missing?.length || 0,
);
const guaranteeNeedSecondCount = computed(
  () => guaranteeData.value.needSecond?.length || 0,
);
const guaranteeWithTwoCount = computed(
  () => guaranteeData.value.withTwo?.length || 0,
);
const guaranteeTotalCount = computed(
  () => guaranteeData.value.all?.length || 0,
);

// Computed
const filteredHiredEmployees = computed(() => {
  if (!hiredFilter.value) return hiredEmployeesList.value;
  const filter = hiredFilter.value.toLowerCase();
  return hiredEmployeesList.value.filter(
    (emp) =>
      (emp.full_name || "").toLowerCase().includes(filter) ||
      (emp.department || "").toLowerCase().includes(filter) ||
      (emp.position || "").toLowerCase().includes(filter) ||
      (emp.email || "").toLowerCase().includes(filter),
  );
});

const filteredTerminatedEmployees = computed(() => {
  if (!terminatedFilter.value) return terminatedEmployeesList.value;
  const filter = terminatedFilter.value.toLowerCase();
  return terminatedEmployeesList.value.filter(
    (emp) =>
      (emp.full_name || "").toLowerCase().includes(filter) ||
      (emp.department || "").toLowerCase().includes(filter) ||
      (emp.position || "").toLowerCase().includes(filter) ||
      (emp.email || "").toLowerCase().includes(filter),
  );
});

const filteredRecentHires = computed(() =>
  recentHires.value.filter(
    (hire) =>
      hire.fullName
        .toLowerCase()
        .includes(recentHiresFilter.value.toLowerCase()) ||
      hire.department
        ?.toLowerCase()
        .includes(recentHiresFilter.value.toLowerCase()) ||
      hire.position
        ?.toLowerCase()
        .includes(recentHiresFilter.value.toLowerCase()),
  ),
);

const filteredMissingDocs = computed(() =>
  employeesWithMissingDocs.value.filter(
    (emp) =>
      emp.fullName
        .toLowerCase()
        .includes(missingDocsFilter.value.toLowerCase()) ||
      emp.department
        .toLowerCase()
        .includes(missingDocsFilter.value.toLowerCase()),
  ),
);

const flattenedDepartmentEmployees = computed(() => {
  const result = [];
  Object.entries(employeesByDepartment.value).forEach(
    ([deptName, employees]) => {
      employees.forEach((emp) => {
        if (
          emp.fullName
            .toLowerCase()
            .includes(departmentFilter.value.toLowerCase()) ||
          deptName.toLowerCase().includes(departmentFilter.value.toLowerCase())
        ) {
          result.push({ ...emp, department: deptName });
        }
      });
    },
  );
  return result;
});

const flattenedEmploymentTypeEmployees = computed(() => {
  const result = [];
  Object.entries(employeesByType.value).forEach(([typeName, employees]) => {
    employees.forEach((emp) => {
      if (
        emp.fullName
          .toLowerCase()
          .includes(employmentTypeFilter.value.toLowerCase())
      ) {
        result.push({ ...emp, type: typeName });
      }
    });
  });
  return result;
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
    count: guaranteeMissingCount.value,
    status: guaranteeMissingCount.value > 0 ? "critical" : "success",
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

// Helper Functions
const formatNumber = (num) => (!num ? "0" : num.toLocaleString());
const formatDate = (date) =>
  !date ? "N/A" : new Date(date).toLocaleDateString();
const getInitials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
const getDepartmentName = (deptId) =>
  allDepartments.value.find((d) => d.departmentId === parseInt(deptId))
    ?.departmentName || "All Departments";
const getTimeRangeLabel = (range) =>
  ({
    1: "Last 1 Month",
    3: "Last 3 Months",
    6: "Last 6 Months",
    12: "Last 12 Months",
    24: "Last 24 Months",
    36: "Last 36 Months",
    all: "All Time",
  })[range] || "All Time";
const formatMonth = (monthStr) => {
  if (!monthStr) return "N/A";
  const [year, month] = monthStr.split("-");
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
};
const calculateTurnoverRate = (month) => {
  if (!month.hired && !month.terminated) return "0";
  const total = month.hired + month.terminated;
  return total === 0 ? "0" : ((month.terminated / total) * 100).toFixed(1);
};
const getTurnoverClass = (month) => {
  const rate = parseFloat(calculateTurnoverRate(month));
  if (rate > 50) return "critical";
  if (rate > 30) return "warning";
  return "normal";
};
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
const getGuaranteeCountClass = (count) => {
  if (count === 0) return "count-critical";
  if (count === 1) return "count-warning";
  return "count-success";
};
const getGuaranteeStatusClass = (emp) =>
  ({
    no_guarantee: "status-critical",
    need_second: "status-warning",
    expired: "status-critical",
    expiring_soon: "status-warning",
    compliant: "status-ok",
  })[emp.status] || "status-ok";
const getGuaranteeStatusLabel = (emp) =>
  ({
    no_guarantee: "⚠️ No Guarantee",
    need_second: "🟡 Need 1 more",
    expired: "🔴 Expired",
    expiring_soon: "🟠 Expiring Soon",
    compliant: "✅ Compliant",
  })[emp.status] || emp.status;

// Debounced search functions
const debouncedIdCardSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadIdCardData();
  }, 500);
};
const debouncedCvSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadCvData();
  }, 500);
};
const debouncedDegreeSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadDegreeData();
  }, 500);
};
const debouncedGuaranteeSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyGuaranteeFilters();
  }, 500);
};

// View Change Functions
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

// Data Loading Functions
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
      highestPaid.value = result.data.highestPaid || [];
      salaryByDepartment.value = result.data.byDepartment || [];
      await nextTick();
      setTimeout(() => initSalaryChart(), 100);
    }
  } catch (error) {
    console.error("Error loading salary analysis:", error);
  }
};
const loadDepartmentEmployees = async () => {
  try {
    const response = await employeeService.getDepartmentDistributionPaginated({
      page: departmentPagination.value.page,
      limit: 20,
      departmentId: departmentFilterParam.value,
      search: departmentSearchFilter.value,
    });
    if (response.success && response.data) {
      paginatedDepartmentEmployees.value = [];
      Object.values(response.data.employeesByDepartment || {}).forEach(
        (employees) => paginatedDepartmentEmployees.value.push(...employees),
      );
      departmentPagination.value = response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false,
      };
    }
  } catch (error) {
    console.error("Error loading department employees:", error);
  }
};
const loadEmploymentTypeEmployees = async () => {
  try {
    const response =
      await employeeService.getEmploymentTypeDistributionPaginated({
        page: employmentTypePagination.value.page,
        limit: 20,
        employmentTypeFilter: employmentTypeFilterParam.value,
        search: employmentTypeSearchFilter.value,
      });
    if (response.success && response.data) {
      employmentTypes.value = response.data.types || [];
      paginatedEmploymentTypeEmployees.value = [];
      Object.entries(response.data.employeesByType || {}).forEach(
        ([type, employees]) =>
          employees.forEach((emp) =>
            paginatedEmploymentTypeEmployees.value.push({ ...emp, type }),
          ),
      );
      employmentTypePagination.value = response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false,
      };
    }
  } catch (error) {
    console.error("Error loading employment type employees:", error);
  }
};
const loadSalaryAnalysisWithPagination = async () => {
  try {
    const response = await employeeService.getSalaryAnalysisPaginated({
      page: salaryPagination.value.page,
      limit: 20,
      salaryRange: salaryRangeFilter.value,
    });
    if (response.success && response.data) {
      salaryByDepartment.value = response.data.byDepartment || [];
      paginatedHighestPaid.value = response.data.highestPaid || [];
      salaryPagination.value = response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false,
      };
      salaryStats.value = {
        avgSalary: response.data.overview?.avg_salary || 0,
        highestDept: response.data.byDepartment?.[0]?.department_name || "-",
        totalPool: response.data.overview?.total_salary_pool || 0,
      };
      salaryChartData.value = response.data.distribution || [];
      await nextTick();
      setTimeout(() => initSalaryChart(), 100);
    }
  } catch (error) {
    console.error("Error loading salary analysis:", error);
  }
};
const loadHiringDetails = async () => {
  try {
    const result = await employeeService.getHiringDetails({
      departmentId:
        hiringFilters.departmentId === "all"
          ? null
          : hiringFilters.departmentId,
      months:
        hiringFilters.timeRange === "all" ? "all" : hiringFilters.timeRange,
    });
    if (result?.data?.hired) {
      hiredEmployeesList.value = result.data.hired || [];
      terminatedEmployeesList.value = result.data.terminated || [];
    } else if (result?.data?.data?.hired) {
      hiredEmployeesList.value = result.data.data.hired || [];
      terminatedEmployeesList.value = result.data.data.terminated || [];
    }
  } catch (error) {
    console.error("Error loading hiring details:", error);
    hiredEmployeesList.value = [];
    terminatedEmployeesList.value = [];
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
  recentHireDaysParam.value = 90;
  loadAllData();
};

// Chart Functions
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

// Print Compliance Tab - With clean layout for printing
const printComplianceTab = () => {
  let printContent = null;
  let title = "";
  let tableId = "";

  switch (activeTab.value) {
    case "id_card":
      tableId =
        idCardView.value === "missing"
          ? "id-card-missing-table"
          : "id-card-submitted-table";
      title =
        idCardView.value === "missing"
          ? "Employees Missing ID Cards"
          : "Employees Who Submitted ID Cards";
      break;
    case "cv":
      tableId =
        cvView.value === "missing" ? "cv-missing-table" : "cv-submitted-table";
      title =
        cvView.value === "missing"
          ? "Employees Missing CV/Resume"
          : "Employees Who Submitted CV/Resume";
      break;
    case "degree":
      tableId =
        degreeView.value === "missing"
          ? "degree-missing-table"
          : "degree-submitted-table";
      title =
        degreeView.value === "missing"
          ? "Employees Missing Degree/Certificate"
          : "Employees Who Submitted Degree/Certificate";
      break;
    case "guarantee_letter":
      tableId = "guarantee-table";
      title = "Guarantee Letter Status";
      break;
  }

  printContent = document.getElementById(tableId);
  if (!printContent) return;

  // Clone the table to avoid modifying the original
  const clonedTable = printContent.cloneNode(true);

  // Remove action buttons from the cloned table for printing
  const actionCells = clonedTable.querySelectorAll(
    ".btn-remind, .btn-outline, .btn-warning, .compliant-badge-modern",
  );
  actionCells.forEach((cell) => {
    const parentTd = cell.closest("td");
    if (parentTd) parentTd.remove();
  });

  // Remove the entire Action column header
  const headers = clonedTable.querySelectorAll("th");
  headers.forEach((header) => {
    if (
      header.textContent === "Action" ||
      header.textContent.includes("Action")
    ) {
      header.remove();
    }
  });

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - HR Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          .print-header { margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 15px; }
          .print-header h1 { color: #1e293b; margin: 0 0 5px 0; font-size: 24px; }
          .print-header .subtitle { color: #64748b; font-size: 12px; margin: 0; }
          .print-info { color: #64748b; margin-bottom: 20px; font-size: 12px; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .print-info span { margin-right: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f2f2f2; font-weight: bold; }
          .employee-cell { display: flex; align-items: center; gap: 8px; }
          .employee-name { font-weight: 500; }
          .dept-badge { background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .age-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; }
          .guarantee-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #ddd; padding-top: 15px; }
          @media print {
            body { print-color-adjust: exact; }
            .no-break { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${title}</h1>
          <p class="subtitle">HR Intelligence Platform - Document Compliance Report</p>
        </div>
        <div class="print-info">
          <span>Department: ${complianceFilters.departmentId !== "all" ? getDepartmentName(complianceFilters.departmentId) : "All Departments"}</span>
          <span>Generated: ${new Date().toLocaleString()}</span>
        </div>
        ${clonedTable.outerHTML}
        <div class="footer">
          This is a system-generated report. For any discrepancies, please contact HR department.
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

// Modal Functions
const openHiringDetailsModal = async () => {
  showHiringDetailsModal.value = true;
  activeHiringTab.value = "hired";
  hiredFilter.value = "";
  terminatedFilter.value = "";
  await loadHiringDetails();
};
const closeHiringDetailsModal = () => {
  showHiringDetailsModal.value = false;
};
const openDepartmentModal = () => {
  showDepartmentModal.value = true;
  departmentFilterParam.value = "all";
  departmentSearchFilter.value = "";
  departmentPagination.value.page = 1;
  loadDepartmentEmployees();
};
const closeDepartmentModal = () => {
  showDepartmentModal.value = false;
};
const openSalaryModal = () => {
  showSalaryModal.value = true;
  salaryRangeFilter.value = "all";
  salaryPagination.value.page = 1;
  loadSalaryAnalysisWithPagination();
};
const closeSalaryModal = () => {
  showSalaryModal.value = false;
};
const openEmploymentTypeModal = () => {
  showEmploymentTypeModal.value = true;
  employmentTypeFilterParam.value = "all";
  employmentTypeSearchFilter.value = "";
  employmentTypePagination.value.page = 1;
  loadEmploymentTypeEmployees();
};
const closeEmploymentTypeModal = () => {
  showEmploymentTypeModal.value = false;
};
const openRecentHiresModal = () => {
  showRecentHiresModal.value = true;
  recentHiresFilter.value = "";
};
const closeRecentHiresModal = () => {
  showRecentHiresModal.value = false;
};
const openMissingDocsModal = () => {
  showMissingDocsModal.value = true;
  missingDocsFilter.value = "";
};
const closeMissingDocsModal = () => {
  showMissingDocsModal.value = false;
};
const remindEmployee = (employee, docType) => {
  alert(
    `Reminder sent to ${employee.fullName} for ${docType || "missing documents"}`,
  );
};
const requestNewGuarantee = (employee) => {
  alert(
    `Request sent to ${employee.fullName} for ${2 - employee.guaranteeCount} additional guarantee letter(s)`,
  );
};
const viewEmployee = (id) => {
  router.push(`/employees/${id}`);
};

// Pagination Functions
const changeEmploymentTypePage = (page) => {
  if (page >= 1 && page <= employmentTypePagination.value.totalPages) {
    employmentTypePagination.value.page = page;
    loadEmploymentTypeEmployees();
  }
};
const changeSalaryPage = (page) => {
  if (page >= 1 && page <= salaryPagination.value.totalPages) {
    salaryPagination.value.page = page;
    loadSalaryAnalysisWithPagination();
  }
};

// Print Modal Function
const printModal = (modalType) => {
  const elementId = {
    department: "department-modal-content",
    salary: "salary-modal-content",
    employmentType: "employment-type-modal-content",
    recentHires: "recent-hires-modal-content",
    missingDocs: "missing-docs-modal-content",
    hiringDetails: "hiring-details-modal-content",
  }[modalType];
  if (!elementId) return;
  const printContent = document.getElementById(elementId);
  if (!printContent) return;
  const printWindow = window.open("", "_blank");
  printWindow.document.write(
    `<!DOCTYPE html><html><head><title>HR Analytics Report</title><style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f2f2f2;}</style></head><body>${printContent.innerHTML}</body></html>`,
  );
  printWindow.document.close();
  printWindow.print();
};

// Save Modal as CSV
const saveModalAsCSV = (modalType) => {
  let csvContent = "",
    filename = "";
  switch (modalType) {
    case "department":
      csvContent =
        "Department,Employee Name,Email\n" +
        flattenedDepartmentEmployees.value
          .map((emp) => `"${emp.department}","${emp.fullName}","${emp.email}"`)
          .join("\n");
      filename = "department_employees";
      break;
    case "salary":
      csvContent =
        "Type,Name,Value\n" +
        highestPaid.value
          .map(
            (emp, i) =>
              `"Highest Paid ${i + 1}","${emp.full_name}","ETB ${formatNumber(emp.basic_salary)}"`,
          )
          .join("\n") +
        "\nDepartment,Employees,Avg Salary,Min Salary,Max Salary\n" +
        salaryByDepartment.value
          .map(
            (dept) =>
              `"${dept.department_name}","${dept.employee_count}","ETB ${formatNumber(dept.avg_salary)}","ETB ${formatNumber(dept.min_salary)}","ETB ${formatNumber(dept.max_salary)}"`,
          )
          .join("\n");
      filename = "salary_details";
      break;
    case "employmentType":
      csvContent =
        "Employment Type,Employee Name,Email\n" +
        flattenedEmploymentTypeEmployees.value
          .map(
            (emp) =>
              `"${getEmploymentTypeLabel(emp.type)}","${emp.fullName}","${emp.email}"`,
          )
          .join("\n");
      filename = "employment_type_employees";
      break;
    case "recentHires":
      csvContent =
        "Employee Name,Department,Position,Hire Date,Days Ago\n" +
        filteredRecentHires.value
          .map(
            (hire) =>
              `"${hire.fullName}","${hire.department}","${hire.position}","${formatDate(hire.hireDate)}","${hire.daysSinceHire} days"`,
          )
          .join("\n");
      filename = "recent_hires";
      break;
    case "missingDocs":
      csvContent =
        "Employee Name,Department,Missing Documents\n" +
        filteredMissingDocs.value
          .map(
            (emp) =>
              `"${emp.fullName}","${emp.department}","${emp.missingList}"`,
          )
          .join("\n");
      filename = "missing_documents";
      break;
    case "hiringDetails":
      if (activeHiringTab.value === "hired") {
        csvContent =
          "Employee Name,Department,Position,Hire Date,Email,Salary (ETB)\n" +
          filteredHiredEmployees.value
            .map(
              (emp) =>
                `"${emp.full_name}","${emp.department}","${emp.position}","${formatDate(emp.hiredate)}","${emp.email}","${formatNumber(emp.salary)}"`,
            )
            .join("\n");
        filename = `hired_employees_${new Date().toISOString().split("T")[0]}`;
      } else if (activeHiringTab.value === "terminated") {
        csvContent =
          "Employee Name,Department,Position,Termination Date,Email,Last Salary (ETB)\n" +
          filteredTerminatedEmployees.value
            .map(
              (emp) =>
                `"${emp.full_name}","${emp.department}","${emp.position}","${formatDate(emp.terminationdate)}","${emp.email}","${formatNumber(emp.salary)}"`,
            )
            .join("\n");
        filename = `terminated_employees_${new Date().toISOString().split("T")[0]}`;
      } else {
        csvContent =
          "Month,Hired,Terminated,Net Change,Turnover Rate (%)\n" +
          hiringChartData.value
            .map(
              (month) =>
                `"${formatMonth(month.month)}",${month.hired},${month.terminated},${month.netChange},${calculateTurnoverRate(month)}`,
            )
            .join("\n");
        filename = `monthly_comparison_${new Date().toISOString().split("T")[0]}`;
      }
      break;
  }
  if (!csvContent) return;
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Watchers
watch(
  () => hiringFilters.departmentId,
  () => loadHiringTrends(),
);
watch(
  () => hiringFilters.timeRange,
  () => loadHiringTrends(),
);
watch(
  () => complianceFilters.departmentId,
  () => loadDocumentCompliance(),
);
watch(idCardAgeFilter, () => {
  if (idCardView.value === "submitted") loadIdCardData();
});
watch(cvAgeFilter, () => {
  if (cvView.value === "submitted") loadCvData();
});
watch(degreeAgeFilter, () => {
  if (degreeView.value === "submitted") loadDegreeData();
});
watch(guaranteeAgeFilter, () => applyGuaranteeFilters());
watch(idCardSearch, () => debouncedIdCardSearch());
watch(cvSearch, () => debouncedCvSearch());
watch(degreeSearch, () => debouncedDegreeSearch());
watch(guaranteeSearch, () => debouncedGuaranteeSearch());

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

onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
/* ========== DOCUMENT COMPLIANCE SECTION - LARGER FONT SIZES ========== */

/* Global compliance section font reset */
.compliance-section,
.compliance-section * {
  font-size-adjust: none;
}

/* Tabs */
.compliance-section .tab-name {
  font-size: 15px !important;
  font-weight: 600 !important;
}

.compliance-section .tab-badge {
  font-size: 13px !important;
  padding: 2px 10px !important;
}

/* All table headers */
.compliance-section .data-table th {
  font-size: 13px !important;
  font-weight: 600 !important;
  padding: 12px 12px !important;
}

/* All table cells */
.compliance-section .data-table td {
  font-size: 13px !important;
  padding: 12px 12px !important;
}

/* Employee name */
.compliance-section .employee-name {
  font-size: 13px !important;
  font-weight: 500 !important;
}

/* Department badge */
.compliance-section .dept-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

/* Age badge */
.compliance-section .age-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

/* Status badge */
.compliance-section .status-badge-modern {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

/* Guarantee badge */
.compliance-section .guarantee-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

/* Compliant badge */
.compliance-section .compliant-badge-modern {
  font-size: 13px !important;
}

/* All buttons */
.compliance-section .btn-remind,
.compliance-section .btn-outline,
.compliance-section .btn-warning {
  font-size: 12px !important;
  padding: 5px 14px !important;
}

/* Toggle switch buttons */
.compliance-section .toggle-switch-modern button {
  font-size: 13px !important;
  padding: 6px 16px !important;
}

.compliance-section .toggle-count {
  font-size: 12px !important;
  padding: 1px 6px !important;
}

/* Filter inputs */
.compliance-section .filter-input-modern {
  font-size: 13px !important;
  padding: 8px 16px !important;
}

.compliance-section .filter-select-modern {
  font-size: 13px !important;
  padding: 8px 16px !important;
}

.compliance-section .filter-select-modern.small {
  font-size: 13px !important;
  padding: 6px 12px !important;
}

/* Filter labels */
.compliance-section .filter-group-modern label {
  font-size: 13px !important;
}

/* Table headers */
.compliance-section .table-header h4 {
  font-size: 15px !important;
}

.compliance-section .table-stats {
  font-size: 12px !important;
  padding: 4px 12px !important;
}

/* Guarantee filter buttons */
.compliance-section .guarantee-filters-modern button {
  font-size: 13px !important;
  padding: 6px 14px !important;
}

.compliance-section .dot {
  width: 8px !important;
  height: 8px !important;
}

/* Empty state */
.compliance-section .empty-state {
  font-size: 14px !important;
  padding: 40px !important;
}

/* Pagination */
.compliance-section .pagination-btn-modern {
  font-size: 13px !important;
  padding: 7px 16px !important;
}

.compliance-section .pagination-info-modern {
  font-size: 13px !important;
  padding: 6px 16px !important;
}

/* Section header */
.compliance-section .section-header h2 {
  font-size: 20px !important;
}

.compliance-section .section-header p {
  font-size: 13px !important;
}

/* Compliance ring */
.compliance-section .ring-value {
  font-size: 16px !important;
}

.compliance-section .ring-label {
  font-size: 11px !important;
}

/* Print button */
.print-compliance-btn {
  font-size: 13px !important;
  padding: 8px 16px !important;
}

/* Department filter */
.filter-card {
  padding: 14px 18px !important;
}

.filter-icon {
  font-size: 24px !important;
}

.filter-content label {
  font-size: 12px !important;
}

.filter-select-modern {
  font-size: 13px !important;
  padding: 8px 16px !important;
}
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

/* ========== RECENT HIRES ========== */
.recent-hires-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hire-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.hire-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}
.hire-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}
.hire-info {
  flex: 1;
}
.hire-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: block;
}
.hire-dept {
  font-size: 11px;
  color: #64748b;
}
.hire-date {
  font-size: 11px;
  color: #94a3b8;
}

/* ========== MODERN DOCUMENT COMPLIANCE ========== */
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
.print-compliance-btn {
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
.print-compliance-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
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
.filter-select-modern.small {
  max-width: 150px;
  padding: 8px 12px;
  font-size: 13px;
}

/* Modern Tabs */
.compliance-tabs-modern {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #f8fafc;
  padding: 8px;
  border-radius: 60px;
  border: 1px solid #e2e8f0;
}
.tab-btn-modern {
  flex: 1;
  padding: 12px 8px;
  background: transparent;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.tab-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 500;
}
.tab-name {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}
.tab-badge {
  padding: 2px 10px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
}
.tab-badge.success {
  background: #10b98115;
  color: #10b981;
}
.tab-badge.warning {
  background: #f59e0b15;
  color: #f59e0b;
}
.tab-badge.critical {
  background: #ef444415;
  color: #ef4444;
}
.tab-btn-modern.active {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.tab-btn-modern.active .tab-name {
  color: #6366f1;
}

/* Panel Filters */
.panel-filters-modern {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 16px;
}
.filter-group-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-group-modern label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.search-group {
  flex: 1;
  min-width: 250px;
}
.filter-input-modern {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 40px;
  font-size: 13px;
  transition: all 0.2s;
}
.filter-input-modern:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px #6366f120;
}

/* Toggle Switch */
.toggle-switch-modern {
  display: flex;
  background: white;
  border-radius: 40px;
  padding: 4px;
  gap: 4px;
  border: 1px solid #e2e8f0;
}
.toggle-switch-modern button {
  padding: 8px 20px;
  border: none;
  border-radius: 30px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.toggle-switch-modern button.active {
  background: #6366f1;
  color: white;
}
.toggle-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.toggle-switch-modern button.active .toggle-count {
  background: rgba(255, 255, 255, 0.2);
}

/* Guarantee Filters */
.guarantee-filters-modern {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.guarantee-filters-modern button {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 40px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.guarantee-filters-modern button.active {
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
.dot.red {
  background: #ef4444;
}
.dot.orange {
  background: #f59e0b;
}
.dot.green {
  background: #10b981;
}
.dot.blue {
  background: #6366f1;
}

/* Tables */
.employees-table-modern {
  margin-top: 8px;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}
.table-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.table-stats {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
}
.table-wrapper {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.data-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.data-table tbody tr:hover {
  background: #f8fafc;
}
.text-center {
  text-align: center;
}

/* Badges */
.employee-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}
.employee-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.employee-name {
  font-weight: 500;
  color: #1e293b;
}
.dept-badge {
  background: #e2e8f0;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
}
.age-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.age-badge.age-ok {
  background: #10b98115;
  color: #10b981;
}
.age-badge.age-attention {
  background: #3b82f615;
  color: #3b82f6;
}
.age-badge.age-warning {
  background: #f59e0b15;
  color: #f59e0b;
}
.age-badge.age-critical {
  background: #ef444415;
  color: #ef4444;
  font-weight: 600;
}
.status-badge-modern {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge-modern.status-ok {
  background: #10b98115;
  color: #10b981;
}
.status-badge-modern.status-attention {
  background: #3b82f615;
  color: #3b82f6;
}
.status-badge-modern.status-warning {
  background: #f59e0b15;
  color: #f59e0b;
}
.status-badge-modern.status-critical {
  background: #ef444415;
  color: #ef4444;
}
.guarantee-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.guarantee-badge.count-success {
  background: #10b98115;
  color: #10b981;
}
.guarantee-badge.count-warning {
  background: #f59e0b15;
  color: #f59e0b;
}
.guarantee-badge.count-critical {
  background: #ef444415;
  color: #ef4444;
}
.compliant-badge-modern {
  color: #10b981;
  font-size: 13px;
  font-weight: 500;
}

/* Buttons */
.btn-remind {
  padding: 6px 14px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-remind:hover {
  background: #dc2626;
  transform: translateY(-1px);
}
.btn-outline {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #6366f1;
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.btn-warning {
  padding: 6px 14px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-warning:hover {
  background: #d97706;
}

/* Pagination */
.pagination-controls-modern {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}
.pagination-btn-modern {
  padding: 8px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #475569;
}
.pagination-btn-modern:hover:not(:disabled) {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}
.pagination-btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-info-modern {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 6px 16px;
  border-radius: 40px;
}
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e9edf2;
}
.pagination-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.pagination-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-info {
  font-size: 12px;
  color: #64748b;
}

/* Modal Styles */
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
}
.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-container.large {
  max-width: 1200px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9edf2;
  background: #fafcfc;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.modal-actions {
  display: flex;
  gap: 8px;
}
.modal-action-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-action-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-filter {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.modal-filter .filter-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.filter-select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  min-width: 150px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e9edf2;
  background: #fafcfc;
}
.modal-table {
  width: 100%;
  border-collapse: collapse;
}
.modal-table th,
.modal-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e9edf2;
}
.modal-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
}
.modal-table td {
  font-size: 13px;
  color: #1e293b;
}
.modal-table-wrapper {
  overflow-x: auto;
  max-height: 450px;
  overflow-y: auto;
}
.btn-secondary {
  padding: 8px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #f8fafc;
}
.empty-state {
  text-align: center;
  padding: 48px !important;
  color: #94a3b8;
  font-size: 14px;
}
.no-data-cell {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}
.filter-stats {
  font-size: 12px;
  color: #64748b;
  margin-left: auto;
}

/* Modal Tabs */
.modal-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 12px;
}
.tab-btn {
  padding: 8px 20px;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}
.tab-btn.active {
  background: #6366f1;
  color: white;
}
.tab-content {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Comparison Summary */
.comparison-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.comparison-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.summary-card {
  flex: 1;
  min-width: 150px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}
.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.summary-icon {
  font-size: 32px;
}
.summary-info {
  flex: 1;
}
.summary-label {
  font-size: 12px;
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}
.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}
.summary-value.positive {
  color: #10b981;
}
.summary-value.negative {
  color: #ef4444;
}
.turnover-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.turnover-badge.normal {
  background: #10b98115;
  color: #10b981;
}
.turnover-badge.warning {
  background: #f59e0b15;
  color: #f59e0b;
}
.turnover-badge.critical {
  background: #ef444415;
  color: #ef4444;
}
.hired-count {
  color: #10b981;
  font-weight: 600;
}
.terminated-count {
  color: #ef4444;
  font-weight: 600;
}
.monthly-table-wrapper {
  overflow-x: auto;
  max-height: 350px;
  overflow-y: auto;
}
.modal-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

/* Responsive */
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
  .compliance-tabs-modern {
    flex-wrap: wrap;
    border-radius: 16px;
    gap: 4px;
  }
  .tab-btn-modern {
    flex: none;
    min-width: calc(50% - 4px);
  }
  .panel-filters-modern {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group-modern {
    justify-content: space-between;
  }
  .search-group {
    width: 100%;
  }
  .guarantee-filters-modern {
    flex-wrap: wrap;
  }
  .data-table th,
  .data-table td {
    padding: 10px 8px;
    font-size: 12px;
  }
  .modal-tabs {
    flex-wrap: wrap;
  }
  .tab-btn {
    flex: 1;
    text-align: center;
    font-size: 12px;
    padding: 8px 12px;
  }
  .comparison-summary {
    flex-direction: column;
  }
  .summary-card {
    width: 100%;
  }
}
</style>
