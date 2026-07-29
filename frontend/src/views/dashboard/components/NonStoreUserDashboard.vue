<!-- views/dashboard/NonStoreUserDashboard.vue -->
<template>
  <div class="nonstore-dashboard">
    <!-- ==================== HEADER ==================== -->
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5" />
            <rect x="2" y="7" width="20" height="10" rx="1" />
          </svg>
        </div>
        <div>
          <h1>📋 Request Dashboard</h1>
          <p>Manage your inventory requests and approvals</p>
        </div>
      </div>
      <div class="header-right">
       
        <div class="date-display">
          <span class="date-icon">📅</span>
          <span class="date-text">{{ currentDate }}</span>
        </div>
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span v-else class="spinner-small"></span>
          <span class="btn-text">{{ loading ? 'Loading...' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your requests...</p>
    </div>

    <template v-else>
      <!-- ==================== QUICK STATS ==================== -->
      <div class="section-title">
        <h2>📊 Request Summary</h2>
        <span class="section-subtitle">Overview of your request activity</span>
      </div>

      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">📋</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(stats.total) }}</div>
            <div class="stat-label">Total Requests</div>
            <div class="stat-sub">All your requests</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">⏳</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(stats.pending) }}</div>
            <div class="stat-label">Pending</div>
            <div class="stat-sub">Awaiting approval</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">✅</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(stats.approved) }}</div>
            <div class="stat-label">Approved</div>
            <div class="stat-sub">Ready for processing</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon-wrapper">
            <span class="stat-icon">❌</span>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(stats.rejected) }}</div>
            <div class="stat-label">Rejected</div>
            <div class="stat-sub">Needs revision</div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import itemRequestService from '@/stores/itemRequestService'

const authStore = useAuthStore()

// ================================================================
// STATE
// ================================================================

const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('success')

// User Info - from auth store
const user = computed(() => {
  return authStore.user || {
    fullName: 'Guest User',
    username: 'guest',
    role: 'Viewer',
    userId: null
  }
})

const getUserInitials = computed(() => {
  const name = user.value.fullName || user.value.username || 'Guest'
  return name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Stats Data
const stats = ref({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0
})

// ================================================================
// COMPUTED
// ================================================================

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
})

// ================================================================
// METHODS
// ================================================================

const formatNumber = (value: number): string => {
  if (!value) return '0'
  return value.toLocaleString()
}

// Load Stats - uses the backend which filters by user
const loadStats = async (): Promise<void> => {
  loading.value = true
  try {
    const response = await itemRequestService.getStats()
    
    if (response.success) {
      stats.value = {
        total: response.data.total || 0,
        pending: response.data.pending || 0,
        approved: response.data.approved || 0,
        rejected: response.data.rejected || 0
      }
      console.log('📊 Stats loaded for user:', {
        user: user.value.fullName || user.value.username,
        userId: user.value.userId,
        role: user.value.role,
        stats: stats.value
      })
    } else {
      showToastMessage(response.error || 'Failed to load statistics', 'error')
    }
  } catch (error: any) {
    console.error('Error loading stats:', error)
    showToastMessage(error.message || 'Failed to load statistics', 'error')
  } finally {
    loading.value = false
  }
}

const refreshData = async (): Promise<void> => {
  showToastMessage('Refreshing requests...', 'info')
  await loadStats()
  showToastMessage('Requests refreshed!', 'success')
}

const showToastMessage = (
  msg: string, 
  type: 'success' | 'error' | 'info' | 'warning' = 'success'
): void => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  console.log('Non-Store User Dashboard mounted')
  console.log('User:', user.value)
  loadStats()
})
</script>

<style scoped>
/* ================================================================
   MAIN CONTAINER - NO SCROLL, FULL HEIGHT
   ================================================================ */
.nonstore-dashboard {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* ================================================================
   HEADER
   ================================================================ */
.dashboard-header {
  background: white;
  padding: 16px 24px;
  border-radius: 16px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-badge {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-badge svg {
  width: 24px;
  height: 24px;
  color: white;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.header-left p {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  background: #f8fafc;
  border-radius: 30px;
  border: 1px solid #e2e8f0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.user-role {
  font-size: 10px;
  color: #64748b;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 12px;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================
   SECTION TITLE
   ================================================================ */
.section-title {
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
}

.section-title h2 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.section-subtitle {
  font-size: 12px;
  color: #64748b;
}

/* ================================================================
   STATS GRID
   ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.2s;
  cursor: default;
  min-height: 100px;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon {
  font-size: 26px;
}

.stat-card.primary .stat-icon-wrapper { background: #dbeafe; }
.stat-card.warning .stat-icon-wrapper { background: #fef3c7; }
.stat-card.success .stat-icon-wrapper { background: #dcfce7; }
.stat-card.danger .stat-icon-wrapper { background: #fee2e2; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.stat-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.stat-card.primary .stat-value { color: #2563eb; }
.stat-card.warning .stat-value { color: #d97706; }
.stat-card.success .stat-value { color: #16a34a; }
.stat-card.danger .stat-value { color: #dc2626; }

/* ================================================================
   LOADING STATE
   ================================================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
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

.loading-state p {
  color: #64748b;
  font-size: 14px;
  margin: 0;
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
.toast.info { border-left-color: #3b82f6; }
.toast.warning { border-left-color: #f59e0b; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0%); opacity: 1; }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .nonstore-dashboard { padding: 16px; }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
  .header-right { width: 100%; justify-content: space-between; flex-wrap: wrap; }
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .stat-card {
    padding: 16px;
    min-height: 80px;
  }
  .stat-value {
    font-size: 22px;
  }
  .stat-icon-wrapper {
    width: 44px;
    height: 44px;
  }
  .stat-icon {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .user-details {
    display: none;
  }
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
  .header-left h1 {
    font-size: 17px;
  }
  .header-left p {
    font-size: 11px;
  }
}
</style>