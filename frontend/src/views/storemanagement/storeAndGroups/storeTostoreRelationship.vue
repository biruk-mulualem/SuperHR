<!-- pages/StoreRelationships.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🔗 Store to Store Relationships</h2>
        <span class="total-badge">{{ totalItems }} Relationships</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search stores or codes..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openCreateModal">➕ Add Relationship</button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select v-model="filterStore" class="filter-select" @change="onFilterChange">
        <option value="all">All Stores</option>
        <option v-for="store in stores" :key="store.id" :value="store.id">
          {{ store.name }}
        </option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
      <div class="filter-actions">
        <button class="btn-print" @click="printTable">🖨️ Print</button>
        <button class="btn-export" @click="openExportModal">📊 Export</button>
      </div>
    </div>

    <!-- ==================== RELATIONSHIPS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading relationships...</p>
    </div>

    <div v-else class="table-container" id="printable-area">
      <table class="relationships-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Store Asking</th>
            <th>➡️</th>
            <th>Store Supplying</th>
            <th>Description</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedRelationships.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🔗</span>
                <p>No relationships found</p>
                <button class="btn-secondary" @click="openCreateModal">Create First Relationship</button>
              </div>
            </td>
          </tr>
          <tr v-for="(rel, index) in paginatedRelationships" :key="rel.id">
            <td class="text-center">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="code-cell">{{ rel.code }}</td>
            <td class="store-name">{{ getStoreName(rel.sourceStoreId) }}</td>
            <td class="arrow-cell">➡️</td>
            <td class="store-name">{{ getStoreName(rel.targetStoreId) }}</td>
            <td class="description-cell">{{ rel.description || 'No description' }}</td>
            <td>
              <span :class="['status-badge', rel.status]">
                {{ rel.status }}
              </span>
            </td>
            <td>{{ formatDate(rel.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button class="icon-btn" @click="editRelationship(rel)" title="Edit">✏️</button>
                <button class="icon-btn" @click="openToggleModal(rel)" :title="rel.status === 'active' ? 'Deactivate' : 'Activate'">
                  {{ rel.status === 'active' ? '⏸️' : '▶️' }}
                </button>
            
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
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

    <!-- ==================== CREATE/EDIT MODAL ==================== -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container relationship-modal">
        <div class="modal-header">
          <h3>{{ editingRelationship ? '✏️ Edit Relationship' : '➕ Add New Relationship' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveRelationship" class="relationship-form">
            <!-- Code field - only shown when editing -->
            <div v-if="editingRelationship" class="form-row">
              <div class="form-group">
                <label>Relationship Code</label>
                <input v-model="form.code" type="text" readonly />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div v-else class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div class="form-group">
                <!-- Empty for alignment -->
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Store Asking (Source) *</label>
                <select v-model="form.sourceStoreId" required @change="autoGenerateDescription">
                  <option value="">Select Store</option>
                  <option v-for="store in stores" :key="store.id" :value="store.id">
                    {{ store.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Store Supplying (Target) *</label>
                <select v-model="form.targetStoreId" required @change="autoGenerateDescription">
                  <option value="">Select Store</option>
                  <option v-for="store in stores" :key="store.id" :value="store.id">
                    {{ store.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Description *</label>
                <input 
                  v-model="form.description" 
                  type="text" 
                  required 
                  placeholder="Auto-generates when both stores are selected"
                />
              </div>
            </div>
            <!-- Error message for same store -->
            <div v-if="form.sourceStoreId && form.targetStoreId && form.sourceStoreId === form.targetStoreId" class="form-error">
              ⚠️ A store cannot be both the asking and supplying store
            </div>
          </form>
        </div>
       <div class="modal-footer">
  <button class="btn-secondary" @click="closeModal">Cancel</button>
  <button 
    class="btn-primary" 
    @click="saveRelationship" 
    :disabled="saving || isSameStore"
  >
    {{ saving ? 'Saving...' : (editingRelationship ? 'Update' : 'Add') }}
  </button>
</div>
      </div>
    </div>

    <!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>🗑️ Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">⚠️</div>
          <p><strong>Delete:</strong> {{ relationshipToDelete?.code }}</p>
          <p><strong>Source:</strong> {{ relationshipToDelete ? getStoreName(relationshipToDelete.sourceStoreId) : '' }}</p>
          <p><strong>Target:</strong> {{ relationshipToDelete ? getStoreName(relationshipToDelete.targetStoreId) : '' }}</p>
          <p class="delete-warning">This action cannot be undone!</p>
          <p class="delete-question">Are you sure you want to delete this relationship?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- ==================== TOGGLE STATUS CONFIRMATION MODAL ==================== -->
    <div v-if="showToggleModal" class="modal-overlay" @click.self="closeToggleModal">
      <div class="modal-container toggle-modal">
        <div class="modal-header">
          <h3>{{ relationshipToToggle?.status === 'active' ? '⏸️' : '▶️' }} Confirm Status Change</h3>
          <button class="modal-close" @click="closeToggleModal">✕</button>
        </div>
        <div class="modal-body">
          <p><strong>Relationship:</strong> {{ relationshipToToggle?.code }}</p>
          <p><strong>Current Status:</strong> 
            <span :class="['status-badge', relationshipToToggle?.status]">
              {{ relationshipToToggle?.status }}
            </span>
          </p>
          <p><strong>New Status:</strong> 
            <span :class="['status-badge', relationshipToToggle ? getNewStatus(relationshipToToggle.status) : '']">
              {{ relationshipToToggle ? getNewStatus(relationshipToToggle.status) : '' }}
            </span>
          </p>
          <p class="warning-text">⚠️ Are you sure you want to change the status?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeToggleModal">Cancel</button>
          <button class="btn-primary" @click="confirmToggle">Confirm</button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Relationships</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary (Code, Source, Target, Status)
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

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import relationshipService, { type StoreRelationship } from '@/stores/storeToStoreRelationshipService'
import storeService from '@/stores/storeService'

// ================================================================
// TYPES
// ================================================================

interface Store {
  id: number
  name: string
  code: string
  location?: string
  status: string
}

// ================================================================
// STATE
// ================================================================
const stores = ref<Store[]>([])
const relationships = ref<StoreRelationship[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('all')
const filterStore = ref('all')
const currentPage = ref(1)
const pageSize = ref(5)
const totalItems = ref(0)

// Modal states
const showModal = ref(false)
const editingRelationship = ref<StoreRelationship | null>(null)
const saving = ref(false)
const showDeleteModal = ref(false)
const showToggleModal = ref(false)
const showExportModal = ref(false)
const relationshipToDelete = ref<StoreRelationship | null>(null)
const relationshipToToggle = ref<StoreRelationship | null>(null)
const exporting = ref(false)
const exportType = ref<'full' | 'summary'>('full')

const form = ref({
  sourceStoreId: '',
  targetStoreId: '',
  status: 'active' as 'active' | 'inactive',
  description: '',
  code: '',
})

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')

// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() => {
  return filterStatus.value !== 'all' || filterStore.value !== 'all' || searchQuery.value
})

const filteredRelationships = computed(() => {
  let result = relationships.value
  
  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase()
    result = result.filter(rel => 
      rel.code.toLowerCase().includes(s) ||
      rel.description?.toLowerCase().includes(s) ||
      getStoreName(rel.sourceStoreId).toLowerCase().includes(s) ||
      getStoreName(rel.targetStoreId).toLowerCase().includes(s)
    )
  }
  
  if (filterStatus.value !== 'all') {
    result = result.filter(rel => rel.status === filterStatus.value)
  }
  
  if (filterStore.value !== 'all') {
    const storeId = Number(filterStore.value)
    result = result.filter(rel => 
      rel.sourceStoreId === storeId || 
      rel.targetStoreId === storeId
    )
  }
  
  return result
})

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value) || 1
})

const paginatedRelationships = computed(() => {
  return relationships.value
})

// ================================================================
// METHODS
// ================================================================

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

const loadRelationships = async () => {
  loading.value = true
  try {
    const response = await relationshipService.getRelationships({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value,
      storeId: filterStore.value,
    })
    
    if (response.success) {
      relationships.value = response.data.relationships || []
      totalItems.value = response.data.pagination?.total || 0
    } else {
      showToastMessage(response.error || 'Failed to load relationships', 'error')
    }
  } catch (error: any) {
    console.error('Load relationships error:', error)
    showToastMessage('Failed to load relationships', 'error')
  } finally {
    loading.value = false
  }
}

// ================================================================
// COMPUTED
// ================================================================

// Check if source and target are the same
const isSameStore = computed(() => {
  return !!(form.value.sourceStoreId && form.value.targetStoreId && form.value.sourceStoreId === form.value.targetStoreId)
})

// -- Helper Methods --
const getStoreName = (storeId: number): string => {
  const store = stores.value.find(s => s.id === storeId)
  return store ? store.name : 'Unknown'
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getNewStatus = (currentStatus: string): string => {
  return currentStatus === 'active' ? 'inactive' : 'active'
}

const autoGenerateDescription = (): void => {
  if (form.value.sourceStoreId && form.value.targetStoreId) {
    const sourceName = getStoreName(Number(form.value.sourceStoreId))
    const targetName = getStoreName(Number(form.value.targetStoreId))
    
    if (editingRelationship.value && form.value.description) {
      return
    }
    
    form.value.description = `${sourceName} requests items from ${targetName}`
  }
}

// -- Modal Methods --
const openCreateModal = (): void => {
  editingRelationship.value = null
  form.value = { 
    sourceStoreId: '', 
    targetStoreId: '', 
    status: 'active', 
    description: '',
    code: '',
  }
  showModal.value = true
}

const editRelationship = (rel: StoreRelationship): void => {
  editingRelationship.value = rel
  form.value = {
    code: rel.code,
    sourceStoreId: String(rel.sourceStoreId),
    targetStoreId: String(rel.targetStoreId),
    status: rel.status,
    description: rel.description || '',
  }
  showModal.value = true
}

const closeModal = (): void => {
  showModal.value = false
  editingRelationship.value = null
}

// -- Save Relationship --
const saveRelationship = async (): Promise<void> => {
  if (!form.value.sourceStoreId) {
    showToastMessage('Please select the source store', 'error')
    return
  }

  if (!form.value.targetStoreId) {
    showToastMessage('Please select the target store', 'error')
    return
  }

  // 🔴 CRITICAL: Check if source and target are the same
  if (form.value.sourceStoreId === form.value.targetStoreId) {
    showToastMessage('A store cannot be both the asking and supplying store', 'error')
    return
  }

  if (!form.value.description?.trim()) {
    showToastMessage('Please enter a description', 'error')
    return
  }

  saving.value = true
  try {
    let response
    if (editingRelationship.value) {
      response = await relationshipService.updateRelationship(
        editingRelationship.value.id,
        {
          sourceStoreId: Number(form.value.sourceStoreId),
          targetStoreId: Number(form.value.targetStoreId),
          status: form.value.status,
          description: form.value.description,
        }
      )
      if (response.success) {
        showToastMessage('Relationship updated successfully!', 'success')
        await loadRelationships()
      }
    } else {
      // Check for duplicate
      const exists = relationships.value.some(rel => 
        rel.sourceStoreId === Number(form.value.sourceStoreId) && 
        rel.targetStoreId === Number(form.value.targetStoreId)
      )
      if (exists) {
        showToastMessage('This relationship already exists', 'error')
        saving.value = false
        return
      }

      response = await relationshipService.createRelationship({
        sourceStoreId: Number(form.value.sourceStoreId),
        targetStoreId: Number(form.value.targetStoreId),
        status: form.value.status,
        description: form.value.description,
      })
      if (response.success) {
        showToastMessage(`Relationship created successfully!`, 'success')
        await loadRelationships()
      }
    }
    closeModal()
  } catch (error: any) {
    showToastMessage(error.message || 'Failed to save relationship', 'error')
  } finally {
    saving.value = false
  }
}

// -- Delete --
const openDeleteModal = (rel: StoreRelationship): void => {
  relationshipToDelete.value = rel
  showDeleteModal.value = true
}

const closeDeleteModal = (): void => {
  showDeleteModal.value = false
  relationshipToDelete.value = null
}

const confirmDelete = async (): Promise<void> => {
  if (relationshipToDelete.value) {
    try {
      const response = await relationshipService.deleteRelationship(relationshipToDelete.value.id)
      if (response.success) {
        showToastMessage(`Relationship ${relationshipToDelete.value.code} deactivated`, 'success')
        await loadRelationships()
      }
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to delete relationship', 'error')
    }
    closeDeleteModal()
  }
}

// -- Toggle Status --
const openToggleModal = (rel: StoreRelationship): void => {
  relationshipToToggle.value = rel
  showToggleModal.value = true
}

const closeToggleModal = (): void => {
  showToggleModal.value = false
  relationshipToToggle.value = null
}

const confirmToggle = async (): Promise<void> => {
  if (relationshipToToggle.value) {
    const newStatus = relationshipToToggle.value.status === 'active' ? 'inactive' : 'active'
    try {
      const response = await relationshipService.updateRelationshipStatus(
        relationshipToToggle.value.id,
        newStatus
      )
      if (response.success) {
        showToastMessage(`Relationship ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success')
        await loadRelationships()
      }
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to update status', 'error')
    }
    closeToggleModal()
  }
}

// -- Filters --
const onSearchChange = (): void => {
  currentPage.value = 1
  loadRelationships()
}

const onFilterChange = (): void => {
  currentPage.value = 1
  loadRelationships()
}

const clearFilters = (): void => {
  filterStatus.value = 'all'
  filterStore.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
  loadRelationships()
}

// -- Pagination --
const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadRelationships()
}

const changePageSize = (): void => {
  currentPage.value = 1
  loadRelationships()
}

// -- Print --
const printTable = (): void => {
  const printContents = document.getElementById('printable-area')?.innerHTML || ''
  const originalContents = document.body.innerHTML
  
  document.body.innerHTML = `
    <html>
      <head>
        <title>Store Relationships Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h2 { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
          .status-badge.active { background: #dcfce7; color: #166534; }
          .status-badge.inactive { background: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <h2>🔗 Store Relationships Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Relationships: ${filteredRelationships.value.length}</p>
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
const openExportModal = (): void => {
  exportType.value = 'full'
  showExportModal.value = true
}

const closeExportModal = (): void => {
  showExportModal.value = false
}

const exportSelectedReport = async (): Promise<void> => {
  exporting.value = true
  try {
    const response = await relationshipService.exportRelationships({
      status: filterStatus.value,
      storeId: filterStore.value,
    })
    
    if (response.success && response.data && response.data.length > 0) {
      const firstItem = response.data[0]
      if (!firstItem) {
        showToastMessage('No data to export', 'error')
        exporting.value = false
        return
      }
      
      const headers = Object.keys(firstItem)
      const rows = response.data.map((item: any) => headers.map((key: string) => item[key] ?? ''))
      const csv = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n')
      
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `store_relationships_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToastMessage('Export completed successfully!', 'success')
    } else {
      showToastMessage(response.error || 'No data to export', 'error')
    }
  } catch (error: any) {
    console.error('Export error:', error)
    showToastMessage(error.message || 'Failed to export', 'error')
  } finally {
    exporting.value = false
    closeExportModal()
  }
}

// -- Toast --
const showToastMessage = (msg: string, type: 'success' | 'error' | 'info' = 'success'): void => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// WATCHERS
// ================================================================
watch([() => form.value.sourceStoreId, () => form.value.targetStoreId], () => {
  autoGenerateDescription()
})

watch([filterStatus, filterStore], () => {
  currentPage.value = 1
  loadRelationships()
})

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
  await Promise.all([
    loadStores(),
    loadRelationships()
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
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.relationships-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 900px;
}

.relationships-table th,
.relationships-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.relationships-table th {
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

.code-cell {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

.arrow-cell {
  text-align: center;
  font-size: 16px;
  opacity: 0.5;
}

.store-name {
  font-weight: 500;
}

.description-cell {
  max-width: 200px;
  white-space: normal;
  word-break: break-word;
  font-size: 12px;
  color: #475569;
}

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

.icon-btn.delete:hover {
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

.relationship-modal .modal-container {
  max-width: 650px;
}

.toggle-modal .modal-container,
.delete-modal .modal-container {
  max-width: 400px;
}

.export-modal .modal-container {
  max-width: 400px;
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
   RELATIONSHIP FORM
   ================================================================ */
.relationship-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.relationship-form .form-group {
  flex: 1;
  min-width: 180px;
}

.relationship-form .form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.relationship-form .form-group input,
.relationship-form .form-group select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.relationship-form .form-group input:focus,
.relationship-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.relationship-form .form-group input:read-only {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.form-error {
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  margin-top: 8px;
}

/* ================================================================
   DELETE & TOGGLE MODAL STYLES
   ================================================================ */
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

.warning-text {
  color: #f59e0b;
  font-weight: 500;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fef3c7;
}

/* ================================================================
   EXPORT MODAL
   ================================================================ */
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
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 40px !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
}

.empty-content p {
  color: #64748b;
  margin: 0;
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
  
  .relationships-table th,
  .relationships-table td {
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
  
  .relationship-form .form-row {
    flex-direction: column;
  }
  
  .relationships-table {
    min-width: 800px;
  }
  
  .modal-container {
    margin: 10px;
    max-width: 100% !important;
  }
}
</style>