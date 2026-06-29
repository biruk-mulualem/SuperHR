<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>👥 Group Management</h2>
        <span class="total-badge">{{ totalItems }} Groups</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search groups..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openAddGroupModal">➕ Add Group</button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStore" class="filter-select" @change="onFilterChange">
        <option value="">All Stores</option>
        <option v-for="store in activeStores" :key="store.id" :value="store.id">
          {{ store.name }}
        </option>
      </select>
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <select v-model="filterStoreAssignment" class="filter-select" @change="onFilterChange">
        <option value="">All Groups</option>
        <option value="assigned">Assigned to Store</option>
        <option value="unassigned">Unassigned (No Store)</option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="filterStore || filterStatus || filterStoreAssignment">
        ✕ Clear Filters
      </button>
      <div class="filter-actions">
        <button class="btn-print" @click="printReport">🖨️ Print</button>
        <button class="btn-export" @click="openExportModal">📊 Export</button>
      </div>
    </div>

    <!-- ==================== GROUP LIST ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading groups...</p>
    </div>

    <div v-else class="table-container" id="printable-area">
      <table class="group-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Group Code</th>
            <th>Group Name</th>
            <th>Store</th>
            <th>Store Status</th>
            <th>Members</th>
            <th>Group Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedGroups.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">👥</span>
                <p>No groups found</p>
                <button class="btn-secondary" @click="openAddGroupModal">Add First Group</button>
              </div>
            </td>
          </tr>
          <tr v-for="(group, index) in paginatedGroups" :key="group.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="code">{{ group.code }}</td>
            <td>
              <strong>{{ group.name }}</strong>
            </td>
            <td>
              <span v-if="group.storeId" class="store-tag">{{ group.storeName || '-' }}</span>
              <span v-else class="store-tag unassigned">No Store</span>
            </td>
            <td>
              <span v-if="group.storeId" :class="['status-badge', group.storeStatus?.toLowerCase() || 'inactive']">
                {{ group.storeStatus || 'Inactive' }}
              </span>
              <span v-else class="status-badge inactive">N/A</span>
            </td>
            <td>
              <div class="member-list">
                <span v-for="user in getDisplayMembers(group)" :key="user.id" class="member-tag">
                  {{ user.fullName }}
                </span>
                <span v-if="hasMoreMembers(group)" class="member-more" @click="openManageMembers(group)">
                  +{{ getRemainingMemberCount(group) }} more
                </span>
                <span v-if="!group.users || group.users.length === 0" class="no-items">No members</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', getEffectiveStatus(group)]">
                {{ getEffectiveStatus(group) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="openEditGroup(group)" class="icon-btn" title="Edit Group">✏️</button>
                <button 
                  v-if="canManageMembers(group)" 
                  @click="openManageMembers(group)" 
                  class="icon-btn" 
                  title="Manage Members"
                >
                  👤
                </button>
                <button 
                  @click="openToggleStatus(group)" 
                  class="icon-btn" 
                  :title="group.status === 'Active' ? 'Deactivate Group' : 'Activate Group'"
                >
                  {{ group.status === 'Active' ? '⏸️' : '▶️' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalItems > 0">
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

    <!-- ==================== GROUP MODAL ==================== -->
    <div v-if="showGroupModal" class="modal-overlay" @click.self="closeGroupModal">
      <div class="modal-container group-modal">
        <div class="modal-header">
          <h3>{{ editingGroup ? '✏️ Edit Group' : '➕ Add New Group' }}</h3>
          <button class="modal-close" @click="closeGroupModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveGroup" class="group-form">
            <div class="form-row">
              <div class="form-group">
                <label>Group Name *</label>
                <input v-model="groupForm.name" type="text" required placeholder="e.g., Storekeeper" />
              </div>
              <div class="form-group">
                <label>Store (Optional)</label>
                <select v-model="groupForm.storeId" class="store-select">
                  <option value="">No Store Assigned</option>
                  <option v-for="store in activeStores" :key="store.id" :value="store.id">
                    {{ store.name }}
                  </option>
                </select>
                <span class="hint">Groups without a store can still be created and managed</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="groupForm.status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeGroupModal">Cancel</button>
          <button class="btn-primary" @click="saveGroup" :disabled="savingGroup">
            {{ savingGroup ? 'Saving...' : (editingGroup ? 'Update' : 'Add') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== MEMBERS MANAGEMENT MODAL ==================== -->
    <div v-if="showMembersModal" class="modal-overlay" @click.self="closeMembersModal">
      <div class="modal-container members-modal">
        <div class="modal-header">
          <h3>👤 Manage Members - {{ selectedGroup?.name }}</h3>
          <button class="modal-close" @click="closeMembersModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="add-member-section">
            <h4>Add Member to Group</h4>
            <div class="add-member-form">
              <select v-model="selectedMemberId" class="member-select">
                <option value="">Select a member...</option>
                <option v-for="user in availableUsers" :key="user.id" :value="user.id">
        {{ user.fullName }} ({{ user.username }}) 
        <span v-if="user.role" class="role-indicator">- {{ user.role }}</span>
      </option>
              </select>
              <button @click="addMemberToGroup" class="btn-add-member" :disabled="!selectedMemberId || addingMember">
                {{ addingMember ? 'Adding...' : '➕ Add Member' }}
              </button>
            </div>
            <div v-if="availableUsers.length === 0" class="no-available-members">
              All available members are already in this group
            </div>
          </div>

          <div class="existing-members">
            <h4>Members in this Group ({{ selectedGroup?.users?.length || 0 }})</h4>
            <div class="members-list">
              <div v-if="selectedGroup?.users?.length === 0" class="no-members">
                No members in this group
              </div>
              <div v-for="user in selectedGroup?.users" :key="user.id" class="member-item">
                <span class="member-name">{{ user.fullName }}</span>
                <span class="member-username">{{ user.username }}</span>

                 <span :class="['role-badge', getRoleClass(user.role)]">
        {{ user.role || 'User' }}
      </span>
                <button @click="openRemoveMemberModal(user)" class="remove-member-btn" title="Remove from group">✕</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeMembersModal">Done</button>
        </div>
      </div>
    </div>

    <!-- ==================== TOGGLE STATUS CONFIRMATION MODAL ==================== -->
    <div v-if="showToggleModal" class="modal-overlay" @click.self="closeToggleModal">
      <div class="modal-container toggle-modal">
        <div class="modal-header">
          <h3>{{ toggleGroup?.status === 'Active' ? '⏸️ Confirm Deactivate' : '▶️ Confirm Activate' }}</h3>
          <button class="modal-close" @click="closeToggleModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">🔄</div>
          <p class="confirmation-title">Are you sure you want to change the status?</p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Group:</span>
              <span class="detail-value">{{ toggleGroup?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Store:</span>
              <span class="detail-value">{{ toggleGroup?.storeName || 'No Store Assigned' }}</span>
            </div>
            <div class="detail-row" v-if="toggleGroup?.storeId">
              <span class="detail-label">Store Status:</span>
              <span :class="['status-badge', toggleGroup?.storeStatus?.toLowerCase() || 'inactive']">
                {{ toggleGroup?.storeStatus || 'Inactive' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current Group Status:</span>
              <span :class="['status-badge', toggleGroup?.status?.toLowerCase()]">
                {{ toggleGroup?.status || 'Active' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">New Group Status:</span>
              <span :class="['status-badge', toggleNewStatus?.toLowerCase()]">
                {{ toggleNewStatus }}
              </span>
            </div>
          </div>
          <p class="warning-text">⚠️ This action will {{ toggleGroup?.status === 'Active' ? 'deactivate' : 'activate' }} this group.</p>
          <p v-if="toggleGroup?.status === 'Active'" class="warning-subtext">
            Deactivated groups will not allow adding new members.
          </p>
          <p v-else class="warning-subtext">
            Activated groups will allow adding new members.
          </p>
          <div v-if="toggleNewStatus === 'Active' && toggleGroup?.storeId && toggleGroup?.storeStatus !== 'Active'" class="error-box">
            <span class="error-icon">❌</span>
            <span class="error-text">Cannot activate group because the store is {{ toggleGroup?.storeStatus?.toLowerCase() }}</span>
          </div>
          <div v-if="toggleError" class="error-box">
            <span class="error-icon">❌</span>
            <span class="error-text">{{ toggleError }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeToggleModal">Cancel</button>
          <button 
            class="btn-primary" 
            @click="confirmToggleStatus" 
            :disabled="(toggleNewStatus === 'Active' && toggleGroup?.storeId && toggleGroup?.storeStatus !== 'Active') || toggling"
          >
            {{ toggling ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== REMOVE MEMBER CONFIRMATION MODAL ==================== -->
    <div v-if="showRemoveMemberModal" class="modal-overlay" @click.self="closeRemoveMemberModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>👤 Confirm Remove Member</h3>
          <button class="modal-close" @click="closeRemoveMemberModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">👤</div>
          <p><strong>Remove Member:</strong> {{ removeMember?.fullName }}</p>
          <p><strong>From Group:</strong> {{ selectedGroup?.name }}</p>
          <p class="delete-question">Are you sure you want to remove this member from the group?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRemoveMemberModal">Cancel</button>
          <button class="btn-danger" @click="confirmRemoveMember">Remove</button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Group Data</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Group Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary (Code, Name, Store, Status, Members)
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
import groupService from '@/stores/groupService'
import storeService from '@/stores/storeService'

// ================================================================
// STATE
// ================================================================
const stores = ref([])
const groups = ref([])
const allUsers = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)
const searchQuery = ref('')
const filterStore = ref('')
const filterStatus = ref('')
const filterStoreAssignment = ref('')
const totalItems = ref(0)

// Group Modal
const showGroupModal = ref(false)
const editingGroup = ref(null)
const savingGroup = ref(false)
const groupForm = ref({
  name: '',
  storeId: '',
  status: 'Active'
})


const getRoleClass = (role) => {
  if (!role) return 'role-user'
  
  const roleMap = {
    'admin': 'role-admin',
    'Admin': 'role-admin',
    'manager': 'role-manager',
    'Manager': 'role-manager',
    'superadmin': 'role-superadmin',
    'Superadmin': 'role-superadmin',
    'user': 'role-user',
    'User': 'role-user',
  }
  return roleMap[role] || 'role-user'
}

// Members Modal
const showMembersModal = ref(false)
const selectedGroup = ref(null)
const selectedMemberId = ref('')
const addingMember = ref(false)

// Toggle Modal
const showToggleModal = ref(false)
const toggleGroup = ref(null)
const toggleNewStatus = ref('')
const toggling = ref(false)
const toggleError = ref('')

// Remove Member Modal
const showRemoveMemberModal = ref(false)
const removeMember = ref(null)

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

// Only show active stores in dropdowns
const activeStores = computed(() => {
  return stores.value.filter(store => store.status === 'Active')
})

const filteredGroups = computed(() => {
  let result = groups.value
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    result = result.filter(g => 
      g.code.toLowerCase().includes(s) ||
      g.name.toLowerCase().includes(s)
    )
  }
  
  if (filterStore.value) {
    result = result.filter(g => g.storeId === parseInt(filterStore.value))
  }
  
  if (filterStatus.value) {
    result = result.filter(g => g.status === filterStatus.value)
  }
  
  if (filterStoreAssignment.value === 'assigned') {
    result = result.filter(g => g.storeId && g.storeId !== null)
  } else if (filterStoreAssignment.value === 'unassigned') {
    result = result.filter(g => !g.storeId || g.storeId === null)
  }
  
  return result
})

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value) || 1
})

const paginatedGroups = computed(() => {
  return filteredGroups.value
})

const availableUsers = computed(() => {
  if (!selectedGroup.value) return allUsers.value
  const existingUserIds = selectedGroup.value.users?.map(u => u.id) || []
  return allUsers.value.filter(u => !existingUserIds.includes(u.id))
})

// ================================================================
// METHODS
// ================================================================

// -- Helper Methods for Member Display --
const getDisplayMembers = (group) => {
  return group.users?.slice(0, 3) || []
}

const hasMoreMembers = (group) => {
  return (group.users?.length || 0) > 3
}

const getRemainingMemberCount = (group) => {
  return Math.max(0, (group.users?.length || 0) - 3)
}

// -- Status Helper Methods --
const getEffectiveStatus = (group) => {
  // If group has no store assigned, just use its own status
  if (!group.storeId) {
    return group.status || 'Inactive'
  }
  // If group has a store, check both statuses
  if (group.status === 'Active' && group.storeStatus !== 'Active') {
    return 'Inactive'
  }
  return group.status || 'Active'
}

const canManageMembers = (group) => {
  // Groups without a store can always manage members regardless of status
  if (!group.storeId) {
    return true
  }
  // Groups with a store need to be active and have active store
  return group.status === 'Active' && group.storeStatus === 'Active'
}

// -- Load Data --
const loadStores = async () => {
  try {
    const response = await storeService.getStores({ limit: 100 })
    if (response.success) {
      stores.value = response.data.stores || []
    }
  } catch (error) {
    console.error('Load stores error:', error)
  }
}

const loadGroups = async () => {
  loading.value = true
  try {
    const response = await groupService.getGroups({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      storeId: filterStore.value || undefined,
      status: filterStatus.value || undefined
    })
    
    if (response.success) {
      groups.value = response.data.groups || []
      totalItems.value = response.data.pagination?.total || 0
    } else {
      showToastMessage(response.error || 'Failed to load groups', 'error')
    }
  } catch (error) {
    console.error('Load groups error:', error)
    showToastMessage('Failed to load groups', 'error')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await groupService.getAllUsers()
    if (response.success) {
      allUsers.value = response.data || []
    }
  } catch (error) {
    console.error('Load users error:', error)
  }
}

// -- Group CRUD --
const openAddGroupModal = () => {
  editingGroup.value = null
  groupForm.value = {
    name: '',
    storeId: '',
    status: 'Active'
  }
  showGroupModal.value = true
}

const openEditGroup = (group) => {
  editingGroup.value = group
  groupForm.value = { 
    name: group.name,
    storeId: group.storeId || '',
    status: group.status || 'Active'
  }
  showGroupModal.value = true
}

const closeGroupModal = () => {
  showGroupModal.value = false
  editingGroup.value = null
}

const saveGroup = async () => {
  savingGroup.value = true
  try {
    let response
    if (editingGroup.value) {
      response = await groupService.updateGroup(editingGroup.value.id, groupForm.value)
      if (response.success) {
        showToastMessage('Group updated successfully!', 'success')
        await loadGroups()
      }
    } else {
      response = await groupService.createGroup(groupForm.value)
      if (response.success) {
        const store = stores.value.find(s => s.id === response.data.storeId)
        const storeMsg = store ? ` to ${store.name}` : ' (No Store Assigned)'
        showToastMessage(`Group "${response.data.name}" created with code ${response.data.code}${storeMsg}!`, 'success')
        await loadGroups()
      }
    }
    closeGroupModal()
  } catch (error) {
    showToastMessage(error.message || 'Failed to save group', 'error')
  } finally {
    savingGroup.value = false
  }
}

// -- Members Management --
const openManageMembers = (group) => {
  // Allow managing members even if group has no store or is inactive
  // But show warning if inactive
  if (group.status === 'Inactive') {
    showToastMessage('This group is inactive. You can still manage members but the group will not be usable until activated.', 'warning')
  }
  
  selectedGroup.value = JSON.parse(JSON.stringify(group))
  selectedMemberId.value = ''
  showMembersModal.value = true
}

const closeMembersModal = () => {
  showMembersModal.value = false
  selectedGroup.value = null
  selectedMemberId.value = ''
  loadGroups()
}

const addMemberToGroup = async () => {
  if (!selectedMemberId.value) {
    showToastMessage('Please select a member', 'error')
    return
  }
  
  addingMember.value = true
  try {
    const response = await groupService.addUserToGroup(
      selectedGroup.value.id,
      selectedMemberId.value
    )
    
    if (response.success) {
      const user = allUsers.value.find(u => u.id === selectedMemberId.value)
      showToastMessage(`Member "${user?.fullName}" added to group!`, 'success')
      selectedGroup.value = response.data
      selectedMemberId.value = ''
      await loadGroups()
    }
  } catch (error) {
    showToastMessage(error.message || 'Failed to add member', 'error')
  } finally {
    addingMember.value = false
  }
}

const openRemoveMemberModal = (user) => {
  removeMember.value = user
  showRemoveMemberModal.value = true
}

const closeRemoveMemberModal = () => {
  showRemoveMemberModal.value = false
  removeMember.value = null
}

const confirmRemoveMember = async () => {
  if (removeMember.value && selectedGroup.value) {
    try {
      const response = await groupService.removeUserFromGroup(
        selectedGroup.value.id,
        removeMember.value.id
      )
      
      if (response.success) {
        showToastMessage(`Member "${removeMember.value.fullName}" removed from group`, 'success')
        selectedGroup.value = response.data
        await loadGroups()
      }
    } catch (error) {
      showToastMessage(error.message || 'Failed to remove member', 'error')
    }
    closeRemoveMemberModal()
  }
}

// -- Toggle Status --
const openToggleStatus = (group) => {
  toggleError.value = ''
  toggleGroup.value = group
  toggleNewStatus.value = group.status === 'Active' ? 'Inactive' : 'Active'
  showToggleModal.value = true
}

const closeToggleModal = () => {
  showToggleModal.value = false
  toggleGroup.value = null
  toggleNewStatus.value = ''
  toggleError.value = ''
  toggling.value = false
}

const confirmToggleStatus = async () => {
  if (!toggleGroup.value) return
  
  // Check if trying to activate with inactive store (only if group has a store)
  if (toggleNewStatus === 'Active' && toggleGroup.value.storeId && toggleGroup.value.storeStatus !== 'Active') {
    toggleError.value = `Cannot activate group because the store "${toggleGroup.value.storeName}" is ${toggleGroup.value.storeStatus?.toLowerCase()}`
    return
  }
  
  toggling.value = true
  toggleError.value = ''
  
  try {
    const response = await groupService.updateGroupStatus(
      toggleGroup.value.id,
      toggleNewStatus.value
    )
    
    if (response.success) {
      showToastMessage(response.message || `Group status changed to ${toggleNewStatus.value}`, 'success')
      await loadGroups()
      closeToggleModal()
    } else {
      const errorMsg = response.error || response.message || 'Failed to update status'
      toggleError.value = errorMsg
      showToastMessage(errorMsg, 'error')
    }
  } catch (error) {
    console.error('Toggle status error:', error)
    const errorMsg = error.response?.data?.message || error.message || 'Failed to update status'
    toggleError.value = errorMsg
    showToastMessage(errorMsg, 'error')
  } finally {
    toggling.value = false
  }
}

// -- Filters --
const onSearchChange = () => {
  currentPage.value = 1
  loadGroups()
}

const onFilterChange = () => {
  currentPage.value = 1
  loadGroups()
}

const clearFilters = () => {
  filterStore.value = ''
  filterStatus.value = ''
  filterStoreAssignment.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
  loadGroups()
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
    const response = await groupService.exportGroups({
      status: filterStatus.value || undefined,
      storeId: filterStore.value || undefined
    })
    
    if (response.success && response.data.length > 0) {
      const headers = Object.keys(response.data[0])
      const rows = response.data.map(item => headers.map(key => item[key]))
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `group_report_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToastMessage('Export completed successfully!', 'success')
    } else {
      showToastMessage(response.error || 'No data to export', 'error')
    }
  } catch (error) {
    console.error('Export error:', error)
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
        <title>Group Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h2 { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
          .member-tag { display: inline-block; padding: 2px 8px; background: #dcfce7; margin: 2px; border-radius: 4px; font-size: 10px; }
          .unassigned { background: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <h2>👥 Group Management Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Groups: ${totalItems.value}</p>
        ${printContents}
        <div class="print-footer">Printed from Group Management System</div>
      </body>
    </html>
  `
  
  window.print()
  document.body.innerHTML = originalContents
  window.location.reload()
}

// -- Pagination --
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadGroups()
}

const changePageSize = () => {
  currentPage.value = 1
  loadGroups()
}

// -- Toast --
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

// ================================================================
// WATCHERS
// ================================================================
watch([filterStore, filterStatus, filterStoreAssignment], () => {
  currentPage.value = 1
  loadGroups()
})

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











/* Role badge styles */
.role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 6px;
  white-space: nowrap;
}

.role-admin {
  background: #fef3c7;
  color: #92400e;
}

.role-superadmin {
  background: #fce7f3;
  color: #9d174d;
}

.role-manager {
  background: #dbeafe;
  color: #1e40af;
}

.role-user {
  background: #e2e8f0;
  color: #475569;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.role-indicator {
  font-size: 12px;
  color: #94a3b8;
}








.store-tag.unassigned {
  background: #fef3c7;
  color: #92400e;
}

.hint {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}


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

.group-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 950px;
}

.group-table th,
.group-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.group-table th {
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

.code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

.store-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* ================================================================
   MEMBER LIST
   ================================================================ */
.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  max-width: 250px;
}

.member-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #dcfce7;
  color: #166534;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.member-more {
  display: inline-block;
  padding: 2px 10px;
  background: #f1f5f9;
  color: #3b82f6;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.member-more:hover {
  background: #eff6ff;
  text-decoration: underline;
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
   TOGGLE MODAL
   ================================================================ */
.toggle-modal .modal-container {
  max-width: 450px;
}

.confirmation-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.confirmation-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 16px;
}

.confirmation-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}

.detail-value {
  color: #1e293b;
  font-weight: 500;
  font-size: 13px;
}

.warning-text {
  color: #f59e0b;
  font-weight: 500;
  text-align: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fef3c7;
  font-size: 13px;
}

.warning-subtext {
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  margin-top: 6px;
}

/* Error Box */
.error-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 14px;
  background: #fee2e2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.error-text {
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}

/* ================================================================
   DELETE MODAL
   ================================================================ */
.delete-modal .modal-container {
  max-width: 400px;
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
   GROUP FORM
   ================================================================ */
.group-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.group-form .form-group {
  flex: 1;
  min-width: 180px;
}

.group-form .form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.group-form .form-group input,
.group-form .form-group select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.group-form .form-group input:focus,
.group-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.store-select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: white;
}

/* ================================================================
   MEMBERS MODAL
   ================================================================ */
.members-modal .modal-container {
  max-width: 600px;
}

.add-member-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.add-member-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #1e293b;
}

.add-member-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.member-select {
  flex: 1;
  min-width: 200px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.btn-add-member {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.btn-add-member:hover:not(:disabled) {
  background: #2563eb;
}

.btn-add-member:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-available-members {
  color: #94a3b8;
  font-size: 13px;
  padding: 8px 0;
  font-style: italic;
}

.existing-members {
  margin-bottom: 16px;
}

.existing-members h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #1e293b;
}

.members-list {
  max-height: 250px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 2px;
  border: 1px solid #f1f5f9;
}

.member-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
}

.member-username {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.remove-member-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  padding: 0 4px;
}

.remove-member-btn:hover {
  color: #ef4444;
}

.no-members {
  color: #94a3b8;
  font-size: 12px;
  padding: 8px;
  text-align: center;
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
  
  .group-table th,
  .group-table td {
    border: 1px solid #ddd !important;
  }
  
  .status-badge {
    border: 1px solid #ddd !important;
  }
  
  .member-tag {
    display: inline-block !important;
    padding: 2px 8px !important;
    background: #dcfce7 !important;
    margin: 2px !important;
    border-radius: 4px !important;
    font-size: 10px !important;
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
  
  .group-form .form-row {
    flex-direction: column;
  }
  
  .add-member-form {
    flex-direction: column;
  }
  
  .group-table {
    min-width: 700px;
  }
  
  .modal-container {
    margin: 10px;
    max-width: 100%;
  }
  
  .member-list {
    max-width: 150px;
  }
}
</style>