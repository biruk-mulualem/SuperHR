<!-- views/storemanagement/item-status/ItemStatusRecordPage.vue -->
<template>
  <div class="page">
    <!-- ==================== HEADER ==================== -->
    <header class="page-header">
      <div class="header-main">
        <h1>Item Status Records</h1>
        <p class="header-sub">
          Set permanent limits (e.g., max 5 drums every 7 days) and track when the store can take the next batch.
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

    <!-- ==================== SUMMARY ==================== -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-value accent-blue">{{ records.length }}</span>
        <span class="summary-label">Total Rules</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value accent-green">{{ availableCount }}</span>
        <span class="summary-label">Ready to Take Now</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value accent-amber">{{ blockedCount }}</span>
        <span class="summary-label">Currently Blocked</span>
      </div>
    </div>

    <!-- ==================== TOOLBAR ==================== -->
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

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading rules…</p>
    </div>

    <!-- ==================== MAIN PANEL ==================== -->
    <section v-else class="panel">
      <header class="panel-header">
        <div>
          <h2>Active Rules</h2>
          <p>Frequency-based limits applied to stores.</p>
        </div>
        <span class="panel-count">{{ filteredRecords.length }}</span>
      </header>

      <div v-if="filteredRecords.length === 0" class="empty">
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
              <th>Store</th>
              <th>Item</th>
              <th>Rule</th>
              <th>Last Taken</th>
              <th>Next Allowed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredRecords" :key="r.id">
              <td>
                <span :class="['status-pill', getComputedStatus(r).class]">
                  {{ getComputedStatus(r).label }}
                </span>
              </td>
              <td>
                <div class="font-bold">{{ getStoreName(r.storeId) }}</div>
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
                <span v-if="!r.lastTaken" class="next-allowed-now">Now</span>
                <span v-else-if="isBlocked(r)" class="next-allowed-future">
                  {{ getNextAllowedDate(r) }}
                </span>
                <span v-else class="next-allowed-now">Now</span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn-icon view" @click="openDetailModal(r)" title="View Details">👁️</button>
                  <button class="btn-icon" @click="openEditModal(r)" title="Edit">✏️</button>
                  <button class="btn-icon delete" @click="openDeleteModal(r)" title="Delete">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ==================== DETAIL MODAL ==================== -->
    <transition name="modal-fade">
      <div v-if="showDetailModal && detailTarget" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-container detail-modal">
          <div class="modal-header">
            <h3>📋 Rule Details</h3>
            <button class="modal-close" @click="closeDetailModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-summary">
              <div class="detail-summary-row">
                <span class="detail-code">{{ detailTarget.itemCode }}</span>
                <strong>{{ detailTarget.itemName }}</strong>
              </div>
              <div class="detail-summary-grid">
                <div class="summary-cell">
                  <span class="summary-label">Store</span>
                  <strong>{{ getStoreName(detailTarget.storeId) }}</strong>
                </div>
                <div class="summary-cell">
                  <span class="summary-label">Rule</span>
                  <strong>{{ detailTarget.maxQuantity }} {{ detailTarget.uomCode }} every {{ detailTarget.frequencyDays }} days</strong>
                </div>
                <div class="summary-cell">
                  <span class="summary-label">Current Status</span>
                  <strong :style="{ color: getComputedStatus(detailTarget).color }">
                    {{ getComputedStatus(detailTarget).label }}
                  </strong>
                </div>
                <div class="summary-cell">
                  <span class="summary-label">Next Allowed Date</span>
                  <strong>{{ isBlocked(detailTarget) ? getNextAllowedDate(detailTarget) : 'Available Now' }}</strong>
                </div>
              </div>
              <div v-if="detailTarget.reason" class="detail-reason">
                <strong>Reason:</strong> {{ detailTarget.reason }}
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">
                ⏱️ Take History
              </div>
              <div v-if="!detailTarget.history || detailTarget.history.length === 0" class="empty-history">
                No history records found.
              </div>
              <div v-else class="history-table-wrap">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th class="text-right">Quantity</th>
                      <th>Request Code</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(h, idx) in detailTarget.history" :key="idx">
                      <td>{{ formatDateTime(h.date) }}</td>
                      <td class="text-right font-bold">{{ h.quantity }} {{ detailTarget.uomCode }}</td>
                      <td class="font-mono">{{ h.requestCode }}</td>
                      <td>
                        <span :class="['status-badge', h.status]">{{ h.status }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDetailModal">Close</button>
          </div>
        </div>
      </div>
    </transition>

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
              
              <!-- Store -->
              <div class="form-group">
                <label>Store (Department)</label>
                <select v-model="form.storeId" class="form-input">
                  <option value="" disabled>Select a store</option>
                  <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>

              <!-- Item -->
              <div class="form-group">
                <label>Item</label>
                <select v-model="form.itemId" class="form-input">
                  <option value="" disabled>Select an item</option>
                  <option v-for="i in items" :key="i.itemId" :value="i.itemId">
                    {{ i.code }} - {{ i.name }}
                  </option>
                </select>
              </div>

              <!-- Max Qty -->
              <div class="form-group">
                <label>Maximum Quantity Allowed</label>
                <input type="number" v-model.number="form.maxQuantity" min="0.01" step="0.01" class="form-input" placeholder="e.g. 5" />
              </div>

              <!-- Frequency -->
              <div class="form-group">
                <label>Every X Days (Frequency)</label>
                <input type="number" v-model.number="form.frequencyDays" min="1" step="1" class="form-input" placeholder="e.g. 7" />
                <span class="field-hint">They can take this amount once every X days, indefinitely.</span>
              </div>

              <!-- Reason -->
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
            <p>Are you sure you want to delete the limit for <strong>{{ deleteTarget.itemName }}</strong> in <strong>{{ getStoreName(deleteTarget.storeId) }}</strong>?</p>
            <p class="text-muted" style="margin-top: 8px; font-size: 12px;">This will allow the store to request the item freely again.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
            <button class="btn-danger" @click="confirmDelete">Delete</button>
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
import { ref, computed, onMounted } from 'vue'

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const saving = ref(false)

const records = ref([])
const stores = ref([])
const items = ref([])

const searchQuery = ref('')
const filterStatus = ref('all')

const showDetailModal = ref(false)
const detailTarget = ref(null)

const showFormModal = ref(false)
const isEditing = ref(false)
const formError = ref('')

const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Form State (No Start/End Dates)
const form = ref({
  id: null,
  storeId: '',
  itemId: '',
  maxQuantity: 1,
  frequencyDays: 7,
  reason: ''
})

// ================================================================
// COMPUTED
// ================================================================
const hasActiveFilters = computed(() => searchQuery.value !== '' || filterStatus.value !== 'all')

const filteredRecords = computed(() => {
  let result = [...records.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => 
      (r.itemName && r.itemName.toLowerCase().includes(q)) ||
      (r.itemCode && r.itemCode.toLowerCase().includes(q)) ||
      getStoreName(r.storeId).toLowerCase().includes(q)
    )
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(r => {
      const isCurrentlyBlocked = isBlocked(r)
      if (filterStatus.value === 'blocked') return isCurrentlyBlocked
      if (filterStatus.value === 'available') return !isCurrentlyBlocked
      return true
    })
  }

  return result
})

