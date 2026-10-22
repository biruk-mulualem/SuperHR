<!-- views/storemanagement/storebalance/InitializeBalancePage.vue -->
<template>
  <div class="init-page">
    <div class="init-shell">
      <!-- ============ HERO / HEADER ============ -->
      <header class="hero">
        <button class="hero-back" @click="goBack" :disabled="saving || importing">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div class="hero-text">
          <span class="hero-eyebrow">
            {{ isEditing ? 'Editing' : 'New Balance' }}
          </span>
          <h1>
            {{ isEditing ? 'Update Balance' : 'Initialize Balance' }}
          </h1>
          <p>
            {{
              isEditing
                ? 'Adjust the minimum stock level or status for this balance record.'
                : 'Set up the initial stock for an item. Search to begin.'
            }}
          </p>
        </div>

        <div class="hero-illustration" aria-hidden="true">
          <div class="illustration-ring"></div>
          <span class="illustration-icon">{{ isEditing ? '✏️' : '📦' }}</span>
        </div>
      </header>

      <!-- ============ MODE SWITCH (create only) ============ -->
      <div class="mode-switch" v-if="!isEditing">
        <button
          class="mode-btn"
          :class="{ active: activeTab === 'manual' }"
          @click="activeTab = 'manual'"
        >
          <span class="mode-icon">✍️</span>
          Manual
        </button>
        <button
          class="mode-btn"
          :class="{ active: activeTab === 'import' }"
          @click="activeTab = 'import'"
        >
          <span class="mode-icon">📥</span>
          Import
        </button>
      </div>

      <!-- ============ MANUAL ============ -->
      <section v-if="activeTab === 'manual' || isEditing" class="panel">
        <!-- Item picker (create mode) -->
        <div v-if="!isEditing" class="field-block">
          <div class="field-label">
            <span>Select Item</span>
            <span class="field-hint">Search to reveal results</span>
          </div>

          <!-- Search + Category side by side -->
          <div class="search-row">
            <div class="search-shell">
              <span class="search-glyph">⌕</span>
              <input
                v-model="itemSearchQuery"
                type="text"
                placeholder="Search by code, name, brand, or model…"
                @input="resetItemList"
                class="search-input"
              />
              <button
                v-if="itemSearchQuery"
                type="button"
                class="search-clear"
                @click="itemSearchQuery = ''; resetItemList()"
                aria-label="Clear search"
              >
                ✕
              </button>
            </div>

            <select
              v-model="itemCategoryFilter"
              @change="resetItemList"
              class="category-select"
            >
              <option value="">All categories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>

            <span v-if="showItemList && displayedItems.length > 0" class="results-badge">
              {{ filteredItemsList.length }} match{{ filteredItemsList.length === 1 ? '' : 'es' }}
            </span>
          </div>

          <!-- Results -->
          <div class="results-shell" :class="{ 'is-empty': !showItemList }">
            <!-- Prompt -->
            <div v-if="!showItemList" class="results-prompt">
              <span class="prompt-glyph">⌕</span>
              <p>Start typing to search items</p>
              <span class="prompt-sub">Or choose a category</span>
            </div>

            <!-- Loading -->
            <div v-else-if="isLoadingItems" class="results-loading">
              <span class="dot-spinner"></span>
              Loading…
            </div>

            <!-- Items -->
            <div v-else-if="displayedItems.length > 0" class="results-list">
              <div
                v-for="item in displayedItems"
                :key="item.id"
                class="result-card"
                :class="{ selected: form.itemId === item.id }"
                @click="selectItem(item)"
              >
                <div class="result-leading">
                  <span class="result-code">{{ item.code }}</span>
                </div>
                <div class="result-body">
                  <div class="result-name">
                    {{ item.name || item.standardName || 'Unnamed' }}
                  </div>
                  <div class="result-meta">
                    <span v-if="item.brand" class="meta-chip brand">{{ item.brand }}</span>
                    <span v-if="item.model" class="meta-chip model">{{ item.model }}</span>
                    <span
                      v-if="item.standardName && item.standardName !== item.name"
                      class="meta-standard"
                    >
                      {{ item.standardName }}
                    </span>
                  </div>
                </div>
                <div class="result-trailing">
                  <span class="uom-pill">{{ item.uomCode || 'N/A' }}</span>
                  <span class="result-check" v-if="form.itemId === item.id">✓</span>
                </div>
              </div>

              <div v-if="hasMoreItems" class="results-more">
                Scroll for more…
              </div>
            </div>

            <!-- No matches -->
            <div v-else class="results-empty">
              <span class="empty-glyph">∅</span>
              <p>No items match your search</p>
              <span class="prompt-sub">Try a different term or category</span>
            </div>
          </div>

          <!-- Selected item chip -->
          <transition name="fade">
            <div v-if="selectedItemDisplay" class="selected-chip">
              <span class="chip-check">✓</span>
              <div class="chip-body">
                <span class="chip-code">{{ selectedItemDisplay.code }}</span>
                <span class="chip-name">
                  {{ selectedItemDisplay.name || selectedItemDisplay.standardName || 'Unnamed' }}
                </span>
                <span class="chip-uom">({{ selectedItemDisplay.uomCode || 'N/A' }})</span>
              </div>
              <button
                type="button"
                class="chip-clear"
                @click="clearItemSelection"
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
          </transition>
        </div>

        <!-- Item (read-only in edit mode) -->
        <div v-else class="field-block">
          <div class="field-label">
            <span>Item</span>
            <span class="field-hint">Locked after initialization</span>
          </div>
          <div class="locked-box">
            <span class="locked-code">{{ selectedItemDisplay?.code || '—' }}</span>
            <span class="locked-name">
              {{ selectedItemDisplay?.name || selectedItemDisplay?.standardName || '—' }}
            </span>
            <span class="locked-uom">({{ selectedItemDisplay?.uomCode || 'N/A' }})</span>
          </div>
        </div>

        <!-- Balance details -->
        <div class="field-block">
          <div class="field-label">
            <span>Balance Details</span>
          </div>

          <div class="details-grid">
            <div class="detail-field">
              <label>
                Balance
                <span class="unit-suffix" v-if="getItemUnit(form.itemId)">
                  {{ getItemUnit(form.itemId) }}
                </span>
                <span class="req-dot">•</span>
              </label>
              <input
                v-model.number="form.balance"
                type="number"
                placeholder="0"
                min="0"
                step="1"
                :readonly="isEditing"
                class="detail-input"
              />
              <span v-if="form.itemId && form.balance > 0 && !isEditing" class="detail-hint">
                ≈ {{ formatNumber(form.balance * getConversionValue(Number(form.itemId))) }}
                {{ getBaseUOM(Number(form.itemId)) }}
              </span>
              <span v-else-if="isEditing" class="detail-hint">
                Locked after initialization
              </span>
            </div>

            <div class="detail-field">
              <label>Min stock alert</label>
              <input
                v-model.number="form.minStock"
                type="number"
                placeholder="0"
                min="0"
                step="1"
                class="detail-input"
              />
              <span class="detail-hint">Fires a warning below this level</span>
            </div>

            <div class="detail-field">
              <label>Status</label>
              <div class="status-toggle">
                <button
                  type="button"
                  :class="{ active: form.status === 'Active' }"
                  @click="form.status = 'Active'"
                >
                  Active
                </button>
                <button
                  type="button"
                  :class="{ active: form.status === 'Inactive' }"
                  @click="form.status = 'Inactive'"
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ IMPORT ============ -->
      <section v-if="activeTab === 'import' && !isEditing" class="panel">
        <!-- Upload zone -->
        <div
          class="upload-zone"
          :class="{ dragging: isDragOver, busy: importing, filled: !!csvFile }"
          @click="!importing && triggerCsvUpload($event)"
          @dragover.prevent="!importing && (isDragOver = true)"
          @dragleave.prevent="!importing && (isDragOver = false)"
          @drop.prevent="!importing && handleCsvDrop($event)"
        >
          <template v-if="!csvFile">
            <div class="upload-glyph">↥</div>
            <div class="upload-title">Drop a CSV here</div>
            <div class="upload-sub">or click to browse · .csv only</div>
          </template>

          <template v-else>
            <div class="file-chip">
              <span class="file-glyph">📄</span>
              <div class="file-info">
                <span class="file-name">{{ csvFile.name }}</span>
                <span class="file-size">{{ formatFileSize(csvFile.size) }}</span>
              </div>
              <button
                type="button"
                class="file-remove"
                @click.stop="!importing && removeCsvFile()"
                :disabled="importing"
              >
                ✕
              </button>
            </div>
          </template>

          <input
            type="file"
            ref="csvFileInput"
            accept=".csv"
            @change="handleCsvUpload"
            style="display: none"
            :disabled="importing"
          />
        </div>

        <!-- Template + format hint -->
        <div class="format-row">
          <p class="format-hint">
            Columns: <code>storeId</code>, <code>groupId</code>, <code>itemCode</code>,
            <code>balance</code>, <code>minStock</code>, <code>status</code>
          </p>
          <button class="btn-ghost" @click="downloadTemplate" :disabled="importing">
            ⬇ Template
          </button>
        </div>

        <!-- Progress -->
        <div v-if="importing" class="progress-shell">
          <div class="progress-head">
            <span>Importing…</span>
            <span class="progress-count">
              {{ importProgress.processed }} / {{ importProgress.total }}
            </span>
          </div>
          <div class="progress-track">
            <div
              class="progress-bar"
              :style="{ width: importProgress.percentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Preview -->
        <div v-if="importPreviewData.length > 0 && !importing" class="preview-shell">
          <div class="preview-head">
            <span class="preview-title">Preview</span>
            <span class="preview-badge">{{ importPreviewData.length }} rows</span>
          </div>

          <div class="preview-body">
            <div class="preview-row preview-header">
              <span>Store</span>
              <span>Group</span>
              <span>Item</span>
              <span>Balance</span>
              <span>Status</span>
            </div>
            <div
              v-for="(item, index) in importPreviewData.slice(0, 8)"
              :key="index"
              class="preview-row"
            >
              <span class="cell-muted">{{ getStoreName(Number(item.storeId)) || item.storeId }}</span>
              <span class="cell-muted">{{ getGroupName(Number(item.groupId)) || item.groupId }}</span>
              <span class="cell-strong">{{ item.itemCode || item.itemId }}</span>
              <span>{{ item.balance }}</span>
              <span class="cell-muted">{{ item.status || 'Active' }}</span>
            </div>
            <div
              v-if="importPreviewData.length > 8"
              class="preview-row preview-more"
            >
              <span>+ {{ importPreviewData.length - 8 }} more rows</span>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div v-if="importResults && !importing" class="results-shell-out">
          <div class="result-stats">
            <div class="stat-item success">
              <span class="stat-value">{{ importResults.success }}</span>
              <span class="stat-label">imported</span>
            </div>
            <div class="stat-item failed">
              <span class="stat-value">{{ importResults.failed }}</span>
              <span class="stat-label">failed</span>
            </div>
            <div class="stat-item total">
              <span class="stat-value">{{ importResults.total }}</span>
              <span class="stat-label">total</span>
            </div>
          </div>

          <div
            v-if="importResults.errors && importResults.errors.length > 0"
            class="error-list"
          >
            <span class="error-title">Errors</span>
            <ul>
              <li v-for="(err, idx) in importResults.errors.slice(0, 4)" :key="idx">
                {{ err }}
              </li>
              <li v-if="importResults.errors.length > 4" class="error-more">
                + {{ importResults.errors.length - 4 }} more
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <!-- ============ STICKY ACTION BAR ============ -->
    <footer class="action-bar">
      <div class="action-bar-inner">
        <div class="action-hint">
          <span v-if="isEditing">Update mode</span>
          <span v-else-if="activeTab === 'manual'">Fill the form to continue</span>
          <span v-else>Ready to import</span>
        </div>

        <div class="action-buttons">
          <button
            class="btn btn-quiet"
            @click="goBack"
            :disabled="saving || importing"
          >
            Cancel
          </button>

          <button
            v-if="activeTab === 'manual' || isEditing"
            class="btn btn-primary"
            @click="saveBalance"
            :disabled="saving || (isEditing && form.balance !== undefined) || !form.itemId"
          >
            <span v-if="saving" class="btn-spinner"></span>
            <span>{{ saving ? 'Saving…' : isEditing ? 'Save changes' : 'Initialize' }}</span>
          </button>

          <button
            v-if="activeTab === 'import' && !isEditing"
            class="btn btn-primary"
            @click="processImport"
            :disabled="!csvFile || importing || importPreviewData.length === 0"
          >
            <span v-if="importing" class="btn-spinner"></span>
            <span>{{ importing ? 'Importing…' : 'Import' }}</span>
          </button>
        </div>
      </div>
    </footer>

    <!-- ============ TOAST ============ -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        <span class="toast-dot"></span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
