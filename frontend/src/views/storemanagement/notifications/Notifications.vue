<!-- views/notifications/Notifications.vue -->
<template>
  <div class="notifications-page">
    <div class="page-header">
      <h2>📋 Notification History</h2>
      <div class="header-actions">
        <button class="btn-refresh" @click="loadAllNotifications" :disabled="loading">
          🔄 {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        <button class="btn-filter" @click="showFilter = !showFilter">
          🔍 Filter
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div v-if="showFilter" class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="all">All Status</option>
        <option value="pending">⏳ Pending</option>
        <option value="accepted">✅ Accepted</option>
        <option value="rejected">❌ Rejected</option>
      </select>
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Search by request code, item, or store..."
        class="search-input"
        @input="onSearchChange"
      />
      <button class="btn-clear" @click="clearFilters">✕ Clear</button>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card total">
        <span class="number">{{ summary.total }}</span>
        <span class="label">Total</span>
      </div>
      <div class="summary-card pending">
        <span class="number">{{ summary.pending }}</span>
        <span class="label">⏳ Pending</span>
      </div>
      <div class="summary-card accepted">
        <span class="number">{{ summary.accepted }}</span>
        <span class="label">✅ Accepted</span>
      </div>
      <div class="summary-card rejected">
        <span class="number">{{ summary.rejected }}</span>
        <span class="label">❌ Rejected</span>
      </div>
    </div>

    <!-- Notifications List -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading notifications...</p>
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state">
      <span class="empty-icon">📭</span>
      <p>No notifications found</p>
    </div>

    <div v-else class="notifications-list">
      <div 
        v-for="notif in notifications" 
        :key="notif.id" 
        class="notification-card"
        :class="notif.status"
      >
        <div class="notification-status-icon">
          <span v-if="notif.status === 'pending'">⏳</span>
          <span v-else-if="notif.status === 'accepted'">✅</span>
          <span v-else-if="notif.status === 'rejected'">❌</span>
        </div>
        
        <div class="notification-body">
          <div class="notification-top">
            <div class="notification-title">
              <span class="request-code">{{ notif.request?.requestCode }}</span>
              <span :class="['status-badge', notif.status]">
                {{ notif.status }}
              </span>
            </div>
            <span class="notification-date">{{ formatDate(notif.created_at) }}</span>
          </div>
          
          <p class="notification-detail">
            <strong>{{ notif.request?.requestedByUser?.fullName || 'Someone' }}</strong>
            requested items from 
            <strong>{{ notif.request?.askingStore?.name || 'Unknown' }}</strong>
            to 
            <strong>{{ notif.request?.supplyingStore?.name || 'Unknown' }}</strong>
          </p>
          
          <div class="notification-items">
            <span v-for="(item, idx) in (notif.request?.items || []).slice(0, 3)" :key="idx" class="item-tag">
              {{ item.item?.name || 'Unknown' }} ({{ item.quantity }})
            </span>
            <span v-if="(notif.request?.items || []).length > 3" class="item-more">
              +{{ (notif.request?.items || []).length - 3 }} more
            </span>
          </div>

          <!-- 🔥 Display Request Remark -->
          <div v-if="notif.request?.remark" class="request-remark">
            <span class="remark-label">📝 Remark:</span>
            <span class="remark-text">{{ notif.request.remark }}</span>
          </div>

          <div v-if="notif.status === 'rejected' && notif.rejected_reason" class="rejection-reason">
            <span class="rejection-label">⚠️ Rejection Reason:</span>
            {{ notif.rejected_reason }}
          </div>

          <div v-if="notif.status !== 'pending'" class="response-info">
            <span class="responded-by">
              {{ notif.status === 'accepted' ? '✅ Accepted' : '❌ Rejected' }} by 
              {{ notif.respondedByUser?.fullName || 'Unknown' }}
            </span>
            <span class="responded-at">{{ formatDate(notif.responded_at) }}</span>
          </div>

          <div v-if="notif.status === 'pending'" class="notification-actions">
            <button class="btn-accept" @click="openAcceptModal(notif)">
              ✅ Accept
            </button>
            <button class="btn-reject" @click="openRejectModal(notif)">
              ❌ Reject
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.total > 0" class="pagination">
      <button 
        class="page-btn" 
        :disabled="pagination.page === 1 || loading" 
        @click="goToPage(pagination.page - 1)"
      >
        ← Previous
      </button>
      <span class="page-info">
        Page {{ pagination.page }} of {{ pagination.pages }}
        <span class="total-count">({{ pagination.total }} total)</span>
      </span>
      <button 
        class="page-btn" 
        :disabled="pagination.page === pagination.pages || loading" 
        @click="goToPage(pagination.page + 1)"
      >
        Next →
      </button>
    </div>

    <!-- Accept Confirmation Modal -->
    <div v-if="showAcceptModal" class="modal-overlay" @click.self="closeAcceptModal">
      <div class="modal-container accept-modal" @click.stop>
        <div class="modal-header">
          <h3>✅ Confirm Acceptance</h3>
          <button class="modal-close" @click="closeAcceptModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">✅</div>
          <p class="confirmation-title">Are you sure you want to accept this request?</p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Request:</span>
              <span class="detail-value">{{ currentNotification?.request?.requestCode }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value">{{ currentNotification?.request?.items?.length || 0 }} item(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Requested By:</span>
              <span class="detail-value">{{ currentNotification?.request?.requestedByUser?.fullName || 'Unknown' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Asking Store:</span>
              <span class="detail-value">{{ currentNotification?.request?.askingStore?.name || 'Unknown' }}</span>
            </div>
            <div v-if="currentNotification?.request?.remark" class="detail-row">
              <span class="detail-label">Remark:</span>
              <span class="detail-value">{{ currentNotification?.request?.remark }}</span>
            </div>
          </div>
          <p class="confirm-text">This action will accept the request and move it forward in the approval process.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAcceptModal">Cancel</button>
          <button 
            class="btn-accept-confirm" 
            @click="confirmAccept" 
            :disabled="accepting"
          >
            {{ accepting ? 'Processing...' : '✅ Confirm Accept' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-container reject-modal" @click.stop>
        <div class="modal-header">
          <h3>🚫 Reject Request</h3>
          <button class="modal-close" @click="closeRejectModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">🚫</div>
          <p class="confirmation-title">Are you sure you want to reject this request?</p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Request:</span>
              <span class="detail-value">{{ currentNotification?.request?.requestCode }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value">{{ currentNotification?.request?.items?.length || 0 }} item(s)</span>
            </div>
            <div v-if="currentNotification?.request?.remark" class="detail-row">
              <span class="detail-label">Remark:</span>
              <span class="detail-value">{{ currentNotification?.request?.remark }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>Rejection Reason *</label>
            <textarea 
              v-model="rejectReason" 
              placeholder="Please provide a reason for rejecting..."
              rows="3"
              class="reject-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRejectModal">Cancel</button>
          <button 
            class="btn-danger" 
            @click="confirmReject" 
            :disabled="!rejectReason.trim() || submitting"
          >
            {{ submitting ? 'Submitting...' : 'Confirm Reject' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import itemRequestService from '@/stores/itemRequestService'

const router = useRouter()
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
const showAcceptModal = ref(false)
const showRejectModal = ref(false)
const showFilter = ref(false)
const filterStatus = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')

// ================================================================
// COMPUTED
// ================================================================
const totalPages = computed(() => {
  return pagination.value?.pages || 1
})

// ================================================================
// METHODS
// ================================================================

const loadAllNotifications = async (resetPage = true) => {
  try {
    loading.value = true
    
    if (resetPage) {
      currentPage.value = 1
    }
    
    const storeId = authStore.userStoreId
    const groupId = authStore.userGroupId
    
    if (!storeId || !groupId) {
      showToastMessage('Store or group not found', 'error')
      notifications.value = []
      loading.value = false
      return
    }

    // Build params
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    
    if (filterStatus.value !== 'all') {
      params.status = filterStatus.value
    }

    const response = await itemRequestService.getGroupNotifications(storeId, groupId, params)
    
    if (response.success) {
      notifications.value = response.data?.notifications || []
      pagination.value = response.data?.pagination || null
      summary.value = response.data?.summary || { total: 0, pending: 0, accepted: 0, rejected: 0 }
      
      // Apply client-side search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        notifications.value = notifications.value.filter(n => {
          const requestCode = n.request?.requestCode?.toLowerCase() || ''
          const items = n.request?.items?.map(i => i.item?.name?.toLowerCase() || '').join(' ')
          const askingStore = n.request?.askingStore?.name?.toLowerCase() || ''
          const supplyingStore = n.request?.supplyingStore?.name?.toLowerCase() || ''
          const remark = n.request?.remark?.toLowerCase() || ''
          return requestCode.includes(query) || 
                 items.includes(query) || 
                 askingStore.includes(query) || 
                 supplyingStore.includes(query) ||
                 remark.includes(query)
        })
      }
      
      console.log('✅ Loaded', notifications.value.length, 'notifications')
      console.log('📄 Pagination:', pagination.value)
    } else {
      showToastMessage(response.error || 'Failed to load notifications', 'error')
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
}

const onFilterChange = () => {
  loadAllNotifications(true)
}

const onSearchChange = () => {
  loadAllNotifications(true)
}

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// ================================================================
// ACCEPT CONFIRMATION
// ================================================================
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

// ================================================================
// REJECT CONFIRMATION
// ================================================================
const openRejectModal = (notification) => {
  currentNotification.value = notification
  rejectReason.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  currentNotification.value = null
  rejectReason.value = ''
  submitting.value = false
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    showToastMessage('Please provide a rejection reason', 'warning')
    return
  }

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

const clearFilters = () => {
  filterStatus.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
  loadAllNotifications(true)
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ================================================================
// LIFECYCLE
// ================================================================
onMounted(() => {
  loadAllNotifications(true)
})

// Watch for filter changes
watch([filterStatus, searchQuery], () => {
  clearTimeout(window._searchTimeout)
  window._searchTimeout = setTimeout(() => {
    loadAllNotifications(true)
  }, 300)
})
</script>

<style scoped>
.notifications-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1e293b;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh, .btn-filter {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-refresh {
  background: #3b82f6;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-filter {
  background: #f1f5f9;
  color: #1e293b;
}

.btn-filter:hover {
  background: #e2e8f0;
}

.filter-bar {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-clear {
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
}

.btn-clear:hover {
  background: #e2e8f0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
}

.summary-card .number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.summary-card .label {
  font-size: 12px;
  color: #94a3b8;
}

.summary-card.total .number { color: #3b82f6; }
.summary-card.pending .number { color: #f59e0b; }
.summary-card.accepted .number { color: #10b981; }
.summary-card.rejected .number { color: #ef4444; }

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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  gap: 16px;
  background: white;
  border-radius: 10px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  align-items: flex-start;
}

.notification-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-color: #cbd5e1;
}

.notification-card.pending {
  border-left: 4px solid #f59e0b;
}

.notification-card.accepted {
  border-left: 4px solid #10b981;
}

.notification-card.rejected {
  border-left: 4px solid #ef4444;
}

.notification-status-icon {
  font-size: 24px;
  flex-shrink: 0;
  padding-top: 4px;
}

.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.request-code {
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
  font-size: 14px;
}

.status-badge {
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.accepted {
  background: #dcfce7;
  color: #166534;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.notification-date {
  font-size: 12px;
  color: #94a3b8;
}

.notification-detail {
  font-size: 14px;
  color: #1e293b;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.notification-detail strong {
  color: #0f172a;
}

.notification-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.item-tag {
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #475569;
}

.item-more {
  font-size: 12px;
  color: #94a3b8;
  padding: 2px 8px;
}

/* 🔥 Request Remark Styles */
.request-remark {
  padding: 6px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #bbf7d0;
  font-size: 13px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.remark-label {
  font-weight: 600;
  color: #166534;
  white-space: nowrap;
}

.remark-text {
  color: #1e293b;
  word-break: break-word;
}

.rejection-reason {
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  font-size: 13px;
  color: #991b1b;
  margin-bottom: 8px;
  border: 1px solid #fecaca;
}

.rejection-label {
  font-weight: 600;
  margin-right: 4px;
}

.response-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.responded-by {
  display: flex;
  align-items: center;
  gap: 4px;
}

.responded-at {
  color: #94a3b8;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.btn-accept, .btn-reject {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-accept {
  background: #10b981;
  color: white;
}

.btn-accept:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 6px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f8fafc;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
}

.total-count {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 4px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 95%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.accept-modal,
.reject-modal {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
}

.modal-close:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.modal-body {
  padding: 20px;
}

.confirmation-icon {
  font-size: 48px;
  text-align: center;
  display: block;
  margin-bottom: 8px;
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

.confirm-text {
  color: #475569;
  font-size: 13px;
  text-align: center;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.request-summary {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.request-summary p {
  margin: 4px 0;
  font-size: 13px;
  color: #475569;
}

.request-summary strong {
  color: #1e293b;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.reject-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
}

.reject-textarea:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-footer button {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
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
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 10px;
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

.toast.success { background: #22c55e; }
.toast.error { background: #ef4444; }
.toast.warning { background: #f59e0b; }

@media (max-width: 768px) {
  .notifications-page {
    padding: 12px;
  }
  
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .notification-card {
    flex-direction: column;
    gap: 8px;
  }
  
  .notification-status-icon {
    font-size: 20px;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .header-actions button {
    flex: 1;
  }

  .modal-container {
    width: 95%;
  }

  .request-remark {
    flex-direction: column;
    gap: 2px;
  }
}
</style>