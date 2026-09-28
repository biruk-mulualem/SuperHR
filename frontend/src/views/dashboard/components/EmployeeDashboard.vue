<template>
  <div class="role-dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Leave Balance</h3>
        <p class="stat-number">15 days</p>
        <span class="stat-trend">Available</span>
      </div>
      <div class="stat-card">
        <h3>Attendance</h3>
        <p class="stat-number">98%</p>
        <span class="stat-trend">This month</span>
      </div>
      <div class="stat-card">
        <h3>Next Payday</h3>
        <p class="stat-number">Apr 30</p>
        <span class="stat-trend">2024</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Employee specific logic
</script>

<style scoped>
.role-dashboard {
  animation: fadeIn 0.3s ease;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-card h3 {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #1a1a2e;
  margin: 8px 0;
}

.stat-trend {
  font-size: 12px;
  color: #10b981;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>