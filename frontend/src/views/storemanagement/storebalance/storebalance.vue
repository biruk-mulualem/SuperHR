<!-- views/storemanagement/storebalance/storebalance.vue - WITH STANDALONE INITIALIZE MODAL -->

<template>
  <div class="section-card">
    <!-- ==================== HEADER ==================== -->
    <div class="card-header">
      <div class="header-title">
        <h2>💰 Store Balance</h2>
        <span class="total-badge">{{ filteredBalances.length }} Items</span>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search items..."
            @input="onSearchChange"
          />
        </div>
        <button class="btn-add" @click="openAddBalanceModal">
          📦 Initialize Balance
        </button>
        <button class="btn-process-requests" @click="processApprovedRequests">
          📋 Process Approved Requests
          <span v-if="pendingRequestsCount > 0" class="badge-count">
            {{ pendingRequestsCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- ==================== FILTERS ==================== -->
    <div class="filter-bar">
      <!-- Only show Store filter for admin users -->
      <select
        v-if="isAdmin"
        v-model="filterStore"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Stores</option>
        <option
          v-for="store in availableStores"
          :key="store.id"
          :value="store.id"
        >
          {{ store.name }}
        </option>
      </select>

      <!-- Only show Group filter for admin users -->
      <select
        v-if="isAdmin"
        v-model="filterGroup"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Groups</option>
        <option
          v-for="group in availableGroups"
          :key="group.id"
          :value="group.id"
        >
          {{ group.name }}
        </option>
      </select>

      <select
        v-model="filterCategory"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Categories</option>
        <option
          v-for="cat in availableCategories"
          :key="cat.id"
          :value="cat.id"
        >
          {{ cat.name }}
        </option>
      </select>
      <select
        v-model="filterStatus"
        class="filter-select"
        @change="onFilterChange"
      >
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <button
        class="btn-clear-filters"
        @click="clearFilters"
        v-if="hasActiveFilters"
      >
        ✕ Clear Filters
      </button>
      <div class="filter-actions">
        <button class="btn-export" @click="openExportModal">📊 Report</button>
      </div>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="stats-grid" v-if="!isLoading">
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalStores }}</div>
          <div class="stat-label">Stores</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-number">{{ totalItems }}</div>
          <div class="stat-label">Total Items</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-number">{{ lowStockItems }}</div>
          <div class="stat-label">Low Stock</div>
        </div>
      </div>
    </div>

    <!-- ==================== STORE BALANCE TABLE ==================== -->
    <div class="table-container" id="printable-area">
      <table class="balance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item Code</th>
            <th>Item</th>
            <th>Category</th>
            <th>UOM</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="8" class="text-center">
              <div class="loading-spinner">Loading...</div>
            </td>
          </tr>
          <tr v-else-if="paginatedBalances.length === 0">
            <td colspan="8" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">💰</span>
                <p>No balance records found</p>
                <button class="btn-secondary" @click="openAddBalanceModal">
                  Initialize First Balance
                </button>
              </div>
            </td>
          </tr>
          <tr v-for="(item, index) in paginatedBalances" :key="item.id">
            <td class="text-center">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>
            <td>
              <div class="item-code">
                {{ item.itemCode || getItemCode(item.itemId) }}
              </div>
            </td>
            <td>
              <div class="item-name-wrapper">
                <div class="item-common-name">
                  {{
                    item.itemCommonName ||
                    getItemCommonName(item.itemId) ||
                    "Unnamed"
                  }}
                </div>
                <div
                  class="item-standard-name"
                  v-if="
                    item.itemStandardName || getItemStandardName(item.itemId)
                  "
                >
                  {{
                    item.itemStandardName || getItemStandardName(item.itemId)
                  }}
                </div>
              </div>
            </td>
            <td>
              <span
                class="category-tag"
                :class="item.categoryName ? 'has-category' : 'no-category'"
              >
                {{ item.categoryName || "Uncategorized" }}
              </span>
            </td>
            <td>
              <div class="uom-wrapper">
                <div class="uom-code">
                  {{ item.uomCode || getItemUnit(item.itemId) }}
                </div>
                <div
                  class="conversion-info"
                  v-if="
                    (item.conversionValue || getConversionValue(item.itemId)) >
                    1
                  "
                >
                  1 {{ item.uomCode || getItemUnit(item.itemId) }} =
                  {{ item.conversionValue || getConversionValue(item.itemId) }}
                  {{ item.conversionUomCode || getBaseUOM(item.itemId) }}
                </div>
                <div class="conversion-info base" v-else>
                  1 {{ item.uomCode || getItemUnit(item.itemId) }} = 1
                  {{ item.uomCode || getItemUnit(item.itemId) }}
                </div>
              </div>
            </td>
            <td>
              <div class="balance-wrapper">
                <div
                  class="balance-value"
                  :class="item.statusClass || getBalanceClass(item)"
                >
                  {{ formatNumber(item.balance) }}
                </div>
                <div class="base-balance">
                  = {{ formatNumber(item.baseBalance || getBaseBalance(item)) }}
                  {{ item.conversionUomCode || getBaseUOM(item.itemId) }}
                </div>
              </div>
            </td>
            <td>
              <span
                :class="[
                  'status-badge',
                  (item.status || 'inactive').toLowerCase(),
                ]"
              >
                {{ item.status || "Inactive" }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="icon-btn"
                  @click="toggleStatus(item)"
                  :title="item.status === 'Active' ? 'Deactivate' : 'Activate'"
                >
                  {{ item.status === "Active" ? "⏸️" : "▶️" }}
                </button>
                <button
                  class="icon-btn delete-btn"
                  @click="openDeleteModal(item)"
                  title="Delete"
                  v-if="item.status === 'Inactive'"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ==================== PAGINATION ==================== -->
    <div class="pagination" v-if="filteredBalances.length > 0">
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

    <!-- ==================== DELETE CONFIRMATION MODAL ==================== -->
    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="closeDeleteModal"
    >
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>🗑️ Confirm Delete</h3>
          <button class="modal-close" @click="closeDeleteModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="delete-icon">⚠️</div>
          <p>
            <strong>Item:</strong>
            {{ deleteTarget ? getItemCommonName(deleteTarget.itemId) : "" }}
          </p>
          <p>
            <strong>Store:</strong>
            {{ deleteTarget ? getStoreName(deleteTarget.storeId) : "" }}
          </p>
          <p>
            <strong>Group:</strong>
            {{ deleteTarget ? getGroupName(deleteTarget.groupId) : "" }}
          </p>
          <p>
            <strong>Balance:</strong>
            {{ deleteTarget ? deleteTarget.balance : 0 }}
            {{ deleteTarget ? getItemUnit(deleteTarget.itemId) : "" }}
          </p>
          <p class="delete-warning">⚠️ This action cannot be undone!</p>
          <p class="delete-question">
            Are you sure you want to delete this balance record?
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDeleteModal">
            Cancel
          </button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- ==================== TOGGLE STATUS CONFIRMATION ==================== -->
    <div
      v-if="showToggleModal"
      class="modal-overlay"
      @click.self="closeToggleModal"
    >
      <div class="modal-container toggle-modal">
        <div class="modal-header">
          <h3>
            {{ toggleItem?.status === "Active" ? "⏸️" : "▶️" }} Confirm Status
            Change
          </h3>
          <button class="modal-close" @click="closeToggleModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="toggle-icon">🔄</div>
          <p>
            <strong>Item:</strong>
            {{ toggleItem ? getItemCommonName(toggleItem.itemId) : "" }}
          </p>
          <p>
            <strong>Current Status:</strong>
            <span :class="['status-badge', toggleItem?.status.toLowerCase()]">
              {{ toggleItem?.status }}
            </span>
          </p>
          <p>
            <strong>New Status:</strong>
            <span :class="['status-badge', toggleNewStatus?.toLowerCase()]">
              {{ toggleNewStatus }}
            </span>
          </p>
          <p class="warning-text">
            ⚠️ Are you sure you want to change the status?
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeToggleModal">
            Cancel
          </button>
          <button class="btn-primary" @click="confirmToggle">Confirm</button>
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
          <h3>📊 Generate Balance Report</h3>
          <button class="modal-close" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="export-options">
            <div class="export-option" @click="exportType = 'full'">
              <input type="radio" v-model="exportType" value="full" /> Full
              Balance Report
            </div>
            <div class="export-option" @click="exportType = 'summary'">
              <input type="radio" v-model="exportType" value="summary" />
              Summary by Store
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
            {{ exporting ? "Generating..." : "Generate Report" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== PROCESS REQUESTS MODAL ==================== -->
    <ProcessRequestsModal
      v-if="showProcessModal"
      :is-admin="isAdmin"
      :stores="availableStores"
      :groups="availableGroups"
      :user-data="userData"
      :inventory-items="inventoryItems"
      @close="closeProcessModal"
      @success="onProcessSuccess"
    />

    <!-- ==================== INITIALIZE BALANCE MODAL ==================== -->
    <InitializeBalanceModal
      v-if="showBalanceModal"
      :is-admin="isAdmin"
      :user-data="userData"
      :stores="availableStores"
      :groups="availableGroups"
      :categories="availableCategories"
      :inventory-items="inventoryItems"
      :editing-balance="editingBalance"
      @close="closeBalanceModal"
      @success="onBalanceSuccess"
    />

    <!-- ==================== TOAST ==================== -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import balanceService from "@/stores/balanceService";
import ProcessRequestsModal from "./components/ProcessRequestsModal.vue";
import InitializeBalanceModal from "./components/InitializeBalanceModal.vue";

const router = useRouter();

// ================================================================
// USER DATA
// ================================================================

const getUserData = () => {
  try {
    const data = JSON.parse(localStorage.getItem("user") || "{}");
    return data;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return {};
  }
};

const userData = ref(getUserData());
const isAdmin = computed(() => userData.value?.isAdmin || false);

// ================================================================
// STORE DATA
// ================================================================
const stores = ref([]);
const allGroups = ref([]);
const categories = ref([]);
const inventoryItems = ref([]);
const balances = ref([]);
const itemRequests = ref([]);

// ================================================================
// LOADING STATES
// ================================================================
const isLoading = ref(false);

// ================================================================
// STATE
// ================================================================
const searchQuery = ref("");
const filterStore = ref("");
const filterGroup = ref("");
const filterCategory = ref("");
const filterStatus = ref("");
const currentPage = ref(1);
const pageSize = ref(5);
const showBalanceModal = ref(false);
const editingBalance = ref(null);
const showToggleModal = ref(false);
const toggleItem = ref(null);
const toggleNewStatus = ref("");
const exporting = ref(false);
const exportType = ref("full");
const showExportModal = ref(false);
const showProcessModal = ref(false);
const showDeleteModal = ref(false);
const deleteTarget = ref(null);

const totalItemsFromAPI = ref(0);

// Toast State
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// ================================================================
// COMPUTED - AVAILABLE DATA BASED ON USER ROLE
// ================================================================

const availableStores = computed(() => {
  if (isAdmin.value) {
    return stores.value;
  }
  if (userData.value?.assignedStore) {
    return stores.value.filter((s) => s.id === userData.value.assignedStore.id);
  }
  return [];
});

const availableGroups = computed(() => {
  if (isAdmin.value) {
    return allGroups.value;
  }
  if (userData.value?.assignedGroup) {
    return allGroups.value.filter(
      (g) => g.id === userData.value.assignedGroup.id,
    );
  }
  return [];
});

const availableCategories = computed(() => {
  return categories.value.filter((c) => c.status === "Active");
});

// ================================================================
// COMPUTED - FILTERED BALANCES
// ================================================================

const hasActiveFilters = computed(() => {
  return (
    filterStore.value ||
    filterGroup.value ||
    filterCategory.value ||
    filterStatus.value ||
    searchQuery.value
  );
});

const filteredBalances = computed(() => {
  let result = [...balances.value];

  if (!isAdmin.value && userData.value?.hasAccess) {
    const assignedStoreId = userData.value.assignedStore?.id;
    const assignedGroupId = userData.value.assignedGroup?.id;

    if (assignedStoreId) {
      result = result.filter((item) => item.storeId === assignedStoreId);
    }
    if (assignedGroupId) {
      result = result.filter((item) => item.groupId === assignedGroupId);
    }
  }

  if (searchQuery.value) {
    const s = searchQuery.value.toLowerCase();
    result = result.filter((item) => {
      const itemName = (
        item.itemCommonName ||
        getItemCommonName(item.itemId) ||
        ""
      ).toLowerCase();
      const itemCode = (
        item.itemCode ||
        getItemCode(item.itemId) ||
        ""
      ).toLowerCase();
      const storeName = (
        item.storeName ||
        getStoreName(item.storeId) ||
        ""
      ).toLowerCase();
      const categoryName = (item.categoryName || "").toLowerCase();
      return (
        itemName.includes(s) ||
        itemCode.includes(s) ||
        storeName.includes(s) ||
        categoryName.includes(s)
      );
    });
  }

  if (filterStore.value && filterStore.value !== "") {
    const storeId = Number(filterStore.value);
    if (!isNaN(storeId)) {
      result = result.filter((item) => item.storeId === storeId);
    }
  }

  if (filterGroup.value && filterGroup.value !== "") {
    const groupId = Number(filterGroup.value);
    if (!isNaN(groupId)) {
      result = result.filter((item) => item.groupId === groupId);
    }
  }

  if (filterCategory.value && filterCategory.value !== "") {
    const categoryId = Number(filterCategory.value);
    if (!isNaN(categoryId)) {
      result = result.filter((item) => item.categoryId === categoryId);
    }
  }

  if (filterStatus.value) {
    result = result.filter((item) => item.status === filterStatus.value);
  }

  return result;
});

// ================================================================
// COMPUTED - PAGINATED DATA
// ================================================================

const paginatedBalances = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredBalances.value.slice(start, end);
});

// ================================================================
// COMPUTED - STATS
// ================================================================

const totalStores = computed(() => {
  const uniqueStores = new Set(
    filteredBalances.value.map((item) => item.storeId),
  );
  return uniqueStores.size;
});

const totalItems = computed(() => {
  if (hasActiveFilters.value) {
    return filteredBalances.value.length;
  }
  return totalItemsFromAPI.value || filteredBalances.value.length;
});

const totalPages = computed(() => {
  const total = hasActiveFilters.value
    ? filteredBalances.value.length
    : totalItemsFromAPI.value;
  return Math.ceil(total / pageSize.value) || 1;
});

const lowStockItems = computed(() => {
  return filteredBalances.value.filter(
    (item) => item.balance <= item.minStock && item.balance > 0,
  ).length;
});

const pendingRequestsCount = computed(() => {
  return itemRequests.value.filter((req) => {
    if (req.status !== "approved") return false;
    return true;
  }).length;
});

// ================================================================
// HELPER METHODS
// ================================================================

const getItemStandardName = (itemId) => {
  if (!itemId) return null;
  const balance = balances.value.find((b) => b.itemId === itemId);
  if (balance) return balance.itemStandardName || null;
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.standardName || null : null;
};

const getItemCommonName = (itemId) => {
  if (!itemId) return null;
  const balance = balances.value.find((b) => b.itemId === itemId);
  if (balance) return balance.itemCommonName || null;
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.name || item.standardName || null : null;
};

const getItemCode = (itemId) => {
  if (!itemId) return "N/A";
  const balance = balances.value.find((b) => b.itemId === itemId);
  if (balance) return balance.itemCode || "N/A";
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.code : "N/A";
};

const getItemUnit = (itemId) => {
  if (!itemId) return "";
  const balance = balances.value.find((b) => b.itemId === itemId);
  if (balance) return balance.uomCode || "";
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.uomCode || "" : "";
};

const getBaseUOM = (itemId) => {
  if (!itemId) return "";
  const balance = balances.value.find((b) => b.itemId === itemId);
  if (balance) return balance.conversionUomCode || balance.uomCode || "";
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.conversionUomCode || item.uomCode || "" : "";
};

const getConversionValue = (itemId) => {
  if (!itemId) return 1;
  const balance = balances.value.find((b) => b.itemId === itemId);
  if (balance) return balance.conversionValue || 1;
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.conversionValue || 1 : 1;
};

const getBaseBalance = (item) => {
  const conversionValue = getConversionValue(item.itemId);
  return item.balance * conversionValue;
};

const getStoreName = (storeId) => {
  if (!storeId) return "Unknown";
  const balance = balances.value.find((b) => b.storeId === storeId);
  if (balance) return balance.storeName || "Unknown";
  const store = availableStores.value.find((s) => s.id === storeId);
  return store ? store.name : "Unknown";
};

const getGroupName = (groupId) => {
  if (!groupId) return "Unknown";
  const balance = balances.value.find((b) => b.groupId === groupId);
  if (balance) return balance.groupName || "Unknown";
  const group = availableGroups.value.find((g) => g.id === groupId);
  return group ? group.name : "Unknown";
};

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

const getBalanceClass = (item) => {
  if (item.balance === 0) return "zero";
  if (item.balance <= item.minStock) return "low";
  return "normal";
};

// ================================================================
// API METHODS
// ================================================================

const fetchStores = async () => {
  try {
    const response = await balanceService.getStores();
    stores.value = response.data || [];
  } catch (error) {
    console.error("Error fetching stores:", error);
    showToastMessage("Failed to load stores", "error");
  }
};

const fetchGroups = async () => {
  try {
    const response = await balanceService.getGroups();
    allGroups.value = response.data || [];
  } catch (error) {
    console.error("Error fetching groups:", error);
    showToastMessage("Failed to load groups", "error");
  }
};

const fetchCategories = async () => {
  try {
    const response = await balanceService.getActiveCategories();
    if (response.success) {
      categories.value = response.data || [];
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    showToastMessage("Failed to load categories", "error");
  }
};

const fetchItems = async () => {
  try {
    const response = await balanceService.getActiveItems();
    if (response && response.success && response.data) {
      inventoryItems.value = response.data || [];
    }
  } catch (error) {
    console.error("Error fetching items:", error);
    showToastMessage("Failed to load items", "error");
    inventoryItems.value = [];
  }
};

const fetchBalances = async () => {
  isLoading.value = true;
  try {
    const filters = {};

    if (!isAdmin.value && userData.value?.hasAccess) {
      if (userData.value.assignedStore) {
        filters.assignedStoreId = userData.value.assignedStore.id;
      }
      if (userData.value.assignedGroup) {
        filters.assignedGroupId = userData.value.assignedGroup.id;
      }
    }

    if (filterStore.value && filterStore.value !== "") {
      const storeId = Number(filterStore.value);
      if (!isNaN(storeId)) {
        filters.storeId = storeId;
      }
    }
    if (filterGroup.value && filterGroup.value !== "") {
      const groupId = Number(filterGroup.value);
      if (!isNaN(groupId)) {
        filters.groupId = groupId;
      }
    }
    if (filterCategory.value && filterCategory.value !== "") {
      const categoryId = Number(filterCategory.value);
      if (!isNaN(categoryId)) {
        filters.categoryId = categoryId;
      }
    }
    if (filterStatus.value) {
      filters.status = filterStatus.value;
    }
    if (searchQuery.value) {
      filters.search = searchQuery.value;
    }

    filters.page = currentPage.value;
    filters.limit = 10000;

    const response = await balanceService.getBalances(filters);

    balances.value = response.data || [];

    if (response.pagination) {
      totalItemsFromAPI.value = response.pagination.total || 0;
      currentPage.value = response.pagination.page || 1;
    }
  } catch (error) {
    console.error("Error fetching balances:", error);
    showToastMessage("Failed to load balances", "error");
  } finally {
    isLoading.value = false;
  }
};

const fetchApprovedRequests = async () => {
  try {
    let response;

    if (
      !isAdmin.value &&
      userData.value?.hasAccess &&
      userData.value.assignedStore
    ) {
      const storeId = userData.value.assignedStore.id;
      const groupId = userData.value.assignedGroup?.id;
      response = await balanceService.getApprovedRequests(storeId, groupId);
    } else if (isAdmin.value) {
      response = await balanceService.getApprovedRequests(0);
    } else {
      response = await balanceService.getApprovedRequests(0);
    }

    itemRequests.value = response.data || [];
  } catch (error) {
    console.error("Error fetching approved requests:", error);
  }
};

// ================================================================
// FILTERS & PAGINATION
// ================================================================

const onSearchChange = () => {
  currentPage.value = 1;
  fetchBalances();
};

const onFilterChange = () => {
  currentPage.value = 1;
  fetchBalances();
};

const clearFilters = () => {
  filterStore.value = "";
  filterGroup.value = "";
  filterCategory.value = "";
  filterStatus.value = "";
  searchQuery.value = "";
  currentPage.value = 1;
  showToastMessage("Filters cleared", "info");
  fetchBalances();
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const changePageSize = () => {
  currentPage.value = 1;
  fetchBalances();
};

// ================================================================
// BALANCE MODAL
// ================================================================

const openAddBalanceModal = () => {
  editingBalance.value = null;
  showBalanceModal.value = true;
};

const closeBalanceModal = () => {
  showBalanceModal.value = false;
  editingBalance.value = null;
};

const onBalanceSuccess = () => {
  showToastMessage("Balance updated successfully!", "success");
  fetchBalances();
};

// ================================================================
// DELETE BALANCE
// ================================================================

const openDeleteModal = (item) => {
  if (item.status === "Active") {
    showToastMessage(
      "Cannot delete active balance. Please deactivate it first.",
      "error",
    );
    return;
  }
  deleteTarget.value = item;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  deleteTarget.value = null;
};

const confirmDelete = async () => {
  if (deleteTarget.value) {
    try {
      await balanceService.deleteBalance(deleteTarget.value.id);
      showToastMessage(
        `Balance record for ${getItemCommonName(deleteTarget.value.itemId)} deleted successfully!`,
        "success",
      );
      await fetchBalances();
    } catch (error) {
      console.error("Error deleting balance:", error);
      showToastMessage("Failed to delete balance", "error");
    }
    closeDeleteModal();
  }
};

// ================================================================
// PROCESS REQUESTS
// ================================================================

const processApprovedRequests = async () => {
  showProcessModal.value = true;
  await fetchApprovedRequests();
};

const closeProcessModal = () => {
  showProcessModal.value = false;
};

const onProcessSuccess = () => {
  showToastMessage("Requests processed successfully!", "success");
  fetchBalances();
  fetchApprovedRequests();
};

// ================================================================
// TOGGLE STATUS
// ================================================================

const toggleStatus = (item) => {
  toggleItem.value = item;
  toggleNewStatus.value = item.status === "Active" ? "Inactive" : "Active";
  showToggleModal.value = true;
};

const closeToggleModal = () => {
  showToggleModal.value = false;
  toggleItem.value = null;
  toggleNewStatus.value = "";
};

const confirmToggle = async () => {
  if (toggleItem.value) {
    try {
      await balanceService.toggleStatus(toggleItem.value.id);
      showToastMessage(`Status changed to ${toggleNewStatus.value}`, "success");
      await fetchBalances();
    } catch (error) {
      console.error("Error toggling status:", error);
      showToastMessage("Failed to change status", "error");
    }
    closeToggleModal();
  }
};

// ================================================================
// EXPORT
// ================================================================

const openExportModal = () => {
  exportType.value = "full";
  showExportModal.value = true;
};

const closeExportModal = () => {
  showExportModal.value = false;
};

const exportSelectedReport = async () => {
  exporting.value = true;
  try {
    const storeId = filterStore.value
      ? Number(filterStore.value)
      : userData.value?.assignedStore?.id || 28;
    const groupId = filterGroup.value
      ? Number(filterGroup.value)
      : userData.value?.assignedGroup?.id || 32;
    const categoryId = filterCategory.value
      ? Number(filterCategory.value)
      : undefined;
    const status = filterStatus.value || undefined;

    const blob = await balanceService.exportBalances(
      exportType.value,
      storeId,
      groupId,
      categoryId,
      status,
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Store_Balance_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToastMessage("Excel export completed successfully!", "success");
  } catch (error) {
    console.error("Export error:", error);
    showToastMessage("Failed to export data", "error");
  } finally {
    exporting.value = false;
    closeExportModal();
  }
};

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (msg, type = "success") => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// LIFECYCLE HOOKS
// ================================================================

onMounted(async () => {
  userData.value = getUserData();

  await Promise.all([
    fetchStores(),
    fetchGroups(),
    fetchCategories(),
    fetchItems(),
    fetchBalances(),
  ]);

  if (!isAdmin.value && userData.value?.hasAccess) {
    if (userData.value.assignedStore) {
      filterStore.value = String(userData.value.assignedStore.id);
    }
    if (userData.value.assignedGroup) {
      filterGroup.value = String(userData.value.assignedGroup.id);
    }
    await fetchBalances();
  }

  await fetchApprovedRequests();
});

watch(
  () => localStorage.getItem("user"),
  (newVal) => {
    if (newVal) {
      userData.value = getUserData();
      fetchBalances();
      fetchApprovedRequests();
    }
  },
);
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
  width: 200px;
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

.btn-process-requests {
  background: #8b5cf6;
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

.btn-process-requests:hover {
  background: #7c3aed;
}

.badge-count {
  display: inline-block;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 12px;
  margin-left: 4px;
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
   STATS
   ================================================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card:hover {
  background: #f1f5f9;
}

.stat-icon {
  font-size: 24px;
  background: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
}

/* ================================================================
   TABLE
   ================================================================ */
.table-container {
  overflow-x: auto;
}

.balance-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 700px;
}

.balance-table th,
.balance-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.balance-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.text-center {
  text-align: center;
}

/* ================================================================
   ITEM INFO
   ================================================================ */
.item-name-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
}

.item-common-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.item-standard-name {
  font-size: 12px;
  color: #64748b;
  font-weight: 400;
  font-style: italic;
}

/* ================================================================
   UOM
   ================================================================ */
.uom-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.uom-code {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.conversion-info {
  font-size: 9px;
  color: #64748b;
}

.conversion-info.base {
  color: #94a3b8;
  font-style: italic;
}

/* ================================================================
   BALANCE
   ================================================================ */
.balance-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.balance-value {
  font-weight: 600;
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 3px;
}

.balance-value.normal {
  color: #166534;
}

.balance-value.low {
  color: #f59e0b;
}

.balance-value.zero {
  color: #ef4444;
}

.base-balance {
  font-size: 10px;
  color: #94a3b8;
}

/* ================================================================
   STATUS BADGE
   ================================================================ */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

/* ================================================================
   CATEGORY TAG
   ================================================================ */
.category-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.category-tag.has-category {
  background: #e0e7ff;
  color: #4338ca;
}

.category-tag.no-category {
  background: #f1f5f9;
  color: #94a3b8;
  font-style: italic;
}

/* ================================================================
   ACTION BUTTONS
   ================================================================ */
.action-buttons {
  display: flex;
  gap: 2px;
  flex-wrap: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 3px 5px;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  background: #fee2e2;
}

/* ================================================================
   PAGINATION
   ================================================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 4px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  white-space: nowrap;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.limit-select {
  padding: 3px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;
  white-space: nowrap;
}

/* ================================================================
   MODALS - Shared
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.toggle-modal .modal-container {
  max-width: 400px;
}

.export-modal .modal-container {
  max-width: 400px;
}

.delete-modal .modal-container {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 7px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-danger:hover {
  background: #dc2626;
}

/* ================================================================
   DELETE MODAL
   ================================================================ */
.delete-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.delete-warning {
  color: #dc2626;
  font-weight: 600;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 6px;
  border: 1px solid #fecaca;
  font-size: 13px;
  text-align: center;
}

.delete-question {
  font-size: 14px;
  color: #475569;
  text-align: center;
  margin-top: 8px;
}

/* ================================================================
   TOGGLE MODAL
   ================================================================ */
.toggle-icon {
  font-size: 32px;
  text-align: center;
  margin-bottom: 6px;
}

.warning-text {
  color: #f59e0b;
  font-weight: 500;
  margin-top: 10px;
  padding: 6px 10px;
  background: #fffbeb;
  border-radius: 4px;
  border: 1px solid #fef3c7;
  font-size: 13px;
}

/* ================================================================
   EXPORT MODAL
   ================================================================ */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.export-option:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-state {
  text-align: center;
  padding: 30px !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-icon {
  font-size: 36px;
  opacity: 0.3;
}

.empty-content p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  animation: slideIn 0.3s ease;
  border-left: 3px solid #10b981;
  max-width: 90vw;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.toast.error {
  border-left-color: #ef4444;
}

.toast.info {
  border-left-color: #3b82f6;
}

.toast.warning {
  border-left-color: #f59e0b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 768px) {
  .card-header {
    flex-wrap: wrap;
  }
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .search-box input {
    width: 100%;
  }
  .filter-bar {
    flex-direction: column;
  }
  .filter-bar select {
    width: 100%;
  }
  .filter-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }
  .pagination {
    flex-wrap: wrap;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .modal-container {
    margin: 10px;
    max-width: 100% !important;
  }
}

@media (max-width: 480px) {
  .balance-table {
    font-size: 11px;
    min-width: 600px;
  }
  .section-card {
    padding: 12px;
  }
  .modal-body {
    padding: 12px;
  }
}

/* ================================================================
   PRINT STYLES
   ================================================================ */
@media print {
  .btn-add,
  .btn-export,
  .btn-process-requests,
  .search-box,
  .filter-bar,
  .pagination,
  .action-buttons,
  .icon-btn {
    display: none !important;
  }
  .section-card {
    box-shadow: none !important;
    padding: 0 !important;
  }
  .balance-table th,
  .balance-table td {
    border: 1px solid #ddd !important;
  }
  .stats-grid {
    display: none !important;
  }
}
</style>