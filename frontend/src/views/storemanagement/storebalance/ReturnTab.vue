<!-- views/storemanagement/storebalance/ReturnTab.vue -->
<template>
  <div class="return-page">
    <div class="return-shell">
      <!-- ============ FORM CARD ============ -->
      <section class="panel">
        <!-- Item selection -->
        <div class="field-block">
          <div class="field-label">
            <span>Item</span>
            <span class="field-hint">Search to reveal results</span>
          </div>

          <div class="search-row">
            <div class="search-shell">
              <span class="search-glyph">⌕</span>
              <input
                v-model="itemSearchQuery"
                type="text"
                placeholder="Search by code, name, brand, or model…"
                class="search-input"
                :disabled="submitting"
              />
              <button
                v-if="itemSearchQuery"
                type="button"
                class="search-clear"
                @click="itemSearchQuery = ''"
                aria-label="Clear search"
              >
                ✕
              </button>
            </div>

            <select
              v-model="itemCategoryFilter"
              class="category-select"
              :disabled="submitting"
            >
              <option value="">All categories</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Results -->
          <div class="results-shell" :class="{ 'is-empty': !showItemList }">
            <div v-if="!showItemList" class="results-prompt">
              <span class="prompt-glyph">⌕</span>
              <p>Start typing to search items</p>
              <span class="prompt-sub">Or choose a category</span>
            </div>

            <div v-else-if="isLoadingItems" class="results-prompt">
              <span class="prompt-glyph">⏳</span>
              <p>Loading items…</p>
            </div>

            <div v-else-if="displayedItems.length > 0" class="results-list">
              <div
                v-for="item in displayedItems"
                :key="item.id"
                class="result-card"
                :class="{ selected: form.itemId === item.id }"
                @click="!submitting && selectItem(item)"
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
                  </div>
                </div>
                <div class="result-trailing">
                  <span class="uom-pill">{{ item.uomCode || 'N/A' }}</span>
                  <span class="result-check" v-if="form.itemId === item.id">✓</span>
                </div>
              </div>
            </div>

            <div v-else class="results-empty">
              <span class="empty-glyph">∅</span>
              <p>No items match your search</p>
              <span class="prompt-sub">Try a different term or category</span>
            </div>
          </div>

          <!-- Selected chip -->
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
                :disabled="submitting"
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
          </transition>
        </div>

        <!-- Return details -->
        <div class="field-block">
          <div class="field-label">
            <span>Return Details</span>
          </div>

          <div class="details-grid">
            <div class="detail-field">
              <label>
                Quantity
                <span class="unit-suffix" v-if="getItemUnit(form.itemId)">
                  {{ getItemUnit(form.itemId) }}
                </span>
                <span class="req-dot">•</span>
              </label>
              <input
                v-model.number="form.quantity"
                type="number"
                placeholder="0"
                min="0.01"
                step="0.01"
                class="detail-input"
                :disabled="submitting"
              />
              <span class="detail-hint">How many units are coming back?</span>
            </div>

            <!-- Transfer Number next to Quantity -->
            <div class="detail-field">
              <label>
                Transfer Number
                <span class="req-dot">•</span>
              </label>
              <input
                v-model.trim="form.grnNumber"
                type="text"
                placeholder="e.g. GRN-2026-0042"
                class="detail-input"
                :disabled="submitting"
              />
              <span class="detail-hint">Goods Received Note reference</span>
            </div>

            <div class="detail-field detail-field--wide">
              <label>Remark <span class="req-dot">•</span></label>
              <textarea
                v-model.trim="form.remark"
                rows="3"
                placeholder="Why is this being returned?"
                class="detail-input detail-textarea"
                :disabled="submitting"
              ></textarea>
              <span class="detail-hint">A short reason helps the audit trail</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ============ ACTION BAR ============ -->
    <footer class="action-bar">
      <div class="action-bar-inner">
        <div class="action-hint">
          <span v-if="submitting">Returning item…</span>
          <span v-else-if="!canSubmit">Select an item, quantity, Transfer number, and remark</span>
          <span v-else>Ready to return</span>
        </div>

        <div class="action-buttons">
          <button class="btn btn-quiet" @click="goBack" :disabled="submitting">
            Cancel
          </button>
          <button
            class="btn btn-primary"
            @click="submitReturn"
            :disabled="submitting || !canSubmit"
          >
            <span v-if="submitting" class="btn-spinner"></span>
            <span>{{ submitting ? 'Returning…' : 'Return Item' }}</span>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import balanceService from '@/stores/balanceService';

