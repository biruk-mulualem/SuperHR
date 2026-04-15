<template>
  <div class="users-page">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Users Management</h1>
        <p class="page-subtitle">Manage system users, roles, and permissions</p>
      </div>
      <button class="btn-primary" @click="openUserModal()">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add User
      </button>
    </div>

    <!-- Stats Cards Component -->
    <UsersStatsCards :stats="stats" />

    <!-- Filters Bar Component -->
    <UsersFiltersBar 
      :filters="filters"
      :roles="roles"
      :departments="departments"
      @update:filters="updateFilters"
      @clear-filters="clearFilters"
    />

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Users Table Component -->
  <!-- Users Table Component -->
<UsersTable
  v-else
  :users="users"
  :selected-users="selectedUsers"
  :select-all="selectAll"
  :pagination="pagination"
  @toggle-select-all="toggleSelectAll"
  @toggle-user-select="toggleUserSelect"
  @edit-user="openUserModal"
  @reset-password="openResetPasswordModal"
  @toggle-status="toggleStatus"
  @go-to-page="goToPage"
  @bulk-update="bulkUpdateStatus"
  @clear-filters="clearFilters"
/>

    <!-- Modals Component -->
    <UsersModals
      :show-modal="showModal"
      :show-reset-modal="showResetModal"
      :is-editing="isEditing"
      :user-form="userForm"
      :reset-user="resetUser"
      :reset-password-data="resetPasswordData"
      :roles="roles"
      :departments="departments"
      :errors="errors"
      :saving="saving"
      :resetting="resetting"
      :toasts="toasts"
      @close-modal="closeModal"
      @close-reset-modal="closeResetModal"
      @save-user="saveUser"
      @reset-password="resetPassword"
      @remove-toast="removeToast"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import UsersService from '@/stores/users'
import UsersStatsCards from './components/UsersStatsCards.vue'
import UsersFiltersBar from './components/UsersFiltersBar.vue'
import UsersTable from './components/UsersTable.vue'
import UsersModals from './components/UsersModals.vue'

// ============================================================================
// STATE
// ============================================================================

const users = ref([])
const roles = ref([])
const departments = ref([])
const stats = ref({ overview: { total: 0, active: 0 } })
const loading = ref(false)
const saving = ref(false)
const resetting = ref(false)

// Pagination
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false
})

// Filters
const filters = ref({
  search: '',
  role: '',
  department: '',
  status: '',
  sortBy: 'created_at',
  sortOrder: 'DESC'
})

// Selection
const selectedUsers = ref([])
const selectAll = ref(false)

// Modals
const showModal = ref(false)
const showResetModal = ref(false)
const isEditing = ref(false)
const resetUser = ref(null)

// Forms
const userForm = ref({
  userId: null,
  username: '',
  fullName: '',
  email: '',
  roleId: null,
  departmentId: null,
  isActive: true,
  password: ''
})

const resetPasswordData = ref({
  newPassword: '',
  confirmPassword: ''
})

// Errors
const errors = ref({
  fullName: '',
  username: '',
  email: '',
  roleId: '',
  password: '',
  resetPassword: '',
  confirmPassword: ''
})

// Toast
const toasts = ref([])

// Debounce timeout for search
let searchTimeout = null

// ============================================================================
// METHODS
// ============================================================================

// Toast functions
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 3000)
}

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Validation
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const validateForm = () => {
  let isValid = true
  errors.value = { fullName: '', username: '', email: '', roleId: '', password: '' }
  
  if (!userForm.value.fullName?.trim()) {
    errors.value.fullName = 'Full name required'
    isValid = false
  }
  
  if (!userForm.value.username?.trim()) {
    errors.value.username = 'Username required'
    isValid = false
  } else if (userForm.value.username.length < 3) {
    errors.value.username = 'Min 3 characters'
    isValid = false
  }
  
  if (!userForm.value.email) {
    errors.value.email = 'Email required'
    isValid = false
  } else if (!validateEmail(userForm.value.email)) {
    errors.value.email = 'Valid email required'
    isValid = false
  }
  
  if (!userForm.value.roleId) {
    errors.value.roleId = 'Role required'
    isValid = false
  }
  
  if (!isEditing.value && !userForm.value.password) {
    errors.value.password = 'Password required'
    isValid = false
  } else if (!isEditing.value && userForm.value.password.length < 6) {
    errors.value.password = 'Min 6 characters'
    isValid = false
  }
  
  return isValid
}

