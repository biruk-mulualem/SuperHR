<template>
  <header class="header" v-if="authStore.isAuthenticated && authStore.user">
    <div class="header-left">
      <button @click="toggleSidebar" class="menu-btn">
        <svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="logo-section">
   
        <span class="system-name">SUPER SYSTEM</span>
      </div>
    </div>
    
    <div class="header-right">
      <!-- Notifications -->
      <div class="notification-dropdown" @click.stop>
        <button class="notification-btn" @click="toggleNotifications">
          <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
        </button>
        
        <transition name="dropdown">
          <div v-if="showNotifications" class="notifications-panel">
            <div class="notifications-header">
              <h3>Notifications</h3>
              <button class="mark-all" @click="markAllRead">Mark all as read</button>
            </div>
            <div class="notifications-list">
              <div v-for="notif in notifications" :key="notif.id" class="notification-item" :class="{ unread: !notif.read }">
                <div class="notification-icon" :class="notif.type">
                  <svg v-if="notif.type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <circle cx="12" cy="8" r="0.5" fill="currentColor" />
                  </svg>
                  <svg v-else-if="notif.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                  </svg>
                </div>
                <div class="notification-content">
                  <p>{{ notif.message }}</p>
                  <span class="notification-time">{{ notif.time }}</span>
                </div>
              </div>
            </div>
            <div class="notifications-footer">
              <button class="view-all">View all notifications</button>
            </div>
          </div>
        </transition>
      </div>

      <!-- User Avatar - Only avatar visible -->
      <div class="user-avatar-btn" @click="toggleDropdown">
        <img 
          :src="userProfilePicture" 
          class="avatar"
          @error="handleImageError"
        />
        <svg class="dropdown-arrow" :class="{ rotated: isDropdownOpen }" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      
      <!-- Dropdown Menu -->
      <transition name="dropdown">
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <div class="dropdown-header">
            <img 
              :src="userProfilePicture" 
              class="dropdown-avatar"
              @error="handleImageError"
            />
            <div class="dropdown-user-info">
              <span class="dropdown-user-name">{{ userDisplayName }}</span>
              <span class="dropdown-role-badge" :class="`role-${authStore.user?.role}`">
                {{ getRoleTitle() }}
              </span>
              <span v-if="authStore.user?.departmentName" class="dropdown-department">
                {{ authStore.user.departmentName }}
              </span>
            </div>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <button @click="goToProfile" class="dropdown-item">
            <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>My Profile</span>
          </button>
          
          <button @click="goToSettings" class="dropdown-item">
            <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
          
          <div class="dropdown-divider"></div>
          
          <div v-if="authStore.user?.employeeCode || authStore.user?.departmentCode" class="dropdown-stats">
            <div v-if="authStore.user?.employeeCode" class="stat-item">
              <span class="stat-label">Employee ID</span>
              <span class="stat-value">{{ authStore.user.employeeCode }}</span>
            </div>
            <div v-if="authStore.user?.departmentCode" class="stat-item">
              <span class="stat-label">Dept Code</span>
              <span class="stat-value">{{ authStore.user.departmentCode }}</span>
            </div>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <button @click="handleLogout" class="dropdown-item logout-item">
            <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </transition>
    </div>
    
    <!-- Backdrop -->
    <div v-if="isDropdownOpen || showNotifications" class="dropdown-backdrop" @click="closeAll"></div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['toggle-sidebar'])
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isDropdownOpen = ref(false)
const showNotifications = ref(false)
const unreadCount = ref(3)

// Mock notifications
const notifications = ref([
  { id: 1, message: 'New user registered: John Smith', type: 'info', time: '2 min ago', read: false },
  { id: 2, message: 'Leave request approved for Sarah Jones', type: 'success', time: '1 hour ago', read: false },
  { id: 3, message: 'System backup completed successfully', type: 'success', time: '3 hours ago', read: false },
  { id: 4, message: 'Salary report is ready for download', type: 'warning', time: '5 hours ago', read: true },
])

const userDisplayName = computed(() => {
  const user = authStore.user
  if (!user) return 'User'
  return user.fullEmployeeName || user.fullName || 'User'
})

const userProfilePicture = computed(() => {
  const user = authStore.user
  if (!user) return null
  return user.profilePicture || user.profilePictureUrl || null
})