const router = useRouter();

/* ============ USER ============ */
const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const userData = ref(getUserData());

/* ============ DATA (loaded from API) ============ */
const categories = ref([]);
const inventoryItems = ref([]);
const isLoadingItems = ref(false);

/* ============ FORM ============ */
const form = ref({
  itemId: '',
  quantity: 0,
  remark: '',
  grnNumber: '',
});

const itemSearchQuery = ref('');
const itemCategoryFilter = ref('');
const selectedItemDisplay = ref(null);
const submitting = ref(false);

/* ============ ITEM PICKER ============ */
const filteredItemsList = computed(() => {
  let items = [...inventoryItems.value];
  if (itemCategoryFilter.value) {
    const cid = Number(itemCategoryFilter.value);
    items = items.filter((i) => {
      const itemCatId = i.categoryId ?? i.category?.categoryId ?? i.category?.id ?? null;
      return itemCatId === cid;
    });
  }
  if (itemSearchQuery.value) {
    const q = itemSearchQuery.value.toLowerCase().trim();
    items = items.filter((i) => {
      const haystack = [i.code, i.name, i.standardName, i.brand, i.model]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }
  return items;
});

const displayedItems = computed(() => filteredItemsList.value.slice(0, 10));

const showItemList = computed(
  () => !!itemSearchQuery.value.trim() || !!itemCategoryFilter.value
);

const selectItem = (item) => {
  form.value.itemId = item.id;
  selectedItemDisplay.value = item;
};

const clearItemSelection = () => {
  form.value.itemId = '';
  selectedItemDisplay.value = null;
  itemSearchQuery.value = '';
  itemCategoryFilter.value = '';
};

/* ============ HELPERS ============ */
const getItemUnit = (itemId) => {
  if (!itemId) return '';
  const item = inventoryItems.value.find((i) => i.id === itemId);
  return item ? item.uomCode || '' : '';
};

const canSubmit = computed(() => {
  return (
    !!form.value.itemId &&
    Number(form.value.quantity) > 0 &&
    !!form.value.remark.trim() &&
    !!form.value.grnNumber.trim()
  );
});

/* ============ LOADERS ============ */
const loadCategories = async () => {
  try {
    const r = await balanceService.getActiveCategories();
    if (r?.success) categories.value = r.data || [];
  } catch (e) {
    console.error('Error loading categories:', e);
  }
};

const loadItems = async () => {
  isLoadingItems.value = true;
  try {
    const r = await balanceService.getActiveItems({ storeId: null, groupId: null });
    if (r?.success) inventoryItems.value = r.data || [];
  } catch (e) {
    console.error('Error loading items:', e);
  } finally {
    isLoadingItems.value = false;
  }
};

/* ============ SUBMIT ============ */
const submitReturn = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
    const response = await balanceService.stockIn({
      itemId: Number(form.value.itemId),
      quantity: Number(form.value.quantity),
      remark: form.value.remark,
      grnNumber: form.value.grnNumber.trim(),
    });

    if (response.success) {
      showToastMessage(
        response.message || 'Item stocked in successfully!',
        'success'
      );
      form.value = { itemId: '', quantity: 0, remark: '', grnNumber: '' };
      selectedItemDisplay.value = null;
      itemSearchQuery.value = '';
      itemCategoryFilter.value = '';
    } else {
      showToastMessage(response.error || 'Failed to stock in item', 'error');
    }
  } catch (err) {
    console.error('Stock-in error:', err);
    showToastMessage(
      err.response?.data?.error || 'Failed to stock in item',
      'error'
    );
  } finally {
    submitting.value = false;
  }
};

