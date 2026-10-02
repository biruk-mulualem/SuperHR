<!-- views/notifications/Notifications.vue -->
<template>
  <div class="nt-page">
    <!-- ==================== TOP BAR ==================== -->
    <header class="nt-topbar">
      <div class="nt-topbar-left">
        <h1 class="nt-title">
          <span class="nt-title-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </span>
          Notifications
        </h1>
        <p class="nt-subtitle">
          <span class="nt-subtitle-dot"></span>
          <strong>{{ totalPendingRequests }}</strong>
          pending request{{ totalPendingRequests === 1 ? '' : 's' }} need your attention
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
            <span class="nt-seg-count">{{ summary[opt.value] || 0 }}</span>
          </button>
        </div>

        <button class="nt-icon-btn" @click="loadNotifications(true)" :disabled="loading" title="Refresh">
          <svg :class="{ spinning: loading }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>
    </header>

    <!-- ==================== SEARCH ==================== -->
    <div class="nt-searchbar">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
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

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading && notifications.length === 0" class="nt-list">
      <div v-for="i in 5" :key="i" class="nt-skeleton-card">
        <div class="nt-skeleton-stripe"></div>
        <div class="nt-skeleton-body">
          <div class="nt-skel-line" style="width: 30%"></div>
          <div class="nt-skel-line" style="width: 60%"></div>
          <div class="nt-skel-line" style="width: 45%"></div>
        </div>
      </div>
    </div>

    <!-- ==================== EMPTY ==================== -->
    <div v-else-if="groupedRequests.length === 0" class="nt-empty">
      <div class="nt-empty-icon">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </div>
      <h3>All caught up</h3>
      <p>
        {{ filterStatus === 'all'
            ? 'No notifications to review right now.'
            : `No ${filterStatus} notifications.` }}
      </p>
    </div>

    <!-- ==================== MAIN LIST (collapsible) ==================== -->
    <div v-else class="nt-list">
      <template v-for="(group, gi) in groupedNotifications" :key="gi">
        <div class="nt-date-divider">
          <span class="nt-date-label">{{ group.date }}</span>
          <span class="nt-divider-line"></span>
          <span class="nt-divider-count">{{ group.requests.length }}</span>
        </div>

        <!-- ===== Collapsible request card ===== -->
        <div
          v-for="req in group.requests"
          :key="req.requestId"
          class="nt-request"
          :class="[req.summaryStatus, { open: isExpanded(req.requestId) }]"
        >
          <!-- ---- Collapsible header ---- -->
          <button
            class="nt-request-header"
            @click="toggleExpand(req.requestId)"
            :aria-expanded="isExpanded(req.requestId)"
          >
            <span class="nt-stripe" :class="req.summaryStatus"></span>

            <span class="nt-header-status" :class="req.summaryStatus">
              <svg v-if="req.summaryStatus === 'pending'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <svg v-else-if="req.summaryStatus === 'accepted'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </span>

            <span class="nt-header-main">
              <span class="nt-header-row-1">
                <span class="nt-code">{{ req.request.requestCode }}</span>
                <span class="nt-dot">·</span>
                <span class="nt-time">{{ formatDate(getRequestedDate(req.request)) }}</span>
                <span class="nt-status-pill" :class="req.summaryStatus">
                  {{ capitalize(req.summaryStatus) }}
                </span>
              </span>

              <span class="nt-header-row-2">
                <span class="nt-route-origin" :class="{ other: isOther(req.request) }">
                  {{ getOriginName(req.request) }}
                </span>
                <svg class="nt-route-arrow" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <span class="nt-route-dest">{{ req.request.supplyingStore?.name || '—' }}</span>
              </span>

              <span class="nt-header-row-3">
                <span class="nt-meta">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  </svg>
                  {{ req.request.items?.length || 0 }} item{{ req.request.items?.length === 1 ? '' : 's' }}
                </span>
                <span class="nt-meta-sep">·</span>
                <span class="nt-meta">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {{ req.request.requestedByUser?.fullName || 'Unknown' }}
                </span>
              </span>
            </span>

            <span class="nt-header-chevron" :class="{ rotated: isExpanded(req.requestId) }">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          <!-- ---- Expanded body ---- -->
          <transition name="expand">
            <div v-show="isExpanded(req.requestId)" class="nt-request-body">
              <!-- Route summary -->
              <div class="nt-route-card">
                <div class="nt-route-side">
                  <span class="nt-route-label">From</span>
                  <span class="nt-route-value" :class="{ other: isOther(req.request) }">
                    {{ getOriginName(req.request) }}
                  </span>
                  <span class="nt-route-code">{{ getOriginCode(req.request) }}</span>
                </div>
                <div class="nt-route-arrow-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
                <div class="nt-route-side right">
                  <span class="nt-route-label">To</span>
                  <span class="nt-route-value">{{ req.request.supplyingStore?.name || '—' }}</span>
                  <span class="nt-route-code">{{ req.request.supplyingStore?.code || '—' }}</span>
                </div>
              </div>

              <!-- Requested by -->
              <div class="nt-inline-user">
                <div class="nt-user-avatar">{{ getInitials(req.request.requestedByUser?.fullName) }}</div>
                <div class="nt-user-info">
                  <span class="nt-user-name">{{ req.request.requestedByUser?.fullName || 'Unknown' }}</span>
                  <span class="nt-user-sub">
                    Request date: {{ formatDateFull(getRequestedDate(req.request)) }}
                  </span>
                </div>
              </div>

              <!-- Approvals -->
              <div class="nt-block">
                <div class="nt-block-header">
                  <span class="nt-block-title">Approvals</span>
                  <span class="nt-block-badge">{{ req.acceptedCount }}/{{ req.approvals.length }}</span>
                </div>
                <div class="nt-approvals-list">
                  <div
                    v-for="a in req.approvals"
                    :key="a.id"
                    class="nt-approval-item"
                    :class="a.status"
                  >
                    <div class="nt-approval-item-icon">
                      <svg v-if="a.approval_type === 'group'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                      </svg>
                    </div>
                    <div class="nt-approval-item-body">
                      <span class="nt-approval-item-name">
                        {{ a.group?.name || a.department?.name || '—' }}
                      </span>
                      <span class="nt-approval-item-type">
                        {{ a.approval_type === 'group' ? 'Group approval' : 'Department approval' }}
                        <template v-if="a.respondedByUser">
                          · {{ a.respondedByUser.fullName || a.respondedByUser.username }}
                        </template>
                      </span>
                      <span v-if="a.rejected_reason" class="nt-approval-item-reason">
                        "{{ a.rejected_reason }}"
                      </span>
                    </div>
                    <span class="nt-approval-item-status" :class="a.status">
                      <svg v-if="a.status === 'pending'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      <svg v-else-if="a.status === 'accepted'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <!-- ============ ITEMS TABLE ============ -->
              <div class="nt-block">
                <div class="nt-block-header">
                  <span class="nt-block-title">Items</span>
                  <span class="nt-block-badge">{{ req.request.items?.length || 0 }}</span>
                </div>

                <div v-if="(req.request.items || []).length === 0" class="nt-items-empty">
                  No items in this request.
                </div>

                <div v-else class="nt-table-wrap">
                  <table class="nt-table">
                    <thead>
                      <tr>
                        <th class="nt-th-num">#</th>
                        <th>Code</th>
                        <th>Item</th>
                        <th>UOM</th>
                        <th class="nt-th-qty">Qty</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Specification</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, i) in req.request.items" :key="i">
                        <td class="nt-td-num" data-label="#">{{ i + 1 }}</td>
                        <td class="nt-td-code" data-label="Code">
                          <span v-if="item.item?.code">{{ item.item.code }}</span>
                          <span v-else class="nt-muted">—</span>
                        </td>
                        <td class="nt-td-item" data-label="Item">{{ item.item?.name || 'Unknown Item' }}</td>
                        <td class="nt-td-uom" data-label="UOM">{{ getUomDisplay(item) }}</td>
                        <td class="nt-td-qty" data-label="Qty">{{ formatQty(item.quantity) }}</td>
                        <td class="nt-td-brand" data-label="Brand">
                          <span v-if="item.brand">{{ item.brand }}</span>
                          <span v-else class="nt-muted">—</span>
                        </td>
                        <td class="nt-td-model" data-label="Model">
                          <span v-if="item.model">{{ item.model }}</span>
                          <span v-else class="nt-muted">—</span>
                        </td>
                        <td class="nt-td-spec" data-label="Specification">
                          <span v-if="item.specification">{{ item.specification }}</span>
                          <span v-else class="nt-muted">—</span>
                        </td>
                        <td class="nt-td-remark" data-label="Remark">
                          <span v-if="item.remark">{{ item.remark }}</span>
                          <span v-else class="nt-muted">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Request remark -->
              <div v-if="req.request.remark" class="nt-block">
                <span class="nt-block-title">Remark</span>
                <p class="nt-remark">{{ req.request.remark }}</p>
              </div>

              <!-- Rejections -->
              <div v-if="req.rejections.length > 0" class="nt-block">
                <span class="nt-block-title rejected">Rejection reasons</span>
                <div class="nt-rejection-list">
                  <p v-for="(r, i) in req.rejections" :key="i" class="nt-rejection-text">
                    <strong>{{ r.group?.name || r.department?.name }}</strong>
                    <span>{{ r.rejected_reason }}</span>
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div v-if="req.summaryStatus === 'pending'" class="nt-request-actions">
                <button class="nt-action-btn reject" @click="openRejectFor(req)">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Reject
                </button>
                <button class="nt-action-btn accept" @click="acceptAllPendingFor(req)">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Accept all
                </button>
              </div>
            </div>
          </transition>
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

    <!-- ==================== ACCEPT MODAL ==================== -->
    <transition name="modal">
      <div v-if="showAcceptModal" class="nt-modal-backdrop" @click.self="closeAcceptModal">
        <div class="nt-modal" @click.stop>
          <div class="nt-modal-header accept">
            <div class="nt-modal-icon accept">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="3">
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
              <span class="nt-modal-label">Request date</span>
              <span class="nt-modal-value">{{ formatDateFull(getRequestedDate(currentRequestForAction?.request)) }}</span>
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
          <div class="nt-modal-header reject">
            <div class="nt-modal-icon reject">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2.5">
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
              <span class="nt-modal-label">Request date</span>
              <span class="nt-modal-value">{{ formatDateFull(getRequestedDate(currentRequestForAction?.request)) }}</span>
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
          <svg v-if="toastType === 'success'" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" stroke-width="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else-if="toastType === 'error'" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ffffff" stroke-width="2">
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
import { ref, computed, onMounted, watch } from 'vue'
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

