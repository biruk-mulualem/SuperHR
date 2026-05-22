<template>
  <div class="payroll-page">
    <!-- Header -->
    <div class="payroll-header">
      <div class="header-left">
        <div class="logo-icon">💰</div>
        <div>
          <h1>Payroll managment</h1>
          <p>Complete Payroll Management with Penalty Carry Forward</p>
        </div>
      </div>
      <div class="header-actions">
        <button
          class="btn-primary"
          @click="openProcessModal"
          :disabled="processingState === 'processing'"
        >
          <span
            v-if="processingState === 'processing'"
            class="spinner-small"
          ></span>
          <span v-else>⚡</span>
          {{
            processingState === "processing"
              ? "Processing..."
              : "Process Payroll"
          }}
        </button>
        <button
          class="btn-secondary"
          @click="refreshData"
          :disabled="refreshing"
        >
          <span v-if="refreshing" class="spinner-small"></span>
          <span v-else>🔄</span>
          {{ refreshing ? "Refreshing..." : "Refresh" }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ employees.length }}</div>
        <div class="stat-text">Employees</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ formatCurrency(totalGrossPay) }}</div>
        <div class="stat-text">Gross Pay</div>
      </div>
      <div class="stat-card">
        <div class="stat-number text-orange">
          {{ formatCurrency(totalTax) }}
        </div>
        <div class="stat-text">Tax</div>
      </div>
      <div class="stat-card">
        <div class="stat-number text-blue">
          {{ formatCurrency(totalPension7) }}
        </div>
        <div class="stat-text">Pension 7%</div>
      </div>
      <div class="stat-card">
        <div class="stat-number text-purple">
          {{ formatCurrency(totalPension11) }}
        </div>
        <div class="stat-text">Pension 11%</div>
      </div>
      <div class="stat-card">
        <div class="stat-number text-red">{{ activeHolds }}</div>
        <div class="stat-text">On Hold</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="
          activeTab = tab.id;
          resetPagination();
        "
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- ==================== TAB 1: PAYROLL REPORT ==================== -->
      <div v-if="activeTab === 'payroll'" class="section-card">
        <div class="card-header">
          <h2>Payroll Report - {{ formatMonth(selectedMonth) }}</h2>
          <div class="header-filters">
            <div class="dropdown-card" ref="deptDropdownRef">
              <button
                class="dropdown-trigger"
                @click.stop="showDeptDropdown = !showDeptDropdown"
              >
                <span>🏢</span>
                <span>{{ selectedDeptName || "All Departments" }}</span>
                <span>▼</span>
              </button>
              <div v-if="showDeptDropdown" class="dropdown-menu-card">
                <div class="dropdown-header">Filter by Department</div>
                <div
                  class="dropdown-item"
                  :class="{ active: selectedDept === null }"
                  @click="selectDept(null)"
                >
                  <span>📁</span> All Departments
                  <span class="count">{{ employees.length }}</span>
                </div>
                <div class="dropdown-divider"></div>
                <div
                  v-for="dept in departments"
                  :key="dept"
                  class="dropdown-item"
                  :class="{ active: selectedDept === dept }"
                  @click="selectDept(dept)"
                >
                  <span>🏢</span> {{ dept }}
                  <span class="count">{{ getDeptCount(dept) }}</span>
                </div>
              </div>
            </div>
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                v-model="payrollSearch"
                placeholder="Search employee..."
              />
            </div>
            <button
              class="btn-export"
              @click="openExportModal"
              :disabled="exporting"
            >
              <span v-if="exporting" class="spinner-small"></span>
              <span v-else>📊</span>
              {{ exporting ? "Exporting..." : "Export" }}
            </button>
          </div>
        </div>

        <div class="table-container">
          <table class="payroll-table">
            <thead>
              <tr>
                <th style="width: 35px"></th>
                <th>#</th>
                <th>Employee</th>
                <th>Dept</th>
                <th class="text-right">Basic</th>
                <th class="text-right">Allowances</th>
                <th class="text-right">Gross</th>
                <th class="text-right">Tax</th>
                <th class="text-right">Pension</th>
                <th class="text-right">Net</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(emp, idx) in paginatedPayrollData"
                :key="emp.id"
              >
                <tr
                  :class="{
                    'expanded-row': expandedRow === emp.id,
                    'on-hold-row': emp.isOnHold,
                  }"
                >
                  <td class="text-center">
                    <button class="expand-btn" @click="toggleExpand(emp.id)">
                      {{ expandedRow === emp.id ? "▼" : "▶" }}
                    </button>
                  </td>
                  <td class="text-center">
                    {{
                      (payrollPagination.page - 1) * payrollPagination.limit +
                      idx +
                      1
                    }}
                  </td>
                  <td class="employee-cell">
                    <strong>{{ emp.fullName }}</strong>
                    <div class="employee-code">{{ emp.employeeCode }}</div>
                  </td>
                  <td>{{ emp.department }}</td>
                  <td class="text-right">
                    {{ formatCurrency(emp.basicSalary) }}
                  </td>
                  <td class="text-right">
                    {{ formatCurrency(emp.allowancesTotal) }}
                  </td>
                  <td class="text-right">
                    <strong>{{ formatCurrency(emp.grossPay) }}</strong>
                  </td>
                  <td class="text-right tax">{{ formatCurrency(emp.tax) }}</td>
                  <td class="text-right pension">
                    {{ formatCurrency(emp.pension7) }}
                  </td>
                  <td class="text-right net">
                    {{ formatCurrency(emp.governmentNet) }}
                  </td>
                  <td>
                    <span v-if="emp.isOnHold" class="badge-hold">HOLD</span>
                    <span v-else class="badge-active">Active</span>
                  </td>
                  <td>
                    <button
                      class="icon-btn"
                      @click="editEmployeeDeductions(emp)"
                      title="Edit"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>

                <!-- Expanded Detail Row -->
                <tr v-if="expandedRow === emp.id" class="detail-expand-row">
                  <td colspan="12">
                    <div class="expand-details">
                      <!-- Edit Section -->
                      <div class="edit-section">
                        <div class="edit-header">
                          <h4>Edit Payroll - {{ emp.fullName }}</h4>
                          <div
                            class="compensation-toggle"
                            @click="toggleCompensationHistory(emp.id)"
                          >
                            <span>📈</span> Compensation Changes
                          </div>
                        </div>
                        <div class="edit-fields">
                          <div class="field">
                            <label>Basic Salary</label
                            ><input
                              type="number"
                              v-model="emp.basicSalary"
                              @blur="
                                updateEmployeePayroll(
                                  emp,
                                  'Basic Salary',
                                  emp.basicSalary,
                                )
                              "
                            />
                          </div>
                          <div class="field">
                            <label>Housing (20%)</label
                            ><input
                              type="number"
                              v-model="emp.housingAllowance"
                              @blur="
                                updateEmployeePayroll(
                                  emp,
                                  'Housing Allowance',
                                  emp.housingAllowance,
                                )
                              "
                            />
                          </div>
                          <div class="field">
                            <label>Transport (10%)</label
                            ><input
                              type="number"
                              v-model="emp.transportAllowance"
                              @blur="
                                updateEmployeePayroll(
                                  emp,
                                  'Transport Allowance',
                                  emp.transportAllowance,
                                )
                              "
                            />
                          </div>
                          <div class="field">
                            <label>Position (15%)</label
                            ><input
                              type="number"
                              v-model="emp.positionAllowance"
                              @blur="
                                updateEmployeePayroll(
                                  emp,
                                  'Position Allowance',
                                  emp.positionAllowance,
                                )
                              "
                            />
                          </div>
                        </div>

                        <!-- Compensation History -->
                        <div
                          v-if="showCompHistoryId === emp.id"
                          class="compensation-history"
                        >
                          <h5>Compensation Change History</h5>
                          <div class="history-list">
                            <div
                              v-for="change in getEmployeeHistory(emp.id)"
                              :key="change.id"
                              class="history-entry"
                            >
                              <div class="history-date">
                                {{ formatDate(change.changeDate) }}
                              </div>
                              <div class="history-component">
                                {{ change.component }}
                              </div>
                              <div class="history-values">
                                <span class="old-value">{{
                                  formatCurrency(change.oldValue)
                                }}</span>
                                <span class="arrow">→</span>
                                <span class="new-value">{{
                                  formatCurrency(change.newValue)
                                }}</span>
                              </div>
                              <div
                                :class="
                                  change.changeType === 'increase'
                                    ? 'text-green'
                                    : 'text-red'
                                "
                                class="history-change"
                              >
                                {{
                                  change.changeType === "increase" ? "↑" : "↓"
                                }}
                                {{ change.percentageChange }}%
                                {{
                                  change.changeType === "increase"
                                    ? "increase"
                                    : "decrease"
                                }}
                              </div>
                              <div class="history-submitted">
                                By: {{ change.submittedBy }}
                              </div>
                            </div>
                            <div
                              v-if="getEmployeeHistory(emp.id).length === 0"
                              class="history-empty"
                            >
                              No compensation changes recorded.
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Detail Layout: 2 cards side by side, then final net full width -->
                      <div class="detail-container">
                        <!-- First row: 2 cards -->
                        <div class="detail-row-two-cols">
                          <!-- Card 1: Income & Allowances -->
                          <div class="detail-card">
                            <h4>Income & Allowances</h4>
                            <div>
                              <span>Basic Salary</span
                              ><span>{{
                                formatCurrency(emp.basicSalary)
                              }}</span>
                            </div>
                            <div>
                              <span>Housing Allowance</span
                              ><span>{{
                                formatCurrency(emp.housingAllowance)
                              }}</span>
                            </div>
                            <div>
                              <span>Transport Allowance</span
                              ><span>{{
                                formatCurrency(emp.transportAllowance)
                              }}</span>
                            </div>
                            <div>
                              <span>Position Allowance</span
                              ><span>{{
                                formatCurrency(emp.positionAllowance)
                              }}</span>
                            </div>
                            <div>
                              <span>Total Allowances</span
                              ><span>{{
                                formatCurrency(emp.allowancesTotal)
                              }}</span>
                            </div>
                            <div>
                              <span>Overtime Hours</span
                              ><span>{{ emp.overtimeHours || 0 }} hrs</span>
                            </div>
                            <div>
                              <span>Overtime Pay</span
                              ><span>{{
                                formatCurrency(emp.overtimePay)
                              }}</span>
                            </div>
                            <div class="total">
                              <span>Gross Pay</span
                              ><span>{{ formatCurrency(emp.grossPay) }}</span>
                            </div>
                          </div>

                          <!-- Card 2: Penalties -->
                          <div class="detail-card">
                            <h4>Penalties</h4>
                            <div>
                              <span>Absent Days</span
                              ><span class="text-red"
                                >{{ emp.absentDays || 0 }} days</span
                              >
                            </div>
                            <div>
                              <span>Absent Penalty Amount</span
                              ><span class="text-red">{{
                                formatCurrency(emp.absentPenalty || 0)
                              }}</span>
                            </div>
                            <div>
                              <span>Late Minutes</span
                              ><span class="text-red"
                                >{{ emp.lateMinutes || 0 }} min</span
                              >
                            </div>
                            <div>
                              <span>Late Penalty Amount</span
                              ><span class="text-red">{{
                                formatCurrency(emp.latePenalty || 0)
                              }}</span>
                            </div>
                            <div class="total">
                              <span>Total Penalties</span
                              ><span class="text-red">{{
                                formatCurrency(emp.totalPenalties)
                              }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Second row: 2 cards -->
                        <div class="detail-row-two-cols">
                          <!-- Card 3: Tax & Pension -->
                          <div class="detail-card">
                            <h4>Tax & Pension</h4>
                            <div>
                              <span>Tax (PAYE)</span
                              ><span class="text-orange">{{
                                formatCurrency(emp.tax)
                              }}</span>
                            </div>
                            <div>
                              <span>Pension (7% Employee)</span
                              ><span>{{ formatCurrency(emp.pension7) }}</span>
                            </div>
                            <div>
                              <span>Pension (11% Company)</span
                              ><span class="text-purple">{{
                                formatCurrency(emp.pension11)
                              }}</span>
                            </div>
                            <div class="total">
                              <span>Government Net</span
                              ><span class="text-purple">{{
                                formatCurrency(emp.governmentNet)
                              }}</span>
                            </div>
                          </div>

                          <!-- Card 4: Other Deductions -->
                          <div class="detail-card">
                            <h4>Other Deductions</h4>
                            <div
                              v-for="ded in emp.deductions"
                              :key="ded.id"
                              class="deduction-item-detail"
                            >
                              <div class="deduction-name">{{ ded.name }}</div>
                              <div class="deduction-amount text-red">
                                {{
                                  ded.type === "percent" ? ded.value + "%" : ""
                                }}(ETB {{ formatCurrency(ded.amount) }})
                              </div>
                              <div class="deduction-meta">
                                Ref: {{ ded.reference || "N/A" }} | By:
                                {{ ded.submittedBy || "HR" }} | Date:
                                {{ ded.date || formatDate(new Date()) }}
                              </div>
                            </div>
                            <div
                              v-if="!emp.deductions.length"
                              class="no-deductions"
                            >
                              No other deductions
                            </div>
                            <div class="total">
                              <span>Total Other Deductions</span>
                              <span class="text-red">{{
                                formatCurrency(emp.otherDeductionsTotal)
                              }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Third row: Final Net Pay Card - Full Width -->
                        <div class="final-net-card">
                          <h4>Final Net Pay Calculation</h4>
                          <div class="calculation-summary">
                            <div class="calc-row">
                              <span>Government Net</span>
                              <span>{{
                                formatCurrency(emp.governmentNet)
                              }}</span>
                            </div>
                            <div class="calc-row">
                              <span>Total Penalties</span>
                              <span class="text-red"
                                >-
                                {{ formatCurrency(emp.totalPenalties) }}</span
                              >
                            </div>
                            <div class="calc-row">
                              <span>Total Other Deductions</span>
                              <span class="text-red"
                                >-
                                {{
                                  formatCurrency(emp.otherDeductionsTotal)
                                }}</span
                              >
                            </div>
                            <div class="calc-row">
                              <span>Summary (Penalty Reduction)</span>
                              <span class="text-green"
                                >+
                                {{
                                  formatCurrency(emp.penaltySummary || 0)
                                }}</span
                              >
                            </div>

                            <div class="calc-divider"></div>
                            <div class="calc-row final">
                              <span>Final Net Pay</span>
                              <span class="final-amount">{{
                                formatCurrency(emp.finalNetPay)
                              }}</span>
                            </div>
                          </div>
                          <div v-if="emp.isOnHold" class="hold-note">
                            ⏸️ ON HOLD - {{ emp.holdDetails?.reason }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="filteredPayrollData.length === 0">
                <td colspan="12" class="empty-state-cell">
                  <div class="empty-state-content">
                    <div class="empty-icon">📭</div>
                    <p>
                      No payroll data found for {{ formatMonth(selectedMonth) }}
                    </p>
                    <p class="empty-sub">Process payroll to generate data</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="payrollPagination.totalPages > 1">
          <button
            class="page-btn"
            :disabled="payrollPagination.page === 1"
            @click="changePayrollPage(payrollPagination.page - 1)"
          >
            ← Previous
          </button>
          <span class="page-info"
            >Page {{ payrollPagination.page }} of
            {{ payrollPagination.totalPages }}</span
          >
          <button
            class="page-btn"
            :disabled="payrollPagination.page === payrollPagination.totalPages"
            @click="changePayrollPage(payrollPagination.page + 1)"
          >
            Next →
          </button>
          <select
            v-model="payrollPagination.limit"
            @change="changePayrollLimit"
            class="limit-select"
          >
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- ==================== TAB 2: PENALTY SUMMARY ==================== -->
      <div v-if="activeTab === 'penalties'" class="section-card">
        <div class="card-header">
          <h2>Penalty Summary - {{ formatMonth(penaltySelectedMonth) }}</h2>
          <div class="header-filters">
            <button class="btn-primary" @click="openBatchPenaltyModal">
              Batch Reduction
            </button>
            <button
              class="btn-export"
              @click="exportPenaltySummary"
              :disabled="exportingPenalty"
            >
              <span v-if="exportingPenalty" class="spinner-small"></span>
              <span v-else>📊</span>
              {{ exportingPenalty ? "Exporting..." : "Export" }}
            </button>
          </div>
        </div>

        <div class="filters-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              v-model="penaltySearch"
              placeholder="Search employee..."
            />
          </div>
          <select v-model="penaltyDeptFilter" class="filter-select">
            <option value="all">All Departments</option>
            <option v-for="dept in departments" :key="dept" :value="dept">
              {{ dept }}
            </option>
          </select>
          <select
            v-model="penaltySelectedMonth"
            @change="loadPenaltyData"
            class="filter-select"
          >
            <option v-for="m in availableMonths" :key="m" :value="m">
              {{ formatMonth(m) }}
            </option>
          </select>
        </div>

        <div class="table-container">
          <table class="payroll-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Dept</th>
                <th class="text-center">Penalty %</th>
                <th class="text-right">Penalty Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(penalty, idx) in paginatedPenaltiesList"
                :key="penalty.id"
              >
                <td class="text-center">
                  {{
                    (penaltyPagination.page - 1) * penaltyPagination.limit +
                    idx +
                    1
                  }}
                </td>
                <td class="employee-cell">
                  <strong>{{ penalty.employeeName }}</strong>
                  <div class="employee-code">{{ penalty.employeeCode }}</div>
                </td>
                <td class="text-center">{{ penalty.department }}</td>
                <td class="text-center">
                  <strong>{{ penalty.penaltyPercent }}%</strong>
                </td>
                <td class="text-right text-red">
                  <strong>{{ formatCurrency(penalty.penaltyAmount) }}</strong>
                </td>
                <td class="text-center">
                  <button
                    class="btn-small primary"
                    @click="openPenaltyReductionModal(penalty)"
                  >
                    Reduce
                  </button>
                </td>
              </tr>
              <tr v-if="filteredPenaltiesList.length === 0">
                <td colspan="6" class="empty-state-cell">
                  <div class="empty-state-content">
                    <div class="empty-icon">✅</div>
                    <p>
                      No penalties found for
                      {{ formatMonth(penaltySelectedMonth) }}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="filteredPenaltiesList.length > 0">
              <tr class="total-footer">
                <td colspan="4"><strong>Total Summary</strong></td>
                <td class="text-right">
                  <strong>{{ formatCurrency(penaltiesTotalAmount) }}</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="pagination" v-if="penaltyPagination.totalPages > 1">
          <button
            class="page-btn"
            :disabled="penaltyPagination.page === 1"
            @click="changePenaltyPage(penaltyPagination.page - 1)"
          >
            ← Previous
          </button>
          <span class="page-info"
            >Page {{ penaltyPagination.page }} of
            {{ penaltyPagination.totalPages }}</span
          >
          <button
            class="page-btn"
            :disabled="penaltyPagination.page === penaltyPagination.totalPages"
            @click="changePenaltyPage(penaltyPagination.page + 1)"
          >
            Next →
          </button>
          <select
            v-model="penaltyPagination.limit"
            @change="changePenaltyLimit"
            class="limit-select"
          >
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>
      <!-- ==================== TAB 3: PAYMENT QUEUE ==================== -->
      <div v-if="activeTab === 'payment'" class="section-card">
        <div class="card-header">
          <h2>Payment Queue - {{ formatMonth(selectedMonth) }}</h2>
          <div class="header-filters">
            <div class="search-box">
              <input
                type="text"
                v-model="paymentSearch"
                placeholder="Search..."
              />
            </div>
            <select v-model="paymentDeptFilter" class="filter-select">
              <option value="all">All Departments</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            <button
              class="btn-success"
              @click="openBatchPaymentModal"
              :disabled="
                selectedPaymentsList.length === 0 ||
                !isPaymentWindowActive ||
                processingPayment
              "
            >
              <span v-if="processingPayment" class="spinner-small"></span>
              <span v-else>💰</span>
              {{
                processingPayment
                  ? "Processing..."
                  : `Batch Pay (${selectedPaymentsList.length})`
              }}
            </button>
          </div>
        </div>

        <div v-if="paymentSession" class="payment-info-bar">
          <div class="info-group">
            <span>Pay Date:</span
            ><strong>{{ formatDate(paymentSession.payDate) }}</strong>
          </div>
          <div class="info-group">
            <span>Total:</span
            ><strong>{{ formatCurrency(paymentSession.totalAmount) }}</strong>
          </div>
          <div class="info-group">
            <span>Employees:</span
            ><strong>{{ paymentSession.employeeCount }}</strong>
          </div>
          <div class="info-group">
            <span>Status:</span
            ><strong
              :class="isPaymentWindowActive ? 'text-green' : 'text-orange'"
              >{{ isPaymentWindowActive ? "Available" : "Locked" }}</strong
            >
          </div>
        </div>

        <div class="table-container">
          <table class="payroll-table">
            <thead>
              <tr>
                <th style="width: 35px">
                  <input
                    type="checkbox"
                    @change="toggleSelectAllPayments"
                    v-model="selectAllPayment"
                    :disabled="!isPaymentWindowActive"
                  />
                </th>
                <th>#</th>
                <th>Employee</th>
                <th>Dept</th>
                <th class="text-right">Net Pay</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in paginatedPaymentQueue" :key="item.id">
                <td class="text-center">
                  <input
                    type="checkbox"
                    v-model="item.selected"
                    :disabled="!isPaymentWindowActive"
                  />
                </td>
                <td class="text-center">
                  {{
                    (paymentPagination.page - 1) * paymentPagination.limit +
                    idx +
                    1
                  }}
                </td>
                <td class="employee-cell">
                  <strong>{{ item.employeeName }}</strong>
                  <div class="employee-code">{{ item.employeeCode }}</div>
                </td>
                <td>{{ item.department }}</td>
                <td class="text-right net">
                  {{ formatCurrency(item.amount) }}
                </td>
                <td>{{ formatDate(item.dueDate) }}</td>
                <td>
                  <button
                    class="btn-small success"
                    @click="openPaymentMethodModal(item)"
                    :disabled="!isPaymentWindowActive || processingPayment"
                  >
                    Pay Now
                  </button>
                </td>
              </tr>
              <tr v-if="filteredPaymentQueue.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-content">
                    <div class="empty-icon">💸</div>
                    <p>No pending payments. Process payroll first.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="paymentPagination.totalPages > 1">
          <button
            class="page-btn"
            :disabled="paymentPagination.page === 1"
            @click="changePaymentPage(paymentPagination.page - 1)"
          >
            ← Previous
          </button>
          <span class="page-info"
            >Page {{ paymentPagination.page }} of
            {{ paymentPagination.totalPages }}</span
          >
          <button
            class="page-btn"
            :disabled="paymentPagination.page === paymentPagination.totalPages"
            @click="changePaymentPage(paymentPagination.page + 1)"
          >
            Next →
          </button>
          <select
            v-model="paymentPagination.limit"
            @change="changePaymentLimit"
            class="limit-select"
          >
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- ==================== TAB 4: PAYMENT HISTORY ==================== -->
      <div v-if="activeTab === 'history'" class="section-card">
        <div class="card-header">
          <h2>Payment History</h2>
          <div class="header-filters">
            <div class="search-box">
              <input
                type="text"
                v-model="historySearch"
                placeholder="Search..."
              />
            </div>
            <select v-model="historyMonthFilter" class="filter-select">
              <option value="">All Months</option>
              <option v-for="m in availableMonths" :key="m" :value="m">
                {{ formatMonth(m) }}
              </option>
            </select>
            <select v-model="historyDeptFilter" class="filter-select">
              <option value="all">All Departments</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            <button
              class="btn-export"
              @click="exportPaymentHistory"
              :disabled="exportingHistory"
            >
              <span v-if="exportingHistory" class="spinner-small"></span>
              <span v-else>📊</span>
              {{ exportingHistory ? "Exporting..." : "Export" }}
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="payroll-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Month</th>
                <th>Employee</th>
                <th>Dept</th>
                <th class="text-right">Amount</th>
                <th>Method</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in paginatedHistory" :key="payment.id">
                <td>{{ formatDate(payment.paymentDate) }}</td>
                <td>{{ formatMonth(payment.month) }}</td>
                <td class="employee-cell">
                  <strong>{{ payment.employeeName }}</strong>
                  <div class="employee-code">{{ payment.employeeCode }}</div>
                </td>
                <td>{{ payment.department }}</td>
                <td class="text-right net">
                  {{ formatCurrency(payment.amount) }}
                </td>
                <td>
                  <span class="method-badge">{{ payment.method }}</span>
                </td>
                <td class="ref-cell">
                  {{
                    payment.transactionId ||
                    (payment.method === "Cash" ? "Cash Payment" : "-")
                  }}
                </td>
              </tr>
              <tr v-if="filteredHistory.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-content">
                    <div class="empty-icon">📭</div>
                    <p>No payment records found</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="historyPagination.totalPages > 1">
          <button
            class="page-btn"
            :disabled="historyPagination.page === 1"
            @click="changeHistoryPage(historyPagination.page - 1)"
          >
            ← Previous
          </button>
          <span class="page-info"
            >Page {{ historyPagination.page }} of
            {{ historyPagination.totalPages }}</span
          >
          <button
            class="page-btn"
            :disabled="historyPagination.page === historyPagination.totalPages"
            @click="changeHistoryPage(historyPagination.page + 1)"
          >
            Next →
          </button>
          <select
            v-model="historyPagination.limit"
            @change="changeHistoryLimit"
            class="limit-select"
          >
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- ==================== TAB 5: UNCLAIMED ==================== -->
      <div v-if="activeTab === 'unclaimed'" class="section-card">
        <div class="card-header">
          <h2>Unclaimed Salary</h2>
          <div class="header-filters">
            <div class="search-box">
              <input
                type="text"
                v-model="unclaimedSearch"
                placeholder="Search..."
              />
            </div>
            <select v-model="unclaimedMonthFilter" class="filter-select">
              <option value="">All Months</option>
              <option v-for="m in availableMonths" :key="m" :value="m">
                {{ formatMonth(m) }}
              </option>
            </select>
            <select v-model="unclaimedDeptFilter" class="filter-select">
              <option value="all">All Departments</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            <button
              class="btn-export"
              @click="exportUnclaimed"
              :disabled="exportingUnclaimed"
            >
              <span v-if="exportingUnclaimed" class="spinner-small"></span>
              <span v-else>📊</span>
              {{ exportingUnclaimed ? "Exporting..." : "Export" }}
            </button>
          </div>
        </div>
        <div class="stats-mini-row">
          <div class="stat-mini-card">
            <div class="stat-mini-value text-orange">
              {{ unclaimedStats.total }}
            </div>
            <div class="stat-mini-label">Unclaimed Payments</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-value">
              {{ formatCurrency(unclaimedStats.totalAmount) }}
            </div>
            <div class="stat-mini-label">Total Amount</div>
          </div>
          <div class="stat-mini-card">
            <div class="stat-mini-value text-red">
              {{ unclaimedStats.oldestDays }} days
            </div>
            <div class="stat-mini-label">Oldest Unclaimed</div>
          </div>
        </div>
        <div class="table-container">
          <table class="payroll-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dept</th>
                <th>Month</th>
                <th>Due Date</th>
                <th class="text-right">Amount</th>
                <th>Overdue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedUnclaimed" :key="item.id">
                <td class="employee-cell">
                  <strong>{{ item.employeeName }}</strong>
                  <div class="employee-code">{{ item.employeeCode }}</div>
                </td>
                <td>{{ item.department }}</td>
                <td>{{ formatMonth(item.month) }}</td>
                <td>{{ formatDate(item.dueDate) }}</td>
                <td class="text-right net">
                  {{ formatCurrency(item.amount) }}
                </td>
                <td class="text-red">{{ item.daysOverdue }} days</td>
                <td class="text-center">
                  <button
                    class="btn-small success"
                    @click="openPaymentMethodModal(item)"
                    :disabled="processingPayment"
                  >
                    Pay Now
                  </button>
                </td>
              </tr>
              <tr v-if="filteredUnclaimed.length === 0">
                <td colspan="7" class="empty-state-cell">
                  <div class="empty-state-content">
                    <div class="empty-icon">✅</div>
                    <p>No unclaimed salaries</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="unclaimedPagination.totalPages > 1">
          <button
            class="page-btn"
            :disabled="unclaimedPagination.page === 1"
            @click="changeUnclaimedPage(unclaimedPagination.page - 1)"
          >
            ← Previous
          </button>
          <span class="page-info"
            >Page {{ unclaimedPagination.page }} of
            {{ unclaimedPagination.totalPages }}</span
          >
          <button
            class="page-btn"
            :disabled="
              unclaimedPagination.page === unclaimedPagination.totalPages
            "
            @click="changeUnclaimedPage(unclaimedPagination.page + 1)"
          >
            Next →
          </button>
          <select
            v-model="unclaimedPagination.limit"
            @change="changeUnclaimedLimit"
            class="limit-select"
          >
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- ==================== TAB 6: RETURNED ==================== -->
      <div v-if="activeTab === 'returned'" class="section-card">
        <div class="card-header">
          <h2>Returned Salary</h2>
          <div class="header-filters">
            <div class="search-box">
              <input
                type="text"
                v-model="returnedSearch"
                placeholder="Search..."
              />
            </div>
            <select v-model="returnedMonthFilter" class="filter-select">
              <option value="">All Months</option>
              <option v-for="m in availableMonths" :key="m" :value="m">
                {{ formatMonth(m) }}
              </option>
            </select>
            <select v-model="returnedDeptFilter" class="filter-select">
              <option value="all">All Departments</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            <button
              class="btn-export"
              @click="exportReturned"
              :disabled="exportingReturned"
            >
              <span v-if="exportingReturned" class="spinner-small"></span>
              <span v-else>📊</span>
              {{ exportingReturned ? "Exporting..." : "Export" }}
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="payroll-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Dept</th>
                <th>Month</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th class="text-right">Amount</th>
                <th>Days Late</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedReturned" :key="item.id">
                <td class="employee-cell">
                  <strong>{{ item.employeeName }}</strong>
                  <div class="employee-code">{{ item.employeeCode }}</div>
                </td>
                <td>{{ item.department }}</td>
                <td class="text-center">{{ formatMonth(item.month) }}</td>
                <td class="text-center">{{ formatDate(item.dueDate) }}</td>
                <td class="text-center">{{ formatDate(item.returnDate) }}</td>
                <td class="text-right net">
                  {{ formatCurrency(item.amount) }}
                </td>
                <td class="text-red text-center">{{ item.daysLate }} days</td>
                <td class="text-center">
                  <button
                    class="btn-small success"
                    @click="openPaymentMethodModal(item)"
                    :disabled="!canPayReturned(item) || processingPayment"
                  >
                    Pay Now
                  </button>
                </td>
              </tr>
              <tr v-if="filteredReturned.length === 0">
                <td colspan="8" class="empty-state-cell">
                  <div class="empty-state-content">
                    <div class="empty-icon">📭</div>
                    <p>No returned salaries</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" v-if="returnedPagination.totalPages > 1">
          <button
            class="page-btn"
            :disabled="returnedPagination.page === 1"
            @click="changeReturnedPage(returnedPagination.page - 1)"
          >
            ← Previous
          </button>
          <span class="page-info"
            >Page {{ returnedPagination.page }} of
            {{ returnedPagination.totalPages }}</span
          >
          <button
            class="page-btn"
            :disabled="
              returnedPagination.page === returnedPagination.totalPages
            "
            @click="changeReturnedPage(returnedPagination.page + 1)"
          >
            Next →
          </button>
          <select
            v-model="returnedPagination.limit"
            @change="changeReturnedLimit"
            class="limit-select"
          >
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>
    </div>
    <!-- ==================== TAB 7: ON HOLD EMPLOYEES ==================== -->
    <!-- ==================== TAB 7: ON HOLD EMPLOYEES ==================== -->
    <div v-if="activeTab === 'onhold'" class="section-card">
      <div class="card-header">
        <h2>Employees On Hold - {{ formatMonth(onHoldSelectedMonth) }}</h2>
        <div class="header-filters">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              v-model="onHoldSearch"
              placeholder="Search employee..."
            />
          </div>
          <select
            v-model="onHoldSelectedMonth"
            @change="loadOnHoldData"
            class="filter-select"
          >
            <option v-for="m in availableMonths" :key="m" :value="m">
              {{ formatMonth(m) }}
            </option>
          </select>
          <select v-model="onHoldDeptFilter" class="filter-select">
            <option value="all">All Departments</option>
            <option v-for="dept in departments" :key="dept" :value="dept">
              {{ dept }}
            </option>
          </select>
          <button
            class="btn-export"
            @click="exportOnHoldList"
            :disabled="exportingOnHold"
          >
            <span v-if="exportingOnHold" class="spinner-small"></span>
            <span v-else>📊</span>
            {{ exportingOnHold ? "Exporting..." : "Export" }}
          </button>
        </div>
      </div>

      <div class="stats-mini-row">
        <div class="stat-mini-card">
          <div class="stat-mini-value text-red">{{ onHoldStats.total }}</div>
          <div class="stat-mini-label">Employees on Hold</div>
        </div>
        <div class="stat-mini-card">
          <div class="stat-mini-value">
            {{ formatCurrency(onHoldStats.totalAmount) }}
          </div>
          <div class="stat-mini-label">Total Salary on Hold</div>
        </div>
      </div>

      <div class="table-container">
        <table class="payroll-table">
          <thead>
            <tr>
              <th style="width: 35px">
                <input
                  type="checkbox"
                  @change="toggleSelectAllOnHold"
                  v-model="selectAllOnHold"
                />
              </th>
              <th>#</th>
              <th>Employee</th>
              <th>Dept</th>
              <th class="text-right">Net Pay (Locked)</th>
              <th>Hold Reason</th>
              <th>Hold Since</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(emp, idx) in paginatedOnHoldList" :key="emp.id">
              <td class="text-center">
                <input
                  type="checkbox"
                  v-model="emp.selected"
                  @change="updateSelectedOnHoldIds"
                />
              </td>
              <td class="text-center">
                {{
                  (onHoldPagination.page - 1) * onHoldPagination.limit + idx + 1
                }}
              </td>
              <td class="employee-cell">
                <strong>{{ emp.fullName }}</strong>
                <div class="employee-code">{{ emp.employeeCode }}</div>
              </td>
              <td>{{ emp.department }}</td>
              <td class="text-right text-red">
                <strong>{{ formatCurrency(emp.governmentNet) }}</strong>
              </td>
              <td class="text-center">
                {{ emp.holdDetails?.reason || "No reason provided" }}
              </td>
              <td class="text-center">
                {{
                  formatDate(emp.holdDetails?.startDate) ||
                  formatDate(onHoldSelectedMonth)
                }}
              </td>
              <td class="text-center">
                {{ emp.holdDetails?.duration || 1 }} month(s)
              </td>
              <td class="text-center">
                <button
                  class="btn-small warning"
                  @click="openSingleReleaseModal(emp)"
                >
                  Release
                </button>
              </td>
            </tr>
            <tr v-if="filteredOnHoldList.length === 0">
              <td colspan="9" class="empty-state-cell">
                <div class="empty-state-content">
                  <div class="empty-icon">✅</div>
                  <p>
                    No employees on hold for
                    {{ formatMonth(onHoldSelectedMonth) }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Release Button at Bottom - Only shows when items are selected -->
      <div class="bulk-release-container" v-if="selectedOnHoldIds.length > 0">
        <div class="bulk-release-bar">
          <div class="selected-count">
            <span>✓ {{ selectedOnHoldIds.length }} employee(s) selected</span>
          </div>
          <button class="btn-success" @click="openBulkReleaseModal">
            <span>🔓</span> Bulk Release ({{ selectedOnHoldIds.length }})
          </button>
        </div>
      </div>

      <div class="pagination" v-if="onHoldPagination.totalPages > 1">
        <button
          class="page-btn"
          :disabled="onHoldPagination.page === 1"
          @click="changeOnHoldPage(onHoldPagination.page - 1)"
        >
          ← Previous
        </button>
        <span class="page-info"
          >Page {{ onHoldPagination.page }} of
          {{ onHoldPagination.totalPages }}</span
        >
        <button
          class="page-btn"
          :disabled="onHoldPagination.page === onHoldPagination.totalPages"
          @click="changeOnHoldPage(onHoldPagination.page + 1)"
        >
          Next →
        </button>
        <select
          v-model="onHoldPagination.limit"
          @change="changeOnHoldLimit"
          class="limit-select"
        >
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>
      </div>
    </div>

    <!-- ==================== SINGLE RELEASE MODAL ==================== -->
    <div
      v-if="showSingleReleaseModal"
      class="modal-overlay"
      @click.self="showSingleReleaseModal = false"
    >
      <div class="modal-container release-modal">
        <div class="modal-header">
          <h3>Release Hold - {{ selectedReleaseEmployee?.fullName }}</h3>
          <button class="modal-close" @click="showSingleReleaseModal = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="employee-info-card">
            <div class="info-row">
              Employee: <strong>{{ selectedReleaseEmployee?.fullName }}</strong>
            </div>
            <div class="info-row">
              Department:
              <strong>{{ selectedReleaseEmployee?.department }}</strong>
            </div>
            <div class="info-row">
              Net Pay on Hold:
              <strong class="text-red">{{
                formatCurrency(selectedReleaseEmployee?.governmentNet)
              }}</strong>
            </div>
            <div class="info-row">
              Hold Reason:
              <strong>{{
                selectedReleaseEmployee?.holdDetails?.reason || "No reason"
              }}</strong>
            </div>
          </div>

          <div class="form-field">
            <label>Release Type</label>
            <select v-model="releaseType" class="form-select">
              <option value="full">Full Release (Pay all salary)</option>
              <option value="percent">Partial Release - Percentage</option>
              <option value="amount">Partial Release - Fixed Amount</option>
            </select>
          </div>

          <div class="form-field" v-if="releaseType === 'percent'">
            <label>Release Percentage (%)</label>
            <input
              type="number"
              v-model.number="releasePercent"
              class="form-input"
              min="0"
              max="100"
              placeholder="e.g., 50"
            />
            <div class="input-hint">
              This will release {{ releasePercent }}% of the held salary
            </div>
          </div>

          <div class="form-field" v-if="releaseType === 'amount'">
            <label>Release Amount (ETB)</label>
            <input
              type="number"
              v-model.number="releaseAmount"
              class="form-input"
              min="0"
              :max="selectedReleaseEmployee?.governmentNet"
              placeholder="Enter amount to release"
            />
            <div class="input-hint">
              Max: {{ formatCurrency(selectedReleaseEmployee?.governmentNet) }}
            </div>
          </div>

          <div
            class="preview-section"
            v-if="
              releaseType !== 'full' &&
              (releasePercent > 0 || releaseAmount > 0)
            "
          >
            <div class="preview-row">
              Amount to Release:
              <strong class="text-green">{{
                formatCurrency(calculatedReleaseAmount)
              }}</strong>
            </div>
            <div class="preview-row">
              Remaining on Hold:
              <strong class="text-orange">{{
                formatCurrency(calculatedRemainingAmount)
              }}</strong>
            </div>
          </div>

          <div class="form-field">
            <label>Release Reason</label>
            <textarea
              v-model="releaseReason"
              class="form-textarea"
              rows="2"
              placeholder="Enter reason for releasing hold..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showSingleReleaseModal = false">
            Cancel
          </button>
          <button class="btn-primary" @click="confirmSingleRelease">
            Confirm Release
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== BULK RELEASE MODAL ==================== -->
    <div
      v-if="showBulkReleaseModal"
      class="modal-overlay"
      @click.self="showBulkReleaseModal = false"
    >
      <div class="modal-container release-modal bulk-modal">
        <div class="modal-header">
          <h3>Bulk Release Hold - {{ selectedOnHoldIds.length }} Employees</h3>
          <button class="modal-close" @click="showBulkReleaseModal = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="info-banner">
            <span>ℹ️</span>
            <div>
              Applying release to
              <strong>{{ selectedOnHoldIds.length }}</strong> employee(s)
            </div>
          </div>

          <div class="form-field">
            <label>Release Type</label>
            <select v-model="bulkReleaseType" class="form-select">
              <option value="full">Full Release (Pay all salary)</option>
              <option value="percent">Partial Release - Percentage</option>
              <option value="amount">Partial Release - Fixed Amount</option>
            </select>
          </div>

          <div class="form-field" v-if="bulkReleaseType === 'percent'">
            <label>Release Percentage (%)</label>
            <input
              type="number"
              v-model.number="bulkReleasePercent"
              class="form-input"
              min="0"
              max="100"
              placeholder="e.g., 50"
            />
          </div>

          <div class="form-field" v-if="bulkReleaseType === 'amount'">
            <label>Release Amount (ETB)</label>
            <input
              type="number"
              v-model.number="bulkReleaseAmount"
              class="form-input"
              min="0"
              placeholder="Enter amount to release"
            />
          </div>

          <div class="form-field">
            <label>Release Reason</label>
            <textarea
              v-model="bulkReleaseReason"
              class="form-textarea"
              rows="2"
              placeholder="Enter reason for bulk release..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showBulkReleaseModal = false">
            Cancel
          </button>
          <button class="btn-primary" @click="confirmBulkRelease">
            Confirm Bulk Release
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== PROCESS PAYROLL MODAL ==================== -->
    <div
      v-if="showProcessModal"
      class="modal-overlay"
      @click.self="closeProcessModal"
    >
      <div class="modal-container process-modal">
        <div class="modal-header gradient-header">
          <div class="header-icon">⚡</div>
          <div class="header-title">
            <h3>Process Payroll</h3>
            <p>Select month and configure payment schedule</p>
          </div>
          <button class="modal-close" @click="closeProcessModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>Select Payroll Month</label>
            <input
              type="month"
              v-model="processMonth"
              :min="minProcessMonth"
              :max="maxProcessMonth"
              @change="onProcessMonthChange"
              class="form-input"
            />
            <div class="status-badge-container">
              <span v-if="isMonthReadyToProcess" class="status-badge success"
                >Ready to Process</span
              >
              <span
                v-else-if="isMonthAlreadyProcessed"
                class="status-badge warning"
                >Already Processed</span
              >
              <span
                v-else-if="processMonth && !isMonthEnded"
                class="status-badge info"
                >Month not ended yet</span
              >
            </div>
          </div>
          <div v-if="isMonthReadyToProcess" class="form-field">
            <label>Payment Settings</label>
            <div class="settings-grid">
              <div class="setting-item">
                <label>Payment Date</label
                ><input
                  type="date"
                  v-model="paymentDate"
                  :min="minPaymentDate"
                  class="form-input"
                />
              </div>
              <div class="setting-item">
                <label>Payment Window</label
                ><input
                  type="number"
                  v-model="paymentWindowDays"
                  class="form-input"
                  disabled
                />
              </div>
              <div class="setting-item">
                <label>Unclaimed Window</label
                ><input
                  type="number"
                  v-model="unclaimedWindowDays"
                  class="form-input"
                  disabled
                />
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-item">
                <span>Employees</span><strong>{{ payrollData.length }}</strong>
              </div>
              <div class="summary-item">
                <span>Gross Pay</span
                ><strong>{{ formatCurrency(totalGrossPay) }}</strong>
              </div>
              <div class="summary-item">
                <span>Net to Pay</span
                ><strong class="text-green">{{
                  formatCurrency(totalNetPay)
                }}</strong>
              </div>
            </div>
          </div>
          <div
            v-if="processMonth && !isMonthEnded && !isMonthAlreadyProcessed"
            class="warning-message"
          >
            {{ formatMonth(processMonth) }} has not ended yet.
          </div>
          <div v-if="isMonthAlreadyProcessed" class="warning-message">
            {{ formatMonth(processMonth) }} has already been processed.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeProcessModal">
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="confirmProcessPayroll"
            :disabled="
              !isMonthReadyToProcess ||
              !paymentDate ||
              processingState === 'processing'
            "
          >
            {{
              processingState === "processing"
                ? "Processing..."
                : `Process ${formatMonth(processMonth)} Payroll`
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== PAYMENT METHOD MODAL ==================== -->
    <div
      v-if="showPaymentMethodModal"
      class="modal-overlay"
      @click.self="closePaymentMethodModal"
    >
      <div class="modal-container payment-method-modal">
        <div class="modal-header">
          <h3>Select Payment Method</h3>
          <button class="modal-close" @click="closePaymentMethodModal">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="employee-info-card-styled">
            <div class="emp-avatar-small">
              {{ getInitials(selectedPaymentItem?.employeeName) }}
            </div>
            <div class="emp-details">
              <div class="emp-name">
                {{ selectedPaymentItem?.employeeName }}
              </div>
              <div class="emp-code">
                {{ selectedPaymentItem?.employeeCode }}
              </div>
              <div class="emp-dept">{{ selectedPaymentItem?.department }}</div>
            </div>
            <div class="emp-amount-large">
              {{ formatCurrency(selectedPaymentItem?.amount) }}
            </div>
          </div>
          <div class="payment-options-styled">
            <div
              class="payment-option-styled"
              :class="{ active: selectedPaymentMethod === 'Cash' }"
              @click="selectedPaymentMethod = 'Cash'"
            >
              <div class="option-radio">
                <input
                  type="radio"
                  :checked="selectedPaymentMethod === 'Cash'"
                />
              </div>
              <div class="option-icon">💵</div>
              <div class="option-info">
                <div class="option-label">Cash</div>
                <div class="option-desc">Physical cash payment</div>
              </div>
            </div>
            <div
              class="payment-option-styled"
              :class="{ active: selectedPaymentMethod === 'Bank Transfer' }"
              @click="selectedPaymentMethod = 'Bank Transfer'"
            >
              <div class="option-radio">
                <input
                  type="radio"
                  :checked="selectedPaymentMethod === 'Bank Transfer'"
                />
              </div>
              <div class="option-icon">🏦</div>
              <div class="option-info">
                <div class="option-label">Bank Transfer</div>
                <div class="option-desc">Direct bank transfer</div>
              </div>
            </div>
          </div>
          <div
            v-if="selectedPaymentMethod === 'Bank Transfer'"
            class="form-field"
          >
            <label>Transaction Reference</label>
            <input
              type="text"
              v-model="transactionReference"
              class="form-input"
              placeholder="Enter transaction ID"
            />
          </div>
          <div v-if="selectedPaymentMethod === 'Cash'" class="form-field">
            <label>Cash Receipt Reference</label>
            <input
              type="text"
              v-model="cashReference"
              class="form-input"
              placeholder="Enter receipt number"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closePaymentMethodModal">
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="confirmPaymentWithMethod"
            :disabled="processingPayment"
          >
            {{ processingPayment ? "Processing..." : "Confirm Payment" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== PENALTY REDUCTION MODAL ==================== -->
    <!-- ==================== PENALTY REDUCTION MODAL ==================== -->
    <div
      v-if="showPenaltyReductionModal"
      class="modal-overlay"
      @click.self="showPenaltyReductionModal = false"
    >
      <div class="modal-container penalty-reduction-modal">
        <div class="modal-header">
          <h3>Reduce Penalty - {{ selectedPenaltyEmployee?.employeeName }}</h3>
          <button
            class="modal-close"
            @click="showPenaltyReductionModal = false"
          >
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="current-penalty-info">
            <div class="info-row">
              Current Penalty %:
              <strong class="text-red"
                >{{ selectedPenaltyEmployee?.penaltyPercent }}%</strong
              >
            </div>
            <div class="info-row">
              Current Penalty Amount:
              <strong class="text-red">{{
                formatCurrency(selectedPenaltyEmployee?.penaltyAmount)
              }}</strong>
            </div>
          </div>

          <div class="form-field">
            <label
              >Reduce Penalty % by (0 to
              {{ selectedPenaltyEmployee?.penaltyPercent }}%)</label
            >
            <input
              type="number"
              v-model.number="penaltyPercentReduction"
              class="form-input"
              min="0"
              :max="selectedPenaltyEmployee?.penaltyPercent"
              @input="validatePercentReduction"
              placeholder="Enter percentage to reduce"
            />
            <div
              class="input-hint"
              :class="{
                'text-red':
                  penaltyPercentReduction >
                  selectedPenaltyEmployee?.penaltyPercent,
              }"
            >
              New Penalty % will be:
              {{
                Math.max(
                  0,
                  (selectedPenaltyEmployee?.penaltyPercent || 0) -
                    penaltyPercentReduction,
                )
              }}%
              <span
                v-if="
                  penaltyPercentReduction >
                  selectedPenaltyEmployee?.penaltyPercent
                "
                class="error-text"
              >
                (Cannot exceed current penalty %)</span
              >
            </div>
          </div>

          <div class="form-field">
            <label
              >Reduce Penalty Amount by (0 to
              {{
                formatCurrency(selectedPenaltyEmployee?.penaltyAmount)
              }})</label
            >
            <input
              type="number"
              v-model.number="penaltyAmountReduction"
              class="form-input"
              min="0"
              :max="selectedPenaltyEmployee?.penaltyAmount"
              @input="validateAmountReduction"
              placeholder="Enter amount to reduce"
            />
            <div
              class="input-hint"
              :class="{
                'text-red':
                  penaltyAmountReduction >
                  selectedPenaltyEmployee?.penaltyAmount,
              }"
            >
              New Penalty Amount will be:
              {{
                formatCurrency(
                  Math.max(
                    0,
                    (selectedPenaltyEmployee?.penaltyAmount || 0) -
                      penaltyAmountReduction,
                  ),
                )
              }}
              <span
                v-if="
                  penaltyAmountReduction >
                  selectedPenaltyEmployee?.penaltyAmount
                "
                class="error-text"
              >
                (Cannot exceed current penalty amount)</span
              >
            </div>
          </div>

          <div class="form-field">
            <label>Reason for Reduction</label>
            <textarea
              v-model="penaltyReductionReason"
              class="form-textarea"
              rows="2"
              placeholder="Enter reason for penalty reduction..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn-secondary"
            @click="showPenaltyReductionModal = false"
          >
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="applyPenaltyReductionToEmployee"
            :disabled="
              penaltyPercentReduction >
                selectedPenaltyEmployee?.penaltyPercent ||
              penaltyAmountReduction > selectedPenaltyEmployee?.penaltyAmount
            "
          >
            Apply Reduction
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showBatchPenaltyModal"
      class="modal-overlay"
      @click.self="showBatchPenaltyModal = false"
    >
      <div class="modal-container batch-penalty-config-modal">
        <div class="modal-header">
          <h3>Configure Batch Penalty Reduction Rules</h3>
          <p class="modal-subtitle">{{ formatMonth(penaltySelectedMonth) }}</p>
          <button class="modal-close" @click="showBatchPenaltyModal = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="info-banner">
            <span>ℹ️</span>
            <div>
              Rules will be applied to all penalties for
              {{ formatMonth(penaltySelectedMonth) }}
            </div>
          </div>

          <!-- Amount Penalty Rules -->
          <div class="rules-section">
            <div class="section-header">
              <h4>Penalty Amount Rules</h4>
              <span class="section-unit">(ETB)</span>
            </div>
            <div class="rules-table">
              <div class="rules-header">
                <span>Penalty Range</span>
                <span></span>
                <span>Reduce Amount</span>
                <span></span>
              </div>
              <div
                v-for="(rule, idx) in amountPenaltyRules"
                :key="idx"
                class="rule-row"
              >
                <div class="rule-range">
                  <input
                    type="number"
                    v-model="rule.min"
                    class="range-input"
                    placeholder="Min"
                  />
                  <span class="range-sep">-</span>
                  <input
                    type="number"
                    v-model="rule.max"
                    class="range-input"
                    placeholder="Max"
                  />
                  <span class="range-unit">ETB</span>
                </div>
                <span class="rule-arrow">→</span>
                <div class="rule-reduction">
                  <input
                    type="number"
                    v-model="rule.reduction"
                    class="reduction-input"
                    placeholder="0"
                  />
                  <span class="reduction-unit">ETB</span>
                </div>
                <button
                  class="remove-rule-btn"
                  @click="removeAmountRule(idx)"
                  v-if="amountPenaltyRules.length > 1"
                >
                  X
                </button>
              </div>
              <button class="add-rule-btn" @click="addAmountRule">
                + Add Amount Rule
              </button>
            </div>
          </div>

          <!-- Percentage Penalty Rules -->
          <div class="rules-section">
            <div class="section-header">
              <h4>Penalty Percentage Rules</h4>
              <span class="section-unit">(%)</span>
            </div>
            <div class="rules-table">
              <div class="rules-header">
                <span>Penalty Range</span>
                <span></span>
                <span>Reduce Percentage</span>
                <span></span>
              </div>
              <div
                v-for="(rule, idx) in percentPenaltyRules"
                :key="idx"
                class="rule-row"
              >
                <div class="rule-range">
                  <input
                    type="number"
                    v-model="rule.min"
                    class="range-input"
                    placeholder="Min"
                  />
                  <span class="range-sep">-</span>
                  <input
                    type="number"
                    v-model="rule.max"
                    class="range-input"
                    placeholder="Max"
                  />
                  <span class="range-unit">%</span>
                </div>
                <span class="rule-arrow">→</span>
                <div class="rule-reduction">
                  <input
                    type="number"
                    v-model="rule.reduction"
                    class="reduction-input"
                    placeholder="0"
                  />
                  <span class="reduction-unit">%</span>
                </div>
                <button
                  class="remove-rule-btn"
                  @click="removePercentRule(idx)"
                  v-if="percentPenaltyRules.length > 1"
                >
                  X
                </button>
              </div>
              <button class="add-rule-btn" @click="addPercentRule">
                + Add Percentage Rule
              </button>
            </div>
          </div>

          <div class="preview-summary">
            <div class="summary-stat">
              <span class="stat-label">Employees with Penalties</span>
              <strong class="stat-value">{{
                filteredPenaltiesList.length
              }}</strong>
            </div>
            <div class="summary-stat">
              <span class="stat-label">Total Penalty Amount</span>
              <strong class="stat-value">{{
                formatCurrency(penaltiesTotalAmount)
              }}</strong>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showBatchPenaltyModal = false">
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="applyBatchPenaltyReduction"
            :disabled="applyingBatchReduction"
          >
            {{
              applyingBatchReduction
                ? "Applying..."
                : `Apply to ${formatMonth(penaltySelectedMonth)}`
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Deduction Modal -->
    <div
      v-if="showDeductionModal"
      class="modal-overlay"
      @click.self="closeDeductionModal"
    >
      <div class="modal-container deduction-modal">
        <div class="modal-header">
          <div class="employee-info-compact">
            <div class="emp-avatar">
              {{ getInitials(editingEmployee?.fullName) }}
            </div>
            <div>
              <strong>{{ editingEmployee?.fullName }}</strong>
              <div class="emp-meta">
                {{ editingEmployee?.employeeCode }} •
                {{ editingEmployee?.department }}
              </div>
            </div>
          </div>
          <button class="modal-close" @click="closeDeductionModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="checkbox-label"
              ><input type="checkbox" v-model="hasHold" /> Apply Salary Hold (up
              to 6 months)</label
            >
            <div v-if="hasHold" class="hold-details">
              <div class="duration-buttons">
                <button
                  v-for="n in 6"
                  :key="n"
                  :class="['duration-btn', { active: holdDuration === n }]"
                  @click="holdDuration = n"
                >
                  {{ n }}m
                </button>
              </div>
              <input
                type="text"
                v-model="holdReason"
                placeholder="Reason for hold"
                class="form-input"
              />
              <button class="btn-warning-small" @click="removeEmployeeHold">
                Remove Hold
              </button>
            </div>
          </div>

          <div class="deductions-list">
            <div
              v-for="(ded, idx) in employeeDeductions"
              :key="idx"
              class="deduction-item"
            >
              <div class="deduction-header">
                <span>{{ ded.name || "New Deduction" }}</span
                ><button class="remove-btn" @click="removeDeduction(idx)">
                  ✕
                </button>
              </div>
              <div class="deduction-fields">
                <select v-model="ded.name">
                  <option value="">Select type...</option>
                  <option>Loan</option>
                  <option>Salary Advance</option>
                  <option>Cooperative</option>
                </select>
                <input
                  type="text"
                  v-model="ded.reference"
                  placeholder="Reference #"
                />
                <input
                  type="text"
                  v-model="ded.submittedBy"
                  placeholder="Submitted By"
                />
                <input
                  type="text"
                  v-model="ded.contact"
                  placeholder="Contact"
                />
                <select v-model="ded.type">
                  <option value="amount">Fixed Amount</option>
                  <option value="percent">Percentage (%)</option>
                </select>
                <input type="number" v-model="ded.value" placeholder="Amount" />
                <input type="text" v-model="ded.reason" placeholder="Reason" />
              </div>
            </div>
            <button class="add-btn" @click="addDeduction">
              + Add Deduction
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeductionModal">
            Cancel</button
          ><button
            class="btn-primary"
            @click="saveDeductions"
            :disabled="savingDeductions"
          >
            {{ savingDeductions ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Batch Payment Modal -->
    <div
      v-if="showBatchModal"
      class="modal-overlay"
      @click.self="closeBatchModal"
    >
      <div class="modal-container batch-modal">
        <div class="modal-header">
          <h3>Batch Payment</h3>
          <button class="modal-close" @click="closeBatchModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="batch-summary">
            <div>
              Selected:
              <strong>{{ selectedPaymentsList.length }}</strong> employees
            </div>
            <div>
              Total:
              <strong>{{ formatCurrency(selectedPaymentsTotal) }}</strong>
            </div>
            <div>
              Method:
              <select v-model="batchMethod" class="form-select">
                <option>Bank Transfer</option>
                <option>Cash</option>
              </select>
            </div>
          </div>
          <div class="batch-list">
            <div
              v-for="emp in selectedPaymentsList"
              :key="emp.id"
              class="batch-item"
            >
              <span>{{ emp.employeeName }}</span
              ><span>{{ formatCurrency(emp.amount) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeBatchModal">Cancel</button
          ><button
            class="btn-primary"
            @click="confirmBatchPayment"
            :disabled="processingPayment"
          >
            {{ processingPayment ? "Processing..." : "Process Payment" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div
      v-if="showExportModal"
      class="modal-overlay"
      @click.self="closeExportModal"
    >
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>Export Payroll Report</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'government'">
              <input type="radio" v-model="exportType" value="government" />
              Government Report (Tax & Pension)
            </div>
            <div class="export-option" @click="exportType = 'internal'">
              <input type="radio" v-model="exportType" value="internal" />
              Internal Report (Bank Transfer)
            </div>
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full
              Comparison Report
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button
          ><button
            class="btn-primary"
            @click="exportSelectedReport"
            :disabled="exporting"
          >
            {{ exporting ? "Exporting..." : "Export" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

// ==================== CONSTANTS & CONFIGURATION ====================
const WORKING_DAYS = 22;
const HOURLY_FACTOR = WORKING_DAYS * 8;
const ALLOWANCE_RATE = 0.45;
const PENSION_RATE = 0.07;
const COMPANY_PENSION_RATE = 0.11;
const PAYMENT_WINDOW_DAYS = 7;
const UNCLAIMED_WINDOW_DAYS = 14;
const currentUser = "HR Admin";

const taxBrackets = [
  { min: 0, max: 600, rate: 0 },
  { min: 601, max: 1650, rate: 10 },
  { min: 1651, max: 3200, rate: 15 },
  { min: 3201, max: 5250, rate: 20 },
  { min: 5251, max: 7800, rate: 25 },
  { min: 7801, max: 10900, rate: 30 },
  { min: 10901, max: Infinity, rate: 35 },
];

const departments = ["IT", "Finance", "Operations", "HR"];
const tabs = [
  { id: "payroll", name: "Payroll" },
  { id: "penalties", name: "Summary" },
  { id: "payment", name: "Payment" },
  { id: "history", name: "History" },
  { id: "unclaimed", name: "Unclaimed" },
  { id: "returned", name: "Returned" },
  { id: "onhold", name: "On Hold" },
];

// ==================== EMPLOYEE DATA ====================
const employeesData = [
  { id: 1, employeeCode: "EMP001", fullName: "Biruk Mulualem", department: "IT", basicSalary: 25000, position: "Senior Developer" },
  { id: 2, employeeCode: "EMP002", fullName: "Dagmawi Hadgu", department: "IT", basicSalary: 35000, position: "Team Lead" },
  { id: 3, employeeCode: "EMP003", fullName: "Melkamu Zewdu", department: "Operations", basicSalary: 28000, position: "Manager" },
  { id: 4, employeeCode: "EMP004", fullName: "Melaku Tewodros", department: "Finance", basicSalary: 32000, position: "Finance Manager" },
  { id: 5, employeeCode: "EMP005", fullName: "Tamrat Zerihun", department: "IT", basicSalary: 18000, position: "Developer" },
  { id: 6, employeeCode: "EMP006", fullName: "Nuru Seid", department: "Finance", basicSalary: 15000, position: "Accountant" },
  { id: 7, employeeCode: "EMP007", fullName: "Tadese Jemberu", department: "Operations", basicSalary: 12000, position: "Coordinator" },
  { id: 8, employeeCode: "EMP008", fullName: "Eshete Worke", department: "IT", basicSalary: 22000, position: "System Admin" },
  { id: 9, employeeCode: "EMP009", fullName: "Haymanot Abebaw", department: "HR", basicSalary: 30000, position: "HR Manager" },
];

// ==================== UI STATE ====================
const activeTab = ref("payroll");
const expandedRow = ref(null);
const showDeptDropdown = ref(false);
const showCompHistoryId = ref(null);
const deptDropdownRef = ref(null);

// ==================== PAYROLL DATA ====================
const selectedMonth = ref("");
const processMonth = ref("");
const paymentDate = ref("");
const paymentWindowDays = ref(PAYMENT_WINDOW_DAYS);
const unclaimedWindowDays = ref(UNCLAIMED_WINDOW_DAYS);
const payrollData = ref([]);
const deductions = ref([]);
const holds = ref([]);
const carryForward = ref([]);
const compensationHistory = ref([]);

// ==================== PAYMENT DATA ====================
const paymentQueue = ref([]);
const paymentHistory = ref([]);
const unclaimedList = ref([]);
const returnedList = ref([]);
const paymentSession = ref(null);

// ==================== PENALTY DATA ====================
const penaltiesList = ref([]);
const penaltySelectedMonth = ref("");
const amountPenaltyRules = ref([
  { min: 0, max: 1000, reduction: 0 },
  { min: 1000, max: 5000, reduction: 500 },
  { min: 5000, max: Infinity, reduction: 1000 },
]);
const percentPenaltyRules = ref([
  { min: 0, max: 5, reduction: 0 },
  { min: 5, max: 10, reduction: 2 },
  { min: 10, max: Infinity, reduction: 5 },
]);

// ==================== ON HOLD DATA ====================
const onHoldSelectedMonth = ref("");
const onHoldSearch = ref("");
const onHoldDeptFilter = ref("all");
const selectedOnHoldIds = ref([]);
const selectAllOnHold = ref(false);
const onHoldPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

// ==================== FILTERS ====================
const payrollSearch = ref("");
const selectedDept = ref(null);
const paymentSearch = ref("");
const paymentDeptFilter = ref("all");
const penaltySearch = ref("");
const penaltyDeptFilter = ref("all");
const historySearch = ref("");
const historyMonthFilter = ref("");
const historyDeptFilter = ref("all");
const unclaimedSearch = ref("");
const unclaimedMonthFilter = ref("");
const unclaimedDeptFilter = ref("all");
const returnedSearch = ref("");
const returnedMonthFilter = ref("");
const returnedDeptFilter = ref("all");

// ==================== PAGINATION ====================
const payrollPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const penaltyPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const paymentPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const historyPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const unclaimedPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const returnedPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

// ==================== MODAL STATES ====================
const showProcessModal = ref(false);
const showExportModal = ref(false);
const showDeductionModal = ref(false);
const showBatchModal = ref(false);
const showBatchPenaltyModal = ref(false);
const showPenaltyReductionModal = ref(false);
const showPaymentMethodModal = ref(false);
const showSingleReleaseModal = ref(false);
const showBulkReleaseModal = ref(false);

// ==================== MODAL DATA ====================
const editingEmployee = ref(null);
const employeeDeductions = ref([]);
const selectedPaymentItem = ref(null);
const selectedPaymentMethod = ref("Cash");
const transactionReference = ref("");
const cashReference = ref("");
const selectedPenaltyEmployee = ref(null);
const penaltyPercentReduction = ref(0);
const penaltyAmountReduction = ref(0);
const penaltyReductionReason = ref("");
const selectedReleaseEmployee = ref(null);
const releaseType = ref("full");
const releasePercent = ref(0);
const releaseAmount = ref(0);
const releaseReason = ref("");
const bulkReleaseType = ref("full");
const bulkReleasePercent = ref(0);
const bulkReleaseAmount = ref(0);
const bulkReleaseReason = ref("");

// ==================== UI FLAGS ====================
const processingState = ref("idle");
const refreshing = ref(false);
const exporting = ref(false);
const exportingHistory = ref(false);
const exportingUnclaimed = ref(false);
const exportingReturned = ref(false);
const exportingPenalty = ref(false);
const exportingOnHold = ref(false);
const processingPayment = ref(false);
const applyingBatchReduction = ref(false);
const savingDeductions = ref(false);
const selectAllPayment = ref(false);
const batchMethod = ref("Bank Transfer");
const exportType = ref("government");
const hasHold = ref(false);
const holdDuration = ref(1);
const holdReason = ref("");

// ==================== TOAST ====================
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// ==================== COMPUTED: PAYROLL ====================
const selectedDeptName = computed(() => selectedDept.value || null);
const filteredPayrollData = computed(() => {
  let data = payrollData.value;
  if (payrollSearch.value) data = data.filter(e => e.fullName.toLowerCase().includes(payrollSearch.value.toLowerCase()));
  if (selectedDept.value) data = data.filter(e => e.department === selectedDept.value);
  payrollPagination.value.total = data.length;
  payrollPagination.value.totalPages = Math.ceil(data.length / payrollPagination.value.limit) || 1;
  return data;
});
const paginatedPayrollData = computed(() => {
  const start = (payrollPagination.value.page - 1) * payrollPagination.value.limit;
  return filteredPayrollData.value.slice(start, start + payrollPagination.value.limit);
});

const employees = computed(() => payrollData.value);
const activeHolds = computed(() => payrollData.value.filter(e => e.isOnHold).length);
const currentDeductionsTotal = computed(() => employeeDeductions.value.reduce((s, d) => s + (d.type === "percent" ? Math.floor((editingEmployee.value?.governmentNet || 0) * d.value / 100) : d.value || 0), 0));

const totalGrossPay = computed(() => payrollData.value.reduce((s, e) => s + e.grossPay, 0));
const totalTax = computed(() => payrollData.value.reduce((s, e) => s + e.tax, 0));
const totalPension7 = computed(() => payrollData.value.reduce((s, e) => s + e.pension7, 0));
const totalPension11 = computed(() => payrollData.value.reduce((s, e) => s + e.pension11, 0));
const totalNetPay = computed(() => payrollData.value.reduce((s, e) => s + e.internalNet, 0));

// ==================== COMPUTED: PAYMENT ====================
const filteredPaymentQueue = computed(() => {
  let data = paymentQueue.value;
  if (paymentSearch.value) data = data.filter(e => e.employeeName.toLowerCase().includes(paymentSearch.value.toLowerCase()));
  if (paymentDeptFilter.value !== "all") data = data.filter(e => e.department === paymentDeptFilter.value);
  paymentPagination.value.total = data.length;
  paymentPagination.value.totalPages = Math.ceil(data.length / paymentPagination.value.limit) || 1;
  return data;
});
const paginatedPaymentQueue = computed(() => {
  const start = (paymentPagination.value.page - 1) * paymentPagination.value.limit;
  return filteredPaymentQueue.value.slice(start, start + paymentPagination.value.limit);
});

const filteredHistory = computed(() => {
  let data = paymentHistory.value;
  if (historySearch.value) data = data.filter(e => e.employeeName?.toLowerCase().includes(historySearch.value.toLowerCase()));
  if (historyMonthFilter.value) data = data.filter(e => e.month === historyMonthFilter.value);
  if (historyDeptFilter.value !== "all") data = data.filter(e => e.department === historyDeptFilter.value);
  historyPagination.value.total = data.length;
  historyPagination.value.totalPages = Math.ceil(data.length / historyPagination.value.limit) || 1;
  return data;
});
const paginatedHistory = computed(() => {
  const start = (historyPagination.value.page - 1) * historyPagination.value.limit;
  return filteredHistory.value.slice(start, start + historyPagination.value.limit);
});

const filteredUnclaimed = computed(() => {
  let data = unclaimedList.value;
  if (unclaimedSearch.value) data = data.filter(e => e.employeeName.toLowerCase().includes(unclaimedSearch.value.toLowerCase()));
  if (unclaimedMonthFilter.value) data = data.filter(e => e.month === unclaimedMonthFilter.value);
  if (unclaimedDeptFilter.value !== "all") data = data.filter(e => e.department === unclaimedDeptFilter.value);
  unclaimedPagination.value.total = data.length;
  unclaimedPagination.value.totalPages = Math.ceil(data.length / unclaimedPagination.value.limit) || 1;
  return data;
});
const paginatedUnclaimed = computed(() => {
  const start = (unclaimedPagination.value.page - 1) * unclaimedPagination.value.limit;
  return filteredUnclaimed.value.slice(start, start + unclaimedPagination.value.limit);
});

const filteredReturned = computed(() => {
  let data = returnedList.value;
  if (returnedSearch.value) data = data.filter(e => e.employeeName.toLowerCase().includes(returnedSearch.value.toLowerCase()));
  if (returnedMonthFilter.value) data = data.filter(e => e.month === returnedMonthFilter.value);
  if (returnedDeptFilter.value !== "all") data = data.filter(e => e.department === returnedDeptFilter.value);
  returnedPagination.value.total = data.length;
  returnedPagination.value.totalPages = Math.ceil(data.length / returnedPagination.value.limit) || 1;
  return data;
});
const paginatedReturned = computed(() => {
  const start = (returnedPagination.value.page - 1) * returnedPagination.value.limit;
  return filteredReturned.value.slice(start, start + returnedPagination.value.limit);
});

const selectedPaymentsList = computed(() => filteredPaymentQueue.value.filter(e => e.selected));
const selectedPaymentsTotal = computed(() => selectedPaymentsList.value.reduce((s, e) => s + e.amount, 0));
const unclaimedStats = computed(() => ({
  total: unclaimedList.value.length,
  totalAmount: unclaimedList.value.reduce((s, u) => s + u.amount, 0),
  oldestDays: unclaimedList.value.length > 0 ? Math.max(...unclaimedList.value.map(u => u.daysOverdue)) : 0,
}));

// ==================== COMPUTED: PENALTIES ====================
const filteredPenaltiesList = computed(() => {
  let data = penaltiesList.value.filter(p => p.month === penaltySelectedMonth.value);
  data = data.filter(p => p.penaltyPercent > 0 || p.penaltyAmount > 0);
  if (penaltySearch.value) data = data.filter(p => p.employeeName.toLowerCase().includes(penaltySearch.value.toLowerCase()));
  if (penaltyDeptFilter.value !== "all") data = data.filter(p => p.department === penaltyDeptFilter.value);
  penaltyPagination.value.total = data.length;
  penaltyPagination.value.totalPages = Math.ceil(data.length / penaltyPagination.value.limit) || 1;
  return data;
});
const paginatedPenaltiesList = computed(() => {
  const start = (penaltyPagination.value.page - 1) * penaltyPagination.value.limit;
  return filteredPenaltiesList.value.slice(start, start + penaltyPagination.value.limit);
});
const penaltiesTotalAmount = computed(() => filteredPenaltiesList.value.reduce((sum, p) => sum + (p.penaltyAmount || 0), 0));

// ==================== COMPUTED: ON HOLD ====================
const filteredOnHoldList = computed(() => {
  let data = payrollData.value.filter(e => e.isOnHold === true && e.holdDetails?.startMonth === onHoldSelectedMonth.value);
  if (onHoldSearch.value) data = data.filter(e => e.fullName.toLowerCase().includes(onHoldSearch.value.toLowerCase()));
  if (onHoldDeptFilter.value !== "all") data = data.filter(e => e.department === onHoldDeptFilter.value);
  data = data.map(e => ({ ...e, selected: selectedOnHoldIds.value.includes(e.id) }));
  onHoldPagination.value.total = data.length;
  onHoldPagination.value.totalPages = Math.ceil(data.length / onHoldPagination.value.limit) || 1;
  return data;
});
const paginatedOnHoldList = computed(() => {
  const start = (onHoldPagination.value.page - 1) * onHoldPagination.value.limit;
  return filteredOnHoldList.value.slice(start, start + onHoldPagination.value.limit);
});
const onHoldStats = computed(() => ({
  total: filteredOnHoldList.value.length,
  totalAmount: filteredOnHoldList.value.reduce((sum, e) => sum + (e.governmentNet || 0), 0),
}));
const bulkSelectedOnHold = computed(() => filteredOnHoldList.value.filter(e => selectedOnHoldIds.value.includes(e.id)));
const calculatedReleaseAmount = computed(() => {
  if (releaseType.value === "percent") return Math.floor(((selectedReleaseEmployee.value?.governmentNet || 0) * releasePercent.value) / 100);
  if (releaseType.value === "amount") return Math.min(releaseAmount.value, selectedReleaseEmployee.value?.governmentNet || 0);
  return 0;
});
const calculatedRemainingAmount = computed(() => (selectedReleaseEmployee.value?.governmentNet || 0) - calculatedReleaseAmount.value);

// ==================== COMPUTED: PROCESSING ====================
const isMonthReadyToProcess = computed(() => processMonth.value && isMonthEnded(processMonth.value) && !isMonthProcessed(processMonth.value));
const isMonthAlreadyProcessed = computed(() => isMonthProcessed(processMonth.value));
const minProcessMonth = computed(() => "2024-01");
const maxProcessMonth = computed(() => getPreviousMonth());
const minPaymentDate = computed(() => getMonthEnd(processMonth.value));
const isPaymentWindowActive = computed(() => paymentSession.value && new Date() >= new Date(paymentSession.value.payDate));

const availableMonths = computed(() => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }
  return months;
});

// ==================== HELPER FUNCTIONS ====================
function formatCurrency(amt) { return new Intl.NumberFormat("en-US").format(amt || 0); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString() : "N/A"; }
function formatMonth(m) {
  if (!m) return "N/A";
  const [y, mo] = m.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(mo) - 1]} ${y}`;
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function showToastMessage(msg, type) {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
}
function getPreviousMonth() { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); }
function getMonthEnd(monthStr) { const [y, m] = monthStr.split("-"); return new Date(y, m, 0).toISOString().split("T")[0]; }
function isMonthEnded(monthStr) { return new Date() >= new Date(getMonthEnd(monthStr)); }
function isMonthProcessed(monthStr) { return paymentHistory.value.some(p => p.month === monthStr) || paymentSession.value?.month === monthStr; }
function getDeptCount(dept) { return payrollData.value.filter(e => e.department === dept).length; }
function getEmployeeHistory(employeeId) {
  return compensationHistory.value.filter(h => h.employeeId === employeeId).sort((a, b) => new Date(b.changeDate) - new Date(a.changeDate));
}
function downloadCSV(data, filename) {
  const csv = data.map(row => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== TAX CALCULATION ====================
function calculateTax(income) {
  let tax = 0, remaining = income;
  for (const b of taxBrackets) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, b.max) - b.min + 1;
    if (taxable > 0) { tax += (taxable * b.rate) / 100; remaining -= taxable; }
  }
  return Math.floor(Math.max(0, tax));
}

// ==================== PAYROLL CALCULATION ====================
function calculatePayroll() {
  payrollData.value = employeesData.map(emp => {
    const activeHold = holds.value.find(h => h.employeeId === emp.id && h.startMonth === selectedMonth.value);
    
    const allowancesTotal = Math.floor(emp.basicSalary * ALLOWANCE_RATE);
    const housingAllowance = Math.floor(emp.basicSalary * 0.2);
    const transportAllowance = Math.floor(emp.basicSalary * 0.1);
    const positionAllowance = Math.floor(emp.basicSalary * 0.15);
    const overtimeHours = Math.floor(Math.random() * 12);
    const hourlyRate = emp.basicSalary / HOURLY_FACTOR;
    const overtimePay = Math.floor(hourlyRate * overtimeHours * 1.5);
    const grossPay = emp.basicSalary + allowancesTotal + overtimePay;
    const tax = calculateTax(grossPay);
    const pension7 = Math.floor(emp.basicSalary * PENSION_RATE);
    const pension11 = Math.floor(emp.basicSalary * COMPANY_PENSION_RATE);
    const governmentNet = grossPay - tax - pension7;
    
    if (activeHold) {
      return {
        ...emp, allowancesTotal, housingAllowance, transportAllowance, positionAllowance,
        overtimeHours, overtimePay, grossPay, tax, pension7, pension11, governmentNet,
        totalDeductions: 0, finalNetPay: 0, isOnHold: true, holdDetails: activeHold,
        totalPenalties: 0, deductions: [], otherDeductionsTotal: 0, carryForward: 0,
        absentDays: 0, absentPenalty: 0, lateMinutes: 0, latePenalty: 0, penaltySummary: 0,
      };
    }
    
    const existingCarry = carryForward.value.find(c => c.employeeId === emp.id && c.month === selectedMonth.value);
    const carryAmount = existingCarry?.amount || 0;
    const empDeductions = deductions.value.filter(d => d.employeeId === emp.id);
    let otherDeductionsTotal = 0;
    const deductionDetails = empDeductions.map(d => {
      let amount = d.type === "percent" ? Math.floor(governmentNet * (d.value / 100)) : d.value;
      otherDeductionsTotal += amount;
      return { ...d, amount, date: d.date || new Date().toISOString().split("T")[0] };
    });
    
    const empPenalty = penaltiesList.value.find(p => p.employeeId === emp.id && p.month === selectedMonth.value);
    const absentDays = empPenalty?.absentDays || 0;
    const absentPenalty = empPenalty?.absentPenalty || 0;
    const lateMinutes = empPenalty?.lateMinutes || 0;
    const latePenalty = empPenalty?.latePenalty || 0;
    const totalPenalties = absentPenalty + latePenalty;
    const totalDeductions = totalPenalties + otherDeductionsTotal;
    let finalNetPay = governmentNet - totalPenalties - otherDeductionsTotal - carryAmount;
    let newCarry = 0;
    if (finalNetPay < 0) { newCarry = Math.abs(finalNetPay); finalNetPay = 0; }
    if (newCarry) {
      if (existingCarry) existingCarry.amount = newCarry;
      else carryForward.value.push({ employeeId: emp.id, month: selectedMonth.value, amount: newCarry });
    } else if (existingCarry) {
      carryForward.value = carryForward.value.filter(c => !(c.employeeId === emp.id && c.month === selectedMonth.value));
    }
    
    return {
      ...emp, allowancesTotal, housingAllowance, transportAllowance, positionAllowance,
      overtimeHours, overtimePay, grossPay, tax, pension7, pension11, governmentNet,
      deductions: deductionDetails, otherDeductionsTotal, carryForward: carryAmount,
      absentDays, absentPenalty, lateMinutes, latePenalty, totalPenalties, totalDeductions,
      finalNetPay, penaltySummary: 0, isOnHold: false,
    };
  });
}

// ==================== COMPENSATION HISTORY ====================
function logCompensationChange(employeeId, component, oldValue, newValue) {
  oldValue = Number(oldValue); newValue = Number(newValue);
  if (oldValue === newValue) return;
  const changeType = newValue > oldValue ? "increase" : "decrease";
  const difference = Math.abs(newValue - oldValue);
  const percentageChange = oldValue !== 0 ? Math.round((difference / oldValue) * 100) : 0;
  compensationHistory.value.unshift({
    id: Date.now(), employeeId, changeDate: new Date().toISOString().split("T")[0],
    component, oldValue, newValue, changeType, percentageChange, difference,
    submittedBy: currentUser,
  });
}

function updateEmployeePayroll(emp, component, newValue) {
  let oldValue;
  switch (component) {
    case "Basic Salary": oldValue = emp.basicSalary; emp.basicSalary = newValue; break;
    case "Housing Allowance": oldValue = emp.housingAllowance; emp.housingAllowance = newValue; break;
    case "Transport Allowance": oldValue = emp.transportAllowance; emp.transportAllowance = newValue; break;
    case "Position Allowance": oldValue = emp.positionAllowance; emp.positionAllowance = newValue; break;
    default: oldValue = 0;
  }
  if (oldValue !== newValue) logCompensationChange(emp.id, component, oldValue, newValue);
  
  emp.allowancesTotal = Number(emp.housingAllowance) + Number(emp.transportAllowance) + Number(emp.positionAllowance);
  emp.grossPay = Number(emp.basicSalary) + Number(emp.allowancesTotal) + Number(emp.overtimePay);
  emp.tax = calculateTax(emp.grossPay);
  emp.pension7 = Math.floor(Number(emp.basicSalary) * PENSION_RATE);
  emp.governmentNet = emp.grossPay - emp.tax - emp.pension7;
  emp.totalPenalties = (emp.absentPenalty || 0) + (emp.latePenalty || 0);
  emp.totalDeductions = emp.totalPenalties + emp.otherDeductionsTotal;
  emp.finalNetPay = emp.governmentNet - emp.totalPenalties - emp.otherDeductionsTotal + (emp.penaltySummary || 0);
  if (emp.finalNetPay < 0) emp.finalNetPay = 0;
  showToastMessage(`${component} updated for ${emp.fullName}`, "success");
}

// ==================== PENALTY FUNCTIONS ====================
function loadPenaltyData() { penaltyPagination.value.page = 1; }
function openPenaltyReductionModal(penalty) {
  selectedPenaltyEmployee.value = penalty;
  penaltyPercentReduction.value = 0;
  penaltyAmountReduction.value = 0;
  penaltyReductionReason.value = "";
  showPenaltyReductionModal.value = true;
}
function validatePercentReduction() {
  if (penaltyPercentReduction.value > selectedPenaltyEmployee.value?.penaltyPercent) {
    penaltyPercentReduction.value = selectedPenaltyEmployee.value?.penaltyPercent;
    showToastMessage(`Cannot reduce more than ${selectedPenaltyEmployee.value?.penaltyPercent}%`, "error");
  }
  if (penaltyPercentReduction.value < 0) penaltyPercentReduction.value = 0;
}
function validateAmountReduction() {
  if (penaltyAmountReduction.value > selectedPenaltyEmployee.value?.penaltyAmount) {
    penaltyAmountReduction.value = selectedPenaltyEmployee.value?.penaltyAmount;
    showToastMessage(`Cannot reduce more than ${formatCurrency(selectedPenaltyEmployee.value?.penaltyAmount)}`, "error");
  }
  if (penaltyAmountReduction.value < 0) penaltyAmountReduction.value = 0;
}
function addAmountRule() { amountPenaltyRules.value.push({ min: 0, max: Infinity, reduction: 0 }); }
function addPercentRule() { percentPenaltyRules.value.push({ min: 0, max: Infinity, reduction: 0 }); }
function removeAmountRule(idx) { if (amountPenaltyRules.value.length > 1) amountPenaltyRules.value.splice(idx, 1); else showToastMessage("Cannot remove last rule", "error"); }
function removePercentRule(idx) { if (percentPenaltyRules.value.length > 1) percentPenaltyRules.value.splice(idx, 1); else showToastMessage("Cannot remove last rule", "error"); }

function applyPenaltyReductionToEmployee() {
  if (!selectedPenaltyEmployee.value) return;
  const oldPercent = selectedPenaltyEmployee.value.penaltyPercent;
  const oldAmount = selectedPenaltyEmployee.value.penaltyAmount;
  if (penaltyPercentReduction.value > oldPercent) { showToastMessage(`Cannot reduce more than ${oldPercent}%`, "error"); return; }
  if (penaltyAmountReduction.value > oldAmount) { showToastMessage(`Cannot reduce more than ${formatCurrency(oldAmount)}`, "error"); return; }
  if (penaltyPercentReduction.value === 0 && penaltyAmountReduction.value === 0) { showToastMessage("No reduction values entered", "error"); return; }
  
  const penaltyIndex = penaltiesList.value.findIndex(p => p.id === selectedPenaltyEmployee.value.id);
  if (penaltyIndex !== -1) {
    const newPercent = Math.max(0, penaltiesList.value[penaltyIndex].penaltyPercent - penaltyPercentReduction.value);
    const newAmount = Math.max(0, penaltiesList.value[penaltyIndex].penaltyAmount - penaltyAmountReduction.value);
    penaltiesList.value[penaltyIndex].penaltyPercent = newPercent;
    penaltiesList.value[penaltyIndex].penaltyAmount = newAmount;
    
    const employee = payrollData.value.find(e => e.id === selectedPenaltyEmployee.value.employeeId);
    if (employee) {
      const penaltyFromPercent = Math.floor((newPercent / 100) * employee.basicSalary);
      employee.penaltyPercent = newPercent;
      employee.penaltyAmount = newAmount;
      employee.penaltyFromPercent = penaltyFromPercent;
      employee.totalPenalties = penaltyFromPercent + newAmount;
      employee.totalDeductions = employee.totalPenalties + employee.otherDeductionsTotal;
      employee.finalNetPay = employee.governmentNet - employee.totalDeductions - (employee.carryForward || 0);
      if (employee.finalNetPay < 0) employee.finalNetPay = 0;
    }
    let changes = [];
    if (penaltyPercentReduction.value > 0) changes.push(`% from ${oldPercent}% to ${newPercent}%`);
    if (penaltyAmountReduction.value > 0) changes.push(`Amount from ${formatCurrency(oldAmount)} to ${formatCurrency(newAmount)}`);
    showToastMessage(`Penalty reduced for ${selectedPenaltyEmployee.value.employeeName}: ${changes.join(", ")}`, "success");
  }
  penaltyPercentReduction.value = 0;
  penaltyAmountReduction.value = 0;
  penaltyReductionReason.value = "";
  showPenaltyReductionModal.value = false;
  loadPenaltyData();
}

function applyBatchPenaltyReduction() {
  applyingBatchReduction.value = true;
  setTimeout(() => {
    penaltiesList.value.forEach(penalty => {
      if (penalty.month !== penaltySelectedMonth.value) return;
      const amountRule = amountPenaltyRules.value.find(r => penalty.penaltyAmount >= r.min && penalty.penaltyAmount < r.max);
      if (amountRule && amountRule.reduction > 0) penalty.penaltyAmount = Math.max(0, penalty.penaltyAmount - amountRule.reduction);
      const percentRule = percentPenaltyRules.value.find(r => penalty.penaltyPercent >= r.min && penalty.penaltyPercent < r.max);
      if (percentRule && percentRule.reduction > 0) penalty.penaltyPercent = Math.max(0, penalty.penaltyPercent - percentRule.reduction);
    });
    payrollData.value.forEach(emp => {
      const empPenalty = penaltiesList.value.find(p => p.employeeId === emp.id && p.month === penaltySelectedMonth.value);
      if (empPenalty) {
        const penaltyFromPercent = Math.floor((empPenalty.penaltyPercent / 100) * emp.basicSalary);
        emp.penaltyPercent = empPenalty.penaltyPercent;
        emp.penaltyAmount = empPenalty.penaltyAmount;
        emp.penaltyFromPercent = penaltyFromPercent;
        emp.totalPenalties = penaltyFromPercent + empPenalty.penaltyAmount;
        emp.totalDeductions = emp.totalPenalties + emp.otherDeductionsTotal;
        emp.finalNetPay = emp.governmentNet - emp.totalDeductions - (emp.carryForward || 0);
        if (emp.finalNetPay < 0) emp.finalNetPay = 0;
      }
    });
    applyingBatchReduction.value = false;
    showBatchPenaltyModal.value = false;
    showToastMessage("Batch penalty reduction applied successfully", "success");
    loadPenaltyData();
  }, 500);
}

// ==================== ON HOLD FUNCTIONS ====================
function loadOnHoldData() { onHoldPagination.value.page = 1; selectedOnHoldIds.value = []; selectAllOnHold.value = false; }
function changeOnHoldPage(page) { onHoldPagination.value.page = page; }
function changeOnHoldLimit() { onHoldPagination.value.page = 1; }
function updateSelectedOnHoldIds() {
  selectedOnHoldIds.value = filteredOnHoldList.value.filter(e => e.selected).map(e => e.id);
  selectAllOnHold.value = selectedOnHoldIds.value.length === filteredOnHoldList.value.length && filteredOnHoldList.value.length > 0;
}
function toggleSelectAllOnHold() {
  if (selectAllOnHold.value) selectedOnHoldIds.value = filteredOnHoldList.value.map(e => e.id);
  else selectedOnHoldIds.value = [];
}

function openSingleReleaseModal(emp) {
  selectedReleaseEmployee.value = emp;
  releaseType.value = "full";
  releasePercent.value = 0;
  releaseAmount.value = 0;
  releaseReason.value = "";
  showSingleReleaseModal.value = true;
}
function openBulkReleaseModal() {
  if (selectedOnHoldIds.value.length === 0) return;
  bulkReleaseType.value = "full";
  bulkReleasePercent.value = 0;
  bulkReleaseAmount.value = 0;
  bulkReleaseReason.value = "";
  showBulkReleaseModal.value = true;
}

function confirmSingleRelease() {
  if (!selectedReleaseEmployee.value) return;
  let releasedAmount = selectedReleaseEmployee.value.governmentNet;
  if (releaseType.value === "percent") releasedAmount = Math.floor((selectedReleaseEmployee.value.governmentNet * releasePercent.value) / 100);
  else if (releaseType.value === "amount") releasedAmount = Math.min(releaseAmount.value, selectedReleaseEmployee.value.governmentNet);
  const remainingAmount = selectedReleaseEmployee.value.governmentNet - releasedAmount;
  if (releaseType.value !== "full" && releasedAmount <= 0) { showToastMessage("Please enter a valid release amount", "error"); return; }
  
  holds.value = holds.value.filter(h => h.employeeId !== selectedReleaseEmployee.value.id);
  const employee = payrollData.value.find(e => e.id === selectedReleaseEmployee.value.id);
  if (employee) {
    if (remainingAmount > 0) {
      employee.governmentNet = remainingAmount;
      employee.internalNet = remainingAmount;
      employee.finalNetPay = remainingAmount;
      employee.isOnHold = true;
      employee.holdDetails = {
        ...employee.holdDetails,
        reason: `${employee.holdDetails?.reason} - Partial release: ${formatCurrency(releasedAmount)} released. ${releaseReason.value}`,
        originalAmount: selectedReleaseEmployee.value.governmentNet,
        remainingAmount: remainingAmount,
      };
    } else {
      employee.isOnHold = false;
      delete employee.holdDetails;
      employee.finalNetPay = employee.governmentNet - employee.totalPenalties - employee.otherDeductionsTotal;
      if (employee.finalNetPay < 0) employee.finalNetPay = 0;
    }
  }
  showSingleReleaseModal.value = false;
  showToastMessage(`${releasedAmount > 0 ? formatCurrency(releasedAmount) : "Full amount"} released for ${selectedReleaseEmployee.value.fullName}`, "success");
  loadOnHoldData();
  calculatePayroll();
}

function confirmBulkRelease() {
  const selectedEmployees = bulkSelectedOnHold.value;
  selectedEmployees.forEach(emp => {
    let releasedAmount = emp.governmentNet;
    if (bulkReleaseType.value === "percent") releasedAmount = Math.floor((emp.governmentNet * bulkReleasePercent.value) / 100);
    else if (bulkReleaseType.value === "amount") releasedAmount = Math.min(bulkReleaseAmount.value, emp.governmentNet);
    const remainingAmount = emp.governmentNet - releasedAmount;
    holds.value = holds.value.filter(h => h.employeeId !== emp.id);
    const employee = payrollData.value.find(e => e.id === emp.id);
    if (employee) {
      if (bulkReleaseType.value !== "full" && remainingAmount > 0) {
        employee.governmentNet = remainingAmount;
        employee.internalNet = remainingAmount;
        employee.finalNetPay = remainingAmount;
        employee.isOnHold = true;
        employee.holdDetails = { ...employee.holdDetails, reason: `${employee.holdDetails?.reason} - Bulk partial release: ${formatCurrency(releasedAmount)} released. ${bulkReleaseReason.value}` };
      } else {
        employee.isOnHold = false;
        delete employee.holdDetails;
        employee.finalNetPay = employee.governmentNet - employee.totalPenalties - employee.otherDeductionsTotal;
        if (employee.finalNetPay < 0) employee.finalNetPay = 0;
      }
    }
  });
  showBulkReleaseModal.value = false;
  selectedOnHoldIds.value = [];
  selectAllOnHold.value = false;
  showToastMessage(`Bulk release completed for ${selectedEmployees.length} employees`, "success");
  loadOnHoldData();
  calculatePayroll();
}

function exportOnHoldList() {
  exportingOnHold.value = true;
  setTimeout(() => {
    const headers = ["Employee Code", "Employee Name", "Department", "Net Pay (Locked)", "Hold Reason", "Hold Since", "Duration (months)"];
    const rows = filteredOnHoldList.value.map(emp => [
      emp.employeeCode, emp.fullName, emp.department, emp.governmentNet,
      emp.holdDetails?.reason || "No reason", emp.holdDetails?.startDate || onHoldSelectedMonth.value, emp.holdDetails?.duration || 1
    ]);
    downloadCSV([headers, ...rows], `on_hold_employees_${onHoldSelectedMonth.value}.csv`);
    exportingOnHold.value = false;
    showToastMessage(`On hold list exported for ${formatMonth(onHoldSelectedMonth.value)}`, "success");
  }, 500);
}

// ==================== PAYMENT FUNCTIONS ====================
function openPaymentMethodModal(item) {
  selectedPaymentItem.value = item;
  selectedPaymentMethod.value = "Cash";
  transactionReference.value = "";
  cashReference.value = "";
  showPaymentMethodModal.value = true;
}
function closePaymentMethodModal() { showPaymentMethodModal.value = false; selectedPaymentItem.value = null; }
function canPayReturned(item) { return new Date() >= new Date(item.returnDate); }

function confirmPaymentWithMethod() {
  processingPayment.value = true;
  setTimeout(() => {
    const ref = selectedPaymentMethod.value === "Bank Transfer" ? transactionReference.value || `TXN${Date.now()}` : cashReference.value || `CASH${Date.now()}`;
    paymentHistory.value.push({
      id: Date.now(), employeeId: selectedPaymentItem.value.employeeId, employeeName: selectedPaymentItem.value.employeeName,
      employeeCode: selectedPaymentItem.value.employeeCode, department: selectedPaymentItem.value.department,
      amount: selectedPaymentItem.value.amount, paymentDate: new Date().toISOString().split("T")[0],
      month: selectedPaymentItem.value.month, method: selectedPaymentMethod.value, transactionId: ref, processedBy: currentUser,
    });
    const idx = paymentQueue.value.findIndex(p => p.id === selectedPaymentItem.value.id);
    if (idx !== -1) paymentQueue.value.splice(idx, 1);
    const unclaimedIdx = unclaimedList.value.findIndex(u => u.id === selectedPaymentItem.value.id);
    if (unclaimedIdx !== -1) unclaimedList.value.splice(unclaimedIdx, 1);
    const returnedIdx = returnedList.value.findIndex(r => r.id === selectedPaymentItem.value.id);
    if (returnedIdx !== -1) returnedList.value.splice(returnedIdx, 1);
    processingPayment.value = false;
    showToastMessage(`${selectedPaymentItem.value.employeeName} paid via ${selectedPaymentMethod.value}!`, "success");
    closePaymentMethodModal();
  }, 500);
}

// ==================== PROCESS PAYROLL ====================
function openProcessModal() { processMonth.value = getPreviousMonth(); paymentDate.value = getMonthEnd(processMonth.value); showProcessModal.value = true; }
function closeProcessModal() { showProcessModal.value = false; }
function onProcessMonthChange() { if (isMonthEnded(processMonth.value)) paymentDate.value = getMonthEnd(processMonth.value); }

function confirmProcessPayroll() {
  processingState.value = "processing";
  setTimeout(() => {
    selectedMonth.value = processMonth.value;
    const existingPenalties = penaltiesList.value.filter(p => p.month === selectedMonth.value);
    if (existingPenalties.length === 0) {
      employeesData.forEach(emp => {
        let absentDays = 0, absentPenalty = 0, lateMinutes = 0, latePenalty = 0;
        if (emp.id === 1) { absentDays = 1; absentPenalty = Math.floor((emp.basicSalary / WORKING_DAYS) * absentDays); lateMinutes = 45; latePenalty = Math.floor((emp.basicSalary / HOURLY_FACTOR) * (lateMinutes / 60)); }
        else if (emp.id === 2) { lateMinutes = 120; latePenalty = Math.floor((emp.basicSalary / HOURLY_FACTOR) * (lateMinutes / 60)); }
        else if (emp.id === 3) { absentDays = 2; absentPenalty = Math.floor((emp.basicSalary / WORKING_DAYS) * absentDays); }
        else if (emp.id === 4) { lateMinutes = 30; latePenalty = Math.floor((emp.basicSalary / HOURLY_FACTOR) * (lateMinutes / 60)); }
        if (absentPenalty > 0 || latePenalty > 0) {
          penaltiesList.value.push({ id: Date.now() + emp.id, employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, department: emp.department, month: selectedMonth.value, absentDays, absentPenalty, lateMinutes, latePenalty });
        }
      });
    }
    calculatePayroll();
    paymentSession.value = { month: processMonth.value, payDate: paymentDate.value, totalAmount: payrollData.value.reduce((s, e) => s + e.finalNetPay, 0), employeeCount: payrollData.value.filter(e => !e.isOnHold && e.finalNetPay > 0).length };
    paymentQueue.value = payrollData.value.filter(e => !e.isOnHold && e.finalNetPay > 0).map(emp => ({ id: Date.now() + emp.id, employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, department: emp.department, amount: emp.finalNetPay, dueDate: paymentDate.value, month: processMonth.value, selected: false }));
    closeProcessModal();
    activeTab.value = "payment";
    processingState.value = "idle";
    showToastMessage(`Payroll for ${formatMonth(processMonth.value)} processed! ${paymentQueue.value.length} employees ready.`, "success");
  }, 1000);
}

function openBatchPaymentModal() { if (selectedPaymentsList.value.length) showBatchModal.value = true; }
function closeBatchModal() { showBatchModal.value = false; }
function confirmBatchPayment() {
  processingPayment.value = true;
  setTimeout(() => {
    selectedPaymentsList.value.forEach(p => {
      paymentHistory.value.push({ id: Date.now(), employeeId: p.employeeId, employeeName: p.employeeName, employeeCode: p.employeeCode, department: p.department, amount: p.amount, paymentDate: new Date().toISOString().split("T")[0], month: p.month, method: batchMethod.value, transactionId: `BATCH${Date.now()}`, processedBy: currentUser });
      const idx = paymentQueue.value.findIndex(pq => pq.id === p.id);
      if (idx !== -1) paymentQueue.value.splice(idx, 1);
    });
    processingPayment.value = false;
    closeBatchModal();
    showToastMessage(`Batch payment completed for ${selectedPaymentsList.value.length} employees`, "success");
  }, 500);
}

// ==================== EXPORT FUNCTIONS ====================
function openExportModal() { showExportModal.value = true; }
function closeExportModal() { showExportModal.value = false; }
function exportPenaltySummary() {
  exportingPenalty.value = true;
  setTimeout(() => {
    const headers = ["Employee Code", "Employee Name", "Department", "Penalty %", "Penalty Amount (ETB)"];
    const rows = filteredPenaltiesList.value.map(p => [p.employeeCode, p.employeeName, p.department, p.penaltyPercent, p.penaltyAmount]);
    rows.push(["", "", "TOTAL", "", penaltiesTotalAmount.value]);
    downloadCSV([headers, ...rows], `penalty_summary_${penaltySelectedMonth.value}.csv`);
    exportingPenalty.value = false;
    showToastMessage(`Penalty summary exported!`, "success");
  }, 500);
}
function exportSelectedReport() {
  exporting.value = true;
  setTimeout(() => {
    let headers = [], rows = [];
    if (exportType.value === "government") {
      headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Housing Allowance", "Transport Allowance", "Position Allowance", "Overtime Pay", "Gross Pay", "Absent Days", "Absent Penalty", "Late Minutes", "Late Penalty", "Tax (PAYE)", "Pension (7%)", "Pension (11%)", "Government Net Pay"];
      rows = filteredPayrollData.value.map(e => [e.employeeCode, e.fullName, e.department, e.basicSalary, e.housingAllowance, e.transportAllowance, e.positionAllowance, e.overtimePay, e.grossPay, e.absentDays || 0, e.absentPenalty || 0, e.lateMinutes || 0, e.latePenalty || 0, e.tax, e.pension7, e.pension11, e.governmentNet]);
    } else if (exportType.value === "internal") {
      headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Gross Pay", "Tax", "Pension", "Total Penalties", "Other Deductions", "Final Net Pay"];
      rows = filteredPayrollData.value.map(e => [e.employeeCode, e.fullName, e.department, e.basicSalary, e.grossPay, e.tax, e.pension7, e.totalPenalties, e.otherDeductionsTotal, e.finalNetPay]);
    } else {
      headers = ["Employee Code", "Employee Name", "Department", "Basic Salary", "Gross Pay", "Government Net", "Total Penalties", "Other Deductions", "Final Net Pay", "Difference"];
      rows = filteredPayrollData.value.map(e => [e.employeeCode, e.fullName, e.department, e.basicSalary, e.grossPay, e.governmentNet, e.totalPenalties, e.otherDeductionsTotal, e.finalNetPay, e.governmentNet - e.finalNetPay]);
    }
    downloadCSV([headers, ...rows], `${exportType.value}_report_${selectedMonth.value}.csv`);
    exporting.value = false;
    closeExportModal();
    showToastMessage("Export completed!", "success");
  }, 500);
}
function exportPaymentHistory() {
  exportingHistory.value = true;
  setTimeout(() => {
    const headers = ["Date", "Month", "Employee Code", "Employee Name", "Department", "Amount", "Method", "Reference", "Processed By"];
    const rows = filteredHistory.value.map(p => [p.paymentDate, p.month, p.employeeCode, p.employeeName, p.department, p.amount, p.method, p.transactionId || "-", p.processedBy || "HR"]);
    downloadCSV([headers, ...rows], `payment_history.csv`);
    exportingHistory.value = false;
    showToastMessage("Payment history exported!", "success");
  }, 500);
}
function exportUnclaimed() {
  exportingUnclaimed.value = true;
  setTimeout(() => {
    const headers = ["Employee Code", "Employee Name", "Department", "Month", "Due Date", "Amount", "Days Overdue"];
    const rows = filteredUnclaimed.value.map(u => [u.employeeCode, u.employeeName, u.department, u.month, u.dueDate, u.amount, u.daysOverdue]);
    downloadCSV([headers, ...rows], `unclaimed.csv`);
    exportingUnclaimed.value = false;
    showToastMessage("Unclaimed list exported!", "success");
  }, 500);
}
function exportReturned() {
  exportingReturned.value = true;
  setTimeout(() => {
    const headers = ["Employee Code", "Employee Name", "Department", "Month", "Due Date", "Return Date", "Amount", "Days Late"];
    const rows = filteredReturned.value.map(r => [r.employeeCode, r.employeeName, r.department, r.month, r.dueDate, r.returnDate, r.amount, r.daysLate]);
    downloadCSV([headers, ...rows], `returned.csv`);
    exportingReturned.value = false;
    showToastMessage("Returned list exported!", "success");
  }, 500);
}

// ==================== DEDUCTION FUNCTIONS ====================
function editEmployeeDeductions(emp) {
  editingEmployee.value = emp;
  employeeDeductions.value = JSON.parse(JSON.stringify(deductions.value.filter(d => d.employeeId === emp.id)));
  if (!employeeDeductions.value.length) {
    employeeDeductions.value.push({ id: Date.now(), name: "", type: "amount", value: 0, reason: "", reference: "", submittedBy: currentUser, contact: "", date: new Date().toISOString().split("T")[0] });
  }
  const existingHold = holds.value.find(h => h.employeeId === emp.id && h.startMonth === selectedMonth.value);
  if (existingHold) { hasHold.value = true; holdDuration.value = existingHold.duration; holdReason.value = existingHold.reason; }
  else { hasHold.value = false; holdDuration.value = 1; holdReason.value = ""; }
  showDeductionModal.value = true;
}
function addDeduction() { employeeDeductions.value.push({ id: Date.now(), name: "", type: "amount", value: 0, reason: "", reference: "", submittedBy: currentUser, contact: "", date: new Date().toISOString().split("T")[0] }); }
function removeDeduction(idx) { employeeDeductions.value.splice(idx, 1); }
function removeEmployeeHold() {
  holds.value = holds.value.filter(h => h.employeeId !== editingEmployee.value.id);
  hasHold.value = false;
  calculatePayroll();
  showToastMessage("Hold removed", "success");
}
function saveDeductions() {
  savingDeductions.value = true;
  setTimeout(() => {
    deductions.value = deductions.value.filter(d => d.employeeId !== editingEmployee.value.id);
    employeeDeductions.value.forEach(d => { if (d.name && d.value > 0) deductions.value.push({ ...d, employeeId: editingEmployee.value.id, date: d.date || new Date().toISOString().split("T")[0] }); });
    if (hasHold.value) {
      holds.value = holds.value.filter(h => !(h.employeeId === editingEmployee.value.id && h.startMonth === selectedMonth.value));
      holds.value.push({ employeeId: editingEmployee.value.id, startMonth: selectedMonth.value, duration: holdDuration.value, reason: holdReason.value });
    }
    closeDeductionModal();
    calculatePayroll();
    savingDeductions.value = false;
    showToastMessage("Deductions saved!", "success");
  }, 500);
}
function closeDeductionModal() { showDeductionModal.value = false; editingEmployee.value = null; employeeDeductions.value = []; }

// ==================== UI HANDLERS ====================
function toggleDeptDropdown() { showDeptDropdown.value = !showDeptDropdown.value; }
function handleClickOutside(event) { if (deptDropdownRef.value && !deptDropdownRef.value.contains(event.target)) showDeptDropdown.value = false; }
function resetPagination() { payrollPagination.value.page = 1; penaltyPagination.value.page = 1; paymentPagination.value.page = 1; historyPagination.value.page = 1; unclaimedPagination.value.page = 1; returnedPagination.value.page = 1; }
function changePayrollPage(page) { payrollPagination.value.page = page; }
function changePayrollLimit() { payrollPagination.value.page = 1; payrollPagination.value.limit = parseInt(payrollPagination.value.limit); }
function changePenaltyPage(page) { penaltyPagination.value.page = page; }
function changePenaltyLimit() { penaltyPagination.value.page = 1; penaltyPagination.value.limit = parseInt(penaltyPagination.value.limit); }
function changePaymentPage(page) { paymentPagination.value.page = page; }
function changePaymentLimit() { paymentPagination.value.page = 1; paymentPagination.value.limit = parseInt(paymentPagination.value.limit); }
function changeHistoryPage(page) { historyPagination.value.page = page; }
function changeHistoryLimit() { historyPagination.value.page = 1; historyPagination.value.limit = parseInt(historyPagination.value.limit); }
function changeUnclaimedPage(page) { unclaimedPagination.value.page = page; }
function changeUnclaimedLimit() { unclaimedPagination.value.page = 1; unclaimedPagination.value.limit = parseInt(unclaimedPagination.value.limit); }
function changeReturnedPage(page) { returnedPagination.value.page = page; }
function changeReturnedLimit() { returnedPagination.value.page = 1; returnedPagination.value.limit = parseInt(returnedPagination.value.limit); }
function toggleExpand(id) { expandedRow.value = expandedRow.value === id ? null : id; }
function toggleCompensationHistory(id) { showCompHistoryId.value = showCompHistoryId.value === id ? null : id; }
function selectDept(dept) { selectedDept.value = dept; showDeptDropdown.value = false; payrollPagination.value.page = 1; }
function toggleSelectAllPayments() { filteredPaymentQueue.value.forEach(e => e.selected = selectAllPayment.value); }
function refreshData() { refreshing.value = true; setTimeout(() => { calculatePayroll(); refreshing.value = false; showToastMessage("Data refreshed!", "success"); }, 500); }
function openBatchPenaltyModal() { if (filteredPenaltiesList.value.length) showBatchPenaltyModal.value = true; }

// ==================== DEMO DATA GENERATION ====================
function generateDemoData() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().slice(0, 7);
  const months = [currentMonth, lastMonth, twoMonthsAgo];
  
  months.forEach(month => {
    penaltiesList.value = penaltiesList.value.filter(p => p.month !== month);
    employeesData.forEach(emp => {
      let penaltyPercent = 0, penaltyAmount = 0;
      if (month === currentMonth) {
        if (emp.id === 1) { penaltyPercent = 5; penaltyAmount = 1250; }
        else if (emp.id === 2) { penaltyPercent = 3; penaltyAmount = 1050; }
        else if (emp.id === 5) { penaltyPercent = 2; penaltyAmount = 0; }
        else if (emp.id === 6) { penaltyPercent = 0; penaltyAmount = 500; }
        else if (emp.id === 8) { penaltyPercent = 4; penaltyAmount = 0; }
      } else if (month === lastMonth) {
        if (emp.id === 1) { penaltyPercent = 4; penaltyAmount = 1000; }
        else if (emp.id === 3) { penaltyPercent = 2; penaltyAmount = 0; }
        else if (emp.id === 4) { penaltyPercent = 0; penaltyAmount = 750; }
        else if (emp.id === 7) { penaltyPercent = 1; penaltyAmount = 0; }
      } else if (month === twoMonthsAgo) {
        if (emp.id === 2) { penaltyPercent = 2; penaltyAmount = 700; }
        else if (emp.id === 3) { penaltyPercent = 3; penaltyAmount = 840; }
        else if (emp.id === 8) { penaltyPercent = 0; penaltyAmount = 300; }
        else if (emp.id === 9) { penaltyPercent = 1; penaltyAmount = 0; }
      }
      if (penaltyPercent > 0 || penaltyAmount > 0) {
        penaltiesList.value.push({ id: Date.now() + emp.id + month, employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, department: emp.department, month, penaltyPercent, penaltyAmount });
      }
    });
  });
  
  holds.value = [];
  holds.value.push({ employeeId: 1, startMonth: lastMonth, duration: 2, reason: "Pending disciplinary investigation", startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split("T")[0] });
  holds.value.push({ employeeId: 3, startMonth: currentMonth, duration: 1, reason: "Awaiting document submission", startDate: new Date().toISOString().split("T")[0] });
  holds.value.push({ employeeId: 7, startMonth: lastMonth, duration: 3, reason: "Salary dispute under review", startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0] });
  holds.value.push({ employeeId: 8, startMonth: currentMonth, duration: 1, reason: "Bank account verification pending", startDate: new Date().toISOString().split("T")[0] });
  
  if (paymentHistory.value.length === 0) {
    const demoDate = new Date(); demoDate.setMonth(demoDate.getMonth() - 1);
    employeesData.slice(0, 5).forEach((emp, idx) => {
      paymentHistory.value.push({ id: Date.now() + idx, employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, department: emp.department, amount: emp.basicSalary * 0.7, paymentDate: demoDate.toISOString().split("T")[0], month: demoDate.toISOString().slice(0, 7), method: idx % 2 === 0 ? "Bank Transfer" : "Cash", transactionId: `TXN${10000 + idx}` });
    });
  }
  
  if (unclaimedList.value.length === 0) {
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() - 25);
    employeesData.slice(0, 3).forEach((emp, idx) => {
      unclaimedList.value.push({ id: Date.now() + idx, employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, department: emp.department, amount: emp.basicSalary * 0.7, dueDate: dueDate.toISOString().split("T")[0], month: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().slice(0, 7), daysOverdue: 25 });
    });
  }
  
  if (returnedList.value.length === 0) {
    const returnDate = new Date(); returnDate.setDate(returnDate.getDate() - 10);
    employeesData.slice(3, 5).forEach((emp, idx) => {
      returnedList.value.push({ id: Date.now() + idx, employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, department: emp.department, amount: emp.basicSalary * 0.7, dueDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0], returnDate: returnDate.toISOString().split("T")[0], month: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7), daysLate: 10 });
    });
  }
}

function initDemoCompensationHistory() {
  if (compensationHistory.value.length === 0) {
    employeesData.forEach(emp => {
      const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split("T")[0];
      const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0];
      const threeMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split("T")[0];
      compensationHistory.value.push({ id: Date.now() + emp.id + 1, employeeId: emp.id, changeDate: threeMonthsAgo, component: "Basic Salary", oldValue: emp.basicSalary - 3000, newValue: emp.basicSalary - 1000, changeType: "increase", percentageChange: Math.round((2000 / (emp.basicSalary - 3000)) * 100), difference: 2000, submittedBy: "HR Manager" });
      compensationHistory.value.push({ id: Date.now() + emp.id + 2, employeeId: emp.id, changeDate: oneMonthAgo, component: "Basic Salary", oldValue: emp.basicSalary - 1000, newValue: emp.basicSalary, changeType: "increase", percentageChange: Math.round((1000 / (emp.basicSalary - 1000)) * 100), difference: 1000, submittedBy: "Finance Director" });
      const oldHousing = Math.floor(emp.basicSalary * 0.18); const newHousing = Math.floor(emp.basicSalary * 0.2);
      compensationHistory.value.push({ id: Date.now() + emp.id + 3, employeeId: emp.id, changeDate: twoMonthsAgo, component: "Housing Allowance", oldValue: oldHousing, newValue: newHousing, changeType: "increase", percentageChange: Math.round(((newHousing - oldHousing) / oldHousing) * 100), difference: newHousing - oldHousing, submittedBy: "HR Manager" });
      const oldPosition = Math.floor(emp.basicSalary * 0.12); const newPosition = Math.floor(emp.basicSalary * 0.15);
      compensationHistory.value.push({ id: Date.now() + emp.id + 5, employeeId: emp.id, changeDate: threeMonthsAgo, component: "Position Allowance", oldValue: oldPosition, newValue: newPosition, changeType: "increase", percentageChange: Math.round(((newPosition - oldPosition) / oldPosition) * 100), difference: newPosition - oldPosition, submittedBy: "CEO" });
    });
  }
}

// ==================== INITIALIZATION ====================
function init() {
  const currentDate = new Date();
  selectedMonth.value = currentDate.toISOString().slice(0, 7);
  penaltySelectedMonth.value = currentDate.toISOString().slice(0, 7);
  onHoldSelectedMonth.value = currentDate.toISOString().slice(0, 7);
  generateDemoData();
  calculatePayroll();
  initDemoCompensationHistory();
}

// ==================== LIFECYCLE ====================
onMounted(() => { init(); document.addEventListener("click", handleClickOutside); });
onUnmounted(() => { document.removeEventListener("click", handleClickOutside); });
</script>

<style scoped>
/* Bulk Release Container */
.bulk-release-container {
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.bulk-release-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #eff6ff;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
}

.selected-count {
  font-size: 13px;
  font-weight: 500;
  color: #1e40af;
}

.selected-count span {
  background: #dbeafe;
  padding: 4px 10px;
  border-radius: 20px;
}
/* Batch Penalty Config Modal Styles */
.batch-penalty-config-modal {
  max-width: 900px;
}

.modal-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.rules-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.section-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.section-unit {
  font-size: 12px;
  color: #64748b;
}

.rules-table {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
}

.rules-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f1f5f9;
  border-radius: 8px;
}

.rule-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 10px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.rule-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.rule-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.range-input {
  width: 110px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  transition: all 0.2s;
}

.range-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.range-sep {
  color: #94a3b8;
  font-weight: 500;
}

.range-unit {
  font-size: 12px;
  color: #64748b;
  margin-left: 4px;
}

.rule-arrow {
  color: #3b82f6;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.rule-reduction {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.reduction-input {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}

.reduction-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.reduction-unit {
  font-size: 12px;
  color: #64748b;
}

.remove-rule-btn {
  background: #fee2e2;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  color: #dc2626;
  transition: all 0.2s;
  font-weight: 500;
}

.remove-rule-btn:hover {
  background: #fecaca;
}

.add-rule-btn {
  width: 100%;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #3b82f6;
  transition: all 0.2s;
  font-weight: 500;
}

.add-rule-btn:hover {
  background: #e2e8f0;
  border-color: #3b82f6;
}

.preview-summary {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
  border-radius: 12px;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #1e40af;
}
/* ==================== BASE STYLES ==================== */
.payroll-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.payroll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 24px;
  border-radius: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo-icon {
  font-size: 36px;
}
.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}
.header-left p {
  font-size: 12px;
  color: #64748b;
  margin: 4px 0 0;
}
.header-actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}
.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-export:hover:not(:disabled) {
  background: #059669;
}
.btn-success {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-small {
  padding: 4px 12px;
  font-size: 11px;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
}
.btn-small.primary {
  background: #3b82f6;
}
.btn-small.success {
  background: #10b981;
}
.btn-warning-small {
  padding: 6px 12px;
  font-size: 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}
.icon-btn:hover {
  background: #f1f5f9;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-number {
  font-size: 22px;
  font-weight: 700;
}
.stat-text {
  font-size: 11px;
  color: #64748b;
  margin-top: 6px;
}

.stats-mini-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.stat-mini-card {
  background: #f8fafc;
  padding: 16px 24px;
  border-radius: 12px;
  flex: 1;
  text-align: center;
}
.stat-mini-value {
  font-size: 24px;
  font-weight: 700;
}
.stat-mini-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.tabs-container {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background: white;
  padding: 6px;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.tab-btn {
  flex: 1;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  text-align: center;
}
.tab-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}
.tab-btn.active {
  background: #3b82f6;
  color: white;
}

.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.card-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.header-filters,
.filters-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.dropdown-card {
  position: relative;
}
.dropdown-trigger {
  padding: 8px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.dropdown-menu-card {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 240px;
  margin-top: 8px;
  overflow: hidden;
}
.dropdown-header {
  padding: 10px 16px;
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  border-bottom: 1px solid #e2e8f0;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.dropdown-item:hover {
  background: #f8fafc;
}
.dropdown-item.active {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}
.dropdown-item .count {
  margin-left: auto;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
}
.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.search-box {
  position: relative;
}
.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  width: 220px;
  background: #f8fafc;
  transition: all 0.2s;
}
.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

.table-container {
  overflow-x: auto;
}
.payroll-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 900px;
}
.payroll-table th,
.payroll-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}
.payroll-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.employee-cell .employee-code {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.badge-hold {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  display: inline-block;
}
.badge-active {
  background: #d1fae5;
  color: #059669;
  padding: 4px 8px;
  border-radius: 20px;
  display: inline-block;
}
.method-badge {
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.text-orange {
  color: #f59e0b;
}
.text-blue {
  color: #3b82f6;
}
.text-red {
  color: #ef4444;
}
.text-green {
  color: #10b981;
}
.text-purple {
  color: #8b5cf6;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
}
.expand-btn:hover {
  background: #e0e7ff;
}
.expanded-row {
  background: #f8fafc;
}
.detail-expand-row td {
  padding: 0 !important;
}
.expand-details {
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin: 8px;
  border: 1px solid #e2e8f0;
}

.edit-section {
  margin-bottom: 20px;
}
.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.edit-header h4 {
  margin: 0;
  font-size: 14px;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
  font-weight: 600;
}
.compensation-toggle {
  cursor: pointer;
  font-size: 12px;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 4px;
}
.edit-fields {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.field label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}
.field input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}

.compensation-history {
  margin-top: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}
.compensation-history h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}
.history-entry {
  display: flex;
  gap: 16px;
  padding: 10px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  align-items: center;
  flex-wrap: wrap;
}
.history-date {
  font-size: 11px;
  color: #64748b;
  min-width: 80px;
}
.history-component {
  font-weight: 500;
  font-size: 12px;
  min-width: 100px;
}
.history-values {
  display: flex;
  align-items: center;
  gap: 6px;
}
.old-value {
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 11px;
}
.new-value {
  font-weight: 600;
  color: #10b981;
}
.arrow {
  color: #94a3b8;
}
.history-change {
  font-size: 12px;
  min-width: 100px;
}
.history-submitted {
  font-size: 10px;
  color: #94a3b8;
}
.history-empty {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
}

/* Detail Layout Styles */
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-row-two-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.detail-card h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

.detail-card > div {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.detail-card .total {
  border-top: 2px solid #e2e8f0;
  border-bottom: none;
  margin-top: 8px;
  padding-top: 10px;
  font-weight: 600;
}

.deduction-item-detail {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.deduction-name {
  font-weight: 500;
  font-size: 12px;
}

.deduction-amount {
  font-size: 12px;
  margin-top: 2px;
}

.deduction-meta {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.no-deductions {
  text-align: center;
  padding: 12px;
  color: #94a3b8;
  font-size: 12px;
}

/* Final Net Pay Card */
.final-net-card {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #10b981;
  margin-top: 8px;
}

.final-net-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 700;
  color: #065f46;
  text-align: center;
}

.calculation-summary {
  max-width: 400px;
  margin: 0 auto;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
}

.calc-row.total {
  font-weight: 700;
  font-size: 14px;
}

.calc-row.final {
  font-weight: 800;
  font-size: 18px;
  margin-top: 8px;
}

.calc-divider {
  height: 1px;
  background: rgba(16, 185, 129, 0.3);
  margin: 4px 0;
}

.final-amount {
  font-size: 24px;
  font-weight: 800;
  color: #065f46;
}

.hold-note {
  background: #fee2e2;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  margin-top: 16px;
  color: #dc2626;
  font-size: 13px;
}

.payment-info-bar {
  background: #dbeafe;
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 16px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}
.info-group {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 12px;
  color: #64748b;
}
.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}
.modal-header.gradient-header {
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  border-bottom: none;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1e293b;
}

.process-modal {
  max-width: 500px;
}
.header-icon {
  font-size: 40px;
  margin-right: 16px;
}
.header-title h3 {
  margin: 0;
  font-size: 20px;
}
.header-title p {
  margin: 4px 0 0;
  opacity: 0.8;
  font-size: 12px;
}

.payment-method-modal {
  max-width: 480px;
}
.employee-info-card-styled {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.emp-avatar-small {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: white;
}
.emp-details {
  flex: 1;
}
.emp-name {
  font-weight: 600;
  font-size: 16px;
}
.emp-code {
  font-size: 11px;
  color: #64748b;
}
.emp-dept {
  font-size: 11px;
  color: #94a3b8;
}
.emp-amount-large {
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
}

.payment-options-styled {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.payment-option-styled {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.payment-option-styled:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}
.payment-option-styled.active {
  border-color: #3b82f6;
  background: #eff6ff;
}
.option-radio input {
  margin: 0;
}
.option-icon {
  font-size: 28px;
}
.option-info {
  flex: 1;
}
.option-label {
  font-weight: 600;
  font-size: 14px;
}
.option-desc {
  font-size: 11px;
  color: #64748b;
}

.penalty-reduction-modal {
  max-width: 500px;
}
.current-penalty-info {
  background: #fef2f2;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}
.input-hint {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.batch-penalty-config-modal {
  max-width: 600px;
}
.rules-section {
  margin-bottom: 24px;
}
.rules-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rule-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  flex-wrap: wrap;
}
.rule-range {
  font-size: 12px;
  min-width: 140px;
}
.rule-arrow {
  color: #94a3b8;
}
.rule-reduction-input {
  width: 100px;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
}
.rule-unit {
  font-size: 12px;
}
.remove-rule-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
  font-size: 14px;
  padding: 4px;
  border-radius: 4px;
}
.remove-rule-btn:hover {
  background: #fee2e2;
}
.add-rule-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #3b82f6;
  width: 100%;
}
.add-rule-btn:hover {
  background: #e2e8f0;
}

.info-banner {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.preview-summary {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
}
.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.deduction-modal {
  max-width: 750px;
}
.employee-info-compact {
  display: flex;
  align-items: center;
  gap: 12px;
}
.emp-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}
.emp-meta {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}
.summary-stats {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}
.stat-row.total {
  border-top: 2px solid #e2e8f0;
  border-bottom: none;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: 700;
}
.deductions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.deduction-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}
.deduction-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 500;
  font-size: 13px;
}
.deduction-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.deduction-fields select,
.deduction-fields input {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  width: 100%;
}
.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
  font-size: 14px;
  padding: 4px;
  border-radius: 4px;
}
.add-btn {
  width: 100%;
  padding: 10px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  color: #3b82f6;
  margin-top: 12px;
  transition: all 0.2s;
}

.hold-section {
  margin-bottom: 20px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  margin-bottom: 12px;
}
.hold-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}
.duration-buttons {
  display: flex;
  gap: 8px;
}
.duration-btn {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.duration-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.batch-modal {
  max-width: 500px;
}
.batch-summary {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.batch-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.batch-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

.export-modal {
  max-width: 400px;
}
.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

.form-field {
  margin-bottom: 20px;
}
.form-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1e293b;
}
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  transition: all 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: white;
}
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.setting-item label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}
.summary-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-around;
}
.summary-item {
  text-align: center;
}
.summary-item span {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}
.summary-item strong {
  font-size: 18px;
}

.warning-message {
  background: #fef3c7;
  border-radius: 10px;
  padding: 12px;
  margin-top: 16px;
  font-size: 13px;
  color: #d97706;
}
.status-badge-container {
  margin-top: 8px;
}
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}
.status-badge.success {
  background: #d1fae5;
  color: #059669;
}
.status-badge.warning {
  background: #fef3c7;
  color: #d97706;
}
.status-badge.info {
  background: #dbeafe;
  color: #2563eb;
}

.empty-state-cell {
  text-align: center;
  padding: 60px 20px;
}
.empty-state-content {
  text-align: center;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state-content p {
  color: #94a3b8;
  margin: 0;
}
.empty-sub {
  font-size: 12px;
  margin-top: 8px;
  color: #cbd5e1;
}

.total-footer {
  background: #f8fafc;
  font-weight: 600;
}
.total-footer td {
  padding: 12px 10px;
  border-top: 2px solid #e2e8f0;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
}
.toast.error {
  border-left-color: #ef4444;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .detail-row-two-cols {
    grid-template-columns: 1fr;
  }
  .edit-fields {
    grid-template-columns: repeat(2, 1fr);
  }
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .deduction-fields {
    grid-template-columns: 1fr;
  }
  .tab-btn {
    font-size: 12px;
    padding: 8px 12px;
  }
}
@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .tab-btn {
    padding: 8px;
  }
}
</style>
