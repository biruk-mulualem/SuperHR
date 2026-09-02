<template>
  <div class="order-notifications-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>📋 Order Notifications</h1>
        <span class="total-badge">{{ totalOrders }} total</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by order #, product, or store..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-refresh" @click="loadOrders" :disabled="loading">
          <span class="refresh-icon">🔄</span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card pending" @click="filterStatus = 'pending'">
      
        <div class="stat-info">
          <span class="stat-label">Pending</span>
          <span class="stat-value">{{ pendingCount }}</span>
        </div>
      </div>
      <div class="stat-card accepted" @click="filterStatus = 'accepted'">
   
        <div class="stat-info">
          <span class="stat-label">Accepted</span>
          <span class="stat-value">{{ acceptedCount }}</span>
        </div>
      </div>
      <div class="stat-card rejected" @click="filterStatus = 'rejected'">
      
        <div class="stat-info">
          <span class="stat-label">Rejected</span>
          <span class="stat-value">{{ rejectedCount }}</span>
        </div>
      </div>
      <div class="stat-card completed" @click="filterStatus = 'completed'">
     
        <div class="stat-info">
          <span class="stat-label">Completed</span>
          <span class="stat-value">{{ completedCount }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="all">All Status</option>
        <option value="pending"> Pending</option>
        <option value="accepted"> Accepted</option>
        <option value="rejected"> Rejected</option>
        <option value="completed"> Completed</option>
      </select>

      <select v-model="filterPriority" class="filter-select" @change="onFilterChange">
        <option value="all">All Priority</option>
        <option value="high">🔴 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>

      <button class="btn-clear" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading orders...</p>
    </div>

    <!-- Orders List -->
    <div v-else class="orders-container">
      <div v-if="filteredOrders.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <h3>No Orders Found</h3>
        <p>No orders match your current filters</p>
        <button class="btn-secondary" @click="clearFilters">Clear Filters</button>
      </div>

      <!-- Order Card -->
      <div
        v-for="order in paginatedOrders"
        :key="order.id"
        class="order-card"
        :class="{
          'priority-high': order.priority === 'high',
          'priority-medium': order.priority === 'medium',
          'priority-low': order.priority === 'low',
          'status-pending': order.status === 'pending',
          'status-accepted': order.status === 'accepted',
          'status-rejected': order.status === 'rejected',
          'status-completed': order.status === 'completed'
        }"
      >
        <!-- Card Header -->
        <div class="order-card-header" @click="toggleExpand(order.id)">
          <div class="order-info">
            <div class="order-number-section">
              <span class="order-number">{{ order.orderNumber || 'ORD-' + order.orderId }}</span>
              <span :class="['status-badge', order.status]">
                {{ order.status }}
              </span>
              <span :class="['priority-badge', order.priority]">
                {{ order.priority }}
              </span>
            </div>
            <div class="order-meta">
              <span class="meta-item">
                <span class="meta-icon">📦</span>
                {{ order.productName }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">📊</span>
                {{ order.quantity }} {{ order.uom }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">🏪</span>
                {{ order.storeName || 'N/A' }}
              </span>
            </div>
          </div>
          <div class="order-actions">
            <span class="order-time">{{ formatDate(order.sentAt) }}</span>
            <button class="expand-btn" @click.stop="toggleExpand(order.id)">
              {{ expandedRow === order.id ? '▲' : '▼' }}
            </button>
          </div>
        </div>

        <!-- Expanded Details -->
        <div v-if="expandedRow === order.id" class="order-details">
          <div class="detail-grid">
            <!-- Left Column -->
            <div class="detail-column">
              <div class="detail-section">
                <h4>📋 Order Information</h4>
                <div class="detail-row">
                  <span class="detail-label">Order ID</span>
                  <span class="detail-value">{{ order.orderId }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Order Number</span>
                  <span class="detail-value">{{ order.orderNumber || 'N/A' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Product</span>
                  <span class="detail-value">{{ order.productName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Type</span>
                  <span class="detail-value">{{ order.productType }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Quantity</span>
                  <span class="detail-value">{{ order.quantity }} {{ order.uom }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Packaging</span>
                  <span class="detail-value">{{ order.packaging }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>📅 Dates</h4>
                <div class="detail-row">
                  <span class="detail-label">Sent At</span>
                  <span class="detail-value">{{ formatDateTime(order.sentAt) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Due Date</span>
                  <span class="detail-value">{{ formatDate(order.dueDate) }}</span>
                </div>
                <div class="detail-row" v-if="order.respondedAt">
                  <span class="detail-label">Responded At</span>
                  <span class="detail-value">{{ formatDateTime(order.respondedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="detail-column">
              <div class="detail-section">
                <h4>👤 Sales Person</h4>
                <div class="detail-row">
                  <span class="detail-label">Name</span>
                  <span class="detail-value">{{ order.salesPersonName || 'Not assigned' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">{{ order.salesPersonPhone || 'N/A' }}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4>📤 Sent By</h4>
                <div class="detail-row">
                  <span class="detail-label">Sent By</span>
                  <span class="detail-value sent-by">
                    {{ order.sentBy || 'Unknown' }}
                    
                  </span>
                </div>
              </div>

              <div class="detail-section" v-if="order.rejectionReason">
                <h4>❌ Rejection Reason</h4>
                <div class="rejection-reason">
                  {{ order.rejectionReason }}
                </div>
              </div>

              <div class="detail-section" v-if="order.respondedBy && order.status !== 'pending'">
                <h4>👤 Processed By</h4>
                <div class="detail-row">
                  <span class="detail-label">Processed By</span>
                  <span class="detail-value">{{ order.respondedBy }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="items-section" v-if="order.items && order.items.length > 0">
            <h4>📦 Order Items</h4>
            <table class="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>UOM</th>
                  <th>Packaging</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in order.items" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.itemName }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.uom }}</td>
                  <td>{{ item.packaging }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Notes -->
          <div class="notes-section" v-if="order.notes">
            <h4>📝 Notes</h4>
            <p class="notes-text">{{ order.notes }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="detail-actions">
            <!-- Pending: Show Accept & Reject -->
            <template v-if="order.status === 'pending'">
              <button class="btn-accept" @click="acceptOrder(order)" :disabled="processing">
                ✅ Accept Order
              </button>
              <button class="btn-reject" @click="openRejectModal(order)" :disabled="processing">
                ❌ Reject Order
              </button>
            </template>

            <!-- Accepted: Show Complete button -->
            <template v-if="order.status === 'accepted'">
              <button class="btn-complete" @click="completeOrder(order)" :disabled="processing">
                🏁 Complete Order
              </button>
              <span class="action-hint">Order accepted - Mark as completed when done</span>
            </template>

            <!-- Completed: Show badge -->
            <template v-if="order.status === 'completed'">
              <span class="completed-badge">✅ Order Completed</span>
              <span class="action-hint">This order has been completed</span>
            </template>

            <!-- Rejected: Show info -->
            <template v-if="order.status === 'rejected'">
              <span class="rejected-badge">❌ Order Rejected</span>
              <span class="action-hint">This order was rejected by production</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="filteredOrders.length > 0">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          ← Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          Next →
        </button>
        <select v-model="pageSize" @change="changePageSize" class="limit-select">
          <option :value="5">5 per page</option>
          <option :value="10">10 per page</option>
          <option :value="20">20 per page</option>
          <option :value="50">50 per page</option>
        </select>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>❌ Reject Order</h3>
          <button class="modal-close" @click="closeRejectModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="order-summary">
            <p><strong>Order:</strong> {{ rejectOrder?.orderNumber || 'N/A' }}</p>
            <p><strong>Product:</strong> {{ rejectOrder?.productName }}</p>
            <p><strong>Quantity:</strong> {{ rejectOrder?.quantity }} {{ rejectOrder?.uom }}</p>
          </div>
          <div class="form-group">
            <label>Rejection Reason *</label>
            <textarea
              v-model="rejectReason"
              placeholder="Please provide a reason for rejecting this order..."
              rows="4"
              class="reject-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeRejectModal">Cancel</button>
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

    <!-- Complete Confirmation Modal -->
    <div v-if="showCompleteModal" class="modal-overlay" @click.self="closeCompleteModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>🏁 Complete Order</h3>
          <button class="modal-close" @click="closeCompleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">🏁</div>
          <p class="confirmation-title">
            Are you sure you want to mark this order as completed?
          </p>
          <div class="order-summary">
            <p><strong>Order:</strong> {{ completeOrderData?.orderNumber || 'N/A' }}</p>
            <p><strong>Product:</strong> {{ completeOrderData?.productName }}</p>
            <p><strong>Quantity:</strong> {{ completeOrderData?.quantity }} {{ completeOrderData?.uom }}</p>
          </div>
          <p class="confirm-text">
            This will mark the order as completed in production.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeCompleteModal">Cancel</button>
          <button
            class="btn-complete-confirm"
            @click="confirmComplete"
            :disabled="completing"
          >
            {{ completing ? 'Processing...' : '🏁 Confirm Complete' }}
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import orderService from '@/stores/orderService';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// ================================================================
// STATE
// ================================================================

const orders = ref([]);
const loading = ref(false);
const processing = ref(false);
const submitting = ref(false);
const completing = ref(false);
const searchQuery = ref('');
const filterStatus = ref('all');
const filterPriority = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const expandedRow = ref(null);

// Reject Modal
const showRejectModal = ref(false);
const rejectOrder = ref(null);
const rejectReason = ref('');

// Complete Modal
const showCompleteModal = ref(false);
const completeOrderData = ref(null);

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Pagination from API
const apiPagination = ref(null);
const totalFromApi = ref(0);

// ================================================================
// COMPUTED
// ================================================================

const allOrders = computed(() => orders.value);

const filteredOrders = computed(() => {
  let result = [...allOrders.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(order =>
      (order.orderNumber || '').toLowerCase().includes(query) ||
      (order.productName || '').toLowerCase().includes(query) ||
      (order.storeName || '').toLowerCase().includes(query) ||
      (order.salesPersonName || '').toLowerCase().includes(query)
    );
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(order => order.status === filterStatus.value);
  }

  if (filterPriority.value !== 'all') {
    result = result.filter(order => order.priority === filterPriority.value);
  }

  // Sort by sentAt (newest first)
  result.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

  return result;
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredOrders.value.slice(start, end);
});

const totalOrders = computed(() => filteredOrders.value.length);
const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize.value));

const pendingCount = computed(() => allOrders.value.filter(o => o.status === 'pending').length);
const acceptedCount = computed(() => allOrders.value.filter(o => o.status === 'accepted').length);
const rejectedCount = computed(() => allOrders.value.filter(o => o.status === 'rejected').length);
const completedCount = computed(() => allOrders.value.filter(o => o.status === 'completed').length);

const hasActiveFilters = computed(() =>
  filterStatus.value !== 'all' ||
  filterPriority.value !== 'all' ||
  searchQuery.value
);

// ================================================================
// METHODS
// ================================================================

/**
 * Load orders from API
 */
const loadOrders = async () => {
  loading.value = true;
  try {
    // Get current user's store ID from auth
    const storeId = authStore.userStoreId || authStore.user?.storeId;
    
    if (!storeId) {
      showToastMessage('No store assigned to your account', 'warning');
      orders.value = [];
      return;
    }

    const response = await orderService.getOrderNotifications(storeId, {
      status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
      page: currentPage.value,
      limit: pageSize.value
    });

    if (response.success) {
      orders.value = response.data || [];
      apiPagination.value = response.pagination;
      totalFromApi.value = response.pagination?.total || 0;
      
      // If we have fewer items than page size, we've reached the end
      if (response.data && response.data.length < pageSize.value) {
        // No more pages
      }
    } else {
      showToastMessage('Failed to load orders', 'error');
      orders.value = [];
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    showToastMessage(error.message || 'Failed to load orders', 'error');
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * Accept an order
 */
const acceptOrder = async (order) => {
  processing.value = true;
  try {
    // Use the notification ID to accept
    const response = await orderService.acceptOrderNotification(order.id);
    
    if (response.success) {
      // Update local order status
      const index = orders.value.findIndex(o => o.id === order.id);
      if (index !== -1) {
        orders.value[index].status = 'accepted';
        orders.value[index].respondedAt = new Date().toISOString();
        orders.value[index].respondedBy = response.data?.respondedBy || 'Production Manager';
      }
      
      showToastMessage(`✅ Order ${order.orderNumber} accepted!`, 'success');
    } else {
      showToastMessage(response.message || 'Failed to accept order', 'error');
    }
  } catch (error) {
    console.error('Error accepting order:', error);
    showToastMessage(error.message || 'Failed to accept order', 'error');
  } finally {
    processing.value = false;
  }
};

/**
 * Open reject modal
 */
const openRejectModal = (order) => {
  rejectOrder.value = order;
  rejectReason.value = '';
  showRejectModal.value = true;
};

/**
 * Close reject modal
 */
const closeRejectModal = () => {
  showRejectModal.value = false;
  rejectOrder.value = null;
  rejectReason.value = '';
  submitting.value = false;
};

/**
 * Confirm reject order
 */
const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    showToastMessage('Please provide a rejection reason', 'warning');
    return;
  }

  submitting.value = true;
  try {
    const response = await orderService.rejectOrderNotification(
      rejectOrder.value.id,
      rejectReason.value.trim()
    );
    
    if (response.success) {
      const index = orders.value.findIndex(o => o.id === rejectOrder.value.id);
      if (index !== -1) {
        orders.value[index].status = 'rejected';
        orders.value[index].rejectionReason = rejectReason.value.trim();
        orders.value[index].respondedAt = new Date().toISOString();
        orders.value[index].respondedBy = response.data?.respondedBy || 'Production Manager';
      }
      
      showToastMessage(`❌ Order ${rejectOrder.value.orderNumber} rejected`, 'warning');
      closeRejectModal();
    } else {
      showToastMessage(response.message || 'Failed to reject order', 'error');
    }
  } catch (error) {
    console.error('Error rejecting order:', error);
    showToastMessage(error.message || 'Failed to reject order', 'error');
  } finally {
    submitting.value = false;
  }
};

/**
 * Open complete modal
 */
const completeOrder = (order) => {
  completeOrderData.value = order;
  showCompleteModal.value = true;
};

/**
 * Close complete modal
 */
const closeCompleteModal = () => {
  showCompleteModal.value = false;
  completeOrderData.value = null;
  completing.value = false;
};

/**
 * Confirm complete order
 */
const confirmComplete = async () => {
  completing.value = true;
  try {
    // Use the notification ID to complete
    const response = await orderService.completeOrderNotification(completeOrderData.value.id);
    
    if (response.success) {
      const index = orders.value.findIndex(o => o.id === completeOrderData.value.id);
      if (index !== -1) {
        orders.value[index].status = 'completed';
        orders.value[index].respondedAt = new Date().toISOString();
        orders.value[index].respondedBy = response.data?.respondedBy || 'Production Manager';
      }
      
      showToastMessage(`🏁 Order ${completeOrderData.value.orderNumber} completed!`, 'success');
      closeCompleteModal();
    } else {
      showToastMessage(response.message || 'Failed to complete order', 'error');
    }
  } catch (error) {
    console.error('Error completing order:', error);
    showToastMessage(error.message || 'Failed to complete order', 'error');
  } finally {
    completing.value = false;
  }
};

/**
 * Search handler
 */
const onSearchChange = () => {
  currentPage.value = 1;
  loadOrders();
};

/**
 * Filter change handler
 */
const onFilterChange = () => {
  currentPage.value = 1;
  loadOrders();
};

/**
 * Clear all filters
 */
const clearFilters = () => {
  searchQuery.value = '';
  filterStatus.value = 'all';
  filterPriority.value = 'all';
  currentPage.value = 1;
  showToastMessage('Filters cleared', 'info');
  loadOrders();
};

/**
 * Change page
 */
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadOrders();
};

/**
 * Change page size
 */
const changePageSize = () => {
  currentPage.value = 1;
  loadOrders();
};

/**
 * Toggle expand row
 */
const toggleExpand = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

/**
 * Format date
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date time
 */
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Show toast message
 */
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(() => {
  loadOrders();
});
</script>

<style scoped>
/* ================================================================ */
/* All styles remain the same as the previous version */
/* ================================================================ */

.order-notifications-page {
  padding: 20px;
  max-width: 1400px;
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

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.total-badge {
  background: #f1f5f9;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 14px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  width: 280px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.btn-refresh {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.pending { border-left: 4px solid #f59e0b; }
.stat-card.accepted { border-left: 4px solid #22c55e; }
.stat-card.rejected { border-left: 4px solid #ef4444; }
.stat-card.completed { border-left: 4px solid #3b82f6; }

.stat-icon { font-size: 28px; }
.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 12px; color: #94a3b8; font-weight: 500; }
.stat-value { font-size: 22px; font-weight: 700; color: #1e293b; }

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  font-size: 13px;
  cursor: pointer;
  min-width: 140px;
}

.btn-clear {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #e2e8f0;
}

/* Loading State */
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
.empty-state h3 { font-size: 20px; color: #1e293b; margin: 0 0 8px 0; }
.empty-state p { color: #94a3b8; margin: 0 0 20px 0; }

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* Order Cards */
.orders-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.order-card.priority-high { border-left: 4px solid #ef4444; }
.order-card.priority-medium { border-left: 4px solid #f59e0b; }
.order-card.priority-low { border-left: 4px solid #22c55e; }
.order-card.status-pending { background: #fffbeb; }
.order-card.status-accepted { background: #f0fdf4; }
.order-card.status-rejected { background: #fef2f2; }
.order-card.status-completed { background: #eff6ff; }

/* Order Card Header */
.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.order-card-header:hover {
  background: rgba(0, 0, 0, 0.02);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.order-number-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.order-number {
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
}

.status-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.accepted { background: #dcfce7; color: #166534; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.status-badge.completed { background: #dbeafe; color: #1e40af; }

.priority-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
}

.priority-badge.high { background: #fee2e2; color: #991b1b; }
.priority-badge.medium { background: #fef3c7; color: #92400e; }
.priority-badge.low { background: #dcfce7; color: #166534; }

.order-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-icon { font-size: 14px; }

.order-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.order-time { font-size: 12px; color: #94a3b8; }

.expand-btn {
  background: #f1f5f9;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: #e2e8f0;
}

/* Order Details */
.order-details {
  padding: 0 20px 20px 20px;
  border-top: 1px solid #e2e8f0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
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
  font-size: 13px;
  color: #64748b;
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.sent-by { color: #3b82f6; }
.sent-id { font-size: 11px; color: #94a3b8; font-weight: 400; }

.rejection-reason {
  background: #fee2e2;
  padding: 12px 16px;
  border-radius: 6px;
  color: #991b1b;
  font-size: 14px;
  line-height: 1.6;
}

/* Items Table */
.items-section { margin-bottom: 16px; }
.items-section h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px 0; }

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.items-table th {
  background: #f1f5f9;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
}

.items-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.items-table tr:hover td {
  background: #f8fafc;
}

/* Notes */
.notes-section { margin-bottom: 16px; }
.notes-section h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0; }

.notes-text {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 6px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

/* Detail Actions */
.detail-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
  align-items: center;
}

.btn-accept {
  padding: 10px 24px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-accept:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-accept:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-reject {
  padding: 10px 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-reject:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-complete {
  padding: 10px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-complete:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-complete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.completed-badge {
  display: inline-block;
  padding: 8px 20px;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.rejected-badge {
  display: inline-block;
  padding: 8px 20px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.action-hint {
  font-size: 13px;
  color: #94a3b8;
  font-style: italic;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1e293b;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #475569;
}

.limit-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

/* Modals */
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
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 95%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 20px;
}

.order-summary {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.order-summary p {
  margin: 4px 0;
  font-size: 13px;
  color: #475569;
}

.order-summary strong {
  color: #1e293b;
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

.confirm-text {
  color: #475569;
  font-size: 13px;
  text-align: center;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  transition: all 0.2s;
}

.reject-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 8px 20px;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #cbd5e1;
}

.btn-danger {
  padding: 8px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-complete-confirm {
  padding: 8px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-complete-confirm:hover:not(:disabled) {
  background: #2563eb;
}

.btn-complete-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  max-width: 400px;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  to { opacity: 0; transform: translateY(-10px); }
}

.toast.success { background: #22c55e; }
.toast.error { background: #ef4444; }
.toast.warning { background: #f59e0b; }
.toast.info { background: #3b82f6; }

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */

@media (max-width: 1024px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .detail-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .order-notifications-page { padding: 12px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-right { flex-direction: column; width: 100%; }
  .search-box { width: 100%; }
  .search-box input { width: 100%; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .order-card-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .order-actions { width: 100%; justify-content: flex-start; }
  .order-meta { flex-direction: column; gap: 4px; }
  .modal-container { width: 95%; }
  .detail-actions { flex-direction: column; align-items: stretch; }
  .detail-actions button { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr; }
  .order-number-section { flex-wrap: wrap; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-select { width: 100%; }
}
</style>