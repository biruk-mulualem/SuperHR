<!-- views/storemanagement/notifications/ApprovedPendingProcessing.vue -->
<template>
  <div class="page">
    <!-- ==================== HEADER ==================== -->
    <header class="page-header">
      <div class="header-main">
        <h1>Approved (Awaiting Processing)</h1>
        <p class="header-sub">
          Requests that are fully approved but not yet finalized. Shows exactly which supplying group(s) still need to process it.
        </p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportToCSV" :disabled="filteredRequests.length === 0">
          📥 Export CSV
        </button>
        <button class="btn-refresh" @click="refresh" :disabled="loading">
          <span v-if="!loading">↻ Refresh</span>
          <span v-else>Loading…</span>
        </button>
      </div>
    </header>

    <!-- ==================== SUMMARY ==================== -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-value accent-blue">{{ approvedRequests.length }}</span>
        <span class="summary-label">Total Unprocessed</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value">{{ totalItems }}</span>
        <span class="summary-label">Total Items</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value accent-amber">{{ uniquePendingGroupsCount }}</span>
        <span class="summary-label">Groups Pending</span>
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
              placeholder="Search by code, store, requester, or group…"
              class="search-input"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" title="Clear search">✕</button>
          </div>
        </div>

        <div class="field">
          <label>Store</label>
          <select v-model="filterStore">
            <option value="all">All stores</option>
            <option v-for="s in uniqueStores" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="field">
          <label>Pending Group</label>
          <select v-model="filterPendingGroup">
            <option value="all">Any group</option>
            <option v-for="g in uniquePendingGroups" :key="g" :value="g">{{ g }}</option>
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
      <p>Loading approved requests…</p>
    </div>

    <!-- ==================== ERROR ==================== -->
    <div v-else-if="loadError" class="empty">
      <div class="empty-icon" style="background:#fee2e2;color:#dc2626;">!</div>
      <div class="empty-text">{{ loadError }}</div>
      <div style="margin-top:12px;">
        <button class="btn-secondary" @click="refresh">Try again</button>
      </div>
    </div>

    <!-- ==================== MAIN PANEL ==================== -->
    <section v-else class="panel">
      <header class="panel-header">
        <div>
          <h2>Approved but Not Finalized</h2>
          <p>These requests have all approvals, but specific supplying groups haven't processed them yet.</p>
        </div>
        <span class="panel-count">{{ filteredRequests.length }}</span>
      </header>

      <div v-if="filteredRequests.length === 0" class="empty">
        <div class="empty-icon">📦</div>
        <div class="empty-text">
          <template v-if="hasActiveFilters">No requests match your filters</template>
          <template v-else>No approved requests are currently awaiting processing</template>
        </div>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-code">Request</th>
              <th class="col-flow">Flow</th>
              <th class="col-meta">Requested By</th>
              <th class="col-items">Items</th>
              <th class="col-pending">Pending Groups</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paginatedRequests" :key="r.id">
              <td class="col-code">
                <span class="code" v-html="highlight(r.code)"></span>
              </td>
              <td class="col-flow">
                <span class="flow">
                  <span v-html="highlight(r.askingStore)"></span>
                  <span class="arrow">→</span>
                  <span v-html="highlight(r.supplyingStore)"></span>
                </span>
              </td>
              <td class="col-meta">
                <span v-html="highlight(r.requestedBy)"></span>
              </td>
              <td class="col-items">
                <span class="item-badge">{{ r.items }}</span>
              </td>
              
              <!-- JUST THE COUNT -->
              <td class="col-pending">
                <span class="pending-count-badge">
                  {{ (r.pendingGroups || []).length }} group{{ (r.pendingGroups || []).length === 1 ? '' : 's' }}
                </span>
              </td>

              <td class="col-actions">
                <div class="row-actions">
                  <button class="btn-view" @click="openDetailModal(r)">
                    👁 View Details
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ==================== PAGINATION ==================== -->
      <footer v-if="filteredRequests.length > 0" class="pagination">
        <div class="pagination-left">
          <span class="pagination-info">
            Showing <strong>{{ pageStart }}–{{ pageEnd }}</strong> of <strong>{{ filteredRequests.length }}</strong> requests
          </span>
          <div class="page-size-selector">
            <label>Rows per page</label>
            <select v-model.number="pageSize" @change="currentPage = 1">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
            </select>
          </div>
        </div>
        <div class="pagination-right">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(1)">⏮</button>
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Previous</button>
          <div class="page-numbers">
            <button
              v-for="p in visiblePageNumbers"
              :key="p"
              :class="['page-number', { active: p === currentPage }]"
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
          </div>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(totalPages)">⏭</button>
        </div>
      </footer>
    </section>

    <!-- ==================== DETAIL MODAL ==================== -->
    <transition name="modal-fade">
      <div v-if="showDetailModal && detailTarget" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-container detail-modal">
          <div class="modal-header">
            <h3>📋 Request Tracking Details</h3>
            <button class="modal-close" @click="closeDetailModal">✕</button>
          </div>

          <div class="modal-body">
            <div class="detail-summary">
              <div class="detail-summary-row">
                <span class="detail-code">{{ detailTarget.code }}</span>
              </div>
              <div class="detail-summary-row">
                <div class="detail-flow">
                  <span>{{ detailTarget.askingStore }}</span>
                  <span class="arrow">→</span>
                  <span>{{ detailTarget.supplyingStore }}</span>
                </div>
              </div>
              <div class="detail-summary-grid">
                <div class="summary-cell">
                  <span class="summary-label">Requested By</span>
                  <strong>{{ detailTarget.requestedBy }}</strong>
                </div>
                <div class="summary-cell">
                  <span class="summary-label">Items</span>
                  <strong>{{ detailTarget.items }}</strong>
                </div>
              </div>
            </div>

            <!-- Pending Processing Details -->
            <div class="detail-section">
              <div class="detail-section-title" style="color: #b45309;">
                ⏳ Who Has NOT Processed Yet
                <span class="detail-section-count bg-amber">{{ detailTarget.pendingGroups.length }}</span>
              </div>
              <div class="detail-table-wrap" style="border-color: #fde68a;">
                <table class="detail-table">
                  <thead style="background: #fffbeb;">
                    <tr>
                      <th class="dt-avatar"></th>
                      <th>Group Name</th>
                      <th class="dt-time">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(grp, idx) in detailTarget.pendingGroups" :key="idx">
                      <td class="dt-avatar">
                        <div class="avatar avatar-amber">{{ initials(grp) }}</div>
                      </td>
                      <td><span class="dt-name">{{ grp }}</span></td>
                      <td class="dt-time">
                        <span class="pill pending">
                          <span class="pill-dot"></span> Waiting
                        </span>
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

    <!-- ==================== TOAST ==================== -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// 🔥 Import the balanceService
