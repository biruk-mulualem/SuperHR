<!-- components/InitializeBalanceModal.vue -->
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-container balance-modal">
      <div class="modal-header">
        <div class="modal-header-content">
          <span class="modal-icon">📦</span>
          <div>
            <h3>{{ editingBalance ? '✏️ Edit Balance' : 'Initialize Balance' }}</h3>
            <p class="modal-subtitle">
              {{ editingBalance ? 'Update existing balance record' : 'Set up initial stock balance for an item' }}
            </p>
          </div>
        </div>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <div class="modal-body">
        <!-- Tabs -->
        <div class="init-tabs" v-if="!editingBalance">
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
        <div v-if="activeTab === 'manual' || editingBalance">
          <div v-if="!editingBalance" class="init-info">
            <span class="info-icon">ℹ️</span>
            <span>Set up initial stock balance for a specific item in a store.</span>
          </div>

          <form @submit.prevent="saveBalance" class="balance-form">
            <!-- Store and Group Selection -->
            <div class="form-row">
              <div class="form-group">
                <label>Store *</label>
                <select
                  v-model="form.storeId"
                  required
                  :disabled="!isAdmin && userData?.assignedStore"
                >
                  <option value="">Select Store</option>
                  <option
                    v-for="store in stores"
                    :key="store.id"
                    :value="store.id"
                  >
                    🏪 {{ store.name }}
                  </option>
                </select>
                <span
                  v-if="!isAdmin && userData?.assignedStore"
                  class="hint pre-filled"
                >
                  Pre-filled with your assigned store:
                  <strong>{{ userData.assignedStore.name }}</strong>
                </span>
              </div>

              <div class="form-group">
                <label>Group *</label>
                <select
                  v-model="form.groupId"
                  required
                  :disabled="!isAdmin && userData?.assignedGroup"
                >
                  <option value="">Select Group</option>
                  <option
                    v-for="group in groups"
                    :key="group.id"
                    :value="group.id"
                  >
                    👥 {{ group.name }}
                  </option>
                </select>
                <span
                  v-if="!isAdmin && userData?.assignedGroup"
                  class="hint pre-filled"
                >
                  Pre-filled with your assigned group:
                  <strong>{{ userData.assignedGroup.name }}</strong>
                </span>
              </div>
            </div>

            <!-- Item Selection -->
            <div class="form-row">
              <div class="form-group full-width">
                <label>Item *</label>

                <!-- Search -->
                <div class="item-search-wrapper">
                  <span class="search-icon-small">🔍</span>
                  <input
                    type="text"
                    v-model="itemSearchQuery"
                    placeholder="Search items by code, name, brand, or model..."
                    @input="resetItemList"
                    class="item-search-input"
                  />
                </div>

                <!-- Category Filter -->
                <div class="item-category-filter-wrapper">
                  <select
                    v-model="itemCategoryFilter"
                    @change="resetItemList"
                    class="item-category-filter"
                  >
                    <option value="">All Categories</option>
                    <option
                      v-for="cat in categories"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.name }}
                    </option>
                  </select>
                </div>

                <!-- Item List -->
                <div class="item-select-container" ref="itemSelectContainer">
                  <div class="item-select-scroll" @scroll="onItemScroll">
                    <div v-if="isLoadingItems" class="item-loading">
                      <div class="spinner-small"></div>
                      Loading items...
                    </div>

                    <div
                      v-else-if="displayedItems.length > 0"
                      v-for="item in displayedItems"
                      :key="item.id"
                      class="item-option"
                      :class="{ selected: form.itemId === item.id }"
                      @click="selectItem(item)"
                    >
                      <div class="item-option-content">
                        <div class="item-option-left">
                          <span class="item-option-code">{{ item.code }}</span>
                        </div>
                        <div class="item-option-middle">
                          <div class="item-option-common-name">
                            {{ item.name || item.standardName || 'Unnamed' }}
                          </div>
                          <div
                            class="item-option-standard-name"
                            v-if="item.standardName && item.standardName !== item.name"
                          >
                            {{ item.standardName }}
                          </div>
                        </div>
                        <div class="item-option-right">
                          <div class="item-option-brand" v-if="item.brand">
                            {{ item.brand }}
                          </div>
                          <div class="item-option-model" v-if="item.model">
                            {{ item.model }}
                          </div>
                        </div>
                        <div class="item-option-uom">
                          {{ item.uomCode || 'N/A' }}
                        </div>
                      </div>
                    </div>

                    <div v-else class="item-no-results">
                      {{ itemSearchQuery || itemCategoryFilter
                        ? 'No items match your search'
                        : 'No items available'
                      }}
                    </div>

                    <div
                      v-if="hasMoreItems && !isLoadingItems"
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
                  <span class="selected-item-common-name">
                    {{ selectedItemDisplay.name || selectedItemDisplay.standardName || 'Unnamed' }}
                  </span>
                  <span
                    class="selected-item-standard-name"
                    v-if="selectedItemDisplay.standardName && selectedItemDisplay.standardName !== selectedItemDisplay.name"
                  >
                    {{ selectedItemDisplay.standardName }}
                  </span>
                  <span class="selected-item-brand" v-if="selectedItemDisplay.brand">
                    Brand: {{ selectedItemDisplay.brand }}
                  </span>
                  <span class="selected-item-model" v-if="selectedItemDisplay.model">
                    Model: {{ selectedItemDisplay.model }}
                  </span>
                  <span class="selected-item-uom">
                    ({{ selectedItemDisplay.uomCode || 'N/A' }})
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

            <!-- Balance and Status -->
            <div class="form-row">
              <div class="form-group">
                <label>Balance ({{ getItemUnit(form.itemId) }}) *</label>
                <input
                  v-model.number="form.balance"
                  type="number"
                  required
                  placeholder="0"
                  min="0"
                  step="1"
                  :readonly="!!editingBalance"
                />
                <span
                  class="hint"
                  v-if="form.itemId && form.balance > 0 && !editingBalance"
                >
                  = {{ formatNumber(form.balance * getConversionValue(Number(form.itemId))) }}
                  {{ getBaseUOM(Number(form.itemId)) }}
                </span>
                <span class="hint" v-if="editingBalance">
                  Balance cannot be changed after initialization
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div class="form-group">
                <label>Minimum Stock Alert</label>
                <input
                  v-model.number="form.minStock"
                  type="number"
                  placeholder="Min stock level"
                  min="0"
                  step="1"
                />
                <span class="hint">Warning when stock falls below this level</span>
              </div>
            </div>
          </form>
        </div>

        <!-- ============================================================ -->
        <!-- IMPORT TAB -->
        <!-- ============================================================ -->
        <div v-if="activeTab === 'import' && !editingBalance">
          <div class="import-info">
            <span class="info-icon">📄</span>
            <div>
              <p><strong>CSV Format Required:</strong></p>
              <p class="info-text">Your CSV should have the following columns:</p>
              <ul class="csv-format-list">
                <li>
                  <strong>storeId</strong> - Store ID (required)
                  <span class="hint-text">e.g., 1, 2, 3</span>
                </li>
                <li>
                  <strong>groupId</strong> - Group ID (required)
                  <span class="hint-text">e.g., 1, 2, 3</span>
                </li>
                <li>
                  <strong>itemCode</strong> - Item Code (required)
                  <span class="hint-text">e.g., SDT000001</span>
                </li>
                <li>
                  <strong>balance</strong> - Initial balance (required)
                  <span class="hint-text">e.g., 100</span>
                </li>
                <li>
                  <strong>minStock</strong> - Minimum stock level (optional)
                  <span class="hint-text">e.g., 10</span>
                </li>
                <li>
                  <strong>status</strong> - Status (optional, defaults to Active)
                  <span class="hint-text">Active/Inactive</span>
                </li>
              </ul>
              <p class="info-text" style="margin-top: 8px">
                💡 <strong>Note:</strong> Use <strong>itemCode</strong> (e.g., SDT000001) instead of numeric itemId for easier import.
              </p>
              <button
                class="btn-template"
                @click="downloadTemplate"
                :disabled="importing"
              >
                📄 Download CSV Template
              </button>
            </div>
          </div>

          <!-- File Upload -->
          <div
            class="file-upload-area import-upload"
            @click="!importing && triggerCsvUpload($event)"
            :class="{ 'drag-over': isDragOver, disabled: importing }"
            @dragover.prevent="!importing && (isDragOver = true)"
            @dragleave.prevent="!importing && (isDragOver = false)"
            @drop.prevent="!importing && handleCsvDrop($event)"
          >
            <div v-if="csvFile" class="file-preview">
              <span class="file-icon">📄</span>
              <span class="file-name">{{ csvFile.name }}</span>
              <span class="file-size">{{ formatFileSize(csvFile.size) }}</span>
              <button
                type="button"
                @click.stop="!importing && removeCsvFile()"
                class="remove-file"
                :disabled="importing"
              >
                ✕
              </button>
            </div>
            <div v-else class="upload-placeholder">
              <span class="upload-icon">📁</span>
              <span>Click to upload CSV file</span>
              <span class="upload-hint">or drag and drop</span>
              <span class="upload-hint">Supported formats: .csv</span>
            </div>
            <input
              type="file"
              ref="csvFileInput"
              accept=".csv"
              @change="handleCsvUpload"
              style="display: none"
              :disabled="importing"
            />
          </div>

          <!-- Import Progress -->
          <div v-if="importing" class="import-progress">
            <div class="progress-info">
              <span>Importing balances...</span>
              <span>{{ importProgress.processed }} / {{ importProgress.total }}</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: importProgress.percentage + '%' }"
              ></div>
            </div>
            <div class="progress-status">
              <span class="status-success">✅ {{ importProgress.success }}</span>
              <span class="status-failed">❌ {{ importProgress.failed }}</span>
              <span class="status-remaining">⏳ {{ importProgress.remaining }} remaining</span>
            </div>
          </div>

          <!-- Preview imported data -->
          <div v-if="importPreviewData.length > 0 && !importing" class="import-preview">
            <h4>Preview ({{ importPreviewData.length }} items)</h4>
            <div class="preview-table-container">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>Store</th>
                    <th>Group</th>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in importPreviewData.slice(0, 10)" :key="index">
                    <td>{{ getStoreName(Number(item.storeId)) || item.storeId }}</td>
                    <td>{{ getGroupName(Number(item.groupId)) || item.groupId }}</td>
                    <td><strong>{{ item.itemCode || item.itemId }}</strong></td>
                    <td>{{ getItemNameByCode(item.itemCode) || getItemCommonName(Number(item.itemId)) || 'Unknown' }}</td>
                    <td>{{ item.balance }}</td>
                    <td>{{ item.status || 'Active' }}</td>
                  </tr>
                  <tr v-if="importPreviewData.length > 10">
                    <td colspan="6" class="preview-more">
                      ... and {{ importPreviewData.length - 10 }} more items
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Import results -->
          <div v-if="importResults && !importing" class="import-results">
            <div class="result-summary">
              <span class="result-success">✅ {{ importResults.success }} imported</span>
              <span class="result-failed">❌ {{ importResults.failed }} failed</span>
              <span class="result-total">📊 {{ importResults.total }} total</span>
            </div>
            <div v-if="importResults.errors && importResults.errors.length > 0" class="result-errors">
              <p><strong>Errors:</strong></p>
              <ul>
                <li v-for="(err, idx) in importResults.errors.slice(0, 5)" :key="idx">
                  {{ err }}
                </li>
                <li v-if="importResults.errors.length > 5">
                  ... and {{ importResults.errors.length - 5 }} more errors
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal" :disabled="importing">
          Cancel
        </button>
        <button
          v-if="activeTab === 'manual' || editingBalance"
          class="btn-primary"
          @click="saveBalance"
          :disabled="saving || (editingBalance && form.balance !== undefined) || !form.itemId"
        >
          {{ saving ? 'Saving...' : editingBalance ? 'Update' : 'Initialize' }}
        </button>
        <button
          v-if="activeTab === 'import' && !editingBalance"
          class="btn-primary"
          @click="processImport"
          :disabled="!csvFile || importing || importPreviewData.length === 0"
        >
          {{ importing ? 'Importing...' : 'Import Balances' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import balanceService from '@/stores/balanceService';

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
    type: Array,
    default: () => [],
  },
  editingBalance: {
    type: Object,
    default: null,
  },
});

