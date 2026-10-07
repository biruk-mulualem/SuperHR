<template>
  <div class="process-page">
    <!-- ============================================================ -->
    <!-- PAGE HEADER                                                  -->
    <!-- ============================================================ -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack" :disabled="processing">
          ← Back
        </button>
        <div class="header-title">
          <span class="header-icon">📋</span>
          <div>
            <h1>Process Approved Requests</h1>
            <p class="header-subtitle">Apply approved requests to store balances</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- PAGE BODY                                                    -->
    <!-- ============================================================ -->
    <div class="page-body">
      <!-- STEP 1: SELECT STORE (Admin only) -->
      <div v-if="isAdmin" class="step-container">
        <div class="step-indicator">
          <span class="step-number">1</span>
          <span class="step-label">Select Store</span>
          <span class="step-line"></span>
        </div>
        <div class="step-content">
          <div class="form-group">
            <select
              v-model="selectedStoreId"
              required
              @change="onStoreSelect"
              class="form-select-enhanced"
              :class="{ 'has-value': selectedStoreId }"
            >
              <option value="">Choose a store...</option>
              <option v-for="store in stores" :key="store.id" :value="store.id">
                🏪 {{ store.name }}
              </option>
            </select>
            <span class="form-hint">Select the store to process requests for</span>
          </div>
        </div>
      </div>

      <!-- STEP 2: SELECT REQUESTS -->
      <div class="step-container">
        <div class="step-indicator">
          <span class="step-number">{{ isAdmin ? '2' : '1' }}</span>
          <span class="step-label">Select Requests</span>
          <span class="step-line"></span>
        </div>
        <div class="step-content">
          <div v-if="!selectedStoreId && !isAdmin" class="empty-requests">
            <span class="empty-icon">🏪</span>
            <p>Waiting for store...</p>
            <span class="empty-sub">Your assigned store is being loaded</span>
          </div>

          <div v-else-if="storeRequests.length === 0" class="empty-requests">
            <span class="empty-icon">✅</span>
            <p>No pending requests found</p>
            <span class="empty-sub">All requests have been processed</span>
          </div>

          <div v-else>
            <!-- Select All -->
            <div class="select-all-container">
              <label class="select-all-label">
                <input
                  type="checkbox"
                  v-model="selectAllRequests"
                  @change="toggleAllRequests"
                />
                <span class="select-all-text">
                  Select All ({{ storeRequests.length }} requests)
                </span>
                <span class="select-all-badge">{{ getTotalRequestItems() }} items</span>
              </label>
            </div>

            <!-- Request List -->
            <div class="requests-checkbox-list">
              <div
                v-for="req in storeRequests"
                :key="req.id"
                class="request-item"
                :class="{
                  selected: selectedRequestIds.includes(req.id),
                  expanded: expandedRequestId === req.id,
                }"
              >
                <!-- Request Row -->
                <div class="request-row">
                  <label class="request-checkbox">
                    <input
                      type="checkbox"
                      v-model="selectedRequestIds"
                      :value="req.id"
                      @change="onRequestSelect"
                    />
                    <div class="request-info">
                      <div class="request-header-info">
                        <span class="req-code">{{ req.requestCode }}</span>
                        <span class="req-date">{{ formatDate(req.requestedDate) }}</span>
                      </div>
                      <div class="req-details">
                        <span class="req-items-count">📦 {{ req.items?.length || 0 }} items</span>
                        <span class="req-action" :class="getItemActionClass(req)">
                          {{ getItemActionLabel(req) }}
                        </span>
                        <span v-if="hasCustomConfig(req.id)" class="req-partial-badge">
                          🔀 {{ getCustomConfigSummary(req.id) }}
                        </span>
                      </div>
                      <div v-if="req.remark" class="req-remark">
                        💬 {{ req.remark }}
                      </div>
                    </div>
                  </label>

                  <!-- 🔀 Partial button (outside label) -->
                  <button
                    v-if="selectedRequestIds.includes(req.id)"
                    type="button"
                    class="btn-partial"
                    :class="{ 'has-custom': hasCustomConfig(req.id) }"
                    @click.stop="togglePartialPanel(req.id)"
                    :title="
                      expandedRequestId === req.id
                        ? 'Close'
                        : 'Process only some items'
                    "
                  >
                    <span class="partial-icon">🔀</span>
                    <span class="partial-label">
                      {{ expandedRequestId === req.id ? 'Close' : 'Partial' }}
                    </span>
                  </button>
                </div>

                <!-- 🔀 PARTIAL PANEL -->
                <div v-if="expandedRequestId === req.id" class="partial-panel">
                  <div class="partial-header">
                    <span class="partial-title">
                      🔀 Partial processing for <strong>{{ req.requestCode }}</strong>
                    </span>
                    <button
                      type="button"
                      class="mini-btn"
                      @click="resetConfigToFull(req)"
                    >
                      Reset to Full
                    </button>
                  </div>

                  <p class="partial-hint">
                    Untick items you don't want to process. Adjust the quantity if you
                    only want to process part of it.
                  </p>

                  <div v-if="loadingItemDetails" class="partial-loading">
                    <span class="spinner"></span>
                    <span>Loading item details...</span>
                  </div>

                  <div v-else class="partial-items">
                    <div
                      v-for="item in req.items"
                      :key="getItemKey(req.id, item)"
                      class="partial-item"
                      :class="{
                        'is-selected': isItemSelected(getItemKey(req.id, item)),
                        'is-disabled': getRemainingQty(getItemKey(req.id, item)) <= 0,
                        'is-partial':
                          getItemProcessingStatus(getItemKey(req.id, item)) === 'partial',
                        'is-completed':
                          getItemProcessingStatus(getItemKey(req.id, item)) === 'completed',
                      }"
                      @click="toggleItemSelection(req.id, item)"
                    >
                      <div class="partial-item-check">
                        <input
                          type="checkbox"
                          :checked="isItemSelected(getItemKey(req.id, item))"
                          :disabled="
                            getRemainingQty(getItemKey(req.id, item)) <= 0 || processing
                          "
                          @click.stop="toggleItemSelection(req.id, item)"
                        />
                      </div>

                      <div class="partial-item-info">
                        <div class="partial-item-name">
                          {{ getItemCommonName(item.itemId) }}
                          <span
                            v-if="getItemProcessingStatus(getItemKey(req.id, item)) === 'completed'"
                            class="item-done-tag"
                          >
                            ✅ Fully Processed
                          </span>
                        </div>
                        <div class="partial-item-meta">
                          <span>
                            Requested:
                            <strong>{{ Number(item.quantity).toFixed(2) }}</strong>
                            {{ getUomDisplay(item) }}
                          </span>
                          <span
                            v-if="getProcessedQty(getItemKey(req.id, item)) > 0"
                            class="meta-processed"
                          >
                            ✅
                            {{ Number(getProcessedQty(getItemKey(req.id, item))).toFixed(2) }}
                            done
                          </span>
                          <span
                            class="meta-remaining"
                            :class="{
                              'meta-remaining--zero':
                                getRemainingQty(getItemKey(req.id, item)) <= 0,
                            }"
                          >
                            ⏳ Remaining:
                            <strong>
                              {{
                                Number(getRemainingQty(getItemKey(req.id, item))).toFixed(2)
                              }}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div class="partial-item-qty" @click.stop>
                        <input
                          v-model.number="itemQuantities[getItemKey(req.id, item)]"
                          type="number"
                          min="0"
                          :max="getRemainingQty(getItemKey(req.id, item))"
                          step="0.01"
                          class="qty-input"
                          :disabled="
                            !isItemSelected(getItemKey(req.id, item)) ||
                            getRemainingQty(getItemKey(req.id, item)) <= 0 ||
                            processing
                          "
                          @input="validateItemQuantity(getItemKey(req.id, item))"
                          @blur="validateItemQuantity(getItemKey(req.id, item))"
                        />
                        <span class="qty-uom">{{ getUomDisplay(item) }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="partial-footer">
                    <span class="partial-summary">
                      {{ getConfiguredItemCount(req.id) }} of
                      {{ req.items?.length || 0 }} items ·
                      {{ getConfiguredQuantity(req.id).toFixed(2) }} qty
                    </span>
                    <button
                      type="button"
                      class="btn-save-partial"
                      @click="closePartialPanel"
                    >
                      ✅ Done
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selection Summary -->
            <div v-if="selectedRequestIds.length > 0" class="selection-summary">
              <span class="summary-icon">📋</span>
              <span class="summary-text">
                {{ selectedRequestIds.length }} request(s) selected
              </span>
              <span v-if="totalCustomizedCount > 0" class="summary-customized">
                🔀 {{ totalCustomizedCount }} partial
              </span>
              <span class="summary-items">
                {{ getSelectedTotalItems() }} total items
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3: SELECT GROUP (Admin only) -->
      <div v-if="isAdmin && selectedRequestIds.length > 0" class="step-container">
        <div class="step-indicator">
          <span class="step-number">3</span>
          <span class="step-label">Select Group</span>
          <span class="step-line"></span>
        </div>
        <div class="step-content">
          <div class="form-group">
            <select
              v-model="selectedGroupId"
              required
              class="form-select-enhanced"
              :class="{ 'has-value': selectedGroupId }"
            >
              <option value="">Choose a group...</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                👥 {{ group.name }}
              </option>
            </select>
            <span class="form-hint">
              Select the group that will receive/remove stock
            </span>
          </div>
        </div>
      </div>

      <!-- STEP 4: DOCUMENT REFERENCES & PREVIEW -->
      <div
        v-if="selectedRequestIds.length > 0 && (isAdmin ? selectedGroupId : true)"
        class="step-container"
      >
        <div class="step-indicator">
          <span class="step-number">{{ isAdmin ? '4' : '2' }}</span>
          <span class="step-label">Document References</span>
          <span class="step-line"></span>
        </div>
        <div class="step-content">
          <div class="preview-container">
            <div class="preview-header">
              <span class="preview-icon">📊</span>
              <span class="preview-title">Request Preview</span>
              <span class="preview-badge">
                {{ selectedRequestIds.length }} request(s)
              </span>
            </div>

            <div class="preview-requests">
              <div
                v-for="req in selectedRequests"
                :key="req.id"
                class="preview-request"
                :class="{ 'has-error': requestHasErrors(req) }"
              >
                <div class="preview-request-header">
                  <span class="preview-request-code">{{ req.requestCode }}</span>
                  <span class="preview-action" :class="getItemActionClass(req)">
                    {{ getItemActionLabel(req) }}
                  </span>
                  <span v-if="hasCustomConfig(req.id)" class="custom-badge">
                    🔀 Partial
                  </span>
                  <span v-if="requestHasErrors(req)" class="doc-error-badge">
                    ⚠️ Required
                  </span>
                  <span
                    v-else-if="requestAllDocsFilled(req)"
                    class="doc-valid-badge"
                  >
                    ✅
                  </span>
                </div>

                <!-- ============================================ -->
                <!-- PER-ITEM DOC INPUTS                          -->
                <!-- ============================================ -->
                <div class="preview-request-items">
                  <div
                    v-for="item in getPreviewItems(req)"
                    :key="item.key"
                    class="preview-item-row"
                    :class="{ 'preview-item-row--skipped': !item.included }"
                  >
                    <!-- Item name + qty -->
                    <div class="preview-item-info">
                      <span class="preview-item-name">
                        {{ getItemCommonName(item.itemId) }}
                      </span>
                      <span class="preview-item-qty" v-if="item.included">
                        ×{{ Number(item.qty).toFixed(2) }} {{ getUomDisplay(item) }}
                      </span>
                      <span class="preview-item-qty preview-qty--skipped" v-else>
                        skipped
                      </span>
                    </div>

                    <!-- Per-item doc input -->
                    <div
                      v-if="item.included"
                      class="doc-input-wrapper doc-input-wrapper--item"
                      :class="[
                        getItemActionClass(req),
                        { 'has-error': requestDocsErrors[item.key] },
                      ]"
                    >
                      <span class="doc-input-icon">
                        {{ getItemActionLabel(req).includes('ADD') ? '📥' : '📤' }}
                      </span>
                      <span class="doc-input-label">
                        {{ getItemActionLabel(req).includes('ADD') ? 'GRN No.' : 'S.I.V No.' }}
                      </span>
                      <input
                        v-model="requestDocs[item.key]"
                        type="text"
                        class="doc-input-field"
                        :class="{ 'has-error': requestDocsErrors[item.key] }"
                        :placeholder="
                          getItemActionLabel(req).includes('ADD')
                            ? 'Enter GRN Number...'
                            : 'Enter S.I.V Number...'
                        "
                        :disabled="processing"
                        @input="validateDoc(item.key)"
                        @blur="validateDoc(item.key)"
                      />
                      <span v-if="requestDocsErrors[item.key]" class="doc-error-msg">
                        Required
                      </span>
                      <span
                        v-else-if="requestDocs[item.key] && requestDocs[item.key].trim()"
                        class="doc-valid-icon"
                      >
                        ✅
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="req.remark" class="preview-remark">
                  💬 {{ req.remark }}
                </div>
              </div>
            </div>

            <div v-if="selectedRequestIds.length > 0" class="doc-summary">
              <span class="doc-summary-icon">📋</span>
              <span class="doc-summary-text">
                {{ getFilledDocCount() }} of {{ getTotalRequiredDocCount() }} item docs filled
              </span>
              <span v-if="!isAllDocsValid" class="doc-summary-warning">
                ⚠️ Please fill all required fields
              </span>
              <span v-else class="doc-summary-success">
                ✅ All item document references provided
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- STICKY FOOTER                                                -->
    <!-- ============================================================ -->
    <div class="page-footer">
      <div class="footer-left">
        <span v-if="selectedStoreId && storeRequests.length > 0" class="footer-hint">
          {{ storeRequests.length }} request(s) available ·
          {{ selectedRequestIds.length }} selected
        </span>
      </div>
      <div class="footer-right">
        <button class="btn-secondary" @click="goBack" :disabled="processing">
          Cancel
        </button>
        <button
          class="btn-primary"
          @click="openConfirmation"
          :disabled="
            selectedRequestIds.length === 0 ||
            (isAdmin && !selectedGroupId) ||
            processing ||
            !isAllDocsValid
          "
        >
          {{
            processing
              ? 'Processing...'
              : `Process ${selectedRequestIds.length} Request(s)`
          }}
        </button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- CONFIRMATION MODAL                                           -->
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
              <h3>Confirm Processing</h3>
              <p class="modal-subtitle">Please review before proceeding</p>
            </div>
          </div>
          <button class="modal-close" @click="closeConfirmation">✕</button>
        </div>

        <div class="modal-body">
          <div class="confirmation-icon">🔄</div>
          <p class="confirmation-title">
            Are you sure you want to process these requests?
          </p>

          <div class="confirmation-details">
            <div class="detail-row">
              <span class="detail-label">Requests</span>
              <span class="detail-value">
                {{ selectedRequestIds.length }} request(s)
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Items</span>
              <span class="detail-value">{{ getFinalProcessedItemCount() }} items</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Store</span>
              <span class="detail-value">
                {{
                  isAdmin
                    ? getStoreName(Number(selectedStoreId))
                    : userData?.assignedStore?.name || 'Your Store'
                }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Group</span>
              <span class="detail-value">
                {{
                  isAdmin
                    ? getGroupName(Number(selectedGroupId))
                    : userData?.assignedGroup?.name || 'Your Group'
                }}
              </span>
            </div>
            <div class="detail-row highlight">
              <span class="detail-label">⚠️ Action</span>
              <span class="detail-value">
                {{
                  getItemsByAction('add') > 0
                    ? `➕ Add ${getItemsByAction('add')} items`
                    : ''
                }}
                {{
                  getItemsByAction('add') > 0 && getItemsByAction('remove') > 0
                    ? ' & '
                    : ''
                }}
                {{
                  getItemsByAction('remove') > 0
                    ? `➖ Remove ${getItemsByAction('remove')} items`
                    : ''
                }}
              </span>
            </div>
            <div
              v-if="totalCustomizedCount > 0"
              class="detail-row highlight-blue"
            >
              <span class="detail-label">🔀 Partial</span>
              <span class="detail-value">
                {{ totalCustomizedCount }} request(s) will process partially
              </span>
            </div>
            <!-- Document references — now per-item -->
            <div
              v-for="(doc, itemKey) in getDocumentReferences()"
              :key="itemKey"
              class="detail-row"
            >
              <span class="detail-label">
                📄 {{ getRequestCodeFromComposite(itemKey) }} ·
                {{ getItemNameFromComposite(itemKey) }}
              </span>
              <span class="detail-value">{{ doc }}</span>
            </div>
          </div>

          <div class="warning-box">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">
              This action will update store balances and cannot be undone.
              Please verify the requests and items before proceeding.
            </span>
          </div>

          <div class="requests-confirmation-list">
            <div
              v-for="req in selectedRequests.slice(0, 5)"
              :key="req.id"
              class="confirmation-request"
            >
              <span class="confirmation-req-code">{{ req.requestCode }}</span>
              <span class="confirmation-req-items">
                {{ getPreviewItems(req).filter((i) => i.included).length }} of
                {{ req.items.length }} items
              </span>
              <span v-if="hasCustomConfig(req.id)" class="confirmation-req-custom">
                🔀
              </span>
              <span
                class="confirmation-req-action"
                :class="getItemActionClass(req)"
              >
                {{ getItemActionLabel(req) }}
              </span>
            </div>
            <div v-if="selectedRequests.length > 5" class="confirmation-more">
              ... and {{ selectedRequests.length - 5 }} more requests
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeConfirmation">Cancel</button>
          <button
            class="btn-primary confirm-btn"
            @click="processRequests"
            :disabled="processing"
          >
            {{ processing ? 'Processing...' : '✅ Confirm & Process' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import balanceService from '@/stores/balanceService';

const router = useRouter();

/* ================================================================
   USER DATA
   ================================================================ */
const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const userData = ref(getUserData());
const isAdmin = computed(() => userData.value?.isAdmin || false);

/* ================================================================
   DATA FROM BACKEND
   ================================================================ */
const stores = ref([]);
const groups = ref([]);
const inventoryItems = ref([]);
const isLoadingPage = ref(true);

/* ================================================================
   STATE
   ================================================================ */
const selectedStoreId = ref('');
const selectedGroupId = ref('');
const selectedRequestIds = ref([]);
const storeRequests = ref([]);
const processing = ref(false);
const selectAllRequests = ref(false);
const showConfirmation = ref(false);

// ✅ Now keyed by composite key "reqId::itemId"
const requestDocs = ref({});
const requestDocsErrors = ref({});

const expandedRequestId = ref(null);
const itemSelection = ref({});
const itemQuantities = ref({});
const itemProcessingInfo = ref({});
const configuredRequests = ref({});
const loadingItemDetails = ref(false);

/* ================================================================
   ✅ COMPOSITE KEY — unique per item per request
   ================================================================ */
const getItemKey = (reqId, item) => {
  const uniquePart = item.itemId ?? item.id ?? item.itemCode ?? 'unknown';
  return `${reqId}::${uniquePart}`;
};

/* ================================================================
   COMPUTED
   ================================================================ */
const selectedRequests = computed(() =>
  storeRequests.value.filter((req) =>
    selectedRequestIds.value.includes(req.id)
  )
);

/**
 * ✅ CHANGED: Now validates every INCLUDED item per selected request.
 * For each item returned by getPreviewItems() with included === true,
 * a non-empty doc must exist at requestDocs[item.key].
 */
const isAllDocsValid = computed(() => {
  if (selectedRequestIds.value.length === 0) return false;

  for (const req of selectedRequests.value) {
    const includedItems = getPreviewItems(req).filter((i) => i.included);
    for (const item of includedItems) {
      const val = (requestDocs.value[item.key] || '').trim();
      if (!val) return false;
    }
  }
  return true;
});

const totalCustomizedCount = computed(
  () => selectedRequestIds.value.filter((id) => hasCustomConfig(id)).length
);

const buildItemsToProcess = computed(() => {
  const out = [];
  for (const req of selectedRequests.value) {
    if (hasCustomConfig(req.id)) {
      (req.items || []).forEach((item) => {
        const key = getItemKey(req.id, item);
        const qty = Number(itemQuantities.value[key] || 0);
        if (itemSelection.value[key] && qty > 0) {
          out.push({
            requestId: req.id,
            requestDetailId: item.id ?? item.detailId,
            quantity: qty,
          });
        }
      });
    } else {
      (req.items || []).forEach((item) => {
        out.push({
          requestId: req.id,
          requestDetailId: item.id ?? item.detailId,
          quantity: Number(item.quantity),
        });
      });
    }
  }
  return out;
});

/* ================================================================
   WATCHERS
   ================================================================ */
watch(selectedRequestIds, (newIds) => {
  const currentReqIds = new Set(newIds);

  // ✅ CHANGED: clean doc entries whose composite key doesn't belong to a still-selected request
  Object.keys(requestDocs.value).forEach((compositeKey) => {
    const [reqIdStr] = String(compositeKey).split('::');
    if (!currentReqIds.has(Number(reqIdStr))) {
      delete requestDocs.value[compositeKey];
      delete requestDocsErrors.value[compositeKey];
    }
  });

  // Clean item state for deselected requests (parse composite keys)
  const selectedReqIds = new Set(newIds);
  const newSelection = { ...itemSelection.value };
  const newQuantities = { ...itemQuantities.value };
  const newInfo = { ...itemProcessingInfo.value };

  Object.keys(newSelection).forEach((key) => {
    const [reqIdStr] = String(key).split('::');
    if (!selectedReqIds.has(Number(reqIdStr))) {
      delete newSelection[key];
      delete newQuantities[key];
      delete newInfo[key];
    }
  });

  itemSelection.value = newSelection;
  itemQuantities.value = newQuantities;
  itemProcessingInfo.value = newInfo;

  Object.keys(configuredRequests.value).forEach((reqId) => {
    if (!currentReqIds.has(Number(reqId))) {
      delete configuredRequests.value[reqId];
    }
  });

  if (expandedRequestId.value && !currentReqIds.has(expandedRequestId.value)) {
    expandedRequestId.value = null;
  }
}, { immediate: true });

/* ================================================================
   NAVIGATION
   ================================================================ */
const goBack = () => router.push({ name: 'store-balance' });

/* ================================================================
   BASIC HELPERS
   ================================================================ */
const getStoreName = (storeId) =>
  stores.value.find((s) => s.id === storeId)?.name || 'Unknown';

const getGroupName = (groupId) =>
  groups.value.find((g) => g.id === groupId)?.name || 'Unknown';

const getItemCommonName = (itemId) => {
  const item = inventoryItems.value.find(
    (i) => i.id === itemId || i.itemId === itemId
  );
  if (item) {
    return item.name || item.standardName || item.itemName || `Item ${itemId}`;
  }
  for (const req of storeRequests.value) {
    const found = req.items?.find(
      (i) => i.itemId === itemId || i.id === itemId
    );
    if (found) {
      return (
        found.itemName ||
        found.item?.standardName ||
        found.item?.name ||
        found.name ||
        `Item ${itemId}`
      );
    }
  }
  return `Item ${itemId}`;
};

const getItemActionLabel = (req) => {
  if (selectedStoreId.value === String(req.askingStoreId)) {
    return '➕ ADD to balance';
  } else if (selectedStoreId.value === String(req.supplyingStoreId)) {
    return '➖ REMOVE from balance';
  }
  return '';
};

const getItemActionClass = (req) => {
  if (selectedStoreId.value === String(req.askingStoreId)) return 'action-add';
  if (selectedStoreId.value === String(req.supplyingStoreId))
    return 'action-remove';
  return '';
};

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getTotalRequestItems = () => {
  let total = 0;
  storeRequests.value.forEach((req) => {
    total += req.items?.length || 0;
  });
  return total;
};

const getSelectedTotalItems = () => {
  let total = 0;
  selectedRequests.value.forEach((req) => {
    total += req.items?.length || 0;
  });
  return total;
};

const getItemsByAction = (action) => {
  let count = 0;
  selectedRequests.value.forEach((req) => {
    const label = getItemActionLabel(req);
    const itemsToCount = hasCustomConfig(req.id)
      ? getPreviewItems(req).filter((i) => i.included).length
      : req.items?.length || 0;
    if (action === 'add' && label.includes('ADD')) count += itemsToCount;
    if (action === 'remove' && label.includes('REMOVE')) count += itemsToCount;
  });
  return count;
};

/**
 * ✅ CHANGED: counts filled per-item docs across all selected requests.
 */
const getFilledDocCount = () => {
  let count = 0;
  for (const req of selectedRequests.value) {
    const includedItems = getPreviewItems(req).filter((i) => i.included);
    for (const item of includedItems) {
      if ((requestDocs.value[item.key] || '').trim()) count++;
    }
  }
  return count;
};

/**
 * ✅ NEW: total number of included items across all selected requests
 * that need a doc.
 */
const getTotalRequiredDocCount = () => {
  let count = 0;
  for (const req of selectedRequests.value) {
    count += getPreviewItems(req).filter((i) => i.included).length;
  }
  return count;
};

/**
 * ✅ CHANGED: emits flat map keyed by composite "reqId::itemId".
 * The backend reads documentRefs[`${requestId}::${itemDetailId}`].
 */
const getDocumentReferences = () => {
  const docs = {};
  for (const req of selectedRequests.value) {
    const includedItems = getPreviewItems(req).filter((i) => i.included);
    for (const item of includedItems) {
      const val = (requestDocs.value[item.key] || '').trim();
      if (val) docs[item.key] = val;
    }
  }
  return docs;
};

const getRequestCode = (reqId) => {
  const req = selectedRequests.value.find((r) => r.id === reqId);
  return req ? req.requestCode : reqId;
};

const getRequestCodeFromComposite = (compositeKey) => {
  const [reqIdStr] = String(compositeKey).split('::');
  return getRequestCode(Number(reqIdStr));
};

const getItemNameFromComposite = (compositeKey) => {
  const [, itemIdStr] = String(compositeKey).split('::');
  return getItemCommonName(Number(itemIdStr));
};

/* ================================================================
   ✅ PER-REQUEST DOC VALIDATION HELPERS
   ================================================================ */

/**
 * Returns true if any included item in the given request is missing a doc.
 */
const requestHasErrors = (req) => {
  const includedItems = getPreviewItems(req).filter((i) => i.included);
  return includedItems.some((item) => !(requestDocs.value[item.key] || '').trim());
};

/**
 * Returns true if every included item in the given request has a doc.
 */
const requestAllDocsFilled = (req) => {
  const includedItems = getPreviewItems(req).filter((i) => i.included);
  if (includedItems.length === 0) return false;
  return includedItems.every((item) => (requestDocs.value[item.key] || '').trim());
};

/**
 * ✅ CHANGED: now takes a composite key instead of a request id.
 */
const validateDoc = (itemKey) => {
  const val = (requestDocs.value[itemKey] || '').trim();
  requestDocsErrors.value = {
    ...requestDocsErrors.value,
    [itemKey]: !val,
  };
};

/* ================================================================
   UOM
   ================================================================ */
const getUomDisplay = (item) => {
  if (item.uomCode) return item.uomCode;
  if (item.uom_code) return item.uom_code;
  if (item.selectedUom === 'conversion' && item.conversionUomCode)
    return item.conversionUomCode;
  if (item.baseUomCode) return item.baseUomCode;
  if (item.item?.uom?.code) return item.item.uom.code;
  if (item.item?.uom) {
    if (typeof item.item.uom === 'string') return item.item.uom;
    if (item.item.uom.code) return item.item.uom.code;
    if (item.item.uom.name) return item.item.uom.name;
  }
  return 'Qty';
};

/* ================================================================
   PARTIAL PANEL
   ================================================================ */
const togglePartialPanel = (reqId) => {
  if (expandedRequestId.value === reqId) {
    expandedRequestId.value = null;
  } else {
    expandedRequestId.value = reqId;
    loadItemDetailsForRequest(reqId);
  }
};

const closePartialPanel = () => {
  const reqId = expandedRequestId.value;
  if (reqId) {
    const req = storeRequests.value.find((r) => r.id === reqId);
    if (req) {
      const isFull = (req.items || []).every((item) => {
        const key = getItemKey(reqId, item);
        const sel = itemSelection.value[key];
        const qty = Number(itemQuantities.value[key] || 0);
        const original = Number(item.quantity);
        const remaining = getRemainingQty(key);
        if (remaining <= 0) return true;
        return sel && Math.abs(qty - original) < 0.0001;
      });
      if (isFull) {
        const next = { ...configuredRequests.value };
        delete next[reqId];
        configuredRequests.value = next;
      } else {
        configuredRequests.value = {
          ...configuredRequests.value,
          [reqId]: true,
        };
      }
    }
  }
  expandedRequestId.value = null;
};

const resetConfigToFull = (req) => {
  const newSelection = { ...itemSelection.value };
  const newQuantities = { ...itemQuantities.value };

  (req.items || []).forEach((item) => {
    const key = getItemKey(req.id, item);
    const remaining = getRemainingQty(key);
    if (remaining > 0) {
      newSelection[key] = true;
      newQuantities[key] = remaining;
    } else {
      newSelection[key] = false;
      newQuantities[key] = 0;
    }
  });

  itemSelection.value = newSelection;
  itemQuantities.value = newQuantities;

  const next = { ...configuredRequests.value };
  delete next[req.id];
  configuredRequests.value = next;
};

const hasCustomConfig = (reqId) => !!configuredRequests.value[reqId];

const getCustomConfigSummary = (reqId) => {
  const req = storeRequests.value.find((r) => r.id === reqId);
  if (!req) return '';
  const included = (req.items || []).filter((i) => {
    const key = getItemKey(reqId, i);
    return itemSelection.value[key] && getRemainingQty(key) > 0;
  });
  return `${included.length}/${req.items?.length || 0} items`;
};

const getConfiguredItemCount = (reqId) => {
  const req = storeRequests.value.find((r) => r.id === reqId);
  if (!req) return 0;
  return (req.items || []).filter((i) => {
    const key = getItemKey(reqId, i);
    return itemSelection.value[key] && getRemainingQty(key) > 0;
  }).length;
};

const getConfiguredQuantity = (reqId) => {
  const req = storeRequests.value.find((r) => r.id === reqId);
  if (!req) return 0;
  return (req.items || []).reduce((sum, item) => {
    const key = getItemKey(reqId, item);
    if (itemSelection.value[key] && getRemainingQty(key) > 0) {
      return sum + Number(itemQuantities.value[key] || 0);
    }
    return sum;
  }, 0);
};

/* ================================================================
   ✅ ITEM SELECTION — composite key
   ================================================================ */
const isItemSelected = (itemKey) => {
  return !!itemSelection.value[itemKey];
};

const toggleItemSelection = (reqId, item) => {
  const key = getItemKey(reqId, item);

  if (getRemainingQty(key) <= 0) return;
  if (processing.value) return;

  const newValue = !itemSelection.value[key];
  const remaining = getRemainingQty(key);

  itemSelection.value = {
    ...itemSelection.value,
    [key]: newValue,
  };

  itemQuantities.value = {
    ...itemQuantities.value,
    [key]: newValue ? remaining : 0,
  };
};

/* ================================================================
   PARTIAL PROCESSING HELPERS
   ================================================================ */
const loadItemDetailsForRequest = async (reqId) => {
  const groupId = isAdmin.value
    ? Number(selectedGroupId.value)
    : userData.value?.assignedGroup?.id;

  if (!groupId || !selectedStoreId.value) return;

  loadingItemDetails.value = true;

  const req = storeRequests.value.find((r) => r.id === reqId);

  try {
    const response = await balanceService.getProcessableItems(
      reqId,
      groupId,
      Number(selectedStoreId.value)
    );

    console.log('🔍 ================================');
    console.log('🔍 loadItemDetailsForRequest reqId:', reqId);
    console.log('🔍 Backend response items:');
    (response?.data?.items || []).forEach((i) => {
      console.log(`   requestDetailId=${i.requestDetailId} | remaining=${i.remainingQuantity} | status=${i.status}`);
    });
    console.log('🔍 Frontend req.items (from storeRequests):');
    (req?.items || []).forEach((i) => {
      console.log(`   item.id=${i.id} | item.detailId=${i.detailId} | item.itemId=${i.itemId}`);
    });

    const apiInfoByDetailId = {};
    if (response?.success && response.data?.items?.length) {
      response.data.items.forEach((info) => {
        apiInfoByDetailId[info.requestDetailId] = {
          processedQuantity: Number(info.processedQuantity) || 0,
          remainingQuantity: Number(info.remainingQuantity) || 0,
          status: info.status || 'pending',
        };
      });
    }

    console.log('🔍 apiInfoByDetailId keys:', Object.keys(apiInfoByDetailId));
    console.log('🔍 ================================');

    const newInfo = { ...itemProcessingInfo.value };
    const newSelection = { ...itemSelection.value };
    const newQuantities = { ...itemQuantities.value };

    (req?.items || []).forEach((item) => {
      const key = getItemKey(reqId, item);
      const itemDetailId = item.id ?? item.detailId;
      const apiInfo = apiInfoByDetailId[itemDetailId] || {
        processedQuantity: 0,
        remainingQuantity: Number(item.quantity) || 0,
        status: 'pending',
      };

      newInfo[key] = apiInfo;
      if (newQuantities[key] === undefined) {
        newQuantities[key] = apiInfo.remainingQuantity;
      }
      if (newSelection[key] === undefined) {
        newSelection[key] = apiInfo.remainingQuantity > 0;
      }
    });

    (req?.items || []).forEach((item) => {
      const key = getItemKey(reqId, item);
      const info = newInfo[key];
      if (info && Number(info.remainingQuantity) <= 0) {
        newSelection[key] = false;
        newQuantities[key] = 0;
      }
    });

    itemProcessingInfo.value = newInfo;
    itemSelection.value = newSelection;
    itemQuantities.value = newQuantities;
  } catch (err) {
    console.warn(`⚠️ Fallback for request ${reqId}:`, err);

    const newInfo = { ...itemProcessingInfo.value };
    const newSelection = { ...itemSelection.value };
    const newQuantities = { ...itemQuantities.value };

    (req?.items || []).forEach((item) => {
      const key = getItemKey(reqId, item);
      if (newInfo[key] === undefined) {
        newInfo[key] = {
          processedQuantity: 0,
          remainingQuantity: Number(item.quantity) || 0,
          status: 'pending',
        };
      }
      if (newQuantities[key] === undefined) {
        newQuantities[key] = Number(item.quantity) || 0;
      }
      if (newSelection[key] === undefined) {
        newSelection[key] = true;
      }
    });

    (req?.items || []).forEach((item) => {
      const key = getItemKey(reqId, item);
      const info = newInfo[key];
      if (info && Number(info.remainingQuantity) <= 0) {
        newSelection[key] = false;
        newQuantities[key] = 0;
      }
    });

    itemProcessingInfo.value = newInfo;
    itemSelection.value = newSelection;
    itemQuantities.value = newQuantities;
  } finally {
    loadingItemDetails.value = false;
  }
};

const getRemainingQty = (itemKey) => {
  const info = itemProcessingInfo.value[itemKey];
  if (info) return Number(info.remainingQuantity) || 0;

  const [reqIdStr, itemIdStr] = String(itemKey).split('::');
  const reqId = Number(reqIdStr);
  const numericItemId = Number(itemIdStr);

  const req = storeRequests.value.find((r) => r.id === reqId);
  const item = req?.items?.find(
    (i) =>
      i.id === numericItemId ||
      i.itemId === numericItemId ||
      String(i.itemId) === itemIdStr ||
      String(i.id) === itemIdStr
  );

  return Number(item?.quantity) || 0;
};

const getProcessedQty = (itemKey) => {
  const info = itemProcessingInfo.value[itemKey];
  return info ? Number(info.processedQuantity) || 0 : 0;
};

const getItemProcessingStatus = (itemKey) =>
  itemProcessingInfo.value[itemKey]?.status || 'pending';

const validateItemQuantity = (itemKey) => {
  const qty = Number(itemQuantities.value[itemKey] || 0);
  const remaining = getRemainingQty(itemKey);
  if (qty < 0) {
    itemQuantities.value = { ...itemQuantities.value, [itemKey]: 0 };
  }
  if (qty > remaining) {
    itemQuantities.value = { ...itemQuantities.value, [itemKey]: remaining };
  }
};

const getPreviewItems = (req) => {
  const isCustom = hasCustomConfig(req.id);
  return (req.items || []).map((item) => {
    const key = getItemKey(req.id, item);
    const remaining = getRemainingQty(key);
    const included = isCustom
      ? !!itemSelection.value[key] && remaining > 0
      : remaining > 0;
    const qty = isCustom
      ? Number(itemQuantities.value[key] || 0)
      : remaining;
    return {
      key,
      id: item.id ?? item.detailId,
      itemId: item.itemId,
      quantity: item.quantity,
      qty,
      included,
    };
  });
};

const getFinalProcessedItemCount = () => {
  let n = 0;
  for (const req of selectedRequests.value) {
    if (hasCustomConfig(req.id)) {
      n += (req.items || []).filter((i) => {
        const key = getItemKey(req.id, i);
        return itemSelection.value[key] && getRemainingQty(key) > 0;
      }).length;
    } else {
      n += (req.items || []).filter((i) => {
        const key = getItemKey(req.id, i);
        return getRemainingQty(key) > 0;
      }).length;
    }
  }
  return n;
};

/* ================================================================
   DATA LOAD
   ================================================================ */
const fetchStores = async () => {
  try {
    const r = await balanceService.getStores();
    stores.value = r.data || [];
  } catch (e) {
    console.error('Error fetching stores:', e);
  }
};

const fetchGroups = async () => {
  try {
    const r = await balanceService.getGroups();
    groups.value = r.data || [];
  } catch (e) {
    console.error('Error fetching groups:', e);
  }
};

const fetchItems = async () => {
  try {
    const r = await balanceService.getActiveItems();
    if (r?.success) inventoryItems.value = r.data || [];
  } catch (e) {
    console.error('Error fetching items:', e);
  }
};

/* ================================================================
   STORE & REQUEST SELECTION
   ================================================================ */
const onStoreSelect = async () => {
  selectedRequestIds.value = [];
  storeRequests.value = [];
  selectAllRequests.value = false;
  selectedGroupId.value = '';
  requestDocs.value = {};
  requestDocsErrors.value = {};
  itemSelection.value = {};
  itemQuantities.value = {};
  itemProcessingInfo.value = {};
  configuredRequests.value = {};
  expandedRequestId.value = null;

  if (!selectedStoreId.value) return;

  try {
    const storeId = Number(selectedStoreId.value);
    const groupId = userData.value?.assignedGroup?.id;
    const response = await balanceService.getApprovedRequests(storeId, groupId);
    storeRequests.value = response.data || [];

    if (storeRequests.value.length > 0) {
      selectAllRequests.value = true;
      selectedRequestIds.value = storeRequests.value.map((req) => req.id);
    }
  } catch (error) {
    console.error('Error fetching approved requests:', error);
  }
};

const toggleAllRequests = () => {
  if (selectAllRequests.value) {
    selectedRequestIds.value = storeRequests.value.map((req) => req.id);
  } else {
    selectedRequestIds.value = [];
  }
};

const onRequestSelect = () => {
  selectAllRequests.value =
    selectedRequestIds.value.length === storeRequests.value.length;
};

/* ================================================================
   CONFIRMATION & PROCESS
   ================================================================ */
const openConfirmation = () => {
  if (
    selectedRequestIds.value.length === 0 ||
    (isAdmin.value && !selectedGroupId.value) ||
    processing.value ||
    !isAllDocsValid.value
  ) {
    return;
  }
  showConfirmation.value = true;
};

const closeConfirmation = () => {
  showConfirmation.value = false;
};

const processRequests = async () => {
  if (!isAllDocsValid.value) return;
  if (
    !selectedStoreId.value ||
    selectedRequestIds.value.length === 0 ||
    (isAdmin.value && !selectedGroupId.value)
  ) {
    return;
  }

  processing.value = true;

  try {
    // ✅ Now flat map keyed by "reqId::itemId"
    const documentRefs = getDocumentReferences();

    const payload = {
      storeId: Number(selectedStoreId.value),
      groupId: isAdmin.value
        ? Number(selectedGroupId.value)
        : userData.value?.assignedGroup?.id,
      requestIds: selectedRequestIds.value.map((id) => Number(id)),
      documentRefs,
      itemsToProcess: buildItemsToProcess.value,
    };

    console.log('📤 Processing payload:', payload);

    const response = await balanceService.processRequests(payload);

    if (response.success) {
      router.push({
        name: 'store-balance',
        query: { processed: '1' },
      });
    }
  } catch (error) {
    console.error('Error processing requests:', error);
  } finally {
    processing.value = false;
    showConfirmation.value = false;
  }
};

/* ================================================================
   LIFECYCLE
   ================================================================ */
onMounted(async () => {
  userData.value = getUserData();

  await Promise.all([fetchStores(), fetchGroups(), fetchItems()]);

  if (!isAdmin.value && userData.value?.assignedStore) {
    selectedStoreId.value = String(userData.value.assignedStore.id);
    selectedGroupId.value = userData.value?.assignedGroup?.id
      ? String(userData.value.assignedGroup.id)
      : '';
    await onStoreSelect();
  }

  isLoadingPage.value = false;
});
</script>

<style scoped>
/* ================================================================
   PAGE LAYOUT
   ================================================================ */
.process-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: #f1f5f9;
  padding-bottom: 0;
}

/* ================================================================
   PAGE HEADER
   ================================================================ */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.header-icon {
  font-size: 28px;
}

.header-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 2px 0 0;
}

.btn-back {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #334155;
  transition: all 0.2s;
  white-space: nowrap;
  font-weight: 500;
}

.btn-back:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-back:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================================================================
   PAGE BODY
   ================================================================ */
.page-body {
  flex: 1;
  padding: 24px 32px;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ================================================================
   STEP CONTAINERS
   ================================================================ */
.step-container {
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.step-container:hover {
  border-color: #cbd5e1;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #6a11cb;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.step-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.step-content {
  padding-left: 40px;
}

/* ================================================================
   FORM
   ================================================================ */
.form-select-enhanced {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.form-select-enhanced:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}

.form-select-enhanced.has-value {
  border-color: #6a11cb;
  background-color: #faf5ff;
}

.form-hint {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}

/* ================================================================
   EMPTY STATE
   ================================================================ */
.empty-requests {
  text-align: center;
  padding: 30px 20px;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 10px;
}

.empty-requests p {
  font-size: 15px;
  color: #1e293b;
  margin: 0;
  font-weight: 500;
}

.empty-sub {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
  display: block;
}

/* ================================================================
   SELECT ALL
   ================================================================ */
.select-all-container {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #f1f5f9;
  border-radius: 8px;
}

.select-all-container:hover {
  background: #e2e8f0;
}

.select-all-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  width: 100%;
}

.select-all-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #6a11cb;
  cursor: pointer;
  flex-shrink: 0;
}

.select-all-text {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.select-all-badge {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  background: white;
  padding: 2px 12px;
  border-radius: 12px;
  margin-left: auto;
  white-space: nowrap;
}

/* ================================================================
   REQUEST LIST
   ================================================================ */
.requests-checkbox-list {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
}

.requests-checkbox-list::-webkit-scrollbar {
  width: 6px;
}
.requests-checkbox-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}
.requests-checkbox-list::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
}

