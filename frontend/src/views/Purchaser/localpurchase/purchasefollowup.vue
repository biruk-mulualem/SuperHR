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
        <option value="submitted"> All Submitted</option>
      </select>

      <select v-model="filterPriority" class="filter-select" @change="onFilterChange">
        <option value="all">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <select v-model="filterDepartment" class="filter-select" @change="onFilterChange">
        <option value="all">All Departments</option>
        <option v-for="dept in departmentOptions" :key="dept" :value="dept">
          {{ dept }}
        </option>
      </select>

      <button class="btn-clear-filters" @click="clearFilters" v-if="hasActiveFilters">
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-number">{{ stats.totalItems }}</span>
        <span class="stat-label">Total Items</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ stats.totalItems - stats.biddingItems - stats.winnerItems }}</span>
        <span class="stat-label">Pending</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ stats.biddingItems }}</span>
        <span class="stat-label">Price Collection</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ stats.winnerItems }}</span>
        <span class="stat-label">Winner Selected</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ stats.totalRequests }}</span>
        <span class="stat-label">Requests</span>
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
          <tr v-if="paginatedGroups.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📭</span>
                <p>No requests in follow-up</p>
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
                    class="icon-btn trash-btn"
                    @click="openDeleteGroupModal(group)"
                    title="Delete this purchase order"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW ==================== -->
            <tr v-if="expandedRequest === group.requestId" class="detail-expand-row">
              <td colspan="9">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Request Header -->
                    <div class="request-header">
                      <div class="request-title">
                        <h3>📋 Purchase Order: {{ group.requestNumber }}</h3>
                        <span class="request-status" :class="group.status">{{
                          getStatusLabel(group.status)
                        }}</span>
                      </div>
                      <div class="request-info">
                        <span>Requested by: {{ group.requestedBy }}</span>
                        <span>Department: {{ group.department }}</span>
                        <span>Date: {{ formatDate(group.requestDate) }}</span>
                      </div>
                    </div>

                    <!-- TOP SECTION -->
                    <div class="top-section-grid">
                      <div class="detail-card">
                        <div class="detail-card-header">
                          <h4>📋 Request Information</h4>
                          <span class="status-badge approved">approved</span>
                        </div>

                        <div class="info-rows">
                          <div class="info-row">
                            <span class="info-label">PR Number</span>
                            <span class="info-value code-value">{{ group.requestNumber }}</span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Department</span>
                            <span class="info-value">{{ group.department || "—" }}</span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Expert Name</span>
                            <span class="info-value">{{ group.expertName || "—" }}</span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Prepared By</span>
                            <span class="info-value">{{ group.preparedBy || "—" }}</span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Priority</span>
                            <span class="info-value">
                              <span :class="['priority-badge', group.priority]">
                                {{ group.priority }}
                              </span>
                            </span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Requested Date</span>
                            <span class="info-value">{{ formatDate(group.requestDate) }}</span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Approved Date</span>
                            <span class="info-value">{{
                              formatDateTime(group.approvedDate || group.requestDate)
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="detail-card">
                        <div class="detail-card-header">
                          <h4>📤 Dispatched To</h4>
                          <div class="dispatch-header-actions">
                            <span class="member-count-badge">
                              {{ (group.dispatchedTo || []).length }}
                            </span>
                            <button
                              class="btn-add-dispatch"
                              @click="openDispatchModal(group)"
                              title="Add or remove purchasers"
                            >
                              ➕ Manage
                            </button>
                          </div>
                        </div>

                        <div v-if="(group.dispatchedTo || []).length === 0" class="dispatch-empty">
                          <span class="dispatch-empty-icon">👥</span>
                          <p>No purchasers assigned yet</p>
                          <button class="btn-add-dispatch-inline" @click="openDispatchModal(group)">
                            ➕ Assign Purchasers
                          </button>
                        </div>

<div v-else class="dispatched-list">
  <!-- Shared remark stays outside the scroll area -->
  <div v-if="group.dispatchRemark" class="dispatch-shared-remark">
    <span class="remark-icon">📩</span>
    <span class="remark-text">{{ group.dispatchRemark }}</span>
  </div>

  <div class="dispatched-list-scroll">
    <div
      v-for="person in group.dispatchedTo"
      :key="person.id"
      class="dispatched-item"
      :class="{ 'boss-item': person.isBoss }"
    >
      <div class="dispatched-avatar" :class="{ 'boss-avatar': person.isBoss }">
        {{ getInitials(person.name) }}
      </div>
      <div class="dispatched-details">
        <div class="dispatched-name">
          {{ person.name }}
          <span v-if="person.isBoss" class="boss-crown">👑</span>
        </div>
        <div class="dispatched-role">
          {{ person.isBoss ? person.role : person.department }}
        </div>

        <!-- 👑 Boss: show only their specific message -->
        <div
          v-if="person.isBoss && person.message"
          class="dispatched-message boss-message"
        >
          <span class="message-icon">✉️</span>
          <span class="message-text">{{ person.message }}</span>
        </div>

        <!-- 👤 Everyone else: show the shared/common message -->
        <div
          v-else-if="!person.isBoss && group.dispatchRemark"
          class="dispatched-message common-message"
        >
          <span class="message-icon">📩</span>
          <span class="message-text">{{ group.dispatchRemark }}</span>
        </div>
      </div>
      <button
        class="btn-remove-dispatch"
        @click="removeDispatcher(group, person.id)"
        title="Remove from dispatch"
      >
        ✕
      </button>
    </div>
  </div>
</div>
                      </div>
                    </div>

                    <!-- APPROVED DOCUMENTS -->
                    <div
                      v-if="group.approvedDocFront || group.approvedDocBack"
                      class="detail-card full-width"
                    >
                      <div class="detail-card-header">
                        <h4>📎 Approved Documents</h4>
                        <span class="member-count-badge">
                          {{
                            (group.approvedDocFront ? 1 : 0) +
                            (group.approvedDocBack ? 1 : 0)
                          }}
                        </span>
                      </div>

                      <div class="docs-grid">
                        <div v-if="group.approvedDocFront" class="doc-card">
                          <div class="doc-card-header">
                            <span class="doc-side-label">📄 Front Side</span>
                          </div>
                          <div
                            class="doc-image-wrapper"
                            @click="
                              openImageViewer(
                                group.approvedDocFront,
                                `${group.requestNumber} - Front Side`,
                                group.approvedDocFrontName || undefined,
                              )
                            "
                          >
                            <div class="doc-skeleton">⏳ Loading...</div>
                            <img
                              :src="group.approvedDocFront"
                              :alt="`${group.requestNumber} front`"
                              class="doc-thumbnail"
                              @load="onImageLoad"
                              @error="onImageError"
                            />
                            <div class="doc-overlay">
                              <span class="zoom-icon">🔍</span>
                              <span class="zoom-text">Click to view full page</span>
                            </div>
                          </div>
                          <div class="doc-card-footer">
                            <span class="doc-filename" :title="group.approvedDocFrontName">
                              {{ group.approvedDocFrontName || getFileName(group.approvedDocFront) }}
                            </span>
                            <button
                              class="doc-view-btn"
                              @click="
                                openImageViewer(
                                  group.approvedDocFront,
                                  `${group.requestNumber} - Front Side`,
                                  group.approvedDocFrontName,
                                )
                              "
                            >
                              View Full
                            </button>
                          </div>
                        </div>

                        <div v-if="group.approvedDocBack" class="doc-card">
                          <div class="doc-card-header">
                            <span class="doc-side-label">📄 Back Side</span>
                          </div>
                          <div
                            class="doc-image-wrapper"
                            @click="
                              openImageViewer(
                                group.approvedDocBack,
                                `${group.requestNumber} - Back Side`,
                                group.approvedDocBackName,
                              )
                            "
                          >
                            <div class="doc-skeleton">⏳ Loading...</div>
                            <img
                              :src="group.approvedDocBack"
                              :alt="`${group.requestNumber} back`"
                              class="doc-thumbnail"
                              @load="onImageLoad"
                              @error="onImageError"
                            />
                            <div class="doc-overlay">
                              <span class="zoom-icon">🔍</span>
                              <span class="zoom-text">Click to view full page</span>
                            </div>
                          </div>
                          <div class="doc-card-footer">
                            <span class="doc-filename" :title="group.approvedDocBackName">
                              {{ group.approvedDocBackName || getFileName(group.approvedDocBack) }}
                            </span>
                            <button
                              class="doc-view-btn"
                              @click="
                                openImageViewer(
                                  group.approvedDocBack,
                                  `${group.requestNumber} - Back Side`,
                                  group.approvedDocBackName,
                                )
                              "
                            >
                              View Full
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- ITEM LOOP -->
                    <div
                      v-for="(item, itemIndex) in group.items"
                      :key="item.id"
                      class="item-detail-block"
                    >
                      <div class="item-detail-header">
                        <div class="item-title">
                          <span class="item-number">📦 Item #{{ itemIndex + 1 }}</span>
                          <h4>{{ item.itemName }}</h4>
                          <span class="item-code-badge">{{ item.itemCode }}</span>
                          <span class="item-qty-badge">{{ item.quantity }} {{ item.uom }}</span>
                        </div>
                        <div class="item-actions-top">
                          <button
                            v-if="item.status === 'pending_bids' || item.status === 'bidding'"
                            class="btn-bid-item"
                            @click="openBidModal(item)"
                          >
                            💰 Submit Price
                          </button>
                          <button
                            v-if="item.bids && item.bids.length > 0"
                            class="btn-select-winner"
                            @click="openSelectWinnerModal(item)"
                          >
                            🏆 Select Winner
                          </button>
                        </div>
                      </div>

                      <div class="item-status-bar">
                        <span class="status-label">Status:</span>
                        <span :class="['status-badge', item.status]">{{
                          getStatusLabel(item.status)
                        }}</span>
                        <span v-if="item.bids && item.bids.length > 0" class="bid-count"
                          >💰 {{ item.bids.length }} price(s)</span
                        >
                        <span v-if="item.hasWinner" class="winner-indicator">
                          🏆 Winner: {{ getWinnerBid(item)?.employee }}
                          <span
                            v-if="item.winnerManuallySelected"
                            class="manual-lock-badge"
                            title="Manually selected — new prices won't replace it"
                          >
                            🔒 Manual
                          </span>
                        </span>
                      </div>

                      <div class="price-section">
                        <div class="price-header">
                          <h4>💰 Prices</h4>
                          <span class="price-status" v-if="item.hasWinner">🏆 Winner Selected</span>
                          <span
                            v-else-if="item.bids && item.bids.length > 0"
                            class="price-count"
                            >{{ item.bids.length }} bid(s)</span
                          >
                          <span v-else class="price-count">No bids yet</span>
                        </div>

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
                              <tr
                                v-for="(bid, bidIndex) in getSortedBids(item)"
                                :key="bid.id"
                                :class="{
                                  'winner-row': bid.isWinner,
                                  'match-row':
                                    bid.matchesRequirement === true && !bid.isWinner,
                                  'not-match-row':
                                    bid.matchesRequirement === false && !bid.isWinner,
                                }"
                              >
                                <td>
                                  <span v-if="bid.isWinner" class="rank-winner">🏆</span>
                                  <span v-else class="rank-number">#{{ bidIndex + 1 }}</span>
                                </td>
                                <td class="employee-name">{{ bid.employee }}</td>
                                <td>{{ bid.unitPrice.toFixed(2) }}</td>
                                <td>{{ bid.totalPrice.toFixed(2) }}</td>
                                <td class="discount-cell">
                                  {{ bid.discount > 0 ? bid.discount.toFixed(2) : "-" }}
                                </td>
                                <td class="final-price-cell">
                                  {{ bid.finalPrice.toFixed(2) }}
                                </td>
                                <td>
                                  <span
                                    v-if="bid.matchesRequirement === true"
                                    class="match-badge-small"
                                    >✅</span
                                  >
                                  <span
                                    v-else-if="bid.matchesRequirement === false"
                                    class="not-match-badge-small"
                                    >❌</span
                                  >
                                  <span v-else class="pending-badge-small">⏳</span>
                                </td>
                                <td>
                                  <span v-if="bid.isWinner" class="winner-badge-small"
                                    >🏆 Winner</span
                                  >
                                  <span
                                    v-else-if="bid.status === 'pending'"
                                    class="pending-badge-small"
                                    >Pending</span
                                  >
                                  <span
                                    v-else-if="bid.status === 'rejected'"
                                    class="rejected-badge-small"
                                    >Rejected</span
                                  >
                                  <span
                                    v-else-if="bid.status === 'accepted'"
                                    class="accepted-badge-small"
                                    >Accepted</span
                                  >
                                </td>
                                <td>
                                  <div class="price-actions">
                                    <button
                                      class="btn-edit-price-small"
                                      @click="openEditModal(item, bid)"
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      class="btn-remove-price-small"
                                      @click="openRemoveModal(item, bid)"
                                      title="Remove"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div v-else class="no-data">
                          No prices submitted yet for this item
                        </div>
                      </div>

                      <!-- FINAL PRICE SUMMARY -->
                      <div class="final-price-summary" v-if="item.hasWinner">
                        <div class="final-price-row">
                          <span class="final-price-label">🏆 Winner</span>
                          <span class="final-price-value">{{
                            getWinnerBid(item)?.employee
                          }}</span>
                        </div>
                        <div class="final-price-row">
                          <span class="final-price-label">Final Price</span>
                          <span class="final-price-value amount"
                            >ETB {{ getWinnerBid(item)?.finalPrice.toFixed(2) }}</span
                          >
                        </div>
                      </div>
                    </div>

                    <!-- ==================== SEND TO BOSS ==================== -->
                    <div
                      class="send-to-boss-section"
                      :class="{ sent: sentToBossByRequest[group.requestId] }"
                    >
                      <div class="send-boss-left">
                        <div class="send-boss-avatar">{{ currentBoss.initials }}</div>
                        <div class="send-boss-text">
                          <strong>Send Submitted Prices to Boss</strong>
                          <small>
                            Forward all items with their full price lists to
                            <strong>{{ currentBoss.name }}</strong>
                            ({{ currentBoss.role }})
                          </small>
                          <div class="send-boss-progress">
                            <span class="progress-chip ready">
                              ✅ {{ countWinners(group) }} ready
                            </span>
                            <span v-if="countPending(group) > 0" class="progress-chip pending">
                              ⏳ {{ countPending(group) }} waiting for price
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="send-boss-right">
                        <span
                          v-if="sentToBossByRequest[group.requestId]"
                          class="sent-to-boss-badge"
                        >
                          ✓ Sent to Boss
                        </span>
                        <button
                          class="btn-send-boss"
                          @click="openSendToBossModal(group)"
                          :disabled="!hasAnyWinner(group)"
                          :title="
                            hasAnyWinner(group)
                              ? countPending(group) > 0
                                ? `Send ${countWinners(group)} item(s) — ${countPending(group)} will be skipped`
                                : 'Send all items to boss'
                              : 'No item has a winner yet'
                          "
                        >
                          {{
                            sentToBossByRequest[group.requestId]
                              ? "🔄 Resend to Boss"
                              : "📨 Send to Boss"
                          }}
                        </button>
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
    <div class="pagination" v-if="totalItemsCount > 0">
      <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
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

    <!-- ==================== PRICE MODAL ==================== -->
    <div v-if="showBidModal" class="modal-overlay" @click.self="showBidModal = false">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>💰 Submit Price - {{ bidItem?.itemName }}</h3>
          <button class="modal-close" @click="showBidModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-box">
            <p>
              <strong>Item:</strong> {{ bidItem?.itemName }} ({{ bidItem?.itemCode }})
            </p>
            <p>
              <strong>Quantity:</strong> {{ bidItem?.quantity }} {{ bidItem?.uom }}
            </p>
            <p><strong>Request #:</strong> {{ bidItem?.requestNumber }}</p>
          </div>

          <!-- Sales Person dropdown -->
          <div class="form-group">
            <label>Sales Person *</label>
            <select v-model="newBid.employee" class="form-input">
              <option value="" disabled>-- Select an employee --</option>
              <option
                v-for="u in activeEmployees"
                :key="u.userId"
                :value="u.fullName || u.username"
              >
                {{ u.fullName || u.username }}
                <template v-if="u.departmentName"> — {{ u.departmentName }}</template>
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
              <input
                type="text"
                :value="newBid.totalPrice.toFixed(2)"
                class="form-input"
                disabled
                readonly
              />
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
              <input
                type="text"
                :value="newBid.finalPrice.toFixed(2)"
                class="form-input final-amount"
                disabled
                readonly
              />
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
            <textarea
              v-model="newBid.remark"
              class="form-textarea"
              rows="2"
              placeholder="Why doesn't this match the requirement?"
            />
          </div>

          <div class="form-group">
            <label>Additional Notes</label>
            <textarea
              v-model="newBid.notes"
              class="form-textarea"
              rows="2"
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showBidModal = false">Cancel</button>
          <button
            class="btn-primary"
            @click="submitBid"
            :disabled="!isBidValid || submitting"
          >
            {{ submitting ? "Submitting..." : "Submit Price" }}
          </button>
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
            <p>
              <strong>Quantity:</strong> {{ editTarget?.item.quantity }}
              {{ editTarget?.item.uom }}
            </p>
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
              <input
                type="text"
                :value="editData.totalPrice.toFixed(2)"
                class="form-input"
                disabled
                readonly
              />
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
              <input
                type="text"
                :value="editData.finalPrice.toFixed(2)"
                class="form-input final-amount"
                disabled
                readonly
              />
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
            <textarea
              v-model="editData.remark"
              class="form-textarea"
              rows="2"
              placeholder="Why doesn't this match the requirement?"
            />
          </div>

          <div class="form-group">
            <label>Additional Notes</label>
            <textarea
              v-model="editData.notes"
              class="form-textarea"
              rows="2"
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showEditModal = false">Cancel</button>
          <button
            class="btn-primary"
            @click="confirmEdit"
            :disabled="!isEditValid || submitting"
          >
            {{ submitting ? "Updating..." : "Update Price" }}
          </button>
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
                <span class="remove-value"
                  >ETB {{ removeTarget?.bid.unitPrice.toFixed(2) }}</span
                >
              </div>
              <div class="remove-row">
                <span class="remove-label">Final Price:</span>
                <span class="remove-value"
                  >ETB {{ removeTarget?.bid.finalPrice.toFixed(2) }}</span
                >
              </div>
            </div>
            <div class="form-group remove-remark">
              <label>Additional Remark</label>
              <textarea
                v-model="removeRemark"
                class="form-textarea"
                rows="2"
                placeholder="Enter reason for removal..."
              />
            </div>
            <p v-if="removeTarget?.bid.isWinner" class="remove-warning">
              ⚠️ This is the current winner. Removing it will reset the winner selection
              for this item.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showRemoveModal = false">Cancel</button>
          <button class="btn-danger" @click="confirmRemove" :disabled="submitting">
            {{ submitting ? "Removing..." : "Yes, Remove" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== SELECT WINNER MODAL ==================== -->
    <div
      v-if="showSelectWinnerModal"
      class="modal-overlay"
      @click.self="showSelectWinnerModal = false"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h3>🏆 Select Winner - {{ selectWinnerItem?.itemName }}</h3>
          <button class="modal-close" @click="showSelectWinnerModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-box">
            <p>
              <strong>Item:</strong> {{ selectWinnerItem?.itemName }} ({{
                selectWinnerItem?.itemCode
              }})
            </p>
            <p>
              <strong>Quantity:</strong> {{ selectWinnerItem?.quantity }}
              {{ selectWinnerItem?.uom }}
            </p>
            <p>
              <strong>Bids:</strong> {{ selectWinnerItem?.bids?.length || 0 }}
            </p>
          </div>

          <div class="winner-selection-hint">
            <template v-if="selectWinnerItem?.winnerManuallySelected">
              🔒 <strong>Manual winner lock is ON.</strong> New prices will not replace
              this winner. Select another to change it.
            </template>
            <template v-else>
              🤖 The system suggested a winner (lowest matching price). You can override
              it here.
            </template>
          </div>

          <div class="winner-candidates">
            <label
              v-for="bid in selectWinnerItem?.bids"
              :key="bid.id"
              class="winner-candidate"
              :class="{
                'candidate-selected': selectedWinnerBidId === bid.id,
                'candidate-current': bid.isWinner,
              }"
            >
              <input type="radio" :value="bid.id" v-model="selectedWinnerBidId" />
              <div class="candidate-body">
                <div class="candidate-header">
                  <span class="candidate-name">{{ bid.employee }}</span>
                  <span v-if="bid.isWinner" class="current-badge">🏆 Current</span>
                  <span v-if="bid.matchesRequirement === true" class="match-badge"
                    >✅ Match</span
                  >
                  <span v-else-if="bid.matchesRequirement === false" class="not-match-badge"
                    >❌ Not Match</span
                  >
                </div>
                <div class="candidate-prices">
                  <span
                    >Unit: <strong>ETB {{ bid.unitPrice.toFixed(2) }}</strong></span
                  >
                  <span
                    >Total: <strong>ETB {{ bid.totalPrice.toFixed(2) }}</strong></span
                  >
                  <span
                    >Discount: <strong>ETB {{ bid.discount.toFixed(2) }}</strong></span
                  >
                  <span
                    >Final:
                    <strong class="amount">ETB {{ bid.finalPrice.toFixed(2) }}</strong></span
                  >
                </div>
                <div v-if="bid.remark" class="candidate-remark">⚠️ {{ bid.remark }}</div>
              </div>
            </label>
          </div>

          <div class="form-group" style="margin-top: 16px">
            <label>Override Reason (Optional)</label>
            <textarea
              v-model="winnerOverrideReason"
              class="form-textarea"
              rows="2"
              placeholder="e.g. Better delivery time, preferred supplier, etc."
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showSelectWinnerModal = false">Cancel</button>
          <button
            class="btn-primary"
            :disabled="!selectedWinnerBidId || submitting"
            @click="confirmSelectWinner"
          >
            {{ submitting ? "Updating..." : "🏆 Set as Winner" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== MANAGE DISPATCH MODAL ==================== -->
    <div v-if="showManageDispatchModal" class="modal-overlay" @click.self="closeDispatchModal">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>📤 Manage Dispatch - {{ dispatchTargetGroup?.requestNumber }}</h3>
          <button class="modal-close" @click="closeDispatchModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="dispatch-section">
            <div class="dispatch-section-title">👔 Boss</div>
            <div
              class="boss-card"
              :class="{ 'boss-card-active': dispatchForm.includeBoss }"
              @click="dispatchForm.includeBoss = !dispatchForm.includeBoss"
            >
              <div class="boss-card-avatar">{{ currentBoss.initials }}</div>
              <div class="boss-card-info">
                <div class="boss-card-name">{{ currentBoss.name }}</div>
                <div class="boss-card-role">{{ currentBoss.role }}</div>
                <div class="boss-card-email">{{ currentBoss.email }}</div>
              </div>
              <div class="boss-card-check" @click.stop>
                <input type="checkbox" v-model="dispatchForm.includeBoss" />
              </div>
            </div>

            <div v-if="dispatchForm.includeBoss" class="boss-message-wrapper">
              <label class="boss-message-label">✉️ Message to Boss (Optional)</label>
              <textarea
                v-model="dispatchForm.bossMessage"
                class="form-textarea"
                rows="2"
                placeholder="e.g. Please review the urgent items in this batch..."
              />
            </div>
          </div>

          <div class="dispatch-section">
            <div class="dispatch-section-title">👥 Purchasers (All Active Employees)</div>

            <!-- FILTER ROW: search + role -->
            <div class="dispatch-filters-row">
              <div class="search-purchaser-wrapper">
                <span class="search-icon-small">🔍</span>
                <input
                  type="text"
                  v-model="dispatchSearch"
                  placeholder="Search by name or department..."
                  class="form-input search-purchaser-input"
                />
              </div>

              <select
                v-model="dispatchRoleFilter"
                class="form-input dispatch-role-select"
                title="Filter by role"
              >
                <option value="all">All Roles</option>
                <option v-for="r in dispatchRoleOptions" :key="r" :value="r">
                  {{ r.charAt(0).toUpperCase() + r.slice(1) }}
                </option>
              </select>
            </div>

            <div v-if="usersLoading" class="purchaser-loading">Loading users…</div>
            <div v-else-if="usersError" class="purchaser-error">{{ usersError }}</div>
            <div v-else class="purchaser-table-wrapper">
              <table class="purchaser-table">
                <thead>
                  <tr>
                    <th style="width: 40px">
                      <input
                        type="checkbox"
                        :checked="allVisiblePurchasersSelected"
                        @change="toggleSelectAllVisible"
                      />
                    </th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredDispatchPurchasers.length === 0">
                    <td colspan="4" class="no-results">No purchasers found</td>
                  </tr>
                  <tr
                    v-for="p in filteredDispatchPurchasers"
                    :key="p.id"
                    :class="{
                      'selected-row': dispatchForm.purchaserIds.includes(p.id),
                    }"
                  >
                    <td>
                      <input
                        type="checkbox"
                        :checked="dispatchForm.purchaserIds.includes(p.id)"
                        @change="togglePurchaserPick(p.id)"
                      />
                    </td>
                    <td>{{ p.name }}</td>
                    <td>{{ p.department }}</td>
                    <td>
                      <span class="role-pill">{{ p.role || "—" }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        

          <p
            class="dispatch-info-text"
            v-if="dispatchForm.purchaserIds.length > 0 || dispatchForm.includeBoss"
          >
            ✅ This will dispatch the request to
            <strong>{{ dispatchForm.purchaserIds.length }}</strong> purchaser(s)
            <span v-if="dispatchForm.includeBoss">
              and notify <strong>{{ currentBoss.name }}</strong></span
            >.
          </p>
          <p class="dispatch-warning-text" v-else>
            ⚠️ Please select at least one purchaser or the boss.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDispatchModal">Cancel</button>
          <button
            class="btn-primary"
            @click="saveDispatch"
            :disabled="
              (dispatchForm.purchaserIds.length === 0 && !dispatchForm.includeBoss) ||
              submitting
            "
          >
            {{ submitting ? "Saving..." : "📤 Save Dispatch" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== REMOVE DISPATCHER MODAL ==================== -->
    <div
      v-if="showRemoveDispatchModal"
      class="modal-overlay"
      @click.self="closeRemoveDispatchModal"
    >
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>⚠️ Remove from Dispatch</h3>
          <button class="modal-close" @click="closeRemoveDispatchModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="remove-info">
            <div class="remove-icon">🗑️</div>
            <p class="remove-title">Remove this person?</p>
            <div class="remove-details">
              <div class="remove-row">
                <span class="remove-label">Name:</span>
                <span class="remove-value">{{ removeDispatchTarget?.person.name }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Role:</span>
                <span class="remove-value">{{ removeDispatchTarget?.person.role }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Request:</span>
                <span class="remove-value">{{
                  removeDispatchTarget?.group.requestNumber
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRemoveDispatchModal">Cancel</button>
          <button
            class="btn-danger"
            @click="confirmRemoveDispatcher"
            :disabled="submitting"
          >
            {{ submitting ? "Removing..." : "Yes, Remove" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== SEND TO BOSS MODAL ==================== -->
    <div
      v-if="showSendToBossModal"
      class="modal-overlay"
      @click.self="closeSendToBossModal"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            📨 Send Submitted Prices to Boss — {{ sendBossTarget?.requestNumber }}
          </h3>
          <button class="modal-close" @click="closeSendToBossModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Boss info card -->
          <div class="boss-recipient-card">
            <div class="boss-card-avatar">{{ currentBoss.initials }}</div>
            <div class="boss-recipient-info">
              <div class="boss-recipient-name">{{ currentBoss.name }}</div>
              <div class="boss-recipient-role">{{ currentBoss.role }}</div>
              <div class="boss-recipient-email">📧 {{ currentBoss.email }}</div>
            </div>
            <div class="boss-recipient-check">✓</div>
          </div>

          <!-- Readiness summary -->
          <div class="send-readiness-summary" v-if="sendBossTarget">
            <div class="readiness-row">
              <span class="readiness-label">📦 Total items:</span>
              <span class="readiness-value">{{ sendBossTarget.items.length }}</span>
            </div>
            <div class="readiness-row">
              <span class="readiness-label">✅ Ready (with winner):</span>
              <span class="readiness-value ready">
                {{ countWinners(sendBossTarget) }}
              </span>
            </div>
            <div class="readiness-row" v-if="countPending(sendBossTarget) > 0">
              <span class="readiness-label">⏳ Waiting for price:</span>
              <span class="readiness-value pending">
                {{ countPending(sendBossTarget) }}
              </span>
            </div>
            <div class="readiness-row total">
              <span class="readiness-label">💰 Total winning amount:</span>
              <span class="readiness-value amount">
                ETB {{ getGroupTotalFinal(sendBossTarget).toFixed(2) }}
              </span>
            </div>
          </div>

          <!-- Info about partial send -->
          <div
            v-if="sendBossTarget && countPending(sendBossTarget) > 0"
            class="partial-send-notice"
          >
            ⚠️
            <strong>{{ countPending(sendBossTarget) }} item(s)</strong> still don't have
            a price. They will be marked as <em>pending</em> in the notification to the
            boss. The ready items will be sent for purchase approval.
          </div>

          <!-- PREVIEW: ALL SUBMITTED PRICES PER ITEM -->
          <div class="send-preview">
            <div class="send-preview-title">📦 All Submitted Prices per Item</div>
            <div class="send-preview-items">
              <div
                v-for="(it, idx) in sendBossTarget?.items"
                :key="it.id"
                class="send-preview-item"
                :class="{ 'spi-item-pending': !it.hasWinner }"
              >
                <div class="send-preview-item-header">
                  <div class="send-preview-item-title">
                    <span class="spi-num">Item #{{ idx + 1 }}</span>
                    <strong>{{ it.itemName }}</strong>
                    <span class="spi-code">{{ it.itemCode }}</span>
                    <span v-if="!it.hasWinner" class="spi-pending-badge">
                      ⏳ Waiting for Price
                    </span>
                    <span v-else class="spi-ready-badge">✅ Ready</span>
                  </div>
                  <div class="send-preview-item-meta">
                    <span
                      >Qty: <strong>{{ it.quantity }} {{ it.uom }}</strong></span
                    >
                    <span class="spi-count">{{ it.bids?.length || 0 }} price(s)</span>
                  </div>
                </div>

                <div v-if="it.bids && it.bids.length > 0" class="spi-table-wrapper">
                  <table class="spi-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Sales Person</th>
                        <th>Unit Price</th>
                        <th>Total Price</th>
                        <th>Discount</th>
                        <th>Final Price</th>
                        <th>Match</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(bid, bi) in getSortedBids(it)"
                        :key="bid.id"
                        :class="{ 'spi-winner-row': bid.isWinner }"
                      >
                        <td>
                          <span v-if="bid.isWinner" class="spi-crown">🏆</span>
                          <span v-else class="spi-rank">#{{ bi + 1 }}</span>
                        </td>
                        <td class="spi-name">{{ bid.employee }}</td>
                        <td>ETB {{ bid.unitPrice.toFixed(2) }}</td>
                        <td>ETB {{ bid.totalPrice.toFixed(2) }}</td>
                        <td class="spi-discount">
                          {{ bid.discount > 0 ? "ETB " + bid.discount.toFixed(2) : "-" }}
                        </td>
                        <td class="spi-final">ETB {{ bid.finalPrice.toFixed(2) }}</td>
                        <td class="spi-center">
                          <span v-if="bid.matchesRequirement === true">✅</span>
                          <span v-else-if="bid.matchesRequirement === false">❌</span>
                          <span v-else>⏳</span>
                        </td>
                        <td class="spi-center">
                          <span v-if="bid.isWinner" class="spi-badge spi-badge-win"
                            >🏆 Winner</span
                          >
                          <span
                            v-else-if="bid.status === 'rejected'"
                            class="spi-badge spi-badge-rej"
                            >Rejected</span
                          >
                          <span v-else class="spi-badge spi-badge-pend">Pending</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="spi-empty">
                  ⏳ No prices submitted for this item yet — will be skipped and marked as
                  pending
                </div>
              </div>
            </div>
          </div>

          <!-- Message to Boss -->
          <div class="form-group">
            <label>✉️ Message to Boss (Optional)</label>
            <textarea
              v-model="sendBossForm.message"
              class="form-textarea"
              rows="3"
              placeholder="e.g. Please review the winning prices for approval. Item 3 is still waiting for a quote..."
            />
          </div>

          <p class="dispatch-info-text" v-if="sendBossTarget">
            ✅ This will forward
            <strong>{{ countWinners(sendBossTarget) }}</strong> ready item(s) with their
            submitted prices to
            <strong>{{ currentBoss.name }}</strong>
            <span v-if="countPending(sendBossTarget) > 0">
              and mark
              <strong>{{ countPending(sendBossTarget) }}</strong> item(s) as pending.
            </span>
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeSendToBossModal">Cancel</button>
          <button class="btn-primary" @click="confirmSendToBoss" :disabled="submitting">
            {{ submitting ? "Sending..." : `📨 Send to ${currentBoss.name}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== DELETE PO MODAL ==================== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container small-modal">
        <div class="modal-header">
          <h3>🗑️ Delete Purchase Order</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="decline-info">
            <div class="decline-icon">🗑️</div>
            <p class="decline-title">
              Are you sure you want to delete this purchase order?
            </p>
            <p class="decline-subtitle">
              This will mark the PO as deleted and remove it from the active list.
            </p>

            <div class="decline-details">
              <div class="remove-row">
                <span class="remove-label">PR Number:</span>
                <span class="remove-value">{{ deleteTarget?.requestNumber }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Department:</span>
                <span class="remove-value">{{ deleteTarget?.department }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Requested By:</span>
                <span class="remove-value">{{ deleteTarget?.requestedBy }}</span>
              </div>
              <div class="remove-row">
                <span class="remove-label">Items:</span>
                <span class="remove-value">
                  {{ deleteTarget?.items?.length || 0 }} item(s)
                </span>
              </div>
            </div>

            <div class="form-group" style="text-align: left; margin-top: 14px">
              <label>Reason for deleting *</label>
              <div class="decline-reasons">
                <label
                  v-for="reason in deleteReasons"
                  :key="reason"
                  class="reason-chip"
                  :class="{ selected: deleteForm.reason === reason }"
                >
                  <input type="radio" :value="reason" v-model="deleteForm.reason" />
                  {{ reason }}
                </label>
              </div>
            </div>

            <div class="form-group" style="text-align: left">
              <label>Additional Notes (Optional)</label>
              <textarea
                v-model="deleteForm.notes"
                class="form-textarea"
                rows="3"
                placeholder="Provide more context if needed..."
              />
            </div>

            <p class="decline-warning">
              ⚠️ This action cannot be undone. The purchase order will no longer appear in
              this list.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button
            class="btn-danger"
            :disabled="!deleteForm.reason || submitting"
            @click="confirmDelete"
          >
            {{ submitting ? "Deleting..." : "🗑️ Yes, Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== FULL-PAGE IMAGE VIEWER ==================== -->
    <Teleport to="body">
      <div
        v-if="showImageViewer"
        class="image-viewer-overlay"
        @click.self="closeImageViewer"
      >
        <div class="image-viewer-toolbar">
          <div class="viewer-title">
            <span class="viewer-icon">🖼️</span>
            <span class="viewer-title-text">{{ viewerTitle }}</span>
          </div>
          <div class="viewer-actions">
            <a
              :href="viewerImageUrl"
              :download="viewerFileName || 'document'"
              class="viewer-btn"
            >
              ⬇️ Download
            </a>
            <a :href="viewerImageUrl" target="_blank" class="viewer-btn">🔗 Open</a>
            <button class="viewer-btn viewer-close-btn" @click="closeImageViewer">
              ✕ Close
            </button>
          </div>
        </div>

        <div class="image-viewer-content">
          <img
            :src="viewerImageUrl"
            :alt="viewerTitle"
            class="viewer-image"
            :style="{ transform: `scale(${zoomLevel})` }"
          />
        </div>

        <div class="image-viewer-zoom">
          <button class="zoom-btn" @click="zoomOut">−</button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button class="zoom-btn" @click="zoomIn">+</button>
          <button class="zoom-btn" @click="resetZoom">⟲</button>
        </div>
      </div>
    </Teleport>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import purchaseFollowUpService, {
  resolveDocUrl,
} from "@/stores/purchaseFollowUpService";
import usersService, { type User } from "@/stores/users";

// ================================================================
// TYPES (local, matches service shapes)
// ================================================================

interface Bid {
  id: number;
  employee: string;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  submittedDate?: string | null;
  status: string;
  isWinner: boolean;
  matchesRequirement?: boolean | null;
  remark?: string | null;
  notes?: string | null;
  winnerManuallySelected?: boolean;
}

interface PurchaseItem {
  id: number;
  requestId: number;
  requestNumber: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  uom: string;
  brand?: string | null;
  model?: string | null;
  specification?: string | null;
  remark?: string | null;
  status: "pending_bids" | "bidding";
  hasWinner: boolean;
  winnerManuallySelected: boolean;
  bids: Bid[];
}

interface DispatchedPerson {
  id: number | string;
  userId?: number | null;
  name: string;
  department?: string | null;
  role?: string | null;
  isBoss: boolean;
  message?: string | null;
}

interface RequestGroup {
  requestId: number;
  requestNumber: string;
  requestedBy?: string | null;
  department?: string | null;
  departmentId?: number | null;
  requestDate: string;
  status: "pending_bids" | "bidding" | "submitted";
  items: PurchaseItem[];
  expertName?: string | null;
  preparedBy?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  approvedDate?: string | null;
  approvedDocFront?: string | null;
  approvedDocFrontName?: string | null;
  approvedDocBack?: string | null;
  approvedDocBackName?: string | null;
  dispatchRemark?: string | null;
  dispatchedTo: DispatchedPerson[];
}

// ================================================================
// STATE
// ================================================================

const followUps = ref<RequestGroup[]>([]);
const loading = ref(false);
const submitting = ref(false);

const searchQuery = ref("");
const filterStatus = ref("all");
const filterPriority = ref("all");
const filterDepartment = ref("all");

const currentPage = ref(1);
const pageSize = ref(5);
const totalItemsCount = ref(0);
const expandedRequest = ref<number | null>(null);

const stats = ref({
  totalRequests: 0,
  totalItems: 0,
  biddingItems: 0,
  winnerItems: 0,
});

// Modals
const showBidModal = ref(false);
const showRemoveModal = ref(false);
const showEditModal = ref(false);
const showSelectWinnerModal = ref(false);
const showManageDispatchModal = ref(false);
const showRemoveDispatchModal = ref(false);
const showSendToBossModal = ref(false);
const showDeleteModal = ref(false);

// Targets
const bidItem = ref<PurchaseItem | null>(null);
const removeTarget = ref<{ item: PurchaseItem; bid: Bid } | null>(null);
const editTarget = ref<{ item: PurchaseItem; bid: Bid } | null>(null);
const selectWinnerItem = ref<PurchaseItem | null>(null);
const dispatchTargetGroup = ref<RequestGroup | null>(null);
const removeDispatchTarget = ref<{
  group: RequestGroup;
  person: DispatchedPerson;
} | null>(null);
const sendBossTarget = ref<RequestGroup | null>(null);
const deleteTarget = ref<RequestGroup | null>(null);

// Remarks / forms
const removeRemark = ref("");
const selectedWinnerBidId = ref<number | null>(null);
const winnerOverrideReason = ref("");

const dispatchSearch = ref("");
const dispatchRoleFilter = ref<string>("all");
const dispatchForm = ref({
  purchaserIds: [] as number[],
  includeBoss: false,
  remark: "",
  bossMessage: "",
});

const sendBossForm = ref({ message: "" });

const deleteForm = ref({ reason: "", notes: "" });

const newBid = ref({
  employee: "",
  unitPrice: 0,
  totalPrice: 0,
  discount: 0,
  finalPrice: 0,
  matchesRequirement: true,
  remark: "",
  notes: "",
});

const editData = ref({
  unitPrice: 0,
  totalPrice: 0,
  discount: 0,
  finalPrice: 0,
  matchesRequirement: true,
  remark: "",
  notes: "",
});

// Image viewer
const showImageViewer = ref(false);
const viewerImageUrl = ref("");
const viewerTitle = ref("");
const viewerFileName = ref("");
const zoomLevel = ref(1);

// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// USERS (from usersService)
// ================================================================

// All active users — used both for dispatch picker and sales-person dropdown
const activeEmployees = ref<User[]>([]);
const usersLoading = ref(false);
const usersError = ref<string | null>(null);

// Boss (resolved from users; falls back to defaults)
// 🔥 FIX: added userId so the backend can insert a notification for the boss
const currentBoss = ref({
  userId: null as number | null,
  name: "Tegaye Debebe",
  role: "MANAGER",
  email: "tegaye.debebe@sdt.com",
  initials: "TD",
});

// Static config
const deleteReasons = [
  "Price too high / over budget",
  "No supplier available",
  "Duplicate request",
  "Not required anymore",
  "Wrong specifications",
  "Other (see notes)",
];

// Track which groups have been sent to boss (local UI state)
const sentToBossByRequest = ref<Record<number, boolean>>({});

// ================================================================
// USER LOADERS
// ================================================================

// Distinct roles available in the active employees list
const dispatchRoleOptions = computed(() => {
  const set = new Set<string>();
  activeEmployees.value.forEach((u) => {
    const r = (u.role || "").toString().trim();
    if (r) set.add(r);
  });
  return Array.from(set).sort();
});

const mapUserToPurchaser = (u: User) => ({
  id: u.userId,
  name: u.fullName || u.username || `User #${u.userId}`,
  department: u.departmentName || u.departmentCode || "—",
  role: (u.role || "").toString(),
});

/**
 * Load all active users.
 * Used both for the dispatch picker and the sales-person dropdown.
 */
const loadActiveEmployees = async (): Promise<void> => {
  usersLoading.value = true;
  usersError.value = null;
  try {
    const res = await usersService.getUsers({
      page: 1,
      limit: 500,
      status: "active",
      sortBy: "fullName",
      sortOrder: "ASC",
    });

    if (!res.success) throw new Error("Failed to load users");
    activeEmployees.value = res.data;
  } catch (err: any) {
    console.error("loadActiveEmployees error:", err);
    usersError.value = err?.message || "Failed to load users";
    activeEmployees.value = [];
  } finally {
    usersLoading.value = false;
  }
};

/**
 * Resolve the current boss from users.
 * Boss = MANAGER role. Falls back to admin if no manager exists.
 * 🔥 FIX: captures userId so notifications can be sent
 */
const loadBoss = async (): Promise<void> => {
  try {
    // Try manager role first (this is the boss)
    let res = await usersService.getUsers({
      page: 1,
      limit: 1,
      role: "manager",
      status: "active",
      sortBy: "fullName",
      sortOrder: "ASC",
    });

    // Fallback: try admin if no manager exists
    if (!res.success || res.data.length === 0) {
      res = await usersService.getUsers({
        page: 1,
        limit: 1,
        role: "admin",
        status: "active",
        sortBy: "fullName",
        sortOrder: "ASC",
      });
    }

    if (res.success && res.data.length > 0) {
      const u = res.data[0];
      const name = u.fullName || u.username || "Manager";
      const initials = name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      currentBoss.value = {
        userId: u.userId,       // 🔥 FIX: capture the userId
        name,
        role: (u.role || "Manager").toString().toUpperCase(),
        email: u.email || "",
        initials: initials || "MG",
      };
    }
  } catch (err) {
    console.error("loadBoss error:", err);
    // Keep fallback defaults
  }
};

// ================================================================
// COMPUTED
// ================================================================

const groupedRequests = computed(() => followUps.value);
const paginatedGroups = computed(() => followUps.value);

const totalPages = computed(
  () => Math.ceil(totalItemsCount.value / pageSize.value) || 1
);

const departmentOptions = computed(() => {
  const set = new Set<string>();
  followUps.value.forEach((g) => {
    if (g.department) set.add(g.department);
  });
  return Array.from(set).sort();
});

const hasActiveFilters = computed(
  () =>
    filterStatus.value !== "all" ||
    filterPriority.value !== "all" ||
    filterDepartment.value !== "all" ||
    !!searchQuery.value
);

const isBidValid = computed(
  () =>
    newBid.value.employee.trim() !== "" &&
    newBid.value.unitPrice > 0 &&
    (newBid.value.matchesRequirement !== false ||
      (newBid.value.matchesRequirement === false &&
        newBid.value.remark.trim() !== ""))
);

const isEditValid = computed(
  () =>
    editData.value.unitPrice > 0 &&
    (editData.value.matchesRequirement !== false ||
      (editData.value.matchesRequirement === false &&
        editData.value.remark.trim() !== ""))
);

// Purchasers in the dispatch modal — all active users, mapped
const purchasers = computed(() => activeEmployees.value.map(mapUserToPurchaser));

const filteredDispatchPurchasers = computed(() => {
  let list = [...purchasers.value];

  // Filter by role
  if (dispatchRoleFilter.value !== "all") {
    const roleWanted = dispatchRoleFilter.value.toLowerCase();
    list = list.filter(
      (p) => (p.role || "").toLowerCase() === roleWanted
    );
  }

  // Filter by search text
  if (dispatchSearch.value) {
    const s = dispatchSearch.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.department.toLowerCase().includes(s)
    );
  }

  return list;
});

const allVisiblePurchasersSelected = computed(() => {
  const list = filteredDispatchPurchasers.value;
  if (list.length === 0) return false;
  return list.every((p) => dispatchForm.value.purchaserIds.includes(p.id));
});

// ================================================================
// HELPERS
// ================================================================

const getItemNames = (items: PurchaseItem[]): string =>
  items.map((i) => i.itemName).join(", ");

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending_bids: "Pending",
    bidding: "Price Collection",
    submitted: " All Submitted",
  };
  return labels[status] || status;
};

const formatDate = (dateStr?: string | null): string =>
  purchaseFollowUpService.formatDate(dateStr);

const formatDateTime = (dateStr?: string | null): string =>
  purchaseFollowUpService.formatDateTime(dateStr);

const getInitials = (name: string): string =>
  purchaseFollowUpService.getInitials(name);

const getFileName = (url?: string | null): string =>
  purchaseFollowUpService.getFileName(url);

const getWinnerBid = (item: PurchaseItem): Bid | null =>
  item.bids?.find((b) => b.isWinner) || null;

const getSortedBids = (item: PurchaseItem): Bid[] => {
  if (!item.bids) return [];
  const winner = item.bids.find((b) => b.isWinner);
  const others = item.bids
    .filter((b) => !b.isWinner)
    .sort((a, b) => a.finalPrice - b.finalPrice);
  return winner ? [winner, ...others] : others;
};

const hasAnyWinner = (group: RequestGroup): boolean =>
  group.items.some((i) => i.hasWinner);

const countWinners = (group: RequestGroup): number =>
  group.items.filter((i) => i.hasWinner).length;

const countPending = (group: RequestGroup): number =>
  group.items.filter((i) => !i.hasWinner).length;

const getGroupTotalFinal = (group: RequestGroup): number =>
  group.items.reduce((sum, i) => sum + (getWinnerBid(i)?.finalPrice || 0), 0);

// ================================================================
// DATA FETCHING
// ================================================================

const loadFollowUps = async (): Promise<void> => {
  loading.value = true;
  try {
    const res = await purchaseFollowUpService.list({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value as any,
      priority: filterPriority.value as any,
      department:
        filterDepartment.value !== "all" ? filterDepartment.value : undefined,
    });

    if (!res.success) throw new Error(res.error);

    followUps.value = res.data.items.map((fu) => ({
      ...fu,
      approvedDocFront: fu.approvedDocFront
        ? resolveDocUrl(fu.approvedDocFront)
        : undefined,
      approvedDocBack: fu.approvedDocBack
        ? resolveDocUrl(fu.approvedDocBack)
        : undefined,
    })) as unknown as RequestGroup[];

    totalItemsCount.value = res.data.total;

    followUps.value.forEach((fu) => {
      if (fu.status === "submitted") {
        sentToBossByRequest.value[fu.requestId] = true;
      }
    });
  } catch (err: any) {
    console.error(err);
    showToastMessage(err?.message || "Failed to load follow-ups", "error");
  } finally {
    loading.value = false;
  }
};

const loadStats = async (): Promise<void> => {
  const res = await purchaseFollowUpService.getStats();
  if (res.success) stats.value = res.data;
};

const refreshData = async (): Promise<void> => {
  await Promise.all([loadFollowUps(), loadStats(), loadActiveEmployees()]);
  showToastMessage("Data refreshed", "info");
};

// ================================================================
// SEARCH / FILTER / PAGINATION
// ================================================================

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const onSearchChange = (): void => {
  currentPage.value = 1;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadFollowUps(), 350);
};

const onFilterChange = (): void => {
  currentPage.value = 1;
  loadFollowUps();
};

const clearFilters = (): void => {
  filterStatus.value = "all";
  filterPriority.value = "all";
  filterDepartment.value = "all";
  searchQuery.value = "";
  currentPage.value = 1;
  loadFollowUps();
  showToastMessage("Filters cleared", "info");
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadFollowUps();
};

const changePageSize = (): void => {
  currentPage.value = 1;
  loadFollowUps();
};

const toggleExpand = (requestId: number): void => {
  expandedRequest.value =
    expandedRequest.value === requestId ? null : requestId;
};

const replaceFollowUp = (updated: any) => {
  const idx = followUps.value.findIndex(
    (f) => f.requestId === updated.requestId
  );
  if (idx !== -1) {
    const resolved = {
      ...updated,
      approvedDocFront: updated.approvedDocFront
        ? resolveDocUrl(updated.approvedDocFront)
        : undefined,
      approvedDocBack: updated.approvedDocBack
        ? resolveDocUrl(updated.approvedDocBack)
        : undefined,
    };
    followUps.value = [
      ...followUps.value.slice(0, idx),
      resolved as RequestGroup,
      ...followUps.value.slice(idx + 1),
    ];
  }
};

// ================================================================
// BID SUBMIT / EDIT / REMOVE
// ================================================================

const calculateBidTotal = (): void => {
  if (bidItem.value) {
    const totalPrice = newBid.value.unitPrice * bidItem.value.quantity;
    newBid.value.totalPrice = totalPrice;
    newBid.value.finalPrice = Math.max(0, totalPrice - newBid.value.discount);
  }
};

const calculateEditTotal = (): void => {
  if (editTarget.value) {
    const totalPrice =
      editData.value.unitPrice * editTarget.value.item.quantity;
    editData.value.totalPrice = totalPrice;
    editData.value.finalPrice = Math.max(
      0,
      totalPrice - editData.value.discount
    );
  }
};

const openBidModal = (item: PurchaseItem): void => {
  bidItem.value = item;
  newBid.value = {
    employee: "",
    unitPrice: 0,
    totalPrice: 0,
    discount: 0,
    finalPrice: 0,
    matchesRequirement: true,
    remark: "",
    notes: "",
  };
  showBidModal.value = true;
};

const submitBid = async (): Promise<void> => {
  if (!bidItem.value || !isBidValid.value) return;
  submitting.value = true;
  try {
    const res = await purchaseFollowUpService.submitPrice(bidItem.value.id, {
      employee: newBid.value.employee.trim(),
      unitPrice: newBid.value.unitPrice,
      discount: newBid.value.discount,
      matchesRequirement: newBid.value.matchesRequirement,
      remark: newBid.value.remark || null,
      notes: newBid.value.notes || null,
    });
    if (!res.success) throw new Error(res.error);
    replaceFollowUp(res.data);
    showToastMessage("Price submitted", "success");
    showBidModal.value = false;
    bidItem.value = null;
    await loadStats();
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to submit price", "error");
  } finally {
    submitting.value = false;
  }
};

const openEditModal = (item: PurchaseItem, bid: Bid): void => {
  editTarget.value = { item, bid };
  editData.value = {
    unitPrice: bid.unitPrice,
    totalPrice: bid.totalPrice,
    discount: bid.discount,
    finalPrice: bid.finalPrice,
    matchesRequirement: bid.matchesRequirement !== false,
    remark: bid.remark || "",
    notes: bid.notes || "",
  };
  showEditModal.value = true;
};

const confirmEdit = async (): Promise<void> => {
  if (!editTarget.value || !isEditValid.value) return;
  submitting.value = true;
  try {
    const res = await purchaseFollowUpService.updatePrice(
      editTarget.value.bid.id,
      {
        unitPrice: editData.value.unitPrice,
        discount: editData.value.discount,
        matchesRequirement: editData.value.matchesRequirement,
        remark: editData.value.remark || null,
        notes: editData.value.notes || null,
      }
    );
    if (!res.success) throw new Error(res.error);
    replaceFollowUp(res.data);
    showToastMessage("Price updated", "success");
    showEditModal.value = false;
    editTarget.value = null;
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to update price", "error");
  } finally {
    submitting.value = false;
  }
};

const openRemoveModal = (item: PurchaseItem, bid: Bid): void => {
  removeTarget.value = { item, bid };
  removeRemark.value = "";
  showRemoveModal.value = true;
};

const confirmRemove = async (): Promise<void> => {
  if (!removeTarget.value) return;
  submitting.value = true;
  try {
    const res = await purchaseFollowUpService.removePrice(
      removeTarget.value.bid.id,
      removeRemark.value || null
    );
    if (!res.success) throw new Error(res.error);
    replaceFollowUp(res.data);
    showToastMessage("Price removed", "success");
    showRemoveModal.value = false;
    removeTarget.value = null;
    removeRemark.value = "";
    await loadStats();
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to remove price", "error");
  } finally {
    submitting.value = false;
  }
};

// ================================================================
// SELECT WINNER
// ================================================================

const openSelectWinnerModal = (item: PurchaseItem): void => {
  if (!item.bids || item.bids.length === 0) {
    showToastMessage("No bids to select from", "warning");
    return;
  }
  selectWinnerItem.value = item;
  const current = item.bids.find((b) => b.isWinner);
  selectedWinnerBidId.value = current?.id ?? null;
  winnerOverrideReason.value = "";
  showSelectWinnerModal.value = true;
};

const confirmSelectWinner = async (): Promise<void> => {
  if (!selectWinnerItem.value || !selectedWinnerBidId.value) return;
  submitting.value = true;
  try {
    const res = await purchaseFollowUpService.selectWinner(
      selectWinnerItem.value.id,
      {
        priceId: selectedWinnerBidId.value,
        reason: winnerOverrideReason.value || null,
      }
    );
    if (!res.success) throw new Error(res.error);
    replaceFollowUp(res.data);
    showToastMessage("🏆 Winner updated", "success");
    showSelectWinnerModal.value = false;
    selectWinnerItem.value = null;
    selectedWinnerBidId.value = null;
    winnerOverrideReason.value = "";
    await loadStats();
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to select winner", "error");
  } finally {
    submitting.value = false;
  }
};

// ================================================================
// DISPATCH
// ================================================================

const openDispatchModal = async (group: RequestGroup): Promise<void> => {
  if (activeEmployees.value.length === 0 && !usersLoading.value) {
    await loadActiveEmployees();
  }

  dispatchTargetGroup.value = group;
  dispatchSearch.value = "";
  dispatchRoleFilter.value = "all";
  dispatchForm.value = {
    purchaserIds: (group.dispatchedTo || [])
      .filter((d) => !d.isBoss && typeof d.userId === "number")
      .map((d) => d.userId as number),
    includeBoss: (group.dispatchedTo || []).some((d) => d.isBoss),
    remark: "",
    bossMessage:
      (group.dispatchedTo || []).find((d) => d.isBoss)?.message || "",
  };
  showManageDispatchModal.value = true;
};

const closeDispatchModal = (): void => {
  showManageDispatchModal.value = false;
  dispatchTargetGroup.value = null;
  dispatchSearch.value = "";
  dispatchRoleFilter.value = "all";
  dispatchForm.value = {
    purchaserIds: [],
    includeBoss: false,
    remark: "",
    bossMessage: "",
  };
};

const togglePurchaserPick = (id: number): void => {
  const list = dispatchForm.value.purchaserIds;
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(id);
};

const toggleSelectAllVisible = (): void => {
  const visible = filteredDispatchPurchasers.value;
  if (allVisiblePurchasersSelected.value) {
    dispatchForm.value.purchaserIds = dispatchForm.value.purchaserIds.filter(
      (id) => !visible.some((p) => p.id === id)
    );
  } else {
    const set = new Set(dispatchForm.value.purchaserIds);
    visible.forEach((p) => set.add(p.id));
    dispatchForm.value.purchaserIds = Array.from(set);
  }
};

const saveDispatch = async (): Promise<void> => {
  const group = dispatchTargetGroup.value;
  if (!group) return;

  const payload: any[] = [];
  if (dispatchForm.value.includeBoss) {
    payload.push({
      userId: currentBoss.value.userId || null,   // 🔥 FIX: send the real userId
      name: currentBoss.value.name,
      department: "Management",
      role: currentBoss.value.role,
      isBoss: true,
      message: dispatchForm.value.bossMessage || null,
    });
  }

  dispatchForm.value.purchaserIds.forEach((id) => {
    const p = purchasers.value.find((x) => x.id === id);
    if (!p) return;
    payload.push({
      userId: p.id,
      name: p.name,
      department: p.department,
      role: "Purchaser",
      isBoss: false,
      message: null,
    });
  });

  submitting.value = true;
  try {
    // 🔥 FIX: also pass the shared remark as 3rd argument
    const res = await purchaseFollowUpService.setDispatches(
      group.requestId,
      payload,
      dispatchForm.value.remark || null
    );
    if (!res.success) throw new Error(res.error);
    replaceFollowUp(res.data);
    showToastMessage("📤 Dispatch list updated", "success");
    closeDispatchModal();
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to save dispatch", "error");
  } finally {
    submitting.value = false;
  }
};

const removeDispatcher = (group: RequestGroup, id: number | string): void => {
  const person = (group.dispatchedTo || []).find((d) => d.id === id);
  if (!person) return;
  removeDispatchTarget.value = { group, person };
  showRemoveDispatchModal.value = true;
};

const closeRemoveDispatchModal = (): void => {
  showRemoveDispatchModal.value = false;
  removeDispatchTarget.value = null;
};

const confirmRemoveDispatcher = async (): Promise<void> => {
  const target = removeDispatchTarget.value;
  if (!target) return;
  submitting.value = true;
  try {
    const res = await purchaseFollowUpService.removeDispatch(target.person.id);
    if (!res.success) throw new Error(res.error);
    replaceFollowUp(res.data);
    showToastMessage("Recipient removed", "success");
    closeRemoveDispatchModal();
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to remove recipient", "error");
  } finally {
    submitting.value = false;
  }
};

// ================================================================
// SEND TO BOSS
// ================================================================

const openSendToBossModal = (group: RequestGroup): void => {
  if (!hasAnyWinner(group)) {
    showToastMessage(
      "No item has a winner yet. Submit at least one price first.",
      "warning"
    );
    return;
  }
  sendBossTarget.value = group;
  sendBossForm.value = { message: "" };
  showSendToBossModal.value = true;
};

const closeSendToBossModal = (): void => {
  showSendToBossModal.value = false;
  sendBossTarget.value = null;
  sendBossForm.value = { message: "" };
};

const confirmSendToBoss = async (): Promise<void> => {
  const group = sendBossTarget.value;
  if (!group) return;

  const ready = countWinners(group);
  const pending = countPending(group);

  submitting.value = true;
  try {
    // 🔔 Hit the backend — it creates the boss notification
    const res = await purchaseFollowUpService.sendToBoss(
      group.requestId,
      sendBossForm.value.message || null
    );

    if (!res.success) throw new Error(res.error);

    // Update local state with fresh server data
    if (res.data) replaceFollowUp(res.data);

    // Mark as sent in the UI
    sentToBossByRequest.value[group.requestId] = true;

    if (pending > 0) {
      showToastMessage(
        `📨 Sent ${ready} item(s) to ${currentBoss.value.name} — ${pending} still pending`,
        "success"
      );
    } else {
      showToastMessage(
        `📨 All prices sent to ${currentBoss.value.name}`,
        "success"
      );
    }

    closeSendToBossModal();
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to send to boss", "error");
  } finally {
    submitting.value = false;
  }
};

// ================================================================
// DELETE PO
// ================================================================

const openDeleteGroupModal = (group: RequestGroup): void => {
  deleteTarget.value = group;
  deleteForm.value = { reason: "", notes: "" };
  showDeleteModal.value = true;
};

const closeDeleteModal = (): void => {
  showDeleteModal.value = false;
  deleteTarget.value = null;
  deleteForm.value = { reason: "", notes: "" };
};

const confirmDelete = (): void => {
  const group = deleteTarget.value;
  if (!group || !deleteForm.value.reason) return;

  followUps.value = followUps.value.filter(
    (f) => f.requestId !== group.requestId
  );
  if (expandedRequest.value === group.requestId) {
    expandedRequest.value = null;
  }
  totalItemsCount.value = Math.max(
    0,
    totalItemsCount.value - group.items.length
  );

  showToastMessage(
    `🗑️ ${group.requestNumber} deleted (${deleteForm.value.reason})`,
    "info"
  );
  closeDeleteModal();
};

// ================================================================
// IMAGE VIEWER
// ================================================================

const onImageLoad = (e: Event): void => {
  const img = e.target as HTMLImageElement;
  img.classList.add("loaded");
  const skel = img.parentElement?.querySelector(".doc-skeleton");
  if (skel) (skel as HTMLElement).style.display = "none";
};

const onImageError = (e: Event): void => {
  const img = e.target as HTMLImageElement;
  img.classList.add("error");
  const skel = img.parentElement?.querySelector(".doc-skeleton");
  if (skel) (skel as HTMLElement).textContent = "⚠️ Failed to load";
};

const openImageViewer = (
  url: string,
  title: string,
  fileName?: string
): void => {
  viewerImageUrl.value = url;
  viewerTitle.value = title;
  viewerFileName.value = fileName || getFileName(url);
  zoomLevel.value = 1;
  showImageViewer.value = true;
  document.body.style.overflow = "hidden";
};

const closeImageViewer = (): void => {
  showImageViewer.value = false;
  viewerImageUrl.value = "";
  viewerTitle.value = "";
  viewerFileName.value = "";
  zoomLevel.value = 1;
  document.body.style.overflow = "";
};

const zoomIn = (): void => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3);
};
const zoomOut = (): void => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.25);
};
const resetZoom = (): void => {
  zoomLevel.value = 1;
};

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.key === "Escape" && showImageViewer.value) closeImageViewer();
  if (showImageViewer.value) {
    if (e.key === "+" || e.key === "=") zoomIn();
    if (e.key === "-") zoomOut();
    if (e.key === "0") resetZoom();
  }
};

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (
  msg: string,
  type: "success" | "error" | "info" | "warning" = "success"
): void => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// EXPORT
// ================================================================

const exportData = (): void => {
  const headers = [
    "Request #",
    "Item",
    "Code",
    "Qty",
    "UOM",
    "Status",
    "Winner",
    "Unit Price",
    "Final Price",
  ];
  const rows: string[][] = [];
  followUps.value.forEach((group) => {
    group.items.forEach((item) => {
      const winner = getWinnerBid(item);
      rows.push([
        item.requestNumber,
        item.itemName,
        item.itemCode,
        String(item.quantity),
        item.uom,
        getStatusLabel(item.status),
        winner ? winner.employee : "",
        winner ? winner.unitPrice.toFixed(2) : "",
        winner ? winner.finalPrice.toFixed(2) : "",
      ]);
    });
  });
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `purchase_follow_up_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  await Promise.all([
    loadFollowUps(),
    loadStats(),
    loadActiveEmployees(),
    loadBoss(),
  ]);
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
  if (searchTimer) clearTimeout(searchTimer);
});
</script>

<style scoped>
/* ================================================================
   Base & Section
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
}
.total-badge {
  background: #e2e8f0;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #475569;
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
  color: #94a3b8;
  font-size: 12px;
}
.btn-export {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
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
}

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
}

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
}
.code-cell {
  font-weight: 600;
  font-family: "Courier New", monospace;
  font-size: 11px;
  background: #f8fafc;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}
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
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}
.status-badge.pending_bids {
  background: #fef3c7;
  color: #92400e;
}
.status-badge.bidding {
  background: #ede9fe;
  color: #5b21b6;
}
.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}
.status-badge.declined {
  background: #fee2e2;
  color: #991b1b;
}

.priority-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}
.priority-badge.low {
  background: #dbeafe;
  color: #1e40af;
}
.priority-badge.medium {
  background: #fef3c7;
  color: #92400e;
}
.priority-badge.high {
  background: #fde68a;
  color: #92400e;
}
.priority-badge.urgent {
  background: #fee2e2;
  color: #991b1b;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.icon-btn {
  background: transparent;
  border: none;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
}
.icon-btn:hover {
  background: #f1f5f9;
}
.icon-btn.trash-btn {
  color: #dc2626;
  font-size: 15px;
}
.icon-btn.trash-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}

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
}
.detail-expand-row td {
  padding: 0 !important;
}
.expand-details {
  padding: 20px;
  background: #f8fafc;
}
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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
.request-status.pending_bids {
  background: #fef3c7;
  color: #92400e;
}
.request-status.bidding {
  background: #ede9fe;
  color: #5b21b6;
}
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

.top-section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-card {
  background: white;
  border-radius: 10px;
  padding: 16px 18px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}
.detail-card.full-width {
  grid-column: 1 / -1;
}
.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}
.detail-card-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.member-count-badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed #f1f5f9;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  min-width: 110px;
  flex-shrink: 0;
}
.info-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  flex: 1;
  word-break: break-word;
}
.info-value.code-value {
  font-family: monospace;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 10px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.dispatch-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-add-dispatch {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.btn-add-dispatch:hover {
  background: #7c3aed;
}
.dispatch-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  text-align: center;
}
.dispatch-empty-icon {
  font-size: 36px;
  opacity: 0.4;
}
.dispatch-empty p {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}
.btn-add-dispatch-inline {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px dashed #c4b5fd;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.dispatched-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dispatched-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.dispatched-item.boss-item {
  background: #f5f3ff;
  border-color: #ddd6fe;
}
.dispatched-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dispatched-avatar.boss-avatar {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}
.dispatched-details {
  flex: 1;
  min-width: 0;
}
.dispatched-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.boss-crown {
  font-size: 12px;
}
.dispatched-role {
  font-size: 11px;
  color: #64748b;
}
.btn-remove-dispatch {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.btn-remove-dispatch:hover {
  background: #fee2e2;
  color: #dc2626;
}

.docs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.doc-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}
.doc-card-header {
  padding: 8px 12px;
  background: #eff6ff;
  border-bottom: 1px solid #dbeafe;
}
.doc-side-label {
  font-size: 12px;
  font-weight: 600;
  color: #1e40af;
  text-transform: uppercase;
}
.doc-image-wrapper {
  position: relative;
  width: 100%;
  height: 240px;
  cursor: zoom-in;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
.doc-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #94a3b8;
  background: #f8fafc;
}
.doc-thumbnail {
  position: relative;
  z-index: 1;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.35s;
}
.doc-thumbnail.loaded {
  opacity: 1;
}
.doc-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.25s;
  color: white;
}
.doc-image-wrapper:hover .doc-overlay {
  opacity: 1;
}
.zoom-icon {
  font-size: 28px;
}
.zoom-text {
  font-size: 12px;
}
.doc-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-top: 1px solid #f1f5f9;
}
.doc-filename {
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.doc-view-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
}

.item-detail-block {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}
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
}
.item-actions-top button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-bid-item {
  background: #ede9fe;
  color: #5b21b6;
}
.btn-bid-item:hover:not(:disabled) {
  background: #ddd6fe;
}
.btn-select-winner {
  background: #fef3c7;
  color: #92400e;
}
.btn-select-winner:hover:not(:disabled) {
  background: #fde68a;
}

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
  color: #64748b;
}
.item-status-bar .bid-count {
  font-size: 11px;
  color: #7c3aed;
}
.item-status-bar .winner-indicator {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.manual-lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #fef3c7;
  color: #92400e;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 6px;
  letter-spacing: 0.2px;
  text-transform: uppercase;
}

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
}
.price-table tbody td {
  padding: 5px 8px;
  border-bottom: 1px solid #f1f5f9;
}
.price-table tbody tr.winner-row {
  background: #d1fae5;
}
.price-table tbody tr.match-row {
  background: #eff6ff;
}
.price-table tbody tr.not-match-row {
  background: #fef2f2;
}
.rank-winner {
  font-size: 14px;
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
.match-badge-small,
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
}
.pending-badge-small {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
}
.rejected-badge-small {
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
}
.accepted-badge-small {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
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
}
.btn-remove-price-small {
  background: #fee2e2;
  border: none;
  color: #991b1b;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}
.no-data {
  color: #94a3b8;
  font-style: italic;
  padding: 8px 0;
  font-size: 12px;
}

.final-price-summary {
  margin-top: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #6ee7b7;
  border-radius: 8px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.final-price-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.final-price-label {
  font-size: 12px;
  font-weight: 600;
  color: #065f46;
}
.final-price-value {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}
.final-price-value.amount {
  color: #2563eb;
  font-size: 15px;
}

/* ================================================================ */
/* SEND TO BOSS SECTION                                              */
/* ================================================================ */
.send-to-boss-section {
  background: white;
  border-radius: 12px;
  border: 2px dashed #c4b5fd;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  transition: all 0.2s;
}
.send-to-boss-section.sent {
  border-style: solid;
  border-color: #10b981;
  background: #f0fdf4;
}
.send-boss-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.send-boss-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}
.send-boss-text {
  display: flex;
  flex-direction: column;
}
.send-boss-text strong {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.send-boss-text small {
  font-size: 11px;
  color: #64748b;
}
.send-boss-progress {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.progress-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.2px;
}
.progress-chip.ready {
  background: #dcfce7;
  color: #166534;
}
.progress-chip.pending {
  background: #fef3c7;
  color: #92400e;
}
.send-boss-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.sent-to-boss-badge {
  background: #dcfce7;
  color: #166534;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
  letter-spacing: 0.2px;
}
.btn-send-boss {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
  transition: all 0.2s;
}
.btn-send-boss:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
}
.btn-send-boss:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.boss-recipient-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 10px;
  margin-bottom: 14px;
}
.boss-recipient-info {
  flex: 1;
  min-width: 0;
}
.boss-recipient-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.boss-recipient-role {
  font-size: 11px;
  color: #8b5cf6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 2px;
}
.boss-recipient-email {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}
.boss-recipient-check {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #dcfce7;
  color: #166534;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.send-readiness-summary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 14px;
}
.readiness-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 13px;
  border-bottom: 1px dashed #e2e8f0;
}
.readiness-row:last-child {
  border-bottom: none;
}
.readiness-row.total {
  border-top: 1px solid #cbd5e1;
  margin-top: 4px;
  padding-top: 8px;
  border-bottom: none;
}
.readiness-label {
  color: #64748b;
}
.readiness-value {
  font-weight: 700;
  color: #0f172a;
}
.readiness-value.ready {
  color: #166534;
}
.readiness-value.pending {
  color: #b45309;
}
.readiness-value.amount {
  color: #2563eb;
  font-size: 15px;
}

.partial-send-notice {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 12.5px;
  line-height: 1.5;
  margin-bottom: 14px;
}
.partial-send-notice em {
  font-style: italic;
  font-weight: 600;
}

/* ================================================================
   SEND PREVIEW
   ================================================================ */
.send-preview {
  margin-bottom: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  max-height: 420px;
  overflow: hidden;
}
.send-preview-title {
  background: #eff6ff;
  color: #1e40af;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  border-bottom: 1px solid #dbeafe;
  flex-shrink: 0;
}
.send-preview-items {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
}
.send-preview-items::-webkit-scrollbar {
  width: 8px;
}
.send-preview-items::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}
.send-preview-items::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.send-preview-items::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.send-preview-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: visible;
  flex-shrink: 0;
}
.send-preview-item.spi-item-pending {
  border-color: #fbbf24;
  background: #fffbeb;
}
.send-preview-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}
.send-preview-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.spi-num {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  background: white;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}
.send-preview-item-title strong {
  font-size: 13px;
  color: #0f172a;
}
.spi-code {
  font-size: 10px;
  font-family: monospace;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 10px;
}
.spi-ready-badge {
  font-size: 10px;
  font-weight: 700;
  color: #166534;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 10px;
}
.spi-pending-badge {
  font-size: 10px;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  padding: 2px 8px;
  border-radius: 10px;
}
.send-preview-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #475569;
}
.spi-count {
  font-size: 10px;
  font-weight: 700;
  color: #7c3aed;
  background: #ede9fe;
  padding: 2px 8px;
  border-radius: 10px;
}
.spi-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.spi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.spi-table thead th {
  background: #f8fafc;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e2e8f0;
}
.spi-table tbody td {
  padding: 5px 8px;
  border-bottom: 1px solid #f1f5f9;
}
.spi-table tbody tr:last-child td {
  border-bottom: none;
}
.spi-table tbody tr.spi-winner-row {
  background: #d1fae5;
}
.spi-crown {
  font-size: 13px;
}
.spi-rank {
  color: #94a3b8;
  font-weight: 500;
}
.spi-name {
  font-weight: 600;
  color: #0f172a;
}
.spi-discount {
  color: #ef4444;
}
.spi-final {
  font-weight: 700;
  color: #2563eb;
}
.spi-center {
  text-align: center;
}
.spi-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}
.spi-badge-win {
  background: #10b981;
  color: white;
}
.spi-badge-rej {
  background: #fee2e2;
  color: #991b1b;
}
.spi-badge-pend {
  background: #fef3c7;
  color: #92400e;
}
.spi-empty {
  padding: 10px 12px;
  color: #94a3b8;
  font-style: italic;
  font-size: 11px;
}

/* ================================================================
   DELETE MODAL (formerly Decline)
   ================================================================ */
.decline-info {
  text-align: center;
  padding: 8px 0;
}
.decline-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.decline-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}
.decline-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}
.decline-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  text-align: left;
}
.decline-reasons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.reason-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.reason-chip:hover {
  border-color: #fca5a5;
  background: #fef2f2;
}
.reason-chip.selected {
  border-color: #ef4444;
  background: #fee2e2;
  color: #991b1b;
  font-weight: 600;
}
.reason-chip input[type="radio"] {
  accent-color: #ef4444;
}
.decline-warning {
  background: #fee2e2;
  color: #991b1b;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  margin-top: 8px;
  line-height: 1.5;
}

/* ================================================================
   Select Winner Modal
   ================================================================ */
.winner-selection-hint {
  background: #eff6ff;
  color: #1e40af;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  margin-bottom: 12px;
  border-left: 3px solid #3b82f6;
}
.winner-candidates {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.winner-candidate {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.winner-candidate:hover {
  border-color: #a78bfa;
}
.winner-candidate.candidate-selected {
  border-color: #10b981;
  background: #f0fdf4;
}
.winner-candidate.candidate-current {
  border-color: #f59e0b;
}
.winner-candidate input[type="radio"] {
  margin-top: 3px;
  width: 18px;
  height: 18px;
  accent-color: #10b981;
  cursor: pointer;
}
.candidate-body {
  flex: 1;
}
.candidate-header {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.candidate-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.current-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}
.match-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}
.not-match-badge {
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}
.candidate-prices {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #475569;
}
.candidate-prices strong {
  color: #0f172a;
}
.candidate-prices strong.amount {
  color: #2563eb;
  font-size: 13px;
}
.candidate-remark {
  font-size: 11px;
  color: #dc2626;
  margin-top: 6px;
  font-style: italic;
}

/* ================================================================
   Modal shell
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  min-height: 0;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}
.modal-container.small-modal {
  max-width: 600px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  flex-shrink: 0;
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
}
.modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
}
.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
  flex-shrink: 0;
}

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
.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: white;
}
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}
select.form-input {
  appearance: auto;
  cursor: pointer;
}
select.form-input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.form-input.final-amount {
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
}
.form-textarea {
  resize: vertical;
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

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.btn-secondary:hover {
  background: #e2e8f0;
}
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}
.btn-primary:hover {
  background: #2563eb;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
}
.btn-danger:hover {
  background: #dc2626;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  color: #64748b;
  font-size: 13px;
}
.remove-value {
  color: #0f172a;
  font-weight: 500;
  font-size: 13px;
}
.remove-warning {
  background: #fef3c7;
  color: #92400e;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 8px;
}
.remove-remark {
  margin-top: 12px;
  text-align: left;
}

.dispatch-section {
  margin-bottom: 16px;
}
.dispatch-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}
.boss-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
}
.boss-card.boss-card-active {
  border-style: solid;
  border-color: #8b5cf6;
  background: #f5f3ff;
}
.boss-card-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.boss-card-info {
  flex: 1;
}
.boss-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.boss-card-role {
  font-size: 11px;
  color: #8b5cf6;
  font-weight: 600;
}
.boss-card-email {
  font-size: 11px;
  color: #64748b;
}
.boss-message-wrapper {
  margin-top: 12px;
  padding: 12px 14px;
  background: #faf5ff;
  border: 1px dashed #c4b5fd;
  border-radius: 8px;
}
.boss-message-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6d28d9;
  margin-bottom: 6px;
}
.search-purchaser-wrapper {
  position: relative;
  margin-bottom: 8px;
}
.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.search-purchaser-input {
  padding-left: 34px !important;
}

/* ================================================================
   Dispatch filter row: search input + role select
   ================================================================ */
.dispatch-filters-row {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.dispatch-filters-row .search-purchaser-wrapper {
  margin-bottom: 0;
}
.dispatch-role-select {
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  background: white;
}

.purchaser-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  max-height: 220px;
  overflow-y: auto;
}
.purchaser-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.purchaser-table th {
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
}
.purchaser-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.purchaser-table tr.selected-row {
  background: #ede9fe;
}
.purchaser-table td.no-results {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  padding: 16px;
}
.role-pill {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
  text-transform: capitalize;
}
.purchaser-loading,
.purchaser-error {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  border-radius: 8px;
}
.purchaser-loading {
  color: #64748b;
  background: #f8fafc;
}
.purchaser-error {
  color: #991b1b;
  background: #fee2e2;
}
.dispatch-info-text {
  background: #d1fae5;
  color: #065f46;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}
.dispatch-warning-text {
  background: #fef3c7;
  color: #92400e;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

.image-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}
.image-viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(15, 23, 42, 0.9);
  color: white;
  gap: 12px;
  flex-wrap: wrap;
}
.viewer-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.viewer-title-text {
  font-size: 15px;
  font-weight: 600;
}
.viewer-actions {
  display: flex;
  gap: 8px;
}
.viewer-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}
.viewer-close-btn {
  background: #ef4444;
  border-color: #ef4444;
}
.image-viewer-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 24px;
}
.viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.2s;
}
.image-viewer-zoom {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 12px;
  padding: 6px 12px;
  color: white;
}
.zoom-btn {
  background: transparent;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
}
.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

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
  font-size: 13px;
}

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

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  color: white;
  z-index: 9999;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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

@media (max-width: 900px) {
  .top-section-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .docs-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .send-to-boss-section {
    flex-direction: column;
    align-items: stretch;
  }
  .send-boss-right {
    justify-content: stretch;
  }
  .btn-send-boss {
    width: 100%;
  }
  .dispatch-filters-row {
    grid-template-columns: 1fr;
  }
}
</style>