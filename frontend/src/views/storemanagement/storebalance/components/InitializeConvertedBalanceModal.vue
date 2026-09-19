<!-- components/InitializeConvertedBalanceModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
    <div class="modal-container balance-modal">
      <div class="modal-header">
        <div class="modal-header-content">
          <span class="modal-icon">📦</span>
          <div>
            <h3>Initialize Converted Balance</h3>
            <p class="modal-subtitle">
              Set up initial converted stock balance for an item
            </p>
          </div>
        </div>
        <button class="modal-close" @click="handleClose">✕</button>
      </div>

      <div class="modal-body">
        <!-- Tabs: Stock In / Stock Out -->
        <div class="init-tabs">
          <button
            class="init-tab"
            :class="{ active: activeTab === 'in' }"
            @click="activeTab = 'in'"
          >
            📥 Stock In
          </button>
          <button
            class="init-tab"
            :class="{ active: activeTab === 'out' }"
            @click="activeTab = 'out'"
          >
            📤 Stock Out
          </button>
        </div>

        <!-- ============================================================ -->
        <!-- STOCK IN TAB -->
        <!-- ============================================================ -->
        <div v-if="activeTab === 'in'">
          <div class="init-info">
            <span class="info-icon">ℹ️</span>
            <span>Add stock to the converted balance for a specific item.</span>
          </div>

          <form @submit.prevent="saveBalance" class="balance-form">
            <!-- Store and Group Selection -->
            <div v-if="isAdmin" class="form-row">
              <div class="form-group">
                <label>Store *</label>
                <select
                  v-model="form.storeId"
                  required
                  class="form-select"
                  :class="{ 'has-value': form.storeId }"
                >
                  <option value="">Select Store</option>
                  <option
                    v-for="store in stores"
                    :key="store.id"
                    :value="Number(store.id)"
                  >
                    🏪 {{ store.name }}
                  </option>
                </select>
                <span v-if="form.storeId" class="hint">
                  ✅ Selected: {{ getStoreName(form.storeId) }}
                </span>
              </div>

              <div class="form-group">
                <label>Group *</label>
                <select
                  v-model="form.groupId"
                  required
                  class="form-select"
                  :class="{ 'has-value': form.groupId }"
                >
                  <option value="">Select Group</option>
                  <option
                    v-for="group in groups"
                    :key="group.id"
                    :value="Number(group.id)"
                  >
                    👥 {{ group.name }}
                  </option>
                </select>
                <span v-if="form.groupId" class="hint">
                  ✅ Selected: {{ getGroupName(form.groupId) }}
                </span>
              </div>
            </div>

            <!-- Hidden inputs for non-admin -->
            <input v-if="!isAdmin" type="hidden" v-model="form.storeId" />
            <input v-if="!isAdmin" type="hidden" v-model="form.groupId" />

            <!-- Item Selection -->
            <div class="form-row">
              <div class="form-group full-width">
                <label>Item *</label>

                <div class="item-search-wrapper">
                  <input
                    type="text"
                    v-model="itemSearchQuery"
                    placeholder="Search items with converted balance..."
                    :disabled="!currentStoreId || !currentGroupId"
                    @input="onSearchInput"
                    class="item-search-input"
                  />
                  <span v-if="isSearching" class="search-spinner">⏳</span>
                  <span
                    v-else-if="itemSearchQuery && items.length > 0"
                    class="search-results-count"
                  >
                    {{ items.length }} results
                  </span>
                </div>

                <span
                  v-if="!currentStoreId || !currentGroupId"
                  class="hint"
                >
                  ⚠️ Please select a store and group first
                </span>

                <!-- Item List -->
                <div
                  v-if="itemSearchQuery && currentStoreId && currentGroupId"
                  class="item-select-container"
                  ref="itemSelectContainer"
                >
                  <div class="item-select-scroll" @scroll="onItemScroll">
                    <div v-if="isSearching" class="item-loading">
                      <div class="spinner-small"></div>
                      Searching items...
                    </div>

                    <div
                      v-else-if="items.length > 0"
                      v-for="item in displayedItems"
                      :key="item.id"
                      class="item-option"
                      :class="{ selected: form.itemId === item.id }"
                      @click="selectItem(item)"
                    >
                      <div class="item-option-content">
                        <span class="item-option-code">{{ item.code }}</span>
                        <span class="item-option-name">{{
                          item.name || item.standardName || "Unnamed"
                        }}</span>
                        <span class="item-option-uom">{{
                          getItemUOM(item)
                        }}</span>
                        <span class="item-option-balance">
                          💰 {{ formatNumber(item.convertedBalance) }}
                          {{ getConvertedUOMDisplay(item) }}
                        </span>
                      </div>
                    </div>

                    <div
                      v-else-if="!isSearching"
                      class="item-no-results"
                    >
                      No items with a converted balance match your search
                    </div>

                    <div
                      v-if="hasMoreItems && !isSearching && items.length > 0"
                      class="item-load-more"
                    >
                      Scroll for more items...
                    </div>
                  </div>
                </div>

                <!-- Selected Item Display -->
                <div v-if="selectedItemDisplay" class="selected-item-display">
                  <span class="selected-badge">✅ Selected:</span>
                  <span class="selected-item-code">{{
                    selectedItemDisplay.code
                  }}</span>
                  <span class="selected-item-name">
                    {{
                      selectedItemDisplay.name ||
                      selectedItemDisplay.standardName ||
                      "Unnamed"
                    }}
                  </span>
                  <span class="selected-item-uom">
                    ({{ getItemUOM(selectedItemDisplay) }})
                  </span>
                  <button
                    type="button"
                    class="clear-selection"
                    @click="clearItemSelection"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Current Balance Display -->
            <div
              v-if="selectedItemDisplay && currentBalance !== null"
              class="current-balance-display"
            >
              <span class="label">Current Converted Balance:</span>
              <span class="value balance"
                >{{ formatNumber(currentBalance) }}
                {{ getConvertedUOMDisplay(selectedItemDisplay) }}</span
              >
            </div>

            <!-- Quantity -->
            <div class="form-row">
              <div class="form-group">
                <label
                  >Quantity ({{
                    getConvertedUOMDisplay(selectedItemDisplay)
                  }}) *</label
                >
                <input
                  v-model.number="form.convertedBalance"
                  type="number"
                  required
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <span class="hint" v-if="form.itemId">
                  In {{ getConvertedUOMDisplay(selectedItemDisplay) }}
                </span>
              </div>
            </div>

            <!-- Remark Input -->
            <div class="form-row">
              <div class="form-group full-width">
                <label
                  >Remark <span class="optional">(Optional)</span></label
                >
                <textarea
                  v-model="form.remark"
                  class="form-textarea"
                  rows="2"
                  placeholder="Enter a remark for this transaction..."
                />
                <span class="hint">This will be displayed in the history</span>
              </div>
            </div>
          </form>
        </div>

        <!-- ============================================================ -->
        <!-- STOCK OUT TAB -->
        <!-- ============================================================ -->
        <div v-if="activeTab === 'out'">
          <div class="init-info warning">
            <span class="info-icon">⚠️</span>
            <span>Remove stock from the converted balance for a specific item.</span>
          </div>

          <form @submit.prevent="saveBalanceOut" class="balance-form">
            <!-- Store and Group Selection -->
            <div v-if="isAdmin" class="form-row">
              <div class="form-group">
                <label>Store *</label>
                <select
                  v-model="formOut.storeId"
                  required
                  class="form-select"
                  :class="{ 'has-value': formOut.storeId }"
                >
                  <option value="">Select Store</option>
                  <option
                    v-for="store in stores"
                    :key="store.id"
                    :value="Number(store.id)"
                  >
                    🏪 {{ store.name }}
                  </option>
                </select>
                <span v-if="formOut.storeId" class="hint">
                  ✅ Selected: {{ getStoreName(formOut.storeId) }}
                </span>
              </div>

              <div class="form-group">
                <label>Group *</label>
                <select
                  v-model="formOut.groupId"
                  required
                  class="form-select"
                  :class="{ 'has-value': formOut.groupId }"
                >
                  <option value="">Select Group</option>
                  <option
                    v-for="group in groups"
                    :key="group.id"
                    :value="Number(group.id)"
                  >
                    👥 {{ group.name }}
                  </option>
                </select>
                <span v-if="formOut.groupId" class="hint">
                  ✅ Selected: {{ getGroupName(formOut.groupId) }}
                </span>
              </div>
            </div>

            <!-- Hidden inputs for non-admin -->
            <input v-if="!isAdmin" type="hidden" v-model="formOut.storeId" />
            <input v-if="!isAdmin" type="hidden" v-model="formOut.groupId" />

            <!-- Item Selection -->
            <div class="form-row">
              <div class="form-group full-width">
                <label>Item *</label>

                <div class="item-search-wrapper">
                  <input
                    type="text"
                    v-model="itemSearchQueryOut"
                    placeholder="Search items with converted balance..."
                    :disabled="!currentStoreIdOut || !currentGroupIdOut"
                    @input="onSearchInputOut"
                    class="item-search-input"
                  />
                  <span v-if="isSearchingOut" class="search-spinner">⏳</span>
                  <span
                    v-else-if="itemSearchQueryOut && itemsOut.length > 0"
                    class="search-results-count"
                  >
                    {{ itemsOut.length }} results
                  </span>
                </div>

                <span
                  v-if="!currentStoreIdOut || !currentGroupIdOut"
                  class="hint"
                >
                  ⚠️ Please select a store and group first
                </span>

                <!-- Item List -->
                <div
                  v-if="
                    itemSearchQueryOut &&
                    currentStoreIdOut &&
                    currentGroupIdOut
                  "
                  class="item-select-container"
                  ref="itemSelectContainerOut"
                >
                  <div class="item-select-scroll" @scroll="onItemScrollOut">
                    <div v-if="isSearchingOut" class="item-loading">
                      <div class="spinner-small"></div>
                      Searching items...
                    </div>

                    <div
                      v-else-if="itemsOut.length > 0"
                      v-for="item in displayedItemsOut"
                      :key="item.id"
                      class="item-option"
                      :class="{ selected: formOut.itemId === item.id }"
                      @click="selectItemOut(item)"
                    >
                      <div class="item-option-content">
                        <span class="item-option-code">{{ item.code }}</span>
                        <span class="item-option-name">{{
                          item.name || item.standardName || "Unnamed"
                        }}</span>
                        <span class="item-option-uom">{{
                          getItemUOM(item)
                        }}</span>
                        <span class="item-option-balance">
                          💰 {{ formatNumber(item.convertedBalance) }}
                          {{ getConvertedUOMDisplay(item) }}
                        </span>
                      </div>
                    </div>

                    <div
                      v-else-if="!isSearchingOut"
                      class="item-no-results"
                    >
                      No items with a converted balance match your search
                    </div>

                    <div
                      v-if="
                        hasMoreItemsOut && !isSearchingOut && itemsOut.length > 0
                      "
                      class="item-load-more"
                    >
                      Scroll for more items...
                    </div>
                  </div>
                </div>

                <!-- Selected Item Display -->
                <div
                  v-if="selectedItemDisplayOut"
                  class="selected-item-display"
                >
                  <span class="selected-badge">✅ Selected:</span>
                  <span class="selected-item-code">{{
                    selectedItemDisplayOut.code
                  }}</span>
                  <span class="selected-item-name">
                    {{
                      selectedItemDisplayOut.name ||
                      selectedItemDisplayOut.standardName ||
                      "Unnamed"
                    }}
                  </span>
                  <span class="selected-item-uom">
                    ({{ getItemUOM(selectedItemDisplayOut) }})
                  </span>
                  <button
                    type="button"
                    class="clear-selection"
                    @click="clearItemSelectionOut"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Current Balance Display -->
            <div
              v-if="selectedItemDisplayOut && currentBalanceOut !== null"
              class="current-balance-display"
            >
              <span class="label">Current Converted Balance:</span>
              <span class="value balance"
                >{{ formatNumber(currentBalanceOut) }}
                {{ getConvertedUOMDisplay(selectedItemDisplayOut) }}</span
              >
              <span v-if="currentBalanceOut === 0" class="warning-text"
                >⚠️ Balance is zero</span
              >
            </div>

            <!-- Quantity -->
            <div class="form-row">
              <div class="form-group">
                <label
                  >Quantity ({{
                    getConvertedUOMDisplay(selectedItemDisplayOut)
                  }}) *</label
                >
                <input
                  v-model.number="formOut.convertedBalance"
                  type="number"
                  required
                  placeholder="0"
                  min="0"
                  step="0.01"
                  @input="validateStockOut"
                  @change="validateStockOut"
                />
                <span class="hint" v-if="formOut.itemId">
                  In {{ getConvertedUOMDisplay(selectedItemDisplayOut) }}
                </span>
                <span v-if="stockOutError" class="error-text">{{
                  stockOutError
                }}</span>
              </div>
            </div>

            <!-- Remark Input -->
            <div class="form-row">
              <div class="form-group full-width">
                <label
                  >Remark <span class="optional">(Optional)</span></label
                >
                <textarea
                  v-model="formOut.remark"
                  class="form-textarea"
                  rows="2"
                  placeholder="Enter a remark for this transaction..."
                />
                <span class="hint">This will be displayed in the history</span>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          class="btn-secondary"
          @click="handleClose"
          :disabled="saving"
        >
          Cancel
        </button>
        <button
          v-if="activeTab === 'in'"
          class="btn-primary"
          @click="saveBalance"
          :disabled="
            saving || !form.itemId || form.convertedBalance <= 0
          "
        >
          {{ saving ? "Saving..." : "📥 Stock In" }}
        </button>
        <button
          v-if="activeTab === 'out'"
          class="btn-primary"
          @click="saveBalanceOut"
          :disabled="
            saving ||
            !formOut.itemId ||
            formOut.convertedBalance <= 0 ||
            stockOutError ||
            currentBalanceOut === null ||
            currentBalanceOut === 0
          "
        >
          {{ saving ? "Saving..." : "📤 Stock Out" }}
        </button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div v-if="showToast" class="toast" :class="toastType">
    <span>{{ toastMessage }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import convertedBalanceService from "@/stores/convertedBalanceService";

// ================================================================
// PROPS
// ================================================================

const props = defineProps({
  isAdmin: { type: Boolean, default: false },
  userData: { type: Object, default: () => ({}) },
  storeId: { type: Number, default: null },
  groupId: { type: Number, default: null },
  storeName: { type: String, default: "" },
  groupName: { type: String, default: "" },
  stores: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  inventoryItems: { type: [Array, Object], default: () => [] },
  visible: { type: Boolean, default: false },
});

// ================================================================
// EMITS
// ================================================================

const emit = defineEmits(["close", "success", "update:visible"]);

// ================================================================
// STATE
// ================================================================

const activeTab = ref("in");
const saving = ref(false);

// Stock In State
const isSearching = ref(false);
const form = ref({
  storeId: null,
  groupId: null,
  itemId: "",
  convertedBalance: 0,
  remark: "",
});
const itemSearchQuery = ref("");
const items = ref([]);
const itemDisplayLimit = ref(10);
const selectedItemDisplay = ref(null);
const itemSelectContainer = ref(null);
let searchTimeout = null;
let searchPage = ref(1);
let hasMoreItems = ref(false);
let searchTotal = ref(0);
const currentBalance = ref(null);

// Stock Out State
const isSearchingOut = ref(false);
const formOut = ref({
  storeId: null,
  groupId: null,
  itemId: "",
  convertedBalance: 0,
  remark: "",
});
const itemSearchQueryOut = ref("");
const itemsOut = ref([]);
const itemDisplayLimitOut = ref(10);
const selectedItemDisplayOut = ref(null);
const itemSelectContainerOut = ref(null);
let searchTimeoutOut = null;
let searchPageOut = ref(1);
let hasMoreItemsOut = ref(false);
let searchTotalOut = ref(0);
const currentBalanceOut = ref(null);
const stockOutError = ref("");

// Toast State
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
let toastTimeout = null;

// ================================================================
// COMPUTED
// ================================================================

const displayedItems = computed(() =>
  items.value.slice(0, itemDisplayLimit.value)
);

const displayedItemsOut = computed(() =>
  itemsOut.value.slice(0, itemDisplayLimitOut.value)
);

/** Effective store+group for the "in" tab — either the admin's own
 *  selection or the values passed in as props. */
const currentStoreId = computed(
  () => Number(form.value.storeId || props.storeId) || null
);
const currentGroupId = computed(
  () => Number(form.value.groupId || props.groupId) || null
);

/** Same for the "out" tab. */
const currentStoreIdOut = computed(
  () => Number(formOut.value.storeId || props.storeId) || null
);
const currentGroupIdOut = computed(
  () => Number(formOut.value.groupId || props.groupId) || null
);

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (msg, type = "success") => {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  toastTimeout = setTimeout(() => {
    showToast.value = false;
    toastTimeout = null;
  }, 4000);
};

// ================================================================
// MODAL CLOSE
// ================================================================

const closeModal = () => {
  if (saving.value) return;

  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  showToast.value = false;

  emit("update:visible", false);
  emit("close");
};

const handleClose = () => closeModal();
const handleOverlayClick = () => closeModal();

// ================================================================
// SEARCH (Stock In) — uses convertedBalanceService.getConvertedBalanceItems
// ================================================================

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);

  const query = itemSearchQuery.value.trim();

  if (!query) {
    items.value = [];
    searchTotal.value = 0;
    return;
  }

  if (!currentStoreId.value || !currentGroupId.value) {
    items.value = [];
    showToastMessage("Please select a store and group first", "warning");
    return;
  }

  searchPage.value = 1;
  items.value = [];

  searchTimeout = setTimeout(() => searchItems(query), 300);
};

