<!-- views/storemanagement/purchasinggroups/ApprovedPurchaseRequests.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>✅ Approved Purchase Requests</h2>
        <span class="total-badge">{{ totalItems }} Requests</span>
      </div>
      <div class="header-actions">
        <div class="header-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search by PR, dept, prepared by, or item..."
              @input="onSearchChange"
            />
          </div>
        </div>
        <div class="header-right">
          <button
            class="btn-dispatch-selected"
            @click="openDispatchModal"
            :disabled="selectedForDispatch.length === 0"
          >
            📤 Dispatch Selected ({{ selectedForDispatch.length }})
          </button>
          <button class="btn-export" @click="exportData">📊 Export</button>
          <button class="btn-refresh" @click="refreshData">🔄</button>
        </div>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterPriority" class="filter-select" @change="onFilterChange">
        <option value="all">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <select v-model="filterDepartment" class="filter-select" @change="onFilterChange">
        <option value="all">All Departments</option>
        <option v-for="dept in availableDepartments" :key="dept" :value="dept">
          {{ dept }}
        </option>
      </select>

      <select v-model="filterDateRange" class="filter-select" @change="onDateRangeChange">
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="custom">Custom Range...</option>
      </select>

      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== CUSTOM DATE RANGE ==================== -->
    <div v-if="filterDateRange === 'custom'" class="date-range-bar">
      <div class="date-input-group">
        <label>From:</label>
        <input
          type="date"
          v-model="customStartDate"
          class="date-input"
          :max="customEndDate || undefined"
        />
      </div>
      <div class="date-input-group">
        <label>To:</label>
        <input
          type="date"
          v-model="customEndDate"
          class="date-input"
          :min="customStartDate || undefined"
        />
      </div>
      <button
        class="btn-apply-date"
        @click="onFilterChange"
        :disabled="!customStartDate || !customEndDate"
      >
        Apply
      </button>
      <span v-if="dateRangeError" class="date-error">{{ dateRangeError }}</span>
    </div>

    <!-- ==================== ACTIVE DATE LABEL ==================== -->
    <div v-if="activeDateLabel" class="active-date-label">
      <span class="date-label-icon">📅</span>
      <span>{{ activeDateLabel }}</span>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-number">{{ totalItems }}</span>
        <span class="stat-label">Pending Dispatch</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ selectedForDispatch.length }}</span>
        <span class="stat-label">Selected</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ selectedItemsCount }}</span>
        <span class="stat-label">Items Selected</span>
      </div>
      <div class="stat-box">
        <span class="stat-number">{{ selectedDepartmentsCount }}</span>
        <span class="stat-label">Departments</span>
      </div>
    </div>

    <!-- ==================== REQUESTS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading approved requests...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="requests-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
            </th>
            <th class="col-expand"></th>
            <th class="col-code">PR Number</th>
            <th class="col-items">Items</th>
            <th class="col-dept">Department</th>
            <th class="col-prepared">Prepared By</th>
            <th class="col-priority">Priority</th>
            <th class="col-date">Approved Date</th>
            <th class="col-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedRequests.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">✅</span>
                <p>No approved purchase requests found</p>
                <span v-if="hasActiveFilters" class="empty-hint">
                  Try adjusting your filters
                </span>
              </div>
            </td>
          </tr>
          <template v-for="req in paginatedRequests" :key="req.id">
            <tr :class="{ 'expanded-row': expandedRow === req.id }">
              <td class="text-center">
                <input type="checkbox" v-model="req.selected" />
              </td>
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(req.id)">
                  {{ expandedRow === req.id ? "▼" : "▶" }}
                </button>
              </td>
              <td class="code-cell">{{ req.prNumber }}</td>
              <td>
                <div class="items-summary">
                  <span class="item-count">
                    {{ req.items?.length || 0 }} item(s)
                  </span>
                  <span class="item-names">{{ getItemNames(req.items) }}</span>
                </div>
              </td>
              <td class="dept-name">{{ req.department || 'N/A' }}</td>
              <td class="prepared-name">{{ req.preparedBy || 'N/A' }}</td>
              <td>
                <span :class="['priority-badge', req.priority]">
                  {{ req.priority }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(req.updatedAt || req.createdAt) }}</td>
              <td>
                <span class="status-badge approved">
                  {{ req.status }}
                </span>
              </td>
            </tr>

            <!-- ==================== EXPANDED DETAIL ROW ==================== -->
            <tr v-if="expandedRow === req.id" class="detail-expand-row">
              <td colspan="9">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Left: Request Info -->
                    <div class="detail-card">
                      <div class="detail-card-header">
                        <h4>📋 Request Information</h4>
                        <span class="status-badge approved">approved</span>
                      </div>

                      <div class="info-rows">
                        <div class="info-row">
                          <span class="info-label">PR Number</span>
                          <span class="info-value code-value">{{ req.prNumber }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Department</span>
                          <span class="info-value">{{ req.department || '—' }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Expert Name</span>
                          <span class="info-value">{{ req.expertName || '—' }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Prepared By</span>
                          <span class="info-value">{{ req.preparedBy || '—' }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Priority</span>
                          <span class="info-value">
                            <span :class="['priority-badge', req.priority]">
                              {{ req.priority }}
                            </span>
                          </span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Requested Date</span>
                          <span class="info-value">{{ formatDate(req.requestedDate) }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Approved Date</span>
                          <span class="info-value">{{ formatDateTime(req.updatedAt || req.createdAt) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Right: Summary -->
                    <div class="detail-card">
                      <div class="detail-card-header">
                        <h4>📊 Summary</h4>
                      </div>

                      <div class="summary-stats">
                        <div class="summary-stat">
                          <div class="stat-icon">📦</div>
                          <div class="stat-content">
                            <div class="stat-value">{{ req.items?.length || 0 }}</div>
                            <div class="stat-label">Total Items</div>
                          </div>
                        </div>

                        <div class="summary-stat">
                          <div class="stat-icon">✅</div>
                          <div class="stat-content">
                            <div class="stat-value">Approved</div>
                            <div class="stat-label">Current Status</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Approved Documents -->
                    <div
                      v-if="req.approvedDocFront || req.approvedDocBack"
                      class="detail-card full-width"
                    >
                      <div class="detail-card-header">
                        <h4>📎 Approved Documents</h4>
                        <span class="member-count-badge">
                          {{ (req.approvedDocFront ? 1 : 0) + (req.approvedDocBack ? 1 : 0) }}
                        </span>
                      </div>

                      <div class="docs-grid">
                        <!-- Front -->
                        <div v-if="req.approvedDocFront" class="doc-card">
                          <div class="doc-card-header">
                            <span class="doc-side-label">📄 Front Side</span>
                          </div>
                          <div
                            class="doc-image-wrapper"
                            @click="openImageViewer(req.approvedDocFront, `${req.prNumber} - Front Side`, req.approvedDocFrontName)"
                          >
                            <div class="doc-skeleton">⏳ Loading...</div>
                            <img
                              :src="req.approvedDocFront"
                              :alt="`${req.prNumber} front`"
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
                            <span class="doc-filename" :title="req.approvedDocFrontName">
                              {{ req.approvedDocFrontName || getFileName(req.approvedDocFront) }}
                            </span>
                            <button
                              class="doc-view-btn"
                              @click="openImageViewer(req.approvedDocFront, `${req.prNumber} - Front Side`, req.approvedDocFrontName)"
                            >
                              View Full
                            </button>
                          </div>
                        </div>

                        <!-- Back -->
                        <div v-if="req.approvedDocBack" class="doc-card">
                          <div class="doc-card-header">
                            <span class="doc-side-label">📄 Back Side</span>
                          </div>
                          <div
                            class="doc-image-wrapper"
                            @click="openImageViewer(req.approvedDocBack, `${req.prNumber} - Back Side`, req.approvedDocBackName)"
                          >
                            <div class="doc-skeleton">⏳ Loading...</div>
                            <img
                              :src="req.approvedDocBack"
                              :alt="`${req.prNumber} back`"
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
                            <span class="doc-filename" :title="req.approvedDocBackName">
                              {{ req.approvedDocBackName || getFileName(req.approvedDocBack) }}
                            </span>
                            <button
                              class="doc-view-btn"
                              @click="openImageViewer(req.approvedDocBack, `${req.prNumber} - Back Side`, req.approvedDocBackName)"
                            >
                              View Full
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Items Table -->
                    <div class="detail-card full-width">
                      <div class="detail-card-header">
                        <h4>📦 Items Requested</h4>
                        <span class="member-count-badge">
                          {{ req.items?.length || 0 }}
                        </span>
                      </div>

                      <div class="items-table-wrapper">
                        <table class="items-detail-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Item Name</th>
                              <th>Item Code</th>
                              <th>UOM</th>
                              <th>Qty</th>
                              <th>Brand</th>
                              <th>Model</th>
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
                              <td class="item-name-cell">{{ item.name }}</td>
                              <td class="text-center">
                                <span class="item-code-chip">{{ item.code }}</span>
                              </td>
                              <td class="text-center">
                                <span class="uom-badge">{{ item.uom }}</span>
                              </td>
                              <td class="text-center font-bold">{{ item.quantity }}</td>
                              <td class="text-center">{{ item.brand || "—" }}</td>
                              <td class="text-center">{{ item.model || "—" }}</td>
                              <td class="spec-cell">{{ item.specification || "—" }}</td>
                              <td>{{ item.remark || "—" }}</td>
                            </tr>
                          </tbody>
                        </table>
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
    <div class="pagination" v-if="totalItems > 0">
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

    <!-- ==================== DISPATCH MODAL ==================== -->
    <div v-if="showDispatchModal" class="modal-overlay" @click.self="showDispatchModal = false">
      <div class="modal-container dispatch-modal">
        <div class="modal-header">
          <h3>📤 Dispatch Requests</h3>
          <button class="modal-close" @click="showDispatchModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="dispatch-info">
            <div class="dispatch-icon">📤</div>
            <p class="dispatch-title">Assign Purchaser(s) or Boss to Selected Requests</p>

            <!-- Selected Requests List -->
            <div class="selected-requests-list">
              <h4>Selected Requests ({{ selectedForDispatch.length }})</h4>
              <div class="request-items">
                <div v-for="req in selectedForDispatch" :key="req.id" class="request-item">
                  <span class="req-code">{{ req.prNumber }}</span>
                  <span class="req-item">{{ req.items.length }} item(s)</span>
                  <span class="req-qty">{{ getTotalQuantity(req.items) }} qty</span>
                </div>
              </div>
            </div>

            <!-- ==================== SEND TO BOSS (TOP) ==================== -->
            <div class="boss-section" :class="{ 'boss-active': sendToBoss }">
              <label class="boss-toggle">
                <input type="checkbox" v-model="sendToBoss" />
                <span class="boss-toggle-track">
                  <span class="boss-toggle-thumb"></span>
                </span>
                <span class="boss-toggle-label">
                  <span class="boss-toggle-title">📨 Send to Boss</span>
                  <span class="boss-toggle-hint">Dispatch directly to your manager (or alongside purchasers)</span>
                </span>
              </label>

              <!-- Boss Info Card -->
              <div v-if="sendToBoss" class="boss-info-card">
                <div class="boss-avatar">{{ bossInitials }}</div>
                <div class="boss-details">
                  <div class="boss-name">{{ currentBoss.name }}</div>
                  <div class="boss-role">{{ currentBoss.role }}</div>
                  <div class="boss-email">📧 {{ currentBoss.email }}</div>
                </div>
                <div class="boss-check">✓</div>
              </div>

              <!-- Boss Message Field -->
              <div v-if="sendToBoss" class="boss-message-wrapper">
                <label class="boss-message-label">Message to Boss (Optional)</label>
                <textarea
                  v-model="bossMessage"
                  class="form-textarea"
                  rows="2"
                  placeholder="e.g. Please review the urgent items in this batch..."
                />
              </div>
            </div>

            <!-- Search Purchaser -->
            <div class="form-group">
              <label>Search Purchaser (Optional)</label>
              <div class="search-purchaser-wrapper">
                <span class="search-icon-small">🔍</span>
                <input
                  type="text"
                  v-model="purchaserSearch"
                  placeholder="Search by name or department..."
                  class="form-input search-purchaser-input"
                />
              </div>
              <span class="hint">Type to filter purchasers by name or department</span>
            </div>

            <!-- Purchaser Multi-Select Table -->
            <div class="form-group">
              <label>Select Purchaser(s)</label>
              <div class="purchaser-table-wrapper">
                <table class="purchaser-table">
                  <thead>
                    <tr>
                      <th style="width: 40px;">
                        <input
                          type="checkbox"
                          v-model="selectAllPurchasers"
                          @change="toggleSelectAllPurchasers"
                        />
                      </th>
                      <th>Name</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredPurchasers.length === 0">
                      <td colspan="3" class="no-results">No purchasers found</td>
                    </tr>
                    <tr
                      v-for="purchaser in filteredPurchasers"
                      :key="purchaser.id"
                      :class="{ 'selected-row': purchaser.selected }"
                    >
                      <td>
                        <input type="checkbox" v-model="purchaser.selected" />
                      </td>
                      <td>{{ purchaser.name }}</td>
                      <td>{{ purchaser.department }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <span class="hint">Select one or more purchasers to assign to all selected requests</span>
            </div>

            <!-- Selected Purchasers Summary -->
            <div class="selected-purchasers-summary" v-if="selectedPurchasersList.length > 0">
              <span class="summary-label">Selected Purchasers:</span>
              <div class="selected-purchaser-tags">
                <span v-for="purchaser in selectedPurchasersList" :key="purchaser" class="purchaser-tag">
                  {{ purchaser }}
                </span>
              </div>
            </div>

            <!-- Dispatch Summary -->
            <div class="dispatch-summary">
              <div class="summary-row">
                <span class="summary-label">Requests to Dispatch:</span>
                <span class="summary-value">{{ selectedForDispatch.length }}</span>
              </div>
              <div class="summary-row" v-if="selectedPurchasersList.length > 0">
                <span class="summary-label">Assigned to:</span>
                <span class="summary-value">{{ selectedPurchasersList.length }} purchaser(s)</span>
              </div>
              <div class="summary-row" v-if="sendToBoss">
                <span class="summary-label">Also notifying:</span>
                <span class="summary-value boss-summary-value">
                  👔 {{ currentBoss.name }}
                </span>
              </div>
            </div>

            <div class="form-group">
              <label>Remark (Optional)</label>
              <textarea
                v-model="dispatchRemark"
                class="form-textarea"
                rows="2"
                placeholder="Additional notes for the purchasers..."
              />
            </div>

            <!-- ==================== CONFIRM / WARNING BLOCK ==================== -->
            <!-- Purchasers + Boss -->
            <p
              class="dispatch-confirm-text"
              v-if="selectedPurchasersList.length > 0 && sendToBoss"
            >
              ✅ This will dispatch {{ selectedForDispatch.length }} request(s) to
              <strong>{{ selectedPurchasersList.length }}</strong> purchaser(s) and notify <strong>{{ currentBoss.name }}</strong>.
            </p>

            <!-- Purchasers only -->
            <p
              class="dispatch-confirm-text"
              v-else-if="selectedPurchasersList.length > 0"
            >
              ✅ This will dispatch {{ selectedForDispatch.length }} request(s) to
              <strong>{{ selectedPurchasersList.length }}</strong> purchaser(s).
            </p>

            <!-- Boss only -->
            <p
              class="dispatch-confirm-text boss-only-text"
              v-else-if="sendToBoss"
            >
              ✅ This will dispatch {{ selectedForDispatch.length }} request(s) to
              <strong>{{ currentBoss.name }}</strong> only.
            </p>

            <!-- Nothing selected -->
            <p class="dispatch-warning-text" v-else>
              ⚠️ Please select at least one purchaser or the boss.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showDispatchModal = false">Cancel</button>
          <button
            class="btn-primary"
            @click="confirmDispatch"
            :disabled="dispatching || (!selectedPurchasersList.length && !sendToBoss)"
          >
            {{ dispatching ? 'Dispatching...' : '📤 Confirm Dispatch' }}
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
            <a :href="viewerImageUrl" :download="viewerFileName || 'document'" class="viewer-btn" title="Download">
              ⬇️ Download
            </a>
            <a :href="viewerImageUrl" target="_blank" class="viewer-btn" title="Open in new tab">
              🔗 Open
            </a>
            <button class="viewer-btn viewer-close-btn" @click="closeImageViewer" title="Close (Esc)">
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
          <button class="zoom-btn" @click="zoomOut" title="Zoom out">−</button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button class="zoom-btn" @click="zoomIn" title="Zoom in">+</button>
          <button class="zoom-btn" @click="resetZoom" title="Reset">⟲</button>
        </div>
      </div>
    </Teleport>

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

// ================================================================
// TYPES
// ================================================================

interface PurchaseItem {
  id: number;
  name: string;
  code: string;
  brand?: string;
  model?: string;
  uom: string;
  baseUom?: string;
  conversionUom?: string;
  quantity: number;
  specification?: string;
  remark?: string;
}

interface PurchaseRequest {
  id: number;
  prNumber: string;
  department?: string;
  expertName?: string;
  preparedBy?: string;
  requestedDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'approved';
  items: PurchaseItem[];
  createdAt: string;
  updatedAt?: string;
  approvedDocFront?: string;
  approvedDocFrontName?: string;
  approvedDocBack?: string;
  approvedDocBackName?: string;
  selected?: boolean;
}

interface Purchaser {
  id: number;
  name: string;
  department: string;
  selected?: boolean;
}

interface Boss {
  name: string;
  role: string;
  email: string;
  initials: string;
}

// ================================================================
// STATE
// ================================================================

const loading = ref(false);
const searchQuery = ref("");
const filterPriority = ref("all");
const filterDepartment = ref("all");
const filterDateRange = ref<"all" | "today" | "week" | "month" | "year" | "custom">("all");
const customStartDate = ref("");
const customEndDate = ref("");
const dateRangeError = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const expandedRow = ref<number | null>(null);

// ✅ Image viewer
const showImageViewer = ref(false);
const viewerImageUrl = ref("");
const viewerTitle = ref("");
const viewerFileName = ref("");
const zoomLevel = ref(1);

// ✅ Dispatch state
const selectAll = ref(false);
const showDispatchModal = ref(false);
const purchaserSearch = ref("");
const selectAllPurchasers = ref(false);
const dispatchRemark = ref("");
const dispatching = ref(false);

// ✅ Send to Boss state
const sendToBoss = ref(false);
const bossMessage = ref("");

// Current boss
const currentBoss = ref<Boss>({
  name: "Yohannes Bekele",
  role: "Store Manager",
  email: "yohannes.bekele@sdt.com",
  initials: "YB"
});

// Toast
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// DEMO — Purchasers
// ================================================================

const purchasersData: Purchaser[] = [
  { id: 1, name: 'Abebe Kebede', department: 'Purchasing' },
  { id: 2, name: 'Selam Tesfaye', department: 'Purchasing' },
  { id: 3, name: 'Mekonnen Alemu', department: 'Procurement' },
  { id: 4, name: 'Tigist Hailu', department: 'Purchasing' },
  { id: 5, name: 'Dawit Solomon', department: 'Procurement' },
  { id: 6, name: 'Meron Ayele', department: 'Supply Chain' },
  { id: 7, name: 'Fikru Tsegaye', department: 'Purchasing' }
];

const purchasers = ref<Purchaser[]>(purchasersData.map(p => ({ ...p, selected: false })));

// ================================================================
// DEMO — CDN images
// ================================================================

const FRONT_DOC =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&auto=format&fit=crop";
const BACK_DOC =
  "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1200&q=80&auto=format&fit=crop";
const FRONT_DOC_2 =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&auto=format&fit=crop";
const BACK_DOC_2 =
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&q=80&auto=format&fit=crop";

// ================================================================
// DEMO — Requests
// ================================================================

const requests = ref<PurchaseRequest[]>([
  {
    id: 2,
    prNumber: "PR-2026-002",
    department: "Quality Control",
    expertName: "Mulugeta Hailu",
    preparedBy: "Amanuel G.",
    requestedDate: "2026-09-03",
    priority: "medium",
    status: "approved",
    items: [
      { id: 4, name: "Plasticizer (DBP)", code: "SDT000018", brand: "BASF", model: "BASF-DBP", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 15, specification: "Dibutyl Phthalate for plastic production", remark: "" },
      { id: 5, name: "Formaldehyde (F)", code: "SDT000013", brand: "BASF", model: "BASF-FORM", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 10, specification: "Industrial grade formaldehyde", remark: "Handle with care" }
    ],
    createdAt: "2026-09-03T10:15:00.000Z",
    updatedAt: "2026-09-04T14:20:00.000Z",
    approvedDocFront: FRONT_DOC,
    approvedDocFrontName: "PR-2026-002-front.jpg",
    approvedDocBack: BACK_DOC,
    approvedDocBackName: "PR-2026-002-back.jpg",
    selected: false
  },
  {
    id: 3,
    prNumber: "PR-2026-003",
    department: "Production",
    expertName: "Tigist Worku",
    preparedBy: "Fantabil W.",
    requestedDate: "2026-09-05",
    priority: "urgent",
    status: "approved",
    items: [
      { id: 6, name: "Homopolymer Glue", code: "SDT000004", brand: "Sherwin-Williams", model: "SW-2000", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 100, specification: "High grade industrial glue for woodworking", remark: "URGENT - Production stopped" }
    ],
    createdAt: "2026-09-05T09:00:00.000Z",
    updatedAt: "2026-09-06T16:30:00.000Z",
    approvedDocFront: FRONT_DOC_2,
    approvedDocFrontName: "PR-2026-003-front.jpg",
    approvedDocBack: BACK_DOC_2,
    approvedDocBackName: "PR-2026-003-back.jpg",
    selected: false
  },
  {
    id: 5,
    prNumber: "PR-2026-005",
    department: "Production",
    expertName: "Henok Belay",
    preparedBy: "Amanuel G.",
    requestedDate: "2026-09-08",
    priority: "high",
    status: "approved",
    items: [
      { id: 9, name: "Lacquer Thinner", code: "SDT000001", brand: "Sherwin-Williams", model: "SW-THIN", uom: "DRUM", baseUom: "DRUM", conversionUom: "LTR", quantity: 25, specification: "Premium quality thinner", remark: "Approved" },
      { id: 10, name: "Short Oil Alkyd", code: "SDT000008", brand: "BASF", model: "BASF-ALK-1", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 10, specification: "Short oil alkyd resin", remark: "QC passed" }
    ],
    createdAt: "2026-09-08T13:45:00.000Z",
    updatedAt: "2026-09-09T09:00:00.000Z",
    approvedDocFront: FRONT_DOC,
    approvedDocFrontName: "PR-2026-005-front.jpg",
    approvedDocBack: BACK_DOC,
    approvedDocBackName: "PR-2026-005-back.jpg",
    selected: false
  },
  {
    id: 6,
    prNumber: "PR-2026-006",
    department: "Maintenance",
    expertName: "Dawit Eshetu",
    preparedBy: "Eyerus T.",
    requestedDate: "2026-09-09",
    priority: "medium",
    status: "approved",
    items: [
      { id: 11, name: "Slitting Machine", code: "SDT000081", brand: "Global Machinery", model: "GM-SL-500", uom: "SET", baseUom: "SET", conversionUom: "", quantity: 1, specification: "Automatic slitting machine", remark: "Urgent" },
      { id: 12, name: "Seam Welding Machine", code: "SDT000083", brand: "Global Machinery", model: "GM-SW-200", uom: "SET", baseUom: "SET", conversionUom: "", quantity: 2, specification: "Industrial seam welding machine", remark: "" }
    ],
    createdAt: "2026-09-09T08:30:00.000Z",
    updatedAt: "2026-09-09T11:45:00.000Z",
    approvedDocFront: FRONT_DOC_2,
    approvedDocFrontName: "PR-2026-006-front.jpg",
    approvedDocBack: BACK_DOC_2,
    approvedDocBackName: "PR-2026-006-back.jpg",
    selected: false
  },
  {
    id: 7,
    prNumber: "PR-2026-007",
    department: "Logistics",
    expertName: "Alemayehu Tesfaye",
    preparedBy: "Fantabil W.",
    requestedDate: "2026-09-09",
    priority: "low",
    status: "approved",
    items: [
      { id: 13, name: "Packing Tape", code: "SDT000150", brand: "3M", model: "3M-TAPE-100", uom: "ROLL", baseUom: "ROLL", conversionUom: "", quantity: 50, specification: "Heavy duty packing tape", remark: "" },
      { id: 14, name: "Cardboard Boxes", code: "SDT000151", brand: "", model: "", uom: "PCS", baseUom: "PCS", conversionUom: "", quantity: 200, specification: "Large size boxes 60x40x40", remark: "" },
      { id: 15, name: "Bubble Wrap", code: "SDT000152", brand: "", model: "", uom: "ROLL", baseUom: "ROLL", conversionUom: "", quantity: 10, specification: "Medium duty bubble wrap", remark: "For fragile items" }
    ],
    createdAt: "2026-09-09T10:15:00.000Z",
    updatedAt: "2026-09-09T14:30:00.000Z",
    approvedDocFront: FRONT_DOC,
    approvedDocFrontName: "PR-2026-007-front.jpg",
    approvedDocBack: BACK_DOC,
    approvedDocBackName: "PR-2026-007-back.jpg",
    selected: false
  }
]);

// ================================================================
// DATE RANGE HELPERS
// ================================================================

const getDateRangeBounds = (range: string): { start: Date | null; end: Date | null } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (range === 'today') {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start: now, end };
  }

  if (range === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'year') {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'custom') {
    if (!customStartDate.value || !customEndDate.value) {
      return { start: null, end: null };
    }
    const start = new Date(customStartDate.value);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEndDate.value);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  return { start: null, end: null };
};

const activeDateLabel = computed(() => {
  if (filterDateRange.value === 'all') return '';

  const { start, end } = getDateRangeBounds(filterDateRange.value);
  if (!start || !end) return '';

  const formatOpts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const labels: Record<string, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    custom: 'Custom Range'
  };

  return `${labels[filterDateRange.value]}: ${start.toLocaleDateString('en-US', formatOpts)} → ${end.toLocaleDateString('en-US', formatOpts)}`;
});

// ================================================================
// COMPUTED
// ================================================================

const availableDepartments = computed(() => {
  const depts = new Set<string>();
  requests.value.forEach(r => {
    if (r.department) depts.add(r.department);
  });
  return Array.from(depts).sort();
});

const filteredRequests = computed(() => {
  let result = requests.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(req =>
      req.prNumber.toLowerCase().includes(query) ||
      req.department?.toLowerCase().includes(query) ||
      req.expertName?.toLowerCase().includes(query) ||
      req.preparedBy?.toLowerCase().includes(query) ||
      req.items.some(item =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
      )
    );
  }

  if (filterPriority.value !== 'all') {
    result = result.filter(req => req.priority === filterPriority.value);
  }

  if (filterDepartment.value !== 'all') {
    result = result.filter(req => req.department === filterDepartment.value);
  }

  if (filterDateRange.value !== 'all') {
    const { start, end } = getDateRangeBounds(filterDateRange.value);
    if (start && end) {
      result = result.filter(req => {
        const approvedDate = new Date(req.updatedAt || req.createdAt);
        return approvedDate >= start && approvedDate <= end;
      });
    }
  }

  return result;
});

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredRequests.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredRequests.value.length / pageSize.value) || 1;
});

const hasActiveFilters = computed(() => {
  return filterPriority.value !== 'all' ||
         filterDepartment.value !== 'all' ||
         filterDateRange.value !== 'all' ||
         searchQuery.value;
});

// ✅ Dispatch-related computeds
const selectedForDispatch = computed(() => {
  return filteredRequests.value.filter(r => r.selected);
});

const selectedItemsCount = computed(() => {
  return selectedForDispatch.value.reduce((sum, r) => sum + (r.items?.length || 0), 0);
});

const selectedDepartmentsCount = computed(() => {
  const depts = new Set(selectedForDispatch.value.map(r => r.department));
  return depts.size;
});

const filteredPurchasers = computed(() => {
  if (!purchaserSearch.value) return purchasers.value;
  const search = purchaserSearch.value.toLowerCase();
  return purchasers.value.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.department.toLowerCase().includes(search)
  );
});

