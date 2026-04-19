<template>
  <div class="toast-container">
    <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
      <span class="toast-icon">{{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : '⚠' }}</span>
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  toasts: Array
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast {
  padding: 12px 20px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 500;
  animation: slideIn 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.toast.success { background: #10b981; color: white; }
.toast.error { background: #ef4444; color: white; }
.toast.warning { background: #f59e0b; color: white; }
.toast-icon { font-size: 14px; font-weight: bold; }
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>