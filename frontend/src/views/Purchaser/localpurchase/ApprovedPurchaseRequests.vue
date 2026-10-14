<!-- views/storemanagement/purchasinggroups/ApprovedPurchaseRequests.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🧭 Stage 1 · Approvals</h2>
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
      <select v-model="filterDecision" class="filter-select" @change="onFilterChange">
        <option value="all">All Decisions</option>
        <option value="waiting">⏳ Waiting for me</option>
        <option value="approved">✅ Approved by me</option>
        <option value="rejected">❌ Rejected by me</option>
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
        <input type="date" v-model="customStartDate" class="date-input" :max="customEndDate || undefined" />
      </div>
      <div class="date-input-group">
        <label>To:</label>
        <input type="date" v-model="customEndDate" class="date-input" :min="customStartDate || undefined" />
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

    <div v-if="activeDateLabel" class="active-date-label">
      <span class="date-label-icon">📅</span>
      <span>{{ activeDateLabel }}</span>
    </div>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading requests...</p>
    </div>

    <!-- ==================== TABLE ==================== -->
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
            <th class="col-date">Requested</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredRequests.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📭</span>
                <p>No requests found</p>
                <span v-if="hasActiveFilters" class="empty-hint">
                  Try adjusting your filters
                </span>
              </div>
            </td>
          </tr>
          <template v-for="req in filteredRequests" :key="req.id">
            <tr :class="{ 'expanded-row': expandedRow === req.id }">
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(req)">
                  {{ expandedRow === req.id ? "▼" : "▶" }}
                </button>
              </td>
              <td class="code-cell">{{ req.prNumber }}</td>
              <td>
                <div class="items-summary">
                  <span class="item-count">{{ req.items?.length || 0 }} item(s)</span>
                  <span class="item-names">{{ getItemNames(req.items) }}</span>
                </div>
              </td>
              <td class="dept-name">{{ req.department || 'N/A' }}</td>
              <td class="prepared-name">{{ req.preparedBy || 'N/A' }}</td>
              <td>
                <span :class="['priority-badge', req.priority]">{{ req.priority }}</span>
              </td>
              <td class="date-cell">{{ formatDate(req.requestedDate || req.createdAt) }}</td>

              <td>
                <span :class="['status-badge', req.status]">
                  {{ statusLabel(req.status) }}
                </span>

                <div v-if="req.status !== 'draft'" class="my-decision-pill-wrap">
                  <span
                    v-if="loadingStatus[req.id] && !approvalStatusByRequest[req.id]"
                    class="my-decision-pill waiting"
                  >
                    ⏳ Loading…
                  </span>
                  <span
                    v-else-if="approvalStatusByRequest[req.id]?.myDecision === 'approve'"
                    class="my-decision-pill approved"
                    :title="myDecisionTooltip(req)"
                  >
                    ✅ Approved by your subgroup
                  </span>
                  <span
                    v-else-if="approvalStatusByRequest[req.id]?.myDecision === 'reject'"
                    class="my-decision-pill rejected"
                    :title="myDecisionTooltip(req)"
                  >
                    ❌ Rejected by your subgroup
                  </span>
                  <span
                    v-else-if="approvalStatusByRequest[req.id]?.mySubgroupId != null"
                    class="my-decision-pill waiting"
                    :title="myDecisionTooltip(req)"
                  >
                    ⏳ Waiting for your subgroup
                  </span>
                  <span
                    v-else
                    class="my-decision-pill not-mine"
                    title="Your subgroup is not in this stage"
                  >
                    — Not your stage
                  </span>
                </div>
              </td>

              <td>
                <div class="action-buttons">
                  <template v-if="approvalStatusByRequest[req.id]?.myDecision === 'approve'">
                    <span class="decided-pill approved">✅ Approved</span>
                  </template>
                  <template v-else-if="approvalStatusByRequest[req.id]?.myDecision === 'reject'">
                    <span class="decided-pill rejected">❌ Rejected</span>
                  </template>

                  <template v-else-if="canDecide(req)">
                    <button
                      class="btn-approve-row"
                      @click="openApproveModal(req)"
                      title="✅ Approve on behalf of my subgroup"
                    >
                      ✅
                    </button>
                    <button
                      class="btn-reject-row"
                      @click="openRejectModal(req)"
                      title="❌ Reject"
                    >
                      ❌
                    </button>
                  </template>

                  <template v-else>
                    <span class="na-pill" :title="notMyStageTooltip(req)">—</span>
                  </template>
                </div>
              </td>
            </tr>

            <!-- EXPANDED DETAIL -->
            <tr v-if="expandedRow === req.id" class="detail-expand-row">
              <td colspan="9">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Your subgroup's decision -->
                    <div class="detail-card full-width my-decision-card">
                      <div class="my-decision-header">
                        <h4>🧭 Your Subgroup's Decision</h4>
                        <span v-if="approvalStatusByRequest[req.id]" class="stage-pill">
                          Stage {{ approvalStatusByRequest[req.id]?.stageIndex }}
                          <template v-if="approvalStatusByRequest[req.id]?.stageLabel">
                            · {{ approvalStatusByRequest[req.id]?.stageLabel }}
                          </template>
                        </span>
                      </div>

                      <div v-if="loadingStatus[req.id]" class="stage-loading">
                        <div class="spinner small"></div>
                        <span>Fetching…</span>
                      </div>

                      <div v-else-if="approvalStatusByRequest[req.id]?.mySubgroupId == null" class="not-mine-banner">
                        ℹ️ Your subgroup is not part of this stage — you cannot decide on this request.
                      </div>

                      <div v-else class="my-decision-block">
                        <div class="my-subgroup-name">
                          <span class="my-subgroup-label">Subgroup:</span>
                          <strong>{{ mySubgroupLabel(req) }}</strong>
                        </div>

                        <div
                          v-if="approvalStatusByRequest[req.id]?.myDecision === 'approve'"
                          class="my-status-block approved"
                        >
                          <span class="big-icon">✅</span>
                          <div class="big-text">
                            <strong>Approved</strong>
                            <small>Your subgroup approved this request.</small>
                          </div>
                        </div>
                        <div
                          v-else-if="approvalStatusByRequest[req.id]?.myDecision === 'reject'"
                          class="my-status-block rejected"
                        >
                          <span class="big-icon">❌</span>
                          <div class="big-text">
                            <strong>Rejected</strong>
                            <small>Your subgroup rejected this request.</small>
                          </div>
                        </div>
                        <div v-else class="my-status-block waiting">
                          <span class="big-icon">⏳</span>
                          <div class="big-text">
                            <strong>Waiting for your decision</strong>
                            <small>Click ✅ Approve or ❌ Reject above to record your subgroup's decision.</small>
                          </div>
                        </div>

                        <div v-if="canDecide(req)" class="my-decision-actions">
                          <button class="btn-approve-stage" @click="openApproveModal(req)">
                            ✅ Approve on behalf of my subgroup
                          </button>
                          <button class="btn-reject-stage" @click="openRejectModal(req)">
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Request Information -->
                    <div class="detail-card">
                      <div class="detail-card-header">
                        <h4>📋 Request Information</h4>
                        <span :class="['status-badge', req.status]">
                          {{ statusLabel(req.status) }}
                        </span>
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
                            <span :class="['priority-badge', req.priority]">{{ req.priority }}</span>
                          </span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Requested Date</span>
                          <span class="info-value">{{ formatDate(req.requestedDate) }}</span>
                        </div>
                        <div class="info-row">
                          <span class="info-label">Created At</span>
                          <span class="info-value">{{ formatDateTime(req.createdAt) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Document Preview -->
                    <div class="detail-card preview-card">
                      <div class="detail-card-header">
                        <h4>🖼️ Document Preview</h4>
                        <span v-if="req.approvedDocFront || req.approvedDocBack" class="member-count-badge">
                          {{ (req.approvedDocFront ? 1 : 0) + (req.approvedDocBack ? 1 : 0) }}
                        </span>
                      </div>

                      <div
                        v-if="req.approvedDocFront || req.approvedDocBack"
                        class="preview-image-wrapper"
                        @click="openImageViewer(
                          req.approvedDocFront || req.approvedDocBack || '',
                          `${req.prNumber} - ${req.approvedDocFront ? 'Front Side' : 'Back Side'}`,
                          req.approvedDocFront ? req.approvedDocFrontName : req.approvedDocBackName
                        )"
                      >
                        <img
                          :src="req.approvedDocFront || req.approvedDocBack || ''"
                          :alt="`${req.prNumber} preview`"
                          class="preview-image"
                        />
                        <div class="preview-overlay">
                          <span class="zoom-icon">🔍</span>
                          <span class="zoom-text">Click to view full page</span>
                        </div>
                      </div>

                      <div v-else class="preview-empty">
                        <span class="preview-empty-icon">📄</span>
                        <p>No document attached</p>
                      </div>
                    </div>

                    <!-- Items -->
                    <div class="detail-card full-width">
                      <div class="detail-card-header">
                        <h4>📦 Items Requested</h4>
                        <span class="member-count-badge">{{ req.items?.length || 0 }}</span>
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

    <!-- PAGINATION -->
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

    <!-- APPROVE MODAL -->
    <div v-if="showApproveModal" class="modal-overlay" @click.self="closeApproveModal">
      <div class="modal-container status-modal">
        <div class="modal-header">
          <h3>✅ Approve {{ approveTarget?.prNumber }}</h3>
          <button class="modal-close" @click="closeApproveModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">✅</div>

          <div class="on-behalf-banner">
            <span class="ob-icon">🏷️</span>
            <div class="ob-body">
              <strong>You are approving on behalf of:</strong>
              <span>{{ mySubgroupLabel(approveTarget) }}</span>
              <small>
                Stage {{ approveTargetStatus?.stageIndex }}
                · {{ approveTargetStatus?.stageLabel }}
              </small>
            </div>
          </div>

          <div class="form-group">
            <label>Comment (optional)</label>
            <textarea
              v-model="approveComment"
              class="form-textarea"
              rows="3"
              placeholder="Add a note for the record..."
            />
          </div>

          <p class="warning-text approve-text">
            ✅ If this is the last subgroup in this stage, the request moves to
            the next stage automatically.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeApproveModal">Cancel</button>
          <button class="btn-primary" :disabled="submittingDecision" @click="confirmApprove">
            <span v-if="submittingDecision">⏳ Approving...</span>
            <span v-else>✅ Confirm Approve</span>
          </button>
        </div>
      </div>
    </div>

    <!-- REJECT MODAL -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-container status-modal">
        <div class="modal-header">
          <h3>❌ Reject {{ rejectTarget?.prNumber }}</h3>
          <button class="modal-close" @click="closeRejectModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">❌</div>

          <div class="on-behalf-banner reject">
            <span class="ob-icon">🏷️</span>
            <div class="ob-body">
              <strong>You are rejecting on behalf of:</strong>
              <span>{{ mySubgroupLabel(rejectTarget) }}</span>
              <small>
                Stage {{ rejectTargetStatus?.stageIndex }}
                · {{ rejectTargetStatus?.stageLabel }}
              </small>
            </div>
          </div>

          <div class="form-group">
            <label>Reason <span class="required">*</span></label>
            <textarea
              v-model="rejectComment"
              class="form-textarea"
              rows="3"
              placeholder="Why is this request being rejected?"
            />
            <p v-if="rejectError" class="upload-error">{{ rejectError }}</p>
          </div>

          <p class="warning-text">
            ⚠️ Rejecting ends the request. The submitter will be notified and
            can edit + resubmit later.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeRejectModal">Cancel</button>
          <button class="btn-danger" :disabled="submittingDecision" @click="confirmReject">
            <span v-if="submittingDecision">⏳ Rejecting...</span>
            <span v-else>❌ Confirm Reject</span>
          </button>
        </div>
      </div>
    </div>

    <!-- IMAGE VIEWER -->
    <Teleport to="body">
      <div v-if="showImageViewer" class="image-viewer-overlay" @click.self="closeImageViewer">
        <div class="image-viewer-toolbar">
          <div class="viewer-title">
            <span class="viewer-icon">🖼️</span>
            <span class="viewer-title-text">{{ viewerTitle }}</span>
          </div>
          <div class="viewer-actions">
            <a :href="viewerImageUrl" :download="viewerFileName || 'document'" class="viewer-btn">⬇️ Download</a>
            <a :href="viewerImageUrl" target="_blank" class="viewer-btn">🔗 Open</a>
            <button class="viewer-btn viewer-close-btn" @click="closeImageViewer">✕ Close</button>
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

    <!-- TOAST -->
    <div v-if="showToast" class="toast" :class="toastType">{{ toastMessage }}</div>
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

type RequestStatus = "draft" | "pending" | "approved" | "rejected";
type DecisionFilter = "all" | "waiting" | "approved" | "rejected";

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
  priority: "low" | "medium" | "high" | "urgent";
  status: RequestStatus;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt?: string;
  approvedDocFront?: string;
  approvedDocFrontName?: string;
  approvedDocBack?: string;
  approvedDocBackName?: string;

  currentStageIndex?: number;
  currentStageId?: number | null;
  currentStage?: { id: number; label: string; orderIndex: number } | null;
  rejectedByStageIndex?: number | null;
  rejectedBySubgroupId?: number | null;
}

