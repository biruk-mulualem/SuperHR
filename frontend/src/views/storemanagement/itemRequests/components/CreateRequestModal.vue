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
          <!-- STORE SELECTION -->
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
                  :class="{ 'searching': isSearching }"
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
                  @change="onItemSelect"
                  :disabled="isSearching"
                >
                  <option value="">
                    {{
                      isSearching ? 'Searching...' :
                      itemSearch ? (items.length === 0 ? 'No matching items found' : `Select an item (${items.length} results)`) :
                      'Type to search for items...'
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
                    {{ isItemAlreadySelected(item) ? '(added)' : '' }}
                  </option>
                </select>
                <button
                  type="button"
                  class="btn-add-item"
                  @click="addSelectedItem"
                  :disabled="!selectedItemId || isItemAlreadySelectedById(selectedItemId) || isSearching"
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
                  {{ isLoadingMore ? 'Loading...' : `Load more (${items.length}/${totalItems})` }}
                </button>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- SELECTED ITEMS - UOM & QTY Always Visible -->
            <!-- ============================================================ -->
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
                  class="selected-item-wrapper"
                >
                  <!-- ========================================================== -->
                  <!-- COMPACT VIEW - UOM & QTY always visible -->
                  <!-- ========================================================== -->
                  <div class="selected-item-compact">
                    <!-- Left: Expand icon + Item info -->
                    <div 
                      class="compact-left"
                      @click="toggleItemExpand(item.itemId)"
                    >
                      <span class="expand-icon">
                        {{ expandedItems.has(item.itemId) ? '▼' : '▶' }}
                      </span>
                      <span class="item-code">{{ item.code }}</span>
                      <span class="item-name">{{ item.name }}</span>
                    </div>

                    <!-- Right: UOM + QTY (always visible) -->
                    <div class="compact-right">
                      <div class="compact-uom-group">
                        <select 
                          v-model="item.selectedUom" 
                          @change.stop="onUomChange(item)"
                          class="compact-uom-select"
                        >
                          <option value="base">{{ getBaseUOM(item) }}</option>
                          <option 
                            v-if="getConversionUOM(item) !== 'N/A'" 
                            value="conversion"
                            :disabled="getConversionUOM(item) === getBaseUOM(item)"
                          >
                            {{ getConversionUOM(item) }}
                          </option>
                        </select>
                      </div>
                      
                      <div class="compact-qty-group">
                        <button
                          type="button"
                          class="compact-qty-btn"
                          @click.stop="adjustQuantity(item.itemId, -0.01)"
                          :disabled="item.quantity <= 0.01"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          :value="item.quantity"
                          @input.stop="updateQuantity(item.itemId, ($event.target as HTMLInputElement)?.value ?? '')"
                          min="0.01"
                          step="0.01"
                          class="compact-qty-input"
                        />
                        <button
                          type="button"
                          class="compact-qty-btn"
                          @click.stop="adjustQuantity(item.itemId, 0.01)"
                        >
                          +
                        </button>
                        <span class="compact-qty-uom">{{ getSelectedUomLabel(item) }}</span>
                      </div>

                      <button
                        type="button"
                        class="remove-btn-compact"
                        @click.stop="removeSelectedItem(item.itemId)"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- ========================================================== -->
                  <!-- EXPANDED VIEW - Only Spec, Brand, Model, Remark -->
                  <!-- ========================================================== -->
                  <div 
                    v-show="expandedItems.has(item.itemId)"
                    class="selected-item-expanded"
                  >
                    <!-- Remark -->
                    <div class="expanded-row-remark">
                      <div class="control-group full-width">
                        <label class="control-label">REMARK</label>
                        <input
                          type="text"
                          :value="item.remark"
                         
                          @input="updateItemField(item.itemId, 'remark', ($event.target as HTMLInputElement)?.value ?? '')"
                          placeholder="Add remark..."
                          class="remark-input"
                        />
                      </div>
                    </div>

                    <!-- Specification, Brand, Model -->
                    <div class="expanded-row-specs">
                      <div class="spec-field">
                        <label class="spec-label">SPECIFICATION</label>
                        <input
                          type="text"
                          :value="item.specification"
                          @input="updateItemField(item.itemId, 'specification', ($event.target as HTMLInputElement)?.value ?? '')"
                          placeholder="Enter specification..."
                          class="spec-input"
                        />
                      </div>
                      <div class="spec-field">
                        <label class="spec-label">BRAND</label>
                        <input
                          type="text"
                          :value="item.brand"
                          @input="updateItemField(item.itemId, 'brand', ($event.target as HTMLInputElement)?.value ?? '')"
                          placeholder="Enter brand..."
                          class="spec-input"
                        />
                      </div>
                      <div class="spec-field">
                        <label class="spec-label">MODEL</label>
                        <input
                          type="text"
                          :value="item.model"
                          @input="updateItemField(item.itemId, 'model', ($event.target as HTMLInputElement)?.value ?? '')"
                          placeholder="Enter model..."
                          class="spec-input"
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
import { ref, computed, watch, onBeforeUnmount, onMounted } from "vue";
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
const isSearching = ref(false);
const isLoadingMore = ref(false);
const hasMoreItems = ref(true);
const totalItems = ref(0);
const searchPage = ref(1);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const searchCache = ref<Map<string, { items: Item[]; total: number; page: number }>>(new Map());

const userAssignedStoreId = ref<number | null>(null);
const userAssignedStoreName = ref<string | null>(null);
const userIsAdmin = ref(false);

const validationErrors = ref<any[]>([]);
const validationMessage = ref<string>("");
const showValidationErrors = ref(false);

// ✅ Track which items are expanded
const expandedItems = ref<Set<number>>(new Set());

const form = ref({
  askingStoreId: "",
  supplyingStoreId: "",
  items: [] as (RequestItem & { 
    selectedUom?: 'base' | 'conversion';
    uomCode?: string;
    isBaseUom?: boolean;
    specification?: string;
    brand?: string;
    model?: string;
  })[],
  requestedBy: "",
  requestedDate: "",
  status: "pending" as "pending" | "approved" | "rejected",
  remark: "",
  isAsset: false,
});

const formErrors = ref<string[]>([]);

const selectedItemId = ref<string>("");
const itemSearch = ref("");
const selectedItems = ref<Map<number, { 
  itemId: number; 
  code: string; 
  name: string; 
  quantity: number;
  remark: string;
  conversionValue?: number;
  selectedUom?: 'base' | 'conversion';
  _baseUom?: string;
  _convUom?: string;
  specification?: string;
  brand?: string;
  model?: string;
}>>(new Map());

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

const itemMap = computed(() => {
  const map = new Map<number, Item>();
  
  items.value.forEach(item => {
    const id = Number(item.itemId ?? item.id);
    if (id > 0) {
      map.set(id, item);
    }
  });
  
  selectedItems.value.forEach((selected, id) => {
    if (!map.has(id)) {
      map.set(id, {
        id: id,
        itemId: id,
        code: selected.code || 'N/A',
        name: selected.name || 'Unknown',
        standardName: selected.name || '',
        uom: { code: selected._baseUom || 'N/A' },
        conversionUom: { code: selected._convUom || 'N/A' },
        conversionValue: selected.conversionValue || 1,
        specText: selected.specification || '',
        brand: selected.brand || '',
        model: selected.model || '',
      } as any);
    }
  });
  
  if (props.editingRequest && props.editingRequest.items) {
    props.editingRequest.items.forEach((item: any) => {
      const id = Number(item.itemId || item.id || 0);
      if (id > 0 && !map.has(id)) {
        const baseUom = item.uom_code || item.uomCode || item.uom?.code || 'N/A';
        const convUom = item.conversion_uom_code || item.conversionUomCode || item.conversionUom?.code || 'N/A';
        
        map.set(id, {
          id: id,
          itemId: id,
          code: item.code || item.itemCode || 'N/A',
          name: item.name || item.itemName || 'Unknown',
          standardName: item.standardName || '',
          uom: { code: baseUom },
          conversionUom: { code: convUom },
          conversionValue: item.conversionValue || 1,
          specText: item.specification || item.specText || '',
          brand: item.brand || '',
          model: item.model || '',
        } as any);
      }
    });
  }
  
  return map;
});

const selectedItemsList = computed(() => {
  return Array.from(selectedItems.value.values()).map(item => {
    const fullItem = itemMap.value.get(item.itemId);
    if (fullItem) {
      const updatedItem = {
        ...item,
        _baseUom: getBaseUOM(fullItem),
        _convUom: getConversionUOM(fullItem),
        conversionValue: fullItem.conversionValue || 1,
        specification: item.specification || (fullItem as any).specText || '',
        brand: item.brand || (fullItem as any).brand || '',
        model: item.model || (fullItem as any).model || '',
      };
      
      if (fullItem.code && (item.code === 'N/A' || item.code === '')) {
        updatedItem.code = fullItem.code;
      }
      if (fullItem.name && (item.name === 'Unknown' || item.name === '')) {
        updatedItem.name = fullItem.standardName || fullItem.name;
      }
      
      return updatedItem;
    }
    return item;
  });
});

const isFormValid = computed(() => {
  if (selectedItemsList.value.length === 0) return false;
  const allValid = selectedItemsList.value.every(item => item.quantity > 0);
  if (!allValid) return false;
  return !!((( 
    form.value.askingStoreId &&
    form.value.supplyingStoreId &&
    form.value.requestedBy &&
    form.value.requestedDate
  )));
});

// ================================================================
// UOM HELPER METHODS
// ================================================================

const getBaseUOM = (item: any): string => {
  if (!item) return 'N/A';
  
  if (item._baseUom) return item._baseUom;
  if (item.baseUom) return item.baseUom;
  
  let target = item;
  if (item.itemId) {
    const cachedItem = itemMap.value.get(item.itemId);
    if (cachedItem) {
      target = cachedItem;
    }
  }
  
  if (target.uom) {
    if (typeof target.uom === 'object' && target.uom.code) {
      return target.uom.code;
    }
    if (typeof target.uom === 'string') return target.uom;
  }
  
  if (target.uomCode) return target.uomCode;
  if (target.uom_code) return target.uom_code;
  
  return 'N/A';
};

const getConversionUOM = (item: any): string => {
  if (!item) return 'N/A';
  
  if (item._convUom) return item._convUom;
  if (item.convUom) return item.convUom;
  
  let target = item;
  if (item.itemId) {
    const cachedItem = itemMap.value.get(item.itemId);
    if (cachedItem) {
      target = cachedItem;
    }
  }
  
  if (target.conversionUom) {
    if (typeof target.conversionUom === 'object' && target.conversionUom.code) {
      return target.conversionUom.code;
    }
    if (typeof target.conversionUom === 'string') return target.conversionUom;
  }
  
  if (target.conversionUomCode) return target.conversionUomCode;
  if (target.conversion_uom_code) return target.conversion_uom_code;
  
  if (target.conversionUomId) {
    for (const i of items.value) {
      if (i.uom && i.uom.uomId === target.conversionUomId) {
        return i.uom.code || i.uom.name || 'N/A';
      }
      if (i.conversionUom && i.conversionUom.uomId === target.conversionUomId) {
        return i.conversionUom.code || i.conversionUom.name || 'N/A';
      }
    }
  }
  
  return 'N/A';
};

const getSelectedUomLabel = (item: any): string => {
  if (item.selectedUom === 'conversion') {
    const convUom = getConversionUOM(item);
    return convUom !== 'N/A' ? convUom : getBaseUOM(item);
  }
  return getBaseUOM(item);
};

// ================================================================
// COLLAPSIBLE FUNCTIONS
// ================================================================

const toggleItemExpand = (itemId: number): void => {
  if (expandedItems.value.has(itemId)) {
    expandedItems.value.delete(itemId);
  } else {
    expandedItems.value.add(itemId);
  }
  // Trigger reactivity
  expandedItems.value = new Set(expandedItems.value);
};

// ================================================================
// SERVER-SIDE SEARCH
// ================================================================

const loadItems = async (searchQuery: string = "", page: number = 1, append: boolean = false) => {
  try {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery && !append) {
      items.value = [];
      hasMoreItems.value = false;
      totalItems.value = 0;
      searchPage.value = 1;
      return;
    }

    if (page === 1) {
      isSearching.value = true;
    } else {
      isLoadingMore.value = true;
    }

    const cacheKey = `${trimmedQuery}_${page}`;
    if (page === 1 && searchCache.value.has(cacheKey) && !append) {
      const cached = searchCache.value.get(cacheKey)!;
      items.value = cached.items;
      totalItems.value = cached.total;
      searchPage.value = cached.page;
      hasMoreItems.value = cached.items.length < cached.total;
      isSearching.value = false;
      return;
    }

    const response = await itemRequestService.getActiveItems({
      search: trimmedQuery,
      page: page,
      limit: 20
    });

    if (response.success) {
      const responseItems = response.data || [];
      const pagination = response.pagination;
      
      if (append) {
        const existingIds = new Set(items.value.map(i => Number(i.itemId ?? i.id)));
        const newItems = responseItems.filter(i => !existingIds.has(Number(i.itemId ?? i.id)));
        items.value = [...items.value, ...newItems];
      } else {
        items.value = responseItems;
        searchCache.value.set(cacheKey, {
          items: responseItems,
          total: pagination?.total || 0,
          page: page
        });
      }

      if (pagination) {
        totalItems.value = pagination.total;
        searchPage.value = pagination.page;
        hasMoreItems.value = pagination.page < pagination.pages;
      } else {
        hasMoreItems.value = false;
      }
    } else {
      if (!append) {
        items.value = [];
        hasMoreItems.value = false;
        totalItems.value = 0;
      }
    }
  } catch (error) {
    console.error("Load items error:", error);
    if (!append) {
      items.value = [];
      hasMoreItems.value = false;
      totalItems.value = 0;
    }
  } finally {
    if (page === 1) {
      isSearching.value = false;
    } else {
      isLoadingMore.value = false;
    }
  }
};

const loadMoreItems = async () => {
  if (isLoadingMore.value || !hasMoreItems.value) return;
  const nextPage = searchPage.value + 1;
  const trimmedQuery = itemSearch.value.trim();
  if (!trimmedQuery) return;
  await loadItems(trimmedQuery, nextPage, true);
};

const clearSearch = () => {
  itemSearch.value = "";
  selectedItemId.value = "";
};

// ================================================================
// WATCH: Search with Debounce
// ================================================================

watch(itemSearch, (newQuery) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }

  const trimmedQuery = newQuery.trim();

  if (!trimmedQuery) {
    items.value = [];
    hasMoreItems.value = false;
    totalItems.value = 0;
    searchPage.value = 1;
    searchCache.value.clear();
    return;
  }

  searchTimeout = setTimeout(() => {
    loadItems(trimmedQuery, 1, false);
  }, 500);
});

