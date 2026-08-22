<!-- views/storemanagement/itemrequests/itemrequests.vue -->

<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>📦 Item Requests</h2>
        <span class="total-badge">{{ totalItems }} Requests</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by item, store, or requester..."
            @input="onSearchChange"
          />
        </div>
        <button 
          v-if="userIsAdmin || userIsAskingStore" 
          class="btn-add" 
          @click="openCreateModal"
        >
          ➕ New Request
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
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="finalized">Finalized</option>
      </select>
      
      <select
        v-if="userIsAdmin"
        v-model="filterStore"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="all">All Stores</option>
        <option
          v-for="store in activeStores"
          :key="store.storeId || store.id"
          :value="String(store.storeId || store.id)"
        >
          {{ store.name }}
        </option>
      </select>
      
      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>
      <div class="filter-actions">
        <button class="btn-export" @click="openExportModal">📊 Export</button>
      </div>
    </div>

    <!-- ==================== REQUESTS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading requests...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="requests-table">
        <thead>
          <tr>
            <th class="col-expand"></th>
            <th class="col-code">Request Code</th>
            <th class="col-items">Items</th>
            <th class="col-store">Asking Store</th>
            <th class="col-arrow"></th>
            <th class="col-store">Supplying Store</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedRequests.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📦</span>
                <p>No requests found</p>
                <button
                  v-if="canCreateRequests"
                  class="btn-secondary"
                  @click="openCreateModal"
                >
                  Create First Request
                </button>
              </div>
            </td>
          </tr>
          <template
            v-for="req in paginatedRequests"
            :key="req.requestId || req.id"
          >
            <tr
              v-if="shouldShowRequest(req)"
              :class="{
                'expanded-row': expandedRow === (req.requestId || req.id),
              }"
            >
              <td class="text-center">
                <button
                  class="expand-btn"
                  @click="toggleExpand(req.requestId || req.id)"
                >
                  {{ expandedRow === (req.requestId || req.id) ? "▼" : "▶" }}
                </button>
              </td>
              <td class="code-cell">{{ req.requestCode || req.id }}</td>
              <td>
                <div class="items-summary">
                  <span class="item-count"
                    >{{ req.items?.length || 0 }} item(s)</span
                  >
                  <span class="item-names">{{ getItemNames(req.items) }}</span>
                </div>
              </td>
              <td class="store-name">{{ getStoreName(req.askingStoreId) }}</td>
              <td class="arrow-cell">➡️</td>
              <td class="store-name">
                {{ getStoreName(req.supplyingStoreId) }}
              </td>
              <!-- Status Column with Group/Department Indicators -->
              <td>
                <span :class="['status-badge', req.status]">
                  {{ req.status }}
                </span>
                <div v-if="req.status === 'pending'" class="notification-status">
                  <div 
                    v-for="notification in (req.notifications || [])" 
                    :key="notification.id"
                    class="notification-item-wrapper"
                    :title="getNotificationTooltip(notification)"
                  >
                    <span 
                      :class="[
                        'notification-dot', 
                        notification.status,
                        notification.approval_type === 'department' ? 'dept-dot' : 'group-dot'
                      ]"
                    ></span>
                    <span class="notification-type-label">
                      {{ notification.approval_type === 'department' ? 'D' : 'G' }}
                    </span>
                  </div>
                  <span class="notification-text">{{ getAcceptanceSummary(req) }}</span>
                </div>
                <div v-if="(req as any).isAsset" class="asset-badge">🔧 Asset</div>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="canPrintRequest(req) && userIsAskingStore"
                    class="icon-btn print-btn"
                    @click="printRequest(req)"
                    :disabled="!canPrintRequest(req)"
                    :title="getApproveTooltip(req)"
                  >
                    🖨️
                  </button>
                  
                  <button
                    v-if="canEditRequest(req) && userIsAskingStore"
                    class="icon-btn"
                    @click="editRequest(req)"
                    :title="canEditRequest(req) ? 'Edit' : 'Cannot edit this request'"
                  >
                    ✏️
                  </button>
                  
                  <button
                    v-if="canApproveRequest(req) && userIsAskingStore"
                    class="icon-btn"
                    @click="openStatusConfirmation(req, 'approved')"
                    :disabled="!canApproveRequest(req)"
                    :title="getApproveTooltip(req)"
                  >
                    ✅
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW ==================== -->
            <tr
              v-if="expandedRow === (req.requestId || req.id) && shouldShowRequest(req)"
              class="detail-expand-row"
            >
              <td colspan="8">
                <div class="expand-details">
                  <div class="detail-container">
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📋 Request Information</h4>
                        <div>
                          <span>Request Code</span
                          ><span class="value">{{
                            req.requestCode || req.id
                          }}</span>
                        </div>
                        <div>
                          <span>Status</span>
                          <span class="value">
                            <span :class="['status-badge', req.status]">{{
                              req.status
                            }}</span>
                          </span>
                        </div>
                        <div>
                          <span>Requested By</span
                          ><span class="value">{{
                            getRequesterName(req)
                          }}</span>
                        </div>
                        <div>
                          <span>Requested Date</span
                          ><span class="value">{{
                            formatDate(req.requestedDate)
                          }}</span>
                        </div>
                        <div>
                          <span>Created At</span
                          ><span class="value">{{
                            formatDateTime(req.createdAt)
                          }}</span>
                        </div>
                        <div v-if="req.updatedAt">
                          <span>Last Updated</span
                          ><span class="value">{{
                            formatDateTime(req.updatedAt)
                          }}</span>
                        </div>
                        <div v-if="(req as any).isAsset">
                          <span>🔧 Asset Request</span>
                          <span class="value">Yes</span>
                        </div>
                      </div>

                      <div class="detail-card">
                        <h4>🏪 Store Details</h4>
                        <div>
                          <span>Asking Store</span
                          ><span class="value">{{
                            getStoreName(req.askingStoreId)
                          }}</span>
                        </div>
                        <div>
                          <span>Asking Store Code</span
                          ><span class="value">{{
                            getStoreCode(req.askingStoreId)
                          }}</span>
                        </div>
                        <div>
                          <span>Supplying Store</span
                          ><span class="value">{{
                            getStoreName(req.supplyingStoreId)
                          }}</span>
                        </div>
                        <div>
                          <span>Supplying Store Code</span
                          ><span class="value">{{
                            getStoreCode(req.supplyingStoreId)
                          }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="detail-card full-width">
                      <h4>📦 Items Requested</h4>
                      <table class="items-detail-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item Name</th>
                            <th>Item Code</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>UOM</th>
                            <th>Quantity</th>
                            <th>Specification</th>
                            <th>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="!req.items || req.items.length === 0">
                            <td colspan="9" class="text-center no-items">
                              No items in this request
                            </td>
                          </tr>
                          <tr v-for="(item, index) in req.items" :key="index">
                            <td class="text-center">{{ index + 1 }}</td>
                            <td>{{ getItemName(item.itemId) }}</td>
                            <td>{{ getItemCode(item.itemId) }}</td>
                            <td>{{ getItemBrand(item.itemId) || "N/A" }}</td>
                            <td>{{ getItemModel(item.itemId) || "N/A" }}</td>
                            <td>{{ getItemUOM(item.itemId) || "N/A" }}</td>
                            <td class="text-center">{{ item.quantity }}</td>
                            <td class="spec-cell">
                              {{ getItemSpecification(item.itemId) || "N/A" }}
                            </td>
                            <td>{{ item.remark || "-" }}</td>
                          </tr>
                          <tr class="total-row">
                            <td colspan="8" class="text-right">
                              <strong>Total Items:</strong>
                            </td>
                            <td class="text-center">
                              <strong>{{ req.items?.length || 0 }}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div class="detail-card full-width">
                      <h4>📝 General Remark</h4>
                      <div v-if="req.remark" class="remark-content">
                        {{ req.remark }}
                      </div>
                      <div v-else class="no-remark">No remarks provided</div>
                    </div>

                    <div v-if="getRejectionReasons(req).length > 0" class="detail-card full-width rejection-card">
                      <h4>🚫 Rejection Reasons</h4>
                      <div 
                        v-for="(reason, idx) in getRejectionReasons(req)" 
                        :key="idx"
                        class="rejection-item"
                      >
                        <div class="rejection-header">
                          <span class="rejection-group">
                            <span class="rejection-icon">❌</span>
                            {{ reason.groupName }}
                          </span>
                          <span class="rejection-date">{{ formatDateTime(reason.respondedAt) }}</span>
                        </div>
                        <div class="rejection-reason-textarea">
                          <textarea
                            :value="reason.reason"
                            readonly
                            rows="3"
                            class="rejection-textarea-readonly"
                            placeholder="No reason provided"
                          ></textarea>
                        </div>
                        <div class="rejection-by">
                          <span class="rejection-by-icon">👤</span>
                          Rejected by: {{ reason.respondedBy }}
                        </div>
                      </div>
                    </div>

                    <div v-if="userIsAskingStore" class="detail-actions">
                      <button
                        v-if="canPrintRequest(req)"
                        class="btn-print-detail"
                        @click="printRequest(req)"
                        :disabled="!canPrintRequest(req)"
                      >
                        🖨️ Print Request
                      </button>
                      <button
                        v-if="canEditRequest(req)"
                        class="btn-edit-detail"
                        @click="editRequest(req)"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        v-if="canApproveRequest(req)"
                        class="btn-approve-detail"
                        @click="openStatusConfirmation(req, 'approved')"
                        :disabled="!canApproveRequest(req)"
                        :title="getApproveTooltip(req)"
                      >
                        ✅ Approve
                      </button>
                    </div>
                    
                    <div v-else class="detail-actions readonly-actions">
                      <span class="readonly-badge">📄 Read Only View</span>
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
    <div class="pagination" v-if="totalItems > 0">
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
      <div class="modal-container request-modal">
        <div class="modal-header">
          <h3>
            {{ editingRequest ? "✏️ Edit Request" : "➕ New Item Request" }}
          </h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div
            v-if="showValidationErrors && validationErrors.length > 0"
            class="validation-error-box"
          >
            <div class="validation-error-header">
              <span class="error-icon">❌</span>
              <span class="error-title">Request Validation Failed</span>
            </div>
            <div class="validation-error-message">{{ validationMessage }}</div>
            <div class="validation-error-list">
              <div
                v-for="(error, index) in validationErrors"
                :key="index"
                class="validation-error-item"
              >
                <div class="error-item-header">
                  <span class="error-item-icon">📦</span>
                  <span class="error-item-title">
                    <strong>{{ error.itemName || "Unknown Item" }}</strong>
                    <span v-if="error.itemCode" class="error-code"
                      >({{ error.itemCode }})</span
                    >
                    <span v-if="error.requestedQuantity" class="error-quantity">
                      Requested: {{ error.requestedQuantity }}
                    </span>
                  </span>
                </div>
                <div class="error-item-message">{{ error.message }}</div>
                <div
                  v-if="
                    error.groupsWithoutBalance &&
                    error.groupsWithoutBalance.length > 0
                  "
                  class="error-groups"
                >
                  <span class="groups-label">📋 Missing Groups:</span>
                  <span
                    v-for="(group, idx) in error.groupsWithoutBalance"
                    :key="idx"
                    class="group-tag"
                  >
                    {{ group.groupName }}
                  </span>
                </div>
                <div
                  v-if="error.balanceDetails && error.balanceDetails.length > 0"
                  class="error-balance-details"
                >
                  <span class="balance-label">📊 Balance Variation:</span>
                  <div class="balance-list">
                    <span
                      v-for="(detail, idx) in error.balanceDetails"
                      :key="idx"
                      class="balance-item"
                    >
                      {{ detail.groupName }}: {{ detail.balance }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="validation-actions">
              <button class="btn-secondary" @click="closeValidationErrors">
                ✕ Dismiss
              </button>
            </div>
          </div>

          <form
            @submit.prevent="saveRequest"
            class="request-form"
            v-show="!showValidationErrors"
          >
            <!-- ============================================================ -->
            <!-- STORE SELECTION -->
            <!-- ============================================================ -->
            <div class="form-row">
              <div class="form-group" v-if="userIsAdmin">
                <label>Asking Store (Source) *</label>
                <select
                  v-model="form.askingStoreId"
                  required
                  :disabled="!!userAssignedStoreId || !!editingRequest"
                >
                  <option value="">Select Store</option>
                  <option
                    v-for="store in activeStores"
                    :key="store.storeId || store.id"
                    :value="store.storeId || store.id"
                  >
                    {{ store.name }}
                  </option>
                </select>
                <span v-if="userAssignedStoreId" class="hint">
                  📌 Using your assigned store: {{ getUserAssignedStoreName() }}
                </span>
              </div>
              <div class="form-group">
                <label>Supplying Store (Target) *</label>
                <select v-model="form.supplyingStoreId" required>
                  <option value="">Select Store</option>
                  <option
                    v-for="store in filteredSupplyingStores"
                    :key="store.storeId || store.id"
                    :value="store.storeId || store.id"
                  >
                    {{ store.name }}
                  </option>
                </select>
                <span class="hint">Select the store that will supply the items</span>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- 🔥 IMPROVED ITEM SELECTION -->
            <!-- ============================================================ -->
            <div class="form-section-title">
              <span>📦 Items</span>
              <span class="selected-count" v-if="selectedItemsList.length > 0">
                {{ selectedItemsList.length }} selected
              </span>
            </div>

            <!-- Search -->
            <div class="item-search-area">
              <div class="item-search-wrapper">
                <span class="search-icon-small">🔍</span>
                <input
                  type="text"
                  v-model="itemSearchGlobal"
                  placeholder="Search items by code, name, brand, or model..."
                  class="item-global-search"
                  @input="itemCurrentPage = 1"
                />
              </div>
              <span class="item-count-badge">{{ filteredItemsList.length }} items</span>
            </div>

            <!-- Item Grid - Click whole card to toggle -->
            <div class="item-grid">
              <div
                v-for="itemOption in paginatedItemList"
                :key="itemOption.id"
                class="item-card"
                :class="{
                  'item-selected': isItemSelected(itemOption),
                }"
                @click="toggleItemSelection(itemOption)"
              >
                <div class="item-card-content">
                  <div class="item-card-info">
                    <div class="item-card-code">{{ itemOption.code }}</div>
                    <div class="item-card-name">
                      {{ itemOption.standardName || itemOption.name || "Unnamed" }}
                    </div>
                    <div class="item-card-details">
                      <span v-if="itemOption.brand" class="item-tag brand">{{ itemOption.brand }}</span>
                      <span v-if="itemOption.model" class="item-tag model">{{ itemOption.model }}</span>
                      <span class="item-tag uom">{{ itemOption.uom?.code || "N/A" }}</span>
                    </div>
                  </div>
                  <div class="item-card-actions" @click.stop>
                    <!-- Quantity controls (only show if selected) -->
                    <div v-if="isItemSelected(itemOption)" class="quantity-control">
                      <button 
                        type="button" 
                        class="qty-btn" 
                        @click="adjustQuantity(itemOption, -1)"
                        :disabled="getItemQuantity(itemOption) <= 1"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        :value="getItemQuantity(itemOption)"
                        @change="setItemQuantity(itemOption, $event)"
                        min="0.01"
                        step="0.01"
                        class="qty-input"
                      />
                      <button 
                        type="button" 
                        class="qty-btn" 
                        @click="adjustQuantity(itemOption, 1)"
                      >
                        +
                      </button>
                    </div>
                    <span v-else class="click-hint">Click to add</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Item Pagination -->
            <div class="item-pagination" v-if="filteredItemsList.length > itemPageSize">
              <button
                type="button"
                class="page-btn-small"
                :disabled="itemCurrentPage === 1"
                @click="itemCurrentPage--"
              >
                ←
              </button>
              <span class="page-info-small">
                {{ itemCurrentPage }} / {{ itemTotalPages }}
              </span>
              <button
                type="button"
                class="page-btn-small"
                :disabled="itemCurrentPage === itemTotalPages"
                @click="itemCurrentPage++"
              >
                →
              </button>
            </div>

            <!-- Selected Items Summary -->
            <div class="selected-items-summary" v-if="selectedItemsList.length > 0">
              <div class="selected-header">
                <span class="selected-title">✅ Selected Items ({{ selectedItemsList.length }})</span>
                <button type="button" class="btn-clear-all" @click="clearAllItems">
                  🗑️ Clear All
                </button>
              </div>
              <div class="selected-items-list">
                <div
                  v-for="item in selectedItemsList"
                  :key="item.itemId"
                  class="selected-item-chip"
                >
                  <span class="chip-code">{{ item.code }}</span>
                  <span class="chip-name">{{ item.name }}</span>
                  <span class="chip-qty">×{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="chip-remove"
                    @click="removeSelectedItem(item.itemId)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Item Remark -->
            <div class="form-row full-width" v-if="selectedItemsList.length > 0">
              <div class="form-group">
                <label>Item Remark (optional)</label>
                <textarea
                  v-model="form.itemRemark"
                  rows="2"
                  placeholder="Add a remark for all items..."
                  class="textarea-field"
                ></textarea>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- REQUEST DETAILS -->
            <!-- ============================================================ -->
            <div class="form-section-title">📋 Request Details</div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Requested By</label>
                <input
                  v-model="form.requestedBy"
                  type="text"
                  readonly
                  class="readonly-field"
                />
                <span class="hint">Auto-filled with current user</span>
              </div>
              <div class="form-group">
                <label>Requested Date *</label>
                <input v-model="form.requestedDate" type="date" required />
              </div>
            </div>

            <!-- 🔥 IS ASSET TOGGLE - NO DEPARTMENT SELECTION -->
            <div class="form-row full-width">
              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="form.isAsset" 
                  />
                  <span class="checkbox-text">🔧 This request contains ASSET items</span>
                </label>
                <span class="hint" v-if="form.isAsset">
                  📌 Department approval will be required (configured in system settings)
                </span>
                <span class="hint" v-else>
                  ℹ️ Toggle on if this request contains asset items that need department approval
                </span>
              </div>
            </div>

            <!-- Status info for editing -->
            <div class="form-row" v-if="editingRequest">
              <div class="form-group">
                <label>Status</label>
                <input
                  value="Pending (Reset on Edit)"
                  type="text"
                  readonly
                  class="status-info-field"
                />
                <span class="hint">Status is always reset to Pending when editing</span>
              </div>
              <div class="form-group">
                <!-- Empty for spacing -->
              </div>
            </div>

            <!-- General Remark -->
            <div class="form-row full-width">
              <div class="form-group">
                <label>General Remark</label>
                <textarea
                  v-model="form.remark"
                  rows="3"
                  placeholder="General notes or remarks..."
                  class="textarea-field"
                ></textarea>
                <span class="hint">This remark applies to the entire request</span>
              </div>
            </div>

            <!-- Form Errors -->
            <div v-if="formErrors.length > 0" class="form-errors">
              <div v-for="error in formErrors" :key="error" class="form-error">
                ⚠️ {{ error }}
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button
            v-show="!showValidationErrors"
            class="btn-primary"
            @click="saveRequest"
            :disabled="saving || !isFormValid"
          >
            {{ saving ? "Saving..." : editingRequest ? "Update" : "Create" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== STATUS CONFIRMATION MODAL ==================== -->
    <div
      v-if="showStatusModal"
      class="modal-overlay"
      @click.self="closeStatusModal"
    >
      <div class="modal-container status-modal">
        <div class="modal-header">
          <h3>⚠️ Confirm Status Change</h3>
          <button class="modal-close" @click="closeStatusModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">🔄</div>
          <p class="confirmation-title">Are you sure you want to change the status?</p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Request:</span>
              <span class="detail-value">{{
                statusTarget?.requestCode ||
                statusTarget?.id ||
                statusTarget?.requestId
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value"
                >{{ statusTarget?.items?.length || 0 }} item(s)</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">Current Status:</span>
              <span :class="['status-badge', statusTarget?.status]">
                {{ statusTarget?.status }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">New Status:</span>
              <span :class="['status-badge', statusAction]">
                {{ statusAction }}
              </span>
            </div>
          </div>
          <p class="warning-text">
            ⚠️ This action will change the request status to
            <strong>{{ statusAction }}</strong>.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStatusModal">Cancel</button>
          <button class="btn-primary" @click="confirmStatusChange">
            Confirm {{ statusAction }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT MODAL ==================== -->
    <div
      v-if="showExportModal"
      class="modal-overlay"
      @click.self="closeExportModal"
    >
      <div class="modal-container export-modal">
        <div class="modal-header">
          <h3>📊 Export Requests</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full
              Report (All Fields)
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" />
              Summary (Items, Stores, Status)
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeExportModal">Cancel</button>
          <button
            class="btn-primary"
            @click="exportSelectedReport"
            :disabled="exporting"
          >
            {{ exporting ? "Exporting..." : "Export" }}
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import itemRequestService from "@/stores/itemRequestService";
import type {
  ItemRequest,
  RequestItem,
  Store,
  Item,
} from "@/stores/itemRequestService";
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// ================================================================
// STATE
// ================================================================

const router = useRouter();
const authStore = useAuthStore();



dayjs.extend(utc)
dayjs.extend(timezone)



// Data
const stores = ref<Store[]>([]);
const items = ref<Item[]>([]);
const requests = ref<ItemRequest[]>([]);
const loading = ref(false);
const loadingStores = ref(false);
const loadingItems = ref(false);

// User data
const userAssignedStoreId = ref<number | null>(null);
const userAssignedStoreName = ref<string | null>(null);
const userIsAdmin = ref(false);
const userIsAskingStore = ref(false);

// Filters & Search
const searchQuery = ref("");
const filterStatus = ref("all");
const filterStore = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// Validation Errors
const validationErrors = ref<any[]>([]);
const validationMessage = ref<string>("");
const showValidationErrors = ref(false);

// Expand
const expandedRow = ref<number | null>(null);

// Modal states
const showModal = ref(false);
const editingRequest = ref<ItemRequest | null>(null);
const saving = ref(false);
const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref<"full" | "summary">("full");

// Status Confirmation Modal
const showStatusModal = ref(false);
const statusTarget = ref<ItemRequest | null>(null);
const statusAction = ref<"approved" | "finalized">("approved");

// ================================================================
// 🔥 IMPROVED ITEM SELECTION STATE
// ================================================================
const itemSearchGlobal = ref("");
const itemCurrentPage = ref(1);
const itemPageSize = ref(10);
const selectedItems = ref<Map<number, { itemId: number; code: string; name: string; quantity: number }>>(new Map());

// Form
const form = ref({
  askingStoreId: "",
  supplyingStoreId: "",
  items: [] as RequestItem[],
  requestedBy: "",
  requestedDate: "",
  status: "pending" as "pending" | "approved" | "rejected",
  remark: "",
  itemRemark: "",
  isAsset: false,
});

const formErrors = ref<string[]>([]);

// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// COMPUTED
// ================================================================

const activeStores = computed(() => {
  return stores.value.filter((store) => store.status === "Active");
});

const filteredSupplyingStores = computed(() => {
  let result = activeStores.value;
  if (form.value.askingStoreId) {
    result = result.filter(
      (store) =>
        (store.storeId || store.id) !== Number(form.value.askingStoreId),
    );
  }
  return result;
});

// 🔥 Item selection computed
const filteredItemsList = computed(() => {
  let list = items.value;
  const query = itemSearchGlobal.value.toLowerCase().trim();
  if (query) {
    list = list.filter(
      (item) =>
        item.code?.toLowerCase().includes(query) ||
        item.name?.toLowerCase().includes(query) ||
        item.standardName?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query),
    );
  }
  return list;
});

const itemTotalPages = computed(() => {
  return Math.ceil(filteredItemsList.value.length / itemPageSize.value) || 1;
});

const paginatedItemList = computed(() => {
  const start = (itemCurrentPage.value - 1) * itemPageSize.value;
  const end = start + itemPageSize.value;
  return filteredItemsList.value.slice(start, end);
});

const selectedItemsList = computed(() => {
  return Array.from(selectedItems.value.values());
});

const isFormValid = computed(() => {
  // Check if there are selected items
  if (selectedItemsList.value.length === 0) return false;
  
  // Check if all selected items have quantities > 0
  const allValid = selectedItemsList.value.every(item => item.quantity > 0);
  if (!allValid) return false;
  
  return !!(
    form.value.askingStoreId &&
    form.value.supplyingStoreId &&
    form.value.requestedBy &&
    form.value.requestedDate
  );
});

const hasActiveFilters = computed(() => {
  return (
    filterStatus.value !== "all" ||
    filterStore.value !== "all" ||
    searchQuery.value
  );
});

const paginatedRequests = computed(() => {
  return requests.value;
});

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value) || 1;
});

const canCreateRequests = computed(() => {
  if (userIsAdmin.value) return true;
  return !!userAssignedStoreId.value;
});

// ================================================================
// HELPER: Check if store is foreign/local purchase
// ================================================================
const SKIP_NOTIFICATION_STORES = ['STORE-006', 'STORE-007'];

const shouldSkipNotifications = (storeCode: string): boolean => {
  return SKIP_NOTIFICATION_STORES.includes(storeCode);
};

const isSkipStore = (req: ItemRequest): boolean => {
  const supplyingStore = stores.value.find(s => (s.storeId || s.id) === req.supplyingStoreId);
  return supplyingStore ? shouldSkipNotifications(supplyingStore.code) : false;
};

// ================================================================
// 🔥 ITEM SELECTION METHODS
// ================================================================

const getItemId = (itemOption: any): number => {
  const id = itemOption?.itemId || itemOption?.id;
  return id ? Number(id) : 0;
};

const isItemSelected = (itemOption: any): boolean => {
  const id = getItemId(itemOption);
  if (id === 0) return false;
  return selectedItems.value.has(id);
};

const getItemQuantity = (itemOption: any): number => {
  const id = getItemId(itemOption);
  if (id === 0) return 1;
  return selectedItems.value.get(id)?.quantity || 1;
};

const toggleItemSelection = (itemOption: any): void => {
  const id = getItemId(itemOption);
  if (id === 0) {
    showToastMessage('Invalid item selected', 'warning');
    return;
  }
  
  if (selectedItems.value.has(id)) {
    selectedItems.value.delete(id);
  } else {
    selectedItems.value.set(id, {
      itemId: id,
      code: itemOption.code,
      name: itemOption.standardName || itemOption.name || "Unknown",
      quantity: 1,
    });
  }
};

const adjustQuantity = (itemOption: any, delta: number): void => {
  const id = getItemId(itemOption);
  if (id === 0) return;
  
  const item = selectedItems.value.get(id);
  if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty < 1) return;
  selectedItems.value.set(id, { ...item, quantity: newQty });
};

const setItemQuantity = (itemOption: any, event: Event): void => {
  const id = getItemId(itemOption);
  if (id === 0) return;
  
  const input = event.target as HTMLInputElement;
  const value = parseFloat(input.value);
  const item = selectedItems.value.get(id);
  if (!item) return;
  if (isNaN(value) || value < 1) {
    showToastMessage("Quantity must be at least 1", "warning");
    return;
  }
  selectedItems.value.set(id, { ...item, quantity: value });
};

const removeSelectedItem = (itemId: number): void => {
  selectedItems.value.delete(itemId);
};

const clearAllItems = (): void => {
  if (selectedItemsList.value.length === 0) return;
  if (confirm("Are you sure you want to remove all items from this request?")) {
    selectedItems.value.clear();
  }
};

const syncSelectedItemsToForm = (): void => {
  const items = Array.from(selectedItems.value.values()).map(item => ({
    itemId: item.itemId,
    quantity: item.quantity,
    remark: form.value.itemRemark || "",
  }));
  form.value.items = items;
};

// ================================================================
// PERMISSION METHODS
// ================================================================

const isUserAskingStore = (req: ItemRequest): boolean => {
  if (!userAssignedStoreId.value) return false;
  return Number(req.askingStoreId) === userAssignedStoreId.value;
};

const isUserSupplyingStore = (req: ItemRequest): boolean => {
  if (!userAssignedStoreId.value) return false;
  return Number(req.supplyingStoreId) === userAssignedStoreId.value;
};

const canEditRequest = (req: ItemRequest): boolean => {
  if (!isUserAskingStore(req)) return false;
  if (req.status === 'rejected') return true;
  if (isSkipStore(req)) return req.status === 'pending';
  if (req.status === 'pending') {
    if (req.notifications && req.notifications.length > 0) {
      const allAccepted = req.notifications.every((n: { status: string; }) => n.status === 'accepted');
      return !allAccepted;
    }
    return true;
  }
  return false;
};

const canApproveRequest = (req: ItemRequest): boolean => {
  if (!isUserAskingStore(req)) return false;
  if (req.status !== 'pending') return false;
  if (isSkipStore(req)) return true;
  if (!req.notifications || req.notifications.length === 0) return false;
  const allAccepted = req.notifications.every((n: { status: string; }) => n.status === 'accepted');
  const hasRejection = req.notifications.some((n: { status: string; }) => n.status === 'rejected');
  return allAccepted && !hasRejection;
};

const canPrintRequest = (req: ItemRequest): boolean => {
  if (!isUserAskingStore(req)) return false;
  if (req.status !== 'pending') return false;
  if (isSkipStore(req)) return true;
  if (!req.notifications || req.notifications.length === 0) return false;
  const allAccepted = req.notifications.every((n: { status: string; }) => n.status === 'accepted');
  const hasRejection = req.notifications.some((n: { status: string; }) => n.status === 'rejected');
  return allAccepted && !hasRejection;
};

const getApproveTooltip = (req: ItemRequest): string => {
  if (req.status !== 'pending') return 'Request is not pending';
  if (isSkipStore(req)) return '📦 No acceptance required - Click to approve (Foreign/Local Purchase)';
  const hasRejection = req.notifications?.some((n: { status: string; }) => n.status === 'rejected') || false;
  if (hasRejection) return 'Some groups have rejected - Edit and resubmit';
  const allAccepted = req.notifications?.every((n: { status: string; }) => n.status === 'accepted') || false;
  if (!allAccepted) return 'Waiting for all groups to accept';
  return 'All groups accepted - Ready to proceed';
};

// ================================================================
// 🔥 ACCEPTANCE SUMMARY - FIXED
// ================================================================

const getAcceptanceSummary = (req: ItemRequest): string => {
  if (isSkipStore(req)) return '📦 No acceptance required';
  if (!req.notifications || req.notifications.length === 0) return 'No approvals';
  
  const total = req.notifications.length;
  const accepted = req.notifications.filter((n: { status: string; }) => n.status === 'accepted').length;
  const rejected = req.notifications.filter((n: { status: string; }) => n.status === 'rejected').length;
  const pending = req.notifications.filter((n: { status: string; }) => n.status === 'pending').length;
  
  // Check if there's a department notification
  const hasDepartment = req.notifications.some((n: any) => n.approval_type === 'department' || n.is_department_approval);
  const hasGroups = req.notifications.some((n: any) => n.approval_type === 'group' || !n.approval_type);
  
  let summary = '';
  
  if (rejected > 0) {
    summary = `❌ ${rejected} rejected`;
  } else if (accepted === total) {
    summary = `✅ All ${total} accepted`;
  } else {
    summary = `⏳ ${accepted}/${total} accepted`;
  }
  
  // Add type indicator
  if (hasDepartment && hasGroups) {
    summary += ' ';
  } else if (hasDepartment) {
    summary += ' ';
  }
  
  return summary;
};

// ================================================================
// 🔥 NOTIFICATION TOOLTIP - FIXED
// ================================================================

const getNotificationTooltip = (notification: any): string => {
  let name = '';
  let type = '';
  let responder = '';
  
  // 1️⃣ Get the name based on type
  if (notification.approval_type === 'department' || notification.is_department_approval) {
    type = 'Department';
    name = notification.department?.name || 'Unknown Department';
  } else {
    type = 'Group';
    name = notification.group?.name || 'Unknown Group';
  }
  
  // 2️⃣ Get responder from populated data
  if (notification.status === 'accepted' || notification.status === 'rejected') {
    const user = notification.respondedByUser;
    if (user) {
      responder = user.fullName || user.username || 'Unknown';
    }
  }
  
  // 3️⃣ Build tooltip
  let tooltip = `${type}: ${name}`;
  
  if (notification.status === 'accepted') {
    tooltip += `\n✅ Accepted`;
    if (responder) tooltip += `\n👤 ${responder}`;
  } else if (notification.status === 'rejected') {
    tooltip += `\n❌ Rejected`;
    if (responder) tooltip += `\n👤 ${responder}`;
    if (notification.rejected_reason) {
      tooltip += `\n📝 ${notification.rejected_reason}`;
    }
  } else {
    tooltip += `\n⏳ Pending`;
  }
  
  return tooltip;
};

// ================================================================
// REJECTION REASONS
// ================================================================

const getRejectionReasons = (req: ItemRequest): Array<{
  groupName: string;
  reason: string;
  respondedBy: string;
  respondedAt: string;
}> => {
  if (!req.notifications) return [];
  return req.notifications
    .filter((n: { status: string; }) => n.status === 'rejected')
    .map((n: any) => ({
      groupName: n.group?.name || `Group ${n.group_id}`,
      reason: n.rejected_reason || 'No reason provided',
      respondedBy: n.respondedByUser?.fullName || n.respondedByUser?.username || 'Unknown',
      respondedAt: n.responded_at,
    }));
};

const shouldShowRequest = (req: ItemRequest): boolean => {
  return true;
};

// ================================================================
// DATA LOADING METHODS
// ================================================================

const loadUserData = () => {
  const user = authStore.user;
  console.log('📌 loadUserData - user:', user);
  
  if (!user) {
    console.log('⚠️ No user found in auth store');
    return;
  }
  
  const userData = user as any;
  
  // Check admin
  userIsAdmin.value = userData.isAdmin || user.role === "admin" || user.role === "Admin";
  console.log('👑 userIsAdmin:', userIsAdmin.value);
  
  // ✅ Get store ID from userData directly
  let storeId = userData.storeId || null;
  let storeName = userData.storeName || null;
  
  console.log('🔍 userData.storeId:', storeId);
  console.log('🔍 userData.storeName:', storeName);
  
  // If storeId is null, try assignedStore
  if (!storeId && userData.assignedStore) {
    storeId = userData.assignedStore.id || userData.assignedStore.storeId || null;
    storeName = userData.assignedStore.name || null;
    console.log('🔍 assignedStore:', { storeId, storeName });
  }
  
  // If still null, try currentStore
  if (!storeId && userData.currentStore) {
    storeId = userData.currentStore.id || userData.currentStore.storeId || null;
    storeName = userData.currentStore.name || null;
    console.log('🔍 currentStore:', { storeId, storeName });
  }
  
  // If still null, try stores array
  if (!storeId && userData.stores && userData.stores.length > 0) {
    storeId = userData.stores[0].id || userData.stores[0].storeId || null;
    storeName = userData.stores[0].name || null;
    console.log('🔍 stores[0]:', { storeId, storeName });
  }
  
  console.log('📦 Final storeId:', storeId, 'storeName:', storeName);
  
  if (storeId) {
    userAssignedStoreId.value = storeId;
    userAssignedStoreName.value = storeName || 'Assigned Store';
    userIsAskingStore.value = true;
    console.log('✅ Store assigned successfully:', { 
      id: userAssignedStoreId.value, 
      name: userAssignedStoreName.value 
    });
  } else {
    userAssignedStoreId.value = null;
    userAssignedStoreName.value = null;
    userIsAskingStore.value = false;
    console.log('❌ No store ID found - user cannot create requests');
  }
  
  console.log('📋 Final userIsAskingStore:', userIsAskingStore.value);
};
const getUserAssignedStoreName = (): string => {
  return userAssignedStoreName.value || "No store assigned";
};

const loadStores = async () => {
  loadingStores.value = true;
  try {
    const response = await itemRequestService.getActiveStores();
    if (response.success) {
      stores.value = response.data;
    } else {
      showToastMessage(response.error || "Failed to load stores", "error");
    }
  } catch (error) {
    console.error("Load stores error:", error);
    showToastMessage("Failed to load stores", "error");
  } finally {
    loadingStores.value = false;
  }
};

const loadItems = async () => {
  loadingItems.value = true;
  try {
    const response = await itemRequestService.getActiveItems();
    if (response.success) {
      items.value = response.data;
    } else {
      showToastMessage(response.error || "Failed to load items", "error");
    }
  } catch (error) {
    console.error("Load items error:", error);
    showToastMessage("Failed to load items", "error");
  } finally {
    loadingItems.value = false;
  }
};

const loadRequests = async () => {
  loading.value = true;
  try {
    const filters: any = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
    };
    if (!userIsAdmin.value && userAssignedStoreId.value) {
      filters.storeId = userAssignedStoreId.value;
    }
    if (filterStatus.value !== "all") {
      filters.status = filterStatus.value;
    }
    if (filterStore.value !== "all") {
      filters.storeId = Number(filterStore.value);
    }
    const response = await itemRequestService.getRequests(filters);
    if (response.success) {
      requests.value = response.data.requests;
      totalItems.value = response.data.pagination.total;
    } else {
      showToastMessage(response.error || "Failed to load requests", "error");
    }
  } catch (error: any) {
    console.error("Load requests error:", error);
    showToastMessage("Failed to load requests", "error");
  } finally {
    loading.value = false;
  }
};

// ================================================================
// HELPER METHODS
// ================================================================

const getStoreName = (storeId: number): string => {
  const store = stores.value.find((s) => (s.storeId || s.id) === storeId);
  return store ? store.name : "Unknown Store";
};

const getStoreCode = (storeId: number): string => {
  const store = stores.value.find((s) => (s.storeId || s.id) === storeId);
  return store ? store.code : "N/A";
};

const getItemName = (itemId: number): string => {
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item ? item.name : "Unknown Item";
};

const getItemCode = (itemId: number): string => {
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item ? item.code : "N/A";
};

const getItemBrand = (itemId: number): string => {
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item?.brand || "";
};

const getItemModel = (itemId: number): string => {
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item?.model || "";
};

const getItemStandardName = (itemId: number): string => {
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item?.standardName || "";
};

const getItemUOM = (itemId: number): string => {
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  if (item?.uom) {
    if (typeof item.uom === "string") return item.uom;
    if (typeof item.uom === "object" && item.uom.code) return item.uom.code;
  }
  return "";
};

const getItemSpecification = (itemId: number): string => {
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item?.specText || "";
};

const getItemNames = (items: RequestItem[] | undefined): string => {
  if (!items || items.length === 0) return "";
  const names = items.map((i) => getItemName(Number(i.itemId)));
  return names.join(", ");
};

const getRequesterName = (req: ItemRequest): string => {
  if (req.requestedByUser) {
    return (
      req.requestedByUser.fullName ||
      req.requestedByUser.full_name ||
      req.requestedByUser.username ||
      "N/A"
    );
  }
  return req.requestedBy || "N/A";
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
// ✅ FIXED - Using UTC+6 (Based on your actual time)
const formatDateTime = (dateString: string | number | Date | dayjs.Dayjs | null | undefined) => {
  if (!dateString) return ''
  return dayjs.utc(dateString)
    .add(6, 'hour')  // ✅ Your system shows UTC+6
    .format('MMM D, YYYY h:mm A')
}

const formatDateShort = (dateString: string | number | Date | dayjs.Dayjs | null | undefined) => {
  if (!dateString) return ''
  return dayjs.utc(dateString)
    .add(6, 'hour')  // ✅ Your system shows UTC+6
    .format('MMM D, h:mm A')
}
const getCurrentUser = (): string => {
  return (
    authStore.user?.fullName ||
    authStore.user?.username ||
    authStore.user?.email ||
    "Unknown User"
  );
};

const getCurrentUserId = (): number | undefined => {
  return authStore.user?.userId;
};

const toggleExpand = (id?: number): void => {
  if (id === undefined || id === null) {
    expandedRow.value = null;
    return;
  }
  expandedRow.value = expandedRow.value === id ? null : id;
};

const closeValidationErrors = (): void => {
  showValidationErrors.value = false;
  validationErrors.value = [];
  validationMessage.value = "";
};

// ================================================================
// MODAL METHODS
// ================================================================

const openCreateModal = (): void => {
  editingRequest.value = null;
  const today: string = new Date().toISOString().split("T")[0] || "";
  closeValidationErrors();
  selectedItems.value.clear();
  itemSearchGlobal.value = "";
  itemCurrentPage.value = 1;
  
  const askingStoreId = userIsAdmin.value
    ? ""
    : String(userAssignedStoreId.value || "");
  
  form.value = {
    askingStoreId: askingStoreId,
    supplyingStoreId: "",
    items: [],
    requestedBy: getCurrentUser(),
    requestedDate: today,
    status: "pending",
    remark: "",
    itemRemark: "",
    isAsset: false,
  };
  
  formErrors.value = [];
  showModal.value = true;
};

const editRequest = (req: ItemRequest): void => {
  if (!isUserAskingStore(req)) {
    showToastMessage("You don't have permission to edit this request", "error");
    return;
  }
  
  if (req.status === 'rejected') {
    showToastMessage("📝 This request was rejected. Please fix the issues and resubmit.", "info");
  }
  
  editingRequest.value = req;
  const today: string = new Date().toISOString().split("T")[0] || "";
  const requestedDate: string = String(req.requestedDate || today);
  closeValidationErrors();
  
  // Populate selected items from request
  selectedItems.value.clear();
  if (req.items) {
    req.items.forEach((item: any) => {
      const itemId = Number(item.itemId || 0);
      const itemData = items.value.find(i => (i.itemId || i.id) === itemId);
      if (itemData && itemId > 0) {
        selectedItems.value.set(itemId, {
          itemId: itemId,
          code: itemData.code,
          name: itemData.standardName || itemData.name || "Unknown",
          quantity: item.quantity || 1,
        });
      }
    });
  }
  
  form.value = {
    askingStoreId: String(req.askingStoreId),
    supplyingStoreId: String(req.supplyingStoreId),
    items: req.items ? req.items.map((item: any) => ({
      ...item,
      itemId: Number((item as any).itemId || 0),
    })) : [],
    requestedBy: getRequesterName(req),
    requestedDate,
    status: "pending",
    remark: req.remark || "",
    itemRemark: "",
    isAsset: (req as any).isAsset || false,
  };
  
  itemSearchGlobal.value = "";
  itemCurrentPage.value = 1;
  formErrors.value = [];
  showModal.value = true;
};

const closeModal = (): void => {
  showModal.value = false;
  editingRequest.value = null;
  saving.value = false;
  selectedItems.value.clear();
  closeValidationErrors();
};

// ================================================================
// SAVE REQUEST
// ================================================================

const saveRequest = async (): Promise<void> => {
  closeValidationErrors();
  formErrors.value = [];

  // Sync selected items to form
  syncSelectedItemsToForm();

  // Validation checks
  if (!form.value.askingStoreId) {
    formErrors.value.push("Please select the asking store");
  }
  if (!form.value.supplyingStoreId) {
    formErrors.value.push("Please select the supplying store");
  }
  if (form.value.askingStoreId === form.value.supplyingStoreId) {
    formErrors.value.push("Asking store and supplying store cannot be the same");
  }
  if (form.value.items.length === 0) {
    formErrors.value.push("Please add at least one item");
  }

  // Check for duplicates
  const itemIds = form.value.items.map(item => item.itemId).filter(id => id && id !== 0);
  const duplicateIds = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
  
  if (duplicateIds.length > 0) {
    const duplicateItems = form.value.items.filter(item => 
      duplicateIds.includes(item.itemId)
    );
    
    duplicateItems.forEach(item => {
      const itemName = getItemName(Number(item.itemId)) || 'Unknown Item';
      formErrors.value.push(
        `⚠️ "${itemName}" (${getItemCode(Number(item.itemId))}) is already added to this request. Please remove the duplicate entry.`
      );
    });
    
    validationErrors.value = duplicateItems.map(item => ({
      itemId: item.itemId,
      itemName: getItemName(Number(item.itemId)) || 'Unknown Item',
      itemCode: getItemCode(Number(item.itemId)) || 'N/A',
      requestedQuantity: item.quantity,
      message: 'This item is already added to the request. Please remove the duplicate entry.'
    }));
    
    validationMessage.value = 'Duplicate items found in the request. Please fix the following issues:';
    showValidationErrors.value = true;
    saving.value = false;
    return;
  }

  form.value.items.forEach((item, index) => {
    if (!item.itemId) {
      formErrors.value.push(`Item #${index + 1}: Please select an item`);
    }
    if (!item.quantity || item.quantity <= 0) {
      formErrors.value.push(`Item #${index + 1}: Please enter a valid quantity`);
    }
  });

  if (!form.value.requestedDate) {
    formErrors.value.push("Please select a requested date");
  }

  if (formErrors.value.length > 0) {
    saving.value = false;
    return;
  }

  saving.value = true;
  
  try {
    const userId = getCurrentUserId();
    
    const requestData = {
      askingStoreId: Number(form.value.askingStoreId),
      supplyingStoreId: Number(form.value.supplyingStoreId),
      items: form.value.items.map((item) => ({
        itemId: Number(item.itemId),
        quantity: item.quantity,
        remark: item.remark || "",
      })),
      requestedById: userId,
      requestedDate: form.value.requestedDate,
      status: form.value.status as "pending" | "approved" | "rejected",
      remark: form.value.remark,
      isAsset: form.value.isAsset,
    };

    let response;
    
    if (editingRequest.value) {
      const requestId = editingRequest.value.requestId || editingRequest.value.id;
      
      try {
        response = await itemRequestService.updateRequest(
          requestId!,
          requestData
        );
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        showToastMessage(apiError.message || 'Failed to update request', 'error');
        saving.value = false;
        return;
      }
      
      if (!response) {
        showToastMessage('No response from server', 'error');
        saving.value = false;
        return;
      }
      
      if (response.success === true) {
        showToastMessage("✅ Request updated and resubmitted successfully!", "success");
        await loadRequests();
        closeModal();
        saving.value = false;
        return;
      } else {
        if (response.errors && response.errors.length > 0) {
          validationErrors.value = response.errors;
          validationMessage.value = response.message || "Validation failed. Please fix the issues below.";
          showValidationErrors.value = true;
          showToastMessage("Validation failed - please fix the issues below", "error");
        } else {
          const errorMsg = response.error || response.message || 'Failed to update request';
          showToastMessage(errorMsg, "error");
        }
        saving.value = false;
        return;
      }
    } else {
      try {
        response = await itemRequestService.createRequest(requestData);
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        showToastMessage(apiError.message || 'Failed to create request', 'error');
        saving.value = false;
        return;
      }
      
      if (!response) {
        showToastMessage('No response from server', 'error');
        saving.value = false;
        return;
      }
      
      if (response.success === true) {
        showToastMessage("✅ Request created successfully!", "success");
        await loadRequests();
        closeModal();
        saving.value = false;
        return;
      } else {
        if (response.errors && response.errors.length > 0) {
          validationErrors.value = response.errors;
          validationMessage.value = response.message || "The request cannot be created due to the following issues:";
          showValidationErrors.value = true;
          showToastMessage("Validation failed - please fix the issues below", "error");
        } else {
          const errorMsg = response.error || response.message || 'Failed to create request';
          showToastMessage(errorMsg, "error");
        }
        saving.value = false;
        return;
      }
    }
  } catch (error: any) {
    console.error("Save request error:", error);
    const errorData = error.response?.data;
    
    if (errorData && errorData.errors && errorData.errors.length > 0) {
      validationErrors.value = errorData.errors;
      validationMessage.value = errorData.message || "The request cannot be created due to the following issues:";
      showValidationErrors.value = true;
      showToastMessage("Validation failed - please fix the issues below", "error");
    } else {
      showToastMessage(error.message || "Failed to save request", "error");
    }
  } finally {
    saving.value = false;
  }
};

// ================================================================
// STATUS CONFIRMATION
// ================================================================

const openStatusConfirmation = (req: ItemRequest, action: "approved" | "finalized"): void => {
  statusTarget.value = req;
  statusAction.value = action;
  showStatusModal.value = true;
};

const closeStatusModal = (): void => {
  showStatusModal.value = false;
  statusTarget.value = null;
  statusAction.value = "approved";
};

const confirmStatusChange = async (): Promise<void> => {
  if (!statusTarget.value) return;
  const req = statusTarget.value;
  const action = statusAction.value;
  const requestId = req.requestId || req.id;
  try {
    const response = await itemRequestService.updateStatus(requestId!, action);
    if (response.success) {
      showToastMessage(`Request ${action} successfully!`, "success");
      await loadRequests();
    } else {
      showToastMessage(response.error || `Failed to ${action} request`, "error");
    }
    closeStatusModal();
  } catch (error: any) {
    showToastMessage(error.message || `Failed to ${action} request`, "error");
  }
};

const printRequest = (req: ItemRequest): void => {
  const requestId = req.requestId || req.id;
  router.push({
    name: "print-requests",
    query: { id: String(requestId) },
  });
};

// ================================================================
// FILTERS & PAGINATION
// ================================================================

const onSearchChange = (): void => {
  currentPage.value = 1;
  loadRequests();
};

const onFilterChange = (): void => {
  currentPage.value = 1;
  loadRequests();
};

const clearFilters = (): void => {
  filterStatus.value = "all";
  filterStore.value = "all";
  searchQuery.value = "";
  currentPage.value = 1;
  showToastMessage("Filters cleared", "info");
  loadRequests();
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const changePageSize = (): void => {
  currentPage.value = 1;
};

// ================================================================
// EXPORT
// ================================================================

const openExportModal = (): void => {
  exportType.value = "full";
  showExportModal.value = true;
};

const closeExportModal = (): void => {
  showExportModal.value = false;
};

const exportSelectedReport = async (): Promise<void> => {
  exporting.value = true;
  try {
    const response = await itemRequestService.exportRequests({
      status: filterStatus.value === "all" ? undefined : (filterStatus.value as any),
      storeId: filterStore.value === "all" ? undefined : Number(filterStore.value),
    });
    if (response.success && response.data.length > 0) {
      const firstRow = response.data[0] as Record<string, any>;
      const headers = Object.keys(firstRow);
      const rows = response.data.map((item: any) =>
        headers.map((key: string) => item[key] ?? ""),
      );
      const csv = [
        headers.join(","),
        ...rows.map((row: any[]) => row.join(",")),
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `item_requests_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToastMessage("Export completed successfully!", "success");
    } else {
      showToastMessage(response.error || "No data to export", "error");
    }
  } catch (error: any) {
    console.error("Export error:", error);
    showToastMessage(error.message || "Failed to export", "error");
  } finally {
    exporting.value = false;
    closeExportModal();
  }
};

const showToastMessage = (
  msg: string,
  type: "success" | "error" | "info" | "warning" = "success",
): void => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// WATCHERS
// ================================================================

watch([filterStatus, filterStore, searchQuery], () => {
  currentPage.value = 1;
  loadRequests();
});

watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    loadRequests();
  }
});

watch(pageSize, () => {
  currentPage.value = 1;
  loadRequests();
});

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  loadUserData();
  await Promise.all([loadStores(), loadItems(), loadRequests()]);
});
</script>

<style scoped>
/* ================================================================
   NOTIFICATION STATUS STYLES - WITH GROUP/DEPT TYPES
   ================================================================ */
.notification-status {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.notification-item-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  margin-right: 2px;
  cursor: help;
}

.notification-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0,0,0,0.1);
}

.notification-dot.pending {
  background: #f59e0b;
}

.notification-dot.accepted {
  background: #10b981;
}

.notification-dot.rejected {
  background: #ef4444;
}

.notification-dot.group-dot {
  border-radius: 50%;
}

.notification-dot.dept-dot {
  border-radius: 2px;
  transform: rotate(45deg);
  width: 8px;
  height: 8px;
  margin: 1px;
}

.notification-type-label {
  font-size: 7px;
  font-weight: 700;
  color: #64748b;
  margin-right: 2px;
}

.notification-text {
  font-size: 9px;
  color: #64748b;
  margin-left: 2px;
}

.asset-badge {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  font-size: 9px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 10px;
  margin-top: 2px;
}

/* ================================================================
   VALIDATION ERROR BOX
   ================================================================ */
.validation-error-box {
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.validation-error-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.validation-error-header .error-icon {
  font-size: 20px;
}

.validation-error-header .error-title {
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
}

.validation-error-message {
  color: #7f1d1d;
  font-size: 14px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
}

.validation-error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  max-height: 350px;
  overflow-y: auto;
}

.validation-error-item {
  background: white;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
}

.error-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.error-item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.error-item-title {
  font-size: 14px;
  color: #1e293b;
}

.error-code {
  color: #64748b;
  font-weight: normal;
  margin-left: 4px;
}

.error-quantity {
  font-size: 12px;
  color: #64748b;
  margin-left: 8px;
  font-weight: normal;
}

.error-item-message {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 6px;
  padding-left: 28px;
}

.error-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding-left: 28px;
  margin-top: 4px;
}

.groups-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.group-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.error-balance-details {
  padding-left: 28px;
  margin-top: 4px;
}

.balance-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  display: block;
  margin-bottom: 4px;
}

.balance-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.balance-item {
  display: inline-block;
  padding: 2px 10px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.validation-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

/* ================================================================
   SECTION CARD
   ================================================================ */
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
  gap: 16px;
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
  width: 220px;
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

/* ================================================================
   FILTER BAR
   ================================================================ */
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

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
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
}

.btn-export:hover {
  background: #059669;
}

/* ================================================================
   READONLY INDICATORS
   ================================================================ */
.readonly-indicator {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.readonly-actions {
  justify-content: center;
  padding: 8px 0;
}

.readonly-badge {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 16px;
  border-radius: 20px;
  font-weight: 500;
}

/* ================================================================
   LOADING STATE
   ================================================================ */
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
  to {
    transform: rotate(360deg);
  }
}

/* ================================================================
   TABLE WRAPPER
   ================================================================ */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
}

/* ================================================================
   TABLE
   ================================================================ */
.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 900px;
}

.requests-table th,
.requests-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.requests-table th {
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

.col-expand {
  width: 30px;
}
.col-code {
  min-width: 100px;
}
.col-items {
  min-width: 150px;
}
.col-store {
  min-width: 120px;
}
.col-arrow {
  width: 30px;
  text-align: center;
}
.col-status {
  min-width: 90px;
}
.col-actions {
  min-width: 200px;
}

.text-center {
  text-align: center;
}

.code-cell {
  font-weight: 600;
  color: #0f172a;
  font-family: "Courier New", monospace;
  font-size: 11px;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.items-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-count {
  font-weight: 500;
  color: #1e293b;
}

.item-names {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.store-name {
  font-weight: 500;
  color: #1e293b;
}

.arrow-cell {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  padding: 0 4px;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.finalized {
  background: #dcfce7;
  color: #166534;
}

/* ================================================================
   REJECTION REASONS - TEXT AREA STYLES
   ================================================================ */
.rejection-card {
  border-left: 4px solid #ef4444;
  background: #fafafa;
}

.rejection-item {
  padding: 14px 18px;
  margin-bottom: 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #fecaca;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.05);
  transition: all 0.2s;
}

.rejection-item:last-child {
  margin-bottom: 0;
}

.rejection-item:hover {
  border-color: #f87171;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}

.rejection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.rejection-group {
  font-weight: 600;
  color: #dc2626;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rejection-icon {
  font-size: 16px;
}

.rejection-date {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 12px;
}

.rejection-reason-textarea {
  margin: 4px 0 6px 0;
}

.rejection-textarea-readonly {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  cursor: default;
  line-height: 1.6;
  transition: all 0.2s;
}

.rejection-textarea-readonly:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.rejection-textarea-readonly::-webkit-scrollbar {
  width: 4px;
}

.rejection-textarea-readonly::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.rejection-textarea-readonly::-webkit-scrollbar-thumb {
  background: #f87171;
  border-radius: 2px;
}

.rejection-by {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #fecaca;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rejection-by-icon {
  font-size: 14px;
}

/* ================================================================
   EXPAND ROW
   ================================================================ */
.expanded-row {
  background: #f8fafc;
}

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

/* ================================================================
   ACTION BUTTONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-wrap: wrap;
}

.icon-btn {
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

.icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.icon-btn:active {
  transform: scale(0.95);
}

.print-btn {
  color: #8b5cf6;
}

.print-btn:hover {
  background: #ede9fe;
  color: #7c3aed;
}

/* ================================================================
   EXPAND DETAILS
   ================================================================ */
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

.detail-row-two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.spec-cell {
  font-size: 11px;
  color: #475569;
  max-width: 200px;
  white-space: normal;
  word-wrap: break-word;
}

.remark-content {
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #1e293b;
  min-height: 40px;
}

.no-remark {
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

.btn-print-detail {
  background: #8b5cf6;
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
}

.btn-print-detail:hover {
  background: #7c3aed;
}

.btn-edit-detail {
  background: #3b82f6;
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
}

.btn-edit-detail:hover {
  background: #2563eb;
}

.btn-approve-detail {
  background: #22c55e;
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
}

.btn-approve-detail:hover {
  background: #16a34a;
}

.btn-finalize-detail {
  background: #8b5cf6;
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
}

.btn-finalize-detail:hover {
  background: #7c3aed;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
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

/* ================================================================
   PAGINATION
   ================================================================ */
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

/* ================================================================
   MODALS
   ================================================================ */
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 900px;
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

/* ================================================================
   REQUEST FORM
   ================================================================ */
.request-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  padding: 8px 0;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  background: #f1f5f9;
  padding: 2px 12px;
  border-radius: 12px;
}

/* ================================================================
   FORM ROW
   ================================================================ */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row.full-width {
  grid-template-columns: 1fr;
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

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  background: white;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:read-only,
.form-group textarea:read-only {
  background: #f8fafc;
  color: #64748b;
}

.readonly-field {
  background: #f8fafc !important;
  color: #475569 !important;
  cursor: not-allowed;
}

.status-info-field {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border: 1px solid #bbf7d0 !important;
  font-weight: 500;
  cursor: not-allowed;
}

.hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.textarea-field {
  resize: vertical;
  min-height: 60px;
}

.form-errors {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fecaca;
}

/* ================================================================
   🔥 IMPROVED ITEM SELECTION STYLES
   ================================================================ */

.item-search-area {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.item-search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #94a3b8;
}

.item-global-search {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}

.item-global-search:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.item-count-badge {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
}

.item-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafbfc;
}

.item-grid::-webkit-scrollbar {
  width: 6px;
}

.item-grid::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.item-grid::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
}

.item-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #94a3b8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.item-card.item-selected {
  border-color: #22c55e;
  background: #f0fdf4;
}

.item-card.item-selected:hover {
  border-color: #16a34a;
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.15);
}

.item-card-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-card-code {
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
}

.item-card-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.item-card-details {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.item-tag {
  font-size: 9px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.item-tag.brand {
  background: #f3e8ff;
  color: #7c3aed;
}

.item-tag.model {
  background: #f1f5f9;
  color: #64748b;
}

.item-tag.uom {
  background: #dcfce7;
  color: #166534;
}

.item-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  min-height: 32px;
}

.click-hint {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

.item-card.item-selected .click-hint {
  display: none;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 4px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  padding: 1px;
}

.qty-btn {
  background: transparent;
  border: none;
  padding: 2px 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  border-radius: 4px;
}

.qty-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-input {
  width: 50px;
  text-align: center;
  border: none;
  background: transparent;
  padding: 4px 0;
  font-size: 13px;
  font-weight: 500;
}

.qty-input:focus {
  outline: none;
}

/* ================================================================
   SELECTED ITEMS SUMMARY
   ================================================================ */

.selected-items-summary {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 8px;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.selected-title {
  font-size: 13px;
  font-weight: 600;
  color: #166534;
}

.btn-clear-all {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 2px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.btn-clear-all:hover {
  background: #fecaca;
}

.selected-items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-item-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: white;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}

.chip-code {
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
  font-size: 10px;
}

.chip-name {
  color: #1e293b;
}

.chip-qty {
  color: #64748b;
  font-weight: 500;
}

.chip-remove {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0 2px;
  font-size: 12px;
}

.chip-remove:hover {
  color: #dc2626;
}

/* ================================================================
   ITEM PAGINATION
   ================================================================ */

.item-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.page-btn-small {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.page-btn-small:hover:not(:disabled) {
  background: #f1f5f9;
}

.page-btn-small:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info-small {
  font-size: 12px;
  color: #64748b;
}

/* ================================================================
   ASSET CHECKBOX
   ================================================================ */

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
  background: #f8fafc;
}

.checkbox-label:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   STATUS CONFIRMATION MODAL
   ================================================================ */
.status-modal {
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

/* ================================================================
   EXPORT MODAL
   ================================================================ */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.export-option input[type="radio"] {
  accent-color: #3b82f6;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ================================================================
   TOAST
   ================================================================ */
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
  animation:
    slideInRight 0.3s ease,
    fadeOut 0.3s ease 2.7s forwards;
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

.toast.success {
  background: #22c55e;
}

.toast.error {
  background: #ef4444;
}

.toast.info {
  background: #3b82f6;
}

.toast.warning {
  background: #f59e0b;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1024px) {
  .requests-table {
    min-width: 800px;
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

  .filter-actions {
    margin-left: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-row-two-cols {
    grid-template-columns: 1fr;
  }

  .modal-container {
    width: 98%;
    max-height: 95vh;
  }

  .modal-body {
    padding: 16px;
  }

  .requests-table {
    font-size: 11px;
    min-width: 700px;
  }

  .requests-table th,
  .requests-table td {
    padding: 6px 8px;
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

  .detail-actions {
    flex-direction: column;
  }

  .detail-actions button {
    width: 100%;
    justify-content: center;
  }

  .col-actions {
    min-width: 180px;
  }

  .item-grid {
    grid-template-columns: 1fr;
    max-height: 400px;
  }
  
  .selected-items-list {
    flex-direction: column;
  }
  
  .selected-item-chip {
    width: 100%;
    justify-content: space-between;
  }
  
  .item-search-area {
    flex-direction: column;
    align-items: stretch;
  }

  .rejection-item {
    padding: 12px 14px;
  }
  
  .rejection-textarea-readonly {
    font-size: 12px;
    padding: 8px 12px;
    min-height: 50px;
  }
  
  .rejection-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .rejection-date {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .requests-table {
    min-width: 600px;
  }

  .requests-table th,
  .requests-table td {
    padding: 4px 6px;
    font-size: 10px;
  }

  .status-badge {
    padding: 2px 8px;
    font-size: 9px;
  }

  .icon-btn {
    padding: 3px 4px;
    font-size: 11px;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .col-code {
    min-width: 80px;
  }
  .col-items {
    min-width: 100px;
  }
  .col-store {
    min-width: 80px;
  }
  .col-actions {
    min-width: 160px;
  }

  .item-option-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .item-option-left {
    min-width: auto;
  }

  .item-option-right {
    min-width: auto;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .item-option-uom {
    align-self: flex-start;
    margin-left: 0;
  }

  .selected-item-display {
    flex-direction: column;
    align-items: flex-start;
  }

  .clear-selection {
    align-self: flex-end;
  }
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-add,
  .btn-export,
  .btn-clear-filters,
  .icon-btn,
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

  .requests-table {
    font-size: 9px !important;
    min-width: auto !important;
  }

  .requests-table th {
    background: #e2e8f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .status-badge.pending {
    background: #fef3c7 !important;
  }
  .status-badge.approved {
    background: #dbeafe !important;
  }
  .status-badge.rejected {
    background: #fee2e2 !important;
  }
  .status-badge.finalized {
    background: #dcfce7 !important;
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