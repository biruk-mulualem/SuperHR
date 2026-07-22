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
  
  // ⭐ NEW: Store and Checker dashboards
  store: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
  storekeeper: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
  store_it: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
  store_manager: defineAsyncComponent(() => import('./components/StoreDashboard.vue')),
  
  checker: defineAsyncComponent(() => import('./components/CheckerDashboard.vue')),
}

// Get the current dashboard component based on user role
const currentDashboard = computed(() => {
  const role = authStore.user?.role || 'employee'
  
  // Map role to dashboard
  // If the role matches any of the store roles, use StoreDashboard
  const storeRoles = ['store', 'storekeeper', 'store_it', 'store_manager']
  if (storeRoles.includes(role)) {
    return dashboardComponents.store
  }
  
  // If role is checker, use CheckerDashboard
  if (role === 'checker') {
    return dashboardComponents.checker
  }
  
  // Default: use the role mapping or fallback to employee
  return dashboardComponents[role] || dashboardComponents.employee
})
</script>

<style scoped>
.dashboard-content {
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}
</style>