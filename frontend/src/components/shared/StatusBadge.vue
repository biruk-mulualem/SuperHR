<template>
  <span :class="['status-badge', status]">
    {{ text }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const statusMap = {
  'active': 'On Break',
  'late': 'Late',
  'absent': 'Absent',
  'completed': 'Completed',
  'on-time': 'On Time'
}

const text = computed(() => statusMap[props.status] || props.status)
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 30px;
  font-size: 10px;
  font-weight: 600;
}
.status-badge.active { background: #fef3c7; color: #d97706; }
.status-badge.late { background: #fed7aa; color: #ea580c; }
.status-badge.absent { background: #fee2e2; color: #dc2626; }
.status-badge.completed, .status-badge.on-time { background: #d1fae5; color: #059669; }
</style>