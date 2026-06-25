<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🏪 Store Management</h2>
        <span class="total-badge">{{ filteredStores.length }} Stores</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search stores..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openAddStoreModal">➕ Add Store</button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Closed">Closed</option>
      </select>
      <select v-model="filterLocation" class="filter-select" @change="onFilterChange">
        <option value="">All Locations</option>
        <option v-for="location in locations" :key="location" :value="location">
          {{ location }}
        </option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
      <div class="filter-actions">
        <button class="btn-print" @click="printReport">🖨️ Print</button>
        <button class="btn-export" @click="openExportModal">📊 Export</button>
      </div>
    </div>

    <!-- ==================== STORE LIST ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading stores...</p>
    </div>

    <div v-else class="table-container" id="printable-area">
      <table class="store-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Store Code</th>
            <th>Store Name</th>
            <th>Location</th>
            <th>Groups</th>
            <th>Users</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedStores.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🏪</span>
                <p>No stores found</p>
                <button class="btn-secondary" @click="openAddStoreModal">Add First Store</button>
              </div>
            </td>
          </tr>
          <tr v-for="(store, index) in paginatedStores" :key="store.id">
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="code">{{ store.code }}</td>
            <td class="store-name-cell">{{ store.name }}</td>
            <td>{{ store.location || '-' }}</td>
            <td>
              <div class="group-tags-wrapper">
                <span v-for="group in store.groups" :key="group.id" class="group-tag" :title="group.name">
                  {{ group.name }}
                </span>
                <span v-if="!store.groups || store.groups.length === 0" class="no-items">No groups</span>
              </div>
            </td>
            <td class="text-center">{{ store.totalUsers || 0 }}</td>
            <td>
              <span :class="['status-badge', store.status?.toLowerCase() || 'active']">
                {{ store.status || 'Active' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="openEditStore(store)" class="icon-btn" title="Edit Store">✏️</button>
                <button @click="openManageGroups(store)" class="icon-btn" title="Manage Groups">👥</button>
                <button @click="openToggleStatus(store)" class="icon-btn" title="Toggle Status">
                  {{ store.status === 'Active' ? '⏸️' : '▶️' }}
                </button>
                <button @click="openDeleteStoreModal(store)" class="icon-btn delete-btn" title="Delete Store">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="filteredStores.length > 0">
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

    <!-- ==================== STORE MODAL ==================== -->
    <div v-if="showStoreModal" class="modal-overlay" @click.self="closeStoreModal">
      <div class="modal-container store-modal">
        <div class="modal-header">
          <h3>{{ editingStore ? '✏️ Edit Store' : '➕ Add New Store' }}</h3>
          <button class="modal-close" @click="closeStoreModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveStore" class="store-form">
            <div class="form-row">
              <div class="form-group">
                <label>Store Name *</label>
                <input v-model="storeForm.name" type="text" required placeholder="e.g., Fiber Main Store" />
              </div>
              <div class="form-group">
                <label>Location</label>
                <select v-model="storeForm.location">
                  <option value="">Select Location...</option>
                  <option value="Wana Gebi">Wana Gebi</option>
                  <option value="Wana Gebi Kuter 2">Wana Gebi Kuter 2</option>
                  <option value="Wana Gebi Kuter 3">Wana Gebi Kuter 3</option>
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Hawassa">Hawassa</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="storeForm.status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStoreModal">Cancel</button>
          <button class="btn-primary" @click="saveStore" :disabled="savingStore">
            {{ savingStore ? 'Saving...' : (editingStore ? 'Update' : 'Add') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== GROUP MANAGEMENT MODAL ==================== -->
    <div v-if="showGroupModal" class="modal-overlay" @click.self="closeGroupModal">
      <div class="modal-container group-modal">
        <div class="modal-header">
          <h3>👥 Manage Groups - {{ selectedStore?.name }}</h3>
          <button class="modal-close" @click="closeGroupModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Add Group Form -->
          <div class="add-group-section">
            <h4>Add Existing Group to Store</h4>
            <div class="add-group-form">
              <select v-model="selectedGroupToAdd" class="group-select">
                <option value="">Select a group to add...</option>
                <option v-for="group in availableGroupsToAdd" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
              <button @click="addGroupToStore" class="btn-add-group" :disabled="!selectedGroupToAdd || addingGroup">
                {{ addingGroup ? 'Adding...' : '➕ Add Group' }}
              </button>
            </div>
            <div v-if="availableGroupsToAdd.length === 0" class="no-available-groups">
              All groups are already added to this store
            </div>
          </div>

          <!-- Existing Groups in Store -->
          <div class="existing-groups">
            <h4>Groups in this Store</h4>
            <div class="groups-list">
              <div v-if="selectedStore?.groups?.length === 0" class="no-groups">
                No groups added to this store yet
              </div>
              <div v-for="group in selectedStore?.groups" :key="group.id" class="group-item" @click="selectGroup(group)">
                <div class="group-info">
                  <span class="group-name">{{ group.name }}</span>
                  <span class="group-user-count">{{ group.users?.length || 0 }} members</span>
                </div>
                <div class="group-actions">
                  <button @click.stop="openRemoveGroupModal(group)" class="icon-btn-small delete-btn" title="Remove from store">✕</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Users in Selected Group -->
          <div v-if="selectedGroup" class="users-section">
            <h4>👤 Members in {{ selectedGroup.name }}</h4>
            <div class="add-user-form">
              <select v-model="newUserId" class="user-select">
                <option value="">Select member to add...</option>
                <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                  {{ user.fullName }} ({{ user.username }})
                </option>
              </select>
              <button @click="addUserToGroup" class="btn-add-user" :disabled="!newUserId || addingUser">
                {{ addingUser ? 'Adding...' : '➕ Add Member' }}
              </button>
            </div>
            <div class="users-list">
              <div v-if="selectedGroup.users?.length === 0" class="no-users">
                No members in this group
              </div>
              <div v-for="user in selectedGroup.users" :key="user.id" class="user-item">
                <span class="user-name">{{ user.fullName }}</span>
                <span class="user-username">{{ user.username }}</span>
                <button @click="openRemoveUserModal(user)" class="remove-user-btn" title="Remove from group">✕</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeGroupModal">Done</button>
        </div>
      </div>
    </div>

    <!-- ==================== REMOVE GROUP CONFIRMATION MODAL ==================== -->
    <div v-if="showRemoveGroupModal" class="modal-overlay" @click.self="closeRemoveGroupModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>✕ Remove Group from Store</h3>
          <button class="modal-close" @click="closeRemoveGroupModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">👥</div>
          <p><strong>Remove Group:</strong> {{ removeGroupItem?.name }}</p>
          <p><strong>From Store:</strong> {{ selectedStore?.name }}</p>
          <p class="delete-warning">This will remove the group from this store. Members will remain in the group.</p>
          <p class="delete-question">Are you sure you want to remove this group?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRemoveGroupModal">Cancel</button>
          <button class="btn-danger" @click="confirmRemoveGroup">Remove Group</button>
        </div>
      </div>
    </div>

    <!-- ==================== TOGGLE STATUS CONFIRMATION MODAL ==================== -->
    <div v-if="showToggleModal" class="modal-overlay" @click.self="closeToggleModal">
      <div class="modal-container toggle-modal">
        <div class="modal-header">
          <h3>⏸️ Confirm Status Change</h3>
          <button class="modal-close" @click="closeToggleModal">✕</button>
        </div>
        <div class="modal-body">
          <p><strong>Store:</strong> {{ toggleStore?.name }}</p>
          <p><strong>Current Status:</strong> 
            <span :class="['status-badge', toggleStore?.status?.toLowerCase()]">
              {{ toggleStore?.status }}
            </span>
          </p>
          <p><strong>New Status:</strong> 
            <span :class="['status-badge', toggleNewStatus?.toLowerCase()]">
              {{ toggleNewStatus }}
            </span>
          </p>
          <p class="warning-text">⚠️ Are you sure you want to change the status?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeToggleModal">Cancel</button>
          <button class="btn-primary" @click="confirmToggleStatus">Confirm</button>
        </div>
      </div>
    </div>

    <!-- ==================== DELETE STORE CONFIRMATION MODAL ==================== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>🗑️ Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">🗑️</div>
          <p><strong>Delete Store:</strong> {{ deleteStoreItem?.name }}</p>
          <p><strong>Code:</strong> {{ deleteStoreItem?.code }}</p>
          <p class="delete-warning">This will set the store status to "Closed".</p>
          <p class="delete-question">Are you sure you want to close this store?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" @click="confirmDeleteStore">Close Store</button>
        </div>
      </div>
    </div>

    <!-- ==================== REMOVE USER CONFIRMATION MODAL ==================== -->
    <div v-if="showRemoveUserModal" class="modal-overlay" @click.self="closeRemoveUserModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>👤 Confirm Remove Member</h3>
          <button class="modal-close" @click="closeRemoveUserModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">👤</div>
          <p><strong>Remove Member:</strong> {{ removeUserItem?.fullName }}</p>
          <p><strong>From Group:</strong> {{ selectedGroup?.name }}</p>
          <p class="delete-question">Are you sure you want to remove this member from the group?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRemoveUserModal">Cancel</button>
          <button class="btn-danger" @click="confirmRemoveUser">Remove</button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Store Data</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Store Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary (Code, Name, Location, Status)
            </div>
            <div class="export-option" @click="exportType = 'groups'">
              <input type="radio" v-model="exportType" value="groups" /> Groups & Users Report
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
          <button class="btn-primary" @click="exportSelectedReport" :disabled="exporting">
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import storeService from '@/stores/storeService'

// ================================================================
// STATE
// ================================================================
const stores = ref([])
const allGroups = ref([])
const allUsers = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)
const searchQuery = ref('')
const filterStatus = ref('')
const filterLocation = ref('')

// Store Modal
const showStoreModal = ref(false)
const editingStore = ref(null)
const savingStore = ref(false)
const storeForm = ref({
  name: '',
  location: '',
  status: 'Active'
})

// Group Modal
const showGroupModal = ref(false)
const selectedStore = ref(null)
const selectedGroup = ref(null)
const selectedGroupToAdd = ref('')
const newUserId = ref('')
const addingGroup = ref(false)
const addingUser = ref(false)

// Remove Group Modal
const showRemoveGroupModal = ref(false)
const removeGroupItem = ref(null)

// Toggle Modals
const showToggleModal = ref(false)
const toggleStore = ref(null)
const toggleNewStatus = ref('')

// Delete Store Modal
const showDeleteModal = ref(false)
const deleteStoreItem = ref(null)

// Remove User Modal
const showRemoveUserModal = ref(false)
const removeUserItem = ref(null)

// Export Modal
const showExportModal = ref(false)
const exporting = ref(false)
const exportType = ref('full')

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() => {
  return filterStatus.value || filterLocation.value
})

const locations = computed(() => {
  const locs = new Set()
  stores.value.forEach(store => {
    if (store.location) {
      locs.add(store.location)
    }
  })
  return Array.from(locs).sort()
})

const filteredStores = computed(() => {
  let result = stores.value
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    result = result.filter(store => 
      store.name.toLowerCase().includes(s) ||
      store.code.toLowerCase().includes(s) ||
      store.location?.toLowerCase().includes(s)
    )
  }
  
  if (filterStatus.value) {
    result = result.filter(store => store.status === filterStatus.value)
  }
  
  if (filterLocation.value) {
    result = result.filter(store => store.location === filterLocation.value)
  }
  
  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredStores.value.length / pageSize.value) || 1
})

