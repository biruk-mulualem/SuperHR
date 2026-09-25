<!-- views/notifications/Notifications.vue -->
<template>
  <div class="nt-page">
    <!-- ==================== TOP BAR ==================== -->
    <header class="nt-topbar">
      <div>
        <h1 class="nt-title">Notifications</h1>
        <p class="nt-subtitle">
          Review and act on {{ groupedRequests.length }} pending request{{ groupedRequests.length === 1 ? '' : 's' }}
        </p>
      </div>

      <div class="nt-topbar-actions">
        <div class="nt-segment">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            class="nt-seg-btn"
            :class="[`seg-${opt.value}`, { active: filterStatus === opt.value }]"
            @click="filterStatus = opt.value; onFilterChange()"
          >
            {{ opt.label }}
            <span class="nt-seg-count">{{ countsByStatus[opt.value] }}</span>
          </button>
        </div>

        <button class="nt-icon-btn" @click="loadAllNotifications(true)" :disabled="loading" title="Refresh">
          <svg :class="{ spinning: loading }" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>
    </header>

    <!-- ==================== SEARCH ==================== -->
    <div class="nt-searchbar">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search request code, item, user, or store…"
        @input="onSearchChange"
      />
      <button v-if="searchQuery" class="nt-search-clear" @click="searchQuery = ''; onFilterChange()">✕</button>
    </div>

    <!-- ==================== LOADING (skeleton) ==================== -->
    <div v-if="loading && notifications.length === 0" class="nt-layout">
      <div class="nt-list-column">
        <div v-for="i in 4" :key="i" class="nt-skeleton-card">
          <div class="nt-skeleton-stripe"></div>
          <div class="nt-skeleton-body">
            <div class="nt-skel-line" style="width: 30%"></div>
            <div class="nt-skel-line" style="width: 60%"></div>
            <div class="nt-skel-line" style="width: 45%"></div>
          </div>
        </div>
      </div>
      <div class="nt-detail-column">
        <div class="nt-skeleton-detail">
          <div class="nt-skel-line" style="width: 40%"></div>
          <div class="nt-skel-block"></div>
          <div class="nt-skel-line" style="width: 70%"></div>
          <div class="nt-skel-line" style="width: 55%"></div>
        </div>
      </div>
    </div>

    <!-- ==================== EMPTY ==================== -->
    <div v-else-if="groupedRequests.length === 0" class="nt-empty">
      <div class="nt-empty-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <h3>All clear</h3>
      <p>
        {{ filterStatus === 'all'
            ? 'No notifications to review right now.'
            : `No ${filterStatus} notifications.` }}
      </p>
    </div>

    <!-- ==================== MAIN ==================== -->
    <div v-else class="nt-layout">
      <!-- Left: request list -->
      <div class="nt-list-column">
        <template v-for="(group, gi) in groupedNotifications" :key="gi">
          <div class="nt-date-divider">
            <span>{{ group.date }}</span>
            <span class="nt-divider-line"></span>
            <span class="nt-divider-count">{{ group.requests.length }}</span>
          </div>

          <div
            v-for="req in group.requests"
            :key="req.requestId"
            class="nt-card"
            :class="[req.summaryStatus, { selected: selectedRequestId === req.requestId }]"
            @click="selectRequest(req.requestId)"
          >
            <!-- Left stripe -->
            <div class="nt-stripe" :class="req.summaryStatus"></div>

            <!-- Status icon -->
            <div class="nt-card-status" :class="req.summaryStatus">
              <span v-if="req.summaryStatus === 'pending'">⏳</span>
              <span v-else-if="req.summaryStatus === 'accepted'">✓</span>
              <span v-else-if="req.summaryStatus === 'rejected'">✕</span>
              <span v-else>·</span>
            </div>

            <!-- Content -->
            <div class="nt-card-body">
              <div class="nt-card-row-1">
                <span class="nt-code">{{ req.request.requestCode }}</span>
                <span class="nt-chip time">{{ formatDate(req.latestCreatedAt) }}</span>
                <span v-if="req.request.remark" class="nt-chip remark">💬</span>
              </div>

              <div class="nt-card-row-2">
                <span class="nt-route">
                  <span class="nt-route-origin" :class="{ other: isOther(req.request) }">
                    {{ getOriginName(req.request) }}
                  </span>
                  <svg class="nt-route-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  <span class="nt-route-dest">
                    {{ req.request.supplyingStore?.name || '—' }}
                  </span>
                </span>
              </div>

              <div class="nt-card-row-3">
                <span class="nt-meta">{{ req.request.items?.length || 0 }} item{{ req.request.items?.length === 1 ? '' : 's' }}</span>
                <span class="nt-meta-sep">·</span>
                <span class="nt-meta">by {{ req.request.requestedByUser?.fullName || 'Unknown' }}</span>
              </div>

              <!-- Approvals chips -->
              <div class="nt-approval-row">
                <span
                  v-for="a in req.approvals"
                  :key="a.id"
                  class="nt-approval-chip"
                  :class="[a.status, a.approval_type]"
                  :title="a.group?.name || a.department?.name || ''"
                >
                  <span class="nt-approval-chip-icon">
                    {{ a.approval_type === 'group' ? '🏢' : '🏛️' }}
                  </span>
                  <span class="nt-approval-chip-name">
                    {{ a.group?.name || a.department?.name || '—' }}
                  </span>
                  <span class="nt-approval-chip-status" :class="a.status">
                    {{ a.status === 'pending' ? '⏳' : a.status === 'accepted' ? '✓' : '✕' }}
                  </span>
                </span>
              </div>
            </div>

            <!-- Right: quick actions -->
            <div class="nt-card-right" @click.stop>
              <button
                v-if="req.summaryStatus === 'pending'"
                class="nt-quick-btn accept"
                @click="acceptAllPendingFor(req)"
                title="Accept all pending"
              >
                ✓
              </button>
              <button
                v-if="req.summaryStatus === 'pending'"
                class="nt-quick-btn reject"
                @click="openRejectFor(req)"
                title="Reject"
              >
                ✕
              </button>
              <svg class="nt-chevron" :class="{ rotated: selectedRequestId === req.requestId }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </template>

        <!-- Pagination -->
        <div v-if="pagination && pagination.total > 0 && !searchQuery" class="nt-pagination">
          <button class="nt-page-btn" :disabled="currentPage <= 1 || loading" @click="goToPage(currentPage - 1)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div class="nt-page-numbers">
            <button
              v-for="(p, i) in visiblePages"
              :key="i"
              class="nt-page-num"
              :class="{ active: p === currentPage, dots: p === '...' }"
              :disabled="p === '...'"
              @click="p !== '...' && goToPage(p)"
            >{{ p }}</button>
          </div>
          <button class="nt-page-btn" :disabled="currentPage >= totalPages || loading" @click="goToPage(currentPage + 1)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      <!-- Right: detail panel -->
      <aside class="nt-detail-column">
        <transition name="panel" mode="out-in">
          <div v-if="!selectedRequest" key="empty" class="nt-detail-empty">
            <div class="nt-empty-detail-illustration">
              <svg viewBox="0 0 120 90" width="120" height="90" fill="none">
                <rect x="8" y="12" width="104" height="14" rx="3" fill="#e2e8f0" />
                <rect x="8" y="32" width="80" height="10" rx="2" fill="#e2e8f0" />
                <rect x="8" y="48" width="96" height="10" rx="2" fill="#e2e8f0" opacity="0.6" />
                <rect x="8" y="64" width="70" height="10" rx="2" fill="#e2e8f0" opacity="0.4" />
                <circle cx="100" cy="20" r="6" fill="#c4b5fd" />
              </svg>
            </div>
            <p class="nt-empty-detail-title">Select a request</p>
            <span class="nt-empty-detail-text">
              Click any card on the left to view its details and take action.
            </span>

            <div class="nt-empty-detail-stats">
              <div class="nt-empty-stat">
                <span class="nt-empty-stat-value pending">{{ countsByStatus.pending }}</span>
                <span class="nt-empty-stat-label">Pending</span>
              </div>
              <div class="nt-empty-stat">
                <span class="nt-empty-stat-value accepted">{{ countsByStatus.accepted }}</span>
                <span class="nt-empty-stat-label">Accepted</span>
              </div>
              <div class="nt-empty-stat">
                <span class="nt-empty-stat-value rejected">{{ countsByStatus.rejected }}</span>
                <span class="nt-empty-stat-label">Rejected</span>
              </div>
            </div>
          </div>

          <div v-else key="detail" class="nt-detail">
            <div class="nt-detail-header" :class="selectedRequest.summaryStatus">
              <div class="nt-detail-header-top">
                <div class="nt-detail-header-icon" :class="selectedRequest.summaryStatus">
                  <span v-if="selectedRequest.summaryStatus === 'pending'">⏳</span>
                  <span v-else-if="selectedRequest.summaryStatus === 'accepted'">✓</span>
                  <span v-else-if="selectedRequest.summaryStatus === 'rejected'">✕</span>
                </div>
                <div class="nt-detail-header-text">
                  <span class="nt-detail-code">{{ selectedRequest.request.requestCode }}</span>
                  <span class="nt-detail-status-label" :class="selectedRequest.summaryStatus">
                    {{ capitalize(selectedRequest.summaryStatus) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="nt-detail-body">
              <!-- Route -->
              <section class="nt-section">
                <div class="nt-route-card">
                  <div class="nt-route-side">
                    <span class="nt-route-label">From</span>
                    <span class="nt-route-value" :class="{ other: isOther(selectedRequest.request) }">
                      {{ getOriginName(selectedRequest.request) }}
                    </span>
                    <span class="nt-route-code">{{ getOriginCode(selectedRequest.request) }}</span>
                  </div>
                  <div class="nt-route-line">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#cbd5e1" stroke-width="2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </div>
                  <div class="nt-route-side">
                    <span class="nt-route-label">To</span>
                    <span class="nt-route-value">{{ selectedRequest.request.supplyingStore?.name || '—' }}</span>
                    <span class="nt-route-code">{{ selectedRequest.request.supplyingStore?.code || '—' }}</span>
                  </div>
                </div>
              </section>

              <!-- Requested by -->
              <section class="nt-section">
                <span class="nt-section-title">Requested by</span>
                <div class="nt-user">
                  <div class="nt-user-avatar">{{ getInitials(selectedRequest.request.requestedByUser?.fullName) }}</div>
                  <div class="nt-user-info">
                    <span class="nt-user-name">{{ selectedRequest.request.requestedByUser?.fullName || 'Unknown' }}</span>
                    <span class="nt-user-sub">{{ formatDateFull(selectedRequest.request.createdAt) }}</span>
                  </div>
                </div>
              </section>

              <!-- Approvals chain -->
              <section class="nt-section">
                <div class="nt-section-header">
                  <span class="nt-section-title">Approvals</span>
                  <span class="nt-section-count">
                    {{ selectedRequest.acceptedCount }}/{{ selectedRequest.approvals.length }}
                  </span>
                </div>
                <div class="nt-approvals-list">
                  <div
                    v-for="a in selectedRequest.approvals"
                    :key="a.id"
                    class="nt-approval-item"
                    :class="a.status"
                  >
                    <div class="nt-approval-item-icon">
                      {{ a.approval_type === 'group' ? '🏢' : '🏛️' }}
                    </div>
                    <div class="nt-approval-item-body">
                      <span class="nt-approval-item-name">
                        {{ a.group?.name || a.department?.name || '—' }}
                      </span>
                      <span class="nt-approval-item-type">
                        {{ a.approval_type === 'group' ? 'Group approval' : 'Department approval' }}
                        <template v-if="a.respondedByUser">
                          · by {{ a.respondedByUser.fullName || a.respondedByUser.username }}
                        </template>
                      </span>
                      <span v-if="a.rejected_reason" class="nt-approval-item-reason">
                        "{{ a.rejected_reason }}"
                      </span>
                    </div>
                    <span class="nt-approval-item-status" :class="a.status">
                      {{ a.status === 'pending' ? '⏳' : a.status === 'accepted' ? '✓' : '✕' }}
                    </span>
                  </div>
                </div>
              </section>

              <!-- Items -->
              <section class="nt-section">
                <div class="nt-section-header">
                  <span class="nt-section-title">Items</span>
                  <span class="nt-section-count">{{ selectedRequest.request.items?.length || 0 }} total</span>
                </div>
                <div class="nt-items">
                  <div v-for="(item, i) in selectedRequest.request.items || []" :key="i" class="nt-item">
                    <div class="nt-item-main">
                      <span class="nt-item-name">{{ item.item?.name || 'Unknown Item' }}</span>
                      <span class="nt-item-qty">{{ formatQty(item.quantity) }} {{ getUomDisplay(item) }}</span>
                    </div>
                    <div class="nt-item-code">{{ item.item?.code || '—' }}</div>
                    <div v-if="item.remark" class="nt-item-remark">💬 {{ item.remark }}</div>
                  </div>
                </div>
              </section>

              <!-- Remark -->
              <section v-if="selectedRequest.request.remark" class="nt-section">
                <span class="nt-section-title">Request remark</span>
                <p class="nt-remark">{{ selectedRequest.request.remark }}</p>
              </section>

              <!-- Rejections summary -->
              <section v-if="selectedRequest.rejections.length > 0" class="nt-section rejection">
                <span class="nt-section-title">Rejection reasons</span>
                <p v-for="(r, i) in selectedRequest.rejections" :key="i" class="nt-rejection-text">
                  <strong>{{ r.group?.name || r.department?.name }}:</strong> {{ r.rejected_reason }}
                </p>
              </section>
            </div>

            <!-- Footer actions -->
            <div v-if="selectedRequest.summaryStatus === 'pending'" class="nt-detail-footer">
              <button class="nt-action-btn reject" @click="openRejectFor(selectedRequest)">
                <span>✕</span> Reject
              </button>
              <button class="nt-action-btn accept" @click="acceptAllPendingFor(selectedRequest)">
                <span>✓</span> Accept all
              </button>
            </div>
          </div>
        </transition>
      </aside>
    </div>

    <!-- ==================== ACCEPT MODAL ==================== -->
    <transition name="modal">
      <div v-if="showAcceptModal" class="nt-modal-backdrop" @click.self="closeAcceptModal">
        <div class="nt-modal" @click.stop>
          <div class="nt-modal-header">
            <div class="nt-modal-icon accept">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#10b981" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h3>Confirm acceptance</h3>
              <p>You are about to accept this transfer request</p>
            </div>
            <button class="nt-modal-close" @click="closeAcceptModal">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="nt-modal-body">
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request</span>
              <span class="nt-modal-value code">{{ currentRequestForAction?.request?.requestCode }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">From</span>
              <span class="nt-modal-value">{{ getOriginName(currentRequestForAction?.request) }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">To</span>
              <span class="nt-modal-value">{{ currentRequestForAction?.request?.supplyingStore?.name }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">Approvals pending</span>
              <span class="nt-modal-value">{{ currentRequestForAction?.pendingCount || 0 }}</span>
            </div>
            <div v-if="currentRequestForAction?.request?.remark" class="nt-modal-row column">
              <span class="nt-modal-label">Remark</span>
              <span class="nt-modal-value small">{{ currentRequestForAction.request.remark }}</span>
            </div>
          </div>

          <div class="nt-modal-footer">
            <button class="nt-btn ghost" @click="closeAcceptModal">Cancel</button>
            <button class="nt-btn primary green" @click="confirmAccept" :disabled="accepting">
              {{ accepting ? 'Processing…' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== REJECT MODAL ==================== -->
    <transition name="modal">
      <div v-if="showRejectModal" class="nt-modal-backdrop" @click.self="closeRejectModal">
        <div class="nt-modal" @click.stop>
          <div class="nt-modal-header">
            <div class="nt-modal-icon reject">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ef4444" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <div>
              <h3>Reject request</h3>
              <p>Please provide a clear reason</p>
            </div>
            <button class="nt-modal-close" @click="closeRejectModal">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="nt-modal-body">
            <div class="nt-modal-row">
              <span class="nt-modal-label">Request</span>
              <span class="nt-modal-value code">{{ currentRequestForAction?.request?.requestCode }}</span>
            </div>
            <div class="nt-modal-row">
              <span class="nt-modal-label">From</span>
              <span class="nt-modal-value">{{ getOriginName(currentRequestForAction?.request) }}</span>
            </div>

            <div class="nt-field">
              <label>Reason <span class="req">*</span></label>
              <textarea
                v-model="rejectReason"
                rows="4"
                placeholder="Explain why this request is being rejected…"
                :class="{ error: rejectReasonError }"
              ></textarea>
              <span v-if="rejectReasonError" class="nt-error">{{ rejectReasonError }}</span>
            </div>
          </div>

          <div class="nt-modal-footer">
            <button class="nt-btn ghost" @click="closeRejectModal">Cancel</button>
            <button
              class="nt-btn primary red"
              @click="confirmReject"
              :disabled="!rejectReason.trim() || submitting"
            >
              {{ submitting ? 'Submitting…' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ==================== TOAST ==================== -->
    <transition name="toast">
      <div v-if="showToast" class="nt-toast" :class="toastType">
        <span class="nt-toast-icon">
          <svg v-if="toastType === 'success'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" stroke-width="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else-if="toastType === 'error'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import itemRequestService from '@/stores/itemRequestService'

const authStore = useAuthStore()

// ---------------- state ----------------
const loading = ref(false)
const submitting = ref(false)
const accepting = ref(false)
const notifications = ref([])
const pagination = ref(null)
const summary = ref({ total: 0, pending: 0, accepted: 0, rejected: 0 })
const currentRequestForAction = ref(null)
const rejectReason = ref('')
const rejectReasonError = ref('')
const showAcceptModal = ref(false)
const showRejectModal = ref(false)
const filterStatus = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const selectedRequestId = ref(null)

const statusOptions = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

// ---------------- grouping: request-level ----------------
const requestsById = computed(() => {
  const map = new Map()

  for (const n of notifications.value) {
    const req = n.request
    if (!req) continue

    const rid = req.requestId
    if (!map.has(rid)) {
      map.set(rid, {
        requestId: rid,
        request: req,
        approvals: [],
        latestCreatedAt: 0,
      })
    }
    const entry = map.get(rid)
    entry.approvals.push(n)
    if (n.created_at && new Date(n.created_at).getTime() > entry.latestCreatedAt) {
      entry.latestCreatedAt = new Date(n.created_at).getTime()
    }
  }

  return Array.from(map.values()).map(entry => {
    const statuses = entry.approvals.map(a => a.status)
    const hasPending  = statuses.includes('pending')
    const hasRejected = statuses.includes('rejected')
    const hasAccepted = statuses.includes('accepted')
    let summaryStatus = 'pending'
    if (hasRejected) summaryStatus = 'rejected'
    else if (hasPending) summaryStatus = 'pending'
    else if (hasAccepted) summaryStatus = 'accepted'

    const acceptedCount = statuses.filter(s => s === 'accepted').length
    const pendingCount  = statuses.filter(s => s === 'pending').length
    const rejectedCount = statuses.filter(s => s === 'rejected').length
    const rejections    = entry.approvals.filter(a => a.status === 'rejected')

    return {
      ...entry,
      summaryStatus,
      acceptedCount,
      pendingCount,
      rejectedCount,
      rejections,
    }
  })
})

const groupedRequests = computed(() => {
  const filtered = requestsById.value.filter(r => {
    if (filterStatus.value === 'all') return true
    return r.summaryStatus === filterStatus.value
  })
  return filtered.sort((a, b) => b.latestCreatedAt - a.latestCreatedAt)
})

const groupedNotifications = computed(() => {
  const groups = {}
  for (const req of groupedRequests.value) {
    const d = utcToLocal(new Date(req.latestCreatedAt).toISOString())
    const key = d.toDateString()
    if (!groups[key]) {
      groups[key] = { date: formatDateGroup(d), requests: [] }
    }
    groups[key].requests.push(req)
  }
  return Object.values(groups)
})

// ---------------- computed ----------------
const totalPages = computed(() => pagination.value?.pages || 1)

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push('...')
    pages.push(total)
  }
  return pages
})

const countsByStatus = computed(() => ({
  all:      requestsById.value.length,
  pending:  requestsById.value.filter(r => r.summaryStatus === 'pending').length,
  accepted: requestsById.value.filter(r => r.summaryStatus === 'accepted').length,
  rejected: requestsById.value.filter(r => r.summaryStatus === 'rejected').length,
}))

const selectedRequest = computed(() =>
  requestsById.value.find(r => r.requestId === selectedRequestId.value) || null
)

// ---------------- helpers ----------------
const utcToLocal = (utcDate) => {
  if (!utcDate) return new Date()
  const d = new Date(utcDate)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset)
}

const formatDate = (date) => {
  if (!date) return ''
  const d = utcToLocal(date)
  const diff = Date.now() - d.getTime()
  if (diff < 0) return 'Just now'
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const formatDateFull = (date) => {
  if (!date) return '—'
  const d = utcToLocal(date)
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const formatDateGroup = (date) => {
  const d = date instanceof Date ? date : utcToLocal(date)
  const today = new Date()
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  const key = x => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
  if (key(d) === key(today)) return 'Today'
  if (key(d) === key(yest)) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const formatQty = (q) => {
  const n = Number(q)
  if (Number.isNaN(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

const getUomDisplay = (item) =>
  item?.uom_code || item?.item?.uom?.code || 'units'

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

// "Other" store → use the requester's department
const isOther = (request) => {
  const store = request?.askingStore
  if (!store) return false
  const code = (store.code || '').toUpperCase()
  const name = (store.name || '').trim().toLowerCase()
  return code === 'STORE-008' || name === 'other'
}

const getOriginName = (request) => {
  if (!request) return '—'
  if (isOther(request)) {
    return request.requestedByUser?.Department?.name || 'External'
  }
  return request.askingStore?.name || '—'
}

const getOriginCode = (request) => {
  if (!request) return ''
  if (isOther(request)) {
    return request.requestedByUser?.Department?.code || ''
  }
  return request.askingStore?.code || ''
}

// ---------------- selection ----------------
const selectRequest = (rid) => {
  selectedRequestId.value = selectedRequestId.value === rid ? null : rid
}

// ---------------- loading ----------------
const loadAllNotifications = async (resetPage = true) => {
  try {
    loading.value = true
    if (resetPage) {
      currentPage.value = 1
      selectedRequestId.value = null
    }

    const storeId = authStore.userStoreId
    const groupId = authStore.userGroupId
    const departmentId = authStore.user?.departmentId
    const hasGroupAccess = !!(storeId && groupId)
    const hasDeptAccess = !!departmentId

    if (!hasGroupAccess && !hasDeptAccess) {
      notifications.value = []
      return
    }

    const params = { page: currentPage.value, limit: pageSize.value }

    let response = null

    if (hasGroupAccess && hasDeptAccess) {
      const [g, d] = await Promise.all([
        itemRequestService.getGroupNotifications(storeId, groupId, params),
        itemRequestService.getDepartmentNotifications(departmentId, params),
      ])
      const gNotifs = g.success ? g.data?.notifications || [] : []
      const dNotifs = d.success ? d.data?.notifications || [] : []
      const merged = [...gNotifs, ...dNotifs]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      const gs = g.data?.summary || {}
      const ds = d.data?.summary || {}
      response = {
        success: true,
        data: {
          notifications: merged,
          pagination: {
            page: currentPage.value,
            limit: pageSize.value,
            total: merged.length,
            pages: Math.ceil(merged.length / pageSize.value),
          },
          summary: {
            total:    (gs.total    || 0) + (ds.total    || 0),
            pending:  (gs.pending  || 0) + (ds.pending  || 0),
            accepted: (gs.accepted || 0) + (ds.accepted || 0),
            rejected: (gs.rejected || 0) + (ds.rejected || 0),
          },
        },
      }
    } else if (hasGroupAccess) {
      response = await itemRequestService.getGroupNotifications(storeId, groupId, params)
    } else if (hasDeptAccess) {
      response = await itemRequestService.getDepartmentNotifications(departmentId, params)
    }

    if (response?.success) {
      notifications.value = response.data?.notifications || []
      pagination.value = response.data?.pagination || null
      summary.value = response.data?.summary || { total: 0, pending: 0, accepted: 0, rejected: 0 }
    } else {
      showToastMessage(response?.error || 'Failed to load', 'error')
      notifications.value = []
    }
  } catch (e) {
    console.error('Load error:', e)
    showToastMessage('Failed to load notifications', 'error')
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const goToPage = (p) => {
  if (p < 1 || p > totalPages.value || loading.value) return
  currentPage.value = p
  loadAllNotifications(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onFilterChange = () => loadAllNotifications(true)
const onSearchChange = () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadAllNotifications(true), 300)
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

// ---------------- accept ----------------
const acceptAllPendingFor = async (reqEntry) => {
  const pending = reqEntry.approvals.filter(a => a.status === 'pending')
  if (pending.length === 0) {
    showToastMessage('Nothing pending to accept', 'warning')
    return
  }
  currentRequestForAction.value = reqEntry
  showAcceptModal.value = true
}

const closeAcceptModal = () => {
  showAcceptModal.value = false
  currentRequestForAction.value = null
  accepting.value = false
}

const confirmAccept = async () => {
  const entry = currentRequestForAction.value
  if (!entry) return
  accepting.value = true
  try {
    const pending = entry.approvals.filter(a => a.status === 'pending')
    const results = await Promise.all(
      pending.map(a => itemRequestService.acceptNotification(a.id))
    )
    const ok = results.filter(r => r.success).length
    if (ok > 0) {
      showToastMessage(`${ok} approval${ok === 1 ? '' : 's'} accepted`, 'success')
      await loadAllNotifications(true)
      closeAcceptModal()
    } else {
      showToastMessage('Failed to accept', 'error')
    }
  } catch {
    showToastMessage('Failed to accept', 'error')
  } finally {
    accepting.value = false
  }
}

// ---------------- reject ----------------
const openRejectFor = (reqEntry) => {
  const pending = reqEntry.approvals.filter(a => a.status === 'pending')
  if (pending.length === 0) {
    showToastMessage('Nothing pending to reject', 'warning')
    return
  }
  currentRequestForAction.value = reqEntry
  rejectReason.value = ''
  rejectReasonError.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  currentRequestForAction.value = null
  rejectReason.value = ''
  rejectReasonError.value = ''
  submitting.value = false
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    rejectReasonError.value = 'Please provide a rejection reason'
    return
  }
  const entry = currentRequestForAction.value
  if (!entry) return
  submitting.value = true
  try {
    const pending = entry.approvals.filter(a => a.status === 'pending')
    const results = await Promise.all(
      pending.map(a => itemRequestService.rejectNotification(a.id, rejectReason.value.trim()))
    )
    const ok = results.filter(r => r.success).length
    if (ok > 0) {
      showToastMessage(`Request rejected`, 'warning')
      await loadAllNotifications(true)
      closeRejectModal()
    } else {
      showToastMessage('Failed to reject', 'error')
    }
  } catch {
    showToastMessage('Failed to reject', 'error')
  } finally {
    submitting.value = false
  }
}

// ---------------- lifecycle ----------------
onMounted(() => loadAllNotifications(true))

watch([filterStatus], () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadAllNotifications(true), 200)
})
</script>

<style scoped>
/* ================= BASE ================= */
.nt-page {
  min-height: 100vh;
  background: #f7f8fb;
  padding: 28px 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}
@media (max-width: 768px) {
  .nt-page { padding: 16px; }
}

/* ================= TOPBAR ================= */
.nt-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}
.nt-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.6px;
  margin: 0;
  background: linear-gradient(90deg, #0f172a 0%, #6a11cb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.nt-subtitle {
  font-size: 13.5px;
  color: #64748b;
  margin: 4px 0 0;
  font-weight: 500;
}
.nt-topbar-actions { display: flex; align-items: center; gap: 12px; }

.nt-segment {
  display: inline-flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  gap: 3px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.nt-seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(.4,0,.2,1);
  letter-spacing: -0.1px;
}
.nt-seg-btn:hover:not(.active) { background: #f1f5f9; color: #0f172a; }
.nt-seg-btn.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
}
.nt-seg-btn.seg-pending.active  { background: #f59e0b; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.35); }
.nt-seg-btn.seg-accepted.active { background: #10b981; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35); }
.nt-seg-btn.seg-rejected.active { background: #ef4444; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35); }

.nt-seg-count {
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
  padding: 0 7px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  min-width: 20px;
  text-align: center;
}
.nt-seg-btn.active .nt-seg-count { background: rgba(255, 255, 255, 0.28); }

.nt-icon-btn {
  width: 40px; height: 40px;
  border-radius: 11px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.nt-icon-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
}
.nt-icon-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.nt-icon-btn svg.spinning { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ================= SEARCH ================= */
.nt-searchbar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 16px;
  height: 46px;
  margin-bottom: 22px;
  color: #94a3b8;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: all 0.15s;
}
.nt-searchbar:focus-within {
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}
.nt-searchbar input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
}
.nt-searchbar input::placeholder { color: #94a3b8; font-weight: 400; }
.nt-search-clear {
  border: none; background: none; color: #94a3b8;
  cursor: pointer; font-size: 13px; padding: 4px;
  border-radius: 6px; transition: all 0.15s;
}
.nt-search-clear:hover { background: #f1f5f9; color: #0f172a; }

/* ================= LAYOUT ================= */
.nt-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 22px;
  align-items: start;
}
@media (max-width: 1180px) {
  .nt-layout { grid-template-columns: 1fr; }
  .nt-detail-column { position: static; }
}

/* ================= LIST ================= */
.nt-list-column { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

.nt-date-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px 6px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  color: #64748b;
}
.nt-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
.nt-divider-count {
  font-size: 10.5px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 10px;
}

/* ================= CARD ================= */
.nt-card {
  position: relative;
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.nt-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}
.nt-card.selected {
  border-color: #6a11cb;
  box-shadow: 0 8px 24px rgba(106, 17, 203, 0.16);
  transform: translateY(-1px);
}

.nt-stripe { width: 4px; flex-shrink: 0; }
.nt-stripe.pending  { background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%); }
.nt-stripe.accepted { background: linear-gradient(180deg, #34d399 0%, #10b981 100%); }
.nt-stripe.rejected { background: linear-gradient(180deg, #f87171 0%, #ef4444 100%); }

.nt-card-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 800;
}
.nt-card.pending  .nt-card-status { background: #fffbeb; color: #d97706; }
.nt-card.accepted .nt-card-status { background: #f0fdf4; color: #059669; }
.nt-card.rejected .nt-card-status { background: #fef2f2; color: #dc2626; }

.nt-card-body {
  flex: 1; min-width: 0;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nt-card-row-1 { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.nt-code {
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  font-size: 12.5px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.2px;
}
.nt-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  background: #f1f5f9;
  color: #64748b;
  letter-spacing: 0.1px;
}
.nt-chip.time { background: transparent; color: #94a3b8; padding: 0; font-weight: 600; }
.nt-chip.remark { background: #f0fdf4; color: #166534; }

.nt-card-row-2 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.nt-route {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
  min-width: 0;
}
.nt-route-origin, .nt-route-dest {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.nt-route-origin.other { color: #6b21a8; }
.nt-route-arrow { color: #cbd5e1; flex-shrink: 0; }

.nt-card-row-3 {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
.nt-meta-sep { color: #cbd5e1; }

/* Approval chips */
.nt-approval-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.nt-approval-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid transparent;
  max-width: 200px;
  transition: all 0.15s;
}
.nt-approval-chip-icon { font-size: 11px; }
.nt-approval-chip-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nt-approval-chip-status { font-size: 10px; }

.nt-approval-chip.pending {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.nt-approval-chip.accepted {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.nt-approval-chip.rejected {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

/* Right side actions */
.nt-card-right {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  flex-shrink: 0;
}
.nt-quick-btn {
  width: 32px; height: 32px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  transition: all 0.15s;
}
.nt-quick-btn.accept { background: #dcfce7; color: #047857; }
.nt-quick-btn.accept:hover { background: #10b981; color: #ffffff; transform: scale(1.05); }
.nt-quick-btn.reject { background: #fee2e2; color: #991b1b; }
.nt-quick-btn.reject:hover { background: #ef4444; color: #ffffff; transform: scale(1.05); }

.nt-chevron { color: #94a3b8; transition: transform 0.25s; flex-shrink: 0; }
.nt-chevron.rotated { transform: rotate(180deg); }

/* ================= DETAIL ================= */
.nt-detail-column { position: sticky; top: 28px; max-height: calc(100vh - 56px); }

.nt-detail-empty {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  padding: 40px 24px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.nt-empty-detail-illustration { margin-bottom: 16px; }
.nt-empty-detail-title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
}
.nt-empty-detail-text {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.5;
  max-width: 260px;
}
.nt-empty-detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  border-top: 1px solid #f1f5f9;
  padding-top: 20px;
}
.nt-empty-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.nt-empty-stat-value { font-size: 20px; font-weight: 800; }
.nt-empty-stat-value.pending  { color: #f59e0b; }
.nt-empty-stat-value.accepted { color: #10b981; }
.nt-empty-stat-value.rejected { color: #ef4444; }
.nt-empty-stat-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
}

.nt-detail {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 56px);
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
}

.nt-detail-header {
  padding: 20px 22px;
  border-bottom: 1px solid #f1f5f9;
}
.nt-detail-header.pending  { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); }
.nt-detail-header.accepted { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
.nt-detail-header.rejected { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }

.nt-detail-header-top { display: flex; align-items: center; gap: 14px; }
.nt-detail-header-icon {
  width: 42px; height: 42px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.7);
}
.nt-detail-header-icon.pending  { color: #d97706; }
.nt-detail-header-icon.accepted { color: #059669; }
.nt-detail-header-icon.rejected { color: #dc2626; }

.nt-detail-header-text { display: flex; flex-direction: column; min-width: 0; }
.nt-detail-code {
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
}
.nt-detail-status-label {
  font-size: 10.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 3px;
}
.nt-detail-status-label.pending  { color: #d97706; }
.nt-detail-status-label.accepted { color: #059669; }
.nt-detail-status-label.rejected { color: #dc2626; }

.nt-detail-body {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.nt-section { display: flex; flex-direction: column; gap: 10px; }
.nt-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nt-section-title {
  font-size: 10.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #64748b;
}
.nt-section-count {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
}

/* Route */
.nt-route-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
}
.nt-route-side { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.nt-route-label {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
}
.nt-route-value {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nt-route-value.other { color: #6b21a8; }
.nt-route-code {
  font-size: 11px;
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  color: #64748b;
  font-weight: 600;
}
.nt-route-line { flex-shrink: 0; }

/* User */
.nt-user { display: flex; align-items: center; gap: 12px; }
.nt-user-avatar {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6a11cb, #8b5cf6);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 6px rgba(106, 17, 203, 0.25);
}
.nt-user-info { display: flex; flex-direction: column; min-width: 0; gap: 2px; }
.nt-user-name { font-size: 14px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
.nt-user-sub { font-size: 11.5px; color: #64748b; font-weight: 500; }

/* Approvals list */
.nt-approvals-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.nt-approval-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.nt-approval-item:last-child { border-bottom: none; }
.nt-approval-item.pending  { background: #fffbeb; }
.nt-approval-item.accepted { background: #f0fdf4; }
.nt-approval-item.rejected { background: #fef2f2; }

.nt-approval-item-icon {
  width: 32px; height: 32px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}
.nt-approval-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.nt-approval-item-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nt-approval-item-type {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nt-approval-item-reason {
  font-size: 11.5px;
  color: #991b1b;
  font-weight: 600;
  font-style: italic;
  margin-top: 3px;
  padding: 3px 8px;
  background: rgba(254, 226, 226, 0.6);
  border-radius: 6px;
  display: inline-block;
  align-self: flex-start;
}
.nt-approval-item-status {
  font-size: 15px;
  font-weight: 900;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}
.nt-approval-item-status.pending  { color: #d97706; }
.nt-approval-item-status.accepted { color: #059669; }
.nt-approval-item-status.rejected { color: #dc2626; }

/* Items */
.nt-items {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.nt-item {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: #ffffff;
}
.nt-item:last-child { border-bottom: none; }
.nt-item-main { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.nt-item-name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.1px;
}
.nt-item-qty {
  font-size: 11.5px;
  font-weight: 800;
  color: #6b21a8;
  background: #f3e8ff;
  padding: 3px 9px;
  border-radius: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.nt-item-code {
  font-size: 11px;
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  color: #94a3b8;
  margin-top: 4px;
  font-weight: 500;
}
.nt-item-remark {
  margin-top: 6px;
  font-size: 11.5px;
  color: #64748b;
  font-weight: 500;
}

/* Remark */
.nt-remark {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  padding: 12px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
  color: #14532d;
  font-weight: 500;
}

/* Rejection */
.nt-section.rejection .nt-section-title { color: #991b1b; }
.nt-rejection-text {
  margin: 0 0 6px;
  font-size: 12.5px;
  line-height: 1.5;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  color: #7f1d1d;
}
.nt-rejection-text:last-child { margin-bottom: 0; }

/* Footer */
.nt-detail-footer {
  display: flex;
  gap: 10px;
  padding: 16px 22px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}
.nt-action-btn {
  flex: 1;
  padding: 12px 18px;
  border-radius: 11px;
  border: none;
  font-weight: 800;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  letter-spacing: -0.1px;
}
.nt-action-btn.accept {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.28);
}
.nt-action-btn.accept:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35); }
.nt-action-btn.reject {
  background: #ffffff;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.nt-action-btn.reject:hover { background: #fef2f2; }

/* ================= PAGINATION ================= */
.nt-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 8px;
}
.nt-page-btn {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}
.nt-page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.nt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.nt-page-numbers { display: flex; gap: 4px; }
.nt-page-num {
  min-width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.nt-page-num:hover:not(.dots):not(.active) { background: #f1f5f9; color: #0f172a; }
.nt-page-num.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
}
.nt-page-num.dots { cursor: default; color: #cbd5e1; }

/* ================= SKELETON ================= */
.nt-skeleton-card {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  min-height: 110px;
}
.nt-skeleton-stripe { width: 4px; background: #e2e8f0; }
.nt-skeleton-body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
.nt-skeleton-detail {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.nt-skel-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
.nt-skel-block {
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ================= EMPTY ================= */
.nt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 72px 24px;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  text-align: center;
}
.nt-empty-icon {
  margin-bottom: 16px;
  width: 80px; height: 80px;
  border-radius: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}
.nt-empty h3 {
  font-size: 17px;
  font-weight: 800;
  margin: 0 0 6px;
  color: #0f172a;
  letter-spacing: -0.3px;
}
.nt-empty p {
  font-size: 13.5px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* ================= MODALS ================= */
.nt-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}
.nt-modal {
  background: #ffffff;
  border-radius: 20px;
  width: 480px;
  max-width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.35);
}
.nt-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 24px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
}
.nt-modal-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nt-modal-icon.accept { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.nt-modal-icon.reject { background: linear-gradient(135deg, #fee2e2, #fecaca); }
.nt-modal-header h3 {
  font-size: 17px;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.3px;
}
.nt-modal-header p {
  font-size: 12.5px;
  color: #64748b;
  margin: 3px 0 0;
  font-weight: 500;
}
.nt-modal-close {
  position: absolute;
  top: 18px; right: 18px;
  width: 32px; height: 32px;
  border: none; background: transparent;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.nt-modal-close:hover { background: #f1f5f9; color: #0f172a; }

.nt-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nt-modal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}
.nt-modal-row:last-child { border-bottom: none; }
.nt-modal-row.column { flex-direction: column; align-items: stretch; gap: 6px; }
.nt-modal-label { font-size: 12.5px; color: #64748b; font-weight: 600; }
.nt-modal-value { font-size: 13.5px; color: #0f172a; font-weight: 700; text-align: right; }
.nt-modal-value.code {
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  color: #6b21a8;
  font-weight: 800;
}
.nt-modal-value.small {
  font-weight: 500;
  font-size: 13px;
  color: #334155;
  text-align: left;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.nt-field { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.nt-field label { font-size: 12.5px; font-weight: 800; color: #0f172a; }
.nt-field .req { color: #ef4444; }
.nt-field textarea {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13.5px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.15s;
  outline: none;
}
.nt-field textarea:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.12);
}
.nt-field textarea.error { border-color: #ef4444; }
.nt-error { font-size: 12px; color: #ef4444; font-weight: 600; }

.nt-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}
.nt-btn {
  padding: 11px 20px;
  border-radius: 11px;
  border: 1px solid transparent;
  font-weight: 800;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: -0.1px;
}
.nt-btn.ghost {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #334155;
}
.nt-btn.ghost:hover { background: #f1f5f9; border-color: #cbd5e1; }
.nt-btn.primary { color: #ffffff; }
.nt-btn.primary.green {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.28);
}
.nt-btn.primary.green:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}
.nt-btn.primary.red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.28);
}
.nt-btn.primary.red:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
}
.nt-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ================= TOAST ================= */
.nt-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: #ffffff;
  z-index: 2000;
  letter-spacing: -0.1px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.25);
}
.nt-toast.success { background: linear-gradient(135deg, #10b981, #059669); }
.nt-toast.error   { background: linear-gradient(135deg, #ef4444, #dc2626); }
.nt-toast.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
.nt-toast-icon { display: inline-flex; align-items: center; }

/* ================= TRANSITIONS ================= */
.panel-enter-active, .panel-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.panel-enter-from { opacity: 0; transform: translateY(8px); }
.panel-leave-to   { opacity: 0; transform: translateY(-8px); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .nt-modal { animation: nt-modal-in 0.24s cubic-bezier(.4,0,.2,1); }
@keyframes nt-modal-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-12px); }

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
  .nt-page { padding: 16px; }
  .nt-title { font-size: 22px; }
  .nt-topbar { flex-direction: column; align-items: stretch; }
  .nt-topbar-actions { width: 100%; justify-content: space-between; }
  .nt-segment { flex: 1; overflow-x: auto; }

  .nt-card-status { width: 44px; font-size: 15px; }
  .nt-card-body { padding: 12px 12px; gap: 6px; }
  .nt-card-right { padding: 0 10px; gap: 4px; }
  .nt-quick-btn { width: 28px; height: 28px; font-size: 12px; }
  .nt-route-origin, .nt-route-dest { max-width: 120px; }

  .nt-detail { max-height: none; }
  .nt-route-card { padding: 12px; }
}
</style>