// ================================================================
// EMITS
// ================================================================

const emit = defineEmits(['close', 'success']);

// ================================================================
// STATE
// ================================================================

const activeTab = ref('manual');
const saving = ref(false);
const importing = ref(false);
const isDragOver = ref(false);
const isLoadingItems = ref(false);

const form = ref({
  storeId: '',
  groupId: '',
  itemId: '',
  balance: 0,
  status: 'Active',
  minStock: 0,
});

const itemSearchQuery = ref('');
const itemCategoryFilter = ref('');
const itemDisplayLimit = ref(10);
const selectedItemDisplay = ref(null);
const itemSelectContainer = ref(null);

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

// ================================================================
// COMPUTED
// ================================================================

const filteredItemsList = computed(() => {
  if (!props.inventoryItems || props.inventoryItems.length === 0) {
    return [];
  }

  let items = [...props.inventoryItems];

  if (itemCategoryFilter.value) {
    const categoryId = Number(itemCategoryFilter.value);
    items = items.filter((item) => {
      const itemCategoryId = item.categoryId || item.category?.categoryId || item.category?.id || null;
      return itemCategoryId === categoryId;
    });
  }

  if (itemSearchQuery.value) {
    const query = itemSearchQuery.value.toLowerCase().trim();
    items = items.filter((item) => {
      const code = (item.code || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const standardName = (item.standardName || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const model = (item.model || '').toLowerCase();
      return (
        code.includes(query) ||
        name.includes(query) ||
        standardName.includes(query) ||
        brand.includes(query) ||
        model.includes(query)
      );
    });
  }

  return items;
});

const displayedItems = computed(() => {
  return filteredItemsList.value.slice(0, itemDisplayLimit.value);
});

const hasMoreItems = computed(() => {
  return displayedItems.value.length < filteredItemsList.value.length;
});

// ================================================================
// METHODS
// ================================================================

const closeModal = () => {
  if (importing.value) return;
  emit('close');
};

// ================================================================
// ITEM SELECTION
// ================================================================

const resetItemList = () => {
  itemDisplayLimit.value = 10;
};

const onItemScroll = (event) => {
  const element = event.target;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    if (filteredItemsList.value.length > itemDisplayLimit.value && !isLoadingItems.value) {
      isLoadingItems.value = true;
      setTimeout(() => {
        itemDisplayLimit.value = Math.min(
          itemDisplayLimit.value + 10,
          filteredItemsList.value.length,
        );
        isLoadingItems.value = false;
      }, 300);
    }
  }
};

const selectItem = (item) => {
  form.value.itemId = item.id;
  selectedItemDisplay.value = item;
};

const clearItemSelection = () => {
  form.value.itemId = '';
  selectedItemDisplay.value = null;
  itemSearchQuery.value = '';
  itemCategoryFilter.value = '';
  itemDisplayLimit.value = 10;
};

// ================================================================
// HELPERS
// ================================================================

const getItemCommonName = (itemId) => {
  if (!itemId) return null;
  const item = props.inventoryItems.find((i) => i.id === itemId);
  return item ? item.name || item.standardName || null : null;
};

const getItemNameByCode = (itemCode) => {
  if (!itemCode) return null;
  const item = props.inventoryItems.find((i) => i.code === itemCode);
  return item ? item.name || item.standardName || null : null;
};

const getStoreName = (storeId) => {
  const store = props.stores.find((s) => s.id === storeId);
  return store ? store.name : 'Unknown';
};

const getGroupName = (groupId) => {
  const group = props.groups.find((g) => g.id === groupId);
  return group ? group.name : 'Unknown';
};

const getItemUnit = (itemId) => {
  if (!itemId) return '';
  const item = props.inventoryItems.find((i) => i.id === itemId);
  return item ? item.uomCode || '' : '';
};

const getBaseUOM = (itemId) => {
  if (!itemId) return '';
  const item = props.inventoryItems.find((i) => i.id === itemId);
  return item ? item.conversionUomCode || item.uomCode || '' : '';
};

const getConversionValue = (itemId) => {
  if (!itemId) return 1;
  const item = props.inventoryItems.find((i) => i.id === itemId);
  return item ? item.conversionValue || 1 : 1;
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

const downloadTemplate = async () => {
  try {
    const blob = await balanceService.downloadTemplate();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance_import_template_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showToastMessage('Template CSV downloaded successfully!', 'success');
  } catch (error) {
    console.error('Error downloading template:', error);
    showToastMessage('Failed to download template', 'error');
  }
};

const triggerCsvUpload = (event) => {
  if (importing.value) return;
  if (csvFileInput.value) {
    csvFileInput.value.click();
  }
};

const handleCsvUpload = (event) => {
  const file = event.target.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file;
    parseCsvFile(file);
  } else {
    showToastMessage('Please upload a valid CSV file', 'error');
  }
  event.target.value = '';
};

const handleCsvDrop = (event) => {
  isDragOver.value = false;
  const file = event.dataTransfer.files[0];
  if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
    csvFile.value = file;
    parseCsvFile(file);
  } else {
    showToastMessage('Please upload a valid CSV file', 'error');
  }
};