const searchItems = async (query) => {
  if (!query) return;

  const storeId = currentStoreId.value;
  const groupId = currentGroupId.value;

  if (!storeId || !groupId) return;

  isSearching.value = true;

  try {
    const response = await convertedBalanceService.getConvertedBalanceItems({
      storeId,
      groupId,
      search: query,
      page: searchPage.value,
      limit: 20,
    });

    if (response.success) {
      const itemsData = response.data || [];

      items.value =
        searchPage.value === 1
          ? itemsData
          : [...items.value, ...itemsData];

      searchTotal.value = response.pagination?.total || itemsData.length;
      hasMoreItems.value =
        itemsData.length === 20 &&
        searchPage.value * 20 < searchTotal.value;
    } else {
      items.value = [];
      showToastMessage(response.error || "Failed to search items", "error");
    }
  } catch (error) {
    console.error("Error searching items:", error);
    showToastMessage("Failed to search items", "error");
  } finally {
    isSearching.value = false;
  }
};

const onItemScroll = (event) => {
  const el = event.target;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    if (hasMoreItems.value && !isSearching.value) {
      searchPage.value++;
      searchItems(itemSearchQuery.value.trim());
    }
  }
};

const selectItem = (item) => {
  form.value.itemId = item.id || item.itemId;
  selectedItemDisplay.value = item;
  itemSearchQuery.value = item.code || item.name || "";
  items.value = [];
  searchTotal.value = 0;

  // 👇 balance comes straight from the selected row
  currentBalance.value = Number(item.convertedBalance) || 0;
};