// Track expanded cards by requestId
const expandedIds = ref(new Set())

const statusOptions = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
]

// ---------------- grouping ----------------
const requestsById = computed(() => {
  const map = new Map()
  for (const n of notifications.value) {
    const req = n.request
    if (!req) continue
    const rid = req.requestId
    if (!map.has(rid)) {
      map.set(rid, { requestId: rid, request: req, approvals: [], latestCreatedAt: 0 })
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

    return {
      ...entry,
      summaryStatus,
      acceptedCount: statuses.filter(s => s === 'accepted').length,
      pendingCount:  statuses.filter(s => s === 'pending').length,
      rejectedCount: statuses.filter(s => s === 'rejected').length,
      rejections:    entry.approvals.filter(a => a.status === 'rejected'),
    }
  })
})

const groupedRequests = computed(() => requestsById.value)

const groupedNotifications = computed(() => {
  const groups = {}
  const sorted = [...requestsById.value].sort((a, b) => b.latestCreatedAt - a.latestCreatedAt)
  for (const req of sorted) {
    const d = new Date(req.latestCreatedAt)
    const key = d.toDateString()
    if (!groups[key]) groups[key] = { date: formatDateGroup(d), requests: [] }
    groups[key].requests.push(req)
  }
  return Object.values(groups)
})

