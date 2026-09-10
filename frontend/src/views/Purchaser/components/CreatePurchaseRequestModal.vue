<!-- components/modals/CreatePurchaseRequestModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container purchase-modal">
      <!-- ==================== HEADER ==================== -->
      <div class="modal-header">
        <h3>
          {{ editingRequest ? "✏️ Edit Purchase Request" : "➕ New Purchase Request" }}
        </h3>
        <button class="modal-close" @click="closeModal">✕</button>
      </div>

      <!-- ==================== BODY ==================== -->
      <div class="modal-body">
        <form @submit.prevent="saveRequest" class="request-form">
          <!-- ============================================================ -->
          <!-- REQUEST INFORMATION -->
          <!-- ============================================================ -->
          <div class="form-section">
            <div class="form-section-title">📋 Request Information</div>

            <div class="form-row">
              <div class="form-group">
                <label>Department *</label>
                <select v-model="form.department" required class="form-select">
                  <option value="">Select Department</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Production">Production</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div class="form-group">
                <label>Expert Name *</label>
                <input
                  v-model="form.expertName"
                  type="text"
                  required
                  class="form-input"
                  placeholder="Enter expert name..."
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Prepared By *</label>
                <input
                  v-model="form.preparedBy"
                  type="text"
                  required
                  class="form-input"
                  placeholder="Enter preparer name..."
                />
              </div>
              <div class="form-group">
                <label>Requested Date *</label>
                <input v-model="form.requestedDate" type="date" required class="form-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Priority</label>
                <select v-model="form.priority" class="form-select">
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status" class="form-select">
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Approval</option>
                </select>
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

            <!-- Add Item -->
            <div class="add-item-area">
              <div class="add-wrapper">
                <select
                  v-model="selectedItemId"
                  class="item-select"
                >
                  <option value="">Select an item to add...</option>
                  <option
                    v-for="item in availableItems"
                    :key="item.id"
                    :value="item.id"
                    :disabled="isItemAlreadySelected(item.id)"
                  >
                    {{ item.code }} - {{ item.name }}
                    [{{ item.baseUom }}]
                    {{ isItemAlreadySelected(item.id) ? '(added)' : '' }}
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

            <!-- ============================================================ -->
            <!-- SELECTED ITEMS - COLLAPSIBLE FORMAT -->
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
                  :key="item.id"
                  class="selected-item-wrapper"
                >
                  <!-- ========================================================== -->
                  <!-- COMPACT VIEW - Always visible -->
                  <!-- ========================================================== -->
                  <div class="selected-item-compact">
                    <!-- Left: Expand icon + Item info -->
                    <div
                      class="compact-left"
                      @click="toggleItemExpand(item.id)"
                    >
                      <span class="expand-icon">
                        {{ expandedItems.has(item.id) ? '▼' : '▶' }}
                      </span>
                      <span class="item-code">{{ item.code }}</span>
                      <span class="item-name">{{ item.name }}</span>
                    </div>

                    <!-- Right: UOM Select + QTY (always visible) -->
                    <div class="compact-right">
                      <!-- ✅ UOM Dropdown - Only base & conversion UOM -->
                      <select
                        v-model="item.uom"
                        @change.stop="syncSelectedItemsToForm"
                        class="compact-uom-select"
                        title="Select UOM"
                      >
                        <option :value="item.baseUom">{{ item.baseUom }}</option>
                        <option
                          v-if="item.conversionUom && item.conversionUom !== item.baseUom"
                          :value="item.conversionUom"
                        >
                          {{ item.conversionUom }}
                        </option>
                      </select>

                      <!-- QTY -->
                      <div class="compact-qty-group">
                        <button
                          type="button"
                          class="compact-qty-btn"
                          @click.stop="adjustQuantity(item.id, -0.01)"
                          :disabled="item.quantity <= 0.01"
                        >
                          −
                        </button>
                        <input
                          type="text"
                          :value="item.quantity"
                          @input="updateQuantityWithResize(item.id, $event)"
                          class="compact-qty-input"
                          inputmode="decimal"
                        />
                        <button
                          type="button"
                          class="compact-qty-btn"
                          @click.stop="adjustQuantity(item.id, 0.01)"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        class="remove-btn-compact"
                        @click.stop="removeSelectedItem(item.id)"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <!-- ========================================================== -->
                  <!-- EXPANDED VIEW - Brand/Model row, Full-row Spec, Full-row Remark -->
                  <!-- ========================================================== -->
                  <div
                    v-show="expandedItems.has(item.id)"
                    class="selected-item-expanded"
                  >
                    <!-- Row 1: Brand + Model (2 columns) -->
                    <div class="expanded-row-two">
                      <div class="spec-field">
                        <label class="spec-label">BRAND</label>
                        <input
                          type="text"
                          :value="item.brand"
                          @input="updateItemField(item.id, 'brand', $event.target.value)"
                          placeholder="Enter brand..."
                          class="spec-input"
                        />
                      </div>
                      <div class="spec-field">
                        <label class="spec-label">MODEL</label>
                        <input
                          type="text"
                          :value="item.model"
                          @input="updateItemField(item.id, 'model', $event.target.value)"
                          placeholder="Enter model..."
                          class="spec-input"
                        />
                      </div>
                    </div>

                    <!-- Row 2: Specification (FULL WIDTH) -->
                    <div class="expanded-row-full">
                      <div class="spec-field full-width">
                        <label class="spec-label">SPECIFICATION</label>
                        <textarea
                          :value="item.specification"
                          @input="updateItemField(item.id, 'specification', $event.target.value)"
                          placeholder="Enter specification..."
                          class="spec-textarea"
                          rows="2"
                        ></textarea>
                      </div>
                    </div>

                    <!-- Row 3: Remark (FULL WIDTH) -->
                    <div class="expanded-row-full">
                      <div class="spec-field full-width">
                        <label class="spec-label">REMARK</label>
                        <input
                          type="text"
                          :value="item.remark"
                          @input="updateItemField(item.id, 'remark', $event.target.value)"
                          placeholder="Add remark..."
                          class="remark-input"
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
              <span class="empty-hint">Select items from the dropdown above</span>
            </div>
          </div>

          <!-- ============================================================ -->
          <!-- FORM ERRORS -->
          <!-- ============================================================ -->
          <div v-if="formErrors.length > 0" class="form-errors">
            <div v-for="error in formErrors" :key="error" class="form-error">
              ⚠️ {{ error }}
            </div>
          </div>
        </form>
      </div>

      <!-- ==================== FOOTER ==================== -->
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">Cancel</button>
        <button
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
import { ref, computed, watch, onMounted } from "vue";