const clearItemSelection = () => {
  form.value.itemId = "";
  selectedItemDisplay.value = null;
  itemSearchQuery.value = "";
  items.value = [];
  searchTotal.value = 0;
  currentBalance.value = null;
};

// ================================================================
// SEARCH (Stock Out) — same endpoint
// ================================================================

const onSearchInputOut = () => {
  if (searchTimeoutOut) clearTimeout(searchTimeoutOut);

  const query = itemSearchQueryOut.value.trim();

  if (!query) {
    itemsOut.value = [];
    searchTotalOut.value = 0;
    return;
  }

  if (!currentStoreIdOut.value || !currentGroupIdOut.value) {
    itemsOut.value = [];
    showToastMessage("Please select a store and group first", "warning");
    return;
  }

  searchPageOut.value = 1;
  itemsOut.value = [];

  searchTimeoutOut = setTimeout(() => searchItemsOut(query), 300);
};

const searchItemsOut = async (query) => {
  if (!query) return;

  const storeId = currentStoreIdOut.value;
  const groupId = currentGroupIdOut.value;

  if (!storeId || !groupId) return;

  isSearchingOut.value = true;

  try {
    const response = await convertedBalanceService.getConvertedBalanceItems({
      storeId,
      groupId,
      search: query,
      page: searchPageOut.value,
      limit: 20,
    });

    if (response.success) {
      const itemsData = response.data || [];

      itemsOut.value =
        searchPageOut.value === 1
          ? itemsData
          : [...itemsOut.value, ...itemsData];

      searchTotalOut.value = response.pagination?.total || itemsData.length;
      hasMoreItemsOut.value =
        itemsData.length === 20 &&
        searchPageOut.value * 20 < searchTotalOut.value;
    } else {
      itemsOut.value = [];
      showToastMessage(response.error || "Failed to search items", "error");
    }
  } catch (error) {
    console.error("Error searching items:", error);
    showToastMessage("Failed to search items", "error");
  } finally {
    isSearchingOut.value = false;
  }
};

