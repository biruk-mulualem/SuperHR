<!-- views/storemanagement/item-status/ItemStatusRecordPage.vue -->
<template>
  <div class="page">
    <!-- ==================== DETAIL PAGE VIEW ==================== -->
    <template v-if="viewMode === 'detail' && detailTarget">
      <div class="detail-page-header">
        <button class="btn-back" @click="closeDetailPage">
          ← Back to Rules
        </button>
      </div>

      <header class="page-header">
        <div class="header-main">
          <div class="detail-title-row">
            <span class="detail-code">{{ detailTarget.itemCode }}</span>
            <h1>{{ detailTarget.itemName }}</h1>
          </div>
          <p class="header-sub">
            Rule details and take history for
            <strong>{{ detailTarget.storeName || getStoreName(detailTarget.storeId) }}</strong>
          </p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="openEditModal(detailTarget)">
            ✏️ Edit Rule
          </button>
        </div>
      </header>

      <div class="detail-cards">
        <div class="detail-card">
          <span class="detail-card-label">Current Status</span>
          <span :class="['status-pill', getComputedStatus(detailTarget).class]">
            {{ getComputedStatus(detailTarget).label }}
          </span>
        </div>
        <div class="detail-card">
          <span class="detail-card-label">{{ detailTarget.storeType === 'department' ? 'Department' : 'Store' }}</span>
          <strong>
            <span :class="['type-tag', detailTarget.storeType]">
              {{ detailTarget.storeType === 'department' ? '🏛️' : '🏪' }}
            </span>
            {{ detailTarget.storeName || getStoreName(detailTarget.storeId) }}
          </strong>
        </div>
        <div class="detail-card">
          <span class="detail-card-label">Rule</span>
          <strong>{{ detailTarget.maxQuantity }} {{ detailTarget.uomCode }} every {{ detailTarget.frequencyDays }} days</strong>
        </div>
        <div class="detail-card">
          <span class="detail-card-label">Next Allowed Date</span>
          <strong :style="{ color: isBlocked(detailTarget) ? '#dc2626' : '#16a34a' }">
            {{ isBlocked(detailTarget) ? getNextAllowedDate(detailTarget) : 'Available Now' }}
          </strong>
        </div>
      </div>

      <div v-if="detailTarget.reason" class="detail-reason-card">
        <span class="detail-card-label">Reason / Note</span>
        <p>{{ detailTarget.reason }}</p>
      </div>

      <section class="panel">
        <header class="panel-header">
          <div>
            <h2>⏱️ Take History</h2>
            <p>All recorded takes for this item in this {{ detailTarget.storeType === 'department' ? 'department' : 'store' }}.</p>
          </div>
          <span class="panel-count">{{ detailTarget.history ? detailTarget.history.length : 0 }}</span>
        </header>

        <div v-if="!detailTarget.history || detailTarget.history.length === 0" class="empty">
          <div class="empty-icon">📭</div>
          <div class="empty-text">No history records found for this rule.</div>
        </div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th class="text-right">Quantity</th>
                <th>Request Code</th>
                <th>Status</th>
                <th>Taken By</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(h, idx) in detailTarget.history" :key="idx">
                <td>{{ formatDateTime(h.date) }}</td>
                <td class="text-right font-bold">{{ h.quantity }} {{ detailTarget.uomCode }}</td>
                <td class="font-mono">{{ h.requestCode || '—' }}</td>
                <td>
                  <span :class="['status-badge', h.status]">{{ h.status }}</span>
                </td>
                <td>{{ h.takenBy || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- ==================== LIST VIEW ==================== -->
    <template v-else>
      <header class="page-header">
        <div class="header-main">
          <h1>Item Status Records</h1>
          <p class="header-sub">
            Set permanent limits (e.g., max 5 drums every 7 days) and track when the store or department can take the next batch.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" @click="fetchRecords" :disabled="loading">
            <span v-if="!loading">↻ Refresh</span>
            <span v-else>Loading…</span>
          </button>
          <button class="btn-add" @click="openCreateModal">
            ➕ Add Rule
          </button>
        </div>
      </header>

      <div class="summary-strip">
        <div class="summary-item">
          <span class="summary-value accent-blue">{{ pagination.total }}</span>
          <span class="summary-label">Total Rules</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value accent-green">{{ pageAvailableCount }}</span>
          <span class="summary-label">Ready to Take (this page)</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-value accent-amber">{{ pageBlockedCount }}</span>
          <span class="summary-label">Blocked (this page)</span>
        </div>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="field search-field">
            <label>Search</label>
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by item, store, or reason…"
                class="search-input"
              />
              <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" title="Clear search">✕</button>
            </div>
          </div>

          <div class="field">
            <label>Store</label>
            <select v-model="filterStore">
              <option value="all">All Stores</option>
              <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div class="field">
            <label>Status</label>
            <select v-model="filterStatus">
              <option value="all">All Statuses</option>
              <option value="available">🟢 Ready to Take</option>
              <option value="blocked">🔒 Limit Reached</option>
            </select>
          </div>

          <button v-if="hasActiveFilters" class="btn-clear" @click="clearFilters">
            Clear all
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading rules…</p>
      </div>

      <section v-else class="panel">
        <header class="panel-header">
          <div>
            <h2>Active Rules</h2>
            <p>Frequency-based limits applied to stores and departments.</p>
          </div>
          <span class="panel-count">{{ pagination.total }}</span>
        </header>

        <div v-if="records.length === 0" class="empty">
          <div class="empty-icon">🗓️</div>
          <div class="empty-text">
            <template v-if="hasActiveFilters">No records match your filters</template>
            <template v-else>No item status rules have been created yet</template>
          </div>
        </div>

        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Target</th>
                <th>Item</th>
                <th>Rule</th>
                <th>Last Taken</th>
                <th>Next Allowed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.id">
                <td>
                  <span :class="['status-pill', getComputedStatus(r).class]">
                    {{ getComputedStatus(r).label }}
                  </span>
                </td>
                <td>
                  <div class="target-cell">
                    <span :class="['type-tag', r.storeType]">
                      {{ r.storeType === 'department' ? '🏛️ Department' : '🏪 Store' }}
                    </span>
                    <span class="font-bold">
                      {{ r.storeName || getStoreName(r.storeId) }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="item-cell">
                    <span class="item-code">{{ r.itemCode }}</span>
                    <span class="item-name">{{ r.itemName }}</span>
                  </div>
                </td>
                <td>
                  <div class="rule-cell">
                    <strong>{{ r.maxQuantity }} {{ r.uomCode }}</strong>
                    every <strong>{{ r.frequencyDays }} days</strong>
                  </div>
                </td>
                <td>
                  <div v-if="r.lastTaken" class="last-taken-cell">
                    <span class="last-taken-date">{{ formatDateTime(r.lastTaken.date) }}</span>
                    <span class="last-taken-qty">{{ r.lastTaken.quantity }} {{ r.uomCode }}</span>
                  </div>
                  <span v-else class="text-muted">Never</span>
                </td>
                <td>
                  <span v-if="!isBlocked(r)" class="next-allowed-now">Now</span>
                  <span v-else class="next-allowed-future">
                    {{ getNextAllowedDate(r) }}
                  </span>
                </td>
                <td>
                  <div class="row-actions">
                    <button class="btn-icon view" @click="openDetailPage(r)" title="View Details">👁️</button>
                    <button class="btn-icon" @click="openEditModal(r)" title="Edit">✏️</button>
                    <button class="btn-icon delete" @click="openDeleteModal(r)" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total > 0" class="pagination">
          <div class="pagination-info">
            Showing
            <strong>{{ (pagination.page - 1) * pagination.limit + 1 }}</strong>
            –
            <strong>{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</strong>
            of <strong>{{ pagination.total }}</strong>
            {{ pagination.total === 1 ? 'rule' : 'rules' }}
          </div>

          <div class="pagination-controls">
            <label class="page-size">
              Per page:
              <select v-model.number="pageSize" @change="onPageSizeChange">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>

            <button
              class="page-btn"
              :disabled="pagination.page <= 1 || loading"
              @click="goToPage(pagination.page - 1)"
            >← Prev</button>

            <span class="page-indicator">
              Page <strong>{{ pagination.page }}</strong>
              of <strong>{{ pagination.pages || 1 }}</strong>
            </span>

            <button
              class="page-btn"
              :disabled="pagination.page >= pagination.pages || loading"
              @click="goToPage(pagination.page + 1)"
            >Next →</button>
          </div>
        </div>
      </section>
    </template>

    <!-- ==================== CREATE / EDIT MODAL ==================== -->
    <transition name="modal-fade">
      <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
        <div class="modal-container form-modal">
          <div class="modal-header">
            <h3>{{ isEditing ? '✏️ Edit Rule' : '➕ Add Rule' }}</h3>
            <button class="modal-close" @click="closeFormModal">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">

              <!-- Store OR Department (combined select) -->
              <div class="form-group">
                <label>Store or Department</label>
                <select v-model="form.target" class="form-input">
                  <option value="" disabled>— Select a store or department —</option>
                  <optgroup label="🏪 Stores">
                    <option
                      v-for="s in stores"
                      :key="`store-${s.id}`"
                      :value="`store:${s.id}`"
                    >
                      {{ s.name }} ({{ s.code }})
                    </option>
                  </optgroup>
                  <optgroup label="🏛️ Departments">
                    <option
                      v-for="d in departments"
                      :key="`dept-${d.departmentId}`"
                      :value="`department:${d.departmentId}`"
                    >
                      {{ d.name }} ({{ d.code }})
                    </option>
                  </optgroup>
                </select>
                <span class="field-hint">
                  Pick either a warehouse (store) or an approval group (department).
                </span>
              </div>

              <!-- Item search -->
              <div class="form-group item-search-group">
                <label>Item</label>

                <div v-if="selectedItem" class="item-picked">
                  <span class="item-code">{{ selectedItem.code }}</span>
                  <span class="item-name">{{ selectedItem.name }}</span>
                  <span v-if="selectedItem.uomCode" class="item-picked-uom">{{ selectedItem.uomCode }}</span>
                  <button
                    type="button"
                    class="item-picked-clear"
                    @click="clearItemSelection"
                    title="Clear"
                  >✕</button>
                </div>

                <div v-else class="item-search-wrap" ref="itemSearchWrapRef">
                  <input
                    ref="itemSearchInputRef"
                    v-model="itemSearchQuery"
                    type="text"
                    class="form-input"
                    placeholder="Type an item name or code…"
                    autocomplete="off"
                    @focus="itemSearchOpen = true"
                    @input="onItemSearchInput"
                    @keydown.esc="closeItemSearch"
                    @keydown.enter.prevent="onItemSearchEnter"
                  />
                  <div
                    v-if="itemSearchOpen && (itemSearchResults.length > 0 || itemSearchQuery.trim())"
                    class="item-search-dropdown"
                  >
                    <div v-if="itemSearchResults.length === 0" class="item-search-empty">
                      No items match "{{ itemSearchQuery }}"
                    </div>
                    <div
                      v-for="i in itemSearchResults"
                      :key="i.itemId"
                      class="item-search-option"
                      @mousedown.prevent="pickItem(i)"
                    >
                      <span class="item-option-code">{{ i.code }}</span>
                      <span class="item-option-name">{{ i.name }}</span>
                      <span v-if="i.uomCode" class="item-option-uom">{{ i.uomCode }}</span>
                    </div>
                  </div>
                </div>

                <span class="field-hint">
                  Search by code or name. Only Active items are shown.
                </span>
              </div>

              <div class="form-group">
                <label>Maximum Quantity Allowed</label>
                <input type="number" v-model.number="form.maxQuantity" min="0.01" step="0.01" class="form-input" placeholder="e.g. 5" />
              </div>

              <div class="form-group">
                <label>Every X Days (Frequency)</label>
                <input type="number" v-model.number="form.frequencyDays" min="1" step="1" class="form-input" placeholder="e.g. 7" />
                <span class="field-hint">They can take this amount once every X days, indefinitely.</span>
              </div>

              <div class="form-group full-width">
                <label>Reason / Note</label>
                <textarea v-model="form.reason" class="form-input" rows="2" placeholder="e.g., Store policy, Monthly quota..."></textarea>
              </div>

            </div>

            <div v-if="formError" class="form-error">
              ⚠️ {{ formError }}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="closeFormModal">Cancel</button>
            <button class="btn-primary" @click="saveRecord" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save Rule' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== DELETE CONFIRM MODAL ==================== -->
    <transition name="modal-fade">
      <div v-if="showDeleteModal && deleteTarget" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-container delete-modal">
          <div class="modal-header">
            <h3>🗑️ Delete Rule</h3>
            <button class="modal-close" @click="closeDeleteModal">✕</button>
          </div>
          <div class="modal-body text-center">
            <div class="delete-icon">⚠️</div>
            <p>
              Are you sure you want to delete the limit for
              <strong>{{ deleteTarget.itemName }}</strong>
              in <strong>{{ deleteTarget.storeName || getStoreName(deleteTarget.storeId) }}</strong>?
            </p>
            <p class="text-muted" style="margin-top: 8px; font-size: 12px;">
              This will allow the {{ deleteTarget.storeType === 'department' ? 'department' : 'store' }} to request the item freely again.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
            <button class="btn-danger" @click="confirmDelete" :disabled="deleting">
              {{ deleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== TOAST ==================== -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import itemStatusService from '@/stores/itemStatusService'
import storeService from '@/stores/storeService'
import itemService from '@/stores/itemService'
import userService from '@/stores/users'

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const records = ref([])
const stores = ref([])
const departments = ref([])

const searchQuery = ref('')
const filterStore = ref('all')
const filterStatus = ref('all')

// Pagination
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  pages: 0,
})
const pageSize = ref(20)

const viewMode = ref('list')
const detailTarget = ref(null)
const detailLoading = ref(false)

const showFormModal = ref(false)
const isEditing = ref(false)
const formError = ref('')

const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const form = ref({
  id: null,
  target: '',       // 'store:1' or 'department:2'
  itemId: '',
  maxQuantity: 1,
  frequencyDays: 7,
  reason: ''
})

// Item search state
const itemSearchQuery = ref('')
const itemSearchOpen = ref(false)
const itemSearchInputRef = ref(null)
const itemSearchWrapRef = ref(null)
const allItems = ref([])
const selectedItem = ref(null)

// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() =>
  searchQuery.value !== '' ||
  filterStore.value !== 'all' ||
  filterStatus.value !== 'all'
)

const pageAvailableCount = computed(() => records.value.filter(r => !r.isBlocked).length)
const pageBlockedCount = computed(() => records.value.filter(r => r.isBlocked).length)

const itemSearchResults = computed(() => {
  const q = itemSearchQuery.value.trim().toLowerCase()
  if (!q) return []

  return allItems.value
    .filter(i =>
      (i.code && i.code.toLowerCase().includes(q)) ||
      (i.name && i.name.toLowerCase().includes(q))
    )
    .slice(0, 30)
})

// ================================================================
// HELPERS
// ================================================================
const getStoreName = (id) => {
  const s = stores.value.find(x => String(x.id) === String(id))
  return s ? s.name : `Store #${id}`
}

const isBlocked = (record) => {
  if (typeof record?.isBlocked === 'boolean') return record.isBlocked
  return false
}

const getNextAllowedDate = (record) => {
  if (!record?.nextAllowedAt) return 'Now'
  return new Date(record.nextAllowedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getComputedStatus = (record) => {
  if (isBlocked(record)) {
    return { key: 'blocked', label: '🔒 Limit Reached', class: 'blocked', color: '#991b1b' }
  }
  return { key: 'available', label: '✅ Ready to Take', class: 'active', color: '#166534' }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  filterStore.value = 'all'
  filterStatus.value = 'all'
  pagination.value.page = 1
  // watchers will trigger fetchRecords
}

// ================================================================
// ITEM SEARCH HANDLERS
// ================================================================
const onItemSearchInput = () => {
  itemSearchOpen.value = true
}

const onItemSearchEnter = () => {
  if (itemSearchResults.value.length === 1) {
    pickItem(itemSearchResults.value[0])
  }
}

const pickItem = (item) => {
  selectedItem.value = item
  form.value.itemId = item.itemId
  itemSearchQuery.value = ''
  itemSearchOpen.value = false
}

const clearItemSelection = () => {
  selectedItem.value = null
  form.value.itemId = ''
  itemSearchQuery.value = ''
  nextTick(() => itemSearchInputRef.value?.focus())
}

const closeItemSearch = () => {
  itemSearchOpen.value = false
}

const onDocumentClick = (e) => {
  const el = itemSearchWrapRef.value
  if (!el) return
  if (!el.contains(e.target)) {
    itemSearchOpen.value = false
  }
}

// ================================================================
// DATA LOADING
// ================================================================
const loadStoresAndItems = async () => {
  // Stores
  try {
    const storesRes = await storeService.getStores({ limit: 1000, status: 'Active' })
    let rawStores = []
    if (storesRes.success && storesRes.data?.stores) {
      rawStores = storesRes.data.stores
    } else if (storesRes.success && Array.isArray(storesRes.data)) {
      rawStores = storesRes.data
    }
    stores.value = rawStores.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code || '',
    }))
  } catch (err) {
    console.error('Failed to load stores:', err)
  }

  // Departments
  try {
    const deptRes = await userService.getDepartments()
    let rawDepts = []
    if (deptRes.success && deptRes.departments) {
      rawDepts = deptRes.departments
    } else if (deptRes.success && deptRes.data) {
      rawDepts = deptRes.data
    }
    departments.value = rawDepts
      .filter(d => d.isActive !== false)
      .map((d) => ({
        departmentId: d.departmentId || d.id,
        name: d.name,
        code: d.code || '',
      }))
  } catch (err) {
    console.error('Failed to load departments:', err)
  }

  // Items
  try {
    const itemsRes = await itemService.getActiveItems()
    let rawItems = []
    if (itemsRes.success && itemsRes.data?.items) {
      rawItems = itemsRes.data.items
    } else if (itemsRes.success && Array.isArray(itemsRes.data)) {
      rawItems = itemsRes.data
    }
    allItems.value = rawItems.map((i) => ({
      itemId: i.itemId,
      code: i.code,
      name: i.standardName || i.name,
      uomCode: i.uom?.code || i.uomCode || null,
    }))
  } catch (err) {
    console.error('Failed to load items:', err)
  }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    }
    if (searchQuery.value && searchQuery.value.trim() !== '')
      params.search = searchQuery.value.trim()
    if (filterStore.value !== 'all')
      params.storeId = Number(filterStore.value)

    const res = await itemStatusService.getRules(params)
    if (res.success) {
      let list = res.data

      // Status filter (blocked / available) is client-side within the current page
      // because isBlocked is a computed field, not a stored column.
      if (filterStatus.value === 'blocked') {
        list = list.filter(r => r.isBlocked)
      } else if (filterStatus.value === 'available') {
        list = list.filter(r => !r.isBlocked)
      }

      records.value = list

      if (res.pagination) {
        pagination.value = {
          total: res.pagination.total,
          page: res.pagination.page,
          limit: res.pagination.limit,
          pages: res.pagination.pages,
        }
      }
    } else {
      showToastMessage(res.error || 'Failed to load rules', 'error')
    }
  } catch (err) {
    console.error(err)
    showToastMessage('Failed to load rules', 'error')
  } finally {
    loading.value = false
  }
}

