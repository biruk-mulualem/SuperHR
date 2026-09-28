<!-- views/storemanagement/orders/Orders.vue -->

<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📋 Order Management</h2>
       
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by order #, product, packaging, or sales person..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openCreateModal">
          ✚ New Order
        </button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select
        v-model="filterStatus"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="all">All Status</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        v-model="filterPriority"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="all">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select
        v-model="filterProductType"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="all">All Types</option>
        <option value="Paint">Paint</option>
        <option value="Fiber">Fiber</option>
      </select>

      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>

      <button class="btn-export" @click="exportOrders">
        📊 Export
      </button>
    </div>

    <!-- ==================== STATS ROW ==================== -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">Total Orders</span>
        <span class="stat-value">{{ totalOrders }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Draft</span>
        <span class="stat-value draft-value">{{ draftOrders }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Sent</span>
        <span class="stat-value sent-value">{{ sentOrders }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Accepted</span>
        <span class="stat-value accepted-value">{{ acceptedOrders }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Completed</span>
        <span class="stat-value completed-value">{{ completedOrders }}</span>
      </div>
    </div>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading orders...</p>
    </div>

    <!-- ==================== ORDERS TABLE ==================== -->
    <div v-else class="table-wrapper">
      <table class="orders-table">
        <thead>
          <tr>
            <th style="width:35px"></th>
            <th>Order #</th>
            <th>Product</th>
            <th>Packaging</th>
            <th>Qty</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredOrders.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📋</span>
                <p>No orders found</p>
                <button class="btn-secondary" @click="openCreateModal">
                  Create First Order
                </button>
              </div>
            </td>
          </tr>
          <template v-for="order in paginatedOrders" :key="order.id">
            <tr
              :class="{
                'expanded-row': expandedRow === order.id,
                'priority-high': order.priority === 'high',
                'priority-medium': order.priority === 'medium',
                'priority-low': order.priority === 'low',
                'status-rejected': order.status === 'rejected',
                'status-cancelled': order.status === 'cancelled'
              }"
            >
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(order.id)">
                  {{ expandedRow === order.id ? "▼" : "▶" }}
                </button>
              </td>
              <td>
                <span class="order-code">{{ order.orderNumber }}</span>
              </td>
              <td>
                <div class="product-info">
                  <span class="product-name">{{ order.productName }}</span>
                  <span class="product-type">{{ order.productType }}</span>
                </div>
              </td>
              <td>
                <span class="packaging-badge">{{ order.packaging }}</span>
              </td>
              <td>
                <div class="quantity-info">
                  <span class="quantity-value">{{ order.quantity }}</span>
                  <span class="quantity-uom">{{ order.uom || 'Units' }}</span>
                </div>
              </td>
              <td>
                <span :class="['priority-badge', order.priority]">
                  {{ order.priority }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', order.status]">
                  {{ order.status }}
                </span>
                <!-- Rejection reason indicator -->
                <div v-if="order.status === 'rejected' && order.rejectionReason" class="rejection-indicator">
                  <span class="rejection-icon">❌</span>
                  <span class="rejection-short">{{ order.rejectionReason.substring(0, 30) }}{{ order.rejectionReason.length > 30 ? '...' : '' }}</span>
                </div>
              </td>
              <td>
                <span class="date-text">{{ formatDate(order.dueDate) }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <!-- Edit - Available for Draft, Rejected, and Cancelled -->
                  <button
                    v-if="canEditOrder(order)"
                    class="action-btn edit"
                    @click="editOrder(order)"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  
                  <!-- Send - Only for Draft -->
                  <button
                    v-if="order.status === 'draft'"
                    class="action-btn send"
                    @click="openSendModal(order)"
                    title="Send to Production"
                  >
                    📤
                  </button>
                  
                  <!-- Restore to Draft - For Cancelled orders -->
                  <button
                    v-if="order.status === 'cancelled'"
                    class="action-btn restore"
                    @click="restoreOrder(order)"
                    title="Restore to Draft"
                  >
                    ↩️
                  </button>
                  
                  <!-- Cancel - For Draft and Sent -->
                  <button
                    v-if="order.status === 'draft' || order.status === 'sent'"
                    class="action-btn cancel"
                    @click="cancelOrder(order)"
                    title="Cancel"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW ==================== -->
            <tr v-if="expandedRow === order.id" class="detail-expand-row">
              <td colspan="9">
                <div class="expand-details">
                  <div class="detail-container">
                    <div class="detail-row-three-cols">
                      <div class="detail-card">
                        <h4>📋 Order Information</h4>
                        <div><span>Order #</span><span class="value">{{ order.orderNumber }}</span></div>
                        <div><span>Created Date</span><span class="value">{{ formatDate(order.createdDate) }}</span></div>
                        <div><span>Due Date</span><span class="value">{{ formatDate(order.dueDate) }}</span></div>
                        <div><span>Priority</span><span class="value">{{ order.priority }}</span></div>
                        <div>
                          <span>Status</span>
                          <span class="value">
                            <span :class="['status-badge', order.status]">{{ order.status }}</span>
                          </span>
                        </div>
                        <div><span>Packaging</span><span class="value">{{ order.packaging }}</span></div>
                        <div><span>Quantity</span><span class="value">{{ order.quantity }} {{ order.uom }}</span></div>
                      </div>

                      <div class="detail-card">
                        <h4>👤 Sales Person</h4>
                        <div><span>Name</span><span class="value">{{ order.salesPersonName || 'Not assigned' }}</span></div>
                        <div><span>Phone</span><span class="value">{{ order.salesPersonPhone || 'N/A' }}</span></div>
                      </div>

                      <div class="detail-card">
                        <h4>🧪 Product Information</h4>
                        <div><span>Product</span><span class="value">{{ order.productName || 'N/A' }}</span></div>
                        <div><span>Type</span><span class="value">{{ order.productType || 'N/A' }}</span></div>
                        <div><span>FG Code</span><span class="value">{{ order.fgCode || 'N/A' }}</span></div>
                      </div>
                    </div>

                    <!-- ============================================================ -->
                    <!-- REJECTION REASON - Set by Production, Displayed Here -->
                    <!-- ============================================================ -->
                    <div v-if="order.status === 'rejected' && order.rejectionReason" class="detail-card full-width rejection-card">
                      <h4>❌ Rejection Reason <span class="badge-production">(Set by Production)</span></h4>
                      <div class="rejection-reason-display">
                        <div class="rejection-reason-text">{{ order.rejectionReason }}</div>
                        <div class="rejection-reason-meta">
                          <span>📅 Rejected on: {{ formatDateTime(order.rejectedAt || '') }}</span>
                          <span v-if="order.rejectedBy">👤 By: {{ order.rejectedBy }}</span>
                        </div>
                      </div>
                      <div class="rejection-action-note">
                        💡 You can edit this order to make changes and send it again.
                      </div>
                    </div>

                    <!-- ============================================================ -->
                    <!-- ACCEPTED / COMPLETED INFO - Set by Production -->
                    <!-- ============================================================ -->
                    <div v-if="order.status === 'accepted'" class="detail-card full-width accepted-card">
                      <h4>✅ Accepted <span class="badge-production">(Set by Production)</span></h4>
                      <div class="accepted-info">
                        <div class="accepted-meta">
                          <span>📅 Accepted on: {{ formatDateTime(order.acceptedAt || '') }}</span>
                          <span v-if="order.acceptedBy">👤 By: {{ order.acceptedBy }}</span>
                        </div>
                      </div>
                    </div>

                    <div v-if="order.status === 'completed'" class="detail-card full-width completed-card">
                      <h4>🏁 Completed <span class="badge-production">(Set by Production)</span></h4>
                      <div class="completed-info">
                        <div class="completed-meta">
                          <span>📅 Completed on: {{ formatDateTime(order.completedAt || '') }}</span>
                          <span v-if="order.completedBy">👤 By: {{ order.completedBy }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Cancelled Info -->
                    <div v-if="order.status === 'cancelled'" class="detail-card full-width cancelled-card">
                      <h4>🗑️ Cancelled</h4>
                      <div class="cancelled-info">
                        <div class="cancelled-meta">
                          <span>📅 Cancelled on: {{ formatDateTime(order.cancelledAt || '') }}</span>
                          <span v-if="order.cancelledBy">👤 By: {{ order.cancelledBy }}</span>
                        </div>
                        <div class="cancelled-action-note">
                          💡 You can restore this order to Draft to make changes.
                        </div>
                      </div>
                    </div>

                    <!-- Order Items -->
                    <div class="detail-card full-width">
                      <h4>📦 Order Items</h4>
                      <table class="items-detail-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>UOM</th>
                            <th>Packaging</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="!order.items || order.items.length === 0">
                            <td colspan="5" class="text-center no-items">No items in this order</td>
                          </tr>
                          <tr v-for="(item, index) in order.items" :key="index">
                            <td class="text-center">{{ index + 1 }}</td>
                            <td>{{ item.itemName || 'N/A' }}</td>
                            <td class="text-center">{{ item.quantity }}</td>
                            <td>{{ item.uom || 'Units' }}</td>
                            <td>{{ item.packaging || order.packaging }}</td>
                          </tr>
                          <tr class="total-row">
                            <td colspan="4" class="text-right"><strong>Total Items:</strong></td>
                            <td class="text-center"><strong>{{ order.items?.length || 0 }}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div class="detail-card full-width">
                      <h4>📝 Notes</h4>
                      <div v-if="order.notes" class="notes-content">{{ order.notes }}</div>
                      <div v-else class="no-notes">No notes provided</div>
                    </div>

                    <!-- ============================================================ -->
                    <!-- ACTION BUTTONS -->
                    <!-- ============================================================ -->
                    <div class="detail-actions">
                      <!-- Edit - Available for Draft, Rejected, and Cancelled -->
                      <button
                        v-if="canEditOrder(order)"
                        class="btn-edit-detail"
                        @click="editOrder(order)"
                      >
                        ✏️ Edit Order
                      </button>
                      
                      <!-- Send - Only for Draft -->
                      <button
                        v-if="order.status === 'draft'"
                        class="btn-send-detail"
                        @click="openSendModal(order)"
                      >
                        📤 Send to Production
                      </button>
                      
                      <!-- Restore to Draft - For Cancelled orders -->
                      <button
                        v-if="order.status === 'cancelled'"
                        class="btn-restore-detail"
                        @click="restoreOrder(order)"
                      >
                        ↩️ Restore to Draft
                      </button>
                      
                      <!-- Cancel - For Draft and Sent -->
                      <button
                        v-if="order.status === 'draft' || order.status === 'sent'"
                        class="btn-cancel-detail"
                        @click="cancelOrder(order)"
                      >
                        🗑️ Cancel Order
                      </button>
                      
                      <button
                        class="btn-print-detail"
                        @click="printOrder(order)"
                      >
                        🖨️ Print Order
                      </button>
                      
                      <span v-if="order.status === 'accepted' || order.status === 'completed'" class="readonly-badge">
                        📄 Production Status - Read Only
                      </span>
                    </div>

                    <!-- Status History -->
                    <div class="detail-card full-width status-history-card">
                      <h4>📜 Status History</h4>
                      <div class="status-timeline">
                        <div class="timeline-item completed">
                          <span class="timeline-dot">●</span>
                          <span class="timeline-status">Draft</span>
                          <span class="timeline-date">{{ formatDateTime(order.createdDate || '') }}</span>
                          <span class="timeline-by">(Order Created)</span>
                        </div>
                       <div v-if="order.status === 'sent' || order.status === 'accepted' || order.status === 'rejected' || order.status === 'completed'" class="timeline-item completed">
    <span class="timeline-dot">●</span>
    <span class="timeline-status">Sent to Production</span>
    <span class="timeline-date">{{ formatDateTime(order.sentAt || '') }}</span>
    <span class="timeline-by">(Sent by: {{ order.sentBy || 'Unknown' }})</span>
</div>
                        <div v-if="order.status === 'accepted' || order.status === 'completed'" class="timeline-item completed">
                          <span class="timeline-dot">●</span>
                          <span class="timeline-status">Accepted</span>
                          <span class="timeline-date">{{ formatDateTime(order.acceptedAt || '') }}</span>
                          <span class="timeline-by">(By Production)</span>
                        </div>
                        <div v-if="order.status === 'rejected'" class="timeline-item rejected">
                          <span class="timeline-dot">●</span>
                          <span class="timeline-status">Rejected</span>
                          <span class="timeline-date">{{ formatDateTime(order.rejectedAt || '') }}</span>
                          <span class="timeline-by">(By Production)</span>
                        </div>
                        <div v-if="order.status === 'completed'" class="timeline-item completed">
                          <span class="timeline-dot">●</span>
                          <span class="timeline-status">Completed</span>
                          <span class="timeline-date">{{ formatDateTime(order.completedAt || '') }}</span>
                          <span class="timeline-by">(By Production)</span>
                        </div>
                        <div v-if="order.status === 'cancelled'" class="timeline-item cancelled">
                          <span class="timeline-dot">●</span>
                          <span class="timeline-status">Cancelled</span>
                          <span class="timeline-date">{{ formatDateTime(order.cancelledAt || '') }}</span>
                          <span class="timeline-by">(By Sales)</span>
                        </div>
                        <!-- Show if restored from cancelled -->
                        <div v-if="order.restoredFromCancelled" class="timeline-item restored">
                          <span class="timeline-dot">●</span>
                          <span class="timeline-status">Restored to Draft</span>
                          <span class="timeline-date">{{ formatDateTime(order.restoredAt || '') }}</span>
                          <span class="timeline-by">(By Sales)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="totalOrders > 0">
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

    <!-- ==================== CREATE/EDIT MODAL ==================== -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container order-modal">
        <div class="modal-header">
          <h3>{{ modalMode === 'create' ? '✚ New Order' : '✏️ Edit Order' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveOrder">
            <div class="form-grid">
              <div class="form-group">
                <label>Filter Products</label>
                <select v-model="form.productTypeFilter" @change="onProductTypeFilterChange">
                  <option value="all">All Products</option>
                  <option value="Paint">Paint</option>
                  <option value="Fiber">Fiber</option>
                </select>
              </div>

              <div class="form-group">
                <label>Select Product *</label>
                <select v-model="form.productId" required @change="onProductChange">
                  <option value="">🔍 Search product...</option>
                  <option 
                    v-for="product in filteredProducts" 
                    :key="product.id" 
                    :value="product.id"
                  >
                    {{ product.name }} ({{ product.fgCode }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Packaging / Size *</label>
                <select v-model="form.packaging" required>
                  <option value="">Select packaging...</option>
                  <option 
                    v-for="uom in packagingOptions" 
                    :key="uom.uomId || uom.id" 
                    :value="uom.code"
                  >
                    {{ uom.code }} - {{ uom.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Quantity *</label>
                <input 
                  type="number" 
                  v-model.number="form.quantity" 
                  required 
                  min="1"
                  placeholder="Enter quantity"
                />
              </div>

              <div class="form-group">
                <label>Priority</label>
                <select v-model="form.priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div class="form-group">
                <label>Due Date *</label>
                <input 
                  type="date" 
                  v-model="form.dueDate" 
                  required
                />
              </div>

              <div class="form-group full-width">
                <div class="side-by-side">
                  <div class="side-field">
                    <label>Sales Person Name</label>
                    <input 
                      type="text" 
                      v-model="form.salesPersonName"
                      placeholder="Enter sales person name"
                    />
                  </div>
                  <div class="side-field">
                    <label>Sales Person Phone</label>
                    <input 
                      type="text" 
                      v-model="form.salesPersonPhone"
                      placeholder="Enter phone"
                    />
                  </div>
                </div>
              </div>

              <div class="form-group full-width">
                <label>Notes</label>
                <textarea 
                  v-model="form.notes" 
                  rows="3"
                  placeholder="Additional notes..."
                ></textarea>
              </div>

              <!-- Show rejection reason when editing a rejected order -->
              <div v-if="editingRejectedOrder" class="form-group full-width rejection-edit-notice">
                <div class="notice-box warning">
                  <span class="notice-icon">⚠️</span>
                  <div>
                    <strong>This order was rejected.</strong>
                    <p class="notice-text">You can edit the order and send it again. The rejection reason is shown below for reference.</p>
                    <div class="rejection-reference" v-if="editingRejectionReason">
                      <strong>Rejection Reason:</strong>
                      <p>{{ editingRejectionReason }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Show cancellation notice when editing a cancelled order -->
              <div v-if="editingCancelledOrder" class="form-group full-width cancellation-edit-notice">
                <div class="notice-box info">
                  <span class="notice-icon">ℹ️</span>
                  <div>
                    <strong>This order was cancelled.</strong>
                    <p class="notice-text">You can edit the order and send it again. The cancellation details are shown below for reference.</p>
                    <div class="cancellation-reference" v-if="editingCancelledAt">
                      <strong>Cancelled on:</strong>
                      <p>{{ formatDateTime(editingCancelledAt) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancel</button>
          <button class="btn-save" @click="saveOrder" :disabled="saving">
            {{ saving ? 'Saving...' : (modalMode === 'create' ? 'Create Order' : 'Update Order') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== SEND TO PRODUCTION MODAL ==================== -->
    <div v-if="showSendModal" class="modal-overlay" @click.self="closeSendModal">
      <div class="modal-container send-modal">
        <div class="modal-header">
          <h3>📤 Send to Production</h3>
          <button class="modal-close" @click="closeSendModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">📤</div>
          <p class="confirmation-title">Send Order to Production</p>
             <div class="form-group full-width" style="margin-top: 16px;">
            <label>Select Store to Send *</label>
            <select v-model="selectedStoreId" required class="store-select">
              <option value="">-- Select a store --</option>
              <option 
                v-for="store in activeStores" 
                :key="store.id" 
                :value="store.id"
              >
                {{ store.code }} - {{ store.name }} {{ store.location ? '(' + store.location + ')' : '' }}
              </option>
            </select>
            <p class="hint-text">This order will be sent to the selected store's production department.</p>
          </div>
          <div class="confirmation-details" v-if="sendOrderData">
            <div class="detail-row">
              <span class="detail-label">Order:</span>
              <span class="detail-value">{{ sendOrderData.orderNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Product:</span>
              <span class="detail-value">{{ sendOrderData.productName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Packaging:</span>
              <span class="detail-value">{{ sendOrderData.packaging }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value">{{ sendOrderData.quantity }} {{ sendOrderData.uom }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Sales Person:</span>
              <span class="detail-value">{{ sendOrderData.salesPersonName || 'Not assigned' }}</span>
            </div>
          </div>

          <!-- Store Selection Dropdown -->
       

          <p class="warning-text">⚠️ This order will be sent to the production department for review and processing.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeSendModal">Cancel</button>
          <button class="btn-primary" @click="confirmSendOrder" :disabled="!selectedStoreId || confirmProcessing">
            {{ confirmProcessing ? 'Sending...' : '📤 Send Order' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== CONFIRMATION MODAL ==================== -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeConfirmModal">
      <div class="modal-container confirm-modal">
        <div class="modal-header">
          <h3>⚠️ Confirm Action</h3>
          <button class="modal-close" @click="closeConfirmModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">{{ confirmIcon }}</div>
          <p class="confirmation-title">{{ confirmTitle }}</p>
          <div class="confirmation-details" v-if="confirmOrder">
            <div class="detail-row">
              <span class="detail-label">Order:</span>
              <span class="detail-value">{{ confirmOrder.orderNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Product:</span>
              <span class="detail-value">{{ confirmOrder.productName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Packaging:</span>
              <span class="detail-value">{{ confirmOrder.packaging }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantity:</span>
              <span class="detail-value">{{ confirmOrder.quantity }} {{ confirmOrder.uom }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Sales Person:</span>
              <span class="detail-value">{{ confirmOrder.salesPersonName || 'Not assigned' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Action:</span>
              <span class="detail-value">{{ confirmAction }}</span>
            </div>
          </div>
          <p class="warning-text">{{ confirmWarning }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeConfirmModal">Cancel</button>
          <button class="btn-danger" @click="confirmActionExecute" :disabled="confirmProcessing">
            {{ confirmProcessing ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import orderService from '@/stores/orderService';
import itemService from '@/stores/itemService';
import storeService from '@/stores/storeService';
import type { UOM } from '@/stores/itemService';
import type { Store } from '@/stores/storeService';

// ================================================================
// TYPES
// ================================================================

interface OrderItem {
  itemName: string;
  description?: string;
  quantity: number;
  uom?: string;
  packaging?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  productId: number;
  productName: string;
  productType: 'Paint' | 'Fiber';
  fgCode: string;
  quantity: number;
  uom: string;
  packaging: string;
  salesPersonId: number;
  salesPersonName: string;
  salesPersonPhone: string;
  priority: 'high' | 'medium' | 'low';
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdDate: string;
  dueDate: string;
  sentAt?: string;
    sentBy?: string;      // ✅ Add this
    sentById?: number;    // ✅ Add this
  acceptedAt?: string;
  acceptedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  completedAt?: string;
  completedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  restoredFromCancelled?: boolean;
  restoredAt?: string;
  notes?: string;
  items: OrderItem[];
  storeId?: number;
  storeName?: string;
}

interface Product {
  id: number;
  name: string;
  fgCode: string;
  type: 'Paint' | 'Fiber';
  uom: string;
}

// ================================================================
// STATE
// ================================================================

const router = useRouter();
const authStore = useAuthStore();

// Data
const orders = ref<Order[]>([]);
const products = ref<Product[]>([]);
const uomList = ref<UOM[]>([]);
const stores = ref<Store[]>([]);
const loading = ref(false);
const saving = ref(false);

// User data
const userIsAdmin = ref(false);
const currentUserId = ref<number | null>(null);

// Filters & Search
const searchQuery = ref('');
const filterStatus = ref('all');
const filterPriority = ref('all');
const filterProductType = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const totalOrders = ref(0);
const totalPages = ref(1);

// Expand
const expandedRow = ref<number | null>(null);

// Modal states
const showModal = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const editingOrderId = ref<number | null>(null);
const editingRejectedOrder = ref(false);
const editingRejectionReason = ref('');
const editingCancelledOrder = ref(false);
const editingCancelledAt = ref('');

// Send Modal
const showSendModal = ref(false);
const sendOrderData = ref<Order | null>(null);
const selectedStoreId = ref<number | null>(null);

// Confirm Modal
const showConfirmModal = ref(false);
const confirmOrder = ref<Order | null>(null);
const confirmAction = ref('');
const confirmIcon = ref('');
const confirmTitle = ref('');
const confirmWarning = ref('');
const confirmProcessing = ref(false);

// Form state
const form = ref({
  productId: null as number | null,
  productTypeFilter: 'all' as 'all' | 'Paint' | 'Fiber',
  packaging: '',
  quantity: 1,
  priority: 'medium' as 'high' | 'medium' | 'low',
  salesPersonName: '',
  salesPersonPhone: '',
  dueDate: '',
  notes: '',
});

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'info' | 'warning'>('success');

// ================================================================
// COMPUTED
// ================================================================

const filteredProducts = computed(() => {
  let result = [...products.value];
  if (form.value.productTypeFilter !== 'all') {
    result = result.filter(p => p.type === form.value.productTypeFilter);
  }
  return result;
});

const packagingOptions = computed(() => {
  return uomList.value.filter(u => u.status === 'Active');
});

const activeStores = computed(() => {
  return stores.value.filter(s => s.status === 'Active');
});

const filteredOrders = computed(() => {
  let result = [...orders.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(order =>
      order.orderNumber.toLowerCase().includes(query) ||
      order.productName.toLowerCase().includes(query) ||
      order.packaging.toLowerCase().includes(query) ||
      order.fgCode.toLowerCase().includes(query) ||
      order.salesPersonName?.toLowerCase().includes(query) ||
      order.storeName?.toLowerCase().includes(query)
    );
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(order => order.status === filterStatus.value);
  }

  if (filterPriority.value !== 'all') {
    result = result.filter(order => order.priority === filterPriority.value);
  }

  if (filterProductType.value !== 'all') {
    result = result.filter(order => order.productType === filterProductType.value);
  }

  return result;
});

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredOrders.value.slice(start, end);
});

const hasActiveFilters = computed(() => 
  filterStatus.value !== 'all' || 
  filterPriority.value !== 'all' || 
  filterProductType.value !== 'all' || 
  searchQuery.value
);

const draftOrders = computed(() => orders.value.filter(o => o.status === 'draft').length);
const sentOrders = computed(() => orders.value.filter(o => o.status === 'sent').length);
const acceptedOrders = computed(() => orders.value.filter(o => o.status === 'accepted').length);
const completedOrders = computed(() => orders.value.filter(o => o.status === 'completed').length);

// ================================================================
// PERMISSION METHODS
// ================================================================

const canEditOrder = (order: Order): boolean => {
  return order.status === 'draft' || order.status === 'rejected' || order.status === 'cancelled';
};

// ================================================================
// DATA LOADING METHODS
// ================================================================

const loadProducts = async () => {
  try {
    const response = await orderService.getFinishedGoods({ limit: 9999 });
    if (response.success) {
      products.value = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        fgCode: p.fgCode,
        type: p.type,
        uom: p.uom?.code || 'Units'
      }));
      console.log('✅ Loaded products:', products.value.length);
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
};

const loadUOMs = async () => {
  try {
    const response = await itemService.getUOMs();
    if (response.success) {
      uomList.value = response.data;
      console.log('✅ Loaded UOMs:', uomList.value.length);
    }
  } catch (error) {
    console.error('Error loading UOMs:', error);
  }
};

const loadStores = async () => {
  try {
    const response = await storeService.getStores({ limit: 9999 });
    if (response.success) {
      stores.value = response.data.stores;
      console.log('✅ Loaded stores:', stores.value.length);
      console.log('✅ Active stores:', activeStores.value.length);
    }
  } catch (error) {
    console.error('Error loading stores:', error);
  }
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const filters: any = {
      page: currentPage.value,
      limit: pageSize.value,
    };

    if (searchQuery.value) filters.search = searchQuery.value;
    if (filterStatus.value !== 'all') filters.status = filterStatus.value;
    if (filterPriority.value !== 'all') filters.priority = filterPriority.value;
    if (filterProductType.value !== 'all') filters.productType = filterProductType.value;

    if (!userIsAdmin.value && currentUserId.value) {
      filters.salesPersonId = currentUserId.value;
    }

    const response = await orderService.getOrders(filters);
    
    if (response.success) {
      orders.value = response.data;
      totalOrders.value = response.pagination.total;
      totalPages.value = response.pagination.totalPages;
    } else {
      showToastMessage('Failed to load orders', 'error');
    }
  } catch (error: any) {
    console.error('Error loading orders:', error);
    showToastMessage(error.message || 'Failed to load orders', 'error');
  } finally {
    loading.value = false;
  }
};

// ================================================================
// METHODS
// ================================================================

const onSearchChange = () => { currentPage.value = 1; loadOrders(); };
const onFilterChange = () => { currentPage.value = 1; loadOrders(); };
const onProductTypeFilterChange = () => { form.value.productId = null; };

const clearFilters = () => {
  filterStatus.value = 'all';
  filterPriority.value = 'all';
  filterProductType.value = 'all';
  searchQuery.value = '';
  currentPage.value = 1;
  showToastMessage('Filters cleared', 'info');
  loadOrders();
};

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadOrders();
};

const changePageSize = () => { 
  currentPage.value = 1; 
  loadOrders();
};

const toggleExpand = (id: number) => { 
  expandedRow.value = expandedRow.value === id ? null : id; 
};

const formatDate = (dateString: string): string => {
  return orderService.formatDate(dateString);
};

const formatDateTime = (dateString: string): string => {
  return orderService.formatDateTime(dateString);
};

// ================================================================
// ORDER CRUD
// ================================================================

const openCreateModal = () => {
  modalMode.value = 'create';
  editingOrderId.value = null;
  editingRejectedOrder.value = false;
  editingRejectionReason.value = '';
  editingCancelledOrder.value = false;
  editingCancelledAt.value = '';
  resetForm();
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  form.value.dueDate = defaultDueDate.toISOString().split('T')[0] ?? '';
  showModal.value = true;
};

const editOrder = (order: Order) => {
  modalMode.value = 'edit';
  editingOrderId.value = order.id;
  
  editingRejectedOrder.value = order.status === 'rejected';
  editingRejectionReason.value = order.rejectionReason || '';
  
  editingCancelledOrder.value = order.status === 'cancelled';
  editingCancelledAt.value = order.cancelledAt || '';
  
  form.value = {
    productId: order.productId,
    productTypeFilter: order.productType,
    packaging: order.packaging,
    quantity: order.quantity,
    priority: order.priority,
    salesPersonName: order.salesPersonName || '',
    salesPersonPhone: order.salesPersonPhone || '',
    dueDate: order.dueDate,
    notes: order.notes || '',
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingRejectedOrder.value = false;
  editingRejectionReason.value = '';
  editingCancelledOrder.value = false;
  editingCancelledAt.value = '';
  resetForm();
};

const resetForm = () => {
  form.value = {
    productId: null,
    productTypeFilter: 'all',
    packaging: '',
    quantity: 1,
    priority: 'medium',
    salesPersonName: '',
    salesPersonPhone: '',
    dueDate: '',
    notes: '',
  };
};

const onProductChange = () => {
  const product = products.value.find(p => p.id === form.value.productId);
  if (product) {
    if (product.uom && !form.value.packaging) {
      form.value.packaging = product.uom;
    }
  }
};

const saveOrder = async () => {
  if (!form.value.productId || !form.value.quantity || !form.value.packaging || !form.value.dueDate) {
    showToastMessage('Please fill in all required fields', 'error');
    return;
  }

  saving.value = true;

  try {
    const product = products.value.find(p => p.id === form.value.productId);
    if (!product) {
      showToastMessage('Product not found', 'error');
      saving.value = false;
      return;
    }

    const selectedUOM = uomList.value.find(u => u.code === form.value.packaging);
    const uomCode = selectedUOM?.code || form.value.packaging;

    const payload = {
      productId: form.value.productId,
      quantity: form.value.quantity,
      uom: uomCode,
      packaging: form.value.packaging,
      priority: form.value.priority,
      dueDate: form.value.dueDate,
      notes: form.value.notes,
      salesPersonName: form.value.salesPersonName || '',
      salesPersonPhone: form.value.salesPersonPhone || '',
      items: [{
        itemName: product.name,
        quantity: form.value.quantity,
        uom: uomCode,
        packaging: form.value.packaging
      }]
    };

    let response;
    if (modalMode.value === 'create') {
      response = await orderService.createOrder(payload);
    } else {
      response = await orderService.updateOrder(editingOrderId.value!, payload);
    }

    if (response.success) {
      showToastMessage(response.message, 'success');
      closeModal();
      loadOrders();
    } else {
      showToastMessage(response.message || 'Failed to save order', 'error');
    }
  } catch (error: any) {
    console.error('Error saving order:', error);
    showToastMessage(error.message || 'Failed to save order', 'error');
  } finally {
    saving.value = false;
  }
};

// ================================================================
// SEND MODAL
// ================================================================

const openSendModal = (order: Order) => {
  sendOrderData.value = order;
  selectedStoreId.value = null;
  showSendModal.value = true;
};

const closeSendModal = () => {
  showSendModal.value = false;
  sendOrderData.value = null;
  selectedStoreId.value = null;
  confirmProcessing.value = false;
};

// In Orders.vue - Update confirmSendOrder method

const confirmSendOrder = async () => {
  if (!selectedStoreId.value) {
    showToastMessage('Please select a store', 'error');
    return;
  }

  if (!sendOrderData.value) return;

  confirmProcessing.value = true;

  try {
    const order = sendOrderData.value;
    const storeId = selectedStoreId.value;
    const store = stores.value.find(s => s.id === storeId);

    // ✅ Send order with storeId
    const response = await orderService.sendOrder(order.id, storeId);
    
    if (response && response.success) {
      // Update local order data
      order.status = 'sent';
      order.sentAt = new Date().toISOString();
      order.storeId = storeId;
      order.storeName = store?.name || '';
      
      const index = orders.value.findIndex(o => o.id === order.id);
      if (index !== -1) {
        orders.value[index] = { ...order };
      }
      
      showToastMessage(`Order ${order.orderNumber} sent to ${store?.name || 'production'}!`, 'success');
      closeSendModal();
      loadOrders();
    } else {
      showToastMessage(response?.message || 'Failed to send order', 'error');
    }
  } catch (error: any) {
    console.error('Error sending order:', error);
    showToastMessage(error.message || 'Failed to send order', 'error');
  } finally {
    confirmProcessing.value = false;
  }
};

// ================================================================
// ORDER ACTIONS
// ================================================================

const cancelOrder = (order: Order) => {
  confirmOrder.value = order;
  confirmAction.value = 'Cancel Order';
  confirmIcon.value = '🗑️';
  confirmTitle.value = 'Cancel Order';
  confirmWarning.value = 'This action will cancel the order and cannot be undone.';
  showConfirmModal.value = true;
};

const restoreOrder = (order: Order) => {
  confirmOrder.value = order;
  confirmAction.value = 'Restore to Draft';
  confirmIcon.value = '↩️';
  confirmTitle.value = 'Restore Order to Draft';
  confirmWarning.value = 'This will restore the cancelled order back to Draft status so you can edit and resend it.';
  showConfirmModal.value = true;
};

const closeConfirmModal = () => {
  showConfirmModal.value = false;
  confirmOrder.value = null;
  confirmProcessing.value = false;
};

const confirmActionExecute = async () => {
  if (!confirmOrder.value) return;

  confirmProcessing.value = true;

  try {
    const order = confirmOrder.value;
    const action = confirmAction.value;
    let response;

    switch (action) {
      case 'Cancel Order':
        response = await orderService.cancelOrder(order.id);
        if (response && response.success) {
          order.status = 'cancelled';
          order.cancelledAt = new Date().toISOString();
          order.cancelledBy = authStore.user?.fullName || authStore.user?.username || 'Sales Person';
          showToastMessage(`Order ${order.orderNumber} cancelled.`, 'warning');
        }
        break;
      case 'Restore to Draft':
        response = await orderService.restoreOrder(order.id);
        if (response && response.success) {
          order.status = 'draft';
          delete order.cancelledAt;
          delete order.cancelledBy;
          (order as any).restoredFromCancelled = true;
          (order as any).restoredAt = new Date().toISOString();
          showToastMessage(`Order ${order.orderNumber} restored to Draft!`, 'success');
        }
        break;
    }

    if (response && response.success) {
      const index = orders.value.findIndex(o => o.id === order.id);
      if (index !== -1) {
        orders.value[index] = { ...order };
      }
      closeConfirmModal();
      loadOrders();
    } else if (response) {
      showToastMessage(response.message || 'Failed to process action', 'error');
    }
  } catch (error: any) {
    console.error('Error processing action:', error);
    showToastMessage(error.message || 'Failed to process action', 'error');
  } finally {
    confirmProcessing.value = false;
  }
};

const printOrder = (order: Order) => {
  showToastMessage(`Printing order ${order.orderNumber}...`, 'info');
  setTimeout(() => { window.print(); }, 500);
};

const exportOrders = () => {
  const data = filteredOrders.value.map(order => ({
    'Order #': order.orderNumber,
    'Product': order.productName,
    'Type': order.productType,
    'FG Code': order.fgCode,
    'Packaging': order.packaging,
    'Quantity': order.quantity,
    'UOM': order.uom,
    'Sales Person': order.salesPersonName || '',
    'Store': order.storeName || '',
    'Priority': order.priority,
    'Status': order.status,
    'Created Date': order.createdDate,
    'Due Date': order.dueDate,
    'Rejection Reason': order.rejectionReason || '',
  }));

  const headers = Object.keys(data[0] || {});
  const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h as keyof typeof row]).join(','))].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToastMessage('Orders exported successfully!', 'success');
};

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  const user = authStore.user;
  if (user) {
    const userData = user as any;
    userIsAdmin.value = userData.isAdmin || user.role === 'admin' || user.role === 'Admin';
    currentUserId.value = userData.userId || null;
  }

  loading.value = true;
  try {
    await Promise.all([
      loadProducts(),
      loadUOMs(),
      loadStores(),
      loadOrders()
    ]);
  } catch (error) {
    console.error('Error initializing orders page:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ================================================================ */
/* SECTION CARD */
/* ================================================================ */
.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.header-title h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
  white-space: nowrap;
}

.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
  white-space: nowrap;
}

.status-badge {
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.draft-badge { background: #f1f5f9; color: #475569; }
.sent-badge { background: #dbeafe; color: #1e40af; }
.accepted-badge { background: #dcfce7; color: #166534; }
.completed-badge { background: #a7f3d0; color: #065f46; }

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 8px 12px 8px 32px;
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
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.btn-add {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-add:hover {
  background: #2563eb;
}

/* ================================================================ */
/* FILTER BAR */
/* ================================================================ */
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

.btn-clear-filters {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
}
.btn-clear-filters:hover {
  background: #e2e8f0;
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  margin-left: auto;
}
.btn-export:hover {
  background: #059669;
}

/* ================================================================ */
/* STATS */
/* ================================================================ */
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.stat-item {
  background: #f8fafc;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 100px;
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.draft-value { color: #64748b; }
.sent-value { color: #3b82f6; }
.accepted-value { color: #22c55e; }
.completed-value { color: #059669; }

/* ================================================================ */
/* LOADING STATE */
/* ================================================================ */
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

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-wrapper {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 1000px;
}

.orders-table th,
.orders-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.orders-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.text-center { text-align: center; }

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.expand-btn:hover {
  background: #e0e7ff;
}

.expanded-row {
  background: #f8fafc;
}

.priority-high { border-left: 3px solid #ef4444; }
.priority-medium { border-left: 3px solid #f59e0b; }
.priority-low { border-left: 3px solid #22c55e; }
.status-rejected { background: #fef2f2; }
.status-cancelled { background: #f1f5f9; }

.order-code {
  font-weight: 600;
  color: #0f172a;
  font-family: monospace;
  font-size: 12px;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.product-name {
  font-weight: 500;
  color: #1e293b;
}
.product-type {
  font-size: 10px;
  color: #94a3b8;
}

.packaging-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  background: #ede9fe;
  color: #6d28d9;
}

.quantity-info {
  display: flex;
  align-items: center;
  gap: 4px;
}
.quantity-value {
  font-weight: 600;
  color: #1e293b;
}
.quantity-uom {
  font-size: 11px;
  color: #94a3b8;
}

/* ================================================================ */
/* PRIORITY BADGE */
/* ================================================================ */
.priority-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}
.priority-badge.high {
  background: #fee2e2;
  color: #991b1b;
}
.priority-badge.medium {
  background: #fef3c7;
  color: #92400e;
}
.priority-badge.low {
  background: #dcfce7;
  color: #166534;
}

/* ================================================================ */
/* STATUS BADGE */
/* ================================================================ */
.status-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.draft {
  background: #f1f5f9;
  color: #475569;
}
.status-badge.sent {
  background: #dbeafe;
  color: #1e40af;
}
.status-badge.accepted {
  background: #dcfce7;
  color: #166534;
}
.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}
.status-badge.completed {
  background: #a7f3d0;
  color: #065f46;
}
.status-badge.cancelled {
  background: #f1f5f9;
  color: #64748b;
}

/* ================================================================ */
/* REJECTION INDICATOR */
/* ================================================================ */
.rejection-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 10px;
  color: #991b1b;
}
.rejection-icon {
  font-size: 10px;
}
.rejection-short {
  color: #dc2626;
  font-style: italic;
}

/* ================================================================ */
/* REJECTION / CANCELLED CARDS */
/* ================================================================ */
.rejection-card {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
}

.accepted-card {
  border-left: 4px solid #22c55e;
  background: #f0fdf4;
}

.completed-card {
  border-left: 4px solid #059669;
  background: #ecfdf5;
}

.cancelled-card {
  border-left: 4px solid #94a3b8;
  background: #f8fafc;
}

.badge-production {
  font-size: 10px;
  font-weight: 400;
  background: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.rejection-reason-display {
  padding: 8px 0;
}

.rejection-reason-text {
  background: white;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 14px;
  line-height: 1.6;
}

.rejection-reason-meta,
.accepted-meta,
.completed-meta,
.cancelled-meta {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.rejection-action-note,
.cancelled-action-note {
  margin-top: 10px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
}

/* ================================================================ */
/* EDIT NOTICES */
/* ================================================================ */
.notice-box {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.notice-box.warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.notice-box.info {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.notice-icon {
  font-size: 20px;
}

.notice-text {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #475569;
}

.rejection-reference,
.cancellation-reference {
  margin-top: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
}

.rejection-reference p,
.cancellation-reference p {
  margin: 4px 0 0 0;
  color: #991b1b;
}

/* ================================================================ */
/* STATUS HISTORY TIMELINE */
/* ================================================================ */
.status-history-card {
  background: #fafbfc;
}

.status-timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.timeline-item.completed {
  color: #1e293b;
}

.timeline-item.rejected {
  color: #991b1b;
  background: #fef2f2;
}

.timeline-item.cancelled {
  color: #64748b;
  background: #f1f5f9;
}

.timeline-item.restored {
  color: #065f46;
  background: #dcfce7;
}

.timeline-dot {
  font-size: 12px;
  color: #3b82f6;
}

.timeline-item.rejected .timeline-dot {
  color: #ef4444;
}

.timeline-item.cancelled .timeline-dot {
  color: #94a3b8;
}

.timeline-item.restored .timeline-dot {
  color: #22c55e;
}

.timeline-status {
  font-weight: 500;
  min-width: 120px;
}

.timeline-date {
  color: #64748b;
  font-size: 12px;
}

.timeline-by {
  color: #94a3b8;
  font-size: 11px;
  font-style: italic;
}

/* ================================================================ */
/* ACTION BUTTONS */
/* ================================================================ */
.action-buttons {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-wrap: wrap;
}

.action-btn {
  background: transparent;
  border: none;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.action-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.action-btn.edit { color: #f59e0b; }
.action-btn.edit:hover { background: #fef3c7; }
.action-btn.send { color: #3b82f6; }
.action-btn.send:hover { background: #dbeafe; }
.action-btn.restore { color: #22c55e; }
.action-btn.restore:hover { background: #dcfce7; }
.action-btn.cancel { color: #64748b; }
.action-btn.cancel:hover { background: #f1f5f9; }

.view-only-badge {
  font-size: 11px;
  color: #94a3b8;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 12px;
}

/* ================================================================ */
/* EXPAND DETAILS */
/* ================================================================ */
.detail-expand-row td {
  padding: 0 !important;
}

.expand-details {
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row-three-cols {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
}

.detail-card.full-width {
  grid-column: 1 / -1;
}

.detail-card h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 10px;
  color: #1e293b;
}

.detail-card > div {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 12px;
}
.detail-card > div:last-child {
  border-bottom: none;
}

.detail-card .value {
  font-weight: 500;
  color: #1e293b;
}

/* Items Detail Table */
.items-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.items-detail-table th {
  background: #e2e8f0;
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
}
.items-detail-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f5f9;
}
.items-detail-table .total-row {
  background: #f8fafc;
  font-weight: 500;
}
.items-detail-table .no-items {
  padding: 20px;
  color: #94a3b8;
}
.text-right { text-align: right; }

.notes-content {
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #1e293b;
  min-height: 40px;
}
.no-notes {
  color: #94a3b8;
  font-style: italic;
  padding: 8px 12px;
}

/* Detail Actions */
.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.btn-edit-detail,
.btn-send-detail,
.btn-restore-detail,
.btn-cancel-detail,
.btn-print-detail {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.btn-edit-detail { background: #fef3c7; color: #92400e; }
.btn-edit-detail:hover { background: #fde68a; }

.btn-send-detail { background: #dbeafe; color: #1e40af; }
.btn-send-detail:hover { background: #bfdbfe; }

.btn-restore-detail { background: #dcfce7; color: #166534; }
.btn-restore-detail:hover { background: #bbf7d0; }

.btn-cancel-detail { background: #f1f5f9; color: #64748b; }
.btn-cancel-detail:hover { background: #e2e8f0; }

.btn-print-detail { background: #e2e8f0; color: #475569; }
.btn-print-detail:hover { background: #cbd5e1; }

.readonly-badge {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: 500;
}

/* ================================================================ */
/* EMPTY STATE */
/* ================================================================ */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}
.empty-state p {
  color: #94a3b8;
  font-size: 16px;
  margin: 0;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: #e2e8f0;
}

/* ================================================================ */
/* PAGINATION */
/* ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.page-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 16px;
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
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}

/* ================================================================ */
/* SEND MODAL */
/* ================================================================ */
.send-modal .modal-container {
  max-width: 500px;
}

.hint-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.store-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}
.store-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-primary {
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
.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================ */
/* MODALS */
/* ================================================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}
.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  line-height: 1;
}
.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.full-width {
  grid-column: 1 / -1;
}

.side-by-side {
  display: flex;
  gap: 16px;
  width: 100%;
}
.side-field {
  flex: 1;
}
.side-field label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  display: block;
  margin-bottom: 4px;
}
.side-field input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}
.side-field input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Confirm Modal */
.confirm-modal .modal-container {
  max-width: 450px;
}
.confirmation-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
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
.warning-text {
  color: #f59e0b;
  font-weight: 500;
  text-align: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border-radius: 6px;
  border: 1px solid #fef3c7;
  font-size: 13px;
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
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 8px 20px;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background: #cbd5e1;
}

.btn-save {
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
.btn-save:hover:not(:disabled) {
  background: #2563eb;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
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
.toast.info { background: #3b82f6; }
.toast.warning { background: #f59e0b; }

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 1024px) {
  .detail-row-three-cols {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .section-card {
    padding: 12px;
  }
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-title {
    justify-content: space-between;
    width: 100%;
  }
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  .search-box {
    width: 100%;
  }
  .search-box input {
    width: 100%;
  }
  .btn-add {
    width: 100%;
    justify-content: center;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-export {
    margin-left: 0;
  }
  .stats-row {
    flex-wrap: wrap;
  }
  .stat-item {
    min-width: calc(50% - 6px);
    flex: 1 0 calc(50% - 6px);
  }
  .detail-row-three-cols {
    grid-template-columns: 1fr;
  }
  .modal-container {
    width: 98%;
    max-height: 95vh;
  }
  .modal-body {
    padding: 16px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .side-by-side {
    flex-direction: column;
    gap: 12px;
  }
  .orders-table {
    font-size: 11px;
    min-width: 800px;
  }
  .detail-actions {
    flex-direction: column;
  }
  .detail-actions button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .orders-table {
    min-width: 700px;
  }
  .orders-table th,
  .orders-table td {
    padding: 4px 6px;
  }
  .stat-item {
    min-width: 100%;
    flex: 1;
  }
  .pagination {
    gap: 8px;
  }
  .page-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
  .toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    font-size: 13px;
    padding: 10px 16px;
  }
}

/* ================================================================ */
/* PRINT STYLES */
/* ================================================================ */
@media print {
  .btn-add,
  .btn-export,
  .btn-clear-filters,
  .action-btn,
  .pagination,
  .filter-bar,
  .header-actions .search-box,
  .expand-btn,
  .detail-actions {
    display: none !important;
  }
  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }
  .orders-table {
    font-size: 10px !important;
    min-width: auto !important;
  }
  .orders-table th {
    background: #e2e8f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .status-badge,
  .priority-badge {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .modal-overlay {
    display: none !important;
  }
  .toast {
    display: none !important;
  }
  .expand-details {
    border: none !important;
    padding: 4px 0 !important;
    margin: 0 !important;
  }
  .detail-expand-row td {
    padding: 0 !important;
  }
}
</style>