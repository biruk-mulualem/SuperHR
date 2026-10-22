<!-- views/storemanagement/storebalance/WustLeWustTab.vue -->
<template>
  <div class="return-page">
    <div class="return-shell">
      <section class="panel">
        <div class="field-block">
          <div class="field-label">
  <span>Convert Items</span>
  <div class="header-actions">
    <span class="field-hint">Source → Target (different items)</span>
    <button
      type="button"
      class="history-btn"
      @click="goToHistory"
      :disabled="submitting"
      title="View ውስጥ ለውስጥ history"
    >
      <span class="history-icon">📋</span>
      <span>ውስጥ ለውስጥ History</span>
    </button>
  </div>
</div>

          <div class="convert-grid">
            <!-- ==========================================================
                 SOURCE ITEM — searchable + balance + quantity limit
                 ========================================================== -->
            <div class="item-panel source">
              <div class="item-panel-header">
                <span class="panel-badge badge-source">A</span>
                <span class="panel-title">Source Item (Out)</span>
              </div>

              <label class="small-label">Item</label>

              <!-- Selected chip -->
              <div v-if="sourceItem" class="selected-chip source-chip">
                <div class="chip-body">
                  <span class="chip-code">{{ sourceItem.code }}</span>
                  <span class="chip-name">{{ sourceItem.name }}</span>
                  <span class="chip-uom">{{ sourceItem.uomCode }}</span>
                </div>
                <button
                  type="button"
                  class="chip-clear"
                  :disabled="submitting"
                  @click="clearSource"
                  aria-label="Clear"
                >✕</button>
              </div>

              <!-- Search input -->
              <div v-if="!sourceItem" class="search-shell">
                <span class="search-glyph">⌕</span>
                <input
                  v-model="sourceQuery"
                  type="text"
                  placeholder="Search by code or name…"
                  class="search-input"
                  :disabled="submitting || loadingItems"
                  @focus="sourceFocused = true"
                  @blur="onBlurSource"
                />
                <button
                  v-if="sourceQuery"
                  type="button"
                  class="search-clear"
                  @click="sourceQuery = ''"
                  aria-label="Clear search"
                >✕</button>
              </div>

              <!-- Loading -->
              <div v-if="loadingItems" class="no-results">
                <span>⏳ Loading convertible items…</span>
              </div>

              <!-- Empty (no relationships) -->
              <div
                v-else-if="!sourceItem && items.length === 0"
                class="no-results"
              >
                <span>No convertible item pairs configured for your store</span>
              </div>

              <!-- Results — ONLY after the user types -->
              <div
                v-if="!sourceItem && !loadingItems && sourceFocused && sourceQuery.trim() && filteredSourceItems.length > 0"
                class="results-list"
              >
                <div
                  v-for="it in filteredSourceItems.slice(0, 8)"
                  :key="it.itemId"
                  class="result-item"
                  @mousedown.prevent="pickSource(it)"
                >
                  <span class="result-code">{{ it.code }}</span>
                  <span class="result-name">{{ it.name }}</span>
                  <span class="result-uom">{{ it.uomCode }}</span>
                  <span class="result-balance">{{ it.balance }}</span>
                </div>
              </div>

              <div
                v-else-if="!sourceItem && !loadingItems && sourceFocused && sourceQuery.trim() && filteredSourceItems.length === 0"
                class="no-results"
              >
                No items match "{{ sourceQuery }}"
              </div>

              <!-- Current balance of the selected source item -->
              <div v-if="sourceItem" class="balance-row">
                <span class="balance-label">Current balance</span>
                <span class="balance-value">
                  {{ sourceItem.balance }} {{ sourceItem.uomCode }}
                </span>
              </div>

              <label class="small-label">Quantity to subtract</label>
              <input
                v-model.number="form.quantity"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                class="text-input"
                :disabled="submitting || !sourceItem"
                :max="sourceItem ? sourceItem.balance : undefined"
                @input="onQuantityInput"
              />
              <span v-if="quantityExceedsBalance" class="field-error">
                Quantity can't exceed available balance ({{ sourceItem.balance }} {{ sourceItem.uomCode }})
              </span>
            </div>

            <!-- ---------- MIDDLE ---------- -->
            <div class="convert-middle">
              <div class="arrow">→</div>

              <label class="small-label center">Conversion Value</label>
              <input
                v-model.number="form.conversionValue"
                type="number"
                min="0.0001"
                step="0.0001"
                placeholder="1"
                class="conversion-input"
                :disabled="submitting"
                @input="onConversionEdit"
              />
              <span class="conversion-hint">{{ conversionHint }}</span>
            </div>

            <!-- ==========================================================
                 TARGET ITEM — read-only display + balance + after balance
                 ========================================================== -->
            <div class="item-panel target">
              <div class="item-panel-header">
                <span class="panel-badge badge-target">B</span>
                <span class="panel-title">Target Item (In)</span>
              </div>

              <label class="small-label">Item</label>

              <div v-if="targetItem" class="selected-chip target-chip">
                <div class="chip-body">
                  <span class="chip-code">{{ targetItem.code }}</span>
                  <span class="chip-name">{{ targetItem.name }}</span>
                  <span class="chip-uom">{{ targetItem.uomCode }}</span>
                </div>
              </div>

              <div v-else class="target-placeholder">
                <span class="placeholder-glyph">→</span>
                <span>Pick a source item first</span>
              </div>

              <div v-if="targetItem" class="balance-row balance-row-split">
                <div class="balance-cell">
                  <span class="balance-label">Current</span>
                  <span class="balance-value">
                    {{ targetItem.balance }} {{ targetItem.uomCode }}
                  </span>
                </div>
                <div class="balance-cell balance-after">
                  <span class="balance-label">After</span>
                  <span class="balance-value after-value">
                    {{ targetBalanceAfter }} {{ targetItem.uomCode }}
                  </span>
                </div>
              </div>

              <label class="small-label">Resulting quantity to add</label>
              <input
                v-model.number="form.resultQuantity"
                type="number"
                min="0"
                step="0.0001"
                placeholder="0"
                class="text-input result-input"
                :disabled="submitting || !targetItem"
                @input="onResultEdit"
              />
            </div>
          </div>
        </div>

        <!-- ---------- SUMMARY / TRANSFER NO / REMARK ---------- -->
        <div class="field-block">
          <div class="field-label">
            <span>Summary</span>
          </div>

          <div class="summary-line" v-if="canPreview">
            <span class="out-tag">OUT</span>
            <strong>{{ form.quantity }}</strong>
            {{ sourceItem.uomCode }}
            of <strong>{{ sourceItem.name }}</strong> ({{ sourceItem.code }})
            &nbsp;→&nbsp;
            <span class="in-tag">IN</span>
            <strong>{{ form.resultQuantity }}</strong>
            {{ targetItem.uomCode }}
            of <strong>{{ targetItem.name }}</strong> ({{ targetItem.code }})
            &nbsp;(× {{ form.conversionValue }})
          </div>
          <div class="summary-line muted" v-else>
            Pick a source item, and enter a quantity.
          </div>

          <div class="bottom-grid">
            <div class="detail-field">
  <label class="small-label">Transfer Number</label>
  <input
    v-model.trim="form.transferNumber"
    type="text"
    placeholder="e.g. WLW-2026-0042 (optional)"
    class="text-input"
    :disabled="submitting"
  />
  <span class="detail-hint">Optional document reference</span>
