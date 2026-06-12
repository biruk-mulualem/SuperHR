<template>
  <div class="dashboard-content">
    <!-- Dynamic Component - Maps to the correct dashboard based on role -->
    <component :is="currentDashboard" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Map roles to dashboard components
const dashboardComponents = {
  admin: defineAsyncComponent(() => import('./components/AdminDashboard.vue')),
  hr: defineAsyncComponent(() => import('./components/HRDashboard.vue')),
  finance: defineAsyncComponent(() => import('./components/FinanceDashboard.vue')),
  employee: defineAsyncComponent(() => import('./components/EmployeeDashboard.vue')),
  attendance: defineAsyncComponent(() => import('./components/AttendanceDashboard.vue')),
  charity_admin: defineAsyncComponent(() => import('./components/CharityDashboard.vue')), 
  charity_teamleader: defineAsyncComponent(() => import('./components/CharityDashboard.vue'))
}

// Get the current dashboard component based on user role
const currentDashboard = computed(() => {
  const role = authStore.user?.role || 'employee'
  return dashboardComponents[role] || dashboardComponents.employee
})
</script>

<style scoped>
.dashboard-content {
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}
</style>