const validateResetPassword = () => {
  let isValid = true
  errors.value.resetPassword = ''
  errors.value.confirmPassword = ''
  
  if (!resetPasswordData.value.newPassword) {
    errors.value.resetPassword = 'Password required'
    isValid = false
  } else if (resetPasswordData.value.newPassword.length < 6) {
    errors.value.resetPassword = 'Min 6 characters'
    isValid = false
  }
  
  if (!resetPasswordData.value.confirmPassword) {
    errors.value.confirmPassword = 'Confirm password'
    isValid = false
  } else if (resetPasswordData.value.newPassword !== resetPasswordData.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
    isValid = false
  }
  
  return isValid
}

// API Calls
const loadUsers = async () => {
  loading.value = true
  try {
    let roleParam = filters.value.role
    if (roleParam && roleParam !== '') {
      const selectedRole = roles.value.find(r => r.name === roleParam)
      if (selectedRole) {
        roleParam = selectedRole.roleId
      }
    }
    
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
      search: filters.value.search,
      role: filters.value.role,
      status: filters.value.status,
      department: filters.value.department
    }
    
    const result = await UsersService.getUsers(params)
    
    if (result.success) {
      users.value = result.data
      pagination.value = result.pagination
    } else {
      addToast(result.error || 'Failed to load users', 'error')
    }
  } catch (error) {
    console.error('Load users error:', error)
    addToast('Failed to load users', 'error')
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    const result = await UsersService.getRoles()
  
    if (result.success && result.roles) {
      roles.value = result.roles
    } else if (result.success && result.data) {
      roles.value = result.data
    } else {
      console.warn('No roles found, using defaults')
      roles.value = [
        { roleId: 1, name: 'admin', description: 'Administrator', isActive: true },
        { roleId: 2, name: 'hr', description: 'HR Manager', isActive: true },
        { roleId: 3, name: 'finance', description: 'Finance Officer', isActive: true },
        { roleId: 4, name: 'employee', description: 'Employee', isActive: true }
      ]
    }
  } catch (error) {
    console.error('Load roles error:', error)
    roles.value = [
      { roleId: 1, name: 'admin', description: 'Administrator', isActive: true },
      { roleId: 2, name: 'hr', description: 'HR Manager', isActive: true },
      { roleId: 3, name: 'finance', description: 'Finance Officer', isActive: true },
      { roleId: 4, name: 'employee', description: 'Employee', isActive: true }
    ]
  }
}

const loadDepartments = async () => {
  try {
    const result = await UsersService.getDepartments()
    if (result.success) {
      departments.value = result.departments
    } else {
      departments.value = []
    }
  } catch (error) {
    console.error('Load departments error:', error)
    departments.value = []
  }
}

const loadStats = async () => {
  try {
    const result = await UsersService.getUserStats()
    if (result.success) {
      stats.value = result.stats
    } else {
      stats.value = { overview: { total: 0, active: 0, inactive: 0 } }
    }
  } catch (error) {
    console.error('Load stats error:', error)
    stats.value = { overview: { total: 0, active: 0, inactive: 0 } }
  }
}

const saveUser = async () => {
  if (!validateForm()) return
  
  saving.value = true
  try {
    let result
    if (isEditing.value) {
      result = await UsersService.updateUser(userForm.value.userId, {
        fullName: userForm.value.fullName,
        email: userForm.value.email,
        roleId: userForm.value.roleId,
        departmentId: userForm.value.departmentId,
        isActive: userForm.value.isActive
      })
    } else {
      result = await UsersService.createUser({
        username: userForm.value.username,
        email: userForm.value.email,
        fullName: userForm.value.fullName,
        roleId: userForm.value.roleId,
        departmentId: userForm.value.departmentId,
        password: userForm.value.password
      })
    }
    
    if (result.success) {
      addToast(result.message, 'success')
      closeModal()
      loadUsers()
      loadStats()
    } else {
      addToast(result.error || 'Operation failed', 'error')
    }
  } catch (error) {
    console.error('Save user error:', error)
    addToast('Operation failed', 'error')
  } finally {
    saving.value = false
  }
}

