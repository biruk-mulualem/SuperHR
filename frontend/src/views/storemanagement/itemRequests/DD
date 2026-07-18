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
        <button class="btn-add" @click="openCreateModal">➕ New Request</button>
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
            <!-- Main Row -->
            <tr
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
              <td>
                <span :class="['status-badge', req.status]">
                  {{ req.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    class="icon-btn print-btn"
                    @click="printRequest(req)"
                    title="Print Request"
                  >
                    🖨️
                  </button>
                  <button
                    v-if="req.status !== 'finalized'"
                    class="icon-btn"
                    @click="editRequest(req)"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="req.status === 'pending'"
                    class="icon-btn"
                    @click="openStatusConfirmation(req, 'approved')"
                    title="Approve"
                  >
                    ✅
                  </button>
                  <button
                    v-if="req.status === 'pending'"
                    class="icon-btn"
                    @click="openStatusConfirmation(req, 'rejected')"
                    title="Reject"
                  >
                    🚫
                  </button>
                </div>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr
              v-if="expandedRow === (req.requestId || req.id)"
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

                    <div class="detail-actions">
                      <button
                        class="btn-print-detail"
                        @click="printRequest(req)"
                      >
                        🖨️ Print Request
                      </button>
                      <button
                        v-if="req.status !== 'finalized'"
                        class="btn-edit-detail"
                        @click="editRequest(req)"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        v-if="req.status === 'pending'"
                        class="btn-approve-detail"
                        @click="openStatusConfirmation(req, 'approved')"
                      >
                        ✅ Approve
                      </button>
                      <button
                        v-if="req.status === 'pending'"
                        class="btn-reject-detail"
                        @click="openStatusConfirmation(req, 'rejected')"
                      >
                        🚫 Reject
                      </button>
                      <button
                        v-if="req.status === 'approved'"
                        class="btn-finalize-detail"
                        @click="openStatusConfirmation(req, 'finalized')"
                      >
                        📋 Finalize
                      </button>
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
          <!-- ================================================================ -->
          <!-- 🔥 VALIDATION ERRORS DISPLAY -->
          <!-- ================================================================ -->
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

                <!-- <div v-if="error.shortage" class="error-shortage">
                  ⚠️ Shortage: <strong>{{ error.shortage }}</strong> {{ error.uomCode || 'units' }}
                </div> -->
              </div>
            </div>

            <div class="validation-actions">
              <button class="btn-secondary" @click="closeValidationErrors">
                ✕ Dismiss
              </button>
            </div>
          </div>

          <!-- ================================================================ -->
          <!-- REQUEST FORM -->
          <!-- ================================================================ -->
          <form
            @submit.prevent="saveRequest"
            class="request-form"
            v-show="!showValidationErrors"
          >
            <!-- Store Selection -->
            <div class="form-row">
              <div class="form-group">
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
                <span class="hint"
                  >Select the store that will supply the items</span
                >
              </div>
            </div>

            <!-- Items Section -->
            <div class="form-section-title">
              <span>📦 Items</span>
              <button type="button" class="btn-add-item" @click="addItemRow">
                ➕ Add Item
              </button>
            </div>

            <div v-if="form.items.length === 0" class="no-items-message">
              <p>
                No items added yet. Click "Add Item" to add items to this
                request.
              </p>
            </div>

            <!-- ============================================================ -->
            <!-- ENHANCED ITEM ROW WITH STACKED DISPLAY -->
            <!-- ============================================================ -->
            <!-- ============================================================ -->
            <!-- ENHANCED ITEM ROW WITH STACKED DISPLAY - FULL WIDTH -->
            <!-- ============================================================ -->
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="item-row"
            >
              <div class="item-row-header">
                <span class="item-number">Item #{{ index + 1 }}</span>
                <button
                  type="button"
                  class="btn-remove-item"
                  @click="removeItemRow(index)"
                  v-if="form.items.length > 1"
                >
                  ✕ Remove
                </button>
              </div>

              <!-- Item Selection with Stacked Layout - FULL WIDTH -->
              <div class="form-row full-width">
                <div class="form-group full-width">
                  <label>Select Item *</label>

                  <!-- Search -->
                  <div class="item-search-wrapper">
                    <span class="search-icon-small">🔍</span>
                    <input
                      type="text"
                      :ref="(el) => setSearchInputRef(el, index)"
                      v-model="itemSearchQueries[index]"
                      placeholder="Search items by code, name, brand, or model..."
                      @input="resetItemList(index)"
                      class="item-search-input"
                    />
                  </div>

                  <!-- Item Select with Infinite Scroll - STACKED LAYOUT -->
                  <div
                    class="item-select-container"
                    :ref="(el) => setItemContainer(el, index)"
                  >
                    <div
                      class="item-select-scroll"
                      @scroll="onItemScroll(index)"
                    >
                      <div
                        v-for="itemOption in getDisplayedItems(index)"
                        :key="itemOption.id"
                        class="item-option"
                        :class="{
                          selected:
                            item.itemId ===
                            (itemOption.itemId || itemOption.id),
                        }"
                        @click="selectItemForRow(index, itemOption)"
                      >
                        <div class="item-option-content">
                          <!-- Left: Code -->
                          <div class="item-option-left">
                            <span class="item-option-code">{{
                              itemOption.code
                            }}</span>
                          </div>

                          <!-- Middle: Standard Name & Common Name (stacked) -->
                          <!-- views/storemanagement/itemrequests/itemrequests.vue - UPDATED ITEM OPTION DISPLAY -->

                          <div class="item-option-middle">
                            <!-- ✅ COMMON NAME - Primary (always shown) -->
                            <div class="item-option-common-name">
                              {{
                                (itemOption as any).commonName ||
                                itemOption.name ||
                                "Unnamed"
                              }}
                            </div>
                            <!-- ✅ STANDARD NAME - Secondary (only shown if exists and different) -->
                            <div
                              class="item-option-standard-name"
                              v-if="
                                itemOption.standardName &&
                                itemOption.standardName !==
                                  ((itemOption as any).commonName || itemOption.name)
                              "
                            >
                              {{ itemOption.standardName }}
                            </div>
                          </div>

                          <!-- Right: Brand & Model (stacked) -->
                          <div class="item-option-right">
                            <div
                              class="item-option-brand"
                              v-if="itemOption.brand"
                            >
                              {{ itemOption.brand }}
                            </div>
                            <div
                              class="item-option-model"
                              v-if="itemOption.model"
                            >
                              {{ itemOption.model }}
                            </div>
                          </div>

                          <!-- Far Right: UOM -->
                          <div class="item-option-uom">
                            {{ itemOption.uom?.code || "N/A" }}
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="isLoadingItemsForRow[index]"
                        class="item-loading"
                      >
                        <div class="spinner-small"></div>
                        Loading more items...
                      </div>
                      <div
                        v-if="
                          getFilteredItems(index).length === 0 &&
                          !isLoadingItemsForRow[index]
                        "
                        class="item-no-results"
                      >
                        No items found
                      </div>
                      <div
                        v-if="
                          hasMoreItems(index) && !isLoadingItemsForRow[index]
                        "
                        class="item-load-more"
                      >
                        Scroll for more items...
                      </div>
                    </div>
                  </div>

                  <!-- Selected Item Display -->
                  <div
                    v-if="selectedItemDisplays[index]"
                    class="selected-item-display"
                  >
                    <span class="selected-badge">✅ Selected:</span>
                    <span class="selected-item-code">{{
                      selectedItemDisplays[index].code
                    }}</span>
                    <span class="selected-item-name">{{
                      selectedItemDisplays[index].standardName ||
                      selectedItemDisplays[index].name
                    }}</span>
                    <span
                      class="selected-item-common"
                      v-if="selectedItemDisplays[index].commonName"
                      >{{ selectedItemDisplays[index].commonName }}</span
                    >
                    <span
                      class="selected-item-brand"
                      v-if="selectedItemDisplays[index].brand"
                      >Brand: {{ selectedItemDisplays[index].brand }}</span
                    >
                    <span
                      class="selected-item-model"
                      v-if="selectedItemDisplays[index].model"
                      >Model: {{ selectedItemDisplays[index].model }}</span
                    >
                    <span class="selected-item-uom"
                      >({{
                        selectedItemDisplays[index].uom?.code || "N/A"
                      }})</span
                    >
                    <button
                      type="button"
                      class="clear-selection"
                      @click="clearItemSelection(index)"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              <!-- Quantity and UOM - 3 columns -->
              <div class="form-row">
                <div class="form-group">
                  <label>UOM</label>
                  <input
                    :value="getItemUOM(Number(item.itemId))"
                    type="text"
                    readonly
                    class="readonly-field"
                  />
                </div>
                <div class="form-group">
                  <label>Quantity *</label>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="Enter quantity"
                  />
                </div>
                <div class="form-group">
                  <label>Standard Name</label>
                  <input
                    :value="getItemStandardName(Number(item.itemId))"
                    type="text"
                    readonly
                    class="readonly-field"
                  />
                </div>
              </div>

              <!-- Item Remark - Full Width -->
              <div class="form-row full-width">
                <div class="form-group">
                  <label>Item Remark</label>
                  <textarea
                    v-model="item.remark"
                    rows="2"
                    placeholder="Add remark for this item..."
                    class="textarea-field"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Request Details -->
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

            <!-- Status - Hidden when editing, visible when creating -->
            <div class="form-row" v-if="!editingRequest">
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div class="form-group">
                <!-- Empty for alignment -->
              </div>
            </div>

            <!-- Show status info when editing -->
            <div class="form-row" v-if="editingRequest">
              <div class="form-group">
                <label>Status</label>
                <input
                  value="Pending (Reset on Edit)"
                  type="text"
                  readonly
                  class="status-info-field"
                />
                <span class="hint"
                  >Status is always reset to Pending when editing</span
                >
              </div>
              <div class="form-group">
                <!-- Empty for alignment -->
              </div>
            </div>

            <div class="form-row full-width">
              <div class="form-group">
                <label>General Remark</label>
                <textarea
                  v-model="form.remark"
                  rows="3"
                  placeholder="General notes or remarks..."
                  class="textarea-field"
                ></textarea>
                <span class="hint"
                  >This remark applies to the entire request</span
                >
              </div>
            </div>

            <!-- Summary -->
            <div class="form-summary" v-if="form.items.length > 0">
              <div class="summary-item">
                <span>Total Items:</span>
                <strong>{{ form.items.length }}</strong>
              </div>
              <div class="summary-item">
                <span>Total Quantity:</span>
                <strong>{{ getTotalQuantity() }}</strong>
              </div>
            </div>

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
          <p class="confirmation-title">
            Are you sure you want to change the status?
          </p>
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
            <strong>{{ statusAction }}</strong
            >.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStatusModal">
            Cancel
          </button>
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
          <button class="btn-secondary" @click="closeExportModal">
            Cancel
          </button>
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
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import itemRequestService from "@/stores/itemRequestService";
import type {
  ItemRequest,
  RequestItem,
  Store,
  Item,
} from "@/stores/itemRequestService";

// ================================================================
// STATE
// ================================================================

const router = useRouter();
const authStore = useAuthStore();

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

// Filters & Search
const searchQuery = ref("");
const filterStatus = ref("all");
const filterStore = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// 🔥 Validation Errors
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
const statusAction = ref<"approved" | "rejected" | "finalized">("approved");

// ================================================================
// ITEM SELECTION STATE (per row)
// ================================================================
const itemSearchQueries = ref<Record<number, string>>({});
const itemDisplayLimits = ref<Record<number, number>>({});
const isLoadingItemsForRow = ref<Record<number, boolean>>({});
const itemContainers = ref<Record<number, HTMLElement | null>>({});
const selectedItemDisplays = ref<Record<number, any>>({});
const searchInputRefs = ref<Record<number, HTMLInputElement | null>>({});

// Form
const form = ref({
  askingStoreId: "",
  supplyingStoreId: "",
  items: [] as RequestItem[],
  requestedBy: "",
  requestedDate: "",
  status: "pending" as "pending" | "approved" | "rejected",
  remark: "",
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

const isFormValid = computed(() => {
  return !!(
    form.value.askingStoreId &&
    form.value.supplyingStoreId &&
    form.value.items.length > 0 &&
    form.value.items.every((item) => item.itemId && item.quantity > 0) &&
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

// -- User Permissions --
const canCreateRequests = computed(() => {
  if (userIsAdmin.value) return true;
  return !!userAssignedStoreId.value;
});

// ================================================================
// METHODS - ITEM SELECTION PER ROW
// ================================================================

const setItemContainer = (el: any, index: number) => {
  itemContainers.value[index] = el;
};

const setSearchInputRef = (el: any, index: number) => {
  searchInputRefs.value[index] = el;
};

const resetItemList = (index: number) => {
  itemDisplayLimits.value[index] = 10;
};

const onItemScroll = (index: number) => {
  const element = itemContainers.value[index];
  if (!element) return;

  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    const filtered = getFilteredItems(index);
    const currentLimit = itemDisplayLimits.value[index] || 10;

    if (filtered.length > currentLimit && !isLoadingItemsForRow.value[index]) {
      isLoadingItemsForRow.value[index] = true;
      setTimeout(() => {
        itemDisplayLimits.value[index] = Math.min(
          currentLimit + 10,
          filtered.length,
        );
        isLoadingItemsForRow.value[index] = false;
      }, 300);
    }
  }
};

const getFilteredItems = (rowIndex: number) => {
  let itemsList = [...items.value];

  const query = itemSearchQueries.value[rowIndex] || "";
  if (query) {
    const q = query.toLowerCase();
    itemsList = itemsList.filter(
      (item) =>
        item.code?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.standardName?.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        item.model?.toLowerCase().includes(q),
    );
  }

  return itemsList;
};

const getDisplayedItems = (rowIndex: number) => {
  const limit = itemDisplayLimits.value[rowIndex] || 10;
  return getFilteredItems(rowIndex).slice(0, limit);
};

const hasMoreItems = (rowIndex: number) => {
  const limit = itemDisplayLimits.value[rowIndex] || 10;
  return getDisplayedItems(rowIndex).length < getFilteredItems(rowIndex).length;
};

const selectItemForRow = (rowIndex: number, itemOption: any) => {
  const itemRow = form.value.items[rowIndex];
  if (!itemRow) return;

  const itemId = itemOption.itemId || itemOption.id;
  itemRow.itemId = itemId;
  selectedItemDisplays.value[rowIndex] = itemOption;
  // Update UOM and standard name
  updateItemDetails(rowIndex);

  // Close the dropdown by blurring the search input
  const searchInput = searchInputRefs.value[rowIndex];
  if (searchInput) {
    searchInput.blur();
  }
};

const clearItemSelection = (rowIndex: number) => {
  const itemRow = form.value.items[rowIndex];
  if (!itemRow) return;

  itemRow.itemId = 0;
  selectedItemDisplays.value[rowIndex] = null;
  itemSearchQueries.value[rowIndex] = "";
  itemDisplayLimits.value[rowIndex] = 10;
};

// ================================================================
// METHODS
// ================================================================

// -- User Data --
const loadUserData = () => {
  const user = authStore.user;
  if (user) {
    const userData = user as any;
    userIsAdmin.value =
      userData.isAdmin || user.role === "admin" || user.role === "Admin";

    if (user && "assignedStore" in user && user.assignedStore) {
      const assignedStore = user.assignedStore as any;
      userAssignedStoreId.value = assignedStore.id || null;
      userAssignedStoreName.value = assignedStore.name || null;
    } else {
      userAssignedStoreId.value = null;
      userAssignedStoreName.value = null;
    }
  }
};

const getUserAssignedStoreName = (): string => {
  return userAssignedStoreName.value || "No store assigned";
};

// -- Load Data --
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

// -- Helper Methods --
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

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

const getTotalQuantity = (): number => {
  return form.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

// -- Item Row Management --
const addItemRow = (): void => {
  const newIndex = form.value.items.length;
  form.value.items.push({
    itemId: 0,
    quantity: 1,
    remark: "",
  });
  // Initialize search state for new row
  itemSearchQueries.value[newIndex] = "";
  itemDisplayLimits.value[newIndex] = 10;
  isLoadingItemsForRow.value[newIndex] = false;
  selectedItemDisplays.value[newIndex] = null;
  itemContainers.value[newIndex] = null;
  searchInputRefs.value[newIndex] = null;
};

const removeItemRow = (index: number): void => {
  form.value.items.splice(index, 1);
  // Clean up associated state
  delete itemSearchQueries.value[index];
  delete itemDisplayLimits.value[index];
  delete isLoadingItemsForRow.value[index];
  delete itemContainers.value[index];
  delete selectedItemDisplays.value[index];
  delete searchInputRefs.value[index];
};

const updateItemDetails = (_index: number): void => {
  // Auto-update UOM and standard name when item is selected
};

// -- Expand --
const toggleExpand = (id?: number): void => {
  if (id === undefined || id === null) {
    expandedRow.value = null;
    return;
  }
  expandedRow.value = expandedRow.value === id ? null : id;
};

// -- Validation Error Display --
const closeValidationErrors = (): void => {
  showValidationErrors.value = false;
  validationErrors.value = [];
  validationMessage.value = "";
};

const openCreateModal = (): void => {
  editingRequest.value = null;
  const today: string = new Date().toISOString().split("T")[0] || "";

  // Clear validation errors
  closeValidationErrors();

  const askingStoreId = userIsAdmin.value
    ? ""
    : String(userAssignedStoreId.value || "");

  form.value = {
    askingStoreId: askingStoreId,
    supplyingStoreId: "",
    items: [{ itemId: 0, quantity: 1, remark: "" }],
    requestedBy: getCurrentUser(),
    requestedDate: today,
    status: "pending",
    remark: "",
  };

  // Initialize item selection state for first row
  itemSearchQueries.value[0] = "";
  itemDisplayLimits.value[0] = 10;
  isLoadingItemsForRow.value[0] = false;
  selectedItemDisplays.value[0] = null;
  itemContainers.value[0] = null;
  searchInputRefs.value[0] = null;

  formErrors.value = [];
  showModal.value = true;
};

const editRequest = (req: ItemRequest): void => {
  editingRequest.value = req;
  const today: string = new Date().toISOString().split("T")[0] || "";
  const requestedDate: string = String(req.requestedDate || today);

  // Clear validation errors
  closeValidationErrors();

  const askingStoreId = String(req.askingStoreId);

  form.value = {
    askingStoreId: askingStoreId,
    supplyingStoreId: String(req.supplyingStoreId),
    items: req.items
      ? req.items.map((item) => ({
          ...item,
          itemId: Number((item as any).itemId || 0),
        }))
      : [{ itemId: 0, quantity: 1, remark: "" }],
    requestedBy: getRequesterName(req),
    requestedDate,
    status: "pending",
    remark: req.remark || "",
  };

  // Initialize item selection state for each row
  form.value.items.forEach((_, index) => {
    itemSearchQueries.value[index] = "";
    itemDisplayLimits.value[index] = 10;
    isLoadingItemsForRow.value[index] = false;
    selectedItemDisplays.value[index] = null;
    itemContainers.value[index] = null;
    searchInputRefs.value[index] = null;
  });

  formErrors.value = [];
  showModal.value = true;
};

const closeModal = (): void => {
  showModal.value = false;
  editingRequest.value = null;
  closeValidationErrors();
  // Clean up item selection state
  Object.keys(itemSearchQueries.value).forEach((key) => {
    delete itemSearchQueries.value[Number(key)];
    delete itemDisplayLimits.value[Number(key)];
    delete isLoadingItemsForRow.value[Number(key)];
    delete itemContainers.value[Number(key)];
    delete selectedItemDisplays.value[Number(key)];
    delete searchInputRefs.value[Number(key)];
  });
};

// -- Save Request --
const saveRequest = async (): Promise<void> => {
  // Clear previous validation errors
  closeValidationErrors();
  formErrors.value = [];

  if (!form.value.askingStoreId) {
    formErrors.value.push("Please select the asking store");
  }
  if (!form.value.supplyingStoreId) {
    formErrors.value.push("Please select the supplying store");
  }
  if (form.value.askingStoreId === form.value.supplyingStoreId) {
    formErrors.value.push(
      "Asking store and supplying store cannot be the same",
    );
  }
  if (form.value.items.length === 0) {
    formErrors.value.push("Please add at least one item");
  }

  form.value.items.forEach((item, index) => {
    if (!item.itemId) {
      formErrors.value.push(`Item #${index + 1}: Please select an item`);
    }
    if (!item.quantity || item.quantity <= 0) {
      formErrors.value.push(
        `Item #${index + 1}: Please enter a valid quantity`,
      );
    }
  });

  if (!form.value.requestedDate) {
    formErrors.value.push("Please select a requested date");
  }

  if (formErrors.value.length > 0) {
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
    };

    let response;
    if (editingRequest.value) {
      const requestId =
        editingRequest.value.requestId || editingRequest.value.id;
      response = await itemRequestService.updateRequest(
        requestId!,
        requestData,
      );
      if (response.success) {
        showToastMessage(
          "Request updated successfully! Status reset to Pending",
          "success",
        );
        await loadRequests();
        closeModal();
        saving.value = false;
        return;
      } else {
        showToastMessage(response.error || "Failed to update request", "error");
        saving.value = false;
        return;
      }
    } else {
      response = await itemRequestService.createRequest(requestData);

      console.log("📦 API Response:", response);

      if (!response.success) {
        if (response.errors && response.errors.length > 0) {
          console.log(
            "🔍 Validation Errors:",
            JSON.stringify(response.errors, null, 2),
          );
          validationErrors.value = response.errors;
          validationMessage.value =
            response.message ||
            "The request cannot be created due to the following issues:";
          showValidationErrors.value = true;
          showToastMessage(
            "Validation failed - please fix the issues below",
            "error",
          );
          saving.value = false;
          return;
        } else {
          showToastMessage(
            response.error || "Failed to create request",
            "error",
          );
          saving.value = false;
          return;
        }
      }

      if (response.success) {
        showToastMessage("Request created successfully!", "success");
        await loadRequests();
        closeModal();
        saving.value = false;
        return;
      }
    }
  } catch (error: any) {
    console.error("Save request error:", error);
    const errorData = error.response?.data;

    if (errorData && errorData.errors && errorData.errors.length > 0) {
      console.log(
        "🔍 Error Response Errors:",
        JSON.stringify(errorData.errors, null, 2),
      );
      validationErrors.value = errorData.errors;
      validationMessage.value =
        errorData.message ||
        "The request cannot be created due to the following issues:";
      showValidationErrors.value = true;
      showToastMessage(
        "Validation failed - please fix the issues below",
        "error",
      );
    } else {
      showToastMessage(error.message || "Failed to save request", "error");
    }
  } finally {
    saving.value = false;
  }
};

// -- Status Confirmation --
const openStatusConfirmation = (
  req: ItemRequest,
  action: "approved" | "rejected" | "finalized",
): void => {
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
      showToastMessage(
        response.error || `Failed to ${action} request`,
        "error",
      );
    }
    closeStatusModal();
  } catch (error: any) {
    showToastMessage(error.message || `Failed to ${action} request`, "error");
  }
};

// -- Print Request --
const printRequest = (req: ItemRequest): void => {
  const requestId = req.requestId || req.id;
  router.push({
    name: "print-requests",
    query: { id: String(requestId) },
  });
};

// -- Filters --
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

// -- Pagination --
const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const changePageSize = (): void => {
  currentPage.value = 1;
};

// -- Export --
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
      status:
        filterStatus.value === "all" ? undefined : (filterStatus.value as any),
      storeId:
        filterStore.value === "all" ? undefined : Number(filterStore.value),
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

// -- Toast --
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

  if (!userIsAdmin.value && userAssignedStoreId.value) {
    filterStore.value = String(userAssignedStoreId.value);
  }
});
</script>

<style scoped>
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

.error-shortage {
  padding-left: 28px;
  margin-top: 6px;
  padding: 4px 12px;
  background: #fee2e2;
  border-radius: 4px;
  font-size: 13px;
  color: #991b1b;
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

/* Column widths */
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

.btn-reject-detail {
  background: #ef4444;
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

.btn-reject-detail:hover {
  background: #dc2626;
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
  max-width: 800px;
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

.btn-add-item {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #2563eb;
}

.item-row {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
}

/* ================================================================
   FORM ROW - FULL WIDTH
   ================================================================ */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row.full-width {
  grid-template-columns: 1fr;
}

.form-group.full-width {
  grid-column: 1 / -1;
  width: 100%;
}

/* Make sure the item selection takes full width */
.form-group.full-width .item-search-wrapper {
  width: 100%;
}

.form-group.full-width .item-search-input {
  width: 100%;
}

.form-group.full-width .item-select-container {
  width: 100%;
}

.form-group.full-width .item-select-scroll {
  width: 100%;
}

.item-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-number {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
}

.btn-remove-item {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-remove-item:hover {
  background: #fecaca;
}

.no-items-message {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

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

.form-summary {
  display: flex;
  gap: 30px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.summary-item span {
  color: #475569;
}

.summary-item strong {
  color: #1e293b;
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
   ENHANCED ITEM SELECTION STYLES - STACKED LAYOUT
   ================================================================ */

.full-width {
  flex: 1 1 100%;
  min-width: 100%;
}

.item-search-wrapper {
  position: relative;
  flex: 1;
  min-width: 150px;
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.item-search-input {
  width: 100%;
  padding: 6px 10px 6px 30px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: #f8fafc;
  transition: all 0.2s;
}

.item-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.item-select-container {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  max-height: 220px;
  overflow: hidden;
  transition: border-color 0.2s;
  margin-top: 4px;
}

.item-select-container:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.item-select-scroll {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}

.item-select-scroll::-webkit-scrollbar {
  width: 6px;
}

.item-select-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.item-select-scroll::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
}

.item-select-scroll::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* ================================================================
   ITEM OPTION - STACKED LAYOUT
   ================================================================ */

.item-option {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;
  border-bottom: 1px solid #f1f5f9;
}

.item-option:hover {
  background: #f1f5f9;
}

.item-option.selected {
  background: #dbeafe;
  border: 1px solid #93bbfc;
}

.item-option:last-child {
  border-bottom: none;
}

.item-option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  width: 100%;
}

/* Left: Code */
.item-option-left {
  min-width: 100px;
  flex-shrink: 0;
}

.item-option-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

/* Middle: Standard Name & Common Name (stacked) */
.item-option-middle {
  flex: 1;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-option-name {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  line-height: 1.3;
}

.item-option-common {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.2;
}

/* Right: Brand & Model (stacked) */
.item-option-right {
  min-width: 80px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-option-brand {
  font-size: 11px;
  color: #8b5cf6;
  background: #f3e8ff;
  padding: 1px 10px;
  border-radius: 10px;
  text-align: center;
  white-space: nowrap;
}

.item-option-model {
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 10px;
  border-radius: 10px;
  text-align: center;
  white-space: nowrap;
}

/* Far Right: UOM */
.item-option-uom {
  font-size: 11px;
  color: #166534;
  background: #dcfce7;
  padding: 2px 12px;
  border-radius: 10px;
  min-width: 45px;
  text-align: center;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: auto;
}

/* Selected Item Display */
.selected-item-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.selected-badge {
  font-weight: 600;
  color: #166534;
  font-size: 12px;
}

.selected-item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
}

.selected-item-name {
  color: #1e293b;
  font-size: 13px;
}

.selected-item-common {
  font-size: 11px;
  color: #94a3b8;
}

.selected-item-brand {
  font-size: 12px;
  color: #8b5cf6;
  background: #f3e8ff;
  padding: 1px 10px;
  border-radius: 10px;
}

.selected-item-model {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 10px;
  border-radius: 10px;
}

.selected-item-uom {
  color: #64748b;
  font-size: 12px;
}

.clear-selection {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 14px;
  padding: 0 4px;
  margin-left: auto;
}

.clear-selection:hover {
  color: #dc2626;
}

.item-loading {
  text-align: center;
  padding: 10px;
  color: #94a3b8;
  font-size: 12px;
}

.item-no-results {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

.item-load-more {
  text-align: center;
  padding: 8px;
  color: #94a3b8;
  font-size: 11px;
  font-style: italic;
}

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
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

  .item-row {
    padding: 10px;
  }

  .form-summary {
    flex-direction: column;
    gap: 8px;
  }

  .col-actions {
    min-width: 180px;
  }

  /* Item option responsive */
  .item-option-content {
    flex-wrap: wrap;
    gap: 4px;
  }

  .item-option-left {
    min-width: 80px;
  }

  .item-option-middle {
    min-width: 100px;
    flex: 1 1 100%;
  }

  .item-option-right {
    min-width: 60px;
  }

  .item-option-brand,
  .item-option-model {
    font-size: 9px;
    padding: 1px 6px;
  }

  .selected-item-display {
    font-size: 12px;
    gap: 4px;
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

  /* Item option responsive - mobile */
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
