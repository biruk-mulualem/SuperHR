<!-- views/storemanagement/notifications/NotificationManagement.vue -->
<template>
  <div class="page">
    <!-- ==================== HEADER ==================== -->
    <header class="page-header">
      <div class="header-main">
        <h1>Approval Workspace</h1>
        <p class="header-sub">
          Track which groups have accepted — and which haven't
        </p>
      </div>
      <button class="btn-refresh" @click="refresh" :disabled="loading">
        <span v-if="!loading">↻ Refresh</span>
        <span v-else>Loading…</span>
      </button>
    </header>

    <!-- ==================== SUMMARY STRIP ==================== -->
    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-value">{{ totalCount }}</span>
        <span class="summary-label">Total waiting</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value accent-purple">{{ sentNotAccepted.length }}</span>
        <span class="summary-label">Awaiting supplying store</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value accent-blue">{{ acceptedAwaitingMyApproval.length }}</span>
        <span class="summary-label">Awaiting my approval</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-value accent-amber">{{ oldRequests }}</span>
        <span class="summary-label">Older than 7 days</span>
      </div>
    </div>

    <!-- ==================== TABS ==================== -->
    <nav class="tabs">
      <button
        :class="['tab', { active: activeTab === 'sent' }]"
        @click="activeTab = 'sent'"
      >
        <span>Awaiting supplying store acceptance</span>
        <span class="tab-count">{{ sentNotAccepted.length }}</span>
      </button>
      <button
        :class="['tab', { active: activeTab === 'accepted' }]"
        @click="activeTab = 'accepted'"
      >
        <span>Awaiting my approval</span>
        <span class="tab-count">{{ acceptedAwaitingMyApproval.length }}</span>
      </button>
    </nav>

    <!-- ==================== TOOLBAR ==================== -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="field">
          <label>Store</label>
          <select v-model="filterStore">
            <option value="all">All stores</option>
            <option v-for="s in storeOptions" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>Requester</label>
          <select v-model="filterRequester">
            <option value="all">All requesters</option>
            <option v-for="r in requesterOptions" :key="r" :value="r">
              {{ r }}
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
          Clear
        </button>
      </div>
    </div>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading requests…</p>
    </div>

    <!-- ==================== TAB 1 ==================== -->
    <section v-show="!loading && activeTab === 'sent'" class="panel">
      <header class="panel-header">
        <div>
          <h2>Awaiting Supplying Store Acceptance</h2>
          <p>Sent to the supplying store — below you can see exactly which groups have accepted and which haven't.</p>
        </div>
        <span class="panel-count">{{ filteredSent.length }}</span>
      </header>

      <div v-if="filteredSent.length === 0" class="empty">
        <div class="empty-icon">✓</div>
        <div class="empty-text">Nothing waiting for the supplying store</div>
      </div>

      <div class="cards">
        <article v-for="r in paginatedSent" :key="r.id" class="card">
          <!-- Card header -->
          <header class="card-head">
            <div class="card-head-left">
              <span class="code">{{ r.code }}</span>
              <span class="flow">
                <span>{{ r.askingStore }}</span>
                <span class="arrow">→</span>
                <span>{{ r.supplyingStore }}</span>
              </span>
            </div>
            <div class="card-head-right">
              <span class="meta">Sent {{ formatDate(r.sentAt) }}</span>
              <span class="meta">By {{ r.requestedBy }}</span>
            </div>
          </header>

          <!-- Group-by-group status -->
          <div class="groups">
            <div class="groups-label">Supplying store groups</div>
            <div class="pills">
              <span
                v-for="g in r.groups"
                :key="g.id"
                :class="['pill', g.status]"
                :title="`${g.name} — ${labelFor(g.status)}`"
              >
                <span class="pill-dot"></span>
                <span class="pill-name">{{ g.name }}</span>
                <span class="pill-status">{{ labelFor(g.status) }}</span>
              </span>
            </div>
          </div>

          <!-- Summary bar -->
          <footer class="card-foot">
            <div class="progress">
              <div
                class="progress-fill"
                :style="{ width: progressPercent(r) + '%' }"
              ></div>
            </div>
            <span class="progress-text">
              {{ acceptedCount(r) }} of {{ r.groups.length }} accepted
            </span>
          </footer>
        </article>
      </div>

      <footer v-if="filteredSent.length > pageSize" class="panel-footer">
        <span class="footer-info">
          Page {{ sentPage }} of {{ sentTotalPages }}
        </span>
        <div class="footer-actions">
          <button :disabled="sentPage === 1" @click="sentPage--">Previous</button>
          <button :disabled="sentPage === sentTotalPages" @click="sentPage++">Next</button>
        </div>
      </footer>
    </section>

    <!-- ==================== TAB 2 ==================== -->
    <section v-show="!loading && activeTab === 'accepted'" class="panel">
      <header class="panel-header">
        <div>
          <h2>Awaiting My Approval</h2>
          <p>Supplying store has accepted — here's who accepted, and the request now needs your final approval.</p>
        </div>
        <span class="panel-count">{{ filteredAccepted.length }}</span>
      </header>

      <div v-if="filteredAccepted.length === 0" class="empty">
        <div class="empty-icon">✓</div>
        <div class="empty-text">Nothing waiting for your approval</div>
      </div>

      <div class="cards">
        <article v-for="r in paginatedAccepted" :key="r.id" class="card">
          <header class="card-head">
            <div class="card-head-left">
              <span class="code">{{ r.code }}</span>
              <span class="flow">
                <span>{{ r.askingStore }}</span>
                <span class="arrow">→</span>
                <span>{{ r.supplyingStore }}</span>
              </span>
            </div>
            <div class="card-head-right">
              <span class="meta">Accepted {{ formatDate(r.acceptedAt) }}</span>
              <span class="meta">By {{ r.requestedBy }}</span>
            </div>
          </header>

          <!-- Who accepted -->
          <div class="groups">
            <div class="groups-label">Accepted by</div>
            <div class="pills">
              <span
                v-for="g in r.acceptedBy"
                :key="g.id"
                class="pill accepted"
                :title="`${g.name} — accepted at ${formatDate(g.at)}`"
              >
                <span class="pill-dot"></span>
                <span class="pill-name">{{ g.name }}</span>
                <span class="pill-status">Accepted</span>
              </span>
            </div>
          </div>

          <footer class="card-foot card-foot-actions">
            <div class="items-summary">
              {{ r.items }} item(s) to approve
            </div>
            <button class="btn-approve" @click="approveRequest(r)">
              Approve Request
            </button>
          </footer>
        </article>
      </div>

      <footer v-if="filteredAccepted.length > pageSize" class="panel-footer">
        <span class="footer-info">
          Page {{ acceptedPage }} of {{ acceptedTotalPages }}
        </span>
        <div class="footer-actions">
          <button :disabled="acceptedPage === 1" @click="acceptedPage--">Previous</button>
          <button :disabled="acceptedPage === acceptedTotalPages" @click="acceptedPage++">Next</button>
        </div>
      </footer>
    </section>

    <!-- ==================== TOAST ==================== -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// ================================================================