// ---------------- computed ----------------
const totalPages = computed(() => pagination.value?.pages || 1)
const totalPendingRequests = computed(() => summary.value.pending || 0)

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

// ---------------- helpers ----------------
const utcToLocal = (utcDate) => {
  if (!utcDate) return new Date()
  const d = new Date(utcDate)
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset)
}

const getRequestedDate = (request) =>
  request?.requestedAt ||
  request?.requested_at ||
  request?.requestedDate ||
  request?.createdAt ||
  null

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

const getUomDisplay = (item) => item?.uom_code || item?.item?.uom?.code || 'units'

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

const isOther = (request) => {
  const store = request?.askingStore
  if (!store) return false
  const code = (store.code || '').toUpperCase()
  const name = (store.name || '').trim().toLowerCase()
  return code === 'STORE-008' || name === 'other'
}

const getOriginName = (request) => {
  if (!request) return '—'
  if (isOther(request)) return request.requestedByUser?.Department?.name || 'External'
  return request.askingStore?.name || '—'
}

const getOriginCode = (request) => {
  if (!request) return ''
  if (isOther(request)) return request.requestedByUser?.Department?.code || ''
  return request.askingStore?.code || ''
}

// ---------------- expand / collapse ----------------
const isExpanded = (rid) => expandedIds.value.has(rid)

