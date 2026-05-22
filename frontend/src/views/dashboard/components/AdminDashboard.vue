<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-left">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your System today.</p>
      </div>
    
    </header>

    <!-- Dashboard Content -->
    <div class="dashboard-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalEmployees }}</div>
            <div class="stat-label">Total Employees</div>
            <div class="stat-change positive">↑ 12% this month</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">💰</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatCurrency(stats.totalPayroll) }}</div>
            <div class="stat-label">Total Payroll</div>
            <div class="stat-change positive">↑ 8% vs last month</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">📅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.presentToday }}</div>
            <div class="stat-label">Present Today</div>
            <div class="stat-change">{{ stats.attendanceRate }}% attendance</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">🏖️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingLeaves }}</div>
            <div class="stat-label">Pending Leaves</div>
            <div class="stat-change warning">{{ stats.leavesThisMonth }} this month</div>
          </div>
        </div>
      </div>

      <!-- Quick Access - Only routes that exist in your router -->
      <div class="quick-access">
        <h2>Quick Access</h2>
        <div class="quick-grid">
          <router-link to="/dashboard" class="quick-card">
            <div class="quick-icon">📊</div>
            <div class="quick-title">Dashboard</div>
            <div class="quick-desc">Main overview</div>
          </router-link>
          <router-link to="/profile" class="quick-card">
            <div class="quick-icon">👤</div>
            <div class="quick-title">My Profile</div>
            <div class="quick-desc">View and edit profile</div>
          </router-link>
          <router-link to="/employees" class="quick-card">
            <div class="quick-icon">👔</div>
            <div class="quick-title">Employees</div>
            <div class="quick-desc">Manage employees</div>
          </router-link>
          <router-link to="/users" class="quick-card">
            <div class="quick-icon">👥</div>
            <div class="quick-title">Users</div>
            <div class="quick-desc">Manage system users</div>
          </router-link>
          <router-link to="/analytics" class="quick-card">
            <div class="quick-icon">📈</div>
            <div class="quick-title">Analytics</div>
            <div class="quick-desc">HR Analytics reports</div>
          </router-link>
          <router-link to="/attendance" class="quick-card">
            <div class="quick-icon">📅</div>
            <div class="quick-title">Attendance</div>
            <div class="quick-desc">Track attendance</div>
          </router-link>
          <router-link to="/leaves" class="quick-card">
            <div class="quick-icon">🏖️</div>
            <div class="quick-title">Leave Requests</div>
            <div class="quick-desc">Manage leave requests</div>
          </router-link>
          <router-link to="/payroll" class="quick-card">
            <div class="quick-icon">💰</div>
            <div class="quick-title">Payroll</div>
            <div class="quick-desc">Process payroll</div>
          </router-link>
          <router-link to="/settings" class="quick-card">
            <div class="quick-icon">⚙️</div>
            <div class="quick-title">Settings</div>
            <div class="quick-desc">System settings</div>
          </router-link>
        </div>
      </div>

     


    <div class="recent-section">
 <!-- Attendance Trend -->
          <div class="analytics-card">
            <h3>Attendance Trend</h3>
            <div class="trend-chart">
              <div class="trend-bar" v-for="item in attendanceTrend" :key="item.month">
                <div class="bar-container">
                  <div class="bar-fill" :style="{ height: item.rate + '%' }"></div>
                </div>
                <div class="bar-label">{{ item.month }}</div>
                <div class="bar-value">{{ item.rate }}%</div>
              </div>
            </div>
          </div>

          <!-- Department Headcount -->
          <div class="analytics-card">
            <h3>Department Headcount</h3>
            <div class="pie-chart">
              <div v-for="dept in departmentStats" :key="dept.name" class="pie-segment-info">
                <div class="pie-color" :style="{ background: dept.color }"></div>
                <div class="pie-label">{{ dept.name }}</div>
                <div class="pie-value">{{ dept.count }} ({{ dept.percentage }}%)</div>
              </div>
            </div>
          </div>

    </div>


    <div class="recent-section">
  <!-- Leave Statistics -->
          <div class="analytics-card">
            <h3>Leave Statistics</h3>
            <div class="leave-stats">
              <div class="leave-stat-item">
                <div class="stat-circle green">✓</div>
                <div class="stat-detail">
                  <div class="stat-number">{{ stats.approvedLeaves }}</div>
                  <div class="stat-label">Approved</div>
                </div>
              </div>
              <div class="leave-stat-item">
                <div class="stat-circle orange">⏳</div>
                <div class="stat-detail">
                  <div class="stat-number">{{ stats.pendingLeaves }}</div>
                  <div class="stat-label">Pending</div>
                </div>
              </div>
              <div class="leave-stat-item">
                <div class="stat-circle red">✗</div>
                <div class="stat-detail">
                  <div class="stat-number">{{ stats.rejectedLeaves }}</div>
                  <div class="stat-label">Rejected</div>
                </div>
              </div>
              <div class="leave-stat-item">
                <div class="stat-circle blue">📊</div>
                <div class="stat-detail">
                  <div class="stat-number">{{ stats.totalLeaves }}</div>
                  <div class="stat-label">Total</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payroll Summary -->
          <div class="analytics-card">
            <h3>Payroll Summary</h3>
            <div class="payroll-stats">
              <div class="payroll-item">
                <span class="payroll-label">Average Salary</span>
                <span class="payroll-value">{{ formatCurrency(stats.averageSalary) }}</span>
              </div>
              <div class="payroll-item">
                <span class="payroll-label">Total Deductions</span>
                <span class="payroll-value text-red">{{ formatCurrency(stats.totalDeductions) }}</span>
              </div>
              <div class="payroll-item">
                <span class="payroll-label">Net Payroll</span>
                <span class="payroll-value text-green">{{ formatCurrency(stats.netPayroll) }}</span>
              </div>
              <div class="payroll-item">
                <span class="payroll-label">Next Pay Date</span>
                <span class="payroll-value">{{ stats.nextPayDate }}</span>
              </div>
            </div>
          </div>

    </div>











      <!-- Recent Activity & Recent Employees -->
      <div class="recent-section">
        <div class="recent-card">
          <h3>Recent Employees</h3>
          <div class="recent-list">
            <div v-for="emp in recentEmployees" :key="emp.id" class="recent-item" @click="goToEmployee(emp.id)">
              <div class="recent-avatar">{{ getInitials(emp.fullName) }}</div>
              <div class="recent-info">
                <div class="recent-name">{{ emp.fullName }}</div>
                <div class="recent-dept">{{ emp.department }}</div>
              </div>
              <div class="recent-date">Added {{ formatDate(emp.joinDate) }}</div>
            </div>
          </div>
          <router-link to="/employees" class="view-all">View All Employees →</router-link>
        </div>
        
        <div class="recent-card">
          <h3>Recent Activities</h3>
          <div class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-info">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Department Distribution -->
      <div class="dept-section">
        <div class="dept-card">
          <h3>Department Distribution</h3>
          <div class="dept-list">
            <div v-for="dept in departmentStats" :key="dept.name" class="dept-item">
              <div class="dept-name">{{ dept.name }}</div>
              <div class="dept-bar">
                <div class="dept-fill" :style="{ width: dept.percentage + '%', background: dept.color }"></div>
              </div>
              <div class="dept-count">{{ dept.count }} employees</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const showUserDropdown = ref(false)