interface SubgroupStatusRow {
  subgroupId: number;
  subgroupName: string;
  subgroupCode: string;
  groupId: number;
  groupName: string | null;
  decision: "approve" | "reject" | null;
  decidedByName: string | null;
  comment: string | null;
  actedAt: string | null;
}

interface ApprovalStatus {
  stageId: number | null;
  stageIndex: number;
  stageLabel: string;
  totalSubgroups: number;
  approvedCount: number;
  decidedCount: number;
  subgroups: SubgroupStatusRow[];
  mySubgroupId: number | null;
  myDecision: "approve" | "reject" | null;
  futureStages: { id: number; label: string; orderIndex: number }[];
}

// ================================================================
// STATE
// ================================================================

const loading = ref(false);
const searchQuery = ref("");
const filterDecision = ref<DecisionFilter>("all");
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

const requests = ref<PurchaseRequest[]>([]);
const approvalStatusByRequest = ref<Record<number, ApprovalStatus | undefined>>({});
const loadingStatus = ref<Record<number, boolean>>({});

const showApproveModal = ref(false);
const showRejectModal = ref(false);
const approveTarget = ref<PurchaseRequest | null>(null);
const rejectTarget = ref<PurchaseRequest | null>(null);
const approveComment = ref("");
const rejectComment = ref("");
const rejectError = ref("");
const submittingDecision = ref(false);

