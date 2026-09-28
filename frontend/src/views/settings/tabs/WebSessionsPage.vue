<!-- FILE: src/views/settings/tabs/WebSessionsPage.vue -->
<template>
  <div class="web-sessions-page">

    <!-- ==================== HEADER ==================== -->
    <header class="ws-header">
      <div class="ws-header__left">
        <h2 class="ws-title">Browser Sessions</h2>
        <p class="ws-subtitle">
          Every active login from a web browser. <strong>Terminate</strong> signs a browser out.
          <strong>Deactivate</strong> blocks the user from logging in anywhere.
        </p>
      </div>
      <div class="ws-header__right">
        <button class="btn btn-secondary" :disabled="loading" @click="loadAll" type="button">
          <span v-if="loading">Loading…</span>
          <span v-else class="btn-with-icon">
            <IconRefresh /> Refresh
          </span>
        </button>
      </div>
    </header>

    <!-- ==================== STATS ==================== -->
    <section class="stats-row">
      <button
        v-for="stat in statsCards"
        :key="stat.key"
        class="stat-card"
        :class="[`stat-card--${stat.variant}`, { 'stat-card--active': filters.status === stat.filterValue }]"
        @click="applyStatFilter(stat.filterValue)"
        type="button"
      >
        <span class="stat-card__label">{{ stat.label }}</span>
        <span class="stat-card__value">{{ stat.value }}</span>
      </button>
    </section>

    <!-- ==================== FILTERS ==================== -->
    <section class="filters-bar">
      <div class="filter-group filter-group--grow">
        <label class="filter-label">Search</label>
        <input
          v-model="filters.search"
          type="text"
          class="filter-input"
          placeholder="Username, name, or email…"
          @input="debouncedLoad"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Status</label>
        <select v-model="filters.status" class="filter-select" @change="reloadFromFirstPage">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Browser</label>
        <select v-model="filters.browser" class="filter-select" @change="reloadFromFirstPage">
          <option value="all">Any</option>
          <option v-for="b in browserOptions" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">OS</label>
        <select v-model="filters.os" class="filter-select" @change="reloadFromFirstPage">
          <option value="all">Any</option>
          <option v-for="o in osOptions" :key="o" :value="o">{{ o }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Last seen</label>
        <select v-model="filters.lastSeen" class="filter-select" @change="reloadFromFirstPage">
          <option value="all">Any time</option>
          <option value="5m">Last 5 min</option>
          <option value="1h">Last hour</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      <button
        v-if="hasActiveFilters"
        class="btn btn-ghost filter-reset"
        @click="resetFilters"
        type="button"
      >
        Clear filters
      </button>
    </section>

    <!-- ==================== BULK ACTION BAR ==================== -->
    <transition name="slide-down">
      <div v-if="selectedIds.size > 0" class="bulk-bar">
        <span class="bulk-bar__count">{{ selectedIds.size }} selected</span>
        <div class="bulk-bar__actions">
          <button class="btn btn-danger" @click="bulkTerminate" :disabled="actionLoading" type="button">
            <span class="btn-with-icon"><IconPower /> Terminate selected</span>
          </button>
          <button class="btn btn-success" @click="bulkAllow" :disabled="actionLoading" type="button">
            <span class="btn-with-icon"><IconRefresh /> Allow selected</span>
          </button>
          <button class="btn btn-ghost" @click="clearSelection" type="button">Deselect</button>
        </div>
      </div>
    </transition>

    <!-- ==================== TABLE ==================== -->
    <section class="table-wrap">
      <table class="ws-table">
        <thead>
          <tr>
            <th class="col-check">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th @click="setSort('user')" class="sortable">
              User <span class="sort-arrow">{{ sortIndicator('user') }}</span>
            </th>
            <th @click="setSort('browser')" class="sortable">
              Browser <span class="sort-arrow">{{ sortIndicator('browser') }}</span>
            </th>
            <th>OS</th>
            <th class="mono-col">IP</th>
            <th @click="setSort('lastSeenAt')" class="sortable">
              Last seen <span class="sort-arrow">{{ sortIndicator('lastSeenAt') }}</span>
            </th>
            <th @click="setSort('loggedInAt')" class="sortable">
              Signed in <span class="sort-arrow">{{ sortIndicator('loggedInAt') }}</span>
            </th>
            <th>Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading && sessions.length === 0">
            <td colspan="9" class="empty-cell">Loading sessions…</td>
          </tr>
          <tr v-else-if="sessions.length === 0">
            <td colspan="9" class="empty-cell">No sessions match the current filters.</td>
          </tr>

          <tr
            v-for="s in sessions"
            :key="s.id"
            class="ws-row"
            :class="{ 'ws-row--selected': selectedIds.has(s.id) }"
          >
            <td class="col-check">
              <input
                type="checkbox"
                :checked="selectedIds.has(s.id)"
                @change="toggleSelect(s.id)"
              />
            </td>
            <td>
              <div class="user-cell">
                <div class="user-name">
                  {{ s.user?.fullName || s.user?.username || 'Unknown' }}
                </div>
                <div class="user-meta">
                  @{{ s.user?.username }} · {{ s.user?.role || '—' }}
                </div>
              </div>
            </td>
            <td>
              <div class="browser-cell">
                <span class="browser-icon" :style="{ color: browserColor(s.browser) }">
                  <IconBrowser />
                </span>
                <span>{{ s.browser || '—' }}</span>
              </div>
            </td>
            <td>{{ s.os || '—' }}</td>
            <td class="mono-col">{{ s.lastIp || s.ip || '—' }}</td>
            <td><span :title="s.lastSeenAt">{{ fmtRelative(s.lastSeenAt) }}</span></td>
            <td><span :title="s.loggedInAt">{{ fmtRelative(s.loggedInAt) }}</span></td>
            <td>
              <span :class="['status-pill', `status-pill--${s.status}`]">{{ s.status }}</span>
            </td>
            <td class="col-actions">
              <div class="row-actions">
                <button
                  v-if="s.status === 'active'"
                  class="action-btn action-btn--danger"
                  title="Terminate this session"
                  @click="openTerminate(s)"
                  type="button"
                >
                  <IconPower />
                </button>

                <button
                  v-if="s.status === 'terminated'"
                  class="action-btn action-btn--success"
                  title="Allow this session again"
                  @click="allowOne(s)"
                  type="button"
                >
                  <IconRefresh />
                </button>

                <button
                  class="action-btn action-btn--warn"
                  title="Terminate all sessions for this user"
                  @click="openTerminateAll(s)"
                  type="button"
                >
                  <IconPowerAll />
                </button>

                <button
                  class="action-btn action-btn--block"
                  title="Deactivate this user's account (blocks all access)"
                  @click="openDeactivate(s)"
                  type="button"
                >
                  <IconBlock />
                </button>

                <button
                  class="action-btn action-btn--ghost"
                  title="Delete this row"
                  @click="openDelete(s)"
                  type="button"
                >
                  <IconTrash />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ==================== PAGINATION ==================== -->
    <footer class="pagination" v-if="pagination.total > 0">
      <div class="pagination__left">
        <label class="pagination__size">
          <span>Per page:</span>
          <select v-model.number="pagination.limit" @change="reloadFromFirstPage">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
        <span class="pagination__summary">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ pagination.total }}
        </span>
      </div>

      <div class="pagination__right">
        <button class="page-btn" :disabled="pagination.page <= 1 || loading" @click="setPage(1)" title="First page">«</button>
        <button class="page-btn" :disabled="pagination.page <= 1 || loading" @click="setPage(pagination.page - 1)">‹</button>

        <button
          v-for="p in pageNumbers"
          :key="p"
          class="page-btn"
          :class="{ 'page-btn--active': p === pagination.page }"
          :disabled="p === pagination.page || loading"
          @click="setPage(p)"
        >{{ p }}</button>

        <button class="page-btn" :disabled="pagination.page >= pagination.totalPages || loading" @click="setPage(pagination.page + 1)">›</button>
        <button class="page-btn" :disabled="pagination.page >= pagination.totalPages || loading" @click="setPage(pagination.totalPages)" title="Last page">»</button>
      </div>
    </footer>

    <!-- ==================== TERMINATE ONE MODAL ==================== -->
    <div v-if="terminateTarget" class="modal-backdrop" @click.self="closeTerminate">
      <div class="modal">
        <header class="modal__head">
          <h3>Terminate this session?</h3>
          <button class="modal__close" @click="closeTerminate" aria-label="Close">×</button>
        </header>
        <p class="modal__sub">
          {{ terminateTarget.browser }} on {{ terminateTarget.os }} ·
          <strong>{{ terminateTarget.user?.fullName || terminateTarget.user?.username }}</strong>
        </p>
        <p class="modal__notice modal__notice--warn">
          The browser is signed out on its next request. The user can log back in afterwards.
        </p>
        <label class="modal__field">
          <span>Reason (optional)</span>
          <input
            v-model="terminateReason"
            type="text"
            class="filter-input"
            placeholder="e.g. Password reset, suspicious activity"
          />
        </label>
        <footer class="modal__actions">
          <button class="btn btn-secondary" @click="closeTerminate" type="button">Cancel</button>
          <button class="btn btn-danger" :disabled="actionLoading" @click="doTerminate" type="button">
            {{ actionLoading ? 'Terminating…' : 'Terminate' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== TERMINATE ALL MODAL ==================== -->
    <div v-if="terminateAllTarget" class="modal-backdrop" @click.self="closeTerminateAll">
      <div class="modal">
        <header class="modal__head">
          <h3>Terminate all sessions?</h3>
          <button class="modal__close" @click="closeTerminateAll" aria-label="Close">×</button>
        </header>
        <p class="modal__sub">
          Every active browser session for
          <strong>{{ terminateAllTarget.user?.fullName || terminateAllTarget.user?.username }}</strong>
          will be signed out.
        </p>
        <p class="modal__notice modal__notice--warn">
          They can still log back in from any browser. To permanently block access, use
          <strong>Deactivate user</strong> instead.
        </p>
        <label class="modal__field">
          <span>Reason (optional)</span>
          <input v-model="terminateAllReason" type="text" class="filter-input" placeholder="e.g. Security review" />
        </label>
        <footer class="modal__actions">
          <button class="btn btn-secondary" @click="closeTerminateAll" type="button">Cancel</button>
          <button class="btn btn-danger" :disabled="actionLoading" @click="doTerminateAll" type="button">
            {{ actionLoading ? 'Terminating…' : 'Terminate all' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== DEACTIVATE USER MODAL ==================== -->
    <div v-if="deactivateTarget" class="modal-backdrop" @click.self="closeDeactivate">
      <div class="modal">
        <header class="modal__head">
          <h3>Deactivate this user?</h3>
          <button class="modal__close" @click="closeDeactivate" aria-label="Close">×</button>
        </header>
        <p class="modal__sub">
          <strong>{{ deactivateTarget.user?.fullName || deactivateTarget.user?.username }}</strong>
          will be blocked from logging in on any device — web, mobile, and any new browser.
        </p>
        <p class="modal__notice modal__notice--block">
          This is the strongest block available. Their current sessions will be terminated
          immediately. Reactivate the account at any time from the Users page.
        </p>
        <p class="modal__checklist">What will happen when you confirm:</p>
        <ul class="modal__checklist-items">
          <li>All of their active sessions are terminated</li>
          <li>They are signed out on their next request</li>
          <li>Logging in again is blocked everywhere</li>
          <li>The account stays in the system — deactivate is reversible</li>
        </ul>
        <label class="modal__field">
          <span>Reason (optional)</span>
          <input
            v-model="deactivateReason"
            type="text"
            class="filter-input"
            placeholder="e.g. Employee offboarding"
          />
        </label>
        <footer class="modal__actions">
          <button class="btn btn-secondary" @click="closeDeactivate" type="button">Cancel</button>
          <button class="btn btn-danger" :disabled="actionLoading" @click="doDeactivate" type="button">
            {{ actionLoading ? 'Deactivating…' : 'Deactivate & sign out everywhere' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== DELETE MODAL ==================== -->
    <div v-if="deleteTarget" class="modal-backdrop" @click.self="closeDelete">
      <div class="modal">
        <header class="modal__head">
          <h3>Delete this session row?</h3>
          <button class="modal__close" @click="closeDelete" aria-label="Close">×</button>
        </header>
        <p class="modal__sub">
          {{ deleteTarget.browser }} on {{ deleteTarget.os }} ·
          <strong>{{ deleteTarget.user?.fullName || deleteTarget.user?.username }}</strong>
        </p>
        <p class="modal__notice modal__notice--warn">
          Removes the row from the audit trail. Does <strong>not</strong> sign the browser out —
          use Terminate first if you want to kick them.
        </p>
        <footer class="modal__actions">
          <button class="btn btn-secondary" @click="closeDelete" type="button">Cancel</button>
          <button class="btn btn-danger" :disabled="actionLoading" @click="doDelete" type="button">
            {{ actionLoading ? 'Deleting…' : 'Delete' }}
          </button>
        </footer>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <transition name="toast">
      <div v-if="toast.message" :class="['toast', `toast--${toast.type}`]">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, h } from 'vue'
import api from '@/stores/interceptor'

// ==================== INLINE SVG ICONS ====================
const makeIcon = (paths: string[], size = 16) =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      style: 'display:block;',
    },
    paths.map((d) => h('path', { d }))
  )

// Power / terminate one session
const IconPower = () =>
  makeIcon([
    'M12 2v10',
    'M18.36 6.64a9 9 0 1 1-12.73 0',
  ])

// Refresh / allow again
const IconRefresh = () =>
  makeIcon([
    'M23 4v6h-6',
    'M1 20v-6h6',
    'M3.51 9a9 9 0 0 1 14.85-3.36L23 10',
    'M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  ])

// Double power / terminate all for user
const IconPowerAll = () =>
  makeIcon([
    'M12 2v8',
    'M5.5 8.5a9 9 0 1 0 13 0',
    'M19 15v4',
    'M17 17h4',
  ])

// Block / deactivate user account
const IconBlock = () =>
  makeIcon([
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
    'M4.93 4.93l14.14 14.14',
  ])

// Trash / delete row
const IconTrash = () =>
  makeIcon([
    'M3 6h18',
    'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  ])

// Generic browser (globe)
const IconBrowser = () =>
  makeIcon([
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
    'M2 12h20',
    'M12 2a15.3 15.3 0 0 1 0 20',
    'M12 2a15.3 15.3 0 0 0 0 20',
  ])

// ==================== TYPES ====================
interface WebSessionUser {
  userId: number
  username: string
  fullName: string
  email: string
  role: string | null
}

interface WebSession {
  id: number
  sessionId: string
  deviceId: string | null
  browser: string | null
  os: string | null
  deviceName: string | null
  ip: string | null
  lastIp: string | null
  status: 'active' | 'terminated' | 'expired'
  loggedInAt: string
  lastSeenAt: string
  terminatedAt: string | null
  terminatedReason: string | null
  user: WebSessionUser | null
}

// ==================== STATE ====================
const loading = ref(false)
const actionLoading = ref(false)

const sessions = ref<WebSession[]>([])
const stats = reactive({
  total: 0,
  active: 0,
  activeNow: 0,
  activeToday: 0,
  terminated: 0,
})

const filters = reactive({
  search: '',
  status: 'all' as 'all' | 'active' | 'terminated' | 'expired',
  browser: 'all',
  os: 'all',
  lastSeen: 'all' as 'all' | '5m' | '1h' | '24h' | '7d',
})

const sort = reactive({
  by: 'lastSeenAt' as 'user' | 'browser' | 'lastSeenAt' | 'loggedInAt',
  dir: 'desc' as 'asc' | 'desc',
})

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 25,
  totalPages: 1,
})

const selectedIds = ref<Set<number>>(new Set())

// Modal targets
const terminateTarget = ref<WebSession | null>(null)
const terminateReason = ref('')

const terminateAllTarget = ref<WebSession | null>(null)
const terminateAllReason = ref('')

const deactivateTarget = ref<WebSession | null>(null)
const deactivateReason = ref('')

const deleteTarget = ref<WebSession | null>(null)

const toast = reactive({ message: '', type: 'success' as 'success' | 'error' })

// Dynamic filter option pools
const browserOptions = ref<string[]>([])
const osOptions = ref<string[]>([])

// ==================== COMPUTED ====================
const statsCards = computed(() => [
  { key: 'total',       label: 'Total sessions', value: stats.total,       variant: 'neutral', filterValue: 'all' },
  { key: 'activeNow',   label: 'Active now',     value: stats.activeNow,   variant: 'success', filterValue: 'active' },
  { key: 'activeToday', label: 'Active today',   value: stats.activeToday, variant: 'info',    filterValue: 'active' },
  { key: 'terminated',  label: 'Terminated',     value: stats.terminated,  variant: 'danger',  filterValue: 'terminated' },
])

const hasActiveFilters = computed(() =>
  filters.search.trim() !== '' ||
  filters.status !== 'all' ||
  filters.browser !== 'all' ||
  filters.os !== 'all' ||
  filters.lastSeen !== 'all'
)

const isAllSelected = computed(() =>
  sessions.value.length > 0 && sessions.value.every(s => selectedIds.value.has(s.id))
)
const someSelected = computed(() =>
  sessions.value.some(s => selectedIds.value.has(s.id)) && !isAllSelected.value
)

const rangeStart = computed(() =>
  pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1
)
const rangeEnd = computed(() =>
  Math.min(pagination.page * pagination.limit, pagination.total)
)

const pageNumbers = computed(() => {
  const total = pagination.totalPages
  const current = pagination.page
  const win = 2
  const pages: number[] = []
  const start = Math.max(1, current - win)
  const end = Math.min(total, current + win)
  for (let p = start; p <= end; p++) pages.push(p)
  return pages
})

// ==================== HELPERS ====================
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.message = message
  toast.type = type
  window.setTimeout(() => { toast.message = '' }, 3000)
}

const browserColor = (browser: string | null): string => {
  if (!browser) return '#94a3b8'
  const b = browser.toLowerCase()
  if (b.includes('chrome')) return '#10b981'
  if (b.includes('firefox')) return '#f97316'
  if (b.includes('safari')) return '#3b82f6'
  if (b.includes('edge')) return '#0ea5e9'
  if (b.includes('opera')) return '#ef4444'
  return '#94a3b8'
}

const fmtRelative = (ts: string | null): string => {
  if (!ts) return '—'
  const t = new Date(ts).getTime()
  const sec = Math.floor((Date.now() - t) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(ts).toLocaleDateString()
}

// ==================== DATA LOADING ====================
const buildQueryParams = (): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination.page,
    limit: pagination.limit,
    sortBy: sort.by,
    sortOrder: sort.dir.toUpperCase(),
  }
  if (filters.status !== 'all') params.status = filters.status
  if (filters.search.trim()) params.search = filters.search.trim()
  if (filters.browser !== 'all') params.browser = filters.browser
  if (filters.os !== 'all') params.os = filters.os
  if (filters.lastSeen !== 'all') params.lastSeenWithin = filters.lastSeen
  return params
}

const loadSessions = async () => {
  loading.value = true
  try {
    const res = await api.get('/admin/web-sessions', { params: buildQueryParams() })
    if (res.data.success) {
      sessions.value = res.data.data || []
      const p = res.data.pagination || {}
      pagination.total = p.total ?? sessions.value.length
      pagination.page = p.page ?? 1
      pagination.limit = p.limit ?? pagination.limit
      pagination.totalPages = p.totalPages ?? 1
      refreshOptionsFrom(sessions.value)
    }
  } catch (e: any) {
    if (e.response?.status === 403) {
      showToast('You need admin privileges to view web sessions.', 'error')
    } else {
      showToast(e.response?.data?.error || 'Failed to load sessions', 'error')
    }
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await api.get('/admin/web-sessions/stats')
    if (res.data.success) Object.assign(stats, res.data.data)
  } catch {
    // non-critical
  }
}

const loadAll = async () => {
  await Promise.all([loadSessions(), loadStats()])
}

let debounceTimer: number | undefined
const debouncedLoad = () => {
  if (debounceTimer) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    pagination.page = 1
    loadSessions()
  }, 350)
}

const reloadFromFirstPage = () => {
  pagination.page = 1
  clearSelection()
  loadSessions()
}

const refreshOptionsFrom = (rows: WebSession[]) => {
  const b = new Set(browserOptions.value)
  const o = new Set(osOptions.value)
  rows.forEach(r => {
    if (r.browser) b.add(r.browser)
    if (r.os) o.add(r.os)
  })
  browserOptions.value = Array.from(b).sort()
  osOptions.value = Array.from(o).sort()
}

// ==================== SELECTION ====================
const toggleSelect = (id: number) => {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(sessions.value.map(s => s.id))
  }
}