const paginatedStores = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStores.value.slice(start, start + pageSize.value)
})

const availableGroupsToAdd = computed(() => {
  if (!selectedStore.value) return []
  const existingGroupIds = selectedStore.value.groups?.map(g => g.id) || []
  return allGroups.value.filter(g => !existingGroupIds.includes(g.id))
})

const availableUsers = computed(() => {
  if (!selectedGroup.value) return allUsers.value
  const existingUserIds = selectedGroup.value.users?.map(u => u.id) || []
  return allUsers.value.filter(u => !existingUserIds.includes(u.id))
})

// ================================================================
// METHODS
// ================================================================

// -- Load Data --
const loadStores = async () => {
  loading.value = true
  try {
    const response = await storeService.getStores({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value || undefined,
      location: filterLocation.value || undefined
    })
    
    if (response.success) {
      stores.value = response.data.stores
    } else {
      showToastMessage(response.error || 'Failed to load stores', 'error')
    }
  } catch (error) {
    console.error('Load stores error:', error)
    showToastMessage('Failed to load stores', 'error')
  } finally {
    loading.value = false
  }
}

const loadGroups = async () => {
  try {
    const response = await storeService.getAvailableGroupsForStore(0)
    // This will be handled differently - we need a separate endpoint for all groups
    // For now, we'll use the mock data or a dedicated endpoint
    allGroups.value = await fetchAllGroups()
  } catch (error) {
    console.error('Load groups error:', error)
  }
}