const onItemScrollOut = (event) => {
  const el = event.target;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    if (hasMoreItemsOut.value && !isSearchingOut.value) {
      searchPageOut.value++;
      searchItemsOut(itemSearchQueryOut.value.trim());
    }
  }
};

const selectItemOut = (item) => {
  formOut.value.itemId = item.id || item.itemId;
  selectedItemDisplayOut.value = item;
  itemSearchQueryOut.value = item.code || item.name || "";
  itemsOut.value = [];
  searchTotalOut.value = 0;
  stockOutError.value = "";

  // 👇 balance comes straight from the selected row
  currentBalanceOut.value = Number(item.convertedBalance) || 0;
  validateStockOut();
};

const clearItemSelectionOut = () => {
  formOut.value.itemId = "";
  selectedItemDisplayOut.value = null;
  itemSearchQueryOut.value = "";
  itemsOut.value = [];
  searchTotalOut.value = 0;
  currentBalanceOut.value = null;
  stockOutError.value = "";
};

// ================================================================
// VALIDATE STOCK OUT
// ================================================================

const validateStockOut = () => {
  stockOutError.value = "";

  if (!selectedItemDisplayOut.value) return;

  const qty = parseFloat(formOut.value.convertedBalance) || 0;
  if (qty <= 0) return;

  if (
    currentBalanceOut.value === null ||
    currentBalanceOut.value === undefined
  ) {
    stockOutError.value = "⚠️ Please wait for balance to load";
    return;
  }

  if (currentBalanceOut.value === 0) {
    stockOutError.value = "⚠️ Balance is zero. Cannot remove stock.";
    return;
  }

  if (qty > currentBalanceOut.value) {
    stockOutError.value = `⚠️ Insufficient balance. Available: ${currentBalanceOut.value}`;
  }
};

