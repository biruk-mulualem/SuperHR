<!-- FILE: src/views/settings/SettingsPage.vue -->
<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-left">
        <h1>⚙️ Settings</h1>
        <p>Manage your system configuration and preferences</p>
      </div>
      <div class="header-right">
        <span class="version-badge">v2.0.0</span>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.name }}</span>
        <span class="tab-badge" v-if="tab.badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="settings-content">
      <div class="content-wrapper">
        <DepartmentsPage v-if="activeTab === 'departments'" />
        <PositionsPage v-if="activeTab === 'positions'" />
        <RolesPage v-if="activeTab === 'roles'" />
        <AttendanceRulesPage v-if="activeTab === 'attendance'" />
        <TaxRulesPage v-if="activeTab === 'tax'" />
        <ApprovalSettingsPage v-if="activeTab === 'approval'" />
        <BackupRestorePage v-if="activeTab === 'backup'" />
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import DepartmentsPage from './tabs/DepartmentsPage.vue'
import PositionsPage from './tabs/PositionsPage.vue'
import RolesPage from './tabs/RolesPage.vue'
import AttendanceRulesPage from './tabs/AttendanceRulesPage.vue'
import TaxRulesPage from './tabs/TaxRulesPage.vue'
import ApprovalSettingsPage from './tabs/ApprovalSettingsPage.vue'
import BackupRestorePage from './tabs/BackupRestorePage.vue'

const activeTab = ref('departments')
const toasts = ref([])

const tabs = [
  { id: 'departments', name: 'Departments', icon: '' },
  { id: 'positions', name: 'Positions', icon: '' },
  { id: 'roles', name: 'Roles', icon: '' },
  { id: 'attendance', name: 'Attendance', icon: '' },
  { id: 'tax', name: 'Tax Rules', icon: '' },
  { id: 'approval', name: 'Approval', icon: '' },
  { id: 'backup', name: 'Backup', icon: '' }
]

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 4000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

provide('addToast', addToast)
</script>

<style scoped>
/* ============================================
   MAIN LAYOUT
   ============================================ */
.settings-page {
  min-height: 100vh;
  background: #f7f8fc;
  padding: 24px 32px;
}

/* ============================================
   HEADER
   ============================================ */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding: 0 4px;
}

.header-left h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a2332;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}

.header-left p {
  color: #6b7a8f;
  font-size: 15px;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-badge {
  background: #eef2ff;
  color: #4f46e5;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #c7d2fe;
}

/* ============================================
   TAB NAVIGATION
   ============================================ */
.tab-navigation {
  display: flex;
  gap: 4px;
  background: white;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid #e8ecf1;
  margin-bottom: 28px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  color: #6b7a8f;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #f1f4f9;
  color: #1a2332;
}

.tab-btn.active {
  background: #4f46e5;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.tab-btn.active .tab-icon {
  color: white;
}

.tab-btn.active .tab-badge {
  background: rgba(255,255,255,0.2);
  color: white;
}

.tab-icon {
  font-size: 18px;
  line-height: 1;
}

.tab-label {
  font-size: 14px;
}

.tab-badge {
  background: #e8ecf1;
  color: #6b7a8f;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
  margin-left: 2px;
}

/* ============================================
   CONTENT
   ============================================ */
.settings-content {
  background: white;
  border-radius: 16px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}

.content-wrapper {
  padding: 0;
}

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  animation: slideUp 0.4s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.toast.success {
  background: #10b981;
  color: white;
}

.toast.error {
  background: #ef4444;
  color: white;
}

.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.toast-close:hover {
  background: rgba(255,255,255,0.3);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1024px) {
  .settings-page {
    padding: 20px;
  }

  .settings-header h1 {
    font-size: 24px;
  }

  .tab-navigation {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 4px;
    gap: 2px;
  }

  .tab-btn {
    padding: 8px 16px;
    font-size: 13px;
    flex-shrink: 0;
  }

  .tab-label {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }

  .settings-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .settings-header h1 {
    font-size: 22px;
  }

  .settings-header p {
    font-size: 14px;
  }

  .header-right {
    width: 100%;
  }

  .tab-navigation {
    gap: 2px;
    padding: 4px;
    border-radius: 10px;
  }

  .tab-btn {
    padding: 8px 14px;
    font-size: 12px;
    border-radius: 8px;
  }

  .tab-icon {
    font-size: 16px;
  }

  .tab-label {
    font-size: 12px;
  }

  .tab-badge {
    display: none;
  }

  .toast-container {
    bottom: 16px;
    right: 16px;
    max-width: calc(100% - 32px);
  }

  .toast {
    padding: 12px 14px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .settings-page {
    padding: 12px;
  }

  .tab-navigation {
    flex-wrap: wrap;
    justify-content: center;
  }

  .tab-btn {
    flex: 1;
    min-width: 60px;
    justify-content: center;
    padding: 8px 10px;
  }

  .tab-label {
    font-size: 11px;
  }

  .tab-icon {
    font-size: 15px;
  }

  .settings-header h1 {
    font-size: 20px;
  }
}
</style>