const toggleExpand = (rid) => {
  const next = new Set(expandedIds.value)
  if (next.has(rid)) next.delete(rid)
  else next.add(rid)
  expandedIds.value = next
}

// ---------------- actions ----------------
const loadNotifications = async (resetPage = true) => {
  try {
    loading.value = true

    if (resetPage) {
      currentPage.value = 1
      expandedIds.value = new Set()
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

    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
      search: searchQuery.value || undefined,
    }

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
  loadNotifications(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onFilterChange = () => loadNotifications(true)
const onSearchChange = () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadNotifications(true), 300)
}

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  setTimeout(() => (showToast.value = false), 3000)
}

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
    const results = await Promise.all(pending.map(a => itemRequestService.acceptNotification(a.id)))
    const ok = results.filter(r => r.success).length
    if (ok > 0) {
      showToastMessage(`${ok} approval${ok === 1 ? '' : 's'} accepted`, 'success')
      await loadNotifications(true)
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
      await loadNotifications(true)
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
onMounted(() => loadNotifications(true))

watch([filterStatus], () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadNotifications(true), 200)
})
</script>

<style scoped>
/* ================= BASE ================= */
.nt-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 32px 40px 64px;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 768px) {
  .nt-page { padding: 20px 16px 48px; }
}

/* ================= TOPBAR ================= */
.nt-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

.nt-topbar-left { min-width: 0; }

.nt-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.8px;
  margin: 0;
  color: #0f172a;
}

.nt-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: #ede9fe;
  color: #6d28d9;
  flex-shrink: 0;
}

.nt-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #64748b;
  margin: 8px 0 0 48px;
  font-weight: 500;
}

.nt-subtitle strong { color: #6d28d9; font-weight: 700; }

.nt-subtitle-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #a78bfa;
}

.nt-topbar-actions { display: flex; align-items: center; gap: 10px; }