// ================================================================
// HELPERS
// ================================================================

const getItemUOM = (item) => {
  if (!item) return "N/A";
  return (
    item.uom?.code ||
    item.uomCode ||
    item.uom_code ||
    "N/A"
  );
};

const getConvertedUOMDisplay = (item) => {
  if (!item) return "N/A";
  return (
    item.conversionUomCode ||
    item.conversionUom?.code ||
    item.uomCode ||
    item.uom?.code ||
    "N/A"
  );
};

const getStoreName = (storeId) => {
  if (!storeId) return "Unknown";
  const store = props.stores.find((s) => Number(s.id) === Number(storeId));
  return store ? store.name : "Unknown";
};

const getGroupName = (groupId) => {
  if (!groupId) return "Unknown";
  const group = props.groups.find((g) => Number(g.id) === Number(groupId));
  return group ? group.name : "Unknown";
};

const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat().format(num);
};

// ================================================================
// SAVE — Stock In
// ================================================================

const saveBalance = async () => {
  if (!form.value.storeId) {
    showToastMessage("Please select a store", "error");
    return;
  }
  if (!form.value.groupId) {
    showToastMessage("Please select a group", "error");
    return;
  }
  if (!form.value.itemId) {
    showToastMessage("Please select an item", "error");
    return;
  }
  if (form.value.convertedBalance <= 0) {
    showToastMessage("Quantity must be greater than 0", "error");
    return;
  }

  saving.value = true;

  try {
    const item = selectedItemDisplay.value;
    const convertedUom = getConvertedUOMDisplay(item);
    const conversionValue =
      item.conversionValue || item.conversion_value || 1;

    const response = await convertedBalanceService.stockIn({
      storeId: Number(form.value.storeId),
      groupId: Number(form.value.groupId),
      itemId: Number(form.value.itemId),
      itemCode: item.code || "",
      itemName: item.name || item.standardName || "Unknown",
      uomCode: convertedUom,
      quantity: Number(form.value.convertedBalance),
      conversionRate: conversionValue,
      sourceUomId: item.uomId,
      targetUomId: item.conversionUomId,
      reason: form.value.remark || "Stock In",
    });

    if (response.success) {
      showToastMessage("✅ Stock added successfully!", "success");
      emit("success", response.data);

      setTimeout(() => {
        saving.value = false;
        closeModal();
      }, 1500);
    } else {
      showToastMessage(response.error || "❌ Failed to add stock", "error");
      saving.value = false;
    }
  } catch (error) {
    console.error("Error adding stock:", error);
    showToastMessage("❌ Failed to add stock", "error");
    saving.value = false;
  }
};

