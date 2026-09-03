<!-- components/modals/CreateRequestModal.vue -->

<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container request-modal">
      <!-- ==================== HEADER ==================== -->
      <div class="modal-header">
        <h3>
          {{ editingRequest ? "✏️ Edit Request" : "➕ New Item Request" }}
        </h3>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <!-- ==================== BODY ==================== -->
      <div class="modal-body">
        <!-- Validation Errors -->
        <div
          v-if="showValidationErrors && validationErrors.length > 0"
          class="validation-error-box"
        >
          <div class="validation-error-header">
            <span class="error-icon">❌</span>
            <span class="error-title">Request Validation Failed</span>
          </div>
          <div class="validation-error-message">{{ validationMessage }}</div>
          <div class="validation-error-list">
            <div
              v-for="(error, index) in validationErrors"
              :key="index"
              class="validation-error-item"
            >
              <div class="error-item-header">
                <span class="error-item-icon">📦</span>
                <span class="error-item-title">
                  <strong>{{ error.itemName || "Unknown Item" }}</strong>
                  <span v-if="error.itemCode" class="error-code"
                    >({{ error.itemCode }})</span
                  >
                  <span v-if="error.requestedQuantity" class="error-quantity">
                    Requested: {{ error.requestedQuantity }}
                  </span>
                </span>
              </div>
              <div class="error-item-message">{{ error.message }}</div>
              <div
                v-if="
                  error.groupsWithoutBalance &&
                  error.groupsWithoutBalance.length > 0
                "
                class="error-groups"
              >
                <span class="groups-label">📋 Missing Groups:</span>
                <span
                  v-for="(group, idx) in error.groupsWithoutBalance"
                  :key="idx"
                  class="group-tag"
                >
                  {{ group.groupName }}
                </span>
              </div>
              <div
                v-if="error.balanceDetails && error.balanceDetails.length > 0"
                class="error-balance-details"
              >
                <span class="balance-label">📊 Balance Variation:</span>
                <div class="balance-list">
                  <span
                    v-for="(detail, idx) in error.balanceDetails"
                    :key="idx"
                    class="balance-item"
                  >
                    {{ detail.groupName }}: {{ detail.balance }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="validation-actions">
            <button class="btn-secondary" @click="closeValidationErrors">
              ✕ Dismiss
            </button>
          </div>
        </div>

        <!-- Form -->
        <form
          @submit.prevent="saveRequest"
          class="request-form"
          v-show="!showValidationErrors"
        >
          <!-- ============================================================ -->
          <!-- STORE SELECTION - Asking Store HIDDEN -->
          <!-- ============================================================ -->
          <div class="form-section">
            <div class="form-section-title">🏪 Store Selection</div>
            
            <input type="hidden" v-model="form.askingStoreId" />

            <div class="form-row">
              <div class="form-group">
                <label>Supplying Store (Target) *</label>
                <select v-model="form.supplyingStoreId" required class="form-select">
                  <option value="">Select Store</option>
                  <option
                    v-for="store in filteredSupplyingStores"
                    :key="store.storeId || store.id"
                    :value="store.storeId || store.id"
                  >
                    {{ store.name }} ({{ store.code }})
                  </option>
                </select>
                <span class="hint">Select the store that will supply the items</span>
              </div>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- ITEMS SECTION - DROPDOWN SELECTION -->
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
/>
              </div>
             <div class="add-wrapper">
  <select 
    v-model="selectedItemId" 
    class="item-select" 
    @change="onItemSelect"
  >
    <option value="">
      {{ itemSearch ? (filteredItems.length === 0 ? 'No matching items found' : 'Select an item...') : 'Type to search for items...' }}
    </option>
    <option
      v-for="item in filteredItems"
      :key="getItemId(item)"
      :value="getItemId(item)"
      :disabled="isItemAlreadySelected(item)"
    >
      {{ item.code }} - {{ item.standardName || item.name }} [ {{ getItemUOM(getItemId(item)) }}] {{ isItemAlreadySelected(item) ? '(added)' : '' }}
    </option>
  </select>
  <button
    type="button"
    class="btn-add-item"
    @click="addSelectedItem"
    :disabled="!selectedItemId || isItemAlreadySelectedById(selectedItemId)"
  >
    ➕ Add
  </button>
</div>
            </div>

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
                  :key="item.itemId"
                  class="selected-item-row"
                >
                  <div class="item-info">
                    <span class="item-code">{{ item.code }}</span>
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-uom">[{{ getItemUOM(item.itemId) }}]</span>
                  </div>
                  <div class="item-controls">
                    <div class="quantity-control">
                      <button
                        type="button"
                        class="qty-btn"
                        @click="adjustQuantity(item.itemId, -1)"
                        :disabled="item.quantity <= 1"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        v-model.number="item.quantity"
                        @change="validateQuantity(item)"
                        min="0.01"
                        step="0.01"
                        class="qty-input"
                      />
                      <button
                        type="button"
                        class="qty-btn"
                        @click="adjustQuantity(item.itemId, 1)"
                      >
                        +
                      </button>
                      <span class="qty-uom">{{ getItemUOM(item.itemId) }}</span>
                    </div>
                    <input
                      type="text"
                      v-model="item.remark"
                      placeholder="Add remark..."
                      class="remark-input"
                    />
                    <button
                      type="button"
                      class="remove-btn"
                      @click="removeSelectedItem(item.itemId)"
                      title="Remove item"
                    >
                      ✕
                    </button>
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

          <!-- ============================================================ -->
          <!-- REQUEST DETAILS -->
          <!-- ============================================================ -->
          <div class="form-section">
            <div class="form-section-title">📋 Request Details</div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Requested By *</label>
                <input
                  v-model="form.requestedBy"
                  type="text"
                  required
                  disabled
                  class="form-input"
                  placeholder="Enter requester name..."
                />
                <span class="hint">Enter the name of the person requesting</span>
              </div>
              <div class="form-group">
                <label>Requested Date *</label>
                <input v-model="form.requestedDate" type="date" required class="form-input" />
              </div>
            </div>

            <div class="form-group full-width">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isAsset" />
                <span class="checkbox-text">🔧 This request contains ASSET items</span>
              </label>
              <span class="hint" v-if="form.isAsset">
                📌 Department approval will be required (configured in system settings)
              </span>
              <span class="hint" v-else>
                ℹ️ Toggle on if this request contains asset items that need department approval
              </span>
            </div>

            <div v-if="editingRequest" class="form-group full-width">
              <label>Status</label>
              <input
                value="Pending (Reset on Edit)"
                type="text"
                readonly
                class="status-info-field"
              />
              <span class="hint">Status is always reset to Pending when editing</span>
            </div>

            <div class="form-group full-width">
              <label>General Remark</label>
              <textarea
                v-model="form.remark"
                rows="3"
                placeholder="General notes or remarks..."
                class="textarea-field"
              ></textarea>
              <span class="hint">This remark applies to the entire request</span>
            </div>

            <div v-if="formErrors.length > 0" class="form-errors">
              <div v-for="error in formErrors" :key="error" class="form-error">
                ⚠️ {{ error }}
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- ==================== FOOTER ==================== -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">Cancel</button>
        <button
          v-show="!showValidationErrors"
          class="btn-primary"
          @click="saveRequest"
          :disabled="saving || !isFormValid"
        >
          {{ saving ? "Saving..." : editingRequest ? "Update" : "Create" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import itemRequestService from "@/stores/itemRequestService";
import type {
  ItemRequest,
  RequestItem,
  Store,
  Item,
} from "@/stores/itemRequestService";

// ================================================================
// PROPS & EMITS
// ================================================================

const props = defineProps<{
  visible: boolean;
  editingRequest?: ItemRequest | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}>();

// ================================================================
// STATE
// ================================================================

const authStore = useAuthStore();

const stores = ref<Store[]>([]);
const items = ref<Item[]>([]);
const saving = ref(false);

const userAssignedStoreId = ref<number | null>(null);
const userAssignedStoreName = ref<string | null>(null);
const userIsAdmin = ref(false);

const validationErrors = ref<any[]>([]);
const validationMessage = ref<string>("");
const showValidationErrors = ref(false);

const form = ref({
  askingStoreId: "",
  supplyingStoreId: "",
  items: [] as RequestItem[],
  requestedBy: "",
  requestedDate: "",
  status: "pending" as "pending" | "approved" | "rejected",
  remark: "",
  isAsset: false,
});

const formErrors = ref<string[]>([]);

// Item selection
const selectedItemId = ref<string>("");
const itemSearch = ref("");
const selectedItems = ref<Map<number, { 
  itemId: number; 
  code: string; 
  name: string; 
  quantity: number;
  remark: string;
}>>(new Map());

// ================================================================
// HELPER: Get consistent item ID
// ================================================================

const getItemId = (item: any): number => {
  return Number(item?.itemId ?? item?.id ?? 0);
};

// ================================================================
// COMPUTED
// ================================================================

const activeStores = computed(() => {
  return stores.value.filter((store) => store.status === "Active");
});

const filteredSupplyingStores = computed(() => {
  let result = activeStores.value;
  if (form.value.askingStoreId) {
    result = result.filter(
      (store) =>
        (store.storeId || store.id) !== Number(form.value.askingStoreId),
    );
  }
  return result;
});

const filteredItems = computed(() => {
  let list = items.value;
  const query = itemSearch.value.toLowerCase().trim();
  
  // If no search query, return empty array (don't load everything)
  if (!query) {
    return [];
  }
  
  // Filter based on search query
  list = list.filter(
    (item) =>
      item.code?.toLowerCase().includes(query) ||
      item.name?.toLowerCase().includes(query) ||
      item.standardName?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query) ||
      item.model?.toLowerCase().includes(query),
  );
  return list.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
});

const selectedItemsList = computed(() => {
  return Array.from(selectedItems.value.values());
});

const isFormValid = computed(() => {
  if (selectedItemsList.value.length === 0) return false;
  const allValid = selectedItemsList.value.every(item => item.quantity > 0);
  if (!allValid) return false;
  return !!(
    form.value.askingStoreId &&
    form.value.supplyingStoreId &&
    form.value.requestedBy &&
    form.value.requestedDate
  );
});

// ================================================================
// ITEM SELECTION METHODS
// ================================================================

const isItemAlreadySelected = (item: any): boolean => {
  const id = getItemId(item);
  return Number.isFinite(id) && selectedItems.value.has(id);
};

const isItemAlreadySelectedById = (id: string | number): boolean => {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return false;
  }
  return selectedItems.value.has(numericId);
};

const onItemSelect = (): void => {
  console.log('🎯 Selected item ID from dropdown:', selectedItemId.value);
};

const onSearchInput = (): void => {
  selectedItemId.value = "";
};

const addSelectedItem = (): void => {
  if (!selectedItemId.value) {
    return;
  }

  const id = Number(selectedItemId.value);

  if (!Number.isFinite(id) || id <= 0) {
    return;
  }

  if (selectedItems.value.has(id)) {
    return;
  }

  const item = items.value.find(
    i => Number(i.itemId ?? i.id) === id
  );

  if (!item) {
    return;
  }

  selectedItems.value.set(id, {
    itemId: id,
    code: item.code || "",
    name: item.standardName || item.name || "Unknown",
    quantity: 1,
    remark: "",
  });

  selectedItemId.value = "";
};

const adjustQuantity = (itemId: number, delta: number): void => {
  const item = selectedItems.value.get(itemId);
  if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty < 1) return;
  selectedItems.value.set(itemId, { ...item, quantity: newQty });
};