// ================================================================
// TYPES
// ================================================================

interface PurchaseItem {
  id: number;
  name: string;
  code: string;
  brand?: string;
  model?: string;
  uom: string;
  baseUom: string;         // ✅ NEW: Base UOM (e.g., DRUM)
  conversionUom?: string;  // ✅ NEW: Conversion UOM (e.g., KG)
  quantity: number;
  specification?: string;
  remark?: string;
}

interface PurchaseRequest {
  id: number;
  prNumber: string;
  department?: string;
  expertName?: string;
  preparedBy?: string;
  requestedDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseItem[];
  createdAt: string;
  updatedAt?: string;
}

// ================================================================
// PROPS & EMITS
// ================================================================

const props = defineProps<{
  visible: boolean;
  editingRequest?: PurchaseRequest | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'saved'): void;
}>();

// ================================================================
// AVAILABLE ITEMS (Demo Data with base & conversion UOM)
// ================================================================

const availableItems = ref<PurchaseItem[]>([
  { id: 1, name: "Homopolymer Glue", code: "SDT000004", brand: "Sherwin-Williams", model: "SW-2000", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 0, specification: "", remark: "" },
  { id: 2, name: "Lacquer Thinner", code: "SDT000001", brand: "Sherwin-Williams", model: "SW-THIN", uom: "DRUM", baseUom: "DRUM", conversionUom: "LTR", quantity: 0, specification: "", remark: "" },
  { id: 3, name: "Short Oil Alkyd", code: "SDT000008", brand: "BASF", model: "BASF-ALK-1", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 0, specification: "", remark: "" },
  { id: 4, name: "Plasticizer (DBP)", code: "SDT000018", brand: "BASF", model: "BASF-DBP", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 0, specification: "", remark: "" },
  { id: 5, name: "Formaldehyde (F)", code: "SDT000013", brand: "BASF", model: "BASF-FORM", uom: "DRUM", baseUom: "DRUM", conversionUom: "KG", quantity: 0, specification: "", remark: "" },
  { id: 6, name: "Slitting Machine", code: "SDT000081", brand: "Global Machinery", model: "GM-SL-500", uom: "SET", baseUom: "SET", conversionUom: "", quantity: 0, specification: "", remark: "" },
  { id: 7, name: "Seam Welding Machine", code: "SDT000083", brand: "Global Machinery", model: "GM-SW-200", uom: "SET", baseUom: "SET", conversionUom: "", quantity: 0, specification: "", remark: "" },
  { id: 8, name: "Artificial Grass White 4m*25m", code: "SDT000064", brand: "", model: "", uom: "M2", baseUom: "M2", conversionUom: "MTR", quantity: 0, specification: "", remark: "" },
  { id: 9, name: "Elevator Machine Room MAX-E", code: "SDT000078", brand: "", model: "", uom: "SET", baseUom: "SET", conversionUom: "", quantity: 0, specification: "", remark: "" },
  { id: 10, name: "Home Vacuum Cleaner", code: "SDT001135", brand: "", model: "", uom: "PCS", baseUom: "PCS", conversionUom: "", quantity: 0, specification: "", remark: "" },
]);