const fetchAllGroups = async () => {
  // Temporary: Use mock data until we have a proper groups endpoint
  return [
    { id: 1, name: 'Storekeeper', code: 'GRP-001' },
    { id: 2, name: 'IT', code: 'GRP-002' },
    { id: 3, name: 'Auditor', code: 'GRP-003' },
    { id: 4, name: 'Supplier', code: 'GRP-004' },
    { id: 5, name: 'Quality Control', code: 'GRP-005' },
    { id: 6, name: 'Warehouse', code: 'GRP-006' },
    { id: 7, name: 'Logistics', code: 'GRP-007' }
  ]
}

const loadUsers = async () => {
  try {
    const response = await storeService.getAllUsers()
    if (response.success) {
      allUsers.value = response.data
    }
  } catch (error) {
    console.error('Load users error:', error)
  }
}

// -- Store CRUD --
const openAddStoreModal = () => {
  editingStore.value = null
  storeForm.value = {
    name: '',
    location: '',
    status: 'Active'
  }
  showStoreModal.value = true
}

const openEditStore = (store) => {
  editingStore.value = store
  storeForm.value = { 
    name: store.name,
    location: store.location || '',
    status: store.status || 'Active'
  }
  showStoreModal.value = true
}

const closeStoreModal = () => {
  showStoreModal.value = false
  editingStore.value = null
}

