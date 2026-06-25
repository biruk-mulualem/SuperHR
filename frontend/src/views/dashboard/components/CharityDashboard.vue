<template>
  <div class="charity-dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isTeamLeader ? 'Team Dashboard' : 'Charity Management Dashboard' }}</h1>
        <p class="page-subtitle">
          {{ isTeamLeader ? 'Overview of your assigned beneficiaries and deliveries' : 'Global overview of charity operations and distribution' }}
        </p>
      </div>
      <div class="header-actions">
        <div class="export-controls" v-if="allReleases.length > 0">
          <select v-model="selectedReleaseId" class="release-select">
            <option :value="null" disabled>Select Release for Report</option>
            <option v-for="rel in sortedAllReleases" :key="rel.distribution_release_id" :value="rel.distribution_release_id">
              {{ CharityService.formatDate(rel.date) }} ({{ rel.payment_for_indays }}d)
            </option>
          </select>
          <button class="btn-outline master-export-btn" @click="handleMasterExport" :disabled="loadingMasterExport || !selectedReleaseId">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            {{ loadingMasterExport ? 'Preparing...' : 'Master Report' }}
          </button>
        </div>
        <router-link to="/charity/settings" class="btn-outline" v-if="!isTeamLeader">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading dashboard statistics...</p>
    </div>

    <div v-else-if="error" class="error-alert">
      {{ error }}
      <button @click="fetchStats">Retry</button>
    </div>

    <template v-else>
      <!-- KPI Grid -->
      <div class="stats-grid">
        <!-- Beneficiaries -->
        <div class="stat-card">
          <div class="stat-icon ben-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <h3>{{ isTeamLeader ? 'My Beneficiaries' : 'Total Beneficiaries' }}</h3>
            <div class="stat-value">{{ stats.beneficiaries.total }}</div>
            <div class="stat-sub">{{ stats.beneficiaries.active }} Active</div>
          </div>
        </div>

        <!-- Allocation -->
        <div class="stat-card">
          <div class="stat-icon alloc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-info">
            <h3>{{ isTeamLeader ? 'Team Allocation' : 'Global Monthly Total' }}</h3>
            <div class="stat-value">{{ CharityService.formatCurrency(stats.allocation.totalMonthly) }}</div>
            <div class="stat-sub">Monthly Commitment</div>
          </div>
        </div>

        <!-- Teams (Admin only) -->
        <div class="stat-card" v-if="!isTeamLeader">
          <div class="stat-icon team-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <div class="stat-info">
            <h3>Distribution Teams</h3>
            <div class="stat-value">{{ stats.teams.total }}</div>
            <div class="stat-sub">{{ stats.teams.active }} Teams Active</div>
          </div>
        </div>

        <!-- Progress -->
        <div class="stat-card">
          <div class="stat-icon prog-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>
          <div class="stat-info">
            <h3>Current Cycle Progress</h3>
            <div class="stat-value">{{ Math.round((stats.distribution.completed / (stats.distribution.total || 1)) * 100) }}%</div>
            <div class="stat-sub">{{ stats.distribution.completed }} / {{ stats.distribution.total }} Delivered</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Distribution Details -->
        <div class="dashboard-section main-section">
          <div class="section-header">
            <h2>Current Distribution Cycle</h2>
            <span class="release-tag" v-if="stats.distribution.release">
              Release: {{ CharityService.formatDate(stats.distribution.release.date) }}
            </span>
          </div>
          
          <div class="progress-container">
            <div class="progress-labels">
              <span>Delivery Completion</span>
              <span class="pct">{{ Math.round((stats.distribution.completed / (stats.distribution.total || 1)) * 100) }}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: (stats.distribution.completed / (stats.distribution.total || 1)) * 100 + '%' }"></div>
            </div>
            <p class="progress-hint">
              {{ stats.distribution.total - stats.distribution.completed }} beneficiaries still pending payment for this cycle.
            </p>
          </div>

          <div class="quick-links">
            <router-link :to="isTeamLeader ? '/charity/beneficiaries' : '/charity/beneficiaries'" class="q-link">
              <span>View All Beneficiaries</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
            <router-link to="/charity/teams" class="q-link">
              <span>{{ isTeamLeader ? 'My Team Members' : 'Manage Teams' }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="dashboard-section side-section">
          <div class="section-header">
            <h2>Recent Activity</h2>
          </div>
          <div class="activity-feed">
            <div v-for="log in stats.recentActivity" :key="log.logId" class="activity-item">
              <div class="activity-dot" :class="log.action.toLowerCase()"></div>
              <div class="activity-content">
                <div class="activity-msg-wrapper">
                  <div class="activity-msg">
                    <strong>{{ log.user?.fullName || 'System' }}</strong> 
                    {{ getActionText(log) }}
                  </div>
                  <div class="activity-details-tooltip" v-if="log.details && Object.keys(log.details).length > 0">
                    <div class="tooltip-header">Activity Details</div>
                    <div v-for="(val, key) in filterDetails(log.details)" :key="key" class="tooltip-row">
                      <span class="t-key">{{ formatDetailKey(key) }}:</span>
                      <span class="t-val">{{ formatDetailValue(val, key) }}</span>
                    </div>
                  </div>
                </div>
                <div class="activity-time">{{ timeAgo(log.created_at) }}</div>
              </div>
            </div>
            <div v-if="stats.recentActivity.length === 0" class="empty-feed">
              No recent activity recorded.
            </div>
            
            <div v-if="hasMoreLogs" class="load-more-container">
              <button @click="loadMoreLogs" class="btn-load-more" :disabled="loadingLogs">
                <span v-if="loadingLogs" class="mini-spinner"></span>
                {{ loadingLogs ? 'Loading...' : 'Load More Activity' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
        {{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import CharityService from '@/stores/charity'
import { exportCharityMasterReport } from '@/utils/charityExport'

const authStore = useAuthStore()
const isTeamLeader = computed(() => authStore.user?.role === 'charity_teamleader')

const loading = ref(true)
const loadingLogs = ref(false)
const loadingMasterExport = ref(false)
const error = ref(null)

const allReleases = ref([])
const selectedReleaseId = ref(null)

const sortedAllReleases = computed(() => {
  return [...allReleases.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const stats = ref({
  beneficiaries: { total: 0, active: 0, inactive: 0 },
  teams: { total: 0, active: 0 },
  allocation: { totalMonthly: 0 },
  distribution: { completed: 0, total: 0, release: null },
  recentActivity: []
})

const logPagination = ref({
  page: 1,
  limit: 10,
  hasMore: false
})

const hasMoreLogs = computed(() => logPagination.value.hasMore)

const toasts = ref([])

const addToast = (msg, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, msg, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 4000)
}

const handleMasterExport = async () => {
  console.log('Master Export Button Clicked');
  if (!selectedReleaseId.value) {
    return alert('Please select a distribution release first')
  }
  
  loadingMasterExport.value = true
  try {
    const targetRelease = allReleases.value.find(r => r.distribution_release_id === selectedReleaseId.value)
    console.log('Target Release:', targetRelease);

    // 1. Fetch All Data
    const [bensRes, teamsRes] = await Promise.all([
      CharityService.getBeneficiaries({ page: 1, size: 5000, isActive: true }),
      CharityService.getTeams({ page: 1, size: 500 })
    ])

    if (!bensRes.success) throw new Error(bensRes.error || 'Failed to fetch beneficiaries')
    if (!teamsRes.success) throw new Error(teamsRes.error || 'Failed to fetch teams')

    console.log('Data fetched successfully', { 
      bens: bensRes.data?.length, 
      teams: teamsRes.data?.length 
    });

    // 2. Trigger Complex Export
    exportCharityMasterReport({
      beneficiaries: bensRes.data,
      teams: teamsRes.data,
      release: targetRelease,
      fileName: 'Charity_Master_Report'
    })

    addToast('✅ Master Report generated successfully')
  } catch (err) {
    console.error('Master Export Error:', err)
    addToast(`❌ ${err.message || 'Failed to generate report'}`, 'error')
  } finally {
    loadingMasterExport.value = false
  }
}

const fetchStats = async () => {
  loading.value = true
  error.value = null
  try {
    const [statsRes, settingsRes] = await Promise.all([
      CharityService.getDashboardStats(),
      CharityService.getSettings()
    ])

    if (statsRes.success) {
      stats.value = {
        beneficiaries: statsRes.data.beneficiaries || { total: 0, active: 0, inactive: 0 },
        teams: statsRes.data.teams || { total: 0, active: 0 },
        allocation: statsRes.data.allocation || { totalMonthly: 0 },
        distribution: statsRes.data.distribution || { completed: 0, total: 0, release: null },
        recentActivity: statsRes.data.recentActivity || []
      }
      if (stats.value.recentActivity.length >= 10) {
        logPagination.value.hasMore = true
      }
    } else {
      error.value = statsRes.error || 'Failed to load dashboard statistics'
      return // Stop if stats fail
    }

    if (settingsRes.success) {
      allReleases.value = settingsRes.data.distributionRelease || []
      // Auto-select latest release
      if (allReleases.value.length > 0) {
        const sorted = [...allReleases.value].sort((a, b) => new Date(b.date) - new Date(a.date))
        const latest = sorted[0]
        selectedReleaseId.value = latest.distribution_release_id
      }
    }
  } catch (err) {
    console.error('fetchStats Crash:', err)
    error.value = 'An unexpected error occurred while loading dashboard data'
  } finally {
    loading.value = false
  }
}

const loadMoreLogs = async () => {
  if (loadingLogs.value || !hasMoreLogs.value) return
  
  loadingLogs.value = true
  try {
    const nextPage = logPagination.value.page + 1
    const res = await CharityService.getLogs({ page: nextPage, limit: logPagination.value.limit })
    if (res.success) {
      stats.value.recentActivity = [...stats.value.recentActivity, ...res.data]
      logPagination.value.page = nextPage
      logPagination.value.hasMore = res.pagination.hasMore
    }
  } catch (err) {
    console.error('Failed to load more logs:', err)
  } finally {
    loadingLogs.value = false
  }
}

const getActionText = (log) => {
  const action = log.action.toLowerCase()
  const module = log.module.toLowerCase()
  
  if (action === 'create') return `registered a new ${module}`
  if (action === 'update') return `updated ${module} info`
  if (action === 'transfer') return `transferred a beneficiary`
  if (action === 'adjustment') return `applied an allocation adjustment`
  if (action === 'delivery') return `recorded a payment delivery`
  if (action === 'delete') return `deactivated a ${module}`
  if (action === 'update_delivery') return `updated a delivery record`
  if (action.includes('bulk')) return `performed a bulk ${module} operation`
  
  return `${action.replace(/_/g, ' ')}d a ${module}`
}

const keyMap = {
  fullname: 'Name',
  fullname_en: 'Name (EN)',
  monthlyAllocation: 'Monthly Amount',
  amount: 'Amount',
  isActive: 'Is Active',
  isActive_en: 'Is Active',
  teamId: 'Team ID',
  paymentMethod: 'Payment Method',
  bankInfo: 'Bank Details',
  type: 'Adjustment Type',
  reason: 'Reason',
  is_delivered: 'Delivered',
  isDelivered: 'Delivered',
  recipt: 'Receipt Number',
  count: 'Affected Records',
  releaseId: 'Release ID',
  releaseDate: 'Release Date',
  appliedUpdates: 'Changes Applied'
}

const formatDetailKey = (key) => {
  if (typeof key !== 'string') return String(key)
  return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatDetailValue = (val, key) => {
  if (val === null || val === undefined) return 'N/A'
  
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  
  // Format Currency
  if (['monthlyAllocation', 'amount'].includes(key)) {
    return CharityService.formatCurrency(val)
  }

  // Format Date-like strings
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(val).toLocaleDateString()
  }

  if (typeof val === 'object') {
    if (key === 'fullInfo') {
      const parts = []
      if (val.location) parts.push(val.location.city || val.location.region)
      if (val.contact) parts.push(val.contact.phone)
      return parts.join(', ') || 'Contact/Location details'
    }
    if (key === 'bankInfo') {
      return `${val.bank || 'Unknown Bank'}: ${val.account_no || 'No Account'}`
    }
    if (key === 'appliedUpdates') {
      return Object.keys(val).map(k => `${formatDetailKey(k)}: ${formatDetailValue(val[k], k)}`).join(' | ')
    }
    if (Array.isArray(val)) {
      return val.map(v => formatDetailKey(v)).join(', ')
    }
    return 'Detailed info'
  }
  
  return val
}

const filterDetails = (details) => {
  if (!details) return {}
  const filtered = {}
  const ignoreKeys = ['updatedBy', 'createdBy', 'updated_by', 'created_by', 'created_at', 'updated_at', 'deleted_by', 'deleted_at', 'delivery_id', 'adjustment_id']
  
  Object.keys(details).forEach(key => {
    if (!ignoreKeys.includes(key)) {
      filtered[key] = details[key]
    }
  })
  return filtered
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(date).toLocaleDateString()
}

onMounted(fetchStats)
</script>

<style scoped>
.charity-dashboard { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.page-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
.page-subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }

.header-actions { display: flex; gap: 12px; align-items: center; }
.export-controls { display: flex; gap: 8px; align-items: center; background: #fff; padding: 4px; border-radius: 12px; border: 1px solid #e2e8f0; }
.release-select { border: none; background: transparent; font-size: 13px; color: #475569; font-weight: 600; padding: 0 8px; outline: none; cursor: pointer; max-width: 220px; }
.master-export-btn { background: #f0fdf4; color: #166534; border-color: #b7e4cf; padding: 8px 16px; font-size: 13px; }

.btn-outline { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #475569; font-weight: 600; text-decoration: none; transition: all 0.2s; }
.btn-outline:hover { border-color: #6366f1; color: #6366f1; }
.btn-icon { width: 18px; height: 18px; }

/* KPI Stats */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 32px; }
.stat-card { background: white; border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
.stat-icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.stat-icon svg { width: 26px; height: 26px; }

.ben-icon { background: #eff6ff; color: #2563eb; }
.alloc-icon { background: #fdf2f7; color: #db2777; }
.team-icon { background: #f0fdf4; color: #16a34a; }
.prog-icon { background: #f5f3ff; color: #7c3aed; }

.stat-info h3 { font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 24px; font-weight: 800; color: #1e293b; line-height: 1; }
.stat-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 500; }

/* Sections */
.dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.dashboard-section { background: white; border-radius: 24px; padding: 28px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-header h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.release-tag { background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

/* Progress */
.progress-container { background: #f8fafc; padding: 24px; border-radius: 20px; margin-bottom: 24px; }
.progress-labels { display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 600; font-size: 14px; color: #475569; }
.progress-labels .pct { color: #6366f1; font-weight: 800; font-size: 18px; }
.progress-bar-bg { height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 6px; transition: width 1s ease; }
.progress-hint { font-size: 13px; color: #94a3b8; margin-top: 12px; }

.quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.q-link { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f1f5f9; border-radius: 16px; text-decoration: none; color: #1e293b; font-weight: 600; transition: all 0.2s; }
.q-link:hover { background: #e2e8f0; transform: translateX(4px); }
.q-link svg { width: 18px; height: 18px; color: #6366f1; }

/* Activity */
.activity-feed { display: flex; flex-direction: column; gap: 20px; }
.activity-item { display: flex; gap: 16px; position: relative; }
.activity-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.activity-dot.create { background: #10b981; box-shadow: 0 0 0 4px #e6f7f0; }
.activity-dot.update { background: #3b82f6; box-shadow: 0 0 0 4px #eff6ff; }
.activity-dot.delivery { background: #8b5cf6; box-shadow: 0 0 0 4px #f5f3ff; }
.activity-dot.adjustment { background: #f59e0b; box-shadow: 0 0 0 4px #fffbeb; }

.activity-content { flex: 1; }
.activity-msg-wrapper { position: relative; }
.activity-msg { font-size: 13.5px; color: #334155; line-height: 1.5; cursor: help; }
.activity-time { font-size: 12px; color: #94a3b8; margin-top: 4px; }

/* Tooltip */
.activity-details-tooltip {
  position: absolute;
  top: 100%;
  left: 0;
  background: #1e293b;
  color: white;
  padding: 12px;
  border-radius: 12px;
  font-size: 12px;
  width: 240px;
  z-index: 100;
  display: none;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  margin-top: 8px;
}
.activity-msg-wrapper:hover .activity-details-tooltip {
  display: block;
}
.tooltip-header { font-weight: 700; margin-bottom: 8px; color: #94a3b8; text-transform: uppercase; font-size: 10px; border-bottom: 1px solid #334155; padding-bottom: 4px; }
.tooltip-row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.t-key { color: #94a3b8; }
.t-val { font-weight: 500; text-align: right; }

/* Load More */
.load-more-container { margin-top: 12px; text-align: center; }
.btn-load-more {
  background: #f1f5f9;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}
.btn-load-more:hover:not(:disabled) { background: #e2e8f0; color: #4338ca; }
.btn-load-more:disabled { opacity: 0.7; cursor: not-allowed; }

.mini-spinner { width: 14px; height: 14px; border: 2px solid #6366f1; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }

.empty-feed { text-align: center; padding: 40px 0; color: #94a3b8; font-style: italic; }

.loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px; color: #64748b; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 20px; border-radius: 16px; text-align: center; margin: 40px 0; }
.error-alert button { margin-top: 12px; padding: 8px 20px; background: #b91c1c; color: white; border: none; border-radius: 8px; cursor: pointer; }

/* Toasts */
.toast-container { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 12px; z-index: 9999; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); min-width: 200px; animation: slideIn 0.3s ease; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

@media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
</style>