.request-item {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.request-item:last-child {
  border-bottom: none;
}

.request-item.selected {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
}

.request-item.expanded {
  background: #faf5ff;
  border-left: 3px solid #8b5cf6;
}

.request-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  transition: background 0.15s;
}

.request-row:hover {
  background: rgba(248, 250, 252, 0.7);
}

.request-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  padding: 0;
}

.request-checkbox input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #6a11cb;
  cursor: pointer;
  margin-top: 2px;
  flex-shrink: 0;
}

.request-info {
  flex: 1;
  min-width: 0;
}

.request-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.req-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

.req-date {
  font-size: 12px;
  color: #94a3b8;
}

.req-details {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.req-items-count {
  font-size: 12px;
  color: #64748b;
}

.req-action {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}

.req-action.action-add {
  color: #22c55e;
  background: #dcfce7;
}

.req-action.action-remove {
  color: #ef4444;
  background: #fee2e2;
}

.req-partial-badge {
  font-size: 10px;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 2px 10px;
  border-radius: 12px;
}

.req-remark {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
  padding: 4px 10px;
  background: #fef3c7;
  border-radius: 6px;
  display: inline-block;
  max-width: 100%;
}

/* ================================================================
   PARTIAL BUTTON
   ================================================================ */
.btn-partial {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1.5px solid #cbd5e1;
  background: white;
  color: #475569;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  align-self: center;
}

.btn-partial:hover {
  border-color: #8b5cf6;
  color: #7c3aed;
  background: #faf5ff;
}

.btn-partial.has-custom {
  border-color: #8b5cf6;
  color: #7c3aed;
  background: #f3e8ff;
}

.partial-icon {
  font-size: 14px;
}

.partial-label {
  font-size: 11px;
}

/* ================================================================
   PARTIAL PANEL
   ================================================================ */
.partial-panel {
  background: white;
  border-top: 1px dashed #cbd5e1;
  padding: 14px 16px 12px;
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

.partial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.partial-title {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

.partial-title strong {
  font-family: 'Courier New', monospace;
  color: #2563eb;
}

.partial-hint {
  font-size: 11px;
  color: #94a3b8;
  margin: 0 0 12px;
  line-height: 1.4;
}

.mini-btn {
  padding: 4px 10px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.mini-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.partial-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  color: #64748b;
  font-size: 12px;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #e2e8f0;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.partial-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.partial-item {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.15s;
  cursor: pointer;
}

.partial-item:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.partial-item.is-selected {
  background: #faf5ff;
  border-color: #c4b5fd;
}

.partial-item.is-selected:hover {
  background: #f3e8ff;
}

.partial-item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.partial-item.is-partial {
  border-left: 3px solid #f59e0b;
}

.partial-item.is-completed {
  border-left: 3px solid #22c55e;
  background: #f0fdf4;
  cursor: default;
}

.partial-item.is-completed .partial-item-qty {
  opacity: 0.5;
  pointer-events: none;
}

.partial-item.is-completed .partial-item-check input[type='checkbox'] {
  cursor: not-allowed;
}

.partial-item-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.partial-item-check input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #6a11cb;
  cursor: pointer;
  pointer-events: none;
}

.partial-item-info {
  min-width: 0;
}

.partial-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.partial-item-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 11px;
  color: #64748b;
}

.partial-item-meta strong {
  color: #1e293b;
  font-weight: 600;
}

.meta-processed {
  color: #16a34a;
}

.meta-remaining strong {
  color: #f59e0b;
}

.meta-remaining--zero strong {
  color: #16a34a;
}

.item-done-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 1px 8px;
  border-radius: 10px;
  margin-left: 8px;
  vertical-align: middle;
}