const availableCount = computed(() => records.value.filter(r => !isBlocked(r)).length)
const blockedCount = computed(() => records.value.filter(r => isBlocked(r)).length)

// ================================================================
// HELPERS
// ================================================================
const getStoreName = (id) => {
  const s = stores.value.find(x => String(x.id) === String(id) || String(x.storeId) === String(id))
  return s ? s.name : `Store #${id}`
}

const getDaysSince = (dateStr) => {
  const last = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now - last)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

const isBlocked = (record) => {
  if (!record.lastTaken) return false
  const daysSince = getDaysSince(record.lastTaken.date)
  return daysSince < record.frequencyDays
}

const getNextAllowedDate = (record) => {
  if (!record.lastTaken) return 'Now'
  const lastDate = new Date(record.lastTaken.date)
  lastDate.setDate(lastDate.getDate() + record.frequencyDays)
  
  const now = new Date()
  if (lastDate <= now) return 'Now'

  return lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getComputedStatus = (record) => {
  if (isBlocked(record)) {
    return { key: 'blocked', label: '🔒 Limit Reached', class: 'blocked', color: '#991b1b' }
  }
  return { key: 'available', label: '✅ Ready to Take', class: 'active', color: '#166534' }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const clearFilters = () => {
  searchQuery.value = ''
  filterStatus.value = 'all'
}

// ================================================================
// ACTIONS
// ================================================================
const fetchRecords = async () => {
  loading.value = true
  try {
    // Mock Data
    records.value = [
      { 
        id: 1, storeId: 1, itemCode: 'SDT000001', itemName: 'Lacquer thinner 165kg', maxQuantity: 5, uomCode: 'DRUM', frequencyDays: 7, reason: 'Weekly quota',
        // They took it 2 days ago (Blocked for 5 more days)
        lastTaken: { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), quantity: 5, requestCode: 'REQ-261024-001', status: 'approved' },
        history: [
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), quantity: 5, requestCode: 'REQ-261024-001', status: 'approved' },
          { date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), quantity: 5, requestCode: 'REQ-261015-012', status: 'approved' }
        ]
      },
      { 
        id: 2, storeId: 2, itemCode: 'SDT000430', itemName: 'Thermo Plastic Resin 190kg', maxQuantity: 12, uomCode: 'BAG', frequencyDays: 10, reason: 'Temporary shortage limit',
        // They took it 15 days ago (Available now)
        lastTaken: { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), quantity: 2, requestCode: 'REQ-261010-008', status: 'approved' },
        history: [
          { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), quantity: 2, requestCode: 'REQ-261010-008', status: 'approved' }
        ]
      },
      { 
        id: 3, storeId: 1, itemCode: 'SDT000154', itemName: 'Fiber #450 gsm/46Kg', maxQuantity: 100, uomCode: 'ROLL', frequencyDays: 30, reason: 'Monthly restriction',
        lastTaken: null, history: []
      },
    ]
    
    stores.value = [{ id: 1, name: 'Main Store 1' }, { id: 2, name: 'Main Store 2' }]
    items.value = [
      { itemId: 1, code: 'SDT000001', name: 'Lacquer thinner 165kg' },
      { itemId: 2, code: 'SDT000430', name: 'Thermo Plastic Resin 190kg' },
      { itemId: 3, code: 'SDT000154', name: 'Fiber #450 gsm/46Kg' },
    ]
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openDetailModal = (record) => {
  detailTarget.value = record
  showDetailModal.value = true
}
const closeDetailModal = () => {
  showDetailModal.value = false
  detailTarget.value = null
}