// ================================================================
// ITEM SELECTION METHODS
// ================================================================

const getItemId = (item: any): number => {
  return Number(item?.itemId ?? item?.id ?? 0);
};

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

const onItemSelect = (): void => {};

// ================================================================
// UPDATE ITEM FIELD
// ================================================================

const updateItemField = (itemId: number, field: string, value: string): void => {
  const item = selectedItems.value.get(itemId);
  if (!item) {
    console.warn(`⚠️ Item ${itemId} not found in selectedItems`);
    return;
  }
  
  const validFields = ['specification', 'brand', 'model', 'remark'];
  if (!validFields.includes(field)) {
    console.warn(`⚠️ Invalid field: ${field}`);
    return;
  }
  
  const updatedItem = {
    ...item,
    [field]: value,
  };
  
  selectedItems.value.set(itemId, updatedItem);
  console.log(`🔄 Updated item ${itemId} ${field}: "${value}"`);
  syncSelectedItemsToForm();
};

const updateQuantity = (itemId: number, value: string): void => {
  const item = selectedItems.value.get(itemId);
  if (!item) return;
  
  let newQty = parseFloat(value);
  if (isNaN(newQty) || newQty < 0.01) newQty = 0.01;
  newQty = Math.round(newQty * 100) / 100;
  
  selectedItems.value.set(itemId, { ...item, quantity: newQty });
  syncSelectedItemsToForm();
};

