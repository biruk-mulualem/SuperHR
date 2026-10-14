<!-- views/storemanagement/temelash/temelash.vue -->
<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>🔄 Temelash Records</h2>
        <span class="total-badge">{{ totalRecords }} Records</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by request code..."
            @input="onSearchChange"
          />
        </div>
      </div>
    </div>

    <!-- ==================== SUMMARY CARDS ==================== -->
    <div class="summary-cards">
      <div class="summary-card total">
        <span class="summary-icon">📦</span>
        <div class="summary-body">
          <span class="summary-label">Total</span>
          <span class="summary-value">{{ summary.total }}</span>
        </div>
      </div>
      <div class="summary-card out">
        <span class="summary-icon">🔄</span>
        <div class="summary-body">
          <span class="summary-label">Out</span>
          <span class="summary-value">{{ summary.out }}</span>
        </div>
      </div>
      <div class="summary-card overdue">
        <span class="summary-icon">🔴</span>
        <div class="summary-body">
          <span class="summary-label">Overdue</span>
          <span class="summary-value">{{ summary.overdue }}</span>
        </div>
      </div>
      <div class="summary-card returned">
        <span class="summary-icon">✅</span>
        <div class="summary-body">
          <span class="summary-label">Returned</span>
          <span class="summary-value">{{ summary.returned }}</span>
        </div>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="all">All Status</option>
        <option value="out">Out</option>
        <option value="returned">Returned</option>
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
        v-if="hasActiveFilters"
        class="btn-clear-filters"
        @click="clearFilters"
      >
        ✕ Clear Filters
      </button>
    </div>

    <!-- ==================== LOADING ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading temelash records...</p>
    </div>

    <!-- ==================== TABLE ==================== -->
    <div v-else class="table-wrapper">
      <table class="temelash-table">
        <thead>
          <tr>
            <th class="col-expand"></th>
            <th class="col-code">Request Code</th>
            <th class="col-items">Items</th>
            <th class="col-store">Asking Store</th>
            <th class="col-arrow"></th>
            <th class="col-store">Supplying Store</th>
            <th class="col-window">Temelash Window</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="records.length === 0">
            <td colspan="9" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">🔄</span>
                <p>No temelash records found</p>
              </div>
            </td>
          </tr>

          <template v-for="rec in records" :key="rec.id">
            <tr :class="{ 'expanded-row': expandedRow === rec.id }">
              <td class="text-center">
                <button class="expand-btn" @click="toggleExpand(rec.id)">
                  {{ expandedRow === rec.id ? "▼" : "▶" }}
                </button>
              </td>

              <td class="code-cell">{{ rec.requestCode }}</td>

              <td>
                <div class="items-summary">
                  <span class="item-count">{{ rec.items?.length || 0 }} item(s)</span>
                  <span class="item-names">{{ getItemNames(rec.items) }}</span>
                </div>
              </td>

              <td class="store-name">
                {{ rec.askingStore?.name || getStoreName(rec.askingStoreId) }}
              </td>

              <td class="arrow-cell">➡️</td>

              <td class="store-name">
                {{ rec.supplyingStore?.name || getStoreName(rec.supplyingStoreId) }}
              </td>

              <td class="window-cell">
                <div class="window-display">
                  <span class="window-dates">
                    {{ temelashService.formatLoanWindow(rec) }}
                  </span>
                  <span
                    v-if="rec.status === 'out'"
                    :class="['days-badge', dueBadgeClass(rec)]"
                  >
                    {{ dueBadgeText(rec) }}
                  </span>
                </div>
              </td>

              <td>
                <span :class="['status-badge', statusClass(rec)]">
                  {{ temelashService.getStatusIcon(rec) }}
                  {{ temelashService.getStatusLabel(rec) }}
                </span>
                <div v-if="rec.status === 'returned' && rec.returnedByUser" class="returned-by">
                  by {{ rec.returnedByUser.fullName || rec.returnedByUser.username }}
                </div>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                    v-if="rec.status === 'out'"
                    class="icon-btn return-btn"
                    @click="openReturnModal(rec)"
                    title="Mark as returned"
                  >
                    ↩️
                  </button>
                  <button
                    v-if="rec.status === 'out'"
                    class="icon-btn"
                    @click="openEditModal(rec)"
                    title="Edit temelash window"
                  >
                    ✏️
                  </button>
                </div>
              </td>
            </tr>

            <!-- ==================== EXPANDED ROW ==================== -->
            <tr v-if="expandedRow === rec.id" class="detail-expand-row">
              <td colspan="9">
                <div class="expand-details">
                  <div class="detail-container">
                    <!-- Info + Store cards -->
                    <div class="detail-row-two-cols">
                      <div class="detail-card">
                        <h4>📋 Temelash Information</h4>
                        <div>
                          <span>Request Code</span>
                          <span class="value">{{ rec.requestCode }}</span>
                        </div>
                        <div>
                          <span>Status</span>
                          <span class="value">
                            <span :class="['status-badge', statusClass(rec)]">
                              {{ temelashService.getStatusLabel(rec) }}
                            </span>
                          </span>
                        </div>
                        <div>
                          <span>Requested By</span>
                          <span class="value">{{ getRequesterName(rec) }}</span>
                        </div>
                        <div>
                          <span>Issued At</span>
                          <span class="value">{{ formatDateTime(rec.issuedAt) }}</span>
                        </div>
                        <div v-if="rec.status === 'returned'">
                          <span>Returned At</span>
                          <span class="value">{{ formatDateTime(rec.returnedAt) }}</span>
                        </div>
                        <div v-if="rec.status === 'returned' && rec.returnedByUser">
                          <span>Returned By</span>
                          <span class="value">
                            {{ rec.returnedByUser.fullName || rec.returnedByUser.username }}
                          </span>
                        </div>
                        <div v-if="rec.returnedLate">
                          <span>Late Return</span>
                          <span class="value late-yes">⚠️ Yes</span>
                        </div>
                      </div>

                      <div class="detail-card">
                        <h4>🏪 Store Details</h4>
                        <div>
                          <span>Asking Store</span>
                          <span class="value">{{ rec.askingStore?.name || "—" }}</span>
                        </div>
                        <div>
                          <span>Asking Store Code</span>
                          <span class="value">{{ rec.askingStore?.code || "—" }}</span>
                        </div>
                        <div>
                          <span>Supplying Store</span>
                          <span class="value">{{ rec.supplyingStore?.name || "—" }}</span>
                        </div>
                        <div>
                          <span>Supplying Store Code</span>
                          <span class="value">{{ rec.supplyingStore?.code || "—" }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Temelash Window Highlight -->
                    <div class="detail-card full-width window-highlight">
                      <h4>📅 Temelash Window</h4>
                      <div class="window-display-large">
                        <div class="window-side">
                          <span class="window-label">From</span>
                          <span class="window-value">{{ formatDate(rec.fromDate) }}</span>
                        </div>
                        <div class="window-arrow">→</div>
                        <div class="window-side">
                          <span class="window-label">To</span>
                          <span class="window-value">{{ formatDate(rec.toDate) }}</span>
                        </div>
                        <div v-if="rec.status === 'out'" class="window-remaining">
                          <span :class="['days-badge-large', dueBadgeClass(rec)]">
                            {{ dueBadgeText(rec) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Items -->
                    <div class="detail-card full-width">
                      <h4>📦 Items</h4>
                      <table class="items-detail-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Item Name</th>
                            <th>Item Code</th>
                            <th>UOM</th>
                            <th>Quantity</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Specification</th>
                            <th>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(item, index) in rec.items" :key="index">
                            <td class="text-center">{{ index + 1 }}</td>
                            <td>{{ item.name || "—" }}</td>
                            <td>{{ item.code || "—" }}</td>
                            <td>{{ item.uom || "—" }}</td>
                            <td class="text-center">{{ Number(item.quantity).toFixed(2) }}</td>
                            <td>{{ item.brand || "—" }}</td>
                            <td>{{ item.model || "—" }}</td>
                            <td class="spec-cell">{{ item.specification || "—" }}</td>
                            <td>{{ item.remark || "—" }}</td>
                          </tr>
                          <tr class="total-row">
                            <td colspan="4" class="text-right"><strong>Total Items:</strong></td>
                            <td class="text-center"><strong>{{ rec.items?.length || 0 }}</strong></td>
                            <td colspan="4"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- General Remark -->
                    <div class="detail-card full-width">
                      <h4>📝 General Remark</h4>
                      <div v-if="rec.remark" class="remark-content">{{ rec.remark }}</div>
                      <div v-else class="no-remark">No remarks provided</div>
                    </div>

                    <!-- Return Remark -->
                    <div v-if="rec.status === 'returned' && rec.returnRemark" class="detail-card full-width return-remark-card">
                      <h4>↩️ Return Remark</h4>
                      <div class="remark-content">{{ rec.returnRemark }}</div>
                    </div>

                    <!-- Actions -->
                    <div class="detail-actions">
                      <button
                        v-if="rec.status === 'out'"
                        class="btn-return-detail"
                        @click="openReturnModal(rec)"
                      >
                        ↩️ Mark as Returned
                      </button>
                      <button
                        v-if="rec.status === 'out'"
                        class="btn-edit-detail"
                        @click="openEditModal(rec)"
                      >
                        ✏️ Edit Temelash Window
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
    <div class="pagination" v-if="totalRecords > 0">
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

    <!-- ==================== RETURN MODAL ==================== -->
    <div v-if="showReturnModal" class="modal-overlay" @click.self="closeReturnModal">
      <div class="modal-container status-modal">
        <div class="modal-header">
          <h3>↩️ Mark as Returned</h3>
          <button class="modal-close" @click="closeReturnModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-icon">↩️</div>
          <p class="confirmation-title">
            Are you sure you want to mark this record as returned?
          </p>
          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Request:</span>
              <span class="detail-value">{{ returnTarget?.requestCode }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Items:</span>
              <span class="detail-value">{{ returnTarget?.items?.length || 0 }} item(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Temelash Window:</span>
              <span class="detail-value">{{ temelashService.formatLoanWindow(returnTarget) }}</span>
            </div>
            <div v-if="returnTarget && temelashService.isOverdue(returnTarget)" class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value late-warning">⚠️ Currently Overdue</span>
            </div>
          </div>

          <div class="form-group">
            <label>Return Remark (optional)</label>
            <textarea
              v-model="returnRemark"
              rows="3"
              placeholder="e.g. Items returned in good condition"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeReturnModal">Cancel</button>
          <button class="btn-primary" @click="confirmReturn" :disabled="submitting">
            {{ submitting ? "Processing..." : "Confirm Return" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== EDIT MODAL ==================== -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-container edit-modal">
        <div class="modal-header">
          <h3>✏️ Edit Temelash Window</h3>
          <button class="modal-close" @click="closeEditModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="edit-subtitle">
            Update the temelash window for
            <strong>{{ editTarget?.requestCode }}</strong>
          </p>

          <div class="form-row">
            <div class="form-group">
              <label>From Date</label>
              <input type="date" v-model="editFromDate" />
            </div>
            <div class="form-group">
              <label>To Date</label>
              <input type="date" v-model="editToDate" />
            </div>
          </div>

          <div class="form-group">
            <label>Remark (optional)</label>
            <textarea
              v-model="editRemark"
              rows="2"
              placeholder="Optional note about this temelash"
            ></textarea>
          </div>

          <p v-if="editError" class="edit-error">⚠️ {{ editError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeEditModal">Cancel</button>
          <button class="btn-primary" @click="confirmEdit" :disabled="submitting">
            {{ submitting ? "Saving..." : "Save Changes" }}
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
import { useAuthStore } from "@/stores/auth";
import temelashService from "@/stores/temelashService";
import type { TemelashRecord, TemelashSummary } from "@/stores/temelashService";
import itemRequestService from "@/stores/itemRequestService";
import type { Store } from "@/stores/itemRequestService";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// ================================================================
// STATE
// ================================================================

const authStore = useAuthStore();

const records = ref<TemelashRecord[]>([]);
const summary = ref<TemelashSummary>({
  total: 0,
  out: 0,
  returned: 0,
  overdue: 0,
});
const stores = ref<Store[]>([]);
const loading = ref(false);

const userIsAdmin = ref(false);
const currentUserId = ref<number | null>(null);

const searchQuery = ref("");
const filterStatus = ref<"all" | "out" | "returned">("all");
const filterStore = ref("all");
const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);

const expandedRow = ref<number | null>(null);

const showReturnModal = ref(false);
const returnTarget = ref<TemelashRecord | null>(null);
const returnRemark = ref("");

const showEditModal = ref(false);
const editTarget = ref<TemelashRecord | null>(null);
const editFromDate = ref("");
const editToDate = ref("");
const editRemark = ref("");
const editError = ref("");

const submitting = ref(false);

const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info" | "warning">("success");

// ================================================================
// COMPUTED
// ================================================================

const activeStores = computed(() =>
  stores.value.filter((s) => s.status === "Active"),
);

const hasActiveFilters = computed(
  () =>
    filterStatus.value !== "all" ||
    filterStore.value !== "all" ||
    searchQuery.value.trim() !== "",
);

const totalPages = computed(
  () => Math.ceil(totalRecords.value / pageSize.value) || 1,
);

// ================================================================
// LOAD
// ================================================================

const loadUser = () => {
  const user = authStore.user as any;
  if (!user) return;
  userIsAdmin.value =
    user.isAdmin === true || user.role === "admin" || user.role === "Admin";
  currentUserId.value = user.userId || user.id || null;
};

const loadStores = async () => {
  const res = await itemRequestService.getActiveStores();
  if (res.success) stores.value = res.data;
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
      status: filterStatus.value,
    };
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (filterStore.value !== "all") params.storeId = Number(filterStore.value);

    const res = await temelashService.getTemelashRecords(params);
    if (res.success && res.data) {
      records.value = res.data.records;
      summary.value = res.data.summary;
      totalRecords.value = res.data.pagination.total;
    } else {
      showToastMessage(res.error || "Failed to load records", "error");
    }
  } catch (err: any) {
    showToastMessage(err.message || "Failed to load records", "error");
  } finally {
    loading.value = false;
  }
};

// ================================================================
// HELPERS
// ================================================================

const getItemNames = (items: any[] | undefined): string => {
  if (!items || items.length === 0) return "";
  return items.map((i) => i.name || "Unknown").join(", ");
};

const getStoreName = (storeId: number): string => {
  const s = stores.value.find((st) => (st.storeId || st.id) === storeId);
  return s ? s.name : `Store #${storeId}`;
};

const getRequesterName = (rec: TemelashRecord): string => {
  if (rec.requestedByUser) {
    return (
      rec.requestedByUser.fullName ||
      rec.requestedByUser.full_name ||
      rec.requestedByUser.username ||
      "N/A"
    );
  }
  return rec.requestedBy || "N/A";
};

const formatDate = (d?: string | null): string => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (d?: string | null): string => {
  if (!d) return "—";
  const dt = dayjs.utc(d);
  if (!dt.isValid()) return "—";
  return dt.format("MMM D, YYYY h:mm A");
};

const statusClass = (rec: TemelashRecord): string => {
  if (rec.status === "returned") {
    return rec.returnedLate ? "returned-late" : "returned";
  }
  return temelashService.isOverdue(rec) ? "overdue" : "out";
};

const dueBadgeText = (rec: TemelashRecord): string => {
  const days = temelashService.daysUntilDue(rec);
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)} day(s) overdue`;
  if (days === 0) return "Due today";
  return `${days} day(s) left`;
};

const dueBadgeClass = (rec: TemelashRecord): string => {
  const days = temelashService.daysUntilDue(rec);
  if (days === null) return "neutral";
  if (days < 0) return "danger";
  if (days <= 2) return "warning";
  return "success";
};

// ================================================================
// EXPAND
// ================================================================

const toggleExpand = (id: number) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

// ================================================================
// RETURN
// ================================================================

const openReturnModal = (rec: TemelashRecord) => {
  returnTarget.value = rec;
  returnRemark.value = "";
  showReturnModal.value = true;
};

const closeReturnModal = () => {
  showReturnModal.value = false;
  returnTarget.value = null;
  returnRemark.value = "";
};

const confirmReturn = async () => {
  if (!returnTarget.value) return;
  submitting.value = true;
  try {
    const res = await temelashService.returnTemelash(
      returnTarget.value.id,
      returnRemark.value.trim() || undefined,
    );
    if (res.success) {
      showToastMessage(res.message || "Marked as returned", "success");
      closeReturnModal();
      await loadRecords();
    } else {
      showToastMessage(res.error || "Failed to return", "error");
    }
  } finally {
    submitting.value = false;
  }
};

// ================================================================
// EDIT
// ================================================================

const openEditModal = (rec: TemelashRecord) => {
  editTarget.value = rec;
  editFromDate.value = rec.fromDate ? rec.fromDate.substring(0, 10) : "";
  editToDate.value = rec.toDate ? rec.toDate.substring(0, 10) : "";
  editRemark.value = rec.remark || "";
  editError.value = "";
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editTarget.value = null;
  editError.value = "";
};

const confirmEdit = async () => {
  if (!editTarget.value) return;

  if (editFromDate.value && editToDate.value && editToDate.value < editFromDate.value) {
    editError.value = "'To' date must be on or after 'From' date";
    return;
  }

  submitting.value = true;
  editError.value = "";
  try {
    const res = await temelashService.updateTemelash(editTarget.value.id, {
      fromDate: editFromDate.value || null,
      toDate: editToDate.value || null,
      remark: editRemark.value.trim() || null,
    });
    if (res.success) {
      showToastMessage("Temelash window updated", "success");
      closeEditModal();
      await loadRecords();
    } else {
      editError.value = res.error || "Failed to update";
    }
  } finally {
    submitting.value = false;
  }
};

// ================================================================
// FILTERS & PAGINATION
// ================================================================

const onSearchChange = () => {
  currentPage.value = 1;
  loadRecords();
};

const onFilterChange = () => {
  currentPage.value = 1;
  loadRecords();
};

const clearFilters = () => {
  filterStatus.value = "all";
  filterStore.value = "all";
  searchQuery.value = "";
  currentPage.value = 1;
  loadRecords();
};

const changePage = (p: number) => {
  if (p < 1 || p > totalPages.value) return;
  currentPage.value = p;
};

const changePageSize = () => {
  currentPage.value = 1;
  loadRecords();
};

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (
  msg: string,
  type: "success" | "error" | "info" | "warning" = "success",
) => {
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

watch(currentPage, (n, o) => {
  if (n !== o) loadRecords();
});

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  loadUser();
  await Promise.all([loadStores(), loadRecords()]);
});
</script>

<style scoped>
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
  width: 240px;
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
  font-size: 12px;
  color: #94a3b8;
}

/* ================================================================
   SUMMARY CARDS
   ================================================================ */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.summary-card.total { background: #eff6ff; border-color: #bfdbfe; }
.summary-card.out { background: #fef3c7; border-color: #fde68a; }
.summary-card.overdue { background: #fee2e2; border-color: #fecaca; }
.summary-card.returned { background: #dcfce7; border-color: #bbf7d0; }

.summary-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.summary-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
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
}

.btn-clear-filters:hover { background: #e2e8f0; }

/* ================================================================
   LOADING
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

@keyframes spin { to { transform: rotate(360deg); } }

/* ================================================================
   TABLE
   ================================================================ */
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.temelash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 1000px;
}

.temelash-table th,
.temelash-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.temelash-table th {
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
.col-items { min-width: 150px; }
.col-store { min-width: 120px; }
.col-arrow { width: 30px; text-align: center; }
.col-window { min-width: 180px; }
.col-status { min-width: 120px; }
.col-actions { min-width: 100px; }

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

.items-summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

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
.arrow-cell { text-align: center; color: #94a3b8; font-size: 14px; }

.window-cell { min-width: 180px; }
.window-display { display: flex; flex-direction: column; gap: 4px; }
.window-dates { font-size: 11px; color: #334155; font-weight: 500; }

.days-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
}

.days-badge.success { background: #dcfce7; color: #166534; }
.days-badge.warning { background: #fef3c7; color: #92400e; }
.days-badge.danger { background: #fee2e2; color: #991b1b; }
.days-badge.neutral { background: #f1f5f9; color: #475569; }

/* ================================================================
   STATUS BADGES
   ================================================================ */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.3px;
}

.status-badge.out { background: #fef3c7; color: #92400e; }
.status-badge.overdue { background: #fee2e2; color: #991b1b; }
.status-badge.returned { background: #dcfce7; color: #166534; }
.status-badge.returned-late { background: #fed7aa; color: #9a3412; }

.returned-by {
  font-size: 10px;
  color: #64748b;
  margin-top: 4px;
  font-style: italic;
}

/* ================================================================
   ACTIONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 4px;
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
}

.icon-btn:hover { background: #f1f5f9; color: #0f172a; }
.icon-btn:active { transform: scale(0.95); }
.return-btn { color: #10b981; }
.return-btn:hover { background: #dcfce7; color: #065f46; }

/* ================================================================
   EXPAND
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
}

.expand-btn:hover { background: #e0e7ff; }

.detail-expand-row td { padding: 0 !important; }

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

.detail-card.full-width { grid-column: 1 / -1; }

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

.detail-card > div:last-child { border-bottom: none; }

.detail-card .value { font-weight: 500; color: #1e293b; }

.late-yes { color: #dc2626; font-weight: 600; }

/* ================================================================
   WINDOW HIGHLIGHT
   ================================================================ */
.window-highlight {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
}

.window-display-large {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 0;
  flex-wrap: wrap;
}

.window-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.window-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.window-value {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.window-arrow {
  font-size: 24px;
  color: #3b82f6;
  font-weight: 700;
}

.window-remaining { margin-left: auto; }

.days-badge-large {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
}

.days-badge-large.success { background: #dcfce7; color: #166534; }
.days-badge-large.warning { background: #fef3c7; color: #92400e; }
.days-badge-large.danger { background: #fee2e2; color: #991b1b; }
.days-badge-large.neutral { background: #f1f5f9; color: #475569; }

/* ================================================================
   ITEMS TABLE
   ================================================================ */
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

.spec-cell {
  max-width: 200px;
  white-space: normal;
  word-wrap: break-word;
  font-size: 11px;
  color: #475569;
}

/* ================================================================
   REMARK
   ================================================================ */
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

.return-remark-card {
  border-left: 4px solid #10b981;
  background: #f0fdf4;
}

/* ================================================================
   DETAIL ACTIONS
   ================================================================ */
.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.btn-return-detail {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.btn-return-detail:hover { background: #059669; }

.btn-edit-detail {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.btn-edit-detail:hover { background: #2563eb; }

/* ================================================================
   EMPTY
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
   MODAL
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

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 500px;
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

.confirmation-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.confirmation-title {
  font-size: 15px;
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
  font-size: 13px;
}

.detail-row:last-child { border-bottom: none; }

.detail-label { color: #64748b; font-weight: 500; }
.detail-value { color: #1e293b; font-weight: 500; }
.late-warning { color: #dc2626; font-weight: 600; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.form-group textarea,
.form-group input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
}

.form-group textarea:focus,
.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.edit-subtitle {
  font-size: 13px;
  color: #475569;
  margin: 0 0 12px 0;
}

.edit-error {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) { background: #2563eb; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
}

.btn-secondary:hover { background: #e2e8f0; }

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
  max-width: 400px;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast.success { background: #22c55e; }
.toast.error { background: #ef4444; }
.toast.info { background: #3b82f6; }
.toast.warning { background: #f59e0b; }

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 1024px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .section-card { padding: 12px; }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions { flex-direction: column; }
  .search-box input { width: 100%; }

  .summary-cards { grid-template-columns: 1fr 1fr; }

  .filter-bar { flex-direction: column; align-items: stretch; }

  .detail-row-two-cols { grid-template-columns: 1fr; }

  .window-display-large { gap: 12px; }

  .form-row { grid-template-columns: 1fr; }

  .toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    font-size: 13px;
  }

  .detail-actions { flex-direction: column; }
  .detail-actions button { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .summary-cards { grid-template-columns: 1fr; }
  .summary-value { font-size: 18px; }
  .modal-header h3 { font-size: 16px; }
}
</style>