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
      <select v-model="filterType" class="filter-select" @change="onFilterChange">
        <option value="">All Types</option>
        <option value="Main">Main Store</option>
        <option value="Mini">Mini Store</option>
        <option value="Mini Mini">Mini Mini Store</option>
        <option value="Regional">Regional Store</option>
        <option value="Specialized">Specialized Store</option>
      </select>
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Closed">Closed</option>
      </select>
      <select v-model="filterLocation" class="filter-select" @change="onFilterChange">
        <option value="">All Locations</option>
        <option value="Wana Gebi">Wana Gebi</option>
        <option value="Wana Gebi Kuter 2">Wana Gebi Kuter 2</option>
        <option value="Wana Gebi Kuter 3">Wana Gebi Kuter 3</option>
        <option value="Addis Ababa">Addis Ababa</option>
        <option value="Bahir Dar">Bahir Dar</option>
        <option value="Hawassa">Hawassa</option>
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
    <div class="table-container" id="printable-area">
      <table class="store-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Store Code</th>
            <th>Store Name</th>
            <th>Type</th>
            <th>Location</th>
            <th>Groups</th>
            <th>Users</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(store, index) in paginatedStores" :key="store.id">
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="code">{{ store.code }}</td>
            <td class="store-name-cell">{{ store.name }}</td>
            <td>{{ store.type || 'Main' }}</td>
            <td>{{ store.location || '-' }}</td>
            <td>
              <div class="group-tags-wrapper">
                <span v-for="group in store.groups" :key="group.id" class="group-tag" :title="group.name">
                  {{ group.name }}
                </span>
                <span v-if="!store.groups || store.groups.length === 0" class="no-items">No groups</span>
              </div>
            </td>
            <td class="text-center">{{ getTotalUsers(store) }}</td>
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
            <!-- Store Code removed - backend will generate it -->
            <div class="form-row">
              <div class="form-group">
                <label>Store Name *</label>
                <input v-model="storeForm.name" type="text" required placeholder="e.g., Fiber Main Store" />
              </div>
              <div class="form-group">
                <label>Store Type</label>
                <select v-model="storeForm.type">
                  <option value="Main">Main Store</option>
                  <option value="Mini">Mini Store</option>
                  <option value="Mini Mini">Mini Mini Store</option>
                  <option value="Regional">Regional Store</option>
                  <option value="Specialized">Specialized Store</option>
                </select>
              </div>
            </div>
            <div class="form-row">
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
          <!-- Add Group Form - Dropdown selection (no duplicates) -->
          <div class="add-group-section">
            <h4>Add Existing Group to Store</h4>
            <div class="add-group-form">
              <select v-model="selectedGroupToAdd" class="group-select">
                <option value="">Select a group to add...</option>
                <option v-for="group in availableGroupsToAdd" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
              <button @click="addGroupToStore" class="btn-add-group" :disabled="!selectedGroupToAdd">
                ➕ Add Group
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
              <div v-for="group in selectedStore?.groups" :key="group.id" class="group-item">
                <div class="group-info">
                  <span class="group-name">{{ group.name }}</span>
                  <span class="group-user-count">{{ group.users?.length || 0 }} members</span>
                </div>
                <div class="group-actions">
                  <button @click="openRemoveGroupModal(group)" class="icon-btn-small delete-btn" title="Remove from store">✕</button>
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
              <button @click="addUserToGroup" class="btn-add-user">➕ Add Member</button>
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
              <input type="radio" v-model="exportType" value="summary" /> Summary (Code, Name, Type, Status)
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
import { ref, computed, onMounted } from 'vue'

// ================================================================
// STATE
// ================================================================
const stores = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(5)
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterLocation = ref('')

// Store Modal
const showStoreModal = ref(false)
const editingStore = ref(null)
const savingStore = ref(false)

// Store form - NO CODE field (backend generates it)
const storeForm = ref({
  name: '',
  type: 'Main',
  location: '',
  status: 'Active'
})

// Group Modal
const showGroupModal = ref(false)
const selectedStore = ref(null)
const selectedGroup = ref(null)
const selectedGroupToAdd = ref('')
const newUserId = ref('')