const onUomChange = (item: any): void => {
  item.quantity = 1;
  const existing = selectedItems.value.get(item.itemId);
  if (existing) {
    selectedItems.value.set(item.itemId, { 
      ...existing, 
      selectedUom: item.selectedUom,
      quantity: 1,
    });
    syncSelectedItemsToForm();
  }
};

// ================================================================
// ADD SELECTED ITEM
// ================================================================

const addSelectedItem = (): void => {
  if (!selectedItemId.value) return;

  const id = Number(selectedItemId.value);
  if (!Number.isFinite(id) || id <= 0) return;
  if (selectedItems.value.has(id)) return;

  const item = items.value.find(
    i => Number(i.itemId ?? i.id) === id
  );

  if (!item) return;

  const baseUom = getBaseUOM(item);
  const convUom = getConversionUOM(item);
  const specText = (item as any).specText || '';
  const brand = (item as any).brand || '';
  const model = (item as any).model || '';

  selectedItems.value.set(id, {
    itemId: id,
    code: item.code || "",
    name: item.standardName || item.name || "Unknown",
    quantity: 1,
    remark: "",
    conversionValue: (item as any).conversionValue ?? 1,
    selectedUom: 'base',
    _baseUom: baseUom,
    _convUom: convUom,
    specification: specText || '',
    brand: brand || '',
    model: model || '',
  });

  selectedItemId.value = "";
  syncSelectedItemsToForm();
};

