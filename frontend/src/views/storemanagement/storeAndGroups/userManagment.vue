<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>👤 User Management</h2>
        <span class="total-badge">{{ totalUsers }} Users</span>
      </div>
      <button class="btn-add" @click="openAddUserModal">➕ Add User</button>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStore" class="filter-select" @change="onFilterChange">
        <option value="">All Stores</option>
        <option v-for="store in stores" :key="store.id" :value="store.id">
          {{ store.name }}
        </option>
      </select>
      <select v-model="filterGroup" class="filter-select" @change="onFilterChange">
        <option value="">All Groups</option>
        <option v-for="group in filteredGroupsByStore" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>
      <select v-model="filterRole" class="filter-select" @change="onFilterChange">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="storekeeper">Storekeeper</option>
        <option value="it">IT</option>
        <option value="auditor">Auditor</option>
        <option value="supplier">Supplier</option>
      </select>
    </div>

    <!-- ==================== USER LIST ==================== -->
    <div class="table-container">
      <table class="user-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Store</th>
            <th>Group</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in paginatedUsers" :key="user.id">
            <td>{{ index + 1 }}</td>
            <td class="username">{{ user.username }}</td>
            <td>{{ user.fullName }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['role-badge', user.role.toLowerCase()]">
                {{ user.role }}
              </span>
            </td>
            <td>
              <span class="store-tag">{{ user.storeName || '-' }}</span>
            </td>
            <td>
              <span class="group-tag">{{ user.groupName || '-' }}</span>
            </td>
            <td>
              <span :class="['status-badge', user.status?.toLowerCase() || 'active']">
                {{ user.status || 'Active' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="openEditUser(user)" class="icon-btn" title="Edit">✏️</button>
                <button @click="toggleUserStatus(user)" class="icon-btn" title="Toggle Status">
                  {{ user.status === 'Active' ? '⏸️' : '▶️' }}
                </button>
                <button @click="resetPassword(user)" class="icon-btn" title="Reset Password">🔑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="filteredUsers.length > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Next →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
      </select>
    </div>

    <!-- ==================== USER MODAL ==================== -->
    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-container user-modal">
        <div class="modal-header">
          <h3>{{ editingUser ? '✏️ Edit User' : '➕ Add New User' }}</h3>
          <button class="modal-close" @click="closeUserModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser" class="user-form">
            <div class="form-row">
              <div class="form-group">
                <label>Username *</label>
                <input v-model="userForm.username" type="text" required placeholder="Enter username" />
              </div>
              <div class="form-group">
                <label>Full Name *</label>
                <input v-model="userForm.fullName" type="text" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email *</label>
                <input v-model="userForm.email" type="email" required placeholder="user@example.com" />
              </div>
              <div class="form-group">
                <label>Role *</label>
                <select v-model="userForm.role" required>
                  <option value="storekeeper">Storekeeper</option>
                  <option value="it">IT</option>
                  <option value="auditor">Auditor</option>
                  <option value="supplier">Supplier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Store *</label>
                <select v-model="userForm.storeId" required @change="onStoreChange">
                  <option value="">Select Store...</option>
                  <option v-for="store in stores" :key="store.id" :value="store.id">
                    {{ store.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Group *</label>
                <select v-model="userForm.groupId" required>
                  <option value="">Select Group...</option>
                  <option v-for="group in availableGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row" v-if="!editingUser">
              <div class="form-group">
                <label>Password *</label>
                <input v-model="userForm.password" type="password" required placeholder="Min 6 characters" />
              </div>
              <div class="form-group">
                <label>Confirm Password *</label>
                <input v-model="userForm.confirmPassword" type="password" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="userForm.status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeUserModal">Cancel</button>
          <button class="btn-primary" @click="saveUser" :disabled="savingUser">
            {{ savingUser ? 'Saving...' : (editingUser ? 'Update' : 'Add') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// ================================================================
// STATE
// ================================================================
const stores = ref([])
const groups = ref([])
const users = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)

// Filters
const filterStore = ref('')
const filterGroup = ref('')
const filterRole = ref('')

// Modal
const showUserModal = ref(false)
const editingUser = ref(null)
const savingUser = ref(false)

const userForm = ref({
  username: '',
  fullName: '',
  email: '',
  role: 'storekeeper',
  storeId: '',
  groupId: '',
  password: '',
  confirmPassword: '',
  status: 'Active'
})

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================
const totalUsers = computed(() => users.value.length)

const filteredGroupsByStore = computed(() => {
  if (!filterStore.value) return groups.value
  return groups.value.filter(g => g.storeId === filterStore.value)
})

const availableGroups = computed(() => {
  if (!userForm.value.storeId) return []
  return groups.value.filter(g => g.storeId === userForm.value.storeId)
})

const filteredUsers = computed(() => {
  let result = users.value
  
  if (filterStore.value) {
    result = result.filter(u => u.storeId === filterStore.value)
  }
  
  if (filterGroup.value) {
    result = result.filter(u => u.groupId === filterGroup.value)
  }
  
  if (filterRole.value) {
    result = result.filter(u => u.role === filterRole.value)
  }
  
  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize.value) || 1
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

// ================================================================
// METHODS
// ================================================================
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    stores.value = getMockStores()
    groups.value = getMockGroups()
    users.value = getMockUsers()
    loading.value = false
  }, 300)
}

const getMockStores = () => {
  return [
    { id: 'store-1', name: 'Fiber Main Store' },
    { id: 'store-2', name: 'Paint Main Store' },
    { id: 'store-3', name: 'Fiber Mini Store' }
  ]
}

const getMockGroups = () => {
  return [
    { id: 'g1', name: 'Storekeeper', storeId: 'store-1' },
    { id: 'g2', name: 'IT', storeId: 'store-1' },
    { id: 'g3', name: 'Auditor', storeId: 'store-1' },
    { id: 'g4', name: 'Supplier', storeId: 'store-1' },
    { id: 'g5', name: 'Storekeeper', storeId: 'store-2' },
    { id: 'g6', name: 'IT', storeId: 'store-2' },
    { id: 'g7', name: 'Auditor', storeId: 'store-2' },
    { id: 'g8', name: 'Storekeeper', storeId: 'store-3' },
    { id: 'g9', name: 'IT', storeId: 'store-3' }
  ]
}

const getMockUsers = () => {
  return [
    { id: 'u1', username: 'birukm', fullName: 'Biruk Mulualem', email: 'biruk@example.com', role: 'storekeeper', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g1', groupName: 'Storekeeper', status: 'Active' },
    { id: 'u2', username: 'dagmawih', fullName: 'Dagmawi Hadgu', email: 'dagmawi@example.com', role: 'storekeeper', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g1', groupName: 'Storekeeper', status: 'Active' },
    { id: 'u3', username: 'melkamu', fullName: 'Melkamu Zewdu', email: 'melkamu@example.com', role: 'it', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g2', groupName: 'IT', status: 'Active' },
    { id: 'u4', username: 'melaku', fullName: 'Melaku Tewodros', email: 'melaku@example.com', role: 'auditor', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g3', groupName: 'Auditor', status: 'Active' },
    { id: 'u5', username: 'tamrat', fullName: 'Tamrat Zerihun', email: 'tamrat@example.com', role: 'supplier', storeId: 'store-1', storeName: 'Fiber Main Store', groupId: 'g4', groupName: 'Supplier', status: 'Active' },
    { id: 'u6', username: 'nuru', fullName: 'Nuru Seid', email: 'nuru@example.com', role: 'storekeeper', storeId: 'store-2', storeName: 'Paint Main Store', groupId: 'g5', groupName: 'Storekeeper', status: 'Active' },
    { id: 'u7', username: 'tadese', fullName: 'Tadese Jemberu', email: 'tadese@example.com', role: 'storekeeper', storeId: 'store-2', storeName: 'Paint Main Store', groupId: 'g5', groupName: 'Storekeeper', status: 'Inactive' },
    { id: 'u8', username: 'eshete', fullName: 'Eshete Worke', email: 'eshete@example.com', role: 'it', storeId: 'store-2', storeName: 'Paint Main Store', groupId: 'g6', groupName: 'IT', status: 'Active' }
  ]
}

const openAddUserModal = () => {
  editingUser.value = null
  userForm.value = {
    username: '',
    fullName: '',
    email: '',
    role: 'storekeeper',
    storeId: '',
    groupId: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  }
  showUserModal.value = true
}

const openEditUser = (user) => {
  editingUser.value = user
  userForm.value = { 
    ...user,
    password: '',
    confirmPassword: ''
  }
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  editingUser.value = null
}

const onStoreChange = () => {
  userForm.value.groupId = ''
}

const saveUser = () => {
  if (!editingUser.value && userForm.value.password !== userForm.value.confirmPassword) {
    showToastMessage('Passwords do not match!', 'error')
    return
  }
  
  savingUser.value = true
  setTimeout(() => {
    const store = stores.value.find(s => s.id === userForm.value.storeId)
    const group = groups.value.find(g => g.id === userForm.value.groupId)
    
    if (editingUser.value) {
      const idx = users.value.findIndex(u => u.id === editingUser.value.id)
      if (idx !== -1) {
        users.value[idx] = { 
          ...userForm.value, 
          id: editingUser.value.id,
          storeName: store?.name || '',
          groupName: group?.name || ''
        }
      }
      showToastMessage('User updated successfully!', 'success')
    } else {
      const newUser = {
        ...userForm.value,
        id: 'u' + Date.now(),
        storeName: store?.name || '',
        groupName: group?.name || ''
      }
      delete newUser.password
      delete newUser.confirmPassword
      users.value.push(newUser)
      showToastMessage('User added successfully!', 'success')
    }
    closeUserModal()
    savingUser.value = false
  }, 500)
}

const toggleUserStatus = (user) => {
  user.status = user.status === 'Active' ? 'Inactive' : 'Active'
  showToastMessage(`User ${user.status}`, 'success')
}

const resetPassword = (user) => {
  if (confirm(`Reset password for ${user.fullName}?`)) {
    showToastMessage(`Password reset for ${user.fullName}`, 'success')
  }
}

const onFilterChange = () => {
  currentPage.value = 1
}

const changePage = (page) => {
  currentPage.value = page
}

const changePageSize = () => {
  currentPage.value = 1
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Reuse styles from previous pages with user-specific additions */

.role-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.role-badge.admin {
  background: #f3e8ff;
  color: #6d28d9;
}

.role-badge.storekeeper {
  background: #dcfce7;
  color: #166534;
}

.role-badge.it {
  background: #eff6ff;
  color: #1d4ed8;
}

.role-badge.auditor {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.supplier {
  background: #fce7f3;
  color: #9d174d;
}

.username {
  font-weight: 600;
  color: #2563eb;
}

/* Additional styles from previous pages apply */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
}

.btn-add {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #2563eb;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.table-container {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 900px;
}

.user-table th,
.user-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.user-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.store-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.group-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.locked {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.user-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.user-form .form-group {
  flex: 1;
  min-width: 120px;
}

.user-form .form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.user-form .form-group input,
.user-form .form-group select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.user-form .form-group input:focus,
.user-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 4px solid #10b981;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.info {
  border-left-color: #3b82f6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-bar select {
    width: 100%;
  }
  
  .user-form .form-row {
    flex-direction: column;
  }
  
  .user-table {
    min-width: 700px;
  }
}
</style>