.partial-item-qty {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px 8px;
  transition: all 0.15s;
  cursor: text;
}

.partial-item-qty:focus-within {
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.1);
}

.qty-input {
  width: 70px;
  padding: 3px 6px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  text-align: right;
  background: transparent;
  cursor: text;
}

.qty-input:focus {
  outline: none;
}

.qty-input:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.qty-uom {
  font-size: 11px;
  font-weight: 700;
  color: #6a11cb;
  min-width: 28px;
}

.partial-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.partial-summary {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.btn-save-partial {
  padding: 6px 14px;
  border: none;
  background: #8b5cf6;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-save-partial:hover {
  background: #7c3aed;
}

/* ================================================================
   SELECTION SUMMARY
   ================================================================ */
.selection-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  margin-top: 12px;
  flex-wrap: wrap;
}

.summary-icon {
  font-size: 18px;
}

.summary-text {
  font-size: 13px;
  font-weight: 600;
  color: #166534;
}

.summary-customized {
  font-size: 11px;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 2px 10px;
  border-radius: 12px;
}

.summary-items {
  font-size: 12px;
  color: #64748b;
  margin-left: auto;
  background: white;
  padding: 2px 12px;
  border-radius: 12px;
}

/* ================================================================
   PREVIEW
   ================================================================ */