const showImageViewer = ref(false);
const viewerImageUrl = ref("");
const viewerTitle = ref("");
const viewerFileName = ref("");
const zoomLevel = ref(1);

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// COMPUTED
// ================================================================

const filteredRequests = computed(() => {
  const base = requests.value;

  if (filterDecision.value === "waiting") {
    return base.filter(
      (r) => approvalStatusByRequest.value[r.id]?.myDecision == null
    );
  }
  if (filterDecision.value === "approved") {
    return base.filter(
      (r) => approvalStatusByRequest.value[r.id]?.myDecision === "approve"
    );
  }
  if (filterDecision.value === "rejected") {
    return base.filter(
      (r) => approvalStatusByRequest.value[r.id]?.myDecision === "reject"
    );
  }
  return base;
});

const approveTargetStatus = computed(() =>
  approveTarget.value ? approvalStatusByRequest.value[approveTarget.value.id] : null
);

const rejectTargetStatus = computed(() =>
  rejectTarget.value ? approvalStatusByRequest.value[rejectTarget.value.id] : null
);

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value) || 1);

const availableDepartments = computed(() => {
  const depts = new Set<string>();
  requests.value.forEach((r) => {
    if (r.department) depts.add(r.department);
  });
  return Array.from(depts).sort();
});

const hasActiveFilters = computed(
  () =>
    filterDecision.value !== "all" ||
    filterPriority.value !== "all" ||
    filterDepartment.value !== "all" ||
    filterDateRange.value !== "all" ||
    !!searchQuery.value
);

