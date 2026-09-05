<!-- components/ConvertModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container convert-modal">
      <div class="modal-header">
        <div class="modal-header-content">
          <span class="modal-icon">🔄</span>
          <div>
            <h3>Convert Stock</h3>
            <p class="modal-subtitle">Convert items from current UOM to base UOM</p>
          </div>
        </div>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <div class="modal-body">
        <!-- Info Box -->
        <div class="convert-info-box">
          <span class="info-icon">ℹ️</span>
          <div>
            <p class="info-title">How Conversion Works</p>
            <p class="info-text">
              Select items with available stock and enter the quantity to convert.
              The system will reduce the source balance and increase the converted balance.
            </p>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="convert-controls">
          <div class="search-box-small">
            <span class="search-icon-small">🔍</span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search by item code or name..."
              @input="onSearch"
            />
          </div>

          <div class="filter-group">
            <select v-model="filterCategory" class="filter-select" @change="onFilterChange">
              <option value="">All Categories</option>
              <option
                v-for="cat in categories"
                :key="cat.id || cat.categoryId"
                :value="cat.id || cat.categoryId"
              >
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Stats -->
          <div class="convert-stats">
            <span class="stat-item">
              📦 {{ availableItems.length }} available
            </span>
            <span class="stat-item" v-if="selectedCount > 0">
              ✅ {{ selectedCount }} selected
            </span>
            <span class="stat-item" v-if="selectedCount > 0">
              🔄 {{ totalConvertedAmount }} {{ getTargetUom() }}
            </span>
          </div>
        </div>

        <!-- Item List -->
        <div class="convert-item-list">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="convert-item"
            :class="{ 'has-error': item.convertQty > item.balance }"
          >
            <div class="convert-item-info">
              <input
                type="checkbox"
                :checked="item.selected"
                @change="toggleSelection(item)"
                :disabled="item.balance <= 0"
              />
              <span class="item-code">{{ item.itemCode }}</span>
              <span class="item-name">{{ item.itemName }}</span>
              <span class="item-uom-badge">{{ item.uomCode }}</span>
              <span class="item-balance">{{ formatNumber(item.balance) }}</span>
              <span class="item-arrow">→</span>
              <span class="item-target">{{ item.convertToUom }}</span>
              <span class="item-rate">(1 {{ item.uomCode }} = {{ item.conversionRate }} {{ item.convertToUom }})</span>
            </div>
            
            <div class="convert-item-input" v-if="item.selected">
              <label>Quantity:</label>
              <div class="quantity-control">
                <button
                  type="button"
                  class="qty-btn"
                  @click="adjustQuantity(item, -1)"
                  :disabled="item.convertQty <= 1"
                >
                  −
                </button>
                <input
                  type="number"
                  v-model.number="item.convertQty"
                  :max="item.balance"
                  min="1"
                  step="1"
                  class="qty-input"
                  @focus="selectAllText($event)"
                  @input="validateQty(item)"
                />
                <button
                  type="button"
                  class="qty-btn"
                  @click="adjustQuantity(item, 1)"
                  :disabled="item.convertQty >= item.balance"
                >
                  +
                </button>
                <span class="qty-max">Max: {{ formatNumber(item.balance) }}</span>
              </div>
              <span class="convert-result" v-if="item.convertQty > 0 && item.convertQty <= item.balance">
                → {{ formatNumber(item.convertQty * item.conversionRate) }} {{ item.convertToUom }}
              </span>
              <span class="convert-error" v-if="item.convertQty > item.balance">
                ⚠️ Exceeds max ({{ formatNumber(item.balance) }})
              </span>
            </div>
          </div>
          
          <div v-if="filteredItems.length === 0" class="no-items">
            <span class="empty-icon">📦</span>
            <p>{{ searchQuery ? 'No items match your search' : 'No items available for conversion.' }}</p>
            <span class="empty-hint" v-if="!searchQuery">Items must have stock and a conversion UOM set.</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">Cancel</button>
        <button
          class="btn-primary"
          @click="openConfirmation"
          :disabled="!hasSelectedItems || converting || loading"
        >
          <span v-if="converting" class="spinner-small"></span>
          <span v-else>🔄</span>
          {{ converting ? 'Processing...' : `Convert ${selectedCount} Item(s)` }}
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- CONFIRMATION MODAL -->
    <!-- ============================================================ -->
    <div
      v-if="showConfirmation"
      class="modal-overlay"
      @click.self="closeConfirmation"
    >
      <div class="modal-container confirmation-modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <span class="modal-icon">⚠️</span>
            <div>
              <h3>Confirm Conversion</h3>
              <p class="modal-subtitle">Please review before proceeding</p>
            </div>
          </div>
          <button class="modal-close" @click="closeConfirmation">✕</button>
        </div>

        <div class="modal-body">
          <div class="confirmation-icon">🔄</div>
          <p class="confirmation-title">Are you sure you want to convert these items?</p>

          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Items to Convert</span>
              <span class="detail-value">{{ selectedForConfirmation.length }} item(s)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Source Store</span>
              <span class="detail-value">{{ storeName || 'Current Store' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Target UOM</span>
              <span class="detail-value">{{ getTargetUom() }}</span>
            </div>
            <div class="detail-row highlight">
              <span class="detail-label">Total Converted</span>
              <span class="detail-value">{{ totalConvertedAmount }} {{ getTargetUom() }}</span>
            </div>
          </div>

          <div class="confirmation-list">
            <div
              v-for="item in selectedForConfirmation"
              :key="item.id"
              class="confirmation-item"
            >
              <span class="conf-item-code">{{ item.itemCode }}</span>
              <span class="conf-item-name">{{ item.itemName }}</span>
              <span class="conf-item-detail">
                {{ item.convertQty }} {{ item.uomCode }} → 
                {{ formatNumber(item.convertQty * item.conversionRate) }} {{ item.convertToUom }}
              </span>
            </div>
          </div>

          <div class="warning-box">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">
              This action cannot be undone. The source balance will be reduced.
              Please verify the quantities before confirming.
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeConfirmation">Cancel</button>
          <button
            class="btn-danger"
            @click="confirmConversion"
            :disabled="converting"
          >
            {{ converting ? 'Processing...' : '✅ Confirm & Convert' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- TOAST -->
    <!-- ============================================================ -->
    <div v-if="showToast" class="toast" :class="toastType">
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import convertedBalanceService from '@/stores/convertedBalanceService';

// ================================================================
// PROPS
// ================================================================

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  storeId: {
    type: Number,
    required: true,
  },
  groupId: {
    type: Number,
    required: true,
  },
  storeName: {
    type: String,
    default: '',
  },
  categories: {
    type: Array,
    default: () => [],
  },
});

// ================================================================
// EMITS
// ================================================================

const emit = defineEmits(['update:visible', 'success', 'error']);

// ================================================================
// STATE
// ================================================================

const loading = ref(false);
const converting = ref(false);
const searchQuery = ref('');
const filterCategory = ref('');
const availableItems = ref([]);
const selectedForConfirmation = ref([]);
const showConfirmation = ref(false);
let searchTimeout = null;

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
let toastTimeout = null;

// ================================================================
// COMPUTED
// ================================================================

const filteredItems = computed(() => {
  let items = availableItems.value;
  
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    items = items.filter(item =>
      item.itemCode.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search)
    );
  }
  
  return items;
});