</div>

           <div class="detail-field detail-field--wide">
  <label class="small-label">Remark</label>
  <textarea
    v-model.trim="form.remark"
    rows="3"
    placeholder="Why is this conversion happening? (optional)"
    class="text-input textarea"
    :disabled="submitting"
  ></textarea>
</div>
          </div>
        </div>
      </section>
    </div>

    <!-- ---------- ACTION BAR ---------- -->
    <footer class="action-bar">
      <div class="action-bar-inner">
        <div class="action-hint">
          <span v-if="submitting">Converting…</span>
          <span v-else-if="!canSubmit">Fill in all required fields correctly</span>
          <span v-else>Ready to convert</span>
        </div>

        <div class="action-buttons">
          <button class="btn btn-quiet" @click="resetForm" :disabled="submitting">
            Reset
          </button>
          <button
            class="btn btn-primary"
            @click="submitConversion"
            :disabled="submitting || !canSubmit"
          >
            <span v-if="submitting" class="btn-spinner"></span>
            <span>{{ submitting ? 'Converting…' : 'Convert Items' }}</span>
          </button>
        </div>
      </div>
    </footer>

    <!-- ---------- TOAST ---------- -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        <span class="toast-dot"></span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import balanceService from '@/stores/balanceService';
import { useRouter } from 'vue-router';