.preview-container {
  margin-top: 4px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.preview-icon {
  font-size: 18px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.preview-badge {
  font-size: 11px;
  font-weight: 500;
  color: white;
  background: #6a11cb;
  padding: 2px 12px;
  border-radius: 12px;
  margin-left: auto;
}

.preview-requests {
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-request {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
}

.preview-request.has-error {
  border-color: #fecaca;
  background: #fef2f2;
}

.preview-request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-request-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

.preview-action {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 12px;
  border-radius: 12px;
}

.preview-action.action-add {
  background: #dcfce7;
  color: #166534;
}

.preview-action.action-remove {
  background: #fee2e2;
  color: #991b1b;
}

.custom-badge {
  font-size: 10px;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 1px 8px;
  border-radius: 10px;
}

/* ================================================================
   PER-ITEM DOC ROWS
   ================================================================ */
.preview-request-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px dashed #f1f5f9;
  flex-wrap: wrap;
}

.preview-item-row:last-child {
  border-bottom: none;
}

.preview-item-row--skipped {
  opacity: 0.55;
}

.preview-item-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 220px;
  flex: 0 0 auto;
}

.preview-item-name {
  font-size: 12px;
  font-weight: 500;
  color: #1e293b;
}

.preview-item-qty {
  font-weight: 600;
  color: #64748b;
  font-size: 12px;
}

.preview-qty--skipped {
  color: #94a3b8;
  font-style: italic;
  text-decoration: line-through;
}

.preview-remark {
  font-size: 12px;
  color: #64748b;
  margin-top: 6px;
  padding: 4px 10px;
  background: #fef3c7;
  border-radius: 6px;
}

/* ================================================================
   DOC INPUT (shared + per-item variant)
   ================================================================ */
.doc-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  flex-wrap: wrap;
}