const hasSelectedItems = computed(() => {
  return availableItems.value.some(item => 
    item.selected && item.convertQty > 0 && item.convertQty <= item.balance
  );
});

const selectedCount = computed(() => {
  return availableItems.value.filter(item => 
    item.selected && item.convertQty > 0 && item.convertQty <= item.balance
  ).length;
});

const totalConvertedAmount = computed(() => {
  let total = 0;
  availableItems.value.forEach(item => {
    if (item.selected && item.convertQty > 0 && item.convertQty <= item.balance) {
      total += item.convertQty * item.conversionRate;
    }
  });
  return formatNumber(total);
});

const getTargetUom = () => {
  const selected = availableItems.value.find(item => item.selected);
  return selected ? selected.convertToUom : 'N/A';
};

// ================================================================
// METHODS
// ================================================================

const closeModal = () => {
  emit('update:visible', false);
};

const showToastMessage = (msg, type = 'success') => {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  toastTimeout = setTimeout(() => {
    showToast.value = false;
    toastTimeout = null;
  }, 4000);
};

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat().format(num);
};

const onSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchAvailableItems();
  }, 300);
};

const onFilterChange = () => {
  fetchAvailableItems();
};

const fetchAvailableItems = async () => {
  if (!props.storeId || !props.groupId) return;
  
  loading.value = true;
  try {
    const response = await convertedBalanceService.getAvailableItems({
      storeId: props.storeId,
      groupId: props.groupId,
      categoryId: filterCategory.value || undefined,
      search: searchQuery.value || undefined
    });

    if (response.success) {
      availableItems.value = response.data.map(item => ({
        ...item,
        selected: false,
        convertQty: 1
      }));
    } else {
      showToastMessage('Failed to fetch available items', 'error');
    }
  } catch (error) {
    console.error('Error fetching available items:', error);
    showToastMessage('Failed to fetch available items', 'error');
  } finally {
    loading.value = false;
  }
};