const selectedPurchasersList = computed(() => {
  return purchasers.value.filter(p => p.selected).map(p => p.name);
});

const bossInitials = computed(() => currentBoss.value.initials);

// ================================================================
// METHODS — Table
// ================================================================

const getItemNames = (items: PurchaseItem[]): string => {
  if (!items || items.length === 0) return "";
  return items.map(i => i.name).join(", ");
};

const getTotalQuantity = (items: PurchaseItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, i) => sum + (i.quantity || 0), 0);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString: string): string => {
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

const getFileName = (url: string): string => {
  if (!url) return "document";
  if (url.startsWith("data:")) return "approved-document";
  try {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/");
    return parts[parts.length - 1] || "document";
  } catch {
    return "document";
  }
};

const toggleExpand = (id: number): void => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const onSearchChange = (): void => {
  currentPage.value = 1;
};

const onFilterChange = (): void => {
  currentPage.value = 1;
};

const onDateRangeChange = (): void => {
  dateRangeError.value = "";

  if (filterDateRange.value !== 'custom') {
    customStartDate.value = "";
    customEndDate.value = "";
  }

  currentPage.value = 1;
};

const clearFilters = (): void => {
  filterPriority.value = 'all';
  filterDepartment.value = 'all';
  filterDateRange.value = 'all';
  customStartDate.value = "";
  customEndDate.value = "";
  dateRangeError.value = "";
  searchQuery.value = '';
  currentPage.value = 1;
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const changePageSize = (): void => {
  currentPage.value = 1;
};

// ================================================================
// SELECT ALL
// ================================================================

const toggleSelectAll = (): void => {
  paginatedRequests.value.forEach(r => { r.selected = selectAll.value; });
};

const toggleSelectAllPurchasers = (): void => {
  purchasers.value.forEach(p => { p.selected = selectAllPurchasers.value; });
};

// ================================================================
// DISPATCH
// ================================================================

const openDispatchModal = (): void => {
  if (selectedForDispatch.value.length === 0) {
    showToastMessage('Please select at least one request to dispatch', 'warning');
    return;
  }

  purchasers.value = purchasersData.map(p => ({ ...p, selected: false }));
  selectAllPurchasers.value = false;
  purchaserSearch.value = '';
  dispatchRemark.value = '';
  sendToBoss.value = false;
  bossMessage.value = '';
  showDispatchModal.value = true;
};

const confirmDispatch = async (): Promise<void> => {
  if (selectedForDispatch.value.length === 0) {
    showToastMessage('No requests selected', 'warning');
    return;
  }

  const selectedPurchasers = purchasers.value.filter(p => p.selected);
  // ✅ Allow boss-only dispatch
  if (selectedPurchasers.length === 0 && !sendToBoss.value) {
    showToastMessage('Please select at least one purchaser or the boss', 'warning');
    return;
  }

  dispatching.value = true;

  try {
    // Build payload (ready for real API)
    const payload = {
      dispatchedIds: selectedForDispatch.value.map(r => r.id),
      purchaserIds: selectedPurchasers.map(p => p.id),
      remark: dispatchRemark.value,
      sendToBoss: sendToBoss.value,
      bossId: sendToBoss.value ? currentBoss.value.email : null,
      bossMessage: sendToBoss.value ? bossMessage.value : null
    };

    console.log("📤 Dispatching with payload:", payload);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 900));

    // Remove dispatched requests
    const dispatchedIds = selectedForDispatch.value.map(r => r.id);
    requests.value = requests.value.filter(r => !dispatchedIds.includes(r.id));
    totalItems.value = requests.value.length;

    // Reset UI
    showDispatchModal.value = false;
    selectAll.value = false;
    selectAllPurchasers.value = false;
    purchaserSearch.value = '';

    // ✅ Build recipient description
    let recipientPart = '';
    if (selectedPurchasers.length > 0 && sendToBoss.value) {
      recipientPart = `${selectedPurchasers.length} purchaser(s) and ${currentBoss.value.name}`;
    } else if (selectedPurchasers.length > 0) {
      recipientPart = `${selectedPurchasers.length} purchaser(s)`;
    } else if (sendToBoss.value) {
      recipientPart = currentBoss.value.name;
    }

    showToastMessage(
      `✅ ${dispatchedIds.length} request(s) dispatched to ${recipientPart}!`,
      'success'
    );

    // Reset boss state
    sendToBoss.value = false;
    bossMessage.value = '';
  } catch (err) {
    showToastMessage('❌ Failed to dispatch requests', 'error');
  } finally {
    dispatching.value = false;
  }
};

