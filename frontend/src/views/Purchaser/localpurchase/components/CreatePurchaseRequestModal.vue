<!-- components/modals/CreatePurchaseRequestModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container purchase-modal">
      <!-- ==================== HEADER ==================== -->
      <div class="modal-header">
        <h3>
          {{ editingRequest ? "✏️ Edit Purchase Request" : "➕ New Purchase Request" }}
        </h3>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <!-- ==================== BODY ==================== -->
      <div class="modal-body">
        <form @submit.prevent="saveRequest" class="request-form">
          <!-- ============================================================ -->
          <!-- REQUEST INFORMATION -->
          <!-- ============================================================ -->
          <div class="form-section">
            <div class="form-section-title">📋 Request Information</div>

            <div class="form-row">
              <!-- ==================== DEPARTMENT ==================== -->
              <div class="form-group">
                <label>
                  Department
                  <span v-if="isAdmin" class="required-mark">*</span>
                </label>

                <select
                  v-if="isAdmin"
                  v-model.number="form.departmentId"
                  required
                  class="form-select"
                  :disabled="loadingDepartments"
                >
                  <option :value="null" disabled>
                    {{ loadingDepartments ? "Loading…" : "Select Department" }}
                  </option>
                  <option
                    v-for="dept in departments"
                    :key="dept.id"
                    :value="dept.id"
                  >
                    {{ dept.name }}
                  </option>
                </select>

                <input
                  v-else
                  type="text"
                  class="form-input locked-field"
                  :value="lockedDepartmentName"
                  readonly
                  tabindex="-1"
                  placeholder="Auto-filled from your account"
                />

                <span
                  v-if="!isAdmin && !lockedDepartmentName"
                  class="hint hint-warning"
                >
                  ⚠️ Your account has no department assigned — please contact an administrator.
                </span>
              </div>

              <div class="form-group">
                <label>Expert Name *</label>
                <input
                  v-model="form.expertName"
                  type="text"
                  required
                  class="form-input"
                  placeholder="Enter expert name..."
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Prepared By *</label>
                <input
                  v-model="form.preparedBy"
                  type="text"
                  required
                  class="form-input"
                  placeholder="Enter preparer name..."
                />
              </div>
              <div class="form-group">
                <label>Requested Date *</label>
                <input
                  v-model="form.requestedDate"
                  type="date"
                  required
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Priority</label>
                <select v-model="form.priority" class="form-select">
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status" class="form-select">
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- ITEMS SECTION -->
          <!-- ============================================================ -->
          <div class="form-section">
            <div class="form-section-title">
              <span>📦 Items</span>
              <span class="selected-count" v-if="selectedItemsList.length > 0">
                {{ selectedItemsList.length }} selected
              </span>
            </div>

            <div class="add-item-area">
              <div class="search-wrapper">
                <span class="search-icon-small">🔍</span>
                <input
                  type="text"
                  v-model="itemSearch"
                  placeholder="Search items by code or name..."
                  class="search-input"
                  :class="{ searching: isSearching }"
                  @keydown.esc="clearSearch"
                />
                <span v-if="isSearching" class="search-spinner">⏳</span>
                <span
                  v-else-if="itemSearch && items.length > 0 && !isSearching"
                  class="search-results-count"
                >
                  {{ items.length }} results
                </span>
              </div>

              <div class="add-wrapper">
                <select
                  v-model="selectedItemId"
                  class="item-select"
                  :disabled="isSearching"
                >
                  <option value="">
                    {{
                      isSearching
                        ? "Searching..."
                        : itemSearch
                          ? items.length === 0
                            ? "No matching items found"
                            : `Select an item (${items.length} results)`
                          : "Type to search for items..."
                    }}
                  </option>
                  <option
                    v-for="item in items"
                    :key="getItemId(item)"
                    :value="getItemId(item)"
                    :disabled="isItemAlreadySelected(item)"
                  >
                    {{ item.code }} - {{ item.standardName || item.name }}
                    [Base: {{ getBaseUOM(item) }} | Conv: {{ getConversionUOM(item) }}]
                    {{ isItemAlreadySelected(item) ? "(added)" : "" }}
                  </option>
                </select>
                <button
                  type="button"
                  class="btn-add-item"
                  @click="addSelectedItem"
                  :disabled="
                    !selectedItemId ||
                    isItemAlreadySelectedById(selectedItemId) ||
                    isSearching
                  "
                >
                  ➕ Add
                </button>
              </div>

              <div
                v-if="hasMoreItems && items.length > 0 && itemSearch"
                class="load-more-trigger"
              >
                <button
                  type="button"
                  class="btn-load-more"
                  @click="loadMoreItems"
                  :disabled="isLoadingMore"
                >
                  {{ isLoadingMore ? "Loading..." : `Load more (${items.length}/${totalItems})` }}
                </button>
              </div>
            </div>

            <!-- SELECTED ITEMS -->
            <div class="selected-items-container" v-if="selectedItemsList.length > 0">
              <div class="selected-header">
                <span class="selected-title">✅ Selected Items</span>
                <button type="button" class="btn-clear-all" @click="clearAllItems">
                  🗑️ Clear All
                </button>
              </div>

              <div class="selected-items-list">
                <div
                  v-for="item in selectedItemsList"
                  :key="item.code"
                  class="selected-item-wrapper"
                >
                  <div class="selected-item-compact">
                    <div class="compact-left" @click="toggleItemExpand(item.code)">
                      <span class="expand-icon">
                        {{ expandedItems.has(item.code) ? "▼" : "▶" }}
                      </span>
                      <span class="item-code">{{ item.code }}</span>
                      <span class="item-name">{{ item.name }}</span>
                    </div>

                    <div class="compact-right">
                      <select
                        v-model="item.uom"
                        @change.stop="syncSelectedItemsToForm"
                        class="compact-uom-select"
                        title="Select UOM"
                      >
                        <option :value="item.baseUom">{{ item.baseUom }}</option>
                        <option
                          v-if="item.conversionUom && item.conversionUom !== item.baseUom"
                          :value="item.conversionUom"
                        >
                          {{ item.conversionUom }}
                        </option>
                      </select>

                      <div class="compact-qty-group">
                        <button
                          type="button"
                          class="compact-qty-btn"
                          @click.stop="adjustQuantity(item.code, -0.01)"
                          :disabled="item.quantity <= 0.01"
                        >
                          −
                        </button>
                        <input
                          type="text"
                          :value="item.quantity"
                          @input="updateQuantityWithResize(item.code, $event)"
                          class="compact-qty-input"
                          inputmode="decimal"
                        />
                        <button
                          type="button"
                          class="compact-qty-btn"
                          @click.stop="adjustQuantity(item.code, 0.01)"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        class="remove-btn-compact"
                        @click.stop="removeSelectedItem(item.code)"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div
                    v-show="expandedItems.has(item.code)"
                    class="selected-item-expanded"
                  >
                    <div class="expanded-row-two">
                      <div class="spec-field">
                        <label class="spec-label">BRAND</label>
                        <input
                          type="text"
                          :value="item.brand"
                          @input="updateItemField(item.code, 'brand', ($event.target as HTMLInputElement).value)"
                          placeholder="Enter brand..."
                          class="spec-input"
                        />
                      </div>
                      <div class="spec-field">
                        <label class="spec-label">MODEL</label>
                        <input
                          type="text"
                          :value="item.model"
                          @input="updateItemField(item.code, 'model', ($event.target as HTMLInputElement).value)"
                          placeholder="Enter model..."
                          class="spec-input"
                        />
                      </div>
                    </div>

                    <div class="expanded-row-full">
                      <div class="spec-field full-width">
                        <label class="spec-label">SPECIFICATION</label>
                        <textarea
                          :value="item.specification"
                          @input="updateItemField(item.code, 'specification', ($event.target as HTMLTextAreaElement).value)"
                          placeholder="Enter specification..."
                          class="spec-textarea"
                          rows="2"
                        ></textarea>
                      </div>
                    </div>

                    <div class="expanded-row-full">
                      <div class="spec-field full-width">
                        <label class="spec-label">REMARK</label>
                        <input
                          type="text"
                          :value="item.remark"
                          @input="updateItemField(item.code, 'remark', ($event.target as HTMLInputElement).value)"
                          placeholder="Add remark..."
                          class="remark-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-items-message">
              <span class="empty-icon">📦</span>
              <p>No items selected</p>
              <span class="empty-hint">Search and add items from the dropdown above</span>
            </div>
          </div>

          <!-- FORM ERRORS -->
          <div v-if="formErrors.length > 0" class="form-errors">
            <div v-for="error in formErrors" :key="error" class="form-error">
              ⚠️ {{ error }}
            </div>
          </div>
        </form>
      </div>

      <!-- ==================== FOOTER ==================== -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">Cancel</button>
        <button
          class="btn-primary"
          @click="saveRequest"
          :disabled="saving || !isFormValid"
        >
          {{ saving ? "Saving..." : editingRequest ? "Update" : "Create" }}
        </button>
      </div>
    </div>
  </div>

  <!-- ==================== BALANCE WARNING MODAL ==================== -->
  <div
    v-if="showBalanceWarning"
    class="balance-overlay"
    @click.self="cancelBalanceWarning"
  >
    <div class="balance-container">
      <div class="balance-header">
        <h3>⚠️ Items Already In Stock</h3>
        <button class="modal-close" @click="cancelBalanceWarning">✕</button>
      </div>

      <div class="balance-body">
        <p class="balance-intro">
          The following item(s) already have balance in one or more stores.
          Please check with the store first before purchasing.
        </p>

        <div class="balance-list">
          <div
            v-for="wItem in balanceWarningItems"
            :key="wItem.code"
            class="balance-item"
          >
            <div class="balance-item-title">
              <strong>{{ wItem.name }}</strong>
              <span class="balance-code">({{ wItem.code }})</span>
              <span class="balance-qty">
                Requested: {{ wItem.requestedQuantity }}
              </span>
            </div>

          <div class="balance-stores">
  <div
    v-for="(store, idx) in wItem.stores"
    :key="idx"
    class="balance-store"
  >
    <span class="store-dot">🟢</span>
    <span class="store-name">{{ store.storeName }}</span>
    <span v-if="store.storeCode" class="store-code">({{ store.storeCode }})</span>
  </div>