// ================================================================
// STATE
// ================================================================

const saving = ref(false);
const selectedItemId = ref("");
const expandedItems = ref<Set<number>>(new Set());
const selectedItems = ref<Map<number, PurchaseItem>>(new Map());

const form = ref({
  department: "",
  expertName: "",
  preparedBy: "",
  requestedDate: "",
  priority: "medium" as 'low' | 'medium' | 'high' | 'urgent',
  status: "draft" as 'draft' | 'pending',
  items: [] as PurchaseItem[],
});

const formErrors = ref<string[]>([]);

// ================================================================
// COMPUTED
// ================================================================

const selectedItemsList = computed(() => {
  return Array.from(selectedItems.value.values());
});

const isFormValid = computed(() => {
  if (selectedItemsList.value.length === 0) return false;
  const allValid = selectedItemsList.value.every(item => item.quantity > 0);
  if (!allValid) return false;
  return !!form.value.requestedDate;
});

// ================================================================
// METHODS
// ================================================================

const isItemAlreadySelected = (id: number): boolean => {
  return selectedItems.value.has(id);
};

const isItemAlreadySelectedById = (id: string): boolean => {
  const numericId = Number(id);
  if (!numericId || numericId <= 0) return false;
  return selectedItems.value.has(numericId);
};

const toggleItemExpand = (id: number): void => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
  expandedItems.value = new Set(expandedItems.value);
};

const addSelectedItem = (): void => {
  if (!selectedItemId.value) return;

  const id = Number(selectedItemId.value);
  if (!id || id <= 0) return;
  if (selectedItems.value.has(id)) return;

  const item = availableItems.value.find(i => i.id === id);
  if (!item) return;

  selectedItems.value.set(id, {
    ...item,
    quantity: 1,
  });

  selectedItemId.value = "";
  syncSelectedItemsToForm();
};

