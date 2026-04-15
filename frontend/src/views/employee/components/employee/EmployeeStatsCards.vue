<template>
  <div class="stats-grid">
    <div class="stat-card" @click="$emit('navigate-to-analytics')">
      <div class="stat-icon blue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <div class="stat-info">
        <h3>Total Employees</h3>
        <p class="stat-number">{{ stats.total || 0 }}</p>
        <span class="stat-trend">All time</span>
      </div>
    </div>
    <div class="stat-card" @click="$emit('navigate-to-analytics')">
      <div class="stat-icon green">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <div class="stat-info">
        <h3>Active Employees</h3>
        <p class="stat-number">{{ stats.active || 0 }}</p>
        <span class="stat-trend positive">{{ calculatePercentage(stats.active, stats.total) }}% of total</span>
      </div>
    </div>
    <div class="stat-card" @click="$emit('navigate-to-analytics')">
      <div class="stat-icon purple">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <div class="stat-info">
        <h3>Departments</h3>
        <p class="stat-number">{{ departments.length }}</p>
        <span class="stat-trend">Active departments</span>
      </div>
    </div>
    <div class="stat-card" @click="$emit('navigate-to-analytics')">
      <div class="stat-icon orange">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
        </svg>
      </div>
      <div class="stat-info">
        <h3>On Leave</h3>
        <p class="stat-number">{{ stats.onLeave || 0 }}</p>
        <span class="stat-trend warning">{{ calculatePercentage(stats.onLeave, stats.active) }}% of active</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    default: () => ({ total: 0, active: 0, onLeave: 0 })
  },
  departments: {
    type: Array,
    default: () => []
  }
})

defineEmits(['navigate-to-analytics'])

const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0
  return ((value / total) * 100).toFixed(1)
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.stat-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }

.stat-info h3 {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-trend {
  font-size: 10px;
  color: #64748b;
  display: block;
  margin-top: 4px;
}

.stat-trend.positive { color: #10b981; }
.stat-trend.warning { color: #f59e0b; }

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .stat-card { padding: 12px; }
  .stat-icon {
    width: 40px;
    height: 40px;
  }
  .stat-icon svg {
    width: 20px;
    height: 20px;
  }
  .stat-number { font-size: 20px; }
}
</style>