</div>
          </div>
        </div>

        <p class="balance-footer">
          You can still create the purchase request — but please confirm you
          already checked with the stores listed above.
        </p>
      </div>

      <div class="balance-actions">
        <button class="btn-secondary" @click="cancelBalanceWarning">
          Cancel
        </button>
        <button class="btn-continue-anyway" @click="confirmContinueAnyway">
          ✅ Continue Anyway
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onBeforeUnmount,
} from "vue";
import { useAuthStore } from "@/stores/auth";
import employeesService from "@/stores/employee";
import purchaseRequestService from "@/stores/purchaseRequestService";
import api from "@/stores/interceptor";

// ================================================================
// TYPES
// ================================================================

interface PurchaseItem {
  id?: number;
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

interface MasterItem {
  id?: number;
  itemId?: number;
  code: string;
  name?: string;
  standardName?: string;
  brand?: string;
  model?: string;
  uom?: { id: number; code: string } | string;
  conversionUom?: { id: number; code: string } | string;
  conversionValue?: number;
  specText?: string;
}

interface BalanceCheckStore {
  storeId: number;
  storeName: string;
  storeCode: string;
  groupId: number;
  groupName: string;
  balance: number;
  uom: string | null;
}

interface BalanceCheckItem {
  code: string;
  name: string;
  requestedQuantity: number;
  hasBalance: boolean;
  stores: BalanceCheckStore[];
  reason?: string;
}

interface PurchaseRequest {
  id: number;
  prNumber: string;
  department?: string;
  expertName?: string;
  preparedBy?: string;
  requestedDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "draft"
    | "pending"
    | "approved"
    | "rejected"
    | "ordered"
    | "received"
    | "cancelled";
  items: PurchaseItem[];
  createdAt: string;
  updatedAt?: string;
}

// ================================================================
// PROPS & EMITS
// ================================================================

const props = defineProps<{
  visible: boolean;
  editingRequest?: PurchaseRequest | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "saved", payload?: any): void;
}>();