const saveStore = async () => {
  savingStore.value = true
  try {
    let response
    if (editingStore.value) {
      response = await storeService.updateStore(editingStore.value.id, storeForm.value)
      if (response.success) {
        showToastMessage('Store updated successfully!', 'success')
        await loadStores()
      }
    } else {
      response = await storeService.createStore(storeForm.value)
      if (response.success) {
        showToastMessage(`Store "${response.data.name}" added with code ${response.data.code}!`, 'success')
        await loadStores()
      }
    }
    closeStoreModal()
  } catch (error) {
    showToastMessage(error.message || 'Failed to save store', 'error')
  } finally {
    savingStore.value = false
  }
}

const openDeleteStoreModal = (store) => {
  deleteStoreItem.value = store
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteStoreItem.value = null
}

const confirmDeleteStore = async () => {
  if (deleteStoreItem.value) {
    try {
      const response = await storeService.deleteStore(deleteStoreItem.value.id)
      if (response.success) {
        showToastMessage(`Store "${deleteStoreItem.value.name}" closed successfully`, 'success')
        await loadStores()
      }
    } catch (error) {
      showToastMessage(error.message || 'Failed to close store', 'error')
    }
    closeDeleteModal()
  }
}

// -- Group Management --
const openManageGroups = (store) => {
  selectedStore.value = JSON.parse(JSON.stringify(store))
  selectedGroup.value = null
  selectedGroupToAdd.value = ''
  newUserId.value = ''
  showGroupModal.value = true
}