/* ================================================================
   SCRIPT — UNCHANGED from working version
   ================================================================ */
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import balanceService from '@/stores/balanceService';

const route = useRoute();
const router = useRouter();

const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const userData = ref(getUserData());
const isAdmin = computed(() => userData.value?.isAdmin || false);

const editingBalanceId = computed(() => {
  const id = route.query.balanceId;
  return id ? Number(id) : null;
});
const isEditing = computed(() => !!editingBalanceId.value);

const stores = ref([]);
const groups = ref([]);
const categories = ref([]);
const inventoryItems = ref([]);

const form = ref({
  storeId: '',
  groupId: '',
  itemId: '',
  balance: 0,
  status: 'Active',
  minStock: 0,
});

const activeTab = ref('manual');
const saving = ref(false);

const itemSearchQuery = ref('');
const itemCategoryFilter = ref('');
const itemDisplayLimit = ref(10);
const selectedItemDisplay = ref(null);
const isLoadingItems = ref(false);

const importing = ref(false);
const isDragOver = ref(false);
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

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
};

/* ============ ITEM PICKER ============ */
const filteredItemsList = computed(() => {
  let items = [...inventoryItems.value];
  if (itemCategoryFilter.value) {
    const categoryId = Number(itemCategoryFilter.value);
    items = items.filter((item) => {
      const itemCategoryId =
        item.categoryId || item.category?.categoryId || item.category?.id || null;
      return itemCategoryId === categoryId;
    });
  }
  if (itemSearchQuery.value) {
    const q = itemSearchQuery.value.toLowerCase().trim();
    items = items.filter((item) => {
      const code = (item.code || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const standardName = (item.standardName || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const model = (item.model || '').toLowerCase();
      return (
        code.includes(q) ||
        name.includes(q) ||
        standardName.includes(q) ||
        brand.includes(q) ||
        model.includes(q)
      );
    });
  }
  return items;
});

const displayedItems = computed(() =>
  filteredItemsList.value.slice(0, itemDisplayLimit.value),
);
const hasMoreItems = computed(
  () => displayedItems.value.length < filteredItemsList.value.length,
);

// Only show the list once the user has searched or picked a category
const showItemList = computed(
  () => !!itemSearchQuery.value.trim() || !!itemCategoryFilter.value,
);

const resetItemList = () => {
  itemDisplayLimit.value = 10;
};

const onItemScroll = (event) => {
  const el = event.target;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    if (hasMoreItems.value && !isLoadingItems.value) {
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

/* ============ HELPERS ============ */
const getItemCommonName = (itemId) => {
  if (!itemId) return null;
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.name || item.standardName || null : null;
};

const getItemNameByCode = (code) => {
  if (!code) return null;
  const item = inventoryItems.value.find((i) => i.code === code);
  return item ? item.name || item.standardName || null : null;
};

const getStoreName = (storeId) => {
  const s = stores.value.find((x) => x.id === storeId);
  return s ? s.name : 'Unknown';
};

const getGroupName = (groupId) => {
  const g = groups.value.find((x) => x.id === groupId);
  return g ? g.name : 'Unknown';
};

const getItemUnit = (itemId) => {
  if (!itemId) return '';
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.uomCode || '' : '';
};

const getBaseUOM = (itemId) => {
  if (!itemId) return '';
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.conversionUomCode || item.uomCode || '' : '';
};

const getConversionValue = (itemId) => {
  if (!itemId) return 1;
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.conversionValue || 1 : 1;
};

const formatNumber = (num) => new Intl.NumberFormat().format(num);

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/* ============ DATA LOAD ============ */
const loadStores = async () => {
  try {
    const r = await balanceService.getStores();
    stores.value = r.data || [];
  } catch (e) {
    console.error('Error loading stores:', e);
  }
};

const loadGroups = async () => {
  try {
    const r = await balanceService.getGroups();
    groups.value = r.data || [];
  } catch (e) {
    console.error('Error loading groups:', e);
  }
};

const loadCategories = async () => {
  try {
    const r = await balanceService.getActiveCategories();
    if (r.success) categories.value = r.data || [];
  } catch (e) {
    console.error('Error loading categories:', e);
  }
};

const loadItems = async () => {
  try {
    const r = await balanceService.getActiveItems();
    if (r?.success) inventoryItems.value = r.data || [];
  } catch (e) {
    console.error('Error loading items:', e);
  }
};

const loadEditingBalance = async () => {
  if (!editingBalanceId.value) return;
  try {
    const r = await balanceService.getBalanceById(editingBalanceId.value);
    if (r?.success && r.data) {
      const b = r.data;
      form.value = {
        storeId: b.storeId,
        groupId: b.groupId,
        itemId: b.itemId,
        balance: b.balance,
        status: b.status || 'Active',
        minStock: b.minStock || 0,
      };
      const found = inventoryItems.value.find((i) => i.id === b.itemId);
      if (found) {
        selectedItemDisplay.value = found;
      } else {
        selectedItemDisplay.value = {
          id: b.itemId,
          code: b.itemCode,
          name: b.itemCommonName,
          standardName: b.itemStandardName,
          uomCode: b.uomCode,
        };
      }
    }
  } catch (e) {
    console.error('Error loading balance:', e);
    showToastMessage('Failed to load balance', 'error');
  }
};

/* ============ NAVIGATION ============ */
const goBack = () => {
  router.push({ name: 'store-balance' });
};

/* ============ SAVE ============ */
const saveBalance = async () => {
  if (!form.value.storeId) return showToastMessage('Please select a store', 'error');
  if (!form.value.groupId) return showToastMessage('Please select a group', 'error');
  if (!form.value.itemId) return showToastMessage('Please select an item', 'error');
  if (form.value.balance < 0) return showToastMessage('Balance cannot be negative', 'error');

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

    if (isEditing.value) {
      await balanceService.updateBalance(editingBalanceId.value, payload);
      showToastMessage('Balance updated successfully!', 'success');
    } else {
      await balanceService.createBalance(payload);
      showToastMessage('Balance initialized successfully!', 'success');
    }

    router.push({ name: 'store-balance', query: { refreshed: '1' } });
  } catch (err) {
    console.error('Save balance error:', err);
    showToastMessage(err.response?.data?.error || 'Failed to save balance', 'error');
  } finally {
    saving.value = false;
  }
};

/* ============ CSV IMPORT ============ */
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
    showToastMessage('Template downloaded!', 'success');
  } catch (e) {
    console.error(e);
    showToastMessage('Failed to download template', 'error');
  }
};

const triggerCsvUpload = () => {
  if (importing.value) return;
  csvFileInput.value?.click();
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
      const lines = text
        .split('\n')
        .filter((line) => line.trim() && !line.trim().startsWith('#'));

      if (lines.length < 2) {
        showToastMessage('CSV must contain headers and at least one data row', 'error');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const requiredHeaders = ['storeid', 'groupid', 'balance'];
      const hasItemId = headers.includes('itemid');
      const hasItemCode = headers.includes('itemcode');

      if (!hasItemId && !hasItemCode) {
        showToastMessage('CSV must contain either "itemId" or "itemCode"', 'error');
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
        headers.forEach((h, idx) => (obj[h] = values[idx] || ''));

        const storeId = parseInt(obj.storeid);
        const groupId = parseInt(obj.groupid);
        const balance = parseFloat(obj.balance);
        const itemId = obj.itemid ? parseInt(obj.itemid) : null;
        const itemCode = obj.itemcode || null;

        if ((!itemId && !itemCode) || isNaN(storeId) || isNaN(groupId) || isNaN(balance))
          continue;

        data.push({
          storeId,
          groupId,
          itemId,
          itemCode,
          balance,
          minStock: parseInt(obj.minstock) || 0,
          status: obj.status || 'Active',
        });
      }

      if (data.length === 0) {
        showToastMessage('No valid data found in CSV', 'error');
        importPreviewData.value = [];
        return;
      }

      importPreviewData.value = data;
      showToastMessage(`Parsed ${data.length} items from CSV`, 'success');
    } catch (err) {
      console.error(err);
      showToastMessage('Failed to parse CSV', 'error');
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
    showToastMessage('No data to import', 'error');
    return;
  }

  importing.value = true;
  importResults.value = null;

  const total = importPreviewData.value.length;
  importProgress.value = {
    total,
    processed: 0,
    success: 0,
    failed: 0,
    remaining: total,
    percentage: 0,
  };

  try {
    const response = await balanceService.importBalances(csvFile.value);
    importResults.value = response.data;
    showToastMessage(
      `Import: ${response.data.success} imported, ${response.data.failed} failed`,
      response.data.failed > 0 ? 'warning' : 'success',
    );
  } catch (err) {
    console.error(err);
    showToastMessage('Failed to import balances', 'error');
  } finally {
    importing.value = false;
  }
};

/* ============ LIFECYCLE ============ */
onMounted(async () => {
  userData.value = getUserData();

  await Promise.all([loadStores(), loadGroups(), loadCategories(), loadItems()]);

  if (!isAdmin.value && userData.value) {
    if (userData.value.assignedStore?.id && !form.value.storeId) {
      form.value.storeId = userData.value.assignedStore.id;
    }
    if (userData.value.assignedGroup?.id && !form.value.groupId) {
      form.value.groupId = userData.value.assignedGroup.id;
    }
  }

  if (isEditing.value) {
    await loadEditingBalance();
  }
});
</script>

<style scoped>
/* ================================================================
   BASE
   ================================================================ */
.init-page {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 100% -10%, rgba(139, 92, 246, 0.08), transparent 60%),
    radial-gradient(800px 400px at -10% 10%, rgba(59, 130, 246, 0.06), transparent 60%),
    #f7f8fc;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
}