.doc-input-wrapper:focus-within {
  border-color: #6a11cb;
  background: white;
  box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1);
}

.doc-input-wrapper.action-add {
  border-left: 3px solid #22c55e;
}

.doc-input-wrapper.action-remove {
  border-left: 3px solid #ef4444;
}

.doc-input-wrapper.has-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.doc-input-wrapper--item {
  flex: 1;
  min-width: 320px;
}

.doc-input-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.doc-input-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  min-width: 65px;
  flex-shrink: 0;
}

.doc-input-field {
  flex: 1;
  min-width: 120px;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  transition: all 0.2s;
}

.doc-input-field:focus {
  outline: none;
  border-color: #6a11cb;
  box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.1);
}

.doc-input-field.has-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.doc-error-msg {
  font-size: 11px;
  color: #ef4444;
  font-weight: 500;
}

.doc-valid-icon {
  font-size: 14px;
}

.doc-error-badge {
  font-size: 10px;
  font-weight: 600;
  color: #ef4444;
  background: #fee2e2;
  padding: 1px 10px;
  border-radius: 12px;
}

.doc-valid-badge {
  font-size: 12px;
}

.doc-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-top: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.doc-summary-icon {
  font-size: 16px;
}

.doc-summary-text {
  font-size: 13px;
  color: #475569;
}