/* ============ NAV ============ */
const goBack = () => {
  router.push({ name: 'store-balance' });
};

/* ============ TOAST ============ */
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
};

/* ============ LIFECYCLE ============ */
onMounted(async () => {
  userData.value = getUserData();
  await Promise.all([loadCategories(), loadItems()]);
});
</script>

<style scoped>
/* ================================================================
   BASE
   ================================================================ */
.return-page {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 100% -10%, rgba(34, 197, 94, 0.08), transparent 60%),
    radial-gradient(800px 400px at -10% 10%, rgba(59, 130, 246, 0.06), transparent 60%),
    #f7f8fc;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
}

.return-shell {
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
   SEARCH
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
  border-color: #22c55e;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
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

.search-input::placeholder { color: #94a3b8; font-weight: 400; }

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

.search-clear:hover { background: #e2e8f0; color: #0f172a; }

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
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
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

.results-prompt,
.results-empty {
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

.result-card:hover { background: #f8fafc; }

.result-card.selected {
  background: #f0fdf4;
  box-shadow: inset 0 0 0 1.5px #86efac;
}

.result-leading { min-width: 90px; flex-shrink: 0; }

.result-code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 11.5px;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.result-body { flex: 1; min-width: 0; }

.result-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #0f172a;
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

.meta-chip.brand { background: #fae8ff; color: #86198f; }
.meta-chip.model { background: #f1f5f9; color: #475569; }

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
  color: #15803d;
  font-weight: 700;
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

.chip-clear:hover { background: rgba(22, 163, 74, 0.1); }

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

.detail-field--wide {
  grid-column: 1 / -1;
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
  color: #15803d;
  background: #f0fdf4;
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
  font-family: inherit;
}

.detail-input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.detail-input:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.detail-textarea {
  resize: vertical;
  min-height: 70px;
}

.detail-hint {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* ================================================================
   ACTION BAR
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

.btn-quiet { background: transparent; color: #475569; }
.btn-quiet:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; }

.btn-primary {
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #ffffff;
  box-shadow: 0 6px 16px -6px rgba(22, 163, 74, 0.5);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #15803d, #166534);
  box-shadow: 0 8px 20px -6px rgba(22, 163, 74, 0.6);
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

@keyframes spin { to { transform: rotate(360deg); } }

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
  background: #14532d;
  color: #ffffff;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 12px 32px -8px rgba(20, 83, 45, 0.4);
  z-index: 30;
  max-width: 90vw;
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}

.toast.success .toast-dot { background: #4ade80; }
.toast.error .toast-dot { background: #f87171; }
.toast.warning .toast-dot { background: #fbbf24; }
.toast.info .toast-dot { background: #60a5fa; }

.toast.error { background: #7f1d1d; }
.toast.warning { background: #78350f; }

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
  .return-shell { padding: 20px 20px 20px; }
  .action-bar-inner { padding: 14px 20px; }
}

@media (max-width: 640px) {
  .return-shell { padding: 16px 12px 16px; }

  .panel { padding: 18px; border-radius: 16px; gap: 20px; }

  .details-grid { grid-template-columns: 1fr; }

  .search-row { flex-direction: column; align-items: stretch; }
  .search-shell { min-width: 0; }
  .category-select { width: 100%; max-width: none; }

  .action-bar-inner { padding: 12px 14px; }
  .action-hint { display: none; }
  .action-buttons { width: 100%; margin-left: 0; }
  .action-buttons .btn { flex: 1; }
}
</style>