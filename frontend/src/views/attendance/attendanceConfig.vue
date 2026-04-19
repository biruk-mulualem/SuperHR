<template>
  <div class="attendance-config">
    <AttendanceHeader @refresh="refreshAll" :loading="globalLoading" />
    <ShiftTabs v-model="activeShift" />
    <LiveDashboard />
    
    <!-- Day Shift -->
    <div v-if="activeShift === 'day'">
      <CompanyDefaults shift-type="day" />
      <DepartmentOverrides />
      <EmployeeOverrides />
      <LunchTracking />
      <OvertimeRules />
      <LateNightAdjustments />
      <FieldWorkRegistration />
    </div>
    
    <!-- Night Shift -->
    <div v-if="activeShift === 'night'">
      <CompanyDefaults shift-type="night" />
      <DinnerTracking />
    </div>
    
    <!-- Holidays -->
    <HolidaysConfig v-if="activeShift === 'holidays'" />
    
    <Toast :toasts="toasts" />
  </div>
</template>

<script setup>

import { ref } from 'vue'
import HolidaysConfig from './components/HolidaysConfig.vue'
import AttendanceHeader from './components/AttendanceHeader.vue'
import ShiftTabs from './components/ShiftTabs.vue'
import LiveDashboard from './components/LiveDashboard.vue'
import CompanyDefaults from './components/CompanyDefaults.vue'
import DepartmentOverrides from './components/DepartmentOverrides.vue'
import EmployeeOverrides from './components/EmployeeOverrides.vue'
import LunchTracking from './components/LunchTracking.vue'
import DinnerTracking from './components/DinnerTracking.vue'
import OvertimeRules from './components/OvertimeRules.vue'
import LateNightAdjustments from './components/LateNightAdjustments.vue'
import FieldWorkRegistration from './components/FieldWorkRegistration.vue'

import Toast from '@/components/shared/Toast.vue'



const activeShift = ref('day')
const globalLoading = ref(false)
const toasts = ref([])

const refreshAll = () => {
  // Optional: You can use an event bus or just let each component refresh itself
  window.location.reload() // Simple refresh
}
</script>

<style scoped>
.attendance-config {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}
/* Add any additional global styles here */
</style>