// Remove Group Modal
const showRemoveGroupModal = ref(false)
const removeGroupItem = ref(null)

// Toggle Modals
const showToggleModal = ref(false)
const toggleStore = ref(null)
const toggleNewStatus = ref('')

// Remove User Modal
const showRemoveUserModal = ref(false)
const removeUserItem = ref(null)

// Export Modal
const showExportModal = ref(false)
const exporting = ref(false)
const exportType = ref('full')

// All available groups (master list - NO DUPLICATES)
const allGroups = ref([])

// Users (mock)
const allUsers = ref([])

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() => {
  return filterType.value || filterStatus.value || filterLocation.value
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
  
  if (filterType.value) {
    result = result.filter(store => store.type === filterType.value)
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

// Available groups to add - filtered to remove duplicates and already added groups
const availableGroupsToAdd = computed(() => {
  if (!selectedStore.value) return []
  const existingGroupNames = selectedStore.value.groups?.map(g => g.name) || []
  return allGroups.value.filter(g => !existingGroupNames.includes(g.name))
})

const availableUsers = computed(() => {
  if (!selectedStore.value || !selectedGroup.value) return allUsers.value
  const existingUserIds = selectedGroup.value.users?.map(u => u.id) || []
  return allUsers.value.filter(u => !existingUserIds.includes(u.id))
})

// ================================================================
// METHODS
// ================================================================

// -- Generate Store Code --
const generateStoreCode = () => {
  const maxNumber = stores.value.reduce((max, store) => {
    const num = parseInt(store.code.replace('STORE-', ''))
    return num > max ? num : max
  }, 0)
  
  const nextNumber = String(maxNumber + 1).padStart(3, '0')
  return 'STORE-' + nextNumber
}

// -- Load Data --
const loadStores = () => {
  loading.value = true
  setTimeout(() => {
    stores.value = getMockStores()
    allGroups.value = getMockAllGroups()
    allUsers.value = getMockUsers()
    loading.value = false
  }, 300)
}

const getMockStores = () => {
  return [
    {
      id: 'store-1',
      code: 'STORE-001',
      name: 'Fiber Main Store',
      type: 'Main',
      location: 'Wana Gebi',
      status: 'Active',
      groups: [
        { id: 'g1', name: 'Storekeeper', users: [{ id: 'u1', fullName: 'Biruk Mulualem', username: 'birukm' }, { id: 'u2', fullName: 'Dagmawi Hadgu', username: 'dagmawih' }, { id: 'u20', fullName: 'Abebe Kebede', username: 'abebe' }] },
        { id: 'g2', name: 'IT', users: [{ id: 'u3', fullName: 'Melkamu Zewdu', username: 'melkamu' }] },
        { id: 'g3', name: 'Auditor', users: [{ id: 'u4', fullName: 'Melaku Tewodros', username: 'melaku' }] }
      ]
    },
    {
      id: 'store-2',
      code: 'STORE-002',
      name: 'Paint Main Store',
      type: 'Main',
      location: 'Wana Gebi',
      status: 'Active',
      groups: [
        { id: 'g5', name: 'Storekeeper', users: [{ id: 'u6', fullName: 'Nuru Seid', username: 'nuru' }, { id: 'u7', fullName: 'Tadese Jemberu', username: 'tadese' }] },
        { id: 'g6', name: 'IT', users: [{ id: 'u8', fullName: 'Eshete Worke', username: 'eshete' }] }
      ]
    },
    {
      id: 'store-3',
      code: 'STORE-003',
      name: 'Fiber Mini Store',
      type: 'Mini',
      location: 'Wana Gebi Kuter 2',
      status: 'Active',
      groups: [
        { id: 'g8', name: 'Storekeeper', users: [{ id: 'u10', fullName: 'Zerihun Tesfaye', username: 'zerihun' }] },
        { id: 'g9', name: 'IT', users: [{ id: 'u11', fullName: 'Samuel Ayele', username: 'samuel' }] },
        { id: 'g10', name: 'Auditor', users: [{ id: 'u12', fullName: 'Berhanu Alemu', username: 'berhanu' }] }
      ]
    },
    {
      id: 'store-4',
      code: 'STORE-004',
      name: 'Paint Mini Store',
      type: 'Mini',
      location: 'Wana Gebi Kuter 2',
      status: 'Active',
      groups: [
        { id: 'g11', name: 'Storekeeper', users: [{ id: 'u13', fullName: 'Abebe Kebede', username: 'abebe' }, { id: 'u14', fullName: 'Mulugeta Desta', username: 'mulugeta' }] },
        { id: 'g12', name: 'IT', users: [{ id: 'u15', fullName: 'Getachew Ayele', username: 'getachew' }] }
      ]
    },
    {
      id: 'store-5',
      code: 'STORE-005',
      name: 'Fiber Mini Mini Store',
      type: 'Mini Mini',
      location: 'Wana Gebi Kuter 3',
      status: 'Active',
      groups: [
        { id: 'g13', name: 'Storekeeper', users: [{ id: 'u16', fullName: 'Tigist Hailu', username: 'tigist' }] }
      ]
    },
    {
      id: 'store-6',
      code: 'STORE-006',
      name: 'Metal Store',
      type: 'Specialized',
      location: 'Wana Gebi Kuter 3',
      status: 'Active',
      groups: [
        { id: 'g15', name: 'Storekeeper', users: [{ id: 'u18', fullName: 'Henok Ayele', username: 'henok' }] },
        { id: 'g16', name: 'IT', users: [{ id: 'u19', fullName: 'Sintayehu Worku', username: 'sintayehu' }] },
        { id: 'g17', name: 'Auditor', users: [{ id: 'u21', fullName: 'Birhanu Alemu', username: 'birhanu' }, { id: 'u22', fullName: 'Meskerem Tesfaye', username: 'meskerem' }] }
      ]
    }
  ]
}

// All groups - UNIQUE names (no duplicates)
const getMockAllGroups = () => {
  return [
    { id: 'g1', name: 'Storekeeper' },
    { id: 'g2', name: 'IT' },
    { id: 'g3', name: 'Auditor' },
    { id: 'g4', name: 'Supplier' },
    { id: 'g5', name: 'Quality Control' },
    { id: 'g6', name: 'Warehouse' },
    { id: 'g7', name: 'Logistics' }
  ]
}

const getMockUsers = () => {
  return [
    { id: 'u1', fullName: 'Biruk Mulualem', username: 'birukm' },
    { id: 'u2', fullName: 'Dagmawi Hadgu', username: 'dagmawih' },
    { id: 'u3', fullName: 'Melkamu Zewdu', username: 'melkamu' },
    { id: 'u4', fullName: 'Melaku Tewodros', username: 'melaku' },
    { id: 'u5', fullName: 'Tamrat Zerihun', username: 'tamrat' },
    { id: 'u6', fullName: 'Nuru Seid', username: 'nuru' },
    { id: 'u7', fullName: 'Tadese Jemberu', username: 'tadese' },
    { id: 'u8', fullName: 'Eshete Worke', username: 'eshete' },
    { id: 'u9', fullName: 'Haymanot Abebaw', username: 'haymanot' },
    { id: 'u10', fullName: 'Zerihun Tesfaye', username: 'zerihun' },
    { id: 'u11', fullName: 'Samuel Ayele', username: 'samuel' },
    { id: 'u12', fullName: 'Berhanu Alemu', username: 'berhanu' },
    { id: 'u13', fullName: 'Abebe Kebede', username: 'abebe' },
    { id: 'u14', fullName: 'Mulugeta Desta', username: 'mulugeta' },
    { id: 'u15', fullName: 'Getachew Ayele', username: 'getachew' },
    { id: 'u16', fullName: 'Tigist Hailu', username: 'tigist' },
    { id: 'u17', fullName: 'Meron Tekle', username: 'meron' },
    { id: 'u18', fullName: 'Henok Ayele', username: 'henok' },
    { id: 'u19', fullName: 'Sintayehu Worku', username: 'sintayehu' },
    { id: 'u20', fullName: 'Abebe Kebede', username: 'abebe' },
    { id: 'u21', fullName: 'Birhanu Alemu', username: 'birhanu' },
    { id: 'u22', fullName: 'Meskerem Tesfaye', username: 'meskerem' }
  ]
}

const getTotalUsers = (store) => {
  let count = 0
  store.groups?.forEach(group => {
    count += group.users?.length || 0
  })
  return count
}

// -- Store CRUD --
const openAddStoreModal = () => {
  editingStore.value = null
  storeForm.value = {
    name: '',
    type: 'Main',
    location: '',
    status: 'Active'
  }
  showStoreModal.value = true
}

const openEditStore = (store) => {
  editingStore.value = store
  storeForm.value = { 
    name: store.name,
    type: store.type || 'Main',
    location: store.location || '',
    status: store.status || 'Active'
  }
  showStoreModal.value = true
}

const closeStoreModal = () => {
  showStoreModal.value = false
  editingStore.value = null
}

const saveStore = () => {
  savingStore.value = true
  setTimeout(() => {
    if (editingStore.value) {
      // Update existing store - keep the same code
      const idx = stores.value.findIndex(s => s.id === editingStore.value.id)
      if (idx !== -1) {
        stores.value[idx] = { 
          ...storeForm.value, 
          id: editingStore.value.id,
          code: editingStore.value.code,
          groups: editingStore.value.groups 
        }
      }
      showToastMessage('Store updated successfully!', 'success')
    } else {
      // Add new store - backend generates the code
      const maxNumber = stores.value.reduce((max, store) => {
        const num = parseInt(store.code.replace('STORE-', ''))
        return num > max ? num : max
      }, 0)
      const nextNumber = String(maxNumber + 1).padStart(3, '0')
      const newCode = 'STORE-' + nextNumber
      
      const newStore = {
        ...storeForm.value,
        id: 'store-' + Date.now(),
        code: newCode,
        groups: []
      }
      stores.value.push(newStore)
      showToastMessage(`Store "${newStore.name}" added with code ${newCode}!`, 'success')
    }
    closeStoreModal()
    savingStore.value = false
  }, 500)
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

const addGroupToStore = () => {
  if (!selectedGroupToAdd.value) {
    showToastMessage('Please select a group', 'error')
    return
  }
  
  const groupToAdd = allGroups.value.find(g => g.id === selectedGroupToAdd.value)
  if (!groupToAdd) return
  
  const store = stores.value.find(s => s.id === selectedStore.value.id)
  if (store) {
    if (!store.groups) store.groups = []
    if (store.groups.some(g => g.name === groupToAdd.name)) {
      showToastMessage(`Group "${groupToAdd.name}" already exists in this store`, 'error')
      return
    }
    store.groups.push({ ...groupToAdd, users: [] })
    selectedStore.value = JSON.parse(JSON.stringify(store))
    selectedGroupToAdd.value = ''
    showToastMessage(`Group "${groupToAdd.name}" added to store!`, 'success')
  }
}

// -- Remove Group --
const openRemoveGroupModal = (group) => {
  removeGroupItem.value = group
  showRemoveGroupModal.value = true
}

const closeRemoveGroupModal = () => {
  showRemoveGroupModal.value = false
  removeGroupItem.value = null
}

const confirmRemoveGroup = () => {
  if (removeGroupItem.value) {
    const store = stores.value.find(s => s.id === selectedStore.value.id)
    if (store) {
      store.groups = store.groups.filter(g => g.id !== removeGroupItem.value.id)
      selectedStore.value = JSON.parse(JSON.stringify(store))
      if (selectedGroup.value?.id === removeGroupItem.value.id) {
        selectedGroup.value = null
      }
      showToastMessage(`Group "${removeGroupItem.value.name}" removed from store`, 'success')
    }
    closeRemoveGroupModal()
  }
}

// -- User Management --
const openManageUsers = (group) => {
  selectedGroup.value = group
  newUserId.value = ''
}

const addUserToGroup = () => {
  if (!newUserId.value) {
    showToastMessage('Please select a user', 'error')
    return
  }
  
  const user = allUsers.value.find(u => u.id === newUserId.value)
  if (!user) return
  
  const store = stores.value.find(s => s.id === selectedStore.value.id)
  if (store) {
    const group = store.groups.find(g => g.id === selectedGroup.value.id)
    if (group) {
      if (!group.users) group.users = []
      if (group.users.some(u => u.id === user.id)) {
        showToastMessage('User already in this group', 'error')
        return
      }
      group.users.push({ ...user })
      selectedGroup.value = JSON.parse(JSON.stringify(group))
      selectedStore.value = JSON.parse(JSON.stringify(store))
      newUserId.value = ''
      showToastMessage(`User "${user.fullName}" added to group!`, 'success')
    }
  }
}

// -- Remove User --
const openRemoveUserModal = (user) => {
  removeUserItem.value = user
  showRemoveUserModal.value = true
}

const closeRemoveUserModal = () => {
  showRemoveUserModal.value = false
  removeUserItem.value = null
}

const confirmRemoveUser = () => {
  const store = stores.value.find(s => s.id === selectedStore.value.id)
  if (store) {
    const group = store.groups.find(g => g.id === selectedGroup.value.id)
    if (group && removeUserItem.value) {
      group.users = group.users.filter(u => u.id !== removeUserItem.value.id)
      selectedGroup.value = JSON.parse(JSON.stringify(group))
      selectedStore.value = JSON.parse(JSON.stringify(store))
      showToastMessage(`User "${removeUserItem.value.fullName}" removed from group`, 'success')
    }
  }
  closeRemoveUserModal()
}

// -- Store Toggle Status --
const openToggleStatus = (store) => {
  toggleStore.value = store;
  toggleNewStatus.value = store.status === 'Active' ? 'Inactive' : 'Active';
  showToggleModal.value = true;
}
const closeToggleModal = () => {
  showToggleModal.value = false
  toggleStore.value = null
  toggleNewStatus.value = ''
}

const confirmToggleStatus = () => {
  if (toggleStore.value) {
    toggleStore.value.status = toggleNewStatus.value
    showToastMessage(`Store status changed to ${toggleNewStatus.value}`, 'success')
  }
  closeToggleModal()
}

// -- Filters --
const onSearchChange = () => {
  currentPage.value = 1
}

const onFilterChange = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  filterType.value = ''
  filterStatus.value = ''
  filterLocation.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
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

// -- Export --
const openExportModal = () => {
  exportType.value = 'full'
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
}

const exportSelectedReport = () => {
  exporting.value = true
  setTimeout(() => {
    let headers = [], rows = []
    const data = filteredStores.value
    
    if (exportType.value === 'full') {
      headers = ['#', 'Store Code', 'Store Name', 'Type', 'Location', 'Total Groups', 'Total Users', 'Status']
      rows = data.map((store, index) => [
        index + 1,
        store.code,
        store.name,
        store.type || 'Main',
        store.location || '-',
        store.groups?.length || 0,
        getTotalUsers(store),
        store.status || 'Active'
      ])
    } else if (exportType.value === 'summary') {
      headers = ['Store Code', 'Store Name', 'Type', 'Status']
      rows = data.map(store => [
        store.code,
        store.name,
        store.type || 'Main',
        store.status || 'Active'
      ])
    } else {
      headers = ['Store', 'Group Name', 'Members Count']
      rows = []
      data.forEach(store => {
        store.groups?.forEach(group => {
          rows.push([
            store.name,
            group.name,
            group.users?.length || 0
          ])
        })
      })
      if (rows.length === 0) {
        rows.push(['No groups found', '', ''])
      }
    }
    
    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `store_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    exporting.value = false
    closeExportModal()
    showToastMessage('Export completed successfully!', 'success')
  }, 500)
}

// -- Pagination --
const changePage = (page) => {
  currentPage.value = page
}

const changePageSize = () => {
  currentPage.value = 1
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
onMounted(() => {
  loadStores()
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
  min-width: 900px;
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

.btn-add-group:hover {
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

.btn-add-user:hover {
  background: #2563eb;
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
   TOGGLE MODAL
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
    min-width: 800px;
  }
  
  .modal-container {
    margin: 10px;
    max-width: 100%;
  }
}
</style>