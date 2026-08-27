<template>
  <!-- =========================================================
       PROCESS REQUESTS MODAL
  ========================================================== -->
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-container process-modal">
      <div class="modal-header">
        <div class="modal-header-content">
          <span class="modal-icon">📋</span>
          <div>
            <h3>Process Approved Requests</h3>
            <p class="modal-subtitle">Apply approved requests to store balances</p>
          </div>
        </div>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <div class="modal-body">
        <!-- ============================================================ -->
        <!-- STEP 1: SELECT STORE (Admin only) -->
        <!-- ============================================================ -->
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
                <option
                  v-for="store in stores"
                  :key="store.id"
                  :value="store.id"
                >
                  🏪 {{ store.name }}
                </option>
              </select>
              <span class="form-hint">Select the store to process requests for</span>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- STEP 2: SELECT REQUESTS -->
        <!-- ============================================================ -->
        <div class="step-container">
          <div class="step-indicator">
            <span class="step-number">{{ isAdmin ? '2' : '1' }}</span>
            <span class="step-label">Select Requests</span>
            <span class="step-line"></span>
          </div>
          <div class="step-content">
            <div v-if="storeRequests.length === 0" class="empty-requests">
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
                <label
                  v-for="req in storeRequests"
                  :key="req.id"
                  class="request-checkbox"
                  :class="{ selected: selectedRequestIds.includes(req.id) }"
                >
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
                      <span
                        v-if="req.isProcessedByGroup"
                        class="req-status processed"
                      >
                        ✅ Processed
                      </span>
                      <span v-else class="req-status pending"> ⏳ Pending </span>
                    </div>
                    <div v-if="req.remark" class="req-remark">
                      💬 {{ req.remark }}
                    </div>
                  </div>
                </label>
              </div>

              <!-- Selection Summary -->
              <div v-if="selectedRequestIds.length > 0" class="selection-summary">
                <span class="summary-icon">📋</span>
                <span class="summary-text">
                  {{ selectedRequestIds.length }} request(s) selected
                </span>
                <span class="summary-items">
                  {{ getSelectedTotalItems() }} total items
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- STEP 3: SELECT GROUP (Admin only) -->
        <!-- ============================================================ -->
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
                <option
                  v-for="group in groups"
                  :key="group.id"
                  :value="group.id"
                >
                  👥 {{ group.name }}
                </option>
              </select>
              <span class="form-hint">Select the group that will receive/remove stock</span>
            </div>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- STEP 4: DOCUMENT REFERENCES & PREVIEW -->
        <!-- ============================================================ -->
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
            <!-- Preview with Per-Request Inputs -->
            <div class="preview-container">
              <div class="preview-header">
                <span class="preview-icon">📊</span>
                <span class="preview-title">Request Preview</span>
                <span class="preview-badge">{{ selectedRequestIds.length }} request(s)</span>
              </div>

              <div class="preview-requests">
                <div
                  v-for="req in selectedRequests"
                  :key="req.id"
                  class="preview-request"
                  :class="{ 'has-error': requestDocsErrors[req.id] }"
                >
                  <div class="preview-request-header">
                    <span class="preview-request-code">{{ req.requestCode }}</span>
                    <span class="preview-action" :class="getItemActionClass(req)">
                      {{ getItemActionLabel(req) }}
                    </span>
                    <span v-if="requestDocsErrors[req.id]" class="doc-error-badge">
                      ⚠️ Required
                    </span>
                    <span v-else-if="requestDocs[req.id] && requestDocs[req.id].trim()" class="doc-valid-badge">
                      ✅
                    </span>
                  </div>

                  <!-- Request Items -->
                  <div class="preview-request-items">
                    <span
                      v-for="item in req.items"
                      :key="item.itemId"
                      class="preview-item"
                    >
                      {{ getItemCommonName(item.itemId) }}
                      <span class="preview-qty">×{{ item.quantity }}</span>
                    </span>
                  </div>

                  <!-- ✅ PER-REQUEST INPUT - GRN for ADD / SIV for REMOVE -->
                  <div class="preview-request-doc">
                    <div class="doc-input-wrapper" :class="[getItemActionClass(req), { 'has-error': requestDocsErrors[req.id] }]">
                      <span class="doc-input-icon">
                        {{ getItemActionLabel(req).includes('ADD') ? '📥' : '📤' }}
                      </span>
                      <span class="doc-input-label">
                        {{ getItemActionLabel(req).includes('ADD') ? 'GRN No.' : 'S.I.V No.' }}
                      </span>
                      <input
                        v-model="requestDocs[req.id]"
                        type="text"
                        class="doc-input-field"
                        :class="{ 'has-error': requestDocsErrors[req.id] }"
                        :placeholder="getItemActionLabel(req).includes('ADD') ? 'Enter GRN Number...' : 'Enter S.I.V Number...'"
                        :disabled="processing"
                        @input="validateDoc(req.id)"
                        @blur="validateDoc(req.id)"
                      />
                      <span v-if="requestDocsErrors[req.id]" class="doc-error-msg">Required</span>
                      <span v-else-if="requestDocs[req.id] && requestDocs[req.id].trim()" class="doc-valid-icon">✅</span>
                    </div>
                  </div>

                  <div v-if="req.remark" class="preview-remark">
                    💬 {{ req.remark }}
                  </div>
                </div>
              </div>

              <!-- Document References Summary -->
              <div v-if="selectedRequestIds.length > 0" class="doc-summary">
                <span class="doc-summary-icon">📋</span>
                <span class="doc-summary-text">
                  {{ getFilledDocCount() }} of {{ selectedRequestIds.length }} requests have document references
                </span>
                <span v-if="!isAllDocsValid" class="doc-summary-warning">
                  ⚠️ Please fill all required fields
                </span>
                <span v-else class="doc-summary-success">
                  ✅ All document references provided
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- FOOTER -->
      <!-- ============================================================ -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
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
          {{ processing ? "Processing..." : `Process ${selectedRequestIds.length} Request(s)` }}
        </button>
      </div>
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
            <h3>Confirm Processing</h3>
            <p class="modal-subtitle">Please review before proceeding</p>
          </div>
        </div>
        <button class="modal-close" @click="closeConfirmation">✕</button>
      </div>

      <div class="modal-body">
        <div class="confirmation-icon">🔄</div>
        <p class="confirmation-title">Are you sure you want to process these requests?</p>

        <div class="confirmation-details">
          <div class="detail-row">
            <span class="detail-label">Requests</span>
            <span class="detail-value">{{ selectedRequestIds.length }} request(s)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total Items</span>
            <span class="detail-value">{{ getSelectedTotalItems() }} items</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Store</span>
            <span class="detail-value">{{ isAdmin ? getStoreName(Number(selectedStoreId)) : 'Your Store' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Group</span>
            <span class="detail-value">{{ isAdmin ? getGroupName(Number(selectedGroupId)) : 'Your Group' }}</span>
          </div>
          <div class="detail-row highlight">
            <span class="detail-label">⚠️ Action</span>
            <span class="detail-value">
              {{ getItemsByAction('add') > 0 ? `➕ Add ${getItemsByAction('add')} items` : '' }}
              {{ getItemsByAction('add') > 0 && getItemsByAction('remove') > 0 ? ' & ' : '' }}
              {{ getItemsByAction('remove') > 0 ? `➖ Remove ${getItemsByAction('remove')} items` : '' }}
            </span>
          </div>
          <!-- Show document references in confirmation -->
          <div v-for="(doc, reqId) in getDocumentReferences()" :key="reqId" class="detail-row">
            <span class="detail-label">📄 {{ getRequestCode(Number(reqId)) }}</span>
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
            <span class="confirmation-req-items">{{ req.items.length }} items</span>
            <span class="confirmation-req-action" :class="getItemActionClass(req)">
              {{ getItemActionLabel(req) }}
            </span>
          </div>
          <div v-if="selectedRequests.length > 5" class="confirmation-more">
            ... and {{ selectedRequests.length - 5 }} more requests
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeConfirmation">
          Cancel
        </button>
        <button
          class="btn-primary confirm-btn"
          @click="processRequests"
          :disabled="processing"
        >
          {{ processing ? "Processing..." : "✅ Confirm & Process" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import balanceService from '@/stores/balanceService';

// ================================================================
// PROPS
// ================================================================

const props = defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
  stores: {
    type: Array,
    default: () => [],
  },
  groups: {
    type: Array,
    default: () => [],
  },
  userData: {
    type: Object,
    default: () => ({}),
  },
  // Item data from parent for name lookups
  inventoryItems: {
    type: Array,
    default: () => [],
  },
});

// ================================================================
// EMITS
// ================================================================

const emit = defineEmits(['close', 'success']);

// ================================================================
// STATE
// ================================================================

const selectedStoreId = ref("");
const selectedGroupId = ref("");
const selectedRequestIds = ref([]);
const storeRequests = ref([]);
const processing = ref(false);
const selectAllRequests = ref(false);
const showConfirmation = ref(false);

// Document References - PER REQUEST
const requestDocs = ref({});
const requestDocsErrors = ref({});

// ================================================================
// COMPUTED
// ================================================================

const selectedRequests = computed(() => {
  return storeRequests.value.filter((req) =>
    selectedRequestIds.value.includes(req.id)
  );
});

const isAllDocsValid = computed(() => {
  const selectedIds = selectedRequestIds.value;
  if (selectedIds.length === 0) return false;

  for (const id of selectedIds) {
    const req = selectedRequests.value.find((r) => r.id === id);
    if (!req) continue;

    const actionLabel = getItemActionLabel(req);
    const docValue = requestDocs.value[id] || "";

    if (
      (actionLabel.includes("ADD") || actionLabel.includes("REMOVE")) &&
      !docValue.trim()
    ) {
      return false;
    }
  }
  return true;
});

// ================================================================
// WATCH
// ================================================================

watch(selectedRequestIds, (newIds) => {
  const currentIds = new Set(newIds);
  Object.keys(requestDocs.value).forEach((id) => {
    if (!currentIds.has(Number(id))) {
      delete requestDocs.value[id];
      delete requestDocsErrors.value[id];
    }
  });

  newIds.forEach((id) => {
    if (!requestDocs.value[id]) {
      requestDocs.value[id] = "";
    }
  });
}, { immediate: true });

// ================================================================
// METHODS
// ================================================================

const closeModal = () => {
  emit('close');
};

const getStoreName = (storeId) => {
  const store = props.stores.find((s) => s.id === storeId);
  return store ? store.name : "Unknown";
};

const getGroupName = (groupId) => {
  const group = props.groups.find((g) => g.id === groupId);
  return group ? group.name : "Unknown";
};

const getItemCommonName = (itemId) => {
  const item = props.inventoryItems.find((i) => i.id === itemId);
  return item ? item.name || item.standardName || `Item ${itemId}` : `Item ${itemId}`;
};

const getItemActionLabel = (req) => {
  if (selectedStoreId.value === String(req.askingStoreId)) {
    return "➕ ADD to balance";
  } else if (selectedStoreId.value === String(req.supplyingStoreId)) {
    return "➖ REMOVE from balance";
  }
  return "";
};

const getItemActionClass = (req) => {
  if (selectedStoreId.value === String(req.askingStoreId)) {
    return "action-add";
  } else if (selectedStoreId.value === String(req.supplyingStoreId)) {
    return "action-remove";
  }
  return "";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
    total += req.items.length;
  });
  return total;
};