const router = useRouter();
/* ================================================================
   ITEMS — loaded from backend (item_relationships + balances)
   ================================================================
   Each row from GET /api/balances/wust-lewust/items carries:
     - source item info + its current balance
     - target item info + its current balance
     - default conversion factor
   We flatten that into a list the tab can search & pick from,
   and remember the target stub so we can drop it into `items`
   without a second fetch when the source is selected.
   ================================================================ */

const items = ref([]);
const loadingItems = ref(false);




const loadItems = async () => {
  loadingItems.value = true;
  try {
    const res = await balanceService.getWustLeWustItems();

    if (res.success && res.data) {
      items.value = res.data.map((r) => ({
        // Source side
        itemId: r.itemId,
        code: r.code,
        name: r.name,
        uomCode: r.uomCode,
        balance: r.balance,
        defaultTargetItemId: r.targetItemId,
        defaultConversion: r.defaultConversion,

        // Target-side info (needed to stub the target item later)
        targetItemId: r.targetItemId,
        targetCode: r.targetCode,
        targetName: r.targetName,
        targetUomCode: r.targetUomCode,
        targetBalance: r.targetBalance,
      }));
    } else {
      showToastMessage(res.error || 'Failed to load items', 'error');
    }
  } catch (err) {
    console.error('Load wust-le-wust items error:', err);
    showToastMessage(
      err.response?.data?.error || err.message || 'Failed to load items',
      'error',
    );
  } finally {
    loadingItems.value = false;
  }
};

onMounted(loadItems);


/* ================================================================
   NAVIGATION
   ================================================================ */

const goToHistory = () => {
  router.push({ name: 'wust-lewust-history' });
  // OR if you use path-based routes:
  // router.push('/store-balance/wust-lewust/history');
};


/* ================================================================
   FORM STATE
   ================================================================ */

const form = ref({
  sourceItemId: '',
  targetItemId: '',
  quantity: 0,
  conversionValue: 1,
  resultQuantity: 0,
  transferNumber: '',
  remark: '',
});

const submitting = ref(false);
const autoFillConv = ref(true);
const autoFillResult = ref(true);

/* ================================================================
   SEARCH STATE (source only)
   ================================================================ */

const sourceQuery = ref('');
const sourceFocused = ref(false);

const filteredSourceItems = computed(() => {
  const q = sourceQuery.value.trim().toLowerCase();
  if (!q) return [];
  return items.value.filter((it) => {
    const hay = `${it.code} ${it.name}`.toLowerCase();
    return hay.includes(q);
  });
});

const onBlurSource = () => {
  setTimeout(() => (sourceFocused.value = false), 150);
};

/* ================================================================
   COMPUTED
   ================================================================ */

const sourceItem = computed(
  () => items.value.find((i) => i.itemId === Number(form.value.sourceItemId)) || null,
);

const targetItem = computed(
  () => items.value.find((i) => i.itemId === Number(form.value.targetItemId)) || null,
);

const targetBalanceAfter = computed(() => {
  if (!targetItem.value) return 0;
  const base = Number(targetItem.value.balance) || 0;
  const add = Number(form.value.resultQuantity) || 0;
  return Number((base + add).toFixed(4));
});

const quantityExceedsBalance = computed(() => {
  if (!sourceItem.value) return false;
  const q = Number(form.value.quantity) || 0;
  return q > Number(sourceItem.value.balance) + 0.0001;
});

const canPreview = computed(
  () =>
    !!sourceItem.value &&
    !!targetItem.value &&
    sourceItem.value.itemId !== targetItem.value.itemId &&
    Number(form.value.quantity) > 0,
);

