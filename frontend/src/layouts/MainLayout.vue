<template>
  <div class="app-layout">
    <!-- Header at the top - full width -->
    <AppHeader 
      v-if="!isPrintRoute" 
      @toggle-sidebar="toggleSidebar" 
    />
    
    <div class="layout-body">
      <!-- Sidebar below header - STICKY (stays in place while scrolling) -->
      <AppSidebar 
        v-if="!isPrintRoute" 
        :class="{ collapsed: isSidebarCollapsed }" 
      />
      
      <!-- Main content area - this scrolls -->
      <div 
        class="main-container" 
        :class="{ 
          expanded: isSidebarCollapsed,
          'print-mode': isPrintRoute 
        }"
      >
        <div class="content-wrapper">
          <router-view />
        </div>
        <AppFooter v-if="!isPrintRoute" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/shared/AppSidebar.vue'
import AppHeader from '@/components/shared/AppHeader.vue'
import AppFooter from '@/components/shared/AppFooter.vue'

const route = useRoute()
const isSidebarCollapsed = ref(false)

// Check if current route is a print route
const isPrintRoute = computed(() => {
  return route.meta?.hideLayout === true || route.path.includes('/print-')
})

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

/* ================================================================
   🔥 PRINT MODE STYLES
   ================================================================ */
.main-container.print-mode {
  overflow: visible !important;
  padding: 0 !important;
  margin: 0 !important;
  background: white !important;
}

.main-container.print-mode .content-wrapper {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100% !important;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .app-layout {
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }
  
  .layout-body {
    overflow: visible !important;
    display: block !important;
  }
  
  .main-container {
    overflow: visible !important;
    height: auto !important;
  }
  
  .main-container.print-mode .content-wrapper {
    padding: 0 !important;
  }
}



</style>