const currentUser = ref({
  name: 'Admin User',
  role: 'Administrator',
  email: 'admin@company.com'
})

// Stats data
const stats = ref({
  totalEmployees: 156,
  totalPayroll: 4850000,
  presentToday: 142,
  attendanceRate: 91,
  pendingLeaves: 8,
  leavesThisMonth: 23,
  newHires: 12,
  departments: 5,
  approvedLeaves: 45,
  rejectedLeaves: 6,
  totalLeaves: 59,
  averageSalary: 31090,
  totalDeductions: 485000,
  netPayroll: 4365000,
  nextPayDate: 'May 30, 2026'
})

// Attendance trend data
const attendanceTrend = ref([
  { month: 'Jan', rate: 88 },
  { month: 'Feb', rate: 89 },
  { month: 'Mar', rate: 87 },
  { month: 'Apr', rate: 90 },
  { month: 'May', rate: 91 },
  { month: 'Jun', rate: 92 }
])

// Recent activities
const recentActivities = ref([
  { id: 1, icon: '👔', text: 'New employee Biruk Mulualem joined IT department', time: '2 hours ago' },
  { id: 2, icon: '🏖️', text: 'Leave request approved for Dagmawi Hadgu', time: '5 hours ago' },
  { id: 3, icon: '💰', text: 'Payroll for April 2026 processed', time: 'Yesterday' },
  { id: 4, icon: '📅', text: 'Attendance submitted for 15 employees', time: 'Yesterday' },
  { id: 5, icon: '👥', text: 'New user role created: Attendance Manager', time: '2 days ago' }
])

// Recent employees
const recentEmployees = ref([
  { id: 9, fullName: 'Haymanot Abebaw', department: 'HR', joinDate: '2026-05-15' },
  { id: 8, fullName: 'Eshete Worke', department: 'IT', joinDate: '2026-05-10' },
  { id: 7, fullName: 'Tadese Jemberu', department: 'Operations', joinDate: '2026-05-01' },
  { id: 10, fullName: 'Zerihun Mekonnen', department: 'Finance', joinDate: '2026-04-28' }
])

// Department statistics
const departmentStats = ref([
  { name: 'IT', count: 45, percentage: 29, color: '#3b82f6' },
  { name: 'Finance', count: 32, percentage: 21, color: '#10b981' },
  { name: 'Operations', count: 38, percentage: 24, color: '#f59e0b' },
  { name: 'HR', count: 15, percentage: 10, color: '#8b5cf6' },
  { name: 'Sales', count: 26, percentage: 16, color: '#ec4899' }
])

// Methods
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function toggleUserDropdown() {
  showUserDropdown.value = !showUserDropdown.value
}

