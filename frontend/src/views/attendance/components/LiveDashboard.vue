<template>
  <div class="live-dashboard">
    <div class="dashboard-header">
      <div class="header-left">
        <span class="pulse-dot"></span>
        <h3>Live Status</h3>
      </div>
      <span class="live-badge">Real-time</span>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <span>Loading stats...</span>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span>⚠️ Failed to load stats</span>
      <button @click="fetchData" class="retry-btn">Retry</button>
    </div>
    
    <!-- Data Display -->
    <div v-else class="dashboard-cards">
      <div class="status-card lunch">
        <div class="card-icon">🍽️</div>
        <div class="card-details">
          <div class="card-label">Lunch Break</div>
          <div class="card-count">{{ stats.activeBreaks || 0 }}</div>
        </div>
      </div>
      <div class="status-card dinner">
        <div class="card-icon">🍲</div>
        <div class="card-details">
          <div class="card-label">Dinner Break</div>
          <div class="card-count">{{ stats.activeDinnerBreaks || 0 }}</div>
        </div>
      </div>
      <div class="status-card field">
        <div class="card-icon">🏔️</div>
        <div class="card-details">
          <div class="card-label">Field Work</div>
          <div class="card-count">{{ stats.activeFieldWork || 0 }}</div>
        </div>
      </div>
      <div class="status-card overtime">
        <div class="card-icon">⏰</div>
        <div class="card-details">
          <div class="card-label">Adjustments</div>
          <div class="card-count">{{ stats.pendingAdjustments || 0 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import attendanceService from '@/stores/attendanceService'

const stats = ref({
  activeBreaks: 0,
  activeDinnerBreaks: 0,
  activeFieldWork: 0,
  pendingAdjustments: 0
})
const loading = ref(false)
const error = ref(null)
let refreshInterval = null

const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Use getAllLateNightAdjustments instead of getLateNightAdjustments
    const [activeBreaks, activeFieldWork, pendingAdjustments] = await Promise.all([
      attendanceService.getActiveBreaks(),
      attendanceService.getAllFieldWork(),
      attendanceService.getAllLateNightAdjustments()  // ← Changed this
    ])
    
    const lunchBreaks = activeBreaks.filter(b => b.breakType === 'lunch')
    const dinnerBreaks = activeBreaks.filter(b => b.breakType === 'dinner')
    
    stats.value = {
      activeBreaks: lunchBreaks.length,
      activeDinnerBreaks: dinnerBreaks.length,
      activeFieldWork: activeFieldWork?.length || 0,
      pendingAdjustments: pendingAdjustments?.length || 0  // All adjustments shown
    }
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err)
    error.value = 'Failed to load statistics'
  } finally {
    loading.value = false
  }
}

const startAutoRefresh = () => {
  refreshInterval = setInterval(fetchData, 30000)
}

onMounted(() => {
  fetchData()
  startAutoRefresh()
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.live-dashboard {
  background: white;
  border-radius: 20px;
  margin-bottom: 24px;
  overflow: hidden;
}
.dashboard-header {
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e8edf2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pulse-dot {
  width: 10px;
  height: 10px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}
.live-badge {
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 4px 12px;
  border-radius: 30px;
  animation: pulse 2s infinite;
}
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 24px;
}
.status-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
}
.status-card.lunch { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.status-card.dinner { background: linear-gradient(135deg, #fed7aa, #fdba74); }
.status-card.field { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.status-card.overtime { background: linear-gradient(135deg, #e0e7ff, #c7d2fe); }
.card-icon { font-size: 32px; }
.card-count { font-size: 28px; font-weight: 800; color: #1e293b; }
.card-label { font-size: 12px; color: #64748b; }
.loading-state, .error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: #64748b;
}
.loader {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}
</style>