// ================================================================
// PAGINATION HANDLERS
// ================================================================
const goToPage = (pageNum) => {
  if (pageNum < 1 || pageNum > pagination.value.pages) return
  pagination.value.page = pageNum
  fetchRecords()
}

const onPageSizeChange = () => {
  pagination.value.page = 1
  fetchRecords()
}

let searchDebounceTimer = null
watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    pagination.value.page = 1
    fetchRecords()
  }, 300)
})

watch([filterStore, filterStatus], () => {
  pagination.value.page = 1
  fetchRecords()
})

// ================================================================
// DETAIL PAGE
// ================================================================
const openDetailPage = async (record) => {
  viewMode.value = 'detail'
  detailTarget.value = record
  window.scrollTo({ top: 0, behavior: 'smooth' })

  if (record?.id) {
    detailLoading.value = true
    try {
      const res = await itemStatusService.getRuleById(record.id)
      if (res.success && res.data) {
        detailTarget.value = res.data
      }
    } catch (err) {
      console.error('Failed to load rule detail:', err)
    } finally {
      detailLoading.value = false
    }
  }
}

const closeDetailPage = async () => {
  viewMode.value = 'list'
  detailTarget.value = null
  await fetchRecords()
}

// ================================================================
// FORM
// ================================================================
const openCreateModal = () => {
  isEditing.value = false
  formError.value = ''
  form.value = { id: null, target: '', itemId: '', maxQuantity: 1, frequencyDays: 7, reason: '' }
  selectedItem.value = null
  itemSearchQuery.value = ''
  itemSearchOpen.value = false
  showFormModal.value = true
}