const openCreateModal = () => {
  isEditing.value = false
  formError.value = ''
  form.value = { id: null, storeId: '', itemId: '', maxQuantity: 1, frequencyDays: 7, reason: '' }
  showFormModal.value = true
}

const openEditModal = (record) => {
  isEditing.value = true
  formError.value = ''
  const matchedItem = items.value.find(i => i.code === record.itemCode)
  form.value = {
    id: record.id,
    storeId: record.storeId,
    itemId: matchedItem ? matchedItem.itemId : '', 
    maxQuantity: record.maxQuantity,
    frequencyDays: record.frequencyDays,
    reason: record.reason
  }
  showFormModal.value = true
}

const closeFormModal = () => { showFormModal.value = false }

const saveRecord = async () => {
  if (!form.value.storeId) return formError.value = 'Please select a store.'
  if (!form.value.itemId) return formError.value = 'Please select an item.'
  if (!form.value.maxQuantity || form.value.maxQuantity <= 0) return formError.value = 'Quantity must be greater than 0.'
  if (!form.value.frequencyDays || form.value.frequencyDays <= 0) return formError.value = 'Frequency must be at least 1 day.'

  saving.value = true
  await new Promise(r => setTimeout(r, 400)) // Simulate API

  const selectedItem = items.value.find(i => i.itemId === form.value.itemId)
  
  if (isEditing.value) {
    const idx = records.value.findIndex(r => r.id === form.value.id)
    if (idx !== -1) {
      records.value[idx] = { ...records.value[idx], ...form.value, itemCode: selectedItem.code, itemName: selectedItem.name }
    }
  } else {
    records.value.push({
      id: Date.now(),
      ...form.value,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      uomCode: 'PCS',
      lastTaken: null,
      history: []
    })
  }

  saving.value = false
  showToastMessage('Rule saved successfully', 'success')
  closeFormModal()
}