const closeGroupModal = () => {
  showGroupModal.value = false
  selectedStore.value = null
  selectedGroup.value = null
  loadStores()
}

const selectGroup = (group) => {
  selectedGroup.value = group
  newUserId.value = ''
}

const addGroupToStore = async () => {
  if (!selectedGroupToAdd.value) {
    showToastMessage('Please select a group', 'error')
    return
  }
  
  addingGroup.value = true
  try {
    const response = await storeService.addGroupToStore(
      selectedStore.value.id,
      selectedGroupToAdd.value
    )
    
    if (response.success) {
      const groupToAdd = allGroups.value.find(g => g.id === selectedGroupToAdd.value)
      showToastMessage(`Group "${groupToAdd?.name}" added to store!`, 'success')
      selectedStore.value = response.data
      selectedGroupToAdd.value = ''
      await loadStores()
    }
  } catch (error) {
    showToastMessage(error.message || 'Failed to add group', 'error')
  } finally {
    addingGroup.value = false
  }
}

const openRemoveGroupModal = (group) => {
  removeGroupItem.value = group
  showRemoveGroupModal.value = true
}

const closeRemoveGroupModal = () => {
  showRemoveGroupModal.value = false
  removeGroupItem.value = null
}

const confirmRemoveGroup = async () => {
  if (removeGroupItem.value) {
    try {
      const response = await storeService.removeGroupFromStore(
        selectedStore.value.id,
        removeGroupItem.value.id
      )
      
      if (response.success) {
        showToastMessage(`Group "${removeGroupItem.value.name}" removed from store`, 'success')
        selectedStore.value = response.data
        if (selectedGroup.value?.id === removeGroupItem.value.id) {
          selectedGroup.value = null
        }
        await loadStores()
      }
    } catch (error) {
      showToastMessage(error.message || 'Failed to remove group', 'error')
    }
    closeRemoveGroupModal()
  }
}

// -- User Management --
const addUserToGroup = async () => {
  if (!newUserId.value) {
    showToastMessage('Please select a user', 'error')
    return
  }
  
  addingUser.value = true
  try {
    const response = await storeService.addUserToGroup(
      selectedGroup.value.id,
      newUserId.value
    )
    
    if (response.success) {
      const user = allUsers.value.find(u => u.id === newUserId.value)
      showToastMessage(`User "${user?.fullName}" added to group!`, 'success')
      selectedGroup.value = response.data
      newUserId.value = ''
      
      // Update the store's group data
      const store = stores.value.find(s => s.id === selectedStore.value.id)
      if (store) {
        const groupIndex = store.groups.findIndex(g => g.id === selectedGroup.value.id)
        if (groupIndex !== -1) {
          store.groups[groupIndex] = selectedGroup.value
        }
      }
    }
  } catch (error) {
    showToastMessage(error.message || 'Failed to add user', 'error')
  } finally {
    addingUser.value = false
  }
}

const openRemoveUserModal = (user) => {
  removeUserItem.value = user
  showRemoveUserModal.value = true
}

const closeRemoveUserModal = () => {
  showRemoveUserModal.value = false
  removeUserItem.value = null
}

const confirmRemoveUser = async () => {
  if (removeUserItem.value && selectedGroup.value) {
    try {
      const response = await storeService.removeUserFromGroup(
        selectedGroup.value.id,
        removeUserItem.value.id
      )
      
      if (response.success) {
        showToastMessage(`User "${removeUserItem.value.fullName}" removed from group`, 'success')
        selectedGroup.value = response.data
        
        // Update the store's group data
        const store = stores.value.find(s => s.id === selectedStore.value.id)
        if (store) {
          const groupIndex = store.groups.findIndex(g => g.id === selectedGroup.value.id)
          if (groupIndex !== -1) {
            store.groups[groupIndex] = selectedGroup.value
          }
        }
      }
    } catch (error) {
      showToastMessage(error.message || 'Failed to remove user', 'error')
    }
    closeRemoveUserModal()
  }
}