const validateQuantity = (item: { itemId: number; quantity: number }): void => {
  if (item.quantity < 1) {
    item.quantity = 1;
    const existing = selectedItems.value.get(item.itemId);
    if (existing) {
      selectedItems.value.set(item.itemId, { ...existing, quantity: 1 });
    }
  }
};

const removeSelectedItem = (itemId: number): void => {
  selectedItems.value.delete(itemId);
};

const clearAllItems = (): void => {
  if (selectedItemsList.value.length === 0) return;
  if (confirm("Remove all items from this request?")) {
    selectedItems.value.clear();
  }
};

const syncSelectedItemsToForm = (): void => {
  const items = Array.from(selectedItems.value.values()).map(item => ({
    itemId: item.itemId,
    quantity: item.quantity,
    remark: item.remark || "",
  }));
  form.value.items = items;
};

// ================================================================
// HELPER METHODS
// ================================================================

const getItemName = (itemId: number): string => {
  const item = items.value.find((i) => Number(i.itemId ?? i.id) === itemId);
  return item ? item.name : "Unknown Item";
};

const getItemCode = (itemId: number): string => {
  const item = items.value.find((i) => Number(i.itemId ?? i.id) === itemId);
  return item ? item.code : "N/A";
};

// ✅ NEW: Get UOM for an item
const getItemUOM = (itemId: number): string => {
  const item = items.value.find((i) => Number(i.itemId ?? i.id) === itemId);
  if (!item) return 'N/A';
  
  // Check if uom exists and get its name/code
  if (item.uom) {
    if (typeof item.uom === 'string') return item.uom;
    if (typeof item.uom === 'object' && item.uom.code) return item.uom.code;
    if (typeof item.uom === 'object' && item.uom.name) return item.uom.name;
  }
  return 'N/A';
};

