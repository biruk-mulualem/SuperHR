<!-- views/storemanagement/notifications/NotificationManagement.vue -->
<template>
  <div class="page">
    <!-- ==================== HEADER ==================== -->
    <header class="page-header">
      <div class="header-main">
        <h1>Awaiting My Approval</h1>
        <p class="header-sub">
          Requests where every supplying-store group has accepted — waiting for your final approval
        </p>
      </div>
      <button class="btn-refresh" @click="refresh" :disabled="loading">
        <span v-if="!loading">↻ Refresh</span>
        <span v-else>Loading…</span>
      </button>
    </header>

    <!-- ==================== SUMMARY ==================== -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-value accent-blue">{{ acceptedAwaitingMyApproval.length }}</span>
        <span class="summary-label">Ready for approval</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value">{{ totalItemsWaiting }}</span>
        <span class="summary-label">Items total</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value accent-amber">{{ oldRequests }}</span>
        <span class="summary-label">Older than 7 days</span>
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
              placeholder="Search by code, store, department, or requester…"
              class="search-input"
            />
            <button
              v-if="searchQuery"
              class="search-clear"
              @click="searchQuery = ''"
              title="Clear search"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="field">
          <label>Store</label>
          <select v-model="filterStore">
            <option value="all">All stores</option>
            <option v-for="s in allStoreOptions" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>Department</label>
          <select v-model="filterDepartment">
            <option value="all">All departments</option>
            <option v-for="d in allDepartmentOptions" :key="d.id" :value="d.id">
              {{ d.name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>Requester</label>
          <select v-model="filterRequester">
            <option value="all">All requesters</option>
            <option v-for="r in allRequesterOptions" :key="r.id" :value="r.id">
              {{ r.name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>From</label>
          <input type="date" v-model="filterDateFrom" />
        </div>
        <div class="field">
          <label>To</label>
          <input type="date" v-model="filterDateTo" />
        </div>
        <button v-if="hasActiveFilters" class="btn-clear" @click="clearFilters">
          Clear all
        </button>
      </div>
    </div>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading requests…</p>
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
          <h2>Requests Ready for Approval</h2>
          <p>
            Supplying store has accepted — click <strong>View</strong> to see who accepted and when, or <strong>Approve</strong> directly.
          </p>
        </div>
        <span class="panel-count">{{ filteredAccepted.length }}</span>
      </header>

      <div v-if="filteredAccepted.length === 0" class="empty">
        <div class="empty-icon">✓</div>
        <div class="empty-text">
          <template v-if="hasActiveFilters">No requests match your filters</template>
          <template v-else>Nothing waiting for your approval</template>
        </div>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-code">Request</th>
              <th class="col-flow">Flow</th>
              <th class="col-dept">Department</th>
              <th class="col-meta">Requested By</th>
              <th class="col-accepted">Approval Window</th>
              <th class="col-waiting">Waiting</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paginatedAccepted" :key="r.id">
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

              <td class="col-dept">
                <span
                  v-if="r.department"
                  class="dept-pill"
                  v-html="highlight(r.department)"
                ></span>
                <span v-else class="dept-empty">—</span>
              </td>

              <td class="col-meta">
                <span v-html="highlight(r.requestedBy)"></span>
              </td>

              <td class="col-accepted">
                <div class="approval-window">
                  <div class="approval-line">
                    <span class="approval-icon">🟢</span>
                    <span class="approval-label">First</span>
                    <span class="meta-date">{{ formatDate(firstAcceptAt(r)) }}</span>
                  </div>
                  <div class="approval-line">
                    <span class="approval-icon">🟠</span>
                    <span class="approval-label">Last</span>
                    <span class="meta-date">{{ formatDate(lastAcceptAt(r)) }}</span>
                  </div>
                </div>
              </td>

              <td class="col-waiting">
                <span :class="['waiting-badge', waitingClass(r)]">
                  {{ waitingLabel(r) }}
                </span>
              </td>

              <td class="col-actions">
                <div class="row-actions">
                  <button
                    class="btn-view"
                    @click="openDetailModal(r)"
                    title="View full request details"
                  >
                    👁 View
                  </button>
                  <button
                    class="btn-approve"
                    @click="openApproveModal(r)"
                    title="Approve this request"
                  >
                    ✓ Approve
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ==================== PAGINATION ==================== -->
      <footer v-if="filteredAccepted.length > 0" class="pagination">
        <div class="pagination-left">
          <span class="pagination-info">
            Showing
            <strong>{{ pageStart }}–{{ pageEnd }}</strong>
            of
            <strong>{{ filteredAccepted.length }}</strong>
            request{{ filteredAccepted.length === 1 ? "" : "s" }}
          </span>

          <div class="page-size-selector">
            <label>Rows per page</label>
            <select v-model.number="pageSize" @change="acceptedPage = 1">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>

        <div class="pagination-right">
          <button
            class="page-btn"
            :disabled="acceptedPage === 1"
            @click="goToPage(1)"
            title="First page"
          >
            ⏮
          </button>
          <button
            class="page-btn"
            :disabled="acceptedPage === 1"
            @click="goToPage(acceptedPage - 1)"
          >
            ← Previous
          </button>

          <div class="page-numbers">
            <button
              v-for="p in visiblePageNumbers"
              :key="p"
              :class="['page-number', { active: p === acceptedPage }]"
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
          </div>

          <button
            class="page-btn"
            :disabled="acceptedPage === acceptedTotalPages"
            @click="goToPage(acceptedPage + 1)"
          >
            Next →
          </button>
          <button
            class="page-btn"
            :disabled="acceptedPage === acceptedTotalPages"
            @click="goToPage(acceptedTotalPages)"
            title="Last page"
          >
            ⏭
          </button>
        </div>
      </footer>
    </section>

    <!-- ==================== DETAIL MODAL ==================== -->
    <transition name="modal-fade">
      <div
        v-if="showDetailModal && detailTarget"
        class="modal-overlay"
        @click.self="closeDetailModal"
      >
        <div class="modal-container detail-modal">
          <div class="modal-header">
            <h3>📋 Request Details</h3>
            <button class="modal-close" @click="closeDetailModal" title="Close">✕</button>
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
                  <span class="summary-label">Department</span>
                  <strong>{{ detailTarget.department || "—" }}</strong>
                </div>
                <div class="summary-cell">
                  <span class="summary-label">Requested By</span>
                  <strong>{{ detailTarget.requestedBy }}</strong>
                </div>
                <div class="summary-cell">
                  <span class="summary-label">Approval Window</span>
                  <strong>
                    {{ formatDate(firstAcceptAt(detailTarget)) }}
                    <span class="window-arrow">→</span>
                    {{ formatDate(lastAcceptAt(detailTarget)) }}
                  </strong>
                </div>
                <div class="summary-cell">
                  <span class="summary-label">Items</span>
                  <strong>{{ detailTarget.items }}</strong>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">
                ✓ Accepted By
                <span class="detail-section-count">
                  {{ detailTarget.acceptedBy.length }} group{{
                    detailTarget.acceptedBy.length === 1 ? "" : "s"
                  }}
                </span>
              </div>
              <div class="detail-table-wrap">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th class="dt-avatar"></th>
                      <th>Group</th>
                      <th>Status</th>
                      <th class="dt-time">Accepted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="g in sortedAcceptedBy(detailTarget)" :key="g.id">
                      <td class="dt-avatar">
                        <div class="avatar">{{ initials(g.name) }}</div>
                      </td>
                      <td>
                        <span class="dt-name">{{ g.name }}</span>
                      </td>
                      <td>
                        <span class="pill accepted">
                          <span class="pill-dot"></span>
                          <span class="pill-status">Accepted</span>
                        </span>
                      </td>
                      <td class="dt-time">
                        <span class="meta-date">{{ formatDate(g.at) }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDetailModal">Close</button>
            <button class="btn-approve" @click="openApproveFromDetail">
              ✓ Approve Request
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== APPROVE CONFIRM MODAL ==================== -->
    <transition name="modal-fade">
      <div
        v-if="showApproveModal && approveTarget"
        class="modal-overlay"
        @click.self="closeApproveModal"
      >
        <div class="modal-container status-modal">
          <div class="modal-header">
            <h3>✅ Confirm Approval</h3>
            <button class="modal-close" @click="closeApproveModal" title="Close">✕</button>
          </div>

          <div class="modal-body">
            <div class="confirmation-icon">✅</div>
            <p class="confirmation-title">
              Are you sure you want to approve this request?
            </p>

            <div class="confirmation-details">
              <div class="detail-row">
                <span class="detail-label">Request:</span>
                <span class="detail-value">{{ approveTarget.code }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">{{ approveTarget.askingStore }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">{{ approveTarget.supplyingStore }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department:</span>
                <span class="detail-value">{{ approveTarget.department || "—" }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested By:</span>
                <span class="detail-value">{{ approveTarget.requestedBy }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Items:</span>
                <span class="detail-value">{{ approveTarget.items }} item(s)</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Accepted By:</span>
                <span class="detail-value">
                  {{ approveTarget.acceptedBy.length }} group{{
                    approveTarget.acceptedBy.length === 1 ? "" : "s"
                  }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Approval Window:</span>
                <span class="detail-value">
                  {{ formatDate(firstAcceptAt(approveTarget)) }}
                  <span class="window-arrow">→</span>
                  {{ formatDate(lastAcceptAt(approveTarget)) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Waiting:</span>
                <span class="detail-value">
                  <span :class="['waiting-badge', waitingClass(approveTarget)]">
                    {{ waitingLabel(approveTarget) }}
                  </span>
                </span>
              </div>
            </div>

            <p class="warning-text">
              ⚠️ This action will mark the request as <strong>approved</strong> and
              cannot be undone.
            </p>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" :disabled="approving" @click="closeApproveModal">
              Cancel
            </button>
            <button class="btn-approve" :disabled="approving" @click="confirmApprove">
              <span v-if="!approving">Confirm Approve</span>
              <span v-else>Approving…</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== TOAST ==================== -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import itemRequestService from '@/stores/itemRequestService'
// 🔥 1. Import your new users service here
import usersService from '@/stores/users' // Adjust the path if necessary

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const loadError = ref('')
const approving = ref(false)

const searchQuery = ref('')
const filterStore = ref('all')
const filterDepartment = ref('all')
const filterRequester = ref('all')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const acceptedPage = ref(1)
const pageSize = ref(5)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

const showDetailModal = ref(false)
const detailTarget = ref(null)
const showApproveModal = ref(false)
const approveTarget = ref(null)

const allStores = ref([])
const allUsers = ref([])
const allDepartments = ref([])

const nowTick = ref(Date.now())
let tickInterval = null

const acceptedAwaitingMyApproval = ref([])

// ================================================================
// TIMESTAMP HELPERS
// ================================================================
const firstAcceptAt = (r) => {
  if (!r?.acceptedBy?.length) return null
  let min = Infinity
  for (const g of r.acceptedBy) {
    const t = g?.at ? new Date(g.at).getTime() : Infinity
    if (t < min) min = t
  }
  return min === Infinity ? null : min
}

const lastAcceptAt = (r) => {
  if (!r?.acceptedBy?.length) return null
  let max = -Infinity
  for (const g of r.acceptedBy) {
    const t = g?.at ? new Date(g.at).getTime() : -Infinity
    if (t > max) max = t
  }
  return max === -Infinity ? null : max
}

const sortedAcceptedBy = (r) =>
  [...(r?.acceptedBy || [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  )

const daysSince = (readyAt) => {
  if (readyAt == null) return null
  const ms = nowTick.value - readyAt
  if (ms < 0) return 0
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

const waitingLabel = (r) => {
  const ready = lastAcceptAt(r)
  if (ready == null) return '—'
  const d = daysSince(ready)
  if (d == null) return '—'
  if (d === 0) return 'Today'
  if (d === 1) return '1 day'
  return `${d} days`
}

const waitingClass = (r) => {
  const ready = lastAcceptAt(r)
  if (ready == null) return 'unknown'
  const d = daysSince(ready)
  if (d == null) return 'unknown'
  if (d === 0) return 'today'
  if (d < 3) return 'fresh'
  if (d < 7) return 'aging'
  return 'old'
}

const formatDate = (dateInput) => {
  if (!dateInput) return ''
  const d = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const initials = (name) => {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const highlight = (text) => {
  const escaped = escapeHtml(text)
  const q = searchQuery.value.trim()
  if (!q) return escaped
  const escapedQuery = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// ================================================================
// LOOKUP LOADERS (Using usersService)
// ================================================================

const loadStores = async () => {
  try {
    const res = await itemRequestService.getActiveStores()
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      allStores.value = res.data.map((s) => ({
        id: String(s.storeId ?? s.id ?? s.code),
        name: s.name || s.code || `Store #${s.storeId ?? s.id}`,
      }))
      return
    }
  } catch (err) {
    console.warn('[Stores] could not load — falling back', err)
  }

  const set = new Map()
  acceptedAwaitingMyApproval.value.forEach((r) => {
    if (r.askingStoreId != null && r.askingStore) {
      set.set(String(r.askingStoreId), { id: String(r.askingStoreId), name: r.askingStore })
    }
    if (r.supplyingStoreId != null && r.supplyingStore) {
      set.set(String(r.supplyingStoreId), { id: String(r.supplyingStoreId), name: r.supplyingStore })
    }
  })
  allStores.value = Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// 🔥 2. Updated to use usersService
const loadUsers = async () => {
  try {
    // Pass a high limit so we get all users for the dropdown
    const res = await usersService.getUsers({ limit: 1000 })
    if (res?.success && Array.isArray(res.data)) {
      allUsers.value = res.data.map((u) => ({
        id: String(u.userId ?? u.id),
        name: u.fullName || u.username || u.email || `User #${u.userId}`
      })).sort((a, b) => a.name.localeCompare(b.name))
      return
    }
  } catch (err) {
    console.warn('[Users] could not load from usersService — falling back', err)
  }

  // Fallback: Build from request rows if service fails
  const set = new Map()
  acceptedAwaitingMyApproval.value.forEach((r) => {
    if (r.requestedById != null && r.requestedBy) {
      set.set(String(r.requestedById), { id: String(r.requestedById), name: r.requestedBy })
    }
  })
  allUsers.value = Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// 🔥 3. Updated to use usersService
const loadDepartments = async () => {
  try {
    const res = await usersService.getDepartments()
    if (res?.success && Array.isArray(res.departments)) {
      allDepartments.value = res.departments.map((d) => ({
        id: String(d.departmentId ?? d.id),
        name: d.name || d.code || `Dept #${d.departmentId}`
      })).sort((a, b) => a.name.localeCompare(b.name))
      return
    }
  } catch (err) {
    console.warn('[Departments] could not load from usersService — falling back', err)
  }

  // Fallback: Build from request rows if service fails
  const set = new Map()
  acceptedAwaitingMyApproval.value.forEach((r) => {
    if (r.departmentId != null && r.department) {
      set.set(String(r.departmentId), { id: String(r.departmentId), name: r.department })
    }
  })
  allDepartments.value = Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// ================================================================
// COMPUTED
// ================================================================
const allStoreOptions = computed(() => allStores.value)
const allRequesterOptions = computed(() => allUsers.value)
const allDepartmentOptions = computed(() => allDepartments.value)

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== '' ||
    filterStore.value !== 'all' ||
    filterDepartment.value !== 'all' ||
    filterRequester.value !== 'all' ||
    filterDateFrom.value !== '' ||
    filterDateTo.value !== ''
)

const filteredAccepted = computed(() => {
  let result = [...acceptedAwaitingMyApproval.value]

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter((r) => {
      const haystack = [r.code, r.askingStore, r.supplyingStore, r.department, r.requestedBy]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }

  if (filterStore.value !== 'all') {
    result = result.filter(
      (r) =>
        String(r.askingStoreId) === String(filterStore.value) ||
        String(r.supplyingStoreId) === String(filterStore.value)
    )
  }
  if (filterDepartment.value !== 'all') {
    result = result.filter((r) => String(r.departmentId) === String(filterDepartment.value))
  }
  if (filterRequester.value !== 'all') {
    result = result.filter((r) => String(r.requestedById) === String(filterRequester.value))
  }

  if (filterDateFrom.value) {
    const from = new Date(filterDateFrom.value)
    from.setHours(0, 0, 0, 0)
    result = result.filter((r) => {
      const last = lastAcceptAt(r)
      return last != null && last >= from.getTime()
    })
  }
  if (filterDateTo.value) {
    const to = new Date(filterDateTo.value)
    to.setHours(23, 59, 59, 999)
    result = result.filter((r) => {
      const first = firstAcceptAt(r)
      return first != null && first <= to.getTime()
    })
  }

  return result
})

const acceptedTotalPages = computed(
  () => Math.ceil(filteredAccepted.value.length / pageSize.value) || 1
)
const paginatedAccepted = computed(() => {
  const start = (acceptedPage.value - 1) * pageSize.value
  return filteredAccepted.value.slice(start, start + pageSize.value)
})
const pageStart = computed(() =>
  filteredAccepted.value.length === 0 ? 0 : (acceptedPage.value - 1) * pageSize.value + 1
)
const pageEnd = computed(() =>
  Math.min(acceptedPage.value * pageSize.value, filteredAccepted.value.length)
)

const visiblePageNumbers = computed(() => {
  const total = acceptedTotalPages.value
  const current = acceptedPage.value
  const maxVisible = 5
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1)
  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  const end = Math.min(total, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const goToPage = (page) => {
  if (page < 1) page = 1
  if (page > acceptedTotalPages.value) page = acceptedTotalPages.value
  acceptedPage.value = page
}

const totalItemsWaiting = computed(() =>
  acceptedAwaitingMyApproval.value.reduce((sum, r) => sum + (r.items || 0), 0)
)

const oldRequests = computed(() => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return acceptedAwaitingMyApproval.value.filter((r) => {
    const last = lastAcceptAt(r)
    return last != null && last < sevenDaysAgo
  }).length
})

// ================================================================
// MODALS & ACTIONS
// ================================================================
const openDetailModal = (req) => {
  detailTarget.value = req
  showDetailModal.value = true
}
const closeDetailModal = () => {
  showDetailModal.value = false
  detailTarget.value = null
}
const openApproveFromDetail = () => {
  const target = detailTarget.value
  closeDetailModal()
  if (target) openApproveModal(target)
}
const openApproveModal = (req) => {
  approveTarget.value = req
  showApproveModal.value = true
}
const closeApproveModal = () => {
  if (approving.value) return
  showApproveModal.value = false
  approveTarget.value = null
}

const confirmApprove = async () => {
  if (!approveTarget.value || approving.value) return
  const row = approveTarget.value

  approving.value = true
  try {
    const res = await itemRequestService.approveRequest(row.id)
    if (!res?.success) {
      showToastMessage(res?.error || 'Failed to approve request', 'error')
      return
    }

    showToastMessage(`Approved ${row.code}`, 'success')
    acceptedAwaitingMyApproval.value = acceptedAwaitingMyApproval.value.filter((r) => r.id !== row.id)
    if (acceptedPage.value > acceptedTotalPages.value) {
      acceptedPage.value = acceptedTotalPages.value
    }
    closeApproveModal()
  } catch (err) {
    console.error('confirmApprove error:', err)
    showToastMessage('Unexpected error while approving', 'error')
  } finally {
    approving.value = false
  }
}

// ================================================================
// FETCH & LIFECYCLE
// ================================================================
const fetchAwaiting = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await itemRequestService.getAwaitingMyApproval({
      page: 1,
      limit: 500,
    })

    if (!res?.success) {
      loadError.value = res?.error || 'Failed to load awaiting-approval requests'
      acceptedAwaitingMyApproval.value = []
      return
    }

    acceptedAwaitingMyApproval.value = res.data?.requests || []
  } catch (err) {
    console.error('fetchAwaiting error:', err)
    loadError.value = 'Unexpected error while fetching requests'
    acceptedAwaitingMyApproval.value = []
  } finally {
    loading.value = false
    nowTick.value = Date.now()
  }
}

const refresh = async () => {
  await fetchAwaiting()
  await Promise.all([loadUsers(), loadDepartments()])
  if (allStores.value.length === 0) await loadStores()
  showToastMessage('Refreshed', 'info')
}

const clearFilters = () => {
  searchQuery.value = ''
  filterStore.value = 'all'
  filterDepartment.value = 'all'
  filterRequester.value = 'all'
  filterDateFrom.value = ''
  filterDateTo.value = ''
  acceptedPage.value = 1
  showToastMessage('Filters cleared', 'info')
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

watch(
  [searchQuery, filterStore, filterDepartment, filterRequester, filterDateFrom, filterDateTo],
  () => {
    acceptedPage.value = 1
  }
)
watch(pageSize, () => {
  acceptedPage.value = 1
})

const onEscKey = (e) => {
  if (e.key !== 'Escape') return
  if (showApproveModal.value) closeApproveModal()
  else if (showDetailModal.value) closeDetailModal()
}

onMounted(async () => {
  window.addEventListener('keydown', onEscKey)

  await fetchAwaiting()
  
  // Loads real user & department lists from usersService
  await Promise.all([loadUsers(), loadDepartments(), loadStores()])

  tickInterval = setInterval(() => {
    nowTick.value = Date.now()
  }, 60_000)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscKey)
  if (tickInterval) clearInterval(tickInterval)
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
  color: #0f172a;
}
.header-sub { font-size: 14px; color: #64748b; margin: 0; }

.btn-refresh {
  padding: 9px 18px;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
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
  flex-wrap: wrap;
}
.summary-item { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 120px; }
.summary-value { font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
.summary-value.accent-blue { color: #2563eb; }
.summary-value.accent-amber { color: #d97706; }
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
.field select,
.field input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #0f172a;
  min-width: 150px;
  outline: none;
  transition: border 0.15s, box-shadow 0.15s;
}
.field select:focus,
.field input:focus {
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
}

.search-field { flex: 1; min-width: 260px; }
.search-input-wrap { position: relative; display: flex; align-items: center; }
.search-icon {
  position: absolute;
  left: 12px;
  font-size: 13px;
  color: #94a3b8;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 8px 34px 8px 34px !important;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #0f172a;
  outline: none;
  transition: border 0.15s, box-shadow 0.15s;
}
.search-input:focus {
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
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
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.search-clear:hover { background: #e2e8f0; color: #0f172a; }

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
.btn-clear:hover { background: #f8fafc; color: #0f172a; }

:deep(.search-highlight) {
  background: #fef08a;
  color: #713f12;
  padding: 0 1px;
  border-radius: 2px;
}

/* LOADING */
.loading {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading p { color: #64748b; font-size: 14px; margin: 0; }

/* PANEL */
.panel { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  gap: 16px;
}
.panel-header h2 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #0f172a;
  letter-spacing: -0.2px;
}
.panel-header p { font-size: 13px; color: #64748b; margin: 0; line-height: 1.4; }
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
  color: #0f172a;
}

/* TABLE */
.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 1000px;
}
.data-table thead {
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}
.data-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
  border-bottom: 1px solid #e5e7eb;
}
.data-table td {
  padding: 14px 16px;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fafbfc; }

.col-code { width: 170px; }
.col-flow { min-width: 240px; }
.col-dept { min-width: 140px; }
.col-meta { width: 140px; }
.col-accepted { min-width: 190px; }
.col-waiting { width: 110px; text-align: center; }
.col-actions { width: 200px; text-align: right; }

.code {
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

.flow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  font-weight: 500;
  flex-wrap: wrap;
}
.arrow { color: #cbd5e1; font-size: 14px; }

.dept-pill {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  color: #7c2d12;
  background: #ffedd5;
  padding: 3px 10px;
  border-radius: 8px;
  white-space: nowrap;
}
.dept-empty { color: #cbd5e1; font-size: 13px; }

.meta-date { font-size: 12px; color: #64748b; white-space: nowrap; }

/* Approval window */
.approval-window { display: flex; flex-direction: column; gap: 3px; }
.approval-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.approval-icon { font-size: 10px; }
.approval-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  min-width: 28px;
}

/* Waiting badge */
.waiting-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  white-space: nowrap;
}
.waiting-badge.today {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.waiting-badge.fresh {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}
.waiting-badge.aging {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}
.waiting-badge.old {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.waiting-badge.unknown {
  background: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e5e7eb;
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
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.btn-view:hover { background: #f1f5f9; border-color: #94a3b8; }

.btn-approve {
  padding: 7px 14px;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.btn-approve:hover:not(:disabled) { background: #15803d; }
.btn-approve:active { transform: scale(0.97); }
.btn-approve:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  padding: 8px 18px;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Empty */
.empty { padding: 56px 20px; text-align: center; }
.empty-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #dcfce7;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}
.empty-text { color: #94a3b8; font-size: 14px; }

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  gap: 16px;
  flex-wrap: wrap;
}
.pagination-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.pagination-info { font-size: 13px; color: #64748b; }
.pagination-info strong { color: #0f172a; font-weight: 600; }

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}
.page-size-selector label { font-weight: 500; }
.page-size-selector select {
  padding: 5px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  color: #0f172a;
  cursor: pointer;
  outline: none;
}

.pagination-right { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.page-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12.5px;
  color: #334155;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.page-numbers { display: flex; gap: 4px; margin: 0 4px; }
.page-number {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}
.page-number:hover { background: #f8fafc; border-color: #cbd5e1; }
.page-number.active {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
  font-weight: 600;
}

/* MODALS */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal-container {
  background: white;
  border-radius: 14px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
}
.detail-modal { max-width: 720px; }
.status-modal { max-width: 500px; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}
.modal-header h3 { font-size: 16px; font-weight: 700; margin: 0; color: #0f172a; }
.modal-close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
}
.modal-close:hover { background: #f1f5f9; color: #0f172a; }
.modal-body { padding: 22px; overflow-y: auto; flex: 1 1 auto; }
.modal-footer {
  padding: 16px 22px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

/* Detail modal */
.detail-summary {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 18px;
}
.detail-summary-row { margin-bottom: 10px; }
.detail-summary-row:last-child { margin-bottom: 0; }
.detail-code {
  display: inline-block;
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 4px 12px;
  border-radius: 6px;
}
.detail-flow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  flex-wrap: wrap;
}
.detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 14px;
}
.summary-cell { display: flex; flex-direction: column; gap: 3px; }
.summary-cell .summary-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.summary-cell strong { font-size: 13px; color: #0f172a; font-weight: 600; }
.window-arrow { color: #94a3b8; margin: 0 4px; }

.detail-section { margin-top: 6px; }
.detail-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 10px;
}
.detail-section-count {
  display: inline-block;
  padding: 2px 10px;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}
.detail-table-wrap { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.detail-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.detail-table thead { background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
.detail-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid #e5e7eb;
}
.detail-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.detail-table tbody tr:last-child td { border-bottom: none; }
.dt-avatar { width: 44px; }
.dt-time { text-align: right; width: 150px; }
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dcfce7;
  color: #166534;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.dt-name { font-size: 13px; font-weight: 600; color: #0f172a; }

/* Pills (used in detail modal) */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid transparent;
}
.pill-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.pill.accepted {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.pill.accepted .pill-dot { background: #16a34a; }

/* Confirm modal */
.confirmation-icon { font-size: 44px; text-align: center; margin-bottom: 10px; }
.confirmation-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin: 0 0 16px;
}
.confirmation-details {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
}
.detail-row:last-child { border-bottom: none; }
.detail-label { font-weight: 500; color: #64748b; font-size: 12.5px; flex-shrink: 0; }
.detail-value {
  color: #1e293b;
  font-weight: 600;
  font-size: 12.5px;
  text-align: right;
  word-break: break-word;
}
.warning-text {
  color: #92400e;
  font-weight: 500;
  text-align: center;
  padding: 10px 14px;
  background: #fffbeb;
  border-radius: 8px;
  border: 1px solid #fef3c7;
  font-size: 12.5px;
  line-height: 1.5;
}

/* Modal transitions */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-active .modal-container {
  animation: modal-in 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes modal-in {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  background: #0f172a;
  color: white;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 1100;
}
.toast.success { background: #16a34a; }
.toast.error { background: #dc2626; }
.toast.info { background: #0f172a; }
.toast.warning { background: #d97706; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }

/* Responsive */
@media (max-width: 900px) {
  .summary-strip { padding: 16px 20px; gap: 16px; }
  .summary-divider { display: none; }
  .summary-item { min-width: 100px; }
  .detail-summary-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .pagination { flex-direction: column; align-items: stretch; }
  .pagination-left,
  .pagination-right { justify-content: center; }
}
@media (max-width: 640px) {
  .page { padding: 20px 16px; }
  .header-main h1 { font-size: 22px; }
  .toolbar-left { flex-direction: column; align-items: stretch; }
  .field select, .field input, .search-field { width: 100%; min-width: 0; }
  .btn-clear { width: 100%; }
  .panel-header { flex-direction: column; }
  .detail-summary-grid { grid-template-columns: 1fr; }
  .modal-container { max-width: 100% !important; }
}
</style>