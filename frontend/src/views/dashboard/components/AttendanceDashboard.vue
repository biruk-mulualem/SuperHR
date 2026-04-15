<template>
  <div class="role-dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Employees</h3>
        <p class="stat-number">150</p>
        <span class="stat-trend">Active: 142</span>
      </div>
      <div class="stat-card">
        <h3>Pending Leaves</h3>
        <p class="stat-number">12</p>
        <span class="stat-trend">Requires approval</span>
      </div>
      <div class="stat-card">
        <h3>New Hires</h3>
        <p class="stat-number">5</p>
        <span class="stat-trend">This month</span>
      </div>
      <div class="stat-card">
        <h3>Departments</h3>
        <p class="stat-number">8</p>
        <span class="stat-trend">Active departments</span>
      </div>
    </div>
    
    <div class="section">
      <h2>Pending Leave Requests</h2>
      <div class="leave-list">
        <div class="leave-item">
          <div>
            <strong>Sarah Johnson</strong>
            <span>Annual Leave (3 days)</span>
          </div>
          <div class="leave-actions">
            <button class="approve-btn">Approve</button>
            <button class="reject-btn">Reject</button>
          </div>
        </div>
        <div class="leave-item">
          <div>
            <strong>Michael Chen</strong>
            <span>Sick Leave (2 days)</span>
          </div>
          <div class="leave-actions">
            <button class="approve-btn">Approve</button>
            <button class="reject-btn">Reject</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// HR specific logic
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

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.section h2 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #1a1a2e;
}

.leave-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.leave-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.leave-item strong {
  display: block;
  color: #1a1a2e;
}

.leave-item span {
  font-size: 12px;
  color: #6b7280;
}

.leave-actions {
  display: flex;
  gap: 8px;
}

.approve-btn, .reject-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.approve-btn {
  background: #10b981;
  color: white;
}

.reject-btn {
  background: #ef4444;
  color: white;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>