// ================================================================
// STORES
// ================================================================

const authStore = useAuthStore();

// ================================================================
// STATE
// ================================================================

const saving = ref(false);

// Item search
const items = ref<MasterItem[]>([]);
const itemSearch = ref("");
const selectedItemId = ref<string>("");
const isSearching = ref(false);
const isLoadingMore = ref(false);
const hasMoreItems = ref(false);
const totalItems = ref(0);
const searchPage = ref(1);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// Selected items — reactive array
const selectedItems = ref<PurchaseItem[]>([]);
const expandedItems = ref<Set<string>>(new Set());

// Departments
const departments = ref<Array<{ id: number; name: string; code?: string }>>([]);
const loadingDepartments = ref(false);

// Form
const form = ref<{
  departmentId: number | null;
  departmentName: string;
  expertName: string;
  preparedBy: string;
  requestedDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "draft" | "pending";
  items: PurchaseItem[];
}>({
  departmentId: null,
  departmentName: "",
  expertName: "",
  preparedBy: "",
  requestedDate: "",
  priority: "medium",
  status: "draft",
  items: [],
});

const formErrors = ref<string[]>([]);

// Balance warning state
const showBalanceWarning = ref(false);
const balanceWarningItems = ref<BalanceCheckItem[]>([]);
const pendingPayload = ref<any>(null);

// ================================================================
// COMPUTED — AUTH / ROLE
// ================================================================

const loggedInUserName = computed(() => authStore.userFullName || "");
const loggedInUserDepartmentId = computed(
  () => authStore.user?.departmentId ?? null
);
const loggedInUserDepartmentName = computed(
  () => authStore.user?.departmentName ?? ""
);