const clearSelection = () => {
  selectedIds.value = new Set()
}

// ==================== SORTING / PAGINATION ====================
const setSort = (by: typeof sort.by) => {
  if (sort.by === by) {
    sort.dir = sort.dir === 'asc' ? 'desc' : 'asc'
  } else {
    sort.by = by
    sort.dir = 'desc'
  }
  reloadFromFirstPage()
}

const sortIndicator = (by: typeof sort.by): string => {
  if (sort.by !== by) return '↕'
  return sort.dir === 'asc' ? '↑' : '↓'
}

const setPage = (p: number) => {
  if (p < 1 || p > pagination.totalPages) return
  pagination.page = p
  clearSelection()
  loadSessions()
}

// ==================== FILTER HELPERS ====================
const applyStatFilter = (value: string) => {
  filters.status = value as typeof filters.status
  reloadFromFirstPage()
}

const resetFilters = () => {
  filters.search = ''
  filters.status = 'all'
  filters.browser = 'all'
  filters.os = 'all'
  filters.lastSeen = 'all'
  reloadFromFirstPage()
}

// ==================== ACTION: TERMINATE ONE ====================
const openTerminate = (s: WebSession) => {
  terminateTarget.value = s
  terminateReason.value = ''
}
const closeTerminate = () => {
  terminateTarget.value = null
  terminateReason.value = ''
}
const doTerminate = async () => {
  if (!terminateTarget.value) return
  actionLoading.value = true
  try {
    const res = await api.post(
      `/admin/web-sessions/${terminateTarget.value.id}/terminate`,
      { reason: terminateReason.value.trim() || undefined }
    )
    if (res.data.success) {
      showToast('Session terminated')
      closeTerminate()
      await loadAll()
    }
  } catch (e: any) {
    showToast(e.response?.data?.error || 'Failed to terminate', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==================== ACTION: TERMINATE ALL FOR USER ====================
const openTerminateAll = (s: WebSession) => {
  terminateAllTarget.value = s
  terminateAllReason.value = ''
}
const closeTerminateAll = () => {
  terminateAllTarget.value = null
  terminateAllReason.value = ''
}
const doTerminateAll = async () => {
  if (!terminateAllTarget.value?.user?.userId) return
  actionLoading.value = true
  try {
    const res = await api.post(
      `/admin/users/${terminateAllTarget.value.user.userId}/terminate-all-sessions`,
      { reason: terminateAllReason.value.trim() || 'All sessions terminated by admin' }
    )
    if (res.data.success) {
      showToast(res.data.message || 'Sessions terminated')
      closeTerminateAll()
      await loadAll()
    }
  } catch (e: any) {
    showToast(e.response?.data?.error || 'Failed to terminate', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==================== ACTION: DEACTIVATE USER ====================
const openDeactivate = (s: WebSession) => {
  deactivateTarget.value = s
  deactivateReason.value = ''
}
const closeDeactivate = () => {
  deactivateTarget.value = null
  deactivateReason.value = ''
}
const doDeactivate = async () => {
  const target = deactivateTarget.value
  if (!target?.user?.userId) return
  actionLoading.value = true

  const reason = deactivateReason.value.trim() || 'Account deactivated by admin'

  try {
    // 1. Deactivate the user account
    await api.put(`/users/${target.user.userId}/deactivate`)

    // 2. Terminate every web session for that user
    await api.post(
      `/admin/users/${target.user.userId}/terminate-all-sessions`,
      { reason }
    )

    showToast(`${target.user.fullName || target.user.username} has been deactivated`)
    closeDeactivate()
    await loadAll()
  } catch (e: any) {
    const msg =
      e.response?.data?.error ||
      e.response?.data?.message ||
      'Failed to deactivate user'
    showToast(msg, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==================== ACTION: ALLOW ====================
const allowOne = async (s: WebSession) => {
  actionLoading.value = true
  try {
    const res = await api.post(`/admin/web-sessions/${s.id}/allow`)
    if (res.data.success) {
      showToast('Session allowed again')
      await loadAll()
    }
  } catch (e: any) {
    showToast(e.response?.data?.error || 'Failed to allow', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==================== ACTION: BULK ====================
const bulkTerminate = async () => {
  if (selectedIds.value.size === 0) return
  const ids = Array.from(selectedIds.value)
  actionLoading.value = true
  try {
    const results = await Promise.allSettled(
      ids.map(id => api.post(`/admin/web-sessions/${id}/terminate`, { reason: 'Bulk terminate' }))
    )
    const ok = results.filter(r => r.status === 'fulfilled').length
    showToast(`Terminated ${ok} of ${ids.length} sessions`)
    clearSelection()
    await loadAll()
  } finally {
    actionLoading.value = false
  }
}

const bulkAllow = async () => {
  if (selectedIds.value.size === 0) return
  const ids = Array.from(selectedIds.value)
  actionLoading.value = true
  try {
    const results = await Promise.allSettled(
      ids.map(id => api.post(`/admin/web-sessions/${id}/allow`))
    )
    const ok = results.filter(r => r.status === 'fulfilled').length
    showToast(`Allowed ${ok} of ${ids.length} sessions`)
    clearSelection()
    await loadAll()
  } finally {
    actionLoading.value = false
  }
}

// ==================== ACTION: DELETE ====================
const openDelete = (s: WebSession) => { deleteTarget.value = s }
const closeDelete = () => { deleteTarget.value = null }
const doDelete = async () => {
  if (!deleteTarget.value) return
  actionLoading.value = true
  try {
    const res = await api.delete(`/admin/web-sessions/${deleteTarget.value.id}`)
    if (res.data.success) {
      showToast('Session deleted')
      closeDelete()
      await loadAll()
    }
  } catch (e: any) {
    showToast(e.response?.data?.error || 'Failed to delete', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==================== LIFECYCLE ====================
let refreshTimer: number | undefined

onMounted(() => {
  loadAll()
  refreshTimer = window.setInterval(() => {
    if (
      !loading.value &&
      !actionLoading.value &&
      selectedIds.value.size === 0 &&
      !terminateTarget.value &&
      !terminateAllTarget.value &&
      !deactivateTarget.value &&
      !deleteTarget.value
    ) {
      loadAll()
    }
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
  if (debounceTimer) window.clearTimeout(debounceTimer)
})
</script>

<style scoped>
/* ============================================================
   BASE
   ============================================================ */
.web-sessions-page {
  padding: 24px 28px;
  color: #1a2332;
  font-size: 14px;
}

/* ============================================================
   HEADER
   ============================================================ */
.ws-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.ws-title { font-size: 22px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.3px; }
.ws-subtitle { font-size: 13px; color: #6b7a8f; margin: 0; max-width: 660px; line-height: 1.5; }
.ws-header__right { display: flex; gap: 8px; }

.btn-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* ============================================================
   STATS
   ============================================================ */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.stat-card {
  background: white;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  font: inherit;
  color: inherit;
}
.stat-card:hover { border-color: #c7d2fe; transform: translateY(-1px); }
.stat-card--active { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15); }
.stat-card--neutral { border-left: 3px solid #94a3b8; }
.stat-card--success { border-left: 3px solid #10b981; }
.stat-card--info    { border-left: 3px solid #3b82f6; }
.stat-card--danger  { border-left: 3px solid #ef4444; }
.stat-card__label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #6b7a8f;
  margin-bottom: 6px;
}
.stat-card__value { display: block; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }

/* ============================================================
   FILTERS
   ============================================================ */
.filters-bar { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
.filter-group { display: flex; flex-direction: column; gap: 4px; min-width: 130px; }
.filter-group--grow { flex: 1; min-width: 220px; }
.filter-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #6b7a8f;
}
.filter-input,
.filter-select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  background: white;
  color: #1a2332;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.15s;
}
.filter-input:focus,
.filter-select:focus { border-color: #4f46e5; }
.filter-reset { margin-left: auto; }

/* ============================================================
   BULK ACTION BAR
   ============================================================ */
.bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
}
.bulk-bar__count { font-size: 13.5px; font-weight: 800; color: #4f46e5; }
.bulk-bar__actions { display: flex; gap: 8px; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-6px); }

/* ============================================================
   TABLE
   ============================================================ */
.table-wrap {
  background: white;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  overflow-x: auto;
}
.ws-table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 960px; }
.ws-table thead { background: #fafbfd; }
.ws-table th {
  text-align: left;
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #6b7a8f;
  border-bottom: 1px solid #e8ecf1;
  white-space: nowrap;
}
.ws-table th.sortable { cursor: pointer; user-select: none; }
.ws-table th.sortable:hover { color: #4f46e5; }
.sort-arrow { font-size: 10px; opacity: 0.7; margin-left: 2px; }
.ws-table td { padding: 12px 14px; border-bottom: 1px solid #f0f3f7; vertical-align: middle; }
.ws-row:last-child td { border-bottom: none; }
.ws-row:hover { background: #fafbfd; }
.ws-row--selected { background: #eef2ff !important; }

.col-check { width: 40px; text-align: center; }
.col-check input { cursor: pointer; }
.col-actions { width: 180px; text-align: right; }
.mono-col {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.empty-cell {
  text-align: center;
  padding: 40px 14px !important;
  color: #6b7a8f;
  font-style: italic;
}

.user-cell { min-width: 160px; }
.user-name { font-weight: 700; }
.user-meta { font-size: 11.5px; color: #6b7a8f; margin-top: 2px; }

.browser-cell { display: flex; align-items: center; gap: 6px; }
.browser-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.status-pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.status-pill--active     { background: #d1fae5; color: #047857; }
.status-pill--terminated { background: #fee2e2; color: #991b1b; }
.status-pill--expired    { background: #f1f5f9; color: #475569; }

/* Row action buttons */
.row-actions { display: inline-flex; gap: 4px; }
.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  background: transparent;
  padding: 0;
}
.action-btn svg { display: block; pointer-events: none; }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.action-btn--danger  { background: #fee2e2; color: #991b1b; }
.action-btn--danger:hover  { background: #fecaca; }
.action-btn--success { background: #d1fae5; color: #047857; }
.action-btn--success:hover { background: #a7f3d0; }
.action-btn--warn    { background: #fef3c7; color: #92400e; }
.action-btn--warn:hover    { background: #fde68a; }
.action-btn--block   { background: #fce7f3; color: #9d174d; }
.action-btn--block:hover   { background: #fbcfe8; }
.action-btn--ghost   { background: transparent; color: #94a3b8; }
.action-btn--ghost:hover   { background: #f1f5f9; color: #475569; }

/* ============================================================
   PAGINATION
   ============================================================ */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.pagination__left { display: flex; align-items: center; gap: 14px; font-size: 12.5px; color: #6b7a8f; }
.pagination__size { display: flex; align-items: center; gap: 6px; }
.pagination__size select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  background: white;
  font-size: 12.5px;
  cursor: pointer;
}
.pagination__right { display: flex; gap: 4px; }
.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e8ecf1;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1a2332;
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled) { border-color: #4f46e5; color: #4f46e5; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.page-btn--active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

/* ============================================================
   BUTTONS
   ============================================================ */
.btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn svg { display: block; pointer-events: none; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: white; border-color: #e8ecf1; color: #1a2332; }
.btn-secondary:hover:not(:disabled) { border-color: #4f46e5; color: #4f46e5; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-success { background: #10b981; color: white; }
.btn-success:hover:not(:disabled) { background: #059669; }
.btn-ghost { background: transparent; color: #6b7a8f; }
.btn-ghost:hover:not(:disabled) { background: #f1f5f9; color: #1a2332; }

/* ============================================================
   MODAL
   ============================================================ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal {
  background: white;
  border-radius: 16px;
  padding: 22px 24px;
  max-width: 480px;
  width: 100%;
  border: 1px solid #e8ecf1;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  animation: popIn 0.18s ease;
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
.modal__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.modal h3 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.2px; }
.modal__close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #6b7a8f;
  line-height: 1;
}
.modal__close:hover { background: #f1f5f9; color: #1a2332; }

.modal__sub { font-size: 13px; color: #475569; margin: 0 0 12px; line-height: 1.5; }

.modal__notice {
  font-size: 12.5px;
  padding: 10px 12px;
  border-radius: 10px;
  line-height: 1.5;
  margin-bottom: 12px;
}
.modal__notice--warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
.modal__notice--block { background: #fdf2f8; border: 1px solid #fbcfe8; color: #9d174d; }

.modal__checklist { font-size: 12px; font-weight: 700; color: #6b7a8f; margin: 12px 0 6px; }
.modal__checklist-items { margin: 0 0 12px; padding-left: 20px; font-size: 12.5px; color: #475569; line-height: 1.7; }
.modal__checklist-items li::marker { color: #ef4444; }

.modal__field { display: block; font-size: 11px; font-weight: 700; color: #6b7a8f; letter-spacing: 0.3px; }
.modal__field span { display: block; margin-bottom: 6px; text-transform: uppercase; }
.modal__field .filter-input { width: 100%; }

.modal__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

/* ============================================================
   TOAST
   ============================================================ */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  color: white;
  z-index: 2000;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}
.toast--success { background: #10b981; }
.toast--error   { background: #ef4444; }
.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 10px); }

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .web-sessions-page { padding: 20px; }
}
@media (max-width: 768px) {
  .ws-header { flex-direction: column; }
  .filters-bar { flex-direction: column; align-items: stretch; }
  .filter-group { min-width: 0; }
  .filter-reset { margin-left: 0; }
  .pagination { flex-direction: column; align-items: stretch; }
}
@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr; }
}
</style>