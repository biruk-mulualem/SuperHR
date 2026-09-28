<template>
  <div class="config-header">
    <div class="logo-area">
      <div class="logo-icon">⚡</div>
      <div>
        <h1>Attendance Control Center</h1>
        <p>Configure schedules, track breaks, manage overrides</p>
      </div>
    </div>
    <button class="btn-primary" @click="$emit('refresh')" :disabled="loading">
      🔄 Refresh
    </button>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean
})
defineEmits(['refresh'])
</script>

<style scoped>
.config-header {
  background: white;
  border-radius: 20px;
  padding: 20px 28px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}
.config-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}
.config-header p {
  font-size: 13px;
  color: #64748b;
}
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 600;
  color: white;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>