// ================================================================
// ITEM MANAGEMENT METHODS
// ================================================================

const adjustQuantity = (itemId: number, delta: number): void => {
  const item = selectedItems.value.get(itemId);
  if (!item) return;
  
  let newQty = Math.round((item.quantity + delta) * 100) / 100;
  if (newQty < 0.01) newQty = 0.01;
  
  selectedItems.value.set(itemId, { ...item, quantity: newQty });
  syncSelectedItemsToForm();
};

const removeSelectedItem = (itemId: number): void => {
  selectedItems.value.delete(itemId);
  expandedItems.value.delete(itemId);
  syncSelectedItemsToForm();
};

const clearAllItems = (): void => {
  if (selectedItemsList.value.length === 0) return;
  if (confirm("Remove all items from this request?")) {
    selectedItems.value.clear();
    expandedItems.value.clear();
    syncSelectedItemsToForm();
  }
};

// ================================================================
// SYNC SELECTED ITEMS TO FORM
// ================================================================

const syncSelectedItemsToForm = (): void => {
  const items = Array.from(selectedItems.value.values()).map(item => {
    const baseUom = getBaseUOM(item);
    const convUom = getConversionUOM(item);
    
    let uomCode = '';
    let isBaseUom = true;
    
    if (item.selectedUom === 'conversion' && convUom !== 'N/A') {
      uomCode = convUom;
      isBaseUom = false;
    } else {
      uomCode = baseUom;
      isBaseUom = true;
    }
    
    return {
      itemId: item.itemId,
      quantity: item.quantity,
      remark: item.remark || "",
      selectedUom: item.selectedUom || 'base',
      uomCode: uomCode,
      isBaseUom: isBaseUom,
      specification: item.specification || "",
      brand: item.brand || "",
      model: item.model || "",
    };
  });
  
  form.value.items = items as any;
};