const openEditModal = (record) => {
  isEditing.value = true
  formError.value = ''

  const targetValue =
    record.storeType === 'department'
      ? `department:${record.departmentId}`
      : `store:${record.storeId}`

  form.value = {
    id: record.id,
    target: targetValue,
    itemId: record.itemId,
    maxQuantity: record.maxQuantity,
    frequencyDays: record.frequencyDays,
    reason: record.reason || ''
  }

  // Pre-populate the picked item chip
  const found = allItems.value.find(i => Number(i.itemId) === Number(record.itemId))
  selectedItem.value = found || {
    itemId: record.itemId,
    code: record.itemCode || '—',
    name: record.itemName || '—',
    uomCode: record.uomCode || null,
  }

  itemSearchQuery.value = ''
  itemSearchOpen.value = false
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  selectedItem.value = null
  itemSearchQuery.value = ''
  itemSearchOpen.value = false
}

const saveRecord = async () => {
  if (!form.value.target) return (formError.value = 'Please select a store or department.')
  if (!selectedItem.value || !selectedItem.value.itemId)
    return (formError.value = 'Please search and pick an item from the list.')
  if (!form.value.maxQuantity || form.value.maxQuantity <= 0)
    return (formError.value = 'Quantity must be greater than 0.')
  if (!form.value.frequencyDays || form.value.frequencyDays <= 0)
    return (formError.value = 'Frequency must be at least 1 day.')

  // Parse 'store:1' or 'department:2' into the payload shape
  const [targetType, targetIdStr] = String(form.value.target).split(':')
  const targetId = Number(targetIdStr)
  if (!['store', 'department'].includes(targetType) || !Number.isFinite(targetId)) {
    return (formError.value = 'Invalid target selection.')
  }

  saving.value = true
  formError.value = ''
  try {
    const payload = {
      storeId: targetType === 'store' ? targetId : null,
      departmentId: targetType === 'department' ? targetId : null,
      itemId: Number(selectedItem.value.itemId),
      maxQuantity: Number(form.value.maxQuantity),
      frequencyDays: Number(form.value.frequencyDays),
      reason: form.value.reason || '',
    }

    const res = isEditing.value
      ? await itemStatusService.updateRule(form.value.id, payload)
      : await itemStatusService.createRule(payload)

    if (!res.success) {
      formError.value = res.error || 'Failed to save rule'
      return
    }

    showToastMessage(
      isEditing.value ? 'Rule updated successfully' : 'Rule created successfully',
      'success'
    )
    closeFormModal()
    await fetchRecords()

    if (viewMode.value === 'detail' && detailTarget.value?.id === form.value.id && res.data) {
      const detailRes = await itemStatusService.getRuleById(form.value.id)
      if (detailRes.success && detailRes.data) {
        detailTarget.value = detailRes.data
      }
    }
  } catch (err) {
    console.error(err)
    formError.value = 'Failed to save rule'
  } finally {
    saving.value = false
  }
}