const toggleSelection = (item) => {
  item.selected = !item.selected;
  if (item.selected) {
    item.convertQty = 1;
  } else {
    item.convertQty = 0;
  }
};

const adjustQuantity = (item, delta) => {
  const newQty = item.convertQty + delta;
  if (newQty >= 1 && newQty <= item.balance) {
    item.convertQty = newQty;
  }
};

const selectAllText = (event) => {
  event.target.select();
};

const validateQty = (item) => {
  if (item.convertQty > item.balance) {
    item.convertQty = item.balance;
  }
  if (item.convertQty < 0) {
    item.convertQty = 0;
  }
  if (item.convertQty === 0) {
    item.selected = false;
  }
};

const openConfirmation = () => {
  const selected = availableItems.value.filter(
    item => item.selected && item.convertQty > 0 && item.convertQty <= item.balance
  );
  
  if (selected.length === 0) {
    showToastMessage('No valid items selected for conversion', 'warning');
    return;
  }
  
  selectedForConfirmation.value = selected;
  showConfirmation.value = true;
};

const closeConfirmation = () => {
  showConfirmation.value = false;
  selectedForConfirmation.value = [];
};

const confirmConversion = async () => {
  const selectedItems = selectedForConfirmation.value;

  if (selectedItems.length === 0) {
    showToastMessage('No items selected for conversion', 'warning');
    return;
  }

  converting.value = true;

  try {
    const items = selectedItems.map(item => ({
      balanceId: item.balanceId,
      itemId: item.id,
      quantity: item.convertQty,
      conversionRate: item.conversionRate,
      sourceUomId: item.sourceUomId,
      targetUomId: item.targetUomId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      uomCode: item.uomCode,
      convertToUom: item.convertToUom
    }));

    const response = await convertedBalanceService.convert(items);

    if (response.success) {
      showToastMessage(
        response.message || `Successfully converted ${selectedItems.length} item(s)`,
        'success'
      );
      
      emit('success', response.data);
      
      closeConfirmation();
      
      // Reset selection
      availableItems.value.forEach(item => {
        item.selected = false;
        item.convertQty = 1;
      });
      
      // Refresh the list
      setTimeout(() => {
        fetchAvailableItems();
      }, 500);
      
      // Close modal after success
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } else {
      showToastMessage(response.message || 'Conversion failed', 'error');
      if (response.data?.errors) {
        response.data.errors.forEach(err => {
          showToastMessage(`${err.itemCode}: ${err.error}`, 'error');
        });
      }
      emit('error', response.data?.errors || []);
    }
  } catch (error) {
    console.error('Conversion error:', error);
    showToastMessage('Failed to perform conversion', 'error');
    emit('error', [{ error: error.message || 'Conversion failed' }]);
  } finally {
    converting.value = false;
  }
};

// ================================================================
// WATCH
// ================================================================

watch(() => props.visible, (newVal) => {
  if (newVal) {
    // Reset state when opening
    searchQuery.value = '';
    filterCategory.value = '';
    fetchAvailableItems();
  }
}, { immediate: true });