function closeUserDropdown() {
  showUserDropdown.value = false
}

function goToEmployee(id) {
  router.push(`/employees/${id}`)
}

function goToNotifications() {
  console.log('Notifications clicked')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// Close dropdown when clicking outside
const handleClickOutside = (e) => {
  if (!e.target.closest('.user-menu')) {
    showUserDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  width: 100%;
}

/* Header */
.dashboard-header {
  background: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
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

.notif-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  position: relative;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s;
}

.notif-btn:hover {
  background: #f1f5f9;
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 10px;
  transition: all 0.2s;
  position: relative;
}

.user-menu:hover {
  background: #f1f5f9;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: white;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.dropdown-arrow {
  font-size: 10px;
  color: #94a3b8;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  min-width: 180px;
  padding: 8px;
  margin-top: 8px;
  z-index: 100;
}

.user-dropdown a {
  display: block;
  padding: 8px 12px;
  color: #1e293b;
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s;
}

.user-dropdown a:hover {
  background: #f1f5f9;
}

.user-dropdown hr {
  margin: 8px 0;
  border-color: #e2e8f0;
}

/* Dashboard Content */
.dashboard-content {
  padding: 0 24px 24px;
  width: 100%;
  box-sizing: border-box;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.stat-icon.blue { background: #dbeafe; }
.stat-icon.green { background: #d1fae5; }
.stat-icon.orange { background: #fed7aa; }
.stat-icon.purple { background: #e0e7ff; }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.stat-change {
  font-size: 10px;
  margin-top: 6px;
}

.stat-change.positive { color: #10b981; }
.stat-change.warning { color: #f59e0b; }

/* Quick Access */
.quick-access {
  margin-bottom: 30px;
}

.quick-access h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-card {
  background: white;
  border-radius: 16px;
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  display: block;
}

.quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border-color: #3b82f6;
}

.quick-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.quick-title {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 4px;
}

.quick-desc {
  font-size: 10px;
  color: #64748b;
}

/* Analytics Section */
.analytics-section {
  margin-bottom: 30px;
}

.analytics-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.analytics-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.analytics-card h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
}

/* Trend Chart */
.trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 8px;
  height: 140px;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.bar-container {
  width: 100%;
  height: 90px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  background: #3b82f6;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 10px;
  color: #64748b;
}

.bar-value {
  font-size: 10px;
  font-weight: 600;
  color: #3b82f6;
}

/* Pie Chart Info */
.pie-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pie-segment-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pie-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pie-label {
  flex: 1;
  font-size: 12px;
  color: #1e293b;
}

.pie-value {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

/* Leave Statistics */
.leave-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.leave-stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
}

.stat-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.stat-circle.green { background: #d1fae5; color: #059669; }
.stat-circle.orange { background: #fed7aa; color: #ea580c; }
.stat-circle.red { background: #fee2e2; color: #dc2626; }
.stat-circle.blue { background: #dbeafe; color: #2563eb; }

.stat-detail {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 10px;
  color: #64748b;
}

/* Payroll Stats */
.payroll-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.payroll-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
  gap: 10px;
  flex-wrap: wrap;
}

.payroll-label {
  font-size: 12px;
  color: #64748b;
}

.payroll-value {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  text-align: right;
}

.payroll-value.text-red { color: #ef4444; }
.payroll-value.text-green { color: #10b981; }

/* Recent Section */
.recent-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.recent-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.recent-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
}

.recent-list, .activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 10px;
  transition: background 0.2s;
  cursor: pointer;
}

.recent-item:hover {
  background: #f8fafc;
}

.recent-avatar {
  width: 36px;
  height: 36px;
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

.recent-info {
  flex: 1;
  min-width: 0;
}

.recent-name {
  font-weight: 500;
  font-size: 13px;
  color: #1e293b;
}

.recent-dept {
  font-size: 11px;
  color: #64748b;
}

.recent-date {
  font-size: 10px;
  color: #94a3b8;
  flex-shrink: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 10px;
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
  font-size: 12px;
  color: #1e293b;
  word-break: break-word;
}

.activity-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.view-all {
  display: block;
  width: 100%;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #3b82f6;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  text-decoration: none;
  font-size: 12px;
}

.view-all:hover {
  background: #eff6ff;
}

/* Department Section */
.dept-section {
  margin-bottom: 30px;
}

.dept-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.dept-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
}

.dept-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dept-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dept-name {
  width: 90px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.dept-bar {
  flex: 1;
  min-width: 100px;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.dept-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dept-count {
  width: 90px;
  font-size: 12px;
  color: #64748b;
  text-align: right;
}

/* Responsive */
@media (max-width: 1024px) {
  .stats-grid, .quick-grid, .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 0 16px 16px;
  }
  
  .stats-grid, .quick-grid, .analytics-grid, .recent-section {
    grid-template-columns: 1fr;
  }
  
  .dept-item {
    flex-wrap: wrap;
  }
  
  .dept-name, .dept-count {
    width: auto;
  }
  
  .dept-bar {
    width: 100%;
    order: 3;
  }
}
</style>