const removeCsvFile = () => {
  csvFile.value = null;
  importPreviewData.value = [];
  importResults.value = null;
};

const parseCsvFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));

      if (lines.length < 2) {
        showToastMessage('CSV file must contain headers and at least one data row', 'error');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const requiredHeaders = ['storeid', 'groupid', 'balance'];
      const hasItemId = headers.includes('itemid');
      const hasItemCode = headers.includes('itemcode');

      if (!hasItemId && !hasItemCode) {
        showToastMessage('CSV must contain either "itemId" or "itemCode" column', 'error');
        return;
      }

      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
      if (missingHeaders.length > 0) {
        showToastMessage(`Missing required headers: ${missingHeaders.join(', ')}`, 'error');
        return;
      }

      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = values[idx] || '';
        });

        const itemId = obj.itemid ? parseInt(obj.itemid) : null;
        const itemCode = obj.itemcode || null;

        if ((!itemId && !itemCode) || !obj.storeid || !obj.groupid || !obj.balance) {
          continue;
        }

        const storeId = parseInt(obj.storeid);
        const groupId = parseInt(obj.groupid);
        const balance = parseFloat(obj.balance);

        if (isNaN(storeId) || isNaN(groupId) || isNaN(balance)) {
          console.warn(`Skipping row ${i + 1}: Invalid data`, obj);
          continue;
        }

        data.push({
          storeId: storeId,
          groupId: groupId,
          itemId: itemId,
          itemCode: itemCode,
          balance: balance,
          minStock: parseInt(obj.minstock) || 0,
          status: obj.status || 'Active',
        });
      }

      if (data.length === 0) {
        showToastMessage('No valid data found in CSV file. Please check the format.', 'error');
        importPreviewData.value = [];
        return;
      }

      importPreviewData.value = data;
      showToastMessage(`Successfully parsed ${data.length} items from CSV`, 'success');
    } catch (error) {
      console.error('CSV parse error:', error);
      showToastMessage('Failed to parse CSV file. Please check the format.', 'error');
      importPreviewData.value = [];
    }
  };
  reader.onerror = () => {
    showToastMessage('Failed to read file', 'error');
    importPreviewData.value = [];
  };
  reader.readAsText(file);
};