.init-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

/* ================================================================
   HERO
   ================================================================ */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 60%, #6d28d9 100%);
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 20px 40px -20px rgba(76, 29, 149, 0.5);
}

.hero-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  backdrop-filter: blur(6px);
}

.hero-back:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
}

.hero-back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #c4b5fd;
  margin-bottom: 4px;
}

.hero-text h1 {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 4px 0;
  letter-spacing: -0.4px;
}

.hero-text p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
  margin: 0;
  line-height: 1.4;
}

.hero-illustration {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.illustration-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), transparent 70%);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.illustration-icon {
  font-size: 32px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* ================================================================
   MODE SWITCH
   ================================================================ */
.mode-switch {
  display: inline-flex;
  align-self: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}

.mode-btn:hover:not(.active) {
  color: #1e293b;
  background: #f8fafc;
}

.mode-btn.active {
  background: #1e1b4b;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(30, 27, 75, 0.25);
}

.mode-icon {
  font-size: 14px;
}

/* ================================================================
   PANEL
   ================================================================ */
.panel {
  background: #ffffff;
  border: 1px solid #e5e9f2;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.field-label > span:first-child {
  font-size: 12px;
  font-weight: 800;
  color: #1e1b4b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.field-hint {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* ================================================================
   SEARCH ROW — search input and category select side by side
   ================================================================ */
.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-shell {
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 46px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-shell:focus-within {
  border-color: #8b5cf6;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
}

.search-glyph {
  font-size: 18px;
  color: #94a3b8;
  font-weight: 700;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  min-width: 0;
}

.search-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.search-clear {
  border: none;
  background: none;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.search-clear:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.category-select {
  height: 46px;
  padding: 0 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  flex-shrink: 0;
  min-width: 160px;
  max-width: 240px;
}

.category-select:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
}

.results-badge {
  font-size: 11px;
  font-weight: 700;
  color: #6d28d9;
  background: #ede9fe;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ================================================================
   RESULTS
   ================================================================ */
.results-shell {
  border: 1px solid #e5e9f2;
  border-radius: 14px;
  background: #ffffff;
  max-height: 400px;
  overflow-y: auto;
  transition: all 0.2s;
}

.results-shell.is-empty {
  background: #f8fafc;
  border-style: dashed;
  border-color: #cbd5e1;
}

.results-shell::-webkit-scrollbar {
  width: 6px;
}

.results-shell::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.results-prompt,
.results-empty,
.results-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 20px;
  text-align: center;
}

.prompt-glyph,
.empty-glyph {
  font-size: 32px;
  color: #cbd5e1;
  font-weight: 700;
  line-height: 1;
}

.results-prompt p,
.results-empty p {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.prompt-sub {
  font-size: 11.5px;
  color: #94a3b8;
}

.results-loading {
  flex-direction: row;
  gap: 10px;
  font-size: 12.5px;
  color: #64748b;
}

.dot-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #e2e8f0;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-list {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.result-card:hover {
  background: #f8fafc;
}

.result-card.selected {
  background: #f5f3ff;
  box-shadow: inset 0 0 0 1.5px #a78bfa;
}

.result-leading {
  min-width: 90px;
  flex-shrink: 0;
}

.result-code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 11.5px;
  font-weight: 800;
  color: #6d28d9;
  background: #ede9fe;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.result-body {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 3px;
  align-items: center;
}

.meta-chip {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 10px;
}

.meta-chip.brand {
  background: #fae8ff;
  color: #86198f;
}

.meta-chip.model {
  background: #f1f5f9;
  color: #475569;
}

.meta-standard {
  font-size: 10.5px;
  color: #94a3b8;
  font-style: italic;
}

.result-trailing {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.uom-pill {
  font-size: 10.5px;
  font-weight: 800;
  color: #166534;
  background: #dcfce7;
  padding: 2px 10px;
  border-radius: 10px;
  letter-spacing: 0.3px;
}

.result-check {
  font-size: 14px;
  color: #6d28d9;
  font-weight: 700;
}

.results-more {
  text-align: center;
  padding: 10px;
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

/* ================================================================
   SELECTED CHIP
   ================================================================ */
.selected-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1.5px solid #86efac;
  border-radius: 12px;
}

.chip-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: #16a34a;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 900;
  flex-shrink: 0;
}

.chip-body {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.chip-code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 800;
  color: #15803d;
  background: #ffffff;
  padding: 2px 8px;
  border-radius: 6px;
}

.chip-name {
  font-size: 13px;
  font-weight: 600;
  color: #14532d;
}

.chip-uom {
  font-size: 11.5px;
  color: #15803d;
  font-weight: 600;
}

.chip-clear {
  background: none;
  border: none;
  color: #16a34a;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.chip-clear:hover {
  background: rgba(22, 163, 74, 0.1);
}

/* ================================================================
   LOCKED BOX (edit mode)
   ================================================================ */
.locked-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  flex-wrap: wrap;
}

.locked-code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 800;
  color: #6d28d9;
  background: #ede9fe;
  padding: 3px 9px;
  border-radius: 6px;
}

