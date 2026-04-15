<template>
  <div class="create-header">
    <router-link to="/employees" class="back-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </router-link>
    <div class="header-title">
      <h1>New Employee</h1>
      <p>Add employee information</p>
    </div>
    <div class="header-actions">
      <button class="import-btn" @click="$emit('import-click')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Import CSV
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['import-click'])
</script>

<style scoped>
.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #475569;
  text-decoration: none;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.header-title p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.import-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f8fafc;
}

.import-btn svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .create-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
  }
  .import-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>