// ================================================================
// HELPER METHODS
// ================================================================

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
      const selectedItem = selectedItems.value.get(item.itemId);
      
      let itemName = 'Unknown Item';
      let itemCode = 'N/A';
      
      if (selectedItem) {
        itemName = selectedItem.name || 'Unknown Item';
        itemCode = selectedItem.code || 'N/A';
      } else {
        const fullItem = itemMap.value.get(item.itemId);
        if (fullItem) {
          itemName = fullItem.standardName || fullItem.name || 'Unknown Item';
          itemCode = fullItem.code || 'N/A';
        }
      }
      
      formErrors.value.push(
        `⚠️ "${itemName}" (${itemCode}) is already added.`
      );
    });
    
    validationErrors.value = duplicateItems.map(item => {
      const selectedItem = selectedItems.value.get(item.itemId);
      let itemName = 'Unknown Item';
      let itemCode = 'N/A';
      
      if (selectedItem) {
        itemName = selectedItem.name || 'Unknown Item';
        itemCode = selectedItem.code || 'N/A';
      } else {
        const fullItem = itemMap.value.get(item.itemId);
        if (fullItem) {
          itemName = fullItem.standardName || fullItem.name || 'Unknown Item';
          itemCode = fullItem.code || 'N/A';
        }
      }
      
      return {
        itemId: item.itemId,
        itemName: itemName,
        itemCode: itemCode,
        requestedQuantity: item.quantity,
        message: 'This item is already added to the request. Please remove the duplicate entry.'
      };
    });
    
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
      items: form.value.items.map((item: any) => ({
        itemId: Number(item.itemId),
        quantity: item.quantity,
        remark: item.remark || "",
        selectedUom: item.selectedUom || 'base',
        uomCode: item.uomCode || '',
        isBaseUom: item.selectedUom !== 'conversion',
        specification: item.specification || "",
        brand: item.brand || "",
        model: item.model || "",
      })),
      requestedById: userId,
      requestedBy: form.value.requestedBy,
      requestedDate: form.value.requestedDate,
      status: form.value.status as "pending" | "approved" | "rejected",
      remark: form.value.remark,
      isAsset: form.value.isAsset,
    };

    console.log('📤 Sending to backend:', JSON.stringify(requestData, null, 2));

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
        if (errorMsg) {
          console.error('Save error:', errorMsg);
        }
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
    } else {
      formErrors.value.push(errorData?.error || error.message || 'Failed to save request');
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
// CLEANUP
// ================================================================

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
});