import balanceService from '@/stores/balanceService'

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const filterStore = ref('all')
const filterPendingGroup = ref('all')

const currentPage = ref(1)
const pageSize = ref(10)

const showDetailModal = ref(false)
const detailTarget = ref(null)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// Holds data from API
const approvedRequests = ref([])

// ================================================================
// COMPUTED & FILTERS
// ================================================================
const uniqueStores = computed(() => {
  const set = new Set()
  approvedRequests.value.forEach(r => {
    if (r.askingStore) set.add(r.askingStore)
    if (r.supplyingStore) set.add(r.supplyingStore)
  })
  return Array.from(set).sort()
})

const uniquePendingGroups = computed(() => {
  const set = new Set()
  approvedRequests.value.forEach(r => {
    if (r.pendingGroups) {
      r.pendingGroups.forEach(g => set.add(g))
    }
  })
  return Array.from(set).sort()
})

const uniquePendingGroupsCount = computed(() => uniquePendingGroups.value.length)

const hasActiveFilters = computed(() => 
  searchQuery.value !== '' || filterStore.value !== 'all' || filterPendingGroup.value !== 'all'
)

const filteredRequests = computed(() => {
  let result = [...approvedRequests.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => 
      r.code.toLowerCase().includes(q) ||
      (r.requestedBy && r.requestedBy.toLowerCase().includes(q)) ||
      (r.askingStore && r.askingStore.toLowerCase().includes(q)) ||
      (r.supplyingStore && r.supplyingStore.toLowerCase().includes(q)) ||
      (r.pendingGroups && r.pendingGroups.some(g => g.toLowerCase().includes(q)))
    )
  }

  if (filterStore.value !== 'all') {
    result = result.filter(r => r.askingStore === filterStore.value || r.supplyingStore === filterStore.value)
  }

  if (filterPendingGroup.value !== 'all') {
    result = result.filter(r => r.pendingGroups && r.pendingGroups.includes(filterPendingGroup.value))
  }

  return result
})

