<template>
  <div class="app-layout">
    <!-- Header at the top - full width -->
    <AppHeader @toggle-sidebar="toggleSidebar" />
    
    <div class="layout-body">
      <!-- Sidebar below header - STICKY (stays in place while scrolling) -->
      <AppSidebar :class="{ collapsed: isSidebarCollapsed }" />
      
      <!-- Main content area - this scrolls -->
      <div class="main-container" :class="{ expanded: isSidebarCollapsed }">
        <div class="content-wrapper">
          <router-view />
        </div>
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import AppHeader from '@/components/shared/AppHeader.vue'
import AppFooter from '@/components/shared/AppFooter.vue'

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden; /* Prevents body from scrolling */
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
  background: #f5f7fb;
  overflow: hidden; /* Prevents outer scroll */
}

.layout-body {
  display: flex;
  flex: 1;
  position: relative;
  min-height: 0; /* Important for flex children to respect height */
  overflow: hidden; /* Prevents layout body from scrolling */
}

/* Main container - this scrolls */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Only this scrolls */
  height: 100%; /* Full height within layout-body */
}

.content-wrapper {
  flex: 1;
  padding: 24px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }
}
</style>