const getItemsByAction = (action) => {
  let count = 0;
  selectedRequests.value.forEach((req) => {
    const actionLabel = getItemActionLabel(req);
    if (action === "add" && actionLabel.includes("ADD")) {
      count += req.items.length;
    } else if (action === "remove" && actionLabel.includes("REMOVE")) {
      count += req.items.length;
    }
  });
  return count;
};

const getFilledDocCount = () => {
  let count = 0;
  selectedRequestIds.value.forEach((id) => {
    if (requestDocs.value[id] && requestDocs.value[id].trim()) {
      count++;
    }
  });
  return count;
};

const getDocumentReferences = () => {
  const docs = {};
  selectedRequestIds.value.forEach((id) => {
    if (requestDocs.value[id] && requestDocs.value[id].trim()) {
      docs[id] = requestDocs.value[id].trim();
    }
  });
  return docs;
};

const getRequestCode = (reqId) => {
  const req = selectedRequests.value.find((r) => r.id === reqId);
  return req ? req.requestCode : reqId;
};

const validateDoc = (reqId) => {
  const req = selectedRequests.value.find((r) => r.id === reqId);
  if (!req) return;

  const actionLabel = getItemActionLabel(req);
  const docValue = requestDocs.value[reqId] || "";

  if (actionLabel.includes("ADD") || actionLabel.includes("REMOVE")) {
    if (!docValue.trim()) {
      requestDocsErrors.value[reqId] = true;
    } else {
      requestDocsErrors.value[reqId] = false;
    }
  }
};