// STATE
// ================================================================

const loading = ref(false)
const activeTab = ref('sent')
const pageSize = 5

const filterStore = ref('all')
const filterRequester = ref('all')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const sentPage = ref(1)
const acceptedPage = ref(1)

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// DEMO DATA — Tab 1: awaiting supplying store acceptance
// Each `groups` array = one entry per supplying-store group
// ================================================================

const sentNotAccepted = ref([
  {
    id: 2001,
    code: 'REQ-20260515-0014',
    askingStore: 'MainStore 1 (Yeshi)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Abebe Kebede',
    sentAt: '2026-05-15T11:40:00Z',
    groups: [
      { id: 1, name: 'Finance', status: 'accepted' },
      { id: 2, name: 'Logistics', status: 'pending' },
      { id: 3, name: 'Inventory', status: 'accepted' },
      { id: 4, name: 'HR', status: 'pending' },
    ],
  },
  {
    id: 2002,
    code: 'REQ-20260515-0015',
    askingStore: 'MainStore 1 (Ground)',
    supplyingStore: 'Other',
    requestedBy: 'Sara Bekele',
    sentAt: '2026-05-15T12:10:00Z',
    groups: [
      { id: 5, name: 'Inventory', status: 'pending' },
      { id: 6, name: 'Finance', status: 'accepted' },
      { id: 7, name: 'Logistics', status: 'accepted' },
    ],
  },
  {
    id: 2003,
    code: 'REQ-20260515-0016',
    askingStore: 'MainStore 1 (Dulenty)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Yohannes T.',
    sentAt: '2026-05-15T13:02:00Z',
    groups: [
      { id: 8, name: 'Finance', status: 'pending' },
      { id: 9, name: 'Logistics', status: 'pending' },
      { id: 10, name: 'Inventory', status: 'pending' },
      { id: 11, name: 'HR', status: 'pending' },
    ],
  },
  {
    id: 2004,
    code: 'REQ-20260514-0090',
    askingStore: 'MainStore 1 (Mekanisa)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Meron A.',
    sentAt: '2026-05-14T18:30:00Z',
    groups: [
      { id: 12, name: 'Finance', status: 'pending' },
      { id: 13, name: 'Logistics', status: 'accepted' },
      { id: 14, name: 'HR', status: 'accepted' },
    ],
  },
  {
    id: 2005,
    code: 'REQ-20260513-0042',
    askingStore: 'MainStore 1 (Ground)',
    supplyingStore: 'Other',
    requestedBy: 'Kalkidan G.',
    sentAt: '2026-05-13T14:47:00Z',
    groups: [
      { id: 15, name: 'Logistics', status: 'pending' },
      { id: 16, name: 'HR', status: 'pending' },
    ],
  },
  {
    id: 2006,
    code: 'REQ-20260512-0034',
    askingStore: 'MainStore 1 (Yeshi)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Henok M.',
    sentAt: '2026-05-12T10:20:00Z',
    groups: [
      { id: 17, name: 'Finance', status: 'accepted' },
      { id: 18, name: 'Logistics', status: 'accepted' },
      { id: 19, name: 'Inventory', status: 'pending' },
    ],
  },
  {
    id: 2007,
    code: 'REQ-20260509-0007',
    askingStore: 'MainStore 1 (Dulenty)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Tigist H.',
    sentAt: '2026-05-09T09:15:00Z',
    groups: [
      { id: 20, name: 'Finance', status: 'rejected' },
      { id: 21, name: 'Logistics', status: 'pending' },
      { id: 22, name: 'HR', status: 'pending' },
    ],
  },
])