.doc-summary-warning {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
  margin-left: auto;
  padding: 2px 10px;
  background: #fef3c7;
  border-radius: 12px;
}

.doc-summary-success {
  font-size: 12px;
  color: #16a34a;
  font-weight: 500;
  margin-left: auto;
  padding: 2px 10px;
  background: #dcfce7;
  border-radius: 12px;
}

/* ================================================================
   STICKY FOOTER
   ================================================================ */
.page-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 32px;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
  z-index: 10;
  flex-wrap: wrap;
  margin-top: auto;
}

.footer-left {
  flex: 1;
}

.footer-hint {
  font-size: 13px;
  color: #64748b;
}

.footer-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ================================================================
   BUTTONS
   ================================================================ */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
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
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 9px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================================================
   CONFIRMATION MODAL
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
  max-width: 750px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.confirmation-modal {
  max-width: 520px;
}

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
  font-size: 28px;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.modal-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.modal-body {
  padding: 16px 18px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
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

.confirmation-icon {
  font-size: 48px;
  text-align: center;
  display: block;
  margin-bottom: 8px;
}

.confirmation-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
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
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.highlight {
  background: #fef3c7;
  margin: 0 -16px;
  padding: 6px 16px;
  border-radius: 4px;
  border-bottom: none;
}

.detail-row.highlight-blue {
  background: #eff6ff;
  margin: 0 -16px;
  padding: 6px 16px;
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

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-bottom: 16px;
}

.warning-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.warning-text {
  font-size: 13px;
  color: #991b1b;
  line-height: 1.5;
}

.requests-confirmation-list {
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.confirmation-request {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 13px;
}

.confirmation-req-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

.confirmation-req-items {
  color: #64748b;
  font-size: 12px;
}

.confirmation-req-custom {
  font-size: 12px;
}

.confirmation-req-action {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 10px;
  border-radius: 10px;
  margin-left: auto;
}

.confirmation-req-action.action-add {
  background: #dcfce7;
  color: #166534;
}

.confirmation-req-action.action-remove {
  background: #fee2e2;
  color: #991b1b;
}

.confirmation-more {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  padding: 4px;
  font-style: italic;
}

.confirm-btn {
  background: #dc2626 !important;
}

.confirm-btn:hover:not(:disabled) {
  background: #b91c1c !important;
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
  .page-header {
    padding: 16px;
  }

  .page-body {
    padding: 16px;
  }

  .step-content {
    padding-left: 0;
  }

  .step-indicator {
    flex-wrap: wrap;
  }

  .step-line {
    display: none;
  }

  .request-row {
    padding: 10px 12px;
    flex-wrap: wrap;
  }

  .btn-partial {
    margin-left: auto;
    margin-top: 4px;
  }

  .partial-label {
    display: none;
  }

  .partial-item {
    grid-template-columns: 22px 1fr;
    gap: 8px;
  }

  .partial-item-qty {
    grid-column: 2;
    justify-self: start;
  }

  .preview-item-info {
    min-width: 100%;
  }

  .doc-input-wrapper--item {
    min-width: 100%;
  }

  .doc-input-field {
    min-width: 100px;
    flex: 1 1 100%;
  }

  .doc-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .doc-summary-warning,
  .doc-summary-success {
    margin-left: 0;
  }

  .page-footer {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
  }

  .footer-left {
    display: none;
  }

  .footer-right {
    width: 100%;
  }

  .footer-right button {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .confirmation-request {
    flex-wrap: wrap;
  }
  .confirmation-req-action {
    margin-left: 0;
  }
  .detail-row {
    flex-direction: column;
    gap: 2px;
  }
  .preview-item {
    font-size: 11px;
    padding: 1px 8px;
  }
  .select-all-container {
    padding: 8px 12px;
  }
  .select-all-label {
    flex-wrap: wrap;
  }
  .select-all-badge {
    margin-left: 0;
  }
}
</style>