// -- Store Toggle Status --
const openToggleStatus = (store) => {
  toggleStore.value = store
  toggleNewStatus.value = store.status === 'Active' ? 'Inactive' : 'Active'
  showToggleModal.value = true
}

const closeToggleModal = () => {
  showToggleModal.value = false
  toggleStore.value = null
  toggleNewStatus.value = ''
}

const confirmToggleStatus = async () => {
  if (toggleStore.value) {
    try {
      const response = await storeService.updateStoreStatus(
        toggleStore.value.id,
        toggleNewStatus.value
      )
      if (response.success) {
        showToastMessage(`Store status changed to ${toggleNewStatus.value}`, 'success')
        await loadStores()
      }
    } catch (error) {
      showToastMessage(error.message || 'Failed to update status', 'error')
    }
    closeToggleModal()
  }
}

// -- Filters --
const onSearchChange = () => {
  currentPage.value = 1
  loadStores()
}

const onFilterChange = () => {
  currentPage.value = 1
  loadStores()
}

const clearFilters = () => {
  filterStatus.value = ''
  filterLocation.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
  loadStores()
}

// -- Export --
const openExportModal = () => {
  exportType.value = 'full'
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const exportSelectedReport = async () => {
  exporting.value = true
  try {
    const response = await storeService.exportStores({
      status: filterStatus.value || undefined,
      location: filterLocation.value || undefined
    })
    
    if (response.success && response.data.length > 0) {
      const headers = Object.keys(response.data[0])
      const rows = response.data.map(item => headers.map(key => item[key]))
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `store_report_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      
      showToastMessage('Export completed successfully!', 'success')
    } else {
      showToastMessage(response.error || 'No data to export', 'error')
    }
  } catch (error) {
    showToastMessage(error.message || 'Failed to export', 'error')
  } finally {
    exporting.value = false
    closeExportModal()
  }
}

// -- Print --
const printReport = () => {
  const printContents = document.getElementById('printable-area').innerHTML
  const originalContents = document.body.innerHTML
  
  document.body.innerHTML = `
    <html>
      <head>
        <title>Store Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h2 { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <h2>🏪 Store Management Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Stores: ${filteredStores.value.length}</p>
        ${printContents}
        <div class="print-footer">Printed from Store Management System</div>
      </body>
    </html>
  `
  
  window.print()
  document.body.innerHTML = originalContents
  window.location.reload()
}

// -- Pagination --
const changePage = (page) => {
  currentPage.value = page
  loadStores()
}

const changePageSize = () => {
  currentPage.value = 1
  loadStores()
}

// -- Toast --
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
onMounted(async () => {
  await Promise.all([
    loadStores(),
    loadGroups(),
    loadUsers()
  ])
})
</script>

<style scoped>
/* ================================================================
   SECTION CARD
   ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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
  white-space: nowrap;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 200px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
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
  white-space: nowrap;
}

.btn-add:hover {
  background: #2563eb;
}

/* ================================================================
   FILTER BAR
   ================================================================ */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
}

.btn-clear-filters:hover {
  background: #e2e8f0;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-print {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-print:hover {
  background: #7c3aed;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #059669;
}

/* ================================================================
   LOADING STATE
   ================================================================ */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.store-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 850px;
}

.store-table th,
.store-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.store-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.text-center {
  text-align: center;
}

.code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

.store-name-cell {
  font-weight: 500;
}

/* ================================================================
   GROUP TAGS
   ================================================================ */
.group-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 2px 0;
  max-height: 80px;
  overflow-y: auto;
}

.group-tags-wrapper::-webkit-scrollbar {
  width: 3px;
}

.group-tags-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.group-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.no-items {
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  white-space: nowrap;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.closed {
  background: #fee2e2;
  color: #991b1b;
}

/* ================================================================
   ACTION BUTTONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.icon-btn-small {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.icon-btn-small:hover {
  background: #f1f5f9;
}

.delete-btn {
  color: #94a3b8;
}

.delete-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

/* ================================================================
   BUTTONS
   ================================================================ */
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
  white-space: nowrap;
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
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-danger {
  background: #ef4444;
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
  white-space: nowrap;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
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
  white-space: nowrap;
}

.limit-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
}

/* ================================================================
   MODALS
   ================================================================ */
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
  max-width: 650px;
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
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
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
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* ================================================================
   STORE FORM
   ================================================================ */
.store-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.store-form .form-group {
  flex: 1;
  min-width: 180px;
}

.store-form .form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.store-form .form-group input,
.store-form .form-group select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.store-form .form-group input:focus,
.store-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ================================================================
   GROUP MODAL
   ================================================================ */
.group-modal .modal-container {
  max-width: 650px;
}

.add-group-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.add-group-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #1e293b;
}

.add-group-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.group-select {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.btn-add-group {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.btn-add-group:hover:not(:disabled) {
  background: #059669;
}

.btn-add-group:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-available-groups {
  color: #94a3b8;
  font-size: 13px;
  padding: 8px 0;
  font-style: italic;
}

.existing-groups {
  margin-bottom: 16px;
}

.existing-groups h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #1e293b;
}

.groups-list {
  max-height: 200px;
  overflow-y: auto;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 4px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.group-item:hover {
  background: #f1f5f9;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.group-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
}

.group-user-count {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.group-actions {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.no-groups {
  color: #94a3b8;
  font-size: 13px;
  padding: 12px;
  text-align: center;
}

.users-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.users-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #1e293b;
}

.add-user-form {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.user-select {
  flex: 1;
  min-width: 150px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.btn-add-user {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.btn-add-user:hover:not(:disabled) {
  background: #2563eb;
}

.btn-add-user:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.users-list {
  max-height: 150px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 2px;
  border: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 8px;
}

.user-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
}

.user-username {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.remove-user-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  padding: 0 4px;
  flex-shrink: 0;
}

.remove-user-btn:hover {
  color: #ef4444;
}

.no-users {
  color: #94a3b8;
  font-size: 12px;
  padding: 8px;
  text-align: center;
}

/* ================================================================
   TOGGLE & DELETE MODALS
   ================================================================ */
.toggle-modal .modal-container,
.delete-modal .modal-container {
  max-width: 400px;
}

.warning-text {
  color: #f59e0b;
  font-weight: 500;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fef3c7;
}

.delete-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.delete-warning {
  color: #f59e0b;
  font-weight: 500;
  margin: 8px 0;
}

.delete-question {
  color: #64748b;
  margin-top: 8px;
}

/* ================================================================
   EXPORT MODAL
   ================================================================ */
.export-modal .modal-container {
  max-width: 400px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

/* ================================================================
   TOAST
   ================================================================ */
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
  white-space: nowrap;
  max-width: 90vw;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-add,
  .btn-print,
  .btn-export,
  .search-box,
  .filter-bar,
  .pagination,
  .action-buttons,
  .icon-btn {
    display: none !important;
  }
  
  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }
  
  .store-table th,
  .store-table td {
    border: 1px solid #ddd !important;
  }
  
  .status-badge {
    border: 1px solid #ddd !important;
  }
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .card-header {
    flex-wrap: wrap;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .filter-bar select {
    width: 100%;
  }
  
  .filter-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
  
  .store-form .form-row {
    flex-direction: column;
  }
  
  .add-group-form {
    flex-direction: column;
  }
  
  .add-user-form {
    flex-direction: column;
  }
  
  .group-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .store-table {
    min-width: 700px;
  }
  
  .modal-container {
    margin: 10px;
    max-width: 100%;
  }
}
</style>