const openDeleteModal = (record) => { deleteTarget.value = record; showDeleteModal.value = true }
const closeDeleteModal = () => { showDeleteModal.value = false; deleteTarget.value = null }
const confirmDelete = () => {
  records.value = records.value.filter(r => r.id !== deleteTarget.value.id)
  showToastMessage('Rule deleted', 'info')
  closeDeleteModal()
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg; toastType.value = type; showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

onMounted(() => { fetchRecords() })
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
.search-field { flex: 1; min-width: 260px; }
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
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 950px; }
.data-table thead { background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
.data-table th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap; }
.data-table td { padding: 14px 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafbfc; }

.text-center { text-align: center; }
.font-bold { font-weight: 600; color: #0f172a; }
.text-muted { color: #94a3b8; font-style: italic; font-size: 12px; }
.font-mono { font-family: ui-monospace, monospace; font-size: 11px; }

/* Status Pill */
.status-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.blocked { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Item Cell */
.item-cell { display: flex; flex-direction: column; gap: 2px; }
.item-code { font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; color: #1d4ed8; background: #eff6ff; padding: 2px 6px; border-radius: 4px; align-self: flex-start; }
.item-name { font-weight: 500; color: #334155; }

/* Rule Cell */
.rule-cell { font-size: 13px; color: #334155; line-height: 1.4; }

/* Last Taken Cell */
.last-taken-cell { display: flex; flex-direction: column; gap: 2px; }
.last-taken-date { font-size: 12px; color: #334155; }
.last-taken-qty { font-size: 11px; font-weight: 700; color: #1d4ed8; }

/* Next Allowed */
.next-allowed-now { color: #16a34a; font-weight: 600; font-size: 12px; }
.next-allowed-future { color: #dc2626; font-weight: 600; font-size: 12px; }

/* Actions */
.row-actions { display: flex; gap: 6px; }
.btn-icon { width: 28px; height: 28px; border-radius: 6px; background: transparent; border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.btn-icon:hover { background: #f1f5f9; border-color: #cbd5e1; }
.btn-icon.view:hover { background: #eff6ff; color: #2563eb; }
.btn-icon.delete:hover { background: #fee2e2; border-color: #fecaca; color: #dc2626; }

/* Empty */
.empty { padding: 56px 20px; text-align: center; }
.empty-icon { width: 40px; height: 40px; margin: 0 auto 12px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.empty-text { color: #94a3b8; font-size: 14px; }

/* MODALS */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-container { background: white; border-radius: 14px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3); }
.form-modal { max-width: 600px; }
.detail-modal { max-width: 700px; }
.delete-modal { max-width: 450px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
.modal-header h3 { font-size: 16px; font-weight: 700; margin: 0; }
.modal-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 22px; overflow-y: auto; flex: 1 1 auto; }
.modal-footer { padding: 16px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; background: #fafbfc; }

/* Form Elements */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full-width { grid-column: span 2; }
.form-group label { font-size: 12px; font-weight: 600; color: #475569; }
.field-hint { font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 2px; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.15s; }
.form-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
textarea.form-input { resize: vertical; min-height: 60px; }
.form-error { margin-top: 16px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; font-size: 13px; font-weight: 500; }

/* Detail Modal */
.detail-summary { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
.detail-summary-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; }
.detail-code { font-family: monospace; font-weight: 700; background: white; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px; }
.detail-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.summary-cell { display: flex; flex-direction: column; gap: 2px; }
.summary-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.summary-cell strong { font-size: 13px; color: #0f172a; }
.detail-reason { margin-top: 12px; font-size: 13px; color: #475569; background: white; padding: 8px 12px; border-radius: 6px; border: 1px dashed #cbd5e1; }
.detail-section-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; }
.history-table-wrap { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.history-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.history-table th { background: #f8fafc; text-align: left; padding: 10px 12px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e5e7eb; }
.history-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.history-table .text-right { text-align: right; }
.empty-history { text-align: center; padding: 20px; font-size: 13px; color: #94a3b8; font-style: italic; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }

/* Status Badges in History */
.status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.status-badge.approved { background: #dcfce7; color: #166534; }
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }

/* Buttons */
.btn-primary { padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-secondary { padding: 8px 20px; background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-danger { padding: 8px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-danger:hover { background: #dc2626; }

/* Toast */
.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; background: #0f172a; color: white; border-radius: 10px; font-size: 13px; z-index: 1100; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
.toast.success { background: #16a34a; }
.toast.error { background: #dc2626; }
.toast.info { background: #0f172a; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }

/* Transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>