// ================================================================
// CLEANUP
// ================================================================

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (toastTimeout) clearTimeout(toastTimeout);
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
  max-width: 850px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.confirmation-modal .modal-container {
  max-width: 520px;
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
/* HEADER */
/* ================================================================ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 24px;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
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

/* ================================================================ */
/* BODY */
/* ================================================================ */
.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

/* ================================================================ */
/* INFO BOX */
/* ================================================================ */
.convert-info-box {
  display: flex;
  gap: 12px;
  padding: 10px 14px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  margin-bottom: 14px;
}

.info-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.info-title {
  font-weight: 600;
  font-size: 13px;
  color: #166534;
  margin: 0;
}

.info-text {
  font-size: 12px;
  color: #475569;
  margin: 2px 0 0 0;
}

/* ================================================================ */
/* CONTROLS */
/* ================================================================ */
.convert-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box-small {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.search-box-small input {
  width: 100%;
  padding: 6px 12px 6px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-box-small input:focus {
  outline: none;
  border-color: #8b5cf6;
  background: white;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.search-icon-small {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
}

.filter-group {
  min-width: 140px;
}

.filter-select {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.convert-stats {
  display: flex;
  gap: 12px;
  margin-left: auto;
  font-size: 12px;
  color: #475569;
}

.stat-item {
  background: #f1f5f9;
  padding: 3px 12px;
  border-radius: 12px;
  white-space: nowrap;
}

/* ================================================================ */
/* ITEM LIST */
/* ================================================================ */
.convert-item-list {
  max-height: 380px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.convert-item-list::-webkit-scrollbar {
  width: 6px;
}

.convert-item-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.convert-item-list::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
}

.convert-item {
  display: flex;
  flex-direction: column;
  padding: 8px 14px;
  border-bottom: 1px solid #f1f5f9;
  gap: 6px;
  transition: background 0.2s;
}

.convert-item:hover {
  background: #fafbfc;
}

.convert-item:last-child {
  border-bottom: none;
}

.convert-item.has-error {
  background: #fef2f2;
}

.convert-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.convert-item-info input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #8b5cf6;
  flex-shrink: 0;
}

.convert-item-info input[type="checkbox"]:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  min-width: 90px;
  font-family: monospace;
}

.item-name {
  flex: 1;
  font-weight: 500;
  color: #1e293b;
  font-size: 13px;
  min-width: 120px;
}

.item-uom-badge {
  background: #f1f5f9;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 11px;
  color: #475569;
  font-weight: 500;
}

.item-balance {
  font-weight: 600;
  color: #1e293b;
  font-size: 13px;
  min-width: 40px;
}

.item-arrow {
  color: #94a3b8;
  font-size: 14px;
}

.item-target {
  background: #dbeafe;
  padding: 1px 10px;
  border-radius: 10px;
  font-size: 11px;
  color: #1e40af;
  font-weight: 500;
}

.item-rate {
  font-size: 11px;
  color: #94a3b8;
}

/* ================================================================ */
/* CONVERT INPUT */
/* ================================================================ */
.convert-item-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 28px;
  flex-wrap: wrap;
}

.convert-item-input label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
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
  width: 50px;
  text-align: center;
  border: none;
  background: transparent;
  padding: 3px 0;
  font-size: 13px;
  font-weight: 500;
}

.qty-input:focus {
  outline: none;
}

.qty-max {
  font-size: 11px;
  color: #94a3b8;
}

.convert-result {
  font-weight: 600;
  color: #8b5cf6;
  font-size: 13px;
  background: #f3e8ff;
  padding: 2px 12px;
  border-radius: 4px;
}

.convert-error {
  font-weight: 600;
  color: #dc2626;
  font-size: 12px;
}

/* ================================================================ */
/* NO ITEMS */
/* ================================================================ */
.no-items {
  text-align: center;
  padding: 30px 20px;
  color: #94a3b8;
}

.no-items .empty-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 8px;
}

.no-items p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.no-items .empty-hint {
  font-size: 12px;
  color: #b0b8c4;
}

/* ================================================================ */
/* FOOTER */
/* ================================================================ */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

/* ================================================================ */
/* BUTTONS */
/* ================================================================ */
.btn-primary {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 7px 18px;
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
  background: #7c3aed;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 7px 18px;
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
  padding: 7px 18px;
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

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ================================================================ */
/* CONFIRMATION MODAL */
/* ================================================================ */
.confirmation-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 8px;
}

.confirmation-title {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.confirmation-details {
  background: #f8fafc;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.highlight {
  background: #fef3c7;
  margin: 4px -16px 0 -16px;
  padding: 4px 16px;
  border-radius: 4px;
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

.confirmation-list {
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 14px;
}

.confirmation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
}

.confirmation-item:last-child {
  border-bottom: none;
}

.conf-item-code {
  font-weight: 600;
  color: #2563eb;
  min-width: 90px;
  font-size: 12px;
  font-family: monospace;
}

.conf-item-name {
  flex: 1;
  color: #1e293b;
}

.conf-item-detail {
  color: #8b5cf6;
  font-weight: 500;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.warning-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.warning-text {
  font-size: 12px;
  color: #991b1b;
  line-height: 1.5;
}

/* ================================================================ */
/* TOAST */
/* ================================================================ */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1200;
  max-width: 90vw;
  font-size: 13px;
  white-space: pre-line;
  border-left: 3px solid #10b981;
  animation: slideIn 0.3s ease;
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

/* ================================================================ */
/* RESPONSIVE */
/* ================================================================ */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 95vh;
    margin: 10px;
  }

  .convert-controls {
    flex-direction: column;
  }

  .search-box-small {
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .convert-stats {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }

  .convert-item-info {
    flex-wrap: wrap;
  }

  .convert-item-input {
    padding-left: 0;
  }

  .confirmation-item {
    flex-wrap: wrap;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer button {
    width: 100%;
    justify-content: center;
  }

  .item-rate {
    display: none;
  }
}

@media (max-width: 480px) {
  .modal-body {
    padding: 12px;
  }

  .convert-item {
    padding: 6px 10px;
  }

  .item-code {
    min-width: 60px;
    font-size: 11px;
  }

  .item-name {
    font-size: 12px;
    min-width: 80px;
  }

  .quantity-control {
    flex: 1;
  }
}
</style>