// ================================================================
// INITIALIZE FORM
// ================================================================

const initializeForm = () => {
  const today: string = new Date().toISOString().split("T")[0] || "";
  
  selectedItems.value.clear();
  expandedItems.value.clear();
  
  if (props.editingRequest) {
    const req = props.editingRequest;
    const requestedDate: string = String(req.requestedDate || today);
    
    console.log('📝 Editing request:', req);
    console.log('📝 Items to edit:', req.items);
    
    if (req.items && req.items.length > 0) {
      req.items.forEach((item: any) => {
        const itemId = Number(item.itemId || item.id || 0);
        
        if (itemId > 0) {
          const baseUom = item.uom_code || 
                          item.item?.uom?.code || 
                          item.uomCode || 
                          'N/A';
          
          const convUom = item.conversion_uom_code || 
                          item.item?.conversionUom?.code || 
                          item.conversionUomCode || 
                          'N/A';
          
          const specification = item.specification || 
                               item.item?.specText || 
                               item.specText || 
                               '';
          
          const brand = item.brand || 
                       item.item?.brand || 
                       '';
          
          const model = item.model || 
                       item.item?.model || 
                       '';
          
          const itemName = item.item?.name || 
                          item.itemName || 
                          item.name || 
                          'Unknown';
          
          const itemCode = item.item?.code || 
                          item.itemCode || 
                          item.code || 
                          'N/A';
          
          selectedItems.value.set(itemId, {
            itemId: itemId,
            code: itemCode,
            name: itemName,
            quantity: Number(item.quantity) || 1,
            remark: item.remark || "",
            conversionValue: item.conversionValue || 1,
            selectedUom: item.selected_uom || 'base',
            _baseUom: baseUom,
            _convUom: convUom,
            specification: specification,
            brand: brand,
            model: model,
          });
        }
      });
    }
    
    form.value = {
      askingStoreId: String(req.askingStoreId || userAssignedStoreId.value || ""),
      supplyingStoreId: String(req.supplyingStoreId || ""),
      items: req.items ? req.items.map((item: any) => ({
        itemId: Number(item.itemId || item.id || 0),
        quantity: item.quantity || 1,
        remark: item.remark || "",
        selectedUom: item.selected_uom || 'base',
        uomCode: item.uom_code || item.uomCode || '',
        isBaseUom: item.is_base_uom !== false,
        specification: item.specification || item.item?.specText || '',
        brand: item.brand || item.item?.brand || '',
        model: item.model || item.item?.model || '',
      })) : [],
      requestedBy: req.requestedByUser?.fullName || 
                   req.requestedByUser?.username || 
                   req.requestedBy || 
                   getCurrentUser(),
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
  items.value = [];
  searchCache.value.clear();
  hasMoreItems.value = false;
  totalItems.value = 0;
  searchPage.value = 1;
  formErrors.value = [];
  closeValidationErrors();
  
  syncSelectedItemsToForm();
};

// ================================================================
// LIFECYCLE
// ================================================================

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadUserData();
      loadStores();
      
      if (props.editingRequest) {
        itemRequestService.getActiveItems({ limit: 1 })
          .then(() => {
            initializeForm();
          })
          .catch(() => {
            initializeForm();
          });
      } else {
        initializeForm();
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadUserData();
  loadStores();
});
</script>

<style scoped>
/* ================================================================ */
/* COMPACT VIEW - UOM & QTY Always Visible */
/* ================================================================ */

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
  flex: 0 0 auto;
  cursor: pointer;
  min-width: 0;
}