// ================================================================
// DELETE
// ================================================================
const openDeleteModal = (record) => {
  deleteTarget.value = record
  showDeleteModal.value = true
}
const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTarget.value = null
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await itemStatusService.deleteRule(deleteTarget.value.id)
    if (!res.success) {
      showToastMessage(res.error || 'Failed to delete rule', 'error')
      return
    }
    showToastMessage('Rule deleted', 'info')
    if (viewMode.value === 'detail' && detailTarget.value?.id === deleteTarget.value.id) {
      viewMode.value = 'list'
      detailTarget.value = null
    }
    closeDeleteModal()
    await fetchRecords()
  } catch (err) {
    console.error(err)
    showToastMessage('Failed to delete rule', 'error')
  } finally {
    deleting.value = false
  }
}

// ================================================================
// TOAST
// ================================================================
const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(async () => {
  document.addEventListener('click', onDocumentClick)
  await loadStoresAndItems()
  await fetchRecords()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
})
</script>

<style scoped>
/* ================================================================
   BASE
   ================================================================ */
.page { padding: 32px; min-height: 100vh; background: #f7f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.header-main h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.header-sub { font-size: 14px; color: #64748b; margin: 0; max-width: 600px; }
.header-actions { display: flex; gap: 10px; }

.btn-add { padding: 9px 18px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-add:hover { background: #1d4ed8; }
.btn-refresh { padding: 9px 18px; background: white; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-refresh:hover:not(:disabled) { background: #f1f5f9; }

/* SUMMARY */
.summary-strip { display: flex; align-items: center; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 28px; margin-bottom: 24px; gap: 24px; }
.summary-item { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.summary-value { font-size: 24px; font-weight: 700; }
.accent-blue { color: #2563eb; }
.accent-green { color: #16a34a; }
.accent-amber { color: #d97706; }
.summary-label { font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.4px; }
.summary-divider { width: 1px; height: 36px; background: #e5e7eb; }

/* TOOLBAR */
.toolbar { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; }
.toolbar-left { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
.field select, .field input { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; background: white; color: #0f172a; min-width: 150px; outline: none; }
.search-field { flex: 1; min-width: 260px}
.search-input-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 12px; color: #94a3b8; pointer-events: none; }
.search-input { width: 100%; padding: 8px 34px 8px 34px !important; }
.search-clear { position: absolute; right: 8px; width: 22px; height: 22px; border: none; background: #f1f5f9; color: #64748b; border-radius: 50%; cursor: pointer; }
.btn-clear { padding: 8px 14px; background: transparent; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #64748b; cursor: pointer; height: 37px; }

/* TABLE */
.panel { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
.panel-header h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px 0; }
.panel-header p { font-size: 13px; color: #64748b; margin: 0; }
.panel-count { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; font-weight: 600; }

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 1050px; }
.data-table thead { background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; }
.data-table td { padding: 14px 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafbfc; }

.text-center { text-align: center; }
.text-right { text-align: right; }
.font-bold { font-weight: 600; color: #0f172a; }
.text-muted { color: #94a3b8; font-style: italic; font-size: 12px; }
.font-mono { font-family: ui-monospace, monospace; font-size: 11px; }

/* Status Pill */
.status-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.blocked { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Type tag (Store / Department) */
.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.type-tag.store {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}
.type-tag.department {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.target-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

/* Item Cell */
.item-cell { display: flex; flex-direction: column; gap: 2px; }
.item-code { font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; color: #1d4ed8; background: #eff6ff; padding: 2px 6px; border-radius: 4px; align-self: flex-start; }
.item-name { font-weight: 500; color: #334155; }

.rule-cell { font-size: 13px; color: #334155; line-height: 1.4; }

.last-taken-cell { display: flex; flex-direction: column; gap: 2px; }
.last-taken-date { font-size: 12px; color: #334155; }
.last-taken-qty { font-size: 11px; font-weight: 700; color: #1d4ed8; }

.next-allowed-now { color: #16a34a; font-weight: 600; font-size: 12px; }
.next-allowed-future { color: #dc2626; font-weight: 600; font-size: 12px; }

.row-actions { display: flex; gap: 6px; }
.btn-icon { width: 28px; height: 28px; border-radius: 6px; background: transparent; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.btn-icon:hover { background: #f1f5f9; border-color: #cbd5e1; }
.btn-icon.view:hover { background: #eff6ff; color: #2563eb; }
.btn-icon.delete:hover { background: #fee2e2; border-color: #fecaca; color: #dc2626; }

.empty { padding: 56px 20px; text-align: center; }
.empty-icon { width: 40px; height: 40px; margin: 0 auto 12px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.empty-text { color: #94a3b8; font-size: 14px; }

/* ================================================================
   DETAIL PAGE
   ================================================================ */
.detail-page-header { margin-bottom: 16px; }
.btn-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: white; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 500; color: #0f172a; cursor: pointer; transition: all 0.15s; }
.btn-back:hover { background: #f1f5f9; border-color: #94a3b8; }

.detail-title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
.detail-title-row h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
.detail-code { font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; color: #1d4ed8; background: #eff6ff; padding: 4px 10px; border-radius: 6px; border: 1px solid #bfdbfe; }

.detail-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.detail-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
.detail-card-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
.detail-card strong { font-size: 14px; color: #0f172a; display: inline-flex; align-items: center; gap: 8px; }

.detail-reason-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
.detail-reason-card p { margin: 0; font-size: 14px; color: #475569; line-height: 1.5; }

/* Status badges in history */
.status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.status-badge.approved { background: #dcfce7; color: #166534; }
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.status-badge.finalized { background: #dbeafe; color: #1e40af; }

/* ================================================================
   MODALS
   ================================================================ */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-container { background: white; border-radius: 14px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3); }
.form-modal { max-width: 600px; }
.delete-modal { max-width: 450px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
.modal-header h3 { font-size: 16px; font-weight: 700; margin: 0; }
.modal-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 22px; overflow-y: auto; flex: 1 1 auto; }
.modal-footer { padding: 16px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; background: #fafbfc; }

/* ================================================================
   FORM ELEMENTS
   ================================================================ */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full-width { grid-column: span 2; }
.form-group label { font-size: 12px; font-weight: 600; color: #475569; }
.field-hint { font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 2px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.15s; }
.form-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
textarea.form-input { resize: vertical; min-height: 60px; }
.form-error { margin-top: 16px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; font-size: 13px; font-weight: 500; }

/* ================================================================
   ITEM SEARCH (in form)
   ================================================================ */
.item-search-group { position: relative; }

.item-search-wrap { position: relative; }

.item-search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 260px;
  overflow-y: auto;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 50;
  padding: 4px;
}

.item-search-empty {
  padding: 12px 14px;
  font-size: 12.5px;
  color: #94a3b8;
  font-style: italic;
  text-align: center;
}

.item-search-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.1s;
}
.item-search-option:hover,
.item-search-option:focus {
  background: #eff6ff;
}

.item-option-code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-option-name {
  color: #0f172a;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.item-option-uom {
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
}

/* Picked item chip */
.item-picked {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.item-picked .item-code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  color: #15803d;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 4px;
}

.item-picked .item-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #14532d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-picked-uom {
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
  font-weight: 700;
  color: #15803d;
  background: #bbf7d0;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.item-picked-clear {
  background: transparent;
  border: none;
  color: #16a34a;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.item-picked-clear:hover { background: #dcfce7; color: #15803d; }

/* Delete modal */
.delete-icon { font-size: 36px; margin-bottom: 12px; }

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-primary { padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-secondary { padding: 8px 20px; background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-danger { padding: 8px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* ================================================================
   LOADING
   ================================================================ */
.loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; color: #64748b; font-size: 14px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ================================================================
   TOAST
   ================================================================ */
.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; background: #0f172a; color: white; border-radius: 10px; font-size: 13px; z-index: 1100; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
.toast.success { background: #16a34a; }
.toast.error { background: #dc2626; }
.toast.info { background: #0f172a; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }

/* ================================================================
   TRANSITIONS
   ================================================================ */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.pagination-info {
  font-size: 12.5px;
  color: #64748b;
}
.pagination-info strong {
  color: #0f172a;
  font-weight: 700;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-size {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #64748b;
}
.page-size select {
  padding: 5px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  font-size: 12.5px;
  outline: none;
  cursor: pointer;
}
.page-size select:focus {
  border-color: #2563eb;
}

.page-btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 12.5px;
  color: #64748b;
  padding: 0 8px;
}
.page-indicator strong {
  color: #0f172a;
  font-weight: 700;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .detail-cards { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .detail-cards { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.full-width { grid-column: span 1; }
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }
  .pagination-controls {
    justify-content: space-between;
  }
}
</style>