const canSubmit = computed(
  () =>
    !!sourceItem.value &&
    !!targetItem.value &&
    sourceItem.value.itemId !== targetItem.value.itemId &&
    Number(form.value.quantity) > 0 &&
    Number(form.value.conversionValue) > 0 &&
    Number(form.value.resultQuantity) > 0 &&
    !quantityExceedsBalance.value,
    // 👈 removed:
    // !!form.value.transferNumber.trim()
    // !!form.value.remark.trim()
);
const conversionHint = computed(() => {
  if (!sourceItem.value || !targetItem.value) {
    return 'Pick a source item to load its conversion';
  }
  if (sourceItem.value.itemId === targetItem.value.itemId) {
    return 'Source and target items must be different';
  }
  const isDefault = sourceItem.value.defaultTargetItemId === targetItem.value.itemId;
  const known = isDefault ? sourceItem.value.defaultConversion : undefined;

  if (known == null) {
    return 'No default for this pair — enter manually';
  }
  if (autoFillConv.value) {
    return `Auto: 1 ${sourceItem.value.uomCode} = ${known} ${targetItem.value.uomCode}`;
  }
  return `Default was ${known} (you overrode it)`;
});

/* ================================================================
   PICK SOURCE
   ================================================================ */

const pickSource = (it) => {
  form.value.sourceItemId = it.itemId;
  sourceQuery.value = '';
  sourceFocused.value = false;
  onSourceChange();
};

const clearSource = () => {
  form.value.sourceItemId = '';
  form.value.targetItemId = '';
  form.value.quantity = 0;
  form.value.conversionValue = 1;
  form.value.resultQuantity = 0;
  sourceQuery.value = '';
  autoFillConv.value = true;
  autoFillResult.value = true;
};

/* ================================================================
   SOURCE CHANGE — auto-select target + stub it if not in items
   ================================================================ */

const onSourceChange = () => {
  form.value.quantity = 0;
  form.value.resultQuantity = 0;
  form.value.conversionValue = 1;
  autoFillConv.value = true;
  autoFillResult.value = true;

  if (!sourceItem.value) {
    form.value.targetItemId = '';
    return;
  }

  if (sourceItem.value.defaultTargetItemId) {
    form.value.targetItemId = sourceItem.value.defaultTargetItemId;

    // If the target item isn't already in `items`, push a stub
    // so the target panel can render (chip + balances).
    const exists = items.value.find(
      (i) => i.itemId === sourceItem.value.defaultTargetItemId,
    );
    if (!exists && sourceItem.value.targetCode) {
      items.value.push({
        itemId: sourceItem.value.targetItemId,
        code: sourceItem.value.targetCode,
        name: sourceItem.value.targetName,
        uomCode: sourceItem.value.targetUomCode,
        balance: sourceItem.value.targetBalance,
        defaultTargetItemId: null,
        defaultConversion: null,
      });
    }

    if (sourceItem.value.defaultConversion != null) {
      form.value.conversionValue = sourceItem.value.defaultConversion;
      autoFillConv.value = true;
    }
  } else {
    form.value.targetItemId = '';
  }

  recalcAll();
};

/* ================================================================
   QUANTITY INPUT — clamp to source balance
   ================================================================ */

const onQuantityInput = () => {
  if (sourceItem.value && Number(form.value.quantity) > Number(sourceItem.value.balance)) {
    form.value.quantity = Number(sourceItem.value.balance);
  }
  autoFillResult.value = true;
  recalcAll();
};

/* ================================================================
   DUAL-DIRECTION SYNC: conversion ↔ result
   ================================================================ */

const recalcAll = () => {
  const q = Number(form.value.quantity) || 0;
  const cv = Number(form.value.conversionValue) || 0;

  if (!q) {
    form.value.resultQuantity = 0;
    return;
  }

  if (autoFillResult.value) {
    form.value.resultQuantity = Number((q * cv).toFixed(4));
  } else if (autoFillConv.value) {
    const r = Number(form.value.resultQuantity) || 0;
    form.value.conversionValue = r ? Number((r / q).toFixed(4)) : 0;
  }
};

const onConversionEdit = () => {
  autoFillConv.value = false;
  autoFillResult.value = true;
  recalcAll();
};

const onResultEdit = () => {
  autoFillResult.value = false;
  autoFillConv.value = true;
  recalcAll();
};

watch(
  () => form.value.quantity,
  () => {
    autoFillResult.value = true;
    recalcAll();
  },
);

/* ================================================================
   SUBMIT — call the real backend + refresh local balances
   ================================================================ */

