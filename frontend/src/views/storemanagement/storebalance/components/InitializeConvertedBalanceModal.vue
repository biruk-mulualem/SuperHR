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
        <!-- Tabs -->
        <div class="init-tabs">
          <button
            class="init-tab"
            :class="{ active: activeTab === 'manual' }"
            @click="activeTab = 'manual'"
          >
            ✍️ Manual
          </button>
          <button
            class="init-tab"
            :class="{ active: activeTab === 'import' }"
            @click="activeTab = 'import'"
          >
            📥 Import
          </button>
        </div>

        <!-- ============================================================ -->
        <!-- MANUAL TAB -->
        <!-- ============================================================ -->
        <div v-if="activeTab === 'manual'">
          <div class="init-info">
            <span class="info-icon">ℹ️</span>
            <span>Set up initial converted stock balance for a specific item in a store.</span>
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

                <!-- 🔥 Search using itemRequestService -->
                <div class="item-search-wrapper">
                  <input
                    type="text"
                    v-model="itemSearchQuery"
                    placeholder="Search items by code or name..."
                    @input="onSearchInput"
                    class="item-search-input"
                  />
                  <span v-if="isSearching" class="search-spinner">⏳</span>
                  <span v-else-if="itemSearchQuery && items.length > 0" class="search-results-count">
                    {{ items.length }} results
                  </span>
                </div>

                <!-- Item List -->
                <div v-if="itemSearchQuery" class="item-select-container" ref="itemSelectContainer">
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
                        <span class="item-option-name">{{ item.name || item.standardName || 'Unnamed' }}</span>
                        <span class="item-option-uom">{{ getItemUOM(item) }}</span>
                        <span v-if="item.conversionUomId" class="item-option-conversion">
                          🔄 {{ getConversionDisplay(item) }}
                        </span>
                      </div>
                    </div>

                    <div v-else-if="!isSearching" class="item-no-results">
                      No items found matching your search
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
                  <span class="selected-item-code">{{ selectedItemDisplay.code }}</span>
                  <span class="selected-item-name">
                    {{ selectedItemDisplay.name || selectedItemDisplay.standardName || 'Unnamed' }}
                  </span>
                  <span class="selected-item-uom">
                    ({{ getItemUOM(selectedItemDisplay) }})
                  </span>
                  <span v-if="selectedItemDisplay.conversionUomId" class="selected-item-conversion">
                    🔄 {{ getConversionDisplay(selectedItemDisplay) }}
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

            <!-- Balance -->
            <div class="form-row">
              <div class="form-group">
                <label>Converted Balance ({{ getConvertedUOM(form.itemId) }}) *</label>
                <input
                  v-model.number="form.convertedBalance"
                  type="number"
                  required
                  placeholder="0"
                  min="0"
                  step="1"
                />
                <span class="hint" v-if="form.itemId">
                  In {{ getConvertedUOM(form.itemId) }}
                </span>
              </div>
            </div>
          </form>
        </div>

        <!-- ============================================================ -->
        <!-- IMPORT TAB -->
        <!-- ============================================================ -->
        <div v-if="activeTab === 'import'">
          <!-- ... import tab content ... -->
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose" :disabled="importing || saving">
          Cancel
        </button>
        <button
          v-if="activeTab === 'manual'"
          class="btn-primary"
          @click="saveBalance"
          :disabled="saving || !form.itemId || importing"
        >
          {{ saving ? 'Saving...' : 'Initialize' }}
        </button>
        <button
          v-if="activeTab === 'import'"
          class="btn-primary"
          @click="processImport"
          :disabled="!csvFile || importing || importPreviewData.length === 0"
        >
          {{ importing ? 'Importing...' : 'Import Balances' }}
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import itemRequestService from '@/stores/itemRequestService';
import convertedBalanceService from '@/stores/convertedBalanceService';

// ================================================================
// PROPS
// ================================================================