.locked-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
}

.locked-uom {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

/* ================================================================
   DETAILS GRID
   ================================================================ */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-field label {
  font-size: 11.5px;
  font-weight: 700;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}

.unit-suffix {
  font-size: 10.5px;
  font-weight: 800;
  color: #6d28d9;
  background: #f5f3ff;
  padding: 1px 7px;
  border-radius: 6px;
}

.req-dot {
  color: #ef4444;
  font-weight: 900;
}

.detail-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  background: #ffffff;
  transition: all 0.18s;
  outline: none;
}

.detail-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
}

.detail-input:read-only {
  background: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

.detail-hint {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.status-toggle {
  display: inline-flex;
  padding: 4px;
  background: #f1f5f9;
  border-radius: 10px;
  gap: 2px;
}

.status-toggle button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}

.status-toggle button.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.status-toggle button:first-child.active {
  color: #15803d;
}

.status-toggle button:last-child.active {
  color: #b91c1c;
}

/* ================================================================
   UPLOAD
   ================================================================ */
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 36px 20px;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.upload-zone:hover:not(.busy) {
  border-color: #a78bfa;
  background: #f5f3ff;
}

.upload-zone.dragging {
  border-color: #8b5cf6;
  background: #f5f3ff;
  transform: scale(1.005);
}

.upload-zone.filled {
  border-style: solid;
  border-color: #86efac;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  padding: 20px;
}

.upload-zone.busy {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-glyph {
  font-size: 40px;
  color: #a78bfa;
  font-weight: 300;
  line-height: 1;
  margin-bottom: 4px;
}

.upload-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e1b4b;
}

.upload-sub {
  font-size: 12px;
  color: #94a3b8;
}

.file-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.file-glyph {
  font-size: 28px;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  text-align: left;
}

.file-name {
  font-size: 13px;
  font-weight: 700;
  color: #14532d;
}

.file-size {
  font-size: 11px;
  color: #15803d;
}

.file-remove {
  background: rgba(220, 38, 38, 0.1);
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.15s;
}

.file-remove:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.2);
}