// ================================================================
// DATE RANGE
// ================================================================

const getDateRangeBounds = (range: string): { start: Date | null; end: Date | null } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (range === "today") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start: now, end };
  }
  if (range === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (range === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (range === "custom") {
    if (!customStartDate.value || !customEndDate.value) return { start: null, end: null };
    const start = new Date(customStartDate.value);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEndDate.value);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  return { start: null, end: null };
};

const activeDateLabel = computed(() => {
  if (filterDateRange.value === "all") return "";
  const { start, end } = getDateRangeBounds(filterDateRange.value);
  if (!start || !end) return "";

  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  const labels: Record<string, string> = {
    today: "Today", week: "This Week", month: "This Month", year: "This Year", custom: "Custom Range",
  };
  return `${labels[filterDateRange.value]}: ${start.toLocaleDateString("en-US", opts)} → ${end.toLocaleDateString("en-US", opts)}`;
});

// ================================================================
// DATA FETCHING
// ================================================================

const fetchRequests = async (): Promise<void> => {
  loading.value = true;
  try {
    const { start, end } = getDateRangeBounds(filterDateRange.value);
    const dateFrom = start ? start.toISOString().split("T")[0] : undefined;
    const dateTo = end ? end.toISOString().split("T")[0] : undefined;

    const response = await purchaseRequestService.getPendingApprovals({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      priority: filterPriority.value as any,
      department: filterDepartment.value !== "all" ? filterDepartment.value : undefined,
      dateFrom,
      dateTo,
      dateField: "updated_at",
    });

    if (!response?.success || !response.data) {
      throw new Error(response?.error || "Failed to load requests");
    }

    requests.value = response.data.items.map((r) => ({
      ...r,
      items: (r.items || []).map((item, index) => ({
        ...item,
        id: item.id ?? index,
        baseUom: item.baseUom ?? item.uom,
      })),
      approvedDocFront: r.approvedDocFront ? resolveDocUrl(r.approvedDocFront) : undefined,
      approvedDocBack: r.approvedDocBack ? resolveDocUrl(r.approvedDocBack) : undefined,
    }));
    totalItems.value = response.data.total;

    // Preserve any locally-decided status for a row that the server may have
    // dropped after a decision. This keeps the row visible with its pill.
    const previousStatus = { ...approvalStatusByRequest.value };
    approvalStatusByRequest.value = {};
    requests.value.forEach((r) => {
      if (previousStatus[r.id]) {
        // Keep the older cache entry so the pill stays even if the fetch is slow
        approvalStatusByRequest.value = {
          ...approvalStatusByRequest.value,
          [r.id]: previousStatus[r.id],
        };
      } else {
        fetchApprovalStatus(r.id);
      }
    });
  } catch (error: any) {
    console.error("Failed to load requests:", error);
    showToastMessage(error?.message || "Failed to load requests", "error");
  } finally {
    loading.value = false;
  }
};

const fetchApprovalStatus = async (requestId: number): Promise<void> => {
  if (approvalStatusByRequest.value[requestId]) return;
  if (loadingStatus.value[requestId]) return;

  loadingStatus.value = { ...loadingStatus.value, [requestId]: true };
  try {
    const res = await purchaseRequestService.getApprovalStatus(requestId);
    if (res?.success && res.data) {
      approvalStatusByRequest.value = {
        ...approvalStatusByRequest.value,
        [requestId]: res.data,
      };
    }
  } catch (err) {
    console.error("Failed to fetch approval status:", err);
  } finally {
    loadingStatus.value = { ...loadingStatus.value, [requestId]: false };
  }
};

const refreshRowStatus = async (requestId: number) => {
  const copy = { ...approvalStatusByRequest.value };
  delete copy[requestId];
  approvalStatusByRequest.value = copy;
  await fetchApprovalStatus(requestId);
};

/**
 * Force-set a decision locally so the row's pill updates immediately,
 * even if the server no longer returns this request.
 */
const setLocalDecision = (
  requestId: number,
  decision: "approve" | "reject"
) => {
  const existing = approvalStatusByRequest.value[requestId];
  if (!existing) return;
  approvalStatusByRequest.value = {
    ...approvalStatusByRequest.value,
    [requestId]: { ...existing, myDecision: decision },
  };
};

// ================================================================
// HELPERS
// ================================================================

const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    draft: "Draft", pending: "Pending", approved: "Approved", rejected: "Rejected",
  };
  return map[status] || status;
};