const getCurrentUser = (): string => {
  return (
    authStore.user?.fullName ||
    authStore.user?.username ||
    authStore.user?.email ||
    "Unknown User"
  );
};

const getCurrentUserId = (): number | undefined => {
  return authStore.user?.userId;
};

const closeValidationErrors = (): void => {
  showValidationErrors.value = false;
  validationErrors.value = [];
  validationMessage.value = "";
};

// ================================================================
// DATA LOADING
// ================================================================

const loadUserData = () => {
  const user = authStore.user;
  if (!user) return;
  
  const userData = user as any;
  userIsAdmin.value = userData.isAdmin || user.role === "admin" || user.role === "Admin";
  
  let storeId = authStore.userStoreId;
  
  if (!storeId) {
    storeId = userData.storeId || 
              userData.assignedStore?.id || 
              userData.currentStore?.id ||
              userData.store?.id ||
              null;
  }
  
  if (storeId) {
    userAssignedStoreId.value = storeId;
    userAssignedStoreName.value = userData.storeName || userData.assignedStore?.name || userData.currentStore?.name || 'Assigned Store';
    form.value.askingStoreId = String(storeId);
  }
};

const loadStores = async () => {
  try {
    const response = await itemRequestService.getActiveStores();
    if (response.success) {
      stores.value = response.data;
    }
  } catch (error) {
    console.error("Load stores error:", error);
  }
};