const props = defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    default: () => ({}),
  },
  storeId: {
    type: Number,
    default: null,
  },
  groupId: {
    type: Number,
    default: null,
  },
  storeName: {
    type: String,
    default: '',
  },
  groupName: {
    type: String,
    default: '',
  },
  stores: {
    type: Array,
    default: () => [],
  },
  groups: {
    type: Array,
    default: () => [],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  inventoryItems: {
    type: [Array, Object],
    default: () => [],
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

// ================================================================
// EMITS
// ================================================================

const emit = defineEmits(['close', 'success', 'update:visible']);

// ================================================================
// STATE
// ================================================================

const activeTab = ref('manual');
const saving = ref(false);
const importing = ref(false);
const isDragOver = ref(false);
const isSearching = ref(false);

const form = ref({
  storeId: null,
  groupId: null,
  itemId: '',
  convertedBalance: 0,
});

const itemSearchQuery = ref('');
const items = ref([]);
const itemDisplayLimit = ref(10);
const selectedItemDisplay = ref(null);
const itemSelectContainer = ref(null);

let searchTimeout = null;
let searchPage = ref(1);
let hasMoreItems = ref(false);
let totalItemsCount = ref(0);
let searchTotal = ref(0);

// Import State
const csvFile = ref(null);
const csvFileInput = ref(null);
const importPreviewData = ref([]);
const importResults = ref(null);
const importProgress = ref({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0,
  remaining: 0,
  percentage: 0,
});

// Toast State
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimeout = null;

// ================================================================
// COMPUTED
// ================================================================

const displayedItems = computed(() => {
  return items.value.slice(0, itemDisplayLimit.value);
});

// ================================================================
// METHODS - Toast
// ================================================================

const showToastMessage = (msg, type = 'success') => {
  // Clear any existing toast timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  
  // Auto-hide toast after 4 seconds
  toastTimeout = setTimeout(() => {
    showToast.value = false;
    toastTimeout = null;
  }, 4000);
};

// ================================================================
// METHODS - Modal Close
// ================================================================

const closeModal = () => {
  if (importing.value) return;
  
  // Clear toast
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
  showToast.value = false;
  
  emit('update:visible', false);
  emit('close');
};

const handleClose = () => {
  closeModal();
};

const handleOverlayClick = () => {
  closeModal();
};

// ================================================================
// METHODS - Search Items
// ================================================================

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  
  const query = itemSearchQuery.value.trim();
  
  if (!query) {
    items.value = [];
    selectedItemDisplay.value = null;
    searchTotal.value = 0;
    return;
  }
  
  searchPage.value = 1;
  items.value = [];
  
  searchTimeout = setTimeout(() => {
    searchItems(query);
  }, 300);
};

const searchItems = async (query) => {
  if (!query) return;
  
  isSearching.value = true;
  
  try {
    const response = await itemRequestService.getActiveItems({
      search: query,
      page: searchPage.value,
      limit: 20
    });
    
    if (response.success) {
      const itemsData = response.data || [];
      
      if (searchPage.value === 1) {
        items.value = itemsData;
      } else {
        items.value = [...items.value, ...itemsData];
      }
      
      searchTotal.value = response.pagination?.total || itemsData.length;
      hasMoreItems.value = itemsData.length === 20 && (searchPage.value * 20) < searchTotal.value;
      totalItemsCount.value = searchTotal.value;
    } else {
      items.value = [];
      showToastMessage(response.error || 'Failed to search items', 'error');
    }
  } catch (error) {
    console.error('Error searching items:', error);
    showToastMessage('Failed to search items', 'error');
  } finally {
    isSearching.value = false;
  }
};

const onItemScroll = (event) => {
  const element = event.target;
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 50) {
    if (hasMoreItems.value && !isSearching.value) {
      searchPage.value++;
      searchItems(itemSearchQuery.value.trim());
    }
  }
};

// ================================================================
// METHODS - Item Selection
// ================================================================

const selectItem = (item) => {
  form.value.itemId = item.id || item.itemId;
  selectedItemDisplay.value = item;
  itemSearchQuery.value = item.code || item.name || '';
  items.value = [];
  searchTotal.value = 0;
};

const clearItemSelection = () => {
  form.value.itemId = '';
  selectedItemDisplay.value = null;
  itemSearchQuery.value = '';
  items.value = [];
  searchTotal.value = 0;
};

// ================================================================
// HELPERS - Item Display
// ================================================================

const getItemUOM = (item) => {
  if (!item) return 'N/A';
  if (item.uom?.code) return item.uom.code;
  if (item.uomCode) return item.uomCode;
  if (item.uom_code) return item.uom_code;
  return 'N/A';
};

const getConversionDisplay = (item) => {
  if (!item) return '';
  const conversionValue = item.conversionValue || item.conversion_value || 1;
  const conversionUom = item.conversionUom?.code || item.conversionUomCode || item.conversion_uom_code || '';
  const baseUom = getItemUOM(item);
  
  if (conversionUom && conversionValue > 1) {
    return `${conversionValue} ${conversionUom} = 1 ${baseUom}`;
  }
  return '';
};

const getItemCommonName = (itemId) => {
  if (!itemId) return null;
  const item = items.value.find((i) => i.id === itemId || i.itemId === itemId);
  return item ? item.name || item.standardName || null : null;
};

const getItemNameByCode = (itemCode) => {
  if (!itemCode) return null;
  const item = items.value.find((i) => i.code === itemCode);
  return item ? item.name || item.standardName || null : null;
};

const getStoreName = (storeId) => {
  if (!storeId) return 'Unknown';
  const store = props.stores.find((s) => Number(s.id) === Number(storeId));
  return store ? store.name : 'Unknown';
};

const getGroupName = (groupId) => {
  if (!groupId) return 'Unknown';
  const group = props.groups.find((g) => Number(g.id) === Number(groupId));
  return group ? group.name : 'Unknown';
};