const submitConversion = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;
  try {
   const payload = {
  sourceItemId: Number(form.value.sourceItemId),
  targetItemId: Number(form.value.targetItemId),
  quantity: Number(form.value.quantity),
  conversionValue: Number(form.value.conversionValue),
  resultQuantity: Number(form.value.resultQuantity),
  transferNumber: form.value.transferNumber.trim() || null,  // 👈 null instead of ""
  remark: form.value.remark.trim() || null,                  // 👈 null instead of ""
};

    const res = await balanceService.wustLeWustTransfer(payload);

    if (res.success && res.data) {
      const s = res.data.source;
      const t = res.data.target;

      // Update local balances so the panels reflect the new values
      const srcLocal = items.value.find((i) => i.itemId === s.itemId);
      if (srcLocal) srcLocal.balance = s.newBalance;

      const tgtLocal = items.value.find((i) => i.itemId === t.itemId);
      if (tgtLocal) {
        tgtLocal.balance = t.newBalance;
      } else {
        // Target was auto-created by the backend — add it locally
        items.value.push({
          itemId: t.itemId,
          code: t.itemCode,
          name: t.itemName,
          uomCode: t.uomCode,
          balance: t.newBalance,
          defaultTargetItemId: null,
          defaultConversion: null,
        });
      }

      showToastMessage(
        `✅ ${s.quantity} ${s.uomCode} of ${s.itemCode} → ${t.resultQuantity} ${t.uomCode} of ${t.itemCode}`,
        'success',
      );

      resetForm();
    } else {
      showToastMessage(res.error || res.message || 'Transfer failed', 'error');
    }
  } catch (err) {
    console.error('Wust-le-wust transfer error:', err);
    showToastMessage(
      err.response?.data?.error || err.message || 'Failed to transfer',
      'error',
    );
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  form.value = {
    sourceItemId: '',
    targetItemId: '',
    quantity: 0,
    conversionValue: 1,
    resultQuantity: 0,
    transferNumber: '',
    remark: '',
  };
  sourceQuery.value = '';
  sourceFocused.value = false;
  autoFillConv.value = true;
  autoFillResult.value = true;
};

/* ================================================================
   TOAST
   ================================================================ */

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const showToastMessage = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
};
</script>

<style scoped>

/* ================================================================
   HEADER ACTIONS — history button
   ================================================================ */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #4338ca;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: inherit;
}

.history-btn:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #a5b4fc;
  color: #3730a3;
}

.history-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-icon {
  font-size: 13px;
  line-height: 1;
}
/* ================================================================
   BASE
   ================================================================ */
.return-page {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 100% -10%, rgba(59, 130, 246, 0.08), transparent 60%),
    radial-gradient(800px 400px at -10% 10%, rgba(139, 92, 246, 0.06), transparent 60%),
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
  padding: 24px 32px;
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
   CONVERT GRID
   ================================================================ */
.convert-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: start;
}

.item-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  min-height: 100%;
}