// ================================================================
// EXPORT
// ================================================================

const exportData = (): void => {
  const headers = [
    'PR Number',
    'Department',
    'Prepared By',
    'Priority',
    'Approved Date',
    'Items',
    'Has Front Doc',
    'Has Back Doc'
  ];

  const rows = filteredRequests.value.map(req => [
    req.prNumber,
    req.department || '',
    req.preparedBy || '',
    req.priority,
    formatDate(req.updatedAt || req.createdAt),
    req.items.map(i => `${i.name} (${i.quantity} ${i.uom})`).join('; '),
    req.approvedDocFront ? 'Yes' : 'No',
    req.approvedDocBack ? 'Yes' : 'No'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `approved_requests_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToastMessage('📊 CSV exported', 'success');
};

const refreshData = (): void => {
  showToastMessage('🔄 Data refreshed', 'success');
};

// ================================================================
// IMAGE LOAD HANDLERS
// ================================================================

const onImageLoad = (e: Event): void => {
  const img = e.target as HTMLImageElement;
  img.classList.add("loaded");
  const skeleton = img.parentElement?.querySelector(".doc-skeleton");
  if (skeleton) (skeleton as HTMLElement).style.display = "none";
};

const onImageError = (e: Event): void => {
  const img = e.target as HTMLImageElement;
  img.classList.add("error");
  const skeleton = img.parentElement?.querySelector(".doc-skeleton");
  if (skeleton) (skeleton as HTMLElement).textContent = "⚠️ Failed to load";
};

// ================================================================
// IMAGE VIEWER
// ================================================================

const openImageViewer = (url: string, title: string, fileName?: string): void => {
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
  if (e.key === "Escape" && showImageViewer.value) {
    closeImageViewer();
  }
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
// LIFECYCLE
// ================================================================

onMounted(() => {
  totalItems.value = requests.value.length;
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
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
  background: #dcfce7;
  color: #166534;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
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

.btn-dispatch-selected {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-dispatch-selected:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-dispatch-selected:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  color: #1e293b;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

/* ================================================================ */
/* CUSTOM DATE RANGE BAR */
/* ================================================================ */
.date-range-bar {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-input-group label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.date-input {
  padding: 7px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #1e293b;
  font-family: inherit;
  cursor: pointer;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-apply-date {
  padding: 7px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-apply-date:hover:not(:disabled) {
  background: #2563eb;
}

.btn-apply-date:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-error {
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
}

/* ================================================================ */
/* ACTIVE DATE LABEL */
/* ================================================================ */
.active-date-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #1e40af;
  margin-bottom: 16px;
}

.date-label-icon {
  font-size: 14px;
}

/* ================================================================ */
/* STATS ROW */
/* ================================================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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

/* ================================================================ */
/* TABLE */
/* ================================================================ */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 980px;
}

.requests-table th,
.requests-table td {
  padding: 10px;
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

.col-check { width: 40px; }
.col-expand { width: 30px; }
.col-code { min-width: 110px; }
.col-items { min-width: 160px; }
.col-dept { min-width: 120px; }
.col-prepared { min-width: 130px; }
.col-priority { min-width: 80px; }
.col-date { min-width: 110px; }
.col-status { min-width: 90px; }

.text-center { text-align: center; }

.code-cell {
  font-weight: 600;
  color: #0f172a;
  font-family: "Courier New", monospace;
  font-size: 12px;
  background: #f0fdf4;
  padding: 3px 10px;
  border-radius: 4px;
  display: inline-block;
}

.items-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-count {
  font-weight: 600;
  color: #1e293b;
}

.item-names {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.dept-name,
.prepared-name {
  font-weight: 500;
  color: #1e293b;
}

.date-cell {
  font-size: 12px;
  color: #475569;
}

/* ================================================================ */
/* PRIORITY BADGE */
/* ================================================================ */
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
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ================================================================ */
/* STATUS BADGE */
/* ================================================================ */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.status-badge.approved {
  background: #dcfce7;
  color: #166534;
}

/* ================================================================ */
/* EXPAND ROW */
/* ================================================================ */
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

/* ================================================================ */
/* EXPAND DETAILS - 2-COLUMN GRID */
/* ================================================================ */
.detail-expand-row td {
  padding: 0 !important;
}

.expand-details {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
}

.detail-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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
  flex-shrink: 0;
}

.detail-card-header h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-count-badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
}

/* Info Rows */
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
  padding-top: 2px;
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

/* Summary Stats */
.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.stat-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.1;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ================================================================ */
/* APPROVED DOCUMENTS */
/* ================================================================ */
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
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.doc-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
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
  letter-spacing: 0.3px;
}

.doc-image-wrapper {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
  cursor: zoom-in;
  background: #ffffff;
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
  z-index: 0;
}

.doc-thumbnail {
  position: relative;
  z-index: 1;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.doc-thumbnail.loaded {
  opacity: 1;
}

.doc-thumbnail.error {
  opacity: 0.35;
}

.doc-image-wrapper:hover .doc-thumbnail {
  transform: scale(1.05);
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
  transition: opacity 0.25s ease;
  color: white;
  pointer-events: none;
  z-index: 2;
}

.doc-image-wrapper:hover .doc-overlay {
  opacity: 1;
}

.zoom-icon {
  font-size: 28px;
}

.zoom-text {
  font-size: 12px;
  font-weight: 500;
}

.doc-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-top: 1px solid #f1f5f9;
  gap: 8px;
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
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.doc-view-btn:hover {
  background: #2563eb;
}

/* ================================================================ */
/* ITEMS TABLE */
/* ================================================================ */
.items-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.items-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 900px;
}

.items-detail-table th {
  background: #f1f5f9;
  padding: 10px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.items-detail-table td {
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.items-detail-table tbody tr:last-child td {
  border-bottom: none;
}

.items-detail-table tbody tr:hover {
  background: #f8fafc;
}

.item-name-cell {
  font-weight: 600;
  color: #1e293b;
}

.item-code-chip {
  display: inline-block;
  font-family: monospace;
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.uom-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.font-bold {
  font-weight: 700;
  font-size: 13px;
  color: #0f172a;
}

.spec-cell {
  font-size: 11px;
  color: #475569;
  max-width: 200px;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
}

.no-items {
  padding: 20px !important;
  color: #94a3b8;
  font-style: italic;
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

.empty-hint {
  color: #cbd5e1;
  font-size: 13px;
}

/* ================================================================ */
/* LOADING */
/* ================================================================ */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #22c55e;
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
/* DISPATCH MODAL */
/* ================================================================ */
.dispatch-modal {
  max-width: 650px;
}

.dispatch-info {
  padding: 8px 0;
}

.dispatch-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.dispatch-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
  margin-bottom: 16px;
}

.selected-requests-list {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.selected-requests-list h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.request-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.request-item {
  background: white;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.req-code {
  font-weight: 600;
  color: #0f172a;
  font-family: monospace;
}

.req-item {
  color: #475569;
}

.req-qty {
  color: #64748b;
  font-size: 11px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.search-purchaser-wrapper {
  position: relative;
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #94a3b8;
}

.search-purchaser-input {
  padding-left: 34px !important;
}

.purchaser-table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  max-height: 200px;
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
  z-index: 10;
}

.purchaser-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.purchaser-table tr:hover {
  background: #f8fafc;
}

.purchaser-table tr.selected-row {
  background: #ede9fe;
}

.purchaser-table tr.selected-row:hover {
  background: #ddd6fe;
}

.purchaser-table .no-results {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-style: italic;
}

.selected-purchasers-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin: 8px 0 12px 0;
  flex-wrap: wrap;
}

.selected-purchasers-summary .summary-label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.selected-purchaser-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.purchaser-tag {
  background: #ede9fe;
  color: #5b21b6;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.dispatch-summary {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  margin: 12px 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 13px;
}

.summary-label {
  color: #64748b;
}

.summary-value {
  font-weight: 500;
  color: #0f172a;
}

.dispatch-confirm-text {
  background: #d1fae5;
  color: #065f46;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

.dispatch-confirm-text.boss-only-text {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
}

.dispatch-warning-text {
  background: #fef3c7;
  color: #92400e;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
}

/* ================================================================ */
/* SEND TO BOSS SECTION */
/* ================================================================ */
.boss-section {
  margin: 0 0 16px 0;
  padding: 14px 16px;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  transition: all 0.25s ease;
}

.boss-section.boss-active {
  border-style: solid;
  border-color: #8b5cf6;
  background: #f5f3ff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.12);
}

.boss-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.boss-toggle input {
  display: none;
}

.boss-toggle-track {
  position: relative;
  width: 42px;
  height: 24px;
  background: #cbd5e1;
  border-radius: 12px;
  flex-shrink: 0;
  transition: background 0.25s ease;
}

.boss-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.boss-toggle input:checked + .boss-toggle-track {
  background: #8b5cf6;
}

.boss-toggle input:checked + .boss-toggle-track .boss-toggle-thumb {
  transform: translateX(18px);
}

.boss-toggle-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.boss-toggle-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.boss-toggle-hint {
  font-size: 11px;
  color: #64748b;
}

.boss-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  background: white;
  border: 1px solid #ddd6fe;
  border-radius: 10px;
  animation: bossSlideIn 0.25s ease;
}

@keyframes bossSlideIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.boss-avatar {
  width: 42px;
  height: 42px;
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

.boss-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.boss-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.boss-role {
  font-size: 11px;
  color: #8b5cf6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.boss-email {
  font-size: 11px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.boss-check {
  width: 24px;
  height: 24px;
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

.boss-message-wrapper {
  margin-top: 12px;
  animation: bossSlideIn 0.3s ease;
}

.boss-message-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}

.boss-summary-value {
  color: #7c3aed !important;
  font-weight: 600;
}

/* ================================================================ */
/* MODAL SHELL */
/* ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
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
  max-width: 600px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

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
  flex: 1;
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

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 8px;
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
  background: #94a3b8;
}

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

/* ================================================================ */
/* FULL-PAGE IMAGE VIEWER */
/* ================================================================ */
.image-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: viewerFadeIn 0.2s ease;
}

@keyframes viewerFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.image-viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(15, 23, 42, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  gap: 12px;
  flex-wrap: wrap;
}

.viewer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.viewer-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.viewer-title-text {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.viewer-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;
}

.viewer-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.viewer-close-btn {
  background: #ef4444;
  border-color: #ef4444;
}

.viewer-close-btn:hover {
  background: #dc2626;
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
  transition: transform 0.2s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  background: white;
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
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 6px 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.zoom-btn {
  background: transparent;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.zoom-level {
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
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
@media (max-width: 768px) {
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
    align-items: stretch;
  }

  .header-left,
  .header-right {
    width: 100%;
    flex-direction: column;
  }

  .search-box { width: 100%; }
  .search-box input { width: 100%; }

  .btn-dispatch-selected,
  .btn-export,
  .btn-refresh {
    width: 100%;
    justify-content: center;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    width: 100%;
  }

  .date-range-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .date-input-group { width: 100%; }
  .date-input { width: 100%; }

  .btn-apply-date {
    width: 100%;
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-container {
    grid-template-columns: 1fr;
  }

  .docs-grid {
    grid-template-columns: 1fr;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    min-width: auto;
  }

  .requests-table {
    font-size: 11px;
    min-width: 800px;
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

  .image-viewer-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .viewer-actions {
    justify-content: stretch;
  }

  .viewer-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .requests-table {
    min-width: 700px;
  }

  .requests-table th,
  .requests-table td {
    padding: 4px 6px;
    font-size: 10px;
  }

  .status-badge,
  .priority-badge {
    padding: 2px 8px;
    font-size: 9px;
  }

  .items-detail-table {
    min-width: 750px;
  }

  .doc-image-wrapper {
    height: 200px;
  }

  .stats-row {
    grid-template-columns: 1fr 1fr;
  }

  .stat-number {
    font-size: 18px;
  }

  .boss-info-card {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .boss-check {
    align-self: flex-end;
  }
}
</style>