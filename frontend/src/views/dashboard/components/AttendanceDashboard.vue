<template>
  <div class="hr-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1>Attendance Dashboard</h1>
        <p>Overview of attendance,leave and employees activities</p>
      </div>
      <div class="header-right">
        <div class="date-display">
          <span class="date-icon">📅</span>
          <span class="date-text">{{ formatDate(new Date()) }}</span>
        </div>
        <select
          v-model="selectedMonth"
          class="month-selector"
          @change="refreshData"
        >
          <option v-for="m in availableMonths" :key="m.value" :value="m.value">
            {{ m.name }}
          </option>
        </select>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card" @click="goToAttendance">
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalEmployees }}</div>
          <div class="stat-label">Total Employees</div>
        </div>
      </div>
      <div class="stat-card" @click="goToAttendance">
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgAttendanceRate }}%</div>
          <div class="stat-label">Avg Attendance Rate</div>
          <div class="stat-sub">{{ stats.monthName }}</div>
        </div>
      </div>
      <div class="stat-card" @click="goToAttendance">
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalPresentDays }}</div>
          <div class="stat-label">Total Present Days</div>
          <div class="stat-sub">this month</div>
        </div>
      </div>
      <div class="stat-card" @click="goToLeaves">
        <div class="stat-info">
          <div class="stat-value">{{ stats.onLeaveToday }}</div>
          <div class="stat-label">On Leave Today</div>
          <div class="stat-sub">{{ stats.approvedLeaves }} approved total</div>
        </div>
      </div>
      <div class="stat-card" @click="goToLeaves">
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingRequests }}</div>
          <div class="stat-label">Pending Requests</div>
          <div class="stat-sub">Leave requests waiting</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <div class="stat-value">{{ stats.overdueReturns }}</div>
          <div class="stat-label">Overdue Returns</div>
          <div class="stat-sub">Need attention</div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon green">📊</div>
        <div class="summary-content">
          <div class="summary-value">{{ stats.monthlyAttendanceRate }}%</div>
          <div class="summary-label">Monthly Attendance Rate</div>
          <div class="summary-trend positive">
            ↑ {{ stats.attendanceTrend }}% vs last month
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon orange">📅</div>
        <div class="summary-content">
          <div class="summary-value">{{ stats.totalLeaveDaysThisMonth }}</div>
          <div class="summary-label">Leave Days Taken</div>
          <div class="summary-trend">
            {{ stats.avgLeavePerEmployee }} avg per employee
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon purple">👥</div>
        <div class="summary-content">
          <div class="summary-value">{{ stats.departmentsWithLeave }}</div>
          <div class="summary-label">Departments with Leave</div>
          <div class="summary-trend">
            Out of {{ stats.totalDepartments }} departments
          </div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon blue">⚖️</div>
        <div class="summary-content">
          <div class="summary-value">{{ stats.avgAvailableLeave }} days</div>
          <div class="summary-label">Average Available Leave</div>
          <div class="summary-trend warning">
            {{ stats.lowBalanceCount }} employees low
          </div>
        </div>
      </div>
    </div>

    <!-- Department Analytics - 2x2 Grid -->
    <div class="dept-analytics-full">
      <h3 class="section-title">📊 Department Analytics</h3>
      <div class="analytics-full-grid">
        <div class="analytics-full-card">
          <div class="analytics-full-header">
            <span class="analytics-full-icon">⏰</span>
            <span>Highest OT Departments</span>
          </div>
          <div class="analytics-full-list scrollable-content">
            <div
              v-for="dept in topOTDepartments"
              :key="dept.name"
              class="analytics-full-item"
            >
              <div class="analytics-full-rank">{{ dept.rank }}</div>
              <div class="analytics-full-name">{{ dept.name }}</div>
              <div class="analytics-full-bar">
                <div
                  class="analytics-full-fill"
                  :style="{
                    width: dept.percentage + '%',
                    background: '#10b981',
                  }"
                ></div>
              </div>
              <div class="analytics-full-value">{{ dept.hours }} hrs</div>
            </div>
          </div>
        </div>

        <div class="analytics-full-card">
          <div class="analytics-full-header">
            <span class="analytics-full-icon">❌</span>
            <span>Highest Absence Departments</span>
          </div>
          <div class="analytics-full-list scrollable-content">
            <div
              v-for="dept in topAbsentDepartments"
              :key="dept.name"
              class="analytics-full-item"
            >
              <div class="analytics-full-rank">{{ dept.rank }}</div>
              <div class="analytics-full-name">{{ dept.name }}</div>
              <div class="analytics-full-bar">
                <div
                  class="analytics-full-fill"
                  :style="{
                    width: dept.percentage + '%',
                    background: '#ef4444',
                  }"
                ></div>
              </div>
              <div class="analytics-full-value">{{ dept.days }} days</div>
            </div>
          </div>
        </div>

        <div class="analytics-full-card">
          <div class="analytics-full-header">
            <span class="analytics-full-icon">📋</span>
            <span>Highest Leave Departments</span>
          </div>
          <div class="analytics-full-list scrollable-content">
            <div
              v-for="dept in topLeaveDepartments"
              :key="dept.name"
              class="analytics-full-item"
            >
              <div class="analytics-full-rank">{{ dept.rank }}</div>
              <div class="analytics-full-name">{{ dept.name }}</div>
              <div class="analytics-full-bar">
                <div
                  class="analytics-full-fill"
                  :style="{
                    width: dept.percentage + '%',
                    background: '#f59e0b',
                  }"
                ></div>
              </div>
              <div class="analytics-full-value">{{ dept.days }} days</div>
            </div>
          </div>
        </div>

        <div class="analytics-full-card">
          <div class="analytics-full-header">
            <span class="analytics-full-icon">⏰</span>
            <span>Highest Late Departments</span>
          </div>
          <div class="analytics-full-list scrollable-content">
            <div
              v-for="dept in topLateDepartments"
              :key="dept.name"
              class="analytics-full-item"
            >
              <div class="analytics-full-rank">{{ dept.rank }}</div>
              <div class="analytics-full-name">{{ dept.name }}</div>
              <div class="analytics-full-bar">
                <div
                  class="analytics-full-fill"
                  :style="{
                    width: dept.percentage + '%',
                    background: '#8b5cf6',
                  }"
                ></div>
              </div>
              <div class="analytics-full-value">{{ dept.count }} times</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Department Leave Distribution - Horizontal Bar Chart -->
    <div class="dept-distribution-full">
      <div class="distribution-header">
        <h3>🏢 Department Leave Distribution</h3>
        <router-link to="/approved-leaves" class="view-link"
          >View Details →</router-link
        >
      </div>
      <div class="distribution-list scrollable-distribution">
        <div
          v-for="dept in deptLeaveStats"
          :key="dept.name"
          class="distribution-item-horizontal"
        >
          <div class="distribution-meta">
            <span class="distribution-name">{{ dept.name }}</span>
            <span class="distribution-stats-text"
              >{{ dept.leaveDays }} days ·
              {{ dept.employeeCount }} employees</span
            >
          </div>
          <div class="distribution-bar-wrapper">
            <div class="distribution-bar">
              <div
                class="distribution-fill"
                :style="{
                  width: dept.percentage + '%',
                  background: dept.color,
                }"
              ></div>
            </div>
            <span class="distribution-percent">{{ dept.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="two-column-layout">
      <!-- Left Column -->
      <div class="left-column">
        <!-- Overdue Returns List -->
        <div class="section-card overdue-section">
          <div class="section-header">
            <h3>⚠️ Overdue Returns</h3>
            <span class="badge danger"
              >{{ overdueReturnsList.length }} employees</span
            >
          </div>
          <div class="scrollable-list" v-if="overdueReturnsList.length > 0">
            <div
              v-for="item in overdueReturnsList"
              :key="item.id"
              class="list-item overdue-item"
            >
              <div class="list-avatar overdue-avatar">
                {{ getInitials(item.employeeName) }}
              </div>
              <div class="list-info">
                <div class="list-name">{{ item.employeeName }}</div>
                <div class="list-detail">
                  {{ item.leaveType }} • Expected:
                  {{ formatDate(item.expectedReturn) }}
                </div>
              </div>
              <div class="overdue-days">
                <span class="days-badge">{{ item.daysOverdue }} days</span>
              </div>
              <button class="btn-small warning" @click="markAsReturned(item)">
                Return
              </button>
            </div>
          </div>
          <div v-else class="empty-state-small">
            ✅ All employees have returned on time
          </div>
        </div>

        <!-- Today's Leave Schedule -->
        <div class="section-card">
          <div class="section-header">
            <h3>📋 Today's Leave Schedule</h3>
            <router-link to="/approved-leaves" class="view-link"
              >View All →</router-link
            >
          </div>
          <div class="scrollable-list">
            <div
              v-for="leave in todayLeaves"
              :key="leave.leaveRequestId"
              class="list-item"
            >
              <div class="list-avatar">
                {{ getInitials(leave.employeeName) }}
              </div>
              <div class="list-info">
                <div class="list-name">{{ leave.employeeName }}</div>
                <div class="list-detail">
                  {{ leave.leaveType }} • Returns
                  {{ formatDate(leave.returnDate) }}
                </div>
              </div>
              <div class="list-status">
                <span class="status-badge on-leave">On Leave</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Leaves -->
        <div class="section-card">
          <div class="section-header">
            <h3>📅 Upcoming Leaves (Next 7 Days)</h3>
            <router-link to="/approved-leaves" class="view-link"
              >View All →</router-link
            >
          </div>
          <div class="scrollable-list">
            <div
              v-for="leave in upcomingLeaves"
              :key="leave.leaveRequestId"
              class="list-item"
            >
              <div class="upcoming-date">
                <div class="date-day">{{ getDayOfMonth(leave.startDate) }}</div>
                <div class="date-month">
                  {{ getMonthAbbr(leave.startDate) }}
                </div>
              </div>
              <div class="list-avatar-small">
                {{ getInitials(leave.employeeName) }}
              </div>
              <div class="list-info">
                <div class="list-name">{{ leave.employeeName }}</div>
                <div class="list-detail">
                  {{ leave.leaveType }} • {{ leave.totalDays }} days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="right-column">
        <!-- Pending Leave Requests -->
        <div class="section-card">
          <div class="section-header">
            <h3>⏳ Pending Leave Requests</h3>
            <router-link to="/leaves" class="view-link">View All →</router-link>
          </div>
          <div class="scrollable-list">
            <div
              v-for="request in pendingLeaves"
              :key="request.leaveRequestId"
              class="list-item"
            >
              <div class="list-avatar">
                {{ getInitials(request.employeeName) }}
              </div>
              <div class="list-info">
                <div class="list-name">{{ request.employeeName }}</div>
                <div class="list-detail">
                  {{ request.leaveType }} • {{ request.totalDays }} days
                </div>
                <div class="list-date">
                  Requested: {{ formatDate(request.requestedDate) }}
                </div>
              </div>
              <div class="list-actions">
                <button
                  class="btn-small success"
                  @click="quickApprove(request)"
                >
                  Approve
                </button>
                <button class="btn-small danger" @click="quickReject(request)">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Late Employees -->
        <div class="section-card">
          <div class="section-header">
            <h3>⏰ Top Late Employees ({{ stats.monthName }})</h3>
            <router-link to="/attendance" class="view-link"
              >View All →</router-link
            >
          </div>
          <div class="scrollable-list">
            <div
              v-for="(emp, idx) in topLateEmployees"
              :key="emp.id"
              class="list-item"
            >
              <div class="top-rank">{{ idx + 1 }}</div>
              <div class="list-avatar">{{ getInitials(emp.name) }}</div>
              <div class="list-info">
                <div class="list-name">{{ emp.name }}</div>
                <div class="list-detail">{{ emp.department }}</div>
              </div>
              <div class="top-value">
                <div class="late-count">{{ emp.lateCount }} times</div>
                <div class="late-minutes">{{ emp.totalLateMinutes }} min</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Absent Employees -->
        <div class="section-card">
          <div class="section-header">
            <h3>❌ Top Absent Employees ({{ stats.monthName }})</h3>
            <router-link to="/attendance" class="view-link"
              >View All →</router-link
            >
          </div>
          <div class="scrollable-list">
            <div
              v-for="(emp, idx) in topAbsentEmployees"
              :key="emp.id"
              class="list-item"
            >
              <div class="top-rank">{{ idx + 1 }}</div>
              <div class="list-avatar">{{ getInitials(emp.name) }}</div>
              <div class="list-info">
                <div class="list-name">{{ emp.name }}</div>
                <div class="list-detail">{{ emp.department }}</div>
              </div>
              <div class="top-value absent">
                <div class="absent-count">{{ emp.absentDays }} days</div>
                <div class="absent-percent">{{ emp.absentPercent }}% rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span class="toast-icon">{{ toastIcon }}</span>
      <span class="toast-message">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// State
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
const toastIcon = ref("✅");
const selectedMonth = ref("2026-05");

// Available months
const availableMonths = ref([
  { value: "2026-01", name: "January 2026" },
  { value: "2026-02", name: "February 2026" },
  { value: "2026-03", name: "March 2026" },
  { value: "2026-04", name: "April 2026" },
  { value: "2026-05", name: "May 2026" },
  { value: "2026-06", name: "June 2026" },
]);

// ==================== DEPARTMENT ANALYTICS DATA ====================

const topOTDepartments = ref([
  { rank: 1, name: "IT", hours: 245, percentage: 100 },
  { rank: 2, name: "Operations", hours: 189, percentage: 77 },
  { rank: 3, name: "Finance", hours: 156, percentage: 64 },
  { rank: 4, name: "Sales", hours: 98, percentage: 40 },
  { rank: 5, name: "HR", hours: 67, percentage: 27 },
  { rank: 6, name: "Marketing", hours: 45, percentage: 18 },
  { rank: 7, name: "Customer Support", hours: 34, percentage: 14 },
]);

const topAbsentDepartments = ref([
  { rank: 1, name: "Operations", days: 45, percentage: 100 },
  { rank: 2, name: "IT", days: 38, percentage: 84 },
  { rank: 3, name: "Finance", days: 28, percentage: 62 },
  { rank: 4, name: "Sales", days: 22, percentage: 49 },
  { rank: 5, name: "HR", days: 15, percentage: 33 },
  { rank: 6, name: "Marketing", days: 12, percentage: 27 },
  { rank: 7, name: "Customer Support", days: 8, percentage: 18 },
]);

const topLeaveDepartments = ref([
  { rank: 1, name: "IT", days: 98, percentage: 100 },
  { rank: 2, name: "Finance", days: 76, percentage: 78 },
  { rank: 3, name: "Operations", days: 65, percentage: 66 },
  { rank: 4, name: "HR", days: 42, percentage: 43 },
  { rank: 5, name: "Sales", days: 38, percentage: 39 },
  { rank: 6, name: "Marketing", days: 28, percentage: 29 },
  { rank: 7, name: "Customer Support", days: 22, percentage: 22 },
]);

const topLateDepartments = ref([
  { rank: 1, name: "IT", count: 45, percentage: 100 },
  { rank: 2, name: "Sales", count: 32, percentage: 71 },
  { rank: 3, name: "Finance", count: 28, percentage: 62 },
  { rank: 4, name: "Operations", count: 24, percentage: 53 },
  { rank: 5, name: "HR", count: 12, percentage: 27 },
  { rank: 6, name: "Marketing", count: 10, percentage: 22 },
  { rank: 7, name: "Customer Support", count: 6, percentage: 13 },
]);

const deptLeaveStats = ref([
  {
    name: "IT",
    leaveDays: 98,
    percentage: 98,
    color: "#3b82f6",
    employeeCount: 45,
  },
  {
    name: "Finance",
    leaveDays: 76,
    percentage: 76,
    color: "#10b981",
    employeeCount: 32,
  },
  {
    name: "Operations",
    leaveDays: 65,
    percentage: 65,
    color: "#f59e0b",
    employeeCount: 38,
  },
  {
    name: "HR",
    leaveDays: 42,
    percentage: 42,
    color: "#ef4444",
    employeeCount: 15,
  },
  {
    name: "Sales",
    leaveDays: 38,
    percentage: 38,
    color: "#8b5cf6",
    employeeCount: 26,
  },
  {
    name: "Marketing",
    leaveDays: 31,
    percentage: 31,
    color: "#ec4899",
    employeeCount: 18,
  },
  {
    name: "Customer Support",
    leaveDays: 25,
    percentage: 25,
    color: "#06b6d4",
    employeeCount: 22,
  },
]);

const overdueReturnsList = ref([
  {
    id: 1,
    employeeName: "Tamrat Zerihun",
    leaveType: "Annual Leave",
    expectedReturn: "2026-05-18",
    daysOverdue: 3,
  },
  {
    id: 2,
    employeeName: "Nuru Seid",
    leaveType: "Sick Leave",
    expectedReturn: "2026-05-19",
    daysOverdue: 2,
  },
  {
    id: 3,
    employeeName: "Tadese Jemberu",
    leaveType: "Bereavement Leave",
    expectedReturn: "2026-05-20",
    daysOverdue: 1,
  },
  {
    id: 4,
    employeeName: "Melkamu Zewdu",
    leaveType: "Maternity Leave",
    expectedReturn: "2026-05-15",
    daysOverdue: 6,
  },
  {
    id: 5,
    employeeName: "Biruk Mulualem",
    leaveType: "Annual Leave",
    expectedReturn: "2026-05-10",
    daysOverdue: 11,
  },
]);

const todayLeaves = ref([
  {
    leaveRequestId: 1,
    employeeName: "Biruk Mulualem",
    leaveType: "Annual Leave",
    returnDate: "2026-05-25",
  },
  {
    leaveRequestId: 2,
    employeeName: "Melkamu Zewdu",
    leaveType: "Maternity Leave",
    returnDate: "2026-07-20",
  },
  {
    leaveRequestId: 3,
    employeeName: "Dagmawi Hadgu",
    leaveType: "Sick Leave",
    returnDate: "2026-05-22",
  },
  {
    leaveRequestId: 4,
    employeeName: "Nuru Seid",
    leaveType: "Annual Leave",
    returnDate: "2026-05-28",
  },
  {
    leaveRequestId: 5,
    employeeName: "Eshete Worke",
    leaveType: "Sick Leave",
    returnDate: "2026-05-23",
  },
  {
    leaveRequestId: 6,
    employeeName: "Haymanot Abebaw",
    leaveType: "Annual Leave",
    returnDate: "2026-06-01",
  },
  {
    leaveRequestId: 7,
    employeeName: "Tigist Mulugeta",
    leaveType: "Sick Leave",
    returnDate: "2026-05-24",
  },
]);

const upcomingLeaves = ref([
  {
    leaveRequestId: 6,
    employeeName: "Dagmawi Hadgu",
    leaveType: "Annual Leave",
    totalDays: 5,
    startDate: "2026-05-28",
  },
  {
    leaveRequestId: 7,
    employeeName: "Melaku Tewodros",
    leaveType: "Sick Leave",
    totalDays: 3,
    startDate: "2026-05-30",
  },
  {
    leaveRequestId: 8,
    employeeName: "Tamrat Zerihun",
    leaveType: "Annual Leave",
    totalDays: 7,
    startDate: "2026-06-01",
  },
  {
    leaveRequestId: 9,
    employeeName: "Tadese Jemberu",
    leaveType: "Bereavement Leave",
    totalDays: 3,
    startDate: "2026-05-29",
  },
  {
    leaveRequestId: 10,
    employeeName: "Nuru Seid",
    leaveType: "Annual Leave",
    totalDays: 4,
    startDate: "2026-06-03",
  },
  {
    leaveRequestId: 11,
    employeeName: "Eshete Worke",
    leaveType: "Sick Leave",
    totalDays: 2,
    startDate: "2026-06-02",
  },
]);

const pendingLeaves = ref([
  {
    leaveRequestId: 10,
    employeeName: "Tamrat Zerihun",
    leaveType: "Annual Leave",
    totalDays: 3,
    requestedDate: "2026-05-20",
  },
  {
    leaveRequestId: 11,
    employeeName: "Nuru Seid",
    leaveType: "Sick Leave",
    totalDays: 2,
    requestedDate: "2026-05-21",
  },
  {
    leaveRequestId: 12,
    employeeName: "Eshete Worke",
    leaveType: "Annual Leave",
    totalDays: 4,
    requestedDate: "2026-05-19",
  },
  {
    leaveRequestId: 13,
    employeeName: "Tigist Mulugeta",
    leaveType: "Sick Leave",
    totalDays: 1,
    requestedDate: "2026-05-22",
  },
  {
    leaveRequestId: 14,
    employeeName: "Melaku Tewodros",
    leaveType: "Annual Leave",
    totalDays: 5,
    requestedDate: "2026-05-18",
  },
]);

const recentActivities = ref([
  {
    id: 1,
    icon: "✅",
    text: "Biruk Mulualem marked present",
    time: "10 min ago",
  },
  {
    id: 2,
    icon: "⏰",
    text: "Dagmawi Hadgu was late by 15 minutes",
    time: "1 hour ago",
  },
  {
    id: 3,
    icon: "✅",
    text: "Leave request approved for Melkamu Zewdu",
    time: "2 hours ago",
  },
  {
    id: 4,
    icon: "📝",
    text: "New leave request from Nuru Seid",
    time: "3 hours ago",
  },
  {
    id: 5,
    icon: "📊",
    text: "Attendance report generated for April",
    time: "Yesterday",
  },
  {
    id: 6,
    icon: "⚠️",
    text: "Overdue return notice sent to Tamrat Zerihun",
    time: "Yesterday",
  },
  {
    id: 7,
    icon: "✅",
    text: "Tadese Jemberu marked present",
    time: "Yesterday",
  },
]);

const topLateEmployees = ref([
  {
    id: 1,
    name: "Tamrat Zerihun",
    department: "IT",
    lateCount: 12,
    totalLateMinutes: 245,
  },
  {
    id: 2,
    name: "Nuru Seid",
    department: "Finance",
    lateCount: 10,
    totalLateMinutes: 189,
  },
  {
    id: 3,
    name: "Tadese Jemberu",
    department: "Operations",
    lateCount: 9,
    totalLateMinutes: 156,
  },
  {
    id: 4,
    name: "Eshete Worke",
    department: "IT",
    lateCount: 8,
    totalLateMinutes: 142,
  },
  {
    id: 5,
    name: "Haymanot Abebaw",
    department: "HR",
    lateCount: 7,
    totalLateMinutes: 98,
  },
  {
    id: 6,
    name: "Melaku Tewodros",
    department: "Sales",
    lateCount: 6,
    totalLateMinutes: 87,
  },
]);

const topAbsentEmployees = ref([
  {
    id: 1,
    name: "Melkamu Zewdu",
    department: "Operations",
    absentDays: 8,
    absentPercent: 36,
  },
  {
    id: 2,
    name: "Nuru Seid",
    department: "Finance",
    absentDays: 7,
    absentPercent: 32,
  },
  {
    id: 3,
    name: "Tadese Jemberu",
    department: "Operations",
    absentDays: 6,
    absentPercent: 27,
  },
  {
    id: 4,
    name: "Tamrat Zerihun",
    department: "IT",
    absentDays: 6,
    absentPercent: 27,
  },
  {
    id: 5,
    name: "Haymanot Abebaw",
    department: "HR",
    absentDays: 5,
    absentPercent: 23,
  },
  {
    id: 6,
    name: "Tigist Mulugeta",
    department: "Marketing",
    absentDays: 4,
    absentPercent: 18,
  },
]);

const stats = ref({
  totalEmployees: 180,
  avgAttendanceRate: 91,
  totalPresentDays: 2845,
  onLeaveToday: 5,
  pendingRequests: 5,
  overdueReturns: 5,
  approvedLeaves: 48,
  monthlyAttendanceRate: 91,
  attendanceTrend: 2.5,
  totalLeaveDaysThisMonth: 312,
  avgLeavePerEmployee: 5.2,
  departmentsWithLeave: 6,
  totalDepartments: 7,
  avgAvailableLeave: 12.5,
  lowBalanceCount: 22,
  totalOvertimeHours: 189,
  employeesWithOT: 48,
  highAbsenceCount: 8,
  thisMonthRequests: 32,
  requestsTrend: 6,
  frequentLateCount: 12,
  monthName: "May 2026",
});

// Helper Functions
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDayOfMonth(date) {
  return new Date(date).getDate();
}

function getMonthAbbr(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short" });
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function goToAttendance() {
  router.push("/attendance");
}
function goToLeaves() {
  router.push("/leaves");
}

function markAsReturned(item) {
  overdueReturnsList.value = overdueReturnsList.value.filter(
    (i) => i.id !== item.id,
  );
  stats.value.overdueReturns = overdueReturnsList.value.length;
  showToastMessage(`${item.employeeName} marked as returned`, "success");
}

function quickApprove(request) {
  showToastMessage(`Leave approved for ${request.employeeName}`, "success");
  pendingLeaves.value = pendingLeaves.value.filter(
    (r) => r.leaveRequestId !== request.leaveRequestId,
  );
  stats.value.pendingRequests = pendingLeaves.value.length;
}

function quickReject(request) {
  showToastMessage(`Leave rejected for ${request.employeeName}`, "warning");
  pendingLeaves.value = pendingLeaves.value.filter(
    (r) => r.leaveRequestId !== request.leaveRequestId,
  );
  stats.value.pendingRequests = pendingLeaves.value.length;
}

function loadRecentActivity() {
  showToastMessage("Activity feed refreshed", "success");
  recentActivities.value.unshift({
    id: Date.now(),
    icon: "🔄",
    text: "Dashboard refreshed by HR Admin",
    time: "Just now",
  });
  if (recentActivities.value.length > 12) {
    recentActivities.value = recentActivities.value.slice(0, 12);
  }
}

function refreshData() {
  const monthNames = {
    "2026-01": "January 2026",
    "2026-02": "February 2026",
    "2026-03": "March 2026",
    "2026-04": "April 2026",
    "2026-05": "May 2026",
    "2026-06": "June 2026",
  };
  stats.value.monthName = monthNames[selectedMonth.value];
  showToastMessage(`Data refreshed for ${stats.value.monthName}`, "success");
}

function showToastMessage(message, type = "success") {
  toastMessage.value = message;
  toastType.value = type;
  toastIcon.value =
    type === "success"
      ? "✅"
      : type === "error"
        ? "❌"
        : type === "warning"
          ? "⚠️"
          : "ℹ️";
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

onMounted(() => {
  console.log("HR Dashboard loaded");
});
</script>

<style scoped>
.hr-dashboard {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 24px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* Header */
.dashboard-header {
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.header-left p {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}

.month-selector {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.stat-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.summary-icon.green {
  background: #d1fae5;
}
.summary-icon.orange {
  background: #fed7aa;
}
.summary-icon.purple {
  background: #e0e7ff;
}
.summary-icon.blue {
  background: #dbeafe;
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.summary-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.summary-trend {
  font-size: 10px;
  margin-top: 4px;
}

.summary-trend.positive {
  color: #10b981;
}
.summary-trend.warning {
  color: #f59e0b;
}

/* Department Analytics */
.dept-analytics-full {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
}

.analytics-full-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.analytics-full-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 280px;
}

.analytics-full-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  flex-shrink: 0;
}

.analytics-full-icon {
  font-size: 18px;
}

.analytics-full-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.analytics-full-list::-webkit-scrollbar {
  width: 4px;
}

.analytics-full-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.analytics-full-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.analytics-full-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.analytics-full-rank {
  width: 28px;
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
}

.analytics-full-name {
  width: 110px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.analytics-full-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.analytics-full-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.analytics-full-value {
  width: 65px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-align: right;
}

/* Department Leave Distribution */
.dept-distribution-full {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
}

.distribution-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.distribution-list {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 8px;
}

.distribution-list::-webkit-scrollbar {
  width: 6px;
}

.distribution-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.distribution-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.distribution-item-horizontal {
  margin-bottom: 16px;
  padding: 8px 0;
}

.distribution-item-horizontal:last-child {
  margin-bottom: 0;
}

.distribution-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.distribution-name {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.distribution-stats-text {
  font-size: 11px;
  color: #64748b;
}

.distribution-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.distribution-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.distribution-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.distribution-percent {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  min-width: 40px;
  text-align: right;
}

/* Two Column Layout */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 380px;
}

.overdue-section {
  border-left: 4px solid #ef4444;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2ff;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.badge.danger {
  background: #fee2e2;
  color: #dc2626;
}

.view-link {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}

.refresh-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.refresh-btn:hover {
  background: #f1f5f9;
}

/* Scrollable Lists */
.scrollable-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  max-height: 280px;
}

.scrollable-list::-webkit-scrollbar {
  width: 6px;
}

.scrollable-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.scrollable-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* List Items */
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: #f8fafc;
}

.list-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.list-avatar-small {
  width: 32px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
  flex-shrink: 0;
}

.overdue-avatar {
  background: #dc2626;
}

.list-info {
  flex: 1;
  min-width: 0;
}

.list-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-detail {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-date {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.list-status {
  flex-shrink: 0;
}

.list-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* Overdue Items */
.overdue-item {
  background: #fef2f2;
  border: 1px solid #fecaca;
  margin-bottom: 8px;
  border-radius: 10px;
}

.overdue-item:last-child {
  margin-bottom: 0;
}

.overdue-days {
  flex-shrink: 0;
}

.days-badge {
  background: #dc2626;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

/* Upcoming Date */
.upcoming-date {
  width: 50px;
  text-align: center;
  padding: 6px;
  background: #f1f5f9;
  border-radius: 10px;
  flex-shrink: 0;
}

.date-day {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.date-month {
  font-size: 10px;
  color: #64748b;
}

/* Top List */
.top-rank {
  width: 28px;
  font-size: 16px;
  font-weight: 700;
  color: #3b82f6;
  text-align: center;
  flex-shrink: 0;
}

.top-value {
  text-align: right;
  min-width: 100px;
  flex-shrink: 0;
}

.late-count,
.absent-count {
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
}

.late-minutes,
.absent-percent {
  font-size: 10px;
  color: #f59e0b;
  margin-top: 2px;
}

/* Status Badges */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}

.status-badge.on-leave {
  background: #dbeafe;
  color: #2563eb;
}

/* Buttons */
.btn-small {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.btn-small.success {
  background: #10b981;
  color: white;
}

.btn-small.success:hover {
  background: #059669;
}

.btn-small.danger {
  background: #ef4444;
  color: white;
}

.btn-small.danger:hover {
  background: #dc2626;
}

.btn-small.warning {
  background: #f59e0b;
  color: white;
}

.btn-small.warning:hover {
  background: #d97706;
}

/* Activity */
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  transition: background 0.2s;
}

.activity-item:hover {
  background: #f8fafc;
}

.activity-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 13px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Empty State */
.empty-state-small {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 13px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
}

.toast.error {
  border-left-color: #ef4444;
}
.toast.warning {
  border-left-color: #f59e0b;
}
.toast.info {
  border-left-color: #3b82f6;
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

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .two-column-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hr-dashboard {
    padding: 16px;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .analytics-full-grid {
    grid-template-columns: 1fr;
  }
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .list-item {
    flex-wrap: wrap;
  }
  .top-value {
    min-width: auto;
  }
}
</style>