const onStoreSelect = async () => {
  selectedRequestIds.value = [];
  storeRequests.value = [];
  selectAllRequests.value = false;
  selectedGroupId.value = "";
  requestDocs.value = {};
  requestDocsErrors.value = {};

  if (!selectedStoreId.value) return;

  try {
    const storeId = Number(selectedStoreId.value);
    const groupId = props.userData?.assignedGroup?.id;
    const response = await balanceService.getApprovedRequests(storeId, groupId);
    storeRequests.value = response.data || [];

    if (storeRequests.value.length > 0) {
      selectAllRequests.value = true;
      selectedRequestIds.value = storeRequests.value.map((req) => req.id);
    }
  } catch (error) {
    console.error("Error fetching approved requests:", error);
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
  if (selectedRequestIds.value.length === storeRequests.value.length) {
    selectAllRequests.value = true;
  } else {
    selectAllRequests.value = false;
  }
};

const openConfirmation = () => {
  if (
    selectedRequestIds.value.length === 0 ||
    (props.isAdmin && !selectedGroupId.value) ||
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
  if (!isAllDocsValid.value) {
    const missing = selectedRequestIds.value.filter((id) => {
      const req = selectedRequests.value.find((r) => r.id === id);
      if (!req) return false;
      const actionLabel = getItemActionLabel(req);
      const docValue = requestDocs.value[id] || "";
      if (
        (actionLabel.includes("ADD") || actionLabel.includes("REMOVE")) &&
        !docValue.trim()
      ) {
        return true;
      }
      return false;
    });

    const reqCodes = missing
      .map((id) => {
        const req = selectedRequests.value.find((r) => r.id === id);
        return req ? req.requestCode : id;
      })
      .join(", ");

    return;
  }

  if (
    !selectedStoreId.value ||
    selectedRequestIds.value.length === 0 ||
    (props.isAdmin && !selectedGroupId.value)
  ) {
    return;
  }

  processing.value = true;

  try {
    const documentRefs = getDocumentReferences();

    const payload = {
      storeId: Number(selectedStoreId.value),
      groupId: props.isAdmin ? Number(selectedGroupId.value) : props.userData?.assignedGroup?.id,
      requestIds: selectedRequestIds.value.map((id) => Number(id)),
      documentRefs: documentRefs,
    };

    const response = await balanceService.processRequests(payload);

    if (response.success) {
      const { processedRequestIds = [] } = response.data || {};

      storeRequests.value = storeRequests.value.filter(
        (req) => !processedRequestIds.includes(req.id)
      );

      selectedRequestIds.value = storeRequests.value.map((req) => req.id);

      processedRequestIds.forEach((id) => {
        delete requestDocs.value[id];
        delete requestDocsErrors.value[id];
      });

      emit('success', response.data);

      if (storeRequests.value.length === 0) {
        setTimeout(() => {
          closeModal();
        }, 1000);
      }
    }
  } catch (error) {
    console.error("Error processing requests:", error);
  } finally {
    processing.value = false;
    showConfirmation.value = false;
  }
};

// ================================================================
// LIFECYCLE
// ================================================================

onMounted(async () => {
  // Auto-select store for non-admin users
  if (!props.isAdmin && props.userData?.assignedStore) {
    selectedStoreId.value = String(props.userData.assignedStore.id);
    await onStoreSelect();

    if (props.userData?.assignedGroup) {
      selectedGroupId.value = String(props.userData.assignedGroup.id);
    }
  }
});
</script>

<style scoped>
/* ================================================================
   PROCESS MODAL STYLES
   ================================================================ */

.process-modal .modal-container {
  max-width: 750px;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 28px;
}

.modal-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.step-container {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
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
  margin-bottom: 12px;
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

.empty-requests {
  text-align: center;
  padding: 30px 20px;
}

.empty-requests .empty-icon {
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

.select-all-label input[type="checkbox"] {
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

.requests-checkbox-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px;
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

.requests-checkbox-list::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.request-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.request-checkbox:last-child {
  border-bottom: none;
}

.request-checkbox:hover {
  background: #f8fafc;
}

.request-checkbox.selected {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
}

.request-checkbox input[type="checkbox"] {
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
  font-family: "Courier New", monospace;
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

.req-status {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}

.req-status.processed {
  color: #16a34a;
  background: #dcfce7;
}

.req-status.pending {
  color: #f59e0b;
  background: #fef3c7;
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

.selection-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
  margin-top: 12px;
}

.summary-icon {
  font-size: 18px;
}

.summary-text {
  font-size: 13px;
  font-weight: 600;
  color: #166534;
}

.summary-items {
  font-size: 12px;
  color: #64748b;
  margin-left: auto;
  background: white;
  padding: 2px 12px;
  border-radius: 12px;
}

.preview-container {
  margin-top: 16px;
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
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-requests::-webkit-scrollbar {
  width: 6px;
}

.preview-requests::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.preview-requests::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
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

.preview-request:hover {
  border-color: #cbd5e1;
}

.preview-request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-request-code {
  font-weight: 600;
  color: #2563eb;
  font-size: 13px;
  font-family: "Courier New", monospace;
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

.preview-request-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.preview-item {
  font-size: 12px;
  color: #1e293b;
  background: white;
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.preview-qty {
  font-weight: 600;
  color: #64748b;
  margin-left: 2px;
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
   PER-REQUEST DOCUMENT REFERENCE STYLES
   ================================================================ */

.preview-request-doc {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
}

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

.doc-input-wrapper.has-error:focus-within {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.doc-input-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.doc-input-label {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  flex-shrink: 0;
  min-width: 65px;
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

.doc-input-field:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}

.doc-input-field.has-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.doc-input-field::placeholder {
  color: #94a3b8;
  font-size: 11px;
}

.doc-error-msg {
  font-size: 11px;
  color: #ef4444;
  font-weight: 500;
  flex-shrink: 0;
}

.doc-valid-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.doc-error-badge {
  font-size: 10px;
  font-weight: 600;
  color: #ef4444;
  background: #fee2e2;
  padding: 1px 10px;
  border-radius: 12px;
  margin-left: auto;
}

.doc-valid-badge {
  font-size: 12px;
  margin-left: auto;
}

/* Document Summary */
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
   CONFIRMATION MODAL
   ================================================================ */

.confirmation-modal .modal-container {
  max-width: 520px;
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

.requests-confirmation-list::-webkit-scrollbar {
  width: 4px;
}

.requests-confirmation-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.requests-confirmation-list::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 2px;
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
  font-family: "Courier New", monospace;
}

.confirmation-req-items {
  color: #64748b;
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
  max-width: 750px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
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
    max-width: 98%;
    margin: 10px;
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

  .confirmation-modal .modal-container {
    max-width: 98%;
  }

  .preview-request-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .request-checkbox {
    padding: 8px 10px;
  }

  .request-header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .selection-summary {
    flex-wrap: wrap;
  }

  .summary-items {
    margin-left: 0;
  }

  .doc-input-wrapper {
    flex-wrap: wrap;
    gap: 4px;
  }

  .doc-input-field {
    min-width: 100px;
    flex: 1 1 100%;
  }

  .doc-input-label {
    min-width: 60px;
    font-size: 10px;
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

  .doc-error-badge,
  .doc-valid-badge {
    margin-left: 0;
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

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer button {
    width: 100%;
    justify-content: center;
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