.file-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.format-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.format-hint {
  font-size: 11.5px;
  color: #64748b;
  margin: 0;
}

.format-hint code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  color: #6d28d9;
}

.btn-ghost {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #334155;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-ghost:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   PROGRESS
   ================================================================ */
.progress-shell {
  padding: 14px;
  background: #f5f3ff;
  border-radius: 12px;
  border: 1px solid #ddd6fe;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #4c1d95;
}

.progress-count {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-size: 11.5px;
}

.progress-track {
  height: 8px;
  background: #ffffff;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #6d28d9);
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* ================================================================
   PREVIEW
   ================================================================ */
.preview-shell {
  border: 1px solid #e5e9f2;
  border-radius: 14px;
  overflow: hidden;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e9f2;
}

.preview-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #475569;
}

.preview-badge {
  font-size: 11px;
  font-weight: 700;
  color: #6d28d9;
  background: #ede9fe;
  padding: 2px 10px;
  border-radius: 20px;
}

.preview-body {
  max-height: 320px;
  overflow-y: auto;
}

.preview-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr 0.8fr 0.8fr;
  gap: 10px;
  padding: 9px 16px;
  font-size: 12px;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-header {
  background: #f8fafc;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #94a3b8;
  position: sticky;
  top: 0;
  z-index: 1;
}

.cell-muted {
  color: #64748b;
}

.cell-strong {
  font-family: 'SF Mono', 'Monaco', monospace;
  font-weight: 800;
  color: #6d28d9;
}

.preview-more {
  justify-content: center;
  color: #94a3b8;
  font-style: italic;
  font-size: 11.5px;
  grid-template-columns: 1fr;
  text-align: center;
}

/* ================================================================
   RESULT STATS
   ================================================================ */
.results-shell-out {
  padding: 16px;
  border: 1px solid #e5e9f2;
  border-radius: 14px;
  background: #ffffff;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  border-radius: 10px;
  text-align: center;
}

.stat-item.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.stat-item.failed {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.stat-item.total {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.stat-item.success .stat-value {
  color: #15803d;
}

.stat-item.failed .stat-value {
  color: #b91c1c;
}

.stat-item.total .stat-value {
  color: #334155;
}

.stat-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #64748b;
}

.error-list {
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.error-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #b91c1c;
  margin-bottom: 6px;
  display: block;
}

.error-list ul {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #7f1d1d;
}

.error-list li {
  margin: 3px 0;
}

.error-more {
  color: #94a3b8;
  font-style: italic;
}

/* ================================================================
   ACTION BAR — sticky inside content flow, not viewport-fixed
   ================================================================ */
.action-bar {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid #e5e9f2;
  z-index: 20;
  margin-top: auto;
}

.action-bar-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.action-hint {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 22px;
  border-radius: 11px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
  white-space: nowrap;
}

.btn-quiet {
  background: transparent;
  color: #475569;
}

.btn-quiet:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-primary {
  background: linear-gradient(135deg, #6d28d9, #4c1d95);
  color: #ffffff;
  box-shadow: 0 6px 16px -6px rgba(109, 40, 217, 0.5);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5b21b6, #3b0764);
  box-shadow: 0 8px 20px -6px rgba(109, 40, 217, 0.6);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ================================================================
   TOAST
   ================================================================ */
.toast {
  position: fixed;
  bottom: 92px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #1e1b4b;
  color: #ffffff;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 12px 32px -8px rgba(30, 27, 75, 0.4);
  z-index: 30;
  max-width: 90vw;
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a78bfa;
  flex-shrink: 0;
}

.toast.success .toast-dot { background: #4ade80; }
.toast.error .toast-dot { background: #f87171; }
.toast.warning .toast-dot { background: #fbbf24; }
.toast.info .toast-dot { background: #60a5fa; }

/* transitions */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(-4px); }

.toast-enter-active,
.toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .init-shell {
    padding: 20px 20px 20px;
  }

  .action-bar-inner {
    padding: 14px 20px;
  }
}

@media (max-width: 640px) {
  .init-shell {
    padding: 16px 12px 16px;
  }

  .hero {
    padding: 20px;
    gap: 12px;
    border-radius: 16px;
  }

  .hero-text h1 {
    font-size: 18px;
  }

  .hero-text p {
    font-size: 12px;
  }

  .hero-illustration {
    display: none;
  }

  .panel {
    padding: 18px;
    border-radius: 16px;
    gap: 20px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  /* Stack search row on small screens */
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-shell {
    min-width: 0;
  }

  .category-select {
    width: 100%;
    max-width: none;
  }

  .results-badge {
    align-self: flex-start;
  }

  .preview-row {
    grid-template-columns: 1fr 1fr;
    font-size: 11.5px;
  }

  .preview-header span:nth-child(n+4) {
    display: none;
  }

  .preview-row span:nth-child(n+4) {
    display: none;
  }

  .result-stats {
    grid-template-columns: 1fr;
  }

  .action-bar-inner {
    padding: 12px 14px;
  }

  .action-hint {
    display: none;
  }

  .action-buttons {
    width: 100%;
    margin-left: 0;
  }

  .action-buttons .btn {
    flex: 1;
  }
}
</style>