.expand-icon {
  font-size: 10px;
  color: #94a3b8;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  transition: transform 0.2s;
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
  flex: 1;
  min-width: 60px;
}

.compact-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* UOM Select */
.compact-uom-group {
  flex-shrink: 0;
}

.compact-uom-select {
  padding: 3px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 11px;
  background: white;
  cursor: pointer;
  min-width: 50px;
  height: 30px;
}

.compact-uom-select:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Quantity Controls */
.compact-qty-group {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  padding: 1px 2px;
  flex-shrink: 0;
}

.compact-qty-btn {
  background: transparent;
  border: none;
  padding: 0 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  border-radius: 3px;
  min-width: 20px;
  height: 26px;
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
  width: 40px;
  text-align: center;
  border: none;
  background: transparent;
  padding: 2px 2px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.compact-qty-input:focus {
  outline: none;
  background: #ffffff;
  border-radius: 3px;
}

.compact-qty-input::-webkit-inner-spin-button,
.compact-qty-input::-webkit-outer-spin-button {
  opacity: 0.5;
  height: 16px;
}

.compact-qty-input[type="number"] {
  -moz-appearance: textfield;
}

.compact-qty-uom {
  font-size: 9px;
  color: #475569;
  font-weight: 600;
  padding: 0 6px;
  min-width: 28px;
  text-align: center;
  background: #f1f5f9;
  border-radius: 3px;
  padding: 2px 6px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* Remove Button */
.remove-btn-compact {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  font-size: 14px;
  transition: all 0.2s;
  border-radius: 4px;
  flex-shrink: 0;
}

.remove-btn-compact:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* ================================================================ */
/* EXPANDED VIEW - Only Spec, Brand, Model, Remark */
/* ================================================================ */

.selected-item-expanded {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 10px 14px 14px 14px;
  animation: slideDown 0.2s ease;
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

.expanded-row-remark {
  margin-bottom: 10px;
}

.expanded-row-specs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.control-group.full-width {
  grid-column: 1 / -1;
}

.control-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.spec-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.spec-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.remark-input {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
  width: 100%;
}

.remark-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
}

.spec-input {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
  width: 100%;
}

.spec-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
}

/* ================================================================ */
/* MODAL OVERLAY & HEADER */
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
  animation: spin 1s linear infinite;
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

@keyframes spin {
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(360deg); }
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
/* SELECTED ITEMS CONTAINER */
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

/* ================================================================ */
/* EMPTY ITEMS MESSAGE */
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

/* ================================================================ */
/* VALIDATION ERRORS */
/* ================================================================ */

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

.validation-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

/* ================================================================ */
/* FORM ERRORS */
/* ================================================================ */

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
    padding: 6px 10px;
  }

  .compact-left {
    flex: 1;
    min-width: 100px;
  }

  .compact-right {
    flex-wrap: wrap;
    gap: 4px;
    width: 100%;
    justify-content: flex-start;
    padding-top: 2px;
  }

  .expanded-row-specs {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .add-wrapper {
    flex-direction: column;
  }

  .btn-add-item {
    width: 100%;
    justify-content: center;
  }

  .compact-qty-input {
    width: 35px;
  }

  .compact-uom-select {
    min-width: 40px;
    font-size: 10px;
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

  .selected-item-compact {
    padding: 4px 8px;
  }

  .compact-left {
    min-width: 60px;
  }

  .item-code {
    font-size: 10px;
    padding: 1px 6px;
  }

  .item-name {
    font-size: 11px;
  }

  .compact-qty-group {
    padding: 1px;
  }

  .compact-qty-btn {
    padding: 0 4px;
    min-width: 16px;
    height: 22px;
    font-size: 11px;
  }

  .compact-qty-input {
    width: 30px;
    font-size: 11px;
  }

  .compact-qty-uom {
    font-size: 8px;
    padding: 1px 4px;
    min-width: 20px;
  }

  .compact-uom-select {
    font-size: 9px;
    padding: 2px 4px;
    min-width: 35px;
    height: 24px;
  }

  .selected-items-list {
    max-height: 280px;
  }

  .search-input {
    font-size: 12px;
    padding: 5px 10px 5px 30px;
  }

  .search-icon-small {
    font-size: 12px;
    left: 8px;
  }

  .search-spinner {
    font-size: 12px;
    right: 8px;
  }

  .search-results-count {
    font-size: 9px;
    padding: 1px 6px;
  }

  .btn-load-more {
    font-size: 11px;
    padding: 3px 12px;
  }
}

/* ================================================================ */
/* COMPACT VIEW - UOM & QTY Always Visible - WIDER QTY */
/* ================================================================ */

.compact-qty-input {
  width: 60px;  /* ✅ Changed from 40px to 60px */
  text-align: center;
  border: none;
  background: transparent;
  padding: 2px 4px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  min-width: 45px;  /* ✅ Added min-width */
}

.compact-qty-input:focus {
  outline: none;
  background: #ffffff;
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.compact-qty-input::-webkit-inner-spin-button,
.compact-qty-input::-webkit-outer-spin-button {
  opacity: 0.5;
  height: 20px;
}

.compact-qty-input[type="number"] {
  -moz-appearance: textfield;
}

.compact-qty-input {
  width: 100px;  /* ✅ Wider - enough for 8-10 digits */
  min-width: 70px;
  max-width: 140px;
  text-align: center;
  border: none;
  background: transparent;
  padding: 2px 8px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}
</style>