const isAdmin = computed(() => {
  const user: any = authStore.user;
  if (!user) return false;
  if (user.isAdmin === true) return true;
  const role = String(user.role ?? "").toLowerCase();
  return role === "admin" || role === "administrator" || role === "superadmin";
});

const lockedDepartmentName = computed(() => {
  if (isAdmin.value) return form.value.departmentName || "";

  const nameFromAuth = loggedInUserDepartmentName.value?.trim();
  if (nameFromAuth) return nameFromAuth;

  if (loggedInUserDepartmentId.value != null) {
    const match = departments.value.find(
      (d) => Number(d.id) === Number(loggedInUserDepartmentId.value)
    );
    if (match?.name) return match.name;
  }

  return form.value.departmentName || "";
});

const selectedItemsList = computed(() => selectedItems.value);

const isFormValid = computed(() => {
  const deptOk = isAdmin.value
    ? Number.isFinite(Number(form.value.departmentId)) &&
      Number(form.value.departmentId) > 0
    : !!lockedDepartmentName.value;

  const hasDate = !!form.value.requestedDate;

  const hasItems =
    selectedItems.value.length > 0 &&
    selectedItems.value.every((it) => Number(it.quantity) > 0);

  return deptOk && hasDate && hasItems;
});

// ================================================================
// HELPERS
// ================================================================

const getItemId = (item: MasterItem): number => {
  return Number(item?.itemId ?? item?.id ?? 0);
};

const uomCodeOf = (m: MasterItem): string => {
  if (!m.uom) return "";
  return typeof m.uom === "string" ? m.uom : m.uom.code || "";
};

const conversionUomCodeOf = (m: MasterItem): string => {
  if (!m.conversionUom) return "";
  return typeof m.conversionUom === "string"
    ? m.conversionUom
    : m.conversionUom.code || "";
};

const getBaseUOM = (item: MasterItem): string => uomCodeOf(item) || "N/A";
const getConversionUOM = (item: MasterItem): string =>
  conversionUomCodeOf(item) || "N/A";

// ================================================================
// DEPARTMENTS
// ================================================================

const fetchDepartments = async () => {
  if (departments.value.length > 0) return;
  loadingDepartments.value = true;
  try {
    const response = await employeesService.getDepartments();

    let list: any[] = [];
    if (Array.isArray(response)) list = response;
    else if (Array.isArray((response as any)?.data)) list = (response as any).data;
    else if (Array.isArray((response as any)?.departments)) list = (response as any).departments;
    else if (Array.isArray((response as any)?.data?.departments)) list = (response as any).data.departments;
    else if (Array.isArray((response as any)?.data?.rows)) list = (response as any).data.rows;

    departments.value = list
      .map((d: any) => ({
        id: Number(d.id ?? d.departmentId ?? d.department_id ?? 0),
        name: String(d.name ?? d.departmentName ?? d.department_name ?? ""),
        code: d.code ?? d.departmentCode ?? undefined,
      }))
      .filter((d) => d.id > 0 && d.name);
  } catch (err) {
    console.error("❌ fetchDepartments failed:", err);
  } finally {
    loadingDepartments.value = false;
  }
};

// ================================================================
// ITEM SEARCH
// ================================================================

const searchMasterItems = async (
  query: string,
  page = 1
): Promise<{ items: MasterItem[]; total: number; page: number; pages: number }> => {
  try {
    const q = query.trim();
    const response = await api.get("/items", {
      params: q ? { search: q, page, limit: 20 } : { page, limit: 20 },
    });

    const payload = response.data?.data ?? response.data;
    const list: MasterItem[] = Array.isArray(payload)
      ? payload
      : payload?.items || payload?.rows || [];

    const pagination =
      response.data?.pagination ||
      (response.data as any)?.meta ||
      null;

    const total = pagination?.total ?? list.length;
    const currentPage = pagination?.page ?? page;
    const totalPages =
      pagination?.pages ??
      pagination?.totalPages ??
      Math.max(1, Math.ceil(total / 20));

    return { items: list, total, page: currentPage, pages: totalPages };
  } catch (err) {
    console.error("searchMasterItems failed:", err);
    return { items: [], total: 0, page: 1, pages: 1 };
  }
};