// ================================================================
// DEMO DATA — Tab 2: supplying store accepted, awaiting my approval
// `acceptedBy` = the groups that gave their approval
// ================================================================

const acceptedAwaitingMyApproval = ref([
  {
    id: 1001,
    code: 'REQ-20260515-0012',
    askingStore: 'MainStore 1 (Ground)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Abebe Kebede',
    acceptedAt: '2026-05-15T09:12:00Z',
    items: 5,
    acceptedBy: [
      { id: 1, name: 'Finance',   at: '2026-05-15T08:55:00Z' },
      { id: 2, name: 'Logistics', at: '2026-05-15T09:05:00Z' },
      { id: 3, name: 'Inventory', at: '2026-05-15T09:10:00Z' },
    ],
  },
  {
    id: 1002,
    code: 'REQ-20260515-0013',
    askingStore: 'MainStore 1 (Yeshi)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Sara Bekele',
    acceptedAt: '2026-05-15T10:04:00Z',
    items: 3,
    acceptedBy: [
      { id: 4, name: 'Finance',   at: '2026-05-15T09:40:00Z' },
      { id: 5, name: 'Inventory', at: '2026-05-15T09:58:00Z' },
    ],
  },
  {
    id: 1003,
    code: 'REQ-20260514-0087',
    askingStore: 'MainStore 1 (Dulenty)',
    supplyingStore: 'Other',
    requestedBy: 'Yohannes T.',
    acceptedAt: '2026-05-14T16:40:00Z',
    items: 12,
    acceptedBy: [
      { id: 6, name: 'Finance',   at: '2026-05-14T16:00:00Z' },
      { id: 7, name: 'Logistics', at: '2026-05-14T16:20:00Z' },
      { id: 8, name: 'HR',        at: '2026-05-14T16:35:00Z' },
    ],
  },
  {
    id: 1004,
    code: 'REQ-20260514-0088',
    askingStore: 'MainStore 1 (Mekanisa)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Meron A.',
    acceptedAt: '2026-05-14T17:25:00Z',
    items: 2,
    acceptedBy: [
      { id: 9,  name: 'Logistics', at: '2026-05-14T17:10:00Z' },
      { id: 10, name: 'HR',        at: '2026-05-14T17:20:00Z' },
    ],
  },
  {
    id: 1005,
    code: 'REQ-20260513-0041',
    askingStore: 'MainStore 1 (Ground)',
    supplyingStore: 'MainStore 3',
    requestedBy: 'Kalkidan G.',
    acceptedAt: '2026-05-13T11:15:00Z',
    items: 7,
    acceptedBy: [
      { id: 11, name: 'Finance',   at: '2026-05-13T10:50:00Z' },
      { id: 12, name: 'Logistics', at: '2026-05-13T11:02:00Z' },
      { id: 13, name: 'Inventory', at: '2026-05-13T11:10:00Z' },
    ],
  },
])

