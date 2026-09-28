<!-- views/storemanagement/notifications/NotificationManagement.vue -->
<template>
  <div class="notification-management">
    <!-- ==================== HEADER ==================== -->
    <header class="page-header">
      <div class="header-left">
        <h1>🔔 Pending Notifications</h1>
        <span class="badge pending-badge">{{ pendingCount }} Pending</span>
      </div>
      <div class="header-right">
        <button class="btn-refresh" @click="loadNotifications" :disabled="loading">
          <span v-if="!loading">🔄 Refresh</span>
          <span v-else>Loading...</span>
        </button>
      </div>
    </header>

    <!-- ==================== FILTER BAR ==================== -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Store</label>
        <select v-model="filterStore" class="filter-select">
          <option value="all">All Stores</option>
          <option v-for="store in storeOptions" :key="store.id" :value="store.id">
            {{ store.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Approver</label>
        <select v-model="filterApprover" class="filter-select">
          <option value="all">All Approvers</option>
          <option v-for="approver in approverOptions" :key="approver" :value="approver">
            {{ approver }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>From Date</label>
        <input type="date" v-model="filterDateFrom" class="filter-input" />
      </div>

      <div class="filter-group">
        <label>To Date</label>
        <input type="date" v-model="filterDateTo" class="filter-input" />
      </div>

      <button 
        v-if="hasActiveFilters" 
        class="clear-filters-btn" 
        @click="clearFilters"
      >
        ✕ Clear
      </button>
    </div>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading notifications...</p>
    </div>

    <template v-else>
      <!-- ==================== STATS CARDS ==================== -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📬</div>
          <div>
            <div class="stat-value">{{ totalNotifications }}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div>
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">👥</div>
          <div>
            <div class="stat-value">{{ groupCount }}</div>
            <div class="stat-label">Group Approvals</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">🏛️</div>
          <div>
            <div class="stat-value">{{ deptCount }}</div>
            <div class="stat-label">Department Approvals</div>
          </div>
        </div>
      </div>

      <!-- ==================== NOTIFICATIONS TABLE ==================== -->
      <div class="table-card">
        <div class="table-header">
          <h3>📋 Pending Approvals</h3>
          <span class="table-count">{{ filteredNotifications.length }} pending</span>
        </div>

        <div class="table-wrapper">
          <table class="notifications-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Request Code</th>
                <th>Approver</th>
                <th>Store</th>
                <th>Requested By</th>
                
                <th>Requested Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredNotifications.length === 0">
                <td colspan="7" class="empty-state-td">
                  <span class="empty-icon">✅</span>
                  <p>All caught up! No pending notifications match your filters.</p>
                </td>
              </tr>
              <tr 
                v-for="(notif, index) in paginatedNotifications" 
                :key="notif.id"
                class="row-pending"
              >
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="code-cell">{{ getRequestCode(notif) }}</td>
                <td>
                  <div class="approver-info">
                    <span class="approver-name">{{ getApproverName(notif) }}</span>
                   
                  </div>
                </td>
                <td>
                  <span class="store-name">{{ getStoreName(notif) }}</span>
                </td>
                <td>{{ getRequesterName(notif) }}</td>
                
                <td>
                  <span class="date-text">{{ formatDate(notif.created_at) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ==================== PAGINATION ==================== -->
        <div class="pagination" v-if="filteredNotifications.length > 0">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1" 
            @click="currentPage--"
          >
            ← Previous
          </button>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
            ({{ filteredNotifications.length }} items)
          </span>
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
          >
            Next →
          </button>
          <select v-model="pageSize" @change="currentPage = 1" class="limit-select">
            <option :value="5">5 per page</option>
            <option :value="10">10 per page</option>
            <option :value="20">20 per page</option>
            <option :value="50">50 per page</option>
          </select>
        </div>
      </div>
    </template>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import itemRequestService from '@/stores/itemRequestService'
import { useAuthStore } from '@/stores/auth'

// ================================================================
// STATE
// ================================================================

const authStore = useAuthStore()
const notifications = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// Filters
const filterStore = ref('all')
const filterApprover = ref('all')
const filterDateFrom = ref('')
const filterDateTo = ref('')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Store and Approver options (populated from data)
const storeOptions = ref([])
const approverOptions = ref([])

// ================================================================
// COMPUTED
// ================================================================

const totalNotifications = computed(() => {
  return notifications.value.length
})

const pendingCount = computed(() => {
  return notifications.value.filter(n => n.status === 'pending').length
})

const groupCount = computed(() => {
  return notifications.value.filter(n => n.approval_type === 'group' && n.status === 'pending').length
})

const deptCount = computed(() => {
  return notifications.value.filter(n => n.approval_type === 'department' && n.status === 'pending').length
})

const hasActiveFilters = computed(() => {
  return filterStore.value !== 'all' ||
         filterApprover.value !== 'all' ||
         filterDateFrom.value !== '' ||
         filterDateTo.value !== ''
})

const filteredNotifications = computed(() => {
  let result = [...notifications.value]

  // ✅ Only show pending
  result = result.filter(n => n.status === 'pending')

  // Filter by store
  if (filterStore.value !== 'all') {
    const storeId = parseInt(filterStore.value)
    result = result.filter(n => n.store_id === storeId)
  }

  // Filter by approver
  if (filterApprover.value !== 'all') {
    result = result.filter(n => {
      const approverName = getApproverName(n)
      return approverName === filterApprover.value
    })
  }

  // Filter by date range
  if (filterDateFrom.value) {
    const fromDate = new Date(filterDateFrom.value)
    fromDate.setHours(0, 0, 0, 0)
    result = result.filter(n => {
      const notifDate = new Date(n.created_at)
      return notifDate >= fromDate
    })
  }

  if (filterDateTo.value) {
    const toDate = new Date(filterDateTo.value)
    toDate.setHours(23, 59, 59, 999)
    result = result.filter(n => {
      const notifDate = new Date(n.created_at)
      return notifDate <= toDate
    })
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredNotifications.value.length / pageSize.value) || 1
})

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredNotifications.value.slice(start, end)
})

// ================================================================
// HELPER METHODS
// ================================================================

const getRequestCode = (notif) => {
  return notif?.request?.requestCode || 'N/A'
}

const getApproverName = (notif) => {
  if (!notif) return 'N/A'
  
  // ✅ Department approval
  if (notif.approval_type === 'department') {
    // Check if department exists on the notification
    if (notif.department) {
      return notif.department.name || notif.department.code || 'Unknown Dept'
    }
    // Fallback: hardcoded department names
    const deptMap = {
      7: 'IT Department',
      15: 'Nebert Astedader',
      1: 'HR Department',
      2: 'Finance Department'
    }
    if (notif.department_id && deptMap[notif.department_id]) {
      return deptMap[notif.department_id]
    }
    return notif.department_id ? `Department #${notif.department_id}` : 'Unknown Dept'
  }
  
  // ✅ Group approval
  if (notif.approval_type === 'group' || !notif.approval_type) {
    if (notif.group) {
      return notif.group.name || notif.group.code || 'Unknown Group'
    }
    if (notif.group_id) {
      return `Group #${notif.group_id}`
    }
    return 'Unknown Group'
  }
  
  return 'Unknown Approver'
}

const getApproverType = (notif) => {
  if (!notif) return ''
  if (notif.approval_type === 'department') {
    if (notif.department) {
      return `🏛️ ${notif.department.code || 'Dept'}`
    }
    return '🏛️ Department'
  }
  if (notif.group) {
    return `👥 ${notif.group.code || 'Group'}`
  }
  return '👥 Group'
}

const getStoreName = (notif) => {
  if (!notif) return 'N/A'
  
  // Try store object first
  if (notif.store) {
    return notif.store.name || `Store #${notif.store_id}`
  }
  
  // Fallback store map (for demo data)
  const storeMap = {
    28: 'MainStore 1 (Yeshi)',
    29: 'MainStore 3',
    32: 'Other',
    33: 'MainStore 1 (Ground)',
    34: 'MainStore 1 (Dulenty)',
    35: 'MainStore 1 (Mekanisa)'
  }
  return storeMap[notif.store_id] || `Store #${notif.store_id}`
}

const getRequesterName = (notif) => {
  return notif?.request?.requestedByUser?.fullName || 
         notif?.request?.requestedByUser?.username || 
         'Unknown'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ================================================================
// EXTRACT FILTER OPTIONS FROM DATA
// ================================================================

const extractFilterOptions = (data) => {
  if (!data || data.length === 0) return

  // Extract unique stores
  const stores = new Map()
  data.forEach(n => {
    const storeName = getStoreName(n)
    if (n.store_id && !stores.has(n.store_id) && storeName !== 'N/A' && storeName !== 'Unknown') {
      stores.set(n.store_id, {
        id: n.store_id,
        name: storeName
      })
    }
  })
  storeOptions.value = Array.from(stores.values()).sort((a, b) => a.name.localeCompare(b.name))

  // Extract unique approvers
  const approvers = new Set()
  data.forEach(n => {
    const name = getApproverName(n)
    if (name && !name.includes('N/A') && !name.includes('Unknown') && !name.includes('#')) {
      approvers.add(name)
    }
  })
  approverOptions.value = Array.from(approvers).sort()
}

// ================================================================
// METHODS
// ================================================================

const loadNotifications = async () => {
  loading.value = true
  try {
    const response = await itemRequestService.getPendingNotifications({
      page: currentPage.value,
      limit: pageSize.value
    })

    if (response.success && response.data) {
      notifications.value = response.data.notifications || []
      
      // Extract filter options from data
      extractFilterOptions(notifications.value)
      
      console.log('✅ Loaded pending notifications:', {
        total: response.data.summary?.total || 0,
        group: response.data.summary?.group || 0,
        department: response.data.summary?.department || 0,
        notifications: notifications.value.length
      })
    } else {
      showToastMessage(response.error || 'Failed to load notifications', 'error')
    }
  } catch (error) {
    console.error('❌ Error loading notifications:', error)
    showToastMessage('Failed to load notifications', 'error')
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  filterStore.value = 'all'
  filterApprover.value = 'all'
  filterDateFrom.value = ''
  filterDateTo.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// WATCHERS - Auto-apply filters on change
// ================================================================

watch([filterStore, filterApprover, filterDateFrom, filterDateTo], () => {
  currentPage.value = 1
})

// Watch for auth changes (reload when user changes)
watch(() => authStore.user, () => {
  if (authStore.isAuthenticated) {
    loadNotifications()
  }
}, { deep: true })

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  if (authStore.isAuthenticated) {
    loadNotifications()
  }
})
</script>

<style scoped>
.notification-management {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fb;
}

/* ================================================================
   PAGE HEADER
   ================================================================ */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.pending-badge {
  background: #fef3c7;
  color: #92400e;
}

.btn-refresh {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================
   FILTER BAR
   ================================================================ */
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  min-width: 140px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-input {
  min-width: 150px;
}

.clear-filters-btn {
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  transition: all 0.2s;
  height: 38px;
  align-self: flex-end;
}

.clear-filters-btn:hover {
  background: #e2e8f0;
}

/* ================================================================
   STATS GRID
   ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-icon {
  font-size: 28px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-card.pending .stat-value { color: #f59e0b; }
.stat-card.info .stat-value { color: #3b82f6; }
.stat-card.warning .stat-value { color: #f59e0b; }

/* ================================================================
   TABLE CARD
   ================================================================ */
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.table-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.table-count {
  font-size: 13px;
  color: #64748b;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-wrapper {
  overflow-x: auto;
}

.notifications-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 650px;
}

.notifications-table th,
.notifications-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.notifications-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.row-pending {
  border-left: 3px solid #f59e0b;
}

/* ================================================================
   CELL STYLES
   ================================================================ */
.code-cell {
  font-weight: 600;
  color: #2563eb;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.approver-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.approver-name {
  font-weight: 500;
  color: #1e293b;
}

.approver-type {
  font-size: 10px;
  color: #94a3b8;
}

.store-name {
  font-weight: 500;
  color: #1e293b;
}

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.date-text {
  font-size: 12px;
  color: #64748b;
}

/* ================================================================
   LOADING STATE
   ================================================================ */
.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state-td {
  text-align: center;
  padding: 40px 20px !important;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-state-td p {
  color: #94a3b8;
  font-size: 16px;
  margin: 0;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
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
  font-size: 13px;
  color: #64748b;
}

.limit-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
  font-size: 13px;
}

.toast.error { border-left-color: #ef4444; }
.toast.warning { border-left-color: #f59e0b; }
.toast.info { border-left-color: #3b82f6; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0%); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .notification-management { padding: 16px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-left { justify-content: space-between; }
  .header-right { width: 100%; }
  .btn-refresh { width: 100%; justify-content: center; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-group { width: 100%; }
  .filter-select, .filter-input { width: 100%; min-width: unset; }
  .clear-filters-btn { width: 100%; justify-content: center; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .notifications-table { font-size: 11px; min-width: 550px; }
  .notifications-table th,
  .notifications-table td { padding: 6px 8px; }
  .stat-value { font-size: 18px; }
}
</style>