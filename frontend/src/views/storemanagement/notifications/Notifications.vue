<!-- views/notifications/Notifications.vue - Complete Redesigned Version -->
<template>
  <div class="notifications-page">
    <!-- Enhanced Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">🔔</div>
        <div>
          <h1 class="page-title">Notifications</h1>
          <p class="page-subtitle">Track and manage all transfer requests</p>
        </div>
      </div>
      <div class="header-right">
        <div class="notification-stats">
          <span class="stat-badge pending">
            <span class="stat-dot pending"></span>
            {{ summary.pending }} Pending
          </span>
          <span class="stat-badge accepted">
            <span class="stat-dot accepted"></span>
            {{ summary.accepted }} Accepted
          </span>
          <span class="stat-badge rejected">
            <span class="stat-dot rejected"></span>
            {{ summary.rejected }} Rejected
          </span>
        </div>
        <button class="btn-refresh" @click="loadAllNotifications" :disabled="loading">
          <svg class="refresh-icon" :class="{ spinning: loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Enhanced Filter Bar -->
    <div class="filter-section">
      <div class="filter-bar">
        <div class="filter-group">
     
          <div class="status-filter-buttons">
            <button 
              v-for="status in statusOptions" 
              :key="status.value"
              class="status-filter-btn"
              :class="[
                status.value,
                { active: filterStatus === status.value }
              ]"
              @click="filterStatus = status.value; onFilterChange()"
            >
              <span class="status-dot" :class="status.value"></span>
              {{ status.label }}
            
            </button>
          </div>
        </div>
        
        <div class="filter-group search-group">
          <label class="filter-label">Search</label>
          <div class="search-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search by code, item, or store..."
              class="search-input-enhanced"
              @input="onSearchChange"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''; onFilterChange()">✕</button>
          </div>
        </div>
      </div>
    </div>

   

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner-enhanced"></div>
      <p>Loading notifications...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="notifications.length === 0" class="empty-state-enhanced">
      <div class="empty-icon">📭</div>
      <h3>No notifications found</h3>
      <p>All caught up! No transfer requests to review.</p>
    </div>

    <!-- Enhanced Notifications List -->
    <div v-else class="notifications-container">
      <!-- Group header for date -->
      <div v-for="(group, groupIndex) in groupedNotifications" :key="groupIndex" class="notification-group">
        <div class="group-header">
          <span class="group-date">{{ group.date }}</span>
          <span class="group-count">{{ group.items.length }} request{{ group.items.length > 1 ? 's' : '' }}</span>
        </div>

        <div 
          v-for="notif in group.items" 
          :key="notif.id" 
          class="notification-card-enhanced"
          :class="[notif.status, { expanded: expandedId === notif.id }]"
          @click="toggleExpand(notif.id)"
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-left-section">
              <div class="status-indicator" :class="notif.status">
                <span class="status-icon">
                  {{ notif.status === 'pending' ? '⏳' : notif.status === 'accepted' ? '✅' : '❌' }}
                </span>
              </div>
              <div class="request-info">
                <span class="request-code">{{ notif.request?.requestCode }}</span>
                <span :class="['status-badge-enhanced', notif.status]">
                  {{ capitalize(notif.status) }}
                </span>
                <span class="approval-type-badge" :class="notif.approval_type">
                  {{ notif.approval_type === 'group' ? '🏢 Group' : '🏛️ Department' }}
                </span>
                <!-- Remark Indicator -->
                <span v-if="notif.request?.remark" class="remark-indicator" @click.stop>
                  💬 Has Remark
                </span>
              </div>
            </div>
            <div class="header-right-section">
              <span class="timestamp">{{ formatDate(notif.created_at) }}</span>
              <button class="expand-btn" @click.stop="toggleExpand(notif.id)">
                <svg :class="{ rotated: expandedId === notif.id }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body">
            <div class="request-details">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Requested By</span>
                  <span class="detail-value">
                    <span class="user-avatar">{{ getInitials(notif.request?.requestedByUser?.fullName) }}</span>
                    {{ notif.request?.requestedByUser?.fullName || 'Unknown' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">From Store</span>
                  <span class="detail-value store-name asking">
                    {{ notif.request?.askingStore?.name || 'Unknown' }}
                    <span class="store-code">{{ notif.request?.askingStore?.code }}</span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">To Store</span>
                  <span class="detail-value store-name supplying">
                    {{ notif.request?.supplyingStore?.name || 'Unknown' }}
                    <span class="store-code">{{ notif.request?.supplyingStore?.code }}</span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Requested Date</span>
                  <span class="detail-value">{{ formatDateFull(notif.request?.requestedDate || notif.created_at) }}</span>
                </div>
                <div class="detail-item" v-if="notif.request?.status">
                  <span class="detail-label">Request Status</span>
                  <span class="detail-value">
                    <span :class="['status-badge-enhanced', notif.request?.status]">
                      {{ capitalize(notif.request?.status) }}
                    </span>
                  </span>
                </div>
                <div class="detail-item" v-if="notif.request?.createdAt">
                  <span class="detail-label">Created At</span>
                  <span class="detail-value">{{ formatDateFull(notif.request?.createdAt) }}</span>
                </div>
              </div>

              <!-- Items -->
            <div class="items-section">
  <div class="items-header">
    <span class="items-label">📦 Items ({{ getTotalItems(notif.request?.items) }})</span>
<span class="items-total">Total: {{ Number(getTotalQuantity(notif.request?.items)).toFixed(2) }} {{ getFirstItemUom(notif.request?.items) }}</span>
  </div>
<div class="items-list">
  <div 
    v-for="(item, idx) in notif.request?.items || []" 
    :key="idx" 
    class="item-row"
  >
    <span class="item-name">{{ item.item?.name || 'Unknown Item' }}</span>
    <span class="item-quantity">{{ Number(item.quantity).toFixed(2) }} {{ getUomDisplay(item) }}</span>
    <span v-if="item.remark" class="item-remark">💬 {{ item.remark }}</span>
  </div>
</div>
</div>

              <!-- Request Remark - Full Display -->
              <div v-if="notif.request?.remark" class="remark-section">
                <div class="remark-header">📝 Request Remark</div>
                <p class="remark-text">{{ notif.request.remark }}</p>
              </div>

              <!-- Rejection Reason -->
              <div v-if="notif.status === 'rejected' && notif.rejected_reason" class="rejection-section">
                <div class="rejection-header">⚠️ Rejection Reason</div>
                <p class="rejection-text">{{ notif.rejected_reason }}</p>
              </div>

              <!-- Response Info -->
              <div v-if="notif.status !== 'pending'" class="response-section">
                <div class="response-info">
                  <span class="response-label">
                    {{ notif.status === 'accepted' ? '✅ Accepted' : '❌ Rejected' }}
                  </span>
                  <span class="response-user">
                    by {{ notif.respondedByUser?.fullName || 'Unknown' }}
                  </span>
                  <span class="response-time">{{ formatDateFull(notif.responded_at) }}</span>
                </div>
              </div>

              <!-- Group/Department Info -->
              <div v-if="notif.group || notif.department" class="approval-info-section">
                <div class="approval-info">
                  <span class="approval-label">Approval Type:</span>
                  <span class="approval-value">
                    {{ notif.approval_type === 'group' ? '🏢 Group Approval' : '🏛️ Department Approval' }}
                  </span>
                  <span v-if="notif.group" class="approval-detail">
                    Group: {{ notif.group?.name }} ({{ notif.group?.code }})
                  </span>
                  <span v-if="notif.department" class="approval-detail">
                    Department: {{ notif.department?.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div v-if="notif.status === 'pending'" class="card-actions" @click.stop>
            <button class="action-btn accept" @click="openAcceptModal(notif)">
              <span class="btn-icon">✅</span>
              Accept Request
            </button>
            <button class="action-btn reject" @click="openRejectModal(notif)">
              <span class="btn-icon">❌</span>
              Reject Request
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.total > 0" class="pagination-enhanced">
      <div class="pagination-info">
        Showing <strong>{{ pagination.start || 1 }}</strong> to 
        <strong>{{ pagination.end || pagination.total }}</strong> of 
        <strong>{{ pagination.total }}</strong> results
      </div>
      <div class="pagination-controls">
        <button 
          class="page-btn-enhanced" 
          :disabled="currentPage <= 1 || loading" 
          @click="goToPage(currentPage - 1)"
        >
          ← Previous
        </button>
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="page-num"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button 
          class="page-btn-enhanced" 
          :disabled="currentPage >= totalPages || loading" 
          @click="goToPage(currentPage + 1)"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Accept Modal -->
    <div v-if="showAcceptModal" class="modal-overlay" @click.self="closeAcceptModal">
      <div class="modal-container accept-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-content">
            <span class="modal-icon">✅</span>
            <div>
              <h3>Confirm Acceptance</h3>
              <p class="modal-subtitle">You are about to accept this transfer request</p>
            </div>
          </div>
          <button class="modal-close" @click="closeAcceptModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-confirmation-details">
            <div class="detail-item-modal">
              <span class="detail-label-modal">Request Code</span>
              <span class="detail-value-modal highlight">{{ currentNotification?.request?.requestCode }}</span>
            </div>
            <div class="detail-item-modal">
              <span class="detail-label-modal">Requested By</span>
              <span class="detail-value-modal">{{ currentNotification?.request?.requestedByUser?.fullName || 'Unknown' }}</span>
            </div>
            <div class="detail-item-modal">
              <span class="detail-label-modal">Items</span>
          <span class="detail-value-modal">
  {{ getTotalItems(currentNotification?.request?.items) }} items 
  ({{ Number(getTotalQuantity(currentNotification?.request?.items)).toFixed(2) }} 
  {{ getFirstItemUom(currentNotification?.request?.items) }})
</span>
          </div>
            <div class="detail-item-modal">
              <span class="detail-label-modal">From</span>
              <span class="detail-value-modal">{{ currentNotification?.request?.askingStore?.name || 'Unknown' }}</span>
            </div>
            <div class="detail-item-modal">
              <span class="detail-label-modal">To</span>
              <span class="detail-value-modal">{{ currentNotification?.request?.supplyingStore?.name || 'Unknown' }}</span>
            </div>
            <div v-if="currentNotification?.request?.remark" class="detail-item-modal full">
              <span class="detail-label-modal">📝 Remark</span>
              <span class="detail-value-modal remark">{{ currentNotification?.request?.remark }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAcceptModal">Cancel</button>
          <button class="btn-accept-confirm" @click="confirmAccept" :disabled="accepting">
            {{ accepting ? 'Processing...' : '✅ Confirm Accept' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-container reject-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-content">
            <span class="modal-icon">🚫</span>
            <div>
              <h3>Reject Request</h3>
              <p class="modal-subtitle">Please provide a reason for rejection</p>
            </div>
          </div>
          <button class="modal-close" @click="closeRejectModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-confirmation-details">
            <div class="detail-item-modal">
              <span class="detail-label-modal">Request Code</span>
              <span class="detail-value-modal highlight">{{ currentNotification?.request?.requestCode }}</span>
            </div>
            <div class="detail-item-modal">
              <span class="detail-label-modal">Items</span>
              <span class="detail-value-modal">{{ getTotalItems(currentNotification?.request?.items) }} items</span>
            </div>
            <div v-if="currentNotification?.request?.remark" class="detail-item-modal full">
              <span class="detail-label-modal">📝 Remark</span>
              <span class="detail-value-modal remark">{{ currentNotification?.request?.remark }}</span>
            </div>
          </div>
          <div class="form-group-modal">
            <label>Rejection Reason <span class="required">*</span></label>
            <textarea 
              v-model="rejectReason" 
              placeholder="Please provide a detailed reason for rejecting this request..."
              rows="3"
              class="reject-textarea-enhanced"
              :class="{ error: rejectReasonError }"
            ></textarea>
            <span v-if="rejectReasonError" class="error-message">{{ rejectReasonError }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRejectModal">Cancel</button>
          <button class="btn-danger" @click="confirmReject" :disabled="!rejectReason.trim() || submitting">
            {{ submitting ? 'Submitting...' : '🚫 Confirm Reject' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast-enhanced" :class="toastType">
      <span class="toast-icon">{{ toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : '⚠️' }}</span>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import itemRequestService from '@/stores/itemRequestService'

const authStore = useAuthStore()

// ================================================================
// STATE
// ================================================================
const loading = ref(false)
const submitting = ref(false)
const accepting = ref(false)
const notifications = ref([])
const pagination = ref(null)
const summary = ref({
  total: 0,
  pending: 0,
  accepted: 0,
  rejected: 0
})
const currentNotification = ref(null)
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
const expandedId = ref(null)

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' }
]

// ================================================================
// COMPUTED
// ================================================================
const totalPages = computed(() => {
  return pagination.value?.pages || 1
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  const maxVisible = 5
  
  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    let start = Math.max(2, current - 1)
    let end = Math.min(total - 1, current + 1)
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push('...')
    pages.push(total)
  }
  return pages
})

const groupedNotifications = computed(() => {
  const groups = {}
  notifications.value.forEach(notif => {
    // Parse UTC date and convert to local for grouping
    const date = utcToLocal(notif.created_at)
    const dateKey = date.toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: formatDateGroup(date),
        items: []
      }
    }
    groups[dateKey].items.push(notif)
  })
  return Object.values(groups)
})

// ================================================================
// HELPER: UTC to Local Conversion
// ================================================================
const utcToLocal = (utcDate) => {
  if (!utcDate) return new Date()
  const d = new Date(utcDate)
  // Get timezone offset in milliseconds and convert to local
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset)
}

// ================================================================
// DATE FORMATTING FUNCTIONS (Fixed for UTC to Local)
// ================================================================

/**
 * Format date as relative time (e.g., "Just now", "5m ago", "2h ago")
 * Properly handles UTC to local timezone conversion
 */
const formatDate = (date) => {
  if (!date) return ''
  
  // Convert UTC to local time
  const d = utcToLocal(date)
  const now = new Date()
  
  // Calculate difference in milliseconds
  const diff = now.getTime() - d.getTime()
  
  // If date is in the future (timezone edge case)
  if (diff < 0) {
    // If within 2 hours in the future, treat as "Just now"
    if (Math.abs(diff) < 7200000) return 'Just now'
    // Otherwise show the actual date
    return d.toLocaleDateString()
  }
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

/**
 * Format date as full date/time string
 * e.g., "Aug 20, 2026 3:40 AM"
 */
const formatDateFull = (date) => {
  if (!date) return 'N/A'
  const d = utcToLocal(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Format date for grouping (Today, Yesterday, or full date)
 */
const formatDateGroup = (date) => {
  const d = date instanceof Date ? date : utcToLocal(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Compare dates without time
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  
  if (dDate.getTime() === todayDate.getTime()) return 'Today'
  if (dDate.getTime() === yesterdayDate.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

/**
 * Format date as short date for display in modals
 */
const formatDateShort = (date) => {
  if (!date) return 'N/A'
  const d = utcToLocal(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format time only (e.g., "3:40 AM")
 */
const formatTimeOnly = (date) => {
  if (!date) return 'N/A'
  const d = utcToLocal(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}







// Add these functions in the <script setup> section

/**
 * Get the correct UOM display for an item
 */
const getUomDisplay = (item) => {
  // ✅ Check if we have a stored uom_code (this is the UOM the user requested in)
  if (item.uom_code) {
    return item.uom_code;
  }
  
  // Fallback: try to get from item's base UOM
  if (item.item?.uom?.code) {
    return item.item.uom.code;
  }
  
  // Last resort
  return 'units';
};

/**
 * Get the UOM from the first item (for total display)
 */
const getFirstItemUom = (items) => {
  if (!items || items.length === 0) return 'units';
  const firstItem = items[0];
  return getUomDisplay(firstItem);
};












// ================================================================
// METHODS
// ================================================================
const loadAllNotifications = async (resetPage = true) => {
  try {
    loading.value = true
    if (resetPage) currentPage.value = 1
    
    const storeId = authStore.userStoreId
    const groupId = authStore.userGroupId
    const departmentId = authStore.user?.departmentId

    const hasGroupAccess = !!(storeId && groupId)
    const hasDeptAccess = !!departmentId

    if (!hasGroupAccess && !hasDeptAccess) {
      showToastMessage('No notification access', 'warning')
      notifications.value = []
      loading.value = false
      return
    }

    const params = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    if (filterStatus.value !== 'all') params.status = filterStatus.value

    let response = null

    if (hasGroupAccess && hasDeptAccess) {
      const [groupResponse, deptResponse] = await Promise.all([
        itemRequestService.getGroupNotifications(storeId, groupId, params),
        itemRequestService.getDepartmentNotifications(departmentId, params)
      ])

      const groupNotifs = groupResponse.success ? groupResponse.data?.notifications || [] : []
      const deptNotifs = deptResponse.success ? deptResponse.data?.notifications || [] : []

      const allNotifs = [...groupNotifs, ...deptNotifs].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )

      const groupSummary = groupResponse.success ? groupResponse.data?.summary : { total: 0, pending: 0, accepted: 0, rejected: 0 }
      const deptSummary = deptResponse.success ? deptResponse.data?.summary : { total: 0, pending: 0, accepted: 0, rejected: 0 }

      response = {
        success: true,
        data: {
          notifications: allNotifs,
          pagination: {
            page: currentPage.value,
            limit: pageSize.value,
            total: allNotifs.length,
            pages: Math.ceil(allNotifs.length / pageSize.value),
            start: 1,
            end: allNotifs.length
          },
          summary: {
            total: groupSummary.total + deptSummary.total,
            pending: groupSummary.pending + deptSummary.pending,
            accepted: groupSummary.accepted + deptSummary.accepted,
            rejected: groupSummary.rejected + deptSummary.rejected
          }
        }
      }
    } else if (hasGroupAccess) {
      response = await itemRequestService.getGroupNotifications(storeId, groupId, params)
    } else if (hasDeptAccess) {
      response = await itemRequestService.getDepartmentNotifications(departmentId, params)
    }

    if (response && response.success) {
      notifications.value = response.data?.notifications || []
      pagination.value = response.data?.pagination || null
      summary.value = response.data?.summary || { total: 0, pending: 0, accepted: 0, rejected: 0 }
      
      // Client-side search
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        notifications.value = notifications.value.filter(n => {
          const requestCode = n.request?.requestCode?.toLowerCase() || ''
          const items = n.request?.items?.map(i => i.item?.name?.toLowerCase() || '').join(' ')
          const askingStore = n.request?.askingStore?.name?.toLowerCase() || ''
          const supplyingStore = n.request?.supplyingStore?.name?.toLowerCase() || ''
          const remark = n.request?.remark?.toLowerCase() || ''
          const requestedBy = n.request?.requestedByUser?.fullName?.toLowerCase() || ''
          return requestCode.includes(query) || 
                 items.includes(query) || 
                 askingStore.includes(query) || 
                 supplyingStore.includes(query) ||
                 remark.includes(query) ||
                 requestedBy.includes(query)
        })
      }
    } else {
      showToastMessage(response?.error || 'Failed to load notifications', 'error')
      notifications.value = []
    }
  } catch (error) {
    console.error('Error loading notifications:', error)
    showToastMessage('Failed to load notifications', 'error')
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || loading.value) return
  currentPage.value = page
  loadAllNotifications(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const onFilterChange = () => loadAllNotifications(true)
const onSearchChange = () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadAllNotifications(true), 300)
}

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

const getPercentage = (value) => {
  return summary.value.total > 0 ? Math.round((value / summary.value.total) * 100) : 0
}

const getTotalItems = (items) => items?.length || 0
const getTotalQuantity = (items) => {
  return items?.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0) || 0
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => showToast.value = false, 3000)
}

// Accept Modal
const openAcceptModal = (notification) => {
  currentNotification.value = notification
  showAcceptModal.value = true
}

const closeAcceptModal = () => {
  showAcceptModal.value = false
  currentNotification.value = null
  accepting.value = false
}

const confirmAccept = async () => {
  accepting.value = true
  try {
    const response = await itemRequestService.acceptNotification(currentNotification.value.id)
    if (response.success) {
      showToastMessage('✅ Request accepted successfully!', 'success')
      await loadAllNotifications(true)
      closeAcceptModal()
    } else {
      showToastMessage(response.error || 'Failed to accept request', 'error')
    }
  } catch (error) {
    console.error('Error accepting notification:', error)
    showToastMessage('Failed to accept request', 'error')
  } finally {
    accepting.value = false
  }
}

// Reject Modal
const openRejectModal = (notification) => {
  currentNotification.value = notification
  rejectReason.value = ''
  rejectReasonError.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  currentNotification.value = null
  rejectReason.value = ''
  rejectReasonError.value = ''
  submitting.value = false
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    rejectReasonError.value = 'Please provide a rejection reason'
    return
  }
  rejectReasonError.value = ''

  submitting.value = true
  try {
    const response = await itemRequestService.rejectNotification(
      currentNotification.value.id,
      rejectReason.value.trim()
    )
    if (response.success) {
      showToastMessage('❌ Request rejected', 'warning')
      await loadAllNotifications(true)
      closeRejectModal()
    } else {
      showToastMessage(response.error || 'Failed to reject request', 'error')
    }
  } catch (error) {
    console.error('Error rejecting notification:', error)
    showToastMessage('Failed to reject request', 'error')
  } finally {
    submitting.value = false
  }
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => loadAllNotifications(true))

watch([filterStatus, searchQuery], () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => loadAllNotifications(true), 300)
})
</script>

<style scoped>
/* ========== PAGE LAYOUT ========== */
.notifications-page {
  padding: 24px;
  max-width: 1280px;
  margin: 0 auto;
  background: #f0f2f6;
  min-height: 100vh;
}

/* ========== HEADER ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  background: white;
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: white;
  font-size: 28px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.notification-stats {
  display: flex;
  gap: 8px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.stat-badge.pending {
  background: #fef3c7;
  color: #92400e;
}
.stat-badge.accepted {
  background: #dcfce7;
  color: #166534;
}
.stat-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.stat-dot.pending { background: #f59e0b; }
.stat-dot.accepted { background: #10b981; }
.stat-dot.rejected { background: #ef4444; }

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  background: #6a11cb;
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-refresh:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-1px);
}
.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 18px;
  height: 18px;
}
.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== FILTER BAR ========== */
.filter-section {
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.status-filter-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.status-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 2px solid transparent;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.status-filter-btn:hover {
  background: #e2e8f0;
}
.status-filter-btn.active {
  background: white;
  border-color: #6a11cb;
  color: #1e293b;
  box-shadow: 0 2px 8px rgba(106, 17, 203, 0.15);
}
.status-filter-btn.pending.active { border-color: #f59e0b; }
.status-filter-btn.accepted.active { border-color: #10b981; }
.status-filter-btn.rejected.active { border-color: #ef4444; }

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.all { background: #6a11cb; }
.status-dot.pending { background: #f59e0b; }
.status-dot.accepted { background: #10b981; }
.status-dot.rejected { background: #ef4444; }

.status-count {
  background: #e2e8f0;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}
.status-filter-btn.active .status-count {
  background: #e2e8f0;
}

.search-group {
  flex: 1;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input-enhanced {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
  background: #f8fafc;
}
.search-input-enhanced:focus {
  outline: none;
  border-color: #6a11cb;
  background: white;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}

.search-clear {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
}
.search-clear:hover {
  background: #e2e8f0;
  color: #475569;
}

/* ========== SUMMARY CARDS ========== */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.summary-card.active {
  border-color: #6a11cb;
  box-shadow: 0 4px 16px rgba(106, 17, 203, 0.15);
}
.summary-card.pending.active { border-color: #f59e0b; }
.summary-card.accepted.active { border-color: #10b981; }
.summary-card.rejected.active { border-color: #ef4444; }

.card-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 12px;
}
.summary-card.total .card-icon { background: #eef2ff; }
.summary-card.pending .card-icon { background: #fef3c7; }
.summary-card.accepted .card-icon { background: #dcfce7; }
.summary-card.rejected .card-icon { background: #fee2e2; }

.card-content {
  flex: 1;
}
.card-number {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}
.card-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}
.card-trend {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
}

/* ========== LOADING ========== */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
}

.spinner-enhanced {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

/* ========== EMPTY STATE ========== */
.empty-state-enhanced {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
}
.empty-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
}
.empty-state-enhanced h3 {
  color: #1e293b;
  margin: 0 0 8px 0;
}
.empty-state-enhanced p {
  color: #94a3b8;
  margin: 0;
}

/* ========== NOTIFICATIONS ========== */
.notifications-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.notification-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
}
.group-date {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.group-count {
  font-size: 13px;
  color: #94a3b8;
}

.notification-card-enhanced {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.3s;
  cursor: pointer;
  border-left: 5px solid #e2e8f0;
}
.notification-card-enhanced:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.notification-card-enhanced.pending { border-left-color: #f59e0b; }
.notification-card-enhanced.accepted { border-left-color: #10b981; }
.notification-card-enhanced.rejected { border-left-color: #ef4444; }
.notification-card-enhanced.expanded {
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

/* Remark Indicator */
.remark-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  font-size: 11px;
  color: #166534;
  font-weight: 500;
  cursor: default;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
}

.header-left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.status-indicator {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.status-indicator.pending { background: #fef3c7; }
.status-indicator.accepted { background: #dcfce7; }
.status-indicator.rejected { background: #fee2e2; }

.status-icon {
  font-size: 18px;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.request-code {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 6px;
}

.status-badge-enhanced {
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-badge-enhanced.pending {
  background: #fef3c7;
  color: #92400e;
}
.status-badge-enhanced.accepted {
  background: #dcfce7;
  color: #166534;
}
.status-badge-enhanced.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.approval-type-badge {
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
}
.approval-type-badge.group { background: #e0f2fe; color: #0369a1; }
.approval-type-badge.department { background: #fae8ff; color: #7c3aed; }

.header-right-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.timestamp {
  font-size: 13px;
  color: #94a3b8;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  color: #94a3b8;
}
.expand-btn:hover {
  background: #e2e8f0;
  color: #475569;
}
.expand-btn svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s;
}
.expand-btn svg.rotated {
  transform: rotate(180deg);
}

/* Card Body */
.card-body {
  padding: 16px 20px;
  display: none;
}
.notification-card-enhanced.expanded .card-body {
  display: block;
}

.request-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.detail-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.store-name {
  font-weight: 600;
}
.store-name.asking { color: #0369a1; }
.store-name.supplying { color: #7c3aed; }

.store-code {
  font-size: 11px;
  font-weight: 400;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0 8px;
  border-radius: 4px;
}

/* Items Section */
.items-section {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px 16px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.items-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
}
.items-total {
  font-size: 12px;
  color: #94a3b8;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}
.item-row:last-child { border-bottom: none; }
.item-name {
  flex: 1;
  color: #1e293b;
}
.item-quantity {
  color: #64748b;
  font-weight: 500;
}
.item-remark {
  color: #94a3b8;
  font-size: 12px;
}

/* Remark Section */
.remark-section, .rejection-section {
  padding: 10px 14px;
  border-radius: 8px;
}
.remark-section {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.remark-header, .rejection-header {
  font-weight: 600;
  font-size: 12px;
  margin-bottom: 4px;
}
.remark-header { color: #166534; }
.rejection-header { color: #991b1b; }

.remark-text {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
}
.rejection-text {
  margin: 0;
  font-size: 14px;
  color: #991b1b;
}
.rejection-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

/* Approval Info Section */
.approval-info-section {
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.approval-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
}
.approval-label {
  font-weight: 600;
  color: #64748b;
}
.approval-value {
  font-weight: 500;
  color: #1e293b;
}
.approval-detail {
  color: #94a3b8;
  font-size: 12px;
}

/* Response Section */
.response-section {
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}
.response-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
}
.response-label {
  font-weight: 600;
}
.response-label:has(✅) { color: #10b981; }
.response-label:has(❌) { color: #ef4444; }
.response-user { color: #475569; }
.response-time { color: #94a3b8; font-size: 12px; }

/* Card Actions */
.card-actions {
  padding: 12px 20px;
  background: #fafbfc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn.accept {
  background: #10b981;
  color: white;
}
.action-btn.accept:hover {
  background: #059669;
  transform: translateY(-1px);
}
.action-btn.reject {
  background: #ef4444;
  color: white;
}
.action-btn.reject:hover {
  background: #dc2626;
  transform: translateY(-1px);
}
.btn-icon {
  font-size: 16px;
}

/* ========== PAGINATION ========== */
.pagination-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.pagination-info {
  font-size: 14px;
  color: #64748b;
}
.pagination-info strong {
  color: #1e293b;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-btn-enhanced {
  padding: 6px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.page-btn-enhanced:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #6a11cb;
}
.page-btn-enhanced:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.page-num:hover {
  background: #f1f5f9;
  color: #1e293b;
}
.page-num.active {
  background: #6a11cb;
  color: white;
}
.page-num:disabled {
  cursor: default;
}

/* ========== MODALS ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 520px;
  max-width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  animation: modalSlideUp 0.3s ease-out;
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.modal-icon {
  font-size: 28px;
}
.modal-header-content h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}
.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}

.modal-close {
  background: none;
  border: none;
  font-size: 22px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}
.modal-close:hover {
  background: #e2e8f0;
  color: #475569;
}

.modal-body {
  padding: 24px;
}

.modal-confirmation-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item-modal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}
.detail-item-modal.full {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.detail-item-modal:last-child { border-bottom: none; }

.detail-label-modal {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
}
.detail-value-modal {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}
.detail-value-modal.highlight {
  color: #6a11cb;
  font-family: 'Courier New', monospace;
}
.detail-value-modal.remark {
  font-weight: 400;
  padding: 4px 12px;
  background: #f8fafc;
  border-radius: 6px;
  width: 100%;
}

.form-group-modal {
  margin-top: 16px;
}
.form-group-modal label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}
.required { color: #ef4444; }

.reject-textarea-enhanced {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
}
.reject-textarea-enhanced:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}
.reject-textarea-enhanced.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  display: block;
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  background: #fafbfc;
  border-top: 1px solid #e2e8f0;
}

.modal-footer button {
  padding: 8px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}
.btn-secondary:hover {
  background: #cbd5e1;
}

.btn-accept-confirm {
  background: #10b981;
  color: white;
}
.btn-accept-confirm:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}
.btn-accept-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #ef4444;
  color: white;
}
.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== TOAST ========== */
.toast-enhanced {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  z-index: 9999;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  max-width: 420px;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  to { opacity: 0; transform: translateY(-10px); }
}

.toast-enhanced.success { background: #10b981; }
.toast-enhanced.error { background: #ef4444; }
.toast-enhanced.warning { background: #f59e0b; }

.toast-icon {
  font-size: 20px;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .notifications-page { padding: 12px; }
  
  .page-header { flex-direction: column; align-items: stretch; }
  .header-left { gap: 12px; }
  .header-icon { width: 44px; height: 44px; font-size: 22px; }
  .page-title { font-size: 18px; }
  .header-right { justify-content: space-between; }
  .notification-stats { flex-wrap: wrap; }
  
  .summary-grid { grid-template-columns: 1fr 1fr; }
  
  .detail-grid { grid-template-columns: 1fr; }
  
  .card-header { flex-direction: column; align-items: flex-start; }
  .header-right-section { width: 100%; justify-content: space-between; }
  
  .pagination-enhanced { flex-direction: column; align-items: stretch; }
  .pagination-controls { justify-content: center; }
  
  .modal-container { width: 100%; }
  
  .status-filter-buttons { gap: 4px; }
  .status-filter-btn { font-size: 12px; padding: 4px 10px; }
  
  .card-actions { flex-direction: column; }
  .action-btn { justify-content: center; }
  
  .request-info { flex-wrap: wrap; }
}

@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr; }
  .detail-item-modal { flex-direction: column; align-items: flex-start; gap: 2px; }
}
</style>