const getItemNames = (items: PurchaseItem[]): string => {
  if (!items || items.length === 0) return "";
  return items.map((i) => i.name).join(", ");
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const getFileName = (url?: string): string => purchaseRequestService.getFileName(url);

const canDecide = (req: PurchaseRequest): boolean => {
  const s = approvalStatusByRequest.value[req.id];
  if (!s) return false;
  if (s.mySubgroupId == null) return false;
  if (s.myDecision != null) return false;
  if (req.status !== "pending") return false;
  return true;
};

const notMyStageTooltip = (req: PurchaseRequest): string => {
  const s = approvalStatusByRequest.value[req.id];
  if (!s) return "Loading…";
  if (req.status !== "pending") return `Request is ${req.status}`;
  if (s.mySubgroupId == null) return "Your subgroup is not in the current stage";
  if (s.myDecision != null) return "Your subgroup has already decided";
  return "You cannot decide this request";
};

const mySubgroupLabel = (req: PurchaseRequest | null): string => {
  if (!req) return "your subgroup";
  const s = approvalStatusByRequest.value[req.id];
  if (!s || s.mySubgroupId == null) return "your subgroup";
  const row = s.subgroups.find((x) => x.subgroupId === s.mySubgroupId);
  return row?.subgroupName || "your subgroup";
};

const myDecisionTooltip = (req: PurchaseRequest): string => {
  const s = approvalStatusByRequest.value[req.id];
  if (!s) return "";
  if (s.mySubgroupId == null) return "Your subgroup is not part of this stage";
  const row = s.subgroups.find((x) => x.subgroupId === s.mySubgroupId);
  if (!row) return "";
  if (!row.decision) return "Waiting for your subgroup's decision";
  const who = row.decidedByName ? ` by ${row.decidedByName}` : "";
  const when = row.actedAt ? ` on ${formatDateTime(row.actedAt)}` : "";
  const why = row.comment ? `\n"${row.comment}"` : "";
  return `${row.decision === "approve" ? "Approved" : "Rejected"}${who}${when}${why}`;
};

// ================================================================
// UI INTERACTIONS
// ================================================================

const toggleExpand = (req: PurchaseRequest): void => {
  const next = expandedRow.value === req.id ? null : req.id;
  expandedRow.value = next;
  if (next && !approvalStatusByRequest.value[req.id]) {
    fetchApprovalStatus(req.id);
  }
};

const onSearchChange = (): void => {
  currentPage.value = 1;
  fetchRequests();
};

const onFilterChange = (): void => {
  currentPage.value = 1;
  fetchRequests();
};

const onDateRangeChange = (): void => {
  dateRangeError.value = "";
  if (filterDateRange.value !== "custom") {
    customStartDate.value = "";
    customEndDate.value = "";
  }
  currentPage.value = 1;
  if (filterDateRange.value === "custom") {
    if (customStartDate.value && customEndDate.value) fetchRequests();
    return;
  }
  fetchRequests();
};

const applyCustomDateRange = (): void => {
  if (!customStartDate.value || !customEndDate.value) return;
  if (new Date(customStartDate.value) > new Date(customEndDate.value)) {
    dateRangeError.value = "Start date must be before end date";
    return;
  }
  dateRangeError.value = "";
  currentPage.value = 1;
  fetchRequests();
};

const clearFilters = (): void => {
  filterDecision.value = "all";
  filterPriority.value = "all";
  filterDepartment.value = "all";
  filterDateRange.value = "all";
  customStartDate.value = "";
  customEndDate.value = "";
  dateRangeError.value = "";
  searchQuery.value = "";
  currentPage.value = 1;
  fetchRequests();
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchRequests();
};

const changePageSize = (): void => {
  currentPage.value = 1;
  fetchRequests();
};

// ================================================================
// APPROVE
// ================================================================

const openApproveModal = (req: PurchaseRequest): void => {
  approveTarget.value = req;
  approveComment.value = "";
  showApproveModal.value = true;
};

const closeApproveModal = (): void => {
  showApproveModal.value = false;
  approveTarget.value = null;
  approveComment.value = "";
  submittingDecision.value = false;
};

const confirmApprove = async (): Promise<void> => {
  const req = approveTarget.value;
  if (!req) return;

  submittingDecision.value = true;
  try {
    const res = await purchaseRequestService.decide(
      req.id,
      "approve",
      approveComment.value.trim() || undefined
    );
    if (!res.success) throw new Error(res.error || "Failed to approve");

    showToastMessage(`✅ ${req.prNumber} — your subgroup approved`, "success");

    // 1. Immediately flip the pill locally so the row updates without flicker.
    setLocalDecision(req.id, "approve");

    closeApproveModal();

    // 2. Refresh the server status in the background. If the server drops the
    //    request (because it no longer matches "pending-my-approval"), keep the
    //    row + last known decision so the user still sees their approval.
    const savedStatus = approvalStatusByRequest.value[req.id];
    await refreshRowStatus(req.id);
    if (!approvalStatusByRequest.value[req.id] && savedStatus) {
      approvalStatusByRequest.value = {
        ...approvalStatusByRequest.value,
        [req.id]: { ...savedStatus, myDecision: "approve" },
      };
    }
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to approve", "error");
  } finally {
    submittingDecision.value = false;
  }
};

// ================================================================
// REJECT
// ================================================================

const openRejectModal = (req: PurchaseRequest): void => {
  rejectTarget.value = req;
  rejectComment.value = "";
  rejectError.value = "";
  showRejectModal.value = true;
};

const closeRejectModal = (): void => {
  showRejectModal.value = false;
  rejectTarget.value = null;
  rejectComment.value = "";
  rejectError.value = "";
  submittingDecision.value = false;
};

const confirmReject = async (): Promise<void> => {
  const req = rejectTarget.value;
  if (!req) return;
  if (!rejectComment.value.trim()) {
    rejectError.value = "Please provide a reason for rejection.";
    return;
  }

  submittingDecision.value = true;
  try {
    const res = await purchaseRequestService.decide(
      req.id,
      "reject",
      rejectComment.value.trim()
    );
    if (!res.success) throw new Error(res.error || "Failed to reject");

    showToastMessage(`❌ ${req.prNumber} rejected`, "info");

    setLocalDecision(req.id, "reject");

    closeRejectModal();

    const savedStatus = approvalStatusByRequest.value[req.id];
    await refreshRowStatus(req.id);
    if (!approvalStatusByRequest.value[req.id] && savedStatus) {
      approvalStatusByRequest.value = {
        ...approvalStatusByRequest.value,
        [req.id]: { ...savedStatus, myDecision: "reject" },
      };
    }
  } catch (err: any) {
    showToastMessage(err?.message || "Failed to reject", "error");
  } finally {
    submittingDecision.value = false;
  }
};

// ================================================================
// IMAGE HANDLERS
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

const zoomIn = (): void => { zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3); };
const zoomOut = (): void => { zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.25); };
const resetZoom = (): void => { zoomLevel.value = 1; };

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.key === "Escape" && showImageViewer.value) closeImageViewer();
  if (showImageViewer.value) {
    if (e.key === "+" || e.key === "=") zoomIn();
    if (e.key === "-") zoomOut();
    if (e.key === "0") resetZoom();
  }
};