const processImport = async () => {
  if (!csvFile.value || importPreviewData.value.length === 0) {
    showToastMessage('No data to import. Please upload a valid CSV file.', 'error');
    return;
  }

  importing.value = true;
  importResults.value = null;

  const totalItems = importPreviewData.value.length;
  importProgress.value = {
    total: totalItems,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: totalItems,
    percentage: 0,
  };

  try {
    const response = await balanceService.importBalances(csvFile.value);
    importResults.value = response.data;
    showToastMessage(
      `Import completed: ${response.data.success} imported, ${response.data.failed} failed`,
      response.data.failed > 0 ? 'warning' : 'success',
    );
    emit('success', response.data);
  } catch (error) {
    console.error('Import error:', error);
    showToastMessage('Failed to import balances', 'error');
  } finally {
    importing.value = false;
  }
};

// ================================================================
// SAVE BALANCE
// ================================================================

const saveBalance = async () => {
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
  if (form.value.balance < 0) {
    showToastMessage('Balance cannot be negative', 'error');
    return;
  }

  saving.value = true;

  try {
    const payload = {
      storeId: Number(form.value.storeId),
      groupId: Number(form.value.groupId),
      itemId: Number(form.value.itemId),
      balance: Number(form.value.balance),
      minStock: Number(form.value.minStock) || 0,
      status: form.value.status || 'Active',
    };

    let response;
    if (props.editingBalance) {
      response = await balanceService.updateBalance(props.editingBalance.id, payload);
      showToastMessage('Balance updated successfully!', 'success');
    } else {
      response = await balanceService.createBalance(payload);
      showToastMessage('Balance initialized successfully!', 'success');
    }

    emit('success', response.data);
    closeModal();
  } catch (error) {
    console.error('Error saving balance:', error);
    if (error.response?.data?.error) {
      showToastMessage(error.response.data.error, 'error');
    } else {
      showToastMessage('Failed to save balance', 'error');
    }
  } finally {
    saving.value = false;
  }
};