.item-panel.source { border-color: #fecaca; background: #fff5f5; }
.item-panel.target { border-color: #bbf7d0; background: #f5fdf8; }

.item-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
}

.badge-source { background: #dc2626; }
.badge-target { background: #16a34a; }

.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.small-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.small-label.center { text-align: center; display: block; }

.req-dot {
  color: #ef4444;
  font-weight: 900;
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 500;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  font-family: inherit;
  transition: all 0.18s;
}

.text-input:focus {
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.text-input:disabled {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.textarea {
  resize: vertical;
  min-height: 70px;
}

.result-input {
  background: #ecfdf5 !important;
  color: #166534 !important;
  font-weight: 700;
}

/* ---------- Balance rows ---------- */
.balance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 11.5px;
}

.balance-row-split {
  align-items: stretch;
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.balance-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
}

.balance-cell + .balance-cell {
  border-left: 1px solid #e2e8f0;
}

.balance-label {
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.balance-value {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}

.balance-after .balance-label { color: #15803d; }
.balance-after .after-value { color: #15803d; }

/* ---------- Field error ---------- */
.field-error {
  font-size: 11px;
  color: #dc2626;
  font-weight: 600;
  padding: 2px 0;
}

/* ================================================================
   SEARCH (source only)
   ================================================================ */
.search-shell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  transition: all 0.18s;
}

.search-shell:focus-within {
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.search-glyph {
  font-size: 16px;
  color: #94a3b8;
  font-weight: 700;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #0f172a;
  font-weight: 500;
  min-width: 0;
}

.search-input::placeholder { color: #94a3b8; font-weight: 400; }

.search-clear {
  border: none;
  background: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  flex-shrink: 0;
}

.search-clear:hover { background: #f1f5f9; color: #0f172a; }

/* ---------- Results dropdown ---------- */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 12.5px;
}

.result-item:hover { background: #f1f5f9; }

.result-code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 10.5px;
  font-weight: 800;
  color: #4338ca;
  background: #eef2ff;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.result-name {
  color: #1e293b;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-uom {
  color: #64748b;
  font-weight: 700;
  font-size: 10.5px;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.result-balance {
  color: #15803d;
  font-weight: 700;
  font-size: 10.5px;
  background: #dcfce7;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.no-results {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

/* ================================================================
   SELECTED CHIP
   ================================================================ */
.selected-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1.5px solid #86efac;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
}

.source-chip {
  border-color: #fca5a5;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
}

.target-chip {
  border-color: #86efac;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
}

.chip-body {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.chip-code {
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  font-weight: 800;
  color: #dc2626;
  background: #ffffff;
  padding: 1px 6px;
  border-radius: 4px;
}

.target-chip .chip-code { color: #15803d; }

.chip-name {
  color: #1e293b;
  font-weight: 600;
  font-size: 12.5px;
}

.chip-uom {
  color: #64748b;
  font-weight: 700;
  font-size: 10.5px;
  background: #ffffff;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.chip-clear {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: background 0.12s;
}

.chip-clear:hover { background: rgba(0, 0, 0, 0.06); }
.chip-clear:disabled { opacity: 0.4; cursor: not-allowed; }

/* ---------- Target placeholder ---------- */
.target-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
}

.placeholder-glyph {
  font-size: 16px;
  color: #cbd5e1;
}

/* ---------- Middle ---------- */
.convert-middle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 4px;
  min-width: 150px;
  align-self: center;
}

.arrow {
  font-size: 26px;
  font-weight: 800;
  color: #6366f1;
  line-height: 1;
  margin-bottom: 4px;
}

.conversion-input {
  width: 100%;
  max-width: 130px;
  padding: 10px 12px;
  border: 1.5px solid #c7d2fe;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #4338ca;
  background: #ffffff;
  outline: none;
  text-align: center;
  font-family: inherit;
  transition: all 0.18s;
}

.conversion-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}

.conversion-hint {
  font-size: 10.5px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.3;
  max-width: 150px;
}

/* ================================================================
   SUMMARY
   ================================================================ */
.summary-line {
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #1e293b;
  line-height: 1.6;
}

.summary-line.muted {
  color: #94a3b8;
  font-style: italic;
}

.summary-line strong {
  color: #0f172a;
  font-weight: 700;
}

.out-tag,
.in-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-right: 4px;
}

.out-tag { background: #fee2e2; color: #991b1b; }
.in-tag  { background: #dcfce7; color: #166534; }

/* ---------- Bottom grid ---------- */
.bottom-grid {
  display: grid;
  grid-template-columns: minmax(220px, 320px) 1fr;
  gap: 16px;
  align-items: start;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  background: #1e1b4b;
  color: #ffffff;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 12px 32px -8px rgba(30, 27, 75, 0.5);
  z-index: 30;
  max-width: 90vw;
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #818cf8;
  flex-shrink: 0;
}

.toast.success .toast-dot { background: #4ade80; }
.toast.error   .toast-dot { background: #f87171; }
.toast.warning .toast-dot { background: #fbbf24; }

.toast.error   { background: #7f1d1d; }
.toast.warning { background: #78350f; }

.toast-enter-active,
.toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* ================================================================
   RESPONSIVE
   ================================================================ */
@media (max-width: 900px) {
  .return-shell { padding: 20px; }
  .action-bar-inner { padding: 14px 20px; }
}

@media (max-width: 700px) {
  .convert-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .convert-middle {
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 4px 0;
    align-self: stretch;
  }

  .arrow {
    transform: rotate(90deg);
    margin-bottom: 0;
  }

  .conversion-input {
    max-width: 100px;
  }

  .conversion-hint {
    max-width: none;
    text-align: left;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .return-shell { padding: 16px 12px; }

  .panel { padding: 18px; border-radius: 16px; gap: 20px; }

  .action-bar-inner { padding: 12px 14px; }
  .action-hint { display: none; }
  .action-buttons { width: 100%; margin-left: 0; }
  .action-buttons .btn { flex: 1; }
}
</style>