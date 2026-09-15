<!-- views/storemanagement/purchaserequests/PurchaseRequest.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🛒 Purchase Requests</h2>
        <span class="total-badge">{{ totalItems }} Requests</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by PR, dept, expert, or item..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openCreateModal">
          ➕ New Purchase Request
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
        <option value="approved">Approved</option>
      </select>

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

      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== REQUESTS TABLE ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading purchase requests...</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="requests-table">
        <thead>
          <tr>
            <th class="col-expand"></th>
            <th class="col-code">PR Number</th>
            <th class="col-items">Items</th>
            <th class="col-dept">Department</th>
            <th class="col-expert">Expert Name</th>
            <th class="col-priority">Priority</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedRequests.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🛒</span>
                <p>No purchase requests found</p>
                <button class="btn-secondary" @click="openCreateModal">
                  Create First Purchase Request
                </button>
              </div>
            </td>
          </tr>
          <template
            v-for="req in paginatedRequests"
            :key="req.id"
          >
            <tr
              :class="{
                'expanded-row': expandedRow === req.id,
              }"
            >
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
                  <span class="item-count"
                    >{{ req.items?.length || 0 }} item(s)</span
                  >
                  <span class="item-names">{{ getItemNames(req.items) }}</span>
                </div>
              </td>
              <td class="dept-name">{{ req.department || 'N/A' }}</td>
              <td class="expert-name">{{ req.expertName || 'N/A' }}</td>
              <td>
                <span :class="['priority-badge', req.priority]">
                  {{ req.priority }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', req.status]">
                  {{ req.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <!-- ✅ Print: Available for Draft and Approved -->
                  <button
                    class="icon-btn print-btn"
                    @click="printRequest(req)"
                    :title="req.status === 'draft' ? '🖨️ Print Draft (for signing)' : '🖨️ Print Approved'"
                  >
                    🖨️
                  </button>

                  <!-- ✅ Edit: Only visible for Draft -->
                  <button
                    v-if="req.status === 'draft'"
                    class="icon-btn"
                    @click="editRequest(req)"
                    title="Edit"
                  >
                    ✏️
                  </button>

                  <!-- ✅ Approve: Only for Draft -->
                  <button
                    v-if="req.status === 'draft'"
                    class="icon-btn"
                    @click="openStatusConfirmation(req)"
                    title="✅ Approve & Dispatch to Purchasing Groups"
                  >
                    ✅
                  </button>
                </div>
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
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📋 Request Information</h4>
                        <div>
                          <span>PR Number</span
                          ><span class="value">{{ req.prNumber }}</span>
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
                          <span>Priority</span>
                          <span class="value">
                            <span :class="['priority-badge', req.priority]">{{
                              req.priority
                            }}</span>
                          </span>
                        </div>
                        <div>
                          <span>Department</span
                          ><span class="value">{{ req.department || 'N/A' }}</span>
                        </div>
                        <div>
                          <span>Expert Name</span
                          ><span class="value">{{ req.expertName || 'N/A' }}</span>
                        </div>
                        <div>
                          <span>Prepared By</span
                          ><span class="value">{{ req.preparedBy || 'N/A' }}</span>
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
                      </div>

                      <div class="detail-card">
                        <h4>📊 Summary</h4>
                        <div>
                          <span>Total Items</span
                          ><span class="value">{{ req.items?.length || 0 }}</span>
                        </div>
                        
                        <div>
                          <span>Last Updated</span
                          ><span class="value">{{
                            req.updatedAt ? formatDateTime(req.updatedAt) : 'N/A'
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
                            <td>{{ item.name }}</td>
                            <td>{{ item.code }}</td>
                            <td class="text-center">
                              <span class="uom-badge">{{ item.uom }}</span>
                            </td>
                            <td class="text-center">{{ item.quantity }}</td>
                            <td>{{ item.brand || "-" }}</td>
                            <td>{{ item.model || "-" }}</td>
                            <td class="spec-cell">{{ item.specification || "-" }}</td>
                            <td>{{ item.remark || "-" }}</td>
                          </tr>
                          <tr class="total-row">
                            <td colspan="4" class="text-right">
                              <strong>Total Items:</strong>
                            </td>
                            <td class="text-center">
                              <strong>{{ req.items?.length || 0 }}</strong>
                            </td>
                            <td colspan="4"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- ==================== APPROVED DOCUMENTS (with thumbnails + viewer) ==================== -->
                    <div
                      v-if="req.status === 'approved' && (req.approvedDocFront || req.approvedDocBack)"
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

                    <div class="detail-actions">
                      <!-- ✅ Print: Available for Draft and Approved -->
                      <button
                        class="btn-print-detail"
                        @click="printRequest(req)"
                      >
                        🖨️ Print
                      </button>

                      <!-- ✅ Edit: Only visible for Draft -->
                      <button
                        v-if="req.status === 'draft'"
                        class="btn-edit-detail"
                        @click="editRequest(req)"
                      >
                        ✏️ Edit
                      </button>

                      <!-- ✅ Approve: Only for Draft -->
                      <button
                        v-if="req.status === 'draft'"
                        class="btn-approve-detail"
                        @click="openStatusConfirmation(req)"
                      >
                        ✅ Approve & Dispatch
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

    <!-- ==================== STATUS CONFIRMATION MODAL ==================== -->
    <div
      v-if="showStatusModal"
      class="modal-overlay"
      @click.self="closeStatusModal"
    >
      <div class="modal-container status-modal">
        <div class="modal-header">
          <h3>✅ Confirm Approval</h3>
          <button class="modal-close" @click="closeStatusModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">✅</div>
          <p class="confirmation-title">Are you sure you want to approve this request?</p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">PR Number:</span>
              <span class="detail-value">{{ statusTarget?.prNumber }}</span>
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
              <span class="status-badge approved">
                approved
              </span>
            </div>
          </div>

          <!-- ==================== DOCUMENT UPLOAD ==================== -->
          <div class="upload-section">
            <p class="upload-title">📎 Attach Approved Document (Required)</p>

            <div class="upload-grid">
              <!-- FRONT -->
              <div class="upload-box" :class="{ 'has-file': approvedDocFront }">
                <label class="upload-label">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    @change="onFrontFileChange"
                    hidden
                  />
                  <div v-if="!approvedDocFront" class="upload-placeholder">
                    <span class="upload-icon">📄</span>
                    <span class="upload-text">Front Side</span>
                    <span class="upload-hint">Click to upload</span>
                  </div>
                  <div v-else class="upload-preview">
                    <span class="upload-icon">✅</span>
                    <span class="upload-filename">{{ approvedDocFront.name }}</span>
                    <span class="upload-hint">Click to replace</span>
                  </div>
                </label>
                <button
                  v-if="approvedDocFront"
                  class="remove-file-btn"
                  @click.stop.prevent="approvedDocFront = null"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>

              <!-- BACK -->
              <div class="upload-box" :class="{ 'has-file': approvedDocBack }">
                <label class="upload-label">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    @change="onBackFileChange"
                    hidden
                  />
                  <div v-if="!approvedDocBack" class="upload-placeholder">
                    <span class="upload-icon">📄</span>
                    <span class="upload-text">Back Side</span>
                    <span class="upload-hint">Click to upload</span>
                  </div>
                  <div v-else class="upload-preview">
                    <span class="upload-icon">✅</span>
                    <span class="upload-filename">{{ approvedDocBack.name }}</span>
                    <span class="upload-hint">Click to replace</span>
                  </div>
                </label>
                <button
                  v-if="approvedDocBack"
                  class="remove-file-btn"
                  @click.stop.prevent="approvedDocBack = null"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            </div>

            <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
          </div>

          <p class="warning-text approve-text">
            ✅ This will approve the request and dispatch it to the purchasing groups.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStatusModal">Cancel</button>
          <button
            class="btn-primary"
            :disabled="!approvedDocFront || !approvedDocBack || isSubmitting"
            @click="confirmStatusChange"
          >
            <span v-if="isSubmitting">⏳ Submitting...</span>
            <span v-else>Confirm Approval</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== CREATE/EDIT MODAL ==================== -->
    <CreatePurchaseRequestModal
      v-model:visible="showCreateModal"
      :editing-request="editingRequestData"
      @saved="handleModalSaved"
    />

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

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import CreatePurchaseRequestModal from "./components/CreatePurchaseRequestModal.vue";
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
  baseUom: string;
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

const router = useRouter();
const loading = ref(false);
const searchQuery = ref("");
const filterStatus = ref("all");
const filterPriority = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const expandedRow = ref<number | null>(null);
const showCreateModal = ref(false);
const editingRequestData = ref<PurchaseRequest | null>(null);
const showStatusModal = ref(false);
const statusTarget = ref<PurchaseRequest | null>(null);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ✅ Document upload state
const approvedDocFront = ref<File | null>(null);
const approvedDocBack = ref<File | null>(null);
const uploadError = ref("");
const isSubmitting = ref(false);

// ✅ Image viewer state
const showImageViewer = ref(false);
const viewerImageUrl = ref("");
const viewerTitle = ref("");
const viewerFileName = ref("");
const zoomLevel = ref(1);

// ✅ Server-fetched requests
const requests = ref<PurchaseRequest[]>([]);

// ================================================================
// COMPUTED
// ================================================================

const paginatedRequests = computed(() => requests.value);

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / pageSize.value) || 1;
});

const hasActiveFilters = computed(() => {
  return (
    filterStatus.value !== "all" ||
    filterPriority.value !== "all" ||
    !!searchQuery.value
  );
});

// ================================================================
// DATA FETCHING
// ================================================================

const fetchPurchaseRequests = async (): Promise<void> => {
  loading.value = true;
  try {
    const response = await purchaseRequestService.getRequests({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      status: filterStatus.value as "all" | "draft" | "approved",
      priority: filterPriority.value as
        | "all"
        | "low"
        | "medium"
        | "high"
        | "urgent",
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to load purchase requests");
    }

    // ✅ Resolve relative /uploads/... paths into absolute URLs
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
    console.error("Failed to load purchase requests:", error);
    showToastMessage(
      error?.message || "Failed to load purchase requests",
      "error"
    );
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

const getTotalQuantity = (items: PurchaseItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, i) => sum + (i.quantity || 0), 0);
};

const formatDate = (dateString?: string): string => {
  return purchaseRequestService.formatDate(dateString);
};

const formatDateTime = (dateString?: string): string => {
  return purchaseRequestService.formatDateTime(dateString);
};

const toggleExpand = (id: number): void => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const onSearchChange = (): void => {
  currentPage.value = 1;
  fetchPurchaseRequests();
};

const onFilterChange = (): void => {
  currentPage.value = 1;
  fetchPurchaseRequests();
};

const clearFilters = (): void => {
  filterStatus.value = "all";
  filterPriority.value = "all";
  searchQuery.value = "";
  currentPage.value = 1;
  fetchPurchaseRequests();
  showToastMessage("Filters cleared", "info");
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchPurchaseRequests();
};

const changePageSize = (): void => {
  currentPage.value = 1;
  fetchPurchaseRequests();
};

const openCreateModal = (): void => {
  editingRequestData.value = null;
  showCreateModal.value = true;
};

const editRequest = (req: PurchaseRequest): void => {
  if (req.status !== "draft") {
    showToastMessage("Only draft requests can be edited", "error");
    return;
  }
  editingRequestData.value = req;
  showCreateModal.value = true;
};

const handleModalSaved = (): void => {
  showToastMessage("Purchase request saved successfully!", "success");
  fetchPurchaseRequests();
};

/**
 * ✅ Print: Available for both Draft and Approved
 */
const printRequest = (req: PurchaseRequest): void => {
  router.push({
    name: "print-purchase-request",
    query: { id: String(req.id) },
  });
};

/**
 * Extract file name from any URL (data:, blob:, relative, absolute)
 */
const getFileName = (url?: string): string => {
  return purchaseRequestService.getFileName(url);
};

// ================================================================
// DOCUMENT UPLOAD HANDLERS
// ================================================================

const validateFile = (file: File): string | null => {
  return purchaseRequestService.validateFile(file);
};

const onFrontFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const error = validateFile(file);
  if (error) {
    uploadError.value = `Front side: ${error}`;
    target.value = "";
    return;
  }
  approvedDocFront.value = file;
  uploadError.value = "";
};

const onBackFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const error = validateFile(file);
  if (error) {
    uploadError.value = `Back side: ${error}`;
    target.value = "";
    return;
  }
  approvedDocBack.value = file;
  uploadError.value = "";
};

// ================================================================
// APPROVAL
// ================================================================

const openStatusConfirmation = (req: PurchaseRequest): void => {
  statusTarget.value = req;
  approvedDocFront.value = null;
  approvedDocBack.value = null;
  uploadError.value = "";
  isSubmitting.value = false;
  showStatusModal.value = true;
};

const closeStatusModal = (): void => {
  showStatusModal.value = false;
  statusTarget.value = null;
  approvedDocFront.value = null;
  approvedDocBack.value = null;
  uploadError.value = "";
  isSubmitting.value = false;
};

const confirmStatusChange = async (): Promise<void> => {
  if (!statusTarget.value) return;

  if (!approvedDocFront.value || !approvedDocBack.value) {
    uploadError.value =
      "Please upload both front and back sides of the approved document.";
    return;
  }

  isSubmitting.value = true;
  const req = statusTarget.value;

  try {
    // ✅ Correct service method: approveRequest({ prId, prNumber, front, back })
    const response = await purchaseRequestService.approveRequest({
      prId: req.id,
      prNumber: req.prNumber,
      front: approvedDocFront.value,
      back: approvedDocBack.value,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to approve purchase request");
    }

    // ✅ Resolve the returned relative URLs and replace the row locally
    const updated: PurchaseRequest = {
      ...response.data,
      approvedDocFront: response.data.approvedDocFront
        ? resolveDocUrl(response.data.approvedDocFront)
        : undefined,
      approvedDocBack: response.data.approvedDocBack
        ? resolveDocUrl(response.data.approvedDocBack)
        : undefined,
    };

    const index = requests.value.findIndex((r) => r.id === updated.id);
    if (index !== -1) {
      requests.value[index] = updated;
    }

    showToastMessage(
      `✅ ${updated.prNumber} approved with documents and dispatched!`,
      "success"
    );

    closeStatusModal();
  } catch (err: any) {
    console.error(err);
    uploadError.value =
      err?.message || "Failed to submit approval. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
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
  fetchPurchaseRequests();
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
  width: 240px;
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

.col-expand { width: 30px; }
.col-code { min-width: 100px; }
.col-items { min-width: 150px; }
.col-dept { min-width: 110px; }
.col-expert { min-width: 130px; }
.col-priority { min-width: 70px; }
.col-status { min-width: 90px; }
.col-actions { min-width: 160px; }

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

.dept-name,
.expert-name {
  font-weight: 500;
  color: #1e293b;
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

.status-badge.draft {
  background: #e2e8f0;
  color: #475569;
}

.status-badge.approved {
  background: #dcfce7;
  color: #166534;
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

.icon-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.print-btn {
  color: #8b5cf6;
}

.print-btn:hover:not(:disabled) {
  background: #ede9fe;
  color: #7c3aed;
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

/* ✅ Detail card header (used by Approved Documents + Items) */
.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.detail-card-header h4 {
  margin: 0;
  padding: 0;
  border: none;
}

.member-count-badge {
  background: #dbeafe;
  color: #1e40af;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
}

/* ================================================================ */
/* ITEMS DETAIL TABLE */
/* ================================================================ */
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

.spec-cell {
  font-size: 11px;
  color: #475569;
  max-width: 200px;
  white-space: normal;
  word-wrap: break-word;
}

/* ================================================================ */
/* APPROVED DOCUMENTS — with thumbnails */
/* ================================================================ */
.docs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.doc-card {
  background: white;
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
/* DETAIL ACTIONS */
/* ================================================================ */
.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.detail-actions button {
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

.detail-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-print-detail {
  background: #8b5cf6;
  color: white;
}

.btn-print-detail:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-edit-detail {
  background: #3b82f6;
  color: white;
}

.btn-edit-detail:hover:not(:disabled) {
  background: #2563eb;
}

.btn-approve-detail {
  background: #22c55e;
  color: white;
}

.btn-approve-detail:hover:not(:disabled) {
  background: #16a34a;
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
  to {
    transform: rotate(360deg);
  }
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

/* ================================================================ */
/* MODAL */
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
  max-width: 520px;
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
  min-width: 140px;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #94a3b8;
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

.warning-text.approve-text {
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

/* ================================================================ */
/* DOCUMENT UPLOAD */
/* ================================================================ */
.upload-section {
  margin-bottom: 16px;
}

.upload-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.upload-box {
  position: relative;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  transition: all 0.2s;
  cursor: pointer;
}

.upload-box:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-box.has-file {
  border-style: solid;
  border-color: #22c55e;
  background: #f0fdf4;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 10px;
  cursor: pointer;
  text-align: center;
  min-height: 110px;
}

.upload-placeholder,
.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.upload-icon {
  font-size: 24px;
}

.upload-text {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.upload-filename {
  font-size: 11px;
  font-weight: 500;
  color: #166534;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-hint {
  font-size: 10px;
  color: #94a3b8;
}

.remove-file-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 2;
}

.remove-file-btn:hover {
  background: #dc2626;
}

.upload-error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 8px;
  padding: 6px 10px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
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

  .detail-row-two-cols {
    grid-template-columns: 1fr;
  }

  .docs-grid {
    grid-template-columns: 1fr;
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

  .icon-btn {
    padding: 3px 4px;
    font-size: 11px;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .detail-actions {
    flex-direction: column;
  }

  .detail-actions button {
    width: 100%;
    justify-content: center;
  }

  .upload-grid {
    grid-template-columns: 1fr;
  }

  .doc-image-wrapper {
    height: 200px;
  }
}
</style>