<!-- views/storemanagement/itemRequests/itemRequests.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📦 Item Requests</h2>
        <span class="total-badge">{{ totalItems }} Requests</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by item, store, or requester..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openCreateModal">➕ New Request</button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="finalized">Finalized</option>
      </select>
      <select v-model="filterStore" class="filter-select" @change="onFilterChange">
        <option value="all">All Stores</option>
        <option v-for="store in activeStores" :key="store.storeId || store.id" :value="String(store.storeId || store.id)">
          {{ store.name }}
        </option>
      </select>
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
      <div class="filter-actions">
        <button class="btn-export" @click="openExportModal">📊 Export</button>
      </div>
    </div>

    <!-- ==================== REQUESTS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading requests...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="requests-table">
        <thead>
          <tr>
            <th class="col-expand"> </th>
            <th class="col-code">Request Code</th>
            <th class="col-items">Items</th>
            <th class="col-store">Asking Store</th>
            <th class="col-arrow"> </th>
            <th class="col-store">Supplying Store</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedRequests.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📦</span>
                <p>No requests found</p>
                <button class="btn-secondary" @click="openCreateModal">Create First Request</button>
              </div>
            </td>
          </tr>
          <template v-for="req in paginatedRequests" :key="req.requestId || req.id">
            <!-- Main Row -->
            <tr :class="{ 'expanded-row': expandedRow === (req.requestId || req.id) }">
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(req.requestId || req.id)">
                  {{ expandedRow === (req.requestId || req.id) ? "▼" : "▶" }}
                </button>
              </td>
              <td class="code-cell">{{ req.requestCode || req.id }}</td>
              <td>
                <div class="items-summary">
                  <span class="item-count">{{ req.items?.length || 0 }} item(s)</span>
                  <span class="item-names">{{ getItemNames(req.items) }}</span>
                </div>
              </td>
              <td class="store-name">{{ getStoreName(req.askingStoreId) }}</td>
              <td class="arrow-cell">➡️</td>
              <td class="store-name">{{ getStoreName(req.supplyingStoreId) }}</td>
              <td>
                <span :class="['status-badge', req.status]">
                  {{ req.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="icon-btn print-btn" @click="printRequest(req)" title="Print Request">
                    🖨️
                  </button>
                  <button v-if="req.status !== 'finalized'" class="icon-btn" @click="editRequest(req)" title="Edit">
                    ✏️
                  </button>
                  <button 
                    v-if="req.status === 'pending'"
                    class="icon-btn" 
                    @click="openStatusConfirmation(req, 'approved')" 
                    title="Approve"
                  >
                    ✅
                  </button>
                  <button 
                    v-if="req.status === 'pending'"
                    class="icon-btn" 
                    @click="openStatusConfirmation(req, 'rejected')" 
                    title="Reject"
                  >
                    🚫
                  </button>
                  <button 
                    v-if="req.status === 'approved'"
                    class="icon-btn" 
                    @click="openStatusConfirmation(req, 'finalized')" 
                    title="Finalize"
                  >
                    📋
                  </button>
                </div>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr v-if="expandedRow === (req.requestId || req.id)" class="detail-expand-row">
              <td colspan="8">
                <div class="expand-details">
                  <div class="detail-container">
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📋 Request Information</h4>
                        <div><span>Request Code</span><span class="value">{{ req.requestCode || req.id }}</span></div>
                        <div><span>Status</span>
                          <span class="value">
                            <span :class="['status-badge', req.status]">{{ req.status }}</span>
                          </span>
                        </div>
                        <div><span>Requested By</span><span class="value">{{ getRequesterName(req) }}</span></div>
                        <div><span>Requested Date</span><span class="value">{{ formatDate(req.requestedDate) }}</span></div>
                        <div><span>Created At</span><span class="value">{{ formatDateTime(req.createdAt) }}</span></div>
                        <div v-if="req.updatedAt"><span>Last Updated</span><span class="value">{{ formatDateTime(req.updatedAt) }}</span></div>
                      </div>

                      <div class="detail-card">
                        <h4>🏪 Store Details</h4>
                        <div><span>Asking Store</span><span class="value">{{ getStoreName(req.askingStoreId) }}</span></div>
                        <div><span>Asking Store Code</span><span class="value">{{ getStoreCode(req.askingStoreId) }}</span></div>
                        <div><span>Supplying Store</span><span class="value">{{ getStoreName(req.supplyingStoreId) }}</span></div>
                        <div><span>Supplying Store Code</span><span class="value">{{ getStoreCode(req.supplyingStoreId) }}</span></div>
                      </div>
                    </div>

                    <div class="detail-card full-width">
                      <h4>📦 Items Requested</h4>
                      <table class="items-detail-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item Name</th>
                            <th>Item Code</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>UOM</th>
                            <th>Quantity</th>
                            <th>Specification</th>
                            <th>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="!req.items || req.items.length === 0">
                            <td colspan="9" class="text-center no-items">No items in this request</td>
                          </tr>
                          <tr v-for="(item, index) in req.items" :key="index">
                            <td class="text-center">{{ index + 1 }}</td>
                            <td>{{ getItemName(item.itemId) }}</td>
                            <td>{{ getItemCode(item.itemId) }}</td>
                            <td>{{ getItemBrand(item.itemId) || 'N/A' }}</td>
                            <td>{{ getItemModel(item.itemId) || 'N/A' }}</td>
                            <td>{{ getItemUOM(item.itemId) || 'N/A' }}</td>
                            <td class="text-center">{{ item.quantity }}</td>
                            <td class="spec-cell">{{ getItemSpecification(item.itemId) || 'N/A' }}</td>
                            <td>{{ item.remark || '-' }}</td>
                          </tr>
                          <tr class="total-row">
                            <td colspan="8" class="text-right"><strong>Total Items:</strong></td>
                            <td class="text-center"><strong>{{ req.items?.length || 0 }}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div class="detail-card full-width">
                      <h4>📝 General Remark</h4>
                      <div v-if="req.remark" class="remark-content">{{ req.remark }}</div>
                      <div v-else class="no-remark">No remarks provided</div>
                    </div>

                    <div class="detail-actions">
                      <button class="btn-print-detail" @click="printRequest(req)">
                        🖨️ Print Request
                      </button>
                      <button v-if="req.status !== 'finalized'" class="btn-edit-detail" @click="editRequest(req)">
                        ✏️ Edit
                      </button>
                      <button 
                        v-if="req.status === 'pending'"
                        class="btn-approve-detail" 
                        @click="openStatusConfirmation(req, 'approved')"
                      >
                        ✅ Approve
                      </button>
                      <button 
                        v-if="req.status === 'pending'"
                        class="btn-reject-detail" 
                        @click="openStatusConfirmation(req, 'rejected')"
                      >
                        🚫 Reject
                      </button>
                      <button 
                        v-if="req.status === 'approved'"
                        class="btn-finalize-detail" 
                        @click="openStatusConfirmation(req, 'finalized')"
                      >
                        📋 Finalize
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
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
        <option :value="50">50 per page</option>
      </select>
    </div>

    <!-- ==================== CREATE/EDIT MODAL ==================== -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container request-modal">
        <div class="modal-header">
          <h3>{{ editingRequest ? '✏️ Edit Request' : '➕ New Item Request' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveRequest" class="request-form">
            <!-- Store Selection -->
            <div class="form-row">
              <div class="form-group">
                <label>Asking Store (Source) *</label>
                <select v-model="form.askingStoreId" required>
                  <option value="">Select Store</option>
                  <option v-for="store in activeStores" :key="store.storeId || store.id" :value="store.storeId || store.id">
                    {{ store.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Supplying Store (Target) *</label>
                <select v-model="form.supplyingStoreId" required>
                  <option value="">Select Store</option>
                  <option v-for="store in filteredSupplyingStores" :key="store.storeId || store.id" :value="store.storeId || store.id">
                    {{ store.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Items Section -->
            <div class="form-section-title">
              <span>📦 Items</span>
              <button type="button" class="btn-add-item" @click="addItemRow">➕ Add Item</button>
            </div>

            <div v-if="form.items.length === 0" class="no-items-message">
              <p>No items added yet. Click "Add Item" to add items to this request.</p>
            </div>

            <div v-for="(item, index) in form.items" :key="index" class="item-row">
              <div class="item-row-header">
                <span class="item-number">Item #{{ index + 1 }}</span>
                <button type="button" class="btn-remove-item" @click="removeItemRow(index)" v-if="form.items.length > 1">
                  ✕ Remove
                </button>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Item *</label>
                  <select v-model="item.itemId" required @change="updateItemDetails(index)">
                    <option value="">Select Item</option>
                    <option v-for="itemOption in items" :key="itemOption.itemId || itemOption.id" :value="itemOption.itemId || itemOption.id">
                      {{ itemOption.name }} - {{ itemOption.standardName || 'N/A' }} ({{ itemOption.code }})
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>UOM</label>
                  <input :value="getItemUOM(Number(item.itemId))" type="text" readonly />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Quantity *</label>
                  <input 
                    v-model.number="item.quantity" 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    required 
                    placeholder="Enter quantity"
                  />
                </div>
                <div class="form-group">
                  <label>Standard Name</label>
                  <input :value="getItemStandardName(Number(item.itemId))" type="text" readonly />
                </div>
              </div>
              <div class="form-row full-width">
                <div class="form-group">
                  <label>Item Remark</label>
                  <textarea 
                    v-model="item.remark" 
                    rows="2" 
                    placeholder="Add remark for this item..."
                    class="textarea-field"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Request Details -->
            <div class="form-section-title">📋 Request Details</div>
            <div class="form-row">
              <div class="form-group">
                <label>Requested By</label>
                <input 
                  v-model="form.requestedBy" 
                  type="text" 
                  readonly 
                  class="readonly-field"
                />
                <span class="hint">Auto-filled with current user</span>
              </div>
              <div class="form-group">
                <label>Requested Date *</label>
                <input 
                  v-model="form.requestedDate" 
                  type="date" 
                  required 
                />
              </div>
            </div>

            <!-- Status - Hidden when editing, visible when creating -->
            <div class="form-row" v-if="!editingRequest">
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div class="form-group">
                <!-- Empty for alignment -->
              </div>
            </div>

            <!-- Show status info when editing -->
            <div class="form-row" v-if="editingRequest">
              <div class="form-group">
                <label>Status</label>
                <input 
                  value="Pending (Reset on Edit)" 
                  type="text" 
                  readonly 
                  class="status-info-field"
                />
                <span class="hint">Status is always reset to Pending when editing</span>
              </div>
              <div class="form-group">
                <!-- Empty for alignment -->
              </div>
            </div>

            <div class="form-row full-width">
              <div class="form-group">
                <label>General Remark</label>
                <textarea 
                  v-model="form.remark" 
                  rows="3" 
                  placeholder="General notes or remarks..."
                  class="textarea-field"
                ></textarea>
                <span class="hint">This remark applies to the entire request</span>
              </div>
            </div>

            <!-- Summary -->
            <div class="form-summary" v-if="form.items.length > 0">
              <div class="summary-item">
                <span>Total Items:</span>
                <strong>{{ form.items.length }}</strong>
              </div>
            </div>

            <div v-if="formErrors.length > 0" class="form-errors">
              <div v-for="error in formErrors" :key="error" class="form-error">
                ⚠️ {{ error }}
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button 
            class="btn-primary" 
            @click="saveRequest" 
            :disabled="saving || !isFormValid"
          >
            {{ saving ? 'Saving...' : (editingRequest ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== STATUS CONFIRMATION MODAL ==================== -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal-container status-modal">
        <div class="modal-header">
          <h3>⚠️ Confirm Status Change</h3>
          <button class="modal-close" @click="closeStatusModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">🔄</div>
          <p class="confirmation-title">Are you sure you want to change the status?</p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Request:</span>
              <span class="detail-value">{{ statusTarget?.requestCode || statusTarget?.id || statusTarget?.requestId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value">{{ statusTarget?.items?.length || 0 }} item(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current Status:</span>
              <span :class="['status-badge', statusTarget?.status]">
                {{ statusTarget?.status }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">New Status:</span>
              <span :class="['status-badge', statusAction]">
                {{ statusAction }}
              </span>
            </div>
          </div>
          <p class="warning-text">⚠️ This action will change the request status to <strong>{{ statusAction }}</strong>.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStatusModal">Cancel</button>
          <button class="btn-primary" @click="confirmStatusChange">
            Confirm {{ statusAction }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Requests</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full Report (All Fields)
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" /> Summary (Items, Stores, Status)
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import itemRequestService from '@/stores/itemRequestService'
import type { ItemRequest, RequestItem, Store, Item } from '@/stores/itemRequestService'

// ================================================================
// STATE
// ================================================================

const router = useRouter()
const authStore = useAuthStore()

// Data
const stores = ref<Store[]>([])
const items = ref<Item[]>([])
const requests = ref<ItemRequest[]>([])
const loading = ref(false)
const loadingStores = ref(false)
const loadingItems = ref(false)

// Filters & Search
const searchQuery = ref('')
const filterStatus = ref('all')
const filterStore = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// Expand
const expandedRow = ref<number | null>(null)

// Modal states
const showModal = ref(false)
const editingRequest = ref<ItemRequest | null>(null)
const saving = ref(false)
const showExportModal = ref(false)
const exporting = ref(false)
const exportType = ref<'full' | 'summary'>('full')

// Status Confirmation Modal
const showStatusModal = ref(false)
const statusTarget = ref<ItemRequest | null>(null)
const statusAction = ref<'approved' | 'rejected' | 'finalized'>('approved')

// Form
const form = ref({
  askingStoreId: '',
  supplyingStoreId: '',
  items: [] as RequestItem[],
  requestedBy: '',
  requestedDate: '',
  status: 'pending' as 'pending' | 'approved' | 'rejected',
  remark: '',
})

const formErrors = ref<string[]>([])

// Toast
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('success')

// ================================================================
// COMPUTED
// ================================================================

const activeStores = computed(() => {
  return stores.value.filter(store => store.status === 'Active')
})

const filteredSupplyingStores = computed(() => {
  let result = activeStores.value
  if (form.value.askingStoreId) {
    result = result.filter(store => (store.storeId || store.id) !== Number(form.value.askingStoreId))
  }
  return result
})

const isFormValid = computed(() => {
  return !!(
    form.value.askingStoreId &&
    form.value.supplyingStoreId &&
    form.value.items.length > 0 &&
    form.value.items.every(item => item.itemId && item.quantity > 0) &&
    form.value.requestedBy &&
    form.value.requestedDate
  )
})

const hasActiveFilters = computed(() => {
  return filterStatus.value !== 'all' || 
         filterStore.value !== 'all' || 
         searchQuery.value
})

// API handles filtering and pagination, so we just use requests directly
const paginatedRequests = computed(() => {
  return requests.value
})

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value) || 1
})

// ================================================================
// METHODS
// ================================================================

// -- Load Data --
const loadStores = async () => {
  loadingStores.value = true
  try {
    const response = await itemRequestService.getActiveStores()
    if (response.success) {
      stores.value = response.data
    } else {
      showToastMessage(response.error || 'Failed to load stores', 'error')
    }
  } catch (error) {
    console.error('Load stores error:', error)
    showToastMessage('Failed to load stores', 'error')
  } finally {
    loadingStores.value = false
  }
}

const loadItems = async () => {
  loadingItems.value = true
  try {
    const response = await itemRequestService.getActiveItems()
    if (response.success) {
      items.value = response.data
    } else {
      showToastMessage(response.error || 'Failed to load items', 'error')
    }
  } catch (error) {
    console.error('Load items error:', error)
    showToastMessage('Failed to load items', 'error')
  } finally {
    loadingItems.value = false
  }
}

const loadRequests = async () => {
  loading.value = true
  try {
    const response = await itemRequestService.getRequests({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value === 'all' ? undefined : filterStatus.value as any,
      storeId: filterStore.value === 'all' ? undefined : Number(filterStore.value)
    })
    
    if (response.success) {
      requests.value = response.data.requests
      totalItems.value = response.data.pagination.total
    } else {
      showToastMessage(response.error || 'Failed to load requests', 'error')
    }
  } catch (error: any) {
    console.error('Load requests error:', error)
    showToastMessage('Failed to load requests', 'error')
  } finally {
    loading.value = false
  }
}

// -- Helper Methods --
const getStoreName = (storeId: number): string => {
  const store = stores.value.find(s => (s.storeId || s.id) === storeId)
  return store ? store.name : 'Unknown Store'
}

const getStoreCode = (storeId: number): string => {
  const store = stores.value.find(s => (s.storeId || s.id) === storeId)
  return store ? store.code : 'N/A'
}

const getItemName = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item ? item.name : 'Unknown Item'
}

const getItemCode = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item ? item.code : 'N/A'
}

const getItemBrand = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.brand || ''
}

const getItemModel = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.model || ''
}

const getItemStandardName = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.standardName || ''
}

const getItemUOM = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  if (item?.uom) {
    if (typeof item.uom === 'string') return item.uom
    if (typeof item.uom === 'object' && item.uom.code) return item.uom.code
  }
  return ''
}

const getItemSpecification = (itemId: number): string => {
  const item = items.value.find(i => (i.itemId || i.id) === itemId)
  return item?.specText || ''
}

const getItemNames = (items: RequestItem[] | undefined): string => {
  if (!items || items.length === 0) return ''
  const names = items.map(i => getItemName(Number(i.itemId)))
  return names.join(', ')
}

const getRequesterName = (req: ItemRequest): string => {
  if (req.requestedByUser) {
    return req.requestedByUser.fullName || 
           req.requestedByUser.full_name || 
           req.requestedByUser.username || 
           'N/A'
  }
  return req.requestedBy || 'N/A'
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCurrentUser = (): string => {
  return authStore.user?.fullName || 
         authStore.user?.username || 
         authStore.user?.email || 
         'Unknown User'
}

const getCurrentUserId = (): number | undefined => {
  return authStore.user?.userId
}

// -- Item Row Management --
const addItemRow = (): void => {
  form.value.items.push({
    itemId: 0,
    quantity: 1,
    remark: ''
  })
}

const removeItemRow = (index: number): void => {
  form.value.items.splice(index, 1)
}

const updateItemDetails = (_index: number): void => {
  // Auto-update UOM and standard name when item is selected
}

// -- Expand --
const toggleExpand = (id?: number): void => {
  if (id === undefined || id === null) {
    expandedRow.value = null
    return
  }
  expandedRow.value = expandedRow.value === id ? null : id
}

// -- Modal Methods --
const openCreateModal = (): void => {
  editingRequest.value = null
  const today: string = new Date().toISOString().split('T')[0]
  form.value = {
    askingStoreId: '',
    supplyingStoreId: '',
    items: [{ itemId: 0, quantity: 1, remark: '' }],
    requestedBy: getCurrentUser(),
    requestedDate: today,
    status: 'pending',
    remark: '',
  }
  formErrors.value = []
  showModal.value = true
}

const editRequest = (req: ItemRequest): void => {
  editingRequest.value = req
  const today: string = new Date().toISOString().split('T')[0]
  const requestedDate: string = req.requestedDate ?? today
  form.value = {
    askingStoreId: String(req.askingStoreId),
    supplyingStoreId: String(req.supplyingStoreId),
    items: req.items
      ? req.items.map(item => ({ ...item, itemId: Number((item as any).itemId || 0) }))
      : [{ itemId: 0, quantity: 1, remark: '' }],
    requestedBy: getRequesterName(req),
    requestedDate,
    status: 'pending',
    remark: req.remark || '',
  }
  formErrors.value = []
  showModal.value = true
}

const closeModal = (): void => {
  showModal.value = false
  editingRequest.value = null
}

// -- Save Request --
const saveRequest = async (): Promise<void> => {
  formErrors.value = []

  if (!form.value.askingStoreId) {
    formErrors.value.push('Please select the asking store')
  }
  if (!form.value.supplyingStoreId) {
    formErrors.value.push('Please select the supplying store')
  }
  if (form.value.askingStoreId === form.value.supplyingStoreId) {
    formErrors.value.push('Asking store and supplying store cannot be the same')
  }
  if (form.value.items.length === 0) {
    formErrors.value.push('Please add at least one item')
  }
  
  form.value.items.forEach((item, index) => {
    if (!item.itemId) {
      formErrors.value.push(`Item #${index + 1}: Please select an item`)
    }
    if (!item.quantity || item.quantity <= 0) {
      formErrors.value.push(`Item #${index + 1}: Please enter a valid quantity`)
    }
  })
  
  if (!form.value.requestedDate) {
    formErrors.value.push('Please select a requested date')
  }

  if (formErrors.value.length > 0) {
    return
  }

  saving.value = true
  try {
    const userId = getCurrentUserId()
    const requestData = {
      askingStoreId: Number(form.value.askingStoreId),
      supplyingStoreId: Number(form.value.supplyingStoreId),
      items: form.value.items.map(item => ({
        itemId: Number(item.itemId),
        quantity: item.quantity,
        remark: item.remark || ''
      })),
      requestedById: userId,
      requestedDate: form.value.requestedDate,
      status: form.value.status as 'pending' | 'approved' | 'rejected',
      remark: form.value.remark,
    }

    let response
    if (editingRequest.value) {
      const requestId = editingRequest.value.requestId || editingRequest.value.id
      response = await itemRequestService.updateRequest(requestId!, requestData)
      if (response.success) {
        showToastMessage('Request updated successfully! Status reset to Pending', 'success')
      } else {
        showToastMessage(response.error || 'Failed to update request', 'error')
        return
      }
    } else {
      response = await itemRequestService.createRequest(requestData)
      if (response.success) {
        showToastMessage('Request created successfully!', 'success')
      } else {
        showToastMessage(response.error || 'Failed to create request', 'error')
        return
      }
    }

    currentPage.value = 1
    await loadRequests()
    closeModal()
  } catch (error: any) {
    showToastMessage(error.message || 'Failed to save request', 'error')
  } finally {
    saving.value = false
  }
}

// -- Status Confirmation --
const openStatusConfirmation = (req: ItemRequest, action: 'approved' | 'rejected' | 'finalized'): void => {
  statusTarget.value = req
  statusAction.value = action
  showStatusModal.value = true
}

const closeStatusModal = (): void => {
  showStatusModal.value = false
  statusTarget.value = null
  statusAction.value = 'approved'
}

const confirmStatusChange = async (): Promise<void> => {
  if (!statusTarget.value) return
  
  const req = statusTarget.value
  const action = statusAction.value
  const requestId = req.requestId || req.id
  
  try {
    const response = await itemRequestService.updateStatus(requestId!, action)
    if (response.success) {
      showToastMessage(`Request ${action} successfully!`, 'success')
      await loadRequests()
    } else {
      showToastMessage(response.error || `Failed to ${action} request`, 'error')
    }
    closeStatusModal()
  } catch (error: any) {
    showToastMessage(error.message || `Failed to ${action} request`, 'error')
  }
}

// -- Print Request --
const printRequest = (req: ItemRequest): void => {
  const requestId = req.requestId || req.id
  router.push({
    name: 'print-requests',
    query: { id: String(requestId) }
  })
}

// -- Filters --
const onSearchChange = (): void => {
  currentPage.value = 1
  loadRequests()
}

const onFilterChange = (): void => {
  currentPage.value = 1
  loadRequests()
}

const clearFilters = (): void => {
  filterStatus.value = 'all'
  filterStore.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
  showToastMessage('Filters cleared', 'info')
  loadRequests()
}

// -- Pagination --
const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const changePageSize = (): void => {
  currentPage.value = 1
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
    const response = await itemRequestService.exportRequests({
      status: filterStatus.value === 'all' ? undefined : filterStatus.value as any,
      storeId: filterStore.value === 'all' ? undefined : Number(filterStore.value)
    })
    
    if (response.success && response.data.length > 0) {
      const firstRow = response.data[0] as Record<string, any>
      const headers = Object.keys(firstRow)
      const rows = response.data.map((item: any) => headers.map((key: string) => item[key] ?? ''))
      const csv = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n')
      
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `item_requests_${new Date().toISOString().split('T')[0]}.csv`
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
const showToastMessage = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'success'): void => {
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

// Watch for filter changes
watch([filterStatus, filterStore, searchQuery], () => {
  currentPage.value = 1
  loadRequests()
})

// Watch for page changes
watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    loadRequests()
  }
})

// Watch for page size changes
watch(pageSize, () => {
  currentPage.value = 1
  loadRequests()
})

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  await Promise.all([
    loadStores(),
    loadItems(),
    loadRequests()
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
  width: 220px;
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
   TABLE WRAPPER
   ================================================================ */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
}

/* ================================================================
   TABLE
   ================================================================ */
.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 900px;
}

.requests-table th,
.requests-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.requests-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Column widths */
.col-expand { width: 30px; }
.col-code { min-width: 100px; }
.col-items { min-width: 150px; }
.col-store { min-width: 120px; }
.col-arrow { width: 30px; text-align: center; }
.col-status { min-width: 90px; }
.col-actions { min-width: 200px; }

.text-center {
  text-align: center;
}

.code-cell {
  font-weight: 600;
  color: #0f172a;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.items-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-count {
  font-weight: 500;
  color: #1e293b;
}

.item-names {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.store-name {
  font-weight: 500;
  color: #1e293b;
}

.arrow-cell {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 0 4px;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.finalized {
  background: #dcfce7;
  color: #166534;
}

/* ================================================================
   EXPAND ROW
   ================================================================ */
.expanded-row {
  background: #f8fafc;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: #e0e7ff;
}

/* ================================================================
   ACTION BUTTONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-wrap: wrap;
}

.icon-btn {
  background: transparent;
  border: none;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.icon-btn:active {
  transform: scale(0.95);
}

.print-btn {
  color: #8b5cf6;
}

.print-btn:hover {
  background: #ede9fe;
  color: #7c3aed;
}

/* ================================================================
   EXPAND DETAILS
   ================================================================ */
.detail-expand-row td {
  padding: 0 !important;
}

.expand-details {
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
}

.detail-card.full-width {
  grid-column: 1 / -1;
}

.detail-card h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
  color: #1e293b;
}

.detail-card > div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}

.detail-card > div:last-child {
  border-bottom: none;
}

.detail-card .value {
  font-weight: 500;
  color: #1e293b;
}

/* Items Detail Table */
.items-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.items-detail-table th {
  background: #e2e8f0;
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
}

.items-detail-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.items-detail-table .total-row {
  background: #f8fafc;
  font-weight: 500;
}

.items-detail-table .no-items {
  padding: 20px;
  color: #94a3b8;
}

.spec-cell {
  font-size: 11px;
  color: #475569;
  max-width: 200px;
  white-space: normal;
  word-wrap: break-word;
}

.remark-content {
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #1e293b;
  min-height: 40px;
}

.no-remark {
  color: #94a3b8;
  font-style: italic;
  padding: 8px 12px;
}

/* Detail Actions */
.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.btn-print-detail {
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

.btn-print-detail:hover {
  background: #7c3aed;
}

.btn-edit-detail {
  background: #3b82f6;
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

.btn-edit-detail:hover {
  background: #2563eb;
}

.btn-approve-detail {
  background: #22c55e;
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

.btn-approve-detail:hover {
  background: #16a34a;
}

.btn-reject-detail {
  background: #ef4444;
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

.btn-reject-detail:hover {
  background: #dc2626;
}

.btn-finalize-detail {
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

.btn-finalize-detail:hover {
  background: #7c3aed;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 60px 20px;
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

.empty-state p {
  color: #94a3b8;
  font-size: 16px;
  margin: 0;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1e293b;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #475569;
}

.limit-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

/* ================================================================
   MODALS
   ================================================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  line-height: 1;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

/* ================================================================
   REQUEST FORM
   ================================================================ */
.request-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  padding: 8px 0;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-add-item {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #2563eb;
}

.item-row {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.item-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-number {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
}

.btn-remove-item {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-remove-item:hover {
  background: #fecaca;
}

.no-items-message {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row.full-width {
  grid-template-columns: 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  background: white;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:read-only,
.form-group textarea:read-only {
  background: #f8fafc;
  color: #64748b;
}

.readonly-field {
  background: #f8fafc !important;
  color: #475569 !important;
  cursor: not-allowed;
}

.status-info-field {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border: 1px solid #bbf7d0 !important;
  font-weight: 500;
  cursor: not-allowed;
}

.hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.textarea-field {
  resize: vertical;
  min-height: 60px;
}

.form-summary {
  display: flex;
  gap: 30px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.summary-item span {
  color: #475569;
}

.summary-item strong {
  color: #1e293b;
}

.form-errors {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fecaca;
}

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   STATUS CONFIRMATION MODAL
   ================================================================ */
.status-modal {
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
  gap: 10px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.export-option input[type="radio"] {
  accent-color: #3b82f6;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  max-width: 400px;
}

@keyframes slideInRight {
  from { 
    transform: translateX(100%);
    opacity: 0;
  }
  to { 
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.toast.success {
  background: #22c55e;
}

.toast.error {
  background: #ef4444;
}

.toast.info {
  background: #3b82f6;
}

.toast.warning {
  background: #f59e0b;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1024px) {
  .requests-table {
    min-width: 800px;
  }
}

@media (max-width: 768px) {
  .section-card {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title {
    justify-content: space-between;
    width: 100%;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .search-box {
    width: 100%;
  }

  .search-box input {
    width: 100%;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    margin-left: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-row-two-cols {
    grid-template-columns: 1fr;
  }

  .modal-container {
    width: 98%;
    max-height: 95vh;
  }

  .modal-body {
    padding: 16px;
  }

  .requests-table {
    font-size: 11px;
    min-width: 700px;
  }

  .requests-table th,
  .requests-table td {
    padding: 6px 8px;
  }

  .pagination {
    gap: 8px;
  }

  .page-btn {
    padding: 4px 12px;
    font-size: 12px;
  }

  .toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    font-size: 13px;
    padding: 10px 16px;
  }

  .detail-actions {
    flex-direction: column;
  }
  
  .detail-actions button {
    width: 100%;
    justify-content: center;
  }

  .item-row {
    padding: 10px;
  }

  .form-summary {
    flex-direction: column;
    gap: 8px;
  }

  .col-actions {
    min-width: 180px;
  }
}

@media (max-width: 480px) {
  .requests-table {
    min-width: 600px;
  }

  .requests-table th,
  .requests-table td {
    padding: 4px 6px;
    font-size: 10px;
  }

  .status-badge {
    padding: 2px 8px;
    font-size: 9px;
  }

  .icon-btn {
    padding: 3px 4px;
    font-size: 11px;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .col-code { min-width: 80px; }
  .col-items { min-width: 100px; }
  .col-store { min-width: 80px; }
  .col-actions { min-width: 160px; }
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-add,
  .btn-export,
  .btn-clear-filters,
  .icon-btn,
  .pagination,
  .filter-bar,
  .header-actions .search-box,
  .expand-btn,
  .detail-actions {
    display: none !important;
  }

  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }

  .requests-table {
    font-size: 9px !important;
    min-width: auto !important;
  }

  .requests-table th {
    background: #e2e8f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge.pending { background: #fef3c7 !important; }
  .status-badge.approved { background: #dbeafe !important; }
  .status-badge.rejected { background: #fee2e2 !important; }
  .status-badge.finalized { background: #dcfce7 !important; }

  .modal-overlay {
    display: none !important;
  }

  .toast {
    display: none !important;
  }

  .expand-details {
    border: none !important;
    padding: 4px 0 !important;
    margin: 0 !important;
  }
  
  .detail-expand-row td {
    padding: 0 !important;
  }
}
</style>