// ================================================================
// FILTER OPTIONS
// ================================================================

const storeOptions = computed(() => {
  const set = new Set()
  ;[...sentNotAccepted.value, ...acceptedAwaitingMyApproval.value].forEach((r) => {
    if (r.askingStore) set.add(r.askingStore)
    if (r.supplyingStore) set.add(r.supplyingStore)
  })
  return Array.from(set).sort().map((n) => ({ id: n, name: n }))
})

const requesterOptions = computed(() => {
  const set = new Set()
  ;[...sentNotAccepted.value, ...acceptedAwaitingMyApproval.value].forEach((r) => {
    if (r.requestedBy) set.add(r.requestedBy)
  })
  return Array.from(set).sort()
})

// ================================================================
// FILTERING
// ================================================================

const hasActiveFilters = computed(
  () =>
    filterStore.value !== 'all' ||
    filterRequester.value !== 'all' ||
    filterDateFrom.value !== '' ||
    filterDateTo.value !== ''
)

const applyFilters = (list, dateField) => {
  let result = [...list]

  if (filterStore.value !== 'all') {
    result = result.filter(
      (r) =>
        r.askingStore === filterStore.value ||
        r.supplyingStore === filterStore.value
    )
  }
  if (filterRequester.value !== 'all') {
    result = result.filter((r) => r.requestedBy === filterRequester.value)
  }
  if (filterDateFrom.value) {
    const from = new Date(filterDateFrom.value)
    from.setHours(0, 0, 0, 0)
    result = result.filter((r) => new Date(r[dateField]) >= from)
  }
  if (filterDateTo.value) {
    const to = new Date(filterDateTo.value)
    to.setHours(23, 59, 59, 999)
    result = result.filter((r) => new Date(r[dateField]) <= to)
  }
  return result
}

const filteredSent = computed(() => applyFilters(sentNotAccepted.value, 'sentAt'))
const filteredAccepted = computed(() => applyFilters(acceptedAwaitingMyApproval.value, 'acceptedAt'))

// ================================================================
// PAGINATION
// ================================================================

const sentTotalPages = computed(() => Math.ceil(filteredSent.value.length / pageSize) || 1)
const acceptedTotalPages = computed(() => Math.ceil(filteredAccepted.value.length / pageSize) || 1)

const paginatedSent = computed(() => {
  const start = (sentPage.value - 1) * pageSize
  return filteredSent.value.slice(start, start + pageSize)
})

const paginatedAccepted = computed(() => {
  const start = (acceptedPage.value - 1) * pageSize
  return filteredAccepted.value.slice(start, start + pageSize)
})

// ================================================================
// HELPERS — group status
// ================================================================

const labelFor = (status) => {
  if (status === 'accepted') return 'Accepted'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

const acceptedCount = (r) => (r.groups || []).filter((g) => g.status === 'accepted').length
const progressPercent = (r) => {
  const total = (r.groups || []).length
  if (!total) return 0
  return Math.round((acceptedCount(r) / total) * 100)
}

// ================================================================
// STATS
// ================================================================

const totalCount = computed(
  () => sentNotAccepted.value.length + acceptedAwaitingMyApproval.value.length
)

const oldRequests = computed(() => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const s = sentNotAccepted.value.filter((r) => new Date(r.sentAt).getTime() < sevenDaysAgo).length
  const a = acceptedAwaitingMyApproval.value.filter((r) => new Date(r.acceptedAt).getTime() < sevenDaysAgo).length
  return s + a
})

// ================================================================
// DATE FORMAT
// ================================================================

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ================================================================
// ACTIONS
// ================================================================

const refresh = async () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    showToastMessage('Refreshed', 'info')
  }, 500)
}

const approveRequest = (req) => {
  showToastMessage(`Approved ${req.code}`, 'success')
  acceptedAwaitingMyApproval.value = acceptedAwaitingMyApproval.value.filter((r) => r.id !== req.id)
}