const loadItems = async () => {
  try {
    const response = await itemRequestService.getActiveItems();
    if (response.success) {
      items.value = response.data;
    }
  } catch (error) {
    console.error("Load items error:", error);
  }
};

// ================================================================
// SAVE REQUEST
// ================================================================

const saveRequest = async (): Promise<void> => {
  closeValidationErrors();
  formErrors.value = [];

  syncSelectedItemsToForm();

  if (!form.value.askingStoreId) {
    formErrors.value.push("Please select the asking store");
  }
  if (!form.value.supplyingStoreId) {
    formErrors.value.push("Please select the supplying store");
  }
  if (form.value.askingStoreId === form.value.supplyingStoreId) {
    formErrors.value.push("Asking store and supplying store cannot be the same");
  }
  if (form.value.items.length === 0) {
    formErrors.value.push("Please add at least one item");
  }

  const itemIds = form.value.items.map(item => item.itemId).filter(id => id && id !== 0);
  const duplicateIds = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
  
  if (duplicateIds.length > 0) {
    const duplicateItems = form.value.items.filter(item => 
      duplicateIds.includes(item.itemId)
    );
    
    duplicateItems.forEach(item => {
      const itemName = getItemName(item.itemId) || 'Unknown Item';
      formErrors.value.push(
        `⚠️ "${itemName}" (${getItemCode(item.itemId)}) is already added.`
      );
    });
    
    validationErrors.value = duplicateItems.map(item => ({
      itemId: item.itemId,
      itemName: getItemName(item.itemId) || 'Unknown Item',
      itemCode: getItemCode(item.itemId) || 'N/A',
      requestedQuantity: item.quantity,
      message: 'This item is already added to the request. Please remove the duplicate entry.'
    }));
    
    validationMessage.value = 'Duplicate items found in the request.';
    showValidationErrors.value = true;
    return;
  }

  form.value.items.forEach((item, index) => {
    if (!item.itemId) {
      formErrors.value.push(`Item #${index + 1}: Please select an item`);
    }
    if (!item.quantity || item.quantity <= 0) {
      formErrors.value.push(`Item #${index + 1}: Please enter a valid quantity`);
    }
  });

  if (!form.value.requestedDate) {
    formErrors.value.push("Please select a requested date");
  }
  if (!form.value.requestedBy) {
    formErrors.value.push("Please enter the requester name");
  }

  if (formErrors.value.length > 0) {
    return;
  }

  saving.value = true;
  
  try {
    const userId = getCurrentUserId();
    
    const requestData = {
      askingStoreId: Number(form.value.askingStoreId),
      supplyingStoreId: Number(form.value.supplyingStoreId),
      items: form.value.items.map((item) => ({
        itemId: Number(item.itemId),
        quantity: item.quantity,
        remark: item.remark || "",
      })),
      requestedById: userId,
      requestedBy: form.value.requestedBy,
      requestedDate: form.value.requestedDate,
      status: form.value.status as "pending" | "approved" | "rejected",
      remark: form.value.remark,
      isAsset: form.value.isAsset,
    };

    console.log('📤 Saving request with requestedBy:', requestData.requestedBy);

    let response;
    
    if (props.editingRequest) {
      const requestId = props.editingRequest.requestId || props.editingRequest.id;
      response = await itemRequestService.updateRequest(requestId!, requestData);
    } else {
      response = await itemRequestService.createRequest(requestData);
    }
    
    if (response.success === true) {
      emit('saved');
      closeModal();
    } else {
      if (response.errors && response.errors.length > 0) {
        validationErrors.value = response.errors;
        validationMessage.value = response.message || "Validation failed. Please fix the issues below.";
        showValidationErrors.value = true;
      } else {
        const errorMsg = response.error || response.message || 'Failed to save request';
        emit('update:visible', false);
      }
    }
  } catch (error: any) {
    console.error("Save request error:", error);
    const errorData = error.response?.data;
    
    if (errorData && errorData.errors && errorData.errors.length > 0) {
      validationErrors.value = errorData.errors;
      validationMessage.value = errorData.message || "Validation failed. Please fix the issues below.";
      showValidationErrors.value = true;
    }
  } finally {
    saving.value = false;
  }
};