// ================================================================
// TOAST
// ================================================================

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// ================================================================
// LIFECYCLE - ✅ FIXED: Pre-fill store and group
// ================================================================

onMounted(() => {
  // ✅ FIX: Pre-fill store and group for non-admin users
  if (!props.isAdmin && props.userData) {
    // Pre-fill store
    if (props.userData.assignedStore?.id) {
      form.value.storeId = props.userData.assignedStore.id;
    }
    // Pre-fill group
    if (props.userData.assignedGroup?.id) {
      form.value.groupId = props.userData.assignedGroup.id;
    }
  }

  // If editing, populate form
  if (props.editingBalance) {
    form.value = {
      storeId: props.editingBalance.storeId,
      groupId: props.editingBalance.groupId,
      itemId: props.editingBalance.itemId,
      balance: props.editingBalance.balance,
      status: props.editingBalance.status || 'Active',
      minStock: props.editingBalance.minStock || 0,
    };

    // Find and select the item
    const item = props.inventoryItems.find((i) => i.id === props.editingBalance.itemId);
    if (item) {
      selectedItemDisplay.value = item;
    }
  }
});

// ✅ WATCH: When userData changes, update form values
watch(
  () => props.userData,
  (newUserData) => {
    if (!props.isAdmin && newUserData) {
      if (newUserData.assignedStore?.id && !form.value.storeId) {
        form.value.storeId = newUserData.assignedStore.id;
      }
      if (newUserData.assignedGroup?.id && !form.value.groupId) {
        form.value.groupId = newUserData.assignedGroup.id;
      }
    }
  },
  { deep: true, immediate: true }
);