const resetPassword = async () => {
  if (!validateResetPassword()) return
  
  resetting.value = true
  try {
    const result = await UsersService.resetUserPassword(
      resetUser.value.userId,
      resetPasswordData.value.newPassword
    )
    
    if (result.success) {
      addToast(result.message, 'success')
      closeResetModal()
    } else {
      addToast(result.error || 'Reset failed', 'error')
    }
  } catch (error) {
    console.error('Reset password error:', error)
    addToast('Reset failed', 'error')
  } finally {
    resetting.value = false
  }
}

const toggleStatus = async (user) => {
  try {
    const result = await UsersService.toggleUserStatus(user.userId)
    if (result.success) {
      user.isActive = result.isActive
      addToast(`${user.fullName} is now ${result.isActive ? 'active' : 'inactive'}`, 'success')
      loadStats()
    } else {
      addToast(result.error || 'Status update failed', 'error')
    }
  } catch (error) {
    console.error('Toggle status error:', error)
    addToast('Status update failed', 'error')
  }
}

const bulkUpdateStatus = async (status) => {
  try {
    const result = await UsersService.bulkUpdateUsers(selectedUsers.value, { isActive: status })
    if (result.success) {
      addToast(result.message, 'success')
      selectedUsers.value = []
      selectAll.value = false
      loadUsers()
      loadStats()
    } else {
      addToast(result.error || 'Bulk update failed', 'error')
    }
  } catch (error) {
    console.error('Bulk update error:', error)
    addToast('Bulk update failed', 'error')
  }
}

// Selection - FIXED
const toggleSelectAll = () => {
  if (selectAll.value) {
    // If currently selected, deselect all
    selectedUsers.value = []
    selectAll.value = false
  } else {
    // Select all users on current page
    selectedUsers.value = users.value.map(u => u.userId)
    selectAll.value = true
  }
}

const toggleUserSelect = (userId) => {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userId)
  }
  selectAll.value = selectedUsers.value.length === users.value.length && users.value.length > 0
}

// Watch for users changes to reset selection when page changes
watch(() => users.value, () => {
  selectedUsers.value = []
  selectAll.value = false
}, { deep: true })

// Watch for search with debounce
watch(() => filters.value.search, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    loadUsers()
  }, 500)
})

// Watch for filter changes
watch([() => filters.value.role, () => filters.value.department, () => filters.value.status, () => filters.value.sortBy], () => {
  pagination.value.page = 1
  loadUsers()
})

// Pagination
const goToPage = (page) => {
  pagination.value.page = page
  loadUsers()
}

// Filter methods
const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters }
}

const clearFilters = () => {
  filters.value = {
    search: '',
    role: '',
    department: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
  pagination.value.page = 1
  loadUsers()
}

// Modal functions
const openUserModal = (user = null) => {
  errors.value = { fullName: '', username: '', email: '', roleId: '', password: '' }
  isEditing.value = !!user
  
  if (user) {
    userForm.value = {
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      departmentId: user.departmentId,
      isActive: user.isActive,
      password: ''
    }
  } else {
    userForm.value = {
      userId: null,
      username: '',
      fullName: '',
      email: '',
      roleId: null,
      departmentId: null,
      isActive: true,
      password: ''
    }
  }
  showModal.value = true
}

const openResetPasswordModal = (user) => {
  errors.value.resetPassword = ''
  errors.value.confirmPassword = ''
  resetUser.value = user
  resetPasswordData.value = { newPassword: '', confirmPassword: '' }
  showResetModal.value = true
}

const closeModal = () => {
  showModal.value = false
  userForm.value = {
    userId: null,
    username: '',
    fullName: '',
    email: '',
    roleId: null,
    departmentId: null,
    isActive: true,
    password: ''
  }
}

const closeResetModal = () => {
  showResetModal.value = false
  resetUser.value = null
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(async () => {
  await Promise.all([
    loadRoles(),
    loadDepartments(),
    loadStats(),
    loadUsers()
  ])
})
</script>

<style scoped>
* { box-sizing: border-box; }

.users-page {
  padding: 16px;
  min-height: 100vh;
  background: #f5f7fb;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #64748b; }

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}
.btn-icon { width: 18px; height: 18px; }

/* Loading State */
.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .users-page { padding: 12px; }
  .page-title { font-size: 20px; }
  .btn-primary { padding: 8px 16px; font-size: 13px; }
}
</style>