const totalItems = computed(() => filteredRequests.value.reduce((sum, r) => sum + (r.items || 0), 0))

// ================================================================
// PAGINATION
// ================================================================
const totalPages = computed(() => Math.ceil(filteredRequests.value.length / pageSize.value) || 1)
const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRequests.value.slice(start, start + pageSize.value)
})
const pageStart = computed(() => filteredRequests.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const pageEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredRequests.value.length))

const visiblePageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  let start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const goToPage = (page) => {
  if (page < 1) page = 1
  if (page > totalPages.value) page = totalPages.value
  currentPage.value = page
}

// ================================================================
// HELPERS
// ================================================================
const initials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/[\s_]+/) // Handle underscore group names
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const highlight = (text) => {
  if (!text) return ''
  const q = searchQuery.value.trim()
  if (!q) return text
  const regex = new RegExp(`(${q})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// ================================================================
// EXPORT FUNCTION
// ================================================================
const exportToCSV = () => {
  if (filteredRequests.value.length === 0) return

  // 1. Define Columns
  const headers = [
    'Request Code',
    'Asking Store',
    'Supplying Store',
    'Requested By',
    'Items',
    'Pending Groups Count',
    'Pending Groups'
  ]

  // 2. Map rows to data arrays
  const rows = filteredRequests.value.map(r => [
    r.code,
    r.askingStore,
    r.supplyingStore,
    r.requestedBy,
    r.items,
    (r.pendingGroups || []).length,
    (r.pendingGroups || []).join(', ')
  ])

  // 3. Convert to CSV string
  const csvContent = [
    headers.join(','), // Header row
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')) // Data rows
  ].join('\n')

  // 4. Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  const dateStr = new Date().toISOString().slice(0, 10)
  link.href = url
  link.setAttribute('download', `Approved_Pending_Processing_${dateStr}.csv`)
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  showToastMessage('Successfully exported to CSV', 'success')
}

// ================================================================
// ACTIONS
// ================================================================
const openDetailModal = (r) => {
  detailTarget.value = r
  showDetailModal.value = true
}
const closeDetailModal = () => {
  showDetailModal.value = false
  detailTarget.value = null
}

const clearFilters = () => {
  searchQuery.value = ''
  filterStore.value = 'all'
  filterPendingGroup.value = 'all'
  currentPage.value = 1
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

// ================================================================
// FETCH DATA
// ================================================================
const fetchPendingProcessing = async () => {
  loading.value = true
  loadError.value = ''
  try {
    // Call the new method we added to balanceService
    const res = await balanceService.getApprovedPendingProcessing({ limit: 1000 })
    
    if (res.success) {
      approvedRequests.value = res.data || []
    } else {
      loadError.value = res.error || 'Failed to load data'
      approvedRequests.value = []
    }
  } catch (err) {
    console.error('Failed to load pending processing data', err)
    loadError.value = 'Network error while loading data'
    approvedRequests.value = []
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  await fetchPendingProcessing()
  showToastMessage('Refreshed', 'info')
}

onMounted(() => {
  fetchPendingProcessing()
})
</script>

<style scoped>
/* ================================================================
   BASE
   ================================================================ */
.page {
  padding: 32px;
  min-height: 100vh;
  background: #f7f8fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.header-main h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0 0 4px 0;
}
.header-sub { font-size: 14px; color: #64748b; margin: 0; max-width: 600px; }

.header-actions { display: flex; gap: 10px; }

.btn-export {
  padding: 9px 18px;
  background: white;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-export:hover:not(:disabled) { background: #f1f5f9; }
.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-refresh {
  padding: 9px 18px;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.btn-refresh:hover:not(:disabled) { background: #1e293b; }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

/* SUMMARY */
.summary-strip {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 28px;
  margin-bottom: 24px;
  gap: 24px;
}
.summary-item { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.summary-value { font-size: 24px; font-weight: 700; }
.accent-blue { color: #2563eb; }
.accent-amber { color: #d97706; }
.summary-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.summary-divider { width: 1px; height: 36px; background: #e5e7eb; }

/* TOOLBAR */
.toolbar {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
}
.toolbar-left { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.field select, .field input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #0f172a;
  min-width: 150px;
  outline: none;
}
.search-field { flex: 1; min-width: 260px; }
.search-input-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 12px; color: #94a3b8; pointer-events: none; }
.search-input {
  width: 100%;
  padding: 8px 34px 8px 34px !important;
}
.search-clear {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 50%;
  cursor: pointer;
}
.btn-clear {
  padding: 8px 14px;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  height: 37px;
}
:deep(.search-highlight) { background: #fef08a; color: #713f12; padding: 0 1px; border-radius: 2px; }

/* TABLE */
.panel { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.panel-header h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px 0; }
.panel-header p { font-size: 13px; color: #64748b; margin: 0; }
.panel-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 850px; }
.data-table thead { background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
}
.data-table td { padding: 14px 16px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafbfc; }

.code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
.flow { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #334155; font-weight: 500; }
.arrow { color: #cbd5e1; font-size: 14px; }
.item-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; background: #e2e8f0; border-radius: 6px; font-size: 11px; font-weight: 700; }

/* Pending Count Badge */
.pending-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  background: #fef3c7;
  color: #b45309;
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

/* Buttons */
.row-actions { display: flex; gap: 6px; justify-content: flex-end; }
.btn-view {
  padding: 7px 12px;
  background: white;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.btn-view:hover { background: #f1f5f9; }
.btn-secondary {
  padding: 8px 18px;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

/* Pagination */
.pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
.pagination-left { display: flex; align-items: center; gap: 16px; }
.pagination-info { font-size: 13px; color: #64748b; }
.pagination-info strong { color: #0f172a; }
.page-size-selector { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; }
.page-size-selector select { padding: 5px 8px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 12px; }
.pagination-right { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.page-btn { padding: 6px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 12.5px; cursor: pointer; }
.page-btn:hover:not(:disabled) { background: #f8fafc; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-numbers { display: flex; gap: 4px; margin: 0 4px; }
.page-number { min-width: 32px; height: 32px; padding: 0 8px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 12.5px; cursor: pointer; }
.page-number.active { background: #0f172a; border-color: #0f172a; color: white; }

/* Empty */
.empty { padding: 56px 20px; text-align: center; }
.empty-icon { width: 40px; height: 40px; margin: 0 auto 12px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.empty-text { color: #94a3b8; font-size: 14px; }

/* MODALS */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-container { background: white; border-radius: 14px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3); }
.detail-modal { max-width: 600px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
.modal-header h3 { font-size: 16px; font-weight: 700; margin: 0; }
.modal-close { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 22px; overflow-y: auto; flex: 1 1 auto; }
.modal-footer { padding: 16px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; background: #fafbfc; }

/* Detail Modal */
.detail-summary { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 18px; }
.detail-summary-row { margin-bottom: 10px; }
.detail-code { font-family: ui-monospace, monospace; font-size: 12px; font-weight: 700; background: white; border: 1px solid #e5e7eb; padding: 4px 12px; border-radius: 6px; }
.detail-flow { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: #334155; }
.detail-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 14px; }
.summary-cell { display: flex; flex-direction: column; gap: 3px; }
.summary-cell .summary-label { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.summary-cell strong { font-size: 13px; color: #0f172a; }

.detail-section-title { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
.detail-section-count { padding: 2px 10px; border-radius: 10px; font-size: 11px; }
.bg-amber { background: #fef3c7; color: #b45309; }

.detail-table-wrap { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.detail-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.detail-table th { padding: 10px 14px; text-align: left; font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
.detail-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }

/* Pills */
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; border: 1px solid transparent; }
.pill-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.pill.pending { background: #fffbeb; border-color: #fde68a; color: #b45309; }
.pill.pending .pill-dot { background: #d97706; }

/* Toast */
.toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 20px; background: #0f172a; color: white; border-radius: 10px; font-size: 13px; z-index: 1100; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
.toast.success { background: #16a34a; }
.toast.error { background: #dc2626; }
.toast.info { background: #0f172a; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }
</style>