const loadItems = async (query: string, page = 1, append = false) => {
  const trimmed = query.trim();

  if (!trimmed && !append) {
    items.value = [];
    hasMoreItems.value = false;
    totalItems.value = 0;
    searchPage.value = 1;
    return;
  }

  if (page === 1) isSearching.value = true;
  else isLoadingMore.value = true;

  try {
    const result = await searchMasterItems(trimmed, page);

    if (append) {
      const existing = new Set(items.value.map((i) => getItemId(i)));
      const toAdd = result.items.filter((i) => !existing.has(getItemId(i)));
      items.value = [...items.value, ...toAdd];
    } else {
      items.value = result.items;
    }

    totalItems.value = result.total;
    searchPage.value = result.page;
    hasMoreItems.value = result.page < result.pages;
  } finally {
    if (page === 1) isSearching.value = false;
    else isLoadingMore.value = false;
  }
};

const loadMoreItems = async () => {
  if (isLoadingMore.value || !hasMoreItems.value) return;
  const q = itemSearch.value.trim();
  if (!q) return;
  await loadItems(q, searchPage.value + 1, true);
};

const clearSearch = () => {
  itemSearch.value = "";
  selectedItemId.value = "";
};

watch(itemSearch, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  const q = newQuery.trim();
  if (!q) {
    items.value = [];
    hasMoreItems.value = false;
    totalItems.value = 0;
    searchPage.value = 1;
    return;
  }

  searchTimeout = setTimeout(() => {
    loadItems(q, 1, false);
  }, 400);
});

// ================================================================
// ITEM SELECTION
// ================================================================

const isItemAlreadySelected = (item: MasterItem): boolean => {
  return selectedItems.value.some((s) => s.code === item.code);
};

const isItemAlreadySelectedById = (id: string | number): boolean => {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) return false;
  const found = items.value.find((i) => getItemId(i) === numericId);
  if (!found) return false;
  return selectedItems.value.some((s) => s.code === found.code);
};

const addSelectedItem = (): void => {
  if (!selectedItemId.value) return;

  const numericId = Number(selectedItemId.value);
  if (!Number.isFinite(numericId) || numericId <= 0) return;

  const master = items.value.find((i) => getItemId(i) === numericId);
  if (!master) return;

  if (selectedItems.value.some((s) => s.code === master.code)) return;

  const baseUom = getBaseUOM(master);
  const convUom = getConversionUOM(master);

  selectedItems.value = [
    ...selectedItems.value,
    {
      code: master.code,
      name: master.standardName || master.name || "Unknown",
      brand: master.brand || "",
      model: master.model || "",
      uom: baseUom,
      baseUom: baseUom,
      conversionUom: convUom !== "N/A" ? convUom : undefined,
      quantity: 1,
      specification: master.specText || "",
      remark: "",
    },
  ];

  selectedItemId.value = "";
  syncSelectedItemsToForm();
};

// ================================================================
// SELECTED ITEM MANIPULATION
// ================================================================

const toggleItemExpand = (code: string) => {
  if (expandedItems.value.has(code)) expandedItems.value.delete(code);
  else expandedItems.value.add(code);
  expandedItems.value = new Set(expandedItems.value);
};

const removeSelectedItem = (code: string) => {
  selectedItems.value = selectedItems.value.filter((it) => it.code !== code);
  expandedItems.value.delete(code);
  syncSelectedItemsToForm();
};

const clearAllItems = () => {
  if (selectedItems.value.length === 0) return;
  if (!confirm("Remove all items from this request?")) return;
  selectedItems.value = [];
  expandedItems.value.clear();
  syncSelectedItemsToForm();
};

const updateItemField = (
  code: string,
  field: "brand" | "model" | "specification" | "remark",
  value: string
) => {
  const idx = selectedItems.value.findIndex((it) => it.code === code);
  if (idx === -1) return;
  const updated = [...selectedItems.value];
  updated[idx] = { ...updated[idx], [field]: value };
  selectedItems.value = updated;
  syncSelectedItemsToForm();
};

const updateQuantity = (code: string, value: string) => {
  const idx = selectedItems.value.findIndex((it) => it.code === code);
  if (idx === -1) return;

  let qty = parseFloat(value);
  if (isNaN(qty) || qty < 0.01) qty = 0.01;
  qty = Math.round(qty * 100) / 100;

  const updated = [...selectedItems.value];
  updated[idx] = { ...updated[idx], quantity: qty };
  selectedItems.value = updated;
  syncSelectedItemsToForm();
};

const updateQuantityWithResize = (code: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  input.style.width = "auto";
  input.style.width = Math.max(40, input.scrollWidth + 4) + "px";
  updateQuantity(code, input.value);
};

const adjustQuantity = (code: string, delta: number) => {
  const idx = selectedItems.value.findIndex((it) => it.code === code);
  if (idx === -1) return;

  let qty = Math.round((selectedItems.value[idx].quantity + delta) * 100) / 100;
  if (qty < 0.01) qty = 0.01;

  const updated = [...selectedItems.value];
  updated[idx] = { ...updated[idx], quantity: qty };
  selectedItems.value = updated;
  syncSelectedItemsToForm();
};