// ================================================================
// MODAL CONTROLS
// ================================================================

const closeModal = (): void => {
  emit('update:visible', false);
};

// ================================================================
// LIFECYCLE
// ================================================================

const initializeForm = () => {
  const today: string = new Date().toISOString().split("T")[0] || "";
  
  if (props.editingRequest) {
    const req = props.editingRequest;
    const requestedDate: string = String(req.requestedDate || today);
    
    selectedItems.value.clear();
    if (req.items) {
      req.items.forEach((item: any) => {
        const itemId = Number(item.itemId || item.id || 0);
        const itemData = items.value.find(i => Number(i.itemId ?? i.id) === itemId);
        if (itemData && itemId > 0) {
          selectedItems.value.set(itemId, {
            itemId: itemId,
            code: itemData.code || '',
            name: itemData.standardName || itemData.name || "Unknown",
            quantity: item.quantity || 1,
            remark: item.remark || "",
          });
        }
      });
    }
    
    form.value = {
      askingStoreId: String(req.askingStoreId),
      supplyingStoreId: String(req.supplyingStoreId),
      items: req.items ? req.items.map((item: any) => ({
        ...item,
        itemId: Number(item.itemId || item.id || 0),
        remark: item.remark || "",
      })) : [],
      requestedBy: req.requestedByUser?.fullName || req.requestedBy || getCurrentUser(),
      requestedDate: requestedDate,
      status: "pending",
      remark: req.remark || "",
      isAsset: (req as any).isAsset || false,
    };
  } else {
    form.value = {
      askingStoreId: String(userAssignedStoreId.value || ""),
      supplyingStoreId: "",
      items: [],
      requestedBy: getCurrentUser(),
      requestedDate: today,
      status: "pending",
      remark: "",
      isAsset: false,
    };
    selectedItems.value.clear();
  }
  
  selectedItemId.value = "";
  itemSearch.value = "";
  formErrors.value = [];
  closeValidationErrors();
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadUserData();
      loadStores();
      loadItems();
      initializeForm();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* ================================================================
   MODAL OVERLAY
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 920px;
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

/* ================================================================
   MODAL HEADER
   ================================================================ */
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

/* ================================================================
   MODAL BODY
   ================================================================ */
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
}

/* ================================================================
   MODAL FOOTER
   ================================================================ */
.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

/* ================================================================
   BUTTONS
   ================================================================ */
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

/* ================================================================
   FORM SECTIONS
   ================================================================ */
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

/* ================================================================
   FORM ROWS
   ================================================================ */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group.full-width {
  grid-column: 1 / -1;
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

.form-input:read-only {
  background: #f8fafc;
  color: #64748b;
}

.readonly-field {
  background: #f8fafc !important;
  color: #475569 !important;
  cursor: not-allowed;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
}

.status-info-field {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border: 1px solid #bbf7d0 !important;
  font-weight: 500;
  cursor: not-allowed;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.textarea-field {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
  background: white;
  font-family: inherit;
  resize: vertical;
  min-height: 50px;
}

.textarea-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ================================================================
   CHECKBOX
   ================================================================ */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
  background: white;
}

.checkbox-label:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

/* ================================================================
   ADD ITEM AREA
   ================================================================ */
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
}