// ================================================================
// SAVE — Stock Out
// ================================================================

const saveBalanceOut = async () => {
  if (!formOut.value.storeId) {
    showToastMessage("Please select a store", "error");
    return;
  }
  if (!formOut.value.groupId) {
    showToastMessage("Please select a group", "error");
    return;
  }
  if (!formOut.value.itemId) {
    showToastMessage("Please select an item", "error");
    return;
  }
  if (formOut.value.convertedBalance <= 0) {
    showToastMessage("Quantity must be greater than 0", "error");
    return;
  }
  if (
    currentBalanceOut.value === null ||
    currentBalanceOut.value === undefined
  ) {
    showToastMessage("Please wait for balance to load", "error");
    return;
  }
  if (currentBalanceOut.value === 0) {
    showToastMessage("⚠️ Balance is zero. Cannot remove stock.", "error");
    return;
  }
  if (formOut.value.convertedBalance > currentBalanceOut.value) {
    showToastMessage(
      `⚠️ Insufficient balance. Available: ${currentBalanceOut.value}`,
      "error"
    );
    return;
  }

  saving.value = true;

  try {
    const item = selectedItemDisplayOut.value;
    const convertedUom = getConvertedUOMDisplay(item);
    const conversionValue =
      item.conversionValue || item.conversion_value || 1;

    const response = await convertedBalanceService.stockOut({
      storeId: Number(formOut.value.storeId),
      groupId: Number(formOut.value.groupId),
      itemId: Number(formOut.value.itemId),
      itemCode: item.code || "",
      itemName: item.name || item.standardName || "Unknown",
      uomCode: convertedUom,
      quantity: Number(formOut.value.convertedBalance),
      conversionRate: conversionValue,
      sourceUomId: item.uomId,
      targetUomId: item.conversionUomId,
      reason: formOut.value.remark || "Stock Out",
    });

    if (response.success) {
      showToastMessage("✅ Stock removed successfully!", "success");
      emit("success", response.data);

      setTimeout(() => {
        saving.value = false;
        closeModal();
      }, 1500);
    } else {
      showToastMessage(response.error || "❌ Failed to remove stock", "error");
      saving.value = false;
    }
  } catch (error) {
    console.error("Error removing stock:", error);
    showToastMessage("❌ Failed to remove stock", "error");
    saving.value = false;
  }
};