const syncSelectedItemsToForm = () => {
  form.value = {
    ...form.value,
    items: selectedItems.value.map((it) => ({ ...it })),
  };
};

// ================================================================
// PREFILL / INITIALIZE
// ================================================================

const prefillFromAuth = () => {
  if (!form.value.preparedBy) {
    form.value.preparedBy = loggedInUserName.value;
  }

  if (!isAdmin.value) {
    if (loggedInUserDepartmentId.value != null) {
      form.value.departmentId = Number(loggedInUserDepartmentId.value);
    }
    if (loggedInUserDepartmentName.value) {
      form.value.departmentName = loggedInUserDepartmentName.value;
    }
  }
};

const initializeForm = async () => {
  await fetchDepartments();

  const today = new Date().toISOString().split("T")[0];

  selectedItems.value = [];
  expandedItems.value.clear();
  itemSearch.value = "";
  selectedItemId.value = "";
  items.value = [];
  totalItems.value = 0;
  hasMoreItems.value = false;
  searchPage.value = 1;
  formErrors.value = [];
  showBalanceWarning.value = false;
  balanceWarningItems.value = [];
  pendingPayload.value = null;

  if (props.editingRequest) {
    const req = props.editingRequest;

    selectedItems.value = (req.items || []).map((item) => ({
      code: item.code,
      name: item.name,
      brand: item.brand || "",
      model: item.model || "",
      uom: item.uom || "",
      baseUom: item.baseUom || item.uom || "",
      conversionUom: item.conversionUom || undefined,
      quantity: item.quantity || 1,
      specification: item.specification || "",
      remark: item.remark || "",
    }));

    const deptName = req.department || "";
    const dept = departments.value.find((d) => d.name === deptName);

    form.value = {
      departmentId: dept?.id != null ? Number(dept.id) : null,
      departmentName: deptName,
      expertName: req.expertName || "",
      preparedBy: req.preparedBy || loggedInUserName.value,
      requestedDate: req.requestedDate || today,
      priority: req.priority || "medium",
      status: req.status === "pending" ? "pending" : "draft",
      items: selectedItems.value.map((it) => ({ ...it })),
    };

    if (!isAdmin.value) {
      if (loggedInUserDepartmentId.value != null) {
        form.value.departmentId = Number(loggedInUserDepartmentId.value);
      }
      if (loggedInUserDepartmentName.value) {
        form.value.departmentName = loggedInUserDepartmentName.value;
      }
    }
  } else {
    form.value = {
      departmentId: null,
      departmentName: "",
      expertName: "",
      preparedBy: "",
      requestedDate: today,
      priority: "medium",
      status: "draft",
      items: [],
    };
    prefillFromAuth();
  }

  syncSelectedItemsToForm();
};

// ================================================================
// BUILD PAYLOAD
// ================================================================

const buildPayload = () => {
  let departmentToSend: string | null = null;
  if (isAdmin.value) {
    const selectedDept = departments.value.find(
      (d) => Number(d.id) === Number(form.value.departmentId)
    );
    departmentToSend = selectedDept?.name || null;
  } else {
    departmentToSend =
      form.value.departmentName ||
      lockedDepartmentName.value ||
      loggedInUserDepartmentName.value ||
      null;
  }

  return {
    department: departmentToSend,
    expertName: form.value.expertName || null,
    preparedBy: form.value.preparedBy || loggedInUserName.value || null,
    requestedDate: form.value.requestedDate,
    priority: form.value.priority,
    items: form.value.items.map((it) => ({
      code: it.code,
      brand: it.brand || null,
      model: it.model || null,
      uom: it.uom,
      baseUom: it.baseUom || it.uom,
      conversionUom: it.conversionUom || null,
      quantity: Number(it.quantity) || 0,
      specification: it.specification || null,
      remark: it.remark || null,
    })),
  };
};

// ================================================================
// PERFORM SAVE (actual API call)
// ================================================================

const performSave = async (payload: any): Promise<void> => {
  saving.value = true;
  try {
    let response;
    if (props.editingRequest?.id) {
      response = await purchaseRequestService.updateRequest(
        props.editingRequest.id,
        payload
      );
    } else {
      response = await purchaseRequestService.createRequest(payload);
    }

    if (!response.success) {
      throw new Error(response.error || "Failed to save purchase request");
    }

    emit("saved", response.data);
    emit("update:visible", false);
  } catch (error: any) {
    console.error("Save error:", error);
    formErrors.value.push(error?.message || "Failed to save request");
  } finally {
    saving.value = false;
  }
};