// ✅ WATCH: When stores change, ensure pre-filled store exists in list
watch(
  () => props.stores,
  (newStores) => {
    if (!props.isAdmin && props.userData?.assignedStore?.id) {
      const storeExists = newStores.some(s => s.id === props.userData.assignedStore.id);
      if (storeExists && !form.value.storeId) {
        form.value.storeId = props.userData.assignedStore.id;
      }
    }
  },
  { immediate: true }
);

// ✅ WATCH: When groups change, ensure pre-filled group exists in list
watch(
  () => props.groups,
  (newGroups) => {
    if (!props.isAdmin && props.userData?.assignedGroup?.id) {
      const groupExists = newGroups.some(g => g.id === props.userData.assignedGroup.id);
      if (groupExists && !form.value.groupId) {
        form.value.groupId = props.userData.assignedGroup.id;
      }
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
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

/* ================================================================
   HEADER
   ================================================================ */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
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

/* ================================================================
   BODY
   ================================================================ */
.modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

/* ================================================================
   TABS
   ================================================================ */
.init-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.init-tab {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  border-radius: 8px 8px 0 0;
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

/* ================================================================
   INIT INFO
   ================================================================ */
.init-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #eff6ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  margin-bottom: 14px;
  font-size: 13px;
  color: #1e293b;
}

.info-icon {
  font-size: 18px;
}

/* ================================================================
   FORM
   ================================================================ */
.balance-form .form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.balance-form .form-group {
  flex: 1;
  min-width: 120px;
}

.balance-form .form-group label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 3px;
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
}

.balance-form .form-group input:focus,
.balance-form .form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.balance-form .form-group input:read-only {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.balance-form .hint {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}

.hint.pre-filled {
  color: #2563eb;
  font-weight: 500;
}

.full-width {
  flex: 1 1 100%;
  min-width: 100%;
}

/* ================================================================
   ITEM SELECTION
   ================================================================ */
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
  padding: 6px 10px 6px 30px;
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

.item-category-filter-wrapper {
  margin-bottom: 4px;
}

.item-category-filter {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  cursor: pointer;
}

.item-select-container {
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  max-height: 200px;
  overflow: hidden;
  transition: border-color 0.2s;
  margin-top: 4px;
}

.item-select-container:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.item-select-scroll {
  max-height: 200px;
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

.item-select-scroll::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.item-option {
  padding: 8px 12px;
  border-radius: 6px;
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
  gap: 12px;
  flex-wrap: wrap;
}

.item-option-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  min-width: 90px;
}

.item-option-common-name {
  font-size: 13px;
  color: #1e293b;
  flex: 1;
}

.item-option-standard-name {
  font-size: 11px;
  color: #94a3b8;
}

.item-option-brand {
  font-size: 11px;
  color: #8b5cf6;
  background: #f3e8ff;
  padding: 1px 10px;
  border-radius: 10px;
}

.item-option-model {
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 10px;
  border-radius: 10px;
}

.item-option-uom {
  font-size: 11px;
  color: #166534;
  background: #dcfce7;
  padding: 2px 12px;
  border-radius: 10px;
  min-width: 45px;
  text-align: center;
  font-weight: 600;
  flex-shrink: 0;
}

.item-loading {
  text-align: center;
  padding: 10px;
  color: #94a3b8;
  font-size: 12px;
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

.selected-item-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.selected-badge {
  font-weight: 600;
  color: #166534;
  font-size: 12px;
}

.selected-item-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
}

.selected-item-common-name {
  color: #1e293b;
  font-size: 13px;
}

.selected-item-standard-name {
  color: #64748b;
  font-size: 12px;
  font-style: italic;
}

.selected-item-brand {
  font-size: 12px;
  color: #8b5cf6;
  background: #f3e8ff;
  padding: 1px 10px;
  border-radius: 10px;
}

.selected-item-model {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 10px;
  border-radius: 10px;
}

.selected-item-uom {
  color: #64748b;
  font-size: 12px;
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

/* ================================================================
   IMPORT
   ================================================================ */
.import-info {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  margin-bottom: 16px;
}

.info-text {
  font-size: 13px;
  color: #475569;
  margin: 4px 0;
}

.csv-format-list {
  margin: 8px 0 12px 0;
  padding-left: 20px;
  font-size: 12px;
  color: #475569;
}

.csv-format-list li {
  margin: 3px 0;
}

.hint-text {
  color: #94a3b8;
  font-size: 11px;
}

.btn-template {
  background: #f59e0b;
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
}

.btn-template:hover:not(:disabled) {
  background: #d97706;
}

.btn-template:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.file-upload-area:hover:not(.disabled) {
  border-color: #3b82f6;
  background: #f8fafc;
}

.file-upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
}

.file-upload-area.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.file-icon {
  font-size: 24px;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: #94a3b8;
}

.remove-file {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 16px;
  padding: 0 4px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.upload-icon {
  font-size: 32px;
}

.upload-hint {
  font-size: 11px;
  color: #94a3b8;
}

/* Import Progress */
.import-progress {
  margin: 16px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-status {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
}

.status-success {
  color: #16a34a;
}
.status-failed {
  color: #dc2626;
}
.status-remaining {
  color: #475569;
}

/* Import Preview */
.import-preview {
  margin-top: 16px;
}

.import-preview h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.preview-table-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th {
  background: #f8fafc;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table td {
  padding: 6px 12px;
  border-top: 1px solid #f1f5f9;
}

.preview-more {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  padding: 8px;
}

/* Import Results */
.import-results {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.result-summary {
  display: flex;
  gap: 16px;
  font-size: 14px;
  font-weight: 500;
}

.result-success {
  color: #16a34a;
}
.result-failed {
  color: #dc2626;
}
.result-total {
  color: #475569;
}

.result-errors {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.result-errors ul {
  margin: 4px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: #dc2626;
}

.result-errors li {
  margin: 2px 0;
}

/* ================================================================
   FOOTER
   ================================================================ */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
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
  z-index: 1200;
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

/* ================================================================
   ANIMATIONS
   ================================================================ */
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

  .import-info {
    flex-direction: column;
  }

  .item-option-content {
    flex-wrap: wrap;
    gap: 4px;
  }

  .item-option-code {
    min-width: 70px;
    font-size: 11px;
  }

  .selected-item-display {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .modal-body {
    padding: 12px;
  }

  .item-option {
    padding: 6px 10px;
  }

  .preview-table {
    font-size: 10px;
  }

  .preview-table th,
  .preview-table td {
    padding: 4px 6px;
  }
}
</style>