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
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select
        v-model="filterPriority"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="all">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <select
        v-model="filterDepartment"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="all">All Departments</option>
        <option
          v-for="dept in availableDepartments"
          :key="dept"
          :value="dept"
        >
          {{ dept }}
        </option>
      </select>

      <select
        v-model="filterDateRange"
        class="filter-select"
        @change="onDateRangeChange"
      >
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

    <!-- ==================== CUSTOM DATE RANGE INPUTS ==================== -->
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
        @click="applyCustomDateRange"
        :disabled="!customStartDate || !customEndDate"
      >
        Apply
      </button>
      <span v-if="dateRangeError" class="date-error">{{ dateRangeError }}</span>
    </div>

    <!-- ==================== ACTIVE DATE RANGE LABEL ==================== -->
    <div v-if="activeDateLabel" class="active-date-label">
      <span class="date-label-icon">📅</span>
      <span>{{ activeDateLabel }}</span>
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
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">✅</span>
                <p>No approved purchase requests found</p>
                <span v-if="hasActiveFilters" class="empty-hint">
                  Try adjusting your filters
                </span>
              </div>
            </td>
          </tr>
          <template
            v-for="req in paginatedRequests"
            :key="req.id"
          >
            <tr :class="{ 'expanded-row': expandedRow === req.id }">
              <td class="text-center">
                <button
                  class="expand-btn"
                  @click="toggleExpand(req.id)"
                >
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
            <tr
              v-if="expandedRow === req.id"
              class="detail-expand-row"
            >
              <td colspan="8">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Left: Request Information -->
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

                    <!-- APPROVED DOCUMENTS -->
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
                        <!-- Front Side -->
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

                        <!-- Back Side -->
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

                    <!-- Items Table (full width) -->
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
              title="Download"
            >
              ⬇️ Download
            </a>
            <a
              :href="viewerImageUrl"
              target="_blank"
              class="viewer-btn"
              title="Open in new tab"
            >
              🔗 Open
            </a>
            <button
              class="viewer-btn viewer-close-btn"
              @click="closeImageViewer"
              title="Close (Esc)"
            >
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import purchaseRequestService, {
  resolveDocUrl,
} from "@/stores/purchaseRequestService";

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

// ✅ Server-fetched requests
const requests = ref<PurchaseRequest[]>([]);

// ✅ Image viewer state
const showImageViewer = ref(false);
const viewerImageUrl = ref("");
const viewerTitle = ref("");
const viewerFileName = ref("");
const zoomLevel = ref(1);

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
  requests.value.forEach((r) => {
    if (r.department) depts.add(r.department);
  });
  return Array.from(depts).sort();
});

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value) || 1;
});

const paginatedRequests = computed(() => requests.value);

const hasActiveFilters = computed(() => {
  return filterPriority.value !== 'all' ||
         filterDepartment.value !== 'all' ||
         filterDateRange.value !== 'all' ||
         !!searchQuery.value;
});

// ================================================================
// DATA FETCHING
// ================================================================

const fetchApprovedRequests = async (): Promise<void> => {
  loading.value = true;
  try {
    // ✅ Compute the date range on the client and send it to the server
    const { start, end } = getDateRangeBounds(filterDateRange.value);

    const dateFrom = start
      ? start.toISOString().split('T')[0]
      : undefined;
    const dateTo = end
      ? end.toISOString().split('T')[0]
      : undefined;

    // ✅ NEW: use the dedicated approved-only endpoint
    const response = await purchaseRequestService.getApprovedRequests({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      priority: filterPriority.value as
        | 'all'
        | 'low'
        | 'medium'
        | 'high'
        | 'urgent',
      department: filterDepartment.value !== 'all'
        ? filterDepartment.value
        : undefined,
      dateFrom,
      dateTo,
      dateField: 'updated_at',      // matches the "Approved Date" column
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to load approved requests');
    }

    // ✅ Resolve relative /uploads/... document URLs
    requests.value = response.data.items.map((r) => ({
      ...r,
      items: r.items.map((item, index) => ({
        ...item,
        id: item.id ?? index,
        baseUom: item.baseUom ?? item.uom,
      })),
      approvedDocFront: r.approvedDocFront
        ? resolveDocUrl(r.approvedDocFront)
        : undefined,
      approvedDocBack: r.approvedDocBack
        ? resolveDocUrl(r.approvedDocBack)
        : undefined,
    }));
    totalItems.value = response.data.total;
  } catch (error: any) {
    console.error('Failed to load approved requests:', error);
  } finally {
    loading.value = false;
  }
};

// ================================================================
// METHODS
// ================================================================

const getItemNames = (items: PurchaseItem[]): string => {
  if (!items || items.length === 0) return "";
  return items.map((i) => i.name).join(", ");
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFileName = (url: string): string => {
  return purchaseRequestService.getFileName(url);
};

const toggleExpand = (id: number): void => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const onSearchChange = (): void => {
  currentPage.value = 1;
  fetchApprovedRequests();
};

const onFilterChange = (): void => {
  currentPage.value = 1;
  fetchApprovedRequests();
};

const onDateRangeChange = (): void => {
  dateRangeError.value = "";

  if (filterDateRange.value !== 'custom') {
    customStartDate.value = "";
    customEndDate.value = "";
  }

  currentPage.value = 1;

  // 🔒 For custom, wait until both dates are chosen + Apply clicked
  if (filterDateRange.value === 'custom') {
    if (customStartDate.value && customEndDate.value) {
      fetchApprovedRequests();
    }
    return;
  }

  fetchApprovedRequests();
};

const applyCustomDateRange = (): void => {
  if (!customStartDate.value || !customEndDate.value) return;

  if (new Date(customStartDate.value) > new Date(customEndDate.value)) {
    dateRangeError.value = "Start date must be before end date";
    return;
  }

  dateRangeError.value = "";
  currentPage.value = 1;
  fetchApprovedRequests();
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
  fetchApprovedRequests();
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchApprovedRequests();
};

const changePageSize = (): void => {
  currentPage.value = 1;
  fetchApprovedRequests();
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
// LIFECYCLE
// ================================================================

onMounted(() => {
  fetchApprovedRequests();
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
  min-width: 900px;
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
    width: 100%;
  }

  .search-box { width: 100%; }
  .search-box input { width: 100%; }

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

  .date-input-group {
    width: 100%;
  }

  .date-input {
    width: 100%;
  }

  .btn-apply-date {
    width: 100%;
    justify-content: center;
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
    min-width: 600px;
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
}
</style>