const clearFilters = () => {
  filterStore.value = 'all'
  filterRequester.value = 'all'
  filterDateFrom.value = ''
  filterDateTo.value = ''
  sentPage.value = 1
  acceptedPage.value = 1
  showToastMessage('Filters cleared', 'info')
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

watch([filterStore, filterRequester, filterDateFrom, filterDateTo], () => {
  sentPage.value = 1
  acceptedPage.value = 1
})

onMounted(() => {
  // Load from API here when ready.
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

/* ================================================================
   HEADER
   ================================================================ */
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
.header-sub {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

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

/* ================================================================
   SUMMARY
   ================================================================ */
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
.summary-value.accent-purple { color: #7c3aed; }
.summary-value.accent-amber { color: #d97706; }
.summary-label { font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.4px; }
.summary-divider { width: 1px; height: 36px; background: #e5e7eb; }

/* ================================================================
   TABS
   ================================================================ */
.tabs { display: flex; gap: 4px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; }
.tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
}
.tab:hover { color: #0f172a; }
.tab.active { color: #0f172a; border-bottom-color: #0f172a; font-weight: 600; }
.tab-count {
  display: inline-block;
  min-width: 22px;
  padding: 1px 8px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}
.tab.active .tab-count { background: #0f172a; color: white; }

/* ================================================================
   TOOLBAR
   ================================================================ */
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

/* ================================================================
   LOADING
   ================================================================ */
.loading { text-align: center; padding: 60px 20px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; }
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

/* ================================================================
   PANEL
   ================================================================ */
.panel { background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  gap: 16px;
}
.panel-header h2 { font-size: 15px; font-weight: 600; margin: 0 0 4px 0; color: #0f172a; letter-spacing: -0.2px; }
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

/* ================================================================
   CARDS
   ================================================================ */
.cards {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fafbfc;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  gap: 16px;
  flex-wrap: wrap;
  border-bottom: 1px solid #f1f5f9;
}
.card-head-left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.card-head-right { display: flex; align-items: center; gap: 16px; }

.code {
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
}
.flow { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #334155; font-weight: 500; }
.arrow { color: #cbd5e1; font-size: 14px; }
.meta { font-size: 12px; color: #64748b; }

/* ================================================================
   GROUPS (who accepted / who didn't)
   ================================================================ */
.groups { padding: 14px 18px; }
.groups-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 10px;
}
.pills { display: flex; flex-wrap: wrap; gap: 8px; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: transform 0.1s;
  cursor: default;
}
.pill:hover { transform: translateY(-1px); }

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.pill-name { font-weight: 600; }
.pill-status { opacity: 0.7; font-size: 11px; }

/* accepted → green */
.pill.accepted {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.pill.accepted .pill-dot { background: #16a34a; }

/* pending → amber */
.pill.pending {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.pill.pending .pill-dot { background: #f59e0b; }

/* rejected → red */
.pill.rejected {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}
.pill.rejected .pill-dot { background: #dc2626; }

/* ================================================================
   CARD FOOTER
   ================================================================ */
.card-foot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.card-foot-actions {
  justify-content: space-between;
}

.progress {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #16a34a;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
}

.items-summary {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.btn-approve {
  padding: 8px 18px;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-approve:hover { background: #15803d; }
.btn-approve:active { transform: scale(0.98); }

/* ================================================================
   EMPTY
   ================================================================ */
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

/* ================================================================
   PANEL FOOTER
   ================================================================ */
.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  gap: 12px;
}
.footer-info { font-size: 13px; color: #64748b; }
.footer-actions { display: flex; gap: 8px; }
.footer-actions button {
  padding: 6px 14px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
}
.footer-actions button:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.footer-actions button:disabled { opacity: 0.4; cursor: not-allowed; }

/* ================================================================
   TOAST
   ================================================================ */
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
.toast.info { background: #0f172a; }
.toast.success { background: #16a34a; }
.toast.error { background: #dc2626; }
.toast.warning { background: #d97706; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .summary-strip { padding: 16px 20px; gap: 16px; }
  .summary-divider { display: none; }
  .summary-item { min-width: 100px; }
  .card-head { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 640px) {
  .page { padding: 20px 16px; }
  .header-main h1 { font-size: 22px; }
  .toolbar-left { flex-direction: column; align-items: stretch; }
  .field select, .field input { width: 100%; }
  .btn-clear { width: 100%; }
  .tabs { overflow-x: auto; }
  .tab { white-space: nowrap; }
  .panel-header { flex-direction: column; }
}
</style>