// ================================================================
// SAVE REQUEST (with balance check)
// ================================================================

const saveRequest = async (): Promise<void> => {
  formErrors.value = [];
  syncSelectedItemsToForm();

  // ---------- Validation ----------
  if (isAdmin.value) {
    if (
      !Number.isFinite(Number(form.value.departmentId)) ||
      Number(form.value.departmentId) <= 0
    ) {
      formErrors.value.push("Please select a department");
    }
  } else if (!lockedDepartmentName.value) {
    formErrors.value.push(
      "No department is assigned to your account. Please contact an administrator."
    );
  }

  if (!form.value.requestedDate) {
    formErrors.value.push("Please select a requested date");
  }
  if (form.value.items.length === 0) {
    formErrors.value.push("Please add at least one item");
  }
  if (formErrors.value.length > 0) return;

  const payload = buildPayload();

  // ---------- Balance check (new requests only) ----------
  if (!props.editingRequest?.id) {
    saving.value = true;
    try {
      const check = await purchaseRequestService.checkBalance(
        payload.items.map((it) => ({
          code: it.code,
          quantity: it.quantity,
        }))
      );

      if (check.success && check.data?.hasAnyBalance) {
        // Show warning — do NOT save yet
        balanceWarningItems.value = check.data.itemsWithBalance || [];
        pendingPayload.value = payload;
        showBalanceWarning.value = true;
        return;
      }
    } catch (err) {
      console.warn("Balance check failed — continuing to save:", err);
    } finally {
      saving.value = false;
    }
  }

  // ---------- No balance found (or editing) ----------
  await performSave(payload);
};

// ================================================================
// BALANCE WARNING ACTIONS
// ================================================================

const cancelBalanceWarning = () => {
  showBalanceWarning.value = false;
  balanceWarningItems.value = [];
  pendingPayload.value = null;
};

const confirmContinueAnyway = async () => {
  const payload = pendingPayload.value;
  showBalanceWarning.value = false;
  balanceWarningItems.value = [];
  pendingPayload.value = null;

  if (payload) {
    await performSave(payload);
  }
};

// ================================================================
// MODAL CONTROLS
// ================================================================

const closeModal = () => {
  if (saving.value) return;
  emit("update:visible", false);
};

// ================================================================
// LIFECYCLE
// ================================================================