.nt-segment {
  display: inline-flex;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.nt-seg-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  background: transparent;
  border: none;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-seg-btn:hover:not(.active) { background: #f8fafc; color: #0f172a; }

.nt-seg-btn.active {
  background: #0f172a;
  color: #ffffff;
}

.nt-seg-btn.seg-pending.active  { background: #d97706; }
.nt-seg-btn.seg-accepted.active { background: #059669; }
.nt-seg-btn.seg-rejected.active { background: #dc2626; }

.nt-seg-count {
  background: rgba(15, 23, 42, 0.06);
  color: inherit;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 800;
  min-width: 18px;
  text-align: center;
}

.nt-seg-btn.active .nt-seg-count { background: rgba(255, 255, 255, 0.25); }

.nt-icon-btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-icon-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #6d28d9;
  border-color: #c4b5fd;
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
  border-radius: 10px;
  padding: 0 14px;
  height: 42px;
  margin-bottom: 24px;
  color: #94a3b8;
  transition: all 0.15s;
}

.nt-searchbar:focus-within {
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
  color: #6d28d9;
}

.nt-searchbar input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  color: #0f172a;
  font-weight: 500;
}

.nt-searchbar input::placeholder { color: #94a3b8; font-weight: 400; }

.nt-search-clear {
  border: none; background: none; color: #94a3b8;
  cursor: pointer; font-size: 12px; padding: 4px;
  border-radius: 5px; transition: all 0.15s;
}

.nt-search-clear:hover { background: #f1f5f9; color: #0f172a; }

/* ================= LIST ================= */
.nt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nt-date-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 4px 4px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
}

.nt-date-label { color: #64748b; }
.nt-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
.nt-divider-count {
  font-size: 10px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 7px;
  border-radius: 8px;
  font-weight: 700;
}

/* ================= COLLAPSIBLE REQUEST ================= */
.nt-request {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.18s, border-color 0.18s;
}

.nt-request:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.nt-request.open {
  border-color: #cbd5e1;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}

.nt-request-header {
  display: flex;
  align-items: stretch;
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  gap: 0;
}

.nt-stripe {
  width: 4px;
  flex-shrink: 0;
  align-self: stretch;
}
.nt-stripe.pending  { background: #f59e0b; }
.nt-stripe.accepted { background: #10b981; }
.nt-stripe.rejected { background: #ef4444; }

.nt-header-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  flex-shrink: 0;
}

.nt-request.pending  .nt-header-status { background: #fffbeb; color: #d97706; }
.nt-request.accepted .nt-header-status { background: #f0fdf4; color: #059669; }
.nt-request.rejected .nt-header-status { background: #fef2f2; color: #dc2626; }

.nt-header-main {
  flex: 1;
  min-width: 0;
  padding: 13px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nt-header-row-1 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nt-code {
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  font-size: 12.5px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.2px;
}

.nt-dot { color: #cbd5e1; font-weight: 700; }

.nt-time {
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 600;
}

.nt-status-pill {
  font-size: 9.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 5px;
  margin-left: 2px;
}

.nt-status-pill.pending  { background: #fef3c7; color: #92400e; }
.nt-status-pill.accepted { background: #d1fae5; color: #065f46; }
.nt-status-pill.rejected { background: #fee2e2; color: #991b1b; }

.nt-header-row-2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  min-width: 0;
}

.nt-route-origin, .nt-route-dest {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.nt-route-origin.other {
  color: #7c3aed;
  padding: 2px 8px;
  background: #f5f3ff;
  border-radius: 6px;
}

.nt-route-arrow { color: #cbd5e1; flex-shrink: 0; }

.nt-header-row-3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11.5px;
  color: #64748b;
  font-weight: 500;
}

.nt-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.nt-meta svg { color: #94a3b8; }
.nt-meta-sep { color: #cbd5e1; }

.nt-header-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.25s;
}

.nt-request.open .nt-header-chevron { color: #6d28d9; }
.nt-header-chevron.rotated { transform: rotate(180deg); }

/* ================= EXPANDED BODY ================= */
.nt-request-body {
  padding: 4px 20px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-top: 1px solid #f1f5f9;
  background: #fdfdfe;
}

/* Route */
.nt-route-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 14px;
}

.nt-route-side { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.nt-route-side.right { text-align: right; }

.nt-route-label {
  font-size: 9.5px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #94a3b8;
}

.nt-route-value {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nt-route-value.other { color: #7c3aed; }

.nt-route-code {
  font-size: 10.5px;
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  color: #94a3b8;
  font-weight: 600;
}

.nt-route-arrow-icon { flex-shrink: 0; color: #cbd5e1; }

/* Inline user */
.nt-inline-user { display: flex; align-items: center; gap: 12px; }

.nt-user-avatar {
  width: 38px; height: 38px;
  border-radius: 11px;
  background: #ede9fe;
  color: #6d28d9;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12.5px;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}

.nt-user-info { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
.nt-user-name { font-size: 13.5px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
.nt-user-sub { font-size: 11px; color: #64748b; font-weight: 500; }

/* Blocks */
.nt-block { display: flex; flex-direction: column; gap: 10px; }

.nt-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nt-block-title {
  font-size: 10.5px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #64748b;
}

.nt-block-title.rejected { color: #991b1b; }

.nt-block-badge {
  font-size: 10.5px;
  background: #f1f5f9;
  color: #64748b;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 700;
}

/* ================= ITEMS TABLE ================= */
.nt-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.nt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  table-layout: fixed;
}

.nt-table thead {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.nt-table th {
  text-align: left;
  padding: 10px 10px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #64748b;
  white-space: nowrap;
}

.nt-table td {
  padding: 11px 10px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-weight: 500;
  vertical-align: top;
  word-break: break-word;
}

.nt-table tbody tr:last-child td { border-bottom: none; }
.nt-table tbody tr:hover { background: #fafbfc; }

.nt-table .nt-th-num,
.nt-table .nt-td-num {
  width: 36px;
  text-align: center;
  color: #94a3b8;
  font-weight: 700;
  font-size: 11px;
}

.nt-table .nt-td-code  { width: 11%; font-family: ui-monospace, 'SF Mono', 'Courier New', monospace; font-size: 11px; color: #64748b; }
.nt-table .nt-td-item  { width: 16%; font-weight: 700; color: #0f172a; }
.nt-table .nt-td-uom   { width: 70px; font-size: 11px; color: #64748b; white-space: nowrap; }

.nt-table .nt-th-qty,
.nt-table .nt-td-qty {
  width: 60px;
  text-align: right;
  font-weight: 800;
  color: #7c3aed;
  white-space: nowrap;
}

.nt-table .nt-td-brand { width: 10%; font-size: 12px; color: #334155; }
.nt-table .nt-td-model { width: 10%; font-size: 12px; color: #334155; }
.nt-table .nt-td-spec  { width: 20%; font-size: 12px; color: #475569; line-height: 1.45; }
.nt-table .nt-td-remark { width: 14%; font-size: 11.5px; color: #64748b; line-height: 1.4; }

.nt-muted { color: #cbd5e1; }

.nt-items-empty {
  padding: 20px;
  text-align: center;
  font-size: 12.5px;
  color: #94a3b8;
  background: #fafbfc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}

/* ================= APPROVALS ================= */
.nt-approvals-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.nt-approval-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.nt-approval-item:last-child { border-bottom: none; }
.nt-approval-item.pending  { background: #fffbeb; }
.nt-approval-item.accepted { background: #f0fdf4; }
.nt-approval-item.rejected { background: #fef2f2; }

.nt-approval-item-icon {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  flex-shrink: 0;
  color: #64748b;
}

.nt-approval-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.nt-approval-item-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nt-approval-item-type {
  font-size: 10.5px;
  color: #64748b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nt-approval-item-reason {
  font-size: 11px;
  color: #991b1b;
  font-weight: 600;
  font-style: italic;
  margin-top: 3px;
  padding: 3px 8px;
  background: rgba(254, 226, 226, 0.7);
  border-radius: 5px;
  display: inline-block;
  align-self: flex-start;
}

.nt-approval-item-status {
  flex-shrink: 0;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nt-approval-item-status.pending  { color: #d97706; }
.nt-approval-item-status.accepted { color: #059669; }
.nt-approval-item-status.rejected { color: #dc2626; }

/* ================= REMARK / REJECTION ================= */
.nt-remark {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  padding: 11px 13px;
  border-radius: 9px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-weight: 500;
}

.nt-rejection-list { display: flex; flex-direction: column; gap: 6px; }

.nt-rejection-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  padding: 10px 13px;
  border-radius: 9px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #7f1d1d;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nt-rejection-text strong {
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #991b1b;
}

/* ================= ACTIONS ================= */
.nt-request-actions {
  display: flex;
  gap: 10px;
  padding-top: 4px;
  border-top: 1px solid #f1f5f9;
}

.nt-action-btn {
  flex: 1;
  padding: 11px 18px;
  border-radius: 10px;
  border: none;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  letter-spacing: -0.1px;
}

.nt-action-btn.accept {
  background: #10b981;
  color: #ffffff;
}

.nt-action-btn.accept:hover { background: #059669; }

.nt-action-btn.reject {
  background: #ffffff;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.nt-action-btn.reject:hover { background: #fef2f2; border-color: #fca5a5; }

/* ================= PAGINATION ================= */
.nt-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 0 8px;
}

.nt-page-btn {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.nt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.nt-page-numbers { display: flex; gap: 3px; }

.nt-page-num {
  min-width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 12.5px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.nt-page-num:hover:not(.dots):not(.active) { background: #f1f5f9; color: #0f172a; }

.nt-page-num.active { background: #0f172a; color: #ffffff; }

.nt-page-num.dots { cursor: default; color: #cbd5e1; }

/* ================= SKELETON ================= */
.nt-skeleton-card {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  min-height: 92px;
}

.nt-skeleton-stripe { width: 4px; background: #e2e8f0; }
.nt-skeleton-body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 10px; justify-content: center; }

.nt-skel-line {
  height: 11px;
  border-radius: 5px;
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
  padding: 80px 24px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.nt-empty-icon {
  margin-bottom: 16px;
  width: 72px; height: 72px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f5f3ff;
  color: #a78bfa;
}

.nt-empty h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 0 0 4px;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.nt-empty p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* ================= MODALS ================= */
.nt-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.nt-modal {
  background: #ffffff;
  border-radius: 16px;
  width: 460px;
  max-width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
}

.nt-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 22px;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
}

.nt-modal-header.accept { background: #f0fdf4; }
.nt-modal-header.reject { background: #fef2f2; }

.nt-modal-icon {
  width: 42px; height: 42px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nt-modal-icon.accept { background: #10b981; }
.nt-modal-icon.reject { background: #ef4444; }

.nt-modal-header h3 {
  font-size: 16px;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.3px;
}

.nt-modal-header p {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 0;
  font-weight: 500;
}

.nt-modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 30px; height: 30px;
  border: none; background: transparent;
  border-radius: 7px;
  color: #94a3b8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.nt-modal-close:hover { background: rgba(255, 255, 255, 0.8); color: #0f172a; }

.nt-modal-body {
  padding: 18px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.nt-modal-label { font-size: 12px; color: #64748b; font-weight: 600; }

.nt-modal-value { font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; }
.nt-modal-value.code {
  font-family: ui-monospace, 'SF Mono', 'Courier New', monospace;
  color: #7c3aed;
  font-weight: 800;
}

.nt-modal-value.small {
  font-weight: 500;
  font-size: 12.5px;
  color: #334155;
  text-align: left;
  padding: 8px 11px;
  background: #f8fafc;
  border-radius: 7px;
}

.nt-field { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.nt-field label { font-size: 12px; font-weight: 800; color: #0f172a; }
.nt-field .req { color: #ef4444; }

.nt-field textarea {
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  padding: 11px 13px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.15s;
  outline: none;
}

.nt-field textarea:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.nt-field textarea.error { border-color: #ef4444; }
.nt-error { font-size: 11.5px; color: #ef4444; font-weight: 600; }

.nt-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}

.nt-btn {
  padding: 10px 18px;
  border-radius: 9px;
  border: 1px solid transparent;
  font-weight: 800;
  font-size: 13px;
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
.nt-btn.primary.green { background: #10b981; }
.nt-btn.primary.green:hover:not(:disabled) { background: #059669; }
.nt-btn.primary.red { background: #ef4444; }
.nt-btn.primary.red:hover:not(:disabled) { background: #dc2626; }
.nt-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ================= TOAST ================= */
.nt-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  z-index: 2000;
  letter-spacing: -0.1px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
}

.nt-toast.success { background: #10b981; }
.nt-toast.error   { background: #ef4444; }
.nt-toast.warning { background: #f59e0b; }
.nt-toast-icon { display: inline-flex; align-items: center; }

/* ================= TRANSITIONS ================= */
.expand-enter-active, .expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.18s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .nt-modal { animation: nt-modal-in 0.22s cubic-bezier(.4,0,.2,1); }

@keyframes nt-modal-in {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }

/* ================= RESPONSIVE ================= */
@media (max-width: 768px) {
  .nt-title { font-size: 22px; }
  .nt-title-icon { width: 32px; height: 32px; border-radius: 9px; }
  .nt-subtitle { margin-left: 44px; font-size: 12.5px; }

  .nt-topbar { flex-direction: column; align-items: stretch; }
  .nt-topbar-actions { width: 100%; justify-content: space-between; }
  .nt-segment { flex: 1; overflow-x: auto; }
  .nt-seg-btn { padding: 6px 10px; font-size: 11.5px; }

  .nt-header-status { width: 38px; }
  .nt-header-main { padding: 12px 12px; }
  .nt-route-origin, .nt-route-dest { max-width: 110px; }

  /* Table → cards on mobile */
  .nt-table-wrap { border: none; background: transparent; }
  .nt-table { table-layout: auto; }
  .nt-table thead { display: none; }
  .nt-table, .nt-table tbody, .nt-table tr, .nt-table td {
    display: block;
    width: 100%;
  }
  .nt-table tr {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 10px;
    background: #ffffff;
    padding: 6px 0;
  }
  .nt-table td {
    border-bottom: none;
    padding: 5px 12px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    text-align: right;
  }
  .nt-table td::before {
    content: attr(data-label);
    font-weight: 800;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
    text-align: left;
    flex-shrink: 0;
  }
  .nt-td-num, .nt-td-code, .nt-td-item, .nt-td-uom, .nt-td-qty,
  .nt-td-brand, .nt-td-model, .nt-td-spec, .nt-td-remark {
    width: auto !important;
    max-width: none;
    text-align: right;
  }
  .nt-request-body { padding: 4px 14px 16px 14px; }
}
</style>