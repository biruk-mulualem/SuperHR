<template>
  <div class="toast-container">
    <div v-for="toast in toasts" :key="toast.id" :class="`toast ${toast.type}`">
      <span>{{ toast.message }}</span>
      <button @click="$emit('remove-toast', toast.id)">×</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  toasts: {
    type: Array,
    default: () => []
  }
})

defineEmits(['remove-toast'])
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 250px;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #ef4444;
}

.toast.info {
  background: #3b82f6;
}

.toast.warning {
  background: #f59e0b;
}

.toast button {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .toast-container {
    bottom: 12px;
    right: 12px;
    left: 12px;
  }
  .toast {
    width: auto;
  }
}
</style>