watch(
  () => props.visible,
  async (isOpen) => {
    if (isOpen) {
      await initializeForm();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>

<style scoped>
/* ================================================================ */
/* MODAL OVERLAY */
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
  max-width: 900px;
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

/* ================================================================ */
/* MODAL HEADER */
/* ================================================================ */

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

/* ================================================================ */
/* MODAL BODY + FOOTER */
/* ================================================================ */

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

/* ================================================================ */
/* BUTTONS */
/* ================================================================ */

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

.btn-secondary:hover {
  background: #e2e8f0;
}

/* ================================================================ */
/* FORM SECTIONS */
/* ================================================================ */

.request-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  background: #fafbfc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 18px;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  background: white;
  padding: 2px 12px;
  border-radius: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 10px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.form-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  background: white;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.locked-field {
  background: #f1f5f9 !important;
  color: #475569 !important;
  cursor: not-allowed;
  font-weight: 500;
}

.hint {
  font-size: 11px;
  color: #94a3b8;
}

.hint-warning {
  color: #b45309 !important;
  font-weight: 500;
}

.required-mark {
  color: #ef4444;
  font-weight: 600;
  margin-left: 2px;
}

/* ================================================================ */
/* ADD ITEM AREA */
/* ================================================================ */

.add-item-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.search-wrapper {
  position: relative;
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #94a3b8;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 6px 12px 6px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input.searching {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-spinner {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.search-results-count {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 10px;
  border-radius: 10px;
}

.add-wrapper {
  display: flex;
  gap: 8px;
}

.item-select {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  font-family: inherit;
  min-height: 36px;
}

.item-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.item-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-add-item {
  padding: 6px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 80px;
}

.btn-add-item:hover:not(:disabled) {
  background: #2563eb;
}

.btn-add-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #94a3b8;
}

.load-more-trigger {
  text-align: center;
  padding: 4px 0;
}

.btn-load-more {
  background: transparent;
  border: 1px solid #e2e8f0;
  padding: 4px 16px;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================ */
/* SELECTED ITEMS */
/* ================================================================ */

.selected-items-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 6px;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.selected-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.btn-clear-all {
  background: #fee2e2;
  color: #991b1b;
  border: none;
  padding: 2px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.btn-clear-all:hover {
  background: #fecaca;
}

.selected-items-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 380px;
  overflow-y: auto;
}

.selected-item-wrapper {
  margin-bottom: 6px;
}

.selected-item-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 12px;
  min-height: 44px;
  gap: 8px;
}

.selected-item-compact:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.compact-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.expand-icon {
  font-size: 10px;
  color: #94a3b8;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
  font-size: 12px;
  background: #eff6ff;
  padding: 2px 10px;
  border-radius: 4px;
  flex-shrink: 0;
}

.item-name {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.compact-uom-select {
  padding: 4px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  cursor: pointer;
  min-width: 65px;
  height: 30px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.compact-uom-select:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.compact-qty-group {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  padding: 1px 2px;
}

.compact-qty-btn {
  background: transparent;
  border: none;
  padding: 0 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  border-radius: 3px;
  min-width: 24px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.compact-qty-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.compact-qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.compact-qty-input {
  width: 60px;
  min-width: 45px;
  max-width: 120px;
  text-align: center;
  border: none;
  background: transparent;
  padding: 2px 6px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  font-family: inherit;
}

.compact-qty-input:focus {
  outline: none;
  background: #ffffff;
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.remove-btn-compact {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  font-size: 14px;
  transition: all 0.2s;
  border-radius: 4px;
}

.remove-btn-compact:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* ================================================================ */
/* EXPANDED VIEW */
/* ================================================================ */

.selected-item-expanded {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 10px 14px 14px 14px;
  animation: slideDown 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.expanded-row-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.expanded-row-full {
  display: block;
}

.spec-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.spec-field.full-width {
  width: 100%;
}

.spec-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.spec-input,
.remark-input {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
  width: 100%;
  font-family: inherit;
}

.spec-textarea {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
  width: 100%;
  font-family: inherit;
  resize: vertical;
  min-height: 50px;
  line-height: 1.5;
}

.spec-input:focus,
.remark-input:focus,
.spec-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
}

/* ================================================================ */
/* EMPTY + ERRORS */
/* ================================================================ */

.empty-items-message {
  text-align: center;
  padding: 16px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 4px;
}

.empty-items-message p {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.empty-hint {
  font-size: 11px;
  color: #b0b8c4;
}

.form-errors {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #fecaca;
}

/* ================================================================ */
/* BALANCE WARNING MODAL */
/* ================================================================ */

.balance-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

.balance-container {
  background: white;
  border-radius: 16px;
  max-width: 640px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  animation: slideUp 0.25s ease;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fffbeb;
  border-bottom: 1px solid #fef3c7;
}

.balance-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #92400e;
}

.balance-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.balance-intro {
  font-size: 13px;
  color: #475569;
  margin: 0 0 14px 0;
  line-height: 1.5;
}

.balance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.balance-item {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px 14px;
}

.balance-item-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #78350f;
}

.balance-code {
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #92400e;
  background: rgba(255, 255, 255, 0.6);
  padding: 1px 8px;
  border-radius: 4px;
}

.balance-qty {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #991b1b;
  background: #fee2e2;
  padding: 2px 10px;
  border-radius: 10px;
}

.balance-stores {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
}

.balance-store {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #1e293b;
  background: rgba(255, 255, 255, 0.7);
  padding: 5px 10px;
  border-radius: 6px;
}

.store-dot {
  font-size: 8px;
  line-height: 1;
}

.store-name {
  font-weight: 600;
}

.store-code {
  color: #64748b;
  font-size: 11px;
}



.balance-footer {
  margin: 14px 0 0 0;
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  line-height: 1.5;
}

.balance-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.btn-continue-anyway {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 8px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-continue-anyway:hover {
  background: #d97706;
}

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */

@media (max-width: 768px) {
  .modal-container {
    width: 98%;
    max-height: 95vh;
  }

  .modal-body {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .form-section {
    padding: 12px 14px;
  }

  .selected-item-compact {
    flex-wrap: wrap;
  }

  .compact-right {
    flex-wrap: wrap;
    gap: 4px;
  }

  .add-wrapper {
    flex-direction: column;
  }

  .btn-add-item {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .modal-container {
    width: 100%;
    border-radius: 12px;
  }

  .modal-header {
    padding: 12px 16px;
  }

  .modal-body {
    padding: 12px;
  }

  .modal-footer {
    padding: 12px 16px;
    flex-direction: column;
  }

  .modal-footer button {
    width: 100%;
    justify-content: center;
  }

  .compact-qty-input {
    width: 45px;
    min-width: 35px;
    font-size: 13px;
  }

  .compact-uom-select {
    min-width: 55px;
    font-size: 10px;
  }

  .expanded-row-two {
    grid-template-columns: 1fr;
  }
}
</style>