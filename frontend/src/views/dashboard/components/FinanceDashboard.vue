<template>
  <div class="role-dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Budget</h3>
        <p class="stat-number">$1.85M</p>
        <span class="stat-trend">Annual budget</span>
      </div>
      <div class="stat-card">
        <h3>Monthly Payroll</h3>
        <p class="stat-number">$185K</p>
        <span class="stat-trend">March 2024</span>
      </div>
      <div class="stat-card">
        <h3>Average Salary</h3>
        <p class="stat-number">$52K</p>
        <span class="stat-trend">Per employee</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Finance specific logic
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