// ================================================================
// TOAST + LIFECYCLE
// ================================================================

const showToastMessage = (
  msg: string,
  type: "success" | "error" | "info" | "warning" = "success"
): void => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

onMounted(() => {
  fetchRequests();
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

.search-box { position: relative; }
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

/* FILTERS */
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
.btn-clear-filters:hover { background: #e2e8f0; }

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
.date-input-group { display: flex; flex-direction: column; gap: 4px; }
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
}
.btn-apply-date:hover:not(:disabled) { background: #2563eb; }
.btn-apply-date:disabled { opacity: 0.5; cursor: not-allowed; }
.date-error { color: #dc2626; font-size: 12px; font-weight: 500; }

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

/* TABLE */
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
  min-width: 1000px;
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
.col-status { min-width: 200px; }
.col-actions { min-width: 130px; text-align: right; }

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

.items-summary { display: flex; flex-direction: column; gap: 2px; }
.item-count { font-weight: 600; color: #1e293b; }
.item-names {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.dept-name, .prepared-name { font-weight: 500; color: #1e293b; }
.date-cell { font-size: 12px; color: #475569; }

/* PRIORITY */
.priority-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}
.priority-badge.low { background: #dbeafe; color: #1e40af; }
.priority-badge.medium { background: #fef3c7; color: #92400e; }
.priority-badge.high { background: #fde68a; color: #92400e; }
.priority-badge.urgent {
  background: #fee2e2;
  color: #991b1b;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

/* STATUS */
.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}
.status-badge.draft { background: #e2e8f0; color: #475569; }
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.approved { background: #dcfce7; color: #166534; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }

.my-decision-pill-wrap { margin-top: 6px; }
.my-decision-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  cursor: help;
  white-space: nowrap;
}
.my-decision-pill.waiting { background: #fef3c7; color: #92400e; }
.my-decision-pill.approved { background: #dcfce7; color: #166534; }
.my-decision-pill.rejected { background: #fee2e2; color: #991b1b; }
.my-decision-pill.not-mine { background: #f1f5f9; color: #94a3b8; font-style: italic; }

/* ACTIONS */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-approve-row {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-approve-row:hover { background: #22c55e; color: white; border-color: #16a34a; }

.btn-reject-row {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-reject-row:hover { background: #ef4444; color: white; border-color: #dc2626; }

.decided-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.decided-pill.approved { background: #dcfce7; color: #166534; }
.decided-pill.rejected { background: #fee2e2; color: #991b1b; }

.na-pill {
  color: #cbd5e1;
  font-weight: 700;
  font-size: 14px;
  cursor: help;
}

/* EXPAND */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 6px;
}
.expand-btn:hover { background: #e0e7ff; }

.expanded-row { background: #f8fafc; }
.detail-expand-row td { padding: 0 !important; }
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
.detail-card.full-width { grid-column: 1 / -1; }

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

/* My decision card */
.my-decision-card {
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
}

.my-decision-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dbeafe;
  flex-wrap: wrap;
}
.my-decision-header h4 { margin: 0; padding: 0; border: none; }

.stage-pill {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #1e40af;
  background: #dbeafe;
  padding: 3px 12px;
  border-radius: 12px;
  text-transform: uppercase;
}

.stage-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 4px;
  color: #64748b;
  font-size: 12px;
}
.spinner.small { width: 16px; height: 16px; border-width: 2px; margin: 0; }

.not-mine-banner {
  padding: 12px 14px;
  background: #f1f5f9;
  border-radius: 8px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}

.my-decision-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.my-subgroup-name {
  font-size: 13px;
  color: #1e293b;
}
.my-subgroup-label {
  color: #64748b;
  margin-right: 6px;
}

.my-status-block {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
}
.my-status-block.approved { background: #f0fdf4; border-color: #bbf7d0; }
.my-status-block.rejected { background: #fef2f2; border-color: #fecaca; }
.my-status-block.waiting  { background: #fffbeb; border-color: #fef3c7; }

.my-status-block .big-icon { font-size: 32px; flex-shrink: 0; }
.my-status-block .big-text { display: flex; flex-direction: column; gap: 2px; }
.my-status-block .big-text strong { font-size: 15px; color: #0f172a; }
.my-status-block .big-text small { font-size: 12px; color: #64748b; }

.my-decision-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 4px;
}
.btn-approve-stage {
  background: #22c55e;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-approve-stage:hover { background: #16a34a; }
.btn-reject-stage {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-reject-stage:hover { background: #dc2626; }

/* PREVIEW CARD */
.preview-card {
  min-height: 240px;
}
.preview-image-wrapper {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  cursor: zoom-in;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.25s ease;
}
.preview-image-wrapper:hover .preview-image { transform: scale(1.05); }
.preview-overlay {
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
  border-radius: 8px;
}
.preview-image-wrapper:hover .preview-overlay { opacity: 1; }
.preview-overlay .zoom-icon { font-size: 28px; }
.preview-overlay .zoom-text { font-size: 12px; font-weight: 500; }

.preview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  padding: 30px 10px;
}
.preview-empty-icon { font-size: 40px; opacity: 0.5; }
.preview-empty p { margin: 0; font-size: 13px; font-style: italic; }

/* INFO */
.info-rows { display: flex; flex-direction: column; gap: 8px; }
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed #f1f5f9;
}
.info-row:last-child { border-bottom: none; }
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

/* ITEMS TABLE */
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
.items-detail-table tbody tr:last-child td { border-bottom: none; }
.items-detail-table tbody tr:hover { background: #f8fafc; }
.item-name-cell { font-weight: 600; color: #1e293b; }
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
.font-bold { font-weight: 700; font-size: 13px; color: #0f172a; }
.spec-cell {
  font-size: 11px;
  color: #475569;
  max-width: 200px;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.4;
}
.no-items { padding: 20px !important; color: #94a3b8; font-style: italic; }

/* STATES */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { font-size: 48px; opacity: 0.5; }
.empty-state p { color: #94a3b8; font-size: 16px; margin: 0; }
.empty-hint { color: #cbd5e1; font-size: 13px; }

.loading-state { text-align: center; padding: 60px 20px; }
.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #22c55e;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* PAGINATION */
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

/* MODALS */
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
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 520px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}
.modal-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: #0f172a; }
.modal-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
}
.modal-close:hover { background: #f1f5f9; color: #0f172a; }

.modal-body { padding: 24px; overflow-y: auto; max-height: calc(90vh - 130px); }
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

.confirmation-icon { font-size: 48px; text-align: center; margin-bottom: 12px; }

.on-behalf-banner {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  margin-bottom: 14px;
}
.on-behalf-banner.reject {
  background: #fef2f2;
  border-color: #fecaca;
}
.ob-icon { font-size: 22px; flex-shrink: 0; }
.ob-body { font-size: 13px; color: #1e293b; }
.ob-body strong { display: block; font-size: 12px; color: #64748b; font-weight: 600; }
.ob-body span {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #166534;
  margin: 2px 0;
}
.on-behalf-banner.reject .ob-body span { color: #991b1b; }
.ob-body small { font-size: 11px; color: #94a3b8; }

.form-group { margin-bottom: 14px; }
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.required { color: #ef4444; }

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}
.form-textarea:focus { outline: none; border-color: #3b82f6; }

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

.upload-error {
  color: #dc2626;
  font-size: 12px;
  margin-top: 8px;
  padding: 6px 10px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-width: 140px;
}
.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; background: #94a3b8; }

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-width: 140px;
}
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}
.btn-secondary:hover { background: #e2e8f0; }

/* IMAGE VIEWER */
.image-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: viewerFadeIn 0.2s ease;
}
@keyframes viewerFadeIn { from { opacity: 0; } to { opacity: 1; } }

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
.viewer-title { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.viewer-icon { font-size: 20px; flex-shrink: 0; }
.viewer-title-text {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.viewer-actions { display: flex; gap: 8px; flex-wrap: wrap; }
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
}
.viewer-btn:hover { background: rgba(255, 255, 255, 0.2); }
.viewer-close-btn { background: #ef4444; border-color: #ef4444; }
.viewer-close-btn:hover { background: #dc2626; }

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
}
.zoom-btn:hover { background: rgba(255, 255, 255, 0.15); }
.zoom-level {
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

/* TOAST */
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
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes fadeOut { to { opacity: 0; transform: translateY(-10px); } }
.toast.success { background: #22c55e; }
.toast.error   { background: #ef4444; }
.toast.info    { background: #3b82f6; }
.toast.warning { background: #f59e0b; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .card-header { flex-direction: column; align-items: stretch; }
  .header-title { justify-content: space-between; width: 100%; }
  .header-actions { width: 100%; }
  .search-box { width: 100%; }
  .search-box input { width: 100%; }

  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-select { width: 100%; }
  .date-range-bar { flex-direction: column; align-items: stretch; }
  .date-input-group { width: 100%; }
  .date-input { width: 100%; }
  .btn-apply-date { width: 100%; justify-content: center; }
  .detail-container { grid-template-columns: 1fr; }
  .info-row { flex-direction: column; gap: 4px; }
  .info-label { min-width: auto; }
  .requests-table { font-size: 11px; min-width: 850px; }
  .requests-table th, .requests-table td { padding: 6px 8px; }
  .pagination { gap: 8px; }
  .page-btn { padding: 4px 12px; font-size: 12px; }
  .image-viewer-toolbar { flex-direction: column; align-items: stretch; }
  .viewer-actions { justify-content: stretch; }
  .viewer-btn { flex: 1; justify-content: center; }
  .toast { bottom: 16px; right: 16px; left: 16px; max-width: none; padding: 10px 16px; }
}

@media (max-width: 480px) {
  .requests-table { min-width: 700px; }
  .requests-table th, .requests-table td { padding: 4px 6px; font-size: 10px; }
  .status-badge, .priority-badge { padding: 2px 8px; font-size: 9px; }
  .items-detail-table { min-width: 750px; }
  .preview-image-wrapper { height: 180px; }
  .my-decision-actions { flex-direction: column; }
  .btn-approve-stage, .btn-reject-stage { width: 100%; justify-content: center; }
}
</style>