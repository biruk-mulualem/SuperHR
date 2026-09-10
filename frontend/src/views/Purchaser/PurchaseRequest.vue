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
                          <span>Total Quantity</span
                          ><span class="value">{{ getTotalQuantity(req.items) }}</span>
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

          <p class="warning-text approve-text">
            ✅ This will approve the request and dispatch it to the purchasing groups.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStatusModal">Cancel</button>
          <button class="btn-primary" @click="confirmStatusChange">
            Confirm Approval
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

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import CreatePurchaseRequestModal from "./components/CreatePurchaseRequestModal.vue";

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

// ================================================================
// DEMO DATA
// ================================================================

const requests = ref<PurchaseRequest[]>([
  {
    id: 1,
    prNumber: "PR-2026-001",
    department: "Production",
    expertName: "Alemayehu Tesfaye",
    preparedBy: "Fantabil W.",
    requestedDate: "2026-09-01",
    priority: "high",
    status: "draft",
    items: [
      { id: 1, name: "Homopolymer Glue", code: "SDT000004", brand: "Sherwin-Williams", model: "SW-2000", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 50, specification: "High grade industrial glue for woodworking", remark: "Need before 20th" },
      { id: 2, name: "Lacquer Thinner", code: "SDT000001", brand: "Sherwin-Williams", model: "SW-THIN", uom: "DRUM", baseUom: "DRUM", conversionUom: "LTR", quantity: 30, specification: "Premium quality thinner for lacquer paints", remark: "For painting department" },
      { id: 3, name: "Short Oil Alkyd", code: "SDT000008", brand: "BASF", model: "BASF-ALK-1", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 20, specification: "Short oil alkyd resin for industrial coatings", remark: "For export order" }
    ],
    createdAt: "2026-09-01T08:30:00.000Z",
    updatedAt: "2026-09-01T08:30:00.000Z"
  },
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
    updatedAt: "2026-09-04T14:20:00.000Z"
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
    updatedAt: "2026-09-06T16:30:00.000Z"
  },
  {
    id: 4,
    prNumber: "PR-2026-004",
    department: "Maintenance",
    expertName: "Dawit Eshetu",
    preparedBy: "Eyerus T.",
    requestedDate: "2026-09-06",
    priority: "low",
    status: "draft",
    items: [
      { id: 7, name: "Slitting Machine", code: "SDT000081", brand: "Global Machinery", model: "GM-SL-500", uom: "SET", baseUom: "SET", conversionUom: "", quantity: 2, specification: "Automatic slitting machine for roll processing", remark: "Needs training" },
      { id: 8, name: "Seam Welding Machine", code: "SDT000083", brand: "Global Machinery", model: "GM-SW-200", uom: "SET", baseUom: "SET", conversionUom: "", quantity: 1, specification: "Industrial seam welding machine", remark: "Spare parts required" }
    ],
    createdAt: "2026-09-06T11:20:00.000Z",
    updatedAt: "2026-09-06T11:20:00.000Z"
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
      { id: 9, name: "Lacquer Thinner", code: "SDT000001", brand: "Sherwin-Williams", model: "SW-THIN", uom: "DRUM", baseUom: "DRUM", conversionUom: "LTR", quantity: 25, specification: "Premium quality thinner", remark: "Approved" }
    ],
    createdAt: "2026-09-08T13:45:00.000Z",
    updatedAt: "2026-09-09T09:00:00.000Z"
  }
]);

// ================================================================
// COMPUTED
// ================================================================

const filteredRequests = computed(() => {
  let result = requests.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(req =>
      req.prNumber.toLowerCase().includes(query) ||
      req.department?.toLowerCase().includes(query) ||
      req.expertName?.toLowerCase().includes(query) ||
      req.preparedBy?.toLowerCase().includes(query) ||
      req.items.some(item => item.name.toLowerCase().includes(query))
    );
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(req => req.status === filterStatus.value);
  }

  if (filterPriority.value !== 'all') {
    result = result.filter(req => req.priority === filterPriority.value);
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
  return filterStatus.value !== 'all' ||
         filterPriority.value !== 'all' ||
         searchQuery.value;
});

// ================================================================
// METHODS
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

const toggleExpand = (id: number): void => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const onSearchChange = (): void => {
  currentPage.value = 1;
};

const onFilterChange = (): void => {
  currentPage.value = 1;
};

const clearFilters = (): void => {
  filterStatus.value = 'all';
  filterPriority.value = 'all';
  searchQuery.value = '';
  currentPage.value = 1;
  showToastMessage("Filters cleared", "info");
};

const changePage = (page: number): void => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

const changePageSize = (): void => {
  currentPage.value = 1;
};

const openCreateModal = (): void => {
  editingRequestData.value = null;
  showCreateModal.value = true;
};

const editRequest = (req: PurchaseRequest): void => {
  if (req.status !== 'draft') {
    showToastMessage("Only draft requests can be edited", "error");
    return;
  }
  editingRequestData.value = req;
  showCreateModal.value = true;
};

const handleModalSaved = (): void => {
  showToastMessage("Purchase request saved successfully!", "success");
  totalItems.value = requests.value.length;
};

/**
 * ✅ Print: Available for both Draft and Approved
 */
const printRequest = (req: PurchaseRequest): void => {
  router.push({
    name: 'print-purchase-request',
    query: { id: String(req.id) }
  });
};

// ================================================================
// APPROVAL
// ================================================================

const openStatusConfirmation = (req: PurchaseRequest): void => {
  statusTarget.value = req;
  showStatusModal.value = true;
};

const closeStatusModal = (): void => {
  showStatusModal.value = false;
  statusTarget.value = null;
};

const confirmStatusChange = (): void => {
  if (!statusTarget.value) return;

  const req = statusTarget.value;

  req.status = 'approved';
  req.updatedAt = new Date().toISOString();

  showToastMessage(`✅ ${req.prNumber} approved and dispatched to purchasing groups!`, "success");

  closeStatusModal();
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
  max-width: 450px;
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
}

.btn-primary:hover {
  background: #2563eb;
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
}
</style>