// ================================================================
// INIT
// ================================================================

const initializeForm = () => {
  if (!props.isAdmin) {
    if (props.storeId) {
      form.value.storeId = Number(props.storeId);
      formOut.value.storeId = Number(props.storeId);
    }
    if (props.groupId) {
      form.value.groupId = Number(props.groupId);
      formOut.value.groupId = Number(props.groupId);
    }
  }
};

// ================================================================
// WATCHERS
// ================================================================

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // Reset Stock In
      form.value.itemId = "";
      form.value.convertedBalance = 0;
      form.value.remark = "";
      selectedItemDisplay.value = null;
      itemSearchQuery.value = "";
      items.value = [];
      searchTotal.value = 0;
      currentBalance.value = null;

      // Reset Stock Out
      formOut.value.itemId = "";
      formOut.value.convertedBalance = 0;
      formOut.value.remark = "";
      selectedItemDisplayOut.value = null;
      itemSearchQueryOut.value = "";
      itemsOut.value = [];
      searchTotalOut.value = 0;
      currentBalanceOut.value = null;
      stockOutError.value = "";

      initializeForm();
    } else {
      if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
      }
      showToast.value = false;
    }
  },
  { immediate: true }
);

watch(
  () => [props.storeId, props.groupId],
  () => {
    if (props.visible) initializeForm();
  }
);

// Store/group change → clear current selection (item may not exist in the new scope)
watch(
  () => form.value.storeId,
  () => {
    if (selectedItemDisplay.value) {
      clearItemSelection();
      showToastMessage("Store changed — please re-select an item", "info");
    }
  }
);
watch(
  () => form.value.groupId,
  () => {
    if (selectedItemDisplay.value) {
      clearItemSelection();
      showToastMessage("Group changed — please re-select an item", "info");
    }
  }
);
watch(
  () => formOut.value.storeId,
  () => {
    if (selectedItemDisplayOut.value) {
      clearItemSelectionOut();
      showToastMessage("Store changed — please re-select an item", "info");
    }
  }
);
watch(
  () => formOut.value.groupId,
  () => {
    if (selectedItemDisplayOut.value) {
      clearItemSelectionOut();
      showToastMessage("Group changed — please re-select an item", "info");
    }
  }
);

onMounted(() => {
  initializeForm();
});
</script>

<style scoped>
/* ================================================================ */
/* MODAL OVERLAY */
/* ================================================================ */
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
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

/* ================================================================ */
/* HEADER */
/* ================================================================ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-icon {
  font-size: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.modal-subtitle {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #94a3b8;
  width: 26px;
  height: 26px;
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

/* ================================================================ */
/* BODY */
/* ================================================================ */
.modal-body {
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
}

/* ================================================================ */
/* TABS */
/* ================================================================ */
.init-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 6px;
}

.init-tab {
  padding: 6px 14px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s;
}

.init-tab:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.init-tab.active {
  color: #3b82f6;
  background: #eff6ff;
  border-bottom: 2px solid #3b82f6;
}

/* ================================================================ */
/* INIT INFO */
/* ================================================================ */
.init-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #eff6ff;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
  margin-bottom: 12px;
  font-size: 12px;
  color: #1e293b;
}

.init-info.warning {
  background: #fef3c7;
  border-color: #fcd34d;
}

