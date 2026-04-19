<template>
  <div class="shift-tabs">
    <button 
      v-for="tab in tabs" 
      :key="tab.value"
      @click="$emit('update:modelValue', tab.value)" 
      :class="{ active: modelValue === tab.value }"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String
})
defineEmits(['update:modelValue'])

const tabs = [
  { value: 'day', label: 'Day Shift', icon: '☀️' },
  { value: 'night', label: 'Night Shift', icon: '🌙' },
  { value: 'holidays', label: 'Holidays', icon: '📅' }
]
</script>

<style scoped>
.shift-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.shift-tabs button {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 10px 28px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
}
.shift-tabs button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
</style>