const getRoleTitle = () => {
  const titles = {
    admin: 'Administrator',
    hr: 'HR Manager',
    finance: 'Finance Officer',
    employee: 'Employee',
      attendance: 'Attendance Manager'
  }
  return titles[authStore.user?.role] || authStore.user?.role || 'User'
}

const handleImageError = (e) => {
  const name = userDisplayName.value || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  e.target.src = `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${initials}`
}

const toggleSidebar = () => emit('toggle-sidebar')
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  showNotifications.value = false
}
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  isDropdownOpen.value = false
}
const closeAll = () => {
  isDropdownOpen.value = false
  showNotifications.value = false
}

const markAllRead = () => {
  notifications.value.forEach(n => n.read = true)
  unreadCount.value = 0
}

const goToProfile = () => {
  closeAll()
  router.push('/profile')
}

const goToSettings = () => {
  closeAll()
  router.push('/settings')
}

const handleLogout = async () => {
  closeAll()
  await authStore.logout()
  window.location.replace('/login')
}

const handleClickOutside = (event) => {
  const headerRight = document.querySelector('.header-right')
  if (headerRight && !headerRight.contains(event.target)) {
    closeAll()
  }
}

const handleEscapeKey = (event) => {
  if (event.key === 'Escape') closeAll()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

<style scoped>
.header {
  background: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  border-bottom: 1px solid #e9edf2;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.menu-btn {
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #e2e8f0;
}

.menu-icon {
  width: 20px;
  height: 20px;
  color: #475569;
}

/* Logo Section */
.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 18px;
  height: 18px;
  color: white;
}

.system-name {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b, #475569);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.header-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Notification Button - Smaller */
.notification-dropdown {
  position: relative;
}

.notification-btn {
  position: relative;
  background: #f8fafc;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.notification-btn:hover {
  background: #f1f5f9;
}

.notification-icon {
  width: 18px;
  height: 18px;
  color: #475569;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 20px;
  min-width: 14px;
}

/* User Avatar Button - Only avatar */
.user-avatar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px 4px 4px;
  border-radius: 40px;
  transition: all 0.2s;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.user-avatar-btn:hover {
  background: #f1f5f9;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.dropdown-arrow {
  width: 14px;
  height: 14px;
  color: #94a3b8;
  transition: transform 0.2s;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* Notifications Panel */
.notifications-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
  border: 1px solid #e2e8f0;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.notifications-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.mark-all {
  background: none;
  border: none;
  font-size: 11px;
  color: #6a11cb;
  cursor: pointer;
}

.notifications-list {
  max-height: 380px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: #fef3c7;
}

.notification-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.info {
  background: #3b82f620;
  color: #3b82f6;
}

.notification-icon.success {
  background: #10b98120;
  color: #10b981;
}

.notification-icon.warning {
  background: #f59e0b20;
  color: #f59e0b;
}

.notification-icon svg {
  width: 16px;
  height: 16px;
}

.notification-content {
  flex: 1;
}

.notification-content p {
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 10px;
  color: #94a3b8;
}

.notifications-footer {
  padding: 10px 16px;
  text-align: center;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.view-all {
  background: none;
  border: none;
  font-size: 12px;
  color: #6a11cb;
  cursor: pointer;
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
  border: 1px solid #e2e8f0;
}

.dropdown-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dropdown-user-name {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.dropdown-role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 600;
  width: fit-content;
}

.dropdown-department {
  font-size: 10px;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.dropdown-stats {
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  background: #fafcff;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 9px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.stat-value {
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 6px 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  transition: all 0.2s;
}

.dropdown-item:hover {
  background: #f8fafc;
  padding-left: 24px;
}

.dropdown-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
}

.logout-item {
  color: #dc2626;
}

.logout-item .dropdown-icon {
  color: #dc2626;
}

.logout-item:hover {
  background: #fef2f2;
}

.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* Role Badge Colors */
.role-admin { background: #dc2626; color: white; }
.role-hr { background: #3b82f6; color: white; }
.role-finance { background: #10b981; color: white; }
.role-employee { background: #8b5cf6; color: white; }

/* Animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Mobile */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
    height: 56px;
  }
  
  .system-name {
    display: none;
  }
  
  .dropdown-menu,
  .notifications-panel {
    width: calc(100vw - 32px);
    right: -16px;
  }
}
</style>