.search-input {
  width: 100%;
  padding: 6px 12px 6px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

.item-select option:disabled {
  color: #94a3b8;
}

.added-label {
  color: #22c55e;
  font-size: 11px;
  margin-left: 4px;
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

/* ================================================================
   SELECTED ITEMS
   ================================================================ */
.selected-items-container {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 6px;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.selected-title {
  font-size: 13px;
  font-weight: 600;
  color: #166534;
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
  gap: 6px;
  max-height: 250px;
  overflow-y: auto;
}

.selected-items-list::-webkit-scrollbar {
  width: 4px;
}

.selected-items-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.selected-items-list::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 2px;
}

.selected-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 5px 10px;
  flex-wrap: wrap;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 130px;
  flex: 1;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-family: monospace;
  font-size: 11px;
  background: #eff6ff;
  padding: 1px 8px;
  border-radius: 4px;
}

.item-name {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}

/* ✅ NEW: UOM styles */
.item-uom {
  font-size: 11px;
  color: #059669;
  font-weight: 500;
  background: #ecfdf5;
  padding: 1px 8px;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
}

.uom-label {
  font-size: 10px;
  color: #059669;
  font-weight: 500;
  margin-left: 4px;
}

.qty-uom {
  font-size: 10px;
  color: #64748b;
  font-weight: 500;
  margin-left: 2px;
  min-width: 30px;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  padding: 1px;
}

.qty-btn {
  background: transparent;
  border: none;
  padding: 0 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  border-radius: 4px;
}

.qty-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-input {
  width: 42px;
  text-align: center;
  border: none;
  background: transparent;
  padding: 2px 0;
  font-size: 13px;
  font-weight: 500;
}

.qty-input:focus {
  outline: none;
}

.remark-input {
  padding: 3px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 11px;
  background: #fafbfc;
  min-width: 100px;
  transition: all 0.2s;
}

.remark-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.remark-input::placeholder {
  color: #94a3b8;
  font-size: 10px;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.remove-btn:hover {
  color: #dc2626;
}

/* ================================================================
   EMPTY ITEMS MESSAGE
   ================================================================ */
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

/* ================================================================
   VALIDATION ERRORS
   ================================================================ */
.validation-error-box {
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}

.validation-error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.validation-error-header .error-icon {
  font-size: 18px;
}

.validation-error-header .error-title {
  font-size: 15px;
  font-weight: 600;
  color: #991b1b;
}

.validation-error-message {
  color: #7f1d1d;
  font-size: 13px;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #fee2e2;
  border-radius: 6px;
}

.validation-error-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
  max-height: 250px;
  overflow-y: auto;
}

.validation-error-item {
  background: white;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 10px 14px;
}

.error-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.error-item-icon {
  font-size: 14px;
}

.error-item-title {
  font-size: 13px;
  color: #1e293b;
}

.error-code {
  color: #64748b;
  font-weight: normal;
  margin-left: 4px;
}

.error-quantity {
  font-size: 11px;
  color: #64748b;
  margin-left: 6px;
  font-weight: normal;
}

.error-item-message {
  font-size: 12px;
  color: #475569;
  line-height: 1.4;
  padding-left: 24px;
}

.error-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding-left: 24px;
  margin-top: 2px;
}

.groups-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.group-tag {
  display: inline-block;
  padding: 1px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.error-balance-details {
  padding-left: 24px;
  margin-top: 2px;
}

.balance-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  display: block;
  margin-bottom: 2px;
}

.balance-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.balance-item {
  display: inline-block;
  padding: 1px 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.validation-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ================================================================
   FORM ERRORS
   ================================================================ */
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

/* ================================================================
   RESPONSIVE
   ================================================================ */
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

  .selected-item-row {
    flex-direction: column;
    align-items: stretch;
  }

  .item-info {
    min-width: auto;
  }

  .item-controls {
    justify-content: space-between;
  }

  .remark-input {
    flex: 1;
    min-width: 80px;
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

  .validation-error-item {
    padding: 8px 10px;
  }

  .item-controls {
    flex-wrap: wrap;
  }

  .quantity-control {
    flex: 1;
  }

  .remark-input {
    flex: 1;
    min-width: 60px;
  }

  .selected-items-list {
    max-height: 180px;
  }
}
</style>