.info-icon {
  font-size: 16px;
}

/* ================================================================ */
/* FORM */
/* ================================================================ */
.balance-form .form-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.balance-form .form-group {
  flex: 1;
  min-width: 100px;
}

.balance-form .form-group label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.balance-form .form-group input,
.balance-form .form-group select {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  background: white;
}

.balance-form .form-group input:focus,
.balance-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.balance-form .form-group select.has-value {
  border-color: #22c55e;
  background-color: #f0fdf4;
}

.balance-form .hint {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.full-width {
  flex: 1 1 100%;
  min-width: 100%;
}

/* ================================================================ */
/* CURRENT BALANCE DISPLAY */
/* ================================================================ */
.current-balance-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 6px;
  margin-top: 6px;
  font-size: 12px;
  flex-wrap: wrap;
}

.current-balance-display .label {
  font-weight: 500;
  color: #64748b;
}

.current-balance-display .value {
  font-weight: 600;
  color: #1e293b;
}

.current-balance-display .value.balance {
  color: #2563eb;
}

.current-balance-display .warning-text {
  color: #d97706;
  font-weight: 600;
}

/* ================================================================ */
/* ITEM SEARCH */
/* ================================================================ */
.item-search-wrapper {
  position: relative;
  flex: 1;
  min-width: 150px;
  margin-bottom: 4px;
}

.item-search-input {
  width: 100%;
  padding: 5px 10px 5px 30px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: #f8fafc;
  transition: all 0.2s;
}

.item-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
}

.item-search-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}

.search-spinner {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  animation: spin 1s linear infinite;
}

.search-results-count {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 8px;
  border-radius: 10px;
}

/* ================================================================ */
/* ITEM LIST */
/* ================================================================ */
.item-select-container {
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  max-height: 180px;
  overflow: hidden;
  transition: border-color 0.2s;
  margin-top: 4px;
}

.item-select-container:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.item-select-scroll {
  max-height: 180px;
  overflow-y: auto;
  padding: 4px;
}

.item-select-scroll::-webkit-scrollbar {
  width: 6px;
}

.item-select-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.item-select-scroll::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
}

.item-option {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;
}

.item-option:hover {
  background: #f1f5f9;
}

.item-option.selected {
  background: #dbeafe;
  border: 1px solid #93bbfc;
}

.item-option-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.item-option-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 11px;
  min-width: 70px;
}

.item-option-name {
  font-size: 12px;
  color: #1e293b;
  flex: 1;
}

.item-option-uom {
  font-size: 10px;
  color: #166534;
  background: #dcfce7;
  padding: 1px 10px;
  border-radius: 10px;
  min-width: 40px;
  text-align: center;
  font-weight: 600;
}

/* balance badge next to each row */
.item-option-balance {
  font-size: 10px;
  color: #2563eb;
  background: #eff6ff;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.item-loading {
  text-align: center;
  padding: 10px;
  color: #94a3b8;
  font-size: 12px;
}

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

.item-no-results {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 13px;
}

.item-load-more {
  text-align: center;
  padding: 10px;
  color: #94a3b8;
  font-size: 12px;
  font-style: italic;
}

/* ================================================================ */
/* SELECTED ITEM DISPLAY */
/* ================================================================ */
.selected-item-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.selected-badge {
  font-weight: 600;
  color: #166534;
  font-size: 11px;
}

.selected-item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
}

.selected-item-name {
  color: #1e293b;
  font-size: 12px;
}

.selected-item-uom {
  color: #64748b;
  font-size: 11px;
}

.clear-selection {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 14px;
  padding: 0 4px;
  margin-left: auto;
}

.clear-selection:hover {
  color: #dc2626;
}

/* ================================================================ */
/* TEXTAREA */
/* ================================================================ */
.form-textarea {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  resize: vertical;
  min-height: 50px;
  background: white;
  transition: all 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 10px;
}

.error-text {
  color: #ef4444;
  font-size: 11px;
  font-weight: 500;
}

/* ================================================================ */
/* FOOTER */
/* ================================================================ */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 10px 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
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
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1200;
  animation: slideIn 0.3s ease;
  border-left: 3px solid #10b981;
  max-width: 90vw;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 95vh;
    margin: 10px;
  }
  .balance-form .form-row {
    flex-direction: column;
  }
  .init-tabs {
    flex-direction: column;
  }
  .item-option-content {
    flex-wrap: wrap;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .modal-body {
    padding: 10px;
  }
  .item-option {
    padding: 4px 8px;
  }
}
</style>