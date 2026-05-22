<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- User Profile Section -->
    <div class="user-section" :class="{ 'collapsed-user': isCollapsed }">
      <div class="user-avatar">
        <img :src="userAvatar" alt="User">
        <span class="online-dot"></span>
      </div>
      <div v-show="!isCollapsed" class="user-info">
        <h4>{{ userDisplayName }}</h4>
        <p>{{ roleTitle }}</p>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActiveRoute(item.path) }"
      >
        <component :is="getIcon(item.icon)" class="nav-icon" />
        <span class="nav-text">{{ item.name }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </router-link>
    </nav>

    <!-- Bottom Section with Status -->
    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        <span v-show="!isCollapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import * as icons from '@heroicons/vue/24/outline'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:collapsed'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userRole = computed(() => authStore.user?.role || 'employee')
const isCollapsed = ref(props.collapsed)

const userDisplayName = computed(() => {
  return authStore.user?.fullEmployeeName || authStore.user?.fullName || 'User'
})

const userAvatar = computed(() => {
  return authStore.user?.profilePicture || 
         authStore.user?.profilePictureUrl || 
         `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(userDisplayName.value)}`
})

const roleTitle = computed(() => {
  const titles = {
    admin: 'Administrator',
    hr: 'HR Manager',
    finance: 'Finance Officer',
    employee: 'Employee',
    attendance: 'Attendance Manager'

  }
  return titles[userRole.value] || 'User'
})

const roleMenus = {
  admin: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
    { name: 'Users', path: '/users', icon: 'UsersIcon', badge: null },
    { name: 'Employees', path: '/employees', icon: 'UserGroupIcon', badge: null },
    { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
    { name: 'Leave Requests', path: '/leaves', icon: 'CalendarIcon', badge: null },
    { name: 'payroll', path: '/payroll', icon: 'CurrencyDollarIcon', badge: null },
    // { name: 'Reports', path: '/reports', icon: 'ChartBarIcon', badge: null },
    { name: 'Settings', path: '/settings', icon: 'CogIcon', badge: null },
     
        
  ],
  hr: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
    { name: 'Employees', path: '/employees', icon: 'UserGroupIcon', badge: null },
    { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
    { name: 'Leave Requests', path: '/leaves', icon: 'CalendarIcon', badge: null },
    // { name: 'Reports', path: '/reports', icon: 'ChartBarIcon', badge: null }
  ],
  finance: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
    { name: 'Employees', path: '/employees', icon: 'UserGroupIcon', badge: null },
      { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
    { name: 'payroll', path: '/payroll', icon: 'CurrencyDollarIcon', badge: null },
  
    // { name: 'Reports', path: '/reports', icon: 'ChartBarIcon', badge: null }
  ],
  employee: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
    { name: 'My Profile', path: '/profile', icon: 'UserIcon', badge: null },
    { name: 'My Attendance', path: '/my-attendance', icon: 'ClockIcon', badge: null },
    { name: 'My Leaves', path: '/my-leaves', icon: 'CalendarIcon', badge: null },
    { name: 'My payroll', path: '/my-payroll', icon: 'CurrencyDollarIcon', badge: null }
  ],
    attendance: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon', badge: null },
    // { name: 'My Profile', path: '/profile', icon: 'UserIcon', badge: null },
    { name: 'Attendance', path: '/attendance', icon: 'ClockIcon', badge: null },
    { name: 'Leave List', path: '/approved-leaves-list', icon: 'CalendarIcon', badge: null },
    // { name: 'My payroll', path: '/my-payroll', icon: 'CurrencyDollarIcon', badge: null }
  ]

}

const menuItems = computed(() => {
  return roleMenus[userRole.value] || roleMenus.employee
})

const getIcon = (iconName) => {
  return icons[iconName] || icons.HomeIcon
}

// Check if route is active - exact match or starts with path
const isActiveRoute = (path) => {
  const currentPath = route.path
  if (path === '/dashboard') {
    return currentPath === '/dashboard'
  }
  return currentPath === path || currentPath.startsWith(path + '/')
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
  localStorage.setItem('sidebarCollapsed', isCollapsed.value)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Load saved state
const savedState = localStorage.getItem('sidebarCollapsed')
if (savedState !== null) {
  isCollapsed.value = savedState === 'true'
  emit('update:collapsed', isCollapsed.value)
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.sidebar.collapsed {
  width: 70px;
}

/* Custom scrollbar */
.sidebar::-webkit-scrollbar {
  width: 5px;
}
.sidebar::-webkit-scrollbar-track {
  background: #2a2a4a;
}
.sidebar::-webkit-scrollbar-thumb {
  background: #5a5a8a;
  border-radius: 5px;
}

/* User Section */
.user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
  flex-shrink: 0;
}

.user-avatar {
  position: relative;
  flex-shrink: 0;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #667eea;
  object-fit: cover;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #4ade80;
  border-radius: 50%;
  border: 2px solid #1a1a2e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.user-info {
  overflow: hidden;
  white-space: nowrap;
}

.user-info h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 2px;
}

.user-info p {
  font-size: 0.65rem;
  opacity: 0.7;
}

.collapsed-user {
  justify-content: center;
  padding: 20px 0;
}

/* Navigation Menu */
.nav-menu {
  flex: 1;
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin: 4px 0;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Only the active route gets the gradient background */
.nav-item.active {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(106, 17, 203, 0.3);
}

.nav-icon {
  width: 20px;
  height: 20px;
  min-width: 20px;
}

.nav-text {
  font-size: 0.85rem;
  font-weight: 500;
}

.nav-badge {
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
  margin-left: auto;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #f87171;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.85rem;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.logout-btn svg {
  width: 18px;
  height: 18px;
}

/* When collapsed - only icons visible */
.sidebar.collapsed .nav-text,
.sidebar.collapsed .user-info,
.sidebar.collapsed .logout-btn span {
  display: none;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    height: calc(100vh - 60px);
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.collapsed {
    transform: translateX(0);
    width: 260px;
  }
  
  .sidebar.collapsed .nav-text {
    display: inline;
  }
}
</style>