const removeSelectedItem = (id: number): void => {
  selectedItems.value.delete(id);
  expandedItems.value.delete(id);
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

const updateItemField = (id: number, field: string, value: string): void => {
  const item = selectedItems.value.get(id);
  if (!item) return;

  const validFields = ['brand', 'model', 'specification', 'remark'];
  if (!validFields.includes(field)) return;

  selectedItems.value.set(id, {
    ...item,
    [field]: value,
  });
  syncSelectedItemsToForm();
};

const updateQuantity = (id: number, value: string): void => {
  const item = selectedItems.value.get(id);
  if (!item) return;

  let newQty = parseFloat(value);
  if (isNaN(newQty) || newQty < 0.01) newQty = 0.01;
  newQty = Math.round(newQty * 100) / 100;

  selectedItems.value.set(id, { ...item, quantity: newQty });
  syncSelectedItemsToForm();
};

const updateQuantityWithResize = (id: number, event: Event): void => {
  const input = event.target as HTMLInputElement;
  input.style.width = 'auto';
  input.style.width = Math.max(40, input.scrollWidth + 4) + 'px';

  updateQuantity(id, input.value);
};

const adjustQuantity = (id: number, delta: number): void => {
  const item = selectedItems.value.get(id);
  if (!item) return;

  let newQty = Math.round((item.quantity + delta) * 100) / 100;
  if (newQty < 0.01) newQty = 0.01;

  selectedItems.value.set(id, { ...item, quantity: newQty });
  syncSelectedItemsToForm();
};

const syncSelectedItemsToForm = (): void => {
  form.value.items = Array.from(selectedItems.value.values());
};

const getCurrentUser = (): string => {
  return "Current User";
};

// ================================================================
// SAVE REQUEST
// ================================================================

const saveRequest = async (): Promise<void> => {
  formErrors.value = [];

  syncSelectedItemsToForm();

  if (!form.value.requestedDate) {
    formErrors.value.push("Please select a requested date");
  }
  if (form.value.items.length === 0) {
    formErrors.value.push("Please add at least one item");
  }

  if (formErrors.value.length > 0) {
    return;
  }

  saving.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📤 Saving purchase request:', {
      ...form.value,
      prNumber: `PR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    });

    emit('saved');
    closeModal();
  } catch (error: any) {
    console.error("Save error:", error);
    formErrors.value.push(error.message || 'Failed to save request');
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

const initializeForm = (): void => {
  const today = new Date().toISOString().split("T")[0];

  selectedItems.value.clear();
  expandedItems.value.clear();

  if (props.editingRequest) {
    const req = props.editingRequest;

    req.items.forEach(item => {
      selectedItems.value.set(item.id, { ...item });
    });

    form.value = {
      department: req.department || "",
      expertName: req.expertName || "",
      preparedBy: req.preparedBy || "",
      requestedDate: req.requestedDate,
      priority: req.priority,
      status: req.status === 'pending' ? 'pending' : 'draft',
      items: [...req.items],
    };
  } else {
    form.value = {
      department: "",
      expertName: "",
      preparedBy: getCurrentUser(),
      requestedDate: today,
      priority: "medium",
      status: "draft",
      items: [],
    };
    selectedItems.value.clear();
  }

  selectedItemId.value = "";
  formErrors.value = [];
  syncSelectedItemsToForm();
};

// ================================================================
// LIFECYCLE
// ================================================================

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      initializeForm();
    }
  },
  { immediate: true }
);

onMounted(() => {
  initializeForm();
});
</script>

<style scoped>
/* ================================================================ */
/* MODAL OVERLAY */
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
  max-width: 900px;
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

/* ================================================================ */
/* MODAL HEADER */
/* ================================================================ */

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

/* ================================================================ */
/* MODAL BODY */
/* ================================================================ */

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(90vh - 130px);
}

/* ================================================================ */
/* MODAL FOOTER */
/* ================================================================ */

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

/* ================================================================ */
/* FORM ROWS */
/* ================================================================ */

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 10px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* ================================================================ */
/* ADD ITEM AREA */
/* ================================================================ */

.add-item-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
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

/* ================================================================ */
/* SELECTED ITEMS - COLLAPSIBLE FORMAT */
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
}

/* ================================================================ */
/* SELECTED ITEM - COMPACT ROW */
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
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.expand-icon {
  font-size: 10px;
  color: #94a3b8;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
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
}

.compact-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ✅ UOM Select Dropdown - Only base & conversion */
.compact-uom-select {
  padding: 4px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  cursor: pointer;
  min-width: 65px;
  height: 30px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.compact-uom-select:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.compact-qty-group {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  padding: 1px 2px;
}

.compact-qty-btn {
  background: transparent;
  border: none;
  padding: 0 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;
  border-radius: 3px;
  min-width: 24px;
  height: 28px;
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
  width: 60px;
  min-width: 45px;
  max-width: 120px;
  text-align: center;
  border: none;
  background: transparent;
  padding: 2px 6px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  font-family: inherit;
}

.compact-qty-input:focus {
  outline: none;
  background: #ffffff;
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.remove-btn-compact {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  font-size: 14px;
  transition: all 0.2s;
  border-radius: 4px;
}

.remove-btn-compact:hover {
  color: #ef4444;
  background: #fef2f2;
}

/* ================================================================ */
/* SELECTED ITEM - EXPANDED VIEW */
/* ================================================================ */

.selected-item-expanded {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 10px 14px 14px 14px;
  animation: slideDown 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

/* Row with 2 columns (Brand + Model) */
.expanded-row-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* Row with full width (Specification, Remark) */
.expanded-row-full {
  display: block;
}

.spec-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.spec-field.full-width {
  width: 100%;
}

.spec-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.spec-input,
.remark-input {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
  width: 100%;
  font-family: inherit;
}

/* ✅ Textarea for Specification - Full Row */
.spec-textarea {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
  width: 100%;
  font-family: inherit;
  resize: vertical;
  min-height: 50px;
  line-height: 1.5;
}

.spec-input:focus,
.remark-input:focus,
.spec-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
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

  .add-wrapper {
    flex-direction: column;
  }

  .btn-add-item {
    width: 100%;
    justify-content: center;
  }

  .selected-item-compact {
    flex-wrap: wrap;
  }

  .compact-right {
    flex-wrap: wrap;
    gap: 4px;
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

  .compact-qty-input {
    width: 45px;
    min-width: 35px;
    font-size: 13px;
  }

  .compact-uom-select {
    min-width: 55px;
    font-size: 10px;
  }

  .expanded-row-two {
    grid-template-columns: 1fr;
  }
}
</style>