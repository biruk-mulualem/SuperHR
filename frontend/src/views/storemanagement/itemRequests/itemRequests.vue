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
          v-if="canCreateRequests"
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
                        notification.approval_type === 'department' ? 'dept-dot' : 'group-dot',
                        notification.stage === 'asking_store' ? 'asking-dot' : 'supplying-dot'
                      ]"
                    ></span>
                    <span class="notification-type-label">
                      {{ notification.approval_type === 'department' ? 'D' : 'G' }}
                    </span>
                  </div>
                  <span class="notification-text">{{ getAcceptanceSummary(req) }}</span>
                </div>
                <div v-if="isAssetRequest(req)" class="asset-badge">🔧 Asset</div>
                <div v-if="isTemelashRequest(req)" class="temelash-badge">🔄 Temelash</div>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="canManageThisRequest(req) && canPrintRequest(req)"
                    class="icon-btn print-btn"
                    @click="printRequest(req)"
                    :disabled="!canPrintRequest(req)"
                    :title="getApproveTooltip(req)"
                  >
                    🖨️
                  </button>

                  <button
                    v-if="canManageThisRequest(req) && canEditRequest(req)"
                    class="icon-btn"
                    @click="editRequest(req)"
                    :title="canEditRequest(req) ? 'Edit' : 'Cannot edit this request'"
                  >
                    ✏️
                  </button>

                  <button
                    v-if="canManageThisRequest(req) && canApproveRequest(req)"
                    class="icon-btn"
                    @click="openStatusConfirmation(req, 'approved')"
                    :disabled="!canApproveRequest(req)"
                    :title="getApproveTooltip(req)"
                  >
                    ✅
                  </button>

                  <!-- ✅ DELETE — only asking store, pending, not accepted -->
                  <button
                    v-if="canManageThisRequest(req) && canDeleteRequest(req)"
                    class="icon-btn delete-btn"
                    @click="openDeleteRequestModal(req)"
                    title="Delete Request"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED ROW — PAPER VIEW ==================== -->
            <tr
              v-if="expandedRow === (req.requestId || req.id) && shouldShowRequest(req)"
              class="detail-expand-row"
            >
              <td colspan="8">
                <div class="view-paper">
                  <header class="paper-header">
                    <h1 class="paper-motto">WE TRUST IN GOD!!!</h1>
                    <h1 class="paper-motto">እግዚአብሔር ይባርክ!!!</h1>
                    <h2 class="paper-company">
                      SUPER DOUBLE "T" GENERAL TRADING PLC .
                    </h2>
                    <h3 class="paper-subtitle">{{ viewHeader }}</h3>

                    <div class="paper-date-row">
                      <span>
                        <strong>REQ. NO:-</strong>
                        {{ req.requestCode || req.requestId || req.id }}
                      </span>
                      <span class="paper-date-field">
                        <strong>DATE:-</strong>
                        <span class="paper-date-display">
                          {{ formatDate(req.requestedDate) }}
                        </span>
                      </span>
                    </div>
                  </header>

                  <table class="paper-items-table">
                    <thead>
                      <tr>
                        <th
                          v-if="viewMergeGroups.length > 0"
                          class="no-print"
                          style="width: 3%"
                        >
                          ☑
                        </th>
                        <th style="width: 6%">No</th>
                        <th
                          v-for="col in viewColumns"
                          :key="col.key"
                          :style="{ width: col.width }"
                        >
                          {{ col.label }}
                        </th>
                        <th style="width: 10%">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in viewItems"
                        :key="`v-${index}-${item.itemId}`"
                        :class="{
                          'row-merged-absorbed': isViewAbsorbed(index),
                        }"
                      >
                        <td
                          v-if="viewMergeGroups.length > 0"
                          class="no-print cell-checkbox"
                        ></td>

                        <td class="paper-row-number">{{ index + 1 }}</td>

                        <td
                          v-for="col in viewColumns"
                          :key="col.key"
                          :class="{
                            'text-left': col.align === 'left',
                            'font-bold': col.bold,
                            'spec-cell': col.key === 'specification',
                          }"
                        >
                          <template v-if="col.computed === 'totalPrice'">
                            {{ getViewComputedValue(item, index, col) }}
                          </template>
                          <template v-else-if="col.editable">
                            {{ getViewCustomCell(index, col.key) || '—' }}
                          </template>
                          <template v-else-if="col.key === 'uom'">
                            {{ getViewUom(item) }}
                          </template>
                          <template v-else-if="col.key === 'quantity'">
                            {{ formatViewQuantity(item.quantity) }}
                          </template>
                          <template v-else-if="col.key === 'brand'">
                            {{ item.brand || '' }}
                          </template>
                          <template v-else-if="col.key === 'model'">
                            {{ item.model || '' }}
                          </template>
                          <template v-else-if="col.key === 'specification'">
                            {{ item.specification || '' }}
                          </template>
                          <template v-else>
                            {{ getViewColumnValue(item, col) }}
                          </template>
                        </td>

                        <td
                          v-if="isViewMergeStart(index)"
                          class="paper-remark-cell merged"
                          :rowspan="getViewMergeSize(index)"
                        >
                          <div class="merged-remark-content">
                            <span class="merged-remark-text">
                              {{ getViewMergedRemark(index) || '—' }}
                            </span>
                          </div>
                        </td>
                        <td
                          v-else-if="!isViewAbsorbed(index)"
                          class="paper-remark-cell"
                        >
                          {{ item.remark || '' }}
                        </td>
                      </tr>

                      <tr v-if="viewItems.length === 0">
                        <td
                          :colspan="
                            (viewMergeGroups.length > 0 ? 3 : 2) +
                            viewColumns.length +
                            1
                          "
                          class="no-items"
                        >
                          No items in this request
                        </td>
                      </tr>

                      <tr v-if="viewHasTotalPrice" class="paper-grand-total-row">
                        <td
                          :colspan="viewMergeGroups.length > 0 ? 2 : 1"
                          class="paper-grand-total-spacer"
                        ></td>
                        <template
                          v-for="col in viewColumns"
                          :key="`tot-${col.key}`"
                        >
                          <td
                            v-if="col.key === 'unitPrice'"
                            class="paper-grand-total-label"
                          >
                            TOTAL
                          </td>
                          <td
                            v-else-if="col.key === 'totalPrice'"
                            class="paper-grand-total-value"
                          >
                            <span class="paper-grand-total-amount">
                              {{ viewGrandTotal }}
                            </span>
                          </td>
                          <td v-else class="paper-grand-total-spacer"></td>
                        </template>
                        <td class="paper-grand-total-spacer"></td>
                      </tr>
                    </tbody>
                  </table>

                  <div class="paper-meta-grid">
                    <div
                      v-if="viewSectionVisibility.department"
                      class="paper-meta-col"
                    >
                      <div class="paper-block-header">Department</div>
                      <div class="paper-block-body paper-dept-body">
                        <strong class="paper-dept-value">
                          {{ viewDepartment || 'N/A' }}
                        </strong>
                      </div>
                    </div>

                    <div class="paper-meta-col">
                      <div class="paper-block-header">Requested By</div>
                      <div class="paper-block-body paper-workflow-body">
                        <p>
                          <strong>Name:-</strong>
                          <span class="paper-inline">{{
                            req.requestedBy ||
                            req.requestedByUser?.fullName ||
                            req.requestedByUser?.username ||
                            '—'
                          }}</span>
                        </p>
                        <p>
                          <strong>Signature</strong>
                          _______________________
                        </p>
                      </div>
                    </div>

                    <div class="paper-meta-col">
                      <div class="paper-block-header">Approved By</div>
                      <div class="paper-block-body paper-workflow-body">
                        <p>
                          <strong>Name :-</strong>
                          <span class="paper-inline">{{
                            viewApprovedByName || ' '
                          }}</span>
                        </p>
                        <p>
                          <strong>Signature</strong>
                          _______________________
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="paper-footer-sections">
                    <div
                      v-if="viewSectionVisibility.reason"
                      class="paper-input-row"
                    >
                      <div class="paper-gray-label">Reason</div>
                      <div class="paper-lines-container">
                        <div class="paper-reason-readonly">
                          {{ req.remark || '—' }}
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="viewSectionVisibility.comment"
                      class="paper-input-row paper-short-width"
                    >
                      <div class="paper-gray-label">Comment</div>
                      <div class="paper-lines-container">
                        <div class="paper-write-line"></div>
                        <div class="paper-write-line"></div>
                      </div>
                    </div>

                    <div
                      v-if="viewSectionVisibility.checkedBy"
                      class="paper-checked-by"
                    >
                      <div class="paper-gray-label paper-inline-label">
                        Checked By
                      </div>
                      <div class="paper-checked-body">
                        <p><strong>Name</strong> _____________________________.</p>
                        <p><strong>Signature</strong> _____________________.</p>
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
      <select v-model="pageSize" @click="changePageSize" class="limit-select">
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
            <strong>{{ statusAction }}</strong>.
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

    <!-- ==================== DELETE REQUEST MODAL ==================== -->
    <div
      v-if="showDeleteRequestModal"
      class="modal-overlay"
      @click.self="closeDeleteRequestModal"
    >
      <div class="modal-container status-modal">
        <div class="modal-header">
          <h3>🗑️ Delete Request</h3>
          <button class="modal-close" @click="closeDeleteRequestModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">⚠️</div>
          <p class="confirmation-title">
            Are you sure you want to delete this request?
          </p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Request:</span>
              <span class="detail-value">{{ deleteTarget?.requestCode || deleteTarget?.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value">{{ deleteTarget?.items?.length || 0 }} item(s)</span>
            </div>
          </div>
          <p class="delete-warning">⚠️ This action cannot be undone!</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteRequestModal">
            Cancel
          </button>
          <button class="btn-danger" @click="confirmDeleteRequest">
            Delete Request
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import itemRequestService from "@/stores/itemRequestService";
import type {
  ItemRequest,
  RequestItem,
  Store,
  Item,
} from "@/stores/itemRequestService";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// ================================================================
// STATE
// ================================================================

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

dayjs.extend(utc);
dayjs.extend(timezone);

const stores = ref<Store[]>([]);
const items = ref<Item[]>([]);
const requests = ref<ItemRequest[]>([]);
const loading = ref(false);
const loadingStores = ref(false);
const loadingItems = ref(false);

const userAssignedStoreId = ref<number | null>(null);
const userAssignedStoreName = ref<string | null>(null);
const userIsAdmin = ref(false);
const userIsAskingStore = ref(false);
const userRole = ref<string>("");
const currentUserId = ref<number | null>(null);

const searchQuery = ref("");
const filterStatus = ref("all");
const filterStore = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

const expandedRow = ref<number | null>(null);

const viewHeader = ref<string>("ITEM REQUISITION FORM");
const viewDepartment = ref<string>("");
const viewApprovedByName = ref<string>("");
const viewItems = ref<any[]>([]);
const viewColumns = ref<
  Array<{
    key: string;
    label: string;
    width: string;
    visible: boolean;
    align?: "left" | "center";
    bold?: boolean;
    custom?: boolean;
    editable?: boolean;
    kind?: "text" | "number";
    computed?: "totalPrice";
    pairedKey?: string;
  }>
>([]);
const viewCustomCells = ref<Record<string, Record<string, string>>>({});
const viewMergeGroups = ref<
  Array<{ start: number; size: number; text: string }>
>([]);
const viewSectionVisibility = ref({
  department: true,
  reason: true,
  comment: true,
  checkedBy: true,
});

const showExportModal = ref(false);
const exporting = ref(false);
const exportType = ref<"full" | "summary">("full");

const showStatusModal = ref(false);
const statusTarget = ref<ItemRequest | null>(null);
const statusAction = ref<"approved" | "finalized">("approved");

// ✅ NEW: Delete state
const showDeleteRequestModal = ref(false);
const deleteTarget = ref<ItemRequest | null>(null);

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// COMPUTED
// ================================================================

const activeStores = computed(() =>
  stores.value.filter((store) => store.status === "Active"),
);

const hasActiveFilters = computed(
  () =>
    filterStatus.value !== "all" ||
    filterStore.value !== "all" ||
    searchQuery.value,
);

const paginatedRequests = computed(() => requests.value);

const totalPages = computed(
  () => Math.ceil(totalItems.value / pageSize.value) || 1,
);

const canCreateRequests = computed(
  () => userIsAdmin.value || !!userAssignedStoreId.value,
);

const canManageThisRequest = (req: ItemRequest): boolean => {
  if (userIsAdmin.value) return true;
  if (!isUserAskingStore(req)) return false;
  const reqCreatorId = Number(req.requestedById || 0);
  const me = Number(currentUserId.value || 0);
  if (!reqCreatorId || !me) return false;
  return reqCreatorId === me;
};

// ================================================================
// SKIP NOTIFICATION STORES
// ================================================================
const SKIP_NOTIFICATION_STORES = ["STORE-006", "STORE-007"];
const shouldSkipNotifications = (storeCode: string): boolean =>
  SKIP_NOTIFICATION_STORES.includes(storeCode);

const isSkipStore = (req: ItemRequest): boolean => {
  const supplyingStore = stores.value.find(
    (s) => (s.storeId || s.id) === req.supplyingStoreId,
  );
  return supplyingStore
    ? shouldSkipNotifications(supplyingStore.code)
    : false;
};

// ================================================================
// ASSET DETECTION
// ================================================================
const ASSET_DEPARTMENT_ID = 15;
const isAssetRequest = (req: ItemRequest): boolean => {
  if (!req) return false;
  const notifications = (req as any).notifications as Array<any> | undefined;
  if (!notifications || notifications.length === 0) return false;
  return notifications.some((n) => {
    if (n?.is_department_approval !== true) return false;
    const deptId = Number(
      n.department_id ??
        n.departmentId ??
        n.department?.id ??
        n.department?.departmentId ??
        0,
    );
    return deptId === ASSET_DEPARTMENT_ID;
  });
};

// ================================================================
// TEMELASH DETECTION
// ================================================================
const isTemelashRequest = (req: ItemRequest): boolean =>
  (req as any).isTemelash === true;

const formatTemelashWindow = (req: ItemRequest): string => {
  const fmt = (d: string | null | undefined): string => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const from = (req as any).temelashFromDate;
  const to = (req as any).temelashToDate;
  if (!from && !to) return "—";
  return `${fmt(from)} → ${fmt(to)}`;
};

// ================================================================
// STAGE INFO
// ================================================================
interface StageInfo {
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
  isComplete: boolean;
  hasRejection: boolean;
  isActive: boolean;
  isWaiting: boolean;
}

const getStageInfo = (req: ItemRequest) => {
  const notifications = (req as any).notifications || [];
  const askingNotifs = notifications.filter(
    (n: any) => n.stage === "asking_store",
  );
  const supplyingNotifs = notifications.filter(
    (n: any) => n.stage === "supplying_store",
  );

  const summarize = (notifs: any[]): StageInfo => {
    const total = notifs.length;
    const accepted = notifs.filter(
      (n: any) => n.status === "accepted",
    ).length;
    const rejected = notifs.filter(
      (n: any) => n.status === "rejected",
    ).length;
    const pending = notifs.filter((n: any) => n.status === "pending").length;
    const isComplete = total > 0 && accepted === total;
    const hasRejection = rejected > 0;
    const isActive = total > 0 && pending > 0 && !hasRejection;
    return {
      total,
      accepted,
      rejected,
      pending,
      isComplete,
      hasRejection,
      isActive,
      isWaiting: false,
    };
  };

  const asking = summarize(askingNotifs);
  const supplying = summarize(supplyingNotifs);

  const isWaitingForAsking =
    asking.total > 0 && asking.isComplete && supplyingNotifs.length === 0;
  const isWaitingBecauseAskingNotDone =
    asking.total > 0 &&
    !asking.isComplete &&
    !asking.hasRejection &&
    supplyingNotifs.length === 0;

  supplying.isWaiting = isWaitingForAsking || isWaitingBecauseAskingNotDone;

  return { askingStore: asking, supplyingStore: supplying };
};

const getStageNotifications = (
  req: ItemRequest,
  stage: "asking_store" | "supplying_store",
) => {
  const notifications = (req as any).notifications || [];
  return notifications.filter((n: any) => n.stage === stage);
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
  if (req.status === "finalized") return false;
  if (!isUserAskingStore(req)) return false;
  return true;
};

const canApproveRequest = (req: ItemRequest): boolean => {
  if (!isUserAskingStore(req)) return false;
  if (req.status !== "pending") return false;
  if (isSkipStore(req)) return true;
  if (!req.notifications || req.notifications.length === 0) return false;
  const allAccepted = req.notifications.every(
    (n: { status: string }) => n.status === "accepted",
  );
  const hasRejection = req.notifications.some(
    (n: { status: string }) => n.status === "rejected",
  );
  return allAccepted && !hasRejection;
};

const canPrintRequest = (req: ItemRequest): boolean => {
  if (!isUserAskingStore(req)) return false;
  if (req.status !== "pending") return false;
  if (isSkipStore(req)) return true;
  if (!req.notifications || req.notifications.length === 0) return false;
  const allAccepted = req.notifications.every(
    (n: { status: string }) => n.status === "accepted",
  );
  const hasRejection = req.notifications.some(
    (n: { status: string }) => n.status === "rejected",
  );
  return allAccepted && !hasRejection;
};

// ✅ NEW: Delete permission
// - Only the asking store can delete
// - Only if status is "pending"
// - Only if NO notifications have been "accepted" yet
const canDeleteRequest = (req: ItemRequest): boolean => {
  if (!isUserAskingStore(req)) return false;
  if (req.status !== "pending") return false;
  const notifications = (req as any).notifications || [];
  const hasAccepted = notifications.some(
    (n: any) => n.status === "accepted",
  );
  if (hasAccepted) return false;
  return true;
};

const getApproveTooltip = (req: ItemRequest): string => {
  if (req.status !== "pending") return "Request is not pending";
  if (isSkipStore(req))
    return "📦 No acceptance required - Click to approve (Foreign/Local Purchase)";
  const hasRejection =
    req.notifications?.some(
      (n: { status: string }) => n.status === "rejected",
    ) || false;
  if (hasRejection) return "Some groups have rejected - Edit and resubmit";
  const allAccepted =
    req.notifications?.every(
      (n: { status: string }) => n.status === "accepted",
    ) || false;
  if (!allAccepted) {
    const stageInfo = getStageInfo(req);
    if (stageInfo.askingStore.isActive) {
      return `⏳ Waiting for asking store groups (${stageInfo.askingStore.accepted}/${stageInfo.askingStore.total} accepted)`;
    }
    if (stageInfo.supplyingStore.isWaiting) {
      return `⏸️ Asking store complete — sending to supplying store...`;
    }
    if (stageInfo.supplyingStore.isActive) {
      return `⏳ Waiting for supplying store groups (${stageInfo.supplyingStore.accepted}/${stageInfo.supplyingStore.total} accepted)`;
    }
    return "Waiting for all approvals";
  }
  return "All groups accepted - Ready to proceed";
};

const getAcceptanceSummary = (req: ItemRequest): string => {
  if (isSkipStore(req)) return "📦 No acceptance required";
  if (!req.notifications || req.notifications.length === 0)
    return "No approvals";

  const stageInfo = getStageInfo(req);
  const asking = stageInfo.askingStore;
  const supplying = stageInfo.supplyingStore;

  if (asking.total > 0) {
    if (asking.hasRejection) return `❌ Asking: ${asking.rejected} rejected`;
    if (!asking.isComplete)
      return `⏳ Asking: ${asking.accepted}/${asking.total} accepted`;
  }
  if (supplying.isWaiting) return `✅ Asking done — sending to supplying...`;
  if (supplying.total > 0) {
    if (supplying.hasRejection)
      return `❌ Supplying: ${supplying.rejected} rejected`;
    if (!supplying.isComplete)
      return `⏳ Supplying: ${supplying.accepted}/${supplying.total} accepted`;
  }
  return `✅ All ${req.notifications.length} accepted`;
};

const getNotificationTooltip = (notification: any): string => {
  let name = "";
  let type = "";
  let stageLabel = "";
  let responder = "";

  if (
    notification.approval_type === "department" ||
    notification.is_department_approval
  ) {
    type = "Department";
    name = notification.department?.name || "Unknown Department";
  } else {
    type = "Group";
    name = notification.group?.name || "Unknown Group";
  }

  if (notification.stage === "asking_store") {
    stageLabel = "🏪 ASKING STORE";
  } else if (notification.stage === "supplying_store") {
    stageLabel = "📦 SUPPLYING STORE";
  } else {
    stageLabel = "❓ UNKNOWN STAGE";
  }

  if (
    notification.status === "accepted" ||
    notification.status === "rejected"
  ) {
    const user = notification.respondedByUser;
    if (user) responder = user.fullName || user.username || "Unknown";
  }

  let tooltip = `[${stageLabel}]\n${type}: ${name}`;
  if (notification.status === "accepted") {
    tooltip += `\n✅ Accepted`;
    if (responder) tooltip += `\n👤 ${responder}`;
  } else if (notification.status === "rejected") {
    tooltip += `\n❌ Rejected`;
    if (responder) tooltip += `\n👤 ${responder}`;
    if (notification.rejected_reason)
      tooltip += `\n📝 ${notification.rejected_reason}`;
  } else {
    tooltip += `\n⏳ Pending`;
  }
  return tooltip;
};

const getRejectionReasons = (
  req: ItemRequest,
): Array<{
  groupName: string;
  stage?: "asking_store" | "supplying_store";
  reason: string;
  respondedBy: string;
  respondedAt: string;
}> => {
  if (!req.notifications) return [];
  return req.notifications
    .filter((n: { status: string }) => n.status === "rejected")
    .map((n: any) => ({
      groupName:
        n.group?.name || n.department?.name || `Group ${n.group_id}`,
      stage: n.stage,
      reason: n.rejected_reason || "No reason provided",
      respondedBy:
        n.respondedByUser?.fullName ||
        n.respondedByUser?.username ||
        "Unknown",
      respondedAt: n.responded_at,
    }));
};

const shouldShowRequest = (_req: ItemRequest): boolean => true;

// ================================================================
// DATA LOADING
// ================================================================
const loadUserData = () => {
  const user = authStore.user;
  if (!user) return;
  const userData = user as any;
  userIsAdmin.value =
    userData.isAdmin || user.role === "admin" || user.role === "Admin";
  userRole.value = userData.role || "";
  currentUserId.value =
    userData.userId || userData.id || authStore.user?.userId || null;

  let storeId = authStore.userStoreId;
  if (!storeId) {
    storeId =
      userData.storeId ||
      userData.assignedStore?.id ||
      userData.currentStore?.id ||
      userData.store?.id ||
      null;
  }
  let storeName =
    userData.storeName ||
    userData.assignedStore?.name ||
    userData.currentStore?.name ||
    userData.store?.name ||
    null;

  if (storeId) {
    userAssignedStoreId.value = storeId;
    userAssignedStoreName.value = storeName || "Assigned Store";
    userIsAskingStore.value = true;
  } else {
    userAssignedStoreId.value = null;
    userAssignedStoreName.value = null;
    userIsAskingStore.value = false;
  }
};

const getUserAssignedStoreName = (): string =>
  userAssignedStoreName.value || "No store assigned";

const loadStores = async () => {
  loadingStores.value = true;
  try {
    const response = await itemRequestService.getActiveStores();
    if (response.success) stores.value = response.data;
    else showToastMessage(response.error || "Failed to load stores", "error");
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
    if (response.success) items.value = response.data as unknown as Item[];
    else showToastMessage(response.error || "Failed to load items", "error");
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
    if (filterStatus.value !== "all") filters.status = filterStatus.value;
    if (filterStore.value !== "all")
      filters.storeId = Number(filterStore.value);
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
// HELPER METHODS - REQUEST ITEM
// ================================================================
const getItemNameFromRequest = (item: any): string => {
  if (item.item?.name) return item.item.name;
  if (item.item?.standardName) return item.item.standardName;
  if (item.itemName) return item.itemName;
  if (item.name) return item.name;
  return "Unknown Item";
};

const getItemCodeFromRequest = (item: any): string => {
  if (item.item?.code) return item.item.code;
  if (item.itemCode) return item.itemCode;
  if (item.code) return item.code;
  return "N/A";
};

const getItemCategoryFromRequest = (item: any): string => {
  if (item.item?.category?.name) return item.item.category.name;
  if (item.category?.name) return item.category.name;
  const globalItem = items.value.find(
    (i) => (i.itemId || i.id) === item.itemId,
  );
  const anyItem = globalItem as any;
  if (anyItem?.category?.name) return anyItem.category.name;
  return "";
};

const getItemBrandFromRequest = (item: any): string => {
  if (item.brand) return item.brand;
  if (item.item?.brand) return item.item.brand;
  const globalItem = items.value.find(
    (i) => (i.itemId || i.id) === item.itemId,
  );
  if (globalItem?.brand) return globalItem.brand;
  return "";
};

const getItemModelFromRequest = (item: any): string => {
  if (item.model) return item.model;
  if (item.item?.model) return item.item.model;
  const globalItem = items.value.find(
    (i) => (i.itemId || i.id) === item.itemId,
  );
  if (globalItem?.model) return globalItem.model;
  return "";
};

const getItemSpecificationFromRequest = (item: any): string => {
  if (item.specification) return item.specification;
  if (item.item?.specText) return item.item.specText;
  const globalItem = items.value.find(
    (i) => (i.itemId || i.id) === item.itemId,
  );
  if (globalItem?.specText) return globalItem.specText;
  return "";
};

const getItemUOMFromRequest = (item: any): string => {
  if (item.uom_code) return item.uom_code;
  if (item.item?.uom?.code) return item.item.uom.code;
  if (item.uomCode) return item.uomCode;
  return "";
};

// ================================================================
// HELPER METHODS - GLOBAL
// ================================================================
const getStoreName = (storeId: number): string => {
  const store = stores.value.find((s) => (s.storeId || s.id) === storeId);
  return store ? store.name : "Unknown Store";
};

const getStoreCode = (storeId: number): string => {
  const store = stores.value.find((s) => (s.storeId || s.id) === storeId);
  return store ? store.code : "N/A";
};

const getItemName = (itemId: number, requestItems?: any[]): string => {
  if (requestItems) {
    const found = requestItems.find(
      (i) => Number(i.itemId || i.id) === itemId,
    );
    if (found) {
      if (found.item?.name) return found.item.name;
      if (found.item?.standardName) return found.item.standardName;
      if (found.itemName) return found.itemName;
      if (found.name) return found.name;
    }
  }
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item
    ? item.standardName || item.name || "Unknown Item"
    : "Unknown Item";
};

const getItemCode = (itemId: number, requestItems?: any[]): string => {
  if (requestItems) {
    const found = requestItems.find(
      (i) => Number(i.itemId || i.id) === itemId,
    );
    if (found) {
      if (found.item?.code) return found.item.code;
      if (found.itemCode) return found.itemCode;
      if (found.code) return found.code;
    }
  }
  const item = items.value.find((i) => (i.itemId || i.id) === itemId);
  return item ? item.code : "N/A";
};

const getItemNames = (items: RequestItem[] | undefined): string => {
  if (!items || items.length === 0) return "";
  const names = items.map((i) => getItemName(Number(i.itemId), items));
  return names.join(", ");
};

const getRequesterName = (req: ItemRequest): string => {
  if (req.requestedBy && String(req.requestedBy).trim())
    return String(req.requestedBy).trim();
  const u = req.requestedByUser;
  if (u) return u.fullName || u.full_name || u.username || "N/A";
  return "N/A";
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

const formatDateTime = (
  dateString: string | number | Date | dayjs.Dayjs | null | undefined,
) => {
  if (!dateString) return "";
  const date = dayjs.utc(dateString);
  return date.format("MMM D, YYYY h:mm A");
};

const getCurrentUser = (): string =>
  authStore.user?.fullName ||
  authStore.user?.username ||
  authStore.user?.email ||
  "Unknown User";

const getCurrentUserId = (): number | undefined => authStore.user?.userId;

// ================================================================
// TOGGLE EXPAND
// ================================================================
const toggleExpand = async (id?: number): Promise<void> => {
  if (id === undefined || id === null) {
    expandedRow.value = null;
    return;
  }
  if (expandedRow.value === id) {
    expandedRow.value = null;
    return;
  }
  expandedRow.value = id;
  const req = requests.value.find(
    (r) => (r.requestId || r.id) === id,
  );
  if (req) await loadViewSnapshot(req);
};

const closeView = (): void => {
  expandedRow.value = null;
};

// ================================================================
// 🔥 PRINT — navigate to the print page
// ================================================================
const printRequest = (req: ItemRequest): void => {
  if (!canManageThisRequest(req)) {
    showToastMessage(
      "Only the request creator can print this request",
      "error",
    );
    return;
  }

  const requestId = req.requestId || req.id;
  if (!requestId) {
    showToastMessage("Cannot print: missing request ID", "error");
    return;
  }

  router.push({
    name: "item-request-print",
    params: { id: String(requestId) },
    query: { id: String(requestId) },
  });
};

// ================================================================
// VIEW AS PAPER (inline)
// ================================================================
const DEFAULT_VIEW_HEADER = "ITEM REQUISITION FORM";

const buildDefaultViewColumns = () => [
  {
    key: "item",
    label: "Item",
    width: "20%",
    visible: true,
    align: "left" as const,
    getValue: (it: any) =>
      it.name || it.standardName || it.item?.name || "Unknown Item",
  },
  {
    key: "uom",
    label: "U.O.M",
    width: "7%",
    visible: true,
  },
  {
    key: "quantity",
    label: "Qty",
    width: "7%",
    visible: true,
    bold: true,
  },
  {
    key: "brand",
    label: "Brand",
    width: "11%",
    visible: true,
  },
  {
    key: "model",
    label: "Model",
    width: "11%",
    visible: true,
  },
  {
    key: "specification",
    label: "Specification",
    width: "20%",
    visible: true,
  },
];

const getViewUom = (item: any): string => {
  if (!item) return "—";
  if (item.selectedUom === "conversion") {
    return item._convUom || item._baseUom || "—";
  }
  return item._baseUom || item.uom_code || item.uomCode || "—";
};

const formatViewQuantity = (v: number | string): string => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n)) return "0.00";
  return n.toFixed(2);
};

const getViewColumnValue = (item: any, col: any): string => {
  if (col.key === "item") {
    return (
      item.name || item.standardName || item.item?.name || "Unknown Item"
    );
  }
  return "";
};

const getViewCustomCell = (rowIndex: number, colKey: string): string =>
  viewCustomCells.value[String(rowIndex)]?.[colKey] || "";

const getViewComputedValue = (
  item: any,
  rowIndex: number,
  col: any,
): string => {
  if (col.computed === "totalPrice") {
    const unit = parseFloat(getViewCustomCell(rowIndex, "unitPrice")) || 0;
    const qty = parseFloat(String(item?.quantity ?? 0)) || 0;
    if (!unit || !qty) return "";
    return (unit * qty).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return "";
};

const viewHasTotalPrice = computed(() =>
  viewColumns.value.some((c) => c.key === "totalPrice"),
);

const viewGrandTotal = computed(() => {
  const totalCol = viewColumns.value.find((c) => c.key === "totalPrice");
  if (!totalCol) return "";
  let sum = 0;
  viewItems.value.forEach((it, idx) => {
    const raw = getViewComputedValue(it, idx, totalCol);
    const num = parseFloat(String(raw).replace(/[^0-9.\-]/g, "")) || 0;
    sum += num;
  });
  return sum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

const isViewAbsorbed = (i: number) =>
  viewMergeGroups.value.some((g) => i > g.start && i < g.start + g.size);

const isViewMergeStart = (i: number) =>
  viewMergeGroups.value.some((g) => g.start === i);

const getViewMergeSize = (start: number) => {
  const g = viewMergeGroups.value.find((grp) => grp.start === start);
  return g ? g.size : 1;
};

const getViewMergedRemark = (start: number) => {
  const g = viewMergeGroups.value.find((grp) => grp.start === start);
  return g ? g.text : "";
};

const restoreViewFromSnapshot = (snap: any) => {
  if (!snap) return;

  if (typeof snap.header === "string") viewHeader.value = snap.header;
  if (typeof snap.department === "string")
    viewDepartment.value = snap.department;
  if (typeof snap.approvedByName === "string")
    viewApprovedByName.value = snap.approvedByName;

  if (snap.sectionVisibility) {
    viewSectionVisibility.value = {
      department: true,
      reason: true,
      comment: true,
      checkedBy: true,
      ...snap.sectionVisibility,
    };
  }

  if (Array.isArray(snap.columnsConfig) && snap.columnsConfig.length > 0) {
    const builtin = new Map(
      buildDefaultViewColumns().map((c: any) => [c.key, c]),
    );
    const restored: any[] = [];
    snap.columnsConfig.forEach((s: any) => {
      const b = builtin.get(s.key);
      if (b) restored.push({ ...b, visible: s.visible !== false });
      else if (s.custom) {
        restored.push({
          key: s.key,
          label: s.label || "Custom",
          width: s.width || "12%",
          visible: s.visible !== false,
          custom: true,
          editable: s.editable ?? true,
          kind: s.kind || "text",
          computed: s.computed,
          pairedKey: s.pairedKey,
          align: s.align,
          bold: s.bold,
        });
      }
    });
    builtin.forEach((b: any, k: string) => {
      if (!restored.find((c) => c.key === k))
        restored.push({ ...b, visible: true });
    });
    viewColumns.value = restored;
  } else {
    viewColumns.value = buildDefaultViewColumns();
  }

  if (snap.customCells && typeof snap.customCells === "object") {
    viewCustomCells.value = { ...snap.customCells };
  } else {
    viewCustomCells.value = {};
  }

  if (Array.isArray(snap.mergeGroups)) {
    viewMergeGroups.value = snap.mergeGroups.map((g: any) => ({
      start: Number(g.start) || 0,
      size: Number(g.size) || 1,
      text: String(g.text ?? "—"),
    }));
  } else {
    viewMergeGroups.value = [];
  }

  if (Array.isArray(snap.items) && snap.items.length > 0) {
    viewItems.value = snap.items.map((it: any) => ({
      itemId: Number(it.itemId),
      code: it.code || "",
      name: it.name || "",
      quantity: Number(it.quantity) || 1,
      remark: it.remark || "",
      selectedUom: it.selectedUom || "base",
      _baseUom: it.isBaseUom ? it.uomCode : it.uomCode || "N/A",
      _convUom: it.isBaseUom ? "N/A" : it.uomCode,
      specification: it.specification || "",
      brand: it.brand || "",
      model: it.model || "",
    }));
  }
};

const loadViewSnapshot = async (req: ItemRequest) => {
  viewHeader.value = DEFAULT_VIEW_HEADER;
  viewDepartment.value = "";
  viewApprovedByName.value = "";
  viewColumns.value = buildDefaultViewColumns();
  viewCustomCells.value = {};
  viewMergeGroups.value = [];
  viewSectionVisibility.value = {
    department: true,
    reason: true,
    comment: true,
    checkedBy: true,
  };

  const id = req.requestId || req.id;
  if (!id) {
    viewItems.value = [];
    return;
  }

  try {
    const res = await itemRequestService.getRequestById(id);
    if (res?.success && res.data) {
      const snap = (res.data as any).printOverride?.pageSnapshot ?? null;
      if (snap) {
        restoreViewFromSnapshot(snap);
        return;
      }
    }
  } catch (err) {
    console.warn("Could not load snapshot, falling back to raw items", err);
  }

  viewItems.value = (req.items || []).map((it: any) => ({
    itemId: Number(it.itemId || it.id || 0),
    code: it.item?.code || it.itemCode || it.code || "N/A",
    name: it.item?.name || it.itemName || it.name || "Unknown",
    quantity: Number(it.quantity) || 1,
    remark: it.remark || "",
    selectedUom: it.selected_uom || "base",
    _baseUom: it.uom_code || it.item?.uom?.code || "N/A",
    _convUom:
      it.conversion_uom_code || it.item?.conversionUom?.code || "N/A",
    specification: it.specification || it.item?.specText || "",
    brand: it.brand || it.item?.brand || "",
    model: it.model || it.item?.model || "",
  }));
};

// ================================================================
// NAVIGATION
// ================================================================
const openCreateModal = (): void => {
  if (!canCreateRequests.value) {
    showToastMessage(
      "You need an assigned store to create requests",
      "error",
    );
    return;
  }
  router.push({ name: "item-request-create" });
};

const editRequest = (req: ItemRequest): void => {
  if (!canManageThisRequest(req)) {
    showToastMessage(
      "Only the request creator can edit this request",
      "error",
    );
    return;
  }
  const id = req.requestId || req.id;
  if (!id) {
    showToastMessage("Cannot edit: missing request ID", "error");
    return;
  }
  router.push({ name: "item-request-edit", params: { id: String(id) } });
};

// ================================================================
// STATUS CONFIRMATION
// ================================================================
const openStatusConfirmation = (
  req: ItemRequest,
  action: "approved" | "finalized",
): void => {
  if (!canManageThisRequest(req)) {
    showToastMessage("Only the request creator can change status", "error");
    return;
  }
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
    const response = await itemRequestService.updateStatus(
      requestId!,
      action,
    );
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

// ================================================================
// ✅ NEW: DELETE REQUEST
// ================================================================
const openDeleteRequestModal = (req: ItemRequest): void => {
  if (!canDeleteRequest(req)) {
    showToastMessage("Cannot delete this request", "error");
    return;
  }
  deleteTarget.value = req;
  showDeleteRequestModal.value = true;
};

const closeDeleteRequestModal = (): void => {
  showDeleteRequestModal.value = false;
  deleteTarget.value = null;
};

const confirmDeleteRequest = async (): Promise<void> => {
  if (!deleteTarget.value) return;
  const id = deleteTarget.value.requestId || deleteTarget.value.id;
  if (!id) {
    showToastMessage("Cannot delete: missing request ID", "error");
    return;
  }
  try {
    const response = await itemRequestService.deleteRequest(id);
    if (response.success) {
      showToastMessage("Request deleted successfully", "success");
      await loadRequests();
      closeDeleteRequestModal();
    } else {
      showToastMessage(response.error || "Failed to delete request", "error");
    }
  } catch (error: any) {
    showToastMessage(error.message || "Failed to delete request", "error");
  }
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
      status:
        filterStatus.value === "all"
          ? undefined
          : (filterStatus.value as any),
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
  if (newPage !== oldPage) loadRequests();
});
watch(pageSize, () => {
  currentPage.value = 1;
  loadRequests();
});
watch(
  () => route.query.refresh,
  (val) => {
    if (val) loadRequests();
  },
);

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
   ORIGINAL STYLES
   ================================================================ */

/* Temelash marker */
.temelash-badge {
  display: inline-block;
  background: #ffedd5;
  color: #9a3412;
  border: 1px solid #fed7aa;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 10px;
  margin-top: 2px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.uom-display {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.uom-badge {
  font-size: 8px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 8px;
  text-transform: uppercase;
}

.uom-badge.base { background: #d1fae5; color: #065f46; }
.uom-badge.conversion { background: #ede9fe; color: #5b21b6; }

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
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.notification-dot.pending { background: #f59e0b; }
.notification-dot.accepted { background: #10b981; }
.notification-dot.rejected { background: #ef4444; }
.notification-dot.group-dot { border-radius: 50%; }
.notification-dot.dept-dot {
  border-radius: 2px;
  transform: rotate(45deg);
  width: 8px;
  height: 8px;
  margin: 1px;
}
.notification-dot.asking-dot { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
.notification-dot.supplying-dot { box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3); }

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
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.search-box { position: relative; }
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
.btn-add:hover { background: #2563eb; }

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
.btn-clear-filters:hover { background: #e2e8f0; }
.filter-actions { display: flex; gap: 8px; margin-left: auto; }
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
.btn-export:hover { background: #059669; }

.loading-state { text-align: center; padding: 60px 20px; }
.spinner {
  border: 4px solid #f1f5f9;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

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
.col-store { min-width: 120px; }
.col-arrow { width: 30px; text-align: center; }
.col-status { min-width: 90px; }
.col-actions { min-width: 200px; }
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
.items-summary { display: flex; flex-direction: column; gap: 2px; }
.item-count { font-weight: 500; color: #1e293b; }
.item-names {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}
.store-name { font-weight: 500; color: #1e293b; }
.arrow-cell { text-align: center; color: #94a3b8; font-size: 14px; padding: 0 4px; }

.status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.approved { background: #dbeafe; color: #1e40af; }
.status-badge.rejected { background: #fee2e2; color: #991b1b; }
.status-badge.finalized { background: #dcfce7; color: #166534; }

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
.action-buttons { display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }
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
.icon-btn:hover { background: #f1f5f9; color: #0f172a; }
.icon-btn:active { transform: scale(0.95); }
.print-btn { color: #8b5cf6; }
.print-btn:hover { background: #ede9fe; color: #7c3aed; }
.delete-btn { color: #ef4444; }
.delete-btn:hover { background: #fee2e2; color: #dc2626; }

.detail-expand-row td { padding: 0 !important; }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { font-size: 48px; opacity: 0.5; }
.empty-state p { color: #94a3b8; font-size: 16px; margin: 0; }
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
.btn-secondary:hover { background: #e2e8f0; }

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
.modal-close:hover { background: #f1f5f9; color: #0f172a; }
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
.status-modal { max-width: 450px; }
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
.detail-row:last-child { border-bottom: none; }
.detail-label { font-weight: 500; color: #64748b; font-size: 13px; }
.detail-value { color: #1e293b; font-weight: 500; font-size: 13px; }
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
.export-options { display: flex; flex-direction: column; gap: 12px; }
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
.export-option:hover { border-color: #94a3b8; background: #f8fafc; }
.export-option input[type="radio"] {
  accent-color: #3b82f6;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ✅ NEW: Delete modal styles */
.delete-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}
.delete-warning {
  color: #dc2626;
  font-weight: 600;
  text-align: center;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 13px;
}
.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-danger:hover {
  background: #dc2626;
}

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

@media (max-width: 1024px) {
  .requests-table { min-width: 800px; }
}
@media (max-width: 768px) {
  .section-card { padding: 12px; }
  .card-header { flex-direction: column; align-items: stretch; }
  .header-title { justify-content: space-between; width: 100%; }
  .header-actions { flex-direction: column; width: 100%; }
  .search-box { width: 100%; }
  .search-box input { width: 100%; }
  .btn-add { width: 100%; justify-content: center; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-actions { margin-left: 0; }
  .modal-container { width: 98%; max-height: 95vh; }
  .modal-body { padding: 16px; }
  .requests-table { font-size: 11px; min-width: 700px; }
  .requests-table th,
  .requests-table td { padding: 6px 8px; }
  .pagination { gap: 8px; }
  .page-btn { padding: 4px 12px; font-size: 12px; }
  .toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    font-size: 13px;
    padding: 10px 16px;
  }
  .col-actions { min-width: 180px; }
  .view-paper { padding: 12px; }
  .paper-company { font-size: 16px; }
  .paper-motto { font-size: 14px; }
  .paper-subtitle { font-size: 13px; }
  .paper-items-table { font-size: 11px; }
  .paper-items-table th,
  .paper-items-table td { padding: 6px 4px; height: 30px; }
  .paper-meta-grid { flex-direction: column; gap: 12px; }
  .paper-short-width { width: 100% !important; }
  .paper-checked-by { width: 100% !important; }
}
@media (max-width: 480px) {
  .requests-table { min-width: 600px; }
  .requests-table th,
  .requests-table td { padding: 4px 6px; font-size: 10px; }
  .status-badge { padding: 2px 8px; font-size: 9px; }
  .icon-btn { padding: 3px 4px; font-size: 11px; }
  .modal-header h3 { font-size: 16px; }
  .col-code { min-width: 80px; }
  .col-items { min-width: 100px; }
  .col-store { min-width: 80px; }
  .col-actions { min-width: 160px; }
}

/* ================================================================
   🔥 INLINE PAPER VIEW — create page look, read-only
   ================================================================ */
.view-paper {
  font-family: "Arial", sans-serif;
  color: #000;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin: 8px 0;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
}

/* Header */
.paper-header { margin-bottom: 5px; }
.paper-motto {
  text-align: center;
  font-family: Georgia, serif;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0 0 4px 0;
}
.paper-company {
  text-align: center;
  font-size: 21px;
  font-weight: 800;
  margin: 0 0 8px 0;
}
.paper-subtitle {
  text-align: center;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 0 0 15px 0;
  color: #1a1a1a;
  border-radius: 6px;
  padding: 6px 10px;
}
.paper-date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 6px;
  padding: 8px 0;
  border-top: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
}
.paper-date-field { display: inline-flex; align-items: center; gap: 6px; }
.paper-date-display {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
}

/* Items table */
.paper-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 25px;
  font-family: "Segoe UI", Tahoma, Verdana, sans-serif;
  font-size: 15px;
  table-layout: fixed;
}
.paper-items-table th,
.paper-items-table td {
  border: 1px solid #7f7f7f;
  padding: 10px 6px;
  text-align: center;
  height: 36px;
  word-wrap: break-word;
  vertical-align: middle;
}
.paper-items-table th {
  background-color: #c8c8c8;
  font-weight: 800;
  font-size: 16.5px;
  letter-spacing: 0.4px;
  padding: 12px 6px;
}
.paper-items-table td.text-left { text-align: left; padding-left: 8px; }
.paper-items-table .font-bold { font-weight: 700; }
.paper-items-table .no-items {
  padding: 20px !important;
  color: #7f7f7f;
  font-style: italic;
}
.paper-items-table .spec-cell { font-size: 14.5px; line-height: 1.4; }

.paper-row-number {
  padding: 4px !important;
  width: 44px;
  font-weight: 700;
  color: #0f172a;
  font-size: 14px;
}

.paper-remark-cell {
  padding: 8px !important;
  font-size: 14.5px;
  line-height: 1.4;
  vertical-align: middle;
  word-break: break-word;
}
.paper-remark-cell.merged {
  background: #fff;
  vertical-align: middle !important;
  border-top: none !important;
  border-bottom: none !important;
}
.merged-remark-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px;
  min-height: 100%;
  text-align: center;
}
.merged-remark-text {
  font-size: 14.5px;
  line-height: 1.4;
  color: #000;
  text-align: center;
}
.row-merged-absorbed td { background: #fafafa; }

.paper-grand-total-row td {
  background: #e5e7eb !important;
  font-weight: 800;
  border-color: #7f7f7f !important;
  height: 40px;
}
.paper-grand-total-label,
.paper-grand-total-value,
.paper-grand-total-spacer { background: #e5e7eb !important; }
.paper-grand-total-label {
  text-align: center !important;
  font-weight: 900;
  letter-spacing: 0.6px;
  color: #111827;
  font-size: 15px;
}
.paper-grand-total-amount {
  font-weight: 900;
  font-size: 16px;
  color: #111827;
}

/* Meta grid */
.paper-meta-grid {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 25px;
}
.paper-meta-col { flex: 1; }
.paper-block-header {
  background-color: #d9d9d9;
  border: none;
  padding: 5px;
  font-weight: bold;
  font-size: 14px;
  text-align: center;
}
.paper-block-body {
  padding: 12px 4px;
  font-size: 13px;
  min-height: 80px;
  border: none;
}
.paper-dept-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
}
.paper-dept-value { font-size: 20px; font-weight: 600; text-align: center; }
.paper-workflow-body p {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 6px 0;
  flex-wrap: nowrap;
}
.paper-inline {
  display: inline-block;
  flex: 1;
  min-width: 100px;
  padding: 2px 6px;
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

/* Footer */
.paper-footer-sections { display: flex; flex-direction: column; gap: 15px; }
.paper-input-row {
  display: flex;
  width: 100%;
  border: 1px solid #7f7f7f;
  border-radius: 6px;
  overflow: hidden;
}
.paper-input-row.paper-short-width { width: 65%; }
.paper-gray-label {
  background-color: #d9d9d9;
  color: #000;
  font-weight: bold;
  width: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  min-height: 46px;
  padding: 10px 12px;
  text-align: center;
  flex-shrink: 0;
}
.paper-lines-container {
  flex-grow: 1;
  background-color: #fff;
  min-height: 46px;
}
.paper-reason-readonly {
  font-size: 13px;
  padding: 10px 12px;
  line-height: 1.5;
  min-height: 46px;
  box-sizing: border-box;
  color: #1e293b;
}
.paper-write-line {
  height: 22px;
  border-bottom: 1px solid #7f7f7f;
  background: #fff;
}
.paper-write-line:last-child { border-bottom: none; background: #f9f9f9; }

.paper-checked-by {
  display: flex;
  border: 1px solid #7f7f7f;
  border-radius: 6px;
  overflow: hidden;
  width: 65%;
}
.paper-gray-label.paper-inline-label { width: 220px; }
.paper-checked-body {
  flex: 1;
  padding: 12px 16px;
  background: #fff;
}
.paper-checked-body p {
  margin: 8px 0;
  font-size: 13px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
</style>