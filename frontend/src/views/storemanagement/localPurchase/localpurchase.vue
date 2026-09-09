<!-- views/storemanagement/localPurchase/localpurchase.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🏪 Local Purchase Follow-Up</h2>
        <span class="total-badge">{{ totalItemsCount }} Items</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by request #, item, or requester..."
            @input="onSearchChange"
          />
        </div>
        <router-link to="/approved-requests" class="btn-get-request">
          📥 Get Request
          <span class="btn-badge" v-if="availableItemsCount > 0">{{ availableItemsCount }}</span>
        </router-link>
        <button class="btn-export" @click="exportData">📊 Export</button>
        <button class="btn-refresh" @click="refreshData">🔄</button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="all">All Status</option>
        <option value="pending_bids">Pending</option>
        <option value="bidding">Price Collection</option>
        <option value="purchased">Purchased</option>
        <option value="arrived">Arrived at SDT</option>
      </select>
      
      <select v-model="filterDepartment" class="filter-select" @change="onFilterChange">
        <option value="all">All Departments</option>
        <option v-for="dept in departments" :key="dept.id" :value="dept.id">
          {{ dept.name }}
        </option>
      </select>
      
      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-number">{{ totalItemsCount }}</span>
        <span class="stat-label">Total Items</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ pendingItems }}</span>
        <span class="stat-label">Pending</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ biddingItems }}</span>
        <span class="stat-label">Price Collection</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ purchasedItems }}</span>
        <span class="stat-label">Purchased</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ arrivedItems }}</span>
        <span class="stat-label">Arrived at SDT</span>
      </div>
    </div>

    <!-- ==================== ITEMS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading items...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-expand"></th>
            <th class="col-code">Request #</th>
            <th class="col-item">Items</th>
            <th class="col-count">Count</th>
            <th class="col-requester">Requested By</th>
            <th class="col-dept">Department</th>
            <th class="col-date">Request Date</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="groupedRequests.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📭</span>
                <p>No requests in follow-up</p>
                <router-link to="/approved-requests" class="btn-get-request">
                  📥 Get Request
                  <span class="btn-badge" v-if="availableItemsCount > 0">{{ availableItemsCount }}</span>
                </router-link>
              </div>
            </td>
          </tr>
          <template v-for="group in paginatedGroups" :key="group.requestId">
            <tr :class="{ 'expanded-row': expandedRequest === group.requestId }">
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(group.requestId)">
                  {{ expandedRequest === group.requestId ? "▼" : "▶" }}
                </button>
              </td>
              <td class="code-cell">{{ group.requestNumber }}</td>
              <td>
                <div class="items-cell">
                  <span class="item-count">{{ group.items.length }} item(s)</span>
                  <span class="item-names">{{ getItemNames(group.items) }}</span>
                </div>
              </td>
              <td>{{ group.items.length }}</td>
              <td>{{ group.requestedBy }}</td>
              <td>{{ group.department }}</td>
              <td>{{ formatDate(group.requestDate) }}</td>
              <td>
                <span :class="['status-badge', group.status]">
                  {{ getStatusLabel(group.status) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="icon-btn bid-btn" 
                    @click="openBidForGroup(group)"
                    title="Add Price"
                    :disabled="group.status === 'arrived' || group.status === 'purchased'"
                  >
                    💰
                  </button>
                  <button 
                    v-if="group.status === 'bidding' || group.status === 'purchased'" 
                    class="icon-btn payment-btn" 
                    @click="openPaymentForGroup(group)"
                    title="Make Payment"
                    :disabled="group.status === 'arrived'"
                  >
                    💳
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW - SHOWS ALL ITEMS ==================== -->
            <tr v-if="expandedRequest === group.requestId" class="detail-expand-row">
              <td colspan="9">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Request Header -->
                    <div class="request-header">
                      <div class="request-title">
                        <h3>📋 Purchase Order: {{ group.requestNumber }}</h3>
                        <span class="request-status" :class="group.status">{{ getStatusLabel(group.status) }}</span>
                      </div>
                      <div class="request-info">
                        <span>Requested by: {{ group.requestedBy }}</span>
                        <span>Department: {{ group.department }}</span>
                        <span>Date: {{ formatDate(group.requestDate) }}</span>
                      </div>
                    </div>

                    <!-- ============================================================ -->
                    <!-- LOOP THROUGH ALL ITEMS IN THIS PURCHASE ORDER                 -->
                    <!-- ============================================================ -->
                    <div v-for="(item, itemIndex) in group.items" :key="item.id" class="item-detail-block">
                      <!-- Item Header -->
                      <div class="item-detail-header">
                        <div class="item-title">
                          <span class="item-number">📦 Item #{{ itemIndex + 1 }}</span>
                          <h4>{{ item.itemName }}</h4>
                          <span class="item-code-badge">{{ item.itemCode }}</span>
                          <span class="item-qty-badge">{{ item.quantity }} {{ item.uom }}</span>
                        </div>
                        <div class="item-actions-top">
                          <!-- SUBMIT PRICE BUTTON -->
                          <button 
                            v-if="item.status === 'pending_bids' || item.status === 'bidding'" 
                            class="btn-bid-item" 
                            @click="openBidModal(item)"
                            :disabled="isActionDisabled(item)"
                          >
                            💰 Submit Price
                          </button>
                          <!-- MAKE PAYMENT BUTTON -->
                          <button 
                            v-if="item.status === 'bidding' && item.bids && item.bids.length > 0" 
                            class="btn-payment-item" 
                            @click="openPaymentModal(item)"
                            :disabled="isActionDisabled(item)"
                          >
                            💳 Make Payment
                          </button>
                          <!-- ARRIVED AT SDT BUTTON -->
                          <button 
                            v-if="item.status === 'purchased'" 
                            class="btn-arrive-item" 
                            @click="openArrivedModal(item)"
                            :disabled="isActionDisabled(item)"
                          >
                            📦 Arrived at SDT
                          </button>
                          <!-- ADD INFO BUTTON -->
                          <button 
                            class="btn-add-info-item" 
                            @click="openAddInfoModal(item)" 
                            title="Add additional info"
                            :disabled="isActionDisabled(item)"
                          >
                            ➕ Add Info
                          </button>
                        </div>
                      </div>

                      <!-- Item Status -->
                      <div class="item-status-bar">
                        <span class="status-label">Status:</span>
                        <span :class="['status-badge', item.status]">{{ getStatusLabel(item.status) }}</span>
                        <span v-if="item.bids && item.bids.length > 0" class="bid-count">💰 {{ item.bids.length }} price(s)</span>
                        <span v-if="item.hasWinner" class="winner-indicator">🏆 Winner: {{ getWinnerBid(item)?.employee }}</span>
                      </div>

                      <!-- PRICE TABLE FOR THIS ITEM -->
                      <div class="price-section">
                        <div class="price-header">
                          <h4>💰 Prices</h4>
                          <span class="price-status" v-if="item.hasWinner">🏆 Winner Selected</span>
                          <span v-else-if="item.bids && item.bids.length > 0" class="price-count">{{ item.bids.length }} bid(s)</span>
                          <span v-else class="price-count">No bids yet</span>
                        </div>

                        <!-- Price Table -->
                        <div v-if="item.bids && item.bids.length > 0" class="price-table-wrapper">
                          <table class="price-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Sales Person</th>
                                <th>Unit Price (ETB)</th>
                                <th>Total Price (ETB)</th>
                                <th>Discount (ETB)</th>
                                <th>Final Price (ETB)</th>
                                <th>Match</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(bid, bidIndex) in getSortedBids(item)" :key="bid.id" 
                                  :class="{
                                    'winner-row': bid.isWinner,
                                    'match-row': bid.matchesRequirement === true && !bid.isWinner,
                                    'not-match-row': bid.matchesRequirement === false && !bid.isWinner
                                  }">
                                <td>
                                  <span v-if="bid.isWinner" class="rank-winner">🏆</span>
                                  <span v-else class="rank-number">#{{ bidIndex + 1 }}</span>
                                </td>
                                <td class="employee-name">{{ bid.employee }}</td>
                                <td>{{ bid.unitPrice.toFixed(2) }}</td>
                                <td>{{ bid.totalPrice.toFixed(2) }}</td>
                                <td class="discount-cell">{{ bid.discount > 0 ? bid.discount.toFixed(2) : '-' }}</td>
                                <td class="final-price-cell">{{ bid.finalPrice.toFixed(2) }}</td>
                                <td>
                                  <span v-if="bid.matchesRequirement === true" class="match-badge-small">✅</span>
                                  <span v-else-if="bid.matchesRequirement === false" class="not-match-badge-small">❌</span>
                                  <span v-else class="pending-badge-small">⏳</span>
                                </td>
                                <td>
                                  <span v-if="bid.isWinner" class="winner-badge-small">🏆 Winner</span>
                                  <span v-else-if="bid.status === 'pending'" class="pending-badge-small">Pending</span>
                                  <span v-else-if="bid.status === 'rejected'" class="rejected-badge-small">Rejected</span>
                                  <span v-else-if="bid.status === 'accepted'" class="accepted-badge-small">Accepted</span>
                                </td>
                                <td>
                                  <div class="price-actions">
                                    <button 
                                      class="btn-edit-price-small" 
                                      @click="openEditModal(item, bid)"
                                      title="Edit"
                                      :disabled="isActionDisabled(item)"
                                    >
                                      ✏️
                                    </button>
                                    <button 
                                      class="btn-remove-price-small" 
                                      @click="openRemoveModal(item, bid)"
                                      title="Remove"
                                      :disabled="isActionDisabled(item)"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div v-else class="no-data">No prices submitted yet for this item</div>

                        <!-- NOTE: Removed the "Add Price for this Item" button at bottom -->
                      </div>

                      <!-- PAYMENT DETAILS - PER ITEM -->
                      <div class="payment-section" v-if="item.paymentDetails">
                        <h4>💳 Payment Details</h4>
                        <div class="payment-grid">
                          <div class="payment-item"><span class="label">Sales Person</span><span class="value">{{ item.paymentDetails.employee }}</span></div>
                          <div class="payment-item"><span class="label">Unit Price</span><span class="value amount">ETB {{ item.paymentDetails.unitPrice.toFixed(2) }}</span></div>
                          <div class="payment-item"><span class="label">Total Amount</span><span class="value amount">ETB {{ item.paymentDetails.totalAmount.toFixed(2) }}</span></div>
                          <div class="payment-item"><span class="label">Discount</span><span class="value amount" style="color:#ef4444;">ETB {{ item.paymentDetails.discount.toFixed(2) }}</span></div>
                          <div class="payment-item"><span class="label">Final Amount</span><span class="value amount final-amount">ETB {{ item.paymentDetails.finalAmount.toFixed(2) }}</span></div>
                          <div class="payment-item"><span class="label">Paid By</span><span class="value">{{ item.paymentDetails.paidBy }}</span></div>
                          <div class="payment-item"><span class="label">Transfer #</span><span class="value transfer-number">{{ item.paymentDetails.transferNumber }}</span></div>
                          <div class="payment-item"><span class="label">Bank</span><span class="value">{{ item.paymentDetails.bank }}</span></div>
                          <div class="payment-item"><span class="label">Payment Date</span><span class="value">{{ formatDate(item.paymentDetails.paymentDate) }}</span></div>
                          <div v-if="item.paymentDetails.remark" class="payment-item"><span class="label">Remark</span><span class="value">{{ item.paymentDetails.remark }}</span></div>
                        </div>
                      </div>

                      <!-- ARRIVAL AT SDT - PER ITEM -->
                      <div class="arrival-section" v-if="item.arrivalDetails">
                        <h4>📦 Arrival at SDT</h4>
                        <div class="arrival-grid">
                          <div class="arrival-item"><span class="label">Arrived Date</span><span class="value">{{ formatDate(item.arrivalDetails.arrivedDate) }}</span></div>
                          <div v-if="item.arrivalDetails.remark" class="arrival-item"><span class="label">Remark</span><span class="value">{{ item.arrivalDetails.remark }}</span></div>
                        </div>
                      </div>

                      <!-- Additional Info -->
                      <div class="info-section" v-if="item.additionalInfo">
                        <h4>📎 Additional Information</h4>
                        <div v-if="item.additionalInfo.specs" class="info-item-full"><span class="label">Specifications:</span><span class="value">{{ item.additionalInfo.specs }}</span></div>
                        <div v-if="item.additionalInfo.notes" class="info-item-full"><span class="label">Notes:</span><span class="value">{{ item.additionalInfo.notes }}</span></div>
                        <div v-if="item.additionalInfo.images && item.additionalInfo.images.length > 0" class="info-item-full">
                          <span class="label">Images:</span>
                          <div class="info-images">
                            <span class="additional-info-badge" @click="viewAdditionalInfo(item)">📎 View {{ item.additionalInfo.images.length }} image(s)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- ==================== END OF ITEM LOOP ==================== -->
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="groupedRequests.length > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ← Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Next →
      </button>
      <select v-model="pageSize" @change="changePageSize" class="limit-select">
        <option :value="5">5 per page</option>
        <option :value="10">10 per page</option>
        <option :value="20">20 per page</option>
        <option :value="50">50 per page</option>
      </select>
    </div>

    <!-- ==================== PRICE MODAL ==================== -->
    <div v-if="showBidModal" class="modal-overlay" @click.self="showBidModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>💰 Submit Price - {{ bidItem?.itemName }}</h3>
          <button class="modal-close" @click="showBidModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-box">
            <p><strong>Item:</strong> {{ bidItem?.itemName }} ({{ bidItem?.itemCode }})</p>
            <p><strong>Quantity:</strong> {{ bidItem?.quantity }} {{ bidItem?.uom }}</p>
            <p><strong>Request #:</strong> {{ bidItem?.requestNumber }}</p>
          </div>
          
          <div class="form-group">
            <label>Sales Person *</label>
            <select v-model="newBid.employee" class="form-input">
              <option value="">Select Sales Person</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.name">
                {{ emp.name }} - {{ emp.department }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Unit Price (ETB) *</label>
              <input 
                type="number" 
                v-model="newBid.unitPrice" 
                class="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                @input="calculateBidTotal"
              />
            </div>
            <div class="form-group">
              <label>Total Price (ETB)</label>
              <input type="text" :value="newBid.totalPrice.toFixed(2)" class="form-input" disabled readonly />
              <span class="hint">Unit Price × Quantity</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Discount (ETB)</label>
              <input 
                type="number" 
                v-model="newBid.discount" 
                class="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                @input="calculateBidTotal"
              />
            </div>
            <div class="form-group">
              <label>Final Price (ETB)</label>
              <input type="text" :value="newBid.finalPrice.toFixed(2)" class="form-input final-amount" disabled readonly />
              <span class="hint">Total Price - Discount</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>Does this match the requirement?</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="newBid.matchesRequirement" :value="true" />
                ✅ Yes - Match
              </label>
              <label class="radio-label">
                <input type="radio" v-model="newBid.matchesRequirement" :value="false" />
                ❌ No - Not Match
              </label>
            </div>
          </div>
          
          <div class="form-group" v-if="newBid.matchesRequirement === false">
            <label>Reason / What's different? *</label>
            <textarea v-model="newBid.remark" class="form-textarea" rows="2" placeholder="Why doesn't this match the requirement?" />
          </div>
          
          <div class="form-group">
            <label>Additional Notes</label>
            <textarea v-model="newBid.notes" class="form-textarea" rows="2" placeholder="Additional notes..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showBidModal = false">Cancel</button>
          <button class="btn-primary" @click="submitBid" :disabled="!isBidValid">Submit Price</button>
        </div>
      </div>
    </div>

    <!-- ==================== EDIT MODAL ==================== -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>✏️ Edit Price - {{ editTarget?.item.itemName }}</h3>
          <button class="modal-close" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-box">
            <p><strong>Employee:</strong> {{ editTarget?.bid.employee }}</p>
            <p><strong>Item:</strong> {{ editTarget?.item.itemName }}</p>
            <p><strong>Quantity:</strong> {{ editTarget?.item.quantity }} {{ editTarget?.item.uom }}</p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Unit Price (ETB) *</label>
              <input 
                type="number" 
                v-model="editData.unitPrice" 
                class="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                @input="calculateEditTotal"
              />
            </div>
            <div class="form-group">
              <label>Total Price (ETB)</label>
              <input type="text" :value="editData.totalPrice.toFixed(2)" class="form-input" disabled readonly />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Discount (ETB)</label>
              <input 
                type="number" 
                v-model="editData.discount" 
                class="form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                @input="calculateEditTotal"
              />
            </div>
            <div class="form-group">
              <label>Final Price (ETB)</label>
              <input type="text" :value="editData.finalPrice.toFixed(2)" class="form-input final-amount" disabled readonly />
            </div>
          </div>
          
          <div class="form-group">
            <label>Does this match the requirement?</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="editData.matchesRequirement" :value="true" />
                ✅ Yes - Match
              </label>
              <label class="radio-label">
                <input type="radio" v-model="editData.matchesRequirement" :value="false" />
                ❌ No - Not Match
              </label>
            </div>
          </div>
          
          <div class="form-group" v-if="editData.matchesRequirement === false">
            <label>Reason / What's different? *</label>
            <textarea v-model="editData.remark" class="form-textarea" rows="2" placeholder="Why doesn't this match the requirement?" />
          </div>
          
          <div class="form-group">
            <label>Additional Notes</label>
            <textarea v-model="editData.notes" class="form-textarea" rows="2" placeholder="Additional notes..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showEditModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmEdit" :disabled="!isEditValid">Update Price</button>
        </div>
      </div>
    </div>

    <!-- ==================== REMOVE MODAL ==================== -->
    <div v-if="showRemoveModal" class="modal-overlay" @click.self="showRemoveModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>⚠️ Remove Price</h3>
          <button class="modal-close" @click="showRemoveModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="remove-info">
            <div class="remove-icon">🗑️</div>
            <p class="remove-title">Are you sure you want to remove this price?</p>
            <div class="remove-details">
              <div class="remove-row">
                <span class="remove-label">Employee:</span>
                <span class="remove-value">{{ removeTarget?.bid.employee }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Item:</span>
                <span class="remove-value">{{ removeTarget?.item.itemName }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Unit Price:</span>
                <span class="remove-value">ETB {{ removeTarget?.bid.unitPrice.toFixed(2) }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Final Price:</span>
                <span class="remove-value">ETB {{ removeTarget?.bid.finalPrice.toFixed(2) }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Status:</span>
                <span class="remove-value">
                  <span v-if="removeTarget?.bid.isWinner" class="winner-badge">🏆 Winner</span>
                  <span v-else-if="removeTarget?.bid.matchesRequirement === false" class="not-match-badge">❌ Not Match</span>
                  <span v-else-if="removeTarget?.bid.matchesRequirement === true" class="match-badge">✅ Match</span>
                  <span v-else class="bid-status pending">⏳ Pending</span>
                </span>
              </div>
              <div class="remove-row" v-if="removeTarget?.bid.remark">
                <span class="remove-label">Reason:</span>
                <span class="remove-value">{{ removeTarget.bid.remark }}</span>
              </div>
            </div>
            <div class="form-group remove-remark">
              <label>Additional Remark</label>
              <textarea v-model="removeRemark" class="form-textarea" rows="2" placeholder="Enter reason for removal..." />
            </div>
            <p v-if="removeTarget?.bid.isWinner" class="remove-warning">
              ⚠️ This is the current winner. Removing it will reset the winner selection for this item.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showRemoveModal = false">Cancel</button>
          <button class="btn-danger" @click="confirmRemove">Yes, Remove</button>
        </div>
      </div>
    </div>

    <!-- ==================== PAYMENT MODAL ==================== -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>💳 Make Payment - {{ paymentItem?.itemName }}</h3>
          <button class="modal-close" @click="showPaymentModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-box" v-if="paymentItem">
            <p><strong>Item:</strong> {{ paymentItem?.itemName }}</p>
            <p><strong>Quantity:</strong> {{ paymentItem?.quantity }} {{ paymentItem?.uom }}</p>
            <p><strong>Winner:</strong> {{ getWinnerBid(paymentItem)?.employee || 'Not selected' }}</p>
            <p><strong>Final Price:</strong> ETB {{ getWinnerBid(paymentItem)?.finalPrice?.toFixed(2) || getLowestBid(paymentItem).toFixed(2) }}</p>
          </div>

          <div class="form-group">
            <label>Winning Sales Person (Info) *</label>
            <input type="text" :value="paymentDetails.employee" class="form-input" disabled readonly />
            <span class="hint">This is the winning sales person for this item</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Unit Price</label>
              <input type="text" :value="paymentDetails.unitPrice.toFixed(2)" class="form-input" disabled readonly />
            </div>
            <div class="form-group">
              <label>Quantity</label>
              <input type="text" :value="paymentItem?.quantity" class="form-input" disabled readonly />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Total Amount</label>
              <input type="text" :value="paymentDetails.totalAmount.toFixed(2)" class="form-input" disabled readonly />
            </div>
            <div class="form-group">
              <label>Discount</label>
              <input type="text" :value="paymentDetails.discount.toFixed(2)" class="form-input" disabled readonly />
            </div>
          </div>

          <div class="form-group">
            <label>Final Amount to Pay (ETB) *</label>
            <input type="text" :value="paymentDetails.finalAmount.toFixed(2)" class="form-input final-amount" disabled readonly />
            <span class="hint">Final amount to pay for this item</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Who is Paying? *</label>
              <select v-model="paymentDetails.paidBy" class="form-input">
                <option value="">Select Person</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.name">
                  {{ emp.name }} - {{ emp.department }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Transfer Number *</label>
              <input v-model="paymentDetails.transferNumber" class="form-input" placeholder="Transfer reference #" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Bank *</label>
              <select v-model="paymentDetails.bank" class="form-input">
                <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</option>
                <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                <option value="Awash Bank">Awash Bank</option>
                <option value="Dashen Bank">Dashen Bank</option>
                <option value="Hibret Bank">Hibret Bank</option>
                <option value="Oromia Bank">Oromia Bank</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Payment Date</label>
              <input type="date" v-model="paymentDetails.paymentDate" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Remark</label>
            <textarea v-model="paymentDetails.remark" class="form-textarea" rows="2" placeholder="Additional notes..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showPaymentModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmPayment" :disabled="!isPaymentValid">Confirm Payment</button>
        </div>
      </div>
    </div>

    <!-- ==================== ARRIVED MODAL ==================== -->
    <div v-if="showArrivedModal" class="modal-overlay" @click.self="showArrivedModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>📦 Mark as Arrived at SDT - {{ arrivedItem?.itemName }}</h3>
          <button class="modal-close" @click="showArrivedModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="arrived-info">
            <div class="arrived-icon">📦</div>
            <p class="arrived-title">Are you sure you want to mark this item as arrived at SDT?</p>
            <div class="arrived-details">
              <div class="arrived-row">
                <span class="arrived-label">Item:</span>
                <span class="arrived-value">{{ arrivedItem?.itemName }}</span>
              </div>
              <div class="arrived-row">
                <span class="arrived-label">Quantity:</span>
                <span class="arrived-value">{{ arrivedItem?.quantity }} {{ arrivedItem?.uom }}</span>
              </div>
              <div class="arrived-row">
                <span class="arrived-label">Supplier:</span>
                <span class="arrived-value">{{ arrivedItem?.paymentDetails?.employee || 'N/A' }}</span>
              </div>
              <div class="arrived-row">
                <span class="arrived-label">Final Amount:</span>
                <span class="arrived-value amount">ETB {{ arrivedItem?.paymentDetails?.finalAmount?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
            <div class="form-group arrived-remark">
              <label>Remark (Optional)</label>
              <textarea v-model="arrivedRemark" class="form-textarea" rows="2" placeholder="Enter arrival remarks..." />
            </div>
            <p class="arrived-confirm-text">
              ✅ This will update the status to <strong>"Arrived at SDT"</strong> and log the arrival date for this item.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showArrivedModal = false">Cancel</button>
          <button class="btn-primary" @click="confirmArrived">✅ Confirm Arrived</button>
        </div>
      </div>
    </div>

    <!-- ==================== ADD INFO MODAL ==================== -->
    <div v-if="showAddInfoModal" class="modal-overlay" @click.self="showAddInfoModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>📎 Add Additional Info - {{ addInfoItem?.itemName }}</h3>
          <button class="modal-close" @click="showAddInfoModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-box">
            <p><strong>Item:</strong> {{ addInfoItem?.itemName }}</p>
            <p><strong>Quantity:</strong> {{ addInfoItem?.quantity }} {{ addInfoItem?.uom }}</p>
          </div>
          
          <div class="form-group">
            <label>Specifications</label>
            <textarea v-model="additionalInfoData.specs" class="form-textarea" rows="3" placeholder="Enter specifications..." />
          </div>
          
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="additionalInfoData.notes" class="form-textarea" rows="2" placeholder="Additional notes..." />
          </div>
          
          <div class="form-group">
            <label>Image URLs</label>
            <div class="image-input-group">
              <div v-for="(img, index) in additionalInfoData.images" :key="index" class="image-input-row">
                <input v-model="additionalInfoData.images[index]" class="form-input" placeholder="Image URL" />
                <button class="btn-remove-image" @click="removeAddImage(index)">✕</button>
              </div>
              <button class="btn-add-image" @click="addAddImage">➕ Add Image URL</button>
            </div>
          </div>
          
          <div class="image-preview" v-if="additionalInfoData.images && additionalInfoData.images.length > 0">
            <div v-for="(img, index) in additionalInfoData.images" :key="index" class="image-preview-item">
              <img :src="img" :alt="'Image ' + (index + 1)" @error="handleImageError" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddInfoModal = false">Cancel</button>
          <button class="btn-primary" @click="saveAdditionalInfo">Save Information</button>
        </div>
      </div>
    </div>

    <!-- ==================== VIEW INFO MODAL ==================== -->
    <div v-if="showViewInfoModal" class="modal-overlay" @click.self="showViewInfoModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>📋 Additional Information - {{ viewInfoTarget?.itemName }}</h3>
          <button class="modal-close" @click="showViewInfoModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="viewInfoTarget?.additionalInfo">
            <div class="view-info-section" v-if="viewInfoTarget.additionalInfo.specs">
              <h4>📋 Specifications</h4>
              <div class="view-info-content">{{ viewInfoTarget.additionalInfo.specs }}</div>
            </div>
            <div class="view-info-section" v-if="viewInfoTarget.additionalInfo.notes">
              <h4>📝 Notes</h4>
              <div class="view-info-content">{{ viewInfoTarget.additionalInfo.notes }}</div>
            </div>
            <div class="view-info-section" v-if="viewInfoTarget.additionalInfo.images && viewInfoTarget.additionalInfo.images.length > 0">
              <h4>🖼️ Images</h4>
              <div class="view-image-grid">
                <div v-for="(img, index) in viewInfoTarget.additionalInfo.images" :key="index" class="view-image-grid-item">
                  <img :src="img" :alt="'Image ' + (index + 1)" @error="handleImageError" />
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-info">No additional information available</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showViewInfoModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

// ================================================================
// TYPES
// ================================================================

interface PurchaseItem {
  id: number
  requestId: number
  requestNumber: string
  itemName: string
  itemCode: string
  quantity: number
  uom: string
  requestedBy: string
  department: string
  departmentId: number
  requestDate: string
  importedDate?: string
  status: 'pending_bids' | 'bidding' | 'purchased' | 'arrived'
  description?: string
  bids?: Bid[]
  paymentDetails?: PaymentDetails
  arrivalDetails?: ArrivalDetails
  additionalInfo?: AdditionalInfo
  imported?: boolean
  hasWinner?: boolean
}

interface RequestGroup {
  requestId: number
  requestNumber: string
  requestedBy: string
  department: string
  departmentId: number
  requestDate: string
  status: 'pending_bids' | 'bidding' | 'purchased' | 'arrived'
  items: PurchaseItem[]
}

interface Bid {
  id: number
  employee: string
  unitPrice: number
  totalPrice: number
  discount: number
  finalPrice: number
  submittedDate: string
  status: string
  isWinner: boolean
  matchesRequirement?: boolean
  remark?: string
  notes?: string
}

interface PaymentDetails {
  employee: string
  unitPrice: number
  totalAmount: number
  discount: number
  finalAmount: number
  paidBy: string
  transferNumber: string
  bank: string
  paymentDate: string
  remark?: string
}

interface AdditionalInfo {
  specs?: string
  notes?: string
  images?: string[]
}

interface ArrivalDetails {
  arrivedDate: string
  remark?: string
}

interface RemoveTarget {
  item: PurchaseItem
  bid: Bid
}

interface EditTarget {
  item: PurchaseItem
  bid: Bid
}

// ================================================================
// DEMO DATA - ALL ITEMS START WITH NO PRICES
// ================================================================

const departments = [
  { id: 1, name: 'Production' },
  { id: 2, name: 'Maintenance' },
  { id: 3, name: 'Quality Control' },
  { id: 4, name: 'Warehouse' },
  { id: 5, name: 'Administration' },
  { id: 6, name: 'Sales' },
  { id: 7, name: 'IT' }
]

const employees = [
  { id: 1, name: 'Abebe Kebede', department: 'Sales' },
  { id: 2, name: 'Selam Tesfaye', department: 'Sales' },
  { id: 3, name: 'Mekonnen Alemu', department: 'Sales' },
  { id: 4, name: 'Tigist Hailu', department: 'Sales' },
  { id: 5, name: 'Dawit Solomon', department: 'Sales' },
  { id: 6, name: 'Meron Ayele', department: 'Sales' },
  { id: 7, name: 'Fikru Tsegaye', department: 'Sales' }
]

const itemNames = [
  { name: 'Steel Pipe 2 inch', code: 'SP-002' },
  { name: 'Industrial Paint', code: 'IP-100' },
  { name: 'Conveyor Belt 10m', code: 'CB-010' },
  { name: 'Hydraulic Pump', code: 'HP-500' },
  { name: 'PVC Pipe 50mm', code: 'PVC-050' },
  { name: 'Electrical Cable 100m', code: 'EC-100' },
  { name: 'Motor 5HP', code: 'M-5HP' },
  { name: 'Aluminum Sheet', code: 'AS-002' },
  { name: 'Bolts and Nuts Set', code: 'BN-001' },
  { name: 'Lubricant Oil', code: 'LO-200' }
]

const generateDemoItems = (): PurchaseItem[] => {
  const items: PurchaseItem[] = []
  let itemId = 1
  
  for (let requestId = 1; requestId <= 8; requestId++) {
    const dept = departments[requestId % departments.length]
    const requestDate = new Date()
    requestDate.setDate(requestDate.getDate() - (requestId * 2) - (requestId % 5))
    
    // All items start with pending_bids status - NO PRICES
    const status: 'pending_bids' | 'bidding' | 'purchased' | 'arrived' = 'pending_bids'
    
    // Each order has 2-4 items
    const itemCount = 2 + (requestId % 3)
    
    for (let j = 0; j < itemCount; j++) {
      const item = itemNames[(requestId + j) % itemNames.length]
      const qty = 5 + (requestId * 2 % 20) + (j * 3)
      
      const purchaseItem: PurchaseItem = {
        id: itemId++,
        requestId: requestId,
        requestNumber: `PR-2026-${String(1000 + requestId).padStart(4, '0')}`,
        itemName: item.name,
        itemCode: item.code,
        quantity: qty,
        uom: ['PCS', 'LTR', 'ROLL', 'SET', 'KG', 'BOX'][j % 6],
        requestedBy: ['Abebe Kebede', 'Selam Tesfaye', 'Mekonnen Alemu', 'Tigist Hailu', 'Dawit Solomon', 'Meron Ayele'][requestId % 6],
        department: dept.name,
        departmentId: dept.id,
        requestDate: requestDate.toISOString().split('T')[0],
        importedDate: new Date(requestDate.getTime() + 2 * 86400000).toISOString().split('T')[0],
        status: status,
        description: requestId % 3 === 0 && j === 0 ? 'Rush order' : '',
        imported: true,
        hasWinner: false,
        bids: [] // NO DEMO PRICES - EMPTY ARRAY
      }
      
      items.push(purchaseItem)
    }
  }
  
  return items
}

// ================================================================
// STATE
// ================================================================

const allItems = ref<PurchaseItem[]>(generateDemoItems())
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('all')
const filterDepartment = ref('all')
const currentPage = ref(1)
const pageSize = ref(5)
const expandedRequest = ref<number | null>(null)

const showBidModal = ref(false)
const showPaymentModal = ref(false)
const showRemoveModal = ref(false)
const showEditModal = ref(false)
const showAddInfoModal = ref(false)
const showViewInfoModal = ref(false)
const showArrivedModal = ref(false)
const bidItem = ref<PurchaseItem | null>(null)
const paymentItem = ref<PurchaseItem | null>(null)
const removeTarget = ref<RemoveTarget | null>(null)
const editTarget = ref<EditTarget | null>(null)
const addInfoItem = ref<PurchaseItem | null>(null)
const viewInfoTarget = ref<PurchaseItem | null>(null)
const arrivedItem = ref<PurchaseItem | null>(null)
const removeRemark = ref('')
const arrivedRemark = ref('')

const newBid = ref({
  employee: '',
  unitPrice: 0,
  totalPrice: 0,
  discount: 0,
  finalPrice: 0,
  matchesRequirement: true,
  remark: '',
  notes: ''
})

const editData = ref({
  unitPrice: 0,
  totalPrice: 0,
  discount: 0,
  finalPrice: 0,
  matchesRequirement: true,
  remark: '',
  notes: ''
})

const additionalInfoData = ref({
  specs: '',
  notes: '',
  images: [] as string[]
})

const paymentDetails = ref({
  employee: '',
  unitPrice: 0,
  totalAmount: 0,
  discount: 0,
  finalAmount: 0,
  paidBy: '',
  transferNumber: '',
  bank: 'Commercial Bank of Ethiopia',
  paymentDate: new Date().toISOString().split('T')[0],
  remark: ''
})

// ================================================================
// COMPUTED
// ================================================================

const followUpItems = computed(() => allItems.value.filter(r => r.imported === true))
const availableItems = computed(() => allItems.value.filter(r => r.imported === false))
const availableItemsCount = computed(() => availableItems.value.filter(r => !r.imported).length)

const totalItemsCount = computed(() => followUpItems.value.length)
const pendingItems = computed(() => followUpItems.value.filter(r => r.status === 'pending_bids').length)
const biddingItems = computed(() => followUpItems.value.filter(r => r.status === 'bidding').length)
const purchasedItems = computed(() => followUpItems.value.filter(r => r.status === 'purchased' || r.status === 'arrived').length)
const arrivedItems = computed(() => followUpItems.value.filter(r => r.status === 'arrived').length)

const hasActiveFilters = computed(() => filterStatus.value !== 'all' || filterDepartment.value !== 'all' || searchQuery.value)

// Group items by requestId
const groupedRequests = computed(() => {
  const groups: Record<number, RequestGroup> = {}
  
  followUpItems.value.forEach(item => {
    if (!groups[item.requestId]) {
      groups[item.requestId] = {
        requestId: item.requestId,
        requestNumber: item.requestNumber,
        requestedBy: item.requestedBy,
        department: item.department,
        departmentId: item.departmentId,
        requestDate: item.requestDate,
        status: item.status,
        items: []
      }
    }
    groups[item.requestId].items.push(item)
  })
  
  // Determine overall status for the group
  Object.values(groups).forEach(group => {
    const statuses = group.items.map(i => i.status)
    if (statuses.every(s => s === 'arrived')) {
      group.status = 'arrived'
    } else if (statuses.every(s => s === 'purchased' || s === 'arrived')) {
      group.status = 'purchased'
    } else if (statuses.some(s => s === 'bidding')) {
      group.status = 'bidding'
    } else {
      group.status = 'pending_bids'
    }
  })
  
  return Object.values(groups)
})

const filteredGroups = computed(() => {
  return groupedRequests.value.filter(group => {
    const matchSearch = !searchQuery.value ||
      group.requestNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      group.requestedBy.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      group.items.some(item => item.itemName.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const matchStatus = filterStatus.value === 'all' || group.status === filterStatus.value
    const matchDepartment = filterDepartment.value === 'all' || group.departmentId === Number(filterDepartment.value)
    
    return matchSearch && matchStatus && matchDepartment
  })
})

const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredGroups.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredGroups.value.length / pageSize.value) || 1)

const isBidValid = computed(() => {
  return newBid.value.employee &&
    newBid.value.unitPrice > 0 &&
    (newBid.value.matchesRequirement !== false || (newBid.value.matchesRequirement === false && newBid.value.remark))
})

const isEditValid = computed(() => {
  return editData.value.unitPrice > 0 &&
    (editData.value.matchesRequirement !== false || (editData.value.matchesRequirement === false && editData.value.remark))
})

const isPaymentValid = computed(() => {
  return paymentDetails.value.employee &&
    paymentDetails.value.finalAmount > 0 &&
    paymentDetails.value.paidBy &&
    paymentDetails.value.transferNumber &&
    paymentDetails.value.bank
})

// ================================================================
// METHODS
// ================================================================

const getItemNames = (items: PurchaseItem[]): string => {
  return items.map(item => item.itemName).join(', ')
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending_bids: 'Pending',
    bidding: 'Price Collection',
    purchased: 'Purchased',
    arrived: 'Arrived at SDT'
  }
  return labels[status] || status
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const toggleExpand = (requestId: number): void => {
  expandedRequest.value = expandedRequest.value === requestId ? null : requestId
}

const isActionDisabled = (item: PurchaseItem): boolean => {
  return item.status === 'arrived'
}

const onSearchChange = (): void => { currentPage.value = 1 }
const onFilterChange = (): void => { currentPage.value = 1 }
const changePage = (page: number): void => { if (page >= 1 && page <= totalPages.value) currentPage.value = page }
const changePageSize = (): void => { currentPage.value = 1 }

const clearFilters = (): void => {
  filterStatus.value = 'all'
  filterDepartment.value = 'all'
  searchQuery.value = ''
  currentPage.value = 1
}

const refreshData = () => {
  allItems.value = generateDemoItems()
}

// ================================================================
// CALCULATIONS
// ================================================================

const calculateBidTotal = () => {
  if (bidItem.value) {
    const totalPrice = newBid.value.unitPrice * bidItem.value.quantity
    newBid.value.totalPrice = totalPrice
    newBid.value.finalPrice = Math.max(0, totalPrice - newBid.value.discount)
  }
}

const calculateEditTotal = () => {
  if (editTarget.value) {
    const totalPrice = editData.value.unitPrice * editTarget.value.item.quantity
    editData.value.totalPrice = totalPrice
    editData.value.finalPrice = Math.max(0, totalPrice - editData.value.discount)
  }
}

// ================================================================
// BID HELPERS
// ================================================================

const getLowestBid = (item: PurchaseItem): number => {
  if (!item.bids || item.bids.length === 0) return 0
  const sorted = getSortedBids(item)
  return sorted.length > 0 ? sorted[0].finalPrice : 0
}

const getWinnerBid = (item: PurchaseItem): Bid | null => {
  if (!item.bids) return null
  return item.bids.find(b => b.isWinner) || null
}

const getSortedBids = (item: PurchaseItem): Bid[] => {
  if (!item.bids) return []
  
  const winner = item.bids.find(b => b.isWinner)
  const others = item.bids.filter(b => !b.isWinner)
  
  const sortedOthers = [...others].sort((a, b) => a.finalPrice - b.finalPrice)
  
  return winner ? [winner, ...sortedOthers] : sortedOthers
}

// ================================================================
// ADDITIONAL INFO METHODS
// ================================================================

const openAddInfoModal = (item: PurchaseItem) => {
  if (isActionDisabled(item)) return
  addInfoItem.value = item
  additionalInfoData.value = {
    specs: item.additionalInfo?.specs || '',
    notes: item.additionalInfo?.notes || '',
    images: item.additionalInfo?.images ? [...item.additionalInfo.images] : []
  }
  showAddInfoModal.value = true
}

const saveAdditionalInfo = () => {
  if (!addInfoItem.value) return
  
  const index = allItems.value.findIndex(r => r.id === addInfoItem.value?.id)
  if (index !== -1) {
    const validImages = additionalInfoData.value.images.filter(img => img.trim() !== '')
    
    allItems.value[index].additionalInfo = {
      specs: additionalInfoData.value.specs || undefined,
      notes: additionalInfoData.value.notes || undefined,
      images: validImages.length > 0 ? validImages : undefined
    }
  }
  
  showAddInfoModal.value = false
  addInfoItem.value = null
}

const viewAdditionalInfo = (item: PurchaseItem) => {
  viewInfoTarget.value = item
  showViewInfoModal.value = true
}

const addAddImage = () => {
  additionalInfoData.value.images.push('')
}

const removeAddImage = (index: number) => {
  additionalInfoData.value.images.splice(index, 1)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// ================================================================
// GROUP ACTIONS
// ================================================================

const openBidForGroup = (group: RequestGroup) => {
  // Find the first item in the group that needs a price
  const item = group.items.find(i => i.status === 'pending_bids' || i.status === 'bidding')
  if (item) {
    openBidModal(item)
  }
}

const openPaymentForGroup = (group: RequestGroup) => {
  // Find the first item in the group that has bids and is not yet paid
  const item = group.items.find(i => (i.status === 'bidding' || i.status === 'purchased') && i.bids && i.bids.length > 0 && !i.paymentDetails)
  if (item) {
    openPaymentModal(item)
  } else {
    // If no item needs payment, find any item with bids
    const anyItem = group.items.find(i => i.bids && i.bids.length > 0 && i.status !== 'arrived')
    if (anyItem) {
      openPaymentModal(anyItem)
    }
  }
}

// ================================================================
// BID/PRICE METHODS
// ================================================================

const openBidModal = (item: PurchaseItem) => {
  if (isActionDisabled(item)) return
  bidItem.value = item
  newBid.value = {
    employee: '',
    unitPrice: 0,
    totalPrice: 0,
    discount: 0,
    finalPrice: 0,
    matchesRequirement: true,
    remark: '',
    notes: ''
  }
  showBidModal.value = true
}

const submitBid = () => {
  if (!bidItem.value) return
  if (!isBidValid.value) {
    alert('Please fill in all required fields')
    return
  }
  
  const index = allItems.value.findIndex(r => r.id === bidItem.value?.id)
  if (index !== -1) {
    const item = allItems.value[index]
    if (!item.bids) item.bids = []
    
    const totalPrice = newBid.value.unitPrice * item.quantity
    const finalPrice = Math.max(0, totalPrice - newBid.value.discount)
    
    // Check if this bid should be the winner
    const matchingBids = item.bids.filter(b => b.matchesRequirement === true)
    const isLowestMatch = newBid.value.matchesRequirement === true && 
      (matchingBids.length === 0 || 
        finalPrice < Math.min(...matchingBids.map(b => b.finalPrice)))
    
    const shouldBeWinner = newBid.value.matchesRequirement === true && isLowestMatch
    
    const newBidEntry: Bid = {
      id: Date.now(),
      employee: newBid.value.employee,
      unitPrice: newBid.value.unitPrice,
      totalPrice: totalPrice,
      discount: newBid.value.discount,
      finalPrice: finalPrice,
      submittedDate: new Date().toISOString().split('T')[0],
      status: shouldBeWinner ? 'accepted' : 'pending',
      isWinner: shouldBeWinner,
      matchesRequirement: newBid.value.matchesRequirement,
      remark: newBid.value.matchesRequirement === false ? newBid.value.remark : undefined,
      notes: newBid.value.notes
    }
    
    item.bids.push(newBidEntry)
    item.hasWinner = shouldBeWinner
    
    if (shouldBeWinner) {
      item.bids.forEach(b => {
        if (b.id !== newBidEntry.id) {
          b.isWinner = false
          b.status = 'rejected'
        }
      })
    }
    
    // Update status to bidding if it was pending
    if (item.status === 'pending_bids') {
      item.status = 'bidding'
    }
  }
  
  showBidModal.value = false
  bidItem.value = null
}

// ================================================================
// EDIT METHODS
// ================================================================

const openEditModal = (item: PurchaseItem, bid: Bid) => {
  if (isActionDisabled(item)) return
  editTarget.value = { item, bid }
  
  editData.value = {
    unitPrice: bid.unitPrice,
    totalPrice: bid.totalPrice,
    discount: bid.discount,
    finalPrice: bid.finalPrice,
    matchesRequirement: bid.matchesRequirement !== false,
    remark: bid.remark || '',
    notes: bid.notes || ''
  }
  showEditModal.value = true
}

const confirmEdit = () => {
  if (!editTarget.value) return
  if (!isEditValid.value) {
    alert('Please fill in all required fields')
    return
  }
  
  const { item, bid } = editTarget.value
  const index = allItems.value.findIndex(r => r.id === item.id)
  
  if (index !== -1) {
    const itemRef = allItems.value[index]
    if (itemRef.bids) {
      const bidIndex = itemRef.bids.findIndex(b => b.id === bid.id)
      if (bidIndex !== -1) {
        const totalPrice = editData.value.unitPrice * item.quantity
        const finalPrice = Math.max(0, totalPrice - editData.value.discount)
        
        const otherMatchingBids = itemRef.bids.filter((b, idx) => 
          b.matchesRequirement === true && idx !== bidIndex
        )
        const isLowestMatch = editData.value.matchesRequirement === true && 
          (otherMatchingBids.length === 0 || 
            finalPrice < Math.min(...otherMatchingBids.map(b => b.finalPrice)))
        
        const wasWinner = bid.isWinner
        
        itemRef.bids[bidIndex] = {
          ...itemRef.bids[bidIndex],
          unitPrice: editData.value.unitPrice,
          totalPrice: totalPrice,
          discount: editData.value.discount,
          finalPrice: finalPrice,
          matchesRequirement: editData.value.matchesRequirement,
          remark: editData.value.matchesRequirement === false ? editData.value.remark : undefined,
          notes: editData.value.notes,
          isWinner: wasWinner && editData.value.matchesRequirement === true ? true : false,
          status: wasWinner && editData.value.matchesRequirement === true ? 'accepted' : 'pending'
        }
        
        if (wasWinner && editData.value.matchesRequirement === false) {
          const matchingBids = itemRef.bids.filter(b => b.matchesRequirement === true)
          if (matchingBids.length > 0) {
            const lowestMatch = matchingBids.reduce((a, b) => a.finalPrice < b.finalPrice ? a : b)
            lowestMatch.isWinner = true
            lowestMatch.status = 'accepted'
            itemRef.hasWinner = true
          } else {
            itemRef.bids.forEach(b => {
              b.isWinner = false
              b.status = 'pending'
            })
            itemRef.hasWinner = false
          }
        }
        
        if (editData.value.matchesRequirement === true && isLowestMatch) {
          itemRef.bids.forEach(b => {
            if (b.id !== itemRef.bids[bidIndex].id) {
              b.isWinner = false
              b.status = 'rejected'
            }
          })
          itemRef.bids[bidIndex].isWinner = true
          itemRef.bids[bidIndex].status = 'accepted'
          itemRef.hasWinner = true
        }
      }
    }
  }
  
  showEditModal.value = false
  editTarget.value = null
}

// ================================================================
// REMOVE METHODS
// ================================================================

const openRemoveModal = (item: PurchaseItem, bid: Bid) => {
  if (isActionDisabled(item)) return
  removeTarget.value = { item, bid }
  removeRemark.value = ''
  showRemoveModal.value = true
}

const confirmRemove = () => {
  if (!removeTarget.value) return
  
  const { item, bid } = removeTarget.value
  const index = allItems.value.findIndex(r => r.id === item.id)
  
  if (index !== -1) {
    const itemRef = allItems.value[index]
    if (itemRef.bids) {
      itemRef.bids = itemRef.bids.filter(b => b.id !== bid.id)
      
      if (bid.isWinner) {
        const matchingBids = itemRef.bids.filter(b => b.matchesRequirement === true)
        if (matchingBids.length > 0) {
          const lowestMatch = matchingBids.reduce((a, b) => a.finalPrice < b.finalPrice ? a : b)
          lowestMatch.isWinner = true
          lowestMatch.status = 'accepted'
          itemRef.hasWinner = true
        } else {
          if (itemRef.bids.length > 0) {
            const lowestBid = itemRef.bids.reduce((a, b) => a.finalPrice < b.finalPrice ? a : b)
            lowestBid.isWinner = true
            lowestBid.status = 'accepted'
            itemRef.hasWinner = true
          } else {
            itemRef.hasWinner = false
          }
        }
      }
      
      if (itemRef.bids.length === 0) {
        itemRef.status = 'pending_bids'
        itemRef.paymentDetails = undefined
        itemRef.arrivalDetails = undefined
        itemRef.hasWinner = false
      }
    }
  }
  
  showRemoveModal.value = false
  removeTarget.value = null
  removeRemark.value = ''
}

// ================================================================
// PAYMENT METHODS
// ================================================================

const openPaymentModal = (item: PurchaseItem) => {
  if (isActionDisabled(item)) return
  
  // Check if item has bids
  if (!item.bids || item.bids.length === 0) {
    alert('No prices submitted for this item yet. Please submit prices first.')
    return
  }
  
  paymentItem.value = item
  
  const winnerBid = getWinnerBid(item)
  if (winnerBid) {
    paymentDetails.value.employee = winnerBid.employee
    paymentDetails.value.unitPrice = winnerBid.unitPrice
    paymentDetails.value.totalAmount = winnerBid.totalPrice
    paymentDetails.value.discount = winnerBid.discount
    paymentDetails.value.finalAmount = winnerBid.finalPrice
  } else {
    // If no winner yet, use the lowest bid
    const sortedBids = getSortedBids(item)
    if (sortedBids.length > 0) {
      const lowestBid = sortedBids[0]
      if (lowestBid) {
        paymentDetails.value.employee = lowestBid.employee
        paymentDetails.value.unitPrice = lowestBid.unitPrice
        paymentDetails.value.totalAmount = lowestBid.totalPrice
        paymentDetails.value.discount = lowestBid.discount
        paymentDetails.value.finalAmount = lowestBid.finalPrice
      }
    }
  }
  
  paymentDetails.value.paidBy = ''
  paymentDetails.value.transferNumber = ''
  paymentDetails.value.bank = 'Commercial Bank of Ethiopia'
  paymentDetails.value.paymentDate = new Date().toISOString().split('T')[0]
  paymentDetails.value.remark = ''
  
  showPaymentModal.value = true
}

const confirmPayment = () => {
  if (!paymentItem.value) return
  if (!isPaymentValid.value) {
    alert('Please fill in all required fields')
    return
  }
  
  const index = allItems.value.findIndex(r => r.id === paymentItem.value?.id)
  if (index !== -1) {
    const item = allItems.value[index]
    
    // Mark the winning bid
    item.bids?.forEach(b => {
      b.isWinner = b.employee === paymentDetails.value.employee
      b.status = b.employee === paymentDetails.value.employee ? 'accepted' : 'rejected'
    })
    item.hasWinner = true
    
    // Save payment details
    item.paymentDetails = {
      employee: paymentDetails.value.employee,
      unitPrice: paymentDetails.value.unitPrice,
      totalAmount: paymentDetails.value.totalAmount,
      discount: paymentDetails.value.discount,
      finalAmount: paymentDetails.value.finalAmount,
      paidBy: paymentDetails.value.paidBy,
      transferNumber: paymentDetails.value.transferNumber,
      bank: paymentDetails.value.bank,
      paymentDate: paymentDetails.value.paymentDate ?? new Date().toISOString().split('T')[0],
      remark: paymentDetails.value.remark
    }
    
    // Update status to purchased
    item.status = 'purchased'
  }
  
  showPaymentModal.value = false
  paymentItem.value = null
}

// ================================================================
// ARRIVED METHODS
// ================================================================

const openArrivedModal = (item: PurchaseItem) => {
  if (item.status !== 'purchased') {
    alert('Only purchased items can be marked as arrived at SDT.')
    return
  }
  
  arrivedItem.value = item
  arrivedRemark.value = ''
  showArrivedModal.value = true
}

const confirmArrived = () => {
  if (!arrivedItem.value) return
  
  const index = allItems.value.findIndex(r => r.id === arrivedItem.value?.id)
  if (index !== -1) {
    const item = allItems.value[index]
    if (item) {
      item.status = 'arrived'
      item.arrivalDetails = {
        arrivedDate: new Date().toISOString().slice(0, 10),
        remark: arrivedRemark.value || 'Item arrived at SDT warehouse'
      }
    }
  }
  
  showArrivedModal.value = false
  arrivedItem.value = null
  arrivedRemark.value = ''
}

// ================================================================
// EXPORT
// ================================================================

const exportData = () => {
  const headers = ['Request #', 'Item', 'Code', 'Quantity', 'UOM', 'Requested By', 'Department', 'Request Date', 'Status', 'Unit Price', 'Total Price', 'Discount', 'Final Price', 'Winner']
  const rows = allItems.value.filter(i => i.imported).map(item => {
    const winner = getWinnerBid(item)
    return [
      item.requestNumber,
      item.itemName,
      item.itemCode,
      item.quantity,
      item.uom,
      item.requestedBy,
      item.department,
      formatDate(item.requestDate),
      getStatusLabel(item.status),
      winner ? winner.unitPrice.toFixed(2) : '',
      winner ? winner.totalPrice.toFixed(2) : '',
      winner ? winner.discount.toFixed(2) : '',
      winner ? winner.finalPrice.toFixed(2) : '',
      winner ? winner.employee : ''
    ]
  })
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `local_purchase_followup_items_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ================================================================
// WATCHERS & LIFECYCLE
// ================================================================

watch([filterStatus, filterDepartment, searchQuery], () => {
  currentPage.value = 1
})

watch(pageSize, () => { currentPage.value = 1 })

onMounted(() => {})
</script>

<style scoped>
/* ================================================================
   SECTION CARD & HEADER
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

.btn-get-request {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  white-space: nowrap;
  text-decoration: none;
  position: relative;
}

.btn-get-request:hover {
  background: #7c3aed;
}

.btn-badge {
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 12px;
  margin-left: 2px;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-export:hover {
  background: #059669;
}

.btn-refresh {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #e2e8f0;
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

/* ================================================================
   STATS
   ================================================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-box {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-wrapper {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 900px;
}

.items-table th,
.items-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.items-table th {
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

.col-expand { width: 30px; }
.col-code { min-width: 100px; }
.col-item { min-width: 200px; }
.col-count { min-width: 50px; text-align: center; }
.col-requester { min-width: 100px; }
.col-dept { min-width: 100px; }
.col-date { min-width: 90px; }
.col-status { min-width: 110px; }
.col-actions { min-width: 80px; }

.text-center { text-align: center; }

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

/* ================================================================
   ITEMS CELL
   ================================================================ */
.items-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-count {
  font-weight: 500;
  color: #1e293b;
  font-size: 12px;
}

.item-names {
  font-size: 11px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
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

.status-badge.pending_bids { background: #fef3c7; color: #92400e; }
.status-badge.bidding { background: #ede9fe; color: #5b21b6; }
.status-badge.purchased { background: #fce4ec; color: #c62828; }
.status-badge.arrived { background: #d1fae5; color: #065f46; }

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
  font-size: 14px;
  transition: all 0.2s;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover:not(:disabled) {
  background: #f1f5f9;
  transform: scale(1.1);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn.bid-btn { color: #7c3aed; }
.icon-btn.bid-btn:hover:not(:disabled) { background: #ede9fe; }

.icon-btn.payment-btn { color: #059669; }
.icon-btn.payment-btn:hover:not(:disabled) { background: #d1fae5; }

/* ================================================================
   EXPANDED DETAILS
   ================================================================ */
.expanded-row { background: #f8fafc; }

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

.expand-btn:hover { background: #e0e7ff; }

.detail-expand-row td { padding: 0 !important; }

.expand-details {
  padding: 20px;
  background: #f8fafc;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ================================================================
   REQUEST HEADER
   ================================================================ */
.request-header {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.request-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.request-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.request-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 20px;
}

.request-status.pending_bids { background: #fef3c7; color: #92400e; }
.request-status.bidding { background: #ede9fe; color: #5b21b6; }
.request-status.purchased { background: #fce4ec; color: #c62828; }
.request-status.arrived { background: #d1fae5; color: #065f46; }

.request-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #64748b;
  flex-wrap: wrap;
}

.request-info span {
  background: #f8fafc;
  padding: 4px 12px;
  border-radius: 6px;
}

/* ================================================================
   ITEM DETAIL BLOCK
   ================================================================ */
.item-detail-block {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}

.item-detail-block:not(:last-child) {
  margin-bottom: 0;
}

/* Item Header */
.item-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f1f5f9;
  margin-bottom: 10px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.item-number {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 12px;
}

.item-title h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.item-code-badge {
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 10px;
  border-radius: 12px;
  font-family: monospace;
}

.item-qty-badge {
  font-size: 11px;
  font-weight: 500;
  color: #2563eb;
  background: #dbeafe;
  padding: 2px 12px;
  border-radius: 12px;
}

.item-actions-top {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.item-actions-top button {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.item-actions-top button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-bid-item {
  background: #ede9fe;
  color: #5b21b6;
}
.btn-bid-item:hover:not(:disabled) { background: #ddd6fe; }

.btn-payment-item {
  background: #d1fae5;
  color: #065f46;
}
.btn-payment-item:hover:not(:disabled) { background: #a7f3d0; }

.btn-arrive-item {
  background: #dbeafe;
  color: #1e40af;
}
.btn-arrive-item:hover:not(:disabled) { background: #bfdbfe; }

.btn-add-info-item {
  background: #fef3c7;
  color: #92400e;
}
.btn-add-info-item:hover:not(:disabled) { background: #fde68a; }

/* Item Status Bar */
.item-status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 6px;
  flex-wrap: wrap;
}

.item-status-bar .status-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.item-status-bar .bid-count {
  font-size: 11px;
  color: #7c3aed;
  font-weight: 500;
}

.item-status-bar .winner-indicator {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
}

/* ================================================================
   PRICE SECTION
   ================================================================ */
.price-section {
  margin-top: 4px;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.price-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.price-status {
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
  background: #d1fae5;
  padding: 2px 12px;
  border-radius: 12px;
}

.price-count {
  font-size: 11px;
  color: #64748b;
}

/* Price Table */
.price-table-wrapper {
  overflow-x: auto;
}

.price-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.price-table thead th {
  background: #f1f5f9;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 2px solid #e2e8f0;
}

.price-table tbody td {
  padding: 5px 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.price-table tbody tr:hover {
  background: #f8fafc;
}

.price-table tbody tr.winner-row {
  background: #d1fae5;
}

.price-table tbody tr.winner-row:hover {
  background: #a7f3d0;
}

.price-table tbody tr.match-row {
  background: #eff6ff;
}

.price-table tbody tr.match-row:hover {
  background: #dbeafe;
}

.price-table tbody tr.not-match-row {
  background: #fef2f2;
}

.price-table tbody tr.not-match-row:hover {
  background: #fee2e2;
}

.rank-winner {
  font-size: 14px;
}

.rank-number {
  color: #94a3b8;
  font-weight: 500;
}

.employee-name {
  font-weight: 500;
  color: #0f172a;
}

.discount-cell {
  color: #ef4444;
}

.final-price-cell {
  font-weight: 700;
  color: #2563eb;
}

/* Price Table Badges */
.match-badge-small,
.not-match-badge-small,
.pending-badge-small {
  font-size: 13px;
}

.winner-badge-small {
  background: #10b981;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.pending-badge-small {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.rejected-badge-small {
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.accepted-badge-small {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.price-actions {
  display: flex;
  gap: 4px;
}

.btn-edit-price-small {
  background: #dbeafe;
  border: none;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.btn-edit-price-small:hover:not(:disabled) {
  background: #bfdbfe;
}

.btn-edit-price-small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-remove-price-small {
  background: #fee2e2;
  border: none;
  color: #991b1b;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.btn-remove-price-small:hover:not(:disabled) {
  background: #fecaca;
}

.btn-remove-price-small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
  padding: 8px 0;
  font-size: 12px;
}

/* ================================================================
   PAYMENT SECTION
   ================================================================ */
.payment-section {
  margin-top: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.payment-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 4px 16px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 11px;
}

.payment-item:last-child { border-bottom: none; }

.payment-item .label {
  font-weight: 500;
  color: #64748b;
}

.payment-item .value {
  font-weight: 500;
  color: #0f172a;
}

.payment-item .value.amount { color: #059669; font-weight: 700; }
.payment-item .value.final-amount { color: #2563eb; font-weight: 700; }
.payment-item .value.transfer-number { font-family: monospace; color: #2563eb; }

/* ================================================================
   ARRIVAL SECTION
   ================================================================ */
.arrival-section {
  margin-top: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.arrival-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.arrival-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 4px 16px;
}

.arrival-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 11px;
}

.arrival-item:last-child { border-bottom: none; }

.arrival-item .label {
  font-weight: 500;
  color: #64748b;
}

.arrival-item .value {
  font-weight: 500;
  color: #0f172a;
}

/* ================================================================
   INFO SECTION
   ================================================================ */
.info-section {
  margin-top: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.info-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.info-item-full {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 11px;
}

.info-item-full:last-child { border-bottom: none; }

.info-item-full .label {
  font-weight: 500;
  color: #64748b;
  min-width: 100px;
}

.info-item-full .value {
  font-weight: 500;
  color: #0f172a;
  word-break: break-word;
}

.info-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ================================================================
   ADDITIONAL INFO BADGE
   ================================================================ */
.additional-info-badge {
  background: #ede9fe;
  color: #5b21b6;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: inline-block;
  transition: all 0.2s;
}

.additional-info-badge:hover {
  background: #ddd6fe;
}

/* ================================================================
   STATUS BADGES (for modals)
   ================================================================ */
.winner-badge {
  background: #10b981;
  color: white;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  display: inline-block;
}

.match-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  display: inline-block;
}

.not-match-badge {
  background: #fee2e2;
  color: #991b1b;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  display: inline-block;
  cursor: help;
}

.bid-status.pending {
  color: #92400e;
  background: #fef3c7;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  display: inline-block;
}

.bid-status.rejected {
  color: #991b1b;
  background: #fee2e2;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  display: inline-block;
}

/* ================================================================
   REMOVE MODAL
   ================================================================ */
.remove-info {
  text-align: center;
  padding: 8px 0;
}

.remove-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.remove-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.remove-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  text-align: left;
}

.remove-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
}

.remove-row:last-child {
  border-bottom: none;
}

.remove-label {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}

.remove-value {
  font-weight: 500;
  color: #0f172a;
  font-size: 13px;
}

.remove-remark {
  margin-top: 12px;
  text-align: left;
}

.remove-remark label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  display: block;
  margin-bottom: 4px;
}

.remove-warning {
  background: #fef3c7;
  color: #92400e;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 8px;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

/* ================================================================
   ARRIVED MODAL
   ================================================================ */
.arrived-info {
  text-align: center;
  padding: 8px 0;
}

.arrived-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.arrived-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.arrived-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  text-align: left;
}

.arrived-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #f1f5f9;
}

.arrived-row:last-child {
  border-bottom: none;
}

.arrived-label {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}

.arrived-value {
  font-weight: 500;
  color: #0f172a;
  font-size: 13px;
}

.arrived-value.amount {
  color: #059669;
  font-weight: 700;
}

.arrived-remark {
  margin-top: 12px;
  text-align: left;
}

.arrived-remark label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  display: block;
  margin-bottom: 4px;
}

.arrived-confirm-text {
  background: #dbeafe;
  color: #1e40af;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

.arrived-confirm-text strong {
  color: #1e40af;
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
  from { opacity: 0; }
  to { opacity: 1; }
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

.modal-container.small-modal { max-width: 600px; }

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
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
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

/* Form Row - Side by Side Inputs */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group { 
  margin-bottom: 14px; 
}

.form-group label { 
  display: block; 
  font-size: 13px; 
  font-weight: 500; 
  color: #1e293b; 
  margin-bottom: 4px; 
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-input.final-amount {
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  display: block;
}

.info-box {
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 3px solid #3b82f6;
}

.info-box p {
  margin: 4px 0;
  font-size: 13px;
}

.radio-group {
  display: flex;
  gap: 20px;
  padding: 4px 0;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-secondary:hover { background: #e2e8f0; }

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover { background: #2563eb; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* ================================================================
   IMAGE INPUT GROUP
   ================================================================ */
.image-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.image-input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.image-input-row .form-input {
  flex: 1;
}

.btn-remove-image {
  background: #fee2e2;
  border: none;
  color: #991b1b;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-remove-image:hover {
  background: #fecaca;
}

.btn-add-image {
  background: #dbeafe;
  border: none;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  align-self: flex-start;
}

.btn-add-image:hover {
  background: #bfdbfe;
}

.image-preview {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.image-preview-item {
  width: 80px;
  height: 80px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ================================================================
   VIEW INFO MODAL
   ================================================================ */
.view-info-section {
  margin-bottom: 16px;
}

.view-info-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.view-info-content {
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

.view-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.view-image-grid-item {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  aspect-ratio: 1;
}

.view-image-grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-info {
  text-align: center;
  color: #94a3b8;
  padding: 20px 0;
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

.page-btn:hover:not(:disabled) { background: #e2e8f0; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.page-info { font-size: 13px; color: #475569; }

.limit-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 13px;
  cursor: pointer;
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

.empty-icon { font-size: 48px; opacity: 0.5; }
.empty-state p { color: #94a3b8; font-size: 16px; margin: 0; }

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .section-card { padding: 12px; }
  
  .card-header { flex-direction: column; align-items: stretch; }
  .header-title { justify-content: space-between; width: 100%; }
  .header-actions { flex-direction: column; width: 100%; }
  .search-box { width: 100%; }
  .search-box input { width: 100%; }
  .btn-get-request, .btn-export, .btn-refresh { width: 100%; justify-content: center; }
  
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-select { width: 100%; }
  
  .items-table { font-size: 11px; min-width: 700px; }
  .items-table th, .items-table td { padding: 6px 8px; }
  
  .modal-container { width: 98%; max-height: 95vh; }
  .modal-container.small-modal { max-width: 98%; }
  .modal-body { padding: 16px; }
  
  .pagination { gap: 8px; }
  .page-btn { padding: 4px 12px; font-size: 12px; }
  
  .col-actions { min-width: 80px; }
  .form-row { grid-template-columns: 1fr; }
  
  .request-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .request-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .item-detail-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .item-actions-top {
    flex-direction: column;
  }
  
  .item-actions-top button {
    width: 100%;
    justify-content: center;
  }
  
  .payment-grid {
    grid-template-columns: 1fr;
  }
  
  .arrival-grid {
    grid-template-columns: 1fr;
  }
  
  .price-table {
    font-size: 10px;
  }
  
  .price-table thead th,
  .price-table tbody td {
    padding: 4px 4px;
  }
}

@media (max-width: 480px) {
  .items-table { min-width: 600px; }
  .items-table th, .items-table td { padding: 4px 6px; font-size: 10px; }
  .status-badge { padding: 2px 8px; font-size: 9px; }
  .icon-btn { padding: 3px 4px; font-size: 12px; }
  .modal-header h3 { font-size: 16px; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stat-number { font-size: 18px; }
  
  .price-table {
    font-size: 9px;
  }
  
  .price-table thead th,
  .price-table tbody td {
    padding: 2px 3px;
  }
  
  .winner-badge-small,
  .pending-badge-small,
  .rejected-badge-small,
  .accepted-badge-small {
    font-size: 7px;
    padding: 1px 4px;
  }
}
</style>