const getConvertedUOM = (itemId) => {
  if (!itemId) return '';
  const allItems = getInventoryItemsArray();
  const item = allItems.find((i) => i.id === itemId || i.itemId === itemId);
  if (item) {
    return item.conversionUomCode || item.conversionUom?.code || item.uomCode || item.uom?.code || '';
  }
  const searchedItem = items.value.find((i) => i.id === itemId || i.itemId === itemId);
  if (searchedItem) {
    return getItemUOM(searchedItem);
  }
  return '';
};

const getInventoryItemsArray = () => {
  if (Array.isArray(props.inventoryItems)) {
    return props.inventoryItems;
  }
  if (props.inventoryItems && typeof props.inventoryItems === 'object') {
    if (props.inventoryItems.data && Array.isArray(props.inventoryItems.data)) {
      return props.inventoryItems.data;
    }
    return Object.values(props.inventoryItems);
  }
  return [];
};

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// ================================================================
// IMPORT METHODS
// ================================================================

// ... import methods remain the same ...

// ================================================================
// SAVE BALANCE
// ================================================================

const saveBalance = async () => {
  // Validation
  if (!form.value.storeId) {
    showToastMessage('Please select a store', 'error');
    return;
  }
  if (!form.value.groupId) {
    showToastMessage('Please select a group', 'error');
    return;
  }
  if (!form.value.itemId) {
    showToastMessage('Please select an item', 'error');
    return;
  }
  if (form.value.convertedBalance < 0) {
    showToastMessage('Balance cannot be negative', 'error');
    return;
  }

  saving.value = true;

  try {
    const response = await convertedBalanceService.createBalance({
      storeId: Number(form.value.storeId),
      groupId: Number(form.value.groupId),
      itemId: Number(form.value.itemId),
      convertedBalance: Number(form.value.convertedBalance)
    });

    if (response.success) {
      showToastMessage('✅ Converted balance initialized successfully!', 'success');
      emit('success', response.data);
      
      // Close modal after delay
      setTimeout(() => {
        saving.value = false;
        closeModal();
      }, 1500);
    } else if (response.alreadyExists) {
      showToastMessage(response.message || '⚠️ This item already has a converted balance record.', 'warning');
      saving.value = false;
    } else {
      showToastMessage(response.error || '❌ Failed to initialize converted balance', 'error');
      saving.value = false;
    }
  } catch (error) {
    console.error('Error saving converted balance:', error);
    showToastMessage('❌ Failed to initialize converted balance', 'error');
    saving.value = false;
  }
};

// ================================================================
// PROCESS IMPORT
// ================================================================

const processImport = async () => {
  // ... processImport remains the same ...
};

// ================================================================
// INITIALIZATION
// ================================================================

const initializeForm = () => {
  console.log('🔧 Initializing form...');
  console.log('props.storeId:', props.storeId);
  console.log('props.groupId:', props.groupId);
  console.log('props.storeName:', props.storeName);
  console.log('props.groupName:', props.groupName);
  
  if (!props.isAdmin) {
    if (props.storeId) {
      form.value.storeId = Number(props.storeId);
      console.log('✅ Set storeId from prop:', form.value.storeId);
    }
    
    if (props.groupId) {
      form.value.groupId = Number(props.groupId);
      console.log('✅ Set groupId from prop:', form.value.groupId);
    }
  }
  
  console.log('📋 Final form values:', { 
    storeId: form.value.storeId, 
    groupId: form.value.groupId 
  });
};

const forceSelectUpdate = async () => {
  await nextTick();
  console.log('🔄 Select updated - storeId:', form.value.storeId, 'groupId:', form.value.groupId);
};

// ================================================================
// LIFECYCLE
// ================================================================

watch(() => props.visible, async (newVal) => {
  console.log('👀 visible changed:', newVal);
  if (newVal) {
    form.value.itemId = '';
    form.value.convertedBalance = 0;
    selectedItemDisplay.value = null;
    itemSearchQuery.value = '';
    items.value = [];
    searchTotal.value = 0;
    
    initializeForm();
    await forceSelectUpdate();
  } else {
    // Clear toast when modal closes
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    showToast.value = false;
  }
}, { immediate: true });

watch(() => [props.storeId, props.groupId], async () => {
  console.log('👀 storeId/groupId props changed');
  if (props.visible) {
    initializeForm();
    await forceSelectUpdate();
  }
});

onMounted(async () => {
  console.log('🚀 Modal mounted');
  initializeForm();
  await forceSelectUpdate();
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

.balance-form .hint.pre-filled {
  color: #16a34a;
  font-weight: 500;
}

.full-width {
  flex: 1 1 100%;
  min-width: 100%;
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

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
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

.item-option-conversion {
  font-size: 9px;
  color: #8b5cf6;
  background: #f3e8ff;
  padding: 1px 8px;
  border-radius: 10px;
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

.selected-item-conversion {
  font-size: 10px;
  color: #8b5cf6;
  background: #f3e8ff;
  padding: 1px 8px;
  border-radius: 10px;
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
  from { opacity: 0; }
  to { opacity: 1; }
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